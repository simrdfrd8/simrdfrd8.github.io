/* eslint-disable @next/next/no-img-element */
/** For tracks whose uploader disabled embedding: artwork + title linking to the track on SoundCloud. No player. */
export function SoundCloudLinkCard({ url, title, subtitle, artworkUrl, size = "md" }: { url: string; title: string; subtitle?: string; artworkUrl?: string; size?: "md" | "lg" }) {
  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      data-embed="soundcloud-link"
      className="group relative flex aspect-square w-full items-end overflow-hidden rounded-xl bg-raised ring-1 ring-line transition hover:ring-cream"
    >
      {artworkUrl && <img src={artworkUrl} alt="" width={500} height={500} loading="lazy" className="absolute inset-0 h-full w-full object-cover opacity-80 transition duration-700 group-hover:scale-[1.03] group-hover:opacity-100" />}
      <span className="absolute inset-0 bg-gradient-to-t from-ink via-ink/30 to-transparent" />
      <span className="relative flex w-full flex-col items-start gap-2 p-4">
        <span className="w-full min-w-0">
          <span className={`block truncate font-semibold ${size === "lg" ? "text-xl" : ""}`}>{title}</span>
          {subtitle && <span className="block truncate text-xs text-cream-dim">{subtitle}</span>}
        </span>
        <span className="inline-flex h-9 shrink-0 items-center rounded-full bg-cream px-4 text-sm font-semibold text-ink">
          Listen on SoundCloud <span aria-hidden="true">&nbsp;↗</span>
        </span>
      </span>
    </a>
  );
}
