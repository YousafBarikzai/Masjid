import type { Metadata } from "next";
import Link from "next/link";
import PageHero from "@/components/layout/PageHero";
import RichTextRenderer from "@/components/cms/RichTextRenderer";
import { getPayloadClient } from "@/lib/payloadClient";

/* The public membership hub: what membership is (CMS-editable benefits), how
   the journey works, and the two doors — apply, or sign in to your account. */

export const metadata: Metadata = {
  title: "KMA Membership",
  description: "Become a member of Kingston Muslim Association — apply online and track your application.",
};

export const dynamic = "force-dynamic";

const JOURNEY = [
  ["1", "Apply online", "Five short steps — about ten minutes."],
  ["2", "We review it", "The committee checks your application and your two proposers."],
  ["3", "Pay the fee", "Approved? You'll get the bank details and your personal reference."],
  ["4", "We verify payment", "A volunteer confirms it arrived in the KMA account."],
  ["5", "You're a member", "Membership number, digital card, and a year of membership."],
];

export default async function MembershipPage() {
  let benefits: unknown = null;
  let fee = 12;
  try {
    const payload = await getPayloadClient();
    const s = (await payload.findGlobal({ slug: "membership-settings" as never })) as Record<string, unknown>;
    benefits = s?.benefits ?? null;
    fee = Number(s?.annualFee ?? 12);
  } catch {
    /* settings not created yet — the page still works */
  }

  return (
    <>
      <PageHero
        title="KMA Membership"
        intro="Join Kingston Muslim Association — have your say, support the mosque, and be part of the decisions."
        crumb="Membership"
      />
      <section>
        <div className="wrap narrow prose">
          <div className="member-doors">
            <div className="member-door member-door--new">
              <span className="member-door__eyebrow">New to KMA?</span>
              <h3 className="member-door__title">Become a member</h3>
              <p className="member-door__text">Five short steps — about ten minutes. Your progress is saved as you go.</p>
              <Link href="/membership/apply" className="member-door__btn member-door__btn--gold">
                Apply for membership →
              </Link>
            </div>
            <div className="member-door member-door--existing">
              <span className="member-door__eyebrow">Already applied, or a member?</span>
              <h3 className="member-door__title">Check my application</h3>
              <p className="member-door__text">Sign in to track progress, pay your fee, or view your membership card.</p>
              <Link href="/membership/account" className="member-door__btn member-door__btn--green">
                Sign in to my account →
              </Link>
            </div>
          </div>

          <h2>How it works</h2>
          <ol className="member-journey">
            {JOURNEY.map(([n, t, d]) => (
              <li key={n}>
                <span className="member-journey__n">{n}</span>
                <div>
                  <b>{t}</b>
                  <p>{d}</p>
                </div>
              </li>
            ))}
          </ol>
          <p className="note-box">
            The annual membership fee is <b>£{fee}</b>, payable by bank transfer once your application is approved.
            You&apos;ll need two current KMA members to propose you.
          </p>

          <h2>Rights &amp; benefits of membership</h2>
          {benefits ? (
            <RichTextRenderer data={benefits} />
          ) : (
            <ul>
              <li>Vote at the Annual General Meeting and help choose the committee.</li>
              <li>Stand for election to serve the community.</li>
              <li>Have a formal say in how the mosque is run and developed.</li>
              <li>Receive members&apos; notices, meeting papers and community updates.</li>
            </ul>
          )}
        </div>
      </section>
    </>
  );
}
