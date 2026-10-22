import clsx from "clsx";
import { CLOSER_LOOK_WIDTHS, closerLookSrc, type CloserLookTile } from "@/lib/closerLook";

const srcSet = (file: string, ext: "webp" | "avif") => CLOSER_LOOK_WIDTHS.map((w) => `${closerLookSrc(file, w, ext)} ${w}w`).join(", ");

/**
 * "Closer look": a quiet row of production details (label, cotton, print). Phones get a swipe strip; md and up a grid.
 * Images are 4:5. Tiles still marked `mockup` are flagged with data-mockup and a one-line note under the row.
 */
export function CloserLook({ tiles, heading = "the details", intro, className, id = "closer-look" }: { tiles: CloserLookTile[]; heading?: string; intro?: string; className?: string; id?: string }) {
  if (!tiles.length) return null;
  const anyMockup = tiles.some((t) => t.mockup);
  return (
    <section id={id} aria-labelledby={`${id}-title`} className={clsx("closer-look", className)} data-closer-look>
      <header className="mb-6 max-w-2xl md:mb-10">
        <p className="kicker mb-3 text-muted">Closer look</p>
        <h2 id={`${id}-title`} className="brand-h text-[clamp(1.75rem,4vw,2.75rem)]">
          {heading}
        </h2>
        {intro && <p className="mt-3 text-cream-dim">{intro}</p>}
      </header>
      <ul
        className={clsx(
          "-mx-5 flex snap-x snap-mandatory scroll-px-5 gap-4 overflow-x-auto px-5 pb-2 [scrollbar-width:none] sm:-mx-8 sm:scroll-px-8 sm:px-8",
          "md:mx-0 md:grid md:snap-none md:gap-6 md:overflow-visible md:px-0 md:pb-0",
          tiles.length >= 3 ? "md:grid-cols-3" : "md:grid-cols-2 md:max-w-[880px]",
        )}
      >
        {tiles.map((t) => (
          <li key={t.id} className="w-[78%] shrink-0 snap-start md:w-auto" data-tile={t.id} data-mockup={t.mockup ? "true" : "false"}>
            <figure>
              <div className="relative aspect-[4/5] overflow-hidden rounded-2xl bg-surface ring-1 ring-line">
                <picture>
                  <source type="image/avif" srcSet={srcSet(t.file, "avif")} sizes="(min-width:768px) 30vw, 78vw" />
                  <source type="image/webp" srcSet={srcSet(t.file, "webp")} sizes="(min-width:768px) 30vw, 78vw" />
                  <img src={closerLookSrc(t.file, 960, "webp")} alt={t.alt} width={960} height={1200} loading="lazy" decoding="async" className="h-full w-full object-cover" />
                </picture>
              </div>
              <figcaption className="pt-4">
                <h3 className="text-base font-semibold leading-snug">{t.title}</h3>
                <p className="mt-1 text-sm text-cream-dim">{t.body}</p>
                {t.spec && <p className="mt-2 text-xs text-muted">{t.spec}</p>}
              </figcaption>
            </figure>
          </li>
        ))}
      </ul>
      {anyMockup && (
        <p className="mt-6 text-xs text-muted" data-closer-look-note>
          Detail renders made from our production files. Photos of the real samples are on the way.
        </p>
      )}
    </section>
  );
}
