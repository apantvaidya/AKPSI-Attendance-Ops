import type { ReactNode } from "react";
import { LogOut } from "lucide-react";

import { signOut } from "@/lib/actions/auth";

export function AppShell({
  title,
  subtitle,
  nav,
  children,
}: {
  title: string;
  subtitle: string;
  nav?: ReactNode;
  children: ReactNode;
}) {
  return (
    <div className="min-h-screen">
      <header className="border-b border-brand-100 bg-white/70 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-6 py-5">
          <div>
            <p className="font-display text-3xl text-brand-900">{title}</p>
            <p className="text-sm text-brand-700">{subtitle}</p>
          </div>
          <div className="flex items-center gap-2">
            {nav}
            <form action={signOut}>
              <button className="inline-flex items-center gap-2 rounded-xl border border-brand-200 px-4 py-2 text-sm font-semibold text-ink transition hover:bg-brand-50">
                <LogOut className="h-4 w-4" />
                Sign out
              </button>
            </form>
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-7xl px-6 py-8">{children}</main>
    </div>
  );
}
