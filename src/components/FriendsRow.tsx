import Link from "next/link";
import { FRIENDS } from "@/lib/brand";

/** "Friends" row: ported from Brandy's friends.js (data now lives in src/lib/brand.ts). Server-rendered, no client JS. */
export function FriendsRow() {
  return (
    <nav className="friends-row" aria-label="Friends" data-friends>
      <span className="fr-label">Friends</span>
      <ul className="fr-list">
        {FRIENDS.map((f) => (
          <li key={f.name} className={f.shade ? `fr shade-${f.shade}` : "fr fr-ext"}>
            <i aria-hidden="true" />
            {f.href ? (
              <Link href={f.href} className="fr-name">
                {f.name}
              </Link>
            ) : (
              <span className="fr-name">{f.name}</span>
            )}
            {f.links.map((l) =>
              l.placeholder || !l.url ? (
                <span key={l.label} className="fr-link italic !font-normal text-muted" aria-disabled="true" data-placeholder>
                  {l.label} [link]
                </span>
              ) : (
                <a key={l.label} href={l.url} target="_blank" rel="noopener" className="fr-link" aria-label={`${f.name} on ${l.label} (opens in a new tab)`}>
                  {l.label} ↗
                </a>
              ),
            )}
          </li>
        ))}
      </ul>
    </nav>
  );
}
