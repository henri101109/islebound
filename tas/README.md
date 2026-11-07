# Islebound TAS

Tool-assisted play for Islebound: frame pause/step, slow-motion time scale, input record/playback, seeded RNG observation, catch prediction, and savestates.

**No cheats.** This does not grant resources, god mode, skip validation, or spoof leaderboard scores. RNG can be *observed*, *reseeding*, and *planned around* (savestate retry) through normal game rules — catch rolls still go through the real `rollBoatCatch` / `rollPondCatch` paths.

## Delivery: Chrome extension

Primary delivery is a **Chrome / Chromium extension** (Manifest V3) under `tas/chrome-extension/`.

Islebound is a single canvas page with the sim inside a closed IIFE (`js/game.js`). The extension injects:

1. **`page/tas-boot.js`** at `document_start` (sync) — seeded `Math.random` + frame-gate API  
2. **`page/tas.js`** at `document_idle` — overlay UI + hotkeys  

Light hooks inside `js/game.js` (already in this repo) pause/step the loop, bind `keys`, and expose catch context + savestate snapshots. The existing speedrun “VID” replay is pose spectating — not an input TAS.

### Install (Load unpacked)

1. Open Chrome → `chrome://extensions`
2. Enable **Developer mode**
3. **Load unpacked** → select `tas/chrome-extension/`
4. Open Islebound (local server, `file://`, or matching host)
5. For `file://` pages: on the extension card, enable **Allow access to file URLs**

The TAS overlay appears top-right. Toolbar popup summarizes hotkeys.

### Hosts matched

- `http://localhost` / `http://127.0.0.1`
- `file://`
- `*.github.io` (incl. project pages)

Edit `manifest.json` `content_scripts` / `web_accessible_resources` matches if you host elsewhere.

### Syncing scripts

`js/tas-boot.js` and `js/tas.js` are the editable sources. After changing them, copy into the extension package:

```bash
cp js/tas-boot.js tas/chrome-extension/page/tas-boot.js
cp js/tas.js tas/chrome-extension/page/tas.js
```

Then click **Reload** on the extension card.

## Optional: page fallback (no extension)

If you are not using the extension, you can still enable TAS by loading boot **before** `game.js` and the overlay after:

```html
<script src="js/tas-boot.js"></script>
<script src="js/game.js"></script>
<script src="js/tas.js"></script>
```

Then open with `?tas=1` or `localStorage.setItem("islebound-tas","1")`.

Do **not** run both the extension and the in-page scripts at once (double boot).

## Controls

| Input | Action |
|-------|--------|
| `` ` `` (backquote) | Pause / resume |
| `]` | Advance one frame (while paused) |
| `,` / `.` | Slow-mo slower / faster (presets + fine steps) |
| `[` | Toggle overlay panel |
| `F6` / `F7` | Save / load savestate slot 1 |
| `F9` | Toggle input recording |
| `F10` | Play recorded tape |
| `F11` | Export tape JSON |

Panel: Pause, Step, **speed slider + 0.25× / 0.5× / 1×**, Rec/Play, Save/Load, Reseed, Export/Import.

While TAS is active, the sim uses a **60 Hz virtual clock**. **Time scale** multiplies each running tick’s `dt` (0.25× / 0.5× feel like slow motion across movement, fishing, wildlife, etc.). Pause still freezes; **Step** always advances one full 60 Hz tick regardless of scale.

## RNG workflow (legitimate exploitation)

1. Pause before a cast (`\``).
2. Read **Next cast → …** — prediction peeks the PRNG without consuming it, using the same band/bait/super-legend rules as the game.
3. If the predicted catch is wrong for your route, **savestate load** (or reseed) and approach the cast again so ambient wildlife rolls reshuffle — or keep stepping until the peek looks right, then cast.
4. Casting still calls the real roll functions; we never overwrite `rod.catchId`.

## Files

| Path | Role |
|------|------|
| `tas/chrome-extension/` | Chrome extension (Load unpacked) |
| `tas/chrome-extension/page/tas-boot.js` | Injected seeded PRNG + frame API |
| `tas/chrome-extension/page/tas.js` | Injected overlay |
| `js/tas-boot.js` / `js/tas.js` | Source copies (keep in sync) |
| `js/game.js` | Loop gate + `bindGame` (TAS hooks) |

## Fair play note

Do not submit TAS / reseeded runs to public leaderboards as raw play. This tooling is for practice, routing, and RNG study.
