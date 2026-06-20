import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { RichText } from "@payloadcms/richtext-lexical/react";
import PageHero from "@/components/layout/PageHero";
import { getEventBySlug } from "@/lib/cms";

type Args = { params: Promise<{ slug: string }> };

function fmt(date?: string) {
  return date
    ? new Date(date).toLocaleString("en-GB", {
        weekday: "long",
        day: "numeric",
        month: "long",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      })
    : "";
}

export async function generateMetadata({ params }: Args): Promise<Metadata> {
  const { slug } = await params;
  const e = await getEventBySlug(slug);
  return e ? { title: e.title } : {};
}

export default async function EventDetail({ params }: Args) {
  const { slug } = await params;
  const e = await getEventBySlug(slug);
  if (!e) notFound();

  const img = (e.image as { url?: string } | undefined)?.url;
  const meta = [e.category, e.start ? fmt(e.start as string) : "", e.location].filter(Boolean).join(" · ");

  return (
    <>
      <PageHero title={e.title as string} crumb="Events" intro={meta} />
      <section>
        <div className="wrap narrow prose">
          {img && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={img} alt={e.title as string} style={{ borderRadius: 14, marginBottom: 20 }} />
          )}
          {e.description ? (
            <RichText data={e.description as never} />
          ) : e.summary ? (
            <p>{e.summary as string}</p>
          ) : (
            <p>Further details will be announced soon, inshā&apos;Allah.</p>
          )}
          {e.registrationUrl ? (
            <p>
              <a className="btn btn-green" href={e.registrationUrl as string} target="_blank" rel="noopener noreferrer">
                Register / more info
              </a>
            </p>
          ) : null}
          <p>
            <Link href="/events">← All events</Link>
          </p>
        </div>
      </section>
    </>
  );
}
