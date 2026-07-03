// types/match-goals.ts
//
// Kiểu dữ liệu thủ công cho bảng match_goals (không regenerate supabase_types.ts
// để tránh phá vỡ các component đã dùng kiểu cũ — theo quy ước của dự án).

export type MatchGoal = {
  id: string;
  match_id: string;
  team_id: string;
  player_id: string | null;
  player_name: string;
  minute: number;
  minute_extra: number | null;
  is_penalty: boolean;
  is_own_goal: boolean;
  is_extra_time: boolean;
  created_at: string;
};

export type MatchGoalInsert = Omit<MatchGoal, "id" | "created_at">;

// Định dạng hiển thị phút: "53'" hoặc "90+4'"
export function formatGoalMinute(goal: Pick<MatchGoal, "minute" | "minute_extra">) {
  if (goal.minute_extra) {
    return `${goal.minute}+${goal.minute_extra}'`;
  }
  return `${goal.minute}'`;
}
