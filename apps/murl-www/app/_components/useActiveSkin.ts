'use client';

import { useEffect, useState } from 'react';
import { readSkinFromStorage } from '../../lib/skins/runtime/site';

/**
 * The currently-selected skin id. Skins are scoped to the mURL CHAT DEMOS
 * (wrap a demo in `<div className="m-root" data-murl-skin={useActiveSkin()}>`),
 * NOT the marketing site — so the site stays on-brand and the picker never
 * re-themes itself. Updates live on the `murl-skin-change` window event that
 * the picker + SkinProvider dispatch.
 */
export function useActiveSkin(): string {
  const [active, setActive] = useState('mosadd-dark');
  useEffect(() => {
    setActive(readSkinFromStorage());
    const onChange = (e: Event) => {
      const id = (e as CustomEvent<string>).detail;
      if (typeof id === 'string') setActive(id);
    };
    window.addEventListener('murl-skin-change', onChange as EventListener);
    return () => window.removeEventListener('murl-skin-change', onChange as EventListener);
  }, []);
  return active;
}
