import type { Player } from "@/lib/queries/team";

const DEF = new Set(["RB", "CB", "LB", "RWB", "LWB"]);
const DEF_MID = new Set(["CDM"]);
const MID = new Set(["CM", "CAM", "RM", "LM"]);
const ATT_MID = new Set(["RW", "LW"]);
const FWD = new Set(["CF", "ST"]);

export type PitchPlayer = Player & { x: number; y: number };

export function layoutFormation(
  starters: Player[],
  formation: "4-3-3" | "4-2-3-1"
): PitchPlayer[] {
  const gk = starters.filter((p) => p.position === "GK");
  const def = starters.filter((p) => p.position && DEF.has(p.position));
  const dm = starters.filter((p) => p.position && DEF_MID.has(p.position));
  const cm = starters.filter((p) => p.position && MID.has(p.position));
  const am = starters.filter((p) => p.position && ATT_MID.has(p.position));
  const fwd = starters.filter((p) => p.position && FWD.has(p.position));

  const rows: Player[][] =
    formation === "4-2-3-1"
      ? [gk, def, dm, [...cm, ...am], fwd]
      : [gk, def, [...dm, ...cm, ...am], fwd];

  const bucketed = new Set(rows.flat().map((p) => p.id));
  const rest = starters.filter((p) => !bucketed.has(p.id));
  if (rest.length) rows.push(rest);

  const nonEmpty = rows.filter((r) => r.length > 0);
  const out: PitchPlayer[] = [];

  nonEmpty.forEach((row, ri) => {
    const y =
      nonEmpty.length === 1
        ? 50
        : 90 - (ri / (nonEmpty.length - 1)) * 78;
    row.forEach((p, ci) => {
      const x =
        row.length === 1 ? 50 : 12 + (ci / (row.length - 1)) * 76;
      out.push({ ...p, x, y });
    });
  });

  return out;
}
