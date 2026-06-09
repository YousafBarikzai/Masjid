import type { Metadata } from "next";
import PageHero from "@/components/layout/PageHero";
import ContactSection from "@/components/sections/ContactSection";

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
    </>
  );
}
