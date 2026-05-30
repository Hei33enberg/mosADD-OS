import type { Metadata } from 'next';
import { Prose, H1, Lead, H2, H3, P, Ul, Pre, Anchor, Table } from '../_components/Prose';

export const metadata: Metadata = {
  title: 'Download',
  description: 'GitHub Release tarballs, SBOMs and install snippets for mosadd OSS.',
};

// Revalidate every 5 minutes — pulls from GitHub Releases API at build/ISR.
export const revalidate = 300;

type Asset = {
  name: string;
  browser_download_url: string;
  size: number;
};

type Release = {
  tag_name: string;
  name: string;
  body: string;
  published_at: string;
  html_url: string;
  assets: Asset[];
};

async function fetchLatestRelease(): Promise<Release | null> {
  try {
    const res = await fetch('https://api.github.com/repos/Hei33enberg/mosadd-os/releases/latest', {
      headers: { Accept: 'application/vnd.github+json' },
      next: { revalidate: 300 },
    });
    if (!res.ok) return null;
    return (await res.json()) as Release;
  } catch {
    return null;
  }
}

function formatSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(2)} MB`;
}

export default async function DownloadPage() {
  const release = await fetchLatestRelease();

  return (
    <div className="max-w-3xl mx-auto px-6 py-14">
      <Prose>
        <H1>Download</H1>
        <Lead>
          mosadd OSS is distributed as <strong>GitHub Releases</strong> with signed tarballs + SBOMs.
          npm publish lands when the <code className="font-mono text-radar-green">@m0ssad</code> org is provisioned.
        </Lead>

        <H2>Install in Claude Code (recommended)</H2>
        <Pre lang="bash">{`# 1) Clone or download the tarball
git clone https://github.com/Hei33enberg/mosadd-os.git
cd mosadd-os
pnpm install && pnpm build

# 2) Register the MCP server with Claude Code
claude mcp add mosadd node -- $(pwd)/packages/mcp/dist/bin/m0ssad-mcp.js`}</Pre>

        <H2>Install from a release tarball</H2>
        {release ? (
          <>
            <P>
              Latest: <strong>{release.tag_name}</strong> · published{' '}
              {new Date(release.published_at).toLocaleDateString('en-US', { dateStyle: 'medium' })} ·{' '}
              <Anchor href={release.html_url}>release notes ↗</Anchor>
            </P>
            <Table
              headers={['Asset', 'Size', '']}
              rows={release.assets
                .filter((a) => !a.name.endsWith('.spdx.json'))
                .map((a) => [
                  <code key={a.name} className="font-mono text-radar-green text-xs">{a.name}</code>,
                  formatSize(a.size),
                  <a
                    key={`${a.name}-link`}
                    href={a.browser_download_url}
                    className="text-radar-green hover:underline text-sm"
                  >
                    Download →
                  </a>,
                ])}
            />
            <H3>Supply-chain artifacts (SBOMs)</H3>
            <Table
              headers={['SBOM', 'Size', '']}
              rows={release.assets
                .filter((a) => a.name.endsWith('.spdx.json'))
                .map((a) => [
                  <code key={a.name} className="font-mono text-xs">{a.name}</code>,
                  formatSize(a.size),
                  <a
                    key={`${a.name}-link`}
                    href={a.browser_download_url}
                    className="text-radar-green hover:underline text-sm"
                  >
                    Download →
                  </a>,
                ])}
            />
          </>
        ) : (
          <P>
            Could not fetch the latest release from GitHub right now. Browse all releases on{' '}
            <Anchor href="https://github.com/Hei33enberg/mosadd-os/releases">GitHub ↗</Anchor>.
          </P>
        )}

        <H2>Manual install from tarball</H2>
        <Pre lang="bash">{`# Install a specific tarball locally
npm install ./m0ssad-mcp-3.0.0-alpha.0.tgz

# Then run
npx @m0ssad/mcp`}</Pre>

        <H2>Docker (Phase 2)</H2>
        <P>Container images will be published to GHCR once the hosted MCP service lands:</P>
        <Pre lang="bash">{`docker run -p 3000:3000 \\
  -e M0SSAD_SUPABASE_URL=... \\
  ghcr.io/hei33enberg/mosadd-mcp:latest`}</Pre>

        <H2>Verify a download</H2>
        <P>
          Each tarball is shipped alongside a sigstore signature (Phase 2: cosign verification workflow).
          For now, verify by hash against the GitHub release page:
        </P>
        <Pre lang="bash">{`# Compute SHA-256 of the downloaded asset
shasum -a 256 m0ssad-mcp-3.0.0-alpha.0.tgz

# Compare to the value shown on the release page`}</Pre>

        <Ul>
          <li><Anchor href="https://github.com/Hei33enberg/mosadd-os/releases">All releases ↗</Anchor></li>
          <li><Anchor href="/docs/quickstart">Quickstart</Anchor></li>
          <li><Anchor href="/docs/security">Security policy</Anchor></li>
        </Ul>
      </Prose>
    </div>
  );
}
