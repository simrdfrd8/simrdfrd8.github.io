
/** Brandy's nav: Home · Artists · Music · Shop · Contact (the wordmark is Home; Support stays one tap away). */
export const primaryNav = [
  { label: "Artists", href: "/artists" },
  { label: "Music", href: "/music" },
  { label: "Shop", href: "/shop" },
  { label: "Contact", href: "/contact" },
] as const;

export const secondaryNav = [
  { label: "Art & Video", href: "/art" },
  { label: "Video", href: "/video" },
  { label: "Services", href: "/services" },
  { label: "Licensing", href: "/licensing" },
  { label: "Support", href: "/support" },
] as const;

/**
 * Footer "Friends" row, shared by every page (ported from Brandy's preview/friends.js).
 * Internal links point at the homepage artist cards. External links are verified URLs only and open in a new tab.
 * An unverified link can be added as { label, placeholder: true } and renders as a grey "[link]".
 */
export type Friend = { name: string; shade: "hiphop" | "edm" | "prod" | null; href: string | null; links: { label: string; url?: string; placeholder?: boolean }[] };
export const FRIENDS: Friend[] = [
  { name: "Dan Perales", shade: "hiphop", href: "/#dan-perales", links: [{ label: "Spotify", url: "https://open.spotify.com/artist/7d0UBhFGUmCcg19sesZtEx" }] },
  {
    name: "Andrew Bigs",
    shade: "hiphop",
    href: "/#andrew-bigs",
    links: [
      { label: "Spotify", url: "https://open.spotify.com/artist/53hggKXepZN14WR83U8g2T" },
      { label: "SoundCloud", url: "https://soundcloud.com/heisandrewbigs" },
      { label: "Website", url: "https://www.andrewbigs.com/bigs" },
      { label: "Instagram", url: "https://www.instagram.com/heisandrewbigs/" },
    ],
  },
  { name: "Flavorful Croissants", shade: "prod", href: "/#flavorful-croissants", links: [] },
  {
    name: "James Eagle",
    shade: null,
    href: null,
    links: [
      { label: "Spotify", url: "https://open.spotify.com/artist/3wwS8vlx9xmeH9fRrVjAgc" },
      { label: "Instagram", url: "https://www.instagram.com/jamesb0p/" },
    ],
  },
];
