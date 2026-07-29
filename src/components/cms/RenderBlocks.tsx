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

/** YouTube id from any common URL form. */
function ytId(url: string): string {
  const m =
    url.match(/[?&]v=([\w-]{6,})/) ||
    url.match(/youtu\.be\/([\w-]{6,})/) ||
    url.match(/youtube\.com\/(?:live|embed|shorts)\/([\w-]{6,})/);
  return m ? m[1] : "";
}

/** Renders ONE layout block. Shared by the legacy sections list (RenderBlocks)
 *  and the unified rich-text editor's inline blocks (RichTextRenderer). */
export function BlockView({ b }: { b: Block }) {
  const wrap = bgClass(b.background);

  switch (b.blockType) {
    case "content":
      return b.richText ? (
        <div className={wrap || undefined}>
          <RichTextRenderer data={b.richText} />
        </div>
      ) : null;

    case "callout": {
      const tone = (b.tone as string) || "info";
      return b.richText ? (
        <div className={`cms-callout cms-callout-${tone}`}>
          <RichTextRenderer data={b.richText} />
        </div>
      ) : null;
    }

    case "columns": {
      const cols = (b.columns as Array<Record<string, unknown>>) ?? [];
      if (!cols.length) return null;
      return (
        <div className={wrap || undefined}>
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
      const position = (b.position as string) || "full";
      return (
        <figure className={`cms-figure cms-figure-${position} ${wrap}`.trim()}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={img.url} alt={img.alt ?? ""} style={{ borderRadius: 14, width: "100%" }} />
          {b.caption ? (
            <figcaption style={{ color: "var(--muted)", fontSize: ".88rem", marginTop: 6 }}>
              {b.caption as string}
            </figcaption>
          ) : null}
        </figure>
      );
    }

    case "gallery": {
      const imgs = (b.images as Array<{ image?: { url?: string; alt?: string }; caption?: string }>) ?? [];
      const shown = imgs.filter((g) => g.image?.url);
      if (!shown.length) return null;
      return (
        <div className="cms-gallery">
          {shown.map((g, j) => (
            <figure key={j} className="cms-gallery-item">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={g.image!.url} alt={g.image!.alt ?? g.caption ?? ""} />
              {g.caption ? <figcaption>{g.caption}</figcaption> : null}
            </figure>
          ))}
        </div>
      );
    }

    case "videoEmbed": {
      const id = ytId(String(b.url || ""));
      if (!id) return null;
      return (
        <figure className="cms-video">
          <div className="cms-video-frame">
            <iframe
              src={`https://www.youtube-nocookie.com/embed/${id}`}
              title={(b.caption as string) || "Video"}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          </div>
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
        <div className={`note-box ${wrap}`} style={{ background: "var(--cream-2)", borderColor: "var(--gold)" }}>
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
        <p>
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
}

export default function RenderBlocks({ blocks }: { blocks?: Block[] }) {
  if (!blocks?.length) return null;
  return (
    <>
      {blocks.map((b, i) => (
        <BlockView key={i} b={b} />
      ))}
    </>
  );
}
