// lib/openfootball/parse-minute.ts
//
// Phút ghi bàn trong worldcup.json: "67", "90+4", "120+5" (hiệp phụ).

export type ParsedMinute = {
  minute: number;
  minute_extra: number | null;
  is_extra_time: boolean;
};

export function parseOpenFootballMinute(raw: string): ParsedMinute {
  const trimmed = raw.trim();
  const plusMatch = trimmed.match(/^(\d+)\+(\d+)$/);
  if (plusMatch) {
    const base = Number(plusMatch[1]);
    const extra = Number(plusMatch[2]);
    return {
      minute: base,
      minute_extra: extra,
      is_extra_time: base >= 90,
    };
  }

  const minute = Number(trimmed);
  return {
    minute: Number.isFinite(minute) ? minute : 0,
    minute_extra: null,
    is_extra_time: minute > 90,
  };
}
