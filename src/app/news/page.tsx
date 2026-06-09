import type { Metadata } from "next";
import PageHero from "@/components/layout/PageHero";

export const metadata: Metadata = { title: "News & Announcements" };

const posts = [
  {
    date: "Latest",
    title: "Eid prayer arrangements announced",
    body: "Details of Eid congregations, timings and overflow space for the community.",
  },
  {
    date: "Ramadan",
    title: "Taraweeh & I‘tikaaf registration open",
    body: "Join us for nightly Taraweeh and register for I‘tikaaf during the last ten nights.",
  },
  {
    date: "Madrasah",
    title: "Teacher vacancies at the KMA Madrasah",
    body: "We are looking for dedicated teachers to join our growing children's Madrasah.",
  },
];

export default function NewsPage() {
  return (
    <>
      <PageHero
        title="News & Announcements"
        crumb="News"
        intro="Updates from Kingston Mosque — prayers, programmes and community notices."
      />
      <section>
        <div className="wrap">
          <div className="grid g3">
            {posts.map((p) => (
              <article className="card" key={p.title}>
                <span className="tag">{p.date}</span>
                <h3>{p.title}</h3>
                <p>{p.body}</p>
              </article>
            ))}
          </div>
          <p className="note-box center mt">
            These articles are samples. Once the admin area is connected, staff will publish real news
            and announcements here without any coding.
          </p>
        </div>
      </section>
    </>
  );
}
