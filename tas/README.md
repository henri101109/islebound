# Islebound TAS

Tool-assisted play for Islebound: frame pause/step, input record/playback, seeded RNG observation, catch prediction, and savestates.

**No cheats.** This does not grant resources, god mode, skip validation, or spoof leaderboard scores. RNG can be *observed*, *reseeding*, and *planned around* (savestate retry) through normal game rules — catch rolls still go through the real `rollBoatCatch` / `rollPondCatch` paths.

## Why an in-page overlay?

Islebound is a single canvas page with the sim inside a closed IIFE (`js/game.js`). Input lives on a `keys` map, the clock is `requestAnimationFrame`, and every roll uses `Math.random()`. An in-page stack fits best:

1. `js/tas-boot.js` runs **before** `game.js` and replaces `Math.random` with a seeded PRNG when TAS is on.
2. Light hooks inside `game.js` pause/step the loop, bind `keys`, and expose catch context + savestate snapshots.
3. `js/tas.js` draws the overlay UI after the game loads.

A userscript/extension would only wrap the same hooks with more install friction. The existing speedrun “VID” replay is pose playback for anti-cheat spectating — not an input TAS — so this tooling sits beside it rather than reusing it.

## Enable

Open the game with a query flag:

```
index.html?tas=1
```

Or persist:

```js
localStorage.setItem("islebound-tas", "1");
```

Without the flag, `tas-boot.js` is inert (`enabled: false`) and `Math.random` stays native.

## Controls

| Input | Action |
|-------|--------|
| `` ` `` (backquote) | Pause / resume |
| `]` | Advance one frame (while paused) |
| `[` | Toggle overlay panel |
| `F6` / `F7` | Save / load savestate slot 1 |
| `F9` | Toggle input recording |
| `F10` | Play recorded tape |
| `F11` | Export tape JSON |

Panel buttons mirror these: Pause, Step, Rec/Play, Save/Load, Reseed, Export/Import.

While TAS is active, the sim runs on a **fixed 60 Hz** virtual clock (pause freezes it; step advances one tick).

## RNG workflow (legitimate exploitation)

1. Pause before a cast (`\``).
2. Read **Next cast → …** — prediction peeks the PRNG without consuming it, using the same band/bait/super-legend rules as the game.
3. If the predicted catch is wrong for your route, **savestate load** (or reseed) and approach the cast again so ambient wildlife rolls reshuffle — or keep stepping until the peek looks right, then cast.
4. Casting still calls the real roll functions; we never overwrite `rod.catchId`.

`seed0` / `calls` / `state` in the panel show the PRNG cursor. **Reseed** sets a new uint32 seed (call count resets to 0).

## Input tape

- **Rec** stores per-frame key snapshots (movement, cast, slots, etc.).
- **Play** reapplies them each tick (best with the same seed/savestate you recorded from).
- Export/import JSON for sharing routes offline.

Playback is deterministic only when the seeded PRNG position and game snapshot match the recording start. Ambient systems also consume RNG each frame — prefer recording from a savestate + known seed.

## Files

| File | Role |
|------|------|
| `js/tas-boot.js` | Optional seeded `Math.random`, frame gate API |
| `js/tas.js` | Overlay + hotkeys + catch planner |
| `js/game.js` | Loop gate + `bindGame` snapshot/restore (TAS-only) |
| `index.html` | Script order: boot → game → overlay |

## Fair play note

Do not submit TAS / reseeded runs to public leaderboards as raw play. This tooling is for practice, routing, and RNG study.
