import type { AttendanceStatus } from "@/lib/types";
import { cn } from "@/lib/utils";

const labels: Record<AttendanceStatus, string> = {
  present: "Present",
  excused: "Excused",
  absent_unexcused: "Absent Unexcused",
};

const styles: Record<AttendanceStatus, string> = {
  present: "bg-green-100 text-success",
  excused: "bg-amber-100 text-warning",
  absent_unexcused: "bg-rose-100 text-danger",
};

export function StatusBadge({ status }: { status: AttendanceStatus }) {
  return (
    <span
      className={cn(
        "inline-flex rounded-full px-3 py-1 text-xs font-semibold tracking-wide",
        styles[status],
      )}
    >
      {labels[status]}
    </span>
  );
}
