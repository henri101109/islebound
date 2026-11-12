/**
 * Rome — city beyond the river-ruins portal, and the king's 1500m.
 * Loaded before game.js. Installed via IsleRomeBuild(api).
 *
 * The timed racing line is exactly 1500m. At the island walk speed (165 px/s)
 * that line is 3:29.89. The animal pocket is extra track: the clock pauses
 * while the gate is shut and starts again when it opens, so a perfect run
 * that reaches the gate during the pause does not pay for that stretch.
 */
(function (global) {
  "use strict";

  const RUN = 165;
  const TARGET = 209.89;
  const METERS = 1500;
  const PX_PER_M = (RUN * TARGET) / METERS;

  const CITY_W = 2100;
  const CITY_H = 3480;
  const STREET_X = 820;
  const STREET_W = 320;
  const PALACE_W = 1280;
  const PALACE_H = 880;
  const BARRACKS_W = 560;
  const BARRACKS_H = 360;

  const SCENES = { rome: 1, palace: 1, barracks: 1, race: 1 };

  const TOGA = ["#f4efe4", "#e8dcc8", "#c45a48", "#f2f2ea", "#d8c4a0", "#8a3038", "#efe6c8", "#6a4430"];
  const TALK = [
    "HAIL THE KING",
    "RACES AT DAWN",
    "FRESH OLIVES",
    "TWENTY RUNNERS",
    "MIND THE LAVA",
    "THE GATE SHUTS",
    "BUY THE WINE",
    "CROWD IS LOUD",
  ];

  const RUNNERS = [
    { name: "MARCUS", skill: 0.997, lat: 10, nerve: 0.97 },
    { name: "LUCIUS", skill: 0.995, lat: 14, nerve: 0.95 },
    { name: "QUINTUS", skill: 0.993, lat: 18, nerve: 0.93 },
    { name: "GAIUS", skill: 0.99, lat: 22, nerve: 0.91 },
    { name: "TITUS", skill: 0.988, lat: 24, nerve: 0.66 },
    { name: "DECIMUS", skill: 0.986, lat: 28, nerve: 0.62 },
    { name: "AULUS", skill: 0.985, lat: 18, nerve: 0.64 },
    { name: "SERVIUS", skill: 0.984, lat: 32, nerve: 0.6 },
    { name: "APPIUS", skill: 0.983, lat: 22, nerve: 0.63 },
    { name: "BRUTUS", skill: 0.982, lat: -6, nerve: 0.55 },
    { name: "CASSIUS", skill: 0.981, lat: 36, nerve: 0.58 },
    { name: "FLAVIUS", skill: 0.98, lat: 26, nerve: 0.61 },
    { name: "OCTAVIUS", skill: 0.979, lat: 40, nerve: 0.52 },
    { name: "PUBLIUS", skill: 0.978, lat: 30, nerve: 0.57 },
    { name: "SEXTUS", skill: 0.977, lat: 44, nerve: 0.5 },
    { name: "TIBERIUS", skill: 0.982, lat: 20, nerve: 0.65 },
    { name: "VIBIUS", skill: 0.981, lat: 34, nerve: 0.56 },
    { name: "HOSTUS", skill: 0.98, lat: 16, nerve: 0.6 },
    { name: "MANIUS", skill: 0.979, lat: 38, nerve: 0.54 },
    { name: "SPURIUS", skill: 0.978, lat: 46, nerve: 0.48 },
  ];

  const KING_LINES = [
    "HAIL. I AM KING OF THIS CITY.",
    "YOU CAME THROUGH THE OLD GATE.",
    "RULE MY KINGDOM. BEAT MY RUNNERS.",
    "FIFTEEN HUNDRED METERS. TWENTY OF THEM.",
    "THE CROWD WILL NOT BE KIND.",
    "GO. THE LINE IS OPEN.",
  ];

  const WIN_LINES = [
    "THE EMPIRE IS WATCHING.",
    "YOU ARE FIRST ACROSS THE LINE.",
    "THE KING SETS THE CROWN UPON YOU.",
    "THE KINGDOM IS YOURS.",
  ];

  function IsleRomeBuild(A) {
    const course = buildCourse();
    const city = buildCity();
    const palace = buildPalace();
    const barracks = buildBarracks();

    let phase = "city";
    let script = null;
    let sleepT = 0;
    let ceremonyT = 0;
    let runDead = false;
    let crowned = false;
    let tip = "";
    let tipT = 0;

    let runners = [];
    let animals = [];
    let shots = [];
    let animalsOut = false;
    let gateOpen = false;
    let eliminated = false;
    let raceT = 0;
    let pauseRace = false;
    let finishLock = false;
    let shotMark = -1;
    let loseReason = "";
    let animalT = 0;
    let cullAt = 0;

    function speedRome() {
      if (!(A.speedMode && A.speedMode())) return false;
      const cat = A.speedCat ? A.speedCat() : "";
      return cat === "kings_race" || cat === "full_kings";
    }

    function flash(msg) {
      tip = String(msg || "").toUpperCase();
      tipT = 2.4;
    }

    function isScene(s) {
      return !!SCENES[s || A.getScene()];
    }

    function worldSize() {
      const s = A.getScene();
      if (s === "race") return { w: course.w, h: course.h };
      if (s === "palace") return { w: PALACE_W, h: PALACE_H };
      if (s === "barracks") return { w: BARRACKS_W, h: BARRACKS_H };
      return { w: CITY_W, h: CITY_H };
    }

    function placePlayer(x, y) {
      const p = A.player;
      p.x = (x - p.w / 2) | 0;
      p.y = (y - p.h / 2) | 0;
      p.aboard = false;
      p.dead = 0;
      p.hurt = 0;
      p.inWater = false;
      p.facing = 1;
      if (A.snapCam) A.snapCam();
    }

    function feet() {
      const p = A.player;
      return { x: p.x + p.w / 2, y: p.y + p.h - 3 };
    }

    function hitRect(x, y, r) {
      return x >= r.x && x < r.x + r.w && y >= r.y && y < r.y + r.h;
    }

    function sampleAt(s) {
      const S = course.samples;
      let lo = 0;
      let hi = S.length - 1;
      while (lo < hi) {
        const mid = (lo + hi) >> 1;
        if (S[mid].s < s) lo = mid + 1;
        else hi = mid;
      }
      const i = Math.max(0, lo - 1);
      const a = S[i];
      const b = S[Math.min(S.length - 1, i + 1)];
      const span = b.s - a.s || 1;
      const u = Math.max(0, Math.min(1, (s - a.s) / span));
      return {
        x: a.x + (b.x - a.x) * u,
        y: a.y + (b.y - a.y) * u,
        nx: a.nx,
        ny: a.ny,
        tx: a.tx,
        ty: a.ty,
        half: a.half + (b.half - a.half) * u,
        s: s,
        monster: s >= course.monsterStart && s < course.monsterEnd,
      };
    }

    function project(x, y) {
      const S = course.samples;
      let best = 0;
      let bestD = 1e18;
      const step = 8;
      for (let i = 0; i < S.length; i += step) {
        const dx = x - S[i].x;
        const dy = y - S[i].y;
        const d = dx * dx + dy * dy;
        if (d < bestD) {
          bestD = d;
          best = i;
        }
      }
      const a0 = Math.max(0, best - step - 1);
      const b0 = Math.min(S.length - 1, best + step + 1);
      for (let i = a0; i <= b0; i++) {
        const dx = x - S[i].x;
        const dy = y - S[i].y;
        const d = dx * dx + dy * dy;
        if (d < bestD) {
          bestD = d;
          best = i;
        }
      }
      const p = S[best];
      const dx = x - p.x;
      const dy = y - p.y;
      return {
        s: p.s,
        lat: dx * p.nx + dy * p.ny,
        half: p.half,
        x: p.x,
        y: p.y,
        nx: p.nx,
        ny: p.ny,
        tx: p.tx,
        ty: p.ty,
        monster: p.monster,
      };
    }

    function lavaAt(x, y) {
      return lavaHit(x, y, course.lava);
    }

    function gateBlocks(x, y) {
      if (gateOpen || A.getScene() !== "race") return false;
      const g = course.gate;
      const dx = x - g.x;
      const dy = y - g.y;
      const along = dx * g.tx + dy * g.ty;
      const lat = dx * g.nx + dy * g.ny;
      return Math.abs(along) < 9 && Math.abs(lat) < g.half + 8;
    }

    function raceSolid(x, y) {
      if (x < 4 || y < 4 || x >= course.w - 4 || y >= course.h - 4) return true;
      const q = project(x, y);
      if (Math.abs(q.lat) > q.half - 3) return true;
      if (gateBlocks(x, y)) return true;
      for (let i = 0; i < course.hay.length; i++) {
        const h = course.hay[i];
        if (x > h.x && x < h.x + h.w && y > h.y && y < h.y + h.h) return true;
      }
      for (let i = 0; i < course.columns.length; i++) {
        const c = course.columns[i];
        const dx = x - c.x;
        const dy = y - c.y;
        if (dx * dx + dy * dy < c.r * c.r) return true;
      }
      return false;
    }

    function citySolid(x, y) {
      if (x < 10 || y < 10 || x >= CITY_W - 10 || y >= CITY_H - 10) return true;
      for (let i = 0; i < city.blocks.length; i++) {
        if (hitRect(x, y, city.blocks[i])) return true;
      }
      for (let i = 0; i < city.stalls.length; i++) {
        if (hitRect(x, y, city.stalls[i].solid)) return true;
      }
      if (hitRect(x, y, city.palaceSolid) && !hitRect(x, y, city.palaceDoor)) return true;
      return false;
    }

    function palaceSolid(x, y) {
      if (x < 8 || y < 8 || x >= PALACE_W - 8 || y >= PALACE_H - 8) return true;
      for (let i = 0; i < palace.solids.length; i++) {
        if (hitRect(x, y, palace.solids[i])) return true;
      }
      return false;
    }

    function barracksSolid(x, y) {
      if (x < 8 || y < 8 || x >= BARRACKS_W - 8 || y >= BARRACKS_H - 8) return true;
      for (let i = 0; i < barracks.solids.length; i++) {
        if (hitRect(x, y, barracks.solids[i])) return true;
      }
      return false;
    }

    function solid(x, y) {
      const s = A.getScene();
      if (s === "race") return raceSolid(x, y);
      if (s === "palace") return palaceSolid(x, y);
      if (s === "barracks") return barracksSolid(x, y);
      if (s === "rome") return citySolid(x, y);
      return false;
    }

    function inWater(x, y) {
      if (A.getScene() !== "race") return false;
      const q = project(x, y);
      if (q.s < course.waterS0 || q.s > course.waterS1) return false;
      return Math.abs(q.lat) > 22;
    }

    function blocksMove() {
      return phase === "talk" || phase === "sleep" || phase === "ceremony";
    }

    function moveMul() {
      if (A.getScene() === "rome") {
        const f = feet();
        const crowd = city.crowdAt(f.x, f.y, A.time());
        if (crowd) return 0.8;
        return 1;
      }
      if (A.getScene() !== "race" || eliminated) return 1;
      const p = A.player;
      if (p.romeStun > 0) return 0;
      let m = 1;
      if (p.romeSlow > 0) m = 0.56;
      if (inWater(p.x + p.w / 2, p.y + p.h - 3)) m = Math.min(m, 0.62);
      return m;
    }

    function aliveCount() {
      let n = eliminated ? 0 : 1;
      for (let i = 0; i < runners.length; i++) if (!runners[i].out && !runners[i].done) n++;
      return n;
    }

    function beginRunners() {
      runners = [];
      const p0 = sampleAt(0);
      const sign = course.outsideSign;
      for (let i = 0; i < RUNNERS.length; i++) {
        const def = RUNNERS[i];
        const lat = sign * def.lat;
        runners.push({
          name: def.name,
          skill: def.skill,
          want: lat,
          nerve: def.nerve,
          elite: def.nerve >= 0.9,
          x: p0.x + p0.nx * lat,
          y: p0.y + p0.ny * lat,
          s: 0,
          lat: lat,
          out: false,
          done: false,
          slow: 0,
          stun: 0,
          col: def.nerve >= 0.9 ? "#8a2428" : TOGA[i % TOGA.length],
        });
      }
      animals = [];
      shots = [];
      animalsOut = false;
      gateOpen = false;
      eliminated = false;
      finishLock = false;
      pauseRace = false;
      raceT = 0;
      shotMark = -1;
      loseReason = "";
      animalT = 0;
      cullAt = 0;
      A.player.romeSlow = 0;
      A.player.romeStun = 0;
      if (speedRome() && A.setSpeedPaused) A.setSpeedPaused(false);
    }

    function spawnAnimals() {
      animals = [];
      const mouths = course.tunnels;
      for (let i = 0; i < 8; i++) {
        const m = mouths[i % mouths.length];
        animals.push({
          x: m.x + ((i % 3) - 1) * 8,
          y: m.y + ((i % 2) - 0.5) * 10,
          ang: Math.atan2(m.ty, m.tx),
          phase: "chase",
          t: i * 0.18,
          lungex: 0,
          lungey: 0,
          kind: i % 2 ? "boar" : "lion",
        });
      }
    }

    function startTalk() {
      phase = "talk";
      script = { lines: KING_LINES, i: 0, t: 0, next: "line" };
    }

    function startSleep(kind) {
      phase = "sleep";
      sleepT = 0;
      script = {
        lines: kind === "again" ? ["ANOTHER DAY.", "THE KING WAITS AT THE LINE."] : ["YOU SLEEP.", "DAWN COMES OVER THE CITY."],
        i: 0,
        t: 0,
        next: "morning",
      };
    }

    function startCeremony() {
      phase = "ceremony";
      ceremonyT = 0;
      script = { lines: WIN_LINES, i: 0, t: 0, next: "crown" };
      if (A.grantCrown) A.grantCrown();
      crowned = true;
    }

    function loseRace(reason) {
      if (phase === "lost" || phase === "ceremony" || eliminated) return;
      eliminated = true;
      loseReason = reason || "FALL";
      phase = "lost";
      pauseRace = false;
      if (speedRome() && A.setSpeedPaused) A.setSpeedPaused(false);
      if (speedRome() && A.freezeSpeed) A.freezeSpeed();
      if (speedRome()) runDead = true;
      script = {
        lines:
          reason === "OUTRUN"
            ? ["A KINGS RUNNER TAKES THE DAY.", "BACK TO THE LINE."]
            : reason === "BEAST"
              ? ["THE BEASTS TAKE YOU.", "BACK TO THE LINE."]
              : ["THE LAVA TAKES YOU.", "BACK TO THE LINE."],
        i: 0,
        t: 0,
        next: "line",
      };
    }

    function winRace() {
      if (finishLock || eliminated) return;
      finishLock = true;
      pauseRace = false;
      if (speedRome() && A.setSpeedPaused) A.setSpeedPaused(false);
      if (speedRome() && A.freezeSpeed) A.freezeSpeed();
      if (A.commitSegment) A.commitSegment(Math.round(raceT * 1000));
      startCeremony();
    }

    function goLine() {
      script = null;
      phase = "staged";
      A.fade("race", { x: 0, y: 0 });
    }

    function goBed(again) {
      script = null;
      phase = again ? "lost" : "city";
      A.fade("barracks", { x: (BARRACKS_W / 2 - 4) | 0, y: BARRACKS_H - 64 });
    }

    function onEnter(sc) {
      if (sc === "rome") {
        if (!crowned && phase !== "talk") phase = "city";
      } else if (sc === "palace") {
        if (!crowned) startTalk();
        else phase = "crowned";
      } else if (sc === "barracks") {
        A.setScene("race");
        beginRunners();
        phase = "staged";
        const bedLine = sampleAt(0);
        placePlayer(bedLine.x, bedLine.y);
      } else if (sc === "race") {
        beginRunners();
        phase = "staged";
        const p = sampleAt(0);
        placePlayer(p.x, p.y);
      }
    }

    function prepareSpeed(cat) {
      runDead = false;
      crowned = false;
      loseReason = "";
      script = null;
      if (A.setSpeedPaused) A.setSpeedPaused(false);
      if (cat === "kings_race") {
        A.setScene("race");
        beginRunners();
        phase = "staged";
        const p = sampleAt(0);
        placePlayer(p.x, p.y);
        return;
      }
      if (cat === "full_kings") {
        // Fresh island. The run has to reach the portal on its own.
        phase = "city";
        crowned = false;
        runDead = false;
      }
    }

    function isSpeedCat(cat) {
      return cat === "kings_race" || cat === "full_kings";
    }

    function advanceScript() {
      if (!script) return;
      script.i += 1;
      script.t = 0;
      if (script.i < script.lines.length) return;
      const next = script.next;
      script = null;
      if (next === "line") goLine();
      else if (next === "bed") goBed(false);
      else if (next === "bedlose") goBed(true);
      else if (next === "morning") phase = "barracks";
      else if (next === "crown") endCeremony();
    }

    function endCeremony() {
      phase = "crowned";
      script = null;
      if (speedRome()) {
        if (A.finishSpeed) A.finishSpeed();
        return;
      }
      if (A.openSegmentFinish) A.openSegmentFinish();
    }

    function buy(stall) {
      if (!A.spend || !A.giveItem) return;
      if (!A.spend(stall.price)) {
        flash("NEED " + stall.price + " COINS");
        return;
      }
      if (!A.giveItem(stall.item)) {
        if (A.refund) A.refund(stall.price);
        flash("CAN'T HOLD MORE");
        return;
      }
      flash(stall.label);
    }

    function nearStall() {
      if (A.getScene() !== "rome") return null;
      const f = feet();
      let best = null;
      let bestD = 28;
      for (let i = 0; i < city.stalls.length; i++) {
        const s = city.stalls[i];
        const dx = f.x - (s.x + 10);
        const dy = f.y - (s.y + 8);
        const d = Math.hypot(dx, dy);
        if (d < bestD) {
          bestD = d;
          best = s;
        }
      }
      return best;
    }

    function nearDealer() {
      if (A.getScene() !== "rome") return null;
      const f = feet();
      let best = null;
      let bestD = 30;
      for (let i = 0; i < city.dealers.length; i++) {
        const d = city.dealers[i];
        const dist = Math.hypot(f.x - (d.x + 4), f.y - (d.y + 12));
        if (dist < bestD) {
          bestD = dist;
          best = d;
        }
      }
      return best;
    }

    function onKey(k) {
      if (!isScene()) return false;
      if (script && (k === "enter" || k === " ")) {
        if (phase === "talk" || phase === "ceremony" || phase === "lost") {
          advanceScript();
          return true;
        }
      }
      if (k === "t" && phase === "city") {
        const stall = nearStall();
        if (stall) {
          buy(stall);
          return true;
        }
        const dealer = nearDealer();
        if (dealer) {
          buy(dealer);
          return true;
        }
      }
      return false;
    }

    function updateDoors() {
      if (A.fading && A.fading()) return;
      if (blocksMove()) return;
      const p = A.player;
      const box = { x: p.x, y: p.y, w: p.w, h: p.h };
      function hits(r) {
        return box.x < r.x + r.w && box.x + box.w > r.x && box.y < r.y + r.h && box.y + box.h > r.y;
      }
      const sc = A.getScene();
      if (sc === "rome" && phase === "city") {
        if (hits(city.portal)) {
          if (A.speedMode && A.speedMode() && A.speedCat && A.speedCat() === "full_kings") {
            flash("THE KING IS WAITING");
            return;
          }
          const back = A.islandReturn ? A.islandReturn() : { x: 80, y: 80 };
          A.fade("island", back);
          return;
        }
        if (hits(city.palaceDoor)) {
          // Stand in front of the throne so the crowned king is on screen.
          A.fade("palace", { x: (PALACE_W / 2 - 4) | 0, y: 146 });
        }
      } else if (sc === "palace" && (phase === "crowned" || crowned) && hits(palace.exit)) {
        A.fade("rome", { x: city.palaceDoor.x + 8, y: city.palaceDoor.y + 28 });
      } else if (sc === "barracks" && phase === "barracks" && hits(barracks.door)) {
        if (runDead) {
          flash("R RESETS THE RUN");
          return;
        }
        loseReason = "";
        A.fade("race", { x: 0, y: 0 });
      }
    }

    function updateScript(dt) {
      if (!script) return;
      script.t += dt;
      const wait = phase === "sleep" ? 1.15 : phase === "ceremony" ? 1.35 : 1.7;
      if (phase !== "talk" && phase !== "lost") {
        if (script.t > wait) advanceScript();
      } else if (script.t > 2.15) {
        advanceScript();
      }
    }

    function updateRace(dt) {
      const p = A.player;
      if (p.romeSlow > 0) p.romeSlow = Math.max(0, p.romeSlow - dt);
      if (p.romeStun > 0) p.romeStun = Math.max(0, p.romeStun - dt);

      if (phase === "staged") {
        if (runDead) return;
        const cat = A.speedCat ? A.speedCat() : "";
        if (cat === "kings_race" && A.speedLive && A.speedLive()) phase = "racing";
        else if (p.moving && cat !== "kings_race") phase = "racing";
      }
      if (phase !== "racing" && phase !== "ceremony") return;

      if (phase === "racing" && !pauseRace) raceT += dt;

      const pf = feet();
      const pq = project(pf.x, pf.y);
      if (!eliminated && lavaAt(pf.x, pf.y)) {
        loseRace("LAVA");
        return;
      }

      // Shots along the approach. The center corridor is left clean.
      if (phase === "racing") {
        const mark = (raceT / 0.48) | 0;
        if (mark !== shotMark && mark > 0) {
          shotMark = mark;
          const stands = course.stands;
          for (let i = 0; i < stands.length; i++) {
            if (((mark + i * 3) % 4) !== 0) continue;
            const st = stands[i];
            const side = ((mark + i) & 1) ? 1 : -1;
            const mag = 48 + ((mark * 17 + i * 13) % 110);
            const lat = side * mag;
            const s = course.standS0 + ((mark * 37 + i * 53) % Math.max(1, (course.standS1 - course.standS0) | 0));
            const aim = sampleAt(Math.max(course.standS0, Math.min(course.standS1, s)));
            shots.push({
              x: st.x,
              y: st.y,
              tx: aim.x + aim.nx * lat,
              ty: aim.y + aim.ny * lat,
              t: 0,
              life: 0.72,
              kind: (mark + i) & 1 ? "cracker" : "tomato",
              boom: false,
            });
          }
        }
      }

      for (let i = shots.length - 1; i >= 0; i--) {
        const s = shots[i];
        s.t += dt;
        if (s.t >= s.life && !s.boom) {
          s.boom = true;
          const hitR = 12;
          if (!eliminated && Math.hypot(pf.x - s.tx, pf.y - s.ty) < hitR) {
            if (s.kind === "cracker") {
              p.romeStun = Math.max(p.romeStun || 0, 0.32);
              p.romeSlow = Math.max(p.romeSlow || 0, 0.45);
              if (A.shake) A.shake(3);
            } else {
              p.romeSlow = Math.max(p.romeSlow || 0, 0.9);
            }
          }
          for (let r = 0; r < runners.length; r++) {
            const rn = runners[r];
            if (rn.out) continue;
            if (Math.hypot(rn.x - s.tx, rn.y - s.ty) < hitR) {
              if (s.kind === "cracker") rn.stun = Math.max(rn.stun, 0.28);
              rn.slow = Math.max(rn.slow, 0.85);
            }
          }
        }
        if (s.t > s.life + 0.28) shots.splice(i, 1);
      }

      const gateS = course.monsterEnd;
      for (let i = 0; i < runners.length; i++) {
        const rn = runners[i];
        if (rn.out || rn.done) continue;
        if (rn.slow > 0) rn.slow -= dt;
        if (rn.stun > 0) rn.stun -= dt;
        const here = project(rn.x, rn.y);
        rn.s = here.s;
        rn.lat = here.lat;
        if (lavaAt(rn.x, rn.y)) {
          rn.out = true;
          continue;
        }
        if (rn.s >= course.finishS - 4) {
          rn.done = true;
          continue;
        }
        if (rn.stun > 0) continue;
        let want = rn.want;
        // The pack takes the dry ford. Elites already run that line.
        const wet = sampleAt(Math.min(course.finishS, rn.s + 48));
        if (!rn.elite && wet.s >= course.waterS0 && wet.s <= course.waterS1 + 30 && Math.abs(want) > 16) {
          want *= 0.25;
        }
        const lim = here.half - 16;
        if (want > lim) want = lim;
        if (want < -lim) want = -lim;
        // Stay off the lava. outsideSign points to the safe side.
        const probe = sampleAt(Math.min(course.finishS, rn.s + 16));
        const inward = course.lavaSign;
        for (let n = 0; n < 3; n++) {
          const x = probe.x + probe.nx * want;
          const y = probe.y + probe.ny * want;
          if (!lavaAt(x, y)) break;
          want -= inward * 12;
        }
        if (animalsOut && rn.s >= course.monsterStart - 20) {
          let nearest = null;
          let nd = 1e9;
          for (let a = 0; a < animals.length; a++) {
            const d = Math.hypot(animals[a].x - rn.x, animals[a].y - rn.y);
            if (d < nd) {
              nd = d;
              nearest = animals[a];
            }
          }
          if (nearest && nd < 70) {
            const away = project(rn.x, rn.y);
            const lx = nearest.x - rn.x;
            const ly = nearest.y - rn.y;
            const side = lx * away.nx + ly * away.ny;
            const dodge = rn.elite ? 46 : 24;
            want += side > 0 ? -dodge : dodge;
          }
        }
        const cap = gateOpen ? course.finishS : Math.min(course.finishS, gateS - 14);
        const look = sampleAt(Math.max(0, Math.min(cap, rn.s + 26)));
        const tx = look.x + look.nx * want;
        const ty = look.y + look.ny * want;
        const dx = tx - rn.x;
        const dy = ty - rn.y;
        const dist = Math.hypot(dx, dy) || 1;
        let sp = RUN * rn.skill;
        if (rn.slow > 0) sp *= 0.58;
        const wq = project(rn.x, rn.y);
        if (wq.s >= course.waterS0 && wq.s <= course.waterS1 && Math.abs(wq.lat) > 22) sp *= 0.62;
        if (!gateOpen && rn.s > gateS - 18) sp *= 0.15;
        rn.x += (dx / dist) * sp * dt;
        rn.y += (dy / dist) * sp * dt;
      }

      const count = aliveCount();
      const someoneIn =
        (!eliminated && pq.s >= course.monsterStart) ||
        runners.some((rn) => !rn.out && rn.s >= course.monsterStart);
      if (!gateOpen && count <= 5) {
        gateOpen = true;
        animalsOut = false;
        animals = [];
      } else if (!animalsOut && count > 5 && someoneIn && phase === "racing") {
        animalsOut = true;
        spawnAnimals();
      }
      const shouldPause = phase === "racing" && animalsOut && !gateOpen;
      if (shouldPause !== pauseRace) {
        pauseRace = shouldPause;
        if (speedRome() && A.setSpeedPaused) A.setSpeedPaused(shouldPause);
      }

      if (animalsOut) updateAnimals(dt);

      if (animalsOut && !gateOpen) {
        animalT += dt;
        // If the beasts stall on the pack, take the weakest non-elite so the gate can open.
        if (animalT > 14 && animalT - cullAt > 1.5) {
          cullAt = animalT;
          let weak = null;
          for (let i = 0; i < runners.length; i++) {
            const rn = runners[i];
            if (rn.out || rn.elite) continue;
            if (!weak || rn.nerve < weak.nerve) weak = rn;
          }
          if (weak) weak.out = true;
        }
      }

      if (phase === "racing" && !finishLock && !eliminated) {
        let best = -1e9;
        for (let i = 0; i < runners.length; i++) {
          if (runners[i].out) continue;
          if (runners[i].done || runners[i].s >= course.finishS - 4) best = Math.max(best, runners[i].s);
        }
        if (pq.s >= course.finishS - 6 && pq.s + 2 >= best) winRace();
        else if (best >= course.finishS - 4) loseRace("OUTRUN");
      }
    }

    function updateAnimals(dt) {
      const pf = feet();
      const targets = [];
      if (!eliminated) {
        const q = project(pf.x, pf.y);
        if (q.s >= course.monsterStart - 30) targets.push({ x: pf.x, y: pf.y, nerve: 1, player: true });
      }
      for (let i = 0; i < runners.length; i++) {
        const rn = runners[i];
        if (rn.out || rn.s < course.monsterStart - 40) continue;
        targets.push(rn);
      }
      for (let i = 0; i < animals.length; i++) {
        const a = animals[i];
        a.t += dt;
        let target = null;
        let best = 1e9;
        for (let k = 0; k < targets.length; k++) {
          const t = targets[k];
          const d = Math.hypot(t.x - a.x, t.y - a.y);
          const score = d + (t.nerve >= 0.9 ? 80 : 0);
          if (score < best) {
            best = score;
            target = t;
          }
        }
        if (!target) target = { x: course.gate.x, y: course.gate.y, nerve: 1 };
        if (a.phase === "chase" && a.t > 1.15) {
          a.phase = "lunge";
          a.t = 0;
          const ang = Math.atan2(target.y - a.y, target.x - a.x);
          a.lungex = Math.cos(ang);
          a.lungey = Math.sin(ang);
        } else if (a.phase === "lunge" && a.t > 0.34) {
          a.phase = "recover";
          a.t = 0;
        } else if (a.phase === "recover" && a.t > 0.42) {
          a.phase = "chase";
          a.t = 0;
        }
        const want = Math.atan2(target.y - a.y, target.x - a.x);
        let diff = want - a.ang;
        while (diff > Math.PI) diff -= Math.PI * 2;
        while (diff < -Math.PI) diff += Math.PI * 2;
        const turn = a.phase === "lunge" ? 1.2 : 5.5;
        a.ang += Math.max(-turn * dt, Math.min(turn * dt, diff));
        let sp = a.phase === "lunge" ? 250 : 128;
        if (a.phase === "recover") sp = 40;
        const dirx = a.phase === "lunge" ? a.lungex : Math.cos(a.ang);
        const diry = a.phase === "lunge" ? a.lungey : Math.sin(a.ang);
        a.x += dirx * sp * dt;
        a.y += diry * sp * dt;

        for (let r = 0; r < runners.length; r++) {
          const rn = runners[r];
          if (rn.out) continue;
          const d = Math.hypot(rn.x - a.x, rn.y - a.y);
          if (rn.nerve < 0.7 && d < 22) rn.out = true;
          else if (a.phase === "lunge" && d < 8) rn.out = true;
        }
        if (!eliminated) {
          const d = Math.hypot(pf.x - a.x, pf.y - a.y);
          const kill = a.phase === "lunge" ? 11 : 7;
          if (d < kill) {
            loseRace("BEAST");
            return;
          }
        }
      }
    }

    function update(dt) {
      if (!isScene()) return;
      if (tipT > 0) tipT -= dt;
      if (A.getScene() === "race") updateRace(dt);
      updateScript(dt);
      if (phase === "sleep") {
        sleepT += dt;
      }
      if (phase === "ceremony") ceremonyT += dt;
      if (!(A.playBlocked && A.playBlocked())) updateDoors();
    }

    function prompt() {
      if (!isScene()) return "";
      if (tipT > 0 && tip) return tip;
      const sc = A.getScene();
      if (sc === "rome" && phase === "city") {
        const stall = nearStall();
        if (stall) return "T  " + stall.label + "  " + stall.price;
        const dealer = nearDealer();
        if (dealer) return "T  " + dealer.label + "  " + dealer.price;
        const f = feet();
        if (hitRect(f.x, f.y, city.palaceDoor) || Math.hypot(f.x - (city.palaceDoor.x + 16), f.y - city.palaceDoor.y) < 36) {
          return "THE KINGS PALACE";
        }
        if (hitRect(f.x, f.y, city.portal)) return "RETURN THROUGH THE PORTAL";
      }
      if (sc === "barracks" && phase === "barracks") {
        return runDead ? "R RESETS THE RUN" : "NORTH TO THE START LINE";
      }
      if (sc === "race" && runDead) return "R RESETS THE RUN";
      if (sc === "race" && phase === "staged") return "RUN WHEN READY";
      if (sc === "race" && animalsOut && !gateOpen) return "DODGE THE BEASTS";
      if (phase === "talk" || phase === "ceremony" || phase === "lost") return "ENTER";
      return "";
    }

    function draw(cam) {
      const sc = A.getScene();
      if (sc === "race") drawRace(cam);
      else if (sc === "palace") drawPalace(cam);
      else if (sc === "barracks") drawBarracks(cam);
      else drawCity(cam);
    }

    function drawFront(cam) {
      if (A.getScene() !== "race") return;
      const t = A.time();
      for (let i = 0; i < shots.length; i++) drawShot(cam, shots[i]);
      for (let i = 0; i < animals.length; i++) drawAnimal(cam, animals[i], t);
    }

    function drawHud() {
      if (!isScene()) return;
      const uiW = A.uiW();
      const uiH = A.uiH();
      const g = A.ctx();
      if (phase === "sleep") {
        const u = Math.min(1, sleepT / 0.45);
        const out = sleepT > 1.5 ? Math.min(1, (sleepT - 1.5) / 0.7) : 0;
        const darkness = Math.max(0, u * (1 - out * 0.85));
        g.save();
        g.globalAlpha = 0.35 + darkness * 0.6;
        A.px(0, 0, uiW, uiH, "#07060a");
        g.restore();
      }
      if (script) {
        const line = script.lines[Math.min(script.i, script.lines.length - 1)] || "";
        const bar = phase === "ceremony" || phase === "talk" || phase === "lost";
        if (bar) {
          A.px(0, 0, uiW, 10, "#120c08");
          A.px(0, uiH - 36, uiW, 36, "#120c08");
          A.px(0, uiH - 36, uiW, 1, "#c9a227");
        }
        A.drawPixText(line, (uiW / 2) | 0, phase === "sleep" ? ((uiH / 2) | 0) : uiH - 22, "#f3e2c4", "center");
        if (phase === "ceremony") {
          drawEmpire(uiW, uiH);
        }
      }
      if (A.getScene() === "race" && (phase === "racing" || phase === "staged" || phase === "ceremony" || phase === "lost")) {
        drawRaceHud(uiW);
      }
    }

    function drawRaceHud(uiW) {
      const list = [{ s: eliminated ? -1 : project(feet().x, feet().y).s, self: true, out: eliminated }];
      for (let i = 0; i < runners.length; i++) {
        list.push({ s: runners[i].out ? -1 : runners[i].s, self: false, out: runners[i].out });
      }
      list.sort((a, b) => b.s - a.s);
      let place = 1;
      for (let i = 0; i < list.length; i++) {
        if (list[i].self) place = i + 1;
      }
      const left = aliveCount();
      A.px(6, 6, 78, 28, "#3a2414");
      A.px(7, 7, 76, 26, "#5c3a21");
      A.drawPixText("PLACE " + place + "/21", 10, 10, "#f3e2c4");
      A.drawPixText("LEFT " + left, 10, 20, left <= 5 ? "#e8c44a" : "#f3e2c4");
      const gateLabel = gateOpen ? "GATE OPEN" : animalsOut ? "GATE SHUT" : "1500M";
      const gw = gateLabel.length * 6;
      A.px(6, 38, gw + 8, 12, "#3a2414");
      A.drawPixText(gateLabel, 10, 41, gateOpen ? "#c9e86a" : "#f3e2c4");
      if (pauseRace) {
        const label = "TIME PAUSED";
        const tw = label.length * 6;
        A.px(uiW - tw - 14, 22, tw + 8, 12, "#3a2414");
        A.drawPixText(label, uiW - tw - 10, 25, "#e8c44a");
      }
      if (!speedRome() && (phase === "racing" || phase === "ceremony" || phase === "lost")) {
        const ms = Math.max(0, (raceT * 1000) | 0);
        const label = fmt(ms);
        const tw = label.length * 6;
        A.px(uiW - tw - 14, 6, tw + 8, 13, "#3a2414");
        A.drawPixText(label, uiW - tw - 10, 9, "#f3e2c4");
      }
    }

    function drawEmpire(uiW, uiH) {
      const y = uiH - 34;
      for (let i = 0; i < 28; i++) {
        const x = 8 + i * ((uiW - 16) / 28);
        A.px(x | 0, y, 3, 3, i % 5 === 0 ? "#c9a227" : "#e8dcc8");
        A.px(x | 0, y + 3, 4, 5, i % 3 ? "#8a3038" : "#f4efe4");
      }
    }

    function persist() {
      return { phase: phase, crowned: crowned, runDead: runDead };
    }

    function restore(data) {
      crowned = !!(data && data.crowned);
      runDead = false;
      const sc = A.getScene();
      if (
        sc === "race" ||
        sc === "barracks" ||
        (data && (data.phase === "racing" || data.phase === "staged" || data.phase === "sleep"))
      ) {
        A.setScene("race");
        beginRunners();
        phase = "staged";
        const line = sampleAt(0);
        placePlayer(line.x, line.y);
        return;
      }
      if (sc === "palace") phase = crowned ? "crowned" : "city";
      else phase = "city";
    }

    function debug() {
      let lavaHits = 0;
      let hayHits = 0;
      let colHits = 0;
      for (let s = 0; s < course.finishS; s += 12) {
        if (s >= course.monsterStart && s < course.monsterEnd) continue;
        const p = sampleAt(s);
        if (lavaAt(p.x, p.y)) lavaHits++;
        for (let i = 0; i < course.hay.length; i++) {
          const h = course.hay[i];
          if (p.x > h.x && p.x < h.x + h.w && p.y > h.y && p.y < h.y + h.h) hayHits++;
        }
        for (let i = 0; i < course.columns.length; i++) {
          const c = course.columns[i];
          const dx = p.x - c.x;
          const dy = p.y - c.y;
          if (dx * dx + dy * dy < (c.r + 6) * (c.r + 6)) colHits++;
        }
      }
      return {
        fastestSec: course.timedPx / RUN,
        fastestLabel: fmt(course.timedPx / RUN * 1000),
        timedPx: course.timedPx | 0,
        timedM: METERS,
        monsterPx: (course.monsterEnd - course.monsterStart) | 0,
        lavaClear: course.lavaClear | 0,
        lavaSign: course.lavaSign,
        outsideSign: course.outsideSign,
        lavaHits: lavaHits,
        hayHits: hayHits,
        colHits: colHits,
        world: { w: course.w | 0, h: course.h | 0 },
        runners: RUNNERS.length,
        pxPerM: PX_PER_M,
      };
    }

    function drawCity(cam) {
      const g = A.ctx();
      const t = A.time();
      A.pxi(g, 0, 0, A.viewW(), A.viewH(), "#c2a06a");
      drawAlleys(cam);
      // Street stones, viewport only.
      const x0 = Math.max(STREET_X, cam.x) | 0;
      const x1 = Math.min(STREET_X + STREET_W, cam.x + A.viewW() + 8) | 0;
      const y0 = Math.max(0, cam.y) | 0;
      const y1 = Math.min(CITY_H, cam.y + A.viewH() + 8) | 0;
      for (let y = y0 - (y0 % 16); y < y1; y += 16) {
        for (let x = x0 - (x0 % 16); x < x1; x += 16) {
          if (x + 16 < STREET_X || x > STREET_X + STREET_W) continue;
          const n = A.hash(x >> 4, y >> 4);
          A.pxi(g, x - cam.x, y - cam.y, 15, 15, n > 0.5 ? "#b7a07a" : "#cbb892");
          A.pxi(g, x - cam.x, y - cam.y + 15, 16, 1, "#8a7048");
        }
      }
      for (let i = 0; i < city.blocks.length; i++) drawBlock(cam, city.blocks[i], i);
      drawPalaceFace(cam);
      for (let i = 0; i < city.stalls.length; i++) drawStall(cam, city.stalls[i], t);
      for (let i = 0; i < city.dealers.length; i++) drawDealer(cam, city.dealers[i], t);
      drawPortalPad(cam, t);
      for (let i = 0; i < city.people.length; i++) {
        const n = city.people[i];
        const wob = Math.sin(t * n.spd + n.phase);
        const x = n.x + wob * n.amp;
        const y = n.y + Math.cos(t * n.spd * 0.7 + n.phase) * (n.amp * 0.45);
        if (x < cam.x - 20 || y < cam.y - 20 || x > cam.x + A.viewW() + 20 || y > cam.y + A.viewH() + 20) continue;
        drawPerson(g, (x - cam.x) | 0, (y - cam.y) | 0, n.col, wob > 0 ? 1 : -1, (t * 6 + n.phase) | 0, false);
        const buddy = city.people[(i + 1) % city.people.length];
        const bx = buddy.x + Math.sin(t * buddy.spd + buddy.phase) * buddy.amp;
        const by = buddy.y;
        if (Math.hypot(x - bx, y - by) < 26 && ((t + n.phase) % 5) < 2.2) {
          A.drawPixText(n.line, (x - cam.x) | 0, (y - cam.y - 16) | 0, "#f3e2c4", "center");
        }
      }
    }

    function drawBlock(cam, b, i) {
      if (b.x + b.w < cam.x - 8 || b.y + b.h < cam.y - 8 || b.x > cam.x + A.viewW() + 8 || b.y > cam.y + A.viewH() + 8) return;
      const g = A.ctx();
      const x = (b.x - cam.x) | 0;
      const y = (b.y - cam.y) | 0;
      const roof = i % 3 === 0 ? "#a33a2a" : i % 3 === 1 ? "#8a4030" : "#b55238";
      const wall = i % 2 ? "#e6d7b8" : "#d9c7a4";
      A.pxi(g, x, y, b.w, b.h, wall);
      A.pxi(g, x + 6, y + 6, b.w - 12, b.h - 12, roof);
      // Courtyard — the footprint reads as a huge building from above.
      const cw = (b.w * 0.42) | 0;
      const ch = (b.h * 0.46) | 0;
      const cx = x + ((b.w - cw) / 2) | 0;
      const cy = y + ((b.h - ch) / 2) | 0;
      A.pxi(g, cx, cy, cw, ch, "#cbb892");
      A.pxi(g, cx + 4, cy + 4, cw - 8, ch - 8, "#b7a07a");
      // Colonnade along the street edge.
      const streetSide = b.x < STREET_X;
      const colX = streetSide ? x + b.w - 10 : x + 4;
      for (let cy2 = y + 10; cy2 < y + b.h - 8; cy2 += 18) {
        A.pxi(g, colX, cy2, 6, 10, "#f4efe4");
        A.pxi(g, colX, cy2, 6, 2, "#c9a227");
      }
      A.pxi(g, x, y, b.w, 3, "#f4efe4");
      A.pxi(g, x, y + b.h - 3, b.w, 3, "#6a5340");
    }

    function drawPalaceFace(cam) {
      const b = city.palaceFace;
      if (b.y + b.h < cam.y || b.y > cam.y + A.viewH()) return;
      const g = A.ctx();
      const x = (b.x - cam.x) | 0;
      const y = (b.y - cam.y) | 0;
      A.pxi(g, x, y, b.w, b.h, "#efe6d2");
      A.pxi(g, x + 10, y + 8, b.w - 20, b.h - 16, "#c4553a");
      A.pxi(g, x + 24, y + 20, b.w - 48, b.h - 36, "#e7dcc4");
      const pedW = 220;
      const pedX = x + ((b.w - pedW) / 2) | 0;
      A.pxi(g, pedX, y + 16, pedW, 28, "#f7f1e4");
      A.pxi(g, pedX + 8, y + 20, pedW - 16, 8, "#c9a227");
      for (let i = 0; i < 12; i++) {
        const cx = x + 30 + i * ((b.w - 70) / 11);
        A.pxi(g, cx | 0, y + b.h - 48, 8, 36, "#f4efe4");
        A.pxi(g, cx | 0, y + b.h - 50, 8, 3, "#c9a227");
      }
      const door = city.palaceDoor;
      A.pxi(g, (door.x - cam.x) | 0, (door.y - cam.y) | 0, door.w, door.h, "#1a120c");
      A.drawPixText("PALACE", (b.x + b.w / 2 - cam.x) | 0, (b.y + 28 - cam.y) | 0, "#3a2414", "center");
    }

    function drawStall(cam, s, t) {
      if (s.x + 40 < cam.x || s.y + 30 < cam.y || s.x > cam.x + A.viewW() || s.y > cam.y + A.viewH()) return;
      const g = A.ctx();
      const x = (s.x - cam.x) | 0;
      const y = (s.y - cam.y) | 0;
      A.pxi(g, x, y + 6, 22, 10, "#6b3f1f");
      A.pxi(g, x - 2, y + 4, 26, 3, s.awning);
      A.pxi(g, x + 2, y + 8, 4, 4, s.goods);
      A.pxi(g, x + 8, y + 8, 4, 4, "#f3e2c4");
      A.pxi(g, x + 14, y + 8, 4, 4, s.goods);
      drawPerson(g, x + 6, y - 8 + ((Math.sin(t * 2 + s.x) * 0.5) | 0), s.robe, 1, 0, false);
    }

    function drawAlleys(cam) {
      const g = A.ctx();
      for (let i = 0; i < city.alleys.length; i++) {
        const a = city.alleys[i];
        if (a.x + a.w < cam.x - 8 || a.y + a.h < cam.y - 8 || a.x > cam.x + A.viewW() + 8 || a.y > cam.y + A.viewH() + 8) continue;
        const x = (a.x - cam.x) | 0;
        const y = (a.y - cam.y) | 0;
        A.pxi(g, x, y, a.w, a.h, "#5a4634");
        A.pxi(g, x, y + 3, a.w, a.h - 6, "#3a2c22");
        A.pxi(g, x, y, a.w, 2, "#241810");
        A.pxi(g, x, y + a.h - 2, a.w, 2, "#241810");
      }
    }

    function drawDealer(cam, d, t) {
      if (d.x + 24 < cam.x || d.y + 24 < cam.y || d.x > cam.x + A.viewW() || d.y > cam.y + A.viewH()) return;
      const g = A.ctx();
      const x = (d.x - cam.x) | 0;
      const y = (d.y - cam.y) | 0;
      const bob = (Math.sin(t * 2 + d.x) * 0.5) | 0;
      const fill =
        d.item === "potion_mystery"
          ? ["#e85ad4", "#44e0c0", "#ffe14a", "#7a4bff"][((t * 4) | 0) % 4]
          : d.fill;
      A.pxi(g, x - 3, y - 4 + bob, 16, 2, "#120c10");
      drawPerson(g, x, y + bob, d.robe, d.face, (t * 3) | 0, false);
      A.pxi(g, x + 1, y - 2 + bob, 6, 3, "#120c10");
      A.pxi(g, x + 2, y + bob, 4, 2, "#120c10");
      const bx = d.face < 0 ? x - 4 : x + 8;
      A.pxi(g, bx, y + 5 + bob, 3, 5, "#d0d8e0");
      A.pxi(g, bx + 1, y + 7 + bob, 1, 2, fill);
      const lamp = Math.sin(t * 9 + d.x) > 0 ? "#e8c44a" : "#a06028";
      const mx = (d.mouth - cam.x) | 0;
      const my = (d.mouthY - cam.y) | 0;
      A.pxi(g, mx, my, 2, 3, "#3a2414");
      A.pxi(g, mx, my - 2, 2, 2, lamp);
      const f = feet();
      if (Math.hypot(f.x - (d.x + 4), f.y - (d.y + 12)) < 72) {
        A.drawPixText(d.line, x + 4, y - 12 + bob, "#f3e2c4", "center");
      }
    }

    function drawPortalPad(cam, t) {
      const p = city.portal;
      if (p.y > cam.y + A.viewH() || p.y + p.h < cam.y) return;
      const g = A.ctx();
      const x = (p.x - cam.x) | 0;
      const y = (p.y - cam.y) | 0;
      const pulse = (Math.sin(t * 3) * 1) | 0;
      A.pxi(g, x - 4, y - 2, p.w + 8, p.h + 6, "#6a6258");
      A.pxi(g, x, y, p.w, p.h, "#1a3a6a");
      A.pxi(g, x + 3, y + 2 + pulse, p.w - 6, p.h - 6, "#3a78c8");
      A.pxi(g, x + 6, y + 4, p.w - 12, 2, "#d6ecff");
    }

    function drawPalace(cam) {
      const g = A.ctx();
      A.pxi(g, 0, 0, A.viewW(), A.viewH(), "#1a140e");
      A.pxi(g, -cam.x, -cam.y, PALACE_W, PALACE_H, "#e7d7b4");
      A.pxi(g, 18 - cam.x, 18 - cam.y, PALACE_W - 36, PALACE_H - 36, "#c4553a");
      A.pxi(g, 36 - cam.x, 36 - cam.y, PALACE_W - 72, PALACE_H - 72, "#efe4cc");
      // Center aisle carpet
      A.pxi(g, (PALACE_W / 2 - 28 - cam.x) | 0, 40 - cam.y, 56, PALACE_H - 80, "#7a2430");
      A.pxi(g, (PALACE_W / 2 - 22 - cam.x) | 0, 40 - cam.y, 44, PALACE_H - 80, "#8a3038");
      for (let i = 0; i < palace.columns.length; i++) {
        const c = palace.columns[i];
        A.pxi(g, (c.x - cam.x) | 0, (c.y - cam.y) | 0, c.w, c.h, "#f7f1e4");
        A.pxi(g, (c.x - cam.x) | 0, (c.y - cam.y) | 0, c.w, 3, "#c9a227");
      }
      // Throne
      const tx = (PALACE_W / 2 - 18 - cam.x) | 0;
      const ty = (78 - cam.y) | 0;
      A.pxi(g, tx, ty, 36, 22, "#c9a227");
      A.pxi(g, tx + 4, ty + 4, 28, 14, "#8a3038");
      A.pxi(g, tx + 14, ty - 10, 8, 12, "#e8c44a");
      drawKing(g, (PALACE_W / 2 - cam.x) | 0, (132 - cam.y) | 0);
      A.drawPixText("KING", (PALACE_W / 2 - cam.x) | 0, (96 - cam.y) | 0, "#3a2414", "center");
      // Guards
      drawPerson(g, (PALACE_W / 2 - 70 - cam.x) | 0, (150 - cam.y) | 0, "#8a3038", 1, 0, false);
      drawPerson(g, (PALACE_W / 2 + 60 - cam.x) | 0, (150 - cam.y) | 0, "#8a3038", -1, 0, false);
    }

    function drawBarracks(cam) {
      const g = A.ctx();
      const t = A.time();
      const morning = phase !== "sleep" || sleepT > 1.4;
      A.pxi(g, 0, 0, A.viewW(), A.viewH(), morning ? "#d8c4a0" : "#141018");
      A.pxi(g, -cam.x, -cam.y, BARRACKS_W, BARRACKS_H, morning ? "#cbb892" : "#2a241c");
      A.pxi(g, 8 - cam.x, 8 - cam.y, BARRACKS_W - 16, 8, "#6a5340");
      A.pxi(g, 8 - cam.x, BARRACKS_H - 16 - cam.y, BARRACKS_W - 16, 8, "#6a5340");
      A.pxi(g, 8 - cam.x, 8 - cam.y, 8, BARRACKS_H - 16, "#6a5340");
      A.pxi(g, BARRACKS_W - 16 - cam.x, 8 - cam.y, 8, BARRACKS_H - 16, "#6a5340");
      // Bed
      A.pxi(g, 36 - cam.x, 48 - cam.y, 70, 36, "#6b3f1f");
      A.pxi(g, 40 - cam.x, 52 - cam.y, 62, 24, morning ? "#f4efe4" : "#3a342c");
      A.pxi(g, 40 - cam.x, 52 - cam.y, 16, 12, "#c45a48");
      // Window
      A.pxi(g, (BARRACKS_W - 40 - cam.x) | 0, 28 - cam.y, 18, 14, morning ? "#f0d78a" : "#1a2438");
      if (morning) A.pxi(g, (BARRACKS_W - 36 - cam.x) | 0, 32 - cam.y, 6, 6, "#fff4c8");
      // Door
      const d = barracks.door;
      A.pxi(g, (d.x - cam.x) | 0, (d.y - cam.y) | 0, d.w, d.h, "#1a120c");
      if (phase === "barracks") {
        A.drawPixText("TO THE LINE", (BARRACKS_W / 2 - cam.x) | 0, (28 - cam.y) | 0, "#3a2414", "center");
      }
      // Lamp flicker
      A.pxi(g, 28 - cam.x, BARRACKS_H - 48 - cam.y, 3, 8, "#5c3a21");
      A.pxi(g, 27 - cam.x, BARRACKS_H - 54 - cam.y + ((Math.sin(t * 8) * 1) | 0), 5, 4, "#e8c44a");
    }

    function drawRace(cam) {
      const g = A.ctx();
      A.pxi(g, 0, 0, A.viewW(), A.viewH(), "#8d7048");
      fillRibbon(g, cam, course.samples, 16, "#5a5048");
      fillRibbon(g, cam, course.samples, 0, "#d2b48a");
      // Lane chevrons on the fast line, culled.
      for (let i = 12; i < course.samples.length; i += 28) {
        const p = course.samples[i];
        if (p.s < 0) continue;
        const x = p.x - cam.x;
        const y = p.y - cam.y;
        if (x < -20 || y < -20 || x > A.viewW() + 20 || y > A.viewH() + 20) continue;
        A.pxi(g, (x - p.nx * 2) | 0, (y - p.ny * 2) | 0, 3, 2, "#b08960");
      }
      drawWater(g, cam);
      drawLava(g, cam);
      drawStands(g, cam);
      for (let i = 0; i < course.tunnels.length; i++) drawTunnel(g, cam, course.tunnels[i]);
      for (let i = 0; i < course.columns.length; i++) {
        const c = course.columns[i];
        if (c.x < cam.x - 20 || c.y < cam.y - 20 || c.x > cam.x + A.viewW() + 20 || c.y > cam.y + A.viewH() + 20) continue;
        A.pxi(g, (c.x - c.r - cam.x) | 0, (c.y - c.r - cam.y) | 0, c.r * 2, c.r * 2, "#6a6258");
        A.pxi(g, (c.x - 3 - cam.x) | 0, (c.y - c.r - cam.y) | 0, 6, 4, "#d9d0c4");
      }
      for (let i = 0; i < course.hay.length; i++) {
        const h = course.hay[i];
        if (h.x + h.w < cam.x || h.y + h.h < cam.y || h.x > cam.x + A.viewW() || h.y > cam.y + A.viewH()) continue;
        A.pxi(g, (h.x - cam.x) | 0, (h.y - cam.y) | 0, h.w, h.h, "#c4a04a");
        A.pxi(g, (h.x - cam.x) | 0, (h.y + 3 - cam.y) | 0, h.w, 2, "#8a7030");
      }
      drawGates(g, cam);
      const start = sampleAt(0);
      A.pxi(g, (start.x - start.nx * start.half - cam.x) | 0, (start.y - start.ny * 2 - cam.y) | 0, 4, 4, "#f3e2c4");
      paintLine(g, cam, start, "#f4efe4");
      const fin = sampleAt(course.finishS);
      paintLine(g, cam, fin, "#e8c44a");
      if (fin.x > cam.x - 40 && fin.x < cam.x + A.viewW() + 40 && fin.y > cam.y - 20 && fin.y < cam.y + A.viewH() + 20) {
        A.drawPixText("FINISH", (fin.x - cam.x) | 0, (fin.y - 16 - cam.y) | 0, "#f3e2c4", "center");
      }
      if (start.y > cam.y - 20 && start.y < cam.y + A.viewH() + 30) {
        A.drawPixText("START", (start.x - cam.x) | 0, (start.y + 14 - cam.y) | 0, "#3a2414", "center");
      }
      for (let i = 0; i < runners.length; i++) {
        const rn = runners[i];
        if (rn.out) continue;
        if (rn.x < cam.x - 16 || rn.y < cam.y - 16 || rn.x > cam.x + A.viewW() + 16 || rn.y > cam.y + A.viewH() + 16) continue;
        drawPerson(g, (rn.x - 4 - cam.x) | 0, (rn.y - 12 - cam.y) | 0, rn.col, rn.tx > 0 ? 1 : -1, (A.time() * 8 + i) | 0, false);
      }
    }

    function paintLine(g, cam, p, col) {
      const x0 = p.x - p.nx * (p.half - 6) - cam.x;
      const y0 = p.y - p.ny * (p.half - 6) - cam.y;
      const x1 = p.x + p.nx * (p.half - 6) - cam.x;
      const y1 = p.y + p.ny * (p.half - 6) - cam.y;
      const steps = 18;
      for (let i = 0; i <= steps; i++) {
        const u = i / steps;
        A.pxi(g, (x0 + (x1 - x0) * u) | 0, (y0 + (y1 - y0) * u) | 0, 2, 2, i % 2 ? col : "#3a2414");
      }
    }

    function fillRibbon(g, cam, samples, extra, color) {
      if (!samples.length) return;
      g.beginPath();
      for (let i = 0; i < samples.length; i++) {
        const p = samples[i];
        const x = p.x + p.nx * (p.half + extra) - cam.x;
        const y = p.y + p.ny * (p.half + extra) - cam.y;
        if (i === 0) g.moveTo(x, y);
        else g.lineTo(x, y);
      }
      for (let i = samples.length - 1; i >= 0; i--) {
        const p = samples[i];
        g.lineTo(p.x - p.nx * (p.half + extra) - cam.x, p.y - p.ny * (p.half + extra) - cam.y);
      }
      g.closePath();
      g.fillStyle = color;
      g.fill();
    }

    function drawWater(g, cam) {
      const a = sampleAt(course.waterS0);
      const b = sampleAt(course.waterS1);
      // Band across the track between the two s marks, as a quad.
      function corner(p, side) {
        return [p.x + p.nx * p.half * side - cam.x, p.y + p.ny * p.half * side - cam.y];
      }
      const c00 = corner(a, -1);
      const c01 = corner(a, 1);
      const c11 = corner(b, 1);
      const c10 = corner(b, -1);
      g.beginPath();
      g.moveTo(c00[0], c00[1]);
      g.lineTo(c01[0], c01[1]);
      g.lineTo(c11[0], c11[1]);
      g.lineTo(c10[0], c10[1]);
      g.closePath();
      g.fillStyle = "#2f6ea4";
      g.fill();
      // Dry ford on the fast line.
      g.beginPath();
      function ford(p, side) {
        return [p.x + p.nx * 20 * side - cam.x, p.y + p.ny * 20 * side - cam.y];
      }
      const f00 = ford(a, -1);
      const f01 = ford(a, 1);
      const f11 = ford(b, 1);
      const f10 = ford(b, -1);
      g.moveTo(f00[0], f00[1]);
      g.lineTo(f01[0], f01[1]);
      g.lineTo(f11[0], f11[1]);
      g.lineTo(f10[0], f10[1]);
      g.closePath();
      g.fillStyle = "#7eb4d4";
      g.fill();
    }

    function drawLava(g, cam) {
      const lav = course.lava;
      const x0 = Math.max(lav.x - lav.rx - 8, cam.x);
      const y0 = Math.max(lav.y - lav.ry - 8, cam.y);
      const x1 = Math.min(lav.x + lav.rx + 8, cam.x + A.viewW() + 4);
      const y1 = Math.min(lav.y + lav.ry + 8, cam.y + A.viewH() + 4);
      for (let y = y0; y < y1; y += 4) {
        for (let x = x0; x < x1; x += 4) {
          if (!lavaHit(x + 2, y + 2, lav)) continue;
          const nx = (x - lav.x) / lav.rx;
          const ny = (y - lav.y) / lav.ry;
          const hot = nx * nx + ny * ny;
          const col = hot < 0.25 ? "#ffd060" : hot < 0.55 ? "#f07820" : "#c43818";
          A.pxi(g, (x - cam.x) | 0, (y - cam.y) | 0, 4, 4, col);
        }
      }
    }

    function drawStands(g, cam) {
      for (let i = 0; i < course.stands.length; i++) {
        const s = course.stands[i];
        if (s.x + s.w < cam.x || s.y + s.h < cam.y || s.x > cam.x + A.viewW() || s.y > cam.y + A.viewH()) continue;
        const x = (s.x - cam.x) | 0;
        const y = (s.y - cam.y) | 0;
        A.pxi(g, x, y, s.w, s.h, "#5c3a21");
        A.pxi(g, x + 2, y + 2, s.w - 4, s.h - 4, "#6b4428");
        for (let row = 0; row < 4; row++) {
          for (let col = 0; col < 6; col++) {
            const px = x + 4 + col * 8;
            const py = y + 4 + row * 8;
            if (((row + col) & 1) === 0) A.pxi(g, px, py, 3, 3, "#e8dcc8");
            else A.pxi(g, px, py, 3, 4, row & 1 ? "#8a3038" : "#f4efe4");
          }
        }
      }
    }

    function drawTunnel(g, cam, m) {
      const x = (m.x - cam.x) | 0;
      const y = (m.y - cam.y) | 0;
      if (x < -30 || y < -30 || x > A.viewW() + 30 || y > A.viewH() + 30) return;
      A.pxi(g, x - 16, y - 18, 32, 28, "#4a4038");
      A.pxi(g, x - 10, y - 12, 20, 20, "#14110e");
      A.pxi(g, x - 14, y - 16, 4, 16, "#d9d0c4");
      A.pxi(g, x + 10, y - 16, 4, 16, "#d9d0c4");
    }

    function drawGates(g, cam) {
      // Open arches along the bowl, plus the barred gate that actually closes.
      for (let i = 0; i < course.arches.length; i++) {
        const p = course.arches[i];
        if (p.x < cam.x - 40 || p.y < cam.y - 40 || p.x > cam.x + A.viewW() + 40 || p.y > cam.y + A.viewH() + 40) continue;
        hashGate(g, cam, p, false);
      }
      if (!gateOpen) hashGate(g, cam, course.gate, true);
    }

    function hashGate(g, cam, p, shut) {
      const half = p.half;
      const steps = 10;
      for (let i = 0; i <= steps; i++) {
        const lat = -half + (2 * half * i) / steps;
        const x = p.x + p.nx * lat - cam.x;
        const y = p.y + p.ny * lat - cam.y;
        A.pxi(g, x | 0, y | 0, 3, 8, shut ? "#2a2420" : "#6a6258");
      }
      const x0 = p.x - p.nx * half - cam.x;
      const y0 = p.y - p.ny * half - cam.y;
      const x1 = p.x + p.nx * half - cam.x;
      const y1 = p.y + p.ny * half - cam.y;
      g.strokeStyle = shut ? "#1a1612" : "#8a8078";
      g.lineWidth = 2;
      g.beginPath();
      g.moveTo(x0, y0);
      g.lineTo(x1, y1);
      g.stroke();
    }

    function drawShot(cam, s) {
      const u = Math.min(1, s.t / s.life);
      const x = s.x + (s.tx - s.x) * u;
      const y = s.y + (s.ty - s.y) * u - Math.sin(u * Math.PI) * 18;
      if (x < cam.x - 10 || y < cam.y - 20 || x > cam.x + A.viewW() + 10 || y > cam.y + A.viewH() + 10) return;
      const g = A.ctx();
      if (s.boom) {
        const col = s.kind === "cracker" ? "#ffd060" : "#c43818";
        A.pxi(g, (s.tx - 4 - cam.x) | 0, (s.ty - 3 - cam.y) | 0, 8, 6, col);
        A.pxi(g, (s.tx - 2 - cam.x) | 0, (s.ty - 6 - cam.y) | 0, 3, 3, "#fff4c8");
        return;
      }
      const col = s.kind === "cracker" ? "#e8c44a" : "#d04028";
      A.pxi(g, (x - 2 - cam.x) | 0, (y - 2 - cam.y) | 0, 4, 4, col);
    }

    function drawAnimal(cam, a) {
      if (a.x < cam.x - 20 || a.y < cam.y - 20 || a.x > cam.x + A.viewW() + 20 || a.y > cam.y + A.viewH() + 20) return;
      const g = A.ctx();
      const x = (a.x - cam.x) | 0;
      const y = (a.y - cam.y) | 0;
      if (a.kind === "lion") {
        A.pxi(g, x - 7, y - 4, 14, 8, "#e0a040");
        A.pxi(g, x - 9, y - 6, 10, 8, "#c4842a");
        A.pxi(g, x + 4, y - 3, 6, 5, "#f0c060");
        A.pxi(g, x + 8, y - 2, 2, 2, "#1a120c");
      } else {
        A.pxi(g, x - 6, y - 3, 12, 7, "#6a4030");
        A.pxi(g, x + 4, y - 4, 5, 5, "#4a3028");
        A.pxi(g, x - 8, y - 1, 3, 2, "#d8d0c8");
      }
      if (a.phase === "lunge") A.pxi(g, x - 2, y - 10, 4, 2, "#e8c44a");
    }

    function drawKing(g, x, y) {
      A.pxi(g, x - 3, y - 20, 1, 3, "#c9a227");
      A.pxi(g, x - 1, y - 21, 1, 4, "#e8c44a");
      A.pxi(g, x + 1, y - 20, 1, 3, "#c9a227");
      A.pxi(g, x - 3, y - 18, 6, 1, "#e8c44a");
      A.pxi(g, x - 1, y - 22, 1, 1, "#f4efe4");
      A.pxi(g, x - 3, y - 17, 6, 2, "#3a2414");
      A.pxi(g, x - 2, y - 18, 4, 1, "#5c3a21");
      A.pxi(g, x - 2, y - 15, 5, 4, "#e8c39a");
      A.pxi(g, x - 1, y - 13, 1, 1, "#2a1810");
      A.pxi(g, x + 1, y - 12, 1, 1, "#d4a07a");
      A.pxi(g, x - 1, y - 11, 3, 2, "#c4a574");
      A.pxi(g, x, y - 10, 2, 2, "#e8dcc8");
      A.pxi(g, x - 4, y - 8, 8, 6, "#f7f1e4");
      A.pxi(g, x - 4, y - 8, 8, 1, "#8a3038");
      A.pxi(g, x - 1, y - 7, 2, 5, "#c9a227");
      A.pxi(g, x - 4, y - 3, 8, 1, "#c9a227");
      A.pxi(g, x - 6, y - 7, 2, 3, "#f4efe4");
      A.pxi(g, x - 6, y - 5, 2, 2, "#e8c39a");
      A.pxi(g, x + 4, y - 7, 2, 3, "#f4efe4");
      A.pxi(g, x + 4, y - 5, 2, 2, "#e8c39a");
      A.pxi(g, x - 2, y - 2, 2, 3, "#e8c39a");
      A.pxi(g, x + 1, y - 2, 2, 3, "#e8c39a");
      A.pxi(g, x - 3, y, 3, 1, "#6a3058");
      A.pxi(g, x + 1, y, 3, 1, "#6a3058");
    }

    function drawPerson(g, x, y, col, face, frame, crown) {
      const step = frame & 1 ? 1 : 0;
      const dir = face < 0 ? -1 : 1;
      A.pxi(g, x + 2, y, 4, 4, "#e8c39a");
      A.pxi(g, x + 3, y + 1, 1, 1, "#2a1810");
      A.pxi(g, x + 1, y + 4, 6, 6, col);
      A.pxi(g, x + 1, y + 10, 2, 3 + (dir > 0 ? step : 0), "#3a2414");
      A.pxi(g, x + 5, y + 10, 2, 3 + (dir < 0 ? step : 0), "#3a2414");
      if (crown) {
        A.pxi(g, x + 1, y - 3, 1, 3, "#c9a227");
        A.pxi(g, x + 3, y - 4, 1, 2, "#e8c44a");
        A.pxi(g, x + 5, y - 3, 1, 3, "#c9a227");
        A.pxi(g, x + 1, y - 1, 6, 1, "#e8c44a");
      }
    }

    return {
      isScene: isScene,
      solid: solid,
      worldW: function () {
        return worldSize().w;
      },
      worldH: function () {
        return worldSize().h;
      },
      update: update,
      draw: draw,
      drawFront: drawFront,
      drawHud: drawHud,
      prompt: prompt,
      onKey: onKey,
      blocksMove: blocksMove,
      moveMul: moveMul,
      prepareSpeed: prepareSpeed,
      isSpeedCat: isSpeedCat,
      onEnter: onEnter,
      persist: persist,
      restore: restore,
      debug: debug,
      retryLine: function () {
        runDead = false;
        loseReason = "";
        script = null;
        A.fade("race", { x: 0, y: 0 });
      },
      enterFromPortal: function () {
        crowned = false;
        runDead = false;
        loseReason = "";
        phase = "city";
        script = null;
        A.fade("rome", { x: city.spawn.x - 4, y: city.spawn.y - 8 });
      },
    };
  }

  function buildCourse() {
    // Shape units. Y decreases as the race runs "up" the page, then the
    // finish arm heads east. Monster segments are the untimed pocket.
    const shape = [
      { x: 0, y: 32, halfM: 18 },
      { x: 0, y: 24, halfM: 18 },
      { x: 0, y: 20.2, halfM: 18 },
      { x: 0, y: 15.4, halfM: 17 },
      { x: -1.7, y: 12.8, halfM: 16 },
      { x: -4.5, y: 10.5, halfM: 15 },
      { x: -5.3, y: 7.5, halfM: 15 },
      { x: -3.7, y: 4.9, halfM: 14 },
      { x: -0.3, y: 3.55, halfM: 14 },
      { x: 2.9, y: 4.7, halfM: 15 },
      { x: 4.9, y: 6.9, halfM: 18, monster: true },
      { x: 5.45, y: 8.7, halfM: 18, monster: true },
      { x: 8.8, y: 8.75, halfM: 13 },
      { x: 15.4, y: 8.65, halfM: 12 },
    ];
    let timedU = 0;
    for (let i = 0; i < shape.length - 1; i++) {
      const a = shape[i];
      const b = shape[i + 1];
      if (!b.monster) timedU += Math.hypot(b.x - a.x, b.y - a.y);
    }
    const unitToPx = (METERS / timedU) * PX_PER_M;
    const pts = shape.map(function (p) {
      return {
        x: p.x * unitToPx,
        y: p.y * unitToPx,
        half: p.halfM * PX_PER_M,
        monster: !!p.monster,
      };
    });
    const walked = walkPath(pts);
    let minX = 1e9;
    let minY = 1e9;
    let maxX = -1e9;
    let maxY = -1e9;
    for (let i = 0; i < walked.samples.length; i++) {
      const p = walked.samples[i];
      minX = Math.min(minX, p.x - p.half - 160);
      maxX = Math.max(maxX, p.x + p.half + 160);
      minY = Math.min(minY, p.y - p.half - 120);
      maxY = Math.max(maxY, p.y + p.half + 120);
    }
    const ox = -minX + 80;
    const oy = -minY + 80;
    for (let i = 0; i < walked.samples.length; i++) {
      walked.samples[i].x += ox;
      walked.samples[i].y += oy;
    }
    const focus = {
      x: -0.55 * unitToPx + ox,
      y: 7.7 * unitToPx + oy,
    };
    const lava = fitLava(walked.samples, focus);
    const course = {
      samples: walked.samples,
      finishS: walked.finishS,
      monsterStart: walked.monsterStart,
      monsterEnd: walked.monsterEnd,
      timedPx: walked.monsterStart + (walked.finishS - walked.monsterEnd),
      w: maxX - minX + 160,
      h: maxY - minY + 160,
      lava: lava.lav,
      lavaClear: lava.clear,
      lavaSign: -1,
      outsideSign: 1,
      hay: [],
      columns: [],
      stands: [],
      tunnels: [],
      arches: [],
      gate: null,
      waterS0: 0,
      waterS1: 0,
      standS0: 0,
      standS1: 0,
    };
    // Which way is the pit from the racing line?
    const probe = nearestLavaSample(course.samples, course.lava);
    const plus = lavaDistance(probe.x + probe.nx * 14, probe.y + probe.ny * 14, course.lava);
    const minus = lavaDistance(probe.x - probe.nx * 14, probe.y - probe.ny * 14, course.lava);
    course.lavaSign = plus < minus ? 1 : -1;
    course.outsideSign = -course.lavaSign;

    // The sketch puts hay, the water band, and the stands on the opening
    // straight: barrels, then water, then the crowd on the right before the pit.
    let straightEnd = course.monsterStart;
    for (let i = 0; i < course.samples.length; i++) {
      const p = course.samples[i];
      if (p.s > 800 && Math.abs(p.tx) > 0.2) {
        straightEnd = p.s;
        break;
      }
    }
    course.waterS0 = straightEnd * 0.42;
    course.waterS1 = straightEnd * 0.5;
    course.standS0 = straightEnd * 0.86;
    course.standS1 = straightEnd * 0.98;
    const hayS = straightEnd * 0.3;
    const hayP = sampleStored(course.samples, hayS);
    for (let lat = -hayP.half + 28; lat < hayP.half - 28; lat += 30) {
      if (Math.abs(lat) < 22) continue;
      const x = hayP.x + hayP.nx * lat;
      const y = hayP.y + hayP.ny * lat;
      course.hay.push({ x: x - 8, y: y - 5, w: 16, h: 10 });
    }
    // Columns just off the fast line, on the safe side, through the turns.
    for (let s = course.monsterStart * 0.78; s < course.monsterStart - 30; s += 220) {
      const p = sampleStored(course.samples, s);
      const lat = course.outsideSign * (34 + ((s / 220) % 2) * 18);
      const x = p.x + p.nx * lat;
      const y = p.y + p.ny * lat;
      if (lavaHit(x, y, course.lava)) continue;
      course.columns.push({ x: x, y: y, r: 8 });
    }
    // Audience stands on the outside of the approach, before the pit.
    for (let s = course.standS0; s < course.standS1; s += 70) {
      const p = sampleStored(course.samples, s);
      // Right-hand side of the approach, before the pit. +normal is east on the straight.
      const lat = p.half + 8;
      const x = p.x + p.nx * lat;
      const y = p.y + p.ny * lat;
      course.stands.push({ x: x - 26, y: y - 18, w: 52, h: 36 });
    }
    // Tunnels outside the upper bend.
    const tunnelS = [course.monsterStart * 0.82, course.monsterStart * 0.96, course.monsterEnd - 20];
    for (let i = 0; i < tunnelS.length; i++) {
      const p = sampleStored(course.samples, tunnelS[i]);
      const lat = course.outsideSign * (p.half + 28);
      course.tunnels.push({
        x: p.x + p.nx * lat,
        y: p.y + p.ny * lat,
        tx: p.tx,
        ty: p.ty,
      });
    }
    // Visual arches (open) plus the real gate at the end of the pocket.
    const archS = [course.monsterStart * 0.7, course.monsterStart * 0.88];
    for (let i = 0; i < archS.length; i++) {
      const p = sampleStored(course.samples, archS[i]);
      course.arches.push({ x: p.x, y: p.y, nx: p.nx, ny: p.ny, tx: p.tx, ty: p.ty, half: p.half });
    }
    const gp = sampleStored(course.samples, course.monsterEnd);
    course.gate = { x: gp.x, y: gp.y, nx: gp.nx, ny: gp.ny, tx: gp.tx, ty: gp.ty, half: gp.half };
    return course;
  }

  function walkPath(pts) {
    const samples = [];
    const p0 = pts[0];
    const p1 = pts[1];
    const dx0 = p1.x - p0.x;
    const dy0 = p1.y - p0.y;
    const d0 = Math.hypot(dx0, dy0) || 1;
    const tx0 = dx0 / d0;
    const ty0 = dy0 / d0;
    for (let back = 56; back > 0; back -= 10) {
      samples.push({
        x: p0.x - tx0 * back,
        y: p0.y - ty0 * back,
        s: -back,
        half: p0.half,
        monster: false,
      });
    }
    let s = 0;
    let monsterStart = 0;
    let monsterEnd = 0;
    let seen = false;
    for (let i = 0; i < pts.length - 1; i++) {
      const a = pts[i];
      const b = pts[i + 1];
      const dx = b.x - a.x;
      const dy = b.y - a.y;
      const len = Math.hypot(dx, dy);
      const monster = !!b.monster;
      if (monster && !seen) {
        monsterStart = s;
        seen = true;
      }
      const steps = Math.max(1, Math.round(len / 10));
      for (let k = 0; k < steps; k++) {
        const u = k / steps;
        samples.push({
          x: a.x + dx * u,
          y: a.y + dy * u,
          s: s + len * u,
          half: a.half + (b.half - a.half) * u,
          monster: monster,
        });
      }
      s += len;
      if (monster) monsterEnd = s;
    }
    const last = pts[pts.length - 1];
    samples.push({ x: last.x, y: last.y, s: s, half: last.half, monster: false });
    for (let i = 0; i < samples.length; i++) {
      const prev = samples[Math.max(0, i - 1)];
      const next = samples[Math.min(samples.length - 1, i + 1)];
      let tx = next.x - prev.x;
      let ty = next.y - prev.y;
      const d = Math.hypot(tx, ty) || 1;
      tx /= d;
      ty /= d;
      samples[i].tx = tx;
      samples[i].ty = ty;
      samples[i].nx = -ty;
      samples[i].ny = tx;
    }
    return { samples: samples, finishS: s, monsterStart: monsterStart, monsterEnd: monsterEnd };
  }

  function sampleStored(samples, s) {
    let lo = 0;
    let hi = samples.length - 1;
    while (lo < hi) {
      const mid = (lo + hi) >> 1;
      if (samples[mid].s < s) lo = mid + 1;
      else hi = mid;
    }
    const i = Math.max(0, lo - 1);
    const a = samples[i];
    const b = samples[Math.min(samples.length - 1, i + 1)];
    const span = b.s - a.s || 1;
    const u = Math.max(0, Math.min(1, (s - a.s) / span));
    return {
      x: a.x + (b.x - a.x) * u,
      y: a.y + (b.y - a.y) * u,
      nx: a.nx,
      ny: a.ny,
      tx: a.tx,
      ty: a.ty,
      half: a.half + (b.half - a.half) * u,
      s: s,
    };
  }

  function lavaDistance(x, y, lav) {
    const dx = x - lav.x;
    const dy = y - lav.y;
    const d = Math.hypot(dx, dy);
    if (d < 1) return 0;
    let a = 0;
    let b = d;
    for (let k = 0; k < 14; k++) {
      const mid = (a + b) / 2;
      const px = lav.x + (dx * mid) / d;
      const py = lav.y + (dy * mid) / d;
      if (lavaHit(px, py, lav)) a = mid;
      else b = mid;
    }
    return d - a;
  }

  function nearestLavaSample(samples, lav) {
    let best = samples[0];
    let bestD = 1e9;
    for (let i = 0; i < samples.length; i += 4) {
      if (samples[i].s < 0) continue;
      const d = lavaDistance(samples[i].x, samples[i].y, lav);
      if (d < bestD) {
        bestD = d;
        best = samples[i];
      }
    }
    return best;
  }

  function lavaHit(x, y, lav) {
    let nx = (x - lav.x) / lav.rx;
    let ny = (y - lav.y) / lav.ry;
    if (ny > 0) nx *= 1 + ny * 0.85;
    return nx * nx + ny * ny < 1;
  }

  function fitLava(samples, focus) {
    const usable = [];
    for (let i = 0; i < samples.length; i++) if (samples[i].s >= 0) usable.push(samples[i]);
    let lo = 20;
    let hi = 8000;
    let best = lo;
    for (let n = 0; n < 22; n++) {
      const mid = (lo + hi) / 2;
      const lav = { x: focus.x, y: focus.y, rx: mid * 0.78, ry: mid };
      let ok = true;
      for (let i = 0; i < usable.length; i++) {
        if (lavaHit(usable[i].x, usable[i].y, lav)) {
          ok = false;
          break;
        }
      }
      if (ok) {
        best = mid;
        lo = mid;
      } else hi = mid;
    }
    const lav = { x: focus.x, y: focus.y, rx: Math.max(30, best * 0.78 - 18), ry: Math.max(30, best - 18) };
    let guard = 0;
    while (guard < 8) {
      let inside = false;
      for (let i = 0; i < usable.length; i++) {
        if (lavaHit(usable[i].x, usable[i].y, lav)) {
          inside = true;
          break;
        }
      }
      if (!inside) break;
      lav.rx *= 0.92;
      lav.ry *= 0.92;
      guard++;
    }
    let clear = 1e9;
    for (let i = 0; i < usable.length; i += 3) {
      const p = usable[i];
      const dx = p.x - lav.x;
      const dy = p.y - lav.y;
      const d = Math.hypot(dx, dy);
      if (d < 1) {
        clear = 0;
        continue;
      }
      let a = 0;
      let b = d;
      for (let k = 0; k < 14; k++) {
        const mid = (a + b) / 2;
        const x = lav.x + (dx * mid) / d;
        const y = lav.y + (dy * mid) / d;
        if (lavaHit(x, y, lav)) a = mid;
        else b = mid;
      }
      clear = Math.min(clear, d - a);
    }
    return { lav: lav, clear: clear };
  }

  function buildCity() {
    const blocks = [];
    const leftX = 36;
    const leftW = STREET_X - 56;
    const rightX = STREET_X + STREET_W + 20;
    const rightW = CITY_W - rightX - 36;
    const top = 430;
    const bot = CITY_H - 220;
    const rows = 6;
    const gap = 44;
    const bh = ((bot - top - gap * (rows - 1)) / rows) | 0;
    const alleys = [];
    const gaps = [];
    for (let r = 0; r < rows; r++) {
      const y = top + r * (bh + gap);
      blocks.push({ x: leftX, y: y, w: leftW, h: bh });
      blocks.push({ x: rightX, y: y, w: rightW, h: bh });
      if (r < rows - 1) {
        const gy = y + bh;
        gaps.push(gy);
        // Dark mouths face the avenue so the gaps read as alleys.
        alleys.push({ x: leftX, y: gy, w: leftW + 12, h: gap });
        alleys.push({ x: rightX - 12, y: gy, w: rightW + 12, h: gap });
      }
    }
    const brews = [
      { item: "potion_slow", label: "SLOW", price: 6, fill: "#7a3a9a", robe: "#241428", line: "TAR IN A BOTTLE" },
      { item: "potion_mend", label: "MEND", price: 8, fill: "#3ecf7a", robe: "#102820", line: "IT KNITS YOU" },
      { item: "potion_fly", label: "FLY", price: 14, fill: "#7ec8ff", robe: "#142030", line: "LEAVE THE STONES" },
      { item: "potion_mystery", label: "???", price: 10, fill: "#e85ad4", robe: "#2a1024", line: "DON'T ASK" },
    ];
    const spots = [
      { side: 0, gap: 0, brew: 0 },
      { side: 1, gap: 1, brew: 1 },
      { side: 0, gap: 2, brew: 2 },
      { side: 1, gap: 4, brew: 3 },
    ];
    const dealers = [];
    for (let i = 0; i < spots.length; i++) {
      const s = spots[i];
      const g = brews[s.brew];
      const gy = gaps[s.gap];
      const left = s.side === 0;
      dealers.push({
        x: left ? leftX + leftW - 78 : rightX + 52,
        y: gy + 14,
        face: left ? 1 : -1,
        mouth: left ? leftX + leftW + 2 : rightX - 4,
        mouthY: gy + ((gap / 2) | 0),
        item: g.item,
        label: g.label,
        price: g.price,
        fill: g.fill,
        robe: g.robe,
        line: g.line,
      });
    }
    const stalls = [];
    const goods = [
      { item: "olive", label: "OLIVES", price: 4, awning: "#c45a48", goods: "#6a8a38", robe: "#f4efe4" },
      { item: "roman_bread", label: "BREAD", price: 3, awning: "#c9a227", goods: "#e8c49a", robe: "#e8dcc8" },
      { item: "roman_wine", label: "WINE", price: 8, awning: "#6a3058", goods: "#7a2430", robe: "#d8c4a0" },
    ];
    for (let i = 0; i < 8; i++) {
      const y = 560 + i * ((bot - 620) / 8);
      const g = goods[i % 3];
      stalls.push(stallAt(STREET_X + 8, y, g));
      stalls.push(stallAt(STREET_X + STREET_W - 34, y + 40, goods[(i + 1) % 3]));
    }
    const people = [];
    for (let i = 0; i < 46; i++) {
      const side = i % 3 === 0 ? 0 : i % 2 ? 1 : -1;
      const y = 500 + ((i * 61) % (CITY_H - 780));
      const x = STREET_X + STREET_W / 2 + side * (50 + (i % 5) * 22);
      people.push({
        x: x,
        y: y,
        amp: side === 0 ? 70 : 16 + (i % 4) * 6,
        spd: 0.28 + (i % 5) * 0.05,
        phase: i * 1.3,
        col: TOGA[i % TOGA.length],
        line: TALK[i % TALK.length],
      });
    }
    const palaceFace = { x: 180, y: 36, w: CITY_W - 360, h: 300 };
    // Door sits in the south wall and sticks into the street, so the walk up
    // the avenue reaches it. The solid skips this rect.
    const palaceDoor = { x: STREET_X + STREET_W / 2 - 30, y: palaceFace.y + palaceFace.h - 36, w: 60, h: 48 };
    const palaceSolid = { x: palaceFace.x, y: palaceFace.y, w: palaceFace.w, h: palaceFace.h };
    return {
      blocks: blocks,
      alleys: alleys,
      dealers: dealers,
      stalls: stalls,
      people: people,
      palaceFace: palaceFace,
      palaceDoor: palaceDoor,
      palaceSolid: palaceSolid,
      portal: { x: STREET_X + STREET_W / 2 - 18, y: CITY_H - 120, w: 36, h: 28 },
      spawn: { x: STREET_X + STREET_W / 2, y: CITY_H - 160 },
      crowdAt: function (x, y, t) {
        for (let i = 0; i < people.length; i++) {
          const n = people[i];
          const px = n.x + Math.sin(t * n.spd + n.phase) * n.amp;
          const py = n.y + Math.cos(t * n.spd * 0.7 + n.phase) * (n.amp * 0.45);
          if (Math.abs(px - x) < 7 && Math.abs(py - y) < 8) return true;
        }
        return false;
      },
    };
  }

  function stallAt(x, y, g) {
    return {
      x: x,
      y: y,
      item: g.item,
      label: g.label,
      price: g.price,
      awning: g.awning,
      goods: g.goods,
      robe: g.robe,
      solid: { x: x, y: y + 6, w: 22, h: 10 },
    };
  }

  function buildPalace() {
    const solids = [];
    solids.push({ x: 0, y: 0, w: PALACE_W, h: 28 });
    solids.push({ x: 0, y: 0, w: 28, h: PALACE_H });
    solids.push({ x: PALACE_W - 28, y: 0, w: 28, h: PALACE_H });
    solids.push({ x: 0, y: PALACE_H - 28, w: PALACE_W / 2 - 36, h: 28 });
    solids.push({ x: PALACE_W / 2 + 36, y: PALACE_H - 28, w: PALACE_W / 2 - 36, h: 28 });
    const columns = [];
    for (let side = 0; side < 2; side++) {
      const x = side === 0 ? 70 : PALACE_W - 86;
      for (let i = 0; i < 8; i++) {
        const y = 70 + i * 90;
        columns.push({ x: x, y: y, w: 16, h: 28 });
        solids.push({ x: x, y: y, w: 16, h: 28 });
      }
    }
    return {
      solids: solids,
      columns: columns,
      exit: { x: PALACE_W / 2 - 30, y: PALACE_H - 32, w: 60, h: 30 },
    };
  }

  function buildBarracks() {
    const door = { x: BARRACKS_W / 2 - 18, y: 6, w: 36, h: 22 };
    const solids = [
      { x: 0, y: 0, w: door.x, h: 22 },
      { x: door.x + door.w, y: 0, w: BARRACKS_W - (door.x + door.w), h: 22 },
      { x: 0, y: 0, w: 16, h: BARRACKS_H },
      { x: BARRACKS_W - 16, y: 0, w: 16, h: BARRACKS_H },
      { x: 0, y: BARRACKS_H - 16, w: BARRACKS_W, h: 16 },
      { x: 36, y: 48, w: 70, h: 36 },
    ];
    return { solids: solids, door: door };
  }

  function fmt(ms) {
    const t = Math.max(0, Math.round(ms));
    const m = (t / 60000) | 0;
    const s = ((t % 60000) / 1000) | 0;
    const c = ((t % 1000) / 10) | 0;
    return m + ":" + String(s).padStart(2, "0") + "." + String(c).padStart(2, "0");
  }

  global.IsleRomeBuild = IsleRomeBuild;
})(typeof window !== "undefined" ? window : globalThis);
