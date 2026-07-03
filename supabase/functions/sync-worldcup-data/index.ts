// supabase/functions/sync-worldcup-data/index.ts
//
// Đồng bộ tỉ số / trạng thái trận đấu Vòng loại trực tiếp World Cup 2026
// từ API-FOOTBALL vào bảng `knockout_matches`.
//
// Phạm vi (đã thu hẹp so với spec gốc theo xác nhận của Hoang):
//   - CHỈ cập nhật: status, current_minute, home_score, away_score,
//     home_penalty_score, away_penalty_score, is_extra_time, winner_id,
//     external_match_id, last_synced_at.
//   - KHÔNG ghi đè teams / players / coaching_staff (dữ liệu tiếng Việt
//     đã được nhập tay).
//
// Bảo mật: function này KHÔNG bật verify_jwt (được gọi bởi pg_cron nội bộ,
// không public cho trình duyệt). Thay vào đó, function tự kiểm tra header
// `x-cron-secret` khớp với secret CRON_SECRET.
//
// Ngân sách API: gọi đúng 1 request /fixtures?league=1&season=2026 mỗi lần
// chạy (trả về toàn bộ 104 trận của giải), tương thích với cron 12 lần/ngày
// (0 */2 * * *) và giới hạn 100 requests/ngày của gói FREE.

import { createClient } from "jsr:@supabase/supabase-js@2";

const API_FOOTBALL_URL = "https://v3.football.api-sports.io/fixtures?league=1&season=2026";

// Một vài tên đội có thể khác giữa API-FOOTBALL và bảng `teams` nội bộ.
// key = tên API-FOOTBALL (viết thường), value = tên nội bộ (viết thường).
const NAME_ALIASES: Record<string, string> = {
  "cape verde": "cabo verde",
  "dr congo": "congo dr",
  "congo dr": "congo dr",
  "united states": "usa",
  "ivory coast": "ivory coast",
  "korea republic": "south korea",
  "ir iran": "iran",
};

function normalizeName(name: string): string {
  const lower = name.trim().toLowerCase();
  return NAME_ALIASES[lower] ?? lower;
}

type ApiFixture = {
  fixture: {
    id: number;
    date: string;
    status: { short: string; elapsed: number | null };
  };
  teams: {
    home: { id: number; name: string };
    away: { id: number; name: string };
  };
  goals: { home: number | null; away: number | null };
  score: {
    penalty: { home: number | null; away: number | null };
    extratime: { home: number | null; away: number | null };
  };
};

const LIVE_CODES = new Set(["1H", "2H", "HT", "ET", "BT", "P", "LIVE", "INT"]);
const FINISHED_CODES = new Set(["FT", "AET", "PEN"]);
const EXTRA_TIME_CODES = new Set(["ET", "BT", "P", "AET", "PEN"]);

function mapStatus(short: string): "scheduled" | "live" | "finished" | null {
  if (FINISHED_CODES.has(short)) return "finished";
  if (LIVE_CODES.has(short)) return "live";
  if (short === "NS" || short === "TBD") return "scheduled";
  // PST / CANC / ABD / AWD / WO / etc — trạng thái bất thường, không map,
  // bỏ qua để tránh ghi dữ liệu sai (theo yêu cầu "Không ghi dữ liệu lỗi").
  return null;
}

