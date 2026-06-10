import type { ReactNode, HTMLAttributes } from 'react';
import { CopyButton } from './CopyButton';

export function Prose({ children, className = '' }: { children: ReactNode; className?: string }) {
  return (
    <article className={`mx-auto max-w-3xl text-muted-foreground leading-relaxed ${className}`}>
      {children}
    </article>
  );
}

export function H1({ children }: { children: ReactNode }) {
  return (
    <h1 className="font-display text-4xl md:text-5xl font-semibold tracking-tight text-foreground mb-3 mt-2">
      {children}
    </h1>
  );
}

export function Lead({ children }: { children: ReactNode }) {
  return <p className="text-lg text-muted-foreground mb-10 leading-relaxed">{children}</p>;
}

export function H2({ children, id }: { children: ReactNode; id?: string }) {
  return (
    <h2
      id={id}
      className="font-display text-2xl font-semibold text-foreground mt-12 mb-4 scroll-mt-24"
    >
      {children}
    </h2>
  );
}

export function H3({ children, id }: { children: ReactNode; id?: string }) {
  return (
    <h3
      id={id}
      className="font-display text-lg font-semibold text-foreground mt-8 mb-3 scroll-mt-24"
    >
      {children}
    </h3>
  );
}

export function P({ children }: { children: ReactNode }) {
  return <p className="text-muted-foreground mb-4 leading-relaxed">{children}</p>;
}

export function Ul({ children }: { children: ReactNode }) {
  return <ul className="list-disc pl-6 mb-4 space-y-1.5 text-muted-foreground marker:text-muted-foreground/40">{children}</ul>;
}

export function Ol({ children }: { children: ReactNode }) {
  return <ol className="list-decimal pl-6 mb-4 space-y-1.5 text-muted-foreground marker:text-muted-foreground/40">{children}</ol>;
}

export function InlineCode({ children }: { children: ReactNode }) {
  return (
    <code className="font-mono text-[0.9em] px-1.5 py-0.5 rounded-none bg-card border border-border text-primary">
      {children}
    </code>
  );
}

export function Pre({ children, lang }: { children: ReactNode; lang?: string }) {
  const copyText = typeof children === 'string' ? children : '';
  return (
    <div className="my-5 overflow-hidden rounded-none border border-border bg-card">
      <div className="flex items-center justify-between border-b border-border bg-background/50 px-4 py-1.5">
        <span className="text-[10px] uppercase tracking-widest text-muted-foreground">{lang ?? 'code'}</span>
        {copyText ? <CopyButton text={copyText} /> : null}
      </div>
      <pre className="overflow-x-auto p-4 text-sm leading-relaxed text-foreground">
        <code>{children}</code>
      </pre>
    </div>
  );
}

export function Callout({
  type = 'info',
  children,
  id,
}: {
  type?: 'info' | 'warn' | 'success';
  children: ReactNode;
  id?: string;
}) {
  const styles: Record<string, string> = {
    info: 'border-blue-500/30 bg-blue-500/5 text-blue-200',
    warn: 'border-amber-500/30 bg-amber-500/5 text-amber-200',
    success: 'border-primary/30 bg-primary/5 text-primary',
  };
  return (
    <div id={id} className={`my-5 p-4 border-l-2 rounded-none scroll-mt-24 ${styles[type]}`}>{children}</div>
  );
}

export function Table({
  headers,
  rows,
}: {
  headers: string[];
  rows: (ReactNode | string)[][];
}) {
  return (
    <div className="my-5 overflow-x-auto border border-border rounded-none">
      <table className="w-full text-sm">
        <thead className="bg-card/50 border-b border-border">
          <tr>
            {headers.map((h) => (
              <th key={h} className="text-left px-4 py-2 font-mono text-xs uppercase tracking-widest text-muted-foreground">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => (
            <tr key={i} className="border-b border-border/60 last:border-0">
              {r.map((cell, j) => (
                <td key={j} className="px-4 py-2 text-muted-foreground align-top">
                  {cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function Anchor(props: HTMLAttributes<HTMLAnchorElement> & { href: string }) {
  const isExternal = props.href.startsWith('http');
  return (
    <a
      {...props}
      className={`text-primary hover:underline ${props.className ?? ''}`}
      target={isExternal ? '_blank' : undefined}
      rel={isExternal ? 'noreferrer' : undefined}
    />
  );
}
