/* Nordstern Leben · Kleidung, Kleiderschrank, Modeboutique und Outfits an der 3D-Figur
   © 2026 Waybuild Akademie, Waybuild UG (haftungsbeschränkt). Alle Rechte vorbehalten. · www.waybuild.de */
import { THREE, MOEBEL, baueFigur, bewegeFigur } from "./welt.js";

let C = null;
const $ = (id) => document.getElementById(id);

/* ---------- Materialien (eigener Cache, die Materialien aus welt.js bleiben unberührt) ---------- */
const MATS = new Map();
function m(c, extra) {
  const k = c + (extra ? JSON.stringify(extra) : "");
  if (!MATS.has(k)) MATS.set(k, new THREE.MeshLambertMaterial(Object.assign({ color: c }, extra || {})));
  return MATS.get(k);
}
const doppelt = (c) => m(c, { side: THREE.DoubleSide });
function mix(c, z, k) { return "#" + new THREE.Color(c).lerp(new THREE.Color(z), k).getHexString(); }
const hell = (c, k) => mix(c, "#ffffff", k), dunkel = (c, k) => mix(c, "#000000", k);

export const FARBEN = ["#f3f4f2", "#9aa5ae", "#24323a", "#1f3557", "#3b5a8a", "#6fb7e0", "#0f5c63", "#6f8f7b", "#4f9a5f", "#c9a227", "#e0a72e", "#c76b5b", "#7b2338", "#f39bb0", "#b07ad8", "#8a6d4b", "#5a3a22", "#e8d9bf"];
export const KATS = [["oben", "Oberteil"], ["unten", "Unterteil"], ["schuhe", "Schuhe"], ["kopf", "Kopfbedeckung"], ["brille", "Brille"], ["tasche", "Tasche"], ["acc", "Schmuck und Accessoires"]];
export const ANLAESSE = [["alltag", "Alltag"], ["arbeit", "Arbeit"], ["freizeit", "Freizeit und Sport"], ["party", "Party"], ["schlafen", "Schlafen"]];
const OPTIONAL = { kopf: 1, brille: 1, tasche: 1 };

/* ---------- Helfer für Anbauteile ----------
   Anbauteile hängen an Ankergruppen (Rumpf, Arme, Beine, Kopf). Die Anker werden aus den Maßen der
   Grundfigur skaliert, damit die Kleidung auch auf andere Körperformen aus baueFigur passt. */
function H(f) {
  const add = (p, geo, c, x, y, z) => {
    const a = f.erw.anker.get(p); let par = p; if (a) { par = a.g; y -= a.dy; }
    const me = new THREE.Mesh(geo, typeof c === "string" ? m(c) : c); me.position.set(x, y, z); me.castShadow = true; par.add(me); f.erw.teile.push(me); return me;
  };
  return {
    add,
    box: (p, w, h, d, c, x, y, z) => add(p, new THREE.BoxGeometry(w, h, d), c, x, y, z),
    kug: (p, r, c, x, y, z) => add(p, new THREE.SphereGeometry(r, 14, 10), c, x, y, z),
    zyl: (p, rt, rb, h, c, x, y, z, seg) => add(p, new THREE.CylinderGeometry(rt, rb, h, seg || 16), c, x, y, z),
    tor: (p, r, t, c, x, y, z, bogen) => add(p, new THREE.TorusGeometry(r, t, 8, 26, bogen || Math.PI * 2), c, x, y, z),
    halb: (p, r, c, x, y, z) => add(p, new THREE.SphereGeometry(r, 18, 8, 0, Math.PI * 2, 0, Math.PI / 2), c, x, y, z)
  };
}
/* Grundteile der Figur aus baueFigur erkennen, ohne welt.js zu ändern.
   Erkannt wird über die Farben des Looks und die Lage in den Gruppen, nicht über feste Indizes. */
const hex = (me) => me && me.material && me.material.color ? "#" + me.material.color.getHexString() : "";
const lc = (c) => String(c || "").toLowerCase();
function inSub(o, g) { while (o) { if (o === g) return true; o = o.parent; } return false; }
function masse(me) {
  me.geometry.computeBoundingBox(); const bb = me.geometry.boundingBox;
  return { sz: bb.getSize(new THREE.Vector3()).multiply(me.scale), c: bb.getCenter(new THREE.Vector3()).multiply(me.scale).add(me.position) };
}
const vol = (me) => { const s = masse(me).sz; return s.x * s.y * s.z; };
function basis(f, look) {
  if (f.erw) return f.erw;
  look = look || {};
  const alle = []; f.g.traverse((o) => { if (o.isMesh) alle.push(o); });
  const imKopf = (o) => inSub(o, f.kopf), imBein = (o) => inSub(o, f.beinL) || inSub(o, f.beinR), imArm = (o) => inSub(o, f.armL) || inSub(o, f.armR);
  const kopfHaut = alle.find((o) => imKopf(o) && o.geometry.type === "SphereGeometry") || f.kopf.children[0];
  const hautHex = hex(kopfHaut);
  let obenHex = lc(look.oben), hoseHex = lc(look.hose);
  const rumpfKand = f.inner.children.filter((o) => o.isMesh && hex(o) !== hautHex).sort((a, b) => vol(b) - vol(a));
  const torso = rumpfKand.find((o) => obenHex && hex(o) === obenHex) || rumpfKand.find((o) => o.geometry.type === "BoxGeometry") || rumpfKand[0];
  if (!obenHex) obenHex = hex(torso);
  const beinMesh = alle.filter((o) => inSub(o, f.beinL) && hex(o) !== hautHex).sort((a, b) => vol(b) - vol(a))[0];
  if (!hoseHex) hoseHex = hex(beinMesh);
  const oben = alle.filter((o) => !imKopf(o) && !imBein(o) && hex(o) === obenHex);
  const aermel = oben.filter(imArm);
  const unten = alle.filter((o) => !imKopf(o) && !imArm(o) && o !== torso && hex(o) === hoseHex && (obenHex !== hoseHex || imBein(o) || o.geometry.type === "CylinderGeometry"));
  const rock = unten.filter((o) => !imBein(o) && o.geometry.type === "CylinderGeometry");
  const hosen = unten.filter((o) => !rock.includes(o));
  const schuhe = alle.filter((o) => imBein(o) && !unten.includes(o) && hex(o) !== hautHex);
  const haarHex = lc(look.haarfarbe);
  const kopfTeile = alle.filter((o) => imKopf(o) && o !== kopfHaut);
  const haar = kopfTeile.filter((o) => (haarHex ? hex(o) === haarHex : o.geometry.type !== "BoxGeometry" && vol(o) > 0.0005) && (o.position.z < 0.1 || o.position.y > 0));
  const brille = kopfTeile.filter((o) => hex(o) === "#1d1d1d");
  const orig = new Map([...new Set(oben.concat(unten, schuhe, haar, brille, [torso]))].filter(Boolean).map((o) => [o, { mat: o.material, vis: o.visible, sc: o.scale.clone(), pos: o.position.clone() }]));
  /* Ankergruppen mit Skalierung nach den Maßen der Grundfigur */
  const anker = new Map();
  const neu = (parent, pos, sc, dy) => { const g = new THREE.Group(); g.position.copy(pos); g.scale.copy(sc); parent.add(g); return { g, dy }; };
  const tm = masse(torso);
  anker.set(f.inner, neu(f.inner, new THREE.Vector3(0, tm.c.y, tm.c.z), new THREE.Vector3(tm.sz.x / 0.5, tm.sz.y / 0.64, tm.sz.z / 0.3), 1.14));
  [f.armL, f.armR].forEach((a) => { const sl = alle.filter((o) => inSub(o, a) && hex(o) !== hautHex).sort((x, y) => vol(y) - vol(x))[0]; const s = sl ? masse(sl).sz : new THREE.Vector3(0.13, 0.58, 0.15); anker.set(a, neu(a, new THREE.Vector3(), new THREE.Vector3(s.x / 0.13, 1, s.z / 0.15), 0)); });
  [f.beinL, f.beinR].forEach((b) => { const hm = hosen.find((o) => inSub(o, b)); const s = hm ? masse(hm).sz : new THREE.Vector3(0.19, 0.78, 0.21); anker.set(b, neu(b, new THREE.Vector3(), new THREE.Vector3(s.x / 0.19, s.y / 0.78, s.z / 0.21), 0)); });
  { const s = masse(kopfHaut).sz.x / 0.46; anker.set(f.kopf, neu(f.kopf, new THREE.Vector3(), new THREE.Vector3(s, s, s), 0)); }
  f.erw = { torso, rock, aermel, oben, hosen, schuhe, haar, brille, haut: kopfHaut.material, orig, anker, teile: [] };
  return f.erw;
}
function zurueck(f, look) {
  const b = basis(f, look);
  b.teile.forEach((t) => { if (t.parent) t.parent.remove(t); t.geometry.dispose(); }); b.teile = [];
  b.orig.forEach((o, me) => { me.material = o.mat; me.visible = o.vis; me.scale.copy(o.sc); me.position.copy(o.pos); });
}
const arme = (f) => [f.armL, f.armR], beine = (f) => [f.beinL, f.beinR];
function jacke(f, b, c, hemd, kragen) {
  const h = H(f); rumpf(b, hemd); langarm(f, b, c, true);
  h.box(f.inner, 0.555, 0.67, 0.29, c, 0, 1.14, -0.025);
  [-1, 1].forEach((s) => { const p = h.box(f.inner, 0.17, 0.66, 0.02, c, s * 0.165, 1.14, 0.162); p.rotation.z = -s * 0.07; const l = h.box(f.inner, 0.07, 0.16, 0.022, dunkel(c, 0.2), s * 0.11, 1.36, 0.175); l.rotation.z = -s * 0.45; });
  if (kragen) [-1, 1].forEach((s) => { const k = h.box(f.inner, 0.1, 0.06, 0.03, hemd, s * 0.06, 1.45, 0.14); k.rotation.z = -s * 0.5; });
  h.kug(f.inner, 0.02, "#c9a227", 0.07, 1.0, 0.175); arme(f).forEach((a) => h.box(a, 0.15, 0.04, 0.17, hemd, 0, -0.56, 0));
}
function rumpf(b, c) { b.oben.forEach((o) => { if (!b.aermel.includes(o)) o.material = m(c); }); }
function kurzarm(f, b, c, laenge) { const h = H(f); b.aermel.forEach((a) => a.material = b.haut); arme(f).forEach((a) => h.box(a, 0.155, laenge || 0.22, 0.175, c, 0, -0.08, 0)); }
function langarm(f, b, c, dick) { b.aermel.forEach((a) => { a.material = m(c); if (dick) { a.scale.x = 1.12; a.scale.z = 1.12; } }); }

