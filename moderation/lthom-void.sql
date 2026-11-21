-- LTHOM / BANTEMPBANS / 104.28.216.104 moderation
-- Survival world restored. Speedruns and duels stay locked in the client
-- (isCompetitiveRestricted). Old board times stay hidden via isBoardHiddenName.
--
-- Paste this in the Supabase SQL editor to clear full play bans so accounts
-- and cloud world_save can load again.
--
-- Speedrun wipe (already applied earlier) stays in place. To put runs back
-- on the board, stop hiding those names in js/leaderboard.js isBoardHiddenName,
-- then reinsert from moderation/lthom-all-runs-restore.json
-- or moderation/bantempbans-runs-restore.json
-- or moderation/martin-runs-restore.json.

-- Clear active full bans for LTHOM, alts, and the 104 network lock.
delete from public.player_bans
where ip = '104.28.216.104'
   or user_id = '37d0c58f-dd13-40dd-974b-f0af036c7470'
   or upper(trim(name_norm)) in ('LTHOM', 'LTOM', 'BANTEMPBANS', 'BANTEMBA')
   or client_id in (
     '854f329a-0e0c-4be1-9306-44f61b00af20',
     '3337bf7d-1ece-46dc-a4ad-de3465197cce',
     '06f88beb-595d-48de-8d5d-8c29b6153b92'
   );

-- Accidental probe row created while checking delete permission.
delete from public.speedrun_scores
where id = 834 and player_name = 'ZZZRESTORE';
