"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { accountsOn, getSession, googleStartUrl, startEmail, type Session } from "@/lib/accounts";
import { buttonClass } from "@/components/ui";
import { cardClass, inputClass } from "./AccountShell";

const ERRORS: Record<string, string> = {
  google_cancelled: "Google sign-in was cancelled.",
  google_state: "That Google sign-in expired. Please try again.",
  google_unverified: "That Google account's email isn't verified.",
};

export function SignInForm() {
  const [session, setSession] = useState<Session | null>(null);
  const [email, setEmail] = useState("");
  const [state, setState] = useState<"idle" | "sending" | "sent" | "error">("idle");
  const [message, setMessage] = useState<string | null>(null);
  const [devLink, setDevLink] = useState<string | null>(null);

  useEffect(() => {
    if (!accountsOn()) return;
    const e = new URLSearchParams(window.location.search).get("error");
    if (e) setMessage(ERRORS[e] ?? "Sign-in didn't work. Please try again.");
    getSession()
      .then((s) => {
        if (s.user) window.location.replace("/account/");
        else setSession(s);
      })
      .catch(() => setMessage("Accounts are offline right now. You can still check out as a guest."));
  }, []);

  if (!accountsOn())
    return <p className="text-cream-dim">Accounts aren&rsquo;t open yet. Everything in the shop works without one.</p>;

  async function submit(ev: React.FormEvent) {
    ev.preventDefault();
    setState("sending");
    setMessage(null);
    try {
      const r = await startEmail(email);
      setDevLink(r.devLink ?? null);
      setState("sent");
    } catch (e) {
      setState("error");
      setMessage(e instanceof Error ? e.message : "Something went wrong.");
    }
  }

  return (
    <div className="space-y-6">
      {state === "sent" ? (
        <div className={cardClass} role="status" data-link-sent>
          <p className="text-xl font-semibold">Check your email</p>
          <p className="mt-2 text-cream-dim">If {email} is a real address, a sign-in link is on its way. It works once and expires in 15 minutes.</p>
          {devLink && (
            <p className="mt-4 rounded-xl border border-gold/50 p-4 text-sm text-cream-dim" data-dev-link>
              Email sending is off for now, so here is the link:{" "}
              <a href={devLink} className="break-all text-cream underline underline-offset-4">
                Sign in
              </a>
            </p>
          )}
          <button type="button" onClick={() => setState("idle")} className={buttonClass("ghost", "sm") + " mt-4"}>
            Use a different email
          </button>
        </div>
      ) : (
        <form onSubmit={submit} className={cardClass + " space-y-4"} aria-label="Sign in with email">
          <label htmlFor="acct-email" className="kicker block text-muted">
            Email
          </label>
          <input id="acct-email" type="email" required autoComplete="email" inputMode="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Your email" className={inputClass} />
          <button type="submit" disabled={state === "sending" || !session} className={buttonClass("primary", "md") + " w-full"}>
            {state === "sending" ? "Sending…" : "Email me a sign-in link"}
          </button>
          <p className="text-sm text-muted">No password. We email you a link that signs you in.</p>
        </form>
      )}

      {session?.providers.google && (
        <a href={googleStartUrl()} className={buttonClass("secondary", "md") + " w-full"} data-google>
          Continue with Google
        </a>
      )}

      {message && (
        <p role="alert" className="text-hot">
          {message}
        </p>
      )}

      <p className="text-cream-dim">
        You don&rsquo;t need an account to buy anything. Guest checkout works the same. An account keeps your purchase and listening history, and lets you opt in to giveaways (free entry, no purchase necessary) and the newsletter.{" "}
        <Link href="/shop/merch" className="text-cream underline underline-offset-4">
          Back to the shop
        </Link>
      </p>
    </div>
  );
}
