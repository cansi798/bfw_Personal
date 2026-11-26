/* Nordstern Leben · 3D-Welt mit Haus, Möbeln und Figuren
   © 2026 Waybuild Akademie, Waybuild UG (haftungsbeschränkt). Alle Rechte vorbehalten. · www.waybuild.de */
import * as THREE from "../lib/three.module.js";

export const IS_TOUCH = window.matchMedia("(pointer:coarse)").matches;
const MATS = new Map();
export function mat(c, extra) {
  const key = c + (extra ? JSON.stringify(extra) : "");
  if (!MATS.has(key)) MATS.set(key, new THREE.MeshLambertMaterial(Object.assign({ color: c }, extra || {})));
  return MATS.get(key);
}
function mesh(geo, c, x, y, z, p, extra) {
  const m = new THREE.Mesh(geo, typeof c === "string" ? mat(c, extra) : c);
  m.position.set(x, y, z); m.castShadow = true; m.receiveShadow = true; if (p) p.add(m); return m;
}
const box = (w, h, d, c, x, y, z, p, e) => mesh(new THREE.BoxGeometry(w, h, d), c, x, y, z, p, e);
const cyl = (rt, rb, h, c, x, y, z, p, s, e) => mesh(new THREE.CylinderGeometry(rt, rb, h, s || 14), c, x, y, z, p, e);
const kug = (r, c, x, y, z, p, e) => mesh(new THREE.SphereGeometry(r, 16, 12), c, x, y, z, p, e);

