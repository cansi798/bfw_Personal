/* Nordstern Leben · Leute und Verkehr in der offenen Welt (Tagesabläufe, Autos an Ampeln)
   © 2026 Waybuild Akademie, Waybuild UG (haftungsbeschränkt). Alle Rechte vorbehalten. · www.waybuild.de */
import { THREE, K, IS_TOUCH, etikett, etikettMerken, zufall } from "./bau.js";
import { baueFigur, bewegeFigur } from "./welt.js";
import { routeGeh, ORTE, TEICH, AMPELN, ampelPhase } from "./stadt.js";
import { baueAuto, animiereAuto } from "./fahrzeuge.js";
import { baueTier, animiereTier } from "./tiere.js";

const pick = (a) => a[Math.floor(Math.random() * a.length)];
const HAUT = ["#f3d3bd", "#e2b18b", "#c68b5e", "#8d5a3b", "#5c3a26", "#f0c8a8"];
const HAAR = ["#2b1b12", "#5a3a22", "#a0662f", "#d8b26e", "#7a2e2a", "#1d1d1d"], GRAU = ["#c9c9c9", "#e8e8e8", "#a8a8a8"];
const KLEID = ["#7b2338", "#1f3557", "#6f8f7b", "#0f5c63", "#c9a227", "#c76b5b", "#e46b6b", "#6fb7e0", "#f2c14e", "#b07ad8", "#3a3f4a", "#f3f4f2"];
const HOSE = ["#2f3b4a", "#3d3d4a", "#4a3d33", "#24323a", "#5a6470", "#1f3557"];
const VOR_F = ["Ayşe", "Marie", "Sofia", "Hannah", "Lea", "Fatma", "Olga", "Zeynep", "Anna", "Mia", "Lina", "Emily", "Nora", "Ida"];
const VOR_M = ["Jonas", "Mehmet", "Lukas", "Ben", "Ali", "Piotr", "Finn", "Tim", "Yusuf", "Felix", "Noah", "Karl", "Emre", "Paul"];
const NACH = ["Schulz", "Yılmaz", "Nowak", "Becker", "Hoffmann", "Kaya", "Wagner", "Petersen", "Öztürk", "Lange", "Schmidt", "Koch"];
export function zufallsLook(typ) {
  const frau = typ === "frau" || typ === "seniorin" || (typ === "kind" && Math.random() < 0.5), senior = typ === "senior" || typ === "seniorin";
  const haar = frau ? pick(senior ? ["dutt", "kurz", "seitenscheitel"] : ["lang", "zopf", "pferdeschwanz", "dutt", "locken", "afro", "kurz"]) : pick(senior ? ["glatze", "kurz", "seitenscheitel"] : ["kurz", "undercut", "seitenscheitel", "locken", "afro", "glatze"]);
  return { koerper: typ === "kind" ? undefined : frau ? "frau" : "mann", haut: pick(HAUT), haar, haarfarbe: senior ? pick(GRAU) : pick(HAAR), oben: pick(KLEID), hose: pick(HOSE), rock: frau && Math.random() < 0.35,
    bart: !frau && typ !== "kind" && Math.random() < 0.45 ? pick(["dreitage", "voll", "schnurr"]) : undefined, brille: senior ? Math.random() < 0.6 : Math.random() < 0.15, frau };
}
export const SAETZE = {
  allgemein: ["Schönes Wetter heute. Fast so schön wie ein unbefristeter Vertrag.", "Ich bin auf dem Weg zur Arbeit. Oder von der Arbeit. Gleitzeit verwirrt mich.", "Haben Sie Herrn Brandt gesehen? Er sucht schon wieder seine Excel-Datei.", "Ich habe heute frei. Mein Zeitkonto hat sich bedankt.", "Wussten Sie, dass Pausen Arbeitsschutz sind? Ich nehme das sehr ernst.", "Mein Chef sagt, ich sei stets bemüht. Ich glaube, das ist kein Lob.", "Ich gehe zum Wochenmarkt. Gemüse hat keine Probezeit.", "Der Kaffee im Café Pause ist so gut, dass ich dort Überstunden mache."],
  senior: ["Früher hatten wir Lochkarten statt Zeiterfassung. Das waren noch Zeiten.", "Ich bin seit 1987 im Betriebsrat. Inzwischen nur noch ehrenhalber.", "Mein Enkel macht eine Ausbildung. Duales System, das hatten wir auch schon.", "Junge Frau, junger Mann, haben Sie heute schon Ihre Rente geplant?"],
  kind: ["Ich will später Personalerin werden. Dann darf ich alle einstellen!", "Mein Papa sagt, Hausaufgaben sind wie Arbeitszeit. Die muss man erfassen.", "Hast du einen Hund? Ich hätte gern einen Dackel.", "Wir spielen Vorstellungsgespräch. Ich bin die Chefin."],
  jogger: ["Keine Zeit, ich laufe für den Firmenlauf!", "Noch drei Runden um den Teich. Work-Life-Balance!", "Laufen ist mein Ausgleich zu den Meetings."],
  hund: ["Das ist Pixel. Er ist im Hundeteam für Mitbestimmung.", "Mein Hund hat mehr Follower als Paula Probezeit.", "Wir gehen Gassi. Zweimal täglich, wie im Arbeitsvertrag vereinbart."]
};
const HEIME = [[-7.5, 13], [-26, 13], [-40, 13], [-54, 13], [-66.5, 14], [25.2, 13], [-65, 53], [-48, 53], [-31, 53], [-63, 66], [-46, 66], [52, 66.5], [62, 66.5], [41, 66.5]];
const BAENKE = [[-2, 25.5], [11, 25.5], [-3.5, 38.5], [12, 38.5]];
const CAFE_PL = [[-10.5, 47.6], [-9.9, 46.3], [-5.5, 47.6], [-4.9, 46.3]];
let zaehler = 0;
export const LEUTE = [], AUTOS = [];
function figur(look, kind) { const f = baueFigur(Object.assign({}, look, { kind })); f.g.userData.ziel = null; K.scene.add(f.g); return f; }
export function neuerNpc(o) {
  const typ = o.typ, look = o.look || zufallsLook(typ), id = "npc" + zaehler++;
  const name = o.name || (typ === "kind" ? pick(look.frau ? VOR_F : VOR_M) : (typ === "seniorin" ? "Oma " + pick(VOR_F) : typ === "senior" ? "Opa " + pick(VOR_M) : (look.frau ? "Frau " : "Herr ") + pick(NACH)));
  const f = figur(look, typ === "kind"); f.g.userData.ziel = { typ: "npc", id };
  const n = { id, typ, name, look, f, rolle: o.rolle || "flaneur", pfad: [], tempo: (typ === "kind" ? 1.7 : typ.startsWith("senior") ? 1.1 : 1.6) * (o.rolle === "jogger" ? 2 : 1), ruhe: zufall(0, 4), sitzt: false, heim: o.heim || pick(HEIME), drinnen: false, fest: !!o.fest, auftrag: o.auftrag || null, satz: 0 };
  f.g.position.set(o.x != null ? o.x : n.heim[0], 0, o.z != null ? o.z : n.heim[1]); if (o.blick != null) f.g.rotation.y = o.blick;
  if (o.rolle === "hund") { n.hund = baueTier(Math.random() < 0.5 ? "dackel" : "hund", { farbe: pick(["#c8a06a", "#5a3a22", "#1d1d1d", "#f3f4f2"]) }); n.hund.g.scale.setScalar(0.9); K.scene.add(n.hund.g); }
  if (o.auftrag) { const m = etikettMerken(etikett("!", { bg: "#c9a227", fg: "#24323a", pw: 128, ph: 128, rad: 64, tiefe: false }), [0.75, 0.75], [0.05, 0.05]); m.position.y = 2.75; f.g.add(m); n.marker = m; m.visible = false; }
  LEUTE.push(n); return n;
}
export function initLeute() {
  const anz = IS_TOUCH ? 14 : 26;
  const rollen = ["pendler", "pendler", "pendler", "einkauf", "einkauf", "jogger", "hund", "bank", "cafe", "kind", "kind", "flaneur", "einkauf", "bank", "pendler", "cafe"];
  for (let i = 0; i < anz; i++) { const r = rollen[i % rollen.length]; const typ = r === "kind" ? "kind" : r === "bank" ? pick(["senior", "seniorin", "frau", "mann"]) : pick(["frau", "mann", "frau", "mann", "seniorin", "senior"]);
    const n = neuerNpc({ typ, rolle: r }); const p = startPunkt(n); n.f.g.position.set(p[0], 0, p[1]); }
  /* Verkehr */
  const anzA = IS_TOUCH ? 5 : 9;
  for (let i = 0; i < anzA; i++) { const li = i % SCHLEIFEN.length; const m = pick(["mini", "van", "stromer", "cabrio", "pickup", "mini", "stromer"]);
    const g = baueAuto(m, pick(["#d0533c", "#f2c14e", "#6fb7e0", "#ffffff", "#24323a", "#6f8f7b", "#7b2338", "#c9d1d8"]), IS_TOUCH ? null : zufallsLook(pick(["frau", "mann"]))); K.scene.add(g);
    const a = { g, schleife: li, d: (i * 37) % schleifen()[li].laenge, v: 0, max: zufall(6, 8.5), stand: 0 }; AUTOS.push(a); }
}
function startPunkt(n) { if (n.rolle === "kind") return [20 + zufall(-3, 3), 36 + zufall(-2, 2)]; if (n.rolle === "jogger") return ringPunkt(Math.random() * 6); return [zufall(-60, 90), Math.random() < 0.5 ? 21.5 : 45.5]; }
const ringPunkt = (a) => [TEICH.x + Math.cos(a) * 9 * 1.0, TEICH.z + Math.sin(a) * 9 * 0.9];
function geheNpc(n, ziel) { n.pfad = routeGeh([n.f.g.position.x, n.f.g.position.z], ziel); n.sitzt = false; }
function naechstes(n, h) {
  const nacht = h >= 22 || h < 6;
  if (n.fest) return;
  if (nacht && !["flaneur"].includes(n.rolle)) { if (!n.drinnen) { n.ziel = "heim"; geheNpc(n, n.heim); } else n.ruhe = 20; return; }
  if (n.drinnen) { n.drinnen = false; n.f.g.visible = true; }
  switch (n.rolle) {
    case "pendler": if (h >= 6 && h < 9.5) { n.ziel = "arbeit"; geheNpc(n, pick([ORTE.werk.tor, ORTE.logistik.tor, [24, 65.6], ORTE.rathaus.tor])); }
      else if (h >= 9.5 && h < 16) { n.ziel = "bummel"; geheNpc(n, pick([ORTE.cafe.tor, ORTE.markt.tor, ORTE.park.tor, ORTE.kino.tor])); } else { n.ziel = "heim"; geheNpc(n, n.heim); } break;
    case "einkauf": n.ziel = "kaufen"; geheNpc(n, pick([[56 + zufall(-4, 4), 52.5 + zufall(-1, 1)], ORTE.boutique.tor, ORTE.tierhandlung.tor, ORTE.markt.tor, ORTE.cafe.tor])); break;
    case "jogger": { const a = Math.random() * 6.28; n.pfad = []; for (let i = 0; i < 12; i++) n.pfad.push(ringPunkt(a + i * 0.55)); if (Math.random() < 0.3) n.pfad = routeGeh([n.f.g.position.x, n.f.g.position.z], ORTE.park.tor).concat(n.pfad); n.ziel = "laufen"; break; }
    case "hund": n.ziel = "gassi"; n.pfad = routeGeh([n.f.g.position.x, n.f.g.position.z], [zufall(-8, 26), zufall(24, 39)]); break;
    case "bank": { const b = pick(BAENKE); n.ziel = "sitzen"; n.sitzPlatz = b; geheNpc(n, [b[0], b[1] + 0.6]); break; }
    case "cafe": { const b = pick(CAFE_PL); n.ziel = "sitzen"; n.sitzPlatz = [b[0], b[1] - 0.35]; geheNpc(n, b); break; }
    case "kind": n.ziel = "spielen"; n.pfad = [[20 + zufall(-3, 3), 36 + zufall(-2.5, 3)]]; n.tempo = 2.4; break;
    default: n.ziel = "bummel"; geheNpc(n, pick(Object.values(ORTE).map((o) => o.tor))); }
}
function angekommen(n) {
  if (n.ziel === "heim" || n.ziel === "arbeit") { n.drinnen = true; n.f.g.visible = false; n.ruhe = zufall(15, 40); if (n.hund) n.hund.g.visible = false; return; }
  if (n.ziel === "sitzen" && n.sitzPlatz) { n.sitzt = true; n.f.g.position.set(n.sitzPlatz[0], 0, n.sitzPlatz[1]); n.f.g.rotation.y = n.rolle === "cafe" ? 0 : Math.PI; n.ruhe = zufall(20, 45); return; }
  n.ruhe = n.ziel === "spielen" ? zufall(0.5, 2) : zufall(4, 14);
}
let regenSchirme = false;
export function leuteUpdate(dt, t, o) {
  const h = o.stunde, fx = o.fokus.x, fz = o.fokus.z, schnell = o.laeuft ? Math.max(1, o.tempo * 0.75) : 0;
  LEUTE.forEach((n) => {
    const g = n.f.g, p = g.position; let laeuft = false;
    if (o.laeuft && !n.halt) {
      if (n.ausweichen > 0) { n.ausweichen -= dt; p.x += n.ausX * dt * 4; p.z += n.ausZ * dt * 4; }
      else if (n.pfad.length) { const z = n.pfad[0], dx = z[0] - p.x, dz = z[1] - p.z, l = Math.hypot(dx, dz), v = n.tempo * dt * schnell;
        if (l <= v) { p.x = z[0]; p.z = z[1]; n.pfad.shift(); if (!n.pfad.length) angekommen(n); } else { p.x += dx / l * v; p.z += dz / l * v; g.rotation.y = Math.atan2(dx, dz); laeuft = true; } }
      else if ((n.ruhe -= dt * schnell) <= 0) naechstes(n, h);
    }
    const nah = Math.abs(p.x - fx) < o.sicht && Math.abs(p.z - fz) < o.sicht;
    const vis = !n.drinnen && nah; if (g.visible !== vis) g.visible = vis;
    if (vis) { bewegeFigur(n.f, t + n.id.length, laeuft, n.pose || null); if (n.sitzt) { n.f.beinL.rotation.x = -1.45; n.f.beinR.rotation.x = -1.45; n.f.inner.position.y = -0.36; }
      if (o.regen && !n.schirm && !n.drinnen && n.typ !== "kind") { const s = new THREE.Mesh(new THREE.ConeGeometry(0.75, 0.35, 8), new THREE.MeshLambertMaterial({ color: pick(["#d0533c", "#1f3557", "#f2c14e", "#6f8f7b", "#b07ad8"]) })); s.position.set(0.3, 2.35, 0); const st = new THREE.Mesh(new THREE.CylinderGeometry(0.015, 0.015, 0.9, 4), new THREE.MeshLambertMaterial({ color: "#3a3f4a" })); st.position.y = -0.4; s.add(st); g.add(s); n.schirm = s; }
      if (n.schirm) { n.schirm.visible = !!o.regen; if (o.regen) n.f.armR.rotation.x = -0.9; } }
    if (n.hund) { const hg = n.hund.g; hg.visible = vis; const tx = p.x - Math.sin(g.rotation.y) * 1.2 + 0.5, tz = p.z - Math.cos(g.rotation.y) * 1.2; const dx = tx - hg.position.x, dz = tz - hg.position.z, l = Math.hypot(dx, dz);
      if (l > 0.05) { hg.position.x += dx * Math.min(1, dt * 3); hg.position.z += dz * Math.min(1, dt * 3); if (l > 0.2) hg.rotation.y = Math.atan2(dx, dz); } if (vis) animiereTier(n.hund, t, l > 0.2, false); }
  });
  /* Verkehr */
  const sch = schleifen(), ph = ampelPhase(t);
  AUTOS.forEach((a) => {
    let L = sch[a.schleife];
    /* Umleitung bei Baustelle, die ersten beiden Abschnitte sind bei beiden Schleifen gleich */
    const wechsel = (ziel) => { const Z = sch[ziel], gemeinsam = Math.min(L.seg[0].l + L.seg[1].l, Z.seg[0].l + Z.seg[1].l); a.schleife = ziel; if (a.d >= gemeinsam) a.d = 0; L = sch[ziel]; };
    if (o.baustelle && L.alt != null) wechsel(L.alt); else if (!o.baustelle && L.orig != null) wechsel(L.orig);
    const st = punktAuf(L, a.d), fwx = Math.sin(st.h), fwz = Math.cos(st.h);
    let halt = false;
    if (o.laeuft) {
      const v = L.ecken[st.next]; const dE = Math.hypot(v.x - st.x, v.z - st.z);
      if (v.ampel && dE > 2.5 && dE < 8 && ph !== v.achse) halt = true;
      const hinder = (x, z, r) => { const dx = x - st.x, dz = z - st.z, vor = dx * fwx + dz * fwz, seit = Math.abs(dx * fwz - dz * fwx); return vor > 0 && vor < r && seit < 1.7; };
      AUTOS.forEach((b) => { if (b !== a && hinder(b.g.position.x, b.g.position.z, 6)) halt = true; });
      if (K.fahrt && hinder(K.fahrt.mesh.position.x, K.fahrt.mesh.position.z, 7)) halt = true;
      if (K.park && hinder(K.park.mesh.position.x, K.park.mesh.position.z, 5.5)) halt = true;
      if (o.ich && o.ich.f.g.visible && hinder(o.ich.f.g.position.x, o.ich.f.g.position.z, 5)) { halt = true; if (!a.hup && Math.random() < 0.004) { a.hup = 1; K.ctx && K.ctx.klang && hupen(); } }
      LEUTE.forEach((n) => { if (!n.drinnen && hinder(n.f.g.position.x, n.f.g.position.z, 4.2)) halt = true; });
      (o.hindernisse || []).forEach(([x, z]) => { if (hinder(x, z, 7)) halt = true; });
      const zielV = halt ? 0 : a.max; a.v += (zielV - a.v) * Math.min(1, dt * (halt ? 5 : 1.5)); a.d = (a.d + a.v * dt * Math.max(1, o.tempo * 0.5)) % L.laenge;
    }
    a.g.position.set(st.x, 0, st.z); let dh = st.h - a.g.rotation.y; while (dh > Math.PI) dh -= Math.PI * 2; while (dh < -Math.PI) dh += Math.PI * 2; a.g.rotation.y += dh * Math.min(1, dt * 8);
    const vis = Math.abs(st.x - fx) < o.sicht + 10 && Math.abs(st.z - fz) < o.sicht + 10; a.g.visible = vis; if (vis) animiereAuto(a.g, a.v, dt, t);
  });
}
let hupZeit = 0;
export function hupen(tief) {
  const c = K.ctx; if (!c || performance.now() - hupZeit < 300) return; hupZeit = performance.now();
  try { const ac = hupen.ac || (hupen.ac = new (window.AudioContext || window.webkitAudioContext)()); const t = ac.currentTime; [tief ? 330 : 440, tief ? 415 : 554].forEach((f) => { const os = ac.createOscillator(), g = ac.createGain(); os.type = "square"; os.frequency.value = f; g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(0.04, t + 0.02); g.gain.setValueAtTime(0.04, t + 0.28); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.35); os.connect(g).connect(ac.destination); os.start(t); os.stop(t + 0.4); }); } catch (e) {}
}
/* Schleifen für den Verkehr, rechte Spur */
const SCHLEIFEN = [
  [[-16, 19], [32, 19], [32, 43], [-16, 43]],
  [[32, 19], [70, 19], [70, 43], [32, 43]],
  [[-16, 43], [32, 43], [32, 68], [-16, 68]],
  [[-16, 19], [70, 19], [70, 68], [-16, 68]],
  [[32, 19], [70, 19], [70, 68], [32, 68]]
];
let _sch = null;
function schleifen() {
  if (_sch) return _sch;
  _sch = SCHLEIFEN.map((pts) => {
    const n = pts.length, ecken = [];
    for (let i = 0; i < n; i++) { const a = pts[(i - 1 + n) % n], b = pts[i], c = pts[(i + 1) % n];
      const n1 = nor(a, b), n2 = nor(b, c); let nx = n1[0] + n2[0], nz = n1[1] + n2[1]; const l = Math.hypot(nx, nz) || 1; const k = Math.max(0.5, (nx / l) * n1[0] + (nz / l) * n1[1]);
      const amp = AMPELN.some((q) => q[0] === b[0] && q[1] === b[1]); ecken.push({ x: b[0] + nx / l * 1.1 / k, z: b[1] + nz / l * 1.1 / k, ampel: amp, achse: Math.abs(b[0] - a[0]) > Math.abs(b[1] - a[1]) ? "h" : "v" }); }
    const seg = []; let laenge = 0; for (let i = 0; i < n; i++) { const p = ecken[i], q = ecken[(i + 1) % n], l = Math.hypot(q.x - p.x, q.z - p.z); seg.push({ p, q, l, von: laenge, next: (i + 1) % n }); laenge += l; }
    return { ecken, seg, laenge };
  });
  _sch[1].alt = 4; _sch[4].orig = 1;
  return _sch;
}
function nor(a, b) { const dx = b[0] - a[0], dz = b[1] - a[1], l = Math.hypot(dx, dz) || 1; return [-dz / l, dx / l]; }
function punktAuf(L, d) { const s = L.seg.find((x) => d >= x.von && d < x.von + x.l) || L.seg[0]; const k = (d - s.von) / s.l; return { x: s.p.x + (s.q.x - s.p.x) * k, z: s.p.z + (s.q.z - s.p.z) * k, h: Math.atan2(s.q.x - s.p.x, s.q.z - s.p.z), next: s.next }; }
export function npcVon(id) { return LEUTE.find((n) => n.id === id); }
export function satzFuer(n) { const l = n.typ === "kind" ? SAETZE.kind : n.typ.startsWith("senior") ? SAETZE.senior.concat(SAETZE.allgemein) : n.rolle === "jogger" ? SAETZE.jogger : n.rolle === "hund" ? SAETZE.hund : SAETZE.allgemein; n.satz = (n.satz + 1 + Math.floor(Math.random() * 3)) % l.length; return l[n.satz]; }
