import { redirect } from 'next/navigation';

interface PageProps { params: Promise<{ domain: string }> }

// Short link /c/<domain> -> /murl/<domain>. Kept for back-compat with v0.8.0
// extension share links already in the wild.
export default async function ShortRedirect({ params }: PageProps) {
  const { domain } = await params;
  redirect(`/murl/${domain}`);
}
