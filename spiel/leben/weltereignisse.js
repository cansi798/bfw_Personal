/* Nordstern Leben · Was zwischendurch in der Welt passiert (sichtbar draußen) und Wetter
   © 2026 Waybuild Akademie, Waybuild UG (haftungsbeschränkt). Alle Rechte vorbehalten. · www.waybuild.de */
import { THREE, K, IS_TOUCH, lam, schild, etikett, zufall } from "./bau.js";
import { baueFigur, bewegeFigur } from "./welt.js";
import { baueAuto } from "./fahrzeuge.js";
import { baueTier, animiereTier } from "./tiere.js";
import { zufallsLook } from "./leute.js";
import { KOL_BAUSTELLE, routeGeh, ORTE } from "./stadt.js";

export const EREIG = { aktiv: {}, regen: 0, gewitter: false, baustelle: false, hindernisse: [], letzteStunde: -1 };
const wochenende = () => { const t = K.ctx.lebensTag() % 7; return t === 6 || t === 0; };
const DEF = {
  musiker: { name: "Straßenmusikerin Jule", std: [10, 20], p: 0.35, dauer: 240 },
  flohmarkt: { name: "Flohmarkt im Park", std: [9, 16], p: 0.6, dauer: 360, bed: wochenende },
  eiswagen: { name: "Eiswagen Frostbeule", std: [12, 19], p: 0.4, dauer: 180, bed: () => !EREIG.regen },
  baustelle: { name: "Baustelle Marktstraße", std: [7, 18], p: 0.12, dauer: 600 },
  ballon: { name: "Heißluftballon", std: [8, 18], p: 0.15, dauer: 200, bed: () => !EREIG.regen },
  firmenlauf: { name: "Firmenlauf Nordstern", std: [16, 19], p: 0.18, dauer: 90, bed: () => !EREIG.regen },
  fotograf: { name: "Fotograf Herr Blende", std: [10, 18], p: 0.25, dauer: 180 },
  panne: { name: "Liegengebliebenes Auto", std: [7, 21], p: 0.18, dauer: 150 },
  katze: { name: "Katze im Baum", std: [9, 19], p: 0.15, dauer: 180 },
  roboter: { name: "Lieferroboter Paketpaul", std: [8, 20], p: 0.3, dauer: 240 },
  feuerwerk: { name: "Feuerwerk über dem Park", std: [21, 23.5], p: 1, dauer: 70, bed: () => K.ctx.lebensTag() % 7 === 6 }
};
let regenMesh = null, blitzT = 0, basis = { hemi: null, bg: new THREE.Color(), gesetzt: null, gesetztBg: new THREE.Color() };
function figurNeu(look, x, z, ry) { const f = baueFigur(look); f.g.position.set(x, 0, z); f.g.rotation.y = ry || 0; return f; }
function gruppe(id) { const g = new THREE.Group(); g.userData.ziel = { typ: "ereignis", id }; K.scene.add(g); return g; }
const BAU = {
  musiker(e) { const g = gruppe("musiker"); const f = figurNeu(Object.assign(zufallsLook("frau"), { koerper: "frau", haar: "afro", haarfarbe: "#2b1b12", oben: "#b07ad8" }), 33.6, 46.6, Math.PI); g.add(f.g);
    const git = new THREE.Mesh(new THREE.BoxGeometry(0.35, 0.5, 0.1), lam("#a8794f")); git.position.set(0, 1.0, 0.25); f.inner.add(git); const hut = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.18, 0.12, 10), lam("#24323a")); hut.position.set(33.6, 0.06, 45.9); g.add(hut); e.f = f; e.g = g; },
  flohmarkt(e) { const g = gruppe("flohmarkt"); for (let i = 0; i < 6; i++) { const x = 15 + (i % 3) * 4, z = 31 + Math.floor(i / 3) * 4; const d = new THREE.Mesh(new THREE.BoxGeometry(2.2, 0.03, 1.6), lam(["#e46b6b", "#6fb7e0", "#f2c14e", "#6fae5a", "#b07ad8", "#f39bb0"][i])); d.position.set(x, 0.03, z); g.add(d);
      for (let k = 0; k < 4; k++) { const it = new THREE.Mesh(k % 2 ? new THREE.BoxGeometry(0.3, 0.25, 0.3) : new THREE.CylinderGeometry(0.12, 0.12, 0.3, 8), lam(["#c9a227", "#7b2338", "#1f3557", "#ffffff"][k])); it.position.set(x - 0.7 + k * 0.45, 0.17, z); g.add(it); }
      const f = figurNeu(zufallsLook(i % 2 ? "senior" : "frau"), x, z - 1.3, 0); g.add(f.g); }
    const sh = schild("Flohmarkt", 2.4, 0.6, { bg: "#c9503b" }); sh.position.set(19, 1.6, 29.3); g.add(sh); e.g = g; },
  eiswagen(e) { const g = gruppe("eiswagen"); const a = baueAuto("van", "#f39bb0"); a.position.set(13.5, 0, 22.6); a.rotation.y = Math.PI / 2; g.add(a); const k = new THREE.Mesh(new THREE.ConeGeometry(0.35, 0.8, 10), lam("#f2c14e")); k.rotation.x = Math.PI; k.position.set(13.5, 2.6, 22.6); g.add(k); const ku = new THREE.Mesh(new THREE.SphereGeometry(0.38, 10, 8), lam("#f6efe4")); ku.position.set(13.5, 3.1, 22.6); g.add(ku);
    const sh = schild("Eis Frostbeule", 2.4, 0.5, { bg: "#6fb7e0" }); sh.position.set(13.5, 1.9, 21.6); sh.rotation.y = Math.PI; g.add(sh); e.g = g; },
  baustelle(e) { const g = gruppe("baustelle"); for (let x = 44; x <= 58; x += 2) { const k = new THREE.Mesh(new THREE.ConeGeometry(0.3, 0.8, 8), lam("#f28c28")); k.position.set(x, 0.4, 41.2); g.add(k); const k2 = k.clone(); k2.position.z = 44.8; g.add(k2); }
    [44, 58].forEach((x) => { const b = new THREE.Mesh(new THREE.BoxGeometry(0.3, 1, 4), lam("#d0533c")); b.position.set(x, 0.5, 43); g.add(b); }); const gr = new THREE.Mesh(new THREE.BoxGeometry(3, 0.8, 2), lam("#c8a06a")); gr.position.set(51, 0.4, 43); g.add(gr);
    const f = figurNeu(Object.assign(zufallsLook("mann"), { oben: "#f28c28" }), 49, 42.2, 0); const hm = new THREE.Mesh(new THREE.SphereGeometry(0.26, 10, 6, 0, Math.PI * 2, 0, Math.PI / 2), lam("#f2c14e")); hm.position.y = 0.06; f.kopf.add(hm); g.add(f.g); e.f = f;
    const sh = schild("Umleitung über die Lindenallee", 3.6, 0.7, { bg: "#f2c14e", fg: "#24323a" }); sh.position.set(36.5, 1.8, 40.3); sh.rotation.y = Math.PI; g.add(sh);
    e.kol = { t: "b", x0: 43.5, x1: 58.5, z0: 41, z1: 45, art: "bau" }; KOL_BAUSTELLE.push(e.kol); EREIG.baustelle = true; e.g = g; },
  ballon(e) { const g = gruppe("ballon"); const b = new THREE.Mesh(new THREE.SphereGeometry(3, 14, 12), lam("#e46b6b", { flatShading: true })); b.scale.y = 1.2; b.position.y = 4; g.add(b); const s = new THREE.Mesh(new THREE.CylinderGeometry(3.05, 1.2, 0.8, 14), lam("#f2c14e")); s.position.y = 2.2; g.add(s);
    const k = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.9, 1.2), lam("#a8794f")); k.position.y = -0.6; g.add(k); const sh = schild("Weiterbildung\nhebt ab", 3, 1.4, { bg: "#1f3557", ph: 240 }); sh.position.set(0, 4, 3.4); g.add(sh); g.position.set(-80, 24, zufall(-10, 50)); e.g = g; },
  firmenlauf(e) { const g = gruppe("firmenlauf"); e.laeufer = []; for (let i = 0; i < (IS_TOUCH ? 5 : 8); i++) { const f = figurNeu(Object.assign(zufallsLook(i % 2 ? "frau" : "mann"), { oben: i % 3 ? "#0f5c63" : "#f2c14e" }), -12 - i * 1.6, 21.6 + (i % 2) * 0.5, Math.PI / 2); g.add(f.g); e.laeufer.push({ f, x: -12 - i * 1.6 }); }
    const sh = schild("Firmenlauf Nordstern", 4.4, 0.8, { bg: "#c9a227", fg: "#24323a" }); sh.position.set(7, 3, 22.4); g.add(sh); e.g = g; },
  fotograf(e) { const g = gruppe("fotograf"); const f = figurNeu(Object.assign(zufallsLook("mann"), { bart: "voll" }), 9.4, 27.4, -2.4); const kam = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.2, 0.2), lam("#24323a")); kam.position.set(0, 1.72, 0.32); f.inner.add(kam); f.armL.rotation.x = -1.3; f.armR.rotation.x = -1.3; g.add(f.g);
    const st = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 1.4, 4), lam("#3a3f4a")); st.position.set(9.8, 0.7, 27.9); g.add(st); e.f = f; e.g = g; },
  panne(e) { const g = gruppe("panne"); const a = baueAuto("mini", "#c9d1d8"); a.position.set(-40, 0, 20.2); a.rotation.y = Math.PI / 2 + 0.12; g.add(a); e.blink = [];
    [[-1, 1], [1, 1], [-1, -1], [1, -1]].forEach(([dx, dz]) => { const l = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.15, 0.2), new THREE.MeshBasicMaterial({ color: "#f28c28" })); l.position.set(-40 + dz * 1.5, 0.75, 20.2 + dx * 0.75); g.add(l); e.blink.push(l); });
    const d = new THREE.Mesh(new THREE.ConeGeometry(0.25, 0.6, 3), lam("#d0533c")); d.position.set(-44, 0.3, 20.3); g.add(d); const f = figurNeu(zufallsLook("frau"), -38, 21.6, Math.PI); g.add(f.g); e.f = f; e.f.pose = "winken"; e.g = g; },
  katze(e) { const g = gruppe("katze"); const k = baueTier("katze", { farbe: "#f28c28" }); k.g.position.set(20.3, 2.75, 30); k.g.rotation.y = 0.5; g.add(k.g); e.k = k;
    const f = figurNeu(zufallsLook("kind"), 19, 31.6, 2.6); f.g.scale.setScalar(0.62); g.add(f.g); e.f = f; e.f.pose = "winken"; e.g = g; },
  roboter(e) { const g = gruppe("roboter"); const r = new THREE.Group(); const b = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.6, 0.9), lam("#f3f4f2")); b.position.y = 0.45; r.add(b); const d = new THREE.Mesh(new THREE.BoxGeometry(0.72, 0.1, 0.92), lam("#0f5c63")); d.position.y = 0.78; r.add(d);
    const fa = new THREE.Mesh(new THREE.CylinderGeometry(0.015, 0.015, 0.8, 4), lam("#3a3f4a")); fa.position.set(0.25, 1.2, -0.3); r.add(fa); const fl = new THREE.Mesh(new THREE.BoxGeometry(0.25, 0.16, 0.02), lam("#f2c14e")); fl.position.set(0.37, 1.5, -0.3); r.add(fl);
    [[-0.3, 0.3], [0.3, 0.3], [-0.3, -0.3], [0.3, -0.3]].forEach(([x, z]) => { const w = new THREE.Mesh(new THREE.CylinderGeometry(0.15, 0.15, 0.08, 10), lam("#24323a")); w.rotation.z = Math.PI / 2; w.position.set(x, 0.15, z); r.add(w); });
    const ey = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.12, 0.02), new THREE.MeshBasicMaterial({ color: "#4aa3d8" })); ey.position.set(0, 0.6, 0.46); r.add(ey); g.add(r); r.position.set(ORTE.logistik.tor[0], 0, ORTE.logistik.tor[1]); e.r = r; e.pfad = routeGeh(ORTE.logistik.tor, ORTE.markt.tor); e.g = g; },
  feuerwerk(e) { e.g = gruppe("feuerwerk"); e.t = 0; e.bursts = []; }
};
function entferne(id) {
  const e = EREIG.aktiv[id]; if (!e) return; if (e.g) K.scene.remove(e.g); if (e.kol) { const i = KOL_BAUSTELLE.indexOf(e.kol); if (i >= 0) KOL_BAUSTELLE.splice(i, 1); EREIG.baustelle = false; }
  delete EREIG.aktiv[id];
}
export function ereignisStart(id) { if (EREIG.aktiv[id] || !BAU[id]) return; const e = { id, bis: K.ctx.s.zeit + DEF[id].dauer, t: 0 }; EREIG.aktiv[id] = e; BAU[id](e); }
export function regenStart(gewitter) { EREIG.regen = K.ctx.s.zeit + zufall(60, 160); EREIG.gewitter = !!gewitter; if (!regenMesh) baueRegen(); regenMesh.visible = true; K.ctx.ui.toast(gewitter ? "Ein Gewitter zieht über Nordstern City. Herr Brandt sichert seine Excel-Datei doppelt." : "Es fängt an zu regnen. Die Leute spannen ihre Schirme auf."); }
function baueRegen() {
  const n = IS_TOUCH ? 700 : 1600, pos = new Float32Array(n * 6);
  for (let i = 0; i < n; i++) { const x = zufall(-35, 35), y = zufall(0, 26), z = zufall(-35, 35); pos.set([x, y, z, x + 0.05, y - 0.7, z + 0.05], i * 6); }
  const g = new THREE.BufferGeometry(); g.setAttribute("position", new THREE.BufferAttribute(pos, 3));
  regenMesh = new THREE.LineSegments(g, new THREE.LineBasicMaterial({ color: "#a9c4d8", transparent: true, opacity: 0.55 })); regenMesh.frustumCulled = false; K.scene.add(regenMesh);
}
export function ereignisseUpdate(dt, t, o) {
  const c = K.ctx, s = c.s; if (!s) return; const h = c.stunde(), std = Math.floor(s.zeit / 60);
  if (std !== EREIG.letzteStunde) { EREIG.letzteStunde = std;
    Object.keys(EREIG.aktiv).forEach((id) => { const d = DEF[id]; if (s.zeit > EREIG.aktiv[id].bis || h < d.std[0] - 0.5 || h > d.std[1] + 0.5) entferne(id); });
    const anz = Object.keys(EREIG.aktiv).length;
    Object.entries(DEF).forEach(([id, d]) => { if (EREIG.aktiv[id] || anz >= 4) return; if (h < d.std[0] || h >= d.std[1]) return; if (d.bed && !d.bed()) return; if (Math.random() < d.p * 0.35) ereignisStart(id); });
    if (!EREIG.regen && Math.random() < 0.05) regenStart(Math.random() < 0.3);
  }
  if (EREIG.regen && s.zeit > EREIG.regen) { EREIG.regen = 0; EREIG.gewitter = false; if (regenMesh) regenMesh.visible = false; c.ui.toast("Der Regen hört auf. Ein Regenbogen über dem Werk, sagt Radio Nordstern."); }
  /* Regen und Licht */
  const W = c.W;
  if (basis.gesetzt === null || Math.abs(W.hemi.intensity - basis.gesetzt) > 1e-4) basis.hemi = W.hemi.intensity;
  if (!c.scene.background.equals(basis.gesetztBg)) basis.bg.copy(c.scene.background);
  let fak = EREIG.regen ? 0.72 : 1; if (EREIG.gewitter && (blitzT -= dt) < 0) { blitzT = zufall(3, 9); fak = 3; donner(); }
  W.hemi.intensity = basis.hemi * fak; basis.gesetzt = W.hemi.intensity;
  if (EREIG.regen) c.scene.background.copy(basis.bg).lerp(new THREE.Color("#7d8a96"), fak > 1 ? 0 : 0.45); else c.scene.background.copy(basis.bg);
  basis.gesetztBg.copy(c.scene.background);
  if (regenMesh && regenMesh.visible) { regenMesh.position.set(o.fokus.x, 0, o.fokus.z); const a = regenMesh.geometry.attributes.position, p = a.array;
    for (let i = 0; i < p.length; i += 6) { p[i + 1] -= dt * 22; p[i + 4] -= dt * 22; if (p[i + 4] < 0) { p[i + 1] += 26; p[i + 4] += 26; } } a.needsUpdate = true; }
  /* einzelne Ereignisse */
  const A = EREIG.aktiv; EREIG.hindernisse.length = 0;
  if (A.musiker) { const f = A.musiker.f; bewegeFigur(f, t, false, null); f.armR.rotation.x = -1 + Math.sin(t * 9) * 0.3; f.armL.rotation.x = -0.9;
    const d = Math.hypot(c.ich.f.g.position.x - 33.6, c.ich.f.g.position.z - 46.6); if (d < 10 && !K.faehrt && (A.musiker.ton = (A.musiker.ton || 0) - dt) < 0) { A.musiker.ton = 0.45; ton([392, 440, 494, 523, 587, 659][Math.floor(t * 2.2) % 6]); } }
  if (A.ballon) { const g = A.ballon.g; g.position.x += dt * 1.6; g.position.y = 24 + Math.sin(t * 0.3) * 1.5; if (g.position.x > 170) entferne("ballon"); }
  if (A.firmenlauf) A.firmenlauf.laeufer.forEach((l) => { l.x += dt * 3.2 * Math.max(1, o.tempo * 0.5); if (l.x > 100) l.x = -14; l.f.g.position.x = l.x; bewegeFigur(l.f, t * 1.6 + l.x, true, null); });
  if (A.fotograf) bewegeFigur(A.fotograf.f, t, false, null), (A.fotograf.f.armL.rotation.x = -1.3), (A.fotograf.f.armR.rotation.x = -1.3);
  if (A.panne) { A.panne.blink.forEach((l) => (l.visible = Math.floor(t * 2) % 2 === 0)); bewegeFigur(A.panne.f, t, false, "winken"); EREIG.hindernisse.push([-40, 20.2]); }
  if (A.katze) { animiereTier(A.katze.k, t, false, true); bewegeFigur(A.katze.f, t, false, "winken"); }
  if (A.baustelle) { bewegeFigur(A.baustelle.f, t, false, null); A.baustelle.f.armR.rotation.x = -1.2 + Math.abs(Math.sin(t * 4)) * 0.8; }
  if (A.roboter) { const e = A.roboter, r = e.r; if (!e.pfad.length) e.pfad = routeGeh([r.position.x, r.position.z], Math.random() < 0.5 ? ORTE.logistik.tor : ORTE.markt.tor);
    const z = e.pfad[0]; if (z && o.laeuft) { const dx = z[0] - r.position.x, dz = z[1] - r.position.z, l = Math.hypot(dx, dz), v = dt * 1.3 * Math.max(1, o.tempo * 0.6); if (l < v) e.pfad.shift(); else { r.position.x += dx / l * v; r.position.z += dz / l * v; r.rotation.y = Math.atan2(dx, dz); } } }
  if (A.feuerwerk) { const e = A.feuerwerk; e.t -= dt; if (e.t <= 0) { e.t = zufall(0.4, 1.2); burst(e); }
    e.bursts.forEach((b) => { b.t += dt; const p = b.p.geometry.attributes.position; for (let i = 0; i < b.v.length; i++) { b.v[i].y -= dt * 2.2; p.array[i * 3] += b.v[i].x * dt; p.array[i * 3 + 1] += b.v[i].y * dt; p.array[i * 3 + 2] += b.v[i].z * dt; } p.needsUpdate = true; b.p.material.opacity = Math.max(0, 1 - b.t / 1.8); });
    for (let i = e.bursts.length - 1; i >= 0; i--) if (e.bursts[i].t > 1.8) { e.g.remove(e.bursts[i].p); e.bursts.splice(i, 1); } }
}
function burst(e) {
  const n = 60, pos = new Float32Array(n * 3), v = [], x = zufall(-6, 18), y = zufall(14, 20), z = zufall(26, 38);
  for (let i = 0; i < n; i++) { pos.set([x, y, z], i * 3); const a = Math.random() * 6.28, b = Math.acos(zufall(-1, 1)), sp = zufall(3, 5); v.push({ x: Math.sin(b) * Math.cos(a) * sp, y: Math.cos(b) * sp, z: Math.sin(b) * Math.sin(a) * sp }); }
  const g = new THREE.BufferGeometry(); g.setAttribute("position", new THREE.BufferAttribute(pos, 3));
  const p = new THREE.Points(g, new THREE.PointsMaterial({ color: ["#f2c14e", "#e46b6b", "#6fb7e0", "#b07ad8", "#6fae5a", "#ffffff"][Math.floor(Math.random() * 6)], size: 0.5, transparent: true })); e.g.add(p); e.bursts.push({ p, v, t: 0 }); knall();
}
let ac = null; function audio() { try { return (ac = ac || new (window.AudioContext || window.webkitAudioContext)()); } catch (e) { return null; } }
function ton(f) { const a = audio(); if (!a || !K.ctx.ton()) return; const t = a.currentTime, o = a.createOscillator(), g = a.createGain(); o.type = "triangle"; o.frequency.value = f; g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(0.03, t + 0.02); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.4); o.connect(g).connect(a.destination); o.start(t); o.stop(t + 0.45); }
function rauschen(dauer, laut, filter) { const a = audio(); if (!a || !K.ctx.ton()) return; const n = Math.floor(a.sampleRate * dauer), buf = a.createBuffer(1, n, a.sampleRate), d = buf.getChannelData(0); for (let i = 0; i < n; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / n, 2);
  const s = a.createBufferSource(), f = a.createBiquadFilter(), g = a.createGain(); f.type = "lowpass"; f.frequency.value = filter; g.gain.value = laut; s.buffer = buf; s.connect(f).connect(g).connect(a.destination); s.start(); }
