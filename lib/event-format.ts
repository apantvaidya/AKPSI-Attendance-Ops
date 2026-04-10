import { format } from "date-fns";

import type { Event } from "@/lib/types";

export function formatEventDateLabel(event: Pick<Event, "event_date" | "start_time" | "end_time">) {
  return `${format(new Date(event.event_date), "EEE, MMM d")} • ${event.start_time} - ${event.end_time}`;
}
