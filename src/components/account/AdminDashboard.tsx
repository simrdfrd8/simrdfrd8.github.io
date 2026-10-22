"use client";

import { useEffect, useState } from "react";
import clsx from "clsx";
import { accountsOn, getAdminCatalog, getSession, setAdminViewMode, type AdminProduct } from "@/lib/accounts";
import { Badge } from "@/components/ui";
import { cardClass } from "./AccountShell";
import { AdminProductGrid } from "./AdminProductGrid";

/** Admin only: shop view switch (All / Public) for the admin's own account, plus the whole catalog. */
export function AdminDashboard() {
  const [state, setState] = useState<"loading" | "denied" | "ready">("loading");
  const [mode, setMode] = useState<"all" | "public">("all");
  const [products, setProducts] = useState<AdminProduct[]>([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!accountsOn()) return;
    getSession()
      .then((s) => {
        if (!s.user) return window.location.replace("/account/sign-in/");
        if (s.user.role !== "admin") return setState("denied");
        return getAdminCatalog().then((c) => {
          setMode(c.viewMode);
          setProducts(c.products);
          setState("ready");
        });
      })
      .catch(() => setState("denied"));
  }, []);

  if (!accountsOn() || state === "denied") return <p className="text-cream-dim">This page isn&rsquo;t available.</p>;
  if (state === "loading") return <p className="text-cream-dim" role="status">Loading…</p>;

  const merch = products.filter((p) => p.type === "merch");
  const shown = mode === "all" ? merch : merch.filter((p) => p.public);
  const change = async (m: "all" | "public") => {
    setSaving(true);
    try {
      setMode((await setAdminViewMode(m)).viewMode);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6" data-admin>
      <section className={cardClass}>
        <h2 className="text-xl font-semibold">Shop view</h2>
        <p className="mt-1 text-sm text-cream-dim">Changes what you see in the shop on this account only. Visitors and customer accounts always see Public.</p>
        <div role="radiogroup" aria-label="Shop view" className="mt-4 inline-flex rounded-full border border-line-strong p-1">
          {(["all", "public"] as const).map((m) => (
            <button
              key={m}
              type="button"
              role="radio"
              aria-checked={mode === m}
              disabled={saving}
              data-view-mode={m}
              onClick={() => change(m)}
              className={clsx("h-9 rounded-full px-5 text-sm font-semibold", mode === m ? "bg-cream text-ink" : "text-cream-dim hover:text-cream")}
            >
              {m === "all" ? "All" : "Public"}
            </button>
          ))}
        </div>
        <p className="mt-3 text-sm text-muted">
          {merch.filter((p) => p.public).length} public · {merch.filter((p) => !p.public).length} admin only · {products.length - merch.length} other products
        </p>
      </section>
      <section>
        <div className="mb-3 flex items-center gap-2">
          <h2 className="text-xl font-semibold">Merch</h2>
          <Badge>{mode === "all" ? "All" : "Public"}</Badge>
        </div>
        <AdminProductGrid products={shown} />
      </section>
    </div>
  );
}
