"use client";

import { useDeferredValue, useMemo, useRef, useState, type KeyboardEvent } from "react";
import clsx from "clsx";
import { formatDuration } from "@/lib/format";
import { BEAT_SORTS, filterBeats, sortBeats } from "@/lib/beat-filter";
import type { BeatTileData, Offer } from "@/lib/beat-data";
import { offersFor } from "@/lib/offers";
import { CheckoutButton } from "../CheckoutButton";
import { OfferChooser } from "../OfferChooser";
import { usePlayer, type PlayerTrack } from "./PlayerProvider";
import { EqIcon, PauseIcon, PlayIcon } from "./icons";

export type TrackRow = BeatTileData & { subtitle?: string; offers?: Offer[]; badge?: string };

const field = "h-10 rounded-full bg-transparent px-4 text-sm ring-1 ring-line focus:ring-cream focus:outline-none";

/**
 * Minimal track list wired to the global player: play/pause, title, key, BPM, duration and a compact buy action.
 * Plays down the (filtered, sorted) list. Keyboard: ↑/↓ move between rows, Space/Enter play-pause, Home/End jump.
 */
export function TrackList({
  id,
  tracks,
  search = false,
  sort: sortable = false,
  pageSize = 25,
  label = "Tracks",
  noun = "tracks",
  offerTemplate,
}: {
  id: string;
  tracks: TrackRow[];
  search?: boolean;
  sort?: boolean;
  pageSize?: number;
  label?: string;
  noun?: string;
  /** Lease tiers once for the whole list ("__beat__" / "__title__" placeholders), expanded per row. */
  offerTemplate?: Offer[];
}) {
  const player = usePlayer();
  const [q, setQ] = useState("");
  const [sort, setSort] = useState("");
  const [limit, setLimit] = useState(pageSize);
  const dq = useDeferredValue(q);
  const results = useMemo(() => sortBeats(filterBeats(tracks, { q: dq }), sort), [tracks, dq, sort]);
  const shown = results.slice(0, limit);
  const queue = useMemo<PlayerTrack[]>(() => results.filter((t) => t.src).map((t) => ({ id: t.id, title: t.title, src: t.src!, subtitle: t.subtitle ?? "Flavorful Croissants", durationSec: t.durationSec })), [results]);
  const listRef = useRef<HTMLOListElement>(null);
  const showKey = tracks.some((t) => t.key);
  const showBpm = tracks.some((t) => t.bpm);
  const hasBuy = !!offerTemplate?.length || tracks.some((t) => t.offers?.length);
  const offersOf = (t: TrackRow) => t.offers ?? (offerTemplate ? offersFor(offerTemplate, t) : undefined);
  const playRow = (t: TrackRow) => {
    const i = queue.findIndex((x) => x.id === t.id);
    if (i >= 0) player.play(queue, i, id);
  };
  const focusRow = (i: number) => listRef.current?.querySelectorAll<HTMLButtonElement>("[data-row-play]")[i]?.focus();
  const onKey = (e: KeyboardEvent<HTMLOListElement>) => {
    const btns = [...(listRef.current?.querySelectorAll<HTMLButtonElement>("[data-row-play]") ?? [])];
    const i = btns.indexOf(document.activeElement as HTMLButtonElement);
    if (e.key === "ArrowDown") { e.preventDefault(); focusRow(Math.min(btns.length - 1, i + 1)); }
    else if (e.key === "ArrowUp") { e.preventDefault(); focusRow(Math.max(0, i - 1)); }
    else if (e.key === "Home") { e.preventDefault(); focusRow(0); }
    else if (e.key === "End") { e.preventDefault(); focusRow(btns.length - 1); }
    else if (e.key === " " && i < 0 && !(e.target as HTMLElement).closest("button,a,input,select,dialog")) { e.preventDefault(); player.toggle(); }
  };
  const reset = (fn: () => void) => { fn(); setLimit(pageSize); };
  const cols = clsx("grid items-center gap-x-4", "grid-cols-[2.75rem_minmax(0,1fr)_auto]", hasBuy ? "sm:grid-cols-[2.75rem_minmax(0,1fr)_6.5rem_3.5rem_3.5rem_4.5rem] lg:grid-cols-[2.75rem_minmax(0,1fr)_6.5rem_3.5rem_3.5rem_14rem]" : "sm:grid-cols-[2.75rem_minmax(0,1fr)_6.5rem_3.5rem_3.5rem_0]");
  return (
    <div className="track-list" data-track-list={id}>
      {(search || sortable) && (
        <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center" role="search" aria-label={`Find ${noun}`}>
          {search && (
            <>
              <label className="sr-only" htmlFor={`${id}-q`}>Search {noun}</label>
              <input id={`${id}-q`} type="search" value={q} onChange={(e) => reset(() => setQ(e.target.value))} placeholder={`Search ${tracks.length} ${noun}`} className={`${field} w-full sm:w-72`} data-track-search />
            </>
          )}
          {sortable && (
            <>
              <label className="sr-only" htmlFor={`${id}-sort`}>Sort</label>
              <select id={`${id}-sort`} value={sort} onChange={(e) => reset(() => setSort(e.target.value))} className={`${field} sm:w-52`} data-track-sort>
                {BEAT_SORTS.map((s) => <option key={s.id} value={s.id} className="bg-ink">{s.id ? `Sort: ${s.label}` : "Sort: Featured"}</option>)}
              </select>
            </>
          )}
          <p className="text-sm text-muted tabular-nums sm:ml-auto" aria-live="polite" data-track-count={results.length}>
            {results.length === tracks.length ? `${tracks.length} ${noun}` : `${results.length} of ${tracks.length} ${noun}`}
          </p>
        </div>
      )}
      <div className={clsx(cols, "kicker hidden border-b border-line pb-2 text-muted sm:grid")} aria-hidden="true">
        <span className="text-center">#</span>
        <span>Title</span>
        <span>{showKey ? "Key" : ""}</span>
        <span className="text-right">{showBpm ? "BPM" : ""}</span>
        <span className="text-right">Time</span>
        <span className="text-right">{hasBuy ? "License" : ""}</span>
      </div>
      {shown.length ? (
        <ol ref={listRef} aria-label={label} onKeyDown={onKey} className="divide-y divide-line">
          {shown.map((t, n) => {
            const active = player.current?.id === t.id;
            const isPlaying = active && player.playing;
            const offers = offersOf(t);
            const mp3 = offers?.find((o) => o.id.endsWith("--mp3-lease"));
            const wav = offers?.find((o) => o.id.endsWith("--wav-lease"));
            const from = offers?.filter((o) => o.price !== null).map((o) => o.price as number) ?? [];
            const meta = [t.key, t.bpm && `${t.bpm} BPM`, formatDuration(t.durationSec)].filter(Boolean).join(" · ");
            return (
              <li
                key={t.id}
                className={clsx(cols, "tl-row group relative py-2.5 transition-colors", active && "tl-active")}
                data-track-row={t.id}
                data-beat-card={t.id}
                data-active={active || undefined}
                data-bpm={t.bpm}
                data-audience={t.audience}
                data-key={t.key}
                onClick={(e) => { if (!(e.target as HTMLElement).closest("a,button,dialog")) playRow(t); }}
              >
                <button
                  type="button"
                  onClick={() => playRow(t)}
                  disabled={!t.src}
                  aria-label={`${isPlaying ? "Pause" : "Play"} ${t.title}`}
                  aria-pressed={isPlaying}
                  className="tl-play relative inline-flex h-11 w-11 items-center justify-center rounded-full text-muted tabular-nums transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cream"
                  data-row-play
                >
                  <span className={clsx("text-sm group-hover:hidden group-focus-within:hidden", active && "hidden")} aria-hidden="true">{n + 1}</span>
                  <span className={clsx("hidden group-hover:inline-flex group-focus-within:inline-flex", active && "!inline-flex")}>
                    {isPlaying ? <span className="group-hover:hidden group-focus-within:hidden"><EqIcon /></span> : null}
                    {isPlaying ? <span className="hidden group-hover:inline group-focus-within:inline"><PauseIcon /></span> : <PlayIcon />}
                  </span>
                </button>
                <div className="min-w-0">
                  <p className="truncate font-semibold">
                    <span className="tl-title">{t.title}</span>
                    {t.badge && <span className="kicker ml-2 align-middle text-[var(--tl-accent)]">{t.badge}</span>}
                  </p>
                  {(t.heard || t.subtitle) && (
                    <p className="truncate text-xs text-muted" data-heard-on={t.heard ? true : undefined}>
                      {t.heard ? <>Heard on <a href={t.heard.url} target="_blank" rel="noopener noreferrer" className="underline decoration-line-strong underline-offset-2 hover:text-cream">{t.heard.title}</a> ({t.heard.credit})</> : t.subtitle}
                    </p>
                  )}
                  {meta && <p className="truncate text-xs text-muted tabular-nums sm:hidden">{meta}</p>}
                </div>
                <span className="hidden truncate text-sm text-cream-dim sm:block">{showKey && (t.key ?? <span className="text-muted">–</span>)}</span>
                <span className="hidden text-right text-sm text-cream-dim tabular-nums sm:block">{showBpm && (t.bpm ?? <span className="text-muted">–</span>)}</span>
                <span className="hidden text-right text-sm text-muted tabular-nums sm:block">{formatDuration(t.durationSec) ?? ""}</span>
                <div className="flex items-center justify-end gap-1.5">
                  {mp3 && (
                    <span className="hidden lg:contents">
                      <CheckoutButton product={mp3} priceLabel={mp3.priceLabel} label={`MP3 ${mp3.priceLabel}`} variant="ghost" size="sm" className="tl-buy" />
                      {wav && <CheckoutButton product={wav} priceLabel={wav.priceLabel} label={`WAV ${wav.priceLabel}`} variant="ghost" size="sm" className="tl-buy" />}
                    </span>
                  )}
                  {offers && offers.length > 0 && (
                    <OfferChooser
                      title={t.title}
                      offers={offers}
                      ariaLabel={`Buy / License · from $${Math.min(...from)}: ${t.title}`}
                      buttonClassName="tl-buy inline-flex h-9 items-center rounded-full px-3 text-xs font-semibold ring-1 ring-line-strong transition hover:bg-cream hover:text-ink"
                      label={<><span className="lg:hidden">Buy</span><span className="hidden lg:inline">More</span></>}
                    />
                  )}
                </div>
              </li>
            );
          })}
        </ol>
      ) : (
        <p className="py-10 text-cream-dim">
          Nothing matches that.{" "}
          <button type="button" className="underline underline-offset-4" onClick={() => reset(() => setQ(""))}>Clear search</button>
        </p>
      )}
      {results.length > shown.length && (
        <div className="mt-8 flex justify-center">
          <button type="button" onClick={() => setLimit((l) => l + pageSize)} className="inline-flex h-11 items-center rounded-full px-6 text-sm font-semibold ring-1 ring-line-strong transition hover:bg-cream hover:text-ink tabular-nums">
            Show {Math.min(pageSize, results.length - shown.length)} more · {shown.length} of {results.length}
          </button>
        </div>
      )}
    </div>
  );
}
