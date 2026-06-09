import type { Metadata } from "next";
import PageHero from "@/components/layout/PageHero";
import CardGrid from "@/components/sections/CardGrid";
import { services } from "@/lib/content";

export const metadata: Metadata = { title: "Services" };

export default function ServicesPage() {
  return (
    <>
      <PageHero
        title="Our Services"
        crumb="Services"
        intro="Supporting the community through every stage of life — from marriage to bereavement."
      />
      <section>
        <div className="wrap">
          <CardGrid cols={4} items={services} />
        </div>
      </section>
      <section style={{ background: "var(--cream-2)" }}>
        <div className="wrap narrow prose">
          <h2>Here to help</h2>
          <p>
            Kingston Mosque has served the community since 1979. Alongside daily prayers and
            education, we offer marriage (Nikah) services, free funeral and Ghusl assistance, support
            for new Muslims, and visits for local schools across the borough of Kingston upon Thames.
          </p>
          <p>
            For any service, please <a href="/contact">contact the mosque office</a> and a member of
            our team will be glad to assist.
          </p>
        </div>
      </section>
    </>
  );
}
