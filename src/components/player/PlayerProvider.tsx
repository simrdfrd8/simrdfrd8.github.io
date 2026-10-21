"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";

/** One track the global player can play (our own MP3s only; third-party embeds keep their own players). */
export type PlayerTrack = { id: string; title: string; src: string; subtitle?: string; durationSec?: number };

type PlayerState = {
  queue: PlayerTrack[];
  queueId: string | null;
  index: number;
  current: PlayerTrack | null;
  playing: boolean;
  /** Start (or toggle) `tracks[index]` and make `tracks` the queue; plays on down the list. */
  play: (tracks: PlayerTrack[], index: number, queueId: string) => void;
  toggle: () => void;
  next: () => void;
  prev: () => void;
  seek: (sec: number) => void;
  close: () => void;
};
type TimeState = { time: number; duration: number };

const Ctx = createContext<PlayerState | null>(null);
const TimeCtx = createContext<TimeState>({ time: 0, duration: 0 });

export const usePlayer = () => {
  const c = useContext(Ctx);
  if (!c) throw new Error("usePlayer needs <PlayerProvider>");
  return c;
};
export const usePlayerTime = () => useContext(TimeCtx);

/**
 * Global audio player: a single <audio preload="none"> mounted in the root layout, so playback survives client-side
 * route changes. Nothing downloads until the visitor presses play; it never autoplays.
 */
export function PlayerProvider({ children }: { children: ReactNode }) {
  const audio = useRef<HTMLAudioElement | null>(null);
  const [queue, setQueue] = useState<PlayerTrack[]>([]);
  const [queueId, setQueueId] = useState<string | null>(null);
  const [index, setIndex] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [time, setTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const current = queue[index] ?? null;

  const load = useCallback((t: PlayerTrack) => {
    const a = audio.current;
    if (!a) return;
    if (a.getAttribute("src") !== t.src) {
      a.src = t.src;
      setTime(0);
      setDuration(t.durationSec ?? 0);
    }
    void a.play().catch(() => setPlaying(false));
  }, []);

  const play = useCallback(
    (tracks: PlayerTrack[], i: number, id: string) => {
      const a = audio.current;
      const t = tracks[i];
      if (!a || !t) return;
      if (current?.src === t.src) {
        if (a.paused) void a.play();
        else a.pause();
        setQueue(tracks);
        setQueueId(id);
        setIndex(i);
        return;
      }
      // pause any legacy inline players
      document.querySelectorAll<HTMLAudioElement>("audio:not([data-global-player])").forEach((o) => o.pause());
      setQueue(tracks);
      setQueueId(id);
      setIndex(i);
      load(t);
    },
    [current, load],
  );
  const go = useCallback(
    (d: number) => {
      if (!queue.length) return;
      const i = index + d;
      if (i < 0 || i >= queue.length) return;
      setIndex(i);
      load(queue[i]);
    },
    [queue, index, load],
  );
  const toggle = useCallback(() => {
    const a = audio.current;
    if (!a || !current) return;
    if (a.paused) void a.play();
    else a.pause();
  }, [current]);
  const seek = useCallback((sec: number) => {
    const a = audio.current;
    if (!a) return;
    const d = a.duration || duration;
    a.currentTime = Math.max(0, Math.min(d || 0, sec));
    setTime(a.currentTime);
  }, [duration]);
  const close = useCallback(() => {
    const a = audio.current;
    if (a) {
      a.pause();
      a.removeAttribute("src");
      a.load();
    }
    setQueue([]);
    setQueueId(null);
    setIndex(0);
    setTime(0);
  }, []);

  useEffect(() => {
    const a = audio.current;
    if (!a) return;
    const onTime = () => setTime(a.currentTime);
    const onMeta = () => setDuration(a.duration || 0);
    const onPlay = () => setPlaying(true);
    const onPause = () => setPlaying(false);
    a.addEventListener("timeupdate", onTime);
    a.addEventListener("loadedmetadata", onMeta);
    a.addEventListener("play", onPlay);
    a.addEventListener("pause", onPause);
    return () => {
      a.removeEventListener("timeupdate", onTime);
      a.removeEventListener("loadedmetadata", onMeta);
      a.removeEventListener("play", onPlay);
      a.removeEventListener("pause", onPause);
    };
  }, []);
  // play on down the list
  useEffect(() => {
    const a = audio.current;
    if (!a) return;
    const onEnd = () => {
      if (index + 1 < queue.length) {
        setIndex(index + 1);
        load(queue[index + 1]);
      } else setPlaying(false);
    };
    a.addEventListener("ended", onEnd);
    return () => a.removeEventListener("ended", onEnd);
  }, [queue, index, load]);
  // Media Session (lock screen / hardware keys)
  useEffect(() => {
    if (!current || !("mediaSession" in navigator)) return;
    navigator.mediaSession.metadata = new MediaMetadata({ title: current.title, artist: current.subtitle ?? "Flavorful Croissants" });
    navigator.mediaSession.setActionHandler("previoustrack", () => go(-1));
    navigator.mediaSession.setActionHandler("nexttrack", () => go(1));
  }, [current, go]);
  // reserve room at the bottom of the page while the mini-player is open
  useEffect(() => {
    document.documentElement.toggleAttribute("data-player-open", !!current);
  }, [current]);

  const value = useMemo<PlayerState>(
    () => ({ queue, queueId, index, current, playing, play, toggle, next: () => go(1), prev: () => go(-1), seek, close }),
    [queue, queueId, index, current, playing, play, toggle, go, seek, close],
  );
  const timeValue = useMemo(() => ({ time, duration: duration || current?.durationSec || 0 }), [time, duration, current]);
  return (
    <Ctx.Provider value={value}>
      <TimeCtx.Provider value={timeValue}>
        {children}
        <audio ref={audio} preload="none" data-global-player data-beat />
      </TimeCtx.Provider>
    </Ctx.Provider>
  );
}
