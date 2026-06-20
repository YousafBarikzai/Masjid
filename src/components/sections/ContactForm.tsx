"use client";

import { useState } from "react";

export default function ContactForm() {
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">("idle");

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const data = Object.fromEntries(new FormData(form).entries());
    setStatus("sending");
    try {
      const res = await fetch("/api/contact-submissions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Request failed");
      setStatus("sent");
      form.reset();
    } catch {
      setStatus("error");
    }
  }

  if (status === "sent") {
    return (
      <div className="note-box" role="status">
        🤲 Thank you — your message has been received. We&apos;ll be in touch soon, inshā&apos;Allah.
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
