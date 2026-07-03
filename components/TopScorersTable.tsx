"use client";

// components/TopScorersTable.tsx
//
// Bảng xếp hạng Vua phá lưới — gom từ match_goals (vòng bảng + vòng loại trực tiếp).
// Tự cập nhật realtime khi có bàn thắng mới được nhập (subscribe trực tiếp
// bảng match_goals rồi refetch view top_scorers, vì Realtime không phát trên view).

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { supabaseUntyped } from "@/lib/supabase-untyped";
import type { TopScorerRow } from "@/types/top-scorers";

async function fetchTopScorers(): Promise<TopScorerRow[]> {
  const { data, error } = await supabaseUntyped
    .from("top_scorers")
    .select("*")
    .order("goals", { ascending: false });

  if (error) {
    console.error("Không tải được bảng xếp hạng vua phá lưới:", error.message);
    return [];
  }
  return (data ?? []) as TopScorerRow[];
}

export default function TopScorersTable({ initialScorers }: { initialScorers: TopScorerRow[] }) {
  const [scorers, setScorers] = useState<TopScorerRow[]>(initialScorers);

  useEffect(() => {
    const channel = supabase
      .channel("top_scorers_changes")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "match_goals" },
        async () => {
          setScorers(await fetchTopScorers());
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  if (scorers.length === 0) {
    return (
      <p className="text-slate-400">
        Chưa có dữ liệu bàn thắng nào. Chạy migration vòng bảng rồi{" "}
        <code className="text-slate-500">npm run seed:group-goals</code> để nạp từ
        openfootball/worldcup.json.
      </p>
    );
  }

  // Xếp hạng: cùng số bàn thì cùng hạng (kiểu 1-1-3)
  let rank = 0;
  let prevGoals: number | null = null;

  return (
    <div className="overflow-x-auto rounded-lg border border-slate-700">
      <table className="w-full min-w-[560px] text-left text-sm">
        <thead className="bg-slate-800 text-slate-400">
          <tr>
            <th className="px-4 py-3 font-medium">Hạng</th>
            <th className="px-4 py-3 font-medium">Cầu thủ</th>
            <th className="px-4 py-3 font-medium">Đội tuyển</th>
            <th className="px-4 py-3 text-center font-medium">Bàn thắng</th>
            <th className="px-4 py-3 text-center font-medium">Trong đó pen.</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-800">
          {scorers.map((s, idx) => {
            if (s.goals !== prevGoals) {
              rank = idx + 1;
              prevGoals = s.goals;
            }
            return (
              <tr key={s.scorer_key} className="bg-slate-900 hover:bg-slate-800/60">
                <td className="px-4 py-3 font-semibold text-slate-400">
                  {rank === 1 ? "🥇" : rank === 2 ? "🥈" : rank === 3 ? "🥉" : rank}
                </td>
                <td className="px-4 py-3 font-medium text-slate-100">{s.player_name}</td>
                <td className="px-4 py-3">
                  <span className="inline-flex items-center gap-2 text-slate-300">
                    {s.team_flag_url && (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={s.team_flag_url} alt={s.team_name} className="h-4 w-6 rounded-sm object-cover" />
                    )}
                    {s.team_name}
                  </span>
                </td>
                <td className="px-4 py-3 text-center text-lg font-bold tabular-nums text-emerald-400">
                  {s.goals}
                </td>
                <td className="px-4 py-3 text-center text-slate-500">
                  {s.penalty_goals > 0 ? s.penalty_goals : "—"}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
