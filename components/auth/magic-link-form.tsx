"use client";

import { useState, useTransition } from "react";
import { MailCheck } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { createClient } from "@/lib/supabase/client";

export function MagicLinkForm() {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  return (
    <form
      className="mt-8 space-y-4"
      onSubmit={(event) => {
        event.preventDefault();
        setMessage(null);
        setError(null);

        startTransition(async () => {
          const supabase = createClient();
          const { error: signInError } = await supabase.auth.signInWithOtp({
            email,
            options: {
              emailRedirectTo: `${window.location.origin}/auth/callback`,
            },
          });

          if (signInError) {
            setError(signInError.message);
            return;
          }

          setMessage("Check your email for the sign-in link.");
        });
      }}
    >
      <label className="block text-sm font-medium text-brand-800">
        Email
        <Input
          className="mt-2"
          type="email"
          placeholder="name@organization.edu"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          required
        />
      </label>

      <Button className="w-full" type="submit" disabled={pending}>
        {pending ? "Sending link..." : "Send magic link"}
      </Button>

      {message ? (
        <div className="flex items-center gap-2 rounded-2xl bg-green-50 px-4 py-3 text-sm text-success">
          <MailCheck className="h-4 w-4" />
          {message}
        </div>
      ) : null}

      {error ? <p className="text-sm text-danger">{error}</p> : null}
    </form>
  );
}