/* ---------- Katalog ---------- */
export const TEILE = {
  /* Oberteile */
  tshirt: { kat: "oben", name: "T-Shirt", preis: 0, f: "#c76b5b", text: "Der Klassiker. Passt zu allem außer zur Kündigungsfrist.",
    bau(f, b, c) { rumpf(b, c); kurzarm(f, b, c); } },
  sportshirt: { kat: "oben", name: "Funktionsshirt", preis: 25, f: "#6fb7e0", text: "Atmungsaktiv, ideal für Sport und Inventur am Monatsende.",
    bau(f, b, c) { const h = H(f); rumpf(b, c); kurzarm(f, b, c); [-0.252, 0.252].forEach((x) => h.box(f.inner, 0.012, 0.6, 0.1, "#f3f4f2", x, 1.14, 0)); h.box(f.inner, 0.2, 0.03, 0.01, hell(c, 0.5), 0, 1.3, 0.152); } },
  bluse: { kat: "oben", name: "Bluse", preis: 35, f: "#f3f4f2", text: "Fließender Stoff, knitterfrei bis zur dritten Besprechung.",
    bau(f, b, c) { const h = H(f); rumpf(b, c); langarm(f, b, c); const k = h.tor(f.inner, 0.1, 0.028, hell(c, 0.3), 0, 1.465, 0.02); k.rotation.x = Math.PI / 2;
      [1.34, 1.2, 1.06].forEach((y) => h.kug(f.inner, 0.018, dunkel(c, 0.25), 0, y, 0.152)); arme(f).forEach((a) => h.box(a, 0.145, 0.05, 0.165, hell(c, 0.3), 0, -0.52, 0)); } },
  hemd: { kat: "oben", name: "Hemd", preis: 0, f: "#f3f4f2", text: "Gebügelt. Herr Brandt bügelt seines seit 1998 nicht mehr.",
    bau(f, b, c) { const h = H(f); rumpf(b, c); langarm(f, b, c);
      [-1, 1].forEach((s) => { const k = h.box(f.inner, 0.12, 0.07, 0.03, hell(c, 0.2), s * 0.065, 1.45, 0.14); k.rotation.z = -s * 0.5; });
      h.box(f.inner, 0.035, 0.6, 0.01, hell(c, 0.15), 0, 1.13, 0.152); [1.32, 1.16, 1.0].forEach((y) => h.kug(f.inner, 0.014, dunkel(c, 0.35), 0, y, 0.158)); } },
  pullover: { kat: "oben", name: "Pullover", preis: 40, f: "#6f8f7b", text: "Kuschelig, aber professionell. Wie eine gute Mitarbeiterbefragung.",
    bau(f, b, c) { const h = H(f); rumpf(b, c); b.torso.scale.multiply(new THREE.Vector3(1.05, 1.02, 1.08)); langarm(f, b, c, true);
      h.box(f.inner, 0.535, 0.07, 0.335, dunkel(c, 0.15), 0, 0.86, 0); h.zyl(f.inner, 0.1, 0.11, 0.08, dunkel(c, 0.1), 0, 1.49, 0); arme(f).forEach((a) => h.box(a, 0.16, 0.07, 0.18, dunkel(c, 0.15), 0, -0.52, 0)); } },
  hoodie: { kat: "oben", name: "Hoodie „Ich bin im Meeting“", preis: 45, f: "#24323a", text: "Signalisiert Beschäftigung, auch wenn Sie nur Kekse holen.",
    bau(f, b, c) { const h = H(f); rumpf(b, c); b.torso.scale.multiply(new THREE.Vector3(1.06, 1.02, 1.1)); langarm(f, b, c, true);
      const kap = h.kug(f.inner, 0.18, c, 0, 1.5, -0.17); kap.scale.set(1.15, 0.8, 0.75);
      h.box(f.inner, 0.32, 0.15, 0.02, dunkel(c, 0.15), 0, 1.0, 0.168); [-0.05, 0.05].forEach((x) => h.box(f.inner, 0.014, 0.15, 0.01, "#f3f4f2", x, 1.36, 0.168));
      h.box(f.inner, 0.18, 0.045, 0.01, "#f3f4f2", 0, 1.22, 0.169); arme(f).forEach((a) => h.box(a, 0.16, 0.07, 0.18, dunkel(c, 0.15), 0, -0.52, 0)); } },
  kleid: { kat: "oben", name: "Kleid", preis: 60, f: "#7b2338", text: "Für Sommerfest und Betriebsjubiläum. Das Unterteil bleibt dann im Schrank.", ganz: true,
    bau(f, b, c) { const h = H(f); rumpf(b, c); arme(f).forEach((a) => h.box(a, 0.152, 0.13, 0.172, c, 0, -0.04, 0)); b.aermel.forEach((a) => a.material = b.haut);
      const r = h.zyl(f.inner, 0.26, 0.42, 0.52, c, 0, 0.6, 0, 20); r.scale.z = 0.8; h.box(f.inner, 0.51, 0.05, 0.31, dunkel(c, 0.25), 0, 0.88, 0);
      b.hosen.forEach((x) => x.material = b.haut); } },
  blazer: { kat: "oben", name: "Blazer-Kombi", preis: 90, f: "#1f3557", text: "Blazer mit Shirt darunter. Wirkt sofort wie Personalleitung.",
    bau(f, b, c) { jacke(f, b, c, "#f6f4ef", false); } },
  sakko: { kat: "oben", name: "Sakko mit Hemd", preis: 85, f: "#8a6d4b", text: "Ein Sakko wie das von Herrn Brandt, nur ohne die 27 Dienstjahre.",
    bau(f, b, c) { jacke(f, b, c, "#f3f4f2", true); } },
  anzug: { kat: "oben", name: "Anzug mit Krawatte", preis: 140, f: "#24323a", text: "Sakko und Hose aus einem Stoff, Hemd und Krawatte inklusive. Für Gehaltsverhandlungen.", ganz: true,
    bau(f, b, c) { const h = H(f); jacke(f, b, c, "#f3f4f2", true); b.hosen.forEach((x) => x.material = m(c)); beine(f).forEach((p) => h.box(p, 0.01, 0.7, 0.01, dunkel(c, 0.25), 0, -0.39, 0.106));
      h.box(f.inner, 0.05, 0.045, 0.03, "#7b2338", 0, 1.43, 0.165); h.box(f.inner, 0.06, 0.3, 0.012, "#7b2338", 0, 1.25, 0.164); } },
  kostuem: { kat: "oben", name: "Kostüm", preis: 130, f: "#0f5c63", text: "Jacke und Rock aus einem Stoff. Frau Demir trägt so etwas zur Betriebsversammlung.", ganz: true,
    bau(f, b, c) { const h = H(f); jacke(f, b, c, "#f6f4ef", false); b.hosen.forEach((x) => x.material = b.haut); const r = h.zyl(f.inner, 0.27, 0.35, 0.46, c, 0, 0.75, 0, 20); r.scale.z = 0.8; } },
  polo: { kat: "oben", name: "Poloshirt", preis: 30, f: "#4f9a5f", text: "Mit Kragen. Für den Betriebsausflug zum Minigolf.",
    bau(f, b, c) { const h = H(f); rumpf(b, c); kurzarm(f, b, c); [-1, 1].forEach((s) => { const k = h.box(f.inner, 0.12, 0.06, 0.03, hell(c, 0.15), s * 0.065, 1.45, 0.14); k.rotation.z = -s * 0.5; });
      h.box(f.inner, 0.035, 0.16, 0.01, hell(c, 0.2), 0, 1.36, 0.152); [1.38, 1.31].forEach((y) => h.kug(f.inner, 0.013, "#f3f4f2", 0, y, 0.158)); } },
  weste: { kat: "oben", name: "Weste mit Hemd", preis: 40, f: "#5a3a22", text: "Hemd und Weste. Hält warm und sieht nach Prokura aus.",
    bau(f, b, c) { const h = H(f); rumpf(b, "#f3f4f2"); langarm(f, b, "#f3f4f2"); h.box(f.inner, 0.53, 0.6, 0.29, c, 0, 1.11, -0.02);
      [-1, 1].forEach((s) => { const p = h.box(f.inner, 0.19, 0.58, 0.02, c, s * 0.155, 1.1, 0.16); p.rotation.z = -s * 0.08; });
      [1.2, 1.08, 0.96].forEach((y) => h.kug(f.inner, 0.016, "#c9a227", 0.05, y, 0.172)); } },
  schlafanzug: { kat: "oben", name: "Schlafanzug-Oberteil", preis: 0, f: "#9fb8d8", text: "Mit kleinen Sternen. Ruhezeit nach dem Arbeitszeitgesetz, elf Stunden.",
    bau(f, b, c) { const h = H(f); rumpf(b, c); langarm(f, b, c); h.box(f.inner, 0.1, 0.1, 0.01, hell(c, 0.4), 0.12, 1.28, 0.152);
      [[-0.15, 1.05], [0.1, 0.95], [-0.05, 1.35], [0.15, 1.12], [-0.12, 1.24]].forEach(([x, y]) => h.kug(f.inner, 0.018, "#f2c14e", x, y, 0.15)); arme(f).forEach((a) => h.box(a, 0.14, 0.04, 0.16, hell(c, 0.4), 0, -0.54, 0)); } },
  warnweste: { kat: "oben", name: "Warnweste aus dem Lager", preis: 0, not: true, f: "#e8e04a", text: "Arbeitsschutz trifft Haute Couture.",
    bau(f, b, c) { const h = H(f); rumpf(b, c); langarm(f, b, "#9aa5ae"); [1.0, 1.22].forEach((y) => h.box(f.inner, 0.52, 0.04, 0.32, "#dfe3e6", 0, y, 0)); } },
  /* Unterteile */
  stoffhose: { kat: "unten", name: "Stoffhose", preis: 0, f: "#2f3b4a", text: "Mit Bügelfalte. Die Falte ist schärfer als jede Abmahnung.",
    bau(f, b, c) { const h = H(f); b.hosen.forEach((x) => x.material = m(c)); beine(f).forEach((p) => h.box(p, 0.01, 0.7, 0.01, dunkel(c, 0.2), 0, -0.39, 0.106)); } },
  jeans: { kat: "unten", name: "Jeans", preis: 0, f: "#3b5a8a", text: "Robust wie ein unbefristeter Vertrag.",
    bau(f, b, c) { const h = H(f); b.hosen.forEach((x) => x.material = m(c)); beine(f).forEach((p) => h.box(p, 0.2, 0.05, 0.22, hell(c, 0.15), 0, -0.71, 0));
      h.box(f.inner, 0.51, 0.05, 0.31, "#5a3a22", 0, 0.85, 0); h.box(f.inner, 0.05, 0.04, 0.01, "#c9a227", 0, 0.85, 0.158); } },
  chino: { kat: "unten", name: "Chinohose", preis: 35, f: "#c9b48a", text: "Bequem und schick. Der Kompromiss zwischen Jeans und Tarifvertrag.",
    bau(f, b, c) { const h = H(f); b.hosen.forEach((x) => x.material = m(c)); beine(f).forEach((p) => h.box(p, 0.2, 0.06, 0.22, dunkel(c, 0.12), 0, -0.71, 0)); h.box(f.inner, 0.51, 0.05, 0.31, "#3a2a22", 0, 0.85, 0); } },
  rock: { kat: "unten", name: "Rock", preis: 40, f: "#24323a", text: "Knielang. Passt auch zum Vorstellungsgespräch.",
    bau(f, b, c) { const h = H(f); b.hosen.forEach((x) => x.material = b.haut); const r = h.zyl(f.inner, 0.27, 0.37, 0.44, c, 0, 0.76, 0, 20); r.scale.z = 0.8; } },
  shorts: { kat: "unten", name: "Shorts", preis: 25, f: "#8a6d4b", text: "Für Sommer, Sport und die Grillfeier des Betriebsrats.",
    bau(f, b, c) { const h = H(f); b.hosen.forEach((x) => x.material = b.haut); beine(f).forEach((p) => h.box(p, 0.212, 0.32, 0.232, c, 0, -0.14, 0)); } },
  schlafhose: { kat: "unten", name: "Schlafanzughose", preis: 0, f: "#9fb8d8", text: "Gehört zum Schlafanzug. Nicht fürs Meeting, auch nicht per Video.",
    bau(f, b, c) { const h = H(f); b.hosen.forEach((x) => x.material = m(c)); beine(f).forEach((p, i) => h.box(p, 0.01, 0.72, 0.01, hell(c, 0.45), i ? 0.097 : -0.097, -0.39, 0)); } },
  jogginghose: { kat: "unten", name: "Jogginghose mit Knieblasen", preis: 0, not: true, f: "#9aa0a6", text: "Das Homeoffice hat Spuren hinterlassen.",
    bau(f, b, c) { const h = H(f); b.hosen.forEach((x) => x.material = m(c)); beine(f).forEach((p) => { const k = h.kug(p, 0.075, c, 0, -0.42, 0.075); k.scale.set(1, 0.8, 0.6); h.box(p, 0.2, 0.06, 0.22, dunkel(c, 0.2), 0, -0.7, 0); }); } },
  /* Schuhe */
  sneaker: { kat: "schuhe", name: "Sneaker", preis: 0, f: "#f3f4f2", text: "Bequem für lange Wege zum Kopierer.",
    bau(f, b, c) { const h = H(f); b.schuhe.forEach((x) => x.material = m(c)); beine(f).forEach((p) => { h.box(p, 0.212, 0.03, 0.312, c === "#f3f4f2" ? "#c9d1d8" : "#ffffff", 0, -0.815, 0.04); h.box(p, 0.006, 0.03, 0.12, hell(c, 0.6), 0.102, -0.77, 0.04); }); } },
  halbschuhe: { kat: "schuhe", name: "Halbschuhe", preis: 0, f: "#3a2a22", text: "Glänzend poliert für den Termin bei der Geschäftsführung.",
    bau(f, b, c) { const h = H(f); b.schuhe.forEach((x) => x.material = m(c)); beine(f).forEach((p) => h.box(p, 0.205, 0.025, 0.305, dunkel(c, 0.4), 0, -0.815, 0.04)); } },
  stiefel: { kat: "schuhe", name: "Stiefel", preis: 45, f: "#5a3a22", text: "Wetterfest für den Weg zur Arbeit, auch bei Schneeregen.",
    bau(f, b, c) { const h = H(f); b.schuhe.forEach((x) => x.material = m(c)); beine(f).forEach((p) => h.box(p, 0.206, 0.3, 0.226, c, 0, -0.62, 0)); } },
  ballerinas: { kat: "schuhe", name: "Ballerinas", preis: 30, f: "#f39bb0", text: "Leicht wie ein Freitag ohne Termine.",
    bau(f, b, c) { const h = H(f); b.schuhe.forEach((x) => { x.material = m(c); x.scale.y = 0.6; x.position.y = -0.795; }); beine(f).forEach((p) => h.kug(p, 0.03, dunkel(c, 0.2), 0, -0.77, 0.18)); } },
  sandalen: { kat: "schuhe", name: "Sandalen", preis: 20, f: "#8a6d4b", text: "Luftig. Bitte ohne Socken, sagt die Modepolizei.",
    bau(f, b, c) { const h = H(f); b.schuhe.forEach((x) => x.material = b.haut); beine(f).forEach((p) => { h.box(p, 0.205, 0.03, 0.31, c, 0, -0.815, 0.04); h.box(p, 0.21, 0.025, 0.06, c, 0, -0.77, 0.11); h.box(p, 0.21, 0.025, 0.05, c, 0, -0.77, -0.04); }); } },
  hausschuhe: { kat: "schuhe", name: "Hausschuhe", preis: 0, f: "#f3d6c6", text: "Flauschig. Das Homeoffice-Geheimnis von Frau Demir.",
    bau(f, b, c) { const h = H(f); b.schuhe.forEach((x) => { x.material = m(c); x.scale.set(1.15, 1.25, 1.1); }); beine(f).forEach((p) => h.kug(p, 0.05, hell(c, 0.5), 0, -0.74, 0.19)); } },
  socken_sandalen: { kat: "schuhe", name: "Socken in Sandalen", preis: 0, not: true, f: "#f3f4f2", text: "Die Modepolizei lädt zur Anhörung.",
    bau(f, b, c) { const h = H(f); b.schuhe.forEach((x) => x.material = m(c)); beine(f).forEach((p) => { h.box(p, 0.205, 0.16, 0.225, c, 0, -0.68, 0); h.box(p, 0.21, 0.03, 0.31, "#8a6d4b", 0, -0.815, 0.04); h.box(p, 0.212, 0.025, 0.06, "#8a6d4b", 0, -0.77, 0.1); }); } },
  /* Kopfbedeckungen */
  muetze: { kat: "kopf", name: "Strickmütze", preis: 20, f: "#c76b5b", text: "Mit Bommel. Hält warm bei kalten Kündigungsgesprächen.",
    bau(f, b, c) { const h = H(f); h.halb(f.kopf, 0.268, c, 0, 0.08, -0.01); h.zyl(f.kopf, 0.272, 0.272, 0.07, dunkel(c, 0.15), 0, 0.1, -0.01, 20); h.kug(f.kopf, 0.07, hell(c, 0.45), 0, 0.37, -0.01); } },
  hut: { kat: "kopf", name: "Hut", preis: 45, f: "#8a6d4b", text: "Elegant. Hut ab vor jeder gut geführten Personalakte.",
    bau(f, b, c) { const h = H(f); h.zyl(f.kopf, 0.38, 0.38, 0.02, c, 0, 0.14, -0.01, 24); h.zyl(f.kopf, 0.19, 0.225, 0.22, c, 0, 0.26, -0.01, 20); h.zyl(f.kopf, 0.226, 0.229, 0.05, dunkel(c, 0.4), 0, 0.17, -0.01, 20); } },
  cap: { kat: "kopf", name: "Cap „Team Lohnbuchhaltung“", preis: 20, f: "#0f5c63", text: "Schirm nach vorne, Blick auf die Zahlen.",
    bau(f, b, c) { const h = H(f); h.halb(f.kopf, 0.258, c, 0, 0.07, -0.01); const s = h.box(f.kopf, 0.24, 0.02, 0.17, c, 0, 0.08, 0.27); s.rotation.x = -0.12; h.kug(f.kopf, 0.025, dunkel(c, 0.25), 0, 0.33, -0.01); h.box(f.kopf, 0.1, 0.05, 0.01, "#f3f4f2", 0, 0.18, 0.23); } },
  haarreif: { kat: "kopf", name: "Haarreif", preis: 15, f: "#f2c14e", text: "Hält die Haare und die Konzentration zusammen.",
    bau(f, b, c) { const h = H(f); const r = h.tor(f.kopf, 0.258, 0.02, c, 0, 0.03, -0.02, Math.PI); r.rotation.x = -0.35; h.kug(f.kopf, 0.04, hell(c, 0.3), 0.16, 0.22, 0.05); } },
  kopftuch: { kat: "kopf", name: "Kopftuch", preis: 25, f: "#6f8f7b", text: "Weicher Stoff, elegant gebunden.",
    bau(f, b, c) { const h = H(f); b.haar.forEach((x) => x.visible = false); const mt = doppelt(c);
      h.add(f.kopf, new THREE.SphereGeometry(0.262, 20, 8, 0, Math.PI * 2, 0, 0.95), mt, 0, 0.01, -0.01);
      h.add(f.kopf, new THREE.SphereGeometry(0.262, 20, 12, Math.PI / 2 + 0.95, Math.PI * 2 - 1.9, 0.95, 1.55), mt, 0, 0.01, -0.01);
      h.add(f.kopf, new THREE.CylinderGeometry(0.17, 0.31, 0.32, 20, 1, true), mt, 0, -0.32, -0.02);
      const rand = h.tor(f.kopf, 0.215, 0.018, dunkel(c, 0.15), 0, 0.0, 0.105, Math.PI); rand.rotation.z = Math.PI * 0.0; rand.scale.y = 1.05; } },
  partyhut: { kat: "kopf", name: "Partyhut aus Druckerpapier", preis: 0, not: true, f: "#f3f4f2", text: "Gefaltet aus dem Protokoll der letzten Sitzung.",
    bau(f, b, c) { const h = H(f); h.zyl(f.kopf, 0.005, 0.15, 0.32, c, 0, 0.36, -0.01, 12); h.kug(f.kopf, 0.04, "#d0533c", 0, 0.53, -0.01); } },
  /* Brillen */
  lesebrille: { kat: "brille", name: "Runde Brille", preis: 30, f: "#c9a227", text: "Macht das Kleingedruckte im Arbeitsvertrag lesbar.",
    bau(f, b, c) { const h = H(f); b.brille.forEach((x) => x.visible = false); [-0.08, 0.08].forEach((x) => { h.tor(f.kopf, 0.05, 0.009, c, x, 0.02, 0.228); h.box(f.kopf, 0.01, 0.01, 0.2, c, x * 1.65, 0.03, 0.13); }); h.box(f.kopf, 0.06, 0.01, 0.01, c, 0, 0.03, 0.23); } },
  sonnenbrille: { kat: "brille", name: "Sonnenbrille", preis: 35, f: "#24323a", text: "Für Betriebsausflüge und blendende Zahlen.",
    bau(f, b, c) { const h = H(f); b.brille.forEach((x) => x.visible = false); [-0.08, 0.08].forEach((x) => { h.box(f.kopf, 0.11, 0.075, 0.015, "#15181c", x, 0.02, 0.228); h.box(f.kopf, 0.01, 0.01, 0.2, c, x * 1.65, 0.04, 0.13); }); h.box(f.kopf, 0.28, 0.02, 0.02, c, 0, 0.06, 0.229); } },
  hornbrille: { kat: "brille", name: "Hornbrille", preis: 40, f: "#5a3a22", text: "Das Modell von Herrn Brandt, Jahrgang 1998.",
    bau(f, b, c) { const h = H(f); b.brille.forEach((x) => x.visible = false); [-0.08, 0.08].forEach((x) => { h.box(f.kopf, 0.125, 0.09, 0.02, c, x, 0.02, 0.226); h.box(f.kopf, 0.085, 0.055, 0.006, "#d8eef8", x, 0.02, 0.238); h.box(f.kopf, 0.012, 0.012, 0.2, c, x * 1.7, 0.04, 0.13); }); } },
  schutzbrille: { kat: "brille", name: "Schutzbrille aus der Werkstatt", preis: 0, not: true, f: "#9fd3e6", text: "Sicherheit geht vor, auch auf dem Laufsteg.",
    bau(f, b, c) { const h = H(f); b.brille.forEach((x) => x.visible = false); h.box(f.kopf, 0.34, 0.11, 0.05, m(c, { transparent: true, opacity: 0.7 }), 0, 0.02, 0.215); const r = h.tor(f.kopf, 0.245, 0.012, "#333a44", 0, 0.02, 0); r.rotation.x = Math.PI / 2; } },
  /* Taschen */
  shopper: { kat: "tasche", name: "Shopper „Ich mag Mitbestimmung“", preis: 30, f: "#e8d9bf", text: "Viel Platz für Einkäufe und Betriebsvereinbarungen.",
    bau(f, b, c) { const h = H(f); h.box(f.armR, 0.06, 0.34, 0.3, c, 0.07, -0.88, 0); [-0.07, 0.07].forEach((z) => h.box(f.armR, 0.012, 0.28, 0.02, dunkel(c, 0.25), 0.07, -0.64, z)); h.box(f.armR, 0.062, 0.08, 0.16, dunkel(c, 0.35), 0.07, -0.88, 0); } },
  clutch: { kat: "tasche", name: "Clutch", preis: 40, f: "#c9a227", text: "Klein und edel. Passt genau ein Lohnzettel hinein.",
    bau(f, b, c) { const h = H(f); h.box(f.armR, 0.06, 0.13, 0.26, c, 0.03, -0.62, 0.08); h.box(f.armR, 0.062, 0.02, 0.05, dunkel(c, 0.3), 0.03, -0.57, 0.08); } },
  henkeltasche: { kat: "tasche", name: "Henkeltasche", preis: 55, f: "#8a6d4b", text: "Ein Klassiker für Termine mit dem Betriebsrat.",
    bau(f, b, c) { const h = H(f); h.box(f.armR, 0.13, 0.22, 0.3, c, 0.08, -0.86, 0); const t = h.tor(f.armR, 0.09, 0.013, dunkel(c, 0.3), 0.08, -0.74, 0, Math.PI); t.rotation.y = Math.PI / 2; h.box(f.armR, 0.135, 0.03, 0.05, "#c9a227", 0.08, -0.8, 0.13); } },
  rucksack: { kat: "tasche", name: "Rucksack", preis: 35, f: "#4f9a5f", text: "Für Laptop, Brotdose und das Skript zum Tagesthema.",
    bau(f, b, c) { const h = H(f); h.box(f.inner, 0.36, 0.42, 0.15, c, 0, 1.15, -0.23); h.box(f.inner, 0.26, 0.16, 0.04, dunkel(c, 0.15), 0, 1.03, -0.32); [-0.13, 0.13].forEach((x) => h.box(f.inner, 0.05, 0.42, 0.02, dunkel(c, 0.25), x, 1.2, 0.156)); } },
  aktentasche: { kat: "tasche", name: "Aktentasche", preis: 60, f: "#5a3a22", text: "Personalakten passen genau hinein. Datenschutz inklusive.",
    bau(f, b, c) { const h = H(f); h.box(f.armR, 0.08, 0.27, 0.38, c, 0.05, -0.88, 0); h.box(f.armR, 0.02, 0.05, 0.12, dunkel(c, 0.3), 0.05, -0.73, 0); h.box(f.armR, 0.085, 0.03, 0.04, "#c9a227", 0.05, -0.79, 0.1); } },
  jutebeutel: { kat: "tasche", name: "Jutebeutel mit Lohnsteuertabelle", preis: 0, not: true, f: "#d8c9a8", text: "Immer bereit für die Abrechnung.",
    bau(f, b, c) { const h = H(f); h.box(f.armR, 0.05, 0.34, 0.28, c, 0.07, -0.9, 0); [-0.96, -0.9, -0.84].forEach((y) => h.box(f.armR, 0.052, 0.008, 0.2, "#5a5a5a", 0.07, y, 0)); h.box(f.armR, 0.012, 0.26, 0.02, c, 0.07, -0.66, 0); } },
  /* Schmuck und Accessoires */
  kette: { kat: "acc", name: "Kette", preis: 40, f: "#c9a227", text: "Mit Anhänger in Form eines Organigramms.",
    bau(f, b, c) { const h = H(f); const t = h.tor(f.inner, 0.11, 0.01, c, 0, 1.45, 0.03); t.rotation.x = Math.PI / 2 + 0.45; h.kug(f.inner, 0.026, c, 0, 1.37, 0.155); } },
  ohrringe: { kat: "acc", name: "Ohrringe", preis: 30, f: "#c9a227", text: "Funkeln wie eine fehlerfreie Gehaltsabrechnung.",
    bau(f, b, c) { const h = H(f); [-0.232, 0.232].forEach((x) => { h.kug(f.kopf, 0.024, c, x, -0.07, 0); h.kug(f.kopf, 0.016, hell(c, 0.4), x, -0.11, 0); }); } },
  uhr: { kat: "acc", name: "Armbanduhr", preis: 50, f: "#24323a", text: "Geht in der Probezeit eine Minute vor.",
    bau(f, b, c) { const h = H(f); h.zyl(f.armL, 0.082, 0.082, 0.05, c, 0, -0.49, 0); h.box(f.armL, 0.055, 0.055, 0.014, "#f3f4f2", 0, -0.49, 0.086); } },
  schal: { kat: "acc", name: "Schal", preis: 25, f: "#c76b5b", text: "Lang genug für jede Betriebsversammlung im Winter.",
    bau(f, b, c) { const h = H(f); const t = h.tor(f.inner, 0.12, 0.045, c, 0, 1.48, 0); t.rotation.x = Math.PI / 2; h.box(f.inner, 0.09, 0.32, 0.04, c, 0.09, 1.3, 0.175); h.box(f.inner, 0.09, 0.03, 0.042, hell(c, 0.35), 0.09, 1.15, 0.175); } },
  krawatte: { kat: "acc", name: "Krawatte mit Lohnsteuertabelle", preis: 35, f: "#7b2338", text: "Wer genau hinsieht, findet die Steuerklasse IV.",
    bau(f, b, c) { const h = H(f); h.box(f.inner, 0.06, 0.05, 0.03, c, 0, 1.43, 0.16); h.box(f.inner, 0.08, 0.38, 0.015, c, 0, 1.21, 0.159); const sp = h.box(f.inner, 0.056, 0.056, 0.015, c, 0, 1.02, 0.159); sp.rotation.z = Math.PI / 4;
      [1.32, 1.24, 1.16, 1.08].forEach((y) => h.box(f.inner, 0.07, 0.007, 0.004, hell(c, 0.55), 0, y, 0.168)); } },
  fliege: { kat: "acc", name: "Fliege", preis: 30, f: "#24323a", text: "Für Galas, Hochzeiten und die Weihnachtsfeier der IHK.",
    bau(f, b, c) { const h = H(f); [-1, 1].forEach((s) => { const x = h.box(f.inner, 0.07, 0.06, 0.025, c, s * 0.042, 1.43, 0.162); x.rotation.z = s * 0.35; }); h.box(f.inner, 0.026, 0.032, 0.03, dunkel(c, 0.25), 0, 1.43, 0.168); } },
  namensschild: { kat: "acc", name: "Namensschild „Hallo, ich bin neu“", preis: 0, not: true, f: "#f3f4f2", text: "Die Probezeit sieht man Ihnen an.",
    bau(f, b, c) { const h = H(f); h.box(f.inner, 0.13, 0.07, 0.01, c, -0.13, 1.32, 0.156); h.box(f.inner, 0.13, 0.016, 0.011, "#d0533c", -0.13, 1.35, 0.157); } }
};
/* Vorschläge je Körperform zuerst zeigen, gesperrt wird nichts nach Geschlecht */
export const VORSCHLAG = {
  mann: ["anzug", "sakko", "hemd", "polo", "weste", "chino", "stoffhose", "halbschuhe", "krawatte", "fliege", "uhr", "aktentasche", "cap", "hut"],
  frau: ["kleid", "kostuem", "bluse", "rock", "blazer", "ballerinas", "stiefel", "henkeltasche", "clutch", "kette", "ohrringe", "haarreif", "kopftuch", "schal"]
};
export function koerperVon(look) { return look && look.koerper ? look.koerper : look && look.rock ? "frau" : null; }
export function vorschlagRang(id) { const k = koerperVon(C && C.s && C.s.look); const l = k && VORSCHLAG[k]; const i = l ? l.indexOf(id) : -1; return i < 0 ? 99 : i; }
export const START_TEILE = ["tshirt", "hemd", "jeans", "stoffhose", "sneaker", "halbschuhe", "schlafanzug", "schlafhose", "hausschuhe"];
export const NOT_FUER = { oben: "warnweste", unten: "jogginghose", schuhe: "socken_sandalen", kopf: "partyhut", brille: "schutzbrille", tasche: "jutebeutel", acc: "namensschild" };
export const kaufbar = (id) => TEILE[id] && !TEILE[id].not && TEILE[id].preis > 0;
export const teileVon = (kat) => Object.keys(TEILE).filter((id) => TEILE[id].kat === kat && !TEILE[id].not);

