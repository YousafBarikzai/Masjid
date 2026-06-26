"use client";

import { useEffect, useState } from "react";

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

export default function PushOptIn() {
  const [state, setState] = useState<State>("loading");

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
      const res = await fetch("/app-api/push-subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ subscription: sub.toJSON(), topics: ["news", "events"] }),
      });
      if (!res.ok) throw new Error("register failed");
      setState("on");
    } catch {
      setState("error");
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
    <div className="pushrow">
      <span className="pushrow__icon" aria-hidden>
        <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <path d="M18 8a6 6 0 1 0-12 0c0 7-3 9-3 9h18s-3-2-3-9" />
          <path d="M13.7 21a2 2 0 0 1-3.4 0" />
        </svg>
      </span>
      <span className="pushrow__text">
        <b>Prayer &amp; event alerts</b>
        <small>
          {state === "on"
            ? "You're subscribed to mosque notifications"
            : state === "denied"
              ? "Blocked — enable notifications in your browser settings"
              : state === "error"
                ? "Couldn't enable — please try again"
                : "Get notified about announcements and events"}
        </small>
      </span>
      {state === "on" ? (
        <button type="button" className="pushrow__btn is-on" onClick={disable}>
          On
        </button>
      ) : state === "denied" ? (
        <span className="pushrow__btn is-off" aria-disabled>
          Off
        </span>
      ) : (
        <button type="button" className="pushrow__btn" onClick={enable} disabled={state === "subscribing"}>
          {state === "subscribing" ? "…" : "Enable"}
        </button>
      )}
    </div>
  );
}
