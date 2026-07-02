"use client";

import { useState } from "react";

/* App-style quick-give panel. Pick an amount (or enter your own), choose one-off
   or monthly, see the Gift Aid uplift, and continue to the mosque's giving
   platform — where Apple Pay / Google Pay are offered at checkout. The platform
   link, amounts and toggles are all set in the admin (Donations settings). */

type Props = {
  donateUrl: string;
  presets: number[];
  giftAid: boolean;
  monthly: boolean;
};

export default function QuickDonate({ donateUrl, presets, giftAid, monthly }: Props) {
  const [amount, setAmount] = useState<number>(presets[1] ?? presets[0] ?? 10);
  const [custom, setCustom] = useState("");
  const [freq, setFreq] = useState<"once" | "monthly">("once");
  const [giftAidOn, setGiftAidOn] = useState(false);

  const effective = custom ? Math.max(0, parseInt(custom, 10) || 0) : amount;
  const withGiftAid = giftAidOn ? Math.round(effective * 1.25) : effective;

  function go() {
    if (!effective) return;
    const url = new URL(donateUrl);
    // Best-effort hints — most platforms read `amount`; harmless if ignored.
    url.searchParams.set("amount", String(effective));
    url.searchParams.set("frequency", freq);
    if (giftAidOn) url.searchParams.set("giftaid", "true");
    window.open(url.toString(), "_blank", "noopener,noreferrer");
  }

  return (
    <div className="qd">
      {monthly && (
        <div className="qd__freq" role="tablist" aria-label="Donation frequency">
          <button
            type="button"
            role="tab"
            aria-selected={freq === "once"}
            className={`qd__freq-btn${freq === "once" ? " is-active" : ""}`}
            onClick={() => setFreq("once")}
          >
            One-off
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={freq === "monthly"}
            className={`qd__freq-btn${freq === "monthly" ? " is-active" : ""}`}
            onClick={() => setFreq("monthly")}
          >
            Monthly
          </button>
        </div>
      )}

      <div className="qd__amounts">
        {presets.map((p) => (
          <button
            key={p}
            type="button"
            className={`qd__amt${!custom && amount === p ? " is-active" : ""}`}
            onClick={() => {
              setAmount(p);
              setCustom("");
            }}
          >
            £{p}
          </button>
        ))}
        <div className={`qd__custom${custom ? " is-active" : ""}`}>
          <span>£</span>
          <input
            inputMode="numeric"
            pattern="[0-9]*"
            placeholder="Other"
            value={custom}
            onChange={(e) => setCustom(e.target.value.replace(/[^0-9]/g, ""))}
            aria-label="Other amount in pounds"
          />
        </div>
      </div>

      {giftAid && (
        <label className="qd__giftaid">
          <input type="checkbox" checked={giftAidOn} onChange={(e) => setGiftAidOn(e.target.checked)} />
          <span>
            <b>Add Gift Aid</b> — UK taxpayers boost their gift by 25% at no extra cost
          </span>
        </label>
      )}

      <button type="button" className="qd__cta" onClick={go} disabled={!effective}>
        Donate £{effective || 0}
        {freq === "monthly" ? "/mo" : ""}
        {giftAidOn && effective ? ` (£${withGiftAid} with Gift Aid)` : ""}
      </button>
      <p className="qd__secure">
        <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
          <rect x="4" y="10" width="16" height="11" rx="2" />
          <path d="M8 10V7a4 4 0 0 1 8 0v3" />
        </svg>
        Secure checkout · Apple Pay &amp; Google Pay supported
      </p>
    </div>
  );
}
