/**
 * Structured, faithful page content for the rebuilt Kingston Mosque site.
 *
 * Sources: the brief supplied by KMA + content already extracted into this repo
 * (src/lib/content.ts, docs/PROJECT_PLAN.md). The live kingstonmosque.org could
 * not be fetched from the build environment, so anything not verifiable is
 * clearly marked `PLACEHOLDER` and is safe for an editor to replace. No new
 * religious rulings or official figures have been invented.
 *
 * Images are referenced by slot id and resolved to /images/<slot>.jpg by the
 * <ImageSlot> component, which shows an "add this image" placeholder until the
 * real photo from the existing site is dropped into /public/images.
 */

export interface PageSection {
  heading?: string;
  body?: string[];
  bullets?: string[];
}

export interface ServicePage {
  slug: string;
  title: string;
  icon: string;
  intro: string;
  image: string;
  imageAlt: string;
  sections: PageSection[];
  gallery?: string[];
  ctaHeading?: string;
  ctaBody?: string;
}

/* ------------------------------- Services -------------------------------- */
export const servicePages: ServicePage[] = [
  {
    slug: "congregational-prayers",
    title: "Congregational Prayers",
    icon: "🕌",
    intro:
      "The five daily prayers are held in congregation at Kingston Mosque, with dedicated facilities for both men and women.",
    image: "congregational-prayers",
    imageAlt: "Inside the main prayer hall at Kingston Mosque",
    sections: [
      {
        heading: "Prayer facilities",
        body: [
          "The mosque provides separate, comfortable prayer spaces so the whole family can worship with ease.",
        ],
        bullets: [
          "Men’s prayer hall on the ground floor",
          "Women’s prayer hall on the second floor",
          "Brand-new ablution (wudū) facilities",
          "Disabled-accessible toilets and a shower",
          "Sermon (khutbah) screens for clear viewing",
          "Capacity for over 800 worshippers",
        ],
      },
      {
        heading: "Daily prayers",
        body: [
          "All five obligatory prayers are prayed in jamāʿah every day. Live daily timings and the next-prayer countdown are on the Prayer Times page, and the two Friday Jumuʿah congregations are listed on the Jumuʿah page.",
        ],
      },
      {
        heading: "Ramadan & Eid",
        body: [
          "During Ramadan the mosque hosts nightly Tarāwīḥ prayers, with Suhūr and Iftar timings provided and Iʿtikāf in the last ten nights. Eid prayers are held in multiple congregations with overflow space — details are announced each year on the News and Events pages.",
        ],
      },
    ],
    ctaHeading: "Plan your visit",
    ctaBody: "Everyone is welcome. For access needs or any questions about praying with us, contact the mosque office.",
  },
  {
    slug: "madrasah",
    title: "Madrasah",
    icon: "📖",
    intro:
      "Islamic education for children aged 6–16 — Qur’an, Islamic Studies and Hifz — in a nurturing, structured environment.",
    image: "madrasah",
    imageAlt: "Children learning at the Kingston Mosque Madrasah",
    sections: [
      {
        heading: "What we teach",
        bullets: [
          "Qur’an recitation (Nāẓirah) and Tajwīd",
          "Memorisation (Hifz) pathways",
          "Islamic Studies, ʿAqīdah and good character (Akhlāq)",
          "Duʿās and the essentials of daily worship",
        ],
      },
      {
        heading: "Ages & schedule",
        body: [
          "The Madrasah is open to children aged 6 to 16 and runs in regular evening and weekend sessions during term time. Current class times and places are confirmed by the Madrasah office on enrolment.",
        ],
      },
      {
        heading: "Teaching vacancies",
        body: [
          "PLACEHOLDER — The mosque periodically advertises Madrasah teaching roles. Current vacancies and how to apply are posted on the News page; please replace this note with the live vacancy details when available.",
        ],
      },
    ],
    ctaHeading: "Enrol or enquire",
    ctaBody:
      "To enrol your child or ask about class availability, email info@kingstonmosque.org or call the mosque office.",
  },
  {
    slug: "sisters-circles",
    title: "Sisters’ Circles",
    icon: "🌸",
    intro:
      "A welcoming space for sisters to learn, grow in faith, find support and build lasting community connections.",
    image: "sisters-circles",
    imageAlt: "Sisters’ circle gathering at Kingston Mosque",
    sections: [
      {
        heading: "Learning, growth & support",
        body: [
          "The Sisters’ Circles bring women together for learning and spiritual growth — strengthening faith, offering mutual support and nurturing genuine community connection in a friendly, sisterly setting.",
        ],
      },
      {
        heading: "Current circles & programmes",
        body: [
          "Circles and programmes are refreshed regularly throughout the year. For the latest schedule and how to join, please contact info@kingstonmosque.org.",
        ],
      },
    ],
    ctaHeading: "Join a circle",
    ctaBody: "For updated circles and programmes, email info@kingstonmosque.org.",
  },
  {
    slug: "marriage",
    title: "Marriage Services",
    icon: "💍",
    intro:
      "Nikah (marriage) services conducted by local Imams, in line with authentic Islamic tradition.",
    image: "marriage",
    imageAlt: "Kingston Mosque marriage services",
    sections: [
      {
        heading: "Nikah at Kingston Mosque",
        body: [
          "Our marriage services are provided by local Imams and are based on authentic Islamic traditions. The mosque can guide couples and families through the requirements for a valid Nikah.",
        ],
      },
      {
        heading: "How to arrange",
        body: [
          "To arrange a Nikah or discuss requirements and available dates, please contact the mosque office and a member of the team will be glad to assist.",
        ],
      },
    ],
    ctaHeading: "Arrange a Nikah",
    ctaBody: "Email info@kingstonmosque.org or call 020 8549 5315 to begin.",
  },
  {
    slug: "school-visits",
    title: "School Visits",
    icon: "🏫",
    intro:
      "We welcome schools from Kingston-upon-Thames and beyond to visit the mosque and learn about Islam and the local Muslim community.",
    image: "school-visits",
    imageAlt: "A school group visiting Kingston Mosque",
    sections: [
      {
        heading: "Educational visits",
        body: [
          "Kingston Mosque is happy to host educational visits for schools. Visits include a friendly introduction to the mosque, the daily life of the community and the basics of Islamic belief and practice, with time for pupils’ questions.",
        ],
      },
      {
        heading: "Booking a visit",
        body: [
          "Teachers and schools across the borough and surrounding areas are welcome to get in touch to arrange a visit at a convenient time.",
        ],
      },
    ],
    ctaHeading: "Book a school visit",
    ctaBody: "Email info@kingstonmosque.org or call 020 8549 5315 to arrange your visit.",
  },
  {
    slug: "funeral",
    title: "Funeral Services",
    icon: "🤲",
    intro:
      "Compassionate support for Muslim funerals — including Ghusl and burial assistance — provided free of charge to the community.",
    image: "funeral",
    imageAlt: "Kingston Mosque funeral support",
    sections: [
      {
        heading: "Here for families in need",
        body: [
          "Losing a loved one is one of the hardest moments a family can face. Kingston Mosque offers free assistance in arranging and managing Ghusl (ritual washing) and burials, helping families fulfil their obligations at a difficult time.",
        ],
      },
      {
        heading: "What we help with",
        bullets: [
          "Ghusl and shrouding (kafan) guidance and facilities",
          "Janāzah prayer arrangements",
          "Help coordinating burial",
          "Compassionate guidance through each step",
        ],
      },
      {
        heading: "A free service",
        body: [
          "This support is provided free of charge as a service to the community, in the spirit of mutual care and responsibility.",
        ],
      },
    ],
    ctaHeading: "Funeral & bereavement support",
    ctaBody:
      "For urgent funeral assistance, please call the mosque office on 020 8549 5315 or email info@kingstonmosque.org.",
  },
  {
    slug: "youth-programs",
    title: "Youth Programs",
    icon: "🧒",
    intro:
      "The KMA Boys’ Youth Club offers a positive, welcoming space for young people to build faith, friendship and character.",
    image: "youth-1",
    imageAlt: "Young people at the KMA Youth Club",
    sections: [
      {
        heading: "Boys’ Youth Club",
        body: [
          "The Boys’ Youth Club brings young people together for faith, friendship, sport and skills in a safe and welcoming environment, helping them grow in confidence and good character.",
        ],
      },
      {
        heading: "When & where",
        body: [
          "PLACEHOLDER — Add the current Youth Club opening times and venue here. The club is run at the mosque; please replace this note with the live session times and location.",
        ],
      },
    ],
    gallery: ["youth-1", "youth-2", "youth-3"],
    ctaHeading: "Get involved",
    ctaBody:
      "To find out about sessions or get your son involved, contact info@kingstonmosque.org or call 020 8549 5315.",
  },
];

