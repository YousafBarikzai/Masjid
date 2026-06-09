import type { Access, FieldAccess } from "payload";

type Role = "super-admin" | "admin" | "editor" | "prayer-times-manager" | "contributor";

function hasRole(user: unknown, ...roles: Role[]): boolean {
  const u = user as { roles?: Role[] } | null | undefined;
  return !!u && Array.isArray(u.roles) && u.roles.some((r) => roles.includes(r));
}

/** Anyone (public read for site content). */
export const anyone: Access = () => true;

/** Any signed-in staff member. */
export const isStaff: Access = ({ req: { user } }) => !!user;

/** Editors and above can create/update content. */
export const isEditor: Access = ({ req: { user } }) =>
  hasRole(user, "super-admin", "admin", "editor");

/** Admins manage configuration, users and destructive actions. */
export const isAdmin: Access = ({ req: { user } }) => hasRole(user, "super-admin", "admin");

/** Prayer-times managers (plus admins) manage the timetable & Jummah. */
export const isPrayerManager: Access = ({ req: { user } }) =>
  hasRole(user, "super-admin", "admin", "prayer-times-manager");

/** Field-level: only admins may edit (e.g. assigning roles). */
export const isAdminFieldLevel: FieldAccess = ({ req: { user } }) =>
  hasRole(user, "super-admin", "admin");
