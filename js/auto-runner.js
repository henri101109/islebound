/**
 * Islebound watchable auto-runner / route grinder.
 * Enable with ?tas=1&auto=1&cat=blowfish (or mask|death|boat). Requires TAS boot (seeded RNG + time scale).
 * Scripted policies + seed search. No god mode / free resources / leaderboard spoof.
 *
 * Optimal-path demo (Henri TAS dump input_holds / bot_plan), not BFS:
 *   ?tas=1&auto=1&cat=death&tape=1&scale=0.25
 *   ?tas=1&auto=1&cat=boat&tape=1&scale=0.25
 * Aliases: replay=1, demo=1. Optional &watch (spectate; keeps explicit scale).
 */
(() => {
  if (window.__IsleboundAuto) return;

  const params = new URLSearchParams(location.search);
  const autoParam = params.get("auto") || params.get("grind");
  const enabled =
    autoParam === "1" ||
    autoParam === "true" ||
    (autoParam && autoParam !== "0" && autoParam !== "false") ||
    localStorage.getItem("islebound-auto") === "1";

  const CAT_ALIAS = {
    blowfish: "blowfish",
    blow: "blowfish",
    mask: "mask",
    jade: "mask",
    serpent: "serpent",
    death: "death",
    die: "death",
    drown: "death",
    boat: "boat",
    skiff: "boat",
    harbor: "boat",
  };
  const rawCat = (params.get("cat") || autoParam || "blowfish").toLowerCase();
  const category = CAT_ALIAS[rawCat] || (rawCat === "1" || rawCat === "true" ? "blowfish" : rawCat);

  const tapeParam = params.get("tape") || params.get("replay") || params.get("demo");
  const tapeMode =
    tapeParam === "1" ||
    tapeParam === "true" ||
    tapeParam === "opt" ||
    tapeParam === "wr" ||
    params.has("tape") ||
    params.has("replay") ||
    params.has("demo");

  const maxDefault = tapeMode ? "1" : "400";
  const maxAttempts = Math.max(1, Math.min(5000, parseInt(params.get("max") || maxDefault, 10) || 400));
  const scaleParamSet = params.has("scale");
  const scaleWanted = Math.max(
    0.05,
    Math.min(8, parseFloat(params.get("scale") || (tapeMode ? "0.25" : "4")) || (tapeMode ? 0.25 : 4))
  );
  const watchSlow = params.has("watch"); // spectate; do not override an explicit scale=
  /** v2: sim-adjusted times (wall * scale). Ignore legacy wall-only PBs under category floors. */
  const STORE_KEY = "islebound-auto-grind-v2";
  // death theoretical ~9.17s; boat LB floor 5s / TAS band ~6.5–7.2s
  const CAT_FLOOR_MS = { blowfish: 9900, mask: 22000, serpent: 20000, death: 9000, boat: 5000 };
  const FRAME_DT_MS = 1000 / 60;

  /** Henri TAS dump cords (islebound-tas-bot-v1). */
  const DEATH_WATER = { x: 854.19, y: 1798.38 };
  const DEATH_DOCK_X = 839;
  const BOAT_HARBOR_WAIT = { x: 870, y: 1847 };

  /**
   * Embedded islebound-tas-bot-v1 input_holds (+ bot_plan improvements for boat%).
   * TELEPORT markers → empty holds (door fade). T/Enter via discrete_actions.
   * Boat: cut WR door idle 2500–2800 (−300ms); harbor T at coin credit (not +133ms late).
   */
  const HOLD_TAPES = {
    death: {
      source: "islebound-tas-bot-v1 categories.death.input_holds",
      holds: [
        { t0: 0, t1: 133, keys: ["D"] },
        { t0: 133, t1: 266, keys: ["D", "S"] },
        { t0: 266, t1: 9165, keys: [] },
        { t0: 9165, t1: 9199, keys: ["A", "W"] },
      ],
      actions: [],
    },
    boat: {
      source: "islebound-tas-bot-v1 categories.boat.input_holds + bot_plan improvements",
      holds: [
        { t0: 0, t1: 300, keys: ["D"] },
        { t0: 300, t1: 466, keys: ["D", "S"] },
        { t0: 466, t1: 600, keys: ["D"] },
        { t0: 600, t1: 733, keys: ["D", "S"] },
        { t0: 733, t1: 1166, keys: ["D"] },
        { t0: 1166, t1: 1233, keys: ["D", "W"] },
        { t0: 1233, t1: 1300, keys: ["A", "W"] },
        { t0: 1300, t1: 1500, keys: ["A"] },
        { t0: 1500, t1: 1633, keys: ["A", "W"] },
        { t0: 1633, t1: 2400, keys: ["A"] },
        { t0: 2400, t1: 2500, keys: ["A", "W"] },
        { t0: 2500, t1: 3167, keys: [] },
        { t0: 3167, t1: 3242, keys: ["S"] },
        { t0: 3242, t1: 3616, keys: [] },
        { t0: 3616, t1: 3683, keys: ["S"] },
        { t0: 3683, t1: 4733, keys: [] },
        { t0: 4733, t1: 4841, keys: ["S"] },
        { t0: 4841, t1: 5491, keys: [] },
        { t0: 5491, t1: 5699, keys: ["D"] },
        { t0: 5699, t1: 5833, keys: ["D", "S"] },
        { t0: 5833, t1: 6116, keys: ["S"] },
        { t0: 6116, t1: 6516, keys: [] },
        { t0: 6516, t1: 6716, keys: ["S"] },
        { t0: 6716, t1: 7650, keys: [] },
        { t0: 7650, t1: 7661, keys: ["A", "S"] },
      ],
      actions: [
        { t: 2533, type: "PRESS_T_SHOP" },
        { t: 6483, type: "PRESS_T_HARBOR_BUY" },
      ],
    },
  };

  const api = {
    enabled: !!enabled,
    category,
    tapeMode: !!tapeMode,
    version: 2,
  };
  window.__IsleboundAuto = api;
  if (!enabled) return;

  const state = {
    phase: "boot",
    attempt: 0,
    successes: 0,
    bestMs: null,
    lastMs: null,
    lastSeed: null,
    bestSeed: null,
    bestPath: null,
    note: "Waiting for TAS…",
    stuckFrames: 0,
    lastX: 0,
    lastY: 0,
    path: [],
    pathI: 0,
    pathScene: null,
    castFrames: 0,
    menuFrames: 0,
    navMode: "north",
    tick: 0,
    attemptTick: 0,
    traded: false,
    bought: false,
    traj: [],
    running: true,
    pausedByUser: false,
    tapeSimMs: 0,
    tapeArmed: false,
    tapeActionI: 0,
    tapeHoldLabel: "",
  };

  function loadStore() {
    try {
      return JSON.parse(localStorage.getItem(STORE_KEY) || "{}") || {};
    } catch (e) {
      return {};
    }
  }
  function saveStore(patch) {
    const all = loadStore();
    const cat = all[category] || { attempts: 0, successes: 0, bestMs: null, bestSeed: null, bestPath: null, history: [] };
    Object.assign(cat, patch);
    if (Array.isArray(cat.history) && cat.history.length > 80) cat.history = cat.history.slice(-80);
    all[category] = cat;
    all.updatedAt = Date.now();
    localStorage.setItem(STORE_KEY, JSON.stringify(all));
  }

  {
    const prev = loadStore()[category];
    const floor = CAT_FLOOR_MS[category] || 0;
    if (prev) {
      const pb = prev.bestMs != null ? prev.bestMs : null;
      // Drop impossible legacy wall-clock PBs compressed by timeScale.
      if (pb != null && pb >= floor) {
        state.bestMs = pb;
        state.bestSeed = prev.bestSeed != null ? prev.bestSeed : null;
        state.bestPath = prev.bestPath || null;
      }
      state.attempt = 0; // session attempts start fresh; store keeps lifetime via saves
      state.successes = 0;
    }
  }

  function clearKeys(keys) {
    if (!keys) return;
    for (const k of Object.keys(keys)) keys[k] = false;
  }

  function seekKeys(keys, px, py, tx, ty) {
    const dx = tx - px;
    const dy = ty - py;
    const ax = Math.abs(dx);
    const ay = Math.abs(dy);
    if (ax > 2) {
      if (dx > 0) keys.d = keys.arrowright = true;
      else keys.a = keys.arrowleft = true;
    }
    if (ay > 2) {
      if (dy > 0) keys.s = keys.arrowdown = true;
      else keys.w = keys.arrowup = true;
    }
    // Prefer primary axis when nearly aligned
    if (ax > ay * 2.2) {
      keys.w = keys.s = keys.arrowup = keys.arrowdown = false;
    } else if (ay > ax * 2.2) {
      keys.a = keys.d = keys.arrowleft = keys.arrowright = false;
    }
  }

  function dist(ax, ay, bx, by) {
    return Math.hypot(ax - bx, ay - by);
  }

  /** Coarse BFS on temple / island using game canMoveAt. */
  function planPath(game, fromX, fromY, goalX, goalY, step) {
    const s = step || 8;
    const sx = Math.round(fromX / s) * s;
    const sy = Math.round(fromY / s) * s;
    const gx = Math.round(goalX / s) * s;
    const gy = Math.round(goalY / s) * s;
    const key = (x, y) => x + "," + y;
    const start = key(sx, sy);
    const goal = key(gx, gy);
    if (start === goal) return [{ x: goalX, y: goalY }];
    const q = [[sx, sy]];
    const came = Object.create(null);
    came[start] = null;
    const dirs = [
      [s, 0],
      [-s, 0],
      [0, s],
      [0, -s],
      [s, s],
      [s, -s],
      [-s, s],
      [-s, -s],
    ];
    let found = null;
    const limit = 8000;
    for (let i = 0; i < q.length && i < limit; i++) {
      const cur = q[i];
      const ck = key(cur[0], cur[1]);
      if (Math.abs(cur[0] - gx) <= s && Math.abs(cur[1] - gy) <= s) {
        found = ck;
        break;
      }
      for (let d = 0; d < dirs.length; d++) {
        const nx = cur[0] + dirs[d][0];
        const ny = cur[1] + dirs[d][1];
        const nk = key(nx, ny);
        if (came[nk] !== undefined) continue;
        if (!game.canMoveAt(nx, ny)) continue;
        came[nk] = ck;
        q.push([nx, ny]);
      }
    }
    if (!found) {
      // Greedy fallback waypoint
      return [{ x: goalX, y: goalY }];
    }
    const rev = [];
    let cur = found;
    while (cur) {
      const parts = cur.split(",");
      rev.push({ x: +parts[0], y: +parts[1] });
      cur = came[cur];
    }
    rev.reverse();
    rev.push({ x: goalX, y: goalY });
    // Thin path
    const out = [];
    for (let i = 0; i < rev.length; i += 2) out.push(rev[i]);
    if (out[out.length - 1] !== rev[rev.length - 1]) out.push(rev[rev.length - 1]);
    return out;
  }

  function recordSample(obs, seed) {
    if (!obs || !obs.srTiming) return;
    if (state.traj.length > 4000) return;
    if (state.traj.length % 3 === 0 || state.traj.length < 2) {
      state.traj.push({
        t: obs.srElapsed | 0,
        x: obs.player.x | 0,
        y: obs.player.y | 0,
        scene: obs.scene,
        seed: seed >>> 0,
      });
    }
  }

  function simMsFromWall(wallMs, tas) {
    // Game speedrun timer uses performance.now(); TAS timeScale compresses wall clock.
    // Recover approximate sim time so grind PBs are comparable to RTA.
    const scale = tas && typeof tas.getTimeScale === "function" ? tas.getTimeScale() : 1;
    const s = scale > 0 ? scale : 1;
    return Math.max(0, Math.round((wallMs | 0) * s));
  }

  function onFinish(obs, tas) {
    const wallMs = obs.srFinalMs | 0;
    let ms = simMsFromWall(wallMs, tas);
    const floor = CAT_FLOOR_MS[category] || 0;
    // Guard: never crown a PB under the client anti-cheat floor (bad scale / false finish).
    if (floor && ms < floor) {
      state.note = "Ignored sub-floor " + (ms / 1000).toFixed(2) + "s (wall " + (wallMs / 1000).toFixed(2) + "s)";
      state.phase = "restart";
      state.path = [];
      state.pathI = 0;
      state.traj = [];
      state.castFrames = 0;
      return;
    }
    const seed = tas.rng.getSeed0();
    const scale = tas.getTimeScale();
    state.lastMs = ms;
    state.lastSeed = seed;
    state.successes++;
    const improved = state.bestMs == null || ms < state.bestMs;
    if (improved) {
      state.bestMs = ms;
      state.bestSeed = seed;
      state.bestPath = {
        seed,
        ms,
        wallMs,
        scale,
        cat: category,
        traj: state.traj.slice(),
        at: Date.now(),
      };
      state.note = "NEW BEST ~" + (ms / 1000).toFixed(2) + "s sim (wall " + (wallMs / 1000).toFixed(2) + "s @" + scale + "x)";
    } else {
      state.note =
        "Done ~" + (ms / 1000).toFixed(2) + "s sim (best " + (state.bestMs / 1000).toFixed(2) + "s)";
    }
    const hist = (loadStore()[category] && loadStore()[category].history) || [];
    hist.push({ ms, wallMs, scale, seed: seed >>> 0, at: Date.now(), best: !!improved });
    saveStore({
      attempts: state.attempt,
      successes: state.successes,
      bestMs: state.bestMs,
      bestSeed: state.bestSeed,
      bestPath: state.bestPath,
      history: hist,
    });
    state.phase = "restart";
    state.path = [];
    state.pathI = 0;
    state.traj = [];
    state.castFrames = 0;
  }

  function startAttempt(game, tas) {
    if (state.attempt >= maxAttempts) {
      state.phase = "done";
      state.note = "Reached max attempts (" + maxAttempts + ")";
      state.running = false;
      clearKeys(game.keys);
      return;
    }
    state.attempt++;
    state.phase = "ready";
    state.menuFrames = 0;
    state.stuckFrames = 0;
    state.path = [];
    state.pathI = 0;
    state.pathScene = null;
    state.traj = [];
    state.castFrames = 0;
    state.navMode =
      category === "death" ? "east" : category === "boat" ? "loot" : "north";
    state.attemptTick = 0;
    state.traded = false;
    state.bought = false;
    state.tapeSimMs = 0;
    state.tapeArmed = false;
    state.tapeActionI = 0;
    state.tapeHoldLabel = "";
    state.path = [];
    state.pathI = 0;
    state.pathScene = null;
    // Tape demo: fixed seed for stable shop RNG. Grind: fresh seed each attempt.
    const seed = tapeMode
      ? 1
      : (Math.imul(state.attempt, 2654435761) ^ (Date.now() & 0xfffffff) ^ (tas.rng.getCalls() * 97)) >>> 0;
    tas.rng.reseed(seed || 1);
    game.beginCategory(category);
    state.note = (tapeMode ? "TAPE #" : "Attempt #") + state.attempt + " seed=" + (seed >>> 0);
    saveStore({
      attempts: state.attempt,
      successes: state.successes,
      bestMs: state.bestMs,
      bestSeed: state.bestSeed,
      bestPath: state.bestPath,
    });
  }

  function blowfishPolicy(game, tas, obs, keys) {
    if (obs.uiScreen === "finish") {
      onFinish(obs, tas);
      return;
    }
    if (obs.uiScreen === "ready") {
      state.menuFrames++;
      if (state.menuFrames > 4) {
        game.startTimer();
        state.phase = "run";
        state.menuFrames = 0;
        state.runStartMs = obs.srElapsed | 0;
      }
      return;
    }
    if (obs.uiScreen && obs.uiScreen !== null) return;

    // Dock shops/huts will eat a naive beach→jungle line — bail and reseed.
    if (obs.scene !== "island") {
      state.note = "Wrong scene " + obs.scene + " — reset";
      state.phase = "restart";
      return;
    }

    recordSample(obs, tas.rng.getSeed0());

    state.attemptTick++;
    // Soft timeout (~25s wall at 4× ≈ 100s sim; use live elapsed + tick backup).
    if ((obs.srElapsed | 0) > 35000 || state.attemptTick > 60 * 45) {
      state.note = "Timeout — reset";
      state.phase = "restart";
      return;
    }

    // Already casting — abort early if wrong species (catch rolled at cast start)
    if (obs.rod.phase === "wait" || obs.rod.phase === "reel" || obs.rod.phase === "tug") {
      state.castFrames++;
      const id = obs.rod.catchId;
      if (id && id !== "blowfish") {
        state.note = "Wrong catch " + id + " — reset";
        state.phase = "restart";
        return;
      }
      clearKeys(keys);
      state.note = "Reeling blowfish…";
      return;
    }

    if (obs.player.aboard && obs.aboardKind === "dinghy") {
      const ctx = game.getCatchContext();
      if (ctx && ctx.canCast) {
        clearKeys(keys);
        game.cast();
        state.note = "Casting…";
        return;
      }
      keys.a = true;
      return;
    }

    const boat = obs.pondBoat;
    if (!boat) {
      state.note = "No pond dinghy yet";
      return;
    }
    const px = obs.player.x;
    const py = obs.player.y;
    if (dist(obs.player.cx, obs.player.cy, boat.cx, boat.cy) < 28) {
      clearKeys(keys);
      game.enter();
      state.note = "Boarding dinghy";
      return;
    }

    // Corridor FSM: climb inland first (skip pier buildings), then east to pond, then approach.
    const pondY = boat.cy;
    const pondX = boat.cx;
    if (state.navMode === "north" && py <= pondY + 40) state.navMode = "east";
    if (state.navMode === "east" && px >= pondX - 40) state.navMode = "approach";
    // If still south of jungle after many ticks, keep forcing north and bias slightly east of spawn pier.
    if (state.navMode === "north") {
      keys.w = keys.arrowup = true;
      if (px < 950) keys.d = keys.arrowright = true; // leave west beach / pier mouth
      if (px > 1100) keys.a = keys.arrowleft = true;
      state.note = "↑ inland y=" + (py | 0);
    } else if (state.navMode === "east") {
      keys.d = keys.arrowright = true;
      if (py > pondY + 8) keys.w = keys.arrowup = true;
      if (py < pondY - 20) keys.s = keys.arrowdown = true;
      state.note = "→ pond x=" + (px | 0);
    } else {
      seekKeys(keys, px, py, pondX - obs.player.w / 2, pondY - obs.player.h / 2 - 2);
      state.note = "→ dinghy (" + (pondX | 0) + "," + (pondY | 0) + ")";
    }
    trackStuck(obs, keys);
    if (state.stuckFrames > 90) {
      // Escape hatch: re-bias inland
      state.navMode = py > pondY + 60 ? "north" : "east";
      state.stuckFrames = 0;
      state.note = "Unstick → " + state.navMode;
    }
  }

  function followPath(game, keys, obs, fallbackX, fallbackY) {
    const px = obs.player.x;
    const py = obs.player.y;
    while (state.pathI < state.path.length) {
      const wp = state.path[state.pathI];
      if (dist(px, py, wp.x, wp.y) < 10) {
        state.pathI++;
        continue;
      }
      seekKeys(keys, px, py, wp.x, wp.y);
      trackStuck(obs, keys);
      return;
    }
    seekKeys(keys, px, py, fallbackX, fallbackY);
    trackStuck(obs, keys);
  }

  function trackStuck(obs, keys) {
    const moved = dist(obs.player.x, obs.player.y, state.lastX, state.lastY);
    if (moved < 0.4) state.stuckFrames++;
    else state.stuckFrames = 0;
    state.lastX = obs.player.x;
    state.lastY = obs.player.y;
    if (state.stuckFrames > 45) {
      // Wiggle
      clearKeys(keys);
      const pick = (state.stuckFrames / 15) | 0;
      if (pick % 4 === 0) keys.a = true;
      else if (pick % 4 === 1) keys.d = true;
      else if (pick % 4 === 2) keys.w = true;
      else keys.s = true;
      if (state.stuckFrames > 120) {
        state.path = [];
        state.pathI = 0;
        state.stuckFrames = 0;
      }
    }
  }

  function maskPolicy(game, tas, obs, keys) {
    if (obs.uiScreen === "finish") {
      onFinish(obs, tas);
      return;
    }
    if (obs.uiScreen === "ready") {
      state.menuFrames++;
      if (state.menuFrames > 4) {
        game.startTimer();
        state.phase = "run";
        state.menuFrames = 0;
      }
      return;
    }
    if (obs.uiScreen && obs.uiScreen !== null) return;

    if (obs.scene !== "island" && obs.scene !== "temple") {
      state.note = "Wrong scene " + obs.scene + " — reset";
      state.phase = "restart";
      return;
    }
    if (obs.srTiming && (obs.srElapsed | 0) > 180000) {
      state.note = "Mask timeout — reset";
      state.phase = "restart";
      return;
    }

    recordSample(obs, tas.rng.getSeed0());

    if (obs.scene === "temple") {
      const ped = obs.templePedestal;
      if (!ped) {
        state.note = "Temple has no pedestal?";
        return;
      }
      const gx = ped.x + (ped.w || 16) / 2 - obs.player.w / 2;
      const gy = ped.y + (ped.h || 12) / 2 - obs.player.h / 2;
      if (!state.path.length || state.pathScene !== "temple") {
        state.path = planPath(game, obs.player.x, obs.player.y, gx, gy, 8);
        state.pathI = 0;
        state.pathScene = "temple";
        state.note = "Maze BFS (" + state.path.length + " wps)";
      }
      followPath(game, keys, obs, gx, gy);
      if (dist(obs.player.cx, obs.player.cy, ped.x + 8, ped.y + 4) < 22) {
        state.note = "At pedestal";
      }
      return;
    }

    // Island: run to temple door via inland corridor (avoid dock buildings).
    const door = obs.templeDoor;
    if (!door) {
      state.note = "No temple door";
      return;
    }
    const tx = door.x + door.w / 2 - obs.player.w / 2;
    const ty = door.y + door.h / 2 - obs.player.h / 2;
    if (obs.fadeMode) {
      clearKeys(keys);
      state.path = [];
      state.pathScene = null;
      state.note = "Entering temple…";
      return;
    }
    if (!state.path.length || state.pathScene !== "island-mask") {
      const px = obs.player.x;
      const py = obs.player.y;
      const wps = [
        { x: px, y: Math.min(py, 1650) },
        { x: 1400, y: 1400 },
        { x: 2200, y: 1200 },
        { x: 3200, y: 1000 },
        { x: 4200, y: 900 },
        { x: tx, y: ty },
      ];
      const glued = [];
      let cx0 = px;
      let cy0 = py;
      for (let i = 0; i < wps.length; i++) {
        const seg = planPath(game, cx0, cy0, wps[i].x, wps[i].y, 16);
        for (let j = 0; j < seg.length; j++) glued.push(seg[j]);
        cx0 = wps[i].x;
        cy0 = wps[i].y;
      }
      state.path = glued.length ? glued : wps;
      state.pathI = 0;
      state.pathScene = "island-mask";
    }
    followPath(game, keys, obs, tx, ty);
    state.note = "→ temple door";
  }

  function serpentStub(game, tas, obs, keys) {
    // Serpent needs shell + wand + ocean fight — mark as planned; fall back message.
    state.note = "Serpent% agent not yet routed — use blowfish/mask/death/boat";
    state.phase = "done";
    state.running = false;
    clearKeys(keys);
  }

  function applyHoldKeys(keys, list) {
    if (!list || !list.length) return;
    for (let i = 0; i < list.length; i++) {
      const k = String(list[i] || "").toLowerCase();
      if (!k || k === "." || k === "teleport") continue;
      keys[k] = true;
      if (k === "d") keys.arrowright = true;
      else if (k === "a") keys.arrowleft = true;
      else if (k === "w") keys.arrowup = true;
      else if (k === "s") keys.arrowdown = true;
    }
  }

  function holdAt(tape, tMs) {
    const holds = tape.holds || [];
    for (let i = 0; i < holds.length; i++) {
      const h = holds[i];
      if (tMs >= h.t0 && tMs < h.t1) return h;
    }
    if (holds.length && tMs >= holds[holds.length - 1].t1) return holds[holds.length - 1];
    return null;
  }

  function fireTapeActions(game, obs, tape, tMs) {
    const actions = tape.actions || [];
    while (state.tapeActionI < actions.length && tMs >= actions[state.tapeActionI].t) {
      const act = actions[state.tapeActionI++];
      if (act.type === "PRESS_T_SHOP") {
        if (obs.scene === "shop" && !obs.fadeMode) {
          if (typeof game.holdItem === "function") game.holdItem("crystal");
          if (typeof game.trade === "function") game.trade();
          state.traded = true;
          state.note = "TAPE T shop @" + (tMs | 0) + "ms";
        } else {
          // Retry next ticks until shop fade clears
          state.tapeActionI--;
          break;
        }
      } else if (act.type === "PRESS_T_HARBOR_BUY") {
        if ((obs.player.coins | 0) >= 10 && !obs.srBoughtBoat && obs.scene === "island" && !obs.fadeMode) {
          if (typeof game.trade === "function") game.trade();
          else game.enter();
          state.bought = true;
          state.note = "TAPE T harbor @" + (tMs | 0) + "ms";
        } else if (!obs.srBoughtBoat && !obs.ownedBoat) {
          state.tapeActionI--;
          break;
        }
      }
    }
  }

  /**
   * Replay dump input_holds on sim clock (not wall srElapsed, not BFS).
   * Door fades / auto-pickup / boarding still use game physics.
   */
  function tapePolicy(game, tas, obs, keys) {
    const tape = HOLD_TAPES[category];
    if (!tape) {
      state.note = "No hold tape for " + category;
      state.running = false;
      return;
    }

    if (obs.uiScreen === "finish") {
      onFinish(obs, tas);
      return;
    }
    if (obs.uiScreen === "ready") {
      state.menuFrames++;
      if (state.menuFrames > 4) {
        game.startTimer();
        state.phase = "run";
        state.menuFrames = 0;
        state.tapeArmed = true;
        state.tapeSimMs = 0;
        state.tapeActionI = 0;
        state.note = "TAPE armed @" + scaleWanted + "x";
      }
      return;
    }
    if (obs.uiScreen && obs.uiScreen !== null) return;

    if (!state.tapeArmed) {
      state.note = "TAPE waiting timer…";
      return;
    }

    // Advance sim clock by this tick's scaled frame (matches TAS virtual dt + game dt cap).
    const scale = typeof tas.getTimeScale === "function" ? tas.getTimeScale() : 1;
    state.tapeSimMs += Math.min(50, FRAME_DT_MS * (scale > 0 ? scale : 1));
    state.attemptTick++;
    recordSample(obs, tas.rng.getSeed0());

    const tMs = state.tapeSimMs;
    const lastT = tape.holds.length ? tape.holds[tape.holds.length - 1].t1 : 0;
    if (tMs > lastT + 4000) {
      state.note = "TAPE overrun — reset";
      state.phase = "restart";
      return;
    }

    fireTapeActions(game, obs, tape, tMs);

    // Board assist once skiff exists (WR ends aboard; Enter if docked).
    if (obs.ownedBoat && obs.ownedBoat.landed && !obs.player.aboard && !obs.boatThrow) {
      const b = obs.ownedBoat;
      if (dist(obs.player.cx, obs.player.cy, b.cx, b.cy) < 30) {
        clearKeys(keys);
        game.enter();
        state.note = "TAPE Enter board @" + (tMs | 0) + "ms";
        return;
      }
    }

    const hold = holdAt(tape, tMs);
    let list = hold && hold.keys ? hold.keys.slice() : [];

    // Death%: once the dump goes idle, keep DS into water until submerged — never stand on the shop door.
    if (category === "death") {
      if (obs.scene === "shop" || obs.fadeMode) {
        clearKeys(keys);
        state.note = "TAPE death wrong scene " + obs.scene + " — reset";
        state.phase = "restart";
        return;
      }
      const drowning = !!obs.player.inWater || (obs.player.dead || 0) > 0 || (obs.player.hp | 0) < 7;
      if (!drowning) {
        if (obs.player.x < DEATH_DOCK_X) list = ["D"];
        else list = ["D", "S"];
      } else {
        list = []; // idle drown — dump hold after water
      }
    }

    applyHoldKeys(keys, list);
    state.tapeHoldLabel = list.length ? list.join("") : ".";

    // Boat only: door/exit assists when the dump has idle/TELEPORT (empty hold).
    if (category === "boat" && !list.length && !obs.fadeMode) {
      if (obs.scene === "island" && obs.shopDoor && !state.traded && tMs >= 2400 && tMs < 3200) {
        const d = obs.shopDoor;
        const dx = d.x + d.w / 2 - obs.player.w / 2;
        const dy = d.y + d.h / 2 - obs.player.h / 2;
        if (dist(obs.player.x, obs.player.y, dx, dy) > 4) seekKeys(keys, obs.player.x, obs.player.y, dx, dy);
      } else if (obs.scene === "shop" && obs.shopExit && state.traded) {
        const ex = obs.shopExit;
        const gx = ex.x + (ex.w || 14) / 2 - obs.player.w / 2;
        const gy = ex.y + (ex.h || 10) / 2 - obs.player.h / 2;
        if (dist(obs.player.x, obs.player.y, gx, gy) > 4) seekKeys(keys, obs.player.x, obs.player.y, gx, gy);
      }
    }

    state.note =
      "TAPE " +
      (tMs / 1000).toFixed(2) +
      "s [" +
      state.tapeHoldLabel +
      "] " +
      (obs.scene || "") +
      " @" +
      scale +
      "x";
  }

  /**
   * Death%: D east on dock → DS into river water ~ (854, 1798) → idle drown.
   * From Henri TAS bot_plan / input_holds (WR ~9.20s, TAS floor ~9.17s).
   */
  function deathPolicy(game, tas, obs, keys) {
    if (obs.uiScreen === "finish") {
      onFinish(obs, tas);
      return;
    }
    if (obs.uiScreen === "ready") {
      state.menuFrames++;
      if (state.menuFrames > 4) {
        game.startTimer();
        state.phase = "run";
        state.menuFrames = 0;
        state.navMode = "east";
      }
      return;
    }
    if (obs.uiScreen && obs.uiScreen !== null) return;

    if (obs.scene !== "island") {
      state.note = "Wrong scene " + obs.scene + " — reset";
      state.phase = "restart";
      return;
    }

    recordSample(obs, tas.rng.getSeed0());
    state.attemptTick++;

    if ((obs.srElapsed | 0) > 18000 || state.attemptTick > 60 * 20) {
      state.note = "Death timeout — reset";
      state.phase = "restart";
      return;
    }

    // Dead anim / already submerged: stay still until finish after dead anim.
    if ((obs.player.dead || 0) > 0 || state.navMode === "idle") {
      clearKeys(keys);
      state.navMode = "idle";
      state.note =
        (obs.player.dead || 0) > 0
          ? "Dead anim… hp=" + (obs.player.hp | 0)
          : "Drowning… hp=" + (obs.player.hp | 0) + " sub=" + ((obs.player.submerged || 0) * 10 | 0) / 10;
      return;
    }

    const px = obs.player.x;
    const py = obs.player.y;
    const inWater = !!obs.player.inWater;

    // Settled in kill water — stop moving (no post-water travel).
    if (inWater && (px > DEATH_DOCK_X + 8 || dist(px, py, DEATH_WATER.x, DEATH_WATER.y) < 18)) {
      clearKeys(keys);
      state.navMode = "idle";
      state.note = "In water @(" + (px | 0) + "," + (py | 0) + ") — idle drown";
      return;
    }

    // bot_plan: D until past dock edge, then DS into river.
    if (px < DEATH_DOCK_X) {
      keys.d = keys.arrowright = true;
      state.navMode = "east";
      state.note = "D east x=" + (px | 0);
      return;
    }

    keys.d = keys.arrowright = true;
    keys.s = keys.arrowdown = true;
    state.navMode = "into";
    state.note = "DS → water (" + (DEATH_WATER.x | 0) + "," + (DEATH_WATER.y | 0) + ")";
  }

  function nearestLoot(obs, id) {
    const list = obs.lootNear || [];
    for (let i = 0; i < list.length; i++) {
      if (!id || list[i].id === id) return list[i];
    }
    return null;
  }

  function hasInv(obs, id) {
    const inv = obs.inventory || [];
    for (let i = 0; i < inv.length; i++) {
      if (inv[i] && inv[i].id === id) return true;
    }
    return obs.held === id;
  }

  /**
   * Boat%: beach crystal → shop T sell → exit during coin HUD → harbor T buy → board.
   * Seed-searches shop think/flight RNG (TAS band ~6.5–7.2s).
   */
  function boatPolicy(game, tas, obs, keys) {
    if (obs.uiScreen === "finish") {
      onFinish(obs, tas);
      return;
    }
    if (obs.uiScreen === "ready") {
      state.menuFrames++;
      if (state.menuFrames > 4) {
        game.startTimer();
        state.phase = "run";
        state.menuFrames = 0;
        state.navMode = "loot";
        state.traded = false;
        state.bought = false;
      }
      return;
    }
    if (obs.uiScreen && obs.uiScreen !== null) return;

    if (obs.scene !== "island" && obs.scene !== "shop") {
      state.note = "Wrong scene " + obs.scene + " — reset";
      state.phase = "restart";
      return;
    }

    recordSample(obs, tas.rng.getSeed0());
    state.attemptTick++;

    if ((obs.srElapsed | 0) > 28000 || state.attemptTick > 60 * 35) {
      state.note = "Boat timeout — reset";
      state.phase = "restart";
      return;
    }

    // Win path already boarded.
    if (obs.player.aboard && (obs.srBoughtBoat || obs.aboardKind === "skiff")) {
      clearKeys(keys);
      state.note = "Aboard — waiting finish";
      return;
    }

    const px = obs.player.x;
    const py = obs.player.y;
    const fading = !!obs.fadeMode;

    // --- Shop interior ---
    if (obs.scene === "shop") {
      if (fading) {
        clearKeys(keys);
        state.note = "Shop fade…";
        return;
      }
      if (hasInv(obs, "crystal") || obs.held === "crystal") {
        if (typeof game.holdItem === "function") game.holdItem("crystal");
      }
      const trade = obs.shopTrade || {};
      const thinking = trade.phase === "think" || (trade.sales | 0) > 0;
      if (!state.traded && !thinking) {
        clearKeys(keys);
        if (typeof game.trade === "function") game.trade();
        state.traded = true;
        state.note = "T sell crystal";
        return;
      }
      if (thinking) {
        // Exit south toward shop exit as soon as think starts — overlap coin HUD / flight.
        const ex = obs.shopExit;
        if (ex) {
          const gx = ex.x + (ex.w || 14) / 2 - obs.player.w / 2;
          const gy = ex.y + (ex.h || 10) / 2 - obs.player.h / 2;
          seekKeys(keys, px, py, gx, gy);
          state.note = "Exit during trade HUD";
        } else {
          keys.s = keys.arrowdown = true;
          state.note = "S → shop exit";
        }
        return;
      }
      // Trade done / coins flying — leave shop.
      const ex = obs.shopExit;
      if (ex) {
        const gx = ex.x + (ex.w || 14) / 2 - obs.player.w / 2;
        const gy = ex.y + (ex.h || 10) / 2 - obs.player.h / 2;
        seekKeys(keys, px, py, gx, gy);
      } else {
        keys.s = keys.arrowdown = true;
      }
      state.navMode = "harbor";
      state.note = "Leaving shop";
      return;
    }

    // Island fade (door transit)
    if (fading) {
      clearKeys(keys);
      state.path = [];
      state.pathScene = null;
      state.note = "Door fade…";
      return;
    }

    // Bought / throwing / boarding
    if (obs.srBoughtBoat || obs.ownedBoat || obs.boatThrow) {
      state.bought = true;
      state.navMode = "board";
      const boat = obs.ownedBoat;
      const throwInfo = obs.boatThrow;
      const berth = obs.boatBerth;
      let tx = BOAT_HARBOR_WAIT.x;
      let ty = BOAT_HARBOR_WAIT.y;
      if (throwInfo && throwInfo.x1 != null) {
        tx = throwInfo.x1;
        ty = throwInfo.y1;
      } else if (boat) {
        tx = boat.x;
        ty = boat.y;
      } else if (berth) {
        tx = berth.x;
        ty = berth.y;
      }
      // Stand in board radius during throw; Enter boards docked slip.
      seekKeys(keys, px, py, tx, ty);
      const targetCx = boat ? boat.cx : tx + 11;
      const targetCy = boat ? boat.cy : ty + 5;
      if (boat && boat.landed && dist(obs.player.cx, obs.player.cy, targetCx, targetCy) < 28) {
        clearKeys(keys);
        game.enter();
        state.note = "Enter board skiff";
        return;
      }
      if (!boat && throwInfo) {
        state.note = "Wait throw → berth";
      } else {
        state.note = "→ board (" + (tx | 0) + "," + (ty | 0) + ")";
      }
      trackStuck(obs, keys);
      return;
    }

    // After shop sell (or coins ready): hold harbor for coin HUD credit, then T buy.
    if ((state.traded || (obs.player.coins | 0) >= 10) && !obs.srBoughtBoat) {
      state.navMode = (obs.player.coins | 0) >= 10 ? "buy" : "harbor";
      const harbor = obs.harbor;
      const hx = harbor ? harbor.cx - obs.player.w / 2 : BOAT_HARBOR_WAIT.x;
      const hy = harbor ? harbor.cy - obs.player.h / 2 : BOAT_HARBOR_WAIT.y;
      if ((obs.player.coins | 0) >= 10 && harbor && dist(obs.player.cx, obs.player.cy, harbor.cx, harbor.cy) < 30) {
        clearKeys(keys);
        if (typeof game.trade === "function") game.trade();
        else game.enter();
        state.bought = true;
        state.note = "T buy boat";
        return;
      }
      seekKeys(keys, px, py, hx, hy);
      state.note =
        (obs.player.coins | 0) >= 10
          ? "→ harbor buy coins=" + (obs.player.coins | 0)
          : "Harbor wait coins=" + (obs.player.coins | 0);
      trackStuck(obs, keys);
      return;
    }

    // Have crystal (or any sellable) → shop door. Prefer crystal.
    if (hasInv(obs, "crystal") || hasInv(obs, "gem") || hasInv(obs, "jelly")) {
      if (hasInv(obs, "crystal") && typeof game.holdItem === "function") game.holdItem("crystal");
      else if (hasInv(obs, "gem") && typeof game.holdItem === "function") game.holdItem("gem");
      state.navMode = "to_shop";
      const door = obs.shopDoor;
      if (!door) {
        state.note = "No shop door";
        return;
      }
      const dx = door.x + door.w / 2 - obs.player.w / 2;
      const dy = door.y + door.h / 2 - obs.player.h / 2;
      // Cut WR door idle — walk straight in, no pause.
      seekKeys(keys, px, py, dx, dy);
      state.note = "→ shop door";
      trackStuck(obs, keys);
      if (state.stuckFrames > 90) {
        state.stuckFrames = 0;
        keys.w = keys.arrowup = true;
      }
      return;
    }

    // Loot nearest beach crystal (fallback: gem).
    state.navMode = "loot";
    let target = nearestLoot(obs, "crystal");
    if (!target) target = nearestLoot(obs, "gem");
    if (!target) {
      // Deterministic beach loot should exist — soft reset if missing too long.
      if (state.attemptTick > 60 * 6) {
        state.note = "No crystal/gem — reset";
        state.phase = "restart";
        return;
      }
      // Nudge east along beach from spawn toward typical WR loot (~998, 1818)
      seekKeys(keys, px, py, 1000, 1818);
      state.note = "Seek beach loot…";
      trackStuck(obs, keys);
      return;
    }
    seekKeys(keys, px, py, target.x - 2, target.y - 4);
    state.note = "→ " + target.id + " d=" + (target.d | 0);
    trackStuck(obs, keys);
  }

  function bootMenus(game, obs) {
    state.menuFrames++;
    if (obs.uiScreen === "logo") {
      game.skipLogo();
      return;
    }
    if (obs.uiScreen === "mode") {
      game.pickModeSpeedrun();
      return;
    }
    if (obs.uiScreen === "categories") {
      game.beginCategory(category);
      state.phase = "ready";
      state.menuFrames = 0;
      return;
    }
    if (obs.uiScreen === "ready" || (obs.playMode === "speedrun" && obs.srCat === category)) {
      state.phase = "ready";
      return;
    }
    // Stuck in other menus — try speedrun path
    if (state.menuFrames > 90) {
      game.beginCategory(category);
      state.phase = "ready";
    }
  }

  function agentTick(game, tas) {
    if (!state.running || state.pausedByUser) return;
    const keys = game.keys;
    clearKeys(keys);
    if (!game.observe) {
      state.note = "Game observe API missing";
      return;
    }
    const obs = game.observe();

    if (state.phase === "boot") {
      bootMenus(game, obs);
      return;
    }
    if (state.phase === "done") return;
    if (state.phase === "restart") {
      startAttempt(game, tas);
      return;
    }
    if (state.phase === "ready" && state.attempt === 0 && obs.uiScreen === "ready") {
      // First attempt after boot into ready
      startAttempt(game, tas);
      return;
    }
    if (state.phase === "ready" && obs.uiScreen !== "ready" && obs.uiScreen !== null && obs.uiScreen !== "finish") {
      bootMenus(game, obs);
      return;
    }

    if (tapeMode && (category === "death" || category === "boat")) {
      tapePolicy(game, tas, obs, keys);
      return;
    }
    if (category === "blowfish") blowfishPolicy(game, tas, obs, keys);
    else if (category === "mask") maskPolicy(game, tas, obs, keys);
    else if (category === "death") deathPolicy(game, tas, obs, keys);
    else if (category === "boat") boatPolicy(game, tas, obs, keys);
    else if (category === "serpent") serpentStub(game, tas, obs, keys);
    else {
      state.note = "Unsupported cat " + category;
      state.running = false;
    }
  }

  function fmtMs(ms) {
    if (ms == null) return "—";
    return (ms / 1000).toFixed(2) + "s";
  }

  function buildOverlay() {
    const el = document.createElement("div");
    el.id = "islebound-auto-panel";
    el.innerHTML =
      '<div class="ia-title" id="ia-title">AUTO GRIND</div>' +
      '<div class="ia-row"><span>Cat</span><b id="ia-cat"></b></div>' +
      '<div class="ia-row"><span>Phase</span><b id="ia-phase"></b></div>' +
      '<div class="ia-row"><span>Scene</span><b id="ia-scene"></b></div>' +
      '<div class="ia-row"><span>Attempt</span><b id="ia-attempt"></b></div>' +
      '<div class="ia-row"><span>Hits</span><b id="ia-hits"></b></div>' +
      '<div class="ia-row"><span>Best</span><b id="ia-best"></b></div>' +
      '<div class="ia-row"><span>Last</span><b id="ia-last"></b></div>' +
      '<div class="ia-row"><span>Seed</span><b id="ia-seed"></b></div>' +
      '<div class="ia-note" id="ia-note"></div>' +
      '<div class="ia-help">G pause · H dump · tape=1&amp;scale=0.25 for optimal holds</div>';
    const style = document.createElement("style");
    style.textContent =
      "#islebound-auto-panel{position:fixed;left:10px;bottom:10px;z-index:99999;min-width:220px;max-width:320px;" +
      "font:12px/1.35 ui-monospace,SFMono-Regular,Menlo,Consolas,monospace;color:#e8f0e4;background:rgba(12,18,14,.88);" +
      "border:1px solid #3d5a45;padding:10px 12px;pointer-events:none;backdrop-filter:blur(4px)}" +
      "#islebound-auto-panel .ia-title{font-weight:700;letter-spacing:.08em;color:#9dffa8;margin-bottom:6px}" +
      "#islebound-auto-panel .ia-row{display:flex;justify-content:space-between;gap:12px;opacity:.95}" +
      "#islebound-auto-panel .ia-row span{color:#8aa890}" +
      "#islebound-auto-panel .ia-note{margin-top:8px;color:#c6e6c8;min-height:2.4em}" +
      "#islebound-auto-panel .ia-help{margin-top:6px;font-size:10px;color:#6f8574}";
    document.documentElement.appendChild(style);
    document.documentElement.appendChild(el);
    return el;
  }

  function refreshOverlay() {
    const set = (id, v) => {
      const n = document.getElementById(id);
      if (n) n.textContent = v;
    };
    set("ia-title", tapeMode ? "TAPE DEMO" : "AUTO GRIND");
    set("ia-cat", category.toUpperCase() + (tapeMode ? " · TAPE" : ""));
    set("ia-phase", state.phase + (state.running ? "" : " (paused)"));
    try {
      const g = window.__IsleboundTAS && window.__IsleboundTAS.game && window.__IsleboundTAS.game();
      const o = g && g.observe && g.observe();
      set("ia-scene", o && o.scene ? o.scene : "—");
    } catch (e) {
      set("ia-scene", "—");
    }
    set(
      "ia-attempt",
      tapeMode
        ? (state.tapeSimMs / 1000).toFixed(2) + "s sim"
        : state.attempt + " / " + maxAttempts
    );
    set("ia-hits", String(state.successes));
    set("ia-best", fmtMs(state.bestMs) + (state.bestSeed != null ? " @" + (state.bestSeed >>> 0) : ""));
    set("ia-last", fmtMs(state.lastMs));
    set("ia-seed", state.lastSeed != null ? String(state.lastSeed >>> 0) : "—");
    set("ia-note", state.note || "");
  }

  function dumpBest() {
    const payload = {
      category,
      bestMs: state.bestMs,
      bestSeed: state.bestSeed,
      bestPath: state.bestPath,
      attempt: state.attempt,
      successes: state.successes,
      store: loadStore()[category] || null,
    };
    console.log("[IsleboundAuto] best dump", payload);
    try {
      navigator.clipboard.writeText(JSON.stringify(payload, null, 2));
      state.note = "Best JSON copied to clipboard";
    } catch (e) {
      state.note = "Best dumped to console";
    }
  }

  function attach() {
    const tas = window.__IsleboundTAS;
    if (!tas || !tas.enabled) {
      state.note = "Open with ?tas=1&auto=1 — TAS required";
      console.warn("[IsleboundAuto] TAS not enabled");
      buildOverlay();
      refreshOverlay();
      return;
    }
    buildOverlay();
    const tryBind = () => {
      const game = tas.game && tas.game();
      if (!game || !game.observe) {
        requestAnimationFrame(tryBind);
        return;
      }
      // watch alone → 1×; explicit scale= (incl. slow-mo 0.25) always wins.
      if (watchSlow && !scaleParamSet && !tapeMode) tas.setTimeScale(1);
      else tas.setTimeScale(scaleWanted);
      tas.setAgentController(agentTick);
      state.phase = "boot";
      state.note = (tapeMode ? "TAPE demo → " : "Booting menus → ") + category;
      console.info(
        "[IsleboundAuto]",
        tapeMode ? "tape" : "grinding",
        category,
        "scale",
        tas.getTimeScale(),
        "max",
        maxAttempts
      );
      setInterval(refreshOverlay, 200);
      refreshOverlay();
    };
    tryBind();

    window.addEventListener("keydown", (e) => {
      if (e.key === "g" || e.key === "G") {
        if (e.target && (e.target.tagName === "INPUT" || e.target.tagName === "TEXTAREA")) return;
        state.pausedByUser = !state.pausedByUser;
        state.running = !state.pausedByUser;
        state.note = state.pausedByUser ? "Paused (G)" : "Resumed";
        const game = tas.game && tas.game();
        if (game) clearKeys(game.keys);
        e.preventDefault();
      }
      if (e.key === "h" || e.key === "H") {
        if (e.target && (e.target.tagName === "INPUT" || e.target.tagName === "TEXTAREA")) return;
        dumpBest();
        e.preventDefault();
      }
    });
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", attach);
  else attach();

  api.getState = () => Object.assign({}, state);
  api.dumpBest = dumpBest;
  api.loadStore = loadStore;
})();
