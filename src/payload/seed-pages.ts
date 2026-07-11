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

/* ---- Khutbah Archive: three sample sermons, for the demo ------------------ */
// Seeds a few real, playable Friday khutbahs so the app's Khutbah Archive has
// something to show out of the box. Runs ONLY when the archive is completely
// empty, so the moment staff add or delete any khutbah of their own, these
// never come back — they're just a starting demo, editable/deletable like any
// other entry in admin → Content → Khutbah archive.
type KhutbahSeed = {
  title: string;
  date: string;
  khatib: string;
  youtubeUrl: string;
  sections: PageSection[];
  lessons: string[];
  tags: string[];
};

const KHUTBAH_SEEDS: KhutbahSeed[] = [
  {
    title: "Gratitude: Using Our Blessings for Positive Change",
    date: "2026-07-10",
    khatib: "Ustadh Nouman Ali Khan",
    youtubeUrl: "https://www.youtube.com/watch?v=K4_HypaKssY",
    sections: [
      {
        body: [
          "Shukr — gratitude — is not a feeling we wait to experience; it is something we do. In this khutbah the Qur'anic picture of gratitude is unpacked: every blessing we hold, from our sight and speech to our families and our time, is a trust from Allah that asks to be put to work.",
        ],
      },
      {
        heading: "Gratitude is active, not passive",
        body: [
          "The Qur'an rarely pairs gratitude with words alone. Sulaymān (peace be upon him), on seeing the bounty before him, responds: “This is from the favour of my Lord, to test me whether I am grateful or ungrateful.” Gratitude is the test of what we do with what we are given.",
          "The khutbah closes with a practical challenge: choose one blessing this week — health, income, a skill, free time — and deliberately use a portion of it for someone else's benefit. That is shukr in motion.",
        ],
        bullets: [
          "Count the blessing, then ask what it is for",
          "Serve others with the very gift you are grateful for",
          "Ingratitude is not saying “no thanks” — it is leaving the gift idle",
        ],
      },
    ],
    lessons: [
      "Gratitude in Islam is an action before it is an emotion",
      "Every blessing is also a test of how we use it",
      "Using a gift in Allah's cause multiplies it — “If you are grateful, I will surely increase you” (14:7)",
    ],
    tags: ["Gratitude", "Character", "Qur'an"],
  },
  {
    title: "Patience in Adversity",
    date: "2026-07-03",
    khatib: "Mufti Ismail Menk",
    youtubeUrl: "https://www.youtube.com/watch?v=4J6OHQFSRhg",
    sections: [
      {
        body: [
          "Delivered at the East London Mosque, this sermon addresses the believer walking through hardship — illness, loss, debt, worry for our brothers and sisters across the world — and asks: what does beautiful patience (ṣabrun jamīl) actually look like day to day?",
        ],
      },
      {
        heading: "The first strike",
        body: [
          "The Prophet ﷺ taught that true patience is at the first strike of calamity — the first moment, the first tears, the first news. What we say and do in that moment is where the reward lies.",
          "Patience is not silence or passivity: it is holding the heart back from despair, the tongue from complaint against Allah, and the limbs from what displeases Him — while still taking every permissible means to relieve the difficulty.",
        ],
        bullets: [
          "Say “innā lillāhi wa innā ilayhi rājiʿūn” and mean it",
          "Never announce despair of Allah's mercy",
          "Keep serving others even while you yourself are tested",
        ],
      },
    ],
    lessons: [
      "Patience is measured at the first strike of calamity, not after time has healed",
      "Ṣabr is active endurance — you may fight the difficulty while accepting the decree",
      "“Indeed, the patient will be given their reward without account” (39:10)",
    ],
    tags: ["Patience", "Hardship", "Hope"],
  },
  {
    title: "The Character of the Prophets",
    date: "2026-06-26",
    khatib: "Mufti Ismail Menk",
    youtubeUrl: "https://www.youtube.com/watch?v=fK7RzmzY-Eg",
    sections: [
      {
        body: [
          "Every prophet was sent with the same core mission — and the same core character. This Jumuʿah khutbah walks through the akhlāq the prophets shared: truthfulness even when it cost them, mercy towards the very people who mocked them, humility at the height of victory.",
        ],
      },
      {
        heading: "Their example is our syllabus",
        body: [
          "The khutbah reminds us that our Prophet ﷺ was described by ʿĀʾishah (may Allah be pleased with her) as “a walking Qur'an” — his character was the revelation lived out. To love him is to imitate him: in the home first, then the marketplace, then the masjid.",
        ],
        bullets: [
          "Truthfulness is the foundation every other virtue stands on",
          "Gentleness in the home is the truest measure of a person",
          "Forgive the one who wronged you — that is the prophetic response to power",
        ],
      },
    ],
    lessons: [
      "“Indeed you are of a tremendous character” (68:4) — character is the heart of prophethood",
      "The best of you are those best to their families",
      "Mercy in the moment of strength is the sunnah of every prophet",
    ],
    tags: ["Seerah", "Character", "Family"],
  },
];

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
    // Only ever seed into an empty archive — once staff have any khutbah of
    // their own, we never touch it again.
    const any = await payload.find({
      collection: "khutbahs" as never,
      limit: 1,
      depth: 0,
      draft: true,
      overrideAccess: true,
    });
    if (any.totalDocs > 0) return;

    let created = 0;
    for (const k of KHUTBAH_SEEDS) {
      await payload.create({
        collection: "khutbahs" as never,
        data: {
          title: k.title,
          slug: khutbahSlug(k.title, k.date),
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
      created += 1;
    }
    if (created > 0) payload.logger.info(`✓ Seeded ${created} sample khutbah(s) for the demo.`);
  } catch (err) {
    payload.logger.warn(`Sample khutbah seeding skipped: ${(err as Error).message}`);
  }
}
