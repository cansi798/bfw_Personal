/* Nordstern Racing · 3D-Rennspiel zum Kurs Personalwesen · © 2026 Waybuild Akademie, Waybuild UG (haftungsbeschränkt) */
import * as THREE from "../lib/three.module.js";

const $ = (id) => document.getElementById(id);
const SP = window.SPIEL || { days: [] };
const HU = window.HUMOR || {};
const MISSION = "rennen";
const RUNDEN = 3, ANZ_FRAGEN = 10;
const HALB = 8, RAND = 9.2, RAND_AUTO = RAND - 1.1;
const SPUR_D = [-6, -2, 2, 6];
const FARBEN = ["#e5484d", "#2f7fe0", "#26a65b", "#e0a800"];
const BU = ["A", "B", "C", "D"];
const DT = 1 / 120;
const V_MAX = 54, V_NITRO = 70;
const SLOTS = [190, 790, 1460, 2010];
const TUNNEL = [1200, 1400];
const UP = new THREE.Vector3(0, 1, 0);

const istTouch = ("ontouchstart" in window || navigator.maxTouchPoints > 0) && matchMedia("(pointer: coarse)").matches;
if (istTouch) document.body.classList.add("touch");

/* ---------- Hilfen ---------- */
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const lerp = (a, b, t) => a + (b - a) * t;
const mod = (a, n) => ((a % n) + n) % n;
const wrapA = (a) => { while (a > Math.PI) a -= 2 * Math.PI; while (a < -Math.PI) a += 2 * Math.PI; return a; };
const pick = (a) => a[Math.floor(Math.random() * a.length)];
function shuffle(a) { for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; }
function mulberry(seed) { return function () { seed |= 0; seed = (seed + 0x6D2B79F5) | 0; let t = Math.imul(seed ^ (seed >>> 15), 1 | seed); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
const R = mulberry(20261124);
const rr = (a, b) => a + R() * (b - a);
function fmtZeit(t) {
  if (!isFinite(t)) return "keine";
  const m = Math.floor(t / 60); const s = t - m * 60;
  const ss = s.toFixed(1).replace(".", ",");
  return m > 0 ? `${m} min ${ss} s` : `${ss} s`;
}

/* ---------- Texte ---------- */
const RADIO = [...(HU.RADIO || []),
  "Radio Nordstern · Rennleitung meldet, Frage-Tore sind kein Hygienefaktor, sondern ein Motivator",
  "Radio Nordstern · Stau im Harksheide-Tunnel, jemand liest dort noch die Erklärung",
  "Radio Nordstern · Die Nordstern Fahrradwerke bauen jetzt ein Lastenrad mit Nitro, der Betriebsrat prüft noch",
  "Radio Nordstern · Blitzer an der Tarpenbek misst heute nur gute Laune",
  "Radio Nordstern · Personalcontrolling meldet, Driften erhöht die Kennzahl Spaß pro Kurve"];
const LOB = HU.LOB && HU.LOB.length ? HU.LOB : ["Sehr gut!"];
const TADEL = HU.TADEL && HU.TADEL.length ? HU.TADEL : ["Beim nächsten Mal klappt es."];
const CRASH = HU.CRASH && HU.CRASH.length ? HU.CRASH : ["Rumms!"];
const SPRUECHE = ["Ich habe Vorfahrt laut Organigramm!", "Überholen nur mit Zustimmung des Betriebsrats!", "Das kommt in Ihre Personalakte!",
  "Ich fahre nach Tarif, nicht nach Gefühl!", "Kurven stehen nicht in meinem Stellenplan!", "Gleich ist Kernzeit, Platz da!",
  "Mein Zeitkonto ist voll, ich muss schnell nach Hause!", "Ich bin nur wegen der Kekse hier!", "Wer bremst, verliert. Steht so im Leitbild!",
  "Das ist keine Raserei, das ist Personalentwicklung!"];
const RAMM = ["Hey! Das war mein Seitenspiegel!", "Das klären wir im Mitarbeitergespräch!", "Dafür gibt es eine Abmahnung!",
  "Formular für Blechschäden, bitte in dreifacher Ausfertigung!", "Rammen steht nicht in der Stellenbeschreibung!",
  "Das war jetzt kein wertschätzendes Feedback!", "Ich melde das der Fachkraft für Arbeitssicherheit!"];
const UEBERHOLT = ["Na gut, Sie dürfen vorbei. Für Ihre Zielvereinbarung.", "Das war Leistung nach Leistungslohn!",
  "Überholt? Das muss ein Fehler im Personalcontrolling sein.", "Glückwunsch, das kommt in Ihr Arbeitszeugnis!", "Na warte, ich hole auf!"];
const BONK = ["BONK!", "PLONK!", "DOING!", "KAWUMM!", "BOING!"];
const RIVAL_STIL = [
  { k: "Brandt", farbe: 0x1d2633, stil: "limo" },
  { k: "Excel", farbe: 0x1f8a4c, stil: "rakete" },
  { k: "Betriebsrat", farbe: 0xc62f2f, stil: "bolide" },
  { k: "Azubi", farbe: 0xf2c230, stil: "azubi" },
  { k: "Kaffee", farbe: 0x7a4b2a, stil: "kurier" },
  { k: "Demir", farbe: 0xe8f4f7, stil: "elektro" }];
const RIVALEN = (HU.RIVALEN && HU.RIVALEN.length >= 5) ? HU.RIVALEN : ["Herr Brandt im Dienstwagen", "Die Excel-Rakete", "Betriebsrats-Bolide", "Azubi Leon (Fahranfänger)", "Kaffeemaschinen-Kurier"];

/* ---------- Speicher ---------- */
function sterneLesen() { try { return JSON.parse(localStorage.getItem("pe26_spiel") || "{}") || {}; } catch (e) { return {}; } }
function sterneSpeichern(tag, n) {
  try { const o = sterneLesen(); const k = tag + "-" + MISSION; if (!(o[k] >= n)) { o[k] = n; localStorage.setItem("pe26_spiel", JSON.stringify(o)); } } catch (e) {}
}
function optLesen() { try { return JSON.parse(localStorage.getItem("pe26_rennen_opt") || "null"); } catch (e) { return null; } }
function optSpeichern(o) { try { localStorage.setItem("pe26_rennen_opt", JSON.stringify(o)); } catch (e) {} }
function parseDatum(s) { const [d, m, y] = String(s).split(".").map(Number); return new Date(y, m - 1, d); }
function tagNachDatum() {
  const heute = new Date(); heute.setHours(23, 59, 59);
  let nr = SP.days[0] ? SP.days[0].nr : 1;
  for (const d of SP.days) if (d.date && parseDatum(d.date) <= heute) nr = d.nr;
  return nr;
}

/* =========================================================
   Strecke
   ========================================================= */
const KP = [[0, 0], [120, 0], [250, 0], [330, 40], [360, 140], [355, 260], [320, 330], [350, 420], [340, 520], [270, 590], [150, 600], [30, 570],
  [-100, 560], [-230, 590], [-350, 560], [-440, 470], [-470, 350], [-470, 240], [-460, 140], [-500, 50], [-470, -50], [-380, -100], [-270, -70], [-170, -8], [-80, 0]];
const FLUSS = [[-1000, 220], [-800, 268], [-620, 262], [-472, 283], [-360, 300], [-262, 300]];
const SEE = { x: -195, z: 300, r: 72 };
const TR = {};
const F = { x: 0, z: 0, tx: 0, tz: 1, rx: -1, rz: 0, h: 0, hd: 0, i: 0 };

function baueStrecke() {
  const curve = new THREE.CatmullRomCurve3(KP.map((p) => new THREE.Vector3(p[0], 0, p[1])), true, "centripetal");
  const L = curve.getLength(); const N = Math.round(L / 2);
  const pts = curve.getSpacedPoints(N); pts.pop();
  const ds = L / N;
  const A = () => new Float32Array(N);
  const px = A(), pz = A(), tx = A(), tz = A(), rx = A(), rz = A(), k = A(), h = A(), hd = A(), vlim = A();
  for (let i = 0; i < N; i++) { px[i] = pts[i].x; pz[i] = pts[i].z; }
  for (let i = 0; i < N; i++) {
    const a = (i - 1 + N) % N, b = (i + 1) % N;
    const dx = px[b] - px[a], dz = pz[b] - pz[a], l = Math.hypot(dx, dz) || 1;
    tx[i] = dx / l; tz[i] = dz / l; rx[i] = -tz[i]; rz[i] = tx[i]; hd[i] = Math.atan2(tx[i], tz[i]);
  }
  for (let i = 0; i < N; i++) k[i] = wrapA(hd[(i + 1) % N] - hd[(i - 1 + N) % N]) / (2 * ds);
  for (let p = 0; p < 3; p++) { const c = k.slice(); for (let i = 0; i < N; i++) { let s = 0; for (let j = -2; j <= 2; j++) s += c[(i + j + N) % N]; k[i] = s / 5; } }
  Object.assign(TR, { L, N, ds, px, pz, tx, tz, rx, rz, k, h, hd, vlim });
  // Brücke über die Tarpenbek
  let bi = 0, bd = 1e9;
  for (let i = 0; i < N; i++) { if (px[i] > -400) continue; const d = flussAbstand(px[i], pz[i]); if (d < bd) { bd = d; bi = i; } }
  TR.sBruecke = bi * ds;
  for (let i = 0; i < N; i++) h[i] = huegel(i * ds);
  for (let i = 0; i < N; i++) vlim[i] = Math.min(62, Math.sqrt(21 / Math.max(Math.abs(k[i]), 1e-4)));
  for (let r = 0; r < 2; r++) for (let i = N - 1; i >= 0; i--) { const j = (i + 1) % N; const lim = Math.sqrt(vlim[j] * vlim[j] + 2 * 16 * ds); if (vlim[i] > lim) vlim[i] = lim; }
  // Raster für Abstandsabfragen
  TR.grid = new Map();
  for (let i = 0; i < N; i++) { const key = gk(Math.floor(px[i] / 20), Math.floor(pz[i] / 20)); if (!TR.grid.has(key)) TR.grid.set(key, []); TR.grid.get(key).push(i); }
  TR.iT0 = Math.round(TUNNEL[0] / ds); TR.iT1 = Math.round(TUNNEL[1] / ds);
}
function gk(a, b) { return a * 100003 + b; }
function huegel(s) {
  const L = TR.L; let u = Math.abs(mod(s - TR.sBruecke + L / 2, L) - L / 2);
  if (u < 28) return 5.5;
  if (u < 95) { const t = 1 - (u - 28) / 67; return 5.5 * t * t * (3 - 2 * t); }
  return 0;
}
function rahmen(s) {
  const { N, ds, px, pz, tx, tz, h } = TR;
  s = mod(s, TR.L); const f = s / ds; const i = Math.floor(f) % N; const j = (i + 1) % N; const t = f - Math.floor(f);
  F.x = px[i] + (px[j] - px[i]) * t; F.z = pz[i] + (pz[j] - pz[i]) * t;
  let a = tx[i] + (tx[j] - tx[i]) * t, b = tz[i] + (tz[j] - tz[i]) * t; const l = Math.hypot(a, b) || 1; a /= l; b /= l;
  F.tx = a; F.tz = b; F.rx = -b; F.rz = a; F.h = h[i] + (h[j] - h[i]) * t; F.hd = Math.atan2(a, b); F.i = i;
  return F;
}
const PROJ = { i: 0, s: 0, d: 0 };
function projiziere(x, z, hint) {
  const { N, ds, px, pz, tx, tz } = TR;
  let best = 0, bd = 1e18;
  if (hint < 0) { for (let i = 0; i < N; i++) { const dx = x - px[i], dz = z - pz[i], q = dx * dx + dz * dz; if (q < bd) { bd = q; best = i; } } }
  else { for (let k = -40; k <= 40; k++) { const i = (hint + k + N) % N; const dx = x - px[i], dz = z - pz[i], q = dx * dx + dz * dz; if (q < bd) { bd = q; best = i; } } }
  const dx = x - px[best], dz = z - pz[best];
  PROJ.i = best; PROJ.s = mod(best * ds + dx * tx[best] + dz * tz[best], TR.L); PROJ.d = dx * -tz[best] + dz * tx[best];
  return PROJ;
}
const ABST = { d: 999, i: -1 };
function streckenAbstand(x, z) {
  const cx = Math.floor(x / 20), cz = Math.floor(z / 20); let best = 1e18, bi = -1;
  for (let a = -4; a <= 4; a++) for (let b = -4; b <= 4; b++) {
    const l = TR.grid.get(gk(cx + a, cz + b)); if (!l) continue;
    for (const i of l) { const dx = x - TR.px[i], dz = z - TR.pz[i], q = dx * dx + dz * dz; if (q < best) { best = q; bi = i; } }
  }
  ABST.d = bi < 0 ? 999 : Math.sqrt(best); ABST.i = bi; return ABST;
}
function flussAbstand(x, z) {
  let best = 1e9;
  for (let i = 0; i < FLUSS.length - 1; i++) {
    const [ax, az] = FLUSS[i], [bx, bz] = FLUSS[i + 1];
    const vx = bx - ax, vz = bz - az; const t = clamp(((x - ax) * vx + (z - az) * vz) / (vx * vx + vz * vz), 0, 1);
    best = Math.min(best, Math.hypot(x - ax - vx * t, z - az - vz * t) - 13);
  }
  return Math.min(best, Math.hypot(x - SEE.x, z - SEE.z) - SEE.r);
}
function frei(x, z, r) {
  const a = streckenAbstand(x, z);
  if (a.d < r + RAND + 3) return false;
  if (a.i >= TR.iT0 - 20 && a.i <= TR.iT1 + 20 && a.d < r + 88) return false;
  if (flussAbstand(x, z) < r + 6) return false;
  return true;
}
function zone(s) {
  s = mod(s, TR.L);
  if (s >= 2440 || s < 330) return "stadt";
  if (s < 930) return "industrie";
  if (s < 1190) return "park";
  if (s < 1410) return "tunnel";
  if (s < 2290) return "land";
  return "rand";
}

/* =========================================================
   Renderer, Szene
   ========================================================= */
let renderer, scene, cam, sonne, hemi;
let pixelRatio = Math.min(window.devicePixelRatio || 1, 1.5);
const canvas = $("welt");

function canvasTex(w, h, zeichne, wiederholen) {
  const c = document.createElement("canvas"); c.width = w; c.height = h;
  const g = c.getContext("2d"); zeichne(g, w, h);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace;
  if (wiederholen) { t.wrapS = t.wrapT = THREE.RepeatWrapping; }
  t.anisotropy = renderer ? Math.min(8, renderer.capabilities.getMaxAnisotropy()) : 1;
  return t;
}
function rundRect(g, x, y, w, h, r) { g.beginPath(); g.moveTo(x + r, y); g.arcTo(x + w, y, x + w, y + h, r); g.arcTo(x + w, y + h, x, y + h, r); g.arcTo(x, y + h, x, y, r); g.arcTo(x, y, x + w, y, r); g.closePath(); }
function textUmbruch(g, text, maxW) {
  const woerter = String(text).split(" "); const zeilen = []; let z = "";
  for (const w of woerter) { const t = z ? z + " " + w : w; if (g.measureText(t).width > maxW && z) { zeilen.push(z); z = w; } else z = t; }
  if (z) zeilen.push(z); return zeilen;
}

/* ---------- Geometrie-Bündel ---------- */
const _M = new THREE.Matrix4(), _Q = new THREE.Quaternion(), _E = new THREE.Euler(), _V = new THREE.Vector3(), _S = new THREE.Vector3(), _C = new THREE.Color();
function farbeSetzen(g, farbe) {
  const n = g.attributes.position.count; const c = new Float32Array(n * 3); _C.set(farbe);
  for (let i = 0; i < n; i++) { c[i * 3] = _C.r; c[i * 3 + 1] = _C.g; c[i * 3 + 2] = _C.b; }
  g.setAttribute("color", new THREE.BufferAttribute(c, 3));
}
function verschmelze(geos) {
  let n = 0; const liste = geos.map((g) => (g.index ? g.toNonIndexed() : g)); for (const g of liste) n += g.attributes.position.count;
  const pos = new Float32Array(n * 3), nor = new Float32Array(n * 3), uv = new Float32Array(n * 2), col = new Float32Array(n * 3).fill(1);
  let o = 0;
  for (const g of liste) {
    const c = g.attributes.position.count;
    pos.set(g.attributes.position.array, o * 3);
    if (!g.attributes.normal) g.computeVertexNormals();
    nor.set(g.attributes.normal.array, o * 3);
    if (g.attributes.uv) uv.set(g.attributes.uv.array, o * 2);
    if (g.attributes.color && g.attributes.color.itemSize === 3) col.set(g.attributes.color.array, o * 3);
    o += c;
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute("position", new THREE.BufferAttribute(pos, 3)); geo.setAttribute("normal", new THREE.BufferAttribute(nor, 3));
  geo.setAttribute("uv", new THREE.BufferAttribute(uv, 2)); geo.setAttribute("color", new THREE.BufferAttribute(col, 3));
  geo.computeBoundingSphere(); return geo;
}
class Bau {
  constructor() { this.teile = []; }
  geo(g0, x, y, z, ry, farbe, sx = 1, sy = 1, sz = 1, rx = 0, rz = 0) {
    const g = g0.index ? g0.toNonIndexed() : g0.clone();
    _Q.setFromEuler(_E.set(rx, ry, rz, "YXZ")); _M.compose(_V.set(x, y, z), _Q, _S.set(sx, sy, sz)); g.applyMatrix4(_M);
    if (farbe !== undefined && farbe !== null) farbeSetzen(g, farbe);
    this.teile.push(g); return g;
  }
  box(x, y, z, w, h, d, ry, farbe, fenster, rx = 0) {
    const g = new THREE.BoxGeometry(w, h, d).toNonIndexed();
    const uv = g.attributes.uv;
    for (let f = 0; f < 6; f++) {
      let su = 0, sv = 0;
      if (fenster && (f < 2 || f > 3)) { su = Math.max(1, Math.round((f < 2 ? d : w) / 4)); sv = Math.max(1, Math.round(h / 3.6)); }
      for (let v = f * 6; v < f * 6 + 6; v++) {
        if (su) uv.setXY(v, uv.getX(v) * su, uv.getY(v) * sv); else uv.setXY(v, 0.02, 0.02);
      }
    }
    return this.geo(g, x, y, z, ry, farbe, 1, 1, 1, rx);
  }
  mesh(mat) { const m = new THREE.Mesh(verschmelze(this.teile), mat); m.matrixAutoUpdate = false; m.updateMatrix(); return m; }
}
function prisma(w, h, d) {
  const a = [-w / 2, 0, -d / 2], b = [w / 2, 0, -d / 2], c = [w / 2, 0, d / 2], e = [-w / 2, 0, d / 2], f = [0, h, -d / 2], g = [0, h, d / 2];
  const tri = [a, f, b, e, c, g, a, e, g, a, g, f, b, f, g, b, g, c];
  const geo = new THREE.BufferGeometry(); geo.setAttribute("position", new THREE.Float32BufferAttribute(tri.flat(), 3)); geo.computeVertexNormals(); return geo;
}

/* ---------- Band entlang der Strecke ---------- */
function band(iA, iB, profil, opt = {}) {
  const step = opt.step || 1, vLen = opt.vLen || 10, N = TR.N;
  const idx = []; for (let i = iA; i <= iB; i += step) idx.push(i); if (idx[idx.length - 1] !== iB) idx.push(iB);
  const nP = profil.length, pos = [], uv = [], ind = [];
  idx.forEach((ii) => {
    const i = mod(ii, N); const s = ii * TR.ds;
    for (let j = 0; j < nP; j++) {
      let d, y;
      if (typeof profil[j] === "function") { [d, y] = profil[j](i, s); }
      else { d = profil[j][0]; y = TR.h[i] + profil[j][1]; }
      pos.push(TR.px[i] + TR.rx[i] * d, y, TR.pz[i] + TR.rz[i] * d);
      uv.push(opt.u ? opt.u[j] : j / (nP - 1), s / vLen);
    }
  });
  for (let r = 0; r < idx.length - 1; r++) for (let j = 0; j < nP - 1; j++) { const a = r * nP + j, b = a + 1, c = a + nP, d = c + 1; ind.push(a, b, c, b, d, c); }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3)); geo.setAttribute("uv", new THREE.Float32BufferAttribute(uv, 2));
  geo.setIndex(ind); geo.computeVertexNormals(); return geo;
}
function bereiche(test) { // zusammenhängende Index-Bereiche, in denen test(i) gilt
  const N = TR.N, out = []; let start = -1;
  for (let i = 0; i <= N; i++) { const ok = i < N && test(i); if (ok && start < 0) start = i; if (!ok && start >= 0) { out.push([start, i]); start = -1; } }
  if (out.length > 1 && out[0][0] === 0 && out[out.length - 1][1] === N) { const l = out.pop(); out[0] = [l[0], N + out[0][1]]; }
  return out;
}

/* =========================================================
   Welt bauen
   ========================================================= */
const MAT = {};
const WELT = { gates: [], rotoren: [], wolken: null, ampel: [], lichterTunnel: 1 };

function baueWelt() {
  scene = new THREE.Scene();
  const nebelFarbe = new THREE.Color("#cfe3ee");
  scene.background = nebelFarbe; scene.fog = new THREE.Fog(nebelFarbe, 160, 820);
  cam = new THREE.PerspectiveCamera(62, innerWidth / innerHeight, 0.5, 2600); scene.add(cam);
  hemi = new THREE.HemisphereLight(0xdff0ff, 0x5d7a45, 1.7); scene.add(hemi);
  sonne = new THREE.DirectionalLight(0xfff1d6, 2.1); sonne.position.set(-300, 500, 200); scene.add(sonne);

  // Texturen
  const T = {};
  T.gras = canvasTex(256, 256, (g, w, h) => {
    g.fillStyle = "#7fb069"; g.fillRect(0, 0, w, h);
    for (let i = 0; i < 2600; i++) { const v = Math.random(); g.fillStyle = v < 0.5 ? "rgba(70,120,50,.35)" : "rgba(170,210,120,.3)"; g.fillRect(Math.random() * w, Math.random() * h, 2, 3); }
  }, true);
  T.gras.repeat.set(420, 420);
  T.strasse = canvasTex(256, 512, (g, w, h) => {
    g.fillStyle = "#54585e"; g.fillRect(0, 0, w, h);
    for (let i = 0; i < 5000; i++) { g.fillStyle = Math.random() < 0.5 ? "rgba(0,0,0,.18)" : "rgba(255,255,255,.08)"; g.fillRect(Math.random() * w, Math.random() * h, 2, 2); }
    g.fillStyle = "#f4f4f0"; g.fillRect(6, 0, 7, h); g.fillRect(w - 13, 0, 7, h);
    g.fillStyle = "rgba(244,244,240,.85)"; for (const x of [0.25, 0.5, 0.75]) g.fillRect(w * x - 3, 0, 6, h * 0.42);
  }, true);
  T.kerb = canvasTex(32, 64, (g, w, h) => { g.fillStyle = "#d9302c"; g.fillRect(0, 0, w, h / 2); g.fillStyle = "#f5f5f5"; g.fillRect(0, h / 2, w, h / 2); }, true);
  T.fenster = canvasTex(64, 64, (g, w, h) => {
    g.fillStyle = "#f2f2ef"; g.fillRect(0, 0, w, h);
    const gr = g.createLinearGradient(0, 14, 0, 50); gr.addColorStop(0, "#5f86a8"); gr.addColorStop(1, "#22364d");
    g.fillStyle = gr; g.fillRect(14, 14, 36, 34); g.fillStyle = "rgba(255,255,255,.35)"; g.fillRect(16, 16, 10, 30);
  }, true);
  T.zuschauer = canvasTex(256, 64, (g, w, h) => {
    g.fillStyle = "#4b5563"; g.fillRect(0, 0, w, h);
    const f = ["#e5484d", "#2f7fe0", "#f2c230", "#ffffff", "#26a65b", "#ff8a00", "#0077a6"];
    for (let y = 6; y < h; y += 14) for (let x = 3; x < w; x += 7) { g.fillStyle = pick(f); g.beginPath(); g.arc(x + Math.random() * 2, y, 2.6, 0, 7); g.fill(); g.fillStyle = "#f1c9a5"; g.fillRect(x - 1, y - 6, 3, 3); }
  }, true);
  T.schatten = canvasTex(64, 128, (g, w, h) => {
    const gr = g.createRadialGradient(w / 2, h / 2, 4, w / 2, h / 2, h / 2); gr.addColorStop(0, "rgba(0,0,0,.6)"); gr.addColorStop(1, "rgba(0,0,0,0)");
    g.fillStyle = gr; g.fillRect(0, 0, w, h);
  });
  T.punkt = canvasTex(32, 32, (g, w, h) => {
    const gr = g.createRadialGradient(16, 16, 0, 16, 16, 16); gr.addColorStop(0, "rgba(255,255,255,1)"); gr.addColorStop(0.4, "rgba(255,255,255,.7)"); gr.addColorStop(1, "rgba(255,255,255,0)");
    g.fillStyle = gr; g.fillRect(0, 0, w, h);
  });
  T.karo = canvasTex(256, 32, (g, w, h) => { for (let x = 0; x < 16; x++) for (let y = 0; y < 2; y++) { g.fillStyle = (x + y) % 2 ? "#111" : "#fff"; g.fillRect(x * 16, y * 16, 16, 16); } });
  MAT.T = T;

  MAT.vc = new THREE.MeshLambertMaterial({ vertexColors: true, flatShading: true });
  MAT.vc2 = new THREE.MeshLambertMaterial({ vertexColors: true, flatShading: true, side: THREE.DoubleSide });
  MAT.fenster = new THREE.MeshLambertMaterial({ vertexColors: true, map: T.fenster });
  const off = (m, f) => { m.polygonOffset = true; m.polygonOffsetFactor = f; m.polygonOffsetUnits = f * 2; return m; };
  MAT.strasse = off(new THREE.MeshLambertMaterial({ map: T.strasse, side: THREE.DoubleSide }), -3);
  MAT.kerb = off(new THREE.MeshLambertMaterial({ map: T.kerb, side: THREE.DoubleSide }), -3);
  MAT.boden = off(new THREE.MeshLambertMaterial({ vertexColors: true, side: THREE.DoubleSide }), -1);
  MAT.wasser = off(new THREE.MeshPhongMaterial({ color: 0x3a86b8, shininess: 90, specular: 0x9fd6ff, side: THREE.DoubleSide }), -2);
  MAT.farbe = (c, o = 0.5) => off(new THREE.MeshBasicMaterial({ color: c, transparent: true, opacity: o, depthWrite: false, side: THREE.DoubleSide }), -5);
  MAT.leuchte = new THREE.MeshBasicMaterial({ color: 0xfff1b8 });

  // Himmel
  const himmel = new THREE.Mesh(new THREE.SphereGeometry(2300, 24, 12), new THREE.ShaderMaterial({
    side: THREE.BackSide, depthWrite: false, fog: false,
    uniforms: { oben: { value: new THREE.Color("#3f8fd0") }, unten: { value: new THREE.Color("#d6ebf4") } },
    vertexShader: "varying vec3 vP; void main(){ vP = normalize(position); gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }",
    fragmentShader: "uniform vec3 oben; uniform vec3 unten; varying vec3 vP; void main(){ float t = clamp(vP.y*2.2, 0.0, 1.0); gl_FragColor = vec4(mix(unten, oben, t), 1.0); }",
  }));
  himmel.renderOrder = -10; scene.add(himmel); WELT.himmel = himmel;
  const sonnenScheibe = new THREE.Sprite(new THREE.SpriteMaterial({ map: T.punkt, color: 0xfff6d0, fog: false, depthWrite: false }));
  sonnenScheibe.scale.set(260, 260, 1); sonnenScheibe.position.set(-900, 1300, 600); himmel.add(sonnenScheibe);

  // Boden
  const boden = new THREE.Mesh(new THREE.PlaneGeometry(6000, 6000), new THREE.MeshLambertMaterial({ map: T.gras }));
  boden.rotation.x = -Math.PI / 2; scene.add(boden);

  baueStrasse();
  baueFluss();
  baueTunnel();
  baueBruecke();
  baueStart();
  baueTore();
  baueLandschaft();
}

function baueStrasse() {
  const N = TR.N, T = MAT.T;
  scene.add(new THREE.Mesh(band(0, N, [[-HALB, 0.02], [HALB, 0.02]], { vLen: 16 }), MAT.strasse));
  // Randsteine in Kurven
  for (const [a, b] of bereiche((i) => Math.abs(TR.k[i]) > 1 / 170)) {
    scene.add(new THREE.Mesh(band(a, b, [[HALB, 0.03], [RAND - 0.1, 0.03]], { vLen: 4 }), MAT.kerb));
    scene.add(new THREE.Mesh(band(a, b, [[-RAND + 0.1, 0.03], [-HALB, 0.03]], { vLen: 4 }), MAT.kerb));
  }
  // Seitenstreifen
  const sb = new THREE.Mesh(band(0, N, [[-RAND - 0.6, 0.015], [-HALB, 0.015]], { vLen: 8 }), MAT.strasse.clone()); sb.material.map = null; sb.material.color.set(0x8a8d84); scene.add(sb);
  const sb2 = new THREE.Mesh(band(0, N, [[HALB, 0.015], [RAND + 0.6, 0.015]], { vLen: 8 }), sb.material); scene.add(sb2);
  // Leitplanken (nicht im Tunnel)
  const imTunnel = (i) => i >= TR.iT0 - 1 && i <= TR.iT1 + 1;
  const planke = new THREE.MeshLambertMaterial({ color: 0xc9d0d8, side: THREE.DoubleSide });
  for (const [a, b] of bereiche((i) => !imTunnel(i))) {
    for (const sd of [-1, 1]) {
      scene.add(new THREE.Mesh(band(a, b, [[sd * RAND, 0.45], [sd * (RAND + 0.05), 0.95]], { step: 2 }), planke));
    }
  }
  // Pfosten
  const pf = []; for (let i = 0; i < N; i += 2) if (!imTunnel(i)) pf.push(i);
  const pm = new THREE.InstancedMesh(new THREE.BoxGeometry(0.16, 0.9, 0.16), new THREE.MeshLambertMaterial({ color: 0x8c949e }), pf.length * 2);
  const o = new THREE.Object3D(); let n = 0;
  for (const i of pf) for (const sd of [-1, 1]) {
    o.position.set(TR.px[i] + TR.rx[i] * sd * (RAND + 0.15), TR.h[i] + 0.45, TR.pz[i] + TR.rz[i] * sd * (RAND + 0.15)); o.rotation.y = TR.hd[i]; o.updateMatrix(); pm.setMatrixAt(n++, o.matrix);
  }
  scene.add(pm);
  // Gehwege in der Stadt
  const geh = new THREE.MeshLambertMaterial({ color: 0xb9bcc2, side: THREE.DoubleSide });
  for (const [a, b] of bereiche((i) => zone(i * TR.ds) === "stadt")) for (const sd of [-1, 1]) {
    scene.add(new THREE.Mesh(band(a, b, [[sd * (RAND + 0.6), 0.015], [sd * (RAND + 0.6), 0.2], [sd * (RAND + 7), 0.2]], { step: 2 }), geh));
  }
}

function baueFluss() {
  const curve = new THREE.CatmullRomCurve3(FLUSS.map((p) => new THREE.Vector3(p[0], 0, p[1])), false, "centripetal");
  const pts = curve.getSpacedPoints(80);
  const streifen = (breite, y) => {
    const pos = [], ind = [];
    pts.forEach((p, i) => {
      const q = pts[Math.min(i + 1, pts.length - 1)], o = pts[Math.max(i - 1, 0)];
      let dx = q.x - o.x, dz = q.z - o.z; const l = Math.hypot(dx, dz); dx /= l; dz /= l;
      pos.push(p.x - dz * breite, y, p.z + dx * breite, p.x + dz * breite, y, p.z - dx * breite);
      if (i > 0) { const a = (i - 1) * 2; ind.push(a, a + 1, a + 2, a + 1, a + 3, a + 2); }
    });
    const g = new THREE.BufferGeometry(); g.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3)); g.setIndex(ind); g.computeVertexNormals(); return g;
  };
  const sand = streifen(17, 0.04); farbeSetzen(sand, 0xc8b98a);
  scene.add(new THREE.Mesh(sand, MAT.boden));
  scene.add(new THREE.Mesh(streifen(13, 0.07), MAT.wasser));
  const ring = new THREE.Mesh(new THREE.CircleGeometry(SEE.r + 5, 28), MAT.boden.clone()); ring.material.vertexColors = false; ring.material.color.set(0xc8b98a);
  ring.rotation.x = -Math.PI / 2; ring.position.set(SEE.x, 0.04, SEE.z); scene.add(ring);
  const see = new THREE.Mesh(new THREE.CircleGeometry(SEE.r, 28), MAT.wasser); see.rotation.x = -Math.PI / 2; see.position.set(SEE.x, 0.07, SEE.z); scene.add(see);
  // Steg und Boote im Stadtparksee
  const b = new Bau();
  b.box(SEE.x + 40, 0.5, SEE.z + 50, 4, 0.3, 30, 0.6, 0x8a6a44);
  for (let i = 0; i < 3; i++) { b.box(SEE.x - 20 + i * 14, 0.4, SEE.z - 10 + i * 9, 2.2, 0.6, 4.5, i, [0xffffff, 0xe5484d, 0xf2c230][i]); }
  scene.add(b.mesh(MAT.vc));
}

