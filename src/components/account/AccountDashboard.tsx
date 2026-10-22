"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { OPT_IN_LABELS, accountsOn, deleteAccount, fmtDate, getMe, setOptIns, signOut, type Activity, type AccountUser, type Purchase } from "@/lib/accounts";
import { buttonClass } from "@/components/ui";
import { cardClass } from "./AccountShell";

const LISTS = ["giveaways", "newsletter"] as const;
const LIST_TITLE = { giveaways: "Giveaways", newsletter: "Newsletter" } as const;
const ITEM_LABEL = { merch: "Merch", beat: "Beat", song: "Song", sample: "Sample pack" } as const;

export function AccountDashboard() {
  const [user, setUser] = useState<AccountUser | null>(null);
  const [purchases, setPurchases] = useState<Purchase[]>([]);
  const [activity, setActivity] = useState<Activity[]>([]);
  const [saving, setSaving] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [devConfirmLink, setDevConfirmLink] = useState<string | null>(null);

  useEffect(() => {
    if (!accountsOn()) return;
    getMe()
      .then((r) => {
        setUser(r.user);
        setPurchases(r.purchases);
        setActivity(r.activity);
      })
      .catch((e) => {
        if (e?.status === 401) window.location.replace("/account/sign-in/");
        else setError("Your account couldn't load. Please try again.");
      });
  }, []);

  if (!accountsOn()) return <p className="text-cream-dim">Accounts aren&rsquo;t open yet. Everything in the shop works without one.</p>;
  if (!user) return error ? <p role="alert" className="text-hot">{error}</p> : <p className="text-cream-dim" role="status">Loading…</p>;

  async function toggle(list: (typeof LISTS)[number], on: boolean) {
    setSaving(list);
    setError(null);
    const before = user;
    // optimistic: the box flips right away, the saved state (with the consent time) replaces it
    setUser((u) => (u ? { ...u, optIns: { ...u.optIns, [list]: { ...u.optIns[list], ...(on ? { pending: true, status: "pending" } : { subscribed: false, pending: false, status: "unsubscribed" }) } } } : u));
    try {
      const r = await setOptIns({ [list]: on });
      setUser(r.user);
      if (r.confirmLink) setDevConfirmLink(r.confirmLink);
    } catch (e) {
      setUser(before);
      setError(e instanceof Error ? e.message : "Couldn't save that.");
    } finally {
      setSaving(null);
    }
  }

  return (
    <div className="space-y-6" data-account>
      <div className={cardClass + " flex flex-wrap items-center justify-between gap-4"}>
        <div className="min-w-0">
          <p className="kicker text-muted">Signed in as</p>
          <p className="mt-1 truncate text-xl font-semibold" data-account-email>
            {user.email}
          </p>
        </div>
        <button
          type="button"
          className={buttonClass("secondary", "sm")}
          onClick={async () => {
            await signOut().catch(() => null);
            window.location.replace("/");
          }}
        >
          Sign out
        </button>
      </div>

      {user.role === "admin" && (
        <Link href="/account/admin/" className={cardClass + " block hover:ring-line-strong"} data-admin-link>
          <p className="kicker text-muted">Admin</p>
          <p className="mt-1 text-lg font-semibold">Dashboard and shop view ({user.adminViewMode === "public" ? "Public" : "All"}) →</p>
        </Link>
      )}

      <section className={cardClass} aria-labelledby="optins-title">
        <h2 id="optins-title" className="text-xl font-semibold">
          Email and giveaways
        </h2>
        <p className="mt-1 text-sm text-muted">Both are off unless you tick them. We&rsquo;ll email you a link to confirm first. Untick any time.</p>
        <div className="mt-4 space-y-4">
          {LISTS.map((l) => {
            const o = user.optIns[l];
            return (
              <label key={l} className="flex cursor-pointer items-start gap-3" data-optin={l}>
                <input type="checkbox" className="mt-1 size-5 accent-[#FF7A59]" checked={o.subscribed || o.pending} aria-busy={saving === l} disabled={saving !== null && saving !== l} onChange={(e) => toggle(l, e.target.checked)} />
                <span>
                  <span className="block font-semibold">{LIST_TITLE[l]}</span>
                  <span className="block text-cream-dim">{OPT_IN_LABELS[l]}</span>
                  {o.pending && (
                    <span className="block text-sm text-gold" data-pending>
                      Check your email and tap the link to confirm.
                    </span>
                  )}
                  {o.subscribed && <span className="block text-sm text-muted">Confirmed {fmtDate(o.confirmedAt ?? o.consentedAt ?? Date.now())}</span>}
                </span>
              </label>
            );
          })}
        </div>
        {devConfirmLink && (
          <p className="mt-4 rounded-xl border border-gold/50 p-4 text-sm text-cream-dim" data-dev-confirm-link>
            Email sending is off for now, so here is the confirm link: <a href={devConfirmLink} className="break-all text-cream underline underline-offset-4">Confirm</a>
          </p>
        )}
      </section>

      <section className={cardClass} aria-labelledby="purchases-title">
        <h2 id="purchases-title" className="text-xl font-semibold">
          Purchase history
        </h2>
        {purchases.length === 0 ? (
          <p className="mt-2 text-cream-dim" data-empty="purchases">
            No purchases yet. Beats and merch you buy while signed in will show up here.
          </p>
        ) : (
          <ul className="mt-3 divide-y divide-line">
            {purchases.map((p, i) => (
              <li key={i} className="flex justify-between gap-4 py-2">
                <span>{p.title ?? p.item_id}</span>
                <span className="text-muted">{fmtDate(p.purchased_at)}</span>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className={cardClass} aria-labelledby="activity-title">
        <h2 id="activity-title" className="text-xl font-semibold">
          Recently viewed and played
        </h2>
        {activity.length === 0 ? (
          <p className="mt-2 text-cream-dim" data-empty="activity">
            Nothing yet. Merch you look at and beats, songs and samples you play will show up here.
          </p>
        ) : (
          <ul className="mt-3 divide-y divide-line">
            {activity.map((a, i) => (
              <li key={i} className="flex justify-between gap-4 py-2">
                <span>
                  {ITEM_LABEL[a.item_type]}: {a.item_id}
                </span>
                <span className="text-muted">{fmtDate(a.at)}</span>
              </li>
            ))}
          </ul>
        )}
      </section>

      {error && (
        <p role="alert" className="text-hot">
          {error}
        </p>
      )}

      <section className="rounded-2xl p-6 ring-1 ring-line" aria-labelledby="delete-title">
        <h2 id="delete-title" className="text-lg font-semibold">
          Delete account
        </h2>
        <p className="mt-1 text-sm text-cream-dim">Removes your account, opt-ins and history. Files you bought stay available through your purchase emails.</p>
        {confirmDelete ? (
          <div className="mt-4 flex flex-wrap gap-3">
            <button
              type="button"
              data-confirm-delete
              className={buttonClass("primary", "sm") + " !bg-hot"}
              onClick={async () => {
                try {
                  await deleteAccount();
                  window.location.replace("/");
                } catch (e) {
                  setError(e instanceof Error ? e.message : "Couldn't delete the account.");
                }
              }}
            >
              Yes, delete my account
            </button>
            <button type="button" className={buttonClass("ghost", "sm")} onClick={() => setConfirmDelete(false)}>
              Keep it
            </button>
          </div>
        ) : (
          <button type="button" className={buttonClass("secondary", "sm") + " mt-4"} onClick={() => setConfirmDelete(true)}>
            Delete account
          </button>
        )}
      </section>
    </div>
  );
}
