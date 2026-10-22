"use client";

import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { accountsOn, getAdminCatalog, getSession, type AdminProduct } from "@/lib/accounts";
import { AdminProductGrid } from "./AdminProductGrid";

/**
 * On the merch shop, an admin in "All" view also sees the products that aren't public, loaded from the accounts Worker.
 * Everyone else gets nothing (no admin request is made for them).
 */
export function AdminShopExtras() {
  const path = usePathname();
  const [items, setItems] = useState<AdminProduct[] | null>(null);
  const onShop = /^\/shop\/merch\/?$/.test(path);
  useEffect(() => {
    setItems(null);
    if (!accountsOn() || !onShop) return;
    let live = true;
    getSession()
      .then((s) => (s.user?.role === "admin" && s.user.adminViewMode !== "public" ? getAdminCatalog() : null))
      .then((c) => live && c && setItems(c.products.filter((p) => p.type === "merch" && !p.public)))
      .catch(() => null);
    return () => {
      live = false;
    };
  }, [onShop]);
  if (!items?.length) return null;
  return (
    <section className="px-5 pb-16 sm:px-8 lg:px-12" data-admin-extras aria-labelledby="admin-extras-title">
      <div className="mx-auto max-w-[1440px] rounded-3xl p-5 ring-1 ring-gold/60">
        <p className="kicker text-gold">Admin view: All</p>
        <h2 id="admin-extras-title" className="mt-1 mb-4 text-2xl font-semibold">
          Not public ({items.length})
        </h2>
        <AdminProductGrid products={items} />
      </div>
    </section>
  );
}
