import { getPayloadClient } from "@/lib/payloadClient";

/* Staff-only CSV export of form submissions. Authenticates with the Payload admin
   session cookie, then streams a CSV of every submission (optionally for one form
   via ?form=<id>). Satisfies the "export to CSV" requirement without a fragile
   extra plugin. */

export const dynamic = "force-dynamic";

function csvCell(value: unknown): string {
  const s = value == null ? "" : String(value);
  // Escape per RFC 4180 and neutralise spreadsheet formula injection.
  const safe = /^[=+\-@]/.test(s) ? "'" + s : s;
  return `"${safe.replace(/"/g, '""')}"`;
}

export async function GET(req: Request) {
  const payload = await getPayloadClient();

  // Authenticate via the admin session cookie; any signed-in staff may export.
  let user: unknown = null;
  try {
    const res = await payload.auth({ headers: req.headers as unknown as Headers });
    user = (res as { user?: unknown }).user ?? null;
  } catch {
    user = null;
  }
  if (!user) {
    return new Response("Unauthorized", { status: 401 });
  }

  const url = new URL(req.url);
  const formId = url.searchParams.get("form");

  const result = await payload.find({
    collection: "form-submissions" as never,
    where: (formId ? { form: { equals: formId } } : {}) as never,
    limit: 10000,
    depth: 0,
    sort: "-createdAt",
    overrideAccess: true,
  });
  const docs = result.docs as Array<Record<string, any>>;

  // Build the column set: metadata + the union of all submitted field names.
  const fieldNames: string[] = [];
  const seen = new Set<string>();
  for (const d of docs) {
    for (const row of Array.isArray(d.submissionData) ? d.submissionData : []) {
      const f = String(row?.field ?? "");
      if (f && !seen.has(f)) {
        seen.add(f);
        fieldNames.push(f);
      }
    }
  }
  const headers = ["id", "form", "createdAt", ...fieldNames];

  const lines = [headers.map(csvCell).join(",")];
  for (const d of docs) {
    const byField: Record<string, unknown> = {};
    for (const row of Array.isArray(d.submissionData) ? d.submissionData : []) {
      byField[String(row?.field ?? "")] = row?.value;
    }
    const cells = [
      d.id,
      typeof d.form === "object" ? d.form?.id : d.form,
      d.createdAt,
      ...fieldNames.map((f) => byField[f]),
    ];
    lines.push(cells.map(csvCell).join(","));
  }

  const csv = "﻿" + lines.join("\r\n"); // BOM so Excel reads UTF-8
  const stamp = new Date().toISOString().slice(0, 10);
  return new Response(csv, {
    status: 200,
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="form-submissions-${stamp}.csv"`,
      "Cache-Control": "no-store",
    },
  });
}
