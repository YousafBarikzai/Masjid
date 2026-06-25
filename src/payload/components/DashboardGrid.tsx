import React from "react";
import "../components/dashboard.css";
import type { Payload } from "payload";
import { Greeting } from "./widgets/Greeting";
import { NextPrayerWidget } from "./widgets/NextPrayerWidget";
import { QuickActions } from "./widgets/QuickActions";
import { PendingDrafts } from "./widgets/PendingDrafts";
import { RecentlyEdited } from "./widgets/RecentlyEdited";
import { UnhandledMessages } from "./widgets/UnhandledMessages";
import { RecentMedia } from "./widgets/RecentMedia";
import { BroadcastStatus } from "./widgets/BroadcastStatus";
import { Favourites } from "./widgets/Favourites";

/* Registered at admin.components.beforeDashboard. A server component, so Payload passes
   { payload, user, ... } directly (only RSCs receive serverProps). Each child widget is
   independently fail-safe (catches its own errors → renders null), so one failing query
   can never blank the dashboard. */

export async function DashboardGrid(props: {
  payload: Payload;
  user?: { name?: string; roles?: string[] } | null;
}) {
  const { payload, user } = props;
  const roles = Array.isArray(user?.roles) ? (user!.roles as string[]) : [];

  // Resolve the async server widgets in parallel; each already catches its own
  // errors and resolves to null, so Promise.all never rejects.
  const [prayer, recent, drafts, messages, media, broadcast] = await Promise.all([
    NextPrayerWidget(),
    RecentlyEdited({ payload }),
    PendingDrafts({ payload }),
    UnhandledMessages({ payload }),
    RecentMedia({ payload }),
    BroadcastStatus({ payload }),
  ]);

  return (
    <div className="kma-dash" data-kma>
      <Greeting name={user?.name} />
      <div className="kma-grid">
        {prayer}
        <QuickActions roles={roles} />
        {recent}
        {drafts}
        {messages}
        {broadcast}
        {media}
        <Favourites />
      </div>
    </div>
  );
}
