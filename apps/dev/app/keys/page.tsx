import { redirect } from 'next/navigation';

// /keys is a convenience alias for the canonical hub mint portal at /hub.
// The hub page loads the user's session, lists existing keys, and (for
// users with zero keys) auto-issues a fresh `mosadd_sk_live_*` key via the
// `hub-keys` Edge Function, showing it once for copy. See LINEAR-2919.
export default function KeysPage() {
  redirect('/hub');
}
