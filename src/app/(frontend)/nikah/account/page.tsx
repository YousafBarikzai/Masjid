import type { Metadata } from "next";
import PageHero from "@/components/layout/PageHero";
import NikahAccount from "@/components/nikah/NikahAccount";

export const metadata: Metadata = {
  title: "My Nikah Account — Kingston Mosque",
  description: "Sign in to the Kingston Mosque Nikah Service.",
  // Strictly private area — never indexed.
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

export default function NikahAccountPage() {
  return (
    <>
      <PageHero
        title="My Nikah account"
        intro="Your application, your anonymous profile, and your introductions — all managed privately with the Nikah team."
        crumb="Nikah Service"
      />
      <section>
        <div className="wrap narrow">
          <NikahAccount />
        </div>
      </section>
    </>
  );
}
