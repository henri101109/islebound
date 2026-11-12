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
    waterfall_eel: { name: "Waterfall eel", max: 24, xp: 42 },
    portal_leech: { name: "Portal leech", max: 16, xp: 70 },
    megalodon: { name: "Megalodon", max: 8, xp: 100 },
    chest: { name: "Treasure chest", max: 1, xp: 40 },
    wand: { name: "Wand", max: 1, xp: 0 },
    cloak: { name: "Cloak", label: "CLOAK", max: 1, xp: 0, cosmetic: "back" },
    jade_mask: { name: "Jade Mask", label: "MASK", max: 1, xp: 20, cosmetic: "face" },
    straw_hat: { name: "Straw Hat", label: "STRAW", max: 1, xp: 0, cosmetic: "face" },
    crown: { name: "Crown", label: "CROWN", max: 1, xp: 0, cosmetic: "face" },
    beta_crown: { name: "Beta Crown", label: "BETA", max: 1, xp: 0, cosmetic: "face" },
    cape: { name: "Ember Cape", label: "EMBER", max: 1, xp: 12, cosmetic: "back" },
    job_app_cloak: { name: "Job App Cloak", label: "JOBAPP", max: 1, xp: 0, cosmetic: "back" },
    american_cloak: { name: "American Cloak", label: "USA", max: 1, xp: 0, cosmetic: "back" },
    jelly_cape: { name: "Jellyfish Cape", label: "JELLY", max: 1, xp: 0, cosmetic: "back" },
    stop_pre_flag: { name: "STOP PRE Flag", label: "STOPPRE", max: 1, xp: 0, cosmetic: "back" },
    sun_idol: { name: "Sun Idol", max: 1, xp: 10 },
    serpent_heart: { name: "Heart of the Sea", max: 24, xp: 80 },
    sunken_chest: { name: "Sunken chest", max: 1, xp: 50 },
    potion_red: { name: "Red potion", max: 8, xp: 4 },
    potion_blue: { name: "Blue potion", max: 8, xp: 4 },
    potion_gold: { name: "Gold potion", max: 4, xp: 8 },
    potion_fury: { name: "Fury potion", max: 4, xp: 10 },
    potion_warp: { name: "Warp potion", max: 4, xp: 8 },
    potion_smoke: { name: "Smoke potion", max: 4, xp: 6 },
    vein_gem: { name: "Vein gem", max: 24, xp: 22 },
    mountain_heart: { name: "Heart of the Mountain", max: 8, xp: 100 },
    key_bronze: { name: "Bronze key", max: 1, xp: 5 },
    key_silver: { name: "Silver key", max: 1, xp: 8 },
    key_gold: { name: "Gold key", max: 1, xp: 12 },
    olive: { name: "Olives", max: 16, xp: 2 },
    roman_bread: { name: "Bread", max: 16, xp: 2 },
    roman_wine: { name: "Wine", max: 8, xp: 4 },
    king_crown: { name: "Crown of the Kingdom", label: "KING", max: 1, xp: 0, cosmetic: "face" },
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
  const TRADE_VALUE = { gem: 5, crystal: 25, jelly: 15, vein_gem: 18 };
  const GEM_TRADE = { gem: 5, crystal: 25, vein_gem: 18 };
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
    waterfall_eel: 95,
    portal_leech: 180,
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
    ["waterfall_eel", "EEL"],
    ["portal_leech", "LEECH"],
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
  const satchel = [null, null, null, null, null, null, null, null];
  let satchelOpen = false;
  let slotDrag = null;
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
  const TEMPLE_W = 960;
  const TEMPLE_H = 720;
  const HUB_W = 260;
  const HUB_H = 180;
  const SUB_W = 208;
  const SUB_H = 132;
  const FLOOR_W = 336;
  const FLOOR_H = 196;
  const WRECK_W = 208;
  const WRECK_H = 240;
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
    "waterfall_eel",
    "portal_leech",
    "megalodon",
  ];
  const walkPads = [];
  const islandSolids = [];
  const shopSolids = [];
  const fishSolids = [];
  const cabinSolids = [];
  const templeSolids = [];
  const hubSolids = [];
  const subSolids = [];
  const floorSolids = [];
  const wreckSolids = [];
  const npcs = [];
  const boats = [];
  const swimFish = [];
  const sandBits = [];
  const MAX_SAND = 120;
  let shopCanvas = null;
  let fishCanvas = null;
  let cabinCanvas = null;
  let templeCanvas = null;
  let hubCanvas = null;
  let subCanvas = null;
  let floorCanvas = null;
  let wreckCanvas = null;
  let templeWorldCanvas = null;
  let templeWorldOX = 0;
  let templeWorldOY = 0;
  let ruinsCanvas = null;
  let ruinsOX = 0;
  let ruinsOY = 0;
  let ruinsSite = null;
  let ruinsPortal = null;
  /** Inland jungle pond (dock ↔ ruins): scenery + dinghy fishing. */
  let pondCanvas = null;
  let pondOX = 0;
  let pondOY = 0;
  let pondSite = null;
  /** Ellipse in world space: { cx, cy, rx, ry }. */
  let pondWater = null;
  let pondPad = null;
  let pondBoat = null;
  let pondPost = null;
  /** Animated waterfall sheets: [{ x, y, w, h }] world space. */
  let pondFalls = [];
  /** Pond dinghy fishing is live when the pool exists. */
  let pondFishReady = false;
  /** "skiff" | "dinghy" | null — which craft player.aboard refers to. */
  let aboardKind = null;
  /** Portal leech catch FX. */
  let leechGlow = null;
  let mazeInfo = null;
  let shopDoor = null;
  let shopExit = null;
  let fishDoor = null;
  let fishExit = null;
  let fishDockExit = null;
  let cabinDoor = null;
  let cabinExit = null;
  let cabinDockExit = null;
  let templeDoor = null;
  let templeExit = null;
  let templeIslandExit = null;
  let vein = null;
  let rome = null;
  let veinDoor = null;
  let veinIslandExit = null;
  let hubExit = null;
  let subDoor = null;
  let subHull = null;
  let subIslandExit = null;
  let subExit = null;
  let subHatch = null;
  let subLever = null;
  let floorHatch = null;
  let floorWreckDoor = null;
  let wreckExit = null;
  let wreckChest = null;
  let templePedestal = null;
  let templeMaskTaken = false;
  let divePhase = "docked";
  let diveT = 0;
  let diveTip = "";
  let diveTipT = 0;
  let diveLeverHeld = false;
  let sunkenTaken = false;
  let floorSharks = [];
  let floorMega = { x: 24, y: 18, dir: 1, speed: 16 };
  let dailyLootId = null;
  let dailyClaimedUtc = "";
  let hubUi = { tip: "", tipT: 0 };
  let hubPeers = [];
  let hubEmote = "";
  let hubEmoteT = 0;
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
  /** Designated skiff slip at the finger-pier tip: { x, y, w, h, face }. */
  let boatBerth = null;
  /** T-head deck at the end of the finger pier (where Enter drops you off). */
  let boatBerthDeck = null;
  /** Blocks walk-on auto-board after hopping off the berth (old magnet was yanking you back). */
  let boatBoardCool = 0;
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
  /** Chunked land bake — one 8320×2368 canvas exceeds Safari/iOS limits → all-water worlds. */
  const LAND_CHUNK_W = 2048;
  let landChunks = [];
  let landCanvas = null; // legacy null-check alias; real pixels live in landChunks
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
    "mask",
    "waterfall_eel",
    "portal_leech",
    "kings_race",
    "full_kings",
  ];
  let playMode = null;
  /** Cold boot shows logo card; Esc from play returns straight to "mode". */
  let uiScreen = "logo";
  const LOGO_FRAMES = 12;
  const LOGO_FRAME_MS = 150;
  const LOGO_POP_MS = 220;
  const LOGO_HOLD_MS = 1000;
  const LOGO_FADE_MS = 400;
  const LOGO_FRAME_PX = 256;
  let logoStartPerf = 0;
  let logoSheet = null;
  let logoSheetReady = false;
  {
    const img = new Image();
    img.onload = () => {
      logoSheet = img;
      logoSheetReady = true;
    };
    img.onerror = () => {
      logoSheetReady = false;
    };
    img.src = "assets/logo-pier-sheet.png";
  }
  let srCat = "shark";
  let srRunning = false;
  let srTiming = false;
  /** performance.now() when the speed clock was paused; 0 = running. */
  let srPauseAt = 0;
  let srStartPerf = 0;
  let srElapsed = 0;
  let srFinalMs = 0;
  let pendingRaceSeg = null;
  let srSegmentSurvival = false;
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
  /** Countdown after blowfish heart FX before Blowfish% ends; -1 = idle. */
  let srBlowfishFinishT = -1;
  /** Floating hearts above player after catching a blowfish: { t, dur }. */
  let blowfishHearts = null;
  /** Jade/gold sparks orbiting the player after the jade mask is equipped: { t, dur, sparks }. */
  let jadeMaskFx = null;
  /** Dense speedrun replay recording / top-10 spectate. */
  let srReplayFrames = [];
  let srReplayLastT = -999;
  /** Last full replay payload loaded for spectate (must still match prefer before play). */
  let srBestReplay = null;
  /** boolean[] aligned with srBoardRows — which top-10 rows have a matching VID. */
  let srReplayAvail = [];
  let srReplayBusy = false;
  /** Bumped to cancel in-flight VID fetch / stale playBoardReplay results. */
  let replayPlayGen = 0;
  /** AbortController for the in-flight fetchBestReplay (hard-cut kills the network too). */
  let replayFetchAbort = null;
  /** Bumped to ignore stale refreshSpeedBoard / probe results. */
  let srBoardGen = 0;
  let replayActive = false;
  let replayFrames = [];
  let replayT = 0;
  let replayMeta = null;
  /** Brief fade-from-black when starting / switching spectate replay. */
  let replayCutT = 0;
  const REPLAY_SCENE = {
    island: 0,
    shop: 1,
    fish: 2,
    cabin: 3,
    temple: 4,
    hub: 5,
    sub: 6,
    floor: 7,
    wreck: 8,
    vein: 9,
  };
  const REPLAY_SCENE_INV = [
    "island",
    "shop",
    "fish",
    "cabin",
    "temple",
    "hub",
    "sub",
    "floor",
    "wreck",
    "vein",
  ];
  const REPLAY_ROD = { idle: 0, wait: 1, reel: 2 };
  const REPLAY_ROD_INV = ["idle", "wait", "reel"];
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
  const MODE_PLAY = ["NORMAL", "SPEEDRUN", "HUB", "ACCOUNT", "STATS", "ISLEPASS"];
  const WEEKLY_SPIN = {
    firstEndMs: Date.UTC(2026, 10, 11, 23, 59, 59),
    weekMs: 7 * 24 * 60 * 60 * 1000,
    cost: 0,
    spins: 3,
    prizes: [
      { id: "straw_hat", label: "STRAW HAT", p: 0.5 },
      { id: "crown", label: "CROWN", p: 0.3 },
      { id: "beta_crown", label: "BETA CROWN", p: 0.2 },
    ],
  };
  let spinCursor = 0;
  let spinNote = "";
  let spinUsed = 0;
  let spinPeriodKey = "";
  /** After depleted spins, show NEXT WEEK only on the first extra press. */
  let spinNextWeekTold = false;
  /** CS:GO-style horizontal reel; outcome is fixed before the strip moves. */
  let spinReel = null;
  const MODE_WALK = ["SURVIVAL", "SPEEDRUN", "HUB"];
  /** Title-screen cursor across play modes + walkthroughs. */
  let modeOpts = MODE_PLAY.concat(MODE_WALK);
  let walkKind = "normal";
  let walkStep = 0;
  const WALK_PAGES = {
    normal: [
      {
        title: "SURVIVAL",
        lines: ["OPEN-WORLD PLAY", "PROGRESS AUTOSAVES", "ESC RETURNS HERE", "H OPENS FULL GUIDE"],
      },
      {
        title: "MOVE",
        lines: ["WASD TO WALK", "HOLD Z TO LOOK FAR", "WALK INTO LOOT", "WALK TO BOARD BOAT"],
      },
      {
        title: "ITEMS",
        lines: ["1-4 TOP ROW", "5-8 BOTTOM ROW", "BAG IS FOR LOOT", "E OPENS THE SATCHEL"],
      },
      {
        title: "COSMETICS",
        lines: ["EQUIP IN MAIN MENU", "DRAG TO FACE/BACK", "SKINS ON THE LOCKER", "CLOAK SPACE = STEALTH"],
      },
      {
        title: "FISH",
        lines: ["C OR F CASTS ROD", "HOLD BAIT TO CAST", "HEART / SHARK = SUPER", "REEL WHEN IT BITES"],
      },
      {
        title: "ISLAND",
        lines: ["SHOP BUYS THE BOAT", "T TRADES NEAR NPC", "TEMPLE: WEST JUNGLE", "HUB IS A MENU MODE"],
      },
      {
        title: "TEMPLE",
        lines: ["WEST OF THE DOCK", "DEEP INLAND, IN TREES", "HUGE MAZE, NO TRAPS", "JADE MASK AT THE END"],
      },
      {
        title: "GOALS",
        lines: ["CATCH RARE FISH", "OPEN MASTER CHEST", "JADE MASK IN TEMPLE", "PORTAL LEADS TO ROME"],
      },
    ],
    speedrun: [
      {
        title: "SPEEDRUN",
        lines: ["PICK A CATEGORY", "TIMER STARTS ON MOVE", "R RESETS THE RUN", "BEAT YOUR PB"],
      },
      {
        title: "CONTROLS",
        lines: ["SAME AS SURVIVAL", "WASD MOVE / C CAST", "SPACE USES HELD", "ESC BACK TO MENU"],
      },
      {
        title: "CATEGORIES",
        lines: ["SHARK% CATCH SHARK", "BOAT% BUY THE BOAT", "CHEST% OPEN CHEST", "SERPENT% GET HEART"],
      },
      {
        title: "MORE CATS",
        lines: ["DEATH% DIE FAST", "FULL INV% FILL BAG", "COIN% REACH GOAL", "BLOWFISH% CATCH ONE"],
      },
      {
        title: "POND CATS",
        lines: ["EEL% WATERFALL EEL", "LEECH% PORTAL LEECH", "DINGHY ON RIVER POOL", "WALK INLAND FROM DOCK"],
      },
      {
        title: "MASK%",
        lines: ["MASK% JADE MASK", "TEMPLE MAZE, FAR END", "TOUCH THE PEDESTAL", "BAG SPACE NOT NEEDED"],
      },
      {
        title: "KINGS RACE",
        lines: ["PORTAL OPENS ON ROME", "KINGS RACE% IS THE LINE", "ANY FINISH COUNTS", "FULL KINGS% WALKS THE CITY"],
      },
      {
        title: "SHIP",
        lines: ["METAL HULL OFFSHORE", "EAST OF THE DOCK", "IT ONLY BOBS", "YOU CANNOT BOARD"],
      },
      {
        title: "SUBMIT",
        lines: ["FINISH LOCKS TIME", "TYPE A NAME", "POST TO TOP 10", "REPLAY MAY SAVE"],
      },
    ],
    hub: [
      {
        title: "HUB",
        lines: ["OPEN SHARED PLAZA", "SEE ONLINE PLAYERS", "NAMETAGS ABOVE HEADS", "JUST HANG OUT"],
      },
      {
        title: "CONTROLS",
        lines: ["WASD TO WALK", "E SENDS AN EMOTE", "TAB OPENS CHAT", "ESC RETURNS HERE"],
      },
      {
        title: "HANGOUT",
        lines: ["WALK, CHAT, LOOK AROUND", "COSMETICS SHOW UP", "DOOR OR ESC EXITS", "OPEN FROM THE MENU"],
      },
    ],
  };
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
  /** Equipped cosmetics (ids) — locker profile, shared across modes. */
  const cosmetics = { face: null, back: null };
  /** Owned cosmetic ids (not inventory). */
  let ownedCosmetics = [];
  /** Body skin id. */
  let playerSkin = "classic";
  let ownedSkins = ["classic"];
  /** Returning players (existing save) get all launch skins once. */
  let skinsGrantedLegacy = false;
  const LOCKER_PROFILE_KEY = "islebound-locker-profile";
  const SKIN_DEFS = {
    classic: { id: "classic", label: "CLASSIC" },
    jakob: { id: "jakob", label: "JAKOB" },
    fisherman_joe: { id: "fisherman_joe", label: "JOE" },
    beta_alien: { id: "beta_alien", label: "ALIEN" },
    usain_bolt: { id: "usain_bolt", label: "BOLT" },
    among_us_red: { id: "among_us_red", label: "CREW" },
    homer: { id: "homer", label: "HOMER" },
    indiana_jones: { id: "indiana_jones", label: "INDY" },
    flash: { id: "flash", label: "FLASH" },
    eric_cartman: { id: "eric_cartman", label: "CARTMAN" },
    shrek: { id: "shrek", label: "SHREK" },
    batman: { id: "batman", label: "BATMAN" },
    peter_griffin: { id: "peter_griffin", label: "PETER" },
    sonic: { id: "sonic", label: "SONIC" },
    deadpool: { id: "deadpool", label: "POOL" },
    cole_hocker: { id: "cole_hocker", label: "HOCKER" },
    steve_prefontaine: { id: "steve_prefontaine", label: "PRE" },
    lex_young: { id: "lex_young", label: "LEX" },
  };
  const LAUNCH_SKIN_IDS = ["classic", "jakob", "fisherman_joe", "beta_alien"];
  const QUEST_SKIN_IDS = [
    "usain_bolt",
    "among_us_red",
    "homer",
    "indiana_jones",
    "flash",
    "lex_young",
  ];
  /** Isle Pass / free-track skins (not quest unlocks). */
  const PASS_SKIN_IDS = [
    "shrek",
    "batman",
    "sonic",
    "peter_griffin",
    "deadpool",
    "cole_hocker",
    "steve_prefontaine",
    "eric_cartman",
  ];
  const ALL_SKIN_IDS = LAUNCH_SKIN_IDS.concat(QUEST_SKIN_IDS).concat(PASS_SKIN_IDS);
  /** Back cosmetics forced by skin — not locker-equippable / not unequippable. */
  const SKIN_LOCKED_BACK = {
    jakob: "norway_flag",
    usain_bolt: "jamaica_flag",
    cole_hocker: "us_flag",
  };
  /** Nov monthly quest progress (persisted in locker profile). */
  let questMaskRuns = 0;
  let questDone = {};
  let questClaimed = {};
  let questTip = "";
  let questTipT = 0;
  let questCursor = 0;
  /** Rewards hub tab: "quests" | "weekly" | "levels". */
  let questTab = "quests";
  /** Levels sub-page: "overview" | "tiers" | "pass". */
  let levelsPage = "overview";
  let passScroll = 0;
  const CAREER_BACKFILL_VER = 2;
  let careerBackfillVer = 0;
  /**
   * FREE battle pass track — design only (not granted yet).
   * Cosmetics / particles / capes / skins ONLY — no in-game loot.
   * Swap `label`, `blurb`, `kind`, and `rewardId` per node.
   * kind: "skin" | "cape" | "face" | "particle"
   * rewardId: real skin/cosmetic id when you wire grants later (null = TBD).
   */
  const FREE_PASS = {
    id: "season_design_1",
    label: "ISLE PASS",
    season: "S1",
    track: "free",
    /** Cumulative pass XP to unlock. Tuned for ~1–3h of active play. */
    nodes: [
      { n: 1, xp: 40, kind: "skin", rewardId: "shrek", label: "SHREK", blurb: "ISLE PASS SKIN" },
      { n: 2, xp: 95, kind: "skin", rewardId: "batman", label: "BATMAN", blurb: "ISLE PASS SKIN" },
      { n: 3, xp: 165, kind: "skin", rewardId: "sonic", label: "SONIC", blurb: "ISLE PASS SKIN" },
      { n: 4, xp: 255, kind: "skin", rewardId: "peter_griffin", label: "PETER", blurb: "ISLE PASS SKIN" },
      { n: 5, xp: 365, kind: "skin", rewardId: "deadpool", label: "POOL", blurb: "ISLE PASS SKIN" },
      { n: 6, xp: 500, kind: "skin", rewardId: "cole_hocker", label: "HOCKER", blurb: "COLE HOCKER + US FLAG" },
      { n: 7, xp: 660, kind: "skin", rewardId: "steve_prefontaine", label: "PRE", blurb: "STEVE PREFONTAINE" },
      { n: 8, xp: 840, kind: "cape", rewardId: "stop_pre_flag", label: "STOP PRE", blurb: "ICONIC STOP PRE TEE FLAG" },
      { n: 9, xp: 1050, kind: "skin", rewardId: "eric_cartman", label: "CARTMAN", blurb: "ISLE PASS FINALE SKIN" },
      { n: 10, xp: 0, kind: "skin", rewardId: null, label: "DIDNT ADD", blurb: "TBD — NOT SET" },
      { n: 11, xp: 0, kind: "skin", rewardId: null, label: "DIDNT ADD", blurb: "TBD — NOT SET" },
      { n: 12, xp: 0, kind: "skin", rewardId: null, label: "DIDNT ADD", blurb: "TBD — NOT SET" },
      { n: 13, xp: 0, kind: "cape", rewardId: null, label: "DIDNT ADD", blurb: "TBD — NOT SET" },
      { n: 14, xp: 0, kind: "face", rewardId: null, label: "DIDNT ADD", blurb: "TBD — NOT SET" },
    ],
  };
  /**
   * Career rank XP (speedrun-driven). Survival loot XP is retired.
   * Tiers: 1-20 bronze, 21-35 silver, 36-55 gold, 56-75 diamond, 76+ champion.
   * Curve is intentionally brutal — current players should stay bronze / low silver.
   */
  const CAREER_KEY = "islebound-career";
  const CAT_WEIGHT = {
    death: 1.0,
    boat: 1.1,
    shark: 1.2,
    jelly_white: 1.25,
    chest: 1.35,
    coins_10: 1.2,
    full_inv: 1.7,
    shark_cloak: 1.9,
    coins_25: 1.55,
    blowfish: 2.1,
    serpent: 2.7,
    mask: 2.9,
    megalodon: 3.1,
    coins_100: 2.5,
    waterfall_eel: 3.6,
    portal_leech: 4.0,
  };
  /** Soft target times (ms) used when no board WR is cached. */
  const CAT_SOFT_WR = {
    death: 12000,
    boat: 15000,
    shark: 48000,
    jelly_white: 52000,
    chest: 65000,
    coins_10: 42000,
    full_inv: 95000,
    shark_cloak: 75000,
    coins_25: 85000,
    blowfish: 72000,
    serpent: 130000,
    mask: 160000,
    megalodon: 160000,
    coins_100: 190000,
    waterfall_eel: 210000,
    portal_leech: 230000,
  };
  let careerXp = 0;
  let careerLevel = 1;
  let careerBackfilled = false;
  let careerLastGain = 0;
  let careerLastGainT = 0;
  /** Isle Pass XP (gains with career XP + light playtime). */
  let passXp = 0;
  let passClaimed = {};
  let passPlayAcc = 0;
  /** name → estimated career level cache for boards / lobby. */
  let careerLevelCache = {};
  const NOV_QUESTS = [
    {
      id: "bolt",
      title: "SUB 9.58 DEATH",
      desc: "FINISH DEATH% UNDER 9.58S",
      rewardKind: "skin",
      rewardId: "usain_bolt",
      rewardLabel: "BOLT SKIN",
    },
    {
      id: "crew",
      title: "SUB 45S BLOWFISH",
      desc: "FINISH BLOWFISH% UNDER 45S",
      rewardKind: "skin",
      rewardId: "among_us_red",
      rewardLabel: "CREW SKIN",
    },
    {
      id: "homer",
      title: "SUB 1:30 MEGA",
      desc: "FINISH MEGALODON% UNDER 1:30",
      rewardKind: "skin",
      rewardId: "homer",
      rewardLabel: "HOMER SKIN",
    },
    {
      id: "indy",
      title: "5 MASK RUNS",
      desc: "COMPLETE 5 MASK% RUNS",
      rewardKind: "skin",
      rewardId: "indiana_jones",
      rewardLabel: "INDY SKIN",
      progress: () => Math.min(5, questMaskRuns | 0) + "/5",
    },
    {
      id: "flash",
      title: "SUB 8 BOAT",
      desc: "FINISH BOAT% UNDER 8S",
      rewardKind: "skin",
      rewardId: "flash",
      rewardLabel: "FLASH SKIN",
    },
    {
      id: "jobapp",
      title: "INVIS SHARK",
      desc: "COMPLETE AN INVIS SHARK% RUN",
      rewardKind: "cosmetic",
      rewardId: "job_app_cloak",
      rewardLabel: "JOBAPP CAPE",
    },
    {
      id: "usa",
      title: "MAKE ACCOUNT",
      desc: "SIGN IN OR CREATE AN ACCOUNT",
      rewardKind: "cosmetic",
      rewardId: "american_cloak",
      rewardLabel: "USA CAPE",
    },
    {
      id: "jelly",
      title: "SUB 35S JELLY",
      desc: "FINISH WHITE JELLY% UNDER 35S",
      rewardKind: "cosmetic",
      rewardId: "jelly_cape",
      rewardLabel: "JELLY CAPE",
    },
  ];

  function skinLockedBack(skin) {
    return SKIN_LOCKED_BACK[skin] || null;
  }

  function effectiveBack(skin, backId) {
    return skinLockedBack(skin) || backId || null;
  }

  function backSlotLocked(skin) {
    return !!skinLockedBack(skin || playerSkin);
  }
  /** Locker UI drag: { id, type: "cosmetic"|"skin", kind, startX, startY }. */
  let lockerDrag = null;
  let lockerHits = [];
  /** Hovered locker grid item for live mannequin preview. */
  let lockerHover = null;
  /** Locker browse tab: "skins" | "cosmetics". */
  let lockerTab = "skins";
  /** Pixel scroll offsets for locker browse grids. */
  let lockerScrollSkins = 0;
  let lockerScrollCosmetics = 0;
  /** Last locker grid clip rect + max scroll (for wheel). */
  let lockerGridBounds = null;
  /**
   * Mode-select "What's New" rail (Disney+-style featured cards).
   * Local curated list for now — skins, quests, and speedrun categories.
   */
  const WHATS_NEW = [
    {
      kind: "skin",
      id: "usain_bolt",
      title: "BOLT SKIN",
      blurb: "QUEST REWARD",
      detail: "SUB 9.58 DEATH%",
    },
    {
      kind: "skin",
      id: "flash",
      title: "FLASH SKIN",
      blurb: "QUEST REWARD",
      detail: "SUB 8S BOAT%",
    },
    {
      kind: "skin",
      id: "homer",
      title: "HOMER SKIN",
      blurb: "QUEST REWARD",
      detail: "SUB 1:30 MEGA%",
    },
    {
      kind: "skin",
      id: "indiana_jones",
      title: "INDY SKIN",
      blurb: "QUEST REWARD",
      detail: "5 MASK% RUNS",
    },
    {
      kind: "skin",
      id: "cole_hocker",
      title: "HOCKER",
      blurb: "ISLE PASS",
      detail: "FREE PASS + US FLAG",
    },
    {
      kind: "skin",
      id: "steve_prefontaine",
      title: "PRE",
      blurb: "ISLE PASS",
      detail: "STEVE PREFONTAINE",
    },
    {
      kind: "skin",
      id: "eric_cartman",
      title: "CARTMAN",
      blurb: "ISLE PASS",
      detail: "FREE PASS NODE 15",
    },
    {
      kind: "quest",
      id: "jelly",
      title: "SUB 35S JELLY",
      blurb: "NOV QUEST",
      detail: "UNLOCK JELLY CAPE",
    },
    {
      kind: "quest",
      id: "jobapp",
      title: "INVIS SHARK",
      blurb: "NOV QUEST",
      detail: "UNLOCK JOBAPP CAPE",
    },
    {
      kind: "speed",
      id: "serpent",
      title: "SERPENT%",
      blurb: "SPEED CATEGORY",
      detail: "HUNT THE SERPENT",
    },
    {
      kind: "speed",
      id: "megalodon",
      title: "MEGALODON%",
      blurb: "SPEED CATEGORY",
      detail: "LAND THE MEGA",
    },
    {
      kind: "speed",
      id: "waterfall_eel",
      title: "EEL%",
      blurb: "SPEED CATEGORY",
      detail: "WATERFALL CATCH",
    },
    {
      kind: "speed",
      id: "portal_leech",
      title: "LEECH%",
      blurb: "SPEED CATEGORY",
      detail: "PORTAL CATCH",
    },
  ];
  const WHATS_NEW_ROT_MS = 4200;
  let whatsNewIndex = 0;
  let whatsNewRotAt = 0;
  let whatsNewFade = 1;
  let whatsNewHover = false;
  let whatsNewPauseElapsed = -1;
  /**
   * Mode-select lobby line — other online players behind the local mannequin
   * (Fortnite-style). Refreshed every LOBBY_PRESENCE_MS from players_online.
   */
  const LOBBY_PRESENCE_MS = 1000;
  let lobbyPresenceAt = 0;
  let lobbyPeers = [];
  let lobbyPeerTotal = 0;
  /** STATS board mode: "survival" | "speedrun". */
  let statsMode = "survival";
  /** Profiles browser state. */
  let profileSearch = "";
  let profileResults = [];
  let profileFocus = null;
  let profileField = 0;
  /** null = bag slot heldSlot; face/back select disabled in-game (locker only). */
  let cosSelect = null;
  let cosTip = "";
  let cosTipT = 0;
  let pondTip = "";
  let pondTipT = 0;
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
    return (
      scene === "shop" ||
      scene === "fish" ||
      scene === "cabin" ||
      scene === "temple" ||
      scene === "hub" ||
      scene === "sub" ||
      scene === "floor" ||
      scene === "wreck" ||
      scene === "vein" ||
      (rome && rome.isScene())
    );
  }

  function indoorW() {
    if (scene === "fish") return FISH_W;
    if (scene === "cabin") return CABIN_W;
    if (scene === "temple") return TEMPLE_W;
    if (scene === "hub") return HUB_W;
    if (scene === "sub") return SUB_W;
    if (scene === "floor") return FLOOR_W;
    if (scene === "wreck") return WRECK_W;
    if (scene === "vein" && vein) return vein.VEIN_W;
    if (rome && rome.isScene()) return rome.worldW();
    return SHOP_W;
  }

  function indoorH() {
    if (scene === "fish") return FISH_H;
    if (scene === "cabin") return CABIN_H;
    if (scene === "temple") return TEMPLE_H;
    if (scene === "hub") return HUB_H;
    if (scene === "sub") return SUB_H;
    if (scene === "floor") return FLOOR_H;
    if (scene === "wreck") return WRECK_H;
    if (scene === "vein" && vein) return vein.VEIN_H;
    if (rome && rome.isScene()) return rome.worldH();
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
    if (rome && rome.isScene()) return rome.solid(px, py);
    if (scene === "shop") return !!hitPad(px, py, shopSolids);
    if (scene === "fish") return !!hitPad(px, py, fishSolids);
    if (scene === "cabin") return !!hitPad(px, py, cabinSolids);
    if (scene === "temple") return !!hitPad(px, py, templeSolids);
    if (scene === "vein" && vein) return vein.solidsHit(px, py);
    if (scene === "hub") return !!hitPad(px, py, hubSolids);
    if (scene === "sub") return !!hitPad(px, py, subSolids);
    if (scene === "floor") return !!hitPad(px, py, floorSolids);
    if (scene === "wreck") return !!hitPad(px, py, wreckSolids);
    if (hitPad(px, py, islandSolids)) return true;
    for (const rock of rocks) {
      if (px > rock.x && px < rock.x + rock.w && py > rock.y && py < rock.y + rock.h) {
        return true;
      }
    }
    return false;
  }

  function canStand(px, py) {
    if (rome && rome.isScene()) return !rome.solid(px, py);
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
    if (scene === "temple") {
      return px >= 8 && py >= 10 && px < TEMPLE_W - 8 && py < TEMPLE_H - 6;
    }
    if (scene === "vein" && vein) return vein.canStand(px, py);
    if (scene === "hub") {
      return px >= 10 && py >= 12 && px < HUB_W - 10 && py < HUB_H - 6;
    }
    if (scene === "sub") {
      return px >= 8 && py >= 52 && px < SUB_W - 8 && py < SUB_H - 6;
    }
    if (scene === "floor") {
      return px >= 6 && py >= 48 && px < FLOOR_W - 6 && py < FLOOR_H - 6;
    }
    if (scene === "wreck") {
      return px >= 8 && py >= 10 && px < WRECK_W - 8 && py < WRECK_H - 6;
    }
    if (hitPad(px, py, walkPads)) return true;
    if (landPresent(px) && py < northCliffY(px)) return false;
    return px >= 0 && py >= 0 && px < WORLD_W && py < WORLD_H;
  }

  function inPondWater(px, py) {
    if (!pondWater) return false;
    if (pondPad && hitPad(px, py, [pondPad])) return false;
    const dx = px - pondWater.cx;
    const dy = py - pondWater.cy;
    const rx = pondWater.rx || 1;
    const ry = pondWater.ry || 1;
    return (dx * dx) / (rx * rx) + (dy * dy) / (ry * ry) < 1;
  }

  /** Feet in the river pool — wadable, no drown damage. */
  function playerWadingPond() {
    if (!pondWater || scene !== "island" || player.aboard) return false;
    const fy = player.y + player.h - 2;
    return (
      inPondWater(player.x + 2, fy) ||
      inPondWater(player.x + player.w * 0.5, fy) ||
      inPondWater(player.x + player.w - 2, fy)
    );
  }

  function isWaterAt(px, py) {
    if (hitPad(px, py, walkPads)) return false;
    if (inPondWater(px, py)) return true;
    if (inRiverWater(px, py)) return true;
    return !onIslandLand(px, py);
  }

  function subHullPad() {
    if (!subHull) return null;
    return { x: subHull.x - 2, y: subHull.y - 4, w: subHull.w + 4, h: subHull.h + 8 };
  }

  /** Feet on a dock/boat walk pad or on dry island. The offshore hull pad does not count. */
  function dryFooting(x, y) {
    const fx = x + 4;
    const fy = y + player.h - 2;
    const hull = subHullPad();
    if (hitPad(fx, fy, walkPads)) {
      if (hull && hitPad(fx, fy, [hull])) return false;
      return true;
    }
    if (inPondWater(fx, fy)) return false;
    if (inRiverWater(fx, fy)) return false;
    if (fy > restShoreY(x + 3) || fy > restShoreY(x + player.w - 3)) return false;
    return onIslandLand(fx, fy);
  }

  function placeAtDock() {
    scene = "island";
    player.aboard = false;
    player.inWater = false;
    player.submerged = 0;
    player.x = spawnX;
    player.y = spawnY;
    divePhase = "docked";
  }

  function rescueOffshoreSpawn() {
    if (scene === "sub" || scene === "floor" || scene === "wreck") {
      placeAtDock();
      return;
    }
    if (scene !== "island") return;
    // Mid-ocean skiff is fine; dinghy / missing hull / open water feet → dock.
    if (player.aboard && ownedBoat && ownedBoat.kind !== "dinghy") return;
    if (dryFooting(player.x, player.y)) return;
    placeAtDock();
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

    // Dense plains / jungle canopy west→mid island (was sparse open grass)
    for (let g = 0; g < 72; g++) {
      const c0 = ISLAND_C - ISLAND_HALF + 36 + (g / 72) * ISLAND_HALF * 1.55 + irand(-4, 4);
      const e = eastness(c0);
      if (e > 0.72) continue;
      const cliff = northCliffRow(c0);
      const shore = baseShoreRow(c0);
      const span = Math.max(8, shore - cliff - 14);
      const r0 = Math.floor(cliff + 5 + hash(g, 4) * span);
      // More trunks on open plains (low eastness), still some on mid scrub
      const n = e > 0.42 ? irand(3, 6) : irand(5, 10);
      const kind = e > 0.34 ? "pine" : "leaf";
      for (let i = 0; i < n; i++) {
        const ang = (i / n) * Math.PI * 2 + hash(g, i) * 0.7;
        const rad = 5 + hash(i * 3, g) * 22;
        const c = Math.floor(c0 + Math.cos(ang) * (rad / TILE));
        const r = Math.floor(r0 + Math.sin(ang) * (rad / TILE) * 0.55);
        if (!inBounds(c, r) || r < northCliffRow(c) + 2) continue;
        if (r > baseShoreRow(c) - sandWidth(c) - 2) continue;
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
    // Extra scattered fillers so plains don't read as empty lawn
    for (let i = 0; i < 90; i++) {
      const c = (ISLAND_C - ISLAND_HALF + 48 + hash(i, 8) * (ISLAND_HALF * 1.2)) | 0;
      if (eastness(c) > 0.55) continue;
      const cliff = northCliffRow(c);
      const shore = baseShoreRow(c);
      const r = (cliff + 8 + hash(i, 13) * Math.max(6, shore - cliff - sandWidth(c) - 14)) | 0;
      if (!inBounds(c, r)) continue;
      const t = world[r][c];
      if (t !== TILES.DIRT && t !== TILES.GRASS) continue;
      if (inRiverWater(c * TILE + 4, r * TILE + 8)) continue;
      trees.push({
        x: Math.floor(c * TILE + 2 + hash(c, r) * 8),
        y: Math.floor(r * TILE + 6 + hash(r, c) * 8),
        s: 0.7 + hash(i, 21) * 0.45,
        kind: hash(i, 27) > 0.55 ? "pine" : "leaf",
      });
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

  function crabIsCatchable(c) {
    if (!c) return false;
    if (c.state === "hidden") return false;
    // Fully buried / mid-sink — not grab-able
    if ((c.bury || 0) >= 0.85 && (c.hop || 0) < 1) return false;
    return true;
  }

  /** Index of a beach crab the player is standing over, or -1. */
  function nearestCatchableCrab() {
    if (scene !== "island" || player.aboard || player.dead > 0) return -1;
    const mid = playerCenter();
    const footY = player.y + player.h - 1;
    let best = -1;
    let bestD = 18;
    for (let i = 0; i < crabs.length; i++) {
      const c = crabs[i];
      if (!crabIsCatchable(c)) continue;
      const dx = Math.abs(mid.x - c.x);
      const dy = Math.abs(footY - c.y);
      if (dx > 12 || dy > 14) continue;
      const d = dx + dy * 0.6;
      if (d < bestD) {
        bestD = d;
        best = i;
      }
    }
    return best;
  }

  /** Space on land: scoop a crab underfoot into the bag. */
  function tryCatchLandCrab() {
    const idx = nearestCatchableCrab();
    if (idx < 0) return false;
    const toBag = canTake("catch_crab");
    const toSatchel = !toBag && canTakeSatchel("catch_crab");
    if (!toBag && !toSatchel) {
      cosTip = "CAN'T HOLD MORE CRAB";
      cosTipT = 1.4;
      return true;
    }
    const c = crabs[idx];
    const from = worldToUi(c.x, c.y - 2);
    crabs.splice(idx, 1);
    pickupAnims.push({
      id: "catch_crab",
      t: 0,
      fromX: from.x,
      fromY: from.y,
      slot: toSatchel ? satchelSlotFor("catch_crab") : slotIndexFor("catch_crab"),
      dest: toSatchel ? "satchel" : "slot",
      value: 0,
    });
    cosTip = "CAUGHT CRAB";
    cosTipT = 1.15;
    if (typeof checkCatchSpeedEnd === "function") checkCatchSpeedEnd("catch_crab");
    return true;
  }

  function emitSplash(wx, wy, n, fromFish) {
    if (fishOverDock(wx, wy)) return;
    // Allow splashes on river / pond pool; block dry island land only.
    if (onIslandLand(wx, wy) && !inRiverWater(wx, wy) && !inPondWater(wx, wy)) return;
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
    if (fishOverDock(wx, wy)) return false;
    if (hitPad(wx, wy, islandSolids)) return false;
    // Inland river / carved pond pool
    if (inPondWater(wx, wy) || inRiverWater(wx, wy)) return true;
    if (wy < restShoreY(wx) - 0.5) return false;
    if (onIslandLand(wx, wy)) return false;
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
        // Extra jumps in the river pool when it's on screen
        if (pondWater && Math.random() < 0.72) spawnPondFishJump();
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
    const wadingPond = playerWadingPond();
    if (player.aboard) {
      player.inWater = false;
    } else {
      // Pond is wadable — counts as slow water move, but not drowning ocean/river.
      player.inWater =
        scene === "island" &&
        !onDock &&
        !wadingPond &&
        (inRiverWater(player.x + 4, feetY) ||
          feetY > restShoreY(player.x + 3) ||
          feetY > restShoreY(player.x + player.w - 3));
    }

    if (guideOpen || cabinCut.kind || uiBlocksPlay() || chatCapturesInput() || diveTransit() || (rome && rome.blocksMove())) {
      dx = 0;
      dy = 0;
      player.moving = false;
    }

    if (
      player.dead <= 0 &&
      !fadeMode &&
      !guideOpen &&
      !cabinCut.kind &&
      !uiBlocksPlay() &&
      !chatCapturesInput() &&
      !(rome && rome.blocksMove())
    ) {
      if (player.aboard && aboardKind === "dinghy" && pondBoat && scene === "island") {
        steerDinghy(dt, dx, dy);
      } else if (player.aboard && ownedBoat && scene === "island" && aboardKind !== "dinghy") {
        steerOwnedBoat(dt, dx, dy);
      } else {
        const moveMul = rome && rome.isScene() ? rome.moveMul() : 1;
        const speed = (player.inWater || wadingPond ? 70 : 165) * moveMul * dt;
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
      if (scene === "vein" && vein) {
        // Vein clamps per-room inside vein.update (sealed gates / room sync).
        player.x = Math.max(8, Math.min(vein.VEIN_W - player.w - 8, player.x));
        player.y = Math.max(10, Math.min(vein.VEIN_H - player.h - 4, player.y));
      } else {
        player.x = Math.max(8, Math.min(indoorW() - player.w - 8, player.x));
        player.y = Math.max(10, Math.min(indoorH() - player.h - 4, player.y));
      }
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

    if (boatBoardCool > 0) boatBoardCool = Math.max(0, boatBoardCool - dt);

    if (
      !guideOpen &&
      !uiBlocksPlay() &&
      !chatCapturesInput() &&
      !player.aboard &&
      ownedBoat &&
      ownedBoat.landed &&
      !boatThrow &&
      scene === "island" &&
      player.dead <= 0 &&
      boatBoardCool <= 0
    ) {
      // Docked slip: no proximity auto-board (Enter boards). Walk-on only for free boats.
      if (ownedBoat.docked) {
        /* skip — Enter / tryBoatToggle handles berth boarding */
      } else {
        const bx = ownedBoat.x + ownedBoat.w / 2;
        const by = ownedBoat.y + ownedBoat.h / 2;
        const now = playerCenter();
        if (Math.hypot(now.x - bx, now.y - by) < 14) {
          player.aboard = true;
          aboardKind = "skiff";
          seatPlayerOnBoat();
          player.inWater = false;
          player.submerged = 0;
          checkBoatSpeedEnd();
        }
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
      aboardKind = null;
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
        if (scene === "vein" && vein) {
          const cp = vein.getCheckpoint();
          player.x = cp.x;
          player.y = cp.y;
          if (vein.lockCam) vein.lockCam();
        } else {
          player.x = spawnX;
          player.y = spawnY;
        }
        player.hp = MAX_HP;
        player.submerged = 0;
        player.drownTick = 0;
        player.hurt = 0;
        player.aboard = false;
        aboardKind = null;
        if (scene === "vein") cloakOn = false;
        if (playMode === "speedrun" && srCat === "death" && srTiming && srWasDead && uiScreen !== "finish") {
          srWasDead = false;
          finishSpeedrun();
        }
        srWasDead = false;
      }
      return;
    }
    if (player.aboard || playerWadingPond()) {
      // Wadable pond: wet feet, no drown damage.
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

  function isCosmeticId(id) {
    const def = ITEM_DEFS[id];
    return !!(def && def.cosmetic);
  }

  function cosmeticKindOf(id) {
    const def = ITEM_DEFS[id];
    return def && def.cosmetic ? def.cosmetic : null;
  }

  function bagFilledForFullInv() {
    for (let i = 0; i < inventory.length; i++) {
      const s = inventory[i];
      if (!s || isCosmeticId(s.id)) return false;
    }
    return true;
  }

  function ownsCosmetic(id) {
    return !!(id && ownedCosmetics.indexOf(id) >= 0);
  }

  function ownsSkin(id) {
    return !!(id && ownedSkins.indexOf(id) >= 0);
  }

  function ownsCloak() {
    return cosmetics.back === "cloak" || ownsCosmetic("cloak");
  }

  function saveLockerProfile() {
    const snap = {
      face: cosmetics.face,
      back: cosmetics.back,
      skin: playerSkin,
      ownedCosmetics: ownedCosmetics.slice(),
      ownedSkins: ownedSkins.slice(),
      skinsGrantedLegacy: !!skinsGrantedLegacy,
      questMaskRuns: questMaskRuns | 0,
      questDone: questDone || {},
      questClaimed: questClaimed || {},
    };
    try {
      localStorage.setItem(LOCKER_PROFILE_KEY, JSON.stringify(snap));
    } catch (e) {}
    // Account sync so cosmetics survive browser clears / other devices.
    const api = lbApi();
    if (api && api.isSignedIn && api.isSignedIn() && api.syncLockerSoon) {
      api.syncLockerSoon(snap);
    }
  }

  /** Merge a cloud locker blob into local ownership (union; keep better progress). */
  function mergeCloudLocker(locker) {
    if (!locker || typeof locker !== "object") return false;
    applyLockerSnapshot(locker);
    saveLockerProfile();
    return true;
  }

  function pullCloudLocker() {
    const api = lbApi();
    if (!api || !api.isSignedIn || !api.isSignedIn()) return;
    const cached = api.getCachedCloudLocker && api.getCachedCloudLocker();
    if (cached) mergeCloudLocker(cached);
    if (!api.fetchLocker) return;
    api.fetchLocker().then((res) => {
      if (res && res.locker) mergeCloudLocker(res.locker);
      // Push local (now merged) up so cloud catches any local-only unlocks.
      saveLockerProfile();
    });
  }

  function grantCosmetic(id) {
    if (!isCosmeticId(id)) return false;
    if (ownedCosmetics.indexOf(id) >= 0) return false;
    ownedCosmetics.push(id);
    saveLockerProfile();
    return true;
  }

  function equipCosmetic(id) {
    const kind = cosmeticKindOf(id);
    if (!kind || !ownsCosmetic(id)) return false;
    // Jakob's Norway flag cape owns the back slot — other backs can't override it.
    if (kind === "back" && backSlotLocked()) return false;
    cosmetics[kind] = id;
    if (id === "jade_mask") startJadeMaskFx();
    if (id !== "cloak" && cosmetics.back !== "cloak") cloakOn = false;
    saveLockerProfile();
    return true;
  }

  function unequipCosmetic(kind) {
    if (kind !== "face" && kind !== "back") return false;
    if (kind === "back" && backSlotLocked()) return false;
    const id = cosmetics[kind];
    cosmetics[kind] = null;
    if (id === "cloak") cloakOn = false;
    saveLockerProfile();
    return true;
  }

  function equipSkin(id) {
    if (!SKIN_DEFS[id] || !ownsSkin(id)) return false;
    playerSkin = id;
    saveLockerProfile();
    return true;
  }

  function grantSkin(id) {
    if (!SKIN_DEFS[id]) return false;
    if (ownedSkins.indexOf(id) >= 0) return false;
    ownedSkins.push(id);
    saveLockerProfile();
    return true;
  }

  function grantAllSkinsLegacy() {
    skinsGrantedLegacy = true;
    for (let i = 0; i < LAUNCH_SKIN_IDS.length; i++) {
      if (ownedSkins.indexOf(LAUNCH_SKIN_IDS[i]) < 0) ownedSkins.push(LAUNCH_SKIN_IDS[i]);
    }
    saveLockerProfile();
  }

  /** Ensure free launch skins are owned (quest skins stay locked). */
  function ensureLaunchSkins() {
    let changed = false;
    for (let i = 0; i < LAUNCH_SKIN_IDS.length; i++) {
      if (ownedSkins.indexOf(LAUNCH_SKIN_IDS[i]) < 0) {
        ownedSkins.push(LAUNCH_SKIN_IDS[i]);
        changed = true;
      }
    }
    if (!skinsGrantedLegacy) {
      skinsGrantedLegacy = true;
      changed = true;
    }
    if (changed) saveLockerProfile();
  }

  function skinLabel(id) {
    return (SKIN_DEFS[id] && SKIN_DEFS[id].label) || String(id || "").toUpperCase();
  }

  function cosmeticLabel(id) {
    const def = ITEM_DEFS[id];
    if (def && def.label) return def.label;
    if (def && def.name) return String(def.name).toUpperCase().replace(/[^A-Z0-9 ]/g, "").slice(0, 7);
    return String(id || "").toUpperCase().slice(0, 7);
  }

  function flashQuestUnlock(msg) {
    questTip = String(msg || "QUEST READY").toUpperCase().slice(0, 28);
    questTipT = 2.6;
    cosTip = questTip;
    cosTipT = 2.6;
  }

  function questById(id) {
    for (let i = 0; i < NOV_QUESTS.length; i++) {
      if (NOV_QUESTS[i].id === id) return NOV_QUESTS[i];
    }
    return null;
  }

  function questOwnsReward(q) {
    if (!q) return false;
    if (q.rewardKind === "skin") return ownsSkin(q.rewardId);
    return ownsCosmetic(q.rewardId);
  }

  function questStatus(q) {
    if (!q) return "locked";
    if (questClaimed[q.id] || questOwnsReward(q)) return "claimed";
    if (questDone[q.id]) return "claimable";
    return "locked";
  }

  function markQuestDone(id) {
    if (!id || questDone[id] || questClaimed[id]) return false;
    const q = questById(id);
    if (!q) return false;
    if (questOwnsReward(q)) {
      questDone[id] = true;
      questClaimed[id] = true;
      saveLockerProfile();
      return false;
    }
    questDone[id] = true;
    saveLockerProfile();
    flashQuestUnlock("QUEST READY CLAIM IT");
    return true;
  }

  function claimQuest(id) {
    const q = questById(id);
    if (!q) return false;
    if (questClaimed[q.id]) return false;
    if (!questDone[q.id] && !questOwnsReward(q)) return false;
    let ok = false;
    if (q.rewardKind === "skin") ok = grantSkin(q.rewardId) || ownsSkin(q.rewardId);
    else ok = grantCosmetic(q.rewardId) || ownsCosmetic(q.rewardId);
    if (!ok) return false;
    questDone[q.id] = true;
    questClaimed[q.id] = true;
    saveLockerProfile();
    flashQuestUnlock("CLAIMED " + (q.rewardLabel || q.id).toUpperCase());
    return true;
  }

  function syncQuestOwnershipFlags() {
    for (let i = 0; i < NOV_QUESTS.length; i++) {
      const q = NOV_QUESTS[i];
      if (questOwnsReward(q)) {
        questDone[q.id] = true;
        questClaimed[q.id] = true;
      }
    }
  }

  /** November monthly quests — mark complete; claim rewards in QUESTS menu. */
  function checkNovQuestRewards(cat, ms) {
    const t = ms | 0;
    if (cat === "death" && t > 0 && t < 9580) markQuestDone("bolt");
    if (cat === "blowfish" && t > 0 && t < 45000) markQuestDone("crew");
    if (cat === "megalodon" && t > 0 && t < 90000) markQuestDone("homer");
    if (cat === "boat" && t > 0 && t < 8000) markQuestDone("flash");
    if (cat === "mask") {
      questMaskRuns = (questMaskRuns | 0) + 1;
      saveLockerProfile();
      if ((questMaskRuns | 0) >= 5) markQuestDone("indy");
    }
    if (cat === "shark_cloak") markQuestDone("jobapp");
    if (cat === "jelly_white" && t > 0 && t < 35000) markQuestDone("jelly");
  }

  function tryGrantAmericanCloak() {
    const api = lbApi();
    if (!api || !api.isSignedIn || !api.isSignedIn()) return;
    markQuestDone("usa");
  }

  function prepareWeeklySpinState() {
    const period = weeklySpinPeriod();
    spinCursor = 0;
    spinNote = "";
    spinReel = null;
    spinPeriodKey = period.key;
    spinUsed = 0;
    spinNextWeekTold = false;
    const api = lbApi();
    if (!api || !api.isSignedIn || !api.isSignedIn()) {
      spinNote = "SIGN IN";
      return;
    }
    if (api.getWeeklySpinsLocal) spinUsed = api.getWeeklySpinsLocal(period.key) | 0;
    if (spinUsed >= WEEKLY_SPIN.spins) spinNextWeekTold = false;
    if (!api.getWeeklySpins) return;
    api.getWeeklySpins(period.key).then((res) => {
      if (uiScreen !== "quests" || questTab !== "weekly" || spinPeriodKey !== period.key) return;
      spinUsed = res && typeof res.used === "number" ? Math.max(0, Math.min(WEEKLY_SPIN.spins, res.used | 0)) : 0;
    });
  }

  /** Unified Rewards hub: quests + weekly + islepass. */
  function openRewardsMenu(tab) {
    uiScreen = "quests";
    const t =
      tab === "weekly" || tab === "levels" || tab === "islepass" || tab === "pass" || tab === "quests"
        ? tab
        : "quests";
    questTab = t === "islepass" || t === "pass" ? "levels" : t;
    levelsPage = t === "islepass" || t === "pass" || t === "levels" ? "pass" : "overview";
    if (t === "levels" && tab === "levels") levelsPage = "overview";
    questCursor = 0;
    syncQuestOwnershipFlags();
    syncCareerFromAccountHistory();
    refreshCareerLevelCache();
    syncIslePassUnlocks();
    if (questTab === "weekly") prepareWeeklySpinState();
    if (questTab === "quests") {
      for (let i = 0; i < NOV_QUESTS.length; i++) {
        if (questStatus(NOV_QUESTS[i]) === "claimable") {
          questCursor = i;
          break;
        }
      }
    }
  }

  function openQuestMenu() {
    openRewardsMenu("quests");
  }

  function openIslePassMenu() {
    openRewardsMenu("islepass");
  }

  function drawQuestTabSwitchers(x, y, w) {
    const tabs = [
      { id: "quests", label: "QUESTS" },
      { id: "weekly", label: "WEEKLY" },
      { id: "levels", label: "ISLEPASS" },
    ];
    const gap = 3;
    const tw = ((w - 12 - gap * 2) / 3) | 0;
    for (let i = 0; i < tabs.length; i++) {
      const t = tabs[i];
      const tx = x + 6 + i * (tw + gap);
      const on = questTab === t.id;
      const hot = !on && menuHovering("qtab:" + t.id);
      px(tx, y, tw, 12, on ? "#c9a227" : "#3a2414");
      px(tx + 1, y + 1, tw - 2, 10, on ? "#e8c44a" : hot ? "#5c3a21" : "#8a5a32");
      drawPixTextSm(t.label, tx + ((tw / 2) | 0), y + 3, on ? "#2b1c12" : "#f3e2c4", "center");
      addMenuHit(
        "qtab:" + t.id,
        tx,
        y,
        tw,
        12,
        () => {
          questTab = t.id;
          if (t.id === "weekly") prepareWeeklySpinState();
          if (t.id === "levels") {
            levelsPage = "pass";
            syncCareerFromAccountHistory();
            syncIslePassUnlocks();
          }
        },
        { hover: true }
      );
    }
  }

  function drawLevelsPageSwitchers(x, y, w) {
    const pages = [
      { id: "overview", label: "RANK" },
      { id: "tiers", label: "TIERS" },
      { id: "pass", label: "PASS" },
    ];
    const gap = 3;
    const tw = ((w - 12 - gap * 2) / 3) | 0;
    for (let i = 0; i < pages.length; i++) {
      const p = pages[i];
      const tx = x + 6 + i * (tw + gap);
      const on = levelsPage === p.id;
      const hot = !on && menuHovering("lpage:" + p.id);
      px(tx, y, tw, 11, on ? "#e8c44a" : hot ? "#5c3a21" : "#3a2414");
      drawPixTextSm(p.label, tx + ((tw / 2) | 0), y + 3, on ? "#2b1c12" : "#c4a574", "center");
      addMenuHit(
        "lpage:" + p.id,
        tx,
        y,
        tw,
        11,
        () => {
          levelsPage = p.id;
        },
        { hover: true }
      );
    }
  }

  function drawLevelsOverview(x, y, w, h) {
    const prog = careerXpIntoLevel(careerXp);
    const tier = careerTierOf(careerLevel);
    const top = y + 48;
    drawPixText("YOUR RANK", (x + w / 2) | 0, top, "#5c3a21", "center");
    drawLevelBadge(careerLevel, (x + w / 2 - 10) | 0, top + 12);
    drawPixText(tier.label, (x + w / 2) | 0, top + 24, "#3a2414", "center");
    const barW = w - 24;
    const barX = x + 12;
    const barY = top + 38;
    const fill = Math.floor(barW * Math.min(1, prog.into / Math.max(1, prog.need)));
    px(barX, barY, barW, 6, "#3a2414");
    px(barX + 1, barY + 1, barW - 2, 4, "#5c3a21");
    if (fill > 0) px(barX + 1, barY + 1, Math.max(1, fill - 2), 4, tier.color);
    drawPixTextSm(
      prog.into + " / " + prog.need + " XP",
      (x + w / 2) | 0,
      barY + 10,
      "#5c3a21",
      "center"
    );
    const lines = [
      "XP FROM SPEEDRUNS ONLY",
      "FASTER + HARDER = MORE",
      "SUBMIT + PB + WR BONUS",
      "SILVER+ IS A LONG GRIND",
    ];
    for (let i = 0; i < lines.length; i++) {
      drawPixTextSm(lines[i], (x + w / 2) | 0, barY + 24 + i * 10, "#3a2414", "center");
    }
    if (careerLastGainT > 0 && careerLastGain > 0) {
      drawPixText("+" + careerLastGain + " XP", (x + w / 2) | 0, y + h - 28, "#5c3a21", "center");
    }
  }

  function drawLevelsTiers(x, y, w) {
    const tiers = [
      { lo: 1, hi: 20, id: "bronze" },
      { lo: 21, hi: 35, id: "silver" },
      { lo: 36, hi: 55, id: "gold" },
      { lo: 56, hi: 75, id: "diamond" },
      { lo: 76, hi: 99, id: "champion" },
    ];
    const top = y + 48;
    drawPixText("RANK TIERS", (x + w / 2) | 0, top, "#5c3a21", "center");
    for (let i = 0; i < tiers.length; i++) {
      const t = tiers[i];
      const def = careerTierOf(t.lo);
      const oy = top + 14 + i * 14;
      const on = careerLevel >= t.lo && careerLevel <= (t.hi === 99 ? 999 : t.hi);
      if (on) px(x + 8, oy - 2, w - 16, 12, "#e8c44a");
      px(x + 12, oy, 10, 7, def.edge);
      px(x + 13, oy + 1, 8, 5, def.color);
      const range = t.hi >= 99 ? t.lo + "+" : t.lo + "-" + t.hi;
      drawPixText(def.label + "  " + range, x + 28, oy, on ? "#2b1c12" : "#3a2414");
    }
    drawPixTextSm("ALMOST NO ONE REACHES GOLD", (x + w / 2) | 0, top + 90, "#5c3a21", "center");
  }

  function passNodeKindColor(kind) {
    if (kind === "skin") return "#e8c44a";
    if (kind === "cape") return "#7ec8e8";
    if (kind === "face") return "#c4a574";
    if (kind === "particle") return "#9ad87a";
    return "#8a6a42";
  }

  function passNodeKey(node) {
    return String((node && node.n) || "");
  }

  function passNodeStatus(node) {
    if (!node || !node.rewardId) return "empty";
    const key = passNodeKey(node);
    if (passClaimed[key]) return "claimed";
    if ((passXp | 0) >= (node.xp | 0) && (node.xp | 0) > 0) return "claimable";
    return "locked";
  }

  function grantPassReward(node) {
    if (!node || !node.rewardId) return false;
    if (node.kind === "skin") return grantSkin(node.rewardId) || ownsSkin(node.rewardId);
    if (node.kind === "cape" || node.kind === "face") {
      return grantCosmetic(node.rewardId) || ownsCosmetic(node.rewardId);
    }
    return false;
  }

  function claimPassNode(node) {
    if (passNodeStatus(node) !== "claimable") return false;
    const ok = grantPassReward(node);
    if (!ok) return false;
    passClaimed[passNodeKey(node)] = true;
    saveCareer();
    saveLockerProfile();
    questTip = "PASS: " + String(node.label || "REWARD");
    questTipT = 2.4;
    cosTip = questTip;
    cosTipT = 2.4;
    playXpChime();
    return true;
  }

  /** Auto-claim any unlocked pass nodes. */
  function syncIslePassUnlocks() {
    const nodes = FREE_PASS.nodes || [];
    let any = false;
    for (let i = 0; i < nodes.length; i++) {
      const node = nodes[i];
      if (passNodeStatus(node) !== "claimable") continue;
      if (claimPassNode(node)) any = true;
    }
    return any;
  }

  function passFinaleXp() {
    const nodes = FREE_PASS.nodes || [];
    let best = 1;
    for (let i = 0; i < nodes.length; i++) {
      const n = nodes[i];
      if (n && n.rewardId && (n.xp | 0) > best) best = n.xp | 0;
    }
    return best;
  }

  function drawLevelsPass(x, y, w, h) {
    const nodes = FREE_PASS.nodes || [];
    const top = y + 48;
    const finale = passFinaleXp();
    const prog = Math.min(1, (passXp | 0) / Math.max(1, finale));
    drawPixText(FREE_PASS.label || "ISLE PASS", (x + w / 2) | 0, top, "#5c3a21", "center");
    drawPixTextSm(
      (passXp | 0) + " / " + finale + " PASS XP",
      (x + w / 2) | 0,
      top + 10,
      "#8a5a32",
      "center"
    );
    const barW = w - 24;
    const barX = x + 12;
    const barY = top + 20;
    px(barX, barY, barW, 5, "#3a2414");
    px(barX + 1, barY + 1, barW - 2, 3, "#5c3a21");
    const fill = Math.floor((barW - 2) * prog);
    if (fill > 0) px(barX + 1, barY + 1, fill, 3, "#e8c44a");

    const listTop = top + 30;
    const listBot = y + h - 18;
    const rowH = 14;
    const viewH = Math.max(14, listBot - listTop);
    const maxScroll = Math.max(0, nodes.length * rowH - viewH);
    if (passScroll < 0) passScroll = 0;
    if (passScroll > maxScroll) passScroll = maxScroll;

    ctx.save();
    ctx.beginPath();
    ctx.rect(x + 6, listTop, w - 12, viewH);
    ctx.clip();
    for (let i = 0; i < nodes.length; i++) {
      const node = nodes[i];
      const oy = listTop - passScroll + i * rowH;
      if (oy + rowH < listTop || oy > listBot) continue;
      const st = passNodeStatus(node);
      const col =
        st === "claimed" ? "#5c3a21" : st === "claimable" ? "#e8c44a" : passNodeKindColor(node.kind);
      if (st === "claimable") px(x + 8, oy - 1, w - 16, rowH - 1, "#e8c44a");
      px(x + 8, oy, 14, 11, "#3a2414");
      px(x + 9, oy + 1, 12, 9, col);
      drawPixTextSm(String(node.n | (i + 1)).padStart(2, "0"), x + 15, oy + 2, "#2b1c12", "center");
      const lab = String(node.label || "TBD").slice(0, 12);
      drawPixTextSm(lab, x + 26, oy + 2, st === "claimable" ? "#2b1c12" : "#3a2414");
      const right =
        st === "claimed" ? "OWN" : st === "claimable" ? "CLAIM" : st === "empty" ? "TBD" : String(node.xp | 0);
      drawPixTextSm(right, x + w - 14, oy + 2, st === "claimable" ? "#2b1c12" : "#8a5a32", "right");
      addMenuHit(
        "passnode:" + i,
        x + 8,
        oy,
        w - 16,
        rowH - 2,
        () => {
          if (st === "claimable") claimPassNode(node);
          else {
            questTip = String(node.blurb || node.label || "NODE").toUpperCase().slice(0, 28);
            questTipT = 2.2;
            cosTip = questTip;
            cosTipT = 2.2;
          }
        },
        { hover: true }
      );
    }
    ctx.restore();

    if (maxScroll > 0) {
      drawPixTextSm("^ V SCROLL", (x + w / 2) | 0, y + h - 14, "#8a5a32", "center");
      addMenuHit(
        "pass:up",
        x + 8,
        listTop,
        w - 16,
        10,
        () => {
          passScroll = Math.max(0, passScroll - rowH * 2);
        },
        { hover: true }
      );
      addMenuHit(
        "pass:down",
        x + 8,
        listBot - 10,
        w - 16,
        10,
        () => {
          passScroll = Math.min(maxScroll, passScroll + rowH * 2);
        },
        { hover: true }
      );
    }
  }

  function drawQuestListPanel(x, y, w, h) {
    drawPixText("CLAIM REWARDS HERE", (x + w / 2) | 0, y + 32, "#5c3a21", "center");
    const rowH = 14;
    const listTop = y + 44;
    for (let i = 0; i < NOV_QUESTS.length; i++) {
      const q = NOV_QUESTS[i];
      const st = questStatus(q);
      const key = "quest:" + i;
      const sel = questCursor === i || menuHovering(key);
      const oy = listTop + i * rowH;
      if (oy > y + h - 40) break;
      if (sel) px(x + 6, oy - 2, w - 12, 12, "#e8c44a");
      const stLabel = st === "claimed" ? "DONE" : st === "claimable" ? "CLAIM" : "----";
      const stCol = st === "claimed" ? "#5c3a21" : st === "claimable" ? "#2b1c12" : "#8a5a32";
      drawPixText(String(q.title).slice(0, 16), x + 10, oy, sel ? "#2b1c12" : "#3a2414");
      drawPixText(stLabel, x + w - 42, oy, sel && st === "claimable" ? "#2b1c12" : stCol);
      addMenuHit(
        key,
        x + 6,
        oy - 2,
        w - 12,
        12,
        () => {
          questCursor = i;
          if (st === "claimable") claimQuest(q.id);
        },
        { hover: true }
      );
    }
    const cur = NOV_QUESTS[questCursor] || NOV_QUESTS[0];
    const st = questStatus(cur);
    let detail = cur.desc;
    if (cur.progress) detail = cur.desc + "  " + cur.progress();
    detail = detail + "  > " + cur.rewardLabel;
    drawPixText(detail.slice(0, 36), (x + w / 2) | 0, y + h - 24, "#5c3a21", "center");
    if (st === "claimable") {
      const bx = (x + w / 2 - 36) | 0;
      const by = y + h - 12;
      px(bx, by - 2, 72, 11, menuHovering("quest:claim") ? "#e8c44a" : "#c9a227");
      drawPixText("CLAIM", (x + w / 2) | 0, by, "#2b1c12", "center");
      addMenuHit("quest:claim", bx, by - 2, 72, 11, () => claimQuest(cur.id), { hover: true });
    } else {
      drawPixText(
        st === "claimed" ? "ALREADY CLAIMED" : "NOT COMPLETE",
        (x + w / 2) | 0,
        y + h - 12,
        "#8a5a32",
        "center"
      );
    }
  }

  function drawWeeklyRewardsPanel(x, y, w, h) {
    const period = weeklySpinPeriod();
    const api = lbApi();
    const signed = !!(api && api.isSignedIn && api.isSignedIn());
    const left = Math.max(0, WEEKLY_SPIN.spins - spinUsed);
    const busy = spinReelBusy();
    drawPixText(period.label, (x + w / 2) | 0, y + 34, "#5c3a21", "center");
    drawPixText("LEFT " + left + "  FREE", (x + w / 2) | 0, y + 46, "#3a2414", "center");
    drawSpinReelStrip(x + 14, y + 58, w - 28, 30);
    let action = "SPIN";
    if (!signed) action = "SIGN IN";
    else if (busy) action = "...";
    else if (left <= 0) action = "NEXT WEEK";
    const spinSel = !busy && menuHovering("spin:go");
    if (spinSel) px(x + 18, y + 96, w - 36, 11, "#e8c44a");
    drawPixText(action, (x + w / 2) | 0, y + 98, spinSel ? "#2b1c12" : "#3a2414", "center");
    addMenuHit(
      "spin:go",
      x + 18,
      y + 96,
      w - 36,
      11,
      () => {
        if (busy) return;
        if (!signed) {
          uiScreen = "account";
          authMode = "menu";
          authStatus = "";
          srCursor = 0;
          return;
        }
        tryWeeklySpin();
      },
      { hover: !busy }
    );
    if (!busy && spinNote) {
      drawPixText(String(spinNote).slice(0, 18), (x + w / 2) | 0, y + 114, "#2b1c12", "center");
    }
    drawPixTextSm("ACCOUNT REQUIRED TO SPIN", (x + w / 2) | 0, y + h - 28, "#5c3a21", "center");
  }

  function drawQuestScreen() {
    const uiW = canvas.width / SCALE_UI;
    const uiH = canvas.height / SCALE_UI;
    ctx.globalAlpha = 0.55;
    px(0, 0, uiW, uiH, "#0b1a22");
    ctx.globalAlpha = 1;
    const w = 252;
    let h = 156;
    if (questTab === "quests") h = Math.min(uiH - 10, 28 + NOV_QUESTS.length * 14 + 56);
    else if (questTab === "weekly") h = 148;
    else if (questTab === "levels" && levelsPage === "pass") h = Math.min(uiH - 10, 188);
    else h = 156;
    const x = ((uiW - w) / 2) | 0;
    const y = Math.max(4, ((uiH - h) / 2) | 0);
    drawPanelBox(x, y, w, h, questTab === "levels" ? "ISLEPASS" : "REWARDS");
    drawQuestTabSwitchers(x, y + 16, w);

    if (questTab === "levels") {
      drawLevelsPageSwitchers(x, y + 32, w);
      if (levelsPage === "tiers") drawLevelsTiers(x, y, w);
      else if (levelsPage === "pass") drawLevelsPass(x, y, w, h);
      else drawLevelsOverview(x, y, w, h);
    } else if (questTab === "weekly") {
      drawWeeklyRewardsPanel(x, y, w, h);
    } else {
      drawQuestListPanel(x, y, w, h);
    }

    const canEsc = !(questTab === "weekly" && spinReelBusy());
    drawPixText("ESC", x + 10, y + h - 12, canEsc ? "#5c3a21" : "#8a5a32");
    addMenuHit(
      "quest:esc",
      x + 8,
      y + h - 14,
      28,
      10,
      () => {
        if (!canEsc) return;
        backToModeMenu();
      },
      { hover: canEsc }
    );
  }

  function lockerPreviewSkin() {
    if (lockerHover && lockerHover.type === "skin" && ownsSkin(lockerHover.id)) return lockerHover.id;
    if (lockerDrag && lockerDrag.type === "skin" && ownsSkin(lockerDrag.id)) return lockerDrag.id;
    return playerSkin;
  }

  function lockerPreviewFace() {
    if (lockerHover && lockerHover.type === "cosmetic" && cosmeticKindOf(lockerHover.id) === "face") return lockerHover.id;
    if (lockerDrag && lockerDrag.type === "cosmetic" && cosmeticKindOf(lockerDrag.id) === "face") return lockerDrag.id;
    return cosmetics.face;
  }

  function lockerPreviewBack() {
    const skin = lockerPreviewSkin();
    const locked = skinLockedBack(skin);
    if (locked) return locked;
    if (lockerHover && lockerHover.type === "cosmetic" && cosmeticKindOf(lockerHover.id) === "back") return lockerHover.id;
    if (lockerDrag && lockerDrag.type === "cosmetic" && cosmeticKindOf(lockerDrag.id) === "back") return lockerDrag.id;
    return cosmetics.back;
  }

  /** Pull cosmetics out of bag/satchel into the locker collection. */
  function migrateCosmeticsFromLists(lists) {
    const moved = [];
    for (let li = 0; li < lists.length; li++) {
      const list = lists[li];
      if (!list) continue;
      for (let i = 0; i < list.length; i++) {
        const s = list[i];
        if (!s || !isCosmeticId(s.id)) continue;
        grantCosmetic(s.id);
        moved.push(s.id);
        list[i] = null;
      }
    }
    return moved;
  }

  function loadLockerProfile() {
    let data = null;
    try {
      data = JSON.parse(localStorage.getItem(LOCKER_PROFILE_KEY) || "");
    } catch (e) {
      data = null;
    }
    ownedCosmetics = [];
    ownedSkins = ["classic"];
    playerSkin = "classic";
    skinsGrantedLegacy = false;
    questMaskRuns = 0;
    questDone = {};
    questClaimed = {};
    if (data && typeof data === "object") {
      if (Array.isArray(data.ownedCosmetics)) {
        for (let i = 0; i < data.ownedCosmetics.length; i++) {
          const id = data.ownedCosmetics[i];
          if (isCosmeticId(id) && ownedCosmetics.indexOf(id) < 0) ownedCosmetics.push(id);
        }
      }
      if (Array.isArray(data.ownedSkins)) {
        ownedSkins = [];
        for (let i = 0; i < data.ownedSkins.length; i++) {
          const id = data.ownedSkins[i];
          if (SKIN_DEFS[id] && ownedSkins.indexOf(id) < 0) ownedSkins.push(id);
        }
        if (!ownedSkins.length) ownedSkins = ["classic"];
      }
      if (data.face && isCosmeticId(data.face)) cosmetics.face = data.face;
      if (data.back && isCosmeticId(data.back)) cosmetics.back = data.back;
      if (data.skin && SKIN_DEFS[data.skin] && ownsSkin(data.skin)) playerSkin = data.skin;
      skinsGrantedLegacy = !!data.skinsGrantedLegacy;
      questMaskRuns = data.questMaskRuns | 0;
      if (data.questDone && typeof data.questDone === "object") questDone = data.questDone;
      if (data.questClaimed && typeof data.questClaimed === "object") questClaimed = data.questClaimed;
    }
    // Launch skins are free for everyone locally.
    ensureLaunchSkins();
    if (cosmetics.face && !ownsCosmetic(cosmetics.face)) grantCosmetic(cosmetics.face);
    if (cosmetics.back && !ownsCosmetic(cosmetics.back)) grantCosmetic(cosmetics.back);
    syncQuestOwnershipFlags();
    tryGrantAmericanCloak();
    loadCareer();
    backfillCareerFromHistory();
    refreshCareerLevelCache();
    syncIslePassUnlocks();
  }

  function addToInventory(id) {
    if (isCosmeticId(id)) {
      grantCosmetic(id);
      return true;
    }
    const def = ITEM_DEFS[id];
    const existing = inventory.findIndex((s) => s && s.id === id);
    if (existing >= 0) {
      if (inventory[existing].count >= def.max) return false;
      inventory[existing].count += 1;
      if (playMode === "normal" && id === "shark") {
        const api = lbApi();
        if (api && api.noteNmEvent) api.noteNmEvent("sharks", 1);
      }
      if (playMode === "speedrun" && srCat === "full_inv" && bagFilledForFullInv()) {
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
    if (playMode === "speedrun" && srCat === "full_inv" && bagFilledForFullInv()) {
      finishSpeedrun();
    }
    if (playMode === "speedrun" && srCat === "serpent" && id === "serpent_heart") {
      finishSpeedrun();
    }
    return true;
  }

  /** Legacy survival XP curve — unused (loot XP removed). Kept for old saves. */
  function xpNeeded(level) {
    return 24 + (level - 1) * 16;
  }

  /** Survival loot no longer grants XP. Vein/bridge may still call this — ignore. */
  function gainXp(_amount) {
    return;
  }

  function updateXpFx(dt) {
    if (careerLastGainT > 0) {
      careerLastGainT = Math.max(0, careerLastGainT - dt);
    }
    if (!xpFx) return;
    xpFx.t += dt;
    if (xpFx.t > (xpFx.leveled ? 1.55 : 0.95)) xpFx = null;
  }

  function careerXpCost(level) {
    // XP to go from `level` → level+1. Brutal exponential.
    const L = Math.max(1, level | 0);
    return Math.floor(110 * Math.pow(1.195, L - 1));
  }

  function careerXpToReach(level) {
    const target = Math.max(1, level | 0);
    let sum = 0;
    for (let L = 1; L < target; L++) sum += careerXpCost(L);
    return sum;
  }

  function careerLevelFromXp(xp) {
    let lv = 1;
    let rem = Math.max(0, xp | 0);
    // Soft cap display at 200; grind beyond is allowed
    while (lv < 200) {
      const need = careerXpCost(lv);
      if (rem < need) break;
      rem -= need;
      lv += 1;
    }
    return lv;
  }

  function careerXpIntoLevel(xp) {
    let rem = Math.max(0, xp | 0);
    let lv = 1;
    while (lv < 200) {
      const need = careerXpCost(lv);
      if (rem < need) return { level: lv, into: rem, need };
      rem -= need;
      lv += 1;
    }
    return { level: 200, into: rem, need: careerXpCost(200) };
  }

  function careerTierOf(level) {
    const lv = Math.max(1, level | 0);
    if (lv >= 76)
      return { id: "champion", label: "CHAMPION", short: "CHMP", color: "#ffe27a", edge: "#5c3a21", ink: "#2b1c12" };
    if (lv >= 56)
      return { id: "diamond", label: "DIAMOND", short: "DIA", color: "#9ad8f0", edge: "#1a4060", ink: "#0a2030" };
    if (lv >= 36)
      return { id: "gold", label: "GOLD", short: "GOLD", color: "#e8c44a", edge: "#5c3a21", ink: "#2b1c12" };
    if (lv >= 21)
      return { id: "silver", label: "SILVER", short: "SILV", color: "#d0d8e0", edge: "#3a4450", ink: "#1a2030" };
    return { id: "bronze", label: "BRONZE", short: "BRNZ", color: "#c4a574", edge: "#5c3a21", ink: "#2b1c12" };
  }

  function catWeight(cat) {
    return CAT_WEIGHT[cat] || 1.4;
  }

  function catBoardWrMs(cat) {
    const api = lbApi();
    if (api && api.getCachedBoard) {
      const rows = api.getCachedBoard(cat) || [];
      if (rows[0] && (rows[0].time_ms | 0) > 0) return rows[0].time_ms | 0;
    }
    return CAT_SOFT_WR[cat] || 90000;
  }

  /**
   * XP for one run event. opts: { submitted, pb, wr, wrMs }
   * Intentionally small — ranks take a long grind.
   */
  function careerXpForRun(cat, timeMs, opts) {
    const o = opts || {};
    const w = catWeight(cat);
    const wr = (o.wrMs | 0) > 0 ? o.wrMs | 0 : catBoardWrMs(cat);
    const ms = Math.max(1, timeMs | 0);
    const ratio = Math.min(1.85, Math.max(0.35, wr / ms));
    let xp = Math.floor(8 * w * ratio); // finish
    if (o.submitted) xp += Math.floor(xp * 0.75);
    if (o.pb) xp += Math.floor(12 * w * ratio);
    if (o.wr) xp += Math.floor(32 * w);
    return Math.max(1, xp | 0);
  }

  function saveCareer() {
    try {
      localStorage.setItem(
        CAREER_KEY,
        JSON.stringify({
          xp: careerXp | 0,
          level: careerLevel | 0,
          backfilled: !!careerBackfilled,
          backfillVer: careerBackfillVer | 0,
          passXp: passXp | 0,
          passClaimed: passClaimed || {},
        })
      );
    } catch (e) {}
  }

  function loadCareer() {
    let data = null;
    try {
      data = JSON.parse(localStorage.getItem(CAREER_KEY) || "");
    } catch (e) {
      data = null;
    }
    if (data && typeof data === "object") {
      careerXp = Math.max(0, data.xp | 0);
      careerLevel = Math.max(1, data.level | 0);
      careerBackfilled = !!data.backfilled;
      careerBackfillVer = data.backfillVer | 0;
      passXp = Math.max(0, data.passXp | 0);
      passClaimed = data.passClaimed && typeof data.passClaimed === "object" ? data.passClaimed : {};
    } else {
      careerXp = 0;
      careerLevel = 1;
      careerBackfilled = false;
      careerBackfillVer = 0;
      passXp = 0;
      passClaimed = {};
    }
    // Recompute level from xp (source of truth)
    careerLevel = careerLevelFromXp(careerXp);
  }

  /**
   * Rebuild career XP from what this account/device has already done:
   * local+cloud PRs, run/submit counters, category breadth.
   * Soft-capped so even stacked accounts stay at/under bronze edge (lv20).
   */
  function computeCareerXpFromHistory() {
    const api = lbApi();
    let xp = 0;
    let cats = 0;
    const prs = api && api.listLocalPrs ? api.listLocalPrs() : [];
    for (let i = 0; i < prs.length; i++) {
      const p = prs[i];
      if (!p || !(p.time_ms > 0)) continue;
      cats += 1;
      const wrMs = catBoardWrMs(p.category);
      const isWr = (p.time_ms | 0) <= wrMs && wrMs > 0;
      xp += careerXpForRun(p.category, p.time_ms, {
        submitted: true,
        pb: true,
        wr: isWr,
        wrMs,
      });
    }
    // Breadth bonus — more categories cleared = higher rank floor
    xp += cats * 10;

    const sr = api && api.loadLocalSrStats ? api.loadLocalSrStats() : null;
    let runs = (sr && sr.runs) || 0;
    let submits = (sr && sr.submits) || 0;
    const prof = api && api.currentProfile ? api.currentProfile() : null;
    if (prof) {
      runs = Math.max(runs | 0, prof.total_runs | 0);
      submits = Math.max(submits | 0, prof.total_submits | 0);
    }
    // Diminishing returns on raw volume so grinders don't skip silver
    const runXp =
      Math.min(runs, 80) * 4 +
      Math.max(0, Math.min(runs - 80, 200)) * 2 +
      Math.max(0, Math.min(runs - 280, 400)) * 1;
    const submitXp =
      Math.min(submits, 60) * 6 + Math.max(0, Math.min(submits - 60, 200)) * 2;
    xp += runXp + submitXp;

    // Soft cap: max bronze (lv 20). Silver+ must be earned live.
    const bronzeCap = careerXpToReach(21) - 1;
    return Math.min(Math.max(0, xp | 0), bronzeCap);
  }

  function applyCareerXp(amount, reason) {
    const add = Math.max(0, amount | 0);
    if (add <= 0) return 0;
    const prev = careerLevel;
    careerXp += add;
    careerLevel = careerLevelFromXp(careerXp);
    careerLastGain = add;
    careerLastGainT = 2.4;
    // Isle Pass shares speedrun XP (primary grind).
    passXp = (passXp | 0) + add;
    saveCareer();
    syncIslePassUnlocks();
    // Remember self in display cache
    const me = hubLocalName();
    if (me) careerLevelCache[String(me).toUpperCase()] = careerLevel;
    if (careerLevel > prev) {
      questTip = "RANK UP LV " + careerLevel;
      questTipT = 2.8;
      cosTip = questTip;
      cosTipT = 2.8;
      playXpChime();
    }
    return add;
  }

  /** Slow pass XP while actively in-world (normal or speedrun). ~120 XP / hour. */
  function tickIslePassPlaytime(dt) {
    if (!(playMode === "normal" || playMode === "speedrun")) return;
    if (uiBlocksPlay() || guideOpen) return;
    if (playMode === "speedrun" && !srRunning) return;
    passPlayAcc += dt;
    // 1 XP every 30s of live play (~120/hr) — softens pure speedrun gate for 1–3h clears
    while (passPlayAcc >= 30) {
      passPlayAcc -= 30;
      passXp = (passXp | 0) + 1;
      saveCareer();
      syncIslePassUnlocks();
    }
  }

  /**
   * Sync rank upward from account/device history (PRs, runs, submits).
   * Never lowers live XP; never grants silver+ from history alone.
   */
  function syncCareerFromAccountHistory() {
    const hist = computeCareerXpFromHistory();
    if (hist > careerXp) careerXp = hist;
    careerLevel = careerLevelFromXp(careerXp);
    careerBackfilled = true;
    careerBackfillVer = CAREER_BACKFILL_VER;
    saveCareer();
  }

  function backfillCareerFromHistory() {
    // Re-run when formula version bumps so existing accounts get adjusted ranks.
    if (careerBackfilled && careerBackfillVer >= CAREER_BACKFILL_VER) {
      careerLevel = careerLevelFromXp(careerXp);
      return;
    }
    syncCareerFromAccountHistory();
  }

  /** Estimate another player's level from known category PRs (board caches). */
  function estimateCareerLevelFromPrs(prsMap, extra) {
    if (!prsMap) return 1;
    let xp = 0;
    let cats = 0;
    const keys = Object.keys(prsMap);
    for (let i = 0; i < keys.length; i++) {
      const cat = keys[i];
      const ms = prsMap[cat] | 0;
      if (ms <= 0) continue;
      cats += 1;
      const wrMs = catBoardWrMs(cat);
      xp += careerXpForRun(cat, ms, {
        submitted: true,
        pb: true,
        wr: ms <= wrMs,
        wrMs,
      });
    }
    xp += cats * 10;
    const o = extra || {};
    const runs = Math.min(300, o.runs | 0);
    const submits = Math.min(200, o.submits | 0);
    xp +=
      Math.min(runs, 80) * 4 +
      Math.max(0, Math.min(runs - 80, 200)) * 2 +
      Math.min(submits, 60) * 6;
    const bronzeCap = careerXpToReach(21) - 1;
    return careerLevelFromXp(Math.min(xp, bronzeCap));
  }

  function refreshCareerLevelCache() {
    const api = lbApi();
    careerLevelCache = {};
    const me = hubLocalName();
    if (me) careerLevelCache[String(me).toUpperCase()] = careerLevel;
    if (!api || !api.buildLocalProfileIndex && !api.searchLocalProfiles) {
      // searchLocalProfiles uses the index; get cards via empty search
    }
    if (api && api.searchLocalProfiles) {
      const cards = api.searchLocalProfiles("");
      for (let i = 0; i < cards.length; i++) {
        const c = cards[i];
        if (!c || !c.name) continue;
        const key = String(c.name).toUpperCase();
        if (me && key === String(me).toUpperCase()) {
          careerLevelCache[key] = careerLevel;
          continue;
        }
        const runsGuess = Math.min(200, ((c.sr_playtime_ms | 0) / 60000) | 0);
        careerLevelCache[key] = estimateCareerLevelFromPrs(c.prs || {}, {
          runs: runsGuess,
          submits: Object.keys(c.prs || {}).length,
        });
      }
    }
  }

  function careerLevelForName(name) {
    const key = String(name || "")
      .toUpperCase()
      .replace(/[^A-Z0-9 ]/g, "")
      .trim();
    if (!key) return 1;
    const me = String(hubLocalName() || "")
      .toUpperCase()
      .trim();
    if (me && key === me) return careerLevel;
    if (careerLevelCache[key] != null) return careerLevelCache[key] | 0;
    return 1;
  }

  function drawLevelBadge(level, x, y) {
    const lv = Math.max(1, level | 0);
    const tier = careerTierOf(lv);
    const s = String(lv);
    const tw = pixTextWidth(s);
    px(x - 1, y - 1, tw + 5, 9, tier.edge);
    px(x, y, tw + 3, 7, tier.color);
    drawPixText(s, x + 2, y, tier.ink);
    return tw + 6;
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
    // Cosmetics unlock into the locker — never need a bag slot.
    if (isCosmeticId(id)) return true;
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

  function clearSatchel() {
    for (let i = 0; i < satchel.length; i++) satchel[i] = null;
    satchelOpen = false;
    slotDrag = null;
  }

  function satchelHolding() {
    for (let i = 0; i < satchel.length; i++) if (satchel[i] && satchel[i].id) return true;
    return false;
  }

  function inflightSatchel(id) {
    let n = 0;
    for (let i = 0; i < pickupAnims.length; i++) {
      if (pickupAnims[i].dest === "satchel" && pickupAnims[i].id === id) n++;
    }
    return n;
  }

  function canTakeList(list, id, pending) {
    const def = ITEM_DEFS[id];
    if (!def) return false;
    const stack = list.find((s) => s && s.id === id);
    const wait = pending | 0;
    if (stack) return stack.count + wait < def.max;
    if (wait > 0) return wait < def.max;
    for (let i = 0; i < list.length; i++) if (!list[i]) return true;
    return false;
  }

  function canTakeSatchel(id) {
    if (playMode !== "normal" || id === "coin") return false;
    return canTakeList(satchel, id, inflightSatchel(id));
  }

  function addToList(list, id) {
    const def = ITEM_DEFS[id];
    if (!def) return false;
    const existing = list.findIndex((s) => s && s.id === id);
    if (existing >= 0) {
      if (list[existing].count >= def.max) return false;
      list[existing].count += 1;
      return true;
    }
    const empty = list.findIndex((s) => !s);
    if (empty < 0) return false;
    list[empty] = { id, count: 1 };
    return true;
  }

  function addToSatchel(id) {
    if (playMode !== "normal") return false;
    return addToList(satchel, id);
  }

  function satchelSlotFor(id) {
    const i = satchel.findIndex((s) => s && s.id === id);
    if (i >= 0) return i;
    for (let a = 0; a < pickupAnims.length; a++) {
      if (pickupAnims[a].dest === "satchel" && pickupAnims[a].id === id) return pickupAnims[a].slot;
    }
    const used = Object.create(null);
    for (let a = 0; a < pickupAnims.length; a++) {
      const p = pickupAnims[a];
      if (p.dest === "satchel") used[p.slot] = 1;
    }
    for (let s = 0; s < satchel.length; s++) {
      if (!satchel[s] && !used[s]) return s;
    }
    return 0;
  }

  function listOwns(list, id) {
    for (let i = 0; i < list.length; i++) if (list[i] && list[i].id === id) return true;
    return false;
  }

  function moveStack(src, si, dst, di) {
    if (src === dst && si === di) return;
    const a = src[si];
    if (!a) return;
    const b = dst[di];
    if (!b) {
      dst[di] = a;
      src[si] = null;
      return;
    }
    if (b.id === a.id) {
      const max = ITEM_DEFS[a.id] ? ITEM_DEFS[a.id].max : 1;
      const room = max - b.count;
      if (room <= 0) return;
      const n = Math.min(room, a.count);
      b.count += n;
      a.count -= n;
      if (a.count <= 0) src[si] = null;
      return;
    }
    src[si] = b;
    dst[di] = a;
  }

  function satchelOrigin() {
    const h = hudBarOrigin();
    const cosGap = 6;
    const cosW = h.slot + cosGap + 2;
    let x = h.x0 - cosW - h.barW - 8;
    if (x < 4) x = 4;
    return { x, y: h.y0, slot: h.slot, gap: h.gap, rowGap: h.rowGap, barW: h.barW };
  }

  function bagSlotRect(i) {
    const h = hudBarOrigin();
    const col = i % HUD_COLS;
    const row = (i / HUD_COLS) | 0;
    return {
      x: h.x0 + col * (h.slot + h.gap),
      y: h.y0 + row * (h.slot + h.rowGap),
      w: h.slot,
      h: h.slot,
    };
  }

  function satchelSlotRect(i) {
    const o = satchelOrigin();
    const col = i % HUD_COLS;
    const row = (i / HUD_COLS) | 0;
    return {
      x: o.x + col * (o.slot + o.gap),
      y: o.y + row * (o.slot + o.rowGap),
      w: o.slot,
      h: o.slot,
    };
  }

  function slotAtUi(ux, uy) {
    if (satchelOpen) {
      for (let i = 0; i < satchel.length; i++) {
        const r = satchelSlotRect(i);
        if (ux >= r.x && uy >= r.y && ux < r.x + r.w && uy < r.y + r.h) return { src: "satchel", index: i };
      }
    }
    for (let i = 0; i < inventory.length; i++) {
      const r = bagSlotRect(i);
      if (ux >= r.x && uy >= r.y && ux < r.x + r.w && uy < r.y + r.h) return { src: "bag", index: i };
    }
    return null;
  }

  function stackArray(src) {
    return src === "satchel" ? satchel : inventory;
  }

  function finishSlotDrag(ux, uy) {
    const drag = slotDrag;
    slotDrag = null;
    if (!drag || playMode !== "normal" || !satchelOpen) return;
    const hit = slotAtUi(ux, uy);
    if (!hit) return;
    moveStack(stackArray(drag.src), drag.index, stackArray(hit.src), hit.index);
  }

  function weeklySpinPeriod(now) {
    const t = now == null ? Date.now() : now;
    const months = ["JAN", "FEB", "MAR", "APR", "MAY", "JUN", "JUL", "AUG", "SEP", "OCT", "NOV", "DEC"];
    if (t <= WEEKLY_SPIN.firstEndMs) return { key: "2026-11-11", label: "UNTIL NOV 11" };
    const start = Date.UTC(2026, 10, 12);
    const week = Math.floor((t - start) / WEEKLY_SPIN.weekMs);
    const end = new Date(start + (week + 1) * WEEKLY_SPIN.weekMs - 1000);
    const key = end.toISOString().slice(0, 10);
    return { key: key, label: "UNTIL " + months[end.getUTCMonth()] + " " + end.getUTCDate() };
  }

  function readSurvivalSave() {
    try {
      const data = JSON.parse(localStorage.getItem(SAVE_KEY) || "");
      if (!data || typeof data !== "object") return null;
      return data;
    } catch (e) {
      return null;
    }
  }

  function ensureSaveSlots(list) {
    const out = [];
    const src = Array.isArray(list) ? list : [];
    for (let i = 0; i < MAX_SLOTS; i++) {
      const s = src[i];
      out.push(s && s.id && ITEM_DEFS[s.id] ? { id: s.id, count: Math.max(1, s.count | 0) } : null);
    }
    return out;
  }

  function survivalOwnsId(data, id) {
    if (isCosmeticId(id)) return ownsCosmetic(id);
    if (data.cosmetics && data.cosmetics.face === id) return true;
    if (data.cosmetics && data.cosmetics.back === id) return true;
    const slots = data.slots || [];
    const bag = data.satchel || [];
    for (let i = 0; i < slots.length; i++) if (slots[i] && slots[i].id === id) return true;
    for (let i = 0; i < bag.length; i++) if (bag[i] && bag[i].id === id) return true;
    return false;
  }

  function survivalGiveId(data, id) {
    if (isCosmeticId(id)) {
      grantCosmetic(id);
      if (data) {
        data.ownedCosmetics = ownedCosmetics.slice();
        data.cosmetics = { face: cosmetics.face, back: cosmetics.back };
      }
      return true;
    }
    data.slots = ensureSaveSlots(data.slots);
    data.satchel = ensureSaveSlots(data.satchel);
    if (addToList(data.slots, id)) return true;
    if (addToList(data.satchel, id)) return true;
    return false;
  }

  function survivalCoinCount() {
    if (playMode === "normal") return player.coins | 0;
    const data = readSurvivalSave();
    return data ? Math.max(0, data.coins | 0) : 0;
  }

  function applySurvivalMemory(data) {
    if (playMode !== "normal") return;
    player.coins = Math.max(0, data.coins | 0);
    const slots = ensureSaveSlots(data.slots);
    const bag = ensureSaveSlots(data.satchel);
    for (let i = 0; i < MAX_SLOTS; i++) {
      inventory[i] = slots[i] ? { id: slots[i].id, count: slots[i].count } : null;
      satchel[i] = bag[i] ? { id: bag[i].id, count: bag[i].count } : null;
    }
    if (data.cosmetics) {
      cosmetics.face = data.cosmetics.face && ITEM_DEFS[data.cosmetics.face] ? data.cosmetics.face : null;
      cosmetics.back = data.cosmetics.back && ITEM_DEFS[data.cosmetics.back] ? data.cosmetics.back : null;
    }
  }

  function openSpinMenu() {
    openIslePassMenu();
  }

  function rollWeeklyPrize() {
    let r = Math.random();
    for (let i = 0; i < WEEKLY_SPIN.prizes.length; i++) {
      const p = WEEKLY_SPIN.prizes[i];
      if (r < p.p) return p;
      r -= p.p;
    }
    return WEEKLY_SPIN.prizes[WEEKLY_SPIN.prizes.length - 1];
  }

  function spinReelBusy() {
    return !!(spinReel && performance.now() < spinReel.start + spinReel.dur);
  }

  function startSpinReel(prize, owned) {
    const cell = 30;
    const reelW = 170;
    const land = 22 + ((Math.random() * 6) | 0);
    const cells = [];
    for (let i = 0; i < land + 8; i++) {
      if (i === land) cells.push(prize);
      else cells.push(WEEKLY_SPIN.prizes[(Math.random() * WEEKLY_SPIN.prizes.length) | 0]);
    }
    const jitter = Math.random() * 8 - 4;
    spinNote = "";
    spinReel = {
      start: performance.now(),
      dur: 2600,
      from: 0,
      to: land * cell + cell / 2 - reelW / 2 + jitter,
      cells: cells,
      cell: cell,
      reelW: reelW,
      note: owned ? "OWNED" : prize.label,
      done: false,
    };
  }

  function spinReelOffset() {
    if (!spinReel) return 0;
    const t = Math.min(1, (performance.now() - spinReel.start) / spinReel.dur);
    const e = 1 - Math.pow(1 - t, 3);
    if (t >= 1 && !spinReel.done) {
      spinReel.done = true;
      spinNote = spinReel.note;
    }
    return spinReel.from + (spinReel.to - spinReel.from) * e;
  }

  function tryWeeklySpin() {
    if (spinReelBusy()) return;
    const api = lbApi();
    if (!api || !api.isSignedIn || !api.isSignedIn()) {
      spinNote = "SIGN IN";
      uiScreen = "account";
      authMode = "menu";
      authStatus = "";
      srCursor = 0;
      return;
    }
    const period = weeklySpinPeriod();
    spinPeriodKey = period.key;
    if (spinUsed >= WEEKLY_SPIN.spins) {
      if (!spinNextWeekTold) {
        spinNote = "NEXT WEEK";
        spinNextWeekTold = true;
      }
      return;
    }
    const data = readSurvivalSave() || { slots: [], satchel: [], coins: 0, cosmetics: { face: null, back: null } };
    if (playMode === "normal") {
      data.coins = player.coins | 0;
      data.slots = inventory.map((s) => (s && s.id ? { id: s.id, count: s.count | 0 } : null));
      data.satchel = satchel.map((s) => (s && s.id ? { id: s.id, count: s.count | 0 } : null));
      data.cosmetics = { face: cosmetics.face, back: cosmetics.back };
    }
    data.slots = ensureSaveSlots(data.slots);
    data.satchel = ensureSaveSlots(data.satchel);
    if (!data.cosmetics) data.cosmetics = { face: null, back: null };
    const prize = rollWeeklyPrize();
    const owned = survivalOwnsId(data, prize.id);
    if (!owned && !survivalGiveId(data, prize.id)) {
      spinNote = "BAG FULL";
      return;
    }
    try {
      localStorage.setItem(SAVE_KEY, JSON.stringify(data));
    } catch (e) {}
    applySurvivalMemory(data);
    spinUsed = Math.min(WEEKLY_SPIN.spins, spinUsed + 1);
    if (api.recordWeeklySpin) api.recordWeeklySpin(period.key, spinUsed);
    startSpinReel(prize, owned);
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
    const isCos = !isCoin && isCosmeticId(item.id);
    const toSatchel = !isCoin && !isCos && !canTake(item.id) && canTakeSatchel(item.id);
    if (!isCoin && !isCos && !canTake(item.id) && !toSatchel) return;
    const id = item.id;
    const from = worldToUi(item.x + 6, item.y + 6);
    pickupAnims.push({
      id,
      t: 0,
      fromX: from.x,
      fromY: from.y,
      slot: isCoin || isCos ? 0 : toSatchel ? satchelSlotFor(id) : slotIndexFor(id),
      dest: isCoin ? "coins" : isCos ? "cosmetic" : toSatchel ? "satchel" : "slot",
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
      if (item.id !== "coin" && !canTake(item.id) && !canTakeSatchel(item.id)) continue;
      pickup(item);
    }
  }

  function updatePickup(dt) {
    let coinBatch = 0;
    let slotBatch = -1;
    let gotItem = false;
    for (let i = pickupAnims.length - 1; i >= 0; i--) {
      const a = pickupAnims[i];
      a.t += dt;
      const doneAt = a.style === "drop" ? 1.42 : 1.7;
      if (a.t < doneAt) continue;
      if (a.dest === "coins") coinBatch += a.value | 0;
      else if (a.dest === "cosmetic") {
        const neu = !ownsCosmetic(a.id);
        grantCosmetic(a.id);
        onItemCollected(a.id);
        if (neu) {
          cosTip = "COSMETIC UNLOCKED";
          cosTipT = 1.6;
        }
        gotItem = true;
      } else if (a.dest === "satchel") {
        if (addToSatchel(a.id)) onItemCollected(a.id);
        gotItem = true;
      } else if (a.dest !== "miss") {
        addToInventory(a.id);
        onItemCollected(a.id);
        slotBatch = a.slot;
        gotItem = true;
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
    if (gotItem) {
      if (slotBatch >= 0) {
        heldSlot = slotBatch;
        cosSelect = null;
      }
    }
  }

  function takeOneFrom(list, id) {
    for (let i = 0; i < list.length; i++) {
      const s = list[i];
      if (!s || s.id !== id) continue;
      s.count -= 1;
      if (s.count <= 0) list[i] = null;
      return true;
    }
    return false;
  }

  function onItemCollected(id) {
    if (id === "sun_idol") noteDailyClaim(utcDayKey());
    // Cosmetics unlock in the locker — equip only from the menu.
    if (isCosmeticId(id)) grantCosmetic(id);
  }

  function promptText() {
    if (pondTipT > 0 && pondTip) return pondTip;
    if (cosTipT > 0 && cosTip) return cosTip;
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
    if (scene === "island" && !player.aboard && nearestCatchableCrab() >= 0) {
      return "SPACE CATCH";
    }
    if (ruinsPortal && scene === "island" && !player.aboard && playerHits(ruinsPortal)) {
      return rome && carriesPortalLeech() ? "ENTER THE PORTAL" : "PORTAL DORMANT";
    }
    if (rome && rome.isScene()) {
      const rp = rome.prompt();
      if (rp) return rp;
    }
    if (vein) {
      const vp = vein.prompt();
      if (vp) return vp;
    }
    if (!nearestLoot || nearestLoot.id === "coin") return "";
    const def = ITEM_DEFS[nearestLoot.id];
    if (!def || canTake(nearestLoot.id) || canTakeSatchel(nearestLoot.id)) return "";
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

  function holdingWand() {
    const stack = inventory[heldSlot];
    return !!(stack && stack.id === "wand");
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
    if (scene === "vein" && vein) {
      vein.fireSpell();
      return;
    }
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
      if (!p.vein && serpent && serpent.phase === "breach" && serpent.hurt <= 0.28) {
        for (let s = 0; s < Math.min(3, serpent.segs.length); s++) {
          const seg = serpent.segs[s];
          if (Math.hypot(p.x - seg.x, p.y - seg.y) < 10) {
            hurtSerpent(1);
            hit = true;
            break;
          }
        }
      }
      if (hit) wandBolts.splice(i, 1);
    }
    if (scene === "vein" && vein) vein.updateBolts(dt);
    for (let i = wandBolts.length - 1; i >= 0; i--) {
      if (wandBolts[i].life <= 0) wandBolts.splice(i, 1);
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
      if (p.vein) {
        const col =
          p.spell === "bind" ? "#a080e0" : p.spell === "shatter" ? "#e8c44a" : "#5ee8d0";
        px(x - 1, y - 1, 3, 3, col);
        px(x, y, 1, 1, "#e8fff8");
        px(x - ((p.vx > 0 ? 1 : -1) * 2), y, 2, 1, a > 0.4 ? col : "#1a2830");
        continue;
      }
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

  function carriesPortalLeech() {
    if (ownsItem("portal_leech")) return true;
    for (let i = 0; i < satchel.length; i++) {
      if (satchel[i] && satchel[i].id === "portal_leech") return true;
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
    // Cloak is locker-only now — magic chest keeps the wand.
    const ids = ["wand"];
    for (let i = 0; i < ids.length; i++) {
      const id = ids[i];
      const fits = canTake(id);
      const from = worldToUi(player.x + player.w / 2, player.y - 22);
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

  /** Hearts float above the player for ~2s after catching a blowfish (no full-screen cut). */
  function startBlowfishHearts() {
    blowfishHearts = { t: 0, dur: 2 };
  }

  function scheduleBlowfishSpeedEnd(delaySec) {
    if (playMode !== "speedrun" || srCat !== "blowfish") return;
    if (!srTiming || uiScreen === "finish") return;
    srBlowfishFinishT = Math.max(0, delaySec);
  }

  function updateBlowfishHearts(dt) {
    if (!blowfishHearts) return;
    blowfishHearts.t += dt;
    if (blowfishHearts.t >= blowfishHearts.dur) {
      blowfishHearts = null;
      // Blowfish% ends 1s after the hearts finish.
      scheduleBlowfishSpeedEnd(1);
    }
  }

  /** Short jade-and-gold celebration. Only the equip paths call this, never a save load. */
  function startJadeMaskFx() {
    const sparks = [];
    const n = 26;
    for (let i = 0; i < n; i++) {
      const gold = i % 4 === 0;
      const wisp = i % 5 === 2;
      sparks.push({
        ang: (i / n) * Math.PI * 2,
        orbit: 0.9 + (i % 5) * 0.22,
        rad: 5 + (i % 6) * 1.45,
        rise: 4 + (i % 5) * 2.1,
        phase: i * 1.31,
        w: i % 7 === 0 ? 2 : 1,
        kind: wisp ? 2 : gold ? 1 : 0,
      });
    }
    jadeMaskFx = { t: 0, dur: 2.15, sparks };
  }

  function updateJadeMaskFx(dt) {
    if (!jadeMaskFx) return;
    jadeMaskFx.t += dt;
    if (jadeMaskFx.t >= jadeMaskFx.dur) jadeMaskFx = null;
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
    if (!b || !b.landed || boatThrow) return 0;
    const amp = b.docked ? 0.45 : 1.15;
    return Math.sin((t == null ? time : t) * 1.8 + (b.phase || 0)) * amp;
  }

  function boatNearBerth(b, reach) {
    if (!b || !boatBerth) return false;
    const cx = b.x + b.w / 2;
    const cy = b.y + b.h / 2;
    const bx = boatBerth.x + boatBerth.w / 2;
    const by = boatBerth.y + boatBerth.h / 2;
    return Math.hypot(cx - bx, cy - by) <= (reach == null ? 30 : reach);
  }

  function settleBoatInBerth(b) {
    if (!b || !boatBerth) return;
    b.x = boatBerth.x;
    b.y = boatBerth.y;
    b.vx = 0;
    b.vy = 0;
    b.tilt = 0;
    b.face = boatBerth.face;
    b.docked = true;
    if (typeof player !== "undefined" && player.aboard && aboardKind !== "dinghy") {
      player.facing = boatBerth.face;
      seatPlayerOnBoat();
    }
  }

  function clearBerthIfAway(b) {
    if (!b || !b.docked) return;
    if (!boatNearBerth(b, 22)) b.docked = false;
  }

  function releaseBoatFromBerth(b, cool) {
    if (!b) return;
    b.docked = false;
    b.berthIgnore = Math.max(b.berthIgnore || 0, cool == null ? 1.35 : cool);
  }

  /** Enter while aboard → stand on the T-head and park the skiff in the slip. */
  function exitBoatToDockT() {
    if (aboardKind === "dinghy") return false;
    if (!player.aboard || !ownedBoat || scene !== "island") return false;
    if (!boatBerth || !boatBerthDeck) return false;
    const deck = boatBerthDeck;
    player.aboard = false;
    aboardKind = null;
    player.x = (deck.x + (deck.w - player.w) / 2) | 0;
    player.y = (deck.y + deck.h - player.h - 1) | 0;
    player.inWater = false;
    player.submerged = 0;
    player.moving = false;
    settleBoatInBerth(ownedBoat);
    boatBoardCool = 1.5;
    return true;
  }

  function dinghyBob(b, t) {
    if (!b) return 0;
    return Math.sin((t == null ? time : t) * 1.8 + (b.phase || 0)) * 0.8;
  }

  function dinghyHullOk(x, y, w, h) {
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
      if (pondPad && hitPad(px, py, [pondPad])) return false;
      if (hitPad(px, py, walkPads)) return false;
      // Stay in the river pool / carved pond water only
      if (!inPondWater(px, py) && !inRiverWater(px, py)) return false;
    }
    return true;
  }

  function seatPlayerOnDinghy() {
    if (!pondBoat) return;
    const bob = dinghyBob(pondBoat, time);
    const b = pondBoat;
    player.x = b.x + (b.w - player.w) / 2;
    player.y = b.y + bob - 8;
  }

  function exitDinghy() {
    if (aboardKind !== "dinghy" || !player.aboard || !pondBoat) return false;
    if (rod.phase !== "idle") {
      rod.phase = "idle";
      rod.catchId = null;
      rodBaitId = null;
    }
    const b = pondBoat;
    let landed = false;
    if (pondPad) {
      const mid = { x: b.x + b.w / 2, y: b.y + b.h / 2 };
      const px = pondPad.x + pondPad.w / 2;
      const py = pondPad.y + pondPad.h / 2;
      if (Math.hypot(mid.x - px, mid.y - py) < 48) {
        player.x = (pondPad.x + (pondPad.w - player.w) / 2) | 0;
        player.y = (pondPad.y + pondPad.h - player.h - 1) | 0;
        landed = true;
      }
    }
    if (!landed) {
      const dirs = [
        [0, 10],
        [0, -10],
        [12, 0],
        [-12, 0],
        [10, 8],
        [-10, 8],
      ];
      for (let i = 0; i < dirs.length; i++) {
        const x = ((b.x + b.w / 2 - player.w / 2 + dirs[i][0]) | 0);
        const y = ((b.y + dirs[i][1]) | 0);
        if (canStand(x, y) && canStand(x + 4, y + 6) && !isWaterAt(x + 2, y + 8)) {
          player.x = x;
          player.y = y;
          landed = true;
          break;
        }
      }
    }
    if (!landed) return false;
    player.aboard = false;
    aboardKind = null;
    player.inWater = false;
    player.submerged = 0;
    player.moving = false;
    b.vx = 0;
    b.vy = 0;
    return true;
  }

  function steerDinghy(dt, dx, dy) {
    const b = pondBoat;
    if (!b) return;
    // Don't shove the boat while the rod is out
    if (rod.phase !== "idle") {
      b.vx = 0;
      b.vy = 0;
      player.moving = false;
      seatPlayerOnDinghy();
      return;
    }
    const moving = dx !== 0 || dy !== 0;
    player.moving = moving;
    const len = Math.hypot(dx, dy) || 1;
    const acc = 120;
    if (moving) {
      b.vx = (b.vx || 0) + (dx / len) * acc * dt;
      b.vy = (b.vy || 0) + (dy / len) * acc * dt;
      if (dx !== 0) player.facing = dx > 0 ? 1 : -1;
      b.face = player.facing;
    }
    b.vx = (b.vx || 0) * (1 - Math.min(1, dt * 2.8));
    b.vy = (b.vy || 0) * (1 - Math.min(1, dt * 2.8));
    const spd = Math.hypot(b.vx, b.vy);
    const max = 90;
    if (spd > max) {
      b.vx *= max / spd;
      b.vy *= max / spd;
    }
    const nx = b.x + b.vx * dt;
    const ny = b.y + b.vy * dt;
    if (dinghyHullOk(nx, b.y, b.w, b.h)) b.x = nx;
    else b.vx *= 0.15;
    if (dinghyHullOk(b.x, ny, b.w, b.h)) b.y = ny;
    else b.vy *= 0.15;
    b.tilt += (((b.vx || 0) / max) * 0.2 - (b.tilt || 0)) * Math.min(1, dt * 8);
    seatPlayerOnDinghy();
  }

  function tryDinghyToggle() {
    if (!pondFishReady || !pondBoat || scene !== "island" || boatThrow) return false;
    if (player.aboard && aboardKind === "dinghy") return exitDinghy();
    if (player.aboard) return false;
    const mid = playerCenter();
    const bx = pondBoat.x + pondBoat.w / 2;
    const by = pondBoat.y + pondBoat.h / 2;
    if (Math.hypot(mid.x - bx, mid.y - by) < 28) {
      player.aboard = true;
      aboardKind = "dinghy";
      seatPlayerOnDinghy();
      player.inWater = false;
      player.submerged = 0;
      player.moving = false;
      return true;
    }
    return false;
  }

  function tryStepOffAtBerth() {
    return exitBoatToDockT();
  }

  /**
   * Soft magnet into the slip only when approaching and not shoving off.
   * After releaseBoatFromBerth, berthIgnore blocks re-attach until you leave / cool down.
   */
  function updateBoatBerthSnap(dt, dx, dy) {
    const b = ownedBoat;
    if (!b || !boatBerth || boatThrow || !b.landed) return;
    if (b.berthIgnore > 0) b.berthIgnore = Math.max(0, b.berthIgnore - dt);
    clearBerthIfAway(b);
    const moving = dx !== 0 || dy !== 0;
    if (b.docked) {
      if (moving) {
        releaseBoatFromBerth(b, 1.5);
        return;
      }
      settleBoatInBerth(b);
      return;
    }
    if (b.berthIgnore > 0) return;
    if (!boatNearBerth(b, 28)) return;
    const tx = boatBerth.x;
    const ty = boatBerth.y;
    const ox = tx - b.x;
    const oy = ty - b.y;
    const dist = Math.hypot(ox, oy) || 0.001;
    const spd = Math.hypot(b.vx || 0, b.vy || 0);
    // Any shove away from the slip cancels the magnet (no speed gate).
    if (moving) {
      const toward = (ox * dx + oy * dy) / (dist * (Math.hypot(dx, dy) || 1));
      if (toward < 0.15) return;
    }
    // Coasting out after a shove — do not yank back.
    if (!moving && spd > 12) {
      const vToward = (ox * (b.vx || 0) + oy * (b.vy || 0)) / dist;
      if (vToward < 0) return;
    }
    if (spd > 48) return;
    const pull = Math.min(1, dt * (moving ? 2.2 : 4.2));
    const nx = b.x + ox * pull;
    const ny = b.y + oy * pull;
    if (boatHullOk(nx, b.y, b.w, b.h)) b.x = nx;
    if (boatHullOk(b.x, ny, b.w, b.h)) b.y = ny;
    b.vx = (b.vx || 0) * (1 - Math.min(1, dt * 5));
    b.vy = (b.vy || 0) * (1 - Math.min(1, dt * 5));
    b.tilt *= 1 - Math.min(1, dt * 8);
    if (dist < 2.2 && Math.hypot(b.vx || 0, b.vy || 0) < 10 && !moving) settleBoatInBerth(b);
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
    if (!player.aboard || aboardKind === "dinghy" || !ownedBoat) return false;
    if ((ownedBoat.docked || boatNearBerth(ownedBoat, 26)) && tryStepOffAtBerth()) return true;
    const x = player.x + ox;
    const y = player.y + oy;
    if (canStand(x, y) && canStand(x + 4, y + 6) && !isWaterAt(x + 2, y + 8)) {
      player.aboard = false;
      aboardKind = null;
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
    clearBerthIfAway(b);
    if (b.docked && !moving) {
      settleBoatInBerth(b);
      if (player.aboard) seatPlayerOnBoat();
      return;
    }
    if (b.docked && moving) {
      // Push toward the T-head → hop off and leave the skiff docked.
      if (dy < 0 && tryStepOffAtBerth()) return;
      releaseBoatFromBerth(b, 1.5);
    }
    const len = Math.hypot(dx, dy) || 1;
    const acc = 140;
    if (moving) {
      if (b.docked) releaseBoatFromBerth(b, 1.5);
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
    updateBoatBerthSnap(dt, dx, dy);
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
      face: boatBerth ? boatBerth.face : 1,
      kind: "skiff",
      landed: false,
      docked: false,
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
      if (boatBerth && boatNearBerth(ownedBoat, 18)) settleBoatInBerth(ownedBoat);
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
    if (scene !== "island" || !ownedBoat || boatThrow || aboardKind === "dinghy") return false;
    const mid = playerCenter();
    if (player.aboard) {
      // Enter always drops you on the T-head and parks the skiff.
      return exitBoatToDockT();
    }
    const bx = ownedBoat.x + ownedBoat.w / 2;
    const by = ownedBoat.y + ownedBoat.h / 2;
    const berthReach = ownedBoat.docked || boatNearBerth(ownedBoat, 30) ? 32 : 22;
    if (Math.hypot(mid.x - bx, mid.y - by) < berthReach) {
      player.aboard = true;
      aboardKind = "skiff";
      seatPlayerOnBoat();
      player.inWater = false;
      player.submerged = 0;
      if (boatNearBerth(ownedBoat, 30)) settleBoatInBerth(ownedBoat);
      checkBoatSpeedEnd();
      return true;
    }
    return false;
  }

  function putIdInBag(id) {
    if (!id || !ITEM_DEFS[id]) return false;
    const existing = inventory.findIndex((s) => s && s.id === id);
    if (existing >= 0) {
      if (inventory[existing].count >= ITEM_DEFS[id].max) {
        return playMode === "normal" ? addToSatchel(id) : false;
      }
      inventory[existing].count += 1;
      return true;
    }
    const empty = inventory.findIndex((s) => !s);
    if (empty < 0) return playMode === "normal" ? addToSatchel(id) : false;
    inventory[empty] = { id, count: 1 };
    return true;
  }

  function onEnter() {
    if (player.dead > 0) return;
    // Dinghy exit / skiff → T-head. Always first so nothing else eats Enter.
    if (player.aboard && aboardKind === "dinghy" && exitDinghy()) return;
    if (player.aboard && exitBoatToDockT()) return;
    // Cosmetics equip only in the locker menu — not in-game.
    if (isIndoor()) {
      dropHeld();
      return;
    }
    if (tryHarborDeal()) return;
    if (tryDinghyToggle()) return;
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
    if (!player.aboard || boatThrow) return false;
    if (aboardKind === "dinghy") {
      if (player.moving) return false;
      return Math.hypot(pondBoat.vx || 0, pondBoat.vy || 0) < 10;
    }
    if (!ownedBoat) return false;
    if (player.moving) return false;
    return Math.hypot(ownedBoat.vx || 0, ownedBoat.vy || 0) < 10;
  }

  function activeCraft() {
    if (!player.aboard) return null;
    if (aboardKind === "dinghy") return pondBoat;
    return ownedBoat;
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

  /** Pond table: commons + 25% blowfish + rare eel + 10% portal leech. Ocean odds untouched. */
  function rollPondCatch() {
    rodBaitId = null;
    const r = Math.random();
    if (r < 0.1) return "portal_leech";
    if (r < 0.22) return "waterfall_eel";
    if (r < 0.47) return "blowfish";
    return ["cod", "trout", "salmon"][irand(0, 2)];
  }

  function startPortalLeechFx() {
    leechGlow = { t: 0, dur: 2.6 };
    pondTip = "I wonder what that could be used for?";
    pondTipT = 3.2;
  }

  function tryCastRod() {
    if (serpent) return;
    if (scene !== "island" || !player.aboard || boatThrow) return;
    if (rod.phase !== "idle" || pickupAnims.length || player.dead > 0) return;
    const pondCast = aboardKind === "dinghy";
    if (pondCast) {
      if (!pondFishReady || !pondBoat) return;
    } else if (!ownedBoat) {
      return;
    }
    if (!boatIsStill()) return;
    rod.phase = "wait";
    rod.t = 0;
    rod.bit = false;
    rod.wait = pondCast ? rand(3.0, 7.0) : 13.5;
    rod.face = player.facing;
    rod.catchId = pondCast ? rollPondCatch() : rollBoatCatch();
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
    const pondCast = aboardKind === "dinghy";
    const id = rod.catchId || (pondCast ? rollPondCatch() : rollBoatCatch());
    const b = activeCraft();
    if (!b) {
      rodBaitId = null;
      return;
    }
    const fx = b.x + b.w / 2 + rod.face * (pondCast ? 10 : 16);
    const fy = b.y + b.h + (pondCast ? 4 : 6);
    rod.bit = false;
    if (!id) {
      emitSplash(fx, fy, 3);
      rodBaitId = null;
      return;
    }
    emitSplash(fx, fy, id === "megalodon" ? 16 : id === "portal_leech" ? 10 : 7);
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
    if (id === "blowfish") startBlowfishHearts();
    if (id === "portal_leech") startPortalLeechFx();
  }

  function updateRod(dt) {
    if (chestTalk > 0) chestTalk = Math.max(0, chestTalk - dt);
    if (pondTipT > 0) pondTipT = Math.max(0, pondTipT - dt);
    if (leechGlow) {
      leechGlow.t += dt;
      if (leechGlow.t >= leechGlow.dur) leechGlow = null;
    }
    if (rod.phase === "idle") return;
    const sharkFight =
      isSharkishCatch(rod.catchId) &&
      rod.phase === "wait" &&
      (rod.catchId === "megalodon" || rod.t >= rod.wait - 7);
    const pondStill = aboardKind === "dinghy";
    if (
      !player.aboard ||
      (!pondStill && player.moving) ||
      (rod.phase === "wait" && !sharkFight && !boatIsStill())
    ) {
      rod.phase = "idle";
      rod.catchId = null;
      rod.tugLeft = 0;
      rodBaitId = null;
      return;
    }
    if (!pondStill && (rod.phase === "wait" || rod.phase === "reel")) updateSharkTug(dt);
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
    if (cosSelect) return;
    const stack = inventory[heldSlot];
    if (!stack) return;
    // Cosmetics live in the locker — never drop from the bag.
    if (isCosmeticId(stack.id)) {
      grantCosmetic(stack.id);
      inventory[heldSlot] = null;
      cosTip = "MOVED TO LOCKER";
      cosTipT = 1.4;
      return;
    }
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
    if (scene === "vein" && vein && vein.tryInteract()) return;
    if (cosSelect === "back" && cosmetics.back === "cloak") {
      if (vein && vein.blockCloak()) {
        cosTip = "CLOAK WITHERS HERE";
        cosTipT = 1.8;
        cloakOn = false;
        return;
      }
      cloakOn = !cloakOn;
      return;
    }
    const stack = !cosSelect ? inventory[heldSlot] : null;
    if (!stack) {
      if (cosmetics.back === "cloak") {
        if (vein && vein.blockCloak()) {
          cosTip = "CLOAK WITHERS HERE";
          cosTipT = 1.8;
          cloakOn = false;
          return;
        }
        cloakOn = !cloakOn;
      }
      return;
    }
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
      if (vein && vein.blockCloak()) {
        cosTip = "CLOAK WITHERS HERE";
        cosTipT = 1.8;
        cloakOn = false;
        return;
      }
      cloakOn = !cloakOn;
      return;
    }
    if (String(stack.id).indexOf("potion_") === 0) {
      if (scene === "vein" && vein && vein.drinkPotion(stack.id)) {
        takeOneFrom(inventory, stack.id);
        useFx = { t: 0, id: stack.id };
        return;
      }
      if (stack.id === "potion_red") {
        player.hp = Math.min(MAX_HP, player.hp + 3);
        takeOneFrom(inventory, stack.id);
        useFx = { t: 0, id: stack.id };
        return;
      }
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

  /** Owner (Henri) — red nametag theme on boards / chat / HUD. */
  function isOwnerName(name) {
    const n = String(name || "")
      .toUpperCase()
      .replace(/[^A-Z0-9 ]/g, "")
      .replace(/\s+/g, " ")
      .trim();
    if (!n) return false;
    if (n === "HENRI" || n === "HENRI P") return true;
    if (n.indexOf("HENRI ") === 0) return true;
    const api = lbApi();
    if (api && typeof api.namesFuzzyMatch === "function") {
      return api.namesFuzzyMatch(n, "HENRI") || api.namesFuzzyMatch(n, "HENRI P");
    }
    return false;
  }

  // Compact gold/wood pixel chip — used for NEW and player nametags.
  // theme "owner" = red (Henri / game owner).
  function drawChipTag(label, x, y, theme) {
    const s = String(label || "").toUpperCase();
    const tw = pixTextWidth(s);
    const owner = theme === "owner";
    px(x - 1, y - 1, tw + 3, 9, owner ? "#2a0808" : "#3a2414");
    px(x, y, tw + 1, 7, owner ? "#9a2420" : "#8a5a18");
    drawPixText(s, x + 1, y, owner ? "#ffc8b8" : "#ffe27a");
    return tw + 4;
  }

  function drawNameTag(name, x, y, maxLen) {
    const n = String(name || "?").slice(0, maxLen == null ? 10 : maxLen);
    return drawChipTag(n, x, y, isOwnerName(n) ? "owner" : null);
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
    const showLv = o.level != null ? o.level | 0 : careerLevelForName(name);
    let cx = x;
    if (isOnline) cx += drawOnlineDot(cx, y);
    if (showLv > 0) cx += drawLevelBadge(showLv, cx, y) + 2;
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

  function landReady() {
    return !!(landChunks && landChunks.length);
  }

  /** World-space fill that spans landChunks (coords match old single landCanvas). */
  function landFillRect(wx, wy, w, h, col) {
    if (!landReady()) return;
    const x = wx | 0;
    const y = wy | 0;
    const rw = w | 0;
    const rh = h | 0;
    if (rw <= 0 || rh <= 0) return;
    for (let i = 0; i < landChunks.length; i++) {
      const ch = landChunks[i];
      const x0 = Math.max(x, ch.x0);
      const x1 = Math.min(x + rw, ch.x0 + ch.w);
      if (x1 <= x0) continue;
      ch.g.fillStyle = col;
      ch.g.fillRect(x0 - ch.x0, y, x1 - x0, rh);
    }
  }

  /** Shim 2d context so existing pxi/paint* helpers keep using world coordinates. */
  function landGfx() {
    const shim = {
      imageSmoothingEnabled: false,
      fillStyle: WATER_BLUE,
      fillRect(x, y, w, h) {
        landFillRect(x, y, w, h, shim.fillStyle);
      },
    };
    return shim;
  }

  function initLandChunks() {
    landChunks = [];
    landCanvas = null;
    for (let x0 = 0; x0 < WORLD_W; x0 += LAND_CHUNK_W) {
      const w = Math.min(LAND_CHUNK_W, WORLD_W - x0);
      const c = document.createElement("canvas");
      c.width = w;
      c.height = WORLD_H;
      if (c.width !== w || c.height !== WORLD_H) continue;
      const g = c.getContext("2d");
      if (!g) continue;
      g.imageSmoothingEnabled = false;
      g.fillStyle = WATER_BLUE;
      g.fillRect(0, 0, w, WORLD_H);
      landChunks.push({ canvas: c, g, x0, w });
    }
    landCanvas = landChunks.length ? landChunks[0].canvas : null;
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

    initLandChunks();
    const g = landGfx();

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
          landFillRect(wx0, wy0, TILE, TILE, WATER_BLUE);
          continue;
        }

        if (fullyWater && !riverish && wy0 >= sMax + 40) {
          landFillRect(wx0, wy0, TILE, TILE, WATER_DEEP);
          continue;
        }

        for (let ly = 0; ly < TILE; ly++) {
          for (let lx = 0; lx < TILE; lx++) {
            landFillRect(wx0 + lx, wy0 + ly, 1, 1, landColor(wx0 + lx, wy0 + ly));
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

  function utcDayKey() {
    const d = new Date();
    return d.getUTCFullYear() + "-" + String(d.getUTCMonth() + 1).padStart(2, "0") + "-" + String(d.getUTCDate()).padStart(2, "0");
  }

  function hashStr(s) {
    let h = 2166136261;
    for (let i = 0; i < s.length; i++) {
      h ^= s.charCodeAt(i);
      h = Math.imul(h, 16777619);
    }
    return (h >>> 0) / 4294967296;
  }

  function paintStoneBlock(g, x, y, w, h, shade) {
    const base = shade || "#6a6258";
    const hi = "#8a8278";
    const lo = "#3a3834";
    pxi(g, x, y, w, h, base);
    pxi(g, x, y, w, 1, hi);
    pxi(g, x, y + h - 1, w, 1, lo);
    pxi(g, x, y, 1, h, hi);
    pxi(g, x + w - 1, y, 1, h, lo);
  }

  function bakeTempleInterior() {
    templeCanvas = document.createElement("canvas");
    templeCanvas.width = TEMPLE_W;
    templeCanvas.height = TEMPLE_H;
    const g = templeCanvas.getContext("2d");
    g.imageSmoothingEnabled = false;
    pxi(g, 0, 0, TEMPLE_W, TEMPLE_H, "#1a1814");
    for (let y = 10; y < TEMPLE_H - 10; y += 8) {
      for (let x = 10; x < TEMPLE_W - 10; x += 8) {
        const n = hash(x + 3, y + 7);
        let col = ((x / 8) | 0) % 2 === ((y / 8) | 0) % 2 ? "#4a463e" : "#3a3834";
        if (n > 0.92) col = "#5a564e";
        pxi(g, x, y, 8, 8, col);
      }
    }

    // Huge recursive-backtracker maze on an odd/even grid (no traps/hazards).
    // Each grid cell is 16px so corridors fit the 8x14 player.
    const U = 16;
    const doorBand = 34;
    const gx0 = 14;
    const gy0 = 14;
    const maxGW = ((TEMPLE_W - gx0 - 14) / U) | 0;
    const maxGH = ((TEMPLE_H - gy0 - doorBand) / U) | 0;
    // Maze rooms on odd indices; walls on even
    let roomsC = Math.max(11, ((maxGW - 1) / 2) | 0);
    let roomsR = Math.max(9, ((maxGH - 1) / 2) | 0);
    const gw = roomsC * 2 + 1;
    const gh = roomsR * 2 + 1;
    const solid = [];
    for (let r = 0; r < gh; r++) {
      solid[r] = [];
      for (let c = 0; c < gw; c++) solid[r][c] = true;
    }
    for (let r = 0; r < roomsR; r++) {
      for (let c = 0; c < roomsC; c++) solid[r * 2 + 1][c * 2 + 1] = false;
    }
    const visited = [];
    for (let r = 0; r < roomsR; r++) {
      visited[r] = [];
      for (let c = 0; c < roomsC; c++) visited[r][c] = false;
    }
    function shuffleDirs(c, r, salt) {
      const dirs = [
        [1, 0],
        [-1, 0],
        [0, 1],
        [0, -1],
      ];
      for (let i = dirs.length - 1; i > 0; i--) {
        const j = (hash(c * 47 + r * 91 + i * 13 + salt, i * 17 + roomsC) * (i + 1)) | 0;
        const tmp = dirs[i];
        dirs[i] = dirs[j];
        dirs[j] = tmp;
      }
      return dirs;
    }
    // Iterative DFS carve — many rooms, avoid call-stack limits
    const entrC = (roomsC / 2) | 0;
    const entrR = roomsR - 1;
    const stack = [[entrC, entrR]];
    visited[entrR][entrC] = true;
    let salt = 0;
    while (stack.length) {
      const cur = stack[stack.length - 1];
      const c = cur[0];
      const r = cur[1];
      const dirs = shuffleDirs(c, r, salt++);
      let stepped = false;
      for (let i = 0; i < dirs.length; i++) {
        const nc = c + dirs[i][0];
        const nr = r + dirs[i][1];
        if (nc < 0 || nr < 0 || nc >= roomsC || nr >= roomsR || visited[nr][nc]) continue;
        solid[r * 2 + 1 + dirs[i][1]][c * 2 + 1 + dirs[i][0]] = false;
        visited[nr][nc] = true;
        stack.push([nc, nr]);
        stepped = true;
        break;
      }
      if (!stepped) stack.pop();
    }
    // Open south wall of entrance room toward the foyer / EXIT
    solid[gh - 1][entrC * 2 + 1] = false;

    // Farthest room → jade pedestal
    const dist = [];
    for (let r = 0; r < roomsR; r++) {
      dist[r] = [];
      for (let c = 0; c < roomsC; c++) dist[r][c] = -1;
    }
    const q = [[entrC, entrR]];
    dist[entrR][entrC] = 0;
    let qi = 0;
    let bestC = entrC;
    let bestR = entrR;
    let bestD = 0;
    while (qi < q.length) {
      const cur = q[qi++];
      const c = cur[0];
      const r = cur[1];
      const d0 = dist[r][c];
      if (d0 > bestD) {
        bestD = d0;
        bestC = c;
        bestR = r;
      }
      const dirs = [
        [1, 0],
        [-1, 0],
        [0, 1],
        [0, -1],
      ];
      for (let i = 0; i < dirs.length; i++) {
        const nc = c + dirs[i][0];
        const nr = r + dirs[i][1];
        if (nc < 0 || nr < 0 || nc >= roomsC || nr >= roomsR || dist[nr][nc] >= 0) continue;
        const wr = r * 2 + 1 + dirs[i][1];
        const wc = c * 2 + 1 + dirs[i][0];
        if (solid[wr][wc]) continue;
        dist[nr][nc] = d0 + 1;
        q.push([nc, nr]);
      }
    }

    templeSolids.length = 0;
    function addWall(x, y, w, h) {
      if (w <= 0 || h <= 0) return;
      paintStoneBlock(g, x, y, w, h, (x + y) & 2 ? "#6a6258" : "#5a564e");
      templeSolids.push({ x, y, w, h });
    }

    // Merge solid grid cells into horizontal runs for fewer solids
    for (let r = 0; r < gh; r++) {
      let c = 0;
      while (c < gw) {
        if (!solid[r][c]) {
          c++;
          continue;
        }
        let c2 = c + 1;
        while (c2 < gw && solid[r][c2]) c2++;
        addWall(gx0 + c * U, gy0 + r * U, (c2 - c) * U, U);
        c = c2;
      }
    }

    // Outer frame + foyer band under maze
    addWall(0, 0, TEMPLE_W, 10);
    addWall(0, 0, 10, TEMPLE_H);
    addWall(TEMPLE_W - 10, 0, 10, TEMPLE_H);
    const mazeBottom = gy0 + gh * U;
    const entrPX = gx0 + (entrC * 2 + 1) * U;
    const doorX = entrPX + ((U - 20) / 2) | 0;
    // Foyer floor strip from maze mouth to EXIT
    pxi(g, entrPX, mazeBottom - U, U, TEMPLE_H - (mazeBottom - U) - 10, "#4a463e");
    addWall(0, TEMPLE_H - 10, doorX, 10);
    addWall(doorX + 20, TEMPLE_H - 10, TEMPLE_W - (doorX + 20), 10);
    // Side foyer walls leaving the mouth open
    addWall(10, mazeBottom, entrPX - 10, TEMPLE_H - mazeBottom - 10);
    addWall(entrPX + U, mazeBottom, TEMPLE_W - 10 - (entrPX + U), TEMPLE_H - mazeBottom - 10);

    const px0 = gx0 + (bestC * 2 + 1) * U + ((U - 16) / 2) | 0;
    const py0 = gy0 + (bestR * 2 + 1) * U + ((U - 12) / 2) | 0;
    templePedestal = { x: px0, y: py0, w: 16, h: 12 };
    paintStoneBlock(g, templePedestal.x, templePedestal.y + 4, 16, 8, "#5a564e");
    pxi(g, templePedestal.x + 2, templePedestal.y, 12, 6, "#3a8a4a");
    pxi(g, templePedestal.x + 4, templePedestal.y + 1, 8, 4, "#4ec86a");
    pxi(g, templePedestal.x + 6, templePedestal.y + 2, 4, 2, "#b8f0c8");

    // Marked EXIT so players aren't soft-locked
    pxi(g, doorX - 2, TEMPLE_H - 18, 24, 4, "#c9a227");
    pxi(g, doorX, TEMPLE_H - 14, 20, 14, "#100c0a");
    pxi(g, doorX + 2, TEMPLE_H - 12, 16, 2, "#5a564e");
    withInk(g, () => drawPixText("EXIT", doorX + 2, TEMPLE_H - 28, "#c9a227"));
    templeExit = { x: doorX, y: TEMPLE_H - 14, w: 20, h: 14 };
  }

  function bakeHubInterior() {
    hubCanvas = document.createElement("canvas");
    hubCanvas.width = HUB_W;
    hubCanvas.height = HUB_H;
    const g = hubCanvas.getContext("2d");
    g.imageSmoothingEnabled = false;
    pxi(g, 0, 0, HUB_W, HUB_H, "#2a2418");
    for (let y = 14; y < HUB_H - 10; y += 4) {
      for (let x = 12; x < HUB_W - 12; x += 4) {
        const n = hash(x * 3, y * 5);
        let col = (x + y) & 4 ? "#6a5a3a" : "#5a4a2e";
        if (n > 0.94) col = "#7a6a48";
        pxi(g, x, y, 4, 4, col);
      }
    }
    paintStoneBlock(g, 0, 0, HUB_W, 12, "#4a463e");
    paintStoneBlock(g, 0, 0, 12, HUB_H, "#4a463e");
    paintStoneBlock(g, HUB_W - 12, 0, 12, HUB_H, "#4a463e");
    paintStoneBlock(g, 0, HUB_H - 12, HUB_W, 12, "#3a3834");
    // Open hangout plaza — fountain + planters (no duel/duo props)
    const fx = ((HUB_W - 32) / 2) | 0;
    const fy = ((HUB_H - 40) / 2) | 0;
    pxi(g, fx, fy, 32, 32, "#3a6a8a");
    pxi(g, fx + 4, fy + 4, 24, 24, "#5a9aba");
    pxi(g, fx + 10, fy + 10, 12, 12, "#c8e8f8");
    pxi(g, fx + 14, fy - 4, 4, 8, "#8ab0c4");
    pxi(g, 28, 36, 18, 10, "#3a5a28");
    pxi(g, 32, 30, 10, 8, "#4a7a34");
    pxi(g, HUB_W - 46, 36, 18, 10, "#3a5a28");
    pxi(g, HUB_W - 42, 30, 10, 8, "#4a7a34");
    pxi(g, 28, HUB_H - 56, 18, 10, "#3a5a28");
    pxi(g, HUB_W - 46, HUB_H - 56, 18, 10, "#3a5a28");
    withInk(g, () => drawPixText("PLAZA", ((HUB_W - 40) / 2) | 0, 20, "#f3e2c4"));
    hubSolids.length = 0;
    hubSolids.push({ x: 0, y: 0, w: HUB_W, h: 12 });
    hubSolids.push({ x: 0, y: 0, w: 12, h: HUB_H });
    hubSolids.push({ x: HUB_W - 12, y: 0, w: 12, h: HUB_H });
    hubSolids.push({ x: 0, y: HUB_H - 12, w: ((HUB_W - 28) / 2) | 0, h: 12 });
    hubSolids.push({
      x: (((HUB_W - 28) / 2) | 0) + 28,
      y: HUB_H - 12,
      w: HUB_W - ((((HUB_W - 28) / 2) | 0) + 28),
      h: 12,
    });
    hubSolids.push({ x: fx, y: fy, w: 32, h: 32 });
    const doorX = ((HUB_W - 28) / 2) | 0;
    pxi(g, doorX, HUB_H - 16, 28, 16, "#100c0a");
    withInk(g, () => drawPixText("EXIT", doorX + 4, HUB_H - 28, "#c9a227"));
    hubExit = { x: doorX, y: HUB_H - 16, w: 28, h: 16 };
  }

  /** Shared stair geometry so the painted mouth and the walk-in rect stay the same. */
  function templeStairMetrics(w, h) {
    const tiers = 9;
    const baseH = h - 18;
    const tierH = Math.max(4, (baseH / tiers) | 0);
    const inset = Math.max(3, ((w / 2 - 18) / tiers) | 0);
    const stairW = Math.max(12, (w * 0.22) | 0);
    const mid = (w / 2) | 0;
    const stairL = mid - ((stairW / 2) | 0);
    const stairTop = h - 6 - tiers * tierH;
    const stairBot = h - 6;
    return {
      tiers,
      tierH,
      inset,
      stairW,
      mid,
      stairL,
      stairR: stairL + stairW,
      stairTop,
      stairBot,
    };
  }

  /** Dark opening at the foot of the central stairs, in temple-local pixels. */
  function templeEntranceLocal(w, h) {
    const m = templeStairMetrics(w, h);
    const doorH = 16;
    return { x: m.stairL, y: m.stairBot - doorH, w: m.stairW, h: doorH };
  }

  function paintMayanTemple(g, x, y, w, h, door) {
    // Mesoamerican step pyramid — weathered gray/blue stone, central stairs, top sanctuary
    const metrics = templeStairMetrics(w, h);
    const tiers = metrics.tiers;
    const tierH = metrics.tierH;
    const inset = metrics.inset;
    const stairW = metrics.stairW;
    const stairL = metrics.stairL;
    const stairR = metrics.stairR;
    const stairTop = metrics.stairTop;
    const stairBot = metrics.stairBot;

    // Ground strip (grass / soil)
    pxi(g, x - 3, y + h - 3, w + 6, 3, "#2a4a24");
    pxi(g, x - 2, y + h - 5, w + 4, 2, "#3a2a18");

    for (let t = 0; t < tiers; t++) {
      const ix = t * inset;
      const iy = h - 6 - (t + 1) * tierH;
      const iw = w - ix * 2;
      const ih = tierH + 1;
      const lit = "#6a7278";
      const midCol = "#4a5258";
      const shade = "#2e343c";
      // Main tier face
      paintStoneBlock(g, x + ix, y + iy, iw, ih, t & 1 ? midCol : "#545c64");
      // Left highlight / right shade for volume
      pxi(g, x + ix, y + iy, 2, ih, lit);
      pxi(g, x + ix + iw - 3, y + iy, 3, ih, shade);
      // Top ledge lip
      pxi(g, x + ix, y + iy, iw, 1, lit);
      pxi(g, x + ix + 1, y + iy + ih - 1, iw - 2, 1, shade);
      // Mortar cracks
      for (let ly = 2; ly < ih - 1; ly += 3) {
        pxi(g, x + ix + 3, y + iy + ly, iw - 6, 1, "#3a4048");
      }
      // Moss tufts on ledges
      if (t > 1 && hash(t, 17) > 0.35) {
        const mx = x + ix + 4 + ((hash(t, 3) * (iw - 10)) | 0);
        pxi(g, mx, y + iy + 1, 3, 2, "#2a5a28");
        pxi(g, mx + 1, y + iy, 1, 1, "#3a7a34");
      }
    }

    // Central stairway with thin balustrades
    for (let sy = stairTop; sy < stairBot; sy += 2) {
      const row = ((sy - stairTop) / 2) | 0;
      pxi(g, x + stairL, y + sy, stairW, 2, row & 1 ? "#7a8288" : "#5a6268");
      pxi(g, x + stairL, y + sy, stairW, 1, "#8a9298");
    }
    // Balustrades
    pxi(g, x + stairL - 2, y + stairTop, 2, stairBot - stairTop, "#3a4048");
    pxi(g, x + stairR, y + stairTop, 2, stairBot - stairTop, "#2a3038");
    pxi(g, x + stairL - 2, y + stairTop - 1, 2, 2, "#6a7278");
    pxi(g, x + stairR, y + stairTop - 1, 2, 2, "#4a5258");

    // Top sanctuary (cella) with pillars + doorway
    const platY = y + stairTop - 2;
    const platW = Math.max(22, w - tiers * inset * 2 - 4);
    const platX = x + ((w - platW) / 2) | 0;
    const cellH = 14;
    const cellW = Math.max(16, platW - 6);
    const cellX = x + ((w - cellW) / 2) | 0;
    const cellY = platY - cellH;
    paintStoneBlock(g, platX, platY, platW, 3, "#5a6268");
    paintStoneBlock(g, cellX, cellY, cellW, cellH, "#4a5258");
    pxi(g, cellX, cellY, cellW, 1, "#7a8288");
    pxi(g, cellX + cellW - 2, cellY, 2, cellH, "#2e343c");
    // Corner pillars
    pxi(g, cellX - 1, cellY - 2, 3, cellH + 2, "#6a7278");
    pxi(g, cellX + cellW - 2, cellY - 2, 3, cellH + 2, "#3a4048");
    pxi(g, cellX - 1, cellY - 3, 3, 2, "#8a9298");
    pxi(g, cellX + cellW - 2, cellY - 3, 3, 2, "#5a6268");
    // Flat roof ledge
    pxi(g, cellX - 2, cellY - 4, cellW + 4, 2, "#6a7278");
    pxi(g, cellX - 1, cellY - 5, cellW + 2, 1, "#8a9298");
    // Sanctuary doorway (dark)
    const sDoorW = Math.max(6, ((cellW * 0.38) | 0));
    const sDoorX = cellX + ((cellW - sDoorW) / 2) | 0;
    const sDoorH = cellH - 3;
    pxi(g, sDoorX - 1, cellY + 2, sDoorW + 2, sDoorH + 1, "#1a1814");
    pxi(g, sDoorX, cellY + 3, sDoorW, sDoorH, "#0a0806");

    // Vine streaks down the faces (medieval jungle ruin)
    for (let i = 0; i < 8; i++) {
      const side = i < 4 ? 0 : 1;
      const vx =
        side === 0
          ? x + 3 + ((hash(i, 9) * (stairL - 8)) | 0)
          : x + stairR + 4 + ((hash(i, 11) * (w - stairR - 10)) | 0);
      const vy = y + 20 + ((hash(i, 5) * (h - 36)) | 0);
      const vh = 8 + ((hash(i, 13) * 22) | 0);
      pxi(g, vx, vy, 2, vh, "#2a5a28");
      pxi(g, vx + 1, vy + 2, 1, vh - 3, "#3a7a34");
      if (hash(i, 7) > 0.4) pxi(g, vx - 1, vy + 4, 3, 2, "#4a8a38");
    }

    // Walk-in mouth matches the rect placeTemple stored on templeDoor.
    const mouth = door
      ? { x: door.x - x, y: door.y - y, w: door.w, h: door.h }
      : templeEntranceLocal(w, h);
    const dx = mouth.x;
    const dy = mouth.y;
    const dw = mouth.w;
    const dh = mouth.h;
    // Stone jambs sit outside the opening; the black rect is the door itself.
    pxi(g, x + dx - 2, y + dy - 2, 2, dh + 2, "#3a4048");
    pxi(g, x + dx + dw, y + dy - 2, 2, dh + 2, "#2a3038");
    pxi(g, x + dx - 2, y + dy - 3, dw + 4, 3, "#5a6268");
    pxi(g, x + dx, y + dy - 3, dw, 1, "#8a9298");
    pxi(g, x + dx, y + dy, dw, dh, "#080604");
    pxi(g, x + dx + 1, y + dy + 1, dw - 2, 1, "#1a1814");
    pxi(g, x + dx + dw - 4, y + dy + ((dh / 2) | 0), 1, 1, "#c9a227");
  }

  function ensureVein() {
    if (vein) return vein;
    if (typeof IsleVeinBuild !== "function") return null;
    vein = IsleVeinBuild({
      TILE,
      MAX_HP,
      player,
      camera,
      wandBolts,
      hash,
      irand,
      pxi,
      withInk,
      drawPixText,
      playerHits,
      hitPad,
      hurtPlayer,
      addToInventory,
      gainXp,
      time: () => time,
      viewW: () => viewW,
      viewH: () => viewH,
      uiW: () => (canvas.width / SCALE_UI) | 0,
      ctx: () => ctx,
      px,
      getScene: () => scene,
      setScene: (s) => {
        scene = s;
      },
      getWandCool: () => wandCool,
      setWandCool: (v) => {
        wandCool = v;
      },
      setCloak: (v) => {
        cloakOn = !!v;
      },
      shake: (n) => {
        shake = Math.max(shake, n | 0);
      },
      flashTip: (msg, dur) => {
        cosTip = String(msg || "");
        cosTipT = dur != null ? dur : 2.2;
      },
      useFxWand: () => {
        useFx = { t: 0, id: "wand" };
      },
      northCliffY,
      restShoreY,
      clearSceneLoot: (sc) => {
        for (let i = loot.length - 1; i >= 0; i--) {
          if ((loot[i].scene || "island") === sc) loot.splice(i, 1);
        }
      },
      spawnLoot: (id, x, y, sc) => {
        if (!ITEM_DEFS[id]) return;
        loot.push({
          id,
          x: (x | 0) - 2,
          y: (y | 0) - 2,
          taken: false,
          born: waveCycle,
          life: Infinity,
          ignoreUntil: time + 0.15,
          scene: sc || "vein",
        });
      },
    });
    return vein;
  }

  function placeMountainsIntoWorld() {
    const v = ensureVein();
    if (!v) return;
    const painted = v.placeMountains(
      bldgCanvas,
      bldgOX,
      bldgOY,
      islandSolids,
      walkPads,
      keepouts,
      trees,
      palms
    );
    if (painted && painted.canvas) {
      bldgCanvas = painted.canvas;
      bldgOX = painted.ox;
      bldgOY = painted.oy;
    }
    veinDoor = v.getDoor();
    veinIslandExit = v.getIslandExit();
  }

  // Debug helpers for local playtests (mountain / Hollow Vein).
  window.__isleVein = {
    door: () => veinDoor,
    state: () =>
      vein
        ? {
            scene,
            room: vein.getRoom(),
            player: { x: player.x, y: player.y },
            playMode,
            uiScreen,
            fadeMode,
          }
        : { scene, vein: false },
    forceRoom: (r) => {
      if (!vein) return false;
      scene = "vein";
      player.x = r * vein.ROOM_W + 28;
      player.y = vein.ROOM_H - 42;
      // poke internal room via enter-like path
      vein.onEnter();
      // after onEnter resets to 0 — use transition by walking
      return true;
    },
    gotoDoor: () => {
      if (!veinDoor) return null;
      scene = "island";
      player.aboard = false;
      player.x = veinDoor.x + 2;
      player.y = veinDoor.y + veinDoor.h + 2;
      player.dead = 0;
      player.hp = MAX_HP;
      camera.x = player.x + player.w / 2 - viewW / 2;
      camera.y = player.y + player.h / 2 - viewH * 0.36;
      clampCamera();
      return { x: player.x, y: player.y, door: veinDoor };
    },
    enter: () => {
      ensureVein();
      if (!vein) return false;
      playMode = "normal";
      uiScreen = null;
      guideOpen = false;
      if (!ownsItem("wand") && canTake("wand")) addToInventory("wand");
      beginFade("vein", { x: 28, y: (vein.ROOM_H || 152) - 42 });
      return true;
    },
    giveKit: () => {
      playMode = "normal";
      uiScreen = null;
      ["wand", "potion_red", "potion_blue", "potion_fury"].forEach((id) => {
        if (canTake(id)) addToInventory(id);
      });
      return inventory.filter(Boolean).map((s) => s.id);
    },
  };

  function placeTemple(pier) {
    // Deep jungle — far east of the dock, high inland toward the north cliff
    const tw = 104;
    const th = 92;
    const midC = 318;
    const midX = midC * TILE;
    const rest = restShoreY(midX);
    const cliff = northCliffY(midX);
    const depth = Math.max(80, rest - cliff);
    const tx = midX - ((tw / 2) | 0);
    const ty = cliff + Math.max(48, (depth * 0.16) | 0);
    const temple = { x: tx, y: ty, w: tw, h: th };
    const mouth = templeEntranceLocal(temple.w, temple.h);
    const tDoor = {
      x: temple.x + mouth.x,
      y: temple.y + mouth.y,
      w: mouth.w,
      h: mouth.h,
    };

    islandSolids.push({ x: temple.x, y: temple.y, w: temple.w, h: mouth.y });
    islandSolids.push({ x: temple.x, y: tDoor.y, w: tDoor.x - temple.x, h: tDoor.h });
    islandSolids.push({
      x: tDoor.x + tDoor.w,
      y: tDoor.y,
      w: temple.x + temple.w - (tDoor.x + tDoor.w),
      h: tDoor.h,
    });

    walkPads.push({ x: tDoor.x - 4, y: tDoor.y, w: tDoor.w + 8, h: tDoor.h + 18 });
    keepouts.push({ x: temple.x - 14, y: temple.y - 10, w: temple.w + 28, h: temple.h + 24 });

    // Hitbox is the same rectangle as the black stair mouth.
    templeDoor = { x: tDoor.x, y: tDoor.y, w: tDoor.w, h: tDoor.h };
    templeIslandExit = {
      x: tDoor.x + (((tDoor.w - 8) / 2) | 0),
      y: tDoor.y + tDoor.h + 2,
    };

    const pad = 16;
    const nx0 = Math.min(bldgOX, temple.x - pad);
    const ny0 = Math.min(bldgOY, temple.y - 8);
    const nx1 = Math.max(bldgOX + (bldgCanvas ? bldgCanvas.width : 0), temple.x + temple.w + pad);
    const ny1 = Math.max(bldgOY + (bldgCanvas ? bldgCanvas.height : 0), temple.y + temple.h + 12);
    const nc = document.createElement("canvas");
    nc.width = Math.max(1, nx1 - nx0);
    nc.height = Math.max(1, ny1 - ny0);
    const ng = nc.getContext("2d");
    ng.imageSmoothingEnabled = false;
    if (bldgCanvas) ng.drawImage(bldgCanvas, bldgOX - nx0, bldgOY - ny0);
    paintMayanTemple(ng, temple.x - nx0, temple.y - ny0, temple.w, temple.h, {
      x: tDoor.x - nx0,
      y: tDoor.y - ny0,
      w: tDoor.w,
      h: tDoor.h,
    });
    bldgOX = nx0;
    bldgOY = ny0;
    bldgCanvas = nc;

    bakeTempleInterior();
    bakeHubInterior();
    spawnDailyIdol(temple);
    clearTreesNearDoor(temple, tDoor);
    plantTempleJungle(temple, tDoor);
  }

  function clearTreesNearDoor(temple, door) {
    const zx0 = door.x - 10;
    const zx1 = door.x + door.w + 10;
    const zy0 = door.y - 4;
    const zy1 = door.y + 28;
    for (let i = trees.length - 1; i >= 0; i--) {
      const t = trees[i];
      if (t.x > zx0 && t.x < zx1 && t.y > zy0 && t.y < zy1) trees.splice(i, 1);
      else if (t.x > temple.x - 4 && t.x < temple.x + temple.w + 4 && t.y > temple.y - 4 && t.y < temple.y + temple.h + 4) {
        trees.splice(i, 1);
      }
    }
    for (let i = palms.length - 1; i >= 0; i--) {
      const p = palms[i];
      if (p.x > zx0 && p.x < zx1 && p.y > zy0 && p.y < zy1) palms.splice(i, 1);
      else if (p.x > temple.x - 4 && p.x < temple.x + temple.w + 4 && p.y > temple.y - 4 && p.y < temple.y + temple.h + 4) {
        palms.splice(i, 1);
      }
    }
  }

  function plantTempleJungle(temple, door) {
    // Dense tree/palm ring so the temple reads as deep jungle, not beach
    for (let i = 0; i < 84; i++) {
      const ang = (i / 84) * Math.PI * 2 + hash(i, 41) * 0.4;
      const rad = 26 + hash(i * 3, 7) * 52;
      const x = (temple.x + temple.w / 2 + Math.cos(ang) * rad) | 0;
      const y = (temple.y + temple.h / 2 + Math.sin(ang) * rad * 0.7) | 0;
      if (x > door.x - 14 && x < door.x + door.w + 14 && y > door.y - 6 && y < door.y + 30) continue;
      if (x > temple.x - 2 && x < temple.x + temple.w + 2 && y > temple.y - 2 && y < temple.y + temple.h + 2) continue;
      if (y >= restShoreY(x) - 8) continue;
      if (y <= northCliffY(x) + 10) continue;
      if (inRiverWater(x, y)) continue;
      if (hash(i, 19) > 0.55) {
        palms.push({ x, y, s: 0.9 + hash(i, 5) * 0.35 });
      } else {
        trees.push({
          x,
          y,
          s: 0.85 + hash(i, 11) * 0.45,
          kind: hash(i, 23) > 0.6 ? "pine" : "leaf",
        });
      }
    }
    // Extra palms south of temple toward the path
    for (let i = 0; i < 14; i++) {
      const x = temple.x - 20 + ((hash(i, 61) * (temple.w + 40)) | 0);
      const y = temple.y + temple.h + 8 + ((hash(i, 67) * 36) | 0);
      if (x > door.x - 12 && x < door.x + door.w + 12 && y < door.y + 26) continue;
      if (y >= restShoreY(x) - 6) continue;
      palms.push({ x, y, s: 0.95 + hash(i, 3) * 0.3 });
    }
  }

  function paintRuinStone(g, x, y, w, h, base) {
    const lit = "#8a8478";
    const mid = base || "#5a564e";
    const shade = "#2e2c28";
    pxi(g, x, y, w, h, mid);
    pxi(g, x, y, w, 1, lit);
    pxi(g, x, y + h - 1, w, 1, shade);
    pxi(g, x, y, 1, h, lit);
    pxi(g, x + w - 1, y, 1, h, shade);
    for (let i = 0; i < w * h; i += 7) {
      const px0 = x + (i % w);
      const py0 = y + (((i / w) | 0) % h);
      if (hash(px0 + 3, py0 + 9) > 0.78) pxi(g, px0, py0, 1, 1, shade);
      else if (hash(px0, py0) > 0.9) pxi(g, px0, py0, 1, 1, lit);
    }
  }

  function paintRuinColumn(g, x, y, h) {
    // Fluted classical column with square base + carved capital
    paintRuinStone(g, x - 1, y + h - 6, 10, 6, "#4a463e");
    paintRuinStone(g, x, y + 8, 8, h - 14, "#6a6458");
    for (let fy = 10; fy < h - 8; fy += 2) {
      pxi(g, x + 2, y + fy, 1, 1, "#8a8478");
      pxi(g, x + 5, y + fy, 1, 1, "#3a3834");
    }
    paintRuinStone(g, x - 2, y, 12, 8, "#5a564e");
    pxi(g, x, y + 2, 8, 1, "#2e2c28");
    pxi(g, x + 1, y + 4, 6, 1, "#2e2c28");
    pxi(g, x + 2, y + 1, 1, 5, "#8a8478");
    pxi(g, x + 5, y + 1, 1, 5, "#3a3834");
  }

  function paintRuinVines(g, x, y, w, h, seed) {
    for (let i = 0; i < 10; i++) {
      const vx = x + ((hash(seed + i, 11) * (w - 2)) | 0);
      let vy = y + ((hash(seed + i, 17) * 6) | 0);
      const len = 10 + ((hash(seed + i, 23) * (h - 8)) | 0);
      for (let k = 0; k < len; k++) {
        const sway = ((hash(seed + i + k, 29) - 0.5) * 2) | 0;
        pxi(g, vx + sway, vy + k, 1, 1, k & 1 ? "#3a2818" : "#5a3a20");
        if (hash(seed + i * 3 + k, 31) > 0.72) {
          pxi(g, vx + sway + 1, vy + k, 2, 2, k & 2 ? "#2a6a34" : "#3a8a44");
        }
      }
    }
  }

  function paintRuinMoss(g, x, y, w) {
    for (let i = 0; i < w; i += 2) {
      if (hash(x + i, y + 4) < 0.35) continue;
      pxi(g, x + i, y, 2, 1, "#2a6a34");
      if (hash(x + i, y) > 0.55) pxi(g, x + i, y - 1, 1, 1, "#4a9a48");
    }
  }

  function paintRuinShrub(g, x, y) {
    pxi(g, x + 1, y + 2, 5, 3, "#2a4a24");
    pxi(g, x, y, 3, 3, "#3a7a34");
    pxi(g, x + 3, y - 1, 4, 4, "#2a6a30");
    pxi(g, x + 2, y + 1, 2, 2, "#5aba48");
    if (hash(x, y) > 0.5) pxi(g, x + 4, y + 2, 1, 1, "#e04a32");
    else if (hash(x + 1, y) > 0.6) pxi(g, x + 1, y + 1, 1, 1, "#ffe08a");
  }

  function paintRuinDebris(g, x, y, seed) {
    paintRuinStone(g, x, y, 10, 5, "#4a463e");
    pxi(g, x + 2, y + 1, 3, 1, "#2e2c28");
    pxi(g, x + 2, y + 2, 2, 1, "#2e2c28");
    pxi(g, x + 5, y + 1, 2, 2, "#2e2c28");
    // Maze-like engraving on the slab
    pxi(g, x + 1, y + 1, 1, 3, "#6a6458");
    pxi(g, x + 7, y + 1, 1, 3, "#6a6458");
    if (hash(seed, 7) > 0.4) {
      paintRuinStone(g, x + 12, y + 1, 7, 4, "#3a3834");
      pxi(g, x + 13, y + 2, 2, 1, "#2e2c28");
    }
  }

  /** Shared ruin gate metrics so stone, solids, and the portal share one frame. */
  function ruinsGateLayout(siteW, siteH) {
    const cx = (siteW / 2) | 0;
    const cy = 50;
    const rx = 13;
    const ry = 15;
    return {
      cx,
      cy,
      rx,
      ry,
      // Axis-aligned mouth used for walk/hit (matches the circle bounds)
      mouth: { x: cx - rx, y: cy - ry, w: rx * 2, h: ry * 2 },
      colLI: cx - 22,
      colLO: cx - 34,
      colRI: cx + 14,
      colRO: cx + 26,
      colY: cy - 28,
      colH: 58,
      lintelY: cy - 34,
      stepsY: cy + ry + 2,
      siteW,
      siteH,
    };
  }

  function bakeRiverRuins(siteW, siteH) {
    const L = ruinsGateLayout(siteW, siteH);
    ruinsCanvas = document.createElement("canvas");
    ruinsCanvas.width = siteW;
    ruinsCanvas.height = siteH;
    const g = ruinsCanvas.getContext("2d");
    g.imageSmoothingEnabled = false;

    // Dirt path up the steps and through the gate
    for (let y = L.cy - 4; y < siteH; y++) {
      const flare = Math.max(0, ((y - (L.cy + L.ry)) / 10) | 0);
      for (let x = L.cx - 10 - flare; x < L.cx + 10 + flare; x++) {
        if (x < 0 || x >= siteW) continue;
        const n = hash(x + 2, y + 5);
        pxi(g, x, y, 1, 1, n > 0.7 ? "#6a5438" : "#5a4630");
      }
    }

    // Side ruined walls — sit outside the column pairs, not over the mouth
    for (let side = 0; side < 2; side++) {
      const wx = side === 0 ? 2 : siteW - 28;
      for (let row = 0; row < 5; row++) {
        const yy = L.colY + 6 + row * 9;
        if (yy + 8 > siteH - 12) break;
        const ww = 22 - row + ((hash(side * 9 + row, 3) * 3) | 0);
        const xx = side === 0 ? wx : siteW - 4 - ww;
        // Keep clear of the inner columns
        if (side === 0 && xx + ww > L.colLO - 2) continue;
        if (side === 1 && xx < L.colRO + 12) continue;
        paintRuinStone(g, xx, yy, ww, 8, row & 1 ? "#5a564e" : "#4a463e");
        paintRuinMoss(g, xx, yy - 1, ww);
      }
      paintRuinVines(g, wx, L.colY + 4, 24, 44, 40 + side * 17);
    }

    // Twin columns framing the circular mouth
    paintRuinColumn(g, L.colLI, L.colY, L.colH);
    paintRuinColumn(g, L.colLO, L.colY + 4, L.colH - 6);
    paintRuinColumn(g, L.colRI, L.colY, L.colH);
    paintRuinColumn(g, L.colRO, L.colY + 4, L.colH - 6);
    paintRuinVines(g, L.colLI - 1, L.colY, 10, L.colH - 4, 71);
    paintRuinVines(g, L.colRI - 1, L.colY, 10, L.colH - 4, 88);

    // Lintel spanning the inner columns
    const lx = L.colLI - 2;
    const lw = L.colRI + 10 - lx;
    paintRuinStone(g, lx, L.lintelY, lw, 7, "#5a564e");
    paintRuinMoss(g, lx, L.lintelY - 1, lw);

    // Stepped peak stones centered on the lintel (all on-canvas)
    const midPeak = lx + ((lw / 2) | 0);
    const peak = [
      [midPeak - 28, L.lintelY - 5, 10, 5],
      [midPeak - 16, L.lintelY - 9, 12, 7],
      [midPeak - 6, L.lintelY - 13, 14, 9],
      [midPeak + 6, L.lintelY - 9, 12, 7],
      [midPeak + 16, L.lintelY - 5, 10, 5],
    ];
    for (let i = 0; i < peak.length; i++) {
      const p = peak[i];
      if (p[1] < 1) continue;
      paintRuinStone(g, p[0], p[1], p[2], p[3], i === 2 ? "#6a6458" : "#4a463e");
      paintRuinMoss(g, p[0], p[1] - 1, p[2]);
    }

    // Stone ring carved around the portal mouth (circle frame)
    for (let a = 0; a < 48; a++) {
      const ang = (a / 48) * Math.PI * 2;
      const ox = (L.cx + Math.cos(ang) * (L.rx + 2)) | 0;
      const oy = (L.cy + Math.sin(ang) * (L.ry + 2)) | 0;
      pxi(g, ox, oy, 2, 2, a & 1 ? "#6a6458" : "#3a3834");
      const ix = (L.cx + Math.cos(ang) * (L.rx + 0.5)) | 0;
      const iy = (L.cy + Math.sin(ang) * (L.ry + 0.5)) | 0;
      pxi(g, ix, iy, 1, 1, "#8a8478");
    }

    // Steps up to the gate (below the circle)
    for (let s = 0; s < 3; s++) {
      const sw = L.rx * 2 + 14 - s * 4;
      const sx = L.cx - ((sw / 2) | 0);
      const sy = L.stepsY + s * 3;
      paintRuinStone(g, sx, sy, sw, 3, s & 1 ? "#4a463e" : "#5a564e");
    }

    // Engraved debris + shrubs at the foot — clear of the path
    paintRuinDebris(g, 6, siteH - 14, 3);
    paintRuinDebris(g, siteW - 34, siteH - 16, 9);
    paintRuinShrub(g, 4, siteH - 22);
    paintRuinShrub(g, 20, siteH - 20);
    paintRuinShrub(g, siteW - 24, siteH - 22);
    paintRuinShrub(g, siteW - 12, siteH - 18);
    paintRuinShrub(g, L.colLI - 14, L.stepsY + 4);
    paintRuinShrub(g, L.colRI + 12, L.stepsY + 6);

    for (let i = 0; i < 16; i++) {
      const gx = 4 + ((hash(i, 51) * (siteW - 8)) | 0);
      const gy = 10 + ((hash(i, 57) * (siteH - 30)) | 0);
      const dx = gx - L.cx;
      const dy = gy - L.cy;
      if ((dx * dx) / ((L.rx + 6) * (L.rx + 6)) + (dy * dy) / ((L.ry + 6) * (L.ry + 6)) < 1) continue;
      pxi(g, gx, gy, 1, 2, "#3a8a44");
      if (hash(i, 61) > 0.5) pxi(g, gx + 1, gy - 1, 1, 2, "#2a6a34");
    }
  }

  function plantRuinsJungle(site, portal) {
    for (let i = 0; i < 88; i++) {
      const ang = (i / 88) * Math.PI * 2 + hash(i, 73) * 0.5;
      const rad = 22 + hash(i * 2, 79) * 56;
      const x = (site.x + site.w / 2 + Math.cos(ang) * rad) | 0;
      const y = (site.y + site.h / 2 + Math.sin(ang) * rad * 0.78) | 0;
      if (x > portal.x - 12 && x < portal.x + portal.w + 12 && y > portal.y - 6 && y < portal.y + portal.h + 30) continue;
      if (x > site.x + 8 && x < site.x + site.w - 8 && y > site.y + 6 && y < site.y + site.h - 10) continue;
      if (y >= restShoreY(x) - 10) continue;
      if (y <= northCliffY(x) + 8) continue;
      if (inRiverWater(x, y)) continue;
      if (hash(i, 83) > 0.62) {
        palms.push({ x, y, s: 0.88 + hash(i, 5) * 0.35 });
      } else {
        trees.push({
          x,
          y,
          s: 0.9 + hash(i, 11) * 0.4,
          kind: hash(i, 19) > 0.5 ? "pine" : "leaf",
        });
      }
    }
  }

  /** Soft sand → dirt → grass ring under/around the ruins so they sit in jungle, not beach. */
  function blendRuinsGround(site) {
    if (!landReady() || !site) return;
    const g = landGfx();
    const cx = site.x + ((site.w / 2) | 0);
    const cy = site.y + ((site.h / 2) | 0);
    const maxR = Math.max(site.w, site.h) * 0.92;
    const x0 = Math.max(0, (cx - maxR - 8) | 0);
    const y0 = Math.max(0, (cy - maxR - 8) | 0);
    const x1 = Math.min(WORLD_W - 1, (cx + maxR + 8) | 0);
    const y1 = Math.min(WORLD_H - 1, (cy + maxR + 8) | 0);
    for (let wy = y0; wy <= y1; wy++) {
      for (let wx = x0; wx <= x1; wx++) {
        if (inRiverWater(wx, wy)) continue;
        if (wy >= restShoreY(wx) - 2) continue;
        if (wy <= northCliffY(wx) + 2) continue;
        const dx = wx - cx;
        const dy = (wy - cy) * 1.15;
        const d = Math.sqrt(dx * dx + dy * dy);
        if (d > maxR) continue;
        const u = d / maxR;
        // Inner cleared dirt path / courtyard → moss grass → outer jungle grass
        let col;
        if (u < 0.28) {
          col = hash(wx, wy) > 0.55 ? "#6a5438" : "#5a4630";
        } else if (u < 0.52) {
          const t = (u - 0.28) / 0.24;
          col = t < 0.5 ? "#4a6a34" : "#3a7a38";
          if (hash(wx, wy) > 0.82) col = "#2a5a28";
        } else {
          const t = (u - 0.52) / 0.48;
          col = t < 0.45 ? "#3a8a44" : "#2a6a34";
          if (hash(wx + 3, wy) > 0.88) col = "#4a9a48";
        }
        // Feather into existing land so the edge isn't a hard disk
        if (u > 0.72) {
          if (hash(wx, wy + 9) > 1 - (u - 0.72) / 0.28) continue;
        }
        pxi(g, wx, wy, 1, 1, col);
        const c = (wx / TILE) | 0;
        const r = (wy / TILE) | 0;
        if (inBounds(c, r) && world[r][c] !== TILES.DEEP) {
          world[r][c] = u < 0.35 ? TILES.DIRT : TILES.GRASS;
        }
      }
    }
  }

  function placeRiverRuins(pier) {
    // Halfway dock → temple, deep in the jungle (not on the beach), beside the river
    const dockC = (pier.x / TILE) | 0;
    const templeC = 318;
    const midC = ((dockC + templeC) / 2) | 0;
    let wx = midC * TILE - 48;
    let best = null;
    for (let tries = 0; tries < 64; tries++) {
      const tx = wx + ((tries & 1 ? 1 : -1) * ((tries / 2) | 0) * 8);
      const shore = restShoreY(tx + 64);
      const cliff = northCliffY(tx + 64);
      const depth = Math.max(100, shore - cliff);
      // Sit inland like the temple — upper third of the land band
      const ty = cliff + Math.max(36, (depth * 0.22) | 0);
      if (ty + 110 > shore - 28) continue;
      if (inRiverWater(tx + 64, ty + 52)) continue;
      let nearRiver = false;
      for (let d = -56; d <= 56; d += 8) {
        if (inRiverWater(tx + 64 + d, ty + 52) || inRiverWater(tx + 64, ty + 52 + d)) {
          nearRiver = true;
          break;
        }
      }
      if (!nearRiver && tries < 40) continue;
      best = { x: tx, y: ty, shore, cliff };
      break;
    }
    if (!best) {
      const shore = restShoreY(wx + 64);
      const cliff = northCliffY(wx + 64);
      const depth = Math.max(100, shore - cliff);
      best = { x: wx, y: cliff + Math.max(36, (depth * 0.22) | 0), shore, cliff };
    }
    const siteW = 128;
    const siteH = 104;
    const site = { x: best.x, y: best.y, w: siteW, h: siteH };
    const L = ruinsGateLayout(siteW, siteH);
    ruinsSite = site;
    ruinsPortal = {
      x: site.x + L.mouth.x,
      y: site.y + L.mouth.y,
      w: L.mouth.w,
      h: L.mouth.h,
      cx: site.x + L.cx,
      cy: site.y + L.cy,
      rx: L.rx,
      ry: L.ry,
    };
    ruinsOX = site.x;
    ruinsOY = site.y;
    bakeRiverRuins(siteW, siteH);
    blendRuinsGround(site);

    // Solids match the painted frame: side walls, lintel, columns — mouth stays open
    islandSolids.push({ x: site.x + 2, y: site.y + L.colY + 6, w: Math.max(8, L.colLO - 4), h: 48 });
    islandSolids.push({
      x: site.x + L.colRO + 12,
      y: site.y + L.colY + 6,
      w: Math.max(8, siteW - (L.colRO + 14)),
      h: 48,
    });
    islandSolids.push({ x: site.x + L.colLI - 2, y: site.y + L.lintelY, w: L.colRI + 12 - (L.colLI - 2), h: 8 });
    islandSolids.push({ x: site.x + L.colLI - 1, y: site.y + L.colY, w: 12, h: L.colH });
    islandSolids.push({ x: site.x + L.colLO - 1, y: site.y + L.colY + 4, w: 12, h: L.colH - 6 });
    islandSolids.push({ x: site.x + L.colRI - 1, y: site.y + L.colY, w: 12, h: L.colH });
    islandSolids.push({ x: site.x + L.colRO - 1, y: site.y + L.colY + 4, w: 12, h: L.colH - 6 });
    walkPads.push({
      x: ruinsPortal.x - 6,
      y: ruinsPortal.y,
      w: ruinsPortal.w + 12,
      h: ruinsPortal.h + 26,
    });
    keepouts.push({ x: site.x - 12, y: site.y - 10, w: site.w + 24, h: site.h + 20 });
    plantRuinsJungle(site, ruinsPortal);
  }

  /** Kidney/bean sample: 0 inside water, ~1 at shore ring. */
  function pondWaterU(lx, ly, cx, cy, rx, ry) {
    const nx = (lx - cx) / rx;
    const ny = (ly - cy) / ry;
    // Bean warp — slight kidney silhouette
    const wx = nx + 0.18 * ny * ny;
    const wy = ny - 0.12 * nx;
    const d = Math.sqrt(wx * wx + wy * wy);
    const jag = (n2(lx * 0.11, ly * 0.13) - 0.5) * 0.12;
    return d + jag;
  }

  function paintPondLily(g, x, y, s) {
    const r = Math.max(2, (3 * s) | 0);
    pxi(g, x - r + 1, y, r * 2 - 1, 1, "#2a7a48");
    pxi(g, x - r, y - 1, r * 2 + 1, 1, "#3a9a58");
    pxi(g, x - r + 1, y - 2, r * 2 - 1, 1, "#2a6a40");
    pxi(g, x, y - 1, 1, 1, "#1a4028");
    if (s > 1) pxi(g, x + 1, y, 1, 1, "#5aba68");
  }

  function paintPondReed(g, x, y, h, side) {
    for (let i = 0; i < h; i++) {
      pxi(g, x + (i > h - 3 ? side : 0), y - i, 1, 1, i > h - 2 ? "#9ed85a" : "#1f6a30");
    }
  }

  function paintPondLeaf(g, x, y) {
    // Broad teal tropical leaf + tendril
    pxi(g, x, y + 2, 5, 3, "#1a4a44");
    pxi(g, x + 1, y, 4, 3, "#2a6a58");
    pxi(g, x + 2, y - 1, 3, 2, "#3a8a70");
    pxi(g, x + 5, y + 1, 2, 1, "#1a4a44");
    pxi(g, x + 6, y, 2, 1, "#2a6a58");
    pxi(g, x + 7, y - 1, 1, 1, "#3a8a70");
  }

  function paintPondBush(g, x, y) {
    pxi(g, x + 1, y + 2, 6, 3, "#1a3a24");
    pxi(g, x, y, 4, 4, "#2a5a34");
    pxi(g, x + 3, y - 1, 5, 4, "#1a4a2c");
    pxi(g, x + 2, y + 1, 2, 2, "#3a8a44");
    if (hash(x, y) > 0.55) pxi(g, x + 5, y + 2, 1, 1, "#5aba48");
  }

  function paintPondDinghy(g, x, y) {
    // Short flat freshwater dinghy — not the ocean skiff
    pxi(g, x + 1, y + 2, 14, 4, "#4a3a22");
    pxi(g, x, y + 3, 16, 3, "#5a4630");
    pxi(g, x + 1, y + 3, 14, 2, "#6a5438");
    pxi(g, x + 2, y + 1, 12, 1, "#3a2e1c");
    pxi(g, x + 2, y + 4, 12, 1, "#2a2014");
    // Seat plank
    pxi(g, x + 6, y + 2, 4, 1, "#8a6a40");
    // Oar across thwarts
    pxi(g, x + 3, y + 2, 10, 1, "#5a3a20");
    pxi(g, x + 12, y + 1, 2, 2, "#6a4a28");
    pxi(g, x + 1, y + 3, 1, 2, "#3a2e1c");
    pxi(g, x + 14, y + 3, 1, 2, "#3a2e1c");
  }

  /** Widen the river into a bean-shaped pool (collision + water). */
  function carvePondIntoRiver(cx, cy, rx, ry) {
    const y0 = Math.max(0, (cy - ry - 4) | 0);
    const y1 = Math.min(WORLD_H - 1, (cy + ry + 4) | 0);
    for (let y = y0; y <= y1; y++) {
      let half = 0;
      for (let x = cx - rx - 6; x <= cx + rx + 6; x++) {
        if (pondWaterU(x, y, cx, cy, rx, ry) < 1) {
          const d = Math.abs(x - cx);
          if (d > half) half = d;
        }
      }
      if (half < 8) continue;
      // Soft bank flare
      half += 3 + ((hash(y, 71) * 4) | 0);
      addRiverSpan(y, cx - half, cx + half);
    }
  }

  /** Paint pool water + banks onto landCanvas — colors match river WATER_BLUE / WATER_DEEP. */
  function paintPondPoolOntoLand(cx, cy, rx, ry) {
    if (!landReady()) return;
    const g = landGfx();
    const x0 = Math.max(0, (cx - rx - 22) | 0);
    const y0 = Math.max(0, (cy - ry - 22) | 0);
    const x1 = Math.min(WORLD_W - 1, (cx + rx + 22) | 0);
    const y1 = Math.min(WORLD_H - 1, (cy + ry + 22) | 0);
    for (let wy = y0; wy <= y1; wy++) {
      for (let wx = x0; wx <= x1; wx++) {
        const u = pondWaterU(wx, wy, cx, cy, rx, ry);
        const bank = pondWaterU(wx, wy, cx, cy, rx + 14, ry + 10);
        if (u < 1) {
          // Match inland river / ocean palette (WATER_BLUE / WATER_DEEP)
          let col;
          if (u < 0.28) col = hash(wx, wy) > 0.55 ? WATER_DEEP : "#0f6a94";
          else if (u < 0.58) col = hash(wx, wy) > 0.5 ? WATER_BLUE : "#1a8cbc";
          else col = hash(wx, wy) > 0.45 ? "#2a9acc" : WATER_BLUE;
          if (hash(wx * 3, wy * 5) > 0.978) col = "#c8ecf8";
          pxi(g, wx, wy, 1, 1, col);
          const c = (wx / TILE) | 0;
          const r = (wy / TILE) | 0;
          if (inBounds(c, r)) world[r][c] = TILES.DEEP;
          continue;
        }
        if (bank >= 1.45) continue;
        if (wy >= restShoreY(wx) - 2) continue;
        let col;
        if (bank < 1.12) col = hash(wx, wy) > 0.5 ? "#5a4630" : "#4a3a28";
        else if (bank < 1.28) col = hash(wx, wy) > 0.5 ? "#3a6a34" : "#2a5a28";
        else col = hash(wx + 1, wy) > 0.5 ? "#3a8a44" : "#2a6a34";
        if (bank > 1.32 && hash(wx, wy + 4) > 0.7) continue;
        pxi(g, wx, wy, 1, 1, col);
        const c = (wx / TILE) | 0;
        const r = (wy / TILE) | 0;
        if (inBounds(c, r) && world[r][c] !== TILES.DEEP) {
          world[r][c] = bank < 1.15 ? TILES.DIRT : TILES.GRASS;
        }
      }
    }
  }

  /**
   * Irregular arched cave mouth with nested depth, carved into an existing cliff face.
   * Returns wet lip {x,y,w} for waterfall alignment.
   */
  function paintPondCaveMouth(g, cx, cy, seed) {
    const rw = 9 + ((hash(seed, 1) * 8) | 0); // half-width 9–16
    const rh = 10 + ((hash(seed, 2) * 7) | 0); // half-height 10–16
    const skew = (hash(seed, 3) - 0.5) * 0.35;
    const lean = (hash(seed, 4) - 0.5) * 3;
    const x0 = (cx - rw - 4) | 0;
    const y0 = (cy - rh - 3) | 0;
    const x1 = (cx + rw + 4) | 0;
    const y1 = (cy + rh + 2) | 0;

    // Stone arch ring + nested depth (outside → inside)
    for (let y = y0; y <= y1; y++) {
      for (let x = x0; x <= x1; x++) {
        const nx = (x - cx - lean * ((y - cy) / rh)) / rw;
        const ny = (y - cy) / rh;
        // Arch: fuller sides, flatter floor (ny < 0.85), jagged rim noise
        const jagged = (n2(x * 0.19 + seed, y * 0.17) - 0.5) * 0.22;
        const d = Math.sqrt(nx * nx + (ny < 0 ? ny * ny * 0.85 : ny * ny * 1.15)) + jagged + skew * nx * ny;
        if (d > 1.28) continue;
        if (d > 1.05) {
          // Outer rock lip
          const n = hash(x, y + seed);
          pxi(g, x, y, 1, 1, n > 0.55 ? "#6a6458" : "#4a463e");
          continue;
        }
        if (d > 0.82) {
          pxi(g, x, y, 1, 1, hash(x + 2, y) > 0.5 ? "#3a3834" : "#2e2c28");
          continue;
        }
        if (d > 0.55) {
          pxi(g, x, y, 1, 1, "#1a1814");
          continue;
        }
        if (d > 0.28) {
          pxi(g, x, y, 1, 1, "#0c0e14");
          continue;
        }
        // Deep void
        pxi(g, x, y, 1, 1, hash(x, y) > 0.7 ? "#152030" : "#06080c");
      }
    }

    // Stalactites hanging from arch ceiling (vary count/length)
    const drops = 2 + ((hash(seed, 7) * 4) | 0);
    for (let i = 0; i < drops; i++) {
      const tx = (cx - rw * 0.55 + hash(seed + i, 8) * rw * 1.1) | 0;
      const len = 2 + ((hash(seed + i, 9) * 5) | 0);
      for (let k = 0; k < len; k++) {
        pxi(g, tx, cy - rh + 2 + k, 1, 1, k === len - 1 ? "#2a2830" : "#3a3834");
        if (k === len - 1 && hash(seed + i, 10) > 0.55) pxi(g, tx, cy - rh + 2 + k + 1, 1, 1, "#5a9ab0");
      }
    }

    // Floor shelf / wet sill inside mouth
    const sillY = (cy + rh * 0.72) | 0;
    const sillW = Math.max(4, (rw * 1.1) | 0);
    for (let ix = -sillW; ix <= sillW; ix++) {
      const nx = ix / rw;
      if (nx * nx > 1.05) continue;
      pxi(g, cx + ix, sillY, 1, 1, hash(ix, seed) > 0.5 ? "#2a4a58" : "#1a3a48");
      if (hash(ix, seed + 1) > 0.6) pxi(g, cx + ix, sillY + 1, 1, 1, WATER_BLUE);
    }

    // Moss / wet stains at edges
    for (let i = 0; i < 6; i++) {
      const ang = -Math.PI * 0.15 + (i / 5) * Math.PI * 1.3;
      const mx = (cx + Math.cos(ang) * rw * 0.95) | 0;
      const my = (cy + Math.sin(ang) * rh * 0.9) | 0;
      pxi(g, mx, my, 1, 1, i & 1 ? "#2a6a34" : "#1a4a28");
    }

    const lipW = Math.max(3, (rw * 0.7) | 0);
    return { x: cx - ((lipW / 2) | 0), y: sillY, w: lipW, h: 1, cx: cx };
  }

  function paintPondCliffWall(g, wallX, wallY, wallW, wallH) {
    for (let iy = 0; iy < wallH; iy++) {
      for (let ix = 0; ix < wallW; ix++) {
        const n = hash(wallX + ix, wallY + iy + 9);
        let col = n > 0.7 ? "#706a60" : n > 0.4 ? "#5a564e" : "#4a463e";
        if (iy < 3) col = n > 0.5 ? "#3a3834" : "#4a463e";
        // Subtle strata bands
        if (((iy / 3) | 0) & 1) col = n > 0.5 ? "#5e5850" : "#48443e";
        pxi(g, wallX + ix, wallY + iy, 1, 1, col);
      }
    }
    for (let ix = 0; ix < wallW; ix += 2) {
      if (hash(wallX + ix, wallY) < 0.35) continue;
      pxi(g, wallX + ix, wallY - 1, 2, 1, "#2a6a34");
      if (hash(wallX + ix, 2) > 0.55) pxi(g, wallX + ix, wallY - 2, 1, 1, "#3a8a44");
    }
    // Vine streaks
    for (let i = 0; i < 10; i++) {
      const vx = wallX + 2 + ((hash(i, wallY) * (wallW - 4)) | 0);
      for (let k = 0; k < 6 + ((hash(i, 3) * 8) | 0); k++) {
        pxi(g, vx + ((((hash(i + k, 5) - 0.5) * 2) | 0)), wallY + 2 + k, 1, 1, k & 1 ? "#2a6a34" : "#1a4a28");
      }
    }
  }

  /** Find where the river channel approaches the pool (inlet) for waterfall alignment. */
  function findPoolRiverInlet(anchor) {
    let best = null;
    let bestD = 1e12;
    for (let ci = 0; ci < riverCourses.length; ci++) {
      const pts = riverCourses[ci].pts || [];
      for (let i = 1; i < pts.length; i++) {
        const p = pts[i];
        const prev = pts[i - 1];
        const d = Math.hypot(p.x - anchor.x, p.y - anchor.y);
        if (d < bestD) {
          bestD = d;
          // Upstream is toward lower index inland (prev often more inland / smaller y travel)
          const ux = p.x - prev.x;
          const uy = p.y - prev.y;
          best = { x: p.x | 0, y: p.y | 0, dx: ux, dy: uy, half: p.half || 14 };
        }
      }
    }
    if (!best) return { x: anchor.x, y: anchor.y - 40, half: 14 };
    // Place inlet on the north rim of the pool, x locked to river channel
    return { x: best.x, y: anchor.y - 50, half: Math.max(10, best.half | 0) };
  }

  function bakeJunglePond(siteW, siteH, inletLocalX) {
    pondCanvas = document.createElement("canvas");
    pondCanvas.width = siteW;
    pondCanvas.height = siteH;
    const g = pondCanvas.getContext("2d");
    g.imageSmoothingEnabled = false;
    // ~3× prior pool (was rx34/ry22)
    const cx = ((siteW * 0.5) | 0);
    const cy = ((siteH * 0.48) | 0);
    const rx = 100;
    const ry = 64;
    const inletX = inletLocalX != null ? inletLocalX | 0 : cx;

    // Stone / moss rim (water itself is carved into the river + landCanvas)
    for (let a = 0; a < 140; a++) {
      const ang = (a / 140) * Math.PI * 2;
      // Skip north arc — cliff wall replaces the rim there
      if (ang > 4.0 && ang < 5.5) continue;
      const jag = 0.9 + hash(a, 9) * 0.16;
      const sx = (cx + Math.cos(ang) * rx * jag) | 0;
      const sy = (cy + Math.sin(ang) * ry * jag) | 0;
      const col = hash(a, 11) > 0.55 ? "#6a6458" : hash(a, 13) > 0.5 ? "#5a564e" : "#4a463e";
      pxi(g, sx, sy, 3, 2, col);
      if (hash(a, 17) > 0.5) pxi(g, sx, sy - 1, 2, 1, "#2a6a34");
      if (hash(a, 19) > 0.72) pxi(g, sx + 1, sy + 1, 1, 1, "#8a8478");
    }

    // Continuous north cliff wall — caves + falls centered on river inlet
    const wallY = cy - ry - 20;
    const wallH = 32;
    const wallX = cx - rx + 8;
    const wallW = rx * 2 - 16;
    paintPondCliffWall(g, wallX, wallY, wallW, wallH);

    // Clamp inlet to wall interior
    const inletClamped = Math.max(wallX + 22, Math.min(wallX + wallW - 22, inletX));
    const caveSpecs = [
      { cx: inletClamped, cy: wallY + 16, seed: 11, fall: true }, // main — river entrance
      { cx: inletClamped - 38 - ((hash(3, 1) * 10) | 0), cy: wallY + 14 + ((hash(3, 2) * 4) | 0), seed: 22, fall: true },
      { cx: inletClamped + 36 + ((hash(5, 1) * 10) | 0), cy: wallY + 15 + ((hash(5, 2) * 3) | 0), seed: 33, fall: hash(5, 4) > 0.35 },
    ];
    const fallLips = [];
    for (let i = 0; i < caveSpecs.length; i++) {
      const spec = caveSpecs[i];
      if (spec.cx < wallX + 16 || spec.cx > wallX + wallW - 16) continue;
      const lip = paintPondCaveMouth(g, spec.cx, spec.cy, spec.seed);
      if (spec.fall && lip) fallLips.push(lip);
    }

    // Waterfalls from cave sills down into the pool (aligned to mouths / river inlet)
    const fallsLocal = [];
    const waterLine = cy - ry + 4;
    for (let f = 0; f < fallLips.length; f++) {
      const lip = fallLips[f];
      if (!lip) continue;
      const fallH = Math.max(8, (waterLine - (lip.y + 1)) | 0);
      // Wider sheet for the main inlet cave
      const sheetW = f === 0 ? Math.max(lip.w, 8) : lip.w;
      const sheetX = f === 0 ? (lip.cx - ((sheetW / 2) | 0)) : lip.x;
      for (let iy = 0; iy < fallH; iy++) {
        const taper = iy > fallH - 5 ? 1 : 0;
        const sway = ((Math.sin(iy * 0.45 + f) * 1.2) | 0);
        for (let ix = taper; ix < sheetW - taper; ix++) {
          const col = iy < 2 ? "#c8ecf8" : iy % 3 === 0 ? "#7ec8e0" : WATER_BLUE;
          pxi(g, sheetX + ix + sway, lip.y + 1 + iy, 1, 1, col);
        }
      }
      pxi(g, sheetX - 1, lip.y + fallH, sheetW + 2, 2, "#a8d8e8");
      fallsLocal.push({ x: sheetX, y: lip.y + 1, w: sheetW, h: fallH });
    }

    // Boulder clusters along non-north banks
    for (let i = 0; i < 18; i++) {
      const ang = (i / 18) * Math.PI * 2 + 0.3;
      if (ang > 3.9 && ang < 5.6) continue;
      if (ang > 0.95 && ang < 2.15) continue;
      const bx = (cx + Math.cos(ang) * (rx + 2 + hash(i, 21) * 10)) | 0;
      const by = (cy + Math.sin(ang) * (ry + 1 + hash(i, 23) * 8)) | 0;
      const bw = 5 + ((hash(i, 25) * 6) | 0);
      const bh = 4 + ((hash(i, 27) * 4) | 0);
      pxi(g, bx, by, bw, bh, hash(i, 29) > 0.5 ? "#5a564e" : "#4a463e");
      pxi(g, bx + 1, by + 1, bw - 2, 1, "#8a8478");
      if (hash(i, 31) > 0.45) pxi(g, bx + 1, by - 1, bw - 2, 1, "#2a6a34");
    }

    // Lilies (more for larger pool)
    for (let i = 0; i < 18; i++) {
      const ang = hash(i, 33) * Math.PI * 2;
      const rad = 8 + hash(i, 35) * (rx * 0.72);
      const lx = (cx + Math.cos(ang) * rad) | 0;
      const ly = (cy + Math.sin(ang) * rad * 0.7) | 0;
      if (pondWaterU(lx, ly, cx, cy, rx, ry) >= 0.9) continue;
      paintPondLily(g, lx, ly, 0.85 + hash(i, 37) * 0.7);
    }

    // Reed banks
    for (let i = 0; i < 36; i++) {
      const ang = (i / 36) * Math.PI * 2 + hash(i, 39) * 0.2;
      if (ang > 1.0 && ang < 2.1) continue;
      const bx = (cx + Math.cos(ang) * (rx + 1)) | 0;
      const by = (cy + Math.sin(ang) * (ry + 2)) | 0;
      if (pondWaterU(bx, by, cx, cy, rx, ry) < 0.86) continue;
      paintPondReed(g, bx, by, 5 + ((hash(i, 41) * 5) | 0), ang < Math.PI ? -1 : 1);
    }

    // South shore walk lip
    const pathY = cy + ry + 2;
    for (let lx = cx - 40; lx < cx + 42; lx++) {
      for (let ly = pathY; ly < pathY + 14; ly++) {
        if (ly >= siteH) continue;
        const edge = Math.abs(lx - cx) / 42;
        if (edge > 0.96) continue;
        if (hash(lx, ly) > 0.8 + edge * 0.15) continue;
        pxi(g, lx, ly, 1, 1, hash(lx, ly + 1) > 0.5 ? "#6a5438" : "#5a4630");
      }
    }

    // Dinghy + post on SE bank (slightly larger for the bigger pool)
    const postX = cx + 36;
    const postY = cy + ry - 4;
    paintPost(g, postX, postY - 6, 16);
    for (let i = 0; i < 10; i++) {
      pxi(g, postX - 1 - i, postY + 4 + ((i * 0.35) | 0), 1, 1, "#8a6a40");
    }
    // Dinghy is drawn live so it can steer around the pool

    // Dense brush feather (leave south path + north wall clear)
    for (let i = 0; i < 48; i++) {
      const ang = (i / 48) * Math.PI * 2 + hash(i, 51) * 0.4;
      if (ang > 0.9 && ang < 2.2) continue;
      if (ang > 3.9 && ang < 5.6) continue;
      const rad = rx + 10 + hash(i, 53) * 22;
      const bx = (cx + Math.cos(ang) * rad) | 0;
      const by = (cy + Math.sin(ang) * rad * 0.78) | 0;
      if (bx < 2 || by < 2 || bx > siteW - 12 || by > siteH - 10) continue;
      if (hash(i, 55) > 0.42) paintPondBush(g, bx, by);
      else paintPondLeaf(g, bx, by);
      if (hash(i, 57) > 0.65) paintPondReed(g, bx + 4, by + 2, 4 + ((hash(i, 59) * 3) | 0), 1);
    }

    return { cx, cy, rx, ry, postX, postY, falls: fallsLocal, wallX, wallY, wallW, wallH };
  }

  function plantPondJungle(water) {
    for (let i = 0; i < 70; i++) {
      const ang = (i / 70) * Math.PI * 2 + hash(i, 61) * 0.5;
      if (ang > 0.85 && ang < 2.25) continue;
      const rad = Math.max(water.rx, water.ry) + 18 + hash(i * 2, 63) * 48;
      const x = (water.cx + Math.cos(ang) * rad) | 0;
      const y = (water.cy + Math.sin(ang) * rad * 0.75) | 0;
      if (y >= restShoreY(x) - 10) continue;
      if (y <= northCliffY(x) + 8) continue;
      if (inRiverWater(x, y) || inPondWater(x, y)) continue;
      if (ruinsSite && x > ruinsSite.x - 8 && x < ruinsSite.x + ruinsSite.w + 8 && y > ruinsSite.y - 8 && y < ruinsSite.y + ruinsSite.h + 8) {
        continue;
      }
      if (hash(i, 65) > 0.55) {
        palms.push({ x, y, s: 0.85 + hash(i, 67) * 0.35 });
      } else {
        trees.push({
          x,
          y,
          s: 0.85 + hash(i, 69) * 0.45,
          kind: hash(i, 71) > 0.5 ? "pine" : "leaf",
        });
      }
    }
  }

  function findRiverPoolAnchor(pier) {
    const dockX = pier.x + ((pier.w / 2) | 0);
    const ruinsX = ruinsSite ? ruinsSite.x + ((ruinsSite.w / 2) | 0) : dockX + 280;
    const midX = ((dockX + ruinsX) / 2) | 0;
    let best = null;
    let bestScore = 1e12;
    for (let ci = 0; ci < riverCourses.length; ci++) {
      const pts = riverCourses[ci].pts || [];
      for (let i = 0; i < pts.length; i++) {
        const p = pts[i];
        const shore = restShoreY(p.x);
        if (p.y > shore - 48) continue;
        if (p.y < northCliffY(p.x) + 40) continue;
        const dx = p.x - midX;
        const score = Math.abs(dx) + Math.abs(p.y - (shore - 110)) * 0.35;
        if (ruinsSite) {
          const rdx = p.x - (ruinsSite.x + ruinsSite.w / 2);
          const rdy = p.y - (ruinsSite.y + ruinsSite.h / 2);
          if (Math.hypot(rdx, rdy) < 140) continue;
        }
        if (score < bestScore) {
          bestScore = score;
          best = { x: p.x | 0, y: p.y | 0 };
        }
      }
    }
    if (best) return best;
    // Fallback: first river span near midX
    for (let y = 40; y < WORLD_H - 40; y += 4) {
      const row = riverSpans[y];
      if (!row) continue;
      for (let i = 0; i < row.length; i++) {
        const s = row[i];
        const mx = ((s.l + s.r) / 2) | 0;
        if (Math.abs(mx - midX) < 220 && y < restShoreY(mx) - 48) return { x: mx, y: y };
      }
    }
    return { x: midX, y: ((northCliffY(midX) + restShoreY(midX)) / 2) | 0 };
  }

  function placeJunglePond(pier) {
    pondFishReady = false;
    pondCanvas = null;
    pondSite = null;
    pondWater = null;
    pondPad = null;
    pondBoat = null;
    pondPost = null;
    pondFalls = [];
    if (!pier) return;

    const anchor = findRiverPoolAnchor(pier);
    const siteW = 280;
    const siteH = 200;
    const layoutLocal = { cx: (siteW / 2) | 0, cy: (siteH / 2) | 0, rx: 100, ry: 64 };
    const site = {
      x: anchor.x - layoutLocal.cx,
      y: anchor.y - layoutLocal.cy,
      w: siteW,
      h: siteH,
    };
    pondSite = site;
    pondOX = site.x;
    pondOY = site.y;

    // Merge into river first so collision / foam / fish see one water body
    carvePondIntoRiver(anchor.x, anchor.y, layoutLocal.rx, layoutLocal.ry);
    paintPondPoolOntoLand(anchor.x, anchor.y, layoutLocal.rx, layoutLocal.ry);

    const inlet = findPoolRiverInlet(anchor);
    const layout = bakeJunglePond(siteW, siteH, inlet.x - site.x);
    pondWater = {
      cx: site.x + layout.cx,
      cy: site.y + layout.cy,
      rx: layout.rx,
      ry: layout.ry,
    };
    pondPad = {
      x: site.x + layout.cx - 40,
      y: site.y + layout.cy + layout.ry + 1,
      w: 82,
      h: 14,
    };
    pondPost = {
      x: site.x + layout.postX,
      y: site.y + layout.postY - 6,
      w: 3,
      h: 16,
    };
    pondBoat = {
      x: site.x + layout.postX - 20,
      y: site.y + layout.postY + 2,
      w: 16,
      h: 7,
      kind: "dinghy",
      vx: 0,
      vy: 0,
      face: 1,
      tilt: 0,
      phase: 0.4,
    };

    walkPads.push(pondPad);
    islandSolids.push(pondPost);
    // Full north cliff wall solid (caves are visual recesses in that face)
    if (layout.wallW) {
      islandSolids.push({
        x: site.x + layout.wallX,
        y: site.y + layout.wallY,
        w: layout.wallW,
        h: Math.max(10, (layout.wallH || 20) - 6),
      });
    }
    pondFalls = (layout.falls || []).map((f) => ({
      x: site.x + f.x,
      y: site.y + f.y,
      w: f.w,
      h: f.h,
    }));
    keepouts.push({
      x: pondWater.cx - pondWater.rx - 10,
      y: pondWater.cy - pondWater.ry - 22,
      w: pondWater.rx * 2 + 20,
      h: pondWater.ry * 2 + 36,
    });
    plantPondJungle(pondWater);
    pondFishReady = true;
  }

  /** Ocean-like tide foam along the carved pool shore. */
  function drawPondTide(cpos, t) {
    if (!pondWater) return;
    const w = pondWater;
    const period = 3.6;
    let p = (t / period) % 1;
    if (p < 0) p += 1;
    const crash = p > 0.42 && p < 0.72;
    const fa = crash ? 0.85 : 0.35 + 0.4 * Math.sin(p * Math.PI);
    if (fa < 0.08) return;
    ink.save();
    for (let a = 0; a < 96; a++) {
      const ang = (a / 96) * Math.PI * 2;
      const jag = 0.94 + 0.08 * Math.sin(t * 1.4 + a * 0.3);
      const pull = crash ? 1.02 + 0.04 * Math.sin(t * 3 + a) : 0.98;
      const wx = w.cx + Math.cos(ang) * w.rx * jag * pull;
      const wy = w.cy + Math.sin(ang) * w.ry * jag * pull;
      if (!inPondWater(wx - Math.cos(ang) * 3, wy - Math.sin(ang) * 3) && !inRiverWater(wx, wy)) {
        /* foam sits on lip */
      }
      const sx = (wx - cpos.x) | 0;
      const sy = (wy - cpos.y) | 0;
      if (sx < -2 || sy < -2 || sx > viewW + 2 || sy > viewH + 2) continue;
      if (hash(a + ((t * 4) | 0), 81) < 0.35) continue;
      ink.globalAlpha = fa * (0.45 + hash(a, 83) * 0.55);
      px(sx, sy, 1, 1, crash && hash(a, 85) > 0.5 ? "#ffffff" : "#e8f6ff");
      if (crash && hash(a, 87) > 0.7) {
        px(sx + ((Math.cos(ang) * 2) | 0), sy + ((Math.sin(ang) * 2) | 0), 1, 1, "#f4fbff");
      }
    }
    ink.restore();
  }

  function spawnPondFishJump() {
    if (!pondWater || !fishDaytime(time)) return;
    if (pondWater.cx + pondWater.rx < camera.x - 20 || pondWater.cx - pondWater.rx > camera.x + viewW + 20) return;
    if (pondWater.cy + pondWater.ry < camera.y - 20 || pondWater.cy - pondWater.ry > camera.y + viewH + 20) return;
    let f = null;
    for (let i = 0; i < fishJumps.length; i++) {
      if (!fishJumps[i].alive) {
        f = fishJumps[i];
        break;
      }
    }
    if (!f) {
      if (fishJumps.length >= MAX_FISH + 4) return;
      f = { alive: false };
      fishJumps.push(f);
    }
    const kinds = ["cod", "trout", "salmon", "fish_blue", "fish_reef", "fish_gold"];
    for (let attempt = 0; attempt < 14; attempt++) {
      const ang = Math.random() * Math.PI * 2;
      const rad = Math.random() * pondWater.rx * 0.7;
      const x = pondWater.cx + Math.cos(ang) * rad;
      const y = pondWater.cy + Math.sin(ang) * rad * (pondWater.ry / pondWater.rx);
      if (!fishWater(x, y)) continue;
      const kind = kinds[irand(0, kinds.length - 1)];
      const apexY = y - rand(10, 22);
      const startY = y + rand(2, 6);
      const endY = y + rand(2, 8);
      const dx = rand(-36, 36);
      const x1 = x + dx * 0.35;
      const x2 = x + dx;
      if (!fishWater(x2, endY) && !inPondWater(x2, endY)) continue;
      f.alive = true;
      f.u = 0;
      f.dur = rand(0.75, 1.15);
      f.x0 = x;
      f.x1 = x1;
      f.x2 = x2;
      f.y0 = startY;
      f.y1 = apexY;
      f.y2 = endY;
      f.x = x;
      f.y = startY;
      f.kind = kind;
      f.len = 5 + ((hash(x | 0, y | 0) * 4) | 0);
      f.ang = -Math.PI / 2;
      f.squash = 0.7;
      f.tumble = rand(-0.5, 0.5);
      f.splashedUp = false;
      f.splashedDown = false;
      return;
    }
  }

  function drawPondFalls(cpos, t) {
    if (!pondFalls.length) return;
    const flicker = (t * 10) | 0;
    ink.save();
    for (let i = 0; i < pondFalls.length; i++) {
      const f = pondFalls[i];
      const sx = (f.x - cpos.x) | 0;
      const sy = (f.y - cpos.y) | 0;
      if (sx > viewW + 4 || sy > viewH + 4 || sx + f.w < -4 || sy + f.h < -4) continue;
      for (let iy = 0; iy < f.h; iy++) {
        const streak = (iy + flicker + i * 3) % 5;
        ink.globalAlpha = 0.25 + (streak === 0 ? 0.45 : streak === 1 ? 0.2 : 0.08);
        const col = streak === 0 ? "#ffffff" : streak === 1 ? "#c8ecf8" : "#7ec8e0";
        const ox = ((hash(i, iy + flicker) - 0.5) * 2) | 0;
        px(sx + 1 + ox, sy + iy, Math.max(1, f.w - 2), 1, col);
      }
      // Base splash bloom
      ink.globalAlpha = 0.35 + 0.25 * Math.sin(t * 6 + i);
      px(sx - 1, sy + f.h - 1, f.w + 2, 1, "#e8f6ff");
      px(sx, sy + f.h, f.w, 1, "#ffffff");
    }
    ink.restore();
  }

  function drawPondDinghyLive(cpos, t) {
    if (!pondBoat) return;
    const b = pondBoat;
    const bob = dinghyBob(b, t);
    const bx = (b.x - cpos.x) | 0;
    const by = (b.y - cpos.y + bob) | 0;
    if (bx < -24 || by < -12 || bx > viewW + 8 || by > viewH + 8) return;
    ink.save();
    ink.translate(bx + b.w / 2, by + b.h);
    ink.rotate(b.tilt || 0);
    ink.scale(b.face || 1, 1);
    ink.translate(-b.w / 2, -b.h);
    // Match paintPondDinghy palette
    px(1, 2, 14, 4, "#4a3a22");
    px(0, 3, 16, 3, "#5a4630");
    px(1, 3, 14, 2, "#6a5438");
    px(2, 1, 12, 1, "#3a2e1c");
    px(2, 4, 12, 1, "#2a2014");
    px(6, 2, 4, 1, "#8a6a40");
    px(3, 2, 10, 1, "#5a3a20");
    px(12, 1, 2, 2, "#6a4a28");
    px(1, 3, 1, 2, "#3a2e1c");
    px(14, 3, 1, 2, "#3a2e1c");
    ink.restore();
    // Soft wake shimmer
    ink.save();
    ink.globalAlpha = 0.28;
    px(bx + 3, by + 6, 10, 1, "#a8f0f4");
    ink.restore();
  }

  function drawPond(cpos, t) {
    if (!pondCanvas || !pondSite) return;
    const dx = pondOX - cpos.x;
    const dy = pondOY - cpos.y;
    if (dx > viewW + 8 || dy > viewH + 8 || dx + pondCanvas.width < -8 || dy + pondCanvas.height < -8) {
      // Still draw dinghy if it steered into view while bake is offscreen
      drawPondDinghyLive(cpos, t);
      return;
    }
    ctx.drawImage(pondCanvas, dx, dy);
    drawPondFalls(cpos, t);
    drawPondTide(cpos, t);
    drawPondDinghyLive(cpos, t);
  }

  function drawRuins(cpos, t) {
    if (!ruinsCanvas || !ruinsSite) return;
    const dx = ruinsOX - cpos.x;
    const dy = ruinsOY - cpos.y;
    if (dx > viewW + 8 || dy > viewH + 8 || dx + ruinsCanvas.width < -8 || dy + ruinsCanvas.height < -8) return;
    ctx.drawImage(ruinsCanvas, dx, dy);
    if (!ruinsPortal) return;

    // Depth portal: nested ellipses + orbiting particle ring (decorative — no travel)
    const cx = (ruinsPortal.cx - cpos.x) | 0;
    const cy = (ruinsPortal.cy - cpos.y) | 0;
    const rx = ruinsPortal.rx;
    const ry = ruinsPortal.ry;
    const pulse = 0.55 + 0.45 * Math.sin(t * 2.6);
    const spin = t * 1.35;

    ink.save();
    // Soft outer glow
    for (let g = 4; g >= 1; g--) {
      ink.globalAlpha = 0.06 * g * pulse;
      for (let a = 0; a < 28; a++) {
        const ang = (a / 28) * Math.PI * 2;
        px(
          (cx + Math.cos(ang) * (rx + g + 1)) | 0,
          (cy + Math.sin(ang) * (ry + g + 1)) | 0,
          1,
          1,
          "#4ec8f0"
        );
      }
    }

    // Tunnel depth: stacked ellipses shrinking toward the core
    for (let d = 5; d >= 0; d--) {
      const u = d / 5;
      const erx = rx * (0.28 + u * 0.72);
      const ery = ry * (0.28 + u * 0.72);
      const shift = ((1 - u) * 3 * Math.sin(t * 1.1)) | 0;
      ink.globalAlpha = 0.18 + (1 - u) * 0.22 * pulse;
      const col = d === 0 ? "#e8faff" : d < 2 ? "#a8ecff" : d < 4 ? "#5ad0f0" : "#2a90b8";
      for (let a = 0; a < 36; a++) {
        const ang = (a / 36) * Math.PI * 2 + spin * (0.15 + (1 - u) * 0.35);
        px((cx + shift + Math.cos(ang) * erx) | 0, (cy + Math.sin(ang) * ery) | 0, 1, 1, col);
      }
    }

    // Bright core
    ink.globalAlpha = 0.35 + pulse * 0.45;
    px(cx - 2, cy - 2, 5, 4, "#d8f4ff");
    ink.globalAlpha = 0.7;
    px(cx, cy, 2, 2, "#ffffff");

    // Orbiting particle ring (main moving circle)
    for (let i = 0; i < 22; i++) {
      const ang = spin * 1.7 + (i / 22) * Math.PI * 2;
      const wobble = 1 + 0.08 * Math.sin(t * 4.2 + i);
      const prx = rx * 0.92 * wobble;
      const pry = ry * 0.92 * wobble;
      const sx = (cx + Math.cos(ang) * prx) | 0;
      const sy = (cy + Math.sin(ang) * pry) | 0;
      ink.globalAlpha = 0.55 + 0.45 * Math.sin(t * 5 + i);
      px(sx, sy, i % 3 === 0 ? 2 : 1, 1, i & 1 ? "#ffffff" : "#7ad8f8");
      // Trail particle a bit behind
      const ang2 = ang - 0.18;
      ink.globalAlpha = 0.25;
      px((cx + Math.cos(ang2) * prx * 0.95) | 0, (cy + Math.sin(ang2) * pry * 0.95) | 0, 1, 1, "#4ec8f0");
    }

    // Inner counter-spin sparks
    for (let i = 0; i < 12; i++) {
      const ang = -spin * 2.4 + (i / 12) * Math.PI * 2;
      const rad = 0.35 + 0.2 * Math.sin(t * 3 + i * 0.7);
      ink.globalAlpha = 0.4 + 0.4 * ((Math.sin(t * 6 + i) + 1) / 2);
      px((cx + Math.cos(ang) * rx * rad) | 0, (cy + Math.sin(ang) * ry * rad) | 0, 1, 1, "#e8faff");
    }

    // Rising / drifting motes that change over time
    for (let i = 0; i < 14; i++) {
      const life = (t * 0.45 + i * 0.09) % 1;
      const ang = hash(i, 3) * Math.PI * 2 + t * 0.6;
      const rad = (0.2 + life * 0.85) * (0.7 + 0.3 * Math.sin(t + i));
      const mx = (cx + Math.cos(ang) * rx * rad + Math.sin(t * 2.2 + i) * 1.5) | 0;
      const my = (cy + Math.sin(ang) * ry * rad - life * 6) | 0;
      ink.globalAlpha = (1 - life) * 0.9;
      px(mx, my, life < 0.3 ? 2 : 1, 1, i & 1 ? "#d8f4ff" : "#6ec8e8");
    }
    ink.restore();
  }

  function spawnDailyIdol(temple) {
    const day = utcDayKey();
    dailyLootId = null;
    // Ember cape on temple path (visual cosmetic; cloak stays stealth ability)
    if (playMode !== "speedrun" && !loot.some((L) => L && L.id === "cape" && !L.taken)) {
      loot.push({
        id: "cape",
        x: temple.x - 14,
        y: temple.y + temple.h + 10,
        taken: false,
        born: waveCycle,
        life: Infinity,
        scene: "island",
      });
    }
    // Guests: session-only; accounts: once per UTC day via leaderboard claim helper
    let claimed = false;
    try {
      const local = localStorage.getItem("islebound-daily-claim") || "";
      if (local === day) claimed = true;
    } catch (e) {}
    if (claimed || playMode === "speedrun") return;
    const u = hashStr(day + "-idol");
    const ax = temple.x + temple.w + 8 + ((u * 36) | 0);
    const ay = temple.y + temple.h + 6 + (((1 - u) * 20) | 0);
    loot.push({
      id: "sun_idol",
      x: ax,
      y: ay,
      taken: false,
      born: waveCycle,
      life: Infinity,
      scene: "island",
      daily: day,
    });
    dailyLootId = day;
  }

  function noteDailyClaim(day) {
    dailyClaimedUtc = day || utcDayKey();
    try {
      localStorage.setItem("islebound-daily-claim", dailyClaimedUtc);
    } catch (e) {}
    const api = lbApi();
    if (api && api.claimDailyIdol) api.claimDailyIdol(dailyClaimedUtc);
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

  const WRECK_AIR = [
    { x: 14, y: 88, w: 64, h: 52 },
    { x: 128, y: 92, w: 64, h: 48 },
  ];
  const WRECK_OCTO = { x: 70, y: 204 };
  const WRECK_LADDER_X = 88;
  const WRECK_LADDER_W = 32;

  function diveTransit() {
    return scene === "sub" && (divePhase === "diving" || divePhase === "rising");
  }

  function subRoomSpawn() {
    return { x: 52, y: 60 };
  }

  function floorEntrySpawn() {
    return { x: 36, y: 90 };
  }

  function playerFeetOn(r) {
    if (!r) return false;
    const x0 = player.x + 1;
    const x1 = player.x + player.w - 1;
    const y0 = player.y + player.h - 5;
    const y1 = player.y + player.h - 1;
    return x0 < r.x + r.w && x1 > r.x && y0 < r.y + r.h && y1 > r.y;
  }

  function sharkHitsPlayer(x, y, w, h) {
    return (
      x < player.x + player.w + 12 &&
      x + w > player.x - 12 &&
      y < player.y + player.h + 12 &&
      y + h > player.y - 12
    );
  }

  function scatterFloorSharks() {
    floorSharks = [];
    const lanes = [
      { x: 118, y: 72 },
      { x: 154, y: 108 },
      { x: 132, y: 148 },
    ];
    for (let i = 0; i < lanes.length; i++) {
      let x = lanes[i].x;
      let y = lanes[i].y;
      if (sharkHitsPlayer(x, y, 16, 7)) {
        x = player.x < 150 ? 176 : 104;
        y = player.y > 120 ? 68 : 150;
      }
      if (sharkHitsPlayer(x, y, 16, 7)) {
        x = 168;
        y = 64;
      }
      floorSharks.push({
        x: x,
        y: y,
        dir: i & 1 ? -1 : 1,
        speed: 18 + i * 6,
        w: 16,
        h: 7,
      });
    }
    floorMega = { x: -40, y: 16, dir: 1, speed: 12 };
  }

  function inWreckAir() {
    const mid = playerCenter();
    for (let i = 0; i < WRECK_AIR.length; i++) {
      const r = WRECK_AIR[i];
      if (mid.x >= r.x && mid.x < r.x + r.w && mid.y >= r.y && mid.y < r.y + r.h) return true;
    }
    return false;
  }

  function bubbleNeeded() {
    if (scene === "floor") return true;
    if (scene !== "wreck") return false;
    const feet = player.y + player.h;
    if (feet < 78) return false;
    if (feet < 158 && inWreckAir()) return false;
    return true;
  }

  function bubbleFailing() {
    return (
      bubbleNeeded() &&
      !holdingWand() &&
      !fadeMode &&
      doorCool <= 0 &&
      player.dead <= 0 &&
      !guideOpen &&
      !uiBlocksPlay()
    );
  }

  function subBob(t) {
    if (!subHull) return 0;
    return Math.sin((t == null ? time : t) * 1.8 + (subHull.phase || 0)) * 1.15;
  }

  function paintOffshoreSub(x, y, w, h, waterY) {
    const ix = x | 0;
    const iy = y | 0;
    const line = waterY | 0;
    px(ix + 4, iy + 8, w - 8, 10, "#3a4654");
    px(ix + 8, iy + 5, w - 16, 8, "#5a6878");
    px(ix + 12, iy + 4, w - 26, 4, "#7a8a98");
    px(ix + 2, iy + 10, 4, 6, "#2a3440");
    px(ix + w - 6, iy + 10, 4, 6, "#2a3440");
    px(ix + 16, iy + 8, 2, 2, "#1c242c");
    px(ix + 28, iy + 8, 2, 2, "#1c242c");
    px(ix + 40, iy + 8, 2, 2, "#c9a227");
    const y0 = line > iy + 6 ? line : iy + 6;
    const y1 = iy + 18;
    if (y1 > y0) {
      px(ix + 4, y0, w - 8, y1 - y0, "#0c3e52");
      px(ix + 10, y0 + 1, w - 20, Math.max(1, y1 - y0 - 2), "#14586e");
    }
    if (line >= iy + 4 && line <= iy + 16) px(ix + 6, line, w - 12, 1, "#e7f6ff");
    px(ix + 22, iy + 1, 14, 6, "#163848");
    px(ix + 24, iy + 2, 10, 4, "#8ec8e0");
    px(ix + 26, iy + 3, 6, 2, "#eefaff");
    px(ix + w - 18, iy - 4, 2, 7, "#2a3440");
    px(ix + w - 20, iy - 5, 6, 2, "#5a6878");
    px(ix + w - 16, iy - 4, 2, 2, "#c9a227");
  }

  function drawSubmarine(cpos, t) {
    if (scene !== "island" || !subHull) return;
    const bob = subBob(t);
    const x = subHull.x - cpos.x;
    const y = subHull.y - cpos.y + bob;
    const waterY = subHull.y + ((subHull.h / 2) | 0) - cpos.y;
    drawLitRegion(cpos, { x: x - 4, y: y - 8, w: subHull.w + 10, h: subHull.h + 14 }, null, () =>
      paintOffshoreSub(x, y, subHull.w, subHull.h, waterY)
    );
  }

  function bakeSubInterior() {
    subCanvas = document.createElement("canvas");
    subCanvas.width = SUB_W;
    subCanvas.height = SUB_H;
    const g = subCanvas.getContext("2d");
    g.imageSmoothingEnabled = false;
    pxi(g, 0, 0, SUB_W, SUB_H, "#141a22");
    for (let y = 52; y < SUB_H - 8; y++) {
      for (let x = 8; x < SUB_W - 8; x++) {
        const grate = x % 4 === 0 || y % 4 === 0;
        pxi(g, x, y, 1, 1, grate ? "#2c3846" : "#1a222c");
      }
    }
    pxi(g, 0, 0, SUB_W, 10, "#4a5664");
    pxi(g, 0, 0, 8, SUB_H, "#3a4654");
    pxi(g, SUB_W - 8, 0, 8, SUB_H, "#3a4654");
    pxi(g, 0, SUB_H - 8, SUB_W, 8, "#2a3440");
    pxi(g, 16, 14, SUB_W - 32, 34, "#0c1824");
    pxi(g, 16, 14, SUB_W - 32, 2, "#8a98a4");
    pxi(g, 16, 46, SUB_W - 32, 2, "#5a6874");
    for (let i = 0; i < 4; i++) pxi(g, 44 + i * 36, 14, 2, 34, "#607080");
    pxi(g, SUB_W - 64, 70, 48, 30, "#1c2834");
    pxi(g, SUB_W - 60, 74, 16, 10, "#14384e");
    pxi(g, SUB_W - 40, 74, 18, 10, "#143828");
    pxi(g, SUB_W - 60, 88, 38, 6, "#1a3048");
    pxi(g, SUB_W - 56, 90, 8, 2, "#3ec8e0");
    pxi(g, SUB_W - 44, 90, 8, 2, "#e8c44a");
    pxi(g, 30, 88, 14, 8, "#4a4038");
    pxi(g, 35, 68, 3, 22, "#c9a227");
    pxi(g, 32, 66, 9, 4, "#e8c44a");
    pxi(g, 92, 96, 24, 16, "#0e141c");
    pxi(g, 94, 98, 20, 12, "#243444");
    pxi(g, 100, 102, 8, 4, "#6ec8e0");
    const doorX = (SUB_W / 2 - 8) | 0;
    pxi(g, doorX, SUB_H - 8, 16, 8, "#070c10");
    subSolids.length = 0;
    subSolids.push({ x: 0, y: 0, w: SUB_W, h: 50 });
    subSolids.push({ x: 0, y: 0, w: 8, h: SUB_H });
    subSolids.push({ x: SUB_W - 8, y: 0, w: 8, h: SUB_H });
    subSolids.push({ x: 0, y: SUB_H - 8, w: doorX, h: 8 });
    subSolids.push({ x: doorX + 16, y: SUB_H - 8, w: SUB_W - (doorX + 16), h: 8 });
    subSolids.push({ x: SUB_W - 66, y: 68, w: 52, h: 34 });
    subLever = { x: 30, y: 86, w: 14, h: 12 };
    subHatch = { x: 96, y: 100, w: 16, h: 10 };
    subExit = { x: doorX, y: SUB_H - 8, w: 16, h: 8 };
  }

  function bakeFloorInterior() {
    floorCanvas = document.createElement("canvas");
    floorCanvas.width = FLOOR_W;
    floorCanvas.height = FLOOR_H;
    const g = floorCanvas.getContext("2d");
    g.imageSmoothingEnabled = false;
    for (let y = 0; y < FLOOR_H; y++) {
      for (let x = 0; x < FLOOR_W; x++) {
        const n = hash(x + 2, y + 9);
        let col = "#6a7c74";
        if (y < 46) col = y < 18 ? "#0a2030" : "#123044";
        else if (n > 0.86) col = "#8a9a90";
        else if (n < 0.08) col = "#4a5c56";
        else if ((x + y) % 9 === 0) col = "#5e7068";
        pxi(g, x, y, 1, 1, col);
      }
    }
    for (let i = 0; i < 5; i++) {
      const kx = 24 + i * 28;
      pxi(g, kx, 70 + (i % 3) * 8, 2, 36, "#1a4a38");
      pxi(g, kx - 2, 78 + (i % 2) * 6, 2, 22, "#143828");
      pxi(g, kx + 2, 84, 2, 18, "#1a4030");
    }
    const wx = 196;
    const wy = 72;
    const mouth = 44;
    const hx = wx + mouth;
    pxi(g, hx, wy + 28, 122 - mouth, 40, "#4a3828");
    pxi(g, hx + 6, wy + 16, 96 - mouth, 22, "#5a4632");
    pxi(g, hx + 14, wy + 8, 70 - mouth, 16, "#3a2c20");
    pxi(g, hx + 24, wy - 8, 3, 40, "#2a2018");
    pxi(g, hx + 46, wy - 2, 2, 28, "#2a2018");
    pxi(g, hx + 8, wy + 34, 16, 10, "#6a5438");
    pxi(g, hx + 12, wy + 38, 8, 4, "#e8c44a");
    for (let k = 0; k < 4; k++) pxi(g, hx + 8 + k * 16, wy + 12, 2, 8, "#2a6a48");
    floorHatch = { x: 24, y: FLOOR_H - 30, w: 14, h: 10 };
    floorWreckDoor = { x: wx + 6, y: wy + 30, w: 18, h: 16 };
    pxi(g, floorHatch.x, floorHatch.y, floorHatch.w, floorHatch.h, "#1a2834");
    pxi(g, floorHatch.x + 2, floorHatch.y + 2, floorHatch.w - 4, floorHatch.h - 4, "#6ec8e0");
    pxi(g, floorWreckDoor.x, floorWreckDoor.y, floorWreckDoor.w, floorWreckDoor.h, "#140e0c");
    pxi(g, floorWreckDoor.x + 2, floorWreckDoor.y + 2, floorWreckDoor.w - 4, floorWreckDoor.h - 4, "#2a1810");
    floorSolids.length = 0;
    floorSolids.push({ x: 0, y: 0, w: FLOOR_W, h: 46 });
    floorSolids.push({ x: hx, y: wy + 6, w: 124 - mouth, h: 14 });
    floorSolids.push({ x: hx, y: wy + 20, w: 124 - mouth, h: 40 });
    floorSolids.push({ x: hx, y: wy + 60, w: 124 - mouth, h: 12 });
  }

  function bakeWreckInterior() {
    wreckCanvas = document.createElement("canvas");
    wreckCanvas.width = WRECK_W;
    wreckCanvas.height = WRECK_H;
    const g = wreckCanvas.getContext("2d");
    g.imageSmoothingEnabled = false;
    pxi(g, 0, 0, WRECK_W, WRECK_H, "#102028");
    for (let y = 8; y < WRECK_H - 6; y++) {
      for (let x = 8; x < WRECK_W - 8; x++) {
        const deck = y < 74 ? 0 : y < 154 ? 1 : 2;
        const n = hash(x, y + deck * 3);
        let col = deck === 0 ? "#6a5438" : deck === 1 ? "#4a5a58" : "#2a4450";
        if (n > 0.9) col = deck === 2 ? "#1a3038" : "#7a6244";
        if ((x % 8) === 0) col = "#3a2c20";
        pxi(g, x, y, 1, 1, col);
      }
    }
    for (let i = 0; i < WRECK_AIR.length; i++) {
      const r = WRECK_AIR[i];
      pxi(g, r.x, r.y, r.w, r.h, "#6a8a78");
      pxi(g, r.x + 4, r.y + 4, r.w - 8, 2, "#d8f4ff");
    }
    pxi(g, 0, 0, WRECK_W, 8, "#3a2c20");
    pxi(g, 0, 0, 8, WRECK_H, "#3a2c20");
    pxi(g, WRECK_W - 8, 0, 8, WRECK_H, "#3a2c20");
    pxi(g, 0, 74, WRECK_LADDER_X, 8, "#2a2018");
    pxi(g, WRECK_LADDER_X + WRECK_LADDER_W, 74, WRECK_W - (WRECK_LADDER_X + WRECK_LADDER_W), 8, "#2a2018");
    pxi(g, 0, 154, WRECK_LADDER_X, 8, "#2a2018");
    pxi(g, WRECK_LADDER_X + WRECK_LADDER_W, 154, WRECK_W - (WRECK_LADDER_X + WRECK_LADDER_W), 8, "#2a2018");
    pxi(g, WRECK_LADDER_X, 68, WRECK_LADDER_W, 18, "#5a4632");
    pxi(g, WRECK_LADDER_X, 148, WRECK_LADDER_W, 18, "#5a4632");
    pxi(g, 24, 188, 14, 12, "#6b3f1f");
    pxi(g, 148, 176, 16, 14, "#5a3418");
    pxi(g, 156, 28, 22, 14, "#8a5a32");
    pxi(g, 158, 26, 18, 4, "#c9a227");
    pxi(g, 164, 30, 4, 4, "#e8c44a");
    const exitX = 168;
    pxi(g, exitX, WRECK_H - 12, 16, 10, "#071018");
    wreckSolids.length = 0;
    wreckSolids.push({ x: 0, y: 0, w: WRECK_W, h: 8 });
    wreckSolids.push({ x: 0, y: 0, w: 8, h: WRECK_H });
    wreckSolids.push({ x: WRECK_W - 8, y: 0, w: 8, h: WRECK_H });
    wreckSolids.push({ x: 0, y: 74, w: WRECK_LADDER_X, h: 8 });
    wreckSolids.push({ x: WRECK_LADDER_X + WRECK_LADDER_W, y: 74, w: WRECK_W - (WRECK_LADDER_X + WRECK_LADDER_W), h: 8 });
    wreckSolids.push({ x: 0, y: 154, w: WRECK_LADDER_X, h: 8 });
    wreckSolids.push({
      x: WRECK_LADDER_X + WRECK_LADDER_W,
      y: 154,
      w: WRECK_W - (WRECK_LADDER_X + WRECK_LADDER_W),
      h: 8,
    });
    wreckSolids.push({ x: 22, y: 186, w: 16, h: 14 });
    wreckSolids.push({ x: 146, y: 174, w: 18, h: 16 });
    wreckChest = { x: 154, y: 24, w: 26, h: 20 };
    wreckExit = { x: exitX, y: WRECK_H - 16, w: 16, h: 12 };
  }

  function updateDive(dt) {
    return;
    if (diveTipT > 0) diveTipT = Math.max(0, diveTipT - dt);
    const onLever = scene === "sub" && playerFeetOn(subLever);
    const leverLocked = fadeMode || player.dead > 0 || diveTransit();
    if (!onLever) diveLeverHeld = false;
    else if (leverLocked) diveLeverHeld = true;
    else if (!diveLeverHeld && doorCool <= 0) {
      if (divePhase === "docked") {
        divePhase = "diving";
        diveT = 0;
        diveTip = "DIVING";
        diveTipT = 1.4;
        diveLeverHeld = true;
      } else if (divePhase === "down") {
        divePhase = "rising";
        diveT = 0;
        diveTip = "RISING";
        diveTipT = 1.4;
        diveLeverHeld = true;
      }
    }
    if (divePhase === "diving") {
      diveT += dt;
      if (diveT >= 4.6) {
        divePhase = "down";
        diveT = 0;
        diveTip = "HATCH OPEN";
        diveTipT = 1.8;
      }
    } else if (divePhase === "rising") {
      diveT += dt;
      if (diveT >= 3.2) {
        divePhase = "docked";
        diveT = 0;
        diveTip = "SURFACED";
        diveTipT = 1.6;
      }
    }
    if (scene === "floor") {
      for (let i = 0; i < floorSharks.length; i++) {
        const s = floorSharks[i];
        s.x += s.dir * s.speed * dt;
        if (s.x < 100) s.dir = 1;
        if (s.x > 176) s.dir = -1;
        s.y += Math.sin(time * 1.4 + i) * 8 * dt;
        if (s.y < 58) s.y = 58;
        if (s.y > FLOOR_H - 36) s.y = FLOOR_H - 36;
      }
      floorMega.x += floorMega.dir * floorMega.speed * dt;
      if (floorMega.x > FLOOR_W + 30) floorMega.x = -48;
    }
    if (
      scene === "floor" &&
      !fadeMode &&
      doorCool <= 0 &&
      player.dead <= 0 &&
      !guideOpen &&
      !uiBlocksPlay()
    ) {
      for (let i = 0; i < floorSharks.length; i++) {
        const s = floorSharks[i];
        if (playerHits({ x: s.x, y: s.y, w: s.w, h: s.h })) {
          diveTip = "SHARK";
          diveTipT = 1.6;
          beginFade("sub", subRoomSpawn());
          break;
        }
      }
    }
    if (scene === "wreck" && !fadeMode && doorCool <= 0 && player.dead <= 0) {
      const ox = WRECK_OCTO.x;
      const oy = WRECK_OCTO.y;
      const mid = playerCenter();
      const dist = Math.hypot(mid.x - ox, mid.y - oy);
      if (dist < 22 && dist > 0.01) {
        const nx = (mid.x - ox) / dist;
        const ny = (mid.y - oy) / dist;
        let ix = 0;
        let iy = 0;
        if (keys.a || keys.arrowleft) ix -= 1;
        if (keys.d || keys.arrowright) ix += 1;
        if (keys.w || keys.arrowup) iy -= 1;
        if (keys.s || keys.arrowdown) iy += 1;
        const walkingOut = ix * nx + iy * ny > 0.2;
        if (!walkingOut) {
          const step = (dist < 12 ? 40 : 18) * dt;
          if (canMove(player.x + nx * step, player.y)) player.x += nx * step;
          if (canMove(player.x, player.y + ny * step)) player.y += ny * step;
        }
      }
      if (!sunkenTaken && wreckChest && playerHits(wreckChest)) {
        sunkenTaken = true;
        loot.push({
          id: "sunken_chest",
          x: wreckChest.x + 4,
          y: wreckChest.y - 2,
          taken: false,
          born: waveCycle,
          life: Infinity,
          scene: "wreck",
        });
        diveTip = "SUNKEN CHEST";
        diveTipT = 1.8;
      }
    }
  }

  function updateMaskGoal() {
    if (playMode !== "speedrun" || srCat !== "mask") return;
    if (!speedrunActive() || !srTiming || uiScreen === "finish") return;
    if (scene !== "temple" || !templePedestal || templeMaskTaken) return;
    const mid = playerCenter();
    if (Math.hypot(mid.x - (templePedestal.x + 8), mid.y - (templePedestal.y + 4)) >= 18) return;
    templeMaskTaken = true;
    let has = cosmetics.face === "jade_mask";
    if (!has) {
      for (let i = 0; i < inventory.length; i++) {
        if (inventory[i] && inventory[i].id === "jade_mask") has = true;
      }
    }
    if (!has) {
      let placed = false;
      for (let i = 0; i < inventory.length; i++) {
        if (!inventory[i]) {
          inventory[i] = { id: "jade_mask", count: 1 };
          placed = true;
          break;
        }
      }
      if (!placed) inventory[0] = { id: "jade_mask", count: 1 };
    }
    captureReplayFrame(true);
    finishSpeedrun();
  }

  function drawAirBubble(cpos) {
    return;
    if (!holdingWand() || !bubbleNeeded()) return;
    const bob = Math.sin(time * 5) | 0;
    const x = (player.x - cpos.x + 1) | 0;
    const y = (player.y - cpos.y - 8 + bob) | 0;
    px(x + 1, y, 4, 1, "#d8f4ff");
    px(x, y + 1, 6, 3, "#9ad8f0");
    px(x + 1, y + 4, 4, 1, "#eefaff");
    px(x + 2, y - 2, 1, 1, "#ffffff");
  }

  function drawDiveWorld(cpos, t) {
    return;
    if (scene === "sub") {
      const win = { x: 18, y: 16, w: SUB_W - 36, h: 28 };
      const x = (win.x - cpos.x) | 0;
      const y = (win.y - cpos.y) | 0;
      let u = 0;
      if (divePhase === "diving") u = Math.min(1, diveT / 4.6);
      else if (divePhase === "rising") u = 1 - Math.min(1, diveT / 3.2);
      else if (divePhase === "down") u = 1;
      const r = (46 + (8 - 46) * u) | 0;
      const g = (120 + (28 - 120) * u) | 0;
      const b = (160 + (42 - 160) * u) | 0;
      px(x, y, win.w, win.h, "rgb(" + r + "," + g + "," + b + ")");
      if (divePhase === "down") {
        px(x, y + win.h - 6, win.w, 6, "#5a6e66");
        px(x + 20, y + 8, 2, 10, "#1a4a38");
      } else if (!diveTransit()) {
        const bands = (t * 10) | 0;
        for (let i = 0; i < win.w; i += 6) {
          const yy = y + ((i + bands) % win.h);
          px(x + i, yy, 2, 1, "#d8f4ff");
        }
      }
    }
    if (scene === "floor") {
      const rays = (t * 6) | 0;
      ink.save();
      ink.globalAlpha = 0.28;
      for (let i = 0; i < 4; i++) {
        const rx = (40 + i * 70 - cpos.x + (rays % 8)) | 0;
        px(rx, (48 - cpos.y) | 0, 2, 90, "#d8f4ff");
      }
      ink.restore();
      const mx = (floorMega.x - cpos.x) | 0;
      const my = (floorMega.y - cpos.y) | 0;
      px(mx, my, 40, 8, "#1a2830");
      px(mx + 32, my - 2, 10, 5, "#243840");
      px(mx + 8, my - 4, 4, 4, "#2a3844");
      px(mx + 6, my + 2, 2, 2, "#e8c44a");
      px(mx + 14, my + 7, 8, 2, "#121c22");
      for (let i = 0; i < floorSharks.length; i++) {
        const s = floorSharks[i];
        const sx = (s.x - cpos.x) | 0;
        const sy = (s.y - cpos.y) | 0;
        px(sx, sy + 2, 14, 4, "#3a4e5c");
        px(sx + (s.dir > 0 ? 12 : -2), sy + 2, 4, 3, "#2a3c48");
        px(sx + 5, sy - 1, 2, 3, "#4a6270");
        px(sx + 3, sy + 3, 1, 1, "#d8f4ff");
      }
    }
    if (scene === "wreck") {
      for (let i = 0; i < 3; i++) {
        const sx = (28 + i * 60 - cpos.x) | 0;
        const sy = (10 + i * 78 - cpos.y) | 0;
        ink.save();
        ink.globalAlpha = 0.22;
        px(sx, sy, 3, 48, "#e8f6ff");
        ink.restore();
      }
      const ox = (WRECK_OCTO.x - cpos.x) | 0;
      const oy = (WRECK_OCTO.y - 8 - cpos.y) | 0;
      px(ox, oy, 10, 8, "#6a3a78");
      px(ox + 2, oy + 2, 2, 2, "#f4fbff");
      const mid = playerCenter();
      if (Math.hypot(mid.x - WRECK_OCTO.x, mid.y - WRECK_OCTO.y) < 36) {
        const tx = (mid.x - cpos.x) | 0;
        const ty = (mid.y - cpos.y) | 0;
        px(ox + 8, oy + 4, Math.max(2, tx - ox), 2, "#4a2860");
      }
      if (!sunkenTaken && wreckChest) {
        const cx = (wreckChest.x - cpos.x) | 0;
        const cy = (wreckChest.y - cpos.y) | 0;
        const pulse = 0.55 + Math.sin(t * 4) * 0.25;
        ink.save();
        ink.globalAlpha = pulse;
        px(cx + 4, cy - 4, 10, 2, "#e8c44a");
        ink.restore();
      }
    }
  }

  function drawDiveHud() {
    return;
    if (scene !== "sub" && scene !== "floor" && scene !== "wreck") return;
    if (uiBlocksPlay()) return;
    const uiW = canvas.width / SCALE_UI;
    if (diveTipT > 0 && diveTip) drawPixText(diveTip, (uiW / 2) | 0, 10, "#f3e2c4", "center");
    else if (diveTransit()) {
      drawPixText(divePhase === "diving" ? "DIVING" : "RISING", (uiW / 2) | 0, 10, "#9ad8f0", "center");
    }
    if (bubbleNeeded() && holdingWand()) drawPixText("BUBBLE", uiW - 6, 8, "#9ad8f0", "right");
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
    // T-head + slip at the outer tip of the finger pier (south end, clear of the offshore sub).
    const berthDeck = { x: finger.x - 8, y: finger.y + finger.h - 10, w: 34, h: 12 };
    boatBerthDeck = berthDeck;
    boatBerth = {
      x: finger.x - 2,
      y: berthDeck.y + berthDeck.h + 1,
      w: 22,
      h: 10,
      face: 1,
    };
    const berthPosts = {
      x: boatBerth.x - 5,
      y: boatBerth.y - 2,
      w: boatBerth.w + 10,
      h: boatBerth.h + 8,
    };
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
    subHull = { x: pier.x + pier.w + 64, y: 0, w: 58, h: 22, phase: 1.1 };
    subHull.y = restShoreY(subHull.x + 24) + 160 - ((subHull.h / 2) | 0);
    const subPad = { x: subHull.x - 2, y: subHull.y - 4, w: subHull.w + 4, h: subHull.h + 8 };
    dockWood.length = 0;
    dockWood.push(pier, finger, berthDeck);
    deckPads.length = 0;
    deckPads.push(pier, finger, berthDeck, ramp, moorDeck, moorPlank);
    walkPads.length = 0;
    islandSolids.length = 0;
    keepouts.length = 0;
    walkPads.push(pier, finger, berthDeck, boatA, rowA, rowB, ramp, moorDeck, moorPlank, subPad);
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
    subDoor = null;
    subIslandExit = null;
    foamBlockers.length = 0;
    dockBlit.length = 0;
    foamBlockers.push(pier, finger, berthDeck, berthPosts, boatA, rowA, rowB, ramp, moorDeck, moorHull, moorPlank);
    foamBlockers.push({ x: shop.x, y: shop.y, w: shop.w, h: shop.h });
    foamBlockers.push({ x: hut.x, y: hut.y, w: hut.w, h: hut.h });
    foamBlockers.push({ x: pier.x - 2, y: pier.y + pier.h - 2, w: pier.w + 4, h: 26 });
    foamBlockers.push({ x: finger.x - 2, y: finger.y, w: finger.w + 6, h: finger.h + 36 });
    function padKeep(r, pad) {
      keepouts.push({ x: r.x - pad, y: r.y - pad, w: r.w + pad * 2, h: r.h + pad * 2 });
    }
    padKeep(shop, 24);
    padKeep(hut, 18);
    padKeep(pier, 18);
    padKeep(ramp, 16);
    padKeep(finger, 20);
    padKeep(berthDeck, 12);
    padKeep(boatA, 18);
    padKeep(rowA, 14);
    padKeep(rowB, 14);
    padKeep(moorHull, 10);
    padKeep(subHull, 6);
    dockBlit.push({ x: ramp.x, y: ramp.y, w: ramp.w + 4, h: ramp.h + 4 });
    dockBlit.push({ x: moorPlank.x - 2, y: moorPlank.y - 2, w: moorPlank.w + 4, h: moorPlank.h + 4 });
    dockBlit.push({ x: moorHull.x - 2, y: moorDeck.y - 2, w: moorHull.w + 4, h: moorHull.h + 6 });
    dockBlit.push({ x: pier.x - 2, y: pier.y - 2, w: pier.w + 4, h: pier.h + 28 });
    dockBlit.push({ x: finger.x - 10, y: finger.y - 2, w: finger.w + 20, h: finger.h + 40 });
    function paintBoatBerth(g) {
      paintPlanks(g, berthDeck.x, berthDeck.y, berthDeck.w, berthDeck.h, false);
      pxi(g, berthDeck.x, berthDeck.y, berthDeck.w, 1, "#5a3420");
      pxi(g, berthDeck.x, berthDeck.y + berthDeck.h - 1, berthDeck.w, 1, "#3a2414");
      // Tire bumpers along the water edge
      for (let i = 0; i < 4; i++) {
        const bx = berthDeck.x + 4 + i * 7;
        pxi(g, bx, berthDeck.y + berthDeck.h - 2, 4, 3, "#2a1810");
        pxi(g, bx + 1, berthDeck.y + berthDeck.h - 1, 2, 1, "#5a3420");
      }
      // Slip posts + rope line so the berth reads as a marked slip
      paintPost(g, boatBerth.x - 4, boatBerth.y - 2, 16);
      paintPost(g, boatBerth.x + boatBerth.w + 2, boatBerth.y - 2, 16);
      paintPost(g, berthDeck.x + 1, berthDeck.y - 2, 14);
      paintPost(g, berthDeck.x + berthDeck.w - 3, berthDeck.y - 2, 14);
      pxi(g, boatBerth.x - 2, boatBerth.y + 3, boatBerth.w + 4, 1, "#4a2e16");
      pxi(g, boatBerth.x - 1, boatBerth.y + 4, boatBerth.w + 2, 1, "#6b3f1f");
      for (let i = 0; i < 5; i++) {
        pxi(g, boatBerth.x + 2 + i * 4, boatBerth.y + 2, 2, 1, i & 1 ? "#c9a227" : "#8a5a32");
      }
    }
    function paintDockBits(g) {
      paintPlanks(g, pier.x, pier.y, pier.w, pier.h, false);
      paintRamp(g, ramp.x, ramp.y, ramp.w, ramp.h);
      paintPlanks(g, finger.x, finger.y, finger.w, finger.h, true);
      for (let i = 0; i < 6; i++) {
        paintPost(g, pier.x + 8 + i * 28, rest + 6, 16 + (i & 1) * 5);
      }
      paintPost(g, finger.x + 1, rest + 78, 20);
      paintPost(g, finger.x + 15, rest + 84, 16);
      paintBoatBerth(g);
      paintPlanks(g, moorPlank.x, moorPlank.y, moorPlank.w, moorPlank.h, true);
      pxi(g, moorPlank.x, moorPlank.y, 1, moorPlank.h, "#3a2414");
      pxi(g, moorPlank.x + moorPlank.w - 1, moorPlank.y, 1, moorPlank.h, "#3a2414");
      paintMooredBoat(g, moorDeck, moorDoor);
    }
    const g = landGfx();
    paintDockBits(g);
    for (let i = 0; i < 6; i++) {
      const postX = pier.x + 8 + i * 28;
      const postY = rest + 6;
      dockLamps.push({ x: postX, y: postY - 3 });
    }
    dockLamps.push({ x: finger.x + 1, y: rest + 75 });
    dockLamps.push({ x: finger.x + 15, y: rest + 81 });
    dockLamps.push({ x: boatBerth.x - 4, y: boatBerth.y - 5 });
    dockLamps.push({ x: boatBerth.x + boatBerth.w + 2, y: boatBerth.y - 5 });
    const deckLeft = Math.min(ramp.x, pier.x, finger.x, berthDeck.x, moorHull.x) - 2;
    const deckTop = Math.min(ramp.y, pier.y, finger.y, moorHull.y) - 2;
    const deckRight = Math.max(ramp.x + ramp.w, pier.x + pier.w, finger.x + finger.w, berthDeck.x + berthDeck.w, moorHull.x + moorHull.w) + 4;
    const deckBottom =
      Math.max(
        ramp.y + ramp.h,
        pier.y + pier.h,
        finger.y + finger.h,
        berthPosts.y + berthPosts.h,
        rest + 102,
        moorHull.y + moorHull.h
      ) + 2;
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
    harborDrop = { x: boatBerth.x, y: boatBerth.y };
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
    bakeSubInterior();
    bakeFloorInterior();
    bakeWreckInterior();
    placeTemple(pier);
    placeMountainsIntoWorld();
    placeRiverRuins(pier);
    placeJunglePond(pier);
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
    const harbor = [
      { x: pier.x + 48, y: pier.y + 4 },
      { x: pier.x + 40, y: rest - player.h - 10 },
    ];
    player.x = harbor[0].x;
    player.y = harbor[0].y;
    for (let i = 0; i < harbor.length; i++) {
      if (dryFooting(harbor[i].x, harbor[i].y)) {
        player.x = harbor[i].x;
        player.y = harbor[i].y;
        break;
      }
    }
    doorCool = 0.6;
    spawnX = player.x;
    spawnY = player.y;
    placeSouthBeachLoot();
  }

  function beginFade(nextScene, spawn) {
    if (fadeMode) return;
    if (nextScene === "sub" || nextScene === "floor" || nextScene === "wreck") return;
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
    player.facing =
      next.scene === "shop" ||
      next.scene === "fish" ||
      next.scene === "cabin" ||
      next.scene === "temple" ||
      next.scene === "hub" ||
      next.scene === "sub" ||
      next.scene === "floor" ||
      next.scene === "wreck" ||
      next.scene === "vein" ||
      (rome && rome.isScene(next.scene))
        ? 1
        : -1;
    if (
      next.scene === "cabin" ||
      next.scene === "temple" ||
      next.scene === "hub" ||
      next.scene === "sub" ||
      next.scene === "floor" ||
      next.scene === "wreck" ||
      next.scene === "vein" ||
      (rome && rome.isScene(next.scene))
    ) {
      player.aboard = false;
    }
    if (rome && rome.isScene(next.scene)) rome.onEnter(next.scene);
    if (next.scene === "floor") scatterFloorSharks();
    if (next.scene === "vein") {
      ensureVein();
      if (vein) vein.onEnter();
      cloakOn = false;
    }
    doorCool = 0.85;
    camera.x = player.x + player.w / 2 - viewW / 2;
    camera.y = player.y + player.h / 2 - viewH * 0.36;
    if (next.scene === "vein" && vein) vein.lockCam();
    else clampCamera();
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
    if (scene === "island" && templeDoor && playerHits(templeDoor)) {
      const spawnX0 = templeExit ? templeExit.x + 2 : ((TEMPLE_W / 2 - 4) | 0);
      beginFade("temple", { x: spawnX0, y: TEMPLE_H - 40 });
    }
    if (scene === "temple" && templeExit && playerHits(templeExit)) {
      beginFade("island", { x: templeIslandExit.x, y: templeIslandExit.y });
    }
    if (scene === "island" && ruinsPortal && rome && carriesPortalLeech() && playerHits(ruinsPortal)) {
      ensureRome();
      if (rome) rome.enterFromPortal();
    }
    if (scene === "island" && veinDoor && playerHits(veinDoor)) {
      ensureVein();
      beginFade("vein", { x: 28, y: (vein ? vein.ROOM_H : 152) - 42 });
    }
    if (scene === "vein" && vein && vein.getExitPad() && playerHits(vein.getExitPad())) {
      const ex = veinIslandExit || vein.getIslandExit();
      if (ex) beginFade("island", { x: ex.x, y: ex.y });
    }
    if (scene === "hub" && hubExit && playerHits(hubExit) && playMode === "hub") {
      leaveHubMode();
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
    if (rod.phase === "idle" || !player.aboard || !activeCraft()) return;
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
    drawPondEelTease(cpos, bobX, bobY);
  }

  /** Rare waterfall eel — dark undulating shape under the bob before the pull-up. */
  function drawPondEelTease(cpos, bobX, bobY) {
    if (aboardKind !== "dinghy" || rod.catchId !== "waterfall_eel") return;
    if (rod.phase !== "wait") return;
    const remain = rod.wait - rod.t;
    if (remain > 3.2 || remain < 0) return;
    const u = 1 - remain / 3.2;
    const sway = Math.sin(time * 7.2) * (2 + u * 2);
    const rise = (u * 5) | 0;
    const ex = (bobX + sway) | 0;
    const ey = (bobY + 5 - rise) | 0;
    ink.save();
    ink.globalAlpha = 0.35 + u * 0.45;
    // Long dark body with a pale eye flash
    for (let i = 0; i < 7; i++) {
      const ox = ((Math.sin(time * 9 + i * 0.7) * 1.2) | 0) + i;
      const oy = ((i * 0.6) | 0) + ((Math.sin(time * 5 + i) * 0.8) | 0);
      px(ex + ox - 3, ey + oy, 2, 1, i % 2 ? "#1a3a38" : "#0e2826");
    }
    if (u > 0.55) px(ex + 4, ey, 1, 1, "#c8ffe8");
    ink.restore();
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
    if (id === "waterfall_eel") {
      px(x, y + 2, 6, 2, "#1a4844");
      px(x + 1, y + 1, 5, 1, "#2a6860");
      px(x + 5, y + 3, 2, 1, "#0e302c");
      px(x + 6, y + 2, 1, 1, "#c8ffe8");
      px(x, y + 3, 1, 2, "#143834");
      return true;
    }
    if (id === "portal_leech") {
      px(x + 1, y + 1, 5, 4, "#3a1a58");
      px(x + 2, y, 3, 1, "#6a38a0");
      px(x, y + 2, 1, 2, "#2a1040");
      px(x + 6, y + 2, 1, 2, "#2a1040");
      px(x + 2, y + 2, 2, 2, "#c878ff");
      px(x + 3, y + 3, 1, 1, "#f0d0ff");
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
    if (id === "chest" || id === "sunken_chest") {
      const wood = id === "sunken_chest" ? "#5a6a62" : "#8a5a32";
      const band = id === "sunken_chest" ? "#7ec8b0" : "#c9a227";
      px(x, y + 2, 8, 5, wood);
      px(x + 1, y + 1, 6, 2, band);
      px(x + 3, y + 3, 2, 2, "#e8c44a");
      px(x, y + 6, 8, 1, "#243830");
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
    if (id === "jade_mask") {
      px(x + 1, y + 1, 5, 5, "#2a8a4a");
      px(x + 2, y + 2, 3, 2, "#3ec86a");
      px(x + 1, y + 3, 1, 1, "#0e3a20");
      px(x + 4, y + 3, 1, 1, "#0e3a20");
      px(x + 3, y + 2, 1, 1, "#b8f0c8");
      return true;
    }
    if (id === "straw_hat") {
      px(x, y + 2, 8, 1, "#c4a06a");
      px(x + 1, y + 3, 6, 2, "#e8c44a");
      px(x + 2, y + 4, 4, 1, "#8a5a32");
      return true;
    }
    if (id === "crown") {
      px(x + 1, y + 1, 1, 3, "#c9a227");
      px(x + 3, y, 1, 2, "#e8c44a");
      px(x + 5, y + 1, 1, 3, "#c9a227");
      px(x + 1, y + 4, 6, 1, "#e8c44a");
      return true;
    }
    if (id === "beta_crown") {
      px(x + 1, y + 1, 1, 3, "#c9a227");
      px(x + 3, y, 1, 2, "#e8c44a");
      px(x + 5, y + 1, 1, 3, "#c9a227");
      px(x + 1, y + 4, 6, 1, "#e8c44a");
      px(x + 1, y + 2, 1, 1, "#c43a48");
      px(x + 3, y + 1, 1, 1, "#c43a48");
      px(x + 5, y + 2, 1, 1, "#c43a48");
      return true;
    }
    if (id === "cape") {
      px(x + 1, y + 1, 4, 6, "#c43a28");
      px(x, y + 2, 2, 6, "#8a2020");
      px(x + 2, y + 2, 2, 4, "#e04a32");
      px(x + 3, y + 3, 1, 2, "#f0a060");
      return true;
    }
    if (id === "job_app_cloak") {
      px(x + 1, y + 1, 5, 6, "#e8d5b0");
      px(x, y + 2, 2, 5, "#c4a574");
      px(x + 2, y + 2, 3, 2, "#f3e2c4");
      px(x + 3, y + 5, 2, 1, "#5c3a21");
      return true;
    }
    if (id === "american_cloak") {
      px(x, y + 1, 7, 2, "#c43a48");
      px(x, y + 3, 7, 1, "#f4f4f8");
      px(x, y + 4, 7, 2, "#c43a48");
      px(x, y + 1, 3, 3, "#3a5aaa");
      return true;
    }
    if (id === "jelly_cape") {
      px(x + 1, y + 1, 5, 3, "#a8d8f0");
      px(x + 2, y, 3, 1, "#d8f0ff");
      px(x + 1, y + 4, 1, 3, "#78c0e8");
      px(x + 3, y + 4, 1, 3, "#58a8d8");
      px(x + 5, y + 4, 1, 3, "#78c0e8");
      return true;
    }
    if (id === "stop_pre_flag") {
      px(x, y + 1, 7, 6, "#1a1a1a");
      px(x + 1, y + 2, 5, 1, "#f4f4f8");
      px(x + 1, y + 4, 5, 1, "#f4f4f8");
      px(x + 2, y + 3, 1, 1, "#e8c44a");
      px(x + 4, y + 3, 1, 1, "#e8c44a");
      return true;
    }
    if (id === "cloak") {
      px(x + 1, y + 1, 4, 6, "#2a4470");
      px(x, y + 2, 2, 6, "#1a2848");
      px(x + 2, y + 2, 2, 4, "#3a5080");
      return true;
    }
    if (id === "sun_idol") {
      px(x + 2, y, 3, 1, "#ffe08a");
      px(x + 1, y + 1, 5, 4, "#e8c44a");
      px(x + 2, y + 2, 3, 2, "#fff3c0");
      px(x + 2, y + 5, 3, 2, "#c9a227");
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
    if (id === "waterfall_eel") return { body: "#1a4844", tail: "#0e302c", hi: "#c8ffe8" };
    if (id === "portal_leech") return { body: "#3a1a58", tail: "#2a1040", hi: "#c878ff" };
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
    if (!landReady()) return;
    const sx = Math.max(0, cpos.x | 0);
    const sy = Math.max(0, cpos.y | 0);
    const ex = Math.min(WORLD_W, sx + Math.ceil(viewW) + 1);
    const ey = Math.min(WORLD_H, sy + Math.ceil(viewH) + 1);
    if (ex <= sx || ey <= sy) return;
    const sh = ey - sy;
    for (let i = 0; i < landChunks.length; i++) {
      const ch = landChunks[i];
      const x0 = Math.max(sx, ch.x0);
      const x1 = Math.min(ex, ch.x0 + ch.w);
      if (x1 <= x0) continue;
      const sw = x1 - x0;
      ctx.drawImage(ch.canvas, x0 - ch.x0, sy, sw, sh, x0 - cpos.x, sy - cpos.y, sw, sh);
    }
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
    if (!landReady()) return;
    for (let i = 0; i < list.length; i++) {
      const r = list[i];
      const sx = Math.max(r.x, cpos.x | 0) | 0;
      const sy = Math.max(r.y, cpos.y | 0) | 0;
      const ex = Math.min(r.x + r.w, (cpos.x + viewW) | 0);
      const ey = Math.min(r.y + r.h, (cpos.y + viewH) | 0);
      if (ex <= sx || ey <= sy) continue;
      const sh = ey - sy;
      for (let j = 0; j < landChunks.length; j++) {
        const ch = landChunks[j];
        const x0 = Math.max(sx, ch.x0);
        const x1 = Math.min(ex, ch.x0 + ch.w);
        if (x1 <= x0) continue;
        const sw = x1 - x0;
        ctx.drawImage(ch.canvas, x0 - ch.x0, sy, sw, sh, x0 - cpos.x, sy - cpos.y, sw, sh);
      }
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

  /**
   * Cloth behind the sprite. Each row is its own segment: pinned at the
   * shoulders, then a slower trailing edge so the hem ripples instead of sliding as a block.
   * +x is forward (facing scale), so the sheet hangs toward -x.
   */
  function drawCapeSheet(id, amp, spd, phase) {
    if (
      id !== "cape" &&
      id !== "cloak" &&
      id !== "norway_flag" &&
      id !== "jamaica_flag" &&
      id !== "us_flag" &&
      id !== "job_app_cloak" &&
      id !== "american_cloak" &&
      id !== "jelly_cape" &&
      id !== "stop_pre_flag"
    ) {
      return;
    }
    const ember = id === "cape";
    const norway = id === "norway_flag";
    const jamaica = id === "jamaica_flag";
    const usa = id === "american_cloak" || id === "us_flag";
    const jelly = id === "jelly_cape";
    const job = id === "job_app_cloak";
    const stopPre = id === "stop_pre_flag";
    const flag = norway || jamaica || usa || stopPre;
    const body = ember
      ? ["#f06040", "#e04a32", "#c43a28", "#a82820", "#8a2020", "#6a1410"]
      : norway
        ? ["#e84a58", "#d02038", "#ba0c2f", "#a01028", "#8a1020", "#6a0c18"]
        : jamaica
          ? ["#2a8a34", "#1e7028", "#186020", "#e8c44a", "#1a1a1a", "#0c0c0c"]
          : usa
            ? ["#c43a48", "#ba2030", "#f4f4f8", "#3a5aaa", "#2a4a88", "#1a3868"]
            : stopPre
              ? ["#2a2a2a", "#1a1a1a", "#101010", "#0c0c0c", "#080808", "#040404"]
              : jelly
                ? ["#d8f0ff", "#a8d8f0", "#78c0e8", "#58a8d8", "#3a88c0", "#2868a0"]
                : job
                  ? ["#f3e2c4", "#e8d5b0", "#d4c098", "#c4a574", "#8a6a42", "#5c3a21"]
                  : ["#3a5080", "#2a4470", "#243860", "#1e3058", "#1a2848", "#101828"];
    const edge = ember
      ? "#4a100c"
      : norway
        ? "#4a0810"
        : jamaica
          ? "#0a280c"
          : usa
            ? "#2a1020"
            : stopPre
              ? "#040404"
              : jelly
                ? "#1a4868"
                : job
                  ? "#3a2414"
                  : "#0c1420";
    const fold = ember
      ? "#f0a060"
      : norway || usa
        ? "#f4f4f8"
        : jamaica
          ? "#e8c44a"
          : stopPre
            ? "#f4f4f8"
            : jelly
              ? "#e8ffff"
              : job
                ? "#fff8e8"
                : "#6a88b0";
    const rows = flag || jelly ? 14 : ember ? 11 : 12;
    const useAmp = flag || jelly ? amp * 1.35 : amp;
    for (let i = 0; i < rows; i++) {
      const u = i / (rows - 1);
      const pin = i < 2 ? 0.1 : 0.22 + u * u;
      const wave = Math.sin(time * spd + phase + i * 0.68) * useAmp * pin;
      const wave2 = Math.sin(time * spd * 0.61 + phase * 1.3 + i * 1.15 + 1.8) * useAmp * u;
      const drag = -u * useAmp * 0.85;
      const ox = (wave + drag) | 0;
      const y = -6 + i;
      let w = (flag || jelly ? 4 : 3) + ((i * (flag || jelly ? 0.55 : 0.42)) | 0);
      if (wave2 > 0.35) w += 1;
      const x = -4 - ((u * (flag || jelly ? 3.1 : 2.2)) | 0) + ox;
      const col = body[Math.min(body.length - 1, (u * (body.length - 1)) | 0)];
      px(x, y, w, 1, col);
      if (norway) {
        const crossRow = i >= 5 && i <= 8;
        const mid = x + ((w / 2) | 0);
        if (crossRow) px(x, y, w, 1, i === 6 || i === 7 ? "#00205b" : "#f4f4f8");
        else {
          px(mid - 1, y, 2, 1, "#f4f4f8");
          px(mid, y, 1, 1, "#00205b");
        }
        if ((i & 1) === 0) px(x + w - 1, y, 1, 1, fold);
      } else if (jamaica) {
        // Green / gold / black bands
        if (i < 5) px(x, y, w, 1, "#1e8a34");
        else if (i < 9) px(x, y, w, 1, "#e8c44a");
        else px(x, y, w, 1, "#1a1a1a");
        if ((i & 1) === 0) px(x + w - 1, y, 1, 1, fold);
      } else if (usa) {
        if (i < 4) {
          px(x, y, w, 1, i & 1 ? "#f4f4f8" : "#c43a48");
          px(x, y, Math.max(2, (w / 3) | 0), 1, "#3a5aaa");
        } else {
          px(x, y, w, 1, i & 1 ? "#f4f4f8" : "#c43a48");
        }
      } else if (stopPre) {
        px(x, y, w, 1, "#1a1a1a");
        if (i === 3 || i === 4) px(x + 1, y, Math.max(2, w - 2), 1, "#f4f4f8");
        if (i === 7 || i === 8) px(x + 1, y, Math.max(2, w - 2), 1, "#f4f4f8");
        if (i === 5 || i === 6) px(x + ((w / 2) | 0), y, 1, 1, "#e8c44a");
        if ((i & 1) === 0) px(x + w - 1, y, 1, 1, fold);
      } else if (jelly) {
        if ((i & 1) === 0) px(x + 1, y, Math.max(1, w - 2), 1, "#e8ffff");
        if (i > 8 && (i & 1)) px(x + ((w / 2) | 0), y, 1, 1, "#78c0e8");
      } else if ((i & 1) === 0) {
        px(x + 1 + (wave2 > 0 ? 1 : 0), y, 1, 1, fold);
      }
      if (i > 1) px(x - 1 + (wave2 | 0), y, 1, 1, edge);
      if (i > rows - 3) {
        const hx = x + w + ((Math.sin(time * spd * 1.35 + phase + i * 2.0) * useAmp * 0.55) | 0);
        px(hx, y, 1, 1, edge);
      }
    }
  }

  /** Collar and shoulder points drawn after the torso so the cape reads as worn. */
  function drawCapeCollar(id) {
    if (id === "cape") {
      px(-5, -7, 2, 2, "#8a2020");
      px(-3, -7, 5, 1, "#c9a227");
      px(2, -7, 2, 1, "#a82820");
      px(-4, -8, 2, 1, "#e8c44a");
      px(-2, -7, 1, 1, "#f0a060");
    } else if (id === "cloak" || id === "job_app_cloak") {
      const dark = id === "job_app_cloak" ? "#5c3a21" : "#1a2848";
      const mid = id === "job_app_cloak" ? "#c4a574" : "#3a5080";
      const lite = id === "job_app_cloak" ? "#f3e2c4" : "#8aa4c8";
      px(-5, -7, 2, 2, dark);
      px(-3, -7, 5, 1, mid);
      px(2, -7, 2, 1, dark);
      px(-4, -8, 2, 1, lite);
      px(-2, -7, 1, 1, lite);
    } else if (id === "norway_flag") {
      px(-5, -7, 2, 2, "#ba0c2f");
      px(-3, -7, 5, 1, "#f4f4f8");
      px(2, -7, 2, 1, "#ba0c2f");
      px(-4, -8, 2, 1, "#00205b");
      px(-1, -7, 1, 1, "#00205b");
    } else if (id === "jamaica_flag") {
      px(-5, -7, 2, 2, "#1e8a34");
      px(-3, -7, 5, 1, "#e8c44a");
      px(2, -7, 2, 1, "#1a1a1a");
      px(-4, -8, 2, 1, "#e8c44a");
      px(-1, -7, 1, 1, "#1a1a1a");
    } else if (id === "american_cloak" || id === "us_flag") {
      px(-5, -7, 2, 2, "#3a5aaa");
      px(-3, -7, 5, 1, "#f4f4f8");
      px(2, -7, 2, 1, "#c43a48");
      px(-4, -8, 2, 1, "#c43a48");
      px(-1, -7, 1, 1, "#3a5aaa");
    } else if (id === "stop_pre_flag") {
      px(-5, -7, 2, 2, "#1a1a1a");
      px(-3, -7, 5, 1, "#f4f4f8");
      px(2, -7, 2, 1, "#1a1a1a");
      px(-4, -8, 2, 1, "#e8c44a");
      px(-1, -7, 1, 1, "#e8c44a");
    } else if (id === "jelly_cape") {
      px(-5, -7, 2, 2, "#58a8d8");
      px(-3, -7, 5, 1, "#d8f0ff");
      px(2, -7, 2, 1, "#78c0e8");
      px(-4, -8, 2, 1, "#e8ffff");
      px(-2, -7, 1, 1, "#a8d8f0");
    }
  }

  function drawFaceCosmetic() {
    const id = cosmetics.face;
    if (!id) return;
    if (id === "jade_mask") {
      px(-2, -11, 5, 4, "#2a8a4a");
      px(-1, -10, 3, 2, "#3ec86a");
      px(-2, -9, 1, 1, "#0e3a20");
      px(1, -9, 1, 1, "#0e3a20");
      px(-1, -8, 3, 1, "#1a5a34");
      px(0, -10, 1, 1, "#b8f0c8");
    } else if (id === "straw_hat") {
      px(-4, -16, 8, 1, "#c4a06a");
      px(-3, -15, 6, 2, "#e8c44a");
      px(-2, -14, 4, 1, "#8a5a32");
    } else if (id === "crown") {
      px(-3, -16, 1, 3, "#c9a227");
      px(-1, -17, 1, 2, "#e8c44a");
      px(1, -16, 1, 3, "#c9a227");
      px(-3, -14, 6, 1, "#e8c44a");
    } else if (id === "king_crown") {
      px(-4, -16, 8, 1, "#2f6a30");
      px(-3, -17, 1, 2, "#c9a227");
      px(-1, -18, 1, 2, "#e8c44a");
      px(1, -17, 1, 2, "#c9a227");
      px(3, -16, 1, 1, "#2f6a30");
      px(-3, -15, 6, 1, "#e8c44a");
    } else if (id === "beta_crown") {
      px(-3, -16, 1, 3, "#c9a227");
      px(-1, -17, 1, 2, "#e8c44a");
      px(1, -16, 1, 3, "#c9a227");
      px(-3, -14, 6, 1, "#e8c44a");
      px(-2, -16, 1, 1, "#c43a48");
      px(0, -17, 1, 1, "#c43a48");
      px(2, -16, 1, 1, "#c43a48");
    }
  }

  function drawPlayer(cpos) {
    const f = player.frame;
    const face = player.facing;
    let boatDamp = 1;

    ink.save();
    if (cloakOn) ink.globalAlpha = 0.06;
    if (player.aboard && aboardKind === "dinghy" && pondBoat && scene === "island") {
      const b = pondBoat;
      const bob = Math.sin(time * 1.8 + (b.phase || 0)) * 0.8;
      boatDamp = 0.35;
      ink.translate(b.x - cpos.x + b.w / 2, b.y - cpos.y + b.h + bob);
      ink.rotate(b.tilt || 0);
      ink.scale(b.face || 1, 1);
      ink.translate(0, -b.h + 5);
      if (face !== (b.face || 1)) ink.scale(-1, 1);
    } else if (player.aboard && ownedBoat && scene === "island" && aboardKind !== "dinghy") {
      const b = ownedBoat;
      const bob = skiffBob(b, time);
      boatDamp = 0.35;
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
    const gust = (player.moving && !player.aboard ? 2.55 : 0.82) * boatDamp;
    const gustSpd = player.moving && !player.aboard ? 8.4 : 2.15;
    const backWear = effectiveBack(playerSkin, cosmetics.back);
    drawCapeSheet(backWear, gust, gustSpd, f * 0.4);
    drawPlayerBody(playerSkin, step, player.hurt > 0, !!player.aboard);
    drawCapeCollar(backWear);
    if (playerSkin === "beta_alien") drawAlienPortalWisps(0, -8);
    if (playerSkin === "flash") drawFlashElectricity(0, -8);
    if (player.inWater && !player.aboard) {
      px(-5, 0, 10, 5, "rgba(40, 90, 140, 0.28)");
    }

    ink.restore();
  }

  /** Skin body at feet pivot (0,0) facing +x after scale. */
  function drawPlayerBody(skin, step, hurt, seated) {
    const s = skin || "classic";
    if (s === "jakob") {
      // Norway singlet + flag cape (cape drawn separately, locked to this skin)
      const skinC = hurt ? "#8a3a3a" : "#e8c39a";
      const kit = hurt ? "#6a3038" : "#f4f6f8";
      const red = "#ba0c2f";
      px(-2, -14, 4, 1, "#2a1810");
      px(-2, -13, 5, 1, "#3a2818");
      px(-2, -12, 5, 5, skinC);
      px(-1, -9, 1, 1, "#2a1810");
      px(1, -8, 1, 1, "#d4a07a");
      drawFaceCosmetic();
      px(-3, -6, 6, 5, kit);
      px(-3, -6, 6, 1, red);
      px(-2, -4, 4, 1, red);
      px(-2, -3, 4, 2, kit);
      px(-5, -5, 2, 3, kit);
      px(3, -5, 2, 3, kit);
      px(-5, -2, 2, 2, skinC);
      px(3, -2, 2, 2, skinC);
      px(-2, -1, 4, 1, "#1a1a1a");
      if (seated) {
        px(-3, 1, 2, 1, "#1a1a1a");
        px(0, 1, 2, 1, "#1a1a1a");
      } else {
        px(-3, 1, 2, 3 + step, "#1a1a1a");
        px(0, 1, 2, 3 - step, "#1a1a1a");
        px(-3, 3 + step, 2, 1, "#e8c44a");
        px(0, 3 - step, 2, 1, "#e8c44a");
      }
      return;
    }
    if (s === "fisherman_joe") {
      const skinC = hurt ? "#8a3a3a" : "#d4a07a";
      const vest = hurt ? "#6a3038" : "#5a4630";
      const shirt = "#c4a574";
      px(-3, -13, 6, 2, "#6a6a68");
      px(-2, -14, 4, 1, "#8a8a88");
      px(-2, -12, 5, 5, skinC);
      px(-1, -9, 1, 1, "#2a1810");
      px(1, -8, 1, 1, "#b08060");
      px(-1, -7, 3, 1, "#8a6a50");
      drawFaceCosmetic();
      px(-4, -6, 8, 6, shirt);
      px(-3, -5, 6, 5, vest);
      px(-2, -3, 1, 2, "#c9a227");
      px(1, -3, 1, 2, "#c9a227");
      px(-6, -4, 2, 3, shirt);
      px(4, -4, 2, 3, vest);
      px(-5, -1, 2, 2, skinC);
      px(3, -1, 2, 2, skinC);
      px(-3, 0, 6, 2, "#3a2e1c");
      if (seated) {
        px(-3, 2, 2, 1, "#2a2014");
        px(0, 2, 2, 1, "#2a2014");
      } else {
        px(-3, 2, 2, 2 + step, "#2a2014");
        px(0, 2, 2, 2 - step, "#2a2014");
      }
      return;
    }
    if (s === "beta_alien") {
      const skinC = hurt ? "#4a6a38" : "#5aba48";
      const dark = "#2a6a34";
      px(-1, -16, 1, 2, "#3a8a44");
      px(2, -16, 1, 2, "#3a8a44");
      px(-1, -17, 1, 1, "#c878ff");
      px(2, -17, 1, 1, "#c878ff");
      px(-3, -13, 6, 2, skinC);
      px(-2, -14, 4, 1, "#8fdc78");
      px(-2, -12, 5, 5, skinC);
      px(-2, -10, 2, 2, "#0e2820");
      px(1, -10, 2, 2, "#0e2820");
      px(-1, -9, 1, 1, "#c8ffe8");
      px(2, -9, 1, 1, "#c8ffe8");
      drawFaceCosmetic();
      px(-3, -6, 6, 6, dark);
      px(-3, -6, 6, 2, skinC);
      px(-2, -4, 4, 3, dark);
      px(-5, -5, 2, 4, skinC);
      px(3, -5, 2, 4, dark);
      px(-5, -2, 2, 2, skinC);
      px(3, -2, 2, 2, skinC);
      if (seated) {
        px(-3, 1, 2, 1, "#1a4a28");
        px(0, 1, 2, 1, "#1a4a28");
      } else {
        px(-3, 1, 2, 3 + step, "#1a4a28");
        px(0, 1, 2, 3 - step, "#1a4a28");
      }
      return;
    }
    if (s === "usain_bolt") {
      // Jamaica speed suit — yellow / green / black
      const skinC = hurt ? "#8a3a3a" : "#6a4028";
      px(-2, -14, 4, 1, "#1a1a1a");
      px(-2, -13, 5, 1, "#2a2a2a");
      px(-2, -12, 5, 5, skinC);
      px(-1, -9, 1, 1, "#1a1010");
      px(1, -8, 1, 1, "#5a3020");
      drawFaceCosmetic();
      px(-3, -6, 6, 6, "#e8c44a");
      px(-3, -6, 6, 1, "#1e8a34");
      px(-3, -4, 6, 1, "#1a1a1a");
      px(-2, -3, 4, 2, "#e8c44a");
      px(-5, -5, 2, 3, "#1e8a34");
      px(3, -5, 2, 3, "#1a1a1a");
      px(-5, -2, 2, 2, skinC);
      px(3, -2, 2, 2, skinC);
      px(-2, -1, 4, 1, "#1a1a1a");
      if (seated) {
        px(-3, 1, 2, 1, "#1e8a34");
        px(0, 1, 2, 1, "#1a1a1a");
      } else {
        px(-3, 1, 2, 3 + step, "#1e8a34");
        px(0, 1, 2, 3 - step, "#1a1a1a");
        px(-3, 3 + step, 2, 1, "#e8c44a");
        px(0, 3 - step, 2, 1, "#e8c44a");
      }
      return;
    }
    if (s === "among_us_red") {
      // Red crewmate — visor + backpack
      const suit = hurt ? "#6a2030" : "#c43a48";
      const dark = "#6a1828";
      px(-4, -12, 8, 2, suit);
      px(-3, -14, 6, 2, suit);
      px(-3, -12, 6, 5, suit);
      px(-2, -11, 4, 3, "#7ad0e8");
      px(-1, -10, 3, 2, "#d8f4ff");
      drawFaceCosmetic();
      px(-4, -7, 8, 6, suit);
      px(-5, -6, 2, 5, dark);
      px(-4, -2, 8, 2, dark);
      if (seated) {
        px(-3, 1, 2, 1, suit);
        px(0, 1, 2, 1, suit);
      } else {
        px(-3, 1, 2, 2 + step, suit);
        px(0, 1, 2, 2 - step, suit);
      }
      return;
    }
    if (s === "homer") {
      // Yellow + white polo + blue pants
      const skinC = hurt ? "#8a6a20" : "#f0d050";
      px(-2, -14, 4, 1, skinC);
      px(-3, -13, 6, 2, skinC);
      px(-2, -12, 5, 5, skinC);
      px(-1, -9, 1, 1, "#2a1810");
      px(1, -8, 1, 1, "#d4a030");
      px(-1, -7, 3, 1, "#2a1810");
      drawFaceCosmetic();
      px(-3, -6, 6, 5, "#f4f4f8");
      px(-2, -4, 1, 2, "#3a6aaa");
      px(-5, -5, 2, 3, skinC);
      px(3, -5, 2, 3, skinC);
      px(-5, -2, 2, 2, skinC);
      px(3, -2, 2, 2, skinC);
      px(-3, -1, 6, 2, "#3a6aaa");
      if (seated) {
        px(-3, 1, 2, 1, "#2a4a78");
        px(0, 1, 2, 1, "#2a4a78");
      } else {
        px(-3, 1, 2, 3 + step, "#2a4a78");
        px(0, 1, 2, 3 - step, "#2a4a78");
      }
      return;
    }
    if (s === "indiana_jones") {
      // Fedora + leather jacket
      const skinC = hurt ? "#8a3a3a" : "#d4a07a";
      px(-3, -14, 6, 1, "#5c3a21");
      px(-4, -13, 8, 1, "#5c3a21");
      px(-2, -15, 4, 1, "#3a2414");
      px(-2, -12, 5, 5, skinC);
      px(-1, -9, 1, 1, "#2a1810");
      px(1, -8, 1, 1, "#b08060");
      px(-1, -7, 3, 1, "#5c3a21");
      drawFaceCosmetic();
      px(-3, -6, 6, 5, "#6a4028");
      px(-3, -6, 6, 1, "#c4a574");
      px(-5, -5, 2, 3, "#6a4028");
      px(3, -5, 2, 3, "#6a4028");
      px(-5, -2, 2, 2, skinC);
      px(3, -2, 2, 2, skinC);
      px(-2, -1, 4, 1, "#3a2414");
      if (seated) {
        px(-3, 1, 2, 1, "#3a2414");
        px(0, 1, 2, 1, "#3a2414");
      } else {
        px(-3, 1, 2, 3 + step, "#3a2414");
        px(0, 1, 2, 3 - step, "#3a2414");
      }
      return;
    }
    if (s === "flash") {
      // Classic silhouette — all red suit + yellow trim (Speed Force)
      const shirt = hurt ? "#8a2028" : "#e03840";
      const vest = hurt ? "#6a1820" : "#c02028";
      const trim = "#f0d040";
      px(-3, -13, 6, 2, "#c43a28");
      px(-2, -14, 4, 1, "#e04a32");
      px(-2, -12, 5, 1, "#8a2018");
      px(-2, -11, 5, 5, "#e8c39a");
      px(-1, -9, 1, 1, "#2a1810");
      px(1, -8, 1, 1, "#d4a07a");
      drawFaceCosmetic();
      px(-3, -6, 6, 6, vest);
      px(-3, -6, 6, 2, shirt);
      px(-2, -4, 4, 3, vest);
      px(-1, -3, 2, 2, trim);
      px(-2, -1, 4, 1, "#8a1018");
      px(-5, -5, 2, 4, shirt);
      px(3, -5, 2, 4, vest);
      px(-5, -2, 2, 2, "#e8c39a");
      px(3, -2, 2, 2, "#e8c39a");
      if (seated) {
        px(-3, 1, 2, 1, vest);
        px(0, 1, 2, 1, vest);
      } else {
        px(-3, 1, 2, 3 + step, vest);
        px(0, 1, 2, 3 - step, vest);
        px(-3, 3 + step, 2, 1, trim);
        px(0, 3 - step, 2, 1, trim);
      }
      return;
    }
    if (s === "eric_cartman") {
      // Cyan beanie + yellow pom, fat face, red jacket, brown pants
      const skinC = hurt ? "#8a3a3a" : "#f0c8a0";
      const hat = hurt ? "#2a6a78" : "#3ab0c8";
      const jacket = hurt ? "#8a2028" : "#c43a40";
      px(-1, -16, 2, 1, "#e8c44a");
      px(-3, -15, 6, 2, hat);
      px(-4, -13, 8, 2, hat);
      px(-3, -12, 6, 5, skinC);
      px(-4, -11, 8, 4, skinC);
      px(-2, -10, 1, 1, "#2a1810");
      px(1, -10, 1, 1, "#2a1810");
      px(-1, -8, 3, 1, "#c09070");
      drawFaceCosmetic();
      px(-4, -6, 8, 6, jacket);
      px(-3, -5, 1, 1, "#e8c44a");
      px(1, -5, 1, 1, "#e8c44a");
      px(-6, -5, 2, 4, jacket);
      px(4, -5, 2, 4, jacket);
      px(-5, -2, 2, 2, skinC);
      px(3, -2, 2, 2, skinC);
      px(-4, 0, 8, 2, "#6a4028");
      if (seated) {
        px(-4, 2, 3, 1, "#3a2414");
        px(0, 2, 3, 1, "#3a2414");
      } else {
        px(-4, 2, 3, 2 + step, "#3a2414");
        px(0, 2, 3, 2 - step, "#3a2414");
      }
      return;
    }
    if (s === "shrek") {
      const green = hurt ? "#3a6a28" : "#5a9a38";
      px(-2, -15, 1, 2, green);
      px(2, -15, 1, 2, green);
      px(-3, -13, 7, 6, green);
      px(-1, -11, 1, 1, "#1a2810");
      px(1, -11, 1, 1, "#1a2810");
      px(-1, -9, 3, 1, "#3a5a28");
      drawFaceCosmetic();
      px(-3, -6, 7, 5, "#c4a574");
      px(-4, -5, 2, 3, green);
      px(3, -5, 2, 3, green);
      px(-3, -1, 7, 2, "#5c3a21");
      if (seated) {
        px(-3, 1, 2, 1, "#3a2414");
        px(1, 1, 2, 1, "#3a2414");
      } else {
        px(-3, 1, 2, 3 + step, "#3a2414");
        px(1, 1, 2, 3 - step, "#3a2414");
      }
      return;
    }
    if (s === "batman") {
      const suit = hurt ? "#1a2030" : "#1a1a28";
      px(-3, -14, 7, 2, suit);
      px(-4, -13, 2, 3, suit);
      px(3, -13, 2, 3, suit);
      px(-2, -12, 5, 5, "#e8c39a");
      px(-2, -11, 5, 2, suit);
      px(-1, -10, 1, 1, "#f0d040");
      px(1, -10, 1, 1, "#f0d040");
      drawFaceCosmetic();
      px(-3, -6, 6, 6, suit);
      px(-2, -4, 4, 2, "#f0d040");
      px(-5, -5, 2, 4, suit);
      px(3, -5, 2, 4, suit);
      if (seated) {
        px(-3, 1, 2, 1, suit);
        px(0, 1, 2, 1, suit);
      } else {
        px(-3, 1, 2, 3 + step, suit);
        px(0, 1, 2, 3 - step, suit);
      }
      return;
    }
    if (s === "peter_griffin") {
      const skinC = hurt ? "#8a3a3a" : "#e8c39a";
      px(-2, -14, 5, 1, "#5c3a21");
      px(-3, -13, 7, 6, skinC);
      px(-1, -11, 1, 1, "#2a1810");
      px(1, -11, 1, 1, "#2a1810");
      px(-1, -9, 3, 1, "#c09070");
      drawFaceCosmetic();
      px(-4, -6, 9, 5, "#f4f4f8");
      px(-3, -4, 7, 2, "#3a6aaa");
      px(-5, -5, 2, 3, skinC);
      px(4, -5, 2, 3, skinC);
      px(-4, -1, 9, 2, "#3a6aaa");
      if (seated) {
        px(-3, 1, 3, 1, "#3a6aaa");
        px(1, 1, 3, 1, "#3a6aaa");
      } else {
        px(-3, 1, 3, 3 + step, "#3a6aaa");
        px(1, 1, 3, 3 - step, "#3a6aaa");
      }
      return;
    }
    if (s === "sonic") {
      const blue = hurt ? "#2a4a8a" : "#3a6ad0";
      px(-2, -15, 5, 2, blue);
      px(-3, -13, 7, 5, blue);
      px(-4, -12, 2, 3, blue);
      px(-1, -11, 1, 1, "#1a1810");
      px(1, -11, 1, 1, "#1a1810");
      px(-1, -9, 3, 1, "#e8c39a");
      drawFaceCosmetic();
      px(-3, -6, 6, 5, blue);
      px(-2, -4, 4, 2, "#e03840");
      px(-5, -5, 2, 3, "#e8c39a");
      px(3, -5, 2, 3, "#e8c39a");
      px(-2, -1, 4, 1, "#e03840");
      if (seated) {
        px(-3, 1, 2, 1, "#e03840");
        px(0, 1, 2, 1, "#e03840");
      } else {
        px(-3, 1, 2, 3 + step, "#e03840");
        px(0, 1, 2, 3 - step, "#e03840");
        px(-3, 3 + step, 2, 1, "#f4f4f8");
        px(0, 3 - step, 2, 1, "#f4f4f8");
      }
      return;
    }
    if (s === "deadpool") {
      const red = hurt ? "#6a2028" : "#c43a40";
      px(-3, -13, 6, 2, red);
      px(-2, -14, 4, 1, red);
      px(-2, -12, 5, 5, red);
      px(-1, -10, 1, 1, "#f4f4f8");
      px(1, -10, 1, 1, "#f4f4f8");
      px(-1, -10, 1, 1, "#1a1a1a");
      px(1, -10, 1, 1, "#1a1a1a");
      drawFaceCosmetic();
      px(-3, -6, 6, 6, red);
      px(-2, -4, 4, 2, "#1a1a1a");
      px(-5, -5, 2, 4, red);
      px(3, -5, 2, 4, red);
      if (seated) {
        px(-3, 1, 2, 1, red);
        px(0, 1, 2, 1, red);
      } else {
        px(-3, 1, 2, 3 + step, red);
        px(0, 1, 2, 3 - step, red);
      }
      return;
    }
    if (s === "cole_hocker") {
      const skinC = hurt ? "#8a3a3a" : "#d4a07a";
      px(-2, -14, 4, 1, "#1a1a1a");
      px(-2, -13, 5, 1, "#2a2a2a");
      px(-2, -12, 5, 5, skinC);
      px(-1, -9, 1, 1, "#1a1010");
      px(1, -8, 1, 1, "#b08060");
      drawFaceCosmetic();
      px(-3, -6, 6, 6, "#f4f4f8");
      px(-3, -6, 6, 1, "#c43a48");
      px(-3, -4, 6, 1, "#3a5aaa");
      px(-2, -3, 4, 2, "#f4f4f8");
      px(-5, -5, 2, 3, "#c43a48");
      px(3, -5, 2, 3, "#3a5aaa");
      px(-5, -2, 2, 2, skinC);
      px(3, -2, 2, 2, skinC);
      px(-2, -1, 4, 1, "#1a1a1a");
      if (seated) {
        px(-3, 1, 2, 1, "#c43a48");
        px(0, 1, 2, 1, "#3a5aaa");
      } else {
        px(-3, 1, 2, 3 + step, "#c43a48");
        px(0, 1, 2, 3 - step, "#3a5aaa");
        px(-3, 3 + step, 2, 1, "#f4f4f8");
        px(0, 3 - step, 2, 1, "#f4f4f8");
      }
      return;
    }
    if (s === "steve_prefontaine") {
      const skinC = hurt ? "#8a3a3a" : "#e8c39a";
      px(-2, -14, 4, 1, "#3a2414");
      px(-2, -13, 5, 1, "#5c3a21");
      px(-2, -12, 5, 5, skinC);
      px(-1, -9, 1, 1, "#2a1810");
      px(1, -8, 1, 1, "#d4a07a");
      px(-1, -7, 3, 1, "#5c3a21");
      drawFaceCosmetic();
      px(-3, -6, 6, 5, "#1e6a34");
      px(-3, -6, 6, 1, "#e8c44a");
      px(-2, -4, 4, 2, "#1e6a34");
      px(-5, -5, 2, 3, "#1e6a34");
      px(3, -5, 2, 3, "#1e6a34");
      px(-5, -2, 2, 2, skinC);
      px(3, -2, 2, 2, skinC);
      px(-2, -1, 4, 1, "#e8c44a");
      if (seated) {
        px(-3, 1, 2, 1, "#f4f4f8");
        px(0, 1, 2, 1, "#f4f4f8");
      } else {
        px(-3, 1, 2, 2 + step, "#f4f4f8");
        px(0, 1, 2, 2 - step, "#f4f4f8");
        px(-3, 2 + step, 2, 1, "#1a1a1a");
        px(0, 2 - step, 2, 1, "#1a1a1a");
      }
      return;
    }
    if (s === "lex_young") {
      const skinC = hurt ? "#8a3a3a" : "#e0b090";
      const orange = hurt ? "#a84810" : "#f07818";
      const mint = "#c8f0b0";
      px(-3, -16, 2, 2, "#4a3018");
      px(-1, -17, 3, 2, "#5c3a21");
      px(1, -16, 2, 2, "#3a2414");
      px(-3, -14, 6, 2, "#5c3a21");
      px(-2, -12, 5, 5, skinC);
      px(-1, -9, 1, 1, "#2a1810");
      px(1, -8, 1, 1, "#c49070");
      drawFaceCosmetic();
      px(-3, -6, 6, 5, orange);
      px(-3, -6, 6, 1, "#ffb040");
      px(-1, -5, 2, 2, "#1a120c");
      px(0, -5, 1, 2, "#ffb040");
      px(-5, -5, 2, 3, orange);
      px(3, -5, 2, 3, orange);
      px(-5, -2, 2, 2, skinC);
      px(3, -2, 2, 2, skinC);
      px(-2, -1, 5, 2, "#1a1a1a");
      if (seated) {
        px(-3, 1, 2, 1, "#1a1a1a");
        px(0, 1, 2, 1, "#1a1a1a");
      } else {
        px(-3, 1, 2, 2 + step, skinC);
        px(0, 1, 2, 2 - step, skinC);
        px(-3, 2 + step, 2, 1, "#1a1a1a");
        px(0, 2 - step, 2, 1, "#1a1a1a");
        px(-3, 3 + step, 2, 1, mint);
        px(0, 3 - step, 2, 1, "#e8ffd8");
      }
      return;
    }
    // classic
    const shirt = hurt ? "#8a3a3a" : "#b8c4d4";
    const vest = hurt ? "#6a3038" : "#3a6a9a";
    px(-3, -13, 6, 2, "#c43a28");
    px(-2, -14, 4, 1, "#e04a32");
    px(-2, -12, 5, 1, "#8a2018");
    px(-2, -11, 5, 5, "#e8c39a");
    px(-1, -9, 1, 1, "#2a1810");
    px(1, -8, 1, 1, "#d4a07a");
    drawFaceCosmetic();
    px(-3, -6, 6, 6, vest);
    px(-3, -6, 6, 2, shirt);
    px(-2, -4, 4, 3, vest);
    px(-2, -1, 4, 1, "#2a4a78");
    px(-5, -5, 2, 4, shirt);
    px(3, -5, 2, 4, vest);
    px(-5, -2, 2, 2, "#e8c39a");
    px(3, -2, 2, 2, "#e8c39a");
    if (seated) {
      px(-3, 1, 2, 1, "#2a4a78");
      px(0, 1, 2, 1, "#2a4a78");
    } else {
      px(-3, 1, 2, 3 + step, "#2a4a78");
      px(0, 1, 2, 3 - step, "#2a4a78");
    }
  }

  function drawAlienPortalWisps(ox, oy) {
    for (let i = 0; i < 5; i++) {
      const a = time * 2.4 + i * 1.25;
      const r = 5 + Math.sin(time * 3 + i) * 1.5;
      const x = (ox + Math.cos(a) * r) | 0;
      const y = (oy + Math.sin(a) * r * 0.7) | 0;
      px(x, y, 1, 1, i & 1 ? "#c878ff" : "#6ad4ff");
    }
  }

  /** Lightning forks zapping out from the Flash skin. */
  function drawFlashElectricity(ox, oy) {
    const cx = ox | 0;
    const cy = (oy - 5) | 0;
    for (let i = 0; i < 7; i++) {
      const flicker = ((time * 18 + i * 3.1) | 0);
      if ((flicker + i) % 5 === 0) continue;
      const a = time * 5.5 + i * ((Math.PI * 2) / 7) + Math.sin(time * 9 + i) * 0.35;
      let x = cx;
      let y = cy;
      const segs = 3 + (i % 2);
      const reach = 7 + ((Math.sin(time * 14 + i * 2) * 3) | 0);
      for (let s = 0; s < segs; s++) {
        const u = (s + 1) / segs;
        const jag = Math.sin(time * 22 + i * 4 + s * 5) * 2.2;
        const nx = (cx + Math.cos(a) * reach * u + Math.cos(a + 1.2) * jag) | 0;
        const ny = (cy + Math.sin(a) * reach * u * 0.9 + Math.sin(a + 0.8) * jag) | 0;
        const col =
          s === segs - 1 ? "#ffffff" : i & 1 ? "#7ec8ff" : "#ffe86a";
        px(nx, ny, 1, 1, col);
        if (s > 0) px(((x + nx) / 2) | 0, ((y + ny) / 2) | 0, 1, 1, "#a8e0ff");
        // Small fork off mid-bolt
        if (s === 1 && ((flicker + i) & 3) === 0) {
          px(nx + ((i & 1) ? 1 : -1), ny - 1, 1, 1, "#ffe86a");
        }
        x = nx;
        y = ny;
      }
    }
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
    } else if (id === "gem" || id === "vein_gem") {
      const c1 = id === "vein_gem" ? "#5ee8d0" : "#7ff0ea";
      const c2 = id === "vein_gem" ? "#2a8a78" : "#2ec9c0";
      px(sx + 10, sy + 6, 4, 2, c1);
      px(sx + 6, sy + 8, 12, 6, c2);
      px(sx + 10, sy + 14, 4, 2, "#1a8a86");
      px(sx + 10, sy + 10, 4, 2, "#e8ffff");
    } else if (String(id).indexOf("potion_") === 0) {
      const fill =
        id === "potion_red"
          ? "#c81e1e"
          : id === "potion_blue"
            ? "#3a80e0"
            : id === "potion_gold"
              ? "#e8c44a"
              : id === "potion_fury"
                ? "#e05020"
                : id === "potion_smoke"
                  ? "#6a7080"
                  : "#5ee8d0";
      px(sx + 10, sy + 4, 4, 2, "#d0d8e0");
      px(sx + 8, sy + 6, 8, 10, "#c8d0d8");
      px(sx + 9, sy + 8, 6, 7, fill);
      px(sx + 10, sy + 2, 4, 3, "#e8eef4");
    } else if (id === "mountain_heart") {
      px(sx + 8, sy + 8, 8, 6, "#5ee8d0");
      px(sx + 10, sy + 6, 4, 10, "#e8fff8");
      px(sx + 9, sy + 10, 6, 4, "#2a8a78");
    } else if (id === "key_bronze" || id === "key_silver" || id === "key_gold") {
      const col = id === "key_bronze" ? "#b87333" : id === "key_silver" ? "#c0c8d0" : "#c9a227";
      px(sx + 8, sy + 8, 6, 6, col);
      px(sx + 13, sy + 10, 6, 2, col);
      px(sx + 17, sy + 8, 2, 6, col);
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
      const dragging = slotDrag && slotDrag.src === "bag" && slotDrag.index === i;
      const sel = (!cosSelect && i === heldSlot) || wandPulse || dragging;
      px(sx, sy, slot, slot, sel ? "#c9a227" : "#2b1c12");
      px(sx + 1, sy + 1, slot - 2, slot - 2, sel ? "#f3e2c4" : "#2b1c12");
      px(sx + 2, sy + 2, slot - 4, slot - 4, wandPulse ? "#e8c44a" : "#5c3a21");
      px(sx + 4, sy + 4, slot - 8, slot - 8, "#1a120c");
      if (!stack || dragging) continue;
      drawHudIcon(stack.id, sx, sy);
      if (stack.count > 1) drawCount(sx, sy, stack.count);
    }

    if (playMode === "normal" && satchelOpen) {
      const o = satchelOrigin();
      drawPixText("SATCHEL", o.x, o.y - 9, "#f3e2c4");
      for (let i = 0; i < satchel.length; i++) {
        const col = i % HUD_COLS;
        const row = (i / HUD_COLS) | 0;
        const sx = o.x + col * (o.slot + o.gap);
        const sy = o.y + row * (o.slot + o.rowGap);
        const dragging = slotDrag && slotDrag.src === "satchel" && slotDrag.index === i;
        px(sx, sy, o.slot, o.slot, dragging ? "#c9a227" : "#2b1c12");
        px(sx + 1, sy + 1, o.slot - 2, o.slot - 2, "#2b1c12");
        px(sx + 2, sy + 2, o.slot - 4, o.slot - 4, "#5c3a21");
        px(sx + 4, sy + 4, o.slot - 8, o.slot - 8, "#1a120c");
        const stack = satchel[i];
        if (!stack || dragging) continue;
        drawHudIcon(stack.id, sx, sy);
        if (stack.count > 1) drawCount(sx, sy, stack.count);
      }
    } else if (playMode === "normal" && !satchelOpen && satchelHolding()) {
      drawPixText("E", x0 - 8, y0, "#e8c44a");
    }
    if (slotDrag) {
      const list = stackArray(slotDrag.src);
      const stack = list[slotDrag.index];
      if (stack) {
        const gx = (pointerUi.x - slot / 2) | 0;
        const gy = (pointerUi.y - slot / 2) | 0;
        px(gx, gy, slot, slot, "#c9a227");
        px(gx + 2, gy + 2, slot - 4, slot - 4, "#1a120c");
        drawHudIcon(stack.id, gx, gy);
      }
    }

    // Career rank chip (replaces survival XP bar)
    {
      const tier = careerTierOf(careerLevel);
      const lvStr = "LV " + careerLevel;
      const tw = pixTextWidth(lvStr);
      px(x0, barY, tw + 8, 8, tier.edge);
      px(x0 + 1, barY + 1, tw + 6, 6, tier.color);
      drawPixText(lvStr, x0 + 4, barY + 1, tier.ink);
      if (careerLastGainT > 0 && careerLastGain > 0) {
        const a = Math.min(1, careerLastGainT / 2.4);
        ctx.globalAlpha = a;
        drawPixText("+" + careerLastGain + " XP", x0 + tw + 12, barY + 1, "#e8c44a");
        ctx.globalAlpha = 1;
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
    if (rod.phase === "idle" || !player.aboard || !activeCraft()) return;
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
    if (scene === "sub") return { x: SUB_W / 2, y: 28, feet: 90 };
    if (scene === "floor") return { x: FLOOR_W / 2, y: 20, feet: 80 };
    if (scene === "wreck") return { x: WRECK_W / 2, y: 16, feet: 70 };
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
    if (
      uiScreen === "mode" ||
      uiScreen === "account" ||
      uiScreen === "nm_boards" ||
      uiScreen === "profiles" ||
      uiScreen === "walkthrough" ||
      uiScreen === "quests" ||
      uiScreen === "logo" ||
      uiScreen === "spin" ||
      !playMode
    ) {
      mode = "menu";
    } else if (playMode === "hub") {
      mode = "hub";
    } else if (playMode === "normal") {
      mode = "normal";
    } else if (playMode === "speedrun") {
      mode = "speedrun";
      if (uiScreen === "categories") cat = SPEED_ORDER[srCursor] || srCat;
      else cat = srCat;
    }
    api.setPresenceActivity(mode, cat);
  }

  function lobbyPeerFromPresence(p, api) {
    if (!p) return null;
    let skin = p.skin_id || null;
    let face = p.face_id || null;
    let back = p.back_id || null;
    if ((!skin || !face || !back) && api && api.getCachedLoadout && p.username) {
      const cached = api.getCachedLoadout(p.username);
      if (cached) {
        if (!skin && cached.skin) skin = cached.skin;
        if (!face && cached.face) face = cached.face;
        if (!back && cached.back) back = cached.back;
      }
    }
    const modeLabel =
      api && typeof api.presenceActivityLabel === "function"
        ? api.presenceActivityLabel(p)
        : "LOBBY";
    const name = p.username || "PLAYER";
    return {
      client_id: p.client_id || "",
      name,
      isAccount: !!p.user_id,
      skin: skin || "classic",
      face: face || null,
      back: back || null,
      mode: String(p.mode || "menu").toLowerCase(),
      category: p.category || null,
      modeLabel: String(modeLabel || "LOBBY").toUpperCase(),
      level: careerLevelForName(name),
    };
  }

  function refreshLobbyPeersFromCache() {
    const api = lbApi();
    if (!api || typeof api.getOnlinePresence !== "function") {
      lobbyPeers = [];
      lobbyPeerTotal = 0;
      return;
    }
    const selfId = api.getClientId ? String(api.getClientId() || "") : "";
    const rows = api.getOnlinePresence() || [];
    const out = [];
    for (let i = 0; i < rows.length; i++) {
      const p = rows[i];
      if (!p) continue;
      if (selfId && p.client_id && String(p.client_id) === selfId) continue;
      const peer = lobbyPeerFromPresence(p, api);
      if (peer) out.push(peer);
    }
    out.sort((a, b) => {
      if (a.isAccount !== b.isAccount) return a.isAccount ? -1 : 1;
      return String(a.name).localeCompare(String(b.name));
    });
    lobbyPeers = out;
    lobbyPeerTotal = out.length;
  }

  /** 1s presence upsert+fetch while on mode-select; keeps lobby line live. */
  function tickLobbyPresence() {
    if (uiScreen !== "mode") return;
    syncPresenceActivity();
    syncPresenceLoadout();
    refreshLobbyPeersFromCache();
    const now = Date.now();
    if (now - lobbyPresenceAt < LOBBY_PRESENCE_MS) return;
    lobbyPresenceAt = now;
    const api = lbApi();
    if (!api) return;
    const done = () => {
      if (uiScreen === "mode") refreshLobbyPeersFromCache();
    };
    // Full tick publishes our loadout/mode and pulls everyone else every second.
    if (typeof api.tickPresence === "function") {
      Promise.resolve(api.tickPresence()).then(done).catch(done);
      return;
    }
    if (typeof api.fetchOnlinePresence === "function") {
      Promise.resolve(api.fetchOnlinePresence()).then(done).catch(done);
    }
  }

  function drawLobbyPeerFigure(fx, fy, peer, scale) {
    if (!peer) return;
    const s = scale == null ? 1.2 : scale;
    const prevFace = cosmetics.face;
    const prevBack = cosmetics.back;
    cosmetics.face = peer.face || null;
    cosmetics.back = peer.back || null;
    const prevInk = ink;
    ink = ctx;
    ink.save();
    ink.translate(fx, fy);
    ink.scale(s, s);
    // Soft shared bob — keep peers level so labels stay readable
    const bob = ((Math.sin(time * 2.1) * 0.4) | 0);
    ink.translate(0, bob);
    drawCapeSheet(peer.back, 0.7, 1.8, time);
    drawPlayerBody(peer.skin || "classic", 0, false, false);
    drawCapeCollar(peer.back);
    if (peer.skin === "beta_alien") drawAlienPortalWisps(0, -8);
    if (peer.skin === "flash") drawFlashElectricity(0, -8);
    ink.restore();
    ink = prevInk;
    cosmetics.face = prevFace;
    cosmetics.back = prevBack;
  }

  /**
   * Lobby line beside the local mannequin — even spacing, same depth, no stack.
   * Skin + cosmetics on body; compact name + mode above each peer.
   */
  function drawLobbyPeerLine(stageCx, previewY, stageLeft, previewRight) {
    tickLobbyPresence();
    const bandW = Math.max(0, previewRight - stageLeft);
    if (bandW < 60) return;

    if (!lobbyPeers.length) {
      drawPixTextSm("NO ONE ELSE ONLINE", stageCx, previewY + 30, "#5c3a21", "center");
      return;
    }

    // Clear center for YOU; peers stand in left/right wings at nearly the same depth
    const centerGap = 22;
    const pad = 8;
    const leftEdge = stageLeft + pad;
    const rightEdge = previewRight - pad;
    const leftWingW = Math.max(0, stageCx - centerGap - leftEdge);
    const rightWingW = Math.max(0, rightEdge - (stageCx + centerGap));
    const pitch = 30;
    const leftSlots = Math.max(0, Math.min(4, (leftWingW / pitch) | 0));
    const rightSlots = Math.max(0, Math.min(4, (rightWingW / pitch) | 0));
    const maxShow = leftSlots + rightSlots;
    const show = Math.min(lobbyPeers.length, maxShow);
    if (show <= 0) {
      drawPixTextSm(
        lobbyPeerTotal + " ONLINE",
        stageCx,
        previewY + 30,
        "#5c3a21",
        "center"
      );
      return;
    }

    // Build stable slots: nearest-left, nearest-right, next-left, …
    const slots = [];
    let li = 0;
    let ri = 0;
    for (let i = 0; i < show; i++) {
      const wantLeft = i % 2 === 0;
      if (wantLeft && li < leftSlots) {
        slots.push({ peer: lobbyPeers[i], side: -1, rank: li });
        li++;
      } else if (ri < rightSlots) {
        slots.push({ peer: lobbyPeers[i], side: 1, rank: ri });
        ri++;
      } else if (li < leftSlots) {
        slots.push({ peer: lobbyPeers[i], side: -1, rank: li });
        li++;
      }
    }

    // Draw outer → inner so nearer peers sit cleanly in front of farther ones
    slots.sort((a, b) => b.rank - a.rank);

    for (let i = 0; i < slots.length; i++) {
      const s = slots[i];
      const peer = s.peer;
      const fx = (stageCx + s.side * (centerGap + 6 + s.rank * pitch)) | 0;
      const fy = previewY - 1;
      if (fx < leftEdge || fx > rightEdge) continue;

      ctx.save();
      ctx.globalAlpha = 0.9;
      drawLobbyPeerFigure(fx, fy, peer, 1.2);
      ctx.restore();

      const name = String(peer.name || "?").slice(0, peer.isAccount ? 7 : 6);
      const mode = String(peer.modeLabel || "LOBBY").slice(0, 8);
      const nameY = fy - 40;
      const lv = peer.level || careerLevelForName(peer.name);
      const lvStr = String(lv);
      drawLevelBadge(lv, (fx - (pixTextWidth(lvStr) + 3) / 2) | 0, nameY - 10);
      if (peer.isAccount) {
        const tag = String(name).toUpperCase();
        drawNameTag(tag, (fx - pixTextWidth(tag) / 2) | 0, nameY);
      } else {
        drawPixTextSm(String(name).toUpperCase(), fx, nameY, "#c4a574", "center");
      }
      drawPixTextSm(mode, fx, nameY + 10, "#8a6a42", "center");
    }

    if (lobbyPeerTotal > show) {
      drawPixTextSm("+" + (lobbyPeerTotal - show), stageCx, previewY - 48, "#8a6a42", "center");
    }
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
      if (res && res.banned) chatStatusNote = "TEMP BANNED";
      else if (err === "set name") chatStatusNote = "SET NAME IN ACCOUNT";
      else if (err === "slow down") chatStatusNote = "WAIT…";
      else if (err === "setup" || (res && res.missing)) chatStatusNote = "RUN SETUP SQL";
      else if (err === "banned") chatStatusNote = "TEMP BANNED";
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

  function drawPixHeart(hx, hy, col) {
    px(hx + 1, hy, 2, 1, col);
    px(hx + 4, hy, 2, 1, col);
    px(hx, hy + 1, 7, 2, col);
    px(hx + 1, hy + 3, 5, 1, col);
    px(hx + 2, hy + 4, 3, 1, col);
    px(hx + 3, hy + 5, 1, 1, col);
  }

  /** Floating hearts above the player after a blowfish catch (~2s). */
  function drawBlowfishHearts() {
    if (!blowfishHearts) return;
    const u = blowfishHearts.t;
    const dur = blowfishHearts.dur;
    const fade = u < 0.15 ? u / 0.15 : u > dur - 0.35 ? Math.max(0, (dur - u) / 0.35) : 1;
    const mid = playerCenter();
    const base = worldToUi(mid.x, mid.y - 10);
    ctx.save();
    ctx.setTransform(SCALE_UI, 0, 0, SCALE_UI, 0, 0);
    ctx.globalAlpha = fade;
    const n = 5;
    for (let i = 0; i < n; i++) {
      const life = (u * 0.85 + i * 0.22) % 1.15;
      const rise = life * 22;
      const sway = Math.sin(u * 5 + i * 1.7) * (3 + i);
      const hx = (base.x + sway - 3) | 0;
      const hy = (base.y - 6 - rise) | 0;
      const col = i & 1 ? "#ff6b7a" : "#ff9aa8";
      drawPixHeart(hx, hy, col);
    }
    ctx.globalAlpha = 1;
    ctx.restore();
  }

  /** Soft violet glow after landing a portal leech. */
  function drawPortalLeechGlow() {
    if (!leechGlow) return;
    const u = leechGlow.t;
    const dur = leechGlow.dur;
    const fade = u < 0.2 ? u / 0.2 : u > dur - 0.5 ? Math.max(0, (dur - u) / 0.5) : 1;
    const mid = playerCenter();
    const base = worldToUi(mid.x, mid.y - 4);
    ctx.save();
    ctx.setTransform(SCALE_UI, 0, 0, SCALE_UI, 0, 0);
    for (let r = 18; r >= 4; r -= 3) {
      ctx.globalAlpha = fade * (0.04 + (18 - r) * 0.012);
      ctx.fillStyle = r > 10 ? "#c878ff" : "#f0d0ff";
      ctx.beginPath();
      ctx.arc(base.x, base.y, r + Math.sin(u * 6) * 1.5, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = fade * 0.85;
    drawTinyCatch("portal_leech", (base.x - 3) | 0, (base.y - 18 - u * 6) | 0);
    ctx.globalAlpha = 1;
    ctx.restore();
  }


  function drawTemplePedestal(cpos, t) {
    if (!templePedestal || templeMaskTaken) return;
    const x = (templePedestal.x - cpos.x) | 0;
    const y = (templePedestal.y - cpos.y) | 0;
    const pulse = 0.55 + Math.sin(t * 4) * 0.25;
    ctx.globalAlpha = pulse;
    px(x + 3, y - 2, 10, 2, "#b8f0c8");
    px(x + 4, y - 6, 8, 4, "#3ec86a");
    px(x + 5, y - 5, 2, 1, "#0e3a20");
    px(x + 9, y - 5, 2, 1, "#0e3a20");
    ctx.globalAlpha = 1;
    const mid = playerCenter();
    if (
      Math.hypot(mid.x - (templePedestal.x + 8), mid.y - (templePedestal.y + 4)) < 18 &&
      !templeMaskTaken
    ) {
      if (canTake("jade_mask") || ownsCosmetic("jade_mask") || cosmetics.face === "jade_mask") {
        templeMaskTaken = true;
        if (!ownsCosmetic("jade_mask") && cosmetics.face !== "jade_mask") {
          loot.push({
            id: "jade_mask",
            x: templePedestal.x + 4,
            y: templePedestal.y - 4,
            taken: false,
            born: waveCycle,
            life: Infinity,
            scene: "temple",
          });
        }
      }
    }
  }

  function hubLocalName() {
    const api = lbApi();
    if (api && api.displayName) {
      const d = api.displayName();
      if (d) return String(d).slice(0, 12);
    }
    if (api && api.getLastName) {
      const g = api.getLastName();
      if (g) return String(g).slice(0, 12);
    }
    if (api && api.chatSenderName) {
      const c = api.chatSenderName();
      if (c) return String(c).slice(0, 12);
    }
    return "YOU";
  }

  function hubLocalIsAccount() {
    const api = lbApi();
    return !!(api && api.isSignedIn && api.isSignedIn());
  }

  /**
   * Hub hangout nametag above a sprite. Accounts → gold/wood chip;
   * guests → classic pixel text on a dark pad so it stays readable on the plaza.
   */
  function drawHubNametagAbove(sx, sy, name, isAccount) {
    const raw = String(name || "GUEST").trim() || "GUEST";
    const maxLen = isAccount ? 8 : 10;
    const label = raw.slice(0, maxLen).toUpperCase();
    const tagY = sy - 12;
    const prevInk = ink;
    ink = ctx;
    ctx.globalAlpha = 1;
    if (isAccount) {
      const tw = pixTextWidth(label) + 4;
      const tagX = (sx + 4 - tw / 2) | 0;
      drawNameTag(label, tagX, tagY, maxLen);
    } else {
      const tw = pixTextWidth(label);
      const tagX = (sx + 4 - tw / 2) | 0;
      px(tagX - 2, tagY - 1, tw + 4, 9, "#1a120c");
      px(tagX - 1, tagY, tw + 2, 7, "#3a2414");
      drawPixText(label, tagX, tagY, "#f3e2c4");
    }
    ink = prevInk;
  }

  function drawMiniPlayerAt(sx, sy, face, faceId, backId, alpha) {
    const prevInk = ink;
    ink = ctx;
    ink.save();
    ink.globalAlpha = alpha == null ? 1 : alpha;
    ink.translate(sx + 4, sy + 13);
    ink.scale(face || 1, 1);
    drawCapeSheet(backId, 0.7, 2.1, (sx || 0) * 0.17);
    px(-3, -13, 6, 2, "#c43a28");
    px(-2, -11, 5, 5, "#e8c39a");
    if (faceId === "jade_mask") {
      px(-2, -11, 5, 4, "#2a8a4a");
      px(-1, -10, 3, 2, "#3ec86a");
    } else if (faceId === "straw_hat") {
      px(-4, -15, 8, 1, "#c4a06a");
      px(-3, -14, 6, 2, "#e8c44a");
    } else if (faceId === "crown" || faceId === "beta_crown") {
      px(-3, -16, 6, 2, "#e8c44a");
      px(-3, -16, 1, 3, "#c9a227");
      px(2, -16, 1, 3, "#c9a227");
      if (faceId === "beta_crown") px(-1, -16, 1, 1, "#c43a48");
    }
    px(-3, -6, 6, 6, "#3a6a9a");
    drawCapeCollar(backId);
    px(-3, 1, 2, 3, "#2a4a78");
    px(0, 1, 2, 3, "#2a4a78");
    ink.restore();
    ink = prevInk;
  }

  function refreshHubPeers() {
    hubPeers = [];
    if (scene !== "hub") return;
    const api = lbApi();
    if (!api || !api.getOnlinePresence) return;
    const rows = api.getOnlinePresence() || [];
    const me = api.getClientId ? api.getClientId() : "";
    const hubAware = !!(api.hubPresenceSupported && api.hubPresenceSupported());
    let anyHubSignal = false;
    for (let i = 0; i < rows.length; i++) {
      const r = rows[i];
      if (!r || r.client_id === me) continue;
      if (
        r.in_hub === true ||
        r.mode === "hub" ||
        (typeof r.hub_x === "number" && typeof r.hub_y === "number")
      ) {
        anyHubSignal = true;
        break;
      }
    }
    const filterToHub = hubAware || anyHubSignal;
    let slot = 0;
    for (let i = 0; i < rows.length; i++) {
      const r = rows[i];
      if (!r || r.client_id === me) continue;
      const posed = typeof r.hub_x === "number" && typeof r.hub_y === "number";
      const inHub = r.in_hub === true || r.mode === "hub" || posed;
      if (filterToHub && !inHub) continue;
      const hx = posed ? r.hub_x : 36 + (slot % 5) * 32;
      const hy = posed ? r.hub_y : 40 + ((slot / 5) | 0) * 28;
      slot++;
      hubPeers.push({
        x: hx,
        y: hy,
        facing: r.hub_face === -1 ? -1 : 1,
        face: r.face_id || null,
        back: r.back_id || null,
        name: r.username || "GUEST",
        isAccount: !!(r.user_id),
        emote: r.emote || "",
      });
    }
  }

  function syncPresenceLoadout() {
    const api = lbApi();
    if (!api || typeof api.setPresenceLoadout !== "function") return;
    api.setPresenceLoadout({
      face_id: cosmetics.face || null,
      back_id: effectiveBack(playerSkin, cosmetics.back),
      skin_id: playerSkin || "classic",
    });
  }

  function syncHubPresencePose() {
    const api = lbApi();
    if (!api || typeof api.setHubPresence !== "function") return;
    syncPresenceLoadout();
    if (scene !== "hub") {
      api.setHubPresence(null);
      return;
    }
    api.setHubPresence({
      x: player.x | 0,
      y: player.y | 0,
      face: player.facing | 0,
      face_id: cosmetics.face,
      back_id: effectiveBack(playerSkin, cosmetics.back),
      emote: hubEmoteT > 0 ? hubEmote : "",
    });
  }

  function drawProfileLoadoutPreview(fx, fy, skin, face, back) {
    const prevFace = cosmetics.face;
    const prevBack = cosmetics.back;
    cosmetics.face = face || null;
    cosmetics.back = back || null;
    const prevInk = ink;
    ink = ctx;
    ink.save();
    ink.translate(fx, fy);
    ink.scale(1.6, 1.6);
    const bob = ((Math.sin(time * 2.1) * 0.5) | 0);
    ink.translate(0, bob);
    drawCapeSheet(back, 0.85, 2.0, time);
    drawPlayerBody(skin || "classic", 0, false, false);
    drawCapeCollar(back);
    if (skin === "beta_alien") drawAlienPortalWisps(0, -8);
    if (skin === "flash") drawFlashElectricity(0, -8);
    ink.restore();
    ink = prevInk;
    cosmetics.face = prevFace;
    cosmetics.back = prevBack;
  }

  function drawHubPeers(cpos, t) {
    refreshHubPeers();
    for (let i = 0; i < hubPeers.length; i++) {
      const p = hubPeers[i];
      const sx = (p.x - cpos.x) | 0;
      const sy = (p.y - cpos.y) | 0;
      if (sx < -24 || sy < -28 || sx > viewW + 24 || sy > viewH + 24) continue;
      drawMiniPlayerAt(sx, sy, p.facing, p.face, p.back, 0.95);
    }
  }

  function drawHubNametags(cpos) {
    if (scene !== "hub") return;
    // Peers first, then local on top so your name stays readable when overlapping
    for (let i = 0; i < hubPeers.length; i++) {
      const p = hubPeers[i];
      const sx = (p.x - cpos.x) | 0;
      const sy = (p.y - cpos.y) | 0;
      if (sx < -40 || sy < -40 || sx > viewW + 40 || sy > viewH + 40) continue;
      drawHubNametagAbove(sx, sy, p.name, !!p.isAccount);
      if (p.emote) {
        const prevInk = ink;
        ink = ctx;
        drawPixText(p.emote, sx + 4, sy - 22, "#ffe08a", "center");
        ink = prevInk;
      }
    }
    const lsx = (player.x - cpos.x) | 0;
    const lsy = (player.y - cpos.y) | 0;
    drawHubNametagAbove(lsx, lsy, hubLocalName(), hubLocalIsAccount());
  }

  function drawHubEmote(cpos) {
    const x = (player.x - cpos.x + 4) | 0;
    const y = (player.y - cpos.y - 22) | 0;
    const prevInk = ink;
    ink = ctx;
    drawPixText(hubEmote || "!", x, y, "#ffe08a", "center");
    ink = prevInk;
  }

  function drawHubOverlay() {
    if (scene !== "hub" || uiBlocksPlay()) return;
    const uiW = canvas.width / SCALE_UI;
    if (hubUi.tipT > 0 && hubUi.tip) {
      drawPixText(hubUi.tip, (uiW / 2) | 0, 10, "#f3e2c4", "center");
    }
    const api = lbApi();
    const n = api && api.getOnlineCount ? api.getOnlineCount() : null;
    if (n != null) {
      const t = api.getTotalPlayerCount ? api.getTotalPlayerCount() : null;
      const onlineTxt = "ONLINE " + (n | 0);
      const totalTxt = t != null && t >= 0 ? "TOTAL " + (t | 0) : null;
      const iconW = 6;
      const gapIcon = 2;
      const gapPair = 5;
      const onlineTw = pixTextWidthSm(onlineTxt);
      const totalTw = totalTxt ? pixTextWidthSm(totalTxt) : 0;
      const pair1 = iconW + gapIcon + onlineTw;
      const pair2 = totalTxt ? iconW + gapIcon + totalTw : 0;
      const inner = totalTxt ? pair1 + gapPair + pair2 : pair1;
      let x = uiW - 6 - inner;
      drawOnlineStatIcon(x, 6);
      drawPixTextSm(onlineTxt, x + iconW + gapIcon, 7, "#c9a227");
      if (totalTxt) {
        x += pair1 + gapPair;
        drawTotalStatIcon(x, 6);
        drawPixTextSm(totalTxt, x + iconW + gapIcon, 7, "#c9a227");
      }
    }
  }

  function tryHubEmote() {
    if (scene !== "hub") return;
    hubEmote = ["!", "HI", "GG", "~"][irand(0, 3)];
    hubEmoteT = 2.2;
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
      "9 FACE SLOT  0 BACK SLOT",
      "ENTER DROPS OR EQUIPS COSMETIC",
      "SPACE USES HELD ITEM",
      "CLOAK SPACE = STEALTH",
      "TEMPLE IS DEEP EAST JUNGLE",
      "WALK INLAND, NOT THE BEACH",
      "HUGE MAZE WITH NO TRAPS",
      "JADE MASK AT THE FAR END",
      "RIVER RUINS HALF TO TEMPLE",
      "RIVER POOL MIDWAY TO RUINS",
      "CAVES AND TIDE ON THE POOL",
      "DINGHY STEERS ON THE POOL",
      "BLUE PORTAL OPENS ON ROME",
      "GOLD EXIT LEAVES THE TEMPLE",
      "DAILY SUN IDOL NEAR TEMPLE",
      "HUB IS A TITLE-SCREEN MODE",
      "OPEN HANGOUT PLAZA",
      "WEEKLY REWARDS NEEDS ACCOUNT",
      "FREE  3 REWARDS A WEEK",
      "HUB: TAB CHAT, E EMOTE, ESC",
      "SHELL BLOWS THE HORN",
      "FAR HORN WAKES SERPENT",
      "WAND HITS BREACHING SERPENT",
      "METAL SHIP OFFSHORE OF DOCK",
      "E OPENS THE SATCHEL",
      "MASK% TAKE THE JADE MASK",
      "HOLD BAIT TO CAST BETTER",
      "T OPENS CHEST IN CABIN",
      "T TRADES NEAR NPC",
      "C / F CASTS THE ROD",
      "TAB OPENS ISLAND CHAT",
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
      px(
        0,
        0,
        viewW,
        viewH,
        scene === "cabin"
          ? "#071018"
          : scene === "temple"
            ? "#12100c"
            : scene === "vein"
              ? "#080a0e"
              : scene === "hub"
                ? "#1a1810"
                : scene === "sub"
                  ? "#101820"
                  : scene === "floor" || scene === "wreck"
                    ? "#061018"
                    : "#2a1c12"
      );
      if (scene === "cabin") drawCabinSea(cpos, t);
      if (scene === "vein" && vein) {
        vein.draw(cpos, t);
      } else if (rome && rome.isScene()) {
        rome.draw(cpos);
      } else {
        const room =
          scene === "fish"
            ? fishCanvas
            : scene === "cabin"
              ? cabinCanvas
              : scene === "temple"
                ? templeCanvas
                : scene === "hub"
                  ? hubCanvas
                  : scene === "sub"
                    ? subCanvas
                    : scene === "floor"
                      ? floorCanvas
                      : scene === "wreck"
                        ? wreckCanvas
                        : shopCanvas;
        const rw = indoorW();
        const rh = indoorH();
        if (room) ctx.drawImage(room, 0, 0, rw, rh, -cpos.x, -cpos.y, rw, rh);
      }
      if (scene === "sub" || scene === "floor" || scene === "wreck") drawDiveWorld(cpos, t);
      if (scene !== "sub" && scene !== "floor" && scene !== "wreck" && scene !== "vein" && !(rome && rome.isScene())) drawIndoorLight(cpos);
      if (scene === "shop") drawShopGoldSpark(cpos, t);
      if (scene === "cabin") {
        drawCabinChest(cpos);
        drawChestSpill(cpos);
        drawCabinLampFlicker(cpos);
      }
      if (scene === "temple") drawTemplePedestal(cpos, t);
      if (scene === "hub") {
        drawHubPeers(cpos, t);
      }
      if (!(rome && rome.isScene())) {
        for (let i = 0; i < npcs.length; i++) drawNpcLit(cpos, npcs[i], t);
      }
      if (scene === "cabin") drawWardenMagic(cpos, t);
      else if (scene === "shop" || scene === "fish") drawShopkeeperBubble(cpos, t);
      drawLoot(cpos);
      drawPlayerLit(cpos, false);
      if (rome && rome.isScene()) rome.drawFront(cpos);
      if (scene === "vein") drawWandBolts(cpos);
      if (scene === "floor" || scene === "wreck") drawAirBubble(cpos);
      if (scene === "cabin") drawCabinMotes(cpos);
      if (scene === "hub") {
        drawHubNametags(cpos);
        if (hubEmoteT > 0) drawHubEmote(cpos);
      }
    } else {
      px(0, 0, viewW, viewH, WATER_BLUE);
      drawLand(cpos);
      drawFoam(cpos, t);
      drawDockOverFoam(cpos);
      drawRocks(cpos);
      drawPond(cpos, t);
      drawRuins(cpos, t);
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
      drawSubmarine(cpos, t);
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
    drawJadeMaskFx();
    if (cloakOn) applyCloakVision(cpos, jx, jy);
    ctx.setTransform(SCALE_UI, 0, 0, SCALE_UI, 0, 0);
    drawHud();
    drawSerpentBossBar();
    if (scene === "vein" && vein) {
      ctx.setTransform(SCALE_UI, 0, 0, SCALE_UI, 0, 0);
      vein.drawHud();
    }
    if (rome && rome.isScene()) {
      ctx.setTransform(SCALE_UI, 0, 0, SCALE_UI, 0, 0);
      rome.drawHud();
    }
    drawHubOverlay();
    drawDiveHud();
    drawGuide();
    drawBlowfishHearts();
    drawPortalLeechGlow();
    drawPickupFx();
    drawUseFx();
    drawDamage(canvas.width / SCALE_UI, canvas.height / SCALE_UI);
    drawFade();
    drawSpeedTimer();
    drawAccountHudChip();
    drawSpeedUI();
    drawIslandChat();
    drawReplayHud();
  }

  /** Jade, antique gold, and soft moss wisps orbiting the player. Positions are recomputed from the sprite each frame. */
  function drawJadeMaskFx() {
    if (!jadeMaskFx) return;
    const fx = jadeMaskFx;
    const t = fx.t;
    const dur = fx.dur;
    const cpos = cam();
    const cx = player.x + player.w / 2 - cpos.x;
    const cy = player.y + player.h * 0.4 - cpos.y;
    const fade = t < 0.14 ? t / 0.14 : t > dur - 0.42 ? Math.max(0, (dur - t) / 0.42) : 1;
    ctx.save();
    const ringU = Math.min(1, t / 0.65);
    const ringA = fade * (1 - ringU);
    if (ringA > 0.04) {
      ctx.globalAlpha = ringA;
      const rr = 3 + ringU * 13;
      for (let k = 0; k < 14; k++) {
        const a = (k / 14) * Math.PI * 2 + t;
        const col = k % 3 === 0 ? "#e8c44a" : k % 3 === 1 ? "#2a6b40" : "#c5d6b0";
        px((cx + Math.cos(a) * rr) | 0, (cy + Math.sin(a) * rr * 0.72) | 0, 1, 1, col);
      }
    }
    for (let i = 0; i < fx.sparks.length; i++) {
      const s = fx.sparks[i];
      const spin = s.ang + t * s.orbit;
      const breathe = Math.sin(t * 3.1 + s.phase) * 1.3;
      const open = Math.sin(Math.min(1, t / 0.32) * Math.PI * 0.5);
      const rad = s.rad * (0.5 + open * 0.65) + breathe;
      const rise = t * s.rise * (s.kind === 2 ? 1.15 : 0.32);
      const x = cx + Math.cos(spin) * rad;
      const y = cy + Math.sin(spin) * rad * 0.62 - rise;
      const flick = 0.5 + 0.5 * Math.sin(t * 9 + s.phase);
      ctx.globalAlpha = fade * (0.45 + 0.55 * flick) * (s.kind === 2 ? 0.75 : 1);
      let col = "#2a6b40";
      if (s.kind === 1) col = i & 1 ? "#e8c44a" : "#c9a227";
      else if (s.kind === 2) col = "rgba(210, 206, 170, 0.88)";
      else col = i % 3 === 0 ? "#1a4a30" : i % 3 === 1 ? "#3a8f52" : "#c5d6b0";
      px(x | 0, y | 0, s.w, s.w, col);
      if (s.kind === 1 && flick > 0.72) {
        ctx.globalAlpha = fade * 0.85;
        px((x | 0) + 1, y | 0, 1, 1, "#f3e2c4");
      }
    }
    ctx.restore();
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
      replayActive ||
      uiScreen === "logo" ||
      uiScreen === "mode" ||
      uiScreen === "categories" ||
      uiScreen === "finish" ||
      uiScreen === "boards" ||
      uiScreen === "account" ||
      uiScreen === "nm_boards" ||
      uiScreen === "profiles" ||
      uiScreen === "walkthrough" ||
      uiScreen === "spin" ||
      uiScreen === "quests"
    );
  }

  function skipLogoToMode() {
    if (uiScreen !== "logo") return;
    uiScreen = "mode";
    logoStartPerf = 0;
  }

  function logoElapsedMs() {
    if (!logoStartPerf) logoStartPerf = performance.now();
    return performance.now() - logoStartPerf;
  }

  function drawLogoCard() {
    const uiW = canvas.width / SCALE_UI;
    const uiH = canvas.height / SCALE_UI;
    const elapsed = logoElapsedMs();
    const total = LOGO_POP_MS + LOGO_HOLD_MS + LOGO_FADE_MS;
    if (elapsed >= total) {
      skipLogoToMode();
      drawModeSelect();
      return;
    }

    let alpha = 1;
    let scale = 1;
    if (elapsed < LOGO_POP_MS) {
      const u = elapsed / LOGO_POP_MS;
      const ease = 1 - Math.pow(1 - u, 3);
      alpha = ease;
      scale = 0.82 + 0.18 * ease;
    } else if (elapsed > LOGO_POP_MS + LOGO_HOLD_MS) {
      const u = (elapsed - LOGO_POP_MS - LOGO_HOLD_MS) / LOGO_FADE_MS;
      alpha = Math.max(0, 1 - u);
      scale = 1 - 0.06 * u;
    }

    ctx.globalAlpha = 0.55;
    px(0, 0, uiW, uiH, "#0b1a22");
    ctx.globalAlpha = 1;

    const card = Math.min(128, ((Math.min(uiW, uiH) * 0.52) | 0));
    const cx = (uiW / 2) | 0;
    const cy = (uiH / 2) | 0;
    const drawW = Math.max(8, (card * scale) | 0);
    const drawH = drawW;
    const x = (cx - drawW / 2) | 0;
    const y = (cy - drawH / 2) | 0;
    const pad = Math.max(2, ((5 * drawW) / card) | 0);
    const art = Math.max(4, drawW - pad * 2);

    ctx.save();
    ctx.globalAlpha = alpha;
    // Thin wood / gold frame matching parchment panels
    px(x, y, drawW, drawH, "#3a2414");
    px(x + 1, y + 1, drawW - 2, drawH - 2, "#8a5a32");
    px(x + 2, y + 2, drawW - 4, drawH - 4, "#c9a227");
    px(x + 3, y + 3, drawW - 6, drawH - 6, "#5c3a21");
    px(x + pad, y + pad, art, art, "#0b1a22");

    if (logoSheetReady && logoSheet) {
      const frame = ((elapsed / LOGO_FRAME_MS) | 0) % LOGO_FRAMES;
      const sx = frame * LOGO_FRAME_PX;
      const prevSmooth = ctx.imageSmoothingEnabled;
      ctx.imageSmoothingEnabled = false;
      ctx.drawImage(
        logoSheet,
        sx,
        0,
        LOGO_FRAME_PX,
        LOGO_FRAME_PX,
        x + pad,
        y + pad,
        art,
        art
      );
      ctx.imageSmoothingEnabled = prevSmooth;
    } else {
      drawPixText("ISLEBOUND", cx, cy - 2, "#f3e2c4", "center");
    }
    ctx.restore();

    addMenuHit("logo:skip", 0, 0, uiW, uiH, () => skipLogoToMode(), { hover: true });
  }

  function openWalkthrough(kind) {
    walkKind = kind === "speedrun" ? "speedrun" : kind === "hub" ? "hub" : "normal";
    walkStep = 0;
    uiScreen = "walkthrough";
    playMode = null;
  }

  function walkPages() {
    return WALK_PAGES[walkKind] || WALK_PAGES.normal;
  }

  function activateModeOpt(i) {
    if (i === 0) enterNormalMode();
    else if (i === 1) {
      playMode = "speedrun";
      uiScreen = "categories";
      srCursor = 0;
      refreshSpeedBoard(SPEED_ORDER[0]);
    } else if (i === 2) enterHubMode();
    else if (i === 3) {
      uiScreen = "account";
      authMode = "menu";
      authStatus = "";
      srCursor = 0;
      const api = lbApi();
      if (api && api.ensureProfile && api.isSignedIn && api.isSignedIn()) api.ensureProfile();
    }     else if (i === 4) {
      uiScreen = "nm_boards";
      nmCursor = 0;
      nmBoardKind = "playtime";
      refreshNmBoard(nmBoardKind);
    } else if (i === 5) openSpinMenu();
    else if (i === 6) openWalkthrough("normal");
    else if (i === 7) openWalkthrough("speedrun");
    else if (i === 8) openWalkthrough("hub");
  }

  function speedrunActive() {
    return playMode === "speedrun" && (srRunning || uiScreen === "ready");
  }

  function clearReplayBuffer() {
    srReplayFrames = [];
    srReplayLastT = -999;
  }

  function packReplayInv() {
    const out = [];
    for (let i = 0; i < MAX_SLOTS; i++) {
      const s = inventory[i];
      out.push(s && s.id ? s.id + ":" + (s.count | 0) : "");
    }
    return out;
  }

  function captureReplayFrame(force) {
    if (!srTiming || replayActive) return;
    const t = (performance.now() - srStartPerf) | 0;
    if (!force && t - srReplayLastT < 33 && srReplayFrames.length) return;
    srReplayLastT = t;
    // Pond dinghy counts as the craft for EEL% / LEECH% replay anti-cheat.
    const b =
      player.aboard && aboardKind === "dinghy" && pondBoat
        ? pondBoat
        : ownedBoat || (pondBoat && (srCat === "waterfall_eel" || srCat === "portal_leech") ? pondBoat : null);
    const frame = [
      t,
      player.x,
      player.y,
      player.facing | 0,
      player.aboard ? 1 : 0,
      cloakOn ? 1 : 0,
      player.coins | 0,
      player.hp | 0,
      b ? b.x : -1,
      b ? b.y : -1,
      b ? b.face | 0 : 0,
      REPLAY_ROD[rod.phase] != null ? REPLAY_ROD[rod.phase] : 0,
      REPLAY_SCENE[scene] != null ? REPLAY_SCENE[scene] : 0,
      heldSlot | 0,
      packReplayInv(),
      serpent
        ? [serpent.x, serpent.y, serpent.phase || "shadow", serpent.hp | 0, serpent.hurt || 0]
        : null,
    ];
    srReplayFrames.push(frame);
  }

  function buildReplayPayload() {
    if (!srReplayFrames.length) return null;
    captureReplayFrame(true);
    return {
      v: 1,
      run_id: srRunId || null,
      category: srCat,
      time_ms: srFinalMs | 0,
      player_name: srName || "",
      frames: srReplayFrames.slice(),
    };
  }

  function applyReplayInv(pack) {
    if (!Array.isArray(pack)) return;
    for (let i = 0; i < MAX_SLOTS; i++) {
      const raw = pack[i] || "";
      if (!raw) {
        inventory[i] = null;
        continue;
      }
      const parts = String(raw).split(":");
      const id = parts[0];
      const count = Math.max(1, parts[1] | 0);
      inventory[i] = ITEM_DEFS[id] ? { id, count } : null;
    }
  }

  function applyReplaySerpent(pack) {
    if (!pack || !Array.isArray(pack)) {
      if (serpent) {
        serpent = null;
        resumeDayClock();
      }
      return;
    }
    const phase = pack[2] || "shadow";
    if (!serpent) {
      serpent = {
        x: pack[0],
        y: pack[1],
        ang: 0,
        phase,
        t: 0,
        hp: pack[3] | 0,
        hurt: pack[4] || 0,
        struck: false,
        splashDown: false,
        strikeX: pack[0],
        strikeY: pack[1],
        breachAng: 0,
        waveT: 0,
        segs: [],
      };
      for (let i = 0; i < SERPENT_SEGMENTS; i++) {
        serpent.segs.push({ x: serpent.x - i * SERPENT_SEG_SPACING, y: serpent.y });
      }
      pauseDayClock();
    } else {
      serpent.x = pack[0];
      serpent.y = pack[1];
      serpent.phase = phase;
      serpent.hp = pack[3] | 0;
      serpent.hurt = pack[4] || 0;
      if (serpent.segs && serpent.segs[0]) {
        serpent.segs[0].x = serpent.x;
        serpent.segs[0].y = serpent.y;
      }
    }
  }

  function applyReplayFrame(f) {
    if (!f || !f.length) return;
    player.x = f[1];
    player.y = f[2];
    player.facing = f[3] === -1 ? -1 : 1;
    player.aboard = !!f[4];
    cloakOn = !!f[5];
    player.coins = f[6] | 0;
    player.hp = Math.max(0, f[7] | 0);
    player.dead = 0;
    player.submerged = 0;
    player.moving = false;
    const bx = f[8];
    const by = f[9];
    if (bx >= 0 && by >= 0) {
      if (!ownedBoat) {
        ownedBoat = {
          x: bx,
          y: by,
          w: 22,
          h: 10,
          vx: 0,
          vy: 0,
          tilt: 0,
          phase: 0,
          face: f[10] === -1 ? -1 : 1,
          kind: "skiff",
          landed: true,
        };
      } else {
        ownedBoat.x = bx;
        ownedBoat.y = by;
        ownedBoat.face = f[10] === -1 ? -1 : 1;
        ownedBoat.vx = 0;
        ownedBoat.vy = 0;
      }
      if (player.aboard) seatPlayerOnBoat();
    } else {
      ownedBoat = null;
      player.aboard = false;
    }
    const rp = REPLAY_ROD_INV[f[11] | 0] || "idle";
    rod.phase = rp;
    if (rp === "idle") {
      rod.catchId = null;
      rod.t = 0;
    }
    const sc = REPLAY_SCENE_INV[f[12] | 0] || "island";
    if (sc === "sub" || sc === "floor" || sc === "wreck") {
      if (scene !== "island") {
        scene = "island";
        doorCool = 0;
      }
      player.x = spawnX;
      player.y = spawnY;
      player.aboard = false;
    } else if (sc !== scene) {
      scene = sc;
      doorCool = 0;
    }
    heldSlot = Math.max(0, Math.min(MAX_SLOTS - 1, f[13] | 0));
    applyReplayInv(f[14]);
    applyReplaySerpent(f[15]);
    camera.x = player.x + player.w / 2 - viewW / 2;
    camera.y = player.y + player.h / 2 - viewH * 0.36;
    clampCamera();
  }

  function replayFrameAt(t) {
    const frames = replayFrames;
    if (!frames.length) return null;
    if (t <= frames[0][0]) return frames[0];
    if (t >= frames[frames.length - 1][0]) return frames[frames.length - 1];
    let lo = 0;
    let hi = frames.length - 1;
    while (lo < hi - 1) {
      const mid = (lo + hi) >> 1;
      if (frames[mid][0] <= t) lo = mid;
      else hi = mid;
    }
    const a = frames[lo];
    const b = frames[hi];
    const span = Math.max(1, b[0] - a[0]);
    const u = (t - a[0]) / span;
    // Snap discrete flags from nearer sample; lerp positions for smoothness.
    const near = u < 0.5 ? a : b;
    return [
      t,
      a[1] + (b[1] - a[1]) * u,
      a[2] + (b[2] - a[2]) * u,
      near[3],
      near[4],
      near[5],
      near[6],
      near[7],
      a[8] < 0 || b[8] < 0 ? near[8] : a[8] + (b[8] - a[8]) * u,
      a[9] < 0 || b[9] < 0 ? near[9] : a[9] + (b[9] - a[9]) * u,
      near[10],
      near[11],
      near[12],
      near[13],
      near[14],
      near[15],
    ];
  }

  function abortReplayFetch() {
    if (!replayFetchAbort) return;
    const ac = replayFetchAbort;
    replayFetchAbort = null;
    try {
      ac.abort();
    } catch (e) {}
  }

  /** Cancel in-flight VID fetch/network and clear the busy latch. */
  function bumpReplayPlayGen() {
    replayPlayGen++;
    srReplayBusy = false;
    abortReplayFetch();
  }

  /** Active spectate or in-flight VID load — Esc / Tab always tear this down. */
  function replaySessionOpen() {
    return replayActive || srReplayBusy;
  }

  /** If a cancelled/failed load left the world with no UI, return to the board. */
  function ensureReplayMenuIfIdle() {
    if (!replayActive && uiScreen == null && playMode === "speedrun") {
      uiScreen = "categories";
      replayCutT = 0;
    }
  }

  function boardRowPrefer(cat, rowIndex) {
    const id = cat || srCat;
    const idx = rowIndex | 0;
    const row = srBoardRows && srBoardRows[idx] ? srBoardRows[idx] : null;
    if (!row) return null;
    const api = lbApi();
    if (api && api.preferFromBoardRow) return api.preferFromBoardRow(row);
    return {
      run_id: row.run_id || null,
      time_ms: row.time_ms | 0,
      player_name: row.player_name || "",
    };
  }

  function boardTopPrefer(cat) {
    return boardRowPrefer(cat, 0);
  }

  function replayMatchesPreferLocal(replay, prefer) {
    if (!replay || !prefer) return false;
    const api = lbApi();
    if (api && api.replayMatchesPrefer) return api.replayMatchesPrefer(replay, prefer);
    const wantRun = prefer.run_id ? String(prefer.run_id) : "";
    const gotRun = replay.run_id ? String(replay.run_id) : "";
    if (wantRun && gotRun) return wantRun === gotRun;
    if ((replay.time_ms | 0) !== (prefer.time_ms | 0)) return false;
    if (!prefer.player_name) return true;
    return String(replay.player_name || "").toUpperCase() === String(prefer.player_name || "").toUpperCase();
  }

  function replayMatchesBoardRow(replay, cat, rowIndex) {
    if (!replay || !replay.frames || !replay.frames.length) return false;
    const id = cat || srCat;
    if (replay.category && replay.category !== id) return false;
    const prefer = boardRowPrefer(id, rowIndex);
    if (!prefer) return false;
    return replayMatchesPreferLocal(replay, prefer);
  }

  function replayMatchesBoardTop(replay, cat) {
    return replayMatchesBoardRow(replay, cat, 0);
  }

  function rowHasReplayVid(rowIndex) {
    const idx = rowIndex | 0;
    if (srReplayAvail && srReplayAvail[idx]) return true;
    // Fallback: cached full payload already matches this exact board row.
    return replayMatchesBoardRow(srBestReplay, srCat || SPEED_ORDER[srCursor], idx);
  }

  /** Stop playback state without returning to menus (used when swapping VID). */
  function clearReplayPlayback() {
    replayActive = false;
    replayFrames = [];
    replayT = 0;
    replayMeta = null;
    if (serpent) {
      serpent = null;
      resumeDayClock();
    }
    clearWandBolts();
    rod.phase = "idle";
    rod.catchId = null;
    cloakOn = false;
  }

  /** Full teardown: cancel fetch+playback, clear busy/active, restore category board. */
  function stopReplay() {
    bumpReplayPlayGen();
    clearReplayPlayback();
    replayCutT = 0;
    guideOpen = false;
    chatOpen = false;
    closeIslandChat();
    playMode = "speedrun";
    uiScreen = "categories";
    srRunning = false;
    srTiming = false;
    const cat = srCat || SPEED_ORDER[srCursor] || SPEED_ORDER[0];
    srCursor = Math.max(0, SPEED_ORDER.indexOf(cat));
    refreshSpeedBoard(cat);
  }

  function startReplay(payload, expectedGen) {
    // Stale start after cancel / newer VID — never revive an old selection.
    if (expectedGen != null && expectedGen !== replayPlayGen) return false;
    if (!payload || !Array.isArray(payload.frames) || !payload.frames.length) return false;
    // Hard-cut any current playback; do not bounce through categories / board refresh.
    clearReplayPlayback();
    chatOpen = false;
    guideOpen = false;
    closeIslandChat();
    resetSpeedrunWorld();
    playMode = "speedrun";
    uiScreen = null;
    srRunning = false;
    srTiming = false;
    srCat = payload.category || srCat;
    replayFrames = payload.frames;
    replayMeta = {
      name: payload.player_name || "?",
      time_ms: payload.time_ms | 0,
      category: payload.category || srCat,
    };
    replayT = replayFrames[0][0] | 0;
    replayActive = true;
    applyReplayFrame(replayFrames[0]);
    replayCutT = 0.14;
    return true;
  }

  /**
   * Spectate the exact top-10 board row at rowIndex (0 = #1).
   * HARD CUT: newest click always wins immediately — abort prior fetch, stop current
   * playback, keep the board up during load, then play only if this gen is still current.
   */
  async function playBoardReplay(cat, rowIndex) {
    const id = cat || srCat || SPEED_ORDER[srCursor];
    const idx = rowIndex | 0;
    // Kill prior fetch + hard-cut playback before any await.
    bumpReplayPlayGen();
    const gen = replayPlayGen;
    srReplayBusy = true;
    srBoardNote = "";
    clearReplayPlayback();
    replayCutT = 0;
    guideOpen = false;
    chatOpen = false;
    // Board stays interactive during load — no world limbo, Esc / other VID clicks work.
    playMode = "speedrun";
    uiScreen = "categories";

    const api = lbApi();
    const prefer = boardRowPrefer(id, idx);
    if (!prefer) {
      if (gen === replayPlayGen) {
        srReplayBusy = false;
        srBoardNote = "NO REPLAY";
      }
      return;
    }
    try {
      let payload =
        srBestReplay && replayMatchesBoardRow(srBestReplay, id, idx) ? srBestReplay : null;
      if ((!payload || !payload.frames) && api && api.fetchBestReplay) {
        srBoardNote = "LOADING VID...";
        const ac = typeof AbortController !== "undefined" ? new AbortController() : null;
        if (ac) replayFetchAbort = ac;
        let res = null;
        try {
          res = await api.fetchBestReplay(id, prefer, ac ? { signal: ac.signal } : undefined);
        } catch (e) {
          if (e && e.name === "AbortError") return;
          res = null;
        } finally {
          if (replayFetchAbort === ac) replayFetchAbort = null;
        }
        if (gen !== replayPlayGen) return;
        if (res && res.aborted) return;
        if (res && res.replay && replayMatchesPreferLocal(res.replay, prefer)) {
          if (!res.replay.category || res.replay.category === id) payload = res.replay;
        }
      }
      if (gen !== replayPlayGen) return;
      if (!payload || !payload.frames || !payload.frames.length) {
        // Keep VID chip if probe marked this row — fetch miss is often name/run_id mismatch, not "no video".
        srBoardNote = "NO REPLAY";
        ensureReplayMenuIfIdle();
        return;
      }
      if (!payload.category) payload.category = id;
      // Final guard: never start a mismatched run for this row.
      if (!replayMatchesPreferLocal(payload, prefer)) {
        srBoardNote = "NO REPLAY";
        ensureReplayMenuIfIdle();
        return;
      }
      // Re-check after awaits / sync work so Esc / newer clicks always win.
      if (gen !== replayPlayGen) return;
      srBestReplay = payload;
      if (!srReplayAvail || srReplayAvail.length <= idx) {
        srReplayAvail = (srBoardRows || []).map(() => false);
      }
      srReplayAvail[idx] = true;
      srBoardNote = "";
      if (!startReplay(payload, gen)) {
        if (gen === replayPlayGen) {
          srBoardNote = "NO REPLAY";
          ensureReplayMenuIfIdle();
        }
      }
    } finally {
      if (gen === replayPlayGen) srReplayBusy = false;
    }
  }

  async function playBestReplay(cat) {
    return playBoardReplay(cat, 0);
  }

  function updateReplay(dt) {
    if (replayCutT > 0) replayCutT = Math.max(0, replayCutT - dt);
    if (!replayActive || !replayFrames.length) return;
    replayT += dt * 1000;
    const lastT = replayFrames[replayFrames.length - 1][0] | 0;
    if (replayT >= lastT) {
      applyReplayFrame(replayFrames[replayFrames.length - 1]);
      replayT = lastT;
      return;
    }
    applyReplayFrame(replayFrameAt(replayT));
  }

  function drawReplayHud() {
    // Safety HUD if a load somehow left uiScreen null; normal loads keep the board up.
    if (!replayActive && !(srReplayBusy && uiScreen == null)) return;
    const uiW = canvas.width / SCALE_UI;
    if (!replayActive) {
      const msg = "LOADING VID  ESC CANCEL";
      const tw = pixTextWidth(msg);
      px(uiW - tw - 14, 6, tw + 10, 12, "#3a2414");
      px(uiW - tw - 13, 7, tw + 8, 10, "#5c3a21");
      const exitSel = menuHovering("replay:exit");
      drawPixText(msg, uiW - 8, 9, exitSel ? "#e8c44a" : "#f3e2c4", "right");
      addMenuHit("replay:exit", uiW - tw - 14, 6, tw + 10, 12, () => stopReplay(), { hover: true });
      return;
    }
    const label = "REPLAY " + catLabel(replayMeta && replayMeta.category);
    const who = String((replayMeta && replayMeta.name) || "?").slice(0, 12);
    const tim = formatSpeedTime((replayMeta && replayMeta.time_ms) | 0);
    const now = formatSpeedTime(replayT | 0);
    const exitTxt = "ESC EXIT";
    const right = now + "  " + exitTxt;
    const rightW = pixTextWidth(right);
    px(6, 6, Math.max(120, pixTextWidth(label) + 16), 28, "#3a2414");
    px(7, 7, Math.max(118, pixTextWidth(label) + 14), 26, "#5c3a21");
    drawPixText(label, 10, 10, "#f3e2c4");
    drawPixText(who + "  " + tim, 10, 20, "#c9a227");
    const exitSel = menuHovering("replay:exit");
    drawPixText(now + "  ", uiW - 8 - pixTextWidth(exitTxt), 10, "#f3e2c4", "right");
    drawPixText(exitTxt, uiW - 8, 10, exitSel ? "#e8c44a" : "#f3e2c4", "right");
    addMenuHit("replay:exit", uiW - rightW - 10, 6, rightW + 8, 14, () => stopReplay(), { hover: true });
    if (replayCutT > 0) {
      ctx.save();
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.globalAlpha = Math.min(1, replayCutT / 0.14);
      ctx.fillStyle = "#080406";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.restore();
    }
  }

  function newSpeedRunId() {
    const api = lbApi();
    return api && api.uuid ? api.uuid() : "run-" + Date.now() + "-" + ((Math.random() * 1e9) | 0);
  }

  function speedNowMs() {
    if (!srTiming) return srFinalMs || srElapsed || 0;
    const now = srPauseAt || performance.now();
    return Math.max(0, now - srStartPerf);
  }

  function setSpeedPaused(on) {
    if (!srTiming) {
      if (!on) srPauseAt = 0;
      return;
    }
    if (on) {
      if (!srPauseAt) srPauseAt = performance.now();
    } else if (srPauseAt) {
      srStartPerf += performance.now() - srPauseAt;
      srPauseAt = 0;
    }
  }

  function freezeSpeedClock() {
    if (!srTiming) return;
    srElapsed = speedNowMs();
    srTiming = false;
    srPauseAt = 0;
    srFinalMs = Math.max(0, srElapsed | 0);
  }

  function lockSpeedFinalMs() {
    if (srTiming) {
      srElapsed = speedNowMs();
      srTiming = false;
      srPauseAt = 0;
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
    srPauseAt = 0;
    srStartPerf = performance.now();
    srElapsed = 0;
    srFinalMs = 0;
    srSubmitted = false;
    if (!srRunId) srRunId = newSpeedRunId();
    clearReplayBuffer();
    captureReplayFrame(true);
  }

  function checkCatchSpeedEnd(id) {
    if (!speedrunActive() || !srTiming || uiScreen === "finish") return;
    if (srCat === "shark" && id === "shark") finishSpeedrun();
    else if (srCat === "jelly_white" && id === "jelly_white") finishSpeedrun();
    else if (srCat === "chest" && id === "chest") finishSpeedrun();
    else if (srCat === "blowfish" && id === "blowfish") {
      // Wait for hearts FX + 1s (see updateBlowfishHearts / scheduleBlowfishSpeedEnd).
      if (!blowfishHearts && srBlowfishFinishT < 0) scheduleBlowfishSpeedEnd(1);
    } else if (srCat === "megalodon" && id === "megalodon") finishSpeedrun();
    else if (srCat === "shark_cloak" && id === "shark" && cloakOn && rod.phase === "idle") finishSpeedrun();
    else if (srCat === "waterfall_eel" && id === "waterfall_eel") finishSpeedrun();
    else if (srCat === "portal_leech" && id === "portal_leech") finishSpeedrun();
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

  function tryGrantLexYoung(ms) {
    if (!(ms > 0) || ms >= 215000) return;
    if (!grantSkin("lex_young")) return;
    equipSkin("lex_young");
    flashQuestUnlock("LEX YOUNG");
  }

  function commitRaceSegment(ms) {
    const time = Math.max(0, Math.round(ms) | 0);
    if (!time) return;
    tryGrantLexYoung(time);
    if (playMode === "speedrun" && srCat === "kings_race") return;
    const api = lbApi();
    const pb = api && api.pbInfo ? api.pbInfo("kings_race", time) : null;
    pendingRaceSeg = { ms: time, pb: pb };
    if (api && api.upsertPr) api.upsertPr("kings_race", time);
  }

  function openRaceSegmentFinish() {
    if (!pendingRaceSeg || playMode === "speedrun") return;
    const seg = pendingRaceSeg;
    srCat = "kings_race";
    srFinalMs = seg.ms;
    srTiming = false;
    srPauseAt = 0;
    srRunning = false;
    srSegmentSurvival = true;
    uiScreen = "finish";
    srFinishSel = 1;
    srStatus = "";
    srSubmitted = false;
    srRunId = newSpeedRunId();
    if (seg.pb) {
      srPbPrev = seg.pb.prev | 0;
      srPbLabel = seg.pb.isFirst ? "FIRST PB" : seg.pb.label;
    } else {
      srPbPrev = 0;
      srPbLabel = "";
    }
    const api = lbApi();
    if (api && api.isSignedIn && api.isSignedIn()) {
      srName = api.displayName() || srName;
      guestNameLocked = true;
    } else {
      guestNameLocked = false;
      if (!srName && api && api.getLastName) srName = api.getLastName() || "";
    }
    refreshSpeedBoard("kings_race");
  }

  function retryFinishRun() {
    if (srSegmentSurvival) {
      srSegmentSurvival = false;
      pendingRaceSeg = null;
      uiScreen = null;
      srFinalMs = 0;
      playMode = "normal";
      if (rome && rome.retryLine) rome.retryLine();
      return;
    }
    beginSpeedCategory(srCat);
  }

  function finishSpeedrun() {
    if (playMode !== "speedrun" || uiScreen === "finish") return;
    // Freeze timer this frame — all end hooks must land here.
    srBlowfishFinishT = -1;
    blowfishHearts = null;
    captureReplayFrame(true);
    lockSpeedFinalMs();
    if (srCat === "kings_race") tryGrantLexYoung(srFinalMs);
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
      if (api.noteSrEvent) api.noteSrEvent("runs", 1);
      // Career XP — finish only (submit/PB/WR bonuses land on successful post)
      const wrMs = catBoardWrMs(srCat);
      applyCareerXp(
        careerXpForRun(srCat, srFinalMs, { submitted: false, pb: false, wr: false, wrMs }),
        "finish"
      );
    }
    checkNovQuestRewards(srCat, srFinalMs);
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
    // Locker cosmetics stay equipped across modes — do not clear face/back.
    cosSelect = null;
    templeMaskTaken = false;
    sunkenTaken = false;
    clearSatchel();
    divePhase = "docked";
    diveT = 0;
    diveTip = "";
    diveTipT = 0;
    diveLeverHeld = false;
    hubUi.tip = "";
    hubUi.tipT = 0;
    hubEmoteT = 0;
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
    srPauseAt = 0;
    srRunning = false;
    srElapsed = 0;
    srFinalMs = 0;
    srStatus = "";
    srSubmitting = false;
    srSubmitted = false;
    srPbPrev = 0;
    srPbLabel = "";
    srBlowfishFinishT = -1;
    blowfishHearts = null;
    jadeMaskFx = null;
    clearReplayBuffer();
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

  async function refreshReplayAvailability(cat, boardGen) {
    const id = cat || srCat;
    const api = lbApi();
    const rows = srBoardRows || [];
    srReplayAvail = rows.map(() => false);
    if (!rows.length) {
      srBestReplay = null;
      return;
    }
    // Seed from local cache only when it matches an exact board row.
    if (api && api.loadLocalReplay) {
      const local = api.loadLocalReplay(id);
      if (local && (!local.category || local.category === id)) {
        for (let i = 0; i < rows.length; i++) {
          if (replayMatchesBoardRow(local, id, i)) {
            srBestReplay = local;
            srReplayAvail[i] = true;
            break;
          }
        }
      }
    }
    if (!api || !api.probeReplayAvailability) return;
    if (api.configured && !api.configured()) return;
    try {
      const avail = await api.probeReplayAvailability(id, rows);
      if (boardGen != null && boardGen !== srBoardGen) return;
      if (!Array.isArray(avail)) return;
      srReplayAvail = rows.map((_, i) => !!(avail[i] || srReplayAvail[i]));
    } catch (e) {
      /* keep local seeds */
    }
  }

  async function refreshSpeedBoard(cat) {
    const id = cat || srCat;
    const boardGen = ++srBoardGen;
    // Category / board refresh always cancels any pending VID load and hard-cuts playback.
    bumpReplayPlayGen();
    clearReplayPlayback();
    replayCutT = 0;
    ensureReplayMenuIfIdle();
    const api = lbApi();
    srBoardNote = "LOADING...";
    srBestReplay = null;
    srReplayAvail = [];
    if (!api) {
      if (boardGen !== srBoardGen) return;
      srBoardRows = [];
      srBoardNote = "NO CLIENT";
      return;
    }
    if (api.fetchKnownIdentities) {
      try {
        await api.fetchKnownIdentities();
      } catch (e) {}
    }
    if (boardGen !== srBoardGen) return;
    if (!api.configured()) {
      if (boardGen !== srBoardGen) return;
      srBoardRows = applyBoardIdentityMerge(api.getCachedBoard(id) || [], 10);
      srBoardNote = srBoardRows.length ? "CACHED / OFFLINE" : "SET UP SUPABASE";
      await refreshReplayAvailability(id, boardGen);
      return;
    }
    const res = await api.fetchTop(id, 10);
    if (boardGen !== srBoardGen) return;
    srBoardRows = applyBoardIdentityMerge(res.rows || [], 10);
    srBoardNote = res.ok ? "" : res.offline ? "OFFLINE" : res.error || "ERROR";
    refreshCareerLevelCache();
    // One lightweight meta probe for all top-10 rows (no frames) — VID only when matched.
    await refreshReplayAvailability(id, boardGen);
  }

  function beginSpeedCategory(cat) {
    pendingRaceSeg = null;
    srSegmentSurvival = false;
    srCat = cat;
    playMode = "speedrun";
    resetSpeedrunWorld();
    if (rome && rome.isSpeedCat(cat)) rome.prepareSpeed(cat);
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
    // Respect daily claim after load
    try {
      const day = utcDayKey();
      const local = localStorage.getItem("islebound-daily-claim") || dailyClaimedUtc || "";
      if (local === day) {
        dailyClaimedUtc = day;
        for (let i = loot.length - 1; i >= 0; i--) {
          if (loot[i] && loot[i].id === "sun_idol") loot.splice(i, 1);
        }
      }
    } catch (e) {}
    const api = lbApi();
    if (api && api.loadLocalNmStats) {
      const st = api.loadLocalNmStats();
      // Survival loot XP retired — career rank is speedrun-driven only.
      if (st && player.coins > (st.coins_high | 0) && api.noteNmEvent) api.noteNmEvent("coins_high", player.coins);
    }
    camera.x = player.x + player.w / 2 - viewW / 2;
    camera.y = player.y + player.h / 2 - viewH * 0.36;
    clampCamera();
  }

  function enterHubMode() {
    if (!hubCanvas) bakeHubInterior();
    playMode = "hub";
    uiScreen = null;
    scene = "hub";
    player.aboard = false;
    player.dead = 0;
    player.hurt = 0;
    player.x = (HUB_W / 2 - 4) | 0;
    player.y = HUB_H - 44;
    player.facing = 1;
    hubUi.tip = "TAB CHAT · E EMOTE · ESC LEAVES";
    hubUi.tipT = 4;
    hubEmoteT = 0;
    guideOpen = false;
    camera.x = player.x + player.w / 2 - viewW / 2;
    camera.y = player.y + player.h / 2 - viewH * 0.36;
    clampCamera();
    syncPresenceActivity();
  }

  function leaveHubMode() {
    hubUi.tip = "";
    hubUi.tipT = 0;
    hubEmoteT = 0;
    const api = lbApi();
    if (api && typeof api.setHubPresence === "function") api.setHubPresence(null);
    scene = "island";
    backToModeMenu();
  }

  function backToModeMenu() {
    if (serpent) endSerpentFight("flee");
    bumpReplayPlayGen();
    clearReplayPlayback();
    replayCutT = 0;
    let restoreCursor = 0;
    if (uiScreen === "walkthrough") {
      if (walkKind === "speedrun") restoreCursor = MODE_PLAY.length + 1;
      else if (walkKind === "hub") restoreCursor = MODE_PLAY.length + 2;
      else restoreCursor = MODE_PLAY.length;
    } else if (playMode === "hub") restoreCursor = 2;
    playMode = null;
    uiScreen = "mode";
    srCursor = restoreCursor;
    srRunning = false;
    srTiming = false;
    guideOpen = false;
    walkStep = 0;
    authMode = "menu";
    authStatus = "";
    authField = 0;
    if (scene === "hub") scene = "island";
    const api = lbApi();
    if (api && typeof api.setHubPresence === "function") api.setHubPresence(null);
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
    bumpReplayPlayGen();
    clearReplayPlayback();
    replayCutT = 0;
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
    const romeFrozen = !!(srFinalMs && !srTiming && rome && rome.isScene());
    if (!(srTiming || uiScreen === "ready" || uiScreen === "finish" || romeFrozen)) return;
    const uiW = canvas.width / SCALE_UI;
    let ms = srFinalMs;
    // Finish screen always shows locked final — never live clock.
    if (uiScreen === "finish" || romeFrozen) ms = srFinalMs;
    else if (srTiming) ms = speedNowMs();
    else if (uiScreen === "ready") ms = 0;
    const label = formatSpeedTime(ms);
    const tw = pixTextWidth(label);
    const x = uiW - tw - 10;
    const y = 6;
    px(x - 4, y - 3, tw + 8, 13, "#3a2414");
    px(x - 3, y - 2, tw + 6, 11, srPauseAt ? "#e8c44a" : "#5c3a21");
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
      const timeX = Math.max(tagX + 1, x + 100);
      drawPixText(timeStr, timeX, yy, "#5c3a21");
      {
        const catId = srCat || SPEED_ORDER[srCursor];
        const hasVid = rowHasReplayVid(i);
        const vx = timeX + pixTextWidth(timeStr) + 4;
        const vidKey = "vid:" + (i + 1);
        if (hasVid) {
          const vidSel = menuHovering(vidKey);
          px(vx - 1, yy - 1, 22, 9, vidSel ? "#e8c44a" : "#5c3a21");
          drawPixText("VID", vx + 1, yy, vidSel ? "#2b1c12" : "#f3e2c4");
          addMenuHit(vidKey, vx - 1, yy - 1, 22, 9, () => playBoardReplay(catId, i), {
            hover: true,
          });
        }
      }
      yy += 8;
    }
    if (srBoardNote) {
      drawPixText(srBoardNote, x, yy + 2, "#8a5a32");
      yy += 10;
    }
    return yy;
  }

  /** ~2/3 scale pixel text for compact HUD chips. */
  function pixTextWidthSm(text) {
    const n = String(text || "").length;
    if (!n) return 0;
    return Math.max(1, ((n * 6 * 2) / 3) | 0);
  }

  function drawPixTextSm(text, x, y, color, align) {
    const s = String(text || "").toUpperCase();
    if (!s) return;
    const prevInk = ink;
    ink = ctx;
    ctx.save();
    ctx.imageSmoothingEnabled = false;
    let ox = 0;
    if (align === "center") ox = -((pixTextWidthSm(s) / 2) | 0);
    else if (align === "right") ox = -pixTextWidthSm(s);
    ctx.translate((x | 0) + ox, y | 0);
    ctx.scale(2 / 3, 2 / 3);
    for (let i = 0; i < s.length; i++) drawPixChar(s[i], i * 6, 0, color);
    ctx.restore();
    ink = prevInk;
  }

  /** Top-corner hub chip with text optically centered in its box. */
  function drawHubChip(label, x, y, key, onClick) {
    const padX = 5;
    const tw = pixTextWidth(label);
    const w = tw + padX * 2;
    const h = 16;
    const hot = menuHovering(key);
    px(x, y, w, h, hot ? "#c9a227" : "#2b1c12");
    px(x + 1, y + 1, w - 2, h - 2, hot ? "#e8c44a" : "#5c3a21");
    // Glyph is 7px in a 14px face (h=16 with 1px border) → y+5 is true center
    drawPixText(label, x + padX, y + 5, hot ? "#2b1c12" : "#f3e2c4");
    addMenuHit(key, x, y, w, h, onClick, { hover: true });
    return w;
  }

  /** Compact green live-player (6x6) for ONLINE. */
  function drawOnlineStatIcon(x, y) {
    px(x + 2, y, 2, 2, "#f3e2c4");
    px(x + 1, y + 2, 4, 1, "#c4a574");
    px(x, y + 3, 6, 3, "#3ddc5a");
    px(x, y + 3, 6, 1, "#1a4020");
  }

  /** Compact group (6x6) for TOTAL. */
  function drawTotalStatIcon(x, y) {
    px(x, y + 1, 2, 2, "#c4a574");
    px(x, y + 3, 3, 3, "#5c3a21");
    px(x + 3, y, 2, 2, "#f3e2c4");
    px(x + 2, y + 2, 4, 1, "#c4a574");
    px(x + 2, y + 3, 4, 3, "#8a5a32");
  }

  function onlineLabel() {
    const api = lbApi();
    if (!api || typeof api.getOnlineCount !== "function") return "ONLINE —";
    const n = api.getOnlineCount();
    const online = n == null || n < 0 ? "—" : String(n | 0);
    const t = api.getTotalPlayerCount ? api.getTotalPlayerCount() : null;
    if (t == null || t < 0) return "ONLINE " + online;
    return "ONLINE " + online + " / TOTAL " + (t | 0);
  }

  /** Compact [icon] ONLINE n  [icon] TOTAL n strip — sits just under the panel title. */
  function drawOnlineChip(cx, y) {
    nudgePresenceRefresh();
    const api = lbApi();
    const n = api && api.getOnlineCount ? api.getOnlineCount() : null;
    const online = n == null || n < 0 ? "—" : String(n | 0);
    const t = api && api.getTotalPlayerCount ? api.getTotalPlayerCount() : null;
    const total = t == null || t < 0 ? null : String(t | 0);
    const iconW = 6;
    const gapIcon = 2;
    const gapPair = 5;
    const chipH = 11;
    const onlineTxt = "ONLINE " + online;
    const totalTxt = total != null ? "TOTAL " + total : null;
    const onlineTw = pixTextWidthSm(onlineTxt);
    const totalTw = totalTxt ? pixTextWidthSm(totalTxt) : 0;
    const pair1 = iconW + gapIcon + onlineTw;
    const pair2 = totalTxt ? iconW + gapIcon + totalTw : 0;
    const inner = totalTxt ? pair1 + gapPair + pair2 : pair1;
    const x = (cx - inner / 2) | 0;
    px(x - 4, y, inner + 8, chipH, "#3a2414");
    px(x - 3, y + 1, inner + 6, chipH - 2, "#5c3a21");
    const iy = y + 2;
    drawOnlineStatIcon(x, iy);
    drawPixTextSm(onlineTxt, x + iconW + gapIcon, iy + 1, "#f3e2c4");
    if (totalTxt) {
      const tx = x + pair1 + gapPair;
      drawTotalStatIcon(tx, iy);
      drawPixTextSm(totalTxt, tx + iconW + gapIcon, iy + 1, "#f3e2c4");
    }
  }

  function clearLockerHits() {
    lockerHits = [];
  }

  function addLockerHit(key, x, y, w, h, meta) {
    lockerHits.push({ key, x, y, w, h, meta: meta || null });
  }

  function hitLockerAt(ux, uy) {
    for (let i = lockerHits.length - 1; i >= 0; i--) {
      const h = lockerHits[i];
      if (ux >= h.x && uy >= h.y && ux < h.x + h.w && uy < h.y + h.h) return h;
    }
    return null;
  }

  /** Standing locker mannequin (screen space, feet at fx,fy). */
  function drawLockerPreview(fx, fy) {
    const skin = lockerPreviewSkin();
    const face = lockerPreviewFace();
    const back = lockerPreviewBack();
    const prevFace = cosmetics.face;
    const prevBack = cosmetics.back;
    cosmetics.face = face;
    cosmetics.back = back;
    ink.save();
    ink.translate(fx, fy);
    ink.scale(2, 2);
    const bob = ((Math.sin(time * 2.1) * 0.6) | 0);
    ink.translate(0, bob);
    drawCapeSheet(back, 0.9, 2.2, time);
    drawPlayerBody(skin, 0, false, false);
    drawCapeCollar(back);
    if (skin === "beta_alien") drawAlienPortalWisps(0, -8);
    if (skin === "flash") drawFlashElectricity(0, -8);
    ink.restore();
    cosmetics.face = prevFace;
    cosmetics.back = prevBack;
  }

  function drawNorwayFlagIcon(x, y) {
    px(x, y, 8, 6, "#ba0c2f");
    px(x + 2, y, 2, 6, "#f4f4f8");
    px(x, y + 2, 8, 2, "#f4f4f8");
    px(x + 3, y, 1, 6, "#00205b");
    px(x, y + 3, 8, 1, "#00205b");
  }

  function drawLockedBackIcon(id, x, y) {
    if (id === "norway_flag") drawNorwayFlagIcon(x, y);
    else if (id === "jamaica_flag") {
      px(x, y, 8, 2, "#1e8a34");
      px(x, y + 2, 8, 2, "#e8c44a");
      px(x, y + 4, 8, 2, "#1a1a1a");
    } else if (id === "us_flag") {
      px(x, y, 8, 2, "#c43a48");
      px(x, y + 2, 8, 1, "#f4f4f8");
      px(x, y + 3, 8, 2, "#c43a48");
      px(x, y, 3, 3, "#3a5aaa");
    } else if (id === "stop_pre_flag") {
      px(x, y, 8, 6, "#1a1a1a");
      px(x + 1, y + 1, 6, 1, "#f4f4f8");
      px(x + 1, y + 3, 6, 1, "#f4f4f8");
      px(x + 3, y + 2, 2, 1, "#e8c44a");
    } else if (!drawTinyCatch(id, x, y)) {
      drawHudIcon(id, x - 4, y - 4);
    }
  }

  function drawLockerSocket(x, y, label, kind, equippedId) {
    const w = 26;
    const h = 26;
    const locked = kind === "back" && backSlotLocked(lockerPreviewSkin());
    const showId = locked ? skinLockedBack(lockerPreviewSkin()) : equippedId;
    const hot =
      !locked &&
      (menuHovering("lock:" + kind) || (lockerDrag && lockerDrag.kind === kind));
    px(x, y, w, h, locked ? "#5c3a21" : hot ? "#c9a227" : "#2b1c12");
    px(x + 1, y + 1, w - 2, h - 2, locked ? "#3a2414" : "#3a2414");
    px(x + 2, y + 2, w - 4, h - 4, "#1a120c");
    if (showId) {
      if (kind === "skin") {
        ink.save();
        ink.translate(x + 13, y + 22);
        drawPlayerBody(showId, 0, false, true);
        ink.restore();
      } else if (
        showId === "norway_flag" ||
        showId === "jamaica_flag" ||
        showId === "us_flag" ||
        showId === "stop_pre_flag"
      ) {
        drawLockedBackIcon(showId, x + 9, y + 10);
      } else if (!drawTinyCatch(showId, x + 9, y + 9)) {
        drawHudIcon(showId, x + 1, y + 1);
      }
    }
    drawPixTextSm(
      locked ? "FLAG" : label,
      x + ((w / 2) | 0),
      y + h + 2,
      locked ? "#e8c44a" : "#c4a574",
      "center"
    );
    addMenuHit(
      "lock:" + kind,
      x,
      y,
      w,
      h,
      () => {
        if (locked) return;
        if (lockerDrag) {
          applyLockerDrop(kind);
          return;
        }
        if (kind === "skin") return;
        if (cosmetics[kind]) unequipCosmetic(kind);
      },
      { hover: !locked }
    );
    if (!locked) addLockerHit("sock:" + kind, x, y, w, h, { type: "socket", kind });
  }

  function applyLockerDrop(kind) {
    if (!lockerDrag) return;
    if (kind === "skin") {
      if (lockerDrag.type === "skin") equipSkin(lockerDrag.id);
    } else if (lockerDrag.type === "cosmetic") {
      const ck = cosmeticKindOf(lockerDrag.id);
      if (ck === kind) {
        if (kind === "back" && backSlotLocked()) {
          lockerDrag = null;
          return;
        }
        equipCosmetic(lockerDrag.id);
      }
    }
    lockerDrag = null;
  }

  function drawLockerStripItem(x, y, id, type, opts) {
    const w = (opts && opts.w) || 24;
    const h = (opts && opts.h) || 24;
    const showLabel = !!(opts && opts.label);
    const eq =
      type === "skin"
        ? playerSkin === id
        : cosmetics.face === id || cosmetics.back === id;
    const dragging = lockerDrag && lockerDrag.id === id && lockerDrag.type === type;
    const hot =
      !dragging &&
      lockerHover &&
      lockerHover.id === id &&
      lockerHover.type === type;
    px(x, y, w, h, eq ? "#e8c44a" : hot ? "#c9a227" : "#2b1c12");
    px(x + 1, y + 1, w - 2, h - 2, eq ? "#c9a227" : "#5c3a21");
    px(x + 2, y + 2, w - 4, h - 4, "#1a120c");
    if (!dragging) {
      if (type === "skin") {
        ink.save();
        ink.translate(x + ((w / 2) | 0), y + h - 4);
        drawPlayerBody(id, 0, false, true);
        ink.restore();
      } else if (!drawTinyCatch(id, x + ((w / 2) | 0) - 4, y + ((h / 2) | 0) - 4)) {
        drawHudIcon(id, x + (((w - 16) / 2) | 0), y + (((h - 16) / 2) | 0));
      }
    }
    if (showLabel) {
      const lab = type === "skin" ? skinLabel(id) : cosmeticLabel(id);
      drawPixTextSm(lab, x + ((w / 2) | 0), y + h + 2, eq ? "#e8c44a" : "#8a6a42", "center");
    }
    // Clip hit box to the browse grid so scrolled / bottom-row skins stay clickable
    // (old logic required the full cell inside the viewport and blocked quest skins).
    let hx = x | 0;
    let hy = y | 0;
    let hw = w | 0;
    let hh = (h + (showLabel ? 8 : 0)) | 0;
    if (lockerGridBounds) {
      const g = lockerGridBounds;
      const x0 = Math.max(hx, g.x);
      const y0 = Math.max(hy, g.y);
      const x1 = Math.min(hx + hw, g.x + g.w);
      const y1 = Math.min(hy + hh, g.y + g.h);
      if (x1 <= x0 || y1 <= y0) return;
      hx = x0;
      hy = y0;
      hw = x1 - x0;
      hh = y1 - y0;
    }
    addMenuHit(
      "lockitem:" + type + ":" + id,
      hx,
      hy,
      hw,
      hh,
      () => {
        if (type === "skin") equipSkin(id);
        else {
          const kind = cosmeticKindOf(id);
          if (cosmetics[kind] === id) unequipCosmetic(kind);
          else equipCosmetic(id);
        }
      },
      { hover: true }
    );
    addLockerHit("item:" + type + ":" + id, hx, hy, hw, hh, {
      type,
      id,
      kind: type === "skin" ? "skin" : cosmeticKindOf(id),
    });
  }

  function clampLockerScroll(scroll, maxScroll) {
    const m = Math.max(0, maxScroll | 0);
    let s = scroll | 0;
    if (s < 0) s = 0;
    if (s > m) s = m;
    return s;
  }

  function drawLockerScrollBar(x, y, h, scroll, maxScroll) {
    if (maxScroll <= 0 || h < 12) return;
    const trackW = 2;
    px(x, y, trackW, h, "#1a120c");
    const thumbH = Math.max(8, ((h * h) / (h + maxScroll)) | 0);
    const thumbY = y + ((((h - thumbH) * scroll) / maxScroll) | 0);
    px(x, thumbY, trackW, thumbH, "#c9a227");
  }

  function whatsNewItem(i) {
    if (!WHATS_NEW.length) return null;
    const n = WHATS_NEW.length;
    let idx = ((i | 0) % n + n) % n;
    return WHATS_NEW[idx];
  }

  function advanceWhatsNew(dir) {
    if (!WHATS_NEW.length) return;
    const n = WHATS_NEW.length;
    const step = dir == null ? 1 : dir | 0;
    whatsNewIndex = ((whatsNewIndex + step) % n + n) % n;
    whatsNewRotAt = Date.now();
    whatsNewFade = 0;
  }

  function tickWhatsNewCarousel() {
    if (!WHATS_NEW.length) return;
    const now = Date.now();
    if (!whatsNewRotAt) whatsNewRotAt = now;
    if (whatsNewFade < 1) {
      whatsNewFade = Math.min(1, whatsNewFade + 0.08);
    }
    if (whatsNewHover) {
      if (whatsNewPauseElapsed < 0) whatsNewPauseElapsed = now - whatsNewRotAt;
      whatsNewRotAt = now - whatsNewPauseElapsed;
      return;
    }
    whatsNewPauseElapsed = -1;
    if (now - whatsNewRotAt >= WHATS_NEW_ROT_MS) advanceWhatsNew(1);
  }

  function openWhatsNewItem(item) {
    if (!item) return;
    if (item.kind === "skin") {
      if (ownsSkin(item.id)) {
        equipSkin(item.id);
        lockerTab = "skins";
      } else {
        openQuestMenu();
        for (let i = 0; i < NOV_QUESTS.length; i++) {
          if (NOV_QUESTS[i].rewardKind === "skin" && NOV_QUESTS[i].rewardId === item.id) {
            questCursor = i;
            break;
          }
        }
      }
      return;
    }
    if (item.kind === "quest") {
      openQuestMenu();
      for (let i = 0; i < NOV_QUESTS.length; i++) {
        if (NOV_QUESTS[i].id === item.id) {
          questCursor = i;
          break;
        }
      }
      return;
    }
    if (item.kind === "speed") {
      playMode = "speedrun";
      uiScreen = "categories";
      let idx = SPEED_ORDER.indexOf(item.id);
      if (idx < 0) idx = 0;
      srCursor = idx;
      refreshSpeedBoard(SPEED_ORDER[idx] || SPEED_ORDER[0]);
    }
  }

  function whatsNewKindLabel(kind) {
    if (kind === "skin") return "SKIN";
    if (kind === "quest") return "QUEST";
    if (kind === "speed") return "SPEED";
    return "NEW";
  }

  function drawWhatsNewArt(item, cx, cy, scale) {
    if (!item) return;
    const s = scale || 2;
    ink.save();
    ink.translate(cx, cy);
    ink.scale(s, s);
    if (item.kind === "skin") {
      const locked = skinLockedBack(item.id);
      if (locked) drawCapeSheet(locked, 0.7, 2.0, time);
      drawPlayerBody(item.id, 0, false, false);
      if (locked) drawCapeCollar(locked);
      if (item.id === "beta_alien") drawAlienPortalWisps(0, -8);
      if (item.id === "flash") drawFlashElectricity(0, -8);
    } else if (item.kind === "quest") {
      let q = null;
      for (let i = 0; i < NOV_QUESTS.length; i++) {
        if (NOV_QUESTS[i].id === item.id) {
          q = NOV_QUESTS[i];
          break;
        }
      }
      if (q && q.rewardKind === "skin") {
        drawPlayerBody(q.rewardId, 0, false, false);
      } else if (q && q.rewardKind === "cosmetic") {
        drawCapeSheet(q.rewardId, 0.9, 2.2, time);
        drawPlayerBody("classic", 0, false, false);
        drawCapeCollar(q.rewardId);
      } else {
        drawPlayerBody("classic", 0, false, false);
      }
    } else if (item.kind === "speed") {
      ink.scale(1.4, 1.4);
      drawSpeedCatIcon(item.id, -4, -6);
    }
    ink.restore();
  }

  /** Disney+-style featured rail on the right of the locker mannequin. */
  function drawWhatsNewRail(x, y, w, h) {
    tickWhatsNewCarousel();
    if (!WHATS_NEW.length || w < 72 || h < 80) return;

    const item = whatsNewItem(whatsNewIndex);
    const hot = !!(menuHoverKey && String(menuHoverKey).indexOf("whatsnew:") === 0);
    whatsNewHover = hot;

    // Outer wood frame
    px(x, y, w, h, "#1a120c");
    px(x + 1, y + 1, w - 2, h - 2, hot ? "#c9a227" : "#3a2414");
    px(x + 2, y + 2, w - 4, h - 4, "#2b1c12");

    // Header band
    px(x + 2, y + 2, w - 4, 13, "#3a2414");
    px(x + 2, y + 14, w - 4, 1, "#c9a227");
    drawPixTextSm("WHATS NEW", x + ((w / 2) | 0), y + 5, "#e8c44a", "center");

    const artTop = y + 18;
    const artH = Math.max(36, ((h - 18 - 42) * 0.62) | 0);
    const artBot = artTop + artH;
    const copyY = artBot + 4;
    const dotsY = y + h - 10;

    // Atmospheric art stage (kind tint — not flat fill)
    const kind = item.kind;
    const stageA = kind === "speed" ? "#0c2230" : kind === "quest" ? "#241810" : "#122018";
    const stageB = kind === "speed" ? "#163848" : kind === "quest" ? "#3a2414" : "#1a3840";
    const stageC = kind === "speed" ? "#1e5070" : kind === "quest" ? "#5c3a21" : "#2a5860";
    px(x + 3, artTop, w - 6, artH, stageA);
    px(x + 4, artTop + 2, w - 8, ((artH * 0.55) | 0), stageB);
    px(x + 6, artTop + ((artH * 0.35) | 0), w - 12, ((artH * 0.28) | 0), stageC);
    // Soft vignette bars
    px(x + 3, artTop, w - 6, 2, "#0a1520");
    px(x + 3, artBot - 2, w - 6, 2, "#0a1520");
    px(x + 3, artTop, 2, artH, "#0a1520");
    px(x + w - 5, artTop, 2, artH, "#0a1520");

    // Featured graphic with fade-in + idle bob
    const fade = whatsNewFade;
    const bob = ((Math.sin(time * 2.4) * 1.2) | 0);
    const artCx = x + ((w / 2) | 0);
    const artCy = artTop + ((artH * 0.72) | 0) + bob;
    ctx.save();
    ctx.beginPath();
    ctx.rect(x + 3, artTop, w - 6, artH);
    ctx.clip();
    ctx.globalAlpha = 0.35 + 0.65 * fade;
    drawWhatsNewArt(item, artCx, artCy, kind === "speed" ? 2.6 : 2.1);
    ctx.restore();

    // NEW chip + kind label over art
    drawNewTag(x + 6, artTop + 4);
    const kindLab = whatsNewKindLabel(kind);
    const kw = pixTextWidthSm(kindLab);
    px(x + w - 8 - kw - 4, artTop + 3, kw + 5, 9, "#1a120c");
    px(x + w - 7 - kw - 4, artTop + 4, kw + 3, 7, "#5c3a21");
    drawPixTextSm(kindLab, x + w - 6 - ((kw / 2) | 0) - 2, artTop + 5, "#f3e2c4", "center");

    // Copy block
    ctx.globalAlpha = 0.4 + 0.6 * fade;
    drawPixText(String(item.title || "").slice(0, 14), artCx, copyY, "#f3e2c4", "center");
    drawPixTextSm(String(item.blurb || "").slice(0, 16), artCx, copyY + 10, "#c9a227", "center");
    drawPixTextSm(String(item.detail || "").slice(0, 18), artCx, copyY + 19, "#8a6a42", "center");
    ctx.globalAlpha = 1;

    // Auto-advance progress strip (freezes while hovered)
    const progW = w - 10;
    const progX = x + 5;
    const progY = dotsY - 5;
    px(progX, progY, progW, 2, "#1a120c");
    const prog = whatsNewRotAt
      ? Math.min(1, (Date.now() - whatsNewRotAt) / WHATS_NEW_ROT_MS)
      : 0;
    if (prog > 0) px(progX, progY, Math.max(1, (progW * prog) | 0), 2, "#e8c44a");

    // Card click first; side nudges + dots registered after so they win hit tests
    addMenuHit(
      "whatsnew:card",
      x,
      y,
      w,
      h - 14,
      () => openWhatsNewItem(item),
      { hover: true }
    );
    addMenuHit(
      "whatsnew:prev",
      x,
      artTop,
      14,
      artH,
      () => advanceWhatsNew(-1),
      { hover: true }
    );
    addMenuHit(
      "whatsnew:next",
      x + w - 14,
      artTop,
      14,
      artH,
      () => advanceWhatsNew(1),
      { hover: true }
    );
    if (menuHovering("whatsnew:prev") || hot) {
      drawPixTextSm("<", x + 6, artTop + ((artH / 2) | 0) - 3, "#e8c44a", "left");
    }
    if (menuHovering("whatsnew:next") || hot) {
      drawPixTextSm(">", x + w - 8, artTop + ((artH / 2) | 0) - 3, "#e8c44a", "left");
    }

    // Dot pagination
    const n = WHATS_NEW.length;
    const dotGap = 5;
    const dotsW = n * 3 + (n - 1) * (dotGap - 3);
    let dx = artCx - ((dotsW / 2) | 0);
    for (let i = 0; i < n; i++) {
      const on = i === whatsNewIndex;
      px(dx, dotsY, on ? 4 : 3, 3, on ? "#e8c44a" : "#5c3a21");
      addMenuHit(
        "whatsnew:dot:" + i,
        dx - 2,
        dotsY - 2,
        8,
        7,
        () => {
          whatsNewIndex = i;
          whatsNewRotAt = Date.now();
          whatsNewFade = 0;
        },
        { hover: true }
      );
      dx += on ? 4 + (dotGap - 3) : dotGap;
    }
  }

  function drawModeSelect() {
    const uiW = canvas.width / SCALE_UI;
    const uiH = canvas.height / SCALE_UI;

    // Read hover from last frame's hit boxes before rebuilding them
    {
      const lh = hitLockerAt(pointerUi.x, pointerUi.y);
      if (lh && lh.meta && (lh.meta.type === "skin" || lh.meta.type === "cosmetic" || lh.meta.type === "tab")) {
        lockerHover = { id: lh.meta.id, type: lh.meta.type };
      } else {
        lockerHover = null;
      }
    }
    clearLockerHits();

    // Solid backdrop (no stripes through title / panel)
    px(0, 0, uiW, uiH, "#0a1520");

    const pad = 10;
    const topY = 6;
    const topBandH = 32;
    px(0, 0, uiW, topBandH, "#0a1520");

    // Corner chips — measure first so right edge never clips
    const chipH = 16;
    const statsW = pixTextWidth("STATS") + 10;
    const profW = pixTextWidth("PROFILES") + 10;
    const accW = pixTextWidth("ACCOUNT") + 10;
    const rightGap = 6;
    const accX = uiW - pad - accW;
    const profX = accX - rightGap - profW;
    const statsX = profX - rightGap - statsW;
    drawHubChip("REWARDS", pad, topY, "hub:rewards", () => openRewardsMenu("quests"));
    drawHubChip("STATS", statsX, topY, "hub:stats", () => {
      uiScreen = "nm_boards";
      statsMode = "survival";
      nmCursor = 0;
      nmBoardKind = "playtime";
      refreshNmBoard(nmBoardKind);
    });
    drawHubChip("PROFILES", profX, topY, "hub:profiles", () => {
      uiScreen = "profiles";
      profileSearch = "";
      profileFocus = null;
      profileField = 0;
      profileResults = searchLocalProfiles("");
      srCursor = 0;
    });
    drawHubChip("ACCOUNT", accX, topY, "hub:account", () => {
      uiScreen = "account";
      authMode = "menu";
      authStatus = "";
      srCursor = 0;
      const api = lbApi();
      if (api && api.ensureProfile && api.isSignedIn && api.isSignedIn()) api.ensureProfile();
    });

    const cx = (uiW / 2) | 0;
    drawPixText("ISLEBOUND", cx, topY + 1, "#f3e2c4", "center");
    drawOnlineChip(cx, topY + chipH + 2);

    const modeH = 26;
    const modeY = uiH - modeH - 10;
    const panelX = pad;
    const panelY = topBandH + 4;
    const panelW = 104;
    const panelH = modeY - panelY - 8;
    const stageLeft = panelX + panelW + 14;
    const stageRight = uiW - pad;
    const stageW = Math.max(0, stageRight - stageLeft);
    // Featured rail on the right of the mannequin (Disney+-style What's New)
    const whatsGap = 10;
    const whatsW = Math.min(128, Math.max(96, ((stageW * 0.4) | 0)));
    const showWhats = stageW >= 180 && whatsW >= 96;
    const whatsX = showWhats ? stageRight - whatsW : stageRight;
    const previewRight = showWhats ? whatsX - whatsGap : stageRight;
    const stageCx = ((stageLeft + previewRight) / 2) | 0;

    // Stage first (cape may spill) — locker panel + What's New drawn after
    const previewY = panelY + ((panelH * 0.58) | 0);
    ctx.save();
    ctx.beginPath();
    ctx.rect(stageLeft, panelY, Math.max(0, previewRight - stageLeft), panelH);
    ctx.clip();
    // Other online players behind you (Fortnite-style lobby line)
    drawLobbyPeerLine(stageCx, previewY, stageLeft, previewRight);
    drawLockerPreview(stageCx, previewY);
    {
      const localName = hubLocalName();
      const isAcc = hubLocalIsAccount();
      const tag = String(localName || "YOU").toUpperCase().slice(0, isAcc ? 8 : 9);
      const nameY = previewY - 40;
      const lvStr = String(careerLevel);
      drawLevelBadge(careerLevel, (stageCx - (pixTextWidth(lvStr) + 3) / 2) | 0, nameY - 10);
      if (isAcc) {
        drawNameTag(tag, (stageCx - pixTextWidth(tag) / 2) | 0, nameY);
      } else {
        drawPixText(tag, stageCx, nameY, "#f3e2c4", "center");
      }
    }
    ctx.restore();

    if (showWhats) {
      drawWhatsNewRail(whatsX, panelY, whatsW, panelH);
    }

    // Left locker panel (opaque, on top of stage spill)
    px(panelX, panelY, panelW, panelH, "#1a120c");
    px(panelX + 1, panelY + 1, panelW - 2, panelH - 2, "#3a2414");
    px(panelX + 2, panelY + 2, panelW - 4, panelH - 4, "#2b1c12");
    px(panelX + 2, panelY + 2, panelW - 4, 13, "#3a2414");
    drawPixTextSm("LOCKER", panelX + ((panelW / 2) | 0), panelY + 5, "#e8c44a", "center");

    const sockY = panelY + 20;
    const sockGap = 4;
    const sockW = 26;
    const socksRowW = sockW * 3 + sockGap * 2;
    const sockX0 = panelX + (((panelW - socksRowW) / 2) | 0);
    drawLockerSocket(sockX0, sockY, "FACE", "face", cosmetics.face);
    drawLockerSocket(
      sockX0 + sockW + sockGap,
      sockY,
      "BACK",
      "back",
      effectiveBack(lockerPreviewSkin(), cosmetics.back)
    );
    drawLockerSocket(sockX0 + (sockW + sockGap) * 2, sockY, "SKIN", "skin", playerSkin);

    // Tab switcher between sockets and browse grid
    const tabY = sockY + 42;
    const tabH = 15;
    const tabGap = 2;
    const tabPad = 3;
    const tabInnerW = panelW - 4 - tabPad * 2;
    const tabW = ((tabInnerW - tabGap) / 2) | 0;
    const tabX0 = panelX + 2 + tabPad;
    const tabs = [
      { id: "skins", label: "SKINS" },
      { id: "cosmetics", label: "COSMETICS" },
    ];
    for (let ti = 0; ti < tabs.length; ti++) {
      const t = tabs[ti];
      const tx = tabX0 + ti * (tabW + tabGap);
      const on = lockerTab === t.id;
      const hot = !on && (menuHovering("locktab:" + t.id) || (lockerHover && lockerHover.type === "tab" && lockerHover.id === t.id));
      px(tx, tabY, tabW, tabH, on ? "#c9a227" : "#1a120c");
      px(tx + 1, tabY + 1, tabW - 2, tabH - 2, on ? "#e8c44a" : hot ? "#5c3a21" : "#3a2414");
      if (on) px(tx + 2, tabY + tabH - 2, tabW - 4, 1, "#2b1c12");
      drawPixTextSm(
        t.label,
        tx + ((tabW / 2) | 0),
        tabY + 4,
        on ? "#2b1c12" : hot ? "#f3e2c4" : "#8a6a42",
        "center"
      );
      const selectTab = () => {
        lockerTab = t.id;
        lockerDrag = null;
        lockerHover = null;
      };
      addMenuHit("locktab:" + t.id, tx, tabY, tabW, tabH, selectTab, { hover: true });
      addLockerHit("tab:" + t.id, tx, tabY, tabW, tabH, { type: "tab", id: t.id });
    }
    px(panelX + 2, tabY + tabH + 1, panelW - 4, 1, "#1a120c");

    const gridTop = tabY + tabH + 8;
    const gridBot = panelY + panelH - 6;
    const gridViewH = Math.max(0, gridBot - gridTop);
    lockerGridBounds = null;

    if (lockerTab === "cosmetics") {
      const cosList = ownedCosmetics.slice();
      const cell = 22;
      const cellGap = 4;
      const labelH = 8;
      const cols = 3;
      const rowPitch = cell + cellGap + labelH;
      const gridInnerW = cols * cell + (cols - 1) * cellGap;
      const gridPad = ((panelW - gridInnerW) / 2) | 0;
      if (!cosList.length) {
        drawPixTextSm(
          "NONE YET",
          panelX + ((panelW / 2) | 0),
          gridTop + 18,
          "#5c3a21",
          "center"
        );
        drawPixTextSm(
          "FIND GEAR OUT",
          panelX + ((panelW / 2) | 0),
          gridTop + 30,
          "#5c3a21",
          "center"
        );
        drawPixTextSm(
          "IN THE WORLD",
          panelX + ((panelW / 2) | 0),
          gridTop + 40,
          "#5c3a21",
          "center"
        );
      } else {
        const rows = Math.max(1, Math.ceil(cosList.length / cols));
        const contentH = rows * rowPitch - cellGap;
        const maxScroll = Math.max(0, contentH - gridViewH);
        lockerScrollCosmetics = clampLockerScroll(lockerScrollCosmetics, maxScroll);
        lockerGridBounds = {
          x: panelX,
          y: gridTop,
          w: panelW,
          h: gridViewH,
          maxScroll,
          tab: "cosmetics",
          step: rowPitch,
        };
        ctx.save();
        ctx.beginPath();
        ctx.rect(panelX + 2, gridTop, panelW - 4, gridViewH);
        ctx.clip();
        for (let i = 0; i < cosList.length; i++) {
          const col = i % cols;
          const row = (i / cols) | 0;
          const ix = panelX + gridPad + col * (cell + cellGap);
          const iy = gridTop - lockerScrollCosmetics + row * rowPitch;
          if (iy + cell + labelH < gridTop || iy > gridBot) continue;
          drawLockerStripItem(ix, iy, cosList[i], "cosmetic", {
            w: cell,
            h: cell,
            label: true,
          });
        }
        ctx.restore();
        drawLockerScrollBar(panelX + panelW - 4, gridTop, gridViewH, lockerScrollCosmetics, maxScroll);
      }
    } else {
      // Owned skins only (launch free + quest unlocks) — fixed size, scroll if needed
      ensureLaunchSkins();
      const skinList = [];
      for (let i = 0; i < ALL_SKIN_IDS.length; i++) {
        if (ownsSkin(ALL_SKIN_IDS[i])) skinList.push(ALL_SKIN_IDS[i]);
      }
      const skinCols = 2;
      const skinCell = 26;
      const labelH = 8;
      const skinGapX = 6;
      const skinGapY = 4;
      const rowPitch = skinCell + labelH + skinGapY;
      const skinInnerW = skinCols * skinCell + (skinCols - 1) * skinGapX;
      const skinPadX = panelX + (((panelW - skinInnerW) / 2) | 0);
      if (!skinList.length) {
        drawPixTextSm(
          "NO SKINS",
          panelX + ((panelW / 2) | 0),
          gridTop + 18,
          "#5c3a21",
          "center"
        );
      } else {
        const skinRows = Math.max(1, Math.ceil(skinList.length / skinCols));
        const contentH = skinRows * rowPitch - skinGapY;
        const maxScroll = Math.max(0, contentH - gridViewH);
        lockerScrollSkins = clampLockerScroll(lockerScrollSkins, maxScroll);
        lockerGridBounds = {
          x: panelX,
          y: gridTop,
          w: panelW,
          h: gridViewH,
          maxScroll,
          tab: "skins",
          step: rowPitch,
        };
        ctx.save();
        ctx.beginPath();
        ctx.rect(panelX + 2, gridTop, panelW - 4, gridViewH);
        ctx.clip();
        for (let i = 0; i < skinList.length; i++) {
          const col = i % skinCols;
          const row = (i / skinCols) | 0;
          const iy = gridTop - lockerScrollSkins + row * rowPitch;
          if (iy + skinCell + labelH < gridTop || iy > gridBot) continue;
          drawLockerStripItem(
            skinPadX + col * (skinCell + skinGapX),
            iy,
            skinList[i],
            "skin",
            { w: skinCell, h: skinCell, label: true }
          );
        }
        ctx.restore();
        drawLockerScrollBar(panelX + panelW - 4, gridTop, gridViewH, lockerScrollSkins, maxScroll);
      }
    }

    // Mode band — keep clear of the locker panel so bottom skins aren't covered
    px(stageLeft - 4, modeY - 6, uiW - (stageLeft - 4), modeH + 16, "#0a1520");
    px(0, modeY + modeH + 2, uiW, Math.max(0, uiH - (modeY + modeH + 2)), "#0a1520");
    const modes = [
      { label: "SURVIVAL", idx: 0 },
      { label: "SPEEDRUN", idx: 1 },
      { label: "HUB", idx: 2 },
    ];
    const tileW = 78;
    const tileH = modeH;
    const tileGap = 10;
    const tilesW = modes.length * tileW + (modes.length - 1) * tileGap;
    const tileX0 = (cx - tilesW / 2) | 0;
    for (let i = 0; i < modes.length; i++) {
      const m = modes[i];
      const tx = tileX0 + i * (tileW + tileGap);
      const key = "mode:" + m.idx;
      const sel = srCursor === m.idx || menuHovering(key);
      px(tx, modeY, tileW, tileH, sel ? "#e8c44a" : "#2b1c12");
      px(tx + 1, modeY + 1, tileW - 2, tileH - 2, sel ? "#e8c44a" : "#8a5a32");
      px(tx + 2, modeY + 2, tileW - 4, tileH - 4, sel ? "#f3e2c4" : "#5c3a21");
      const labelY = modeY + (((tileH - 7) / 2) | 0) + 1;
      drawModeMenuIcon(m.label === "SURVIVAL" ? "NORMAL" : m.label, tx + 7, labelY - 1);
      drawPixText(m.label, tx + 20, labelY, sel ? "#2b1c12" : "#f3e2c4");
      addMenuHit(
        key,
        tx,
        modeY,
        tileW,
        tileH,
        () => {
          srCursor = m.idx;
          activateModeOpt(m.idx);
        },
        { hover: true }
      );
    }

    if (lockerDrag) {
      const gx = (pointerUi.x - 11) | 0;
      const gy = (pointerUi.y - 11) | 0;
      px(gx, gy, 22, 22, "#c9a227");
      px(gx + 2, gy + 2, 18, 18, "#1a120c");
      if (lockerDrag.type === "skin") {
        ink.save();
        ink.translate(gx + 11, gy + 20);
        drawPlayerBody(lockerDrag.id, 0, false, true);
        ink.restore();
      } else if (!drawTinyCatch(lockerDrag.id, gx + 7, gy + 7)) {
        drawHudIcon(lockerDrag.id, gx - 2, gy - 2);
      }
    }
  }

  function drawWalkthrough() {
    const pages = walkPages();
    const page = pages[walkStep] || pages[0];
    const uiW = canvas.width / SCALE_UI;
    const uiH = canvas.height / SCALE_UI;
    ctx.globalAlpha = 0.55;
    px(0, 0, uiW, uiH, "#0b1a22");
    ctx.globalAlpha = 1;
    const lines = page.lines || [];
    const w = 196;
    const h = 28 + lines.length * 10 + 36;
    const x = ((uiW - w) / 2) | 0;
    const y = Math.max(4, ((uiH - h) / 2) | 0);
    drawPanelBox(x, y, w, h, page.title || "WALKTHROUGH");
    const stepLabel = "STEP " + (walkStep + 1) + "/" + pages.length;
    drawPixText(stepLabel, (x + w / 2) | 0, y + 18, "#5c3a21", "center");
    for (let i = 0; i < lines.length; i++) {
      drawPixText(lines[i], (x + w / 2) | 0, y + 32 + i * 10, "#3a2414", "center");
    }
    const by = y + h - 22;
    const backSel = menuHovering("walk:back");
    const nextSel = menuHovering("walk:next");
    const menuSel = menuHovering("walk:menu");
    if (backSel) px(x + 10, by - 2, 52, 11, "#e8c44a");
    drawPixText(walkStep > 0 ? "< BACK" : "< MENU", x + 14, by, backSel ? "#2b1c12" : "#5c3a21");
    addMenuHit("walk:back", x + 10, by - 2, 52, 11, () => {
      if (walkStep > 0) walkStep -= 1;
      else backToModeMenu();
    }, { hover: true });
    if (walkStep < pages.length - 1) {
      if (nextSel) px(x + w - 62, by - 2, 52, 11, "#e8c44a");
      drawPixText("NEXT >", x + w - 58, by, nextSel ? "#2b1c12" : "#5c3a21");
      addMenuHit("walk:next", x + w - 62, by - 2, 52, 11, () => {
        walkStep = Math.min(pages.length - 1, walkStep + 1);
      }, { hover: true });
    } else {
      if (menuSel) px(x + w - 62, by - 2, 52, 11, "#e8c44a");
      drawPixText("DONE", x + w - 52, by, menuSel ? "#2b1c12" : "#5c3a21");
      addMenuHit("walk:menu", x + w - 62, by - 2, 52, 11, () => backToModeMenu(), { hover: true });
    }
    drawPixText("ARROWS  ESC MENU", (x + w / 2) | 0, y + h - 10, "#8a5a32", "center");
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
      drawSpeedCatIcon(id, x + 7, oy - 1);
      drawPixText(catLabel(id), x + 18, oy, sel ? "#2b1c12" : "#3a2414");
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
        } else if (i === 1) retryFinishRun();
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
        drawPixText(opts[i], (x + w / 2) | 0, oy, sel ? "#2b1c12" : "#3a2414", "center");
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
        drawPixText(opts[i], (x + w / 2) | 0, oy, sel ? "#2b1c12" : "#3a2414", "center");
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
        drawPixText(opts[i], (x + w / 2) | 0, oy, sel ? "#2b1c12" : "#3a2414", "center");
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
      drawPixText(actions[i], (x + w / 2) | 0, oy, sel ? "#2b1c12" : "#3a2414", "center");
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

  function searchLocalProfiles(q) {
    const api = lbApi();
    if (api && api.searchLocalProfiles) return api.searchLocalProfiles(q);
    return [];
  }

  function drawNmBoardScreen() {
    const uiW = canvas.width / SCALE_UI;
    const uiH = canvas.height / SCALE_UI;
    ctx.globalAlpha = 0.5;
    px(0, 0, uiW, uiH, "#0b1a22");
    ctx.globalAlpha = 1;
    const api = lbApi();
    const leftW = 110;
    const boardW = 180;
    const h = Math.min(uiH - 16, 150);
    const totalW = leftW + boardW + 10;
    const x = ((uiW - totalW) / 2) | 0;
    const y = Math.max(4, ((uiH - h) / 2) | 0);

    // Survival / Speedrun switcher
    const tabY = y - 16;
    const tabs = [
      { id: "survival", label: "SURVIVAL" },
      { id: "speedrun", label: "SPEEDRUN" },
    ];
    const tabW = 70;
    const tabX0 = (uiW / 2 - (tabW * 2 + 6) / 2) | 0;
    for (let i = 0; i < tabs.length; i++) {
      const t = tabs[i];
      const tx = tabX0 + i * (tabW + 6);
      const on = statsMode === t.id;
      const key = "statsmode:" + t.id;
      const hot = !on && menuHovering(key);
      px(tx, tabY, tabW, 12, on ? "#c9a227" : "#2b1c12");
      px(tx + 1, tabY + 1, tabW - 2, 10, on ? "#e8c44a" : hot ? "#5c3a21" : "#3a2414");
      drawPixText(t.label, tx + ((tabW / 2) | 0), tabY + 3, on ? "#2b1c12" : "#f3e2c4", "center");
      addMenuHit(
        key,
        tx,
        tabY,
        tabW,
        12,
        () => {
          statsMode = t.id;
          nmCursor = 0;
          if (statsMode === "survival") {
            nmBoardKind = "playtime";
            refreshNmBoard(nmBoardKind);
          }
        },
        { hover: true }
      );
    }

    if (statsMode === "speedrun") {
      drawPanelBox(x, y, leftW, h, "SPEEDRUN");
      const sr = api && api.loadLocalSrStats ? api.loadLocalSrStats() : { playtime_ms: 0, runs: 0, submits: 0 };
      const leftLines = [
        "PLAYTIME",
        "RUNS",
        "PBS",
      ];
      for (let i = 0; i < leftLines.length; i++) {
        const key = "srstat:" + i;
        const sel = nmCursor === i || menuHovering(key);
        const oy = y + 22 + i * 12;
        if (sel) px(x + 5, oy - 2, leftW - 10, 10, "#e8c44a");
        drawPixText(leftLines[i], x + 8, oy, sel ? "#2b1c12" : "#3a2414");
        addMenuHit(key, x + 5, oy - 2, leftW - 10, 10, () => {
          nmCursor = i;
        }, { hover: true });
      }
      drawPixText("ESC MENU", x + 8, y + h - 10, "#5c3a21");
      addMenuHit("nm:esc", x + 5, y + h - 12, 70, 10, () => backToModeMenu(), { hover: true });

      const bx = x + leftW + 10;
      drawPanelBox(bx, y, boardW, h, nmCursor === 2 ? "YOUR PBS" : "YOUR STATS");
      if (nmCursor === 2) {
        const prs = api && api.listLocalPrs ? api.listLocalPrs() : [];
        if (!prs.length) {
          drawPixText("NO PBS YET", bx + 8, y + 22, "#5c3a21");
        } else {
          let yy = y + 20;
          for (let i = 0; i < Math.min(12, prs.length); i++) {
            const p = prs[i];
            drawPixText(String(p.label || p.category).slice(0, 10), bx + 8, yy, "#3a2414");
            const t = api && api.formatTime ? api.formatTime(p.time_ms) : String(p.time_ms | 0);
            drawPixText(t, bx + 100, yy, "#5c3a21");
            yy += 9;
          }
        }
      } else {
        const play =
          api && api.formatPlaytimeClock
            ? api.formatPlaytimeClock(sr.playtime_ms | 0)
            : String(sr.playtime_ms | 0);
        const lines =
          nmCursor === 1
            ? ["RUNS " + (sr.runs | 0), "SUBMITS " + (sr.submits | 0)]
            : ["PLAY " + play, "RUNS " + (sr.runs | 0), "SUBMITS " + (sr.submits | 0)];
        for (let i = 0; i < lines.length; i++) {
          drawPixText(lines[i], bx + 8, y + 24 + i * 12, "#3a2414");
        }
        drawPixText("LOCAL ONLY", bx + 8, y + h - 14, "#8a5a32");
      }
      return;
    }

    const order = (api && api.NM_ORDER) || ["playtime", "level", "sharks", "chests", "coins"];
    drawPanelBox(x, y, leftW, h, "SURVIVAL");
    for (let i = 0; i < order.length; i++) {
      const id = order[i];
      const key = "nm:" + i;
      const def = api && api.NM_BOARD_DEFS ? api.NM_BOARD_DEFS[id] : null;
      const label = def ? def.label : id.toUpperCase();
      const sel = nmCursor === i || menuHovering(key);
      const oy = y + 20 + i * 10;
      if (sel) px(x + 5, oy - 2, leftW - 10, 9, "#e8c44a");
      drawPixText(label, x + 8, oy, sel ? "#2b1c12" : "#3a2414");
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
        nx += drawBoardPlayerLabel(r.player_name, nx, yy, {
          isAccount: true,
          isOnline: boardRowOnline(r),
          maxLen: 8,
        });
        const val = api && api.formatNmValue ? api.formatNmValue(nmBoardKind, r.value) : String(r.value | 0);
        drawPixText(val, bx + 108, yy, "#5c3a21");
        yy += 8;
      }
      if (nmBoardNote) drawPixText(nmBoardNote, bx + 8, yy + 2, "#8a5a32");
    }
  }

  function drawProfilesScreen() {
    const uiW = canvas.width / SCALE_UI;
    const uiH = canvas.height / SCALE_UI;
    ctx.globalAlpha = 0.55;
    px(0, 0, uiW, uiH, "#0b1a22");
    ctx.globalAlpha = 1;
    const api = lbApi();
    const w = 268;
    const h = Math.min(uiH - 12, 176);
    const x = ((uiW - w) / 2) | 0;
    const y = Math.max(4, ((uiH - h) / 2) | 0);
    drawPanelBox(x, y, w, h, "PROFILES");

    drawPixText("SEARCH", x + 10, y + 18, "#5c3a21");
    const searchSel = profileField === 0 || menuHovering("prof:search");
    px(x + 56, y + 16, w - 66, 11, searchSel ? "#e8c44a" : "#8a5a32");
    px(x + 57, y + 17, w - 68, 9, "#f3e2c4");
    drawPixText((profileSearch || "_").slice(0, 16), x + 60, y + 18, "#2b1c12");
    addMenuHit("prof:search", x + 56, y + 16, w - 66, 11, () => {
      profileField = 0;
    }, { hover: true });

    const listX = x + 8;
    const listY = y + 34;
    const listW = 110;
    const detailX = x + 124;
    if (!profileResults.length) profileResults = searchLocalProfiles(profileSearch);

    drawPixText("PLAYERS", listX, listY, "#5c3a21");
    let yy = listY + 10;
    const maxRows = 10;
    for (let i = 0; i < Math.min(maxRows, profileResults.length); i++) {
      const row = profileResults[i];
      const key = "prof:row:" + i;
      const sel = (profileFocus && profileFocus.name === row.name) || menuHovering(key);
      if (sel) px(listX, yy - 1, listW, 9, "#e8c44a");
      drawPixText(String(row.name || "?").slice(0, 10), listX + 2, yy, sel ? "#2b1c12" : "#3a2414");
      addMenuHit(key, listX, yy - 1, listW, 9, () => {
        profileFocus = row;
        profileField = 1;
      }, { hover: true });
      yy += 9;
    }
    if (!profileResults.length) drawPixText("NO MATCHES", listX + 2, listY + 12, "#8a5a32");

    px(detailX - 4, y + 34, 1, h - 50, "#8a5a32");
    if (profileFocus) {
      // Keep own card current while browsing Profiles.
      const meName = (api && api.displayName && api.displayName()) || "";
      const focusName = String(profileFocus.name || "").toUpperCase();
      if (meName && focusName === String(meName).toUpperCase()) {
        syncPresenceLoadout();
        profileFocus.skin = playerSkin || "classic";
        profileFocus.face = cosmetics.face || null;
        profileFocus.back = effectiveBack(playerSkin, cosmetics.back);
      } else {
        if (api && api.getOnlinePresence) {
          const rows = api.getOnlinePresence() || [];
          for (let i = 0; i < rows.length; i++) {
            const p = rows[i];
            if (!p || !p.username) continue;
            if (String(p.username).toUpperCase() !== focusName) continue;
            if (p.skin_id) profileFocus.skin = p.skin_id;
            if (p.face_id !== undefined) profileFocus.face = p.face_id;
            if (p.back_id !== undefined) profileFocus.back = p.back_id;
            break;
          }
        }
        if (api && api.getCachedLoadout) {
          const lo = api.getCachedLoadout(profileFocus.name);
          if (lo) {
            if (!profileFocus.skin && lo.skin) profileFocus.skin = lo.skin;
            if (profileFocus.face == null && lo.face != null) profileFocus.face = lo.face;
            if (profileFocus.back == null && lo.back != null) profileFocus.back = lo.back;
          }
        }
      }
      drawPixTextBold(String(profileFocus.name).slice(0, 12), detailX + 40, y + 36, "#c9a227", "center");
      const skinId = profileFocus.skin || null;
      const faceId = profileFocus.face || null;
      const backId = profileFocus.back || null;
      const hasLoadout = !!(skinId || faceId || backId);
      if (hasLoadout) {
        px(detailX + 78, y + 44, 36, 42, "#2b1c12");
        px(detailX + 79, y + 45, 34, 40, "#3a2414");
        drawProfileLoadoutPreview(detailX + 96, y + 78, skinId || "classic", faceId, backId);
      }
      const nmPlay =
        api && api.formatPlaytimeClock
          ? api.formatPlaytimeClock(profileFocus.nm_playtime_ms | 0)
          : String(profileFocus.nm_playtime_ms | 0);
      const srPlay =
        api && api.formatPlaytimeClock
          ? api.formatPlaytimeClock(profileFocus.sr_playtime_ms | 0)
          : String(profileFocus.sr_playtime_ms | 0);
      drawPixText((profileFocus.is_account ? "ACCOUNT" : "GUEST"), detailX, y + 48, "#5c3a21");
      drawPixText("SKIN " + (skinId ? skinLabel(skinId).slice(0, 8) : "—"), detailX, y + 58, "#3a2414");
      drawPixText("FACE " + (faceId ? cosmeticLabel(faceId).slice(0, 8) : "NONE"), detailX, y + 68, "#3a2414");
      drawPixText("BACK " + (backId ? cosmeticLabel(backId).slice(0, 8) : "NONE"), detailX, y + 78, "#3a2414");
      drawPixText("SURV " + nmPlay, detailX, y + 92, "#3a2414");
      drawPixText("SPEED " + srPlay, detailX, y + 102, "#3a2414");
      drawPixText("PRS", detailX, y + 114, "#5c3a21");
      const prIds = Object.keys(profileFocus.prs || {});
      let py = y + 124;
      if (!prIds.length) {
        drawPixText("NONE CACHED", detailX, py, "#8a5a32");
      } else {
        prIds.sort((a, b) => (profileFocus.prs[a] | 0) - (profileFocus.prs[b] | 0));
        for (let i = 0; i < Math.min(3, prIds.length); i++) {
          const id = prIds[i];
          const lab = (api && api.CATEGORIES && api.CATEGORIES[id] && api.CATEGORIES[id].label) || id;
          const t = api && api.formatTime ? api.formatTime(profileFocus.prs[id]) : String(profileFocus.prs[id] | 0);
          drawPixText(String(lab).slice(0, 8), detailX, py, "#3a2414");
          drawPixText(t, detailX + 58, py, "#5c3a21");
          py += 9;
        }
      }
      if (!hasLoadout) {
        drawPixText("LOADOUT ?", detailX + 78, y + 58, "#8a5a32");
        drawPixText("SEEN ONLINE", detailX + 72, y + 68, "#5c3a21");
      }
    } else {
      drawPixText("PICK A PLAYER", detailX + 8, y + 60, "#8a5a32");
      drawPixText("LOCAL CACHE", detailX + 8, y + 72, "#5c3a21");
    }

    drawPixText("ESC MENU", x + 10, y + h - 12, "#5c3a21");
    addMenuHit("prof:esc", x + 8, y + h - 14, 70, 10, () => backToModeMenu(), { hover: true });
  }

  function weeklyPrizeBand(id) {
    // Rarity bands in parchment palette (common tan / uncommon gold / rare crimson)
    if (id === "beta_crown") return { fill: "#6a3030", edge: "#c43a48", face: "#8a4040" };
    if (id === "crown") return { fill: "#6a5020", edge: "#c9a227", face: "#8a6a28" };
    return { fill: "#5c4030", edge: "#a07448", face: "#7a5a38" };
  }

  function drawWeeklyRewardsIcon(x, y) {
    px(x, y + 2, 8, 5, "#8a5a32");
    px(x + 1, y + 1, 6, 2, "#c9a227");
    px(x + 3, y + 3, 2, 2, "#e8c44a");
    px(x, y + 6, 8, 1, "#3a2414");
    px(x + 6, y, 2, 2, "#e8c44a");
    px(x + 7, y - 1, 1, 1, "#f3e2c4");
  }

  /** Tiny parchment-pixel glyph for mode / walkthrough rows (8x7). */
  function drawModeMenuIcon(kind, x, y) {
    const k = String(kind || "").toUpperCase();
    if (k === "NORMAL" || k === "SURVIVAL") {
      // Island mound + tree
      px(x + 1, y + 5, 6, 2, "#c9b07a");
      px(x + 2, y + 4, 4, 1, "#7eae62");
      px(x + 3, y + 1, 1, 3, "#5c3a21");
      px(x + 2, y, 3, 2, "#3c8a34");
      return;
    }
    if (k === "SPEEDRUN") {
      // Stopwatch
      px(x + 2, y, 4, 1, "#5c3a21");
      px(x + 1, y + 1, 6, 6, "#8a5a32");
      px(x + 2, y + 2, 4, 4, "#f3e2c4");
      px(x + 4, y + 2, 1, 3, "#3a2414");
      px(x + 4, y + 4, 2, 1, "#3a2414");
      px(x + 3, y, 2, 1, "#c9a227");
      return;
    }
    if (k === "HUB") {
      // Door / cabin
      px(x + 1, y + 1, 6, 6, "#8a5a32");
      px(x + 2, y + 2, 4, 5, "#5c3a21");
      px(x + 2, y, 4, 1, "#3a2414");
      px(x + 5, y + 4, 1, 1, "#e8c44a");
      return;
    }
    if (k === "ACCOUNT") {
      // Person bust
      px(x + 3, y, 2, 2, "#f3e2c4");
      px(x + 2, y + 2, 4, 2, "#c4a574");
      px(x + 1, y + 4, 6, 3, "#5c3a21");
      px(x + 3, y + 1, 1, 1, "#3a2414");
      return;
    }
    if (k === "STATS") {
      // Bar chart
      px(x + 1, y + 5, 6, 1, "#5c3a21");
      px(x + 1, y + 3, 1, 2, "#8a5a32");
      px(x + 3, y + 1, 1, 4, "#c9a227");
      px(x + 5, y + 2, 1, 3, "#e8c44a");
      return;
    }
    if (k === "WEEKLY REWARDS" || k === "WEEKLY" || k === "ISLEPASS" || k === "ISLE PASS") {
      drawWeeklyRewardsIcon(x, y);
      return;
    }
    px(x + 2, y + 2, 4, 4, "#8a5a32");
  }

  /** Category row glyph; reuses catch art where it fits. */
  function drawSpeedCatIcon(id, x, y) {
    if (
      id === "shark" ||
      id === "jelly_white" ||
      id === "chest" ||
      id === "blowfish" ||
      id === "megalodon" ||
      id === "waterfall_eel" ||
      id === "portal_leech"
    ) {
      drawTinyCatch(id, x, y);
      return;
    }
    if (id === "shark_cloak") {
      drawTinyCatch("shark", x, y);
      px(x + 5, y + 1, 2, 4, "#1a2848");
      return;
    }
    if (id === "mask") {
      drawTinyCatch("jade_mask", x, y);
      return;
    }
    if (id === "serpent") {
      // Coiled sea serpent
      px(x + 1, y + 1, 2, 2, "#2f6a58");
      px(x + 3, y + 2, 3, 2, "#1e4a40");
      px(x + 5, y + 4, 2, 2, "#2f6a58");
      px(x + 2, y, 1, 1, "#4a9a7a");
      px(x + 6, y + 3, 1, 1, "#c9e86a");
      return;
    }
    if (id === "death") {
      // Skull
      px(x + 2, y, 4, 1, "#f3e2c4");
      px(x + 1, y + 1, 6, 3, "#e8d5b8");
      px(x + 2, y + 2, 1, 1, "#3a2414");
      px(x + 5, y + 2, 1, 1, "#3a2414");
      px(x + 2, y + 4, 4, 2, "#c4a574");
      px(x + 3, y + 4, 2, 1, "#3a2414");
      return;
    }
    if (id === "boat") {
      // Sailboat
      px(x + 4, y, 1, 4, "#f3e2c4");
      px(x + 5, y + 1, 2, 3, "#c4a574");
      px(x + 1, y + 5, 6, 2, "#8a5a32");
      px(x + 2, y + 4, 4, 1, "#5c3a21");
      return;
    }
    if (id === "full_inv") {
      // Full bag / pack
      px(x + 1, y + 2, 6, 5, "#8a5a32");
      px(x + 2, y + 1, 4, 1, "#5c3a21");
      px(x + 2, y + 3, 1, 1, "#e8c44a");
      px(x + 4, y + 3, 1, 1, "#c9a227");
      px(x + 3, y + 5, 2, 1, "#3a2414");
      return;
    }
    if (id === "coins_10" || id === "coins_25" || id === "coins_100") {
      drawCoinIcon(x, y);
      return;
    }
    if (id === "kings_race" || id === "full_kings") {
      px(x + 1, y + 1, 1, 2, "#c9a227");
      px(x + 3, y, 1, 2, "#e8c44a");
      px(x + 5, y + 1, 1, 2, "#c9a227");
      px(x + 1, y + 3, 5, 1, "#e8c44a");
      if (id === "full_kings") px(x + 2, y + 5, 4, 2, "#8a3038");
      return;
    }
    px(x + 2, y + 2, 4, 4, "#8a5a32");
  }

  function drawSpinPrizeTile(x, y, w, h, prize) {
    const id = prize && prize.id ? prize.id : "";
    const band = weeklyPrizeBand(id);
    px(x, y, w, h, band.edge);
    px(x + 1, y + 1, w - 2, h - 2, band.fill);
    px(x + 2, y + 2, w - 4, h - 4, band.face);
    px(x + 1, y + 1, w - 2, 1, band.edge);
    px(x + 1, y + h - 2, w - 2, 1, "#2b1c12");
    if (id) drawTinyCatch(id, x + ((w - 8) / 2) | 0, y + ((h - 8) / 2) | 0);
  }

  function drawSpinReelStrip(x, y, w, h) {
    px(x, y, w, h, "#3a2414");
    px(x + 1, y + 1, w - 2, h - 2, "#5c3a21");
    px(x + 2, y + 2, w - 4, h - 4, "#2b1c12");
    const rx = x + 3;
    const ry = y + 3;
    const rw = w - 6;
    const rh = h - 6;
    const cx = rx + ((rw / 2) | 0);
    ctx.save();
    ctx.beginPath();
    ctx.rect(rx, ry, rw, rh);
    ctx.clip();
    if (spinReel) {
      const cell = spinReel.cell;
      const offset = spinReelOffset();
      const cells = spinReel.cells;
      const first = Math.floor(offset / cell) - 1;
      const last = first + ((rw / cell) | 0) + 3;
      for (let i = first; i <= last; i++) {
        if (i < 0 || i >= cells.length) continue;
        const tx = (rx + i * cell - offset) | 0;
        drawSpinPrizeTile(tx, ry + 1, cell - 2, rh - 2, cells[i]);
      }
    } else {
      const gap = 42;
      const total = gap * 2 + 30;
      let tx = rx + (((rw - total) / 2) | 0);
      for (let i = 0; i < WEEKLY_SPIN.prizes.length; i++) {
        drawSpinPrizeTile(tx, ry + 1, 30, rh - 2, WEEKLY_SPIN.prizes[i]);
        tx += gap;
      }
    }
    ctx.restore();
    px(cx - 1, y, 2, 3, "#e8c44a");
    px(cx - 1, y + h - 3, 2, 3, "#e8c44a");
    px(cx, ry, 1, rh, "#c9a227");
    px(x + 2, y + 2, 2, h - 4, "#3a2414");
    px(x + w - 4, y + 2, 2, h - 4, "#3a2414");
  }

  function drawSpinScreen() {
    // Folded into Rewards hub (WEEKLY tab)
    if (questTab !== "weekly") questTab = "weekly";
    uiScreen = "quests";
    drawQuestScreen();
  }

  function drawSpeedUI() {
    clearMenuHits();
    if (uiScreen === "logo") drawLogoCard();
    else if (uiScreen === "mode") drawModeSelect();
    else if (uiScreen === "categories") drawCategorySelect();
    else if (uiScreen === "ready") drawReadyScreen();
    else if (uiScreen === "finish") drawFinishScreen();
    else if (uiScreen === "account") drawAccountScreen();
    else if (uiScreen === "nm_boards") drawNmBoardScreen();
    else if (uiScreen === "profiles") drawProfilesScreen();
    else if (uiScreen === "walkthrough") drawWalkthrough();
    else if (uiScreen === "spin") drawSpinScreen();
    else if (uiScreen === "quests") drawQuestScreen();
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
    const replay = srSegmentSurvival ? null : buildReplayPayload();
    if (replay) replay.player_name = name;
    const res = await api.submitScore(srCat, srFinalMs, name, {
      runId: srRunId || newSpeedRunId(),
      isAccount: !!(api.isSignedIn && api.isSignedIn()),
      replay,
    });
    srSubmitting = false;
    if (res.ok) {
      if (res.resolved && res.resolved.name) srName = res.resolved.name;
      srBoardRows = applyBoardIdentityMerge(res.rows || [], 10);
      srStatus = "POSTED";
      srSubmitted = true;
      if (srCat === "full_kings" && pendingRaceSeg && pendingRaceSeg.ms > 0) {
        const segMs = pendingRaceSeg.ms;
        pendingRaceSeg = null;
        api.submitScore("kings_race", segMs, name, {
          runId: newSpeedRunId(),
          isAccount: !!(api.isSignedIn && api.isSignedIn()),
        }).catch(function () {});
      }
      srBoardNote = "";
      if (api.noteSrEvent) api.noteSrEvent("submits", 1);
      // Career XP — submit bonus + WR if we own #1 after post
      {
        const wrMs = catBoardWrMs(srCat);
        const top = srBoardRows && srBoardRows[0];
        const topMs = top ? top.time_ms | 0 : 0;
        const mine = srFinalMs | 0;
        const isWr =
          top &&
          topMs > 0 &&
          mine <= topMs &&
          String(top.player_name || "")
            .toUpperCase()
            .indexOf(String(srName || "").toUpperCase().slice(0, 3)) >= 0;
        const gain = careerXpForRun(srCat, srFinalMs, {
          submitted: true,
          pb: !!(res.pb && res.pb.improved),
          wr: !!isWr,
          wrMs: topMs || wrMs,
        });
        // Finish already awarded base; grant only the delta of submit/pb/wr extras
        const baseOnly = careerXpForRun(srCat, srFinalMs, { wrMs: topMs || wrMs });
        applyCareerXp(Math.max(0, gain - baseOnly), "submit");
        refreshCareerLevelCache();
      }
      if (replay && api.saveLocalReplay) {
        api.saveLocalReplay(srCat, replay);
        srBestReplay = replay;
        // Mark VID on the board row that matches this exact run (if present).
        if (!srReplayAvail || srReplayAvail.length !== (srBoardRows || []).length) {
          srReplayAvail = (srBoardRows || []).map(() => false);
        }
        for (let i = 0; i < (srBoardRows || []).length; i++) {
          if (replayMatchesBoardRow(replay, srCat, i)) srReplayAvail[i] = true;
        }
      }
      if (res.pb) {
        srPbPrev = res.pb.prev | 0;
        srPbLabel = res.pb.isFirst ? "FIRST PB" : res.pb.label;
      }
    } else if (res.banned) {
      srStatus = "TEMP BANNED";
      srBoardNote = String(res.error || "You're temporarily banned from online features.").slice(0, 64);
      srSubmitted = false;
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
        if (res.ok) {
          authStatus = "SIGNED IN";
          srName = api.displayName() || authUser;
          guestNameLocked = true;
          authMode = "menu";
          srCursor = 0;
          authPin = "";
          tryGrantAmericanCloak();
        } else if (res.banned) authStatus = "TEMP BANNED";
        else authStatus = (res.error || "FAILED").toUpperCase().slice(0, 24);
      } else {
        res = await api.signUp(authUser, authPin);
        if (res.ok) {
          authStatus = "SIGNED UP";
          srName = api.displayName() || authUser;
          guestNameLocked = true;
          authMode = "menu";
          srCursor = 0;
          authPin = "";
          tryGrantAmericanCloak();
        } else if (res.banned) authStatus = "TEMP BANNED";
        else authStatus = (res.error || "FAILED").toUpperCase().slice(0, 24);
      }
    }
    authBusy = false;
  }

  function onSpeedMenuKey(k) {
    if (uiScreen === "logo") {
      if (k === "enter" || k === " " || k === "escape" || k === "backspace") skipLogoToMode();
      return true;
    }
    if (uiScreen === "mode") {
      if (k === "arrowleft" || k === "a") srCursor = (srCursor + 2) % 3;
      if (k === "arrowright" || k === "d") srCursor = (srCursor + 1) % 3;
      if (k === "arrowup" || k === "w") srCursor = (srCursor + 2) % 3;
      if (k === "arrowdown" || k === "s") srCursor = (srCursor + 1) % 3;
      if (k === "enter" || k === " ") activateModeOpt(Math.min(2, srCursor | 0));
      return true;
    }
    if (uiScreen === "spin") {
      // Legacy spin screen → unified Rewards hub
      openRewardsMenu("weekly");
      return true;
    }
    if (uiScreen === "quests") {
      const tabs = ["quests", "weekly", "levels"];
      if (k === "escape" || k === "backspace") {
        if (!(questTab === "weekly" && spinReelBusy())) backToModeMenu();
        return true;
      }
      if (k === "arrowleft" || k === "a") {
        if (questTab === "levels") {
          const pages = ["overview", "tiers", "pass"];
          const i = pages.indexOf(levelsPage);
          if (i > 0) levelsPage = pages[i - 1];
          else {
            questTab = "weekly";
            prepareWeeklySpinState();
          }
        } else {
          const i = tabs.indexOf(questTab);
          questTab = tabs[(i + tabs.length - 1) % tabs.length];
          if (questTab === "weekly") prepareWeeklySpinState();
          if (questTab === "levels") {
            levelsPage = "pass";
            syncCareerFromAccountHistory();
          }
        }
        return true;
      }
      if (k === "arrowright" || k === "d") {
        if (questTab === "levels") {
          const pages = ["overview", "tiers", "pass"];
          const i = pages.indexOf(levelsPage);
          if (i < pages.length - 1) levelsPage = pages[i + 1];
          else questTab = "quests";
        } else {
          const i = tabs.indexOf(questTab);
          questTab = tabs[(i + 1) % tabs.length];
          if (questTab === "weekly") prepareWeeklySpinState();
          if (questTab === "levels") {
            levelsPage = "overview";
            syncCareerFromAccountHistory();
          }
        }
        return true;
      }
      if (questTab === "quests") {
        if (k === "arrowup" || k === "w") {
          questCursor = (questCursor + NOV_QUESTS.length - 1) % NOV_QUESTS.length;
        }
        if (k === "arrowdown" || k === "s") {
          questCursor = (questCursor + 1) % NOV_QUESTS.length;
        }
        if (k === "enter" || k === " ") {
          const q = NOV_QUESTS[questCursor];
          if (q && questStatus(q) === "claimable") claimQuest(q.id);
        }
      } else if (questTab === "weekly") {
        if (k === "enter" || k === " ") {
          if (spinReelBusy()) return true;
          const api = lbApi();
          const signed = !!(api && api.isSignedIn && api.isSignedIn());
          if (!signed) {
            uiScreen = "account";
            authMode = "menu";
            authStatus = "";
            srCursor = 0;
          } else tryWeeklySpin();
        }
      } else if (questTab === "levels" && levelsPage === "pass") {
        if (k === "arrowup" || k === "w") passScroll = Math.max(0, passScroll - 32);
        if (k === "arrowdown" || k === "s") passScroll += 32;
        if (k === "enter" || k === " ") {
          const nodes = FREE_PASS.nodes || [];
          for (let i = 0; i < nodes.length; i++) {
            if (passNodeStatus(nodes[i]) === "claimable") {
              claimPassNode(nodes[i]);
              break;
            }
          }
        }
      }
      return true;
    }
    if (uiScreen === "walkthrough") {
      const pages = walkPages();
      if (k === "escape") {
        backToModeMenu();
        return true;
      }
      if (k === "arrowleft" || k === "a" || k === "backspace") {
        if (walkStep > 0) walkStep -= 1;
        else backToModeMenu();
        return true;
      }
      if (k === "arrowright" || k === "d" || k === "enter" || k === " ") {
        if (walkStep < pages.length - 1) walkStep += 1;
        else backToModeMenu();
        return true;
      }
      if (k === "arrowup" || k === "w") {
        if (walkStep > 0) walkStep -= 1;
        return true;
      }
      if (k === "arrowdown" || k === "s") {
        if (walkStep < pages.length - 1) walkStep += 1;
        return true;
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
      if (k === "escape") {
        backToModeMenu();
        return true;
      }
      if (k === "arrowleft" || k === "a") {
        statsMode = "survival";
        nmCursor = 0;
        nmBoardKind = "playtime";
        refreshNmBoard(nmBoardKind);
        return true;
      }
      if (k === "arrowright" || k === "d") {
        statsMode = "speedrun";
        nmCursor = 0;
        return true;
      }
      if (statsMode === "speedrun") {
        const n = 3;
        if (k === "arrowup" || k === "w") nmCursor = (nmCursor + n - 1) % n;
        if (k === "arrowdown" || k === "s") nmCursor = (nmCursor + 1) % n;
        return true;
      }
      const order = (api && api.NM_ORDER) || ["playtime", "level", "sharks", "chests", "coins"];
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
    if (uiScreen === "profiles") {
      if (k === "escape") {
        backToModeMenu();
        return true;
      }
      if (k === "backspace") {
        profileSearch = profileSearch.slice(0, -1);
        profileResults = searchLocalProfiles(profileSearch);
        profileFocus = null;
        return true;
      }
      if (k === "arrowdown" || k === "s") {
        if (profileResults.length) {
          let idx = 0;
          if (profileFocus) {
            for (let i = 0; i < profileResults.length; i++) {
              if (profileResults[i].name === profileFocus.name) {
                idx = i;
                break;
              }
            }
          }
          profileFocus = profileResults[(idx + 1) % profileResults.length];
        }
        return true;
      }
      if (k === "arrowup" || k === "w") {
        if (profileResults.length) {
          let idx = 0;
          if (profileFocus) {
            for (let i = 0; i < profileResults.length; i++) {
              if (profileResults[i].name === profileFocus.name) {
                idx = i;
                break;
              }
            }
          }
          profileFocus = profileResults[(idx + profileResults.length - 1) % profileResults.length];
        }
        return true;
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
        } else if (srFinishSel === 2) retryFinishRun();
        else if (srFinishSel === 3) backToCategories();
        else if (srFinishSel === 4) backToModeMenu();
      }
      if (k === "escape") backToCategories();
      return true;
    }
    return false;
  }

  function lockerSnapshot() {
    return {
      face: cosmetics.face,
      back: cosmetics.back,
      skin: playerSkin,
      ownedCosmetics: ownedCosmetics.slice(),
      ownedSkins: ownedSkins.slice(),
      skinsGrantedLegacy: !!skinsGrantedLegacy,
      questMaskRuns: questMaskRuns | 0,
      questDone: Object.assign({}, questDone || {}),
      questClaimed: Object.assign({}, questClaimed || {}),
    };
  }

  function applyLockerSnapshot(snap) {
    if (!snap || typeof snap !== "object") return;
    if (Array.isArray(snap.ownedCosmetics)) {
      for (let i = 0; i < snap.ownedCosmetics.length; i++) {
        const id = snap.ownedCosmetics[i];
        if (isCosmeticId(id) && ownedCosmetics.indexOf(id) < 0) ownedCosmetics.push(id);
      }
    }
    if (Array.isArray(snap.ownedSkins)) {
      for (let i = 0; i < snap.ownedSkins.length; i++) {
        const id = snap.ownedSkins[i];
        if (SKIN_DEFS[id] && ownedSkins.indexOf(id) < 0) ownedSkins.push(id);
      }
    }
    if (snap.face && isCosmeticId(snap.face)) cosmetics.face = snap.face;
    if (snap.back && isCosmeticId(snap.back)) cosmetics.back = snap.back;
    if (snap.skin && SKIN_DEFS[snap.skin] && ownsSkin(snap.skin)) playerSkin = snap.skin;
    if (snap.skinsGrantedLegacy) skinsGrantedLegacy = true;
    if (typeof snap.questMaskRuns === "number") {
      questMaskRuns = Math.max(questMaskRuns | 0, snap.questMaskRuns | 0);
    }
    if (snap.questDone && typeof snap.questDone === "object") {
      for (const k in snap.questDone) if (snap.questDone[k]) questDone[k] = true;
    }
    if (snap.questClaimed && typeof snap.questClaimed === "object") {
      for (const k in snap.questClaimed) if (snap.questClaimed[k]) questClaimed[k] = true;
    }
    ensureLaunchSkins();
    syncQuestOwnershipFlags();
  }

  function saveGame() {
    if (playMode !== "normal") {
      saveLockerProfile();
      return;
    }
    try {
      const slots = [];
      for (let i = 0; i < inventory.length; i++) {
        const s = inventory[i];
        // Cosmetics never live in the bag — strip if any slipped in
        if (s && isCosmeticId(s.id)) {
          grantCosmetic(s.id);
          slots.push(null);
          continue;
        }
        slots.push(s && s.id ? { id: s.id, count: s.count | 0 } : null);
      }
      const bagOut = [];
      for (let i = 0; i < satchel.length; i++) {
        const s = satchel[i];
        if (s && isCosmeticId(s.id)) {
          grantCosmetic(s.id);
          bagOut.push(null);
          continue;
        }
        bagOut.push(s && s.id ? { id: s.id, count: s.count | 0 } : null);
      }
      const data = {
        slots,
        heldSlot,
        satchel: bagOut,
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
        cosmetics: { face: cosmetics.face, back: cosmetics.back },
        locker: lockerSnapshot(),
        templeMaskTaken: !!templeMaskTaken,
        sunkenTaken: !!sunkenTaken,
        divePhase: divePhase === "down" || divePhase === "rising" ? "down" : "docked",
        dailyClaimedUtc: dailyClaimedUtc || "",
        rome: rome ? rome.persist() : null,
        boat: ownedBoat
          ? { x: ownedBoat.x, y: ownedBoat.y, face: ownedBoat.face || 1, landed: !!ownedBoat.landed }
          : null,
      };
      localStorage.setItem(SAVE_KEY, JSON.stringify(data));
      saveLockerProfile();
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
    const bag = ensureSaveSlots(data.satchel);
    for (let i = 0; i < satchel.length; i++) satchel[i] = bag[i] ? { id: bag[i].id, count: bag[i].count } : null;
    player.coins = Math.max(0, data.coins | 0);
    player.xp = Math.max(0, data.xp | 0);
    player.level = Math.max(1, data.level | 0);
    player.hp = Math.max(0, Math.min(MAX_HP, data.hp | 0));
    if (typeof data.x === "number") player.x = data.x;
    if (typeof data.y === "number") player.y = data.y;
    if (data.facing === -1 || data.facing === 1) player.facing = data.facing;
    player.aboard = !!data.aboard;
    if (
      data.scene === "shop" ||
      data.scene === "fish" ||
      data.scene === "cabin" ||
      data.scene === "island" ||
      data.scene === "temple" ||
      data.scene === "sub" ||
      data.scene === "floor" ||
      data.scene === "wreck" ||
      data.scene === "vein" ||
      (rome && data.scene && rome.isScene(data.scene))
    ) {
      scene = data.scene;
      if (scene === "vein") {
        ensureVein();
        cloakOn = false;
      }
      if (rome && rome.isScene(scene)) rome.restore(data.rome);
    } else if (data.scene === "hub") {
      // Hub is its own mode now — remount old island-gate saves to the dock
      scene = "island";
      player.x = spawnX;
      player.y = spawnY;
    }
    // Prefer dedicated locker profile, then merge any locker blob from the survival save.
    loadLockerProfile();
    if (data.locker) applyLockerSnapshot(data.locker);
    if (data.cosmetics) {
      if (data.cosmetics.face && isCosmeticId(data.cosmetics.face)) cosmetics.face = data.cosmetics.face;
      if (data.cosmetics.back && isCosmeticId(data.cosmetics.back)) cosmetics.back = data.cosmetics.back;
    }
    // Cosmetics leave the bag → locker collection (one-time migrate per load).
    migrateCosmeticsFromLists([inventory, satchel]);
    if (cosmetics.face) grantCosmetic(cosmetics.face);
    if (cosmetics.back) grantCosmetic(cosmetics.back);
    saveLockerProfile();
    templeMaskTaken = !!data.templeMaskTaken;
    sunkenTaken = !!data.sunkenTaken;
    divePhase = data.divePhase === "down" ? "down" : "docked";
    if (scene === "floor") scatterFloorSharks();
    dailyClaimedUtc = data.dailyClaimedUtc ? String(data.dailyClaimedUtc) : "";
    cloakOn = !!data.cloak && ownsCloak();
    if (
      scene === "cabin" ||
      scene === "temple" ||
      scene === "sub" ||
      scene === "floor" ||
      scene === "wreck" ||
      scene === "vein"
    ) {
      player.aboard = false;
    }
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
      // Old saves leave the skiff wherever it was last left — park it in the slip.
      if (boatBerth) settleBoatInBerth(ownedBoat);
    } else if (player.aboard) {
      player.aboard = false;
    }
    rescueOffshoreSpawn();
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
    if (replayActive) {
      updateReplay(dt);
      updateOcean();
      draw(time);
      requestAnimationFrame(loop);
      return;
    }
    if (scene === "sub" || scene === "floor" || scene === "wreck") placeAtDock();
    updateFade(dt);
    updateDoors(dt);
    updatePlayer(dt);
    updatePickup(dt);
    if (hubUi.tipT > 0) hubUi.tipT = Math.max(0, hubUi.tipT - dt);
    if (hubEmoteT > 0) hubEmoteT = Math.max(0, hubEmoteT - dt);
    if (cosTipT > 0) cosTipT = Math.max(0, cosTipT - dt);
    syncHubPresencePose();
    updateXpFx(dt);
    updateHorn();
    updateUseFx(dt);
    updateLoot();
    updateShopTrade(dt);
    updateTradeCoinDrift(dt);
    updateCabinCut(dt);
    updateBlowfishHearts(dt);
    updateJadeMaskFx(dt);
    updateBlowfishSpeedEnd(dt);
    updateCabinFish(dt);
    updateBoatThrow(dt);
    if (
      scene === "island" &&
      ownedBoat &&
      ownedBoat.landed &&
      !boatThrow &&
      !player.aboard &&
      !uiBlocksPlay()
    ) {
      updateBoatBerthSnap(dt, 0, 0);
    }
    updateCrabs(dt);
    if (scene === "island") {
      updateFish(dt);
    }
    updateRod(dt);
    updateSerpent(dt);
    updateWandBolts(dt);
    if (scene === "vein" && vein) vein.update(dt);
    if (rome) rome.update(dt);
    updateDive(dt);
    updateMaskGoal();
    if (srTiming) captureReplayFrame(false);
    if (fishCastT > 0) fishCastT = Math.max(0, fishCastT - dt);
    nearestLoot = findNearestLoot();
    tryAutoPickup();
    nearestLoot = findNearestLoot();
    updatePrompt();
    updateOcean();
    draw(time);
    // Session playtime — survival → NM stats; speedrun → SR stats
    if ((playMode === "normal" || playMode === "speedrun") && !uiBlocksPlay() && !guideOpen) {
      playtimeAcc += dt * 1000;
      tickIslePassPlaytime(dt);
    }
    playtimeFlush += dt;
    if (playtimeFlush >= 5 && playtimeAcc >= 1) {
      const api = lbApi();
      const add = playtimeAcc | 0;
      playtimeAcc = 0;
      playtimeFlush = 0;
      if (api && playMode === "normal" && api.noteNmEvent) {
        api.noteNmEvent("playtime", add);
        if (api.isSignedIn && api.isSignedIn() && api.syncNmStatsToProfile) api.syncNmStatsToProfile();
      } else if (api && playMode === "speedrun" && api.addPlaytime) {
        api.addPlaytime(add, "speedrun");
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
    // Mid-replay or load-limbo: Esc / Tab / Back always fully tear down (newest cancel wins).
    if (replaySessionOpen()) {
      if (k === "escape" || k === "tab" || k === "backspace") {
        e.preventDefault();
        stopReplay();
      }
      e.preventDefault();
      return;
    }
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
        "9",
        "0",
        "t",
        "f",
        "c",
        "h",
        "r",
        "e",
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
    if (uiScreen === "profiles" && !e.ctrlKey && !e.metaKey && e.key.length === 1) {
      const up = e.key.toUpperCase();
      if (profileSearch.length < 12 && /[A-Z0-9 ]/.test(up)) {
        profileSearch += up === " " ? " " : up;
        profileResults = searchLocalProfiles(profileSearch);
        profileFocus = null;
        e.preventDefault();
        return;
      }
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
    if (k === "escape" && playMode === "hub" && !uiBlocksPlay()) {
      if (guideOpen) {
        guideOpen = false;
        return;
      }
      leaveHubMode();
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
      if (k === "enter" && isIndoor() && !cosSelect) dropHeld();
      return;
    }
    if (k >= "1" && k <= "8") {
      if (scene === "vein" && vein && holdingWand() && k >= "1" && k <= "4") {
        vein.setSpell(k.charCodeAt(0) - 49);
      } else {
        heldSlot = k.charCodeAt(0) - 49;
        cosSelect = null;
      }
    }
    if (rome && rome.isScene() && rome.onKey(k)) return;
    if (k === "enter") onEnter();
    if (k === " ") {
      if (!tryCatchLandCrab()) useHeld();
    }
    if (k === "t") tryTradeKey();
    if (k === "e" && scene === "hub") tryHubEmote();
    else if (k === "e" && playMode === "normal" && !uiBlocksPlay() && !guideOpen && !cabinCut.kind) {
      satchelOpen = !satchelOpen;
      slotDrag = null;
    }
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
    if (uiScreen === "mode") {
      const lh = hitLockerAt(ux, uy);
      if (lh && lh.meta && (lh.meta.type === "skin" || lh.meta.type === "cosmetic" || lh.meta.type === "tab")) {
        lockerHover = { id: lh.meta.id, type: lh.meta.type };
      } else {
        lockerHover = null;
      }
    } else {
      lockerHover = null;
    }
    const chatHit = hitChatAt(ux, uy);
    const hit = hitMenuAt(ux, uy);
    const lockHit = uiScreen === "mode" ? hitLockerAt(ux, uy) : null;
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
    canvas.style.cursor =
      hit ||
      lockHit ||
      (chatHit && chatHit.onClick) ||
      (chatHit && chatHit.meta && chatHit.meta.tip)
        ? "pointer"
        : "";
  }

  canvas.addEventListener("mousemove", (e) => {
    const p = eventToUi(e);
    pointerUi.x = p.x;
    pointerUi.y = p.y;
    if (slotDrag) {
      canvas.style.cursor = "pointer";
      return;
    }
    if (!uiScreen && !chatOpen && !replaySessionOpen()) {
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
    // Spectate / limbo (uiScreen null): only replay EXIT hits. Busy loads keep the
    // category board up so other VID chips stay clickable (newest wins).
    if (!uiScreen && satchelOpen && playMode === "normal" && !replaySessionOpen()) {
      const slot = slotAtUi(p.x, p.y);
      if (slot) {
        const list = stackArray(slot.src);
        if (list[slot.index]) {
          e.preventDefault();
          slotDrag = { src: slot.src, index: slot.index };
          pointerUi.down = true;
          return;
        }
      }
    }
    if (replayActive || (srReplayBusy && uiScreen == null)) {
      refreshMenuHover(p.x, p.y);
      const replayHit = hitMenuAt(p.x, p.y);
      if (replayHit && typeof replayHit.onClick === "function") {
        e.preventDefault();
        replayHit.onClick();
      }
      return;
    }
    if (!uiScreen) return;
    refreshMenuHover(p.x, p.y);
    if (uiScreen === "mode") {
      const lock = hitLockerAt(p.x, p.y);
      if (lock && lock.meta && lock.meta.type === "tab") {
        e.preventDefault();
        lockerTab = lock.meta.id;
        lockerDrag = null;
        lockerHover = null;
        refreshMenuHover(p.x, p.y);
        return;
      }
      if (lock && lock.meta && lock.meta.type === "skin") {
        // Instant click-to-equip for skins
        e.preventDefault();
        equipSkin(lock.meta.id);
        refreshMenuHover(p.x, p.y);
        return;
      }
      if (lock && lock.meta && lock.meta.type === "cosmetic") {
        e.preventDefault();
        lockerDrag = {
          id: lock.meta.id,
          type: lock.meta.type,
          kind: lock.meta.kind,
          startX: p.x,
          startY: p.y,
        };
        pointerUi.down = true;
        return;
      }
    }
    const hit = hitMenuAt(p.x, p.y);
    if (hit && typeof hit.onClick === "function") {
      e.preventDefault();
      hit.onClick();
    }
  });

  canvas.addEventListener("mouseup", (e) => {
    const p = eventToUi(e);
    if (lockerDrag && uiScreen === "mode") {
      const lock = hitLockerAt(p.x, p.y);
      const moved = Math.hypot(p.x - (lockerDrag.startX || 0), p.y - (lockerDrag.startY || 0)) > 6;
      if (lock && lock.meta && lock.meta.type === "socket") {
        applyLockerDrop(lock.meta.kind);
      } else if (!moved || (lock && lock.meta && lock.meta.id === lockerDrag.id)) {
        // Click / short drag: toggle cosmetic equip
        if (lockerDrag.type === "cosmetic") {
          const kind = cosmeticKindOf(lockerDrag.id);
          if (cosmetics[kind] === lockerDrag.id) unequipCosmetic(kind);
          else equipCosmetic(lockerDrag.id);
        } else if (lockerDrag.type === "skin") {
          equipSkin(lockerDrag.id);
        }
        lockerDrag = null;
      } else {
        lockerDrag = null;
      }
      pointerUi.down = false;
      refreshMenuHover(p.x, p.y);
      return;
    }
    if (!slotDrag) return;
    finishSlotDrag(p.x, p.y);
    pointerUi.down = false;
  });

  canvas.addEventListener("mouseleave", () => {
    menuHoverKey = "";
    canvas.style.cursor = "";
    lockerDrag = null;
    pointerUi.x = -9999;
    pointerUi.y = -9999;
  });

  canvas.addEventListener(
    "wheel",
    (e) => {
      const p = eventToUi(e);
      if (uiScreen === "mode" && lockerGridBounds && lockerGridBounds.maxScroll > 0) {
        const g = lockerGridBounds;
        if (p.x >= g.x && p.x < g.x + g.w && p.y >= g.y && p.y < g.y + g.h) {
          e.preventDefault();
          const step = Math.max(8, g.step | 0);
          const delta = e.deltaY < 0 ? -step : step;
          if (g.tab === "cosmetics") {
            lockerScrollCosmetics = clampLockerScroll(
              lockerScrollCosmetics + delta,
              g.maxScroll
            );
          } else {
            lockerScrollSkins = clampLockerScroll(lockerScrollSkins + delta, g.maxScroll);
          }
          return;
        }
      }
      if (!chatOpen) return;
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
    if (scene === "vein" && vein) {
      const zx = canvas.width / vein.ROOM_W;
      const zy = canvas.height / vein.ROOM_H;
      return Math.max(2.2, Math.min(zx, zy) * 0.92);
    }
    const zx = canvas.width / indoorW();
    const zy = canvas.height / indoorH();
    return Math.max(2, Math.min(zx, zy) * 0.9);
  }

  function zoomGoal() {
    const goingRome = fadeMode && fadeNext && rome && rome.isScene(fadeNext.scene);
    const onRome = rome && rome.isScene(scene);
    const goingOut = fadeMode && fadeNext && fadeNext.scene === "island";
    if ((onRome && !goingOut) || goingRome) return keys.z ? SCALE_FAR : SCALE_DEFAULT;
    const goingShop =
      fadeMode &&
      fadeNext &&
      (fadeNext.scene === "shop" ||
        fadeNext.scene === "fish" ||
        fadeNext.scene === "cabin" ||
        fadeNext.scene === "temple" ||
        fadeNext.scene === "hub" ||
        fadeNext.scene === "sub" ||
        fadeNext.scene === "floor" ||
        fadeNext.scene === "wreck" ||
        fadeNext.scene === "vein");
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
    saveLockerProfile();
    const api = lbApi();
    if (api && api.isSignedIn && api.isSignedIn()) {
      if (api.syncNmStatsToProfile) api.syncNmStatsToProfile();
      if (api.syncLocker) api.syncLocker(lockerSnapshot());
    }
  });

  function ensureRome() {
    if (rome) return rome;
    if (typeof IsleRomeBuild !== "function") return null;
    rome = IsleRomeBuild({
      player,
      hash,
      pxi,
      px,
      drawPixText,
      ctx: () => ctx,
      time: () => time,
      viewW: () => viewW,
      viewH: () => viewH,
      uiW: () => (canvas.width / SCALE_UI) | 0,
      uiH: () => (canvas.height / SCALE_UI) | 0,
      getScene: () => scene,
      setScene: (s) => {
        scene = s;
      },
      fade: (sc, spawn) => beginFade(sc, spawn),
      fading: () => !!fadeMode,
      playBlocked: () => uiBlocksPlay() || !!guideOpen,
      islandReturn: () =>
        ruinsPortal
          ? { x: ruinsPortal.x, y: ruinsPortal.y + ruinsPortal.h + 6 }
          : { x: spawnX, y: spawnY },
      shake: (n) => {
        shake = Math.max(shake, n | 0);
      },
      coins: () => player.coins,
      spend: (n) => {
        if (player.coins < n) return false;
        player.coins -= n;
        return true;
      },
      refund: (n) => {
        player.coins += n;
      },
      giveItem: (id) => addToInventory(id),
      grantCrown: () => {
        grantCosmetic("king_crown");
        equipCosmetic("king_crown");
      },
      speedLive: () => playMode === "speedrun" && !!srTiming,
      speedMode: () => playMode === "speedrun",
      speedCat: () => srCat,
      setSpeedPaused: (on) => setSpeedPaused(on),
      freezeSpeed: () => freezeSpeedClock(),
      finishSpeed: () => finishSpeedrun(),
      commitSegment: (ms) => commitRaceSegment(ms),
      openSegmentFinish: () => openRaceSegmentFinish(),
      snapCam: () => {
        camera.x = player.x + player.w / 2 - viewW / 2;
        camera.y = player.y + player.h / 2 - viewH * 0.36;
        clampCamera();
      },
    });
    return rome;
  }

  ensureRome();
  buildWorld();
  resizeCanvas();
  camera.x = player.x + player.w / 2 - viewW / 2;
  camera.y = player.y + player.h / 2 - viewH * 0.36;
  clampCamera();
  {
    loadLockerProfile();
    // Migrate cosmetics out of any existing survival save into the locker.
    try {
      const raw = JSON.parse(localStorage.getItem(SAVE_KEY) || "");
      if (raw && typeof raw === "object") {
        const slots = ensureSaveSlots(raw.slots);
        const bag = ensureSaveSlots(raw.satchel);
        migrateCosmeticsFromLists([slots, bag]);
        if (raw.cosmetics) {
          if (raw.cosmetics.face && isCosmeticId(raw.cosmetics.face)) {
            grantCosmetic(raw.cosmetics.face);
            if (!cosmetics.face) cosmetics.face = raw.cosmetics.face;
          }
          if (raw.cosmetics.back && isCosmeticId(raw.cosmetics.back)) {
            grantCosmetic(raw.cosmetics.back);
            if (!cosmetics.back) cosmetics.back = raw.cosmetics.back;
          }
        }
        raw.slots = slots;
        raw.satchel = bag;
        raw.cosmetics = { face: cosmetics.face, back: cosmetics.back };
        localStorage.setItem(SAVE_KEY, JSON.stringify(raw));
        saveLockerProfile();
      }
    } catch (e) {}
    loadChatNotifsPref();
    const api = lbApi();
    if (api) {
      srName = api.getLastName() || "";
      if (api.onAuthChange) {
        api.onAuthChange(() => {
          if (api.isSignedIn && api.isSignedIn()) {
            srName = api.displayName() || srName;
            guestNameLocked = true;
            pullCloudLocker();
          } else {
            guestNameLocked = false;
          }
        });
      }
      if (api.isSignedIn && api.isSignedIn()) pullCloudLocker();
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
