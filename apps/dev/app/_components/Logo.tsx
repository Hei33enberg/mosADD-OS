/**
 * Brand wordmark lockup — per the mosadd brand book.
 * Text-only `mosadd™`, JetBrains Mono, wide tracking, ™ in primary green
 * superscript. Never paired with an icon. The wordmark stands alone.
 */
export function Logo({
  size = 'base',
  suffix,
}: {
  size?: 'sm' | 'base' | 'lg';
  suffix?: string;
}) {
  const sizes: Record<string, string> = {
    sm: 'text-xs tracking-[0.2em]',
    base: 'text-base sm:text-lg tracking-[0.25em]',
    lg: 'text-2xl sm:text-3xl tracking-[0.18em]',
  };
  return (
    <span className={`font-bold leading-none text-foreground ${sizes[size]}`}>
      mos<span className="text-primary">ADD</span>
      {suffix ? (
        <span className="ml-1.5 align-middle text-[0.6em] font-medium uppercase tracking-[0.3em] text-muted-foreground">
          {suffix}
        </span>
      ) : null}
      <span className="align-super ml-0.5 text-[0.55em] font-bold text-primary">™</span>
    </span>
  );
}
