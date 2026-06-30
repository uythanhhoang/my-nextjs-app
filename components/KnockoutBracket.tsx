"use client";
// components/KnockoutBracket.tsx
//
// Hiển thị bracket knockout World Cup 2026 (Round of 32 -> Final + Tranh hạng Ba)
// và tự cập nhật tức thì khi Edge Function đồng bộ ghi tỷ số mới vào Supabase,
// nhờ Supabase Realtime (không cần polling, không cần reload trang).
//
// Cách dùng:
//   <KnockoutBracket />
// (component tự fetch dữ liệu lần đầu rồi tự subscribe Realtime)
//
// Yêu cầu: đã set NEXT_PUBLIC_SUPABASE_URL và NEXT_PUBLIC_SUPABASE_ANON_KEY,
// và đã chạy "ALTER PUBLICATION supabase_realtime ADD TABLE knockout_matches".

import { createClient } from "@supabase/supabase-js";
import { useEffect, useMemo, useState } from "react";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
);

type MatchStatus = "scheduled" | "live" | "finished";

interface Team {
  id: string;
  name: string;
  logo_url: string | null;
}

interface Match {
  id: string;
  match_number: number;
  round_name: string;
  home_slot_label: string | null;
  away_slot_label: string | null;
  home_team: Team | null;
  away_team: Team | null;
  home_score: number | null;
  away_score: number | null;
  home_penalty_score: number | null;
  away_penalty_score: number | null;
  status: MatchStatus;
  current_minute: number | null;
}

const ROUND_ORDER = [
  "Round of 32",
  "Round of 16",
  "Quarter-finals",
  "Semi-finals",
  "Final",
];

const ROUND_LABEL_VI: Record<string, string> = {
  "Round of 32": "Vòng 32 đội",
  "Round of 16": "Vòng 16 đội",
  "Quarter-finals": "Tứ kết",
  "Semi-finals": "Bán kết",
  "Final": "Chung kết",
  "Third-place playoff": "Tranh hạng Ba",
};

async function fetchMatches(): Promise<Match[]> {
  const { data, error } = await supabase
    .from("knockout_matches")
    .select(
      `id, match_number, round_name, home_slot_label, away_slot_label,
       home_score, away_score, home_penalty_score, away_penalty_score,
       status, current_minute,
       home_team:teams!knockout_matches_home_team_id_fkey(id, name, logo_url),
       away_team:teams!knockout_matches_away_team_id_fkey(id, name, logo_url)`,
    )
    .order("match_number");

  if (error) {
    console.error("Không tải được bracket:", error.message);
    return [];
  }
  return data as unknown as Match[];
}

function TeamRow({
  team,
  slotLabel,
  score,
  penaltyScore,
  isWinner,
}: {
  team: Team | null;
  slotLabel: string | null;
  score: number | null;
  penaltyScore: number | null;
  isWinner: boolean;
}) {
  const name = team?.name ?? slotLabel ?? "Chưa xác định";
  const isPending = !team;

  return (
    <div
      className={`flex items-center justify-between gap-2 px-3 py-1.5 ${
        isWinner ? "font-semibold" : ""
      }`}
    >
      <span
        className={`truncate text-sm ${
          isPending ? "italic text-slate-400" : "text-slate-100"
        }`}
      >
        {name}
      </span>
      {score !== null && (
        <span className="tabular-nums text-sm text-slate-100">
          {score}
          {penaltyScore !== null && (
            <span className="ml-1 text-xs text-slate-400">({penaltyScore})</span>
          )}
        </span>
      )}
    </div>
  );
}

function MatchCard({ match }: { match: Match }) {
  const isLive = match.status === "live";
  const isFinished = match.status === "finished";
  const homeWins =
    isFinished &&
    match.home_score !== null &&
    match.away_score !== null &&
    (match.home_score > match.away_score ||
      (match.home_score === match.away_score &&
        (match.home_penalty_score ?? 0) > (match.away_penalty_score ?? 0)));
  const awayWins = isFinished && !homeWins;

  return (
    <div className="w-56 rounded-md border border-slate-700 bg-slate-900 shadow-sm">
      <div className="flex items-center justify-between border-b border-slate-700 px-3 py-1">
        <span className="text-xs text-slate-500">Trận {match.match_number}</span>
        {isLive && (
          <span className="flex items-center gap-1 text-xs font-medium text-emerald-400">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75 motion-reduce:animate-none" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
            </span>
            {match.current_minute ?? 0}'
          </span>
        )}
      </div>
      <div className="divide-y divide-slate-800">
        <TeamRow
          team={match.home_team}
          slotLabel={match.home_slot_label}
          score={match.home_score}
          penaltyScore={match.home_penalty_score}
          isWinner={homeWins}
        />
        <TeamRow
          team={match.away_team}
          slotLabel={match.away_slot_label}
          score={match.away_score}
          penaltyScore={match.away_penalty_score}
          isWinner={awayWins}
        />
      </div>
    </div>
  );
}

export default function KnockoutBracket() {
  const [matches, setMatches] = useState<Match[]>([]);

  useEffect(() => {
    fetchMatches().then(setMatches);

    const channel = supabase
      .channel("knockout_matches_changes")
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "knockout_matches" },
        async () => {
          // Một field vừa đổi có thể kéo theo cần JOIN lại tên đội (vd. mới
          // backfill team_id) — refetch gọn cho chắc thay vì merge thủ công.
          setMatches(await fetchMatches());
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const matchesByRound = useMemo(() => {
    const grouped = new Map<string, Match[]>();
    for (const m of matches) {
      if (m.round_name === "Third-place playoff") continue;
      if (!grouped.has(m.round_name)) grouped.set(m.round_name, []);
      grouped.get(m.round_name)!.push(m);
    }
    return grouped;
  }, [matches]);

  const thirdPlaceMatch = matches.find((m) => m.round_name === "Third-place playoff");

  return (
    <div className="w-full overflow-x-auto">
      <div className="flex min-w-max gap-8 p-4">
        {ROUND_ORDER.map((round) => (
          <div key={round} className="flex flex-col gap-4">
            <h3 className="text-sm font-medium text-slate-400">
              {ROUND_LABEL_VI[round] ?? round}
            </h3>
            <div className="flex flex-1 flex-col justify-around gap-4">
              {(matchesByRound.get(round) ?? []).map((m) => (
                <MatchCard key={m.id} match={m} />
              ))}
            </div>
          </div>
        ))}
        {thirdPlaceMatch && (
          <div className="flex flex-col gap-4">
            <h3 className="text-sm font-medium text-slate-400">
              {ROUND_LABEL_VI["Third-place playoff"]}
            </h3>
            <MatchCard match={thirdPlaceMatch} />
          </div>
        )}
      </div>
    </div>
  );
}
