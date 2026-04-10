"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import { updateExcuseOverride } from "@/lib/actions/admin";

export function ExcuseOverrideForm({
  eventId,
  submissionId,
  currentStatus,
}: {
  eventId: string;
  submissionId: string;
  currentStatus: "approved" | "rejected" | null;
}) {
  const router = useRouter();
  const [value, setValue] = useState(currentStatus ?? "default");
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <Select className="min-w-36" value={value} onChange={(event) => setValue(event.target.value)}>
          <option value="default">Default valid</option>
          <option value="approved">Force approve</option>
          <option value="rejected">Reject</option>
        </Select>
        <Button
          variant="secondary"
          disabled={pending}
          onClick={() => {
            setError(null);
            const formData = new FormData();
            formData.append("eventId", eventId);
            formData.append("submissionId", submissionId);
            formData.append("status", value);

            startTransition(async () => {
              try {
                await updateExcuseOverride(formData);
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
