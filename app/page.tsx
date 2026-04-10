import { redirect } from "next/navigation";

import { getCurrentUser } from "@/lib/auth";
import { syncDefaultRoster } from "@/lib/default-roster";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const user = await getCurrentUser();

  if (!user?.email) {
    redirect("/login");
  }

  await syncDefaultRoster();
  const supabase = await createClient();
  const [{ data: admin }, { data: member }] = await Promise.all([
    supabase.from("admins").select("id").eq("email", user.email.toLowerCase()).maybeSingle(),
    supabase
      .from("members")
      .select("id")
      .eq("email", user.email.toLowerCase())
      .eq("is_active", true)
      .maybeSingle(),
  ]);

  if (admin) {
    redirect("/admin");
  }

  if (member) {
    redirect("/member");
  }

  redirect("/not-authorized");
}
