import type { Metadata } from "next";
import { notFound } from "next/navigation";
import PageHero from "@/components/layout/PageHero";
import CTASection from "@/components/sections/CTASection";
import RichTextRenderer from "@/components/cms/RichTextRenderer";
import { resourcePages } from "@/lib/site-content";
import { getPageBySlug } from "@/lib/cms";

type Args = { params: Promise<{ slug: string }> };

// Render per-request so edits made in the admin appear immediately.
export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: Args): Promise<Metadata> {
  const { slug } = await params;
  const cms = await getPageBySlug(`resources/${slug}`);
  if (cms) return { title: cms.title, description: cms.intro ?? cms.meta?.description };
  const page = resourcePages.find((r) => r.slug === slug);
  return page ? { title: page.title, description: page.intro } : {};
}

export default async function ResourceDetailPage({ params }: Args) {
  const { slug } = await params;
  const page = resourcePages.find((r) => r.slug === slug);
  if (!page) notFound();

  // Editable copy: when a Pages document exists for this URL (seeded on boot),
  // its title/intro/body replace the built-in text. Downloads stay from config.
  const cms = await getPageBySlug(`resources/${slug}`);
  const title = (cms?.title as string) || page.title;
  const intro = (cms?.intro as string) ?? page.intro;

  return (
    <>
      <PageHero title={title} crumb={title} intro={intro} />
      <section>
        <div className="wrap narrow prose">
          {cms ? (
            <RichTextRenderer data={cms.content} />
          ) : (
            page.sections.map((s, i) => (
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
            ))
          )}

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
