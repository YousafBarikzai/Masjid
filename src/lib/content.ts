/**
 * Seed site content & configuration.
 *
 * Everything here is intentionally structured as plain data so it can be moved
 * into the Payload CMS collections (SiteSettings, Jummah, Services, Classes,
 * Events, Announcements, DonationSettings) without changing the components.
 */

export const site = {
  name: "Kingston Mosque",
  org: "Kingston Muslim Association",
  tagline: "A home for worship, learning & community",
  intro:
    "Serving the Muslim community of Kingston upon Thames since 1979 — daily prayers, Islamic education, and support for families across the borough.",
  since: 1979,
  charity: "Registered charity in England & Wales",
  address: {
    line1: "55 East Road",
    city: "Kingston upon Thames",
    postcode: "KT2 6EJ",
  },
  phone: "020 8549 5315",
  phoneHref: "tel:+442085495315",
  email: "info@kingstonmosque.org",
  mapsQuery: "Kingston Muslim Association, 55 East Road, Kingston upon Thames KT2 6EJ",
  social: [
    { label: "Facebook", href: "https://www.facebook.com/kmosque/" },
    { label: "Telegram", href: "https://t.me/kingstonmosque" },
  ],
};

/** Public base URL (set SITE_URL in the host to your real domain). */
export const siteUrl = (process.env.SITE_URL || "https://masjid-production.up.railway.app").replace(/\/$/, "");

export interface NavItem {
  label: string;
  href: string;
  children?: { label: string; href: string }[];
  cta?: boolean;
}

export const nav: NavItem[] = [
  { label: "Home", href: "/" },
  { label: "About Us", href: "/about", children: [{ label: "Overview", href: "/about" }] },
  {
    label: "Services",
    href: "/services",
    children: [
      { label: "Congregational Prayers", href: "/services/congregational-prayers" },
      { label: "Madrasah", href: "/services/madrasah" },
      { label: "Sisters’ Circles", href: "/services/sisters-circles" },
      { label: "Marriage Services", href: "/services/marriage" },
      { label: "School Visits", href: "/services/school-visits" },
      { label: "Funeral Services", href: "/services/funeral" },
      { label: "Youth Programs", href: "/services/youth-programs" },
    ],
  },
  {
    label: "Resources",
    href: "/resources",
    children: [
      { label: "Membership Form", href: "/resources/membership-form" },
      { label: "Data Policy", href: "/resources/data-policy" },
      { label: "Right of Access Request", href: "/resources/right-of-access-request" },
      { label: "AGM Meeting Minutes", href: "/resources/agm-minutes" },
      { label: "Financial Accounts", href: "/resources/financial-accounts" },
    ],
  },
  { label: "Events", href: "/events" },
  { label: "News", href: "/news" },
  { label: "Media", href: "/media" },
  { label: "Contact", href: "/contact" },
  { label: "Donate", href: "/donate", cta: true },
];

/** Site-wide alert banner (managed by Announcements in the CMS). */
export const alert = {
  enabled: true,
  label: "Notice",
  message:
    "Jumu‘ah every Friday — 1st khutbah (English) 1:10 pm · 2nd khutbah (Arabic) 2:10 pm. Please arrive early.",
};

/** Two-Jummah schedule (managed by the JummahSetting collection). */
export const jummah = {
  intro: "Two congregations every Friday — the first in English, the second in Arabic.",
  congregations: [
    { name: "First Jummah", language: "English", doors: "12:50 pm", khutbah: "1:10 pm" },
    { name: "Second Jummah", language: "Arabic", doors: "2:00 pm", khutbah: "2:10 pm" },
  ],
};

export const donation = {
  heading: "Your Sadaqah keeps the doors open",
  body:
    "Kingston Mosque runs entirely on the generosity of the community — funding daily prayers, the Madrasah, and free funeral support. Give your Zakat & Sadaqah by bank transfer or in person at the masjid.",
  bank: [
    { label: "Account name", value: "Kingston Muslim Association" },
    { label: "Bank", value: "NatWest" },
    { label: "Sort code", value: "60-60-02" },
    { label: "Account no.", value: "•••• 6156 (confirm)" },
    { label: "In person", value: "Donation box by the office" },
  ],
};

export const events = [
  {
    tag: "Eid",
    title: "Eid Prayer",
    body:
      "Two congregations with overflow space. Full timing and parking guidance announced — please arrive early.",
    href: "/events",
  },
  {
    tag: "Ramadan",
    title: "Taraweeh & I‘tikaaf",
    body:
      "Nightly Taraweeh and I‘tikaaf registration during the last ten nights. Suhūr & Iftar timings provided.",
    href: "/events",
  },
  {
    tag: "Youth",
    title: "KMA Youth Club",
    body:
      "Weekly sessions for young people — faith, friendship, sport and skills in a welcoming environment.",
    href: "/education",
  },
];

export const classes = [
  { icon: "📖", title: "Madrasah", body: "Qur'an, Islamic Studies & Hifz for children aged 6–16, evenings & weekends.", href: "/education" },
  { icon: "🧒", title: "Youth Club", body: "Weekly youth sessions building confidence, character and community.", href: "/education" },
  { icon: "🌸", title: "Sisters' Circle", body: "A Sunday forum for girls and women — learning, friendship and events.", href: "/education" },
  { icon: "🎓", title: "Adult Classes", body: "Courses, lectures and study circles in Qur'an and Islamic knowledge.", href: "/education" },
];

export const services = [
  { icon: "💍", title: "Nikah", body: "Marriage services conducted by our Imams in line with authentic Islamic tradition.", href: "/services/nikah" },
  { icon: "🤲", title: "Funeral & Ghusl", body: "Free assistance arranging and managing Ghusl and burials for the community.", href: "/services/funeral" },
  { icon: "🕌", title: "New Muslims", body: "Guidance, support and a warm welcome for those embracing or exploring Islam.", href: "/services" },
  { icon: "🏫", title: "School Visits", body: "Welcoming schools across the borough to learn about Islam and the mosque.", href: "/services" },
];

export const stats = [
  { n: "1979", l: "Serving since" },
  { n: "800+", l: "Worshipper capacity" },
  { n: "2", l: "Jummah congregations" },
  { n: "6–16", l: "Madrasah ages" },
];

export const facilities = [
  "Separate prayer halls for men (ground floor) and women (second-floor hall)",
  "Brand-new ablution (wudu) facilities",
  "Disabled-accessible toilets and a shower",
  "Capacity for over 800 worshippers",
];
