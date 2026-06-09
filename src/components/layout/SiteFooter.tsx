import Link from "next/link";
import { site } from "@/lib/content";
import Brand from "./Brand";

export default function SiteFooter() {
  return (
    <footer className="site">
      <div className="wrap">
        <div className="cols">
          <div>
            <div style={{ marginBottom: 12 }}>
              <Brand light />
            </div>
            <p style={{ maxWidth: "26em" }}>
              A registered charity providing prayer, education and community services in Kingston
              upon Thames since {site.since}.
            </p>
          </div>
          <div>
            <h4>Visit</h4>
            <Link href="/prayer-times">Prayer Times</Link>
            <Link href="/jummah">Jummah</Link>
            <Link href="/events">Ramadan &amp; Eid</Link>
            <Link href="/contact">Contact</Link>
          </div>
          <div>
            <h4>Get Involved</h4>
            <Link href="/education">Education</Link>
            <Link href="/services">Services</Link>
            <Link href="/donate">Donate</Link>
            <Link href="/about">About</Link>
          </div>
          <div>
            <h4>Contact</h4>
            <a href={site.phoneHref}>{site.phone}</a>
            <a href={`mailto:${site.email}`}>{site.email}</a>
            <span style={{ display: "block", padding: "5px 0" }}>
              {site.address.line1}, {site.address.postcode}
            </span>
          </div>
        </div>
        <div className="base">
          <span>
            © {new Date().getFullYear()} {site.org}. {site.charity}.
          </span>
          <span>Built with care for the Ummah</span>
        </div>
      </div>
    </footer>
  );
}
