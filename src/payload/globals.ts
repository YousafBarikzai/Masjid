import type { GlobalConfig } from "payload";
import { anyone, isAdmin, isPrayerManager } from "./access";

/* --------------------------- Navigation builder --------------------------- */
// CMS-managed top navigation. Drag to reorder; each item can have a dropdown.
// Leaving it empty makes the site fall back to the built-in default menu.
export const MainMenu: GlobalConfig = {
  slug: "main-menu",
  label: "Navigation Menu",
  admin: {
    group: "Configuration",
    description:
      "The website's top navigation. Drag the ⠿ handles to reorder. Each item can hold a dropdown of links. Leave empty to use the built-in default menu.",
  },
  access: { read: anyone, update: isAdmin },
  fields: [
    {
      name: "items",
      type: "array",
      labels: { singular: "Menu item", plural: "Menu items" },
      admin: { description: "Top-level links shown in the header." },
      fields: [
        {
          type: "row",
          fields: [
            { name: "label", type: "text", required: true, admin: { width: "55%" } },
            { name: "url", type: "text", admin: { width: "35%", description: "/about or https://…" } },
            { name: "visible", type: "checkbox", defaultValue: true, admin: { width: "10%" } },
          ],
        },
        {
          name: "children",
          type: "array",
          labels: { singular: "Dropdown link", plural: "Dropdown links" },
          admin: { description: "Optional dropdown shown under this item." },
          fields: [
            {
              type: "row",
              fields: [
                { name: "label", type: "text", required: true, admin: { width: "55%" } },
                { name: "url", type: "text", required: true, admin: { width: "35%" } },
                { name: "visible", type: "checkbox", defaultValue: true, admin: { width: "10%" } },
              ],
            },
          ],
        },
      ],
    },
  ],
};

export const BroadcastSettings: GlobalConfig = {
  slug: "broadcast-settings",
  label: "Broadcast",
  admin: { group: "Broadcast" },
  access: { read: anyone, update: isAdmin },
  fields: [
    {
      name: "signature",
      type: "textarea",
      admin: { description: "Optional sign-off appended to broadcasts, e.g. “— Kingston Mosque”." },
    },
    {
      name: "whatsappJoinUrl",
      type: "text",
      admin: { description: "Public “join our WhatsApp updates” link/QR target shown to the community." },
    },
    { name: "telegramJoinUrl", type: "text", admin: { description: "Public Telegram channel/group link." } },
  ],
};

export const SiteSettings: GlobalConfig = {
  slug: "site-settings",
  label: "Site Settings",
  admin: { group: "Configuration" },
  access: { read: anyone, update: isAdmin },
  fields: [
    {
      type: "group",
      name: "contact",
      fields: [
        { name: "phone", type: "text" },
        { name: "email", type: "text" },
        { name: "addressLine1", type: "text" },
        { name: "city", type: "text" },
        { name: "postcode", type: "text" },
        { name: "mapsQuery", type: "text", admin: { description: "Address used for the map embed" } },
      ],
    },
    { name: "openingTimes", type: "textarea" },
    { name: "charityNumber", type: "text" },
    {
      name: "socials",
      type: "array",
      fields: [
        { name: "label", type: "text" },
        { name: "url", type: "text" },
      ],
    },
    {
      type: "group",
      name: "about",
      label: "About page",
      fields: [
        { name: "historyHeading", type: "text", defaultValue: "Our story" },
        {
          name: "historyBody",
          type: "textarea",
          admin: { description: "One paragraph per line (blank line between paragraphs)." },
        },
        {
          name: "facilities",
          type: "array",
          fields: [{ name: "item", type: "text" }],
        },
      ],
    },
  ],
};

export const JummahSettings: GlobalConfig = {
  slug: "jummah-settings",
  label: "Jummah Times",
  admin: { group: "Prayer Times" },
  access: { read: anyone, update: isPrayerManager },
  fields: [
    { name: "intro", type: "textarea" },
    {
      name: "congregations",
      type: "array",
      labels: { singular: "Congregation", plural: "Congregations" },
      fields: [
        { name: "name", type: "text", admin: { description: "e.g. First Jummah" } },
        { name: "language", type: "text" },
        { name: "doors", type: "text" },
        { name: "khutbah", type: "text" },
      ],
    },
  ],
};

