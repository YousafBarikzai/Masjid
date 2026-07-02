import type { Metadata } from "next";
import { notFound } from "next/navigation";
import ContentPage from "@/components/layout/ContentPage";
import RichTextRenderer from "@/components/cms/RichTextRenderer";
import { servicePages } from "@/lib/site-content";
import { getPageBySlug } from "@/lib/cms";

type Args = { params: Promise<{ service: string }> };

// Render per-request so edits made in the admin appear immediately.
export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: Args): Promise<Metadata> {
  const { service } = await params;
  const cms = await getPageBySlug(`services/${service}`);
  if (cms) return { title: cms.title, description: cms.intro ?? cms.meta?.description };
  const page = servicePages.find((s) => s.slug === service);
  return page ? { title: page.title, description: page.intro } : {};
}

export default async function ServiceDetailPage({ params }: Args) {
  const { service } = await params;
  const page = servicePages.find((s) => s.slug === service);
  if (!page) notFound();

  // Editable copy: when a Pages document exists for this URL (seeded on boot),
  // its title/intro/body replace the built-in text inside the same layout.
  const cms = await getPageBySlug(`services/${service}`);
  return (
    <ContentPage
      page={page}
      override={
        cms
          ? {
              title: cms.title as string,
              intro: (cms.intro as string) || undefined,
              body: <RichTextRenderer data={cms.content} />,
            }
          : undefined
      }
    />
  );
}
