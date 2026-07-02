import { notFound } from "next/navigation";
import { buildSnapshot } from "@/lib/snapshot";
import { getPayloadClient } from "@/lib/payloadClient";
import ScreenPlayer from "@/components/screen/ScreenPlayer";

/* One TV = one URL: /display/<screen-slug> (e.g. /display/mimbar-outside).
   Plays that screen's slide playlist over the live prayer board. Managed in
   the admin under Digital Screens; the TV picks up changes within a minute. */

type Args = { params: Promise<{ screen: string }> };

export const dynamic = "force-dynamic";

export default async function ScreenPage({ params }: Args) {
  const { screen } = await params;

  let doc: Record<string, unknown> | null = null;
  try {
    const p = await getPayloadClient();
    const res = await p.find({
      collection: "screens" as never,
      where: { slug: { equals: screen } } as never,
      limit: 1,
      depth: 1,
      overrideAccess: true,
    });
    doc = (res.docs[0] as Record<string, unknown>) ?? null;
  } catch {
    /* database briefly unavailable — fall through to the plain board */
  }

  if (!doc) notFound();

  const initial = await buildSnapshot();
  return <ScreenPlayer slug={screen} initialScreen={doc as never} initialSnapshot={initial} />;
}