/* ---------- Outfit an eine Figur anlegen ---------- */
export function kleide(f, o, look) {
  if (!f || !o) return;
  zurueck(f, look); const b = f.erw;
  b.rock.forEach((r) => r.visible = false);
  const ob = o.oben && TEILE[o.oben.id], ganz = ob && ob.ganz;
  if (!ganz && o.unten && TEILE[o.unten.id]) TEILE[o.unten.id].bau(f, b, o.unten.f);
  if (ob) ob.bau(f, b, o.oben.f);
  ["schuhe", "kopf", "brille", "tasche"].forEach((k) => { const t = o[k] && TEILE[o[k].id]; if (t) t.bau(f, b, o[k].f); });
  (o.acc || []).forEach((a) => { const t = TEILE[a.id]; if (t) t.bau(f, b, a.f); });
  f.g.traverse((x) => { if (x.isMesh) x.castShadow = true; });
}
export const kopie = (o) => JSON.parse(JSON.stringify(o));

/* ---------- Spielstand ---------- */
function standardOutfits(look) {
  const ob = look.oben || "#7b2338", ho = look.hose || "#2f3b4a";
  const unten = look.rock ? { id: "rock", f: ho } : { id: "jeans", f: "#3b5a8a" };
  const leer = { kopf: null, brille: null, tasche: null, acc: [] };
  return {
    alltag: Object.assign({ oben: { id: "tshirt", f: ob }, unten, schuhe: { id: "sneaker", f: "#f3f4f2" } }, kopie(leer)),
    arbeit: Object.assign({ oben: { id: "hemd", f: "#f3f4f2" }, unten: look.rock ? { id: "rock", f: ho } : { id: "stoffhose", f: ho }, schuhe: { id: "halbschuhe", f: "#3a2a22" } }, kopie(leer)),
    freizeit: Object.assign({ oben: { id: "tshirt", f: "#6fb7e0" }, unten: kopie(unten), schuhe: { id: "sneaker", f: "#f3f4f2" } }, kopie(leer)),
    party: Object.assign({ oben: { id: "hemd", f: ob }, unten: look.rock ? { id: "rock", f: ho } : { id: "stoffhose", f: "#24323a" }, schuhe: { id: "halbschuhe", f: "#24323a" } }, kopie(leer)),
    schlafen: Object.assign({ oben: { id: "schlafanzug", f: "#9fb8d8" }, unten: { id: "schlafhose", f: "#9fb8d8" }, schuhe: { id: "hausschuhe", f: "#f3d6c6" } }, kopie(leer))
  };
}
export function initStand(s) {
  const k = s.kleidung && typeof s.kleidung === "object" ? s.kleidung : {};
  const std = standardOutfits(s.look || {});
  k.besitz = Array.isArray(k.besitz) ? k.besitz.filter((id) => TEILE[id]) : START_TEILE.concat(s.look && s.look.rock ? ["rock"] : []);
  START_TEILE.forEach((id) => { if (!k.besitz.includes(id)) k.besitz.push(id); });
  k.outfits = k.outfits && typeof k.outfits === "object" ? k.outfits : {};
  ANLAESSE.forEach(([a]) => { if (!k.outfits[a] || !k.outfits[a].oben) k.outfits[a] = std[a]; if (!Array.isArray(k.outfits[a].acc)) k.outfits[a].acc = []; });
  if (!ANLAESSE.some(([a]) => a === k.anlass)) k.anlass = "alltag";
  k.npc = k.npc && typeof k.npc === "object" ? k.npc : {};
  if (k.vorher === undefined) k.vorher = null;
  s.kleidung = k;
}
export const neueTeile = (s) => s.kleidung.besitz.filter((id) => !START_TEILE.includes(id) && TEILE[id] && !TEILE[id].not).length;

