"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { MapPin, Timer } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { submitCheckIn } from "@/lib/actions/member";
import { formatEventDateLabel } from "@/lib/event-format";
import type { Event } from "@/lib/types";

export function CheckInCard({ event }: { event: Event }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  return (
    <Card className="flex flex-col gap-4">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="font-display text-3xl text-brand-900">{event.title}</p>
          <p className="mt-2 text-sm text-brand-700">{formatEventDateLabel(event)}</p>
        </div>
        <span className="rounded-full bg-brand-100 px-3 py-1 text-xs font-semibold text-brand-800">
          Open now
        </span>
      </div>

      <div className="grid gap-3 text-sm text-brand-700 md:grid-cols-2">
        <div className="flex items-center gap-2 rounded-2xl bg-brand-50 px-4 py-3">
          <Timer className="h-4 w-4" />
          Check-in closes at {new Date(event.checkin_close_at).toLocaleTimeString()}
        </div>
        <div className="flex items-center gap-2 rounded-2xl bg-brand-50 px-4 py-3">
          <MapPin className="h-4 w-4" />
          Within {event.radius_meters} meters of the event pin
        </div>
      </div>

      <Button
        className="w-full py-3 text-base"
        disabled={pending}
        onClick={() => {
          setMessage(null);
          setError(null);

          if (!navigator.geolocation) {
            setError("Geolocation is not available in this browser. Enable location services and try again.");
            return;
          }

          navigator.geolocation.getCurrentPosition(
            (position) => {
              startTransition(async () => {
                const formData = new FormData();
                formData.append("eventId", event.id);
                formData.append("latitude", String(position.coords.latitude));
                formData.append("longitude", String(position.coords.longitude));
                formData.append("accuracy", String(position.coords.accuracy));

                try {
                  await submitCheckIn(formData);
                  setMessage("Check-in complete. You are marked present.");
                  router.refresh();
                } catch (actionError) {
                  setError(
                    actionError instanceof Error ? actionError.message : "Check-in failed.",
                  );
                }
              });
            },
            () => {
              setError("Location permission was denied or unavailable. Enable location services and try again.");
            },
            {
              enableHighAccuracy: true,
              timeout: 15000,
              maximumAge: 0,
            },
          );
        }}
      >
        {pending ? "Checking location..." : "Check In"}
      </Button>

      {message ? <p className="text-sm text-success">{message}</p> : null}
      {error ? <p className="text-sm text-danger">{error}</p> : null}
    </Card>
  );
}
