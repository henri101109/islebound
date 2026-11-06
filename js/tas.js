/**
 * Islebound TAS overlay — UI + hotkeys. Requires tas-boot.js (?tas=1).
 * Legitimate tooling only: pause/step, input tape, RNG observe/plan, savestates.
 */
(() => {
  const tas = window.__IsleboundTAS;
  if (!tas || !tas.enabled) return;

  const CATCH_COMMON = ["cod", "trout", "salmon", "jelly"];
  const CATCH_RARE = ["catch_crab", "mini_shark", "jelly_green"];
  const CATCH_LEGEND = ["shark", "jelly_white", "chest"];
  const CATCH_SUPER = [
    { id: "jelly_gold", den: 200 },
    { id: "blowfish", den: 250 },
    { id: "jelly_rainbow", den: 300 },
    { id: "megalodon", den: 500 },
  ];
  const BAIT_IDS = { cod: 1, trout: 1, salmon: 1, jelly: 1, catch_crab: 1 };
  const MEGA_BAIT = { shark: 0.5, mini_shark: 0.25 };

  let panelOpen = true;
  let statusLine = "TAS ready — ` pause · ] step · [ panel";
  let savestates = [null, null, null]; // slots 1–3
  let fixedDtWarn = false;

  function el(tag, attrs, children) {
    const node = document.createElement(tag);
    if (attrs) {
      for (const k in attrs) {
        if (k === "style" && typeof attrs[k] === "object") Object.assign(node.style, attrs[k]);
        else if (k === "text") node.textContent = attrs[k];
        else if (k.startsWith("on") && typeof attrs[k] === "function") node.addEventListener(k.slice(2), attrs[k]);
        else node.setAttribute(k, attrs[k]);
      }
    }
    (children || []).forEach((c) => {
      if (c == null) return;
      node.appendChild(typeof c === "string" ? document.createTextNode(c) : c);
    });
    return node;
  }

  const root = el("div", {
    id: "islebound-tas",
    style: {
      position: "fixed",
      top: "8px",
      right: "8px",
      zIndex: "99999",
      fontFamily: "ui-monospace, SFMono-Regular, Menlo, Consolas, monospace",
      fontSize: "12px",
      color: "#e8f0e4",
      pointerEvents: "none",
      userSelect: "none",
    },
  });

  const badge = el("div", {
    style: {
      display: "inline-block",
      pointerEvents: "auto",
      background: "rgba(12, 22, 16, 0.92)",
      border: "1px solid #3d5c45",
      borderRadius: "6px",
      padding: "6px 10px",
      marginBottom: "6px",
      boxShadow: "0 4px 18px rgba(0,0,0,0.35)",
      cursor: "default",
    },
  });

  const panel = el("div", {
    style: {
      width: "320px",
      pointerEvents: "auto",
      background: "rgba(10, 18, 14, 0.94)",
      border: "1px solid #3d5c45",
      borderRadius: "8px",
      padding: "10px 12px",
      boxShadow: "0 8px 28px rgba(0,0,0,0.45)",
      lineHeight: "1.45",
    },
  });

  const live = el("div", { id: "tas-live" });
  const btns = el("div", {
    style: { display: "flex", flexWrap: "wrap", gap: "6px", marginTop: "8px" },
  });
  const rngBox = el("pre", {
    style: {
      margin: "8px 0 0",
      padding: "8px",
      background: "rgba(0,0,0,0.35)",
      borderRadius: "4px",
      whiteSpace: "pre-wrap",
      wordBreak: "break-word",
      maxHeight: "160px",
      overflow: "auto",
      fontSize: "11px",
    },
  });
  const help = el("div", {
    style: { marginTop: "8px", opacity: "0.75", fontSize: "11px" },
    text:
      "Hotkeys: ` pause/resume · ] frame step · [ toggle panel · F6/F7/F8 save/load/slot+ · F9 record · F10 play · F11 export tape. No cheats — RNG via seed/savestate only.",
  });

  function btn(label, onClick, title) {
    return el(
      "button",
      {
        type: "button",
        title: title || label,
        style: {
          pointerEvents: "auto",
          cursor: "pointer",
          background: "#1e3326",
          color: "#d7ead0",
          border: "1px solid #4a6b52",
          borderRadius: "4px",
          padding: "4px 8px",
          font: "inherit",
        },
        onclick: (e) => {
          e.preventDefault();
          e.stopPropagation();
          onClick();
          refresh();
        },
      },
      [label]
    );
  }

  btns.append(
    btn("Pause", () => tas.togglePause()),
    btn("Step", () => tas.requestStep(1)),
    btn("Step×5", () => tas.requestStep(5)),
    btn("Rec", () => {
      if (tas.isRecording()) {
        tas.stopRecord();
        statusLine = "Recording stopped (" + tas.tapeLength() + " frames)";
      } else {
        tas.startRecord();
        statusLine = "Recording inputs…";
      }
    }),
    btn("Play", () => {
      if (tas.isPlaying()) {
        tas.stopPlayback();
        statusLine = "Playback stopped";
      } else if (tas.startPlayback()) {
        statusLine = "Playing tape (" + tas.tapeLength() + ")";
      } else {
        statusLine = "No tape to play";
      }
    }),
    btn("Clear tape", () => {
      tas.clearTape();
      statusLine = "Tape cleared";
    }),
    btn("Save S1", () => {
      try {
        savestates[0] = tas.saveState();
        statusLine = "Saved state → slot 1";
      } catch (err) {
        statusLine = "Save failed: " + err.message;
      }
    }),
    btn("Load S1", () => {
      if (!savestates[0]) {
        statusLine = "Slot 1 empty";
        return;
      }
      try {
        tas.loadState(savestates[0]);
        statusLine = "Loaded slot 1";
      } catch (err) {
        statusLine = "Load failed: " + err.message;
      }
    }),
    btn("Reseed", () => {
      const raw = prompt("RNG seed (uint32)", String(tas.rng.getSeed0()));
      if (raw == null) return;
      const n = Number(raw);
      if (!Number.isFinite(n)) {
        statusLine = "Bad seed";
        return;
      }
      tas.rng.reseed(n >>> 0);
      statusLine = "Reseeded to " + (n >>> 0);
    }),
    btn("Export", () => {
      const text = tas.exportTape();
      const blob = new Blob([text], { type: "application/json" });
      const a = document.createElement("a");
      a.href = URL.createObjectURL(blob);
      a.download = "islebound-tas-tape.json";
      a.click();
      URL.revokeObjectURL(a.href);
      statusLine = "Tape exported";
    }),
    btn("Import", () => {
      const raw = prompt("Paste tape JSON");
      if (!raw) return;
      try {
        const n = tas.importTape(raw);
        statusLine = "Imported " + n + " frames";
      } catch (err) {
        statusLine = "Import failed: " + err.message;
      }
    })
  );

  panel.append(
    el("div", {
      style: { fontWeight: "700", letterSpacing: "0.04em", marginBottom: "4px", color: "#9fd4a8" },
      text: "ISLEBOUND TAS",
    }),
    live,
    btns,
    rngBox,
    help
  );
  root.append(badge, panel);
  document.body.appendChild(root);

  function predictOceanCatch(peek, ctx) {
    // Mirror rollBoatCatch / rollBandCatch / rollSuperLegend without mutating game RNG.
    let i = 0;
    const next = () => peek[i++];
    const irand = (min, max) => Math.floor(min + next() * (max - min + 1));
    const pickEqual = (list) => list[irand(0, list.length - 1)];

    const held = ctx.held;
    if (held === "serpent_heart") return { id: "blowfish", note: "guaranteed (heart)" };

    if (held && MEGA_BAIT[held] != null) {
      if (next() < MEGA_BAIT[held]) return { id: "megalodon", note: "mega bait hit" };
      // fall through to band without good bait
      return rollBand(false);
    }

    const bait = held && BAIT_IDS[held] ? held : null;
    return rollBand(!!bait);

    function rollBand(goodBait) {
      let band = Object.assign({}, ctx.band);
      if (goodBait) {
        let legend = band.legend * 1.25;
        let rare = band.rare * 1.5;
        const sum = legend + rare;
        if (sum > 0.95) {
          legend = (legend / sum) * 0.95;
          rare = (rare / sum) * 0.95;
        }
        band = { bite: band.bite, legend, rare };
      }
      const r = next();
      let id;
      if (r < band.legend) id = pickEqual(CATCH_LEGEND);
      else if (r < band.legend + band.rare) id = pickEqual(CATCH_RARE);
      else id = pickEqual(CATCH_COMMON);
      const mult = goodBait ? 1.1 : 1;
      const hits = [];
      for (let s = 0; s < CATCH_SUPER.length; s++) {
        if (next() < mult / CATCH_SUPER[s].den) hits.push(CATCH_SUPER[s].id);
      }
      if (hits.length) {
        const superId = pickEqual(hits);
        return { id: superId, note: "super (" + (goodBait ? "bait+" : "raw") + ")" };
      }
      return { id, note: goodBait ? "band+bait" : "band" };
    }
  }

  function predictPondCatch(peek) {
    let i = 0;
    const next = () => peek[i++];
    const r = next();
    if (r < 0.1) return { id: "portal_leech", note: "pond" };
    if (r < 0.22) return { id: "waterfall_eel", note: "pond" };
    if (r < 0.47) return { id: "blowfish", note: "pond" };
    const commons = ["cod", "trout", "salmon"];
    const id = commons[Math.floor(0 + next() * 3)];
    return { id, note: "pond common" };
  }

  function refresh() {
    badge.textContent =
      (tas.isPaused() ? "⏸ PAUSED" : "▶ RUN") +
      "  f" +
      tas.getFrameIndex() +
      (tas.isRecording() ? "  ●REC" : "") +
      (tas.isPlaying() ? "  ▷PLAY " + tas.playCursor() + "/" + tas.tapeLength() : "") +
      (panelOpen ? "" : "  ([] panel)");

    panel.style.display = panelOpen ? "block" : "none";

    const g = tas.game && tas.game();
    const ctx = g && g.getCatchContext ? g.getCatchContext() : null;
    const peek = tas.rng.peek(24);
    let pred = "—";
    if (ctx && ctx.canCast) {
      try {
        const p = ctx.pond ? predictPondCatch(peek.slice()) : predictOceanCatch(peek.slice(), ctx);
        pred = p.id + " (" + p.note + ")";
      } catch (err) {
        pred = "(need more RNG)";
      }
    } else if (ctx) {
      pred = "not cast-ready";
    } else {
      pred = "waiting for game bind…";
    }

    live.innerHTML = "";
    live.append(
      el("div", { text: statusLine }),
      el("div", {
        text:
          "seed0=" +
          tas.rng.getSeed0() +
          "  calls=" +
          tas.rng.getCalls() +
          "  state=" +
          tas.rng.getState(),
      }),
      el("div", {
        text:
          "tape=" +
          tas.tapeLength() +
          "  slots=" +
          savestates.map((s, i) => (s ? i + 1 : "·")).join(""),
      }),
      el("div", {
        style: { color: "#c9e8a8", marginTop: "4px" },
        text: "Next cast → " + pred,
      })
    );

    if (ctx) {
      live.append(
        el("div", {
          style: { opacity: "0.8", marginTop: "2px" },
          text:
            "held=" +
            (ctx.held || "—") +
            "  dockTiles=" +
            (ctx.dockTiles != null ? ctx.dockTiles.toFixed(2) : "—") +
            "  scene=" +
            (ctx.scene || "?"),
        })
      );
    }

    rngBox.textContent =
      "next RNG:\n" +
      peek
        .slice(0, 12)
        .map((v, i) => i.toString().padStart(2, "0") + ": " + v.toFixed(6))
        .join("\n");
  }

  // Hotkeys — capture before game where possible
  window.addEventListener(
    "keydown",
    (e) => {
      if (!tas.enabled) return;
      // Don't steal typing from chat / auth if those are focused — game handles that;
      // TAS hotkeys are non-printables / function keys.
      const k = e.key;
      if (k === "`" || k === "Backquote") {
        e.preventDefault();
        e.stopImmediatePropagation();
        const p = tas.togglePause();
        statusLine = p ? "Paused" : "Running";
        refresh();
        return;
      }
      if (k === "]") {
        e.preventDefault();
        e.stopImmediatePropagation();
        tas.requestStep(1);
        statusLine = "Step +1";
        refresh();
        return;
      }
      if (k === "[") {
        e.preventDefault();
        e.stopImmediatePropagation();
        panelOpen = !panelOpen;
        refresh();
        return;
      }
      if (k === "F6") {
        e.preventDefault();
        e.stopImmediatePropagation();
        try {
          savestates[0] = tas.saveState();
          statusLine = "F6 saved → slot 1";
        } catch (err) {
          statusLine = String(err.message || err);
        }
        refresh();
        return;
      }
      if (k === "F7") {
        e.preventDefault();
        e.stopImmediatePropagation();
        if (!savestates[0]) statusLine = "Slot 1 empty";
        else {
          try {
            tas.loadState(savestates[0]);
            statusLine = "F7 loaded slot 1";
          } catch (err) {
            statusLine = String(err.message || err);
          }
        }
        refresh();
        return;
      }
      if (k === "F9") {
        e.preventDefault();
        e.stopImmediatePropagation();
        if (tas.isRecording()) {
          tas.stopRecord();
          statusLine = "Rec off (" + tas.tapeLength() + ")";
        } else {
          tas.startRecord();
          statusLine = "Rec on";
        }
        refresh();
        return;
      }
      if (k === "F10") {
        e.preventDefault();
        e.stopImmediatePropagation();
        if (tas.isPlaying()) {
          tas.stopPlayback();
          statusLine = "Play off";
        } else if (tas.startPlayback()) statusLine = "Play on";
        else statusLine = "No tape";
        refresh();
        return;
      }
      if (k === "F11") {
        e.preventDefault();
        e.stopImmediatePropagation();
        const text = tas.exportTape();
        const blob = new Blob([text], { type: "application/json" });
        const a = document.createElement("a");
        a.href = URL.createObjectURL(blob);
        a.download = "islebound-tas-tape.json";
        a.click();
        URL.revokeObjectURL(a.href);
        statusLine = "Exported tape";
        refresh();
      }
    },
    true
  );

  // Live refresh
  setInterval(refresh, 200);
  refresh();

  // Soft notice once
  if (!fixedDtWarn) {
    fixedDtWarn = true;
    console.info(
      "[Islebound TAS] Active. Seeded Math.random + fixed 60Hz ticks while TAS is on. Open with ?tas=1"
    );
  }
})();
