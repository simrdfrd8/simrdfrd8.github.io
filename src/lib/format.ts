export const platformLabel = (p: string) =>
  ({ instagram: "Instagram", soundcloud: "SoundCloud", spotify: "Spotify", "apple-music": "Apple Music", youtube: "YouTube", tiktok: "TikTok", bandcamp: "Bandcamp", kofi: "Ko-fi", website: "Website", email: "Email" })[p] ?? p;

export const formatDuration = (sec?: number) => {
  if (!sec && sec !== 0) return "";
  const s = Math.round(sec);
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
};

export const yearOf = (d?: string) => (d ? d.slice(0, 4) : "");
