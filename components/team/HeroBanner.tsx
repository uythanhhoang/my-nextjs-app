import Image from "next/image";
import type { TeamOverview } from "@/lib/queries/team";

type Result = "W" | "D" | "L";

const FORM_COLOR: Record<Result, string> = {
  W: "bg-emerald-500 text-slate-900",
  D: "bg-slate-500 text-white",
  L: "bg-red-500 text-white",
};

export default function HeroBanner({
  team,
  recentForm,
}: {
  team: TeamOverview;
  recentForm: Result[];
}) {
  return (
    <section className="relative overflow-hidden bg-slate-900">
      {/* Floodlight glow */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_50%_0%,rgba(52,211,153,0.12),transparent_65%)]"
      />

      <div className="relative mx-auto max-w-5xl px-6 py-12 sm:py-16">
        {/* Top row: flag + confederation */}
        <div className="mb-5 flex flex-wrap items-center gap-3">
          {team.flag_url && (
            <span className="h-6 w-9 overflow-hidden rounded-sm shadow ring-1 ring-white/10">
              <Image
                src={team.flag_url}
                alt={`${team.name} flag`}
                width={36}
                height={24}
                className="h-full w-full object-cover"
              />
            </span>
          )}
          {team.confederation && (
            <span className="rounded-full border border-slate-700 px-2.5 py-0.5 text-[11px] font-medium uppercase tracking-widest text-slate-400">
              {team.confederation}
            </span>
          )}
          {team.founded_year && (
            <span className="text-xs text-slate-500">
              Est. {team.founded_year}
            </span>
          )}
        </div>

        {/* Logo + name */}
        <div className="flex flex-col items-start gap-5 sm:flex-row sm:items-center">
          {team.logo_url && (
            <Image
              src={team.logo_url}
              alt={`${team.name} crest`}
              width={88}
              height={88}
              className="h-20 w-20 shrink-0 object-contain sm:h-24 sm:w-24"
            />
          )}
          <div>
            <h1 className="text-4xl font-extrabold uppercase tracking-tight text-white sm:text-6xl">
              {team.name}
            </h1>
            {team.nickname && (
              <p className="mt-1 text-base italic text-slate-400">
                "{team.nickname}"
              </p>
            )}
          </div>
        </div>

        {/* Info chips */}
        <div className="mt-7 flex flex-wrap gap-3">
          {team.fifa_ranking && (
            <div className="flex items-center gap-2.5 rounded-xl bg-slate-800 px-4 py-3 ring-1 ring-white/5">
              <span className="text-2xl font-extrabold text-emerald-400">
                #{team.fifa_ranking}
              </span>
              <span className="text-xs uppercase leading-tight tracking-wide text-slate-400">
                FIFA
                <br />
                Ranking
              </span>
            </div>
          )}
          {team.coach && <Chip label="Huấn luyện viên" value={team.coach} />}
          {team.captain && <Chip label="Đội trưởng" value={team.captain} />}
          {team.home_stadium && (
            <Chip label="Sân nhà" value={team.home_stadium} />
          )}

          {/* Recent form */}
          {recentForm.length > 0 && (
            <div className="flex items-center gap-3 rounded-xl bg-slate-800 px-4 py-3 ring-1 ring-white/5">
              <span className="text-xs uppercase leading-tight tracking-wide text-slate-400">
                Phong độ
                <br />
                gần đây
              </span>
              <div className="flex gap-1">
                {[...recentForm].reverse().map((r, i) => (
                  <span
                    key={i}
                    className={`flex h-6 w-6 items-center justify-center rounded-full text-[11px] font-bold ${FORM_COLOR[r]}`}
                  >
                    {r}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Description */}
        {team.description && (
          <p className="mt-5 max-w-2xl text-sm leading-relaxed text-slate-400">
            {team.description}
          </p>
        )}
      </div>
    </section>
  );
}

function Chip({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col justify-center rounded-xl bg-slate-800 px-4 py-3 ring-1 ring-white/5">
      <span className="text-[10px] uppercase tracking-wide text-slate-500">
        {label}
      </span>
      <span className="text-sm font-semibold text-white">{value}</span>
    </div>
  );
}
