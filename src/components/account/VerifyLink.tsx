"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { accountsOn, parseLinkFragment, verifyEmail } from "@/lib/accounts";

/** Sign-in links land here. The token is POSTed (never used by a GET), so link scanners can't burn it. */
export function VerifyLink() {
  const [error, setError] = useState<string | null>(null);
  const ran = useRef(false);
  useEffect(() => {
    if (ran.current || !accountsOn()) return;
    ran.current = true;
    const { token, next } = parseLinkFragment(window.location.hash);
    history.replaceState(null, "", window.location.pathname);
    if (!token) {
      setError("That sign-in link is incomplete. Request a new one.");
      return;
    }
    verifyEmail(token)
      .then(() => window.location.replace(next))
      .catch((e) => setError(e instanceof Error ? e.message : "Sign-in didn't work."));
  }, []);
  if (!error) return <p className="text-cream-dim" role="status">Signing you in…</p>;
  return (
    <div className="space-y-4">
      <p role="alert" className="text-hot">
        {error}
      </p>
      <Link href="/account/sign-in/" className="text-cream underline underline-offset-4">
        Get a new link
      </Link>
    </div>
  );
}
