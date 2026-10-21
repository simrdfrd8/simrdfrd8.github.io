/**
 * Plain outbound listen link. Used wherever we don't have a released, self-hosted MP3 yet:
 * no iframe, no third-party player, no autoplay. One line: platform + arrow.
 */
export function ListenLink({ href, platform, title, className }: { href: string; platform: "SoundCloud" | "Spotify"; title: string; className?: string }) {
  return (
    <a href={href} target="_blank" rel="noopener noreferrer" className={`inline-flex items-center gap-1.5 text-sm font-semibold text-cream-dim underline decoration-line-strong underline-offset-4 hover:text-cream ${className ?? ""}`} data-listen-link={platform.toLowerCase()} aria-label={`Listen to ${title} on ${platform} (opens in a new tab)`}>
      Listen on {platform} <span aria-hidden="true">↗</span>
    </a>
  );
}
