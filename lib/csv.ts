import Papa from "papaparse";
import { z } from "zod";

const rowSchema = z.object({
  full_name: z.string().min(1),
  email: z.string().email(),
  phone_number: z.string().optional(),
});

export type ParsedRosterRow = z.infer<typeof rowSchema>;

export function parseRosterCsv(contents: string) {
  const parsed = Papa.parse<Record<string, string>>(contents, {
    header: true,
    skipEmptyLines: true,
    transformHeader: (header) =>
      header.trim().toLowerCase().replace(/\s+/g, "_"),
  });

  if (parsed.errors.length > 0) {
    return {
      data: [] as ParsedRosterRow[],
      errors: parsed.errors.map((error) => error.message),
    };
  }

  const rows: ParsedRosterRow[] = [];
  const errors: string[] = [];
  const seenEmails = new Set<string>();

  parsed.data.forEach((rawRow, index) => {
    const normalized = {
      full_name: rawRow.full_name?.trim() ?? rawRow.name?.trim() ?? "",
      email: rawRow.email?.trim().toLowerCase() ?? "",
      phone_number: rawRow.phone_number?.trim() ?? rawRow.phone?.trim() ?? "",
    };

    const result = rowSchema.safeParse(normalized);
    if (!result.success) {
      errors.push(`Row ${index + 2}: missing or malformed full_name/email.`);
      return;
    }

    if (seenEmails.has(result.data.email)) {
      errors.push(`Row ${index + 2}: duplicate email ${result.data.email}.`);
      return;
    }

    seenEmails.add(result.data.email);
    rows.push(result.data);
  });

  return { data: rows, errors };
}
