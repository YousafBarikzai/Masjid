import PageHero from "@/components/layout/PageHero";
import ImageSlot from "@/components/media/ImageSlot";
import Gallery from "@/components/media/Gallery";
import CTASection from "@/components/sections/CTASection";
import type { ServicePage } from "@/lib/site-content";

/** Renders a service/content page (hero + lead image + body sections + optional
 *  gallery + call-to-action) from structured data. */
export default function ContentPage({ page }: { page: ServicePage }) {
  return (
    <>
      <PageHero title={page.title} crumb={page.title} intro={page.intro} />

      <section>
        <div className="wrap content-layout">
          <div className="content-media">
            <ImageSlot slot={page.image} alt={page.imageAlt} ratio="4 / 3" />
          </div>
          <div className="prose content-body">
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
          </div>
        </div>
      </section>

      {page.gallery && page.gallery.length > 0 && (
        <section style={{ background: "var(--cream-2)" }}>
          <div className="wrap">
            <div className="section-head">
              <div className="eyebrow">Gallery</div>
              <h2>{page.title}</h2>
            </div>
            <Gallery slots={page.gallery} alt={`${page.title} — photo`} />
          </div>
        </section>
      )}

      {page.ctaHeading && (
        <CTASection
          heading={page.ctaHeading}
          body={page.ctaBody}
          buttonLabel="Contact the office"
          buttonHref="/contact"
          secondaryLabel="Donate"
          secondaryHref="/donate"
        />
      )}
    </>
  );
}
