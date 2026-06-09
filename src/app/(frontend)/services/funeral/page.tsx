import type { Metadata } from "next";
import PageHero from "@/components/layout/PageHero";
import { site } from "@/lib/content";

export const metadata: Metadata = { title: "Funeral Services" };

export default function FuneralPage() {
  return (
    <>
      <PageHero
        title="Funeral Services — Ghusl & Burial"
        crumb="Services / Funeral"
        intro="Free assistance arranging and managing Ghusl and burials for the community."
      />
      <section>
        <div className="wrap narrow prose">
          <h2>Inna lillahi wa inna ilayhi raji‘un</h2>
          <p>
            At a time of bereavement, Kingston Mosque is here to help. We assist families in arranging
            and managing Ghusl (ritual washing) and burial in accordance with Islamic tradition. This
            service is provided <b>free of charge</b> to the community.
          </p>
          <h3>How to contact us</h3>
          <p>
            If you have suffered a bereavement, please call the mosque as soon as possible on{" "}
            <a href={site.phoneHref}>{site.phone}</a>. A member of our team will guide you through the
            next steps, including registration, Ghusl, Janāzah prayer and burial arrangements.
          </p>
          <p className="note-box">
            Emergency contact numbers and a step-by-step bereavement guide will be added and kept
            current from the admin area.
          </p>
        </div>
      </section>
    </>
  );
}
