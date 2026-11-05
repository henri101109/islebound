(() => {
  const canvas = document.getElementById("game");
  const ctx = canvas.getContext("2d");
  let ink = ctx;

  const TILE = 16;
  const TEX = 96;
  const SCALE_DEFAULT = 2.4;
  const SCALE_FAR = 1;
  const SCALE_UI = 3;
  const COLS = 520;
  const ROWS = 148;
  const ISLAND_C = 260;
  const ISLAND_HALF = 228;
  const ISLAND_ROWS = 85;
  const SHORE_BASE = 112;
  const MAX_SLOTS = 8;
  const HUD_COLS = 4;
  const MAX_HP = 7;
  let zoom = SCALE_DEFAULT;
  let viewW = canvas.width / zoom;
  let viewH = canvas.height / zoom;

  const TILES = { DEEP: 0, SAND: 3, DIRT: 5, GRASS: 4 };

  const WASH_PERIOD = 12.6;

  const ITEM_DEFS = {
    shell: { name: "Sea shell", max: 1, xp: 4 },
    gem: { name: "Sea gem", max: 24, xp: 12 },
    crystal: { name: "Sea crystal", max: 16, xp: 28 },
    jelly: { name: "Jellyfish", max: 24, xp: 10 },
    jelly_green: { name: "Green jellyfish", max: 24, xp: 16 },
    jelly_white: { name: "White jellyfish", max: 24, xp: 32 },
    jelly_gold: { name: "Gold jellyfish", max: 24, xp: 48 },
    jelly_rainbow: { name: "Rainbow jellyfish", max: 24, xp: 60 },
    fish_blue: { name: "Blue fish", max: 24, xp: 6 },
    fish_gold: { name: "Gold fish", max: 24, xp: 8 },
    fish_reef: { name: "Reef fish", max: 24, xp: 7 },
    cod: { name: "Cod", max: 24, xp: 6 },
    trout: { name: "Trout", max: 24, xp: 7 },
    salmon: { name: "Salmon", max: 24, xp: 8 },
    catch_crab: { name: "Crab", max: 24, xp: 12 },
    mini_shark: { name: "Mini shark", max: 24, xp: 18 },
    shark: { name: "Shark", max: 24, xp: 36 },
    blowfish: { name: "Blowfish", max: 24, xp: 55 },
    megalodon: { name: "Megalodon", max: 8, xp: 100 },
    chest: { name: "Treasure chest", max: 1, xp: 40 },
    wand: { name: "Wand", max: 1, xp: 0 },
    cloak: { name: "Cloak", max: 1, xp: 0 },
    serpent_heart: { name: "Heart of the Sea", max: 24, xp: 80 },
  };
  const FISH_CATCH = ["fish_blue", "fish_gold", "fish_reef"];
  const CATCH_COMMON = ["cod", "trout", "salmon", "jelly"];
  const CATCH_RARE = ["catch_crab", "mini_shark", "jelly_green"];
  const CATCH_LEGEND = ["shark", "jelly_white", "chest"];
  /** Super-legendary: independent sequential rolls after band (first hit wins). */
  const CATCH_SUPER = [
    { id: "jelly_gold", den: 200 },
    { id: "blowfish", den: 250 },
    { id: "jelly_rainbow", den: 300 },
    { id: "megalodon", den: 500 },
  ];
  const BAIT_IDS = { cod: 1, trout: 1, salmon: 1, jelly: 1, catch_crab: 1 };
  const MEGA_BAIT = { shark: 0.5, mini_shark: 0.25 };
  const SERPENT_MAX_HP = 5;
  const SERPENT_COOLDOWN = 45;
  const SERPENT_SEGMENTS = 9;
  const SERPENT_SEG_SPACING = 6.2;
  const TRADE_VALUE = { gem: 5, crystal: 25, jelly: 15 };
  const GEM_TRADE = { gem: 5, crystal: 25 };
  const FISH_TRADE = {
    jelly: 20,
    cod: 10,
    trout: 15,
    salmon: 15,
    catch_crab: 25,
    mini_shark: 30,
    jelly_green: 40,
    shark: 75,
    jelly_white: 80,
    jelly_gold: 120,
    blowfish: 140,
    jelly_rainbow: 160,
    megalodon: 250,
    fish_blue: 10,
    fish_gold: 15,
    fish_reef: 10,
  };
  const FISHER_MENU = [
    ["cod", "COD"],
    ["trout", "TROUT"],
    ["salmon", "SALMON"],
    ["jelly", "JELLY"],
    ["catch_crab", "CRAB"],
    ["mini_shark", "MINI"],
    ["jelly_green", "GREEN"],
    ["shark", "SHARK"],
    ["jelly_white", "WHITE"],
    ["jelly_gold", "GOLD"],
    ["blowfish", "BLOW"],
    ["jelly_rainbow", "RAIN"],
    ["megalodon", "MEGA"],
  ];

  const keys = Object.create(null);
  const WORLD_W = COLS * TILE;
  const WORLD_H = ROWS * TILE;
  const FOAM_MASK_W = 512;
  const FOAM_MASK_H = 32;
  const world = [];
  const loot = [];
  const inventory = [null, null, null, null, null, null, null, null];
  const DOCK_C = 150;
  const RIVER_X0 = DOCK_C * TILE - 300;
  let riverSpans = [];
  const riverCourses = [];
  const bankReeds = [];
  const BOAT_PRICE = 10;
  const rocks = [];
  const palms = [];
  const trees = [];
  const crabs = [];
  const insects = [];
  const fishJumps = [];
  const sharkFins = [];
  const JUMP_KINDS = ["cod", "trout", "salmon", "fish_gold", "fish_reef", "fish_blue", "mini_shark", "shark"];
  const splashes = [];
  const MAX_CRABS = 16;
  const MAX_FISH = 6;
  const MAX_SPLASH = 56;
  let loudNoiseActive = false;
  let scareUntil = 0;
  let wildlifeScared = false;
  let scene = "island";
  const SHOP_W = 176;
  const SHOP_H = 128;
  const FISH_W = 120;
  const FISH_H = 96;
  const CABIN_W = 200;
  const CABIN_H = 136;
  const CABIN_NPC_X = 124;
  const CABIN_NPC_Y = 80;
  const CABIN_TABLE = { x: 146, y: 74, w: 36, h: 12 };
  const CABIN_KINDS = [
    "fish_blue",
    "fish_gold",
    "fish_reef",
    "cod",
    "trout",
    "salmon",
    "jelly",
    "jelly_green",
    "jelly_white",
    "jelly_gold",
    "jelly_rainbow",
    "catch_crab",
    "mini_shark",
    "shark",
    "blowfish",
    "megalodon",
  ];
  const walkPads = [];
  const islandSolids = [];
  const shopSolids = [];
  const fishSolids = [];
  const cabinSolids = [];
  const npcs = [];
  const boats = [];
  const swimFish = [];
  const sandBits = [];
  const MAX_SAND = 120;
  let shopCanvas = null;
  let fishCanvas = null;
  let cabinCanvas = null;
  let shopDoor = null;
  let shopExit = null;
  let fishDoor = null;
  let fishExit = null;
  let fishDockExit = null;
  let cabinDoor = null;
  let cabinExit = null;
  let cabinDockExit = null;
  let cabinChestX = 160;
  let cabinChestY = 66;
  let cloakOn = false;
  const cabinFish = [];
  const cabinPanes = [
    { x: 2, y: 12, w: CABIN_W - 4, h: 20 },
    { x: 2, y: 38, w: 10, h: CABIN_H - 52 },
    { x: CABIN_W - 12, y: 38, w: 10, h: CABIN_H - 52 },
  ];
  const cabinCut = {
    kind: "",
    t: 0,
    value: 0,
    pack: 0,
    spawned: false,
    granted: false,
    lid: 0,
    mode: "open",
  };
  let cloakBuf = null;
  let cloakCtx = null;
  let cloakMask = null;
  let cloakMaskCtx = null;
  let fishCastT = 0;
  let jellySpawnT = 18;
  const rod = {
    phase: "idle",
    t: 0,
    wait: 0,
    face: 1,
    bit: false,
    catchId: null,
    tugLeft: 0,
    tugDx: 0,
    tugDy: 0,
    tugCool: 0,
  };
  let chestTalk = 0;
  const keepouts = [];
  const shopTrade = { phase: "idle", t: 0, dur: 0, id: null, value: 0, refuse: 0 };
  const shopSales = [];
  let tradePackSeq = 1;
  let fade = 0;
  let fadeMode = 0;
  let fadeNext = null;
  let islandHold = null;
  let dockExit = null;
  let doorCool = 0;
  const foamBlockers = [];
  const dockBlit = [];
  const dockWood = [];
  const deckPads = [];
  let dockOverlay = null;
  let dockOX = 0;
  let dockOY = 0;
  let bldgCanvas = null;
  let bldgOX = 0;
  let bldgOY = 0;
  let fishSpawnT = 0.85;
  let fishCursor = Math.random();
  let landCanvas = null;
  let shoreLut = null;
  let foamMask = null;
  let waveCycle = 0;
  let lastWaveCycle = -1;
  let guideOpen = false;
  const SPEED_ORDER = [
    "shark",
    "jelly_white",
    "chest",
    "death",
    "boat",
    "full_inv",
    "shark_cloak",
    "serpent",
    "blowfish",
    "megalodon",
    "coins_10",
    "coins_25",
    "coins_100",
  ];
  let playMode = null;
  let uiScreen = "mode";
  let srCat = "shark";
  let srRunning = false;
  let srTiming = false;
  let srStartPerf = 0;
  let srElapsed = 0;
  let srFinalMs = 0;
  let srBoughtBoat = false;
  let srWasDead = false;
  let srName = "";
  let srCursor = 0;
  let srFinishSel = 1;
  let srBoardRows = [];
  let srBoardNote = "";
  let srStatus = "";
  let srSubmitting = false;
  let srSubmitted = false;
  let srRunId = "";
  let srPbPrev = 0;
  let srPbLabel = "";
  /** Countdown after blowfish cutscene before Blowfish% ends; -1 = idle. */
  let srBlowfishFinishT = -1;
  let authUser = "";
  let authPin = "";
  let authName = "";
  let authField = 0;
  let authMode = "menu";
  let authStatus = "";
  let authBusy = false;
  let nmBoardKind = "playtime";
  let nmBoardRows = [];
  let nmBoardNote = "";
  let nmCursor = 0;
  let modeOpts = ["NORMAL", "SPEEDRUN", "ACCOUNT", "STATS"];
  let playtimeAcc = 0;
  let playtimeFlush = 0;
  let guestNameLocked = false;
  let menuHits = [];
  let menuHoverKey = "";
  let pointerUi = { x: -9999, y: -9999, down: false };
  // Island chat (Tab toggle; C/F still cast)
  let chatOpen = false;
  let chatDraft = "";
  let chatFocused = false;
  let chatUnread = 0;
  let chatLastSeenId = "";
  let chatScroll = 0; // 0 = pinned to newest
  let chatHits = [];
  let chatHoverTip = null; // { x, y, label }
  let chatStatusNote = "";
  let chatSendBusy = false;
  const CHAT_NOTIFS_KEY = "islebound-chat-notifs";
  let chatNotifsEnabled = true;
  let chatToast = null; // { who, isAcc, text, until }
  let chatNotifSeenId = "";
  let chatPresenceOffset = 0;
  let chatPresenceRotAt = 0;
  const CHAT_PRESENCE_SHOW = 3;
  const CHAT_PRESENCE_ROT_MS = 3000;
  const dockLamps = [];
  const windowLights = [];
  const eaveShades = [];
  let lightCanvas = null;
  let lightCtx = null;
  let glowLamp = null;
  let glowWindow = null;
  let glowFeet = null;
  let glowChest = null;
  let glowChestPool = null;
  let moorSail = null;
  let sprCanvas = null;
  let sprCtx = null;
  let litFrame = null;

  const player = {
    x: 0,
    y: 0,
    w: 8,
    h: 14,
    facing: 1,
    moving: false,
    inWater: false,
    frame: 0,
    anim: 0,
    bob: 0,
    xp: 0,
    level: 1,
    hp: MAX_HP,
    coins: 0,
    submerged: 0,
    drownTick: 0,
    hurt: 0,
    dead: 0,
    aboard: false,
  };
  let ownedBoat = null;
  let boatThrow = null;
  let harborTalk = 0;
  let harborDrop = null;

  const camera = { x: 0, y: 0 };
  let spawnX = 0;
  let spawnY = 0;
  let nearestLoot = null;
  let time = 0;
  let shake = 0;
  const pickupAnims = [];
  let heldSlot = 0;
  let useFx = null;
  let audioCtx = null;
  let oceanGain = null;
  let oceanReady = false;
  let hornVoice = null;
  let xpFx = null;
  let dayPausedAt = null;
  let dayOffset = 0;
  let serpent = null;
  let serpentCoolUntil = 0;
  let wandCool = 0;
  const wandBolts = [];
  let rodBaitId = null;

  function rand(min, max) {
    return min + Math.random() * (max - min);
  }
  function irand(min, max) {
    return Math.floor(rand(min, max + 1));
  }
  function hash(x, y) {
    let n = (Math.imul(x | 0, 374761393) + Math.imul(y | 0, 668265263)) | 0;
    n = (n ^ (n >>> 13)) | 0;
    return ((n >>> 0) % 10000) / 10000;
  }
  function n2(x, y) {
    const x0 = Math.floor(x);
    const y0 = Math.floor(y);
    const tx = x - x0;
    const ty = y - y0;
    const u = tx * tx * (3 - 2 * tx);
    const v = ty * ty * (3 - 2 * ty);
    const a = hash(x0, y0);
    const b = hash(x0 + 1, y0);
    const c = hash(x0, y0 + 1);
    const d = hash(x0 + 1, y0 + 1);
    return a + (b - a) * u + (c + (d - c) * u - (a + (b - a) * u)) * v;
  }
  function inBounds(c, r) {
    return c >= 0 && r >= 0 && c < COLS && r < ROWS;
  }

  function coastNoise(c, salt) {
    return (
      Math.sin(c * 0.038 + salt) * 3.2 +
      Math.sin(c * 0.092 + salt * 1.7) * 2.1 +
      Math.sin(c * 0.157 + salt * 0.55) * 1.25 +
      (n2(c * 0.035, salt) - 0.5) * 4.4
    );
  }

  function islandHalfAt(c) {
    const bulge = Math.sin((c - ISLAND_C) * 0.013) * 8 + Math.sin(c * 0.027) * 4;
    return ISLAND_HALF + bulge * 0.22;
  }

  function islandCap(c) {
    const half = islandHalfAt(c);
    const ax = Math.abs(c - ISLAND_C);
    if (ax >= half) return 0;
    const t = ax / half;
    const tip = 0.76;
    if (t <= tip) return 1;
    const u = (t - tip) / (1 - tip);
    return Math.sqrt(Math.max(0, 1 - u * u));
  }

  function eastness(c) {
    const u = (c - (ISLAND_C - ISLAND_HALF)) / (ISLAND_HALF * 2);
    const t = u < 0 ? 0 : u > 1 ? 1 : u;
    const n = (n2(c * 0.018, 4.2) - 0.5) * 0.16;
    const s = t * t * (3 - 2 * t) + n;
    return s < 0 ? 0 : s > 1 ? 1 : s;
  }

  function shoreMid() {
    return SHORE_BASE - ISLAND_ROWS * 0.42;
  }

  function baseShoreRow(c) {
    const cap = islandCap(c);
    if (cap <= 0) return SHORE_BASE;
    const wobble = coastNoise(c, 0.35) * (0.42 + 0.58 * cap);
    return shoreMid() + ISLAND_ROWS * 0.5 * cap + wobble;
  }

  function northCliffRow(c) {
    const cap = islandCap(c);
    if (cap <= 0) return SHORE_BASE + 1;
    const wobble = coastNoise(c, 8.4) * (0.42 + 0.58 * cap);
    const south = baseShoreRow(c);
    let north = shoreMid() - ISLAND_ROWS * 0.5 * cap + wobble;
    if (north > south - 4) north = south - 4;
    return north;
  }

  function landPresent(wx) {
    return islandCap(wx / TILE) > 0.035;
  }

  function onIslandLand(px, py) {
    if (!landPresent(px)) return false;
    return py >= northCliffY(px) && py <= restShoreY(px);
  }

  function isIndoor() {
    return scene === "shop" || scene === "fish" || scene === "cabin";
  }

  function indoorW() {
    if (scene === "fish") return FISH_W;
    if (scene === "cabin") return CABIN_W;
    return SHOP_W;
  }

  function indoorH() {
    if (scene === "fish") return FISH_H;
    if (scene === "cabin") return CABIN_H;
    return SHOP_H;
  }

  function cabinDoorX() {
    return (CABIN_W / 2 - 8) | 0;
  }

  function northCliffY(wx) {
    return Math.floor(northCliffRow(wx / TILE) * TILE);
  }

  function restShoreY(wx) {
    return Math.floor(baseShoreRow(wx / TILE) * TILE);
  }

  function addRiverSpan(y, l, r) {
    y = y | 0;
    if (y < 0 || y >= WORLD_H || !(r > l)) return;
    const row = riverSpans[y];
    if (!row) {
      riverSpans[y] = [{ l: l, r: r }];
      return;
    }
    let i = 0;
    while (i < row.length && row[i].r < l) i++;
    let L = l;
    let R = r;
    let j = i;
    while (j < row.length && row[j].l <= R) {
      if (row[j].l < L) L = row[j].l;
      if (row[j].r > R) R = row[j].r;
      j++;
    }
    row.splice(i, j - i, { l: L, r: R });
  }

  function rasterPolyline(pts) {
    for (let i = 0; i < pts.length - 1; i++) {
      const a = pts[i];
      const b = pts[i + 1];
      const y0 = Math.floor(Math.min(a.y, b.y));
      const y1 = Math.floor(Math.max(a.y, b.y));
      const den = b.y - a.y || 1;
      for (let y = y0; y <= y1; y++) {
        let t = (y + 0.5 - a.y) / den;
        if (t < 0) t = 0;
        else if (t > 1) t = 1;
        const x = a.x + (b.x - a.x) * t;
        const half = a.half + (b.half - a.half) * t;
        addRiverSpan(y, x - half, x + half);
      }
    }
  }

  function rasterMouth(mouthX, mouthY, half) {
    const y0 = Math.floor(mouthY);
    const y1 = Math.min(WORLD_H - 1, Math.floor(mouthY + 46));
    for (let y = y0; y <= y1; y++) addRiverSpan(y, mouthX - half, mouthX + half);
  }

  function courseAtY(pts, y) {
    if (y >= pts[0].y) return pts[0];
    const last = pts[pts.length - 1];
    if (y <= last.y) return last;
    let lo = 0;
    let hi = pts.length - 1;
    while (hi - lo > 1) {
      const m = (lo + hi) >> 1;
      if (pts[m].y >= y) lo = m;
      else hi = m;
    }
    const a = pts[lo];
    const b = pts[hi];
    const t = (a.y - y) / (a.y - b.y || 1);
    return { x: a.x + (b.x - a.x) * t, half: a.half + (b.half - a.half) * t };
  }

  function traceStem(mouthX, reach, salt, amp, halfBase, halfVar) {
    const mouthY = shoreYAt(mouthX);
    const cliff = northCliffY(mouthX);
    const travel = (mouthY - cliff - 120) * reach;
    const endY = mouthY - travel;
    const pts = [];
    const steps = Math.max(2, Math.ceil(travel / 2));
    for (let i = 0; i <= steps; i++) {
      const u = i / steps;
      const y = mouthY + (endY - mouthY) * u;
      const fade = smoothstep(Math.min(1, (mouthY - y) / 200));
      const x =
        mouthX +
        (Math.sin(u * amp.f1 + salt) * amp.a1 +
          Math.sin(u * amp.f2 + salt * 1.6) * amp.a2 +
          (n2(u * amp.nf + salt, salt * 2.1) - 0.5) * amp.na) *
          fade;
      let half = halfBase;
      half += (Math.sin(u * 7.2 + salt * 2) * halfVar + Math.sin(u * 2.8 + 0.5) * halfVar * 0.7) * fade;
      half += (n2(y * 0.045, salt * 4.2) - 0.5) * 7.2 * fade;
      if (u > 0.9) half *= Math.max(0.8, 1 - ((u - 0.9) / 0.1) * 0.2);
      if (half < 12.6) half = 12.6;
      if (u > 0.02 && y < northCliffY(x) + 108) break;
      if (u > 0.03 && y < mouthY - 40 && !onIslandLand(x, y)) break;
      pts.push({ x: x, y: y, half: half });
    }
    return { pts: pts, mouthX: mouthX, mouthY: mouthY, halfBase: halfBase, sea: true };
  }

  function traceCreek(parent, forkU, salt, side, travel) {
    const idx = Math.min(parent.pts.length - 1, Math.max(0, Math.floor(forkU * (parent.pts.length - 1))));
    const origin = parent.pts[idx];
    const pts = [{ x: origin.x, y: origin.y, half: Math.max(12.6, origin.half * 0.86) }];
    const steps = Math.max(2, Math.ceil(travel / 2));
    for (let i = 1; i <= steps; i++) {
      const v = i / steps;
      const y = origin.y - v * travel;
      const depart = smoothstep(Math.min(1, v / 0.14));
      let x =
        origin.x +
        side *
          depart *
          (120 +
            v * 260 +
            Math.sin(v * Math.PI * 2.3 + salt) * 44 +
            Math.sin(v * Math.PI * 5.1 + 0.7) * 18 +
            (n2(v * 3.3 + salt, salt) - 0.5) * 32);
      let half = 12.8 + Math.sin(v * 6.6 + salt) * 1.6 * depart + (n2(y * 0.08, salt) - 0.5) * 2.6 * depart;
      if (v > 0.88) half *= Math.max(0.82, 1 - ((v - 0.88) / 0.12) * 0.18);
      if (half < 12.4) half = 12.4;
      const hold = smoothstep(Math.min(1, v / 0.2));
      const p = courseAtY(parent.pts, y);
      const gap = (p.half + half + 46) * hold;
      if (side < 0 && x > p.x - gap) x = p.x - gap;
      if (side > 0 && x < p.x + gap) x = p.x + gap;
      if (x < 1100 || x > WORLD_W - 64) break;
      if (v > 0.03 && y < northCliffY(x) + 112) break;
      if (v > 0.05 && !onIslandLand(x, y)) break;
      pts.push({ x: x, y: y, half: half });
    }
    return { pts: pts, sea: false };
  }

  function buildRivers() {
    riverSpans = new Array(WORLD_H);
    riverCourses.length = 0;
    const PI = Math.PI;
    const west = traceStem(RIVER_X0, 0.9, 0.35, { f1: PI * 2.5, a1: 168, f2: PI * 5.4, a2: 52, nf: 3.6, na: 64 }, 14.8, 3.4);
    const creek = traceCreek(west, 0.34, 1.2, -1, 700);
    const mid = traceStem(4096, 0.86, 2.15, { f1: PI * 2.1, a1: 188, f2: PI * 4.8, a2: 58, nf: 2.7, na: 72 }, 14.4, 3.6);
    const east = traceStem(5968, 0.82, 4.7, { f1: PI * 2.7, a1: 140, f2: PI * 6.1, a2: 44, nf: 4.1, na: 50 }, 13.8, 3.2);
    const all = [west, creek, mid, east];
    for (let i = 0; i < all.length; i++) {
      const c = all[i];
      riverCourses.push(c);
      rasterPolyline(c.pts);
      if (c.sea) rasterMouth(c.mouthX, c.mouthY, c.halfBase);
    }
  }

  function spanCovers(row, px) {
    if (!row) return false;
    for (let i = 0; i < row.length; i++) {
      const s = row[i];
      if (px >= s.l && px < s.r) return true;
      if (s.l > px) break;
    }
    return false;
  }

  function inRiverWater(px, py) {
    return spanCovers(riverSpans[py | 0], px);
  }

  function riverClear(px, py, pad) {
    const y = py | 0;
    const p = pad | 0;
    for (let dy = -p; dy <= p; dy++) {
      const row = riverSpans[y + dy];
      if (!row) continue;
      for (let i = 0; i < row.length; i++) {
        const s = row[i];
        if (px > s.l - p && px < s.r + p) return false;
      }
    }
    return true;
  }

  function riverBand(px, py) {
    const y = py | 0;
    let edge = false;
    for (let dy = -1; dy <= 1; dy++) {
      const row = riverSpans[y + dy];
      if (!row) continue;
      for (let i = 0; i < row.length; i++) {
        const s = row[i];
        if (px >= s.l && px < s.r) {
          if (dy === 0) return 0;
          edge = true;
        } else if (px >= s.l - 1 && px < s.r + 1) edge = true;
      }
    }
    return edge ? 1 : 9;
  }

  function riverLip(px, py) {
    const y = py | 0;
    const row = riverSpans[y];
    if (!row) return false;
    for (let i = 0; i < row.length; i++) {
      const s = row[i];
      if (px < s.l || px >= s.r) continue;
      if (px < s.l + 2.2 || px >= s.r - 2.2) return true;
      if (!spanCovers(riverSpans[y - 1], px) || !spanCovers(riverSpans[y + 1], px)) return true;
      return false;
    }
    return false;
  }

  function riverTouchesTile(wx, wy) {
    for (let y = wy; y < wy + TILE; y += 5) {
      const row = riverSpans[y];
      if (!row) continue;
      for (let i = 0; i < row.length; i++) {
        const s = row[i];
        if (s.r > wx - 3 && s.l < wx + TILE + 3) return true;
      }
    }
    return false;
  }

  function riverBankColor(wx, wy) {
    const e = eastness(wx / TILE);
    const n = n2(wx * 0.085, wy * 0.07);
    const h = hash(wx, wy);
    if (e < 0.32) {
      if (n > 0.7) return h > 0.62 ? "#6a6660" : "#908b82";
      if (n > 0.46) return h > 0.5 ? "#a9c47a" : "#7eae62";
      return null;
    }
    if (e < 0.64) {
      if (n > 0.74) return h > 0.5 ? "#7a756c" : "#5e5a54";
      if (n > 0.4) return h > 0.55 ? "#e6cc96" : "#c9b07a";
      return null;
    }
    if (n > 0.28) return h > 0.45 ? "#5c5852" : "#9c968c";
    if (n > 0.16) return "#b5a78c";
    return null;
  }

  function bankLand(x, y) {
    if (x < 2 || y < 2 || x >= WORLD_W - 2 || y >= WORLD_H - 2) return false;
    if (y >= shoreYAt(x) - 2) return false;
    if (y < northCliffY(x) + 8) return false;
    if (inRiverWater(x, y)) return false;
    return landPresent(x);
  }

  function paintRiverBanks(g) {
    bankReeds.length = 0;
    let palms = 0;
    for (let ci = 0; ci < riverCourses.length; ci++) {
      const course = riverCourses[ci];
      const pts = course.pts;
      for (let i = 2; i < pts.length; i += 4) {
        if (course.sea && course.mouthY - pts[i].y < 22) continue;
        const a = pts[i];
        const b = pts[Math.min(pts.length - 1, i + 1)];
        let dx = b.x - a.x;
        let dy = b.y - a.y;
        const len = Math.hypot(dx, dy) || 1;
        dx /= len;
        dy /= len;
        const nx = -dy;
        const ny = dx;
        for (let s = 0; s < 2; s++) {
          const side = s === 0 ? -1 : 1;
          const dist = a.half + 3 + ((hash(i + ci, s + 9) * 3) | 0);
          const x = (a.x + nx * side * dist) | 0;
          const y = (a.y + ny * side * dist) | 0;
          if (!bankLand(x, y)) continue;
          const e = eastness(x / TILE);
          const h = hash(x + i, y + s * 13);
          if (e < 0.32) {
            if (h > 0.55) {
              pxi(g, x, y, 1, 1, "#1d5c2c");
              pxi(g, x, y - 1, 1, 1, "#c6e86a");
            } else if (h > 0.4) {
              pxi(g, x, y, 2, 1, "#145028");
              pxi(g, x + 1, y - 1, 1, 1, "#8ed44e");
            } else if (palms < 28 && (i % 8) === 2 && bankLand(x, y - 2)) {
              pxi(g, x, y, 1, 2, "#6b4424");
              pxi(g, x - 1, y - 1, 1, 1, "#9ed85a");
              pxi(g, x + 1, y - 1, 1, 1, "#d2f08a");
              pxi(g, x, y - 2, 1, 1, "#3d9a34");
              palms++;
            }
            if (bankReeds.length < 40 && h > 0.72) {
              bankReeds.push({ x: x, y: y, phase: h * 6.2, kind: "lush", side: side });
            }
          } else if (e < 0.64) {
            if (h > 0.66) {
              pxi(g, x, y, 1, 1, "#245c30");
              pxi(g, x, y - 1, 1, 1, "#8fbe58");
            } else if (h > 0.52 && bankLand(x + 2, y)) {
              pxi(g, x, y, 3, 1, "#6b4e30");
              pxi(g, x + 1, y, 1, 1, "#c4a070");
            }
            if (bankReeds.length < 40 && h > 0.78) {
              bankReeds.push({ x: x, y: y, phase: h * 6.2, kind: "reed", side: side });
            }
          } else if (h > 0.93) {
            pxi(g, x, y, 1, 1, "#6a7044");
            if (bankReeds.length < 40) {
              bankReeds.push({ x: x, y: y, phase: h * 6.2, kind: "dry", side: side });
            }
          } else if (h > 0.58) {
            pxi(g, x, y, 1, 1, h > 0.8 ? "#5c5852" : "#8a847c");
          }
        }
      }
    }
  }

  const FOAM_WAVES = [
    { period: 10.8, travel: 52, crash: 34, salt: 0.02, along: 0.00038 },
    { period: 14.6, travel: 68, crash: 46, salt: 0.38, along: 0.00021 },
    { period: 18.4, travel: 40, crash: 24, salt: 0.71, along: 0.0005 },
  ];

  function foamAt(wx, t, w) {
    let p = (t / w.period - wx * w.along + w.salt) % 1;
    if (p < 0) p += 1;
    const rest = shoreLut ? shoreLut[wx | 0] : shoreYAt(wx);
    const crash =
      w.crash * (0.65 + 0.45 * (0.5 + 0.5 * Math.sin(t * 0.055 + w.salt * 8 + wx * 0.004)));
    if (p < 0.46) {
      const u = p / 0.46;
      const run = u * u;
      return {
        y: rest + w.travel - run * w.travel,
        a: 0.3 + u * 0.7,
        crash: false,
        rest,
      };
    }
    if (p < 0.66) {
      const u = (p - 0.46) / 0.2;
      const run = 1 - (1 - u) * (1 - u);
      return {
        y: rest - run * crash,
        a: 1,
        crash: true,
        rest,
      };
    }
    const u = (p - 0.66) / 0.34;
    return {
      y: rest - crash * (1 - u * u),
      a: 0.5 * (1 - u),
      crash: true,
      rest,
    };
  }

  function hitPad(px, py, list) {
    for (let i = 0; i < list.length; i++) {
      const r = list[i];
      if (px >= r.x && px < r.x + r.w && py >= r.y && py < r.y + r.h) return r;
    }
    return null;
  }

  function isSolidPoint(px, py) {
    if (scene === "shop") return !!hitPad(px, py, shopSolids);
    if (scene === "fish") return !!hitPad(px, py, fishSolids);
    if (scene === "cabin") return !!hitPad(px, py, cabinSolids);
    if (hitPad(px, py, islandSolids)) return true;
    for (const rock of rocks) {
      if (px > rock.x && px < rock.x + rock.w && py > rock.y && py < rock.y + rock.h) {
        return true;
      }
    }
    return false;
  }

  function canStand(px, py) {
    if (isSolidPoint(px, py)) return false;
    if (scene === "shop") {
      return px >= 8 && py >= 10 && px < SHOP_W - 8 && py < SHOP_H - 6;
    }
    if (scene === "fish") {
      return px >= 8 && py >= 10 && px < FISH_W - 8 && py < FISH_H - 6;
    }
    if (scene === "cabin") {
      return px >= 16 && py >= 36 && px < CABIN_W - 16 && py < CABIN_H - 4;
    }
    if (hitPad(px, py, walkPads)) return true;
    if (landPresent(px) && py < northCliffY(px)) return false;
    return px >= 0 && py >= 0 && px < WORLD_W && py < WORLD_H;
  }

  function isWaterAt(px, py) {
    if (hitPad(px, py, walkPads)) return false;
    if (inRiverWater(px, py)) return true;
    return !onIslandLand(px, py);
  }

  function sandWidth(c) {
    const cap = islandCap(c);
    return (10 + Math.sin(c * 0.14) * 2 + n2(c * 0.07, 3.2) * 3) * (0.55 + 0.45 * cap);
  }

  function dirtWidth(c) {
    const cap = islandCap(c);
    return (8 + Math.sin(c * 0.09) * 2 + n2(c * 0.05, 8.1) * 3) * (0.55 + 0.45 * cap);
  }

  function buildWorld() {
    buildRivers();
    for (let r = 0; r < ROWS; r++) {
      world[r] = [];
      for (let c = 0; c < COLS; c++) {
        const shore = baseShoreRow(c);
        const cliff = northCliffRow(c);
        const sandW = sandWidth(c);
        const dirtW = dirtWidth(c);
        let tile = TILES.DEEP;
        if (r < cliff || r > shore) tile = TILES.DEEP;
        else if (r > shore - sandW) tile = TILES.SAND;
        else if (r > shore - sandW - dirtW) tile = TILES.DIRT;
        else tile = TILES.GRASS;
        world[r][c] = tile;
      }
    }
    for (let r = 0; r < ROWS; r++) {
      for (let k = 2; k < TILE; k += 6) {
        const py = r * TILE + k;
        const row = riverSpans[py];
        if (!row) continue;
        for (let i = 0; i < row.length; i++) {
          const s = row[i];
          const c0 = Math.max(0, Math.floor(s.l / TILE));
          const c1 = Math.min(COLS - 1, Math.floor((s.r - 1) / TILE));
          for (let c = c0; c <= c1; c++) {
            if (py <= shoreYAt(c * TILE + 8)) world[r][c] = TILES.DEEP;
          }
        }
      }
    }

    const spawnC = DOCK_C + 2;
    const spawnR = Math.floor(baseShoreRow(spawnC) - 8);
    player.x = spawnC * TILE + 4;
    player.y = spawnR * TILE + 2;
    spawnX = player.x;
    spawnY = player.y;

    for (let i = 0; i < 240; i++) {
      const c = ISLAND_C - ISLAND_HALF + 24 + hash(i, 19) * (ISLAND_HALF * 2 - 48);
      if (hash(i, 23) > 0.08 + eastness(c) * 0.92) continue;
      const cliff = northCliffRow(c);
      const shore = baseShoreRow(c);
      const span = shore - cliff - sandWidth(c) - 3;
      if (span < 4) continue;
      const r = cliff + 2 + hash(i, 29) * span;
      if (!inBounds(c | 0, r | 0) || r < northCliffRow(c) + 1) continue;
      const t = world[r | 0][c | 0];
      if (t !== TILES.GRASS && t !== TILES.DIRT) continue;
      if (!riverClear(c * TILE + 4, r * TILE + 4, 8)) continue;
      const big = eastness(c) > 0.62 && hash(i, 31) > 0.55;
      rocks.push({
        x: Math.floor(c * TILE + rand(0, 10)),
        y: Math.floor(r * TILE + rand(0, 8)),
        w: big ? 10 : 7,
        h: big ? 6 : 5,
      });
    }

    for (let g = 0; g < 22; g++) {
      const c0 = ISLAND_C - ISLAND_HALF + 36 + g * 10 + irand(-2, 2);
      if (eastness(c0) > 0.42) continue;
      const r0 = Math.floor(baseShoreRow(c0) - sandWidth(c0) * 0.42);
      const n = irand(2, 4);
      for (let i = 0; i < n; i++) {
        const c = Math.max(2, Math.min(COLS - 3, c0 + irand(-2, 2)));
        const r = r0 + irand(-1, 1);
        if (!inBounds(c, r) || world[r][c] !== TILES.SAND) continue;
        if (inRiverWater(c * TILE + 4, r * TILE + 8)) continue;
        palms.push({
          x: Math.floor(c * TILE + rand(0, 6)),
          y: r * TILE + 12,
          s: 0.85 + hash(c, r + g) * 0.3,
        });
      }
    }

    for (let g = 0; g < 36; g++) {
      const c0 = ISLAND_C - ISLAND_HALF + 40 + (g / 36) * ISLAND_HALF * 1.45 + irand(-3, 3);
      const e = eastness(c0);
      if (e > 0.7) continue;
      const cliff = northCliffRow(c0);
      const shore = baseShoreRow(c0);
      const r0 = Math.floor(cliff + 6 + hash(g, 4) * Math.max(6, shore - cliff - 16));
      const n = e > 0.38 ? irand(2, 4) : irand(3, 7);
      const kind = e > 0.36 ? "pine" : "leaf";
      for (let i = 0; i < n; i++) {
        const ang = (i / n) * Math.PI * 2 + hash(g, i) * 0.7;
        const rad = 6 + hash(i * 3, g) * 18;
        const c = Math.floor(c0 + Math.cos(ang) * (rad / TILE));
        const r = Math.floor(r0 + Math.sin(ang) * (rad / TILE) * 0.55);
        if (!inBounds(c, r) || r < northCliffRow(c) + 2) continue;
        const t = world[r][c];
        if (t !== TILES.DIRT && t !== TILES.GRASS) continue;
        if (inRiverWater(c * TILE + 4, r * TILE + 8)) continue;
        trees.push({
          x: Math.floor(c * TILE + 2 + hash(c, r) * 8),
          y: Math.floor(r * TILE + 6 + hash(r, c) * 8),
          s: 0.75 + hash(c * 3, r) * 0.5,
          kind,
        });
      }
    }

    spawnFauna();
    spawnInsects();
    bakeStaticWorld();
    buildDockAndShop();
  }

  function isSandAt(px, py) {
    const c = Math.floor(px / TILE);
    const r = Math.floor(py / TILE);
    return inBounds(c, r) && world[r][c] === TILES.SAND;
  }

  function inKeepout(px, py) {
    return !!hitPad(px, py, keepouts);
  }

  function beachOpen(px, py) {
    if (inKeepout(px, py)) return false;
    if (hitPad(px, py, walkPads)) return false;
    if (hitPad(px, py, islandSolids)) return false;
    return true;
  }

  function dockSandCol() {
    return Math.max(2, Math.min(COLS - 3, (spawnX / TILE) | 0));
  }

  function beachLootOk(x, y) {
    if (x < 8 || y < 8 || x > WORLD_W - 12) return false;
    if (!isSandAt(x, y) || inRiverWater(x, y)) return false;
    const rest = restShoreY(x);
    const inland = rest - y;
    if (inland < 12 || inland > 52) return false;
    if (y <= northCliffY(x) + 20) return false;
    return beachSpotOpen(x, y, 14);
  }

  function placeWashLoot(id, life, nearStart) {
    const spawnC = dockSandCol();
    for (let k = 0; k < 64; k++) {
      let c;
      if (nearStart) {
        const spread = 3 + (k % 18);
        const dir = k & 1 ? 1 : -1;
        c = spawnC + dir * spread;
      } else {
        c = 4 + ((k * 97 + waveCycle * 19 + life * 3) % (COLS - 8));
      }
      c = Math.max(3, Math.min(COLS - 4, c | 0));
      if (islandCap(c) < 0.28) continue;
      const x = c * TILE + irand(3, 11);
      const y = (restShoreY(x) - irand(14, 46)) | 0;
      if (!beachLootOk(x, y)) continue;
      let crowded = false;
      for (let i = 0; i < loot.length; i++) {
        const o = loot[i];
        if (o.taken || o.drift) continue;
        if (Math.hypot(o.x - x, o.y - y) < 24) crowded = true;
      }
      if (crowded) continue;
      loot.push({
        id,
        x,
        y,
        taken: false,
        born: waveCycle,
        life,
      });
      return true;
    }
    return false;
  }

  function beachSpotOpen(x, y, margin) {
    if (!isSandAt(x, y) || inRiverWater(x, y)) return false;
    const m = margin | 0;
    if (m <= 0) return beachOpen(x, y);
    for (let dy = -m; dy <= m; dy += m) {
      for (let dx = -m; dx <= m; dx += m) {
        if (!beachOpen(x + dx, y + dy)) return false;
      }
    }
    return true;
  }

  function spotOnCol(c, salt) {
    for (let k = 0; k < 5; k++) {
      const x = c * TILE + 3 + ((salt + k * 5) % 9);
      const inland = 14 + ((salt + k * 7) % 5) * 8;
      const y = (restShoreY(x) - inland) | 0;
      if (beachLootOk(x, y)) return { x, y, c };
    }
    return null;
  }

  function claimBeachSpot(cols, index, salt, used, minDist) {
    const n = cols.length;
    if (!n) return null;
    for (let k = 0; k < 24; k++) {
      const delta = k === 0 ? 0 : (k % 2 === 0 ? 1 : -1) * (((k + 1) / 2) | 0);
      const c = cols[Math.max(0, Math.min(n - 1, index + delta))];
      const s = spotOnCol(c, salt + k * 3);
      if (!s) continue;
      let close = false;
      for (let u = 0; u < used.length; u++) {
        if (Math.hypot(used[u].x - s.x, used[u].y - s.y) < minDist) close = true;
      }
      if (close) continue;
      used.push(s);
      return s;
    }
    return null;
  }

  function placeSouthBeachLoot() {
    const cols = [];
    for (let c = 3; c < COLS - 3; c++) {
      if (islandCap(c) < 0.28) continue;
      cols.push(c);
    }
    const spawnC = dockSandCol();
    const near = [];
    const far = [];
    for (let i = 0; i < cols.length; i++) {
      if (Math.abs(cols[i] - spawnC) <= 22) near.push(cols[i]);
      else far.push(cols[i]);
    }
    const used = [];
    function drop(id, s) {
      if (!s) return;
      loot.push({
        id,
        x: s.x,
        y: s.y,
        taken: false,
        born: 0,
        life: Infinity,
      });
    }
    const nearIds = ["gem", "shell", "shell", "crystal", "gem"];
    for (let i = 0; i < nearIds.length; i++) {
      let s = null;
      if (near.length) {
        const index = ((i * Math.max(1, near.length - 1)) / Math.max(1, nearIds.length - 1)) | 0;
        s = claimBeachSpot(near, index, 11 + i * 9, used, 36);
      }
      if (!s && far.length) {
        let best = 0;
        let bestD = Infinity;
        for (let f = 0; f < far.length; f++) {
          const d = Math.abs(far[f] - spawnC);
          if (d < bestD) {
            bestD = d;
            best = f;
          }
        }
        s = claimBeachSpot(far, best, 21 + i * 9, used, 36);
      }
      drop(nearIds[i], s);
    }
    const farIds = [];
    const gems = ["gem", "gem", "crystal", "gem", "gem"];
    let g = 0;
    for (let i = 0; i < 20; i++) {
      farIds.push("shell");
      if (g < gems.length && (i === 3 || i === 7 || i === 11 || i === 15 || i === 19)) {
        farIds.push(gems[g]);
        g++;
      }
    }
    const stride = far.length / Math.max(1, farIds.length);
    for (let i = 0; i < farIds.length; i++) {
      const index = far.length ? Math.min(far.length - 1, (i * stride) | 0) : 0;
      drop(farIds[i], claimBeachSpot(far, index, 40 + i * 5, used, 64));
    }
  }

  function updateLoot() {
    waveCycle = Math.floor(time / WASH_PERIOD);
    for (const item of loot) {
      if (item.taken || item.life === Infinity) continue;
      if (waveCycle - item.born >= item.life) item.taken = true;
    }
    if (waveCycle === lastWaveCycle) return;
    lastWaveCycle = waveCycle;
    if (waveCycle <= 0) return;
    if (Math.random() < 0.55) placeWashLoot("gem", irand(4, 5), Math.random() < 0.22);
    if (Math.random() < 0.18) placeWashLoot("gem", irand(4, 5), false);
    if (Math.random() < 0.035) placeWashLoot("crystal", irand(4, 5), Math.random() < 0.2);
    if (Math.random() < 0.05) placeWashLoot("jelly", irand(2, 4), Math.random() < 0.2);
  }

  function isDryBeachSand(px, py) {
    if (!isSandAt(px, py) || !isSandAt(px + 3, py) || !isSandAt(px - 2, py)) return false;
    if (!beachOpen(px, py) || !beachOpen(px + 3, py)) return false;
    const rest = restShoreY(px);
    if (py >= rest - 40) return false;
    const inland = rest - py;
    if (inland < 48 || inland > sandWidth(px / TILE) * TILE - 18) return false;
    if (inRiverWater(px, py) || py < northCliffY(px) + 8) return false;
    return true;
  }

  function spawnFauna() {
    for (let i = 0; i < MAX_SPLASH; i++) {
      splashes.push({ life: 0, x: 0, y: 0, vx: 0, vy: 0, col: "#ffffff" });
    }
    for (let i = 0; i < MAX_SAND; i++) {
      sandBits.push({ life: 0, x: 0, y: 0, vx: 0, vy: 0, col: "#d8bc86", crab: null });
    }
  }

  function pushBeachCrab(x, y, i, hidden) {
    const w = 5 + ((hash(i, 11) * 3.2) | 0);
    crabs.push({
      x,
      y,
      w,
      h: 3 + (w > 6 ? 1 : 0),
      dir: hash(i, 8) > 0.5 ? 1 : -1,
      state: hidden ? "hidden" : hash(i, 1) > 0.5 ? "idle" : "scuttle",
      t: hidden ? rand(2, 11) : rand(0.8, 3.6),
      bury: hidden ? 1 : 0,
      hop: 0,
      mound: hidden ? 1 : 0,
      cover: [],
      sandBurst: false,
      anim: rand(0, 8),
      seen: hidden ? 0 : rand(0.2, 1.8),
      squash: 1,
    });
  }

  function placeBeachCrabs() {
    crabs.length = 0;
    const spots = [];
    for (let c = 2; c < COLS - 2; c += 2) {
      if (islandCap(c) <= 0.08) continue;
      const x = c * TILE + 8;
      const rest = restShoreY(x);
      const band = sandWidth(c) * TILE;
      const yTop = rest - (band - 22);
      const yBot = rest - 52;
      if (yTop > yBot) continue;
      for (let y = yBot; y >= yTop; y -= 8) {
        if (!isDryBeachSand(x, y)) continue;
        spots.push({ x, y });
        break;
      }
    }
    if (spots.length < 4) return;
    const n = Math.min(spots.length, irand(11, 16));
    const used = new Array(spots.length).fill(false);
    const picks = [];
    const stride = spots.length / n;
    for (let i = 0; i < n; i++) {
      const idx = Math.min(spots.length - 1, Math.floor(i * stride + stride * 0.5));
      used[idx] = true;
      picks.push(idx);
    }
    const pierX = 48 * TILE;
    const ensureNear = (goal) => {
      for (let p = 0; p < picks.length; p++) {
        if (Math.abs(spots[picks[p]].x - goal) < 180) return;
      }
      let best = -1;
      let bestD = Infinity;
      for (let i = 0; i < spots.length; i++) {
        const d = Math.abs(spots[i].x - goal);
        if (d < bestD) {
          bestD = d;
          best = i;
        }
      }
      if (best < 0 || bestD > 240 || used[best]) return;
      let rep = 0;
      let repD = Infinity;
      for (let p = 0; p < picks.length; p++) {
        const d = Math.abs(spots[picks[p]].x - goal);
        if (d < repD) {
          repD = d;
          rep = p;
        }
      }
      used[picks[rep]] = false;
      used[best] = true;
      picks[rep] = best;
    };
    ensureNear(pierX - 90);
    ensureNear(pierX + 260);
    for (let i = 0; i < picks.length; i++) {
      const s = spots[picks[i]];
      let x = s.x + rand(-6, 6);
      if (!isDryBeachSand(x, s.y)) x = s.x;
      const nearPier = Math.abs(x - (pierX + 80)) < 360;
      const hidden = !nearPier && hash(i, 3) > 0.58;
      pushBeachCrab(x, s.y, i, hidden);
    }
  }

  function spawnInsects() {
    for (let i = 0; i < 32; i++) {
      const c = ISLAND_C - ISLAND_HALF + 28 + hash(i, 4) * ISLAND_HALF * 0.95;
      if (eastness(c) > 0.46) continue;
      const cliff = northCliffRow(c);
      const shore = baseShoreRow(c);
      const r = cliff + 3 + hash(i, 9) * Math.max(4, shore - cliff - 8);
      const ci = c | 0;
      const ri = r | 0;
      if (!inBounds(ci, ri)) continue;
      const tile = world[ri][ci];
      if (tile !== TILES.GRASS && tile !== TILES.DIRT && tile !== TILES.SAND) continue;
      if (inRiverWater(ci * TILE + 4, ri * TILE + 4)) continue;
      insects.push({
        x: ci * TILE + hash(i, 2) * 12,
        y: ri * TILE + 4,
        phase: hash(i, 7) * 6.28,
      });
    }
  }

  function spawnOneSwimFish(kind) {
    for (let t = 0; t < 40; t++) {
      const x = rand(40, WORLD_W - 40);
      const rest = restShoreY(x);
      const y = rest + rand(18, 90);
      if (hitPad(x, y, walkPads) || inKeepout(x, y)) continue;
      if (onIslandLand(x, y)) continue;
      swimFish.push({
        x,
        y,
        id: kind || FISH_CATCH[irand(0, FISH_CATCH.length - 1)],
        dir: Math.random() > 0.5 ? 1 : -1,
        span: rand(6, 16),
        phase: rand(0, 6),
        alive: true,
      });
      return true;
    }
    return false;
  }

  function spawnSwimFish() {
    for (let i = 0; i < 14; i++) {
      spawnOneSwimFish(FISH_CATCH[i % FISH_CATCH.length]);
    }
  }

  function updateSwimFish(dt) {
    let live = 0;
    for (let i = 0; i < swimFish.length; i++) {
      const f = swimFish[i];
      if (!f.alive) continue;
      live++;
      f.phase += dt * 0.9;
      f.x += f.dir * dt * 8;
      if (f.x < 20 || f.x > WORLD_W - 20 || onIslandLand(f.x, f.y) || hitPad(f.x, f.y, walkPads)) {
        f.dir *= -1;
        f.x += f.dir * 4;
      }
    }
    if (live < 12 && Math.random() < dt * 0.35) spawnOneSwimFish();
  }

  function crabSetState(c, state) {
    c.state = state;
    if (state === "idle") c.t = rand(0.5, 2.4);
    else if (state === "scuttle") {
      c.t = rand(0.45, 1.8);
      if (Math.random() < 0.35) c.dir *= -1;
    } else if (state === "pause") c.t = rand(0.35, 1.5);
    else if (state === "bury") c.t = 0.82;
    else if (state === "hidden") c.t = rand(5.5, 16);
    else if (state === "unbury") c.t = 0.56;
  }

  function loudNoiseOn() {
    return loudNoiseActive || time < scareUntil;
  }

  function crabBeginBury(c) {
    if (c.state === "hidden" && (c.bury || 0) >= 0.9) {
      c.mound = 1;
      c.t = Math.max(c.t, 0.35);
      return;
    }
    if (c.state === "bury") return;
    c.state = "bury";
    c.t = 0.82;
    c.sandBurst = false;
    c.splitBurst = false;
    c.hop = 0;
    if ((c.bury || 0) < 0.45) {
      c.mound = 0;
      c.cover.length = 0;
    }
  }

  function scareWildlife(hold) {
    if (hold > 0) scareUntil = Math.max(scareUntil, time + hold);
    wildlifeScared = true;
    for (let i = 0; i < crabs.length; i++) {
      const c = crabs[i];
      if (c.state === "hidden") {
        c.bury = 1;
        c.mound = 1;
        c.hop = 0;
        c.t = Math.max(c.t, 0.35);
        continue;
      }
      crabBeginBury(c);
    }
  }

  function setLoudNoise(on) {
    const next = !!on;
    if (next === loudNoiseActive) return;
    loudNoiseActive = next;
    if (loudNoiseActive) scareWildlife();
  }

  function lingerWildlifeScare() {
    for (let i = 0; i < crabs.length; i++) {
      const c = crabs[i];
      const wait = rand(0.45, 1.7);
      if (c.state === "hidden") c.t = wait;
      else if (c.state === "bury") c.scareLinger = wait;
    }
  }

  function updateWildlifeScare() {
    const on = loudNoiseOn();
    if (on && !wildlifeScared) scareWildlife();
    if (!on && wildlifeScared) {
      wildlifeScared = false;
      lingerWildlifeScare();
    }
  }

  function sandColor() {
    const r = Math.random();
    if (r > 0.72) return "#edd6a8";
    if (r > 0.42) return "#e2c792";
    if (r > 0.18) return "#d8bc86";
    return "#c9a56a";
  }

  function emitSandBurst(c, n, mode) {
    let k = 0;
    for (let i = 0; i < MAX_SAND && k < n; i++) {
      const p = sandBits[i];
      if (p.life > 0) continue;
      p.x = c.x + rand(-3.4, 3.4);
      p.y = c.y - rand(0, 2);
      if (mode === "split") {
        p.vx = rand(-56, 56);
        p.vy = rand(-46, -6);
        p.life = rand(0.22, 0.42);
      } else {
        p.vx = rand(-46, 46);
        p.vy = rand(-118, -52);
        p.life = rand(0.32, 0.58);
      }
      p.max = p.life;
      p.col = sandColor();
      p.crab = c;
      k++;
    }
  }

  function crabFinishHide(c, scared) {
    c.bury = 1;
    c.hop = 0;
    c.mound = 1;
    c.state = "hidden";
    if (scared) c.t = 1;
    else if (c.scareLinger != null) {
      c.t = c.scareLinger;
      c.scareLinger = null;
    } else c.t = rand(5.5, 16);
  }

  function updateSandBits(dt) {
    for (let i = 0; i < MAX_SAND; i++) {
      const p = sandBits[i];
      if (p.life <= 0) continue;
      p.vy += 260 * dt;
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.life -= dt;
      const c = p.crab;
      if (c && p.vy > 12 && p.y >= c.y - 1) {
        p.life = 0;
        if (c.state !== "bury" && c.state !== "hidden" && c.state !== "unbury") continue;
        if (!c.cover) c.cover = [];
        const ox = Math.max(-3, Math.min(3, ((p.x - c.x) | 0)));
        const oy = Math.max(-3, Math.min(1, ((p.y - c.y) | 0) - 1));
        c.cover.push({ ox, oy, c: p.col });
        if (c.cover.length > 12) c.cover.shift();
        c.mound = Math.min(1, (c.mound || 0) + 0.1);
      }
    }
  }

  function updateCrabs(dt) {
    updateWildlifeScare();
    const scared = loudNoiseOn();
    for (let i = 0; i < crabs.length; i++) {
      const c = crabs[i];
      c.t -= dt;
      c.anim += dt * (c.state === "scuttle" ? 14 : 5);
      if (c.state !== "bury" && c.state !== "unbury") {
        c.squash += (1 - c.squash) * Math.min(1, dt * 10);
      }
      if (c.state === "scuttle") {
        const nx = c.x + c.dir * (22 + c.w) * dt;
        if (
          isDryBeachSand(nx, c.y) &&
          isDryBeachSand(nx + c.dir * 4, c.y) &&
          !isSolidPoint(nx, c.y)
        ) {
          c.x = nx;
        } else {
          c.dir *= -1;
          crabSetState(c, "pause");
        }
      }
      if (c.state === "bury") {
        const dur = 0.82;
        const u = 1 - Math.max(0, c.t) / dur;
        if (u < 0.34) {
          const h = u / 0.34;
          c.hop = Math.sin(h * Math.PI) * (6.2 + c.w * 0.12);
          c.squash = h < 0.42 ? 1.18 - h * 0.7 : 0.58 + (h - 0.42) * 1.05;
          c.bury = 0;
        } else {
          c.hop = 0;
          const sink = (u - 0.34) / 0.22;
          c.bury = Math.min(1, sink * sink);
          c.squash = 0.82;
        }
        if (u >= 0.3 && !c.sandBurst) {
          c.sandBurst = true;
          emitSandBurst(c, 13 + (c.w | 0), "up");
        }
        if (u > 0.46) c.mound = Math.max(c.mound || 0, (u - 0.46) / 0.42);
        if (c.t <= 0) crabFinishHide(c, scared);
      } else if (c.state === "unbury") {
        if (scared) {
          crabBeginBury(c);
          continue;
        }
        const dur = 0.56;
        const u = 1 - Math.max(0, c.t) / dur;
        if (!c.splitBurst && u > 0.04) {
          c.splitBurst = true;
          emitSandBurst(c, 9, "split");
          c.cover.length = 0;
        }
        c.mound = Math.max(0, 1 - u * 2.4);
        c.hop = Math.sin(Math.min(1, u * 1.15) * Math.PI) * 5.2;
        c.bury = Math.max(0, 1 - u * 1.4);
        c.squash = 0.62 + u * 0.55;
        if (c.t <= 0) {
          c.bury = 0;
          c.hop = 0;
          c.mound = 0;
          c.squash = 1.22;
          c.seen = 0;
          c.splitBurst = false;
          crabSetState(c, Math.random() < 0.55 ? "idle" : "scuttle");
        }
      } else if (c.state === "hidden") {
        c.bury = 1;
        c.hop = 0;
        c.mound = 1;
        if (scared) {
          c.t = Math.max(c.t, 0.25);
        } else if (c.t <= 0) {
          c.splitBurst = false;
          crabSetState(c, "unbury");
        }
      } else {
        c.mound = 0;
        c.hop = 0;
        if (c.cover && c.cover.length) c.cover.length = 0;
        if (scared) {
          crabBeginBury(c);
          continue;
        }
        c.seen += dt;
        if (c.t > 0) continue;
        if (c.seen > rand(2.2, 6.5) && Math.random() < 0.55) {
          c.sandBurst = false;
          c.cover.length = 0;
          crabSetState(c, "bury");
        } else if (c.state === "scuttle") crabSetState(c, Math.random() < 0.4 ? "pause" : "idle");
        else if (c.state === "pause") crabSetState(c, Math.random() < 0.7 ? "scuttle" : "idle");
        else crabSetState(c, Math.random() < 0.62 ? "scuttle" : "pause");
      }
    }
    updateSandBits(dt);
  }

  function emitSplash(wx, wy, n, fromFish) {
    if (onIslandLand(wx, wy) || fishOverDock(wx, wy)) return;
    let k = 0;
    for (let i = 0; i < MAX_SPLASH && k < n; i++) {
      const p = splashes[i];
      if (p.life > 0) continue;
      p.x = wx + rand(-2.2, 2.2);
      p.y = wy + rand(-1.2, 1.4);
      p.vx = rand(-28, 28);
      p.vy = rand(-46, -10);
      p.life = rand(0.22, 0.48);
      p.max = p.life;
      p.col = Math.random() > 0.4 ? "#ffffff" : "#e8f6ff";
      p.fish = !!fromFish;
      k++;
    }
    if (k > 0) return;
    const reuse = Math.min(n, splashes.length);
    for (let i = 0; i < reuse; i++) {
      const p = splashes[(i * 5) % splashes.length];
      p.x = wx + rand(-2.2, 2.2);
      p.y = wy + rand(-1.2, 1.4);
      p.vx = rand(-28, 28);
      p.vy = rand(-46, -10);
      p.life = rand(0.22, 0.48);
      p.max = p.life;
      p.col = i & 1 ? "#ffffff" : "#e8f6ff";
      p.fish = !!fromFish;
    }
  }

  function clearFishSplashes() {
    for (let i = 0; i < splashes.length; i++) {
      if (splashes[i].fish) splashes[i].life = 0;
    }
  }

  function fishWater(wx, wy) {
    if (wx < 6 || wy < 6 || wx >= WORLD_W - 6 || wy >= WORLD_H - 6) return false;
    if (wy < restShoreY(wx) - 0.5) return false;
    if (onIslandLand(wx, wy)) return false;
    if (fishOverDock(wx, wy)) return false;
    if (hitPad(wx, wy, islandSolids)) return false;
    return true;
  }

  function pickJumpKind() {
    // Equal odds among jump kinds (no mini-shark overweight).
    return JUMP_KINDS[irand(0, JUMP_KINDS.length - 1)];
  }

  function bez(a, b, c, u) {
    const o = 1 - u;
    return o * o * a + 2 * o * u * b + u * u * c;
  }

  function spawnFishJump() {
    let f = null;
    for (let i = 0; i < fishJumps.length; i++) {
      if (!fishJumps[i].alive) {
        f = fishJumps[i];
        break;
      }
    }
    if (!f) {
      if (fishJumps.length >= MAX_FISH) return;
      f = { alive: false };
      fishJumps.push(f);
    }
    const left = camera.x + 12;
    const right = camera.x + viewW - 12;
    if (right - left < 28) return;
    fishCursor = (fishCursor + 0.37) % 1;
    for (let attempt = 0; attempt < 18; attempt++) {
      const x = left + ((fishCursor + attempt * 0.19) % 1) * (right - left);
      const rest = restShoreY(x);
      if (rest < camera.y - 4 || rest > camera.y + viewH - 18) continue;
      const kind = pickJumpKind();
      const clearance = kind === "shark" ? 12 : kind === "mini_shark" ? 8 : 4;
      const apexY = rest + clearance + rand(1, 4);
      const startY = apexY + rand(16, 36);
      const endY = apexY + rand(14, 34);
      if (apexY > camera.y + viewH - 8) continue;
      if (startY >= WORLD_H - 6 || endY >= WORLD_H - 6) continue;
      const dx = rand(-58, 58);
      const x1 = x + dx * 0.35;
      const x2 = x + dx;
      if (!fishWater(x, startY) || !fishWater(x2, endY) || !fishWater(x1, apexY)) continue;
      let clear = true;
      for (let s = 1; s <= 7; s++) {
        const u = s / 8;
        if (!fishWater(bez(x, x1, x2, u), bez(startY, apexY, endY, u))) {
          clear = false;
          break;
        }
      }
      if (!clear) continue;
      f.alive = true;
      f.u = 0;
      f.dur = kind === "shark" ? rand(1.05, 1.45) : rand(0.82, 1.22);
      f.x0 = x;
      f.x1 = x1;
      f.x2 = x2;
      f.y0 = startY;
      f.y1 = apexY;
      f.y2 = endY;
      f.x = x;
      f.y = startY;
      f.kind = kind;
      f.len = kind === "shark" ? 16 : kind === "mini_shark" ? 11 : 6 + ((hash(x | 0, startY | 0) * 4) | 0);
      f.ang = -Math.PI / 2;
      f.squash = 0.7;
      f.tumble = rand(-0.55, 0.55) * (kind === "shark" ? 0.35 : kind === "mini_shark" ? 0.45 : 1);
      f.splashedUp = false;
      f.splashedDown = false;
      return;
    }
  }

  function sharkFinSet(f, state) {
    f.state = state;
    f.splashed = false;
    if (state === "swim") {
      f.t = rand(2.0, 4.8);
      f.sub = 0;
    } else if (state === "dive") {
      f.t = 0.82;
      f.sub = 0;
    } else if (state === "under") {
      f.t = rand(2.4, 5.5);
      f.sub = 1;
    } else {
      f.t = 0.56;
      f.sub = 1;
    }
  }

  function emitFinFoam(f) {
    const foam = f.foam;
    for (let i = 0; i < 8; i++) {
      const ang = rand(0, 6.2832);
      const life = rand(0.22, 0.48);
      foam.push({
        x: f.x + Math.cos(ang) * rand(1, 4),
        y: f.y + Math.sin(ang) * rand(0.4, 2.2),
        vx: Math.cos(ang) * rand(8, 26),
        vy: rand(-34, -8),
        life,
        col: i & 1 ? "#ffffff" : "#f4fcff",
      });
    }
    if (foam.length > 20) foam.splice(0, foam.length - 20);
  }

  function spawnSharkFin() {
    for (let n = 0; n < 14; n++) {
      const x = rand(40, WORLD_W - 40);
      const shore = restShoreY(x);
      const depth = rand(120, 230);
      const y = shore + depth;
      if (y > WORLD_H - 18 || y < shore + 100) continue;
      if (onIslandLand(x, y) || fishOverDock(x, y)) continue;
      const f = {
        x,
        y,
        depth,
        dir: Math.random() < 0.5 ? -1 : 1,
        speed: rand(18, 32),
        big: Math.random() > 0.45,
        phase: rand(0, 6.2),
        foam: [],
      };
      sharkFins.push(f);
      sharkFinSet(f, Math.random() < 0.4 ? "under" : "swim");
      return;
    }
  }

  function updateSharkFins(dt) {
    if (sharkFins.length < 5) spawnSharkFin();
    for (let i = 0; i < sharkFins.length; i++) {
      const f = sharkFins[i];
      f.phase += dt * 1.6;
      f.x += f.dir * (f.speed / 5) * dt;
      const shore = restShoreY(f.x);
      f.y = shore + f.depth + Math.sin(f.phase) * 4;
      const tooClose = f.y < shore + 96;
      if (
        f.x < 28 ||
        f.x > WORLD_W - 28 ||
        f.y > WORLD_H - 12 ||
        tooClose ||
        onIslandLand(f.x, f.y) ||
        fishOverDock(f.x, f.y)
      ) {
        f.dir *= -1;
        f.x += f.dir * 8;
        f.depth = Math.max(120, Math.min(230, f.depth + rand(-12, 12)));
      }
      f.t -= dt;
      if (f.state === "dive" || f.state === "rise") {
        if (!f.splashed) {
          f.splashed = true;
          emitFinFoam(f);
        }
        const dur = f.state === "dive" ? 0.82 : 0.56;
        const u = 1 - Math.max(0, f.t) / dur;
        if (f.state === "dive") f.sub = Math.min(1, u * u);
        else f.sub = Math.max(0, 1 - u * 1.35);
        if (f.t <= 0) sharkFinSet(f, f.state === "dive" ? "under" : "swim");
      } else if (f.state === "under") {
        f.sub = 1;
        if (f.t <= 0) sharkFinSet(f, "rise");
      } else {
        f.sub = 0;
        if (f.t <= 0) sharkFinSet(f, "dive");
      }
      const foam = f.foam;
      for (let s = foam.length - 1; s >= 0; s--) {
        const p = foam[s];
        p.life -= dt;
        if (p.life <= 0) {
          foam.splice(s, 1);
          continue;
        }
        p.x += p.vx * dt;
        p.y += p.vy * dt;
        p.vy += 70 * dt;
      }
    }
  }

  function hideSurfaceFish() {
    for (let i = 0; i < fishJumps.length; i++) fishJumps[i].alive = false;
    sharkFins.length = 0;
    clearFishSplashes();
  }

  function updateFish(dt) {
    if (!fishDaytime(time)) {
      hideSurfaceFish();
    } else {
      updateSharkFins(dt);
      fishSpawnT -= dt;
      if (fishSpawnT <= 0) {
        fishSpawnT = rand(1.7, 5.2);
        let live = 0;
        for (let i = 0; i < fishJumps.length; i++) if (fishJumps[i].alive) live++;
        if (live < MAX_FISH && Math.random() < 0.78) spawnFishJump();
      }
      for (let i = 0; i < fishJumps.length; i++) {
        const f = fishJumps[i];
        if (!f.alive) continue;
        if (!(f.dur > 0.25)) f.dur = 1;
        const prevU = f.u;
        f.u += dt / f.dur;
        if (!(f.u >= 0)) f.u = 1;
        const u = f.u > 1 ? 1 : f.u;
        f.x = bez(f.x0, f.x1, f.x2, u);
        f.y = bez(f.y0, f.y1, f.y2, u);
        const vx = bez(f.x0, f.x1, f.x2, Math.min(1, u + 0.04)) - f.x;
        const vy = bez(f.y0, f.y1, f.y2, Math.min(1, u + 0.04)) - f.y;
        if (vx * vx + vy * vy > 0.0001) f.ang = Math.atan2(vy, vx);
        if (!f.splashedUp) {
          emitSplash(f.x0, f.y0, f.len > 10 ? 12 : 8, true);
          f.splashedUp = true;
          f.squash = 0.55;
        }
        if (!f.splashedDown && prevU < 0.9 && f.u >= 0.9) {
          emitSplash(f.x2, f.y2, f.len > 10 ? 14 : 9, true);
          f.splashedDown = true;
          f.squash = 0.5;
        }
        const lift = Math.sin(Math.min(1, u) * Math.PI);
        f.squash += (0.84 + lift * 0.32 - f.squash) * Math.min(1, dt * 7);
        if (f.u > 0.06 && !fishWater(f.x, f.y)) {
          if (!f.splashedDown) emitSplash(f.x, f.y, 6, true);
          f.alive = false;
          continue;
        }
        if (f.u >= 1) {
          if (!f.splashedDown) emitSplash(f.x2, f.y2, f.len > 10 ? 12 : 8, true);
          f.alive = false;
        }
      }
    }
    for (let i = 0; i < MAX_SPLASH; i++) {
      const p = splashes[i];
      if (p.life <= 0) continue;
      p.life -= dt;
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.vy += 92 * dt;
    }
  }

  function standingOnDeck() {
    if (scene !== "island" || player.aboard) return false;
    const fy = player.y + player.h - 2;
    const xs = [player.x + 2, player.x + player.w * 0.5, player.x + player.w - 2];
    for (let i = 0; i < xs.length; i++) {
      if (hitPad(xs[i], fy, deckPads)) return true;
    }
    return false;
  }

  function canMove(nx, ny) {
    const pad = 2;
    const points = [
      [nx + pad, ny + player.h * 0.55],
      [nx + player.w - pad, ny + player.h * 0.55],
      [nx + pad, ny + player.h - pad],
      [nx + player.w - pad, ny + player.h - pad],
    ];
    if (!points.every(([x, y]) => canStand(x, y))) return false;
    if (!standingOnDeck()) return true;
    const fy = ny + player.h - pad;
    const xs = [nx + pad, nx + player.w * 0.5, nx + player.w - pad];
    for (let i = 0; i < xs.length; i++) {
      const x = xs[i];
      if (hitPad(x, fy, walkPads)) continue;
      if (isWaterAt(x, fy)) return false;
    }
    return true;
  }

  function playerCenter() {
    return { x: player.x + player.w / 2, y: player.y + player.h / 2 };
  }

  function updatePlayer(dt) {
    let dx = 0;
    let dy = 0;
    if (keys.a || keys.arrowleft) dx -= 1;
    if (keys.d || keys.arrowright) dx += 1;
    if (keys.w || keys.arrowup) dy -= 1;
    if (keys.s || keys.arrowdown) dy += 1;

    player.moving = dx !== 0 || dy !== 0;
    if (dx !== 0) player.facing = dx > 0 ? 1 : -1;

    const mid = playerCenter();
    const feetY = player.y + player.h - 2;
    const onDock = scene === "island" && !!hitPad(player.x + 4, feetY, walkPads);
    if (player.aboard) {
      player.inWater = false;
    } else {
      player.inWater =
        scene === "island" &&
        !onDock &&
        (inRiverWater(player.x + 4, feetY) ||
          feetY > restShoreY(player.x + 3) ||
          feetY > restShoreY(player.x + player.w - 3));
    }

    if (guideOpen || cabinCut.kind || uiBlocksPlay() || chatCapturesInput()) {
      dx = 0;
      dy = 0;
      player.moving = false;
    }

    if (player.dead <= 0 && !fadeMode && !guideOpen && !cabinCut.kind && !uiBlocksPlay() && !chatCapturesInput()) {
      if (player.aboard && ownedBoat && scene === "island") {
        steerOwnedBoat(dt, dx, dy);
      } else {
        const speed = (player.inWater ? 70 : 165) * dt;
        if (player.moving) {
          const len = Math.hypot(dx, dy) || 1;
          const nx = player.x + (dx / len) * speed;
          const ny = player.y + (dy / len) * speed;
          if (canMove(nx, player.y)) player.x = nx;
          if (canMove(player.x, ny)) player.y = ny;
        }
      }
    } else {
      player.moving = false;
    }

    if (isIndoor()) {
      player.x = Math.max(8, Math.min(indoorW() - player.w - 8, player.x));
      player.y = Math.max(10, Math.min(indoorH() - player.h - 4, player.y));
    } else {
      player.x = Math.max(0, Math.min(COLS * TILE - player.w, player.x));
      player.y = Math.max(0, Math.min(ROWS * TILE - player.h, player.y));
    }

    if (player.moving) player.anim += dt * 13;
    else player.anim *= 0.7;
    player.frame = Math.floor(player.anim) % 4;
    player.bob += dt * 3;

    updateDrowning(dt);

    const targetX = mid.x - viewW / 2;
    const targetY = mid.y - viewH * 0.36;
    const follow = 1 - Math.exp(-dt * 3.1);
    camera.x += (targetX - camera.x) * follow;
    camera.y += (targetY - camera.y) * follow;
    clampCamera();
    shake = Math.max(0, shake - dt * 18);
    if (
      playMode === "speedrun" &&
      (uiScreen === "ready" || (uiScreen === null && srRunning)) &&
      player.moving &&
      !srTiming
    ) {
      maybeStartSpeedTimer();
    }

    if (
      !guideOpen &&
      !uiBlocksPlay() &&
      !chatCapturesInput() &&
      !player.aboard &&
      ownedBoat &&
      ownedBoat.landed &&
      !boatThrow &&
      scene === "island" &&
      player.dead <= 0
    ) {
      const bx = ownedBoat.x + ownedBoat.w / 2;
      const by = ownedBoat.y + ownedBoat.h / 2;
      const now = playerCenter();
      if (Math.hypot(now.x - bx, now.y - by) < 14) {
        player.aboard = true;
        seatPlayerOnBoat();
        player.inWater = false;
        player.submerged = 0;
        checkBoatSpeedEnd();
      }
    }
  }

  function hurtPlayer() {
    if (player.hp <= 0 || player.dead > 0) return;
    player.hp -= 1;
    player.hurt = 0.45;
    shake = 6;
    if (player.hp <= 0) {
      player.dead = 1.4;
      player.aboard = false;
      if (playMode === "normal") {
        const api = lbApi();
        if (api && api.noteNmEvent) api.noteNmEvent("deaths", 1);
      }
    }
  }

  function updateDrowning(dt) {
    if (uiBlocksPlay()) {
      if (player.hurt > 0) player.hurt -= dt;
      return;
    }
    if (player.dead > 0) {
      srWasDead = true;
      player.dead -= dt;
      if (player.dead <= 0) {
        player.x = spawnX;
        player.y = spawnY;
        player.hp = MAX_HP;
        player.submerged = 0;
        player.drownTick = 0;
        player.hurt = 0;
        player.aboard = false;
        if (playMode === "speedrun" && srCat === "death" && srTiming && srWasDead && uiScreen !== "finish") {
          srWasDead = false;
          finishSpeedrun();
        }
        srWasDead = false;
      }
      return;
    }
    if (player.aboard) {
      player.submerged = 0;
      player.drownTick = 0;
    } else if (player.inWater) {
      player.submerged += dt;
      if (player.submerged > 1.6) {
        player.drownTick += dt;
        if (player.drownTick >= 0.85) {
          player.drownTick = 0;
          hurtPlayer();
        }
      }
    } else {
      player.submerged = Math.max(0, player.submerged - dt * 1.4);
      player.drownTick = 0;
    }
    if (player.hurt > 0) player.hurt -= dt;
  }

  function pickupRadius() {
    return Math.max(player.w, player.h);
  }

  function findNearestLoot() {
    const mid = playerCenter();
    let best = null;
    let bestDist = pickupRadius();
    for (const item of loot) {
      if (item.taken) continue;
      if ((item.scene || "island") !== scene) continue;
      if (item.drift) continue;
      if (item.ignoreUntil && time < item.ignoreUntil) continue;
      const d = Math.hypot(item.x + 4 - mid.x, item.y + 4 - mid.y);
      if (d < bestDist) {
        bestDist = d;
        best = item;
      }
    }
    return best;
  }

  function addToInventory(id) {
    const def = ITEM_DEFS[id];
    const existing = inventory.findIndex((s) => s && s.id === id);
    if (existing >= 0) {
      if (inventory[existing].count >= def.max) return false;
      inventory[existing].count += 1;
      if (playMode === "normal" && id === "shark") {
        const api = lbApi();
        if (api && api.noteNmEvent) api.noteNmEvent("sharks", 1);
      }
      if (playMode === "speedrun" && srCat === "full_inv" && inventory.every((s) => !!s)) {
        finishSpeedrun();
      }
      if (playMode === "speedrun" && srCat === "serpent" && id === "serpent_heart") {
        finishSpeedrun();
      }
      return true;
    }
    const empty = inventory.findIndex((s) => !s);
    if (empty < 0) return false;
    inventory[empty] = { id, count: 1 };
    if (playMode === "normal" && id === "shark") {
      const api = lbApi();
      if (api && api.noteNmEvent) api.noteNmEvent("sharks", 1);
    }
    if (playMode === "speedrun" && srCat === "full_inv" && inventory.every((s) => !!s)) {
      finishSpeedrun();
    }
    if (playMode === "speedrun" && srCat === "serpent" && id === "serpent_heart") {
      finishSpeedrun();
    }
    return true;
  }

  function xpNeeded(level) {
    return 24 + (level - 1) * 16;
  }

  function gainXp(amount) {
    if (amount <= 0) return;
    const fromXp = player.xp;
    const fromLevel = player.level;
    player.xp += amount;
    let leveled = 0;
    while (player.xp >= xpNeeded(player.level)) {
      player.xp -= xpNeeded(player.level);
      player.level += 1;
      leveled += 1;
    }
    if (leveled > 0 && playMode === "normal") {
      const api = lbApi();
      if (api && api.noteNmEvent) api.noteNmEvent("level", player.level);
    }
    xpFx = {
      t: 0,
      amount,
      leveled,
      fromXp,
      fromLevel,
    };
  }

  function updateXpFx(dt) {
    if (!xpFx) return;
    xpFx.t += dt;
    if (xpFx.t > (xpFx.leveled ? 1.55 : 0.95)) xpFx = null;
  }

  function inflightCount(id) {
    let n = 0;
    for (let i = 0; i < pickupAnims.length; i++) {
      if (pickupAnims[i].dest === "slot" && pickupAnims[i].id === id) n++;
    }
    return n;
  }

  function inflightFreshSlots() {
    let n = 0;
    const seen = Object.create(null);
    for (let i = 0; i < pickupAnims.length; i++) {
      const a = pickupAnims[i];
      if (a.dest !== "slot" || seen[a.id]) continue;
      seen[a.id] = 1;
      if (!inventory.some((s) => s && s.id === a.id)) n++;
    }
    return n;
  }

  function canTake(id) {
    if (id === "coin") return true;
    const def = ITEM_DEFS[id];
    if (!def) return false;
    const stack = inventory.find((s) => s && s.id === id);
    const pending = inflightCount(id);
    if (stack) return stack.count + pending < def.max;
    if (pending > 0) return pending < def.max;
    let empty = 0;
    for (let i = 0; i < inventory.length; i++) if (!inventory[i]) empty++;
    return empty > inflightFreshSlots();
  }

  function slotIndexFor(id) {
    const i = inventory.findIndex((s) => s && s.id === id);
    if (i >= 0) return i;
    for (let a = 0; a < pickupAnims.length; a++) {
      if (pickupAnims[a].dest === "slot" && pickupAnims[a].id === id) return pickupAnims[a].slot;
    }
    const used = Object.create(null);
    for (let a = 0; a < pickupAnims.length; a++) {
      const p = pickupAnims[a];
      if (p.dest === "slot") used[p.slot] = 1;
    }
    for (let s = 0; s < inventory.length; s++) {
      if (!inventory[s] && !used[s]) return s;
    }
    return 0;
  }

  function hudBarOrigin() {
    const slot = 24;
    const gap = 2;
    const rowGap = 2;
    const barW = HUD_COLS * slot + (HUD_COLS - 1) * gap;
    const uiW = canvas.width / SCALE_UI;
    const uiH = canvas.height / SCALE_UI;
    const heartsY = uiH - 11;
    const barY = heartsY - 9;
    const y0 = barY - 4 - (slot * 2 + rowGap);
    const x0 = uiW - barW - 6;
    return { x0, y0, slot, gap, rowGap, barW, barY, heartsY, uiW, uiH };
  }

  function hudSlotPos(i) {
    const h = hudBarOrigin();
    const col = i % HUD_COLS;
    const row = (i / HUD_COLS) | 0;
    return {
      x: h.x0 + col * (h.slot + h.gap) + h.slot / 2,
      y: h.y0 + row * (h.slot + h.rowGap) + h.slot / 2,
    };
  }

  function hudCoinPos() {
    const h = hudBarOrigin();
    return { x: h.x0 + MAX_HP * 8 + 14, y: h.heartsY + 3 };
  }

  function worldToUi(wx, wy) {
    return {
      x: ((wx - camera.x) * zoom) / SCALE_UI,
      y: ((wy - camera.y) * zoom) / SCALE_UI,
    };
  }

  function smoothstep(u) {
    u = Math.max(0, Math.min(1, u));
    return u * u * (3 - 2 * u);
  }

  function pickup(item) {
    if (!item || item.taken || player.dead > 0) return;
    const isCoin = item.id === "coin";
    if (!isCoin && !canTake(item.id)) return;
    const id = item.id;
    const from = worldToUi(item.x + 6, item.y + 6);
    pickupAnims.push({
      id,
      t: 0,
      fromX: from.x,
      fromY: from.y,
      slot: isCoin ? 0 : slotIndexFor(id),
      dest: isCoin ? "coins" : "slot",
      value: item.value | 0,
      pack: item.pack || 0,
    });
    item.taken = true;
  }

  function tryAutoPickup() {
    if (player.dead > 0 || uiBlocksPlay()) return;
    const mid = playerCenter();
    const rad = pickupRadius();
    for (let i = 0; i < loot.length; i++) {
      const item = loot[i];
      if (item.taken) continue;
      if ((item.scene || "island") !== scene) continue;
      if (item.drift) continue;
      if (item.ignoreUntil && time < item.ignoreUntil) continue;
      if (Math.hypot(item.x + 4 - mid.x, item.y + 4 - mid.y) >= rad) continue;
      if (item.id !== "coin" && !canTake(item.id)) continue;
      pickup(item);
    }
  }

  function updatePickup(dt) {
    let coinBatch = 0;
    let xpBatch = 0;
    let slotBatch = -1;
    for (let i = pickupAnims.length - 1; i >= 0; i--) {
      const a = pickupAnims[i];
      a.t += dt;
      const doneAt = a.style === "drop" ? 1.42 : 1.7;
      if (a.t < doneAt) continue;
      if (a.dest === "coins") coinBatch += a.value | 0;
      else if (a.dest !== "miss") {
        addToInventory(a.id);
        xpBatch += ITEM_DEFS[a.id].xp | 0;
        slotBatch = a.slot;
      }
      pickupAnims.splice(i, 1);
    }
    if (coinBatch > 0) {
      player.coins += coinBatch;
      playCoinClink();
      if (playMode === "normal") {
        const api = lbApi();
        if (api && api.noteNmEvent) {
          api.noteNmEvent("coins_earned", coinBatch);
          api.noteNmEvent("coins_high", player.coins);
        }
      }
      checkCoinSpeedEnd();
    }
    if (xpBatch > 0) {
      gainXp(xpBatch);
      playXpChime();
      if (slotBatch >= 0) heldSlot = slotBatch;
    }
  }

  function promptText() {
    if (nearCabinNpc()) {
      return holdingChest() ? "T OPENS YOUR CHEST" : "BRING A TREASURE CHEST";
    }
    if (chestTalk > 0) return "FIND A TREASURE MASTER TO OPEN";
    if (harborTalk > 0) return "CAN'T AFFORD";
    if (serpent) {
      if (cloakOn) return "SERPENT CONFUSED";
      if (serpent.phase === "breach") return "WAND — STRIKE!";
      return "STEER TO DODGE";
    }
    if (player.aboard && heldBaitId() && rod.phase === "idle") return "BAIT READY";
    if (!nearestLoot || nearestLoot.id === "coin") return "";
    const def = ITEM_DEFS[nearestLoot.id];
    if (!def || canTake(nearestLoot.id)) return "";
    return `CAN'T HOLD MORE ${def.name}`;
  }

  function updatePrompt() {}

  function ensureAudio() {
    if (audioCtx) {
      if (audioCtx.state === "suspended") audioCtx.resume();
      return;
    }
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return;
    audioCtx = new AC();
    setupOcean(audioCtx);
    if (audioCtx.state === "suspended") audioCtx.resume();
  }

  function makeNoiseBuffer(ctx, seconds, kind) {
    const n = Math.floor(ctx.sampleRate * seconds);
    const buf = ctx.createBuffer(1, n, ctx.sampleRate);
    const data = buf.getChannelData(0);
    let last = 0;
    for (let i = 0; i < n; i++) {
      const white = Math.random() * 2 - 1;
      if (kind === "brown") {
        last = (last + 0.02 * white) / 1.02;
        data[i] = last * 3.2;
      } else {
        last = last * 0.96 + white * 0.04;
        data[i] = last * 2.4;
      }
    }
    const fade = Math.floor(ctx.sampleRate * 0.02);
    for (let i = 0; i < fade; i++) {
      const a = i / fade;
      data[i] *= a;
      data[n - 1 - i] *= a;
    }
    return buf;
  }

  function setupOcean(ctx) {
    if (oceanReady) return;
    const master = ctx.createGain();
    master.gain.value = 0;
    oceanGain = master;
    master.connect(ctx.destination);

    function layer(kind, lpHz, lfoHz, mix, lfoDepth) {
      const src = ctx.createBufferSource();
      src.buffer = makeNoiseBuffer(ctx, 3.2, kind);
      src.loop = true;
      const lp = ctx.createBiquadFilter();
      lp.type = "lowpass";
      lp.frequency.value = lpHz;
      lp.Q.value = 0.65;
      const hp = ctx.createBiquadFilter();
      hp.type = "highpass";
      hp.frequency.value = 80;
      const amp = ctx.createGain();
      amp.gain.value = mix;
      const lfo = ctx.createOscillator();
      lfo.type = "sine";
      lfo.frequency.value = lfoHz;
      const lfoG = ctx.createGain();
      lfoG.gain.value = lfoDepth;
      lfo.connect(lfoG);
      lfoG.connect(amp.gain);
      src.connect(hp);
      hp.connect(lp);
      lp.connect(amp);
      amp.connect(master);
      src.start();
      lfo.start();
    }

    layer("brown", 520, 0.09, 0.42, 0.22);
    layer("pink", 1400, 0.16, 0.28, 0.18);
    oceanReady = true;
  }

  function oceanVolumeFromShore() {
    const feetY = player.y + player.h - 2;
    const shore = restShoreY(player.x + player.w / 2);
    const inland = shore - feetY;
    const wet = 22;
    const fade = 170;
    if (inland <= wet) return 1;
    if (inland >= wet + fade) return 0;
    return smoothstep(1 - (inland - wet) / fade);
  }

  function updateOcean() {
    if (!oceanGain || !audioCtx) return;
    const target = isIndoor() ? 0 : oceanVolumeFromShore() * 0.068;
    oceanGain.gain.setTargetAtTime(target, audioCtx.currentTime, 0.09);
  }

  function holdingShell() {
    const stack = inventory[heldSlot];
    return !!(stack && stack.id === "shell");
  }

  function killHorn() {
    if (!hornVoice) return;
    const v = hornVoice;
    hornVoice = null;
    if (!audioCtx) return;
    const t = audioCtx.currentTime;
    try {
      v.master.gain.cancelScheduledValues(t);
      v.master.gain.setValueAtTime(0.0001, t);
      v.oscs.forEach((o) => o.stop(t));
      v.vibrato.stop(t);
    } catch (err) {
      /* already stopped */
    }
  }

  function startHorn() {
    setLoudNoise(true);
    ensureAudio();
    if (!audioCtx) return;
    if (hornVoice && !hornVoice.released) return;
    if (hornVoice) killHorn();
    const t = audioCtx.currentTime;
    const master = audioCtx.createGain();
    master.gain.setValueAtTime(0.0001, t);
    master.gain.exponentialRampToValueAtTime(0.24, t + 0.18);
    const lp = audioCtx.createBiquadFilter();
    lp.type = "lowpass";
    lp.frequency.setValueAtTime(420, t);
    lp.frequency.exponentialRampToValueAtTime(820, t + 0.32);
    lp.Q.value = 0.85;
    lp.connect(master);
    master.connect(audioCtx.destination);
    const vibrato = audioCtx.createOscillator();
    vibrato.type = "sine";
    vibrato.frequency.value = 4.4;
    const vibG = audioCtx.createGain();
    vibG.gain.value = 2.1;
    vibrato.connect(vibG);
    const parts = [
      { f: 98, type: "sawtooth", mix: 0.58 },
      { f: 146.83, type: "sawtooth", mix: 0.3 },
      { f: 196, type: "triangle", mix: 0.22 },
      { f: 123.47, type: "sine", mix: 0.2 },
    ];
    const oscs = [];
    for (let i = 0; i < parts.length; i++) {
      const osc = audioCtx.createOscillator();
      osc.type = parts[i].type;
      osc.frequency.setValueAtTime(parts[i].f, t);
      vibG.connect(osc.frequency);
      const g = audioCtx.createGain();
      g.gain.value = parts[i].mix;
      osc.connect(g);
      g.connect(lp);
      osc.start(t);
      oscs.push(osc);
    }
    vibrato.start(t);
    hornVoice = { master, oscs, vibrato, startedAt: t, released: false };
  }

  function releaseHorn() {
    setLoudNoise(false);
    if (!hornVoice || hornVoice.released) return;
    hornVoice.released = true;
    if (!audioCtx) {
      hornVoice = null;
      return;
    }
    const t = audioCtx.currentTime;
    const fadeEnd = t + 0.05;
    const v = hornVoice;
    v.master.gain.cancelScheduledValues(t);
    const cur = Math.max(0.0001, v.master.gain.value);
    v.master.gain.setValueAtTime(cur, t);
    v.master.gain.exponentialRampToValueAtTime(0.0001, fadeEnd);
    v.oscs.forEach((o) => o.stop(fadeEnd + 0.02));
    v.vibrato.stop(fadeEnd + 0.02);
    v.oscs[0].onended = () => {
      if (hornVoice === v) hornVoice = null;
    };
  }

  function updateHorn() {
    if (guideOpen) {
      if (hornVoice || loudNoiseActive) releaseHorn();
      return;
    }
    if (keys[" "] && holdingShell() && player.dead <= 0) {
      startHorn();
      trySummonSerpent();
      return;
    }
    if (loudNoiseActive) setLoudNoise(false);
    if (hornVoice && !hornVoice.released) releaseHorn();
  }

  function clearWandBolts() {
    wandBolts.length = 0;
  }

  function endSerpentFight(reason) {
    if (!serpent) return;
    serpent = null;
    clearWandBolts();
    resumeDayClock();
    serpentCoolUntil = time + SERPENT_COOLDOWN;
    if (reason === "kill") {
      grantSerpentHeart();
    }
  }

  function grantSerpentHeart() {
    const id = "serpent_heart";
    const b = ownedBoat;
    const wx = b ? b.x + b.w / 2 : player.x + player.w / 2;
    const wy = b ? b.y + b.h / 2 : player.y;
    if (canTake(id)) {
      const from = worldToUi(wx, wy);
      pickupAnims.push({
        id,
        t: 0,
        fromX: from.x,
        fromY: from.y,
        slot: slotIndexFor(id),
        dest: "slot",
        value: 0,
      });
      return;
    }
    loot.push({
      id,
      x: wx - 4,
      y: wy - 4,
      taken: false,
      born: waveCycle,
      life: Infinity,
      ignoreUntil: time + 0.2,
      scene: "island",
    });
  }

  function trySummonSerpent() {
    if (serpent) return false;
    if (time < serpentCoolUntil) return false;
    if (scene !== "island" || !player.aboard || !ownedBoat || boatThrow) return false;
    if (player.dead > 0) return false;
    if (dockDistTiles() <= 8) return false;
    if (isPureNight(time)) return false;
    const b = ownedBoat;
    const cx = b.x + b.w / 2;
    const cy = b.y + b.h / 2;
    const ang = Math.random() * Math.PI * 2;
    const dist = 48 + Math.random() * 28;
    serpent = {
      hp: SERPENT_MAX_HP,
      phase: "intro",
      t: 0,
      x: cx + Math.cos(ang) * dist,
      y: cy + Math.sin(ang) * dist,
      ang: ang + Math.PI,
      hurt: 0,
      struck: false,
      waveT: 0,
      breachAng: ang + Math.PI,
      splashUp: false,
      splashDown: false,
      segs: [],
    };
    for (let i = 0; i < SERPENT_SEGMENTS; i++) {
      serpent.segs.push({ x: serpent.x, y: serpent.y });
    }
    clearWandBolts();
    pauseDayClock();
    if (rod.phase !== "idle") {
      rod.phase = "idle";
      rod.catchId = null;
      rod.tugLeft = 0;
      rodBaitId = null;
    }
    return true;
  }

  function toppleFromSerpent() {
    if (!player.aboard || !ownedBoat || !serpent || cloakOn) return;
    const b = ownedBoat;
    const side = Math.random() < 0.5 ? -1 : 1;
    player.aboard = false;
    player.x = b.x + b.w / 2 - player.w / 2 + side * 16;
    player.y = b.y + b.h - 2;
    player.inWater = true;
    player.submerged = 0.4;
    hurtPlayer();
    player.hurt = Math.max(player.hurt, 0.55);
    shake = Math.max(shake, 9);
    emitSplash(player.x + player.w / 2, player.y + player.h, 10);
    if (!serpent.splashDown) {
      serpent.splashDown = true;
      emitSplash(serpent.x, serpent.strikeY != null ? serpent.strikeY : serpent.y + 4, 12);
    }
    serpent.phase = "recover";
    serpent.t = 0;
    serpent.struck = true;
  }

  function serpentShouldFlee() {
    if (!serpent) return false;
    if (scene !== "island") return true;
    if (boatThrow) return true;
    if (!ownedBoat) return true;
    if (dockDistTiles() <= 3) return true;
    if (!player.aboard) {
      const bx = ownedBoat.x + ownedBoat.w / 2;
      const by = ownedBoat.y + ownedBoat.h / 2;
      const mid = playerCenter();
      if (Math.hypot(mid.x - bx, mid.y - by) > 70) return true;
      if (!player.inWater && !hitPad(player.x + 4, player.y + player.h - 2, walkPads)) {
        /* on land away from boat */
        if (Math.hypot(mid.x - bx, mid.y - by) > 36) return true;
      }
    }
    return false;
  }

  function updateSerpentSegs(headX, headY, ang, dt) {
    if (!serpent) return;
    const segs = serpent.segs;
    const spacing = SERPENT_SEG_SPACING;
    segs[0].x = headX;
    segs[0].y = headY;
    serpent.waveT += dt;
    const under = serpent.phase === "shadow" || serpent.phase === "intro" || serpent.phase === "recover";
    const waveAmp = under ? 3.4 : 1.8;
    const waveSpeed = under ? 5.2 : 6.4;
    for (let i = 1; i < segs.length; i++) {
      const prev = segs[i - 1];
      const seg = segs[i];
      let dx = seg.x - prev.x;
      let dy = seg.y - prev.y;
      let d = Math.hypot(dx, dy) || 1;
      const nx = dx / d;
      const ny = dy / d;
      const wave = Math.sin(serpent.waveT * waveSpeed - i * 0.78) * waveAmp * (0.35 + i * 0.12);
      const tx = prev.x + nx * spacing - ny * wave;
      const ty = prev.y + ny * spacing + nx * wave;
      const follow = 1 - Math.exp(-(11 - i * 0.4) * dt);
      seg.x += (tx - seg.x) * follow;
      seg.y += (ty - seg.y) * follow;
      dx = seg.x - prev.x;
      dy = seg.y - prev.y;
      d = Math.hypot(dx, dy) || 1;
      if (d > 0.01) {
        seg.x = prev.x + (dx / d) * spacing;
        seg.y = prev.y + (dy / d) * spacing;
      } else {
        seg.x = prev.x - Math.cos(ang) * spacing;
        seg.y = prev.y - Math.sin(ang) * spacing;
      }
    }
    serpent.x = segs[0].x;
    serpent.y = segs[0].y;
    serpent.ang = ang;
  }

  function serpentWanderAim(dt) {
    const sway = Math.sin(serpent.waveT * 1.7 + serpent.t * 2.2) * 1.1;
    const ang = serpent.ang + sway * dt * 2.4;
    const spd = 28;
    updateSerpentSegs(
      serpent.x + Math.cos(ang) * spd * dt,
      serpent.y + Math.sin(ang) * spd * dt,
      ang,
      dt
    );
  }

  function serpentMissStrike(bx, by) {
    const missAng = serpent.ang + (Math.random() < 0.5 ? 1 : -1) * (0.85 + Math.random() * 0.7);
    const missDist = 30 + Math.random() * 20;
    serpent.strikeX = bx + Math.cos(missAng) * missDist;
    serpent.strikeY = by + Math.sin(missAng) * missDist;
    serpent.breachAng = Math.atan2(serpent.strikeY - serpent.y, serpent.strikeX - serpent.x);
  }

  function updateSerpent(dt) {
    if (!serpent) return;
    if (serpent.hurt > 0) serpent.hurt = Math.max(0, serpent.hurt - dt);
    if (serpentShouldFlee()) {
      endSerpentFight("flee");
      return;
    }
    const b = ownedBoat;
    const bx = b.x + b.w / 2;
    const by = b.y + b.h / 2;
    const cloaked = cloakOn;
    serpent.t += dt;
    if (serpent.phase === "intro") {
      if (cloaked) {
        serpentWanderAim(dt);
        if (serpent.t > 1.1) {
          serpent.phase = "shadow";
          serpent.t = 0;
        }
        return;
      }
      const ang = Math.atan2(by - serpent.y, bx - serpent.x);
      const spd = 38;
      updateSerpentSegs(serpent.x + Math.cos(ang) * spd * dt, serpent.y + Math.sin(ang) * spd * dt, ang, dt);
      if (serpent.t > 1.1 || Math.hypot(serpent.x - bx, serpent.y - by) < 26) {
        serpent.phase = "shadow";
        serpent.t = 0;
      }
      return;
    }
    if (serpent.phase === "shadow") {
      if (cloaked) {
        serpentWanderAim(dt);
        if (serpent.t > 1.35) {
          serpent.phase = "breach";
          serpent.t = 0;
          serpent.struck = true;
          serpentMissStrike(bx, by);
          serpent.splashUp = false;
          serpent.splashDown = false;
        }
        return;
      }
      const orbit = 22 + Math.sin(serpent.t * 2.4) * 6;
      const wantAng = serpent.t * 1.55;
      const tx = bx + Math.cos(wantAng) * orbit;
      const ty = by + Math.sin(wantAng) * orbit * 0.72;
      const ang = Math.atan2(ty - serpent.y, tx - serpent.x);
      const spd = 55;
      updateSerpentSegs(serpent.x + Math.cos(ang) * spd * dt, serpent.y + Math.sin(ang) * spd * dt, ang, dt);
      if (serpent.t > 1.35) {
        serpent.phase = "breach";
        serpent.t = 0;
        serpent.struck = false;
        serpent.strikeX = bx;
        serpent.strikeY = by;
        serpent.breachAng = Math.atan2(by - serpent.y, bx - serpent.x);
        serpent.splashUp = false;
        serpent.splashDown = false;
      }
      return;
    }
    if (serpent.phase === "breach") {
      const u = Math.min(1, serpent.t / 0.42);
      const riseU = Math.min(1, serpent.t / 1.55);
      const rise = Math.sin(riseU * Math.PI);
      const ang = serpent.breachAng;
      const wantX = serpent.strikeX + Math.cos(ang + Math.PI) * (18 * (1 - u));
      const wantY = serpent.strikeY + Math.sin(ang + Math.PI) * (12 * (1 - u)) - rise * 14;
      const approach = 1 - Math.exp(-7.5 * dt);
      const hx = serpent.x + (wantX - serpent.x) * approach;
      const hy = serpent.y + (wantY - serpent.y) * approach;
      updateSerpentSegs(hx, hy, ang, dt);
      if (!serpent.splashUp && serpent.t > 0.04 && rise > 0.12) {
        serpent.splashUp = true;
        emitSplash(serpent.strikeX, serpent.strikeY, 14);
        emitSplash(serpent.strikeX + Math.cos(ang) * 4, serpent.strikeY + Math.sin(ang) * 3, 6);
      }
      if (!serpent.splashDown && serpent.t > 0.9 && rise < 0.55) {
        serpent.splashDown = true;
        emitSplash(serpent.x, serpent.strikeY, 13);
        emitSplash(serpent.strikeX, serpent.strikeY + 2, 5);
      }
      if (!serpent.struck && serpent.t > 0.28 && serpent.t < 1.15 && player.aboard && !cloaked) {
        if (Math.hypot(serpent.x - bx, serpent.y - by) < 16) {
          toppleFromSerpent();
          return;
        }
      }
      if (cloaked && !serpent.struck) serpent.struck = true;
      if (serpent.t > 1.55) {
        if (!serpent.splashDown) {
          serpent.splashDown = true;
          emitSplash(serpent.x, serpent.strikeY, 12);
        }
        serpent.phase = "recover";
        serpent.t = 0;
      }
      return;
    }
    if (serpent.phase === "recover") {
      if (cloaked) {
        serpentWanderAim(dt);
        if (serpent.t > 0.85) {
          serpent.phase = "shadow";
          serpent.t = 0;
          serpent.struck = false;
        }
        return;
      }
      const ang = Math.atan2(serpent.y - by, serpent.x - bx);
      const spd = 42;
      updateSerpentSegs(serpent.x + Math.cos(ang) * spd * dt, serpent.y + Math.sin(ang) * spd * dt, ang + Math.PI, dt);
      if (serpent.t > 0.85) {
        serpent.phase = "shadow";
        serpent.t = 0;
        serpent.struck = false;
      }
    }
  }

  function fireWandBolt() {
    if (player.dead > 0) return;
    if (wandCool > 0) return;
    wandCool = 0.48;
    const face = player.facing;
    const ox = player.x + player.w / 2 + face * 4;
    const oy = player.y + 3;
    wandBolts.push({
      x: ox,
      y: oy,
      vx: face * 210,
      vy: -12,
      life: 0.55,
      max: 0.55,
    });
    useFx = { t: 0, id: "wand" };
  }

  function hurtSerpent(amount) {
    if (!serpent || serpent.phase !== "breach") return false;
    serpent.hp -= amount | 0;
    serpent.hurt = 0.35;
    shake = Math.max(shake, 5);
    emitSplash(serpent.x, serpent.y + 4, 5);
    if (serpent.hp <= 0) {
      serpent.hp = 0;
      endSerpentFight("kill");
      return true;
    }
    return true;
  }

  function updateWandBolts(dt) {
    if (wandCool > 0) wandCool = Math.max(0, wandCool - dt);
    for (let i = wandBolts.length - 1; i >= 0; i--) {
      const p = wandBolts[i];
      p.life -= dt;
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      let hit = false;
      if (serpent && serpent.phase === "breach" && serpent.hurt <= 0.28) {
        for (let s = 0; s < Math.min(3, serpent.segs.length); s++) {
          const seg = serpent.segs[s];
          if (Math.hypot(p.x - seg.x, p.y - seg.y) < 10) {
            hurtSerpent(1);
            hit = true;
            break;
          }
        }
      }
      if (hit || p.life <= 0) wandBolts.splice(i, 1);
    }
  }

  function drawSerpent(cpos) {
    if (!serpent || scene !== "island") return;
    const under = serpent.phase === "shadow" || serpent.phase === "intro" || serpent.phase === "recover";
    const flash = serpent.hurt > 0 && ((time * 18) | 0) % 2 === 0;
    for (let i = serpent.segs.length - 1; i >= 0; i--) {
      const seg = serpent.segs[i];
      const x = (seg.x - cpos.x) | 0;
      const y = (seg.y - cpos.y) | 0;
      if (x < -20 || y < -20 || x > viewW + 20 || y > viewH + 20) continue;
      const r = i === 0 ? 4 : 3;
      if (under) {
        px(x - r, y - 1, r * 2 + 1, 3, "rgba(8, 18, 28, 0.55)");
        px(x - r + 1, y, r * 2 - 1, 1, "rgba(12, 28, 40, 0.4)");
        continue;
      }
      const body = flash ? "#f4f0e0" : i === 0 ? "#2f6a58" : "#1e4a40";
      const hi = flash ? "#ffffff" : "#4a9a7a";
      const edge = flash ? "#c04030" : "#0e2a24";
      px(x - r, y - r + 1, r * 2, r * 2 - 1, body);
      px(x - r + 1, y - r, r * 2 - 2, 1, hi);
      px(x - r, y + r - 1, r * 2, 1, edge);
      if (i === 0) {
        const fx = Math.cos(serpent.ang) | 0;
        const fy = Math.sin(serpent.ang) | 0;
        px(x + fx * 3, y + fy * 2 - 1, 2, 2, flash ? "#fff3c0" : "#c9e86a");
        px(x + fx * 2 - 1, y + fy - 2, 1, 1, "#1a1814");
        px(x + fx * 2 + 1, y + fy - 2, 1, 1, "#1a1814");
        px(x - fx * 2, y - 3, 2, 2, hi);
      }
    }
    if (!under && serpent.phase === "breach") {
      const hx = (serpent.x - cpos.x) | 0;
      const hy = (serpent.y - cpos.y + 6) | 0;
      px(hx - 6, hy, 12, 2, "rgba(220, 240, 255, 0.35)");
    }
  }

  function drawWandBolts(cpos) {
    for (let i = 0; i < wandBolts.length; i++) {
      const p = wandBolts[i];
      const x = (p.x - cpos.x) | 0;
      const y = (p.y - cpos.y) | 0;
      const a = Math.max(0.2, p.life / p.max);
      px(x - 1, y - 1, 3, 3, "#6a5088");
      px(x, y, 1, 1, "#f4e8ff");
      px(x - ((p.vx > 0 ? 1 : -1) * 2), y, 2, 1, a > 0.4 ? "#b890e0" : "#4a3428");
    }
  }

  function drawSerpentBossBar() {
    if (!serpent) return;
    const uiW = canvas.width / SCALE_UI;
    const w = 110;
    const h = 14;
    const x = ((uiW - w) / 2) | 0;
    const y = 6;
    px(x, y, w, h, "#2b1c12");
    px(x + 1, y + 1, w - 2, h - 2, "#5c3a21");
    px(x + 2, y + 2, w - 4, 4, "#3a2414");
    drawPixText("SEA SERPENT", (x + w / 2) | 0, y + 2, "#f3e2c4", "center");
    const inner = w - 6;
    const fill = Math.floor((inner * Math.max(0, serpent.hp)) / SERPENT_MAX_HP);
    px(x + 3, y + 8, inner, 3, "#1a120c");
    if (fill > 0) px(x + 3, y + 8, fill, 3, serpent.hurt > 0 ? "#f4a090" : "#2f6a58");
  }

  function playCoinClink() {
    ensureAudio();
    if (!audioCtx) return;
    const t = audioCtx.currentTime;
    const notes = [1568, 2093];
    for (let i = 0; i < notes.length; i++) {
      const st = t + i * 0.03;
      const osc = audioCtx.createOscillator();
      osc.type = i ? "triangle" : "sine";
      osc.frequency.setValueAtTime(notes[i], st);
      const g = audioCtx.createGain();
      g.gain.setValueAtTime(0.0001, st);
      g.gain.exponentialRampToValueAtTime(0.07, st + 0.012);
      g.gain.exponentialRampToValueAtTime(0.0001, st + 0.14);
      osc.connect(g);
      g.connect(audioCtx.destination);
      osc.start(st);
      osc.stop(st + 0.16);
    }
  }

  function playXpChime() {
    ensureAudio();
    if (!audioCtx) return;
    const t = audioCtx.currentTime;
    const notes = [988, 1318, 1760];
    for (let i = 0; i < notes.length; i++) {
      const st = t + i * 0.04;
      const osc = audioCtx.createOscillator();
      osc.type = "sine";
      osc.frequency.setValueAtTime(notes[i], st);
      const g = audioCtx.createGain();
      g.gain.setValueAtTime(0.0001, st);
      g.gain.exponentialRampToValueAtTime(0.055, st + 0.018);
      g.gain.exponentialRampToValueAtTime(0.0001, st + 0.2);
      osc.connect(g);
      g.connect(audioCtx.destination);
      osc.start(st);
      osc.stop(st + 0.22);
    }
  }

  function tileAtWorld(px, py) {
    const c = Math.floor(px / TILE);
    const r = Math.floor(py / TILE);
    return tileType(c, r);
  }

  function findDropPos(id) {
    const beach = id === "shell" || id === "gem" || id === "crystal" || id === "jelly";
    const facing = player.facing;
    const cx = player.x + player.w / 2;
    const cy = player.y + player.h - 6;
    const spots = [];
    for (let d = 18; d <= 34; d += 4) {
      spots.push([cx + facing * d, cy]);
      spots.push([cx + facing * d, cy - 8]);
      spots.push([cx + facing * d, cy + 6]);
    }
    for (let n = 10; n <= 44; n += 6) {
      spots.push([cx + facing * 14, cy - n]);
      spots.push([cx, cy - n]);
    }
    function ok(x, y) {
      if (isIndoor()) {
        return canStand(x, y) && canStand(x + 4, y + 4);
      }
      if (x < 4 || y < 4 || x > WORLD_W - 10 || y > WORLD_H - 10) return false;
      if (hitPad(x, y, walkPads)) return true;
      if (y >= restShoreY(x) - 3 || inRiverWater(x, y) || y < northCliffY(x) + 4) return false;
      if (beach) return isSandAt(x, y);
      const t = tileAtWorld(x, y);
      return t === TILES.SAND || t === TILES.DIRT || t === TILES.GRASS;
    }
    for (const [x, y] of spots) {
      if (ok(x, y)) return { x: x - 4, y: y - 4 };
    }
    if (isIndoor()) return { x: cx + facing * 12 - 4, y: cy - 4 };
    return { x: cx + facing * 20 - 4, y: Math.min(cy, restShoreY(cx) - 12) - 4 };
  }

  function keeperNpc() {
    for (let i = 0; i < npcs.length; i++) {
      if (npcs[i].kind === "keeper") return npcs[i];
    }
    return null;
  }

  function fisherNpc() {
    for (let i = 0; i < npcs.length; i++) {
      if (npcs[i].kind === "fisher") return npcs[i];
    }
    return null;
  }

  function traderNpc() {
    if (scene === "fish") return fisherNpc();
    if (scene === "shop") return keeperNpc();
    return null;
  }

  function tradeValueFor(id) {
    if (scene === "fish") return FISH_TRADE[id] || 0;
    if (scene === "shop") return GEM_TRADE[id] || 0;
    return 0;
  }

  function nearShopkeeper(px, py) {
    const k = traderNpc();
    if (!k || !isIndoor()) return false;
    const kx = k.x + 3;
    const ky = k.y + 2;
    if (Math.hypot(px - kx, py - ky) < 34) return true;
    const mid = playerCenter();
    return Math.hypot(mid.x - kx, mid.y - ky) < 36 && py < k.y + 30;
  }

  function spawnTradeCoins(amount) {
    const k = traderNpc();
    const hx = k ? k.x + 8 : indoorW() / 2;
    const hy = k ? k.y - 10 : 36;
    const n = amount >= 20 ? 3 : amount >= 5 ? 2 : 1;
    const pack = tradePackSeq++;
    const share = Math.floor(amount / n);
    let left = amount;
    for (let i = 0; i < n; i++) {
      const value = i === n - 1 ? left : share;
      left -= value;
      const ox = hx + i * 2 - 1;
      const oy = hy + (i % 2);
      loot.push({
        id: "coin",
        value,
        x: ox,
        y: oy,
        taken: false,
        born: waveCycle,
        life: Infinity,
        ignoreUntil: Infinity,
        scene,
        drift: true,
        flight: 0,
        flightDur: 0.78 + i * 0.12 + Math.random() * 0.14,
        ox,
        oy,
        arc: 7 + i * 3 + Math.random() * 4,
        side: i === 1 ? -1 : 1,
        pack,
      });
    }
  }

  function settleTradeCoinPack(pack) {
    let pending = false;
    let total = 0;
    let lead = null;
    for (const other of loot) {
      if (other.taken || other.pack !== pack) continue;
      if (other.drift) pending = true;
      total += other.value | 0;
      if (!lead) lead = other;
    }
    if (pending || !lead) return;
    for (const other of loot) {
      if (other.taken || other.pack !== pack) continue;
      if (other !== lead) other.taken = true;
    }
    lead.value = total;
    lead.x = player.x + player.w / 2 - 3;
    lead.y = player.y + 2;
    lead.ignoreUntil = 0;
  }

  function updateTradeCoinDrift(dt) {
    if (!isIndoor()) return;
    const mid = playerCenter();
    const tx = mid.x - 3;
    const ty = player.y + 2;
    for (const item of loot) {
      if (item.taken || item.id !== "coin" || item.pack == null) continue;
      if ((item.scene || "island") !== scene) continue;
      if (!item.drift) {
        if (item.ignoreUntil === Infinity) {
          item.x = tx;
          item.y = ty;
        }
        continue;
      }
      item.flight += dt;
      if (item.spill && !item.spilled) {
        const su = Math.min(1, item.flight / item.spill);
        item.x = item.ox + (item.side || 0) * su * 12;
        item.y = item.oy + (item.drop || 0) * su * 5 - Math.sin(su * Math.PI) * 7;
        if (su >= 1) {
          item.spilled = true;
          item.ox = item.x;
          item.oy = item.y;
          item.flight = 0;
        }
        continue;
      }
      const u = Math.min(1, item.flight / item.flightDur);
      const ease = u * u * (3 - 2 * u);
      const lift = Math.sin(u * Math.PI) * item.arc;
      const sway = Math.sin(u * Math.PI) * 5 * (item.side || 0);
      item.x = item.ox + (tx - item.ox) * ease + sway;
      item.y = item.oy + (ty - item.oy) * ease - lift;
      const near =
        u > 0.62 && Math.hypot(item.x + 3 - mid.x, item.y + 3 - mid.y) < pickupRadius();
      if (u >= 1 || near) {
        item.drift = false;
        item.x = tx;
        item.y = ty;
        settleTradeCoinPack(item.pack);
      }
    }
  }

  function beginShopTrade(id) {
    const value = tradeValueFor(id) | 0;
    if (value <= 0) return;
    const dur = 1 + Math.random();
    shopSales.push({ value, t: 0, dur });
    shopTrade.phase = "think";
    shopTrade.id = id;
    shopTrade.value = value;
    shopTrade.refuse = 0;
    if (shopTrade.t <= 0) shopTrade.dur = dur;
  }

  function updateShopTrade(dt) {
    if (shopTrade.refuse > 0) shopTrade.refuse = Math.max(0, shopTrade.refuse - dt);
    if (!shopSales.length) {
      if (shopTrade.phase === "think") {
        shopTrade.phase = "idle";
        shopTrade.t = 0;
      }
      return;
    }
    shopTrade.phase = "think";
    shopTrade.t += dt;
    for (let i = shopSales.length - 1; i >= 0; i--) {
      const sale = shopSales[i];
      sale.t += dt;
      if (sale.t < sale.dur) continue;
      spawnTradeCoins(sale.value);
      shopSales.splice(i, 1);
    }
    if (!shopSales.length) {
      shopTrade.phase = "idle";
      shopTrade.t = 0;
    }
  }

  function ownsItem(id) {
    for (let i = 0; i < inventory.length; i++) {
      if (inventory[i] && inventory[i].id === id) return true;
    }
    return false;
  }

  function emptySlots() {
    let n = 0;
    for (let i = 0; i < inventory.length; i++) if (!inventory[i]) n++;
    return n;
  }

  function cabinNpc() {
    for (let i = 0; i < npcs.length; i++) {
      if (npcs[i].kind === "warden") return npcs[i];
    }
    return null;
  }

  function nearCabinNpc() {
    if (scene !== "cabin" || cabinCut.kind || fadeMode || guideOpen) return false;
    const n = cabinNpc();
    if (!n) return false;
    const mid = playerCenter();
    return Math.hypot(mid.x - (n.x + 4), mid.y - (n.y - 6)) < 36;
  }

  function holdingChest() {
    const stack = inventory[heldSlot];
    return !!(stack && stack.id === "chest" && stack.count > 0);
  }

  function consumeHeldChest() {
    const stack = inventory[heldSlot];
    if (!stack || stack.id !== "chest") return false;
    stack.count -= 1;
    if (stack.count <= 0) inventory[heldSlot] = null;
    return true;
  }

  /** Trade a held chest with the cabin master: 50/50 classic coins or magic gear. */
  function tryCabinChestTrade() {
    if (player.dead > 0 || fadeMode || cabinCut.kind || !nearCabinNpc()) return false;
    if (!holdingChest()) {
      chestTalk = 2.4;
      return true;
    }
    if (!consumeHeldChest()) return false;
    if (playMode === "normal") {
      const api = lbApi();
      if (api && api.noteNmEvent) api.noteNmEvent("chests", 1);
    }
    startCabinCut(Math.random() < 0.5 ? "classic" : "magic");
    return true;
  }

  function spawnCabinCoins(amount, hx, hy, pack) {
    const n = 7;
    const share = Math.floor(amount / n);
    let left = amount;
    for (let i = 0; i < n; i++) {
      const value = i === n - 1 ? left : share;
      left -= value;
      const ox = hx + (i - 3) * 2;
      const oy = hy + (i % 3);
      loot.push({
        id: "coin",
        value,
        x: ox,
        y: oy,
        taken: false,
        born: waveCycle,
        life: Infinity,
        ignoreUntil: Infinity,
        scene,
        drift: true,
        flight: 0,
        flightDur: 0.78 + i * 0.06,
        spill: 0.34,
        spilled: false,
        ox,
        oy,
        arc: 8 + (i % 3) * 3,
        side: i - 3,
        drop: (i % 2 ? 1 : -1) * ((i % 3) + 1),
        pack,
      });
    }
  }

  function cabinPayoutDone(pack) {
    for (let i = 0; i < loot.length; i++) {
      const item = loot[i];
      if (!item.taken && item.pack === pack) return false;
    }
    for (let i = 0; i < pickupAnims.length; i++) {
      if (pickupAnims[i].pack === pack) return false;
    }
    return true;
  }

  function beginMagicDrops() {
    const ids = ["wand", "cloak"];
    for (let i = 0; i < ids.length; i++) {
      const id = ids[i];
      const fits = canTake(id);
      const from = worldToUi(player.x + player.w / 2 + (i === 0 ? -7 : 7), player.y - 22);
      pickupAnims.push({
        id,
        t: 0,
        fromX: from.x,
        fromY: from.y,
        slot: fits ? slotIndexFor(id) : 0,
        dest: fits ? "slot" : "miss",
        value: 0,
        style: "drop",
        pack: 0,
      });
    }
  }

  function startCabinCut(kind) {
    if (cabinCut.kind || fadeMode) return;
    cabinCut.kind = kind;
    cabinCut.t = 0;
    cabinCut.value = kind === "classic" ? irand(100, 500) : 0;
    cabinCut.pack = 0;
    cabinCut.spawned = false;
    cabinCut.granted = false;
    cabinCut.lid = 0;
    cabinCut.mode = "open";
  }

  /** Brief cheeky blowfish gag; freezes input like cabin cuts (~2s). */
  function startBlowfishCut() {
    if (cabinCut.kind || fadeMode) return;
    cabinCut.kind = "blowfish";
    cabinCut.t = 0;
    cabinCut.value = 0;
    cabinCut.pack = 0;
    cabinCut.spawned = false;
    cabinCut.granted = false;
    cabinCut.lid = 0;
    cabinCut.mode = "open";
  }

  function scheduleBlowfishSpeedEnd(delaySec) {
    if (playMode !== "speedrun" || srCat !== "blowfish") return;
    if (!srTiming || uiScreen === "finish") return;
    srBlowfishFinishT = Math.max(0, delaySec);
  }

  function updateBlowfishSpeedEnd(dt) {
    if (srBlowfishFinishT < 0) return;
    if (playMode !== "speedrun" || srCat !== "blowfish" || uiScreen === "finish") {
      srBlowfishFinishT = -1;
      return;
    }
    srBlowfishFinishT -= dt;
    if (srBlowfishFinishT <= 0) {
      srBlowfishFinishT = -1;
      if (srTiming) finishSpeedrun();
    }
  }

  function updateCabinCut(dt) {
    if (!cabinCut.kind) return;
    cabinCut.t += dt;
    if (cabinCut.kind === "blowfish") {
      if (cabinCut.t >= 2.05) {
        cabinCut.kind = "";
        // Blowfish% ends 1s after the gag cutscene finishes.
        scheduleBlowfishSpeedEnd(1);
      }
      return;
    }
    if (cabinCut.kind === "classic") {
      if (cabinCut.mode === "open") {
        const creak = 0.46;
        cabinCut.lid = cabinCut.t <= creak ? 0 : Math.min(1, (cabinCut.t - creak) / 0.64);
        if (cabinCut.lid >= 1 && !cabinCut.spawned) {
          cabinCut.pack = tradePackSeq++;
          spawnCabinCoins(cabinCut.value, cabinChestX + 4, cabinChestY + 2, cabinCut.pack);
          cabinCut.spawned = true;
          cabinCut.mode = "wait";
        }
      } else if (cabinCut.mode === "wait") {
        if (cabinPayoutDone(cabinCut.pack)) {
          cabinCut.mode = "close";
          cabinCut.t = 0;
        }
      } else {
        cabinCut.lid = Math.max(0, 1 - cabinCut.t / 0.42);
        if (cabinCut.t >= 0.48) cabinCut.kind = "";
      }
      return;
    }
    const u = cabinCut.t;
    if (u < 0.42) cabinCut.lid = 0;
    else if (u < 1.12) cabinCut.lid = (u - 0.42) / 0.7;
    else if (u < 3.55) cabinCut.lid = 1;
    else cabinCut.lid = Math.max(0, 1 - (u - 3.55) / 0.42);
    if (!cabinCut.spawned && u >= 3.2) {
      cabinCut.spawned = true;
      beginMagicDrops();
    }
    if (u >= 4.85) {
      let falling = false;
      for (let i = 0; i < pickupAnims.length; i++) {
        if (pickupAnims[i].style === "drop") falling = true;
      }
      if (!falling) cabinCut.kind = "";
    }
  }

  function seedCabinFish() {
    cabinFish.length = 0;
    for (let p = 0; p < cabinPanes.length; p++) {
      const pane = cabinPanes[p];
      const n = p === 0 ? 6 : 3;
      for (let i = 0; i < n; i++) {
        cabinFish.push({
          pane: p,
          id: CABIN_KINDS[(p * 5 + i * 3) % CABIN_KINDS.length],
          x: pane.x + 2 + ((i * 23) % Math.max(4, pane.w - 8)),
          y: pane.y + 2 + ((i * 7) % Math.max(4, pane.h - 6)),
          dir: i & 1 ? 1 : -1,
          bob: rand(0, 6.2),
          speed: p === 0 ? rand(4.2, 6.4) : rand(2.4, 3.6),
        });
      }
    }
  }

  function updateCabinFish(dt) {
    for (let i = 0; i < cabinFish.length; i++) {
      const f = cabinFish[i];
      const pane = cabinPanes[f.pane];
      f.bob += dt * 0.7;
      f.x += f.dir * f.speed * dt;
      f.y += Math.sin(f.bob) * f.speed * 0.45 * dt;
      if (f.x < pane.x + 1 || f.x > pane.x + pane.w - 8) {
        f.dir *= -1;
        f.x = Math.max(pane.x + 1, Math.min(pane.x + pane.w - 8, f.x));
      }
      if (f.y < pane.y + 1) f.y = pane.y + 1;
      if (f.y > pane.y + pane.h - 6) f.y = pane.y + pane.h - 6;
    }
  }

  function harborNpc() {
    for (let i = 0; i < npcs.length; i++) {
      if (npcs[i].kind === "harbor") return npcs[i];
    }
    return null;
  }

  function nearHarbor(px, py) {
    if (scene !== "island") return false;
    for (let i = 0; i < npcs.length; i++) {
      const n = npcs[i];
      if (n.kind !== "harbor" && n.kind !== "sailor") continue;
      if (Math.hypot(px - (n.x + 3), py - (n.y + 2)) < 32) return true;
    }
    return false;
  }

  function canBoatAt(px, py) {
    if (px < 2 || py < 2 || px >= WORLD_W - 2 || py >= WORLD_H - 2) return false;
    if (isSolidPoint(px, py)) return false;
    if (landPresent(px) && py < northCliffY(px)) return false;
    for (let i = 0; i < boats.length; i++) {
      const b = boats[i];
      if (px >= b.x && px < b.x + b.w && py >= b.y && py < b.y + b.h) return false;
    }
    // Planks stay solid for feet. The hull sails in the water under them.
    const underPlank = hitPad(px, py, dockWood);
    if (!underPlank && hitPad(px, py, walkPads)) return false;
    if (inRiverWater(px, py)) return true;
    return !onIslandLand(px, py);
  }

  function skiffUnderDock(b) {
    if (!b || boatThrow || !b.landed) return false;
    for (let i = 0; i < dockWood.length; i++) {
      const r = dockWood[i];
      const x0 = Math.max(b.x, r.x);
      const y0 = Math.max(b.y, r.y);
      const x1 = Math.min(b.x + b.w, r.x + r.w);
      const y1 = Math.min(b.y + b.h, r.y + r.h);
      if (x1 - x0 < 2 || y1 - y0 < 2) continue;
      const cx = (x0 + x1) / 2;
      const cy = (y0 + y1) / 2;
      if (inRiverWater(cx, cy) || !onIslandLand(cx, cy)) return true;
    }
    return false;
  }

  function boatHullOk(x, y, w, h) {
    const pts = [
      [x + 2, y + 3],
      [x + w - 2, y + 3],
      [x + 2, y + h - 1],
      [x + w - 2, y + h - 1],
      [x + w / 2, y + h - 1],
    ];
    return pts.every(([px, py]) => canBoatAt(px, py));
  }

  function emitBoatWake(b, dt) {
    const spd = Math.hypot(b.vx || 0, b.vy || 0);
    if (spd < 12) return;
    b.wakeT = (b.wakeT || 0) + dt;
    if (b.wakeT < 0.045) return;
    b.wakeT = 0;
    const ang = Math.atan2(b.vy || 0, b.vx || 1);
    const bx = b.x + b.w / 2 - Math.cos(ang) * (b.w * 0.45);
    const by = b.y + b.h - 1 - Math.sin(ang) * 2;
    let k = 0;
    const n = spd > 70 ? 3 : 2;
    for (let i = 0; i < MAX_SPLASH && k < n; i++) {
      const p = splashes[i];
      if (p.life > 0) continue;
      p.x = bx + rand(-2.5, 2.5);
      p.y = by + rand(-1, 1);
      p.vx = -Math.cos(ang) * rand(8, 18) + rand(-10, 10);
      p.vy = -Math.sin(ang) * rand(6, 14) + rand(-6, 6);
      p.life = rand(0.18, 0.38);
      p.max = p.life;
      p.col = Math.random() > 0.5 ? "#e8f6ff" : "#ffffff";
      p.fish = false;
      k++;
    }
  }

  function skiffBob(b, t) {
    return b.landed && !boatThrow ? Math.sin((t == null ? time : t) * 1.8 + (b.phase || 0)) * 1.15 : 0;
  }

  function seatPlayerOnBoat() {
    if (!ownedBoat) return;
    const bob = skiffBob(ownedBoat, time);
    const b = ownedBoat;
    player.x = b.x + (b.w - player.w) / 2;
    // 8×14 sprite. Feet pivot is y+13; seated legs are one pixel lower.
    // Lap sits in the cockpit; legs rest on the keel, not under the boat.
    player.y = b.y + bob - 6;
  }

  function tryStepOffBoat(ox, oy) {
    if (!player.aboard || !ownedBoat) return false;
    const x = player.x + ox;
    const y = player.y + oy;
    if (canStand(x, y) && canStand(x + 4, y + 6) && !isWaterAt(x + 2, y + 8)) {
      player.aboard = false;
      player.x = x;
      player.y = y;
      player.inWater = false;
      player.submerged = 0;
      return true;
    }
    return false;
  }

  function steerOwnedBoat(dt, dx, dy) {
    const b = ownedBoat;
    if (!b || boatThrow) return;
    const moving = dx !== 0 || dy !== 0;
    player.moving = moving;
    const len = Math.hypot(dx, dy) || 1;
    const acc = 140;
    if (moving) {
      b.vx = (b.vx || 0) + (dx / len) * acc * dt;
      b.vy = (b.vy || 0) + (dy / len) * acc * dt;
      if (dx !== 0) player.facing = dx > 0 ? 1 : -1;
      b.face = player.facing;
    }
    b.vx = (b.vx || 0) * (1 - Math.min(1, dt * 2.4));
    b.vy = (b.vy || 0) * (1 - Math.min(1, dt * 2.4));
    const spd = Math.hypot(b.vx, b.vy);
    const max = 110;
    if (spd > max) {
      b.vx *= max / spd;
      b.vy *= max / spd;
    }
    const nx = b.x + b.vx * dt;
    const ny = b.y + b.vy * dt;
    if (boatHullOk(nx, b.y, b.w, b.h)) b.x = nx;
    else {
      b.vx *= 0.2;
      if (moving) tryStepOffBoat(Math.sign(dx) * 12, 0);
    }
    if (boatHullOk(b.x, ny, b.w, b.h)) b.y = ny;
    else {
      b.vy *= 0.2;
      if (moving) tryStepOffBoat(0, Math.sign(dy) * 10);
    }
    b.tilt += (((b.vx || 0) / max) * 0.22 - b.tilt) * Math.min(1, dt * 8);
    emitBoatWake(b, dt);
    if (player.aboard) seatPlayerOnBoat();
  }

  function startBoatThrow() {
    const n = harborNpc();
    const landX = harborDrop ? harborDrop.x : (n ? n.x : 400) + 18;
    const landY = harborDrop ? harborDrop.y : restShoreY(n ? n.x : RIVER_X0) + 34;
    ownedBoat = {
      x: (n ? n.x : landX) - 4,
      y: (n ? n.y : landY) - 24,
      w: 22,
      h: 10,
      vx: 0,
      vy: 0,
      tilt: 0,
      phase: rand(0, 6),
      face: 1,
      kind: "skiff",
      landed: false,
    };
    boatThrow = {
      t: 0,
      dur: 0.95,
      x0: ownedBoat.x,
      y0: ownedBoat.y - 28,
      x1: landX,
      y1: landY,
    };
    player.aboard = false;
  }

  function updateBoatThrow(dt) {
    if (harborTalk > 0) harborTalk = Math.max(0, harborTalk - dt);
    if (!boatThrow || !ownedBoat) return;
    boatThrow.t += dt;
    const u = Math.min(1, boatThrow.t / boatThrow.dur);
    const ease = u * u * (3 - 2 * u);
    const lift = Math.sin(u * Math.PI) * 36;
    ownedBoat.x = boatThrow.x0 + (boatThrow.x1 - boatThrow.x0) * ease;
    ownedBoat.y = boatThrow.y0 + (boatThrow.y1 - boatThrow.y0) * ease - lift;
    ownedBoat.tilt = Math.sin(u * Math.PI * 2) * 0.18;
    if (u >= 1) {
      ownedBoat.x = boatThrow.x1;
      ownedBoat.y = boatThrow.y1;
      ownedBoat.landed = true;
      ownedBoat.tilt = 0;
      boatThrow = null;
      emitSplash(ownedBoat.x + ownedBoat.w / 2, ownedBoat.y + ownedBoat.h, 8);
    }
  }

  function tryHarborDeal() {
    if (scene !== "island" || player.aboard) return false;
    const mid = playerCenter();
    if (!nearHarbor(mid.x, mid.y)) return false;
    if (ownedBoat || boatThrow) return false;
    if (player.coins < BOAT_PRICE) {
      harborTalk = 1.35;
      return true;
    }
    player.coins -= BOAT_PRICE;
    srBoughtBoat = true;
    startBoatThrow();
    return true;
  }

  function tryBoatToggle() {
    if (scene !== "island" || !ownedBoat || boatThrow) return false;
    const mid = playerCenter();
    if (player.aboard) {
      const spots = [
        [ownedBoat.x - 10, ownedBoat.y - 2],
        [ownedBoat.x + ownedBoat.w + 2, ownedBoat.y - 2],
        [ownedBoat.x + 4, ownedBoat.y - 12],
        [ownedBoat.x + 4, ownedBoat.y + ownedBoat.h + 2],
      ];
      for (let i = 0; i < spots.length; i++) {
        const x = spots[i][0];
        const y = spots[i][1];
        if (canStand(x, y) && canStand(x + 4, y + 6) && !isWaterAt(x + 2, y + 8)) {
          player.aboard = false;
          player.x = x;
          player.y = y;
          player.inWater = false;
          player.submerged = 0;
          return true;
        }
      }
      return true;
    }
    const bx = ownedBoat.x + ownedBoat.w / 2;
    const by = ownedBoat.y + ownedBoat.h / 2;
    if (Math.hypot(mid.x - bx, mid.y - by) < 22) {
      player.aboard = true;
      seatPlayerOnBoat();
      player.inWater = false;
      player.submerged = 0;
      checkBoatSpeedEnd();
      return true;
    }
    return false;
  }

  function onEnter() {
    if (player.dead > 0) return;
    if (isIndoor()) {
      dropHeld();
      return;
    }
    if (tryHarborDeal()) return;
    if (tryBoatToggle()) return;
    dropHeld();
  }

  function tryTradeKey() {
    if (player.dead > 0 || fadeMode) return;
    if (tryCabinChestTrade()) return;
    const mid = playerCenter();
    if (tryHarborDeal()) return;
    const k = traderNpc();
    if (!k) return;
    if (Math.hypot(mid.x - (k.x + 3), mid.y - (k.y + 2)) > 40 && !nearShopkeeper(mid.x, mid.y)) return;
    const stack = inventory[heldSlot];
    if (!stack) return;
    if (!tradeValueFor(stack.id)) {
      shopTrade.refuse = 0.7;
      return;
    }
    const id = stack.id;
    stack.count -= 1;
    if (stack.count <= 0) inventory[heldSlot] = null;
    beginShopTrade(id);
  }

  function boatIsStill() {
    if (!ownedBoat || !player.aboard || boatThrow) return false;
    if (player.moving) return false;
    return Math.hypot(ownedBoat.vx || 0, ownedBoat.vy || 0) < 10;
  }

  function distToRect(px, py, r) {
    const dx = Math.max(r.x - px, 0, px - (r.x + r.w));
    const dy = Math.max(r.y - py, 0, py - (r.y + r.h));
    return Math.hypot(dx, dy);
  }

  function dockDistTiles() {
    const b = ownedBoat;
    if (!b || !dockWood.length) return 99;
    const cx = b.x + b.w / 2;
    const cy = b.y + b.h / 2;
    let best = Infinity;
    for (let i = 0; i < dockWood.length; i++) {
      const d = distToRect(cx, cy, dockWood[i]);
      if (d < best) best = d;
    }
    return best / TILE;
  }

  function fishBand() {
    const tiles = dockDistTiles();
    // Distance only changes tier odds (legend/rare/common). Within a tier every fish is equal.
    const good = { bite: 0.86, legend: 0, rare: 0.24 };
    const ehhh = { bite: 0.36, legend: 0.012, rare: 0.07 };
    const far = { bite: 0.62, legend: 0.58, rare: 0.18 };
    if (tiles <= 2) return good;
    if (tiles <= 4) return ehhh;
    if (tiles >= 12) return far;
    const u = (tiles - 4) / 8;
    return {
      bite: ehhh.bite + (far.bite - ehhh.bite) * u,
      legend: ehhh.legend + (far.legend - ehhh.legend) * u,
      rare: ehhh.rare + (far.rare - ehhh.rare) * u,
    };
  }

  function heldStackId() {
    const stack = inventory[heldSlot];
    return stack && stack.count > 0 ? stack.id : null;
  }

  function heldBaitId() {
    const id = heldStackId();
    return id && BAIT_IDS[id] ? id : null;
  }

  function baitBoostBand(band) {
    let legend = band.legend * 1.25;
    let rare = band.rare * 1.5;
    const sum = legend + rare;
    if (sum > 0.95) {
      legend = (legend / sum) * 0.95;
      rare = (rare / sum) * 0.95;
    }
    return { bite: band.bite, legend, rare };
  }

  function pickEqual(list) {
    if (!list || !list.length) return null;
    return list[irand(0, list.length - 1)];
  }

  function consumeRodBait() {
    const id = rodBaitId;
    rodBaitId = null;
    if (!id) return;
    if (inventory[heldSlot] && inventory[heldSlot].id === id) {
      inventory[heldSlot].count -= 1;
      if (inventory[heldSlot].count <= 0) inventory[heldSlot] = null;
      return;
    }
    for (let i = 0; i < inventory.length; i++) {
      const s = inventory[i];
      if (!s || s.id !== id) continue;
      s.count -= 1;
      if (s.count <= 0) inventory[i] = null;
      return;
    }
  }

  /**
   * Super-legendaries: each species rolls independently at 1/den (×1.10 with good bait).
   * If several hit the same cast, pick one at random so list order doesn't favor gold jelly.
   */
  function rollSuperLegend(goodBait) {
    const mult = goodBait ? 1.1 : 1;
    const hits = [];
    for (let i = 0; i < CATCH_SUPER.length; i++) {
      const row = CATCH_SUPER[i];
      if (Math.random() < mult / row.den) hits.push(row.id);
    }
    return pickEqual(hits);
  }

  function rollBandCatch(goodBait) {
    let band = fishBand();
    if (goodBait) band = baitBoostBand(band);
    const r = Math.random();
    let id;
    if (r < band.legend) id = pickEqual(CATCH_LEGEND);
    else if (r < band.legend + band.rare) id = pickEqual(CATCH_RARE);
    else id = pickEqual(CATCH_COMMON);
    const superId = rollSuperLegend(goodBait);
    return superId || id;
  }

  function rollBoatCatch() {
    const held = heldStackId();
    rodBaitId = null;
    // 1) Heart of the Sea held → guaranteed blowfish (not consumed)
    if (held === "serpent_heart") return "blowfish";
    // 2–3) Shark / mini-shark held → megalodon bait (consumed only if mega lands)
    if (held && MEGA_BAIT[held] != null) {
      rodBaitId = held;
      if (Math.random() < MEGA_BAIT[held]) return "megalodon";
      return rollBandCatch(false);
    }
    // 4) Normal band + super-legend; common bait boosts legend/rare and +10% super
    const bait = held && BAIT_IDS[held] ? held : null;
    rodBaitId = bait;
    return rollBandCatch(!!bait);
  }

  function tryCastRod() {
    if (serpent) return;
    if (scene !== "island" || !player.aboard || !ownedBoat || boatThrow) return;
    if (rod.phase !== "idle" || pickupAnims.length || player.dead > 0) return;
    if (!boatIsStill()) return;
    rod.phase = "wait";
    rod.t = 0;
    rod.bit = false;
    rod.wait = 15;
    rod.face = player.facing;
    rod.catchId = rollBoatCatch();
    rod.tugLeft = 0;
    rod.tugDx = 0;
    rod.tugDy = 0;
    rod.tugCool = 0;
    fishCastT = rod.wait + 0.5;
  }

  function hullInOpenWater(x, y, w, h) {
    const pts = [
      [x + 2, y + 2],
      [x + w - 3, y + 2],
      [x + w * 0.5, y + 3],
      [x + 2, y + h - 2],
      [x + w - 3, y + h - 2],
      [x + w * 0.5, y + h - 2],
    ];
    for (let i = 0; i < pts.length; i++) {
      const px = pts[i][0];
      const py = pts[i][1];
      if (px < 4 || py < 4 || px >= WORLD_W - 4 || py >= WORLD_H - 4) return false;
      if (isSolidPoint(px, py)) return false;
      if (hitPad(px, py, dockWood) || hitPad(px, py, walkPads)) return false;
      if (!isWaterAt(px, py)) return false;
      if (onIslandLand(px, py) && !inRiverWater(px, py)) return false;
    }
    return true;
  }

  function pickYankDir(b) {
    const dirs = [
      [1, 0],
      [-1, 0],
      [0, 1],
      [0, -1],
    ];
    for (let i = dirs.length - 1; i > 0; i--) {
      const j = irand(0, i);
      const swap = dirs[i];
      dirs[i] = dirs[j];
      dirs[j] = swap;
    }
    let fallback = null;
    for (let i = 0; i < dirs.length; i++) {
      const d = dirs[i];
      if (!hullInOpenWater(b.x + d[0] * 8, b.y + d[1] * 8, b.w, b.h)) continue;
      if (!fallback) fallback = d;
      if (d[0] === rod.tugDx && d[1] === rod.tugDy) continue;
      return d;
    }
    return fallback;
  }

  function isSharkishCatch(id) {
    return id === "mini_shark" || id === "shark" || id === "megalodon";
  }

  function updateSharkTug(dt) {
    const id = rod.catchId;
    if (!isSharkishCatch(id)) return;
    const mega = id === "megalodon";
    const fighting =
      (rod.phase === "wait" && (mega || rod.t >= rod.wait - 7)) || rod.phase === "reel";
    if (!fighting) return;
    const b = ownedBoat;
    if (!b || boatThrow || !player.aboard) return;
    if (rod.tugCool > 0) {
      rod.tugCool -= dt;
      b.vx = 0;
      b.vy = 0;
      return;
    }
    if (rod.tugLeft <= 0) {
      const dir = pickYankDir(b);
      if (!dir) return;
      const tiles = mega ? irand(10, 14) : id === "shark" ? 3 : 2;
      rod.tugDx = dir[0];
      rod.tugDy = dir[1];
      rod.tugLeft = tiles * TILE;
      rod.tugV = (tiles * TILE) / (mega ? 0.55 : id === "shark" ? 0.46 : 0.4);
      emitSplash(b.x + b.w / 2, b.y + b.h - 1, mega ? 14 : id === "shark" ? 8 : 4);
      if (mega) shake = Math.max(shake, 3.2);
    }
    let left = Math.min(rod.tugLeft, rod.tugV * dt);
    const hopMax = mega ? 4 : 2;
    while (left > 0.01) {
      const hop = Math.min(hopMax, left);
      const nx = b.x + rod.tugDx * hop;
      const ny = b.y + rod.tugDy * hop;
      if (!hullInOpenWater(nx, ny, b.w, b.h)) {
        rod.tugLeft = 0;
        rod.tugCool = mega ? rand(0.02, 0.08) : rand(0.08, 0.2);
        break;
      }
      b.x = nx;
      b.y = ny;
      left -= hop;
      rod.tugLeft -= hop;
    }
    if (rod.tugLeft <= 0) {
      rod.tugLeft = 0;
      if (rod.tugCool <= 0) rod.tugCool = mega ? rand(0.04, 0.12) : rand(0.1, 0.28);
    }
    b.vx = 0;
    b.vy = 0;
    seatPlayerOnBoat();
  }

  function landRodCatch() {
    const id = rod.catchId || rollBoatCatch();
    const b = ownedBoat;
    const fx = b.x + b.w / 2 + rod.face * 16;
    const fy = b.y + b.h + 6;
    rod.bit = false;
    if (!id) {
      emitSplash(fx, fy, 3);
      rodBaitId = null;
      return;
    }
    emitSplash(fx, fy, id === "megalodon" ? 16 : 7);
    if (!ITEM_DEFS[id] || !canTake(id)) {
      chestTalk = 0;
      harborTalk = 0;
      shopTrade.refuse = 0.01;
      rodBaitId = null;
      return;
    }
    rod.bit = true;
    // Common bait: always consume on successful catch.
    // Shark / mini_shark bait: only consume if megalodon actually landed.
    if (rodBaitId && MEGA_BAIT[rodBaitId] != null) {
      if (id === "megalodon") consumeRodBait();
      else rodBaitId = null;
    } else if (rodBaitId) {
      consumeRodBait();
    }
    const from = worldToUi(fx, fy);
    pickupAnims.push({
      id,
      t: 0,
      fromX: from.x,
      fromY: from.y,
      slot: slotIndexFor(id),
      dest: "slot",
      value: 0,
    });
    if (id === "blowfish") startBlowfishCut();
  }

  function updateRod(dt) {
    if (chestTalk > 0) chestTalk = Math.max(0, chestTalk - dt);
    if (rod.phase === "idle") return;
    const sharkFight =
      isSharkishCatch(rod.catchId) &&
      rod.phase === "wait" &&
      (rod.catchId === "megalodon" || rod.t >= rod.wait - 7);
    if (!player.aboard || player.moving || (rod.phase === "wait" && !sharkFight && !boatIsStill())) {
      rod.phase = "idle";
      rod.catchId = null;
      rod.tugLeft = 0;
      rodBaitId = null;
      return;
    }
    if (rod.phase === "wait" || rod.phase === "reel") updateSharkTug(dt);
    rod.t += dt;
    if (rod.phase === "wait" && rod.t >= rod.wait) {
      rod.phase = "reel";
      rod.t = 0;
      landRodCatch();
    } else if (rod.phase === "reel" && rod.t > 0.5) {
      const landed = rod.catchId;
      rod.phase = "idle";
      rod.catchId = null;
      rod.tugLeft = 0;
      if (playMode === "speedrun" && landed) checkCatchSpeedEnd(landed);
    }
  }

  function tryBoatFish() {
    tryCastRod();
  }

  function dropHeld() {
    if (player.dead > 0 || player.aboard) return;
    const stack = inventory[heldSlot];
    if (!stack) return;
    const pos = findDropPos(stack.id);
    const id = stack.id;
    stack.count -= 1;
    if (stack.count <= 0) {
      inventory[heldSlot] = null;
      if (id === "cloak") cloakOn = false;
    }
    if (isIndoor() && nearShopkeeper(pos.x + 4, pos.y + 4)) {
      if (tradeValueFor(id)) {
        beginShopTrade(id);
        return;
      }
      shopTrade.refuse = 0.7;
    }
    loot.push({
      id,
      x: pos.x,
      y: pos.y,
      taken: false,
      born: waveCycle,
      life: Infinity,
      ignoreUntil: time + 0.8,
      scene,
    });
  }

  function useHeld() {
    if (player.dead > 0) return;
    const stack = inventory[heldSlot];
    if (!stack) return;
    if (stack.id === "chest") {
      if (tryCabinChestTrade()) return;
      chestTalk = 2.4;
      return;
    }
    if (stack.id === "shell") {
      startHorn();
      trySummonSerpent();
      return;
    }
    if (stack.id === "wand") {
      fireWandBolt();
      return;
    }
    if (stack.id === "cloak") {
      cloakOn = !cloakOn;
      return;
    }
    useFx = { t: 0, id: stack.id };
  }

  function updateUseFx(dt) {
    if (!useFx) return;
    useFx.t += dt;
    if (useFx.t > 0.35) useFx = null;
  }

  function cam() {
    return { x: Math.round(camera.x), y: Math.round(camera.y) };
  }

  function px(x, y, w, h, color) {
    ink.fillStyle = color;
    ink.fillRect(x | 0, y | 0, w, h);
  }

  const FONT = {
    A: [14, 17, 17, 31, 17, 17, 17],
    B: [30, 17, 17, 30, 17, 17, 30],
    C: [14, 17, 16, 16, 16, 17, 14],
    D: [30, 17, 17, 17, 17, 17, 30],
    E: [31, 16, 16, 30, 16, 16, 31],
    F: [31, 16, 16, 30, 16, 16, 16],
    G: [14, 17, 16, 23, 17, 17, 14],
    H: [17, 17, 17, 31, 17, 17, 17],
    I: [14, 4, 4, 4, 4, 4, 14],
    J: [7, 2, 2, 2, 2, 18, 12],
    K: [17, 18, 20, 24, 20, 18, 17],
    L: [16, 16, 16, 16, 16, 16, 31],
    M: [17, 27, 21, 21, 17, 17, 17],
    N: [17, 25, 21, 19, 17, 17, 17],
    O: [14, 17, 17, 17, 17, 17, 14],
    P: [30, 17, 17, 30, 16, 16, 16],
    Q: [14, 17, 17, 17, 21, 18, 13],
    R: [30, 17, 17, 30, 20, 18, 17],
    S: [14, 17, 16, 14, 1, 17, 14],
    T: [31, 4, 4, 4, 4, 4, 4],
    U: [17, 17, 17, 17, 17, 17, 14],
    V: [17, 17, 17, 17, 17, 10, 4],
    W: [17, 17, 17, 21, 21, 21, 10],
    X: [17, 17, 10, 4, 10, 17, 17],
    Y: [17, 17, 10, 4, 4, 4, 4],
    Z: [31, 1, 2, 4, 8, 16, 31],
    "0": [14, 17, 19, 21, 25, 17, 14],
    "1": [4, 12, 4, 4, 4, 4, 14],
    "2": [14, 17, 1, 6, 8, 16, 31],
    "3": [14, 17, 1, 6, 1, 17, 14],
    "4": [2, 6, 10, 18, 31, 2, 2],
    "5": [31, 16, 30, 1, 1, 17, 14],
    "6": [14, 16, 16, 30, 17, 17, 14],
    "7": [31, 1, 2, 4, 8, 8, 8],
    "8": [14, 17, 17, 14, 17, 17, 14],
    "9": [14, 17, 17, 15, 1, 1, 14],
    " ": [0, 0, 0, 0, 0, 0, 0],
    "=": [0, 0, 31, 0, 31, 0, 0],
    "'": [12, 12, 8, 0, 0, 0, 0],
    ".": [0, 0, 0, 0, 0, 12, 12],
    ":": [0, 12, 12, 0, 12, 12, 0],
    "-": [0, 0, 0, 31, 0, 0, 0],
    "%": [25, 26, 4, 8, 16, 21, 19],
    "/": [1, 2, 4, 4, 8, 16, 16],
    ",": [0, 0, 0, 0, 12, 12, 8],
    "!": [4, 4, 4, 4, 4, 0, 4],
    "?": [14, 17, 1, 2, 4, 0, 4],
    "+": [0, 4, 4, 31, 4, 4, 0],
    "@": [14, 17, 23, 21, 23, 16, 14],
    "_": [0, 0, 0, 0, 0, 0, 31],
    "*": [0, 10, 4, 31, 4, 10, 0],
  };

  function drawPixChar(ch, x, y, color) {
    const g = FONT[ch] || FONT["?"];
    for (let row = 0; row < 7; row++) {
      for (let col = 0; col < 5; col++) {
        if (g[row] & (16 >> col)) px(x + col, y + row, 1, 1, color);
      }
    }
  }

  function pixTextWidth(text) {
    return text.length * 6 - 1;
  }

  function drawPixText(text, x, y, color, align) {
    const s = String(text).toUpperCase();
    let ox = x;
    if (align === "center") ox = (x - pixTextWidth(s) / 2) | 0;
    else if (align === "right") ox = (x - pixTextWidth(s)) | 0;
    for (let i = 0; i < s.length; i++) drawPixChar(s[i], ox + i * 6, y, color);
  }

  function drawPixTextBold(text, x, y, color, align) {
    drawPixText(text, x, y, color, align);
    drawPixText(text, x + 1, y, color, align);
  }

  function drawAccountName(name, x, y, isAccount, align) {
    const n = String(name || "?").slice(0, 12);
    if (isAccount) drawPixTextBold(n, x, y, "#c9a227", align);
    else drawPixText(n, x, y, "#3a2414", align);
  }

  // Compact gold/wood pixel chip — used for NEW and player nametags.
  function drawChipTag(label, x, y) {
    const s = String(label || "").toUpperCase();
    const tw = pixTextWidth(s);
    px(x - 1, y - 1, tw + 3, 9, "#3a2414");
    px(x, y, tw + 1, 7, "#8a5a18");
    drawPixText(s, x + 1, y, "#ffe27a");
    return tw + 4;
  }

  function drawNameTag(name, x, y, maxLen) {
    const n = String(name || "?").slice(0, maxLen == null ? 10 : maxLen);
    return drawChipTag(n, x, y);
  }

  /** Classic board name (no chip) — guests only. Returns width used. */
  function drawClassicBoardName(name, x, y, maxLen) {
    const n = String(name || "?").slice(0, maxLen == null ? 10 : maxLen);
    drawPixText(n, x, y, "#3a2414");
    return pixTextWidth(n);
  }

  /**
   * Board player label: account → gold/wood nametag chip; unclaimed guest → classic pixel text.
   * Optional green online pip when presence matches. Returns width used.
   */
  function drawBoardPlayerLabel(name, x, y, opts) {
    const o = opts || {};
    const isAcc = !!o.isAccount;
    const isOnline = !!o.isOnline;
    const maxLen = o.maxLen == null ? (isAcc ? 7 : 10) : o.maxLen;
    let cx = x;
    if (isOnline) cx += drawOnlineDot(cx, y);
    if (isAcc) cx += drawNameTag(name, cx, y, maxLen);
    else cx += drawClassicBoardName(name, cx, y, maxLen);
    return cx - x;
  }

  /** Small green presence pip (~2–3px) left of a nametag. Returns width used. */
  function drawOnlineDot(x, y) {
    px(x, y + 2, 3, 3, "#1a4020");
    px(x + 1, y + 3, 2, 2, "#3ddc5a");
    return 4;
  }

  function drawNewTag(x, y) {
    return drawChipTag("NEW", x, y);
  }

  function drawMemberTag(x, y) {
    return drawChipTag("ACC", x, y);
  }

  function boardRowOnline(r) {
    const api = lbApi();
    if (!api || typeof api.rowIsOnline !== "function") return false;
    return !!api.rowIsOnline(r);
  }

  function nudgePresenceRefresh() {
    const api = lbApi();
    if (!api || typeof api.tickPresence !== "function") return;
    // Debounce so menu redraws / board opens do not spam PostgREST.
    const now = Date.now();
    if (nudgePresenceRefresh._at && now - nudgePresenceRefresh._at < 8000) return;
    nudgePresenceRefresh._at = now;
    try {
      api.tickPresence();
    } catch (e) {}
  }

  function clearMenuHits() {
    menuHits = [];
  }

  function addMenuHit(key, x, y, w, h, onClick, opts) {
    const o = opts || {};
    menuHits.push({
      key: String(key),
      x: x | 0,
      y: y | 0,
      w: w | 0,
      h: h | 0,
      onClick,
      hover: !!o.hover,
    });
  }

  function hitMenuAt(ux, uy) {
    for (let i = menuHits.length - 1; i >= 0; i--) {
      const h = menuHits[i];
      if (ux >= h.x && uy >= h.y && ux < h.x + h.w && uy < h.y + h.h) return h;
    }
    return null;
  }

  function menuHovering(key) {
    return menuHoverKey && menuHoverKey === String(key);
  }

  function eventToUi(e) {
    const rect = canvas.getBoundingClientRect();
    const sx = canvas.width / Math.max(1, rect.width);
    const sy = canvas.height / Math.max(1, rect.height);
    return {
      x: ((e.clientX - rect.left) * sx) / SCALE_UI,
      y: ((e.clientY - rect.top) * sy) / SCALE_UI,
    };
  }

  function tileType(c, r) {
    if (!inBounds(c, r)) return TILES.DEEP;
    return world[r][c];
  }

  function makeTile(paint) {
    const c = document.createElement("canvas");
    c.width = TEX;
    c.height = TEX;
    const g = c.getContext("2d");
    g.imageSmoothingEnabled = false;
    paint(g);
    return c;
  }

  function scatter(g, n, salt, pal) {
    for (let i = 0; i < n; i++) {
      const x = (hash(i * 13 + salt, salt * 7) * TEX) | 0;
      const y = (hash(i * 29 + salt * 3, i + salt) * TEX) | 0;
      g.fillStyle = pal[(hash(i + 8, salt) * pal.length) | 0];
      g.fillRect(x, y, 1, 1);
    }
  }

  function paintGround(g, pal, salt) {
    g.fillStyle = pal[0];
    g.fillRect(0, 0, TEX, TEX);
    scatter(g, 1600, salt, pal.slice(1));
    scatter(g, 280, salt + 40, pal);
  }

  const art = {
    sand: makeTile((g) =>
      paintGround(g, ["#e2c792", "#d8bc86", "#edd6a8", "#c9a56a", "#f3e2bc", "#d4b87a", "#b89464", "#c4b08a"], 1)
    ),
    dirt: makeTile((g) =>
      paintGround(g, ["#8a6a42", "#7a5c38", "#6b4e30", "#9a784c", "#5a4028", "#a88858", "#4a3420"], 7)
    ),
    grass: makeTile((g) => paintGround(g, ["#3f7a30", "#2f6a24", "#4d8a3a", "#356e28", "#5a9a44", "#2a5c1e"], 4)),
  };

  const WATER_BLUE = "#1786b4";
  const WATER_DEEP = "#1278a4";

  function wrapBlit(img, dx, dy, wx, wy) {
    const s = img.width;
    const sx = (((wx % s) + s) % s) | 0;
    const sy = (((wy % s) + s) % s) | 0;
    const w1 = Math.min(TILE, s - sx);
    const h1 = Math.min(TILE, s - sy);
    ctx.drawImage(img, sx, sy, w1, h1, dx | 0, dy | 0, w1, h1);
    if (w1 < TILE) ctx.drawImage(img, 0, sy, TILE - w1, h1, (dx + w1) | 0, dy | 0, TILE - w1, h1);
    if (h1 < TILE) ctx.drawImage(img, sx, 0, w1, TILE - h1, dx | 0, (dy + h1) | 0, w1, TILE - h1);
    if (w1 < TILE && h1 < TILE) {
      ctx.drawImage(img, 0, 0, TILE - w1, TILE - h1, (dx + w1) | 0, (dy + h1) | 0, TILE - w1, TILE - h1);
    }
  }

  function shoreYAt(wx) {
    return baseShoreRow(wx / TILE) * TILE;
  }

  function mix3(a, b, t) {
    t = t < 0 ? 0 : t > 1 ? 1 : t;
    return [(a[0] + (b[0] - a[0]) * t) | 0, (a[1] + (b[1] - a[1]) * t) | 0, (a[2] + (b[2] - a[2]) * t) | 0];
  }

  function rgb3(c) {
    return "rgb(" + c[0] + "," + c[1] + "," + c[2] + ")";
  }

  const COL_WET_SH = [154, 110, 64];
  const COL_WET = [186, 138, 82];
  const COL_GOLD = [226, 199, 146];
  const COL_GOLD_HI = [243, 226, 188];
  const COL_COOL = [176, 156, 118];
  const COL_SAND_DIRT = [196, 160, 112];
  const COL_DIRT = [138, 106, 66];
  const COL_EARTH = [90, 64, 40];
  const COL_GRASS_A = [63, 122, 48];
  const COL_GRASS_B = [47, 106, 36];
  const COL_GRASS_C = [42, 92, 30];
  const COL_ROCK_A = [116, 112, 104];
  const COL_ROCK_B = [78, 76, 70];
  const COL_BARREN = [146, 124, 86];
  const COL_SCRUB = [86, 96, 58];

  function landColor(wx, wy) {
    const shore = shoreYAt(wx);
    const cliff = northCliffY(wx);
    const cap = islandCap(wx / TILE);
    const band = riverBand(wx, wy);
    if (band === 0) {
      if (wy < shore - 2 && riverLip(wx, wy) && eastness(wx / TILE) < 0.32) return "#178f74";
      if (wy >= shore) return wy - shore < 36 ? WATER_BLUE : WATER_DEEP;
      return WATER_BLUE;
    }
    if (band === 1 && wy < shore - 2 && wy > cliff + 2 && cap > 0.04) {
      const bank = riverBankColor(wx, wy);
      if (bank) return bank;
    }
    if (cap <= 0) return wy - SHORE_BASE * TILE < 36 ? WATER_BLUE : WATER_DEEP;
    if (wy < cliff) {
      const u = (cliff - wy) / 8;
      if (u < 0.42) return ((wx + wy) & 1) === 0 ? "#5a4a38" : "#4a3c2c";
      return WATER_BLUE;
    }
    if (wy >= shore) return wy - shore < 36 ? WATER_BLUE : WATER_DEEP;
    let e = eastness(wx / TILE) + (n2(wx * 0.013, wy * 0.011) - 0.5) * 0.34;
    if (e < 0) e = 0;
    else if (e > 1) e = 1;
    const fromSouth = shore - wy;
    const beach = (8 + n2(wx * 0.022, 1.6) * 7) * TILE;
    if (fromSouth < beach) {
      const t = fromSouth / Math.max(12, beach);
      const wet = mix3(COL_WET_SH, COL_WET, Math.min(1, t * 2.4));
      const dry = mix3(COL_GOLD, COL_GOLD_HI, t);
      let sand = mix3(wet, dry, t);
      sand = mix3(sand, mix3(COL_BARREN, COL_ROCK_B, 0.45), e * 0.78);
      if (hash(wx, wy) > 0.972) sand = mix3(sand, COL_COOL, 0.35);
      return rgb3(sand);
    }
    const jungle = n2(wx * 0.046, wy * 0.041) > 0.58 ? COL_GRASS_A : COL_GRASS_B;
    const rock = n2(wx * 0.062, wy * 0.05) > 0.48 ? COL_ROCK_A : COL_ROCK_B;
    let body = mix3(jungle, rock, e);
    const mid = 1 - Math.min(1, Math.abs(e - 0.5) / 0.32);
    body = mix3(body, COL_SCRUB, mid * 0.5);
    if (wy - cliff < 12) body = mix3(body, e > 0.55 ? COL_ROCK_B : COL_EARTH, 0.4);
    if (hash(wx, wy) > 0.988) body = mix3(body, e > 0.5 ? COL_ROCK_B : COL_EARTH, 0.65);
    return rgb3(body);
  }

  function bakeSpeck(g, bx, by, wx0, wy0, pal, n) {
    for (let i = 0; i < n; i++) {
      const lx = (hash(wx0 + i * 13, wy0 + i * 7) * TILE) | 0;
      const ly = (hash(wy0 + i * 19, wx0 + i * 3) * TILE) | 0;
      g.fillStyle = pal[(hash(i + wx0, wy0) * pal.length) | 0];
      g.fillRect(bx + lx, by + ly, 1, 1);
    }
  }

  function wrapBlitTo(g, img, dx, dy, wx, wy) {
    const s = img.width;
    const sx = (((wx % s) + s) % s) | 0;
    const sy = (((wy % s) + s) % s) | 0;
    const w1 = Math.min(TILE, s - sx);
    const h1 = Math.min(TILE, s - sy);
    g.drawImage(img, sx, sy, w1, h1, dx, dy, w1, h1);
    if (w1 < TILE) g.drawImage(img, 0, sy, TILE - w1, h1, dx + w1, dy, TILE - w1, h1);
    if (h1 < TILE) g.drawImage(img, sx, 0, w1, TILE - h1, dx, dy + h1, w1, TILE - h1);
    if (w1 < TILE && h1 < TILE) {
      g.drawImage(img, 0, 0, TILE - w1, TILE - h1, dx + w1, dy + h1, TILE - w1, TILE - h1);
    }
  }

  function bakeStaticWorld() {
    shoreLut = new Int16Array(WORLD_W);
    for (let wx = 0; wx < WORLD_W; wx++) shoreLut[wx] = shoreYAt(wx) | 0;

    foamMask = new Uint8Array(FOAM_MASK_W * FOAM_MASK_H);
    for (let y = 0; y < FOAM_MASK_H; y++) {
      for (let x = 0; x < FOAM_MASK_W; x++) {
        const h0 = hash(x, y * 17);
        foamMask[y * FOAM_MASK_W + x] = h0 > 0.42 ? (h0 > 0.72 ? 2 : 1) : 0;
      }
    }

    landCanvas = document.createElement("canvas");
    landCanvas.width = WORLD_W;
    landCanvas.height = WORLD_H;
    const g = landCanvas.getContext("2d");
    g.imageSmoothingEnabled = false;
    g.fillStyle = WATER_BLUE;
    g.fillRect(0, 0, WORLD_W, WORLD_H);

    for (let r = 0; r < ROWS; r++) {
      for (let c = 0; c < COLS; c++) {
        const wx0 = c * TILE;
        const wy0 = r * TILE;
        const s0 = shoreLut[wx0];
        const s1 = shoreLut[wx0 + TILE - 1];
        const sMax = Math.max(s0, s1);
        const cliff0 = northCliffY(wx0);
        const cliff1 = northCliffY(wx0 + TILE - 1);
        const capL = islandCap(c);
        const capR = islandCap(c + 0.99);
        const fullyWater = wy0 >= sMax;
        const fullyOcean =
          (capL <= 0 && capR <= 0) || wy0 + TILE <= Math.min(cliff0, cliff1) - 10;
        const riverish = riverTouchesTile(wx0, wy0);

        if (fullyOcean && !riverish) {
          g.fillStyle = WATER_BLUE;
          g.fillRect(wx0, wy0, TILE, TILE);
          continue;
        }

        if (fullyWater && !riverish && wy0 >= sMax + 40) {
          g.fillStyle = WATER_DEEP;
          g.fillRect(wx0, wy0, TILE, TILE);
          continue;
        }

        for (let ly = 0; ly < TILE; ly++) {
          for (let lx = 0; lx < TILE; lx++) {
            g.fillStyle = landColor(wx0 + lx, wy0 + ly);
            g.fillRect(wx0 + lx, wy0 + ly, 1, 1);
          }
        }
      }
    }
    paintRiverBanks(g);
  }

  function pxi(g, x, y, w, h, col) {
    g.fillStyle = col;
    g.fillRect(x | 0, y | 0, w, h);
  }

  function paintPlanks(g, x, y, w, h, vertical) {
    const cols = ["#8a5a32", "#7a4a28", "#9a6840", "#6b3f1f", "#a07448"];
    for (let iy = 0; iy < h; iy++) {
      for (let ix = 0; ix < w; ix++) {
        const board = vertical ? (ix / 3) | 0 : (iy / 3) | 0;
        const n = hash(x + ix, y + iy + board * 9);
        let col = cols[(board + ((n * 3) | 0)) % cols.length];
        if (n > 0.93) col = "#c4a070";
        else if (n < 0.07) col = "#5a3420";
        pxi(g, x + ix, y + iy, 1, 1, col);
      }
    }
    if (vertical) {
      for (let ix = 2; ix < w; ix += 3) pxi(g, x + ix, y, 1, h, "#4a2e16");
    } else {
      for (let iy = 2; iy < h; iy += 3) pxi(g, x, y + iy, w, 1, "#4a2e16");
    }
  }

  function paintPost(g, x, y, h) {
    pxi(g, x, y, 2, h, "#5a3420");
    pxi(g, x, y, 1, h, "#8a5a32");
    pxi(g, x, y + h - 1, 2, 1, "#3a2414");
  }

  function paintCrate(g, x, y) {
    pxi(g, x, y, 7, 6, "#7a4a28");
    pxi(g, x + 1, y + 1, 5, 1, "#c4a070");
    pxi(g, x, y + 5, 7, 1, "#4a2e16");
    pxi(g, x + 3, y, 1, 6, "#5a3420");
  }

  function paintBarrel(g, x, y) {
    pxi(g, x + 1, y, 4, 7, "#6b3f1f");
    pxi(g, x, y + 1, 6, 5, "#8a5a32");
    pxi(g, x + 1, y + 2, 4, 1, "#c4a070");
    pxi(g, x + 1, y + 5, 4, 1, "#4a2e16");
  }

  function paintFishSmall(g, x, y, flip) {
    const s = flip ? -1 : 1;
    const b = "#3a9ad4";
    pxi(g, x, y, 5, 2, b);
    pxi(g, x + (flip ? 0 : 4), y, 1, 2, "#1a6a9a");
    pxi(g, x + (flip ? 4 : 0), y, 1, 1, "#7fd4f0");
    pxi(g, x + 2 * s, y - 1, 2, 1, "#2a7ab0");
  }

  function paintCrystalPile(g, x, y) {
    pxi(g, x + 2, y, 2, 1, "#f4fbff");
    pxi(g, x + 1, y + 1, 4, 3, "#9ae0ff");
    pxi(g, x + 2, y + 2, 2, 3, "#5ec8e8");
    pxi(g, x + 3, y + 1, 1, 1, "#ffffff");
    pxi(g, x, y + 4, 6, 1, "#2a6a88");
  }

  function paintShark(g, x, y) {
    pxi(g, x + 2, y + 2, 22, 4, "#3a7aaa");
    pxi(g, x + 4, y + 1, 16, 2, "#5aa0c4");
    pxi(g, x + 6, y, 6, 1, "#2a5a7a");
    pxi(g, x + 22, y + 2, 4, 3, "#2a5a7a");
    pxi(g, x, y + 3, 3, 2, "#2a5a7a");
    pxi(g, x + 24, y + 1, 1, 1, "#1a3048");
    pxi(g, x + 8, y + 5, 8, 1, "#2a4a62");
    pxi(g, x + 18, y + 3, 1, 1, "#e8f6ff");
  }

  function paintNet(g, x, y, w, h) {
    for (let i = 0; i < w; i += 2) {
      for (let j = 0; j < h; j += 2) {
        if (((i + j) & 2) === 0) pxi(g, x + i, y + j, 1, 1, "#6a7a6a");
      }
    }
  }

  function paintGoldBag(g, x, y, open) {
    pxi(g, x + 1, y + 3, 8, 6, "#6b3f1f");
    pxi(g, x + 2, y + 2, 6, 2, "#8a5a32");
    pxi(g, x, y + 4, 10, 5, "#5a3420");
    pxi(g, x + 2, y + 8, 6, 1, "#3a2414");
    if (open) {
      pxi(g, x + 2, y, 6, 3, "#c9a227");
      pxi(g, x + 3, y + 1, 4, 3, "#e8c44a");
      pxi(g, x + 4, y, 2, 1, "#fff3c0");
      pxi(g, x + 1, y + 3, 1, 1, "#f3d56a");
      pxi(g, x + 7, y + 3, 1, 1, "#fff1a8");
      pxi(g, x + 4, y + 4, 2, 1, "#c9a227");
    } else {
      pxi(g, x + 3, y + 1, 4, 2, "#c9a227");
      pxi(g, x + 4, y, 2, 1, "#e8c44a");
    }
  }

  function paintRamp(g, x, y, w, h) {
    for (let iy = 0; iy < h; iy++) {
      const t = iy / Math.max(1, h - 1);
      const inset = ((1 - t) * 10) | 0;
      paintPlanks(g, x + inset, y + iy, Math.max(8, w - inset), 1, false);
    }
    pxi(g, x, y + h - 1, w, 1, "#4a2e16");
    pxi(g, x + 10, y, 1, h, "#5a3420");
    pxi(g, x + w - 2, y + (h / 3) | 0, 1, h - ((h / 3) | 0), "#5a3420");
  }

  function paintWindow(g, x, y) {
    pxi(g, x, y, 11, 11, "#2a2018");
    pxi(g, x + 1, y + 1, 9, 9, "#e09030");
    pxi(g, x + 2, y + 2, 3, 3, "#fff1c0");
    pxi(g, x + 6, y + 2, 3, 3, "#ffb04a");
    pxi(g, x + 2, y + 6, 3, 3, "#c46a28");
    pxi(g, x + 6, y + 6, 3, 3, "#e88830");
    pxi(g, x + 5, y, 1, 11, "#3a2414");
    pxi(g, x, y + 5, 11, 1, "#3a2414");
    pxi(g, x + 2, y + 2, 2, 1, "#fff6d0");
    pxi(g, x + 1, y, 9, 1, "#6b3f1f");
  }

  function paintMiniWindow(g, x, y) {
    pxi(g, x, y, 7, 7, "#2a2018");
    pxi(g, x + 1, y + 1, 5, 5, "#e8a040");
    pxi(g, x + 2, y + 2, 2, 2, "#fff1c0");
    pxi(g, x + 3, y, 1, 7, "#3a2414");
    pxi(g, x, y + 3, 7, 1, "#3a2414");
  }

  function paintCabinRoof(g, x, y, w, roofH, eave) {
    const half = (w / 2) | 0;
    const cx = x + half;
    const front = eave + 4;
    const rows = roofH + front;
    for (let row = 0; row < rows; row++) {
      const t = row / Math.max(1, rows - 1);
      const spread = 3 + ((t * (half + eave)) | 0);
      const x0 = cx - spread;
      const x1 = cx + spread;
      const groove = (row & 1) === 1;
      for (let ix = x0; ix <= x1; ix++) {
        let col = groove ? "#4a2e16" : (row & 2) === 0 ? "#a07448" : "#8a5a32";
        if (!groove && hash(ix, y + row) > 0.9) col = "#c4a070";
        if (!groove && hash(ix, y + row) < 0.07) col = "#6b3f1f";
        if (row < 2) col = "#3a2414";
        if (ix === x0 || ix === x1 || row >= rows - 2) col = "#2a1810";
        pxi(g, ix, y + row, 1, 1, col);
      }
    }
  }

  function paintShopBuilding(g, x, y, w, h, door) {
    const roofH = 15;
    for (let iy = roofH; iy < h; iy++) {
      const board = ((iy - roofH) / 2) | 0;
      const groove = ((iy - roofH) & 1) === 1;
      for (let ix = 0; ix < w; ix++) {
        const n = hash(x + ix, y + iy + board * 5);
        let col = board % 2 === 0 ? "#8a5a32" : "#7a4a28";
        if (groove) col = "#5a3420";
        else if (n > 0.9) col = "#a07448";
        else if (n < 0.07) col = "#4a2e16";
        pxi(g, x + ix, y + iy, 1, 1, col);
      }
    }
    pxi(g, x, y + roofH, 2, h - roofH, "#4a2e16");
    pxi(g, x + 1, y + roofH, 1, h - roofH, "#6b3f1f");
    pxi(g, x + w - 2, y + roofH, 2, h - roofH, "#3a2414");
    pxi(g, x + w - 2, y + roofH, 1, h - roofH, "#6b3f1f");
    for (let ix = 11; ix < w - 8; ix += 10) pxi(g, x + ix, y + roofH, 1, h - roofH, "#6b3f1f");
    pxi(g, x, y + h - 2, w, 2, "#3a2414");
    pxi(g, x + 1, y + h - 2, w - 2, 1, "#5a3420");
    paintWindow(g, x + 7, y + roofH + 9);
    paintWindow(g, x + w - 19, y + roofH + 9);
    const dx = door.x - x;
    const dy = door.y - y;
    pxi(g, x + dx - 1, y + dy - 1, door.w + 2, door.h + 1, "#3a2414");
    pxi(g, x + dx, y + dy, door.w, door.h, "#1a1410");
    pxi(g, x + dx + 1, y + dy + 1, door.w - 2, door.h - 2, "#2a2018");
    pxi(g, x + dx + 2, y + dy + 2, 1, door.h - 4, "#3a2a20");
    pxi(g, x + dx + door.w - 3, y + dy + (door.h / 2) | 0, 1, 1, "#c4a070");
    pxi(g, x + dx - 1, y + dy + door.h - 1, door.w + 2, 2, "#4a2e16");
    paintCabinRoof(g, x, y, w, 15, 5);
  }

  function paintFishSign(g, x, y) {
    pxi(g, x, y, 16, 11, "#3a2414");
    pxi(g, x + 1, y + 1, 14, 9, "#c9a227");
    pxi(g, x + 2, y + 2, 12, 7, "#e8c44a");
    pxi(g, x + 4, y + 4, 8, 3, "#3a9ad4");
    pxi(g, x + 3, y + 5, 2, 2, "#1a6a9a");
    pxi(g, x + 11, y + 4, 2, 2, "#7fd4f0");
    pxi(g, x + 7, y, 2, 2, "#5a3420");
  }

  function paintFishHut(g, x, y, w, h, door) {
    const roofH = 11;
    for (let iy = roofH; iy < h; iy++) {
      for (let ix = 0; ix < w; ix++) {
        const n = hash(x + ix, y + iy);
        let col = ((iy / 2) | 0) % 2 === 0 ? "#6b3f1f" : "#5a3420";
        if (n > 0.9) col = "#8a5a32";
        else if (n < 0.08) col = "#3a2414";
        pxi(g, x + ix, y + iy, 1, 1, col);
      }
    }
    pxi(g, x, y + roofH, 1, h - roofH, "#3a2414");
    pxi(g, x + w - 1, y + roofH, 1, h - roofH, "#2a1810");
    const dx = door.x - x;
    const dy = door.y - y;
    pxi(g, x + dx - 1, y + dy - 1, door.w + 2, door.h + 1, "#2a1810");
    pxi(g, x + dx, y + dy, door.w, door.h, "#14100c");
    pxi(g, x + dx + 1, y + dy + 1, door.w - 2, door.h - 2, "#2a2018");
    pxi(g, x + dx + door.w - 2, y + dy + ((door.h / 2) | 0), 1, 1, "#c4a070");
    paintMiniWindow(g, x + 2, y + roofH + 9);
    paintCabinRoof(g, x, y, w, 11, 4);
    paintFishSign(g, x + ((w / 2) | 0) - 8, y + roofH + 6);
  }

  function bakeFishInterior() {
    fishCanvas = document.createElement("canvas");
    fishCanvas.width = FISH_W;
    fishCanvas.height = FISH_H;
    const g = fishCanvas.getContext("2d");
    g.imageSmoothingEnabled = false;
    pxi(g, 0, 0, FISH_W, FISH_H, "#241810");
    for (let y = 10; y < FISH_H - 6; y++) {
      for (let x = 8; x < FISH_W - 8; x++) {
        const n = hash(x + 9, y + 3);
        const board = (y / 3) | 0;
        let col = board % 2 === 0 ? "#7a4a28" : "#6b3f1f";
        if (n > 0.92) col = "#9a6840";
        if (n < 0.06) col = "#4a2e16";
        pxi(g, x, y, 1, 1, col);
      }
    }
    pxi(g, 0, 0, FISH_W, 10, "#4a2e16");
    pxi(g, 0, 0, 8, FISH_H, "#4a2e16");
    pxi(g, FISH_W - 8, 0, 8, FISH_H, "#4a2e16");
    pxi(g, 0, FISH_H - 6, FISH_W, 6, "#3a2414");
    const doorX = (FISH_W / 2 - 6) | 0;
    pxi(g, doorX, FISH_H - 8, 12, 8, "#14100c");
    const fishLamp = (FISH_W / 2 - 2) | 0;
    pxi(g, fishLamp + 1, 8, 2, 3, "#3a2414");
    pxi(g, fishLamp, 11, 4, 3, "#e8c44a");
    pxi(g, fishLamp + 1, 12, 2, 1, "#fff6d0");
    paintNet(g, 12, 14, 28, 16);
    paintNet(g, FISH_W - 40, 14, 28, 16);
    for (let i = 0; i < 4; i++) paintFishSmall(g, 16 + i * 10, 18, i & 1);
    paintBarrel(g, 14, 70);
    paintCrate(g, FISH_W - 24, 72);
    const cx = (FISH_W / 2 - 18) | 0;
    const cy = 42;
    pxi(g, cx, cy, 36, 9, "#6b3f1f");
    pxi(g, cx, cy, 36, 1, "#c4a070");
    paintFishSmall(g, cx + 6, cy + 3, false);
    paintFishSmall(g, cx + 16, cy + 4, true);
    fishSolids.length = 0;
    fishSolids.push({ x: 0, y: 0, w: FISH_W, h: 12 });
    fishSolids.push({ x: 0, y: 0, w: 8, h: FISH_H });
    fishSolids.push({ x: FISH_W - 8, y: 0, w: 8, h: FISH_H });
    fishSolids.push({ x: 0, y: FISH_H - 6, w: doorX, h: 6 });
    fishSolids.push({ x: doorX + 12, y: FISH_H - 6, w: FISH_W - (doorX + 12), h: 6 });
    fishSolids.push({ x: cx, y: cy - 2, w: 36, h: 12 });
    fishSolids.push({ x: 12, y: 14, w: 32, h: 16 });
    fishSolids.push({ x: FISH_W - 44, y: 14, w: 32, h: 16 });
  }

  function bakeShopInterior() {
    shopCanvas = document.createElement("canvas");
    shopCanvas.width = SHOP_W;
    shopCanvas.height = SHOP_H;
    const g = shopCanvas.getContext("2d");
    g.imageSmoothingEnabled = false;
    pxi(g, 0, 0, SHOP_W, SHOP_H, "#2a1c12");
    for (let y = 10; y < SHOP_H - 6; y++) {
      for (let x = 8; x < SHOP_W - 8; x++) {
        const n = hash(x, y);
        const board = (y / 3) | 0;
        let col = board % 2 === 0 ? "#8a5a32" : "#7a4a28";
        if (n > 0.9) col = "#a07448";
        if (n < 0.06) col = "#5a3420";
        pxi(g, x, y, 1, 1, col);
      }
    }
    pxi(g, 0, 0, SHOP_W, 10, "#5a3420");
    pxi(g, 0, 0, 8, SHOP_H, "#5a3420");
    pxi(g, SHOP_W - 8, 0, 8, SHOP_H, "#5a3420");
    pxi(g, 0, SHOP_H - 6, SHOP_W, 6, "#4a2e16");
    for (let y = 0; y < 10; y++) {
      for (let x = 0; x < SHOP_W; x++) {
        const sh = ((x + y) & 1) === 0 ? "#6b3f1f" : "#4a2e16";
        pxi(g, x, y, 1, 1, sh);
      }
    }
    pxi(g, 8, 10, SHOP_W - 16, 1, "#3a2414");
    const lampX = (SHOP_W / 2 - 2) | 0;
    pxi(g, lampX + 1, 8, 2, 3, "#3a2414");
    pxi(g, lampX, 11, 4, 3, "#e8c44a");
    pxi(g, lampX + 1, 12, 2, 1, "#fff6d0");
    const doorX = (SHOP_W / 2 - 7) | 0;
    pxi(g, doorX, SHOP_H - 8, 14, 8, "#1a1410");
    pxi(g, doorX + 1, SHOP_H - 7, 12, 6, "#2a2018");
    for (let i = 0; i < 5; i++) {
      const sx = 12 + i * 12;
      pxi(g, sx, 14, 10, 18, "#6b3f1f");
      pxi(g, sx + 1, 15, 8, 1, "#4a2e16");
      pxi(g, sx + 1, 20, 8, 1, "#4a2e16");
      paintFishSmall(g, sx + 2, 17, i & 1);
      paintCrystalPile(g, sx + 2, 24);
    }
    for (let i = 0; i < 4; i++) {
      const sx = SHOP_W - 24 - i * 12;
      pxi(g, sx, 14, 10, 16, "#6b3f1f");
      paintCrystalPile(g, sx + 2, 18);
      paintFishSmall(g, sx + 2, 26, false);
    }
    const cx = (SHOP_W / 2 - 22) | 0;
    const cy = 52;
    pxi(g, cx, cy, 44, 10, "#7a4a28");
    pxi(g, cx, cy, 44, 1, "#c4a070");
    pxi(g, cx, cy + 9, 44, 1, "#4a2e16");
    pxi(g, cx + 2, cy + 2, 8, 5, "#3a2414");
    paintBarrel(g, 18, 78);
    paintBarrel(g, 28, 80);
    paintCrate(g, 40, 82);
    paintCrate(g, SHOP_W - 28, 80);
    paintGoldBag(g, 22, 96, true);
    paintGoldBag(g, 36, 98, true);
    paintGoldBag(g, 52, 94, true);
    paintGoldBag(g, 68, 100, true);
    paintGoldBag(g, 88, 96, true);
    paintGoldBag(g, 108, 98, true);
    paintGoldBag(g, 124, 94, true);
    paintCrystalPile(g, 70, 86);
    paintCrystalPile(g, 96, 84);
    shopSolids.length = 0;
    shopSolids.push({ x: 0, y: 0, w: SHOP_W, h: 12 });
    shopSolids.push({ x: 0, y: 0, w: 8, h: SHOP_H });
    shopSolids.push({ x: SHOP_W - 8, y: 0, w: 8, h: SHOP_H });
    shopSolids.push({ x: 0, y: SHOP_H - 6, w: doorX, h: 6 });
    shopSolids.push({ x: doorX + 14, y: SHOP_H - 6, w: SHOP_W - (doorX + 14), h: 6 });
    shopSolids.push({ x: cx, y: cy - 2, w: 44, h: 12 });
    shopSolids.push({ x: 12, y: 14, w: 60, h: 18 });
    shopSolids.push({ x: SHOP_W - 72, y: 14, w: 52, h: 16 });
  }

  function withInk(g, fn) {
    const prev = ink;
    ink = g;
    fn();
    ink = prev;
  }

  function paintDimWand(g, x, y) {
    pxi(g, x + 1, y, 1, 9, "#3a3028");
    pxi(g, x, y, 3, 2, "#241c30");
    pxi(g, x + 1, y, 1, 2, "#5a4878");
    pxi(g, x + 1, y + 8, 1, 1, "#2a1c14");
  }

  function paintFoldedCloth(g, x, y) {
    pxi(g, x, y, 8, 2, "#6a3048");
    pxi(g, x + 1, y + 2, 7, 2, "#8a4060");
    pxi(g, x, y + 4, 8, 2, "#4a2038");
    pxi(g, x + 2, y + 1, 3, 1, "#c08098");
  }

  function paintClosedBook(g, x, y) {
    pxi(g, x, y, 8, 6, "#6b2a22");
    pxi(g, x, y, 1, 6, "#3a1410");
    pxi(g, x + 2, y + 1, 4, 1, "#c4a070");
    pxi(g, x + 6, y + 3, 1, 1, "#e8c44a");
  }

  function paintLightJar(g, x, y) {
    pxi(g, x + 2, y, 3, 1, "#9ab0b8");
    pxi(g, x + 1, y + 1, 5, 1, "#c5d4d0");
    pxi(g, x, y + 2, 7, 6, "#d7ece8");
    pxi(g, x + 1, y + 3, 5, 4, "#fff1b0");
    pxi(g, x + 2, y + 4, 3, 2, "#ffffff");
    pxi(g, x + 1, y + 7, 5, 1, "#7a9098");
  }

  function paintShelfBank(g, x, y, w, h) {
    pxi(g, x, y, w, h, "#5a3420");
    pxi(g, x, y, w, 2, "#c4a070");
    pxi(g, x, y + ((h / 2) | 0), w, 2, "#8a5a32");
    pxi(g, x, y + h - 2, w, 2, "#3a2414");
    pxi(g, x, y, 1, h, "#3a2414");
    pxi(g, x + w - 1, y, 1, h, "#3a2414");
  }

  function bakeCabinInterior() {
    cabinCanvas = document.createElement("canvas");
    cabinCanvas.width = CABIN_W;
    cabinCanvas.height = CABIN_H;
    const g = cabinCanvas.getContext("2d");
    g.imageSmoothingEnabled = false;
    for (let y = 0; y < 12; y++) {
      for (let x = 0; x < CABIN_W; x++) {
        const joist = x % 16 < 2;
        const col = joist ? "#3a2414" : (x + y) & 1 ? "#5a3420" : "#6b3f1f";
        pxi(g, x, y, 1, 1, col);
      }
    }
    pxi(g, 0, 32, CABIN_W, 6, "#4a2e16");
    pxi(g, 0, 32, CABIN_W, 1, "#8a5a32");
    for (let x = 18; x < CABIN_W - 10; x += 18) pxi(g, x, 12, 2, 20, "#3a2414");
    pxi(g, 12, 10, 4, CABIN_H - 18, "#5a3420");
    pxi(g, CABIN_W - 16, 10, 4, CABIN_H - 18, "#5a3420");
    pxi(g, 0, 10, 2, CABIN_H - 18, "#2a1810");
    pxi(g, CABIN_W - 2, 10, 2, CABIN_H - 18, "#2a1810");
    for (let y = 38; y < CABIN_H - 8; y++) {
      for (let x = 16; x < CABIN_W - 16; x++) {
        const n = hash(x + 4, y + 11);
        const board = (y / 3) | 0;
        let col = board % 2 === 0 ? "#8a5a32" : "#7a4a28";
        if (n > 0.92) col = "#a07448";
        if (n < 0.06) col = "#5a3420";
        pxi(g, x, y, 1, 1, col);
      }
    }
    for (let i = 0; i < 4; i++) {
      const by = 48 + i * 16;
      pxi(g, 20, by, CABIN_W - 40, 2, "#3a2414");
      pxi(g, 20, by, CABIN_W - 40, 1, "#6b3f1f");
    }
    pxi(g, 0, CABIN_H - 8, CABIN_W, 8, "#3a2414");
    const doorX = cabinDoorX();
    pxi(g, doorX - 2, CABIN_H - 22, 20, 3, "#5a3420");
    pxi(g, doorX, CABIN_H - 18, 16, 3, "#7a4a28");
    pxi(g, doorX + 2, CABIN_H - 14, 12, 3, "#a07448");
    pxi(g, doorX, CABIN_H - 10, 16, 10, "#100c0a");
    pxi(g, doorX + 12, CABIN_H - 6, 1, 1, "#c4a070");
    paintShelfBank(g, 18, 42, 28, 32);
    paintDimWand(g, 22, 46);
    paintFoldedCloth(g, 30, 48);
    paintShelfBank(g, 156, 40, 28, 24);
    paintClosedBook(g, 160, 44);
    paintLightJar(g, 170, 42);
    const table = CABIN_TABLE;
    pxi(g, table.x, table.y, table.w, table.h, "#7a4a28");
    pxi(g, table.x, table.y, table.w, 2, "#c4a070");
    pxi(g, table.x, table.y + table.h - 1, table.w, 1, "#3a2414");
    pxi(g, table.x + 2, table.y + table.h, 2, 6, "#5a3420");
    pxi(g, table.x + table.w - 4, table.y + table.h, 2, 6, "#5a3420");
    cabinChestX = table.x + 10;
    cabinChestY = table.y - 8;
    withInk(g, () => {
      pxi(g, 128, 56, 24, 13, "#3a2414");
      pxi(g, 129, 57, 22, 11, "#e8d5a8");
      drawCoinIcon(131, 59);
      drawPixText("50", 140, 60, "#3a2414");
    });
    cabinSolids.length = 0;
    cabinSolids.push({ x: 0, y: 0, w: CABIN_W, h: 38 });
    cabinSolids.push({ x: 0, y: 0, w: 16, h: CABIN_H });
    cabinSolids.push({ x: CABIN_W - 16, y: 0, w: 16, h: CABIN_H });
    cabinSolids.push({ x: 0, y: CABIN_H - 8, w: doorX, h: 8 });
    cabinSolids.push({ x: doorX + 16, y: CABIN_H - 8, w: CABIN_W - (doorX + 16), h: 8 });
    cabinSolids.push({ x: 18, y: 42, w: 28, h: 32 });
    cabinSolids.push({ x: 156, y: 40, w: 28, h: 24 });
    cabinSolids.push({ x: table.x, y: table.y, w: table.w, h: table.h + 4 });
    cabinExit = { x: doorX, y: CABIN_H - 14, w: 16, h: 14 };
    seedCabinFish();
  }

  function paintMooredBoat(g, deck, hatch) {
    const x = deck.x;
    const y = deck.y;
    const w = deck.w;
    const h = deck.h;
    pxi(g, x + 8, y + h - 2, w - 16, 2, "#0e4a62");
    pxi(g, x + 4, y + 8, w - 8, h - 10, "#5a3420");
    pxi(g, x + 2, y + 6, w - 4, 5, "#8a5a32");
    pxi(g, x + 8, y + 4, w - 16, 4, "#a07448");
    pxi(g, x + 12, y + 5, w - 24, 1, "#c4a070");
    pxi(g, x + 6, y + 11, w - 12, 1, "#3a2414");
    pxi(g, x, y + 8, 3, 4, "#6b3f1f");
    pxi(g, x + w - 3, y + 8, 3, 4, "#4a2e16");
    pxi(g, hatch.x - 1, hatch.y - 1, hatch.w + 2, hatch.h + 2, "#3a2414");
    pxi(g, hatch.x, hatch.y, hatch.w, hatch.h, "#100c0a");
    pxi(g, hatch.x + 1, hatch.y + 1, hatch.w - 2, 1, "#5a3420");
    pxi(g, hatch.x + hatch.w - 3, hatch.y + ((hatch.h / 2) | 0), 1, 1, "#e8c44a");
  }

  function buildDockAndShop() {
    const cx = 48 * TILE;
    const rest = restShoreY(cx + 64);
    const pier = { x: cx, y: rest - 8, w: 176, h: 20 };
    const shop = { x: pier.x + 10, y: pier.y - 51, w: 62, h: 52 };
    const door = { x: shop.x + 24, y: shop.y + shop.h - 10, w: 13, h: 10 };
    const hut = { x: shop.x + shop.w + 8, y: pier.y - 36, w: 32, h: 38 };
    const hutDoor = { x: hut.x + 12, y: hut.y + hut.h - 9, w: 8, h: 9 };
    const ramp = { x: pier.x - 2, y: pier.y - 16, w: 28, h: 26 };
    const finger = { x: pier.x + 96, y: rest + 6, w: 18, h: 88 };
    const boatA = { x: pier.x + 122, y: rest + 42, w: 64, h: 20 };
    const rowA = { x: pier.x + 108, y: rest + 14, w: 30, h: 10 };
    const rowB = { x: pier.x + 140, y: rest + 22, w: 26, h: 9 };
    const moorDeck = { x: pier.x + 6, y: pier.y + pier.h + 24, w: 76, h: 22 };
    const moorPlank = {
      x: moorDeck.x + ((moorDeck.w / 2) | 0) - 7,
      y: pier.y + pier.h - 4,
      w: 14,
      h: moorDeck.y + 4 - (pier.y + pier.h - 4),
    };
    const moorDoor = {
      x: moorDeck.x + ((moorDeck.w / 2) | 0) - 5,
      y: moorDeck.y + 7,
      w: 10,
      h: 7,
    };
    const moorHull = { x: moorDeck.x - 2, y: moorDeck.y, w: moorDeck.w + 4, h: moorDeck.h + 2 };
    moorSail = { x: moorDeck.x, y: moorDeck.y };
    dockWood.length = 0;
    dockWood.push(pier, finger);
    deckPads.length = 0;
    deckPads.push(pier, finger, ramp, moorDeck, moorPlank);
    walkPads.length = 0;
    islandSolids.length = 0;
    keepouts.length = 0;
    walkPads.push(pier, finger, boatA, rowA, rowB, ramp, moorDeck, moorPlank);
    walkPads.push({ x: door.x - 4, y: door.y, w: door.w + 8, h: pier.y + pier.h - door.y });
    walkPads.push({ x: hutDoor.x - 3, y: hutDoor.y, w: hutDoor.w + 6, h: pier.y + pier.h - hutDoor.y });
    islandSolids.push({ x: shop.x, y: shop.y, w: shop.w, h: shop.h - 10 });
    islandSolids.push({ x: shop.x, y: shop.y + shop.h - 10, w: door.x - shop.x, h: 6 });
    islandSolids.push({
      x: door.x + door.w,
      y: shop.y + shop.h - 10,
      w: shop.x + shop.w - (door.x + door.w),
      h: 6,
    });
    islandSolids.push({ x: hut.x, y: hut.y, w: hut.w, h: hut.h - 9 });
    islandSolids.push({ x: hut.x, y: hut.y + hut.h - 9, w: hutDoor.x - hut.x, h: 6 });
    islandSolids.push({
      x: hutDoor.x + hutDoor.w,
      y: hut.y + hut.h - 9,
      w: hut.x + hut.w - (hutDoor.x + hutDoor.w),
      h: 6,
    });
    shopDoor = { x: door.x, y: door.y, w: door.w, h: door.h + 8 };
    shopExit = { x: (SHOP_W / 2 - 7) | 0, y: SHOP_H - 10, w: 14, h: 10 };
    dockExit = { x: door.x + door.w + 10, y: pier.y + 4 };
    fishDoor = { x: hutDoor.x, y: hutDoor.y, w: hutDoor.w, h: hutDoor.h + 2 };
    fishExit = { x: (FISH_W / 2 - 6) | 0, y: FISH_H - 10, w: 12, h: 10 };
    fishDockExit = { x: hutDoor.x + hutDoor.w + 8, y: pier.y + 4 };
    cabinDoor = { x: moorDoor.x, y: moorDoor.y, w: moorDoor.w, h: moorDoor.h };
    cabinDockExit = { x: moorDeck.x + 8, y: pier.y + 4 };
    foamBlockers.length = 0;
    dockBlit.length = 0;
    foamBlockers.push(pier, finger, boatA, rowA, rowB, ramp, moorDeck, moorHull, moorPlank);
    foamBlockers.push({ x: shop.x, y: shop.y, w: shop.w, h: shop.h });
    foamBlockers.push({ x: hut.x, y: hut.y, w: hut.w, h: hut.h });
    foamBlockers.push({ x: pier.x - 2, y: pier.y + pier.h - 2, w: pier.w + 4, h: 26 });
    foamBlockers.push({ x: finger.x - 2, y: finger.y, w: finger.w + 6, h: finger.h + 22 });
    function padKeep(r, pad) {
      keepouts.push({ x: r.x - pad, y: r.y - pad, w: r.w + pad * 2, h: r.h + pad * 2 });
    }
    padKeep(shop, 24);
    padKeep(hut, 18);
    padKeep(pier, 18);
    padKeep(ramp, 16);
    padKeep(finger, 20);
    padKeep(boatA, 18);
    padKeep(rowA, 14);
    padKeep(rowB, 14);
    padKeep(moorHull, 10);
    dockBlit.push({ x: ramp.x, y: ramp.y, w: ramp.w + 4, h: ramp.h + 4 });
    dockBlit.push({ x: moorPlank.x - 2, y: moorPlank.y - 2, w: moorPlank.w + 4, h: moorPlank.h + 4 });
    dockBlit.push({ x: moorHull.x - 2, y: moorDeck.y - 2, w: moorHull.w + 4, h: moorHull.h + 6 });
    dockBlit.push({ x: pier.x - 2, y: pier.y - 2, w: pier.w + 4, h: pier.h + 28 });
    dockBlit.push({ x: finger.x - 2, y: finger.y - 2, w: finger.w + 6, h: finger.h + 24 });
    function paintDockBits(g) {
      paintPlanks(g, pier.x, pier.y, pier.w, pier.h, false);
      paintRamp(g, ramp.x, ramp.y, ramp.w, ramp.h);
      paintPlanks(g, finger.x, finger.y, finger.w, finger.h, true);
      for (let i = 0; i < 6; i++) {
        paintPost(g, pier.x + 8 + i * 28, rest + 6, 16 + (i & 1) * 5);
      }
      paintPost(g, finger.x + 1, rest + 78, 20);
      paintPost(g, finger.x + 15, rest + 84, 16);
      paintPlanks(g, moorPlank.x, moorPlank.y, moorPlank.w, moorPlank.h, true);
      pxi(g, moorPlank.x, moorPlank.y, 1, moorPlank.h, "#3a2414");
      pxi(g, moorPlank.x + moorPlank.w - 1, moorPlank.y, 1, moorPlank.h, "#3a2414");
      paintMooredBoat(g, moorDeck, moorDoor);
    }
    const g = landCanvas.getContext("2d");
    g.imageSmoothingEnabled = false;
    paintDockBits(g);
    for (let i = 0; i < 6; i++) {
      const postX = pier.x + 8 + i * 28;
      const postY = rest + 6;
      dockLamps.push({ x: postX, y: postY - 3 });
    }
    dockLamps.push({ x: finger.x + 1, y: rest + 75 });
    dockLamps.push({ x: finger.x + 15, y: rest + 81 });
    const deckLeft = Math.min(ramp.x, pier.x, finger.x, moorHull.x) - 2;
    const deckTop = Math.min(ramp.y, pier.y, finger.y, moorHull.y) - 2;
    const deckRight = Math.max(ramp.x + ramp.w, pier.x + pier.w, finger.x + finger.w, moorHull.x + moorHull.w) + 4;
    const deckBottom = Math.max(ramp.y + ramp.h, pier.y + pier.h, finger.y + finger.h, rest + 102, moorHull.y + moorHull.h) + 2;
    dockOX = deckLeft;
    dockOY = deckTop;
    dockOverlay = document.createElement("canvas");
    dockOverlay.width = Math.max(1, deckRight - deckLeft);
    dockOverlay.height = Math.max(1, deckBottom - deckTop);
    const og = dockOverlay.getContext("2d");
    og.imageSmoothingEnabled = false;
    og.setTransform(1, 0, 0, 1, -dockOX, -dockOY);
    paintDockBits(og);
    og.setTransform(1, 0, 0, 1, 0, 0);
    windowLights.length = 0;
    eaveShades.length = 0;
    windowLights.push({ x: shop.x + 12, y: shop.y + 29 });
    windowLights.push({ x: shop.x + shop.w - 14, y: shop.y + 29 });
    windowLights.push({ x: hut.x + 5, y: hut.y + 23 });
    eaveShades.push({ x: shop.x - 3, y: shop.y + 20, w: shop.w + 6, h: 4 });
    eaveShades.push({ x: hut.x - 2, y: hut.y + 16, w: hut.w + 4, h: 3 });
    const pad = 18;
    bldgOX = Math.min(shop.x, hut.x) - pad;
    bldgOY = Math.min(shop.y, hut.y) - 4;
    const bx1 = Math.max(shop.x + shop.w, hut.x + hut.w) + pad;
    const by1 = Math.max(shop.y + shop.h, hut.y + hut.h) + 14;
    bldgCanvas = document.createElement("canvas");
    bldgCanvas.width = bx1 - bldgOX;
    bldgCanvas.height = by1 - bldgOY;
    const bg = bldgCanvas.getContext("2d");
    bg.imageSmoothingEnabled = false;
    paintShopBuilding(bg, shop.x - bldgOX, shop.y - bldgOY, shop.w, shop.h, {
      x: door.x - bldgOX,
      y: door.y - bldgOY,
      w: door.w,
      h: door.h,
    });
    paintFishHut(bg, hut.x - bldgOX, hut.y - bldgOY, hut.w, hut.h, {
      x: hutDoor.x - bldgOX,
      y: hutDoor.y - bldgOY,
      w: hutDoor.w,
      h: hutDoor.h,
    });
    npcs.length = 0;
    npcs.push({ kind: "sailor", scene: "island", x: boatA.x + 8, y: boatA.y + 6, phase: rand(0, 6) });
    npcs.push({
      kind: "harbor",
      scene: "island",
      x: finger.x + ((finger.w / 2) | 0) - 3,
      y: finger.y + ((finger.h / 2) | 0) + 5,
      phase: 1.2,
    });
    harborDrop = { x: finger.x - 2, y: finger.y + finger.h + 8 };
    npcs.push({ kind: "keeper", scene: "shop", x: (SHOP_W / 2 - 3) | 0, y: 46, phase: 0.5 });
    npcs.push({ kind: "fisher", scene: "fish", x: (FISH_W / 2 - 3) | 0, y: 36, phase: 2.1 });
    npcs.push({ kind: "warden", scene: "cabin", x: CABIN_NPC_X, y: CABIN_NPC_Y, phase: 0.8 });
    for (let c = 0; c < COLS; c++) {
      if (islandCap(c) < 0.04) continue;
      const y = northCliffRow(c) * TILE;
      islandSolids.push({ x: c * TILE, y: y - 6, w: TILE, h: 12 });
    }
    boats.length = 0;
    boats.push({ x: boatA.x, y: boatA.y, w: boatA.w, h: boatA.h, kind: "big", phase: 0.2 });
    boats.push({ x: rowA.x, y: rowA.y, w: rowA.w, h: rowA.h, kind: "row", phase: 1.1 });
    boats.push({ x: rowB.x, y: rowB.y, w: rowB.w, h: rowB.h, kind: "row", phase: 2.4 });
    boats.push({ x: moorHull.x, y: moorHull.y, w: moorHull.w, h: moorHull.h, kind: "moored", phase: 0.4 });
    swimFish.length = 0;
    bakeShopInterior();
    bakeFishInterior();
    bakeCabinInterior();
    for (let i = palms.length - 1; i >= 0; i--) {
      const p = palms[i];
      if (p.x > shop.x - 20 && p.x < hut.x + hut.w + 20 && p.y > hut.y - 10 && p.y < pier.y + 24) {
        palms.splice(i, 1);
      }
    }
    for (let i = loot.length - 1; i >= 0; i--) {
      if (inKeepout(loot[i].x + 3, loot[i].y + 3)) loot.splice(i, 1);
    }
    placeBeachCrabs();
    player.x = pier.x + 48;
    player.y = pier.y + 4;
    doorCool = 0.6;
    spawnX = player.x;
    spawnY = player.y;
    placeSouthBeachLoot();
  }

  function beginFade(nextScene, spawn) {
    if (fadeMode) return;
    fadeMode = 1;
    fade = 0;
    fadeNext = { scene: nextScene, spawn };
  }

  function playerFootOk(nx, ny) {
    return canMove(nx, ny);
  }

  function unstickPlayer(x, y) {
    const ox = x | 0;
    const oy = y | 0;
    if (playerFootOk(ox, oy)) return { x: ox, y: oy };
    const tries = [
      [0, 6],
      [0, 10],
      [0, 14],
      [8, 8],
      [-8, 8],
      [12, 6],
      [-12, 6],
      [16, 8],
      [-16, 8],
      [0, -6],
      [0, -10],
      [6, 0],
      [-6, 0],
      [10, 12],
      [-10, 12],
    ];
    for (let i = 0; i < tries.length; i++) {
      const nx = ox + tries[i][0];
      const ny = oy + tries[i][1];
      if (playerFootOk(nx, ny)) return { x: nx, y: ny };
    }
    for (let r = 4; r <= 36; r += 4) {
      for (let a = 0; a < 12; a++) {
        const nx = (ox + Math.cos((a / 12) * Math.PI * 2) * r) | 0;
        const ny = (oy + Math.sin((a / 12) * Math.PI * 2) * r) | 0;
        if (playerFootOk(nx, ny)) return { x: nx, y: ny };
      }
    }
    return { x: ox, y: oy };
  }

  function enterScene(next) {
    if (scene === "island") islandHold = { x: player.x, y: player.y };
    scene = next.scene;
    const placed = unstickPlayer(next.spawn.x, next.spawn.y);
    player.x = placed.x;
    player.y = placed.y;
    player.inWater = false;
    player.submerged = 0;
    player.facing = next.scene === "shop" || next.scene === "fish" || next.scene === "cabin" ? 1 : -1;
    if (next.scene === "cabin") player.aboard = false;
    doorCool = 0.85;
    camera.x = player.x + player.w / 2 - viewW / 2;
    camera.y = player.y + player.h / 2 - viewH * 0.36;
    clampCamera();
  }

  function updateFade(dt) {
    if (!fadeMode) return;
    if (fadeMode === 1) {
      fade += dt / 0.34;
      if (fade >= 1) {
        fade = 1;
        enterScene(fadeNext);
        fadeMode = 2;
      }
    } else {
      fade -= dt / 0.36;
      if (fade <= 0) {
        fade = 0;
        fadeMode = 0;
        fadeNext = null;
      }
    }
  }

  function playerHits(r) {
    const x0 = player.x + 1;
    const x1 = player.x + player.w - 1;
    const y0 = player.y + 3;
    const y1 = player.y + player.h - 1;
    return x0 < r.x + r.w && x1 > r.x && y0 < r.y + r.h && y1 > r.y;
  }

  function updateDoors(dt) {
    if (doorCool > 0) doorCool = Math.max(0, doorCool - dt);
    if (fadeMode || player.dead > 0 || doorCool > 0 || player.aboard || cabinCut.kind) return;
    if (scene === "island" && shopDoor && playerHits(shopDoor)) {
      beginFade("shop", { x: (SHOP_W / 2 - 4) | 0, y: SHOP_H - 48 });
    }
    if (scene === "island" && fishDoor && playerHits(fishDoor)) {
      beginFade("fish", { x: (FISH_W / 2 - 4) | 0, y: FISH_H - 40 });
    }
    if (scene === "shop" && shopExit && playerHits(shopExit)) {
      beginFade("island", { x: dockExit.x, y: dockExit.y });
    }
    if (scene === "fish" && fishExit && playerHits(fishExit)) {
      beginFade("island", { x: fishDockExit.x, y: fishDockExit.y });
    }
    if (scene === "island" && cabinDoor && playerHits(cabinDoor)) {
      beginFade("cabin", { x: cabinDoorX() + 2, y: CABIN_H - 42 });
    }
    if (scene === "cabin" && cabinExit && playerHits(cabinExit)) {
      beginFade("island", { x: cabinDockExit.x, y: cabinDockExit.y });
    }
  }

  function boatScreen(cpos, b, t) {
    const bob = Math.sin(t * 1.6 + b.phase) * 1.2;
    return { x: (b.x - cpos.x) | 0, y: (b.y - cpos.y + bob) | 0 };
  }

  function drawBoatHull(cpos, b, t) {
    const p = boatScreen(cpos, b, t);
    const x = p.x;
    const y = p.y;
    if (x < -70 || y < -24 || x > viewW + 10 || y > viewH + 10) return;
    if (b.kind === "big") {
      px(x + 4, y + 8, b.w - 8, 8, "#5a3420");
      px(x + 2, y + 6, b.w - 4, 4, "#8a5a32");
      px(x + 8, y + 4, b.w - 16, 3, "#a07448");
      px(x + 6, y + 10, b.w - 12, 1, "#3a2414");
    } else {
      px(x + 2, y + 4, b.w - 4, 4, "#6b3f1f");
      px(x + 4, y + 3, b.w - 8, 2, "#9a6840");
      px(x + 1, y + 6, b.w - 2, 2, "#4a2e16");
    }
  }

  function drawBoatSail(cpos, b, t) {
    if (b.kind !== "big") return;
    const p = boatScreen(cpos, b, t);
    const x = p.x;
    const y = p.y;
    if (x < -70 || y < -24 || x > viewW + 10 || y > viewH + 10) return;
    px(x + 36, y - 16, 2, 22, "#4a2e16");
    for (let row = 0; row < 12; row++) {
      const span = 2 + ((row * 8) / 12) | 0;
      const col = row & 1 ? "#d4c09a" : "#c4a070";
      px(x + 38, y - 15 + row, span, 1, col);
    }
    px(x + 38, y - 4, 9, 1, "#8a5a32");
  }

  function drawMooredSail(cpos) {
    if (!moorSail) return;
    const x = (moorSail.x - cpos.x) | 0;
    const y = (moorSail.y - cpos.y) | 0;
    const mx = x + 58;
    const top = y - 16;
    px(mx, top, 2, 26, "#4a2e16");
    px(mx, top, 2, 1, "#2a1810");
    px(mx, y + 8, 2, 2, "#6b3f1f");
    for (let row = 0; row < 12; row++) {
      const span = 2 + ((row * 8) / 12) | 0;
      const col = row & 1 ? "#d4c09a" : "#c4a070";
      px(mx + 2, top + 2 + row, span, 1, col);
    }
    px(mx + 2, top + 13, 9, 1, "#8a5a32");
    px(mx + 3, top + 3, 1, 1, "#f3e2c4");
  }

  function drawMooredSailLit(cpos) {
    if (!moorSail || scene !== "island") return;
    const x = moorSail.x - cpos.x;
    const y = moorSail.y - cpos.y;
    drawLitRegion(cpos, { x: x + 54, y: y - 18, w: 22, h: 34 }, null, () => drawMooredSail(cpos));
  }

  function withSkiffXform(cpos, b, t, fn) {
    const bob = skiffBob(b, t);
    const x = b.x - cpos.x + b.w / 2;
    const y = b.y - cpos.y + b.h + bob;
    ink.save();
    ink.translate(x, y);
    ink.rotate(b.tilt || 0);
    ink.scale(b.face || 1, 1);
    fn(-b.w / 2, -b.h, b);
    ink.restore();
  }

  function drawSkiffHull(cpos, b, t) {
    withSkiffXform(cpos, b, t, (ox, oy, boat) => {
      px(ox + 2, oy + 5, boat.w - 4, 4, "#c4a070");
      px(ox + 1, oy + 6, boat.w - 2, 3, "#8a6a42");
      px(ox, oy + 7, boat.w, 2, "#5a4028");
      px(ox + 3, oy + 5, boat.w - 8, 2, "#6b4e30");
    });
  }

  function drawSkiffRails(cpos, b, t) {
    withSkiffXform(cpos, b, t, (ox, oy, boat) => {
      px(ox + 1, oy + 4, boat.w - 2, 1, "#3a2414");
      px(ox + 2, oy + 3, boat.w - 6, 1, "#6b3f1f");
      px(ox + boat.w - 5, oy + 4, 5, 3, "#e8d5a8");
      px(ox, oy + 7, boat.w, 2, "#5a4028");
      px(ox + 4, oy + 8, 3, 1, "#4a3420");
      px(ox + boat.w - 8, oy + 8, 3, 1, "#4a3420");
      px(ox + 5, oy + 7, 1, 3, "#5a4028");
      px(ox + boat.w - 7, oy + 7, 1, 3, "#5a4028");
    });
  }

  function drawSkiff(cpos, b, t) {
    drawSkiffHull(cpos, b, t);
    drawSkiffRails(cpos, b, t);
  }

  function drawRod(cpos) {
    if (rod.phase === "idle" || !ownedBoat || !player.aboard) return;
    const face = rod.face || player.facing;
    const px0 = Math.round(player.x + player.w / 2 - cpos.x);
    const py0 = Math.round(player.y + 4 - cpos.y);
    const tipX = px0 + face * 14;
    const tipY = py0 - 8;
    px(px0 + face * 2, py0, 1, 1, "#6b3f1f");
    for (let i = 0; i < 12; i++) {
      px(px0 + face * (2 + ((i * 12) / 12) | 0), py0 - ((i * 8) / 12) | 0, 1, 1, "#8a5a32");
    }
    const bobX = tipX + face * 10;
    const bobY = tipY + 16 + ((Math.sin(time * 9) * 1.4) | 0);
    ink.strokeStyle = "#d8e8f0";
    ink.lineWidth = 1;
    ink.beginPath();
    ink.moveTo(tipX + 0.5, tipY + 0.5);
    ink.lineTo(bobX + 0.5, bobY + 0.5);
    ink.stroke();
    const bite = rod.phase === "reel" && rod.bit;
    px(bobX, bobY, 2, 2, bite ? "#e04a32" : "#e8c44a");
    px(bobX, bobY + 1, 2, 1, "#8a2018");
  }

  function drawHarborBubble(cpos, t) {
    if (scene !== "island") return;
    const n = harborNpc();
    if (!n) return;
    const mid = playerCenter();
    const near = Math.hypot(mid.x - (n.x + 3), mid.y - (n.y + 2)) < 72;
    if (!near && harborTalk <= 0) return;
    const bob = (Math.sin(t * 2.2 + n.phase) * 1.1) | 0;
    const nx = (n.x - cpos.x) | 0;
    const ny = (n.y - cpos.y + bob) | 0;
    if (harborTalk > 0) {
      const msg = "CAN'T AFFORD";
      const w = pixTextWidth(msg) + 10;
      const bx = nx - (w / 2 | 0) + 3;
      const by = ny - 28;
      drawBubbleFrame(bx, by, w, 14, nx + 1);
      drawPixText(msg, nx + 3, by + 4, "#8a2018", "center");
      return;
    }
    if (ownedBoat || boatThrow) return;
    const w = 44;
    const h = 16;
    const bx = nx - 16;
    const by = ny - 32;
    drawBubbleFrame(bx, by, w, h, nx + 1);
    px(bx + 4, by + 7, 10, 4, "#d4c08a");
    px(bx + 3, by + 8, 12, 2, "#6b4e30");
    px(bx + 12, by + 6, 3, 3, "#e8d5a8");
    drawCoinIcon(bx + 18, by + 4);
    drawPixText("10", bx + 28, by + 5, "#3a2414");
  }

  function drawNpc(cpos, n, t) {
    if (n.scene && n.scene !== scene) return;
    const bob = ((Math.sin(t * 2.2 + n.phase) * 1.1) | 0);
    const x = (n.x - cpos.x) | 0;
    const y = (n.y - cpos.y + bob) | 0;
    if (x < -8 || y < -16 || x > viewW + 8 || y > viewH + 8) return;
    if (n.kind === "goblin") {
      px(x + 1, y - 11, 5, 2, "#246024");
      px(x + 1, y - 9, 5, 4, "#3a8a3a");
      px(x + 2, y - 8, 1, 1, "#201010");
      px(x + 4, y - 8, 1, 1, "#201010");
      px(x, y - 5, 7, 5, "#2a6a2a");
      px(x + 1, y, 2, 3, "#1a4018");
      px(x + 4, y, 2, 3, "#1a4018");
    } else if (n.kind === "sailor") {
      px(x + 1, y - 13, 5, 2, "#3a2414");
      px(x, y - 12, 7, 1, "#2a1810");
      px(x + 1, y - 11, 5, 4, "#e8c39a");
      px(x + 2, y - 10, 1, 1, "#201010");
      px(x + 4, y - 9, 1, 1, "#d4a07a");
      px(x, y - 7, 7, 6, "#2a4a78");
      px(x + 1, y - 6, 5, 3, "#3a6a9a");
      px(x + 2, y - 5, 3, 1, "#c9a227");
      px(x + 1, y, 2, 3, "#3a2414");
      px(x + 4, y, 2, 3, "#3a2414");
    } else if (n.kind === "harbor") {
      px(x + 1, y - 13, 5, 2, "#2a4a28");
      px(x, y - 12, 7, 1, "#1a3018");
      px(x + 1, y - 11, 5, 4, "#e8c39a");
      px(x + 2, y - 10, 1, 1, "#201010");
      px(x + 4, y - 9, 1, 1, "#d4a07a");
      px(x, y - 7, 7, 6, "#6b4e30");
      px(x + 1, y - 6, 5, 3, "#8a6a42");
      px(x + 2, y - 5, 3, 1, "#c9a227");
      px(x - 1, y - 4, 2, 2, "#c4a070");
      px(x + 1, y, 2, 3, "#3a2414");
      px(x + 4, y, 2, 3, "#3a2414");
    } else if (n.kind === "fisher") {
      px(x + 1, y - 13, 5, 2, "#1a4864");
      px(x, y - 12, 7, 1, "#0e3048");
      px(x + 1, y - 11, 5, 4, "#e8c39a");
      px(x + 2, y - 10, 1, 1, "#201010");
      px(x + 4, y - 9, 1, 1, "#d4a07a");
      px(x, y - 7, 7, 6, "#2a6a88");
      px(x + 1, y - 6, 5, 3, "#3a9ad4");
      px(x + 6, y - 5, 3, 2, "#e8c44a");
      px(x + 1, y, 2, 3, "#3a2414");
      px(x + 4, y, 2, 3, "#3a2414");
    } else if (n.kind === "warden") {
      const magic = cabinCut.kind === "magic" && cabinCut.t > 0.22;
      px(x + 1, y - 14, 5, 2, "#141820");
      px(x, y - 13, 7, 2, "#1c2430");
      px(x + 1, y - 11, 5, 4, "#d8c4a8");
      px(x + 2, y - 10, 1, 1, magic ? "#ffffff" : "#201010");
      px(x + 4, y - 10, 1, 1, magic ? "#ffffff" : "#201010");
      if (magic) {
        px(x + 2, y - 8, 3, 1, "#8a3030");
        px(x - 3, y - 14, 2, 5, "#3a4a62");
        px(x + 7, y - 14, 2, 5, "#3a4a62");
        px(x - 4, y - 15, 2, 2, "#d8c4a8");
        px(x + 8, y - 15, 2, 2, "#d8c4a8");
      }
      px(x, y - 7, 7, 6, "#243044");
      px(x + 1, y - 6, 5, 3, "#3a4a62");
      px(x + 2, y - 5, 3, 1, "#c9a227");
      if (!magic) {
        px(x - 2, y - 5, 2, 3, "#3a4a62");
        px(x + 6, y - 5, 2, 3, "#d8c4a8");
      }
      px(x + 1, y, 2, 3, "#1a1814");
      px(x + 4, y, 2, 3, "#1a1814");
    } else {
      px(x + 1, y - 13, 5, 2, "#3a2414");
      px(x, y - 12, 7, 1, "#2a1810");
      px(x + 1, y - 11, 5, 4, "#e8c39a");
      px(x + 2, y - 10, 1, 1, "#201010");
      px(x, y - 7, 7, 6, "#5a3420");
      px(x + 1, y - 6, 5, 3, "#8a5a32");
      px(x + 6, y - 8, 4, 2, "#6b3f1f");
      px(x + 8, y - 10, 2, 3, "#8a5a32");
      px(x - 2, y - 4, 4, 3, "#c4a070");
      px(x + 1, y, 2, 3, "#2a4a78");
      px(x + 4, y, 2, 3, "#2a4a78");
    }
  }

  function drawTinyGem(x, y) {
    px(x + 2, y, 2, 1, "#7ff0ea");
    px(x + 1, y + 1, 4, 2, "#2ec9c0");
    px(x + 2, y + 3, 2, 1, "#1a8a86");
    px(x + 2, y + 2, 1, 1, "#e8ffff");
  }

  function drawTinyCrystal(x, y) {
    px(x + 2, y, 2, 1, "#7fd4f0");
    px(x + 1, y + 1, 4, 4, "#3aa0c8");
    px(x + 2, y + 2, 2, 3, "#9ae0ff");
    px(x + 3, y + 1, 1, 1, "#dff6ff");
  }

  function drawBubbleFrame(x, y, w, h, tailX) {
    px(x + 1, y, w - 2, h, "#f4ead4");
    px(x, y + 1, w, h - 2, "#f4ead4");
    px(x + 1, y, w - 2, 1, "#3a2414");
    px(x + 1, y + h - 1, w - 2, 1, "#3a2414");
    px(x, y + 1, 1, h - 2, "#3a2414");
    px(x + w - 1, y + 1, 1, h - 2, "#3a2414");
    px(x + 1, y + 1, 1, 1, "#3a2414");
    px(x + w - 2, y + 1, 1, 1, "#3a2414");
    px(x + 1, y + h - 2, 1, 1, "#3a2414");
    px(x + w - 2, y + h - 2, 1, 1, "#3a2414");
    px(tailX, y + h, 3, 2, "#f4ead4");
    px(tailX, y + h, 1, 2, "#3a2414");
    px(tailX + 2, y + h, 1, 2, "#3a2414");
    px(tailX, y + h + 2, 2, 1, "#3a2414");
  }

  function drawTinyJelly(x, y) {
    px(x + 1, y, 4, 2, "#e8b8f0");
    px(x, y + 1, 6, 2, "#c878d8");
    px(x + 1, y + 3, 1, 3, "#d898e8");
    px(x + 3, y + 3, 1, 4, "#f0d0f8");
    px(x + 5, y + 3, 1, 2, "#c878d8");
  }

  function drawTinyCatch(id, x, y) {
    if (
      id === "jelly" ||
      id === "jelly_green" ||
      id === "jelly_white" ||
      id === "jelly_gold" ||
      id === "jelly_rainbow"
    ) {
      let a = "#e8b8f0";
      let b = "#c878d8";
      if (id === "jelly_green") {
        a = "#8fdc78";
        b = "#3c8a34";
      } else if (id === "jelly_white") {
        a = "#f7fbff";
        b = "#c5d0de";
      } else if (id === "jelly_gold") {
        a = "#ffe08a";
        b = "#c9a227";
      } else if (id === "jelly_rainbow") {
        a = "#ff9ad4";
        b = "#6ad4ff";
      }
      px(x + 1, y, 4, 2, a);
      px(x, y + 1, 6, 2, b);
      px(x + 1, y + 3, 1, 3, a);
      px(x + 3, y + 3, 1, 4, id === "jelly_rainbow" ? "#9ef07a" : a);
      px(x + 5, y + 3, 1, 2, id === "jelly_rainbow" ? "#c9a227" : b);
      if (id === "jelly_gold") px(x + 2, y + 1, 1, 1, "#fff8d0");
      if (id === "jelly_rainbow") px(x + 3, y + 1, 1, 1, "#ffffff");
      return true;
    }
    if (id === "blowfish") {
      px(x + 1, y + 1, 5, 4, "#e8c878");
      px(x + 2, y, 3, 1, "#f4dca0");
      px(x, y + 2, 1, 2, "#c9a048");
      px(x + 6, y + 2, 1, 2, "#c9a048");
      px(x + 2, y + 5, 1, 1, "#8a6a28");
      px(x + 4, y + 5, 1, 1, "#8a6a28");
      px(x + 4, y + 2, 1, 1, "#1a1814");
      px(x + 1, y + 3, 1, 1, "#d08060");
      return true;
    }
    if (id === "catch_crab") {
      px(x, y + 2, 2, 2, "#e07040");
      px(x + 4, y + 2, 2, 2, "#e07040");
      px(x + 1, y + 3, 4, 3, "#c44828");
      px(x + 2, y + 4, 1, 1, "#f4a090");
      px(x, y + 1, 1, 2, "#8a3018");
      px(x + 5, y + 1, 1, 2, "#8a3018");
      return true;
    }
    if (id === "chest") {
      px(x, y + 2, 8, 5, "#8a5a32");
      px(x + 1, y + 1, 6, 2, "#c9a227");
      px(x + 3, y + 3, 2, 2, "#e8c44a");
      px(x, y + 6, 8, 1, "#4a2e16");
      return true;
    }
    if (id === "wand") {
      px(x + 2, y, 1, 8, "#4a3428");
      px(x + 1, y, 3, 2, "#2a2438");
      px(x + 2, y, 1, 1, "#6a5088");
      px(x + 2, y + 7, 1, 1, "#2a1c14");
      return true;
    }
    if (id === "cloak") {
      px(x, y + 1, 6, 2, "#1a2848");
      px(x, y + 3, 7, 4, "#243860");
      px(x + 1, y + 2, 4, 1, "#3a5080");
      px(x + 1, y + 6, 5, 1, "#141c30");
      return true;
    }
    if (id === "serpent_heart") {
      px(x + 1, y + 1, 2, 1, "#7ff0ea");
      px(x + 4, y + 1, 2, 1, "#7ff0ea");
      px(x, y + 2, 7, 2, "#2ec9c0");
      px(x + 1, y + 4, 5, 1, "#1a8a86");
      px(x + 2, y + 5, 3, 1, "#0e5a58");
      px(x + 2, y + 2, 1, 1, "#e8ffff");
      return true;
    }
    if (
      id === "cod" ||
      id === "trout" ||
      id === "salmon" ||
      id === "shark" ||
      id === "mini_shark" ||
      id === "megalodon" ||
      id === "fish_blue" ||
      id === "fish_gold" ||
      id === "fish_reef"
    ) {
      const pal = fishPalette(id);
      const w = id === "megalodon" ? 11 : id === "shark" ? 10 : id === "mini_shark" ? 8 : 7;
      px(x, y + 2, w, 3, pal.body);
      px(x + w - 2, y + 1, 3, 2, pal.tail);
      px(x + 2, y + 1, 3, 1, pal.hi);
      px(x + w - 4, y + 3, 1, 1, "#1a1814");
      if (id === "shark" || id === "mini_shark" || id === "megalodon") px(x + 3, y, 1, 2, pal.hi);
      if (id === "megalodon") {
        px(x + 1, y + 1, 2, 1, "#2a3038");
        px(x + 4, y + 4, 3, 1, "#3a444c");
      }
      return true;
    }
    return false;
  }

  function drawShopkeeperBubble(cpos, t) {
    if (!isIndoor()) return;
    const k = traderNpc();
    if (!k) return;
    const bob = (Math.sin(t * 2.2 + k.phase) * 1.1) | 0;
    const nx = (k.x - cpos.x) | 0;
    const ny = (k.y - cpos.y + bob) | 0;
    const thinking = shopTrade.phase === "think";
    const refuse = shopTrade.refuse > 0;
    if (thinking) {
      const w = 22;
      const h = 12;
      const bx = nx - 6;
      const by = ny - 32;
      drawBubbleFrame(bx, by, w, h, nx + 1);
      const dots = 1 + ((shopTrade.t * 3.2) | 0) % 3;
      for (let i = 0; i < dots; i++) {
        px(bx + 5 + i * 5, by + 5, 2, 2, "#3a2414");
      }
      return;
    }
    if (refuse) {
      const bx = nx - 4;
      const by = ny - 28;
      drawBubbleFrame(bx, by, 16, 12, nx + 1);
      px(bx + 5, by + 3, 1, 1, "#8a2018");
      px(bx + 9, by + 3, 1, 1, "#8a2018");
      px(bx + 6, by + 4, 3, 1, "#8a2018");
      px(bx + 5, by + 5, 1, 1, "#8a2018");
      px(bx + 9, by + 5, 1, 1, "#8a2018");
      px(bx + 6, by + 7, 4, 1, "#8a2018");
      return;
    }
    if (scene === "fish") {
      const page = ((t / 2.2) | 0) % Math.ceil(FISHER_MENU.length / 2);
      const top = FISHER_MENU[page * 2];
      const bot = FISHER_MENU[page * 2 + 1];
      const w = 86;
      const h = bot ? 26 : 16;
      const bx = nx - 30;
      const by = ny - (bot ? 46 : 34);
      drawBubbleFrame(bx, by, w, h, nx + 1);
      drawTinyCatch(top[0], bx + 3, by + 3);
      drawPixText(top[1], bx + 14, by + 4, "#3a2414");
      const topCoin = bx + 14 + pixTextWidth(top[1]) + 3;
      drawCoinIcon(topCoin, by + 4);
      drawPixText(String(FISH_TRADE[top[0]]), topCoin + 9, by + 4, "#3a2414");
      if (bot) {
        drawTinyCatch(bot[0], bx + 3, by + 14);
        drawPixText(bot[1], bx + 14, by + 15, "#3a2414");
        const botCoin = bx + 14 + pixTextWidth(bot[1]) + 3;
        drawCoinIcon(botCoin, by + 15);
        drawPixText(String(FISH_TRADE[bot[0]]), botCoin + 9, by + 15, "#3a2414");
      }
      return;
    }
    const w = 48;
    const h = 26;
    const bx = nx - 18;
    const by = ny - 46;
    drawBubbleFrame(bx, by, w, h, nx + 1);
    drawTinyCrystal(bx + 4, by + 4);
    drawCoinIcon(bx + 12, by + 4);
    drawPixText("25", bx + 22, by + 4, "#3a2414");
    drawTinyGem(bx + 4, by + 15);
    drawCoinIcon(bx + 12, by + 14);
    drawPixText("5", bx + 22, by + 15, "#3a2414");
  }

  function fishPalette(id) {
    if (id === "fish_gold" || id === "salmon") return { body: "#e8c44a", tail: "#8a6a18", hi: "#fff3c0" };
    if (id === "fish_reef" || id === "trout") return { body: "#e04a32", tail: "#8a2018", hi: "#f4a090" };
    if (id === "cod") return { body: "#c5d4dc", tail: "#7a8a94", hi: "#e8f0f4" };
    if (id === "megalodon") return { body: "#3a4854", tail: "#1a242c", hi: "#8a9aa8" };
    if (id === "shark" || id === "mini_shark") return { body: "#6a7a84", tail: "#3a4a52", hi: "#b8c4cc" };
    if (id === "blowfish") return { body: "#e8c878", tail: "#c9a048", hi: "#f4dca0" };
    return { body: "#3a9ad4", tail: "#1a6a9a", hi: "#7fd4f0" };
  }

  function drawSwimFish(cpos, t) {}

  function drawShopGoldSpark(cpos, t) {
    const spots = [
      [26, 96],
      [40, 98],
      [56, 94],
      [72, 100],
      [92, 96],
      [112, 98],
      [128, 94],
    ];
    for (let i = 0; i < spots.length; i++) {
      if (((t * 9 + i * 1.7) | 0) % 5 === 0) continue;
      const x = (spots[i][0] - cpos.x + ((Math.sin(t * 6 + i) * 2) | 0)) | 0;
      const y = (spots[i][1] - cpos.y - 1) | 0;
      px(x, y, 1, 1, i & 1 ? "#fff3c0" : "#e8c44a");
    }
  }

  function drawLand(cpos) {
    px(-1, -1, (viewW | 0) + 3, (viewH | 0) + 3, WATER_BLUE);
    if (!landCanvas) return;
    const sx = Math.max(0, cpos.x | 0);
    const sy = Math.max(0, cpos.y | 0);
    const sw = Math.min(WORLD_W - sx, Math.ceil(viewW) + 1);
    const sh = Math.min(WORLD_H - sy, Math.ceil(viewH) + 1);
    if (sw <= 0 || sh <= 0) return;
    ctx.drawImage(landCanvas, sx, sy, sw, sh, sx - cpos.x, sy - cpos.y, sw, sh);
  }

  function drawFoam(cpos, t) {
    const x0 = Math.max(0, cpos.x | 0);
    const x1 = Math.min(WORLD_W, Math.ceil(cpos.x + viewW));
    const flicker = (t * 2.1) | 0;
    for (let i = 0; i < FOAM_WAVES.length; i++) {
      const w = FOAM_WAVES[i];
      const flick = flicker + i * 3;
      for (let wx = x0; wx < x1; wx++) {
        let p = (t / w.period - wx * w.along + w.salt) % 1;
        if (p < 0) p += 1;
        const rest = shoreLut[wx];
        const crash =
          w.crash * (0.65 + 0.45 * (0.5 + 0.5 * Math.sin(t * 0.055 + w.salt * 8 + wx * 0.004)));
        let fy;
        let fa;
        let crashing = false;
        if (p < 0.46) {
          const u = p / 0.46;
          fy = rest + w.travel - u * u * w.travel;
          fa = 0.3 + u * 0.7;
        } else if (p < 0.66) {
          const u = (p - 0.46) / 0.2;
          const run = 1 - (1 - u) * (1 - u);
          fy = rest - run * crash;
          fa = 1;
          crashing = true;
        } else {
          const u = (p - 0.66) / 0.34;
          fy = rest - crash * (1 - u * u);
          fa = 0.5 * (1 - u);
          crashing = true;
        }
        if (fa < 0.08) continue;
        if (islandCap(wx / TILE) < 0.04) continue;
        const sx = wx - cpos.x;
        const cy = fy | 0;
        if (hitPad(wx, cy, foamBlockers)) continue;
        if (inRiverWater(wx, cy)) continue;
        const m = foamMask[(((cy + flick) & (FOAM_MASK_H - 1)) * FOAM_MASK_W + (wx & (FOAM_MASK_W - 1)))];
        if (m) {
          ctx.globalAlpha = fa;
          px(sx, cy - cpos.y, 1, 1, m === 2 ? "#ffffff" : "#e8f6ff");
        }
        if (crashing && fy < rest) {
          const mid = ((fy + rest) * 0.5) | 0;
          if (hitPad(wx, mid, foamBlockers) || inRiverWater(wx, mid)) continue;
          const m2 =
            foamMask[
              (((mid + flick + 11) & (FOAM_MASK_H - 1)) * FOAM_MASK_W + ((wx + 19) & (FOAM_MASK_W - 1)))
            ];
          if (m2) {
            ctx.globalAlpha = fa * 0.45;
            px(sx, mid - cpos.y, 1, 1, "#f4fbff");
          }
        }
      }
    }
    ctx.globalAlpha = 1;
  }

  function blitWorldRects(list, cpos) {
    if (!landCanvas) return;
    for (let i = 0; i < list.length; i++) {
      const r = list[i];
      const sx = Math.max(r.x, cpos.x | 0) | 0;
      const sy = Math.max(r.y, cpos.y | 0) | 0;
      const sw = Math.min(r.x + r.w, (cpos.x + viewW) | 0) - sx;
      const sh = Math.min(r.y + r.h, (cpos.y + viewH) | 0) - sy;
      if (sw <= 0 || sh <= 0) continue;
      ctx.drawImage(landCanvas, sx, sy, sw, sh, sx - cpos.x, sy - cpos.y, sw, sh);
    }
  }

  function drawBuildingsOverDock(cpos) {
    if (!bldgCanvas) return;
    ctx.drawImage(
      bldgCanvas,
      0,
      0,
      bldgCanvas.width,
      bldgCanvas.height,
      bldgOX - cpos.x,
      bldgOY - cpos.y,
      bldgCanvas.width,
      bldgCanvas.height
    );
  }

  function drawDockOverFoam(cpos) {
    blitWorldRects(dockBlit, cpos);
    drawBuildingsOverDock(cpos);
  }

  function drawDockOverlay(cpos) {
    if (!dockOverlay) return;
    ctx.drawImage(dockOverlay, dockOX - cpos.x, dockOY - cpos.y);
  }

  function drawRocks(cpos) {
    for (const rock of rocks) {
      const x = rock.x - cpos.x;
      const y = rock.y - cpos.y;
      if (x < -12 || y < -12 || x > viewW || y > viewH) continue;
      px(x + 1, y + 1, 6, 3, "#4a4741");
      px(x, y + 2, 7, 3, "#3a3834");
      px(x + 2, y + 2, 2, 1, "#6f6a62");
      if (hash(rock.x | 0, rock.y | 0) > 0.5) px(x + 4, y + 1, 1, 1, "#5c5850");
    }
  }

  function drawPalm(x, y, s) {
    const h = (12 * s) | 0;
    px(x + 7, y - h, 2, h, "#6b3f1f");
    px(x + 8, y - h + 1, 1, Math.max(4, h - 3), "#8a5428");
    px(x + 3, y - h - 2, 5, 2, "#2f7a32");
    px(x + 8, y - h - 2, 5, 2, "#2f7a32");
    px(x + 5, y - h - 5, 6, 3, "#3d9444");
    px(x + 2, y - h + 1, 4, 2, "#2f7a32");
    px(x + 10, y - h + 1, 4, 2, "#2f7a32");
    px(x + 9, y - h + 3, 2, 2, "#c9a227");
  }

  function drawLeafTree(x, y, s) {
    const h = (8 + 8 * s) | 0;
    px(x + 3, y - h + 2, 2, h - 2, "#5a3a1c");
    px(x + 4, y - h + 3, 1, Math.max(3, h - 5), "#7a5228");
    const top = y - h;
    const dots = [
      [2, 0, "#2f7a32"],
      [3, -1, "#3d9444"],
      [4, -2, "#2f7a32"],
      [5, -1, "#4aa04a"],
      [6, 0, "#2a6a28"],
      [1, 1, "#2f7a32"],
      [7, 1, "#3d9444"],
      [2, 2, "#246824"],
      [6, 2, "#2f7a32"],
      [4, 1, "#5a9a44"],
      [3, 3, "#2f7a32"],
      [5, 3, "#246824"],
      [0, 2, "#3d9444"],
      [8, 2, "#2f7a32"],
    ];
    for (const d of dots) {
      if (s < 0.85 && (d[0] < 1 || d[0] > 7)) continue;
      px(x + d[0], top + d[1], 1, 1, d[2]);
    }
  }

  function drawPine(x, y, s) {
    const h = (10 + 6 * s) | 0;
    px(x + 3, y - 4, 2, 4, "#4a3420");
    px(x + 2, y - h + 4, 4, 2, "#2a5c1e");
    px(x + 1, y - h + 6, 6, 2, "#2f6a24");
    px(x + 2, y - h + 2, 4, 2, "#356e28");
    px(x + 3, y - h, 2, 2, "#3d9444");
    px(x + 4, y - h + 3, 1, 1, "#5a9a44");
  }

  function drawTrees(cpos) {
    for (const p of palms) {
      const x = p.x - cpos.x;
      const y = p.y - cpos.y;
      if (x < -20 || y < -28 || x > viewW || y > viewH + 8) continue;
      drawPalm(x, y, p.s || 1);
    }
    for (const tr of trees) {
      const x = tr.x - cpos.x;
      const y = tr.y - cpos.y;
      if (x < -16 || y < -28 || x > viewW || y > viewH + 8) continue;
      if (tr.kind === "pine") drawPine(x, y, tr.s);
      else drawLeafTree(x, y, tr.s);
    }
  }

  function drawBankReeds(cpos, t) {
    for (let i = 0; i < bankReeds.length; i++) {
      const r = bankReeds[i];
      const sway = Math.sin(t * 2.2 + r.phase) > 0 ? 1 : 0;
      const x = (r.x - cpos.x) | 0;
      const y = (r.y - cpos.y) | 0;
      if (x < -3 || y < -6 || x > viewW + 3 || y > viewH + 3) continue;
      const tip = r.kind === "lush" ? "#d2f08a" : r.kind === "dry" ? "#8a8a58" : "#9ed85a";
      const stem = r.kind === "dry" ? "#6a6840" : "#1f6a30";
      px(x, y, 1, 1, stem);
      px(x + (r.side || 1) * sway, y - 1, 1, 1, tip);
    }
  }

  function drawInsects(cpos, t) {
    for (let i = 0; i < insects.length; i++) {
      const b = insects[i];
      const x = (b.x + Math.sin(t * 1.7 + b.phase) * 7 - cpos.x) | 0;
      const y = (b.y + Math.cos(t * 2.4 + b.phase) * 4 - cpos.y) | 0;
      if (x < -4 || y < -4 || x > viewW + 4 || y > viewH + 4) continue;
      px(x, y, 1, 1, i & 1 ? "#1a1814" : "#2a2418");
      px(x + 1, y, 1, 1, "#f4ead0");
      if (((t * 8 + b.phase) | 0) & 1) px(x - 1, y - 1, 1, 1, "#e8c44a");
    }
  }

  function drawLoot(cpos) {
    for (const item of loot) {
      if (item.taken) continue;
      if ((item.scene || "island") !== scene) continue;
      const x = item.x - cpos.x;
      const y = item.y - cpos.y;
      if (x < -12 || y < -12 || x > viewW || y > viewH) continue;
      const fading =
        item.life !== Infinity && waveCycle - item.born >= item.life - 1;
      if (fading && ((time * 8) | 0) % 2 === 0) continue;
      px(x + 1, y + 5, 5, 1, "rgba(0,0,0,0.28)");
      if (item.id === "shell") {
        px(x + 1, y + 3, 5, 2, "#efe6d4");
        px(x + 2, y + 2, 4, 2, "#e8d5b8");
        px(x + 4, y + 3, 1, 1, "#c4a06c");
      } else if (item.id === "gem") {
        px(x + 2, y, 2, 1, "#7ff0ea");
        px(x + 1, y + 1, 4, 2, "#2ec9c0");
        px(x + 2, y + 3, 2, 1, "#1a8a86");
        px(x + 2, y + 2, 1, 1, "#e8ffff");
      } else if (item.id === "coin") {
        drawCoinIcon(x, y);
        if ((item.value | 0) >= 20) drawCoinIcon(x + 3, y - 2);
        else if ((item.value | 0) >= 5) drawCoinIcon(x + 2, y - 1);
      } else if (!drawTinyCatch(item.id, x, y)) {
        px(x + 2, y, 2, 1, "#f4fbff");
        px(x + 1, y + 1, 4, 4, "#9ae0ff");
        px(x + 2, y + 2, 2, 3, "#dff6ff");
        px(x + 3, y + 1, 1, 1, "#ffffff");
      }
    }
  }

  function drawPlayer(cpos) {
    const f = player.frame;
    const face = player.facing;

    ink.save();
    if (cloakOn) ink.globalAlpha = 0.06;
    if (player.aboard && ownedBoat && scene === "island") {
      const b = ownedBoat;
      const bob = skiffBob(b, time);
      ink.translate(b.x - cpos.x + b.w / 2, b.y - cpos.y + b.h + bob);
      ink.rotate(b.tilt || 0);
      ink.scale(b.face || 1, 1);
      ink.translate(0, -b.h + 7);
      if (face !== (b.face || 1)) ink.scale(-1, 1);
    } else {
      const x = Math.round(player.x - cpos.x);
      const y = Math.round(player.y - cpos.y);
      ink.translate(x + 4, y + player.h - 1);
      ink.scale(face, 1);
    }

    const step = player.moving ? (f % 2 === 0 ? 1 : -1) : 0;
    const hurt = player.hurt > 0;
    const shirt = hurt ? "#8a3a3a" : "#b8c4d4";
    const vest = hurt ? "#6a3038" : "#3a6a9a";
    px(-3, -13, 6, 2, "#c43a28");
    px(-2, -14, 4, 1, "#e04a32");
    px(-2, -12, 5, 1, "#8a2018");
    px(-2, -11, 5, 5, "#e8c39a");
    px(-1, -9, 1, 1, "#2a1810");
    px(1, -8, 1, 1, "#d4a07a");
    px(-3, -6, 6, 6, vest);
    px(-3, -6, 6, 2, shirt);
    px(-2, -4, 4, 3, vest);
    px(-2, -1, 4, 1, "#2a4a78");
    px(-5, -5, 2, 4, shirt);
    px(3, -5, 2, 4, vest);
    px(-5, -2, 2, 2, "#e8c39a");
    px(3, -2, 2, 2, "#e8c39a");
    if (player.aboard) {
      px(-3, 1, 2, 1, "#2a4a78");
      px(0, 1, 2, 1, "#2a4a78");
    } else {
      px(-3, 1, 2, 3 + step, "#2a4a78");
      px(0, 1, 2, 3 - step, "#2a4a78");
    }
    if (player.inWater && !player.aboard) {
      px(-5, 0, 10, 5, "rgba(40, 90, 140, 0.28)");
    }

    ink.restore();
  }

  function drawDigit(x, y, n, color) {
    const glyphs = [
      [1, 1, 1, 1, 0, 1, 1, 0, 1, 1, 0, 1, 1, 1, 1],
      [0, 1, 0, 1, 1, 0, 0, 1, 0, 0, 1, 0, 1, 1, 1],
      [1, 1, 1, 0, 0, 1, 1, 1, 1, 1, 0, 0, 1, 1, 1],
      [1, 1, 1, 0, 0, 1, 1, 1, 1, 0, 0, 1, 1, 1, 1],
      [1, 0, 1, 1, 0, 1, 1, 1, 1, 0, 0, 1, 0, 0, 1],
      [1, 1, 1, 1, 0, 0, 1, 1, 1, 0, 0, 1, 1, 1, 1],
      [1, 1, 1, 1, 0, 0, 1, 1, 1, 1, 0, 1, 1, 1, 1],
      [1, 1, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1],
      [1, 1, 1, 1, 0, 1, 1, 1, 1, 1, 0, 1, 1, 1, 1],
      [1, 1, 1, 1, 0, 1, 1, 1, 1, 0, 0, 1, 1, 1, 1],
    ];
    const g = glyphs[n % 10];
    for (let i = 0; i < 15; i++) {
      if (g[i]) px(x + (i % 3) * 2, y + ((i / 3) | 0) * 2, 2, 2, color);
    }
  }

  function drawHudIcon(id, sx, sy) {
    if (id === "shell") {
      px(sx + 6, sy + 10, 12, 6, "#efe6d4");
      px(sx + 8, sy + 8, 8, 6, "#e8d5b8");
      px(sx + 10, sy + 10, 4, 4, "#c4a06c");
    } else if (id === "gem") {
      px(sx + 10, sy + 6, 4, 2, "#7ff0ea");
      px(sx + 6, sy + 8, 12, 6, "#2ec9c0");
      px(sx + 10, sy + 14, 4, 2, "#1a8a86");
      px(sx + 10, sy + 10, 4, 2, "#e8ffff");
    } else if (!drawTinyCatch(id, sx + 4, sy + 6)) {
      px(sx + 10, sy + 4, 4, 2, "#f4fbff");
      px(sx + 8, sy + 6, 8, 12, "#9ae0ff");
      px(sx + 10, sy + 8, 4, 8, "#dff6ff");
    }
  }

  function drawCount(sx, sy, n) {
    if (n > 9) drawDigit(sx + 2, sy + 16, Math.floor(n / 10), "#f3e2c4");
    drawDigit(sx + 10, sy + 16, n % 10, "#f3e2c4");
  }

  function drawHeart(x, y, filled) {
    if (filled) {
      px(x + 1, y, 1, 1, "#f2d4d4");
      px(x, y + 1, 3, 1, "#e23b3b");
      px(x + 4, y + 1, 3, 1, "#e23b3b");
      px(x, y + 2, 7, 2, "#c81e1e");
      px(x + 1, y + 4, 5, 1, "#c81e1e");
      px(x + 2, y + 5, 3, 1, "#9a1414");
      px(x + 1, y + 2, 1, 1, "#f28b8b");
    } else {
      px(x, y + 1, 3, 1, "#3a2414");
      px(x + 4, y + 1, 3, 1, "#3a2414");
      px(x, y + 2, 7, 2, "#3a2414");
      px(x + 1, y + 4, 5, 1, "#3a2414");
      px(x + 2, y + 5, 3, 1, "#3a2414");
    }
  }

  function drawHearts(x0, y0) {
    for (let i = 0; i < MAX_HP; i++) {
      const hx = x0 + i * 8;
      const blink = player.hurt > 0 && player.hp === i && ((time * 12) | 0) % 2 === 0;
      drawHeart(hx, y0, i < player.hp && !blink);
    }
  }

  function drawCoinIcon(x, y) {
    px(x + 2, y, 3, 1, "#f3d56a");
    px(x + 1, y + 1, 5, 1, "#e8c44a");
    px(x, y + 2, 7, 3, "#c9a227");
    px(x + 1, y + 5, 5, 1, "#c9a227");
    px(x + 2, y + 6, 3, 1, "#8a6a18");
    px(x + 2, y + 1, 1, 1, "#fff3c0");
    px(x + 3, y + 2, 1, 3, "#fff1a8");
  }

  function drawCoins(x, y) {
    drawCoinIcon(x, y);
    drawPixText(String(player.coins | 0), x + 9, y, "#f3e2c4");
  }

  function drawDamage(uiW, uiH) {
    if (player.hurt <= 0 && player.dead <= 0 && !(player.inWater && player.submerged > 1.6)) return;
    const pulse = player.dead > 0 ? 0.55 : player.hurt > 0 ? player.hurt * 1.1 : 0.12 + Math.sin(time * 8) * 0.06;
    ctx.fillStyle = `rgba(140, 12, 18, ${Math.min(0.62, pulse)})`;
    px(0, 0, uiW, 6);
    px(0, uiH - 6, uiW, 6);
    px(0, 0, 6, uiH);
    px(uiW - 6, 0, 6, uiH);
    ctx.fillStyle = `rgba(160, 20, 28, ${Math.min(0.35, pulse * 0.6)})`;
    px(0, 0, uiW, uiH);
  }

  function drawWorldItem(id, x, y, s) {
    ctx.save();
    ctx.translate(x, y);
    ctx.scale(s, s);
    if (id === "shell") {
      px(-6, -2, 12, 6, "#efe6d4");
      px(-4, -4, 10, 6, "#e8d5b8");
      px(-1, -1, 4, 4, "#c4a06c");
    } else if (id === "gem") {
      px(-2, -8, 4, 3, "#7ff0ea");
      px(-6, -5, 12, 8, "#2ec9c0");
      px(-2, 3, 4, 3, "#1a8a86");
      px(-2, -2, 4, 3, "#e8ffff");
    } else if (id === "coin") {
      px(-3, -6, 6, 2, "#f3d56a");
      px(-5, -4, 10, 2, "#e8c44a");
      px(-6, -2, 12, 5, "#c9a227");
      px(-5, 3, 10, 2, "#c9a227");
      px(-3, 5, 6, 2, "#8a6a18");
      px(-2, -3, 2, 2, "#fff3c0");
      px(0, -1, 2, 5, "#fff1a8");
    } else if (!drawTinyCatch(id, -5, -5)) {
      px(-2, -10, 4, 3, "#f4fbff");
      px(-6, -7, 12, 14, "#9ae0ff");
      px(-2, -4, 4, 10, "#dff6ff");
      px(0, -8, 3, 3, "#ffffff");
    }
    ctx.restore();
  }

  function magicDropTarget(a) {
    if (a.dest === "miss") {
      const h = hudBarOrigin();
      return { x: h.x0 + h.barW * 0.5, y: h.y0 + h.slot };
    }
    return hudSlotPos(Math.min(MAX_SLOTS - 1, a.slot));
  }

  function drawMagicDrop(a) {
    const slot = magicDropTarget(a);
    const tt = a.t;
    let x;
    let y;
    let sc;
    let alpha;
    if (tt < 0.22) {
      const k = smoothstep(tt / 0.22);
      x = a.fromX;
      y = a.fromY + (1 - k) * 10;
      sc = 0.55 + k * 1.2;
      alpha = k;
    } else if (tt < 0.78) {
      const k = (tt - 0.22) / 0.56;
      x = a.fromX;
      y = a.fromY + Math.sin(k * Math.PI * 2) * 1.5;
      sc = 1.75;
      alpha = 1;
    } else {
      const k = smoothstep((tt - 0.78) / 0.64);
      const fall = k * k;
      x = a.fromX + (slot.x - a.fromX) * fall;
      y = a.fromY + (slot.y - a.fromY) * fall;
      sc = 1.75 + (1.05 - 1.75) * fall;
      alpha = a.dest === "miss" ? 1 - fall : 1;
    }
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.translate(x, y);
    drawWorldItem(a.id, 0, 0, sc);
    ctx.restore();
  }

  function drawPickupFx() {
    if (!pickupAnims.length) return;
    const uiW = canvas.width / SCALE_UI;
    const uiH = canvas.height / SCALE_UI;
    const cx = uiW / 2;
    const cy = uiH / 2 - 12;
    let titleName = "";
    let titleA = 0;
    for (let i = 0; i < pickupAnims.length; i++) {
      const a = pickupAnims[i];
      if (a.style === "drop") {
        drawMagicDrop(a);
        continue;
      }
      const slot = a.dest === "coins" ? hudCoinPos() : hudSlotPos(Math.min(MAX_SLOTS - 1, a.slot));
      const tt = a.t;
      let x;
      let y;
      let sc;
      let rot;
      let aTitle;
      if (tt < 0.42) {
        const u = smoothstep(tt / 0.42);
        x = a.fromX + (cx - a.fromX) * u;
        y = a.fromY + (cy - a.fromY) * u;
        sc = 1 + u * 1.6;
        rot = u * Math.PI * 4;
        aTitle = 0;
      } else if (tt < 1.12) {
        const u = (tt - 0.42) / 0.7;
        x = cx;
        y = cy + Math.sin(u * Math.PI * 2) * 1.5;
        sc = 2.6;
        rot = Math.PI * 4 + u * 0.35;
        aTitle = Math.min(1, u * 4);
      } else {
        const u = smoothstep((tt - 1.12) / 0.58);
        x = cx + (slot.x - cx) * u;
        y = cy + (slot.y - cy) * u;
        sc = 2.6 * (1 - u) + 1.1 * u;
        rot = (1 - u) * 0.35;
        aTitle = 1 - u;
      }
      if (aTitle > titleA) {
        titleA = aTitle;
        titleName = a.dest === "coins" ? "+" + (a.value | 0) + " coins" : ITEM_DEFS[a.id].name;
      }
      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(rot);
      drawWorldItem(a.id, 0, 0, sc);
      ctx.restore();
    }
    if (titleA > 0.05 && titleName) {
      const ty = uiH - 12;
      ctx.globalAlpha = titleA * 0.45;
      px((cx - pixTextWidth(titleName) / 2 - 4) | 0, ty - 3, pixTextWidth(titleName) + 8, 13, "#1a120c");
      ctx.globalAlpha = titleA;
      drawPixText(titleName, cx, ty, "#f3e2c4", "center");
      ctx.globalAlpha = 1;
    }
  }

  function drawHud() {
    const h = hudBarOrigin();
    const x0 = h.x0;
    const y0 = h.y0;
    const slot = h.slot;
    const gap = h.gap;
    const barW = h.barW;
    const barY = h.barY;
    const uiW = h.uiW;
    const uiH = h.uiH;
    for (let i = 0; i < MAX_SLOTS; i++) {
      const col = i % HUD_COLS;
      const row = (i / HUD_COLS) | 0;
      const sx = x0 + col * (slot + gap);
      const sy = y0 + row * (slot + h.rowGap);
      const stack = inventory[i];
      const wandPulse =
        serpent &&
        serpent.phase === "breach" &&
        stack &&
        stack.id === "wand" &&
        ((time * 10) | 0) % 2 === 0;
      const sel = i === heldSlot || wandPulse;
      px(sx, sy, slot, slot, sel ? "#c9a227" : "#2b1c12");
      px(sx + 1, sy + 1, slot - 2, slot - 2, sel ? "#f3e2c4" : "#2b1c12");
      px(sx + 2, sy + 2, slot - 4, slot - 4, wandPulse ? "#e8c44a" : "#5c3a21");
      px(sx + 4, sy + 4, slot - 8, slot - 8, "#1a120c");
      if (!stack) continue;
      drawHudIcon(stack.id, sx, sy);
      if (stack.count > 1) drawCount(sx, sy, stack.count);
    }

    const inner = barW - 4;
    let fillLevel = player.level;
    let fillXp = player.xp;
    let flash = 0;
    if (xpFx) {
      const u = smoothstep(Math.min(1, xpFx.t / 0.55));
      if (xpFx.leveled) {
        const need0 = xpNeeded(xpFx.fromLevel);
        if (u < 0.58) {
          fillLevel = xpFx.fromLevel;
          fillXp = xpFx.fromXp + (need0 - xpFx.fromXp) * (u / 0.58);
        } else {
          fillLevel = player.level;
          fillXp = player.xp * ((u - 0.58) / 0.42);
        }
        flash = Math.max(0, 1 - xpFx.t * 1.4);
      } else {
        fillXp = xpFx.fromXp + (player.xp - xpFx.fromXp) * u;
      }
    }
    const need = xpNeeded(fillLevel);
    const fill = Math.floor(inner * Math.max(0, Math.min(1, fillXp / need)));
    px(x0, barY, barW, 6, "#2b1c12");
    px(x0 + 2, barY + 2, inner, 2, "#3a2414");
    if (fill > 0) px(x0 + 2, barY + 2, fill, 2, flash > 0.15 ? "#ffe08a" : "#c9a227");
    if (flash > 0.2) {
      ctx.globalAlpha = flash * 0.55;
      px(x0, barY - 1, barW, 8, "#fff3c0");
      ctx.globalAlpha = 1;
    }
    if (xpFx) {
      const rise = Math.floor(xpFx.t * 18);
      const popA = Math.max(0, 1 - xpFx.t / 0.9);
      if (popA > 0.04) {
        ctx.globalAlpha = popA;
        drawPixText("+" + xpFx.amount + " XP", x0 + barW, y0 - 10 - rise, "#e8c44a", "right");
        ctx.globalAlpha = 1;
      }
      if (xpFx.leveled) {
        const luA = Math.max(0, 1 - Math.abs(xpFx.t - 0.35) / 0.45);
        if (luA > 0.05) {
          ctx.globalAlpha = luA;
          drawPixText("LEVEL UP", x0 + Math.floor(barW / 2), y0 - 18, "#fff1a8", "center");
          ctx.globalAlpha = 1;
        }
      }
    }
    drawHearts(x0, h.heartsY);
    drawCoins(x0 + MAX_HP * 8 + 11, h.heartsY);
    const msg = promptText();
    let naming = false;
    for (let i = 0; i < pickupAnims.length; i++) {
      if (pickupAnims[i].style === "drop") continue;
      const tt = pickupAnims[i].t;
      if (tt > 0.42 && tt < 1.12) naming = true;
    }
    if (msg && !naming) {
      drawPixText(msg, Math.floor(uiW * 0.42), uiH - 12, "#f3e2c4", "center");
    }
  }

  function drawCrabMound(x, y, c) {
    if (c.state !== "bury" && c.state !== "hidden" && c.state !== "unbury") return;
    const mound = c.mound || 0;
    if (mound < 0.08 && !(c.cover && c.cover.length)) return;
    if (mound > 0.18) px(x - 2, y, 5, 1, "#c9a56a");
    if (mound > 0.4) px(x - 1, y - 1, 3, 1, "#d8bc86");
    if (mound > 0.72) px(x, y - 2, 1, 1, "#e2c792");
    if (c.cover) {
      for (let s = 0; s < c.cover.length; s++) {
        const sp = c.cover[s];
        px(x + sp.ox, y + sp.oy, 1, 1, sp.c);
      }
    }
  }

  function drawCrabs(cpos) {
    if (scene !== "island") return;
    for (let i = 0; i < crabs.length; i++) {
      const c = crabs[i];
      const x = Math.round(c.x - cpos.x);
      const y = Math.round(c.y - cpos.y);
      if (x < -12 || y < -16 || x > viewW + 12 || y > viewH + 12) continue;
      drawCrabMound(x, y, c);
      const bury = c.bury || 0;
      const hop = (c.hop || 0) | 0;
      if (bury >= 0.94 && hop < 1) continue;
      const dy = y - hop + ((bury * (c.h + 2)) | 0);
      const dir = c.dir < 0 ? -1 : 1;
      const w = c.w;
      const hw = (w / 2) | 0;
      const leg = ((c.anim | 0) & 1) === 0 && c.state === "scuttle" ? 1 : 0;
      const body = w > 6 ? "#d45a28" : "#c44e24";
      const hi = "#e87840";
      const sh = "#8a3018";
      const p = (ox, oy, ww, hh, col) => {
        px(x + ox * dir - (dir < 0 ? ww : 0), dy + oy, ww, hh, col);
      };
      p(-hw, -1, w, 2, body);
      p(-hw + 1, -2, w - 2, 1, hi);
      p(-hw + 1, 1, w - 2, 1, sh);
      p(-1, -2, 1, 1, "#201010");
      p(1, -2, 1, 1, "#201010");
      p(-hw - 1, -2, 1, 1, hi);
      p(hw, -1, 1, 1, hi);
      p(-hw - 1, leg, 1, 1, sh);
      p(hw, 1 - leg, 1, 1, sh);
      p(-hw + 1, 2 - leg, 1, 1, sh);
      p(hw - 2, 1 + leg, 1, 1, sh);
    }
  }

  function drawSandBits(cpos) {
    for (let i = 0; i < MAX_SAND; i++) {
      const p = sandBits[i];
      if (p.life <= 0) continue;
      const x = Math.round(p.x - cpos.x);
      const y = Math.round(p.y - cpos.y);
      if (x < -2 || y < -2 || x > viewW + 2 || y > viewH + 2) continue;
      px(x, y, 1, 1, p.col);
    }
  }

  function fishOverDock(wx, wy) {
    if (hitPad(wx, wy, walkPads) || hitPad(wx, wy, foamBlockers)) return true;
    for (let i = 0; i < boats.length; i++) {
      const b = boats[i];
      if (wx >= b.x - 2 && wx <= b.x + b.w + 2 && wy >= b.y - 4 && wy <= b.y + b.h + 6) return true;
    }
    if (ownedBoat) {
      const b = ownedBoat;
      if (wx >= b.x - 2 && wx <= b.x + b.w + 2 && wy >= b.y - 4 && wy <= b.y + b.h + 6) return true;
    }
    return false;
  }

  function drawJumpSprite(kind, L, t, seed) {
    const pal = fishPalette(kind || "cod");
    const flap = Math.sin(t * 26 + seed) > 0 ? 1 : 0;
    const half = (L / 2) | 0;
    if (kind === "shark" || kind === "mini_shark") {
      px(-half, -1, L, 3, pal.body);
      px(-half + 2, -2, Math.max(3, L - 6), 1, pal.hi);
      px(half - 5, -5, 2, 4, pal.tail);
      px(half - 4, -6, 1, 2, pal.body);
      px(-half - 3, -2 - flap, 3, 1, pal.tail);
      px(-half - 4, flap, 4, 1, pal.tail);
      px(-half - 2, 1, 2, 1, pal.body);
      px(half - 2, -1, 1, 1, "#101418");
      px(2, 1, 2, 1, pal.tail);
      return;
    }
    const stripe = kind === "trout" || kind === "fish_reef";
    const spots = kind === "salmon" || kind === "fish_gold";
    px(-half, -1, Math.max(4, L - 1), 3, pal.body);
    px(-half + 1, -2, Math.max(3, L - 4), 1, pal.hi);
    if (stripe) {
      px(-1, -1, 1, 2, pal.tail);
      px(2, -1, 1, 2, pal.hi);
    }
    if (spots) {
      px(-2, 0, 1, 1, pal.hi);
      px(1, -1, 1, 1, "#fff3c0");
    }
    px(half - 2, -1, 1, 1, "#1a1814");
    px(half - 3, -2, 1, 1, pal.hi);
    px(-half - 2, -2 - flap, 3, 1, pal.tail);
    px(-half - 3, flap, 3, 2, pal.tail);
    px(0, -3, 1, 1, pal.tail);
    px(-1, 2, 2, 1, pal.tail);
  }

  function drawSharkFins(cpos) {
    for (let i = 0; i < sharkFins.length; i++) {
      const f = sharkFins[i];
      const foam = f.foam;
      for (let s = 0; s < foam.length; s++) {
        const p = foam[s];
        if (fishOverDock(p.x, p.y) || onIslandLand(p.x, p.y)) continue;
        const sx = (p.x - cpos.x) | 0;
        const sy = (p.y - cpos.y) | 0;
        if (sx < -2 || sy < -2 || sx > viewW + 2 || sy > viewH + 2) continue;
        px(sx, sy, 1, 1, p.col);
      }
      if ((f.sub || 0) >= 0.92) continue;
      if (fishOverDock(f.x, f.y) || onIslandLand(f.x, f.y)) continue;
      const h = f.big ? 6 : 4;
      const x = (f.x - cpos.x) | 0;
      const y = ((f.y - cpos.y) | 0) + (((f.sub || 0) * (h + 2)) | 0);
      if (x < -8 || y < -10 || x > viewW + 8 || y > viewH + 8) continue;
      px(x, y - h, 1, 1, "#1e282e");
      px(x - 1, y - h + 1, 2, 1, "#3a4a52");
      px(x - 1, y - h + 2, 3, 1, "#6a7a84");
      px(x - 2, y - h + 3, 4, 1, "#8a9aa4");
      px(x - 1, y - 1, 3, 1, "#2a343c");
      px(x + (f.dir > 0 ? 2 : -3), y - 2, 2, 1, "#b8c4cc");
      px(x - f.dir, y, 1, 1, "#d8f4ff");
    }
  }

  function drawFish(cpos, t) {
    if (!fishDaytime(t)) return;
    drawSharkFins(cpos);
    for (let i = 0; i < fishJumps.length; i++) {
      const f = fishJumps[i];
      if (!f.alive) continue;
      if (!fishWater(f.x, f.y)) continue;
      const kind = JUMP_KINDS.indexOf(f.kind) >= 0 ? f.kind : "cod";
      for (let k = 4; k >= 1; k--) {
        const u = f.u - k * 0.06;
        if (u <= 0.02) continue;
        const wx = bez(f.x0, f.x1, f.x2, u);
        const wy = bez(f.y0, f.y1, f.y2, u);
        if (!fishWater(wx, wy)) continue;
        const tx = wx - cpos.x;
        const ty = wy - cpos.y;
        const drop = k === 1 ? "#f4fcff" : k === 2 ? "#d8f4ff" : "#7ec8e0";
        px(tx | 0, ty | 0, 1, 1, drop);
        if (k < 3) px((tx + (k & 1 ? 1 : -1)) | 0, (ty + 1) | 0, 1, 1, "#b7e4f4");
      }
      const x = f.x - cpos.x;
      const y = f.y - cpos.y;
      if (x < -24 || y < -24 || x > viewW + 24 || y > viewH + 24) continue;
      ctx.save();
      ctx.translate(x, y);
      const lift = Math.sin(Math.min(1, f.u) * Math.PI);
      ctx.rotate(f.ang + (f.tumble || 0) * lift);
      ctx.scale(f.squash || 1, 2 - (f.squash || 1));
      drawJumpSprite(kind, f.len || 7, t, f.x0 || 0);
      ctx.restore();
    }
  }

  function drawSplashes(cpos) {
    const day = fishDaytime(time);
    for (let i = 0; i < MAX_SPLASH; i++) {
      const p = splashes[i];
      if (p.life <= 0) continue;
      if (p.fish && !day) continue;
      if (fishOverDock(p.x, p.y) || onIslandLand(p.x, p.y)) continue;
      const x = (p.x - cpos.x) | 0;
      const y = (p.y - cpos.y) | 0;
      if (x < -2 || y < -2 || x > viewW + 2 || y > viewH + 2) continue;
      ctx.globalAlpha = Math.max(0.45, p.life / (p.max || 0.3));
      px(x, y, 1, 1, p.col);
      if (p.life / (p.max || 0.3) > 0.55) px(x + (i & 1 ? 1 : -1), y, 1, 1, "#ffffff");
    }
    ctx.globalAlpha = 1;
  }

  const WORM_W = 160;
  const WORM_H = 90;
  let wormBuf = null;
  let wormPix = null;

  function drawFade() {
    if (fade <= 0.004) return;
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.imageSmoothingEnabled = false;
    const u = fade < 0 ? 0 : fade > 1 ? 1 : fade;
    if (u >= 0.985) {
      ctx.fillStyle = "#080406";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      return;
    }
    if (!wormBuf) {
      wormBuf = document.createElement("canvas");
      wormBuf.width = WORM_W;
      wormBuf.height = WORM_H;
      wormPix = wormBuf.getContext("2d");
    }
    const g = wormPix;
    g.clearRect(0, 0, WORM_W, WORM_H);
    const inward = fadeNext && (fadeNext.scene === "shop" || fadeNext.scene === "fish" || fadeNext.scene === "cabin");
    const cx = WORM_W * 0.5;
    const cy = WORM_H * 0.5;
    const maxR = Math.hypot(cx, cy);
    const hole = (1 - u) * (maxR + 6);
    const swirl = (inward ? 1 : -1) * (1.8 + u * 4.6);
    const ring = 4.2 + u * 5;
    for (let y = 0; y < WORM_H; y++) {
      for (let x = 0; x < WORM_W; x++) {
        const dx = x + 0.5 - cx;
        const dy = y + 0.5 - cy;
        const r = Math.hypot(dx, dy);
        const ang = Math.atan2(dy, dx) + (r / maxR) * swirl + u * 5.2;
        const twist = r + Math.sin(ang * 7) * (2.2 + u * 5);
        if (twist <= hole) continue;
        let col;
        if (twist > hole + ring) {
          const spec = hash(x + ((u * 18) | 0), y + ((u * 11) | 0));
          col = spec > 0.97 ? "#3a2414" : spec > 0.9 ? "#1a1010" : "#080406";
        } else {
          const band = ((ang * 3.2 + r * 0.35 + u * 9) | 0) & 3;
          if (band === 0) col = "#2a1814";
          else if (band === 1) col = "#6b3f1f";
          else if (band === 2) col = "#c4a070";
          else col = "#3a6a9a";
          if (((x + y + ((u * 12) | 0)) & 3) === 0) col = "#f4e0c0";
        }
        g.fillStyle = col;
        g.fillRect(x, y, 1, 1);
      }
    }
    ctx.drawImage(wormBuf, 0, 0, canvas.width, canvas.height);
    ctx.fillStyle = "rgba(8, 4, 6, " + (u * 0.42).toFixed(3) + ")";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  }

  const DAY_HOLD = 180;
  const DUSK_LEN = 25;
  const NIGHT_HOLD = 30;
  const DAWN_LEN = 35;
  const DAY_LEN = DAY_HOLD + DUSK_LEN + NIGHT_HOLD + DAWN_LEN;
  const DAY_SUN = [255, 250, 236];
  const NIGHT_SUN = [34, 44, 86];

  function clampByte(n) {
    n = n | 0;
    return n < 0 ? 0 : n > 255 ? 255 : n;
  }

  function worldDayT(t) {
    if (dayPausedAt != null) return dayPausedAt;
    return (t == null ? time : t) - dayOffset;
  }

  function pauseDayClock() {
    if (dayPausedAt != null) return;
    dayPausedAt = time - dayOffset;
  }

  function resumeDayClock() {
    if (dayPausedAt == null) return;
    dayOffset = time - dayPausedAt;
    dayPausedAt = null;
  }

  function dayClock(t) {
    let u = worldDayT(t) % DAY_LEN;
    if (u < 0) u += DAY_LEN;
    return u;
  }

  function isPureNight(t) {
    const u = dayClock(t);
    const nightAt = DAY_HOLD + DUSK_LEN;
    const dawnAt = nightAt + NIGHT_HOLD;
    return u >= nightAt && u < dawnAt;
  }

  function nightMix(t) {
    const u = dayClock(t);
    const duskAt = DAY_HOLD;
    const nightAt = DAY_HOLD + DUSK_LEN;
    const dawnAt = nightAt + NIGHT_HOLD;
    if (u < duskAt) return 0;
    if (u < nightAt) return smoothstep((u - duskAt) / DUSK_LEN);
    if (u < dawnAt) return 1;
    return 1 - smoothstep((u - dawnAt) / DAWN_LEN);
  }

  function fishDaytime(t) {
    return dayClock(t) < DAY_HOLD;
  }

  function sunSample(t) {
    const k = nightMix(t);
    const warm = Math.sin(Math.PI * k);
    return {
      r: DAY_SUN[0] + (NIGHT_SUN[0] - DAY_SUN[0]) * k + warm * 36,
      g: DAY_SUN[1] + (NIGHT_SUN[1] - DAY_SUN[1]) * k + warm * 8,
      b: DAY_SUN[2] + (NIGHT_SUN[2] - DAY_SUN[2]) * k - warm * 28,
    };
  }

  function lampAmount(t) {
    return nightMix(t);
  }

  function ambientAt(worldX, sun) {
    const e = eastness(worldX / TILE);
    const warmR = Math.min(255, sun.r + 12);
    const warmG = sun.g * 0.98;
    const warmB = sun.b * 0.78;
    const coolR = sun.r * 0.66;
    const coolG = sun.g * 0.78;
    const coolB = Math.min(255, sun.b * 0.92 + 22);
    const dim = 1 - e * 0.22;
    return [
      (warmR * (1 - e) + coolR * e) * dim,
      (warmG * (1 - e) + coolG * e) * dim,
      (warmB * (1 - e) + coolB * e) * dim,
    ];
  }

  const GLOW_LAMP = [
    [0.16, 220, 150, 70],
    [0.34, 120, 70, 28],
    [0.54, 48, 26, 12],
    [0.74, 16, 8, 4],
    [0.99, 4, 2, 1],
  ];
  const GLOW_WINDOW = [
    [0.18, 210, 150, 70],
    [0.4, 110, 64, 24],
    [0.64, 40, 22, 10],
    [0.99, 6, 3, 1],
  ];
  const GLOW_FEET = [
    [0.25, 90, 60, 28],
    [0.55, 28, 16, 8],
    [0.99, 4, 2, 1],
  ];
  const GLOW_CHEST = [
    [0.14, 255, 246, 214],
    [0.32, 220, 180, 90],
    [0.58, 90, 70, 30],
    [0.99, 12, 8, 4],
  ];
  const GLOW_CHEST_POOL = [
    [0.18, 160, 120, 48],
    [0.42, 70, 48, 18],
    [0.7, 24, 16, 8],
    [0.99, 4, 3, 2],
  ];
  const MAGIC_MOTE_COL = ["#fff6d0", "#9ee8ff", "#e8c44a", "#ffffff", "#b9f6ff", "#f3d56a", "#dff6ff"];
  const litRgb = [255, 255, 255];

  function makeGlowSprite(diam, bands) {
    const c = document.createElement("canvas");
    c.width = diam;
    c.height = diam;
    const g = c.getContext("2d");
    const img = g.createImageData(diam, diam);
    const cx = (diam - 1) * 0.5;
    const rad = diam * 0.5;
    const data = img.data;
    for (let y = 0; y < diam; y++) {
      for (let x = 0; x < diam; x++) {
        const dist = Math.hypot(x - cx, y - cx) / rad;
        const i = (y * diam + x) * 4;
        if (dist >= 1) continue;
        let col = bands[bands.length - 1];
        for (let b = 0; b < bands.length; b++) {
          if (dist <= bands[b][0]) {
            col = bands[b];
            break;
          }
        }
        data[i] = col[1];
        data[i + 1] = col[2];
        data[i + 2] = col[3];
        data[i + 3] = 255;
      }
    }
    g.putImageData(img, 0, 0);
    return c;
  }

  function ensureGlows() {
    if (glowLamp) return;
    glowLamp = makeGlowSprite(64, GLOW_LAMP);
    glowWindow = makeGlowSprite(46, GLOW_WINDOW);
    glowFeet = makeGlowSprite(30, GLOW_FEET);
    glowChest = makeGlowSprite(36, GLOW_CHEST);
    glowChestPool = makeGlowSprite(78, GLOW_CHEST_POOL);
  }

  function cabinLampPulse() {
    if (scene !== "cabin" || cabinCut.kind !== "magic") return 1;
    const u = cabinCut.t;
    const wave = 0.5 + 0.5 * Math.sin(u * 28);
    const wave2 = 0.5 + 0.5 * Math.sin(u * 47);
    let v = 0.7 + 0.3 * wave * (0.6 + 0.4 * wave2);
    const tick = u * 9;
    if (tick - Math.floor(tick) > 0.84) v = 0.6;
    if (u > 2.5) v = v + (1 - v) * Math.min(1, (u - 2.5) / 1.3);
    if (v < 0.6) v = 0.6;
    if (v > 1) v = 1;
    return v;
  }

  function cabinChestGlow() {
    if (cabinCut.kind !== "magic") return 0;
    const u = cabinCut.t;
    if (u < 0.28) return (u / 0.28) * 0.22;
    if (u < 1.2) return 0.22 + ((u - 0.28) / 0.92) * 0.78;
    if (u < 3.5) return 1;
    return Math.max(0, 1 - (u - 3.5) / 0.8);
  }

  function indoorLitBase(sun) {
    const pulse = cabinLampPulse();
    const r0 = Math.max(226, (248 * 0.82 + sun.r * 0.18) | 0);
    const g0 = Math.max(200, (220 * 0.82 + sun.g * 0.18) | 0);
    const b0 = Math.max(150, (168 * 0.82 + sun.b * 0.18) | 0);
    return {
      r: Math.max(148, (r0 * pulse) | 0),
      g: Math.max(128, (g0 * pulse) | 0),
      b: Math.max(96, (b0 * pulse) | 0),
      pulse,
    };
  }

  function beginLitFrame(cpos, t, indoor) {
    ensureGlows();
    const sun = sunSample(t);
    const lamps = lampAmount(t);
    const glows = [];
    if (indoor) {
      const lamp = indoorGlowAnchor();
      const base = indoorLitBase(sun);
      glows.push({ x: lamp.x, y: lamp.y, diam: 46, bands: GLOW_WINDOW, a: base.pulse });
      glows.push({ x: lamp.x, y: lamp.feet, diam: 30, bands: GLOW_FEET, a: base.pulse });
      if (scene === "cabin" && glowChest) {
        const chest = cabinChestGlow();
        if (chest > 0.02) {
          glows.push({
            x: cabinChestX + 8,
            y: cabinChestY + 6,
            diam: 36,
            bands: GLOW_CHEST,
            a: chest * 0.28,
          });
          glows.push({
            x: cabinChestX + 8,
            y: cabinChestY + 18,
            diam: 78,
            bands: GLOW_CHEST_POOL,
            a: chest * 0.2,
          });
        }
      }
      litFrame = {
        cpos,
        sun,
        lamps,
        indoor: true,
        glows,
        baseR: base.r,
        baseG: base.g,
        baseB: base.b,
      };
      return;
    }
    if (lamps > 0.001) {
      for (let i = 0; i < windowLights.length; i++) {
        glows.push({ x: windowLights[i].x, y: windowLights[i].y, diam: 46, bands: GLOW_WINDOW, a: lamps });
      }
    }
    if (lamps > 0.001) {
      for (let i = 0; i < dockLamps.length; i++) {
        const bob = (Math.sin(t * 7 + i * 1.7) * 1.2) | 0;
        glows.push({
          x: dockLamps[i].x + 1,
          y: dockLamps[i].y + bob,
          diam: 64,
          bands: GLOW_LAMP,
          a: lamps,
        });
      }
      glows.push({
        x: player.x + player.w / 2,
        y: player.y + player.h - 2,
        diam: 30,
        bands: GLOW_FEET,
        a: lamps,
      });
    }
    litFrame = { cpos, sun, lamps, indoor: false, glows };
  }

  function sampleSpriteLight(wx, wy, shade) {
    const F = litFrame;
    if (!F) {
      litRgb[0] = 255;
      litRgb[1] = 255;
      litRgb[2] = 255;
      return litRgb;
    }
    let r;
    let g;
    let b;
    if (F.indoor) {
      r = F.baseR;
      g = F.baseG;
      b = F.baseB;
    } else {
      const amb = ambientAt(wx, F.sun);
      const lum = (F.sun.r * 0.3 + F.sun.g * 0.59 + F.sun.b * 0.11) / 255;
      const dark = smoothstep((0.78 - lum) / 0.42);
      r = amb[0] + (Math.max(amb[0], 140) - amb[0]) * dark;
      g = amb[1] + (Math.max(amb[1], 136) - amb[1]) * dark;
      b = amb[2] + (Math.max(amb[2], 128) - amb[2]) * dark;
      const sx = wx - F.cpos.x;
      const sy = wy - F.cpos.y;
      for (let i = 0; i < eaveShades.length; i++) {
        const e = eaveShades[i];
        const ex = (e.x - F.cpos.x) | 0;
        const ey = (e.y - F.cpos.y) | 0;
        if (sx >= ex && sx < ex + e.w && sy >= ey && sy < ey + e.h) {
          r *= 150 / 255;
          g *= 142 / 255;
          b *= 132 / 255;
          break;
        }
      }
    }
    const glows = F.glows;
    for (let i = 0; i < glows.length; i++) {
      const s = glows[i];
      const dx = wx - s.x;
      const dy = wy - s.y;
      const reach = s.diam * 0.5 + 1;
      if (dx > reach || dy > reach || dx < -reach || dy < -reach) continue;
      const left = (s.x - F.cpos.x - s.diam * 0.5) | 0;
      const top = (s.y - F.cpos.y - s.diam * 0.5) | 0;
      const lx = wx - F.cpos.x - left;
      const ly = wy - F.cpos.y - top;
      const mid = (s.diam - 1) * 0.5;
      const dist = Math.hypot(lx - mid, ly - mid) / (s.diam * 0.5);
      if (dist >= 1) continue;
      const bands = s.bands;
      let col = bands[bands.length - 1];
      for (let k = 0; k < bands.length; k++) {
        if (dist <= bands[k][0]) {
          col = bands[k];
          break;
        }
      }
      r = Math.min(255, r + col[1] * s.a);
      g = Math.min(255, g + col[2] * s.a);
      b = Math.min(255, b + col[3] * s.a);
    }
    if (shade) {
      r = r * 0.42 + 10;
      g = g * 0.4 + 8;
      b = b * 0.48 + 12;
    }
    litRgb[0] = r < 0 ? 0 : r > 255 ? 255 : r;
    litRgb[1] = g < 0 ? 0 : g > 255 ? 255 : g;
    litRgb[2] = b < 0 ? 0 : b > 255 ? 255 : b;
    return litRgb;
  }

  function ensureSpr(w, h) {
    if (!sprCanvas) {
      sprCanvas = document.createElement("canvas");
      sprCtx = sprCanvas.getContext("2d", { willReadFrequently: true });
    }
    if (sprCanvas.width < w || sprCanvas.height < h) {
      sprCanvas.width = Math.max(sprCanvas.width, w, 1);
      sprCanvas.height = Math.max(sprCanvas.height, h, 1);
    }
    sprCtx.imageSmoothingEnabled = false;
  }

  function drawLitRegion(cpos, box, opt, drawFn) {
    const x = Math.floor(box.x);
    const y = Math.floor(box.y);
    const w = Math.ceil(box.w);
    const h = Math.ceil(box.h);
    if (w < 1 || h < 1 || w > 180 || h > 140) {
      drawFn();
      return;
    }
    if (x > viewW + 8 || y > viewH + 8 || x + w < -8 || y + h < -8) return;
    ensureSpr(w, h);
    const g = sprCtx;
    g.setTransform(1, 0, 0, 1, 0, 0);
    g.globalAlpha = 1;
    g.globalCompositeOperation = "source-over";
    g.clearRect(0, 0, w, h);
    g.setTransform(1, 0, 0, 1, -x, -y);
    const prev = ink;
    ink = g;
    drawFn();
    ink = prev;
    g.setTransform(1, 0, 0, 1, 0, 0);
    const shade = !!(opt && opt.shade);
    const img = g.getImageData(0, 0, w, h);
    const d = img.data;
    for (let py = 0; py < h; py++) {
      const wy = cpos.y + y + py;
      const row = py * w * 4;
      for (let px0 = 0; px0 < w; px0++) {
        const i = row + px0 * 4;
        if (d[i + 3] === 0) continue;
        const L = sampleSpriteLight(cpos.x + x + px0, wy, shade);
        d[i] = (d[i] * L[0]) / 255;
        d[i + 1] = (d[i + 1] * L[1]) / 255;
        d[i + 2] = (d[i + 2] * L[2]) / 255;
      }
    }
    g.setTransform(1, 0, 0, 1, 0, 0);
    g.putImageData(img, 0, 0);
    g.globalAlpha = 1;
    if (opt && opt.cover) {
      g.globalCompositeOperation = "destination-out";
      if (dockOverlay) g.drawImage(dockOverlay, dockOX - cpos.x - x, dockOY - cpos.y - y);
      if (bldgCanvas) g.drawImage(bldgCanvas, bldgOX - cpos.x - x, bldgOY - cpos.y - y);
      g.globalCompositeOperation = "source-over";
    }
    ctx.globalAlpha = 1;
    ctx.drawImage(sprCanvas, 0, 0, w, h, x, y, w, h);
  }

  function playerViewBox(cpos) {
    if (player.aboard && ownedBoat && scene === "island") {
      const b = ownedBoat;
      const bob = skiffBob(b, time);
      const sx = b.x - cpos.x + b.w / 2;
      const sy = b.y - cpos.y + b.h + bob;
      return { x: sx - 24, y: sy - b.h - 24, w: 48, h: b.h + 40 };
    }
    const sx = Math.round(player.x - cpos.x);
    const sy = Math.round(player.y - cpos.y);
    return { x: sx - 10, y: sy - 6, w: 28, h: 26 };
  }

  function rodViewBox(cpos) {
    const sx = Math.round(player.x + player.w / 2 - cpos.x);
    const sy = Math.round(player.y + 4 - cpos.y);
    return { x: sx - 32, y: sy - 24, w: 64, h: 48 };
  }

  function skiffViewBox(cpos, b, t) {
    const bob = skiffBob(b, t);
    const sx = b.x - cpos.x + b.w / 2;
    const sy = b.y - cpos.y + b.h + bob;
    const pad = 12;
    return { x: sx - b.w / 2 - pad, y: sy - b.h - pad - 4, w: b.w + pad * 2, h: b.h + pad * 2 + 8 };
  }

  function boatViewBox(cpos, b, t, sail) {
    const p = boatScreen(cpos, b, t);
    const top = sail ? 24 : 4;
    return { x: p.x - 6, y: p.y - top, w: b.w + 14, h: b.h + top + 10 };
  }

  function drawPlayerLit(cpos, shade) {
    drawLitRegion(cpos, playerViewBox(cpos), shade ? { shade: true, cover: true } : null, () => drawPlayer(cpos));
  }

  function drawRodLit(cpos, shade) {
    if (rod.phase === "idle" || !ownedBoat || !player.aboard) return;
    drawLitRegion(cpos, rodViewBox(cpos), shade ? { shade: true, cover: true } : null, () => drawRod(cpos));
  }

  function drawSkiffPart(cpos, b, t, hull, shade) {
    const opt = shade ? { shade: true, cover: true } : null;
    drawLitRegion(cpos, skiffViewBox(cpos, b, t), opt, () => {
      if (hull) drawSkiffHull(cpos, b, t);
      else drawSkiffRails(cpos, b, t);
    });
  }

  function drawBoatLit(cpos, b, t) {
    drawLitRegion(cpos, boatViewBox(cpos, b, t, false), null, () => drawBoatHull(cpos, b, t));
  }

  function drawBoatSailLit(cpos, b, t) {
    if (b.kind !== "big") return;
    drawLitRegion(cpos, boatViewBox(cpos, b, t, true), null, () => drawBoatSail(cpos, b, t));
  }

  function drawNpcLit(cpos, n, t) {
    if (n.scene && n.scene !== scene) return;
    const bob = (Math.sin(t * 2.2 + n.phase) * 1.1) | 0;
    const x = (n.x - cpos.x) | 0;
    const y = (n.y - cpos.y + bob) | 0;
    if (x < -24 || y < -28 || x > viewW + 24 || y > viewH + 24) return;
    drawLitRegion(cpos, { x: x - 8, y: y - 20, w: 24, h: 32 }, null, () => drawNpc(cpos, n, t));
  }

  function ensureLightCanvas() {
    const w = Math.max(1, Math.ceil(viewW));
    const h = Math.max(1, Math.ceil(viewH));
    if (!lightCanvas || lightCanvas.width !== w || lightCanvas.height !== h) {
      lightCanvas = document.createElement("canvas");
      lightCanvas.width = w;
      lightCanvas.height = h;
      lightCtx = lightCanvas.getContext("2d");
      lightCtx.imageSmoothingEnabled = false;
    }
  }

  function paintAmbient(cpos, sun) {
    const w = lightCanvas.width;
    const h = lightCanvas.height;
    const g = lightCtx;
    g.globalCompositeOperation = "source-over";
    g.globalAlpha = 1;
    let x = 0;
    while (x < w) {
      const col = ambientAt(cpos.x + x + 4, sun);
      const r0 = clampByte(col[0]);
      const g0 = clampByte(col[1]);
      const b0 = clampByte(col[2]);
      let x1 = Math.min(w, x + 8);
      while (x1 < w) {
        const n = ambientAt(cpos.x + x1 + 4, sun);
        if (
          Math.abs(clampByte(n[0]) - r0) > 4 ||
          Math.abs(clampByte(n[1]) - g0) > 4 ||
          Math.abs(clampByte(n[2]) - b0) > 4
        ) {
          break;
        }
        x1 = Math.min(w, x1 + 8);
      }
      g.fillStyle = "rgb(" + r0 + "," + g0 + "," + b0 + ")";
      g.fillRect(x, 0, x1 - x, h);
      x = x1;
    }
  }

  function stampGlow(sprite, wx, wy, cpos) {
    const x = wx - cpos.x - sprite.width * 0.5;
    const y = wy - cpos.y - sprite.height * 0.5;
    if (x > viewW || y > viewH || x + sprite.width < 0 || y + sprite.height < 0) return;
    lightCtx.drawImage(sprite, x | 0, y | 0);
  }

  function shadeEaves(cpos) {
    if (!eaveShades.length) return;
    lightCtx.save();
    lightCtx.globalCompositeOperation = "multiply";
    lightCtx.fillStyle = "rgb(150,142,132)";
    for (let i = 0; i < eaveShades.length; i++) {
      const r = eaveShades[i];
      lightCtx.fillRect((r.x - cpos.x) | 0, (r.y - cpos.y) | 0, r.w, r.h);
    }
    lightCtx.restore();
  }

  function drawLightSources(cpos, t, lamps) {
    if (lamps > 0.004) {
      ctx.globalAlpha = lamps;
      for (let i = 0; i < windowLights.length; i++) {
        const x = (windowLights[i].x - cpos.x - 2) | 0;
        const y = (windowLights[i].y - cpos.y - 2) | 0;
        px(x, y, 5, 4, "#ffd27a");
        px(x + 1, y + 1, 2, 1, "#fff6d0");
        px(x + 3, y + 2, 1, 1, "#e88830");
      }
      ctx.globalAlpha = 1;
    }
    for (let i = 0; i < dockLamps.length; i++) {
      const x = (dockLamps[i].x - cpos.x) | 0;
      const y = (dockLamps[i].y - cpos.y) | 0;
      px(x, y, 3, 2, "#3a2414");
      px(x, y + 2, 3, 2, "#5a4030");
      if (lamps <= 0.004) continue;
      ctx.globalAlpha = lamps;
      const flick = ((t * 9 + i * 2.1) | 0) & 1;
      px(x, y, 3, 1, "#2a1810");
      px(x, y + 1, 3, 3, flick ? "#ffb04a" : "#ffe08a");
      px(x + 1, y + 2, 1, 1, "#fff6d0");
      px(x, y + 4, 3, 1, "#3a2414");
      ctx.globalAlpha = 1;
    }
  }

  function drawWorldLight(cpos, t) {
    ensureGlows();
    ensureLightCanvas();
    beginLitFrame(cpos, t, false);
    const sun = litFrame.sun;
    const lamps = litFrame.lamps;
    paintAmbient(cpos, sun);
    shadeEaves(cpos);
    lightCtx.globalCompositeOperation = "lighter";
    lightCtx.globalAlpha = 1;
    if (lamps > 0.004) {
      lightCtx.globalAlpha = lamps;
      for (let i = 0; i < windowLights.length; i++) {
        stampGlow(glowWindow, windowLights[i].x, windowLights[i].y, cpos);
      }
      for (let i = 0; i < dockLamps.length; i++) {
        const bob = (Math.sin(t * 7 + i * 1.7) * 1.2) | 0;
        stampGlow(glowLamp, dockLamps[i].x + 1, dockLamps[i].y + bob, cpos);
      }
      stampGlow(glowFeet, player.x + player.w / 2, player.y + player.h - 2, cpos);
      lightCtx.globalAlpha = 1;
    }
    lightCtx.globalCompositeOperation = "source-over";
    ctx.save();
    ctx.globalCompositeOperation = "multiply";
    ctx.drawImage(lightCanvas, 0, 0);
    ctx.restore();
    const warmth = Math.max(0, (sun.r - Math.max(sun.g, sun.b)) / 220);
    if (warmth > 0.05) {
      ctx.save();
      ctx.globalAlpha = Math.min(0.28, warmth * 0.34);
      ctx.fillStyle =
        "rgb(" + clampByte(sun.r) + "," + clampByte(sun.g * 0.45) + "," + clampByte(sun.b * 0.2) + ")";
      ctx.fillRect(0, 0, viewW, viewH);
      ctx.restore();
    }
  }

  function drawIndoorLight(cpos) {
    ensureGlows();
    ensureLightCanvas();
    beginLitFrame(cpos, time, true);
    const sun = litFrame.sun;
    const g = lightCtx;
    g.globalCompositeOperation = "source-over";
    g.globalAlpha = 1;
    const base = indoorLitBase(sun);
    g.fillStyle = "rgb(" + base.r + "," + base.g + "," + base.b + ")";
    g.fillRect(0, 0, lightCanvas.width, lightCanvas.height);
    g.globalCompositeOperation = "lighter";
    const lamp = indoorGlowAnchor();
    g.globalAlpha = base.pulse;
    stampGlow(glowWindow, lamp.x, lamp.y, cpos);
    stampGlow(glowFeet, lamp.x, lamp.feet, cpos);
    if (scene === "cabin" && glowChest) {
      const chest = cabinChestGlow();
      if (chest > 0.02) {
        g.globalAlpha = chest;
        stampGlow(glowChest, cabinChestX + 8, cabinChestY + 5, cpos);
        g.globalAlpha = chest * 0.75;
        stampGlow(glowChestPool, cabinChestX + 8, cabinChestY + 16, cpos);
        g.globalAlpha = chest * 0.4;
        stampGlow(glowChestPool, cabinChestX + 8, cabinChestY + 28, cpos);
      }
    }
    g.globalAlpha = 1;
    g.globalCompositeOperation = "source-over";
    ctx.save();
    ctx.globalCompositeOperation = "multiply";
    ctx.drawImage(lightCanvas, 0, 0);
    ctx.restore();
  }

  function indoorGlowAnchor() {
    if (scene === "cabin") return { x: CABIN_W / 2, y: 22, feet: 72 };
    if (scene === "fish") return { x: FISH_W / 2, y: 22, feet: 50 };
    return { x: SHOP_W / 2, y: 22, feet: 64 };
  }

  function cabinMix(a, b, t) {
    return (a + (b - a) * t) | 0;
  }

  function drawCabinSea(cpos, t) {
    const day = fishDaytime(t);
    const k = day ? 0 : nightMix(t);
    const wr = cabinMix(26, 7, k);
    const wg = cabinMix(104, 14, k);
    const wb = cabinMix(150, 22, k);
    const water = "rgb(" + wr + "," + wg + "," + wb + ")";
    const hi = day ? "#3a8ab4" : "#121820";
    for (let i = 0; i < cabinPanes.length; i++) {
      const pane = cabinPanes[i];
      const x = pane.x - cpos.x;
      const y = pane.y - cpos.y;
      px(x, y, pane.w, pane.h, water);
      if (!day) continue;
      const s = (t * 8) | 0;
      for (let ix = 0; ix < pane.w; ix += 4) {
        const yy = y + ((ix * 3 + s + i * 5) % pane.h);
        px(x + ix, yy, 1, 1, hi);
      }
    }
    if (!day) return;
    for (let i = 0; i < cabinFish.length; i++) {
      const f = cabinFish[i];
      const pane = cabinPanes[f.pane];
      ctx.save();
      ctx.beginPath();
      ctx.rect(pane.x - cpos.x, pane.y - cpos.y, pane.w, pane.h);
      ctx.clip();
      if (f.dir < 0) {
        ctx.save();
        ctx.translate(((f.x - cpos.x) | 0) + 6, (f.y - cpos.y) | 0);
        ctx.scale(-1, 1);
        drawTinyCatch(f.id, 0, 0);
        ctx.restore();
      } else {
        drawTinyCatch(f.id, (f.x - cpos.x) | 0, (f.y - cpos.y) | 0);
      }
      ctx.restore();
    }
  }

  function cabinChestMotion() {
    if (!cabinCut.kind) return { lid: 0, jx: 0 };
    let jx = 0;
    if (cabinCut.kind === "classic" && cabinCut.mode === "open" && cabinCut.t < 0.5) {
      jx = Math.sin(cabinCut.t * 54) * 1.5;
    } else if (cabinCut.kind === "magic" && cabinCut.t < 1.2) {
      jx = Math.sin(cabinCut.t * 48) * (cabinCut.t < 0.55 ? 1.4 : 0.5);
    }
    return { lid: cabinCut.lid, jx };
  }

  function drawCabinChest(cpos) {
    const mot = cabinChestMotion();
    const x = (cabinChestX - cpos.x + mot.jx) | 0;
    const y = (cabinChestY - cpos.y) | 0;
    const lift = (mot.lid * 7) | 0;
    px(x, y - lift, 16, 5, "#a07838");
    px(x + 1, y + 1 - lift, 14, 2, "#e8c44a");
    px(x + 6, y + 2 - lift, 4, 2, "#fff3c0");
    if (mot.lid > 0.4 && cabinCut.kind === "classic") {
      px(x + 3, y + 3, 10, 2, "#f3d56a");
      px(x + 5, y + 2, 3, 1, "#fff1a8");
    }
    if (cabinCut.kind === "magic") {
      const g = cabinChestGlow();
      if (g > 0.08) {
        px(x + 7, y + 3, 2, 2, g > 0.55 ? "#fff6d4" : "#e8c44a");
        px(x + 6, y + 4, 1, 1, "#9ee8ff");
        px(x + 9, y + 4, 1, 1, "#f3d56a");
        if (g > 0.4) px(x + 7, y + 2, 2, 1, "#fffef8");
      }
    }
    px(x, y + 5, 16, 8, "#6b3f1f");
    px(x, y + 5, 16, 2, "#8a5a32");
    px(x + 1, y + 8, 14, 1, "#c9a227");
    px(x + 7, y + 8, 2, 2, "#e8c44a");
    px(x, y + 12, 16, 1, "#3a2414");
  }

  function drawChestSpill(cpos) {
    const g = cabinChestGlow();
    if (g < 0.04) return;
    const cx = (cabinChestX + 8 - cpos.x) | 0;
    const cy = (cabinChestY + 7 - cpos.y) | 0;
    ctx.save();
    ctx.globalCompositeOperation = "lighter";
    const rx = 24;
    for (let y = -5; y <= 20; y++) {
      const ny = y < 0 ? -y / 8 : y / 20;
      for (let x = -rx; x <= rx; x++) {
        const d = Math.sqrt((x / rx) * (x / rx) + ny * ny);
        if (d > 1) continue;
        const k = (1 - d) * (1 - d) * g;
        if (k < 0.07) continue;
        ctx.globalAlpha = k * 0.42;
        px(cx + x, cy + y, 1, 1, d < 0.22 ? "#fff4d2" : d < 0.5 ? "#e8b45c" : "#c08038");
      }
    }
    ctx.restore();
  }

  function drawCabinLampFlicker(cpos) {
    if (scene !== "cabin" || cabinCut.kind !== "magic") return;
    const p = cabinLampPulse();
    const hot = p > 0.86;
    const dim = p < 0.68;
    const jar = hot ? "#fff6d0" : dim ? "#8a6830" : "#e8c44a";
    const jx = (170 - cpos.x) | 0;
    const jy = (45 - cpos.y) | 0;
    px(jx + 2, jy, 3, 2, jar);
    px(jx + 3, jy, 1, 1, hot ? "#ffffff" : jar);
    const lx = ((CABIN_W / 2) - cpos.x) | 0;
    const ly = (18 - cpos.y) | 0;
    px(lx - 1, ly, 4, 2, hot ? "#ffe08a" : dim ? "#6a4818" : "#c9a24a");
    px(lx, ly, 2, 1, hot ? "#fff6d0" : "#a07830");
  }

  function magicMote(i, u, px0, py0) {
    const n = 11;
    const release = 0.62 + (i % 4) * 0.07;
    if (u < release) return null;
    const age = u - release;
    const ang0 = (i / n) * Math.PI * 2 + 0.35;
    const sx = cabinChestX + 8;
    const sy = cabinChestY + 4;
    const burst = 4 + 16 + (i % 5) * 5;
    if (age < 0.48) {
      const k = age / 0.48;
      const e = k * k;
      const dist = 4 + e * (burst - 4);
      return {
        x: sx + Math.cos(ang0) * dist,
        y: sy - e * 8 + Math.sin(ang0) * dist * 0.55,
        a: Math.min(1, k * 3),
      };
    }
    const burstX = sx + Math.cos(ang0) * burst;
    const burstY = sy - 8 + Math.sin(ang0) * burst * 0.55;
    const roam = age - 0.48;
    if (roam < 1.15) {
      const k = roam / 1.15;
      const roomAng = ang0 + k * Math.PI * 1.9;
      const rx = 98 + Math.cos(roomAng) * (44 + (i % 3) * 7);
      const ry = 76 + Math.sin(roomAng) * (20 + (i % 2) * 5);
      const blend = Math.min(1, k * 1.7);
      return {
        x: burstX + (rx - burstX) * blend,
        y: burstY + (ry - burstY) * blend,
        a: 1,
      };
    }
    const orbit = roam - 1.15;
    const roomAng = ang0 + Math.PI * 1.9;
    const rx = 98 + Math.cos(roomAng) * (44 + (i % 3) * 7);
    const ry = 76 + Math.sin(roomAng) * (20 + (i % 2) * 5);
    const orbitAng = ang0 + orbit * 3.6;
    const rad = 12 + (i % 3) * 4;
    const tx = px0 + Math.cos(orbitAng) * rad;
    const ty = py0 - 4 + Math.sin(orbitAng) * rad * 0.72;
    const gather = Math.min(1, orbit / 0.38);
    let a = 1;
    if (orbit > 1.05) a = Math.max(0, 1 - (orbit - 1.05) / 0.45);
    if (a <= 0.02) return null;
    return {
      x: rx + (tx - rx) * gather,
      y: ry + (ty - ry) * gather,
      a,
    };
  }

  function drawCabinMotes(cpos) {
    if (cabinCut.kind !== "magic") return;
    const mid = playerCenter();
    const u = cabinCut.t;
    for (let i = 0; i < 11; i++) {
      const m = magicMote(i, u, mid.x, mid.y);
      if (!m) continue;
      ctx.globalAlpha = m.a;
      px((m.x - cpos.x) | 0, (m.y - cpos.y) | 0, 1, 1, MAGIC_MOTE_COL[i % MAGIC_MOTE_COL.length]);
    }
    ctx.globalAlpha = 1;
  }

  function drawWardenMagic(cpos, t) {
    if (scene !== "cabin" || cabinCut.kind !== "magic" || cabinCut.t < 0.28) return;
    const n = cabinNpc();
    if (!n) return;
    const bob = (Math.sin(t * 2.2 + n.phase) * 1.1) | 0;
    const nx = (n.x - cpos.x) | 0;
    const ny = (n.y - cpos.y + bob) | 0;
    const bx = nx - 2;
    const by = ny - 32;
    drawBubbleFrame(bx, by, 16, 12, nx + 2);
    px(bx + 7, by + 2, 2, 5, "#ffffff");
    px(bx + 5, by + 4, 6, 1, "#fff6d0");
    px(bx + 4, by + 6, 2, 2, "#b9f6ff");
    px(bx + 10, by + 6, 2, 2, "#b9f6ff");
  }

  function ensureCloakBuf() {
    if (cloakBuf && cloakBuf.width === canvas.width && cloakBuf.height === canvas.height) return;
    cloakBuf = document.createElement("canvas");
    cloakBuf.width = canvas.width;
    cloakBuf.height = canvas.height;
    cloakCtx = cloakBuf.getContext("2d");
    cloakMask = document.createElement("canvas");
    cloakMask.width = canvas.width;
    cloakMask.height = canvas.height;
    cloakMaskCtx = cloakMask.getContext("2d");
  }

  function applyCloakVision(cpos, jx, jy) {
    ensureCloakBuf();
    cloakCtx.setTransform(1, 0, 0, 1, 0, 0);
    cloakCtx.clearRect(0, 0, canvas.width, canvas.height);
    cloakCtx.drawImage(canvas, 0, 0);
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.imageSmoothingEnabled = true;
    ctx.filter = "blur(7px)";
    ctx.drawImage(cloakBuf, 0, 0);
    ctx.filter = "none";
    ctx.imageSmoothingEnabled = false;
    ctx.fillStyle = "rgba(0,0,0,0.84)";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    const sx = (player.x + player.w / 2 - cpos.x) * zoom + jx;
    const sy = (player.y + player.h * 0.35 - cpos.y) * zoom + jy;
    const inner = TILE * 0.9 * zoom;
    const outer = TILE * 2.05 * zoom;
    const m = cloakMaskCtx;
    m.setTransform(1, 0, 0, 1, 0, 0);
    m.globalCompositeOperation = "source-over";
    m.clearRect(0, 0, canvas.width, canvas.height);
    m.drawImage(cloakBuf, 0, 0);
    m.globalCompositeOperation = "destination-in";
    const grad = m.createRadialGradient(sx, sy, inner, sx, sy, outer);
    grad.addColorStop(0, "rgba(0,0,0,1)");
    grad.addColorStop(0.42, "rgba(0,0,0,0.9)");
    grad.addColorStop(1, "rgba(0,0,0,0)");
    m.fillStyle = grad;
    m.fillRect(0, 0, canvas.width, canvas.height);
    m.globalCompositeOperation = "source-over";
    ctx.drawImage(cloakMask, 0, 0);
  }

  function chatCapturesInput() {
    return !!(chatOpen && chatFocused);
  }

  function syncPresenceActivity() {
    const api = lbApi();
    if (!api || typeof api.setPresenceActivity !== "function") return;
    let mode = "menu";
    let cat = null;
    if (uiScreen === "mode" || uiScreen === "account" || uiScreen === "nm_boards" || !playMode) {
      mode = "menu";
    } else if (playMode === "normal") {
      mode = "normal";
    } else if (playMode === "speedrun") {
      mode = "speedrun";
      if (uiScreen === "categories") cat = SPEED_ORDER[srCursor] || srCat;
      else cat = srCat;
    }
    api.setPresenceActivity(mode, cat);
  }

  function clearChatHits() {
    chatHits = [];
  }

  function addChatHit(key, x, y, w, h, onClick, meta) {
    chatHits.push({
      key: String(key),
      x: x | 0,
      y: y | 0,
      w: w | 0,
      h: h | 0,
      onClick,
      meta: meta || null,
    });
  }

  function hitChatAt(ux, uy) {
    for (let i = chatHits.length - 1; i >= 0; i--) {
      const h = chatHits[i];
      if (ux >= h.x && uy >= h.y && ux < h.x + h.w && uy < h.y + h.h) return h;
    }
    return null;
  }

  function loadChatNotifsPref() {
    try {
      const v = localStorage.getItem(CHAT_NOTIFS_KEY);
      if (v === "0" || v === "off" || v === "false") chatNotifsEnabled = false;
      else chatNotifsEnabled = true;
    } catch (e) {
      chatNotifsEnabled = true;
    }
  }

  function setChatNotifsEnabled(on) {
    chatNotifsEnabled = !!on;
    if (!chatNotifsEnabled) chatToast = null;
    try {
      localStorage.setItem(CHAT_NOTIFS_KEY, chatNotifsEnabled ? "1" : "0");
    } catch (e) {}
  }

  function chatMsgIsSelf(m) {
    if (!m) return false;
    const api = lbApi();
    const uid = api && api.currentUser && api.currentUser() ? api.currentUser().id : null;
    if (uid && m.user_id && String(uid) === String(m.user_id)) return true;
    const mine = chatPlayerName();
    if (mine && m.player_name && api && api.namesFuzzyMatch && api.namesFuzzyMatch(mine, m.player_name)) {
      return true;
    }
    return false;
  }

  function maybePushChatToast(msgs) {
    if (!msgs || !msgs.length) return;
    const last = msgs[msgs.length - 1];
    if (!last || !last.id) return;
    if (!chatNotifSeenId) {
      chatNotifSeenId = last.id;
      return;
    }
    if (last.id === chatNotifSeenId) return;
    // Walk newest → oldest for the freshest non-self toast candidate
    let toastMsg = null;
    for (let i = msgs.length - 1; i >= 0; i--) {
      const m = msgs[i];
      if (!m || !m.id) continue;
      if (m.id === chatNotifSeenId) break;
      if (chatMsgIsSelf(m)) continue;
      toastMsg = m;
      break;
    }
    chatNotifSeenId = last.id;
    if (!toastMsg || !chatNotifsEnabled) return;
    // Closed: always toast. Open: still toast others' messages.
    if (chatOpen && chatMsgIsSelf(toastMsg)) return;
    chatToast = {
      who: String(toastMsg.player_name || "?").slice(0, 8),
      isAcc: !!(toastMsg.is_account || toastMsg.user_id),
      text: String(toastMsg.body || "").slice(0, 28),
      until: performance.now() + 3500,
    };
  }

  function markChatRead() {
    const api = lbApi();
    const msgs = api && api.getChatMessages ? api.getChatMessages() : [];
    if (msgs.length) chatLastSeenId = msgs[msgs.length - 1].id || chatLastSeenId;
    chatUnread = 0;
  }

  function refreshChatUnread() {
    const api = lbApi();
    const msgs = api && api.getChatMessages ? api.getChatMessages() : [];
    maybePushChatToast(msgs);
    if (chatOpen) {
      markChatRead();
      return;
    }
    if (!msgs.length) {
      chatUnread = 0;
      return;
    }
    if (!chatLastSeenId) {
      chatLastSeenId = msgs[msgs.length - 1].id || "";
      chatUnread = 0;
      return;
    }
    let n = 0;
    for (let i = msgs.length - 1; i >= 0; i--) {
      if (msgs[i].id === chatLastSeenId) break;
      n++;
    }
    chatUnread = n;
  }

  function presenceCarouselSlice(list) {
    const arr = Array.isArray(list) ? list : [];
    if (arr.length <= CHAT_PRESENCE_SHOW) {
      chatPresenceOffset = 0;
      return arr;
    }
    const now = Date.now();
    if (!chatPresenceRotAt) chatPresenceRotAt = now;
    if (now - chatPresenceRotAt >= CHAT_PRESENCE_ROT_MS) {
      chatPresenceOffset = (chatPresenceOffset + 1) % arr.length;
      chatPresenceRotAt = now;
    }
    if (chatPresenceOffset >= arr.length) chatPresenceOffset = 0;
    const out = [];
    for (let i = 0; i < CHAT_PRESENCE_SHOW; i++) {
      out.push(arr[(chatPresenceOffset + i) % arr.length]);
    }
    return out;
  }

  function chatAuthorWidth(name, isAcc, maxLen) {
    const n = String(name || "?").slice(0, maxLen == null ? (isAcc ? 7 : 8) : maxLen);
    if (isAcc) return pixTextWidth(n.toUpperCase()) + 4;
    return pixTextWidth(n);
  }

  function clipPixText(text, x, y, color, maxW) {
    const s = String(text || "").toUpperCase();
    if (!s || maxW <= 0) return 0;
    let n = s.length;
    while (n > 0 && pixTextWidth(s.slice(0, n)) > maxW) n--;
    if (n <= 0) return 0;
    drawPixText(s.slice(0, n), x, y, color);
    return pixTextWidth(s.slice(0, n));
  }

  function toggleIslandChat() {
    chatOpen = !chatOpen;
    if (chatOpen) {
      chatFocused = true;
      chatScroll = 0;
      markChatRead();
      const api = lbApi();
      if (api && api.fetchChatMessages) api.fetchChatMessages().catch(() => {});
      nudgePresenceRefresh();
    } else {
      chatFocused = false;
      chatHoverTip = null;
    }
  }

  function closeIslandChat() {
    if (!chatOpen) return false;
    chatOpen = false;
    chatFocused = false;
    chatHoverTip = null;
    return true;
  }

  function chatPlayerName() {
    const api = lbApi();
    if (api && api.chatSenderName) return api.chatSenderName() || "";
    if (api && api.displayName) return api.displayName() || "";
    return "";
  }

  async function trySendChat() {
    if (chatSendBusy) return;
    const api = lbApi();
    if (!api || !api.sendChatMessage) {
      chatStatusNote = "NO CLIENT";
      return;
    }
    const name = chatPlayerName();
    if (!name) {
      chatStatusNote = "SET NAME IN ACCOUNT";
      return;
    }
    const body = api.sanitizeChatBody ? api.sanitizeChatBody(chatDraft) : String(chatDraft || "").trim().slice(0, 80);
    if (!body) return;
    chatSendBusy = true;
    chatStatusNote = "";
    const res = await api.sendChatMessage(body);
    chatSendBusy = false;
    if (res && res.ok) {
      chatDraft = "";
      chatScroll = 0;
      markChatRead();
    } else {
      const err = (res && res.error) || "fail";
      if (err === "set name") chatStatusNote = "SET NAME IN ACCOUNT";
      else if (err === "slow down") chatStatusNote = "WAIT…";
      else if (err === "setup" || (res && res.missing)) chatStatusNote = "RUN SETUP SQL";
      else chatStatusNote = String(err).toUpperCase().slice(0, 18);
    }
  }

  function typeIntoChat(rawKey) {
    if (!chatOpen || !chatFocused) return false;
    const ch = String(rawKey || "");
    if (!ch || ch.length !== 1) return false;
    if (ch === " ") {
      if (chatDraft.length < 80) chatDraft += " ";
      return true;
    }
    // Allow readable characters; sanitize on send
    if (chatDraft.length >= 80) return true;
    if (/[\u0000-\u001f\u007f]/.test(ch)) return true;
    chatDraft += ch;
    return true;
  }

  function backspaceChat() {
    if (!chatOpen || !chatFocused) return false;
    chatDraft = chatDraft.slice(0, -1);
    return true;
  }

  function wrapChatLines(text, maxChars) {
    const s = String(text || "");
    const max = Math.max(6, maxChars | 0);
    const out = [];
    let i = 0;
    while (i < s.length && out.length < 6) {
      out.push(s.slice(i, i + max));
      i += max;
    }
    return out.length ? out : [""];
  }

  function drawChatTooltip(label, x, y) {
    const s = String(label || "").toUpperCase().slice(0, 14);
    if (!s) return;
    const tw = pixTextWidth(s);
    let tx = (x | 0) - 2;
    let ty = (y | 0) - 12;
    const uiW = canvas.width / SCALE_UI;
    const uiH = canvas.height / SCALE_UI;
    if (tx + tw + 6 > uiW - 2) tx = uiW - tw - 8;
    if (tx < 2) tx = 2;
    if (ty < 2) ty = (y | 0) + 10;
    if (ty + 11 > uiH - 2) ty = uiH - 13;
    px(tx, ty, tw + 6, 11, "#3a2414");
    px(tx + 1, ty + 1, tw + 4, 9, "#c4a574");
    drawPixText(s, tx + 3, ty + 2, "#3a2414");
  }

  function drawChatUnreadPip() {
    if (chatOpen || chatUnread <= 0) return;
    const uiW = canvas.width / SCALE_UI;
    const uiH = canvas.height / SCALE_UI;
    const label = chatUnread > 9 ? "9+" : String(chatUnread);
    const tw = pixTextWidth(label);
    const w = Math.max(14, tw + 8);
    const x = uiW - w - 4;
    const y = uiH - 18;
    px(x, y, w, 12, "#3a2414");
    px(x + 1, y + 1, w - 2, 10, "#8a5a32");
    px(x + 2, y + 2, 3, 3, "#3ddc5a");
    drawPixText(label, x + 7, y + 3, "#f3e2c4");
  }

  function drawChatToast() {
    if (!chatToast) return;
    const now = performance.now();
    if (now >= chatToast.until) {
      chatToast = null;
      return;
    }
    const uiW = canvas.width / SCALE_UI;
    const left = chatToast.until - now;
    const alpha = left < 700 ? Math.max(0, left / 700) : 1;
    ctx.save();
    ctx.globalAlpha = alpha;
    // Top corner beside logged-in username HUD (or top-left if no chip)
    let x = 8;
    let y = 6;
    const api = lbApi();
    const showHud =
      api &&
      api.isSignedIn &&
      api.isSignedIn() &&
      (playMode === "speedrun" || playMode === "normal") &&
      !(uiBlocksPlay() && uiScreen !== "ready" && uiScreen !== "finish");
    if (showHud) {
      const name = (api.displayName && api.displayName()) || "PLAYER";
      let playMs = 0;
      if (api.totalPlaytimeMs) playMs = api.totalPlaytimeMs() | 0;
      else {
        const p = api.currentProfile && api.currentProfile();
        playMs = ((p && p.playtime_ms) || 0) + ((p && p.nm_playtime_ms) || 0);
      }
      const clock =
        api.formatPlaytimeClock ? api.formatPlaytimeClock(playMs) : formatSpeedTime(playMs).split(".")[0];
      let hx = 10;
      const selfRow = {
        player_name: name,
        user_id: api.currentUser && api.currentUser() ? api.currentUser().id : null,
      };
      if (boardRowOnline(selfRow)) hx += 4;
      hx += chatAuthorWidth(name, true, 10) + 3 + pixTextWidth(String(clock)) + 6;
      x = hx;
      y = 5;
    }
    const who = String(chatToast.who || "?").slice(0, chatToast.isAcc ? 7 : 8);
    const preview = String(chatToast.text || "").slice(0, 22);
    const whoW = chatAuthorWidth(who, chatToast.isAcc, chatToast.isAcc ? 7 : 8);
    const prevW = Math.min(pixTextWidth(preview.toUpperCase()), 96);
    let boxW = Math.min(uiW - x - 8, whoW + prevW + 14);
    if (boxW < 40) {
      // Wrap under HUD if horizontal space is tight (e.g. speedrun timer)
      x = 8;
      y = 18;
      boxW = Math.min(uiW - 16, whoW + prevW + 14);
    }
    const boxH = 12;
    px(x - 2, y - 2, boxW + 4, boxH + 4, "#3a2414");
    px(x - 1, y - 1, boxW + 2, boxH + 2, "#5c3a21");
    px(x, y, boxW, boxH, "#c4a574");
    let cx = x + 2;
    if (chatToast.isAcc) cx += drawNameTag(who, cx, y + 2, 7);
    else {
      clipPixText(who, cx, y + 3, "#3a2414", whoW + 1);
      cx += whoW;
    }
    cx += 3;
    const remain = x + boxW - cx - 2;
    clipPixText(preview, cx, y + 3, "#2b1c12", remain);
    ctx.restore();
  }

  function drawIslandChat() {
    syncPresenceActivity();
    refreshChatUnread();
    clearChatHits();
    chatHoverTip = null;
    drawChatUnreadPip();
    drawChatToast();
    if (!chatOpen) return;

    const api = lbApi();
    const uiW = canvas.width / SCALE_UI;
    const uiH = canvas.height / SCALE_UI;
    const panelW = Math.min(152, Math.max(120, (uiW * 0.3) | 0));
    const x = uiW - panelW - 3;
    const y = 3;
    const h = uiH - 6;
    const innerL = x + 5;
    const innerR = x + panelW - 5;
    const innerW = innerR - innerL;

    // Soft dim on the left so the parchment sidebar reads as overlay
    ctx.globalAlpha = 0.28;
    px(0, 0, x - 1, uiH, "#0b1a22");
    ctx.globalAlpha = 1;

    // Title only — no ONLINE N in chat header (mode select keeps its chip)
    drawPanelBox(x, y, panelW, h, "ISLAND CHAT");

    // Presence strip (slow carousel when >3 online)
    const stripY = y + 16;
    const stripH = 12;
    px(x + 3, stripY, panelW - 6, stripH, "#b8955e");
    px(x + 3, stripY + stripH, panelW - 6, 1, "#8a5a32");
    const presenceAll = api && api.getOnlinePresence ? api.getOnlinePresence() : [];
    const presence = presenceCarouselSlice(presenceAll);
    ctx.save();
    ctx.beginPath();
    ctx.rect(x + 3, stripY, panelW - 6, stripH);
    ctx.clip();
    let pxCursor = innerL;
    const stripMax = innerR;
    for (let i = 0; i < presence.length; i++) {
      const p = presence[i];
      const name = (p && p.username) || "?";
      const isAcc = !!(p && (p.user_id || p.is_account));
      const tip =
        api && api.presenceActivityLabel
          ? api.presenceActivityLabel(p)
          : p && p.mode === "normal"
            ? "SURVIVAL"
            : p && p.mode === "speedrun"
              ? String(p.category || "SPEEDRUN").toUpperCase()
              : "LOBBY";
      const maxLen = isAcc ? 6 : 7;
      const shown = String(name).slice(0, maxLen);
      const nameW = chatAuthorWidth(shown, isAcc, maxLen);
      const nw = nameW + 5; // online pip + gap
      if (pxCursor + nw > stripMax) break;
      drawOnlineDot(pxCursor, stripY + 2);
      const nameX = pxCursor + 4;
      if (isAcc) drawNameTag(shown, nameX, stripY + 2, maxLen);
      else drawPixText(shown, nameX, stripY + 3, "#3a2414");
      addChatHit("pres:" + i, pxCursor, stripY, nw, stripH, null, { tip, tipX: nameX, tipY: stripY + 2 });
      pxCursor += nw + 4;
    }
    ctx.restore();
    if (!presenceAll.length) drawPixText("NO ONE YET", innerL + 1, stripY + 3, "#5c3a21");

    // Messages
    const composerH = 28;
    const msgTop = stripY + stripH + 3;
    const msgBottom = y + h - composerH - 4;
    const msgH = Math.max(20, msgBottom - msgTop);
    px(x + 3, msgTop, panelW - 6, msgH, "#d4b888");
    const msgs = api && api.getChatMessages ? api.getChatMessages() : [];
    const soft = (api && api.getChatStatus && api.getChatStatus()) || chatStatusNote || "";
    const lineH = 9;
    const fullChars = Math.max(8, (innerW / 6) | 0);
    const viewLines = Math.max(2, ((msgH - 4) / lineH) | 0);

    // Build flattened render lines newest-bottom; wrap using real nametag width
    const render = [];
    for (let i = 0; i < msgs.length; i++) {
      const m = msgs[i];
      const isAcc = !!(m && (m.is_account || m.user_id));
      const whoMax = isAcc ? 7 : 8;
      const who = String((m && m.player_name) || "?").slice(0, whoMax);
      const whoW = chatAuthorWidth(who, isAcc, whoMax);
      const firstChars = Math.max(4, ((innerW - whoW - 3) / 6) | 0);
      const body = String((m && m.body) || "");
      const first = body.slice(0, firstChars);
      const rest = body.slice(firstChars);
      render.push({
        who,
        isAcc,
        text: first,
        tipWho: who,
        modeRow: m,
      });
      const cont = wrapChatLines(rest, fullChars);
      for (let j = 0; j < cont.length; j++) {
        if (!cont[j]) continue;
        render.push({
          who: "",
          isAcc: false,
          text: cont[j],
          tipWho: who,
          modeRow: m,
        });
      }
    }
    if (!msgs.length) {
      render.push({ who: "", isAcc: false, text: soft ? soft : "NO MESSAGES", tipWho: "", modeRow: null });
      if (!soft && api && api.isChatAvailable && !api.isChatAvailable()) {
        render.push({ who: "", isAcc: false, text: "RUN SETUP SQL", tipWho: "", modeRow: null });
      }
    }

    const maxScroll = Math.max(0, render.length - viewLines);
    if (chatScroll > maxScroll) chatScroll = maxScroll;
    const start = Math.max(0, render.length - viewLines - chatScroll);
    const end = Math.min(render.length, start + viewLines);
    ctx.save();
    ctx.beginPath();
    ctx.rect(x + 3, msgTop, panelW - 6, msgH);
    ctx.clip();
    let my = msgTop + 3;
    for (let i = start; i < end; i++) {
      const row = render[i];
      let cx = innerL;
      if (row.who) {
        const tip =
          row.modeRow && api && api.presenceActivityLabel
            ? (() => {
                const list = presenceAll;
                for (let pi = 0; pi < list.length; pi++) {
                  const pr = list[pi];
                  if (!pr) continue;
                  if (row.modeRow.user_id && pr.user_id && String(pr.user_id) === String(row.modeRow.user_id)) {
                    return api.presenceActivityLabel(pr);
                  }
                  if (pr.username && api.namesFuzzyMatch && api.namesFuzzyMatch(pr.username, row.tipWho)) {
                    return api.presenceActivityLabel(pr);
                  }
                }
                return row.modeRow.user_id || row.isAcc ? "ONLINE" : "LOBBY";
              })()
            : "";
        if (row.isAcc) {
          const tw = drawNameTag(row.who, cx, my, 7);
          if (tip) addChatHit("msgname:" + i, cx, my, tw, 8, null, { tip, tipX: cx, tipY: my });
          cx += tw + 3;
        } else {
          const tw = chatAuthorWidth(row.who, false, 8);
          clipPixText(row.who, cx, my, "#5c3a21", tw + 1);
          if (tip) addChatHit("msgname:" + i, cx, my, tw, 8, null, { tip, tipX: cx, tipY: my });
          cx += tw + 3;
        }
      }
      clipPixText(row.text, cx, my, "#3a2414", innerR - cx);
      my += lineH;
    }
    ctx.restore();

    // Composer — draft clipped so it never stacks under SEND
    const cy = y + h - composerH;
    const sendW = 30;
    const sendX = x + panelW - sendW - 6;
    const draftFieldW = Math.max(20, sendX - (x + 6) - 4);
    px(x + 3, cy, panelW - 6, composerH - 2, "#5c3a21");
    px(x + 4, cy + 1, draftFieldW + 2, 11, chatFocused ? "#e8c44a" : "#8a5a32");
    px(x + 5, cy + 2, draftFieldW, 9, "#f3e2c4");
    const draftShow = (chatDraft || "").slice(0, 80);
    const placeholder = chatPlayerName() ? "…" : "SET NAME";
    const draftMaxW = draftFieldW - 4;
    if (draftShow) clipPixText(draftShow, x + 7, cy + 3, "#2b1c12", draftMaxW);
    else clipPixText(placeholder, x + 7, cy + 3, "#8a5a32", draftMaxW);
    if (chatFocused && draftShow && ((time * 3) | 0) % 2 === 0) {
      const shownW = Math.min(pixTextWidth(draftShow.toUpperCase()), draftMaxW);
      const cxo = x + 7 + shownW;
      if (cxo + 5 <= x + 5 + draftFieldW) px(cxo, cy + 3, 5, 7, "#2b1c12");
    }
    addChatHit("composer", x + 4, cy + 1, draftFieldW + 2, 11, () => {
      chatFocused = true;
    });

    const sendHover =
      menuHoverKey === "chat:send" ||
      (pointerUi.x >= sendX && pointerUi.x < sendX + sendW && pointerUi.y >= cy + 1 && pointerUi.y < cy + 12);
    if (sendHover) px(sendX - 1, cy + 1, sendW, 11, "#e8c44a");
    else px(sendX - 1, cy + 1, sendW, 11, "#8a5a32");
    drawPixText("SEND", sendX + 2, cy + 3, sendHover ? "#2b1c12" : "#f3e2c4");
    addChatHit("chat:send", sendX - 1, cy + 1, sendW, 11, () => {
      chatFocused = true;
      trySendChat();
    });

    const hintMax = innerW;
    if (chatStatusNote) clipPixText(chatStatusNote.slice(0, 18), x + 6, cy + 14, "#c9a227", hintMax);
    else clipPixText("TAB CLOSE  ENTER SEND", x + 6, cy + 14, "#c4a574", hintMax);

    // Hover tip from presence / author hits
    const tipHit = hitChatAt(pointerUi.x, pointerUi.y);
    if (tipHit && tipHit.meta && tipHit.meta.tip) {
      drawChatTooltip(tipHit.meta.tip, tipHit.meta.tipX != null ? tipHit.meta.tipX : tipHit.x, tipHit.meta.tipY != null ? tipHit.meta.tipY : tipHit.y);
    }
  }

  /** ~2s cheeky pixel gag: player + puffed blowfish silhouettes, then resume. */
  function drawBlowfishCut() {
    if (cabinCut.kind !== "blowfish") return;
    const uiW = canvas.width / SCALE_UI;
    const uiH = canvas.height / SCALE_UI;
    const u = cabinCut.t;
    const fadeIn = Math.min(1, u / 0.18);
    const fadeOut = u > 1.7 ? Math.max(0, 1 - (u - 1.7) / 0.35) : 1;
    const a = fadeIn * fadeOut;
    ctx.save();
    ctx.setTransform(SCALE_UI, 0, 0, SCALE_UI, 0, 0);
    ctx.globalAlpha = 0.72 * a;
    px(0, 0, uiW, uiH, "#120810");
    ctx.globalAlpha = a;
    const cx = (uiW / 2) | 0;
    const cy = (uiH / 2) | 0;
    const puff = u < 0.35 ? u / 0.35 : u < 1.35 ? 1 : Math.max(0.55, 1 - (u - 1.35) / 0.4);
    const bob = (Math.sin(u * 14) * 1.5) | 0;
    const lean = u > 0.25 && u < 1.55 ? 1 : 0;
    // Player silhouette (left)
    const px0 = cx - 28 + lean * 4;
    const py0 = cy - 6;
    px(px0 + 3, py0 - 10, 5, 5, "#1a1018");
    px(px0 + 4, py0 - 9, 1, 1, "#3a2414");
    px(px0 + 2, py0 - 5, 7, 10, "#1a1018");
    px(px0, py0 + 1, 3, 8, "#1a1018");
    px(px0 + 8, py0 + 1, 3, 8, "#1a1018");
    px(px0 + 9, py0 - 2 + bob, 6, 2, "#1a1018");
    // Blowfish (right of player, puffs up — abstract bawdy beat)
    const bx = px0 + 12 + lean * 2;
    const by = py0 - 2 + bob;
    const r = (4 + puff * 7) | 0;
    const top = by - ((r / 2) | 0);
    const bot = by + ((r / 2) | 0);
    px(bx, top, r + 2, r, "#e8c878");
    px(bx + 1, top - 1, Math.max(2, r), 2, "#f4dca0");
    px(bx + r - 1, by - 1, 2, 2, "#1a1814");
    px(bx + 1, bot - 1, 1, 1, "#8a6a28");
    px(bx + r - 2, bot - 1, 1, 1, "#8a6a28");
    // Spikes / comic motion
    if (puff > 0.6) {
      px(bx - 2, by - 2, 1, 1, "#c9a048");
      px(bx + r + 2, by, 1, 1, "#c9a048");
      px(bx + ((r / 2) | 0), top - 2, 1, 1, "#c9a048");
    }
    // Sweat / stars (comedic, not graphic)
    if (u > 0.4 && u < 1.6) {
      const tw = ((u * 9) | 0) & 1;
      px(px0 - 4, py0 - 12 - tw, 1, 1, "#9ee8ff");
      px(px0 - 2, py0 - 14, 1, 2, "#9ee8ff");
      px(bx + r + 4, by - 6, 2, 2, "#f3d56a");
      px(bx + r + 6, by - 4, 1, 1, "#fff3c0");
    }
    if (u > 0.55 && u < 1.45) {
      drawPixText("!!!", cx + 18, cy - 22, "#f3e2c4", "center");
    }
    if (u > 1.55) {
      // Pop / deflate punchline
      px(bx + 2, by - 1, 3, 2, "#fff3c0");
      px(bx - 1, by + 2, 1, 1, "#e8c878");
      px(bx + r + 1, by - 3, 1, 1, "#e8c878");
    }
    ctx.globalAlpha = 1;
    ctx.restore();
  }

  function drawGuide() {
    if (!guideOpen) return;
    const uiW = canvas.width / SCALE_UI;
    const uiH = canvas.height / SCALE_UI;
    const lines = [
      "WASD MOVES YOU",
      "ON FOOT AND IN BOAT",
      "HOLD Z TO LOOK FAR",
      "1-4 TOP  5-8 BOTTOM",
      "ENTER DROPS HELD ITEM",
      "SPACE USES HELD ITEM",
      "SHELL BLOWS THE HORN",
      "FAR HORN WAKES SERPENT",
      "WAND HITS BREACHING SERPENT",
      "HOLD BAIT TO CAST BETTER",
      "HEART / SHARK BAIT = SUPER",
      "CHEST NEEDS THE MASTER",
      "T OPENS CHEST IN CABIN",
      "T TRADES NEAR NPC",
      "C / F CASTS THE ROD",
      "TAB OPENS ISLAND CHAT",
      "CLOSE DOCK GOOD FAR LEGEND",
      "WALK TO LOOT TO PICK UP",
      "WALK TO BOAT TO BOARD",
      "SHORE OR DOCK TO GET OUT",
      "ESC QUITS SURVIVAL",
      "R RESETS SPEEDRUN",
      "H CLOSES THIS GUIDE",
    ];
    const title = "GUIDEBOOK";
    let maxW = pixTextWidth(title);
    for (let i = 0; i < lines.length; i++) maxW = Math.max(maxW, pixTextWidth(lines[i]));
    const pad = 8;
    const lineH = 8;
    const w = Math.min(uiW - 8, maxW + pad * 2 + 6);
    const h = 16 + lines.length * lineH + 8;
    const x = ((uiW - w) / 2) | 0;
    let y = ((uiH - h) / 2) | 0;
    if (y < 2) y = 2;
    px(x, y, w, h, "#3a2414");
    px(x + 1, y + 1, w - 2, h - 2, "#8a5a32");
    px(x + 3, y + 3, w - 6, h - 6, "#c4a574");
    px(x + 3, y + 3, w - 6, 11, "#5c3a21");
    px(x + 3, y + 13, w - 6, 1, "#c9a227");
    drawPixText(title, (x + w / 2) | 0, y + 5, "#f3e2c4", "center");
    for (let i = 0; i < lines.length; i++) {
      drawPixText(lines[i], x + pad, y + 18 + i * lineH, "#3a2414");
    }
  }

  function draw(t) {
    ink = ctx;
    const cpos = cam();
    const jx = ((Math.random() * 2 - 1) * shake) | 0;
    const jy = ((Math.random() * 2 - 1) * shake) | 0;
    ctx.imageSmoothingEnabled = false;
    ctx.setTransform(zoom, 0, 0, zoom, jx, jy);
    if (isIndoor()) {
      px(0, 0, viewW, viewH, scene === "cabin" ? "#071018" : "#2a1c12");
      if (scene === "cabin") drawCabinSea(cpos, t);
      const room = scene === "fish" ? fishCanvas : scene === "cabin" ? cabinCanvas : shopCanvas;
      const rw = indoorW();
      const rh = indoorH();
      if (room) ctx.drawImage(room, 0, 0, rw, rh, -cpos.x, -cpos.y, rw, rh);
      drawIndoorLight(cpos);
      if (scene === "shop") drawShopGoldSpark(cpos, t);
      if (scene === "cabin") {
        drawCabinChest(cpos);
        drawChestSpill(cpos);
        drawCabinLampFlicker(cpos);
      }
      for (let i = 0; i < npcs.length; i++) drawNpcLit(cpos, npcs[i], t);
      if (scene === "cabin") drawWardenMagic(cpos, t);
      else drawShopkeeperBubble(cpos, t);
      drawLoot(cpos);
      drawPlayerLit(cpos, false);
      if (scene === "cabin") drawCabinMotes(cpos);
    } else {
      px(0, 0, viewW, viewH, WATER_BLUE);
      drawLand(cpos);
      drawFoam(cpos, t);
      drawDockOverFoam(cpos);
      drawRocks(cpos);
      drawTrees(cpos);
      drawBankReeds(cpos, t);
      drawInsects(cpos, t);
      drawCrabs(cpos);
      drawSandBits(cpos);
      drawWorldLight(cpos, t);
      drawSplashes(cpos);
      drawFish(cpos, t);
      if (serpent && (serpent.phase === "shadow" || serpent.phase === "intro" || serpent.phase === "recover")) {
        drawSerpent(cpos);
      }
      drawLoot(cpos);
      const underSkiff = !!(ownedBoat && skiffUnderDock(ownedBoat));
      if (underSkiff) {
        drawSkiffPart(cpos, ownedBoat, t, true, true);
        if (player.aboard) drawPlayerLit(cpos, true);
        drawSkiffPart(cpos, ownedBoat, t, false, true);
        if (player.aboard) drawRodLit(cpos, true);
      }
      for (let i = 0; i < boats.length; i++) {
        if (boats[i].kind !== "big" && boats[i].kind !== "moored") drawBoatLit(cpos, boats[i], t);
      }
      for (let i = 0; i < boats.length; i++) {
        if (boats[i].kind === "big") drawBoatLit(cpos, boats[i], t);
      }
      for (let i = 0; i < boats.length; i++) drawBoatSailLit(cpos, boats[i], t);
      if (ownedBoat && !underSkiff) {
        drawSkiffPart(cpos, ownedBoat, t, true, false);
        if (!player.aboard) drawSkiffPart(cpos, ownedBoat, t, false, false);
      }
      drawMooredSailLit(cpos);
      for (let i = 0; i < npcs.length; i++) drawNpcLit(cpos, npcs[i], t);
      drawHarborBubble(cpos, t);
      drawLightSources(cpos, t, litFrame ? litFrame.lamps : 0);
      if (!(underSkiff && player.aboard)) {
        if (player.aboard) {
          drawPlayerLit(cpos, false);
          if (ownedBoat) drawSkiffPart(cpos, ownedBoat, t, false, false);
          drawRodLit(cpos, false);
        } else {
          drawPlayerLit(cpos, false);
        }
      }
      if (serpent && serpent.phase === "breach") drawSerpent(cpos);
      drawWandBolts(cpos);
    }
    if (cloakOn) applyCloakVision(cpos, jx, jy);
    ctx.setTransform(SCALE_UI, 0, 0, SCALE_UI, 0, 0);
    drawHud();
    drawSerpentBossBar();
    drawGuide();
    drawBlowfishCut();
    drawPickupFx();
    drawUseFx();
    drawDamage(canvas.width / SCALE_UI, canvas.height / SCALE_UI);
    drawFade();
    drawSpeedTimer();
    drawAccountHudChip();
    drawSpeedUI();
    drawIslandChat();
  }

  function drawUseFx() {
    if (!useFx) return;
    const u = useFx.t / 0.35;
    const cpos = cam();
    const x = Math.round(player.x + player.w / 2 - cpos.x);
    const y = Math.round(player.y + 3 - cpos.y);
    ctx.setTransform(zoom, 0, 0, zoom, 0, 0);
    ctx.globalAlpha = 1 - u;
    const col = useFx.id === "gem" ? "#7ff0ea" : "#f4fbff";
    for (let i = 0; i < 5; i++) {
      const a = i * 1.256 + time * 6;
      const r = 3 + u * 7;
      px((x + Math.cos(a) * r) | 0, (y + Math.sin(a) * r) | 0, 1, 1, col);
    }
    ctx.globalAlpha = 1;
    ctx.setTransform(SCALE_UI, 0, 0, SCALE_UI, 0, 0);
  }

  const SAVE_KEY = "survival-rpg-save";
  let saveAcc = 0;

  function lbApi() {
    return window.IsleLeaderboard || null;
  }

  function catLabel(id) {
    const api = lbApi();
    if (api && api.CATEGORIES[id]) return api.CATEGORIES[id].label;
    return String(id || "").toUpperCase();
  }

  function formatSpeedTime(ms) {
    const api = lbApi();
    if (api) return api.formatTime(ms);
    const t = Math.max(0, ms | 0);
    const m = (t / 60000) | 0;
    const s = ((t % 60000) / 1000) | 0;
    const c = ((t % 1000) / 10) | 0;
    return m + ":" + String(s).padStart(2, "0") + "." + String(c).padStart(2, "0");
  }

  function uiBlocksPlay() {
    return (
      uiScreen === "mode" ||
      uiScreen === "categories" ||
      uiScreen === "finish" ||
      uiScreen === "boards" ||
      uiScreen === "account" ||
      uiScreen === "nm_boards"
    );
  }

  function speedrunActive() {
    return playMode === "speedrun" && (srRunning || uiScreen === "ready");
  }

  function newSpeedRunId() {
    const api = lbApi();
    return api && api.uuid ? api.uuid() : "run-" + Date.now() + "-" + ((Math.random() * 1e9) | 0);
  }

  function lockSpeedFinalMs() {
    if (srTiming) {
      srElapsed = Math.max(srElapsed, performance.now() - srStartPerf);
      srTiming = false;
    }
    srFinalMs = Math.max(0, srElapsed | 0);
  }

  function maybeStartSpeedTimer() {
    if (playMode !== "speedrun" || srTiming || uiScreen === "finish") return;
    if (uiScreen !== "ready" && !(uiScreen === null && srRunning)) return;
    uiScreen = null;
    guideOpen = false;
    srRunning = true;
    srTiming = true;
    srStartPerf = performance.now();
    srElapsed = 0;
    srFinalMs = 0;
    srSubmitted = false;
    if (!srRunId) srRunId = newSpeedRunId();
  }

  function checkCatchSpeedEnd(id) {
    if (!speedrunActive() || !srTiming || uiScreen === "finish") return;
    if (srCat === "shark" && id === "shark") finishSpeedrun();
    else if (srCat === "jelly_white" && id === "jelly_white") finishSpeedrun();
    else if (srCat === "chest" && id === "chest") finishSpeedrun();
    else if (srCat === "blowfish" && id === "blowfish") {
      // Wait for cutscene + 1s (see updateCabinCut / scheduleBlowfishSpeedEnd).
      if (cabinCut.kind !== "blowfish" && srBlowfishFinishT < 0) scheduleBlowfishSpeedEnd(1);
    } else if (srCat === "megalodon" && id === "megalodon") finishSpeedrun();
    else if (srCat === "shark_cloak" && id === "shark" && cloakOn && rod.phase === "idle") finishSpeedrun();
  }

  function checkBoatSpeedEnd() {
    if (!speedrunActive() || !srTiming || uiScreen === "finish") return;
    if (srCat === "boat" && srBoughtBoat && player.aboard) finishSpeedrun();
  }

  function checkCoinSpeedEnd() {
    if (!speedrunActive() || !srTiming || uiScreen === "finish") return;
    if (srCat === "coins_10" && player.coins >= 10) finishSpeedrun();
    else if (srCat === "coins_25" && player.coins >= 25) finishSpeedrun();
    else if (srCat === "coins_100" && player.coins >= 100) finishSpeedrun();
  }

  function finishSpeedrun() {
    if (playMode !== "speedrun" || uiScreen === "finish") return;
    // Freeze timer this frame — all end hooks must land here.
    srBlowfishFinishT = -1;
    lockSpeedFinalMs();
    srRunning = false;
    uiScreen = "finish";
    srFinishSel = 1;
    srStatus = "";
    srSubmitted = false;
    const api = lbApi();
    if (api) {
      if (api.isSignedIn && api.isSignedIn()) {
        srName = api.displayName() || srName || "";
        guestNameLocked = true;
      } else {
        guestNameLocked = false;
        if (!srName) srName = api.getLastName() || "";
      }
      const pb = api.pbInfo ? api.pbInfo(srCat, srFinalMs) : null;
      if (pb) {
        srPbPrev = pb.prev | 0;
        srPbLabel = pb.isFirst ? "FIRST PB" : pb.label;
      } else {
        srPbPrev = 0;
        srPbLabel = "";
      }
      if (api.recordSpeedrunFinish) api.recordSpeedrunFinish();
      if (api.addPlaytime) api.addPlaytime(srFinalMs, "speedrun");
    }
    refreshSpeedBoard(srCat);
  }

  function resetSpeedrunWorld() {
    for (let i = 0; i < inventory.length; i++) inventory[i] = null;
    heldSlot = 0;
    player.coins = 0;
    player.xp = 0;
    player.level = 1;
    player.hp = MAX_HP;
    player.dead = 0;
    player.aboard = false;
    player.submerged = 0;
    player.drownTick = 0;
    player.hurt = 0;
    player.moving = false;
    player.facing = 1;
    cloakOn = false;
    ownedBoat = null;
    boatThrow = null;
    if (serpent) {
      serpent = null;
      resumeDayClock();
    }
    clearWandBolts();
    wandCool = 0;
    rodBaitId = null;
    serpentCoolUntil = 0;
    scene = "island";
    fade = 0;
    fadeMode = 0;
    fadeNext = null;
    islandHold = null;
    doorCool = 0.4;
    guideOpen = false;
    harborTalk = 0;
    chestTalk = 0;
    fishCastT = 0;
    pickupAnims.length = 0;
    useFx = null;
    xpFx = null;
    shopSales.length = 0;
    shopTrade.phase = "idle";
    shopTrade.t = 0;
    shopTrade.id = null;
    cabinCut.kind = "";
    cabinCut.t = 0;
    cabinCut.mode = "open";
    rod.phase = "idle";
    rod.t = 0;
    rod.catchId = null;
    rod.bit = false;
    rod.tugLeft = 0;
    loot.length = 0;
    placeSouthBeachLoot();
    player.x = spawnX;
    player.y = spawnY;
    srBoughtBoat = false;
    srWasDead = false;
    srTiming = false;
    srRunning = false;
    srElapsed = 0;
    srFinalMs = 0;
    srStatus = "";
    srSubmitting = false;
    srSubmitted = false;
    srPbPrev = 0;
    srPbLabel = "";
    srBlowfishFinishT = -1;
    camera.x = player.x + player.w / 2 - viewW / 2;
    camera.y = player.y + player.h / 2 - viewH * 0.36;
    clampCamera();
  }

  function applyBoardIdentityMerge(rows, lim) {
    const api = lbApi();
    const list = Array.isArray(rows) ? rows : [];
    if (!api || !api.mergeBoardIdentities) return list.slice(0, lim || 10);
    return api.mergeBoardIdentities(list, null, lim || 10);
  }

  async function refreshSpeedBoard(cat) {
    const id = cat || srCat;
    const api = lbApi();
    srBoardNote = "LOADING...";
    if (!api) {
      srBoardRows = [];
      srBoardNote = "NO CLIENT";
      return;
    }
    if (api.fetchKnownIdentities) {
      try {
        await api.fetchKnownIdentities();
      } catch (e) {}
    }
    if (!api.configured()) {
      srBoardRows = applyBoardIdentityMerge(api.getCachedBoard(id) || [], 10);
      srBoardNote = srBoardRows.length ? "CACHED / OFFLINE" : "SET UP SUPABASE";
      return;
    }
    const res = await api.fetchTop(id, 10);
    srBoardRows = applyBoardIdentityMerge(res.rows || [], 10);
    srBoardNote = res.ok ? "" : res.offline ? "OFFLINE" : res.error || "ERROR";
  }

  function beginSpeedCategory(cat) {
    srCat = cat;
    playMode = "speedrun";
    resetSpeedrunWorld();
    uiScreen = "ready";
    srCursor = 0;
    srStatus = "";
    srSubmitted = false;
    srRunId = newSpeedRunId();
    srFinalMs = 0;
    const api = lbApi();
    if (api && api.isSignedIn && api.isSignedIn()) {
      srName = api.displayName() || srName;
      guestNameLocked = true;
    } else {
      guestNameLocked = false;
    }
    refreshSpeedBoard(srCat);
  }

  function enterNormalMode() {
    playMode = "normal";
    uiScreen = null;
    loadGame();
    const api = lbApi();
    if (api && api.loadLocalNmStats) {
      const st = api.loadLocalNmStats();
      if (st && player.level > (st.level_high | 0) && api.noteNmEvent) api.noteNmEvent("level", player.level);
      if (st && player.coins > (st.coins_high | 0) && api.noteNmEvent) api.noteNmEvent("coins_high", player.coins);
    }
    camera.x = player.x + player.w / 2 - viewW / 2;
    camera.y = player.y + player.h / 2 - viewH * 0.36;
    clampCamera();
  }

  function backToModeMenu() {
    if (serpent) endSerpentFight("flee");
    playMode = null;
    uiScreen = "mode";
    srCursor = 0;
    srRunning = false;
    srTiming = false;
    guideOpen = false;
    authMode = "menu";
    authStatus = "";
    authField = 0;
  }

  async function refreshNmBoard(kind) {
    const id = kind || nmBoardKind;
    const api = lbApi();
    nmBoardNote = "LOADING...";
    if (!api || !api.fetchNmBoard) {
      nmBoardRows = [];
      nmBoardNote = "NO CLIENT";
      return;
    }
    if (!api.configured()) {
      nmBoardRows = [];
      nmBoardNote = "SET UP SUPABASE";
      return;
    }
    const res = await api.fetchNmBoard(id, 10);
    nmBoardRows = res.rows || [];
    nmBoardNote = res.ok ? "" : res.offline ? "OFFLINE" : res.error || "ERROR";
  }

  function backToCategories() {
    playMode = "speedrun";
    uiScreen = "categories";
    srRunning = false;
    srTiming = false;
    srCursor = Math.max(0, SPEED_ORDER.indexOf(srCat));
    refreshSpeedBoard(SPEED_ORDER[srCursor] || srCat);
  }

  function drawPanelBox(x, y, w, h, title) {
    px(x, y, w, h, "#3a2414");
    px(x + 1, y + 1, w - 2, h - 2, "#8a5a32");
    px(x + 3, y + 3, w - 6, h - 6, "#c4a574");
    if (title) {
      px(x + 3, y + 3, w - 6, 11, "#5c3a21");
      px(x + 3, y + 13, w - 6, 1, "#c9a227");
      drawPixText(title, (x + w / 2) | 0, y + 5, "#f3e2c4", "center");
    }
  }

  function drawSpeedTimer() {
    if (playMode !== "speedrun") return;
    if (!(srTiming || uiScreen === "ready" || uiScreen === "finish")) return;
    const uiW = canvas.width / SCALE_UI;
    let ms = srFinalMs;
    // Finish screen always shows locked final — never live clock.
    if (uiScreen === "finish") ms = srFinalMs;
    else if (srTiming) ms = performance.now() - srStartPerf;
    else if (uiScreen === "ready") ms = 0;
    const label = formatSpeedTime(ms);
    const tw = pixTextWidth(label);
    const x = uiW - tw - 10;
    const y = 6;
    px(x - 4, y - 3, tw + 8, 13, "#3a2414");
    px(x - 3, y - 2, tw + 6, 11, "#5c3a21");
    drawPixText(label, x, y, "#f3e2c4");
  }

  function drawAccountHudChip() {
    const api = lbApi();
    if (!api || !api.isSignedIn || !api.isSignedIn()) return;
    if (uiBlocksPlay() && uiScreen !== "ready" && uiScreen !== "finish") return;
    // Opposite the speedrun timer (timer is top-right). Also show in normal when logged in.
    if (playMode !== "speedrun" && playMode !== "normal") return;
    const name = (api.displayName && api.displayName()) || "PLAYER";
    let playMs = 0;
    if (api.totalPlaytimeMs) playMs = api.totalPlaytimeMs() | 0;
    else {
      const p = api.currentProfile && api.currentProfile();
      playMs = ((p && p.playtime_ms) || 0) + ((p && p.nm_playtime_ms) || 0);
    }
    const clock =
      api.formatPlaytimeClock ? api.formatPlaytimeClock(playMs) : formatSpeedTime(playMs).split(".")[0];
    const x = 10;
    const y = 6;
    // Nametag chip for username (same gold/wood style as board NEW/ACC tags), clock beside it.
    let hx = x;
    const selfRow = {
      player_name: name,
      user_id: api.currentUser && api.currentUser() ? api.currentUser().id : null,
    };
    if (boardRowOnline(selfRow)) hx += drawOnlineDot(hx, y);
    const nameW = drawNameTag(name, hx, y, 10);
    const clockTw = pixTextWidth(String(clock));
    const cx = hx + nameW + 3;
    px(cx - 1, y - 1, clockTw + 3, 9, "#3a2414");
    px(cx, y, clockTw + 1, 7, "#5c3a21");
    drawPixText(String(clock), cx + 1, y, "#f3e2c4");
  }

  function drawBoardList(x, y, maxRows) {
    const api = lbApi();
    nudgePresenceRefresh();
    const rows = applyBoardIdentityMerge(srBoardRows || [], maxRows || 10);
    const n = Math.min(maxRows || 10, rows.length);
    if (!n) {
      drawPixText(srBoardNote || "NO SCORES YET", x, y, "#5c3a21");
      return y + 8;
    }
    let yy = y;
    for (let i = 0; i < n; i++) {
      const r = rows[i];
      const rank = String(i + 1).padStart(2, " ");
      const timeStr = formatSpeedTime(r.time_ms | 0);
      const isAcc = api && api.rowIsAccount ? api.rowIsAccount(r) : !!(r.is_account || r.user_id);
      const isNew =
        api && api.isNewScoreRow
          ? api.isNewScoreRow(r, { runId: srSubmitted ? srRunId : "" })
          : false;
      const isOnline = boardRowOnline(r);
      // Accounts use nametag chips (shorter when NEW sits beside); guests use classic text.
      const nameMax = isAcc ? (isNew ? 7 : 8) : isNew ? 9 : 10;
      drawPixText(rank + " ", x, yy, "#3a2414");
      let tagX = x + 18;
      tagX += drawBoardPlayerLabel(r.player_name, tagX, yy, {
        isAccount: isAcc,
        isOnline,
        maxLen: nameMax,
      }) + 2;
      if (isNew) tagX += drawNewTag(tagX, yy) + 2;
      drawPixText(timeStr, Math.max(tagX + 1, x + 108), yy, "#5c3a21");
      yy += 8;
    }
    if (srBoardNote) {
      drawPixText(srBoardNote, x, yy + 2, "#8a5a32");
      yy += 10;
    }
    return yy;
  }

  function onlineLabel() {
    const api = lbApi();
    if (!api || typeof api.getOnlineCount !== "function") return "ONLINE —";
    const n = api.getOnlineCount();
    if (n == null || n < 0) return "ONLINE —";
    return "ONLINE " + (n | 0);
  }

  function drawOnlineChip(cx, y) {
    nudgePresenceRefresh();
    const label = onlineLabel();
    const tw = pixTextWidth(label);
    const x = (cx - tw / 2) | 0;
    px(x - 4, y - 2, tw + 8, 11, "#3a2414");
    px(x - 3, y - 1, tw + 6, 9, "#5c3a21");
    drawPixText(label, x, y, "#f3e2c4");
  }

  function drawModeSelect() {
    const uiW = canvas.width / SCALE_UI;
    const uiH = canvas.height / SCALE_UI;
    ctx.globalAlpha = 0.55;
    px(0, 0, uiW, uiH, "#0b1a22");
    ctx.globalAlpha = 1;
    const w = 168;
    const h = 108;
    const x = ((uiW - w) / 2) | 0;
    const y = ((uiH - h) / 2) | 0;
    drawPanelBox(x, y, w, h, "ISLEBOUND");
    drawOnlineChip((x + w / 2) | 0, y + 18);
    for (let i = 0; i < modeOpts.length; i++) {
      const key = "mode:" + i;
      const sel = srCursor === i || menuHovering(key);
      const oy = y + 32 + i * 12;
      if (sel) px(x + 18, oy - 2, w - 36, 11, "#e8c44a");
      drawPixText((sel ? "> " : "  ") + modeOpts[i], (x + w / 2) | 0, oy, sel ? "#2b1c12" : "#3a2414", "center");
      addMenuHit(key, x + 18, oy - 2, w - 36, 11, () => {
        srCursor = i;
        if (i === 0) enterNormalMode();
        else if (i === 1) {
          playMode = "speedrun";
          uiScreen = "categories";
          srCursor = 0;
          refreshSpeedBoard(SPEED_ORDER[0]);
        } else if (i === 2) {
          uiScreen = "account";
          authMode = "menu";
          authStatus = "";
          srCursor = 0;
          const api = lbApi();
          if (api && api.ensureProfile && api.isSignedIn && api.isSignedIn()) api.ensureProfile();
        } else if (i === 3) {
          uiScreen = "nm_boards";
          nmCursor = 0;
          nmBoardKind = "playtime";
          refreshNmBoard(nmBoardKind);
        }
      }, { hover: true });
    }
    drawPixText("CLICK OR ARROWS", (x + w / 2) | 0, y + h - 12, "#5c3a21", "center");
  }

  function drawCategorySelect() {
    const uiW = canvas.width / SCALE_UI;
    const uiH = canvas.height / SCALE_UI;
    ctx.globalAlpha = 0.5;
    px(0, 0, uiW, uiH, "#0b1a22");
    ctx.globalAlpha = 1;
    const leftW = 158;
    const boardW = 188;
    const h = Math.min(uiH - 8, 16 + SPEED_ORDER.length * 9 + 28);
    const totalW = leftW + boardW + 10;
    const x = ((uiW - totalW) / 2) | 0;
    const y = Math.max(4, ((uiH - h) / 2) | 0);
    drawPanelBox(x, y, leftW, h, "SPEEDRUN");
    for (let i = 0; i < SPEED_ORDER.length; i++) {
      const id = SPEED_ORDER[i];
      const key = "cat:" + i;
      const sel = srCursor === i || menuHovering(key);
      const oy = y + 18 + i * 9;
      if (sel) px(x + 5, oy - 2, leftW - 10, 8, "#e8c44a");
      drawPixText((sel ? ">" : " ") + catLabel(id), x + 8, oy, sel ? "#2b1c12" : "#3a2414");
      addMenuHit(key, x + 5, oy - 2, leftW - 10, 8, () => {
        srCursor = i;
        beginSpeedCategory(SPEED_ORDER[i]);
      }, { hover: true });
    }
    drawPixText("ESC MENU", x + 8, y + h - 10, "#5c3a21");
    addMenuHit("cat:esc", x + 5, y + h - 12, 70, 10, () => backToModeMenu(), { hover: true });
    const bx = x + leftW + 10;
    drawPanelBox(bx, y, boardW, h, "TOP 10");
    drawBoardList(bx + 8, y + 20, 10);
  }

  function drawReadyScreen() {
    const uiW = canvas.width / SCALE_UI;
    const uiH = canvas.height / SCALE_UI;
    const w = 180;
    const h = 72;
    const x = ((uiW - w) / 2) | 0;
    const y = ((uiH - h) / 2 - 20) | 0;
    drawPanelBox(x, y, w, h, "READY");
    drawPixText(catLabel(srCat), (x + w / 2) | 0, y + 22, "#3a2414", "center");
    if (menuHovering("ready:play")) px(x + 14, y + 32, w - 28, 11, "#e8c44a");
    drawPixText("CLICK / ENTER PLAY", (x + w / 2) | 0, y + 36, menuHovering("ready:play") ? "#2b1c12" : "#5c3a21", "center");
    drawPixText("R RESET   ESC BACK", (x + w / 2) | 0, y + 48, menuHovering("ready:back") ? "#2b1c12" : "#5c3a21", "center");
    addMenuHit("ready:play", x + 10, y + 18, w - 20, 28, () => maybeStartSpeedTimer(), { hover: true });
    addMenuHit("ready:back", x + 10, y + 46, w - 20, 14, () => backToCategories(), { hover: true });
  }

  function drawFinishScreen() {
    const uiW = canvas.width / SCALE_UI;
    const uiH = canvas.height / SCALE_UI;
    ctx.globalAlpha = 0.55;
    px(0, 0, uiW, uiH, "#0b1a22");
    ctx.globalAlpha = 1;
    const w = 210;
    const h = 158;
    const x = ((uiW - w) / 2) | 0;
    const y = Math.max(4, ((uiH - h) / 2) | 0);
    drawPanelBox(x, y, w, h, "RUN COMPLETE");
    drawPixText(catLabel(srCat), (x + w / 2) | 0, y + 20, "#3a2414", "center");
    drawPixText(formatSpeedTime(srFinalMs), (x + w / 2) | 0, y + 32, "#2b1c12", "center");
    if (srPbLabel) {
      const pbCol = srPbLabel.indexOf("-") >= 0 || srPbLabel === "FIRST PB" ? "#2f6a24" : "#5c3a21";
      drawPixText(srPbLabel, (x + w / 2) | 0, y + 42, pbCol, "center");
    }
    const nameLocked = guestNameLocked;
    drawPixText("NAME", x + 12, y + 54, "#5c3a21");
    const nameSel = (!nameLocked && srFinishSel === 0) || menuHovering("fin:name");
    px(x + 48, y + 52, 120, 11, nameSel ? "#e8c44a" : "#8a5a32");
    px(x + 49, y + 53, 118, 9, "#f3e2c4");
    if (nameLocked) drawPixTextBold((srName || "").slice(0, 12), x + 52, y + 54, "#c9a227");
    else drawPixText((srName || "").slice(0, 12), x + 52, y + 54, "#2b1c12");
    if (!nameLocked && srFinishSel === 0 && ((time * 3) | 0) % 2 === 0) {
      const cx = x + 52 + pixTextWidth((srName || "").slice(0, 12)) + (srName ? 1 : 0);
      px(cx, y + 54, 5, 7, "#2b1c12");
    }
    if (!nameLocked) {
      addMenuHit("fin:name", x + 48, y + 52, 120, 11, () => {
        srFinishSel = 0;
      }, { hover: true });
    }
    const submitLabel = srSubmitted ? "POSTED" : "SUBMIT";
    const btns = [submitLabel, "RETRY", "CATEGORIES", "MENU"];
    for (let i = 0; i < btns.length; i++) {
      const key = "fin:btn:" + i;
      const sel = srFinishSel === i + 1 || menuHovering(key);
      const bx = x + 12 + (i % 2) * 96;
      const by = y + 70 + ((i / 2) | 0) * 14;
      if (sel) px(bx - 2, by - 2, 90, 11, "#e8c44a");
      drawPixText(btns[i], bx, by, sel ? "#2b1c12" : "#3a2414");
      addMenuHit(key, bx - 2, by - 2, 90, 11, () => {
        srFinishSel = i + 1;
        if (i === 0) {
          if (!srSubmitted) submitSpeedScore();
        } else if (i === 1) beginSpeedCategory(srCat);
        else if (i === 2) backToCategories();
        else if (i === 3) backToModeMenu();
      }, { hover: true });
    }
    if (srStatus) drawPixText(srStatus, (x + w / 2) | 0, y + 102, "#5c3a21", "center");
    drawPixText("TOP 10", x + 12, y + 114, "#5c3a21");
    drawBoardList(x + 12, y + 124, 3);
  }

  function drawAccountScreen() {
    const uiW = canvas.width / SCALE_UI;
    const uiH = canvas.height / SCALE_UI;
    ctx.globalAlpha = 0.55;
    px(0, 0, uiW, uiH, "#0b1a22");
    ctx.globalAlpha = 1;
    const api = lbApi();
    const signed = api && api.isSignedIn && api.isSignedIn();
    const w = 220;
    const h = signed ? 142 : authMode === "menu" ? 112 : authMode === "guest" ? 120 : 148;
    const x = ((uiW - w) / 2) | 0;
    const y = Math.max(4, ((uiH - h) / 2) | 0);
    drawPanelBox(x, y, w, h, signed ? "PROFILE" : "ACCOUNT");
    if (signed) {
      const p = api.currentProfile && api.currentProfile();
      const name = api.displayName() || "PLAYER";
      drawPixTextBold(name, (x + w / 2) | 0, y + 22, "#c9a227", "center");
      const totalMs =
        api.totalPlaytimeMs
          ? api.totalPlaytimeMs()
          : ((p && p.playtime_ms) || 0) + ((p && p.nm_playtime_ms) || 0);
      const lines = [
        "PLAY " + (api.formatPlaytimeClock ? api.formatPlaytimeClock(totalMs) : String(totalMs)),
        "RUNS " + ((p && p.total_runs) || 0) + "  SUB " + ((p && p.total_submits) || 0),
        "NM LV " + ((p && p.nm_level_high) || 1) + "  SHARK " + ((p && p.nm_sharks) || 0),
        "NM CHEST " + ((p && p.nm_chests) || 0) + "  DIE " + ((p && p.nm_deaths) || 0),
      ];
      for (let i = 0; i < lines.length; i++) {
        drawPixText(lines[i], (x + w / 2) | 0, y + 36 + i * 10, "#3a2414", "center");
      }
      const notifLabel = chatNotifsEnabled ? "CHAT NOTIFS ON" : "CHAT NOTIFS OFF";
      const opts = [notifLabel, "SIGN OUT", "BACK"];
      for (let i = 0; i < opts.length; i++) {
        const key = "acc:signed:" + i;
        const sel = srCursor === i || menuHovering(key);
        const oy = y + h - 40 + i * 12;
        if (sel) px(x + 24, oy - 2, w - 48, 11, "#e8c44a");
        drawPixText((sel ? "> " : "  ") + opts[i], (x + w / 2) | 0, oy, sel ? "#2b1c12" : "#3a2414", "center");
        addMenuHit(key, x + 24, oy - 2, w - 48, 11, () => {
          srCursor = i;
          if (i === 0) setChatNotifsEnabled(!chatNotifsEnabled);
          else if (i === 1) {
            api.signOut();
            guestNameLocked = false;
            authStatus = "SIGNED OUT";
            authMode = "menu";
            srCursor = 0;
          } else backToModeMenu();
        }, { hover: true });
      }
      return;
    }
    if (authMode === "menu") {
      const notifLabel = chatNotifsEnabled ? "CHAT NOTIFS ON" : "CHAT NOTIFS OFF";
      const opts = ["SIGN IN", "SIGN UP", "GUEST", notifLabel, "BACK"];
      for (let i = 0; i < opts.length; i++) {
        const key = "acc:menu:" + i;
        const sel = srCursor === i || menuHovering(key);
        const oy = y + 20 + i * 12;
        if (sel) px(x + 18, oy - 2, w - 36, 11, "#e8c44a");
        drawPixText((sel ? "> " : "  ") + opts[i], (x + w / 2) | 0, oy, sel ? "#2b1c12" : "#3a2414", "center");
        addMenuHit(key, x + 18, oy - 2, w - 36, 11, () => {
          srCursor = i;
          if (i === 0) {
            authMode = "signin";
            authField = 0;
            authStatus = "";
            authUser = (api && api.getLastName && api.getLastName()) || authUser || "";
            authPin = "";
          } else if (i === 1) {
            authMode = "signup";
            authField = 0;
            authStatus = "";
            authUser = "";
            authPin = "";
          } else if (i === 2) {
            authMode = "guest";
            authField = 0;
            authName = (api && api.getLastName && api.getLastName()) || srName || "";
            authStatus = "";
          } else if (i === 3) {
            setChatNotifsEnabled(!chatNotifsEnabled);
          } else backToModeMenu();
        }, { hover: true });
      }
      if (authStatus) drawPixText(authStatus, (x + w / 2) | 0, y + h - 12, "#5c3a21", "center");
      return;
    }
    if (authMode === "guest") {
      drawPixText("GUEST NAME 3-12", (x + w / 2) | 0, y + 22, "#3a2414", "center");
      const nameSel = authField === 0 || menuHovering("acc:guest:name");
      px(x + 40, y + 36, w - 80, 11, nameSel ? "#e8c44a" : "#8a5a32");
      px(x + 41, y + 37, w - 82, 9, "#f3e2c4");
      drawPixText((authName || "").slice(0, 12), x + 44, y + 38, "#2b1c12");
      addMenuHit("acc:guest:name", x + 40, y + 36, w - 80, 11, () => {
        authField = 0;
      }, { hover: true });
      const opts = ["PLAY GUEST", "BACK"];
      for (let i = 0; i < opts.length; i++) {
        const key = "acc:guest:" + i;
        const sel = authField === i + 1 || menuHovering(key);
        const oy = y + 56 + i * 12;
        if (sel) px(x + 40, oy - 2, w - 80, 11, "#e8c44a");
        drawPixText((sel ? "> " : "  ") + opts[i], (x + w / 2) | 0, oy, sel ? "#2b1c12" : "#3a2414", "center");
        addMenuHit(key, x + 40, oy - 2, w - 80, 11, () => {
          authField = i + 1;
          if (i === 0) submitAuthAction();
          else {
            authMode = "menu";
            srCursor = 0;
          }
        }, { hover: true });
      }
      if (authStatus) drawPixText(authStatus, (x + w / 2) | 0, y + h - 12, "#5c3a21", "center");
      return;
    }
    // signin / signup — username + 4-digit PIN
    drawPixText(authMode === "signup" ? "SIGN UP" : "SIGN IN", (x + w / 2) | 0, y + 20, "#3a2414", "center");
    const fields = ["USER", "PIN"];
    for (let i = 0; i < fields.length; i++) {
      const key = "acc:field:" + i;
      const oy = y + 34 + i * 18;
      drawPixText(fields[i], x + 12, oy, "#5c3a21");
      const sel = authField === i || menuHovering(key);
      px(x + 48, oy - 2, w - 60, 11, sel ? "#e8c44a" : "#8a5a32");
      px(x + 49, oy - 1, w - 62, 9, "#f3e2c4");
      let val = "";
      if (fields[i] === "USER") val = authUser;
      else val = "*".repeat(Math.min(4, authPin.length)) + (authPin.length < 4 ? "_".repeat(4 - authPin.length) : "");
      drawPixText(String(val).slice(0, 18), x + 52, oy, "#2b1c12");
      addMenuHit(key, x + 48, oy - 2, w - 60, 11, () => {
        authField = i;
      }, { hover: true });
    }
    const actions = ["SUBMIT", "BACK"];
    for (let i = 0; i < actions.length; i++) {
      const key = "acc:act:" + i;
      const sel = authField === fields.length + i || menuHovering(key);
      const oy = y + 34 + fields.length * 18 + i * 12;
      if (sel) px(x + 40, oy - 2, w - 80, 11, "#e8c44a");
      drawPixText((sel ? "> " : "  ") + actions[i], (x + w / 2) | 0, oy, sel ? "#2b1c12" : "#3a2414", "center");
      addMenuHit(key, x + 40, oy - 2, w - 80, 11, () => {
        authField = fields.length + i;
        if (i === 0) submitAuthAction();
        else {
          authMode = "menu";
          srCursor = 0;
        }
      }, { hover: true });
    }
    if (authStatus) drawPixText(authStatus.slice(0, 28), (x + w / 2) | 0, y + h - 12, "#5c3a21", "center");
  }

  function drawNmBoardScreen() {
    const uiW = canvas.width / SCALE_UI;
    const uiH = canvas.height / SCALE_UI;
    ctx.globalAlpha = 0.5;
    px(0, 0, uiW, uiH, "#0b1a22");
    ctx.globalAlpha = 1;
    const api = lbApi();
    const order = (api && api.NM_ORDER) || ["playtime", "level", "sharks", "chests", "coins"];
    const leftW = 110;
    const boardW = 170;
    const h = Math.min(uiH - 16, 16 + order.length * 10 + 36);
    const totalW = leftW + boardW + 10;
    const x = ((uiW - totalW) / 2) | 0;
    const y = Math.max(4, ((uiH - h) / 2) | 0);
    drawPanelBox(x, y, leftW, h, "PROFILE");
    for (let i = 0; i < order.length; i++) {
      const id = order[i];
      const key = "nm:" + i;
      const def = api && api.NM_BOARD_DEFS ? api.NM_BOARD_DEFS[id] : null;
      const label = def ? def.label : id.toUpperCase();
      const sel = nmCursor === i || menuHovering(key);
      const oy = y + 20 + i * 10;
      if (sel) px(x + 5, oy - 2, leftW - 10, 9, "#e8c44a");
      drawPixText((sel ? ">" : " ") + label, x + 8, oy, sel ? "#2b1c12" : "#3a2414");
      addMenuHit(key, x + 5, oy - 2, leftW - 10, 9, () => {
        nmCursor = i;
        nmBoardKind = order[i];
        refreshNmBoard(nmBoardKind);
      }, { hover: true });
    }
    drawPixText("ESC MENU", x + 8, y + h - 10, "#5c3a21");
    addMenuHit("nm:esc", x + 5, y + h - 12, 70, 10, () => backToModeMenu(), { hover: true });
    const bx = x + leftW + 10;
    drawPanelBox(bx, y, boardW, h, "TOP 10");
    const rows = nmBoardRows || [];
    if (!rows.length) {
      drawPixText(nmBoardNote || "NO DATA YET", bx + 8, y + 20, "#5c3a21");
    } else {
      let yy = y + 20;
      for (let i = 0; i < Math.min(10, rows.length); i++) {
        const r = rows[i];
        const rank = String(i + 1).padStart(2, " ");
        drawPixText(rank + " ", bx + 8, yy, "#3a2414");
        let nx = bx + 26;
        // NM boards are profile rows (accounts) — nametag chip + optional online pip.
        nx += drawBoardPlayerLabel(r.player_name, nx, yy, {
          isAccount: true,
          isOnline: boardRowOnline(r),
          maxLen: 8,
        });
        const val = api && api.formatNmValue ? api.formatNmValue(nmBoardKind, r.value) : String(r.value | 0);
        drawPixText(val, bx + 100, yy, "#5c3a21");
        yy += 8;
      }
      if (nmBoardNote) drawPixText(nmBoardNote, bx + 8, yy + 2, "#8a5a32");
    }
  }

  function drawSpeedUI() {
    clearMenuHits();
    if (uiScreen === "mode") drawModeSelect();
    else if (uiScreen === "categories") drawCategorySelect();
    else if (uiScreen === "ready") drawReadyScreen();
    else if (uiScreen === "finish") drawFinishScreen();
    else if (uiScreen === "account") drawAccountScreen();
    else if (uiScreen === "nm_boards") drawNmBoardScreen();
  }

  async function submitSpeedScore() {
    if (srSubmitting) return;
    if (srSubmitted) {
      srStatus = "POSTED";
      return;
    }
    const api = lbApi();
    if (!api) {
      srStatus = "NO CLIENT";
      return;
    }
    const name = api.sanitizeName(srName);
    if (!name) {
      srStatus = "NAME 3-12";
      if (!guestNameLocked) srFinishSel = 0;
      return;
    }
    srName = name;
    srSubmitting = true;
    srStatus = "SUBMITTING...";
    const res = await api.submitScore(srCat, srFinalMs, name, {
      runId: srRunId || newSpeedRunId(),
      isAccount: !!(api.isSignedIn && api.isSignedIn()),
    });
    srSubmitting = false;
    if (res.ok) {
      if (res.resolved && res.resolved.name) srName = res.resolved.name;
      srBoardRows = applyBoardIdentityMerge(res.rows || [], 10);
      srStatus = "POSTED";
      srSubmitted = true;
      srBoardNote = "";
      if (res.pb) {
        srPbPrev = res.pb.prev | 0;
        srPbLabel = res.pb.isFirst ? "FIRST PB" : res.pb.label;
      }
    } else {
      srStatus = (res.error || "FAILED").toUpperCase().slice(0, 22);
      if (res.rows) srBoardRows = applyBoardIdentityMerge(res.rows, 10);
      // Allow retry only on failure
      srSubmitted = false;
    }
  }

  function authFieldCount() {
    if (authMode === "guest") return 3;
    if (authMode === "signup" || authMode === "signin") return 4; // USER, PIN, SUBMIT, BACK
    return 0;
  }

  function typeIntoAuth(rawKey) {
    const ch = String(rawKey || "");
    if (!ch || ch.length !== 1) return;
    if (authMode === "guest" && authField === 0) {
      const up = ch.toUpperCase();
      if (authName.length < 12 && /[A-Z0-9 ]/.test(up)) authName += up === " " ? " " : up;
      return;
    }
    if (authMode === "signin" || authMode === "signup") {
      if (authField === 0) {
        const up = ch.toUpperCase();
        if (authUser.length < 12 && /[A-Z0-9 ]/.test(up)) authUser += up === " " ? " " : up;
      } else if (authField === 1) {
        if (authPin.length < 4 && /[0-9]/.test(ch)) authPin += ch;
      }
    }
  }

  function backspaceAuth() {
    if (authMode === "guest" && authField === 0) authName = authName.slice(0, -1);
    else if ((authMode === "signin" || authMode === "signup") && authField === 0) authUser = authUser.slice(0, -1);
    else if ((authMode === "signin" || authMode === "signup") && authField === 1) authPin = authPin.slice(0, -1);
  }

  async function submitAuthAction() {
    if (authBusy) return;
    const api = lbApi();
    if (!api) {
      authStatus = "NO CLIENT";
      return;
    }
    authBusy = true;
    authStatus = "WORKING...";
    let res = { ok: false, error: "fail" };
    if (authMode === "guest") {
      const n = api.sanitizeName(authName);
      if (!n) {
        authStatus = "NAME 3-12";
        authBusy = false;
        return;
      }
      api.setLastName(n);
      srName = n;
      guestNameLocked = false;
      authStatus = "GUEST READY";
      authBusy = false;
      authMode = "menu";
      srCursor = 0;
      return;
    }
    if (authMode === "signin" || authMode === "signup") {
      const pinOk = api.sanitizePin ? api.sanitizePin(authPin) : /^\d{4}$/.test(authPin) ? authPin : "";
      if (!pinOk) {
        authStatus = "PIN 4 DIGITS";
        authBusy = false;
        authField = 1;
        return;
      }
      if (authMode === "signin") {
        res = await api.signIn(authUser, authPin);
        authStatus = res.ok ? "SIGNED IN" : (res.error || "FAILED").toUpperCase().slice(0, 24);
        if (res.ok) {
          srName = api.displayName() || authUser;
          guestNameLocked = true;
          authMode = "menu";
          srCursor = 0;
          authPin = "";
        }
      } else {
        res = await api.signUp(authUser, authPin);
        if (res.ok) {
          authStatus = "SIGNED UP";
          srName = api.displayName() || authUser;
          guestNameLocked = true;
          authMode = "menu";
          srCursor = 0;
          authPin = "";
        } else authStatus = (res.error || "FAILED").toUpperCase().slice(0, 24);
      }
    }
    authBusy = false;
  }

  function onSpeedMenuKey(k) {
    if (uiScreen === "mode") {
      if (k === "arrowup" || k === "w") srCursor = (srCursor + modeOpts.length - 1) % modeOpts.length;
      if (k === "arrowdown" || k === "s") srCursor = (srCursor + 1) % modeOpts.length;
      if (k === "enter" || k === " ") {
        if (srCursor === 0) enterNormalMode();
        else if (srCursor === 1) {
          playMode = "speedrun";
          uiScreen = "categories";
          srCursor = 0;
          refreshSpeedBoard(SPEED_ORDER[0]);
        } else if (srCursor === 2) {
          uiScreen = "account";
          authMode = "menu";
          authStatus = "";
          srCursor = 0;
          const api = lbApi();
          if (api && api.ensureProfile && api.isSignedIn && api.isSignedIn()) api.ensureProfile();
        } else if (srCursor === 3) {
          uiScreen = "nm_boards";
          nmCursor = 0;
          nmBoardKind = "playtime";
          refreshNmBoard(nmBoardKind);
        }
      }
      return true;
    }
    if (uiScreen === "account") {
      const api = lbApi();
      const signed = api && api.isSignedIn && api.isSignedIn();
      if (signed) {
        if (k === "arrowup" || k === "w") srCursor = (srCursor + 2) % 3;
        if (k === "arrowdown" || k === "s") srCursor = (srCursor + 1) % 3;
        if (k === "escape" || ((k === "enter" || k === " ") && srCursor === 2)) {
          backToModeMenu();
          return true;
        }
        if ((k === "enter" || k === " ") && srCursor === 0) {
          setChatNotifsEnabled(!chatNotifsEnabled);
          return true;
        }
        if ((k === "enter" || k === " ") && srCursor === 1) {
          api.signOut();
          guestNameLocked = false;
          authStatus = "SIGNED OUT";
          authMode = "menu";
          srCursor = 0;
        }
        return true;
      }
      if (authMode === "menu") {
        if (k === "escape") {
          backToModeMenu();
          return true;
        }
        if (k === "arrowup" || k === "w") srCursor = (srCursor + 4) % 5;
        if (k === "arrowdown" || k === "s") srCursor = (srCursor + 1) % 5;
        if (k === "enter" || k === " ") {
          if (srCursor === 0) {
            authMode = "signin";
            authField = 0;
            authStatus = "";
            authUser = (api && api.getLastName && api.getLastName()) || authUser || "";
            authPin = "";
          } else if (srCursor === 1) {
            authMode = "signup";
            authField = 0;
            authStatus = "";
            authUser = "";
            authPin = "";
          } else if (srCursor === 2) {
            authMode = "guest";
            authField = 0;
            authName = (api && api.getLastName && api.getLastName()) || srName || "";
            authStatus = "";
          } else if (srCursor === 3) {
            setChatNotifsEnabled(!chatNotifsEnabled);
          } else backToModeMenu();
        }
        return true;
      }
      const maxF = authFieldCount() - 1;
      if (k === "escape") {
        authMode = "menu";
        srCursor = 0;
        authStatus = "";
        return true;
      }
      if (k === "arrowup" || k === "w") authField = Math.max(0, authField - 1);
      if (k === "arrowdown" || k === "s" || k === "tab") authField = Math.min(maxF, authField + 1);
      if (k === "backspace") {
        backspaceAuth();
        return true;
      }
      if (k === "enter" || k === " ") {
        if (authMode === "guest") {
          if (authField === 0) authField = 1;
          else if (authField === 1) submitAuthAction();
          else {
            authMode = "menu";
            srCursor = 0;
          }
        } else {
          const fields = 2; // USER + PIN
          if (authField < fields) authField += 1;
          else if (authField === fields) submitAuthAction();
          else {
            authMode = "menu";
            srCursor = 0;
          }
        }
        return true;
      }
      return true;
    }
    if (uiScreen === "nm_boards") {
      const api = lbApi();
      const order = (api && api.NM_ORDER) || ["playtime", "level", "sharks", "chests", "coins"];
      if (k === "escape") {
        backToModeMenu();
        return true;
      }
      if (k === "arrowup" || k === "w") {
        nmCursor = (nmCursor + order.length - 1) % order.length;
        nmBoardKind = order[nmCursor];
        refreshNmBoard(nmBoardKind);
      }
      if (k === "arrowdown" || k === "s") {
        nmCursor = (nmCursor + 1) % order.length;
        nmBoardKind = order[nmCursor];
        refreshNmBoard(nmBoardKind);
      }
      return true;
    }
    if (uiScreen === "categories") {
      if (k === "escape") {
        backToModeMenu();
        return true;
      }
      if (k === "arrowup" || k === "w") {
        srCursor = (srCursor + SPEED_ORDER.length - 1) % SPEED_ORDER.length;
        refreshSpeedBoard(SPEED_ORDER[srCursor]);
      }
      if (k === "arrowdown" || k === "s") {
        srCursor = (srCursor + 1) % SPEED_ORDER.length;
        refreshSpeedBoard(SPEED_ORDER[srCursor]);
      }
      if (k === "enter" || k === " ") beginSpeedCategory(SPEED_ORDER[srCursor]);
      return true;
    }
    if (uiScreen === "ready") {
      if (k === "escape") {
        backToCategories();
        return true;
      }
      if (k === "r") {
        beginSpeedCategory(srCat);
        return true;
      }
      if (k === "enter" || k === " ") {
        maybeStartSpeedTimer();
        return true;
      }
      return false;
    }
    if (uiScreen === "finish") {
      const nameLocked = guestNameLocked;
      if (srFinishSel === 0 && !nameLocked) {
        if (k === "backspace") {
          srName = srName.slice(0, -1);
          return true;
        }
        if (k === "arrowdown" || k === "enter" || k === "tab") {
          srFinishSel = 1;
          return true;
        }
        if (k === "escape") {
          backToCategories();
          return true;
        }
        if (k.length === 1) {
          const ch = k.toUpperCase();
          if (/[A-Z0-9 ]/.test(ch) && srName.length < 12) srName += ch === " " ? " " : ch;
          return true;
        }
        return true;
      }
      if (k === "arrowup" || k === "w") {
        if (nameLocked) srFinishSel = Math.max(1, srFinishSel - 1);
        else srFinishSel = srFinishSel <= 1 ? 0 : srFinishSel - 1;
      }
      if (k === "arrowdown" || k === "s") srFinishSel = Math.min(4, srFinishSel + 1);
      if (k === "arrowleft" || k === "a") {
        if (srFinishSel === 2 || srFinishSel === 4) srFinishSel -= 1;
      }
      if (k === "arrowright" || k === "d") {
        if (srFinishSel === 1 || srFinishSel === 3) srFinishSel += 1;
      }
      if (k === "enter" || k === " ") {
        if (srFinishSel === 1) {
          if (!srSubmitted) submitSpeedScore();
        } else if (srFinishSel === 2) beginSpeedCategory(srCat);
        else if (srFinishSel === 3) backToCategories();
        else if (srFinishSel === 4) backToModeMenu();
      }
      if (k === "escape") backToCategories();
      return true;
    }
    return false;
  }

  function saveGame() {
    if (playMode !== "normal") return;
    try {
      const slots = [];
      for (let i = 0; i < inventory.length; i++) {
        const s = inventory[i];
        slots.push(s && s.id ? { id: s.id, count: s.count | 0 } : null);
      }
      const data = {
        slots,
        heldSlot,
        coins: player.coins | 0,
        xp: player.xp | 0,
        level: player.level | 0,
        hp: player.hp | 0,
        x: player.x,
        y: player.y,
        facing: player.facing,
        aboard: !!player.aboard,
        scene,
        cloak: cloakOn,
        boat: ownedBoat
          ? { x: ownedBoat.x, y: ownedBoat.y, face: ownedBoat.face || 1, landed: !!ownedBoat.landed }
          : null,
      };
      localStorage.setItem(SAVE_KEY, JSON.stringify(data));
    } catch (err) {}
  }

  function loadGame() {
    let data;
    try {
      data = JSON.parse(localStorage.getItem(SAVE_KEY) || "");
    } catch (err) {
      return;
    }
    if (!data || !Array.isArray(data.slots)) return;
    for (let i = 0; i < inventory.length; i++) {
      const s = data.slots[i];
      inventory[i] = s && s.id && ITEM_DEFS[s.id] ? { id: s.id, count: Math.max(1, s.count | 0) } : null;
    }
    heldSlot = Math.max(0, Math.min(inventory.length - 1, data.heldSlot | 0));
    player.coins = Math.max(0, data.coins | 0);
    player.xp = Math.max(0, data.xp | 0);
    player.level = Math.max(1, data.level | 0);
    player.hp = Math.max(0, Math.min(MAX_HP, data.hp | 0));
    if (typeof data.x === "number") player.x = data.x;
    if (typeof data.y === "number") player.y = data.y;
    if (data.facing === -1 || data.facing === 1) player.facing = data.facing;
    player.aboard = !!data.aboard;
    if (data.scene === "shop" || data.scene === "fish" || data.scene === "cabin" || data.scene === "island") {
      scene = data.scene;
    }
    cloakOn = !!data.cloak && inventory.some((s) => s && s.id === "cloak");
    if (scene === "cabin") player.aboard = false;
    if (data.boat && typeof data.boat.x === "number") {
      ownedBoat = {
        x: data.boat.x,
        y: data.boat.y,
        w: 22,
        h: 10,
        vx: 0,
        vy: 0,
        tilt: 0,
        phase: 0,
        face: data.boat.face === -1 ? -1 : 1,
        kind: "skiff",
        landed: data.boat.landed !== false,
      };
    } else if (player.aboard) {
      player.aboard = false;
    }
  }

  let last = performance.now();
  function loop(now) {
    const dt = Math.min(0.05, (now - last) / 1000);
    last = now;
    time = now / 1000;
    const zoomTarget = zoomGoal();
    const punch = Math.abs(zoomTarget - zoom) > 0.04 || isIndoor();
    zoom += (zoomTarget - zoom) * (1 - Math.exp(-dt * (punch ? 14 : 5.2)));
    if (Math.abs(zoom - zoomTarget) < 0.004) zoom = zoomTarget;
    viewW = canvas.width / zoom;
    viewH = canvas.height / zoom;
    updateFade(dt);
    updateDoors(dt);
    updatePlayer(dt);
    updatePickup(dt);
    updateXpFx(dt);
    updateHorn();
    updateUseFx(dt);
    updateLoot();
    updateShopTrade(dt);
    updateTradeCoinDrift(dt);
    updateCabinCut(dt);
    updateBlowfishSpeedEnd(dt);
    updateCabinFish(dt);
    updateBoatThrow(dt);
    updateCrabs(dt);
    if (scene === "island") {
      updateFish(dt);
    }
    updateRod(dt);
    updateSerpent(dt);
    updateWandBolts(dt);
    if (fishCastT > 0) fishCastT = Math.max(0, fishCastT - dt);
    nearestLoot = findNearestLoot();
    tryAutoPickup();
    nearestLoot = findNearestLoot();
    updatePrompt();
    updateOcean();
    draw(time);
    // Normal-mode session playtime (speedrun playtime credited once on finish)
    if (playMode === "normal" && !uiBlocksPlay() && !guideOpen) {
      playtimeAcc += dt * 1000;
    }
    playtimeFlush += dt;
    if (playtimeFlush >= 5 && playtimeAcc >= 1) {
      const api = lbApi();
      const add = playtimeAcc | 0;
      playtimeAcc = 0;
      playtimeFlush = 0;
      if (api && api.noteNmEvent && playMode === "normal") {
        api.noteNmEvent("playtime", add);
        if (api.isSignedIn && api.isSignedIn() && api.syncNmStatsToProfile) api.syncNmStatsToProfile();
      }
    }
    saveAcc += dt;
    if (saveAcc >= 1.5) {
      saveAcc = 0;
      saveGame();
    }
    requestAnimationFrame(loop);
  }

  window.addEventListener("keydown", (e) => {
    const k = e.key.toLowerCase();
    keys[k] = true;
    ensureAudio();
    if (k === "z") e.preventDefault();
    if (
      [
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
        "t",
        "f",
        "c",
        "h",
        "r",
        "escape",
        "tab",
        "backspace",
      ].includes(k)
    ) {
      e.preventDefault();
    }

    // Tab toggles island chat globally (not C — C/F still cast)
    if (k === "tab") {
      e.preventDefault();
      if (!e.repeat) toggleIslandChat();
      return;
    }

    // Esc closes chat first when open
    if (k === "escape" && chatOpen) {
      e.preventDefault();
      closeIslandChat();
      return;
    }

    // Chat composer captures typing (blocks move/cast/trade leak)
    if (chatCapturesInput()) {
      if (k === "enter") {
        e.preventDefault();
        if (!e.repeat) trySendChat();
        return;
      }
      if (k === "backspace") {
        e.preventDefault();
        backspaceChat();
        return;
      }
      if (k === "arrowup") {
        chatScroll = Math.min(chatScroll + 1, 200);
        return;
      }
      if (k === "arrowdown") {
        chatScroll = Math.max(0, chatScroll - 1);
        return;
      }
      if (!e.ctrlKey && !e.metaKey && e.key.length === 1) {
        e.preventDefault();
        typeIntoChat(e.key);
        return;
      }
      // Swallow game binds while chat focused
      if (["c", "f", "t", " ", "h", "r"].includes(k) || (k >= "1" && k <= "8")) {
        e.preventDefault();
        return;
      }
      return;
    }

    if (
      uiScreen === "account" &&
      authMode !== "menu" &&
      !e.ctrlKey &&
      !e.metaKey &&
      e.key.length === 1 &&
      e.key !== " "
    ) {
      typeIntoAuth(e.key);
      e.preventDefault();
      return;
    }
    if (uiScreen && uiScreen !== null) {
      if (e.repeat && uiScreen !== "finish" && uiScreen !== "account") return;
      if (onSpeedMenuKey(k)) return;
    }
    if (playMode === "speedrun" && k === "r" && !e.repeat && uiScreen === null && srRunning) {
      beginSpeedCategory(srCat);
      return;
    }
    if (uiBlocksPlay()) return;
    if (k === "h") {
      if (!e.repeat) guideOpen = !guideOpen;
      return;
    }
    if (k === "escape" && playMode === "normal" && !uiBlocksPlay()) {
      if (guideOpen) {
        guideOpen = false;
        return;
      }
      if (cabinCut.kind) return;
      saveGame();
      if (serpent) endSerpentFight("flee");
      backToModeMenu();
      return;
    }
    if (guideOpen || cabinCut.kind) return;
    if (e.repeat) {
      if (k === "enter" && isIndoor()) dropHeld();
      return;
    }
    if (k >= "1" && k <= "8") heldSlot = k.charCodeAt(0) - 49;
    if (k === "enter") onEnter();
    if (k === " ") useHeld();
    if (k === "t") tryTradeKey();
    if (k === "c" || k === "f") tryCastRod();
  });
  window.addEventListener("keyup", (e) => {
    const k = e.key.toLowerCase();
    keys[k] = false;
    if (k === " ") {
      if (!chatCapturesInput()) releaseHorn();
    }
  });
  window.addEventListener("pointerdown", () => ensureAudio());

  function refreshMenuHover(ux, uy) {
    pointerUi.x = ux;
    pointerUi.y = uy;
    const chatHit = hitChatAt(ux, uy);
    const hit = hitMenuAt(ux, uy);
    const next = hit ? hit.key : chatHit ? chatHit.key : "";
    if (next !== menuHoverKey) {
      menuHoverKey = next;
      if (hit && hit.key.indexOf("cat:") === 0 && hit.key !== "cat:esc") {
        const idx = parseInt(hit.key.split(":")[1], 10);
        if (!isNaN(idx) && SPEED_ORDER[idx] && srCursor !== idx && uiScreen === "categories") {
          srCursor = idx;
          refreshSpeedBoard(SPEED_ORDER[idx]);
        }
      }
      if (hit && hit.key.indexOf("mode:") === 0 && uiScreen === "mode") {
        const idx = parseInt(hit.key.split(":")[1], 10);
        if (!isNaN(idx)) srCursor = idx;
      }
      if (hit && hit.key.indexOf("nm:") === 0 && hit.key !== "nm:esc" && uiScreen === "nm_boards") {
        const idx = parseInt(hit.key.split(":")[1], 10);
        const api = lbApi();
        const order = (api && api.NM_ORDER) || ["playtime", "level", "sharks", "chests", "coins"];
        if (!isNaN(idx) && order[idx] && nmCursor !== idx) {
          nmCursor = idx;
          nmBoardKind = order[idx];
          refreshNmBoard(nmBoardKind);
        }
      }
      if (hit && hit.key.indexOf("fin:btn:") === 0 && uiScreen === "finish") {
        const idx = parseInt(hit.key.split(":")[2], 10);
        if (!isNaN(idx)) srFinishSel = idx + 1;
      }
    }
    canvas.style.cursor = hit || (chatHit && chatHit.onClick) || (chatHit && chatHit.meta && chatHit.meta.tip) ? "pointer" : "";
  }

  canvas.addEventListener("mousemove", (e) => {
    const p = eventToUi(e);
    pointerUi.x = p.x;
    pointerUi.y = p.y;
    if (!uiScreen && !chatOpen) {
      menuHoverKey = "";
      canvas.style.cursor = "";
      return;
    }
    refreshMenuHover(p.x, p.y);
  });

  canvas.addEventListener("mousedown", (e) => {
    if (e.button !== 0) return;
    ensureAudio();
    const p = eventToUi(e);
    pointerUi.x = p.x;
    pointerUi.y = p.y;
    const chatHit = hitChatAt(p.x, p.y);
    if (chatHit && typeof chatHit.onClick === "function") {
      e.preventDefault();
      chatHit.onClick();
      return;
    }
    if (chatOpen && !chatHit) {
      // Click outside composer keeps chat open but unfocuses if outside panel composer area
      const uiW = canvas.width / SCALE_UI;
      const panelW = Math.min(152, Math.max(120, (uiW * 0.3) | 0));
      if (p.x < uiW - panelW - 3) chatFocused = false;
    }
    if (!uiScreen) return;
    refreshMenuHover(p.x, p.y);
    const hit = hitMenuAt(p.x, p.y);
    if (hit && typeof hit.onClick === "function") {
      e.preventDefault();
      hit.onClick();
    }
  });

  canvas.addEventListener("mouseleave", () => {
    menuHoverKey = "";
    canvas.style.cursor = "";
    pointerUi.x = -9999;
    pointerUi.y = -9999;
  });

  canvas.addEventListener(
    "wheel",
    (e) => {
      if (!chatOpen) return;
      const p = eventToUi(e);
      const uiW = canvas.width / SCALE_UI;
      const panelW = Math.min(152, Math.max(120, (uiW * 0.3) | 0));
      if (p.x < uiW - panelW - 3) return;
      e.preventDefault();
      if (e.deltaY < 0) chatScroll = Math.min(200, chatScroll + 1);
      else chatScroll = Math.max(0, chatScroll - 1);
    },
    { passive: false }
  );

  function indoorZoom() {
    const zx = canvas.width / indoorW();
    const zy = canvas.height / indoorH();
    return Math.max(2, Math.min(zx, zy) * 0.9);
  }

  function zoomGoal() {
    const goingShop =
      fadeMode && fadeNext && (fadeNext.scene === "shop" || fadeNext.scene === "fish" || fadeNext.scene === "cabin");
    const goingOut = fadeMode && fadeNext && fadeNext.scene === "island";
    if (goingShop || (isIndoor() && !goingOut)) return indoorZoom();
    return keys.z ? SCALE_FAR : SCALE_DEFAULT;
  }

  function clampCamera() {
    if (isIndoor()) {
      const rw = indoorW();
      const rh = indoorH();
      if (viewW >= rw) camera.x = -((viewW - rw) / 2);
      else camera.x = Math.max(0, Math.min(rw - viewW, camera.x));
      if (viewH >= rh) camera.y = -((viewH - rh) / 2);
      else camera.y = Math.max(0, Math.min(rh - viewH, camera.y));
      return;
    }
    camera.x = Math.max(0, Math.min(Math.max(0, COLS * TILE - viewW), camera.x));
    camera.y = Math.max(0, Math.min(Math.max(0, ROWS * TILE - viewH), camera.y));
  }

  function resizeCanvas() {
    const w = Math.max(1, window.innerWidth | 0);
    const h = Math.max(1, window.innerHeight | 0);
    if (canvas.width !== w) canvas.width = w;
    if (canvas.height !== h) canvas.height = h;
    viewW = canvas.width / zoom;
    viewH = canvas.height / zoom;
    clampCamera();
  }

  window.addEventListener("resize", resizeCanvas);
  window.addEventListener("beforeunload", () => {
    saveGame();
    const api = lbApi();
    if (api && api.isSignedIn && api.isSignedIn() && api.syncNmStatsToProfile) {
      api.syncNmStatsToProfile();
    }
  });

  buildWorld();
  resizeCanvas();
  camera.x = player.x + player.w / 2 - viewW / 2;
  camera.y = player.y + player.h / 2 - viewH * 0.36;
  clampCamera();
  {
    loadChatNotifsPref();
    const api = lbApi();
    if (api) {
      srName = api.getLastName() || "";
      if (api.onAuthChange) {
        api.onAuthChange(() => {
          if (api.isSignedIn && api.isSignedIn()) {
            srName = api.displayName() || srName;
            guestNameLocked = true;
          } else {
            guestNameLocked = false;
          }
        });
      }
      if (api.onChatUpdate) {
        api.onChatUpdate(() => {
          try {
            refreshChatUnread();
          } catch (e) {}
        });
      }
      if (api.isSignedIn && api.isSignedIn()) {
        srName = api.displayName() || srName;
        guestNameLocked = true;
      }
    }
  }
  requestAnimationFrame(loop);
})();
