import type { Metadata } from "next";
import PageHero from "@/components/layout/PageHero";
import SpecialSection from "@/components/sections/SpecialSection";
import RamadanCountdown from "@/components/ramadan/RamadanCountdown";
import { getToday } from "@/lib/prayer";
import { getPrayerOverride } from "@/lib/cms";

export const metadata: Metadata = { title: "Ramadan & Eid" };

export const dynamic = "force-dynamic";

export default async function RamadanPage() {
  const base = getToday();
  const override = await getPrayerOverride(base.date);
  const day = override ?? base;

  return (
    <>
      <PageHero
        title="Ramadan & Eid"
        crumb="Ramadan & Eid"
        intro="Taraweeh, I‘tikaaf, Suhūr and Iftar timings, and Eid prayer arrangements."
      />
      <section>
        <div className="wrap narrow">
          <RamadanCountdown fajr={day.fajr.begins} maghrib={day.maghrib.begins} />
        </div>
      </section>
      <SpecialSection alwaysShow />
    </>
  );
}
