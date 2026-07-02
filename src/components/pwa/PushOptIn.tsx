"use client";

import { useEffect, useState } from "react";
import { useI18n } from "@/lib/i18n";

/* "Enable notifications" control for the More sheet. Subscribes the browser /
   installed PWA to Web Push and registers it with the server. Renders nothing
   when push isn't supported or the VAPID public key isn't configured, so it's
   inert until the mosque sets up keys. iOS only supports this in the INSTALLED
   app (iOS 16.4+), which is another reason to prompt installation. */

const PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || "";

function urlBase64ToUint8Array(base64: string): Uint8Array {
  const padding = "=".repeat((4 - (base64.length % 4)) % 4);
  const b64 = (base64 + padding).replace(/-/g, "+").replace(/_/g, "/");
  const raw = atob(b64);
  const out = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; i++) out[i] = raw.charCodeAt(i);
  return out;
}

type State = "loading" | "unsupported" | "idle" | "subscribing" | "on" | "denied" | "error";

const PRAYER_KEY = "kma-prayer-reminders";
const PRAYER_OFFSET = 15; // minutes before jamāʿah (v1 default)

export default function PushOptIn() {
  const { t } = useI18n();
  const [state, setState] = useState<State>("loading");
  const [prayerOn, setPrayerOn] = useState(false);

  useEffect(() => {
    try {
      setPrayerOn(localStorage.getItem(PRAYER_KEY) === "on");
    } catch {
      /* ignore */
    }
  }, []);

  useEffect(() => {
    if (!PUBLIC_KEY) {
      setState("unsupported");
      return;
    }
    if (
      typeof window === "undefined" ||
      !("serviceWorker" in navigator) ||
      !("PushManager" in window) ||
      !("Notification" in window)
    ) {
      setState("unsupported");
      return;
    }
    if (Notification.permission === "denied") {
      setState("denied");
      return;
    }
    // Reflect an existing subscription.
    navigator.serviceWorker.ready
      .then((reg) => reg.pushManager.getSubscription())
      .then((sub) => setState(sub ? "on" : "idle"))
      .catch(() => setState("idle"));
  }, []);

  async function enable() {
    setState("subscribing");
    try {
      const permission = await Notification.requestPermission();
      if (permission !== "granted") {
        setState(permission === "denied" ? "denied" : "idle");
        return;
      }
      const reg = await navigator.serviceWorker.ready;
      let sub = await reg.pushManager.getSubscription();
      if (!sub) {
        sub = await reg.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(PUBLIC_KEY) as BufferSource,
        });
      }
      await register(sub, prayerOn);
      setState("on");
    } catch {
      setState("error");
    }
  }

  // Upsert the subscription with the current topic selection.
  async function register(sub: PushSubscription, prayer: boolean) {
    const topics = prayer ? ["news", "events", "prayer"] : ["news", "events"];
    const res = await fetch("/app-api/push-subscribe", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ subscription: sub.toJSON(), topics, reminderOffset: PRAYER_OFFSET }),
    });
    if (!res.ok) throw new Error("register failed");
  }

  // Toggle prayer-time reminders on the existing subscription.
  async function togglePrayer() {
    const next = !prayerOn;
    try {
      const reg = await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.getSubscription();
      if (!sub) return;
      await register(sub, next);
      setPrayerOn(next);
      try {
        localStorage.setItem(PRAYER_KEY, next ? "on" : "off");
      } catch {
        /* ignore */
      }
    } catch {
      /* ignore */
    }
  }

  async function disable() {
    try {
      const reg = await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.getSubscription();
      if (sub) {
        const endpoint = sub.endpoint;
        await sub.unsubscribe().catch(() => {});
        await fetch("/app-api/push-subscribe", {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ endpoint }),
        }).catch(() => {});
      }
      setState("idle");
    } catch {
      setState("idle");
    }
  }

  if (state === "loading" || state === "unsupported") return null;

  return (
    <>
    <div className="pushrow">
      <span className="pushrow__icon" aria-hidden>
        <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <path d="M18 8a6 6 0 1 0-12 0c0 7-3 9-3 9h18s-3-2-3-9" />
          <path d="M13.7 21a2 2 0 0 1-3.4 0" />
        </svg>
      </span>
      <span className="pushrow__text">
        <b>{t("push.title")}</b>
        <small>
          {state === "on"
            ? t("push.subscribed")
            : state === "denied"
              ? "Blocked — enable notifications in your browser settings"
              : state === "error"
                ? "Couldn't enable — please try again"
                : t("push.get")}
        </small>
      </span>
      {state === "on" ? (
        <button type="button" className="pushrow__btn is-on" onClick={disable}>
          {t("push.on")}
        </button>
      ) : state === "denied" ? (
        <span className="pushrow__btn is-off" aria-disabled>
          Off
        </span>
      ) : (
        <button type="button" className="pushrow__btn" onClick={enable} disabled={state === "subscribing"}>
          {state === "subscribing" ? "…" : t("push.enable")}
        </button>
      )}
    </div>

    {state === "on" && (
      <button
        type="button"
        className={`prayerrow${prayerOn ? " is-on" : ""}`}
        onClick={togglePrayer}
        aria-pressed={prayerOn}
      >
        <span className="prayerrow__icon" aria-hidden>
          <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="9" />
            <path d="M12 7v5l3 2" />
          </svg>
        </span>
        <span className="prayerrow__text">
          <b>{t("push.prayerTitle")}</b>
          <small>A nudge {PRAYER_OFFSET} minutes before each jamāʿah</small>
        </span>
        <span className={`prayerrow__switch${prayerOn ? " is-on" : ""}`} aria-hidden>
          <span className="knob" />
        </span>
      </button>
    )}
    </>
  );
}
