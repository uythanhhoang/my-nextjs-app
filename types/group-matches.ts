// types/group-matches.ts
//
// Kiểu thủ công cho bảng group_matches (dùng với lib/supabase-untyped.ts).

export type GroupMatch = {
  id: string;
  external_key: string;
  group_name: string;
  matchday: string;
  home_team_id: string;
  away_team_id: string;
  home_score: number | null;
  away_score: number | null;
  match_date: string | null;
  stadium_name: string | null;
  created_at: string;
};
