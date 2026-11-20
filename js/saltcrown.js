/* WEST WING — undo by deleting this file, its script tag, and every SALTCROWN block in game.js.
   Beach portal, up and left of the dock, opens straight into the underground room.
   Halls are 176px inside, the dock's full width. The wing is night.
   Four statue guards roam the halls and the courtyard. Potions do nothing yet.
   There is no sail causeway. */
(function () {
  const HALL = 176;
  const RH = 200;
  const PW = 220;
  const MW = 190;
  const CW = 260;
  const LOCKW = 188;
  const T = 44;
  const L = 108;
  const W = L + HALL + PW + MW + CW + LOCKW + 28;
  const H = 860;
  const CELL = 16;

  const left = { x: L, y: T, w: HALL, h: HALL + RH + HALL };
  const top = { x: L, y: T, w: HALL + PW + MW + CW, h: HALL };
  const bot = { x: L, y: T + HALL + RH, w: HALL + PW + MW + CW, h: HALL };
  const potion = { x: L + HALL, y: T + HALL, w: PW, h: RH };
  const master = { x: potion.x + PW, y: potion.y, w: MW, h: RH };
  const court = { x: master.x + MW, y: potion.y, w: CW, h: RH };
  const locked = { x: court.x + CW, y: T, w: LOCKW, h: HALL + RH + HALL };
  const shaft = { x: 20, y: 86, w: L - 20, h: 620 };
  const portalRoom = { x: 20, y: 640, w: 280, h: 180 };
  const book = { x: L - 16, y: 108, w: 26, h: 52 };
  const SPAWN = { x: portalRoom.x + 168, y: portalRoom.y + 78 };
  const RETURN = { x: portalRoom.x + 58, y: portalRoom.y + 96, r: 18 };

  const doors = [
    { x: potion.x + 78, y: potion.y + RH - 14, w: 42, h: 18, atx: potion.x + 99, aty: bot.y + 28 },
    { x: master.x - 2, y: potion.y + 72, w: 16, h: 42, atx: potion.x + PW - 28, aty: potion.y + 93 },
    { x: master.x + 70, y: master.y + RH - 14, w: 42, h: 18, atx: master.x + 91, aty: bot.y + 28 },
    { x: court.x - 2, y: court.y + 78, w: 16, h: 44, atx: master.x + MW - 28, aty: court.y + 100 },
    { x: court.x + 108, y: court.y + RH - 14, w: 44, h: 18, atx: court.x + 130, aty: bot.y + 28 },
    { x: court.x + 108, y: court.y - 4, w: 44, h: 18, atx: court.x + 130, aty: court.y - 28 },
  ];
  const lockedDoor = { x: locked.x - 4, y: court.y + 74, w: 14, h: 46 };
  const windows = [];
  for (let i = 0; i < 6; i++) windows.push({ x: top.x + 36 + i * 130, y: top.y - 8, w: 28, h: 8 });

  const columns = [];
  for (let i = 0; i < 4; i++) columns.push({ x: court.x + 30, y: court.y + 18 + i * 46, w: 14, h: 14 });

  const fountain = { x: court.x + 156, y: court.y + 96, r: 30 };
    const spots = {
    rose: { x: potion.x + 24, y: potion.y + 46 },
    chai: { x: potion.x + 24, y: potion.y + 92 },
    flask: { x: potion.x + 78, y: potion.y + 58 },
    love: { x: potion.x + 118, y: potion.y + 108 },
    clone: { x: potion.x + 156, y: potion.y + 108 },
    hair: { x: master.x + 78, y: master.y + 58 },
    well: { x: fountain.x, y: fountain.y + 8 },
  };
  const TORCHES = [
    { x: top.x + 70, y: top.y + 28 },
    { x: top.x + 250, y: top.y + 28 },
    { x: top.x + 430, y: top.y + 28 },
    { x: top.x + 610, y: top.y + 148 },
    { x: left.x + 28, y: left.y + 250 },
    { x: left.x + 28, y: left.y + 430 },
    { x: bot.x + 180, y: bot.y + 148 },
    { x: bot.x + 520, y: bot.y + 148 },
    { x: potion.x + 188, y: potion.y + 28 },
    { x: master.x + 150, y: master.y + 28 },
    { x: court.x + 36, y: court.y + 22 },
    { x: court.x + court.w - 28, y: court.y + 22 },
    { x: court.x + 36, y: court.y + court.h - 24 },
    { x: court.x + court.w - 28, y: court.y + court.h - 24 },
  ];
  const ROSE = "rose_petal";
  const CHAI = "chai_leaf";
  const HAIR = "master_hair";
  const FLASK_EMPTY = "flask_empty";
  const FLASK_FULL = "flask_full";
  const LOVE = "potion_love";
  const CLONE = "potion_clone";

  function IsleSaltBuild(A) {
    const SAVE = "islebound-westwing";
    let grid = new Uint8Array(W * H);
    let canvas = null;
    let cols = 0;
    let rows = 0;
    let walk = null;
    let guards = [];
    let script = "";
    let grace = 0;
    let alertT = 0;
    let alertX = 0;
    let alertY = 0;
    let wounds = 0;
    let hitCool = 0;
    let bookWas = false;
    let doorWas = [false, false, false, false, false, false];
    let welcomed = false;
    let fillT = 0;
    let fillX = 0;
    let fillY = 0;
    let moonPull = false;
    let speedRun = false;
    let speedHold = null;

    const state = load();

    function freshWing() {
      return {
        hairTaken: 0,
        flaskTaken: 0,
        lovePetals: 0,
        loveWater: 0,
        loveDone: 0,
        cloneHair: 0,
        cloneChai: 0,
        cloneWater: 0,
        cloneDone: 0,
        roseAt: 0,
        chaiAt: 0,
        seen: 1,
        recipe: "",
      };
    }

    function copyState(src) {
      const blank = freshWing();
      Object.keys(blank).forEach(function (k) {
        state[k] = src && src[k] != null ? src[k] : blank[k];
      });
    }

    function speedFrozen() {
      return !!(speedRun && A.speedLive && !A.speedLive());
    }

    function load() {
      const blank = {
        hairTaken: 0,
        flaskTaken: 0,
        lovePetals: 0,
        loveWater: 0,
        loveDone: 0,
        cloneHair: 0,
        cloneChai: 0,
        cloneWater: 0,
        cloneDone: 0,
        roseAt: 0,
        chaiAt: 0,
        seen: 0,
        recipe: "",
      };
      try {
        const raw = localStorage.getItem(SAVE);
        if (!raw) return blank;
        const o = JSON.parse(raw);
        Object.keys(blank).forEach(function (k) {
          if (k === "recipe") return;
          if (typeof o[k] === "number") blank[k] = o[k];
        });
        if (o.recipe === "love" || o.recipe === "clone") blank.recipe = o.recipe;
        if (blank.loveDone) {
          blank.lovePetals = 0;
          blank.loveWater = 0;
          blank.loveDone = 0;
          if (blank.recipe === "love") blank.recipe = "";
        }
        if (blank.cloneDone) {
          blank.cloneHair = 0;
          blank.cloneChai = 0;
          blank.cloneWater = 0;
          blank.cloneDone = 0;
          blank.hairTaken = 0;
          if (blank.recipe === "clone") blank.recipe = "";
        }
      } catch (e) {}
      return blank;
    }

    function save() {
      if (speedRun) return;
      try {
        localStorage.setItem(SAVE, JSON.stringify(state));
      } catch (e) {}
    }

    function inBox(x, y, r) {
      return x >= r.x && y >= r.y && x < r.x + r.w && y < r.y + r.h;
    }

    function inset(r, n) {
      return { x: r.x + n, y: r.y + n, w: r.w - n * 2, h: r.h - n * 2 };
    }

    function feet() {
      const p = A.player;
      return { x: p.x + 4, y: p.y + p.h - 2 };
    }

    function hash(x, y) {
      let n = (x * 374761393 + y * 668265263) | 0;
      n = Math.imul(n ^ (n >>> 13), 1274126177);
      return ((n ^ (n >>> 16)) >>> 0) % 1000;
    }

    function fill(x, y, w, h, v) {
      const x0 = Math.max(0, x | 0);
      const y0 = Math.max(0, y | 0);
      const x1 = Math.min(W, (x + w) | 0);
      const y1 = Math.min(H, (y + h) | 0);
      for (let yy = y0; yy < y1; yy++) {
        const row = yy * W;
        for (let xx = x0; xx < x1; xx++) grid[row + xx] = v;
      }
    }

    function growWalls(n) {
      for (let k = 0; k < n; k++) {
        const next = new Uint8Array(grid);
        for (let y = 1; y < H - 1; y++) {
          for (let x = 1; x < W - 1; x++) {
            const i = y * W + x;
            if (grid[i] !== 0) continue;
            if (grid[i - 1] === 1 || grid[i + 1] === 1 || grid[i - W] === 1 || grid[i + W] === 1 || grid[i - 1] === 3 || grid[i + 1] === 3) {
              next[i] = 2;
            }
          }
        }
        grid = next;
      }
    }

    function stampCircle(cx, cy, r0, r1, v) {
      const x0 = (cx - r1) | 0;
      const y0 = (cy - r1) | 0;
      const x1 = (cx + r1) | 0;
      const y1 = (cy + r1) | 0;
      for (let y = y0; y <= y1; y++) {
        for (let x = x0; x <= x1; x++) {
          const d = Math.hypot(x - cx, y - cy);
          if (d <= r1 && d >= r0) {
            if (x >= 0 && y >= 0 && x < W && y < H) grid[y * W + x] = v;
          }
        }
      }
    }

    function buildGrid() {
      [left, top, bot, potion, master, court, locked, shaft, portalRoom].forEach(function (r) {
        fill(r.x, r.y, r.w, r.h, 1);
      });
      fill(potion.x, potion.y, 10, RH, 2);
      fill(master.x, master.y, 10, RH, 2);
      fill(court.x, court.y, 10, RH, 2);
      fill(potion.x, potion.y, PW + MW, 10, 2);
      fill(court.x, court.y, CW, 10, 2);
      fill(potion.x, potion.y + RH - 10, PW + MW + CW, 10, 2);
      fill(locked.x, locked.y, 12, locked.h, 2);
      fill(L - 12, T, 12, left.h, 2);
      doors.forEach(function (d) {
        fill(d.x, d.y, d.w, d.h, 1);
      });
      fill(book.x, book.y, book.w, book.h, 1);
      columns.forEach(function (c) {
        fill(c.x, c.y, c.w, c.h, 2);
      });
      stampCircle(fountain.x, fountain.y, 18, 28, 2);
      stampCircle(fountain.x, fountain.y, 0, 17, 3);
      growWalls(8);
      fill(book.x, book.y, book.w, book.h, 1);
    }

    function bookOpen() {
      const f = feet();
      const cx = book.x + book.w / 2;
      const cy = book.y + book.h / 2;
      return Math.abs(f.x - cx) < 36 && Math.abs(f.y - cy) < 42;
    }

    function solid(x, y) {
      x |= 0;
      y |= 0;
      if (x < 0 || y < 0 || x >= W || y >= H) return true;
      if (inBox(x, y, locked)) return true;
      if (!bookOpen() && inBox(x, y, book)) return true;
      const g = grid[y * W + x];
      return g === 0 || g === 2;
    }

    function inSafe(x, y) {
      return (
        inBox(x, y, inset(potion, 14)) ||
        inBox(x, y, inset(master, 14)) ||
        inBox(x, y, shaft) ||
        inBox(x, y, portalRoom)
      );
    }

    function cellOf(x, y) {
      return { x: (x / CELL) | 0, y: (y / CELL) | 0 };
    }

    function buildNav() {
      cols = Math.ceil(W / CELL);
      rows = Math.ceil(H / CELL);
      walk = new Uint8Array(cols * rows);
      for (let y = 0; y < rows; y++) {
        for (let x = 0; x < cols; x++) {
          const px = x * CELL + 8;
          const py = y * CELL + 8;
          if (px < 0 || py < 0 || px >= W || py >= H) continue;
          if (grid[py * W + px] !== 1) continue;
          if (inBox(px, py, potion) || inBox(px, py, master) || inBox(px, py, shaft) || inBox(px, py, portalRoom) || inBox(px, py, locked) || inBox(px, py, book)) continue;
          if (!(inBox(px, py, left) || inBox(px, py, top) || inBox(px, py, bot) || inBox(px, py, court))) continue;
          walk[y * cols + x] = 1;
        }
      }
    }

    function nearestWalk(x, y) {
      const c = cellOf(x, y);
      if (c.x >= 0 && c.y >= 0 && c.x < cols && c.y < rows && walk[c.y * cols + c.x]) return c;
      for (let rad = 1; rad < 8; rad++) {
        for (let dy = -rad; dy <= rad; dy++) {
          for (let dx = -rad; dx <= rad; dx++) {
            const nx = c.x + dx;
            const ny = c.y + dy;
            if (nx < 0 || ny < 0 || nx >= cols || ny >= rows) continue;
            if (walk[ny * cols + nx]) return { x: nx, y: ny };
          }
        }
      }
      return null;
    }

    function bfs(sx, sy, tx, ty) {
      if (sx < 0 || sy < 0 || tx < 0 || ty < 0 || sx >= cols || sy >= rows || tx >= cols || ty >= rows) return [];
      if (!walk[sy * cols + sx] || !walk[ty * cols + tx]) return [];
      const prev = new Int32Array(cols * rows);
      prev.fill(-1);
      const q = [sy * cols + sx];
      prev[q[0]] = -2;
      const dirs = [1, 0, -1, 0, 0, 1, 0, -1];
      for (let i = 0; i < q.length; i++) {
        const id = q[i];
        if (id === ty * cols + tx) break;
        const x = id % cols;
        const y = (id / cols) | 0;
        for (let d = 0; d < 8; d += 2) {
          const nx = x + dirs[d];
          const ny = y + dirs[d + 1];
          if (nx < 0 || ny < 0 || nx >= cols || ny >= rows) continue;
          const nid = ny * cols + nx;
          if (!walk[nid] || prev[nid] !== -1) continue;
          prev[nid] = id;
          q.push(nid);
        }
      }
      const end = ty * cols + tx;
      if (prev[end] === -1) return [];
      const path = [];
      let cur = end;
      while (cur !== -2) {
        path.push({ x: (cur % cols) * CELL + 8, y: ((cur / cols) | 0) * CELL + 8 });
        cur = prev[cur];
      }
      path.reverse();
      return path;
    }

    function buildGuards() {
      const seeds = [
        [top.x + 90, top.y + 80],
        [top.x + 420, top.y + 70],
        [left.x + 80, bot.y - 40],
        [court.x + 150, court.y + 120],
      ];
      guards = seeds.map(function (s, i) {
        const c = nearestWalk(s[0], s[1]);
        return {
          x: c ? c.x * CELL + 8 : s[0],
          y: c ? c.y * CELL + 8 : s[1],
          path: [],
          retarget: 0.4 * i,
          aim: 0,
          beam: i,
          phase: i * 1.7,
        };
      });
      const a = nearestWalk(top.x + 80, top.y + 80);
      const b = nearestWalk(court.x + 140, court.y + 110);
      if (!a || !b || !bfs(a.x, a.y, b.x, b.y).length) console.warn("west wing: courtyard is sealed off from the halls");
      const pot = cellOf(potion.x + 40, potion.y + 60);
      if (pot.x >= 0 && walk[pot.y * cols + pot.x]) console.warn("west wing: guards can enter the potion room");
      const cave = cellOf(portalRoom.x + 80, portalRoom.y + 80);
      if (cave.y < rows && walk[cave.y * cols + cave.x]) console.warn("west wing: guards can enter the portal room");
    }

    function chooseGoal(i) {
      if (alertT > 0 && Math.random() < 0.75) {
        const c = nearestWalk(alertX, alertY);
        if (c) return c;
      }
      if (moonPull && guards[i] && guardNotices(guards[i]) && Math.random() < 0.8) {
        const f = feet();
        const c = nearestWalk(f.x, f.y);
        if (c) return c;
      }
      if (Math.random() < 0.72) {
        const j = (i + 1 + ((Math.random() * (guards.length - 1)) | 0)) % guards.length;
        const o = guards[j];
        const c = nearestWalk(o.x + (Math.random() * 70 - 35), o.y + (Math.random() * 70 - 35));
        if (c) return c;
      }
      for (let n = 0; n < 24; n++) {
        const x = (Math.random() * cols) | 0;
        const y = (Math.random() * rows) | 0;
        if (walk[y * cols + x]) return { x: x, y: y };
      }
      return null;
    }

    function alertAt(x, y) {
      alertT = 4.2;
      alertX = x;
      alertY = y;
    }

    function roseUp() {
      return !state.roseAt || Date.now() - state.roseAt > 8000;
    }

    function chaiUp() {
      return !state.chaiAt || Date.now() - state.chaiAt > 8000;
    }

    function heldId() {
      return typeof A.heldId === "function" ? A.heldId() : "";
    }

    function takeHeld(id) {
      if (heldId() !== id) return false;
      return !!A.consume(id);
    }

    function clearLen(ox, oy, ang, max) {
      for (let d = 8; d < max; d += 4) {
        if (solid(ox + Math.cos(ang) * d, oy + Math.sin(ang) * d)) return d;
      }
      return max;
    }

    function moonRays() {
      const t = A.time();
      const rays = [];
      for (let i = 0; i < windows.length; i++) {
        const w = windows[i];
        const ang = Math.PI / 2 + Math.sin(t * 0.35 + i) * 0.08;
        const ox = w.x + w.w / 2;
        const oy = w.y + w.h;
        rays.push({
          x: ox,
          y: oy,
          ang: ang,
          len: clearLen(ox, oy, ang, 176),
          spread: 0.3,
          col: "214,226,255",
          win: true,
        });
      }
      return rays;
    }

    function inCone(px, py, c) {
      const dx = px - c.x;
      const dy = py - c.y;
      const dist = Math.hypot(dx, dy);
      if (dist > c.len || dist < 6) return false;
      if (Math.abs(angDiff(Math.atan2(dy, dx), c.ang)) > c.spread) return false;
      const steps = (dist / 6) | 0;
      for (let i = 1; i < steps; i++) {
        if (solid(c.x + (dx * i) / steps, c.y + (dy * i) / steps)) return false;
      }
      return true;
    }

    function playerInWindowMoon() {
      const f = feet();
      const rays = moonRays();
      for (let i = 0; i < rays.length; i++) {
        if (rays[i].win && inCone(f.x, f.y, rays[i])) return true;
      }
      return false;
    }

    function guardNotices(g) {
      const f = feet();
      const dx = f.x - g.x;
      const dy = f.y - (g.y - 8);
      const dist = Math.hypot(dx, dy);
      if (dist > 380 || dist < 4) return false;
      if (dist < 190) return true;
      const steps = (dist / 8) | 0;
      for (let i = 1; i < steps; i++) {
        if (solid(g.x + (dx * i) / steps, g.y - 8 + (dy * i) / steps)) return false;
      }
      return true;
    }

    function wandRay(g) {
      const ox = g.x;
      const oy = g.y - 8;
      return {
        x: ox,
        y: oy,
        ang: g.beam,
        len: clearLen(ox, oy, g.beam, 96),
        spread: 0.36,
        col: "255,236,186",
      };
    }

    let justDone = "";

    function clearList(kind) {
      if (kind === "love") {
        state.lovePetals = 0;
        state.loveWater = 0;
        state.loveDone = 0;
      } else {
        state.cloneHair = 0;
        state.cloneChai = 0;
        state.cloneWater = 0;
        state.cloneDone = 0;
        state.hairTaken = 0;
      }
      state.recipe = "";
      justDone = kind;
      save();
    }

    function isleRect() {
      return A.island ? A.island() : null;
    }

    function portalSpot() {
      const isle = isleRect();
      if (!isle) return null;
      const w = 18;
      const h = 26;
      return { x: (isle.x + (isle.w - w) / 2) | 0, y: isle.y + 4, w: w, h: h, isle: isle };
    }

    function beachExit() {
      const isle = isleRect();
      if (!isle) return { x: 700, y: 400 };
      return { x: isle.x + 8, y: isle.y + isle.h - 16 };
    }

    function ashoreAt(bx, by) {
      const isle = isleRect();
      if (!isle) return null;
      const cx = isle.x + isle.w / 2;
      const cy = isle.y + isle.h / 2;
      if (Math.hypot(bx - cx, by - cy) > 42) return null;
      return beachExit();
    }

    function onPortal(spot) {
      const f = feet();
      return f.x >= spot.x && f.x <= spot.x + spot.w && f.y >= spot.y && f.y <= spot.y + spot.h;
    }

    function nearReturn() {
      const f = feet();
      return Math.hypot(f.x - RETURN.x, f.y - RETURN.y) < RETURN.r;
    }

    function shoveFree() {
      const p = A.player;
      const fy = p.y + p.h - 2;
      if (!solid(p.x + 3, fy) && !solid(p.x + p.w - 3, fy)) return;
      const tries = [
        [0, 8],
        [0, -8],
        [10, 0],
        [-10, 0],
        [0, 16],
        [14, 8],
        [-14, 8],
      ];
      for (let i = 0; i < tries.length; i++) {
        const nx = p.x + tries[i][0];
        const ny = p.y + tries[i][1];
        const nfy = ny + p.h - 2;
        if (!solid(nx + 3, nfy) && !solid(nx + p.w - 3, nfy)) {
          p.x = nx;
          p.y = ny;
          return;
        }
      }
    }

    function angDiff(a, b) {
      let d = a - b;
      while (d > Math.PI) d -= Math.PI * 2;
      while (d < -Math.PI) d += Math.PI * 2;
      return d;
    }

    function mixAng(a, b, t) {
      return a + angDiff(b, a) * t;
    }

    function beamHits(g) {
      const f = feet();
      if (inSafe(f.x, f.y)) return false;
      const ox = g.x;
      const oy = g.y - 8;
      const dx = f.x - ox;
      const dy = f.y - oy;
      const dist = Math.hypot(dx, dy);
      if (dist > 92 || dist < 10) return false;
      if (Math.abs(angDiff(Math.atan2(dy, dx), g.beam)) > 0.2) return false;
      const steps = (dist / 4) | 0;
      for (let i = 1; i < steps; i++) {
        if (solid(ox + (dx * i) / steps, oy + (dy * i) / steps)) return false;
      }
      return true;
    }

    function strike() {
      if (A.player.dead > 0 || wounds >= 3 || hitCool > 0) return;
      hitCool = 0.92;
      wounds += 1;
      A.player.hurt = 0.5;
      A.shake(6);
      if (wounds >= 3) {
        A.player.hp = 0;
        A.player.dead = 1.35;
        script = "THE SWORD FINDS YOU";
        return;
      }
      A.player.hp = Math.max(1, A.player.hp - 3);
      script = "THE SWORD  " + wounds + " OF 3";
    }

    function moveGuards(dt) {
      const t = A.time();
      moonPull = playerInWindowMoon();
      if (alertT > 0) alertT -= dt;
      if (hitCool > 0) hitCool -= dt;
      for (let i = 0; i < guards.length; i++) {
        const g = guards[i];
        if (moonPull && guardNotices(g) && g.retarget > 0.55) g.retarget = 0.55;
        g.retarget -= dt;
        if (!g.path.length || g.retarget <= 0) {
          const goal = chooseGoal(i);
          const from = cellOf(g.x, g.y);
          if (goal && walk[from.y * cols + from.x]) g.path = bfs(from.x, from.y, goal.x, goal.y);
          else if (goal) {
            const back = nearestWalk(g.x, g.y);
            if (back) g.path = bfs(back.x, back.y, goal.x, goal.y);
          }
          g.retarget = 2.4 + Math.random() * 2.2;
        }
        if (g.path.length) {
          const p = g.path[0];
          const dx = p.x - g.x;
          const dy = p.y - g.y;
          const d = Math.hypot(dx, dy) || 1;
          const step = 82 * dt;
          if (d < step + 1) {
            g.x = p.x;
            g.y = p.y;
            g.path.shift();
          } else {
            g.x += (dx / d) * step;
            g.y += (dy / d) * step;
            g.aim = Math.atan2(dy, dx);
          }
        }
        for (let j = 0; j < guards.length; j++) {
          if (j === i) continue;
          const o = guards[j];
          const dx = g.x - o.x;
          const dy = g.y - o.y;
          const d = Math.hypot(dx, dy);
          if (d > 0 && d < 18) {
            const nx = g.x + (dx / d) * 10 * dt;
            const ny = g.y + (dy / d) * 10 * dt;
            if (nearestWalk(nx, ny)) {
              g.x = nx;
              g.y = ny;
            }
          }
        }
        let beam = g.aim + Math.sin(t * 1.15 + g.phase) * 0.62;
        const f = feet();
        const dx = f.x - g.x;
        const dy = f.y - (g.y - 8);
        const dist = Math.hypot(dx, dy);
        if (alertT > 0 && dist < 210 && dist > 4) beam = mixAng(beam, Math.atan2(dy, dx), 0.5);
        else if (moonPull && dist > 4 && dist < 380 && guardNotices(g)) beam = mixAng(beam, Math.atan2(dy, dx), 0.5);
        g.beam = beam;
        if (A.player.dead <= 0 && beamHits(g)) strike();
      }
    }

    function watchDoors() {
      const open = bookOpen();
      if (open && !bookWas) {
        alertAt(book.x + book.w, book.y + book.h / 2);
        if (A.sfx) A.sfx("book");
      }
      bookWas = open;
      const f = feet();
      for (let i = 0; i < doors.length; i++) {
        const d = doors[i];
        const near = Math.abs(f.x - (d.x + d.w / 2)) < 40 && Math.abs(f.y - (d.y + d.h / 2)) < 40;
        if (near && !doorWas[i]) {
          alertAt(d.atx, d.aty);
          if (A.sfx) A.sfx("door");
        }
        doorWas[i] = near;
      }
    }

    function pourInto(kind) {
      const completes =
        kind === "love"
          ? state.loveWater + 1 >= 3 && state.lovePetals
          : state.cloneWater + 1 >= 2 && state.cloneHair && state.cloneChai >= 3;
      const potion = kind === "love" ? LOVE : CLONE;
      if (!takeHeld(FLASK_FULL)) return false;
      const gotEmpty = !!A.give(FLASK_EMPTY);
      if (completes && !A.give(potion)) {
        if (gotEmpty) A.consume(FLASK_EMPTY);
        A.give(FLASK_FULL);
        return false;
      }
      if (kind === "love") state.loveWater += 1;
      else state.cloneWater += 1;
      if (completes) clearList(kind);
      else save();
      return true;
    }

    function addLove() {
      const id = heldId();
      if (id === ROSE && !state.lovePetals) {
        const completes = state.loveWater >= 3;
        if (!takeHeld(ROSE)) return false;
        if (completes && !A.give(LOVE)) {
          A.give(ROSE);
          return false;
        }
        state.lovePetals = 1;
        if (completes) clearList("love");
        else save();
        return true;
      }
      if (id === FLASK_FULL && state.loveWater < 3) return pourInto("love");
      return false;
    }

    function addClone() {
      const id = heldId();
      if (id === HAIR && !state.cloneHair) {
        const completes = state.cloneChai >= 3 && state.cloneWater >= 2;
        if (!takeHeld(HAIR)) return false;
        if (completes && !A.give(CLONE)) {
          A.give(HAIR);
          return false;
        }
        state.cloneHair = 1;
        if (completes) clearList("clone");
        else save();
        return true;
      }
      if (id === CHAI && state.cloneChai < 3) {
        const completes = state.cloneHair && state.cloneChai + 1 >= 3 && state.cloneWater >= 2;
        if (!takeHeld(CHAI)) return false;
        if (completes && !A.give(CLONE)) {
          A.give(CHAI);
          return false;
        }
        state.cloneChai += 1;
        if (completes) clearList("clone");
        else save();
        return true;
      }
      if (id === FLASK_FULL && state.cloneWater < 2) return pourInto("clone");
      return false;
    }

    function useSpot(k) {
      if (k === "rose") {
        if (!roseUp()) return "ROSE IS GROWING BACK";
        if (!A.give(ROSE)) return "BAG IS FULL";
        state.roseAt = Date.now();
        save();
        return "PICKED UP ROSE PETALS";
      }
      if (k === "chai") {
        if (!chaiUp()) return "CHAI IS GROWING BACK";
        if (!A.give(CHAI)) return "BAG IS FULL";
        state.chaiAt = Date.now();
        save();
        return "PICKED UP CHAI";
      }
      if (k === "flask") {
        if (A.holding(FLASK_EMPTY) || A.holding(FLASK_FULL)) return "THE FLASK IS ALREADY IN YOUR BAG";
        if (!A.give(FLASK_EMPTY)) return "BAG IS FULL";
        state.flaskTaken = 1;
        save();
        return "PICKED UP THE FLASK";
      }
      if (k === "hair") {
        if (state.hairTaken) return "HE IS ASLEEP";
        if (!A.give(HAIR)) return "BAG IS FULL";
        state.hairTaken = 1;
        save();
        return "PICKED UP A HAIR";
      }
      return "";
    }

    function potCenter() {
      return { x: (spots.love.x + spots.clone.x) / 2, y: spots.love.y };
    }

    function potUse() {
      const id = heldId();
      if (
        !speedRun &&
        (!state.recipe || (state.recipe === "clone" && id !== HAIR && id !== CHAI && id !== FLASK_FULL && id !== FLASK_EMPTY))
      ) {
        state.recipe = "love";
        save();
        return "LOVE POTION. FOLLOW THE LIST";
      }
      if (state.recipe === "love") {
        if (id === ROSE) {
          if (state.lovePetals) return "ROSE IS ALREADY ON THE LIST";
          if (!addLove()) return "BAG IS FULL";
          if (justDone === "love") {
            justDone = "";
            return "LOVE POTION. THE LIST CLEARS";
          }
          return "ROSE CHECKED OFF";
        }
        if (id === FLASK_FULL) {
          if (state.loveWater >= 3) return "LOVE HAS ENOUGH WATER";
          if (!pourInto("love")) return "BAG IS FULL";
          if (justDone === "love") {
            justDone = "";
            return "LOVE POTION. THE LIST CLEARS";
          }
          return "WATER  " + state.loveWater + " OF 3";
        }
        if (id === FLASK_EMPTY) return "T  FILL THE FLASK AT THE FOUNTAIN";
        return "THE LIST WANTS ROSE OR A FULL FLASK";
      }
      if (id === HAIR) {
        if (state.cloneHair) return "HAIR IS ALREADY ON THE LIST";
        if (!addClone()) return "BAG IS FULL";
        if (justDone === "clone") {
          justDone = "";
          return "CLONE POTION. THE LIST CLEARS";
        }
        return "HAIR CHECKED OFF";
      }
      if (id === CHAI) {
        if (state.cloneChai >= 3) return "CHAI IS ALREADY ON THE LIST";
        if (!addClone()) return "BAG IS FULL";
        if (justDone === "clone") {
          justDone = "";
          return "CLONE POTION. THE LIST CLEARS";
        }
        return "CHAI  " + state.cloneChai + " OF 3";
      }
      if (id === FLASK_FULL) {
        if (state.cloneWater >= 2) return "CLONE HAS ENOUGH WATER";
        if (!pourInto("clone")) return "BAG IS FULL";
        if (justDone === "clone") {
          justDone = "";
          return "CLONE POTION. THE LIST CLEARS";
        }
        return "WATER  " + state.cloneWater + " OF 2";
      }
      if (id === FLASK_EMPTY) return "T  FILL THE FLASK AT THE FOUNTAIN";
      return "THE LIST WANTS HAIR, CHAI, OR A FULL FLASK";
    }

    function finishFill() {
      fillT = 0;
      if (heldId() !== FLASK_EMPTY) return;
      if (!A.consume(FLASK_EMPTY)) return;
      if (!A.give(FLASK_FULL)) {
        A.give(FLASK_EMPTY);
        script = "BAG IS FULL";
        return;
      }
      script = "FLASK IS FULL";
    }

    function tickFill(dt) {
      if (fillT <= 0) return;
      const f = feet();
      const near = Math.hypot(f.x - spots.well.x, f.y - spots.well.y) < 52;
      const still = !A.player.moving && Math.hypot(f.x - fillX, f.y - fillY) < 12;
      const held = heldId() === FLASK_EMPTY && A.down && A.down("enter");
      if (!held || !near || !still) {
        fillT = 0;
        return;
      }
      fillT += dt;
      if (fillT >= 2) finishFill();
    }

    function roomName(f) {
      if (inBox(f.x, f.y, portalRoom)) return "THE CAVE";
      if (inBox(f.x, f.y, shaft)) return "THE STAIR";
      if (inBox(f.x, f.y, potion)) return "POTION ROOM";
      if (inBox(f.x, f.y, master)) return "MASTER CHAMBER";
      if (inBox(f.x, f.y, court)) return "COURTYARD";
      if (inBox(f.x, f.y, top)) return "MOON HALL";
      return "WEST WING";
    }

    function watchIsland() {
      if (A.speedMode() || A.fading() || grace > 0 || A.aboard() || A.player.dead > 0) return;
      const spot = portalSpot();
      if (!spot || !onPortal(spot)) return;
      grace = 1;
      A.fade("salt", { x: SPAWN.x, y: SPAWN.y });
    }

    function watchReturn() {
      if (speedRun || A.fading() || grace > 0 || A.player.dead > 0) return;
      if (!nearReturn()) return;
      grace = 1;
      const back = beachExit();
      A.fade("island", back);
    }

    function isScene(s) {
      if (s == null) return A.getScene() === "salt";
      return s === "salt";
    }

    function update(dt) {
      if (A.playBlocked()) return;
      if (grace > 0) grace -= dt;
      if (A.getScene() === "island") {
        watchIsland();
        return;
      }
      if (!isScene()) return;
      if (A.player.moving && script) script = "";
      shoveFree();
      watchReturn();
      watchDoors();
      if (A.player.dead <= 0) moveGuards(dt);
      if (!welcomed && !state.seen) {
        state.seen = 1;
        welcomed = true;
        save();
        script = "NIGHT IN THE WEST WING. THE STATUES WALK.";
      }
    }

    function nearestStation() {
      const f = feet();
      const list = [
        ["rose", spots.rose, 46],
        ["chai", spots.chai, 46],
        ["flask", spots.flask, 46],
        ["hair", spots.hair, 50],
        ["well", spots.well, 52],
        ["pot", potCenter(), 60],
      ];
      let best = null;
      let bd = 1e9;
      for (let i = 0; i < list.length; i++) {
        const d = Math.hypot(f.x - list[i][1].x, f.y - list[i][1].y);
        if (d < list[i][2] && d < bd) {
          bd = d;
          best = list[i][0];
        }
      }
      return best;
    }

    function rosePrompt() {
      return roseUp() ? "T  PICK UP ROSE PETALS" : "ROSE IS GROWING BACK";
    }

    function chaiPrompt() {
      return chaiUp() ? "T  PICK UP CHAI" : "CHAI IS GROWING BACK";
    }

    function flaskPrompt() {
      if (A.holding(FLASK_EMPTY) || A.holding(FLASK_FULL)) return "THE FLASK STAYS IN YOUR BAG UNTIL THE POTION IS DONE";
      return "T  PICK UP THE FLASK";
    }

    function hairPrompt() {
      return state.hairTaken ? "HE IS ASLEEP" : "T  PICK UP A HAIR";
    }

    function fillFlask() {
      if (!state.recipe) return "CHOOSE A POTION AT THE POT FIRST";
      const needLove = state.recipe === "love" && !state.loveDone && state.loveWater < 3;
      const needClone = state.recipe === "clone" && !state.cloneDone && state.cloneWater < 2;
      if (!needLove && !needClone) return "THIS LIST DOES NOT NEED WATER";
      if (heldId() === FLASK_FULL) return "FLASK IS FULL. T POUR IT AT THE POT";
      if (heldId() !== FLASK_EMPTY) {
        if (A.holding(FLASK_EMPTY)) return "PRESS 1-8 TO HOLD THE EMPTY FLASK";
        return "T  PICK UP THE FLASK IN THE POTION ROOM";
      }
      if (!A.consume(FLASK_EMPTY)) return "NO FLASK IN HAND";
      if (!A.give(FLASK_FULL)) {
        A.give(FLASK_EMPTY);
        return "BAG IS FULL";
      }
      return "FLASK IS FULL. T POUR IT AT THE POT";
    }

    function wellPrompt() {
      if (!state.recipe) return "CHOOSE A POTION AT THE POT FIRST";
      if (heldId() === FLASK_EMPTY) return "T  FILL THE FLASK";
      if (heldId() === FLASK_FULL) return "FLASK IS FULL. T POUR IT AT THE POT";
      if (A.holding(FLASK_EMPTY)) return "PRESS 1-8 TO HOLD THE EMPTY FLASK";
      if (A.holding(FLASK_FULL)) return "PRESS 1-8 TO HOLD THE FULL FLASK";
      return "T  PICK UP THE FLASK FIRST";
    }

    function potPrompt() {
      const id = heldId();
      if (!state.recipe) return "T  LOVE POTION    Y  CLONE POTION";
      if (state.recipe === "love") {
        if (state.loveDone) return "LOVE IS DONE.  Y  CLONE POTION";
        if (id === ROSE && !state.lovePetals) return "T  PUT THE ROSE ON THE LIST";
        if (id === FLASK_FULL && state.loveWater < 3) return "T  POUR WATER  " + state.loveWater + "/3";
        if (id === FLASK_EMPTY) return "FILL IT AT THE FOUNTAIN WITH T";
        return "HOLD ROSE OR A FULL FLASK.  Y  CLONE";
      }
      if (state.cloneDone) return "CLONE IS DONE.  T  LOVE POTION";
      if (id === HAIR && !state.cloneHair) return "T  PUT THE HAIR ON THE LIST";
      if (id === CHAI && state.cloneChai < 3) return "T  PUT CHAI ON THE LIST  " + state.cloneChai + "/3";
      if (id === FLASK_FULL && state.cloneWater < 2) return "T  POUR WATER  " + state.cloneWater + "/2";
      if (id === FLASK_EMPTY) return "FILL IT AT THE FOUNTAIN WITH T";
      return "HOLD HAIR, CHAI, OR A FULL FLASK.  T  LOVE";
    }

    function stationPrompt(k) {
      if (k === "rose") return rosePrompt();
      if (k === "chai") return chaiPrompt();
      if (k === "flask") return flaskPrompt();
      if (k === "hair") return hairPrompt();
      if (k === "well") return wellPrompt();
      if (k === "pot") return potPrompt();
      return "";
    }

    function nextStep() {
      const hand = heldId();
      const has = function (id) {
        return A.holding(id);
      };
      if (!state.flaskTaken && !has(FLASK_EMPTY) && !has(FLASK_FULL)) return "NEXT  T PICK UP THE FLASK";
      if (!state.loveDone) {
        if (!state.lovePetals) {
          if (hand === ROSE) return "NEXT  T PUT THE ROSE IN THE POT";
          if (has(ROSE)) return "NEXT  PRESS 1-8 TO HOLD THE ROSE";
          return "NEXT  T PICK UP ROSE PETALS";
        }
        if (state.loveWater < 3) {
          if (hand === FLASK_FULL) return "NEXT  T POUR AT THE POT  " + state.loveWater + "/3";
          if (hand === FLASK_EMPTY) return "NEXT  HOLD ENTER AT THE FOUNTAIN";
          if (has(FLASK_EMPTY) || has(FLASK_FULL)) return "NEXT  PRESS 1-8 TO HOLD THE FLASK";
          return "NEXT  T PICK UP THE FLASK";
        }
      }
      if (!state.cloneDone) {
        if (!state.cloneHair) {
          if (hand === HAIR) return "NEXT  T PUT THE HAIR IN THE POT";
          if (has(HAIR)) return "NEXT  PRESS 1-8 TO HOLD THE HAIR";
          if (state.hairTaken) return "NEXT  THE HAIR IS ALREADY TAKEN";
          return "NEXT  T PICK UP HIS HAIR";
        }
        if (state.cloneChai < 3) {
          if (hand === CHAI) return "NEXT  T PUT CHAI IN THE POT  " + state.cloneChai + "/3";
          if (has(CHAI)) return "NEXT  PRESS 1-8 TO HOLD THE CHAI";
          return "NEXT  T PICK UP CHAI  " + state.cloneChai + "/3";
        }
        if (state.cloneWater < 2) {
          if (hand === FLASK_FULL) return "NEXT  T POUR AT THE POT  " + state.cloneWater + "/2";
          if (hand === FLASK_EMPTY) return "NEXT  HOLD ENTER AT THE FOUNTAIN";
          if (has(FLASK_EMPTY) || has(FLASK_FULL)) return "NEXT  PRESS 1-8 TO HOLD THE FLASK";
          return "NEXT  T PICK UP THE FLASK";
        }
      }
      return "BOTH POTIONS ARE MADE. THEY DO NOTHING";
    }

    function prompt() {
      if (A.playBlocked()) return "";
      if (A.getScene() === "island") {
        if (A.speedMode()) return "";
        const spot = portalSpot();
        if (A.aboard && A.aboard()) {
          const boat = A.boatPos && A.boatPos();
          if (boat && ashoreAt(boat.x, boat.y)) return "ENTER  STEP ASHORE";
          return "";
        }
        if (spot && onPortal(spot)) return "WALK INTO THE PORTAL";
        const f = feet();
        if (spot && Math.hypot(f.x - (spot.x + spot.w / 2), f.y - (spot.y + spot.h / 2)) < 48) return "THE BLUE PORTAL";
        return "";
      }
      if (!isScene()) return "";
      if (speedFrozen()) return "MOVE TO START";
      const f = feet();
      if (Math.hypot(f.x - (lockedDoor.x + 8), f.y - (lockedDoor.y + 20)) < 36) return "THIS DOOR STAYS SHUT";
      return stationPrompt(nearestStation());
    }

    function interact() {
      if (!isScene() || A.playBlocked() || speedFrozen()) return false;
      const k = nearestStation();
      if (!k) return false;
      if (k === "well") script = fillFlask();
      else if (k === "pot") script = potUse();
      else script = useSpot(k);
      return true;
    }

    function onKey(k) {
      if (!isScene() || speedFrozen()) return false;
      if (k !== "y" || A.player.dead > 0) return false;
      const f = feet();
      const p = potCenter();
      if (Math.hypot(f.x - p.x, f.y - p.y) > 60) return false;
      if (speedRun && state.recipe === "love") {
        script = "THIS RUN IS THE LOVE POTION";
        return true;
      }
      state.recipe = "clone";
      save();
      script = "CLONE POTION. FOLLOW THE LIST";
      return true;
    }

    function blockDrop(id) {
      return id === FLASK_EMPTY || id === FLASK_FULL;
    }

    function holdEnter() {
      return fillT > 0;
    }

    function isSpeedCat(cat) {
      return cat === "love_potion" || cat === "clone_potion";
    }

    function prepareSpeed(cat) {
      if (!isSpeedCat(cat)) return;
      if (!speedRun) speedHold = JSON.parse(JSON.stringify(state));
      speedRun = true;
      copyState(freshWing());
      state.recipe = cat === "love_potion" ? "love" : "clone";
      wounds = 0;
      grace = 0.6;
      script = "";
      welcomed = true;
      alertT = 0;
      bookWas = false;
      doorWas = [false, false, false, false, false, false];
      fillT = 0;
      buildGuards();
      if (A.setScene) A.setScene("salt");
      A.player.x = SPAWN.x;
      A.player.y = SPAWN.y;
      A.player.facing = 1;
      A.player.dead = 0;
      A.player.moving = false;
    }

    function endSpeed() {
      if (!speedRun) return;
      speedRun = false;
      if (speedHold) {
        copyState(speedHold);
        speedHold = null;
      }
      wounds = 0;
      script = "";
      alertT = 0;
      fillT = 0;
    }

    function arrive(sc) {
      if (sc === "salt") {
        grace = 0.9;
        welcomed = false;
      }
    }

    function respawn() {
      wounds = 0;
      grace = 0.9;
      script = "YOU WAKE IN THE CAVE";
      return { x: SPAWN.x, y: SPAWN.y };
    }

    function put(data, x, y, r, g, b) {
      x |= 0;
      y |= 0;
      if (x < 0 || y < 0 || x >= W || y >= H) return;
      const i = (y * W + x) * 4;
      data[i] = r;
      data[i + 1] = g;
      data[i + 2] = b;
      data[i + 3] = 255;
    }

    function regionAt(x, y) {
      if (inBox(x, y, shaft) || inBox(x, y, portalRoom)) return 0;
      if (inBox(x, y, court)) return 1;
      if (inBox(x, y, potion) || inBox(x, y, master)) return 2;
      if (inBox(x, y, locked)) return 3;
      return 4;
    }

    function bake() {
      canvas = document.createElement("canvas");
      canvas.width = W;
      canvas.height = H;
      const ctx = canvas.getContext("2d");
      const img = ctx.createImageData(W, H);
      const d = img.data;
      const wood = [
        [58, 36, 22],
        [48, 30, 18],
        [72, 46, 28],
        [36, 22, 14],
      ];
      const roomWood = [
        [78, 52, 32],
        [64, 42, 26],
        [92, 64, 40],
        [52, 34, 20],
      ];
      const stone = [
        [58, 62, 70],
        [48, 52, 60],
        [70, 74, 82],
        [40, 44, 52],
      ];
      const cave = [
        [32, 34, 40],
        [26, 28, 34],
        [40, 42, 48],
        [20, 22, 28],
      ];
      for (let y = 0; y < H; y++) {
        for (let x = 0; x < W; x++) {
          const g = grid[y * W + x];
          const i = (y * W + x) * 4;
          if (g === 0) {
            d[i] = 7;
            d[i + 1] = 9;
            d[i + 2] = 16;
            d[i + 3] = 255;
            continue;
          }
          const n = hash(x, y);
          if (g === 2) {
            const by = (y / 10) | 0;
            const bx = (((x + (by & 1 ? 9 : 0)) / 18) | 0);
            const mortar = y % 10 === 0 || (x + (by & 1 ? 9 : 0)) % 18 === 0;
            const col = mortar ? [18, 16, 20] : stone[(bx + by + (n % 3)) % stone.length];
            const lift = n % 9;
            d[i] = Math.min(255, col[0] + (lift > 7 ? 16 : 0));
            d[i + 1] = Math.min(255, col[1] + (lift > 7 ? 16 : 0));
            d[i + 2] = Math.min(255, col[2] + (lift > 7 ? 18 : 0));
            d[i + 3] = 255;
            continue;
          }
          if (g === 3) {
            const wave = (Math.sin(x * 0.4) * 6) | 0;
            d[i] = 18 + (n % 10);
            d[i + 1] = 36 + wave;
            d[i + 2] = 58 + (n % 16);
            d[i + 3] = 255;
            continue;
          }
          const reg = regionAt(x, y);
          if (reg === 1) {
            const tx = (x / 14) | 0;
            const ty = (y / 14) | 0;
            const crack = x % 14 === 0 || y % 14 === 0;
            const col = crack ? [28, 30, 34] : stone[(tx + ty) % stone.length];
            d[i] = col[0] + (n % 6);
            d[i + 1] = col[1] + (n % 6);
            d[i + 2] = col[2] + (n % 6);
          } else if (reg === 0 || reg === 3) {
            const board = (x / 4) | 0;
            const seam = x % 4 === 0;
            const col = seam ? [12, 12, 16] : cave[(board + (n % 3)) % cave.length];
            d[i] = col[0];
            d[i + 1] = col[1];
            d[i + 2] = col[2] + (n > 940 ? 10 : 0);
          } else {
            const palette = reg === 2 ? roomWood : wood;
            const board = (y / 3) | 0;
            const seam = y % 3 === 2;
            const col = seam ? [22, 14, 10] : palette[(board + ((n / 80) | 0)) % palette.length];
            const spec = n > 960 ? 28 : n < 40 ? -10 : 0;
            d[i] = Math.max(0, Math.min(255, col[0] + spec));
            d[i + 1] = Math.max(0, Math.min(255, col[1] + (spec > 0 ? 16 : 0)));
            d[i + 2] = Math.max(0, Math.min(255, col[2] + (spec > 0 ? 8 : 0)));
          }
          d[i + 3] = 255;
        }
      }
      windows.forEach(function (w) {
        for (let y = w.y; y < w.y + w.h; y++) {
          for (let x = w.x; x < w.x + w.w; x++) {
            const edge = x === w.x || x === w.x + w.w - 1 || y === w.y;
            put(d, x, y, edge ? 40 : 186, edge ? 48 : 206, edge ? 64 : 232);
          }
        }
      });
      paintProps(d);
      ctx.putImageData(img, 0, 0);
    }

    function blot(d, x, y, w, h, r, g, b) {
      for (let yy = 0; yy < h; yy++) {
        for (let xx = 0; xx < w; xx++) put(d, x + xx, y + yy, r, g, b);
      }
    }

    function paintProps(d) {
      const sx = spots.rose.x - 8;
      const sy = potion.y + 18;
      blot(d, sx, sy, 16, 4, 92, 64, 40);
      blot(d, sx, sy + 28, 16, 3, 72, 48, 30);
      blot(d, sx, sy + 52, 16, 3, 62, 40, 24);
      blot(d, sx - 2, sy, 3, 58, 48, 32, 20);
      blot(d, sx + 14, sy, 3, 58, 36, 24, 16);
      blot(d, spots.flask.x - 6, spots.flask.y + 4, 14, 4, 96, 68, 40);
      blot(d, spots.flask.x - 5, spots.flask.y + 8, 12, 2, 48, 32, 20);
      blot(d, spots.flask.x - 1, spots.flask.y - 8, 4, 10, 150, 176, 186);
      blot(d, spots.flask.x, spots.flask.y - 10, 2, 3, 90, 100, 110);
      const px = spots.love.x - 16;
      const py = spots.love.y - 8;
      blot(d, px + 4, py + 8, 28, 14, 42, 40, 46);
      blot(d, px + 2, py + 10, 32, 8, 58, 56, 62);
      blot(d, px + 8, py + 4, 20, 6, 28, 26, 32);
      blot(d, px + 10, py + 2, 16, 3, 70, 68, 76);
      blot(d, px + 6, py + 12, 8, 3, 90, 70, 40);
      const bx = master.x + 48;
      const by = master.y + 36;
      blot(d, bx, by + 8, 40, 16, 62, 40, 28);
      blot(d, bx - 3, by + 6, 4, 20, 48, 32, 22);
      blot(d, bx + 39, by + 6, 4, 20, 40, 26, 18);
      blot(d, bx, by + 6, 40, 4, 86, 58, 36);
      blot(d, bx + 2, by + 10, 12, 6, 210, 196, 170);
      blot(d, bx + 14, by + 12, 22, 8, 48, 62, 96);
      blot(d, bx + 14, by + 18, 22, 2, 30, 40, 64);
      columns.forEach(function (c) {
        blot(d, c.x + 2, c.y, 4, c.h, 210, 206, 190);
        blot(d, c.x + 8, c.y, 3, c.h, 90, 94, 102);
      });
      for (let a = 0; a < 12; a++) {
        const ang = (a / 12) * Math.PI * 2;
        blot(d, fountain.x + Math.cos(ang) * 24 - 1, fountain.y + Math.sin(ang) * 16 - 1, 3, 3, 150, 146, 132);
      }
      blot(d, lockedDoor.x + 2, lockedDoor.y + 4, 2, 36, 24, 24, 28);
      blot(d, lockedDoor.x + 8, lockedDoor.y + 4, 2, 36, 24, 24, 28);
      blot(d, lockedDoor.x + 2, lockedDoor.y + 14, 8, 2, 24, 24, 28);
      blot(d, lockedDoor.x + 2, lockedDoor.y + 26, 8, 2, 24, 24, 28);
      blot(d, book.x, book.y, book.w, 3, 72, 48, 28);
      blot(d, book.x, book.y + book.h - 3, book.w, 3, 48, 32, 20);
      for (let s = 0; s < 18; s++) {
        const y = shaft.y + 20 + s * 28;
        if (y > portalRoom.y) break;
        blot(d, shaft.x + 8 + (s % 2) * 10, y, shaft.w - 28, 3, 70, 66, 60);
        blot(d, shaft.x + 8 + (s % 2) * 10, y + 3, shaft.w - 28, 1, 24, 22, 26);
      }
      blot(d, RETURN.x - 16, RETURN.y - 10, 32, 20, 28, 24, 48);
      blot(d, RETURN.x - 8, RETURN.y - 4, 16, 8, 70, 50, 120);
    }

    function draw(cam) {
      if (!isScene()) return;
      A.ctx().drawImage(canvas, -cam.x | 0, -cam.y | 0);
    }

    function screen(cam, x, y) {
      return { x: (x - cam.x) | 0, y: (y - cam.y) | 0 };
    }

    function drawGuard(cam, g) {
      const s = screen(cam, g.x, g.y);
      if (s.x < -30 || s.y < -30 || s.x > A.viewW() + 30 || s.y > A.viewH() + 30) return;
      A.px(s.x - 5, s.y - 16, 10, 12, "#7e848e");
      A.px(s.x - 4, s.y - 15, 3, 8, "#a8aeb6");
      A.px(s.x - 4, s.y - 21, 8, 6, "#8e949e");
      A.px(s.x - 3, s.y - 19, 2, 2, "#1c2026");
      A.px(s.x + 1, s.y - 19, 2, 2, "#1c2026");
      A.px(s.x - 6, s.y - 12, 3, 8, "#6a7078");
      A.px(s.x + 4, s.y - 14, 2, 9, "#d5d8df");
      A.px(s.x + 3, s.y - 5, 4, 2, "#9aa0a8");
      const wx = s.x + ((Math.cos(g.beam) * 9) | 0);
      const wy = s.y - 12 + ((Math.sin(g.beam) * 5) | 0);
      A.px(wx, wy, 3, 3, "#f0e2a0");
      A.px(s.x - 3, s.y - 4, 3, 4, "#5c626a");
      A.px(s.x + 1, s.y - 4, 3, 4, "#5c626a");
    }

    function drawSleeper(cam) {
      const s = screen(cam, master.x + 62, master.y + 48);
      A.px(s.x, s.y, 16, 5, "#c4a070");
      A.px(s.x + 1, s.y - 3, 6, 4, "#e0b090");
      A.px(s.x + 2, s.y - 4, 4, 2, "#3a2418");
      const z = screen(cam, master.x + 78, master.y + 30 + ((Math.sin(A.time() * 2) * 2) | 0));
      A.drawPixText("Z", z.x, z.y, "#d7e4f2");
    }

    function drawTorch(cam, p, i) {
      const s = screen(cam, p.x, p.y);
      const flick = ((A.time() * 9 + i * 2.1) | 0) & 1;
      A.px(s.x, s.y + 4, 3, 5, "#2a1810");
      A.px(s.x - 1, s.y + 8, 5, 2, "#4a4038");
      A.px(s.x, s.y + 1, 3, 3, flick ? "#ffb04a" : "#ffe08a");
      A.px(s.x + 1, s.y + 2, 1, 1, "#fff6d0");
    }

    let basin = null;

    function courtShades() {
      const shades = [];
      for (let i = 0; i < columns.length; i++) {
        const c = columns[i];
        shades.push({ x: c.x + c.w / 2 + 1, y: c.y + c.h / 2 + 4, rx: 16, ry: 10 });
      }
      shades.push({ x: fountain.x + 2, y: fountain.y + 8, rx: 32, ry: 15 });
      const f = feet();
      if (inBox(f.x, f.y, court)) shades.push({ x: f.x, y: f.y + 1, rx: 11, ry: 6 });
      for (let i = 0; i < guards.length; i++) {
        const g = guards[i];
        if (!inBox(g.x, g.y, court)) continue;
        shades.push({ x: g.x + 1, y: g.y + 2, rx: 12, ry: 6 });
      }
      return shades;
    }

    function drawFountain(cam) {
      const R = 16;
      const S = R * 2 + 1;
      if (!basin) {
        basin = document.createElement("canvas");
        basin.width = S;
        basin.height = S;
      }
      const bctx = basin.getContext("2d");
      const img = bctx.createImageData(S, S);
      const d = img.data;
      const t = A.time();
      const drift = t * 2.6;
      for (let y = 0; y < S; y++) {
        for (let x = 0; x < S; x++) {
          const dx = x - R;
          const dy = y - R;
          const dist = Math.hypot(dx, dy);
          if (dist > R) continue;
          const ripple =
            Math.sin(dx * 0.62 + drift) +
            Math.sin(dy * 0.9 - drift * 0.85) +
            Math.sin(dist * 0.72 - drift * 1.4);
          const crest = Math.sin(dist * 0.58 - drift * 1.7);
          let r = 18;
          let g = 78;
          let b = 118;
          if (ripple > 1.25 || crest > 0.82) {
            r = 226;
            g = 250;
            b = 255;
          } else if (ripple > 0.35) {
            r = 118;
            g = 210;
            b = 236;
          } else if (ripple > -0.5) {
            r = 32;
            g = 128;
            b = 176;
          }
          if (dist > R - 2.2 && ripple < 1.1) {
            r = (r * 0.62) | 0;
            g = (g * 0.66) | 0;
            b = (b * 0.74) | 0;
          }
          const i = (y * S + x) * 4;
          d[i] = r;
          d[i + 1] = g;
          d[i + 2] = b;
          d[i + 3] = 255;
        }
      }
      bctx.putImageData(img, 0, 0);
      const s = screen(cam, fountain.x - R, fountain.y - R);
      const c = A.ctx();
      const prev = c.imageSmoothingEnabled;
      c.imageSmoothingEnabled = false;
      c.drawImage(basin, s.x, s.y);
      c.imageSmoothingEnabled = prev;
      for (let a = 0; a < 12; a++) {
        const ang = (a / 12) * Math.PI * 2;
        const stone = screen(cam, fountain.x + Math.cos(ang) * 24 - 1, fountain.y + Math.sin(ang) * 16 - 1);
        A.px(stone.x, stone.y, 3, 3, "#968c84");
      }
    }

    function drawPoolWash(cam, x, y, phase) {
      const c = A.ctx();
      const s = screen(cam, x, y);
      const pulse = 0.72 + Math.sin(A.time() * 2.5 + (phase || 0)) * 0.28;
      c.save();
      c.globalCompositeOperation = "lighter";
      const rad = 30;
      const grad = c.createRadialGradient(s.x, s.y, 3, s.x, s.y, rad);
      grad.addColorStop(0, "rgba(198, 250, 255," + (0.5 * pulse).toFixed(3) + ")");
      grad.addColorStop(0.42, "rgba(70, 186, 220," + (0.2 * pulse).toFixed(3) + ")");
      grad.addColorStop(1, "rgba(0, 0, 0, 0)");
      c.fillStyle = grad;
      c.beginPath();
      c.arc(s.x, s.y, rad, 0, Math.PI * 2);
      c.fill();
      c.restore();
    }

    function drawFountainGlints(cam) {
      const t = A.time();
      for (let i = 0; i < 3; i++) {
        const ang = t * 1.35 + i * 2.2;
        const rad = 4 + i * 3;
        const gx = fountain.x + Math.cos(ang) * rad;
        const gy = fountain.y + Math.sin(ang * 1.15) * (rad * 0.62);
        if (Math.hypot(gx - fountain.x, gy - fountain.y) > 14) continue;
        const s = screen(cam, gx, gy);
        A.px(s.x, s.y, i === 0 ? 2 : 1, 1, i === 1 ? "#9ee8ff" : "#f4feff");
      }
    }

    function drawFront(cam) {
      if (!isScene()) return;
      const t = A.time();
      if (!bookOpen()) {
        const s = screen(cam, book.x, book.y);
        A.px(s.x, s.y, book.w, book.h, "#4a3018");
        for (let i = 0; i < 5; i++) A.px(s.x + 2, s.y + 4 + i * 9, book.w - 4, 6, i % 2 ? "#7a4030" : "#2a3a58");
      }
      doors.forEach(function (d) {
        const f = feet();
        const near = Math.abs(f.x - (d.x + d.w / 2)) < 40 && Math.abs(f.y - (d.y + d.h / 2)) < 40;
        if (near) return;
        const s = screen(cam, d.x, d.y);
        A.px(s.x, s.y, d.w, d.h, "#3a2416");
        A.px(s.x + 2, s.y + 2, Math.max(2, d.w - 4), Math.max(2, d.h - 4), "#6a4630");
        A.px(s.x + (d.w > d.h ? (d.w / 2) | 0 : 2), s.y + (d.h > d.w ? (d.h / 2) | 0 : 2), 2, 2, "#e0c080");
      });
      if (roseUp()) {
        const s = screen(cam, spots.rose.x, spots.rose.y);
        A.px(s.x, s.y, 2, 6, "#2a4a28");
        A.px(s.x - 2, s.y - 3, 3, 3, "#a02838");
        A.px(s.x + 2, s.y - 2, 3, 3, "#c43848");
      }
      if (chaiUp()) {
        const s = screen(cam, spots.chai.x, spots.chai.y);
        A.px(s.x, s.y, 2, 5, "#2a4a28");
        A.px(s.x - 3, s.y - 1, 3, 2, "#3e8a40");
        A.px(s.x + 2, s.y - 2, 3, 2, "#5aaa52");
        A.px(s.x - 1, s.y - 4, 3, 2, "#2e6a32");
      }
      if (!A.holding(FLASK_EMPTY) && !A.holding(FLASK_FULL)) {
        const s = screen(cam, spots.flask.x, spots.flask.y - 8);
        A.px(s.x, s.y, 4, 8, "#b7d0d4");
        A.px(s.x + 1, s.y + 3, 2, 3, "#7eb8c4");
      }
      const bub = screen(cam, spots.love.x, spots.love.y - 6 + ((Math.sin(t * 4) * 2) | 0));
      A.px(bub.x, bub.y, 2, 2, "#d8c878");
      A.px(bub.x + 6, bub.y + 2, 2, 2, "#8ec8a0");
      drawSleeper(cam);
      const portal = screen(cam, RETURN.x, RETURN.y + ((Math.sin(t * 3) * 1) | 0));
      A.px(portal.x - 5, portal.y - 3, 10, 7, "#7ad4f0");
      A.px(portal.x - 3, portal.y - 2, 6, 4, "#e8fbff");
      A.px(portal.x - 1, portal.y - 1, 2, 2, "#ffffff");
      for (let i = 0; i < guards.length; i++) drawGuard(cam, guards[i]);
      drawFountain(cam);
      const rays = moonRays();
      for (let i = 0; i < guards.length; i++) rays.push(wandRay(guards[i]));
      if (A.light) {
        A.light(cam, {
          rays: rays,
          torches: TORCHES,
          court: court,
          shades: courtShades(),
          glow: { x: fountain.x, y: fountain.y - 1, r: 48, pulse: 0.78 + Math.sin(t * 2.5) * 0.22 },
          portal: { x: RETURN.x, y: RETURN.y, r: 48, pulse: 0.78 + Math.sin(t * 2.5 + 1.4) * 0.22 },
        });
      }
      drawPoolWash(cam, fountain.x, fountain.y, 0);
      drawPoolWash(cam, RETURN.x, RETURN.y, 1.4);
      drawFountainGlints(cam);
      for (let i = 0; i < TORCHES.length; i++) drawTorch(cam, TORCHES[i], i);
      for (let i = 0; i < guards.length; i++) {
        const g = guards[i];
        const s = screen(cam, g.x, g.y);
        const wx = s.x + ((Math.cos(g.beam) * 9) | 0);
        const wy = s.y - 12 + ((Math.sin(g.beam) * 5) | 0);
        A.px(wx, wy, 3, 3, "#fff6c8");
      }
    }

    function drawCheckLine(x, y, w, done, label) {
      A.px(x, y, w, 11, "#141820");
      A.drawPixText((done ? "X  " : "-  ") + label, x + 4, y + 2, done ? "#9dcc8a" : "#f3e2c4");
    }

    function drawHud() {
      if (!isScene()) return;
      const f = feet();
      const name = roomName(f);
      const lw = name.length * 6 + 10;
      A.px(8, 6, lw, 12, "#141820");
      A.drawPixText(name, 12, 8, "#d5e4f8");
      if (!state.recipe) {
        const hint = "POT  T LOVE   Y CLONE";
        A.px(8, 20, hint.length * 6 + 8, 11, "#1a140e");
        A.drawPixText(hint, 12, 22, "#e8c44a");
      } else {
        const title = state.recipe === "love" ? "LOVE POTION" : "CLONE POTION";
        const rows =
          state.recipe === "love"
            ? [
                [state.lovePetals || state.loveDone, "ROSE PETALS"],
                [state.loveWater >= 3 || state.loveDone, "WATER " + state.loveWater + "/3"],
              ]
            : [
                [state.cloneHair || state.cloneDone, "HAIR"],
                [state.cloneChai >= 3 || state.cloneDone, "CHAI " + state.cloneChai + "/3"],
                [state.cloneWater >= 2 || state.cloneDone, "WATER " + state.cloneWater + "/2"],
              ];
        let wide = title.length;
        for (let i = 0; i < rows.length; i++) wide = Math.max(wide, rows[i][1].length + 3);
        const boxW = wide * 6 + 12;
        const x = Math.max(8, A.uiW() - boxW - 8);
        A.px(x, 6, boxW, 12, "#241808");
        A.drawPixText(title, x + 4, 8, "#e8c44a");
        for (let i = 0; i < rows.length; i++) drawCheckLine(x, 20 + i * 13, boxW, rows[i][0], rows[i][1]);
      }
      if (!script) return;
      const uiW = A.uiW();
      const uiH = A.uiH();
      const bw = Math.min(uiW - 16, script.length * 6 + 16);
      const x = ((uiW - bw) / 2) | 0;
      const y = uiH - 78;
      A.px(x, y, bw, 16, "#1a140e");
      A.px(x + 1, y + 1, bw - 2, 14, "#2a241c");
      A.drawPixText(script, x + 6, y + 4, "#f3e2c4");
    }

    function drawGate(cam) {
      if (A.getScene() !== "island" || !cam) return;
      const isle = isleRect();
      if (!isle) return;
      const t = A.time();
      const rx = isle.w / 2;
      const ry = isle.h / 2;
      for (let y = 0; y < isle.h; y++) {
        for (let x = 0; x < isle.w; x++) {
          const nx = (x + 0.5 - rx) / rx;
          const ny = (y + 0.5 - ry) / ry;
          const jag = ((hash(isle.x + x, isle.y + y) % 100) - 50) / 380;
          const d = nx * nx + ny * ny + jag;
          if (d > 1.02) continue;
          const n = hash(isle.x + x * 3, isle.y + y * 5) % 9;
          const wet = d > 0.78;
          const col = wet ? (n > 4 ? "#5c4a34" : "#4a3c2c") : n > 6 ? "#e4c890" : n > 3 ? "#c9a66c" : "#b08a52";
          const s = screen(cam, isle.x + x, isle.y + y);
          A.px(s.x, s.y, 1, 1, col);
        }
      }
      if (A.speedMode()) return;
      const spot = portalSpot();
      const cx = spot.x + spot.w / 2;
      const cy = spot.y + 12;
      const prx = 7;
      const pry = 10;
      const pulse = 0.55 + 0.45 * Math.sin(t * 2.6);
      const spin = t * 1.35;
      const c = A.ctx();
      c.save();
      for (let d = 4; d >= 0; d--) {
        const u = d / 4;
        const erx = prx * (0.3 + u * 0.7);
        const ery = pry * (0.3 + u * 0.7);
        c.globalAlpha = 0.2 + (1 - u) * 0.35 * pulse;
        const col = d === 0 ? "#eef3ff" : d < 2 ? "#9bb6ff" : "#3d6bff";
        for (let a = 0; a < 28; a++) {
          const ang = (a / 28) * Math.PI * 2 + spin * (0.2 + (1 - u) * 0.4);
          const s = screen(cam, cx + Math.cos(ang) * erx, cy + Math.sin(ang) * ery);
          A.px(s.x, s.y, 1, 1, col);
        }
      }
      c.globalAlpha = 0.8;
      const core = screen(cam, cx - 1, cy - 1);
      A.px(core.x, core.y, 3, 3, "#f4f7ff");
      for (let i = 0; i < 16; i++) {
        const ang = spin * 1.7 + (i / 16) * Math.PI * 2;
        const s = screen(cam, cx + Math.cos(ang) * prx * 0.92, cy + Math.sin(ang) * pry * 0.92);
        c.globalAlpha = 0.45 + 0.45 * Math.sin(t * 5 + i);
        A.px(s.x, s.y, i % 3 === 0 ? 2 : 1, 1, i & 1 ? "#ffffff" : "#5a86ff");
      }
      c.restore();
    }

    buildGrid();
    buildNav();
    buildGuards();
    bake();

    return {
      isScene: isScene,
      worldW: function () {
        return W;
      },
      worldH: function () {
        return H;
      },
      solid: solid,
      moveMul: function () {
        const f = feet();
        const x = f.x | 0;
        const y = f.y | 0;
        if (x < 0 || y < 0 || x >= W || y >= H) return 1;
        return grid[y * W + x] === 3 ? 0.5 : 1;
      },
      blocksMove: function () {
        return false;
      },
      update: update,
      prompt: prompt,
      interact: interact,
      onKey: onKey,
      holdEnter: holdEnter,
      blockDrop: blockDrop,
      arrive: arrive,
      draw: draw,
      drawFront: drawFront,
      drawHud: drawHud,
      drawGate: drawGate,
      ashoreAt: ashoreAt,
      respawn: respawn,
      isSpeedCat: isSpeedCat,
      inSpeed: function () {
        return speedRun;
      },
      prepareSpeed: prepareSpeed,
      endSpeed: endSpeed,
    };
  }

  window.IsleSaltBuild = IsleSaltBuild;
})();
