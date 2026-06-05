/**
 * Extension runtime — applies a skin to a closed shadow root.
 *
 * Shadow DOM with `mode: "closed"` doesn't inherit CSS variables from the
 * parent document, so we inject a dedicated `<style>` inside the shadow root
 * and set the `data-murl-skin` attribute on the host element.
 *
 * We also use the same triple-selector pattern as the site (`:host`, `:root`,
 * `.m-root`) so authors only ship one CSS string per skin.
 */
import { DEFAULT_CSS } from "../default";
import { SKINS, SKIN_BY_ID, getSkin } from "../registry";
import { DEFAULT_SKIN_ID, SKIN_SYNC_EVENT } from "../contract";

const STYLE_ID = "m-skin-css";

/** Inject (or replace) the skin <style> in a shadow root and tag the host
 *  with `data-murl-skin`. Idempotent — safe to call on every settings change. */
export function applySkinToShadow(
  shadow: ShadowRoot,
  hostEl: HTMLElement,
  skinId: string | null | undefined,
): void {
  const skin = getSkin(skinId);

  // 1. Tag host so the [data-murl-skin="X"] selector matches inside the shadow.
  hostEl.setAttribute("data-murl-skin", skin.id);
  // Some browsers also honor color-scheme on :host; set it for chrome (form controls etc.).
  hostEl.style.colorScheme = skin.scheme;

  // 2. Inject/refresh the style.
  let style = shadow.getElementById(STYLE_ID) as HTMLStyleElement | null;
  if (!style) {
    style = document.createElement("style");
    style.id = STYLE_ID;
    // Insert at the very start so any subsequent component styles can override
    // brand defaults if they want to.
    shadow.insertBefore(style, shadow.firstChild);
  }
  // We stamp ALL skins so future hostEl.setAttribute("data-murl-skin", "X")
  // calls take effect instantly without re-injecting.
  style.textContent = DEFAULT_CSS + "\n" + SKINS.map((s) => s.css).join("\n");
}

/** Same as applySkinToShadow but only flips the data attribute on the host
 *  (assumes applySkinToShadow has already stamped all skin CSS once). */
export function setShadowSkin(hostEl: HTMLElement, skinId: string | null | undefined): void {
  const skin = getSkin(skinId);
  hostEl.setAttribute("data-murl-skin", skin.id);
  hostEl.style.colorScheme = skin.scheme;
}

/** Validate + normalize an id. */
export function normalizeSkinId(id: unknown): string {
  if (typeof id === "string" && SKIN_BY_ID[id]) return id;
  return DEFAULT_SKIN_ID;
}

export { SKINS, SKIN_BY_ID, SKIN_SYNC_EVENT };