Deno.serve(async (req: Request) => {
  const startedAt = Date.now();

  // --- Xác thực nội bộ (cron) ---
  const cronSecret = Deno.env.get("CRON_SECRET");
  const provided = req.headers.get("x-cron-secret");
  if (!cronSecret || provided !== cronSecret) {
    return new Response(JSON.stringify({ error: "unauthorized" }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const apiFootballKey = Deno.env.get("API_FOOTBALL_KEY");

  const supabase = createClient(supabaseUrl, serviceRoleKey);

  if (!apiFootballKey) {
    await supabase.from("sync_log").insert({
      source: "api-football",
      status: "error",
      matches_updated: 0,
      error_message: "Thiếu secret API_FOOTBALL_KEY trên Edge Function.",
    });
    return new Response(JSON.stringify({ error: "missing API_FOOTBALL_KEY" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }

  try {
    // --- 1. Gọi API-FOOTBALL (1 request duy nhất, có 1 lần retry) ---
    let apiRes: Response | null = null;
    let lastErr: unknown = null;
    for (let attempt = 0; attempt < 2; attempt++) {
      try {
        apiRes = await fetch(API_FOOTBALL_URL, {
          headers: { "x-apisports-key": apiFootballKey },
        });
        if (apiRes.ok) break;
      } catch (err) {
        lastErr = err;
      }
    }
    if (!apiRes || !apiRes.ok) {
      throw new Error(
        `API-FOOTBALL request thất bại: ${apiRes?.status ?? "network error"} ${
          lastErr ? String(lastErr) : ""
        }`,
      );
    }

    const payload = await apiRes.json();
    const fixtures: ApiFixture[] = payload?.response ?? [];
    const debugInfo = {
      results: payload?.results,
      errors: payload?.errors,
      paging: payload?.paging,
    };

    // --- 2. Nạp danh sách teams nội bộ để map tên -> id ---
    const { data: teams, error: teamsErr } = await supabase
      .from("teams")
      .select("id, name");
    if (teamsErr) throw new Error(`Lỗi tải teams: ${teamsErr.message}`);

    const teamIdByName = new Map<string, string>();
    for (const t of teams ?? []) {
      teamIdByName.set(normalizeName(t.name), t.id);
    }

    // --- 3. Nạp các trận đấu nội bộ đã xác định đủ 2 đội và chưa "finished" ---
    const { data: localMatches, error: matchesErr } = await supabase
      .from("knockout_matches")
      .select(
        "id, home_team_id, away_team_id, status, home_score, away_score, home_penalty_score, away_penalty_score, current_minute, is_extra_time, external_match_id, winner_id",
      )
      .not("home_team_id", "is", null)
      .not("away_team_id", "is", null)
      .neq("status", "finished");

    if (matchesErr) throw new Error(`Lỗi tải knockout_matches: ${matchesErr.message}`);

    const localByPair = new Map<string, (typeof localMatches)[number]>();
    for (const m of localMatches ?? []) {
      localByPair.set(`${m.home_team_id}|${m.away_team_id}`, m);
      localByPair.set(`${m.away_team_id}|${m.home_team_id}`, m);
    }

    let updatedCount = 0;
    const skipped: string[] = [];

    for (const fx of fixtures) {
      const homeId = teamIdByName.get(normalizeName(fx.teams.home.name));
      const awayId = teamIdByName.get(normalizeName(fx.teams.away.name));
      if (!homeId || !awayId) continue; // đội chưa vào bảng đấu loại trực tiếp

      const local = localByPair.get(`${homeId}|${awayId}`);
      if (!local) continue; // trận chưa xác định ở vòng này, hoặc đã "finished" (bỏ qua)

      const newStatus = mapStatus(fx.fixture.status.short);
      if (!newStatus) {
        skipped.push(`fixture ${fx.fixture.id}: trạng thái không xác định (${fx.fixture.status.short})`);
        continue;
      }

      const homeScore = fx.goals.home;
      const awayScore = fx.goals.away;
      const homePen = fx.score.penalty.home;
      const awayPen = fx.score.penalty.away;
      const isExtraTime = EXTRA_TIME_CODES.has(fx.fixture.status.short);
      const minute = fx.fixture.status.elapsed;

      let winnerId: string | null = local.winner_id;
      if (newStatus === "finished") {
        if (homeScore !== null && awayScore !== null && homeScore !== awayScore) {
          winnerId = homeScore > awayScore ? homeId : awayId;
        } else if (homePen !== null && awayPen !== null && homePen !== awayPen) {
          winnerId = homePen > awayPen ? homeId : awayId;
        }
      }

      const changed =
        local.status !== newStatus ||
        local.home_score !== homeScore ||
        local.away_score !== awayScore ||
        local.home_penalty_score !== homePen ||
        local.away_penalty_score !== awayPen ||
        local.current_minute !== minute ||
        local.is_extra_time !== isExtraTime ||
        local.external_match_id !== String(fx.fixture.id) ||
        local.winner_id !== winnerId;

      if (!changed) continue;

      const { error: updateErr } = await supabase
        .from("knockout_matches")
        .update({
          status: newStatus,
          home_score: homeScore,
          away_score: awayScore,
          home_penalty_score: homePen,
          away_penalty_score: awayPen,
          current_minute: minute,
          is_extra_time: isExtraTime,
          external_match_id: String(fx.fixture.id),
          winner_id: winnerId,
          last_synced_at: new Date().toISOString(),
        })
        .eq("id", local.id);

      if (updateErr) {
        skipped.push(`match ${local.id}: ${updateErr.message}`);
        continue;
      }
      updatedCount++;
    }

    const debugNote =
      fixtures.length === 0
        ? `DEBUG (0 fixtures): ${JSON.stringify(debugInfo).slice(0, 1800)}`
        : null;

    await supabase.from("sync_log").insert({
      source: "api-football",
      status: "success",
      matches_updated: updatedCount,
      error_message:
        debugNote ?? (skipped.length > 0 ? skipped.join("; ").slice(0, 2000) : null),
    });

    return new Response(
      JSON.stringify({
        ok: true,
        fixtures_fetched: fixtures.length,
        matches_updated: updatedCount,
        skipped,
        debugInfo,
        duration_ms: Date.now() - startedAt,
      }),
      { headers: { "Content-Type": "application/json" } },
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    // Không throw để function không "crash" — ghi log lỗi rồi trả 200/500 tuỳ ý,
    // nhưng KHÔNG ghi bất kỳ thay đổi dữ liệu trận đấu nào ở nhánh lỗi.
    try {
      const supabase = createClient(supabaseUrl, serviceRoleKey);
      await supabase.from("sync_log").insert({
        source: "api-football",
        status: "error",
        matches_updated: 0,
        error_message: message.slice(0, 2000),
      });
    } catch {
      // best-effort logging only
    }
    return new Response(JSON.stringify({ ok: false, error: message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
});
