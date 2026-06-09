import type { Metadata } from "next";
import PageHero from "@/components/layout/PageHero";
import CardGrid from "@/components/sections/CardGrid";
import { classes } from "@/lib/content";

export const metadata: Metadata = { title: "Education & Classes" };

export default function EducationPage() {
  return (
    <>
      <PageHero
        title="Education & Classes"
        crumb="Education"
        intro="Nurturing faith and knowledge for every age — children, youth, sisters and adults."
      />
      <section>
        <div className="wrap">
          <CardGrid cols={4} items={classes} />
        </div>
      </section>
      <section style={{ background: "var(--cream-2)" }}>
        <div className="wrap narrow prose">
          <h2>The KMA Madrasah</h2>
          <p>
            Kingston Mosque offers Islamic education for children aged 6–16, every evening during the
            week as well as at weekends. The Madrasah teaches Qur&apos;an recitation, Qur&apos;an
            memorisation (Hifz) and Islamic Studies, grounded in the Qur&apos;an and the prophetic
            tradition of the Final Messenger ﷺ.
          </p>
          <h3>Youth Programmes</h3>
          <p>
            The KMA Youth Club runs weekly sessions, bringing young people together for faith,
            friendship, sport and skills in a safe and welcoming environment.
          </p>
          <h3>Sisters&apos; Circle</h3>
          <p>
            The Sisters&apos; Sunday Circle is a forum for girls and young women to discuss matters of
            faith, education and life through the context of Islam — with hikes, bake sales, outdoor
            trips, Qiyam-ul-Layl programmes and charity fundraisers.
          </p>
          <h3>Adult Classes</h3>
          <p>
            Regular courses, lectures and study circles help adults deepen their understanding of the
            Qur&apos;an and Islamic knowledge throughout the year.
          </p>
          <p className="note-box">
            Enrolment forms and class schedules will be managed and published from the admin area.
            The Madrasah also welcomes enquiries from prospective teachers.
          </p>
        </div>
      </section>
    </>
  );
}