function baueTunnel() {
  const { iT0, iT1 } = TR;
  const innen = new THREE.MeshLambertMaterial({ color: 0x8a9098, side: THREE.DoubleSide });
  scene.add(new THREE.Mesh(band(iT0, iT1, [[-9.7, 0], [-9.7, 6.5], [-7, 8.2], [7, 8.2], [9.7, 6.5], [9.7, 0]], { step: 2 }), innen));
  const streifen = new THREE.MeshLambertMaterial({ color: 0xf2c230, side: THREE.DoubleSide });
  for (const sd of [-1, 1]) scene.add(new THREE.Mesh(band(iT0, iT1, [[sd * 9.65, 0.2], [sd * 9.65, 1.0]], { step: 2 }), streifen));
  // Lampen
  const lampen = [];
  for (let i = iT0 + 2; i < iT1; i += 6) lampen.push(i);
  const lm = new THREE.InstancedMesh(new THREE.BoxGeometry(0.6, 0.15, 2.4), MAT.leuchte, lampen.length * 2);
  const o = new THREE.Object3D(); let n = 0;
  for (const i of lampen) for (const sd of [-1, 1]) { o.position.set(TR.px[i] + TR.rx[i] * sd * 5, 8.1, TR.pz[i] + TR.rz[i] * sd * 5); o.rotation.y = TR.hd[i]; o.updateMatrix(); lm.setMatrixAt(n++, o.matrix); }
  scene.add(lm);
  // Hügel als Rücken über dem Tunnel
  const D = [-82, -58, -34, -15, 0, 15, 34, 58, 82], Y = [0, 9, 17, 22, 24, 22, 17, 9, 0];
  const jit = (r, j) => (j === 0 || j === D.length - 1) ? 0 : (mulberry(r * 31 + j * 7)() - 0.5) * 5;
  const reihen = []; for (let i = iT0; i <= iT1; i += 5) reihen.push(i); if (reihen[reihen.length - 1] !== iT1) reihen.push(iT1);
  const pos = [], col = [], ind = [];
  reihen.forEach((i, r) => {
    const ende = r === 0 || r === reihen.length - 1;
    D.forEach((d, j) => {
      const y = Y[j] + (ende ? 0 : jit(r, j));
      pos.push(TR.px[i] + TR.rx[i] * d, y, TR.pz[i] + TR.rz[i] * d);
      _C.set(y > 18 ? 0x9ccf78 : (j % 2 ? 0x84bd62 : 0x93c96e)); col.push(_C.r, _C.g, _C.b);
    });
  });
  const nP = D.length;
  for (let r = 0; r < reihen.length - 1; r++) for (let j = 0; j < nP - 1; j++) { const a = r * nP + j, b = a + 1, c = a + nP, d = c + 1; ind.push(a, c, b, b, c, d); }
  let g = new THREE.BufferGeometry(); g.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute("color", new THREE.Float32BufferAttribute(col, 3));
  g.setIndex(ind); g = g.toNonIndexed(); g.computeVertexNormals();
  scene.add(new THREE.Mesh(g, MAT.vc2));
  // Stirnseiten mit Öffnung
  const fels = new THREE.MeshLambertMaterial({ color: 0x9a8f7e, side: THREE.DoubleSide, flatShading: true });
  for (const i of [iT0, iT1]) {
    const sh = new THREE.Shape(); sh.moveTo(D[0], -2); D.forEach((d, j) => sh.lineTo(d, Y[j])); sh.lineTo(D[D.length - 1], -2); sh.closePath();
    const loch = new THREE.Path(); loch.moveTo(-9.7, -0.5); loch.lineTo(9.7, -0.5); loch.lineTo(9.7, 6.5); loch.lineTo(7, 8.2); loch.lineTo(-7, 8.2); loch.lineTo(-9.7, 6.5); loch.closePath();
    sh.holes.push(loch);
    const sg = new THREE.ShapeGeometry(sh); const p = sg.attributes.position;
    for (let v = 0; v < p.count; v++) { const d = p.getX(v), y = p.getY(v); p.setXYZ(v, TR.px[i] + TR.rx[i] * d, y, TR.pz[i] + TR.rz[i] * d); }
    sg.computeVertexNormals(); scene.add(new THREE.Mesh(sg, fels));
    // Portalrahmen
    const b = new Bau(); const hd = TR.hd[i];
    const P = (d, y, f) => [TR.px[i] + TR.rx[i] * d + TR.tx[i] * f, y, TR.pz[i] + TR.rz[i] * d + TR.tz[i] * f];
    const f = i === iT0 ? -0.6 : 0.6;
    let q = P(0, 9.4, f); b.box(q[0], q[1], q[2], 23, 2.4, 1.2, hd, 0xb7b2a8);
    for (const sd of [-1, 1]) { q = P(sd * 10.8, 4.2, f); b.box(q[0], q[1], q[2], 2.2, 8.4, 1.2, hd, 0xb7b2a8); }
    scene.add(b.mesh(MAT.vc));
    if (i === iT0) schild("Harksheide-Tunnel", P(0, 9.4, -1.25), hd + Math.PI, 12, 1.8, "#003366", "#ffffff");
  }
}

