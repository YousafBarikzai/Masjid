import type { Metadata } from "next";
import PageHero from "@/components/layout/PageHero";
import CardGrid from "@/components/sections/CardGrid";
import CTASection from "@/components/sections/CTASection";
import { servicePages } from "@/lib/site-content";

export const metadata: Metadata = { title: "Services" };

export default function ServicesPage() {
  const items = servicePages.map((s) => ({
    icon: s.icon,
    title: s.title,
    body: s.intro,
    href: `/services/${s.slug}`,
  }));
  return (
    <>
      <PageHero
        title="Our Services"
        crumb="Services"
        intro="Supporting the community through every stage of life — from prayer and education to marriage and bereavement."
      />
      <section>
        <div className="wrap">
          <CardGrid cols={4} items={items} />
        </div>
      </section>
      <CTASection
        heading="Here to help"
        body="Kingston Mosque has served the community since 1979. For any service, contact the mosque office and a member of our team will be glad to assist."
        buttonLabel="Contact the office"
        buttonHref="/contact"
        secondaryLabel="Donate"
        secondaryHref="/donate"
      />
    </>
  );
}
