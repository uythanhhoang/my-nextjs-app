"use client";

import { useMemo, useState } from "react";
import { layoutFormation } from "@/lib/formation";
import FormationPitch from "./FormationPitch";
import type { Player } from "@/lib/queries/team";

type Formation = "4-3-3" | "4-2-3-1";
const FORMATIONS: Formation[] = ["4-3-3", "4-2-3-1"];

export default function StartingXI({ players }: { players: Player[] }) {
  const [formation, setFormation] = useState<Formation>("4-3-3");
  const starters = useMemo(() => players.filter((p) => p.is_starting), [players]);
  const pitchPlayers = useMemo(
    () => layoutFormation(starters, formation),
    [starters, formation]
  );

  if (starters.length === 0) return null;

  return (
    <section className="mx-auto max-w-5xl px-6 py-10">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-xl font-bold uppercase tracking-tight text-white sm:text-2xl">
          ⚽ Đội hình xuất phát
        </h2>
        <div
          role="group"
          aria-label="Sơ đồ chiến thuật"
          className="flex gap-1 rounded-full bg-slate-800 p-1 ring-1 ring-white/5"
        >
          {FORMATIONS.map((f) => (
            <button
              key={f}
              type="button"
              onClick={() => setFormation(f)}
              aria-pressed={formation === f}
              className={`rounded-full px-3 py-1 text-xs font-semibold transition-colors ${
                formation === f
                  ? "bg-emerald-500 text-slate-900"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      <div className="overflow-hidden rounded-2xl ring-1 ring-white/5">
        <div className="aspect-[10/13] w-full">
          <FormationPitch players={pitchPlayers} />
        </div>
      </div>

      <p className="mt-2 flex items-center gap-2 text-xs text-slate-500">
        <span className="inline-block h-2.5 w-2.5 rounded-full bg-emerald-400" />
        Đội trưởng
      </p>
    </section>
  );
}
