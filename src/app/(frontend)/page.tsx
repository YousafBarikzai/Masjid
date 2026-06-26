import "./home.css";
import Link from "next/link";
import { getToday, getNextDay, dayRows, formatGregorian, formatHijri } from "@/lib/prayer";
import { site, stats } from "@/lib/content";
import {
  getEvents,
  getClasses,
  getServices,
  getPosts,
  getJummah,
  getDonation,
  getPrayerOverride,
} from "@/lib/cms";
import { youtubeChannelUrl } from "@/lib/site-content";
import HxPrayerCard from "@/components/home/HxPrayerCard";
import HxNextChip from "@/components/home/HxNextChip";

// Render per-request so "today" is always correct in Europe/London.
export const dynamic = "force-dynamic";

/* ----------------------------- small SVG helpers ----------------------------- */
const ArrowRight = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
    <path d="M5 12h14M12 5l7 7-7 7" />
  </svg>
);
const ArrowRightLg = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
    <path d="M5 12h14M12 5l7 7-7 7" />
  </svg>
);
const HeartIcon = () => (
  <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="#0C3322" strokeWidth="2" aria-hidden>
    <path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1.1-1a5.5 5.5 0 0 0-7.8 7.7l1.1 1.1L12 21l7.8-7.8 1.1-1a5.5 5.5 0 0 0 0-7.7z" />
  </svg>
);
const ClockIcon = () => (
  <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="#0C3322" strokeWidth="2" aria-hidden>
    <circle cx="12" cy="12" r="9" />
    <path d="M12 7v5l3 2" />
  </svg>
);

