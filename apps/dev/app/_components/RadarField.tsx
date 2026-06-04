// Threat-radar visual — ported from m0ssad-3 apps/web LandingRadar, dependency-free.
// Concentric rings + crosshair + conic-gradient sweep + ping + category blips +
// center mark. All motion via global.css classes (radar-sweep-el / radar-ping-el /
// radar-blip) so prefers-reduced-motion disables it. Pure CSS — no RAF, no lucide.

const C = 'var(--primary)';

// DECK threat categories (sigint/comint/masint/cyber/behav/priv) — same labels as .com.
const BLIPS: { angle: number; dist: number; label: string; color: string }[] = [
  { angle: 15, dist: 34, label: 'IMSI', color: 'var(--sigint)' },
  { angle: 130, dist: 38, label: 'STINGRAY', color: 'var(--sigint)' },
  { angle: 270, dist: 28, label: 'RF JAM', color: 'var(--sigint)' },
  { angle: 200, dist: 30, label: 'SS7', color: 'var(--comint)' },
  { angle: 80, dist: 20, label: 'VoIP', color: 'var(--comint)' },
  { angle: 305, dist: 36, label: 'TEMPEST', color: 'var(--masint)' },
  { angle: 150, dist: 24, label: 'GEOFENCE', color: 'var(--masint)' },
  { angle: 55, dist: 42, label: 'PEGASUS', color: 'var(--destructive)' },
  { angle: 235, dist: 40, label: 'HOOK', color: 'var(--destructive)' },
  { angle: 340, dist: 26, label: 'CAMERA', color: 'var(--warning)' },
  { angle: 100, dist: 38, label: 'EXFIL', color: 'var(--warning)' },
  { angle: 180, dist: 18, label: 'DNS', color: C },
  { angle: 290, dist: 18, label: 'MITM', color: C },
];

export function RadarField() {
  return (
    <div className="relative h-full w-full select-none">
      {/* concentric rings */}
      {[0, 1, 2, 3, 4, 5, 6].map((i) => (
        <div
          key={i}
          className="absolute rounded-full border"
          style={{
            width: `${100 - i * 14}%`,
            height: `${100 - i * 14}%`,
            top: `${i * 7}%`,
            left: `${i * 7}%`,
            borderColor: `hsl(${C} / ${0.04 + i * 0.012})`,
          }}
        />
      ))}

      {/* crosshair */}
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="absolute h-px w-full" style={{ background: `hsl(${C} / 0.06)` }} />
        <div className="absolute h-full w-px" style={{ background: `hsl(${C} / 0.06)` }} />
      </div>

      {/* rotating conic-gradient sweep */}
      <div
        className="radar-sweep-el absolute inset-[8%] rounded-full"
        style={{
          background: `conic-gradient(from 0deg, transparent 0deg, hsl(${C} / 0.16) 22deg, hsl(${C} / 0.04) 55deg, transparent 95deg)`,
        }}
      />

      {/* center ping */}
      <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
        <div className="radar-ping-el h-16 w-16 rounded-full border" style={{ borderColor: `hsl(${C} / 0.4)` }} />
      </div>

      {/* threat blips */}
      {BLIPS.map((b, i) => {
        const rad = (b.angle * Math.PI) / 180;
        const x = 50 + b.dist * Math.cos(rad);
        const y = 50 + b.dist * Math.sin(rad);
        return (
          <div
            key={b.label}
            className="radar-blip absolute flex flex-col items-center"
            style={{ left: `${x}%`, top: `${y}%`, transform: 'translate(-50%,-50%)', animationDelay: `${i * 180}ms` }}
          >
            <span
              className="block rounded-full"
              style={{
                width: 8,
                height: 8,
                background: `hsl(${b.color} / 0.25)`,
                border: `1.5px solid hsl(${b.color} / 0.7)`,
                boxShadow: `0 0 8px 1px hsl(${b.color} / 0.3)`,
              }}
            />
            <span
              className="mt-1 whitespace-nowrap text-[8px] font-bold tracking-[0.18em]"
              style={{ color: `hsl(${b.color} / 0.78)` }}
            >
              {b.label}
            </span>
          </div>
        );
      })}

      {/* center mark */}
      <div className="absolute inset-0 flex items-center justify-center">
        <div
          className="flex items-center justify-center rounded-full"
          style={{ width: '18%', height: '18%', background: `hsl(${C} / 0.04)`, boxShadow: `0 0 40px 8px hsl(${C} / 0.06)` }}
        >
          <svg viewBox="0 0 24 24" className="h-1/2 w-1/2" style={{ color: `hsl(${C} / 0.5)` }} fill="none" stroke="currentColor" strokeWidth="1.1">
            <circle cx="12" cy="12" r="9" />
            <circle cx="12" cy="12" r="4.5" />
            <circle cx="12" cy="12" r="1" fill="currentColor" />
          </svg>
        </div>
      </div>
    </div>
  );
}
