import { Wordmark } from "./Wordmark";
import { primaryNav, secondaryNav } from "@/lib/brand";
import { NavLinks, MobileMenu } from "./NavClient";
import { ButtonLink, Heart } from "./ui";

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-40 border-b border-line bg-ink/85 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-[1440px] items-center justify-between gap-6 px-5 sm:px-8 lg:px-12">
        <Wordmark />
        <nav aria-label="Primary" className="hidden items-center gap-1 md:flex">
          <NavLinks items={[...primaryNav]} />
          <ButtonLink href="/support" size="sm" variant="accent" className="ml-3">
            <Heart /> Support
          </ButtonLink>
        </nav>
        <MobileMenu primary={[...primaryNav]} secondary={[...secondaryNav]} />
      </div>
    </header>
  );
}
