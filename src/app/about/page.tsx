import type { Metadata } from "next";
import PageHero from "@/components/layout/PageHero";
import ContactSection from "@/components/sections/ContactSection";
import { facilities, stats } from "@/lib/content";

export const metadata: Metadata = { title: "About the Mosque" };

export default function AboutPage() {
  return (
    <>
      <PageHero
        title="About the Mosque"
        crumb="About"
        intro="Kingston Muslim Association — serving the community of Kingston upon Thames since 1979."
      />
      <section>
        <div className="wrap narrow prose">
          <h2>Our story</h2>
          <p>
            The Kingston Muslim Association (KMA) was founded in 1979 and converted into a
            purpose-built mosque in 1985. Today the mosque can accommodate more than 800 worshippers,
            many of whom travel from surrounding areas to pray and learn here.
          </p>
          <p>
            Over four decades, KMA has grown into a hub for worship, Islamic education and community
            life — offering daily prayers, a thriving Madrasah, youth and sisters&apos; programmes,
            and essential services such as Nikah and free funeral support.
          </p>
          <h3>Our facilities</h3>
          <ul>
            {facilities.map((f) => (
              <li key={f}>{f}</li>
            ))}
          </ul>
        </div>
      </section>
      <section className="impact">
        <div className="wrap">
          <div className="grid">
            {stats.map((s) => (
              <div key={s.l}>
                <div className="n">{s.n}</div>
                <div className="l">{s.l}</div>
              </div>
            ))}
          </div>
        </div>
      </section>
      <ContactSection />
    </>
  );
}
