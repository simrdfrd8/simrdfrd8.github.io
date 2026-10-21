import Image from "next/image";
import Link from "next/link";
import clsx from "clsx";
import { TriangleMark } from "./ui";
import { brandLogo } from "@/lib/brand-assets";

/** Brandy's nav logo: the label mark (logo-text.svg) + FLAVORFUL MUSIC + the three shade dots (Hip-Hop · EDM · Production). */
export function Wordmark({ className, size = "md" }: { className?: string; size?: "md" | "lg" }) {
  const logo = brandLogo("text");
  const lg = size === "lg";
  return (
    <Link href="/" aria-label="Flavorful Music, home" className={clsx("group inline-flex min-w-0 items-center gap-2 min-[360px]:gap-3", className)} data-wordmark>
      {logo ? (
        <Image src={logo} alt="" width={489} height={473} unoptimized className={clsx("w-auto transition-transform duration-500 group-hover:-rotate-6", lg ? "h-10 min-[360px]:h-14" : "h-8 min-[360px]:h-9 lg:h-11")} />
      ) : (
        <TriangleMark className={clsx("transition-transform duration-500 group-hover:-rotate-6", lg ? "h-7 w-12" : "h-4 w-7")} />
      )}
      <span className={clsx("inline-flex items-center font-extrabold whitespace-nowrap uppercase", lg ? "text-[14px] tracking-[2px] min-[360px]:text-lg min-[360px]:tracking-[4px]" : "text-[12px] tracking-[2px] min-[360px]:text-[13px] min-[360px]:tracking-[3px] lg:text-[15px] lg:tracking-[4px]")}>
        Flavorful Music
        <span aria-hidden="true" className="ml-1.5 inline-flex gap-[3px]">
          <i className="h-2 w-2 rounded-full bg-hiphop" />
          <i className="h-2 w-2 rounded-full bg-edm" />
          <i className="h-2 w-2 rounded-full bg-prod" />
        </span>
      </span>
    </Link>
  );
}
