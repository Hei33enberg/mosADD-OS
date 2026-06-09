'use client';

import { useEffect } from 'react';
import {
  readSkinFromStorage,
  writeSkinToStorage,
  listenForSkinSync,
} from '../../lib/skins/runtime/site';
import { SKIN_BY_ID } from '../../lib/skins/registry';

/**
 * Boots the active skin from localStorage and broadcasts it to the chat demos
 * via the `murl-skin-change` event. Skins are scoped to the chat panels (see
 * useActiveSkin), NOT the marketing site — so the site stays on-brand and the
 * picker never re-themes itself. Also picks up skin-sync messages posted by the
 * installed extension content script.
 */
export function SkinProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    const stored = readSkinFromStorage();
    window.dispatchEvent(new CustomEvent('murl-skin-change', { detail: stored }));
    const unsub = listenForSkinSync((id) => {
      if (!SKIN_BY_ID[id]) return;
      writeSkinToStorage(id);
      window.dispatchEvent(new CustomEvent('murl-skin-change', { detail: id }));
    });
    return unsub;
  }, []);
  return <>{children}</>;
}
