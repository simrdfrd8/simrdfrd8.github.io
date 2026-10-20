"use client";

import { useCallback, useEffect, useId, useMemo, useRef, useState } from "react";
import clsx from "clsx";
import type { Asset, Product } from "@/lib/catalog/schema";
import { searchAssets } from "@/lib/catalog/filters";
import { MediaImage } from "./MediaImage";
import { CheckoutButton } from "./CheckoutButton";
import { buttonClass } from "./ui";

type Item = { asset: Asset; product?: Product; priceLabel?: string; artistLabel: string };

export function MediaGallery({ items, artists }: { items: Item[]; artists: { slug: string; name: string }[] }) {
  const [q, setQ] = useState("");
  const [type, setType] = useState("all");
  const [artist, setArtist] = useState("all");
  const [open, setOpen] = useState<number | null>(null);
  const searchId = useId();
  const artistId = useId();
  const types = useMemo(() => ["all", ...new Set(items.map((i) => i.asset.type))], [items]);
  const usedArtists = artists.filter((a) => items.some((i) => i.asset.artist === a.slug));
  const filtered = useMemo(() => {
    const ids = new Set(searchAssets(items.map((i) => i.asset), q, { type, artist }).map((a) => a.id));
    return items.filter((i) => ids.has(i.asset.id));
  }, [items, q, type, artist]);

  return (
    <div>
      <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="flex flex-wrap gap-2" role="group" aria-label="Filter by type">
          {types.map((t) => (
            <button
              key={t}
              type="button"
              aria-pressed={type === t}
              onClick={() => setType(t)}
              className={clsx("h-9 rounded-full px-4 text-sm font-medium capitalize transition", type === t ? "bg-cream text-ink" : "border border-line-strong text-cream-dim hover:text-cream")}
            >
              {t === "all" ? "All" : t.replace("-", " ")}
            </button>
          ))}
        </div>
        <div className="flex gap-3">
          <label htmlFor={artistId} className="sr-only">
            Artist
          </label>
          <select id={artistId} value={artist} onChange={(e) => setArtist(e.target.value)} className="h-10 rounded-full border border-line-strong bg-ink px-4 text-sm text-cream">
            <option value="all">All artists</option>
            {usedArtists.map((a) => (
              <option key={a.slug} value={a.slug}>
                {a.name}
              </option>
            ))}
          </select>
          <label htmlFor={searchId} className="sr-only">
            Search artwork
          </label>
          <input
            id={searchId}
            type="search"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search art…"
            className="h-10 w-full rounded-full border border-line-strong bg-ink px-4 text-sm text-cream placeholder:text-muted md:w-56"
          />
        </div>
      </div>
      <p className="sr-only" aria-live="polite">
        {filtered.length} pieces shown
      </p>
      {filtered.length === 0 ? (
        <p className="py-20 text-center text-muted">Nothing matches that yet.</p>
      ) : (
        <ul className="columns-1 gap-5 sm:columns-2 lg:columns-3 [&>li]:mb-5">
          {filtered.map((it, i) => (
            <li key={it.asset.id} className="break-inside-avoid">
              <button type="button" onClick={() => setOpen(i)} className="group block w-full text-left" aria-label={`Open ${it.asset.title}`}>
                <MediaImage
                  asset={it.asset}
                  sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
                  className="rounded-2xl ring-1 ring-line transition group-hover:ring-line-strong"
                  imgClassName="transition-transform duration-700 group-hover:scale-[1.02]"
                />
                <span className="mt-3 flex items-baseline justify-between gap-3">
                  <span className="font-semibold">{it.asset.title}</span>
                  <span className="text-sm text-muted">{it.product ? it.priceLabel : it.artistLabel}</span>
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}
      <Lightbox items={filtered} index={open} onClose={() => setOpen(null)} onIndex={setOpen} />
    </div>
  );
}

export function Lightbox({ items, index, onClose, onIndex }: { items: Item[]; index: number | null; onClose: () => void; onIndex: (i: number) => void }) {
  const ref = useRef<HTMLDialogElement>(null);
  const titleId = useId();
  const item = index !== null ? items[index] : undefined;
  const step = useCallback((d: number) => index !== null && onIndex((index + d + items.length) % items.length), [index, items.length, onIndex]);
  useEffect(() => {
    const d = ref.current;
    if (!d) return;
    if (item && !d.open) d.showModal();
    if (!item && d.open) d.close();
  }, [item]);
  useEffect(() => {
    if (!item) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight") step(1);
      if (e.key === "ArrowLeft") step(-1);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [item, step]);
  return (
    <dialog ref={ref} aria-labelledby={titleId} onClose={onClose} className="m-0 h-dvh max-h-none w-screen max-w-none bg-ink/95 p-0 text-cream backdrop:bg-ink/80">
      {item && (
        <div className="grid h-full grid-rows-[1fr_auto] lg:grid-cols-[1fr_360px] lg:grid-rows-1">
          <div className="relative flex min-h-0 items-center justify-center p-4 lg:p-10">
            <MediaImage asset={item.asset} fit="contain" sizes="100vw" className="h-full w-full !bg-transparent" priority />
          </div>
          <aside className="flex flex-col gap-4 border-t border-line bg-raised p-6 lg:border-t-0 lg:border-l">
            <p className="kicker text-muted">{item.artistLabel}</p>
            <h2 id={titleId} className="display text-4xl">
              {item.asset.title}
            </h2>
            {item.asset.description && <p className="text-cream-dim">{item.asset.description}</p>}
            <div className="flex flex-wrap gap-3">
              {item.product ? (
                <CheckoutButton product={item.product} priceLabel={item.priceLabel ?? ""} />
              ) : (
                <a href="/contact/?type=commission" className={buttonClass("secondary")}>
                  Commission something like this
                </a>
              )}
            </div>
            <div className="mt-auto flex gap-2">
              <button type="button" onClick={() => step(-1)} className={buttonClass("secondary", "sm")} aria-label="Previous piece">
                ← Prev
              </button>
              <button type="button" onClick={() => step(1)} className={buttonClass("secondary", "sm")} aria-label="Next piece">
                Next →
              </button>
              <form method="dialog" className="ml-auto">
                <button className={buttonClass("primary", "sm")}>Close</button>
              </form>
            </div>
          </aside>
        </div>
      )}
    </dialog>
  );
}
