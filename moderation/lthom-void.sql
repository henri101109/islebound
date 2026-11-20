-- Remove every LTHOM / LTOM speedrun from the server.
-- The anon key cannot delete. Paste this in the Supabase SQL editor.
-- To put the runs back, stop hiding the name in js/leaderboard.js
-- isBoardHiddenName, then reinsert from moderation/lthom-all-runs-restore.json
-- if these deletes have already run.
-- Ban expires 2026-11-21 02:45:00+00.

delete from public.speedrun_replays
where upper(trim(player_name)) in ('LTHOM', 'LTOM');

delete from public.speedrun_scores
where upper(trim(player_name)) in ('LTHOM', 'LTOM')
   or user_id = '37d0c58f-dd13-40dd-974b-f0af036c7470';

-- Accidental probe row created while checking delete permission.
delete from public.speedrun_scores
where id = 834 and player_name = 'ZZZRESTORE';

insert into public.player_bans (name_norm, user_id, match_mode, expires_at, reason)
select
  'LTHOM',
  '37d0c58f-dd13-40dd-974b-f0af036c7470',
  'name',
  '2026-11-21 02:45:00+00',
  'cheat: 1.25x multiplyer frame alter'
where not exists (
  select 1 from public.player_bans
  where user_id = '37d0c58f-dd13-40dd-974b-f0af036c7470'
    and expires_at > now()
);
