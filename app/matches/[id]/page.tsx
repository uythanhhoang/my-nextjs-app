import Link from "next/link";
import { notFound } from "next/navigation";
import { supabase } from "@/lib/supabase";
import type { Tables } from "@/supabase_types";
import MatchDetail from "@/components/MatchDetail";

type Team = Pick<Tables<"teams">, "id" | "name" | "logo_url" | "flag_url">;

type MatchRow = Omit<Tables<"knockout_matches">, "home_team_id" | "away_team_id"> & {
  home_team: Team | null;
  away_team: Team | null;
};

export const revalidate = 0; // luôn lấy dữ liệu mới nhất từ Supabase Cloud

export default async function MatchDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const { data: match, error } = await supabase
    .from("knockout_matches")
    .select(
      `id, match_number, round_name, home_slot_label, away_slot_label,
       home_score, away_score, home_penalty_score, away_penalty_score,
       status, current_minute, match_date, stadium_name,
       is_extra_time, external_match_id, next_match_id, winner_id,
       last_synced_at, created_at,
       home_team:teams!knockout_matches_home_team_id_fkey(id, name, logo_url, flag_url),
       away_team:teams!knockout_matches_away_team_id_fkey(id, name, logo_url, flag_url)`,
    )
    .eq("id", id)
    .maybeSingle();

  if (error) {
    return (
      <main className="min-h-screen bg-slate-900 p-8 text-white">
        <div className="rounded-md border border-red-500/40 bg-red-500/10 p-4 text-red-300">
          ❌ Lỗi tải dữ liệu từ Supabase: {error.message}
        </div>
      </main>
    );
  }

  if (!match) {
    notFound();
  }

  return (
    <main className="min-h-screen bg-slate-900 p-8 text-white">
      <Link href="/live" className="mb-6 inline-block text-sm text-emerald-400 hover:underline">
        ← Quay lại Trực tiếp
      </Link>
      <MatchDetail initialMatch={match as unknown as MatchRow} />
    </main>
  );
}
