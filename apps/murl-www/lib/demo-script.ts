// Demo conversation for the ExtensionDemo section — a believable live room on a
// global site during a hot ticket presale (universal, high-energy, English).
// Anonymous adjective-animal nicks, exactly like the real mURL extension mints.
// Static demo content — no backend call.

export interface DemoMsg { time: string; nick: string; text: string; host?: boolean }

export const DEMO_CHANNEL = 'ticketmaster.com';
export const DEMO_ONLINE = 1284;

export const DEMO_SCRIPT: DemoMsg[] = [
  { time: '20:01', nick: 'brave-lynx-58',  text: 'presale just opened — anyone actually getting through?' },
  { time: '20:01', nick: 'lucky-otter-77', text: 'queue position 4,000-something 😭' },
  { time: '20:02', nick: 'calm-fox-12',    text: 'refresh ONCE, do not spam it or the queue resets you' },
  { time: '20:02', nick: 'wise-heron-04',  text: 'access code from the email worked, im in' },
  { time: '20:03', nick: 'quiet-wolf-31',  text: 'which email? i never got a code' },
  { time: '20:03', nick: 'wise-heron-04',  text: 'check spam — subject is “your access code”' },
  { time: '20:04', nick: 'swift-bison-23', text: 'floor seats already gone, only upper tier left' },
  { time: '20:04', nick: 'lucky-otter-77', text: 'got 2! thank you whoever said don’t refresh 🙏' },
  { time: '20:05', nick: 'mellow-stork-46',text: 'still stuck at 9,000… gonna miss it' },
  { time: '20:05', nick: 'calm-fox-12',    text: 'hang in there, they drop more seats at :15' },
  { time: '20:06', nick: 'brave-lynx-58',  text: 'confirmed — second batch just dropped, go go go' },
  { time: '20:06', nick: 'quiet-wolf-31',  text: 'IN. got the 100s. legends in here 🙌' },
];
