(() => {
  const CFG = window.ISLE_LEADERBOARD || {};
  const CACHE_KEY = "islebound-speedrun-boards";
  const NAME_KEY = "islebound-speedrun-name";
  const TABLE = "speedrun_scores";

  const CATEGORIES = {
    shark: { id: "shark", label: "SHARK%", floorMs: 12000 },
    jelly_white: { id: "jelly_white", label: "WHITE JELLY%", floorMs: 12000 },
    chest: { id: "chest", label: "CHEST%", floorMs: 12000 },
    death: { id: "death", label: "DEATH%", floorMs: 1500 },
    boat: { id: "boat", label: "BOAT%", floorMs: 4000 },
    full_inv: { id: "full_inv", label: "FULL INV%", floorMs: 6000 },
    shark_cloak: { id: "shark_cloak", label: "INVIS SHARK%", floorMs: 15000 },
  };

  function configured() {
    return !!(CFG.SUPABASE_URL && CFG.SUPABASE_ANON_KEY);
  }

  function restBase() {
    return String(CFG.SUPABASE_URL || "").replace(/\/$/, "") + "/rest/v1";
  }

  function headers(prefer) {
    const h = {
      apikey: CFG.SUPABASE_ANON_KEY,
      Authorization: "Bearer " + CFG.SUPABASE_ANON_KEY,
      "Content-Type": "application/json",
    };
    if (prefer) h.Prefer = prefer;
    return h;
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

  function formatTime(ms) {
    const t = Math.max(0, ms | 0);
    const m = (t / 60000) | 0;
    const s = ((t % 60000) / 1000) | 0;
    const c = ((t % 1000) / 10) | 0;
    return m + ":" + String(s).padStart(2, "0") + "." + String(c).padStart(2, "0");
  }

  async function fetchTop(category, limit) {
    const id = CATEGORIES[category] ? category : null;
    if (!id) return { ok: false, rows: [], error: "bad category" };
    const lim = Math.max(1, Math.min(25, limit | 0 || 10));
    if (!configured()) {
      return { ok: false, rows: getCachedBoard(id), error: "not configured", offline: true };
    }
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
      const res = await fetch(url, { headers: headers() });
      if (!res.ok) {
        return { ok: false, rows: getCachedBoard(id), error: "http " + res.status };
      }
      const data = await res.json();
      const rows = (Array.isArray(data) ? data : []).map((r) => ({
        category: r.category,
        time_ms: r.time_ms | 0,
        player_name: String(r.player_name || "").toUpperCase(),
        created_at: r.created_at,
      }));
      setCachedBoard(id, rows);
      return { ok: true, rows };
    } catch (e) {
      return { ok: false, rows: getCachedBoard(id), error: "network" };
    }
  }

  async function submitScore(category, timeMs, playerName) {
    const def = CATEGORIES[category];
    if (!def) return { ok: false, error: "bad category" };
    const name = sanitizeName(playerName);
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
    try {
      const res = await fetch(restBase() + "/" + TABLE, {
        method: "POST",
        headers: headers("return=representation"),
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
      const board = await fetchTop(category, 10);
      return { ok: true, rows: board.rows || [] };
    } catch (e) {
      return { ok: false, error: "network" };
    }
  }

  window.IsleLeaderboard = {
    CATEGORIES,
    configured,
    formatTime,
    sanitizeName,
    getLastName,
    setLastName,
    getCachedBoard,
    fetchTop,
    submitScore,
  };
})();
