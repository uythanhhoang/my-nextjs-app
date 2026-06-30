import { createServerClient } from "@/lib/supabase-server";

export type TeamOverview = {
  id: string;
  name: string;
  logo_url: string | null;
  flag_url: string | null;
  nickname: string | null;
  fifa_ranking: number | null;
  confederation: string | null;
  founded_year: number | null;
  coach: string | null;
  captain: string | null;
  home_stadium: string | null;
  website: string | null;
  description: string | null;
  appearances: number | null;
  wins: number | null;
  draws: number | null;
  losses: number | null;
  goals_for: number | null;
  goals_against: number | null;
  clean_sheets: number | null;
  world_cup_titles: number | null;
  best_finish: string | null;
};

export type Player = {
  id: string;
  team_id: string;
  full_name: string;
  jersey_number: number | null;
  position: string | null;
  age: number | null;
  height: number | null;
  club: string | null;
  market_value: number | null;
  nationality: string | null;
  image_url: string | null;
  is_starting: boolean;
  is_captain: boolean;
};

export type StaffMember = {
  id: string;
  team_id: string;
  name: string;
  role: string;
  nationality: string | null;
  image_url: string | null;
};

export type QualMatch = {
  id: string;
  team_id: string;
  opponent: string;
  match_date: string;
  competition: string | null;
  home_score: number | null;
  away_score: number | null;
  venue: string | null;
  is_home: boolean;
  result: "W" | "D" | "L" | null;
};

export type Honour = {
  id: string;
  team_id: string;
  competition: string;
  title_count: number;
  years: string | null;
};

export type TeamMedia = {
  id: string;
  team_id: string;
  media_type: "flag" | "jersey" | "logo" | "stadium";
  image_url: string;
  caption: string | null;
};

export type TeamFullProfile = {
  overview: TeamOverview;
  recentForm: ("W" | "D" | "L")[];
  players: Player[];
  coachingStaff: StaffMember[];
  qualificationMatches: QualMatch[];
  honours: Honour[];
  media: TeamMedia[];
};

export async function getTeamFullProfile(
  teamId: string
): Promise<TeamFullProfile | null> {
  const supabase = createServerClient();

  const [
    overviewRes,
    recentFormRes,
    playersRes,
    staffRes,
    matchesRes,
    honoursRes,
    mediaRes,
  ] = await Promise.all([
    supabase.from("team_overview").select("*").eq("id", teamId).maybeSingle(),
    supabase.from("team_recent_form").select("*").eq("team_id", teamId).maybeSingle(),
    supabase
      .from("players")
      .select("*")
      .eq("team_id", teamId)
      .order("is_starting", { ascending: false })
      .order("jersey_number", { ascending: true }),
    supabase.from("coaching_staff").select("*").eq("team_id", teamId),
    supabase
      .from("qualification_matches")
      .select("*")
      .eq("team_id", teamId)
      .order("match_date", { ascending: true }),
    supabase
      .from("honours")
      .select("*")
      .eq("team_id", teamId)
      .order("title_count", { ascending: false }),
    supabase.from("team_media").select("*").eq("team_id", teamId),
  ]);

  if (!overviewRes.data) return null;

  return {
    overview: overviewRes.data as unknown as TeamOverview,
    recentForm: ((recentFormRes.data as any)?.last_results ?? []).filter(Boolean),
    players: (playersRes.data ?? []) as unknown as Player[],
    coachingStaff: (staffRes.data ?? []) as unknown as StaffMember[],
    qualificationMatches: (matchesRes.data ?? []) as unknown as QualMatch[],
    honours: (honoursRes.data ?? []) as unknown as Honour[],
    media: (mediaRes.data ?? []) as unknown as TeamMedia[],
  };
}
