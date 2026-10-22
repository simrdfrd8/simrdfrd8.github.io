"use client";

import { useEffect, useId, useState, type KeyboardEvent, type ReactNode } from "react";
import clsx from "clsx";

export type MerchTab = { id: string; label: string; count: number };

/**
 * Shop categories (All / Men / Women / Unisex). The grid is rendered once on the server (static export); a tab only hides
 * the cards (data-category) and brand groups (data-categories) outside it, so nothing is duplicated and All works without JS.
 * Linkable: /shop/merch?category=men (read client-side, kept in the URL with replaceState). Unknown categories fall back to All.
 */
export function MerchCategoryTabs({ tabs, children, label = "Merch categories" }: { tabs: MerchTab[]; children: ReactNode; label?: string }) {
  const [active, setActive] = useState(tabs[0]?.id);
  const base = useId();
  useEffect(() => {
    const want = new URLSearchParams(window.location.search).get("category");
    if (want && tabs.some((t) => t.id === want)) setActive(want);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  const select = (id: string) => {
    setActive(id);
    const url = new URL(window.location.href);
    if (id === tabs[0]?.id) url.searchParams.delete("category");
    else url.searchParams.set("category", id);
    window.history.replaceState(window.history.state, "", url.pathname + url.search + url.hash);
  };
  const onKey = (e: KeyboardEvent) => {
    if (e.key !== "ArrowRight" && e.key !== "ArrowLeft") return;
    const i = tabs.findIndex((t) => t.id === active);
    const next = tabs[(i + (e.key === "ArrowRight" ? 1 : -1) + tabs.length) % tabs.length];
    select(next.id);
    document.getElementById(`${base}-tab-${next.id}`)?.focus();
  };
  const filters = tabs
    .slice(1)
    .map((t) => `[data-merch-shop][data-active-category="${t.id}"] [data-category]:not([data-category="${t.id}"]),[data-merch-shop][data-active-category="${t.id}"] [data-categories]:not([data-categories~="${t.id}"]){display:none}`)
    .join("");
  return (
    <div data-merch-shop data-active-category={active}>
      {filters && <style>{filters}</style>}
      {tabs.length > 1 && (
        <div role="tablist" aria-label={label} className="mb-8 inline-flex max-w-full overflow-x-auto rounded-full border border-line-strong p-1" onKeyDown={onKey} data-merch-categories>
          {tabs.map((t) => (
            <button
              key={t.id}
              id={`${base}-tab-${t.id}`}
              role="tab"
              type="button"
              aria-selected={t.id === active}
              aria-controls={`${base}-panel`}
              tabIndex={t.id === active ? 0 : -1}
              onClick={() => select(t.id)}
              data-category-tab={t.id}
              className={clsx("h-10 shrink-0 rounded-full px-4 text-sm font-semibold transition sm:px-5", t.id === active ? "bg-cream text-ink" : "text-cream-dim hover:text-cream")}
            >
              {t.label} <span className="ml-1 opacity-60">{t.count}</span>
            </button>
          ))}
        </div>
      )}
      <div id={`${base}-panel`} role="tabpanel" aria-labelledby={`${base}-tab-${active}`}>
        {children}
      </div>
    </div>
  );
}
