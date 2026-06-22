"use client";

import { useState } from "react";

/**
 * Newsletter sign-up. Posts to /app-api/subscribe, which adds the address to the
 * Broadcast "Subscribers" list (email opt-in) so the mosque can email updates.
 */
export default function Newsletter({ light = false }: { light?: boolean }) {
  const [email, setEmail] = useState("");
  const [state, setState] = useState<"idle" | "loading" | "done" | "error">("idle");

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!email) return;
    setState("loading");
    try {
      const r = await fetch("/app-api/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, source: "website newsletter" }),
      });
      setState(r.ok ? "done" : "error");
    } catch {
      setState("error");
    }
  }

  return (
    <div className={`newsletter ${light ? "newsletter-light" : ""}`}>
      <div className="newsletter-text">
        <h3>Stay connected</h3>
        <p>Get prayer-time changes, events and community news straight to your inbox.</p>
      </div>
      {state === "done" ? (
        <p className="newsletter-done">✓ Thank you — you’re subscribed.</p>
      ) : (
        <form className="newsletter-form" onSubmit={submit}>
          <input
            type="email"
            required
            placeholder="Your email address"
            aria-label="Your email address"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <button className="btn btn-gold" type="submit" disabled={state === "loading"}>
            {state === "loading" ? "…" : "Subscribe"}
          </button>
        </form>
      )}
      {state === "error" && <p className="newsletter-err">Sorry, something went wrong. Please try again.</p>}
    </div>
  );
}
