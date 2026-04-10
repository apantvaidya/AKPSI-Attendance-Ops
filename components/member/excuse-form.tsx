"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { submitExcuse } from "@/lib/actions/member";
import type { Event, Member } from "@/lib/types";

export function ExcuseForm({
  member,
  events,
}: {
  member: Pick<Member, "full_name">;
  events: Event[];
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  return (
    <Card>
      <div>
        <p className="font-display text-3xl text-brand-900">Submit an excuse</p>
        <p className="mt-2 text-sm leading-6 text-brand-700">
          Excuses default to valid unless an admin overrides them later. If you also check in
          successfully, you will still be treated as present.
        </p>
      </div>

      <form
        className="mt-6 space-y-4"
        onSubmit={(event) => {
          event.preventDefault();
          setMessage(null);
          setError(null);
          const form = event.currentTarget;
          const formData = new FormData(form);

          startTransition(async () => {
            try {
              await submitExcuse(formData);
              form.reset();
              setMessage("Excuse submitted.");
              router.refresh();
            } catch (actionError) {
              setError(actionError instanceof Error ? actionError.message : "Submission failed.");
            }
          });
        }}
      >
        <label className="block text-sm font-medium text-brand-800">
          Full name
          <Input className="mt-2" name="fullName" defaultValue={member.full_name} required />
        </label>

        <label className="block text-sm font-medium text-brand-800">
          Event
          <Select className="mt-2" name="eventId" required defaultValue="">
            <option value="" disabled>
              Select an event
            </option>
            {events.map((eventOption) => (
              <option key={eventOption.id} value={eventOption.id}>
                {eventOption.title} ({new Date(eventOption.event_date).toLocaleDateString()})
              </option>
            ))}
          </Select>
        </label>

        <label className="block text-sm font-medium text-brand-800">
          Reason
          <Textarea
            className="mt-2"
            name="reason"
            placeholder="Provide enough detail for the attendance chair to understand the absence."
            required
          />
        </label>

        <label className="block text-sm font-medium text-brand-800">
          Proof image (optional)
          <Input className="mt-2" type="file" name="proof" accept="image/*" />
        </label>

        <Button className="w-full" type="submit" disabled={pending}>
          {pending ? "Submitting..." : "Submit excuse"}
        </Button>

        {message ? <p className="text-sm text-success">{message}</p> : null}
        {error ? <p className="text-sm text-danger">{error}</p> : null}
      </form>
    </Card>
  );
}
