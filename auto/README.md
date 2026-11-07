# Islebound auto-runner (watchable grind)

Scripted speedrun agent that repeats a category hundreds of times, keeps the best time + seed + trajectory, and shows a live overlay so Henri can watch.

**Fair play:** uses TAS seeded RNG + time scale + input control only. No god mode, free resources, or leaderboard spoof. Do not submit auto/TAS times as raw RTA.

## Quick start (watch)

1. Serve the game (any static server from repo root), e.g. `python3 -m http.server 8765`
2. Open:

```
http://127.0.0.1:8765/?tas=1&auto=1&cat=blowfish&scale=4&max=400
```

Death% / boat% grind (Henri TAS cords):

```
http://127.0.0.1:8765/?tas=1&auto=1&cat=death&scale=4&max=200
http://127.0.0.1:8765/?tas=1&auto=1&cat=boat&scale=4&max=400
```

**Optimal hold-tape demo (slow-mo, not BFS):**

```
http://127.0.0.1:8765/?tas=1&auto=1&cat=death&tape=1&scale=0.25
http://127.0.0.1:8765/?tas=1&auto=1&cat=boat&tape=1&scale=0.25
```

| Param | Meaning |
|-------|---------|
| `tas=1` | Required — enables seeded RNG + frame clock |
| `auto=1` | Enable the grinder |
| `cat=` | `blowfish` (default), `mask`, `death`, or `boat` |
| `tape=1` | Replay dump `input_holds` (death/boat; aliases `replay`/`demo`) |
| `scale=` | Sim speed `0.05`–`8` (default `4`; tape default `0.25`) |
| `max=` | Stop after N attempts (default `400`; tape default `1`) |
| `watch` | Spectate; keeps explicit `scale=` (else `1×` when not tape) |

**Chrome extension TAS:** load `tas/chrome-extension`, then use the same URL **without** double-loading in-page TAS, or use `?auto=1` only if the extension already booted TAS.

## Watch controls

| Key | Action |
|-----|--------|
| `G` | Pause / resume the agent |
| `H` | Dump best JSON to console (+ clipboard when allowed) |
| TAS `` ` `` / `]` / `,` `.` | Pause, step, slow-mo (from TAS overlay) |

Overlay (bottom-left): attempt count, hits, best time + seed, phase, status line.

## What it searches

### Blowfish%

1. Boot → Speedrun → Blowfish%
2. Inland corridor (north, then east) → pond dinghy → board → cast
3. Catch id is known at cast start — wrong species → immediate reset + new seed
4. Blowfish → wait for hearts / finish → log time; keep PB
5. Wrong indoor scene / soft timeout also resets

Target: hundreds of attempts via `max=` + `scale=4`–`8`. WR report notes first-cast blowfish ~12–16s lucky RTA vs 33.97s WR.

**Timing note:** the in-game speedrun clock uses wall `performance.now()`. Under TAS `scale>1` that clock is compressed. The auto overlay stores **sim-adjusted** PBs (`wallMs * scale`) so times stay comparable to RTA.

### Mask%

1. Pathfind to temple door → enter
2. BFS the deterministic temple maze → jade pedestal
3. Repeat for cleaner island approaches / stuck recovery

Largest pure-routing category per WR analysis.

### Death%

1. Spawn pier `(816, 1791)` → hold **D** east on dock
2. Past dock edge → **DS** into river water settle `~(854, 1798)`
3. Idle until drown lock + dead anim finishes (~9.17s theoretical floor)

Uses Henri TAS `bot_plan` / `input_holds` (no post-water movement).

### Boat%

1. Loot nearest beach **crystal** (seed-stable beach pack)
2. Shop door → **T** sell as fade clears → walk out during coin HUD
3. Harbor approach → **T** buy when coins ≥ 10 → stand in board radius → **Enter** board

Reseeds each attempt to grind shop think/flight RNG (TAS band ~6.5–7.2s).

## Best path storage

`localStorage["islebound-auto-grind-v1"]` per category:

- `bestMs`, `bestSeed`, `bestPath.traj` (sampled `{t,x,y,scene}`)
- `history` of finishes

Inspect: `window.__IsleboundAuto.dumpBest()` or press `H`.

## Files

| Path | Role |
|------|------|
| `js/auto-runner.js` | Agent + overlay |
| `js/tas-boot.js` | Agent controller hook + time scale up to 8× |
| `js/game.js` | `bindGame` observe / beginCategory / cast / enter |
| `index.html` | Loads auto-runner after game/TAS |
