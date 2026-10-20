"use client";

import { Children, useState, type ReactNode } from "react";

/** Grid that shows the first `initial` items and reveals the rest with one button (same on desktop and mobile). */
export function ShowMore({ children, initial = 8, className, label }: { children: ReactNode; initial?: number; className?: string; label?: (n: number) => string }) {
  const items = Children.toArray(children);
  const [open, setOpen] = useState(false);
  const shown = open ? items : items.slice(0, initial);
  return (
    <>
      <div className={className} data-show-more={open ? "all" : "initial"}>
        {shown}
      </div>
      {items.length > initial && !open && (
        <div className="mt-12 flex justify-center">
          <button
            type="button"
            onClick={() => setOpen(true)}
            className="inline-flex h-12 items-center rounded-full px-6 text-sm font-semibold ring-1 ring-line-strong transition hover:bg-cream hover:text-ink"
          >
            {label ? label(items.length) : `Show all ${items.length} tracks`}
          </button>
        </div>
      )}
    </>
  );
}
