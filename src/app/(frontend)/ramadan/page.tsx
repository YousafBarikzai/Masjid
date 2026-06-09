import type { Metadata } from "next";
import PageHero from "@/components/layout/PageHero";
import SpecialSection from "@/components/sections/SpecialSection";

export const metadata: Metadata = { title: "Ramadan & Eid" };

export default function RamadanPage() {
  return (
    <>
      <PageHero
        title="Ramadan & Eid"
        crumb="Ramadan & Eid"
        intro="Taraweeh, I‘tikaaf, Suhūr and Iftar timings, and Eid prayer arrangements."
      />
      <SpecialSection alwaysShow />
    </>
  );
}
