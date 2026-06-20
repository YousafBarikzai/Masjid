import Link from "next/link";

export interface CardItem {
  icon?: string;
  tag?: string;
  title: string;
  body: string;
  href?: string;
}

export default function CardGrid({ items, cols = 4 }: { items: CardItem[]; cols?: 2 | 3 | 4 }) {
  return (
    <div className={`grid g${cols}`}>
      {items.map((it) => {
        const inner = (
          <>
            {it.icon && <div className="ic">{it.icon}</div>}
            {it.tag && <span className="tag">{it.tag}</span>}
            <h3>{it.title}</h3>
            <p>{it.body}</p>
          </>
        );
        return it.href ? (
          <Link key={it.title} className="card" href={it.href}>
            {inner}
          </Link>
        ) : (
          <div key={it.title} className="card">
            {inner}
          </div>
        );
      })}
    </div>
  );
}
