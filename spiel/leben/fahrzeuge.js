/* Nordstern Leben · Fahrzeugmodelle (erfundene Modelle, keine echten Marken)
   © 2026 Waybuild Akademie, Waybuild UG (haftungsbeschränkt). Alle Rechte vorbehalten. · www.waybuild.de */
import { THREE, lam } from "./bau.js";
import { baueFigur } from "./welt.js";

export const MODELLE = {
  cargo: { name: "Fahrradwerk Cargo", art: "Lastenrad", preis: 900, tempo: 6, plaetze: 2, text: "Aus dem eigenen Werk, mit Mitarbeiterrabatt und Platz für Einkäufe. Kein Stau, kein Parkplatzproblem.", farben: ["#0f5c63", "#c9a227", "#c9503b", "#6f8f7b", "#1f3557"] },
  mini: { name: "Nordstern Mini", art: "Kleinwagen", preis: 2400, tempo: 11, plaetze: 4, text: "Klein, wendig und passt in jede Lücke. Fast so flexibel wie Gleitzeit.", farben: ["#d0533c", "#f2c14e", "#6fb7e0", "#ffffff", "#24323a", "#6f8f7b"] },
  van: { name: "Familienkutsche", art: "Van", preis: 3600, tempo: 10, plaetze: 7, text: "Sieben Plätze, also Platz für die ganze Familie und den Betriebsrat.", farben: ["#1f3557", "#c9d1d8", "#7b2338", "#6f8f7b", "#f6efe4"] },
  stromer: { name: "Stromer E", art: "Elektroauto", preis: 4200, tempo: 13, plaetze: 5, text: "Leise, sauber und schneller als jede Genehmigung im Umlaufverfahren.", farben: ["#ffffff", "#4aa3d8", "#6fae5a", "#24323a", "#b07ad8"] },
  cabrio: { name: "Sonnenschein Cabrio", art: "Cabrio", preis: 5200, tempo: 14, plaetze: 2, text: "Offenes Verdeck für offene Kommunikation. Bei Regen eher ungünstig.", farben: ["#d0533c", "#f2c14e", "#f39bb0", "#ffffff", "#0f5c63", "#1d1d1d"] },
  pickup: { name: "Pickup Landluft", art: "Pickup", preis: 4600, tempo: 12, plaetze: 5, text: "Große Ladefläche für Umzüge, Möbel und sehr viele Aktenordner.", farben: ["#7a5233", "#c9503b", "#3f6b5a", "#c9d1d8", "#24323a"] }
};
const GLAS = new THREE.MeshLambertMaterial({ color: "#2b3a48", transparent: true, opacity: 0.75 });
const REIFEN = lam("#1d1d1d"), FELGE = lam("#c9d1d8");
function b(g, w, h, d, c, x, y, z) { const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), typeof c === "string" ? lam(c) : c); m.position.set(x, y, z); m.castShadow = true; g.add(m); return m; }
function rad(g, r, w, x, y, z) {
  const p = new THREE.Group(); p.position.set(x, y, z); g.add(p);
  const t = new THREE.Mesh(new THREE.CylinderGeometry(r, r, w, 12), REIFEN); t.rotation.z = Math.PI / 2; t.castShadow = true; p.add(t);
  const f = new THREE.Mesh(new THREE.CylinderGeometry(r * 0.5, r * 0.5, w + 0.02, 6), FELGE); f.rotation.z = Math.PI / 2; p.add(f); return p;
}
/* Fahrzeug, Blick in Richtung +z. Rückgabe Group mit userData.raeder und userData.fahrer */
export function baueAuto(modell, farbe, fahrerLook) {
  const g = new THREE.Group(), M = MODELLE[modell] || MODELLE.mini, c = farbe || M.farben[0], raeder = [];
  g.userData = { modell, farbe: c, raeder, laenge: 3.6 };
  if (modell === "cargo") {
    b(g, 1.1, 0.7, 1.0, c, 0, 0.75, 0.85); b(g, 1.14, 0.06, 1.04, "#24323a", 0, 1.12, 0.85);
    b(g, 0.08, 0.08, 1.6, "#3a3f4a", 0, 0.55, -0.4); b(g, 0.08, 0.7, 0.08, "#3a3f4a", 0, 0.85, -0.55); b(g, 0.3, 0.08, 0.36, "#24323a", 0, 1.2, -0.55);
    b(g, 0.08, 0.75, 0.08, "#3a3f4a", 0, 1.0, 0.3); b(g, 0.6, 0.06, 0.06, "#3a3f4a", 0, 1.38, 0.3);
    raeder.push(rad(g, 0.3, 0.12, -0.45, 0.3, 0.85), rad(g, 0.3, 0.12, 0.45, 0.3, 0.85), rad(g, 0.34, 0.1, 0, 0.34, -1.1));
    g.userData.laenge = 2.8; g.userData.rad = true;
  } else {
    const L = modell === "van" ? 4.0 : modell === "mini" ? 3.1 : modell === "pickup" ? 4.2 : 3.7, W = modell === "mini" ? 1.6 : 1.8;
    const hU = modell === "van" ? 0.75 : 0.55, yU = 0.62;
    b(g, W, hU, L, c, 0, yU, 0); b(g, W + 0.04, 0.12, L + 0.06, "#3a3f4a", 0, yU - hU / 2 + 0.02, 0);
    if (modell === "van") { b(g, W - 0.06, 0.75, L * 0.78, GLAS, 0, 1.38, -0.2); b(g, W - 0.02, 0.1, L * 0.8, c, 0, 1.8, -0.2); }
    else if (modell === "cabrio") { const s = b(g, W - 0.1, 0.45, 0.06, GLAS, 0, 1.12, 0.45); s.rotation.x = -0.4; b(g, W - 0.3, 0.3, 0.7, "#5a3a22", 0, 0.98, -0.7); }
    else if (modell === "pickup") { b(g, W - 0.06, 0.62, 1.6, GLAS, 0, 1.2, 0.5); b(g, W - 0.02, 0.1, 1.62, c, 0, 1.56, 0.5); b(g, W, 0.35, 0.08, c, 0, 1.06, -2.06); b(g, 0.08, 0.35, 2.0, c, W / 2 - 0.04, 1.06, -1.05); b(g, 0.08, 0.35, 2.0, c, -W / 2 + 0.04, 1.06, -1.05); }
    else { const lc = modell === "mini" ? 1.7 : 2.0; b(g, W - 0.08, 0.6, lc, GLAS, 0, 1.18, modell === "stromer" ? -0.1 : -0.15); b(g, W - 0.04, 0.1, lc - 0.1, c, 0, 1.52, modell === "stromer" ? -0.1 : -0.15); }
    if (modell === "stromer") { b(g, 0.5, 0.04, 0.3, "#4aa3d8", 0, yU + hU / 2 + 0.01, L / 2 - 0.5); }
    const lmat = new THREE.MeshLambertMaterial({ color: "#fff6d0", emissive: "#3a3520" }); [-W / 2 + 0.3, W / 2 - 0.3].forEach((x) => { b(g, 0.32, 0.14, 0.05, lmat, x, yU + 0.08, L / 2 + 0.01); b(g, 0.3, 0.12, 0.05, "#d0533c", x, yU + 0.08, -L / 2 - 0.01); });
    const rz = L / 2 - 0.7, rr = modell === "pickup" ? 0.4 : 0.34; [[-W / 2, rz], [W / 2, rz], [-W / 2, -rz], [W / 2, -rz]].forEach(([x, z]) => raeder.push(rad(g, rr, 0.26, x, rr, z)));
    g.userData.laenge = L;
  }
  if (fahrerLook) setzeFahrer(g, fahrerLook);
  return g;
}
export function setzeFahrer(g, look) {
  if (g.userData.fahrer) { g.remove(g.userData.fahrer.g); g.userData.fahrer = null; }
  if (!look) return;
  const f = baueFigur(Object.assign({}, look, { kind: false })); const rad = g.userData.rad;
  f.g.scale.setScalar(rad ? 0.9 : 0.78); f.g.position.set(rad ? 0 : -0.36 * -1, rad ? 0.32 : 0.12, rad ? -0.55 : -0.2);
  f.beinL.rotation.x = rad ? -1.0 : -1.45; f.beinR.rotation.x = rad ? -1.0 : -1.45; f.armL.rotation.x = -1.1; f.armR.rotation.x = -1.1;
  if (!rad) f.inner.position.y = -0.36; g.add(f.g); g.userData.fahrer = f;
}
/* Räder drehen, beim Lastenrad treten */
export function animiereAuto(g, v, dt, t) {
  (g.userData.raeder || []).forEach((r) => (r.rotation.x += v * dt / 0.33));
  const f = g.userData.fahrer; if (f && g.userData.rad) { const s = Math.sin(t * Math.max(2, Math.abs(v) * 1.6)) * 0.45; f.beinL.rotation.x = -1.0 + s; f.beinR.rotation.x = -1.0 - s; }
}