/* ------------------------------- Resources ------------------------------- */
export interface ResourcePage {
  slug: string;
  title: string;
  icon: string;
  intro: string;
  sections: PageSection[];
  downloads?: { label: string; file: string }[];
}

export const resourcePages: ResourcePage[] = [
  {
    slug: "membership-form",
    title: "Membership Form",
    icon: "📝",
    intro: "Become a member of Kingston Muslim Association and support the running of your mosque.",
    sections: [
      {
        heading: "How to join",
        body: [
          "You can become a member by completing the membership form. Download the PDF below to print and return, or complete the online form where available, and submit it to the mosque office.",
        ],
      },
      {
        body: [
          "PLACEHOLDER — Add the membership criteria, fees and submission instructions exactly as published by KMA.",
        ],
      },
    ],
    downloads: [{ label: "Membership Form (PDF)", file: "membership-form.pdf" }],
  },
  {
    slug: "data-policy",
    title: "Data Policy",
    icon: "🔒",
    intro: "How Kingston Muslim Association collects, uses and protects your personal data.",
    sections: [
      {
        heading: "Data protection",
        body: [
          "Kingston Muslim Association is committed to protecting the privacy of its members and the community and to handling personal data responsibly and in line with UK data-protection law.",
          "PLACEHOLDER — Paste the full Data Protection Policy text here, exactly as published by KMA.",
        ],
      },
    ],
    downloads: [{ label: "Data Policy (PDF)", file: "data-policy.pdf" }],
  },
  {
    slug: "right-of-access-request",
    title: "Right of Access Request",
    icon: "📨",
    intro: "Request a copy of the personal data Kingston Muslim Association holds about you.",
    sections: [
      {
        heading: "Making a request",
        body: [
          "You have the right to request access to the personal information we hold about you (a “Right of Access” or Subject Access Request). To make a request, complete the Right of Access Request form below and return it to the mosque office.",
          "PLACEHOLDER — Add the exact ROA process, timescales and contact details published by KMA.",
        ],
      },
    ],
    downloads: [{ label: "Right of Access Request Form (PDF)", file: "right-of-access-request.pdf" }],
  },
  {
    slug: "agm-minutes",
    title: "AGM Meeting Minutes",
    icon: "🗒️",
    intro: "Minutes from Kingston Muslim Association’s Annual General Meetings.",
    sections: [
      {
        body: [
          "Minutes of recent Annual General Meetings are available to download below. PLACEHOLDER — replace with the actual AGM minutes documents and dates.",
        ],
      },
    ],
    downloads: [
      { label: "AGM Minutes (PDF)", file: "agm-minutes.pdf" },
    ],
  },
  {
    slug: "financial-accounts",
    title: "Financial Accounts",
    icon: "📊",
    intro: "Kingston Muslim Association’s annual financial accounts, published for transparency.",
    sections: [
      {
        body: [
          "As a registered charity, Kingston Muslim Association publishes its annual accounts. The most recent accounts are available to download below.",
        ],
      },
    ],
    downloads: [
      { label: "Accounts — year ended 31 March 2024 (PDF)", file: "accounts-2024.pdf" },
      { label: "Accounts — year ended 31 March 2023 (PDF)", file: "accounts-2023.pdf" },
    ],
  },
];

