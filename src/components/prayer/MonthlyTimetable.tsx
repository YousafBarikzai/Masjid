import { daysByMonth, londonTodayISO, type PrayerDay } from "@/lib/prayer";

function Cell({ begins, jamaah }: { begins: string; jamaah?: string }) {
  return (
    <td>
      <span style={{ color: "var(--muted)" }}>{begins}</span>
      {jamaah ? (
        <>
          {" / "}
          <b>{jamaah}</b>
        </>
      ) : null}
    </td>
  );
}

export default function MonthlyTimetable() {
  const months = daysByMonth();
  const todayISO = londonTodayISO();

  return (
    <>
      <div className="center mt" style={{ display: "flex", flexWrap: "wrap", gap: 8, justifyContent: "center" }}>
        {months.map((m) => (
          <a key={m.label} className="tag" href={`#m-${m.days[0].date.slice(0, 7)}`} style={{ textDecoration: "none" }}>
            {m.label.split(" ")[0]}
          </a>
        ))}
      </div>

      <p className="note-box">
        Each cell shows <b>Begins</b> / <b>Jamā‘ah</b>. Times are for Kingston upon Thames and include
        British Summer Time. Friday Dhuhr is replaced by the two Jummah congregations — see the{" "}
        <a href="/jummah">Jummah</a> page.
      </p>

      {months.map((m) => (
        <div className="tt-scroll mt" id={`m-${m.days[0].date.slice(0, 7)}`} key={m.label}>
          <table className="tt">
            <caption>{m.label}</caption>
            <thead>
              <tr>
                <th>Date</th>
                <th>Fajr</th>
                <th>Sunrise</th>
                <th>Dhuhr</th>
                <th>Asr</th>
                <th>Maghrib</th>
                <th>Isha</th>
              </tr>
            </thead>
            <tbody>
              {m.days.map((d: PrayerDay) => {
                const dd = d.date.slice(8, 10);
                return (
                  <tr key={d.date} className={d.date === todayISO ? "is-today" : ""}>
                    <td>
                      {d.weekday} {dd}
                    </td>
                    <Cell begins={d.fajr.begins} jamaah={d.fajr.jamaah} />
                    <Cell begins={d.sunrise} />
                    <Cell begins={d.dhuhr.begins} jamaah={d.dhuhr.jamaah} />
                    <Cell begins={d.asr.begins} jamaah={d.asr.jamaah} />
                    <Cell begins={d.maghrib.begins} jamaah={d.maghrib.jamaah} />
                    <Cell begins={d.isha.begins} jamaah={d.isha.jamaah} />
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      ))}
    </>
  );
}
