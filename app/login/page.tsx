import { Card } from "@/components/ui/card";
import { DevBypassForm } from "@/components/auth/dev-bypass-form";
import { MagicLinkForm } from "@/components/auth/magic-link-form";
import { isDevAuthEnabled } from "@/lib/dev-auth";

export default function LoginPage() {
  const devAuthEnabled = isDevAuthEnabled();

  return (
    <main className="flex min-h-screen items-center justify-center px-6 py-10">
      <div className="grid w-full max-w-5xl gap-8 lg:grid-cols-[1.1fr_0.9fr]">
        <div className="rounded-[2rem] border border-brand-100 bg-brand-900/95 p-10 text-white shadow-panel">
          <p className="text-sm uppercase tracking-[0.25em] text-brand-200">Attendance ops</p>
          <h1 className="mt-6 font-display text-6xl leading-none">
            Reliable event attendance without the Google Form fragility.
          </h1>
          <p className="mt-6 max-w-xl text-base leading-7 text-brand-100">
            Members check in with one button. Admins control the roster, review excuses, resolve
            edge cases, and draft fines from one operational dashboard.
          </p>
        </div>
        <Card className="flex items-center">
          <div className="w-full">
            <p className="font-display text-4xl text-brand-900">Magic link sign in</p>
            <p className="mt-3 text-sm leading-6 text-brand-700">
              Use your organization email. If your email is not on the current active roster or
              admin list, member and admin actions will be blocked after sign in.
            </p>
            <MagicLinkForm />
            {devAuthEnabled ? <DevBypassForm /> : null}
          </div>
        </Card>
      </div>
    </main>
  );
}
