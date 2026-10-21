export const PlayIcon = ({ className = "h-4 w-4" }: { className?: string }) => (
  <svg viewBox="0 0 24 24" className={`${className} fill-current`} aria-hidden="true"><path d="M8 5v14l11-7z" /></svg>
);
export const PauseIcon = ({ className = "h-4 w-4" }: { className?: string }) => (
  <svg viewBox="0 0 24 24" className={`${className} fill-current`} aria-hidden="true"><path d="M6 5h4v14H6zM14 5h4v14h-4z" /></svg>
);
export const PrevIcon = ({ className = "h-4 w-4" }: { className?: string }) => (
  <svg viewBox="0 0 24 24" className={`${className} fill-current`} aria-hidden="true"><path d="M6 5h2v14H6zM20 5v14L9 12z" /></svg>
);
export const NextIcon = ({ className = "h-4 w-4" }: { className?: string }) => (
  <svg viewBox="0 0 24 24" className={`${className} fill-current`} aria-hidden="true"><path d="M16 5h2v14h-2zM4 5v14l11-7z" /></svg>
);
/** Three animated bars for the playing row (static under reduced motion). */
export const EqIcon = () => (
  <span aria-hidden="true" className="tl-eq inline-flex h-3.5 items-end gap-[2px]">
    <i /><i /><i />
  </span>
);
