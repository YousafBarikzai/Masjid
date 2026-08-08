import type { Metadata } from "next";
import Link from "next/link";
import PageHero from "@/components/layout/PageHero";

export const metadata: Metadata = {
  title: "Nikah Matrimonial Service — Kingston Mosque",
  description:
    "A private, mosque-managed nikah matrimonial service. Verified profiles, anonymous browsing, family involvement and managed introductions — never a dating app.",
};

const STEPS: Array<[string, string, string]> = [
  ["1", "Apply in confidence", "A private application reviewed personally by the mosque's Nikah team — nothing is visible to anyone until you're approved."],
  ["2", "Verification", "We verify who you are and speak to your wali or family representative. Identity documents are never published anywhere."],
  ["3", "Browse anonymously", "Approved members see anonymous profiles only — a reference like KM-F-00118, never a name, photo or contact detail."],
  ["4", "Express interest", "No messaging, no chatting. A respectful, structured expression of interest that the other member (and family) can accept or decline in private."],
  ["5", "Families connected", "On mutual interest, the Nikah team opens an official introduction, contacts both walis, and connects the families properly."],
  ["6", "Nikah, inshaAllah", "Meetings happen with family involvement, at your pace, with the mosque's support throughout — until the nikah itself."],
];

const PROMISES: Array<[string, string]> = [
  ["🔒", "Your identity stays with the mosque. Members never see your name, photograph, surname, workplace, contact details or exact address."],
  ["👪", "Family belongs in the journey. Your wali or family representative is part of every introduction — you choose how involved."],
  ["🚫", "No chatting, no swiping, no photos. This is a managed introduction service built for marriage, not a dating app."],
  ["🛡", "Safeguarded and accountable. Every profile is reviewed and verified by the Nikah team, and concerns can be reported discreetly at any time."],
];

export default function NikahPage() {
  return (
    <>
      <PageHero
        title="Nikah Matrimonial Service"
        intro="A private, dignified way to find a spouse — managed personally by Kingston Mosque, with verified members, anonymous profiles and family involvement at every step."
        crumb="Nikah Service"
      />
      <section>
        <div className="wrap narrow prose">
          <div className="member-doors">
            <div className="member-door member-door--new">
              <span className="member-door__eyebrow">Ready to begin?</span>
              <h3 className="member-door__title">Apply in confidence</h3>
              <p className="member-door__text">A private application, reviewed personally by our Nikah team. Around ten minutes.</p>
              <Link href="/nikah/apply" className="member-door__btn member-door__btn--gold">
                Start my application →
              </Link>
            </div>
            <div className="member-door member-door--existing">
              <span className="member-door__eyebrow">Already applied or approved?</span>
              <h3 className="member-door__title">Sign in to my account</h3>
              <p className="member-door__text">Check your application, browse profiles, and manage your interests.</p>
              <Link href="/nikah/account" className="member-door__btn member-door__btn--green">
                Sign in →
              </Link>
            </div>
          </div>

          <h2>Our promises to you</h2>
          <div className="nk-promises">
            {PROMISES.map(([icon, text]) => (
              <div key={icon} className="nk-promise">
                <span className="nk-promise__icon" aria-hidden>{icon}</span>
                <p>{text}</p>
              </div>
            ))}
          </div>

          <h2>How it works</h2>
          <ol className="member-journey">
            {STEPS.map(([n, t, d]) => (
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
            The service is open to practising Muslims aged 18 and over who are serious about marriage. Sisters are
            asked to provide their wali or a family representative; brothers are strongly encouraged to involve family
            too. Every application is reviewed personally and in confidence — if you'd rather talk first, contact the
            mosque office and ask for the Nikah team.
          </p>
        </div>
      </section>
    </>
  );
}
