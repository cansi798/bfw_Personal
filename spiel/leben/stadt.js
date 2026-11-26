/* Nordstern Leben · Offene Welt „Nordstern City“: Karte, Straßen, Gebäude, Wege und Kollision
   © 2026 Waybuild Akademie, Waybuild UG (haftungsbeschränkt). Alle Rechte vorbehalten. · www.waybuild.de */
import { THREE, IS_TOUCH, Sammler, lam, NACHT, schild, etikett, zeichneSchild, zufall } from "./bau.js";

/* ---------- Karte ---------- */
export const GRENZE = { x0: -76, x1: 156, z0: -62, z1: 74 };
export const STRASSEN = [
  { id: "H1", a: [-74, 19], b: [152, 19] }, { id: "H2", a: [-74, 43], b: [100, 43] }, { id: "H3", a: [-16, 68], b: [70, 68] },
  { id: "V1", a: [-16, -48], b: [-16, 68] }, { id: "V2", a: [32, -10], b: [32, 68] }, { id: "V3", a: [70, -10], b: [70, 68] },
  { id: "V4", a: [104, -14], b: [104, 19] }
];
export const HEIM = { x0: -2.6, x1: 20.6, z0: -1.2, z1: 15.25 };
export const imHeim = (x, z) => x > HEIM.x0 && x < HEIM.x1 && z > HEIM.z0 && z < HEIM.z1;
export const imHaus = (x, z) => x > -0.3 && x < 14.3 && z > -0.3 && z < 10.3;
export const EINFAHRT = { x: 18.7, z: 12.2, rot: 0 };
const P2 = Math.PI / 2;
export const ORTE = {
  haus: { name: "Zuhause", tor: [7, 16.5], park: [18.7, 12.2, 0], bereich: "Wohnviertel" },
  park: { name: "Stadtpark Herzberg", tor: [7, 21.6], park: [10.5, 20, P2], frei: true, freizeit: true },
  see: { name: "Badesee Urlaubsanspruch", tor: [-44, 21.6], park: [-40, 20, P2], frei: true, freizeit: true },
  cafe: { name: "Café Pause", box: [-12, -4, 48, 55], tor: [-8, 45.6], park: [-5, 44, P2], freizeit: true },
  kino: { name: "Kino Abspann", box: [-1, 9, 48, 57], tor: [4, 45.6], park: [7.5, 44, P2], freizeit: true },
  boutique: { name: "Modeboutique", box: [12, 19, 48, 54], tor: [15.5, 45.6], park: [18, 44, P2] },
  ladenlokal: { name: "Ladenlokal", box: [22, 28, 48, 54], tor: [25, 45.6], park: [27.5, 44, P2] },
  bowling: { name: "Bowling und Karaoke Alle Neune", kurz: "Alle Neune", box: [37, 46, 48, 56], tor: [41.5, 45.6], park: [44.5, 44, P2], freizeit: true },
  markt: { name: "Wochenmarkt", tor: [56, 45.6], park: [61, 44, P2], frei: true, freizeit: true },
  rathaus: { name: "Rathaus", box: [-10, 2, 57, 64], tor: [-4, 65.6], park: [-1, 67, -P2] },
  fitness: { name: "Fitnessstudio Kernzeit", kurz: "Fitness Kernzeit", box: [6, 16, 57, 64], tor: [11, 65.6], park: [14, 67, -P2], freizeit: true },
  werk: { name: "Nordstern Fahrradwerke", kurz: "Fahrradwerke", box: [36, 66, 24, 39], tor: [50, 21.6], park: [55, 20, P2] },
  autohaus: { name: "Autohaus Fahrfreude", box: [37, 48, 2, 11], tor: [42.5, 16.4], park: [47, 18, -P2] },
  tierhandlung: { name: "Tierhandlung Fellwechsel", kurz: "Tierhandlung", box: [52, 60, 5, 13], tor: [56, 16.4], park: [60, 18, -P2] },
  logistik: { name: "Nordstern Logistik", box: [76, 92, 1, 13], tor: [84, 16.4], park: [89, 18, -P2] },
  rennstrecke: { name: "Rennstrecke Nordring", kurz: "Nordring", box: [107.5, 115, -9, -3], tor: [106.5, -6], park: [105, -1, Math.PI] },
  aussicht: { name: "Aussichtsturm Weitblick", kurz: "Aussichtsturm", tor: [-20.5, -44], park: [-15, -40, Math.PI], frei: true, freizeit: true }
};
export const FREIZEIT = Object.keys(ORTE).filter((k) => ORTE[k].freizeit);
export const BEREICHE = [
  { name: "Wohnviertel", x0: -74, x1: 30, z0: -14, z1: 17, farbe: "#a9cf8e" },
  { name: "Wald", x0: -74, x1: 60, z0: -62, z1: -14, farbe: "#6f9a5a" },
  { name: "Badesee", x0: -74, x1: -18, z0: 21, z1: 41, farbe: "#9fd07f" },
  { name: "Stadtpark", x0: -14, x1: 30, z0: 21, z1: 41, farbe: "#8fc86c" },
  { name: "Innenstadt", x0: -14, x1: 68, z0: 45, z1: 66, farbe: "#d9d2c4" },
  { name: "Gewerbegebiet", x0: 34, x1: 100, z0: -12, z1: 41, farbe: "#c7c9b9" },
  { name: "Rennstrecke", x0: 60, x1: 156, z0: -62, z1: -12, farbe: "#b5cf98" },
  { name: "Kleingärten", x0: -74, x1: -18, z0: 45, z1: 74, farbe: "#a3cf86" },
  { name: "Felder", x0: 74, x1: 156, z0: 21, z1: 74, farbe: "#d8cf8a" }
];
export function bereichVon(x, z) { for (const b of BEREICHE) if (x >= b.x0 && x <= b.x1 && z >= b.z0 && z <= b.z1) return b.name; return "Nordstern City"; }
export const SEE = { x: -44, z: 31, r: 8 }, TEICH = { x: 4, z: 32, r: 4 };
/* Rennstrecke, Oval mit Geraden entlang x */
export const BAHN = { cx: 110, cz: -36, xa: 88, xb: 132, r: 16, b: 12 };
BAHN.tore = [{ x: 121, z: BAHN.cz + BAHN.r, dir: 1 }, { x: 104, z: BAHN.cz - BAHN.r, dir: -1 }];
export const STERN_ORTE = [[-34, -52], [-62, 9], [-55, 36], [22, 37], [-12, 66.5], [65, 59], [64, 41], [95, 8], [110, -36], [-6, -26], [27, -6], [120, 55]];
export const LIEFERPUNKTE = [[-60, 19], [-16, 0], [-16, 33], [-35, 43], [8, 43], [32, 55], [32, 30], [50, 68], [70, 5], [70, 55], [95, 43], [125, 19], [104, 2], [-16, -30], [20, 19], [60, 19]];
export const TOUR_PUNKTE = [[-4, 66], [4, 45.6], [25, 45.6], [7, 21.6], [42.5, 16.4], [50, 21.6], [-44, 21.6]];
export const AMPELN = [[-16, 19], [32, 19], [32, 43], [70, 19]];

