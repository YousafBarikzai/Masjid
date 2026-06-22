import Link from "next/link";
import { getToday, getNextDay, dayRows, formatGregorian, formatHijri } from "@/lib/prayer";
import { site, stats } from "@/lib/content";
import { getEvents, getClasses, getServices, getPrayerOverride } from "@/lib/cms";
import PrayerCard from "@/components/home/PrayerCard";
import NextPrayerChip from "@/components/home/NextPrayerChip";
import JummahSection from "@/components/sections/JummahSection";
import SpecialSection from "@/components/sections/SpecialSection";
import DonateSection from "@/components/sections/DonateSection";
import ContactSection from "@/components/sections/ContactSection";
import CardGrid from "@/components/sections/CardGrid";
import CTASection from "@/components/sections/CTASection";
import Newsletter from "@/components/sections/Newsletter";
import ImageSlot from "@/components/media/ImageSlot";
import MosqueSkyline from "@/components/decor/MosqueSkyline";
import { newsSeed, youtubeChannelUrl } from "@/lib/site-content";

// Render per-request so "today" is always correct in Europe/London.
export const dynamic = "force-dynamic";

export default async function Home() {
  const base = getToday();
  const override = await getPrayerOverride(base.date);
  const today = override ?? base;
  const rows = dayRows(today);
  const tomorrowFajr = getNextDay(base.date).fajr.jamaah;

  const [events, classes, services] = await Promise.all([getEvents(), getClasses(), getServices()]);

  return (
    <>
      <section className="hero">
        <MosqueSkyline className="hero-skyline" />
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
            <PrayerCard
              gregorian={formatGregorian(today.date)}
              hijri={formatHijri(today.date)}
              rows={rows}
              tomorrowFajr={tomorrowFajr}
            />
          </div>
        </div>
      </section>

      <JummahSection />

      <SpecialSection />

      <section id="events">
        <div className="wrap">
          <div className="section-head">
            <div className="eyebrow">What&apos;s On</div>
            <h2>Upcoming Events</h2>
            <p>Programmes, prayers and gatherings for the whole community.</p>
          </div>
          <CardGrid cols={3} items={events} />
        </div>
      </section>

      <DonateSection />

      <section className="app-cta">
        <div className="wrap">
          <div>
            <div className="eyebrow">On the go</div>
            <h2 style={{ color: "var(--green)", margin: ".2em 0" }}>Get the Kingston Mosque app</h2>
            <p style={{ color: "var(--muted)", maxWidth: "32em" }}>
              Prayer times, the next-jamāʿah countdown, news and announcements — in your pocket.
              Coming soon for iPhone and Android.
            </p>
          </div>
          <div className="app-badges">
            <a className="app-badge" href="#" aria-label="Download on the App Store (coming soon)">
              <span aria-hidden></span>
              <span>
                <small>Download on the</small>
                <b>App Store</b>
              </span>
            </a>
            <a className="app-badge" href="#" aria-label="Get it on Google Play (coming soon)">
              <span aria-hidden>▶</span>
              <span>
                <small>Get it on</small>
                <b>Google Play</b>
              </span>
            </a>
          </div>
        </div>
      </section>

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
          <CardGrid cols={4} items={services} />
        </div>
      </section>

      <section>
        <div className="wrap">
          <div className="section-head">
            <div className="eyebrow">Latest</div>
            <h2>News &amp; Announcements</h2>
            <p>Updates from across the Kingston Mosque community.</p>
          </div>
          <div className="news-grid">
            {newsSeed.slice(0, 3).map((n) => (
              <Link key={n.slug} className="news-card" href="/news">
                <ImageSlot slot={n.image} alt={n.title} ratio="16 / 9" rounded={false} />
                <div className="body">
                  <span className="tag">{n.category}</span>
                  <span className="date">{n.date}</span>
                  <h3>{n.title}</h3>
                  <p>{n.excerpt}</p>
                  <span className="more">Read more →</span>
                </div>
              </Link>
            ))}
          </div>
          <div style={{ textAlign: "center", marginTop: 28 }}>
            <Link className="btn btn-green" href="/news">
              All news
            </Link>
          </div>
        </div>
      </section>

      <CTASection
        heading="Watch our khutbahs & lectures"
        body="Friday khutbahs, Qur’an recitation and lectures on the Kingston Mosque YouTube channel."
        buttonLabel="Visit our YouTube"
        buttonHref={youtubeChannelUrl}
        secondaryLabel="Browse media"
        secondaryHref="/media"
      />

      <section>
        <div className="wrap">
          <Newsletter />
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
