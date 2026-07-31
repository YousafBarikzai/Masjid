"use client";

import { useCallback, useEffect, useState } from "react";
import { RichText } from "@payloadcms/richtext-lexical/react";

/* The members-only area shown inside the account page once a membership is
   approved: member notices, then the document library (financial accounts,
   AGM minutes, confidential papers…) grouped by CMS-managed category.

   Every document download is fetched WITH the member's token and re-checked
   on the server — the files have no public URL. */

type PortalDoc = {
  id: number | string;
  title: string;
  year: string | null;
  version: string | null;
  publishedDate: string | null;
  filename: string;
  mimeType: string;
  filesize: number;
  url: string;
};
type PortalCategory = { id: number | string; name: string; description: string; documents: PortalDoc[] };
type PortalNotice = { id: number | string; title: string; body: unknown; publishedDate: string | null; pinned: boolean };

function fmt(d?: string | null): string {
  return d ? new Date(d).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" }) : "";
}

function sizeLabel(bytes: number): string {
  if (!bytes) return "";
  if (bytes < 1024 * 1024) return `${Math.max(1, Math.round(bytes / 1024))} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default function MembersPortal({ token }: { token: string | null }) {
  const [categories, setCategories] = useState<PortalCategory[] | null>(null);
  const [notices, setNotices] = useState<PortalNotice[]>([]);
  const [err, setErr] = useState("");
  const [downloading, setDownloading] = useState<string | null>(null);

  useEffect(() => {
    fetch("/app-api/membership/portal", {
      headers: token ? { Authorization: `JWT ${token}` } : {},
    })
      .then((r) => r.json())
      .then((d) => {
        if (d?.ok) {
          setCategories(d.categories);
          setNotices(d.notices);
        } else setErr(d?.error || "The members' area could not be loaded.");
      })
      .catch(() => setErr("The members' area could not be loaded — please try again."));
  }, [token]);

  // Authenticated download: fetch with the member token, save the blob. A
  // plain link would arrive without credentials and be (correctly) refused.
  const download = useCallback(
    async (doc: PortalDoc) => {
      setDownloading(String(doc.id));
      try {
        const r = await fetch(doc.url, { headers: token ? { Authorization: `JWT ${token}` } : {} });
        if (!r.ok) throw new Error();
        const blob = await r.blob();
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = doc.filename || doc.title;
        document.body.appendChild(a);
        a.click();
        a.remove();
        setTimeout(() => URL.revokeObjectURL(url), 30_000);
      } catch {
        setErr("That download didn't work — please try again.");
      } finally {
        setDownloading(null);
      }
    },
    [token],
  );

  if (err) return <p className="ma-msg" role="alert">{err}</p>;
  if (!categories) return <p className="ma-portal__loading">Loading the members&apos; area…</p>;

  return (
    <div className="ma-portal">
      {notices.length > 0 && (
        <section aria-labelledby="ma-notices-h">
          <h3 id="ma-notices-h" className="ma-portal__h">Member notices</h3>
          <ul className="ma-notices">
            {notices.map((n) => (
              <li key={n.id} className={`ma-notice${n.pinned ? " is-pinned" : ""}`}>
                <div className="ma-notice__head">
                  {n.pinned ? <span className="ma-notice__pin" aria-label="Pinned">📌</span> : null}
                  <b>{n.title}</b>
                  {n.publishedDate ? <span className="ma-notice__date">{fmt(n.publishedDate)}</span> : null}
                </div>
                {n.body ? (
                  <div className="ma-notice__body">
                    <RichText data={n.body as never} />
                  </div>
                ) : null}
              </li>
            ))}
          </ul>
        </section>
      )}

      <section aria-labelledby="ma-docs-h">
        <h3 id="ma-docs-h" className="ma-portal__h">Members&apos; documents</h3>
        {categories.length === 0 ? (
          <p className="ma-portal__empty">No documents have been published yet — check back soon.</p>
        ) : (
          categories.map((c) => (
            <div key={c.id} className="ma-portal__cat">
              <h4>{c.name}</h4>
              {c.description ? <p className="ma-portal__catdesc">{c.description}</p> : null}
              <ul className="ma-doclist">
                {c.documents.map((doc) => (
                  <li key={doc.id}>
                    <div className="ma-doc__meta">
                      <b>{doc.title}</b>
                      <span>
                        {[doc.year, doc.version, fmt(doc.publishedDate), sizeLabel(doc.filesize)].filter(Boolean).join(" · ")}
                      </span>
                    </div>
                    <button
                      type="button"
                      className="btn btn-green ma-doc__btn"
                      onClick={() => download(doc)}
                      disabled={downloading === String(doc.id)}
                      aria-label={`Download ${doc.title}`}
                    >
                      {downloading === String(doc.id) ? "Preparing…" : "⬇ Download"}
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          ))
        )}
      </section>
    </div>
  );
}
