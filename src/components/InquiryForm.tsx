"use client";

import { useEffect, useState } from "react";
import clsx from "clsx";
import { INQUIRY_EMAILS, INQUIRY_LABELS, INQUIRY_TYPES, inquiryMailto, isInquiryType, type InquiryType } from "@/lib/inquiry";
import { buttonClass } from "./ui";
import { track } from "@/lib/analytics";

/**
 * Contact block for the static site: one mailto: link per inquiry type with a prefilled subject line.
 * ?type= and ?ref= (or ?service=) in the URL pick the highlighted topic and add a reference to the subject.
 */
/** `who` (optional) is the one artist the page is about; it is added to the subject line. */
export function InquiryForm({ defaultType = "booking", who, compact }: { defaultType?: InquiryType; who?: string; compact?: boolean }) {
  const [type, setType] = useState<InquiryType>(defaultType);
  const [ref, setRef] = useState<string | undefined>();

  useEffect(() => {
    const sp = new URLSearchParams(window.location.search);
    const t = sp.get("type");
    if (isInquiryType(t)) setType(t);
    setRef(sp.get("ref") ?? sp.get("service") ?? undefined);
  }, []);

  return (
    <div className={clsx("grid gap-5", !compact && "rounded-2xl bg-raised p-6 ring-1 ring-line sm:p-8")} data-inquiry>
      <p className="kicker text-muted">What&apos;s it about?</p>
      <div className="flex flex-wrap gap-2">
        {INQUIRY_TYPES.map((t) => (
          <a
            key={t}
            href={inquiryMailto(t, { who, ref: t === type ? ref : undefined })}
            onClick={() => track("inquiry_click", { type: t })}
            data-inquiry-type={t}
            className={clsx("rounded-full px-4 py-2 text-sm font-medium transition", type === t ? "bg-cream text-ink" : "border border-line-strong text-cream-dim hover:text-cream")}
          >
            {INQUIRY_LABELS[t]}
          </a>
        ))}
      </div>
      <p className="text-cream-dim">
        This opens a new email to <span className="text-cream" data-inquiry-email>{INQUIRY_EMAILS[type]}</span> with the subject filled in. Tell us who it&apos;s for, dates, a rough budget and what you have in mind.
      </p>
      <div>
        <a href={inquiryMailto(type, { who, ref })} className={buttonClass("accent", "lg")} onClick={() => track("inquiry_click", { type })} data-inquiry-primary>
          Email us about {INQUIRY_LABELS[type].toLowerCase()}
        </a>
      </div>
    </div>
  );
}
