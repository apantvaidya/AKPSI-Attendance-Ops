import { requireActiveMember, requireAdmin } from "@/lib/auth";
import { syncDefaultRoster } from "@/lib/default-roster";
import { resolveFinalStatus } from "@/lib/domain";
import { createClient } from "@/lib/supabase/server";
import type { AttendanceRecord, Event, EventMemberRow, ExcuseSubmission } from "@/lib/types";

function eventMemberKey(eventId: string, memberId: string) {
  return `${eventId}:${memberId}`;
}

function relationToSingle<T>(value: T | T[] | null | undefined) {
  if (Array.isArray(value)) {
    return value[0] ?? null;
  }

  return value ?? null;
}

export async function getMemberDashboardData() {
  const { member } = await requireActiveMember();
  const supabase = await createClient();
  const nowIso = new Date().toISOString();

  const [{ data: expectedRows }, { data: attendanceRows }, { data: excuseRows }] = await Promise.all([
    supabase
      .from("event_expected_members")
      .select(
        `
          id,
          event_id,
          member_id,
          full_name_snapshot,
          email_snapshot,
          manual_status,
          created_at,
          events (*)
        `,
      )
      .eq("member_id", member.id)
      .order("created_at", { ascending: false }),
    supabase.from("attendance_records").select("*").eq("member_id", member.id),
    supabase.from("excuse_submissions").select("*").eq("member_id", member.id),
  ]);

  const attendanceByKey = new Map(
    (attendanceRows ?? []).map((attendance) => [
      eventMemberKey(attendance.event_id, attendance.member_id),
      attendance as AttendanceRecord,
    ]),
  );
  const excusesByKey = new Map(
    (excuseRows ?? []).map((excuse) => [
      eventMemberKey(excuse.event_id, excuse.member_id),
      excuse as ExcuseSubmission,
    ]),
  );

  const rows = (expectedRows ?? []).map((row) => {
    const key = eventMemberKey(row.event_id, row.member_id);
    const attendance = attendanceByKey.get(key) ?? null;
    const excuse = excusesByKey.get(key) ?? null;
    const event = relationToSingle(row.events as Event | Event[] | null);

    if (!event) {
      return null;
    }

    return {
      event,
      expected: row,
      attendance,
      excuse,
      finalStatus: resolveFinalStatus({
        attendance,
        excuse,
        expected: row,
      }),
    };
  });

  const safeRows = rows.filter((row): row is NonNullable<(typeof rows)[number]> => row !== null);

  const openEvents = safeRows.filter(
    ({ event, attendance }) =>
      event.checkin_open_at <= nowIso && event.checkin_close_at >= nowIso && !attendance,
  );

  const upcomingEvents = safeRows.filter(({ event }) => event.checkin_open_at > nowIso);

  return {
    member,
    openEvents,
    upcomingEvents,
    allEvents: safeRows,
  };
}

