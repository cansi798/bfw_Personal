/* Nordstern Leben · Haustiere mit Laufanimation und eigenem Kopf
   © 2026 Waybuild Akademie, Waybuild UG (haftungsbeschränkt). Alle Rechte vorbehalten. · www.waybuild.de */
import { THREE, lam, zufall } from "./bau.js";

export const ARTEN = {
  hund: { name: "Hund", preis: 600, futter: 6, tempo: 1.7, namen: ["Bello", "Keks", "Luna", "Bruno", "Paula"], text: "Treu, verspielt und will jeden Tag Gassi gehen." },
  katze: { name: "Katze", preis: 450, futter: 5, tempo: 1.2, namen: ["Mimi", "Pixel", "Frau Müller", "Tiger"], text: "Unabhängig wie eine Führungskraft mit Vertrauensarbeitszeit." },
  schildkroete: { name: "Schildkröte", preis: 150, futter: 3, tempo: 0.16, namen: ["Panzer", "Turbo", "Gleitzeit"], text: "Sehr gelassen. Hält jede Kündigungsfrist ein." },
  kaninchen: { name: "Kaninchen", preis: 200, futter: 3, tempo: 1.2, namen: ["Hoppel", "Möhre", "Flocke"], text: "Hoppelt fröhlich durch Haus und Garten." },
  papagei: { name: "Papagei", preis: 500, futter: 4, tempo: 2.2, namen: ["Coco", "Professor", "Rosi"], text: "Plappert Fachbegriffe nach. Lernt schneller als manche Azubis." }
};
const box = (p, w, h, d, c, x, y, z) => { const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), lam(c)); m.position.set(x, y, z); m.castShadow = true; p.add(m); return m; };
const kug = (p, r, c, x, y, z) => { const m = new THREE.Mesh(new THREE.SphereGeometry(r, 10, 8), lam(c)); m.position.set(x, y, z); m.castShadow = true; p.add(m); return m; };
function beinGruppe(p, x, y, z, w, h, c) { const g = new THREE.Group(); g.position.set(x, y, z); p.add(g); box(g, w, h, w, c, 0, -h / 2, 0); return g; }

