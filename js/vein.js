/**
 * Hollow Vein — mountain dungeon for Islebound.
 * Loaded before game.js; installed via IsleVeinBuild(api).
 */
(function (global) {
  "use strict";

  const ROOM_W = 224;
  const ROOM_H = 152;
  const ROOM_COUNT = 14;
  const VEIN_W = ROOM_W * ROOM_COUNT;
  const VEIN_H = ROOM_H;
  const DOOR_Y = 56;
  const DOOR_H = 40;
  const MAX_MANA = 100;

  const SPELLS = [
    { id: "spark", name: "SPARK", cost: 0, cool: 0.42 },
    { id: "arc", name: "ARC", cost: 16, cool: 0.55 },
    { id: "shatter", name: "SHATTER", cost: 28, cool: 0.7 },
    { id: "bind", name: "BIND", cost: 20, cool: 0.65 },
  ];

  function IsleVeinBuild(api) {
    const A = api;
    const solids = [];
    const enemies = [];
    const lights = [];
    const hazards = [];
    const props = [];
    const doors = [];
    const chests = [];
    const keysGot = { bronze: false, silver: false, gold: false };
    let canvas = null;
    let exitPad = null;
    let islandDoor = null;
    let islandExit = null;
    let mountainKeep = null;
    let room = 0;
    let sealed = false;
    let script = null;
    let mana = MAX_MANA;
    let spellIx = 0;
    let tip = "";
    let tipT = 0;
    let boss = null;
    let lightMode = "idle";
    let lightPulse = 0;
    let entered = false;
    let heartTaken = false;
    let climbPads = [];
    let roomCleared = [];
    let trans = null;
    let checkpoint = { x: 28, y: ROOM_H - 40 };
    let hurtCool = 0;
    let seed = (Math.random() * 1e9) | 0;

    function flash(msg) {
      tip = String(msg || "").toUpperCase().slice(0, 32);
      tipT = 2.4;
      if (A.flashTip) A.flashTip(tip, tipT);
    }

    function hash(a, b) {
      return A.hash(a, b);
    }
    function irand(a, b) {
      return A.irand(a, b);
    }
    function pxi(g, x, y, w, h, col) {
      A.pxi(g, x, y, w, h, col);
    }
    function withInk(g, fn) {
      A.withInk(g, fn);
    }
    function drawPixText(t, x, y, c, al) {
      A.drawPixText(t, x, y, c, al);
    }

    function ox(r) {
      return (r | 0) * ROOM_W;
    }

    function spawnX(r) {
      return ox(r) + 28;
    }
    function spawnY() {
      return ROOM_H - 42;
    }

    function camFor(r) {
      const rx = ox(r);
      let cx;
      let cy;
      const viewW = A.viewW();
      const viewH = A.viewH();
      if (viewW >= ROOM_W) cx = rx - (viewW - ROOM_W) / 2;
      else cx = rx + Math.max(0, Math.min(ROOM_W - viewW, A.player.x - rx - viewW / 2));
      if (viewH >= ROOM_H) cy = -(viewH - ROOM_H) / 2;
      else cy = Math.max(0, Math.min(ROOM_H - viewH, A.player.y - viewH * 0.45));
      return { x: cx, y: cy };
    }

    function lockCam() {
      if (trans) return;
      const t = camFor(room);
      A.camera.x = t.x;
      A.camera.y = t.y;
    }

    function foot() {
      return { x: (A.player.x + A.player.w / 2) | 0, y: (A.player.y + A.player.h - 2) | 0 };
    }

    function onPad(pad, f) {
      return f.x >= pad.x && f.x < pad.x + pad.w && f.y >= pad.y && f.y < pad.y + pad.h;
    }

    function playerHits(r) {
      return A.playerHits(r);
    }

    function paintFloor(g, x0, y0, w, h) {
      for (let y = y0; y < y0 + h; y += 8) {
        for (let x = x0; x < x0 + w; x += 8) {
          const n = hash(x + 3, y + 11);
          let col = ((x / 8) | 0) % 2 === ((y / 8) | 0) % 2 ? "#2a3038" : "#232830";
          if (n > 0.88) col = "#343c46";
          if (n < 0.07) col = "#1a1e24";
          if (n > 0.96) col = "#2e4a42";
          pxi(g, x, y, 8, 8, col);
        }
      }
    }

    function paintShell(g, rx) {
      pxi(g, rx, 0, ROOM_W, 18, "#0e1014");
      pxi(g, rx, 0, 10, ROOM_H, "#0e1014");
      pxi(g, rx + ROOM_W - 10, 0, 10, ROOM_H, "#0e1014");
      pxi(g, rx, ROOM_H - 10, ROOM_W, 10, "#0e1014");
      paintFloor(g, rx + 10, 18, ROOM_W - 20, ROOM_H - 28);
      // wall brick lip
      for (let x = rx + 10; x < rx + ROOM_W - 10; x += 12) {
        pxi(g, x, 18, 11, 3, "#3a424c");
        pxi(g, x + 1, 19, 9, 1, "#4a5560");
      }
    }

    function addWall(x, y, w, h) {
      solids.push({ x, y, w, h });
    }

    function addLight(L) {
      lights.push(L);
    }

    function addEnemy(e) {
      enemies.push(e);
    }

    function paintTorch(g, x, y) {
      pxi(g, x, y, 3, 6, "#4a3a28");
      pxi(g, x + 1, y - 3, 1, 3, "#5ee8d0");
      pxi(g, x, y - 2, 3, 2, "#9af0e0");
    }

    function paintChest(g, x, y, tier) {
      const band = tier === "gold" ? "#c9a227" : tier === "silver" ? "#a8b8c8" : "#5a6a7a";
      pxi(g, x, y, 14, 10, "#5a3a1c");
      pxi(g, x + 1, y + 1, 12, 8, "#7a5230");
      pxi(g, x, y + 4, 14, 2, band);
      pxi(g, x + 6, y + 5, 2, 2, "#e8d080");
    }

    function paintStatue(g, x, y, lit) {
      pxi(g, x + 4, y + 28, 16, 6, "#2a3038");
      pxi(g, x + 6, y + 8, 12, 22, "#3a4450");
      pxi(g, x + 8, y, 8, 10, "#4a5562");
      pxi(g, x + 7, y + 2, 2, 2, lit ? "#5ee8d0" : "#1a1e24");
      pxi(g, x + 13, y + 2, 2, 2, lit ? "#5ee8d0" : "#1a1e24");
      pxi(g, x + 4, y + 12, 4, 10, "#323a44");
      pxi(g, x + 16, y + 12, 4, 10, "#323a44");
      if (lit) {
        pxi(g, x + 2, y + 14, 3, 3, "#5ee8d0");
        pxi(g, x + 19, y + 14, 3, 3, "#5ee8d0");
      }
    }

    function paintOrc(g, x, y) {
      /* baked decor only — live orcs drawn in drawLive */
      pxi(g, x, y, 8, 12, "#3a6a38");
    }

    function makeOrc(kind, x, y, roomId, opts) {
      opts = opts || {};
      const defs = {
        grunt: { hp: 3, spd: 48, dmg: 1, w: 10, h: 14, score: 12 },
        archer: { hp: 2, spd: 36, dmg: 1, w: 10, h: 14, score: 16 },
        shaman: { hp: 4, spd: 30, dmg: 1, w: 10, h: 14, score: 22 },
        shield: { hp: 5, spd: 28, dmg: 1, w: 12, h: 14, score: 20 },
        wisp: { hp: 2, spd: 55, dmg: 1, w: 8, h: 8, score: 14 },
        captain: { hp: 14, spd: 42, dmg: 1, w: 14, h: 16, score: 80 },
        warden: { hp: 16, spd: 40, dmg: 1, w: 14, h: 16, score: 90 },
        ulv: { hp: 28, spd: 46, dmg: 1, w: 16, h: 18, score: 200 },
      };
      const d = defs[kind] || defs.grunt;
      return {
        id: enemies.length,
        kind,
        x,
        y,
        w: d.w,
        h: d.h,
        hp: d.hp,
        maxHp: d.hp,
        spd: d.spd,
        room: roomId,
        hurt: 0,
        dead: false,
        facing: -1,
        aiT: hash(x, y) * 1.7,
        attackCool: 0.4 + hash(y, x) * 0.8,
        rooted: 0,
        elite: !!opts.elite || kind === "captain" || kind === "warden" || kind === "ulv",
        drop: opts.drop || null,
        phase: "idle",
        tele: 0,
        score: d.score,
      };
    }

    function resetRun() {
      room = 0;
      sealed = false;
      script = null;
      mana = MAX_MANA;
      spellIx = 0;
      boss = null;
      lightMode = "idle";
      lightPulse = 0;
      heartTaken = false;
      hurtCool = 0;
      keysGot.bronze = false;
      keysGot.silver = false;
      keysGot.gold = false;
      roomCleared = [];
      for (let i = 0; i < ROOM_COUNT; i++) roomCleared[i] = false;
      roomCleared[0] = true;
      checkpoint = { x: spawnX(0), y: spawnY() };
      for (let i = 0; i < enemies.length; i++) {
        const e = enemies[i];
        if (!e) continue;
        e.dead = false;
        e.hp = e.maxHp;
        e.hurt = 0;
        e.rooted = 0;
        e.phase = "idle";
        e.tele = 0;
      }
      for (let i = 0; i < chests.length; i++) {
        if (chests[i]) chests[i].open = false;
      }
      for (let i = 0; i < lights.length; i++) {
        const L = lights[i];
        if (!L) continue;
        L.on = !!L.always;
        L.flare = 0;
      }
      for (let i = 0; i < doors.length; i++) {
        const d = doors[i];
        if (d) d.sealed = false;
      }
      // clear vein-scene loot
      if (A.clearSceneLoot) A.clearSceneLoot("vein");
    }

    function bakeRoomContent(g, r, rx) {
      const midX = rx + ROOM_W / 2;

      // ambient cold torches (off until ceremony unless always)
      addLight({
        x: rx + 22,
        y: 28,
        r: 42,
        on: r === 0 || r === 5 || r === 12,
        always: r === 0 || r === 5 || r === 12,
        kind: "brazier",
        room: r,
        side: "left",
        flare: 0,
      });
      addLight({
        x: rx + ROOM_W - 26,
        y: 28,
        r: 42,
        on: r === 0 || r === 5 || r === 12,
        always: r === 0 || r === 5 || r === 12,
        kind: "brazier",
        room: r,
        side: "right",
        flare: 0,
      });

      if (r === 0) {
        // Vestibule
        pxi(g, rx + 48, 32, 128, 20, "#1a222c");
        withInk(g, () => {
          drawPixText("HOLLOW VEIN", midX | 0, 36, "#5ee8d0", "center");
          drawPixText("CLOAK DIES HERE", midX | 0, 48, "#8a9aaa", "center");
          drawPixText("1-4 SPELLS  SPACE CAST", midX | 0, 96, "#6a7a88", "center");
        });
        paintTorch(g, rx + 30, 40);
        paintTorch(g, rx + ROOM_W - 34, 40);
        props.push({ kind: "sign", x: rx + 60, y: 70, room: r });
        // starter potion
        chests.push({
          x: rx + 100,
          y: 100,
          w: 14,
          h: 10,
          room: r,
          tier: "wood",
          open: false,
          loot: ["potion_red"],
        });
        paintChest(g, rx + 100, 100, "wood");
      } else if (r === 1) {
        // Orc camp
        withInk(g, () => drawPixText("ORC CAMP", midX | 0, 28, "#c9a227", "center"));
        pxi(g, rx + 70, 88, 40, 8, "#3a2a18");
        pxi(g, rx + 78, 80, 24, 8, "#5a3a20");
        addEnemy(makeOrc("grunt", rx + 120, 70, r));
        addEnemy(makeOrc("grunt", rx + 150, 95, r));
        addEnemy(makeOrc("archer", rx + 170, 60, r));
        addLight({
          x: rx + midX - rx,
          y: 70,
          r: 36,
          on: false,
          kind: "camp",
          room: r,
          flare: 0,
        });
      } else if (r === 2) {
        // Spike throat
        withInk(g, () => drawPixText("SPIKE THROAT", midX | 0, 26, "#8ab0c8", "center"));
        for (let i = 0; i < 9; i++) {
          const sx = rx + 40 + i * 16;
          const sy = 72;
          pxi(g, sx + 2, sy, 4, 8, "#4a6a88");
          pxi(g, sx + 3, sy - 4, 2, 5, "#9ad0f0");
          hazards.push({ kind: "spike", x: sx, y: sy - 2, w: 8, h: 12, room: r, phase: i * 0.35 });
        }
        addEnemy(makeOrc("grunt", rx + 160, 100, r));
      } else if (r === 3) {
        // Barracks
        withInk(g, () => drawPixText("BARRACKS", midX | 0, 26, "#c9a227", "center"));
        for (let i = 0; i < 3; i++) {
          pxi(g, rx + 30 + i * 28, 40, 22, 14, "#2a3038");
          pxi(g, rx + 32 + i * 28, 42, 18, 5, "#4a3a28");
        }
        addEnemy(makeOrc("grunt", rx + 90, 80, r));
        addEnemy(makeOrc("shield", rx + 130, 85, r));
        addEnemy(makeOrc("grunt", rx + 160, 70, r));
        addEnemy(makeOrc("archer", rx + 175, 100, r));
      } else if (r === 4) {
        // Captain arena — cinematic
        withInk(g, () => drawPixText("CAPTAIN'S COURT", midX | 0, 24, "#e8c44a", "center"));
        pxi(g, rx + 72, 48, 80, 10, "#3a1a1a");
        pxi(g, rx + 76, 50, 72, 6, "#6a2020");
        paintStatue(g, rx + 96, 58, false);
        props.push({ kind: "statue", x: rx + 96, y: 58, room: r, boss: "captain" });
        addLight({
          x: rx + 36,
          y: 50,
          r: 50,
          on: false,
          kind: "dragon",
          room: r,
          side: "left",
          flare: 0,
        });
        addLight({
          x: rx + ROOM_W - 40,
          y: 50,
          r: 50,
          on: false,
          kind: "dragon",
          room: r,
          side: "right",
          flare: 0,
        });
        // captain spawned by script
      } else if (r === 5) {
        // Library / treasury
        withInk(g, () => drawPixText("ASH LIBRARY", midX | 0, 26, "#c9a227", "center"));
        pxi(g, rx + 28, 40, 20, 36, "#3a2a18");
        pxi(g, rx + 30, 42, 16, 8, "#8a3030");
        pxi(g, rx + 30, 52, 16, 8, "#306a40");
        pxi(g, rx + 30, 62, 16, 8, "#8a3030");
        pxi(g, rx + ROOM_W - 50, 40, 20, 36, "#3a2a18");
        chests.push({
          x: rx + 100,
          y: 90,
          w: 14,
          h: 10,
          room: r,
          tier: "silver",
          open: false,
          loot: ["potion_blue", "vein_gem", "potion_red"],
        });
        paintChest(g, rx + 100, 90, "silver");
        // teach arc via pickup tip
        props.push({ kind: "scroll", x: rx + 140, y: 88, room: r, spell: 1 });
        pxi(g, rx + 140, 88, 10, 8, "#e8d8a0");
        pxi(g, rx + 142, 90, 6, 1, "#3a2414");
      } else if (r === 6) {
        // Bridge / channel
        withInk(g, () => drawPixText("TEAL CHANNEL", midX | 0, 24, "#5ee8d0", "center"));
        for (let x = rx + 20; x < rx + ROOM_W - 20; x += 8) {
          pxi(g, x, 78, 8, 20, ((x / 8) | 0) % 2 ? "#0a3a48" : "#0e4858");
          hazards.push({ kind: "water", x, y: 78, w: 8, h: 20, room: r });
        }
        // bridge
        pxi(g, rx + 90, 74, 44, 10, "#4a5560");
        pxi(g, rx + 92, 76, 40, 6, "#5a6878");
        addEnemy(makeOrc("archer", rx + 40, 50, r));
        addEnemy(makeOrc("archer", rx + 170, 50, r));
        addEnemy(makeOrc("grunt", rx + 150, 105, r));
      } else if (r === 7) {
        // Shaman den
        withInk(g, () => drawPixText("SHAMAN DEN", midX | 0, 24, "#a080e0", "center"));
        pxi(g, rx + 88, 70, 48, 48, "#1a1428");
        for (let i = 0; i < 6; i++) {
          const ang = (i / 6) * Math.PI * 2;
          pxi(g, (rx + 112 + Math.cos(ang) * 20) | 0, (90 + Math.sin(ang) * 16) | 0, 4, 4, "#5ee8d0");
        }
        addEnemy(makeOrc("shaman", rx + 108, 85, r, { drop: "key_silver" }));
        addEnemy(makeOrc("wisp", rx + 60, 60, r));
        addEnemy(makeOrc("wisp", rx + 160, 70, r));
        addEnemy(makeOrc("wisp", rx + 140, 100, r));
      } else if (r === 8) {
        // Lever treasury (Ref D vibe)
        withInk(g, () => drawPixText("LEVER VAULT", midX | 0, 24, "#5ee8d0", "center"));
        paintStatue(g, rx + 96, 50, false);
        props.push({ kind: "statue", x: rx + 96, y: 50, room: r });
        props.push({ kind: "lever", x: rx + 170, y: 100, w: 8, h: 12, room: r, on: false });
        pxi(g, rx + 170, 100, 6, 10, "#6a7080");
        pxi(g, rx + 168, 98, 10, 3, "#8a90a0");
        for (let i = 0; i < 3; i++) {
          chests.push({
            x: rx + 40 + i * 28,
            y: 48,
            w: 14,
            h: 10,
            room: r,
            tier: i === 2 ? "gold" : "wood",
            open: false,
            locked: i === 2,
            loot: i === 2 ? ["potion_fury", "vein_gem", "crystal"] : ["gem", "potion_red"],
          });
          paintChest(g, rx + 40 + i * 28, 48, i === 2 ? "gold" : "wood");
        }
        // pressure plates
        for (let i = 0; i < 4; i++) {
          for (let j = 0; j < 4; j++) {
            const px0 = rx + 70 + j * 12;
            const py0 = 108 + i * 8;
            pxi(g, px0, py0, 10, 6, "#1a1e24");
            hazards.push({
              kind: "plate",
              x: px0,
              y: py0,
              w: 10,
              h: 6,
              room: r,
              idx: i * 4 + j,
            });
          }
        }
        addEnemy(makeOrc("shield", rx + 50, 90, r));
      } else if (r === 9) {
        // Acid prison
        withInk(g, () => drawPixText("ACID YARD", midX | 0, 24, "#6ad060", "center"));
        for (let y = 70; y < 120; y += 8) {
          for (let x = rx + 40; x < rx + 160; x += 8) {
            pxi(g, x, y, 8, 8, ((x + y) / 8) & 1 ? "#1a4a18" : "#2a6a20");
            hazards.push({ kind: "acid", x, y, w: 8, h: 8, room: r });
          }
        }
        // safe path stones
        const stones = [
          [28, 100],
          [50, 85],
          [78, 100],
          [110, 82],
          [140, 100],
          [168, 90],
        ];
        for (let i = 0; i < stones.length; i++) {
          const sx = rx + stones[i][0];
          const sy = stones[i][1];
          pxi(g, sx, sy, 14, 10, "#4a5560");
          hazards.push({ kind: "safe", x: sx, y: sy, w: 14, h: 10, room: r });
        }
        addEnemy(makeOrc("grunt", rx + 170, 50, r));
        addEnemy(makeOrc("archer", rx + 50, 50, r));
      } else if (r === 10) {
        // Warden mini-boss ceremony
        withInk(g, () => drawPixText("WARDEN PIT", midX | 0, 24, "#6ad060", "center"));
        paintStatue(g, rx + 96, 55, false);
        props.push({ kind: "statue", x: rx + 96, y: 55, room: r, boss: "warden" });
        addLight({
          x: rx + 32,
          y: 48,
          r: 52,
          on: false,
          kind: "dragon",
          room: r,
          side: "left",
          flare: 0,
        });
        addLight({
          x: rx + ROOM_W - 36,
          y: 48,
          r: 52,
          on: false,
          kind: "dragon",
          room: r,
          side: "right",
          flare: 0,
        });
      } else if (r === 11) {
        // Three-lock gate hall
        withInk(g, () => drawPixText("TRI-LOCK GATE", midX | 0, 24, "#e8c44a", "center"));
        pxi(g, rx + 90, 60, 44, 50, "#1a1e28");
        for (let i = 0; i < 3; i++) {
          const col = i === 0 ? "#b87333" : i === 1 ? "#c0c8d0" : "#c9a227";
          pxi(g, rx + 100 + i * 10, 78, 6, 10, col);
          props.push({
            kind: "keyhole",
            x: rx + 100 + i * 10,
            y: 78,
            w: 6,
            h: 10,
            room: r,
            key: i === 0 ? "bronze" : i === 1 ? "silver" : "gold",
            lit: false,
          });
        }
        addEnemy(makeOrc("shield", rx + 50, 90, r));
        addEnemy(makeOrc("shield", rx + 160, 90, r));
      } else if (r === 12) {
        // Ulv's Court — finale
        withInk(g, () => drawPixText("ULV'S COURT", midX | 0, 22, "#5ee8d0", "center"));
        pxi(g, rx + 60, 40, 104, 14, "#1a1420");
        pxi(g, rx + 68, 44, 88, 8, "#2a1a30");
        paintStatue(g, rx + 96, 52, false);
        props.push({ kind: "statue", x: rx + 96, y: 52, room: r, boss: "ulv" });
        for (let i = 0; i < 4; i++) {
          addLight({
            x: rx + 28 + (i % 2) * (ROOM_W - 56),
            y: 40 + ((i / 2) | 0) * 50,
            r: 48,
            on: false,
            kind: "dragon",
            room: r,
            side: i % 2 ? "right" : "left",
            flare: 0,
            breath: true,
          });
        }
        // loot piles painted
        pxi(g, rx + 40, 110, 10, 6, "#c9a227");
        pxi(g, rx + 170, 110, 10, 6, "#5ee8d0");
      } else if (r === 13) {
        // Heart chamber
        withInk(g, () => drawPixText("HEART CHAMBER", midX | 0, 28, "#e8c44a", "center"));
        pxi(g, rx + 96, 70, 32, 20, "#3a2a18");
        pxi(g, rx + 100, 60, 24, 16, "#5ee8d0");
        pxi(g, rx + 106, 64, 12, 10, "#e8fff8");
        props.push({ kind: "heart", x: rx + 100, y: 60, w: 24, h: 16, room: r });
        chests.push({
          x: rx + 60,
          y: 100,
          w: 14,
          h: 10,
          room: r,
          tier: "gold",
          open: false,
          loot: ["potion_gold", "vein_gem", "vein_gem", "crystal"],
        });
        paintChest(g, rx + 60, 100, "gold");
        chests.push({
          x: rx + 150,
          y: 100,
          w: 14,
          h: 10,
          room: r,
          tier: "gold",
          open: false,
          loot: ["potion_warp", "potion_fury", "gem"],
        });
        paintChest(g, rx + 150, 100, "gold");
      }
    }

    function bake() {
      canvas = document.createElement("canvas");
      canvas.width = VEIN_W;
      canvas.height = VEIN_H;
      const g = canvas.getContext("2d");
      g.imageSmoothingEnabled = false;
      pxi(g, 0, 0, VEIN_W, VEIN_H, "#080a0e");

      solids.length = 0;
      enemies.length = 0;
      lights.length = 0;
      hazards.length = 0;
      props.length = 0;
      doors.length = 0;
      chests.length = 0;

      for (let r = 0; r < ROOM_COUNT; r++) {
        const rx = ox(r);
        paintShell(g, rx);

        // vertical door gaps
        if (r === 0) {
          addWall(rx, 0, 10, ROOM_H);
        } else {
          addWall(rx, 0, 10, DOOR_Y);
          addWall(rx, DOOR_Y + DOOR_H, 10, ROOM_H - (DOOR_Y + DOOR_H));
          pxi(g, rx + 2, DOOR_Y, 6, DOOR_H, "#06080c");
        }

        if (r < ROOM_COUNT - 1) {
          const east = rx + ROOM_W - 10;
          addWall(east, 0, 10, DOOR_Y);
          addWall(east, DOOR_Y + DOOR_H, 10, ROOM_H - (DOOR_Y + DOOR_H));
          pxi(g, east + 2, DOOR_Y, 6, DOOR_H, "#06080c");
          doors.push({
            x: east,
            y: DOOR_Y,
            w: 10,
            h: DOOR_H,
            from: r,
            to: r + 1,
            sealed: false,
          });
        } else {
          addWall(rx + ROOM_W - 10, 0, 10, ROOM_H);
        }

        addWall(rx + 10, 0, ROOM_W - 20, 18);
        if (r === 0) {
          const exitX = rx + 40;
          addWall(rx + 10, ROOM_H - 10, exitX - (rx + 10), 10);
          addWall(exitX + 16, ROOM_H - 10, rx + ROOM_W - 10 - (exitX + 16), 10);
          pxi(g, exitX - 2, ROOM_H - 18, 20, 3, "#5a4630");
          pxi(g, exitX, ROOM_H - 14, 16, 14, "#060404");
          exitPad = { x: exitX, y: ROOM_H - 16, w: 16, h: 14 };
        } else {
          addWall(rx + 10, ROOM_H - 10, ROOM_W - 20, 10);
        }

        bakeRoomContent(g, r, rx);
      }

      // bronze key from captain
      resetRun();
    }

    function paintPeak(g, x, y, w, h, door) {
      // layered mountain silhouette
      pxi(g, x, y + h * 0.35, w, h * 0.65, "#3a4248");
      pxi(g, x + w * 0.08, y + h * 0.2, w * 0.84, h * 0.5, "#4a5460");
      // peak
      const px0 = x + w * 0.5;
      pxi(g, px0 - 18, y + 8, 36, h * 0.4, "#5a6570");
      pxi(g, px0 - 10, y, 20, 16, "#8a949e");
      pxi(g, px0 - 6, y + 2, 12, 8, "#d0d8e0");
      // rocky ribs
      for (let i = 0; i < 5; i++) {
        const rx = x + 10 + i * ((w - 20) / 5);
        pxi(g, rx, y + h * 0.45 + (i % 2) * 6, 8, h * 0.4, "#2e363e");
      }
      // climb ledges (visual)
      for (let i = 0; i < 4; i++) {
        const ly = y + h - 18 - i * 14;
        const lx = x + 20 + (i % 2) * 30;
        pxi(g, lx, ly, 28, 4, "#6a7480");
        pxi(g, lx + 1, ly + 1, 26, 2, "#8a949e");
      }
      if (door) {
        pxi(g, door.x, door.y, door.w, door.h, "#0a0806");
        pxi(g, door.x - 2, door.y - 4, door.w + 4, 4, "#2a2420");
        pxi(g, door.x + 2, door.y + 4, 3, 3, "#5ee8d0");
      }
    }

    function placeMountains(bldgCanvas, bldgOX, bldgOY, islandSolids, walkPads, keepouts, trees, palms) {
      const TILE = A.TILE;
      // North spine — west of temple band
      const midC = 210;
      const midX = midC * TILE;
      const cliff = A.northCliffY(midX);
      const rest = A.restShoreY(midX);
      const depth = Math.max(80, rest - cliff);

      // three peaks
      const peaks = [
        { x: midX - 120, y: cliff + 20, w: 70, h: 78, door: false },
        { x: midX - 40, y: cliff + 8, w: 90, h: 96, door: false },
        { x: midX + 40, y: cliff + Math.max(36, (depth * 0.12) | 0), w: 110, h: 108, door: true },
      ];
      const main = peaks[2];
      const door = {
        x: main.x + ((main.w / 2 - 7) | 0),
        y: main.y + main.h - 22,
        w: 14,
        h: 16,
      };

      // solids — leave climb corridor
      for (let i = 0; i < peaks.length; i++) {
        const p = peaks[i];
        if (p.door) {
          islandSolids.push({ x: p.x, y: p.y, w: p.w, h: door.y - p.y });
          islandSolids.push({ x: p.x, y: door.y, w: door.x - p.x, h: door.h });
          islandSolids.push({
            x: door.x + door.w,
            y: door.y,
            w: p.x + p.w - (door.x + door.w),
            h: door.h,
          });
        } else {
          islandSolids.push({ x: p.x + 8, y: p.y + 10, w: p.w - 16, h: p.h - 24 });
        }
      }

      // switchback climb pads up to door
      climbPads = [];
      const baseY = main.y + main.h + 4;
      const path = [
        { x: main.x + 10, y: baseY, w: 40, h: 10 },
        { x: main.x + 36, y: baseY - 16, w: 36, h: 10 },
        { x: main.x + 18, y: baseY - 32, w: 36, h: 10 },
        { x: main.x + 42, y: baseY - 48, w: 40, h: 10 },
        { x: door.x - 10, y: door.y + door.h - 2, w: door.w + 20, h: 12 },
      ];
      for (let i = 0; i < path.length; i++) {
        climbPads.push(path[i]);
        walkPads.push(path[i]);
      }

      keepouts.push({
        x: peaks[0].x - 12,
        y: cliff,
        w: peaks[2].x + peaks[2].w - peaks[0].x + 24,
        h: 140,
      });
      mountainKeep = keepouts[keepouts.length - 1];

      islandDoor = { x: door.x, y: door.y, w: door.w, h: door.h };
      islandExit = {
        x: door.x + (((door.w - 8) / 2) | 0),
        y: door.y + door.h + 4,
      };

      // paint onto building canvas
      const pad = 20;
      const nx0 = Math.min(bldgOX, peaks[0].x - pad);
      const ny0 = Math.min(bldgOY, cliff - 8);
      const nx1 = Math.max(
        bldgOX + (bldgCanvas ? bldgCanvas.width : 0),
        peaks[2].x + peaks[2].w + pad
      );
      const ny1 = Math.max(
        bldgOY + (bldgCanvas ? bldgCanvas.height : 0),
        main.y + main.h + 24
      );
      const nc = document.createElement("canvas");
      nc.width = Math.max(1, nx1 - nx0);
      nc.height = Math.max(1, ny1 - ny0);
      const ng = nc.getContext("2d");
      ng.imageSmoothingEnabled = false;
      if (bldgCanvas) ng.drawImage(bldgCanvas, bldgOX - nx0, bldgOY - ny0);
      for (let i = 0; i < peaks.length; i++) {
        const p = peaks[i];
        paintPeak(
          ng,
          p.x - nx0,
          p.y - ny0,
          p.w,
          p.h,
          p.door
            ? { x: door.x - nx0, y: door.y - ny0, w: door.w, h: door.h }
            : null
        );
      }
      // smaller foothill rocks
      for (let i = 0; i < 8; i++) {
        const rx = peaks[0].x - nx0 + hash(i, 9) * 200;
        const ry = main.y - ny0 + main.h - 20 + hash(i, 3) * 16;
        pxi(ng, rx, ry, 10 + hash(i, 2) * 8, 8, "#3a444c");
      }

      // clear trees on mountain footprint
      for (let i = trees.length - 1; i >= 0; i--) {
        const t = trees[i];
        if (
          t.x > peaks[0].x - 8 &&
          t.x < peaks[2].x + peaks[2].w + 8 &&
          t.y > cliff &&
          t.y < main.y + main.h + 30
        ) {
          trees.splice(i, 1);
        }
      }
      for (let i = palms.length - 1; i >= 0; i--) {
        const p = palms[i];
        if (
          p.x > peaks[0].x - 8 &&
          p.x < peaks[2].x + peaks[2].w + 8 &&
          p.y > cliff &&
          p.y < main.y + main.h + 30
        ) {
          palms.splice(i, 1);
        }
      }

      bake();
      seed = (Math.random() * 1e9) | 0;

      return { canvas: nc, ox: nx0, oy: ny0 };
    }

    function aliveInRoom(r) {
      let n = 0;
      for (let i = 0; i < enemies.length; i++) {
        const e = enemies[i];
        if (e && e.room === r && !e.dead) n++;
      }
      return n;
    }

    function markCleared(r) {
      if (roomCleared[r]) return;
      roomCleared[r] = true;
      checkpoint = { x: spawnX(r), y: spawnY() };
      flash("DOOR OPENS");
      for (let i = 0; i < lights.length; i++) {
        const L = lights[i];
        if (L.room === r) {
          L.on = true;
          L.flare = 0.5;
        }
      }
      lightMode = "victory";
      lightPulse = 0.8;
    }

    function sealRoom(r) {
      sealed = true;
      for (let i = 0; i < doors.length; i++) {
        const d = doors[i];
        if (d.from === r || d.to === r) d.sealed = true;
      }
      // also seal west door visually via solid inject
      flash("GATES SEAL");
      A.shake(8);
    }

    function unsealRoom(r) {
      sealed = false;
      for (let i = 0; i < doors.length; i++) {
        const d = doors[i];
        if (d.from === r || d.to === r) d.sealed = false;
      }
    }

    function beginCeremony(bossKind) {
      if (script) return;
      sealRoom(room);
      script = {
        kind: "ceremony",
        boss: bossKind,
        t: 0,
        stage: "blackout",
        lit: 0,
      };
      lightMode = "blackout";
      // extinguish
      for (let i = 0; i < lights.length; i++) {
        if (lights[i].room === room) lights[i].on = false;
      }
    }

    function spawnBoss(kind) {
      const rx = ox(room);
      const e = makeOrc(kind, rx + ROOM_W / 2 - 6, 78, room, {
        drop: kind === "captain" ? "key_bronze" : kind === "warden" ? "key_gold" : "mountain_heart",
      });
      addEnemy(e);
      boss = e;
      flash(kind === "ulv" ? "WARLORD ULV" : kind === "warden" ? "THE WARDEN" : "CAPTAIN GRAK");
      A.shake(10);
    }

    function updateScript(dt) {
      if (!script) return;
      script.t += dt;
      if (script.kind === "ceremony") {
        if (script.stage === "blackout") {
          if (script.t > 0.25) {
            script.stage = "ignite";
            script.t = 0;
            script.lit = 0;
            flash("SOULFIRE IGNITES");
          }
        } else if (script.stage === "ignite") {
          const sideLights = lights.filter((L) => L.room === room && (L.kind === "dragon" || L.kind === "brazier"));
          sideLights.sort((a, b) => a.x - b.x);
          const need = Math.min(sideLights.length, 1 + (script.t / 0.22) | 0);
          while (script.lit < need && script.lit < sideLights.length) {
            sideLights[script.lit].on = true;
            sideLights[script.lit].flare = 1;
            script.lit++;
            A.shake(3);
          }
          if (script.lit >= sideLights.length && script.t > sideLights.length * 0.22 + 0.35) {
            script.stage = "awaken";
            script.t = 0;
            lightMode = "flare";
            flash("THE COURT AWAKENS");
          }
        } else if (script.stage === "awaken") {
          if (script.t > 0.55) {
            spawnBoss(script.boss);
            script.stage = "fight";
            script.t = 0;
            lightMode = "combat";
          }
        } else if (script.stage === "fight") {
          if (boss && boss.dead) {
            script.stage = "done";
            unsealRoom(room);
            markCleared(room);
            if (boss.drop) grantDrop(boss.drop, boss.x, boss.y);
            boss = null;
            script = null;
            lightMode = "victory";
            lightPulse = 1.2;
          } else if (boss && boss.hp < boss.maxHp * 0.5) {
            lightMode = "violet";
          }
          // rage breath telegraphs
          if (boss && !boss.dead && boss.kind === "ulv" && script.t > 2) {
            lightPulse = 1;
            script.t = 0;
            // spawn breath hazards briefly
            for (let i = 0; i < lights.length; i++) {
              const L = lights[i];
              if (L.room === room && L.breath) {
                L.flare = 1;
                hazards.push({
                  kind: "breath",
                  x: L.side === "left" ? L.x : L.x - 80,
                  y: L.y + 8,
                  w: 80,
                  h: 6,
                  room,
                  life: 0.85,
                });
              }
            }
            flash("DRAGON BREATH");
          }
        }
      }
    }

    function grantDrop(id, x, y) {
      if (id === "key_bronze") {
        keysGot.bronze = true;
        flash("BRONZE KEY");
      } else if (id === "key_silver") {
        keysGot.silver = true;
        flash("SILVER KEY");
      } else if (id === "key_gold") {
        keysGot.gold = true;
        flash("GOLD KEY");
      }
      if (A.spawnLoot) A.spawnLoot(id, x, y - 4, "vein");
      else if (A.addToInventory) A.addToInventory(id);
    }

    function openChest(c) {
      if (c.open) return;
      if (c.locked && !keysGot.gold) {
        flash("NEEDS GOLD KEY");
        return;
      }
      c.open = true;
      const loot = c.loot || ["gem"];
      for (let i = 0; i < loot.length; i++) {
        if (A.spawnLoot) A.spawnLoot(loot[i], c.x + i * 6, c.y - 6 - i * 4, "vein");
        else A.addToInventory(loot[i]);
      }
      flash("CHEST!");
      A.shake(4);
    }

    function tryInteract() {
      // chests
      for (let i = 0; i < chests.length; i++) {
        const c = chests[i];
        if (!c || c.room !== room || c.open) continue;
        if (Math.hypot(A.player.x + 4 - (c.x + 7), A.player.y + 8 - (c.y + 5)) < 18) {
          openChest(c);
          return true;
        }
      }
      // lever
      for (let i = 0; i < props.length; i++) {
        const p = props[i];
        if (!p || p.room !== room) continue;
        if (p.kind === "lever" && Math.hypot(A.player.x - p.x, A.player.y - p.y) < 18) {
          p.on = !p.on;
          flash(p.on ? "LEVER ON" : "LEVER OFF");
          // unlock nearby wood chests spikes slow
          for (let h = 0; h < hazards.length; h++) {
            if (hazards[h].room === room && hazards[h].kind === "spike") {
              hazards[h].frozen = p.on ? 8 : 0;
            }
          }
          return true;
        }
        if (p.kind === "scroll" && Math.hypot(A.player.x - p.x, A.player.y - p.y) < 16) {
          spellIx = p.spell | 0;
          flash("LEARNED " + SPELLS[spellIx].name);
          p.kind = "scroll_used";
          return true;
        }
        if (p.kind === "heart" && !heartTaken && Math.hypot(A.player.x - p.x, A.player.y - p.y) < 20) {
          heartTaken = true;
          grantDrop("mountain_heart", p.x, p.y);
          if (A.gainXp) A.gainXp(120);
          flash("HEART OF THE MOUNTAIN");
          return true;
        }
        if (p.kind === "keyhole") {
          const have = keysGot[p.key];
          if (have && !p.lit) {
            p.lit = true;
            flash(p.key.toUpperCase() + " LOCK");
            A.shake(3);
            const all = props.filter((q) => q.kind === "keyhole" && q.room === room);
            if (all.every((q) => q.lit)) {
              markCleared(room);
              flash("GATE UNBOUND");
            }
            return true;
          }
        }
      }
      return false;
    }

    function hurtPlayerVein(msg) {
      if (A.player.dead > 0 || hurtCool > 0) return;
      A.hurtPlayer();
      hurtCool = 0.85;
      A.shake(7);
      lightMode = "drain";
      lightPulse = 0.5;
      if (msg) flash(msg);
    }

    function updateHazards(dt) {
      const f = foot();
      // spikes
      for (let i = 0; i < hazards.length; i++) {
        const h = hazards[i];
        if (!h || h.room !== room) continue;
        if (h.kind === "breath") {
          h.life -= dt;
          if (h.life <= 0) {
            hazards.splice(i, 1);
            i--;
            continue;
          }
          if (onPad(h, f)) hurtPlayerVein("BREATH!");
          continue;
        }
        if (h.kind === "spike") {
          if (h.frozen > 0) {
            h.frozen -= dt;
            continue;
          }
          const up = Math.sin(A.time() * 3 + h.phase) > 0.15;
          if (up && onPad(h, f)) hurtPlayerVein("SPIKES!");
        }
        if (h.kind === "water" && onPad(h, f)) {
          // slow handled in move — mild damage edge
        }
        if (h.kind === "acid") {
          let safe = false;
          for (let j = 0; j < hazards.length; j++) {
            const s = hazards[j];
            if (s.kind === "safe" && s.room === room && onPad(s, f)) {
              safe = true;
              break;
            }
          }
          if (!safe && onPad(h, f)) hurtPlayerVein("ACID!");
        }
      }
    }

    function updateEnemy(e, dt) {
      if (e.dead || e.room !== room) return;
      if (e.hurt > 0) e.hurt = Math.max(0, e.hurt - dt);
      if (e.rooted > 0) {
        e.rooted = Math.max(0, e.rooted - dt);
        return;
      }
      e.aiT += dt;
      e.attackCool = Math.max(0, e.attackCool - dt);
      const pcx = A.player.x + A.player.w / 2;
      const pcy = A.player.y + A.player.h / 2;
      const ecx = e.x + e.w / 2;
      const ecy = e.y + e.h / 2;
      const dx = pcx - ecx;
      const dy = pcy - ecy;
      const dist = Math.hypot(dx, dy) || 1;
      e.facing = dx >= 0 ? 1 : -1;

      if (e.kind === "archer") {
        if (dist > 70) {
          e.x += (dx / dist) * e.spd * 0.5 * dt;
          e.y += (dy / dist) * e.spd * 0.35 * dt;
        } else if (dist < 50) {
          e.x -= (dx / dist) * e.spd * 0.4 * dt;
        }
        if (e.attackCool <= 0 && dist < 120) {
          e.attackCool = 1.4;
          // rock bolt as hazard
          hazards.push({
            kind: "breath",
            x: ecx,
            y: ecy,
            w: 6,
            h: 6,
            room,
            life: 0.9,
            vx: (dx / dist) * 110,
            vy: (dy / dist) * 90,
            moving: true,
          });
        }
      } else if (e.kind === "wisp") {
        e.x += Math.cos(e.aiT * 2.2 + e.id) * e.spd * dt;
        e.y += Math.sin(e.aiT * 1.7 + e.id) * e.spd * 0.7 * dt;
        // drift toward player slowly
        e.x += (dx / dist) * 20 * dt;
        e.y += (dy / dist) * 16 * dt;
      } else if (e.kind === "shaman") {
        if (dist < 90) {
          e.x -= (dx / dist) * e.spd * dt;
          e.y -= (dy / dist) * e.spd * 0.6 * dt;
        }
        if (e.attackCool <= 0) {
          e.attackCool = 2.2;
          // heal nearest ally
          let best = null;
          let bd = 999;
          for (let i = 0; i < enemies.length; i++) {
            const o = enemies[i];
            if (!o || o.dead || o.room !== room || o === e) continue;
            const d = Math.hypot(o.x - e.x, o.y - e.y);
            if (d < bd && o.hp < o.maxHp) {
              bd = d;
              best = o;
            }
          }
          if (best) {
            best.hp = Math.min(best.maxHp, best.hp + 1);
            flash("SHAMAN HEALS");
          } else {
            addEnemy(makeOrc("wisp", e.x + 10, e.y, room));
          }
        }
      } else if (e.kind === "shield") {
        // face player, advance slowly
        e.x += (dx / dist) * e.spd * dt;
        e.y += (dy / dist) * e.spd * 0.7 * dt;
      } else {
        // grunt / bosses
        const spd =
          e.elite && e.hp < e.maxHp * 0.4 ? e.spd * 1.25 : e.spd;
        e.x += (dx / dist) * spd * dt;
        e.y += (dy / dist) * spd * 0.75 * dt;
        if (e.elite && e.attackCool <= 0 && dist < 36) {
          e.attackCool = 1.1;
          e.tele = 0.35;
          lightPulse = 0.6;
        }
      }

      // clamp in room
      const rx = ox(room);
      e.x = Math.max(rx + 12, Math.min(rx + ROOM_W - e.w - 12, e.x));
      e.y = Math.max(22, Math.min(ROOM_H - e.h - 12, e.y));

      // contact damage
      if (e.tele > 0) {
        e.tele -= dt;
        if (e.tele <= 0 && dist < 28) hurtPlayerVein("SLAM!");
      } else if (dist < 12 + e.w * 0.3) {
        if (e.attackCool <= 0) {
          e.attackCool = e.elite ? 0.9 : 0.7;
          hurtPlayerVein();
          // knockback light
          A.player.x += e.facing * 6;
        }
      }
    }

    function updateMovingHazards(dt) {
      for (let i = 0; i < hazards.length; i++) {
        const h = hazards[i];
        if (!h || !h.moving) continue;
        h.x += (h.vx || 0) * dt;
        h.y += (h.vy || 0) * dt;
        h.life -= dt;
        if (h.life <= 0) {
          hazards.splice(i, 1);
          i--;
          continue;
        }
        if (onPad({ x: h.x, y: h.y, w: h.w, h: h.h }, foot())) hurtPlayerVein("HIT!");
      }
    }

    function beginTrans(toRoom) {
      if (trans || sealed) return;
      if (toRoom > room && !roomCleared[room] && aliveInRoom(room) > 0) {
        flash("CLEAR THE ROOM");
        return;
      }
      if (toRoom === 12 && !(keysGot.bronze && keysGot.silver && keysGot.gold) && room === 11) {
        // need tri-lock cleared
        if (!roomCleared[11]) {
          flash("THREE KEYS");
          return;
        }
      }
      const from = room;
      const cam0 = { x: A.camera.x, y: A.camera.y };
      room = toRoom;
      const cam1 = camFor(toRoom);
      room = from;
      const east = toRoom > from;
      trans = {
        from,
        to: toRoom,
        t: 0,
        dur: 0.5,
        cam0x: cam0.x,
        cam0y: cam0.y,
        cam1x: cam1.x,
        cam1y: cam1.y,
        px0: A.player.x,
        py0: A.player.y,
        px1: east ? ox(toRoom) + 22 : ox(toRoom) + ROOM_W - 36,
        py1: Math.max(50, Math.min(ROOM_H - 36, A.player.y)),
      };
    }

    function updateTrans(dt) {
      if (!trans) return false;
      trans.t += dt;
      const u = Math.min(1, trans.t / trans.dur);
      const e = u * u * (3 - 2 * u);
      A.camera.x = trans.cam0x + (trans.cam1x - trans.cam0x) * e;
      A.camera.y = trans.cam0y + (trans.cam1y - trans.cam0y) * e;
      A.player.x = trans.px0 + (trans.px1 - trans.px0) * e;
      A.player.y = trans.py0 + (trans.py1 - trans.py0) * e;
      if (u >= 1) {
        room = trans.to;
        checkpoint = { x: trans.px1, y: trans.py1 };
        trans = null;
        lockCam();
        lightMode = "idle";
        maybeTriggerRoom();
      }
      return true;
    }

    function maybeTriggerRoom() {
      if (roomCleared[room]) return;
      // ceremony rooms
      if (room === 4 && !script && aliveInRoom(4) === 0) {
        beginCeremony("captain");
        return;
      }
      if (room === 10 && !script) {
        beginCeremony("warden");
        return;
      }
      if (room === 12 && !script) {
        beginCeremony("ulv");
        return;
      }
      // normal combat rooms — soft seal while enemies live
      if (aliveInRoom(room) > 0 && room !== 0 && room !== 5 && room !== 13) {
        sealed = true;
        for (let i = 0; i < doors.length; i++) {
          const d = doors[i];
          if (d.from === room) d.sealed = true;
        }
        // ignite ambient
        for (let i = 0; i < lights.length; i++) {
          if (lights[i].room === room) {
            lights[i].on = true;
            lights[i].flare = 0.4;
          }
        }
        lightMode = "combat";
        if (room === 1 || room === 3) flash("FIGHT");
      }
    }

    function checkRoomClear() {
      if (roomCleared[room] || script) return;
      if (room === 0 || room === 5 || room === 13 || room === 11) return;
      if (room === 4 || room === 10 || room === 12) return; // bosses via script
      if (aliveInRoom(room) === 0) {
        unsealRoom(room);
        markCleared(room);
        // chance potion drop
        if (hash(room, seed) > 0.45 && A.spawnLoot) {
          A.spawnLoot("potion_red", ox(room) + ROOM_W / 2, 80, "vein");
        }
      }
    }

    function hurtEnemy(e, dmg, spell) {
      if (!e || e.dead) return false;
      // shield reflects spark from front
      if (e.kind === "shield" && spell === "spark") {
        const pcx = A.player.x + A.player.w / 2;
        const ecx = e.x + e.w / 2;
        if ((pcx - ecx) * e.facing > 0) {
          flash("BLOCKED");
          return false;
        }
      }
      if (e.kind === "wisp" && spell === "bind") return false;
      e.hp -= dmg;
      e.hurt = 0.28;
      lightPulse = Math.max(lightPulse, 0.35);
      lightMode = "flicker";
      A.shake(e.elite ? 6 : 3);
      if (spell === "bind") e.rooted = 1.2;
      if (e.hp <= 0) {
        e.hp = 0;
        e.dead = true;
        if (A.gainXp) A.gainXp(e.score | 0);
        if (e.drop) grantDrop(e.drop, e.x, e.y);
        else if (hash(e.x | 0, e.y | 0) > 0.72 && A.spawnLoot) {
          A.spawnLoot(hash(e.id, room) > 0.5 ? "gem" : "vein_gem", e.x, e.y, "vein");
        }
        if (boss === e) {
          /* script handles */
        }
        return true;
      }
      return true;
    }

    function fireSpell() {
      if (A.player.dead > 0 || A.getWandCool() > 0) return false;
      const sp = SPELLS[spellIx] || SPELLS[0];
      if (mana < sp.cost) {
        flash("NO MANA");
        return false;
      }
      mana = Math.max(0, mana - sp.cost);
      A.setWandCool(sp.cool);
      const face = A.player.facing;
      const ox0 = A.player.x + A.player.w / 2 + face * 4;
      const oy0 = A.player.y + 3;
      const bolts = A.wandBolts;

      function pushBolt(vx, vy, life, dmg, spell, rad) {
        bolts.push({
          x: ox0,
          y: oy0,
          vx,
          vy,
          life: life || 0.55,
          max: life || 0.55,
          dmg: dmg || 1,
          spell: spell || "spark",
          rad: rad || 9,
          vein: true,
        });
      }

      if (sp.id === "spark") {
        pushBolt(face * 220, -10, 0.55, 1, "spark");
      } else if (sp.id === "arc") {
        pushBolt(face * 200, -28, 0.5, 1, "arc");
        pushBolt(face * 210, -8, 0.55, 1, "arc");
        pushBolt(face * 200, 12, 0.5, 1, "arc");
      } else if (sp.id === "shatter") {
        pushBolt(face * 140, -6, 0.7, 1, "shatter", 8);
      } else if (sp.id === "bind") {
        pushBolt(face * 180, -8, 0.6, 1, "bind");
      }
      A.useFxWand && A.useFxWand();
      lightPulse = Math.max(lightPulse, 0.25);
      return true;
    }

    function updateBolts(dt) {
      const bolts = A.wandBolts;
      for (let i = bolts.length - 1; i >= 0; i--) {
        const p = bolts[i];
        if (!p.vein) continue;
        // shatter pops
        if (p.spell === "shatter" && p.life < 0.15 && !p.popped) {
          p.popped = true;
          for (let j = 0; j < enemies.length; j++) {
            const e = enemies[j];
            if (!e || e.dead || e.room !== room) continue;
            if (Math.hypot(p.x - (e.x + e.w / 2), p.y - (e.y + e.h / 2)) < 28) {
              hurtEnemy(e, 2, "shatter");
            }
          }
          A.shake(5);
          lightPulse = 0.7;
        }
        for (let j = 0; j < enemies.length; j++) {
          const e = enemies[j];
          if (!e || e.dead || e.room !== room) continue;
          if (Math.hypot(p.x - (e.x + e.w / 2), p.y - (e.y + e.h / 2)) < (p.rad || 9)) {
            if (hurtEnemy(e, p.dmg || 1, p.spell)) {
              // mana on kill trickle
              if (e.dead) mana = Math.min(MAX_MANA, mana + 8);
              bolts.splice(i, 1);
              break;
            }
          }
        }
      }
    }

    function onEnter() {
      entered = true;
      if (A.setCloak) A.setCloak(false);
      resetRun();
      A.player.x = spawnX(0);
      A.player.y = spawnY();
      room = 0;
      lockCam();
      flash("CLOAK WITHERS");
      mana = MAX_MANA;
    }

    function clampToRoom() {
      const rx = ox(room);
      A.player.x = Math.max(rx + 12, Math.min(rx + ROOM_W - A.player.w - 12, A.player.x));
      A.player.y = Math.max(20, Math.min(ROOM_H - A.player.h - 10, A.player.y));
    }

    function syncRoomFromPos() {
      if (trans) return;
      const want = Math.max(0, Math.min(ROOM_COUNT - 1, (A.player.x / ROOM_W) | 0));
      if (want === room) {
        if (sealed) clampToRoom();
        return;
      }
      // Block leaving while sealed / uncleared combat
      if (sealed || (!roomCleared[room] && aliveInRoom(room) > 0 && want > room)) {
        clampToRoom();
        if (want > room) flash("CLEAR THE ROOM");
        return;
      }
      if (want === 12 && !(keysGot.bronze && keysGot.silver && keysGot.gold) && !roomCleared[11]) {
        // Still allow entering room 11; gate to 12 is the tri-lock room itself
        if (want > 11 && !roomCleared[11]) {
          clampToRoom();
          flash("THREE KEYS");
          return;
        }
      }
      // Already crossed the threshold — snap room (camera eases via lockCam)
      const prev = room;
      room = want;
      checkpoint = { x: A.player.x, y: A.player.y };
      lightMode = "idle";
      if (want > prev || want < prev) maybeTriggerRoom();
    }

    function update(dt) {
      if (A.getScene() !== "vein") return;
      if (tipT > 0) tipT = Math.max(0, tipT - dt);
      if (hurtCool > 0) hurtCool = Math.max(0, hurtCool - dt);
      if (lightPulse > 0) lightPulse = Math.max(0, lightPulse - dt);
      mana = Math.min(MAX_MANA, mana + dt * 4.5);

      if (updateTrans(dt)) return;

      syncRoomFromPos();
      if (trans) return;

      updateScript(dt);
      updateHazards(dt);
      updateMovingHazards(dt);

      for (let i = 0; i < enemies.length; i++) updateEnemy(enemies[i], dt);
      checkRoomClear();

      if (sealed) clampToRoom();
      lockCam();
    }

    function drawLights(cpos, t) {
      for (let i = 0; i < lights.length; i++) {
        const L = lights[i];
        if (!L || L.room !== room) continue;
        const on = L.on || L.flare > 0;
        if (!on && lightMode === "blackout") continue;
        const x = (L.x - cpos.x) | 0;
        const y = (L.y - cpos.y) | 0;
        let col = "#5ee8d0";
        if (lightMode === "violet") col = "#c090f0";
        if (lightMode === "drain") col = "#6ad060";
        if (lightMode === "victory") col = "#e8c44a";
        if (lightMode === "flicker" && ((t * 20) | 0) % 2 === 0) col = "#1a1e24";
        const flare = Math.max(L.on ? 0.55 : 0, L.flare) + lightPulse * 0.4;
        if (L.flare > 0) L.flare = Math.max(0, L.flare - 0.016);
        if (!L.on && flare <= 0) continue;
        // pixel glow
        const R = (L.r * (0.5 + flare * 0.5)) | 0;
        A.px(x - 1, y - 2, 3, 3, col);
        A.px(x - 2, y - 4, 5, 2, col);
        if (L.kind === "dragon") {
          A.px(x - 3, y, 8, 4, "#3a4450");
          A.px(x - 1, y + 2, 4, 2, col);
        }
        // soft floor pool via rects
        const a = 0.08 + flare * 0.12;
        A.px(x - R / 2, y + 10, R, 3, col === "#5ee8d0" ? "rgba(94,232,208,0.12)" : "rgba(200,160,240,0.1)");
      }
    }

    function drawEnemy(cpos, e, t) {
      if (e.dead || e.room !== room) return;
      const x = (e.x - cpos.x) | 0;
      const y = (e.y - cpos.y) | 0;
      const flash = e.hurt > 0 && ((t * 18) | 0) % 2 === 0;
      if (e.kind === "wisp") {
        A.px(x, y, 6, 6, flash ? "#fff" : "#5ee8d0");
        A.px(x + 1, y - 2, 4, 3, "rgba(94,232,208,0.5)");
        A.px(x + 2, y + 2, 2, 2, "#e8fff8");
        return;
      }
      let body = flash ? "#f4f0e0" : "#3a8a38";
      if (e.kind === "archer") body = flash ? "#f4f0e0" : "#2a6a40";
      if (e.kind === "shaman") body = flash ? "#f4f0e0" : "#6a48a0";
      if (e.kind === "shield") body = flash ? "#f4f0e0" : "#4a5a48";
      if (e.elite) body = flash ? "#fff0c0" : e.kind === "ulv" ? "#6a2030" : "#8a3030";
      A.px(x + 1, y + 4, e.w - 2, e.h - 4, body);
      A.px(x + 2, y, e.w - 4, 5, e.elite ? "#c9a227" : "#2a4a28");
      A.px(x + 2, y + 1, 2, 2, "#1a1814");
      A.px(x + e.w - 4, y + 1, 2, 2, "#1a1814");
      if (e.kind === "shield") {
        A.px(x + (e.facing > 0 ? e.w - 2 : -2), y + 4, 4, 10, "#8a9aa8");
      }
      if (e.rooted > 0) {
        A.px(x, y + e.h - 2, e.w, 2, "#5ee8d0");
      }
      if (e.tele > 0) {
        A.px(x - 2, y - 4, e.w + 4, 2, "#e8c44a");
      }
      // hp pip for elites
      if (e.elite) {
        const bw = e.w + 4;
        const fill = Math.floor((bw * e.hp) / e.maxHp);
        A.px(x - 2, y - 5, bw, 2, "#1a120c");
        A.px(x - 2, y - 5, fill, 2, flash ? "#f4a090" : "#5ee8d0");
      }
    }

    function drawHazards(cpos, t) {
      for (let i = 0; i < hazards.length; i++) {
        const h = hazards[i];
        if (!h || h.room !== room) continue;
        const x = (h.x - cpos.x) | 0;
        const y = (h.y - cpos.y) | 0;
        if (h.kind === "spike") {
          const up = h.frozen > 0 ? false : Math.sin(t * 3 + h.phase) > 0.15;
          if (up) {
            A.px(x + 2, y, 4, 8, "#4a6a88");
            A.px(x + 3, y - 3, 2, 4, "#9ad0f0");
          } else {
            A.px(x + 2, y + 6, 4, 3, "#2a3a48");
          }
        }
        if (h.kind === "breath") {
          A.px(x, y, h.w, h.h, "rgba(94,232,208,0.55)");
        }
      }
    }

    function drawProps(cpos, t) {
      for (let i = 0; i < props.length; i++) {
        const p = props[i];
        if (!p || p.room !== room) continue;
        if (p.kind === "statue" || p.kind === "statue") {
          const lit = lightMode === "combat" || lightMode === "flare" || lightMode === "violet" || lightMode === "victory";
          // eyes
          if (lit) {
            const x = (p.x + 7 - cpos.x) | 0;
            const y = (p.y + 2 - cpos.y) | 0;
            A.px(x, y, 2, 2, "#5ee8d0");
            A.px(x + 6, y, 2, 2, "#5ee8d0");
          }
        }
        if (p.kind === "keyhole" && p.lit) {
          A.px((p.x - cpos.x) | 0, (p.y - cpos.y) | 0, p.w, p.h, "#5ee8d0");
        }
        if (p.kind === "heart" && !heartTaken) {
          const x = (p.x - cpos.x) | 0;
          const y = (p.y - cpos.y + Math.sin(t * 3) * 2) | 0;
          A.px(x + 4, y, 16, 12, "#5ee8d0");
          A.px(x + 8, y + 3, 8, 8, "#e8fff8");
        }
        if (p.kind === "lever") {
          A.px((p.x - cpos.x) | 0, (p.y - cpos.y) | 0, 6, 10, "#6a7080");
          A.px((p.x - 2 - cpos.x) | 0, ((p.on ? p.y - 2 : p.y + 4) - cpos.y) | 0, 10, 3, "#c9a227");
        }
      }
      for (let i = 0; i < chests.length; i++) {
        const c = chests[i];
        if (!c || c.room !== room) continue;
        if (c.open) {
          A.px((c.x - cpos.x) | 0, (c.y - cpos.y) | 0, 14, 6, "#5a3a1c");
          A.px((c.x - cpos.x) | 0, (c.y - 4 - cpos.y) | 0, 14, 5, "#7a5230");
        }
      }
      // sealed portcullis
      for (let i = 0; i < doors.length; i++) {
        const d = doors[i];
        if (!d.sealed || d.from !== room) continue;
        const x = (d.x - cpos.x) | 0;
        const y = (d.y - cpos.y) | 0;
        for (let yy = 0; yy < d.h; yy += 4) {
          A.px(x + 2, y + yy, 6, 2, "#5ee8d0");
          A.px(x + 3, y + yy + 1, 4, 2, "#1a2830");
        }
      }
    }

    function draw(cpos, t) {
      if (!canvas) return;
      A.ctx().drawImage(canvas, 0, 0, VEIN_W, VEIN_H, -cpos.x, -cpos.y, VEIN_W, VEIN_H);
      drawHazards(cpos, t);
      drawProps(cpos, t);
      for (let i = 0; i < enemies.length; i++) drawEnemy(cpos, enemies[i], t);
      drawLights(cpos, t);
      // darkness overlay when blackout
      if (lightMode === "blackout" || (script && script.stage === "blackout")) {
        A.px(0, 0, A.viewW(), A.viewH(), "rgba(0,0,0,0.55)");
      }
    }

    function drawHud() {
      const uiW = A.uiW();
      // mana
      const x = 6;
      const y = 28;
      A.px(x, y, 74, 8, "#1a222c");
      A.px(x + 1, y + 1, 72, 6, "#0e141a");
      const fill = Math.floor(70 * (mana / MAX_MANA));
      A.px(x + 2, y + 2, fill, 4, "#5ee8d0");
      A.drawPixText("MANA", x + 76, y + 1, "#8ab0c8");
      const sp = SPELLS[spellIx];
      A.drawPixText(sp.name + " " + (spellIx + 1), x, y + 10, "#e8fff8");
      // keys
      let kx = uiW - 60;
      if (keysGot.bronze) {
        A.px(kx, 28, 5, 8, "#b87333");
        kx += 10;
      }
      if (keysGot.silver) {
        A.px(kx, 28, 5, 8, "#c0c8d0");
        kx += 10;
      }
      if (keysGot.gold) {
        A.px(kx, 28, 5, 8, "#c9a227");
      }
      if (boss && !boss.dead) {
        const w = 110;
        const bx = ((uiW - w) / 2) | 0;
        A.px(bx, 6, w, 12, "#1a1420");
        A.drawPixText(boss.kind === "ulv" ? "WARLORD ULV" : boss.kind.toUpperCase(), (bx + w / 2) | 0, 6, "#5ee8d0", "center");
        const inner = w - 6;
        const bf = Math.floor((inner * boss.hp) / boss.maxHp);
        A.px(bx + 3, 14, inner, 3, "#0a080c");
        A.px(bx + 3, 14, bf, 3, "#c04060");
      }
      if (tipT > 0 && tip) {
        A.drawPixText(tip, (uiW / 2) | 0, 44, "#5ee8d0", "center");
      }
    }

    function prompt() {
      if (A.getScene() !== "vein") {
        if (islandDoor && A.getScene() === "island" && !A.player.aboard && playerHits(islandDoor)) {
          return "ENTER THE VEIN";
        }
        return "";
      }
      if (tipT > 0 && tip) return tip;
      if (exitPad && playerHits(exitPad)) return "LEAVE MOUNTAIN";
      for (let i = 0; i < chests.length; i++) {
        const c = chests[i];
        if (c && c.room === room && !c.open && Math.hypot(A.player.x - c.x, A.player.y - c.y) < 18) {
          return "SPACE OPEN CHEST";
        }
      }
      return "1-4 SPELL  SPACE CAST";
    }

    function solidsHit(px, py) {
      if (A.hitPad(px, py, solids)) return true;
      // sealed doors act solid
      for (let i = 0; i < doors.length; i++) {
        const d = doors[i];
        if (!d.sealed) continue;
        if (px > d.x && px < d.x + d.w && py > d.y && py < d.y + d.h) return true;
      }
      return false;
    }

    function canStand(px, py) {
      if (solidsHit(px, py)) return false;
      return px >= 8 && py >= 10 && px < VEIN_W - 8 && py < VEIN_H - 6;
    }

    function setSpell(i) {
      if (i < 0 || i >= SPELLS.length) return;
      spellIx = i;
      flash(SPELLS[spellIx].name);
    }

    function drinkPotion(id) {
      if (id === "potion_red") {
        A.player.hp = Math.min(A.MAX_HP, A.player.hp + 3);
        flash("+HP");
        return true;
      }
      if (id === "potion_blue") {
        mana = Math.min(MAX_MANA, mana + 45);
        flash("+MANA");
        return true;
      }
      if (id === "potion_gold") {
        hurtCool = 2.2;
        flash("PHASE");
        return true;
      }
      if (id === "potion_fury") {
        mana = MAX_MANA;
        A.setWandCool(0);
        flash("FURY");
        return true;
      }
      if (id === "potion_warp") {
        A.player.x = checkpoint.x;
        A.player.y = checkpoint.y;
        flash("WARP");
        return true;
      }
      if (id === "potion_smoke") {
        // confuse enemies briefly
        for (let i = 0; i < enemies.length; i++) {
          const e = enemies[i];
          if (e && e.room === room && !e.dead) e.rooted = Math.max(e.rooted, 2.2);
        }
        flash("SMOKE");
        return true;
      }
      return false;
    }

    return {
      ROOM_W,
      ROOM_H,
      VEIN_W,
      VEIN_H,
      placeMountains,
      bake,
      onEnter,
      update,
      draw,
      drawHud,
      prompt,
      solidsHit,
      canStand,
      fireSpell,
      updateBolts,
      tryInteract,
      setSpell,
      drinkPotion,
      getDoor: () => islandDoor,
      getExitPad: () => exitPad,
      getIslandExit: () => islandExit,
      getCheckpoint: () => checkpoint,
      blockCloak: () => A.getScene() === "vein",
      isActive: () => A.getScene() === "vein",
      lockCam,
      getRoom: () => room,
    };
  }

  global.IsleVeinBuild = IsleVeinBuild;
})(typeof window !== "undefined" ? window : globalThis);
