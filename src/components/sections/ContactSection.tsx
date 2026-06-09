import { getSite } from "@/lib/cms";

export default async function ContactSection() {
  const site = await getSite();
  const mapSrc = `https://www.google.com/maps?q=${encodeURIComponent(site.mapsQuery)}&output=embed`;
  return (
    <section className="contact" id="contact" style={{ background: "var(--cream-2)" }}>
      <div className="wrap">
        <div className="section-head">
          <div className="eyebrow">Visit Us</div>
          <h2>Location &amp; Contact</h2>
          <p>You are always welcome at {site.name}.</p>
        </div>
        <div className="grid">
          <div className="map">
            <iframe
              title="Map to Kingston Mosque"
              src={mapSrc}
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
            />
          </div>
          <ul className="info">
            <li>
              <span className="k">Address</span>
              <span>
                {site.address.line1}, {site.address.city}, {site.address.postcode}
              </span>
            </li>
            <li>
              <span className="k">Phone</span>
              <span>
                <a href={site.phoneHref}>{site.phone}</a>
              </span>
            </li>
            <li>
              <span className="k">Email</span>
              <span>
                <a href={`mailto:${site.email}`}>{site.email}</a>
              </span>
            </li>
            <li>
              <span className="k">Facilities</span>
              <span>Separate men&apos;s &amp; women&apos;s prayer halls · ablutions · disabled access</span>
            </li>
            <li>
              <span className="k">Follow</span>
              <span>
                {site.social.map((s, i) => (
                  <span key={s.label}>
                    {i > 0 && " · "}
                    <a href={s.href} target="_blank" rel="noopener noreferrer">
                      {s.label}
                    </a>
                  </span>
                ))}
              </span>
            </li>
          </ul>
        </div>
      </div>
    </section>
  );
}
