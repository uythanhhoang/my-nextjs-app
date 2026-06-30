import type { PitchPlayer } from "@/lib/formation";

const PITCH_W = 100;
const PITCH_H = 140;
const PAD = 6;
const PLAY_H = PITCH_H - PAD * 2;

function svgY(pct: number) {
  return PAD + (pct / 100) * PLAY_H;
}

export default function FormationPitch({ players }: { players: PitchPlayer[] }) {
  return (
    <svg
      viewBox={`0 0 ${PITCH_W} ${PITCH_H}`}
      className="h-full w-full"
      aria-label="Đội hình xuất phát trên sân"
      role="img"
    >
      {/* Grass */}
      <rect width={PITCH_W} height={PITCH_H} fill="#14532d" />
      {/* Mown stripes */}
      {Array.from({ length: 8 }).map((_, i) => (
        <rect
          key={i}
          x={0}
          y={(i * PITCH_H) / 8}
          width={PITCH_W}
          height={PITCH_H / 8}
          fill={i % 2 === 0 ? "rgba(255,255,255,0.025)" : "transparent"}
        />
      ))}

      {/* Pitch markings */}
      <g stroke="rgba(255,255,255,0.5)" strokeWidth={0.5} fill="none">
        {/* Border */}
        <rect x={3} y={PAD} width={PITCH_W - 6} height={PLAY_H} />
        {/* Halfway */}
        <line x1={3} y1={PITCH_H / 2} x2={PITCH_W - 3} y2={PITCH_H / 2} />
        {/* Centre circle */}
        <circle cx={PITCH_W / 2} cy={PITCH_H / 2} r={11} />
        <circle cx={PITCH_W / 2} cy={PITCH_H / 2} r={0.7} fill="rgba(255,255,255,0.5)" stroke="none" />
        {/* Own penalty box (bottom) */}
        <rect x={23} y={PITCH_H - PAD - 22} width={54} height={22} />
        <rect x={36} y={PITCH_H - PAD - 8} width={28} height={8} />
        <path d={`M 32 ${PITCH_H - PAD - 22} A 11 11 0 0 1 68 ${PITCH_H - PAD - 22}`} />
        {/* Attacking penalty box (top) */}
        <rect x={23} y={PAD} width={54} height={22} />
        <rect x={36} y={PAD} width={28} height={8} />
        <path d={`M 32 ${PAD + 22} A 11 11 0 0 0 68 ${PAD + 22}`} />
      </g>

      {/* Players */}
      {players.map((p) => {
        const cx = p.x;
        const cy = svgY(p.y);
        return (
          <g key={p.id}>
            <circle
              cx={cx}
              cy={cy}
              r={4.5}
              fill={p.is_captain ? "#34d399" : "#f1f5f9"}
              stroke="#0f172a"
              strokeWidth={0.6}
            />
            <text
              x={cx}
              y={cy + 1.5}
              textAnchor="middle"
              fontSize={3.4}
              fontWeight={700}
              fill="#0f172a"
            >
              {p.jersey_number ?? ""}
            </text>
            <text
              x={cx}
              y={cy + 8.5}
              textAnchor="middle"
              fontSize={2.6}
              fill="#e2e8f0"
            >
              {lastName(p.full_name)}
            </text>
          </g>
        );
      })}
    </svg>
  );
}

function lastName(name: string) {
  const parts = name.trim().split(/\s+/);
  return parts[parts.length - 1];
}
