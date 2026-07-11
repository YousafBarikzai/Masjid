import "server-only";

/* Shared mappers for the mobile app's content endpoints (app-api/content and
   app-api/articles): rich-text → uniform native sections, and mobile-friendly
   image URLs from upload relations. */

export type AppSection = { heading?: string; body?: string[]; bullets?: string[] };

/** Flatten a Lexical rich-text tree into plain-text sections (paragraphs,
 *  headings and lists), defensively — any unknown node is walked for text. */
export function lexicalToSections(node: unknown): AppSection[] {
  const root = (node as { root?: { children?: unknown[] } })?.root;
  const children = Array.isArray(root?.children) ? root!.children! : [];
  const out: AppSection[] = [];
  let current: AppSection = { body: [] };
  const pushCurrent = () => {
    if ((current.body && current.body.length) || (current.bullets && current.bullets.length)) out.push(current);
    current = { body: [] };
  };
  const textOf = (n: any): string => {
    if (!n) return "";
    if (typeof n.text === "string") return n.text;
    if (Array.isArray(n.children)) return n.children.map(textOf).join("");
    return "";
  };
  for (const raw of children) {
    const n = raw as any;
    const type = n?.type;
    if (type === "heading") {
      pushCurrent();
      current.heading = textOf(n).trim();
    } else if (type === "list") {
      const items = Array.isArray(n.children) ? n.children.map((li: any) => textOf(li).trim()).filter(Boolean) : [];
      if (items.length) (current.bullets ||= []).push(...items);
    } else if (type === "quote" || type === "paragraph") {
      const t = textOf(n).trim();
      if (t) (current.body ||= []).push(t);
    } else {
      const t = textOf(n).trim();
      if (t) (current.body ||= []).push(t);
    }
  }
  pushCurrent();
  return out.filter((s) => s.heading || (s.body && s.body.length) || (s.bullets && s.bullets.length));
}

/** Mobile-friendly image URL from an (optionally populated) upload relation:
 *  prefers the generated 768px "card" rendition over the original. The app
 *  resolves relative URLs against its API base. */
export function imageUrlOf(rel: unknown): string {
  const m = rel as { url?: string; sizes?: Record<string, { url?: string }> } | null;
  if (!m || typeof m !== "object") return "";
  return m.sizes?.card?.url || m.url || "";
}

/** Uniform article shape for the app (list + native reader). */
export function mapPost(d: any): {
  slug: string;
  title: string;
  date: string;
  excerpt: string;
  image: string;
  sections: AppSection[];
} {
  return {
    slug: String(d.slug || ""),
    title: String(d.title || ""),
    date: d.publishedDate
      ? new Date(d.publishedDate).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })
      : "News",
    excerpt: String(d.excerpt || ""),
    image: imageUrlOf(d.image),
    sections: d.content ? lexicalToSections(d.content) : [],
  };
}