const pick = (a) => a[Math.floor(Math.random() * a.length)];
export function zufallsOutfit(look, kind) {
  const rockOk = !!(look && look.rock);
  const ob = pick(["tshirt", "tshirt", "pullover", "hoodie", "hemd", "bluse", "sportshirt"].concat(rockOk ? ["kleid", "bluse"] : []));
  const o = { oben: { id: ob, f: pick(FARBEN) }, unten: { id: pick(["jeans", "jeans", "stoffhose", "shorts"].concat(rockOk ? ["rock", "rock"] : [])), f: pick(["#3b5a8a", "#24323a", "#2f3b4a", "#8a6d4b", "#6f8f7b", "#1f3557"]) },
    schuhe: { id: pick(["sneaker", "sneaker", "halbschuhe", "stiefel", "ballerinas"]), f: pick(["#f3f4f2", "#3a2a22", "#24323a", "#c76b5b", "#5a3a22"]) }, kopf: null, brille: null, tasche: null, acc: [] };
  if (Math.random() < 0.18) o.kopf = { id: pick(["muetze", "cap", "haarreif", "hut"]), f: pick(FARBEN) };
  if (!kind && Math.random() < 0.2) o.tasche = { id: pick(["shopper", "henkeltasche", "rucksack", "aktentasche", "clutch"]), f: pick(FARBEN) };
  if (kind && Math.random() < 0.3) o.tasche = { id: "rucksack", f: pick(FARBEN) };
  if (!kind && Math.random() < 0.35) o.acc = [{ id: pick(["kette", "uhr", "schal", "ohrringe", "krawatte", "fliege"]), f: pick(FARBEN) }];
  return o;
}

