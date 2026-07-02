"use client";

import { createContext, useCallback, useContext, useEffect, useState } from "react";

/* Lightweight UI-shell internationalisation. Translates the app chrome
   (navigation, controls, labels) and flips the whole layout to right-to-left for
   Arabic / Urdu. Authored page content stays as written; the .prose content is
   kept left-to-right so English articles remain readable under an RTL shell.
   The chosen language persists and is applied before paint (see layout.tsx). */

export type Lang = "en" | "ar" | "ur";
export const LANGS: { code: Lang; label: string; rtl: boolean }[] = [
  { code: "en", label: "English", rtl: false },
  { code: "ar", label: "العربية", rtl: true },
  { code: "ur", label: "اردو", rtl: true },
];
export const STORAGE_KEY = "kma-lang";

type Dict = Record<string, string>;
const EN: Dict = {
  "nav.home": "Home",
  "nav.prayer": "Prayer",
  "nav.donate": "Donate",
  "nav.events": "Events",
  "nav.more": "More",
  "sheet.explore": "Explore",
  "sheet.tools": "Tools",
  "tools.prayerTimes": "Prayer Times",
  "tools.qibla": "Qibla",
  "tools.tasbih": "Tasbīḥ",
  "prayer.next": "Next",
  "prayer.jamaah": "jamāʿah",
  "contact.email": "Email us",
  "push.title": "Prayer & event alerts",
  "push.subscribed": "You’re subscribed to mosque notifications",
  "push.get": "Get notified about announcements and events",
  "push.enable": "Enable",
  "push.on": "On",
  "push.prayerTitle": "Prayer time reminders",
  "settings.title": "Settings",
  "settings.language": "Language",
  "settings.textSize": "Text size",
};
const AR: Dict = {
  "nav.home": "الرئيسية",
  "nav.prayer": "الصلاة",
  "nav.donate": "تبرّع",
  "nav.events": "الفعاليات",
  "nav.more": "المزيد",
  "sheet.explore": "تصفّح",
  "sheet.tools": "أدوات",
  "tools.prayerTimes": "أوقات الصلاة",
  "tools.qibla": "القبلة",
  "tools.tasbih": "تسبيح",
  "prayer.next": "التالية",
  "prayer.jamaah": "الجماعة",
  "contact.email": "راسلنا",
  "push.title": "تنبيهات الصلاة والفعاليات",
  "push.subscribed": "أنت مشترك في إشعارات المسجد",
  "push.get": "احصل على إشعارات الإعلانات والفعاليات",
  "push.enable": "تفعيل",
  "push.on": "مُفعّل",
  "push.prayerTitle": "تذكير بأوقات الصلاة",
  "settings.title": "الإعدادات",
  "settings.language": "اللغة",
  "settings.textSize": "حجم النص",
};
const UR: Dict = {
  "nav.home": "ہوم",
  "nav.prayer": "نماز",
  "nav.donate": "عطیہ",
  "nav.events": "تقریبات",
  "nav.more": "مزید",
  "sheet.explore": "دیکھیں",
  "sheet.tools": "اوزار",
  "tools.prayerTimes": "نماز اوقات",
  "tools.qibla": "قبلہ",
  "tools.tasbih": "تسبیح",
  "prayer.next": "اگلی",
  "prayer.jamaah": "جماعت",
  "contact.email": "ای میل کریں",
  "push.title": "نماز اور تقریبات کے الرٹس",
  "push.subscribed": "آپ مسجد کی اطلاعات کے رکن ہیں",
  "push.get": "اعلانات اور تقریبات کی اطلاع پائیں",
  "push.enable": "فعال کریں",
  "push.on": "آن",
  "push.prayerTitle": "نماز اوقات کی یاد دہانی",
  "settings.title": "ترتیبات",
  "settings.language": "زبان",
  "settings.textSize": "متن کا سائز",
};
const DICTS: Record<Lang, Dict> = { en: EN, ar: AR, ur: UR };

type Ctx = { lang: Lang; setLang: (l: Lang) => void; t: (key: string) => string };
const I18nContext = createContext<Ctx>({ lang: "en", setLang: () => {}, t: (k) => k });

export function applyLang(lang: Lang) {
  const rtl = LANGS.find((l) => l.code === lang)?.rtl ?? false;
  document.documentElement.lang = lang;
  document.documentElement.dir = rtl ? "rtl" : "ltr";
}

export function I18nProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLangState] = useState<Lang>("en");

  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY) as Lang | null;
      if (saved && DICTS[saved]) {
        setLangState(saved);
        applyLang(saved);
      }
    } catch {
      /* ignore */
    }
  }, []);

  const setLang = useCallback((l: Lang) => {
    setLangState(l);
    try {
      localStorage.setItem(STORAGE_KEY, l);
    } catch {
      /* ignore */
    }
    applyLang(l);
  }, []);

  const t = useCallback((key: string) => DICTS[lang][key] ?? EN[key] ?? key, [lang]);

  return <I18nContext.Provider value={{ lang, setLang, t }}>{children}</I18nContext.Provider>;
}

export function useI18n() {
  return useContext(I18nContext);
}
