// lib/openfootball/normalize-team-name.ts
//
// Chuẩn hoá tên đội từ openfootball/worldcup.json để khớp bảng `teams` nội bộ.
// Dùng chung cho script seed vòng bảng (không đụng lib/supabase.ts typed).

const NAME_ALIASES: Record<string, string> = {
  "cape verde": "cabo verde",
  "dr congo": "congo dr",
  "congo dr": "congo dr",
  "united states": "usa",
  "usa": "usa",
  "u.s.a.": "usa",
  "ivory coast": "ivory coast",
  "cote d'ivoire": "ivory coast",
  "korea republic": "south korea",
  "south korea": "south korea",
  "ir iran": "iran",
  "bosnia and herzegovina": "bosnia & herzegovina",
  "bosnia & herzegovina": "bosnia & herzegovina",
};

export function normalizeTeamName(name: string): string {
  const lower = name.trim().toLowerCase().replace(/\s+/g, " ");
  return NAME_ALIASES[lower] ?? lower;
}
