import Link from "next/link";
import RichTextRenderer from "./RichTextRenderer";

interface Block {
  blockType: string;
  background?: string;
  [key: string]: unknown;
}

function bgClass(bg?: string): string {
  return bg && bg !== "none" ? `block-bg block-bg-${bg}` : "";
}

function Img({ image, alt }: { image: unknown; alt?: string }) {
  const url = (image as { url?: string } | undefined)?.url;
  if (!url) return null;
  // eslint-disable-next-line @next/next/no-img-element
  return <img src={url} alt={alt ?? ""} style={{ borderRadius: 12, marginBottom: 12, width: "100%" }} />;
}

export default function RenderBlocks({ blocks }: { blocks?: Block[] }) {
  if (!blocks?.length) return null;
  return (
    <>
      {blocks.map((b, i) => {
        const wrap = bgClass(b.background);

        switch (b.blockType) {
          case "content":
            return b.richText ? (
              <div key={i} className={wrap || undefined}>
                <RichTextRenderer data={b.richText} />
              </div>
            ) : null;

          case "columns": {
            const cols = (b.columns as Array<Record<string, unknown>>) ?? [];
            if (!cols.length) return null;
            return (
              <div key={i} className={wrap || undefined}>
                <div className={`cms-columns cols-${Math.min(cols.length, 4)}`}>
                  {cols.map((c, j) => (
                    <div key={j} className="cms-col">
                      <Img image={c.image} />
                      <RichTextRenderer data={c.richText} />
                    </div>
                  ))}
                </div>
              </div>
            );
          }

          case "mediaBlock": {
            const img = b.image as { url?: string; alt?: string } | undefined;
            if (!img?.url) return null;
            return (
              <figure key={i} className={wrap || undefined} style={{ margin: "1.4em 0" }}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={img.url} alt={img.alt ?? ""} style={{ borderRadius: 14 }} />
                {b.caption ? (
                  <figcaption style={{ color: "var(--muted)", fontSize: ".88rem", marginTop: 6 }}>
                    {b.caption as string}
                  </figcaption>
                ) : null}
              </figure>
            );
          }

          case "cta":
            return (
              <div className={`note-box ${wrap}`} key={i} style={{ background: "var(--cream-2)", borderColor: "var(--gold)" }}>
                {b.heading ? <h3 style={{ marginTop: 0 }}>{b.heading as string}</h3> : null}
                {b.text ? <p>{b.text as string}</p> : null}
                {b.buttonUrl && b.buttonLabel ? (
                  <Link className="btn btn-green" href={b.buttonUrl as string}>
                    {b.buttonLabel as string}
                  </Link>
                ) : null}
              </div>
            );

          case "download": {
            const file = b.file as { url?: string } | undefined;
            if (!file?.url) return null;
            return (
              <p key={i}>
                📄{" "}
                <a href={file.url} target="_blank" rel="noopener noreferrer">
                  {(b.label as string) || "Download"}
                </a>
              </p>
            );
          }

          default:
            return null;
        }
      })}
    </>
  );
}