/* ---------- Szene ---------- */
export const MITTE = new THREE.Vector3(7, 0, 6);
export function erstelleWelt(canvas) {
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: !IS_TOUCH, powerPreference: "high-performance" });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, IS_TOUCH ? 1.5 : 1.75));
  renderer.shadowMap.enabled = !IS_TOUCH;
  renderer.shadowMap.type = THREE.PCFShadowMap; /* ERW-WELT: PCFSoft gibt es in r187 nicht mehr */
  const scene = new THREE.Scene();
  scene.background = new THREE.Color("#bfe3f2");
  const camera = new THREE.OrthographicCamera(-10, 10, 10, -10, 0.1, 200);
  const hemi = new THREE.HemisphereLight("#fff6ea", "#6b8f5a", 1.15); scene.add(hemi);
  const sonne = new THREE.DirectionalLight("#fff3df", 1.7);
  sonne.position.set(16, 22, 12); sonne.target.position.copy(MITTE); scene.add(sonne, sonne.target);
  sonne.castShadow = !IS_TOUCH;
  Object.assign(sonne.shadow.camera, { left: -16, right: 16, top: 16, bottom: -16, near: 1, far: 60 });
  sonne.shadow.mapSize.set(2048, 2048); sonne.shadow.bias = -0.0008;

  // Garten
  /* ERW-WELT: großer Boden für die offene Welt, Gartentor im Zaun */
  const gras = box(250, 0.1, 160, "#93c871", 40, -0.06, 6, scene); gras.castShadow = false;
  box(2.2, 0.04, 4.6, "#d9cdb8", 7, 0.0, 12.5, scene).castShadow = false;
  for (let x = -2; x <= 16; x += 1.2) { if (x > 5.9 && x < 8.1) continue; box(0.12, 0.7, 0.12, "#fffaf0", x, 0.35, 15.2, scene); }
  [6.0, 8.0].forEach((x) => box(0.16, 0.95, 0.16, "#fffaf0", x, 0.47, 15.2, scene));
  [[-2.2, 6.0], [8.0, 16.2]].forEach(([a, b]) => { box(b - a, 0.08, 0.06, "#fffaf0", (a + b) / 2, 0.55, 15.2, scene); box(b - a, 0.08, 0.06, "#fffaf0", (a + b) / 2, 0.25, 15.2, scene); });
  /* /ERW-WELT */
  [[-1.5, 2], [15.6, 3], [-1.8, 9], [16, 11], [12.6, 13.6]].forEach(([x, z], i) => baum(scene, x, z, 0.9 + (i % 3) * 0.2));
  [[1.4, 13.8], [2.6, 14.1], [11.2, 13.9], [9.8, 14.2]].forEach(([x, z], i) => blume(scene, x, z, ["#e46b6b", "#f2c14e", "#b07ad8", "#f39bb0"][i]));

  // Böden je Raum
  const boeden = [[0, 5, 0, 5, "#d8c3a5"], [5, 8, 0, 5, "#dfe9ee"], [8, 14, 0, 5, "#c9b79b"], [0, 7, 5, 10, "#c89f72"], [7, 14, 5, 10, "#e8e1d6"]];
  boeden.forEach(([x0, x1, z0, z1, c]) => { const b = box(x1 - x0, 0.1, z1 - z0, c, (x0 + x1) / 2, 0.05, (z0 + z1) / 2, scene); b.castShadow = false; });
  // Fliesenraster im Bad und in der Küche
  for (let i = 1; i < 5; i++) { box(3, 0.005, 0.02, "#c7d6dd", 6.5, 0.105, i, scene).castShadow = false; }
  for (let i = 8; i < 14; i++) { box(0.02, 0.005, 5, "#d6cdbf", i, 0.105, 7.5, scene).castShadow = false; }
  // Fußleiste vorne
  box(14, 0.16, 0.12, "#f4ead9", 7, 0.08, 10, scene);
  box(0.12, 0.16, 10, "#f4ead9", 14, 0.08, 5, scene);

  // Wände (hinten volle Höhe, innen niedrig wie im Puppenhaus)
  const waende = [];
  const wand = (w, h, d, x, z, seite) => { const m = box(w, h, d, "#f4ead9", x, h / 2, z, scene); m.userData.seite = seite; waende.push(m); return m; };
  wand(14.2, 2.6, 0.2, 7, -0.1, "hinten");
  wand(0.2, 2.6, 10.2, -0.1, 5, "links");
  [[2.5, 1.5], [10.8, 1.5]].forEach(([x, y]) => { const f = box(1.6, 1, 0.05, "#a9d6ef", x, y, 0.01, scene, { emissive: "#000000" }); f.userData.fenster = true; f.userData.seite = "hinten"; waende.push(f); });
  { const f = box(0.05, 1, 1.8, "#a9d6ef", 0.01, 1.5, 7.6, scene, { emissive: "#000000" }); f.userData.fenster = true; f.userData.seite = "links"; waende.push(f); }
  const niedrig = "#efe3cf";
  [[0.1, 0.5, 5.0, 5, 2.5], [0.1, 0.5, 5.0, 8, 2.5]].forEach(([w, h, d, x, z]) => box(w, h, d, niedrig, x, h / 2, z, scene));
  [[0, 2.2], [3.2, 5.6], [6.6, 9.4], [10.6, 14]].forEach(([a, b]) => box(b - a, 0.5, 0.1, niedrig, (a + b) / 2, 0.25, 5, scene));

  return { renderer, scene, camera, hemi, sonne, waende };
}
function baum(p, x, z, s) {
  const g = new THREE.Group(); g.position.set(x, 0, z); g.scale.setScalar(s); p.add(g);
  cyl(0.16, 0.22, 1.4, "#7a5233", 0, 0.7, 0, g); kug(0.9, "#5f9a4e", 0, 1.9, 0, g); kug(0.65, "#6fae5a", 0.4, 2.4, 0.2, g);
}
function blume(p, x, z, c) {
  const g = new THREE.Group(); g.position.set(x, 0, z); p.add(g);
  for (let i = 0; i < 5; i++) { const a = i * 1.26; cyl(0.02, 0.02, 0.35, "#4f8a3c", Math.cos(a) * 0.25, 0.17, Math.sin(a) * 0.25, g, 5); kug(0.09, c, Math.cos(a) * 0.25, 0.38, Math.sin(a) * 0.25, g); }
}