export async function getAdminDashboardData() {
  await requireAdmin();
  await syncDefaultRoster();
  const supabase = await createClient();
  const nowIso = new Date().toISOString();

  const [{ data: events }, { count: activeMemberCount }, { count: pendingReviewCount }] =
    await Promise.all([
      supabase.from("events").select("*").order("checkin_open_at", { ascending: true }),
      supabase.from("members").select("id", { count: "exact", head: true }).eq("is_active", true),
      supabase
        .from("excuse_submissions")
        .select("id", { count: "exact", head: true })
        .is("reviewed_at", null),
    ]);

  const upcomingEvents =
    events?.filter((event) => event.checkin_open_at > nowIso).slice(0, 6) ?? [];
  const activeEvents =
    events?.filter(
      (event) => event.checkin_open_at <= nowIso && event.checkin_close_at >= nowIso,
    ) ?? [];

  const activeEventIds = activeEvents.map((event) => event.id);
  const [{ data: activeExpected }, { data: activeAttendance }, { data: activeExcuses }] =
    activeEventIds.length > 0
      ? await Promise.all([
          supabase
            .from("event_expected_members")
            .select("event_id, member_id, manual_status")
            .in("event_id", activeEventIds),
          supabase.from("attendance_records").select("*").in("event_id", activeEventIds),
          supabase.from("excuse_submissions").select("*").in("event_id", activeEventIds),
        ])
      : [{ data: [] }, { data: [] }, { data: [] }];

  const activeAttendanceByKey = new Map(
    (activeAttendance ?? []).map((attendance) => [
      eventMemberKey(attendance.event_id, attendance.member_id),
      attendance as AttendanceRecord,
    ]),
  );
  const activeExcusesByKey = new Map(
    (activeExcuses ?? []).map((excuse) => [
      eventMemberKey(excuse.event_id, excuse.member_id),
      excuse as ExcuseSubmission,
    ]),
  );

  const activeSummaries = activeEvents.map((event) => {
    const rows = (activeExpected ?? []).filter((row) => row.event_id === event.id);
    const counts = rows.reduce(
      (acc, row) => {
        const key = eventMemberKey(row.event_id, row.member_id);
        const status = resolveFinalStatus({
          attendance: activeAttendanceByKey.get(key) ?? null,
          excuse: activeExcusesByKey.get(key) ?? null,
          expected: {
            ...row,
            full_name_snapshot: "",
            email_snapshot: "",
            created_at: "",
            id: "",
            member_id: "",
          },
        });

        acc[status] += 1;
        return acc;
      },
      {
        present: 0,
        excused: 0,
        absent_unexcused: 0,
      },
    );

    return { event, counts };
  });

  return {
    upcomingEvents,
    activeEvents,
    activeSummaries,
    activeMemberCount: activeMemberCount ?? 0,
    pendingReviewCount: pendingReviewCount ?? 0,
  };
}

export async function getAdminEventDetail(eventId: string) {
  await requireAdmin();
  const supabase = await createClient();

  const { data: event } = await supabase.from("events").select("*").eq("id", eventId).single();

  const { data: rows } = await supabase
    .from("event_expected_members")
    .select(
      `
        id,
        event_id,
        member_id,
        full_name_snapshot,
        email_snapshot,
        manual_status,
        created_at,
        members!inner(id, full_name, email)
      `,
    )
    .eq("event_id", eventId)
    .order("full_name_snapshot", { ascending: true });

  const [{ data: attendanceRows }, { data: excuseRows }] = await Promise.all([
    supabase.from("attendance_records").select("*").eq("event_id", eventId),
    supabase.from("excuse_submissions").select("*").eq("event_id", eventId),
  ]);

  const attendanceByKey = new Map(
    (attendanceRows ?? []).map((attendance) => [
      eventMemberKey(attendance.event_id, attendance.member_id),
      attendance as AttendanceRecord,
    ]),
  );
  const excusesByKey = new Map(
    (excuseRows ?? []).map((excuse) => [
      eventMemberKey(excuse.event_id, excuse.member_id),
      excuse as ExcuseSubmission,
    ]),
  );

  const memberRows: EventMemberRow[] = (rows ?? []).map((row) => {
    const key = eventMemberKey(row.event_id, row.member_id);
    const attendance = attendanceByKey.get(key) ?? null;
    const excuse = excusesByKey.get(key) ?? null;
    const member = relationToSingle(
      row.members as EventMemberRow["member"] | EventMemberRow["member"][] | null,
    );

    if (!member) {
      return null;
    }

    return {
      member,
      expected: {
        id: row.id,
        event_id: row.event_id,
        member_id: row.member_id,
        full_name_snapshot: row.full_name_snapshot,
        email_snapshot: row.email_snapshot,
        manual_status: row.manual_status,
        created_at: row.created_at,
      },
      attendance,
      excuse,
      finalStatus: resolveFinalStatus({
        attendance,
        excuse,
        expected: row,
      }),
    };
  }).filter((row): row is EventMemberRow => row !== null);

  const summary = memberRows.reduce(
    (acc, row) => {
      acc[row.finalStatus] += 1;
      return acc;
    },
    { present: 0, excused: 0, absent_unexcused: 0 },
  );

  return { event, memberRows, summary };
}
