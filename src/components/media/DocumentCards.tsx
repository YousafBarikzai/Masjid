import { statSync } from "fs";
import path from "path";
import { getPayloadClient } from "@/lib/payloadClient";

/* The Resources document cards. Server component: published CMS documents for
   a category replace the built-in defaults (the bundled starter PDFs in
   /public/downloads), so administrators manage everything from the admin with
   no code change. Every card shows the document's title, type, year/version,
   publication date and file size, with View and Download actions sized and
   labelled for keyboard, screen-reader and touch use. */

export type DefaultDoc = { label: string; file: string; year?: string; version?: string };

type CardDoc = {
  title: string;
  url: string;
  year?: string;
  version?: string;
  date?: string;
  sizeKb?: number;
  type: string;
};

function fmtSize(kb?: number): string {
  if (!kb) return "";
  return kb >= 1024 ? `${(kb / 1024).toFixed(1)} MB` : `${Math.round(kb)} KB`;
}

function fmtDate(d?: string): string {
  return d ? new Date(d).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" }) : "";
}

async function docsFor(category: string, defaults: DefaultDoc[]): Promise<CardDoc[]> {
  // Published CMS documents win.
  try {
    const payload = await getPayloadClient();
    const res = await payload.find({
      collection: "documents" as never,
      where: { and: [{ category: { equals: category } }, { published: { equals: true } }] } as never,
      sort: "order",
      depth: 1,
      limit: 50,
      overrideAccess: true,
    });
    const docs = (res.docs as Array<Record<string, any>>)
      .filter((d) => d.file && typeof d.file === "object" && d.file.url)
      .map((d) => ({
        title: String(d.title),
        url: String(d.file.url),
        year: d.year || undefined,
        version: d.version || undefined,
        date: d.publishedDate || d.updatedAt,
        sizeKb: d.file.filesize ? d.file.filesize / 1024 : undefined,
        type: String(d.file.mimeType || "").includes("pdf") ? "PDF" : "File",
      }));
    if (docs.length) return docs;
  } catch {
    /* fall through to bundled defaults */
  }

  // Bundled defaults from /public/downloads.
  const out: CardDoc[] = [];
  for (const d of defaults) {
    try {
      const st = statSync(path.join(process.cwd(), "public", "downloads", d.file));
      out.push({
        title: d.label,
        url: `/downloads/${d.file}`,
        year: d.year,
        version: d.version,
        date: st.mtime.toISOString(),
        sizeKb: st.size / 1024,
        type: "PDF",
      });
    } catch {
      /* file missing — never render a dead link */
    }
  }
  return out;
}

export default async function DocumentCards({
  category,
  defaults,
}: {
  category: string;
  defaults: DefaultDoc[];
}) {
  const docs = await docsFor(category, defaults);
  if (!docs.length) return null;

  return (
    <>
    <h2 className="doc-cards__heading">Documents</h2>
    <ul className="doc-cards" aria-label="Documents to download">
      {docs.map((d) => (
        <li key={d.url} className="doc-card">
          <span className="doc-card__icon" aria-hidden>
            <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
              <path d="M14 2v6h6" />
            </svg>
          </span>
          <span className="doc-card__body">
            <span className="doc-card__title">{d.title}</span>
            <span className="doc-card__meta">
              <span className="doc-card__chip">{d.type}</span>
              {d.year ? <span>{d.year}</span> : null}
              {d.version ? <span>{d.version}</span> : null}
              {d.date ? <span>Published {fmtDate(d.date)}</span> : null}
              {d.sizeKb ? <span>{fmtSize(d.sizeKb)}</span> : null}
            </span>
          </span>
          <span className="doc-card__actions">
            <a className="doc-card__btn doc-card__btn--view" href={d.url} target="_blank" rel="noopener noreferrer" aria-label={`View ${d.title} (opens in a new tab)`}>
              View
            </a>
            <a className="doc-card__btn doc-card__btn--dl" href={d.url} download aria-label={`Download ${d.title}`}>
              Download
            </a>
          </span>
        </li>
      ))}
    </ul>
    </>
  );
}