/* ---------- Wegenetz ---------- */
function netz(segs) {
  const kn = []; segs.forEach((s) => (s.pts = []));
  const add = (x, z) => { for (let i = 0; i < kn.length; i++) if (Math.abs(kn[i][0] - x) < 0.05 && Math.abs(kn[i][1] - z) < 0.05) return i; kn.push([x, z]); return kn.length - 1; };
  for (let i = 0; i < segs.length; i++) for (let j = i + 1; j < segs.length; j++) {
    const p = schnitt(segs[i], segs[j]); if (!p) continue; const k = add(p[0], p[1]);
    segs[i].pts.push({ t: p[2], k }); segs[j].pts.push({ t: p[3], k });
  }
  return { segs, kn };
}
function schnitt(s1, s2) {
  const [x1, z1] = s1.a, [x2, z2] = s1.b, [x3, z3] = s2.a, [x4, z4] = s2.b;
  const d = (x1 - x2) * (z3 - z4) - (z1 - z2) * (x3 - x4); if (Math.abs(d) < 1e-9) return null;
  const t = ((x1 - x3) * (z3 - z4) - (z1 - z3) * (x3 - x4)) / d, u = -((x1 - x2) * (z1 - z3) - (z1 - z2) * (x1 - x3)) / d;
  if (t < -1e-6 || t > 1 + 1e-6 || u < -1e-6 || u > 1 + 1e-6) return null;
  return [x1 + t * (x2 - x1), z1 + t * (z2 - z1), t, u];
}
function proj(n, x, z) {
  let best = null;
  n.segs.forEach((s, i) => {
    const ax = s.a[0], az = s.a[1], dx = s.b[0] - ax, dz = s.b[1] - az, l2 = dx * dx + dz * dz;
    const t = Math.max(0, Math.min(1, ((x - ax) * dx + (z - az) * dz) / l2)), px = ax + t * dx, pz = az + t * dz, d = Math.hypot(px - x, pz - z);
    if (!best || d < best.d) best = { i, t, x: px, z: pz, d };
  });
  return best;
}
function wegSuchen(n, von, nach) {
  const a = proj(n, von[0], von[1]), b = proj(n, nach[0], nach[1]); const N = n.kn.length, S = N, Z = N + 1;
  const pos = (k) => (k === S ? [a.x, a.z] : k === Z ? [b.x, b.z] : n.kn[k]);
  const nb = new Map(); const kante = (u, v) => { const w = Math.hypot(pos(u)[0] - pos(v)[0], pos(u)[1] - pos(v)[1]); if (!nb.has(u)) nb.set(u, []); if (!nb.has(v)) nb.set(v, []); nb.get(u).push([v, w]); nb.get(v).push([u, w]); };
  n.segs.forEach((s, i) => {
    const l = s.pts.slice(); if (a.i === i) l.push({ t: a.t, k: S }); if (b.i === i) l.push({ t: b.t, k: Z });
    l.sort((p, q) => p.t - q.t); for (let j = 0; j + 1 < l.length; j++) if (l[j].k !== l[j + 1].k) kante(l[j].k, l[j + 1].k);
  });
  const dist = new Map([[S, 0]]), vor = new Map(), offen = new Set([S]), fertig = new Set();
  while (offen.size) {
    let u = null; offen.forEach((k) => { if (u === null || dist.get(k) < dist.get(u)) u = k; }); offen.delete(u); fertig.add(u); if (u === Z) break;
    (nb.get(u) || []).forEach(([v, w]) => { if (fertig.has(v)) return; const d = dist.get(u) + w; if (!dist.has(v) || d < dist.get(v)) { dist.set(v, d); vor.set(v, u); offen.add(v); } });
  }
  const pfad = [nach.slice()]; if (!dist.has(Z)) return [nach.slice()];
  let k = Z; while (k !== undefined) { pfad.unshift(pos(k).slice()); k = vor.get(k); }
  return pfad;
}
const gehSegs = [];
STRASSEN.forEach((r) => { const h = r.a[1] === r.b[1]; [-2.5, 2.5].forEach((o) => {
  if (h) gehSegs.push({ a: [r.a[0] - 2.5, r.a[1] + o], b: [r.b[0] + 2.5, r.b[1] + o] }); else gehSegs.push({ a: [r.a[0] + o, r.a[1] - 2.5], b: [r.b[0] + o, r.b[1] + 2.5] }); }); });
export const UEBERWEGE = [[7, 19, 1], [-44, 19, 1], [50, 19, 1], [84, 19, 1], [56, 19, 1], [4, 43, 1], [56, 43, 1], [-8, 43, 1], [42, 43, 1], [11, 68, 1]];
UEBERWEGE.forEach(([x, z]) => gehSegs.push({ a: [x, z - 2.5], b: [x, z + 2.5] }));
gehSegs.push({ a: [-20.5, -44], b: [-18.5, -44] });
export const NETZ_GEH = netz(gehSegs);
const autoSegs = STRASSEN.map((r) => ({ a: r.a, b: r.b })); autoSegs.push({ a: [18.7, 12.2], b: [18.7, 19] });
export const NETZ_AUTO = netz(autoSegs);
export const KREUZUNGEN = NETZ_AUTO.kn;

/* Fußweg von a nach b, mit Ausgang über Gartentor oder Einfahrt */
export function routeGeh(von, nach) {
  const wege = [];
  const ausgang = (p) => (p[0] > 13 ? [[18.0, 14.4], [18.0, 16.5]] : [[7, 14.4], [7, 16.5]]);
  let start = von, ziel = nach, vorn = [], hinten = [];
  if (imHeim(von[0], von[1])) { const a = ausgang(von); vorn = a; start = a[1]; }
  if (imHeim(nach[0], nach[1])) { const a = ausgang(nach); hinten = [a[1], a[0]]; ziel = a[1]; }
  if (imHeim(von[0], von[1]) && imHeim(nach[0], nach[1])) return [nach.slice()];
  const mitte = wegSuchen(NETZ_GEH, start, ziel);
  wege.push(...vorn, ...mitte, ...hinten); if (hinten.length || !imHeim(nach[0], nach[1])) wege.push(nach.slice());
  return glaetten(wege);
}
export function routeAuto(von, nach, spur) {
  const p = wegSuchen(NETZ_AUTO, von, nach); p.unshift(von.slice());
  const o = spur == null ? 1.0 : spur, r = [p[0]];
  for (let i = 1; i < p.length - 1; i++) {
    const n1 = normale(p[i - 1], p[i]), n2 = normale(p[i], p[i + 1]); let nx = n1[0] + n2[0], nz = n1[1] + n2[1]; const l = Math.hypot(nx, nz) || 1;
    const k = Math.max(0.5, (nx / l) * n1[0] + (nz / l) * n1[1]); r.push([p[i][0] + nx / l * o / k, p[i][1] + nz / l * o / k]);
  }
  r.push(p[p.length - 1]); return glaetten(r);
}
function normale(a, b) { const dx = b[0] - a[0], dz = b[1] - a[1], l = Math.hypot(dx, dz) || 1; return [-dz / l, dx / l]; }
function glaetten(w) { const r = []; w.forEach((p) => { const q = r[r.length - 1]; if (!q || Math.hypot(q[0] - p[0], q[1] - p[1]) > 0.3) r.push(p); }); return r; }
export const weglaenge = (w, von) => { let l = 0, a = von; w.forEach((p) => { if (a) l += Math.hypot(p[0] - a[0], p[1] - a[1]); a = p; }); return l; };

/* ---------- Kollision (Raster) ---------- */
const RZ = 8, raster = new Map();
export const alleKol = [];
function rkey(i, j) { return i + "," + j; }
export function kolBox(x0, x1, z0, z1, art) { const k = { t: "b", x0, x1, z0, z1, art: art || "bau" }; einsortieren(k, x0, x1, z0, z1); return k; }
export function kolKreis(x, z, r, art) { const k = { t: "k", x, z, r, art: art || "bau" }; einsortieren(k, x - r, x + r, z - r, z + r); return k; }
function einsortieren(k, x0, x1, z0, z1) {
  alleKol.push(k);
  for (let i = Math.floor(x0 / RZ) - 1; i <= Math.floor(x1 / RZ) + 1; i++) for (let j = Math.floor(z0 / RZ) - 1; j <= Math.floor(z1 / RZ) + 1; j++) { const key = rkey(i, j); if (!raster.has(key)) raster.set(key, []); raster.get(key).push(k); }
}
export const KOL_BAUSTELLE = [];
export function kollision(x, z, r, fuss) {
  if (x < GRENZE.x0 + r || x > GRENZE.x1 - r || z < GRENZE.z0 + r || z > GRENZE.z1 - r) return { t: "rand" };
  const l = raster.get(rkey(Math.floor(x / RZ), Math.floor(z / RZ))) || [];
  for (const k of l.concat(KOL_BAUSTELLE)) {
    if (fuss && k.art === "heim") continue; if (!fuss && k.art === "fuss") continue; if (fuss && k.art === "baum" && false) continue;
    if (k.t === "b") { if (x > k.x0 - r && x < k.x1 + r && z > k.z0 - r && z < k.z1 + r) return k; }
    else if (Math.hypot(x - k.x, z - k.z) < k.r + r) return k;
  }
  return null;
}

