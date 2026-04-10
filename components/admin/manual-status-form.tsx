"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import { updateManualStatus } from "@/lib/actions/admin";
import type { AttendanceStatus } from "@/lib/types";

export function ManualStatusForm({
  eventId,
  expectedId,
  currentStatus,
}: {
  eventId: string;
  expectedId: string;
  currentStatus: AttendanceStatus | null;
}) {
  const router = useRouter();
  const [value, setValue] = useState(currentStatus ?? "inherit");
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <Select value={value} onChange={(event) => setValue(event.target.value)} className="min-w-44">
        <option value="inherit">Inherit logic</option>
        <option value="present">Present</option>
        <option value="excused">Excused</option>
        <option value="absent_unexcused">Absent Unexcused</option>
        </Select>
        <Button
          variant="secondary"
          disabled={pending}
          onClick={() => {
            setError(null);
            const formData = new FormData();
            formData.append("eventId", eventId);
            formData.append("expectedId", expectedId);
            formData.append("manualStatus", value);

            startTransition(async () => {
              try {
                await updateManualStatus(formData);
                router.refresh();
              } catch (actionError) {
                setError(actionError instanceof Error ? actionError.message : "Save failed.");
              }
            });
          }}
        >
          {pending ? "Saving..." : "Save"}
        </Button>
      </div>
      {error ? <p className="text-xs text-danger">{error}</p> : null}
    </div>
  );
}
