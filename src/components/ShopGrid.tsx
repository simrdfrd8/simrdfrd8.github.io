"use client";

import { useState, type ReactNode } from "react";
import clsx from "clsx";

export function ShopGrid({ groups, order, cards }: { groups: { id: string; label: string; ids: string[] }[]; order: string[]; cards: Record<string, ReactNode> }) {
  const [active, setActive] = useState("all");
  const ids = active === "all" ? order : groups.find((g) => g.id === active)?.ids ?? order;
  return (
    <>
      <div className="no-scrollbar relative -mx-5 mb-10 flex gap-2 overflow-x-auto px-5 sm:mx-0 sm:px-0" role="group" aria-label="Filter products">
        {[{ id: "all", label: "Everything", ids: order }, ...groups].map((g) => (
          <button
            key={g.id}
            type="button"
            aria-pressed={active === g.id}
            onClick={() => setActive(g.id)}
            className={clsx("h-10 shrink-0 rounded-full px-5 text-sm font-medium transition", active === g.id ? "bg-cream text-ink" : "border border-line-strong text-cream-dim hover:text-cream")}
          >
            {g.label} <span className="ml-1 opacity-60">{g.ids.length}</span>
          </button>
        ))}
      </div>
      <div className="grid gap-x-6 gap-y-14 sm:grid-cols-2 lg:grid-cols-4">{ids.map((id) => cards[id])}</div>
    </>
  );
}
