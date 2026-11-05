(() => {
  const CFG = window.ISLE_LEADERBOARD || {};
  const CACHE_KEY = "islebound-speedrun-boards";
  const NAME_KEY = "islebound-speedrun-name";
  const SESSION_KEY = "islebound-auth-session";
  const PR_CACHE_KEY = "islebound-speedrun-prs";
  const NM_LOCAL_KEY = "islebound-nm-stats";
  const NM_BOARD_CACHE = "islebound-nm-boards";
  const TABLE = "speedrun_scores";
  const PROFILES = "profiles";
  const PRS = "speedrun_prs";
  const ACCOUNTS = "player_accounts";
  const PRESENCE = "players_online";
  const CHAT = "chat_messages";
  const CLIENT_ID_KEY = "islebound-client-id";
  const CLIENT_IP_KEY = "islebound-client-ip";
  const LOCAL_BANS_KEY = "islebound-local-bans";
  const BANS_TABLE = "player_bans";
  const NEW_SCORE_MS = 7 * 24 * 60 * 60 * 1000; // NEW badge = last week
  const PRESENCE_HEARTBEAT_MS = 12000; // keep board dots roughly fresh while menus are open
  const PRESENCE_ONLINE_MS = 75000; // last_seen within this = online
  const CHAT_POLL_MS = 2500;
  const CHAT_RATE_MS = 1500;
  const CHAT_BODY_MAX = 80;
  const CHAT_FETCH_LIMIT = 50;
  const BAN_POLL_MS = 60000;
  const AUTO_BAN_MS = 24 * 60 * 60 * 1000; // 24h temp ban for detected cheats
  // Friendly copy for banned players (shown in HUD / chat status).
  const BAN_USER_MSG = "You're temporarily banned from online features.";
  // Client-side fallback so Matteus stays blocked even before SETUP SQL runs.
  // Window: 2026-11-05 05:47 UTC → +12h = 17:47 UTC.
  const HARD_BANS = [
    {
      name_norm: "MATTEUS",
      match_mode: "name_fuzzy",
      expires_at: "2026-11-05T17:47:00.000Z",
      reason: "cheat WRs",
    },
    {
      name_norm: "MATTEUS O",
      match_mode: "name_exact",
      expires_at: "2026-11-05T17:47:00.000Z",
      reason: "cheat WRs",
    },
    {
      name_norm: "OWENS",
      match_mode: "name_exact",
      expires_at: "2026-11-05T17:47:00.000Z",
      reason: "cheat WRs",
    },
  ];
  // Lightweight aliases: map variants onto one canonical label (≤12 chars for DB).
  const NAME_ALIASES = {
    "HENRI P": "HENRI",
    HENRI: "HENRI",
    OWENS: "MATTEUS O",
    MATTEUS: "MATTEUS O",
    "MATTEUS O": "MATTEUS O",
    "MATTEUS OWENS": "MATTEUS O",
  };

  // floorMs = absolute minimum under normal rules (boat + sail + 15s cast, etc.).
  // ~15.7s fish times are cheated (cast alone is 15s; boat/sail still required).
  const CATEGORIES = {
    shark: { id: "shark", label: "SHARK%", floorMs: 21900 },
    jelly_white: { id: "jelly_white", label: "WHITE JELLY%", floorMs: 21900 },
    chest: { id: "chest", label: "CHEST%", floorMs: 21900 },
    death: { id: "death", label: "DEATH%", floorMs: 5000 },
    boat: { id: "boat", label: "BOAT%", floorMs: 5000 },
    full_inv: { id: "full_inv", label: "FULL INV%", floorMs: 25000 },
    shark_cloak: { id: "shark_cloak", label: "INVIS SHARK%", floorMs: 21900 },
    serpent: { id: "serpent", label: "SERPENT%", floorMs: 21900 },
    blowfish: { id: "blowfish", label: "BLOWFISH%", floorMs: 21900 },
    megalodon: { id: "megalodon", label: "MEGALODON%", floorMs: 21900 },
    coins_10: { id: "coins_10", label: "10 COINS%", floorMs: 5000 },
    coins_25: { id: "coins_25", label: "25 COINS%", floorMs: 5000 },
    coins_100: { id: "coins_100", label: "100 COINS%", floorMs: 15000 },
  };

  const FISH_STEP_CATS = {
    shark: 1,
    jelly_white: 1,
    chest: 1,
    blowfish: 1,
    megalodon: 1,
    shark_cloak: 1,
  };

  /**
   * Replay step anti-cheat. Frame layout from game captureReplayFrame:
   * [t,x,y,face,aboard,cloak,coins,hp,bx,by,bface,rod,scene,held,inv,serpent]
   * rod: 0 idle, 1 wait, 2 reel
   */
  function validateReplaySteps(category, frames) {
    if (!frames || !frames.length) return { ok: false, error: "no frames" };
    let sawBoat = false;
    let sawAboard = false;
    let sawAboardBeforeRod = false;
    let sawBoatBeforeRod = false;
    let sawRod = false;
    let rodWaitMs = 0;
    let prevT = frames[0][0] | 0;
    let sawCloak = false;
    let sawSerpent = false;
    let maxCoins = 0;
    let minHp = 99;
    let sawFullInv = false;
    let sawHeart = false;
    let firstRodT = -1;

    for (let i = 0; i < frames.length; i++) {
      const f = frames[i];
      if (!f || !f.length) continue;
      const t = f[0] | 0;
      const dt = Math.max(0, Math.min(250, t - prevT));
      prevT = t;
      const aboard = !!f[4];
      const cloak = !!f[5];
      const coins = f[6] | 0;
      const hp = f[7] | 0;
      const bx = f[8];
      const rod = f[11] | 0;
      const inv = f[14];
      const serp = f[15];

      if (bx != null && bx >= 0) sawBoat = true;
      if (aboard) sawAboard = true;
      if (cloak) sawCloak = true;
      if (serp) sawSerpent = true;
      if (coins > maxCoins) maxCoins = coins;
      if (hp < minHp) minHp = hp;

      if (Array.isArray(inv)) {
        let filled = 0;
        for (let s = 0; s < inv.length; s++) {
          const raw = inv[s] || "";
          if (raw) filled++;
          if (String(raw).indexOf("serpent_heart") === 0) sawHeart = true;
          if (String(raw).indexOf("cloak") === 0) {
            /* owned cloak at some point */
          }
        }
        if (filled >= 8) sawFullInv = true;
      }

      if (rod > 0) {
        if (firstRodT < 0) {
          firstRodT = t;
          sawBoatBeforeRod = sawBoat;
          sawAboardBeforeRod = sawAboard;
        }
        sawRod = true;
        if (rod === 1) rodWaitMs += dt;
      }
    }

    if (FISH_STEP_CATS[category]) {
      if (!sawBoatBeforeRod && !sawBoat) return { ok: false, error: "need boat first" };
      if (!sawBoatBeforeRod) return { ok: false, error: "boat before fish" };
      if (!sawAboardBeforeRod && !sawAboard) return { ok: false, error: "board boat first" };
      if (!sawAboardBeforeRod) return { ok: false, error: "board before fish" };
      if (!sawRod) return { ok: false, error: "must cast rod" };
      // Real cast is 15s; require most of that wait in the recording.
      if (rodWaitMs < 12000) return { ok: false, error: "cast too short" };
      if (category === "shark_cloak" && !sawCloak) return { ok: false, error: "need cloak on" };
    }

    if (category === "serpent") {
      if (!sawBoat || !sawAboard) return { ok: false, error: "need boat" };
      if (!sawSerpent) return { ok: false, error: "need serpent fight" };
      if (!sawHeart) return { ok: false, error: "need sea heart" };
    }

    if (category === "boat") {
      // Boat costs 10 coins; owning/boarding the boat is the proof (coin count drops after buy).
      if (!sawBoat) return { ok: false, error: "need buy boat" };
      if (!sawAboard) return { ok: false, error: "need board boat" };
    }

    if (category === "coins_10" && maxCoins < 10) return { ok: false, error: "need 10 coins" };
    if (category === "coins_25" && maxCoins < 25) return { ok: false, error: "need 25 coins" };
    if (category === "coins_100" && maxCoins < 100) return { ok: false, error: "need 100 coins" };

    if (category === "full_inv" && !sawFullInv) return { ok: false, error: "need full inv" };
    if (category === "death" && minHp > 0) return { ok: false, error: "need death" };

    return { ok: true };
  }

  const NM_BOARD_DEFS = {
    playtime: { id: "playtime", label: "PLAYTIME", col: "nm_playtime_ms", order: "desc" },
    level: { id: "level", label: "LEVEL", col: "nm_level_high", order: "desc" },
    sharks: { id: "sharks", label: "SHARKS", col: "nm_sharks", order: "desc" },
    chests: { id: "chests", label: "CHESTS", col: "nm_chests", order: "desc" },
    coins: { id: "coins", label: "COINS HIGH", col: "nm_coins_high", order: "desc" },
  };

  const NM_ORDER = ["playtime", "level", "sharks", "chests", "coins"];

  let session = null;
  let profile = null;
  let authListeners = [];
  let scoresSchema = "unknown"; // unknown | full | legacy
  let identityCache = { at: 0, rows: [] };
  let presenceTimer = null;
  let presenceAvailable = true; // false if table missing / hard fail
  let presenceHasUserId = true; // false if user_id column missing on players_online
  let presenceHasMode = true; // false if mode/category columns missing
  let presenceHasHub = true; // false if hub pose columns missing
  let onlineCount = null; // null = unknown / unavailable
  let onlinePresence = []; // [{ client_id, username, user_id, mode, category, hub_* }]
  let lastPresenceAt = 0;
  let presenceActivity = { mode: "menu", category: null }; // set by game
  let hubPresencePose = null; // { x,y,face,face_id,back_id,emote } while in hub
  let dailyClaimsAvailable = true;
  const DAILY_CLAIMS = "daily_claims";
  const DAILY_CLAIM_KEY = "islebound-daily-claim";
  let chatAvailable = true; // false if table missing / hard fail
  let chatMessages = []; // newest last
  let chatPollTimer = null;
  let lastChatSendAt = 0;
  let chatStatus = ""; // soft-fail note for UI
  let chatListeners = [];
  let banRows = []; // from player_bans (plus HARD_BANS / localBans merged at check time)
  let localBans = []; // localStorage auto-bans (cheat floor / invalid replay)
  let banPollTimer = null;
  let bansAvailable = true; // false if table missing
  let bansInsertOk = true; // false after anon insert policy / table write fails
  let clientIp = null;
  let lastBanHit = null; // most recent ban check result for UI

  function configured() {
    return !!(CFG.SUPABASE_URL && CFG.SUPABASE_ANON_KEY);
  }

  function restBase() {
    return String(CFG.SUPABASE_URL || "").replace(/\/$/, "") + "/rest/v1";
  }

  function anonHeaders(prefer, extra) {
    const h = {
      apikey: CFG.SUPABASE_ANON_KEY,
      Authorization: "Bearer " + CFG.SUPABASE_ANON_KEY,
      "Content-Type": "application/json",
    };
    if (prefer) h.Prefer = prefer;
    if (extra) Object.assign(h, extra);
    return h;
  }

  function uuid() {
    if (typeof crypto !== "undefined" && crypto.randomUUID) return crypto.randomUUID();
    return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
      const r = (Math.random() * 16) | 0;
      return (c === "x" ? r : (r & 0x3) | 0x8).toString(16);
    });
  }

  function loadCache() {
    try {
      return JSON.parse(localStorage.getItem(CACHE_KEY) || "{}") || {};
    } catch (e) {
      return {};
    }
  }

  function saveCache(cache) {
    try {
      localStorage.setItem(CACHE_KEY, JSON.stringify(cache));
    } catch (e) {}
  }

  function getCachedBoard(category) {
    const cache = loadCache();
    const row = cache[category];
    return row && Array.isArray(row.rows) ? row.rows : [];
  }

  function setCachedBoard(category, rows) {
    const cache = loadCache();
    cache[category] = { rows: rows || [], at: Date.now() };
    saveCache(cache);
  }

  function getLastName() {
    try {
      const n = localStorage.getItem(NAME_KEY) || "";
      return sanitizeName(n, true) || "";
    } catch (e) {
      return "";
    }
  }

  function setLastName(name) {
    try {
      localStorage.setItem(NAME_KEY, sanitizeName(name) || "");
    } catch (e) {}
  }

  /** Strip tags / entities / js: so user strings stay inert if ever put in DOM. */
  function stripInjectedMarkup(raw) {
    return String(raw == null ? "" : raw)
      .replace(/<[^>]*>/g, "")
      .replace(/&[#a-zA-Z0-9]+;/g, "")
      .replace(/javascript\s*:/gi, "")
      .replace(/vbscript\s*:/gi, "")
      .replace(/data\s*:/gi, "")
      .replace(/on[a-z]+\s*=/gi, "");
  }

  function escapeHtml(raw) {
    return String(raw == null ? "" : raw)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }

  function sanitizeName(name, soft) {
    let s = stripInjectedMarkup(String(name || ""))
      .toUpperCase()
      .replace(/[^A-Z0-9 ]/g, "")
      .replace(/\s+/g, " ")
      .trim();
    if (!soft && (s.length < 3 || s.length > 12)) return "";
    if (s.length > 12) s = s.slice(0, 12);
    return s;
  }

  function normalizeIdentityName(name) {
    return stripInjectedMarkup(String(name || ""))
      .toUpperCase()
      .replace(/[^A-Z0-9 ]/g, "")
      .replace(/\s+/g, " ")
      .trim();
  }

  /* ---------- Bans (account / name / client_id / IP) ---------- */

  function banStillActive(b) {
    if (!b) return false;
    if (!b.expires_at) return true;
    const t = Date.parse(b.expires_at);
    if (!Number.isFinite(t)) return true;
    return t > Date.now();
  }

  function normalizeBanRow(r) {
    if (!r) return null;
    return {
      id: r.id != null ? r.id : null,
      name_norm: r.name_norm ? normalizeIdentityName(r.name_norm) : null,
      user_id: r.user_id ? String(r.user_id) : null,
      client_id: r.client_id ? String(r.client_id) : null,
      ip: r.ip ? String(r.ip).trim() : null,
      match_mode: String(r.match_mode || "name_fuzzy"),
      expires_at: r.expires_at || null,
      reason: r.reason ? String(r.reason).slice(0, 80) : null,
    };
  }

  function allActiveBans() {
    const out = [];
    const seen = {};
    function push(raw) {
      const b = normalizeBanRow(raw);
      if (!b || !banStillActive(b)) return;
      const key =
        (b.user_id || "") +
        "|" +
        (b.client_id || "") +
        "|" +
        (b.ip || "") +
        "|" +
        (b.name_norm || "") +
        "|" +
        (b.match_mode || "") +
        "|" +
        (b.expires_at || "");
      if (seen[key]) return;
      seen[key] = 1;
      out.push(b);
    }
    for (let i = 0; i < HARD_BANS.length; i++) push(HARD_BANS[i]);
    for (let i = 0; i < localBans.length; i++) push(localBans[i]);
    for (let i = 0; i < banRows.length; i++) push(banRows[i]);
    return out;
  }

  function loadLocalBans() {
    try {
      const raw = JSON.parse(localStorage.getItem(LOCAL_BANS_KEY) || "[]");
      if (!Array.isArray(raw)) return [];
      const out = [];
      for (let i = 0; i < raw.length; i++) {
        const b = normalizeBanRow(raw[i]);
        if (b && banStillActive(b)) out.push(b);
      }
      return out;
    } catch (e) {
      return [];
    }
  }

  function saveLocalBans(rows) {
    const clean = [];
    const list = Array.isArray(rows) ? rows : [];
    for (let i = 0; i < list.length; i++) {
      const b = normalizeBanRow(list[i]);
      if (b && banStillActive(b)) clean.push(b);
    }
    localBans = clean;
    try {
      localStorage.setItem(LOCAL_BANS_KEY, JSON.stringify(clean));
    } catch (e) {}
    return clean;
  }

  /**
   * Immediately ban a cheater for 24h: localStorage + in-memory, then best-effort
   * POST to player_bans (needs RLS insert policy from SETUP_ALL.sql).
   */
  async function applyCheatBan(opts) {
    const o = opts || {};
    if (!clientIp) {
      try {
        await refreshClientIp();
      } catch (e) {}
    }
    const expires = new Date(Date.now() + AUTO_BAN_MS).toISOString();
    const reason = String(o.reason || "cheat: auto").slice(0, 80);
    const row = normalizeBanRow({
      name_norm: o.name ? normalizeIdentityName(o.name) : null,
      user_id: o.user_id ? String(o.user_id) : null,
      client_id: o.client_id ? String(o.client_id) : getClientId(),
      ip: o.ip != null ? o.ip : clientIp,
      match_mode: o.name ? "name_exact" : "client_id",
      expires_at: expires,
      reason,
    });
    if (!row) return null;
    // Persist locally first so this browser is blocked even if REST insert fails.
    const next = loadLocalBans().filter(banStillActive);
    next.push(row);
    saveLocalBans(next);
    lastBanHit = {
      banned: true,
      reason: row.reason,
      until: row.expires_at,
      kind: row.user_id ? "account" : row.client_id ? "device" : "name",
    };
    if (configured() && bansAvailable && bansInsertOk) {
      try {
        const body = {
          name_norm: row.name_norm,
          user_id: row.user_id,
          client_id: row.client_id,
          ip: row.ip,
          match_mode: row.match_mode || "name_exact",
          expires_at: row.expires_at,
          reason: row.reason,
        };
        const res = await fetch(restBase() + "/" + BANS_TABLE, {
          method: "POST",
          headers: anonHeaders("return=minimal"),
          body: JSON.stringify(body),
        });
        if (!res.ok) {
          // 401/403 = RLS blocked; 404 = table missing. Keep local ban either way.
          if (res.status === 401 || res.status === 403 || res.status === 404) {
            bansInsertOk = false;
          }
          if (res.status === 404 || res.status === 406) bansAvailable = false;
        } else {
          // Refresh server list so other tabs / devices pick it up on next poll.
          fetchBans().catch(() => {});
        }
      } catch (e) {}
    }
    return row;
  }

  async function banForCheat(identity, reason) {
    const id = identity || {};
    await applyCheatBan({
      name: id.name || "",
      user_id: id.user_id || null,
      client_id: id.client_id || getClientId(),
      ip: id.ip != null ? id.ip : clientIp,
      reason: reason || "cheat: auto",
    });
    const hit = checkBanIdentity({
      name: id.name || "",
      user_id: id.user_id || null,
      client_id: id.client_id || getClientId(),
      ip: id.ip != null ? id.ip : clientIp,
    });
    const block = banBlockResult(
      hit && hit.banned
        ? hit
        : { banned: true, reason: reason || "cheat: auto", until: new Date(Date.now() + AUTO_BAN_MS).toISOString(), kind: "device" }
    );
    block.cheated = true;
    return block;
  }

  function nameMatchesBan(name, ban) {
    const n = normalizeIdentityName(name);
    const target = normalizeIdentityName(ban && ban.name_norm);
    if (!n || !target) return false;
    const mode = (ban && ban.match_mode) || "name_fuzzy";
    if (mode === "name_exact" || mode === "exact") return n === target;
    if (mode === "name_prefix" || mode === "prefix") {
      return n === target || n.indexOf(target + " ") === 0;
    }
    // name_fuzzy (default): exact, shared first token, or existing alias fuzzy match
    if (n === target) return true;
    const ta = nameTokens(n);
    const tb = nameTokens(target);
    if (ta[0] && tb[0] && ta[0].length >= 4 && ta[0] === tb[0]) return true;
    if (namesFuzzyMatch(n, target)) return true;
    return false;
  }

  /** Permanent board/VID hide for HARD_BANS names (ignores ban expiry — SQL wipe may lag). */
  function isBoardHiddenName(name) {
    const n = normalizeIdentityName(name);
    if (!n) return false;
    for (let i = 0; i < HARD_BANS.length; i++) {
      const b = HARD_BANS[i];
      if (b && b.name_norm && nameMatchesBan(n, b)) return true;
    }
    return false;
  }

  function banUserMessage(hit) {
    if (!hit || !hit.banned) return "";
    let msg = BAN_USER_MSG;
    if (hit.until) {
      const ms = Date.parse(hit.until) - Date.now();
      if (ms > 0) {
        const hrs = Math.max(1, Math.ceil(ms / 3600000));
        msg += hrs === 1 ? " Try again in about an hour." : " Try again in about " + hrs + " hours.";
      }
    }
    return msg;
  }

  function checkBanIdentity(opts) {
    const o = opts || {};
    const name = o.name || "";
    const uid = o.user_id || null;
    const cid = o.client_id || getClientId();
    const ip = o.ip != null ? o.ip : clientIp;
    const bans = allActiveBans();
    for (let i = 0; i < bans.length; i++) {
      const b = bans[i];
      if (b.user_id && uid && String(b.user_id) === String(uid)) {
        lastBanHit = { banned: true, reason: b.reason, until: b.expires_at, kind: "account" };
        return lastBanHit;
      }
      if (b.client_id && cid && String(b.client_id) === String(cid)) {
        lastBanHit = { banned: true, reason: b.reason, until: b.expires_at, kind: "device" };
        return lastBanHit;
      }
      if (b.ip && ip && String(b.ip) === String(ip)) {
        lastBanHit = { banned: true, reason: b.reason, until: b.expires_at, kind: "ip" };
        return lastBanHit;
      }
      if (b.name_norm && name && nameMatchesBan(name, b)) {
        lastBanHit = { banned: true, reason: b.reason, until: b.expires_at, kind: "name" };
        return lastBanHit;
      }
    }
    lastBanHit = { banned: false };
    return lastBanHit;
  }

  function getBanStatus(opts) {
    return checkBanIdentity(opts || {
      name: displayName() || getLastName() || "",
      user_id: session && session.user ? session.user.id : null,
      client_id: getClientId(),
      ip: clientIp,
    });
  }

  function getClientIp() {
    return clientIp;
  }

  async function refreshClientIp() {
    try {
      const cached = localStorage.getItem(CLIENT_IP_KEY);
      if (cached && /^\d{1,3}(\.\d{1,3}){3}$/.test(cached)) clientIp = cached;
    } catch (e) {}
    try {
      const res = await fetch("https://api.ipify.org?format=json", { cache: "no-store" });
      if (!res.ok) return clientIp;
      const data = await res.json();
      const ip = data && data.ip ? String(data.ip).trim() : "";
      if (ip) {
        clientIp = ip;
        try {
          localStorage.setItem(CLIENT_IP_KEY, ip);
        } catch (e) {}
      }
    } catch (e) {}
    return clientIp;
  }

  async function fetchBans() {
    if (!configured()) return banRows;
    if (!bansAvailable) return banRows;
    const url =
      restBase() +
      "/" +
      BANS_TABLE +
      "?select=id,name_norm,user_id,client_id,ip,match_mode,expires_at,reason" +
      "&or=(expires_at.is.null,expires_at.gt." +
      encodeURIComponent(new Date().toISOString()) +
      ")" +
      "&limit=200";
    try {
      const res = await fetch(url, { headers: anonHeaders() });
      if (!res.ok) {
        if (res.status === 404 || res.status === 406) bansAvailable = false;
        return banRows;
      }
      const data = await res.json();
      const rows = Array.isArray(data) ? data : [];
      const out = [];
      for (let i = 0; i < rows.length; i++) {
        const n = normalizeBanRow(rows[i]);
        if (n && banStillActive(n)) out.push(n);
      }
      banRows = out;
      return banRows;
    } catch (e) {
      return banRows;
    }
  }

  function startBanPoll() {
    if (banPollTimer) return;
    localBans = loadLocalBans();
    fetchBans().catch(() => {});
    refreshClientIp().catch(() => {});
    banPollTimer = setInterval(() => {
      localBans = loadLocalBans();
      fetchBans().catch(() => {});
    }, BAN_POLL_MS);
  }

  function banBlockResult(hit) {
    const msg = banUserMessage(hit) || BAN_USER_MSG;
    return {
      ok: false,
      banned: true,
      error: msg,
      shortError: "TEMP BANNED",
      until: hit && hit.until,
      kind: hit && hit.kind,
    };
  }

  function nameTokens(name) {
    return normalizeIdentityName(name).split(" ").filter(Boolean);
  }

  function aliasCanonical(name) {
    const n = normalizeIdentityName(name);
    if (!n) return "";
    if (NAME_ALIASES[n]) return NAME_ALIASES[n];
    // Also accept names that already equal a canonical value
    for (const k of Object.keys(NAME_ALIASES)) {
      if (NAME_ALIASES[k] === n) return n;
    }
    return "";
  }

  /** Conservative same-person check for guest vs account / board names. */
  function namesFuzzyMatch(a, b) {
    const na = normalizeIdentityName(a);
    const nb = normalizeIdentityName(b);
    if (!na || !nb) return false;
    if (na === nb) return true;

    const ca = aliasCanonical(na);
    const cb = aliasCanonical(nb);
    if (ca && cb && ca === cb) return true;
    if (ca && ca === nb) return true;
    if (cb && cb === na) return true;

    // Alias canonical vs unbound name: "OWENS"→"MATTEUS O" ↔ profile "MATTEUS" / "MATTEUS OWENS"
    function aliasTouches(canon, other) {
      if (!canon || !other) return false;
      if (canon === other) return true;
      const ct = nameTokens(canon);
      const ot = nameTokens(other);
      if (!ct.length || !ot.length) return false;
      if (ct[0].length >= 3 && ct[0] === ot[0]) return true;
      if (ot.length === 1 && ot[0].length >= 4 && ct[ct.length - 1] === ot[0]) return true;
      if (ct.length === 1 && ct[0].length >= 4 && ot[ot.length - 1] === ct[0]) return true;
      return false;
    }
    if (ca && !cb && aliasTouches(ca, nb)) return true;
    if (cb && !ca && aliasTouches(cb, na)) return true;

    const ta = nameTokens(na);
    const tb = nameTokens(nb);
    if (!ta.length || !tb.length) return false;

    // Shared significant last name: "OWENS" ↔ "MATTEUS OWENS"
    if (ta.length === 1 && tb.length >= 2 && ta[0].length >= 4 && ta[0] === tb[tb.length - 1]) return true;
    if (tb.length === 1 && ta.length >= 2 && tb[0].length >= 4 && tb[0] === ta[ta.length - 1]) return true;

    // First-name + optional initial: "HENRI" ↔ "HENRI P"
    if (ta.length === 1 && tb.length === 2 && ta[0].length >= 3 && ta[0] === tb[0] && tb[1].length === 1) return true;
    if (tb.length === 1 && ta.length === 2 && tb[0].length >= 3 && tb[0] === ta[0] && ta[1].length === 1) return true;

    // Same first token + initial vs full last: "HENRI P" ↔ "HENRI PATTERSON"
    if (ta.length >= 2 && tb.length >= 2 && ta[0] === tb[0] && ta[0].length >= 3) {
      const la = ta[ta.length - 1];
      const lb = tb[tb.length - 1];
      if (la === lb) return true;
      if (la.length === 1 && lb.charAt(0) === la) return true;
      if (lb.length === 1 && la.charAt(0) === lb) return true;
    }

    // All shorter tokens appear in longer (full tokens only) — requires ≥1 significant token
    const shorter = ta.length <= tb.length ? ta : tb;
    const longer = ta.length <= tb.length ? tb : ta;
    if (shorter.length < ta.length || shorter.length < tb.length) {
      let significant = 0;
      let allFound = true;
      for (let i = 0; i < shorter.length; i++) {
        const tok = shorter[i];
        if (tok.length >= 4) significant++;
        if (longer.indexOf(tok) < 0) {
          // allow single-letter initial against longer token start
          if (!(tok.length === 1 && longer.some((t) => t.charAt(0) === tok))) {
            allFound = false;
            break;
          }
        }
      }
      if (allFound && significant > 0) return true;
    }

    return false;
  }

  function sanitizePin(pin) {
    const s = String(pin || "").replace(/\D/g, "").slice(0, 4);
    return s.length === 4 ? s : "";
  }

  function formatTime(ms) {
    const t = Math.max(0, ms | 0);
    const m = (t / 60000) | 0;
    const s = ((t % 60000) / 1000) | 0;
    const c = ((t % 1000) / 10) | 0;
    return m + ":" + String(s).padStart(2, "0") + "." + String(c).padStart(2, "0");
  }

  function formatPlaytime(ms) {
    const t = Math.max(0, ms | 0);
    const h = (t / 3600000) | 0;
    const m = ((t % 3600000) / 60000) | 0;
    const s = ((t % 60000) / 1000) | 0;
    if (h > 0) return h + "H " + String(m).padStart(2, "0") + "M";
    return m + "M " + String(s).padStart(2, "0") + "S";
  }

  function formatPlaytimeClock(ms) {
    const t = Math.max(0, ms | 0);
    const h = (t / 3600000) | 0;
    const m = ((t % 3600000) / 60000) | 0;
    const s = ((t % 60000) / 1000) | 0;
    if (h > 0) return h + ":" + String(m).padStart(2, "0") + ":" + String(s).padStart(2, "0");
    return m + ":" + String(s).padStart(2, "0");
  }

  function formatDelta(deltaMs) {
    const sign = deltaMs < 0 ? "-" : "+";
    const abs = Math.abs(deltaMs | 0);
    const whole = ((abs % 60000) / 1000) | 0;
    const frac = ((abs % 1000) / 10) | 0;
    if (abs >= 60000) {
      const m = (abs / 60000) | 0;
      return sign + m + ":" + String(whole).padStart(2, "0") + "." + String(frac).padStart(2, "0");
    }
    return sign + whole + "." + String(frac).padStart(2, "0");
  }

  function rowIsAccount(r) {
    return !!(r && (r.is_account || r.user_id));
  }

  function isNewScoreRow(r, opts) {
    const o = opts || {};
    if (!r) return false;
    if (o.runId && r.run_id && String(r.run_id) === String(o.runId)) return true;
    if (r.created_at) {
      const t = Date.parse(r.created_at);
      if (!isNaN(t) && Date.now() - t >= 0 && Date.now() - t <= NEW_SCORE_MS) return true;
    }
    return false;
  }

  function normalizeScoreRow(r) {
    return {
      category: r.category,
      time_ms: r.time_ms | 0,
      player_name: String(r.player_name || "").toUpperCase(),
      created_at: r.created_at,
      user_id: r.user_id || null,
      run_id: r.run_id || null,
      is_account: !!(r.is_account || r.user_id),
    };
  }

  async function fetchKnownIdentities(force) {
    if (!configured()) return identityCache.rows || [];
    if (!force && identityCache.rows && identityCache.rows.length && Date.now() - (identityCache.at || 0) < 60000) {
      return identityCache.rows;
    }
    const out = [];
    const seen = Object.create(null);
    function pushId(id, label, source) {
      const name = normalizeIdentityName(label);
      if (!id || !name) return;
      const key = String(id);
      if (seen[key]) {
        if (name.length > seen[key].name.length) seen[key].name = name;
        return;
      }
      const row = { id: key, name, source: source || "profile" };
      seen[key] = row;
      out.push(row);
    }
    try {
      const pUrl = restBase() + "/" + PROFILES + "?select=id,display_name&limit=200";
      const pRes = await fetch(pUrl, { headers: anonHeaders() });
      if (pRes.ok) {
        const rows = await pRes.json();
        (Array.isArray(rows) ? rows : []).forEach((r) => pushId(r.id, r.display_name, "profile"));
      }
    } catch (e) {}
    try {
      const aUrl = restBase() + "/" + ACCOUNTS + "?select=id,username&limit=200";
      const aRes = await fetch(aUrl, { headers: anonHeaders() });
      if (aRes.ok) {
        const rows = await aRes.json();
        (Array.isArray(rows) ? rows : []).forEach((r) => pushId(r.id, r.username, "account"));
      }
    } catch (e) {}
    // Also fold account names already present on boards into the pool via aliases.
    Object.keys(NAME_ALIASES).forEach((k) => {
      const canon = NAME_ALIASES[k];
      const hit = out.find((r) => namesFuzzyMatch(r.name, canon) || namesFuzzyMatch(r.name, k));
      if (hit) return;
      // Synthetic label-only identity (no id) — still helps cluster board ghosts.
      out.push({ id: null, name: canon, source: "alias" });
    });
    identityCache = { at: Date.now(), rows: out };
    return out;
  }

  function matchIdentity(name, identities) {
    const n = normalizeIdentityName(name);
    if (!n) return null;
    const list = identities || identityCache.rows || [];
    let best = null;
    for (let i = 0; i < list.length; i++) {
      const idn = list[i];
      if (!idn || !idn.name) continue;
      if (!namesFuzzyMatch(n, idn.name)) continue;
      // Prefer real accounts/profiles over alias-only stubs
      if (!best) {
        best = idn;
        continue;
      }
      const score = (idn.id ? 2 : 0) + (idn.source === "profile" || idn.source === "account" ? 1 : 0);
      const bestScore = (best.id ? 2 : 0) + (best.source === "profile" || best.source === "account" ? 1 : 0);
      if (score > bestScore) best = idn;
      else if (score === bestScore && idn.name.length > best.name.length) best = idn;
    }
    return best;
  }

  function enrichRowIdentity(row, identities) {
    if (!row) return row;
    const r = Object.assign({}, row);
    if (r.user_id) {
      r.is_account = true;
      const hit = (identities || []).find((x) => x && x.id && String(x.id) === String(r.user_id));
      if (hit && hit.name) r.player_name = hit.name;
      return r;
    }
    const hit = matchIdentity(r.player_name, identities);
    if (hit) {
      if (hit.id) {
        r.user_id = hit.id;
        r.is_account = true;
      } else if (hit.name) {
        // Alias-only: still show preferred label; bold only if we know an account id
        r.player_name = hit.name;
      }
      if (hit.name) r.player_name = hit.name;
      if (hit.id) r.is_account = true;
    }
    return r;
  }

  /**
   * Enrich board rows with account identity (display name + is_account styling)
   * via fuzzy name match. Does NOT collapse multiple runs from the same person —
   * top N is N score entries ordered by time_ms ascending.
   */
  function mergeBoardIdentities(rows, identities, limit) {
    const list = Array.isArray(rows) ? rows : [];
    const ids = identities || identityCache.rows || [];
    const enriched = list
      .map((r) => enrichRowIdentity(normalizeScoreRow(r), ids))
      .filter((r) => !isBoardHiddenName(r.player_name));
    enriched.sort((a, b) => (a.time_ms | 0) - (b.time_ms | 0));
    const lim = Math.max(1, Math.min(25, limit | 0 || enriched.length));
    return enriched.slice(0, lim);
  }

  async function resolveSubmitIdentity(playerName) {
    const name = sanitizeName(playerName);
    if (!name) return { name: "", user_id: null, is_account: false };
    if (session && session.user) {
      const preferred =
        (profile && profile.display_name) ||
        session.user.username ||
        name;
      return {
        name: sanitizeName(preferred, true) || name,
        user_id: session.user.id,
        is_account: true,
      };
    }
    const identities = await fetchKnownIdentities();
    const hit = matchIdentity(name, identities);
    if (hit && hit.id) {
      return {
        name: sanitizeName(hit.name, true) || hit.name || name,
        user_id: hit.id,
        is_account: true,
      };
    }
    if (hit && hit.name) {
      return { name: sanitizeName(hit.name, true) || hit.name || name, user_id: null, is_account: false };
    }
    return { name, user_id: null, is_account: false };
  }

  async function fetchTop(category, limit) {
    const id = CATEGORIES[category] ? category : null;
    if (!id) return { ok: false, rows: [], error: "bad category" };
    const lim = Math.max(1, Math.min(25, limit | 0 || 10));
    // Over-fetch so HARD_BANS name filter can still fill TOP N.
    const fetchLim = Math.min(50, lim + 20);
    if (!configured()) {
      const cached = mergeBoardIdentities(getCachedBoard(id), identityCache.rows || [], lim);
      return { ok: false, rows: cached, error: "not configured", offline: true };
    }
    if (scoresSchema === "legacy") return fetchTopLegacy(id, lim);
    const url =
      restBase() +
      "/" +
      TABLE +
      "?category=eq." +
      encodeURIComponent(id) +
      "&select=category,time_ms,player_name,created_at,user_id,run_id,is_account" +
      "&order=time_ms.asc" +
      "&limit=" +
      fetchLim;
    try {
      const res = await fetch(url, { headers: anonHeaders() });
      if (!res.ok) {
        if (res.status === 400) {
          scoresSchema = "legacy";
          return fetchTopLegacy(id, lim);
        }
        return {
          ok: false,
          rows: mergeBoardIdentities(getCachedBoard(id), identityCache.rows || [], lim),
          error: "http " + res.status,
        };
      }
      scoresSchema = "full";
      const data = await res.json();
      const identities = await fetchKnownIdentities();
      const rows = mergeBoardIdentities(
        (Array.isArray(data) ? data : []).map(normalizeScoreRow),
        identities,
        lim
      );
      setCachedBoard(id, rows);
      return { ok: true, rows };
    } catch (e) {
      return {
        ok: false,
        rows: mergeBoardIdentities(getCachedBoard(id), identityCache.rows || [], lim),
        error: "network",
      };
    }
  }

  async function fetchTopLegacy(id, lim) {
    const fetchLim = Math.min(50, lim + 20);
    const url =
      restBase() +
      "/" +
      TABLE +
      "?category=eq." +
      encodeURIComponent(id) +
      "&select=category,time_ms,player_name,created_at" +
      "&order=time_ms.asc" +
      "&limit=" +
      fetchLim;
    try {
      const res = await fetch(url, { headers: anonHeaders() });
      if (!res.ok) {
        return {
          ok: false,
          rows: mergeBoardIdentities(getCachedBoard(id), identityCache.rows || [], lim),
          error: "http " + res.status,
        };
      }
      const data = await res.json();
      const identities = await fetchKnownIdentities();
      const rows = mergeBoardIdentities(
        (Array.isArray(data) ? data : []).map(normalizeScoreRow),
        identities,
        lim
      );
      setCachedBoard(id, rows);
      return { ok: true, rows };
    } catch (e) {
      return {
        ok: false,
        rows: mergeBoardIdentities(getCachedBoard(id), identityCache.rows || [], lim),
        error: "network",
      };
    }
  }

  function loadPrCache() {
    try {
      return JSON.parse(localStorage.getItem(PR_CACHE_KEY) || "{}") || {};
    } catch (e) {
      return {};
    }
  }

  function savePrCache(cache) {
    try {
      localStorage.setItem(PR_CACHE_KEY, JSON.stringify(cache || {}));
    } catch (e) {}
  }

  function getLocalPr(category) {
    const cache = loadPrCache();
    const key = session && session.user ? "u:" + session.user.id : "guest";
    const bag = cache[key] || {};
    const v = bag[category];
    return v > 0 ? v | 0 : 0;
  }

  function setLocalPr(category, timeMs) {
    const cache = loadPrCache();
    const key = session && session.user ? "u:" + session.user.id : "guest";
    if (!cache[key]) cache[key] = {};
    const prev = cache[key][category] | 0;
    if (!prev || timeMs < prev) cache[key][category] = timeMs | 0;
    savePrCache(cache);
  }

  async function fetchPr(category) {
    const local = getLocalPr(category);
    if (!session || !session.user || !configured()) {
      return { ok: true, time_ms: local || 0, local: true };
    }
    const url =
      restBase() +
      "/" +
      PRS +
      "?user_id=eq." +
      encodeURIComponent(session.user.id) +
      "&category=eq." +
      encodeURIComponent(category) +
      "&select=time_ms&limit=1";
    try {
      const res = await fetch(url, { headers: anonHeaders() });
      if (!res.ok) return { ok: false, time_ms: local || 0, error: "http " + res.status };
      const data = await res.json();
      const ms = data && data[0] ? data[0].time_ms | 0 : 0;
      if (ms > 0) setLocalPr(category, ms);
      return { ok: true, time_ms: ms || local || 0 };
    } catch (e) {
      return { ok: false, time_ms: local || 0, error: "network" };
    }
  }

  async function upsertPr(category, timeMs) {
    const ms = timeMs | 0;
    setLocalPr(category, ms);
    if (!session || !session.user || !configured()) return { ok: true, local: true };
    const prev = await fetchPr(category);
    if (prev.time_ms > 0 && ms >= prev.time_ms) return { ok: true, time_ms: prev.time_ms, improved: false };
    const body = {
      user_id: session.user.id,
      category,
      time_ms: ms,
      updated_at: new Date().toISOString(),
    };
    try {
      const res = await fetch(restBase() + "/" + PRS, {
        method: "POST",
        headers: anonHeaders("resolution=merge-duplicates,return=representation"),
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        let detail = "http " + res.status;
        try {
          const err = await res.json();
          if (err && err.message) detail = err.message;
        } catch (e) {}
        return { ok: false, error: detail, time_ms: ms };
      }
      return { ok: true, time_ms: ms, improved: true };
    } catch (e) {
      return { ok: false, error: "network", time_ms: ms };
    }
  }

  function pbInfo(category, timeMs) {
    const prev = getLocalPr(category) | 0;
    if (!prev) return { prev: 0, delta: 0, label: "FIRST PB", isFirst: true, improved: true };
    const delta = (timeMs | 0) - prev;
    const improved = delta < 0;
    return {
      prev,
      delta,
      label: improved ? "PB " + formatDelta(delta) : formatDelta(delta),
      isFirst: false,
      improved,
    };
  }

  const REPLAY_TABLE = "speedrun_replays";
  const REPLAY_CACHE_PREFIX = "islebound-replay-";

  function saveLocalReplay(category, payload) {
    try {
      localStorage.setItem(REPLAY_CACHE_PREFIX + category, JSON.stringify(payload));
    } catch (e) {}
  }

  function loadLocalReplay(category) {
    try {
      const raw = localStorage.getItem(REPLAY_CACHE_PREFIX + category);
      if (!raw) return null;
      const data = JSON.parse(raw);
      if (!data || !Array.isArray(data.frames) || !data.frames.length) return null;
      return data;
    } catch (e) {
      return null;
    }
  }

  async function uploadReplay(payload) {
    if (!configured() || !payload || !Array.isArray(payload.frames) || !payload.frames.length) {
      return { ok: false, error: "no replay" };
    }
    const body = {
      run_id: payload.run_id || null,
      category: payload.category,
      time_ms: payload.time_ms | 0,
      player_name: sanitizeName(payload.player_name) || "RUNNER",
      frames: payload.frames,
    };
    saveLocalReplay(body.category, {
      v: 1,
      run_id: body.run_id,
      category: body.category,
      time_ms: body.time_ms,
      player_name: body.player_name,
      frames: body.frames,
    });
    try {
      const res = await fetch(restBase() + "/" + REPLAY_TABLE, {
        method: "POST",
        headers: anonHeaders("return=minimal"),
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        let detail = "http " + res.status;
        try {
          const err = await res.json();
          if (err && err.message) detail = err.message;
        } catch (e) {}
        return { ok: false, error: detail, local: true };
      }
      return { ok: true };
    } catch (e) {
      return { ok: false, error: "network", local: true };
    }
  }

  function replayFromRow(row) {
    if (!row || !Array.isArray(row.frames) || !row.frames.length) return null;
    return {
      v: 1,
      run_id: row.run_id,
      category: row.category,
      time_ms: row.time_ms | 0,
      player_name: row.player_name,
      frames: row.frames,
    };
  }

  /**
   * True when replay identity matches a board-row prefer.
   * - Same run_id on both sides → match.
   * - Different non-null run_ids → reject (never cross-wire two runs).
   * - Prefer has run_id but replay lacks one → fall through to time_ms + fuzzy name
   *   (older uploads / board enrich rename).
   * Meta-only rows (no frames) are allowed for availability probes.
   */
  function replayMatchesPrefer(replay, prefer, opts) {
    if (!replay) return false;
    const allowMeta = !!(opts && opts.metaOnly);
    if (!allowMeta && (!Array.isArray(replay.frames) || !replay.frames.length)) return false;
    const want = prefer || {};
    const wantRun = want.run_id ? String(want.run_id) : "";
    const gotRun = replay.run_id ? String(replay.run_id) : "";
    const hasTime = want.time_ms != null && want.time_ms !== "";
    const hasName = !!(want.player_name && String(want.player_name).trim());
    if (!wantRun && !hasTime && !hasName) return true;
    if (wantRun && gotRun) {
      if (wantRun === gotRun) return true;
      return false;
    }
    if (hasTime && (replay.time_ms | 0) !== (want.time_ms | 0)) return false;
    if (hasName) {
      const a = replay.player_name;
      const b = want.player_name;
      if (
        !(
          namesFuzzyMatch(a, b) ||
          String(a || "").toUpperCase() === String(b || "").toUpperCase()
        )
      ) {
        return false;
      }
    }
    return !!(hasTime || hasName);
  }

  function preferHasIdentity(prefer) {
    const want = prefer || {};
    if (want.run_id) return true;
    if (want.time_ms != null && want.time_ms !== "") return true;
    if (want.player_name && String(want.player_name).trim()) return true;
    return false;
  }

  function preferFromBoardRow(row) {
    if (!row) return null;
    return {
      run_id: row.run_id || null,
      time_ms: row.time_ms | 0,
      player_name: row.player_name || "",
    };
  }

  /** One lightweight (no frames) query for category replay identities. */
  async function fetchReplayMeta(category, limit) {
    const id = CATEGORIES[category] ? category : null;
    if (!id || !configured()) return { ok: false, rows: [] };
    const lim = Math.max(1, Math.min(80, limit | 0 || 40));
    try {
      const url =
        restBase() +
        "/" +
        REPLAY_TABLE +
        "?category=eq." +
        encodeURIComponent(id) +
        "&select=run_id,category,time_ms,player_name,created_at" +
        "&order=time_ms.asc&limit=" +
        lim;
      const res = await fetch(url, { headers: anonHeaders() });
      if (!res.ok) return { ok: false, rows: [] };
      const data = await res.json();
      const rows = (Array.isArray(data) ? data : []).filter(
        (r) => r && !isBoardHiddenName(r.player_name)
      );
      return { ok: true, rows };
    } catch (e) {
      return { ok: false, rows: [], error: "network" };
    }
  }

  /**
   * Which board rows have a matching replay (meta or local). One batch meta fetch —
   * never pulls frames. Returns boolean[] aligned with `rows`.
   */
  async function probeReplayAvailability(category, rows) {
    const id = CATEGORIES[category] ? category : null;
    const list = Array.isArray(rows) ? rows : [];
    const out = list.map(() => false);
    if (!id || !list.length) return out;

    const local = loadLocalReplay(id);
    const localOk = local && !isBoardHiddenName(local.player_name) ? local : null;

    let meta = [];
    if (configured()) {
      const res = await fetchReplayMeta(id, Math.max(40, list.length * 4));
      meta = res.rows || [];
    }

    for (let i = 0; i < list.length; i++) {
      const row = list[i];
      if (!row || isBoardHiddenName(row.player_name)) {
        out[i] = false;
        continue;
      }
      const prefer = preferFromBoardRow(row);
      if (localOk && replayMatchesPrefer(localOk, prefer)) {
        out[i] = true;
        continue;
      }
      for (let j = 0; j < meta.length; j++) {
        if (replayMatchesPrefer(meta[j], prefer, { metaOnly: true })) {
          out[i] = true;
          break;
        }
      }
    }
    return out;
  }

  /**
   * Fetch full replay for a board row. prefer = { run_id, time_ms, player_name }.
   * With a prefer identity, never falls through to a different player's replay.
   * With no prefer, returns fastest visible replay (legacy browse).
   * opts.signal — AbortSignal to cancel in-flight PostgREST fetches (hard VID cut).
   */
  async function fetchBestReplay(category, prefer, opts) {
    const id = CATEGORIES[category] ? category : null;
    if (!id) return { ok: false, replay: null };
    const want = prefer || {};
    const signal = opts && opts.signal;
    // Hidden/banned names never get a VID — do not fall through to someone else's run.
    if (want.player_name && isBoardHiddenName(want.player_name)) {
      return { ok: false, replay: null, hidden: true };
    }
    const bound = preferHasIdentity(want);
    const local = loadLocalReplay(id);
    const localOk =
      local && !isBoardHiddenName(local.player_name) && replayMatchesPrefer(local, want)
        ? local
        : null;

    if (!configured()) {
      return { ok: !!localOk, replay: localOk, offline: true };
    }

    async function query(extra, limit) {
      const lim = Math.max(1, Math.min(25, limit | 0 || 1));
      const url =
        restBase() +
        "/" +
        REPLAY_TABLE +
        "?category=eq." +
        encodeURIComponent(id) +
        "&select=run_id,category,time_ms,player_name,frames,created_at" +
        (extra || "") +
        "&order=time_ms.asc&limit=" +
        lim;
      const res = await fetch(url, { headers: anonHeaders(), signal });
      if (!res.ok) return [];
      const data = await res.json();
      return Array.isArray(data) ? data : [];
    }

    function firstVisible(rows) {
      const list = Array.isArray(rows) ? rows : [];
      for (let i = 0; i < list.length; i++) {
        if (list[i] && !isBoardHiddenName(list[i].player_name)) return list[i];
      }
      return null;
    }

    function isAbort(err) {
      return !!(err && (err.name === "AbortError" || (signal && signal.aborted)));
    }

    function pickMatchingRow(rows) {
      const list = Array.isArray(rows) ? rows : [];
      for (let i = 0; i < list.length; i++) {
        const c = list[i];
        if (!c || isBoardHiddenName(c.player_name)) continue;
        // Match with metaOnly so we can accept before frames sanity; frames checked below.
        if (
          replayMatchesPrefer(
            {
              run_id: c.run_id || null,
              time_ms: c.time_ms | 0,
              player_name: c.player_name || "",
              frames: c.frames,
            },
            want,
            { metaOnly: true }
          )
        ) {
          return c;
        }
      }
      return null;
    }

    try {
      let row = null;
      if (want.run_id) {
        row = pickMatchingRow(await query("&run_id=eq." + encodeURIComponent(want.run_id), 3));
      }
      // Probe uses fuzzy JS name match; never use exact player_name=eq SQL here —
      // board enrich / aliases (HENRI vs HENRI P) made chips show then fetch say NO REPLAY.
      if (!row && want.time_ms != null && want.time_ms !== "") {
        row = pickMatchingRow(await query("&time_ms=eq." + (want.time_ms | 0), 25));
      }
      // Unbound fastest visible replay only when caller did not name a board row.
      if (!row && !bound) {
        row = firstVisible(await query("", 20));
      }

      const replay = replayFromRow(row);
      if (
        replay &&
        !isBoardHiddenName(replay.player_name) &&
        Array.isArray(replay.frames) &&
        replay.frames.length &&
        replayMatchesPrefer(replay, want)
      ) {
        saveLocalReplay(id, replay);
        return { ok: true, replay, source: "online" };
      }
      // Online row missing or mismatched — never serve a stale/wrong WR from local.
      if (localOk) return { ok: true, replay: localOk, source: "local" };
      return { ok: false, replay: null };
    } catch (e) {
      // Aborted hard-cut must not fall through to a stale local / wrong row.
      if (isAbort(e)) return { ok: false, replay: null, aborted: true };
      if (localOk) return { ok: true, replay: localOk, source: "local", error: "network" };
      return { ok: false, replay: null, error: "network" };
    }
  }

  async function submitScore(category, timeMs, playerName, opts) {
    const def = CATEGORIES[category];
    if (!def) return { ok: false, error: "bad category" };
    const options = opts || {};
    const resolved = await resolveSubmitIdentity(playerName);
    const name = resolved.name || sanitizeName(playerName);
    if (!name) return { ok: false, error: "name must be 3-12 letters/numbers" };
    const banHit = checkBanIdentity({
      name,
      user_id: resolved.user_id || (session && session.user && session.user.id) || null,
      client_id: getClientId(),
      ip: clientIp,
    });
    if (banHit.banned) return banBlockResult(banHit);
    const ms = timeMs | 0;
    if (ms < 0) return { ok: false, error: "bad time" };
    const cheatIdentity = {
      name,
      user_id: resolved.user_id || (session && session.user && session.user.id) || null,
      client_id: getClientId(),
      ip: clientIp,
    };
    // Anti-cheat: reject times below the category's physical minimum → immediate 24h ban.
    if (ms < (def.floorMs | 0)) {
      return banForCheat(cheatIdentity, "cheat: time below floor");
    }
    if (ms > 24 * 60 * 60 * 1000) return { ok: false, error: "time too high" };
    // Replay must exist and its last sample must match the submitted clock
    // (stops posting a fake 15s time with a forged payload).
    const frames = options.replay && options.replay.frames;
    if (!frames || !frames.length) {
      return banForCheat(cheatIdentity, "cheat: invalid replay");
    }
    const lastT = frames[frames.length - 1][0] | 0;
    if (lastT < (def.floorMs | 0)) {
      return banForCheat(cheatIdentity, "cheat: invalid replay");
    }
    if (Math.abs(lastT - ms) > 2000) {
      return banForCheat(cheatIdentity, "cheat: invalid replay");
    }
    const steps = validateReplaySteps(category, frames);
    if (!steps.ok) {
      return banForCheat(cheatIdentity, "cheat: invalid replay");
    }
    setLastName(name);
    if (!configured()) {
      if (options.replay && options.replay.frames) {
        saveLocalReplay(category, {
          v: 1,
          run_id: options.runId || null,
          category,
          time_ms: ms,
          player_name: name,
          frames: options.replay.frames,
        });
      }
      return { ok: false, error: "leaderboard not configured", offline: true };
    }
    const body = {
      category,
      time_ms: ms,
      player_name: name,
    };
    if (scoresSchema !== "legacy") {
      const runId = options.runId || null;
      if (runId) body.run_id = runId;
      if (resolved.user_id) {
        body.user_id = resolved.user_id;
        body.is_account = true;
      } else if (session && session.user) {
        body.user_id = session.user.id;
        body.is_account = true;
      } else if (options.isAccount || resolved.is_account) {
        body.is_account = true;
      }
    }
    if (scoresSchema === "legacy") {
      const legacy = await submitScoreLegacy(category, ms, name);
      if (legacy.ok && options.replay && options.replay.frames) {
        await uploadReplay({
          run_id: options.runId || null,
          category,
          time_ms: ms,
          player_name: name,
          frames: options.replay.frames,
        });
      }
      return legacy;
    }
    try {
      const res = await fetch(restBase() + "/" + TABLE, {
        method: "POST",
        headers: anonHeaders("return=representation"),
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        let detail = "http " + res.status;
        try {
          const err = await res.json();
          if (err && err.message) detail = err.message;
          if (err && err.code === "23505") detail = "already submitted";
        } catch (e) {}
        if (res.status === 400) {
          scoresSchema = "legacy";
          return submitScoreLegacy(category, ms, name);
        }
        return { ok: false, error: detail };
      }
      scoresSchema = "full";
      await upsertPr(category, ms);
      if (session && session.user) await bumpProfileCounters({ submits: 1 });
      if (options.replay && options.replay.frames) {
        await uploadReplay({
          run_id: options.runId || body.run_id || null,
          category,
          time_ms: ms,
          player_name: name,
          frames: options.replay.frames,
        });
      }
      const board = await fetchTop(category, 10);
      return { ok: true, rows: board.rows || [], pb: pbInfo(category, ms), resolved };
    } catch (e) {
      return { ok: false, error: "network" };
    }
  }

  async function submitScoreLegacy(category, ms, name) {
    try {
      const res = await fetch(restBase() + "/" + TABLE, {
        method: "POST",
        headers: anonHeaders("return=representation"),
        body: JSON.stringify({ category, time_ms: ms, player_name: name }),
      });
      if (!res.ok) {
        let detail = "http " + res.status;
        try {
          const err = await res.json();
          if (err && err.message) detail = err.message;
        } catch (e) {}
        return { ok: false, error: detail };
      }
      setLocalPr(category, ms);
      const board = await fetchTop(category, 10);
      return { ok: true, rows: board.rows || [], pb: pbInfo(category, ms) };
    } catch (e) {
      return { ok: false, error: "network" };
    }
  }

  /* ---------- Username + PIN auth (no email / Supabase Auth) ---------- */

  function emitAuth() {
    for (let i = 0; i < authListeners.length; i++) {
      try {
        authListeners[i](session, profile);
      } catch (e) {}
    }
  }

  function onAuthChange(fn) {
    if (typeof fn === "function") authListeners.push(fn);
    return () => {
      authListeners = authListeners.filter((f) => f !== fn);
    };
  }

  function saveSession(s) {
    session = s;
    try {
      if (s) localStorage.setItem(SESSION_KEY, JSON.stringify(s));
      else localStorage.removeItem(SESSION_KEY);
    } catch (e) {}
  }

  function loadSession() {
    try {
      const raw = localStorage.getItem(SESSION_KEY);
      if (!raw) return null;
      return JSON.parse(raw);
    } catch (e) {
      return null;
    }
  }

  function isSignedIn() {
    return !!(session && session.token && session.user && session.user.id);
  }

  function currentUser() {
    return isSignedIn() ? session.user : null;
  }

  function currentProfile() {
    return profile;
  }

  function displayName() {
    if (profile && profile.display_name) return sanitizeName(profile.display_name, true) || profile.display_name;
    if (session && session.user && session.user.username) {
      return sanitizeName(session.user.username, true) || session.user.username;
    }
    return getLastName();
  }

  function totalPlaytimeMs() {
    const p = profile;
    if (!p) return 0;
    return (p.playtime_ms | 0) + (p.nm_playtime_ms | 0);
  }

  function bytesToHex(buf) {
    const a = new Uint8Array(buf);
    let s = "";
    for (let i = 0; i < a.length; i++) s += a[i].toString(16).padStart(2, "0");
    return s;
  }

  function randomSalt() {
    const a = new Uint8Array(16);
    if (typeof crypto !== "undefined" && crypto.getRandomValues) crypto.getRandomValues(a);
    else for (let i = 0; i < a.length; i++) a[i] = (Math.random() * 256) | 0;
    return bytesToHex(a.buffer);
  }

  async function hashPin(pin, salt) {
    const enc = new TextEncoder().encode(String(salt) + ":" + String(pin));
    if (typeof crypto !== "undefined" && crypto.subtle && crypto.subtle.digest) {
      const dig = await crypto.subtle.digest("SHA-256", enc);
      return bytesToHex(dig);
    }
    // Fallback (non-crypto environments): simple string hash — still salted
    let h = 2166136261;
    const str = String(salt) + ":" + String(pin);
    for (let i = 0; i < str.length; i++) {
      h ^= str.charCodeAt(i);
      h = Math.imul(h, 16777619);
    }
    return ("00000000" + (h >>> 0).toString(16)).slice(-8) + String(salt).slice(0, 24);
  }

  async function fetchAccountByUsername(username) {
    const name = sanitizeName(username);
    if (!name || !configured()) return { ok: false, error: "bad name" };
    const url =
      restBase() +
      "/" +
      ACCOUNTS +
      "?username=eq." +
      encodeURIComponent(name) +
      "&select=id,username,pin_salt,pin_hash,created_at&limit=1";
    try {
      const res = await fetch(url, { headers: anonHeaders() });
      if (!res.ok) {
        let detail = "http " + res.status;
        try {
          const err = await res.json();
          if (err && err.message) detail = err.message;
        } catch (e) {}
        return { ok: false, error: detail };
      }
      const rows = await res.json();
      if (!rows || !rows[0]) return { ok: true, account: null };
      return { ok: true, account: rows[0] };
    } catch (e) {
      return { ok: false, error: "network" };
    }
  }

  function applyLocalSession(user) {
    const s = {
      token: uuid(),
      user: {
        id: user.id,
        username: sanitizeName(user.username, true) || user.username,
      },
      at: Date.now(),
    };
    saveSession(s);
    return s;
  }

  async function signUp(username, pin) {
    const name = sanitizeName(username);
    const code = sanitizePin(pin);
    if (!name) return { ok: false, error: "name must be 3-12 letters/numbers" };
    if (!code) return { ok: false, error: "pin must be 4 digits" };
    if (!configured()) return { ok: false, error: "not configured" };
    const banHit = checkBanIdentity({ name, client_id: getClientId(), ip: clientIp });
    if (banHit.banned) return banBlockResult(banHit);
    const existing = await fetchAccountByUsername(name);
    if (!existing.ok) return existing;
    if (existing.account) return { ok: false, error: "username taken" };
    const id = uuid();
    const salt = randomSalt();
    const pin_hash = await hashPin(code, salt);
    const body = {
      id,
      username: name,
      pin_salt: salt,
      pin_hash,
    };
    try {
      const res = await fetch(restBase() + "/" + ACCOUNTS, {
        method: "POST",
        headers: anonHeaders("return=representation"),
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        let detail = "http " + res.status;
        try {
          const err = await res.json();
          if (err && err.code === "23505") detail = "username taken";
          else if (err && err.message) detail = err.message;
        } catch (e) {}
        return { ok: false, error: detail };
      }
      setLastName(name);
      applyLocalSession({ id, username: name });
      await ensureProfile(name);
      emitAuth();
      return { ok: true, session, profile };
    } catch (e) {
      return { ok: false, error: "network" };
    }
  }

  async function signIn(username, pin) {
    const name = sanitizeName(username);
    const code = sanitizePin(pin);
    if (!name) return { ok: false, error: "name must be 3-12 letters/numbers" };
    if (!code) return { ok: false, error: "pin must be 4 digits" };
    if (!configured()) return { ok: false, error: "not configured" };
    const found = await fetchAccountByUsername(name);
    if (!found.ok) return found;
    if (!found.account) return { ok: false, error: "no account" };
    const acc = found.account;
    const banHit = checkBanIdentity({
      name: sanitizeName(acc.username, true) || name,
      user_id: acc.id,
      client_id: getClientId(),
      ip: clientIp,
    });
    if (banHit.banned) return banBlockResult(banHit);
    const expect = await hashPin(code, acc.pin_salt);
    if (expect !== acc.pin_hash) return { ok: false, error: "wrong pin" };
    setLastName(sanitizeName(acc.username, true) || name);
    applyLocalSession({ id: acc.id, username: acc.username });
    await ensureProfile(acc.username);
    emitAuth();
    return { ok: true, session, profile };
  }

  function signOut() {
    session = null;
    profile = null;
    saveSession(null);
    emitAuth();
  }

  /* ---------- Profiles / normal stats ---------- */

  function emptyNmStats() {
    return {
      playtime_ms: 0,
      coins_earned: 0,
      coins_high: 0,
      sharks: 0,
      deaths: 0,
      chests: 0,
      level_high: 1,
    };
  }

  function loadLocalNmStats() {
    try {
      const raw = JSON.parse(localStorage.getItem(NM_LOCAL_KEY) || "{}") || {};
      return Object.assign(emptyNmStats(), raw);
    } catch (e) {
      return emptyNmStats();
    }
  }

  function saveLocalNmStats(stats) {
    try {
      localStorage.setItem(NM_LOCAL_KEY, JSON.stringify(stats || emptyNmStats()));
    } catch (e) {}
  }

  function profileFromRow(row) {
    if (!row) return null;
    return {
      id: row.id,
      display_name: String(row.display_name || "").toUpperCase(),
      playtime_ms: row.playtime_ms | 0,
      total_runs: row.total_runs | 0,
      total_submits: row.total_submits | 0,
      nm_playtime_ms: row.nm_playtime_ms | 0,
      nm_coins_earned: row.nm_coins_earned | 0,
      nm_coins_high: row.nm_coins_high | 0,
      nm_sharks: row.nm_sharks | 0,
      nm_deaths: row.nm_deaths | 0,
      nm_chests: row.nm_chests | 0,
      nm_level_high: row.nm_level_high | 0 || 1,
      created_at: row.created_at,
    };
  }

  async function ensureProfile(preferredName) {
    if (!session || !session.user || !configured()) {
      profile = null;
      return null;
    }
    const id = session.user.id;
    try {
      const getUrl = restBase() + "/" + PROFILES + "?id=eq." + encodeURIComponent(id) + "&select=*&limit=1";
      const getRes = await fetch(getUrl, { headers: anonHeaders() });
      if (getRes.ok) {
        const rows = await getRes.json();
        if (rows && rows[0]) {
          profile = profileFromRow(rows[0]);
          if (profile.display_name) setLastName(profile.display_name);
          return profile;
        }
      }
      const name =
        sanitizeName(preferredName || session.user.username || getLastName() || "PLAYER") || "PLAYER";
      const body = {
        id,
        display_name: name,
        playtime_ms: 0,
        total_runs: 0,
        total_submits: 0,
        nm_playtime_ms: 0,
        nm_coins_earned: 0,
        nm_coins_high: 0,
        nm_sharks: 0,
        nm_deaths: 0,
        nm_chests: 0,
        nm_level_high: 1,
      };
      const post = await fetch(restBase() + "/" + PROFILES, {
        method: "POST",
        headers: anonHeaders("return=representation"),
        body: JSON.stringify(body),
      });
      if (post.ok) {
        const created = await post.json();
        profile = profileFromRow(Array.isArray(created) ? created[0] : created);
        return profile;
      }
    } catch (e) {}
    profile = {
      id,
      display_name: sanitizeName(preferredName || getLastName() || "PLAYER") || "PLAYER",
      playtime_ms: 0,
      total_runs: 0,
      total_submits: 0,
      nm_playtime_ms: 0,
      nm_coins_earned: 0,
      nm_coins_high: 0,
      nm_sharks: 0,
      nm_deaths: 0,
      nm_chests: 0,
      nm_level_high: 1,
    };
    return profile;
  }

  async function updateProfile(patch) {
    if (!session || !session.user || !configured()) return { ok: false, error: "not signed in" };
    const body = Object.assign({}, patch || {}, { updated_at: new Date().toISOString() });
    if (body.display_name) {
      const n = sanitizeName(body.display_name);
      if (!n) return { ok: false, error: "bad name" };
      body.display_name = n;
      setLastName(n);
    }
    try {
      const res = await fetch(restBase() + "/" + PROFILES + "?id=eq." + encodeURIComponent(session.user.id), {
        method: "PATCH",
        headers: anonHeaders("return=representation"),
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        let detail = "http " + res.status;
        try {
          const err = await res.json();
          if (err && err.message) detail = err.message;
        } catch (e) {}
        return { ok: false, error: detail };
      }
      const rows = await res.json();
      if (rows && rows[0]) profile = profileFromRow(rows[0]);
      emitAuth();
      return { ok: true, profile };
    } catch (e) {
      return { ok: false, error: "network" };
    }
  }

  async function bumpProfileCounters(opts) {
    if (!session || !session.user) return;
    const o = opts || {};
    await ensureProfile();
    if (!profile) return;
    const patch = {};
    if (o.runs) patch.total_runs = (profile.total_runs | 0) + (o.runs | 0);
    if (o.submits) patch.total_submits = (profile.total_submits | 0) + (o.submits | 0);
    if (o.playtime_ms) patch.playtime_ms = (profile.playtime_ms | 0) + (o.playtime_ms | 0);
    if (Object.keys(patch).length) await updateProfile(patch);
  }

  async function recordSpeedrunFinish() {
    await bumpProfileCounters({ runs: 1 });
  }

  async function addPlaytime(ms, mode) {
    const add = Math.max(0, ms | 0);
    if (!add) return;
    if (mode === "speedrun") {
      if (session && session.user) {
        await ensureProfile();
        if (profile) await updateProfile({ playtime_ms: (profile.playtime_ms | 0) + add });
      }
      return;
    }
    const local = loadLocalNmStats();
    local.playtime_ms = (local.playtime_ms | 0) + add;
    saveLocalNmStats(local);
    if (session && session.user) {
      await ensureProfile();
      if (profile) {
        await syncNmStatsToProfile(local);
      }
    }
  }

  function noteNmEvent(kind, value) {
    const local = loadLocalNmStats();
    if (kind === "coins_earned") local.coins_earned = (local.coins_earned | 0) + (value | 0);
    else if (kind === "coins_high") local.coins_high = Math.max(local.coins_high | 0, value | 0);
    else if (kind === "sharks") local.sharks = (local.sharks | 0) + (value | 0 || 1);
    else if (kind === "deaths") local.deaths = (local.deaths | 0) + (value | 0 || 1);
    else if (kind === "chests") local.chests = (local.chests | 0) + (value | 0 || 1);
    else if (kind === "level") local.level_high = Math.max(local.level_high | 0, value | 0);
    else if (kind === "playtime") local.playtime_ms = (local.playtime_ms | 0) + (value | 0);
    saveLocalNmStats(local);
    return local;
  }

  async function syncNmStatsToProfile(stats) {
    if (!session || !session.user || !configured()) return { ok: false };
    const s = stats || loadLocalNmStats();
    await ensureProfile();
    if (!profile) return { ok: false };
    return updateProfile({
      nm_playtime_ms: Math.max(profile.nm_playtime_ms | 0, s.playtime_ms | 0),
      nm_coins_earned: Math.max(profile.nm_coins_earned | 0, s.coins_earned | 0),
      nm_coins_high: Math.max(profile.nm_coins_high | 0, s.coins_high | 0),
      nm_sharks: Math.max(profile.nm_sharks | 0, s.sharks | 0),
      nm_deaths: Math.max(profile.nm_deaths | 0, s.deaths | 0),
      nm_chests: Math.max(profile.nm_chests | 0, s.chests | 0),
      nm_level_high: Math.max(profile.nm_level_high | 0, s.level_high | 0, 1),
    });
  }

  function loadNmBoardCache() {
    try {
      return JSON.parse(localStorage.getItem(NM_BOARD_CACHE) || "{}") || {};
    } catch (e) {
      return {};
    }
  }

  function saveNmBoardCache(cache) {
    try {
      localStorage.setItem(NM_BOARD_CACHE, JSON.stringify(cache || {}));
    } catch (e) {}
  }

  async function fetchNmBoard(kind, limit) {
    const def = NM_BOARD_DEFS[kind];
    if (!def) return { ok: false, rows: [], error: "bad board" };
    const lim = Math.max(1, Math.min(25, limit | 0 || 10));
    const cache = loadNmBoardCache();
    const cached = cache[kind] && Array.isArray(cache[kind].rows) ? cache[kind].rows : [];
    if (!configured()) return { ok: false, rows: cached, error: "not configured", offline: true };
    const url =
      restBase() +
      "/" +
      PROFILES +
      "?select=display_name,id," +
      def.col +
      "&order=" +
      def.col +
      "." +
      def.order +
      "&limit=" +
      lim;
    try {
      const res = await fetch(url, { headers: anonHeaders() });
      if (!res.ok) return { ok: false, rows: cached, error: "http " + res.status };
      const data = await res.json();
      const rows = (Array.isArray(data) ? data : []).map((r) => ({
        player_name: String(r.display_name || "?").toUpperCase(),
        user_id: r.id,
        is_account: true,
        value: r[def.col] | 0,
        col: def.col,
      }));
      cache[kind] = { rows, at: Date.now() };
      saveNmBoardCache(cache);
      return { ok: true, rows };
    } catch (e) {
      return { ok: false, rows: cached, error: "network" };
    }
  }

  function formatNmValue(kind, value) {
    if (kind === "playtime") return formatPlaytime(value);
    return String(value | 0);
  }

  async function initAuth() {
    if (!configured()) return;
    const saved = loadSession();
    if (!saved || !saved.token || !saved.user || !saved.user.id) {
      // Drop legacy Supabase Auth sessions (email/magic-link)
      if (saved) saveSession(null);
      return;
    }
    // Migrate older shape that used access_token
    if (!saved.token && saved.access_token && saved.user) {
      saved.token = saved.access_token;
    }
    if (!saved.user.username && saved.user.user_metadata && saved.user.user_metadata.display_name) {
      saved.user.username = saved.user.user_metadata.display_name;
    }
    // Only accept custom username+PIN sessions (no Supabase JWT)
    if (saved.access_token && !saved.token) {
      saveSession(null);
      return;
    }
    if (saved.refresh_token || (saved.access_token && String(saved.access_token).split(".").length === 3)) {
      // Likely old Supabase Auth JWT session — clear it
      saveSession(null);
      return;
    }
    session = {
      token: saved.token,
      user: {
        id: saved.user.id,
        username: sanitizeName(saved.user.username || getLastName() || "PLAYER", true) || "PLAYER",
      },
      at: saved.at || Date.now(),
    };
    saveSession(session);
    await ensureProfile(session.user.username);
    emitAuth();
  }

  /* ---------- Presence / players online ---------- */

  function getClientId() {
    try {
      let id = localStorage.getItem(CLIENT_ID_KEY);
      if (id && String(id).length >= 8) return String(id);
      id = uuid();
      localStorage.setItem(CLIENT_ID_KEY, id);
      return id;
    } catch (e) {
      return uuid();
    }
  }

  function getOnlineCount() {
    return onlineCount;
  }

  function getOnlinePresence() {
    return onlinePresence.slice();
  }

  function presenceUsername() {
    // Prefer signed-in display name so board matching works for accounts.
    const n = displayName() || getLastName() || "";
    const s = sanitizeName(n, true);
    return s || null;
  }

  function presenceUserId() {
    if (!presenceHasUserId) return null;
    if (session && session.user && session.user.id) return String(session.user.id);
    return null;
  }

  function markPresenceUnavailable() {
    presenceAvailable = false;
    onlineCount = null;
    onlinePresence = [];
    if (presenceTimer) {
      clearInterval(presenceTimer);
      presenceTimer = null;
    }
  }

  function presenceErrorDetail(res, err) {
    // Prefer code+message together — PostgREST often puts the useful text in
    // message while code is only PGRST204 / 42703 (which alone hid user_id misses).
    try {
      const parts = [];
      if (err && err.code) parts.push(String(err.code));
      if (err && err.message) parts.push(String(err.message));
      if (err && err.hint) parts.push(String(err.hint));
      if (!parts.length && res && res.status) parts.push("http " + res.status);
      return parts.join(" ");
    } catch (e) {
      return "";
    }
  }

  function presenceLooksMissing(status, detail) {
    const d = String(detail || "").toLowerCase();
    // Column-missing (user_id / mode) must not be treated as the whole table missing.
    if (presenceLooksMissingUserId(status, detail)) return false;
    if (presenceLooksMissingMode(status, detail)) return false;
    return (
      status === 404 ||
      String(detail).indexOf("PGRST205") >= 0 ||
      String(detail).indexOf("PGRST106") >= 0 ||
      d.indexOf("could not find the table") >= 0 ||
      (d.indexOf("does not exist") >= 0 && d.indexOf("column") < 0)
    );
  }

  function presenceLooksMissingUserId(status, detail) {
    const raw = String(detail || "");
    const d = raw.toLowerCase();
    // PGRST204 = missing column in schema cache; 42703 = undefined_column
    if (raw.indexOf("PGRST204") >= 0 || d.indexOf("pgrst204") >= 0) {
      // Only treat as user_id miss when the detail mentions user_id (or no mode mention).
      if (d.indexOf("mode") >= 0 || d.indexOf("category") >= 0) return false;
      if (d.indexOf("user_id") >= 0 || d.indexOf("userid") >= 0) return true;
      // Ambiguous PGRST204 — caller decides; prefer user_id path when that field was sent.
      return d.indexOf("user_id") >= 0;
    }
    if (d.indexOf("42703") >= 0 && d.indexOf("user_id") >= 0) return true;
    if (
      d.indexOf("user_id") >= 0 &&
      (d.indexOf("column") >= 0 ||
        d.indexOf("schema cache") >= 0 ||
        d.indexOf("does not exist") >= 0 ||
        status === 400)
    ) {
      return true;
    }
    return false;
  }

  function presenceLooksMissingMode(status, detail) {
    const raw = String(detail || "");
    const d = raw.toLowerCase();
    if (
      (d.indexOf("mode") >= 0 || d.indexOf("category") >= 0) &&
      (raw.indexOf("PGRST204") >= 0 ||
        d.indexOf("pgrst204") >= 0 ||
        d.indexOf("42703") >= 0 ||
        d.indexOf("column") >= 0 ||
        d.indexOf("schema cache") >= 0 ||
        d.indexOf("does not exist") >= 0 ||
        status === 400)
    ) {
      return true;
    }
    return false;
  }

  function setPresenceActivity(mode, category) {
    const m = String(mode || "menu").toLowerCase();
    presenceActivity = {
      mode: m === "normal" || m === "speedrun" || m === "menu" || m === "hub" ? m : "menu",
      category: category ? String(category).toLowerCase().slice(0, 24) : null,
    };
  }

  function setHubPresence(pose) {
    if (!pose) {
      hubPresencePose = null;
      return;
    }
    hubPresencePose = {
      x: pose.x | 0,
      y: pose.y | 0,
      face: pose.face === -1 ? -1 : 1,
      face_id: pose.face_id ? String(pose.face_id).slice(0, 24) : null,
      back_id: pose.back_id ? String(pose.back_id).slice(0, 24) : null,
      emote: pose.emote ? String(pose.emote).slice(0, 8) : "",
    };
  }

  function presenceLooksMissingHub(status, detail) {
    const raw = String(detail || "");
    const d = raw.toLowerCase();
    if (
      (d.indexOf("hub_x") >= 0 ||
        d.indexOf("hub_y") >= 0 ||
        d.indexOf("hub_face") >= 0 ||
        d.indexOf("face_id") >= 0 ||
        d.indexOf("back_id") >= 0 ||
        d.indexOf("emote") >= 0 ||
        d.indexOf("in_hub") >= 0) &&
      (raw.indexOf("PGRST204") >= 0 ||
        d.indexOf("pgrst204") >= 0 ||
        d.indexOf("42703") >= 0 ||
        d.indexOf("column") >= 0 ||
        d.indexOf("schema cache") >= 0 ||
        d.indexOf("does not exist") >= 0 ||
        status === 400)
    ) {
      return true;
    }
    return false;
  }

  function getPresenceActivity() {
    return { mode: presenceActivity.mode, category: presenceActivity.category };
  }

  /** Human label for a presence row: SHARK%, SURVIVAL, LOBBY, … */
  function presenceActivityLabel(row) {
    if (!row) return "LOBBY";
    const m = String(row.mode || "").toLowerCase();
    if (m === "speedrun") {
      const cat = String(row.category || "").toLowerCase();
      if (cat && CATEGORIES[cat]) return CATEGORIES[cat].label;
      if (cat) return cat.replace(/_/g, " ").toUpperCase() + "%";
      return "SPEEDRUN";
    }
    if (m === "normal") return "SURVIVAL";
    if (m === "hub") return "HUB";
    return "LOBBY";
  }

  async function postPresenceBody(body) {
    const res = await fetch(restBase() + "/" + PRESENCE + "?on_conflict=client_id", {
      method: "POST",
      headers: anonHeaders("resolution=merge-duplicates,return=minimal"),
      body: JSON.stringify(body),
    });
    let err = null;
    if (!res.ok) {
      try {
        err = await res.json();
      } catch (e) {}
    }
    return { res, err, detail: presenceErrorDetail(res, err) };
  }

  async function upsertPresence() {
    if (!configured() || !presenceAvailable) return { ok: false };
    const uname = presenceUsername();
    const uid = presenceUserId();
    const banHit = checkBanIdentity({
      name: uname || "",
      user_id: uid,
      client_id: getClientId(),
      ip: clientIp,
    });
    if (banHit.banned) return { ok: false, banned: true };
    const body = {
      client_id: getClientId(),
      last_seen: new Date().toISOString(),
      username: uname,
    };
    if (uid) body.user_id = uid;
    if (presenceHasMode) {
      body.mode = presenceActivity.mode || "menu";
      body.category = presenceActivity.mode === "speedrun" ? presenceActivity.category : null;
    }
    if (presenceHasHub) {
      if (hubPresencePose) {
        body.in_hub = true;
        body.hub_x = hubPresencePose.x;
        body.hub_y = hubPresencePose.y;
        body.hub_face = hubPresencePose.face;
        body.face_id = hubPresencePose.face_id;
        body.back_id = hubPresencePose.back_id;
        body.emote = hubPresencePose.emote || "";
      } else {
        body.in_hub = false;
        body.hub_x = null;
        body.hub_y = null;
        body.hub_face = null;
        body.face_id = null;
        body.back_id = null;
        body.emote = "";
      }
    }
    try {
      let { res, detail } = await postPresenceBody(body);
      // Soft-drop missing optional columns and retry.
      for (let attempt = 0; attempt < 5 && !res.ok; attempt++) {
        let retried = false;
        if (body.mode != null && presenceLooksMissingMode(res.status, detail)) {
          presenceHasMode = false;
          delete body.mode;
          delete body.category;
          retried = true;
        } else if (presenceHasHub && presenceLooksMissingHub(res.status, detail)) {
          presenceHasHub = false;
          delete body.in_hub;
          delete body.hub_x;
          delete body.hub_y;
          delete body.hub_face;
          delete body.face_id;
          delete body.back_id;
          delete body.emote;
          retried = true;
        } else if (body.user_id && presenceLooksMissingUserId(res.status, detail)) {
          presenceHasUserId = false;
          delete body.user_id;
          retried = true;
        } else if (body.mode != null && (res.status === 400 || String(detail).indexOf("PGRST204") >= 0)) {
          // Ambiguous column miss while sending mode — try dropping mode first.
          presenceHasMode = false;
          delete body.mode;
          delete body.category;
          retried = true;
        } else if (presenceHasHub && (res.status === 400 || String(detail).indexOf("PGRST204") >= 0)) {
          presenceHasHub = false;
          delete body.in_hub;
          delete body.hub_x;
          delete body.hub_y;
          delete body.hub_face;
          delete body.face_id;
          delete body.back_id;
          delete body.emote;
          retried = true;
        }
        if (!retried) break;
        ({ res, detail } = await postPresenceBody(body));
      }
      if (!res.ok) {
        if (presenceLooksMissing(res.status, detail)) {
          markPresenceUnavailable();
          return { ok: false, missing: true };
        }
        return { ok: false, error: "http " + res.status };
      }
      lastPresenceAt = Date.now();
      return { ok: true };
    } catch (e) {
      return { ok: false, error: "network" };
    }
  }

  async function fetchOnlineCount() {
    return fetchOnlinePresence();
  }

  function presenceSelectCols() {
    let cols = "client_id,username";
    if (presenceHasUserId) cols += ",user_id";
    if (presenceHasMode) cols += ",mode,category";
    if (presenceHasHub) cols += ",in_hub,hub_x,hub_y,hub_face,face_id,back_id,emote";
    return cols;
  }

  async function fetchOnlinePresence() {
    if (!configured() || !presenceAvailable) return null;
    const cutoff = new Date(Date.now() - PRESENCE_ONLINE_MS).toISOString();
    const url =
      restBase() +
      "/" +
      PRESENCE +
      "?select=" +
      presenceSelectCols() +
      "&last_seen=gte." +
      encodeURIComponent(cutoff) +
      "&limit=200";
    try {
      const res = await fetch(url, { headers: anonHeaders() });
      if (!res.ok) {
        let err = null;
        try {
          err = await res.json();
        } catch (e) {}
        const detail = presenceErrorDetail(res, err);
        // Missing optional columns → drop and retry (do NOT kill presence).
        if (presenceHasMode && (presenceLooksMissingMode(res.status, detail) || res.status === 400)) {
          presenceHasMode = false;
          return fetchOnlinePresence();
        }
        if (presenceHasHub && (presenceLooksMissingHub(res.status, detail) || res.status === 400)) {
          presenceHasHub = false;
          return fetchOnlinePresence();
        }
        if (presenceHasUserId && (presenceLooksMissingUserId(res.status, detail) || res.status === 400)) {
          presenceHasUserId = false;
          return fetchOnlinePresence();
        }
        if (presenceLooksMissing(res.status, detail) || res.status === 404 || res.status === 406) {
          markPresenceUnavailable();
          return null;
        }
        return onlineCount;
      }
      const data = await res.json();
      const rows = Array.isArray(data) ? data : [];
      onlinePresence = rows.map((r) => ({
        client_id: r && r.client_id ? String(r.client_id) : "",
        username: r && r.username ? normalizeIdentityName(r.username) : "",
        user_id: r && r.user_id ? String(r.user_id) : null,
        mode: r && r.mode ? String(r.mode).toLowerCase() : null,
        category: r && r.category ? String(r.category).toLowerCase() : null,
        in_hub: r && r.in_hub != null ? !!r.in_hub : r && r.mode === "hub",
        hub_x: r && typeof r.hub_x === "number" ? r.hub_x : null,
        hub_y: r && typeof r.hub_y === "number" ? r.hub_y : null,
        hub_face: r && r.hub_face === -1 ? -1 : 1,
        face_id: r && r.face_id ? String(r.face_id) : null,
        back_id: r && r.back_id ? String(r.back_id) : null,
        emote: r && r.emote ? String(r.emote) : "",
      }));
      onlineCount = onlinePresence.length;
      return onlineCount;
    } catch (e) {
      return onlineCount;
    }
  }

  /**
   * True if a board row's player appears in current presence
   * (user_id match preferred; else fuzzy username vs heartbeat username).
   * Guest rows with no matchable presence entry → false.
   */
  function rowIsOnline(r) {
    if (!r || !presenceAvailable || !onlinePresence.length) return false;
    const uid = r.user_id ? String(r.user_id) : "";
    if (uid) {
      for (let i = 0; i < onlinePresence.length; i++) {
        const p = onlinePresence[i];
        if (p && p.user_id && p.user_id === uid) return true;
      }
    }
    const name = normalizeIdentityName(r.player_name || r.username || "");
    if (!name) return false;
    for (let i = 0; i < onlinePresence.length; i++) {
      const p = onlinePresence[i];
      if (!p || !p.username) continue;
      if (namesFuzzyMatch(name, p.username)) return true;
    }
    return false;
  }

  async function tickPresence() {
    if (!configured() || !presenceAvailable) return;
    await upsertPresence();
    if (!presenceAvailable) return;
    await fetchOnlinePresence();
  }

  function startPresence() {
    if (!configured()) {
      onlineCount = null;
      return;
    }
    if (presenceTimer) return;
    tickPresence();
    presenceTimer = setInterval(tickPresence, PRESENCE_HEARTBEAT_MS);
    if (typeof document !== "undefined" && !startPresence._vis) {
      startPresence._vis = true;
      document.addEventListener("visibilitychange", () => {
        if (document.visibilityState === "visible") tickPresence();
      });
    }
  }

  function stopPresence() {
    if (presenceTimer) {
      clearInterval(presenceTimer);
      presenceTimer = null;
    }
  }

  /* ---------- Island chat (global group) ---------- */

  function sanitizeChatBody(body) {
    let s = stripInjectedMarkup(String(body || ""))
      .replace(/[\u0000-\u001f\u007f\u200b-\u200f\u202a-\u202e\ufeff]/g, "")
      .replace(/[<>`]/g, "")
      .replace(/\s+/g, " ")
      .trim();
    // Keep readable chat text; drop leftover control / bidi tricks.
    s = s.replace(/[^\t\x20-\x7e\u00a0-\u024f\u1e00-\u1eff]/g, "");
    s = s.replace(/\s+/g, " ").trim();
    if (s.length > CHAT_BODY_MAX) s = s.slice(0, CHAT_BODY_MAX);
    return s;
  }

  function chatSenderName() {
    const n = displayName() || getLastName() || "";
    return sanitizeName(n, true) || "";
  }

  function canSendChat() {
    return !!(configured() && chatAvailable && chatSenderName());
  }

  function getChatMessages() {
    return chatMessages.slice();
  }

  function getChatStatus() {
    return chatStatus || "";
  }

  function isChatAvailable() {
    return !!(configured() && chatAvailable);
  }

  function onChatUpdate(fn) {
    if (typeof fn === "function") chatListeners.push(fn);
    return () => {
      chatListeners = chatListeners.filter((f) => f !== fn);
    };
  }

  function notifyChatListeners() {
    for (let i = 0; i < chatListeners.length; i++) {
      try {
        chatListeners[i](chatMessages);
      } catch (e) {}
    }
  }

  function markChatUnavailable(note) {
    chatAvailable = false;
    chatStatus = note || "SETUP NEEDED";
    chatMessages = [];
    stopChatPoll();
    notifyChatListeners();
  }

  function chatErrorDetail(res, err) {
    try {
      const parts = [];
      if (err && err.code) parts.push(String(err.code));
      if (err && err.message) parts.push(String(err.message));
      if (err && err.hint) parts.push(String(err.hint));
      if (!parts.length && res && res.status) parts.push("http " + res.status);
      return parts.join(" ");
    } catch (e) {
      return "";
    }
  }

  function chatLooksMissing(status, detail) {
    const d = String(detail || "").toLowerCase();
    return (
      status === 404 ||
      String(detail).indexOf("PGRST205") >= 0 ||
      String(detail).indexOf("PGRST106") >= 0 ||
      d.indexOf("could not find the table") >= 0 ||
      (d.indexOf("does not exist") >= 0 && d.indexOf("column") < 0) ||
      d.indexOf("chat_messages") >= 0 && d.indexOf("schema cache") >= 0
    );
  }

  function normalizeChatRow(r) {
    if (!r) return null;
    const body = sanitizeChatBody(r.body);
    const name = sanitizeName(r.player_name, true) || "?";
    if (!body) return null;
    return {
      id: r.id != null ? String(r.id) : "",
      client_id: r.client_id ? String(r.client_id) : "",
      user_id: r.user_id ? String(r.user_id) : null,
      player_name: name,
      body,
      created_at: r.created_at || null,
      is_account: !!(r.user_id || r.is_account),
    };
  }

  async function fetchChatMessages() {
    if (!configured()) {
      chatStatus = "NO SERVER";
      return chatMessages;
    }
    if (!chatAvailable) return chatMessages;
    const url =
      restBase() +
      "/" +
      CHAT +
      "?select=id,client_id,user_id,player_name,body,created_at" +
      "&order=created_at.desc" +
      "&limit=" +
      CHAT_FETCH_LIMIT;
    try {
      const res = await fetch(url, { headers: anonHeaders() });
      if (!res.ok) {
        let err = null;
        try {
          err = await res.json();
        } catch (e) {}
        const detail = chatErrorDetail(res, err);
        if (chatLooksMissing(res.status, detail) || res.status === 404 || res.status === 406) {
          markChatUnavailable("RUN SETUP SQL");
          return chatMessages;
        }
        return chatMessages;
      }
      const data = await res.json();
      const rows = Array.isArray(data) ? data : [];
      const out = [];
      for (let i = rows.length - 1; i >= 0; i--) {
        const n = normalizeChatRow(rows[i]);
        if (n) out.push(n);
      }
      chatMessages = out;
      if (chatStatus === "RUN SETUP SQL" || chatStatus === "NO SERVER") chatStatus = "";
      notifyChatListeners();
      return chatMessages;
    } catch (e) {
      return chatMessages;
    }
  }

  async function sendChatMessage(rawBody) {
    if (!configured()) return { ok: false, error: "no server" };
    if (!chatAvailable) return { ok: false, error: "setup", missing: true };
    const body = sanitizeChatBody(rawBody);
    if (!body || body.length < 1) return { ok: false, error: "empty" };
    const name = chatSenderName();
    if (!name) return { ok: false, error: "set name" };
    const banHit = checkBanIdentity({
      name,
      user_id: presenceUserId(),
      client_id: getClientId(),
      ip: clientIp,
    });
    if (banHit.banned) {
      const block = banBlockResult(banHit);
      return { ok: false, banned: true, error: "banned", message: block.error, until: block.until };
    }
    const now = Date.now();
    if (now - lastChatSendAt < CHAT_RATE_MS) return { ok: false, error: "slow down" };
    const row = {
      client_id: getClientId(),
      player_name: name,
      body,
    };
    const uid = presenceUserId();
    if (uid) row.user_id = uid;
    try {
      const res = await fetch(restBase() + "/" + CHAT, {
        method: "POST",
        headers: anonHeaders("return=representation"),
        body: JSON.stringify(row),
      });
      if (!res.ok) {
        let err = null;
        try {
          err = await res.json();
        } catch (e) {}
        const detail = chatErrorDetail(res, err);
        if (chatLooksMissing(res.status, detail) || res.status === 404) {
          markChatUnavailable("RUN SETUP SQL");
          return { ok: false, error: "setup", missing: true };
        }
        return { ok: false, error: "http " + res.status };
      }
      lastChatSendAt = now;
      let inserted = null;
      try {
        const data = await res.json();
        inserted = Array.isArray(data) ? data[0] : data;
      } catch (e) {}
      const n = normalizeChatRow(inserted) || {
        id: "local-" + now,
        client_id: row.client_id,
        user_id: row.user_id || null,
        player_name: name,
        body,
        created_at: new Date().toISOString(),
        is_account: !!row.user_id,
      };
      // Optimistic append if not already present
      if (!chatMessages.some((m) => m.id && n.id && m.id === n.id)) {
        chatMessages.push(n);
        if (chatMessages.length > CHAT_FETCH_LIMIT) chatMessages = chatMessages.slice(-CHAT_FETCH_LIMIT);
        notifyChatListeners();
      }
      // Refresh soon so others' messages stay in sync
      fetchChatMessages().catch(() => {});
      return { ok: true, row: n };
    } catch (e) {
      return { ok: false, error: "network" };
    }
  }

  function startChatPoll() {
    if (!configured()) {
      chatStatus = "NO SERVER";
      return;
    }
    if (chatPollTimer) return;
    fetchChatMessages().catch(() => {});
    chatPollTimer = setInterval(() => {
      fetchChatMessages().catch(() => {});
    }, CHAT_POLL_MS);
    if (typeof document !== "undefined" && !startChatPoll._vis) {
      startChatPoll._vis = true;
      document.addEventListener("visibilitychange", () => {
        if (document.visibilityState === "visible" && chatAvailable) fetchChatMessages().catch(() => {});
      });
    }
  }

  function stopChatPoll() {
    if (chatPollTimer) {
      clearInterval(chatPollTimer);
      chatPollTimer = null;
    }
  }

  // Restore session first so the initial heartbeat includes username + user_id.
  Promise.resolve(initAuth())
    .catch(() => {})
    .then(() => {
      startBanPoll();
      startPresence();
      startChatPoll();
    });
  // Re-heartbeat after sign-in / sign-out so ONLINE dots track the active account.
  onAuthChange(() => {
    if (!configured() || !presenceAvailable) return;
    tickPresence();
  });

  function getDailyClaimLocal() {
    try {
      return localStorage.getItem(DAILY_CLAIM_KEY) || "";
    } catch (e) {
      return "";
    }
  }

  async function claimDailyIdol(dayKey) {
    const day = String(dayKey || "").slice(0, 16);
    if (!day) return { ok: false };
    try {
      localStorage.setItem(DAILY_CLAIM_KEY, day);
    } catch (e) {}
    if (!configured() || !dailyClaimsAvailable) return { ok: true, local: true };
    const uid = session && session.user && session.user.id ? session.user.id : null;
    if (!uid) return { ok: true, guest: true };
    const body = {
      user_id: uid,
      day_utc: day,
      item_id: "sun_idol",
      claimed_at: new Date().toISOString(),
    };
    try {
      const res = await fetch(restBase() + "/" + DAILY_CLAIMS + "?on_conflict=user_id,day_utc", {
        method: "POST",
        headers: anonHeaders("resolution=merge-duplicates,return=minimal"),
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        // Soft-fail if table missing
        let err = null;
        try {
          err = await res.json();
        } catch (e) {}
        const detail = String((err && (err.message || err.code)) || res.status);
        if (res.status === 404 || detail.indexOf("PGRST") >= 0 || detail.toLowerCase().indexOf("does not exist") >= 0) {
          dailyClaimsAvailable = false;
        }
        return { ok: true, local: true };
      }
      return { ok: true };
    } catch (e) {
      return { ok: true, local: true };
    }
  }

  window.IsleLeaderboard = {
    CATEGORIES,
    NM_BOARD_DEFS,
    NM_ORDER,
    configured,
    formatTime,
    formatPlaytime,
    formatPlaytimeClock,
    formatDelta,
    formatNmValue,
    sanitizeName,
    sanitizePin,
    stripInjectedMarkup,
    escapeHtml,
    normalizeIdentityName,
    namesFuzzyMatch,
    matchIdentity,
    mergeBoardIdentities,
    fetchKnownIdentities,
    resolveSubmitIdentity,
    getLastName,
    setLastName,
    getCachedBoard,
    fetchTop,
    submitScore,
    validateReplaySteps,
    checkBanIdentity,
    getBanStatus,
    banUserMessage,
    applyCheatBan,
    banForCheat,
    fetchBans,
    getClientIp,
    refreshClientIp,
    uploadReplay,
    fetchBestReplay,
    fetchReplayMeta,
    probeReplayAvailability,
    replayMatchesPrefer,
    preferFromBoardRow,
    loadLocalReplay,
    saveLocalReplay,
    uuid,
    rowIsAccount,
    isNewScoreRow,
    getClientId,
    getOnlineCount,
    getOnlinePresence,
    rowIsOnline,
    fetchOnlinePresence,
    setPresenceActivity,
    getPresenceActivity,
    presenceActivityLabel,
    setHubPresence,
    claimDailyIdol,
    getDailyClaimLocal,
    startPresence,
    stopPresence,
    tickPresence,
    // island chat
    sanitizeChatBody,
    chatSenderName,
    canSendChat,
    getChatMessages,
    getChatStatus,
    isChatAvailable,
    fetchChatMessages,
    sendChatMessage,
    startChatPoll,
    stopChatPoll,
    onChatUpdate,
    pbInfo,
    getLocalPr,
    fetchPr,
    upsertPr,
    // auth
    isSignedIn,
    currentUser,
    currentProfile,
    displayName,
    totalPlaytimeMs,
    onAuthChange,
    signUp,
    signIn,
    signOut,
    updateProfile,
    ensureProfile,
    bumpProfileCounters,
    recordSpeedrunFinish,
    addPlaytime,
    noteNmEvent,
    loadLocalNmStats,
    syncNmStatsToProfile,
    fetchNmBoard,
  };
})();
