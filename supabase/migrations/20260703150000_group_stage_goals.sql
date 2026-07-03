-- Vòng bảng + cầu thủ ghi bàn (openfootball/worldcup.json)
-- Dùng cùng bảng match_goals / view top_scorers qua supabase-untyped.ts
-- Không regenerate supabase_types.ts.

-- 1) Bảng trận vòng bảng (tách khỏi knockout_matches)
create table if not exists public.group_matches (
  id uuid primary key default gen_random_uuid(),
  external_key text not null unique,
  group_name text not null,
  matchday text not null,
  home_team_id uuid not null references public.teams(id),
  away_team_id uuid not null references public.teams(id),
  home_score int,
  away_score int,
  match_date timestamptz,
  stadium_name text,
  created_at timestamptz not null default now()
);

create index if not exists group_matches_group_name_idx on public.group_matches(group_name);
create index if not exists group_matches_match_date_idx on public.group_matches(match_date);

-- 2) Phân biệt bàn thắng vòng bảng vs knockout trên match_goals
alter table public.match_goals
  add column if not exists match_kind text not null default 'knockout'
  check (match_kind in ('group', 'knockout'));

-- Bỏ FK cứng match_id -> knockout_matches (nếu có) để match_id trỏ group_matches khi match_kind='group'
alter table public.match_goals drop constraint if exists match_goals_match_id_fkey;

-- Chống trùng khi chạy seed nhiều lần
create unique index if not exists match_goals_dedup_idx
  on public.match_goals (
    match_kind,
    match_id,
    team_id,
    player_name,
    minute,
    coalesce(minute_extra, -1)
  );

-- 3) Realtime cho bảng mới (idempotent)
do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'group_matches'
  ) then
    alter publication supabase_realtime add table public.group_matches;
  end if;
exception
  when duplicate_object then null;
end $$;

-- 4) View vua phá lưới: gom cả vòng bảng + knockout (loại phản lưới nhà)
create or replace view public.top_scorers as
select
  (coalesce(mg.player_id::text, '') || ':' || mg.team_id::text || ':' || lower(trim(mg.player_name))) as scorer_key,
  mg.player_id,
  mg.player_name,
  mg.team_id,
  t.name as team_name,
  t.flag_url as team_flag_url,
  count(*)::int as goals,
  count(*) filter (where mg.is_penalty)::int as penalty_goals,
  max(mg.created_at) as last_goal_date
from public.match_goals mg
join public.teams t on t.id = mg.team_id
where not mg.is_own_goal
group by mg.player_id, mg.player_name, mg.team_id, t.name, t.flag_url
order by goals desc, penalty_goals asc, mg.player_name asc;

comment on table public.group_matches is 'Trận vòng bảng World Cup 2026 — nguồn openfootball/worldcup.json';
comment on column public.match_goals.match_kind is 'group = vòng bảng (group_matches.id), knockout = vòng loại (knockout_matches.id)';
