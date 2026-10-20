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
    <Link href="/" aria-label="Flavorful Music, home" className={clsx("group inline-flex items-center gap-3", className)} data-wordmark>
      {logo ? (
        <Image src={logo} alt="" width={489} height={473} unoptimized className={clsx("w-auto transition-transform duration-500 group-hover:-rotate-6", lg ? "h-14" : "h-9 md:h-11")} />
      ) : (
        <TriangleMark className={clsx("transition-transform duration-500 group-hover:-rotate-6", lg ? "h-7 w-12" : "h-4 w-7")} />
      )}
      <span className={clsx("inline-flex items-center font-extrabold whitespace-nowrap uppercase", lg ? "text-lg tracking-[4px]" : "text-[13px] tracking-[3px] md:text-[15px] md:tracking-[4px]")}>
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
