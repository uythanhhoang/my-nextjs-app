import Image from "next/image";
import Link from "next/link";
import type { Tables } from "@/supabase_types";

type Team = Tables<"teams">;

export default function TeamCard({ team }: { team: Team }) {
  return (
    <Link
      href={`/team/${team.id}`}
      className="block bg-slate-800 border border-slate-700 rounded-2xl p-5 hover:bg-slate-700 transition transform hover:scale-[1.02]"
    >

      <div className="flex items-center gap-4">

        {team.logo_url ? (
          <Image
            src={team.logo_url ?? "/placeholder.png"}
            alt={team.name}
            width={48}
            height={32}
            className="rounded-md"
          />
        ) : (
          <div className="flex h-12 w-16 items-center justify-center rounded bg-slate-700 text-xs font-semibold text-slate-300">
            {team.name.slice(0, 3).toUpperCase()}
          </div>
        )}

        <div>
          <h2 className="text-xl font-semibold">{team.name}</h2>
          <p className="text-sm text-slate-400">World Cup 2026</p>
        </div>

      </div>

    </Link>
  );
}