function baueBruecke() {
  const N = TR.N, ds = TR.ds; const iB = Math.round(TR.sBruecke / ds);
  const nah = (i, lim) => Math.abs(mod(i - iB + N / 2, N) - N / 2) * ds < lim;
  const beton = new THREE.MeshLambertMaterial({ color: 0xa7a59f, side: THREE.DoubleSide });
  const erde = new THREE.MeshLambertMaterial({ color: 0x7c9a52, side: THREE.DoubleSide, flatShading: true });
  for (const [a, b] of bereiche((i) => nah(i, 96))) {
    for (const sd of [-1, 1]) scene.add(new THREE.Mesh(band(a, b, [[sd * (RAND + 0.6), 0.02], [sd * (RAND + 0.6), -0.9]], { step: 2 }), beton));
    scene.add(new THREE.Mesh(band(a, b, [[-(RAND + 0.6), -0.9], [RAND + 0.6, -0.9]], { step: 2 }), beton));
    // Geländer oben
    for (const sd of [-1, 1]) scene.add(new THREE.Mesh(band(a, b, [[sd * (RAND + 0.1), 1.05], [sd * (RAND + 0.1), 1.25]], { step: 2 }), new THREE.MeshLambertMaterial({ color: 0x0077a6, side: THREE.DoubleSide })));
  }
  for (const [a, b] of bereiche((i) => nah(i, 96) && !nah(i, 26))) {
    for (const sd of [-1, 1]) scene.add(new THREE.Mesh(band(a, b, [[sd * (RAND + 0.6), -0.9], (i) => [sd * (RAND + 0.6 + 1.8 * TR.h[i]), 0]], { step: 2 }), erde));
  }
  // Pfeiler und Bogen
  const b = new Bau();
  for (const f of [-22, 22]) { const fr = rahmen(TR.sBruecke + f); b.box(fr.x, 2.3, fr.z, 18, 4.6, 1.8, fr.hd, 0x9c9a94); }
  for (const sd of [-1, 1]) {
    for (let k = 0; k < 16; k++) {
      const s0 = TR.sBruecke - 30 + k * 3.75, s1 = s0 + 3.75;
      const y0 = 5.5 + 5 * Math.sin(Math.PI * (k / 16)), y1 = 5.5 + 5 * Math.sin(Math.PI * ((k + 1) / 16));
      const fr = rahmen((s0 + s1) / 2); const x = fr.x + fr.rx * sd * (RAND + 0.9), z = fr.z + fr.rz * sd * (RAND + 0.9);
      b.box(x, (y0 + y1) / 2, z, 0.5, 0.55, 3.9, fr.hd, 0xd0452f, false, -Math.atan2(y1 - y0, 3.75));
      if (k % 2 === 0 && k > 0) b.box(x, (5.5 + y0) / 2, z, 0.18, y0 - 5.5, 0.18, fr.hd, 0xd0452f);
    }
  }
  scene.add(b.mesh(MAT.vc));
  const fr = rahmen(TR.sBruecke - 75);
  schild("Tarpenbek", [fr.x + fr.rx * 12, 2.6, fr.z + fr.rz * 12], fr.hd + Math.PI - 0.35, 6, 1.4, "#ffffff", "#1d3d6b", true);
}

function schild(text, pos, ry, w, h, bg, fg, pfosten) {
  const tex = canvasTex(512, Math.round(512 * h / w), (g, cw, ch) => {
    g.fillStyle = bg; g.fillRect(0, 0, cw, ch); g.strokeStyle = fg; g.lineWidth = ch * 0.06; g.strokeRect(ch * 0.06, ch * 0.06, cw - ch * 0.12, ch - ch * 0.12);
    g.fillStyle = fg; g.textAlign = "center"; g.textBaseline = "middle"; let fs = ch * 0.55; g.font = `700 ${fs}px Inter, sans-serif`;
    while (g.measureText(text).width > cw * 0.88) { fs *= 0.92; g.font = `700 ${fs}px Inter, sans-serif`; }
    g.fillText(text, cw / 2, ch / 2 + fs * 0.04);
  });
  const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshLambertMaterial({ map: tex, side: THREE.DoubleSide }));
  m.position.set(pos[0], pos[1], pos[2]); m.rotation.y = ry; scene.add(m);
  if (pfosten) { const p = new THREE.Mesh(new THREE.BoxGeometry(0.15, pos[1], 0.15), new THREE.MeshLambertMaterial({ color: 0x888888 })); p.position.set(pos[0], pos[1] / 2 - h / 2, pos[2]); scene.add(p); }
  return m;
}

function baueStart() {
  const f = rahmen(0); const hd = f.hd;
  const linie = new THREE.Mesh(new THREE.PlaneGeometry(HALB * 2, 2.4), MAT.farbe(0xffffff, 1)); linie.material.map = MAT.T.karo; linie.material.color.set(0xffffff);
  linie.rotation.set(-Math.PI / 2, 0, 0); const gr = new THREE.Group(); gr.add(linie); gr.position.set(f.x, 0.05, f.z); gr.rotation.y = hd; scene.add(gr);
  // Startplätze
  const b = new Bau();
  for (let r = 0; r < 3; r++) for (const c of [-1, 1]) {
    const fr = rahmen(-6 - r * 10 - (c > 0 ? 4 : 0)); const x = fr.x + fr.rx * c * 3.6, z = fr.z + fr.rz * c * 3.6;
    b.box(x, 0.04, z, 3.2, 0.02, 0.25, fr.hd, 0xffffff);
  }
  scene.add(b.mesh(MAT.vc));
  // Portal
  const p = new Bau();
  for (const sd of [-1, 1]) p.box(f.x + f.rx * sd * (RAND + 1.2), 4.6, f.z + f.rz * sd * (RAND + 1.2), 1, 9.2, 1, hd, 0x003366);
  p.box(f.x, 8.6, f.z, 2 * RAND + 3.4, 1.8, 1, hd, 0x003366);
  p.box(f.x - f.tx * 0.2, 6.8, f.z - f.tz * 0.2, 5.4, 1.5, 0.6, hd, 0x15181d);
  scene.add(p.mesh(MAT.vc));
  schild("NORDSTERN RACING", [f.x - f.tx * 0.55, 8.6, f.z - f.tz * 0.55], hd + Math.PI, 2 * RAND + 2.6, 1.6, "#003366", "#ffffff");
  for (let k = 0; k < 4; k++) {
    const m = new THREE.Mesh(new THREE.CircleGeometry(0.5, 16), new THREE.MeshBasicMaterial({ color: k < 3 ? 0x3a0d0d : 0x0d3a17 }));
    const d = -1.95 + k * 1.3;
    m.position.set(f.x - f.tx * 0.55 + f.rx * d, 6.8, f.z - f.tz * 0.55 + f.rz * d); m.rotation.y = hd + Math.PI; scene.add(m); WELT.ampel.push(m);
  }
  // Tribüne
  const tr = new Bau(); const tm = new Bau();
  for (let st = 0; st < 5; st++) {
    const fr = rahmen(-10); const off = RAND + 9 + st * 2.2;
    const th = 1.4 + st * 1.2; tm.box(fr.x + fr.rx * off, th / 2, fr.z + fr.rz * off, 2.2, th, 60, fr.hd, 0xffffff, true);
  }
  const fr = rahmen(-10); tr.box(fr.x + fr.rx * (RAND + 14.5), 7.5, fr.z + fr.rz * (RAND + 14.5), 1, 9, 62, fr.hd, 0x0077a6);
  tr.box(fr.x + fr.rx * (RAND + 13), 12.2, fr.z + fr.rz * (RAND + 13), 6, 0.4, 64, fr.hd, 0xffffff);
  scene.add(tr.mesh(MAT.vc));
  const zm = new THREE.MeshLambertMaterial({ vertexColors: true, map: MAT.T.zuschauer }); scene.add(tm.mesh(zm));
}

/* ---------- Frage-Tore ---------- */
function buchstabenTex(k, rahmenAn) {
  return canvasTex(256, 160, (g, w, h) => {
    g.fillStyle = FARBEN[k]; g.fillRect(0, 0, w, h);
    if (rahmenAn) { g.strokeStyle = "#fff"; g.lineWidth = 10; g.strokeRect(5, 5, w - 10, h - 10); }
    g.font = "700 130px Kalam, Inter, sans-serif"; g.textAlign = "center"; g.textBaseline = "middle";
    g.lineWidth = 12; g.strokeStyle = "#1b1b1b"; g.strokeText(BU[k], w / 2, h / 2 + 12); g.fillStyle = "#fff"; g.fillText(BU[k], w / 2, h / 2 + 12);
  });
}
function baueTore() {
  const boardMats = [0, 1, 2, 3].map((k) => new THREE.MeshBasicMaterial({ map: buchstabenTex(k, true), side: THREE.DoubleSide }));
  const strichMats = [0, 1, 2, 3].map((k) => MAT.farbe(new THREE.Color(FARBEN[k]), 0.42));
  const bodenMats = [0, 1, 2, 3].map((k) => { const m = MAT.farbe(0xffffff, 0.9); m.map = canvasTex(128, 128, (g, w, h) => { g.font = "700 120px Kalam, Inter, sans-serif"; g.textAlign = "center"; g.textBaseline = "middle"; g.fillStyle = "#fff"; g.fillText(BU[k], w / 2, h / 2 + 10); }); return m; });
  const pollerPos = [];
  for (const sG of SLOTS) {
    const iG = Math.round(sG / TR.ds), iA = iG - Math.round(80 / TR.ds);
    for (let k = 0; k < 4; k++) {
      const d0 = -HALB + k * 4 + 0.25, d1 = d0 + 3.5;
      scene.add(new THREE.Mesh(band(iA, iG, [[d0, 0.035], [d1, 0.035]], { step: 2 }), strichMats[k]));
      for (const sOff of [-60, -22]) {
        const fr = rahmen(sG + sOff); const pl = new THREE.Mesh(new THREE.PlaneGeometry(3, 3), bodenMats[k]);
        pl.rotation.x = -Math.PI / 2; const gr = new THREE.Group(); gr.add(pl);
        gr.position.set(fr.x + fr.rx * SPUR_D[k], fr.h + 0.05, fr.z + fr.rz * SPUR_D[k]); gr.rotation.y = fr.hd + Math.PI; scene.add(gr);
      }
    }
    for (let s = sG - 34; s <= sG - 2; s += 4) for (const d of [-4, 0, 4]) pollerPos.push([s, d]);
    // Portal
    const fr = rahmen(sG); const gruppe = new THREE.Group();
    const p = new Bau();
    for (const d of [-8, -4, 0, 4, 8]) p.box(fr.rx * d, 3.3, fr.rz * d, 0.35, 6.6, 0.35, fr.hd, 0x2b2f36);
    p.box(0, 6.75, 0, 16.8, 0.4, 0.5, fr.hd, 0x2b2f36);
    gruppe.add(p.mesh(MAT.vc));
    const boards = [];
    for (let k = 0; k < 4; k++) {
      const m = new THREE.Mesh(new THREE.PlaneGeometry(3.5, 2.2), boardMats[k]);
      m.position.set(fr.rx * SPUR_D[k] - fr.tx * 0.3, 5.3, fr.rz * SPUR_D[k] - fr.tz * 0.3); m.rotation.y = fr.hd + Math.PI;
      gruppe.add(m); boards.push(m);
      // Leuchtvorhang
      const v = new THREE.Mesh(new THREE.PlaneGeometry(3.6, 4.2), MAT.farbe(new THREE.Color(FARBEN[k]), 0.16));
      v.position.set(fr.rx * SPUR_D[k], 2.1, fr.rz * SPUR_D[k]); v.rotation.y = fr.hd + Math.PI; gruppe.add(v); boards[k].vorhang = v;
    }
    gruppe.position.set(fr.x, fr.h, fr.z); scene.add(gruppe);
    WELT.gates.push({ s: sG, gruppe, boards, puls: 0, pulsK: -1 });
  }
  const pg = new THREE.CylinderGeometry(0.16, 0.2, 0.9, 6); pg.translate(0, 0.45, 0);
  const poller = new THREE.InstancedMesh(pg, new THREE.MeshLambertMaterial({ color: 0xff7a1a }), pollerPos.length);
  const o = new THREE.Object3D();
  pollerPos.forEach(([s, d], n) => { const fr = rahmen(s); o.position.set(fr.x + fr.rx * d, fr.h, fr.z + fr.rz * d); o.updateMatrix(); poller.setMatrixAt(n, o.matrix); });
  scene.add(poller);
}

