import Link from "next/link";
import { site } from "@/lib/content";

export default function Brand({ light = false }: { light?: boolean }) {
  return (
    <Link className="brand" href="/" aria-label={`${site.name} home`}>
      <span className="mark">✦</span>
      <span>
        <b style={light ? { color: "#fff" } : undefined}>{site.name}</b>
        <small style={light ? { color: "#7fa294" } : undefined}>{site.org}</small>
      </span>
    </Link>
  );
}
