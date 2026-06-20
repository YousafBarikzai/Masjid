import { getSpecialSchedule } from "@/lib/cms";

export default async function SpecialSection({ alwaysShow = false }: { alwaysShow?: boolean }) {
  const s = await getSpecialSchedule();
  const show = alwaysShow || s.ramadanEnabled || s.eidEnabled;
  if (!show) return null;

  const both = s.ramadanEnabled && s.eidEnabled;

  return (
    <section id="ramadan" style={{ background: "var(--cream-2)" }}>
      <div className="wrap">
        <div className="section-head">
          <div className="eyebrow">Blessed Days</div>
          <h2>Ramadan &amp; Eid</h2>
          <p>Timings and arrangements for the blessed month and the days of Eid.</p>
        </div>

        {!s.ramadanEnabled && !s.eidEnabled && (
          <p className="note-box center">
            Ramadan and Eid details will appear here when published from the admin area.
          </p>
        )}

        <div className={`grid ${both ? "g2" : ""}`} style={{ maxWidth: both ? undefined : 720, margin: "0 auto" }}>
          {s.ramadanEnabled && (
            <div className="card">
              <span className="tag">Ramadan</span>
              <h3>{s.ramadanHeading}</h3>
              {s.ramadanIntro && <p style={{ marginBottom: 12 }}>{s.ramadanIntro}</p>}
              {s.ramadanItems.length > 0 && (
                <ul className="info" style={{ marginTop: 4 }}>
                  {s.ramadanItems.map((it) => (
                    <li key={it.label}>
                      <span className="k">{it.label}</span>
                      <span>{it.value}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}

          {s.eidEnabled && (
            <div className="card" style={{ background: "var(--green)", color: "#eaf4ee", borderColor: "var(--green)" }}>
              <span className="tag" style={{ background: "rgba(232,213,154,.18)", color: "var(--gold-soft)" }}>
                Eid
              </span>
              <h3 style={{ color: "#fff" }}>{s.eidTitle || "Eid Prayer"}</h3>
              {s.eidDateText && <p style={{ color: "#cfe3d9" }}>{s.eidDateText}</p>}
              {s.eidPrayers.length > 0 && (
                <ul style={{ listStyle: "none", marginTop: 12 }}>
                  {s.eidPrayers.map((p, i) => (
                    <li
                      key={i}
                      style={{ display: "flex", justifyContent: "space-between", gap: 12, padding: "8px 0", borderTop: "1px solid rgba(255,255,255,.12)" }}
                    >
                      <span>{p.label}{p.location ? ` · ${p.location}` : ""}</span>
                      <b style={{ color: "var(--gold-soft)" }}>{p.time}</b>
                    </li>
                  ))}
                </ul>
              )}
              {s.eidNotes && <p style={{ color: "#cfe3d9", marginTop: 12 }}>{s.eidNotes}</p>}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
