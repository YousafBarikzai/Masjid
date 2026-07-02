"use client";

import { useEffect, useState } from "react";
import { useI18n, LANGS, type Lang } from "@/lib/i18n";

/* Accessibility & language controls for the More sheet: switch language (with
   RTL for Arabic/Urdu) and adjust the reading text size. Text size scales the
   main content via a CSS zoom variable and persists; it's applied before paint
   in layout.tsx to avoid a flash. */

const SIZE_KEY = "kma-textsize";
const SIZES: { key: string; zoom: number; label: string }[] = [
  { key: "sm", zoom: 1, label: "A" },
  { key: "md", zoom: 1.12, label: "A" },
  { key: "lg", zoom: 1.25, label: "A" },
];

export default function AppSettings() {
  const { lang, setLang, t } = useI18n();
  const [size, setSize] = useState("sm");

  useEffect(() => {
    try {
      const saved = localStorage.getItem(SIZE_KEY);
      if (saved && SIZES.some((s) => s.key === saved)) setSize(saved);
    } catch {
      /* ignore */
    }
  }, []);

  function applySize(key: string) {
    const z = SIZES.find((s) => s.key === key)?.zoom ?? 1;
    setSize(key);
    try {
      localStorage.setItem(SIZE_KEY, key);
    } catch {
      /* ignore */
    }
    document.documentElement.style.setProperty("--read-zoom", String(z));
  }

  return (
    <div className="appset">
      <div className="appset__title">{t("settings.title")}</div>

      <div className="appset__group">
        <span className="appset__label">{t("settings.language")}</span>
        <div className="appset__opts">
          {LANGS.map((l) => (
            <button
              key={l.code}
              type="button"
              className={`appset__opt${lang === l.code ? " is-active" : ""}`}
              onClick={() => setLang(l.code as Lang)}
              lang={l.code}
            >
              {l.label}
            </button>
          ))}
        </div>
      </div>

      <div className="appset__group">
        <span className="appset__label">{t("settings.textSize")}</span>
        <div className="appset__opts appset__opts--size">
          {SIZES.map((s, i) => (
            <button
              key={s.key}
              type="button"
              className={`appset__opt${size === s.key ? " is-active" : ""}`}
              onClick={() => applySize(s.key)}
              aria-label={["Normal", "Large", "Extra large"][i] + " text"}
              style={{ fontSize: `${0.85 + i * 0.18}rem` }}
            >
              {s.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
