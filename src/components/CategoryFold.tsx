"use client";

import { useEffect, useId, useState, type ReactNode } from "react";

/**
 * One home-page category that folds: a plain header button (icon, name, count, plus) and an artist list that rolls out.
 * The list is always in the DOM (crawlable links in the static HTML); folded, it's collapsed to 0 height via grid rows and
 * visibility:hidden (flipped after the fold finishes) so hidden links can't take focus. Without JS a <noscript> style shows all lists. Several categories can be open at once. Everything starts folded on the server
 * and on first client render (no hydration mismatch); a hash pointing at the category or one of its artists opens it after mount.
 */
export function CategoryFold({ id, label, slugs, header, children }: { id: string; label: string; slugs: string[]; header: ReactNode; children: ReactNode }) {
  const [open, setOpen] = useState(false);
  const panelId = `${useId().replace(/:/g, "")}-${id}`;

  useEffect(() => {
    const sync = () => {
      const h = decodeURIComponent(window.location.hash.slice(1));
      if (h && (h === id || slugs.includes(h))) {
        setOpen(true);
        if (h !== id) requestAnimationFrame(() => document.getElementById(h)?.scrollIntoView({ block: "center" }));
      }
    };
    sync();
    window.addEventListener("hashchange", sync);
    return () => window.removeEventListener("hashchange", sync);
  }, [id, slugs]);

  return (
    <>
      <h2 className="m-0">
        <button
          type="button"
          aria-expanded={open}
          aria-controls={panelId}
          onClick={() => setOpen((o) => !o)}
          className="group flex w-full cursor-pointer items-center gap-4 px-2 py-5 text-left outline-offset-[-2px] focus-visible:outline-2 focus-visible:outline-[var(--shade-text)] md:py-6"
          data-cat-toggle={id}
        >
          {header}
          <span
            aria-hidden="true"
            className="relative ml-1 block size-4 shrink-0 text-[var(--shade-text)] transition-transform duration-300 ease-out group-aria-expanded:rotate-45 motion-reduce:transition-none"
          >
            <span className="absolute top-1/2 left-0 h-px w-4 -translate-y-1/2 bg-current" />
            <span className="absolute top-0 left-1/2 h-4 w-px -translate-x-1/2 bg-current" />
          </span>
        </button>
      </h2>
      <div
        id={panelId}
        role="region"
        aria-label={label}
        data-cat-panel={id}
        data-open={open ? "true" : "false"}
        className={`cat-panel grid transition-[grid-template-rows,opacity,visibility] duration-300 ease-out motion-reduce:transition-none ${open ? "visible grid-rows-[1fr] opacity-100" : "invisible grid-rows-[0fr] opacity-0"}`}
      >
        <div className="min-h-0 overflow-hidden">{children}</div>
      </div>
    </>
  );
}
