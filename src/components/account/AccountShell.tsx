import type { ReactNode } from "react";

/** Narrow centred column used by every account page. */
export function AccountShell({ kicker, title, children }: { kicker: string; title: string; children: ReactNode }) {
  return (
    <section className="px-5 pt-12 pb-24 sm:px-8 md:pt-20 lg:px-12">
      <div className="mx-auto max-w-xl animate-rise">
        <p className="kicker text-muted">{kicker}</p>
        <h1 className="display mt-3 text-[clamp(3.5rem,10vw,6rem)]">{title}</h1>
        <div className="mt-8">{children}</div>
      </div>
    </section>
  );
}

export const cardClass = "rounded-2xl bg-raised p-6 ring-1 ring-line";
export const inputClass = "h-12 w-full rounded-xl border border-line-strong bg-ink px-4 text-cream placeholder:text-muted focus:border-cream focus:outline-none";
