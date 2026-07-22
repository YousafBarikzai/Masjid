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

/* ---- Khutbah Archive: the featured Friday, for the demo ------------------- */
// Ensures the archive opens with the featured "Friday 17 July" khutbah — a
// real, playable sermon with a written summary and key lessons. Behaviour:
//   · If the featured entry already exists → nothing happens.
//   · If the archive is empty → the featured entry is created.
//   · If the archive still holds ONLY the untouched earlier demo samples →
//     they are replaced by the featured entry (staff never added anything, so
//     nothing of theirs can be lost).
//   · If staff have added their own khutbahs → nothing is ever touched.
type KhutbahSeed = {
  title: string;
  date: string;
  khatib: string;
  youtubeUrl: string;
  sections: PageSection[];
  lessons: string[];
  tags: string[];
};

const LEGACY_SAMPLE_SLUGS = [
  "gratitude-using-our-blessings-for-positive-change-2026-07-10",
  "patience-in-adversity-2026-07-03",
  "the-character-of-the-prophets-2026-06-26",
];

const FEATURED_KHUTBAH: KhutbahSeed = {
  title: "Lessons from the Final Sermon",
  date: "2026-07-17",
  khatib: "Mufti Ismail Menk",
  youtubeUrl: "https://www.youtube.com/watch?v=wNv6nFMMYq0",
  sections: [
    {
      body: [
        "On the plain of ʿArafah, before more than a hundred thousand companions, the Prophet ﷺ delivered the sermon that would seal his message. This Jumuʿah khutbah walks through its timeless commands — and asks what each one demands of us in Kingston today.",
      ],
    },
    {
      heading: "A charter for every generation",
      body: [
        "The Final Sermon reads like a charter: the sanctity of life, wealth and honour; the abolition of usury and of the vendettas of jāhiliyyah; the rights husbands and wives hold over one another; and the declaration that no Arab is superior to a non-Arab, nor white to black — except by taqwā.",
        "Its closing charge is personal: “Let whoever is present convey this to whoever is absent.” Every one of us who hears the message becomes responsible for carrying it — in our homes, our workplaces and our community.",
      ],
      bullets: [
        "Hold to the Qur'an and the Sunnah — the two things that never lead astray",
        "Guard each other's life, wealth and honour as sacred",
        "Superiority is by taqwā alone — race and lineage count for nothing",
      ],
    },
  ],
  lessons: [
    "The believer's life, wealth and honour are as sacred as the sacred month",
    "Treat women with kindness — their rights are a trust from Allah",
    "No one is superior by race or birth; only by taqwā",
    "Whoever hears the message carries the duty to pass it on",
  ],
  tags: ["Seerah", "Final Sermon", "Unity"],
};

function khutbahSlug(title: string, date: string): string {
  const base = title
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
  return `${base}-${date.slice(0, 10)}`;
}

export async function seedSampleKhutbahs(payload: Payload): Promise<void> {
  try {
    const featuredSlug = khutbahSlug(FEATURED_KHUTBAH.title, FEATURED_KHUTBAH.date);
    const all = await payload.find({
      collection: "khutbahs" as never,
      limit: 100,
      depth: 0,
      draft: true,
      overrideAccess: true,
    });
    const docs = all.docs as { id: string | number; slug?: string }[];

    // Featured entry already present → done.
    if (docs.some((d) => d.slug === featuredSlug)) return;

    // Staff content present (anything beyond the untouched old samples) → hands off.
    const onlyLegacySamples = docs.every((d) => LEGACY_SAMPLE_SLUGS.includes(String(d.slug)));
    if (docs.length > 0 && !onlyLegacySamples) return;

    // Retire the old demo samples, then create the featured Friday.
    for (const d of docs) {
      await payload.delete({ collection: "khutbahs" as never, id: d.id, overrideAccess: true });
    }
    const k = FEATURED_KHUTBAH;
    await payload.create({
      collection: "khutbahs" as never,
      data: {
        title: k.title,
        slug: featuredSlug,
        date: new Date(k.date).toISOString(),
        khatib: k.khatib,
        youtubeUrl: k.youtubeUrl,
        synopsis: lexicalFromSections(k.sections),
        lessons: k.lessons.map((lesson) => ({ lesson })),
        tags: k.tags.map((tag) => ({ tag })),
        _status: "published",
      } as never,
      overrideAccess: true,
    });
    payload.logger.info(
      `✓ Khutbah archive: featured "Friday 17 July" seeded${docs.length ? ` (replaced ${docs.length} demo sample(s))` : ""}.`,
    );
  } catch (err) {
    payload.logger.warn(`Khutbah seeding skipped: ${(err as Error).message}`);
  }
}
