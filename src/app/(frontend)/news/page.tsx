import type { Metadata } from "next";
import Link from "next/link";
import PageHero from "@/components/layout/PageHero";
import ImageSlot from "@/components/media/ImageSlot";
import { getPosts } from "@/lib/cms";
import { newsSeed } from "@/lib/site-content";

export const metadata: Metadata = { title: "News & Announcements" };

export default async function NewsPage() {
  const fromCms = await getPosts();
  const useCms = fromCms.length > 0;

  const items = useCms
    ? fromCms.map((p) => ({
        title: p.title,
        date: p.date,
        category: "News",
        excerpt: p.body,
        image: undefined as string | undefined,
        href: p.slug ? `/news/${p.slug}` : undefined,
      }))
    : newsSeed.map((n) => ({
        title: n.title,
        date: n.date,
        category: n.category,
        excerpt: n.excerpt,
        image: n.image as string | undefined,
        href: undefined,
      }));

  return (
    <>
      <PageHero
        title="News & Announcements"
        crumb="News"
        intro="Updates from Kingston Mosque — prayers, programmes and community notices."
      />
      <section>
        <div className="wrap">
          <div className="news-grid">
            {items.map((n, i) => {
              const inner = (
                <>
                  {n.image ? <ImageSlot slot={n.image} alt={n.title} ratio="16 / 9" rounded={false} /> : null}
                  <div className="body">
                    <span className="tag">{n.category}</span>
                    <span className="date">{n.date}</span>
                    <h3>{n.title}</h3>
                    <p>{n.excerpt}</p>
                    {n.href && <span className="more">Read more →</span>}
                  </div>
                </>
              );
              return n.href ? (
                <Link key={i} className="news-card" href={n.href}>
                  {inner}
                </Link>
              ) : (
                <article key={i} className="news-card">
                  {inner}
                </article>
              );
            })}
          </div>
          {!useCms && (
            <p className="note-box" style={{ marginTop: 24 }}>
              These are sample posts. Real news published in the admin (News &amp; Announcements) will
              appear here automatically.
            </p>
          )}
        </div>
      </section>
    </>
  );
}
