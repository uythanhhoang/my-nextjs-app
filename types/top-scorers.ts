export type TopScorerRow = {
  scorer_key: string;
  player_id: string | null;
  player_name: string;
  team_id: string;
  team_name: string;
  team_flag_url: string | null;
  goals: number;
  penalty_goals: number;
  last_goal_date: string | null;
};
