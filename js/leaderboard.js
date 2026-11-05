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
  const CLIENT_ID_KEY = "islebound-client-id";
  const NEW_SCORE_MS = 7 * 24 * 60 * 60 * 1000; // NEW badge = last week
  const PRESENCE_HEARTBEAT_MS = 12000; // keep board dots roughly fresh while menus are open
  const PRESENCE_ONLINE_MS = 75000; // last_seen within this = online
  // Lightweight aliases: map variants onto one canonical label (≤12 chars for DB).
  const NAME_ALIASES = {
    "HENRI P": "HENRI",
    HENRI: "HENRI",
    OWENS: "MATTEUS O",
    MATTEUS: "MATTEUS O",
    "MATTEUS O": "MATTEUS O",
    "MATTEUS OWENS": "MATTEUS O",
  };

  const CATEGORIES = {
    shark: { id: "shark", label: "SHARK%", floorMs: 12000 },
    jelly_white: { id: "jelly_white", label: "WHITE JELLY%", floorMs: 12000 },
    chest: { id: "chest", label: "CHEST%", floorMs: 12000 },
    death: { id: "death", label: "DEATH%", floorMs: 1500 },
    boat: { id: "boat", label: "BOAT%", floorMs: 4000 },
    full_inv: { id: "full_inv", label: "FULL INV%", floorMs: 6000 },
    shark_cloak: { id: "shark_cloak", label: "INVIS SHARK%", floorMs: 15000 },
  };

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
  let onlineCount = null; // null = unknown / unavailable
  let onlinePresence = []; // [{ client_id, username, user_id }]
  let lastPresenceAt = 0;

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

  function sanitizeName(name, soft) {
    let s = String(name || "")
      .toUpperCase()
      .replace(/[^A-Z0-9 ]/g, "")
      .replace(/\s+/g, " ")
      .trim();
    if (!soft && (s.length < 3 || s.length > 12)) return "";
    if (s.length > 12) s = s.slice(0, 12);
    return s;
  }

  function normalizeIdentityName(name) {
    return String(name || "")
      .toUpperCase()
      .replace(/[^A-Z0-9 ]/g, "")
      .replace(/\s+/g, " ")
      .trim();
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
    const enriched = list.map((r) => enrichRowIdentity(normalizeScoreRow(r), ids));
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
      lim;
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
    const url =
      restBase() +
      "/" +
      TABLE +
      "?category=eq." +
      encodeURIComponent(id) +
      "&select=category,time_ms,player_name,created_at" +
      "&order=time_ms.asc" +
      "&limit=" +
      lim;
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

  async function submitScore(category, timeMs, playerName, opts) {
    const def = CATEGORIES[category];
    if (!def) return { ok: false, error: "bad category" };
    const options = opts || {};
    const resolved = await resolveSubmitIdentity(playerName);
    const name = resolved.name || sanitizeName(playerName);
    if (!name) return { ok: false, error: "name must be 3-12 letters/numbers" };
    const ms = timeMs | 0;
    if (ms < def.floorMs) return { ok: false, error: "time too low" };
    if (ms > 24 * 60 * 60 * 1000) return { ok: false, error: "time too high" };
    setLastName(name);
    if (!configured()) {
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
      return submitScoreLegacy(category, ms, name);
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
    let detail = "";
    try {
      detail = String((err && (err.code || err.message || err.hint)) || "");
    } catch (e) {}
    return detail;
  }

  function presenceLooksMissing(status, detail) {
    const d = String(detail || "").toLowerCase();
    return (
      status === 404 ||
      String(detail).indexOf("PGRST205") >= 0 ||
      String(detail).indexOf("PGRST106") >= 0 ||
      d.indexOf("does not exist") >= 0 ||
      d.indexOf("could not find the table") >= 0
    );
  }

  function presenceLooksMissingUserId(status, detail) {
    const d = String(detail || "").toLowerCase();
    return (
      d.indexOf("user_id") >= 0 &&
      (d.indexOf("column") >= 0 ||
        d.indexOf("schema cache") >= 0 ||
        String(detail).indexOf("PGRST204") >= 0 ||
        status === 400)
    );
  }

  async function upsertPresence() {
    if (!configured() || !presenceAvailable) return { ok: false };
    const body = {
      client_id: getClientId(),
      last_seen: new Date().toISOString(),
      username: presenceUsername(),
    };
    const uid = presenceUserId();
    if (uid) body.user_id = uid;
    try {
      const res = await fetch(restBase() + "/" + PRESENCE + "?on_conflict=client_id", {
        method: "POST",
        headers: anonHeaders("resolution=merge-duplicates,return=minimal"),
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        let err = null;
        try {
          err = await res.json();
        } catch (e) {}
        const detail = presenceErrorDetail(res, err);
        if (body.user_id && presenceLooksMissingUserId(res.status, detail)) {
          presenceHasUserId = false;
          delete body.user_id;
          try {
            const retry = await fetch(restBase() + "/" + PRESENCE + "?on_conflict=client_id", {
              method: "POST",
              headers: anonHeaders("resolution=merge-duplicates,return=minimal"),
              body: JSON.stringify(body),
            });
            if (retry.ok) {
              lastPresenceAt = Date.now();
              return { ok: true, noUserId: true };
            }
          } catch (e2) {}
        }
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

  async function fetchOnlinePresence() {
    if (!configured() || !presenceAvailable) return null;
    const cutoff = new Date(Date.now() - PRESENCE_ONLINE_MS).toISOString();
    const cols = presenceHasUserId ? "client_id,username,user_id" : "client_id,username";
    const url =
      restBase() +
      "/" +
      PRESENCE +
      "?select=" +
      cols +
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
        if (presenceHasUserId && presenceLooksMissingUserId(res.status, detail)) {
          presenceHasUserId = false;
          return fetchOnlinePresence();
        }
        if (res.status === 404 || res.status === 400 || res.status === 406 || presenceLooksMissing(res.status, detail)) {
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

  initAuth();
  startPresence();

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
    uuid,
    rowIsAccount,
    isNewScoreRow,
    getClientId,
    getOnlineCount,
    getOnlinePresence,
    rowIsOnline,
    fetchOnlinePresence,
    startPresence,
    stopPresence,
    tickPresence,
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
