import Script from "next/script";
import { analyticsProvider } from "@/lib/analytics";

export function Analytics() {
  const provider = analyticsProvider();
  if (provider === "plausible" && process.env.NEXT_PUBLIC_ANALYTICS_DOMAIN)
    return <Script defer data-domain={process.env.NEXT_PUBLIC_ANALYTICS_DOMAIN} src="https://plausible.io/js/script.js" strategy="afterInteractive" />;
  if (provider === "umami" && process.env.NEXT_PUBLIC_UMAMI_ID)
    return <Script defer data-website-id={process.env.NEXT_PUBLIC_UMAMI_ID} src="https://cloud.umami.is/script.js" strategy="afterInteractive" />;
  return null;
}
