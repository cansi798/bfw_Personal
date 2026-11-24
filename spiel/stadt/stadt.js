/* Nordstern City 3D · Spielwelt zum Kurs Personalwesen
   © 2026 Waybuild Akademie, Waybuild UG (haftungsbeschränkt). Alle Rechte vorbehalten. · www.waybuild.de */
import * as THREE from "../lib/three.module.js";

const S = window.SPIEL || { days: [] };
const HU = window.HUMOR || {};
const $ = (id) => document.getElementById(id);
const IS_TOUCH = (window.matchMedia && matchMedia("(pointer:coarse)").matches) || "ontouchstart" in window;
if (IS_TOUCH) document.body.classList.add("touch");
const QS = new URLSearchParams(location.search);

/* ================================================================ Hilfsfunktionen */
function mulberry(a) { return function () { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
const pick = (a) => a[Math.floor(Math.random() * a.length)];
const clamp = (v, a, b) => (v < a ? a : v > b ? b : v);
function angDiff(a, b) { let d = b - a; while (d > Math.PI) d -= 2 * Math.PI; while (d < -Math.PI) d += 2 * Math.PI; return d; }
function shuffle(a) { a = a.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; }
const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
function lighten(hex, k) { const c = new THREE.Color(hex); c.lerp(new THREE.Color("#ffffff"), k); return "#" + c.getHexString(); }

/* ================================================================ Humor */
const RADIO = (HU.RADIO && HU.RADIO.length ? HU.RADIO.slice() : ["Radio Nordstern · Personalleiter Brandt sucht seit 2019 die Excel-Datei „Urlaub_final_final2.xlsx“"]).concat([
  "Radio Nordstern · Jetzt neu in 3D, die Personalakte mit echter Tiefenwirkung",
  "Radio Nordstern · Verkehrsmeldung, fliegende Kleinwagen am Rathaus, die Versicherung prüft den Begriff höhere Gewalt",
  "Radio Nordstern · Lastenrad-Kurier liefert Zeugnis pünktlich, Personalabteilung vermutet einen Fehler im System",
  "Radio Nordstern · Ententeich im Stadtpark beantragt Mitbestimmung bei der Brotverteilung",
  "Radio Nordstern · Herr Brandt hat die Excel-Datei gefunden, sie hieß „Urlaub_final_final3.xlsx“"
]);
const LOB = HU.LOB || ["Die IHK hat zugesehen. Sie ist beeindruckt."];
const TADEL = HU.TADEL || ["Herr Brandt seufzt und öffnet das Skript auf Seite eins."];
const LANGSAM = HU.LANGSAM || ["Die Uhr kennt keine Gleitzeit."];
const CRASH = (HU.CRASH || ["Krach!", "Rumms!"]).concat(["Schaden fürs Protokoll!", "Ab in die Akte!"]);
const PLAKATE = HU.PLAKATE || ["AZUBIS GESUCHT. KEKSE VORHANDEN."];
const RIVALEN = HU.RIVALEN || ["Herr Brandt im Dienstwagen"];
const HUPE = ["Mööp! Platz für die Personalakte!", "Tröööt! Hier kommt die Lohnabrechnung!", "Hup hup! Ich habe Kernzeit!",
  "Mööööp! Der Betriebsrat fährt mit!", "Tüt tüt! Dringende Urlaubsanträge an Bord!", "Hup! Bitte nicht drängeln, ich bin in der Probezeit!",
  "Trööt! Express für die IHK!", "Määäp! Das war eine Abmahnung in Hupform!"];
const WAND = ["Rums!", "Bonk!", "Mauer gewinnt!", "Die Wand hat Vorfahrt!"];
const BAUM = ["Baum gewinnt!", "Autsch, Laterne!", "Bonk!"];

/* ================================================================ Stadtplan (wie 2D, in Metern) */
const T = 5, BW = 8, NX = 8, NY = 6;
const COLS = NX * BW + 2, ROWS = NY * BW + 2, W = COLS * T, D = ROWS * T, BLK = BW * T;
const Y0 = 0.18; // Oberkante Gehweg
const rnd = mulberry(20261123);
const roadC = (i) => (i * BW + 1) * T;
function isRoad(x, z) { const tx = Math.floor(x / T), tz = Math.floor(z / T); return tx % BW < 2 || tz % BW < 2; }
function blockRect(bx, by) { return { x: (bx * BW + 2) * T, z: (by * BW + 2) * T, w: 6 * T, d: 6 * T }; }
function doorPoint(bx, by) { const r = blockRect(bx, by); return { x: r.x + r.w / 2, z: roadC(by + 1) }; }
function groundY(x, z) {
  const mx = ((x % BLK) + BLK) % BLK, mz = ((z % BLK) + BLK) % BLK;
  const inX = x > 9.2 && x < W - 9.2 && (mx >= 9.2 || mx < 0.8);
  const inZ = z > 9.2 && z < D - 9.2 && (mz >= 9.2 || mz < 0.8);
  return inX && inZ ? Y0 : 0.02;
}
const LANDMARKS = [
  { name: "Nordstern Fahrradwerke", bx: 3, by: 2, farbe: "#0077a6", h: 9, typ: "werk" },
  { name: "Personalabteilung", bx: 4, by: 2, farbe: "#2f6f9f", h: 22 },
  { name: "Berufsschule", bx: 1, by: 1, farbe: "#b5651d", h: 13, typ: "schule" },
  { name: "IHK zu Lübeck", bx: 6, by: 1, farbe: "#7b3f8c", h: 17, typ: "saeulen" },
  { name: "Agentur für Arbeit", bx: 1, by: 4, farbe: "#c0392b", h: 15 },
  { name: "Arbeitsgericht", bx: 6, by: 4, farbe: "#5d6d7e", h: 14, typ: "gericht" },
  { name: "Krankenkasse", bx: 0, by: 2, farbe: "#16a085", h: 14, typ: "kreuz" },
  { name: "Finanzamt", bx: 7, by: 2, farbe: "#8e5a2b", h: 19 },
  { name: "Bank", bx: 5, by: 0, farbe: "#1f4e79", h: 27 },
  { name: "Betriebsrat", bx: 3, by: 3, farbe: "#d35400", h: 10 },
  { name: "Weiterbildungszentrum", bx: 2, by: 0, farbe: "#27ae60", h: 16 },
  { name: "Nordstern Service", bx: 4, by: 5, farbe: "#00838f", h: 11 },
  { name: "Café Pause", bx: 0, by: 0, farbe: "#a0522d", h: 7, typ: "cafe" },
  { name: "Rathaus", bx: 5, by: 3, farbe: "#6c3483", h: 14, typ: "rathaus" },
  { name: "Lager und Logistik", bx: 2, by: 3, farbe: "#7f8c8d", h: 9, typ: "halle" },
  { name: "Jobbörse", bx: 7, by: 5, farbe: "#c27c0e", h: 12 }
];
const DEPOTS = [{ bx: 1, by: 2 }, { bx: 5, by: 1 }, { bx: 6, by: 3 }];
const PARKS = [{ bx: 3, by: 0 }, { bx: 0, by: 5 }, { bx: 5, by: 5 }, { bx: 7, by: 0 }];
const isPark = (bx, by) => PARKS.some((p) => p.bx === bx && p.by === by);
const usedBlock = (bx, by) => LANDMARKS.some((l) => l.bx === bx && l.by === by) || DEPOTS.some((d) => d.bx === bx && d.by === by) || isPark(bx, by);

const solids = [], poles = [], ponds = [], places = [], depotPlaces = [], miniHouses = [], miniTrees = [];

/* ================================================================ Tagwahl (auch für Fallback) */
function startTag() {
  let t = parseInt(QS.get("tag"), 10);
  if (!t || !S.days.some((d) => d.nr === t)) {
    t = 0; const now = new Date(); now.setHours(0, 0, 0, 0);
    S.days.forEach((d) => { const p = String(d.date).split("."); if (new Date(+p[2], +p[1] - 1, +p[0]) <= now) t = d.nr; });
  }
  return t || (S.days[0] ? S.days[0].nr : 1);
}
function hasWebGL() {
  try { const c = document.createElement("canvas"); return !!(window.WebGLRenderingContext && (c.getContext("webgl2") || c.getContext("webgl"))); } catch (e) { return false; }
}
function keinGL() {
  const t = startTag();
  $("lnkGl2d").href = "../stadt2d/index.html?tag=" + t;
  $("lnkGlLern").href = "../../index.html#/tag/" + t;
  $("eLaden").classList.add("versteckt"); $("eKeinGL").classList.remove("versteckt");
  window.__test = { state: () => "keinGL" };
}

/* ================================================================ Globale 3D-Objekte */
let renderer, scene, camera, maxAniso = 4;
const _m = new THREE.Matrix4(), _q = new THREE.Quaternion(), _s = new THREE.Vector3(), _p = new THREE.Vector3(), _e = new THREE.Euler();
const _nm = new THREE.Matrix3(), _v = new THREE.Vector3(), _n = new THREE.Vector3(), _c = new THREE.Color();
const WIN_U = 12.8, WIN_V = 14;

function makePrism() {
  const A = [-.5, 0, -.5], B = [.5, 0, -.5], C = [.5, 0, .5], Dd = [-.5, 0, .5], E = [-.5, 1, 0], F = [.5, 1, 0];
  const tris = [A, E, F, A, F, B, Dd, C, F, Dd, F, E, A, Dd, E, B, F, C];
  const g = new THREE.BufferGeometry(); g.setAttribute("position", new THREE.Float32BufferAttribute(tris.flat(), 3)); g.computeVertexNormals();
  g.setAttribute("uv", new THREE.Float32BufferAttribute(new Array(tris.length * 2).fill(0), 2)); return g;
}
const G = {
  box: new THREE.BoxGeometry(1, 1, 1), prism: makePrism(), ico: new THREE.IcosahedronGeometry(1, 0),
  cyl6: new THREE.CylinderGeometry(1, 1, 1, 6), cyl8: new THREE.CylinderGeometry(1, 1, 1, 8), cyl20: new THREE.CylinderGeometry(1, 1, 1, 20),
  cone4: new THREE.ConeGeometry(1, 1, 4), cone7: new THREE.ConeGeometry(1, 1, 7), cone8: new THREE.ConeGeometry(1, 1, 8),
  sphere: new THREE.SphereGeometry(1, 10, 7), plane: new THREE.PlaneGeometry(1, 1)
};

/* Zusammenführen vieler Teile zu einer Geometrie (eine Zeichnung für die ganze Stadt) */
class Merger {
  constructor() { this.p = []; this.n = []; this.u = []; this.c = []; this.i = []; this.cnt = 0; }
  add(geo, m, color, win) {
    const pos = geo.attributes.position, nor = geo.attributes.normal, idx = geo.index;
    _nm.getNormalMatrix(m); _c.set(color);
    for (let k = 0; k < pos.count; k++) {
      _v.fromBufferAttribute(pos, k).applyMatrix4(m);
      _n.fromBufferAttribute(nor, k).applyMatrix3(_nm).normalize();
      this.p.push(_v.x, _v.y, _v.z); this.n.push(_n.x, _n.y, _n.z);
      const wf = win != null && Math.abs(_n.y) < 0.5;
      if (wf) this.u.push((Math.abs(_n.x) > 0.5 ? _v.z : _v.x) / WIN_U, (_v.y - win) / WIN_V); else this.u.push(0, 0);
      this.c.push(_c.r, _c.g, _c.b, wf ? 1 : 0);
    }
    if (idx) for (let k = 0; k < idx.count; k++) this.i.push(idx.getX(k) + this.cnt);
    else for (let k = 0; k < pos.count; k++) this.i.push(k + this.cnt);
    this.cnt += pos.count;
  }
  geo(g, x, y, z, sx, sy, sz, color, ry = 0, rx = 0, rz = 0, win = null) {
    _p.set(x, y, z); _q.setFromEuler(_e.set(rx, ry, rz, "YXZ")); _s.set(sx, sy, sz); _m.compose(_p, _q, _s); this.add(g, _m, color, win);
  }
  box(cx, y0, cz, w, h, d, color, win = null, ry = 0) { this.geo(G.box, cx, y0 + h / 2, cz, w, h, d, color, ry, 0, 0, win); }
  build() {
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.Float32BufferAttribute(this.p, 3));
    g.setAttribute("normal", new THREE.Float32BufferAttribute(this.n, 3));
    g.setAttribute("uv", new THREE.Float32BufferAttribute(this.u, 2));
    g.setAttribute("color", new THREE.Float32BufferAttribute(this.c, 4));
    g.setIndex(this.i); g.computeBoundingSphere(); return g;
  }
}

/* ================================================================ Canvas-Texturen */
function cnv(w, h) { const c = document.createElement("canvas"); c.width = w; c.height = h; return c; }
function tex(c) { const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = maxAniso; return t; }
function rr(g, x, y, w, h, r) { g.beginPath(); g.moveTo(x + r, y); g.arcTo(x + w, y, x + w, y + h, r); g.arcTo(x + w, y + h, x, y + h, r); g.arcTo(x, y + h, x, y, r); g.arcTo(x, y, x + w, y, r); g.closePath(); }
function fit(g, text, x, y, maxw, size, weight = "700", fam = "Inter") {
  let s = size; g.font = `${weight} ${s}px ${fam}, sans-serif`;
  while (g.measureText(text).width > maxw && s > 10) { s -= 2; g.font = `${weight} ${s}px ${fam}, sans-serif`; }
  g.fillText(text, x, y); return s;
}
function makeWinTex() {
  const c = cnv(256, 256), g = c.getContext("2d");
  for (let i = 0; i < 4; i++) for (let j = 0; j < 4; j++) {
    const x = i * 64, y = j * 64, lit = (i * 7 + j * 3) % 5 === 0;
    g.fillStyle = "rgba(0,0,0,0.10)"; g.fillRect(x, y + 60, 64, 4);
    g.fillStyle = "rgba(255,255,255,0.95)"; g.fillRect(x + 12, y + 12, 40, 38);
    const gr = g.createLinearGradient(x + 14, y + 14, x + 50, y + 48);
    gr.addColorStop(0, lit ? "#fff0b8" : "#a9d0ea"); gr.addColorStop(1, lit ? "#f3c35a" : "#3f6f96");
    g.fillStyle = gr; g.fillRect(x + 15, y + 15, 34, 32);
    g.fillStyle = "rgba(255,255,255,0.9)"; g.fillRect(x + 31, y + 15, 2, 32);
    g.fillStyle = "rgba(255,255,255,0.35)"; g.beginPath(); g.moveTo(x + 15, y + 15); g.lineTo(x + 28, y + 15); g.lineTo(x + 15, y + 31); g.fill();
    g.fillStyle = "rgba(0,0,0,0.22)"; g.fillRect(x + 10, y + 50, 44, 3);
  }
  const t = tex(c); t.wrapS = t.wrapT = THREE.RepeatWrapping; return t;
}
function drawSign(c, text, farbe, badge) {
  const g = c.getContext("2d"), w = c.width, h = c.height;
  g.clearRect(0, 0, w, h);
  g.fillStyle = "#16263a"; rr(g, 0, 0, w, h, h * 0.16); g.fill();
  g.fillStyle = "#ffffff"; rr(g, 8, 8, w - 16, h - 16, h * 0.12); g.fill();
  g.fillStyle = farbe; g.fillRect(8, h - 30, w - 16, 22);
  let x0 = 30;
  if (badge) {
    g.fillStyle = badge.farbe; g.beginPath(); g.arc(30 + h * 0.32, h * 0.44, h * 0.3, 0, 7); g.fill();
    g.fillStyle = "#fff"; g.textAlign = "center"; g.textBaseline = "middle"; g.font = `700 ${Math.round(h * 0.38)}px Inter, sans-serif`; g.fillText(badge.txt, 30 + h * 0.32, h * 0.46);
    x0 = 40 + h * 0.64;
  }
  g.fillStyle = "#16263a"; g.textAlign = "center"; g.textBaseline = "middle";
  fit(g, text, (x0 + w - 30) / 2, h * 0.44, w - x0 - 30, Math.round(h * 0.46));
}
function makeLabelTex(text, farbe) {
  const c = cnv(512, 104), g = c.getContext("2d");
  g.fillStyle = "rgba(22,38,58,0.9)"; rr(g, 2, 2, 508, 100, 50); g.fill();
  g.fillStyle = farbe; g.beginPath(); g.arc(52, 52, 26, 0, 7); g.fill(); g.strokeStyle = "#fff"; g.lineWidth = 5; g.stroke();
  g.fillStyle = "#ffffff"; g.textAlign = "center"; g.textBaseline = "middle"; fit(g, text, 290, 54, 400, 46);
  return tex(c);
}
function makeLabel(text, farbe, x, y, z, w = 13) {
  const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: makeLabelTex(text, farbe), depthWrite: false }));
  sp.scale.set(w, w * 104 / 512, 1); sp.position.set(x, y, z); scene.add(sp); return sp;
}
function wrapLines(g, text, maxw) {
  const words = text.split(" "), lines = []; let cur = "";
  words.forEach((wd) => { const t = cur ? cur + " " + wd : wd; if (g.measureText(t).width > maxw && cur) { lines.push(cur); cur = wd; } else cur = t; });
  if (cur) lines.push(cur); return lines;
}
function makePlakatTex(text, i) {
  const c = cnv(640, 256), g = c.getContext("2d");
  const bgs = ["#fff8d6", "#e8f6ff", "#fff0e6", "#eefbe9"];
  g.fillStyle = bgs[i % bgs.length]; g.fillRect(0, 0, 640, 256);
  g.fillStyle = "#c0392b"; g.fillRect(0, 0, 640, 16); g.fillRect(0, 240, 640, 16);
  g.fillStyle = i % 2 ? "#003366" : "#c0392b"; g.textAlign = "center"; g.textBaseline = "middle";
  let size = 56, lines;
  do { g.font = `700 ${size}px Inter, sans-serif`; lines = wrapLines(g, text, 590); size -= 4; } while ((lines.length > 3 || lines.length * (size + 10) > 200) && size > 20);
  const lh = size + 12, y0 = 128 - (lines.length - 1) * lh / 2;
  lines.forEach((l, k) => g.fillText(l, 320, y0 + k * lh));
  g.font = "600 15px Inter, sans-serif"; g.fillStyle = "#5b6b7c"; g.fillText("Eine Anzeige von Radio Nordstern", 320, 228);
  return tex(c);
}
function makeBadgeTex(txt, farbe) {
  const c = cnv(128, 128), g = c.getContext("2d");
  g.fillStyle = farbe; g.beginPath(); g.arc(64, 64, 58, 0, 7); g.fill(); g.strokeStyle = "#fff"; g.lineWidth = 8; g.stroke();
  g.fillStyle = "#fff"; g.textAlign = "center"; g.textBaseline = "middle"; g.font = "700 70px Inter, sans-serif"; g.fillText(txt, 64, 70);
  return tex(c);
}
function makeBlobTex() {
  const c = cnv(64, 64), g = c.getContext("2d"), gr = g.createRadialGradient(32, 32, 2, 32, 32, 31);
  gr.addColorStop(0, "rgba(0,0,0,0.55)"); gr.addColorStop(0.6, "rgba(0,0,0,0.3)"); gr.addColorStop(1, "rgba(0,0,0,0)");
  g.fillStyle = gr; g.fillRect(0, 0, 64, 64); const t = new THREE.CanvasTexture(c); return t;
}
function makeCargoTex() {
  const c = cnv(256, 128), g = c.getContext("2d");
  g.fillStyle = "#0077a6"; g.fillRect(0, 0, 256, 128); g.fillStyle = "#003366"; g.fillRect(0, 100, 256, 28);
  g.fillStyle = "#f2a900"; star(g, 40, 52, 24, 10);
  g.fillStyle = "#fff"; g.textAlign = "left"; g.textBaseline = "middle"; fit(g, "NORDSTERN", 72, 54, 170, 36);
  g.font = "600 15px Inter, sans-serif"; g.fillText("Kurierdienst Personal", 72, 114);
  return tex(c);
}
function star(g, cx, cy, R, r) { g.beginPath(); for (let k = 0; k < 10; k++) { const a = -Math.PI / 2 + k * Math.PI / 5, rad = k % 2 ? r : R; g.lineTo(cx + Math.cos(a) * rad, cy + Math.sin(a) * rad); } g.closePath(); g.fill(); }
function makeLogoTex() {
  const c = cnv(256, 256), g = c.getContext("2d");
  g.fillStyle = "#003366"; g.beginPath(); g.arc(128, 128, 124, 0, 7); g.fill();
  g.strokeStyle = "#fff"; g.lineWidth = 10; g.beginPath(); g.arc(128, 128, 108, 0, 7); g.stroke();
  for (let k = 0; k < 12; k++) { const a = k * Math.PI / 6; g.lineWidth = 4; g.beginPath(); g.moveTo(128, 128); g.lineTo(128 + Math.cos(a) * 104, 128 + Math.sin(a) * 104); g.stroke(); }
  g.fillStyle = "#f2a900"; star(g, 128, 128, 70, 30);
  g.fillStyle = "#003366"; g.textAlign = "center"; g.textBaseline = "middle"; g.font = "700 40px Inter, sans-serif"; g.fillText("NS", 128, 134);
  return tex(c);
}
function makeClockTex() {
  const c = cnv(128, 128), g = c.getContext("2d");
  g.fillStyle = "#fffdf5"; g.beginPath(); g.arc(64, 64, 60, 0, 7); g.fill(); g.strokeStyle = "#2c2c2c"; g.lineWidth = 6; g.stroke();
  for (let k = 0; k < 12; k++) { const a = k * Math.PI / 6; g.fillStyle = "#2c2c2c"; g.fillRect(64 + Math.cos(a) * 48 - 3, 64 + Math.sin(a) * 48 - 3, 6, 6); }
  g.lineCap = "round"; g.lineWidth = 6; g.beginPath(); g.moveTo(64, 64); g.lineTo(64, 28); g.stroke();
  g.lineWidth = 5; g.beginPath(); g.moveTo(64, 64); g.lineTo(92, 74); g.stroke();
  return tex(c);
}
function signPlane(t, w, h, x, y, z, ry = 0, lit = true) {
  const mat = lit ? new THREE.MeshBasicMaterial({ map: t, alphaTest: 0.4 }) : new THREE.MeshLambertMaterial({ map: t, alphaTest: 0.4 });
  const m = new THREE.Mesh(G.plane, mat); m.scale.set(w, h, 1); m.position.set(x, y, z); m.rotation.y = ry; scene.add(m); return m;
}