/* ---------- Landschaft ---------- */
function baueLandschaft() {
  const L = TR.L;
  const haus = new Bau(), deko = new Bau();
  const baeume = []; // [x, z, typ, scale]
  const baum = (x, z, typ, sc) => { if (frei(x, z, 2.5)) baeume.push([x, z, typ, sc]); };
  const pos = (s, sd, off) => { const f = rahmen(s); return [f.x + f.rx * sd * off, f.z + f.rz * sd * off, f.hd]; };
  const rechteckFrei = (x, z, hd, w, d, r) => {
    const cx = Math.cos(hd), sx = Math.sin(hd);
    for (const [a, b] of [[0, 0], [-w / 2, -d / 2], [w / 2, -d / 2], [-w / 2, d / 2], [w / 2, d / 2], [0, -d / 2], [0, d / 2], [-w / 2, 0], [w / 2, 0]]) {
      // a quer, b längs (lokal: x = quer zur Fahrtrichtung)
      const wx = x + cx * a + sx * b, wz = z - sx * a + cx * b;
      if (!frei(wx, wz, r)) return false;
    }
    return true;
  };
  const STADT = [0xf0d9b5, 0xe8c4a0, 0xcfd8dc, 0xf4e1d2, 0xd7ccc8, 0xbfd7ea, 0xf6efe0, 0xe6b8a2];
  // Gebäudereihen
  function reihe(sA, sB, sd, typ) {
    let s = sA;
    while (s < sB) {
      let w, d, h, farbe, abst;
      if (typ === "stadt") { w = rr(12, 22); d = rr(12, 20); h = rr(10, 34); farbe = STADT[Math.floor(R() * STADT.length)]; abst = RAND + 9; }
      else if (typ === "industrie") { w = rr(26, 48); d = rr(22, 36); h = rr(8, 14); farbe = [0xb0b8c0, 0x9aa7b0, 0xd9d4c7, 0x7f95a6][Math.floor(R() * 4)]; abst = RAND + 12; }
      else { w = rr(9, 12); d = rr(8, 11); h = rr(4, 6); farbe = [0xf3ead8, 0xe9d6c0, 0xffffff, 0xd8c3a5][Math.floor(R() * 4)]; abst = RAND + 14; }
      const sm = s + w / 2, off = abst + d / 2 + rr(0, typ === "rand" ? 10 : 4);
      const [x, z, hd] = pos(sm, sd, off);
      if (rechteckFrei(x, z, hd, d, w, 1)) {
        if (typ === "rand") {
          haus.box(x, h / 2, z, d, h, w, hd, farbe, true);
          deko.geo(prisma(d + 0.6, 3.2, w + 0.6), x, h, z, hd, [0xb5432f, 0x8e3b2b, 0x5a5f66][Math.floor(R() * 3)]);
          if (R() < 0.7) baum(x + rr(-12, 12), z + rr(-12, 12), R() < 0.5 ? 0 : 1, rr(0.8, 1.2));
        } else {
          haus.box(x, h / 2, z, d, h, w, hd, farbe, typ === "stadt");
          deko.box(x, h + 0.4, z, d + 0.4, 0.8, w + 0.4, hd, typ === "stadt" ? 0x6b6f76 : 0x5d6670);
          if (typ === "industrie" && R() < 0.35) { const ox = x + rr(-5, 5), oz = z + rr(-5, 5); deko.geo(new THREE.CylinderGeometry(1, 1.4, 22, 8), ox, h + 11, oz, 0, 0x9b4a3c); }
        }
      }
      s += w + rr(3, typ === "stadt" ? 6 : 12);
    }
  }
  // Stadt
  reihe(L - 330, L - 70, 1, "stadt"); reihe(60, 320, 1, "stadt"); reihe(L - 330, L + 320, -1, "stadt");
  // Industrie
  reihe(360, 520, -1, "industrie"); reihe(700, 920, -1, "industrie"); reihe(380, 900, 1, "industrie");
  // Rand
  reihe(2300, 2440, 1, "rand"); reihe(2300, 2440, -1, "rand"); reihe(1500, 1560, 1, "rand");
  // Container
  for (let s = 420; s < 880; s += 40) {
    const [x, z, hd] = pos(s, 1, RAND + 6 + rr(0, 4));
    if (rechteckFrei(x, z, hd, 3, 12, 0.5)) for (let k = 0; k < 1 + Math.floor(R() * 3); k++) deko.box(x, 1.3 + k * 2.6, z, 2.5, 2.6, 12, hd, [0xd0452f, 0x0077a6, 0x26a65b, 0xe0a800, 0x6a4c93][Math.floor(R() * 5)]);
  }
  // Nordstern Fahrradwerke
  {
    const s = 600; const f = rahmen(s); const hd = f.hd; const off = RAND + 42;
    const x = f.x - f.rx * off, z = f.z - f.rz * off;
    haus.box(x, 9, z, 40, 18, 90, hd, 0xe9edf1, true);
    deko.box(x, 18.6, z, 40.6, 1.4, 90.6, hd, 0x0077a6);
    for (let k = -4; k <= 4; k++) deko.geo(prisma(38, 4, 9), x + f.tx * k * 10, 19.2, z + f.tz * k * 10, hd + Math.PI / 2, 0xc4ccd4);
    const sx = x + f.rx * 20.4, sz = z + f.rz * 20.4;
    schild("NORDSTERN FAHRRADWERKE", [sx, 13, sz], hd - Math.PI / 2, 60, 5.5, "#003366", "#ffffff");
    const ka = rahmen(s + 70); deko.geo(new THREE.CylinderGeometry(1.6, 2.4, 46, 10), ka.x - ka.rx * (off + 6), 23, ka.z - ka.rz * (off + 6), 0, 0xd0452f);
    deko.geo(new THREE.CylinderGeometry(1.75, 1.75, 4, 10), ka.x - ka.rx * (off + 6), 38, ka.z - ka.rz * (off + 6), 0, 0xffffff);
    // Riesenfahrrad vor dem Werk
    const fb = rahmen(s - 35); const bx = fb.x - fb.rx * (RAND + 9), bz = fb.z - fb.rz * (RAND + 9);
    const rad = new THREE.TorusGeometry(2.6, 0.32, 6, 18);
    for (const k of [-1, 1]) deko.geo(rad, bx + fb.tx * k * 3.4, 2.9, bz + fb.tz * k * 3.4, fb.hd + Math.PI / 2, 0x1b1f25);
    const rohr = (a, b, farbe) => { const dx = b[0] - a[0], dy = b[1] - a[1]; const l = Math.hypot(dx, dy); const g = new THREE.CylinderGeometry(0.22, 0.22, l, 6);
      const mx = (a[0] + b[0]) / 2, my = (a[1] + b[1]) / 2; deko.geo(g, bx + fb.tx * mx, 2.9 + my, bz + fb.tz * mx, fb.hd, farbe, 1, 1, 1, Math.atan2(dx, dy)); };
    rohr([-3.4, 0], [-0.4, 2.4], 0x0077a6); rohr([-3.4, 0], [0, 0], 0x0077a6); rohr([0, 0], [-0.4, 2.4], 0x0077a6); rohr([-0.4, 2.4], [2.6, 2.4], 0x0077a6);
    rohr([2.6, 2.4], [3.4, 0], 0x0077a6); rohr([0, 0], [2.6, 2.4], 0x0077a6); rohr([2.6, 2.4], [2.4, 3.4], 0x1b1f25); rohr([-0.4, 2.4], [-0.6, 3.1], 0x1b1f25);
    deko.box(bx, 0.3, bz, 3, 0.6, 9, fb.hd, 0x8c949e);
    const fs = rahmen(s - 130); schild("NORDSTERN FAHRRADWERKE", [fs.x - fs.rx * (RAND + 8), 6, fs.z - fs.rz * (RAND + 8)], fs.hd + Math.PI + 0.4, 14, 3, "#0077a6", "#ffffff", true);
    const pl = rahmen(s - 80); schild("Werksverkauf Lastenräder", [pl.x - pl.rx * (RAND + 6), 3, pl.z - pl.rz * (RAND + 6)], pl.hd + Math.PI + 0.35, 7, 1.6, "#0077a6", "#ffffff", true);
  }
  // Plakate
  const plakate = (HU.PLAKATE && HU.PLAKATE.length) ? HU.PLAKATE : ["NORDSTERN RACING"];
  const plS = [2330, 2410, 280, 860, 1080, 1620, 2220];
  plakate.slice(0, plS.length).forEach((txt, n) => {
    const sd = n % 2 ? -1 : 1; const s = plS[n]; const f = rahmen(s);
    const x = f.x + f.rx * sd * (RAND + 7), z = f.z + f.rz * sd * (RAND + 7);
    const tex = canvasTex(512, 256, (g, w, h) => {
      const bg = ["#003366", "#0077a6", "#f2c230", "#e5484d", "#26a65b", "#ffffff", "#6a4c93"][n % 7];
      g.fillStyle = bg; g.fillRect(0, 0, w, h); g.fillStyle = "rgba(255,255,255,.15)"; g.beginPath(); g.arc(w * 0.85, h * 0.2, 90, 0, 7); g.fill();
      const fg = (bg === "#ffffff" || bg === "#f2c230") ? "#003366" : "#ffffff"; g.fillStyle = fg; g.textAlign = "center"; g.textBaseline = "middle";
      let fs = 52; g.font = `700 ${fs}px Kalam, sans-serif`; let z2 = textUmbruch(g, txt, w - 50);
      while (z2.length * fs * 1.05 > h - 50 && fs > 20) { fs -= 3; g.font = `700 ${fs}px Kalam, sans-serif`; z2 = textUmbruch(g, txt, w - 50); }
      z2.forEach((t, k) => g.fillText(t, w / 2, h / 2 + (k - (z2.length - 1) / 2) * fs * 1.05));
      g.font = "600 16px Inter, sans-serif"; g.fillText("Nordstern Racing · Waybuild Akademie", w / 2, h - 16);
    });
    const m = new THREE.Mesh(new THREE.PlaneGeometry(10, 5), new THREE.MeshLambertMaterial({ map: tex, side: THREE.DoubleSide }));
    m.position.set(x, 5.6, z); m.rotation.y = f.hd + Math.PI - sd * 0.45; scene.add(m);
    for (const k of [-1, 1]) deko.box(x + Math.cos(m.rotation.y) * k * 3.5, 1.6, z - Math.sin(m.rotation.y) * k * 3.5, 0.3, 3.2, 0.3, 0, 0x555b63);
  });
  // Ortsschild
  { const f = rahmen(2295); schild("Norderstedt", [f.x + f.rx * (RAND + 3), 2.4, f.z + f.rz * (RAND + 3)], f.hd + Math.PI - 0.3, 3.6, 1.5, "#f6c700", "#111111", true); }
  { const f = rahmen(TUNNEL[1] + 150); schild("Kreis Segeberg", [f.x + f.rx * (RAND + 3), 2.4, f.z + f.rz * (RAND + 3)], f.hd + Math.PI - 0.3, 4, 1.2, "#ffffff", "#1d3d6b", true); }
  { const f = rahmen(-120); schild("Norderstedt Mitte", [f.x - f.rx * (RAND + 3), 2.6, f.z - f.rz * (RAND + 3)], f.hd + Math.PI + 0.3, 4.4, 1.2, "#0077a6", "#ffffff", true); }
  // Straßenlaternen in der Stadt
  const lat = [];
  for (let s = 0; s < L; s += 32) if (zone(s) === "stadt") for (const sd of [-1, 1]) { const f = rahmen(s + (sd > 0 ? 16 : 0)); lat.push([f.x + f.rx * sd * (RAND + 1.4), f.z + f.rz * sd * (RAND + 1.4), f.hd + (sd > 0 ? 0 : Math.PI)]); }
  const latG = new Bau(); latG.box(0, 4, 0, 0.22, 8, 0.22, 0, 0x5d646d); latG.box(-1.1, 8, 0, 2.4, 0.2, 0.3, 0, 0x5d646d); latG.box(-2.1, 7.85, 0, 0.8, 0.12, 0.45, 0, 0xfff1b8);
  const latM = new THREE.InstancedMesh(verschmelze(latG.teile), MAT.vc, lat.length); const o = new THREE.Object3D();
  lat.forEach(([x, z, r], n) => { o.position.set(x, 0, z); o.rotation.y = r + Math.PI / 2; o.updateMatrix(); latM.setMatrixAt(n, o.matrix); }); scene.add(latM);
  // Bäume entlang der Strecke
  for (let s = 0; s < L; s += 5) {
    const zn = zone(s);
    for (const sd of [-1, 1]) {
      if (zn === "park" && R() < 0.5) { const [x, z] = pos(s, sd, rr(14, 70)); baum(x, z, R() < 0.7 ? 0 : 1, rr(0.8, 1.4)); }
      if (zn === "land") {
        const allee = (s > 1500 && s < 1800) || (s > 2050 && s < 2280);
        if (allee && s % 15 < 5) { const [x, z] = pos(s, sd, 14); baum(x, z, 0, 1.1); }
        if (R() < 0.18) { const [x, z] = pos(s, sd, rr(20, 120)); baum(x, z, R() < 0.5 ? 0 : 1, rr(0.8, 1.5)); }
      }
      if ((zn === "stadt" || zn === "rand") && R() < 0.04) { const [x, z] = pos(s, sd, rr(30, 60)); baum(x, z, 0, rr(0.8, 1.2)); }
      if (zn === "industrie" && R() < 0.05) { const [x, z] = pos(s, sd, rr(12, 20)); baum(x, z, 1, rr(0.8, 1.1)); }
    }
  }
  // Waldstücke und Felder in der Fläche
  const felder = new Bau();
  const FF = [0xe8cf3a, 0xd8b860, 0x4f8a3c, 0x8a6a44, 0x9cc26a];
  for (let n = 0; n < 70; n++) {
    const x = rr(-1100, 900), z = rr(-700, 1100), w = rr(50, 130), d = rr(50, 120), rot = rr(0, Math.PI);
    if (Math.hypot(x - 100, z - 0) < 260 && z < 60) continue;
    if (rechteckFrei(x, z, rot, w, d, 6)) felder.box(x, 0.0, z, w, 0.06, d, rot, FF[n % FF.length]);
  }
  scene.add(felder.mesh(MAT.boden));
  for (let n = 0; n < 26; n++) {
    const cx = rr(-1000, 800), cz = rr(-650, 1000);
    for (let k = 0; k < 22; k++) baum(cx + rr(-45, 45), cz + rr(-45, 45), R() < 0.6 ? 1 : 0, rr(0.9, 1.6));
  }
  for (let k = 0; k < 40; k++) { const a = rr(0, Math.PI * 2), r = SEE.r + rr(10, 40); baum(SEE.x + Math.cos(a) * r, SEE.z + Math.sin(a) * r, 0, rr(0.9, 1.4)); }
  // Bauernhof
  { const f = rahmen(2170); const x = f.x - f.rx * 70, z = f.z - f.rz * 70;
    if (rechteckFrei(x, z, f.hd, 30, 40, 2)) {
      haus.box(x, 3.5, z, 14, 7, 22, f.hd, 0xa8432f, false); deko.geo(prisma(15, 5, 23), x, 7, z, f.hd, 0x5a5f66);
      const x2 = x - f.tx * 26, z2 = z - f.tz * 26; haus.box(x2, 4.5, z2, 18, 9, 16, f.hd, 0x8c5a3c, false); deko.geo(prisma(19, 5, 17), x2, 9, z2, f.hd, 0x6b4a33);
      deko.geo(new THREE.CylinderGeometry(3, 3, 14, 10), x + f.rx * 16, 7, z + f.rz * 16, 0, 0xc9d0d8);
    } }
  // Hamburg in der Ferne
  const sky = new Bau();
  for (let k = 0; k < 40; k++) sky.box(rr(-500, 700), 0, 1650 + rr(0, 120), rr(20, 50), 1, rr(20, 40), 0, 0x9db4c4);
  sky.teile.forEach((g) => { const p = g.attributes.position; const hh = rr(30, 120); for (let v = 0; v < p.count; v++) if (p.getY(v) > 0) p.setY(v, hh); });
  sky.geo(new THREE.CylinderGeometry(4, 7, 260, 8), 150, 130, 1700, 0, 0x9db4c4);
  sky.geo(new THREE.CylinderGeometry(14, 14, 12, 12), 150, 210, 1700, 0, 0x9db4c4);
  const skyM = sky.mesh(new THREE.MeshBasicMaterial({ color: 0xffffff, vertexColors: true, fog: false })); scene.add(skyM);

  scene.add(haus.mesh(MAT.fenster));
  scene.add(deko.mesh(MAT.vc));

  // Windräder
  const rotorG = (() => { const b = new Bau(); for (let k = 0; k < 3; k++) b.geo(new THREE.BoxGeometry(1.2, 19, 0.3).translate(0, 9.5, 0), 0, 0, 0, 0, 0xf4f6f8, 1, 1, 1, 0, k * Math.PI * 2 / 3); b.geo(new THREE.SphereGeometry(1.1, 8, 6), 0, 0, 0, 0, 0xf4f6f8); return verschmelze(b.teile); })();
  const turm = new Bau();
  for (const s of [1560, 1700, 1830, 2000, 2150, 2260, 1250]) {
    const f = rahmen(s); const off = rr(130, 230); const sd = s === 1250 ? 1 : -1; const x = f.x + f.rx * sd * off, z = f.z + f.rz * sd * off;
    if (!frei(x, z, 10)) continue;
    turm.geo(new THREE.CylinderGeometry(0.9, 1.8, 48, 8), x, 24, z, 0, 0xeef1f4);
    turm.box(x, 48.5, z, 2.2, 2.2, 5, 0.6, 0xeef1f4);
    const r = new THREE.Mesh(rotorG, MAT.vc); r.position.set(x + Math.sin(0.6) * 2.8, 48.5, z + Math.cos(0.6) * 2.8); r.rotation.y = 0.6; r.rotation.z = R() * 3; scene.add(r); WELT.rotoren.push(r);
  }
  scene.add(turm.mesh(MAT.vc));

  // Bäume als Instanzen
  const stamm = new THREE.CylinderGeometry(0.25, 0.4, 1, 5); stamm.translate(0, 0.5, 0);
  const krone = new THREE.IcosahedronGeometry(1, 0); const kegel = new THREE.ConeGeometry(1, 1, 6); kegel.translate(0, 0.5, 0);
  const stM = new THREE.InstancedMesh(stamm, new THREE.MeshLambertMaterial({ color: 0x6b4a33 }), baeume.length);
  const nLaub = baeume.filter((b) => b[2] === 0).length;
  const krM = new THREE.InstancedMesh(krone, new THREE.MeshLambertMaterial({ color: 0xffffff, flatShading: true }), Math.max(1, nLaub));
  const keM = new THREE.InstancedMesh(kegel, new THREE.MeshLambertMaterial({ color: 0xffffff, flatShading: true }), Math.max(1, baeume.length - nLaub));
  let a = 0, c = 0;
  baeume.forEach(([x, z, typ, sc], n) => {
    o.rotation.set(0, R() * 6, 0);
    o.position.set(x, 0, z); o.scale.set(sc, sc * (typ ? 2 : 3), sc); o.updateMatrix(); stM.setMatrixAt(n, o.matrix);
    if (typ === 0) { o.position.set(x, sc * 4.6, z); o.scale.set(2.7 * sc, 2.9 * sc, 2.7 * sc); o.updateMatrix(); krM.setMatrixAt(a, o.matrix); _C.setHSL(0.26 + R() * 0.08, 0.45, 0.32 + R() * 0.12); krM.setColorAt(a++, _C); }
    else { o.position.set(x, sc * 1.4, z); o.scale.set(2.4 * sc, 8 * sc, 2.4 * sc); o.updateMatrix(); keM.setMatrixAt(c, o.matrix); _C.setHSL(0.33 + R() * 0.05, 0.4, 0.22 + R() * 0.08); keM.setColorAt(c++, _C); }
  });
  krM.count = a; keM.count = c;
  scene.add(stM, krM, keM);
  WELT.anzBaeume = baeume.length;

  // Wolken
  const w = new Bau();
  for (let n = 0; n < 22; n++) {
    const x = rr(-1600, 1600), z = rr(-1600, 1600), y = rr(220, 330);
    for (let k = 0; k < 4; k++) w.geo(new THREE.IcosahedronGeometry(1, 0), x + rr(-40, 40), y + rr(-6, 6), z + rr(-25, 25), R() * 3, 0xffffff, rr(25, 45), rr(9, 15), rr(18, 30));
  }
  WELT.wolken = w.mesh(new THREE.MeshLambertMaterial({ vertexColors: true, flatShading: true, fog: false, emissive: 0x8899aa }));
  WELT.wolken.matrixAutoUpdate = true; scene.add(WELT.wolken);
}

/* =========================================================
   Autos
   ========================================================= */