/* ---------- Anwenden auf die Figuren im Haus ---------- */
export const aktuellesOutfit = () => C.s.kleidung.outfits[C.s.kleidung.anlass] || C.s.kleidung.outfits.alltag;
function npcOutfit(id) {
  const s = C.s, npc = s.kleidung.npc;
  if (!npc[id]) {
    let look = null, kind = false;
    if (id === "partner" && s.partner) look = s.partner.look; else if (/^kind\d+$/.test(id)) { const k = s.kinder[+id.slice(4)]; if (k) { look = k.look; kind = true; } }
    if (!look) return null;
    npc[id] = zufallsOutfit(look, kind); npc[id].oben.f = look.oben || npc[id].oben.f;
  }
  return npc[id];
}
function lookVon(id) {
  const s = C.s; if (id === "ich") return s.look; if (id === "partner") return s.partner && s.partner.look;
  const k = s.kinder[+String(id).slice(4)]; return k && k.look;
}
export function anwenden(id) {
  if (!C || !C.s || !C.s.kleidung) return;
  const p = C.personen[id]; if (!p) return;
  const o = id === "ich" ? aktuellesOutfit() : (id === "partner" || /^kind\d+$/.test(id)) ? npcOutfit(id) : null;
  if (o) kleide(p.f, o, lookVon(id));
}
/* Hook aus person() in leben.js */
export function person(p) { if (C && C.s && C.s.kleidung && p && (p.id === "ich" || p.id === "partner" || /^kind\d+$/.test(p.id))) anwenden(p.id); }
export function setzeAnlass(a) { const k = C.s.kleidung; if (!k.outfits[a]) return; k.anlass = a; anwenden("ich"); }

