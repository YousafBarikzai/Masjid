import type { Payload } from "payload";
import { servicePages, resourcePages, type PageSection } from "../lib/site-content";

/* Seeds the Pages collection with the website's built-in text so EVERY page is
   editable in the admin. Runs on boot, fully idempotent: a page is created only
   if its slug doesn't exist yet, and is never overwritten afterwards — so staff
   edits always win. Slugs mirror the URL (e.g. "services/funeral"), and the
   matching routes prefer the CMS copy once it exists. */

/* ---- minimal Lexical builders (matches the admin's richText editor) ------- */
function textNode(text: string) {
  return { type: "text", text, detail: 0, format: 0, mode: "normal", style: "", version: 1 };
}
function paragraph(text: string) {
  return {
    type: "paragraph",
    children: [textNode(text)],
    direction: "ltr",
    format: "",
    indent: 0,
    textFormat: 0,
    textStyle: "",
    version: 1,
  };
}
function heading(text: string, tag: "h2" | "h3" = "h2") {
  return { type: "heading", tag, children: [textNode(text)], direction: "ltr", format: "", indent: 0, version: 1 };
}
function bulletList(items: string[]) {
  return {
    type: "list",
    listType: "bullet",
    tag: "ul",
    start: 1,
    children: items.map((item, i) => ({
      type: "listitem",
      value: i + 1,
      children: [textNode(item)],
      direction: "ltr",
      format: "",
      indent: 0,
      version: 1,
    })),
    direction: "ltr",
    format: "",
    indent: 0,
    version: 1,
  };
}

function lexicalFromSections(sections: PageSection[]) {
  const children: unknown[] = [];
  for (const s of sections) {
    if (s.heading) children.push(heading(s.heading));
    for (const p of s.body ?? []) children.push(paragraph(p));
    if (s.bullets?.length) children.push(bulletList(s.bullets));
  }
  return { root: { type: "root", children, direction: "ltr", format: "", indent: 0, version: 1 } };
}

type SeedPage = { slug: string; title: string; intro?: string; sections: PageSection[] };

function collectSeeds(): SeedPage[] {
  const seeds: SeedPage[] = [];
  for (const s of servicePages) {
    seeds.push({ slug: `services/${s.slug}`, title: s.title, intro: s.intro, sections: s.sections });
  }
  for (const r of resourcePages) {
    seeds.push({ slug: `resources/${r.slug}`, title: r.title, intro: r.intro, sections: r.sections });
  }
  return seeds;
}

export async function seedWebsitePages(payload: Payload): Promise<void> {
  let created = 0;
  for (const seed of collectSeeds()) {
    try {
      const existing = await payload.find({
        collection: "pages",
        where: { slug: { equals: seed.slug } },
        limit: 1,
        depth: 0,
        draft: true,
        overrideAccess: true,
      });
      if (existing.totalDocs > 0) continue;
      await payload.create({
        collection: "pages",
        data: {
          title: seed.title,
          slug: seed.slug,
          intro: seed.intro,
          content: lexicalFromSections(seed.sections),
          _status: "published",
        } as never,
        overrideAccess: true,
      });
      created += 1;
    } catch (err) {
      payload.logger.warn(`Page seed skipped (${seed.slug}): ${(err as Error).message}`);
    }
  }
  if (created > 0) payload.logger.info(`✓ Seeded ${created} editable website page(s).`);
}

/* ---- Digital screens: seed the four TVs once ------------------------------ */
const SCREEN_SEEDS = [
  { name: "Mimbar & Outside Screen", slug: "mimbar-outside" },
  { name: "Sisters Screen", slug: "sisters" },
  { name: "Middle Masjid Screen", slug: "middle-masjid" },
  { name: "Ablution Area Screen", slug: "ablution" },
];

export async function seedScreens(payload: Payload): Promise<void> {
  let created = 0;
  for (const seed of SCREEN_SEEDS) {
    try {
      const existing = await payload.find({
        collection: "screens" as never,
        where: { slug: { equals: seed.slug } } as never,
        limit: 1,
        depth: 0,
        overrideAccess: true,
      });
      if (existing.totalDocs > 0) continue;
      await payload.create({
        collection: "screens" as never,
        data: {
          name: seed.name,
          slug: seed.slug,
          slides: [
            { type: "prayer-board", duration: 60, enabled: true },
            {
              type: "announcement",
              duration: 10,
              enabled: true,
              heading: "Welcome to Kingston Mosque",
              body: "Please put your phone on silent before entering the prayer hall.",
            },
          ],
        } as never,
        overrideAccess: true,
      });
      created += 1;
    } catch (err) {
      payload.logger.warn(`Screen seed skipped (${seed.slug}): ${(err as Error).message}`);
    }
  }
  if (created > 0) payload.logger.info(`✓ Seeded ${created} digital screen(s).`);
}
