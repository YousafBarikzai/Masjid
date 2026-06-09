import { jummah } from "@/lib/content";

export default function JummahSection() {
  return (
    <section className="jummah" id="jummah">
      <div className="wrap">
        <div className="section-head">
          <div className="eyebrow">Friday Prayer</div>
          <h2>Jummah Times</h2>
          <p>{jummah.intro}</p>
        </div>
        <div className="jrow">
          {jummah.congregations.map((c) => (
            <div className="jcard" key={c.name}>
              <div className="eyebrow">
                {c.name} · {c.language}
              </div>
              <div className="big">{c.khutbah}</div>
              <small>
                Doors {c.doors} · Khutbah {c.khutbah}
              </small>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
