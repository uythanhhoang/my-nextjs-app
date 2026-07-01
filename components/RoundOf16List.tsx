"use client";

// components/RoundOf16List.tsx
//
// Hiển thị danh sách (dạng bảng) các trận đấu Vòng 16 đội — World Cup 2026.
// Sao chép pattern từ RoundOf32List.tsx để không ảnh hưởng tới component gốc.
// Dùng client typed từ lib/supabase.ts (đã gắn Database từ supabase_types.ts)
// nên các cột trong .select() đều được kiểm tra kiểu dữ liệu.
// Tự cập nhật realtime khi Edge Function ghi tỷ số mới hoặc khi đội thắng
// từ Vòng 32 được tự động đưa vào (trigger advance_winner_to_next_match).

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

const STATUS_BADGE_CLASS: Record<string, string> = {
  scheduled: "bg-slate-700 text-slate-300",
  live: "bg-emerald-500/20 text-emerald-400",
  finished: "bg-slate-600 text-slate-200",
};

// Định dạng cố định locale + timeZone để tránh lệch giữa render server và client.
const dateFormatter = new Intl.DateTimeFormat("vi-VN", {
  timeZone: "Asia/Ho_Chi_Minh",
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

async function fetchRoundOf16(): Promise<MatchRow[]> {
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
    .eq("round_name", "Round of 16")
    .order("match_number");

  if (error) {
    console.error("Không tải được danh sách vòng 16 đội:", error.message);
    return [];
  }
  return data as unknown as MatchRow[];
}

function TeamName({ team, slotLabel }: { team: Team | null; slotLabel: string | null }) {
  const name = team?.name ?? slotLabel ?? "Chưa xác định";
  return (
    <span className={team ? "text-slate-100" : "italic text-slate-500"}>{name}</span>
  );
}

export default function RoundOf16List({ initialMatches }: { initialMatches: MatchRow[] }) {
  const [matches, setMatches] = useState<MatchRow[]>(initialMatches);

  useEffect(() => {
    const channel = supabase
      .channel("round_of_16_changes")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "knockout_matches" },
        async () => {
          setMatches(await fetchRoundOf16());
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const sorted = useMemo(
    () => [...matches].sort((a, b) => (a.match_number ?? 0) - (b.match_number ?? 0)),
    [matches],
  );

  if (sorted.length === 0) {
    return (
      <p className="text-slate-400">
        Chưa có dữ liệu trận đấu Vòng 16 đội. Hãy kiểm tra lại bảng{" "}
        <code className="text-slate-300">knockout_matches</code>.
      </p>
    );
  }

  return (
    <div className="overflow-x-auto rounded-lg border border-slate-700">
      <table className="w-full min-w-[860px] text-left text-sm">
        <thead className="bg-slate-800 text-slate-400">
          <tr>
            <th className="px-4 py-3 font-medium">#</th>
            <th className="px-4 py-3 font-medium">Ngày &amp; giờ</th>
            <th className="px-4 py-3 font-medium">Đội nhà</th>
            <th className="px-4 py-3 text-center font-medium">Tỉ số</th>
            <th className="px-4 py-3 font-medium">Đội khách</th>
            <th className="px-4 py-3 font-medium">Sân vận động</th>
            <th className="px-4 py-3 font-medium">Trạng thái</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-800">
          {sorted.map((m) => (
            <tr key={m.id} className="bg-slate-900 hover:bg-slate-800/60">
              <td className="px-4 py-3 text-slate-500">{m.match_number}</td>
              <td className="px-4 py-3 text-slate-300">{formatMatchDate(m.match_date)}</td>
              <td className="px-4 py-3">
                <TeamName team={m.home_team} slotLabel={m.home_slot_label} />
              </td>
              <td className="px-4 py-3 text-center tabular-nums text-slate-100">
                {m.status === "scheduled" ? (
                  <span className="text-slate-500">vs</span>
                ) : (
                  <>
                    {m.home_score ?? 0} - {m.away_score ?? 0}
                    {m.home_penalty_score !== null && m.away_penalty_score !== null && (
                      <span className="ml-1 text-xs text-slate-400">
                        (pen. {m.home_penalty_score}-{m.away_penalty_score})
                      </span>
                    )}
                  </>
                )}
              </td>
              <td className="px-4 py-3">
                <TeamName team={m.away_team} slotLabel={m.away_slot_label} />
              </td>
              <td className="px-4 py-3 text-slate-300">{m.stadium_name ?? "—"}</td>
              <td className="px-4 py-3">
                <span
                  className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                    STATUS_BADGE_CLASS[m.status] ?? "bg-slate-700 text-slate-300"
                  }`}
                >
                  {m.status === "live" && m.current_minute !== null
                    ? `${STATUS_LABEL_VI.live} (${m.current_minute}')`
                    : STATUS_LABEL_VI[m.status] ?? m.status}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
