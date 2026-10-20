"use client";

/* eslint-disable @next/next/no-img-element */
import { useState } from "react";
import clsx from "clsx";
import { PlayIcon } from "./ui";

export function soundCloudSrc({ url, scId, kind }: { url: string; scId?: number; kind: "track" | "playlist" }) {
  const target = scId ? `https://api.soundcloud.com/${kind}s/${scId}` : url;
  const params = new URLSearchParams({
    url: target,
    color: "#FF7A59",
    auto_play: "false",
    hide_related: "true",
    show_comments: "false",
    show_user: "true",
    show_reposts: "false",
    show_teaser: "false",
    visual: "false",
  });
  return `https://w.soundcloud.com/player/?${params.toString()}`;
}

/**
 * Click-to-load facade: shows official artwork + title; the official SoundCloud widget iframe
 * is only created after the visitor asks for it (auto_play=false, compact visual=false layout).
 */
export function SoundCloudEmbed({
  url,
  scId,
  kind = "track",
  title,
  artworkUrl,
  subtitle,
  verified,
  size = "md",
}: {
  url: string;
  scId?: number;
  kind?: "track" | "playlist";
  title: string;
  artworkUrl?: string;
  subtitle?: string;
  verified: boolean;
  size?: "md" | "lg";
}) {
  const [loaded, setLoaded] = useState(false);
  const height = kind === "playlist" ? 360 : 166;
  if (loaded) {
    return (
      <div className="overflow-hidden rounded-xl bg-raised">
        <iframe
          title={`SoundCloud player: ${title}`}
          src={soundCloudSrc({ url, scId, kind })}
          width="100%"
          height={height}
          loading="lazy"
          allow="encrypted-media"
          className="block w-full border-0"
          data-embed="soundcloud"
        />
      </div>
    );
  }
  return (
    <button
      type="button"
      disabled={!verified}
      onClick={() => setLoaded(true)}
      data-facade="soundcloud"
      aria-label={verified ? `Load SoundCloud player for ${title}` : `${title}: awaiting a verified SoundCloud link`}
      className={clsx(
        "group/sc relative block w-full overflow-hidden rounded-xl bg-surface text-left ring-1 ring-line transition hover:ring-line-strong disabled:cursor-not-allowed",
        size === "lg" ? "aspect-square" : "aspect-square",
      )}
    >
      {artworkUrl ? (
        <img src={artworkUrl} alt="" loading="lazy" decoding="async" width={500} height={500} className="absolute inset-0 h-full w-full object-cover transition-transform duration-700 group-hover/sc:scale-[1.04]" />
      ) : (
        <span className="absolute inset-0 bg-[radial-gradient(circle_at_30%_30%,#FF7A59,transparent_55%),radial-gradient(circle_at_70%_70%,#B6FF3B,transparent_50%)] opacity-60" />
      )}
      <span className="absolute inset-0 bg-gradient-to-t from-ink/85 via-ink/10 to-transparent" />
      <span className="absolute right-4 bottom-4 left-4 flex items-end justify-between gap-3">
        <span className="min-w-0">
          {subtitle && <span className="kicker block truncate text-cream-dim">{subtitle}</span>}
          <span className="block truncate text-lg font-semibold text-cream">{title}</span>
        </span>
        <span className="inline-flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-cream text-ink transition-transform duration-300 group-hover/sc:scale-110">
          <PlayIcon className="translate-x-0.5" />
        </span>
      </span>
      {!verified && <span className="kicker absolute top-3 left-3 rounded-full bg-ink/70 px-2.5 py-1 !text-[0.6rem] text-gold">Placeholder · unverified</span>}
    </button>
  );
}