/* ---------- Kamera ---------- */
export function setzeKamera(camera, waende, drehung, zoom, pan, breite, hoehe) {
  const a = Math.PI / 4 + drehung * Math.PI / 2, d = 90; /* ERW-WELT: weiter entfernt, damit die ganze Stadt in den Tiefenbereich passt */
  const ziel = MITTE.clone().add(pan);
  camera.position.set(ziel.x + Math.sin(a) * d, 72, ziel.z + Math.cos(a) * d); camera.far = 420;
  camera.lookAt(ziel);
  const view = 16, asp = breite / Math.max(1, hoehe);
  const vs = asp < 1 ? view / asp * 0.82 : view;
  camera.left = -vs * asp / 2; camera.right = vs * asp / 2; camera.top = vs / 2; camera.bottom = -vs / 2;
  camera.zoom = zoom; camera.updateProjectionMatrix();
  const sx = Math.sin(a), sz = Math.cos(a);
  waende.forEach((w) => { w.visible = w.userData.seite === "hinten" ? sz > 0 : sx > 0; });
}

/* ---------- Möbel ---------- */
const HOLZ = "#a8794f", HOLZ_D = "#7a5233", WEISS = "#f3f4f2";
export const MOEBEL = {
  bett(g) {
    box(1.7, 0.35, 2.2, HOLZ, 0, 0.27, 0, g); box(1.6, 0.2, 2.05, "#ffffff", 0, 0.52, 0.02, g);
    box(1.7, 0.95, 0.12, HOLZ_D, 0, 0.55, -1.08, g);
    box(0.6, 0.14, 0.38, "#fdfaf4", -0.4, 0.68, -0.75, g); box(0.6, 0.14, 0.38, "#fdfaf4", 0.4, 0.68, -0.75, g);
    box(1.64, 0.1, 1.25, "#6f8f7b", 0, 0.66, 0.42, g);
  },
  kinderbett(g) {
    box(1.0, 0.08, 1.4, WEISS, 0, 0.32, 0, g); box(0.9, 0.12, 1.3, "#fde7ef", 0, 0.42, 0, g);
    [[-0.5, 0], [0.5, 0]].forEach(([x]) => { for (let i = 0; i < 7; i++) cyl(0.025, 0.025, 0.55, WEISS, x, 0.6, -0.6 + i * 0.2, g, 6); box(0.06, 0.06, 1.44, WEISS, x, 0.88, 0, g); });
    [-0.7, 0.7].forEach((z) => { for (let i = 0; i < 5; i++) cyl(0.025, 0.025, 0.55, WEISS, -0.4 + i * 0.2, 0.6, z, g, 6); box(1.04, 0.06, 0.06, WEISS, 0, 0.88, z, g); });
    [[-0.48, -0.68], [0.48, -0.68], [-0.48, 0.68], [0.48, 0.68]].forEach(([x, z]) => cyl(0.04, 0.04, 0.9, WEISS, x, 0.45, z, g, 6));
    cyl(0.015, 0.015, 0.7, "#cccccc", 0, 1.2, -0.62, g, 4);
    [["#f2c14e", -0.18], ["#6fb7e0", 0], ["#e46b6b", 0.18]].forEach(([c, x]) => kug(0.06, c, x, 1.45, -0.45, g));
    box(0.5, 0.02, 0.02, "#cccccc", 0, 1.55, -0.45, g);
  },
  kuehl(g) {
    box(0.85, 1.95, 0.75, "#eef1f4", 0, 0.98, 0, g); box(0.86, 0.02, 0.76, "#c9d1d8", 0, 1.3, 0, g);
    box(0.05, 0.4, 0.05, "#9aa5ae", 0.32, 1.6, 0.39, g); box(0.05, 0.4, 0.05, "#9aa5ae", 0.32, 0.9, 0.39, g);
    box(0.18, 0.12, 0.01, "#f2c14e", -0.15, 1.6, 0.38, g); box(0.14, 0.14, 0.01, "#e46b6b", 0.05, 1.45, 0.38, g);
  },
  herd(g) {
    box(0.85, 0.9, 0.75, "#e9e6e1", 0, 0.45, 0, g); box(0.85, 0.03, 0.75, "#2a2a2a", 0, 0.915, 0, g);
    [[-0.2, -0.17], [0.2, -0.17], [-0.2, 0.17], [0.2, 0.17]].forEach(([x, z]) => cyl(0.12, 0.12, 0.01, "#555555", x, 0.935, z, g, 16));
    box(0.6, 0.38, 0.02, "#333333", 0, 0.45, 0.38, g);
    [-0.25, -0.08, 0.08, 0.25].forEach((x) => cyl(0.03, 0.03, 0.03, "#888888", x, 0.78, 0.39, g, 8).rotateX(Math.PI / 2));
  },
  theke(g) {
    box(1.3, 0.88, 0.75, "#ffffff", 0, 0.44, 0, g); box(1.34, 0.06, 0.79, "#8f7a64", 0, 0.91, 0, g);
    box(0.4, 0.05, 0.3, "#b9c4cb", -0.25, 0.95, 0, g); kug(0.1, "#e46b6b", 0.35, 1.04, -0.1, g); kug(0.09, "#f2c14e", 0.45, 1.02, 0.08, g);
  },
  dusche(g) {
    box(1.1, 0.1, 1.1, "#ffffff", 0, 0.05, 0, g);
    const glas = { transparent: true, opacity: 0.28 };
    box(0.03, 2.0, 1.1, "#bfe8ff", 0.55, 1.05, 0, g, glas); box(1.1, 2.0, 0.03, "#bfe8ff", 0, 1.05, 0.55, g, glas);
    cyl(0.02, 0.02, 0.45, "#b0b8bf", -0.4, 2.0, -0.45, g, 6); cyl(0.1, 0.06, 0.05, "#b0b8bf", -0.25, 2.0, -0.3, g);
  },
  waschbecken(g) {
    box(0.9, 0.8, 0.5, "#ffffff", 0, 0.4, 0, g); box(0.6, 0.08, 0.36, "#dfe9ee", 0, 0.82, 0.02, g);
    box(0.7, 0.8, 0.03, "#cfe9f7", 0, 1.55, -0.24, g); cyl(0.02, 0.02, 0.18, "#b0b8bf", 0, 0.92, -0.15, g, 6);
  },
  pc(g) {
    box(1.6, 0.06, 0.8, HOLZ, 0, 0.76, 0, g);
    [[-0.75, -0.35], [0.75, -0.35], [-0.75, 0.35], [0.75, 0.35]].forEach(([x, z]) => box(0.06, 0.74, 0.06, HOLZ_D, x, 0.37, z, g));
    box(0.75, 0.45, 0.05, "#222831", 0, 1.1, -0.2, g); const s = box(0.69, 0.39, 0.01, "#4aa3d8", 0, 1.1, -0.17, g, { emissive: "#163b55" }); s.userData.bildschirm = true;
    box(0.08, 0.15, 0.08, "#222831", 0, 0.86, -0.2, g); box(0.5, 0.02, 0.17, "#333a44", 0, 0.8, 0.1, g);
    box(0.55, 0.08, 0.55, "#3a3f4a", 0, 0.48, 0.75, g); box(0.55, 0.6, 0.08, "#3a3f4a", 0, 0.8, 1.0, g); cyl(0.04, 0.04, 0.44, "#777777", 0, 0.22, 0.75, g, 6);
  },
  sofa(g) {
    box(2.1, 0.42, 0.95, "#c76b5b", 0, 0.25, 0, g); box(2.1, 0.62, 0.22, "#b45c4d", 0, 0.62, -0.38, g);
    box(0.2, 0.55, 0.95, "#b45c4d", -1.0, 0.42, 0, g); box(0.2, 0.55, 0.95, "#b45c4d", 1.0, 0.42, 0, g);
    box(0.85, 0.12, 0.75, "#d9806f", -0.45, 0.52, 0.05, g); box(0.85, 0.12, 0.75, "#d9806f", 0.45, 0.52, 0.05, g);
    box(0.35, 0.3, 0.12, "#f2c14e", -0.65, 0.72, -0.22, g);
  },
  tv(g) {
    box(1.5, 0.5, 0.45, HOLZ_D, 0, 0.25, 0, g); box(1.35, 0.8, 0.06, "#1d1f24", 0, 0.98, -0.05, g);
    const s = box(1.25, 0.7, 0.01, "#101216", 0, 0.98, -0.015, g, { emissive: "#000000" }); s.userData.tvbild = true;
    box(0.3, 0.1, 0.2, "#1d1f24", 0, 0.55, -0.05, g);
  },
  regal(g) {
    box(1.3, 2.0, 0.42, HOLZ, 0, 1.0, 0, g); [0.45, 0.9, 1.35, 1.8].forEach((y) => box(1.2, 0.04, 0.4, HOLZ_D, 0, y, 0.02, g));
    const farben = ["#7b2338", "#1f3557", "#6f8f7b", "#c9a227", "#c76b5b", "#5c6bc0"];
    [0.47, 0.92, 1.37].forEach((y, r) => { let x = -0.52; for (let i = 0; i < 7; i++) { const w = 0.08 + ((i + r) % 3) * 0.03; box(w, 0.32 - (i % 2) * 0.06, 0.28, farben[(i + r) % farben.length], x + w / 2, y + 0.18 - (i % 2) * 0.03, 0.05, g); x += w + 0.04; } });
  },
  tisch(g) {
    box(1.5, 0.06, 0.95, HOLZ, 0, 0.76, 0, g);
    [[-0.68, -0.4], [0.68, -0.4], [-0.68, 0.4], [0.68, 0.4]].forEach(([x, z]) => box(0.07, 0.74, 0.07, HOLZ_D, x, 0.37, z, g));
    [[-0.85, 0], [0.85, 0]].forEach(([x], i) => { const s = new THREE.Group(); s.position.set(x * 1.0, 0, 0); s.rotation.y = i ? -Math.PI / 2 : Math.PI / 2; g.add(s); box(0.45, 0.06, 0.45, HOLZ, 0, 0.46, 0, s); box(0.45, 0.5, 0.06, HOLZ_D, 0, 0.72, -0.2, s); [[-0.19, -0.19], [0.19, -0.19], [-0.19, 0.19], [0.19, 0.19]].forEach(([a, b]) => box(0.05, 0.45, 0.05, HOLZ_D, a, 0.22, b, s)); });
    cyl(0.18, 0.18, 0.02, "#ffffff", 0, 0.8, 0, g, 16); kug(0.07, "#e46b6b", 0.05, 0.85, 0, g);
  },
  pflanze(g) {
    cyl(0.22, 0.17, 0.4, "#c76b5b", 0, 0.2, 0, g); kug(0.32, "#4f8a3c", 0, 0.7, 0, g); kug(0.24, "#5f9a4e", 0.18, 0.95, 0.05, g); kug(0.2, "#6fae5a", -0.15, 1.05, -0.05, g);
  },
  teppich(g) { const t = box(2.8, 0.02, 2.0, "#e6b8a6", 0, 0.11, 0, g); t.castShadow = false; const r = box(2.5, 0.022, 1.7, "#f3d6c6", 0, 0.115, 0, g); r.castShadow = false; },
  lampe(g) {
    cyl(0.22, 0.25, 0.05, "#333333", 0, 0.03, 0, g); cyl(0.025, 0.025, 1.6, "#333333", 0, 0.82, 0, g);
    const s = cyl(0.22, 0.32, 0.38, "#f6e7c1", 0, 1.72, 0, g, 16, { emissive: "#000000" }); s.userData.lampe = true;
  },
  spielzeug(g) {
    box(0.8, 0.45, 0.5, "#6fb7e0", 0, 0.23, 0, g); box(0.84, 0.06, 0.54, "#4a8fbf", 0, 0.48, 0, g);
    kug(0.15, "#e46b6b", 0.6, 0.15, 0.3, g); box(0.18, 0.18, 0.18, "#f2c14e", -0.6, 0.09, 0.3, g); box(0.18, 0.18, 0.18, "#6f8f7b", -0.55, 0.27, 0.32, g);
  },
  bogen(g) {
    const t = new THREE.Mesh(new THREE.TorusGeometry(1.15, 0.08, 8, 30, Math.PI), mat("#fffaf0")); t.position.y = 1.4; t.castShadow = true; g.add(t);
    cyl(0.08, 0.08, 1.4, "#fffaf0", -1.15, 0.7, 0, g); cyl(0.08, 0.08, 1.4, "#fffaf0", 1.15, 0.7, 0, g);
    for (let i = 0; i <= 12; i++) { const a = Math.PI * i / 12; kug(0.13, ["#f39bb0", "#ffffff", "#f2c14e"][i % 3], Math.cos(a) * 1.15, 1.4 + Math.sin(a) * 1.15, 0, g); }
    box(1.2, 0.02, 3.0, "#fdfaf4", 0, 0.03, 1.6, g).castShadow = false;
  },
  tuer(g) {
    box(1.3, 2.3, 0.2, "#f4ead9", 0, 1.15, 0, g); box(1.0, 2.05, 0.08, "#7b2338", 0, 1.05, 0.08, g);
    kug(0.05, "#c9a227", 0.35, 1.05, 0.15, g); box(1.5, 0.08, 0.6, "#bdb3a5", 0, 0.04, 0.4, g); box(0.5, 0.05, 0.05, "#c9a227", 0, 1.7, 0.13, g);
  },
  briefkasten(g) {
    cyl(0.05, 0.05, 1.0, "#555555", 0, 0.5, 0, g, 6); box(0.45, 0.32, 0.28, "#1f3557", 0, 1.1, 0, g); box(0.3, 0.03, 0.01, "#f2c14e", 0, 1.15, 0.15, g);
  }
};
export function baueMoebel(art) {
  const g = new THREE.Group(); (MOEBEL[art] || (() => {}))(g); return g;
}

