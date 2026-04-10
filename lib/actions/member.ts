"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { requireActiveMember } from "@/lib/auth";
import { haversineDistanceMeters } from "@/lib/geo";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

const checkInSchema = z.object({
  eventId: z.string().uuid(),
  latitude: z.coerce.number(),
  longitude: z.coerce.number(),
  accuracy: z.coerce.number().min(0).optional(),
});

export async function submitCheckIn(formData: FormData) {
  const { member } = await requireActiveMember();
  const values = checkInSchema.parse({
    eventId: formData.get("eventId"),
    latitude: formData.get("latitude"),
    longitude: formData.get("longitude"),
    accuracy: formData.get("accuracy") ?? undefined,
  });

  const supabase = await createClient();
  const now = new Date();

  const [{ data: event }, { data: existing }, { data: expected }] = await Promise.all([
    supabase.from("events").select("*").eq("id", values.eventId).single(),
    supabase
      .from("attendance_records")
      .select("id")
      .eq("event_id", values.eventId)
      .eq("member_id", member.id)
      .maybeSingle(),
    supabase
      .from("event_expected_members")
      .select("id")
      .eq("event_id", values.eventId)
      .eq("member_id", member.id)
      .maybeSingle(),
  ]);

  if (!event || !expected) {
    throw new Error("This event is not available for your account.");
  }

  if (existing) {
    throw new Error("You already checked in for this event.");
  }

  if (now < new Date(event.checkin_open_at) || now > new Date(event.checkin_close_at)) {
    throw new Error("The check-in window for this event is closed.");
  }

  const distance = haversineDistanceMeters(
    values.latitude,
    values.longitude,
    event.center_lat,
    event.center_lng,
  );

  if (distance > event.radius_meters) {
    throw new Error(
      `You appear to be ${Math.round(distance)} meters away. Enable location services and try again from the event location.`,
    );
  }

  const { error } = await supabase.from("attendance_records").insert({
    event_id: values.eventId,
    member_id: member.id,
    checked_in_at: now.toISOString(),
    user_lat: values.latitude,
    user_lng: values.longitude,
    gps_accuracy_meters: values.accuracy ?? null,
    distance_from_center_meters: distance,
    status: "present",
  });

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath("/member");
  revalidatePath(`/admin/events/${values.eventId}`);
}

export async function submitExcuse(formData: FormData) {
  const { member } = await requireActiveMember();
  const eventId = z.string().uuid().parse(formData.get("eventId"));
  const fullName = z.string().min(1).parse(formData.get("fullName"));
  const reason = z.string().min(10).max(5000).parse(formData.get("reason"));
  const proofFile = formData.get("proof") as File | null;
  const supabase = await createClient();

  const [{ data: event }, { data: existing }] = await Promise.all([
    supabase.from("events").select("id, title, excuse_close_at").eq("id", eventId).single(),
    supabase
      .from("excuse_submissions")
      .select("id")
      .eq("event_id", eventId)
      .eq("member_id", member.id)
      .maybeSingle(),
  ]);

  if (!event) {
    throw new Error("Event not found.");
  }

  if (new Date() > new Date(event.excuse_close_at)) {
    throw new Error("The excuse deadline for this event has passed.");
  }

  if (existing) {
    throw new Error("You already submitted an excuse for this event.");
  }

  let proofUrl: string | null = null;
  if (proofFile && proofFile.size > 0) {
    const adminClient = createAdminClient();
    const filePath = `${eventId}/${member.id}-${Date.now()}-${proofFile.name}`;
    const buffer = Buffer.from(await proofFile.arrayBuffer());
    const { error: uploadError } = await adminClient.storage
      .from("excuse-proofs")
      .upload(filePath, buffer, {
        contentType: proofFile.type || "application/octet-stream",
        upsert: false,
      });

    if (uploadError) {
      throw new Error(uploadError.message);
    }

    const {
      data: { publicUrl },
    } = adminClient.storage.from("excuse-proofs").getPublicUrl(filePath);
    proofUrl = publicUrl;
  }

  const { error } = await supabase.from("excuse_submissions").insert({
    event_id: eventId,
    member_id: member.id,
    full_name_snapshot: fullName,
    reason,
    proof_image_url: proofUrl,
  });

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath("/member");
  revalidatePath(`/admin/events/${eventId}`);
}
