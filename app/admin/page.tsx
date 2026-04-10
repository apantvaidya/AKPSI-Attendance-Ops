import Link from "next/link";
import { AlertTriangle, CalendarClock, UsersRound } from "lucide-react";

import { Card } from "@/components/ui/card";
import { StatusBadge } from "@/components/status-badge";
import { getAdminDashboardData } from "@/lib/data";

export const dynamic = "force-dynamic";

export default async function AdminDashboardPage() {
  const { activeEvents, activeMemberCount, activeSummaries, pendingReviewCount, upcomingEvents } =
    await getAdminDashboardData();

  return (
    <div className="space-y-6">
      <section className="grid gap-4 md:grid-cols-3">
        <Card>
          <div className="flex items-center gap-3">
            <UsersRound className="h-5 w-5 text-brand-700" />
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-brand-500">
              Active members
            </p>
          </div>
          <p className="mt-6 font-display text-5xl text-brand-900">{activeMemberCount}</p>
        </Card>
        <Card>
          <div className="flex items-center gap-3">
            <CalendarClock className="h-5 w-5 text-brand-700" />
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-brand-500">
              Live events
            </p>
          </div>
          <p className="mt-6 font-display text-5xl text-brand-900">{activeEvents.length}</p>
        </Card>
        <Card>
          <div className="flex items-center gap-3">
            <AlertTriangle className="h-5 w-5 text-brand-700" />
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-brand-500">
              Pending review
            </p>
          </div>
          <p className="mt-6 font-display text-5xl text-brand-900">{pendingReviewCount}</p>
        </Card>
      </section>

      <section className="grid gap-6 lg:grid-cols-[1.05fr_0.95fr]">
        <Card>
          <p className="font-display text-3xl text-brand-900">Currently active events</p>
          {activeSummaries.length === 0 ? (
            <p className="mt-4 text-sm text-brand-700">No check-in windows are active right now.</p>
          ) : (
            <div className="mt-6 space-y-4">
              {activeSummaries.map(({ event, counts }) => (
                <Link
                  key={event.id}
                  href={`/admin/events/${event.id}`}
                  className="block rounded-2xl border border-brand-100 bg-brand-50 px-4 py-4 transition hover:border-brand-300"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="font-semibold text-brand-900">{event.title}</p>
                      <p className="mt-1 text-sm text-brand-700">
                        Ends {new Date(event.checkin_close_at).toLocaleString()}
                      </p>
                    </div>
                    <StatusBadge
                      status={
                        counts.absent_unexcused > 0
                          ? "absent_unexcused"
                          : counts.present > 0
                            ? "present"
                            : "excused"
                      }
                    />
                  </div>
                  <div className="mt-4 flex flex-wrap gap-2 text-xs font-semibold text-brand-700">
                    <span className="rounded-full bg-green-100 px-3 py-1">Present {counts.present}</span>
                    <span className="rounded-full bg-amber-100 px-3 py-1">Excused {counts.excused}</span>
                    <span className="rounded-full bg-rose-100 px-3 py-1">
                      Absent {counts.absent_unexcused}
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </Card>

        <Card>
          <p className="font-display text-3xl text-brand-900">Upcoming events</p>
          {upcomingEvents.length === 0 ? (
            <p className="mt-4 text-sm text-brand-700">No upcoming events scheduled yet.</p>
          ) : (
            <div className="mt-6 space-y-4">
              {upcomingEvents.map((event) => (
                <Link
                  key={event.id}
                  href={`/admin/events/${event.id}`}
                  className="block rounded-2xl border border-brand-100 px-4 py-4 transition hover:bg-brand-50"
                >
                  <p className="font-semibold text-brand-900">{event.title}</p>
                  <p className="mt-1 text-sm text-brand-700">
                    {new Date(event.event_date).toLocaleDateString()} • Check-in opens{" "}
                    {new Date(event.checkin_open_at).toLocaleString()}
                  </p>
                </Link>
              ))}
            </div>
          )}
        </Card>
      </section>
    </div>
  );
}
