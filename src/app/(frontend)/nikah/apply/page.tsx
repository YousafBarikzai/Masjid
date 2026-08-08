import type { Metadata } from "next";
import PageHero from "@/components/layout/PageHero";
import NikahApplyWizard from "@/components/nikah/NikahApplyWizard";

export const metadata: Metadata = {
  title: "Apply — Nikah Matrimonial Service",
  description: "Apply in confidence to the Kingston Mosque Nikah Service.",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

export default function NikahApplyPage() {
  return (
    <>
      <PageHero
        title="Apply in confidence"
        intro="Six short steps, about ten minutes. Nothing is visible to anyone until the Nikah team approves your application — and members only ever see an anonymous profile."
        crumb="Nikah Service"
      />
      <section>
        <div className="wrap narrow">
          <NikahApplyWizard />
        </div>
      </section>
    </>
  );
}
