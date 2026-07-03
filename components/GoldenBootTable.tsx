"use client";

// components/GoldenBootTable.tsx
//
// Top 10 Vua phá lưới World Cup 2026 — tính từ Vòng bảng đến hiện tại.
// Vòng bảng: số liệu tổng hợp (group_stage_goal_tallies), tổng hợp từ nhiều
// nguồn báo (Goal.com, TNT Sports, FOX Sports...), không có breakdown từng
// bàn/phút. Vòng 32 đội trở đi: dữ liệu chi tiết từng bàn (match_goals).
// Tự cập nhật realtime khi có thay đổi ở 1 trong 2 bảng nguồn.

import { useEffect, useState } from "react";
import { supabaseUntyped } from "@/lib/supabase-untyped";
import type { GoldenBootRow } from "@/types/golden-boot";

async function fetchGoldenBoot(): Promise<GoldenBootRow[]> {
  const { data, error } = await supabaseUntyped
    .from("golden_boot_top10")
    .select("*");

  if (error) {
    console.error("Không tải được bảng Vua phá lưới:", error.message);
    return [];
  }
  return (data ?? []) as GoldenBootRow[];
}

export default function GoldenBootTable({ initialRows }: { initialRows: GoldenBootRow[] }) {
  const [rows, setRows] = useState<GoldenBootRow[]>(initialRows);

  useEffect(() => {
    const refetch = async () => setRows(await fetchGoldenBoot());
    const channel = supabaseUntyped
      .channel("golden_boot_changes")
      .on("postgres_changes", { event: "*", schema: "public", table: "match_goals" }, refetch)
      .on("postgres_changes", { event: "*", schema: "public", table: "group_stage_goal_tallies" }, refetch)
      .subscribe();

    return () => {
      supabaseUntyped.removeChannel(channel);
    };
  }, []);

  if (rows.length === 0) {
    return <p className="text-slate-400">Chưa có dữ liệu bàn thắng.</p>;
  }

  let rank = 0;
  let prevGoals: number | null = null;

  return (
    <div className="overflow-x-auto rounded-lg border border-slate-700">
      <table className="w-full min-w-[640px] text-left text-sm">
        <thead className="bg-slate-800 text-slate-400">
          <tr>
            <th className="px-4 py-3 font-medium">Hạng</th>
            <th className="px-4 py-3 font-medium">Cầu thủ</th>
            <th className="px-4 py-3 font-medium">Đội tuyển</th>
            <th className="px-4 py-3 text-center font-medium">Vòng bảng</th>
            <th className="px-4 py-3 text-center font-medium">Vòng 32+</th>
            <th className="px-4 py-3 text-center font-medium">Tổng bàn</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-800">
          {rows.map((r, idx) => {
            if (r.total_goals !== prevGoals) {
              rank = idx + 1;
              prevGoals = r.total_goals;
            }
            return (
              <tr key={`${r.player_name}-${r.team_id}`} className="bg-slate-900 hover:bg-slate-800/60">
                <td className="px-4 py-3 font-semibold text-slate-400">
                  {rank === 1 ? "🥇" : rank === 2 ? "🥈" : rank === 3 ? "🥉" : rank}
                </td>
                <td className="px-4 py-3 font-medium text-slate-100">{r.player_name}</td>
                <td className="px-4 py-3">
                  <span className="inline-flex items-center gap-2 text-slate-300">
                    {r.team_flag_url && (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={r.team_flag_url} alt={r.team_name} className="h-4 w-6 rounded-sm object-cover" />
                    )}
                    {r.team_name}
                  </span>
                </td>
                <td className="px-4 py-3 text-center text-slate-400">{r.group_stage_goals}</td>
                <td className="px-4 py-3 text-center text-slate-400">{r.knockout_goals}</td>
                <td className="px-4 py-3 text-center text-lg font-bold tabular-nums text-emerald-400">
                  {r.total_goals}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
      <p className="border-t border-slate-800 px-4 py-3 text-xs text-slate-500">
        ⚠️ Số bàn Vòng bảng là số liệu tổng hợp từ nhiều nguồn báo, chưa có breakdown chi tiết
        từng bàn/phút như dữ liệu Vòng 32 đội trở đi.
      </p>
    </div>
  );
}
