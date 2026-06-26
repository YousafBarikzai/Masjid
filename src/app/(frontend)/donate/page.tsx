import type { Metadata } from "next";
import PageHero from "@/components/layout/PageHero";
import DonateSection from "@/components/sections/DonateSection";
import CardGrid from "@/components/sections/CardGrid";
import QuickDonate from "@/components/donate/QuickDonate";
import { donationCategories } from "@/lib/site-content";
import { getDonation } from "@/lib/cms";

export const metadata: Metadata = { title: "Donate" };

export const dynamic = "force-dynamic";

export default async function DonatePage() {
  const donation = await getDonation();
  const donateUrl = donation.donateUrl ?? "";

  return (
    <>
      <PageHero
        title="Donate — Zakat & Sadaqah"
        crumb="Donate"
        intro="Support the running of your mosque, the Madrasah, and free community services."
      />

      {donateUrl && (
        <section className="qd-section">
          <div className="wrap narrow">
            <div className="section-head" style={{ marginBottom: 26 }}>
              <div className="eyebrow">Give online</div>
              <h2>Make a donation</h2>
              <p>Quick, secure giving — one-off or monthly.</p>
            </div>
            <QuickDonate
              donateUrl={donateUrl}
              presets={donation.presets ?? [5, 10, 25, 50, 100]}
              giftAid={donation.giftAid ?? true}
              monthly={donation.monthly ?? true}
            />
          </div>
        </section>
      )}

      <section>
        <div className="wrap">
          <div className="section-head">
            <div className="eyebrow">Ways to give</div>
            <h2>Where your support goes</h2>
            <p>Choose how you’d like to help your mosque and community.</p>
          </div>
          <CardGrid cols={4} items={donationCategories} />
          <p className="note-box" style={{ marginTop: 24 }}>
            Consider setting up a <strong>regular monthly donation</strong> — steady support helps the
            mosque plan ahead and keeps services running all year round.
          </p>
        </div>
      </section>

      <DonateSection />
      <section>
        <div className="wrap narrow prose">
          <h2>Where your donation goes</h2>
          <p>
            Kingston Mosque is run entirely on the generosity of the community. Your contributions
            keep the doors open for daily prayers, fund the children&apos;s Madrasah, and allow us to
            provide free funeral and Ghusl support to families in need.
          </p>
          <h3>Zakat &amp; Sadaqah</h3>
          <p>
            We welcome both your obligatory Zakat and voluntary Sadaqah. You can give by bank transfer
            using the details above, or in person via the donation box by the main office inside the
            mosque.
          </p>
          <p className="note-box">
            {donateUrl
              ? "You can give securely online using the Donate panel above (Apple Pay & Google Pay supported), by bank transfer using the details above, or in person via the donation box by the main office."
              : "You can give by bank transfer using the details above, or in person via the donation box by the main office inside the mosque."}
          </p>
        </div>
      </section>
    </>
  );
}
