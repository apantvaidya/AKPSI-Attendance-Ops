"use client";

import { useState, useTransition } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { signInWithDevBypass } from "@/lib/actions/auth";

export function DevBypassForm() {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  return (
    <div className="mt-8 rounded-2xl border border-amber-200 bg-amber-50 p-4">
      <p className="text-sm font-semibold uppercase tracking-[0.2em] text-amber-700">
        Local dev bypass
      </p>
      <p className="mt-2 text-sm leading-6 text-amber-900">
        This bypass sets a local cookie and skips magic-link email delivery. Enable it only for
        local development.
      </p>

      <form
        className="mt-4 space-y-3"
        onSubmit={(event) => {
          event.preventDefault();
          setError(null);
          const formData = new FormData(event.currentTarget);

          startTransition(async () => {
            try {
              await signInWithDevBypass(formData);
            } catch (actionError) {
              setError(actionError instanceof Error ? actionError.message : "Bypass sign-in failed.");
            }
          });
        }}
      >
        <Input name="email" type="email" placeholder="anpantva@ucsc.edu" required />
        <Button className="w-full" variant="secondary" type="submit" disabled={pending}>
          {pending ? "Signing in..." : "Sign in locally"}
        </Button>
        {error ? <p className="text-sm text-danger">{error}</p> : null}
      </form>
    </div>
  );
}
