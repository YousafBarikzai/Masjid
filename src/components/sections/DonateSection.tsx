import { getDonation } from "@/lib/cms";

export default async function DonateSection() {
  const donation = await getDonation();
  return (
    <section className="donate" id="donate">
      <div className="wrap">
        <div className="inner">
          <div>
            <div className="eyebrow" style={{ color: "var(--gold-soft)" }}>
              Support your mosque
            </div>
            <h2>{donation.heading}</h2>
            <p>{donation.body}</p>
          </div>
          <div className="give-box">
            {donation.bank.map((b) => (
              <div className="line" key={b.label}>
                <span>{b.label}</span>
                <b>{b.value}</b>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
