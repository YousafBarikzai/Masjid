/* Single source of truth for admin destinations, shared by the command palette and
   the Favourites widget. Curated (rather than auto-discovered) so labels are friendly
   and noise collections (device-tokens, timetable-uploads) stay out of the picker. */

export const ADMIN_BASE = "/admin";
export const API_BASE = "/api";

export const collectionHref = (slug: string) => `${ADMIN_BASE}/collections/${slug}`;
export const createHref = (slug: string) => `${ADMIN_BASE}/collections/${slug}/create`;
export const globalHref = (slug: string) => `${ADMIN_BASE}/globals/${slug}`;
export const docHref = (slug: string, id: string | number) =>
  `${ADMIN_BASE}/collections/${slug}/${id}`;

export interface Destination {
  slug: string;
  label: string;
  href: string;
  group: "Content" | "Communication" | "Configuration" | "People" | "Media" | "Forms";
}

/** Collections worth navigating to / pinning. */
export const COLLECTIONS: Destination[] = [
  { slug: "pages", label: "Pages", href: collectionHref("pages"), group: "Content" },
  { slug: "posts", label: "News / Posts", href: collectionHref("posts"), group: "Content" },
  { slug: "events", label: "Events", href: collectionHref("events"), group: "Content" },
  { slug: "classes", label: "Classes", href: collectionHref("classes"), group: "Content" },
  { slug: "services", label: "Services", href: collectionHref("services"), group: "Content" },
  {
    slug: "announcements",
    label: "Announcements & Banners",
    href: collectionHref("announcements"),
    group: "Content",
  },
  {
    slug: "prayer-days",
    label: "Prayer times",
    href: collectionHref("prayer-days"),
    group: "Content",
  },
  {
    slug: "broadcasts",
    label: "Broadcasts",
    href: collectionHref("broadcasts"),
    group: "Communication",
  },
  {
    slug: "subscribers",
    label: "Subscribers",
    href: collectionHref("subscribers"),
    group: "Communication",
  },
  {
    slug: "contact-submissions",
    label: "Contact submissions",
    href: collectionHref("contact-submissions"),
    group: "Communication",
  },
  { slug: "forms", label: "Forms", href: collectionHref("forms"), group: "Forms" },
  {
    slug: "form-submissions",
    label: "Form submissions",
    href: collectionHref("form-submissions"),
    group: "Forms",
  },
  { slug: "media", label: "Media library", href: collectionHref("media"), group: "Media" },
  { slug: "users", label: "Staff & users", href: collectionHref("users"), group: "People" },
];

/** Globals (single-document settings). */
export const GLOBALS: Destination[] = [
  { slug: "main-menu", label: "Navigation Menu", href: globalHref("main-menu"), group: "Configuration" },
  { slug: "site-settings", label: "Site Settings", href: globalHref("site-settings"), group: "Configuration" },
  { slug: "jummah-settings", label: "Jummah Settings", href: globalHref("jummah-settings"), group: "Configuration" },
  { slug: "donation-settings", label: "Donation Settings", href: globalHref("donation-settings"), group: "Configuration" },
  { slug: "broadcast-settings", label: "Broadcast Settings", href: globalHref("broadcast-settings"), group: "Configuration" },
  { slug: "special-schedule", label: "Special Schedule", href: globalHref("special-schedule"), group: "Configuration" },
];

/** Everything pinnable / navigable. */
export const ALL_DESTINATIONS: Destination[] = [...COLLECTIONS, ...GLOBALS];

/** Collections searchable by free text in the palette, with the field to match on. */
export const SEARCHABLE: { slug: string; field: string; label: string }[] = [
  { slug: "pages", field: "title", label: "Page" },
  { slug: "posts", field: "title", label: "Post" },
  { slug: "events", field: "title", label: "Event" },
  { slug: "services", field: "title", label: "Service" },
  { slug: "announcements", field: "message", label: "Announcement" },
  { slug: "broadcasts", field: "title", label: "Broadcast" },
];