/* ---------- Bauen ---------- */
const CH = 40, chunks = new Map();
function C(x, z, art) {
  const key = Math.floor((x - GRENZE.x0) / CH) + "," + Math.floor((z - GRENZE.z0) / CH) + "," + art;
  if (!chunks.has(key)) chunks.set(key, { s: new Sammler(), art }); return chunks.get(key).s;
}
const LAUB = [lam("#5f9a4e", { flatShading: true }), lam("#6fae5a", { flatShading: true }), lam("#4f8a3c", { flatShading: true }), lam("#7fb860", { flatShading: true })];
const WOLKE = new THREE.MeshBasicMaterial({ color: "#f4f7f9", transparent: true, opacity: 0.92 });
const NADEL = lam("#3f7446", { flatShading: true }), STAMM = "#7a5233";
const ASPH = "#5d6168", GEHW = "#cfc9bd", LINIE = "#f4f1e8";
function baum(x, z, gr, art) {
  const s = C(x, z, "bau"); gr = gr || 1;
  if (art === 1) { s.cyl(0.13 * gr, 0.18 * gr, 1.0 * gr, STAMM, x, 0.5 * gr, z, 6); s.cyl(0, 1.1 * gr, 1.9 * gr, NADEL, x, 1.7 * gr, z, 7); s.cyl(0, 0.8 * gr, 1.5 * gr, NADEL, x, 2.7 * gr, z, 7); }
  else { s.cyl(0.14 * gr, 0.2 * gr, 1.5 * gr, STAMM, x, 0.75 * gr, z, 6); s.ico(0.95 * gr, LAUB[(Math.abs(x * 7 + z * 3) | 0) % 4], x, 2.1 * gr, z); s.ico(0.6 * gr, LAUB[(Math.abs(x * 3 + z) | 0) % 4], x + 0.4 * gr, 2.7 * gr, z + 0.2 * gr); }
  kolKreis(x, z, 0.45 * gr, "baum");
}
function busch(x, z, c) { C(x, z, "detail").ico(0.5, LAUB[c || 2], x, 0.35, z, 0.7); }
function bank(x, z, ry) {
  const s = C(x, z, "detail"), c = Math.cos(ry), sn = Math.sin(ry);
  const p = (dx, dz) => [x + dx * c + dz * sn, z - dx * sn + dz * c];
  let q = p(0, 0); s.box(1.6, 0.08, 0.45, "#a8794f", q[0], 0.45, q[1], ry); q = p(0, -0.22); s.box(1.6, 0.4, 0.07, "#8f6640", q[0], 0.72, q[1], ry);
  [-0.65, 0.65].forEach((dx) => { q = p(dx, 0); s.box(0.08, 0.45, 0.4, "#3a3f4a", q[0], 0.22, q[1], ry); });
}
function laterne(x, z, ry) {
  const s = C(x, z, "bau"); s.cyl(0.06, 0.08, 3.4, "#3a3f4a", x, 1.7, z, 6);
  const dx = Math.sin(ry) * 0.5, dz = Math.cos(ry) * 0.5; s.box(0.08, 0.08, 1.0, "#3a3f4a", x + dx, 3.35, z + dz, ry);
  s.box(0.32, 0.16, 0.5, NACHT.laterne, x + dx * 1.7, 3.25, z + dz * 1.7, ry);
  C(x, z, "detail").cyl(0.2, 1.3, 3.1, NACHT.kegel, x + dx * 1.7, 1.62, z + dz * 1.7, 10);
}
/* Gebäude mit Fenstern und Tür; front "n" heißt Tür auf der Nordseite (kleines z) */
function haus(s, x0, x1, z0, z1, h, wand, front, o) {
  o = o || {}; const cx = (x0 + x1) / 2, cz = (z0 + z1) / 2, w = x1 - x0, d = z1 - z0;
  s.box(w, h, d, wand, cx, h / 2, cz);
  if (o.dach) s.dach(w + 0.6, o.dachH || 1.8, d + 0.6, o.dach, cx, h, cz);
  else { s.box(w + 0.3, 0.3, d + 0.3, o.rand || "#8a8f96", cx, h + 0.15, cz); }
  const fz = front === "n" ? z0 - 0.03 : z1 + 0.03, etagen = Math.max(1, Math.floor((h - 0.4) / 2.6));
  for (let e = 0; e < etagen; e++) for (let x = x0 + 1.2; x < x1 - 0.8; x += 2.2) {
    if (e === 0 && Math.abs(x - cx) < 1.3 && !o.ohneTuer) continue;
    s.box(1.1, 1.0, 0.06, NACHT.fenster, x + 0.3, 1.5 + e * 2.6, fz);
  }
  for (let e = 0; e < etagen; e++) for (let z = z0 + 1.4; z < z1 - 0.8; z += 2.6) { s.box(0.06, 1.0, 1.1, NACHT.fenster, x0 - 0.03, 1.5 + e * 2.6, z); s.box(0.06, 1.0, 1.1, NACHT.fenster, x1 + 0.03, 1.5 + e * 2.6, z); }
  if (!o.ohneTuer) { s.box(1.3, 2.2, 0.1, o.tuer || "#7b2338", cx, 1.1, fz); s.box(1.9, 0.12, 0.8, "#8a8f96", cx, 2.4, front === "n" ? z0 - 0.4 : z1 + 0.4); }
  return { cx, fz };
}
function schildAn(grp, text, x, y, z, w, h, ry, o) { const m = schild(text, w, h, o); m.position.set(x, y, z); m.rotation.y = ry || 0; grp.add(m); return m; }

