import Link from "next/link";
import type { Campaign } from "@/lib/cms";

/* Live fundraising campaigns with a progress bar. Each card shows the amount
   raised against its goal, a percentage, and a link to give. Driven by the
   admin (Donations → Campaigns); renders nothing when there are none. */

function gbp(n: number): string {
  return "£" + Math.round(n).toLocaleString("en-GB");
}

export default function Campaigns({ campaigns }: { campaigns: Campaign[] }) {
  if (!campaigns?.length) return null;
  return (
    <section className="camp-section">
      <div className="wrap">
        <div className="section-head">
          <div className="eyebrow">Appeals</div>
          <h2>Current campaigns</h2>
          <p>Help us reach these goals for the mosque and community.</p>
        </div>
        <div className="camp-grid">
          {campaigns.map((c, i) => {
            const pct = c.goal > 0 ? Math.min(Math.round((c.raised / c.goal) * 100), 100) : 0;
            const Card = (
              <>
                {c.imageUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img className="camp-img" src={c.imageUrl} alt={c.title} />
                ) : (
                  <div className="camp-img camp-img--ph" aria-hidden />
                )}
                <div className="camp-body">
                  <h3>{c.title}</h3>
                  <div className="camp-bar" role="progressbar" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100}>
                    <span className="camp-bar-fill" style={{ width: `${pct}%` }} />
                  </div>
                  <div className="camp-meta">
                    <span className="camp-raised">{gbp(c.raised)}</span>
                    {c.goal > 0 && <span className="camp-goal">of {gbp(c.goal)}</span>}
                    <span className="camp-pct">{pct}%</span>
                  </div>
                  {c.link ? <span className="camp-cta">Donate to this appeal →</span> : null}
                </div>
              </>
            );
            return c.link ? (
              <Link
                key={i}
                href={c.link}
                target={c.link.startsWith("http") ? "_blank" : undefined}
                rel="noopener noreferrer"
                className="camp-card"
              >
                {Card}
              </Link>
            ) : (
              <div key={i} className="camp-card">
                {Card}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
