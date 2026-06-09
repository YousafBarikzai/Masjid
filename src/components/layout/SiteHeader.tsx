import Link from "next/link";
import { nav } from "@/lib/content";
import { getSite, getAnnouncement } from "@/lib/cms";
import Brand from "./Brand";
import MobileMenu from "./MobileMenu";
import ThemeToggle from "./ThemeToggle";

export default async function SiteHeader() {
  const [site, alert] = await Promise.all([getSite(), getAnnouncement()]);

  return (
    <>
      <div className="topbar">
        <div className="wrap">
          <div>
            <a href={site.phoneHref}>📞 {site.phone}</a>
            <span className="sep">|</span>
            <a href={`mailto:${site.email}`}>✉ {site.email}</a>
          </div>
          <div className="desktop-only">
            {site.social.map((s, i) => (
              <span key={s.label}>
                {i > 0 && <span className="sep">·</span>}
                <a href={s.href} target="_blank" rel="noopener noreferrer">
                  {s.label}
                </a>
              </span>
            ))}
            <span className="sep">·</span>
            <Link href="/donate" style={{ color: "var(--gold-soft)", fontWeight: 600 }}>
              Donate
            </Link>
          </div>
        </div>
      </div>

      <header className="site">
        <div className="wrap">
          <Brand />
          <nav className="main">
            {nav.map((n) => (
              <Link key={n.href} href={n.href}>
                {n.label}
              </Link>
            ))}
          </nav>
          <div className="header-cta">
            <ThemeToggle />
            <Link className="btn btn-gold desktop-only" href="/donate">
              Donate
            </Link>
            <MobileMenu />
          </div>
        </div>
      </header>

      {alert.enabled && alert.message && (
        <div className="alert">
          <div className="wrap">
            <b>{alert.label}</b>
            <span>{alert.message}</span>
          </div>
        </div>
      )}
    </>
  );
}