export function baueStadt(scene) {
  kolBox(-2.4, 16.6, -0.6, 15.4, "heim");
  [[-0.35, 14.2, -0.35, -0.05], [-0.35, -0.05, -0.35, 10.2], [-2.4, 5.9, 15.1, 15.3], [8.1, 16.3, 15.1, 15.3]].forEach(([a, b, c, d]) => kolBox(a, b, c, d, "fuss"));
  const welt = { orte: {}, chunks: [], etiketten: [], wolken: [], voegel: [], ampeln: [], windraeder: [], extras: {}, durchsicht: [] };
  const merkeDurchsicht = (g) => { g.userData.bb = new THREE.Box3().setFromObject(g).expandByScalar(0.4); welt.durchsicht.push(g); };
  /* Boden der Bereiche */
  BEREICHE.forEach((b) => { if (b.name === "Wohnviertel" || b.name === "Stadtpark") return; const s = C((b.x0 + b.x1) / 2, (b.z0 + b.z1) / 2, "boden"); s.box(b.x1 - b.x0, 0.02, b.z1 - b.z0, b.farbe, (b.x0 + b.x1) / 2, -0.005, (b.z0 + b.z1) / 2); });
  /* Straßen, Gehwege, Markierungen */
  const istKreuz = (x, z) => KREUZUNGEN.some((k) => Math.abs(k[0] - x) < 3.2 && Math.abs(k[1] - z) < 3.2);
  STRASSEN.forEach((r) => {
    const h = r.a[1] === r.b[1], von = h ? r.a[0] : r.a[1], bis = h ? r.b[0] : r.b[1], c = h ? r.a[1] : r.a[0];
    for (let t = von; t < bis; t += 20) { const e = Math.min(bis, t + 20), m = (t + e) / 2, l = e - t + (e === bis ? 2 : 0) + (t === von ? 2 : 0), mm = m + (e === bis ? 1 : 0) - (t === von ? 1 : 0);
      if (h) C(mm, c, "boden").box(l, 0.04, 4, ASPH, mm, 0.0, c); else C(c, mm, "boden").box(4, 0.04, l, ASPH, c, 0.0, mm); }
    for (let t = von + 2; t < bis - 2; t += 4) { if (h ? istKreuz(t, c) : istKreuz(c, t)) continue; if (h) C(t, c, "boden").box(2, 0.012, 0.14, LINIE, t, 0.026, c); else C(c, t, "boden").box(0.14, 0.012, 2, LINIE, c, 0.026, t); }
    [-2.5, 2.5].forEach((o) => {
      const quer = STRASSEN.filter((q) => (q.a[1] === q.b[1]) !== h).map((q) => (h ? q.a[0] : q.a[1])).filter((q) => q > von - 3 && q < bis + 3).sort((a, b) => a - b);
      let a = von - 3; const stuecke = []; quer.forEach((q) => { if (q - 2 > a) stuecke.push([a, q - 2]); a = Math.max(a, q + 2); }); if (bis + 3 > a) stuecke.push([a, bis + 3]);
      stuecke.forEach(([p, q]) => { for (let t = p; t < q; t += 20) { const e = Math.min(q, t + 20), m = (t + e) / 2;
        if (h) C(m, c + o, "boden").box(e - t, 0.1, 1, GEHW, m, 0.02, c + o); else C(c + o, m, "boden").box(1, 0.1, e - t, GEHW, c + o, 0.02, m); } });
    });
    for (let t = von + 6; t < bis - 3; t += 13) { if (h ? istKreuz(t, c) : istKreuz(c, t)) continue; const sd = ((t / 13) | 0) % 2 ? 1 : -1;
      if (h) laterne(t, c + 2.9 * sd, sd > 0 ? Math.PI : 0); else laterne(c + 2.9 * sd, t, sd > 0 ? -P2 : P2); }
  });
  UEBERWEGE.forEach(([x, z]) => { const h = STRASSEN.some((r) => r.a[1] === r.b[1] && r.a[1] === z); for (let i = -1.6; i <= 1.6; i += 0.8) { if (h) C(x, z, "boden").box(0.5, 0.012, 3.4, LINIE, x + i * 0.5 + 0, 0.027, z); else C(x, z, "boden").box(3.4, 0.012, 0.5, LINIE, x, 0.027, z + i * 0.5); } });
  /* Einfahrt und Gartenweg */
  C(18.7, 12, "boden").box(2.6, 0.04, 7.6, "#8a8f96", 18.7, 0.01, 12.8); C(18.7, 16.5, "boden").box(2.6, 0.06, 1.05, "#9aa0a6", 18.7, 0.05, 16.5);
  C(7, 15.5, "boden").box(2.2, 0.04, 1.0, "#d9cdb8", 7, 0.0, 15.6);
  /* Ampeln */
  AMPELN.forEach(([x, z]) => { const s = C(x, z, "bau"); [[-2.8, -2.8], [2.8, 2.8]].forEach(([dx, dz]) => { s.cyl(0.07, 0.07, 3, "#3a3f4a", x + dx, 1.5, z + dz, 6); s.box(0.36, 0.9, 0.3, "#24323a", x + dx, 3.1, z + dz); });
    const l = []; [[-2.8, -2.8], [2.8, 2.8]].forEach(([dx, dz]) => { const r = new THREE.Mesh(new THREE.SphereGeometry(0.11, 8, 6), new THREE.MeshBasicMaterial({ color: "#ff4b3a" })); r.position.set(x + dx, 3.3, z + dz + (dz > 0 ? 0.16 : -0.16)); const g = r.clone(); g.material = new THREE.MeshBasicMaterial({ color: "#3ad16a" }); g.position.y = 2.9; scene.add(r, g); l.push({ r, g, achse: dx < 0 ? "h" : "v" }); });
    welt.ampeln.push({ x, z, l }); });

  /* Wohnviertel */
  const nachbarn = [[-11, -4, 3, 10, "#f4d9c6", "#a2493b"], [-30, -22, 3, 10, "#dfe9ee", "#5a6470"], [-44, -36, 3, 10, "#f6efe4", "#7b2338"], [-58, -50, 3, 10, "#e8e1d6", "#3f6b5a"], [-70, -63, 4, 11, "#f2e2b8", "#8c5a3c"], [22, 28.5, 3, 10, "#e6eef0", "#6d5a8c"]];
  nachbarn.forEach(([x0, x1, z0, z1, w, d]) => { const s = C((x0 + x1) / 2, (z0 + z1) / 2, "bau"); haus(s, x0, x1, z0, z1, 3.0, w, "s", { dach: d, dachH: 2 }); kolBox(x0, x1, z0, z1);
    const gz = z1 + 2.5; for (let x = x0; x <= x1; x += 1.2) C(x, gz, "detail").box(0.1, 0.6, 0.1, "#fffaf0", x, 0.3, gz + 1.8); C((x0 + x1) / 2, gz, "detail").box(x1 - x0, 0.07, 0.05, "#fffaf0", (x0 + x1) / 2, 0.5, gz + 1.8);
    baum(x0 - 1.5, z0 + 1, 0.9); busch(x1 + 0.8, z1 + 1); });
  /* Kleingärten im Südwesten */
  for (let i = 0; i < 6; i++) { const x0 = -70 + (i % 3) * 17, z0 = 49 + Math.floor(i / 3) * 13; const s = C(x0 + 6, z0 + 5, "bau");
    s.box(12, 0.02, 9, "#b7d99a", x0 + 6, 0.005, z0 + 4.5); haus(s, x0 + 1, x0 + 5, z0 + 1, z0 + 4, 2.2, ["#e46b6b", "#6fb7e0", "#f2c14e"][i % 3], "s", { dach: "#7a5233", dachH: 1.1 }); kolBox(x0 + 1, x0 + 5, z0 + 1, z0 + 4);
    for (let r = 0; r < 3; r++) for (let k = 0; k < 4; k++) C(x0 + 7 + k, z0 + 2 + r * 2, "detail").ico(0.32, LAUB[(r + k) % 4], x0 + 7 + k * 1.2, 0.25, z0 + 2 + r * 2, 0.6);
    baum(x0 + 10.5, z0 + 7.5, 0.8); }
  /* Wald mit Nadel und Laubbäumen */
  for (let i = 0; i < (IS_TOUCH ? 170 : 260); i++) { const x = zufall(-73, 58), z = zufall(-60, -16);
    if (Math.abs(x + 16) < 4 || (Math.hypot(x + 24, z + 44) < 7) || (x > 28 && z > -14) || (Math.abs(x - 32) < 4 && z > -12) || (x > 52 && z > -20)) continue; baum(x, z, zufall(0.8, 1.4), Math.random() < 0.55 ? 1 : 0); }
  for (let i = 0; i < 40; i++) { const x = zufall(-73, 30), z = zufall(-14, -2); if (x > -3 && x < 21) continue; baum(x, z, zufall(0.8, 1.2), Math.random() < 0.4 ? 1 : 0); }
  /* Felder mit Windrädern */
  [[78, 24, 30, 15, "#e2d27a"], [112, 24, 36, 15, "#c9b45c"], [78, 47, 30, 22, "#a7c96a"], [112, 47, 36, 22, "#e6d98e"]].forEach(([x, z, w, d, c]) => { C(x + w / 2, z + d / 2, "boden").box(w, 0.03, d, c, x + w / 2, 0.0, z + d / 2); for (let r = 1; r < d; r += 2) C(x + w / 2, z + r, "detail").box(w - 1, 0.02, 0.18, "#b09a4a", x + w / 2, 0.025, z + r); });
  [[130, 64], [142, 52], [140, 30]].forEach(([x, z]) => { C(x, z, "bau").cyl(0.35, 0.6, 14, "#f3f4f2", x, 7, z, 8); kolKreis(x, z, 0.8);
    const rot = new THREE.Group(); rot.position.set(x, 14, z + 0.7); for (let i = 0; i < 3; i++) { const f = new THREE.Mesh(new THREE.BoxGeometry(0.5, 6, 0.12), lam("#ffffff")); f.position.y = 3; const a = new THREE.Group(); a.rotation.z = i * Math.PI * 2 / 3; a.add(f); rot.add(a); } scene.add(rot); welt.windraeder.push(rot); });
  /* Bäume entlang der Straßen */
  for (let x = -70; x < 150; x += 9) { [[x, 14], [x, 24.2]].forEach(([a, b]) => { if (imHeim(a, b) || (a > -48 && a < -38 && b > 20) || (a > 34 && a < 100 && b < 16) || (a > 34 && a < 68 && b > 22) || istKreuz(a, 19) || Math.abs(a - 7) < 3 || (a > 16 && a < 30 && b < 16)) return; if (Math.random() < 0.6) baum(a + zufall(-1, 1), b, 0.75); }); }

  /* Stadtpark Herzberg */
  { const s = C(8, 31, "boden"); s.scheibe(TEICH.r + 0.6, "#d9cdb8", TEICH.x, 0.006, TEICH.z, 28); s.scheibe(TEICH.r, "#5fb3d9", TEICH.x, 0.03, TEICH.z, 28); kolKreis(TEICH.x, TEICH.z, TEICH.r, "wasser");
    s.ring(8.4, 9.6, "#e3d6bd", TEICH.x, 0.012, TEICH.z, 36); s.box(2, 0.02, 3.8, "#e3d6bd", 7, 0.012, 23.8);
    [[4, 22.5, 0], [-6, 31, P2], [14, 31, -P2], [4, 41, Math.PI]].forEach(([x, z]) => { });
    [[-2, 25.5, 0.7], [11, 25.5, -0.7], [-3.5, 38.5, 2.4], [12, 38.5, -2.4]].forEach(([x, z, r]) => bank(x, z, r));
    for (let i = 0; i < 16; i++) { const a = i / 16 * Math.PI * 2, r = 12 + (i % 3); const x = TEICH.x + Math.cos(a) * r * 1.4, z = TEICH.z + Math.sin(a) * r * 0.6; if (x > -13 && x < 29 && z > 23 && z < 40.5 && Math.abs(x - 7) > 2) baum(x, z, zufall(0.9, 1.3)); }
    [[20, 30], [24, 26], [26, 36], [-10, 26], [-11, 36]].forEach(([x, z]) => baum(x, z, 1.1));
    [[0, 28], [9, 36], [-4, 34]].forEach(([x, z], i) => { const d = C(x, z, "detail"); for (let k = 0; k < 6; k++) d.kug(0.12, ["#e46b6b", "#f2c14e", "#b07ad8", "#f39bb0"][(k + i) % 4], x + Math.cos(k) * 0.5, 0.25, z + Math.sin(k) * 0.5, 6); });
    /* Spielplatz */ const d = C(20, 36, "detail"); d.box(5, 0.03, 4, "#f0dcaa", 20, 0.01, 36.5); d.cyl(0.06, 0.06, 2.2, "#c9503b", 18.5, 1.1, 35, 6); d.cyl(0.06, 0.06, 2.2, "#c9503b", 21.5, 1.1, 35, 6); d.box(3.2, 0.1, 0.1, "#c9503b", 20, 2.2, 35); d.box(0.6, 0.06, 0.3, "#2f3b4a", 19.3, 0.6, 35); d.box(0.6, 0.06, 0.3, "#2f3b4a", 20.7, 0.6, 35);
    d.box(1.2, 0.7, 2.4, "#f2c14e", 21, 0.35, 37.6); d.box(1, 0.08, 2.8, "#6fb7e0", 21, 0.7, 39.2, 0); kolBox(18.3, 22.2, 34.6, 38.8, "deko");
    /* Picknickdecke */ d.box(2.2, 0.02, 1.6, "#e46b6b", 16, 0.02, 27.5); d.box(0.6, 0.3, 0.4, "#a8794f", 16.4, 0.15, 27.2); welt.extras.decke = [16, 27.5]; }
  /* Badesee mit Strand, Steg und Kiosk */
  { const s = C(SEE.x, SEE.z, "boden"); s.scheibe(SEE.r + 2.6, "#f0dcaa", SEE.x, 0.008, SEE.z, 36); s.scheibe(SEE.r, "#4fa6d3", SEE.x, 0.035, SEE.z, 36); s.scheibe(SEE.r * 0.55, "#3d8fbf", SEE.x + 1, 0.036, SEE.z + 1, 24); kolKreis(SEE.x, SEE.z, SEE.r - 0.3, "wasser");
    const b = C(SEE.x, SEE.z - 6, "bau"); b.box(1.6, 0.12, 7, "#a8794f", SEE.x, 0.4, SEE.z - 5.6); for (let z = SEE.z - 9; z <= SEE.z - 2.5; z += 1.6) { b.cyl(0.07, 0.07, 0.9, "#7a5233", SEE.x - 0.7, 0.1, z, 6); b.cyl(0.07, 0.07, 0.9, "#7a5233", SEE.x + 0.7, 0.1, z, 6); }
    welt.extras.steg = [SEE.x, SEE.z - 3.0];
    const k = C(-30, 26, "bau"); haus(k, -31.5, -28, 24.5, 27.5, 2.4, "#6fb7e0", "n", { rand: "#f3f4f2" }); kolBox(-31.5, -28, 24.5, 27.5); const kg = new THREE.Group(); scene.add(kg); schildAn(kg, "Kiosk Eiszeit", -29.75, 2.9, 24.4, 3.2, 0.7, Math.PI, { bg: "#f39bb0", fg: "#24323a" });
    [[-50, 27], [-53, 31], [-36, 37], [-37, 26]].forEach(([x, z], i) => { const d = C(x, z, "detail"); d.box(1.0, 0.04, 1.8, ["#e46b6b", "#f2c14e", "#6fb7e0", "#ffffff"][i], x, 0.03, z, 0.5 + i); d.cyl(0.03, 0.03, 2, "#f3f4f2", x + 0.7, 1, z, 4); d.cyl(0.02, 1.1, 0.5, ["#e46b6b", "#f2c14e", "#6fb7e0", "#b07ad8"][i], x + 0.7, 2, z, 8); });
    [[-58, 24], [-60, 36], [-28, 38], [-24, 31], [-64, 30]].forEach(([x, z]) => baum(x, z, 1.2)); }
  /* Rennstrecke Nordring */
  { const { cx, cz, xa, xb, r, b } = BAHN, s = C(cx, cz, "boden");
    s.box(xb - xa, 0.05, b, "#4d5157", cx, 0.01, cz + r); s.box(xb - xa, 0.05, b, "#4d5157", cx, 0.01, cz - r);
    [[xa, P2], [xb, -P2]].forEach(([x, st]) => { const g = new THREE.RingGeometry(r - b / 2, r + b / 2, 24, 1, st, Math.PI); g.rotateX(-Math.PI / 2); s.add(g, "#4d5157", x, 0.035, cz); });
    for (let x = xa; x < xb; x += 2) [cz + r - b / 2, cz + r + b / 2, cz - r - b / 2, cz - r + b / 2].forEach((z, i) => s.box(2, 0.06, 0.35, ((x / 2) | 0) % 2 ? "#d0533c" : "#ffffff", x + 1, 0.02, z));
    for (let i = 0; i < 6; i++) for (let j = 0; j < 2; j++) s.box(1, 0.06, 2, (i + j) % 2 ? "#ffffff" : "#1d1d1d", cx + j * 1 - 0.5, 0.025, cz + r - b / 2 + 1 + i * 2);
    const t = C(cx, cz, "bau"); t.box(26, 0.6, 5, "#9aa5ae", cx, 0.3, cz); for (let i = 0; i < 4; i++) t.box(26, 0.5, 1, ["#0f5c63", "#c9a227", "#7b2338", "#1f3557"][i], cx, 0.85 + i * 0.5, cz - 1.5 + i); kolBox(cx - 13, cx + 13, cz - 2.6, cz + 2.6);
    BAHN.tore.forEach((tor) => { const z0 = tor.z; t.box(0.4, 5, 0.4, "#24323a", tor.x, 2.5, z0 - b / 2 - 0.4); t.box(0.4, 5, 0.4, "#24323a", tor.x, 2.5, z0 + b / 2 + 0.4); t.box(0.5, 0.5, b + 1.2, "#24323a", tor.x, 5, z0);
      const g = new THREE.Group(); scene.add(g); ["A", "B", "C", "D"].forEach((L, i) => { const lat = (i - 1.5) * 3 * tor.dir; schildAn(g, L, tor.x, 4.3, z0 + lat, 2.6, 1.1, tor.dir > 0 ? -P2 : P2, { bg: ["#0f5c63", "#c9a227", "#7b2338", "#1f3557"][i] }).userData.tor = true; });
      for (let i = 1; i < 4; i++) s.box(10, 0.06, 0.18, "#ffffff", tor.x - tor.dir * 6, 0.04, z0 + (i - 2) * 3); });
    /* Rennbüro */ const rb = new THREE.Group(); scene.add(rb); }
  /* Ortsgebäude */
  Object.entries(ORTE).forEach(([id, o]) => { if (id === "haus") return; const s = new Sammler(), grp = new THREE.Group(); grp.userData.ziel = { typ: "ort", id }; baueOrt(id, o, s, grp, welt); s.fertig(grp, { schatten: true }); scene.add(grp); welt.orte[id] = grp; if (o.box) { kolBox(...o.box); merkeDurchsicht(grp); }
    const e = etikett(o.kurz || o.name, { bg: "#24323a", fg: "#fffaf3", rand: "#c9a227", tiefe: false }); const p = o.box ? [(o.box[0] + o.box[1]) / 2, (o.box[2] + o.box[3]) / 2] : o.tor; e.position.set(p[0], 9, p[1]); e.visible = false; scene.add(e); welt.etiketten.push(e); });
  /* weitere Innenstadtbauten */
  [[20, 28, 56, 64, 9.5, "#cfd8dc", "Nordstern Verwaltung"], [37, 46, 58.5, 64, 6, "#e8d5b5"], [50, 58, 60, 64, 5, "#d9806f"], [60, 66, 60, 64, 5, "#c9d9c4"]].forEach(([x0, x1, z0, z1, h, c, n]) => { const s = new Sammler(), g = new THREE.Group(); haus(s, x0, x1, z0, z1, h, c, "s", {}); s.fertig(g, { schatten: true }); scene.add(g); kolBox(x0, x1, z0, z1); if (n) schildAn(g, n, (x0 + x1) / 2, h - 1, z1 + 0.06, 6, 1, 0, { bg: "#1f3557" }); merkeDurchsicht(g); });
  [[-13, 46.5], [30.5, 47], [35.5, 57], [68, 46.5], [-13, 57]].forEach(([x, z]) => baum(x, z, 0.8));
  /* Brunnen in der Innenstadt */ { const s = C(31, 61, "bau"); }
  /* Chunks zusammenfassen */
  chunks.forEach((c) => { const g = c.s.fertig(scene, { schatten: c.art === "bau" || c.art === "detail", empfang: true }); g.userData.art = c.art; const bb = new THREE.Box3().setFromObject(g); g.userData.mitte = bb.getCenter(new THREE.Vector3()); welt.chunks.push(g);
    if (c.art === "boden") g.children.forEach((m) => { m.castShadow = false; }); });
  /* Wolken und Vögel */
  for (let i = 0; i < (IS_TOUCH ? 7 : 12); i++) { const s = new Sammler(); for (let k = 0; k < 4; k++) s.ico(zufall(1.6, 2.6), WOLKE, k * 1.8 - 2.7, zufall(-0.4, 0.5), zufall(-0.8, 0.8), 0.6); const g = s.fertig(scene, { schatten: false }); g.children.forEach((m) => { m.matrixAutoUpdate = true; m.receiveShadow = false; }); g.position.set(zufall(GRENZE.x0, GRENZE.x1), zufall(17, 22), zufall(GRENZE.z0, GRENZE.z1)); welt.wolken.push(g); }
  for (let i = 0; i < (IS_TOUCH ? 5 : 9); i++) { const g = new THREE.Group(); const k = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.16, 0.42), lam("#f3f4f2")); g.add(k); const f = [-1, 1].map((sd) => { const w = new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.03, 0.24), lam("#d6dde2")); w.position.x = sd * 0.4; const p = new THREE.Group(); p.add(w); g.add(p); return p; });
    g.userData = { f, cx: zufall(-60, 140), cz: zufall(-50, 70), r: zufall(6, 14), w: zufall(0.3, 0.6) * (Math.random() < 0.5 ? -1 : 1), y: zufall(10, 15), a: Math.random() * 6 }; scene.add(g); welt.voegel.push(g); }
  return welt;
}

