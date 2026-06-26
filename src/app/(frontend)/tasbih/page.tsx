import type { Metadata } from "next";
import PageHero from "@/components/layout/PageHero";
import TasbihCounter from "@/components/tools/TasbihCounter";

export const metadata: Metadata = {
  title: "Digital Tasbīḥ",
  description: "A digital tasbīḥ counter for dhikr — tap to count, with sets and common adhkār.",
};

export default function TasbihPage() {
  return (
    <>
      <PageHero
        title="Digital Tasbīḥ"
        crumb="Tools"
        intro="Tap the bead to count your dhikr. Your progress is saved on this device and works offline."
      />
      <section>
        <div className="wrap narrow">
          <TasbihCounter />
        </div>
      </section>
    </>
  );
}
