"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";

import { requireAdmin } from "@/lib/auth";
import { syncDefaultRoster } from "@/lib/default-roster";
import { formatCurrency } from "@/lib/utils";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

function normalizeLocalDateTime(value: string) {
  const parsed = new Date(value);

  if (Number.isNaN(parsed.getTime())) {
    throw new Error("A date/time value is invalid.");
  }

  return parsed.toISOString();
}

const eventSchema = z.object({
  title: z.string().min(3).max(120),
  description: z.string().max(1000).optional(),
  eventDate: z.string().min(1),
  startTime: z.string().min(1),
  endTime: z.string().min(1),
  centerLat: z.coerce.number(),
  centerLng: z.coerce.number(),
  radiusMeters: z.coerce.number().min(10).max(1000),
  checkinOpenAt: z.string().min(1),
  checkinCloseAt: z.string().min(1),
  excuseCloseAt: z.string().min(1),
  fineAmount: z.coerce.number().min(0),
});

export async function createEvent(formData: FormData) {
  const { admin } = await requireAdmin();
  await syncDefaultRoster();
  const values = eventSchema.parse({
    title: formData.get("title"),
    description: formData.get("description") || undefined,
    eventDate: formData.get("eventDate"),
    startTime: formData.get("startTime"),
    endTime: formData.get("endTime"),
    centerLat: formData.get("centerLat"),
    centerLng: formData.get("centerLng"),
    radiusMeters: formData.get("radiusMeters"),
    checkinOpenAt: formData.get("checkinOpenAt"),
    checkinCloseAt: formData.get("checkinCloseAt"),
    excuseCloseAt: formData.get("excuseCloseAt"),
    fineAmount: formData.get("fineAmount"),
  });

  const checkinOpenAt = normalizeLocalDateTime(values.checkinOpenAt);
  const checkinCloseAt = normalizeLocalDateTime(values.checkinCloseAt);
  const excuseCloseAt = normalizeLocalDateTime(values.excuseCloseAt);

  if (new Date(checkinOpenAt) >= new Date(checkinCloseAt)) {
    throw new Error("Check-in open time must be before check-in close time.");
  }

  const adminClient = createAdminClient();
  const { data: event, error: eventError } = await adminClient
    .from("events")
    .insert({
      title: values.title,
      description: values.description || null,
      event_date: values.eventDate,
      start_time: values.startTime,
      end_time: values.endTime,
      center_lat: values.centerLat,
      center_lng: values.centerLng,
      radius_meters: values.radiusMeters,
      checkin_open_at: checkinOpenAt,
      checkin_close_at: checkinCloseAt,
      excuse_close_at: excuseCloseAt,
      fine_amount: values.fineAmount,
      created_by: admin.id,
    })
    .select("id")
    .single();

  if (eventError || !event) {
    throw new Error(eventError?.message ?? "Failed to create event.");
  }

  const { data: activeMembers, error: membersError } = await adminClient
    .from("members")
    .select("id, full_name, email")
    .eq("is_active", true);

  if (membersError) {
    throw new Error(membersError.message);
  }

  if ((activeMembers ?? []).length > 0) {
    const { error: expectedError } = await adminClient.from("event_expected_members").insert(
      activeMembers.map((member) => ({
        event_id: event.id,
        member_id: member.id,
        full_name_snapshot: member.full_name,
        email_snapshot: member.email,
      })),
    );

    if (expectedError) {
      throw new Error(expectedError.message);
    }
  }

  revalidatePath("/admin");
  redirect(`/admin/events/${event.id}`);
}

export async function updateManualStatus(formData: FormData) {
  await requireAdmin();
  const expectedId = z.string().uuid().parse(formData.get("expectedId"));
  const status = z.enum(["inherit", "present", "excused", "absent_unexcused"]).parse(
    formData.get("manualStatus"),
  );
  const eventId = z.string().uuid().parse(formData.get("eventId"));

  const adminClient = createAdminClient();
  const { error } = await adminClient
    .from("event_expected_members")
    .update({
      manual_status: status === "inherit" ? null : status,
    })
    .eq("id", expectedId);

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath(`/admin/events/${eventId}`);
}

export async function updateExcuseOverride(formData: FormData) {
  const { admin } = await requireAdmin();
  const submissionId = z.string().uuid().parse(formData.get("submissionId"));
  const eventId = z.string().uuid().parse(formData.get("eventId"));
  const status = z.enum(["approved", "rejected", "default"]).parse(formData.get("status"));

  const adminClient = createAdminClient();
  const { error } = await adminClient
    .from("excuse_submissions")
    .update({
      admin_override_status: status === "default" ? null : status,
      reviewed_by: admin.id,
      reviewed_at: new Date().toISOString(),
    })
    .eq("id", submissionId);

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath(`/admin/events/${eventId}`);
}

export async function generateFineDrafts(formData: FormData) {
  await requireAdmin();
  const eventId = z.string().uuid().parse(formData.get("eventId"));
  const supabase = await createClient();
  const adminClient = createAdminClient();

  const [{ data: event }, { data: rows }] = await Promise.all([
    supabase.from("events").select("*").eq("id", eventId).single(),
    supabase
      .from("event_expected_members")
      .select("id, event_id, member_id, manual_status")
      .eq("event_id", eventId),
  ]);

  if (!event) {
    throw new Error("Event not found.");
  }

  const [{ data: attendanceRows }, { data: excuseRows }] = await Promise.all([
    supabase.from("attendance_records").select("event_id, member_id, status").eq("event_id", eventId),
    supabase
      .from("excuse_submissions")
      .select("event_id, member_id, default_valid, admin_override_status")
      .eq("event_id", eventId),
  ]);

  const attendanceByKey = new Map(
    (attendanceRows ?? []).map((row) => [`${row.event_id}:${row.member_id}`, row]),
  );
  const excuseByKey = new Map(
    (excuseRows ?? []).map((row) => [`${row.event_id}:${row.member_id}`, row]),
  );

  const drafts = (rows ?? []).flatMap((row) => {
      const attendanceStatus = attendanceByKey.get(`${row.event_id}:${row.member_id}`)?.status;
      const excuse = excuseByKey.get(`${row.event_id}:${row.member_id}`);
      const override = excuse?.admin_override_status;
      const defaultValid = excuse?.default_valid ?? false;

      const finalStatus =
        row.manual_status ??
        (attendanceStatus === "present"
          ? "present"
          : override === "approved" || (!override && defaultValid)
            ? "excused"
            : "absent_unexcused");

      if (finalStatus !== "absent_unexcused") {
        return [];
      }

      return [{
        event_id: eventId,
        member_id: row.member_id,
        amount: event.fine_amount,
        message_body: `You were marked absent and unexcused for ${event.title} on ${event.event_date}. A ${formatCurrency(event.fine_amount)} fine has been applied. Contact the attendance chair if you believe this is an error.`,
        status: "draft",
      }];
    });

  if (drafts.length > 0) {
    const { error } = await adminClient.from("fine_drafts").upsert(drafts, {
      onConflict: "event_id,member_id",
    });

    if (error) {
      throw new Error(error.message);
    }
  }

  revalidatePath(`/admin/events/${eventId}`);
}
