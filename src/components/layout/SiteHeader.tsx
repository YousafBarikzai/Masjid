import Link from "next/link";
import { getSite, getAnnouncement, getMainMenu } from "@/lib/cms";
import Brand from "./Brand";
import MobileMenu from "./MobileMenu";
import DesktopNav from "./DesktopNav";
import ThemeToggle from "./ThemeToggle";

export default async function SiteHeader() {
  const [site, alert, menu] = await Promise.all([getSite(), getAnnouncement(), getMainMenu()]);

  return (
    <>
      <div className="topbar">
        <div className="wrap">
          <div className="topbar-contact">
            <a href={site.phoneHref}>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#C4951C" strokeWidth="1.9" aria-hidden>
                <path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6 19.8 19.8 0 0 1-3.1-8.7A2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1.9.3 1.8.7 2.7a2 2 0 0 1-.5 2.1L8.1 9.9a16 16 0 0 0 6 6l1.4-1.2a2 2 0 0 1 2.1-.4c.9.3 1.8.6 2.7.7a2 2 0 0 1 1.7 2z" />
              </svg>
              {site.phone}
            </a>
            <span className="sep">|</span>
            <a href={`mailto:${site.email}`}>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#C4951C" strokeWidth="1.9" aria-hidden>
                <rect x="2" y="4" width="20" height="16" rx="2" />
                <path d="m22 7-10 6L2 7" />
              </svg>
              {site.email}
            </a>
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
            <Link href="/donate" style={{ color: "var(--gold-soft)", fontWeight: 700 }}>
              Donate
            </Link>
          </div>
        </div>
      </div>

      <header className="site">
        <div className="wrap">
          <Brand />
          <DesktopNav items={menu} />
          <div className="header-cta">
            <ThemeToggle />
            <Link className="btn btn-gold desktop-only" href="/donate">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#0C3322" strokeWidth="2" aria-hidden>
                <path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1.1-1a5.5 5.5 0 0 0-7.8 7.7l1.1 1.1L12 21l7.8-7.8 1.1-1a5.5 5.5 0 0 0 0-7.7z" />
              </svg>
              Donate
            </Link>
            <MobileMenu items={menu} />
          </div>
        </div>
      </header>

      {alert.enabled && alert.message && (
        <div className="alert">
          <div className="wrap">
            {alert.href ? (
              <Link href={alert.href} style={{ display: "contents" }}>
                <b>{alert.label}</b>
                <span>{alert.message}</span>
              </Link>
            ) : (
              <>
                <b>{alert.label}</b>
                <span>{alert.message}</span>
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
}
