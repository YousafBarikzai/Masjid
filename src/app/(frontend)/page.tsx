import Link from "next/link";
import { getToday, getNextDay, dayRows, formatGregorian, formatHijri } from "@/lib/prayer";
import { site, events as eventItems, classes, services as serviceItems, stats } from "@/lib/content";
import PrayerCard from "@/components/home/PrayerCard";
import NextPrayerChip from "@/components/home/NextPrayerChip";
import JummahSection from "@/components/sections/JummahSection";
import DonateSection from "@/components/sections/DonateSection";
import ContactSection from "@/components/sections/ContactSection";
import CardGrid from "@/components/sections/CardGrid";

// Render per-request so "today" is always correct in Europe/London.
export const dynamic = "force-dynamic";

export default function Home() {
  const today = getToday();
  const rows = dayRows(today);
  const tomorrowFajr = getNextDay(today.date).fajr.jamaah;
  const gregorian = formatGregorian(today.date);
  const hijri = formatHijri(today.date);

  return (
    <>
      <section className="hero">
        <div className="wrap">
          <div>
            <NextPrayerChip rows={rows} tomorrowFajr={tomorrowFajr} />
            <h1>
              A home for worship,
              <br />
              <span>learning &amp; community</span>
            </h1>
            <p className="lead">{site.intro}</p>
            <div className="cta">
              <Link className="btn btn-gold" href="/prayer-times">
                View Prayer Times
              </Link>
              <Link className="btn btn-outline" href="/about">
                About the Mosque
              </Link>
            </div>
          </div>
          <div id="prayer">
            <PrayerCard gregorian={gregorian} hijri={hijri} rows={rows} tomorrowFajr={tomorrowFajr} />
          </div>
        </div>
      </section>

      <JummahSection />

      <section id="events">
        <div className="wrap">
          <div className="section-head">
            <div className="eyebrow">What&apos;s On</div>
            <h2>Upcoming Events</h2>
            <p>Programmes, prayers and gatherings for the whole community.</p>
          </div>
          <CardGrid cols={3} items={eventItems} />
        </div>
      </section>

      <DonateSection />

      <section id="education" style={{ background: "var(--cream-2)" }}>
        <div className="wrap">
          <div className="section-head">
            <div className="eyebrow">Seeking Knowledge</div>
            <h2>Education &amp; Classes</h2>
            <p>Nurturing faith and knowledge for every age, from children to adults.</p>
          </div>
          <CardGrid cols={4} items={classes} />
        </div>
      </section>

      <section id="services">
        <div className="wrap">
          <div className="section-head">
            <div className="eyebrow">How We Help</div>
            <h2>Our Services</h2>
            <p>Supporting the community through every stage of life.</p>
          </div>
          <CardGrid cols={4} items={serviceItems} />
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