export const DonationSettings: GlobalConfig = {
  slug: "donation-settings",
  label: "Donations",
  admin: { group: "Configuration" },
  access: { read: anyone, update: isAdmin },
  fields: [
    { name: "heading", type: "text" },
    { name: "body", type: "textarea" },
    {
      name: "donateUrl",
      type: "text",
      label: "Online giving link",
      admin: {
        description:
          "Paste your donation page link (e.g. Stripe Payment Link, Donorbox, JustGiving). When set, a Donate button with quick amounts appears on the site. Apple Pay / Google Pay are handled by that platform's checkout.",
      },
    },
    {
      name: "presetAmounts",
      type: "text",
      label: "Quick amounts (£)",
      defaultValue: "5, 10, 25, 50, 100",
      admin: { description: "Comma-separated, e.g. 5, 10, 25, 50, 100" },
    },
    {
      name: "enableGiftAid",
      type: "checkbox",
      label: "Show Gift Aid (+25%) reminder",
      defaultValue: true,
    },
    {
      name: "enableMonthly",
      type: "checkbox",
      label: "Offer monthly giving",
      defaultValue: true,
    },
    {
      name: "bankDetails",
      type: "array",
      labels: { singular: "Bank detail", plural: "Bank details" },
      fields: [
        { name: "label", type: "text" },
        { name: "value", type: "text" },
      ],
    },
    {
      name: "campaigns",
      type: "array",
      labels: { singular: "Campaign", plural: "Campaigns" },
      admin: {
        description:
          "Donation campaigns shown in the app and on the website — e.g. Masjid Expansion, Zakat, an emergency appeal. Add temporary appeals here (Ramadan, Eid, emergencies) and untick Active to retire them. The app updates within a minute; no app release needed.",
      },
      fields: [
        {
          type: "row",
          fields: [
            { name: "icon", type: "text", admin: { width: "15%", description: "Emoji, e.g. 🕌" } },
            { name: "title", type: "text", required: true, admin: { width: "55%" } },
            { name: "featured", type: "checkbox", label: "Featured", admin: { width: "15%", description: "Show first, large" } },
            { name: "active", type: "checkbox", defaultValue: true, admin: { width: "15%" } },
          ],
        },
        {
          name: "description",
          type: "textarea",
          admin: { description: "One or two short sentences shown on the campaign card." },
        },
        {
          type: "row",
          fields: [
            { name: "goal", type: "number", admin: { width: "50%", description: "Target £ (optional — shows a progress bar)" } },
            { name: "raised", type: "number", admin: { width: "50%", description: "Raised so far £" } },
          ],
        },
        { name: "image", type: "upload", relationTo: "media", admin: { description: "Optional photo for the campaign card." } },
        { name: "link", type: "text", admin: { description: "Optional external appeal link (overrides the in-app checkout for this campaign)." } },
      ],
    },
  ],
};

export const SpecialSchedule: GlobalConfig = {
  slug: "special-schedule",
  label: "Ramadan & Eid",
  admin: { group: "Prayer Times" },
  access: { read: anyone, update: isPrayerManager },
  fields: [
    {
      type: "collapsible",
      label: "Ramadan",
      fields: [
        { name: "ramadanEnabled", type: "checkbox", label: "Show Ramadan section", defaultValue: false },
        { name: "ramadanHeading", type: "text", defaultValue: "Ramadan at Kingston Mosque" },
        { name: "ramadanIntro", type: "textarea" },
        {
          name: "ramadanItems",
          type: "array",
          labels: { singular: "Item", plural: "Items" },
          fields: [
            { name: "label", type: "text", admin: { description: "e.g. Taraweeh, Suhūr ends, Iftar" } },
            { name: "value", type: "text", admin: { description: "e.g. After Isha, see timetable" } },
          ],
        },
      ],
    },
    {
      type: "collapsible",
      label: "Eid",
      fields: [
        { name: "eidEnabled", type: "checkbox", label: "Show Eid section", defaultValue: false },
        { name: "eidTitle", type: "text", admin: { description: "e.g. Eid al-Adha" } },
        { name: "eidDateText", type: "text", admin: { description: "e.g. Saturday 28 March (subject to moon sighting)" } },
        {
          name: "eidPrayers",
          type: "array",
          labels: { singular: "Jamā‘ah", plural: "Eid prayers" },
          fields: [
            { name: "label", type: "text", admin: { description: "e.g. First Jamā‘ah" } },
            { name: "time", type: "text" },
            { name: "location", type: "text" },
          ],
        },
        { name: "eidNotes", type: "textarea" },
      ],
    },
  ],
};

/* ------------------------------- Mobile App ------------------------------- */
// Everything the iOS/Android app shows that isn't already CMS content: the
// welcome line, quick actions, multimedia links and the monthly-timetable PDF.
// The app refreshes from the snapshot feed, so edits here reach phones within
// a minute — no app-store release needed.
export const AppSettings: GlobalConfig = {
  slug: "app-settings",
  label: "Mobile App",
  admin: { group: "Configuration" },
  access: { read: anyone, update: isAdmin },
  fields: [
    {
      name: "welcome",
      type: "text",
      defaultValue: "As-salāmu ʿalaykum",
      admin: { description: "Greeting shown at the top of the app's Home screen." },
    },
    {
      name: "timetablePdfUrl",
      type: "text",
      admin: {
        description:
          "Link to the printable monthly timetable (PDF). The app's Download button opens this. Leave blank to send people to the website's prayer-times page.",
      },
    },
    {
      name: "quickLinks",
      type: "array",
      labels: { singular: "Quick action", plural: "Quick actions" },
      admin: { description: "Buttons on the app home screen (kept to the first 4). Emoji make good icons." },
      fields: [
        { name: "icon", type: "text", admin: { description: "An emoji, e.g. 💛", width: "20%" } },
        { name: "label", type: "text", required: true, admin: { width: "35%" } },
        { name: "url", type: "text", required: true, admin: { description: "Full link or a site path like /donate", width: "45%" } },
      ],
    },
    {
      name: "mediaLinks",
      type: "array",
      labels: { singular: "Media link", plural: "Media links" },
      admin: {
        description:
          "The app's Media tab: khutbahs, lectures, YouTube, podcasts… Each opens in the in-app browser.",
      },
      fields: [
        {
          name: "kind",
          type: "select",
          defaultValue: "video",
          options: [
            { label: "Video / YouTube", value: "video" },
            { label: "Audio / podcast", value: "audio" },
            { label: "PDF / document", value: "pdf" },
            { label: "Other link", value: "link" },
          ],
          admin: { width: "30%" },
        },
        { name: "label", type: "text", required: true, admin: { width: "35%" } },
        { name: "url", type: "text", required: true, admin: { width: "35%" } },
      ],
    },
  ],
};
