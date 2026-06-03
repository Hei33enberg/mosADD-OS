var MosaddEmbed=(function(){'use strict';var g=`/* =============================================================================\r
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
`;var b=`/* =============================================================================
   retro-irc-1990 \u2014 full 1990s mIRC vibe. Lifted from strajkpolski.pl style.
   Beige background, red accent, pixel-y feel. Author: @strajkpolski / mosadd team.
   ============================================================================= */

:host, .m-root {
  --m-bg:        #f4eeda;
  --m-fg:        #1a1a1a;
  --m-muted:     #5a5550;
  --m-card:      #ebe4cc;
  --m-accent:    #e3dcc0;
  --m-border:    #b91c1c;
  --m-primary:   #b91c1c;
  --m-primary-fg: #f4eeda;
  --m-destructive: #7f1d1d;
  --m-radius:    0;
  --m-font:      "VT323", "Courier New", ui-monospace, monospace;
  --m-font-size: 15px;
  --m-line:      1.35;

  /* High-saturation IRC palette */
  --m-nick-1: #b91c1c;
  --m-nick-2: #b45309;
  --m-nick-3: #6d28d9;
  --m-nick-4: #0e7490;
  --m-nick-5: #9f1239;
  --m-nick-6: #4338ca;
  --m-nick-7: #166534;
  --m-nick-8: #92400e;
}

/* Drop the scanline + HUD bracket overlay \u2014 period-correct mIRC didn't have those. */
.m-card::before { display: none; }
.m-bracket { display: none; }

/* Slightly bolder title bar */
.m-head {
  background: var(--m-primary);
  color: var(--m-primary-fg);
  border-bottom: 2px solid var(--m-primary);
}
.m-head .m-chan { color: var(--m-primary-fg); }
.m-head .m-title { color: var(--m-primary-fg); }
.m-head .m-status.online { background: #ade80f; box-shadow: none; }

.m-stream { background: var(--m-bg); }
.m-ts { color: var(--m-muted); }
.m-nick::before, .m-nick::after { color: var(--m-muted); }

.m-btn { font-weight: 700; letter-spacing: 0.04em; }
`;var v=`/* =============================================================================
   terminal \u2014 green-on-black hacker terminal. CRT vibes, blinking cursor.
   For dev blogs, sec-research sites, terminal-themed personal pages.
   ============================================================================= */

:host, .m-root {
  --m-bg:        #000000;
  --m-fg:        #00ff00;
  --m-muted:     #009900;
  --m-card:      #001100;
  --m-accent:    #002200;
  --m-border:    #006600;
  --m-primary:   #00ff00;
  --m-primary-fg: #000000;
  --m-destructive: #ff3333;
  --m-radius:    0;
  --m-font:      "VT323", "Courier New", ui-monospace, monospace;
  --m-font-size: 14px;
  --m-line:      1.3;

  --m-nick-1: #00ff00;
  --m-nick-2: #00ffaa;
  --m-nick-3: #aaff00;
  --m-nick-4: #00ffff;
  --m-nick-5: #ffff00;
  --m-nick-6: #ff00ff;
  --m-nick-7: #ffaa00;
  --m-nick-8: #ffaaff;
}

.m-card {
  /* Subtle CRT glow */
  text-shadow: 0 0 1px currentColor;
}

/* Stronger scanlines for the CRT feel */
.m-card::before {
  background-image: repeating-linear-gradient(
    180deg,
    rgba(0, 255, 0, 0.04) 0,
    rgba(0, 255, 0, 0.04) 1px,
    transparent 1px,
    transparent 2px
  );
}

/* Drop HUD brackets \u2014 minimal terminal aesthetic */
.m-bracket { display: none; }

/* Blinking cursor on the input */
.m-input textarea {
  caret-color: var(--m-primary);
}
.m-input textarea:focus {
  animation: m-cursor-blink 1s steps(2) infinite;
}
@keyframes m-cursor-blink {
  50% { caret-color: transparent; }
}

/* \`$ \` prompt prefix in front of the nick \u2014 adds the CLI vibe */
.m-nick::before { content: "$ "; color: var(--m-muted); }
.m-nick::after  { content: ""; }
`;var x=`/* =============================================================================
   minimal-dark \u2014 modern dark, no scanlines, no brackets, soft borders.
   Linear/Notion/Vercel feel. Good for product-y sites that want chat to
   not scream "retro" but still match a dark theme.
   ============================================================================= */

:host, .m-root {
  --m-bg:        #0a0a0b;
  --m-fg:        #e5e5e7;
  --m-muted:     #8a8a93;
  --m-card:      #121215;
  --m-accent:    #1f1f24;
  --m-border:    #2a2a31;
  --m-primary:   #6366f1;
  --m-primary-fg: #ffffff;
  --m-destructive: #ef4444;
  --m-radius:    8px;
  --m-font:      "Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
  --m-font-size: 14px;
  --m-line:      1.5;

  /* Subdued nick palette to match the calm look */
  --m-nick-1: #818cf8;
  --m-nick-2: #fbbf24;
  --m-nick-3: #f472b6;
  --m-nick-4: #22d3ee;
  --m-nick-5: #fb923c;
  --m-nick-6: #c084fc;
  --m-nick-7: #4ade80;
  --m-nick-8: #f87171;
}

.m-card::before { display: none; }
.m-bracket { display: none; }

.m-card {
  border-radius: var(--m-radius);
}
.m-head { border-bottom-color: var(--m-border); }
.m-head .m-chan { color: var(--m-primary); }

.m-nick { font-weight: 600; }
.m-nick::before, .m-nick::after { content: ""; }
.m-nick::after { content: ":"; color: var(--m-muted); font-weight: 400; margin-right: 4px; }
.m-ts { font-size: 11px; opacity: 0.7; }

.m-input textarea, .m-join input {
  border-radius: calc(var(--m-radius) - 2px);
}
.m-btn { border-radius: calc(var(--m-radius) - 2px); text-transform: none; letter-spacing: 0; font-weight: 600; }
.m-close { border-radius: 6px; }
`;var k=`/* =============================================================================
   minimal-light \u2014 day-mode counterpart of minimal-dark. Same structure, lighter
   palette. Good for blogs/news sites that run a light theme.
   ============================================================================= */

:host, .m-root {
  --m-bg:        #ffffff;
  --m-fg:        #18181b;
  --m-muted:     #71717a;
  --m-card:      #fafafa;
  --m-accent:    #f4f4f5;
  --m-border:    #e4e4e7;
  --m-primary:   #4f46e5;
  --m-primary-fg: #ffffff;
  --m-destructive: #dc2626;
  --m-radius:    8px;
  --m-font:      "Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
  --m-font-size: 14px;
  --m-line:      1.5;

  --m-nick-1: #4f46e5;
  --m-nick-2: #ca8a04;
  --m-nick-3: #db2777;
  --m-nick-4: #0891b2;
  --m-nick-5: #ea580c;
  --m-nick-6: #7c3aed;
  --m-nick-7: #16a34a;
  --m-nick-8: #dc2626;
}

.m-card::before { display: none; }
.m-bracket { display: none; }

.m-card {
  border-radius: var(--m-radius);
  box-shadow: 0 1px 2px rgba(0,0,0,0.04), 0 4px 16px rgba(0,0,0,0.06);
}
.m-head { border-bottom-color: var(--m-border); background: var(--m-card); }
.m-head .m-chan { color: var(--m-primary); }
.m-head .m-status.online { background: #22c55e; box-shadow: 0 0 6px #22c55e; }

.m-nick { font-weight: 600; }
.m-nick::before, .m-nick::after { content: ""; }
.m-nick::after { content: ":"; color: var(--m-muted); font-weight: 400; margin-right: 4px; }
.m-ts { font-size: 11px; opacity: 0.7; }

.m-stream::-webkit-scrollbar-thumb { background: var(--m-border); }
.m-stream::-webkit-scrollbar-track { background: var(--m-card); }

.m-input textarea, .m-join input {
  border-radius: calc(var(--m-radius) - 2px);
  background: var(--m-bg);
}
.m-btn {
  border-radius: calc(var(--m-radius) - 2px);
  text-transform: none;
  letter-spacing: 0;
  font-weight: 600;
}
.m-close {
  border-radius: 6px;
  background: var(--m-card);
}

/* Light skin needs darker launcher pill border for contrast on white pages */
.m-launcher {
  box-shadow: 0 1px 3px rgba(0,0,0,0.1), 0 0 12px rgba(79, 70, 229, 0.15);
}
.m-launcher:hover {
  box-shadow: 0 2px 8px rgba(0,0,0,0.12), 0 0 18px rgba(79, 70, 229, 0.25);
}
`;var y={default:"","retro-irc-1990":b,terminal:v,"minimal-dark":x,"minimal-light":k},p={mintUrl:"https://rooffhgbxafyjcwmwpsy.supabase.co/functions/v1/mirc-embed-token",edgeUrl:"wss://mosadd-edge.mr-brics-33.workers.dev",position:"inline",skin:"default",locale:"en",launcherPosition:"br"},w=3e4,I=8,E={en:{join_label:"JOIN ANONYMOUSLY \u2014 PICK A NICK",join_placeholder:"e.g. Jane_from_Boston",join_button:"JOIN",input_placeholder:"Say something\u2026",connecting:"Connecting\u2026",queued:"This channel is at capacity. The creator can upgrade for more \u2014 please try again later.",error_origin:"This domain isn't authorized for this embed.",error_key:"This embed key is invalid.",sys_joined:"Joined the channel.",sys_disconnected:"Disconnected. Reconnecting\u2026",powered:"powered by"},pl:{join_label:"DO\u0141\u0104CZ ANONIMOWO \u2014 PODAJ NICK",join_placeholder:"np. Janek_z_Krakowa",join_button:"WEJD\u0179",input_placeholder:"Napisz co\u015B\u2026",connecting:"\u0141\u0105czenie\u2026",queued:"Kana\u0142 osi\u0105gn\u0105\u0142 limit. Tw\xF3rca mo\u017Ce zwi\u0119kszy\u0107 plan \u2014 spr\xF3buj p\xF3\u017Aniej.",error_origin:"Ta domena nie jest autoryzowana dla tego embeda.",error_key:"Klucz embeda jest nieprawid\u0142owy.",sys_joined:"Do\u0142\u0105czono do kana\u0142u.",sys_disconnected:"Roz\u0142\u0105czono. \u0141\u0105czenie ponownie\u2026",powered:"powered by"}};function c(r,e){return E[r]?.[e]??E.en[e]??e}function N(r,e){let t=`mosadd:embed:${r.slice(0,24)}:${e}`;return {getNick:()=>M(`${t}:nick`),setNick:n=>C(`${t}:nick`,n),getSub:()=>M(`${t}:sub`),setSub:n=>C(`${t}:sub`,n)}}function M(r){try{return localStorage.getItem(r)}catch{return null}}function C(r,e){try{localStorage.setItem(r,e);}catch{}}function O(r){let e=0;for(let t=0;t<r.length;t++)e=e*31+r.charCodeAt(t)|0;return Math.abs(e)%I+1}function P(r){let e=new Date(r),t=String(e.getHours()).padStart(2,"0"),n=String(e.getMinutes()).padStart(2,"0");return `[${t}:${n}]`}function i(r,e,t){let n=document.createElement(r);return e&&(n.className=e),t!==void 0&&(n.textContent=t),n}function $(r,e){let t=r.dataset,n=t.mode==="launcher"?"launcher":"inline",o=(()=>{let a=(t.launcherPosition||p.launcherPosition).toLowerCase();return ["br","bl","tr","tl"].includes(a)?a:"br"})();return {pk:e,channel:t.channel||"default",position:(t.position||p.position).toLowerCase(),skin:(t.skin||p.skin).toLowerCase(),mintUrl:t.mintUrl||p.mintUrl,edgeUrl:t.edgeUrl||p.edgeUrl,anon:t.anon!=="false",locale:(t.locale||p.locale).toLowerCase(),title:t.title,mode:n,launcherPosition:o,launcherLabel:t.launcherLabel}}async function A(r,e){try{let t=r.replace(/^ws/,"http"),n=await fetch(`${t}/c/${encodeURIComponent(e)}/presence`,{method:"GET"});if(!n.ok)return null;let o=await n.json();return {count:typeof o.count=="number"?o.count:0,status:o.status??"open"}}catch{return null}}var u=class{constructor(e,t){this.launcherEl=null;this.launcherDotEl=null;this.launcherCountEl=null;this.panelOpen=false;this.presencePollHandle=null;this.onlineCount=0;this.ws=null;this.mint=null;this.nick="";this.reconnectAttempts=0;this.host=e,this.cfg=$(e,t),this.storage=N(this.cfg.pk,this.cfg.channel),this.shadow=e.attachShadow({mode:"open"});let n=i("style");n.textContent=g,this.shadow.appendChild(n);let o=y[this.cfg.skin];if(o===void 0)console.warn(`[mosadd-embed] unknown data-skin="${this.cfg.skin}". Available: ${Object.keys(y).join(", ")}. Using default.`);else if(o){let a=i("style");a.textContent=o,this.shadow.appendChild(a);}this.mount(),this.cfg.mode==="launcher"?(this.mountLauncher(),this.cardEl.style.display="none",this.refreshPresence(),this.presencePollHandle=window.setInterval(()=>{this.refreshPresence();},w)):this.restore();}mount(){let e=this.cfg.mode==="launcher"?`m-pos-launcher m-launcher-pos-${this.cfg.launcherPosition}`:`m-pos-${this.cfg.position}`;this.root=i("div",`m-root ${e}`);let t=i("div","m-card");this.cardEl=t;for(let s of ["tl","tr","bl","br"])t.appendChild(i("div",`m-bracket ${s}`));let n=i("div","m-head");this.headStatusEl=i("span","m-status connecting");let o=i("span","m-title");if(o.innerHTML=`${this.cfg.title??"mIRC"} <span class="m-chan">#${U(this.cfg.channel)}</span>`,n.appendChild(this.headStatusEl),n.appendChild(o),this.cfg.mode==="launcher"){let s=i("button","m-close");s.type="button",s.innerHTML="\xD7",s.setAttribute("aria-label","Close chat"),s.addEventListener("click",()=>this.collapse()),n.appendChild(s);}t.appendChild(n),this.streamEl=i("div","m-stream"),t.appendChild(this.streamEl),this.joinEl=i("div","m-join");let a=i("label","",c(this.cfg.locale,"join_label")),l=i("div","m-row"),m=i("input");m.placeholder=c(this.cfg.locale,"join_placeholder"),m.autocomplete="off",m.maxLength=32;let f=i("button","m-btn",c(this.cfg.locale,"join_button"));m.addEventListener("keydown",s=>{s.key==="Enter"&&(s.preventDefault(),f.click());}),f.addEventListener("click",()=>this.handleJoin(m.value)),l.appendChild(m),l.appendChild(f),this.joinEl.appendChild(a),this.joinEl.appendChild(l),t.appendChild(this.joinEl),this.inputEl=i("div","m-input"),this.inputEl.style.display="none";let d=i("textarea");d.placeholder=c(this.cfg.locale,"input_placeholder"),d.rows=1,d.addEventListener("keydown",s=>{s.key==="Enter"&&!s.shiftKey&&(s.preventDefault(),this.handleSend(d.value),d.value="");}),this.inputEl.appendChild(d),t.appendChild(this.inputEl),this.badgeEl=i("div","m-badge"),this.badgeEl.innerHTML=`${c(this.cfg.locale,"powered")} <a href="https://mosadd.dev" target="_blank" rel="noopener">mosadd</a>`,t.appendChild(this.badgeEl),this.root.appendChild(t),this.shadow.appendChild(this.root);}mountLauncher(){let e=i("button","m-launcher");e.type="button";let t=i("span","m-launcher-dot"),n=i("span","m-launcher-label"),o=this.cfg.launcherLabel??`mIRC #${this.cfg.channel}`;n.textContent=o;let a=i("span","m-launcher-sep");a.textContent="\xB7";let l=i("span","m-launcher-count");l.textContent="\u2014",e.appendChild(t),e.appendChild(n),e.appendChild(a),e.appendChild(l),e.addEventListener("click",()=>this.expand()),this.launcherEl=e,this.launcherDotEl=t,this.launcherCountEl=l,this.root.appendChild(e);}setOnlineCount(e){this.onlineCount=Math.max(0,Math.floor(e)),this.launcherCountEl&&(this.launcherCountEl.textContent=this.onlineCount>=100?"99+ online":`${this.onlineCount} online`,this.launcherDotEl&&this.launcherDotEl.classList.toggle("active",this.onlineCount>0));}async refreshPresence(){if(this.panelOpen)return;let e=await A(this.cfg.edgeUrl,this.cfg.channel);e&&this.setOnlineCount(e.count);}expand(){this.panelOpen||(this.panelOpen=true,this.launcherEl&&(this.launcherEl.style.display="none"),this.cardEl.style.display="",this.root.classList.add("m-launcher-open"),this.presencePollHandle!==null&&(clearInterval(this.presencePollHandle),this.presencePollHandle=null),this.restore());}collapse(){this.panelOpen&&(this.panelOpen=false,this.cardEl.style.display="none",this.launcherEl&&(this.launcherEl.style.display=""),this.root.classList.remove("m-launcher-open"),(!this.ws||this.ws.readyState!==WebSocket.OPEN)&&this.presencePollHandle===null&&(this.presencePollHandle=window.setInterval(()=>{this.refreshPresence();},w)));}restore(){let e=this.storage.getNick();e&&this.handleJoin(e);}handleJoin(e){let t=e.trim().slice(0,32);t&&(this.nick=t,this.storage.setNick(t),this.joinEl.style.display="none",this.inputEl.style.display="flex",this.sysMessage(c(this.cfg.locale,"sys_joined")),this.connect());}async connect(){this.setStatus("connecting");try{let e=this.storage.getSub()??null,t={pk:this.cfg.pk,channel_id:this.cfg.channel};e&&(t.sub=e);let n=await fetch(this.cfg.mintUrl,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(t)}),o=await n.json().catch(()=>null);if(!n.ok||!o||!("token"in o)){let l=o?.error??`http_${n.status}`;this.handleMintError(l);return}this.mint=o,this.storage.setSub(o.sub),o.badge_required||(this.badgeEl.style.display="none");let a=`${this.cfg.edgeUrl}/c/${encodeURIComponent(this.cfg.channel)}/ws`;this.ws=new WebSocket(a,["mosadd.v1",`bearer.${o.token}`]),this.ws.addEventListener("open",()=>{this.setStatus("online"),this.reconnectAttempts=0;}),this.ws.addEventListener("message",l=>this.onWsMessage(l)),this.ws.addEventListener("close",()=>this.onWsClose()),this.ws.addEventListener("error",()=>this.setStatus("error"));}catch{this.handleMintError("network");}}handleMintError(e){e==="plan_exhausted"?this.sysMessage(c(this.cfg.locale,"queued")):e==="origin_not_allowed"?this.sysMessage(c(this.cfg.locale,"error_origin")):e==="invalid_key"?this.sysMessage(c(this.cfg.locale,"error_key")):this.sysMessage(`error: ${e}`),this.setStatus("error");}onWsMessage(e){if(typeof e.data!="string")return;let t;try{t=JSON.parse(e.data);}catch{return}if(t){if(t.type==="presence"&&typeof t.count=="number"){this.setOnlineCount(t.count);return}!t.id||typeof t.text!="string"||this.renderMessage(t);}}onWsClose(){this.setStatus("connecting"),this.sysMessage(c(this.cfg.locale,"sys_disconnected"));let e=Math.min(16e3,1e3*Math.pow(2,this.reconnectAttempts));this.reconnectAttempts++,window.setTimeout(()=>{this.connect();},e);}handleSend(e){let t=e.trim();if(!(!t||!this.ws||this.ws.readyState!==WebSocket.OPEN))try{this.ws.send(JSON.stringify({text:t,from:this.nick}));}catch{}}renderMessage(e){let t=this.isStreamAtBottom(),n=i("div","m-msg"),o=e.from??"anon";n.dataset.nickColor=String(O(o));let a=i("span","m-ts",P(e.ts)),l=i("span","m-nick",o),m=i("span","m-text",e.text);n.appendChild(a),n.appendChild(l),n.appendChild(m),this.streamEl.appendChild(n),t&&this.scrollToBottom();}sysMessage(e){let t=i("div","m-sys",e);this.streamEl.appendChild(t),this.scrollToBottom();}setStatus(e){this.headStatusEl.className=`m-status ${e}`;}isStreamAtBottom(){let e=this.streamEl;return e.scrollHeight-e.scrollTop-e.clientHeight<40}scrollToBottom(){this.streamEl.scrollTop=this.streamEl.scrollHeight;}};function U(r){return r.replace(/[&<>"']/g,e=>e==="&"?"&amp;":e==="<"?"&lt;":e===">"?"&gt;":e==='"'?"&quot;":"&#39;")}var B="0.1.0";function T(){let r=document.currentScript;if(r?.dataset?.key)return r.dataset.key;let e=Array.from(document.getElementsByTagName("script"));for(let t of e)if(t.src&&/\/(v1)\.js(\?|$)/.test(t.src)&&t.dataset?.key)return t.dataset.key;return null}function W(){let r=new Set,e=[],t=o=>{r.has(o)||(r.add(o),e.push(o));},n=document.getElementById("mosadd-mirc");return n&&t(n),document.querySelectorAll("[data-mosadd-mirc]").forEach(t),document.querySelectorAll('[data-mosadd-embed="mirc"]').forEach(t),e}var h=null,L=new WeakSet;function H(r){if(L.has(r))return null;if(h||(h=T()),!h)return console.warn("[mosadd-embed] missing data-key on the <script> tag \u2014 widget not mounted."),null;try{let e=new u(r,h);return L.add(r),e}catch(e){return console.error("[mosadd-embed] mount failed:",e),null}}function S(){if(h=T(),!h){console.warn('[mosadd-embed] missing data-key on the <script> tag \u2014 set <script src="\u2026/v1.js" data-key="m_pk_live_\u2026">.');return}for(let r of W())H(r);}var J={mount:H,version:B};document.readyState==="loading"?document.addEventListener("DOMContentLoaded",S,{once:true}):queueMicrotask(S);var re=J;
return re;})();//# sourceMappingURL=v1.js.map
//# sourceMappingURL=v1.js.map