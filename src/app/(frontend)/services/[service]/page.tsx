import type { Metadata } from "next";
import { notFound } from "next/navigation";
import ContentPage from "@/components/layout/ContentPage";
import { servicePages } from "@/lib/site-content";

type Args = { params: Promise<{ service: string }> };

export function generateStaticParams() {
  return servicePages.map((s) => ({ service: s.slug }));
}

export async function generateMetadata({ params }: Args): Promise<Metadata> {
  const { service } = await params;
  const page = servicePages.find((s) => s.slug === service);
  return page ? { title: page.title, description: page.intro } : {};
}

export default async function ServiceDetailPage({ params }: Args) {
  const { service } = await params;
  const page = servicePages.find((s) => s.slug === service);
  if (!page) notFound();
  return <ContentPage page={page} />;
}
