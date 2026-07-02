"use client";

// components/LiveMatches.tsx
//
// Trang /live: tổng hợp trận đang diễn ra, sắp diễn ra và vừa kết thúc,
// gộp từ mọi vòng đấu (khác với RoundOf32List / RoundOf16List chỉ lọc theo
// round_name). Tự cập nhật realtime khi Edge Function sync-worldcup-data
// ghi tỷ số mới (mỗi 2 tiếng) hoặc khi ai đó cập nhật thủ công qua SQL.

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabase";
import type { Tables } from "@/supabase_types";

type Team = Pick<Tables<"teams">, "id" | "name" | "logo_url">;

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
  day: "2-digit",
  month: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
});

function formatMatchDate(value: string | null) {
  if (!value) return "Chưa xác định";
  return dateFormatter.format(new Date(value));
}

async function fetchAll(): Promise<MatchRow[]> {
  const { data, error } = await supabase
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

  if (error) {
    console.error("Không tải được danh sách trận đấu:", error.message);
    return [];
  }
  return data as unknown as MatchRow[];
}

function TeamCrest({ team, slotLabel }: { team: Team | null; slotLabel: string | null }) {
  const name = team?.name ?? slotLabel ?? "Chưa xác định";
  return (
    <span className="flex items-center gap-2">
      {team?.logo_url ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={team.logo_url} alt={name} className="h-5 w-5 object-contain" />
      ) : null}
      <span className={team ? "text-slate-100" : "italic text-slate-500"}>{name}</span>
    </span>
  );
}

function MatchCard({ m }: { m: MatchRow }) {
  return (
    <Link
      href={`/matches/${m.id}`}
      className="block rounded-lg border border-slate-700 bg-slate-800/50 p-4 transition-colors hover:border-emerald-500/50 hover:bg-slate-800"
    >
      <div className="mb-2 flex items-center justify-between text-xs text-slate-400">
        <span>{m.round_name}</span>
        <span>{formatMatchDate(m.match_date)}</span>
      </div>
      <div className="flex items-center justify-between gap-3">
        <TeamCrest team={m.home_team} slotLabel={m.home_slot_label} />
        <span className="shrink-0 tabular-nums text-slate-100">
          {m.status === "scheduled" ? (
            <span className="text-slate-500">vs</span>
          ) : (
            <>
              {m.home_score ?? 0} - {m.away_score ?? 0}
            </>
          )}
        </span>
        <TeamCrest team={m.away_team} slotLabel={m.away_slot_label} />
      </div>
      <div className="mt-2 flex items-center justify-between text-xs text-slate-400">
        <span>{m.stadium_name ?? "—"}</span>
        {m.status === "live" ? (
          <span className="rounded-full bg-emerald-500/20 px-2 py-0.5 font-medium text-emerald-400">
            {m.current_minute !== null ? `Đang đá (${m.current_minute}')` : "Đang đá"}
          </span>
        ) : m.status === "finished" ? (
          <span className="rounded-full bg-slate-600 px-2 py-0.5 font-medium text-slate-200">
            Kết thúc
          </span>
        ) : (
          <span className="rounded-full bg-slate-700 px-2 py-0.5 font-medium text-slate-300">
            {STATUS_LABEL_VI.scheduled}
          </span>
        )}
      </div>
    </Link>
  );
}

export default function LiveMatches({ initialMatches }: { initialMatches: MatchRow[] }) {
  const [matches, setMatches] = useState<MatchRow[]>(initialMatches);

  useEffect(() => {
    const channel = supabase
      .channel("live_matches_changes")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "knockout_matches" },
        async () => {
          setMatches(await fetchAll());
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const { live, upcoming, recentlyFinished } = useMemo(() => {
    const live = matches
      .filter((m) => m.status === "live")
      .sort((a, b) => (a.match_number ?? 0) - (b.match_number ?? 0));

    const upcoming = matches
      .filter((m) => m.status === "scheduled")
      .sort((a, b) => new Date(a.match_date ?? 0).getTime() - new Date(b.match_date ?? 0).getTime())
      .slice(0, 8);

    const recentlyFinished = matches
      .filter((m) => m.status === "finished")
      .sort(
        (a, b) =>
          new Date(b.last_synced_at ?? b.match_date ?? 0).getTime() -
          new Date(a.last_synced_at ?? a.match_date ?? 0).getTime(),
      )
      .slice(0, 6);

    return { live, upcoming, recentlyFinished };
  }, [matches]);

  return (
    <div className="space-y-10">
      <section>
        <h2 className="mb-3 text-lg font-semibold text-emerald-400">
          🔴 Đang diễn ra {live.length > 0 && `(${live.length})`}
        </h2>
        {live.length === 0 ? (
          <p className="text-sm text-slate-500">Hiện không có trận nào đang diễn ra.</p>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2">
            {live.map((m) => (
              <MatchCard key={m.id} m={m} />
            ))}
          </div>
        )}
      </section>

      <section>
        <h2 className="mb-3 text-lg font-semibold text-slate-200">📅 Sắp diễn ra</h2>
        {upcoming.length === 0 ? (
          <p className="text-sm text-slate-500">Không có trận nào sắp diễn ra.</p>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2">
            {upcoming.map((m) => (
              <MatchCard key={m.id} m={m} />
            ))}
          </div>
        )}
      </section>

      <section>
        <h2 className="mb-3 text-lg font-semibold text-slate-200">✅ Vừa kết thúc</h2>
        {recentlyFinished.length === 0 ? (
          <p className="text-sm text-slate-500">Chưa có trận nào kết thúc.</p>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2">
            {recentlyFinished.map((m) => (
              <MatchCard key={m.id} m={m} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
