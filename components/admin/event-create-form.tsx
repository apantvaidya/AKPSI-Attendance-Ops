"use client";

import dynamic from "next/dynamic";
import { useState, useTransition } from "react";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { createEvent } from "@/lib/actions/admin";

const LocationPicker = dynamic(
  () => import("@/components/admin/location-picker").then((mod) => mod.LocationPicker),
  {
    ssr: false,
  },
);

export function EventCreateForm() {
  const [coords, setCoords] = useState({ lat: 32.8801, lng: -117.234 });
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  return (
    <Card>
      <p className="font-display text-3xl text-brand-900">Create event</p>
      <p className="mt-2 text-sm leading-6 text-brand-700">
        Each new event snapshots the currently active roster into expected members, so attendance
        obligations stay stable even if the roster changes later.
      </p>

      <form
        className="mt-6 grid gap-4"
        onSubmit={(event) => {
          event.preventDefault();
          setError(null);
          const formData = new FormData(event.currentTarget);
          formData.set("centerLat", String(coords.lat));
          formData.set("centerLng", String(coords.lng));

          startTransition(async () => {
            try {
              await createEvent(formData);
            } catch (actionError) {
              setError(actionError instanceof Error ? actionError.message : "Event creation failed.");
            }
          });
        }}
      >
        <div className="grid gap-4 md:grid-cols-2">
          <label className="block text-sm font-medium text-brand-800">
            Event title
            <Input className="mt-2" name="title" required />
          </label>
          <label className="block text-sm font-medium text-brand-800">
            Fine amount
            <Input className="mt-2" type="number" name="fineAmount" defaultValue="5" min="0" step="0.01" required />
          </label>
        </div>

        <label className="block text-sm font-medium text-brand-800">
          Description (optional)
          <Textarea className="mt-2 min-h-24" name="description" />
        </label>

        <div className="grid gap-4 md:grid-cols-3">
          <label className="block text-sm font-medium text-brand-800">
            Event date
            <Input className="mt-2" type="date" name="eventDate" required />
          </label>
          <label className="block text-sm font-medium text-brand-800">
            Start time
            <Input className="mt-2" type="time" name="startTime" required />
          </label>
          <label className="block text-sm font-medium text-brand-800">
            End time
            <Input className="mt-2" type="time" name="endTime" required />
          </label>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <label className="block text-sm font-medium text-brand-800">
            Check-in opens
            <Input className="mt-2" type="datetime-local" name="checkinOpenAt" required />
          </label>
          <label className="block text-sm font-medium text-brand-800">
            Check-in closes
            <Input className="mt-2" type="datetime-local" name="checkinCloseAt" required />
          </label>
          <label className="block text-sm font-medium text-brand-800">
            Excuse deadline
            <Input className="mt-2" type="datetime-local" name="excuseCloseAt" required />
          </label>
        </div>

        <label className="block text-sm font-medium text-brand-800">
          Attendance radius (meters)
          <Input className="mt-2" type="number" name="radiusMeters" defaultValue="100" min="10" max="1000" required />
        </label>

        <input type="hidden" name="centerLat" value={coords.lat} />
        <input type="hidden" name="centerLng" value={coords.lng} />

        <LocationPicker onChange={setCoords} />

        <Button className="w-full" type="submit" disabled={pending}>
          {pending ? "Creating event..." : "Create event"}
        </Button>

        {error ? <p className="text-sm text-danger">{error}</p> : null}
      </form>
    </Card>
  );
}
