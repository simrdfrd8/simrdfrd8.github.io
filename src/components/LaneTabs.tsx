"use client";

import { useEffect, useId, useState, type ReactNode, type KeyboardEvent } from "react";
import clsx from "clsx";

type Lane = { id: string; label: string; blurb: string; cards: ReactNode[]; gridClass?: string; count?: number };

/** Accessible tabs: "For DJs" / "For Rappers" (arrow keys move between tabs). */
export function LaneTabs({ lanes }: { lanes: Lane[] }) {
  const usable = lanes.filter((l) => l.cards.length);
  const [active, setActive] = useState(usable.find((l) => l.id === "rapper")?.id ?? usable[0]?.id);
  const base = useId();
  useEffect(() => {
    // deep links: /shop?lane=rapper#lanes (also accepts dj / producer)
    const want = new URLSearchParams(window.location.search).get("lane");
    if (want && usable.some((l) => l.id === want)) setActive(want);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  if (!usable.length) return null;
  const onKey = (e: KeyboardEvent) => {
    if (e.key !== "ArrowRight" && e.key !== "ArrowLeft") return;
    const i = usable.findIndex((l) => l.id === active);
    const next = usable[(i + (e.key === "ArrowRight" ? 1 : -1) + usable.length) % usable.length];
    setActive(next.id);
    document.getElementById(`${base}-tab-${next.id}`)?.focus();
  };
  const current = usable.find((l) => l.id === active) ?? usable[0];
  return (
    <div>
      <div role="tablist" aria-label="Productions by audience" className="mb-6 inline-flex rounded-full border border-line-strong p-1" onKeyDown={onKey}>
        {usable.map((l) => (
          <button
            key={l.id}
            id={`${base}-tab-${l.id}`}
            role="tab"
            type="button"
            aria-selected={l.id === current.id}
            aria-controls={`${base}-panel-${l.id}`}
            tabIndex={l.id === current.id ? 0 : -1}
            onClick={() => setActive(l.id)}
            className={clsx("h-10 rounded-full px-5 text-sm font-semibold transition", l.id === current.id ? "bg-cream text-ink" : "text-cream-dim hover:text-cream")}
          >
            {l.label} <span className="ml-1 opacity-60">{l.count ?? l.cards.length}</span>
          </button>
        ))}
      </div>
      <div id={`${base}-panel-${current.id}`} role="tabpanel" aria-labelledby={`${base}-tab-${current.id}`}>
        <p className="mb-8 max-w-xl text-cream-dim">{current.blurb}</p>
        <div className={current.gridClass ?? "grid gap-x-6 gap-y-12 sm:grid-cols-2 lg:grid-cols-4"}>{current.cards}</div>
      </div>
    </div>
  );
}
