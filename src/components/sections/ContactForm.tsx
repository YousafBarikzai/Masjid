"use client";

import { useEffect, useState } from "react";
import { queueContact, flushOutbox, registerBackgroundSync } from "@/lib/outbox";

export default function ContactForm() {
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "queued" | "error">("idle");

  // Flush any messages queued offline when we load and whenever we come back online.
  useEffect(() => {
    flushOutbox();
    const onOnline = () => flushOutbox();
    window.addEventListener("online", onOnline);
    return () => window.removeEventListener("online", onOnline);
  }, []);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const data = Object.fromEntries(new FormData(form).entries());
    setStatus("sending");
    try {
      if (typeof navigator !== "undefined" && navigator.onLine === false) {
        throw new Error("offline");
      }
      const res = await fetch("/api/contact-submissions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Request failed");
      setStatus("sent");
      form.reset();
    } catch {
      // Couldn't reach the server — queue it and replay when back online.
      try {
        await queueContact(data);
        await registerBackgroundSync();
        setStatus("queued");
        form.reset();
      } catch {
        setStatus("error");
      }
    }
  }

  if (status === "sent") {
    return (
      <div className="note-box" role="status">
        🤲 Thank you — your message has been received. We&apos;ll be in touch soon, inshā&apos;Allah.
      </div>
    );
  }

  if (status === "queued") {
    return (
      <div className="note-box" role="status">
        📨 You&apos;re offline, so we&apos;ve saved your message — it will send automatically as soon
        as you&apos;re back online. You can close the app safely.
      </div>
    );
  }

  return (
    <form className="contact-form" onSubmit={onSubmit}>
      <div className="cf-row">
        <label>
          Name *
          <input name="name" required autoComplete="name" />
        </label>
        <label>
          Email *
          <input name="email" type="email" required autoComplete="email" />
        </label>
      </div>
      <div className="cf-row">
        <label>
          Phone
          <input name="phone" autoComplete="tel" />
        </label>
        <label>
          Subject
          <input name="subject" />
        </label>
      </div>
      <label>
        Message *
        <textarea name="message" rows={5} required />
      </label>
      {/* honeypot — hidden from real users */}
      <input name="company" tabIndex={-1} autoComplete="off" className="cf-hp" aria-hidden="true" />
      <div className="cf-actions">
        <button className="btn btn-green" type="submit" disabled={status === "sending"}>
          {status === "sending" ? "Sending…" : "Send message"}
        </button>
        {status === "error" && (
          <span className="cf-error">Sorry, something went wrong. Please try again or call us.</span>
        )}
      </div>
    </form>
  );
}
