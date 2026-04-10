import { redirect } from "next/navigation";
import type { User } from "@supabase/supabase-js";

import { getDevAuthEmail } from "@/lib/dev-auth";
import { syncDefaultRoster } from "@/lib/default-roster";
import { createClient } from "@/lib/supabase/server";

export async function getCurrentUser() {
  const devEmail = await getDevAuthEmail();
  if (devEmail) {
    return {
      id: `dev-auth-${devEmail}`,
      email: devEmail,
      app_metadata: {},
      user_metadata: {},
      aud: "authenticated",
      created_at: new Date(0).toISOString(),
    } as User;
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user;
}

export async function requireUser() {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/login");
  }
  return user;
}

export async function requireActiveMember() {
  await syncDefaultRoster();
  const user = await requireUser();
  const supabase = await createClient();
  const { data: member } = await supabase
    .from("members")
    .select("*")
    .eq("email", user.email?.toLowerCase())
    .eq("is_active", true)
    .maybeSingle();

  if (!member) {
    redirect("/not-authorized");
  }

  return { user, member };
}

export async function requireAdmin() {
  const user = await requireUser();
  const supabase = await createClient();
  const { data: admin } = await supabase
    .from("admins")
    .select("*")
    .eq("email", user.email?.toLowerCase())
    .maybeSingle();

  if (!admin) {
    redirect("/not-authorized");
  }

  return { user, admin };
}
