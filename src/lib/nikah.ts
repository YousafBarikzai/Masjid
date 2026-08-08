import "server-only";
import { headers as nextHeaders } from "next/headers";
import { getPayloadClient } from "@/lib/payloadClient";
import {
  EDUCATION_LEVELS,
  MARITAL_STATUSES,
  PRACTISING_LEVELS,
  TIMEFRAMES,
  ageFromDob,
} from "@/payload/nikah";

/** Authenticate the calling nikah member (JWT or cookie). An absent Origin on
 *  same-origin requests is injected as the server URL — the same CSRF-safe
 *  pattern as the membership APIs. */
export async function authedNikahMember() {
  const payload = await getPayloadClient();
  const h = new Headers(await nextHeaders());
  if (!h.get("origin")) h.set("origin", payload.config.serverURL || "");
  const { user } = await payload.auth({ headers: h });
  if (!user || (user as { collection?: string }).collection !== "nikah-profiles") return { payload, member: null as Record<string, any> | null };
  const member = (await payload.findByID({
    collection: "nikah-profiles" as never,
    id: user.id,
    depth: 0,
    overrideAccess: true,
  })) as Record<string, any>;
  return { payload, member };
}

/* Server-side profile views for the nikah service. The THREE-TIER visibility
   model lives here and ONLY here — every surface (web, iOS, Android) receives
   pre-anonymised data, so no client ever holds information it must hide. */

type AnyDoc = Record<string, any>;

const label = (list: readonly { label: string; value: string }[], v: unknown): string =>
  list.find((o) => o.value === v)?.label || "";

/** The anonymised matrimonial CARD — what appears in search results.
 *  No name, no photo, no contacts, no exact location. */
export function nikahCard(p: AnyDoc): AnyDoc {
  return {
    id: p.id,
    reference: p.reference || "Pending",
    gender: p.gender,
    age: ageFromDob(p.dateOfBirth),
    area: p.townCity || "",
    ethnicity: p.ethnicity || "",
    languages: p.languages || "",
    maritalStatus: label(MARITAL_STATUSES, p.maritalStatus),
    hasChildren: Boolean(p.hasChildren),
    practising: label(PRACTISING_LEVELS, p.practising),
    education: label(EDUCATION_LEVELS, p.educationLevel),
    profession: p.profession || "",
    heightCm: p.heightCm || null,
    timeframe: label(TIMEFRAMES, p.timeframe),
    willingToRelocate: Boolean(p.willingToRelocate),
  };
}

/** The FULL member-visible profile — the card plus the written sections.
 *  Still anonymous: identity stays with the mosque. */
export function nikahProfileView(p: AnyDoc): AnyDoc {
  return {
    ...nikahCard(p),
    childrenDetails: p.hasChildren ? p.childrenDetails || "" : "",
    background: p.background === "revert" ? "Revert" : p.background === "born" ? "Born Muslim" : "",
    faithNotes: p.faithNotes || "",
    aboutMe: p.aboutMe || "",
    familyBackground: p.familyBackground || "",
    relocateWhere: p.willingToRelocate ? p.relocateWhere || "" : "",
    lookingFor: p.lookingFor || "",
    essentials: p.essentials || "",
  };
}

/** What a member sees of THEIR OWN account. */
export function nikahOwnView(p: AnyDoc): AnyDoc {
  return {
    id: p.id,
    firstName: p.firstName,
    email: p.email,
    gender: p.gender,
    status: p.status,
    statusLabel:
      {
        submitted: "Submitted — with the Nikah team",
        "under-review": "Under review",
        "info-required": "More information needed — check your email",
        verification: "Verification in progress",
        approved: "Approved — your profile is live",
        paused: "Paused at your request",
        rejected: "Not approved",
        suspended: "Suspended — contact the mosque office",
        withdrawn: "Withdrawn",
      }[String(p.status)] || String(p.status),
    reference: p.reference || null,
    profileHidden: Boolean(p.profileHidden),
    managementMode: p.managementMode || "joint",
    // Their own editable profile content:
    profile: nikahProfileView(p),
    editable: {
      townCity: p.townCity || "",
      profession: p.profession || "",
      faithNotes: p.faithNotes || "",
      aboutMe: p.aboutMe || "",
      familyBackground: p.familyBackground || "",
      lookingFor: p.lookingFor || "",
      essentials: p.essentials || "",
      timeframe: p.timeframe || "",
      willingToRelocate: Boolean(p.willingToRelocate),
      relocateWhere: p.relocateWhere || "",
      prefAgeMin: p.prefAgeMin || null,
      prefAgeMax: p.prefAgeMax || null,
      acceptsChildren: Boolean(p.acceptsChildren),
    },
  };
}