function baueOrt(id, o, s, grp, welt) {
  const b = o.box; const cx = b ? (b[0] + b[1]) / 2 : o.tor[0];
  const tafel = (text, x, y, z, w, h, ry, opt) => schildAn(grp, text, x, y, z, w, h, ry, opt);
  switch (id) {
    case "cafe": { haus(s, b[0], b[1], b[2], b[3], 3.4, "#e8d5b5", "n", { tuer: "#5a3a22" });
      for (let i = 0; i < 8; i++) s.box(1, 0.12, 1.1, i % 2 ? "#ffffff" : "#c9503b", b[0] + 0.5 + i, 2.9, b[2] - 0.5, 0);
      [[-10.5, 46.9], [-5.5, 46.9]].forEach(([x, z]) => { s.cyl(0.45, 0.45, 0.05, "#ffffff", x, 0.75, z, 12); s.cyl(0.05, 0.05, 0.75, "#3a3f4a", x, 0.37, z, 6); s.cyl(0.02, 1.2, 0.5, "#0f5c63", x, 2.3, z, 8); s.cyl(0.02, 0.02, 2.1, "#3a3f4a", x, 1.2, z, 4); });
      tafel("Café Pause", cx, 3.25, b[2] - 0.62, 5, 0.9, Math.PI, { bg: "#5a3a22", serif: true, kursiv: true }); tafel("Café Pause", cx, 2.6, b[3] + 0.07, 4, 0.75, 0, { bg: "#5a3a22", serif: true, kursiv: true }); break; }
    case "kino": { haus(s, b[0], b[1], b[2], b[3], 5.2, "#7b2338", "n", { tuer: "#24323a" }); s.box(9, 1.3, 1.4, "#24323a", cx, 3.6, b[2] - 0.6); s.box(9.2, 0.12, 1.5, NACHT.neon, cx, 4.3, b[2] - 0.6);
      tafel("KINO ABSPANN", cx, 3.6, b[2] - 1.32, 8.4, 1.1, Math.PI, { bg: "#24323a", fg: "#f2c14e" }); tafel("KINO ABSPANN", cx, 4.2, b[3] + 0.07, 7, 0.9, 0, { bg: "#24323a", fg: "#f2c14e" });
      [b[0] + 1.6, b[1] - 1.6].forEach((x, i) => tafel(i ? "Die Probezeit\nTeil 2" : "Excel\nDas Musical", x, 1.5, b[2] - 0.06, 1.6, 2.1, Math.PI, { bg: i ? "#1f3557" : "#0f5c63", ph: 680, gr: 70 })); break; }
    case "boutique": { haus(s, b[0], b[1], b[2], b[3], 3.6, "#f3d6c6", "n", { tuer: "#b07ad8" }); s.box(5.5, 1.8, 0.08, "#bfe8ff", cx, 1.4, b[2] - 0.05);
      tafel("Modeboutique", cx, 3.1, b[2] - 0.07, 5, 0.8, Math.PI, { bg: "#b07ad8", serif: true, kursiv: true }); tafel("Modeboutique", cx, 2.8, b[3] + 0.07, 4.6, 0.75, 0, { bg: "#b07ad8", serif: true, kursiv: true }); break; }
    case "ladenlokal": { haus(s, b[0], b[1], b[2], b[3], 3.4, "#efe3cf", "n", { tuer: "#8a8f96" }); s.box(4.4, 1.7, 0.08, "#d8e4ea", cx, 1.4, b[2] - 0.05);
      welt.ladenSchilder = [tafel("Zu vermieten", cx, 2.95, b[2] - 0.08, 4.6, 0.8, Math.PI, { bg: "#8a8f96" }), tafel("Zu vermieten", cx, 2.7, b[3] + 0.08, 4.6, 0.8, 0, { bg: "#8a8f96" })]; break; }
    case "bowling": { haus(s, b[0], b[1], b[2], b[3], 4, "#1f3557", "n", { tuer: "#c9a227" }); s.cyl(0.5, 0.8, 2.2, "#ffffff", cx, 5.2, (b[2] + b[3]) / 2, 12); s.kug(0.55, "#ffffff", cx, 6.6, (b[2] + b[3]) / 2, 12); s.cyl(0.62, 0.62, 0.25, "#d0533c", cx, 5.8, (b[2] + b[3]) / 2, 12);
      tafel("Alle Neune\nBowling und Karaoke", cx, 3.1, b[2] - 0.07, 6.4, 1.3, Math.PI, { bg: "#c9a227", fg: "#1f3557" }); tafel("Alle Neune\nBowling und Karaoke", cx, 2.9, b[3] + 0.07, 6, 1.2, 0, { bg: "#c9a227", fg: "#1f3557" }); break; }
    case "markt": { const st = [[52, 50.5, "#c9503b"], [57.5, 50.5, "#0f5c63"], [63, 50.5, "#c9a227"], [54.5, 56, "#6f8f7b"], [60.5, 56, "#7b2338"]];
      st.forEach(([x, z, c]) => { s.box(3.6, 0.9, 1.6, "#a8794f", x, 0.45, z); [-1.7, 1.7].forEach((dx) => s.cyl(0.05, 0.05, 2.4, "#7a5233", x + dx, 1.2, z - 0.7, 4)); for (let i = 0; i < 4; i++) s.box(0.9, 0.08, 2.2, i % 2 ? "#ffffff" : c, x - 1.35 + i * 0.9, 2.4, z - 0.2);
        for (let i = 0; i < 5; i++) s.kug(0.15, ["#e46b6b", "#f2c14e", "#6fae5a", "#f28c28", "#b07ad8"][i], x - 1.2 + i * 0.6, 1.02, z + 0.2, 6); kolBox(x - 1.9, x + 1.9, z - 0.9, z + 0.9); });
      s.box(16, 0.02, 12, "#e3d6bd", 58, 0.01, 54); tafel("Wochenmarkt", 56, 3.2, 47.4, 4.6, 0.8, Math.PI, { bg: "#6f8f7b" }); s.cyl(0.08, 0.08, 3.2, "#7a5233", 53.6, 1.6, 47.4, 6); s.cyl(0.08, 0.08, 3.2, "#7a5233", 58.4, 1.6, 47.4, 6); break; }
    case "rathaus": { haus(s, b[0], b[1], b[2], b[3], 5.5, "#f6efe4", "s", { rand: "#c9a227", tuer: "#5a3a22" }); for (let x = b[0] + 1; x < b[1]; x += 2.4) s.cyl(0.25, 0.25, 5.2, "#ffffff", x, 2.6, b[3] + 0.5, 10);
      s.box(3, 3.5, 3, "#f6efe4", cx, 7.2, (b[2] + b[3]) / 2); s.dach(3.4, 1.8, 3.4, "#0f5c63", cx, 8.95, (b[2] + b[3]) / 2); s.cyl(0.9, 0.9, 0.1, "#ffffff", cx, 7.5, b[2] + 2.9 + 1.6, 16, P2);
      tafel("Rathaus", cx, 4.9, b[3] + 0.8, 4, 0.8, 0, { bg: "#0f5c63", serif: true, kursiv: true }); s.cyl(0.35, 0.35, 2.4, "#c9a227", b[1] - 0.8, 1.2, b[3] + 1.0, 10); tafel("Lern-Tour", b[1] - 0.8, 2.7, b[3] + 1.4, 1.6, 0.5, 0, { bg: "#c9a227", fg: "#24323a" }); break; }
    case "fitness": { haus(s, b[0], b[1], b[2], b[3], 4, "#0f5c63", "s", { tuer: "#f2c14e" }); const zz = (b[2] + b[3]) / 2; s.cyl(0.15, 0.15, 5, "#3a3f4a", cx, 4.9, zz, 8, 0, P2); [-2.3, 2.3].forEach((dx) => s.cyl(0.9, 0.9, 0.5, "#24323a", cx + dx, 4.9, zz, 14, 0, P2));
      tafel("Fitness Kernzeit", cx, 3.2, b[3] + 0.07, 6, 0.9, 0, { bg: "#f2c14e", fg: "#0f5c63" }); break; }
    case "werk": { const [x0, x1, z0, z1] = b; s.box(x1 - x0, 6, z1 - z0, "#c9b79b", cx, 3, (z0 + z1) / 2); for (let z = z0 + 2; z < z1; z += 4) s.dach(x1 - x0, 1.6, 4, "#8a8f96", cx, 6, z);
      s.box(10, 4, 2, "#e8e1d6", cx - 6, 2, z0 - 0.9); for (let x = cx - 10; x < cx - 1.5; x += 2) s.box(1.1, 1, 0.06, NACHT.fenster, x, 2.6, z0 - 1.93); s.box(5, 4.5, 0.12, "#5d6168", cx + 6, 2.25, z0 - 0.03);
      s.cyl(0.8, 1, 10, "#a2493b", x1 - 3, 5, z1 - 3, 10); const rad = new THREE.TorusGeometry(1.6, 0.18, 6, 20); s.add(rad, "#24323a", cx + 13, 4, z0 - 0.15); s.add(new THREE.TorusGeometry(1.6, 0.18, 6, 20), "#24323a", cx + 9, 4, z0 - 0.15); s.box(4.4, 0.18, 0.18, "#c9503b", cx + 11, 4.4, z0 - 0.15);
      for (let i = 0; i < 6; i++) { s.add(new THREE.TorusGeometry(0.35, 0.05, 4, 10), "#3a3f4a", cx - 2 + i * 1.1, 0.4, z0 - 2.5, P2); }
      tafel("Nordstern Fahrradwerke", cx - 6, 4.6, z0 - 1.93, 9.5, 1.1, Math.PI, { bg: "#0f5c63", serif: true, kursiv: true }); tafel("Nordstern Fahrradwerke", cx, 4.4, z1 + 0.07, 14, 1.6, 0, { bg: "#0f5c63", serif: true, kursiv: true }); tafel("Fahrradwerke", x1 + 0.07, 4.4, (z0 + z1) / 2, 8, 1.2, Math.PI / 2, { bg: "#0f5c63", serif: true, kursiv: true }); break; }
    case "autohaus": { const [x0, x1, z0, z1] = b; const glas = lam("#bfe8ff", { transparent: true, opacity: 0.5 }); s.box(x1 - x0, 0.2, z1 - z0, "#e8e1d6", cx, 0.1, (z0 + z1) / 2); s.box(x1 - x0, 4, 0.1, glas, cx, 2, z1); s.box(0.1, 4, z1 - z0, glas, x0, 2, (z0 + z1) / 2); s.box(0.1, 4, z1 - z0, glas, x1, 2, (z0 + z1) / 2); s.box(x1 - x0, 4, 0.2, "#f3f4f2", cx, 2, z0);
      s.box(x1 - x0 + 0.6, 0.4, z1 - z0 + 0.6, "#c9503b", cx, 4.2, (z0 + z1) / 2); [[x0 + 0.5], [x1 - 0.5]].forEach(([x]) => { s.cyl(0.05, 0.05, 6, "#cccccc", x, 3, z1 + 3, 5); s.box(1.2, 0.8, 0.04, "#c9503b", x + 0.6, 5.4, z1 + 3); });
      s.box(x1 - x0, 0.03, 4, "#d6d2cb", cx, 0.02, z1 + 2); tafel("Autohaus Fahrfreude", cx, 4.2, z1 + 0.32, 8, 0.4, 0, { bg: "#c9503b" }); break; }
    case "tierhandlung": { haus(s, b[0], b[1], b[2], b[3], 3.4, "#f2c14e", "s", { tuer: "#6f8f7b" }); for (let i = 0; i < 8; i++) s.box(1, 0.12, 1.1, i % 2 ? "#ffffff" : "#6f8f7b", b[0] + 0.5 + i, 2.9, b[3] + 0.5);
      tafel("Tierhandlung Fellwechsel", cx, 3.25, b[3] + 0.62, 6.5, 0.8, 0, { bg: "#6f8f7b" }); break; }
    case "logistik": { const [x0, x1, z0, z1] = b; s.box(x1 - x0, 5.5, z1 - z0, "#9aa5ae", cx, 2.75, (z0 + z1) / 2); s.box(x1 - x0 + 0.3, 0.3, z1 - z0 + 0.3, "#5d6168", cx, 5.6, (z0 + z1) / 2);
      for (let i = 0; i < 4; i++) { s.box(3, 3.4, 0.1, "#cfd8dc", x0 + 2.5 + i * 3.8, 1.7, z1 + 0.05); for (let k = 0; k < 6; k++) s.box(3, 0.04, 0.12, "#8a8f96", x0 + 2.5 + i * 3.8, 0.5 + k * 0.5, z1 + 0.1); }
      for (let i = 0; i < 5; i++) s.box(1, 0.8, 1, "#c8a06a", x1 + 1 + (i % 2) * 1.1, 0.4 + Math.floor(i / 2) * 0.8, z0 + 3 + (i % 3)); kolBox(x1 + 0.4, x1 + 2.7, z0 + 2.4, z0 + 6);
      tafel("Nordstern Logistik", cx, 4.5, z1 + 0.1, 8, 1, 0, { bg: "#24323a", fg: "#f2c14e" }); break; }
    case "rennstrecke": { haus(s, b[0], b[1], b[2], b[3], 3, "#f3f4f2", "n", { rand: "#24323a", tuer: "#24323a" });
      for (let i = 0; i < 8; i++) for (let j = 0; j < 2; j++) s.box(0.9, 0.45, 0.06, (i + j) % 2 ? "#1d1d1d" : "#ffffff", b[0] + 0.3 + i * 0.95, 3.4 + j * 0.45, b[2] - 0.05);
      tafel("Rennstrecke Nordring", cx, 2.6, b[2] - 0.08, 6, 0.6, Math.PI, { bg: "#d0533c" }); tafel("Rennbüro Nordring", cx, 2.4, b[3] + 0.08, 6, 0.7, 0, { bg: "#d0533c" }); break; }
    case "aussicht": { const x = -24, z = -44; [[-1.5, -1.5], [1.5, -1.5], [-1.5, 1.5], [1.5, 1.5]].forEach(([dx, dz]) => s.cyl(0.18, 0.25, 10, "#7a5233", x + dx, 5, z + dz, 6)); for (let y = 2; y < 10; y += 2.5) s.box(3.4, 0.15, 0.15, "#7a5233", x, y, z - 1.5);
      s.box(4.2, 0.25, 4.2, "#a8794f", x, 10, z); s.dach(4.6, 1.6, 4.6, "#7b2338", x, 11.6, z); [[-2, 0], [2, 0], [0, -2], [0, 2]].forEach(([dx, dz]) => s.box(dx ? 0.1 : 4.2, 0.9, dz ? 0.1 : 4.2, "#7a5233", x + dx, 10.5, z + dz));
      for (let i = 0; i < 10; i++) s.box(1, 0.1, 0.5, "#a8794f", x + 2.2, 0.5 + i, z + 1.8 - i * 0.38);
      kolKreis(x, z, 2.4); tafel("Aussichtsturm Weitblick", -19, 2.4, -46.5, 4, 0.6, 0, { bg: "#7a5233" }); s.cyl(0.06, 0.06, 2.4, "#7a5233", -19, 1.2, -46.6, 5); break; }
    case "park": { tafel("Stadtpark Herzberg", 7, 2.7, 22.6, 4.4, 0.7, 0, { bg: "#4f8a3c" }); s.box(4.6, 0.12, 0.12, "#3a3f4a", 7, 3.1, 22.6); [4.8, 9.2].forEach((x) => s.cyl(0.07, 0.07, 3.2, "#3a3f4a", x, 1.6, 22.6, 6)); break; }
    case "see": { tafel("Badesee Urlaubsanspruch", -44, 2.5, 22.6, 4.6, 0.7, 0, { bg: "#3d8fbf" }); [-46.4, -41.6].forEach((x) => s.cyl(0.07, 0.07, 3, "#3a3f4a", x, 1.5, 22.6, 6)); break; }
  }
}