/* ================================================================ Welt bauen */
const WALLS = ["#ead8b8", "#dcc5a9", "#c9d7e1", "#e7c4b4", "#d5e3c7", "#f1e3c2", "#d0c7de", "#e4bba2", "#bfcbd6", "#f0d0c8"];
const ROOFS = ["#c96a4a", "#9aa5b1", "#d9a441", "#7f8fa6", "#b8735a", "#8d9a6c", "#a56c8f"];
const TREECOL = ["#2e7d32", "#388e3c", "#43a047", "#4f8f2f", "#5a9e3a"];
let depotSigns = [], plakatStellen = [], clouds;

function tree(M, x, z, s, collide = true, y = Y0) {
  if (rnd() < 0.25) {
    M.geo(G.cyl6, x, y + 0.6 * s, z, 0.2 * s, 1.2 * s, 0.2 * s, "#6d4c2f");
    M.geo(G.cone7, x, y + 2.4 * s, z, 1.5 * s, 2.6 * s, 1.5 * s, "#2f6f3a");
    M.geo(G.cone7, x, y + 3.6 * s, z, 1.1 * s, 2.0 * s, 1.1 * s, "#3b8046");
  } else {
    M.geo(G.cyl6, x, y + 1.1 * s, z, 0.22 * s, 2.2 * s, 0.22 * s, "#7a5230");
    const col = TREECOL[Math.floor(rnd() * TREECOL.length)];
    M.geo(G.ico, x, y + 3.2 * s, z, 1.7 * s, 1.6 * s, 1.7 * s, col, rnd() * 3);
    M.geo(G.ico, x + 0.6 * s, y + 3.9 * s, z - 0.3 * s, 1.0 * s, 1.0 * s, 1.0 * s, col, rnd() * 3);
  }
  if (collide) { poles.push({ x, z, r: 0.35 * s }); miniTrees.push({ x, z, r: 1.6 * s }); }
}
function lamp(M, x, z, ang) {
  M.geo(G.cyl6, x, Y0 + 3, z, 0.1, 6, 0.1, "#56606b");
  M.geo(G.box, x + Math.cos(ang) * 0.7, Y0 + 5.95, z + Math.sin(ang) * 0.7, 1.4, 0.12, 0.12, "#56606b", -ang);
  M.geo(G.box, x + Math.cos(ang) * 1.35, Y0 + 5.8, z + Math.sin(ang) * 1.35, 0.7, 0.22, 0.42, "#fff3b0", -ang);
  poles.push({ x, z, r: 0.22 });
}
function house(M, x, z, w, d, k) {
  const floors = 2 + Math.floor(rnd() * 5), h = floors * 3.5;
  const wall = WALLS[Math.floor(rnd() * WALLS.length)];
  M.box(x + w / 2, Y0, z + d / 2, w, h, d, wall, Y0);
  let top = h, flat = false;
  if (h <= 10.5 && rnd() < 0.7) {
    const along = rnd() < 0.5, rc = ROOFS[Math.floor(rnd() * ROOFS.length)];
    M.geo(G.prism, x + w / 2, Y0 + h, z + d / 2, (along ? w : d) + 0.8, 3.4, (along ? d : w) + 0.8, rc, along ? 0 : Math.PI / 2);
    top = h + 3.4;
    if (rnd() < 0.6) M.box(x + w * 0.3, Y0 + h, z + d * 0.3, 0.8, 3.6, 0.8, "#8d6e63");
  } else {
    M.box(x + w / 2, Y0 + h, z + d / 2, w + 0.3, 0.45, d + 0.3, "#69737f");
    M.box(x + 2.5 + rnd() * 5, Y0 + h + 0.45, z + 2.5 + rnd() * 5, 1.8, 1.0, 1.3, "#b9c1c9");
    flat = true;
  }
  const south = k >= 2; // Eingang zur nächsten Straße
  M.box(x + w / 2, Y0, south ? z + d + 0.05 : z - 0.05, 1.6, 2.5, 0.15, "#6b4a32");
  solids.push({ x, z, w, d, h: Y0 + top });
  miniHouses.push({ x, z, w, d, c: wall });
  return { x, z, w, d, h, flat };
}
function buildLandmark(M, l, r) {
  const b = { x: r.x + 2.5, z: r.z + 2.5, w: 25, d: 22 }, cx = b.x + b.w / 2, cz = b.z + b.d / 2, front = b.z + b.d;
  const wall = lighten(l.farbe, 0.18), roof = "#5f6b77";
  let h = l.h, signY = Y0 + 5.3, labelY;
  if (l.typ === "werk") {
    M.box(cx, Y0, cz, b.w, h, b.d, wall, Y0);
    for (let k = 0; k < 4; k++) M.geo(G.prism, b.x + 3.125 + k * 6.25, Y0 + h, cz, b.d, 3.2, 6.25, k % 2 ? "#a8b3bf" : "#8f9ba8", Math.PI / 2);
    M.geo(G.cyl8, b.x + 21.5, Y0 + h + 4, b.z + 4, 1.1, 8, 1.1, "#b5651d"); M.geo(G.cyl8, b.x + 21.5, Y0 + h + 8.2, b.z + 4, 1.3, 0.5, 1.3, "#444");
    M.box(cx, Y0, front + 0.05, 9, 5.5, 0.2, "#34495e");
    for (let s = 0; s < 6; s++) M.box(cx, Y0 + 0.5 + s * 0.85, front + 0.18, 9, 0.08, 0.1, "#2c3e50");
    signY = Y0 + 7.0; labelY = Y0 + h + 12;
    const lt = makeLogoTex(); signPlane(lt, 6.5, 6.5, b.x + 5, Y0 + h + 6.6, cz + 0.2, 0); signPlane(lt, 6.5, 6.5, b.x + 5, Y0 + h + 6.6, cz - 0.2, Math.PI);
    M.box(b.x + 5, Y0 + h, cz, 0.3, 3.6, 0.3, "#56606b");
  } else if (l.typ === "halle") {
    M.box(cx, Y0, cz, b.w, h, b.d, wall);
    for (let s = 1; s < 8; s++) M.box(cx, Y0 + s * 1.1, front + 0.03, b.w, 0.1, 0.08, "#6b7778");
    M.geo(G.prism, cx, Y0 + h, cz, b.w + 0.6, 2.2, b.d + 0.6, "#95a5a6");
    for (let k = 0; k < 2; k++) M.box(b.x + 7 + k * 11, Y0, front + 0.06, 6, 5, 0.18, "#e67e22");
    for (let k = 0; k < 5; k++) M.box(b.x + 1.4 + (k % 2) * 1.3, Y0 + Math.floor(k / 2) * 1.2, front + 2.4, 1.2, 1.2, 1.2, "#c8a165");
    h += 2.2; labelY = Y0 + h + 3.5; signY = Y0 + 6.6;
  } else {
    if (h >= 16) {
      const h1 = Math.round(h * 0.6 / 3.5) * 3.5;
      M.box(cx, Y0, cz, b.w, h1, b.d, wall, Y0);
      M.box(cx, Y0 + h1, cz, b.w + 0.4, 0.4, b.d + 0.4, roof);
      M.box(cx, Y0 + h1, cz - 1, b.w - 5, h - h1, b.d - 6, wall, Y0);
      M.box(cx, Y0 + h, cz - 1, b.w - 4.6, 0.5, b.d - 5.6, roof);
      M.box(cx + 4, Y0 + h + 0.5, cz - 3, 3, 1.4, 2.4, "#b9c1c9");
    } else {
      M.box(cx, Y0, cz, b.w, h, b.d, wall, Y0);
      M.box(cx, Y0 + h, cz, b.w + 0.4, 0.5, b.d + 0.4, roof);
    }
    labelY = Y0 + h + 4;
    M.box(cx, Y0, front + 0.06, 4.2, 3.2, 0.2, "#22384d");
    if (l.typ === "saeulen" || l.typ === "gericht") {
      for (let k = 0; k < 6; k++) { const px = b.x + 3 + k * 3.8; M.geo(G.cyl8, px, Y0 + 3.6, front + 1.8, 0.45, 7.2, 0.45, "#f1efe8"); poles.push({ x: px, z: front + 1.8, r: 0.5 }); }
      M.box(cx, Y0 + 7.2, front + 1.6, 22.5, 0.9, 3.4, "#f1efe8");
      if (l.typ === "gericht") M.geo(G.prism, cx, Y0 + 8.1, front + 1.6, 22.5, 2.6, 3.4, "#e9e6dc");
      M.box(cx, Y0, front + 1.6, 23, 0.35, 4.2, "#d9d6cc");
      signY = Y0 + 12.1;
    } else if (l.typ === "cafe") {
      for (let k = 0; k < 8; k++) M.box(b.x + 1.5 + k * 3.14, Y0 + 3.1, front + 1.3, 3.14, 0.22, 2.6, k % 2 ? "#ffffff" : "#c0392b");
      for (let k = 0; k < 3; k++) {
        const ux = b.x + 5 + k * 7.5, uz = front + 4.4;
        M.geo(G.cyl6, ux, Y0 + 1.2, uz, 0.06, 2.4, 0.06, "#ddd"); M.geo(G.cone8, ux, Y0 + 2.6, uz, 1.6, 0.7, 1.6, k % 2 ? "#f2a900" : "#27ae60");
        M.geo(G.cyl8, ux, Y0 + 0.75, uz, 0.6, 0.06, 0.6, "#fff"); poles.push({ x: ux, z: uz, r: 0.7 });
      }
      signY = Y0 + 4.6;
    } else {
      M.box(cx, Y0 + 3.4, front + 1.2, 7.5, 0.3, 2.6, "#f4f4f4");
      M.geo(G.cyl6, cx - 3.4, Y0 + 1.7, front + 2.3, 0.08, 3.4, 0.08, "#ccc"); M.geo(G.cyl6, cx + 3.4, Y0 + 1.7, front + 2.3, 0.08, 3.4, 0.08, "#ccc");
    }
    if (l.typ === "rathaus") {
      M.box(cx, Y0 + h, b.z + 7, 6, 11, 6, wall, Y0); M.geo(G.cone4, cx, Y0 + h + 13, b.z + 7, 4.6, 4, 4.6, "#2e7d6f", Math.PI / 4);
      const ct = makeClockTex(); signPlane(ct, 3.6, 3.6, cx, Y0 + h + 8, b.z + 10.06, 0, false);
      labelY = Y0 + h + 17;
    }
    if (l.typ === "kreuz") {
      M.box(cx, Y0 + h + 0.5, cz, 4.6, 4.6, 0.4, "#ffffff"); M.box(cx, Y0 + h + 1.0, cz, 1.3, 3.6, 0.6, "#16a085"); M.box(cx, Y0 + h + 2.15, cz, 3.6, 1.3, 0.6, "#16a085");
      labelY = Y0 + h + 7;
    }
    if (l.typ === "schule") {
      M.geo(G.cyl6, b.x + 1.5, Y0 + 5, front + 3.5, 0.08, 10, 0.08, "#ccc"); M.box(b.x + 2.6, Y0 + 8.6, front + 3.5, 2.2, 1.3, 0.06, "#f2a900");
      poles.push({ x: b.x + 1.5, z: front + 3.5, r: 0.2 });
    }
  }
  solids.push({ x: b.x, z: b.z, w: b.w, d: b.d, h: Y0 + h + 1 });
  miniHouses.push({ x: b.x, z: b.z, w: b.w, d: b.d, c: l.farbe, land: true });
  const sc = cnv(1024, 176); drawSign(sc, l.name, l.farbe);
  const sw = clamp(6 + l.name.length * 0.72, 9, 20);
  signPlane(tex(sc), sw, sw * 176 / 1024, cx, signY, front + 0.12, 0);
  makeLabel(l.name, l.farbe, cx, labelY, cz, 14);
}
function buildDepot(M, dp, i) {
  const r = blockRect(dp.bx, dp.by), b = { x: r.x + 2.5, z: r.z + 3, w: 25, d: 20.5, h: 8 }, cx = b.x + b.w / 2, cz = b.z + b.d / 2, front = b.z + b.d;
  M.box(cx, Y0, cz, b.w, b.h, b.d, "#b08d78");
  for (let s = 1; s < 7; s++) M.box(cx, Y0 + s * 1.15, front + 0.03, b.w, 0.1, 0.08, "#8d6e63");
  M.box(cx, Y0 + b.h, cz, b.w + 0.6, 0.5, b.d + 0.6, "#6d4c41");
  for (let k = 0; k < 3; k++) {
    const dx = b.x + 4.5 + k * 8;
    M.box(dx, Y0, front + 0.06, 5.4, 4.6, 0.16, "#8e99a3");
    for (let s = 0; s < 6; s++) M.box(dx, Y0 + 0.4 + s * 0.72, front + 0.16, 5.4, 0.06, 0.06, "#66707a");
  }
  for (let k = 0; k < 4; k++) M.box(b.x + 1.2 + (k % 2) * 1.25, Y0 + Math.floor(k / 2) * 1.0, front + 2.6, 1.15, 1.0, 1.15, "#c8a165");
  M.box(b.x + b.w - 1.5, Y0, front + 2.4, 1.2, 0.15, 1.2, "#a1795a");
  solids.push({ x: b.x, z: b.z, w: b.w, d: b.d, h: Y0 + b.h + 1 });
  miniHouses.push({ x: b.x, z: b.z, w: b.w, d: b.d, c: "#6d4c41", depot: true });
  const sc = cnv(1024, 176); drawSign(sc, "Depot", "#6d4c41"); const st = tex(sc);
  signPlane(st, 18, 3.1, cx, Y0 + 6.2, front + 0.12, 0);
  const label = makeLabel("Depot", "#6d4c41", cx, Y0 + b.h + 4, cz, 14);
  const d = doorPoint(dp.bx, dp.by);
  depotPlaces.push({ x: d.x, z: d.z, canvas: sc, tex: st, label, text: "" });
}
function setDepotSign(dp, text, badge) {
  const key = text + (badge ? badge.txt + badge.farbe : "");
  if (dp.text === key) return; dp.text = key;
  drawSign(dp.canvas, text, badge ? badge.farbe : "#6d4c41", badge); dp.tex.needsUpdate = true;
  const old = dp.label.material.map; dp.label.material.map = makeLabelTex(text, badge ? badge.farbe : "#6d4c41"); old.dispose(); dp.label.material.needsUpdate = true;
}
function buildPark(M, p) {
  const r = blockRect(p.bx, p.by), cx = r.x + 15, cz = r.z + 15, a = 6.8, b = 4.8;
  M.box(cx, Y0, r.z + 4.5, 2.4, 0.02, 9.6, "#e3d3a4"); M.box(cx, Y0, r.z + 25.5, 2.4, 0.02, 9.6, "#e3d3a4");
  M.box(r.x + 3.5, Y0, cz, 7.6, 0.02, 2.4, "#e3d3a4"); M.box(r.x + 26.5, Y0, cz, 7.6, 0.02, 2.4, "#e3d3a4");
  M.geo(G.cyl20, cx, Y0 + 0.12, cz, a + 0.8, 0.26, b + 0.8, "#a19d8c");
  M.geo(G.cyl20, cx, Y0 + 0.14, cz, a, 0.26, b, "#4aa3d8");
  M.geo(G.cyl8, cx, Y0 + 0.5, cz, 0.6, 0.8, 0.6, "#cfd8dc"); M.geo(G.cone8, cx, Y0 + 1.5, cz, 0.35, 1.4, 0.35, "#e3f4fd");
  for (let k = 0; k < 3; k++) { const ex = cx - 4 + k * 3.2, ez = cz + (k % 2 ? 2.2 : -2.4); M.box(ex, Y0 + 0.27, ez, 0.5, 0.3, 0.35, "#ffd54f"); M.box(ex + 0.25, Y0 + 0.5, ez, 0.25, 0.25, 0.22, "#ffd54f"); M.box(ex + 0.42, Y0 + 0.55, ez, 0.14, 0.06, 0.1, "#ef8f00"); }
  ponds.push({ x: cx, z: cz, a: a + 0.8, b: b + 0.8 });
  [[cx - 2.6, r.z + 4, Math.PI / 2], [cx + 2.6, r.z + 26, Math.PI / 2], [r.x + 4, cz - 2.6, 0], [r.x + 26, cz + 2.6, 0]].forEach(([x, z, ry]) => {
    M.box(x, Y0 + 0.45, z, 1.8, 0.1, 0.55, "#8d5a3b", null, ry); M.box(x, Y0, z, 1.6, 0.45, 0.4, "#555", null, ry);
  });
  let n = 0, tries = 0;
  while (n < 13 && tries++ < 200) {
    const tx = r.x + 2 + rnd() * 26, tz = r.z + 2 + rnd() * 26;
    if (((tx - cx) / (a + 3)) ** 2 + ((tz - cz) / (b + 3)) ** 2 < 1) continue;
    if (Math.abs(tx - cx) < 2.6 || Math.abs(tz - cz) < 2.6) continue;
    if (poles.some((q) => Math.hypot(q.x - tx, q.z - tz) < 3.2)) continue;
    tree(M, tx, tz, 0.85 + rnd() * 0.45); n++;
  }
  for (let k = 0; k < 16; k++) {
    const fx = r.x + 1 + rnd() * 28, fz = r.z + 1 + rnd() * 28;
    if (((fx - cx) / (a + 1.5)) ** 2 + ((fz - cz) / (b + 1.5)) ** 2 < 1 || Math.abs(fx - cx) < 1.6 || Math.abs(fz - cz) < 1.6) continue;
    M.box(fx, Y0, fz, 0.5, 0.35, 0.5, ["#e74c3c", "#f1c40f", "#ffffff", "#9b59b6", "#ff8fab"][k % 5]);
  }
  miniHouses.push({ x: r.x, z: r.z, w: 30, d: 30, park: true, cx, cz, a, b });
}

