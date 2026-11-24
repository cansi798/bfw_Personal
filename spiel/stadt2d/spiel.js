/* Nordstern City · Spielwelt zum Kurs Personalwesen · © 2026 Waybuild Akademie */
(function () {
  "use strict";
  var S = window.SPIEL;
  var cv = document.getElementById("welt"), ctx = cv.getContext("2d");
  var $ = function (id) { return document.getElementById(id); };

  /* ------------------------------------------------------------ Welt */
  var T = 48, BW = 8, NX = 8, NY = 6;
  var COLS = NX * BW + 2, ROWS = NY * BW + 2, W = COLS * T, H = ROWS * T;
  var rnd = mulberry(20261123);
  function mulberry(a) { return function () { a |= 0; a = a + 0x6D2B79F5 | 0; var t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
  function isRoad(tx, ty) { return tx % BW < 2 || ty % BW < 2; }

  var LANDMARKS = [
    { name: "Nordstern Fahrradwerke", bx: 3, by: 2, farbe: "#0077a6", gross: true },
    { name: "Personalabteilung", bx: 4, by: 2, farbe: "#2f6f9f" },
    { name: "Berufsschule", bx: 1, by: 1, farbe: "#b5651d" },
    { name: "IHK zu Lübeck", bx: 6, by: 1, farbe: "#7b3f8c" },
    { name: "Agentur für Arbeit", bx: 1, by: 4, farbe: "#c0392b" },
    { name: "Arbeitsgericht", bx: 6, by: 4, farbe: "#5d6d7e" },
    { name: "Krankenkasse", bx: 0, by: 2, farbe: "#16a085" },
    { name: "Finanzamt", bx: 7, by: 2, farbe: "#8e5a2b" },
    { name: "Bank", bx: 5, by: 0, farbe: "#1f4e79" },
    { name: "Betriebsrat", bx: 3, by: 3, farbe: "#d35400" },
    { name: "Weiterbildungszentrum", bx: 2, by: 0, farbe: "#27ae60" },
    { name: "Nordstern Service", bx: 4, by: 5, farbe: "#00838f" },
    { name: "Café Pause", bx: 0, by: 0, farbe: "#a0522d" },
    { name: "Rathaus", bx: 5, by: 3, farbe: "#6c3483" },
    { name: "Lager und Logistik", bx: 2, by: 3, farbe: "#7f8c8d" },
    { name: "Jobbörse", bx: 7, by: 5, farbe: "#c27c0e" }
  ];
  var DEPOTS = [{ bx: 1, by: 2 }, { bx: 5, by: 1 }, { bx: 6, by: 3 }];
  var PARKS = [{ bx: 3, by: 0 }, { bx: 0, by: 5 }, { bx: 5, by: 5 }, { bx: 7, by: 0 }];

  var solids = [], trees = [], places = [], depotPlaces = [];
  function blockRect(bx, by) { return { x: (bx * BW + 2) * T, y: (by * BW + 2) * T, w: 6 * T, h: 6 * T }; }
  function doorPoint(bx, by) { var r = blockRect(bx, by); return { x: r.x + r.w / 2, y: ((by + 1) * BW + 1) * T }; }
  function used(bx, by) {
    return LANDMARKS.some(function (l) { return l.bx === bx && l.by === by; }) || DEPOTS.some(function (d) { return d.bx === bx && d.by === by; }) ||
      PARKS.some(function (p) { return p.bx === bx && p.by === by; });
  }
  var houses = [];
  (function buildWorld() {
    LANDMARKS.forEach(function (l) {
      var r = blockRect(l.bx, l.by), m = 16;
      var b = { x: r.x + m, y: r.y + m, w: r.w - 2 * m, h: r.h - 2 * m - 10, farbe: l.farbe, name: l.name, land: true };
      solids.push(b); houses.push(b);
      var d = doorPoint(l.bx, l.by); places.push({ name: l.name, x: d.x, y: d.y, farbe: l.farbe });
    });
    DEPOTS.forEach(function (dp, i) {
      var r = blockRect(dp.bx, dp.by), m = 16;
      var b = { x: r.x + m, y: r.y + m, w: r.w - 2 * m, h: r.h - 2 * m - 10, farbe: "#6d4c41", name: "Depot " + (i + 1), depot: i };
      solids.push(b); houses.push(b);
      var d = doorPoint(dp.bx, dp.by); depotPlaces.push({ x: d.x, y: d.y, haus: b });
    });
    PARKS.forEach(function (p) {
      var r = blockRect(p.bx, p.by);
      var pond = { x: r.x + 80, y: r.y + 90, w: 130, h: 90, teich: true };
      solids.push(pond);
      for (var i = 0; i < 14; i++) {
        var tx = r.x + 24 + rnd() * (r.w - 48), ty = r.y + 24 + rnd() * (r.h - 48);
        if (tx > pond.x - 20 && tx < pond.x + pond.w + 20 && ty > pond.y - 20 && ty < pond.y + pond.h + 20) continue;
        trees.push({ x: tx, y: ty, r: 13 + rnd() * 7 });
      }
    });
    var roofs = ["#c96a4a", "#9aa5b1", "#d9a441", "#7f8fa6", "#b8735a", "#8d9a6c", "#a56c8f"];
    for (var by = 0; by < NY; by++) for (var bx = 0; bx < NX; bx++) {
      if (used(bx, by)) continue;
      var r = blockRect(bx, by), m = 14, hw = (r.w - 3 * m) / 2, hh = (r.h - 3 * m) / 2;
      for (var k = 0; k < 4; k++) {
        if (rnd() < 0.18) { trees.push({ x: r.x + m + (k % 2) * (hw + m) + hw / 2, y: r.y + m + Math.floor(k / 2) * (hh + m) + hh / 2, r: 18 }); continue; }
        var b = { x: r.x + m + (k % 2) * (hw + m), y: r.y + m + Math.floor(k / 2) * (hh + m), w: hw, h: hh, farbe: roofs[Math.floor(rnd() * roofs.length)] };
        solids.push(b); houses.push(b);
      }
    }
  })();

  /* statische Karte vorzeichnen */
  var map = document.createElement("canvas"); map.width = W; map.height = H;
  var mini = document.createElement("canvas"); var MS = 0.05; mini.width = Math.ceil(W * MS); mini.height = Math.ceil(H * MS);
  (function paintStatic() {
    var g = map.getContext("2d");
    g.fillStyle = "#7fb069"; g.fillRect(0, 0, W, H);
    for (var i = 0; i < 900; i++) { g.fillStyle = rnd() < 0.5 ? "rgba(255,255,255,.05)" : "rgba(0,60,0,.06)"; g.fillRect(rnd() * W, rnd() * H, 3, 3); }
    for (var by = 0; by < NY; by++) for (var bx = 0; bx < NX; bx++) {
      var r = blockRect(bx, by);
      var park = PARKS.some(function (p) { return p.bx === bx && p.by === by; });
      g.fillStyle = park ? "#86c06c" : "#c9cfd4"; g.fillRect(r.x - 8, r.y - 8, r.w + 16, r.h + 16);
      if (!park) { g.fillStyle = "#e9ecef"; g.fillRect(r.x, r.y, r.w, r.h); }
    }
    g.fillStyle = "#43484e";
    for (var x = 0; x <= NX; x++) g.fillRect(x * BW * T, 0, 2 * T, H);
    for (var y = 0; y <= NY; y++) g.fillRect(0, y * BW * T, W, 2 * T);
    g.strokeStyle = "rgba(255,255,255,.55)"; g.lineWidth = 3; g.setLineDash([22, 18]);
    for (x = 0; x <= NX; x++) { g.beginPath(); g.moveTo((x * BW + 1) * T, 0); g.lineTo((x * BW + 1) * T, H); g.stroke(); }
    for (y = 0; y <= NY; y++) { g.beginPath(); g.moveTo(0, (y * BW + 1) * T); g.lineTo(W, (y * BW + 1) * T); g.stroke(); }
    g.setLineDash([]);
    for (x = 0; x <= NX; x++) for (y = 0; y <= NY; y++) {
      var cx = x * BW * T, cy = y * BW * T; g.fillStyle = "#43484e"; g.fillRect(cx, cy, 2 * T, 2 * T);
      g.fillStyle = "rgba(255,255,255,.7)";
      for (var z = 0; z < 6; z++) { g.fillRect(cx + 6 + z * 14, cy - 18, 8, 14); g.fillRect(cx + 6 + z * 14, cy + 2 * T + 4, 8, 14); }
    }
    solids.forEach(function (b) {
      if (b.teich) { g.fillStyle = "#4aa3d8"; roundRect(g, b.x, b.y, b.w, b.h, 40); g.fill(); g.strokeStyle = "#2f7fb0"; g.lineWidth = 4; g.stroke(); return; }
      g.fillStyle = "rgba(0,0,0,.22)"; g.fillRect(b.x + 8, b.y + 10, b.w, b.h);
      g.fillStyle = b.farbe; g.fillRect(b.x, b.y, b.w, b.h);
      g.fillStyle = "rgba(255,255,255,.14)"; g.fillRect(b.x, b.y, b.w, 8);
      g.strokeStyle = "rgba(0,0,0,.25)"; g.lineWidth = 3; g.strokeRect(b.x, b.y, b.w, b.h);
      if (!b.land && !("depot" in b)) {
        g.fillStyle = "rgba(255,255,255,.18)";
        for (var k = 0; k < 3; k++) g.fillRect(b.x + 12 + k * (b.w - 30) / 3, b.y + b.h / 2 - 6, (b.w - 60) / 3, 12);
      }
      if (b.land) {
        g.fillStyle = "rgba(255,255,255,.12)";
        for (var gx = b.x + 20; gx < b.x + b.w - 30; gx += 46) for (var gy = b.y + 22; gy < b.y + b.h - 60; gy += 40) g.fillRect(gx, gy, 26, 14);
        label(g, b.name, b.x + b.w / 2, b.y + b.h - 34, b.w - 20);
      }
      if ("depot" in b) {
        g.strokeStyle = "rgba(255,255,255,.35)"; g.lineWidth = 6;
        for (var s = 0; s < 4; s++) { g.beginPath(); g.moveTo(b.x + 20 + s * 52, b.y + 18); g.lineTo(b.x + 20 + s * 52, b.y + b.h - 70); g.stroke(); }
      }
    });
    trees.forEach(function (t) {
      g.fillStyle = "rgba(0,0,0,.2)"; g.beginPath(); g.arc(t.x + 5, t.y + 6, t.r, 0, 7); g.fill();
      g.fillStyle = "#2e7d32"; g.beginPath(); g.arc(t.x, t.y, t.r, 0, 7); g.fill();
      g.fillStyle = "#43a047"; g.beginPath(); g.arc(t.x - t.r * .3, t.y - t.r * .3, t.r * .55, 0, 7); g.fill();
    });
    var m = mini.getContext("2d"); m.drawImage(map, 0, 0, mini.width, mini.height);
  })();
  function roundRect(g, x, y, w, h, r) { g.beginPath(); g.moveTo(x + r, y); g.arcTo(x + w, y, x + w, y + h, r); g.arcTo(x + w, y + h, x, y + h, r); g.arcTo(x, y + h, x, y, r); g.arcTo(x, y, x + w, y, r); g.closePath(); }
  function label(g, text, cx, cy, maxw) {
    g.font = "700 20px Inter, sans-serif"; var w = Math.min(g.measureText(text).width + 24, maxw);
    g.fillStyle = "rgba(255,255,255,.95)"; roundRect(g, cx - w / 2, cy - 17, w, 34, 10); g.fill();
    g.fillStyle = "#16263a"; g.textAlign = "center"; g.textBaseline = "middle"; fitText(g, text, cx, cy, maxw - 24);
  }
  function fitText(g, text, x, y, maxw) {
    var size = parseInt(g.font.match(/(\d+)px/)[1], 10);
    while (g.measureText(text).width > maxw && size > 11) { size--; g.font = g.font.replace(/\d+px/, size + "px"); }
    g.fillText(text, x, y);
  }

  /* ------------------------------------------------------------ Verkehr */
  function node(i, j) { return { x: (i * BW + 1) * T, y: (j * BW + 1) * T }; }
  var cars = [];
  var CARCOL = ["#e74c3c", "#f1c40f", "#3498db", "#9b59b6", "#1abc9c", "#e67e22", "#ecf0f1", "#34495e"];
  function spawnCar(k) {
    var i = Math.floor(rnd() * (NX + 1)), j = Math.floor(rnd() * (NY + 1));
    var c = { i: i, j: j, x: 0, y: 0, ti: i, tj: j, sp: 95 + rnd() * 60, farbe: CARCOL[k % CARCOL.length], spin: 0, stun: 0, ang: 0, dx: 0, dy: 0 };
    var p = node(i, j); c.x = p.x; c.y = p.y; pickNext(c); cars.push(c);
  }
  function pickNext(c) {
    var opts = [[1, 0], [-1, 0], [0, 1], [0, -1]].filter(function (d) {
      var ni = c.i + d[0], nj = c.j + d[1]; return ni >= 0 && nj >= 0 && ni <= NX && nj <= NY && !(d[0] === -c.dx && d[1] === -c.dy && (c.dx || c.dy));
    });
    var d = opts[Math.floor(rnd() * opts.length)]; c.dx = d[0]; c.dy = d[1]; c.ti = c.i + d[0]; c.tj = c.j + d[1];
    c.ang = Math.atan2(c.dy, c.dx);
  }
  for (var k = 0; k < 14; k++) spawnCar(k);
  function updateCar(c, dt) {
    if (c.stun > 0) {
      c.stun -= dt; c.spin += dt * 12 * Math.max(0, c.stun); c.x += c.vx * dt; c.y += c.vy * dt; c.vx *= 0.94; c.vy *= 0.94;
      if (c.stun <= 0) { // zurück auf die Straße
        var i = Math.round((c.x / T - 1) / BW), j = Math.round((c.y / T - 1) / BW);
        c.i = clamp(i, 0, NX); c.j = clamp(j, 0, NY); var p = node(c.i, c.j); c.x = p.x; c.y = p.y; c.spin = 0; c.dx = c.dy = 0; pickNext(c);
      }
      return;
    }
    var tgt = node(c.ti, c.tj), off = T * 0.5;
    var tx = tgt.x - c.dy * off, ty = tgt.y + c.dx * off; // Rechtsverkehr
    var ddx = tx - c.x, ddy = ty - c.y, dist = Math.hypot(ddx, ddy);
    if (dist < 4) { c.i = c.ti; c.j = c.tj; pickNext(c); return; }
    var step = Math.min(dist, c.sp * dt); c.x += ddx / dist * step; c.y += ddy / dist * step; c.ang = Math.atan2(ddy, ddx);
  }

  /* ------------------------------------------------------------ Spieler */
  var P = { x: 0, y: 0, ang: 0, v: 0, turbo: 0 };
  function resetPlayer() { var d = places[0]; P.x = d.x; P.y = d.y; P.ang = 0; P.v = 0; }
  var keys = {};
  window.addEventListener("keydown", function (e) {
    keys[e.key.toLowerCase()] = true;
    if (state === "play" && ["arrowup", "arrowdown", "arrowleft", "arrowright", " "].indexOf(e.key.toLowerCase()) >= 0) e.preventDefault();
    if (e.key === "Escape" && state === "play") pause();
    if (e.key === "Enter" && state === "feedback") weiter();
  });
  window.addEventListener("keyup", function (e) { keys[e.key.toLowerCase()] = false; });
  /* Joystick */
  var joy = { on: false, x: 0, y: 0 }, joyEl = $("joy"), knauf = $("knauf");
  function joyMove(e) {
    var r = joyEl.getBoundingClientRect(), cx = r.left + r.width / 2, cy = r.top + r.height / 2;
    var dx = e.clientX - cx, dy = e.clientY - cy, d = Math.hypot(dx, dy), max = r.width / 2;
    if (d > max) { dx = dx / d * max; dy = dy / d * max; }
    joy.x = dx / max; joy.y = dy / max; knauf.style.transform = "translate(" + dx + "px," + dy + "px)";
  }
  joyEl.addEventListener("pointerdown", function (e) { joy.on = true; joyEl.setPointerCapture(e.pointerId); joyMove(e); });
  joyEl.addEventListener("pointermove", function (e) { if (joy.on) joyMove(e); });
  ["pointerup", "pointercancel"].forEach(function (t) { joyEl.addEventListener(t, function () { joy.on = false; joy.x = joy.y = 0; knauf.style.transform = ""; }); });
  if (window.matchMedia("(pointer:coarse)").matches || "ontouchstart" in window) document.body.classList.add("touch");

  function clamp(v, a, b) { return v < a ? a : v > b ? b : v; }
  function angDiff(a, b) { var d = b - a; while (d > Math.PI) d -= 2 * Math.PI; while (d < -Math.PI) d += 2 * Math.PI; return d; }
  function onRoad(x, y) { return isRoad(Math.floor(x / T), Math.floor(y / T)); }

  function updatePlayer(dt) {
    var maxV = 290, acc = 420;
    var turbo = keys["shift"] || (joy.on && Math.hypot(joy.x, joy.y) > 0.97);
    if (turbo) maxV = 400;
    if (!onRoad(P.x, P.y)) maxV *= 0.6;
    if (joy.on && (Math.abs(joy.x) > 0.12 || Math.abs(joy.y) > 0.12)) {
      var want = Math.atan2(joy.y, joy.x), mag = Math.min(1, Math.hypot(joy.x, joy.y));
      var d = angDiff(P.ang, want);
      if (Math.abs(d) > 2.4 && P.v < 60) { P.v = Math.max(P.v - acc * dt, -80); }
      else { P.ang += clamp(d, -4 * dt, 4 * dt); P.v += (maxV * mag - P.v) * Math.min(1, 2.2 * dt); }
    } else {
      var up = keys["arrowup"] || keys["w"], down = keys["arrowdown"] || keys["s"];
      var left = keys["arrowleft"] || keys["a"], right = keys["arrowright"] || keys["d"];
      if (up) P.v += acc * dt; else if (down) P.v -= acc * 1.3 * dt; else P.v *= Math.pow(0.35, dt);
      if (keys[" "]) P.v *= Math.pow(0.02, dt);
      var steer = (right ? 1 : 0) - (left ? 1 : 0);
      P.ang += steer * 3.1 * dt * clamp(Math.abs(P.v) / 120, 0.3, 1) * (P.v < 0 ? -1 : 1);
    }
    P.v = clamp(P.v, -140, maxV);
    var nx = P.x + Math.cos(P.ang) * P.v * dt, ny = P.y + Math.sin(P.ang) * P.v * dt, R = 15;
    nx = clamp(nx, R, W - R); ny = clamp(ny, R, H - R);
    for (var i = 0; i < solids.length; i++) {
      var b = solids[i], qx = clamp(nx, b.x, b.x + b.w), qy = clamp(ny, b.y, b.y + b.h), dx = nx - qx, dy = ny - qy, d2 = dx * dx + dy * dy;
      if (d2 < R * R) { var d = Math.sqrt(d2) || 1; nx = qx + dx / d * R; ny = qy + dy / d * R; if (Math.abs(P.v) > 120) bump(P.x, P.y, "Rums!"); P.v *= -0.25; }
    }
    for (i = 0; i < trees.length; i++) {
      var t = trees[i], dx2 = nx - t.x, dy2 = ny - t.y, dd = Math.hypot(dx2, dy2), min = t.r + R - 4;
      if (dd < min) { nx = t.x + dx2 / dd * min; ny = t.y + dy2 / dd * min; P.v *= 0.4; }
    }
    P.x = nx; P.y = ny;
    cars.forEach(function (c) {
      var dx = c.x - P.x, dy = c.y - P.y, d = Math.hypot(dx, dy);
      if (d < 34 && c.stun <= 0) {
        var power = Math.abs(P.v) + 80; c.stun = 1.4; c.vx = dx / (d || 1) * power * 1.2; c.vy = dy / (d || 1) * power * 1.2;
        P.v *= -0.3; crashes++; bump((c.x + P.x) / 2, (c.y + P.y) / 2, CRASH[crashes % CRASH.length]); shake = 0.35;
      }
    });
  }

  /* ------------------------------------------------------------ Effekte */
  var parts = [], texts = [], shake = 0, crashes = 0;
  function bump(x, y, txt) {
    for (var i = 0; i < 14; i++) { var a = rnd() * 6.28, s = 60 + rnd() * 180; parts.push({ x: x, y: y, vx: Math.cos(a) * s, vy: Math.sin(a) * s, life: 0.6, c: i % 2 ? "#f2c94c" : "#ffffff" }); }
    if (txt && !texts.some(function (t) { return t.life > 0.6; })) texts.push({ x: x, y: y - 20, txt: txt, life: 1 });
  }
  function confetti(x, y) { for (var i = 0; i < 40; i++) { var a = rnd() * 6.28, s = 80 + rnd() * 260; parts.push({ x: x, y: y, vx: Math.cos(a) * s, vy: Math.sin(a) * s, life: 1, c: ["#2f8f6b", "#f2a900", "#0077a6", "#e74c3c"][i % 4] }); } }


  /* ------------------------------------------------------------ Humor */
  var RADIO = [
    "Radio Nordstern · Personalleiter Brandt sucht seit 2019 die Excel-Datei „Urlaub_final_final2.xlsx“",
    "Radio Nordstern · Betriebsrat fordert Hängematte im Pausenraum, Geschäftsführung prüft Mitbestimmung",
    "Radio Nordstern · Kaffeemaschine in der Verwaltung kündigt fristlos, wichtiger Grund laut Zeugen „zu viel Arbeit“",
    "Radio Nordstern · Azubi Leon erklärt Opa das duale System, Opa versteht jetzt, warum Leon nie Zeit hat",
    "Radio Nordstern · Studie zeigt, Meetings ohne Kekse senken die Motivation um 87 Prozent (Herzberg nickt)",
    "Radio Nordstern · Lastenrad überholt Sportwagen im Feierabendverkehr, Sportwagen fordert Personalentwicklung",
    "Radio Nordstern · Drucker im Personalbüro meldet Papierstau, Experten vermuten Burn-out",
    "Radio Nordstern · Neues Arbeitszeitmodell „Gleitzeit bis Mittag“ scheitert an der Kernzeit",
    "Radio Nordstern · Zeugnissprache entschlüsselt, „stets bemüht“ ist leider kein Lob",
    "Radio Nordstern · Fluktuationsquote im Café Pause steigt, Grund sind die Kekse im Betriebsrat",
    "Radio Nordstern · Verkehrsmeldung, Stau vor dem Finanzamt, alle wollen ihre Steuer-ID abholen",
    "Radio Nordstern · Assessment-Center testet neue Übung „Postkorb ohne Post“, Teilnehmende ratlos",
    "Radio Nordstern · Maslow ruft an, die Pyramide ist schief, bitte nicht an der Spitze anfangen"
  ];
  var LOB = ["Herr Brandt nickt anerkennend und vergisst kurz seine Excel-Datei.", "Die IHK hat zugesehen. Sie ist beeindruckt.",
    "Frau Demir notiert sich das für Ihr Zwischenzeugnis. Stets zu unserer vollsten Zufriedenheit!", "Sogar der Betriebsrat stimmt zu, und das ohne Anhörung.",
    "Der Kaffee in der Personalabteilung schmeckt plötzlich besser.", "Damit wären Sie bei Nordstern sofort im Talentpool."];
  var TADEL = ["Herr Brandt seufzt und öffnet das Skript auf Seite eins.", "Der Betriebsrat legt Widerspruch ein. Diesmal zu Recht.",
    "Die IHK runzelt die Stirn. Aber nur ein bisschen.", "Kein Drama, das wird eine schöne Lerngelegenheit. Sagt man so in der Personalentwicklung.",
    "Ihr Lastenrad schüttelt traurig die Ladebox.", "Zeugnissprache dazu „Sie hat sich bemüht“. Lieber noch einmal lesen!"];
  var LANGSAM = ["Das Lastenrad war schnell, die Zeit war schneller.", "Die Uhr kennt keine Gleitzeit.", "Zeit abgelaufen. Selbst die Kernzeit ist vorbei."];
  var CRASH = ["Krach!", "Rumms!", "Blechschaden!", "Das gibt eine Abmahnung!", "Formular 27b ausfüllen!", "Versicherung informiert!", "Ups, Personalakte!", "Hupkonzert!"];
  function pick(a) { return a[Math.floor(Math.random() * a.length)]; }
  var radioI = Math.floor(Math.random() * RADIO.length);
  setInterval(function () { radioI = (radioI + 1) % RADIO.length; var el = document.getElementById("tipp"); if (el && state === "play" && tUsed > 8) el.textContent = RADIO[radioI]; }, 9000);
  var PLAKATE = ["KÜNDIGUNG PER WHATSAPP? NEIN. § 623 BGB", "ÜBERSTUNDEN? AB AUFS ZEITKONTO!", "HYGIENEFAKTOR KAFFEE. JETZT NEU!",
    "SMART ZIELE STATT SMARTPHONE", "AZUBIS GESUCHT. KEKSE VORHANDEN.", "PERSONALAKTE? IMMER SCHÖN AKTUELL!", "LOHNSTEUER? DAS MACHT DIE TABELLE."];

  /* ------------------------------------------------------------ Missionen */
  var COLORS = ["#16a34a", "#2563eb", "#ea580c", "#9333ea"], LET = ["A", "B", "C", "D"];
  var state = "menu", day = null, mission = null, markers = [], score = 0, round = 0, rounds = 0, tLeft = 0, tUsed = 0, right = 0, cur = null, lastResult = null;
  var store = {}; try { store = JSON.parse(localStorage.getItem("pe26_spiel") || "{}") || {}; } catch (e) { store = {}; }
  function saveStars(key, n) { if (!store[key] || store[key] < n) store[key] = n; try { localStorage.setItem("pe26_spiel", JSON.stringify(store)); } catch (e) {} }
  function shuffle(a) { a = a.slice(); for (var i = a.length - 1; i > 0; i--) { var j = Math.floor(Math.random() * (i + 1)); var t = a[i]; a[i] = a[j]; a[j] = t; } return a; }
  function farPlaces(n) {
    var cand = shuffle(places).filter(function (p) { return Math.hypot(p.x - P.x, p.y - P.y) > 650; });
    if (cand.length < n) cand = cand.concat(shuffle(places).filter(function (p) { return cand.indexOf(p) < 0 && Math.hypot(p.x - P.x, p.y - P.y) > 200; }));
    return cand.slice(0, n);
  }
  var MISSIONEN = {
    lernen: { name: "Lern-Tour", ico: "📘", text: "Lernpunkte anfahren und die Kernthemen des Tages lesen" },
    kurier: { name: "Kurier-Mission", ico: "🚲", text: "Fragen zum Tag beantworten, zur richtigen Antwort fahren" },
    logistik: { name: "Lastenrad-Logistik", ico: "📦", text: "Pakete mit Aussagen ins passende Depot bringen" }
  };

  function startMission(m) {
    mission = m; score = 0; round = 0; right = 0; markers = []; tUsed = 0; crashes = 0; resetPlayer();
    if (m === "lernen") {
      cur = { items: shuffle(day.lernen).slice(0, 8) }; rounds = cur.items.length;
      var pl = shuffle(places.slice(1)).slice(0, rounds);
      cur.items.forEach(function (it, i) { markers.push({ x: pl[i].x, y: pl[i].y, farbe: "#0077a6", txt: "i", item: it, ort: pl[i].name }); });
    } else if (m === "kurier") {
      cur = { qs: shuffle(day.quiz).slice(0, 8) }; rounds = cur.qs.length;
    } else {
      var a = shuffle(day.sortier[0].items).slice(0, 6).map(function (x) { return { it: x, set: 0 }; });
      var b = day.sortier[1] ? shuffle(day.sortier[1].items).slice(0, 6).map(function (x) { return { it: x, set: 1 }; }) : [];
      cur = { pk: a.concat(b) }; rounds = cur.pk.length;
    }
    $("hMission").textContent = MISSIONEN[m].name + " · Tag " + day.nr;
    $("tipp").textContent = document.body.classList.contains("touch") ? "" : "Pfeiltasten oder WASD fahren · Leertaste bremst · Umschalt für Turbo";
    show("hud"); hide("eMenue"); hide("eErgebnis"); state = "play"; $("auftrag").classList.remove("zu");
    nextRound(true);
  }
  function nextRound(first) {
    if (!first) round++;
    if (mission === "lernen") {
      var rest = markers.length;
      $("hRunde").textContent = "Gesammelt " + (rounds - rest) + " von " + rounds;
      $("aFrage").textContent = rest ? "Fahren Sie die blauen Lernpunkte (i) an. Jeder Punkt zeigt einen Kernbegriff oder Merksatz des Tages." : "";
      $("aListe").innerHTML = "";
      if (!rest) return finish();
      tLeft = Infinity; return;
    }
    if (round >= rounds) return finish();
    $("hRunde").textContent = "Runde " + (round + 1) + " von " + rounds;
    markers = [];
    if (mission === "kurier") {
      var q = cur.qs[round], order = shuffle([0, 1, 2, 3]), pl = farPlaces(4);
      cur.q = q; cur.order = order;
      $("aFrage").textContent = q.q;
      var html = "";
      order.forEach(function (oi, k) {
        markers.push({ x: pl[k].x, y: pl[k].y, farbe: COLORS[k], txt: LET[k], pick: oi, ort: pl[k].name });
        html += '<li><span class="bad" style="background:' + COLORS[k] + '">' + LET[k] + "</span><span>" + esc(q.o[oi]) + " <small style=\"color:#5b6b7c\">(" + esc(pl[k].name) + ")</small></span></li>";
      });
      $("aListe").innerHTML = html; tLeft = 60; autoKlapp();
    } else {
      var p = cur.pk[round], set = day.sortier[p.set];
      cur.p = p; cur.set = set;
      $("aFrage").textContent = "Paket: „" + p.it.text + "“  Wohin gehört es?";
      var html2 = "";
      set.kategorien.forEach(function (k, i) {
        var d = depotPlaces[i]; d.haus.schild = k.name;
        markers.push({ x: d.x, y: d.y, farbe: COLORS[i], txt: LET[i], kat: k.id, ort: k.name });
        html2 += '<li><span class="bad" style="background:' + COLORS[i] + '">' + LET[i] + "</span><span>Depot <b>" + esc(k.name) + "</b></span></li>";
      });
      depotPlaces.forEach(function (d, i) { if (i >= set.kategorien.length) d.haus.schild = ""; });
      $("aListe").innerHTML = html2; tLeft = 45; autoKlapp();
      if (p.set === 1 && cur.pk[round - 1] && cur.pk[round - 1].set === 0) texts.push({ x: P.x, y: P.y - 40, txt: "Neue Depots!", life: 1.6 });
    }
  }
  var klappT = null;
  function autoKlapp() {
    var a = $("auftrag"); a.classList.remove("zu"); clearTimeout(klappT);
    if (window.innerWidth < 700) klappT = setTimeout(function () { if (state === "play") a.classList.add("zu"); }, 9000);
  }
  function esc(s) { return String(s).replace(/[&<>"]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]; }); }

  function reach(mk) {
    if (mission === "lernen") {
      markers.splice(markers.indexOf(mk), 1); score += 50; confetti(mk.x, mk.y);
      feedback("Lernpunkt " + (rounds - markers.length) + " von " + rounds, "info", mk.item.t, mk.item.x);
      return;
    }
    var ok, loes, erkl;
    if (mission === "kurier") {
      ok = mk.pick === cur.q.c; var k = cur.order.indexOf(cur.q.c);
      loes = "Richtig ist " + LET[k] + ") " + cur.q.o[cur.q.c]; erkl = cur.q.e;
    } else {
      ok = mk.kat === cur.p.it.kat;
      var kat = cur.set.kategorien.filter(function (x) { return x.id === cur.p.it.kat; })[0];
      loes = "Das Paket gehört ins Depot „" + kat.name + "“."; erkl = cur.p.it.expl;
    }
    if (ok) { right++; var bonus = Math.round(Math.max(0, tLeft) * 2); score += 100 + bonus; confetti(mk.x, mk.y); }
    feedback(ok ? "Richtig!" : "Leider falsch", ok ? "ok" : "ko", loes, erkl, ok ? pick(LOB) : pick(TADEL));
  }
  function timeout() {
    var loes, erkl;
    if (mission === "kurier") { var k = cur.order.indexOf(cur.q.c); loes = "Richtig ist " + LET[k] + ") " + cur.q.o[cur.q.c]; erkl = cur.q.e; }
    else { var kat = cur.set.kategorien.filter(function (x) { return x.id === cur.p.it.kat; })[0]; loes = "Das Paket gehört ins Depot „" + kat.name + "“."; erkl = cur.p.it.expl; }
    feedback("Zeit abgelaufen", "ko", loes, erkl, pick(LANGSAM));
  }
  function feedback(titel, art, loes, erkl, witz) {
    state = "feedback"; var u = $("fUrteil"); u.textContent = titel; u.className = "urteil " + (art === "info" ? "" : art);
    $("fLoesung").textContent = loes; $("fErkl").textContent = erkl || ""; $("fErkl").parentNode.style.display = erkl ? "" : "none";
    $("fErkl").parentNode.querySelector("b").textContent = art === "info" ? "Zum Merken" : "Erklärung";
    $("fWitz").textContent = witz || ""; $("fWitz").style.display = witz ? "" : "none";
    show("eFeedback"); setTimeout(function () { $("btnWeiter").focus(); }, 30);
    P.v = 0;
  }
  function weiter() { hide("eFeedback"); state = "play"; nextRound(false); }
  function finish() {
    state = "result"; hide("hud");
    var key = day.nr + "-" + mission, stars;
    if (mission === "lernen") { stars = 3; $("rTitel").textContent = "Lern-Tour geschafft"; $("rText").textContent = "Sie haben alle " + rounds + " Lernpunkte in " + Math.round(tUsed) + " Sekunden gesammelt. Jetzt passt die Kurier-Mission."; }
    else {
      var q = right / rounds; stars = q >= 0.85 ? 3 : q >= 0.6 ? 2 : q >= 0.35 ? 1 : 0;
      $("rTitel").textContent = stars ? "Mission geschafft" : "Fast geschafft";
      $("rText").textContent = right + " von " + rounds + " richtig, " + score + " Punkte" + (crashes ? ", " + crashes + " Zusammenstöße" : "") + ".";
    }
    $("rSterne").textContent = "★★★".slice(0, stars) + "☆☆☆".slice(0, 3 - stars);
    saveStars(key, stars); lastResult = mission; show("eErgebnis");
  }
  function pause() { state = "pause"; show("ePause"); }
  function show(id) { $(id).classList.remove("versteckt", "aus"); }
  function hide(id) { $(id).classList.add(id === "hud" ? "aus" : "versteckt"); }

  /* ------------------------------------------------------------ Menü */
  function buildMenu() {
    var sel = $("selTag"); sel.innerHTML = "";
    S.days.forEach(function (d) { var o = document.createElement("option"); o.value = d.nr; o.textContent = "Tag " + d.nr + ", " + d.title + " (" + d.date + ")"; sel.appendChild(o); });
    var qs = new URLSearchParams(location.search), t = parseInt(qs.get("tag"), 10);
    if (!t) { var now = new Date(); now.setHours(0, 0, 0, 0); S.days.forEach(function (d) { var p = d.date.split("."); if (new Date(+p[2], +p[1] - 1, +p[0]) <= now) t = d.nr; }); }
    sel.value = String(t || 1);
    sel.onchange = renderMissions; renderMissions();
    var m = qs.get("m"); if (m && MISSIONEN[m] && qs.get("start") === "1") { setDay(); startMission(m); }
  }
  function setDay() { var n = parseInt($("selTag").value, 10); day = S.days.filter(function (d) { return d.nr === n; })[0]; $("lnkZurueck").href = "../../index.html#/tag/" + n; }
  function renderMissions() {
    setDay();
    var box = $("missionen"); box.innerHTML = "";
    ["lernen", "kurier", "logistik"].forEach(function (m) {
      var st = store[day.nr + "-" + m] || 0, mm = MISSIONEN[m];
      var b = document.createElement("button"); b.className = "mission"; b.type = "button";
      b.innerHTML = '<span class="ico">' + mm.ico + '</span><span><b>' + mm.name + "</b><small>" + mm.text + '</small></span><span class="st">' + "★★★".slice(0, st) + "☆☆☆".slice(0, 3 - st) + "</span>";
      b.onclick = function () { startMission(m); }; box.appendChild(b);
    });
  }
  $("btnWeiter").onclick = weiter;
  $("btnMenue").onclick = pause;
  $("btnFortsetzen").onclick = function () { hide("ePause"); state = "play"; };
  $("btnAbbrechen").onclick = function () { hide("ePause"); hide("hud"); state = "menu"; renderMissions(); show("eMenue"); };
  $("btnNochmal").onclick = function () { startMission(lastResult); };
  $("btnZumMenue").onclick = function () { hide("eErgebnis"); state = "menu"; renderMissions(); show("eMenue"); };
  $("btnKlapp").onclick = function () { $("auftrag").classList.toggle("zu"); };

  /* ------------------------------------------------------------ Schleife */
  var DPR = 1, vw = 0, vh = 0, zoom = 1;
  function resize() {
    DPR = Math.min(window.devicePixelRatio || 1, 2); vw = window.innerWidth; vh = window.innerHeight;
    cv.width = vw * DPR; cv.height = vh * DPR; zoom = vw < 700 ? 0.72 : vw < 1100 ? 0.85 : 1;
  }
  window.addEventListener("resize", resize); resize();
  var last = performance.now(), menuCam = { x: W / 2, y: H / 2, t: 0 };
  function loop(now) {
    var dt = Math.min(0.05, (now - last) / 1000); last = now;
    cars.forEach(function (c) { updateCar(c, dt); });
    if (state === "play") {
      updatePlayer(dt); tUsed += dt;
      if (tLeft !== Infinity) {
        tLeft -= dt; var z = $("hZeit"); z.textContent = Math.max(0, Math.ceil(tLeft)); z.classList.toggle("knapp", tLeft < 10);
        if (tLeft <= 0) timeout();
      } else { $("hZeit").textContent = Math.floor(tUsed) + " s"; $("hZeit").classList.remove("knapp"); }
      $("hPunkte").textContent = score;
      for (var i = 0; i < markers.length && state === "play"; i++) {
        var md = Math.hypot(markers[i].x - P.x, markers[i].y - P.y);
        if (!markers[i].scharf) { if (md > 90) markers[i].scharf = true; continue; }
        if (md < 40) reach(markers[i]);
      }
    }
    parts.forEach(function (p) { p.x += p.vx * dt; p.y += p.vy * dt; p.vx *= 0.92; p.vy *= 0.92; p.life -= dt; });
    parts = parts.filter(function (p) { return p.life > 0; });
    texts.forEach(function (t) { t.y -= 30 * dt; t.life -= dt * 0.8; }); texts = texts.filter(function (t) { return t.life > 0; });
    shake = Math.max(0, shake - dt);
    draw(now / 1000, dt);
    requestAnimationFrame(loop);
  }

  function draw(t, dt) {
    var camX, camY;
    if (state === "menu") { menuCam.t += dt * 0.08; camX = W / 2 + Math.cos(menuCam.t) * W * 0.3; camY = H / 2 + Math.sin(menuCam.t * 1.3) * H * 0.3; }
    else { camX = P.x + Math.cos(P.ang) * P.v * 0.25; camY = P.y + Math.sin(P.ang) * P.v * 0.25; }
    var sw = vw / zoom, sh = vh / zoom;
    camX = clamp(camX, sw / 2, W - sw / 2); camY = clamp(camY, sh / 2, H - sh / 2);
    var ox = camX - sw / 2 + (shake ? (Math.random() - .5) * 10 : 0), oy = camY - sh / 2 + (shake ? (Math.random() - .5) * 10 : 0);
    ctx.setTransform(DPR * zoom, 0, 0, DPR * zoom, -ox * DPR * zoom, -oy * DPR * zoom);
    ctx.drawImage(map, ox, oy, sw, sh, ox, oy, sw, sh);
    // Plakatwände auf Dächern
    plakate.forEach(function (pl) {
      if (pl.x + 200 < ox || pl.x - 200 > ox + sw || pl.y + 60 < oy || pl.y - 60 > oy + sh) return;
      ctx.fillStyle = "#16263a"; ctx.fillRect(pl.x - pl.w / 2 - 4, pl.y - 22, pl.w + 8, 44);
      ctx.fillStyle = "#fff8d6"; ctx.fillRect(pl.x - pl.w / 2, pl.y - 18, pl.w, 36);
      ctx.fillStyle = "#c0392b"; ctx.font = "700 13px Inter, sans-serif"; ctx.textAlign = "center"; ctx.textBaseline = "middle";
      fitText(ctx, pl.txt, pl.x, pl.y, pl.w - 10);
    });
    // Depotschilder
    depotPlaces.forEach(function (d) { var b = d.haus; label(ctx, b.schild ? "Depot " + b.schild : "Depot", b.x + b.w / 2, b.y + b.h - 34, b.w - 20); });
    // Marker
    markers.forEach(function (m) {
      var pulse = 1 + Math.sin(t * 5) * 0.12;
      ctx.fillStyle = m.farbe; ctx.globalAlpha = 0.25; ctx.beginPath(); ctx.arc(m.x, m.y, 44 * pulse, 0, 7); ctx.fill(); ctx.globalAlpha = 1;
      ctx.beginPath(); ctx.arc(m.x, m.y, 24, 0, 7); ctx.fill(); ctx.lineWidth = 4; ctx.strokeStyle = "#fff"; ctx.stroke();
      ctx.fillStyle = "#fff"; ctx.font = "700 22px Inter, sans-serif"; ctx.textAlign = "center"; ctx.textBaseline = "middle"; ctx.fillText(m.txt, m.x, m.y + 1);
    });
    // Autos
    cars.forEach(function (c) { drawCar(c.x, c.y, c.ang + c.spin, c.farbe); });
    // Spieler (Lastenrad)
    drawBike(P.x, P.y, P.ang, t);
    // Partikel und Texte
    parts.forEach(function (p) { ctx.globalAlpha = Math.max(0, p.life); ctx.fillStyle = p.c; ctx.fillRect(p.x - 3, p.y - 3, 6, 6); }); ctx.globalAlpha = 1;
    texts.forEach(function (tx) {
      ctx.globalAlpha = Math.min(1, tx.life * 1.5); ctx.font = "700 30px Kalam, cursive"; ctx.textAlign = "center"; ctx.lineWidth = 6; ctx.strokeStyle = "#16263a";
      ctx.strokeText(tx.txt, tx.x, tx.y); ctx.fillStyle = "#ffd54f"; ctx.fillText(tx.txt, tx.x, tx.y);
    }); ctx.globalAlpha = 1;
    // Bildschirm-Ebene
    ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
    if (state !== "menu") { arrows(ox, oy, sw, sh); minimap(); }
  }
  function drawCar(x, y, a, col) {
    ctx.save(); ctx.translate(x, y); ctx.rotate(a);
    ctx.fillStyle = "rgba(0,0,0,.25)"; ctx.fillRect(-20, -9, 44, 24);
    ctx.fillStyle = col; roundRect(ctx, -22, -12, 44, 24, 7); ctx.fill(); ctx.strokeStyle = "rgba(0,0,0,.35)"; ctx.lineWidth = 2; ctx.stroke();
    ctx.fillStyle = "rgba(20,40,60,.75)"; ctx.fillRect(2, -9, 9, 18); ctx.fillRect(-16, -9, 6, 18);
    ctx.fillStyle = "#fff6c2"; ctx.fillRect(19, -10, 3, 5); ctx.fillRect(19, 5, 3, 5);
    ctx.restore();
  }
  function drawBike(x, y, a, t) {
    ctx.save(); ctx.translate(x, y); ctx.rotate(a);
    ctx.fillStyle = "rgba(0,0,0,.25)"; ctx.fillRect(-16, -9, 38, 22);
    ctx.fillStyle = "#222"; ctx.fillRect(-20, -3, 10, 6); ctx.fillRect(18, -3, 10, 6);
    ctx.fillStyle = "#0077a6"; roundRect(ctx, 4, -13, 20, 26, 5); ctx.fill(); // Ladebox
    ctx.fillStyle = "#fff"; ctx.font = "700 10px Inter, sans-serif"; ctx.textAlign = "center"; ctx.textBaseline = "middle"; ctx.save(); ctx.translate(14, 0); ctx.rotate(Math.PI / 2); ctx.fillText("NS", 0, 0); ctx.restore();
    ctx.fillStyle = "#003366"; ctx.fillRect(-14, -2, 20, 4);
    ctx.fillStyle = "#f2a900"; ctx.beginPath(); ctx.arc(-6, 0, 8, 0, 7); ctx.fill(); // Fahrer (Helm)
    ctx.strokeStyle = "#fff"; ctx.lineWidth = 2; ctx.stroke();
    if (keys["shift"] && P.v > 300) { ctx.fillStyle = "rgba(255,200,60,.8)"; ctx.beginPath(); ctx.moveTo(-22, -5); ctx.lineTo(-34 - Math.random() * 8, 0); ctx.lineTo(-22, 5); ctx.fill(); }
    ctx.restore();
  }
  function arrows(ox, oy, sw, sh) {
    markers.forEach(function (m) {
      var sx = (m.x - ox) * zoom, sy = (m.y - oy) * zoom;
      if (sx > 20 && sx < vw - 20 && sy > 150 && sy < vh - 20) return;
      var cx = vw / 2, cy = vh / 2 + 40, a = Math.atan2(sy - cy, sx - cx);
      var px = clamp(cx + Math.cos(a) * vw, 26, vw - 26), py = clamp(cy + Math.sin(a) * vh, 160, vh - 26);
      ctx.save(); ctx.translate(px, py); ctx.rotate(a);
      ctx.fillStyle = m.farbe; ctx.beginPath(); ctx.moveTo(18, 0); ctx.lineTo(-10, -13); ctx.lineTo(-10, 13); ctx.closePath(); ctx.fill();
      ctx.strokeStyle = "#fff"; ctx.lineWidth = 2; ctx.stroke(); ctx.restore();
      ctx.fillStyle = "#fff"; ctx.font = "700 12px Inter, sans-serif"; ctx.textAlign = "center"; ctx.textBaseline = "middle"; ctx.fillText(m.txt, px - Math.cos(a) * 2, py - Math.sin(a) * 2);
    });
  }
  function minimap() {
    var mw = vw < 600 ? 120 : 170, mh = mw * H / W, x = vw - mw - 12, y = vh - mh - 14;
    ctx.globalAlpha = 0.92; ctx.fillStyle = "#fff"; roundRect(ctx, x - 4, y - 4, mw + 8, mh + 8, 10); ctx.fill(); ctx.globalAlpha = 1;
    ctx.drawImage(mini, x, y, mw, mh);
    var s = mw / W;
    markers.forEach(function (m) { ctx.fillStyle = m.farbe; ctx.beginPath(); ctx.arc(x + m.x * s, y + m.y * s, 4, 0, 7); ctx.fill(); });
    ctx.fillStyle = "#f2a900"; ctx.strokeStyle = "#16263a"; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(x + P.x * s, y + P.y * s, 5, 0, 7); ctx.fill(); ctx.stroke();
  }

  var plakate = houses.filter(function (h) { return !h.land && !("depot" in h) && h.w > 110; }).filter(function (h, i) { return i % 6 === 2; })
    .slice(0, PLAKATE.length).map(function (h, i) { return { x: h.x + h.w / 2, y: h.y + h.h / 2, w: h.w - 16, txt: PLAKATE[i] }; });
  window.NSC = { P: P, markers: function () { return markers; }, state: function () { return state; } }; // für Tests
  resetPlayer(); buildMenu();
  requestAnimationFrame(loop);
})();
