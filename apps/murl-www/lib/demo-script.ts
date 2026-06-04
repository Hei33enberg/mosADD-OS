// Demo conversation for the ExtensionDemo section — a believable live room on
// #strajkpolski.org. Personas + lines reused (static, verbatim-style) from the
// strajkpolski mock-bot army (C:\strajkpolski\supabase\functions\mosadd-seed),
// shown here as mURL (the chat design is identical to mIRC by design).
// No call to strajkpolski's backend — this is copied demo content.

export interface DemoMsg { time: string; nick: string; text: string; host?: boolean }

export const DEMO_CHANNEL = 'strajkpolski.org';
export const DEMO_ONLINE = 318;

export const DEMO_SCRIPT: DemoMsg[] = [
  { time: '18:40', nick: 'ziom37',        text: 'siema, ktoś z Warszawy albo z okolic?' },
  { time: '18:40', nick: 'kuba_Wwa',      text: 'jest Wwa, no nareszcie ktoś z naszych stron' },
  { time: '18:41', nick: 'wkurzony21',    text: 'kolejny rachunek za prąd i mi się odechciewa wszystkiego' },
  { time: '18:41', nick: 'mietek',        text: 'u mnie to samo, ile można serio' },
  { time: '18:42', nick: 'studentka',     text: 'na pełen etat ledwo starcza, a co dopiero student' },
  { time: '18:42', nick: 'ziom37',        text: 'to co robimy 1.08?' },
  { time: '18:43', nick: 'wkurzony21',    text: 'ja już się wpisałem, dość tego' },
  { time: '18:43', nick: 'Stanowski',     text: 'dojeni i okradani, a rząd opowiada bajki. tak czy nie tak?', host: true },
  { time: '18:44', nick: 'kierowca_Gda',  text: 'paliwo znowu drożej, normalnie cyrk' },
  { time: '18:44', nick: 'emeryt_Krk',    text: 'dawniej z emerytury dało się żyć, dziś leki i tyle' },
  { time: '18:45', nick: 'mietek',        text: '+1' },
  { time: '18:45', nick: 'Stanowski',     text: 'ratio. zaorajcie ten system — spokojnie, ale konsekwentnie 1.08', host: true },
  { time: '18:46', nick: 'studentka',     text: 'dopisuję się, jak będziemy cicho siedzieć to nic się nie zmieni' },
  { time: '18:46', nick: 'kuba_Wwa',      text: 'trzymajmy się, ekipa' },
];
