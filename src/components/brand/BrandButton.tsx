import Link from "next/link";
import clsx from "clsx";
import type { ComponentProps } from "react";

/** Brandy's square, uppercase buttons (.btn.solid / .btn.ghost). */
export function BrandButton({ variant = "solid", className, ...props }: ComponentProps<typeof Link> & { variant?: "solid" | "ghost" | "shade" | "shade-ghost" }) {
  return (
    <Link
      {...props}
      className={clsx(
        "inline-flex min-h-12 items-center justify-center border-2 px-7 py-3 text-[13px] font-extrabold tracking-[2px] uppercase transition-[filter,background-color] duration-200",
        variant === "solid" && "border-cream bg-cream text-ink hover:bg-white",
        variant === "ghost" && "border-cream text-cream hover:bg-cream/10",
        variant === "shade" && "border-[var(--shade)] bg-[var(--shade)] text-[var(--shade-on)] hover:brightness-110",
        variant === "shade-ghost" && "border-[var(--shade)] text-[var(--shade-text)] hover:bg-[var(--shade-tint)]",
        className,
      )}
    />
  );
}

export function ShadeBar({ className }: { className?: string }) {
  return (
    <div className={clsx("flex h-1.5 w-60", className)} aria-hidden="true">
      <i className="flex-1 bg-hiphop" />
      <i className="flex-1 bg-edm" />
      <i className="flex-1 bg-prod" />
    </div>
  );
}

export function BrandSection({ id, eyebrow, title, tone = "ink", children, className }: { id?: string; eyebrow?: string; title?: React.ReactNode; tone?: "ink" | "surface"; children: React.ReactNode; className?: string }) {
  return (
    <section id={id} aria-labelledby={id && title ? `${id}-title` : undefined} className={clsx("scroll-mt-20 border-t border-line px-5 py-16 sm:px-8 md:py-[88px]", tone === "surface" && "bg-surface", className)}>
      <div className="mx-auto max-w-[1120px]">
        {eyebrow && <p className="eyebrow">{eyebrow}</p>}
        {title && (
          <h2 id={id ? `${id}-title` : undefined} className="brand-h mt-2 mb-5 text-[28px] tracking-[3px] md:text-[34px]">
            {title}
          </h2>
        )}
        {children}
      </div>
    </section>
  );
}
