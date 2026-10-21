import clsx from "clsx";
import { getAsset } from "@/lib/catalog";
import type { PackTile } from "@/lib/packs";
import type { PlayerTrack } from "./player/PlayerProvider";
import { MediaImage } from "./MediaImage";
import { PackPlay } from "./PackPlay";
import { TriangleMark } from "./ui";

/** Small, quiet corner tag (same look as the merch shop's). */
function ComingSoonTag() {
  return (
    <span
      className="pointer-events-none absolute top-2.5 right-2.5 z-10 rounded-full bg-black/40 px-2 py-[3px] text-[10px] leading-none font-medium tracking-[0.08em] text-white/90 uppercase backdrop-blur-sm"
      data-coming-soon
    >
      Coming soon
    </span>
  );
}

const grid = "grid grid-cols-2 gap-x-4 gap-y-8 sm:grid-cols-3 sm:gap-x-6 lg:grid-cols-4";

/**
 * The sample pack library: merch-style square cards (cover, title, tags, corner tag) with the beat store's
 * play control, handing demos to the one shared bottom player (plays down the grid, never autoplays).
 * No prices and no checkout here. Empty content → a quiet "Coming soon" shelf with no titles.
 */
export function PackLibrary({ packs }: { packs: PackTile[] }) {
  const queue: PlayerTrack[] = packs.filter((p) => p.demo).map((p) => ({ id: `pack-${p.id}`, title: p.title, src: p.demo!, subtitle: "Sample pack demo" }));
  return (
    <div className="track-list shade-prod" style={{ ["--tl-accent" as string]: "var(--shade)" }} data-pack-library data-pack-count={packs.length}>
      <div className="mb-6 flex items-center justify-between gap-4 border-b border-line pb-3">
        <p className="kicker text-muted">Sample packs</p>
        <p className="text-sm text-muted tabular-nums" data-pack-total>
          {packs.length ? `${packs.length} ${packs.length === 1 ? "pack" : "packs"}` : "Coming soon"}
        </p>
      </div>
      {packs.length ? (
        <ul className={grid} aria-label="Sample packs">
          {packs.map((p) => {
            const cover = p.coverAssetId ? getAsset(p.coverAssetId) : undefined;
            const i = queue.findIndex((t) => t.id === `pack-${p.id}`);
            return (
              <li key={p.id} className="group" data-pack={p.id}>
                <div className="relative aspect-square overflow-hidden rounded-xl bg-surface ring-1 ring-line transition group-hover:ring-line-strong">
                  {cover ? (
                    <MediaImage asset={cover} sizes="(min-width:1024px) 25vw, (min-width:640px) 33vw, 50vw" className="absolute inset-0" />
                  ) : (
                    <span className="absolute inset-0 grid place-items-center" aria-hidden="true"><TriangleMark className="w-16 opacity-30" /></span>
                  )}
                  {p.comingSoon && <ComingSoonTag />}
                  {i >= 0 && <PackPlay queue={queue} index={i} />}
                </div>
                <h2 className="mt-3 text-base leading-snug font-semibold">{p.title}</h2>
                {p.tags.length > 0 && <p className="mt-0.5 text-xs tracking-[1px] text-muted uppercase">{p.tags.join(" · ")}</p>}
              </li>
            );
          })}
        </ul>
      ) : (
        <ul className={grid} aria-label="Sample packs (coming soon)" data-packs-soon>
          {[0, 1, 2, 3].map((n) => (
            <li key={n} className={clsx(n === 2 && "hidden sm:block", n === 3 && "hidden lg:block")} data-pack-placeholder>
              <div className="relative grid aspect-square place-items-center overflow-hidden rounded-xl bg-surface ring-1 ring-line">
                <TriangleMark className="w-16 opacity-25" />
                <ComingSoonTag />
              </div>
              <span aria-hidden="true" className="mt-3 block h-3.5 w-3/4 rounded-full bg-line" />
              <span aria-hidden="true" className="mt-2 block h-2.5 w-1/2 rounded-full bg-line/60" />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
