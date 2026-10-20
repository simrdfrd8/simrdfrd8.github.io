import type { ReactNode } from "react";

export function PageHeader({ kicker, title, children, accent }: { kicker: string; title: ReactNode; children?: ReactNode; accent?: string }) {
  return (
    <section className="relative overflow-hidden px-5 pt-12 pb-4 sm:px-8 md:pt-20 lg:px-12">
      {accent && <div className="pointer-events-none absolute -top-48 -left-32 h-[30rem] w-[30rem] rounded-full opacity-20 blur-3xl" style={{ background: accent }} />}
      <div className="relative mx-auto max-w-[1440px] animate-rise">
        <p className="kicker text-muted">{kicker}</p>
        <h1 className="display mt-3 text-[clamp(4rem,12vw,9rem)]">{title}</h1>
        {children && <div className="mt-5 max-w-2xl text-lg text-cream-dim md:text-xl">{children}</div>}
      </div>
    </section>
  );
}
