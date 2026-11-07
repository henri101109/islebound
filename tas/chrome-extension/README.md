# Islebound TAS — Chrome extension

Manifest V3 package for Henri’s Islebound TAS tooling (frame pause/step, slow-mo, input tape, RNG plan, savestates). Works for any speedrun category, including **death%** and **boat%**.

## Install (Load unpacked)

1. Open Chrome → `chrome://extensions`
2. Turn on **Developer mode** (top-right)
3. Click **Load unpacked**
4. Select **this folder** (`tas/chrome-extension` — the folder that contains `manifest.json`)
5. Open Islebound:
   - Local: `http://localhost…` / `http://127.0.0.1…` / `file://…`
   - Live: `https://henri101109.github.io/islebound/`
6. TAS overlay appears top-right

For `file://` games, on this extension’s card enable **Allow access to file URLs**.

Requires an Islebound build whose `js/game.js` includes the TAS hooks (this branch). After merging, hard-refresh the GitHub Pages build.

## What it does

- Injects seeded RNG + frame gate at `document_start`
- Injects overlay UI at idle
- Lets you pause/step, slow-mo, record/play input tapes, savestate, and peek catch RNG
- **Does not** auto-run death% / boat% routes — there is no cord/route tape yet (see `tas/README.md` Gaps)

## Package layout

- `manifest.json` — MV3
- `inject-boot.js` — `document_start` sync inject of seeded RNG
- `inject-ui.js` — overlay after load
- `page/tas-boot.js` / `page/tas.js` — page-world scripts (keep in sync with `js/tas-*.js`)
- `popup.html` — toolbar summary
