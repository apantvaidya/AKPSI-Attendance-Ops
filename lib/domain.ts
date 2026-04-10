import type { AttendanceStatus, EventMemberRow, ExcuseSubmission } from "@/lib/types";

export function resolveExcuseValidity(excuse: ExcuseSubmission | null) {
  if (!excuse) {
    return false;
  }

  if (excuse.admin_override_status === "rejected") {
    return false;
  }

  if (excuse.admin_override_status === "approved") {
    return true;
  }

  return excuse.default_valid;
}

export function resolveFinalStatus({
  attendance,
  excuse,
  expected,
}: Pick<EventMemberRow, "attendance" | "excuse" | "expected">): AttendanceStatus {
  if (expected.manual_status) {
    return expected.manual_status;
  }

  if (attendance?.status === "present") {
    return "present";
  }

  if (resolveExcuseValidity(excuse)) {
    return "excused";
  }

  return "absent_unexcused";
}
