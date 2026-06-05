// Threat-radar visual — clean + subtle, matched to mosadd.com. Dependency-free,
// pure CSS (radar-sweep-el / radar-ping-el / radar-blip in global.css, so
// prefers-reduced-motion disables it). Faint rings + sweep + a few quiet blips +
// a central shield/eye security mark (the mosADD lockup).

const C = 'var(--primary)';

// A few quiet DECK blips — colored by category, no loud labels (keep it premium).
const BLIPS: { angle: number; dist: number; color: string }[] = [
  { angle: 55, dist: 42, color: 'var(--destructive)' },
  { angle: 200, dist: 32, color: 'var(--comint)' },
  { angle: 305, dist: 38, color: 'var(--masint)' },
  { angle: 130, dist: 26, color: 'var(--sigint)' },
  { angle: 340, dist: 22, color: C },
];

export function RadarField() {
  return (
    <div className="relative h-full w-full select-none">
      {/* concentric rings — very faint */}
      {[0, 1, 2, 3, 4, 5].map((i) => (
        <div
          key={i}
          className="absolute rounded-full border"
          style={{
            width: `${100 - i * 16}%`,
            height: `${100 - i * 16}%`,
            top: `${i * 8}%`,
            left: `${i * 8}%`,
            borderColor: `hsl(${C} / ${0.03 + i * 0.008})`,
          }}
        />
      ))}

      {/* crosshair */}
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="absolute h-px w-full" style={{ background: `hsl(${C} / 0.05)` }} />
        <div className="absolute h-full w-px" style={{ background: `hsl(${C} / 0.05)` }} />
      </div>

      {/* rotating sweep — soft */}
      <div
        className="radar-sweep-el absolute inset-[10%] rounded-full"
        style={{
          background: `conic-gradient(from 0deg, transparent 0deg, hsl(${C} / 0.12) 24deg, hsl(${C} / 0.03) 62deg, transparent 100deg)`,
        }}
      />

      {/* expanding ping */}
      <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
        <div className="radar-ping-el h-24 w-24 rounded-full border" style={{ borderColor: `hsl(${C} / 0.28)` }} />
      </div>

      {/* quiet blips */}
      {BLIPS.map((b, i) => {
        const r = (b.angle * Math.PI) / 180;
        const x = 50 + b.dist * Math.cos(r);
        const y = 50 + b.dist * Math.sin(r);
        return (
          <span
            key={i}
            className="radar-blip absolute block rounded-full"
            style={{
              left: `${x}%`,
              top: `${y}%`,
              transform: 'translate(-50%,-50%)',
              width: 7,
              height: 7,
              background: `hsl(${b.color} / 0.3)`,
              border: `1px solid hsl(${b.color} / 0.6)`,
              boxShadow: `0 0 8px hsl(${b.color} / 0.35)`,
              animationDelay: `${i * 220}ms`,
            }}
          />
        );
      })}

      {/* center shield + eye — the mosADD security mark (clean, no frame — matches mosadd.com) */}
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="relative flex items-center justify-center" style={{ width: '17%', height: '17%' }}>
          <svg viewBox="0 0 48 48" className="h-[70%] w-[70%]" fill="none" stroke={`hsl(${C} / 0.55)`} strokeWidth="1.4" strokeLinejoin="round">
            <path d="M24 4 L40 10 V24 C40 34 32 41 24 44 C16 41 8 34 8 24 V10 Z" />
            <ellipse cx="24" cy="23" rx="9" ry="6" stroke={`hsl(${C} / 0.72)`} strokeWidth="1.2" />
            <circle cx="24" cy="23" r="2.6" fill={`hsl(${C} / 0.72)`} stroke="none" />
          </svg>
        </div>
      </div>
    </div>
  );
}
