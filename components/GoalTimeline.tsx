"use client";

// components/GoalTimeline.tsx
//
// Hiển thị danh sách bàn thắng của 1 trận đấu, chia theo đội nhà / đội khách,
// sắp xếp theo thời gian. Tự cập nhật realtime khi có bàn thắng mới được thêm
// vào bảng match_goals (ví dụ khi trận đang "live" và Hoang nhập thêm bàn thắng).

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { formatGoalMinute, type MatchGoal } from "@/types/match-goals";

async function fetchGoals(matchId: string): Promise<MatchGoal[]> {
  const { data, error } = await supabase
    .from("match_goals")
    .select("*")
    .eq("match_id", matchId)
    .order("minute", { ascending: true })
    .order("minute_extra", { ascending: true, nullsFirst: true });

  if (error) {
    console.error("Không tải được danh sách bàn thắng:", error.message);
    return [];
  }
  return (data ?? []) as MatchGoal[];
}

function GoalLine({ goal, align }: { goal: MatchGoal; align: "left" | "right" }) {
  const tags = [
    goal.is_own_goal ? "(phản lưới nhà)" : null,
    goal.is_penalty ? "(pen.)" : null,
    goal.is_extra_time ? "(hiệp phụ)" : null,
  ].filter(Boolean);

  return (
    <div
      className={`flex items-center gap-2 text-sm ${
        align === "right" ? "flex-row-reverse text-right" : "text-left"
      }`}
    >
      <span className="text-emerald-400">⚽</span>
      <span className={goal.is_own_goal ? "italic text-slate-400" : "text-slate-200"}>
        {goal.player_name}
      </span>
      <span className="text-slate-500">{formatGoalMinute(goal)}</span>
      {tags.length > 0 && (
        <span className="text-xs text-slate-500">{tags.join(" ")}</span>
      )}
    </div>
  );
}

export default function GoalTimeline({
  matchId,
  homeTeamId,
  awayTeamId,
  initialGoals,
}: {
  matchId: string;
  homeTeamId: string | null;
  awayTeamId: string | null;
  initialGoals: MatchGoal[];
}) {
  const [goals, setGoals] = useState<MatchGoal[]>(initialGoals);

  useEffect(() => {
    const channel = supabase
      .channel(`match_goals_${matchId}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "match_goals", filter: `match_id=eq.${matchId}` },
        async () => {
          setGoals(await fetchGoals(matchId));
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [matchId]);

  if (goals.length === 0) {
    return (
      <p className="mt-6 text-center text-sm text-slate-500">
        Chưa có dữ liệu cầu thủ ghi bàn cho trận này.
      </p>
    );
  }

  const homeGoals = goals.filter((g) => g.team_id === homeTeamId);
  const awayGoals = goals.filter((g) => g.team_id === awayTeamId);

  return (
    <div className="mt-6 rounded-xl border border-slate-700 bg-slate-800/40 p-6">
      <h3 className="mb-4 text-center text-sm font-semibold uppercase tracking-wide text-slate-400">
        Cầu thủ ghi bàn
      </h3>
      <div className="grid grid-cols-2 gap-6">
        <div className="space-y-2">
          {homeGoals.map((g) => (
            <GoalLine key={g.id} goal={g} align="left" />
          ))}
        </div>
        <div className="space-y-2">
          {awayGoals.map((g) => (
            <GoalLine key={g.id} goal={g} align="right" />
          ))}
        </div>
      </div>
    </div>
  );
}
