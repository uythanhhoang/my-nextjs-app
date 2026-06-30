import Image from "next/image";
import type { Player } from "@/lib/queries/team";

export default function Substitutes({ players }: { players: Player[] }) {
  const subs = players.filter((p) => !p.is_starting);
  if (subs.length === 0) return null;

  return (
    <section className="mx-auto max-w-5xl px-6 py-10">
      <h2 className="mb-4 text-xl font-bold uppercase tracking-tight text-white sm:text-2xl">
        Cầu thủ dự bị
      </h2>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
        {subs.map((player) => (
          <div
            key={player.id}
            className="flex flex-col items-center gap-2 rounded-xl bg-slate-800 p-4 text-center ring-1 ring-white/5 transition-transform hover:-translate-y-0.5"
          >
            <div className="relative h-16 w-16 overflow-hidden rounded-full bg-slate-900 ring-1 ring-white/10">
              {player.image_url ? (
                <Image
                  src={player.image_url}
                  alt={player.full_name}
                  fill
                  className="object-cover"
                />
              ) : (
                <span className="flex h-full w-full items-center justify-center text-sm text-slate-400">
                  {player.jersey_number ?? "–"}
                </span>
              )}
            </div>
            <div>
              <p className="text-sm font-semibold leading-tight text-white">
                {player.full_name}
              </p>
              <p className="mt-0.5 text-[11px] uppercase tracking-wide text-emerald-400">
                {player.position ?? "—"} · #{player.jersey_number ?? "—"}
              </p>
              {player.club && (
                <p className="mt-0.5 text-[11px] text-slate-500">{player.club}</p>
              )}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
