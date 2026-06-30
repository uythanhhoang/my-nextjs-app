import type { Honour } from "@/lib/queries/team";

export default function HonoursTimeline({ honours }: { honours: Honour[] }) {
  if (honours.length === 0) return null;

  return (
    <section className="mx-auto max-w-5xl px-6 py-10">
      <h2 className="mb-4 text-xl font-bold uppercase tracking-tight text-white sm:text-2xl">
        Danh hiệu
      </h2>
      <div className="space-y-3">
        {honours.map((honour) => (
          <div
            key={honour.id}
            className="flex flex-col gap-2 rounded-xl bg-slate-800 p-4 ring-1 ring-white/5 sm:flex-row sm:items-center sm:justify-between"
          >
            <div className="flex items-center gap-3">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-emerald-500 text-base font-extrabold text-slate-900">
                {honour.title_count}×
              </span>
              <p className="font-semibold text-white">{honour.competition}</p>
            </div>
            {honour.years && (
              <p className="text-xs text-slate-500 sm:text-right">
                {honour.years.split(",").join(" · ")}
              </p>
            )}
          </div>
        ))}
      </div>
    </section>
  );
}
