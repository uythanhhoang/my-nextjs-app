import type { TeamOverview } from "@/lib/queries/team";

export default function TeamStatistics({ team }: { team: TeamOverview }) {
  const stats: { label: string; value: string | number | null }[] = [
    { label: "Số lần tham dự", value: team.appearances },
    { label: "Thắng", value: team.wins },
    { label: "Hòa", value: team.draws },
    { label: "Thua", value: team.losses },
    { label: "Bàn thắng", value: team.goals_for },
    { label: "Bàn thua", value: team.goals_against },
    { label: "Giữ sạch lưới", value: team.clean_sheets },
    { label: "Số lần vô địch WC", value: team.world_cup_titles },
    { label: "Thành tích tốt nhất", value: team.best_finish },
  ];

  if (stats.every((s) => s.value === null || s.value === undefined)) return null;

  return (
    <section className="mx-auto max-w-5xl px-6 py-10">
      <h2 className="mb-4 text-xl font-bold uppercase tracking-tight text-white sm:text-2xl">
        Thống kê đội tuyển
      </h2>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        {stats.map((stat) => (
          <div
            key={stat.label}
            className="rounded-xl bg-slate-800 p-5 ring-1 ring-white/5"
          >
            <p className="text-xs uppercase tracking-wide text-slate-500">
              {stat.label}
            </p>
            <p className="mt-1 text-2xl font-extrabold text-emerald-400 sm:text-3xl">
              {stat.value ?? "—"}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}
