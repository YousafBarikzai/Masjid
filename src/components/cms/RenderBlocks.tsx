import Link from "next/link";
import { RichText } from "@payloadcms/richtext-lexical/react";

interface Block {
  blockType: string;
  [key: string]: unknown;
}

export default function RenderBlocks({ blocks }: { blocks?: Block[] }) {
  if (!blocks?.length) return null;
  return (
    <>
      {blocks.map((b, i) => {
        switch (b.blockType) {
          case "content":
            return b.richText ? <RichText key={i} data={b.richText as never} /> : null;

          case "mediaBlock": {
            const img = b.image as { url?: string; alt?: string } | undefined;
            if (!img?.url) return null;
            return (
              <figure key={i} style={{ margin: "1.4em 0" }}>
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
              <div className="note-box" key={i} style={{ background: "var(--cream-2)", borderColor: "var(--gold)" }}>
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
