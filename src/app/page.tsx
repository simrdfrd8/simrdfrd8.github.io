import Image from "next/image";
import Link from "next/link";
import { brandLogo } from "@/lib/brand-assets";
import { catalog, getTracks, listedArtists, CATEGORIES } from "@/lib/catalog";
import { TrackCard } from "@/components/TrackCard";
import { ButtonLink, Arrow, Rail, Section, TriangleMark } from "@/components/ui";
import { BrandButton, BrandSection, ShadeBar } from "@/components/brand/BrandButton";
import { HomeArtistCard } from "@/components/brand/HomeArtistCard";
import { platformLabel } from "@/lib/format";

/** Homepage: ported from Brandy's preview/index.html; wording from flavorful-music-homepage-copy.md (draft v5). */
const SHADES = {
  "hip-hop": { line: "Honest bars from friends on the mic.", links: [{ label: "Listen", href: "/music#fc-x-720m" }] },
  edm: { line: "Dark, sharp, built for the floor.", links: [{ label: "Listen", href: "/artists/not-daf" }] },
  production: {
    line: "Beats for DJs and rappers, plus sample packs.",
    links: [
      { label: "Listen", href: "/music#buy-beats" },
      { label: "Sample packs", href: "/shop?lane=producer#lanes" },
    ],
  },
} as const;