let radGeo = null, flammGeo = null;
function baueAuto(farbe, stil) {
  if (!radGeo) {
    const b = new Bau(); b.geo(new THREE.CylinderGeometry(0.38, 0.38, 0.32, 12), 0, 0, 0, 0, 0x1b1b1b, 1, 1, 1, 0, Math.PI / 2);
    b.geo(new THREE.CylinderGeometry(0.2, 0.2, 0.34, 8), 0, 0, 0, 0, 0xc9ced6, 1, 1, 1, 0, Math.PI / 2); radGeo = verschmelze(b.teile);
    flammGeo = new THREE.ConeGeometry(0.2, 1.2, 8); flammGeo.translate(0, 0.6, 0); flammGeo.rotateX(-Math.PI / 2);
  }
  const g = new THREE.Group(); g.rotation.order = "YXZ"; const koerper = new THREE.Group(); g.add(koerper);
  const b = new Bau(); const dunkel = 0x22262c, glas = 0x1d3346, licht = 0xfff6cc;
  const van = stil === "kurier";
  b.box(0, 0.45, 0, 2.0, 0.34, 4.3, 0, dunkel);
  b.box(0, 0.78, -0.15, 2.02, 0.44, 3.9, 0, farbe);
  b.box(0, 0.74, 1.85, 1.98, 0.36, 0.7, 0, farbe, false, 0.12);
  if (van) { b.box(0, 1.55, -0.45, 1.92, 1.1, 2.9, 0, farbe); b.box(0, 1.42, 1.02, 1.8, 0.66, 0.12, 0, glas, false, -0.35); }
  else { b.box(0, 1.22, -0.35, 1.66, 0.48, 2.0, 0, glas); b.box(0, 1.48, -0.4, 1.58, 0.07, 1.75, 0, farbe); }
  for (const sd of [-1, 1]) { b.box(sd * 0.62, 0.82, 2.12, 0.46, 0.16, 0.06, 0, licht); b.box(sd * 0.5, 0.42, -2.2, 0.16, 0.16, 0.25, 0, 0x777777); }
  b.box(0, 0.62, 2.17, 0.8, 0.14, 0.04, 0, dunkel);
  if (!van) { for (const sd of [-1, 1]) b.box(sd * 0.7, 1.12, -1.95, 0.08, 0.3, 0.2, 0, dunkel); b.box(0, 1.3, -2.0, stil === "bolide" ? 2.3 : 1.9, 0.07, 0.5, 0, stil === "bolide" ? 0xffd84d : dunkel); }
  if (stil === "spieler") { for (const sd of [-1, 1]) { b.box(sd * 0.28, 1.01, 0.6, 0.24, 0.02, 2.6, 0, 0xffffff); b.box(sd * 0.28, 1.525, -0.4, 0.24, 0.02, 1.76, 0, 0xffffff); } b.box(0, 0.88, 2.1, 0.5, 0.1, 0.1, 0, 0xffd84d); }
  if (stil === "limo") { b.box(0.6, 1.9, -1.0, 0.04, 0.8, 0.04, 0, 0x111111); for (const sd of [-1, 1]) b.box(sd * 1.02, 0.8, 0, 0.03, 0.08, 3.6, 0, 0xd4af37); }
  if (stil === "rakete") { b.box(0, 1.85, -1.5, 0.1, 0.8, 1.0, 0, 0x165f35); b.geo(new THREE.CylinderGeometry(0.26, 0.26, 1.8, 8), 0, 1.78, -0.4, 0, 0xffffff, 1, 1, 1, Math.PI / 2); b.geo(new THREE.ConeGeometry(0.26, 0.6, 8), 0, 1.78, 0.8, 0, 0xe5484d, 1, 1, 1, Math.PI / 2); }
  if (stil === "bolide") { b.geo(new THREE.ConeGeometry(0.3, 0.7, 8, 1, true), 0, 1.75, 0.2, 0, 0xdddddd, 1, 1, 1, -Math.PI / 2); }
  if (stil === "azubi") { b.box(0, 1.8, -0.4, 1.3, 0.5, 0.12, 0, 0xffffff); b.box(0, 1.8, -0.4, 1.36, 0.06, 0.14, 0, 0x003366); }
  if (stil === "kurier") { b.geo(new THREE.CylinderGeometry(0.5, 0.38, 0.8, 10), 0, 2.5, -0.5, 0, 0xffffff); b.geo(new THREE.CylinderGeometry(0.46, 0.46, 0.06, 10), 0, 2.88, -0.5, 0, 0x5a3418); b.geo(new THREE.TorusGeometry(0.22, 0.07, 5, 8), 0.55, 2.5, -0.5, Math.PI / 2, 0xffffff); }
  if (stil === "elektro") { b.box(0, 1.6, -0.4, 1.2, 0.12, 0.28, 0, 0x3ff0e0); for (const sd of [-1, 1]) b.box(sd * 1.02, 0.85, 0, 0.03, 0.12, 3.2, 0, 0x14a3a3); }
  koerper.add(b.mesh(MAT.vc));
  if (stil === "azubi") { const sg = schildMesh("AZUBI", 1.24, 0.42); sg.position.set(0, 1.8, -0.33); koerper.add(sg); const sg2 = sg.clone(); sg2.position.z = -0.47; sg2.rotation.y = Math.PI; koerper.add(sg2); }
  if (stil === "rakete") { const sg = schildMesh("=SUMME()", 1.3, 0.34, "#1f8a4c"); sg.position.set(0, 2.1, -1.5); sg.rotation.y = Math.PI / 2; koerper.add(sg); }
  const bremsMat = new THREE.MeshBasicMaterial({ color: 0x5a0d0d });
  const br = new Bau(); for (const sd of [-1, 1]) br.box(sd * 0.68, 0.85, -2.14, 0.42, 0.16, 0.06, 0); koerper.add(new THREE.Mesh(verschmelze(br.teile), bremsMat));
  const raeder = [], vorne = [];
  for (const [x, z] of [[-0.98, 1.35], [0.98, 1.35], [-0.98, -1.35], [0.98, -1.35]]) {
    const piv = new THREE.Group(); piv.position.set(x, 0.38, z); const r = new THREE.Mesh(radGeo, MAT.vc); piv.add(r); g.add(piv); raeder.push(r); if (z > 0) vorne.push(piv);
  }
  const flammen = [];
  for (const sd of [-1, 1]) {
    const f1 = new THREE.Mesh(flammGeo, new THREE.MeshBasicMaterial({ color: 0xff7a1a, transparent: true, opacity: 0.85, blending: THREE.AdditiveBlending, depthWrite: false }));
    const f2 = new THREE.Mesh(flammGeo, new THREE.MeshBasicMaterial({ color: 0x66ccff, transparent: true, opacity: 0.9, blending: THREE.AdditiveBlending, depthWrite: false }));
    f2.scale.set(0.5, 0.5, 0.55); f1.add(f2); f1.position.set(sd * 0.5, 0.42, -2.3); f1.visible = false; koerper.add(f1); flammen.push(f1);
  }
  const sch = new THREE.Mesh(new THREE.PlaneGeometry(2.9, 5.4), new THREE.MeshBasicMaterial({ map: MAT.T.schatten, transparent: true, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -6, polygonOffsetUnits: -12 }));
  sch.rotation.x = -Math.PI / 2; sch.position.y = 0.05; g.add(sch);
  scene.add(g);
  return { g, koerper, raeder, vorne, flammen, bremsMat };
}
function schildMesh(text, w, h, bg = "#ffffff") {
  const tex = canvasTex(256, Math.round(256 * h / w), (g, cw, ch) => { g.fillStyle = bg; g.fillRect(0, 0, cw, ch); g.fillStyle = bg === "#ffffff" ? "#003366" : "#ffffff"; g.font = `700 ${ch * 0.62}px Inter, sans-serif`; g.textAlign = "center"; g.textBaseline = "middle"; g.fillText(text, cw / 2, ch / 2 + 2); });
  return new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshBasicMaterial({ map: tex }));
}
function namensSchild(name, farbe) {
  const c = document.createElement("canvas"); const g = c.getContext("2d"); g.font = "700 40px Inter, sans-serif";
  const tw = Math.ceil(g.measureText(name).width); c.width = tw + 70; c.height = 64;
  g.font = "700 40px Inter, sans-serif"; g.fillStyle = "rgba(0,51,102,.88)"; rundRect(g, 0, 0, c.width, 64, 18); g.fill();
  g.fillStyle = "#" + new THREE.Color(farbe).getHexString(); g.beginPath(); g.arc(32, 32, 13, 0, 7); g.fill(); g.strokeStyle = "#fff"; g.lineWidth = 3; g.stroke();
  g.fillStyle = "#fff"; g.textBaseline = "middle"; g.fillText(name, 56, 34);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace;
  const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: t, depthWrite: false, fog: false, transparent: true }));
  sp.scale.set(0.8 * c.width / 64, 0.8, 1); sp.position.y = 3.1; return sp;
}

/* =========================================================
   Effekte
   ========================================================= */
class Partikel {
  constructor(n, size, additiv, grav) {
    this.n = n; this.k = 0; this.grav = grav; this.additiv = additiv;
    this.p = new Float32Array(n * 3); for (let i = 0; i < n; i++) this.p[i * 3 + 1] = -9999;
    this.v = new Float32Array(n * 3); this.c = new Float32Array(n * 4); this.b = new Float32Array(n * 3); this.life = new Float32Array(n); this.max = new Float32Array(n);
    const g = new THREE.BufferGeometry(); g.setAttribute("position", new THREE.BufferAttribute(this.p, 3)); g.setAttribute("color", new THREE.BufferAttribute(this.c, 4));
    this.mesh = new THREE.Points(g, new THREE.PointsMaterial({ size, map: MAT.T.punkt, vertexColors: true, transparent: true, depthWrite: false, blending: additiv ? THREE.AdditiveBlending : THREE.NormalBlending, sizeAttenuation: true }));
    this.mesh.frustumCulled = false; scene.add(this.mesh); this.aktiv = 0;
  }
  spawn(x, y, z, vx, vy, vz, col, life) {
    const i = this.k; this.k = (this.k + 1) % this.n;
    this.p.set([x, y, z], i * 3); this.v.set([vx, vy, vz], i * 3); this.b.set([col.r, col.g, col.b], i * 3); this.life[i] = life; this.max[i] = life; this.aktiv = 2;
  }
  update(dt) {
    if (!this.aktiv) return; let lebt = false;
    for (let i = 0; i < this.n; i++) {
      if (this.life[i] <= 0) continue; this.life[i] -= dt; const j = i * 3;
      if (this.life[i] <= 0) { this.p[j + 1] = -9999; this.c[i * 4 + 3] = 0; continue; }
      lebt = true; this.v[j + 1] += this.grav * dt; const dr = Math.exp(-1.5 * dt); this.v[j] *= dr; this.v[j + 2] *= dr;
      this.p[j] += this.v[j] * dt; this.p[j + 1] += this.v[j + 1] * dt; this.p[j + 2] += this.v[j + 2] * dt;
      const a = this.life[i] / this.max[i];
      if (this.additiv) { this.c[i * 4] = this.b[j] * a; this.c[i * 4 + 1] = this.b[j + 1] * a; this.c[i * 4 + 2] = this.b[j + 2] * a; this.c[i * 4 + 3] = a; }
      else { this.c[i * 4] = this.b[j]; this.c[i * 4 + 1] = this.b[j + 1]; this.c[i * 4 + 2] = this.b[j + 2]; this.c[i * 4 + 3] = a * 0.55; }
    }
    this.mesh.geometry.attributes.position.needsUpdate = true; this.mesh.geometry.attributes.color.needsUpdate = true;
    if (!lebt) this.aktiv--;
  }
}
class Spuren {
  constructor(max) {
    this.max = max; this.k = 0; this.voll = false; this.pos = new Float32Array(max * 18);
    const g = new THREE.BufferGeometry(); g.setAttribute("position", new THREE.BufferAttribute(this.pos, 3)); g.setDrawRange(0, 0);
    this.mesh = new THREE.Mesh(g, new THREE.MeshBasicMaterial({ color: 0x111111, transparent: true, opacity: 0.38, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -6, polygonOffsetUnits: -12, side: THREE.DoubleSide }));
    this.mesh.frustumCulled = false; scene.add(this.mesh);
  }
  seg(ax, ay, az, bx, by, bz) {
    const dx = bx - ax, dz = bz - az, l = Math.hypot(dx, dz) || 1, nx = -dz / l * 0.17, nz = dx / l * 0.17;
    this.pos.set([ax - nx, ay, az - nz, ax + nx, ay, az + nz, bx + nx, by, bz + nz, ax - nx, ay, az - nz, bx + nx, by, bz + nz, bx - nx, by, bz - nz], this.k * 18);
    this.k++; if (this.k >= this.max) { this.k = 0; this.voll = true; }
    const g = this.mesh.geometry; g.setDrawRange(0, (this.voll ? this.max : this.k) * 6); g.attributes.position.needsUpdate = true;
  }
  leeren() { this.k = 0; this.voll = false; this.mesh.geometry.setDrawRange(0, 0); }
}
let funken, rauch, spuren, wind;
function baueEffekte() {
  funken = new Partikel(260, 0.5, true, -14);
  rauch = new Partikel(160, 3.2, false, 1.2);
  spuren = new Spuren(1400);
  const WL = 70, wp = new Float32Array(WL * 6); const wd = [];
  for (let i = 0; i < WL; i++) { const a = Math.random() * Math.PI * 2, r = 2.2 + Math.random() * 6; wd.push({ x: Math.cos(a) * r, y: Math.sin(a) * r * 0.75 + 0.6, z: -Math.random() * 70 }); }
  const g = new THREE.BufferGeometry(); g.setAttribute("position", new THREE.BufferAttribute(wp, 3));
  wind = new THREE.LineSegments(g, new THREE.LineBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0, fog: false, depthWrite: false }));
  wind.frustumCulled = false; wind.userData.d = wd; cam.add(wind);
}
function windUpdate(dt, v, nitro) {
  const d = wind.userData.d, p = wind.geometry.attributes.position.array; const len = 0.5 + v * 0.06 + (nitro ? 1.5 : 0);
  wind.material.opacity = clamp((v - 26) / 30, 0, 0.35) + (nitro ? 0.25 : 0);
  for (let i = 0; i < d.length; i++) {
    const w = d[i]; w.z += (v * 1.1 + 10) * dt; if (w.z > 1) { w.z = -60 - Math.random() * 20; const a = Math.random() * Math.PI * 2, r = 2.2 + Math.random() * 6; w.x = Math.cos(a) * r; w.y = Math.sin(a) * r * 0.75 + 0.6; }
    p.set([w.x, w.y, w.z, w.x, w.y, w.z - len], i * 6);
  }
  wind.geometry.attributes.position.needsUpdate = true;
}

/* =========================================================
   Ton
   ========================================================= */
const Ton = {
  ctx: null, an: true,
  init() {
    if (this.ctx) { if (this.ctx.state === "suspended") this.ctx.resume(); return; }
    try {
      const C = window.AudioContext || window.webkitAudioContext; if (!C) return; const ctx = new C(); this.ctx = ctx;
      this.master = ctx.createGain(); this.master.gain.value = this.an ? 0.32 : 0; this.master.connect(ctx.destination);
      this.o1 = ctx.createOscillator(); this.o1.type = "sawtooth"; this.o2 = ctx.createOscillator(); this.o2.type = "square";
      this.fl = ctx.createBiquadFilter(); this.fl.type = "lowpass"; this.fl.frequency.value = 500; this.mg = ctx.createGain(); this.mg.gain.value = 0;
      const g2 = ctx.createGain(); g2.gain.value = 0.4; this.o1.connect(this.fl); this.o2.connect(g2); g2.connect(this.fl); this.fl.connect(this.mg); this.mg.connect(this.master);
      this.o1.start(); this.o2.start();
      const n = ctx.sampleRate; this.noise = ctx.createBuffer(1, n, n); const d = this.noise.getChannelData(0); for (let i = 0; i < n; i++) d[i] = Math.random() * 2 - 1;
    } catch (e) { this.ctx = null; }
  },
  setAn(b) { this.an = b; if (this.master) this.master.gain.value = b ? 0.32 : 0; try { localStorage.setItem("pe26_rennen_ton", b ? "1" : "0"); } catch (e) {} },
  motor(v, gas, nitro, aktiv) {
    if (!this.ctx) return; const t = this.ctx.currentTime; const f = 42 + Math.abs(v) * 2.6 + (nitro ? 30 : 0) + gas * 8;
    this.o1.frequency.setTargetAtTime(f, t, 0.06); this.o2.frequency.setTargetAtTime(f * 0.5, t, 0.06);
    this.fl.frequency.setTargetAtTime(300 + Math.abs(v) * 16 + gas * 200, t, 0.1); this.mg.gain.setTargetAtTime(aktiv ? 0.07 + 0.06 * gas : 0, t, 0.1);
  },
  piep(freq, dauer, typ = "square", vol = 0.25, bis) {
    if (!this.ctx) return; const t = this.ctx.currentTime; const o = this.ctx.createOscillator(); const g = this.ctx.createGain(); o.type = typ;
    o.frequency.setValueAtTime(freq, t); if (bis) o.frequency.exponentialRampToValueAtTime(bis, t + dauer);
    g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(0.001, t + dauer); o.connect(g); g.connect(this.master); o.start(t); o.stop(t + dauer + 0.05);
  },
  krach(vol = 0.5) {
    if (!this.ctx) return; const t = this.ctx.currentTime; const s = this.ctx.createBufferSource(); s.buffer = this.noise; const f = this.ctx.createBiquadFilter(); f.type = "lowpass"; f.frequency.value = 900;
    const g = this.ctx.createGain(); g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(0.001, t + 0.35); s.connect(f); f.connect(g); g.connect(this.master); s.start(t); s.stop(t + 0.4);
  },
  richtig() { this.piep(660, 0.14, "triangle", 0.3); setTimeout(() => this.piep(990, 0.25, "triangle", 0.3), 110); },
  falsch() { this.piep(320, 0.45, "sawtooth", 0.25, 70); },
};

/* =========================================================
   Spielzustand
   ========================================================= */
const S = {
  zustand: "laden", tag: 1, t: 0, cd: 0, lern: false, hilfe: false, autoGas: false, neigen: false,
  gates: [], gIdx: 0, frageAn: false, wunsch: -1, infoT: 0, punkte: 0, driftPunkte: 0, zeitlupe: 0, shake: 0,
  rundeStart: 0, runde: 0, bestRunde: Infinity, zielZeit: 0, zielT: 0, platz: 4, funkT: 0, plauderT: 8, crashCd: 0, ueberholtCd: 0, menuS: 0,
};
const TEST = { auto: false, quote: 1, turbo: 1 };
const P = { x: 0, z: 0, h: 0, vx: 0, vz: 0, yaw: 0, lenk: 0, s: 0, d: 0, i: 0, dist: 0, prevS: 0, nitro: 0.3, nitroAn: false, drift: false, driftT: 0, hop: 0, hopV: 0, falschT: 0, stuckT: 0, gas: 0, bremse: 0, wandCd: 0 };
let spielerAuto; const KI = [];
let letzteSpur = [null, null];

function baueFahrer() {
  spielerAuto = baueAuto(0x0077a6, "spieler");
  const namen = shuffle(RIVALEN.slice()).slice(0, 5);
  const skills = shuffle([0.95, 0.935, 0.92, 0.905, 0.89]);
  namen.forEach((name, n) => {
    const st = RIVAL_STIL.find((r) => name.includes(r.k)) || RIVAL_STIL[n];
    const auto = baueAuto(st.farbe, st.stil); const tag = namensSchild(name, st.farbe); auto.g.add(tag);
    KI.push({ name, auto, tag, skill: skills[n], dist: 0, d: 0, v: 0, dv: 0, lane: 0, phase: Math.random() * 6, boost: 0, boostCd: 5, fertig: false, zeit: 0, latV: 0, farbe: st.farbe });
  });
}

function startPlatz(k) { const r = Math.floor(k / 2), c = k % 2 ? 1 : -1; return { dist: -6 - r * 10 - (c > 0 ? 4 : 0) - 2.2, d: c * 3.6 }; }

function bereiteFragen(tag) {
  const tagD = SP.days.find((d) => d.nr === tag) || SP.days[0] || { quiz: [] };
  const pool = shuffle((tagD.quiz || []).filter((q) => q.o && q.o.length === 4).slice()).slice(0, ANZ_FRAGEN);
  const inst = []; for (let lap = 0; lap < RUNDEN; lap++) SLOTS.forEach((s, k) => inst.push({ dist: lap * TR.L + s, slot: k, n: inst.length }));
  const prefer = [6, 11, 3, 9, 1, 5, 7, 10, 4, 8, 2, 0];
  const weg = new Set(prefer.slice(0, Math.max(0, inst.length - pool.length)));
  S.gates = inst.filter((g) => !weg.has(g.n)).map((g, n) => {
    const q = pool[n]; const ord = shuffle([0, 1, 2, 3]);
    return { ...g, q, ant: ord.map((o) => q.o[o]), richtig: ord.indexOf(q.c), nr: n + 1, durch: false, spur: -1, ok: false, autoWahl: -1 };
  });
  S.gIdx = 0;
}

function startRennen() {
  Ton.init();
  S.tag = Number($("selTag").value) || S.tag;
  S.lern = $("optLern").checked; S.hilfe = $("optHilfe").checked; S.autoGas = $("optGas").checked; S.neigen = $("optNeigen").checked;
  optSpeichern({ lern: S.lern, hilfe: S.hilfe, gas: S.autoGas, neigen: S.neigen });
  bereiteFragen(S.tag);
  Object.assign(S, { t: 0, cd: 0, frageAn: false, wunsch: -1, infoT: 0, punkte: 0, driftPunkte: 0, zeitlupe: 0, shake: 0, rundeStart: 0, runde: 0, bestRunde: Infinity, zielZeit: 0, zielT: 0, funkT: 0, plauderT: 10, crashCd: 0, ueberholtCd: 0, rundenZeiten: [] });
  const sp = startPlatz(3); const f = rahmen(sp.dist);
  Object.assign(P, { x: f.x + f.rx * sp.d, z: f.z + f.rz * sp.d, h: f.hd, vx: 0, vz: 0, yaw: 0, lenk: 0, dist: sp.dist, nitro: 0.3, nitroAn: false, drift: false, driftT: 0, hop: 0, hopV: 0, falschT: 0, stuckT: 0, wandCd: 0 });
  projiziere(P.x, P.z, -1); P.i = PROJ.i; P.s = PROJ.s; P.d = PROJ.d; P.prevS = P.s;
  [0, 1, 2, 4, 5].forEach((k, n) => { const a = KI[n]; const st = startPlatz(k); Object.assign(a, { dist: st.dist, d: st.d, v: 0, dv: 0, lane: clamp(st.d + (Math.random() - 0.5) * 4, -5, 5), boost: 0, boostCd: 6 + Math.random() * 10, fertig: false, zeit: 0, latV: 0 }); });
  S.platz = 4; spuren.leeren(); letzteSpur = [null, null];
  for (const g of WELT.gates) for (const b of g.boards) b.scale.set(1, 1, 1);
  ["eMenue", "ePause", "eErgebnis", "eErkl", "eHilfe"].forEach((id) => $(id).classList.add("versteckt"));
  $("hud").classList.remove("aus"); $("frage").classList.add("versteckt"); $("info").classList.add("versteckt"); document.body.classList.remove("frageAn");
  $("ampel").classList.remove("versteckt"); $("ampel").querySelectorAll("i").forEach((i) => i.classList.remove("an"));
  WELT.ampel.forEach((m, k) => m.material.color.set(k < 3 ? 0x3a0d0d : 0x0d3a17));
  $("hVon").textContent = "von " + (KI.length + 1);
  S.zustand = "countdown"; S.ampelStufe = -1;
  radioStart();
  if (TEST.auto) S.autoGas = true;
}

