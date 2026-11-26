/* Nordstern Leben · Fahren in der offenen Welt (eigene Steuerung, Autopilot, Verfolgerkamera, Blitzer, Radio)
   © 2026 Waybuild Akademie, Waybuild UG (haftungsbeschränkt). Alle Rechte vorbehalten. · www.waybuild.de */
import { THREE, K, IS_TOUCH, klemm, lam, schild } from "./bau.js";
import { kollision, ORTE, BAHN } from "./stadt.js";
import { MODELLE, setzeFahrer, animiereAuto } from "./fahrzeuge.js";
import { achse } from "./steuerung.js";
import { LEUTE, AUTOS, hupen } from "./leute.js";

export const FAHR = { kam: null, modus: IS_TOUCH ? "hinten" : "hinten", radioAn: true, radioT: 0, radioI: 0, blitzT: 0, kollT: 0, ortNah: null };
const BLITZER = [[24, 19], [60, 43]];
const $ = (id) => document.getElementById(id);
export function initFahren(scene) {
  FAHR.kam = new THREE.PerspectiveCamera(58, innerWidth / innerHeight, 0.3, 520);
  BLITZER.forEach(([x, z]) => { const g = new THREE.Group(); g.position.set(x, 0, z - 2.9); scene.add(g);
    const p = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 2.4, 6), lam("#8a8f96")); p.position.y = 1.2; g.add(p);
    const k = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.5, 0.7), lam("#e8e1d6")); k.position.y = 2.6; g.add(k); const l = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.3, 0.05), lam("#24323a")); l.position.set(0, 2.6, 0.36); g.add(l);
    const sh = schild("Arbeitszeit\npolizei", 1.3, 0.7, { bg: "#1f3557", ph: 280 }); sh.position.set(0, 1.6, 0.1); g.add(sh); });
  const d = document.createElement("div"); d.id = "fahrHud"; d.className = "fahrhud"; d.hidden = true;
  d.innerHTML = `<div class="tacho"><b id="fTempo">0</b><small>km/h</small></div><div class="fmitte"><div id="fRadio" class="fradio"></div><div id="fOrt" class="fort" hidden></div></div>
    <div class="fknoepfe"><button type="button" class="kn" id="fAus">Aussteigen <kbd>E</kbd></button><button type="button" class="kn" id="fHeim">Nach Hause</button><button type="button" class="kn" id="fHupe">Hupe <kbd>H</kbd></button><button type="button" class="kn" id="fKam">Kamera <kbd>K</kbd></button><button type="button" class="kn" id="fRadioKn">Radio aus</button></div>`;
  document.body.appendChild(d);
  const bl = document.createElement("div"); bl.id = "blitz"; bl.className = "blitz"; document.body.appendChild(bl);
  $("fHupe").onclick = () => hupe(); $("fKam").onclick = () => kameraWechsel();
  $("fRadioKn").onclick = () => { FAHR.radioAn = !FAHR.radioAn; $("fRadioKn").textContent = FAHR.radioAn ? "Radio aus" : "Radio an"; radio(true); };
}
export function hupe() { if (!K.fahrt) return; hupen(K.fahrt.modell === "cargo"); if (K.fahrt.modell === "cargo") K.ctx.ui.toast("Kling kling! Das Lastenrad klingelt höflich."); LEUTE.forEach((n) => { const p = n.f.g.position, m = K.fahrt.mesh.position; if (Math.hypot(p.x - m.x, p.z - m.z) < 8 && !n.drinnen) { n.pose = "winken"; setTimeout(() => (n.pose = null), 1500); } }); }
export function kameraWechsel() { FAHR.modus = FAHR.modus === "hinten" ? "oben" : "hinten"; K.ctx.ui.toast(FAHR.modus === "hinten" ? "Kamera hinter dem Fahrzeug" : "Kamera von oben"); }
export function einsteigen(o) {
  const c = K.ctx, ich = c.ich; c.aufstehen(ich); ich.ziel = null; ich.dann = null;
  const m = o.mesh; setzeFahrer(m, c.s.look);
  K.fahrt = { mesh: m, modell: o.modell, farbe: o.farbe, eigen: !!o.eigen, leih: !!o.leih, v: 0, h: o.rot != null ? o.rot : m.rotation.y, nitro: 0, bremsT: 0, pilot: null };
  if (o.eigen && K.park && K.park.mesh === m) K.park = null;
  m.position.set(o.x != null ? o.x : m.position.x, 0, o.z != null ? o.z : m.position.z); m.rotation.y = K.fahrt.h;
  ich.f.g.visible = false; K.faehrt = true; document.body.classList.add("faehrt"); $("fahrHud").hidden = false;
  $("fHeim").hidden = K.modus === "rennen"; $("fAus").hidden = K.modus === "rennen";
  $("fHeim").onclick = () => o.heim && o.heim(); $("fAus").onclick = () => o.aus && o.aus();
  FAHR.aus = o.aus; FAHR.radioT = 0; radio(true); kameraSetzen(true);
  if (!K.modus) c.ui.toast(c.s.name + " steigt ein. Pfeiltasten oder WASD zum Fahren, E zum Aussteigen.");
}
export function aussteigen() {
  const f = K.fahrt; if (!f) return null; const c = K.ctx, ich = c.ich, m = f.mesh;
  setzeFahrer(m, null); K.fahrt = null; K.faehrt = false; document.body.classList.remove("faehrt"); $("fahrHud").hidden = true;
  if (f.eigen) K.park = { mesh: m, x: m.position.x, z: m.position.z, rot: m.rotation.y }; else K.scene.remove(m);
  const lx = -Math.cos(m.rotation.y), lz = Math.sin(m.rotation.y); /* rechts aussteigen, zur Gehwegseite */
  let px = m.position.x + lx * 1.7, pz = m.position.z + lz * 1.7; if (kollision(px, pz, 0.3, true)) { px = m.position.x - lx * 1.7; pz = m.position.z - lz * 1.7; }
  if (kollision(px, pz, 0.3, true)) { px = m.position.x + Math.sin(m.rotation.y) * -2.6; pz = m.position.z + Math.cos(m.rotation.y) * -2.6; }
  ich.f.g.position.set(px, 0, pz); ich.f.g.rotation.y = m.rotation.y; ich.f.g.visible = true; ich.ziel = null;
  return f;
}
export function autopilot(pfad, dann) { if (!K.fahrt) return; K.fahrt.pilot = { pfad: pfad.slice(), dann }; }
export function fahrKamera() { return K.fahrt && FAHR.modus === "hinten" ? FAHR.kam : null; }
const _v = new THREE.Vector3(), _z = new THREE.Vector3();
function kameraSetzen(sofort) {
  const f = K.fahrt; if (!f) return; const m = f.mesh, fx = Math.sin(f.h), fz = Math.cos(f.h), rad = f.modell === "cargo";
  _v.set(m.position.x - fx * (rad ? 6 : 7.5), rad ? 3.2 : 3.8, m.position.z - fz * (rad ? 6 : 7.5));
  if (kollision(_v.x, _v.z, 0.2, false) && false) _v.y += 3;
  if (sofort) FAHR.kam.position.copy(_v); else FAHR.kam.position.lerp(_v, 0.12);
  _z.set(m.position.x + fx * 4, 1.0, m.position.z + fz * 4); FAHR.kam.lookAt(_z);
  if (FAHR.kam.aspect !== innerWidth / innerHeight) { FAHR.kam.aspect = innerWidth / innerHeight; FAHR.kam.updateProjectionMatrix(); }
}
export function maxTempo(f) { return (MODELLE[f.modell] || MODELLE.mini).tempo * (K.modus === "rennen" ? 1.15 : 1); }
export function fahrUpdate(dt, t, laeuft) {
  const f = K.fahrt; if (!f) return; const c = K.ctx, m = f.mesh;
  if (laeuft) {
    const a = achse(); let max = maxTempo(f);
    if (f.nitro > 0) { f.nitro -= dt; max *= 1.55; } if (f.bremsT > 0) { f.bremsT -= dt; max *= 0.45; }
    if (K.modus === "rennen" && f.abseits) max *= 0.55;
    if (f.pilot && (a.x || a.y) && !K.modus) { f.pilot = null; c.ui.toast("Sie übernehmen das Steuer."); }
    if (f.pilot) {
      const p = f.pilot, z = p.pfad[0];
      if (!z) { const d = p.dann; f.pilot = null; f.v = 0; if (d) d(); return; }
      const dx = z[0] - m.position.x, dz = z[1] - m.position.z, l = Math.hypot(dx, dz);
      if (l < (p.pfad.length > 1 ? 1.8 : 0.5)) { p.pfad.shift(); }
      else { let soll = Math.atan2(dx, dz), dh = soll - f.h; while (dh > Math.PI) dh -= Math.PI * 2; while (dh < -Math.PI) dh += Math.PI * 2;
        f.h += klemm(dh, -3 * dt, 3 * dt); let ziel = Math.min(max * 0.9, 2 + l * 1.4) * (Math.abs(dh) > 0.8 ? 0.35 : 1);
        if (blockiert(m.position.x, m.position.z, f.h, 6)) ziel = 0; f.v += klemm(ziel - f.v, -14 * dt, max * 0.8 * dt); }
    } else {
      if (a.y > 0) f.v += max * 0.62 * dt * (f.v < 0 ? 3 : 1); else if (a.y < 0) f.v -= (f.v > 0.3 ? 16 : 5) * dt; else f.v -= Math.sign(f.v) * Math.min(Math.abs(f.v), 3.2 * dt);
      f.v = klemm(f.v, -3.5, max + (f.nitro > 0 ? 4 : 0)); if (f.v > max) f.v -= 8 * dt;
      const lenk = (f.modell === "cargo" ? 2.6 : 2.1) * klemm(Math.abs(f.v) / 3.5, 0, 1) * Math.sign(f.v || 1);
      f.h -= a.x * lenk * dt;
    }
    const nx = m.position.x + Math.sin(f.h) * f.v * dt, nz = m.position.z + Math.cos(f.h) * f.v * dt;
    const k = f.pilot ? null : kollision(nx, nz, 1.05, false) || autoTreffer(nx, nz);
    if (k && Math.abs(f.v) > 0.05) { const st = Math.abs(f.v); f.v = -f.v * 0.35; if (st > 3 && performance.now() - FAHR.kollT > 1500) { FAHR.kollT = performance.now(); c.klang("falsch"); c.ui.toast(c.pick((c.H.CRASH || ["Rumms!"])) + " " + c.pick(["Niemand verletzt, nur das Ego hat eine Delle.", "Die Versicherung schickt ein Formular in dreifacher Ausfertigung.", "Zum Glück nur Blech und ein bisschen Stolz.", "Herr Brandt trägt das in seine Excel-Liste ein."]), "rot"); } }
    else { m.position.x = nx; m.position.z = nz; }
    m.rotation.y = f.h; animiereAuto(m, f.v, dt, t);
    /* Fußgänger weichen aus */
    if (Math.abs(f.v) > 2.5) LEUTE.forEach((n) => { if (n.drinnen || n.ausweichen > 0 || n.fest) return; const p = n.f.g.position, dx = p.x - m.position.x, dz = p.z - m.position.z, vor = dx * Math.sin(f.h) + dz * Math.cos(f.h), seit = dx * Math.cos(f.h) - dz * Math.sin(f.h);
      if (vor > 0 && vor < 4.5 && Math.abs(seit) < 1.6) { const sd = seit >= 0 ? 1 : -1; n.ausweichen = 0.45; n.ausX = Math.cos(f.h) * sd; n.ausZ = -Math.sin(f.h) * sd; n.pose = "jubel"; setTimeout(() => (n.pose = null), 900);
        if (Math.random() < 0.25) c.ui.toast(n.name + " springt elegant zur Seite. " + c.pick(["Gut, dass Fußgänger Vorrang haben.", "Das war Sport ohne Fitnessstudio.", "Paula Probezeit hat es gefilmt, 12 Aufrufe."])); } });
    /* Blitzer */
    const kmh = Math.abs(f.v) * 5;
    BLITZER.forEach(([bx, bz]) => { if (!K.modus && Math.abs(m.position.x - bx) < 3 && Math.abs(m.position.z - bz) < 3.2 && kmh > 52 && performance.now() - FAHR.blitzT > 7000) { FAHR.blitzT = performance.now(); const b = $("blitz"); b.classList.add("an"); setTimeout(() => b.classList.remove("an"), 220); c.s.geld = Math.max(0, c.s.geld - 10); c.hud();
      c.ui.toast("Geblitzt von der Arbeitszeitpolizei. " + Math.round(kmh) + " km/h statt 50. Verwarnung 10 €, zahlbar in die Kaffeekasse. Der Weg zur Arbeit zählt übrigens nicht als Arbeitszeit.", "rot"); } });
    /* Radio */
    FAHR.radioT -= dt; if (FAHR.radioT <= 0) radio();
  }
  const ich = c.ich; ich.f.g.position.set(m.position.x, 0, m.position.z);
  $("fTempo").textContent = Math.round(Math.abs(f.v) * 5);
  kameraSetzen(false);
}
function blockiert(x, z, h, r) { const fx = Math.sin(h), fz = Math.cos(h); return AUTOS.some((a) => { const dx = a.g.position.x - x, dz = a.g.position.z - z, vor = dx * fx + dz * fz, seit = Math.abs(dx * fz - dz * fx); return vor > 0 && vor < r && seit < 1.6; }); }
function autoTreffer(x, z) { for (const a of AUTOS) if (Math.hypot(a.g.position.x - x, a.g.position.z - z) < 2.3) return a; if (K.park && Math.hypot(K.park.mesh.position.x - x, K.park.mesh.position.z - z) < 2.2) return K.park; return null; }
function radio(sofort) {
  const el = $("fRadio"); if (!el) return; FAHR.radioT = 11;
  if (!FAHR.radioAn) { el.textContent = ""; el.hidden = true; return; }
  const l = (K.ctx.H.RADIO || ["Radio Nordstern · Heute sonnig mit Aussicht auf Beförderung"]); FAHR.radioI = (FAHR.radioI + (sofort ? 0 : 1)) % l.length; el.hidden = false; el.textContent = "♪ " + l[FAHR.radioI];
}
export function ortHinweis(text) { const el = $("fOrt"); if (!el) return; el.hidden = !text; if (text && el.textContent !== text) el.textContent = text; }