/* ---------- Figuren ---------- */
export function baueFigur(o) {
  /* ERW-WELT: o.koerper "frau" | "mann" (ohne Angabe die bisherige Figur), o.bart und weitere Frisuren */
  const g = new THREE.Group(), k = o.kind ? 0.62 : 1, kp = o.koerper;
  const inner = new THREE.Group(); inner.scale.setScalar(k); if (kp === "frau") inner.scale.set(k * 0.97, k * 0.96, k * 0.97); if (kp === "mann") inner.scale.set(k * 1.02, k * 1.03, k * 1.02); g.add(inner);
  const huefte = 0.82, beinX = kp === "frau" ? 0.115 : 0.12;
  const bein = (x) => { const p = new THREE.Group(); p.position.set(x, huefte, 0); inner.add(p); box(kp === "frau" ? 0.18 : 0.19, 0.78, kp === "frau" ? 0.2 : 0.21, o.hose, 0, -0.39, 0, p); box(0.2, 0.08, 0.3, o.schuhe || "#3a2a22", 0, -0.78, 0.04, p); return p; };
  const beinL = bein(-beinX), beinR = bein(beinX);
  let torso;
  if (kp === "frau") { torso = box(0.44, 0.36, 0.28, o.oben, 0, 1.28, 0, inner); box(0.34, 0.2, 0.24, o.oben, 0, 1.02, 0, inner); box(0.47, 0.14, 0.29, o.rock ? o.hose : o.oben, 0, 0.88, 0, inner); }
  else if (kp === "mann") { torso = box(0.56, 0.42, 0.31, o.oben, 0, 1.25, 0, inner); box(0.46, 0.26, 0.29, o.oben, 0, 0.94, 0, inner); }
  else torso = box(0.5, 0.64, 0.3, o.oben, 0, 1.14, 0, inner);
  if (o.rock) { const r = cyl(0.27, 0.36, 0.42, o.hose, 0, 0.78, 0, inner, 14); r.scale.z = 0.8; }
  const armX = kp === "frau" ? 0.29 : kp === "mann" ? 0.36 : 0.33;
  const arm = (x) => { const p = new THREE.Group(); p.position.set(x, 1.4, 0); inner.add(p); box(kp === "frau" ? 0.12 : 0.13, 0.58, kp === "mann" ? 0.16 : 0.15, o.oben, 0, -0.27, 0, p); kug(0.075, o.haut, 0, -0.6, 0, p); return p; };
  const armL = arm(-armX), armR = arm(armX);
  cyl(0.08, 0.09, 0.14, o.haut, 0, 1.5, 0, inner, 8);
  const kopf = new THREE.Group(); kopf.position.set(0, 1.72, 0); inner.add(kopf);
  const schaedel = kug(0.23, o.haut, 0, 0, 0, kopf); if (kp === "mann") schaedel.scale.set(1.03, 1, 1); if (kp === "frau") schaedel.scale.set(0.97, 1, 0.97);
  kug(0.03, "#2b1626", -0.08, 0.02, 0.21, kopf); kug(0.03, "#2b1626", 0.08, 0.02, 0.21, kopf);
  box(0.09, 0.02, 0.02, "#a8444f", 0, -0.09, 0.215, kopf);
  const h = o.haarfarbe, hs = o.haar;
  if (hs === "locken") { [[0, 0.13, -0.02, 0.17], [-0.15, 0.08, -0.04, 0.14], [0.15, 0.08, -0.04, 0.14], [-0.17, -0.06, -0.06, 0.12], [0.17, -0.06, -0.06, 0.12], [0, 0.04, -0.17, 0.17]].forEach(([x, y, z, r]) => kug(r, h, x, y, z, kopf)); }
  else if (hs === "afro") { const a = kug(0.36, h, 0, 0.1, -0.05, kopf); a.scale.set(1, 0.9, 0.95); }
  else if (hs === "glatze") { /* keine Haare */ }
  else if (hs === "undercut") { const kp2 = kug(0.24, h, 0, 0.06, -0.02, kopf); kp2.scale.set(0.96, 0.62, 1); const t = kug(0.17, h, 0, 0.2, 0.03, kopf); t.scale.set(1, 0.5, 1.15); }
  else {
    const kappe = kug(0.245, h, 0, 0.05, -0.03, kopf); kappe.scale.set(1, 0.85, 1);
    if (hs === "lang") { box(0.44, 0.5, 0.14, h, 0, -0.2, -0.14, kopf); box(0.08, 0.38, 0.16, h, -0.2, -0.14, 0.02, kopf); box(0.08, 0.38, 0.16, h, 0.2, -0.14, 0.02, kopf); }
    if (hs === "dutt") kug(0.12, h, 0, 0.2, -0.2, kopf);
    if (hs === "zopf") { for (let i = 0; i < 4; i++) kug(0.075 - i * 0.008, h, 0, -0.05 - i * 0.12, -0.25 - (i ? 0.02 : 0), kopf); }
    if (hs === "pferdeschwanz") { kug(0.07, h, 0, 0.12, -0.24, kopf); const pz = cyl(0.07, 0.03, 0.36, h, 0, -0.06, -0.31, kopf, 8); pz.rotation.x = 0.35; }
    if (hs === "seitenscheitel") { const f = box(0.3, 0.08, 0.12, h, -0.06, 0.17, 0.15, kopf); f.rotation.z = 0.25; }
  }
  if (o.bart === "dreitage") { const b = box(0.3, 0.1, 0.08, h, 0, -0.13, 0.17, kopf); b.material = mat(h, { transparent: true, opacity: 0.45 }); }
  if (o.bart === "voll") { box(0.34, 0.16, 0.12, h, 0, -0.15, 0.15, kopf); box(0.06, 0.2, 0.12, h, -0.19, -0.04, 0.09, kopf); box(0.06, 0.2, 0.12, h, 0.19, -0.04, 0.09, kopf); }
  if (o.bart === "schnurr") box(0.14, 0.035, 0.03, h, 0, -0.06, 0.225, kopf);
  if (o.brille) { box(0.1, 0.06, 0.02, "#1d1d1d", -0.08, 0.02, 0.225, kopf); box(0.1, 0.06, 0.02, "#1d1d1d", 0.08, 0.02, 0.225, kopf); }
  g.traverse((m) => { if (m.isMesh) m.castShadow = true; });
  return { g, inner, beinL, beinR, armL, armR, kopf, kind: !!o.kind, torso, koerper: kp || null };
}
export function bewegeFigur(f, t, laeuft, pose) {
  const s = laeuft ? Math.sin(t * 9) * 0.55 : 0;
  f.beinL.rotation.x = s; f.beinR.rotation.x = -s; f.armL.rotation.x = -s * 0.8; f.armR.rotation.x = s * 0.8;
  f.inner.position.y = laeuft ? Math.abs(Math.sin(t * 9)) * 0.04 : 0;
  f.armL.rotation.z = 0; f.armR.rotation.z = 0; f.inner.rotation.x = 0; f.kopf.rotation.x = 0;
  if (pose === "winken") { f.armR.rotation.z = 2.6 + Math.sin(t * 10) * 0.3; }
  if (pose === "jubel") { f.armL.rotation.z = -2.7; f.armR.rotation.z = 2.7; f.inner.position.y = Math.abs(Math.sin(t * 7)) * 0.15; }
  if (pose === "tippen") { f.armL.rotation.x = -1.2 + Math.sin(t * 18) * 0.08; f.armR.rotation.x = -1.2 - Math.sin(t * 18) * 0.08; }
  if (pose === "lesen") { f.armL.rotation.x = -1.3; f.armR.rotation.x = -1.3; f.kopf.rotation.x = 0.3; }
  if (pose === "essen") { f.armR.rotation.x = -1.6 + Math.abs(Math.sin(t * 4)) * 0.9; }
  if (pose === "reden") { f.armR.rotation.x = -0.6 + Math.sin(t * 5) * 0.4; f.kopf.rotation.y = Math.sin(t * 2) * 0.15; }
}
export function baueBaby(haut) {
  const g = new THREE.Group();
  kug(0.13, haut, 0, 0.1, -0.25, g); const k = box(0.3, 0.16, 0.45, "#f7f3ff", 0, 0.08, 0.05, g); k.castShadow = true;
  box(0.32, 0.06, 0.32, "#fde7ef", 0, 0.17, 0.12, g);
  return g;
}
export function baueStern() {
  const s = new THREE.Shape(); for (let i = 0; i < 10; i++) { const a = -Math.PI / 2 + i * Math.PI / 5, r = i % 2 ? 0.09 : 0.2; const x = Math.cos(a) * r, y = -Math.sin(a) * r; i ? s.lineTo(x, y) : s.moveTo(x, y); }
  const m = new THREE.Mesh(new THREE.ExtrudeGeometry(s, { depth: 0.06, bevelEnabled: false }), new THREE.MeshLambertMaterial({ color: "#f2c14e", emissive: "#6b4e00" }));
  m.geometry.center(); return m;
}
export function baueStorch() {
  const g = new THREE.Group();
  const k = kug(0.35, "#ffffff", 0, 0, 0, g); k.scale.set(1.3, 0.8, 0.8);
  kug(0.16, "#ffffff", 0.48, 0.25, 0, g); const sn = cyl(0.03, 0.06, 0.45, "#f28c28", 0.82, 0.22, 0, g, 6); sn.rotation.z = Math.PI / 2;
  const fl = (z) => { const f = box(0.7, 0.04, 0.55, "#f4f4f4", -0.05, 0.12, z, g); return f; };
  g.userData.fluegel = [fl(0.45), fl(-0.45)];
  box(0.18, 0.18, 0.18, "#fde7ef", 0.2, -0.55, 0, g); cyl(0.01, 0.01, 0.4, "#cccccc", 0.2, -0.3, 0, g, 4);
  return g;
}
export function konfetti(scene, pos) {
  const teile = []; const farben = ["#f39bb0", "#f2c14e", "#6fb7e0", "#6f8f7b", "#ffffff", "#b07ad8"];
  for (let i = 0; i < 70; i++) {
    const m = box(0.08, 0.02, 0.05, farben[i % farben.length], pos.x, pos.y, pos.z, scene); m.castShadow = false;
    m.userData.v = new THREE.Vector3((Math.random() - 0.5) * 4, 3 + Math.random() * 3, (Math.random() - 0.5) * 4); teile.push(m);
  }
  return teile;
}
export { THREE };
