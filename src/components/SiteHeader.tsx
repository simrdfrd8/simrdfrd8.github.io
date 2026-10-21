import { Wordmark } from "./Wordmark";
import { primaryNav, secondaryNav } from "@/lib/brand";
import { NavLinks, MobileMenu } from "./NavClient";
import { ButtonLink, Heart } from "./ui";

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-40 border-b border-line">
      {/* The blur lives on its own layer: backdrop-filter on <header> would make it the containing block for the fixed mobile menu and clip it to the 64px bar. */}
      <div aria-hidden="true" className="absolute inset-0 -z-10 bg-ink/85 backdrop-blur-md" />
      <div className="mx-auto flex h-16 max-w-[1440px] items-center justify-between gap-3 px-4 min-[360px]:px-5 sm:gap-6 sm:px-8 lg:px-12">
        <Wordmark />
        <nav aria-label="Primary" className="hidden items-center lg:gap-1 md:flex">
          <NavLinks items={[...primaryNav]} />
          <ButtonLink href="/support" size="sm" variant="accent" className="ml-1 lg:ml-3">
            <Heart /> Support
          </ButtonLink>
        </nav>
        <MobileMenu primary={[...primaryNav]} secondary={[...secondaryNav]} />
      </div>
    </header>
  );
}
