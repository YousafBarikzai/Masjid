import type { Metadata } from "next";
import { notFound } from "next/navigation";
import PageHero from "@/components/layout/PageHero";
import RenderBlocks from "@/components/cms/RenderBlocks";
import { getPageBySlug } from "@/lib/cms";

type Args = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Args): Promise<Metadata> {
  const { slug } = await params;
  const page = await getPageBySlug(slug);
  if (!page) return {};
  return { title: page.title, description: page.meta?.description };
}

export default async function CmsPage({ params }: Args) {
  const { slug } = await params;
  const page = await getPageBySlug(slug);
  if (!page) notFound();

  return (
    <>
      <PageHero title={page.title} intro={page.intro} crumb={page.title} />
      <section>
        <div className="wrap narrow prose">
          <RenderBlocks blocks={page.layout} />
        </div>
      </section>
    </>
  );
}
