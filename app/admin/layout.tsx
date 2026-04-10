import type { ReactNode } from "react";
import Link from "next/link";

import { AppShell } from "@/components/app-shell";
import { requireAdmin } from "@/lib/auth";

export const dynamic = "force-dynamic";

export default async function AdminLayout({
  children,
}: Readonly<{
  children: ReactNode;
}>) {
  const { admin } = await requireAdmin();

  return (
    <AppShell
      title="Admin Console"
      subtitle={admin.email}
      nav={
        <div className="flex items-center gap-2">
          <Link
            href="/admin"
            className="rounded-xl px-4 py-2 text-sm font-semibold text-brand-800 transition hover:bg-brand-50"
          >
            Dashboard
          </Link>
          <Link
            href="/admin/roster"
            className="rounded-xl px-4 py-2 text-sm font-semibold text-brand-800 transition hover:bg-brand-50"
          >
            Roster
          </Link>
          <Link
            href="/admin/events/new"
            className="rounded-xl bg-brand-600 px-4 py-2 text-sm font-semibold text-white"
          >
            New event
          </Link>
        </div>
      }
    >
      {children}
    </AppShell>
  );
}
