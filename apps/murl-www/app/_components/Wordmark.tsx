/**
 * mURL wordmark — echoes the mosADD lockup (green on the back half), JetBrains
 * Mono, wide tracking. `byline` shows the "by mosADD™" energizer next to it.
 */
export function Wordmark({
  size = 'base',
  byline = false,
}: {
  size?: 'sm' | 'base' | 'lg';
  byline?: boolean;
}) {
  const sizes: Record<string, string> = {
    sm: 'text-sm tracking-[0.18em]',
    base: 'text-base sm:text-lg tracking-[0.2em]',
    lg: 'text-3xl sm:text-4xl tracking-[0.14em]',
  };
  return (
    <span className="inline-flex items-baseline gap-2">
      <span className={`font-bold leading-none text-foreground ${sizes[size]}`}>
        m<span className="text-primary">URL</span>
      </span>
      {byline ? (
        <span className="text-[0.62em] font-medium uppercase tracking-[0.22em] text-muted-foreground">
          by <span className="font-bold tracking-[0.1em] text-foreground/80">mos<span className="text-primary">ADD</span></span>
          <span className="align-super text-[0.7em] text-primary">™</span>
        </span>
      ) : null}
    </span>
  );
}
