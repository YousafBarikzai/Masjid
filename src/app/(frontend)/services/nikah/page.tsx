import type { Metadata } from "next";
import PageHero from "@/components/layout/PageHero";
import { site } from "@/lib/content";

export const metadata: Metadata = { title: "Nikah (Marriage)" };

export default function NikahPage() {
  return (
    <>
      <PageHero
        title="Nikah — Marriage Services"
        crumb="Services / Nikah"
        intro="Marriage ceremonies conducted by our Imams in line with authentic Islamic tradition."
      />
      <section>
        <div className="wrap narrow prose">
          <h2>Getting married at Kingston Mosque</h2>
          <p>
            Our local Imams perform Nikah ceremonies based on the Qur&apos;an and the prophetic
            tradition. We guide couples through the requirements and help make the occasion blessed
            and memorable.
          </p>
          <h3>What to bring</h3>
          <ul>
            <li>Valid photo identification for the bride and groom</li>
            <li>Two adult Muslim witnesses</li>
            <li>Agreement on the mahr (dowry)</li>
            <li>Consent of the wali (guardian) where applicable</li>
          </ul>
          <p>
            To arrange a Nikah or ask a question, please contact the mosque office on{" "}
            <a href={site.phoneHref}>{site.phone}</a> or email{" "}
            <a href={`mailto:${site.email}`}>{site.email}</a>.
          </p>
          <p className="note-box">
            Exact requirements, fees and booking forms will be published and kept up to date from the
            admin area.
          </p>
        </div>
      </section>
    </>
  );
}
