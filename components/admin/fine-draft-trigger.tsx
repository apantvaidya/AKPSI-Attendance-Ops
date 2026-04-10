"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { generateFineDrafts } from "@/lib/actions/admin";

export function FineDraftTrigger({ eventId }: { eventId: string }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  return (
    <div className="space-y-2">
      <Button
        disabled={pending}
        onClick={() => {
          setMessage(null);
          setError(null);
          const formData = new FormData();
          formData.append("eventId", eventId);

          startTransition(async () => {
            try {
              await generateFineDrafts(formData);
              setMessage("Draft fine messages generated.");
              router.refresh();
            } catch (actionError) {
              setError(actionError instanceof Error ? actionError.message : "Generation failed.");
            }
          });
        }}
      >
        {pending ? "Generating..." : "Generate draft fines"}
      </Button>
      {message ? <p className="text-sm text-success">{message}</p> : null}
      {error ? <p className="text-sm text-danger">{error}</p> : null}
    </div>
  );
}
