import { CalendarRange, ShieldAlert } from "lucide-react";

import { AppShell } from "@/components/app-shell";
import { CheckInCard } from "@/components/member/check-in-card";
import { ExcuseForm } from "@/components/member/excuse-form";
import { StatusBadge } from "@/components/status-badge";
import { Card } from "@/components/ui/card";
import { getMemberDashboardData } from "@/lib/data";

export const dynamic = "force-dynamic";

export default async function MemberDashboardPage() {
  const { member, openEvents, upcomingEvents, allEvents } = await getMemberDashboardData();
  const excuseEligibleEvents = allEvents
    .map((row) => row.event)
    .filter((event) => new Date(event.excuse_close_at) > new Date());

  return (
    <AppShell
      title="Member Dashboard"
      subtitle={`${member.full_name} • ${member.email}`}
    >
      <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
        <section className="space-y-6">
          {openEvents.length > 0 ? (
            openEvents.map(({ event }) => <CheckInCard key={event.id} event={event} />)
          ) : (
            <Card>
              <p className="font-display text-3xl text-brand-900">No active check-in window</p>
              <p className="mt-3 text-sm leading-6 text-brand-700">
                When an event check-in window opens, the one-tap check-in card will appear here.
              </p>
            </Card>
          )}

          <Card>
            <div className="flex items-center gap-3">
              <CalendarRange className="h-5 w-5 text-brand-700" />
              <p className="font-display text-3xl text-brand-900">Upcoming events</p>
            </div>

            {upcomingEvents.length === 0 ? (
              <p className="mt-4 text-sm text-brand-700">No upcoming events on your roster.</p>
            ) : (
              <div className="mt-6 space-y-4">
                {upcomingEvents.map(({ event }) => (
                  <div
                    key={event.id}
                    className="rounded-2xl border border-brand-100 bg-brand-50 px-4 py-4"
                  >
                    <p className="font-semibold text-brand-900">{event.title}</p>
                    <p className="mt-1 text-sm text-brand-700">
                      {new Date(event.event_date).toLocaleDateString()} • Check-in opens{" "}
                      {new Date(event.checkin_open_at).toLocaleString()}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </section>

        <section className="space-y-6">
          <ExcuseForm member={member} events={excuseEligibleEvents} />

          <Card>
            <div className="flex items-center gap-3">
              <ShieldAlert className="h-5 w-5 text-brand-700" />
              <p className="font-display text-3xl text-brand-900">Status snapshot</p>
            </div>
            <div className="mt-6 space-y-3">
              {allEvents.slice(0, 6).map(({ event, finalStatus, attendance, excuse }) => (
                <div
                  key={event.id}
                  className="rounded-2xl border border-brand-100 bg-white px-4 py-4"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-semibold text-brand-900">{event.title}</p>
                      <p className="mt-1 text-sm text-brand-700">
                        {new Date(event.event_date).toLocaleDateString()}
                      </p>
                    </div>
                    <StatusBadge status={finalStatus} />
                  </div>
                  <p className="mt-3 text-xs uppercase tracking-wide text-brand-500">
                    {attendance ? "Checked in" : excuse ? "Excuse on file" : "No record yet"}
                  </p>
                </div>
              ))}
            </div>
          </Card>
        </section>
      </div>
    </AppShell>
  );
}
