import type { Metadata } from "next";
import PageHero from "@/components/layout/PageHero";
import DonateSection from "@/components/sections/DonateSection";
import CardGrid from "@/components/sections/CardGrid";
import { donationCategories } from "@/lib/site-content";

export const metadata: Metadata = { title: "Donate" };

export default function DonatePage() {
  return (
    <>
      <PageHero
        title="Donate — Zakat & Sadaqah"
        crumb="Donate"
        intro="Support the running of your mosque, the Madrasah, and free community services."
      />

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
            Online card and Direct Debit giving (with campaign progress and Gift Aid) can be added
            later — the design already leaves room for it. For now, bank transfer and in-person
            giving are shown, as agreed.
          </p>
        </div>
      </section>
    </>
  );
}
