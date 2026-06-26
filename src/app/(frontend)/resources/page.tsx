import type { Metadata } from "next";
import PageHero from "@/components/layout/PageHero";
import CardGrid from "@/components/sections/CardGrid";
import { resourcePages } from "@/lib/site-content";

export const metadata: Metadata = { title: "Resources" };

export default function ResourcesPage() {
  const items = resourcePages.map((r) => ({
    icon: r.icon,
    title: r.title,
    body: r.intro,
    href: `/resources/${r.slug}`,
  }));
  return (
    <>
      <PageHero
        title="Resources"
        crumb="Resources"
        intro="Membership, policies and key documents for Kingston Muslim Association."
      />
      <section>
        <div className="wrap">
          <CardGrid cols={3} items={items} />
        </div>
      </section>
    </>
  );
}
