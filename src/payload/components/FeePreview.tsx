"use client";

import { useCallback, useEffect, useState } from "react";
import { useDocumentInfo } from "@payloadcms/ui";

/* Fee preview on the Member edit screen — shows staff EXACTLY what the member
   is (or will be) charged before they approve: monthly rate × months remaining
   to the renewal month, any discount, what's been paid and what's outstanding.
   Data comes from the staff-only admin API so the maths lives in ONE place on
   the server (the same prorate() the hooks use). */

type Row = { label: string; value: string; strong?: boolean };
type Preview = { rows: Row[]; note: string };

export function FeePreview() {
  const { id } = useDocumentInfo();
  const [data, setData] = useState<Preview | null>(null);
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    setBusy(true);
    setErr("");
    try {
      const url = `/app-api/membership/admin?view=fee-preview${id ? `&id=${id}` : ""}`;
      const res = await fetch(url, { credentials: "include" });
      const json = await res.json();
      if (!json.ok) throw new Error(json.error || "Could not load the fee preview.");
      setData(json.preview);
    } catch (e) {
      setErr((e as Error).message);
    } finally {
      setBusy(false);
    }
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <div
      style={{
        border: "1px solid var(--theme-elevation-150, #e3e0d8)",
        borderRadius: 8,
        padding: "12px 14px",
        marginBottom: 12,
        background: "var(--theme-elevation-50, #faf9f6)",
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12 }}>
        <strong style={{ fontSize: 13 }}>Fee calculation</strong>
        <button
          type="button"
          onClick={load}
          disabled={busy}
          style={{
            border: "1px solid var(--theme-elevation-200, #d8d4c8)",
            background: "transparent",
            borderRadius: 6,
            padding: "3px 10px",
            fontSize: 12,
            cursor: "pointer",
          }}
        >
          {busy ? "Calculating…" : "Recalculate"}
        </button>
      </div>
      {err ? (
        <p style={{ color: "#9c2b1f", fontSize: 12, margin: "8px 0 0" }}>{err}</p>
      ) : !data ? (
        <p style={{ fontSize: 12, margin: "8px 0 0", opacity: 0.7 }}>Loading…</p>
      ) : (
        <>
          <table style={{ width: "100%", borderCollapse: "collapse", marginTop: 8, fontSize: 13 }}>
            <tbody>
              {data.rows.map((r) => (
                <tr key={r.label}>
                  <td style={{ padding: "3px 0", opacity: 0.8 }}>{r.label}</td>
                  <td style={{ padding: "3px 0", textAlign: "right", fontWeight: r.strong ? 700 : 500 }}>{r.value}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {data.note ? <p style={{ fontSize: 12, margin: "8px 0 0", opacity: 0.75 }}>{data.note}</p> : null}
        </>
      )}
    </div>
  );
}
