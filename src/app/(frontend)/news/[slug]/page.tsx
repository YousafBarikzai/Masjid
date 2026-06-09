import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { RichText } from "@payloadcms/richtext-lexical/react";
import PageHero from "@/components/layout/PageHero";
import { getPostBySlug } from "@/lib/cms";

type Args = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Args): Promise<Metadata> {
  const { slug } = await params;
  const post = await getPostBySlug(slug);
  return post ? { title: post.title } : {};
}

export default async function PostDetail({ params }: Args) {
  const { slug } = await params;
  const post = await getPostBySlug(slug);
  if (!post) notFound();

  const img = (post.image as { url?: string } | undefined)?.url;
  const date = post.publishedDate
    ? new Date(post.publishedDate as string).toLocaleDateString("en-GB", {
        day: "numeric",
        month: "long",
        year: "numeric",
      })
    : "";

  return (
    <>
      <PageHero title={post.title as string} crumb="News" intro={date} />
      <section>
        <div className="wrap narrow prose">
          {img && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={img} alt={post.title as string} style={{ borderRadius: 14, marginBottom: 20 }} />
          )}
          {post.content ? (
            <RichText data={post.content as never} />
          ) : post.excerpt ? (
            <p>{post.excerpt as string}</p>
          ) : null}
          <p>
            <Link href="/news">← All news</Link>
          </p>
        </div>
      </section>
    </>
  );
}
