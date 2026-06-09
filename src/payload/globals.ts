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
