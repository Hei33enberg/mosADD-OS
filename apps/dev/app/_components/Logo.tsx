/**
 * Brand wordmark lockup — per m0ssad-3 BRANDBOOK.md.
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
      <span className="align-super ml-0.5 text-[0.55em] font-bold text-primary">™</span>
      {suffix ? (
        <span className="ml-2 align-middle text-[0.5em] font-medium uppercase tracking-[0.3em] text-muted-foreground">
          {suffix}
        </span>
      ) : null}
    </span>
  );
}