function buildWorld() {
  const M = new Merger();
  const ASPH = "#4c535b", SIDE = "#d4d9dd", CURB = "#a7afb6", WHITE = "#f2f2f2";
  M.box(W / 2, -1, D / 2, 2000, 1, 2000, "#7fb069");
  for (let i = 0; i <= NX; i++) M.box(roadC(i), 0, D / 2, 2 * T, 0.02, D, ASPH);
  for (let j = 0; j <= NY; j++) M.box(W / 2, 0, roadC(j), W, 0.02, 2 * T, ASPH);
  const MK = 0.02, MH = 0.014;
  for (let i = 0; i <= NX; i++) for (let j = 0; j < NY; j++) { const x = roadC(i), z0 = roadC(j) + T + 4.2, z1 = roadC(j + 1) - T - 4.2; for (let z = z0; z + 2.4 <= z1 + 0.01; z += 4.4) M.box(x, MK, z + 1.2, 0.2, MH, 2.4, WHITE); }
  for (let j = 0; j <= NY; j++) for (let i = 0; i < NX; i++) { const z = roadC(j), x0 = roadC(i) + T + 4.2, x1 = roadC(i + 1) - T - 4.2; for (let x = x0; x + 2.4 <= x1 + 0.01; x += 4.4) M.box(x + 1.2, MK, z, 2.4, MH, 0.2, WHITE); }
  for (let i = 0; i <= NX; i++) for (let j = 0; j <= NY; j++) {
    const cx = roadC(i), cz = roadC(j);
    [[1, 0], [-1, 0], [0, 1], [0, -1]].forEach(([dx, dz]) => {
      const ni = i + dx, nj = j + dz; if (ni < 0 || nj < 0 || ni > NX || nj > NY) return;
      const al = T + 1.9;
      for (let k = -3; k <= 3; k++) {
        const off = k * 1.15;
        if (dx !== 0) M.box(cx + dx * al, MK, cz + off, 3, MH, 0.6, WHITE); else M.box(cx + off, MK, cz + dz * al, 0.6, MH, 3, WHITE);
      }
      if (dx !== 0) M.box(cx + dx * (T + 3.9), MK, cz + dx * 2.1, 0.35, MH, 4.0, WHITE); else M.box(cx - dz * 2.1, MK, cz + dz * (T + 3.9), 4.0, MH, 0.35, WHITE);
    });
  }
  for (let by = 0; by < NY; by++) for (let bx = 0; bx < NX; bx++) {
    const r = blockRect(bx, by), park = isPark(bx, by);
    M.box(r.x + 15, 0, r.z + 15, 31.6, 0.16, 31.6, CURB);
    M.box(r.x + 15, 0, r.z + 15, 31.2, Y0, 31.2, park ? "#79b85f" : SIDE);
    [[r.x - 0.2, r.z - 0.2, -3 * Math.PI / 4], [r.x + 30.2, r.z - 0.2, -Math.PI / 4], [r.x - 0.2, r.z + 30.2, 3 * Math.PI / 4], [r.x + 30.2, r.z + 30.2, Math.PI / 4]]
      .forEach(([x, z, a]) => lamp(M, x, z, a));
  }
  LANDMARKS.forEach((l) => { buildLandmark(M, l, blockRect(l.bx, l.by)); const d = doorPoint(l.bx, l.by); places.push({ name: l.name, x: d.x, z: d.z, farbe: l.farbe }); });
  DEPOTS.forEach((dp, i) => buildDepot(M, dp, i));
  PARKS.forEach((p) => buildPark(M, p));
  const flatHouses = [];
  for (let by = 0; by < NY; by++) for (let bx = 0; bx < NX; bx++) {
    if (usedBlock(bx, by)) continue;
    const r = blockRect(bx, by);
    for (let k = 0; k < 4; k++) {
      const hx = r.x + 2 + (k % 2) * 14, hz = r.z + 2 + Math.floor(k / 2) * 14;
      if (rnd() < 0.18) { tree(M, hx + 3.5, hz + 3.5, 1.1); tree(M, hx + 8.5, hz + 8, 0.95); M.box(hx + 6, Y0, hz + 6, 12, 0.03, 12, "#86c06c"); miniHouses.push({ x: hx, z: hz, w: 12, d: 12, gruen: true }); continue; }
      const hs = house(M, hx, hz, 12, 12, k);
      if (hs.flat && hs.h <= 14) flatHouses.push(hs);
    }
  }
  // Plakatwände auf flachen Dächern
  const step = Math.max(1, Math.floor(flatHouses.length / PLAKATE.length));
  for (let i = 0; i < PLAKATE.length && i * step < flatHouses.length; i++) {
    const hs = flatHouses[(i * step + 1) % flatHouses.length], cx = hs.x + hs.w / 2, cz = hs.z + hs.d / 2, ry = i % 2 ? Math.PI / 2 : 0;
    const yb = Y0 + hs.h + 0.45, bw = 10, bh = 4;
    const ox = Math.cos(ry) * 3.5, oz = -Math.sin(ry) * 3.5;
    M.box(cx - ox, yb, cz - oz, 0.25, 2.2 + bh, 0.25, "#3b3f45"); M.box(cx + ox, yb, cz + oz, 0.25, 2.2 + bh, 0.25, "#3b3f45");
    M.box(cx, yb + 2, cz, bw + 0.5, bh + 0.5, 0.18, "#16263a", null, ry);
    const t = makePlakatTex(PLAKATE[i], i), nx = Math.sin(ry) * 0.11, nz = Math.cos(ry) * 0.11;
    signPlane(t, bw, bh, cx + nx, yb + 2 + bh / 2 + 0.25, cz + nz, ry); signPlane(t, bw, bh, cx - nx, yb + 2 + bh / 2 + 0.25, cz - nz, ry + Math.PI);
    plakatStellen.push({ x: cx, z: cz });
  }
  // Hecke am Stadtrand und Landschaft
  const HE = "#3f7d3a";
  M.box(-1.8, 0, D / 2, 1.8, 1.4, D + 7.2, HE); M.box(W + 1.8, 0, D / 2, 1.8, 1.4, D + 7.2, HE);
  M.box(W / 2, 0, -1.8, W + 7.2, 1.4, 1.8, HE); M.box(W / 2, 0, D + 1.8, W + 7.2, 1.4, 1.8, HE);
  for (let k = 0; k < 170; k++) {
    const side = k % 4, t = rnd(), o = 6 + rnd() * 55;
    const x = side === 0 ? -o : side === 1 ? W + o : t * (W + 120) - 60, z = side === 2 ? -o : side === 3 ? D + o : t * (D + 120) - 60;
    tree(M, x, z, 1 + rnd() * 0.8, false, 0);
  }
  for (let k = 0; k < 22; k++) {
    const a = k / 22 * Math.PI * 2 + rnd() * 0.2, dist = 430 + rnd() * 120, rad = 70 + rnd() * 70;
    M.geo(G.cone7, W / 2 + Math.cos(a) * dist, 0, D / 2 + Math.sin(a) * dist, rad, 2 * (28 + rnd() * 40), rad, rnd() < 0.5 ? "#6f9e5b" : "#5f8f55", rnd() * 3);
  }
  // Material: Wandfarbe aus Vertex-Farben, Fenster aus der Textur (nur wo vColor.a = 1)
  const mat = new THREE.MeshLambertMaterial({ map: makeWinTex(), vertexColors: true });
  mat.onBeforeCompile = (sh) => {
    sh.fragmentShader = sh.fragmentShader.replace("#include <map_fragment>", "").replace("#include <color_fragment>",
      `#if defined( USE_COLOR ) || defined( USE_COLOR_ALPHA )
        diffuseColor.rgb *= vColor.rgb;
        #ifdef USE_MAP
          vec4 texC = texture2D( map, vMapUv );
          diffuseColor.rgb = mix( diffuseColor.rgb, texC.rgb, texC.a * vColor.a );
        #endif
      #endif`);
  };
  const mesh = new THREE.Mesh(M.build(), mat); mesh.matrixAutoUpdate = false; mesh.frustumCulled = false; scene.add(mesh);
  // Wolken und Sonne
  const CM = new Merger();
  for (let k = 0; k < 14; k++) {
    const x = rnd() * 900 - 300, z = rnd() * 900 - 330, y = 95 + rnd() * 50, s = 10 + rnd() * 12;
    for (let q = 0; q < 4; q++) CM.geo(G.ico, x + (q - 1.5) * s * 0.9, y + (q % 2) * s * 0.3, z + (rnd() - 0.5) * s, s * (0.9 + rnd() * 0.5), s * 0.6, s * (0.8 + rnd() * 0.4), "#ffffff", rnd() * 3);
  }
  clouds = new THREE.Mesh(CM.build(), new THREE.MeshLambertMaterial({ vertexColors: true, fog: false, emissive: new THREE.Color("#9fb3c4") }));
  scene.add(clouds);
}

