"use client";

import { useEffect, useState } from "react";

/* A gentle connection-status strip. Slides in when the device goes offline
   ("showing saved times") and briefly confirms when the connection returns.
   Pairs with the service worker, which serves cached prayer times offline. */
export default function OfflineBanner() {
  const [offline, setOffline] = useState(false);
  const [restored, setRestored] = useState(false);

  useEffect(() => {
    // Start from the real state (navigator.onLine is false only when truly offline).
    if (navigator.onLine === false) setOffline(true);

    let restoreTimer: ReturnType<typeof setTimeout> | undefined;
    const goOffline = () => {
      setRestored(false);
      setOffline(true);
    };
    const goOnline = () => {
      setOffline((wasOffline) => {
        if (wasOffline) {
          setRestored(true);
          restoreTimer = setTimeout(() => setRestored(false), 2600);
        }
        return false;
      });
    };

    window.addEventListener("offline", goOffline);
    window.addEventListener("online", goOnline);
    return () => {
      window.removeEventListener("offline", goOffline);
      window.removeEventListener("online", goOnline);
      if (restoreTimer) clearTimeout(restoreTimer);
    };
  }, []);

  if (!offline && !restored) return null;

  return (
    <div className={`netbar${offline ? " is-off" : " is-on"}`} role="status" aria-live="polite">
      {offline ? (
        <>
          <span className="netbar__dot" aria-hidden />
          You're offline — showing saved prayer times
        </>
      ) : (
        <>
          <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
            <path d="m20 6-11 11-5-5" />
          </svg>
          Back online
        </>
      )}
    </div>
  );
}
