"use client";

// components/MatchDetail.tsx
//
// Trang chi tiết 1 trận đấu (/matches/[id]). Subscribe realtime lọc theo
// đúng id trận này (filter: `id=eq.${id}`) để không phải tải lại toàn bộ
// bảng knockout_matches như các trang danh sách.

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import type { Tables } from "@/supabase_types";

type Team = Pick<Tables<"teams">, "id" | "name" | "logo_url" | "flag_url">;

type MatchRow = Omit<Tables<"knockout_matches">, "home_team_id" | "away_team_id"> & {
  home_team: Team | null;
  away_team: Team | null;
};

const STATUS_LABEL_VI: Record<string, string> = {
  scheduled: "Chưa đá",
  live: "Đang đá",
  finished: "Kết thúc",
};

const dateFormatter = new Intl.DateTimeFormat("vi-VN", {
  timeZone: "Asia/Ho_Chi_Minh",
  weekday: "long",
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
});

function formatMatchDate(value: string | null) {
  if (!value) return "Chưa xác định";
  return dateFormatter.format(new Date(value));
}

async function fetchMatch(id: string): Promise<MatchRow | null> {
  const { data, error } = await supabase
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
    console.error("Không tải được chi tiết trận đấu:", error.message);
    return null;
  }
  return data as unknown as MatchRow;
}

function TeamColumn({
  team,
  slotLabel,
  score,
  isWinner,
}: {
  team: Team | null;
  slotLabel: string | null;
  score: number | null;
  isWinner: boolean;
}) {
  const name = team?.name ?? slotLabel ?? "Chưa xác định";
  return (
    <div className="flex flex-1 flex-col items-center gap-3 text-center">
      {team?.flag_url ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={team.flag_url}
          alt={name}
          className="h-16 w-24 rounded object-cover shadow-lg"
        />
      ) : (
        <div className="flex h-16 w-24 items-center justify-center rounded bg-slate-800 text-slate-600">
          ?
        </div>
      )}
      <span className={`text-lg font-semibold ${team ? "text-slate-100" : "italic text-slate-500"} ${isWinner ? "text-emerald-400" : ""}`}>
        {name}
      </span>
      <span className="text-5xl font-bold tabular-nums text-white">{score ?? "-"}</span>
    </div>
  );
}

export default function MatchDetail({ initialMatch }: { initialMatch: MatchRow }) {
  const [match, setMatch] = useState<MatchRow>(initialMatch);

  useEffect(() => {
    const channel = supabase
      .channel(`match_${initialMatch.id}_changes`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "knockout_matches",
          filter: `id=eq.${initialMatch.id}`,
        },
        async () => {
          const updated = await fetchMatch(initialMatch.id);
          if (updated) setMatch(updated);
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [initialMatch.id]);

  const homeWins =
    match.winner_id !== null && match.home_team?.id === match.winner_id;
  const awayWins =
    match.winner_id !== null && match.away_team?.id === match.winner_id;

  return (
    <div className="mx-auto max-w-2xl">
      <div className="mb-6 text-center text-sm text-slate-400">
        <div>{match.round_name} · Trận số {match.match_number}</div>
        <div>{formatMatchDate(match.match_date)}</div>
        <div>{match.stadium_name ?? "Sân vận động chưa xác định"}</div>
      </div>

      <div className="mb-6 flex items-center justify-center gap-6 rounded-xl border border-slate-700 bg-slate-800/40 p-8">
        <TeamColumn
          team={match.home_team}
          slotLabel={match.home_slot_label}
          score={match.status === "scheduled" ? null : match.home_score}
          isWinner={homeWins}
        />
        <span className="text-2xl text-slate-600">–</span>
        <TeamColumn
          team={match.away_team}
          slotLabel={match.away_slot_label}
          score={match.status === "scheduled" ? null : match.away_score}
          isWinner={awayWins}
        />
      </div>

      {match.home_penalty_score !== null && match.away_penalty_score !== null && (
        <p className="mb-4 text-center text-sm text-slate-400">
          Luân lưu: {match.home_penalty_score} - {match.away_penalty_score}
        </p>
      )}

      <div className="flex items-center justify-center gap-2">
        <span
          className={`rounded-full px-3 py-1 text-sm font-medium ${
            match.status === "live"
              ? "bg-emerald-500/20 text-emerald-400"
              : match.status === "finished"
                ? "bg-slate-600 text-slate-200"
                : "bg-slate-700 text-slate-300"
          }`}
        >
          {match.status === "live" && match.current_minute !== null
            ? `${STATUS_LABEL_VI.live} — phút ${match.current_minute}${match.is_extra_time ? " (hiệp phụ)" : ""}`
            : STATUS_LABEL_VI[match.status] ?? match.status}
        </span>
      </div>

      {match.last_synced_at && (
        <p className="mt-6 text-center text-xs text-slate-600">
          Đồng bộ lần cuối:{" "}
          {new Intl.DateTimeFormat("vi-VN", {
            timeZone: "Asia/Ho_Chi_Minh",
            hour: "2-digit",
            minute: "2-digit",
            day: "2-digit",
            month: "2-digit",
          }).format(new Date(match.last_synced_at))}
        </p>
      )}
    </div>
  );
}
