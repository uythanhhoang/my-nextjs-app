import type { QualMatch } from "@/lib/queries/team";

type Result = "W" | "D" | "L";

const RESULT_STYLE: Record<Result, string> = {
  W: "bg-emerald-500/15 text-emerald-400 ring-emerald-500/30",
  D: "bg-slate-500/15 text-slate-300 ring-slate-500/30",
  L: "bg-red-500/15 text-red-400 ring-red-500/30",
};

const RESULT_LABEL: Record<Result, string> = { W: "Thắng", D: "Hòa", L: "Thua" };

export default function QualificationJourney({ matches }: { matches: QualMatch[] }) {
  if (matches.length === 0) return null;

  return (
    <section className="mx-auto max-w-5xl px-6 py-10">
      <h2 className="mb-4 text-xl font-bold uppercase tracking-tight text-white sm:text-2xl">
        Hành trình vòng loại
      </h2>
      <div
        className="flex gap-4 overflow-x-auto pb-2"
        style={{ scrollbarWidth: "thin" }}
      >
        {matches.map((match) => (
          <article
            key={match.id}
            className="flex w-56 shrink-0 flex-col gap-3 rounded-xl bg-slate-800 p-4 ring-1 ring-white/5"
          >
            <div className="flex items-center justify-between">
              <time className="text-[11px] uppercase tracking-wide text-slate-500">
                {formatDate(match.match_date)}
              </time>
              {match.result && (
                <span
                  className={`rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase ring-1 ${RESULT_STYLE[match.result]}`}
                >
                  {RESULT_LABEL[match.result]}
                </span>
              )}
            </div>

            <div>
              <p className="text-xs text-slate-500">
                {match.is_home ? "Sân nhà" : "Sân khách"} gặp
              </p>
              <p className="text-base font-semibold leading-tight text-white">
                {match.opponent}
              </p>
            </div>

            {match.home_score !== null && match.away_score !== null ? (
              <p className="text-3xl font-extrabold text-emerald-400">
                {match.home_score}–{match.away_score}
              </p>
            ) : (
              <p className="text-sm text-slate-500">Chưa thi đấu</p>
            )}

            <div className="mt-auto space-y-0.5 text-[11px] text-slate-500">
              {match.competition && <p>{match.competition}</p>}
              {match.venue && <p className="truncate">{match.venue}</p>}
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("vi-VN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}