/* Automatischer Anlass, etwa Arbeit, Homeoffice oder Party */
let auto = null;
export function anlassFuer(a, o) {
  const s = C.s; o = o || {};
  const vorher = auto ? auto.vorher : (s.kleidung.anlass === a ? null : s.kleidung.anlass);
  if (vorher === null && s.kleidung.anlass === a) return;
  auto = { anlass: a, vorher: vorher || "alltag", start: s.zeit, min: o.min || 0, max: o.max || 180, aktiv: o.aktiv || (() => true) };
  setzeAnlass(a);
}
let npcUhr = 0;
export function tick(min) {
  const s = C.s, ich = C.ich; if (!s || !ich || !s.kleidung) return;
  const k = s.kleidung;
  const schlaeft = ich.liegt && ich.aktiv && /schläft/.test(ich.aktiv.text || "");
  if (schlaeft && k.anlass !== "schlafen") { if (auto) { k.vorher = auto.vorher; auto = null; } else k.vorher = k.anlass; setzeAnlass("schlafen"); }
  else if (!schlaeft && k.anlass === "schlafen" && k.vorher) { const v = k.vorher; k.vorher = null; setzeAnlass(v); }
  if (auto) { const d = s.zeit - auto.start; if ((!auto.aktiv(ich) && d >= auto.min) || d > auto.max) { const v = auto.vorher; auto = null; if (k.anlass !== "schlafen") setzeAnlass(v); } }
  /* Partner und Kinder ziehen sich gelegentlich um */
  npcUhr += min;
  if (npcUhr > 60) {
    npcUhr = 0;
    const ids = Object.keys(C.personen).filter((id) => id === "partner" || /^kind\d+$/.test(id));
    if (ids.length && Math.random() < 0.12) {
      const id = pick(ids); let look = null, name = "", kind = false;
      if (id === "partner") { look = s.partner.look; name = s.partner.name.split(" ")[0]; } else { const kk = s.kinder[+id.slice(4)]; if (kk) { look = kk.look; name = kk.name; kind = true; } }
      if (look && C.personen[id].f.g.visible) { const o = zufallsOutfit(look, kind); k.npc[id] = o; anwenden(id); C.ui.toast(name + " hat sich umgezogen und trägt jetzt " + artikel(o.oben.id) + " in " + farbName(o.oben.f) + "."); }
    }
  }
}
const FARB_NAME = { "#f3f4f2": "Weiß", "#9aa5ae": "Grau", "#24323a": "Anthrazit", "#1f3557": "Marine", "#3b5a8a": "Jeansblau", "#6fb7e0": "Himmelblau", "#0f5c63": "Petrol", "#6f8f7b": "Salbei", "#4f9a5f": "Grün", "#c9a227": "Senf", "#e0a72e": "Sonnengelb", "#c76b5b": "Terrakotta", "#7b2338": "Bordeaux", "#f39bb0": "Rosé", "#b07ad8": "Flieder", "#8a6d4b": "Kamel", "#5a3a22": "Braun", "#e8d9bf": "Creme" };
export const farbName = (c) => FARB_NAME[c] || "Wunschfarbe";
const ART = { tshirt: "ein T-Shirt", sportshirt: "ein Funktionsshirt", bluse: "eine Bluse", hemd: "ein Hemd", pullover: "einen Pullover", hoodie: "einen Hoodie", kleid: "ein Kleid", blazer: "eine Blazer-Kombi" };
const artikel = (id) => ART[id] || TEILE[id].name;