/* ================================================================ Minikarte (statisch vorgezeichnet) */
const MPX = 2; let miniStatic;
function paintMini() {
  const c = cnv(Math.ceil(W * MPX), Math.ceil(D * MPX)), g = c.getContext("2d"); g.scale(MPX, MPX);
  g.fillStyle = "#7fb069"; g.fillRect(0, 0, W, D);
  for (let by = 0; by < NY; by++) for (let bx = 0; bx < NX; bx++) { const r = blockRect(bx, by); g.fillStyle = isPark(bx, by) ? "#86c06c" : "#d9dee2"; g.fillRect(r.x - 0.8, r.z - 0.8, r.w + 1.6, r.d + 1.6); }
  g.fillStyle = "#4c535b";
  for (let i = 0; i <= NX; i++) g.fillRect(i * BLK, 0, 2 * T, D);
  for (let j = 0; j <= NY; j++) g.fillRect(0, j * BLK, W, 2 * T);
  miniHouses.forEach((h) => {
    if (h.park) { g.fillStyle = "#4aa3d8"; g.beginPath(); g.ellipse(h.cx, h.cz, h.a, h.b, 0, 0, 7); g.fill(); return; }
    if (h.gruen) { g.fillStyle = "#86c06c"; g.fillRect(h.x, h.z, h.w, h.d); return; }
    g.fillStyle = h.land || h.depot ? h.c : "#9aa4ae"; g.fillRect(h.x, h.z, h.w, h.d);
    g.strokeStyle = "rgba(0,0,0,.25)"; g.lineWidth = 0.8; g.strokeRect(h.x, h.z, h.w, h.d);
  });
  g.fillStyle = "#2e7d32"; miniTrees.forEach((t) => { g.beginPath(); g.arc(t.x, t.z, t.r, 0, 7); g.fill(); });
  miniStatic = c;
}

/* ================================================================ Fahrzeuge */
const blobTex = makeBlobTex();
let shadows;
function makeShadows(n) {
  const geo = new THREE.PlaneGeometry(1, 1); geo.rotateX(-Math.PI / 2);
  shadows = new THREE.InstancedMesh(geo, new THREE.MeshBasicMaterial({ map: blobTex, transparent: true, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2 }), n);
  shadows.frustumCulled = false; shadows.renderOrder = 1; scene.add(shadows);
}
function setShadow(i, x, z, y, sx, sz, ang, k) {
  _p.set(x, y + 0.03, z); _q.setFromEuler(_e.set(0, -ang, 0)); _s.set(sx * k, 1, sz * k); _m.compose(_p, _q, _s); shadows.setMatrixAt(i, _m);
}

const CARCOL = ["#e74c3c", "#f1c40f", "#3498db", "#9b59b6", "#1abc9c", "#e67e22", "#ecf0f1", "#34495e"];
const carMat = new THREE.MeshLambertMaterial({ vertexColors: true });
function carGeo(col, k) {
  const M = new Merger(), van = k % 4 === 3;
  if (van) {
    M.box(0, 0.35, 0, 4.4, 1.9, 1.95, col);
    M.box(1.45, 1.25, 0, 1.4, 0.85, 1.97, "#2b3e50");
    M.box(-0.6, 1.0, 0, 2.6, 0.9, 1.99, "#ffffff");
  } else {
    M.box(0, 0.35, 0, 4.2, 0.78, 1.9, col);
    M.box(-0.25, 1.13, 0, 2.3, 0.68, 1.72, "#2b3e50");
    M.box(-0.25, 1.78, 0, 2.15, 0.1, 1.62, col);
    M.box(0.86, 1.13, 0, 0.12, 0.66, 1.74, col); M.box(-1.34, 1.13, 0, 0.12, 0.66, 1.74, col);
  }
  [[1.35, 0.92], [1.35, -0.92], [-1.35, 0.92], [-1.35, -0.92]].forEach(([x, z]) => { M.geo(G.cyl8, x, 0.38, z, 0.38, 0.3, 0.38, "#1b1f24", 0, Math.PI / 2); M.geo(G.cyl8, x, 0.38, z + Math.sign(z) * 0.01, 0.2, 0.31, 0.2, "#aab3bc", 0, Math.PI / 2); });
  const hl = van ? 2.21 : 2.11;
  M.box(hl, 0.55, 0.62, 0.06, 0.2, 0.4, "#fff6c2"); M.box(hl, 0.55, -0.62, 0.06, 0.2, 0.4, "#fff6c2");
  M.box(-hl, 0.6, 0.66, 0.06, 0.18, 0.34, "#c0392b"); M.box(-hl, 0.6, -0.66, 0.06, 0.18, 0.34, "#c0392b");
  M.box(hl + 0.02, 0.28, 0, 0.12, 0.22, 1.9, "#7d858c"); M.box(-hl - 0.02, 0.28, 0, 0.12, 0.22, 1.9, "#7d858c");
  return M.build();
}
const cars = [];
function nodePos(i, j) { return { x: roadC(i), z: roadC(j) }; }
function pickNext(c) {
  const opts = [[1, 0], [-1, 0], [0, 1], [0, -1]].filter(([dx, dz]) => {
    const ni = c.i + dx, nj = c.j + dz;
    return ni >= 0 && nj >= 0 && ni <= NX && nj <= NY && !(dx === -c.dx && dz === -c.dz && (c.dx || c.dz));
  });
  const d = opts[Math.floor(Math.random() * opts.length)]; c.dx = d[0]; c.dz = d[1]; c.ti = c.i + d[0]; c.tj = c.j + d[1];
}
function placeCar(c, far) {
  for (let tries = 0; tries < 60; tries++) {
    c.i = Math.floor(Math.random() * (NX + 1)); c.j = Math.floor(Math.random() * (NY + 1)); c.dx = c.dz = 0; pickNext(c);
    const p = nodePos(c.i, c.j), x = p.x - c.dz * 2.3, z = p.z + c.dx * 2.3;
    if (far && Math.hypot(x - P.x, z - P.z) < 75) continue;
    if (cars.some((o) => o !== c && Math.hypot(o.x - x, o.z - z) < 12)) continue;
    c.x = x; c.z = z; break;
  }
  c.yaw = Math.atan2(c.dz, c.dx); c.y = 0; c.rx = c.rz = 0; c.stun = 0; c.vx = c.vy = c.vz = 0; c.cur = c.sp * 0.5; c.hop = 0; c.cool = 0;
  c.mesh.visible = true;
}
function spawnCars(n) {
  const geos = CARCOL.map((col, k) => carGeo(col, k));
  for (let k = 0; k < n; k++) {
    const mesh = new THREE.Mesh(geos[k % geos.length], carMat); mesh.rotation.order = "YXZ"; scene.add(mesh);
    const c = { mesh, sp: 7 + Math.random() * 4.5, name: k < RIVALEN.length ? RIVALEN[k] : "", x: -999, z: -999, i: 0, j: 0, dx: 0, dz: 0 };
    cars.push(c); placeCar(c, false);
  }
}
function launchCar(c, dirx, dirz, power) {
  const l = Math.hypot(dirx, dirz) || 1; dirx /= l; dirz /= l;
  c.stun = 2.4; c.vx = dirx * power * 0.95; c.vz = dirz * power * 0.95; c.vy = 5 + power * 0.42;
  c.sx = (Math.random() < 0.5 ? -1 : 1) * (4 + Math.random() * 6); c.sz = (Math.random() < 0.5 ? -1 : 1) * (3 + Math.random() * 6); c.sy = (Math.random() - 0.5) * 8;
}
function updateCar(c, dt) {
  if (c.cool > 0) c.cool -= dt;
  if (c.stun > 0) {
    c.stun -= dt; c.vy -= 22 * dt; c.x += c.vx * dt; c.y += c.vy * dt; c.z += c.vz * dt;
    c.rx += c.sx * dt; c.rz += c.sz * dt; c.yaw += c.sy * dt;
    if (c.y < 0) { c.y = 0; if (c.vy < -3) { c.vy = -c.vy * 0.38; c.sx *= 0.6; c.sz *= 0.6; } else { c.vy = 0; c.sx *= 0.2; c.sz *= 0.2; c.rx *= 0.9; c.rz *= 0.9; } c.vx *= 0.7; c.vz *= 0.7; }
    for (const s of solids) {
      if (c.y < s.h && c.x > s.x - 1 && c.x < s.x + s.w + 1 && c.z > s.z - 1 && c.z < s.z + s.d + 1) {
        const l = c.x - (s.x - 1), rr2 = s.x + s.w + 1 - c.x, t = c.z - (s.z - 1), bt = s.z + s.d + 1 - c.z, mn = Math.min(l, rr2, t, bt);
        if (mn === l) { c.x = s.x - 1; c.vx = -Math.abs(c.vx) * 0.4; } else if (mn === rr2) { c.x = s.x + s.w + 1; c.vx = Math.abs(c.vx) * 0.4; }
        else if (mn === t) { c.z = s.z - 1; c.vz = -Math.abs(c.vz) * 0.4; } else { c.z = s.z + s.d + 1; c.vz = Math.abs(c.vz) * 0.4; }
      }
    }
    c.x = clamp(c.x, 2, W - 2); c.z = clamp(c.z, 2, D - 2);
    const sp = Math.hypot(c.vx, c.vz);
    if (sp > 4 && c.y < 2.5) for (const o of cars) {
      if (o === c || o.stun > 0) continue;
      if (Math.abs(o.x - c.x) < 3.2 && Math.abs(o.z - c.z) < 3.2) { launchCar(o, o.x - c.x, o.z - c.z, sp * 0.8 + 3); c.vx *= 0.6; c.vz *= 0.6; if (Math.random() < 0.6) say("Kettenreaktion!", o.x, 3, o.z, "weiss"); sfx.crash(0.5); }
    }
    if (c.stun <= 0) { poof(c.x, c.y + 0.8, c.z); placeCar(c, true); }
    return;
  }
  const tgt = nodePos(c.ti, c.tj), off = 2.3;
  const tx = tgt.x - c.dz * off, tz = tgt.z + c.dx * off;
  const ddx = tx - c.x, ddz = tz - c.z, dist = Math.hypot(ddx, ddz);
  if (dist < 0.6) { c.i = c.ti; c.j = c.tj; pickNext(c); return; }
  let want = c.sp * (dist < 7 ? 0.62 : 1);
  const fx = Math.cos(c.yaw), fz = Math.sin(c.yaw);
  for (const o of cars) {
    if (o === c) continue;
    const ox = o.x - c.x, oz = o.z - c.z, al = ox * fx + oz * fz, lat = Math.abs(-ox * fz + oz * fx);
    if (al > 0 && al < 9 && lat < 1.8) want = Math.min(want, al < 5 ? 0 : (o.cur || 0));
  }
  if (state === "play") { const ox = P.x - c.x, oz = P.z - c.z, al = ox * fx + oz * fz, lat = Math.abs(-ox * fz + oz * fx); if (al > 0 && al < 8 && lat < 1.6) want = Math.min(want, 1.5); }
  c.cur += (want - c.cur) * Math.min(1, 2.5 * dt);
  const step = Math.min(dist, c.cur * dt); c.x += ddx / dist * step; c.z += ddz / dist * step;
  c.yaw += angDiff(c.yaw, Math.atan2(ddz, ddx)) * Math.min(1, 9 * dt);
  if (c.hop > 0) { c.hop -= dt; c.y = Math.max(0, Math.sin((0.5 - c.hop) / 0.5 * Math.PI) * 0.8); } else c.y = 0;
}

