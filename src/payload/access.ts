import type { Access, FieldAccess } from "payload";

type Role =
  | "super-admin"
  | "admin"
  | "editor"
  | "updater"
  | "prayer-times-manager"
  | "contributor"
  | "membership-manager"
  | "volunteer-manager"
  | "volunteer-viewer"
  | "nikah-admin"
  | "nikah-reviewer";

function hasRole(user: unknown, ...roles: Role[]): boolean {
  const u = user as { roles?: Role[] } | null | undefined;
  return !!u && Array.isArray(u.roles) && u.roles.some((r) => roles.includes(r));
}

/** Staff who may see and manage membership applications (personal data). */
export const isMembershipStaff: Access = ({ req: { user } }) =>
  hasRole(user, "super-admin", "admin", "membership-manager");

/** Same check, usable outside Payload's Access signature. */
export const userIsMembershipStaff = (user: unknown): boolean =>
  hasRole(user, "super-admin", "admin", "membership-manager");

/** Staff who may SEE volunteers (viewers included — personal data, read-only). */
export const isVolunteerStaff: Access = ({ req: { user } }) =>
  hasRole(user, "super-admin", "admin", "volunteer-manager", "volunteer-viewer");

/** Staff who may MANAGE volunteers (status, notes, contact, categories). */
export const isVolunteerManager: Access = ({ req: { user } }) =>
  hasRole(user, "super-admin", "admin", "volunteer-manager");

/** Boolean forms for use inside hooks/components. */
export const userIsVolunteerStaff = (user: unknown): boolean =>
  hasRole(user, "super-admin", "admin", "volunteer-manager", "volunteer-viewer");
export const userIsVolunteerManager = (user: unknown): boolean =>
  hasRole(user, "super-admin", "admin", "volunteer-manager");

/** Field-level: volunteer managers only (internal notes, safeguarding). */
export const isVolunteerManagerFieldLevel: FieldAccess = ({ req: { user } }) =>
  hasRole(user, "super-admin", "admin", "volunteer-manager");

/** Nikah service staff (reviewers included — may read applications, add notes). */
export const isNikahStaff: Access = ({ req: { user } }) =>
  hasRole(user, "super-admin", "admin", "nikah-admin", "nikah-reviewer");

/** Nikah administrators — approvals, introductions, safeguarding, decisions. */
export const isNikahAdmin: Access = ({ req: { user } }) =>
  hasRole(user, "super-admin", "admin", "nikah-admin");

export const userIsNikahStaff = (user: unknown): boolean =>
  hasRole(user, "super-admin", "admin", "nikah-admin", "nikah-reviewer");
export const userIsNikahAdmin = (user: unknown): boolean =>
  hasRole(user, "super-admin", "admin", "nikah-admin");

/** Field-level: nikah admins only (verification, mosque-only identity data). */
export const isNikahAdminFieldLevel: FieldAccess = ({ req: { user } }) =>
  hasRole(user, "super-admin", "admin", "nikah-admin");

/** Anyone (public read for site content). */
export const anyone: Access = () => true;

/** Any signed-in staff member. */
export const isStaff: Access = ({ req: { user } }) => !!user;

/** Editors and above can create/update content. */
export const isEditor: Access = ({ req: { user } }) =>
  hasRole(user, "super-admin", "admin", "editor");

/** Updaters ("edit only") and above may EDIT existing content — but updaters may
 *  not create new items or delete. Used for the update rule on content collections. */
export const isUpdater: Access = ({ req: { user } }) =>
  hasRole(user, "super-admin", "admin", "editor", "updater");

/** Contributors and above can CREATE content (contributors: drafts only —
 *  publishing is gated to editors via editorial.ts). Updaters are deliberately
 *  NOT here: their role is edit-existing-only. */
export const isContributor: Access = ({ req: { user } }) =>
  hasRole(user, "super-admin", "admin", "editor", "contributor");

/** May EDIT existing content: everyone with a content role (updaters included,
 *  contributors included for their drafts). Used as the update rule. */
export const canEditContent: Access = ({ req: { user } }) =>
  hasRole(user, "super-admin", "admin", "editor", "updater", "contributor");

/** Plain boolean: may this user publish content (move a draft to live)? Used inside
 *  collection hooks, where the Access signature isn't available. */
export const userCanPublish = (user: unknown): boolean =>
  hasRole(user, "super-admin", "admin", "editor", "updater");

/** Admins manage configuration, users and destructive actions. */
export const isAdmin: Access = ({ req: { user } }) => hasRole(user, "super-admin", "admin");

/** Prayer-times managers (plus admins) manage the timetable & Jummah. */
export const isPrayerManager: Access = ({ req: { user } }) =>
  hasRole(user, "super-admin", "admin", "prayer-times-manager");

/** Field-level: only admins may edit (e.g. assigning roles). */
export const isAdminFieldLevel: FieldAccess = ({ req: { user } }) =>
  hasRole(user, "super-admin", "admin");