/* --------------------------- Donation categories ------------------------- */
export const donationCategories = [
  { icon: "🕌", title: "General Mosque Fund", body: "Keep the doors open — daily prayers, utilities, upkeep and running costs." },
  { icon: "🌙", title: "Ramadan Iftar Sponsorship", body: "Sponsor Iftar for worshippers during the blessed month of Ramadan." },
  { icon: "🤲", title: "Zakat & Fitrana", body: "Fulfil your obligatory Zakat and Fitrana through your local mosque." },
  { icon: "❤️", title: "Urgent Financial Help", body: "Support families facing hardship and emergency community needs." },
];

/* -------------------------------- Media ---------------------------------- */
// PLACEHOLDER video set — replace youtubeId/thumb with the real KMA videos.
export interface MediaItem {
  category: "Friday Khutbah" | "Qur’an Recitation" | "Lecture";
  title: string;
  youtubeId?: string;
  thumb: string;
}
export const mediaItems: MediaItem[] = [
  { category: "Friday Khutbah", title: "Friday Khutbah — sample", thumb: "media-khutbah-1" },
  { category: "Friday Khutbah", title: "Friday Khutbah — sample", thumb: "media-khutbah-2" },
  { category: "Qur’an Recitation", title: "Qur’an Recitation — sample", thumb: "media-quran-1" },
  { category: "Qur’an Recitation", title: "Qur’an Recitation — sample", thumb: "media-quran-2" },
  { category: "Lecture", title: "Lecture — sample", thumb: "media-lecture-1" },
  { category: "Lecture", title: "Lecture — sample", thumb: "media-lecture-2" },
];
export const youtubeChannelUrl = "https://www.youtube.com/@kingstonmosque"; // PLACEHOLDER — confirm channel URL

