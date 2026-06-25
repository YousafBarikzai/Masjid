import Link from "next/link";
import { getSite, getAnnouncement, getMainMenu } from "@/lib/cms";
import Brand from "./Brand";
import MobileMenu from "./MobileMenu";
import ThemeToggle from "./ThemeToggle";

export default async function SiteHeader() {
  const [site, alert, menu] = await Promise.all([getSite(), getAnnouncement(), getMainMenu()]);

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
            {menu
              .filter((n) => !n.cta)
              .map((n) =>
                n.children ? (
                  <div className="nav-item has-children" key={n.href}>
                    <Link href={n.href} className="nav-top">
                      {n.label}
                      <span className="caret" aria-hidden>
                        ▾
                      </span>
                    </Link>
                    <div className="dropdown">
                      {n.children.map((c) => (
                        <Link key={c.href} href={c.href}>
                          {c.label}
                        </Link>
                      ))}
                    </div>
                  </div>
                ) : (
                  <Link key={n.href} href={n.href} className="nav-top">
                    {n.label}
                  </Link>
                ),
              )}
          </nav>
          <div className="header-cta">
            <ThemeToggle />
            <Link className="btn btn-gold desktop-only" href="/donate">
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
