# Islebound TAS — Chrome extension

## Install

1. Go to `chrome://extensions`
2. Turn on **Developer mode**
3. Click **Load unpacked**
4. Select this folder (`tas/chrome-extension`)
5. Open Islebound on localhost / file / GitHub Pages — TAS overlay appears top-right

For `file://` games, enable **Allow access to file URLs** on this extension’s card.

## Package layout

- `manifest.json` — MV3
- `inject-boot.js` — `document_start` sync inject of seeded RNG
- `inject-ui.js` — overlay after load
- `page/tas-boot.js` / `page/tas.js` — page-world scripts (keep in sync with `js/tas-*.js`)
- `popup.html` — toolbar summary

Requires the Islebound build that includes TAS hooks in `js/game.js`.
