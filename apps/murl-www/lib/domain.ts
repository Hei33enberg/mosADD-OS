// Server-side domain normalization — mirror of the extension's lib/domain.ts.
// eTLD+1, strips www/m/mobile/amp, handles a shortlist of multi-part TLDs.

const MULTIPART_TLDS = new Set([
  'co.uk', 'org.uk', 'ac.uk', 'gov.uk', 'net.uk',
  'com.au', 'net.au', 'org.au', 'gov.au', 'edu.au',
  'co.nz', 'net.nz', 'org.nz', 'govt.nz',
  'co.jp', 'ne.jp', 'or.jp', 'ac.jp', 'go.jp',
  'com.br', 'net.br', 'org.br', 'gov.br',
  'co.in', 'net.in', 'org.in', 'gov.in',
  'com.mx', 'com.ar', 'com.tr', 'com.sg', 'com.hk', 'com.tw', 'com.cn',
  'co.za', 'co.kr', 'co.il', 'or.kr',
]);
const STRIPPABLE = ['www.', 'm.', 'mobile.', 'amp.'];

export function normalizeDomain(input: string): { domain: string; slug: string } | null {
  if (!input) return null;
  let host = input.trim().toLowerCase();
  try {
    if (host.includes('://')) host = new URL(host).hostname.toLowerCase();
  } catch { return null; }
  if (!host || host === 'localhost' || /^[0-9.]+$/.test(host) || host.includes(':')) return null;
  for (const p of STRIPPABLE) { if (host.startsWith(p)) { host = host.slice(p.length); break; } }
  const parts = host.split('.').filter(Boolean);
  if (parts.length < 2) return null;
  const last2 = parts.slice(-2).join('.');
  const last3 = parts.slice(-3).join('.');
  const domain = (parts.length >= 3 && MULTIPART_TLDS.has(last2)) ? last3 : last2;
  if (!/^[a-z0-9.-]{1,253}$/.test(domain)) return null;
  const slug = domain.replace(/\./g, '-');
  if (!/^[a-z0-9-]{1,128}$/.test(slug)) return null;
  return { domain, slug };
}
