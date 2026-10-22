"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import clsx from "clsx";
import { Heart } from "./ui";

type Item = { label: string; href: string };

const matches = (path: string, href: string) => (href === "/" ? path === "/" : path === href || path.startsWith(href + "/"));
/** Only the most specific matching item is current, so /shop/merch lights up Merch, not Beats (/shop). */
const isActive = (path: string, href: string, items: Item[]) =>
  matches(path, href) && !items.some((o) => o.href !== href && o.href.length > href.length && o.href.startsWith(href + "/") && matches(path, o.href));

export function NavLinks({ items }: { items: Item[] }) {
  const path = usePathname();
  return (
    <>
      {items.map((i) => (
        <Link
          key={i.href}
          href={i.href}
          aria-current={isActive(path, i.href, items) ? "page" : undefined}
          className={clsx(
            "rounded-full px-2.5 py-2 text-[0.95rem] lg:px-3.5 font-medium transition-colors",
            isActive(path, i.href, items) ? "bg-cream/10 text-cream" : "text-cream-dim hover:text-cream",
          )}
        >
          {i.label}
        </Link>
      ))}
    </>
  );
}

export function MobileMenu({ primary, secondary }: { primary: Item[]; secondary: Item[] }) {
  const [open, setOpen] = useState(false);
  const path = usePathname();
  const btn = useRef<HTMLButtonElement>(null);
  useEffect(() => setOpen(false), [path]);
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setOpen(false);
        btn.current?.focus();
      }
    };
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open]);
  return (
    <div className="md:hidden">
      <button
        ref={btn}
        type="button"
        aria-expanded={open}
        aria-controls="mobile-menu"
        onClick={() => setOpen((o) => !o)}
        className="kicker flex h-10 shrink-0 items-center gap-2 rounded-full border border-line-strong px-3 text-cream min-[360px]:px-4"
      >
        {open ? "Close" : "Menu"}
      </button>
      <div
        id="mobile-menu"
        hidden={!open}
        className="fixed inset-x-0 top-16 bottom-0 z-50 overflow-y-auto bg-ink px-5 pt-6 pb-28"
      >
        <nav aria-label="Mobile">
          <ul className="space-y-1">
            {primary.map((i) => (
              <li key={i.href}>
                <Link href={i.href} aria-current={isActive(path, i.href, primary) ? "page" : undefined} className="display block py-2 text-6xl text-cream">
                  {i.label}
                </Link>
              </li>
            ))}
          </ul>
          <ul className="mt-8 grid grid-cols-2 gap-3 border-t border-line pt-6">
            {secondary.map((i) => (
              <li key={i.href}>
                <Link href={i.href} className="text-cream-dim hover:text-cream">
                  {i.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      </div>
    </div>
  );
}

/** Pay-what-you-want support always one tap away on phones. */
export function MobileSupportButton() {
  const path = usePathname();
  // Product pages: tuck the heart away while scrolling down so it never sits on top of the text; it comes back on scroll-up.
  const autoHide = /^\/shop\/merch\/[^/]+\/?$/.test(path);
  const [hidden, setHidden] = useState(false);
  useEffect(() => {
    setHidden(false);
    if (!autoHide) return;
    let last = window.scrollY;
    const onScroll = () => {
      const y = window.scrollY;
      if (Math.abs(y - last) < 8) return;
      setHidden(y > last && y > 80);
      last = y;
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [autoHide, path]);
  if (path.startsWith("/support")) return null;
  return (
    <Link
      href="/support"
      data-mobile-support
      data-hidden={hidden ? "true" : undefined}
      aria-label="Support"
      aria-hidden={hidden || undefined}
      tabIndex={hidden ? -1 : undefined}
      className="transition-[transform,opacity] duration-200 data-[hidden=true]:pointer-events-none data-[hidden=true]:translate-y-16 data-[hidden=true]:opacity-0 fixed right-3 bottom-[max(0.75rem,env(safe-area-inset-bottom))] z-40 inline-flex size-11 items-center justify-center rounded-full bg-hot text-ink shadow-[0_8px_22px_-8px_rgba(255,122,89,0.7)] md:hidden"
    >
      <Heart />
    </Link>
  );
}
