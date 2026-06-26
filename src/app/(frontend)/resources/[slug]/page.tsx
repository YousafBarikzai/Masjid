import type { Metadata } from "next";
import { notFound } from "next/navigation";
import PageHero from "@/components/layout/PageHero";
import CTASection from "@/components/sections/CTASection";
import { resourcePages } from "@/lib/site-content";

type Args = { params: Promise<{ slug: string }> };

export function generateStaticParams() {
  return resourcePages.map((r) => ({ slug: r.slug }));
}

export async function generateMetadata({ params }: Args): Promise<Metadata> {
  const { slug } = await params;
  const page = resourcePages.find((r) => r.slug === slug);
  return page ? { title: page.title, description: page.intro } : {};
}

export default async function ResourceDetailPage({ params }: Args) {
  const { slug } = await params;
  const page = resourcePages.find((r) => r.slug === slug);
  if (!page) notFound();

  return (
    <>
      <PageHero title={page.title} crumb={page.title} intro={page.intro} />
      <section>
        <div className="wrap narrow prose">
          {page.sections.map((s, i) => (
            <div key={i}>
              {s.heading && <h2>{s.heading}</h2>}
              {s.body?.map((p, j) => (
                <p key={j}>{p}</p>
              ))}
              {s.bullets && (
                <ul>
                  {s.bullets.map((b, k) => (
                    <li key={k}>{b}</li>
                  ))}
                </ul>
              )}
            </div>
          ))}

          {page.downloads && page.downloads.length > 0 && (
            <div className="resource-list">
              {page.downloads.map((d) => (
                <a
                  key={d.file}
                  className="download-link"
                  href={`/downloads/${d.file}`}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <span className="dl-ic" aria-hidden>
                    📄
                  </span>
                  {d.label}
                </a>
              ))}
            </div>
          )}

          <p className="note-box">
            Document links are placeholders until the official PDFs are added to{" "}
            <code>/public/downloads</code>.
          </p>
        </div>
      </section>
      <CTASection
        heading="Need help?"
        body="Contact the mosque office for help with membership, requests or any of these documents."
        buttonLabel="Contact the office"
        buttonHref="/contact"
      />
    </>
  );
}
