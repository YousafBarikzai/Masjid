import type { Metadata } from "next";
import PageHero from "@/components/layout/PageHero";
import QiblaCompass from "@/components/tools/QiblaCompass";

export const metadata: Metadata = {
  title: "Qibla Direction",
  description: "Find the direction of the Qibla (towards the Kaaba in Makkah) from your location.",
};

export default function QiblaPage() {
  return (
    <>
      <PageHero
        title="Qibla Direction"
        crumb="Tools"
        intro="Point your phone to find the direction of prayer — towards the Kaaba in Makkah."
      />
      <section>
        <div className="wrap narrow">
          <QiblaCompass />
          <p className="qibla__note">
            For best accuracy, hold your phone flat and away from metal or magnets, and calibrate
            your device’s compass if prompted. The Qibla is the great-circle direction to the Kaaba.
          </p>
        </div>
      </section>
    </>
  );
}