/* ---------- Eingabe ---------- */
const K = {};
const TK = { links: false, rechts: false, gas: false, bremse: false, nitro: false };
let neigung = 0;
addEventListener("keydown", (e) => {
  Ton.init();
  if (["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight", "Space"].includes(e.code) && S.zustand !== "menue") e.preventDefault();
  if (e.repeat) { K[e.code] = true; return; }
  K[e.code] = true;
  if (S.zustand === "erklaerung" && (e.code === "Enter" || e.code === "Space" || e.code === "NumpadEnter")) { e.preventDefault(); erklWeiter(); return; }
  if ((e.code === "Escape" || e.code === "KeyP") && ["rennen", "countdown"].includes(S.zustand)) { pause(true); return; }
  if ((e.code === "Escape" || e.code === "KeyP") && S.zustand === "pause") { pause(false); return; }
  if (S.zustand === "rennen") {
    const m = /^(Digit|Numpad)([1-4])$/.exec(e.code); if (m) setzeWunsch(Number(m[2]) - 1);
    if (e.code === "KeyR") zuruecksetzen();
  }
});
addEventListener("keyup", (e) => { K[e.code] = false; });
addEventListener("blur", () => { for (const k in K) K[k] = false; for (const k in TK) TK[k] = false; });
function touchKnopf(id, key) {
  const el = $(id); const ids = new Set();
  const an = () => { TK[key] = ids.size > 0; el.classList.toggle("an", TK[key]); };
  el.addEventListener("pointerdown", (e) => { e.preventDefault(); Ton.init(); ids.add(e.pointerId); try { el.setPointerCapture(e.pointerId); } catch (x) {} an(); });
  for (const ev of ["pointerup", "pointercancel", "lostpointercapture"]) el.addEventListener(ev, (e) => { ids.delete(e.pointerId); an(); });
  el.addEventListener("contextmenu", (e) => e.preventDefault());
}
touchKnopf("tLinks", "links"); touchKnopf("tRechts", "rechts"); touchKnopf("tGas", "gas"); touchKnopf("tBremse", "bremse"); touchKnopf("tNitro", "nitro");
function neigungEvent(e) {
  const ang = (screen.orientation && screen.orientation.angle) || window.orientation || 0;
  let v = ang === 90 ? e.beta : (ang === -90 || ang === 270) ? -e.beta : e.gamma;
  if (v == null) return; v = Math.abs(v) < 3 ? 0 : v - Math.sign(v) * 3; neigung = clamp(v / 22, -1, 1);
}
async function neigenAktivieren() {
  try { if (typeof DeviceOrientationEvent !== "undefined" && DeviceOrientationEvent.requestPermission) { const r = await DeviceOrientationEvent.requestPermission(); if (r !== "granted") { $("optNeigen").checked = false; return; } } } catch (e) {}
  addEventListener("deviceorientation", neigungEvent);
}

function eingabe() {
  let lenk = 0;
  if (K.ArrowLeft || K.KeyA || TK.links) lenk -= 1;
  if (K.ArrowRight || K.KeyD || TK.rechts) lenk += 1;
  if (S.neigen && neigung !== 0) lenk = clamp(lenk + neigung, -1, 1);
  const bremse = (K.ArrowDown || K.KeyS || TK.bremse) ? 1 : 0;
  let gas = (K.ArrowUp || K.KeyW || TK.gas || S.autoGas) ? 1 : 0; if (bremse && S.autoGas && !(K.ArrowUp || K.KeyW || TK.gas)) gas = 0;
  return { lenk, gas, bremse, drift: !!K.Space, nitro: !!(K.ShiftLeft || K.ShiftRight || K.KeyN || TK.nitro), manuell: Math.abs(lenk) > 0.12 };
}
function zielLenkung(dZiel, voraus) {
  const f = rahmen(P.s + voraus); const x = f.x + f.rx * dZiel, z = f.z + f.rz * dZiel;
  const err = wrapA(Math.atan2(x - P.x, z - P.z) - P.h); return clamp(-err * 2.4, -1, 1);
}

/* ---------- Physik ---------- */
function physikSpieler(dt, inp) {
  const fx = Math.sin(P.h), fz = Math.cos(P.h), rx = -fz, rz = fx;
  let vf = P.vx * fx + P.vz * fz, vr = P.vx * rx + P.vz * rz;
  const spd = Math.abs(vf);
  const bremsDrift = inp.bremse && Math.abs(inp.lenk) > 0.5 && vf > 20;
  const handbremse = inp.drift || bremsDrift;
  P.nitroAn = inp.nitro && P.nitro > 0.01 && vf > 3 && S.zustand !== "countdown";
  if (P.nitroAn) P.nitro = Math.max(0, P.nitro - dt * 0.25);
  const vmax = P.nitroAn ? V_NITRO : V_MAX;
  if (inp.gas > 0 && S.zustand !== "countdown") { const q = Math.max(0, vf) / vmax; const a = (P.nitroAn ? 26 : 17) * (1 - q * q); if (a > 0) vf += inp.gas * a * dt; }
  if (inp.bremse > 0 && !bremsDrift && S.zustand !== "countdown") { if (vf > 0.5) vf -= 34 * dt; else vf = Math.max(-12, vf - 9 * dt); }
  vf -= vf * 0.1 * dt; if (!inp.gas && !inp.bremse) vf -= Math.sign(vf) * Math.min(Math.abs(vf), 2.5 * dt);
  if (vf > vmax) vf -= (vf - vmax) * 1.5 * dt;
  if (handbremse) vf -= vf * 0.22 * dt;
  // Seitenführung
  const grip = handbremse ? 1.5 : (P.drift ? 3.6 : 9);
  const vrNeu = vr * Math.exp(-grip * dt); const verlust = Math.abs(vr - vrNeu);
  vf += Math.sign(vf) * verlust * (P.drift ? 0.45 : 0.2); vr = vrNeu;
  P.vx = fx * vf + rx * vr; P.vz = fz * vf + rz * vr;
  // Lenkung
  const lf = Math.min(spd / 8, 1) * (2.0 - 1.25 * Math.min(spd / V_MAX, 1));
  const zielYaw = -inp.lenk * lf * (handbremse ? 1.4 : 1) * (vf < -0.5 ? -1 : 1);
  P.yaw += (zielYaw - P.yaw) * Math.min(1, 10 * dt);
  P.h = wrapA(P.h + P.yaw * dt);
  P.x += P.vx * dt; P.z += P.vz * dt;
  const slip = Math.atan2(Math.abs(vr), Math.max(1, Math.abs(vf)));
  if (!P.drift && slip > 0.2 && spd > 14) P.drift = true; else if (P.drift && (slip < 0.08 || spd < 10)) P.drift = false;
  if (P.drift && S.zustand === "rennen") { P.driftT += dt; S.driftPunkte += dt * 22 * (spd / 40); P.nitro = Math.min(1, P.nitro + dt * 0.07); } else P.driftT = 0;
  // Projektion und Leitplanke
  projiziere(P.x, P.z, P.i); P.i = PROJ.i; P.s = PROJ.s; P.d = PROJ.d;
  if (Math.abs(P.d) > RAND_AUTO) {
    const sg = Math.sign(P.d), pen = Math.abs(P.d) - RAND_AUTO; const i = P.i; const nx = TR.rx[i] * sg, nz = TR.rz[i] * sg;
    P.x -= nx * pen; P.z -= nz * pen; P.d = sg * RAND_AUTO;
    const vn = P.vx * nx + P.vz * nz;
    if (vn > 0) {
      P.vx -= nx * vn * 1.3; P.vz -= nz * vn * 1.3; const verl = 1 - Math.min(0.45, vn * 0.025); P.vx *= verl; P.vz *= verl;
      P.h = wrapA(P.h + wrapA(TR.hd[i] - P.h) * Math.min(1, 0.6 * (vn / 10)) * (Math.abs(wrapA(TR.hd[i] - P.h)) < 1.6 ? 1 : 0));
      if (vn > 3) funkenSpruehen(P.x + nx * 1, rahmen(P.s).h + 0.6, P.z + nz * 1, Math.min(20, vn * 1.5), 0xffc04d);
      if (vn > 7 && P.wandCd <= 0) { P.wandCd = 1.5; knall(pick(CRASH)); Ton.krach(0.4); S.shake = Math.min(1, vn / 20); }
    }
    P.vx *= 0.998; P.vz *= 0.998;
  }
  if (P.wandCd > 0) P.wandCd -= dt;
  // Renndistanz
  let dS = P.s - P.prevS; if (dS < -TR.L / 2) dS += TR.L; if (dS > TR.L / 2) dS -= TR.L; P.dist += dS; P.prevS = P.s;
  // Sprung nach falschem Tor
  if (P.hop > 0 || P.hopV !== 0) { P.hopV -= 30 * dt; P.hop += P.hopV * dt; if (P.hop <= 0) { P.hop = 0; P.hopV = 0; } }
}

function kiSchritt(a, dt) {
  const L = TR.L, N = TR.N, ds = TR.ds;
  const s = mod(a.dist, L); const i = Math.floor(s / ds) % N;
  if (S.zustand === "countdown") { a.v = 0; return; }
  const look = Math.floor((s + 6 + a.v * 0.35) / ds) % N;
  const diff = P.dist - a.dist;
  const gummi = 1 + clamp(diff / 600, -0.12, 0.035);
  let vt = Math.min(TR.vlim[look], 56) * a.skill * gummi;
  if (a.boostCd > 0) a.boostCd -= dt;
  if (a.boost > 0) { a.boost -= dt; vt += 11; }
  else if (a.boostCd <= 0 && TR.vlim[look] > 50 && Math.random() < dt * 0.15) { a.boost = 1.8; a.boostCd = 12 + Math.random() * 12; }
  if (a.fertig) vt *= 0.6;
  if (vt > a.v) a.v += Math.min(vt - a.v, (4 + 6 * (1 - a.v / 60)) * dt); else a.v -= Math.min(a.v - vt, 18 * dt);
  // Seitenlage
  const kA = TR.k[(i + 15) % N];
  let zd = a.lane + 2 * Math.sin(a.dist / 110 + a.phase) - Math.sign(kA) * Math.min(4.5, Math.abs(kA) * 380);
  const andere = [{ dist: P.dist, d: P.d, v: Math.hypot(P.vx, P.vz) }, ...KI.filter((o) => o !== a)];
  for (const o of andere) {
    const dd = o.dist - a.dist;
    if (dd > 0 && dd < 16 && Math.abs(o.d - a.d) < 2.7 && o.v < a.v + 3) { zd = o.d + (a.d >= o.d ? 3.3 : -3.3); if (Math.abs(zd) > 6.6) zd = o.d + (a.d >= o.d ? -3.3 : 3.3); }
  }
  zd = clamp(zd, -6.6, 6.6);
  const maxLat = 2.5 + a.v * 0.06; const vorher = a.d;
  a.d += clamp(zd - a.d, -maxLat * dt, maxLat * dt) + a.dv * dt; a.dv *= Math.exp(-4 * dt);
  if (Math.abs(a.d) > RAND_AUTO) { a.d = Math.sign(a.d) * RAND_AUTO; a.dv = 0; a.v *= 0.997; }
  a.latV = (a.d - vorher) / dt;
  const alt = a.dist; a.dist += a.v * dt;
  // Frage-Tore für die KI
  for (const g of S.gates) if (g.dist > alt && g.dist <= a.dist && Math.random() < 0.3) {
    a.v *= 0.55; if (Math.abs(a.dist - P.dist) < 160) funk(a.name, `${a.name} fährt durchs falsche Tor. Nachschulung ist beantragt.`, true);
  }
  if (!a.fertig && a.dist >= RUNDEN * L) { a.fertig = true; a.zeit = S.t; }
}

function kollisionen(dt) {
  if (S.crashCd > 0) S.crashCd -= dt;
  const fr = rahmen(P.s); const ftx = fr.tx, ftz = fr.tz, frx = fr.rx, frz = fr.rz;
  for (const a of KI) {
    const dS = a.dist - P.dist, dD = a.d - P.d;
    if (Math.abs(dS) > 4.6 || Math.abs(dD) > 2.1) continue;
    const ox = 4.6 - Math.abs(dS), oy = 2.1 - Math.abs(dD);
    const vpT = P.vx * ftx + P.vz * ftz, vpR = P.vx * frx + P.vz * frz; let wucht = 0;
    if (oy < ox * 0.7) {
      const sg = Math.sign(dD) || 1;
      P.x -= frx * sg * oy * 0.5; P.z -= frz * sg * oy * 0.5; a.d += sg * oy * 0.5;
      wucht = Math.abs(vpR - a.latV) + 1; const neu = -sg * 2.5; P.vx += frx * (neu - vpR) * 0.6; P.vz += frz * (neu - vpR) * 0.6; a.dv += sg * 3.5;
      const mitt = (vpT + a.v) / 2; a.v = lerp(a.v, mitt, 0.2);
    } else {
      const sg = Math.sign(dS) || 1;
      P.x -= ftx * sg * ox * 0.5; P.z -= ftz * sg * ox * 0.5; a.dist += sg * ox * 0.5;
      const rel = vpT - a.v; wucht = Math.abs(rel);
      if (sg > 0 && rel > 0) { a.v += rel * 0.55; P.vx -= ftx * rel * 0.6; P.vz -= ftz * rel * 0.6; }
      else if (sg < 0 && rel < 0) { P.vx += ftx * -rel * 0.55; P.vz += ftz * -rel * 0.55; a.v += rel * 0.6; }
    }
    if (wucht > 2.5) {
      funkenSpruehen((P.x + fr.x + fr.rx * a.d) / 2, fr.h + 0.8, (P.z + fr.z + fr.rz * a.d) / 2, Math.min(24, wucht * 3), 0xffd36b);
      if (S.crashCd <= 0) { S.crashCd = 1.4; knall(pick(CRASH)); funk(a.name, pick(RAMM)); Ton.krach(0.5); S.shake = Math.min(1, wucht / 12); }
    }
  }
  for (let m = 0; m < KI.length; m++) for (let n = m + 1; n < KI.length; n++) {
    const a = KI[m], b = KI[n]; const dS = b.dist - a.dist, dD = b.d - a.d;
    if (Math.abs(dS) > 4.4 || Math.abs(dD) > 2.0) continue;
    const sg = Math.sign(dD) || 1, oy = 2.0 - Math.abs(dD); a.d -= sg * oy * 0.5; b.d += sg * oy * 0.5;
    if (Math.abs(dD) < 1.2) { if (dS > 0) a.v = Math.min(a.v, b.v * 0.98); else b.v = Math.min(b.v, a.v * 0.98); }
  }
}

function funkenSpruehen(x, y, z, n, farbe) {
  _C.set(farbe); const c = _C.clone();
  for (let k = 0; k < n; k++) funken.spawn(x, y, z, (Math.random() - 0.5) * 12, Math.random() * 7 + 2, (Math.random() - 0.5) * 12, c, 0.35 + Math.random() * 0.4);
}

/* ---------- Tore ---------- */
function passiere(g) {
  g.durch = true; S.gIdx++;
  g.spur = clamp(Math.floor((P.d + HALB) / 4), 0, 3); g.ok = g.spur === g.richtig; g.dPass = +P.d.toFixed(2);
  S.wunsch = -1; frageAus();
  const fr = rahmen(g.dist); const wg = WELT.gates[g.slot]; wg.puls = 1; wg.pulsK = g.spur;
  const bx = fr.x + fr.rx * SPUR_D[g.spur], bz = fr.z + fr.rz * SPUR_D[g.spur];
  if (g.ok) {
    S.punkte += 150; P.nitro = Math.min(1, P.nitro + 0.45); knall("NITRO!", true); Ton.richtig();
    _C.set(FARBEN[g.spur]); const c = _C.clone(); for (let k = 0; k < 60; k++) funken.spawn(bx, fr.h + 2 + Math.random() * 4, bz, (Math.random() - 0.5) * 16, Math.random() * 10, (Math.random() - 0.5) * 16, c, 0.6 + Math.random() * 0.5);
  } else {
    P.vx *= 0.42; P.vz *= 0.42; P.hopV = 7; S.shake = 0.8; knall(pick(BONK)); Ton.falsch();
    _C.set(0xdddddd); const c = _C.clone(); for (let k = 0; k < 26; k++) rauch.spawn(P.x + (Math.random() - 0.5) * 3, fr.h + 1, P.z + (Math.random() - 0.5) * 3, (Math.random() - 0.5) * 6, Math.random() * 3, (Math.random() - 0.5) * 6, c, 1.2);
    _C.set(0xffe14d); const y = _C.clone(); for (let k = 0; k < 20; k++) funken.spawn(P.x, fr.h + 2.2, P.z, Math.cos(k) * 5, 3 + Math.random() * 3, Math.sin(k) * 5, y, 0.9);
  }
  const witz = g.ok ? pick(LOB) : pick(TADEL);
  g.witz = witz;
  if (S.lern) {
    S.zustand = "erklaerung";
    $("eUrteil").textContent = g.ok ? "Richtig!" : "Leider falsch"; $("eUrteil").classList.toggle("falsch", !g.ok);
    $("eFrage").textContent = g.q.q; loesungZeile($("eLoesung"), g);
    $("eErklText").innerHTML = ""; const b = document.createElement("b"); b.textContent = "Erklärung"; $("eErklText").append(b, document.createTextNode(g.q.e || ""));
    $("eWitz").textContent = witz; $("eErkl").classList.remove("versteckt"); setTimeout(() => $("btnErklWeiter").focus(), 50);
  } else {
    S.zeitlupe = 1.0;
    const inf = $("info"); inf.classList.toggle("falsch", !g.ok);
    $("iUrteil").textContent = g.ok ? "Richtig! Nitro aufgeladen" : "Falsches Tor! Kurz ausgebremst";
    loesungZeile($("iLoesung"), g);
    $("iErkl").innerHTML = ""; const b = document.createElement("b"); b.textContent = "Erklärung"; $("iErkl").append(b, document.createTextNode(g.q.e || ""));
    $("iWitz").textContent = witz; inf.classList.remove("versteckt");
    S.infoT = clamp(5 + ((g.q.e || "").length + g.ant[g.richtig].length) / 40, 6, 11);
  }
}
function loesungZeile(el, g) {
  el.innerHTML = ""; const bad = document.createElement("span"); bad.className = "bad"; bad.style.background = FARBEN[g.richtig]; bad.textContent = BU[g.richtig];
  const t = document.createElement("span"); t.textContent = "Richtig ist " + BU[g.richtig] + ", " + g.ant[g.richtig]; el.append(bad, t);
}
function erklWeiter() { if (S.zustand !== "erklaerung") return; $("eErkl").classList.add("versteckt"); S.zustand = "rennen"; S.zeitlupe = 0.6; }

