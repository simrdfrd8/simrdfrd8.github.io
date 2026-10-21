import Link from "next/link";
import { Wordmark } from "./Wordmark";
import { FriendsRow } from "./FriendsRow";
import { catalog } from "@/lib/catalog";
import { primaryNav, secondaryNav } from "@/lib/brand";
import { isPreview } from "@/lib/env";
import { platformLabel } from "@/lib/format";

/** Site-wide footer: Brandy's "Make art with friends." block + Friends row (site-footer.css), plus the site's link columns. */
export function SiteFooter() {
  const { site } = catalog;
  return (
    <footer className="border-t border-line bg-ink px-5 pt-16 pb-28 sm:px-8 md:pb-12 lg:px-12" data-site-footer>
      <div className="mx-auto grid max-w-[1440px] gap-12 md:grid-cols-[1.6fr_1fr_1fr_1fr]">
        <div className="min-w-0">
          <Wordmark size="lg" />
          <p className="brand-h mt-8 text-[22px] tracking-[3px] text-cream">Make art with friends.</p>
          <p className="mt-2 text-xs font-semibold tracking-[2px] uppercase">
            <span className="hl-hh">Hip-Hop</span> <span className="text-muted">·</span> <span className="hl-edm">EDM</span> <span className="text-muted">·</span> <span className="hl-prod">Production</span>
          </p>
          <div className="mt-5">
            <FriendsRow />
          </div>
          {site.email && (
            <p className="mt-6">
              <span className="kicker block text-muted">Business</span>
              <a href={`mailto:${site.email}`} className="text-lg underline decoration-line-strong underline-offset-4 hover:decoration-hot">
                {site.email}
              </a>
            </p>
          )}
        </div>
        <FooterCol title="Explore" items={[...primaryNav]} />
        <FooterCol title="Work with us" items={[...secondaryNav]} />
        <div>
          <h2 className="kicker mb-4 text-muted">Listen & follow</h2>
          <ul className="space-y-2">
            {site.socials.map((s) => (
              <li key={s.url}>
                <a href={s.url} target="_blank" rel="noopener noreferrer" className="text-cream-dim hover:text-cream">
                  {platformLabel(s.platform)} <span aria-hidden="true">↗</span>
                </a>
              </li>
            ))}
          </ul>
        </div>
      </div>
      <div className="mx-auto mt-16 flex max-w-[1440px] flex-wrap justify-between gap-4 border-t border-line pt-6 text-sm text-muted">
        <div className="space-y-1">
          <p data-label-line>
            Flavorful Music is an independent record label, a DBA of Baylingue LLC, San Diego, CA. Contact:{" "}
            <a href="mailto:ricky@flavorfulmusic.com" className="underline underline-offset-4 hover:text-cream">ricky@flavorfulmusic.com</a>
          </p>
          <p>
            Sister brand:{" "}
            <Link href="/artists/baylingual-entertainment" className="underline underline-offset-4 hover:text-cream">
              Baylingual Entertainment
            </Link>
            .
          </p>
          <p>© 2026 Baylingue LLC. All rights reserved.</p>
        </div>
        {isPreview() && <p className="kicker self-end text-gold">Local preview build</p>}
      </div>
    </footer>
  );
}

function FooterCol({ title, items }: { title: string; items: { label: string; href: string }[] }) {
  return (
    <div>
      <h2 className="kicker mb-4 text-muted">{title}</h2>
      <ul className="space-y-2">
        {items.map((i) => (
          <li key={i.href}>
            <Link href={i.href} className="text-cream-dim hover:text-cream">
              {i.label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
