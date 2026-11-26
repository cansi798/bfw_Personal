/* Nordstern Leben · Bauhelfer für die offene Welt (zusammengefasste Geometrien, Schilder, Etiketten)
   © 2026 Waybuild Akademie, Waybuild UG (haftungsbeschränkt). Alle Rechte vorbehalten. · www.waybuild.de */
import * as THREE from "../lib/three.module.js";
export { THREE };
export const IS_TOUCH = window.matchMedia("(pointer:coarse)").matches;

/* Gemeinsamer Zustand aller Weltmodule, wird von weltspiel.js befüllt */
export const K = { ctx: null, scene: null, faehrt: false, fahrt: null, park: null, modus: null };

const MC = new Map();
export function lam(c, o) {
  const key = c + (o ? JSON.stringify(o) : "");
  if (!MC.has(key)) MC.set(key, new THREE.MeshLambertMaterial(Object.assign({ color: c }, o || {})));
  return MC.get(key);
}
/* Leuchtende Materialien (Fenster, Laternen), werden nachts eingeschaltet */
export const NACHT = {
  fenster: new THREE.MeshLambertMaterial({ color: "#a9d6ef", emissive: "#000000" }),
  laterne: new THREE.MeshLambertMaterial({ color: "#fff3c4", emissive: "#000000" }),
  kegel: new THREE.MeshBasicMaterial({ color: "#ffe9a6", transparent: true, opacity: 0.16, depthWrite: false }),
  neon: new THREE.MeshLambertMaterial({ color: "#f39bb0", emissive: "#000000" })
};
NACHT.kegel.visible = false;

const _m = new THREE.Matrix4(), _q = new THREE.Quaternion(), _e = new THREE.Euler(), _p = new THREE.Vector3(), _s = new THREE.Vector3();
export class Sammler {
  constructor() { this.teile = new Map(); }
  add(geo, farbe, x, y, z, ry, rx, rz, sx, sy, sz) {
    _e.set(rx || 0, ry || 0, rz || 0); _q.setFromEuler(_e); _p.set(x, y, z); _s.set(sx || 1, sy || 1, sz || 1);
    _m.compose(_p, _q, _s); geo.applyMatrix4(_m);
    const key = typeof farbe === "string" ? farbe : farbe.uuid;
    if (!this.teile.has(key)) this.teile.set(key, { mat: typeof farbe === "string" ? lam(farbe) : farbe, geos: [] });
    this.teile.get(key).geos.push(geo); return this;
  }
  box(w, h, d, c, x, y, z, ry) { return this.add(new THREE.BoxGeometry(w, h, d), c, x, y, z, ry); }
  cyl(rt, rb, h, c, x, y, z, seg, rx, rz, ry) { return this.add(new THREE.CylinderGeometry(rt, rb, h, seg || 10), c, x, y, z, ry, rx, rz); }
  kug(r, c, x, y, z, seg, sy) { return this.add(new THREE.SphereGeometry(r, seg || 10, Math.max(4, Math.round((seg || 10) * 0.7))), c, x, y, z, 0, 0, 0, 1, sy || 1, 1); }
  ico(r, c, x, y, z, sy) { return this.add(new THREE.IcosahedronGeometry(r, 0), c, x, y, z, 0, 0, 0, 1, sy || 1, 1); }
  /* Dreiecksprisma als Dach, Firstlinie entlang x */
  dach(w, h, d, c, x, y, z, ry) {
    const s = new THREE.Shape(); s.moveTo(-d / 2, 0); s.lineTo(d / 2, 0); s.lineTo(0, h); s.lineTo(-d / 2, 0);
    const g = new THREE.ExtrudeGeometry(s, { depth: w, bevelEnabled: false }); g.translate(0, 0, -w / 2); g.rotateY(Math.PI / 2);
    return this.add(g, c, x, y, z, ry);
  }
  scheibe(r, c, x, y, z, seg) { const g = new THREE.CircleGeometry(r, seg || 24); g.rotateX(-Math.PI / 2); return this.add(g, c, x, y, z); }
  ring(r1, r2, c, x, y, z, seg) { const g = new THREE.RingGeometry(r1, r2, seg || 32); g.rotateX(-Math.PI / 2); return this.add(g, c, x, y, z); }
  fertig(parent, o) {
    o = o || {}; const grp = new THREE.Group();
    this.teile.forEach(({ mat, geos }) => {
      const m = new THREE.Mesh(verbinde(geos), mat);
      m.castShadow = !!o.schatten && !IS_TOUCH; m.receiveShadow = o.empfang !== false; m.matrixAutoUpdate = false; m.updateMatrix(); grp.add(m);
      geos.forEach((g) => g.dispose());
    });
    this.teile.clear(); if (parent) parent.add(grp); return grp;
  }
}
export function verbinde(geos) {
  let nv = 0, ni = 0;
  geos.forEach((g) => { nv += g.attributes.position.count; ni += g.index ? g.index.count : g.attributes.position.count; });
  const pos = new Float32Array(nv * 3), nor = new Float32Array(nv * 3), idx = nv > 65000 ? new Uint32Array(ni) : new Uint16Array(ni);
  let ov = 0, oi = 0;
  geos.forEach((g) => {
    const n = g.attributes.position.count; pos.set(g.attributes.position.array, ov * 3);
    if (g.attributes.normal) nor.set(g.attributes.normal.array, ov * 3);
    if (g.index) { const a = g.index.array; for (let i = 0; i < a.length; i++) idx[oi + i] = a[i] + ov; oi += a.length; }
    else { for (let i = 0; i < n; i++) idx[oi + i] = ov + i; oi += n; }
    ov += n;
  });
  const geo = new THREE.BufferGeometry(); geo.setAttribute("position", new THREE.BufferAttribute(pos, 3)); geo.setAttribute("normal", new THREE.BufferAttribute(nor, 3));
  geo.setIndex(new THREE.BufferAttribute(idx, 1)); geo.computeBoundingSphere(); geo.computeBoundingBox(); return geo;
}

