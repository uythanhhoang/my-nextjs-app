#!/usr/bin/env node
/**
 * scripts/seed-group-stage-goals.mjs
 *
 * Nạp cầu thủ ghi bàn vòng bảng từ openfootball/worldcup.json vào:
 *   - group_matches
 *   - match_goals (match_kind = 'group')
 *
 * Nguồn: https://github.com/openfootball/worldcup.json/tree/master/2026
 *
 * Yêu cầu env (không commit):
 *   NEXT_PUBLIC_SUPABASE_URL hoặc SUPABASE_URL
 *   SUPABASE_SERVICE_ROLE_KEY
 *
 * Chạy: npm run seed:group-goals
 */

import { createClient } from "@supabase/supabase-js";

const WORLDCUP_JSON_URL =
  "https://raw.githubusercontent.com/openfootball/worldcup.json/master/2026/worldcup.json";

const NAME_ALIASES = {
  "cape verde": "cabo verde",
  "dr congo": "congo dr",
  "congo dr": "congo dr",
  "united states": "usa",
  usa: "usa",
  "u.s.a.": "usa",
  "ivory coast": "ivory coast",
  "cote d'ivoire": "ivory coast",
  "korea republic": "south korea",
  "south korea": "south korea",
  "ir iran": "iran",
  "bosnia and herzegovina": "bosnia & herzegovina",
  "bosnia & herzegovina": "bosnia & herzegovina",
};

function normalizeTeamName(name) {
  const lower = name.trim().toLowerCase().replace(/\s+/g, " ");
  return NAME_ALIASES[lower] ?? lower;
}

function parseMinute(raw) {
  const trimmed = String(raw).trim();
  const plusMatch = trimmed.match(/^(\d+)\+(\d+)$/);
  if (plusMatch) {
    const base = Number(plusMatch[1]);
    const extra = Number(plusMatch[2]);
    return { minute: base, minute_extra: extra, is_extra_time: base >= 90 };
  }
  const minute = Number(trimmed);
  return {
    minute: Number.isFinite(minute) ? minute : 0,
    minute_extra: null,
    is_extra_time: minute > 90,
  };
}

function buildExternalKey(match) {
  return [
    match.date,
    normalizeTeamName(match.team1),
    normalizeTeamName(match.team2),
  ].join("|");
}

function buildMatchDate(match) {
  if (!match.date) return null;
  // Giữ ngày UTC ổn định; giờ đá chi tiết lấy từ trường time nếu cần sau này
  return `${match.date}T12:00:00.000Z`;
}

function requireEnv(name, fallbackName) {
  const value = process.env[name] ?? (fallbackName ? process.env[fallbackName] : undefined);
  if (!value) {
    console.error(`❌ Thiếu biến môi trường ${name}${fallbackName ? ` hoặc ${fallbackName}` : ""}`);
    process.exit(1);
  }
  return value;
}

async function main() {
  const supabaseUrl = requireEnv("SUPABASE_URL", "NEXT_PUBLIC_SUPABASE_URL");
  const serviceRoleKey = requireEnv("SUPABASE_SERVICE_ROLE_KEY");
  const supabase = createClient(supabaseUrl, serviceRoleKey);

  console.log("⬇️  Tải worldcup.json từ openfootball…");
  const res = await fetch(WORLDCUP_JSON_URL);
  if (!res.ok) throw new Error(`HTTP ${res.status} khi tải worldcup.json`);
  const payload = await res.json();
  const groupMatches = (payload.matches ?? []).filter((m) => m.group);

  console.log(`📋 ${groupMatches.length} trận vòng bảng trong JSON`);

  const { data: teams, error: teamsErr } = await supabase.from("teams").select("id, name");
  if (teamsErr) throw new Error(`Lỗi tải teams: ${teamsErr.message}`);

  const teamIdByName = new Map();
  for (const t of teams ?? []) {
    teamIdByName.set(normalizeTeamName(t.name), t.id);
  }

  let matchesUpserted = 0;
  let goalsInserted = 0;
  const skippedTeams = new Set();

  for (const raw of groupMatches) {
    const homeId = teamIdByName.get(normalizeTeamName(raw.team1));
    const awayId = teamIdByName.get(normalizeTeamName(raw.team2));
    if (!homeId || !awayId) {
      if (!homeId) skippedTeams.add(raw.team1);
      if (!awayId) skippedTeams.add(raw.team2);
      continue;
    }

    const externalKey = buildExternalKey(raw);
    const ft = raw.score?.ft ?? null;

    const { data: gm, error: gmErr } = await supabase
      .from("group_matches")
      .upsert(
        {
          external_key: externalKey,
          group_name: raw.group,
          matchday: raw.round,
          home_team_id: homeId,
          away_team_id: awayId,
          home_score: ft ? ft[0] : null,
          away_score: ft ? ft[1] : null,
          match_date: buildMatchDate(raw),
          stadium_name: raw.ground ?? null,
        },
        { onConflict: "external_key" },
      )
      .select("id")
      .single();

    if (gmErr) {
      console.warn(`⚠️  Bỏ qua trận ${externalKey}: ${gmErr.message}`);
      continue;
    }
    matchesUpserted++;

    // Xoá bàn cũ rồi chèn lại — idempotent khi JSON cập nhật
    await supabase
      .from("match_goals")
      .delete()
      .eq("match_kind", "group")
      .eq("match_id", gm.id);

    const goalRows = [];

    for (const g of raw.goals1 ?? []) {
      const parsed = parseMinute(g.minute);
      goalRows.push({
        match_id: gm.id,
        match_kind: "group",
        team_id: homeId,
        player_id: null,
        player_name: g.name,
        minute: parsed.minute,
        minute_extra: parsed.minute_extra,
        is_penalty: Boolean(g.penalty),
        is_own_goal: Boolean(g.owngoal),
        is_extra_time: parsed.is_extra_time,
      });
    }

    for (const g of raw.goals2 ?? []) {
      const parsed = parseMinute(g.minute);
      goalRows.push({
        match_id: gm.id,
        match_kind: "group",
        team_id: awayId,
        player_id: null,
        player_name: g.name,
        minute: parsed.minute,
        minute_extra: parsed.minute_extra,
        is_penalty: Boolean(g.penalty),
        is_own_goal: Boolean(g.owngoal),
        is_extra_time: parsed.is_extra_time,
      });
    }

    if (goalRows.length === 0) continue;

    const { error: goalsErr } = await supabase.from("match_goals").insert(goalRows);
    if (goalsErr) {
      console.warn(`⚠️  Lỗi chèn bàn thắng ${externalKey}: ${goalsErr.message}`);
      continue;
    }
    goalsInserted += goalRows.length;
  }

  console.log("\n✅ Hoàn tất seed vòng bảng");
  console.log(`   Trận upsert: ${matchesUpserted}/${groupMatches.length}`);
  console.log(`   Bàn thắng chèn: ${goalsInserted}`);
  if (skippedTeams.size > 0) {
    console.log(`   ⚠️  Đội chưa khớp bảng teams (${skippedTeams.size}):`);
    for (const name of [...skippedTeams].sort()) console.log(`      - ${name}`);
  }
}

main().catch((err) => {
  console.error("❌", err.message ?? err);
  process.exit(1);
});
