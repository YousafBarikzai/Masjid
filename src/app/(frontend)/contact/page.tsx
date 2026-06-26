import type { Metadata } from "next";
import PageHero from "@/components/layout/PageHero";
import ContactSection from "@/components/sections/ContactSection";
import ContactForm from "@/components/sections/ContactForm";
import Newsletter from "@/components/sections/Newsletter";

export const metadata: Metadata = { title: "Contact Us" };

export default function ContactPage() {
  return (
    <>
      <PageHero
        title="Contact Us"
        crumb="Contact"
        intro="You are always welcome at Kingston Mosque. Get in touch with the team."
      />
      <ContactSection />
      <section style={{ background: "var(--cream-2)" }}>
        <div className="wrap narrow">
          <div className="section-head">
            <div className="eyebrow">Get in touch</div>
            <h2>Send us a message</h2>
            <p>We&apos;ll get back to you as soon as we can.</p>
          </div>
          <ContactForm />
        </div>
      </section>
      <section>
        <div className="wrap">
          <Newsletter />
        </div>
      </section>
    </>
  );
}