/* Schilder mit Text (CanvasTexture) */
export function textCanvas(text, o) {
  o = o || {}; const w = o.pw || 512, h = o.ph || 128, c = document.createElement("canvas"); c.width = w; c.height = h;
  zeichneSchild(c, text, o); return c;
}
export function zeichneSchild(c, text, o) {
  const x = c.getContext("2d"), w = c.width, h = c.height;
  x.clearRect(0, 0, w, h);
  if (o.bg !== "none") { x.fillStyle = o.bg || "#24323a"; rund(x, 4, 4, w - 8, h - 8, o.rad == null ? 18 : o.rad); x.fill(); }
  if (o.rand) { x.strokeStyle = o.rand; x.lineWidth = 6; rund(x, 7, 7, w - 14, h - 14, o.rad == null ? 16 : o.rad); x.stroke(); }
  x.fillStyle = o.fg || "#fffaf3"; x.textAlign = "center"; x.textBaseline = "middle";
  const zeilen = String(text).split("\n"); let gr = o.gr || Math.floor(h * 0.48 / zeilen.length * (zeilen.length > 1 ? 1.25 : 1));
  x.font = `${o.kursiv ? "italic " : ""}700 ${gr}px ${o.serif ? "'Bodoni Moda', Georgia, serif" : "Inter, system-ui, sans-serif"}`;
  const breit = Math.max(...zeilen.map((z) => x.measureText(z).width)); if (breit > w * 0.9) { gr = Math.floor(gr * w * 0.9 / breit); x.font = x.font.replace(/\d+px/, gr + "px"); }
  zeilen.forEach((z, i) => x.fillText(z, w / 2, h / 2 + (i - (zeilen.length - 1) / 2) * gr * 1.15));
}
function rund(x, a, b, w, h, r) { x.beginPath(); x.moveTo(a + r, b); x.arcTo(a + w, b, a + w, b + h, r); x.arcTo(a + w, b + h, a, b + h, r); x.arcTo(a, b + h, a, b, r); x.arcTo(a, b, a + w, b, r); x.closePath(); }
export function schild(text, w, h, o) {
  o = o || {}; const c = textCanvas(text, Object.assign({ pw: 512, ph: Math.round(512 * h / w) }, o));
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 2;
  const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshBasicMaterial({ map: t, transparent: o.bg === "none" }));
  m.userData.canvas = c; m.userData.tex = t; return m;
}
/* Etikett, das immer zur Kamera zeigt, Größe in Bildschirmanteilen */
export function etikett(text, o) {
  o = o || {}; const c = textCanvas(text, Object.assign({ pw: 512, ph: 128, rad: 60 }, o));
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace;
  const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: t, depthTest: o.tiefe !== false, transparent: true }));
  sp.userData.basis = o.groesse || 1; sp.userData.verh = 0.25; sp.scale.set(4, 1, 1); sp.renderOrder = 5; return sp;
}
/* Etiketten, die in der Verfolgerkamera eine feste Bildschirmgröße bekommen */
export const ETIKETTEN = new Set(); let PERSP = false;
export function etikettMerken(sp, welt, schirm) { sp.material.sizeAttenuation = false; sp.userData.welt = welt; sp.userData.schirm = schirm; const v = PERSP ? schirm : welt; sp.scale.set(v[0], v[1], 1); ETIKETTEN.add(sp); return sp; }
export function etikettenModus(persp) { PERSP = persp; ETIKETTEN.forEach((sp) => { if (!sp.parent) { ETIKETTEN.delete(sp); return; } const v = persp ? sp.userData.schirm : sp.userData.welt; sp.scale.set(v[0], v[1], 1); }); }
export const klemm = (v, a, b) => Math.max(a, Math.min(b, v));
export const zufall = (a, b) => a + Math.random() * (b - a);