/* Laufende Weltdetails: Wolken, Vögel, Windräder, Ampeln, Nachtlicht, Etiketten */
export function ampelPhase(t) { const p = t % 16; return p < 7 ? "h" : p < 8 ? "gelb" : p < 15 ? "v" : "gelb"; }
export function stadtUpdate(welt, dt, t, o) {
  welt.wolken.forEach((w) => { w.visible = !!o.himmel; w.position.x += dt * 0.7; if (w.position.x > GRENZE.x1 + 20) w.position.x = GRENZE.x0 - 20; });
  welt.voegel.forEach((v) => { const u = v.userData; u.a += dt * u.w; v.position.set(u.cx + Math.cos(u.a) * u.r, u.y + Math.sin(u.a * 3) * 0.3, u.cz + Math.sin(u.a) * u.r); v.rotation.y = -u.a + (u.w > 0 ? 0 : Math.PI); u.f.forEach((f, i) => (f.rotation.z = Math.sin(t * 9 + u.a) * 0.6 * (i ? -1 : 1))); v.visible = !o.regen; });
  welt.windraeder.forEach((w) => (w.rotation.z += dt * 0.9));
  const ph = ampelPhase(t);
  welt.ampeln.forEach((a) => a.l.forEach((l) => { const gruen = ph === l.achse; l.g.visible = gruen; l.r.visible = !gruen; }));
  const dunkel = o.hell < 0.45;
  if (welt._dunkel !== dunkel) { welt._dunkel = dunkel; NACHT.fenster.emissive.set(dunkel ? "#f5c86a" : "#000000"); NACHT.laterne.emissive.set(dunkel ? "#ffe9a6" : "#000000"); NACHT.kegel.visible = dunkel; NACHT.neon.emissive.set(dunkel ? "#f39bb0" : "#000000"); }
  const kartenblick = o.zoom < 0.55 && !o.faehrt;
  welt.etiketten.forEach((e) => { e.visible = kartenblick; if (kartenblick) { const s = 0.62 / o.zoom; e.scale.set(s * 4, s, 1); } });
  welt.chunks.forEach((c) => { if (c.userData.art === "detail") c.visible = o.zoom > 0.42 || o.faehrt; });
}
export function ladenSchildSetzen(welt, laden) {
  const l = welt.ladenSchilder; if (!l) return; const key = laden ? (laden.typ || "") + "|" + (laden.name || "") : "";
  if (welt.ladenKey === key) return; welt.ladenKey = key;
  let farbe = "#8a8f96", text = "Zu vermieten";
  if (laden) { text = String(laden.name || "Mein Laden").slice(0, 28); const P = ["#0f5c63", "#7b2338", "#c9a227", "#1f3557", "#6f8f7b", "#b07ad8", "#c9503b"]; let h = 0; String(laden.typ || "").split("").forEach((c) => (h = (h * 31 + c.charCodeAt(0)) >>> 0)); farbe = P[h % P.length]; }
  l.forEach((m) => { zeichneSchild(m.userData.canvas, text, { bg: farbe, rad: 18 }); m.userData.tex.needsUpdate = true; });
}
