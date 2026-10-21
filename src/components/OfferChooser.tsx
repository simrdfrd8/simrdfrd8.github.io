"use client";

import { useId, useRef, type ReactNode } from "react";
import Link from "next/link";
import type { Product } from "@/lib/catalog/schema";
import { CheckoutButton } from "./CheckoutButton";
import { buttonClass } from "./ui";

type Offer = Product & { terms: string; priceLabel: string; agreementUrl?: string };

/** One primary button ("Buy / License · from $10"); every tier with its terms opens in a sheet. */
export function OfferChooser({ title, label, offers, buttonClassName, ariaLabel }: { title: string; label: ReactNode; offers: Offer[]; buttonClassName?: string; ariaLabel?: string }) {
  const ref = useRef<HTMLDialogElement>(null);
  const id = useId();
  return (
    <>
      <button type="button" className={buttonClassName ?? buttonClass("primary", "sm")} aria-label={ariaLabel} aria-haspopup="dialog" onClick={() => ref.current?.showModal()} data-offer-chooser>
        {label}
      </button>
      <dialog
        ref={ref}
        aria-labelledby={id}
        className="m-auto w-[min(94vw,34rem)] rounded-2xl bg-raised p-0 text-cream ring-1 ring-line backdrop:bg-ink/70 backdrop:backdrop-blur-sm"
        onClick={(e) => e.target === ref.current && ref.current?.close()}
      >
        <div className="p-6 sm:p-7">
          <p className="kicker text-muted">Choose a license</p>
          <h2 id={id} className="display mt-2 text-4xl">
            {title}
          </h2>
          <ul className="mt-6 divide-y divide-line border-y border-line">
            {offers.map((o) => (
              <li key={o.id} className="flex items-start justify-between gap-4 py-4">
                <div className="min-w-0">
                  <p className="font-semibold">
                    {o.title.split(": ").pop()} <span className="text-cream-dim">· {o.priceLabel}</span>
                    {o.status === "upcoming" && <span className="kicker ml-2 text-gold">soon</span>}
                  </p>
                  <p className="mt-1 text-sm text-cream-dim">{o.terms}</p>
                  {o.agreementUrl && (
                    <Link href={o.agreementUrl} className="mt-1 inline-block text-sm underline underline-offset-4 hover:text-cream" data-agreement-link>
                      Read the full agreement
                    </Link>
                  )}
                </div>
                <CheckoutButton product={o} priceLabel={o.priceLabel} label={o.price === null ? "Inquire" : o.status === "upcoming" ? "Notify me" : "Choose"} size="sm" variant={o.status === "available" && o.price !== null ? "primary" : "secondary"} />
              </li>
            ))}
          </ul>
          <div className="mt-5 flex items-center justify-between">
            <Link href="/licensing#compare" className="text-sm text-cream-dim underline underline-offset-4 hover:text-cream">
              Compare all licenses
            </Link>
            <form method="dialog">
              <button className={buttonClass("secondary", "sm")}>Close</button>
            </form>
          </div>
        </div>
      </dialog>
    </>
  );
}
