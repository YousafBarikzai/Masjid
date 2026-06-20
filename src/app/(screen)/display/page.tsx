import { buildSnapshot } from "@/lib/snapshot";
import DisplayBoard from "@/components/screen/DisplayBoard";

// Render fresh per request so a TV that reloads always gets the latest board.
// The client component then keeps it live (polling + ticking) without reloads.
export const dynamic = "force-dynamic";

export default async function DisplayPage() {
  const initial = await buildSnapshot();
  return <DisplayBoard initial={initial} />;
}