export default async function Home() {
  const base = getToday();
  const override = await getPrayerOverride(base.date);
  const today = override ?? base;
  const rows = dayRows(today);
  const tomorrowFajr = getNextDay(base.date).fajr.jamaah;

  const [events, classes, services, posts, jummah, donation] = await Promise.all([
    getEvents(),
    getClasses(),
    getServices(),
    getPosts(),
    getJummah(),
    getDonation(),
  ]);

  const newsItems =
    posts.length > 0
      ? posts.slice(0, 3)
      : events.slice(0, 3).map((e) => ({ date: "Upcoming", title: e.title, body: e.body, slug: undefined }));

  const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(site.mapsQuery)}`;

  return (
    <div className="hx">
      {/* The notice ticker is rendered site-wide by SiteHeader (the .alert band). */}

      {/* ===================== HERO ===================== */}
      <section className="hx-hero">
        {/* khatam lattice */}
        <svg className="hx-hero-deco" xmlns="http://www.w3.org/2000/svg" aria-hidden>
          <defs>
            <pattern id="hx-kh" width="86" height="86" patternUnits="userSpaceOnUse">
              <g fill="none" stroke="#E6C879" strokeOpacity="0.06" strokeWidth="1">
                <rect x="23" y="23" width="40" height="40" />
                <rect x="23" y="23" width="40" height="40" transform="rotate(45 43 43)" />
              </g>
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#hx-kh)" />
        </svg>
        <div className="hx-hero-glow-gold" aria-hidden />
        <div className="hx-hero-glow-green" aria-hidden />
        {/* skyline silhouette */}
        <svg
          className="hx-hero-skyline"
          viewBox="0 0 1440 230"
          preserveAspectRatio="xMidYMax meet"
          fill="#072518"
          aria-hidden
        >
          <path d="M0 230h1440V150H1180v-22a30 30 0 0 0-60 0v22H980c0-70-50-120-110-130 14-8 22-20 22-36a36 36 0 0 0-72 0c0 16 8 28 22 36-60 10-110 60-110 130H470v-22a30 30 0 0 0-60 0v22H260c0-44 24-78 60-96-10-6-16-16-16-28a30 30 0 0 1 60 0c0 12-6 22-16 28 36 18 60 52 60 96h-8V96a16 16 0 0 0-32 0v54H0z" />
        </svg>

        <div className="hx-wrap">
          <div>
            <HxNextChip rows={rows} tomorrowFajr={tomorrowFajr} />
            <h1>
              A home for worship,
              <br />
              <span className="gold">learning &amp; community</span>
            </h1>
            <p className="lead">{site.intro}</p>
            <div className="hx-hero-cta">
              <Link className="hx-btn hx-btn-gold" href="/prayer-times">
                <ClockIcon />
                View Prayer Times
              </Link>
              <Link className="hx-btn hx-btn-outline" href="/about">
                About the Mosque
                <ArrowRightLg />
              </Link>
            </div>
            <div className="hx-hero-stats">
              {stats.slice(0, 3).map((s, i) => (
                <div key={s.l} style={{ display: "contents" }}>
                  {i > 0 && <div className="divider" aria-hidden />}
                  <div>
                    <div className="n">{s.n}</div>
                    <div className="l">{s.l}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div id="prayer">
            <HxPrayerCard
              gregorian={formatGregorian(today.date)}
              hijri={formatHijri(today.date)}
              rows={rows}
              tomorrowFajr={tomorrowFajr}
              location={`${site.address.city} (${(site.address.postcode || "").split(" ")[0]})`}
            />
          </div>
        </div>
      </section>

      {/* ===================== JUMMAH ===================== */}
      <section className="hx-jummah">
        <svg className="hx-hero-deco" xmlns="http://www.w3.org/2000/svg" style={{ zIndex: 0 }} aria-hidden>
          <defs>
            <pattern id="hx-kj" width="84" height="84" patternUnits="userSpaceOnUse">
              <g fill="none" stroke="#E6C879" strokeOpacity="0.055" strokeWidth="1">
                <rect x="22" y="22" width="40" height="40" />
                <rect x="22" y="22" width="40" height="40" transform="rotate(45 42 42)" />
              </g>
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#hx-kj)" />
        </svg>
        <div className="hx-inner">
          <div className="hx-section-head">
            <div className="hx-eyebrow">
              <span className="line l" />
              <b>FRIDAY PRAYER</b>
              <span className="line r" />
            </div>
            <h2>Jumuʿah Times</h2>
            <p>{jummah.intro}</p>
          </div>
          <div className="hx-jummah-grid">
            {jummah.congregations.map((c) => (
              <div className="hx-jummah-card" key={c.name}>
                <div className="lbl">
                  {c.name.toUpperCase()}
                  {c.language ? ` · ${c.language.toUpperCase()}` : ""}
                </div>
                <div className="big">
                  {(c.khutbah || "").replace(/\s*[ap]m$/i, "")}{" "}
                  <span>{(c.khutbah.match(/[ap]m$/i) || ["pm"])[0]}</span>
                </div>
                <div className="sub">
                  {c.doors ? `Doors ${c.doors} · ` : ""}
                  {c.khutbah ? `Khuṭbah ${c.khutbah}` : ""}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ===================== UPCOMING EVENTS ===================== */}
      <section className="hx-events">
        <div className="hx-inner">
          <div className="hx-section-head">
            <div className="hx-eyebrow">
              <span className="line l" />
              <b>WHAT&apos;S ON</b>
              <span className="line r" />
            </div>
            <h2>Upcoming Events</h2>
            <p>Programmes, prayers and gatherings for the whole community.</p>
          </div>
          <div className="hx-events-grid">
            {events.slice(0, 3).map((e, i) => (
              <Link key={`${e.title}-${i}`} className="hx-event-card" href={e.href || "/events"}>
                <div className="topbar" aria-hidden />
                <div className="pad">
                  <div className="row">
                    <span className="cat">{e.tag}</span>
                    <span className="meta">Details</span>
                  </div>
                  <h3>{e.title}</h3>
                  <p>{e.body}</p>
                  <span className="hx-link-more">
                    Details
                    <ArrowRight />
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ===================== DONATION ===================== */}
      <section className="hx-donate">
        <div className="hx-inner">
          <div className="hx-donate-box">
            <svg className="deco" xmlns="http://www.w3.org/2000/svg" aria-hidden>
              <defs>
                <pattern id="hx-kd" width="84" height="84" patternUnits="userSpaceOnUse">
                  <g fill="none" stroke="#E6C879" strokeOpacity="0.08" strokeWidth="1">
                    <rect x="22" y="22" width="40" height="40" />
                    <rect x="22" y="22" width="40" height="40" transform="rotate(45 42 42)" />
                  </g>
                </pattern>
              </defs>
              <rect width="100%" height="100%" fill="url(#hx-kd)" />
            </svg>
            <div className="copy">
              <div className="eyebrow">SUPPORT YOUR MOSQUE</div>
              <h2>{donation.heading}</h2>
              <p className="body">{donation.body}</p>
              <div className="actions">
                <Link className="hx-btn hx-btn-gold" href="/donate">
                  <HeartIcon />
                  Donate now
                </Link>
                <Link className="hx-btn hx-btn-outline" href="/donate">
                  Set up Zakāt
                </Link>
              </div>
            </div>
            <div className="hx-donate-card">
              {donation.bank.map((b) => (
                <div className="line" key={b.label}>
                  <span className="k">{b.label}</span>
                  <span className="v hx-tnum">{b.value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ===================== EDUCATION & CLASSES ===================== */}
      <section className="hx-classes">
        <div className="hx-inner">
          <div className="hx-section-head">
            <div className="hx-eyebrow">
              <span className="line l" />
              <b>SEEKING KNOWLEDGE</b>
              <span className="line r" />
            </div>
            <h2>Education &amp; Classes</h2>
            <p>Nurturing faith and knowledge for every age, from children to adults.</p>
          </div>
          <div className="hx-icard-grid">
            {classes.slice(0, 4).map((c, i) => (
              <Link key={`${c.title}-${i}`} className="hx-icard" href={c.href || "/education"}>
                <div className="ic" aria-hidden>
                  {c.icon}
                </div>
                <h3>{c.title}</h3>
                <p>{c.body}</p>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ===================== OUR SERVICES ===================== */}
      <section className="hx-services">
        <div className="hx-inner">
          <div className="hx-section-head">
            <div className="hx-eyebrow">
              <span className="line l" />
              <b>HOW WE HELP</b>
              <span className="line r" />
            </div>
            <h2>Our Services</h2>
            <p>Supporting the community through every stage of life.</p>
          </div>
          <div className="hx-icard-grid">
            {services.slice(0, 4).map((s, i) => (
              <Link key={`${s.title}-${i}`} className="hx-icard" href={s.href || "/services"}>
                <div className="ic" aria-hidden>
                  {s.icon}
                </div>
                <h3>{s.title}</h3>
                <p>{s.body}</p>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ===================== APP CTA ===================== */}
      <section className="hx-appcta">
        <div className="hx-inner">
          <div className="left">
            <div className="logo" aria-hidden>
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#E6C879" strokeWidth="1.7">
                <rect x="6" y="2" width="12" height="20" rx="3" />
                <path d="M11 18h2" />
              </svg>
            </div>
            <div>
              <div className="eyebrow">ON THE GO</div>
              <h3>Get the Kingston Mosque app</h3>
              <p>
                Prayer times, the next-jamāʿah countdown, news and announcements — in your pocket.
                Coming soon for iPhone and Android.
              </p>
            </div>
          </div>
          <div className="badges">
            <a className="hx-app-badge" href="#" aria-label="Download on the App Store (coming soon)">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="#fff" aria-hidden>
                <path d="M16.5 1.5c.1 1-.3 2-.9 2.7-.6.8-1.6 1.4-2.6 1.3-.1-1 .4-2 .9-2.6.7-.8 1.8-1.3 2.6-1.4zM19 17.3c-.4 1-.6 1.4-1.1 2.3-.8 1.2-1.8 2.6-3.1 2.6-1.2 0-1.5-.8-3.1-.8-1.6 0-2 .8-3.1.8-1.3 0-2.3-1.3-3.1-2.5-2.1-3.2-2.4-7-1-9 .9-1.4 2.4-2.2 3.8-2.2 1.4 0 2.3.8 3.5.8 1.1 0 1.8-.8 3.5-.8 1.2 0 2.5.7 3.4 1.8-3 1.7-2.5 6 .4 7z" />
              </svg>
              <span>
                <span className="small">Download on the</span>
                <span className="big">App Store</span>
              </span>
            </a>
            <a className="hx-app-badge" href="#" aria-label="Get it on Google Play (coming soon)">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="#E6C879" aria-hidden>
                <path d="M3 2.3v19.4c0 .4.4.6.7.4l11-9.7c.3-.3.3-.7 0-1L3.7 1.9c-.3-.2-.7 0-.7.4z" />
              </svg>
              <span>
                <span className="small">Get it on</span>
                <span className="big">Google Play</span>
              </span>
            </a>
          </div>
        </div>
      </section>

      {/* ===================== NEWS ===================== */}
      <section className="hx-news">
        <div className="hx-inner">
          <div className="hx-section-head">
            <div className="hx-eyebrow">
              <span className="line l" />
              <b>LATEST</b>
              <span className="line r" />
            </div>
            <h2>News &amp; Announcements</h2>
            <p>Updates from across the Kingston Mosque community.</p>
          </div>
          <div className="hx-news-grid">
            {newsItems.map((n, i) => (
              <Link
                key={n.slug ?? `${n.title}-${i}`}
                className="hx-news-card"
                href={n.slug ? `/news/${n.slug}` : "/news"}
              >
                <div className="thumb">
                  <div className="dots" aria-hidden />
                  <svg width="56" height="56" viewBox="0 0 24 24" fill="none" stroke="rgba(230,200,121,.4)" strokeWidth="1" aria-hidden>
                    <path d="M12 2C7 2 4 6 4 11v9h16v-9c0-5-3-9-8-9z" />
                  </svg>
                </div>
                <div className="pad">
                  <div className="date">{n.date}</div>
                  <h3>{n.title}</h3>
                  <p>{n.body}</p>
                  <span className="hx-link-more">
                    Read more
                    <ArrowRight />
                  </span>
                </div>
              </Link>
            ))}
          </div>
          <div className="hx-news-all">
            <Link className="hx-btn hx-btn-green" href="/news">
              All news
            </Link>
          </div>
        </div>
      </section>

      {/* ===================== MEDIA ===================== */}
      <section className="hx-media">
        <div className="hx-inner">
          <div className="copy">
            <h3>Watch our khuṭbahs &amp; lectures</h3>
            <p>
              Friday khuṭbahs, Qurʾān recitation and lectures on the Kingston Mosque YouTube channel.
            </p>
          </div>
          <div className="actions">
            <a className="hx-btn hx-btn-gold" href={youtubeChannelUrl} target="_blank" rel="noopener noreferrer">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="#0C3322" aria-hidden>
                <path d="M22.5 7s-.2-1.5-.9-2.1c-.8-.9-1.8-.9-2.2-1C16.3 3.5 12 3.5 12 3.5s-4.3 0-7.4.3c-.4 0-1.4.1-2.2 1C1.7 5.5 1.5 7 1.5 7S1.3 8.7 1.3 10.5v1.6c0 1.8.2 3.6.2 3.6s.2 1.5.9 2.1c.8.9 1.9.8 2.4.9 1.7.2 7.2.3 7.2.3s4.3 0 7.4-.3c.4 0 1.4-.1 2.2-1 .7-.6.9-2.1.9-2.1s.2-1.8.2-3.6v-1.6c0-1.8-.2-3.5-.2-3.5zM9.8 14.3V8.4l5.7 3z" />
              </svg>
              Visit our YouTube
            </a>
            <Link className="hx-btn hx-btn-outline" href="/media">
              Browse media
            </Link>
          </div>
        </div>
      </section>

      {/* ===================== NEWSLETTER ===================== */}
      <section className="hx-newsletter">
        <div className="hx-inner">
          <div>
            <h3>Stay connected</h3>
            <p>Get prayer-time changes, events and community news straight to your inbox.</p>
          </div>
          <form action="/contact" method="get">
            <label htmlFor="hx-news-email" style={{ position: "absolute", left: "-9999px" }}>
              Your email address
            </label>
            <input
              id="hx-news-email"
              type="email"
              name="email"
              placeholder="Your email address"
              autoComplete="email"
            />
            <button type="submit" className="hx-btn hx-btn-gold">
              Subscribe
            </button>
          </form>
        </div>
      </section>

      {/* ===================== FACILITIES ===================== */}
      <section className="hx-facilities">
        <div className="hx-inner">
          <Facility
            title="Prayer halls"
            sub="Separate men's & women's"
            icon={
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#E6C879" strokeWidth="1.6">
                <path d="M3 21h18M5 21V8l7-4 7 4v13M9 21v-6h6v6" />
              </svg>
            }
          />
          <Facility
            title="Wuḍū facilities"
            sub="Ablution areas"
            icon={
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#E6C879" strokeWidth="1.6">
                <path d="M12 22c4-3 7-7 7-11a7 7 0 0 0-14 0c0 4 3 8 7 11z" />
              </svg>
            }
          />
          <Facility
            title="Disabled access"
            sub="Step-free entry"
            icon={
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#E6C879" strokeWidth="1.6">
                <circle cx="12" cy="4" r="2" />
                <path d="M19 13c-2 0-3.4-1-5-3l-1-1.5a2 2 0 0 0-3.3.3M9 9v5l4 1 1.5 6M9 14l-2.5 6" />
              </svg>
            }
          />
          <Facility
            title="Parking"
            sub="On-site & nearby"
            icon={
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#E6C879" strokeWidth="1.6">
                <rect x="3" y="6" width="18" height="13" rx="2" />
                <path d="M7 6V4h10v2M9 19v2M15 19v2" />
              </svg>
            }
          />
        </div>
      </section>

      {/* ===================== LOCATION & CONTACT ===================== */}
      <section className="hx-contact">
        <div className="hx-inner">
          <div className="hx-section-head">
            <div className="hx-eyebrow">
              <span className="line l" />
              <b>VISIT US</b>
              <span className="line r" />
            </div>
            <h2>Location &amp; Contact</h2>
            <p>You are always welcome at Kingston Mosque.</p>
          </div>
          <div className="hx-contact-grid">
            <a
              className="hx-contact-map"
              href={mapsUrl}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={`Open ${site.org} in Google Maps`}
            >
              <svg
                style={{ position: "absolute", inset: 0, width: "100%", height: "100%", opacity: 0.5 }}
                preserveAspectRatio="none"
                viewBox="0 0 400 340"
                fill="none"
                stroke="#B7C7B5"
                strokeWidth="2"
                aria-hidden
              >
                <path d="M0 90h400M0 200h400M0 280h400M90 0v340M230 0v340M320 0v340" />
                <path d="M40 40 360 300" stroke="#C9D6C7" />
              </svg>
              <div className="card">
                <div className="name">{site.org}</div>
                <div className="addr">
                  {site.address.line1}, {site.address.city}
                </div>
              </div>
              <span className="pin" aria-hidden>
                <svg width="40" height="40" viewBox="0 0 24 24" fill="#C0392B" stroke="#fff" strokeWidth="1.5">
                  <path d="M12 2a7 7 0 0 0-7 7c0 5 7 13 7 13s7-8 7-13a7 7 0 0 0-7-7z" />
                  <circle cx="12" cy="9" r="2.5" fill="#fff" stroke="none" />
                </svg>
              </span>
              <span className="open">
                Open in Maps
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" aria-hidden>
                  <path d="M7 17 17 7M9 7h8v8" />
                </svg>
              </span>
            </a>
            <div className="hx-contact-info">
              <div className="line">
                <div className="k">ADDRESS</div>
                <div className="v">
                  {site.address.line1}, {site.address.city}, {site.address.postcode}
                </div>
              </div>
              <div className="line">
                <div className="k">PHONE</div>
                <div className="v">
                  <a href={site.phoneHref}>{site.phone}</a>
                </div>
              </div>
              <div className="line">
                <div className="k">EMAIL</div>
                <div className="v">
                  <a href={`mailto:${site.email}`}>{site.email}</a>
                </div>
              </div>
              <div className="line">
                <div className="k">FACILITIES</div>
                <div className="v">
                  Separate men&apos;s &amp; women&apos;s prayer halls · ablutions · disabled access
                </div>
              </div>
              <div className="line">
                <div className="k">FOLLOW</div>
                <div className="v">{site.social.map((s) => s.label).join(" · ")}</div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

function Facility({ title, sub, icon }: { title: string; sub: string; icon: React.ReactNode }) {
  return (
    <div className="hx-facility">
      <div className="ic" aria-hidden>
        {icon}
      </div>
      <div>
        <div className="t">{title}</div>
        <div className="s">{sub}</div>
      </div>
    </div>
  );
}
