// lib/openfootball/worldcup2026-types.ts
//
// Kiểu dữ liệu cho https://github.com/openfootball/worldcup.json/tree/master/2026

export type OpenFootballGoal = {
  name: string;
  minute: string;
  penalty?: boolean;
  owngoal?: boolean;
};

export type OpenFootballMatch = {
  round: string;
  date: string;
  time?: string;
  team1: string;
  team2: string;
  score?: {
    ft?: [number, number];
    ht?: [number, number];
    et?: [number, number];
    p?: [number, number];
  };
  goals1?: OpenFootballGoal[];
  goals2?: OpenFootballGoal[];
  group?: string;
  ground?: string;
  num?: number;
};

export type OpenFootballWorldCup = {
  name: string;
  matches: OpenFootballMatch[];
};

export function isGroupStageMatch(match: OpenFootballMatch): boolean {
  return Boolean(match.group);
}
