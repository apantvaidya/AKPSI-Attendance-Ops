import { Card } from "@/components/ui/card";
import { requireAdmin } from "@/lib/auth";
import { loadDefaultRoster, syncDefaultRoster } from "@/lib/default-roster";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function AdminRosterPage() {
  await requireAdmin();
  const [, { members: sourceMembers }] = await Promise.all([
    syncDefaultRoster(),
    loadDefaultRoster(),
  ]);
  const supabase = await createClient();
  const { data: members } = await supabase
    .from("members")
    .select("id, email, is_active")
    .order("email", { ascending: true });

  const statusByEmail = new Map((members ?? []).map((member) => [member.email, member.is_active]));

  return (
    <Card>
      <p className="font-display text-3xl text-brand-900">Active members</p>
      <div className="mt-6 max-h-[40rem] overflow-auto rounded-2xl border border-brand-100">
        <table className="min-w-full text-left text-sm">
          <thead className="sticky top-0 bg-white text-brand-500">
            <tr>
              <th className="px-4 pb-3 pt-4 font-semibold">Member</th>
              <th className="px-4 pb-3 pt-4 font-semibold">Email</th>
              <th className="px-4 pb-3 pt-4 font-semibold">Phone number</th>
              <th className="px-4 pb-3 pt-4 font-semibold">Status</th>
            </tr>
          </thead>
          <tbody>
            {sourceMembers.map((member) => (
              <tr key={member.email} className="border-t border-brand-100">
                <td className="px-4 py-3 font-medium text-brand-900">{member.full_name}</td>
                <td className="px-4 py-3 text-brand-700">{member.email}</td>
                <td className="px-4 py-3 text-brand-700">{member.phone_number || "-"}</td>
                <td className="px-4 py-3">
                  <span
                    className={`rounded-full px-3 py-1 text-xs font-semibold ${
                      statusByEmail.get(member.email)
                        ? "bg-green-100 text-success"
                        : "bg-brand-100 text-brand-700"
                    }`}
                  >
                    {statusByEmail.get(member.email) ? "Active" : "Inactive"}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  );
}
