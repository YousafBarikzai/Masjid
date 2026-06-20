import type { Metadata } from "next";
import PageHero from "@/components/layout/PageHero";
import ContactSection from "@/components/sections/ContactSection";
import { stats } from "@/lib/content";
import { getAbout } from "@/lib/cms";

export const metadata: Metadata = { title: "About the Mosque" };

export default async function AboutPage() {
  const about = await getAbout();
  return (
    <>
      <PageHero
        title="About the Mosque"
        crumb="About"
        intro="Kingston Muslim Association — serving the community of Kingston upon Thames since 1979."
      />
      <section>
        <div className="wrap narrow prose">
          <h2>{about.heading}</h2>
          {about.paragraphs.map((p, i) => (
            <p key={i}>{p}</p>
          ))}
          <h3>Our facilities</h3>
          <ul>
            {about.facilities.map((f) => (
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
