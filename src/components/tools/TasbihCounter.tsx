"use client";

import { useEffect, useState } from "react";

/* Digital tasbīḥ. Tap anywhere on the bead to count; it gently vibrates each
   tap and marks each completed set (33 by default), then loops. Count and the
   chosen dhikr persist locally, so it survives closing the app. Fully offline. */

const DHIKR = [
  { ar: "سُبْحَانَ ٱللَّٰه", tr: "SubḥānAllāh", target: 33 },
  { ar: "ٱلْحَمْدُ لِلَّٰه", tr: "Alḥamdulillāh", target: 33 },
  { ar: "ٱللَّٰهُ أَكْبَر", tr: "Allāhu akbar", target: 34 },
  { ar: "لَا إِلَٰهَ إِلَّا ٱللَّٰه", tr: "Lā ilāha illā-llāh", target: 100 },
];

const STORE = "kma-tasbih";

export default function TasbihCounter() {
  const [idx, setIdx] = useState(0);
  const [count, setCount] = useState(0);
  const [rounds, setRounds] = useState(0);
  const [loaded, setLoaded] = useState(false);

  // Restore.
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORE);
      if (raw) {
        const s = JSON.parse(raw);
        if (typeof s.idx === "number") setIdx(Math.min(Math.max(s.idx, 0), DHIKR.length - 1));
        if (typeof s.count === "number") setCount(s.count);
        if (typeof s.rounds === "number") setRounds(s.rounds);
      }
    } catch {
      /* ignore */
    }
    setLoaded(true);
  }, []);

  // Persist.
  useEffect(() => {
    if (!loaded) return;
    try {
      localStorage.setItem(STORE, JSON.stringify({ idx, count, rounds }));
    } catch {
      /* ignore */
    }
  }, [idx, count, rounds, loaded]);

  const dhikr = DHIKR[idx];
  const target = dhikr.target;

  function tap() {
    try {
      navigator.vibrate?.(count + 1 >= target ? [18, 40, 18] : 12);
    } catch {
      /* ignore */
    }
    setCount((c) => {
      const next = c + 1;
      if (next >= target) {
        setRounds((r) => r + 1);
        return 0;
      }
      return next;
    });
  }

  function reset() {
    setCount(0);
    setRounds(0);
  }

  const pct = Math.min((count / target) * 100, 100);

  return (
    <div className="tasbih">
      <div className="tasbih__dhikr">
        <span className="tasbih__ar">{dhikr.ar}</span>
        <span className="tasbih__tr">{dhikr.tr}</span>
      </div>

      <button type="button" className="tasbih__bead" onClick={tap} aria-label={`Count ${dhikr.tr}`}>
        <svg className="tasbih__ring" viewBox="0 0 120 120" aria-hidden>
          <circle cx="60" cy="60" r="54" fill="none" stroke="rgba(201,162,39,0.18)" strokeWidth="8" />
          <circle
            cx="60"
            cy="60"
            r="54"
            fill="none"
            stroke="#c9a227"
            strokeWidth="8"
            strokeLinecap="round"
            strokeDasharray={`${(pct / 100) * 339.292} 339.292`}
            transform="rotate(-90 60 60)"
          />
        </svg>
        <span className="tasbih__count">{count}</span>
        <span className="tasbih__target">/ {target}</span>
      </button>

      <div className="tasbih__meta">
        <span>
          Completed sets: <b>{rounds}</b>
        </span>
        <button type="button" className="tasbih__reset" onClick={reset}>
          Reset
        </button>
      </div>

      <div className="tasbih__picker">
        {DHIKR.map((d, i) => (
          <button
            key={d.tr}
            type="button"
            className={`tasbih__chip${i === idx ? " is-active" : ""}`}
            onClick={() => {
              setIdx(i);
              setCount(0);
            }}
          >
            {d.tr}
          </button>
        ))}
      </div>
    </div>
  );
}
