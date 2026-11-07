/**
 * Islebound TAS boot — loads BEFORE game.js.
 * Enable via Chrome extension (`__IsleboundTAS_EXT`), `?tas=1`, or localStorage islebound-tas=1.
 * Installs a seeded PRNG over Math.random and a frame-gate scaffold.
 * Does not rewrite game outcomes; only observes / reseeds / pauses time.
 */
(() => {
  if (window.__IsleboundTAS && window.__IsleboundTAS.enabled) return; // already booted
  const params = new URLSearchParams(location.search);
  const enabled =
    window.__IsleboundTAS_EXT === true ||
    params.has("tas") ||
    params.get("tas") === "1" ||
    localStorage.getItem("islebound-tas") === "1";
  if (!enabled) {
    window.__IsleboundTAS = { enabled: false };
    return;
  }

  /** Mulberry32 — fast, seedable, deterministic. */
  function mulberry32(seed) {
    let a = seed >>> 0;
    return function next() {
      a |= 0;
      a = (a + 0x6d2b79f5) | 0;
      let t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  function cloneAdvance(seed, n) {
    const gen = mulberry32(seed);
    const out = [];
    for (let i = 0; i < n; i++) out.push(gen());
    return out;
  }

  function advanceState(seed, n) {
    let a = seed >>> 0;
    for (let i = 0; i < n; i++) {
      a |= 0;
      a = (a + 0x6d2b79f5) | 0;
      let t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      void ((t ^ (t >>> 14)) >>> 0);
    }
    return a >>> 0;
  }

  const nativeRandom = Math.random.bind(Math);
  let seed0 = (Date.now() ^ (Math.floor(nativeRandom() * 0x100000000))) >>> 0;
  let state = seed0;
  let gen = mulberry32(state);
  let calls = 0;
  let log = [];
  const LOG_CAP = 64;

  function reseed(s) {
    seed0 = s >>> 0;
    state = seed0;
    gen = mulberry32(state);
    calls = 0;
    log = [];
  }

  function random() {
    // Keep internal state in sync with mulberry32's closed seed by re-deriving
    // from call count so peek/restore stay accurate.
    const v = gen();
    calls++;
    state = advanceState(seed0, calls);
    log.push(v);
    if (log.length > LOG_CAP) log.shift();
    return v;
  }

  Math.random = random;

  const FRAME_DT_MS = 1000 / 60;
  let paused = false;
  let stepRequests = 0;
  let virtualNow = 0;
  let clockStarted = false;
  let resyncLast = false;
  let frameIndex = 0;
  let recordMode = false;
  let playMode = false;
  let playCursor = 0;
  /** @type {{f:number, keys:Record<string,boolean>}[]} */
  let tape = [];
  let gameApi = null;
  let lastDrawn = false;

  const TRACKED_KEYS = [
    "arrowup",
    "arrowdown",
    "arrowleft",
    "arrowright",
    " ",
    "enter",
    "1",
    "2",
    "3",
    "4",
    "5",
    "6",
    "7",
    "8",
    "z",
    "c",
    "f",
    "t",
    "e",
    "h",
    "r",
  ];

  function snapshotKeys(keys) {
    const snap = Object.create(null);
    for (let i = 0; i < TRACKED_KEYS.length; i++) {
      const k = TRACKED_KEYS[i];
      if (keys[k]) snap[k] = true;
    }
    return snap;
  }

  function applyKeys(keys, snap) {
    for (let i = 0; i < TRACKED_KEYS.length; i++) {
      const k = TRACKED_KEYS[i];
      keys[k] = !!(snap && snap[k]);
    }
  }

  const tas = {
    enabled: true,
    version: 1,
    FRAME_DT_MS,

    rng: {
      reseed,
      getSeed0: () => seed0 >>> 0,
      getState: () => state >>> 0,
      getCalls: () => calls,
      recent: () => log.slice(),
      peek: (n) => cloneAdvance(state, Math.max(0, n | 0)),
      /** Restore exact PRNG position (seed0 + call count). */
      restore(s0, callCount) {
        seed0 = s0 >>> 0;
        calls = Math.max(0, callCount | 0);
        state = advanceState(seed0, calls);
        gen = mulberry32(seed0);
        for (let i = 0; i < calls; i++) gen();
        log = [];
      },
      nativeSample: () => nativeRandom(),
    },

    isPaused: () => paused,
    setPaused(v) {
      paused = !!v;
      if (!paused) stepRequests = 0;
    },
    togglePause() {
      paused = !paused;
      if (!paused) stepRequests = 0;
      return paused;
    },
    requestStep(n) {
      if (!paused) paused = true;
      stepRequests += Math.max(1, n | 0);
    },
    getFrameIndex: () => frameIndex,
    getVirtualNow: () => virtualNow,

    isRecording: () => recordMode,
    isPlaying: () => playMode,
    getTape: () => tape.slice(),
    tapeLength: () => tape.length,
    playCursor: () => playCursor,

    startRecord() {
      playMode = false;
      recordMode = true;
      tape = [];
      playCursor = 0;
    },
    stopRecord() {
      recordMode = false;
    },
    clearTape() {
      tape = [];
      playCursor = 0;
      playMode = false;
      recordMode = false;
    },
    startPlayback() {
      if (!tape.length) return false;
      recordMode = false;
      playMode = true;
      playCursor = 0;
      paused = false;
      stepRequests = 0;
      return true;
    },
    stopPlayback() {
      playMode = false;
    },
    exportTape() {
      return JSON.stringify(
        {
          v: 1,
          seed0,
          callsAtStart: tape.length ? tape[0].rngCalls : calls,
          frames: tape,
        },
        null,
        2
      );
    },
    importTape(json) {
      const data = typeof json === "string" ? JSON.parse(json) : json;
      if (!data || !Array.isArray(data.frames)) throw new Error("bad tape");
      tape = data.frames;
      playCursor = 0;
      playMode = false;
      recordMode = false;
      if (data.seed0 != null) {
        tas.rng.restore(data.seed0 >>> 0, data.callsAtStart | 0);
      }
      return tape.length;
    },

    bindGame(api) {
      gameApi = api;
    },
    game() {
      return gameApi;
    },

    /**
     * Called at the top of the game loop.
     * @returns {{ run: boolean, now: number, drawOnly: boolean }}
     */
    decideFrame(realNow) {
      lastDrawn = false;
      const wrap = (run, drawOnly) => {
        const out = { run, now: virtualNow, drawOnly, resyncLast };
        resyncLast = false;
        return out;
      };
      if (!clockStarted) {
        virtualNow = realNow;
        clockStarted = true;
        // First tick after bind: advance one fixed frame so dt stays ~1/60.
        virtualNow += FRAME_DT_MS;
        resyncLast = true;
        return wrap(true, false);
      }
      if (!paused) {
        virtualNow += FRAME_DT_MS;
        return wrap(true, false);
      }
      if (stepRequests > 0) {
        stepRequests--;
        virtualNow += FRAME_DT_MS;
        return wrap(true, false);
      }
      return wrap(false, true);
    },

    beforeTick() {
      if (!gameApi || !gameApi.keys) return;
      if (playMode) {
        if (playCursor >= tape.length) {
          playMode = false;
          paused = true;
          return;
        }
        const row = tape[playCursor];
        applyKeys(gameApi.keys, row.keys);
      }
    },

    afterTick() {
      frameIndex++;
      if (!gameApi || !gameApi.keys) return;
      if (recordMode && !playMode) {
        tape.push({
          f: frameIndex,
          keys: snapshotKeys(gameApi.keys),
          rngCalls: calls,
          rngState: state >>> 0,
        });
      }
      if (playMode) playCursor++;
    },

    markDrawn() {
      lastDrawn = true;
    },
    wasDrawn: () => lastDrawn,

    /** Savestate: RNG + game snapshot from bindGame. */
    saveState() {
      if (!gameApi || !gameApi.snapshot) throw new Error("game not bound");
      return {
        v: 1,
        seed0,
        calls,
        state: state >>> 0,
        frameIndex,
        virtualNow,
        game: gameApi.snapshot(),
      };
    },
    loadState(snap) {
      if (!snap || !gameApi || !gameApi.restore) throw new Error("bad state");
      tas.rng.restore(snap.seed0 >>> 0, snap.calls | 0);
      frameIndex = snap.frameIndex | 0;
      virtualNow = snap.virtualNow || performance.now();
      clockStarted = true;
      resyncLast = true;
      gameApi.restore(snap.game);
      // Clear held keys to avoid sticky input after restore
      if (gameApi.keys) {
        for (const k of Object.keys(gameApi.keys)) gameApi.keys[k] = false;
      }
    },
  };

  window.__IsleboundTAS = tas;
})();
