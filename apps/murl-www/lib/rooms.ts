// Deterministic per-nick accent hue — mirrors the extension's idea (FNV-ish
// hash → one of the room-* palette slots). Decoration only; green stays primary.

const ROOM_HUES = [
  'var(--room-1)',
  'var(--room-2)',
  'var(--room-3)',
  'var(--room-4)',
  'var(--room-5)',
  'var(--room-6)',
];

export function nickColor(nick: string): string {
  let h = 2166136261;
  for (let i = 0; i < nick.length; i++) {
    h ^= nick.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  const idx = Math.abs(h) % ROOM_HUES.length;
  return `hsl(${ROOM_HUES[idx]})`;
}

export function initials(nick: string): string {
  const parts = nick.split(/[-_ ]/).filter(Boolean);
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
  return nick.slice(0, 2).toUpperCase();
}
