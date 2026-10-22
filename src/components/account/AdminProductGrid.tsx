"use client";

import { ACCOUNTS_API, type AdminProduct } from "@/lib/accounts";
import { Badge } from "@/components/ui";

/** Admin-only images live on the accounts Worker (/_admin-media/…), never in the public build. */
export const adminImageUrl = (src: string | null) => {
  if (!src) return null;
  if (!src.startsWith("/_admin-media/")) return src;
  try {
    return new URL(src, new URL(ACCOUNTS_API, window.location.href)).href;
  } catch {
    return src;
  }
};

export function AdminProductGrid({ products }: { products: AdminProduct[] }) {
  return (
    <ul className="grid grid-cols-2 gap-4 sm:grid-cols-3">
      {products.map((p) => {
        const img = adminImageUrl(p.image);
        return (
          <li key={p.id} className="overflow-hidden rounded-2xl bg-raised ring-1 ring-line" data-admin-product={p.slug} data-public={p.public ? "true" : "false"}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            {img ? <img src={img} alt={p.title} loading="lazy" className="aspect-square w-full object-cover" /> : <div className="aspect-square bg-ink" />}
            <div className="space-y-2 p-3">
              <p className="text-sm font-semibold leading-tight">{p.title}</p>
              <Badge tone={p.public ? "line" : "warn"}>{p.public ? "Public" : "Admin only"}</Badge>
            </div>
          </li>
        );
      })}
    </ul>
  );
}
