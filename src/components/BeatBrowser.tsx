"use client";

import { useDeferredValue, useMemo, useState } from "react";
import { BeatTile, type BeatTileData, type Offer } from "./BeatTile";
import { offersFor } from "@/lib/offers";
import { BPM_RANGES, filterBeats, keySort } from "@/lib/beat-filter";

const field = "h-11 rounded-full bg-raised px-4 text-sm ring-1 ring-line focus:ring-cream focus:outline-none";

/** Searchable, filterable beat catalog: 12 at a time with "Load more". */
export function BeatBrowser({ beats, offerTemplate, pageSize = 12, mediaBase = "" }: { beats: BeatTileData[]; offerTemplate: Offer[]; pageSize?: number; mediaBase?: string }) {
  const [q, setQ] = useState("");
  const [bpm, setBpm] = useState("");
  const [key, setKey] = useState("");
  const [limit, setLimit] = useState(pageSize);
  const dq = useDeferredValue(q);
  const keys = useMemo(() => [...new Set(beats.map((b) => b.key).filter((k): k is string => !!k))].sort(keySort), [beats]);
  const results = useMemo(() => filterBeats(beats, { q: dq, bpm, key }), [beats, dq, bpm, key]);
  const shown = results.slice(0, limit);
  const reset = (fn: () => void) => {
    fn();
    setLimit(pageSize);
  };
  return (
    <div data-beat-browser>
      <div className="mb-8 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center" role="search" aria-label="Find a beat">
        <label className="sr-only" htmlFor="beat-q">Search beats</label>
        <input id="beat-q" type="search" value={q} onChange={(e) => reset(() => setQ(e.target.value))} placeholder={`Search ${beats.length} beats`} className={`${field} w-full sm:w-72`} />
        <div className="flex gap-3">
          <label className="sr-only" htmlFor="beat-bpm">BPM</label>
          <select id="beat-bpm" value={bpm} onChange={(e) => reset(() => setBpm(e.target.value))} className={`${field} flex-1 sm:flex-none`}>
            <option value="">Any BPM</option>
            {BPM_RANGES.map((r) => (
              <option key={r.id} value={r.id}>{r.label} BPM</option>
            ))}
          </select>
          <label className="sr-only" htmlFor="beat-key">Key</label>
          <select id="beat-key" value={key} onChange={(e) => reset(() => setKey(e.target.value))} className={`${field} flex-1 sm:flex-none`}>
            <option value="">Any key</option>
            {keys.map((k) => (
              <option key={k} value={k}>{k}</option>
            ))}
          </select>
        </div>
        <p className="text-sm text-muted sm:ml-auto" aria-live="polite" data-beat-count={results.length}>
          {results.length === beats.length ? `${beats.length} beats` : `${results.length} of ${beats.length} beats`}
        </p>
      </div>
      {shown.length ? (
        <div className="grid gap-x-6 gap-y-10 sm:grid-cols-2 lg:grid-cols-3">
          {shown.map((b) => (
            <BeatTile key={b.id} beat={b} offers={offersFor(offerTemplate, b)} mediaBase={mediaBase} compact />
          ))}
        </div>
      ) : (
        <p className="py-10 text-cream-dim">
          No beats match that.{" "}
          <button type="button" className="underline underline-offset-4" onClick={() => reset(() => (setQ(""), setBpm(""), setKey("")))}>
            Clear filters
          </button>
        </p>
      )}
      {results.length > shown.length && (
        <div className="mt-12 flex justify-center">
          <button type="button" onClick={() => setLimit((l) => l + pageSize)} className="inline-flex h-12 items-center rounded-full px-6 text-sm font-semibold ring-1 ring-line-strong transition hover:bg-cream hover:text-ink">
            Load {Math.min(pageSize, results.length - shown.length)} more · {shown.length} of {results.length}
          </button>
        </div>
      )}
      <p className="mt-6 text-xs text-muted">Every beat: {offerTemplate.map((o) => `${o.title.replace("__title__: ", "")} ${o.priceLabel}`).join(" · ")}. BPM and key are shown only where they could be measured reliably.</p>
    </div>
  );
}
