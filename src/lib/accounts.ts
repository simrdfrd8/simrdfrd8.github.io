/**
 * Customer accounts client (optional; guest checkout never needs it).
 * The API lives in the accounts Worker. NEXT_PUBLIC_ACCOUNTS_API is its base, e.g. "/api/account" when the Worker serves
 * the site, or "https://account.flavorfulmusic.com/api/account" later. Unset = accounts are off: no Sign in link anywhere.
 */
export const ACCOUNTS_API = (process.env.NEXT_PUBLIC_ACCOUNTS_API ?? "").replace(/\/$/, "");
export const accountsOn = () => ACCOUNTS_API !== "";

export type OptInStatus = "none" | "pending" | "subscribed" | "unsubscribed";
/** Double opt-in: ticking a box makes it "pending" and emails a confirm link; it becomes "subscribed" once the link is clicked. */
export type OptIn = { status: OptInStatus; subscribed: boolean; pending: boolean; consentedAt: number | null; confirmedAt: number | null; source: string | null; unsubscribedAt: number | null };
export type ListKey = "giveaways" | "newsletter";
export type AccountUser = { email: string; role: "customer" | "admin"; createdAt: number; emailSuppressed: boolean; optIns: Record<ListKey, OptIn>; adminViewMode?: "all" | "public" };
export type Session = { user: AccountUser | null; csrf: string; providers: { email: boolean; google: boolean } };
export type Purchase = { source: string; item_type: string; item_id: string | null; title: string | null; tier: string | null; amount_cents: number | null; currency: string | null; purchased_at: number };
export type Activity = { kind: "view" | "play"; item_type: "merch" | "beat" | "song" | "sample"; item_id: string; at: number };

/** The opt-in wording shown next to each box (the Worker stores the same text with the consent time). */
export const OPT_IN_LABELS = {
  giveaways: "Email me about Flavorful Music giveaways. Free entry, no purchase necessary.",
  newsletter: "Send me the Flavorful Music newsletter.",
} as const satisfies Record<ListKey, string>;

let csrf: string | null = null;

export class AccountError extends Error {
  constructor(public status: number, public code: string, message: string) {
    super(message);
  }
}

async function call<T>(path: string, init: RequestInit = {}): Promise<T> {
  const res = await fetch(ACCOUNTS_API + path, { credentials: "include", cache: "no-store", ...init, headers: { ...(init.body ? { "content-type": "application/json" } : {}), ...(csrf ? { "x-csrf-token": csrf } : {}), ...(init.headers ?? {}) } });
  const j = await res.json().catch(() => ({}));
  if (!res.ok) throw new AccountError(res.status, j.error ?? "error", j.message ?? "Something went wrong. Please try again.");
  return j as T;
}
const send = <T,>(method: string, path: string, body?: unknown) => call<T>(path, { method, body: body === undefined ? undefined : JSON.stringify(body) });

export async function getSession(): Promise<Session> {
  const s = await call<Session>("/session");
  csrf = s.csrf;
  return s;
}
const withCsrf = async () => {
  if (!csrf) await getSession();
};
export const startEmail = async (email: string, returnTo = "/account/") => (await withCsrf(), send<{ ok: true; devLink?: string }>("POST", "/email/start", { email, returnTo }));
export const verifyEmail = async (token: string) => (await withCsrf(), send<{ ok: true; user: AccountUser }>("POST", "/email/verify", { token }));
export const getMe = () => call<{ user: AccountUser; purchases: Purchase[]; activity: Activity[] }>("/me");
export const setOptIns = async (v: Partial<Record<ListKey, boolean>>) => (await withCsrf(), send<{ user: AccountUser; confirmLink?: string }>("PUT", "/opt-ins", v));
export const confirmOptIns = async (token: string) => (await withCsrf(), send<{ ok: true; confirmed: ListKey[] }>("POST", "/opt-ins/confirm", { token }));
export const signOut = async () => (await withCsrf(), send<{ ok: true }>("POST", "/signout"));
export const deleteAccount = async () => (await withCsrf(), send<{ ok: true }>("POST", "/delete", { confirm: "delete" }));
export const googleStartUrl = (returnTo = "/account/") => `${ACCOUNTS_API}/google/start?returnTo=${encodeURIComponent(returnTo)}`;

export type AdminProduct = { id: string; slug: string; title: string; type: string; category: string | null; public: boolean; shopListed: boolean; status: string; colorways: string[]; image: string | null };
export const getAdminCatalog = () => call<{ viewMode: "all" | "public"; products: AdminProduct[] }>("/admin/catalog");
export const setAdminViewMode = async (mode: "all" | "public") => (await withCsrf(), send<{ viewMode: "all" | "public" }>("PUT", "/admin/view-mode", { mode }));

/** Reads #token=…&next=… from a sign-in link (kept in the fragment so it never reaches server logs or Referer). */
export function parseLinkFragment(hash: string): { token: string | null; next: string } {
  const q = new URLSearchParams(hash.replace(/^#/, ""));
  const next = q.get("next") ?? "/account/";
  return { token: q.get("token"), next: /^\/(?![/\\])/.test(next) ? next : "/account/" };
}

export const fmtDate = (ms: number) => new Date(ms).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" });
