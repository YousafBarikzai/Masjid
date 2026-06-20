import type { GlobalConfig } from "payload";
import { anyone, isAdmin, isPrayerManager } from "./access";

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
