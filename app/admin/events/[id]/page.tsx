import Link from "next/link";
import { notFound } from "next/navigation";

import { ExcuseOverrideForm } from "@/components/admin/excuse-override-form";
import { FineDraftTrigger } from "@/components/admin/fine-draft-trigger";
import { ManualStatusForm } from "@/components/admin/manual-status-form";
import { StatusBadge } from "@/components/status-badge";
import { Card } from "@/components/ui/card";
import { getAdminEventDetail } from "@/lib/data";
import { formatCurrency } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function AdminEventDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const { event, memberRows, summary } = await getAdminEventDetail(id);

  if (!event) {
    notFound();
  }

  return (
    <div className="space-y-6">
      <Card>
        <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <p className="font-display text-4xl text-brand-900">{event.title}</p>
            <p className="mt-3 max-w-3xl text-sm leading-6 text-brand-700">{event.description}</p>
            <div className="mt-5 flex flex-wrap gap-2 text-xs font-semibold text-brand-700">
              <span className="rounded-full bg-brand-100 px-3 py-1">
                {new Date(event.event_date).toLocaleDateString()}
              </span>
              <span className="rounded-full bg-brand-100 px-3 py-1">
                Radius {event.radius_meters}m
              </span>
              <span className="rounded-full bg-brand-100 px-3 py-1">
                Fine {formatCurrency(event.fine_amount)}
              </span>
              <span className="rounded-full bg-brand-100 px-3 py-1">
                Check-in {new Date(event.checkin_open_at).toLocaleString()} to{" "}
                {new Date(event.checkin_close_at).toLocaleString()}
              </span>
            </div>
          </div>
          <FineDraftTrigger eventId={event.id} />
        </div>
      </Card>

      <section className="grid gap-4 md:grid-cols-3">
        <Card>
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-brand-500">Present</p>
          <p className="mt-4 font-display text-5xl text-brand-900">{summary.present}</p>
        </Card>
        <Card>
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-brand-500">Excused</p>
          <p className="mt-4 font-display text-5xl text-brand-900">{summary.excused}</p>
        </Card>
        <Card>
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-brand-500">
            Absent Unexcused
          </p>
          <p className="mt-4 font-display text-5xl text-brand-900">{summary.absent_unexcused}</p>
        </Card>
      </section>

      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead className="border-b border-brand-100 text-brand-500">
              <tr>
                <th className="pb-3 font-semibold">Member</th>
                <th className="pb-3 font-semibold">Status</th>
                <th className="pb-3 font-semibold">Check-in</th>
                <th className="pb-3 font-semibold">Excuse</th>
                <th className="pb-3 font-semibold">Manual override</th>
              </tr>
            </thead>
            <tbody>
              {memberRows.map((row) => (
                <tr key={row.expected.id} className="border-b border-brand-100 align-top">
                  <td className="py-4">
                    <p className="font-medium text-brand-900">{row.member.full_name}</p>
                    <p className="mt-1 text-brand-700">{row.member.email}</p>
                  </td>
                  <td className="py-4">
                    <StatusBadge status={row.finalStatus} />
                  </td>
                  <td className="py-4 text-brand-700">
                    {row.attendance ? (
                      <div className="space-y-1">
                        <p>{new Date(row.attendance.checked_in_at).toLocaleString()}</p>
                        <p>Distance {Math.round(row.attendance.distance_from_center_meters)}m</p>
                        <p>Accuracy {Math.round(row.attendance.gps_accuracy_meters ?? 0)}m</p>
                      </div>
                    ) : (
                      <span className="text-brand-500">No check-in</span>
                    )}
                  </td>
                  <td className="py-4 text-brand-700">
                    {row.excuse ? (
                      <div className="space-y-3">
                        <p className="max-w-sm whitespace-pre-wrap">{row.excuse.reason}</p>
                        {row.excuse.proof_image_url ? (
                          <Link
                            href={row.excuse.proof_image_url}
                            target="_blank"
                            className="inline-flex items-center gap-2 text-brand-800 underline"
                          >
                            View proof
                          </Link>
                        ) : null}
                        <ExcuseOverrideForm
                          eventId={event.id}
                          submissionId={row.excuse.id}
                          currentStatus={row.excuse.admin_override_status}
                        />
                      </div>
                    ) : (
                      <span className="text-brand-500">No excuse</span>
                    )}
                  </td>
                  <td className="py-4">
                    <ManualStatusForm
                      eventId={event.id}
                      expectedId={row.expected.id}
                      currentStatus={row.expected.manual_status}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      <Card>
        <p className="font-display text-3xl text-brand-900">Event pin reference</p>
        <p className="mt-2 text-sm text-brand-700">
          Center point: {event.center_lat}, {event.center_lng}
        </p>
      </Card>
    </div>
  );
}
