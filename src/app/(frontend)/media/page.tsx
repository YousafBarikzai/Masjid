import type { Metadata } from "next";
import PageHero from "@/components/layout/PageHero";
import ImageSlot from "@/components/media/ImageSlot";
import CTASection from "@/components/sections/CTASection";
import { mediaItems, youtubeChannelUrl } from "@/lib/site-content";

export const metadata: Metadata = { title: "Media" };

const categories = ["Friday Khutbah", "Qur’an Recitation", "Lecture"] as const;

export default function MediaPage() {
  return (
    <>
      <PageHero
        title="Media"
        crumb="Media"
        intro="Friday khutbahs, Qur’an recitation and lectures from Kingston Mosque."
      />
      {categories.map((cat) => {
        const items = mediaItems.filter((m) => m.category === cat);
        if (!items.length) return null;
        return (
          <section key={cat}>
            <div className="wrap">
              <div className="section-head">
                <div className="eyebrow">Watch</div>
                <h2>{cat}</h2>
              </div>
              <div className="media-grid">
                {items.map((m, i) => {
                  const href = m.youtubeId
                    ? `https://www.youtube.com/watch?v=${m.youtubeId}`
                    : youtubeChannelUrl;
                  return (
                    <a key={i} className="video-card" href={href} target="_blank" rel="noopener noreferrer">
                      <div className="thumb">
                        <ImageSlot slot={m.thumb} alt={`${cat} video thumbnail`} ratio="16 / 9" rounded={false} />
                        <span className="play" aria-hidden>
                          ▶
                        </span>
                      </div>
                      <div className="meta">
                        <span className="tag">{m.category}</span>
                        <h3>{m.title}</h3>
                      </div>
                    </a>
                  );
                })}
              </div>
            </div>
          </section>
        );
      })}
      <CTASection
        heading="Watch more on YouTube"
        body="Subscribe to the Kingston Mosque channel for Friday khutbahs, Qur’an recitation and lectures."
        buttonLabel="Visit our YouTube"
        buttonHref={youtubeChannelUrl}
      />
    </>
  );
}
