'use client';

import { useEffect } from 'react';
import {
  applySkinToDocument,
  readSkinFromStorage,
  writeSkinToStorage,
  listenForSkinSync,
} from '@mosadd/skins/runtime/site';
import { SKIN_BY_ID } from '@mosadd/skins/registry';
import { DEFAULT_SKIN_ID } from '@mosadd/skins/contract';

/**
 * Boots the active skin from localStorage on first paint + subscribes to
 * skin-sync messages posted by the extension content script. Single source
 * of truth: `<html data-murl-skin="X">`.
 */
export function SkinProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    const stored = readSkinFromStorage();
    applySkinToDocument(stored);
    const unsub = listenForSkinSync((id) => {
      if (!SKIN_BY_ID[id]) return;
      applySkinToDocument(id);
      writeSkinToStorage(id);
      window.dispatchEvent(new CustomEvent('murl-skin-change', { detail: id }));
    });
    // expose for picker
    window.dispatchEvent(new CustomEvent('murl-skin-change', { detail: stored }));
    return unsub;
  }, []);
  return <>{children}</>;
}

/** Boot-time inline script body to avoid a flash of default skin on first
 *  paint (set the attribute before React hydrates). Inject in <head>. */
export const SKIN_BOOT_SCRIPT = `
(function(){try{var v=localStorage.getItem('murl-skin');if(v){document.documentElement.setAttribute('data-murl-skin',v);}else{document.documentElement.setAttribute('data-murl-skin','${DEFAULT_SKIN_ID}');}}catch(e){document.documentElement.setAttribute('data-murl-skin','${DEFAULT_SKIN_ID}');}})();
`;
