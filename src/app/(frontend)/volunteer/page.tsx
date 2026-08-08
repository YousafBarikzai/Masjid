import type { Metadata } from "next";
import PageHero from "@/components/layout/PageHero";
import VolunteerWizard from "@/components/volunteer/VolunteerWizard";

export const metadata: Metadata = {
  title: "Volunteer With Kingston Mosque",
  description:
    "Register as a Kingston Mosque volunteer — tell us how you'd like to help and when you're available, and our team will be in touch.",
};

export const dynamic = "force-dynamic";

export default function VolunteerPage() {
  return (
    <>
      <PageHero
        title="Volunteer With Kingston Mosque"
        intro="Thank you for your interest in volunteering. Complete this short form and let us know how you'd like to help — our team will review your registration and contact you when suitable opportunities come up."
        crumb="Volunteer"
      />
      <section>
        <div className="wrap narrow">
          <VolunteerWizard />
        </div>
      </section>
    </>
  );
}
