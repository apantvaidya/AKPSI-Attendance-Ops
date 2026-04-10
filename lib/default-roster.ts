import { readFile } from "node:fs/promises";
import path from "node:path";

import { parseRosterCsv } from "@/lib/csv";
import { createAdminClient } from "@/lib/supabase/admin";

const DEFAULT_ROSTER_FILENAME = "actives.csv";

export async function loadDefaultRoster() {
  const filePath = path.join(process.cwd(), DEFAULT_ROSTER_FILENAME);
  const contents = await readFile(filePath, "utf8");
  const { data, errors } = parseRosterCsv(contents);

  if (data.length === 0) {
    throw new Error(
      `Default roster did not produce any valid members from ${DEFAULT_ROSTER_FILENAME}.`,
    );
  }

  if (errors.length > 0) {
    console.warn(`Default roster warnings: ${errors.join(" ")}`);
  }

  return {
    filePath,
    members: data,
    warnings: errors,
  };
}

export async function syncDefaultRoster() {
  const { filePath, members, warnings } = await loadDefaultRoster();
  const adminClient = createAdminClient();

  const { error: deactivateError } = await adminClient
    .from("members")
    .update({ is_active: false })
    .neq("id", "00000000-0000-0000-0000-000000000000");

  if (deactivateError) {
    throw new Error(deactivateError.message);
  }

  if (members.length > 0) {
    const { error: upsertError } = await adminClient.from("members").upsert(
      members.map((member) => ({
        full_name: member.full_name,
        email: member.email.toLowerCase(),
        is_active: true,
      })),
      {
        onConflict: "email",
      },
    );

    if (upsertError) {
      throw new Error(upsertError.message);
    }
  }

  return {
    filePath,
    count: members.length,
    warnings,
  };
}
