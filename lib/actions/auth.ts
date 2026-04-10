"use server";

import { redirect } from "next/navigation";
import { z } from "zod";

import { clearDevAuthEmail, isDevAuthEnabled, setDevAuthEmail } from "@/lib/dev-auth";
import { createClient } from "@/lib/supabase/server";

export async function signOut() {
  await clearDevAuthEmail();
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}

export async function signInWithDevBypass(formData: FormData) {
  if (!isDevAuthEnabled()) {
    throw new Error("Dev auth bypass is disabled.");
  }

  const email = z.string().email().parse(formData.get("email"));
  await setDevAuthEmail(email);
  redirect("/");
}