/* ================================================================ Lastenrad */
const P = { x: 0, z: 0, y: 0.02, ang: 0, v: 0, steer: 0, boost: 1, navi: -1, wheel: 0, crank: 0, lean: 0, turbo: false };
let bike;
function makeBike() {
  const root = new THREE.Group(), lean = new THREE.Group(); root.add(lean);
  const L = (c) => new THREE.MeshLambertMaterial({ color: c });
  const mBlue = L("#0077a6"), mDark = L("#003366"), mBlack = L("#1d232a"), mMetal = L("#c3ccd5"), mJacket = L("#f2a900"), mSkin = L("#e9b48c"), mPants = L("#2c3e50"), mWhite = L("#ffffff"), mBrown = L("#b5814b");
  const bx = (w, h, d, mat, x, y, z, rz = 0, parent = lean) => { const m = new THREE.Mesh(G.box, mat); m.scale.set(w, h, d); m.position.set(x, y, z); m.rotation.z = rz; parent.add(m); return m; };
  const wheelGeo = new THREE.TorusGeometry(1, 0.17, 6, 16);
  function wheel(r, x) {
    const g = new THREE.Group(); g.position.set(x, r, 0);
    const t = new THREE.Mesh(wheelGeo, mBlack); t.scale.setScalar(r); g.add(t);
    const s1 = new THREE.Mesh(G.box, mMetal); s1.scale.set(r * 1.85, 0.035, 0.035); g.add(s1);
    const s2 = s1.clone(); s2.rotation.z = Math.PI / 2; g.add(s2); const s3 = s1.clone(); s3.rotation.z = Math.PI / 4; g.add(s3); const s4 = s1.clone(); s4.rotation.z = -Math.PI / 4; g.add(s4);
    lean.add(g); return g;
  }
  const rear = wheel(0.37, -0.95), frontW = wheel(0.27, 1.32);
  bx(0.55, 0.06, 0.06, mDark, -0.7, 0.38, 0.06); bx(0.55, 0.06, 0.06, mDark, -0.7, 0.38, -0.06);
  bx(0.07, 0.68, 0.07, mDark, -0.55, 0.72, 0, 0.18);
  bx(0.7, 0.06, 0.06, mDark, -0.78, 0.72, 0, 0.9);
  bx(0.62, 0.07, 0.07, mDark, -0.25, 1.0, 0, -0.05);
  bx(1.85, 0.09, 0.09, mDark, 0.42, 0.34, 0, 0.02);
  bx(0.07, 0.8, 0.07, mDark, 0.02, 0.78, 0, -0.3);
  bx(0.06, 0.06, 0.66, mBlack, -0.04, 1.2, 0);
  bx(0.07, 0.36, 0.07, mDark, 1.32, 0.42, 0.06, 0.2); bx(0.07, 0.36, 0.07, mDark, 1.32, 0.42, -0.06, 0.2);
  const box = bx(0.98, 0.52, 0.8, mBlue, 0.62, 0.62, 0); box.userData.k = 1;
  bx(1.0, 0.06, 0.82, mDark, 0.62, 0.89, 0);
  const ct = makeCargoTex(), cm = new THREE.MeshBasicMaterial({ map: ct });
  const sideA = new THREE.Mesh(G.plane, cm); sideA.scale.set(0.92, 0.46, 1); sideA.position.set(0.62, 0.62, 0.405); lean.add(sideA);
  const sideB = sideA.clone(); sideB.position.z = -0.405; sideB.rotation.y = Math.PI; lean.add(sideB);
  const lightM = new THREE.MeshBasicMaterial({ color: "#fff8cf" }); const hl = new THREE.Mesh(G.box, lightM); hl.scale.set(0.05, 0.13, 0.2); hl.position.set(1.12, 0.8, 0); lean.add(hl);
  bx(0.28, 0.07, 0.17, mBlack, -0.62, 1.05, 0);
  // Fahrerin
  const torso = bx(0.27, 0.6, 0.42, mJacket, -0.45, 1.38, 0, -0.5);
  bx(0.29, 0.1, 0.44, mDark, -0.47, 1.36, 0, -0.5);
  const head = new THREE.Mesh(G.sphere, mSkin); head.scale.setScalar(0.15); head.position.set(-0.2, 1.76, 0); lean.add(head);
  const helm = new THREE.Mesh(new THREE.SphereGeometry(1, 10, 6, 0, Math.PI * 2, 0, Math.PI / 2), mBlue); helm.scale.set(0.18, 0.15, 0.17); helm.position.set(-0.21, 1.8, 0); lean.add(helm);
  bx(0.12, 0.03, 0.3, mWhite, -0.17, 1.93, 0);
  [-1, 1].forEach((sd) => { const a = bx(0.5, 0.09, 0.09, mJacket, -0.17, 1.39, sd * 0.25, -0.95); a.rotation.y = sd * 0.12; });
  const legs = [];
  [-1, 1].forEach((sd) => {
    const th = new THREE.Group(); th.position.set(-0.6, 1.06, sd * 0.12); lean.add(th);
    const tm = new THREE.Mesh(G.box, mPants); tm.scale.set(0.46, 0.13, 0.13); tm.position.x = 0.23; th.add(tm);
    const sh = new THREE.Group(); lean.add(sh); const sm = new THREE.Mesh(G.box, mPants); sm.scale.set(0.46, 0.11, 0.11); sm.position.x = 0.23; sh.add(sm);
    const foot = new THREE.Mesh(G.box, mBlack); foot.scale.set(0.2, 0.07, 0.1); foot.position.x = 0.46; sh.add(foot);
    legs.push({ th, sh, sd });
  });
  const flagPole = bx(0.03, 1.2, 0.03, mMetal, -1.12, 1.25, 0.12);
  const flag = new THREE.Group(); flag.position.set(-1.12, 1.72, 0.12); lean.add(flag);
  const fm = new THREE.Mesh(G.box, mJacket); fm.scale.set(0.42, 0.26, 0.02); fm.position.x = -0.21; flag.add(fm);
  const pkg = new THREE.Group(); pkg.position.set(0.62, 0.92, 0); lean.add(pkg);
  const pb = new THREE.Mesh(G.box, mBrown); pb.scale.set(0.62, 0.46, 0.6); pb.position.y = 0.23; pkg.add(pb);
  const tape = new THREE.Mesh(G.box, L("#f4e1a0")); tape.scale.set(0.64, 0.08, 0.62); tape.position.y = 0.3; pkg.add(tape);
  const tape2 = new THREE.Mesh(G.box, L("#f4e1a0")); tape2.scale.set(0.1, 0.48, 0.62); tape2.position.y = 0.23; pkg.add(tape2);
  pkg.visible = false;
  scene.add(root);
  return { root, lean, rear, front: frontW, legs, flag, pkg, flagPole, torso };
}
function ikLeg(leg, fx, fy) {
  const hx = leg.th.position.x, hy = leg.th.position.y, a = 0.46, b = 0.46;
  let dx = fx - hx, dy = fy - hy, d = Math.hypot(dx, dy); d = clamp(d, 0.2, a + b - 0.01);
  const base = Math.atan2(dy, dx), al = Math.acos(clamp((a * a + d * d - b * b) / (2 * a * d), -1, 1));
  const ta = base + al; leg.th.rotation.z = ta;
  const kx = hx + Math.cos(ta) * a, ky = hy + Math.sin(ta) * a;
  leg.sh.position.set(kx, ky, leg.th.position.z); leg.sh.rotation.z = Math.atan2(fy - ky, fx - kx);
}
let arrow;
function makeArrow() {
  const g = new THREE.Group();
  const M = new Merger(); M.box(-0.35, -0.15, 0, 1.3, 0.3, 0.42, "#ffffff"); M.geo(G.cone4, 0.75, 0, 0, 0.62, 1.0, 0.16, "#ffffff", 0, 0, -Math.PI / 2);
  const geo = M.build();
  const mat = new THREE.MeshBasicMaterial({ color: "#f2a900" });
  const inner = new THREE.Mesh(geo, mat); g.add(inner);
  const out = new THREE.Mesh(geo, new THREE.MeshBasicMaterial({ color: "#16263a", side: THREE.BackSide })); out.scale.setScalar(1.15); g.add(out);
  g.scale.setScalar(0.62); g.visible = false; scene.add(g); return { g, mat };
}

/* ================================================================ Partikel, Schwebetexte, Ton */
const PMAX = 360; let pmesh; const parts = [];
function makeParticles() {
  pmesh = new THREE.InstancedMesh(G.box, new THREE.MeshLambertMaterial({ color: "#ffffff" }), PMAX);
  pmesh.instanceColor = new THREE.InstancedBufferAttribute(new Float32Array(PMAX * 3), 3);
  pmesh.count = 0; pmesh.frustumCulled = false; scene.add(pmesh);
}
function emit(x, y, z, n, cols, speed, up, life, size, grav = 18) {
  for (let i = 0; i < n; i++) {
    if (parts.length >= PMAX) parts.shift();
    const a = Math.random() * Math.PI * 2, s = speed * (0.4 + Math.random() * 0.8);
    parts.push({ x, y, z, vx: Math.cos(a) * s, vz: Math.sin(a) * s, vy: up * (0.5 + Math.random()), life, max: life, size: size * (0.6 + Math.random() * 0.8), rx: Math.random() * 6, ry: Math.random() * 6, c: new THREE.Color(cols[i % cols.length]), g: grav });
  }
}
function confetti(x, z) { emit(x, 2, z, 70, ["#2f8f6b", "#f2a900", "#0077a6", "#e74c3c", "#ffffff", "#9b59b6"], 7, 11, 1.8, 0.28); }
function poof(x, y, z) { emit(x, y, z, 18, ["#e8edf1", "#cfd8dc", "#ffffff"], 2.5, 2.5, 1.1, 1.1, -1.5); }
function sparks(x, y, z) { emit(x, y, z, 26, ["#f2c94c", "#ffffff", "#ff8a3d", "#9aa4ae"], 8, 7, 0.9, 0.22); }
function updateParticles(dt) {
  let n = 0;
  for (let i = parts.length - 1; i >= 0; i--) { const p = parts[i]; p.life -= dt; if (p.life <= 0) parts.splice(i, 1); }
  for (const p of parts) {
    p.vy -= p.g * dt; p.x += p.vx * dt; p.y += p.vy * dt; p.z += p.vz * dt; p.vx *= 0.97; p.vz *= 0.97; p.rx += dt * 6; p.ry += dt * 5;
    if (p.y < 0.1) { p.y = 0.1; p.vy *= -0.3; p.vx *= 0.7; p.vz *= 0.7; }
    const k = Math.min(1, p.life / p.max * 2) * p.size;
    _p.set(p.x, p.y, p.z); _q.setFromEuler(_e.set(p.rx, p.ry, 0)); _s.set(k, k, k); _m.compose(_p, _q, _s);
    pmesh.setMatrixAt(n, _m); pmesh.setColorAt(n, p.c); n++;
  }
  pmesh.count = n; if (n) { pmesh.instanceMatrix.needsUpdate = true; pmesh.instanceColor.needsUpdate = true; }
}
const floats = [];
function say(text, x, y, z, cls = "", sub = "") {
  if (floats.length > 6) { const o = floats.shift(); o.el.remove(); }
  const el = document.createElement("div"); el.className = "flt " + cls; el.textContent = text;
  if (sub) { const s = document.createElement("small"); s.textContent = sub; el.appendChild(s); }
  $("schwebe").appendChild(el); floats.push({ el, x, y, z, life: 1.6, t: 0 });
}
const proj = new THREE.Vector3();
function toScreen(x, y, z) {
  proj.set(x, y, z).project(camera);
  return { sx: (proj.x * 0.5 + 0.5) * vw, sy: (-proj.y * 0.5 + 0.5) * vh, front: proj.z < 1 };
}
function updateFloats(dt) {
  for (let i = floats.length - 1; i >= 0; i--) {
    const f = floats[i]; f.life -= dt; f.t += dt; f.y += dt * 1.6;
    if (f.life <= 0) { f.el.remove(); floats.splice(i, 1); continue; }
    const s = toScreen(f.x, f.y, f.z);
    if (!s.front) { f.el.style.opacity = 0; continue; }
    const sc = f.t < 0.15 ? 0.5 + f.t / 0.15 * 0.7 : f.t < 0.3 ? 1.2 - (f.t - 0.15) / 0.15 * 0.2 : 1;
    f.el.style.opacity = Math.min(1, f.life * 1.5);
    f.el.style.transform = `translate(${s.sx}px,${s.sy}px) translate(-50%,-50%) scale(${sc})`;
  }
}
let AC = null, ton = true;
try { ton = localStorage.getItem("pe26_spiel_ton") !== "0"; } catch (e) {}
function audio() {
  if (!ton) return null;
  if (!AC) { try { AC = new (window.AudioContext || window.webkitAudioContext)(); } catch (e) { return null; } }
  if (AC.state === "suspended") AC.resume(); return AC;
}
function tone(freq, dur, type = "sine", vol = 0.06, when = 0, slide = 0) {
  const a = audio(); if (!a) return;
  const t0 = a.currentTime + when, o = a.createOscillator(), g = a.createGain();
  o.type = type; o.frequency.setValueAtTime(freq, t0); if (slide) o.frequency.exponentialRampToValueAtTime(Math.max(30, freq + slide), t0 + dur);
  g.gain.setValueAtTime(0.0001, t0); g.gain.exponentialRampToValueAtTime(vol, t0 + 0.02); g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
  o.connect(g).connect(a.destination); o.start(t0); o.stop(t0 + dur + 0.05);
}
function noise(dur, vol) {
  const a = audio(); if (!a) return;
  const len = Math.floor(a.sampleRate * dur), buf = a.createBuffer(1, len, a.sampleRate), d = buf.getChannelData(0);
  for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, 2);
  const s = a.createBufferSource(), f = a.createBiquadFilter(), g = a.createGain(); s.buffer = buf; f.type = "lowpass"; f.frequency.value = 900; g.gain.value = vol;
  s.connect(f).connect(g).connect(a.destination); s.start();
}
const sfx = {
  hupe() { tone(392, 0.32, "square", 0.05); tone(494, 0.32, "square", 0.04); tone(392, 0.25, "square", 0.05, 0.36); tone(494, 0.25, "square", 0.04, 0.36); },
  crash(k = 1) { noise(0.4, 0.5 * k); tone(110, 0.3, "triangle", 0.12 * k, 0, -60); },
  bonk() { tone(160, 0.15, "triangle", 0.1, 0, -60); },
  ok() { [523, 659, 784, 1046].forEach((f, i) => tone(f, 0.18, "triangle", 0.07, i * 0.08)); },
  ko() { tone(240, 0.35, "sawtooth", 0.04, 0, -120); },
  ding() { tone(880, 0.2, "sine", 0.07); tone(1320, 0.25, "sine", 0.05, 0.08); }
};

