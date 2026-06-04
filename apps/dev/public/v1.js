var MosaddEmbed=(function(){'use strict';var x=`/* =============================================================================\r
   Default skin \u2014 "mosadd-mIRC" (the out-of-the-box look for every embed).\r
   FRAME (border, header, input, buttons)   = mosadd brand:\r
     pure black, neon green primary, JetBrains Mono, scanlines, HUD brackets.\r
     This is the growth-loop brand \u2014 every embed without \`data-skin\` looks like\r
     mosadd, so creators using us = walking ads.\r
   INNER (the chat lines themselves)        = mIRC retro:\r
     [hh:mm] <~nick> text, nicks colored per-hash, message body in mono.\r
     Same conventions strajkpolski styled into; we ship as the default.\r
\r
   All class names are namespaced \`.m-*\` so we cannot collide with the host\r
   page's CSS. The widget lives inside a Shadow DOM (see widget.ts) so even\r
   without namespacing the host page can't reach in \u2014 but the names are kept\r
   readable so the live editor can target them.\r
   ============================================================================= */\r
\r
:host, .m-root {\r
  --m-bg:        #000000;\r
  --m-fg:        #f2f2f2;\r
  --m-muted:     hsl(0 0% 55%);\r
  --m-card:      hsl(0 0% 3%);\r
  --m-accent:    hsl(0 0% 10%);\r
  --m-border:    hsl(0 0% 12%);\r
  --m-primary:   hsl(145 100% 50%);     /* neon green */\r
  --m-primary-fg: hsl(0 0% 2%);\r
  --m-destructive: hsl(0 80% 55%);\r
  --m-radius:    2px;                    /* sharp corners, terminal feel */\r
  --m-font:      "JetBrains Mono", ui-monospace, SFMono-Regular, Menlo, monospace;\r
  --m-font-size: 13px;\r
  --m-line:      1.45;\r
\r
  /* Nick color palette for the per-hash assignment. 8 distinct hues that\r
     read well on pure black. Order matters \u2014 picked deliberately. */\r
  --m-nick-1: #00ff7f;   /* mosadd green */\r
  --m-nick-2: #ffcc00;   /* amber */\r
  --m-nick-3: #ff66cc;   /* magenta */\r
  --m-nick-4: #66ccff;   /* cyan */\r
  --m-nick-5: #ff9966;   /* warm orange */\r
  --m-nick-6: #cc99ff;   /* lavender */\r
  --m-nick-7: #99ff99;   /* mint */\r
  --m-nick-8: #ff6666;   /* warm red */\r
\r
  all: initial;\r
  display: block;\r
  box-sizing: border-box;\r
  color: var(--m-fg);\r
  background: var(--m-bg);\r
  font-family: var(--m-font);\r
  font-size: var(--m-font-size);\r
  line-height: var(--m-line);\r
}\r
\r
.m-root *, .m-root *::before, .m-root *::after { box-sizing: border-box; }\r
\r
/* \u2500\u2500 outer card (the FRAME \u2014 mosadd brand) \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500 */\r
.m-card {\r
  background: var(--m-bg);\r
  border: 1px solid var(--m-border);\r
  border-radius: var(--m-radius);\r
  height: 100%;\r
  width: 100%;\r
  display: flex;\r
  flex-direction: column;\r
  overflow: hidden;\r
  position: relative;\r
}\r
\r
/* Subtle scanline overlay (very low opacity \u2014 should never compete with text). */\r
.m-card::before {\r
  content: "";\r
  position: absolute;\r
  inset: 0;\r
  background-image: repeating-linear-gradient(\r
    180deg,\r
    rgba(255, 255, 255, 0.015) 0,\r
    rgba(255, 255, 255, 0.015) 1px,\r
    transparent 1px,\r
    transparent 3px\r
  );\r
  pointer-events: none;\r
  z-index: 1;\r
}\r
\r
/* HUD corner brackets */\r
.m-bracket {\r
  position: absolute;\r
  width: 10px;\r
  height: 10px;\r
  border: 1px solid var(--m-primary);\r
  pointer-events: none;\r
  z-index: 2;\r
  opacity: 0.6;\r
}\r
.m-bracket.tl { top: 4px; left: 4px; border-right: 0; border-bottom: 0; }\r
.m-bracket.tr { top: 4px; right: 4px; border-left: 0; border-bottom: 0; }\r
.m-bracket.bl { bottom: 4px; left: 4px; border-right: 0; border-top: 0; }\r
.m-bracket.br { bottom: 4px; right: 4px; border-left: 0; border-top: 0; }\r
\r
/* \u2500\u2500 header (channel + status) \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500 */\r
.m-head {\r
  flex: 0 0 auto;\r
  display: flex;\r
  align-items: center;\r
  gap: 8px;\r
  padding: 6px 10px;\r
  border-bottom: 1px solid var(--m-border);\r
  letter-spacing: 0.08em;\r
  text-transform: uppercase;\r
  font-weight: 600;\r
  font-size: 11px;\r
  position: relative;\r
  z-index: 3;\r
}\r
.m-head .m-title { flex: 1; color: var(--m-fg); }\r
.m-head .m-chan { color: var(--m-primary); font-weight: 700; }\r
.m-head .m-status {\r
  width: 8px; height: 8px;\r
  border-radius: 50%;\r
  background: var(--m-muted);\r
}\r
.m-head .m-status.online { background: var(--m-primary); box-shadow: 0 0 6px var(--m-primary); }\r
.m-head .m-status.connecting { background: hsl(38 100% 50%); animation: m-blink 1s linear infinite; }\r
.m-head .m-status.error { background: var(--m-destructive); }\r
@keyframes m-blink { 50% { opacity: 0.3; } }\r
\r
/* \u2500\u2500 chat stream (INNER \u2014 mIRC retro) \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500 */\r
.m-stream {\r
  flex: 1 1 auto;\r
  overflow-y: auto;\r
  padding: 10px;\r
  display: flex;\r
  flex-direction: column;\r
  gap: 2px;\r
  position: relative;\r
  z-index: 2;\r
  scrollbar-width: thin;\r
  scrollbar-color: var(--m-border) transparent;\r
}\r
.m-stream::-webkit-scrollbar { width: 6px; }\r
.m-stream::-webkit-scrollbar-thumb { background: var(--m-border); }\r
\r
.m-msg {\r
  display: block;\r
  word-wrap: break-word;\r
  word-break: break-word;\r
  white-space: pre-wrap;\r
  font-family: var(--m-font);\r
}\r
.m-ts {\r
  color: var(--m-muted);\r
  font-weight: 400;\r
  margin-right: 4px;\r
  user-select: none;\r
}\r
.m-nick {\r
  font-weight: 700;\r
  margin-right: 4px;\r
}\r
.m-nick::before { content: "<~"; color: var(--m-muted); font-weight: 400; }\r
.m-nick::after  { content: ">";  color: var(--m-muted); font-weight: 400; }\r
.m-text { color: var(--m-fg); }\r
\r
/* Nick colors per-hash (set by widget.ts as --m-nick-i on each .m-msg). */\r
.m-msg[data-nick-color="1"] .m-nick { color: var(--m-nick-1); }\r
.m-msg[data-nick-color="2"] .m-nick { color: var(--m-nick-2); }\r
.m-msg[data-nick-color="3"] .m-nick { color: var(--m-nick-3); }\r
.m-msg[data-nick-color="4"] .m-nick { color: var(--m-nick-4); }\r
.m-msg[data-nick-color="5"] .m-nick { color: var(--m-nick-5); }\r
.m-msg[data-nick-color="6"] .m-nick { color: var(--m-nick-6); }\r
.m-msg[data-nick-color="7"] .m-nick { color: var(--m-nick-7); }\r
.m-msg[data-nick-color="8"] .m-nick { color: var(--m-nick-8); }\r
\r
/* System notices (joined / left / queue / error) */\r
.m-sys {\r
  color: var(--m-muted);\r
  font-style: italic;\r
  font-size: 12px;\r
  padding: 2px 0;\r
}\r
\r
/* \u2500\u2500 join form (anonymous nick) \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500 */\r
.m-join {\r
  flex: 0 0 auto;\r
  padding: 10px;\r
  border-top: 1px solid var(--m-border);\r
  display: flex;\r
  flex-direction: column;\r
  gap: 6px;\r
  position: relative;\r
  z-index: 3;\r
}\r
.m-join label {\r
  font-size: 11px;\r
  text-transform: uppercase;\r
  letter-spacing: 0.08em;\r
  color: var(--m-muted);\r
}\r
.m-join .m-row { display: flex; gap: 6px; }\r
.m-join input {\r
  flex: 1;\r
  padding: 6px 8px;\r
  background: var(--m-card);\r
  color: var(--m-fg);\r
  border: 1px solid var(--m-border);\r
  border-radius: var(--m-radius);\r
  font-family: var(--m-font);\r
  font-size: 13px;\r
  outline: none;\r
}\r
.m-join input:focus { border-color: var(--m-primary); }\r
.m-btn {\r
  padding: 6px 14px;\r
  background: var(--m-primary);\r
  color: var(--m-primary-fg);\r
  border: 1px solid var(--m-primary);\r
  border-radius: var(--m-radius);\r
  font-family: var(--m-font);\r
  font-weight: 700;\r
  font-size: 12px;\r
  text-transform: uppercase;\r
  letter-spacing: 0.08em;\r
  cursor: pointer;\r
}\r
.m-btn:hover { filter: brightness(1.1); }\r
.m-btn:disabled { opacity: 0.4; cursor: not-allowed; }\r
\r
/* \u2500\u2500 input row (when joined) \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500 */\r
.m-input {\r
  flex: 0 0 auto;\r
  padding: 8px 10px;\r
  border-top: 1px solid var(--m-border);\r
  display: flex;\r
  gap: 6px;\r
  position: relative;\r
  z-index: 3;\r
}\r
.m-input textarea {\r
  flex: 1;\r
  padding: 6px 8px;\r
  background: var(--m-card);\r
  color: var(--m-fg);\r
  border: 1px solid var(--m-border);\r
  border-radius: var(--m-radius);\r
  font-family: var(--m-font);\r
  font-size: 13px;\r
  outline: none;\r
  resize: none;\r
  min-height: 28px;\r
  max-height: 80px;\r
  line-height: 1.4;\r
}\r
.m-input textarea:focus { border-color: var(--m-primary); }\r
\r
/* \u2500\u2500 badge (powered by mosadd) \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500 */\r
.m-badge {\r
  flex: 0 0 auto;\r
  padding: 4px 10px;\r
  border-top: 1px solid var(--m-border);\r
  font-size: 10px;\r
  color: var(--m-muted);\r
  text-align: right;\r
  letter-spacing: 0.05em;\r
  position: relative;\r
  z-index: 3;\r
}\r
.m-badge a {\r
  color: var(--m-primary);\r
  text-decoration: none;\r
}\r
.m-badge a:hover { text-decoration: underline; }\r
\r
/* \u2500\u2500 positioning modes (controlled by data-position) \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500 */\r
.m-root.m-pos-inline   { position: relative; width: 100%; height: 400px; }\r
.m-root.m-pos-fullscreen { position: fixed; inset: 0; z-index: 2147483640; }\r
.m-root.m-pos-floating-br { position: fixed; right: 16px; bottom: 16px; width: 320px; height: 480px; z-index: 2147483640; }\r
.m-root.m-pos-floating-bl { position: fixed; left: 16px; bottom: 16px; width: 320px; height: 480px; z-index: 2147483640; }\r
.m-root.m-pos-sidebar-right { position: fixed; right: 0; top: 0; bottom: 0; width: 340px; z-index: 2147483640; }\r
.m-root.m-pos-sidebar-left  { position: fixed; left: 0; top: 0; bottom: 0; width: 340px; z-index: 2147483640; }\r
\r
/* \u2500\u2500 launcher mode (data-mode="launcher") \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\r
   Collapsed = small pill button anchored to one of 4 corners.\r
   Expanded  = floating chat card anchored to the same corner.\r
   When expanded the launcher pill hides; when collapsed the card hides.\r
   See widget.ts \u2192 expand()/collapse(). LINEAR-2735/2682-A.\r
   \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500 */\r
.m-root.m-pos-launcher {\r
  position: fixed;\r
  z-index: 2147483640;\r
  /* No width/height here \u2014 the launcher pill and the card both manage their own.\r
     When the card is shown (m-launcher-open) we anchor it to the same corner. */\r
}\r
.m-root.m-launcher-pos-br { right: 16px; bottom: 16px; }\r
.m-root.m-launcher-pos-bl { left:  16px; bottom: 16px; }\r
.m-root.m-launcher-pos-tr { right: 16px; top:    16px; }\r
.m-root.m-launcher-pos-tl { left:  16px; top:    16px; }\r
\r
/* The launcher pill itself \u2014 mIRC tag styling, brand-correct */\r
.m-launcher {\r
  display: inline-flex;\r
  align-items: center;\r
  gap: 6px;\r
  padding: 8px 12px;\r
  background: var(--m-bg);\r
  color: var(--m-fg);\r
  border: 1px solid var(--m-primary);\r
  border-radius: var(--m-radius);\r
  font-family: var(--m-font);\r
  font-size: 12px;\r
  font-weight: 600;\r
  letter-spacing: 0.04em;\r
  cursor: pointer;\r
  user-select: none;\r
  box-shadow: 0 0 0 1px rgba(0,0,0,0.6), 0 2px 8px rgba(0,0,0,0.4),\r
              0 0 12px rgba(0, 255, 127, 0.15);\r
  transition: transform 90ms ease, box-shadow 90ms ease, filter 90ms ease;\r
}\r
.m-launcher:hover {\r
  filter: brightness(1.12);\r
  transform: translateY(-1px);\r
  box-shadow: 0 0 0 1px rgba(0,0,0,0.6), 0 4px 14px rgba(0,0,0,0.5),\r
              0 0 18px rgba(0, 255, 127, 0.28);\r
}\r
.m-launcher:focus-visible { outline: 1px solid var(--m-primary); outline-offset: 2px; }\r
\r
.m-launcher-dot {\r
  width: 8px; height: 8px;\r
  border-radius: 50%;\r
  background: var(--m-muted);\r
  flex: 0 0 8px;\r
}\r
.m-launcher-dot.active {\r
  background: var(--m-primary);\r
  box-shadow: 0 0 8px var(--m-primary);\r
  animation: m-pulse 2s ease-in-out infinite;\r
}\r
@keyframes m-pulse {\r
  0%, 100% { opacity: 1; }\r
  50%      { opacity: 0.5; }\r
}\r
\r
.m-launcher-label { color: var(--m-primary); }\r
.m-launcher-sep   { color: var(--m-muted); margin: 0 2px; }\r
.m-launcher-count { color: var(--m-fg); font-weight: 700; }\r
\r
/* When expanded, anchor the card to the launcher's corner.\r
   The launcher pill is hidden by widget.ts (display:none) on expand. */\r
.m-root.m-pos-launcher .m-card {\r
  position: relative;\r
  width: 340px;\r
  height: 480px;\r
  /* Max viewport bounds so the card never overflows on small screens. */\r
  max-width: calc(100vw - 32px);\r
  max-height: calc(100vh - 32px);\r
}\r
\r
/* Close X in the header (launcher mode only) */\r
.m-close {\r
  background: transparent;\r
  color: var(--m-muted);\r
  border: 1px solid var(--m-border);\r
  border-radius: var(--m-radius);\r
  width: 20px;\r
  height: 20px;\r
  font-size: 14px;\r
  line-height: 1;\r
  cursor: pointer;\r
  padding: 0;\r
  margin-left: 6px;\r
  font-family: var(--m-font);\r
}\r
.m-close:hover { color: var(--m-fg); border-color: var(--m-fg); }\r
\r
/* Settings (\u2699) button + dropdown \u2014 holds the GDPR "Delete my data" action\r
   (LINEAR-2742). Mirrors the .m-close affordance; the menu is absolutely\r
   positioned under the gear within the relative .m-head. */\r
.m-gear {\r
  background: transparent;\r
  color: var(--m-muted);\r
  border: 1px solid var(--m-border);\r
  border-radius: var(--m-radius);\r
  width: 20px;\r
  height: 20px;\r
  font-size: 12px;\r
  line-height: 1;\r
  cursor: pointer;\r
  padding: 0;\r
  font-family: var(--m-font);\r
}\r
.m-gear:hover { color: var(--m-fg); border-color: var(--m-fg); }\r
.m-menu {\r
  position: absolute;\r
  top: calc(100% + 4px);\r
  right: 8px;\r
  z-index: 6;\r
  background: var(--m-bg);\r
  border: 1px solid var(--m-border);\r
  border-radius: var(--m-radius);\r
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.5);\r
  min-width: 160px;\r
  padding: 4px;\r
}\r
.m-menu-item {\r
  display: block;\r
  width: 100%;\r
  text-align: left;\r
  background: transparent;\r
  color: var(--m-fg);\r
  border: none;\r
  border-radius: var(--m-radius);\r
  padding: 7px 9px;\r
  font-size: 11px;\r
  font-family: var(--m-font);\r
  letter-spacing: 0.04em;\r
  text-transform: none;\r
  cursor: pointer;\r
}\r
.m-menu-item:hover { background: var(--m-border); color: var(--m-destructive); }\r
\r
/* Mobile: pin the launcher card to the safe area instead of corner-anchored */\r
@media (max-width: 480px) {\r
  .m-root.m-pos-launcher.m-launcher-open .m-card {\r
    position: fixed !important;\r
    inset: 8px;\r
    width: auto;\r
    height: auto;\r
    max-width: none;\r
    max-height: none;\r
  }\r
}\r
\r
/* \u2500\u2500 queue overlay (LINEAR-2744) \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500 */\r
.m-queue {\r
  display: flex;\r
  flex-direction: column;\r
  align-items: center;\r
  justify-content: center;\r
  gap: 12px;\r
  padding: 24px;\r
  max-width: 280px;\r
  margin: auto;\r
  text-align: center;\r
}\r
.m-queue-icon {\r
  font-size: 32px;\r
  color: var(--m-primary);\r
  opacity: 0.85;\r
  line-height: 1;\r
}\r
.m-queue-title {\r
  font-family: var(--m-font);\r
  font-weight: 700;\r
  font-size: 14px;\r
  letter-spacing: 0.06em;\r
  text-transform: uppercase;\r
  color: var(--m-fg);\r
}\r
.m-queue-sub {\r
  font-size: 12px;\r
  color: var(--m-muted);\r
  line-height: 1.5;\r
}\r
.m-queue-cta {\r
  display: inline-block;\r
  margin-top: 6px;\r
  padding: 8px 14px;\r
  background: var(--m-primary);\r
  color: var(--m-primary-fg);\r
  border: 1px solid var(--m-primary);\r
  border-radius: var(--m-radius);\r
  font-family: var(--m-font);\r
  font-weight: 700;\r
  font-size: 11px;\r
  letter-spacing: 0.08em;\r
  text-transform: uppercase;\r
  text-decoration: none;\r
}\r
.m-queue-cta:hover { filter: brightness(1.12); }\r
`;var y=`/* =============================================================================\r
   retro-irc-1990 \u2014 full 1990s mIRC vibe. Lifted from strajkpolski.pl style.\r
   Beige background, red accent, pixel-y feel. Author: @strajkpolski / mosadd team.\r
   ============================================================================= */\r
\r
:host, .m-root {\r
  --m-bg:        #f4eeda;\r
  --m-fg:        #1a1a1a;\r
  --m-muted:     #5a5550;\r
  --m-card:      #ebe4cc;\r
  --m-accent:    #e3dcc0;\r
  --m-border:    #b91c1c;\r
  --m-primary:   #b91c1c;\r
  --m-primary-fg: #f4eeda;\r
  --m-destructive: #7f1d1d;\r
  --m-radius:    0;\r
  --m-font:      "VT323", "Courier New", ui-monospace, monospace;\r
  --m-font-size: 15px;\r
  --m-line:      1.35;\r
\r
  /* High-saturation IRC palette */\r
  --m-nick-1: #b91c1c;\r
  --m-nick-2: #b45309;\r
  --m-nick-3: #6d28d9;\r
  --m-nick-4: #0e7490;\r
  --m-nick-5: #9f1239;\r
  --m-nick-6: #4338ca;\r
  --m-nick-7: #166534;\r
  --m-nick-8: #92400e;\r
}\r
\r
/* Drop the scanline + HUD bracket overlay \u2014 period-correct mIRC didn't have those. */\r
.m-card::before { display: none; }\r
.m-bracket { display: none; }\r
\r
/* Slightly bolder title bar */\r
.m-head {\r
  background: var(--m-primary);\r
  color: var(--m-primary-fg);\r
  border-bottom: 2px solid var(--m-primary);\r
}\r
.m-head .m-chan { color: var(--m-primary-fg); }\r
.m-head .m-title { color: var(--m-primary-fg); }\r
.m-head .m-status.online { background: #ade80f; box-shadow: none; }\r
\r
.m-stream { background: var(--m-bg); }\r
.m-ts { color: var(--m-muted); }\r
.m-nick::before, .m-nick::after { color: var(--m-muted); }\r
\r
.m-btn { font-weight: 700; letter-spacing: 0.04em; }\r
`;var k=`/* =============================================================================\r
   terminal \u2014 green-on-black hacker terminal. CRT vibes, blinking cursor.\r
   For dev blogs, sec-research sites, terminal-themed personal pages.\r
   ============================================================================= */\r
\r
:host, .m-root {\r
  --m-bg:        #000000;\r
  --m-fg:        #00ff00;\r
  --m-muted:     #009900;\r
  --m-card:      #001100;\r
  --m-accent:    #002200;\r
  --m-border:    #006600;\r
  --m-primary:   #00ff00;\r
  --m-primary-fg: #000000;\r
  --m-destructive: #ff3333;\r
  --m-radius:    0;\r
  --m-font:      "VT323", "Courier New", ui-monospace, monospace;\r
  --m-font-size: 14px;\r
  --m-line:      1.3;\r
\r
  --m-nick-1: #00ff00;\r
  --m-nick-2: #00ffaa;\r
  --m-nick-3: #aaff00;\r
  --m-nick-4: #00ffff;\r
  --m-nick-5: #ffff00;\r
  --m-nick-6: #ff00ff;\r
  --m-nick-7: #ffaa00;\r
  --m-nick-8: #ffaaff;\r
}\r
\r
.m-card {\r
  /* Subtle CRT glow */\r
  text-shadow: 0 0 1px currentColor;\r
}\r
\r
/* Stronger scanlines for the CRT feel */\r
.m-card::before {\r
  background-image: repeating-linear-gradient(\r
    180deg,\r
    rgba(0, 255, 0, 0.04) 0,\r
    rgba(0, 255, 0, 0.04) 1px,\r
    transparent 1px,\r
    transparent 2px\r
  );\r
}\r
\r
/* Drop HUD brackets \u2014 minimal terminal aesthetic */\r
.m-bracket { display: none; }\r
\r
/* Blinking cursor on the input */\r
.m-input textarea {\r
  caret-color: var(--m-primary);\r
}\r
.m-input textarea:focus {\r
  animation: m-cursor-blink 1s steps(2) infinite;\r
}\r
@keyframes m-cursor-blink {\r
  50% { caret-color: transparent; }\r
}\r
\r
/* \`$ \` prompt prefix in front of the nick \u2014 adds the CLI vibe */\r
.m-nick::before { content: "$ "; color: var(--m-muted); }\r
.m-nick::after  { content: ""; }\r
`;var w=`/* =============================================================================\r
   minimal-dark \u2014 modern dark, no scanlines, no brackets, soft borders.\r
   Linear/Notion/Vercel feel. Good for product-y sites that want chat to\r
   not scream "retro" but still match a dark theme.\r
   ============================================================================= */\r
\r
:host, .m-root {\r
  --m-bg:        #0a0a0b;\r
  --m-fg:        #e5e5e7;\r
  --m-muted:     #8a8a93;\r
  --m-card:      #121215;\r
  --m-accent:    #1f1f24;\r
  --m-border:    #2a2a31;\r
  --m-primary:   #6366f1;\r
  --m-primary-fg: #ffffff;\r
  --m-destructive: #ef4444;\r
  --m-radius:    8px;\r
  --m-font:      "Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;\r
  --m-font-size: 14px;\r
  --m-line:      1.5;\r
\r
  /* Subdued nick palette to match the calm look */\r
  --m-nick-1: #818cf8;\r
  --m-nick-2: #fbbf24;\r
  --m-nick-3: #f472b6;\r
  --m-nick-4: #22d3ee;\r
  --m-nick-5: #fb923c;\r
  --m-nick-6: #c084fc;\r
  --m-nick-7: #4ade80;\r
  --m-nick-8: #f87171;\r
}\r
\r
.m-card::before { display: none; }\r
.m-bracket { display: none; }\r
\r
.m-card {\r
  border-radius: var(--m-radius);\r
}\r
.m-head { border-bottom-color: var(--m-border); }\r
.m-head .m-chan { color: var(--m-primary); }\r
\r
.m-nick { font-weight: 600; }\r
.m-nick::before, .m-nick::after { content: ""; }\r
.m-nick::after { content: ":"; color: var(--m-muted); font-weight: 400; margin-right: 4px; }\r
.m-ts { font-size: 11px; opacity: 0.7; }\r
\r
.m-input textarea, .m-join input {\r
  border-radius: calc(var(--m-radius) - 2px);\r
}\r
.m-btn { border-radius: calc(var(--m-radius) - 2px); text-transform: none; letter-spacing: 0; font-weight: 600; }\r
.m-close { border-radius: 6px; }\r
`;var E=`/* =============================================================================\r
   minimal-light \u2014 day-mode counterpart of minimal-dark. Same structure, lighter\r
   palette. Good for blogs/news sites that run a light theme.\r
   ============================================================================= */\r
\r
:host, .m-root {\r
  --m-bg:        #ffffff;\r
  --m-fg:        #18181b;\r
  --m-muted:     #71717a;\r
  --m-card:      #fafafa;\r
  --m-accent:    #f4f4f5;\r
  --m-border:    #e4e4e7;\r
  --m-primary:   #4f46e5;\r
  --m-primary-fg: #ffffff;\r
  --m-destructive: #dc2626;\r
  --m-radius:    8px;\r
  --m-font:      "Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;\r
  --m-font-size: 14px;\r
  --m-line:      1.5;\r
\r
  --m-nick-1: #4f46e5;\r
  --m-nick-2: #ca8a04;\r
  --m-nick-3: #db2777;\r
  --m-nick-4: #0891b2;\r
  --m-nick-5: #ea580c;\r
  --m-nick-6: #7c3aed;\r
  --m-nick-7: #16a34a;\r
  --m-nick-8: #dc2626;\r
}\r
\r
.m-card::before { display: none; }\r
.m-bracket { display: none; }\r
\r
.m-card {\r
  border-radius: var(--m-radius);\r
  box-shadow: 0 1px 2px rgba(0,0,0,0.04), 0 4px 16px rgba(0,0,0,0.06);\r
}\r
.m-head { border-bottom-color: var(--m-border); background: var(--m-card); }\r
.m-head .m-chan { color: var(--m-primary); }\r
.m-head .m-status.online { background: #22c55e; box-shadow: 0 0 6px #22c55e; }\r
\r
.m-nick { font-weight: 600; }\r
.m-nick::before, .m-nick::after { content: ""; }\r
.m-nick::after { content: ":"; color: var(--m-muted); font-weight: 400; margin-right: 4px; }\r
.m-ts { font-size: 11px; opacity: 0.7; }\r
\r
.m-stream::-webkit-scrollbar-thumb { background: var(--m-border); }\r
.m-stream::-webkit-scrollbar-track { background: var(--m-card); }\r
\r
.m-input textarea, .m-join input {\r
  border-radius: calc(var(--m-radius) - 2px);\r
  background: var(--m-bg);\r
}\r
.m-btn {\r
  border-radius: calc(var(--m-radius) - 2px);\r
  text-transform: none;\r
  letter-spacing: 0;\r
  font-weight: 600;\r
}\r
.m-close {\r
  border-radius: 6px;\r
  background: var(--m-card);\r
}\r
\r
/* Light skin needs darker launcher pill border for contrast on white pages */\r
.m-launcher {\r
  box-shadow: 0 1px 3px rgba(0,0,0,0.1), 0 0 12px rgba(79, 70, 229, 0.15);\r
}\r
.m-launcher:hover {\r
  box-shadow: 0 2px 8px rgba(0,0,0,0.12), 0 0 18px rgba(79, 70, 229, 0.25);\r
}\r
`;var M={default:"","retro-irc-1990":y,terminal:k,"minimal-dark":w,"minimal-light":E},p={mintUrl:"https://rooffhgbxafyjcwmwpsy.supabase.co/functions/v1/mirc-embed-token",edgeUrl:"wss://mosadd-edge.mr-brics-33.workers.dev",position:"inline",skin:"default",locale:"en",launcherPosition:"br"},T=3e4,A=8,v={en:{join_label:"JOIN ANONYMOUSLY \u2014 PICK A NICK",join_placeholder:"e.g. Jane_from_Boston",join_button:"JOIN",input_placeholder:"Say something\u2026",connecting:"Connecting\u2026",queued:"This channel is at capacity. The creator can upgrade for more \u2014 please try again later.",queue_title:"Channel at capacity",queue_sub:"This chat reached its monthly limit. The creator can upgrade to let more people in.",queue_cta:"About upgrading \u2192",rate_limited:"Too many requests. Try again in a minute.",error_origin:"This domain isn't authorized for this embed.",error_key:"This embed key is invalid.",sys_joined:"Joined the channel.",sys_disconnected:"Disconnected. Reconnecting\u2026",powered:"powered by",settings:"Settings",delete_data:"Delete my data",delete_confirm:"Permanently delete all your messages and your participation record in this chat? This can't be undone.",delete_working:"Deleting your data\u2026",delete_done:"Your data has been deleted.",delete_fail:"Couldn't delete your data. Please try again."},pl:{join_label:"DO\u0141\u0104CZ ANONIMOWO \u2014 PODAJ NICK",join_placeholder:"np. Janek_z_Krakowa",join_button:"WEJD\u0179",input_placeholder:"Napisz co\u015B\u2026",connecting:"\u0141\u0105czenie\u2026",queued:"Kana\u0142 osi\u0105gn\u0105\u0142 limit. Tw\xF3rca mo\u017Ce zwi\u0119kszy\u0107 plan \u2014 spr\xF3buj p\xF3\u017Aniej.",queue_title:"Kana\u0142 pe\u0142ny",queue_sub:"Ten czat osi\u0105gn\u0105\u0142 miesi\u0119czny limit. Tw\xF3rca mo\u017Ce podnie\u015B\u0107 plan \u017Ceby wpu\u015Bci\u0107 wi\u0119cej os\xF3b.",queue_cta:"Zobacz tier-y \u2192",rate_limited:"Zbyt wiele pr\xF3b. Spr\xF3buj za minut\u0119.",error_origin:"Ta domena nie jest autoryzowana dla tego embeda.",error_key:"Klucz embeda jest nieprawid\u0142owy.",sys_joined:"Do\u0142\u0105czono do kana\u0142u.",sys_disconnected:"Roz\u0142\u0105czono. \u0141\u0105czenie ponownie\u2026",powered:"powered by",settings:"Ustawienia",delete_data:"Usu\u0144 moje dane",delete_confirm:"Trwale usun\u0105\u0107 wszystkie Twoje wiadomo\u015Bci i zapis udzia\u0142u w tym czacie? Tego nie da si\u0119 cofn\u0105\u0107.",delete_working:"Usuwanie Twoich danych\u2026",delete_done:"Twoje dane zosta\u0142y usuni\u0119te.",delete_fail:"Nie uda\u0142o si\u0119 usun\u0105\u0107 danych. Spr\xF3buj ponownie."}};function s(i,e){return v[i]?.[e]??v.en[e]??e}function $(i,e){let t=`mosadd:embed:${i.slice(0,24)}:${e}`;return {getNick:()=>L(`${t}:nick`),setNick:n=>S(`${t}:nick`,n),getSub:()=>L(`${t}:sub`),setSub:n=>S(`${t}:sub`,n),clear:()=>{C(`${t}:nick`),C(`${t}:sub`);}}}function C(i){try{localStorage.removeItem(i);}catch{}}function L(i){try{return localStorage.getItem(i)}catch{return null}}function S(i,e){try{localStorage.setItem(i,e);}catch{}}function q(i){let e=0;for(let t=0;t<i.length;t++)e=e*31+i.charCodeAt(t)|0;return Math.abs(e)%A+1}function U(i){let e=new Date(i),t=String(e.getHours()).padStart(2,"0"),n=String(e.getMinutes()).padStart(2,"0");return `[${t}:${n}]`}function o(i,e,t){let n=document.createElement(i);return e&&(n.className=e),t!==void 0&&(n.textContent=t),n}function B(i){let e=Object.keys(v);if(i){let t=i.toLowerCase();if(e.includes(t))return t}try{let t=(navigator?.language??"").split("-")[0]?.toLowerCase();if(t&&e.includes(t))return t}catch{}return p.locale}function W(i,e){let t=i.dataset,n=t.mode==="launcher"?"launcher":"inline",r=(()=>{let a=(t.launcherPosition||p.launcherPosition).toLowerCase();return ["br","bl","tr","tl"].includes(a)?a:"br"})();return {pk:e,channel:t.channel||"default",position:(t.position||p.position).toLowerCase(),skin:(t.skin||p.skin).toLowerCase(),mintUrl:t.mintUrl||p.mintUrl,edgeUrl:t.edgeUrl||p.edgeUrl,anon:t.anon!=="false",locale:B(t.locale),title:t.title,sound:t.sound==="true",mode:n,launcherPosition:r,launcherLabel:t.launcherLabel}}async function J(i,e){try{let t=i.replace(/^ws/,"http"),n=await fetch(`${t}/c/${encodeURIComponent(e)}/presence`,{method:"GET"});if(!n.ok)return null;let r=await n.json();return {count:typeof r.count=="number"?r.count:0,status:r.status??"open"}}catch{return null}}var f=class{constructor(e,t){this.settingsMenuEl=null;this.launcherEl=null;this.launcherDotEl=null;this.launcherCountEl=null;this.panelOpen=false;this.presencePollHandle=null;this.onlineCount=0;this.ws=null;this.mint=null;this.nick="";this.reconnectAttempts=0;this.host=e,this.cfg=W(e,t),this.storage=$(this.cfg.pk,this.cfg.channel),this.shadow=e.attachShadow({mode:"open"});let n=o("style");n.textContent=x,this.shadow.appendChild(n);let r=M[this.cfg.skin];if(r===void 0)console.warn(`[mosadd-embed] unknown data-skin="${this.cfg.skin}". Available: ${Object.keys(M).join(", ")}. Using default.`);else if(r){let a=o("style");a.textContent=r,this.shadow.appendChild(a);}this.mount(),this.cfg.mode==="launcher"?(this.mountLauncher(),this.cardEl.style.display="none",this.refreshPresence(),this.presencePollHandle=window.setInterval(()=>{this.refreshPresence();},T)):this.restore(),this.bindMobileKeyboard();}bindMobileKeyboard(){let e=window.visualViewport;if(!e||typeof e.addEventListener!="function")return;let t=()=>{if(!/m-pos-(launcher|floating|fullscreen|sidebar)/.test(this.root.className))return;let r=this.cardEl;if(!r)return;let a=Math.max(0,window.innerHeight-e.height);if(r.style.maxHeight=a>80?`calc(100vh - ${a+24}px)`:"",a>80)try{this.streamEl?.scrollTo({top:this.streamEl.scrollHeight});}catch{}};e.addEventListener("resize",t),e.addEventListener("scroll",t);}mount(){let e=this.cfg.mode==="launcher"?`m-pos-launcher m-launcher-pos-${this.cfg.launcherPosition}`:`m-pos-${this.cfg.position}`;this.root=o("div",`m-root ${e}`);let t=o("div","m-card");this.cardEl=t;for(let c of ["tl","tr","bl","br"])t.appendChild(o("div",`m-bracket ${c}`));let n=o("div","m-head");this.headStatusEl=o("span","m-status connecting");let r=o("span","m-title");r.innerHTML=`${this.cfg.title??"mIRC"} <span class="m-chan">#${K(this.cfg.channel)}</span>`,n.appendChild(this.headStatusEl),n.appendChild(r);let a=o("button","m-gear");a.type="button",a.innerHTML="\u2699",a.setAttribute("aria-label",s(this.cfg.locale,"settings"));let l=o("div","m-menu");l.style.display="none";let u=o("button","m-menu-item",s(this.cfg.locale,"delete_data"));if(u.type="button",u.addEventListener("click",()=>{l.style.display="none",this.handleDeleteMyData();}),l.appendChild(u),a.addEventListener("click",c=>{c.stopPropagation(),l.style.display=l.style.display==="none"?"block":"none";}),this.shadow.addEventListener("click",()=>{l.style.display="none";}),this.settingsMenuEl=l,n.appendChild(a),n.appendChild(l),this.cfg.mode==="launcher"){let c=o("button","m-close");c.type="button",c.innerHTML="\xD7",c.setAttribute("aria-label","Close chat"),c.addEventListener("click",()=>this.collapse()),n.appendChild(c);}t.appendChild(n),this.streamEl=o("div","m-stream"),t.appendChild(this.streamEl),this.joinEl=o("div","m-join");let D=o("label","",s(this.cfg.locale,"join_label")),g=o("div","m-row"),d=o("input");d.placeholder=s(this.cfg.locale,"join_placeholder"),d.autocomplete="off",d.maxLength=32;let b=o("button","m-btn",s(this.cfg.locale,"join_button"));d.addEventListener("keydown",c=>{c.key==="Enter"&&(c.preventDefault(),b.click());}),b.addEventListener("click",()=>this.handleJoin(d.value)),g.appendChild(d),g.appendChild(b),this.joinEl.appendChild(D),this.joinEl.appendChild(g),t.appendChild(this.joinEl),this.inputEl=o("div","m-input"),this.inputEl.style.display="none";let m=o("textarea");m.placeholder=s(this.cfg.locale,"input_placeholder"),m.rows=1,m.addEventListener("keydown",c=>{c.key==="Enter"&&!c.shiftKey&&(c.preventDefault(),this.handleSend(m.value),m.value="");}),this.inputEl.appendChild(m),t.appendChild(this.inputEl),this.badgeEl=o("div","m-badge"),this.badgeEl.innerHTML=`${s(this.cfg.locale,"powered")} <a href="https://mosadd.dev" target="_blank" rel="noopener">mosadd</a>`,t.appendChild(this.badgeEl),this.root.appendChild(t),this.shadow.appendChild(this.root);}mountLauncher(){let e=o("button","m-launcher");e.type="button";let t=o("span","m-launcher-dot"),n=o("span","m-launcher-label"),r=this.cfg.launcherLabel??`mIRC #${this.cfg.channel}`;n.textContent=r;let a=o("span","m-launcher-sep");a.textContent="\xB7";let l=o("span","m-launcher-count");l.textContent="\u2014",e.appendChild(t),e.appendChild(n),e.appendChild(a),e.appendChild(l),e.addEventListener("click",()=>this.expand()),this.launcherEl=e,this.launcherDotEl=t,this.launcherCountEl=l,this.root.appendChild(e);}setOnlineCount(e){this.onlineCount=Math.max(0,Math.floor(e)),this.launcherCountEl&&(this.launcherCountEl.textContent=this.onlineCount>=100?"99+ online":`${this.onlineCount} online`,this.launcherDotEl&&this.launcherDotEl.classList.toggle("active",this.onlineCount>0));}async refreshPresence(){if(this.panelOpen)return;let e=await J(this.cfg.edgeUrl,this.cfg.channel);e&&this.setOnlineCount(e.count);}expand(){this.panelOpen||(this.panelOpen=true,this.launcherEl&&(this.launcherEl.style.display="none"),this.cardEl.style.display="",this.root.classList.add("m-launcher-open"),this.presencePollHandle!==null&&(clearInterval(this.presencePollHandle),this.presencePollHandle=null),this.restore());}collapse(){this.panelOpen&&(this.panelOpen=false,this.cardEl.style.display="none",this.launcherEl&&(this.launcherEl.style.display=""),this.root.classList.remove("m-launcher-open"),(!this.ws||this.ws.readyState!==WebSocket.OPEN)&&this.presencePollHandle===null&&(this.presencePollHandle=window.setInterval(()=>{this.refreshPresence();},T)));}restore(){let e=this.storage.getNick();e&&this.handleJoin(e);}async handleDeleteMyData(){let e=true;try{e=window.confirm(s(this.cfg.locale,"delete_confirm"));}catch{e=true;}if(e){this.sysMessage(s(this.cfg.locale,"delete_working"));try{let t=this.storage.getSub(),n=this.mint?.token??null;if(!n&&t&&(n=await this.mintProofToken(t)),!n){this.wipeLocal(),this.sysMessage(s(this.cfg.locale,"delete_done"));return}let r=this.cfg.mintUrl.replace("mirc-embed-token","embed-dsr-delete"),a=await fetch(r,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({token:n})});if(!a.ok)throw new Error(`http_${a.status}`);this.wipeLocal(),this.sysMessage(s(this.cfg.locale,"delete_done"));}catch{this.sysMessage(s(this.cfg.locale,"delete_fail"));}}}async mintProofToken(e){try{let n=await(await fetch(this.cfg.mintUrl,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({pk:this.cfg.pk,channel_id:this.cfg.channel,sub:e})})).json().catch(()=>null);return n&&"token"in n?n.token:null}catch{return null}}wipeLocal(){try{this.ws?.close(1e3);}catch{}this.ws=null,this.mint=null,this.nick="",this.storage.clear(),this.inputEl.style.display="none",this.joinEl.style.display="";}handleJoin(e){let t=e.trim().slice(0,32);t&&(this.nick=t,this.storage.setNick(t),this.joinEl.style.display="none",this.inputEl.style.display="flex",this.sysMessage(s(this.cfg.locale,"sys_joined")),this.connect());}async connect(){this.setStatus("connecting");try{let e=this.storage.getSub()??null,t={pk:this.cfg.pk,channel_id:this.cfg.channel};e&&(t.sub=e);let n=await fetch(this.cfg.mintUrl,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(t)}),r=await n.json().catch(()=>null);if(!n.ok||!r||!("token"in r)){let l=r?.error??`http_${n.status}`;this.handleMintError(l);return}this.mint=r,this.storage.setSub(r.sub),r.badge_required||(this.badgeEl.style.display="none");let a=`${this.cfg.edgeUrl}/c/${encodeURIComponent(this.cfg.channel)}/ws`;this.ws=new WebSocket(a,["mosadd.v1",`bearer.${r.token}`]),this.ws.addEventListener("open",()=>{this.setStatus("online"),this.reconnectAttempts=0;}),this.ws.addEventListener("message",l=>this.onWsMessage(l)),this.ws.addEventListener("close",()=>this.onWsClose()),this.ws.addEventListener("error",()=>this.setStatus("error"));}catch{this.handleMintError("network");}}handleMintError(e){if(e==="plan_exhausted"){this.renderQueueOverlay(),this.setStatus("error");return}e==="origin_not_allowed"?this.sysMessage(s(this.cfg.locale,"error_origin")):e==="invalid_key"?this.sysMessage(s(this.cfg.locale,"error_key")):e==="rate_limited"?this.sysMessage(s(this.cfg.locale,"rate_limited")):this.sysMessage(`error: ${e}`),this.setStatus("error");}renderQueueOverlay(){this.inputEl.style.display="none",this.joinEl.style.display="none",this.streamEl.innerHTML="",this.streamEl.style.display="flex",this.streamEl.style.alignItems="center",this.streamEl.style.justifyContent="center",this.streamEl.style.textAlign="center";let e=o("div","m-queue"),t=o("div","m-queue-icon");t.textContent="\u25F7";let n=o("div","m-queue-title");n.textContent=s(this.cfg.locale,"queue_title");let r=o("div","m-queue-sub");r.textContent=s(this.cfg.locale,"queue_sub");let a=o("a","m-queue-cta");a.href="https://mosadd.dev/pricing",a.target="_blank",a.rel="noopener noreferrer",a.textContent=s(this.cfg.locale,"queue_cta"),e.appendChild(t),e.appendChild(n),e.appendChild(r),e.appendChild(a),this.streamEl.appendChild(e);}playBeep(){if(this.cfg.sound)try{let e=window.AudioContext??window.webkitAudioContext;if(!e)return;let t=new e,n=t.createOscillator(),r=t.createGain();n.connect(r),r.connect(t.destination),n.type="sine",n.frequency.value=880,r.gain.setValueAtTime(0,t.currentTime),r.gain.linearRampToValueAtTime(.08,t.currentTime+.01),r.gain.exponentialRampToValueAtTime(.001,t.currentTime+.12),n.start(),n.stop(t.currentTime+.13),setTimeout(()=>{try{t.close();}catch{}},200);}catch{}}onWsMessage(e){if(typeof e.data!="string")return;let t;try{t=JSON.parse(e.data);}catch{return}if(!t)return;if(t.type==="presence"&&typeof t.count=="number"){this.setOnlineCount(t.count);return}if(!t.id||typeof t.text!="string")return;let n=t;this.renderMessage(n),n.from&&this.nick&&n.from!==this.nick&&this.playBeep();}onWsClose(){this.setStatus("connecting"),this.sysMessage(s(this.cfg.locale,"sys_disconnected"));let e=Math.min(16e3,1e3*Math.pow(2,this.reconnectAttempts));this.reconnectAttempts++,window.setTimeout(()=>{this.connect();},e);}handleSend(e){let t=e.trim();if(!(!t||!this.ws||this.ws.readyState!==WebSocket.OPEN))try{this.ws.send(JSON.stringify({text:t,from:this.nick}));}catch{}}renderMessage(e){let t=this.isStreamAtBottom(),n=o("div","m-msg"),r=e.from??"anon";n.dataset.nickColor=String(q(r));let a=o("span","m-ts",U(e.ts)),l=o("span","m-nick",r),u=o("span","m-text",e.text);n.appendChild(a),n.appendChild(l),n.appendChild(u),this.streamEl.appendChild(n),t&&this.scrollToBottom();}sysMessage(e){let t=o("div","m-sys",e);this.streamEl.appendChild(t),this.scrollToBottom();}setStatus(e){this.headStatusEl.className=`m-status ${e}`;}isStreamAtBottom(){let e=this.streamEl;return e.scrollHeight-e.scrollTop-e.clientHeight<40}scrollToBottom(){this.streamEl.scrollTop=this.streamEl.scrollHeight;}};function K(i){return i.replace(/[&<>"']/g,e=>e==="&"?"&amp;":e==="<"?"&lt;":e===">"?"&gt;":e==='"'?"&quot;":"&#39;")}var V="0.1.0";function z(){let i=document.currentScript;if(i?.dataset?.key)return i.dataset.key;let e=Array.from(document.getElementsByTagName("script"));for(let t of e)if(t.src&&/\/(v1)\.js(\?|$)/.test(t.src)&&t.dataset?.key)return t.dataset.key;return null}function F(){let i=new Set,e=[],t=r=>{i.has(r)||(i.add(r),e.push(r));},n=document.getElementById("mosadd-mirc");return n&&t(n),document.querySelectorAll("[data-mosadd-mirc]").forEach(t),document.querySelectorAll('[data-mosadd-embed="mirc"]').forEach(t),e}var h=null,H=new WeakSet;function j(i){if(H.has(i))return null;if(h||(h=z()),!h)return console.warn("[mosadd-embed] missing data-key on the <script> tag \u2014 widget not mounted."),null;try{let e=new f(i,h);return H.add(i),e}catch(e){return console.error("[mosadd-embed] mount failed:",e),null}}function _(){if(h=z(),!h){console.warn('[mosadd-embed] missing data-key on the <script> tag \u2014 set <script src="\u2026/v1.js" data-key="m_pk_live_\u2026">.');return}for(let i of F())j(i);}var G={mount:j,version:V};document.readyState==="loading"?document.addEventListener("DOMContentLoaded",_,{once:true}):queueMicrotask(_);var le=G;
return le;})();//# sourceMappingURL=v1.js.map
//# sourceMappingURL=v1.js.map