/* ------------------------------ Sample news ------------------------------ */
// PLACEHOLDER articles reflecting the kinds of posts on the live site.
export interface NewsSeed {
  slug: string;
  category: string;
  title: string;
  date: string;
  excerpt: string;
  image: string;
}
export const newsSeed: NewsSeed[] = [
  {
    slug: "eid-prayer-announcement",
    category: "Eid",
    title: "Eid Prayer Announcement",
    date: "Upcoming",
    excerpt:
      "Eid prayer congregations and timings at Kingston Mosque, with overflow space and parking guidance. Please arrive early.",
    image: "news-eid",
  },
  {
    slug: "ramadan-itikaf-registration",
    category: "Ramadan",
    title: "Ramadan & I‘tikaf Registration",
    date: "Upcoming",
    excerpt:
      "Nightly Tarāwīḥ throughout Ramadan and I‘tikaf registration for the last ten nights. Suhūr and Iftar timings provided.",
    image: "news-ramadan",
  },
  {
    slug: "madrasah-teacher-vacancy",
    category: "Madrasah",
    title: "Madrasah Teacher Vacancy",
    date: "Notice",
    excerpt:
      "The Madrasah is seeking dedicated teachers to support our children’s Islamic education. Read on for details and how to apply.",
    image: "news-madrasah",
  },
  {
    slug: "agm-notice",
    category: "AGM",
    title: "Annual General Meeting — Notice",
    date: "Notice",
    excerpt:
      "Notice of Kingston Muslim Association’s Annual General Meeting. All members are encouraged to attend.",
    image: "news-agm",
  },
  {
    slug: "community-update",
    category: "Community",
    title: "Community Update",
    date: "Latest",
    excerpt: "News and updates from across the Kingston Mosque community.",
    image: "news-community",
  },
];

/* ----------------------------- Sample events ----------------------------- */
export interface EventSeed {
  tag: string;
  title: string;
  date: string;
  time: string;
  body: string;
}
export const eventsSeed: EventSeed[] = [
  { tag: "Eid", title: "Eid Prayer", date: "See announcement", time: "Multiple congregations", body: "Eid prayers with overflow space. Timings announced on the News page — please arrive early." },
  { tag: "Ramadan", title: "Tarāwīḥ Prayers", date: "Nightly in Ramadan", time: "After ʿIshāʾ", body: "Nightly Tarāwīḥ throughout the month of Ramadan." },
  { tag: "Youth", title: "Boys’ Youth Club", date: "Weekly", time: "See Youth Programs", body: "Weekly youth sessions — faith, friendship, sport and skills." },
];
