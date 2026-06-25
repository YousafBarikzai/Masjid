"use client";

import React, { useState } from "react";
import Link from "next/link";
import { WidgetCard } from "../WidgetCard";
import { IconStar, IconStarFilled, IconArrow } from "../icons";
import { useFavourites } from "../hooks/useFavourites";
import { ALL_DESTINATIONS } from "../destinations";

/* Client widget: user-pinned admin shortcuts (localStorage). "Manage" reveals every
   destination with a star to pin/unpin. Mount-gated so SSR markup matches first render. */

export function Favourites() {
  const { favourites, isFav, toggle, mounted } = useFavourites();
  const [managing, setManaging] = useState(false);

  return (
    <section className="kma-card">
      <header className="kma-card__head">
        <span className="kma-card__title">
          <IconStar />
          <span>Favourites</span>
        </span>
        <button
          type="button"
          className="kma-fav__manage"
          onClick={() => setManaging((v) => !v)}
          aria-expanded={managing}
        >
          {managing ? "Done" : "Manage"}
        </button>
      </header>
      <div className="kma-card__body">
        {managing ? (
          <div className="kma-list">
            {ALL_DESTINATIONS.map((d) => {
              const on = mounted && isFav(d.href);
              return (
                <button
                  key={d.href}
                  type="button"
                  className="kma-fav__pick"
                  onClick={() => toggle({ title: d.label, href: d.href })}
                  aria-pressed={on}
                >
                  <span className={`kma-fav__star${on ? " is-on" : ""}`}>
                    {on ? <IconStarFilled size={16} /> : <IconStar size={16} />}
                  </span>
                  <span className="kma-row__title">{d.label}</span>
                </button>
              );
            })}
          </div>
        ) : !mounted ? (
          <p className="kma-empty">Loading…</p>
        ) : favourites.length === 0 ? (
          <p className="kma-empty">
            No favourites yet. Tap <strong>Manage</strong> to pin the pages you use most.
          </p>
        ) : (
          <div className="kma-list">
            {favourites.map((f) => (
              <Link key={f.href} className="kma-row" href={f.href}>
                <span className="kma-row__icon">
                  <IconStarFilled size={15} />
                </span>
                <span className="kma-row__main">
                  <span className="kma-row__title">{f.title}</span>
                </span>
                <span className="kma-row__icon">
                  <IconArrow size={15} />
                </span>
              </Link>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
