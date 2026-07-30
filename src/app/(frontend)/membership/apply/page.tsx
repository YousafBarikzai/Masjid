import type { Metadata } from "next";
import PageHero from "@/components/layout/PageHero";
import ApplyWizard from "@/components/membership/ApplyWizard";

export const metadata: Metadata = {
  title: "Apply for KMA membership",
  description: "Apply online to become a member of Kingston Muslim Association.",
};

export default function MembershipApplyPage() {
  return (
    <>
      <PageHero
        title="Apply for membership"
        intro="Five short steps — about ten minutes. Your progress is saved on this device as you go."
        crumb="Membership application"
      />
      <section>
        <div className="wrap narrow">
          <ApplyWizard />
        </div>
      </section>
    </>
  );
}