function donner() { rauschen(1.6, 0.25, 260); }
function knall() { rauschen(0.35, 0.12, 1400); }
export function ereignisAktionen(id) {
  const c = K.ctx, s = c.s, d = DEF[id], a = [], geld = (b) => { if (s.geld < b) { c.ui.toast("Dafür reicht das Geld gerade nicht."); return false; } s.geld -= b; c.hud(); return true; };
  const plus = (w) => { Object.entries(w).forEach(([k, v]) => (s.bed[k] = Math.max(0, Math.min(100, s.bed[k] + v)))); c.hud(); };
  switch (id) {
    case "musiker": a.push({ t: "Zuhören, 15 Minuten", f: () => { c.zeitVergeht(15); plus({ spass: 12 }); c.ui.toast("Jule singt „Ich hab noch Resturlaub in Berlin“. Das Publikum summt mit."); } }, { t: "Münze in den Hut, 2 €", f: () => { if (geld(2)) { plus({ spass: 15, sozial: 8 }); c.ui.toast("Jule bedankt sich und widmet Ihnen das Lied „Stets zu unserer vollsten Zufriedenheit“."); } } }); break;
    case "flohmarkt": a.push({ t: "Stöbern, 5 €", f: () => { if (geld(5)) { c.zeitVergeht(30); plus({ spass: 22 }); c.ui.toast(c.s.name + " ergattert " + c.pick(["einen Locher aus dem Jahr 1994, voll funktionsfähig.", "eine Kaffeetasse mit der Aufschrift „Beste Personalerin der Welt“.", "ein Buch mit dem Titel „Excel für Fortgeschrittene, Band 7“.", "einen Stempel „Genehmigt“. Herr Brandt wird neidisch sein."])); } } }); break;
    case "eiswagen": a.push({ t: "Eis kaufen, 3 €", f: () => { if (geld(3)) { plus({ hunger: 15, spass: 15 }); c.ui.toast("Sorte des Tages ist Vanille mit Weihnachtsgeld. Gibt es aber nur einmal im Jahr."); } } }); break;
    case "baustelle": a.push({ t: "Bauleiterin nach dem Sinn fragen", f: () => c.frageRunde({ titel: "Baustelle Marktstraße", intro: "Die Bauleiterin hat Pause, laut Arbeitszeitgesetz. Sie stellt Ihnen eine Frage zum Thema " + c.day.title + ".", anzahl: 1, ende: "Weiter", fertig: (r) => { if (r) { s.geld += 15; c.ui.toast("Richtig! Plus 15 € aus der Kaffeekasse der Baustelle.", "geld"); } plus({ sozial: 8 }); } }) }); break;
    case "ballon": a.push({ t: "Winken", f: () => { c.ich.pose = "winken"; setTimeout(() => (c.ich.pose = null), 1800); plus({ spass: 6 }); c.ui.toast("Aus dem Ballon winkt die Weiterbildungsabteilung zurück."); } }); break;
    case "firmenlauf": a.push({ t: "Mitlaufen", f: () => { c.zeitVergeht(40); plus({ energie: -15, spass: 25, sozial: 12, hygiene: -15 }); s.fitness = Math.min(100, (s.fitness || 0) + 2); c.ui.toast(c.s.name + " läuft beim Firmenlauf mit. Fitness plus 2. Der Betriebsrat verteilt Bananen."); c.pruefeZiele(); } }); break;
    case "fotograf": a.push({ t: "Foto machen lassen", f: () => { plus({ spass: 10, sozial: 5 }); c.ui.toast("Klick! Das Foto landet bei Paula Probezeit, 14 Likes."); } }); break;
    case "panne": a.push({ t: "Bei der Panne helfen", f: () => c.frageRunde({ titel: "Panne an der Nordsternallee", intro: "Der Wagenheber klemmt. Während Sie helfen, fragt die Fahrerin etwas zum Thema " + c.day.title + ".", anzahl: 1, ende: "Weiter", fertig: (r) => { s.geld += r ? 25 : 0; plus({ sozial: 15, hygiene: -8 }); c.ui.toast(r ? "Reifen gewechselt und richtig geantwortet. Plus 25 € Dankeschön." : "Reifen gewechselt. Die Antwort war nicht ganz richtig, aber die Hilfe zählt.", r ? "geld" : ""); entferne("panne"); } }) }); break;
    case "katze": a.push({ t: "Katze aus dem Baum retten", f: () => { c.zeitVergeht(15); plus({ spass: 15, sozial: 12 }); c.ui.toast("Gerettet! Die Feuerwehr wäre auch gekommen, aber erst nach dem dritten Formular."); entferne("katze"); } }); break;
    case "roboter": a.push({ t: "Paketpaul beim Sortieren helfen", f: () => c.sortFrage({ titel: "Lieferroboter Paketpaul", intro: "Paketpaul piept ratlos. Wohin gehört diese Aussage?", fertig: (ok) => { if (ok) { s.geld += 10; c.ui.toast("Paketpaul piept dankbar und überweist 10 €.", "geld"); } else c.ui.toast("Paketpaul piept trotzdem freundlich."); } }) }); break;
    case "feuerwerk": a.push({ t: "Zuschauen", f: () => { plus({ spass: 20 }); c.ui.toast("Oh! Ah! Das Feuerwerk ist schöner als jede Präsentation zum Quartalsabschluss."); } }); break;
  }
  return a;
}
export const ereignisName = (id) => (DEF[id] ? DEF[id].name : "");
export function ereignisGruppen() { return Object.values(EREIG.aktiv).map((e) => e.g).filter(Boolean); }
