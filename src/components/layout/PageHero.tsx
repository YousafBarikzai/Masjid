import Link from "next/link";

export default function PageHero({
  title,
  intro,
  crumb,
}: {
  title: string;
  intro?: string;
  crumb?: string;
}) {
  return (
    <section className="page-hero">
      <div className="wrap">
        <div className="breadcrumb">
          <Link href="/">Home</Link>
          {crumb ? ` / ${crumb}` : ""}
        </div>
        <h1>{title}</h1>
        {intro && <p>{intro}</p>}
      </div>
    </section>
  );
}