export default function Home() {
  const heroMark = brandLogo("cream");
  const tracks = getTracks().filter((t) => t.featured && t.kind === "track").slice(0, 4);
  const artists = listedArtists();
  const { site } = catalog;
  const follow = site.socials.filter((s) => s.verified);

  return (
    <>
      {/* 1. Hero */}
      <header className="relative px-5 pt-14 pb-16 sm:px-8 md:pt-[120px] md:pb-24">
        <div className="mx-auto grid max-w-[1120px] items-center gap-10 md:grid-cols-[1.35fr_1fr]">
          <div className="animate-rise">
            <ShadeBar className="mb-9" />
            <h1 className="brand-h text-[clamp(3.1rem,11vw,76px)] tracking-[2px]">
              Make art
              <br />
              with friends.
            </h1>
            <p className="mt-7 mb-9 max-w-[720px] text-lg text-[#DAD3E0] md:text-xl">
              Flavorful Music is a San Diego artist collective disguised as a record label: <span className="hl-edm">EDM</span>, <span className="hl-hh">hip-hop</span> and <span className="hl-prod">production</span>. Made together, owned end to end.
            </p>
            <div className="flex flex-wrap gap-3.5">
              <BrandButton href="/music">Listen</BrandButton>
              <BrandButton href="/shop" variant="ghost">
                Shop
              </BrandButton>
            </div>
          </div>
          <div className="flex h-[260px] items-end justify-center md:h-[420px]" data-hero-mark>
            {heroMark ? (
              <Image src={heroMark} alt="Flavorful Music label mark: a winking croissant on a lightning triangle" width={489} height={473} unoptimized priority className="fm-bounce h-auto w-[240px] md:w-[380px]" />
            ) : (
              <TriangleMark className="fm-bounce mx-auto h-auto w-72" />
            )}
          </div>
        </div>
      </header>

      {/* 2. Manifesto */}
      <BrandSection id="about" eyebrow="About" title="Art & vibe." tone="surface">
        <div className="grid items-start gap-10 md:grid-cols-2 md:gap-14">
          <div className="space-y-[18px] text-lg text-cream-dim">
            <p>We&apos;re a crew of artists who&apos;d rather make things together than alone. Flavorful Music is where we do it: a label in name, a collective in practice.</p>
            <p>
              Our sound comes in three shades: <b className="hl-edm">EDM</b>, <b className="hl-hh">hip-hop</b> and <b className="hl-prod">production</b>.
            </p>
            <p>And we keep the whole thing in the family. The beat, the vocal, the mix, the cover art, and the shirt on your back all come from the same group of friends in San Diego.</p>
            <p className="text-cream">
              <b>Flavorful Music is a radical space for art &amp; community.</b>
            </p>
          </div>
          <blockquote className="space-y-1.5 border-l-[3px] border-line pl-5 text-xl text-[#E2DCE7] italic">
            <p>We thrive when we create &amp; share.</p>
            <p>We develop when we are challenged and safe.</p>
            <p>We believe art is the most valuable pursuit open to us as individuals.</p>
            <p>We live to create and share art.</p>
            <p>Audio is our chosen medium.</p>
          </blockquote>
        </div>
      </BrandSection>

      {/* 2b. Three shades */}
      <BrandSection id="shades" eyebrow="The sound" title="Three shades of Flavorful">
        <div className="grid gap-5 md:grid-cols-3">
          {CATEGORIES.map((c) => (
            <div key={c.id} className={`${c.shade} flex min-h-[230px] flex-col border-t-[6px] border-[var(--shade)] bg-[var(--shade-tint)] p-7 pt-8`} data-shade={c.id}>
              {brandLogo(c.id) && <Image src={brandLogo(c.id)!} alt="" width={489} height={473} unoptimized className="mb-3.5 h-auto w-[68px]" />}
              <h3 className="brand-h mb-2.5 text-[22px] tracking-[2px] text-[var(--shade-text)]">{c.label}</h3>
              <p className="flex-1">{SHADES[c.id].line}</p>
              <div className="mt-[18px] flex flex-wrap gap-2">
                {SHADES[c.id].links.map((l, i) => (
                  <Link key={l.href} href={l.href} className={i === 0 ? "bg-[var(--shade)] px-[18px] py-2.5 text-xs font-extrabold tracking-[2px] text-[var(--shade-on)] uppercase hover:brightness-110" : "border border-[var(--shade)] px-[18px] py-2.5 text-xs font-extrabold tracking-[2px] text-[var(--shade-text)] uppercase hover:bg-[var(--shade-tint)]"}>
                    {l.label}
                  </Link>
                ))}
              </div>
            </div>
          ))}
        </div>
      </BrandSection>

      {/* 3. Artists */}
      <BrandSection id="crew" eyebrow="Artists" title="The artists">
        <p className="mb-8 text-lg text-cream-dim">A small roster, made with friends. Five artists, three shades, one table.</p>
        <div className="grid gap-5 sm:grid-cols-2 md:grid-cols-6">
          {artists.map((a, i) => (
            <div key={a.slug} className={i < 3 ? "flex md:col-span-2 [&>*]:flex-1" : "flex md:col-span-3 [&>*]:flex-1"}>
              <HomeArtistCard artist={a} wide={i >= 3} />
            </div>
          ))}
        </div>
        <p className="mt-7 border border-line px-[22px] py-[18px] text-[15px] text-cream-dim">
          <b className="text-cream">Collabs</b> · 720M x Flavorful Croissants: &ldquo;FANNYPACK&rdquo;, &ldquo;Levis&rdquo; · 720M x James Eagle: &ldquo;Ambient Night&rdquo;
        </p>
      </BrandSection>

      {/* Latest (existing working section) */}
      {tracks.length > 0 && (
        <Section
          id="listen"
          kicker="Now playing · Flavorful Croissants"
          title="Fresh from the workshop"
          tone="raised"
          action={
            <ButtonLink href="/music" variant="secondary">
              All music <Arrow />
            </ButtonLink>
          }
        >
          <Rail>
            {tracks.map((t) => (
              <TrackCard key={t.id} track={t} />
            ))}
          </Rail>
        </Section>
      )}

      {/* 3b. Who runs it */}
      <BrandSection id="who" eyebrow="About" title="Who runs it" tone="surface">
        <div className="grid items-center gap-10 md:grid-cols-[1.2fr_1fr] md:gap-14">
          <div className="space-y-[18px] text-lg text-cream-dim">
            <p>
              Flavorful Music is run by two friends, <b className="text-cream">Ricky</b> and <b className="text-cream">Ookie</b>. Between them they cover audio and video, from the session and the mix to the shoot and the edit. Ricky&apos;s an engineer, and Ookie&apos;s a photographer. They both love art, and they do what they can to make as much of it as they can, with as many friends as they can.
            </p>
            <p className="text-[22px]">
              That&apos;s the whole idea behind the label. <b className="text-cream">Make art with friends.</b>
            </p>
          </div>
          <div className="grid grid-cols-2 gap-4">
            {[
              { name: "Ricky", slug: "ricky", note: "Engineer" },
              { name: "Ookie", slug: "ookie", note: "Photographer" },
            ].map((f) => (
              <Link key={f.slug} href={`/artists/${f.slug}`} className="group border-t-4 border-line bg-raised p-3.5 hover:border-logo">
                <span className="brand-art-stripes relative mb-3 flex h-[120px] items-end bg-[linear-gradient(160deg,#3C3741,#1B1620)] p-2.5 md:h-[170px]" aria-hidden="true">
                  <span className="brand-h text-4xl text-logo/30">{f.name[0]}</span>
                </span>
                <b className="block text-lg">{f.name}</b>
                <span className="text-xs tracking-[1px] text-muted uppercase">Runs the label · {f.note}</span>
              </Link>
            ))}
          </div>
        </div>
      </BrandSection>

      {/* 4–5. Shop: merch, beats, sample packs */}
      <BrandSection id="shop" eyebrow="Shop" title="Wear the crew. Make your own.">
        <div className="grid gap-5 lg:grid-cols-3">
          <div className="flex flex-col bg-raised p-7 md:p-8">
            <h3 className="brand-h mb-2.5 text-2xl tracking-[2px]">Merch</h3>
            <p className="flex-1 text-cream-dim">Every piece is designed in-house by the same people who make the music. Original art, made with friends.</p>
            <p className="mt-4 text-sm text-muted">Merch is coming.</p>
            <BrandButton href="/shop/merch" className="mt-5 self-start">
              Shop merch
            </BrandButton>
          </div>
          <div className="shade-prod flex flex-col border-t-4 border-prod bg-raised p-7 md:p-8" data-home-beats>
            <h3 className="brand-h mb-2.5 text-2xl tracking-[2px]">Beats</h3>
            <p className="flex-1 text-cream-dim">Beats for DJs and rappers from Flavorful Croissants. Press play, find your sound, then license it.</p>
            <p className="mt-4 text-sm text-muted">MP3 lease $10 · WAV $25 · Stems $50 · Exclusive rights $500</p>
            <div className="mt-5 flex flex-wrap gap-3">
              <BrandButton href="/music#buy-beats" variant="shade">
                Browse beats
              </BrandButton>
              <BrandButton href="/licensing" variant="shade-ghost">
                Licenses
              </BrandButton>
            </div>
          </div>
          <div className="shade-prod flex flex-col border-t-4 border-prod bg-raised p-7 md:p-8">
            <h3 className="brand-h mb-2.5 flex items-center gap-3 text-2xl tracking-[2px]">
              {brandLogo("production") && <Image src={brandLogo("production")!} alt="" width={489} height={473} unoptimized className="h-auto w-10 shrink-0" />}
              From our workshop to yours
            </h3>
            <p className="flex-1 text-cream-dim">Sounds from Flavorful Croissants, the crew&apos;s producer, packaged for producers who want to make art with their friends too.</p>
            <p className="mt-4 text-sm text-muted">Sample packs are on the way.</p>
            <BrandButton href="/contact/?type=business" variant="shade-ghost" className="mt-5 self-start">
              Get notified
            </BrandButton>
          </div>
        </div>
      </BrandSection>

      {/* 6. Contact */}
      <BrandSection id="contact" eyebrow="Contact" title="Let's make something" tone="surface">
        <p className="text-lg text-cream-dim">Booking, features, collabs, press, or just saying hi.</p>
        <p className="mt-4 text-lg">
          <span className="text-muted">Business inquiries: </span>
          <a href={`mailto:${site.email}`} className="underline underline-offset-4 hover:text-hiphop">
            {site.email}
          </a>
        </p>
        <p className="mt-2 text-lg">
          <span className="text-muted">Follow: </span>
          {follow.map((s, i) => (
            <span key={s.url}>
              {i > 0 && <span className="text-muted"> · </span>}
              <a href={s.url} target="_blank" rel="noopener noreferrer" className="underline underline-offset-4 hover:text-hiphop">
                {s.platform === "instagram" ? `Instagram ${s.label ?? ""}`.trim() : platformLabel(s.platform)}
              </a>
            </span>
          ))}
        </p>
        <div className="mt-8">
          <BrandButton href="/contact">Get in touch</BrandButton>
        </div>
      </BrandSection>
    </>
  );
}
