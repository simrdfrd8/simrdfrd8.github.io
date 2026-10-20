"use client";

import { useEffect, useRef, useState } from "react";
import { formatDuration } from "@/lib/format";

/**
 * Full-length beat player: native <audio preload="none"> (nothing downloads until play, never autoplays)
 * with a static waveform from the committed peaks JSON. Click/keys on the waveform seek.
 */
export function BeatPlayer({ src, title, peaks, durationSec }: { src: string; title: string; peaks: number[]; durationSec?: number }) {
  const audio = useRef<HTMLAudioElement>(null);
  const [playing, setPlaying] = useState(false);
  const [t, setT] = useState(0);
  const [dur, setDur] = useState(durationSec ?? 0);
  useEffect(() => {
    const a = audio.current;
    if (!a) return;
    const on = () => setT(a.currentTime);
    const meta = () => setDur(a.duration || durationSec || 0);
    const end = () => setPlaying(false);
    a.addEventListener("timeupdate", on);
    a.addEventListener("loadedmetadata", meta);
    a.addEventListener("ended", end);
    a.addEventListener("pause", end);
    a.addEventListener("play", () => setPlaying(true));
    return () => { a.removeEventListener("timeupdate", on); a.removeEventListener("loadedmetadata", meta); a.removeEventListener("ended", end); a.removeEventListener("pause", end); };
  }, [durationSec]);
  const toggle = () => {
    const a = audio.current;
    if (!a) return;
    if (a.paused) {
      document.querySelectorAll<HTMLAudioElement>("audio[data-beat]").forEach((o) => o !== a && o.pause());
      void a.play();
    } else a.pause();
  };
  const seek = (frac: number) => {
    const a = audio.current;
    if (!a || !dur) return;
    a.currentTime = Math.max(0, Math.min(dur, frac * dur));
    setT(a.currentTime);
  };
  const progress = dur ? t / dur : 0;
  const bars = 64;
  const step = Math.max(1, Math.floor(peaks.length / bars));
  const levels = Array.from({ length: bars }, (_, i) => Math.max(...peaks.slice(i * step, (i + 1) * step), 0.02));
  const max = Math.max(...levels, 0.01);
  return (
    <div className="flex items-center gap-3 rounded-xl bg-raised p-3 ring-1 ring-line" data-beat-player>
      <audio ref={audio} src={src} preload="none" data-beat />
      <button type="button" onClick={toggle} aria-label={`${playing ? "Pause" : "Play"} ${title}`} aria-pressed={playing} className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-cream text-ink transition hover:bg-white">
        {playing ? (
          <svg viewBox="0 0 24 24" className="h-5 w-5 fill-current" aria-hidden="true"><path d="M6 5h4v14H6zM14 5h4v14h-4z" /></svg>
        ) : (
          <svg viewBox="0 0 24 24" className="h-5 w-5 fill-current" aria-hidden="true"><path d="M8 5v14l11-7z" /></svg>
        )}
      </button>
      <div
        role="slider"
        tabIndex={0}
        aria-label={`Seek ${title}`}
        aria-valuemin={0}
        aria-valuemax={Math.round(dur)}
        aria-valuenow={Math.round(t)}
        aria-valuetext={`${formatDuration(t) ?? "0:00"} of ${formatDuration(dur) ?? ""}`}
        onClick={(e) => { const r = e.currentTarget.getBoundingClientRect(); seek((e.clientX - r.left) / r.width); }}
        onKeyDown={(e) => { if (e.key === "ArrowRight") seek(progress + 0.05); if (e.key === "ArrowLeft") seek(progress - 0.05); }}
        className="h-11 min-w-0 flex-1 cursor-pointer"
      >
        <svg viewBox={`0 0 ${bars * 3} 100`} preserveAspectRatio="none" className="h-full w-full" aria-hidden="true">
          {levels.map((v, i) => {
            const h = Math.max(8, (v / max) * 100);
            return <rect key={i} x={i * 3} y={(100 - h) / 2} width={2} height={h} rx={1} className={i / bars <= progress && progress > 0 ? "fill-[var(--accent,#FF7A59)]" : "fill-cream/35"} />;
          })}
        </svg>
      </div>
      <span className="kicker w-12 shrink-0 text-right text-muted">{formatDuration(playing || t ? t : dur) ?? ""}</span>
    </div>
  );
}
