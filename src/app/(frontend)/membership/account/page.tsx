import type { Metadata } from "next";
import PageHero from "@/components/layout/PageHero";
import AccountArea from "@/components/membership/AccountArea";

export const metadata: Metadata = {
  title: "My KMA membership",
  description: "Sign in to check your membership application, pay your fee, and manage your details.",
  // The account/portal is private — keep it out of search engines entirely.
  robots: { index: false, follow: false },
};

export default function MembershipAccountPage() {
  return (
    <>
      <PageHero
        title="My membership"
        intro="Check your application, see what happens next, and manage your details."
        crumb="My membership"
      />
      <section>
        <div className="wrap narrow">
          <AccountArea />
        </div>
      </section>
    </>
  );
}
