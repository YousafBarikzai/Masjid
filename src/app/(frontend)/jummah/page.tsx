import type { Metadata } from "next";
import PageHero from "@/components/layout/PageHero";
import JummahSection from "@/components/sections/JummahSection";

export const metadata: Metadata = { title: "Jummah" };

export default function JummahPage() {
  return (
    <>
      <PageHero
        title="Jummah — Friday Prayer"
        crumb="Jummah"
        intro="Kingston Mosque holds two Jummah congregations every Friday — the first khutbah in English and the second in Arabic."
      />
      <JummahSection />
      <section>
        <div className="wrap narrow prose">
          <h2>Attending Jummah</h2>
          <p>
            Friday prayer replaces Dhuhr. To help everyone pray comfortably, we run two
            congregations. Please arrive early, as the prayer halls fill quickly.
          </p>
          <ul>
            <li>
              <b>First Jummah (English):</b> doors open 12:50 pm, khutbah begins 1:10 pm.
            </li>
            <li>
              <b>Second Jummah (Arabic):</b> doors open 2:00 pm, khutbah begins 2:10 pm.
            </li>
          </ul>
          <p>
            Separate facilities are available for men (ground floor) and women (second-floor hall),
            with ablution areas and disabled access. Times are confirmed weekly — please check the
            announcement banner for any changes during Ramadan and on Eid.
          </p>
          <p className="note-box">
            Exact khutbah times are being confirmed with the mosque office and will be editable from
            the admin area once the content management system is connected.
          </p>
        </div>
      </section>
    </>
  );
}
