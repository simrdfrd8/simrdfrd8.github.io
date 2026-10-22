"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import clsx from "clsx";
import { accountsOn, getSession } from "@/lib/accounts";

/** "Sign in" / "Account" link. Renders nothing when accounts are off (no NEXT_PUBLIC_ACCOUNTS_API). */
function useSignedIn() {
  const path = usePathname();
  const [signedIn, setSignedIn] = useState<boolean | null>(null);
  useEffect(() => {
    if (!accountsOn()) return;
    let live = true;
    getSession()
      .then((s) => live && setSignedIn(!!s.user))
      .catch(() => live && setSignedIn(false));
    return () => {
      live = false;
    };
  }, [path]);
  return signedIn;
}

export function AccountNavLink({ variant = "desktop" }: { variant?: "desktop" | "mobile" }) {
  const path = usePathname();
  const signedIn = useSignedIn();
  if (!accountsOn()) return null;
  const href = signedIn ? "/account/" : "/account/sign-in/";
  const label = signedIn ? "Account" : "Sign in";
  const current = path.startsWith("/account");
  if (variant === "mobile")
    return (
      <Link href={href} data-account-link className="text-cream-dim hover:text-cream">
        {label}
      </Link>
    );
  return (
    <Link
      href={href}
      data-account-link
      aria-current={current ? "page" : undefined}
      className={clsx("rounded-full px-2.5 py-2 text-[0.95rem] font-medium transition-colors lg:px-3.5", current ? "bg-cream/10 text-cream" : "text-cream-dim hover:text-cream")}
    >
      {label}
    </Link>
  );
}
