import Link from 'next/link';
import { InstallCTA } from './_components/InstallCTA';

export default function NotFound() {
  return (
    <div className="mx-auto flex max-w-3xl flex-col items-start px-6 py-24">
      <div className="text-xs uppercase tracking-[0.25em] text-primary/80">404</div>
      <h1 className="font-display mt-2 text-4xl font-bold text-foreground md:text-5xl">
        No room here.
      </h1>
      <p className="mt-4 max-w-md text-sm leading-relaxed text-muted-foreground">
        That’s not a valid website address. mURL rooms live at{' '}
        <span className="font-mono text-foreground">/your-favourite-site.com</span> — or just add the
        extension and a room appears on every site you open.
      </p>
      <div className="mt-8 flex flex-wrap gap-3">
        <InstallCTA />
        <Link href="/" className="rounded-none border border-border px-5 py-3 text-foreground transition-colors hover:border-primary/50">
          Back to home
        </Link>
      </div>
    </div>
  );
}
