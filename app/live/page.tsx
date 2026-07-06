import { supabase } from "@/lib/supabase";
import type { Tables } from "@/supabase_types";
import LiveMatches from "@/components/LiveMatches";

type Team = Pick<Tables<"teams">, "id" | "name" | "logo_url">;

type MatchRow = Omit<Tables<"knockout_matches">, "home_team_id" | "away_team_id"> & {
  home_team: Team | null;
  away_team: Team | null;
};

export const revalidate = 0; // luôn lấy dữ liệu mới nhất từ Supabase Cloud

export default async function LivePage() {
  const { data: matches, error } = await supabase
    .from("knockout_matches")
    .select(
      `id, match_number, round_name, home_slot_label, away_slot_label,
       home_score, away_score, home_penalty_score, away_penalty_score,
       status, current_minute, match_date, stadium_name,
       is_extra_time, external_match_id, next_match_id, winner_id,
       last_synced_at, created_at,
       home_team:teams!knockout_matches_home_team_id_fkey(id, name, logo_url),
       away_team:teams!knockout_matches_away_team_id_fkey(id, name, logo_url)`,
    )
    .order("match_date");

  return (
    <main className="min-h-screen bg-slate-900 p-8 text-white">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-3xl font-bold">🟢 Trực tiếp — World Cup 2026</h1>
      </div>

      {error ? (
        <div className="rounded-md border border-red-500/40 bg-red-500/10 p-4 text-red-300">
          ❌ Lỗi tải dữ liệu từ Supabase: {error.message}
        </div>
      ) : (
        <LiveMatches initialMatches={(matches ?? []) as unknown as MatchRow[]} />
      )}
    </main>
  );
}