/* ================================================================ Eingabe */
const keys = {};
let joy = { on: false, x: 0, y: 0, id: null }, touchTurbo = false, touchBrake = false;
function setupInput() {
  window.addEventListener("keydown", (e) => {
    const k = e.key.toLowerCase(); keys[k] = true; audio();
    if ((state === "play" || (state === "feedback" && k === " ")) && ["arrowup", "arrowdown", "arrowleft", "arrowright", " "].includes(k)) e.preventDefault();
    if ((k === "escape" || k === "p") && state === "play") pause();
    else if (k === "escape" && state === "pause") resume();
    if (k === "enter" && state === "feedback") { e.preventDefault(); weiter(); }
    if (k === "h" && state === "play" && !e.repeat) hupe();
    if (state === "play" && /^[1-4]$/.test(k) && mission !== "lernen") setNavi(+k - 1);
  });
  window.addEventListener("keyup", (e) => { keys[e.key.toLowerCase()] = false; if (e.key === " " && state === "feedback") e.preventDefault(); });
  window.addEventListener("blur", () => { for (const k in keys) keys[k] = false; });
  const joyEl = $("joy"), knauf = $("knauf");
  const jm = (e) => {
    const r = joyEl.getBoundingClientRect(), cx = r.left + r.width / 2, cy = r.top + r.height / 2;
    let dx = e.clientX - cx, dy = e.clientY - cy; const d = Math.hypot(dx, dy), max = r.width / 2;
    if (d > max) { dx = dx / d * max; dy = dy / d * max; }
    joy.x = dx / max; joy.y = dy / max; knauf.style.transform = `translate(${dx}px,${dy}px)`;
  };
  joyEl.addEventListener("pointerdown", (e) => { e.preventDefault(); audio(); joy.on = true; joy.id = e.pointerId; try { joyEl.setPointerCapture(e.pointerId); } catch (er) {} jm(e); });
  joyEl.addEventListener("pointermove", (e) => { if (joy.on && e.pointerId === joy.id) jm(e); });
  ["pointerup", "pointercancel", "lostpointercapture"].forEach((t) => joyEl.addEventListener(t, (e) => { if (e.pointerId !== joy.id) return; joy.on = false; joy.x = joy.y = 0; knauf.style.transform = ""; }));
  const hold = (id, on) => {
    const el = $(id);
    el.addEventListener("pointerdown", (e) => { e.preventDefault(); audio(); try { el.setPointerCapture(e.pointerId); } catch (er) {} el.classList.add("an"); on(true); });
    ["pointerup", "pointercancel", "lostpointercapture"].forEach((t) => el.addEventListener(t, () => { el.classList.remove("an"); on(false); }));
  };
  hold("tTurbo", (v) => { touchTurbo = v; }); hold("tBremse", (v) => { touchBrake = v; });
  $("tHupe").addEventListener("pointerdown", (e) => { e.preventDefault(); audio(); if (state === "play") hupe(); });
  document.addEventListener("visibilitychange", () => { if (document.hidden && state === "play") pause(); });
  document.addEventListener("pointerdown", () => audio(), { once: true });
}
function hupe() {
  sfx.hupe(); say(pick(HUPE), P.x, 3.2, P.z, "weiss");
  cars.forEach((c) => { if (c.stun <= 0 && Math.hypot(c.x - P.x, c.z - P.z) < 22) c.hop = 0.5; });
}

/* ================================================================ Spielerphysik */
const R_BIKE = 1.0;
let shake = 0, crashes = 0, lastBump = 0;
function updatePlayer(dt) {
  let thr = 0, brk = 0, steer = 0;
  if (keys["w"] || keys["arrowup"]) thr = 1;
  if (keys["s"] || keys["arrowdown"]) brk = 1;
  steer = ((keys["d"] || keys["arrowright"]) ? 1 : 0) - ((keys["a"] || keys["arrowleft"]) ? 1 : 0);
  if (joy.on) {
    const jx = Math.abs(joy.x) > 0.12 ? joy.x : 0, jy = Math.abs(joy.y) > 0.15 ? joy.y : 0;
    steer += clamp(jx * 1.25, -1, 1);
    if (jy < 0) thr = Math.max(thr, Math.min(1, -jy * 1.3)); else if (jy > 0) brk = Math.max(brk, jy);
  }
  if (touchTurbo && thr === 0) thr = 1;
  const hand = keys[" "] || touchBrake;
  const turbo = (keys["shift"] || touchTurbo) && P.boost > 0.03 && thr > 0;
  P.turbo = turbo;
  let maxV = turbo ? 27 : 18; if (!isRoad(P.x, P.z)) maxV *= 0.72;
  if (thr > 0) { if (P.v < 0) P.v += 24 * thr * dt; else if (P.v < maxV) P.v += (turbo ? 17 : 10.5) * thr * dt; }
  else if (brk > 0) { if (P.v > 0.4) P.v -= 24 * brk * dt; else P.v = Math.max(-7, P.v - 7 * brk * dt); }
  else P.v *= Math.pow(0.6, dt);
  if (hand) P.v *= Math.pow(0.008, dt);
  if (P.v > maxV) P.v += (maxV - P.v) * Math.min(1, 2.2 * dt);
  P.v = clamp(P.v, -7, 30);
  P.boost = clamp(P.boost + (turbo ? -dt / 3.2 : dt / 6.5), 0, 1);
  P.steer += (clamp(steer, -1, 1) - P.steer) * Math.min(1, 9 * dt);
  const sp = Math.abs(P.v), rate = 2.5 * clamp(sp / 4, 0, 1) * (1 - 0.32 * clamp(sp / 27, 0, 1));
  P.ang += P.steer * rate * dt * (P.v < 0 ? -1 : 1);
  let nx = P.x + Math.cos(P.ang) * P.v * dt, nz = P.z + Math.sin(P.ang) * P.v * dt;
  nx = clamp(nx, R_BIKE, W - R_BIKE); nz = clamp(nz, R_BIKE, D - R_BIKE);
  const now = performance.now() / 1000;
  for (const b of solids) {
    const qx = clamp(nx, b.x, b.x + b.w), qz = clamp(nz, b.z, b.z + b.d), dx = nx - qx, dz = nz - qz, d2 = dx * dx + dz * dz;
    if (d2 < R_BIKE * R_BIKE) {
      let d = Math.sqrt(d2);
      if (d < 1e-4) { const l = nx - b.x, r = b.x + b.w - nx, t = nz - b.z, bt = b.z + b.d - nz, mn = Math.min(l, r, t, bt); if (mn === l) nx = b.x - R_BIKE; else if (mn === r) nx = b.x + b.w + R_BIKE; else if (mn === t) nz = b.z - R_BIKE; else nz = b.z + b.d + R_BIKE; }
      else { nx = qx + dx / d * R_BIKE; nz = qz + dz / d * R_BIKE; }
      if (Math.abs(P.v) > 8 && now - lastBump > 0.6) { lastBump = now; shake = Math.max(shake, 0.25); sparks(nx, 0.8, nz); say(pick(WAND), nx, 2.6, nz); sfx.bonk(); }
      P.v *= -0.25;
    }
  }
  for (const t of poles) {
    const dx = nx - t.x, dz = nz - t.z, min = t.r + R_BIKE * 0.8;
    if (Math.abs(dx) > min || Math.abs(dz) > min) continue;
    const dd = Math.hypot(dx, dz);
    if (dd < min) { nx = t.x + dx / (dd || 1) * min; nz = t.z + dz / (dd || 1) * min; if (Math.abs(P.v) > 9 && now - lastBump > 0.6) { lastBump = now; say(pick(BAUM), nx, 2.6, nz); sfx.bonk(); shake = 0.2; } P.v *= 0.55; }
  }
  for (const p of ponds) {
    const ex = (nx - p.x) / (p.a + R_BIKE * 0.6), ez = (nz - p.z) / (p.b + R_BIKE * 0.6), q = ex * ex + ez * ez;
    if (q < 1) { const s = 1 / Math.sqrt(q || 1e-4); nx = p.x + (nx - p.x) * s; nz = p.z + (nz - p.z) * s; if (Math.abs(P.v) > 8 && now - lastBump > 0.8) { lastBump = now; say("Kein Schwimmkurs heute!", nx, 2.6, nz); } P.v *= 0.5; }
  }
  P.x = nx; P.z = nz;
  P.y += (groundY(P.x, P.z) - P.y) * Math.min(1, 14 * dt);
  // Autos rammen
  const fx = Math.cos(P.ang), fz = Math.sin(P.ang);
  for (const c of cars) {
    if (c.stun > 0 || c.cool > 0) continue;
    const ox = P.x - c.x, oz = P.z - c.z; if (Math.abs(ox) > 4 || Math.abs(oz) > 4) continue;
    const cf = Math.cos(c.yaw), cs = Math.sin(c.yaw), lx = ox * cf + oz * cs, lz = -ox * cs + oz * cf;
    if (Math.abs(lx) < 2.1 + 0.85 && Math.abs(lz) < 0.95 + 0.7) {
      const power = Math.max(7, Math.abs(P.v) + (c.cur || 0) * 0.5 + 4);
      launchCar(c, -ox + fx * Math.abs(P.v) * 0.3, -oz + fz * Math.abs(P.v) * 0.3, power);
      P.v *= 0.5; crashes++; shake = 0.45; sfx.crash();
      const mx = (c.x + P.x) / 2, mz = (c.z + P.z) / 2; sparks(mx, 1, mz);
      say(CRASH[crashes % CRASH.length], mx, 3.2, mz, "", c.name);
    }
  }
}

/* ================================================================ Kamera */
const camPos = new THREE.Vector3(), camLook = new THREE.Vector3(), tmpA = new THREE.Vector3(), tmpB = new THREE.Vector3();
let camInit = false, menuT = 0;
function camBlocked(x, y, z) {
  for (const s of solids) if (y < s.h && x > s.x - 0.4 && x < s.x + s.w + 0.4 && z > s.z - 0.4 && z < s.z + s.d + 0.4) return true;
  return false;
}
function updateCamera(dt) {
  if (state === "menu") {
    menuT += dt * 0.05;
    camera.position.set(W / 2 + Math.cos(menuT) * 190, 88, D / 2 + Math.sin(menuT) * 150);
    camera.lookAt(W / 2, 0, D / 2); camInit = false;
    if (camera.fov !== 55) { camera.fov = 55; camera.updateProjectionMatrix(); }
    return;
  }
  const fx = Math.cos(P.ang), fz = Math.sin(P.ang), back = 6.8 + Math.abs(P.v) * 0.05, up = 3.1 + Math.abs(P.v) * 0.02;
  tmpA.set(P.x, P.y + 1.6, P.z);
  tmpB.set(P.x - fx * back, P.y + up, P.z - fz * back);
  let t = 1;
  for (let k = 1; k <= 10; k++) { const q = k / 10; if (camBlocked(tmpA.x + (tmpB.x - tmpA.x) * q, tmpA.y + (tmpB.y - tmpA.y) * q, tmpA.z + (tmpB.z - tmpA.z) * q)) { t = Math.max(0.25, (k - 1) / 10); break; } }
  tmpB.lerpVectors(tmpA, tmpB, t); if (t < 1) tmpB.y += (1 - t) * 2.5;
  if (!camInit) { camPos.copy(tmpB); camLook.set(P.x + fx * 5, P.y + 1.3, P.z + fz * 5); camInit = true; }
  camPos.lerp(tmpB, 1 - Math.exp(-dt * 6));
  camLook.lerp(tmpA.set(P.x + fx * 5, P.y + 1.3, P.z + fz * 5), 1 - Math.exp(-dt * 10));
  camera.position.copy(camPos);
  if (shake > 0) camera.position.add(tmpA.set((Math.random() - 0.5) * shake, (Math.random() - 0.5) * shake, (Math.random() - 0.5) * shake));
  camera.lookAt(camLook);
  const fov = 62 + (P.turbo ? 9 : 0) + Math.abs(P.v) * 0.12;
  if (Math.abs(camera.fov - fov) > 0.05) { camera.fov += (fov - camera.fov) * Math.min(1, dt * 4); camera.updateProjectionMatrix(); }
}

/* ================================================================ Missionen */
const COLORS = ["#16a34a", "#2563eb", "#ea580c", "#9333ea"], LET = ["A", "B", "C", "D"];
const MISSIONEN = {
  lernen: { name: "Lern-Tour", ico: "📘", text: "Lernsäulen anfahren und das Kernwissen des Tages lesen" },
  kurier: { name: "Kurier-Mission", ico: "🚲", text: "Fragen zum Tag beantworten und zur richtigen Säule fahren" },
  logistik: { name: "Lastenrad-Logistik", ico: "📦", text: "Pakete mit Aussagen ins passende Depot bringen" }
};
let state = "laden", day = null, mission = null, markers = [], score = 0, round = 0, rounds = 0, tLeft = 0, tUsed = 0, right = 0, cur = null, lastMission = null, protokoll = [];
let store = {}; try { store = JSON.parse(localStorage.getItem("pe26_spiel") || "{}") || {}; } catch (e) { store = {}; }
function saveStars(key, n) { if (!store[key] || store[key] < n) store[key] = n; try { localStorage.setItem("pe26_spiel", JSON.stringify(store)); } catch (e) {} }
const hasLogistik = (d) => !!(d && d.sortier && d.sortier.length && d.sortier[0].items && d.sortier[0].items.length);
const REACH = 4.6;
const markerGeo = { pillar: new THREE.CylinderGeometry(1.5, 1.5, 40, 18, 1, true), core: new THREE.CylinderGeometry(0.4, 0.4, 40, 8, 1, true), ring: new THREE.RingGeometry(2.7, 3.7, 36), disc: new THREE.CircleGeometry(2.7, 36) };
const badgeCache = {};
function addMarker(m) {
  const g = new THREE.Group(), col = new THREE.Color(m.farbe);
  const mk = (geo, op, y) => { const o = new THREE.Mesh(geo, new THREE.MeshBasicMaterial({ color: col, transparent: true, opacity: op, depthWrite: false, side: THREE.DoubleSide, fog: false })); o.position.y = y; g.add(o); return o; };
  m.pillar = mk(markerGeo.pillar, 0.32, 20); m.core = mk(markerGeo.core, 0.7, 20);
  m.ring = mk(markerGeo.ring, 0.9, 0.08); m.ring.rotation.x = -Math.PI / 2; const disc = mk(markerGeo.disc, 0.25, 0.07); disc.rotation.x = -Math.PI / 2;
  const key = m.txt + m.farbe; if (!badgeCache[key]) badgeCache[key] = makeBadgeTex(m.txt, m.farbe);
  m.spr = new THREE.Sprite(new THREE.SpriteMaterial({ map: badgeCache[key], fog: false })); m.spr.scale.set(3, 3, 1); m.spr.position.y = 4.5; g.add(m.spr);
  g.position.set(m.x, groundY(m.x, m.z), m.z); scene.add(g); m.obj = g;
  m.armed = Math.hypot(m.x - P.x, m.z - P.z) > REACH + 2.5;
  const el = document.createElement("div"); el.className = "ziel";
  el.innerHTML = `<div class="sp"></div><div class="pf" style="background:${m.farbe}">${esc(m.txt)}</div><div class="di"></div>`;
  $("ziele").appendChild(el); m.el = el; m.sp = el.firstChild; m.di = el.lastChild;
  markers.push(m);
}
function clearMarkers() {
  markers.forEach((m) => { scene.remove(m.obj); m.obj.traverse((o) => { if (o.material && o.material !== m.spr.material) o.material.dispose(); }); m.spr.material.dispose(); m.el.remove(); });
  markers = [];
}
function farPlaces(n) {
  let cand = shuffle(places).filter((p) => Math.hypot(p.x - P.x, p.z - P.z) > 68);
  if (cand.length < n) cand = cand.concat(shuffle(places).filter((p) => cand.indexOf(p) < 0 && Math.hypot(p.x - P.x, p.z - P.z) > 20));
  return cand.slice(0, n);
}
function resetPlayer() { const d = places[0]; P.x = d.x - 6; P.z = d.z + 2.3; P.ang = 0; P.v = 0; P.boost = 1; P.y = 0.02; P.navi = -1; camInit = false; }

