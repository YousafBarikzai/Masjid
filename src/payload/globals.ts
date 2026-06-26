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
      fields: [
        { name: "title", type: "text" },
        { name: "goal", type: "number" },
        { name: "raised", type: "number" },
        { name: "image", type: "upload", relationTo: "media" },
        { name: "link", type: "text" },
        { name: "active", type: "checkbox", defaultValue: true },
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
