import type { Metadata } from "next";
import PageHero from "@/components/layout/PageHero";
import CardGrid from "@/components/sections/CardGrid";
import { getEvents } from "@/lib/cms";

export const metadata: Metadata = { title: "Events" };

export default async function EventsPage() {
  const events = await getEvents();
  return (
    <>
      <PageHero
        title="Events"
        crumb="Events"
        intro="Programmes, prayers and gatherings for the whole community — including Ramadan and Eid."
      />
      <section>
        <div className="wrap">
          <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 18 }}>
            <a className="btn btn-green" href="/app-api/events.ics">
              📅 Subscribe / add to calendar
            </a>
          </div>
          <CardGrid cols={3} items={events} />
        </div>
      </section>
      <section style={{ background: "var(--cream-2)" }}>
        <div className="wrap narrow prose">
          <h2>Ramadan at Kingston Mosque</h2>
          <p>
            During the blessed month, we hold nightly Taraweeh prayers and open I&apos;tikaaf
            registration for the last ten nights. Suhūr and Iftar timings are published on the prayer
            timetable, and the community comes together for shared Iftars.
          </p>
          <h2>Eid Prayers</h2>
          <p>
            Eid al-Fitr and Eid al-Adha are celebrated with multiple congregations to accommodate
            everyone, with overflow space and guidance on parking. Exact Eid prayer times are
            confirmed closer to the date and announced on the homepage banner.
          </p>
          <p className="note-box">
            Eid times, Ramadan timetables and event details shown here are samples — they will be
            managed and published from the admin area.
          </p>
        </div>
      </section>
    </>
  );
}
