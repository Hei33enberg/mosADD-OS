import type { Metadata } from 'next';
import { Prose, H1, Lead, P, Anchor } from '../_components/Prose';

export const metadata: Metadata = {
  title: 'Changelog',
  description: 'Every mosadd-os release, sourced from GitHub Releases.',
};

export const revalidate = 300;

type Release = {
  tag_name: string;
  name: string;
  body: string;
  published_at: string;
  html_url: string;
  prerelease: boolean;
};

async function fetchReleases(): Promise<Release[]> {
  try {
    const res = await fetch('https://api.github.com/repos/Hei33enberg/mosadd-os/releases?per_page=30', {
      headers: { Accept: 'application/vnd.github+json' },
      next: { revalidate: 300 },
    });
    if (!res.ok) return [];
    return (await res.json()) as Release[];
  } catch {
    return [];
  }
}

// Minimal markdown → HTML for the release body. Avoids pulling in a full MD lib.
function renderBody(md: string) {
  const lines = md.split('\n');
  const out: string[] = [];
  let inCode = false;

  for (const raw of lines) {
    const line = raw.replace(/\r$/, '');
    if (line.trim().startsWith('```')) {
      out.push(inCode ? '</code></pre>' : '<pre class="bg-neutral-900/70 border border-neutral-800 rounded p-3 overflow-x-auto text-xs font-mono my-3"><code>');
      inCode = !inCode;
      continue;
    }
    if (inCode) {
      out.push(line.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;'));
      out.push('\n');
      continue;
    }
    if (/^### /.test(line)) out.push(`<h4 class="font-display text-sm font-semibold mt-4 mb-1 text-neutral-100">${line.slice(4)}</h4>`);
    else if (/^## /.test(line)) out.push(`<h3 class="font-display text-base font-semibold mt-5 mb-2 text-neutral-100">${line.slice(3)}</h3>`);
    else if (/^# /.test(line)) out.push(`<h2 class="font-display text-lg font-semibold mt-5 mb-2 text-neutral-100">${line.slice(2)}</h2>`);
    else if (/^[-*] /.test(line)) out.push(`<li class="text-neutral-300 ml-5 list-disc marker:text-neutral-600">${inlineFormat(line.replace(/^[-*] /, ''))}</li>`);
    else if (line.trim() === '') out.push('<br />');
    else out.push(`<p class="text-neutral-300 my-2 leading-relaxed">${inlineFormat(line)}</p>`);
  }
  return out.join('');
}

function inlineFormat(s: string) {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/`([^`]+)`/g, '<code class="font-mono text-radar-green text-[0.9em] px-1 rounded bg-neutral-900 border border-neutral-800">$1</code>')
    .replace(/\*\*([^*]+)\*\*/g, '<strong class="text-neutral-100">$1</strong>')
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noreferrer" class="text-radar-green hover:underline">$1</a>');
}

export default async function ChangelogPage() {
  const releases = await fetchReleases();

  return (
    <div className="max-w-3xl mx-auto px-6 py-14">
      <Prose>
        <H1>Changelog</H1>
        <Lead>Every mosadd-os release, sourced from <Anchor href="https://github.com/Hei33enberg/mosadd-os/releases">GitHub Releases</Anchor>.</Lead>

        {releases.length === 0 ? (
          <P>
            Couldn't reach the GitHub API right now. Browse{' '}
            <Anchor href="https://github.com/Hei33enberg/mosadd-os/releases">releases on GitHub ↗</Anchor>.
          </P>
        ) : null}
      </Prose>

      <div className="space-y-8 mt-10">
        {releases.map((r) => (
          <article key={r.tag_name} className="border-l-2 border-neutral-800 pl-6 hover:border-radar-green/60 transition">
            <div className="flex items-baseline gap-3 mb-2 flex-wrap">
              <a
                href={r.html_url}
                target="_blank"
                rel="noreferrer"
                className="font-display text-2xl text-neutral-100 hover:text-radar-green transition"
              >
                {r.name || r.tag_name}
              </a>
              {r.prerelease ? (
                <span className="text-[10px] font-mono uppercase tracking-widest px-2 py-0.5 rounded border border-amber-500/40 text-amber-400">
                  pre-release
                </span>
              ) : null}
              <span className="text-xs text-neutral-500">
                {new Date(r.published_at).toLocaleDateString('en-US', { dateStyle: 'long' })}
              </span>
            </div>
            <div
              className="text-sm"
              dangerouslySetInnerHTML={{ __html: renderBody(r.body || '_No release notes._') }}
            />
          </article>
        ))}
      </div>
    </div>
  );
}