export function baueTier(art, o) {
  o = o || {}; const g = new THREE.Group(), k = new THREE.Group(); g.add(k); const r = { g, k, beine: [], art };
  if (art === "hund" || art === "dackel") {
    const c = o.farbe || (art === "dackel" ? "#8c5a3c" : "#c8a06a"), d = "#5a3a22", lang = art === "dackel" ? 1.5 : 1;
    box(k, 0.36, 0.3, 0.75 * lang, c, 0, 0.42, 0); const kopf = new THREE.Group(); kopf.position.set(0, 0.62, 0.42 * lang); k.add(kopf); r.kopf = kopf;
    box(kopf, 0.3, 0.28, 0.3, c, 0, 0, 0); box(kopf, 0.18, 0.14, 0.2, c, 0, -0.05, 0.2); box(kopf, 0.07, 0.06, 0.05, "#1d1d1d", 0, -0.0, 0.31);
    box(kopf, 0.08, 0.2, 0.12, d, -0.17, 0.02, -0.02); box(kopf, 0.08, 0.2, 0.12, d, 0.17, 0.02, -0.02); kug(kopf, 0.03, "#1d1d1d", -0.08, 0.06, 0.15); kug(kopf, 0.03, "#1d1d1d", 0.08, 0.06, 0.15);
    const hl = art === "dackel" ? 0.16 : 0.3; [[-0.12, 0.28 * lang], [0.12, 0.28 * lang], [-0.12, -0.28 * lang], [0.12, -0.28 * lang]].forEach(([x, z]) => r.beine.push(beinGruppe(k, x, 0.3, z, 0.09, hl, c)));
    if (art === "dackel") k.position.y = -0.14;
    const sw = new THREE.Group(); sw.position.set(0, 0.52, -0.38 * lang); k.add(sw); const st = box(sw, 0.06, 0.06, 0.3, c, 0, 0.08, -0.12); st.rotation.x = -0.6; r.schwanz = sw;
  } else if (art === "katze") {
    const c = o.farbe || "#8c8c8c";
    box(k, 0.26, 0.24, 0.6, c, 0, 0.36, 0); const kopf = new THREE.Group(); kopf.position.set(0, 0.55, 0.34); k.add(kopf); r.kopf = kopf;
    box(kopf, 0.26, 0.22, 0.22, c, 0, 0, 0); [-0.08, 0.08].forEach((x) => { const o2 = new THREE.Mesh(new THREE.ConeGeometry(0.05, 0.12, 4), lam(c)); o2.position.set(x, 0.15, 0); kopf.add(o2); });
    kug(kopf, 0.025, "#a8d84a", -0.06, 0.03, 0.11); kug(kopf, 0.025, "#a8d84a", 0.06, 0.03, 0.11); box(kopf, 0.04, 0.03, 0.02, "#f39bb0", 0, -0.03, 0.115);
    [[-0.09, 0.22], [0.09, 0.22], [-0.09, -0.22], [0.09, -0.22]].forEach(([x, z]) => r.beine.push(beinGruppe(k, x, 0.26, z, 0.07, 0.26, c)));
    const sw = new THREE.Group(); sw.position.set(0, 0.42, -0.3); k.add(sw); const st = box(sw, 0.05, 0.42, 0.05, c, 0, 0.2, -0.04); st.rotation.x = -0.3; r.schwanz = sw;
  } else if (art === "schildkroete") {
    const pz = kug(k, 0.32, "#6f8f5a", 0, 0.16, 0); pz.scale.set(1, 0.55, 1.2); box(k, 0.6, 0.05, 0.75, "#c9b45c", 0, 0.08, 0);
    const kopf = new THREE.Group(); kopf.position.set(0, 0.16, 0.42); k.add(kopf); r.kopf = kopf; kug(kopf, 0.1, "#9bb36a", 0, 0, 0.04); kug(kopf, 0.018, "#1d1d1d", -0.05, 0.03, 0.11); kug(kopf, 0.018, "#1d1d1d", 0.05, 0.03, 0.11);
    [[-0.24, 0.24], [0.24, 0.24], [-0.24, -0.24], [0.24, -0.24]].forEach(([x, z]) => r.beine.push(beinGruppe(k, x, 0.12, z, 0.1, 0.12, "#9bb36a")));
  } else if (art === "kaninchen") {
    const c = o.farbe || "#f3f4f2";
    const kb = kug(k, 0.2, c, 0, 0.24, 0); kb.scale.set(1, 0.9, 1.3); kug(k, 0.08, "#ffffff", 0, 0.28, -0.26);
    const kopf = new THREE.Group(); kopf.position.set(0, 0.4, 0.22); k.add(kopf); r.kopf = kopf; kug(kopf, 0.13, c, 0, 0, 0);
    [-0.05, 0.05].forEach((x) => { const oh = box(kopf, 0.05, 0.26, 0.03, c, x, 0.2, -0.02); oh.rotation.z = x * 2; }); kug(kopf, 0.02, "#1d1d1d", -0.06, 0.03, 0.11); kug(kopf, 0.02, "#1d1d1d", 0.06, 0.03, 0.11); kug(kopf, 0.025, "#f39bb0", 0, -0.02, 0.13);
    [[-0.1, 0.12], [0.1, 0.12], [-0.12, -0.12], [0.12, -0.12]].forEach(([x, z]) => r.beine.push(beinGruppe(k, x, 0.1, z, 0.08, 0.1, c)));
  } else if (art === "papagei") {
    const c = o.farbe || "#2e9e5b";
    const kb = kug(k, 0.14, c, 0, 0.2, 0); kb.scale.set(0.9, 1.25, 0.9); const kopf = new THREE.Group(); kopf.position.set(0, 0.42, 0.02); k.add(kopf); r.kopf = kopf;
    kug(kopf, 0.1, "#e8c33a", 0, 0, 0); const sn = new THREE.Mesh(new THREE.ConeGeometry(0.035, 0.1, 5), lam("#3a3f4a")); sn.rotation.x = Math.PI / 2 + 0.4; sn.position.set(0, -0.02, 0.11); kopf.add(sn);
    kug(kopf, 0.018, "#1d1d1d", -0.05, 0.03, 0.07); kug(kopf, 0.018, "#1d1d1d", 0.05, 0.03, 0.07);
    r.fluegel = [-1, 1].map((sd) => { const f = new THREE.Group(); f.position.set(sd * 0.12, 0.28, 0); k.add(f); box(f, 0.04, 0.26, 0.22, "#d0533c", sd * 0.03, -0.1, -0.02); return f; });
    box(k, 0.08, 0.3, 0.04, "#1f6fb8", 0, 0.06, -0.14).rotation.x = 0.5;
  }
  g.traverse((m) => { if (m.isMesh) m.castShadow = true; });
  return r;
}
export function stange() {
  const g = new THREE.Group();
  box(g, 0.5, 0.05, 0.5, "#7a5233", 0, 0.03, 0); box(g, 0.06, 1.4, 0.06, "#a8794f", 0, 0.72, 0); box(g, 0.7, 0.05, 0.05, "#a8794f", 0, 1.4, 0); box(g, 0.2, 0.08, 0.15, "#e8c33a", 0.25, 1.46, 0);
  return g;
}
/* Bewegung eines Tiers */
export function animiereTier(r, t, laeuft, traurig) {
  const a = r.art, sp = a === "schildkroete" ? 3 : a === "kaninchen" ? 0 : 11, s = laeuft ? Math.sin(t * sp) * 0.6 : 0;
  r.beine.forEach((b, i) => (b.rotation.x = (i % 2 === (i < 2 ? 0 : 1) ? s : -s)));
  if (r.schwanz) r.schwanz.rotation.y = a === "katze" ? Math.sin(t * 2) * 0.3 : Math.sin(t * (traurig ? 3 : 16)) * (traurig ? 0.15 : 0.6);
  if (a === "kaninchen") r.k.position.y = laeuft ? Math.abs(Math.sin(t * 8)) * 0.25 : 0;
  if (a === "hund" && !laeuft) r.k.position.y = 0;
  if (r.kopf) r.kopf.rotation.x = traurig ? 0.45 : 0;
  if (r.fluegel) r.fluegel.forEach((f, i) => (f.rotation.z = laeuft ? Math.sin(t * 22) * 0.9 * (i ? -1 : 1) : 0));
}
export function zufallsPunktHeim() { return [zufall(1, 13.5), Math.random() < 0.55 ? zufall(1, 9.5) : zufall(10.6, 14.6)]; }
