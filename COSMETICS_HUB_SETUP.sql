-- Islebound cosmetics / hub / daily idol (safe to re-run).
-- Paste into Supabase SQL Editor after SETUP_ALL.sql.
-- Client soft-fails if these columns/tables are missing.

-- ========== Hub pose columns on players_online ==========
alter table public.players_online add column if not exists in_hub boolean;
alter table public.players_online add column if not exists hub_x integer;
alter table public.players_online add column if not exists hub_y integer;
alter table public.players_online add column if not exists hub_face integer;
alter table public.players_online add column if not exists face_id text;
alter table public.players_online add column if not exists back_id text;
alter table public.players_online add column if not exists emote text;

-- ========== Account-bound daily idol claims (UTC calendar day) ==========
create table if not exists public.daily_claims (
  user_id uuid not null,
  day_utc text not null check (char_length(day_utc) between 8 and 16),
  item_id text not null default 'sun_idol',
  claimed_at timestamptz not null default now(),
  primary key (user_id, day_utc)
);
alter table public.daily_claims enable row level security;
drop policy if exists "Public read daily_claims" on public.daily_claims;
create policy "Public read daily_claims" on public.daily_claims
  for select to anon, authenticated using (true);
drop policy if exists "Insert own daily_claims" on public.daily_claims;
create policy "Insert own daily_claims" on public.daily_claims
  for insert to anon, authenticated with check (true);
drop policy if exists "Update own daily_claims" on public.daily_claims;
create policy "Update own daily_claims" on public.daily_claims
  for update to anon, authenticated using (true) with check (true);
