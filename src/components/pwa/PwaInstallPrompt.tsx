"use client";

import { useEffect, useState } from "react";

/* Branded "Add to Home Screen" prompt for phones.
   - Android / Chromium: captures the native `beforeinstallprompt` event and
     shows our own banner with an Install button that triggers the real dialog.
   - iOS Safari: no install event exists, so we show a short hint pointing at the
     Share → "Add to Home Screen" flow.
   It never shows when the site is already running installed (standalone), on
   desktop, or once the visitor has dismissed it (remembered for 14 days). */

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

const DISMISS_KEY = "kma-pwa-install-dismissed";
const DISMISS_DAYS = 14;

function dismissedRecently(): boolean {
  try {
    const raw = localStorage.getItem(DISMISS_KEY);
    if (!raw) return false;
    const when = Number(raw);
    if (!when) return false;
    return Date.now() - when < DISMISS_DAYS * 24 * 60 * 60 * 1000;
  } catch {
    return false;
  }
}

function isStandalone(): boolean {
  if (typeof window === "undefined") return false;
  return (
    window.matchMedia?.("(display-mode: standalone)").matches ||
    // iOS Safari exposes this non-standard flag instead of display-mode.
    (window.navigator as unknown as { standalone?: boolean }).standalone === true
  );
}

function isIos(): boolean {
  if (typeof navigator === "undefined") return false;
  const ua = navigator.userAgent;
  const iDevice = /iphone|ipad|ipod/i.test(ua);
  // iPadOS 13+ reports as Mac; detect the touch Mac too.
  const iPadOs = navigator.platform === "MacIntel" && (navigator as Navigator).maxTouchPoints > 1;
  return iDevice || iPadOs;
}

export default function PwaInstallPrompt() {
  const [deferred, setDeferred] = useState<BeforeInstallPromptEvent | null>(null);
  const [mode, setMode] = useState<"none" | "android" | "ios">("none");
  const [closing, setClosing] = useState(false);

  useEffect(() => {
    if (isStandalone() || dismissedRecently()) return;

    // Only worth prompting on phone-sized viewports — desktop users don't "install".
    const isPhone = window.matchMedia("(max-width: 820px)").matches;
    if (!isPhone) return;

    const onBeforeInstall = (e: Event) => {
      e.preventDefault();
      setDeferred(e as BeforeInstallPromptEvent);
      setMode("android");
    };
    window.addEventListener("beforeinstallprompt", onBeforeInstall);

    // Hide and remember once the app is actually installed.
    const onInstalled = () => {
      try {
        localStorage.setItem(DISMISS_KEY, String(Date.now()));
      } catch {
        /* ignore */
      }
      setMode("none");
      setDeferred(null);
    };
    window.addEventListener("appinstalled", onInstalled);

    // iOS never fires beforeinstallprompt — show the manual hint after a beat so
    // it doesn't fight the first paint.
    let iosTimer: ReturnType<typeof setTimeout> | undefined;
    if (isIos()) {
      iosTimer = setTimeout(() => {
        setMode((m) => (m === "none" ? "ios" : m));
      }, 2500);
    }

    return () => {
      window.removeEventListener("beforeinstallprompt", onBeforeInstall);
      window.removeEventListener("appinstalled", onInstalled);
      if (iosTimer) clearTimeout(iosTimer);
    };
  }, []);

  function remember() {
    try {
      localStorage.setItem(DISMISS_KEY, String(Date.now()));
    } catch {
      /* ignore */
    }
  }

  function close() {
    setClosing(true);
    remember();
    setTimeout(() => setMode("none"), 220);
  }

  async function install() {
    if (!deferred) return;
    try {
      await deferred.prompt();
      await deferred.userChoice;
    } catch {
      /* ignore */
    }
    remember();
    setDeferred(null);
    setMode("none");
  }

  if (mode === "none") return null;

  return (
    <div
      className={`pwa-install${closing ? " is-closing" : ""}`}
      role="dialog"
      aria-label="Install Kingston Mosque app"
    >
      <div className="pwa-install__card">
        <div className="pwa-install__icon" aria-hidden="true">
          <img src="/icons/icon-192.png" alt="" width={44} height={44} />
        </div>
        <div className="pwa-install__body">
          <p className="pwa-install__title">Add Kingston Mosque to your phone</p>
          {mode === "android" ? (
            <p className="pwa-install__text">
              Install the app for instant prayer times — even offline. No app store needed.
            </p>
          ) : (
            <p className="pwa-install__text">
              Tap <span className="pwa-install__share" aria-hidden="true">⎙</span>{" "}
              <strong>Share</strong>, then <strong>“Add to Home Screen”</strong> for instant,
              offline-ready prayer times.
            </p>
          )}
          <div className="pwa-install__actions">
            {mode === "android" && (
              <button type="button" className="pwa-install__btn" onClick={install}>
                Install app
              </button>
            )}
            <button type="button" className="pwa-install__dismiss" onClick={close}>
              Not now
            </button>
          </div>
        </div>
        <button
          type="button"
          className="pwa-install__x"
          onClick={close}
          aria-label="Dismiss"
        >
          ×
        </button>
      </div>
    </div>
  );
}