/* ---------- 3D-Vorschau im Dialog ---------- */
let VR = null;
export function vorschau(container, look, outfit, modus) {
  if (!VR) {
    const cv = document.createElement("canvas"); cv.className = "kl-canvas"; cv.setAttribute("aria-label", "Vorschau der Figur mit Outfit");
    const r = new THREE.WebGLRenderer({ canvas: cv, antialias: true, alpha: true });
    r.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    const sc = new THREE.Scene();
    sc.add(new THREE.HemisphereLight("#fff6ea", "#8a7a6a", 1.35)); const d = new THREE.DirectionalLight("#ffffff", 1.5); d.position.set(2, 4, 3); sc.add(d);
    const cam = new THREE.PerspectiveCamera(30, 0.75, 0.1, 60);
    const sockel = new THREE.Mesh(new THREE.CylinderGeometry(0.75, 0.8, 0.06, 40), m("#e7dccb")); sockel.position.y = -0.03; sc.add(sockel);
    const steg = new THREE.Group(); sc.add(steg);
    const bahn = new THREE.Mesh(new THREE.BoxGeometry(1.6, 0.08, 9), m("#f6efe4")); bahn.position.set(0, -0.04, -2.6); steg.add(bahn);
    [-0.82, 0.82].forEach((x) => { for (let i = 0; i < 9; i++) { const l = new THREE.Mesh(new THREE.SphereGeometry(0.05, 8, 6), m("#f2c14e", { emissive: "#7a5a00" })); l.position.set(x, 0.02, 1.2 - i); steg.add(l); } });
    VR = { cv, r, sc, cam, fig: null, key: "", sockel, steg, modus: "dreh", t0: 0, laeuft: false, w: 0, h: 0 };
  }
  container.innerHTML = ""; container.appendChild(VR.cv);
  const key = JSON.stringify(look || {});
  if (!VR.fig || VR.key !== key) { if (VR.fig) VR.sc.remove(VR.fig.g); VR.fig = baueFigur(Object.assign({}, look || {}, { kind: false })); VR.sc.add(VR.fig.g); VR.key = key; }
  VR.look = look; if (outfit) kleide(VR.fig, outfit, look);
  VR.modus = modus || "dreh"; VR.t0 = performance.now();
  VR.sockel.visible = VR.modus !== "show"; VR.steg.visible = VR.modus === "show";
  VR.fig.g.position.set(0, 0, 0); VR.fig.g.rotation.set(0, 0.5, 0);
  if (!VR.laeuft) { VR.laeuft = true; requestAnimationFrame(vrSchleife); }
}
export function vorschauOutfit(outfit) { if (VR && VR.fig && outfit) kleide(VR.fig, outfit, VR.look); }
function vrSchleife(jetzt) {
  if (!VR.cv.isConnected) { VR.laeuft = false; return; }
  const w = VR.cv.clientWidth || 200, h = VR.cv.clientHeight || 260;
  if (w !== VR.w || h !== VR.h) { VR.w = w; VR.h = h; VR.r.setSize(w, h, false); VR.cam.aspect = w / h; VR.cam.updateProjectionMatrix(); }
  const t = (jetzt - VR.t0) / 1000, g = VR.fig.g;
  if (VR.modus === "show") {
    VR.cam.position.set(0, 1.7, 6.4); VR.cam.lookAt(0, 0.9, -0.6);
    const k = Math.min(1, t / 3.2); g.position.z = -5.5 + k * 5.9; g.rotation.y = 0;
    if (k < 1) bewegeFigur(VR.fig, t, true, null); else { const p = t < 4.6 ? "winken" : "jubel"; bewegeFigur(VR.fig, t, false, p); if (t > 6.5) g.rotation.y = Math.sin((t - 6.5) * 1.2) * 0.6; }
  } else {
    VR.cam.position.set(0, 1.15, 4.7); VR.cam.lookAt(0, 0.95, 0);
    g.rotation.y = Math.sin(t * 0.6) * 0.7; bewegeFigur(VR.fig, t, false, null);
  }
  VR.r.render(VR.sc, VR.cam);
  requestAnimationFrame(vrSchleife);
}

/* ---------- Kleiderschrank als Möbel ---------- */
function schrankModell(g) {
  const b = (w, h, d, c, x, y, z, extra) => { const me = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), m(c, extra)); me.position.set(x, y, z); me.castShadow = true; me.receiveShadow = true; g.add(me); return me; };
  b(1.42, 2.1, 0.6, "#c9a27a", 0, 1.08, 0); b(1.5, 0.08, 0.66, "#a8794f", 0, 2.17, 0);
  [-0.6, 0.6].forEach((x) => b(0.08, 0.04, 0.5, "#7a5233", x, 0.02, 0));
  b(0.68, 1.95, 0.03, "#d8b48a", -0.355, 1.08, 0.31); b(0.68, 1.95, 0.03, "#d8b48a", 0.355, 1.08, 0.31);
  b(0.5, 1.5, 0.012, "#cfe9f7", 0.355, 1.15, 0.33, { emissive: "#1b2c36" });
  b(0.04, 0.22, 0.04, "#c9a227", -0.06, 1.1, 0.34); b(0.04, 0.22, 0.04, "#c9a227", 0.06, 1.1, 0.34);
  b(0.6, 0.18, 0.02, "#a8794f", -0.355, 0.25, 0.33);
  /* ein Kleidungsstück schaut aus der Tür, Ordnung ist relativ */
  b(0.12, 0.3, 0.02, "#c76b5b", -0.62, 0.7, 0.33);
}

/* ---------- Kleiderschrank-Dialog ---------- */
let st = { anlass: "alltag", kat: "oben", accAktiv: null };
function istBesitz(id) { return C.s.kleidung.besitz.includes(id); }
export function kleiderschrank(startAnlass) {
  const s = C.s, esc = C.esc;
  st = { anlass: startAnlass || s.kleidung.anlass, kat: "oben", accAktiv: null };
  const k = C.dialog(`<p class="dkopf">Kleiderschrank<span id="klZahl"></span></p>
    <p class="intro">${esc(s.name)} probiert vor dem Spiegel an. Jede Änderung sehen Sie sofort an der Figur. Für jeden Anlass gibt es ein eigenes Outfit.</p>
    <div class="kl-tabs" id="klAnlass" role="group" aria-label="Anlass">${ANLAESSE.map(([a, t]) => `<button type="button" class="schnitt" data-a="${a}">${t}</button>`).join("")}</div>
    <div class="kl-wrap"><div class="kl-buehne" id="klBuehne"></div>
      <div class="kl-seite"><div class="kl-tabs klein" id="klKats" role="group" aria-label="Kategorie">${KATS.map(([kk, t]) => `<button type="button" class="schnitt" data-k="${kk}">${t}</button>`).join("")}</div>
        <div class="kl-teile" id="klTeile"></div><p class="kl-flabel" id="klFLabel"></p><div class="farben kl-farben" id="klFarben"></div></div></div>
    <p class="hinweis" id="klInfo"></p>
    <div class="reihe"><button class="btn" type="button" id="klTragen">Jetzt tragen</button><button class="btn leise" type="button" id="klShop">Zur Modeboutique</button><button class="btn leise" type="button" id="klZu">Fertig</button></div>`, "breit kl-dialog");
  vorschau($("klBuehne"), s.look, s.kleidung.outfits[st.anlass]);
  k.querySelectorAll("[data-a]").forEach((b) => b.onclick = () => { st.anlass = b.dataset.a; st.accAktiv = null; C.klang("klick"); zeichne(); });
  k.querySelectorAll("[data-k]").forEach((b) => b.onclick = () => { st.kat = b.dataset.k; st.accAktiv = null; C.klang("klick"); zeichne(); });
  $("klTragen").onclick = () => { setzeAnlass(st.anlass); C.speichern(); C.klang("kasse"); C.ui.toast(s.name + " trägt jetzt das Outfit für " + ANLAESSE.find((x) => x[0] === st.anlass)[1] + ".", "gut"); zeichne(); };
  $("klShop").onclick = () => boutique();
  $("klZu").onclick = () => { C.dialogZu(); C.speichern(); };
  zeichne();
}
function zeichne() {
  const s = C.s, esc = C.esc, o = s.kleidung.outfits[st.anlass], kat = st.kat;
  $("klZahl").textContent = s.kleidung.besitz.filter((id) => !TEILE[id].not).length + " Teile im Schrank";
  document.querySelectorAll("#klAnlass [data-a]").forEach((b) => { b.setAttribute("aria-pressed", String(b.dataset.a === st.anlass)); b.classList.toggle("traegt", b.dataset.a === s.kleidung.anlass); });
  document.querySelectorAll("#klKats [data-k]").forEach((b) => b.setAttribute("aria-pressed", String(b.dataset.k === kat)));
  const ids = teileVon(kat).sort((a, b) => (istBesitz(b) - istBesitz(a)) || (vorschlagRang(a) - vorschlagRang(b)));
  const gewaehlt = (id) => kat === "acc" ? o.acc.some((a) => a.id === id) : o[kat] && o[kat].id === id;
  let html = OPTIONAL[kat] ? `<button type="button" class="kl-teil" data-id="" aria-pressed="${!o[kat]}"><b>Keine</b><small>Ohne geht auch</small></button>` : "";
  html += ids.map((id) => { const t = TEILE[id], hat = istBesitz(id);
    return `<button type="button" class="kl-teil${hat ? "" : " zu"}" data-id="${id}" aria-pressed="${!!gewaehlt(id)}"${hat ? "" : " disabled"}><b>${esc(t.name)}${vorschlagRang(id) < 99 ? ' <em class="kl-tipp">Vorschlag</em>' : ""}</b><small>${hat ? esc(t.text) : "In der Modeboutique für " + C.euro(t.preis)}</small></button>`; }).join("");
  $("klTeile").innerHTML = html;
  $("klTeile").querySelectorAll(".kl-teil:not(:disabled)").forEach((b) => b.onclick = () => {
    const id = b.dataset.id; C.klang("klick");
    if (kat === "acc") { const i = o.acc.findIndex((a) => a.id === id); if (i >= 0 && st.accAktiv === id) { o.acc.splice(i, 1); st.accAktiv = null; } else if (i >= 0) st.accAktiv = id; else { o.acc.push({ id, f: TEILE[id].f }); st.accAktiv = id; } }
    else if (!id) o[kat] = null;
    else o[kat] = { id, f: o[kat] && o[kat].id !== id && TEILE[id].kat !== "schuhe" ? o[kat].f : TEILE[id].f };
    aktualisiere(o);
  });
  /* Farbwahl für das gewählte Teil */
  let ziel = null;
  if (kat === "acc") ziel = o.acc.find((a) => a.id === st.accAktiv) || o.acc[o.acc.length - 1] || null; else ziel = o[kat];
  if (kat === "oben" && ziel && TEILE[ziel.id] && TEILE[ziel.id].ganz) $("klInfo").textContent = "Zum Kleid bleibt das Unterteil im Schrank.";
  else $("klInfo").textContent = kat === "acc" ? "Accessoires lassen sich kombinieren. Erneut tippen wählt das Teil zum Umfärben, ein weiteres Tippen legt es ab." : "Gesperrte Teile gibt es in der Modeboutique oder als Gewinn bei der Laufsteg-Show.";
  $("klFLabel").textContent = ziel ? "Farbe für " + TEILE[ziel.id].name : "";
  $("klFarben").innerHTML = ziel ? FARBEN.map((c) => `<button type="button" class="farbe" data-c="${c}" style="background:${c}" aria-label="Farbe ${farbName(c)}" aria-pressed="${ziel.f === c}"></button>`).join("") : "";
  $("klFarben").querySelectorAll("[data-c]").forEach((b) => b.onclick = () => { ziel.f = b.dataset.c; C.klang("klick"); aktualisiere(o); });
}
function aktualisiere(o) { vorschauOutfit(o); if (st.anlass === C.s.kleidung.anlass) anwenden("ich"); C.speichern(); zeichne(); }