function frageZeigen(g) {
  S.frageAn = true; S.infoT = 0; $("info").classList.add("versteckt"); document.body.classList.add("frageAn");
  $("fNr").textContent = `Frage-Tor ${g.nr} von ${S.gates.length}`; $("fText").textContent = g.q.q;
  const box = $("fAnt"); box.innerHTML = "";
  g.ant.forEach((a, k) => {
    const b = document.createElement("button"); b.className = "ant"; b.type = "button"; b.dataset.k = k;
    const bad = document.createElement("span"); bad.className = "bad"; bad.style.background = FARBEN[k]; bad.textContent = BU[k];
    const t = document.createElement("span"); t.textContent = a; b.append(bad, t);
    b.addEventListener("pointerdown", (e) => { e.preventDefault(); e.stopPropagation(); setzeWunsch(k); });
    b.addEventListener("click", (e) => { if (e.detail === 0) setzeWunsch(k); });
    box.append(b);
  });
  $("frage").classList.remove("versteckt");
}
function frageAus() { S.frageAn = false; $("frage").classList.add("versteckt"); document.body.classList.remove("frageAn"); }
function setzeWunsch(k) {
  if (!S.frageAn) return; S.wunsch = S.wunsch === k ? -1 : k;
  $("fAnt").querySelectorAll(".ant").forEach((b) => b.classList.toggle("wahl", Number(b.dataset.k) === S.wunsch));
}

/* ---------- HUD-Effekte ---------- */
let knallT = 0;
function knall(text, gut) { const el = $("knall"); el.textContent = text; el.classList.toggle("gut", !!gut); el.classList.remove("versteckt"); el.style.animation = "none"; void el.offsetWidth; el.style.animation = ""; knallT = 0.95; }
let bannerT = 0;
function banner(text) { const el = $("banner"); el.textContent = text; el.classList.remove("versteckt"); el.style.animation = "none"; void el.offsetWidth; el.style.animation = ""; bannerT = 2.2; }
function funk(name, text, ohneName) {
  if (S.funkT > 1.2 && !ohneName) return;
  $("funkName").textContent = ohneName ? "Rennfunk" : name + " ruft"; $("funkText").textContent = ohneName ? text : "„" + text + "“";
  const el = $("funk"); el.classList.remove("versteckt"); el.style.animation = "none"; void el.offsetWidth; el.style.animation = ""; S.funkT = 3.4;
}
let hinweisText = "";
function hinweis(t) { if (t === hinweisText) return; hinweisText = t; const el = $("hinweis"); if (t) { el.textContent = t; el.classList.remove("versteckt"); } else el.classList.add("versteckt"); }
let radioIdx = 0, radioTimer = null;
function radioStart() {
  clearTimeout(radioTimer); const liste = shuffle(RADIO.slice());
  const naechste = () => {
    const el = $("radioText"); el.classList.remove("laeuft"); el.textContent = liste[radioIdx++ % liste.length];
    void el.offsetWidth; const breite = el.offsetWidth + el.parentElement.offsetWidth; const dauer = breite / 85;
    el.style.setProperty("--dauer", dauer + "s"); el.classList.add("laeuft"); radioTimer = setTimeout(naechste, dauer * 1000 + 1500);
  };
  naechste();
}
function zuruecksetzen() {
  const f = rahmen(P.s); const d = clamp(P.d, -5, 5);
  P.x = f.x + f.rx * d; P.z = f.z + f.rz * d; P.h = f.hd; P.vx = f.tx * 8; P.vz = f.tz * 8; P.yaw = 0; P.falschT = 0; P.stuckT = 0;
  projiziere(P.x, P.z, P.i); P.i = PROJ.i; P.s = PROJ.s; P.d = PROJ.d; P.prevS = P.s; hinweis("");
}

/* ---------- Schritt ---------- */
function schritt(dt) {
  if (S.zustand === "countdown") {
    S.cd += dt; const stufe = Math.floor((S.cd - 0.5) / 1.0);
    if (stufe !== S.ampelStufe && S.cd >= 0.5) {
      S.ampelStufe = stufe; const li = $("ampel").querySelectorAll("i");
      if (stufe < 3) { li[stufe].classList.add("an"); WELT.ampel[stufe].material.color.set(0xff2b2b); Ton.piep(440, 0.18, "square", 0.25); }
      else { li.forEach((x, k) => x.classList.toggle("an", k === 3)); WELT.ampel.forEach((m, k) => m.material.color.set(k === 3 ? 0x3cff6a : 0x3a0d0d)); Ton.piep(880, 0.4, "square", 0.3);
        S.zustand = "rennen"; S.t = 0; S.rundeStart = 0; banner("LOS!"); setTimeout(() => $("ampel").classList.add("versteckt"), 1200); }
    }
  } else if (S.zustand === "rennen" || S.zustand === "ziel") S.t += dt;
  // Eingabe
  let inp = eingabe();
  const v = Math.hypot(P.vx, P.vz);
  if (TEST.auto || S.zustand === "ziel") {
    const g = S.gates[S.gIdx]; let dZ = 0;
    if (g && g.dist - P.dist < 320) { if (g.autoWahl < 0) g.autoWahl = Math.random() < TEST.quote ? g.richtig : (g.richtig + 1 + Math.floor(Math.random() * 3)) % 4; dZ = SPUR_D[g.autoWahl]; }
    const look = Math.floor(mod(P.s + 8 + v * 0.4, TR.L) / TR.ds) % TR.N;
    const vt = TR.vlim[look] * 1.2;
    inp = { lenk: zielLenkung(dZ, Math.max(10, v * 0.55)), gas: v < vt ? 1 : 0, bremse: v > vt + 6 ? 1 : 0, drift: false, nitro: P.nitro > 0.3 && TR.vlim[look] > 55, manuell: true };
  } else if (!inp.manuell && S.frageAn && S.wunsch >= 0) inp.lenk = zielLenkung(SPUR_D[S.wunsch], Math.max(12, v * 0.7));
  else if (!inp.manuell && S.hilfe) inp.lenk = zielLenkung(clamp(P.d, -6, 6), Math.max(12, v * 0.7));
  if (!inp.manuell) P.lenk = inp.lenk; else P.lenk += clamp(inp.lenk - P.lenk, -7 * dt, 7 * dt);
  inp.lenk = P.lenk; P.gas = inp.gas; P.bremse = inp.bremse;
  physikSpieler(dt, inp);
  // Spurmagnet auf den letzten Metern vor dem Tor, wenn eine Spur gewählt ist
  const gm = S.gates[S.gIdx]; const zielSpur = (TEST.auto || S.zustand === "ziel") && gm ? gm.autoWahl : (S.frageAn ? S.wunsch : -1);
  if (gm && zielSpur >= 0 && S.zustand === "rennen" && !(inp.manuell && !TEST.auto) && gm.dist - P.dist < 90) {
    const sh = clamp(SPUR_D[zielSpur] - P.d, -4.5 * dt, 4.5 * dt); P.x += TR.rx[P.i] * sh; P.z += TR.rz[P.i] * sh; P.d += sh;
  }
  for (const a of KI) kiSchritt(a, dt);
  if (S.zustand !== "countdown") kollisionen(dt);
  if (S.zustand !== "rennen") return;
  // Tore
  const g = S.gates[S.gIdx]; if (g && P.dist >= g.dist) { passiere(g); if (S.zustand !== "rennen") return; }
  // Runden
  const r = Math.floor(P.dist / TR.L);
  if (r > S.runde && P.dist > 0) {
    S.runde = r; const rz = S.t - S.rundeStart; S.rundeStart = S.t; S.rundenZeiten.push(rz); S.bestRunde = Math.min(S.bestRunde, rz);
    if (r >= RUNDEN) { ziel(); return; }
    banner(r === RUNDEN - 1 ? "Letzte Runde!" : "Runde " + (r + 1));
  }
  // falsche Richtung, festgefahren
  const vT = P.vx * TR.tx[P.i] + P.vz * TR.tz[P.i];
  if (vT < -3 || Math.abs(wrapA(P.h - TR.hd[P.i])) > 2.2) P.falschT += dt; else P.falschT = Math.max(0, P.falschT - dt * 2);
  if (v < 1.5 && S.t > 2) P.stuckT += dt; else P.stuckT = 0;
  if (P.falschT > 5 || P.stuckT > 7) zuruecksetzen();
}

function ziel() {
  S.zustand = "ziel"; S.zielZeit = S.t; S.zielT = 0; frageAus(); $("info").classList.add("versteckt");
  S.platz = 1 + KI.filter((a) => a.fertig).length; banner(S.platz === 1 ? "Sieg!" : "Ziel! Platz " + S.platz); Ton.richtig();
}

/* ---------- Visuelles pro Bild ---------- */
function autoStellen(auto, x, z, h, s, lenk, v, dt, nitro, bremse, hop) {
  const f = rahmen(s); auto.g.position.set(x, f.h + 0.02 + hop, z); auto.g.rotation.y = h;
  const f2 = rahmen(s + 3); auto.g.rotation.x = -Math.atan2(f2.h - f.h, 3) * Math.cos(wrapA(h - f.hd));
  for (const r of auto.raeder) r.rotation.x += v * dt / 0.38;
  for (const p of auto.vorne) p.rotation.y = -lenk * 0.45;
  for (const fl of auto.flammen) { fl.visible = nitro; if (nitro) { const k = 0.7 + Math.random() * 0.6; fl.scale.set(k, k, 0.8 + Math.random() * 0.9); } }
  auto.bremsMat.color.set(bremse ? 0xff2020 : 0x5a0d0d);
}
const camZiel = new THREE.Vector3(), camBlick = new THREE.Vector3();
let camYaw = 0, camY = 4, fovAkt = 62, basisFov = 62;
function visuell(dt, ts) {
  const v = Math.hypot(P.vx, P.vz); const dtS = dt * ts;
  autoStellen(spielerAuto, P.x, P.z, P.h, P.s, P.lenk, (P.vx * Math.sin(P.h) + P.vz * Math.cos(P.h)), dtS, P.nitroAn, P.bremse > 0, P.hop);
  spielerAuto.koerper.rotation.z = clamp(P.yaw * v * 0.006, -0.1, 0.1);
  spielerAuto.koerper.rotation.x = clamp((P.bremse ? 0.03 : 0) - (P.gas && v < 40 ? 0.02 : 0), -0.05, 0.05);
  for (const a of KI) {
    const f = rahmen(a.dist); const x = f.x + f.rx * a.d, z = f.z + f.rz * a.d; const h = f.hd - Math.atan2(a.latV, Math.max(5, a.v));
    autoStellen(a.auto, x, z, h, a.dist, -a.latV * 0.1, a.v, dtS, a.boost > 0, a.v > 5 && TR.vlim[(f.i + 10) % TR.N] < a.v - 2, 0);
    const ab = Math.hypot(x - cam.position.x, z - cam.position.z); a.tag.visible = ab > 13 && ab < 170 && S.zustand !== "menue"; a.tag.material.opacity = clamp((170 - ab) / 40, 0, 1) * clamp((ab - 13) / 10, 0, 1);
  }
  // Reifenspuren und Rauch
  const fx = Math.sin(P.h), fz = Math.cos(P.h), rx = -fz, rz = fx; const yS = rahmen(P.s).h + 0.05;
  const spurAn = (P.drift || (P.bremse && v > 18)) && P.hop === 0;
  [-1, 1].forEach((sd, k) => {
    const wx = P.x - fx * 1.35 + rx * sd * 0.95, wz = P.z - fz * 1.35 + rz * sd * 0.95;
    if (spurAn) {
      const l = letzteSpur[k]; if (l && Math.hypot(wx - l[0], wz - l[1]) > 0.7) { spuren.seg(l[0], yS, l[1], wx, yS, wz); letzteSpur[k] = [wx, wz]; } else if (!l) letzteSpur[k] = [wx, wz];
      if (Math.random() < dt * 30) { _C.set(0xe6e6e6); rauch.spawn(wx, yS + 0.3, wz, (Math.random() - 0.5) * 2, 1 + Math.random(), (Math.random() - 0.5) * 2, _C, 0.9); }
    } else letzteSpur[k] = null;
  });
  funken.update(dtS); rauch.update(dtS);
  // Kamera
  const vh = v > 4 ? Math.atan2(P.vx, P.vz) : P.h; const blend = wrapA(vh - P.h) * 0.45;
  const zielYaw = P.h + blend;
  camYaw += wrapA(zielYaw - camYaw) * (1 - Math.exp(-5 * dt));
  const portrait = innerWidth < innerHeight;
  const dist = (portrait ? 10.5 : 8.6) + v * 0.035, hoehe = (portrait ? 4.2 : 3.3) + v * 0.012;
  const pf = rahmen(P.s); camY += (pf.h + hoehe - camY) * (1 - Math.exp(-6 * dt));
  if (S.zustand === "countdown") {
    const t = clamp(S.cd / 3.2, 0, 1), e = t * t * (3 - 2 * t); const yaw = P.h + Math.PI * (1 - e) * 0.9; const dd = lerp(14, dist, e);
    camZiel.set(P.x - Math.sin(yaw) * dd, lerp(7, pf.h + hoehe, e), P.z - Math.cos(yaw) * dd); camYaw = P.h;
  } else camZiel.set(P.x - Math.sin(camYaw) * dist, camY, P.z - Math.cos(camYaw) * dist);
  cam.position.copy(camZiel);
  if (S.shake > 0) { S.shake = Math.max(0, S.shake - dt * 1.8); const k = S.shake * 0.35; cam.position.x += (Math.random() - 0.5) * k; cam.position.y += (Math.random() - 0.5) * k; cam.position.z += (Math.random() - 0.5) * k; }
  if (P.nitroAn) { cam.position.x += (Math.random() - 0.5) * 0.06; cam.position.y += (Math.random() - 0.5) * 0.06; }
  camBlick.set(P.x + Math.sin(camYaw) * 6, pf.h + 1.3 + P.hop * 0.5, P.z + Math.cos(camYaw) * 6); cam.lookAt(camBlick);
  const zielFov = basisFov + clamp(v / V_MAX, 0, 1.3) * 12 + (P.nitroAn ? 8 : 0);
  fovAkt += (zielFov - fovAkt) * (1 - Math.exp(-3 * dt)); if (Math.abs(cam.fov - fovAkt) > 0.05) { cam.fov = fovAkt; cam.updateProjectionMatrix(); }
  windUpdate(dt, v, P.nitroAn);
  welt(dt);
  // Tore anzeigen
  for (const wg of WELT.gates) {
    const naechste = S.gates.find((g) => !g.durch && g.slot === WELT.gates.indexOf(wg));
    wg.gruppe.visible = !!naechste && naechste.dist - P.dist < 1100 || wg.puls > 0;
    if (wg.puls > 0) { wg.puls = Math.max(0, wg.puls - dt * 0.8); const b = wg.boards[wg.pulsK]; if (b) { const k = 1 + Math.sin(wg.puls * 20) * 0.25 * wg.puls; b.scale.set(k, k, 1); } }
    const aktiv = S.frageAn && S.gates[S.gIdx] && S.gates[S.gIdx].slot === WELT.gates.indexOf(wg);
    wg.boards.forEach((b, k) => { if (wg.puls <= 0) { const w = aktiv && S.wunsch === k ? 1.12 + Math.sin(performance.now() / 120) * 0.08 : 1; b.scale.set(w, w, 1); } b.vorhang.material.opacity = aktiv && S.wunsch === k ? 0.35 : 0.16; });
  }
  Ton.motor(v, P.gas, P.nitroAn, ["rennen", "countdown", "ziel"].includes(S.zustand));
  hud(dt, v);
}
function welt(dt) {
  for (const r of WELT.rotoren) r.rotation.z -= dt * 0.9;
  if (WELT.wolken) WELT.wolken.position.x = (WELT.wolken.position.x + dt * 2) % 400;
  WELT.himmel.position.set(cam.position.x, 0, cam.position.z);
  const imTunnel = P.s > TUNNEL[0] + 6 && P.s < TUNNEL[1] - 6 && S.zustand !== "menue";
  WELT.lichterTunnel += ((imTunnel ? 0.38 : 1) - WELT.lichterTunnel) * (1 - Math.exp(-4 * dt));
  sonne.intensity = 2.1 * WELT.lichterTunnel; hemi.intensity = 1.7 * (0.45 + 0.55 * WELT.lichterTunnel);
}

