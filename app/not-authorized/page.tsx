import Link from "next/link";

import { Card } from "@/components/ui/card";

export default function NotAuthorizedPage() {
  return (
    <main className="flex min-h-screen items-center justify-center px-6">
      <Card className="max-w-lg text-center">
        <p className="font-display text-4xl text-brand-900">Access blocked</p>
        <p className="mt-4 text-sm leading-6 text-brand-800">
          Your signed-in email is not on the current active roster or admin list. Contact the
          attendance chair if this is unexpected.
        </p>
        <Link
          href="/login"
          className="mt-6 inline-flex rounded-xl bg-brand-600 px-4 py-2 text-sm font-semibold text-white"
        >
          Back to sign in
        </Link>
      </Card>
    </main>
  );
}