/* ---------- Modeboutique ---------- */
let bt = { kat: "alle", probe: null };
export function boutique() {
  const s = C.s, esc = C.esc; bt = { kat: "alle", probe: null };
  C.dialog(`<p class="dkopf">Modeboutique Nordstern Chic<span id="btGeld"></span></p>
    <p class="intro">Frisch eingetroffen. Die Verkäuferin flüstert, Herr Brandt habe schon nach einem neuen Sakko gefragt. Wir haben ihm höflich das Modell von 1998 empfohlen.</p>
    <div class="kl-wrap"><div class="kl-buehne" id="btBuehne"></div><div class="kl-seite">
      <div class="kl-tabs klein" id="btKats">${[["alle", "Alles"]].concat(KATS).map(([kk, t]) => `<button type="button" class="schnitt" data-k="${kk}">${t}</button>`).join("")}</div>
      <div class="katalog kl-shop" id="btListe"></div></div></div>
    <div class="reihe"><button class="btn" type="button" id="btSchrank">Zum Kleiderschrank</button><button class="btn leise" type="button" id="btZu">Schließen</button></div>`, "breit kl-dialog");
  vorschau($("btBuehne"), s.look, aktuellesOutfit());
  document.querySelectorAll("#btKats [data-k]").forEach((b) => b.onclick = () => { bt.kat = b.dataset.k; C.klang("klick"); liste(); });
  $("btSchrank").onclick = () => { if (s.gekauft.includes("kleiderschrank")) kleiderschrank(); else C.info("Kein Kleiderschrank", `<p>Für die Outfits braucht ${esc(s.name)} einen Kleiderschrank. Den gibt es im Möbelhaus.</p>`); };
  $("btZu").onclick = () => { C.dialogZu(); C.speichern(); };
  liste();
}
function liste() {
  const s = C.s, esc = C.esc;
  $("btGeld").textContent = "Guthaben " + C.euro(s.geld);
  document.querySelectorAll("#btKats [data-k]").forEach((b) => b.setAttribute("aria-pressed", String(b.dataset.k === bt.kat)));
  const ids = Object.keys(TEILE).filter((id) => kaufbar(id) && (bt.kat === "alle" || TEILE[id].kat === bt.kat)).sort((a, b) => (istBesitz(a) - istBesitz(b)) || (vorschlagRang(a) - vorschlagRang(b)));
  $("btListe").innerHTML = ids.map((id) => { const t = TEILE[id], hat = istBesitz(id), geht = s.geld >= t.preis;
    return `<div class="artikel${hat ? " hat" : ""}${bt.probe === id ? " probe" : ""}"><b>${esc(t.name)}${vorschlagRang(id) < 99 ? ' <em class="kl-tipp">Vorschlag</em>' : ""}</b><small>${esc(t.text)}</small><span class="preis">${C.euro(t.preis)}</span>
      <span class="kl-knoepfe"><button class="btn klein leise" type="button" data-probe="${id}">Anprobieren</button><button class="btn klein" type="button" data-kauf="${id}"${hat || !geht ? " disabled" : ""}>${hat ? "Im Schrank" : geht ? "Kaufen" : "Zu teuer"}</button></span></div>`; }).join("");
  $("btListe").querySelectorAll("[data-probe]").forEach((b) => b.onclick = () => {
    const id = b.dataset.probe, t = TEILE[id], o = kopie(aktuellesOutfit());
    if (t.kat === "acc") o.acc = [{ id, f: t.f }]; else o[t.kat] = { id, f: t.f };
    if (t.kat === "unten" && o.oben && TEILE[o.oben.id].ganz) o.oben = { id: "tshirt", f: "#f3f4f2" };
    bt.probe = id; vorschauOutfit(o); C.klang("klick"); liste();
  });
  $("btListe").querySelectorAll("[data-kauf]").forEach((b) => b.onclick = () => {
    const id = b.dataset.kauf, t = TEILE[id]; if (istBesitz(id) || s.geld < t.preis) return;
    s.geld -= t.preis; s.kleidung.besitz.push(id); C.klang("kasse");
    C.ui.toast(t.name + " gekauft und in den Kleiderschrank gehängt.", "geld"); C.speichern(); C.pruefeZiele(); liste();
  });
}
/* Geschenk oder Fund, ein zufälliges neues Teil */
export function schenke(maxPreis) {
  const frei = Object.keys(TEILE).filter((id) => kaufbar(id) && !istBesitz(id) && (!maxPreis || TEILE[id].preis <= maxPreis));
  if (!frei.length) return null;
  const id = pick(frei); C.s.kleidung.besitz.push(id); return TEILE[id];
}

/* ---------- Aktionen ---------- */
export function aktionen(ziel, a) {
  const s = C.s; if (!s) return;
  if (ziel.typ === "moebel" && ziel.id === "kleiderschrank") {
    a.push({ t: "Outfit wählen", f: () => C.geheZu(C.ich, 1.35, 3.85, () => { C.dreheZu(C.ich, 0.3, 3.85); kleiderschrank(); }) });
    a.push({ t: "Anlass wechseln", f: anlassMenue });
    a.push({ t: "Modeboutique ansehen", f: boutique });
  }
}
function anlassMenue() {
  const s = C.s;
  const k = C.dialog(`<p class="dkopf">Anlass wechseln</p><p class="intro">Was steht heute an? ${C.esc(s.name)} zieht sich passend um.</p>
    <div class="antworten">${ANLAESSE.map(([a, t], i) => `<button class="antwort" type="button" data-a="${a}"><span class="bu">${i + 1}</span><span>${t}${s.kleidung.anlass === a ? ", wird gerade getragen" : ""}</span></button>`).join("")}</div>
    <div class="reihe"><button class="btn leise" type="button" id="anZu">Abbrechen</button></div>`);
  k.querySelectorAll("[data-a]").forEach((b) => b.onclick = () => { C.dialogZu(); setzeAnlass(b.dataset.a); C.klang("klick"); C.speichern(); });
  $("anZu").onclick = C.dialogZu;
}

export function init(ctx) {
  C = ctx;
  MOEBEL.kleiderschrank = schrankModell;
  window.NL_KLEIDUNG = { anlass: (a, minuten) => { if (C.s && C.s.kleidung) anlassFuer(a, { max: minuten || 120 }); }, kleiderschrank: () => C.s && kleiderschrank(), boutique: () => C.s && boutique() };
}
