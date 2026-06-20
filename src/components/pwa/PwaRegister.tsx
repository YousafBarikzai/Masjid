"use client";

import { useEffect } from "react";

// Registers the public-site service worker after load so it never competes
// with the first paint. Silent on failure (e.g. unsupported browser, http dev).
export default function PwaRegister() {
  useEffect(() => {
    if (!("serviceWorker" in navigator)) return;
    const register = () => {
      navigator.serviceWorker.register("/sw.js").catch(() => {});
    };
    if (document.readyState === "complete") {
      register();
      return;
    }
    window.addEventListener("load", register);
    return () => window.removeEventListener("load", register);
  }, []);

  return null;
}
