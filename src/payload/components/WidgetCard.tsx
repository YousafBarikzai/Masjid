import React from "react";
import Link from "next/link";

/* Presentational card shell shared by the dashboard widgets. No 'use client' and no
   server-only imports, so it renders in both server and client widgets. */

export function WidgetCard({
  title,
  icon,
  action,
  className,
  children,
}: {
  title: string;
  icon?: React.ReactNode;
  action?: { label: string; href: string };
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <section className={`kma-card${className ? " " + className : ""}`}>
      <header className="kma-card__head">
        <span className="kma-card__title">
          {icon}
          <span>{title}</span>
        </span>
        {action && (
          <Link className="kma-card__action" href={action.href}>
            {action.label}
          </Link>
        )}
      </header>
      <div className="kma-card__body">{children}</div>
    </section>
  );
}