function startMission(m) {
  if (m === "logistik" && !hasLogistik(day)) m = "kurier";
  mission = m; score = 0; round = 0; right = 0; tUsed = 0; crashes = 0; protokoll = []; clearMarkers(); resetPlayer();
  floats.forEach((f) => f.el.remove()); floats.length = 0; parts.length = 0; lastBump = performance.now() / 1000;
  cars.forEach((c) => { if (Math.hypot(c.x - P.x, c.z - P.z) < 30) placeCar(c, true); });
  if (m === "lernen") {
    cur = { items: shuffle(day.lernen || []).slice(0, 8) }; rounds = cur.items.length;
    const pl = shuffle(places.slice(1)).slice(0, rounds);
    cur.items.forEach((it, i) => addMarker({ x: pl[i].x, z: pl[i].z, farbe: "#0077a6", txt: "i", item: it, ort: pl[i].name }));
  } else if (m === "kurier") {
    cur = { qs: shuffle(day.quiz).slice(0, 8) }; rounds = cur.qs.length;
  } else {
    const a = shuffle(day.sortier[0].items).slice(0, 6).map((x) => ({ it: x, set: 0 }));
    const b = day.sortier[1] && day.sortier[1].items ? shuffle(day.sortier[1].items).slice(0, 6).map((x) => ({ it: x, set: 1 })) : [];
    cur = { pk: a.concat(b) }; rounds = cur.pk.length;
  }
  bike.pkg.visible = m === "logistik";
  $("hMission").textContent = MISSIONEN[m].name + " · Tag " + day.nr;
  ["eMenue", "eErgebnis", "ePause", "eFeedback", "eHilfe"].forEach(hide); show("hud");
  $("auftrag").classList.remove("zu"); state = "play";
  const tp = $("tipp"); tp.textContent = "W A S D oder Pfeiltasten fahren · Umschalt Turbo · Leertaste bremst · H hupt"; tp.classList.remove("weg");
  clearTimeout(tipT); tipT = setTimeout(() => tp.classList.add("weg"), 8000);
  nextRound(true);
}
let tipT = null, klappT = null;
function nextRound(first) {
  if (!first) round++;
  P.navi = -1;
  if (mission === "lernen") {
    const rest = markers.length;
    $("hRunde").textContent = "Gesammelt " + (rounds - rest) + " von " + rounds;
    $("aFrage").textContent = rest ? "Fahren Sie die blauen Lernsäulen (i) an. Jede Säule zeigt einen Kernbegriff oder Merksatz des Tages." : "";
    $("aListe").innerHTML = ""; $("aTipp").textContent = rest ? "Der gelbe Pfeil über dem Rad zeigt zur nächsten Säule." : "";
    if (!rest) return finish();
    tLeft = Infinity; autoKlapp(); return;
  }
  if (round >= rounds) return finish();
  $("hRunde").textContent = "Runde " + (round + 1) + " von " + rounds;
  clearMarkers();
  let html = "";
  if (mission === "kurier") {
    const q = cur.qs[round], order = shuffle([0, 1, 2, 3]), pl = farPlaces(4);
    cur.q = q; cur.order = order;
    $("aFrage").textContent = q.q;
    order.forEach((oi, k) => {
      addMarker({ x: pl[k].x, z: pl[k].z, farbe: COLORS[k], txt: LET[k], pick: oi, ort: pl[k].name });
      html += `<li data-k="${k}"><span class="bad" style="background:${COLORS[k]}">${LET[k]}</span><span>${esc(q.o[oi])} <small>(${esc(pl[k].name)})</small></span></li>`;
    });
    tLeft = 60;
  } else {
    const p = cur.pk[round], set = day.sortier[p.set];
    cur.p = p; cur.set = set;
    $("aFrage").textContent = "Paket „" + p.it.text + "“ Wohin gehört es?";
    set.kategorien.slice(0, depotPlaces.length).forEach((k, i) => {
      const d = depotPlaces[i]; setDepotSign(d, "Depot " + k.name, { txt: LET[i], farbe: COLORS[i] });
      addMarker({ x: d.x, z: d.z, farbe: COLORS[i], txt: LET[i], kat: k.id, ort: k.name });
      html += `<li data-k="${i}"><span class="bad" style="background:${COLORS[i]}">${LET[i]}</span><span>Depot <b>${esc(k.name)}</b></span></li>`;
    });
    depotPlaces.forEach((d, i) => { if (i >= set.kategorien.length) setDepotSign(d, "Depot", null); });
    tLeft = 45;
    if (p.set === 1 && cur.pk[round - 1] && cur.pk[round - 1].set === 0) { say("Neue Depots!", P.x, 3.5, P.z, "gruen", set.titel || ""); sfx.ding(); }
  }
  $("aListe").innerHTML = html;
  $("aTipp").textContent = IS_TOUCH ? "Tippen Sie auf eine Antwort, dann zeigt der Pfeil den Weg." : "Klicken Sie auf eine Antwort oder drücken Sie 1 bis 4, dann zeigt der Pfeil den Weg.";
  $("aListe").querySelectorAll("li").forEach((li) => li.addEventListener("click", () => setNavi(+li.dataset.k)));
  autoKlapp();
}
function setNavi(k) {
  if (k < 0 || k >= markers.length) return;
  P.navi = P.navi === k ? -1 : k;
  $("aListe").querySelectorAll("li").forEach((li) => li.classList.toggle("navi", +li.dataset.k === P.navi));
}
function autoKlapp() {
  const a = $("auftrag"); a.classList.remove("zu"); clearTimeout(klappT);
  if (window.innerWidth < 700) klappT = setTimeout(() => { if (state === "play") a.classList.add("zu"); }, 9000);
}
function isCorrect(m) { return mission === "kurier" ? m.pick === cur.q.c : mission === "logistik" ? m.kat === cur.p.it.kat : true; }
function kurierLoes() { const k = cur.order.indexOf(cur.q.c); return "Richtig ist " + LET[k] + ") " + cur.q.o[cur.q.c]; }
function logiKat() { return (cur.set.kategorien.find((x) => x.id === cur.p.it.kat) || { name: "?" }).name; }
function reach(mk) {
  if (mission === "lernen") {
    const i = markers.indexOf(mk); scene.remove(mk.obj); mk.el.remove(); markers.splice(i, 1);
    score += 50; confetti(mk.x, mk.z); sfx.ding();
    protokoll.push({ html: `<b>${esc(mk.item.t)}</b><span class="x">${esc(mk.item.x)}</span>` });
    feedback("Lernsäule " + (rounds - markers.length) + " von " + rounds, "info", mk.item.t, mk.item.x, "", "Gefunden am Ort " + mk.ort);
    return;
  }
  const ok = isCorrect(mk); let loes, erkl, wahl = "";
  if (mission === "kurier") {
    loes = kurierLoes(); erkl = cur.q.e;
    if (!ok) wahl = "Ihre Wahl " + mk.txt + ") " + cur.q.o[mk.pick];
    protokoll.push({ html: `<b>${esc(cur.q.q)}</b> <span class="${ok ? "r" : "f"}">${ok ? "✓ richtig" : "✗ " + esc(wahl)}</span><br>${esc(loes)}<span class="x">${esc(erkl)}</span>` });
  } else {
    loes = "Das Paket gehört ins Depot „" + logiKat() + "“."; erkl = cur.p.it.expl;
    if (!ok) wahl = "Sie haben das Depot „" + mk.ort + "“ angefahren.";
    protokoll.push({ html: `<b>Paket „${esc(cur.p.it.text)}“</b> <span class="${ok ? "r" : "f"}">${ok ? "✓ richtig" : "✗ falsch"}</span><br>${esc(loes)}<span class="x">${esc(erkl || "")}</span>` });
  }
  if (ok) { right++; const bonus = Math.round(Math.max(0, tLeft) * 2); score += 100 + bonus; confetti(mk.x, mk.z); sfx.ok(); say("+" + (100 + bonus), mk.x, 5, mk.z, "gruen"); }
  else sfx.ko();
  feedback(ok ? "Richtig!" : "Leider falsch", ok ? "ok" : "ko", loes, erkl, ok ? pick(LOB) : pick(TADEL), wahl);
}
function timeout() {
  let loes, erkl;
  if (mission === "kurier") { loes = kurierLoes(); erkl = cur.q.e; protokoll.push({ html: `<b>${esc(cur.q.q)}</b> <span class="f">✗ Zeit abgelaufen</span><br>${esc(loes)}<span class="x">${esc(erkl)}</span>` }); }
  else { loes = "Das Paket gehört ins Depot „" + logiKat() + "“."; erkl = cur.p.it.expl; protokoll.push({ html: `<b>Paket „${esc(cur.p.it.text)}“</b> <span class="f">✗ Zeit abgelaufen</span><br>${esc(loes)}<span class="x">${esc(erkl || "")}</span>` }); }
  sfx.ko(); feedback("Zeit abgelaufen", "ko", loes, erkl, pick(LANGSAM), "");
}
function feedback(titel, art, loes, erkl, witz, wahl) {
  state = "feedback"; const u = $("fUrteil"); u.textContent = titel; u.className = "urteil " + (art === "info" ? "" : art);
  $("fWahl").textContent = wahl || "";
  $("fLoesung").textContent = loes; $("fErkl").textContent = erkl || ""; $("fErkl").parentNode.style.display = erkl ? "" : "none";
  $("fErkl").parentNode.querySelector("b").textContent = art === "info" ? "Zum Merken" : "Erklärung";
  $("fWitz").textContent = witz || ""; $("fWitz").style.display = witz ? "" : "none";
  fbT = performance.now(); show("eFeedback"); setTimeout(() => $("btnWeiter").focus(), 30);
  P.v = 0; for (const k in keys) keys[k] = false;
}
let fbT = 0;
function weiter() { if (state !== "feedback" || performance.now() - fbT < 350) return; hide("eFeedback"); state = "play"; nextRound(false); }
function finish() {
  state = "result"; hide("hud"); clearMarkers(); bike.pkg.visible = false;
  const key = day.nr + "-" + mission; let stars;
  if (mission === "lernen") {
    stars = 3; $("rTitel").textContent = "Lern-Tour geschafft";
    $("rText").textContent = "Sie haben alle " + rounds + " Lernsäulen in " + Math.round(tUsed) + " Sekunden gesammelt. Jetzt passt die Kurier-Mission.";
  } else {
    const q = rounds ? right / rounds : 0; stars = q >= 0.85 ? 3 : q >= 0.6 ? 2 : q >= 0.35 ? 1 : 0;
    $("rTitel").textContent = stars ? "Mission geschafft" : "Fast geschafft";
    $("rText").textContent = right + " von " + rounds + " richtig, " + score + " Punkte" + (crashes ? ", " + crashes + (crashes === 1 ? " Zusammenstoß" : " Zusammenstöße") : "") + ".";
  }
  $("rSterne").textContent = "★★★".slice(0, stars) + "☆☆☆".slice(0, 3 - stars);
  $("rZus").innerHTML = protokoll.map((p) => `<div class="e">${p.html}</div>`).join("") || "<div class='e'>Keine Einträge.</div>";
  $("rZus").scrollTop = 0;
  saveStars(key, stars); lastMission = mission; show("eErgebnis");
  if (stars) { sfx.ok(); confetti(P.x, P.z); }
}
function pause() { if (state !== "play") return; state = "pause"; $("btnTon").textContent = ton ? "Ton aus" : "Ton an"; show("ePause"); }
function resume() { hide("ePause"); hide("eHilfe"); state = "play"; }
function zumMenue() { ["ePause", "eErgebnis", "eFeedback", "eHilfe"].forEach(hide); hide("hud"); clearMarkers(); bike.pkg.visible = false; state = "menu"; renderMissions(); show("eMenue"); }
function show(id) { $(id).classList.remove("versteckt", "aus"); }
function hide(id) { $(id).classList.add(id === "hud" ? "aus" : "versteckt"); }

/* ================================================================ Menü */
function buildMenu() {
  const sel = $("selTag"); sel.innerHTML = "";
  S.days.forEach((d) => { const o = document.createElement("option"); o.value = d.nr; o.textContent = "Tag " + d.nr + ", " + d.title + " (" + d.date + ")"; sel.appendChild(o); });
  sel.value = String(startTag()); sel.onchange = renderMissions; renderMissions();
}
function setDay() {
  const n = parseInt($("selTag").value, 10); day = S.days.find((d) => d.nr === n) || S.days[0];
  ["lnkZurueck", "lnkPauseLern", "lnkErgLern"].forEach((id) => { $(id).href = "../../index.html#/tag/" + day.nr; });
  $("lnk2d").href = "../stadt2d/index.html?tag=" + day.nr;
}
function renderMissions() {
  setDay();
  const box = $("missionen"); box.innerHTML = "";
  ["lernen", "kurier", "logistik"].forEach((m) => {
    if (m === "logistik" && !hasLogistik(day)) return;
    if (m === "lernen" && !(day.lernen && day.lernen.length)) return;
    const st = store[day.nr + "-" + m] || 0, mm = MISSIONEN[m];
    const b = document.createElement("button"); b.className = "mission"; b.type = "button"; b.dataset.m = m;
    b.innerHTML = `<span class="ico">${mm.ico}</span><span><b>${mm.name}</b><small>${mm.text}</small></span><span class="st" aria-label="${st} von 3 Sternen">${"★★★".slice(0, st)}${"☆☆☆".slice(0, 3 - st)}</span>`;
    b.onclick = () => { audio(); startMission(m); }; box.appendChild(b);
  });
}
function setupButtons() {
  $("btnWeiter").onclick = weiter;
  $("btnMenue").onclick = pause;
  $("btnFortsetzen").onclick = resume;
  $("btnNeustart").onclick = () => { hide("ePause"); startMission(mission); };
  $("btnAbbrechen").onclick = zumMenue;
  $("btnNochmal").onclick = () => startMission(lastMission);
  $("btnZumMenue").onclick = zumMenue;
  $("btnKlapp").onclick = () => { $("auftrag").classList.toggle("zu"); clearTimeout(klappT); };
  $("aFrage").onclick = () => { if ($("auftrag").classList.contains("zu")) { $("auftrag").classList.remove("zu"); clearTimeout(klappT); } };
  let hilfeZurueck = "eMenue";
  $("btnHilfe").onclick = () => { hilfeZurueck = "eMenue"; hide("eMenue"); show("eHilfe"); };
  $("btnPauseHilfe").onclick = () => { hilfeZurueck = "ePause"; hide("ePause"); show("eHilfe"); };
  $("btnHilfeZu").onclick = () => { hide("eHilfe"); show(hilfeZurueck); };
  $("btnTon").onclick = () => { ton = !ton; try { localStorage.setItem("pe26_spiel_ton", ton ? "1" : "0"); } catch (e) {} $("btnTon").textContent = ton ? "Ton aus" : "Ton an"; if (ton) sfx.ding(); };
}

