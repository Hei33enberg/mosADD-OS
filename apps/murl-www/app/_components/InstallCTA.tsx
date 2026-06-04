import { CHROME_STORE_URL, INSTALL_LABEL } from '../../lib/site';

/** Primary install button (Add to Chrome). `variant` controls fill vs outline. */
export function InstallCTA({
  variant = 'primary',
  label,
  className = '',
}: {
  variant?: 'primary' | 'outline';
  label?: string;
  className?: string;
}) {
  const base = 'inline-flex items-center gap-2 rounded-none px-5 py-3 font-medium transition-colors';
  const styles =
    variant === 'primary'
      ? 'bg-primary text-primary-foreground hover:bg-primary/90'
      : 'border border-border text-foreground hover:border-primary/50';
  return (
    <a href={CHROME_STORE_URL} target="_blank" rel="noreferrer" className={`${base} ${styles} ${className}`}>
      {label ?? INSTALL_LABEL} →
    </a>
  );
}