/* ---------- HUD ---------- */
const hudAlt = {};
function setT(id, t) { if (hudAlt[id] !== t) { hudAlt[id] = t; $(id).textContent = t; } }
let kartenT = 0;
function hud(dt, v) {
  if (S.zustand === "rennen") {
    const pl = 1 + KI.filter((a) => a.dist > P.dist).length;
    if (pl < S.platz && S.t > 4 && S.ueberholtCd <= 0) { const o = KI.filter((a) => a.dist < P.dist).sort((a, b) => b.dist - a.dist)[0]; if (o) { funk(o.name, pick(UEBERHOLT)); S.ueberholtCd = 7; } }
    S.platz = pl;
  }
  if (S.ueberholtCd > 0) S.ueberholtCd -= dt;
  setT("hPlatz", String(S.platz)); setT("hRunde", Math.min(RUNDEN, S.runde + 1) + " / " + RUNDEN);
  setT("hZeit", fmtZeit(S.zustand === "ziel" ? S.zielZeit : S.t)); setT("hRZeit", fmtZeit(S.zustand === "ziel" ? (S.rundenZeiten[S.rundenZeiten.length - 1] || 0) : S.t - S.rundeStart));
  setT("hPunkte", String(Math.round(S.punkte + S.driftPunkte))); setT("hKmh", String(Math.round(v * 3.6)));
  $("hNitro").style.width = Math.round(P.nitro * 100) + "%";
  const nb = $("hNitro").parentElement; nb.classList.toggle("an", P.nitroAn); nb.classList.toggle("voll", !P.nitroAn && P.nitro > 0.99);
  $("tNitro").classList.toggle("leer", P.nitro < 0.02);
  setT("hDrift", P.drift && P.driftT > 0.3 ? "Drift +" + Math.round(P.driftT * 22) : "");
  // Frage
  const g = S.gates[S.gIdx];
  if (S.zustand === "rennen" && g) {
    const rest = g.dist - P.dist;
    if (!S.frageAn && (rest < 300 || (rest < 540 && S.infoT <= 0))) frageZeigen(g);
    if (S.frageAn) { setT("fDist", rest > 0 ? "noch " + Math.max(0, Math.round(rest)) + " m" : "jetzt"); $("fDist").classList.toggle("nah", rest < 120); }
  } else if (S.frageAn) frageAus();
  if (S.infoT > 0) { S.infoT -= dt; if (S.infoT <= 0) $("info").classList.add("versteckt"); }
  if (S.funkT > 0) { S.funkT -= dt; if (S.funkT <= 0) $("funk").classList.add("versteckt"); }
  if (knallT > 0) { knallT -= dt; if (knallT <= 0) $("knall").classList.add("versteckt"); }
  if (bannerT > 0) { bannerT -= dt; if (bannerT <= 0) $("banner").classList.add("versteckt"); }
  // Plaudern
  if (S.zustand === "rennen") {
    S.plauderT -= dt;
    if (S.plauderT <= 0) { S.plauderT = 10 + Math.random() * 8; const nah = KI.filter((a) => Math.abs(a.dist - P.dist) < 90); if (nah.length) funk(pick(nah).name, pick(SPRUECHE)); }
    if (P.falschT > 1.2) hinweis("Falsche Richtung! Drehen Sie um oder drücken Sie R");
    else if (P.stuckT > 3) hinweis("Festgefahren? R oder ↺ setzt Sie zurück");
    else hinweis("");
  } else hinweis("");
  if (S.zustand === "ziel") { S.zielT += dt; if (S.zielT > 2.8) zeigeErgebnis(); }
  kartenT -= dt; if (kartenT <= 0 && !istTouch) { kartenT = 0.1; karteZeichnen(); }
}

/* ---------- Minikarte ---------- */
let karteBasis = null, karteF = null;
function karteVorbereiten() {
  let minX = 1e9, maxX = -1e9, minZ = 1e9, maxZ = -1e9;
  for (let i = 0; i < TR.N; i++) { minX = Math.min(minX, TR.px[i]); maxX = Math.max(maxX, TR.px[i]); minZ = Math.min(minZ, TR.pz[i]); maxZ = Math.max(maxZ, TR.pz[i]); }
  const sc = 128 / Math.max(maxX - minX, maxZ - minZ); const ox = 75 - (minX + maxX) / 2 * sc, oz = 75 - (minZ + maxZ) / 2 * sc;
  karteF = (x, z) => [ox + x * sc, oz + z * sc];
  karteBasis = document.createElement("canvas"); karteBasis.width = karteBasis.height = 150; const g = karteBasis.getContext("2d");
  g.lineJoin = "round"; g.beginPath(); for (let i = 0; i <= TR.N; i += 3) { const [x, y] = karteF(TR.px[i % TR.N], TR.pz[i % TR.N]); i ? g.lineTo(x, y) : g.moveTo(x, y); } g.closePath();
  g.strokeStyle = "rgba(255,255,255,.35)"; g.lineWidth = 8; g.stroke(); g.strokeStyle = "#fff"; g.lineWidth = 3; g.stroke();
  const [sx, sy] = karteF(TR.px[0], TR.pz[0]); g.fillStyle = "#111"; g.fillRect(sx - 4, sy - 4, 8, 8); g.fillStyle = "#fff"; g.fillRect(sx - 4, sy - 4, 4, 4); g.fillRect(sx, sy, 4, 4);
}
function karteZeichnen() {
  const cv = $("karte"); const g = cv.getContext("2d"); g.clearRect(0, 0, 150, 150); g.drawImage(karteBasis, 0, 0);
  const nx = S.gates[S.gIdx]; if (nx) { const f = rahmen(nx.dist); const [x, y] = karteF(f.x, f.z); g.fillStyle = "#ffd84d"; g.beginPath(); g.arc(x, y, 5, 0, 7); g.fill(); g.strokeStyle = "#111"; g.lineWidth = 1.5; g.stroke(); }
  for (const a of KI) { const f = rahmen(a.dist); const [x, y] = karteF(f.x + f.rx * a.d, f.z + f.rz * a.d); g.fillStyle = "#" + new THREE.Color(a.farbe).getHexString(); g.beginPath(); g.arc(x, y, 3.6, 0, 7); g.fill(); g.strokeStyle = "#333"; g.lineWidth = 1; g.stroke(); }
  const [x, y] = karteF(P.x, P.z); g.fillStyle = "#0077a6"; g.beginPath(); g.arc(x, y, 5, 0, 7); g.fill(); g.strokeStyle = "#fff"; g.lineWidth = 2; g.stroke();
}

/* ---------- Ergebnis ---------- */
function zeigeErgebnis() {
  S.zustand = "ergebnis"; $("hud").classList.add("aus"); clearTimeout(radioTimer); Ton.motor(0, 0, false, false);
  const L = TR.L;
  const liste = [{ name: "Sie im Nordstern-Flitzer", zeit: S.zielZeit, ich: true }];
  for (const a of KI) liste.push({ name: a.name, zeit: a.fertig ? a.zeit : S.t + (RUNDEN * L - a.dist) / Math.max(20, a.v), geschaetzt: !a.fertig });
  liste.sort((a, b) => a.zeit - b.zeit);
  const platz = liste.findIndex((e) => e.ich) + 1; S.platz = platz;
  const richtig = S.gates.filter((g) => g.ok).length, anz = S.gates.length; const quote = anz ? richtig / anz : 0;
  const bonus = [300, 200, 120, 60, 30, 0][platz - 1] || 0;
  const gesamt = Math.round(S.punkte + S.driftPunkte + bonus);
  let sterne = 1; if (quote >= 0.6 && platz <= 5) sterne = 2; if (quote >= 0.85 && platz <= 3) sterne = 3;
  sterneSpeichern(S.tag, sterne);
  $("rTitel").textContent = platz === 1 ? "Sieg in Norderstedt!" : platz <= 3 ? "Podestplatz " + platz + "!" : "Zieleinlauf auf Platz " + platz;
  $("rSterne").innerHTML = [0, 1, 2].map((k) => `<span class="${k < sterne ? "an" : ""}">★</span>`).join("");
  const w = $("rWerte"); w.innerHTML = "";
  [["Platz", platz + " von " + liste.length], ["Gesamtzeit", fmtZeit(S.zielZeit)], ["Beste Runde", fmtZeit(S.bestRunde)], ["Richtig", richtig + " von " + anz + " (" + Math.round(quote * 100) + " %)"], ["Punkte", String(gesamt)]].forEach(([k, val]) => {
    const d = document.createElement("div"); const s = document.createElement("small"); s.textContent = k; const b = document.createElement("b"); b.textContent = val; d.append(s, b); w.append(d);
  });
  const tb = $("rListe"); tb.innerHTML = "";
  liste.forEach((e, n) => { const tr = document.createElement("tr"); if (e.ich) tr.className = "ich"; [String(n + 1), e.name, (e.geschaetzt ? "etwa " : "") + fmtZeit(e.zeit)].forEach((t) => { const td = document.createElement("td"); td.textContent = t; tr.append(td); }); tb.append(tr); });
  const ol = $("rFragen"); ol.innerHTML = "";
  S.gates.forEach((g) => {
    const li = document.createElement("li"); const q = document.createElement("div"); q.className = "q"; q.textContent = g.q.q;
    const a = document.createElement("div"); a.className = g.ok ? "ok" : "ko";
    a.textContent = !g.durch ? "Nicht erreicht. Richtig ist " + BU[g.richtig] + ", " + g.ant[g.richtig] : g.ok ? "✓ Ihr Tor " + BU[g.spur] + " war richtig, " + g.ant[g.richtig] : "✗ Ihr Tor " + BU[g.spur] + ", " + g.ant[g.spur] + ". Richtig ist " + BU[g.richtig] + ", " + g.ant[g.richtig];
    const e = document.createElement("div"); e.className = "e"; e.textContent = g.q.e || ""; li.append(q, a, e); ol.append(li);
  });
  $("eErgebnis").classList.remove("versteckt"); $("eErgebnis").scrollTop = 0;
  S.ergebnis = { platz, richtig, anz, sterne, punkte: gesamt, zeit: S.zielZeit };
  menueSterne();
}

/* ---------- Menü ---------- */
function lernLinks() { const h = "../../index.html#/tag/" + S.tag; ["lnkLern", "lnkLern2", "lnkLern3"].forEach((id) => { $(id).href = h; }); }
function menueSterne() {
  const n = sterneLesen()[S.tag + "-" + MISSION] || 0;
  $("mSterne").innerHTML = n ? `Bisher erreicht <span class="st">${"★".repeat(n)}${"☆".repeat(3 - n)}</span>` : "Noch kein Rennen an diesem Tag gefahren.";
}
function zeigeMenue() {
  S.zustand = "menue"; $("hud").classList.add("aus"); clearTimeout(radioTimer); Ton.motor(0, 0, false, false);
  ["ePause", "eErgebnis", "eErkl", "eHilfe"].forEach((id) => $(id).classList.add("versteckt")); $("eMenue").classList.remove("versteckt");
  [0, 1, 2, 4, 5].forEach((k, n) => { const st = startPlatz(k); Object.assign(KI[n], { dist: st.dist, d: st.d, v: 0, latV: 0 }); });
  const sp = startPlatz(3); const f = rahmen(sp.dist); Object.assign(P, { x: f.x + f.rx * sp.d, z: f.z + f.rz * sp.d, h: f.hd, vx: 0, vz: 0, s: mod(sp.dist, TR.L), d: sp.d, nitroAn: false, hop: 0 });
  menueSterne(); lernLinks();
}
function pause(an) {
  if (an) { S.vorPause = S.zustand; S.zustand = "pause"; $("ePause").classList.remove("versteckt"); Ton.motor(0, 0, false, false); }
  else if (S.zustand === "pause") { S.zustand = S.vorPause || "rennen"; $("ePause").classList.add("versteckt"); }
}
function menueKamera(dt) {
  S.menuS = mod(S.menuS + dt * 14, TR.L);
  const f = rahmen(S.menuS); const x = f.x - f.rx * 18, z = f.z - f.rz * 18;
  cam.position.set(x, f.h + 16, z); const g = rahmen(S.menuS + 60); cam.lookAt(g.x, g.h + 2, g.z);
  if (Math.abs(cam.fov - basisFov) > 0.1) { cam.fov = basisFov; cam.updateProjectionMatrix(); }
  for (const a of KI) { const fr = rahmen(a.dist); autoStellen(a.auto, fr.x + fr.rx * a.d, fr.z + fr.rz * a.d, fr.hd, a.dist, 0, 0, 0, false, false, 0); a.tag.visible = false; }
  autoStellen(spielerAuto, P.x, P.z, P.h, P.s, 0, 0, 0, false, false, 0);
  wind.material.opacity = 0; welt(dt);
}

function bindeUI() {
  const sel = $("selTag");
  for (const d of SP.days) { const o = document.createElement("option"); o.value = d.nr; o.textContent = `Tag ${d.nr} · ${d.title}${d.date ? " (" + d.date + ")" : ""}`; sel.append(o); }
  const q = new URLSearchParams(location.search); const tq = Number(q.get("tag"));
  S.tag = SP.days.some((d) => d.nr === tq) ? tq : tagNachDatum(); sel.value = S.tag;
  sel.addEventListener("change", () => { S.tag = Number(sel.value); menueSterne(); lernLinks(); });
  const o = optLesen() || { lern: false, hilfe: istTouch, gas: istTouch, neigen: false };
  $("optLern").checked = !!o.lern; $("optHilfe").checked = !!o.hilfe; $("optGas").checked = !!o.gas; $("optNeigen").checked = false;
  $("optNeigen").addEventListener("change", (e) => { if (e.target.checked) neigenAktivieren(); });
  $("btnStart").addEventListener("click", startRennen);
  $("btnHilfe").addEventListener("click", () => { S.hilfeZurueck = "eMenue"; $("eHilfe").classList.remove("versteckt"); });
  $("btnPauseHilfe").addEventListener("click", () => { $("eHilfe").classList.remove("versteckt"); });
  $("btnHilfeZu").addEventListener("click", () => $("eHilfe").classList.add("versteckt"));
  $("btnPause").addEventListener("click", () => { if (["rennen", "countdown"].includes(S.zustand)) pause(true); });
  $("btnWeiterfahren").addEventListener("click", () => pause(false));
  $("btnNeustart").addEventListener("click", startRennen);
  $("btnZumMenue").addEventListener("click", zeigeMenue);
  $("btnNochmal").addEventListener("click", startRennen);
  $("btnErgMenue").addEventListener("click", zeigeMenue);
  $("btnErklWeiter").addEventListener("click", erklWeiter);
  $("btnReset").addEventListener("click", () => { if (S.zustand === "rennen") zuruecksetzen(); });
  $("infoZu").addEventListener("click", () => { S.infoT = 0; $("info").classList.add("versteckt"); });
  let tonAn = true; try { tonAn = localStorage.getItem("pe26_rennen_ton") !== "0"; } catch (e) {}
  Ton.an = tonAn; $("btnTon").classList.toggle("aus", !tonAn);
  $("btnTon").addEventListener("click", () => { Ton.init(); Ton.setAn(!Ton.an); $("btnTon").classList.toggle("aus", !Ton.an); });
  document.addEventListener("visibilitychange", () => { if (document.hidden && ["rennen", "countdown"].includes(S.zustand)) pause(true); });
  addEventListener("pointerdown", () => Ton.init(), { passive: true });
  lernLinks();
}

/* ---------- Größe, Schleife ---------- */
function groesse() {
  const w = innerWidth, h = innerHeight; renderer.setSize(w, h); cam.aspect = w / h;
  basisFov = w < h ? clamp(2 * Math.atan(Math.tan((34 * Math.PI) / 180) / (w / h)) * 180 / Math.PI, 62, 90) : 62;
  fovAkt = basisFov; cam.fov = basisFov; cam.updateProjectionMatrix();
}
let acc = 0, letzt = 0, fpsN = 0, fpsT = 0, fps = 0, fpsTief = 0;
function schleife(jetzt) {
  let dtR = letzt ? (jetzt - letzt) / 1000 : 0.016; letzt = jetzt; dtR = clamp(dtR, 0, 0.1);
  fpsN++; fpsT += dtR; if (fpsT >= 1) { fps = fpsN / fpsT; fpsN = 0; fpsT = 0;
    if (["rennen", "countdown"].includes(S.zustand) && fps < 32) { fpsTief++; if (fpsTief >= 3 && pixelRatio > 1) { pixelRatio = 1; renderer.setPixelRatio(1); groesse(); } } else fpsTief = 0; }
  if (["countdown", "rennen", "ziel"].includes(S.zustand)) {
    let ts = 1;
    if (S.zeitlupe > 0) { S.zeitlupe -= dtR; ts = S.zeitlupe > 0.35 ? 0.4 : 0.4 + (0.35 - S.zeitlupe) / 0.35 * 0.6; }
    if (S.lern && S.frageAn) ts = Math.min(ts, 0.5);
    ts *= TEST.turbo; acc += dtR * ts;
    let n = 0; const maxN = Math.ceil(14 * TEST.turbo);
    while (acc >= DT && n < maxN) { schritt(DT); acc -= DT; n++; if (!["countdown", "rennen", "ziel"].includes(S.zustand)) { acc = 0; break; } }
    if (n >= maxN) acc = 0;
    visuell(dtR, ts / TEST.turbo);
  } else if (S.zustand === "menue") menueKamera(dtR);
  else if (S.zustand === "erklaerung" || S.zustand === "pause") { funken.update(0); }
  renderer.render(scene, cam);
}

/* ---------- Test-Hook ---------- */
window.__test = {
  info: () => ({ zustand: S.zustand, t: +S.t.toFixed(1), runde: S.runde + 1, platz: S.platz, dist: Math.round(P.dist), kmh: Math.round(Math.hypot(P.vx, P.vz) * 3.6),
    tor: S.gIdx, tore: S.gates.length, richtig: S.gates.filter((g) => g.ok).length, frageAn: S.frageAn, fps: Math.round(fps), pr: pixelRatio, baeume: WELT.anzBaeume, calls: renderer.info.render.calls, tris: renderer.info.render.triangles }),
  start: (tag) => { if (tag) { $("selTag").value = tag; S.tag = tag; } startRennen(); },
  auto: (an = true, quote = 1) => { TEST.auto = an; TEST.quote = quote; if (an) S.autoGas = true; },
  turbo: (n) => { TEST.turbo = n; },
  weiter: () => erklWeiter(),
  springe: (dist) => { const f = rahmen(dist); P.x = f.x; P.z = f.z; P.h = f.hd; P.vx = f.tx * 40; P.vz = f.tz * 40; P.dist = dist; projiziere(P.x, P.z, -1); P.i = PROJ.i; P.s = PROJ.s; P.d = PROJ.d; P.prevS = P.s;
    while (S.gates[S.gIdx] && S.gates[S.gIdx].dist < dist) { S.gates[S.gIdx].durch = true; S.gIdx++; } KI.forEach((a, n) => { a.dist = dist + 15 + n * 12; }); },
  ergebnis: () => S.ergebnis,
  setzeWunsch: (k) => setzeWunsch(k),
  spieler: () => ({ s: P.s, d: P.d, dist: P.dist, nitro: P.nitro }),
  tore: () => S.gates.map((g) => ({ nr: g.nr, spur: g.spur, richtig: g.richtig, wahl: g.autoWahl, ok: g.ok, d: g.dPass })),
  ki: () => KI.map((a) => ({ name: a.name, dist: Math.round(a.dist), v: Math.round(a.v), zeit: a.zeit, skill: a.skill })),
};

/* ---------- Start ---------- */
async function init() {
  try { await Promise.race([Promise.all([document.fonts.load("700 40px Kalam"), document.fonts.load("700 40px Inter"), document.fonts.load("400 16px Inter")]), new Promise((r) => setTimeout(r, 1800))]); } catch (e) {}
  try {
    renderer = new THREE.WebGLRenderer({ canvas, antialias: !istTouch, powerPreference: "high-performance" });
    if (!renderer.getContext()) throw new Error("kein WebGL");
  } catch (e) {
    $("laden").classList.add("versteckt"); $("eMenue").classList.add("versteckt"); $("eKeinGL").classList.remove("versteckt"); return;
  }
  renderer.setPixelRatio(pixelRatio);
  baueStrecke(); baueWelt(); baueEffekte(); baueFahrer(); karteVorbereiten(); bindeUI();
  groesse(); addEventListener("resize", groesse);
  zeigeMenue();
  $("laden").classList.add("versteckt");
  renderer.setAnimationLoop(schleife);
  const q = new URLSearchParams(location.search);
  if (q.get("start") === "1" && (!q.get("m") || q.get("m") === MISSION)) startRennen();
}
init();
