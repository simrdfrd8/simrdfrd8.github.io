import { hasMarks } from "@/lib/marks";
import Link from "next/link";
import clsx from "clsx";
import type { ComponentProps, ReactNode } from "react";

type Variant = "primary" | "secondary" | "ghost" | "accent";

export const buttonClass = (variant: Variant = "primary", size: "sm" | "md" | "lg" = "md") =>
  clsx(
    "inline-flex items-center justify-center gap-2 rounded-full font-semibold whitespace-nowrap transition-[transform,background-color,color,box-shadow] duration-200 active:scale-[0.97] disabled:opacity-50 disabled:pointer-events-none",
    size === "sm" && "h-9 px-4 text-sm",
    size === "md" && "h-11 px-5 text-[0.95rem]",
    size === "lg" && "h-14 px-7 text-base",
    variant === "primary" && "bg-cream text-ink hover:bg-white",
    variant === "accent" && "bg-[var(--accent)] text-[var(--accent-ink)] hover:brightness-110",
    variant === "secondary" && "border border-line-strong text-cream hover:border-cream hover:bg-cream/5",
    variant === "ghost" && "text-cream-dim hover:text-cream underline-offset-4 hover:underline px-1",
  );

export function ButtonLink({ variant, size, className, ...props }: ComponentProps<typeof Link> & { variant?: Variant; size?: "sm" | "md" | "lg" }) {
  return <Link {...props} className={clsx(buttonClass(variant, size), className)} />;
}

export function Section({ id, kicker, title, action, children, className, tone = "ink" }: { id?: string; kicker?: string; title?: ReactNode; action?: ReactNode; children: ReactNode; className?: string; tone?: "ink" | "raised" | "cream" }) {
  return (
    <section
      id={id}
      aria-labelledby={id && title ? `${id}-title` : undefined}
      className={clsx(
        "px-5 py-16 sm:px-8 md:py-24 lg:px-12",
        tone === "raised" && "bg-raised",
        tone === "cream" && "bg-cream text-ink",
        className,
      )}
    >
      <div className="mx-auto max-w-[1440px]">
        {(title || kicker) && (
          <header className="mb-10 flex flex-wrap items-end justify-between gap-4 md:mb-14">
            <div>
              {kicker && <p className={clsx("kicker mb-3", tone === "cream" ? "text-ink/70" : "text-muted")}>{kicker}</p>}
              {title && (
                <h2 id={id ? `${id}-title` : undefined} className={`display text-5xl sm:text-6xl md:text-7xl${typeof title === "string" && hasMarks(title) ? " !leading-[1.08] pt-[0.12em]" : ""}`}>
                  {title}
                </h2>
              )}
            </div>
            {action}
          </header>
        )}
        {children}
      </div>
    </section>
  );
}

export function Badge({ children, tone = "line" }: { children: ReactNode; tone?: "line" | "accent" | "upcoming" | "warn" }) {
  return (
    <span
      className={clsx(
        "kicker inline-flex items-center rounded-full px-2.5 py-1 !text-[0.65rem]",
        tone === "line" && "border border-line-strong text-cream-dim",
        tone === "accent" && "bg-[var(--accent)] text-[var(--accent-ink)]",
        tone === "upcoming" && "bg-cream text-ink",
        tone === "warn" && "bg-gold text-ink",
      )}
    >
      {children}
    </span>
  );
}

export function TriangleMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 36 20" aria-hidden="true" className={className}>
      <polygon points="6,2 11,18 1,18" fill="#FF7A59" />
      <polygon points="18,2 23,18 13,18" fill="#B6FF3B" />
      <polygon points="30,2 35,18 25,18" fill="#8C7CFF" />
    </svg>
  );
}

export function Arrow({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 16 16" aria-hidden="true" className={clsx("h-4 w-4", className)} fill="none" stroke="currentColor" strokeWidth="1.8">
      <path d="M3 8h10M9 4l4 4-4 4" />
    </svg>
  );
}

export function Heart({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className={clsx("h-4 w-4", className)} fill="currentColor">
      <path d="M12 21s-7.5-4.6-9.6-9.3C.9 8.3 3 4.5 6.6 4.5c2.1 0 3.6 1.2 5.4 3.3 1.8-2.1 3.3-3.3 5.4-3.3 3.6 0 5.7 3.8 4.2 7.2C19.5 16.4 12 21 12 21z" />
    </svg>
  );
}

export function PlayIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className={clsx("h-5 w-5", className)} fill="currentColor">
      <path d="M8 5.5v13a1 1 0 0 0 1.5.86l10.5-6.5a1 1 0 0 0 0-1.72L9.5 4.64A1 1 0 0 0 8 5.5z" />
    </svg>
  );
}

/** Horizontal snap rail on phones, grid from sm up. */
export function Rail({ children, cols = 4 }: { children: ReactNode[]; cols?: 3 | 4 }) {
  return (
    <ul className={clsx("no-scrollbar relative -mx-5 flex snap-x snap-mandatory gap-5 overflow-x-auto px-5 pb-2 sm:mx-0 sm:grid sm:grid-cols-2 sm:gap-x-6 sm:gap-y-12 sm:overflow-visible sm:px-0", cols === 4 ? "lg:grid-cols-4" : "lg:grid-cols-3")}>
      {children.map((c, i) => (
        <li key={i} className="w-[76vw] max-w-[340px] shrink-0 snap-start sm:w-auto sm:max-w-none">
          {c}
        </li>
      ))}
    </ul>
  );
}
