/**
 * Analytics-ready, nothing enabled. Set NEXT_PUBLIC_ANALYTICS_PROVIDER=plausible|umami (plus
 * NEXT_PUBLIC_ANALYTICS_DOMAIN / NEXT_PUBLIC_UMAMI_ID) to load a privacy-friendly script.
 * Until then track() is a no-op that only logs in development.
 */
type Props = Record<string, string | number | boolean | undefined>;
declare global {
  interface Window {
    plausible?: (event: string, opts?: { props?: Props }) => void;
    umami?: { track: (event: string, props?: Props) => void };
  }
}

export const analyticsProvider = () => process.env.NEXT_PUBLIC_ANALYTICS_PROVIDER as "plausible" | "umami" | undefined;

export function track(event: string, props?: Props) {
  if (typeof window === "undefined") return;
  const p = analyticsProvider();
  if (p === "plausible") window.plausible?.(event, { props });
  else if (p === "umami") window.umami?.track(event, props);
  else if (process.env.NODE_ENV === "development") console.debug("[analytics:off]", event, props ?? {});
}
