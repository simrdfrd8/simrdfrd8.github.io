"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { accountsOn, confirmOptIns, parseLinkFragment, type ListKey } from "@/lib/accounts";

const NAME: Record<ListKey, string> = { giveaways: "giveaways", newsletter: "the newsletter" };

/** Double opt-in confirm links land here (#token=…). The token is POSTed, never used by a GET, so link scanners can't confirm for someone. */
export function ConfirmLink() {
  const [state, setState] = useState<{ ok: ListKey[] } | { error: string } | null>(null);
  const ran = useRef(false);
  useEffect(() => {
    if (ran.current || !accountsOn()) return;
    ran.current = true;
    const { token } = parseLinkFragment(window.location.hash);
    history.replaceState(null, "", window.location.pathname);
    if (!token) {
      setState({ error: "That confirm link is incomplete." });
      return;
    }
    confirmOptIns(token)
      .then((r) => setState({ ok: r.confirmed }))
      .catch((e) => setState({ error: e instanceof Error ? e.message : "That didn't work." }));
  }, []);
  if (!state) return <p className="text-cream-dim" role="status">Confirming…</p>;
  if ("error" in state)
    return (
      <div className="space-y-4">
        <p role="alert" className="text-hot">
          {state.error}
        </p>
        <Link href="/account/" className="text-cream underline underline-offset-4">
          Go to your account
        </Link>
      </div>
    );
  return (
    <div className="space-y-4" data-confirmed={state.ok.join(",")}>
      <p className="text-lg">You&rsquo;re in: {state.ok.map((l) => NAME[l]).join(" and ")}.</p>
      {state.ok.includes("giveaways") && <p className="text-cream-dim">Giveaways are always free to enter, no purchase necessary. Each one comes with its official rules.</p>}
      <Link href="/account/" className="text-cream underline underline-offset-4">
        Back to your account
      </Link>
    </div>
  );
}