/* ================================================================ HUD pro Frame */
let vw = innerWidth, vh = innerHeight, miniCtx, miniSize = 0;
function hudFrame() {
  if (tLeft !== Infinity) { const z = $("hZeit"); z.textContent = Math.max(0, Math.ceil(tLeft)); z.classList.toggle("knapp", tLeft < 10); }
  else { $("hZeit").textContent = Math.floor(tUsed) + " s"; $("hZeit").classList.remove("knapp"); }
  $("hPunkte").textContent = score;
  $("hKmh").textContent = Math.round(Math.abs(P.v) * 1.6);
  $("hTurbo").style.transform = `scaleX(${P.boost.toFixed(3)})`;
}
function naviTarget() {
  if (!markers.length) return null;
  if (P.navi >= 0 && markers[P.navi]) return markers[P.navi];
  let best = null, bd = 1e9; markers.forEach((m) => { const d = Math.hypot(m.x - P.x, m.z - P.z); if (d < bd) { bd = d; best = m; } }); return best;
}
function updateIndicators() {
  const nt = naviTarget();
  markers.forEach((m, k) => {
    const dist = Math.hypot(m.x - P.x, m.z - P.z);
    proj.set(m.x, 6.5, m.z).applyMatrix4(camera.matrixWorldInverse);
    const behind = proj.z > -0.5;
    proj.applyMatrix4(camera.projectionMatrix);
    let nxp = proj.x, nyp = proj.y; if (behind) { nxp = -nxp; nyp = -nyp; }
    const onScreen = !behind && Math.abs(nxp) < 0.9 && Math.abs(nyp) < 0.82;
    let sx, sy, rot = 0;
    if (onScreen) { sx = (nxp * 0.5 + 0.5) * vw; sy = (-nyp * 0.5 + 0.5) * vh; }
    else {
      let ax = nxp, ay = -nyp; if (behind && Math.abs(ax) < 0.2 && Math.abs(ay) < 0.2) ay = 1;
      const a = Math.atan2(ay, ax), mx = vw / 2 - 34, my = vh / 2 - 34, c = Math.cos(a), s = Math.sin(a);
      const t = Math.min(Math.abs(mx / (c || 1e-6)), Math.abs(my / (s || 1e-6)));
      sx = vw / 2 + c * t; sy = clamp(vh / 2 + s * t, 150, vh - 120); rot = a;
    }
    m.el.classList.toggle("rand", !onScreen); m.el.classList.toggle("navi", m === nt);
    m.el.style.transform = `translate(${sx.toFixed(1)}px,${sy.toFixed(1)}px)`;
    m.sp.style.transform = `rotate(${rot}rad)`; m.sp.style.transformOrigin = "-12px 13px";
    m.di.textContent = Math.round(dist) + " m";
  });
}
function drawMini() {
  const el = $("mini"), css = el.clientWidth;
  if (!css) return;
  const dpr = Math.min(devicePixelRatio || 1, 2), px = Math.round(css * dpr);
  if (miniSize !== px) { el.width = el.height = px; miniSize = px; miniCtx = el.getContext("2d"); }
  const g = miniCtx, r = px / 2, range = 75, sc = r / range;
  g.setTransform(1, 0, 0, 1, 0, 0); g.clearRect(0, 0, px, px);
  g.save(); g.beginPath(); g.arc(r, r, r - 2, 0, 7); g.clip();
  g.fillStyle = "#7fb069"; g.fillRect(0, 0, px, px);
  g.translate(r, r); g.rotate(-P.ang - Math.PI / 2); g.scale(sc, sc); g.translate(-P.x, -P.z);
  g.drawImage(miniStatic, 0, 0, W, D);
  g.setTransform(1, 0, 0, 1, 0, 0);
  const ca = Math.cos(-P.ang - Math.PI / 2), sa = Math.sin(-P.ang - Math.PI / 2);
  markers.forEach((m) => {
    let dx = (m.x - P.x) * sc, dz = (m.z - P.z) * sc; let x = dx * ca - dz * sa, y = dx * sa + dz * ca;
    const d = Math.hypot(x, y), lim = r - 9; if (d > lim) { x = x / d * lim; y = y / d * lim; }
    g.fillStyle = m.farbe; g.strokeStyle = "#fff"; g.lineWidth = 2 * dpr; g.beginPath(); g.arc(r + x, r + y, 6 * dpr, 0, 7); g.fill(); g.stroke();
    g.fillStyle = "#fff"; g.font = `700 ${8 * dpr}px Inter, sans-serif`; g.textAlign = "center"; g.textBaseline = "middle"; g.fillText(m.txt, r + x, r + y + 0.5);
  });
  g.restore();
  g.fillStyle = "#f2a900"; g.strokeStyle = "#16263a"; g.lineWidth = 2 * dpr;
  g.beginPath(); g.moveTo(r, r - 9 * dpr); g.lineTo(r + 6 * dpr, r + 6 * dpr); g.lineTo(r, r + 3 * dpr); g.lineTo(r - 6 * dpr, r + 6 * dpr); g.closePath(); g.fill(); g.stroke();
  g.strokeStyle = "rgba(255,255,255,.95)"; g.lineWidth = 4 * dpr; g.beginPath(); g.arc(r, r, r - 2 * dpr, 0, 7); g.stroke();
  g.fillStyle = "#16263a"; g.font = `700 ${10 * dpr}px Inter, sans-serif`; g.textAlign = "center"; g.textBaseline = "middle";
  const nAng = -P.ang - Math.PI / 2 - Math.PI / 2; g.fillText("N", r + Math.cos(nAng) * (r - 12 * dpr), r + Math.sin(nAng) * (r - 12 * dpr));
}

/* ================================================================ Radio */
let radioI = Math.floor(Math.random() * RADIO.length);
function setupTicker() {
  const sp = $("tickerTxt");
  const next = () => { radioI = (radioI + 1) % RADIO.length; sp.textContent = RADIO[radioI]; sp.style.animationDuration = (10 + RADIO[radioI].length * 0.13).toFixed(1) + "s"; };
  sp.addEventListener("animationiteration", next); radioI--; next();
}

/* ================================================================ Schleife */
let last = performance.now(), fps = 60, frames = 0, fpsT = 0, frameMs = 16;
function loop(now) {
  const raw = (now - last) / 1000, dt = Math.min(0.05, raw); last = now;
  frames++; fpsT += raw; if (fpsT >= 1) { fps = frames / fpsT; frames = 0; fpsT = 0; }
  const t0 = performance.now();
  const frozen = state === "pause";
  if (!frozen) for (const c of cars) updateCar(c, dt);
  if (state === "play") {
    updatePlayer(dt); tUsed += dt;
    if (tLeft !== Infinity) { tLeft -= dt; if (tLeft <= 0) { tLeft = 0; timeout(); } }
    for (let i = 0; i < markers.length && state === "play"; i++) {
      const m = markers[i], d = Math.hypot(m.x - P.x, m.z - P.z);
      if (!m.armed) { if (d > REACH + 2.5) m.armed = true; continue; }
      if (d < REACH) reach(m);
    }
  } else if (state === "feedback" || state === "result") { P.v *= Math.pow(0.05, dt); }
  if (!frozen) { updateParticles(dt); shake = Math.max(0, shake - dt * 1.4); }
  // Rad und Fahrerin
  bike.root.position.set(P.x, P.y, P.z); bike.root.rotation.y = -P.ang;
  const sp = Math.abs(P.v); P.lean += ((state === "play" ? P.steer * clamp(sp / 10, 0, 1) * 0.26 : 0) - P.lean) * Math.min(1, dt * 8);
  bike.lean.rotation.x = P.lean;
  P.wheel -= P.v * dt / 0.37; bike.rear.rotation.z = P.wheel; bike.front.rotation.z = P.wheel * 0.37 / 0.27;
  if (!frozen) P.crank -= Math.min(P.v, 14) * dt * 1.1;
  bike.legs.forEach((l, i) => { const a = P.crank + i * Math.PI; ikLeg(l, -0.47 + Math.cos(a) * 0.17, 0.4 + Math.sin(a) * 0.17); });
  bike.flag.rotation.y = Math.sin(now / 140) * 0.35 * (0.3 + clamp(sp / 18, 0, 1));
  if (bike.pkg.visible) bike.pkg.position.y = 0.92 + Math.abs(Math.sin(now / 160)) * 0.04 * clamp(sp / 10, 0, 1);
  // Autos darstellen und Schatten
  cars.forEach((c, i) => { c.mesh.position.set(c.x, c.y + groundY(c.x, c.z) - 0.02, c.z); c.mesh.rotation.set(c.rx, -c.yaw, c.rz); setShadow(i, c.x, c.z, groundY(c.x, c.z), 4.8, 2.4, c.yaw, clamp(1 - c.y / 10, 0.3, 1)); });
  setShadow(cars.length, P.x + Math.cos(P.ang) * 0.2, P.z + Math.sin(P.ang) * 0.2, P.y, 3.2, 1.3, P.ang, 1);
  shadows.instanceMatrix.needsUpdate = true;
  // Marker animieren
  const pulse = 1 + Math.sin(now / 180) * 0.1;
  markers.forEach((m) => { m.ring.scale.set(pulse, pulse, 1); m.spr.position.y = 4.5 + Math.sin(now / 300 + m.x) * 0.4; m.pillar.material.opacity = 0.28 + Math.sin(now / 250) * 0.07; });
  // Navi-Pfeil
  const nt = state === "play" ? naviTarget() : null;
  arrow.g.visible = !!nt;
  if (nt) {
    const a = Math.atan2(nt.z - P.z, nt.x - P.x);
    arrow.g.position.set(P.x + Math.cos(P.ang) * 0.9, P.y + 2.55 + Math.sin(now / 260) * 0.1, P.z + Math.sin(P.ang) * 0.9);
    arrow.g.rotation.y = -a; arrow.mat.color.set(nt.farbe);
  }
  clouds.position.x = ((now / 1000) * 1.5) % 300;
  updateCamera(dt);
  sky.position.copy(camera.position);
  renderer.render(scene, camera);
  if (state === "play" || state === "feedback") { updateIndicators(); hudFrame(); drawMini(); }
  updateFloats(dt);
  frameMs = frameMs * 0.9 + (performance.now() - t0) * 0.1;
  requestAnimationFrame(loop);
}

/* ================================================================ Start */
let sky;
function resize() {
  vw = innerWidth; vh = innerHeight;
  renderer.setSize(vw, vh, true); camera.aspect = vw / vh; camera.updateProjectionMatrix();
}
async function main() {
  if (!hasWebGL()) { keinGL(); return; }
  try {
    await Promise.race([Promise.all(["700 40px Inter", "600 20px Inter", "700 40px Kalam"].map((f) => document.fonts.load(f))), new Promise((r) => setTimeout(r, 2500))]);
  } catch (e) {}
  try {
    renderer = new THREE.WebGLRenderer({ antialias: !IS_TOUCH, powerPreference: "high-performance" });
  } catch (e) { keinGL(); return; }
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  maxAniso = Math.min(8, renderer.capabilities.getMaxAnisotropy());
  $("welt").appendChild(renderer.domElement);
  scene = new THREE.Scene();
  const horizon = new THREE.Color("#cde7f5");
  scene.background = horizon; scene.fog = new THREE.Fog(horizon, 110, 470);
  camera = new THREE.PerspectiveCamera(62, innerWidth / innerHeight, 0.3, 1300);
  scene.add(new THREE.HemisphereLight("#dff0ff", "#6f8f5a", 1.9));
  const sun = new THREE.DirectionalLight("#fff3dc", 2.3); sun.position.set(0.55, 1, 0.35); scene.add(sun);
  sky = new THREE.Mesh(new THREE.SphereGeometry(1000, 24, 12), new THREE.ShaderMaterial({
    side: THREE.BackSide, depthWrite: false, fog: false,
    uniforms: { top: { value: new THREE.Color("#3f8fd8") }, mid: { value: horizon.clone() }, sunDir: { value: new THREE.Vector3(0.55, 0.55, 0.35).normalize() } },
    vertexShader: "varying vec3 vP; void main(){ vP = normalize(position); gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }",
    fragmentShader: "uniform vec3 top; uniform vec3 mid; uniform vec3 sunDir; varying vec3 vP; void main(){ float h = clamp(vP.y, 0.0, 1.0); vec3 c = mix(mid, top, pow(h, 0.55)); float s = max(dot(normalize(vP), sunDir), 0.0); c += vec3(1.0, 0.92, 0.7) * (pow(s, 600.0) * 2.0 + pow(s, 12.0) * 0.18); gl_FragColor = vec4(c, 1.0);\n#include <colorspace_fragment>\n}"
  }));
  sky.renderOrder = -10; scene.add(sky);
  buildWorld(); paintMini();
  makeShadows(64); makeParticles();
  bike = makeBike(); arrow = makeArrow();
  resetPlayer();
  spawnCars(IS_TOUCH ? 12 : 16); shadows.count = cars.length + 1;
  setupInput(); setupButtons(); setupTicker(); buildMenu();
  window.addEventListener("resize", resize); resize();
  hide("eLaden");
  const m = QS.get("m");
  if (m && MISSIONEN[m] && QS.get("start") === "1") startMission(m); else { state = "menu"; show("eMenue"); }
  requestAnimationFrame((t) => { last = t; loop(t); });
}

/* Test-Schnittstelle für automatische Prüfungen */
window.__test = {
  state: () => state,
  info: () => ({
    state, mission, tag: day && day.nr, round, rounds, score, right, crashes, tLeft, fps: Math.round(fps), frameMs: +frameMs.toFixed(2),
    calls: renderer ? renderer.info.render.calls : 0, tris: renderer ? renderer.info.render.triangles : 0,
    markers: markers.map((m) => ({ x: m.x, z: m.z, txt: m.txt, ok: state === "play" || state === "feedback" ? isCorrect(m) : null })),
    player: { x: P.x, z: P.z, v: P.v, ang: P.ang }, cars: cars.filter((c) => c.stun > 0).length, protokoll: protokoll.length
  }),
  start: (m, tag) => { if (tag) { $("selTag").value = String(tag); renderMissions(); } startMission(m); },
  goto: (i) => { const m = markers[i]; if (!m) return false; P.x = m.x; P.z = m.z; P.v = 0; m.armed = true; camInit = false; return true; },
  gotoCorrect: () => { const i = markers.findIndex((m) => isCorrect(m)); return window.__test.goto(i); },
  gotoWrong: () => { const i = markers.findIndex((m) => !isCorrect(m)); return window.__test.goto(i < 0 ? 0 : i); },
  weiter: () => weiter(),
  teleport: (x, z, ang) => { P.x = x; P.z = z; if (ang != null) P.ang = ang; P.v = 0; camInit = false; },
  carAhead: (d = 9) => { const c = cars[0]; c.stun = 0; c.x = P.x + Math.cos(P.ang) * d; c.z = P.z + Math.sin(P.ang) * d; c.yaw = P.ang + Math.PI / 2; c.cur = 0; c.cool = 0; return true; },
  setTime: (t) => { tLeft = t; }
};
main();
