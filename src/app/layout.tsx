import type { Metadata, Viewport } from "next";
import { Anton, Inter, IBM_Plex_Mono, Raleway } from "next/font/google";
import "./globals.css";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { MobileSupportButton } from "@/components/NavClient";
import { AdminShopExtras } from "@/components/account/AdminShopExtras";
import { Analytics } from "@/components/Analytics";
import { PlayerProvider } from "@/components/player/PlayerProvider";
import { MiniPlayer } from "@/components/player/MiniPlayer";
import { catalog } from "@/lib/catalog";
import { isPreview, siteUrl } from "@/lib/env";
import { JsonLd, orgLd } from "@/lib/jsonld";

const anton = Anton({ weight: "400", subsets: ["latin"], variable: "--font-anton", display: "swap" });
const inter = Inter({ subsets: ["latin"], variable: "--font-inter", display: "swap" });
const raleway = Raleway({ weight: ["400", "600", "800"], subsets: ["latin"], variable: "--font-raleway", display: "swap" });
const plex = IBM_Plex_Mono({ weight: ["400", "500"], subsets: ["latin"], variable: "--font-plex-mono", display: "swap" });

const { site } = catalog;

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl()),
  title: { default: `${site.name}: ${site.tagline}`, template: `%s · ${site.name}` },
  description: site.description,
  applicationName: site.name,
  openGraph: { type: "website", siteName: site.name, title: site.name, description: site.description, url: "/" },
  twitter: { card: "summary_large_image", title: site.name, description: site.description },
  robots: isPreview() ? { index: false, follow: false } : { index: true, follow: true },
  alternates: { canonical: "/" },
};

export const viewport: Viewport = { themeColor: "#17121C", colorScheme: "dark" };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${anton.variable} ${inter.variable} ${plex.variable} ${raleway.variable}`}>
      <body className="grain min-h-dvh bg-ink text-cream">
        <a href="#main" className="sr-only z-[70] rounded-full bg-cream px-4 py-2 text-ink focus:not-sr-only focus:fixed focus:top-3 focus:left-3">
          Skip to content
        </a>
        <PlayerProvider>
        <SiteHeader />
        <main id="main" tabIndex={-1} className="outline-none">
          {children}
          <AdminShopExtras />
        </main>
        <SiteFooter />
        <MobileSupportButton />
        <MiniPlayer />
        </PlayerProvider>
        <JsonLd data={orgLd(site.name, site.description, site.socials.filter((s) => s.verified).map((s) => s.url))} />
        <Analytics />
      </body>
    </html>
  );
}
