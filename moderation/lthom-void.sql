-- Remove every LTHOM / LTOM speedrun from the server.
-- The anon key cannot delete. Paste this in the Supabase SQL editor.
-- To put the runs back, stop hiding the name in js/leaderboard.js
-- isBoardHiddenName, then reinsert from moderation/lthom-all-runs-restore.json
-- or moderation/bantempbans-runs-restore.json
-- or moderation/martin-runs-restore.json if these deletes have already run.
-- 7-day ban expires 2026-11-27 15:20:00+00.
-- No IP was stored for either name, so these rows match account, name, and browser id.
-- 104.28.216.104 is a permanent network ban. It does not expire.

delete from public.speedrun_replays
where upper(trim(player_name)) in ('LTHOM', 'LTOM', 'BANTEMPBANS', 'BANTEMBA', 'MARTIN');

delete from public.speedrun_scores
where upper(trim(player_name)) in ('LTHOM', 'LTOM', 'BANTEMPBANS', 'BANTEMBA', 'MARTIN')
   or user_id = '37d0c58f-dd13-40dd-974b-f0af036c7470';

-- Accidental probe row created while checking delete permission.
delete from public.speedrun_scores
where id = 834 and player_name = 'ZZZRESTORE';

insert into public.player_bans (ip, match_mode, expires_at, reason)
select
  '104.28.216.104',
  'ip',
  null,
  E'ISLEBOUND ANTICHEAT\n-- network banned\n-- no play and no accounts\n\ncontact developer if incorrect'
where not exists (
  select 1 from public.player_bans
  where ip = '104.28.216.104'
    and (expires_at is null or expires_at > now())
);

insert into public.player_bans (name_norm, user_id, client_id, match_mode, expires_at, reason)
select
  v.name_norm,
  v.user_id,
  v.client_id,
  'name',
  '2026-11-27 15:20:00+00',
  E'ISLEBOUND ANTICHEAT\n-- secondary account detected\n-- voilates tempban rules\n-- 7 day tempban\n-- refrain from creating alternate accounts\n-- game tick multiplyer detected\n\ncontact developer if incorrect'
from (
  values
    ('LTHOM'::text, '37d0c58f-dd13-40dd-974b-f0af036c7470'::uuid, '3337bf7d-1ece-46dc-a4ad-de3465197cce'::text),
    ('LTHOM', null, '06f88beb-595d-48de-8d5d-8c29b6153b92'),
    ('BANTEMPBANS', null, '854f329a-0e0c-4be1-9306-44f61b00af20')
) as v(name_norm, user_id, client_id)
where not exists (
  select 1 from public.player_bans b
  where b.expires_at > now()
    and (
      (v.user_id is not null and b.user_id = v.user_id)
      or (v.client_id is not null and b.client_id = v.client_id)
      or upper(trim(b.name_norm)) = v.name_norm
    )
);
