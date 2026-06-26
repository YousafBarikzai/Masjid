import React from "react";
import "../components/dashboard.css";
import type { Payload } from "payload";
import { londonTodayISO, formatGregorian, formatHijri } from "@/lib/prayer";
import { NextPrayerWidget } from "./widgets/NextPrayerWidget";
import { QuickCreate } from "./widgets/QuickCreate";
import { RecentContent } from "./widgets/RecentContent";
import { AttentionCards } from "./widgets/AttentionCards";
import { BroadcastStatus } from "./widgets/BroadcastStatus";
import { DashboardHeaderActions } from "./widgets/DashboardHeaderActions";

/* Registered at admin.components.beforeDashboard. A server component (Payload passes
   { payload, user }). Renders the full "command centre" dashboard; the default Payload
   dashboard groups below it are hidden via CSS. Each widget is fail-safe. */

export async function DashboardGrid(props: {
  payload: Payload;
  user?: { name?: string; roles?: string[] } | null;
}) {
  const { payload, user } = props;
  const roles = Array.isArray(user?.roles) ? (user!.roles as string[]) : [];
  const first = (user?.name || "").trim().split(/\s+/)[0] || "";

  let gregorian = "";
  let hijri = "";
  try {
    const iso = londonTodayISO();
    gregorian = formatGregorian(iso);
    hijri = formatHijri(iso);
  } catch {
    /* best-effort */
  }

  let unread = 0;
  try {
    const r = await payload.count({
      collection: "contact-submissions",
      where: { handled: { equals: false } },
      overrideAccess: true,
    });
    unread = r.totalDocs;
  } catch {
    /* ignore */
  }

  const [attention, prayer, recent, broadcast] = await Promise.all([
    AttentionCards({ payload }),
    NextPrayerWidget(),
    RecentContent({ payload }),
    BroadcastStatus({ payload }),
  ]);

  return (
    <div className="kma-dash" data-kma>
      <header className="kma-top">
        <div>
          <div className="kma-top__date">
            {gregorian}
            {hijri ? ` · ${hijri}` : ""}
          </div>
          <h2 className="kma-top__hello">
            As-salāmu ʿalaykum{first ? <span className="kma-top__name">, {first}</span> : ""}
          </h2>
        </div>
        <DashboardHeaderActions unread={unread} />
      </header>

      {attention}

      <div className="kma-cols">
        <div className="kma-col kma-col--main">
          <QuickCreate roles={roles} />
          {recent}
        </div>
        <div className="kma-col kma-col--side">
          {prayer}
          {broadcast}
        </div>
      </div>
    </div>
  );
}
