/* Nordstern Leben · Offene Welt, Verbindung zur Spiellogik (Orte, Fahren, Haustiere, Kamera, Steuerung)
   © 2026 Waybuild Akademie, Waybuild UG (haftungsbeschränkt). Alle Rechte vorbehalten. · www.waybuild.de */
import { THREE, K, IS_TOUCH, klemm, zufall, etikettenModus } from "./bau.js";
import { MITTE } from "./welt.js";
import { baueStadt, stadtUpdate, ladenSchildSetzen, ORTE, FREIZEIT, routeGeh, routeAuto, weglaenge, imHeim, imHaus, kollision, EINFAHRT, GRENZE, SEE, TEICH, STERN_ORTE } from "./stadt.js";
import { MODELLE, baueAuto } from "./fahrzeuge.js";
import { ARTEN, baueTier, animiereTier, stange, zufallsPunktHeim } from "./tiere.js";
import { initSteuerung, achse, richtungAktiv, EIN, eHinweis, hilfe } from "./steuerung.js";
import { initFahren, einsteigen, aussteigen, autopilot, fahrUpdate, fahrKamera, ortHinweis, hupe, kameraWechsel, FAHR } from "./fahren.js";
import { initLeute, leuteUpdate, LEUTE, npcVon, satzFuer, hupen } from "./leute.js";
import { initKarte, miniUpdate, grosseKarte } from "./karte.js";
import { initAuftraege, auftragAktionen, auftraegeUpdate, AUF, tourStarten, sternSammeln } from "./auftraege.js";
import { kurierStart, kurierUpdate, KUR, panel } from "./kurier.js";
import { rennenStart, rennUpdate, RENN } from "./rennbahn.js";
import { ereignisseUpdate, ereignisAktionen, ereignisName, ereignisGruppen, EREIG, ereignisStart, regenStart } from "./ereignisse.js";

const $ = (id) => document.getElementById(id);
const WS = { welt: null, folgen: true, pauseBis: 0, pauseBisBewegung: false, letztePan: new THREE.Vector3(), laufId: 0, tiere: {}, stange: null, letzteZeit: null, naechstes: null, hintT: 0, miniT: 0, ladenT: 0, ortNah: null, gassi: null, popcorn: false, anzeige: {} };
const P2 = Math.PI / 2;
const ORT_NAME = { bett: "Bett", kuehl: "Kühlschrank", dusche: "Dusche", waschbecken: "Waschbecken", pc: "Schreibtisch mit PC", theke: "Küchenzeile", tuer: "Haustür", briefkasten: "Briefkasten" };

/* ---------- Spielstand ---------- */
export function initWelt(s) {
  if (!("auto" in s)) s.auto = null; if (!Array.isArray(s.autos)) s.autos = []; if (!Array.isArray(s.tiere)) s.tiere = [];
  if (typeof s.fitness !== "number") s.fitness = 0; if (!s.besucht || typeof s.besucht !== "object") s.besucht = {}; if (typeof s.gassi !== "number") s.gassi = 0;
  if (!Array.isArray(s.wissenssterne)) s.wissenssterne = []; if (!s.auftraege || typeof s.auftraege !== "object") s.auftraege = null;
  if (s.auto && !MODELLE[s.auto.modell]) s.auto = null; if (s.auto && !s.autos.length) s.autos.push(Object.assign({}, s.auto));
  return s;
}
export const WELT_ZIELE = [
  { id: "w_auto", text: "Das erste eigene Fahrzeug kaufen", lohn: 100, ok: (s) => (s.autos || []).length >= 1 },
  { id: "w_tier", text: "Ein Haustier aufnehmen", lohn: 80, ok: (s) => (s.tiere || []).length >= 1 },
  { id: "w_gassi", text: "3 Mal mit dem Hund Gassi gehen", lohn: 120, ok: (s) => (s.gassi || 0) >= 3 },
  { id: "w_orte", text: "Alle Freizeitorte in Nordstern City besuchen", lohn: 250, ok: (s) => FREIZEIT.every((id) => (s.besucht || {})[id]) },
  { id: "w_fit", text: "Fitness 20 erreichen", lohn: 150, ok: (s) => (s.fitness || 0) >= 20 },
  { id: "w_date", text: "Ein Date im Café Pause", lohn: 100, ok: (s) => !!(s.besucht || {})._date },
  { id: "w_auftrag", text: "3 Nebenaufträge in der Stadt erledigen", lohn: 150, ok: (s) => ((s.besucht || {})._auftraege || 0) >= 3 },
  { id: "w_kurier", text: "Einen Kurierjob erledigen", lohn: 100, ok: (s) => !!(s.besucht || {})._kurier },
  { id: "w_tour", text: "Die Lern-Tour vom Rathaus schaffen", lohn: 120, ok: (s) => !!(s.besucht || {})._tour },
  { id: "w_sterne5", text: "5 Wissenssterne finden", lohn: 150, ok: (s) => (s.wissenssterne || []).length >= 5 },
  { id: "w_sterne", text: "Alle " + STERN_ORTE.length + " Wissenssterne finden", lohn: 400, ok: (s) => (s.wissenssterne || []).length >= STERN_ORTE.length },
  { id: "w_sieg", text: "Ein Rennen auf dem Nordring gewinnen", lohn: 200, ok: (s) => !!(s.besucht || {})._sieg }
];

/* ---------- Aufbau ---------- */
function baue(ctx) {
  K.ctx = ctx; K.scene = ctx.scene;
  WS.welt = baueStadt(ctx.scene); initFahren(ctx.scene); initLeute(); initAuftraege();
  initKarte({ gross: karteOeffnen });
  initSteuerung({ e: eTaste, hupe: () => (K.fahrt ? hupe() : null), kamera: () => (K.fahrt ? kameraWechsel() : null), karte: karteOeffnen, zumHaus, stadt: stadtAnsicht,
    folgen: () => { WS.folgen = !WS.folgen; WS.pauseBisBewegung = false; $("btnFolgen").setAttribute("aria-pressed", String(WS.folgen)); ctx.ui.toast(WS.folgen ? "Die Kamera folgt " + (ctx.s ? ctx.s.name : "der Figur") + " draußen." : "Kamera bleibt stehen."); },
    bewegung: () => { WS.pauseBisBewegung = false; } });
  /* Schaufahrzeuge im Autohaus */
  [["mini", "#d0533c", 39.2], ["stromer", "#ffffff", 42.6], ["cabrio", "#f2c14e", 46]].forEach(([m, f, x]) => { const a = baueAuto(m, f); a.position.set(x, 0.0, 13.3); a.rotation.y = 0.35; WS.welt.orte.autohaus.add(a); });
  const w = document.querySelector("#hud .werte"); if (w) { const sp = document.createElement("span"); sp.innerHTML = 'Fitness <b id="hFitness">0</b>'; w.appendChild(sp); const sp2 = document.createElement("span"); sp2.innerHTML = 'Sterne <b id="hSterne">0</b>'; w.appendChild(sp2); }
  window.NL_WELT = { tiere: () => (K.ctx.s ? K.ctx.s.tiere : []), auto: () => (K.ctx.s ? K.ctx.s.auto : null) };
}
function start(s) {
  initWelt(s);
  if (s.auto) parkeEigenes(EINFAHRT.x, EINFAHRT.z, 0);
  s.tiere.forEach((t) => tierSpawnen(t));
  WS.letzteZeit = s.zeit; WS.letztePan.copy(K.ctx.pan);
}
function parkeEigenes(x, z, rot) {
  const s = K.ctx.s; if (K.park) K.scene.remove(K.park.mesh); if (!s.auto) { K.park = null; return; }
  const m = baueAuto(s.auto.modell, s.auto.farbe); m.position.set(x, 0, z); m.rotation.y = rot; m.userData.ziel = { typ: "auto" }; K.scene.add(m); K.park = { mesh: m, x, z, rot };
}
const ichPos = () => { const p = K.ctx.ich.f.g.position; return [p.x, p.z]; };
const dist = (a, b) => Math.hypot(a[0] - b[0], a[1] - b[1]);

/* ---------- Wege ---------- */
function laufe(pfad, dann, f) {
  const c = K.ctx, ich = c.ich; c.aufstehen(ich); ich.f.g.visible = true; WS.pauseBisBewegung = false; const id = ++WS.laufId;
  const schritt = (i) => { if (id !== WS.laufId) return; ich.tempoF = f || (imHeim(ich.f.g.position.x, ich.f.g.position.z) && i >= pfad.length - 1 ? 1 : 1.9);
    if (i >= pfad.length) { ich.tempoF = 1; if (dann) dann(); return; } c.geheZu(ich, pfad[i][0], pfad[i][1], () => schritt(i + 1)); };
  schritt(0);
}
const minutenZuFuss = (l) => Math.max(5, Math.round(l / (2.4 * 1.9) * 4 / 5) * 5);
function hingehen(id, dann) { const o = ORTE[id]; laufe(routeGeh(ichPos(), o.tor), () => { besuch(id); if (dann) dann(); else ortMenue(id); }); }
function nachHauseGehen(dann) { laufe(routeGeh(ichPos(), [7, 12.6]), () => { if (dann) dann(); }); }
function autoNah(r) { return K.park && dist(ichPos(), [K.park.mesh.position.x, K.park.mesh.position.z]) < (r || 22); }
function zumAuto(dann) {
  const c = K.ctx, m = K.park.mesh, lx = Math.cos(m.rotation.y), lz = -Math.sin(m.rotation.y), ziel = [m.position.x + lx * 1.6, m.position.z + lz * 1.6];
  const p = ichPos(); if (dist(p, ziel) < 1) return dann();
  const pfad = dist(p, ziel) > 8 && !(imHeim(p[0], p[1]) && imHeim(ziel[0], ziel[1])) ? routeGeh(p, ziel) : [ziel]; laufe(pfad, dann);
}
function steigEin(extra) {
  const P = K.park; if (!P) return; const c = K.ctx;
  einsteigen(Object.assign({ mesh: P.mesh, modell: c.s.auto.modell, farbe: c.s.auto.farbe, eigen: true, rot: P.mesh.rotation.y, x: P.mesh.position.x, z: P.mesh.position.z, aus: aussteigenHier, heim: nachHauseFahren }, extra || {}));
}
function aussteigenHier() {
  if (K.modus === "rennen") return; const c = K.ctx; const f = aussteigen(); if (!f) return;
  if (f.leih && KUR.aktiv) { c.ui.toast("Leihfahrzeug abgestellt. Der Job läuft zu Fuß weiter, aber mit dem Fahrzeug geht es schneller."); }
  const p = ichPos(); let best = null; Object.entries(ORTE).forEach(([id, o]) => { const d = Math.min(dist(p, o.tor), dist(p, o.park)); if (d < 9 && (!best || d < best.d)) best = { id, d }; });
  if (best && best.id !== "haus") { besuch(best.id); setTimeout(() => ortMenue(best.id), 60); }
}
function nachHauseFahren() {
  const c = K.ctx; if (!K.fahrt) return; if (!K.fahrt.eigen) { c.ui.toast("Das Leihfahrzeug muss zuerst zurück. Beenden Sie den Job oder steigen Sie aus."); return; }
  const m = K.fahrt.mesh; c.ui.toast("Der Autopilot fährt nach Hause. Mit den Pfeiltasten übernehmen Sie jederzeit selbst.");
  autopilot(routeAuto([m.position.x, m.position.z], [EINFAHRT.x, EINFAHRT.z]), () => { if (!K.fahrt) return; K.fahrt.h = 0; m.rotation.y = 0; aussteigen(); c.ui.toast(c.s.name + " ist zu Hause angekommen."); });
}
function hinfahren(id, dann) {
  const c = K.ctx, o = ORTE[id];
  const los = () => { if (!K.fahrt) steigEin(); const m = K.fahrt.mesh; c.ui.toast("Fahrt zum Ziel " + (o.kurz || o.name) + ". Mit den Pfeiltasten übernehmen Sie selbst.");
    autopilot(routeAuto([m.position.x, m.position.z], [o.park[0], o.park[1]]), () => { if (!K.fahrt) return; K.fahrt.h = o.park[2]; m.rotation.y = o.park[2]; aussteigen(); besuch(id); if (dann) dann(); else setTimeout(() => ortMenue(id), 60); }); };
  if (K.fahrt) los(); else zumAuto(los);
}
function zumHaus() { const c = K.ctx; WS.pauseBisBewegung = true; c.pan.set(0, 0, 0); c.zoom = innerWidth < 560 ? 0.74 : IS_TOUCH ? 1.0 : 1.15; c.groesse(); WS.letztePan.copy(c.pan); }
function stadtAnsicht() { const c = K.ctx; WS.pauseBisBewegung = true; const p = c.ich ? ichPos() : [7, 20]; c.pan.set(klemm(p[0], 0, 80) - MITTE.x + 10, 0, klemm(p[1], 0, 50) - MITTE.z + 6); c.zoom = innerWidth < 560 ? 0.3 : 0.34; c.groesse(); WS.letztePan.copy(c.pan); }
function karteOeffnen() { const c = K.ctx; if (!c.s || c.dialogOffen) return; const p = ichPos(); grosseKarte({ x: p[0], z: p[1], besucht: c.s.besucht, reise: schnellreise }); }
function schnellreise(id) {
  const c = K.ctx, o = ORTE[id]; if (K.modus) { c.ui.toast("Während eines Rennens geht keine Schnellreise."); return; }
  if (K.fahrt) aussteigen(); const l = weglaenge(routeGeh(ichPos(), o.tor), ichPos()), min = Math.round(15 + l * 0.35);
  c.aufstehen(c.ich); c.ich.ziel = null; c.zeitVergeht(min); const ziel = id === "haus" ? [7, 12.6] : o.tor; c.ich.f.g.position.set(ziel[0], 0, ziel[1]); c.ich.f.g.visible = true;
  if (G()) gassiEnde(false);
  c.ui.toast("Schnellreise zum Ziel " + (o.kurz || o.name) + ", " + min + " Minuten unterwegs mit Bus und Bahn."); WS.pauseBisBewegung = false; c.hud();
  if (id !== "haus") setTimeout(() => ortMenue(id), 120);
}
function besuch(id) { const s = K.ctx.s; if (!ORTE[id] || id === "haus") return; if (!s.besucht[id]) { s.besucht[id] = 1; K.ctx.pruefeZiele(); } }
function ortMenue(id) {
  const c = K.ctx; if (c.dialogOffen || K.fahrt) return; const o = ORTE[id];
  const v = new THREE.Vector3(o.tor[0], 1.6, o.tor[1]).project(c.camera); let sx = (v.x + 1) / 2 * innerWidth, sy = (1 - v.y) / 2 * innerHeight;
  if (sx < 0 || sx > innerWidth || sy < 0 || sy > innerHeight) { sx = innerWidth / 2; sy = innerHeight / 2; }
  c.zeigeMenue({ ziel: { typ: "ort", id }, punkt: v }, sx, sy); fokusMenue();
}
function fokusMenue() { if (EIN.benutzt && !IS_TOUCH) { const b = $("menue").querySelector("button"); if (b) b.focus({ preventScroll: true }); } }

/* ---------- Aktivitäten ---------- */
function tun(o) {
  const c = K.ctx, s = c.s, ich = c.ich;
  if (o.kosten && s.geld < o.kosten) { c.ui.toast("Dafür reicht das Geld gerade nicht. Vielleicht eine Schicht im Werk?"); return; }
  if (o.kosten) { s.geld -= o.kosten; c.klang("kasse"); } if (o.ort) { besuch(o.ort); s.besucht[o.ort] = (s.besucht[o.ort] || 0) + 1; }
  c.geheZu(ich, o.x, o.z, () => {
    if (o.blick) c.dreheZu(ich, o.blick[0], o.blick[1]);
    if (o.drinnen) { ich.f.g.visible = false; ich.drinnen = o.drinnen; }
    if (o.y != null) { ich.f.g.position.y = o.y; ich.sitzt = !o.liegt; ich.aufstehPunkt = o.zurueck || [o.x, o.z]; }
    if (o.liegt) { ich.liegt = true; ich.f.g.rotation.set(-P2, 0, 0); ich.f.g.position.y = o.y || 0.5; ich.aufstehPunkt = o.zurueck || [o.x, o.z]; }
    if (o.sitzt) { ich.sitzt = true; ich.aufstehPunkt = o.zurueck || [o.x, o.z]; }
    ich.pose = o.pose || null;
    ich.aktiv = { rest: o.dauer, wirkung: o.wirkung, text: o.text, ende: () => { if (ich.drinnen) { ich.f.g.visible = true; ich.f.g.position.set(ich.drinnen[0], 0, ich.drinnen[1]); ich.drinnen = null; } ich.f.g.position.y = 0; if (o.ende) o.ende(); c.hud(); c.speichern(); } };
    c.hud();
  });
}
function nah(id) { return dist(ichPos(), ORTE[id].tor) < 9 || (ORTE[id].box && (() => { const b = ORTE[id].box, p = ichPos(); return p[0] > b[0] - 4 && p[0] < b[1] + 4 && p[1] > b[2] - 4 && p[1] < b[3] + 4; })()); }
function ortAktionen(id) {
  const c = K.ctx, s = c.s, o = ORTE[id], n = s.name, a = [];
  const ext = (obj) => { try { return obj && typeof obj.aktionen === "function" ? obj.aktionen() || [] : null; } catch (e) { return null; } };
  if (!nah(id)) {
    const l = weglaenge(routeGeh(ichPos(), o.tor), ichPos());
    a.push({ t: "Zu Fuß hingehen, etwa " + minutenZuFuss(l) + " Minuten", f: () => hingehen(id) });
    if (autoNah()) a.push({ t: "Mit dem Auto hinfahren", f: () => hinfahren(id) }); else if (s.auto) a.push({ gesperrt: "Ihr Fahrzeug parkt gerade woanders" }); else a.push({ gesperrt: "Ein eigenes Auto gibt es im Autohaus Fahrfreude" });
    if (id === "ladenlokal") a.push(...(ext(window.NL_LADEN) || [{ gesperrt: "Zu vermieten, Selbstständigkeit folgt" }]));
    return a;
  }
  const T = o.tor, pd = () => !!(s.partner && c.partnerDa());
  switch (id) {
    case "park": {
      a.push({ t: "Spazieren gehen", f: () => { const pts = [[2, 24.6], [12.5, 27], [13.5, 36], [4, 40], [-6, 36], [-5.5, 27], [7, 23]]; laufe(pts, () => { c.zeitVergeht(20, { spass: 30, energie: -6 }); s.besucht.park = (s.besucht.park || 0) + 1; c.ui.toast(n + " dreht eine Runde durch den Stadtpark Herzberg. Laut Herzberg ein klarer Motivator.", "gut"); c.pruefeZiele(); }, 1.1); } });
      a.push({ t: "Picknick, 6 €", f: () => tun({ ort: id, kosten: 6, x: 16, z: 28.6, sitzt: true, blick: [16, 27], dauer: 40, wirkung: { hunger: 110, spass: 60, sozial: pd() ? 50 : 10 }, text: "macht Picknick", ende: () => c.ui.toast(pd() ? "Picknick zu zweit. " + s.partner.name.split(" ")[0] + " hat Kekse aus dem Betriebsratsbüro mitgebracht." : "Picknick im Park. Ein Eichhörnchen beantragt Mitbestimmung beim Kuchen.") }) });
      a.push({ t: "Enten füttern, 1 €", f: () => tun({ ort: id, kosten: 1, x: TEICH.x, z: TEICH.z - TEICH.r - 0.8, blick: [TEICH.x, TEICH.z], pose: "winken", dauer: 15, wirkung: { spass: 80 }, text: "füttert die Enten", ende: () => c.ui.toast("Die Enten bilden sofort einen Betriebsrat und fordern mehr Brot.") }) });
      a.push({ t: "Auf der Bank ausruhen", f: () => tun({ ort: id, x: 11, z: 26.2, sitzt: true, dauer: 30, wirkung: { energie: 25, spass: 15 }, text: "ruht sich auf der Bank aus" }) });
      const hund = s.tiere.find((t) => t.art === "hund"); if (hund) a.push({ t: "Gassi mit " + hund.name, f: () => gassi(hund) });
      break; }
    case "see":
      a.push({ t: "Schwimmen, 1 Stunde", f: () => tun({ ort: id, x: SEE.x + 3, z: SEE.z - 2, y: -0.95, zurueck: [SEE.x + 2, SEE.z - SEE.r - 1.2], pose: "jubel", dauer: 60, wirkung: { spass: 40, hygiene: 50, energie: -10 }, text: "schwimmt", ende: () => c.ui.toast(n + " schwimmt eine Runde. Das Wasser hat Urlaubstemperatur, also gefühlt zu kurz.") }) });
      a.push({ t: "Am Steg sonnen", f: () => tun({ ort: id, x: SEE.x, z: SEE.z - 4.5, liegt: true, y: 0.6, zurueck: [SEE.x, SEE.z - 9.5], dauer: 45, wirkung: { spass: 35, energie: 20 }, text: "sonnt sich am Steg", ende: () => c.ui.toast("Sonnencreme nicht vergessen. Arbeitsschutz gilt auch in der Freizeit, sagt Frau Demir.") }) });
      a.push({ t: "Eis am Kiosk, 3 €", f: () => tun({ ort: id, kosten: 3, x: -29.8, z: 23.8, blick: [-29.8, 26], pose: "essen", dauer: 10, wirkung: { hunger: 90, spass: 90 }, text: "isst ein Eis", ende: () => c.ui.toast("Sorte Resturlaub mit Streuseln. Schmeckt nach Sommer.") }) });
      break;
    case "cafe":
      a.push({ t: "Kaffee und Kuchen, 8 €", f: () => tun({ ort: id, kosten: 8, x: T[0], z: T[1] + 1.4, drinnen: T, dauer: 30, wirkung: { hunger: 90, spass: 40, energie: 30 }, text: "sitzt im Café Pause", ende: () => c.ui.toast("Im Café Pause gibt es heute Bienenstich. Die Bedienung arbeitet in Gleitzeit, also irgendwann.") }) });
      if (s.partner) { if (pd()) a.push({ t: "Date mit " + s.partner.name.split(" ")[0] + ", 20 €", f: () => date() }); else a.push({ gesperrt: s.partner.name.split(" ")[0] + " hat gerade keine Zeit" }); } else a.push({ gesperrt: "Für ein Date erst jemanden kennenlernen" });
      a.push({ t: "Zeitung lesen, gratis", f: () => tun({ ort: id, x: -10.5, z: 47.6, sitzt: true, pose: "lesen", dauer: 20, wirkung: { spass: 30 }, text: "liest Zeitung", ende: () => c.ui.toast("Schlagzeile des Tages lautet " + c.pick(["Betriebsrat kauft neue Kaffeemaschine", "Excel-Liste von Herrn Brandt wird Weltkulturerbe", "Nordstern Fahrradwerke stellen wieder Azubis ein"]) + ".") }) });
      break;
    case "kino": {
      const qd = s.besucht._kinoquiz === c.lebensTag();
      if (!qd) a.push({ t: "Filmquiz des Tages, gratis Popcorn", f: () => { s.besucht._kinoquiz = c.lebensTag(); c.frageRunde({ titel: "Filmquiz im Kino Abspann", intro: "Die Kartenabreißerin stellt die Tagesfrage. Bei richtiger Antwort gibt es Popcorn umsonst.", anzahl: 1, ende: "Weiter", fertig: (r) => { WS.popcorn = r > 0; c.ui.toast(r ? "Richtig! Gratis Popcorn für den nächsten Film." : "Knapp daneben. Popcorn gibt es trotzdem, aber nur gegen Geld.", r ? "gut" : ""); } }); } });
      else a.push({ gesperrt: "Das Filmquiz gibt es morgen wieder" });
      a.push({ t: "Film ansehen, 10 €", f: () => tun({ ort: id, kosten: 10, x: T[0], z: T[1] + 1.4, drinnen: T, dauer: 120, wirkung: { spass: 30, energie: -3, hunger: WS.popcorn ? 15 : 0 }, text: "sieht einen Film", ende: () => { c.ui.toast("Heute lief „" + c.pick(["Excel, das Musical", "Die Probezeit, Teil 2", "Der Betriebsrat schlägt zurück", "Zwei Wochen Kündigungsfrist"]) + "“. " + (WS.popcorn ? "Mit Gratis-Popcorn schmeckt jedes Drama besser." : "Spannend bis zum Abspann.")); WS.popcorn = false; } }) });
      break; }
    case "bowling":
      a.push({ t: "Bowling, 9 €", f: () => tun({ ort: id, kosten: 9, x: T[0], z: T[1] + 1.4, drinnen: T, dauer: 60, wirkung: { spass: 45, sozial: 35, energie: -8 }, text: "spielt Bowling", ende: () => c.ui.toast(c.pick(["Strike! Alle neune fallen wie Kündigungen in der Probezeit, also ganz ohne Begründung.", "Zweimal Rinne. Der Betriebsrat beantragt Bande.", "Spare! Herr Brandt trägt das Ergebnis in eine Pivot-Tabelle ein."])) }) });
      a.push({ t: "Karaoke, Fachbegriff-Hit, 4 €", f: () => { if (s.geld < 4) return c.ui.toast("Dafür reicht das Geld gerade nicht."); s.geld -= 4; s.besucht.bowling = (s.besucht.bowling || 0) + 1; c.lernKarte({ titel: "Karaoke im Alle Neune", intro: n + " greift zum Mikrofon. Der Refrain ist ein Fachbegriff des Tages, danach folgt ein Kurzcheck.", fertig: (ok) => { c.lernFertig(ok); s.bed.spass = Math.min(100, s.bed.spass + 25); c.zeitVergeht(20); c.ui.toast(ok ? "Das Publikum singt mit. Standing Ovations, auch vom Betriebsrat." : "Ein paar Töne daneben, aber mit viel Gefühl."); } }); } });
      break;
    case "markt":
      a.push({ t: "Obst und Gemüse essen, 4 €", f: () => tun({ ort: id, kosten: 4, x: 57.5, z: 52, blick: [57.5, 50.5], pose: "essen", dauer: 15, wirkung: { hunger: 260, spass: 20 }, text: "isst frisches Obst", ende: () => c.ui.toast("Frisch vom Wochenmarkt und günstiger als der Pizzadienst. Gemüse hat keine Probezeit.") }) });
      a.push({ t: "Marktfrage, gratis Apfel", f: () => c.sortFrage({ titel: "Marktstand Frau Öztürk", intro: "Frau Öztürk verschenkt Äpfel an alle, die richtig einordnen.", fertig: (ok) => { s.besucht.markt = (s.besucht.markt || 0) + 1; if (ok) { s.bed.hunger = Math.min(100, s.bed.hunger + 20); c.ui.toast("Ein knackiger Apfel für Sie. Hunger plus 20", "gut"); } c.hud(); } }) });
      a.push({ t: "Kurierjob für den Markt", f: () => kurierLos(id, "frage") });
      break;
    case "fitness":
      a.push({ t: "Training, 1 Stunde, 12 €", f: () => tun({ ort: id, kosten: 12, x: T[0], z: T[1] - 1.4, drinnen: T, dauer: 60, wirkung: { energie: -25, spass: 30, hygiene: -30 }, text: "trainiert", ende: () => { s.fitness = Math.min(100, s.fitness + 3); c.ui.toast("Training geschafft, Fitness plus 3, jetzt " + s.fitness + ". Danach am besten duschen.", "gut"); c.pruefeZiele(); } }) });
      a.push({ t: "Sauna, 8 €", f: () => tun({ ort: id, kosten: 8, x: T[0], z: T[1] - 1.4, drinnen: T, dauer: 45, wirkung: { hygiene: 80, spass: 25, energie: 12 }, text: "schwitzt in der Sauna", ende: () => c.ui.toast("In der Sauna redet man nicht über die Arbeit. Fast niemand hält sich daran.") }) });
      a.push({ t: "Rückenkurs mit Tagesfrage", f: () => c.frageRunde({ titel: "Rückenkurs bei Trainerin Ilka", intro: "Zwischen zwei Übungen stellt Ilka eine Frage zum Thema " + c.day.title + ".", anzahl: 1, ende: "Weiter", fertig: (r) => { s.besucht.fitness = (s.besucht.fitness || 0) + 1; c.zeitVergeht(30, { energie: -8, spass: 10 }); if (r) { s.fitness = Math.min(100, s.fitness + 2); c.ui.toast("Richtig und gut gedehnt. Fitness plus 2", "gut"); } c.pruefeZiele(); } }) });
      break;
    case "werk": {
      const z = c.zurArbeit();
      if (z.gesperrt) a.push(z); else a.push({ t: "Schicht beginnen, 8 Stunden", f: () => schichtImWerk(z) });
      a.push({ t: "Kantine, 5 €", f: () => tun({ ort: id, kosten: 5, x: T[0], z: T[1] + 1.4, drinnen: T, dauer: 25, wirkung: { hunger: 220, sozial: 40 }, text: "isst in der Kantine", ende: () => c.ui.toast("Heute gibt es Currywurst. Der Betriebsrat hat die Soße mitbestimmt.") }) });
      a.push({ t: "Kurierjob mit dem Werks-Lastenrad", f: () => kurierLos(id, "frage") });
      break; }
    case "logistik":
      a.push({ t: "Kurierjob, Antworten ausliefern", f: () => kurierLos(id, "frage") });
      a.push({ t: "Logistikjob, Pakete in Depots", f: () => kurierLos(id, "logistik") });
      break;
    case "autohaus":
      a.push({ t: "Fahrzeuge ansehen und kaufen", f: autohaus });
      if (s.besucht._rabattTag !== c.lebensTag()) a.push({ t: "Rabatt verhandeln", f: () => { s.besucht._rabattTag = c.lebensTag(); c.frageRunde({ titel: "Verkaufsgespräch", intro: "Der Verkäufer gibt 10 Prozent Rabatt, wenn Sie seine Frage zum Thema " + c.day.title + " richtig beantworten.", anzahl: 1, ende: "Weiter", fertig: (r) => { if (r) { s.besucht._rabatt = 10; c.ui.toast("Verhandelt! 10 Prozent Rabatt auf das nächste Fahrzeug.", "gut"); } else c.ui.toast("Der Verkäufer bleibt hart. Morgen gibt es eine neue Chance."); } }); } });
      if (s.autos.length > 1) a.push({ t: "Aktuelles Fahrzeug wählen", f: fahrzeugWahl });
      break;
    case "tierhandlung":
      a.push({ t: "Tiere ansehen und aufnehmen", f: tierhandlung });
      a.push({ t: "Tierfutter-Beratung", f: () => c.ui.toast("Die Verkäuferin empfiehlt Futter mit Zertifikat. Für Papageien auch mit Fachbegriffen.") });
      break;
    case "rennstrecke":
      a.push({ t: "Rennen fahren, Startgeld 20 €", f: rennenLos });
      a.push({ t: "Von der Tribüne zuschauen", f: () => tun({ ort: id, x: 106.5, z: -9.5, dauer: 30, wirkung: { spass: 40 }, text: "schaut beim Training zu", ende: () => c.ui.toast("Ein Rivale namens " + c.pick(c.H.RIVALEN || ["Die Excel-Rakete"]) + " dreht seine Runden.") }) });
      break;
    case "rathaus":
      if (AUF.tour) a.push({ gesperrt: "Die Lern-Tour läuft schon" }); else a.push({ t: "Lern-Tour starten", f: tourStarten });
      a.push({ t: "Bürgersprechstunde mit Tagesfrage", f: () => c.frageRunde({ titel: "Bürgersprechstunde", intro: "Die Bürgermeisterin hat eine Frage zum Thema " + c.day.title + ". Eine richtige Antwort bringt 20 € aus dem Fördertopf.", anzahl: 1, ende: "Weiter", fertig: (r) => { if (r) { s.geld += 20; c.ui.toast("Plus 20 € aus dem Fördertopf.", "geld"); } c.zeitVergeht(20); } }) });
      break;
    case "aussicht":
      a.push({ t: "Auf den Turm steigen", f: () => tun({ ort: id, x: -24, z: -44, y: 10.13, zurueck: [-20.5, -44], dauer: 30, wirkung: { spass: 45, energie: -5 }, text: "genießt die Aussicht", ende: () => c.ui.toast("Von hier oben sieht man die ganze Stadt. Sogar die Excel-Liste von Herrn Brandt, Zeile 4.381.") }) });
      break;
    case "boutique": a.push(...(ext(window.NL_BOUTIQUE) || [{ gesperrt: "Neueröffnung demnächst, die Kollektion wird noch geschneidert" }])); break;
    case "ladenlokal": a.push(...(ext(window.NL_LADEN) || [{ gesperrt: "Zu vermieten, Selbstständigkeit folgt" }])); break;
  }
  return a;
}
function date() {
  const c = K.ctx, s = c.s, v = s.partner.name.split(" ")[0];
  if (s.geld < 20) return c.ui.toast("Für das Date reicht das Geld gerade nicht.");
  s.geld -= 20; s.besucht.cafe = (s.besucht.cafe || 0) + 1; const ich = c.ich; ich.f.g.visible = false; ich.drinnen = ORTE.cafe.tor;
  c.frageRunde({ titel: "Date im Café Pause", intro: v + " bestellt zwei Cappuccino und stellt eine Frage zum Thema " + c.day.title + ". Eine gute Antwort macht das Date unvergesslich.", anzahl: 1, ende: "Zahlen bitte",
    lob: [v + " lächelt über den Tassenrand."], tadel: [v + " lacht. „Du bist süß, wenn du nachdenkst.“"],
    fertig: (r) => { const plus = r ? 12 : 5; s.partner.bez = Math.min(100, s.partner.bez + plus); s.besucht._date = (s.besucht._date || 0) + 1; c.zeitVergeht(60, { spass: 40, sozial: 60, hunger: 30 }); ich.f.g.visible = true; ich.f.g.position.set(ORTE.cafe.tor[0], 0, ORTE.cafe.tor[1]); ich.drinnen = null;
      c.ui.toast("Date mit " + v + ". Beziehung plus " + plus + ", jetzt " + Math.round(s.partner.bez) + " von 100", "gut"); c.pruefeZiele(); } });
}
function schichtImWerk(z) {
  const c = K.ctx, ich = c.ich; if (K.fahrt) aussteigen(); if (K.park && dist([K.park.mesh.position.x, K.park.mesh.position.z], ORTE.werk.park) < 15) parkeEigenes(EINFAHRT.x, EINFAHRT.z, 0);
  ich.f.g.visible = false; ich.f.g.position.set(7, 0, 11.2); ich.drinnen = null; z.f();
}
function zurArbeitFahren(z) { hinfahren("werk", () => { parkeEigenes(EINFAHRT.x, EINFAHRT.z, 0); schichtImWerk(z); }); }

/* ---------- Fahrzeuge und Jobs ---------- */
function leihFahrzeug(modell, x, z, rot, farbe) { const m = baueAuto(modell, farbe || "#0f5c63"); m.position.set(x, 0, z); m.rotation.y = rot; K.scene.add(m); return m; }
function kurierLos(id, art) {
  const c = K.ctx; if (KUR.aktiv || RENN.aktiv) return c.ui.toast("Es läuft schon ein Job.");
  kurierStart(art, () => {
    if (K.fahrt) return;
    if (autoNah(25)) { steigEin(); return; }
    const p = ORTE[id].park, m = leihFahrzeug("cargo", p[0], p[1], p[2]); c.ui.toast("Sie bekommen ein Leih-Lastenrad aus den Nordstern Fahrradwerken.");
    einsteigen({ mesh: m, modell: "cargo", farbe: "#0f5c63", eigen: false, leih: true, rot: p[2], x: p[0], z: p[1], aus: aussteigenHier, heim: nachHauseFahren });
  });
  KUR.endeCb = () => { if (K.fahrt && K.fahrt.leih) { aussteigen(); c.ui.toast("Das Leih-Lastenrad rollt per App zurück ins Werk."); } };
}
function rennenLos() {
  const c = K.ctx, s = c.s; if (RENN.aktiv || KUR.aktiv) return; if (s.geld < 20) return c.ui.toast("Das Startgeld von 20 € fehlt noch.");
  s.geld -= 20; c.hud(); s.besucht.rennstrecke = (s.besucht.rennstrecke || 0) + 1;
  const eigen = autoNah(40) && s.auto && s.auto.modell !== "cargo";
  K.modus = "rennen";
  rennenStart((x, z, h) => {
    if (K.fahrt) aussteigen();
    if (eigen) { K.park.mesh.position.set(x, 0, z); K.park.mesh.rotation.y = h; steigEin({ rot: h, x, z }); }
    else { const m = leihFahrzeug("mini", x, z, h, "#d0533c"); einsteigen({ mesh: m, modell: "mini", farbe: "#d0533c", eigen: false, leih: true, rot: h, x, z }); if (s.auto && s.auto.modell === "cargo") c.ui.toast("Mit dem Lastenrad wäre es knapp geworden. Sie fahren den Leihwagen der Rennstrecke."); }
    FAHR.modus = "hinten";
  });
  RENN.ende = () => { K.modus = null; const p = ORTE.rennstrecke.park; if (K.fahrt) { K.fahrt.mesh.position.set(p[0], 0, p[1]); K.fahrt.h = p[2]; K.fahrt.mesh.rotation.y = p[2]; aussteigen(); } };
}
function autohaus() {
  const c = K.ctx, s = c.s, wahl = {};
  const zeichne = () => {
    const rab = s.besucht._rabatt || 0;
    const k = c.dialog(`<p class="dkopf">Autohaus Fahrfreude<span>Guthaben ${c.euro(s.geld)}</span></p><p class="intro">Alle Modelle sind frei erfunden und sofort verfügbar. ${rab ? "Ihr verhandelter Rabatt von " + rab + " Prozent ist schon eingerechnet." : "Tipp, wer im Verkaufsgespräch richtig antwortet, bekommt Rabatt."}</p>
      <div class="katalog">${Object.entries(MODELLE).map(([id, m]) => { const f = wahl[id] || m.farben[0], p = Math.round(m.preis * (1 - rab / 100) * (id === "cargo" ? 0.8 : 1)), hat = s.autos.some((x) => x.modell === id && x.farbe === f);
        return `<div class="artikel"><span class="autobild${id === "cargo" ? " rad" : ""}" style="--f:${f}"></span><b>${c.esc(m.name)}</b><small>${c.esc(m.art)} · Tempo bis ${m.tempo * 5} km/h · ${m.plaetze} ${m.plaetze === 1 ? "Platz" : "Plätze"}<br>${c.esc(m.text)}${id === "cargo" ? " Inklusive 20 Prozent Mitarbeiterrabatt." : ""}</small>
        <div class="farben">${m.farben.map((x) => `<button type="button" class="farbe klein" data-m="${id}" data-f="${x}" style="background:${x}" aria-label="Farbe wählen" aria-pressed="${x === f}"></button>`).join("")}</div>
        <span class="preis">${c.euro(p)}</span><button class="btn klein" type="button" data-kauf="${id}" data-p="${p}"${hat || s.geld < p ? " disabled" : ""}>${hat ? "Schon in der Garage" : s.geld < p ? "Zu teuer" : "Kaufen"}</button></div>`; }).join("")}</div>
      <div class="reihe"><button class="btn leise" type="button" id="dZu">Schließen</button></div>`, "breit");
    k.querySelectorAll("[data-f]").forEach((b) => (b.onclick = () => { wahl[b.dataset.m] = b.dataset.f; c.klang("klick"); zeichne(); }));
    k.querySelectorAll("[data-kauf]").forEach((b) => (b.onclick = () => { const id = b.dataset.kauf, p = +b.dataset.p, f = wahl[id] || MODELLE[id].farben[0]; if (s.geld < p) return;
      s.geld -= p; s.besucht._rabatt = 0; s.autos.push({ modell: id, farbe: f }); s.auto = { modell: id, farbe: f }; c.klang("kasse");
      const pk = ORTE.autohaus.park; parkeEigenes(pk[0], pk[1], pk[2]); c.dialogZu();
      c.ui.toast(MODELLE[id].name + " gekauft! Das Fahrzeug steht vor dem Autohaus. Mit E oder Antippen einsteigen.", "geld"); c.speichern(); c.pruefeZiele(); }));
    $("dZu").onclick = c.dialogZu;
  };
  zeichne();
}
function fahrzeugWahl() {
  const c = K.ctx, s = c.s;
  const k = c.dialog(`<p class="dkopf">Ihre Fahrzeuge</p><p class="intro">Wählen Sie das aktuelle Fahrzeug. Die anderen stehen in der Garage.</p><div class="katalog">${s.autos.map((x, i) => `<div class="artikel"><span class="autobild" style="--f:${x.farbe}"></span><b>${c.esc(MODELLE[x.modell].name)}</b><small>${c.esc(MODELLE[x.modell].art)}</small><button class="btn klein" type="button" data-i="${i}"${s.auto && s.auto.modell === x.modell && s.auto.farbe === x.farbe ? " disabled" : ""}>${s.auto && s.auto.modell === x.modell && s.auto.farbe === x.farbe ? "Aktuell" : "Wählen"}</button></div>`).join("")}</div><div class="reihe"><button class="btn leise" type="button" id="dZu">Schließen</button></div>`, "breit");
  k.querySelectorAll("[data-i]").forEach((b) => (b.onclick = () => { const x = s.autos[+b.dataset.i]; s.auto = { modell: x.modell, farbe: x.farbe }; const P = K.park; parkeEigenes(P ? P.mesh.position.x : EINFAHRT.x, P ? P.mesh.position.z : EINFAHRT.z, P ? P.mesh.rotation.y : 0); c.dialogZu(); c.ui.toast(MODELLE[x.modell].name + " ist jetzt Ihr aktuelles Fahrzeug."); c.speichern(); }));
  $("dZu").onclick = c.dialogZu;
}
function autoAktionen() {
  const c = K.ctx, s = c.s, a = [], P = K.park; if (!P || !s.auto) return a; const d = dist(ichPos(), [P.mesh.position.x, P.mesh.position.z]);
  a.push({ t: d > 4 ? "Zum Auto gehen und einsteigen" : "Einsteigen und losfahren", f: () => zumAuto(() => steigEin()) });
  if (dist([P.mesh.position.x, P.mesh.position.z], [EINFAHRT.x, EINFAHRT.z]) > 6) a.push({ t: "Nach Hause fahren", f: () => zumAuto(() => { steigEin(); nachHauseFahren(); }) });
  a.push({ t: "Hupen", f: () => hupen(s.auto.modell === "cargo") });
  if (s.autos.length > 1 && (dist([P.mesh.position.x, P.mesh.position.z], [EINFAHRT.x, EINFAHRT.z]) < 6 || nah("autohaus"))) a.push({ t: "Fahrzeug wechseln", f: fahrzeugWahl });
  return a;
}

/* ---------- Haustiere ---------- */
function tierSpawnen(t) {
  const r = baueTier(t.art); r.g.userData.ziel = { typ: "tier", id: t.id }; K.scene.add(r.g);
  const p = zufallsPunktHeim(); r.g.position.set(p[0], 0, p[1]);
  if (t.art === "papagei") { if (!WS.stange) { WS.stange = stange(); WS.stange.position.set(13.2, 0, 3.6); K.scene.add(WS.stange); } r.g.position.set(13.2, 1.43, 3.6); }
  WS.tiere[t.id] = { d: t, r, ziel: null, ruhe: zufall(1, 5), pfad: [], folgt: false, trauerTag: 0 };
}
function tierhandlung() {
  const c = K.ctx, s = c.s;
  const k = c.dialog(`<p class="dkopf">Tierhandlung Fellwechsel<span>Guthaben ${c.euro(s.geld)}</span></p><p class="intro">Alle Tiere ziehen mit Futter, Körbchen und einer Einweisung ein. Höchstens fünf Haustiere passen ins Haus. Sie haben ${s.tiere.length}.</p>
    <div class="katalog">${Object.entries(ARTEN).map(([id, a]) => `<div class="artikel"><b>${c.esc(a.name)}</b><small>${c.esc(a.text)} Futter kostet ${c.euro(a.futter)}.</small><label class="feld">Name<input class="eingabe" maxlength="14" id="tn_${id}" value="${c.esc(c.pick(a.namen))}"></label><span class="preis">${c.euro(a.preis)}</span><button class="btn klein" type="button" data-art="${id}"${s.geld < a.preis || s.tiere.length >= 5 ? " disabled" : ""}>${s.tiere.length >= 5 ? "Haus ist voll" : s.geld < a.preis ? "Zu teuer" : "Aufnehmen"}</button></div>`).join("")}</div>
    <div class="reihe"><button class="btn leise" type="button" id="dZu">Schließen</button></div>`, "breit");
  k.querySelectorAll("[data-art]").forEach((b) => (b.onclick = () => { const art = b.dataset.art, A = ARTEN[art]; if (s.geld < A.preis || s.tiere.length >= 5) return;
    const name = ($("tn_" + art).value || A.namen[0]).trim().slice(0, 14) || A.namen[0]; s.geld -= A.preis;
    const t = { id: "t" + Date.now().toString(36) + Math.floor(Math.random() * 99), art, name, hunger: 80, liebe: 60, geboren: s.zeit }; s.tiere.push(t); tierSpawnen(t); c.klang("ziel"); c.dialogZu();
    c.ui.toast(name + " zieht bei " + s.name + " ein und wartet schon zu Hause. " + (art === "papagei" ? "Die Stange steht im Arbeitszimmer." : ""), "gut"); c.speichern(); c.pruefeZiele(); }));
  $("dZu").onclick = c.dialogZu;
}
function zumTier(T, dann) { const c = K.ctx, p = T.r.g.position, ich = c.ich; T.ruhe = 8; T.ziel = null; const x = p.x + 0.8, z = p.z + 0.5; c.geheZu(ich, x, z, () => { c.dreheZu(ich, p.x, p.z); dann(); }); }
function tierAktionen(id) {
  const c = K.ctx, s = c.s, T = WS.tiere[id]; if (!T) return []; const t = T.d, A = ARTEN[t.art], a = [], n = t.name;
  if (!imHeim(...ichPos()) && !G()) return [{ t: "Nach Hause gehen", f: () => nachHauseGehen() }];
  a.push(t.hunger < 92 ? { t: (t.art === "kaninchen" ? "Möhre geben, " : "Füttern, ") + c.euro(A.futter), f: () => zumTier(T, () => { if (s.geld < A.futter) return c.ui.toast("Kein Geld für Futter. " + n + " schaut trotzdem treu."); s.geld -= A.futter; t.hunger = 100; t.liebe = Math.min(100, t.liebe + 5); c.ich.pose = "essen"; setTimeout(() => (c.ich.pose = null), 1200); c.ui.toast(n + " frisst zufrieden. " + (t.art === "katze" ? "Danach wird gegähnt, das ist Katzenlob." : "Satt und glücklich."), "gut"); c.hud(); }) } : { gesperrt: n + " ist satt" });
  a.push({ t: "Streicheln", f: () => zumTier(T, () => { c.ich.pose = "reden"; setTimeout(() => (c.ich.pose = null), 1500); if (t.art === "katze" && Math.random() < 0.35) { t.liebe = Math.min(100, t.liebe + 2); c.ui.toast(n + " ignoriert Sie würdevoll. Katzen haben eine eigene Betriebsvereinbarung."); return; } if (t.art === "schildkroete") { t.liebe = Math.min(100, t.liebe + 10); c.ui.toast(n + " streckt den Kopf heraus. Das ist Schildkröte für Ich mag dich."); }
    else { t.liebe = Math.min(100, t.liebe + 15); c.ui.toast(n + " genießt die Streicheleinheit. Liebe jetzt " + Math.round(t.liebe) + " von 100"); } s.bed.spass = Math.min(100, s.bed.spass + 8); s.bed.sozial = Math.min(100, s.bed.sozial + 8); c.hud(); }) });
  a.push({ t: "Spielen", f: () => zumTier(T, () => { c.ich.pose = "winken"; c.zeitVergeht(20); setTimeout(() => (c.ich.pose = null), 2200); t.liebe = Math.min(100, t.liebe + 20); t.hunger = Math.max(0, t.hunger - 6); s.bed.spass = Math.min(100, s.bed.spass + 18); s.bed.energie = Math.max(0, s.bed.energie - 4);
    c.ui.toast({ hund: n + " bringt den Ball zurück. Und noch mal. Und noch mal.", katze: n + " jagt den Laserpunkt bis unter das Sofa.", schildkroete: n + " spielt Verstecken im Panzer. Gewinnt immer.", kaninchen: n + " schlägt Haken wie ein Personaler bei Gehaltsverhandlungen.", papagei: n + " tanzt zum Radio Nordstern." }[t.art]); c.hud(); }) });
  if (t.art === "hund") a.push(G() ? { gesperrt: "Gassi läuft gerade" } : { t: "Gassi gehen", f: () => gassi(t) });
  if (t.art === "schildkroete") a.push({ t: "Wettrennen im Garten", f: () => wettrennen(T) });
  if (t.art === "papagei") { a.push({ t: "Zuhören", f: () => papageiSpricht(t, true) }); a.push({ t: "Einen Begriff beibringen", f: () => c.lernKarte({ titel: n + " lernt mit", intro: "Sie bringen " + n + " einen Fachbegriff des Tages bei. Danach folgt ein Kurzcheck für Sie.", fertig: (ok) => { c.lernFertig(ok); t.liebe = Math.min(100, t.liebe + 12); if (ok) c.ui.toast(n + " krächzt den Begriff sofort nach. Schneller als manche Azubis."); } }) }); }
  a.push({ t: "Wie geht es " + n + "?", f: () => c.ui.toast(n + ", " + A.name + ". Hunger " + Math.round(t.hunger) + " von 100, Liebe " + Math.round(t.liebe) + " von 100" + (t.hunger < 25 || t.liebe < 25 ? ". Etwas traurig, braucht Zuwendung." : ". Bestens gelaunt.")) });
  return a;
}
function papageiSpricht(t, sofort) { const c = K.ctx, l = c.day.lernen || []; if (!l.length) return; const b = c.pick(l).t.replace(/\s*\(.*?\)\s*/g, " ").trim(); c.ui.toast(t.name + " krächzt „" + b + "! " + b + "!“" + (sofort ? " Klingt fast wie im Unterricht." : "")); }
function wettrennen(T) {
  const c = K.ctx, s = c.s, t = T.d, ich = c.ich; T.ruhe = 60; T.ziel = null; T.r.g.position.set(3, 0, 12); T.r.g.rotation.y = P2;
  c.geheZu(ich, 3, 13, () => { ich.f.g.rotation.y = P2;
    c.frageRunde({ titel: "Wettrennen gegen " + t.name, intro: "Start ist am Beet, Ziel am Briefkasten. Für jeden Schritt eine Frage, und zum Glück nur eine.", anzahl: 1, ende: "Ins Ziel",
      lob: [t.name + " staunt mit offenem Mund."], tadel: [t.name + " nutzt die Gelegenheit und zieht davon. Sehr langsam."], fertig: (r) => {
        T.folgeZiel = [9, 12]; s.bed.spass = Math.min(100, s.bed.spass + 20); t.liebe = Math.min(100, t.liebe + 15);
        if (r) { c.geheZu(ich, 9, 13); c.ui.toast(s.name + " gewinnt knapp. " + t.name + " ist trotzdem stolz und beantragt eine Revanche.", "gut"); } else c.ui.toast(t.name + " gewinnt durch Beharrlichkeit. Langsam, aber fristgerecht.");
        c.hud(); } }); });
}
const G = () => WS.gassi;
function gassi(t) {
  const c = K.ctx, s = c.s, h = c.stunde(); if (h < 6 || h >= 22) return c.ui.toast("Nachts schläft " + t.name + " lieber. Gassi geht von 6 bis 22 Uhr.");
  if (K.fahrt) aussteigen(); const T = WS.tiere[t.id]; if (!T) return; T.folgt = true; T.pfad = [];
  WS.gassi = { t, T, phase: "hin", warte: 0 }; c.ui.toast(s.name + " und " + t.name + " gehen Gassi in den Stadtpark.");
  const runde = [[3, 24.8], [11, 25.2], [13.8, 33]], zurueck = [[8, 39.8], [-5.5, 34], [-5, 27]];
  laufe(routeGeh(ichPos(), ORTE.park.tor).concat(runde), () => gassiErlebnis(() => { if (WS.gassi) WS.gassi.phase = "zurueck"; laufe(zurueck.concat(routeGeh([-5, 27], [7, 12.6])), () => gassiEnde(true), 1.6); }), 1.6);
}
function gassiErlebnis(weiter) {
  const c = K.ctx, s = c.s, g = WS.gassi; if (!g) return; g.phase = "erlebnis"; const n = g.t.name, z = Math.random();
  if (z < 0.5) {
    const B = AUF.npcs.brandt, bp = B ? B.f.g.position : new THREE.Vector3(-2.4, 0, 26.3);
    laufe([[bp.x + 1.4, bp.z + 1.2]], () => { const d = baueTier("dackel"); d.g.position.set(bp.x + 0.8, 0, bp.z + 0.6); d.g.rotation.y = 0.8; K.scene.add(d.g); c.dreheZu(c.ich, bp.x, bp.z);
      c.frageRunde({ titel: "Herr Brandt mit Dackel Pivot", intro: "Herr Brandt trägt sein Sakko von 1998. Während " + n + " und Dackel Pivot sich beschnuppern, hat er eine Frage zum Thema " + c.day.title + ".", anzahl: 1, ende: "Weiter Gassi",
        lob: ["Herr Brandt notiert Ihren Namen in seiner Excel-Liste der Talente."], tadel: ["Herr Brandt erklärt es geduldig. Pivot wedelt dazu."],
        fertig: (r) => { K.scene.remove(d.g); if (r) { s.wissen++; c.ui.toast("Wissen plus 1. Pivot bellt anerkennend.", "gut"); } weiter(); } }); }, 1.2);
  } else if (z < 0.78) { c.ui.toast(n + " buddelt einen alten Stempel „Genehmigt“ aus. Herr Brandt sucht ihn seit 2003."); s.bed.spass = Math.min(100, s.bed.spass + 10); weiter(); }
  else { c.ui.toast("Paula Probezeit filmt " + n + " für ihre 12 Follower. Jetzt sind es 13."); s.bed.sozial = Math.min(100, s.bed.sozial + 10); weiter(); }
}
function gassiEnde(ok) {
  const c = K.ctx, s = c.s, g = WS.gassi; if (!g) return; WS.gassi = null; g.T.folgt = false;
  if (ok) { s.gassi++; s.besucht.park = (s.besucht.park || 0) + 1; g.t.liebe = Math.min(100, g.t.liebe + 25); g.t.hunger = Math.max(0, g.t.hunger - 10); s.bed.spass = Math.min(100, s.bed.spass + 25); s.bed.sozial = Math.min(100, s.bed.sozial + 20); s.bed.energie = Math.max(0, s.bed.energie - 6);
    c.ui.toast("Gassi geschafft, schon " + s.gassi + " Mal. " + g.t.name + " ist glücklich und müde.", "gut"); c.hud(); c.speichern(); c.pruefeZiele(); }
  else { const p = g.T.r.g.position; if (!imHeim(p.x, p.z)) g.T.pfad = routeGeh([p.x, p.z], [7, 12.6]); c.ui.toast(g.t.name + " trottet allein nach Hause und wartet dort."); }
}
function tiereUpdate(dt, t, laeuft) {
  const c = K.ctx, s = c.s, ich = c.ich, schnell = laeuft ? Math.max(1, c.tempo * 0.75) : 0;
  const dz = WS.letzteZeit == null ? 0 : s.zeit - WS.letzteZeit; WS.letzteZeit = s.zeit;
  if (dz > 0) s.tiere.forEach((d) => { d.hunger = Math.max(0, d.hunger - dz * 1.6 / 60); d.liebe = Math.max(0, d.liebe - dz * 1.2 / 60);
    const T = WS.tiere[d.id]; if (T && (d.hunger < 25 || d.liebe < 25) && T.trauerTag !== c.lebensTag() && c.stunde() > 8) { T.trauerTag = c.lebensTag(); c.ui.toast(d.name + " ist ein bisschen traurig und schaut Sie mit großen Augen an. Etwas Futter und Zuwendung helfen sofort."); } });
  Object.values(WS.tiere).forEach((T) => {
    const g = T.r.g, p = g.position, d = T.d, A = ARTEN[d.art], traurig = d.hunger < 25 || d.liebe < 25; let lauf = false;
    if (laeuft) {
      let ziel = null, v = A.tempo * (traurig ? 0.6 : 1) * schnell;
      if (T.folgt) { const ip = ich.f.g.position, ry = ich.f.g.rotation.y; ziel = [ip.x - Math.sin(ry) * 1.1 + Math.cos(ry) * 0.6, ip.z - Math.cos(ry) * 1.1 - Math.sin(ry) * 0.6]; v = Math.max(v, Math.hypot(ziel[0] - p.x, ziel[1] - p.z) * 2.2); if (Math.hypot(ziel[0] - p.x, ziel[1] - p.z) > 14) { p.x = ziel[0]; p.z = ziel[1]; } }
      else if (T.pfad.length) { ziel = T.pfad[0]; v = A.tempo * 1.4 * schnell; if (Math.hypot(ziel[0] - p.x, ziel[1] - p.z) < 0.3) T.pfad.shift(); }
      else if (T.folgeZiel) { ziel = T.folgeZiel; v = 0.5 * schnell; if (Math.hypot(ziel[0] - p.x, ziel[1] - p.z) < 0.2) T.folgeZiel = null; }
      else if (d.art === "papagei") { if (!T.ziel && (T.ruhe -= dt * schnell) <= 0) { T.ziel = Math.random() < 0.5 ? [13.2, 3.6, 1.43] : [zufall(9, 13.5), zufall(1, 4.5), 0]; T.ruhe = zufall(6, 18); } if (T.ziel) { ziel = T.ziel; } }
      else if (!T.ziel && (T.ruhe -= dt * schnell) <= 0) { if (!imHeim(p.x, p.z)) T.pfad = routeGeh([p.x, p.z], [7, 12.6]); else { T.ziel = zufallsPunktHeim(); } T.ruhe = d.art === "katze" ? zufall(6, 20) : zufall(2, 8); }
      if (!ziel && T.ziel) ziel = T.ziel;
      if (ziel) { const dx = ziel[0] - p.x, dzz = ziel[1] - p.z, l = Math.hypot(dx, dzz), st = v * dt;
        if (d.art === "papagei") { const ty = ziel[2] != null ? ziel[2] : 0, hoch = l > 0.3 ? 1.6 : ty; p.y += (hoch - p.y) * Math.min(1, dt * 3); }
        if (l <= Math.max(st, 0.05)) { if (!T.folgt && !T.pfad.length) { if (d.art === "papagei" && T.ziel) p.y = T.ziel[2]; T.ziel = null; } } else { p.x += dx / l * Math.min(st, l); p.z += dzz / l * Math.min(st, l); g.rotation.y = Math.atan2(dx, dzz); lauf = true; } }
    }
    animiereTier(T.r, t, lauf, traurig);
  });
  if (laeuft && s.tiere.some((x) => x.art === "papagei") && imHeim(...ichPos()) && Math.random() < dt / 70) papageiSpricht(c.pick(s.tiere.filter((x) => x.art === "papagei")));
}

/* ---------- Ziele, Titel und Menüs ---------- */
const WELT_TYPEN = ["ort", "auto", "tier", "npc", "ereignis", "stern"];
function istWeltZiel(z) { return z && WELT_TYPEN.includes(z.typ); }
function titel(z) {
  const c = K.ctx;
  switch (z.typ) { case "ort": return ORTE[z.id].name; case "auto": return c.s.auto ? MODELLE[c.s.auto.modell].name : "Auto"; case "tier": { const T = WS.tiere[z.id]; return T ? T.d.name + ", " + ARTEN[T.d.art].name : ""; }
    case "npc": { const n = npcVon(z.id); return n ? n.name : ""; } case "ereignis": return ereignisName(z.id); case "stern": return "Wissensstern"; }
  return "";
}
function aktionen(z) {
  const c = K.ctx;
  switch (z.typ) {
    case "ort": return ortAktionen(z.id);
    case "auto": return autoAktionen();
    case "tier": return tierAktionen(z.id);
    case "npc": { const n = npcVon(z.id); if (!n) return []; if (n.auftrag) return auftragAktionen(n.auftrag); return npcAktionen(n); }
    case "ereignis": { const e = EREIG.aktiv[z.id]; if (!e) return []; const g = e.g; const box = new THREE.Box3().setFromObject(g), m = box.getCenter(new THREE.Vector3()); if (dist(ichPos(), [m.x, m.z]) > 12) return [{ t: "Hingehen", f: () => laufe(routeGeh(ichPos(), [m.x, m.z + 1.5])) }]; return ereignisAktionen(z.id); }
    case "stern": { const m = AUF.sterne[z.id]; if (!m || !m.visible) return []; if (dist(ichPos(), [m.position.x, m.position.z]) < 3) return [{ t: "Einsammeln", f: () => sternSammeln(z.id) }]; return [{ t: "Hingehen", f: () => laufe(routeGeh(ichPos(), [m.position.x, m.position.z])) }]; }
  }
  return [];
}
function npcAktionen(n) {
  const c = K.ctx, s = c.s, a = [], tg = c.lebensTag(); let h = 0; n.id.split("").forEach((ch) => (h = (h * 7 + ch.charCodeAt(0)) % 97)); const art = (h + tg) % 4;
  const hin = (dann) => { const p = n.f.g.position; n.halt = true; c.geheZu(c.ich, p.x + 0.9, p.z + 0.4, () => { c.dreheZu(c.ich, p.x, p.z); n.f.g.rotation.y = Math.atan2(c.ich.f.g.position.x - p.x, c.ich.f.g.position.z - p.z); dann(); setTimeout(() => (n.halt = false), 2500); }); };
  a.push({ t: "Ansprechen", f: () => hin(() => { c.ich.pose = "reden"; n.pose = "reden"; setTimeout(() => { c.ich.pose = null; n.pose = null; }, 2200); s.bed.sozial = Math.min(100, s.bed.sozial + 6); c.ui.toast(n.name + " sagt „" + satzFuer(n) + "“"); c.hud(); }) });
  if (n.frageTag !== tg && art === 1) a.push({ t: "Frage des Tages beantworten", f: () => hin(() => c.frageRunde({ titel: n.name + " fragt", intro: n.name + " hat neulich etwas zum Thema " + c.day.title + " gehört und ist unsicher.", anzahl: 1, ende: "Tschüss", fertig: (r) => { n.frageTag = tg; s.bed.sozial = Math.min(100, s.bed.sozial + 12); if (r) { s.geld += 15; c.ui.toast(n.name + " bedankt sich mit 15 € für die Kaffeekasse.", "geld"); } c.hud(); } })) });
  if (n.frageTag !== tg && art === 2) a.push({ t: "Kleine Aufgabe übernehmen", f: () => hin(() => c.sortFrage({ titel: "Kleine Aufgabe von " + n.name, intro: n.name + " hat einen Zettel gefunden und weiß nicht, wohin damit.", fertig: (ok) => { n.frageTag = tg; if (ok) { s.geld += 10; c.ui.toast("Richtig eingeordnet. " + n.name + " gibt Ihnen 10 €.", "geld"); } else c.ui.toast(n.name + " bedankt sich trotzdem für die Hilfe."); c.hud(); } })) });
  return a;
}
function ergaenze(z, a) {
  const c = K.ctx, s = c.s; if (!s || !c.ich) return;
  const draussen = !imHeim(...ichPos());
  if ((z.typ === "moebel" || (z.typ === "person" && z.id !== "ich")) && draussen) { a.length = 0; a.push({ t: "Nach Hause gehen", f: () => nachHauseGehen() }); if (autoNah()) a.push({ t: "Nach Hause fahren", f: () => zumAuto(() => { steigEin(); nachHauseFahren(); }) }); return; }
  if (z.typ === "moebel" && z.id === "tuer") { const w = a.find((x) => x.t && x.t.startsWith("Zur Arbeit")); if (w && K.park && dist([K.park.mesh.position.x, K.park.mesh.position.z], [EINFAHRT.x, EINFAHRT.z]) < 8) { const zz = c.zurArbeit(); a.push({ t: "Zur Arbeit fahren, " + MODELLE[s.auto.modell].name, f: () => zurArbeitFahren(zz) }); } a.push({ t: "In die Stadt, Karte öffnen", f: karteOeffnen }); }
  if (z.typ === "person" && z.id === "ich") { a.push({ t: "Karte und Schnellreise", f: karteOeffnen }); a.push({ t: "Steuerung ansehen", f: hilfe }); }
}
function bodenKlick(p) {
  const c = K.ctx; if (K.fahrt) return true; const ich = c.ich; if (!ich) return false;
  const von = ichPos(), nach = [klemm(p.x, GRENZE.x0 + 1, GRENZE.x1 - 1), klemm(p.z, GRENZE.z0 + 1, GRENZE.z1 - 1)];
  const k = kollision(nach[0], nach[1], 0.2, true); if (k && k.art === "wasser") { c.ui.toast("Zum Schwimmen bitte den Badesee antippen."); return true; }
  if (k && k.t === "b" && k.art !== "heim" && k.art !== "fuss") return true;
  if (imHeim(von[0], von[1]) && imHeim(nach[0], nach[1])) { c.aufstehen(ich); ich.tempoF = 1; ++WS.laufId; c.geheZu(ich, nach[0], nach[1]); WS.pauseBisBewegung = false; return true; }
  laufe(routeGeh(von, nach)); return true;
}
function klickbar() {
  const l = Object.values(WS.welt.orte); if (K.park) l.push(K.park.mesh); Object.values(WS.tiere).forEach((T) => l.push(T.r.g));
  LEUTE.forEach((n) => { if (n.f.g.visible) l.push(n.f.g); }); ereignisGruppen().forEach((g) => l.push(g)); AUF.sterne.forEach((m) => { if (m.visible) l.push(m); });
  return l;
}

/* ---------- Taste E und nächstes Objekt ---------- */
function naechstesObjekt() {
  const c = K.ctx, ich = c.ich, p = ich.f.g.position; let best = null;
  const pr = (ziel, x, z, r, name) => { const d = Math.hypot(x - p.x, z - p.z); if (d < r && (!best || d < best.d)) best = { ziel, x, z, d, name }; };
  if (imHeim(p.x, p.z)) {
    Object.keys(c.moebel).forEach((id) => { const P = c.PLATZ[id]; if (!P) return; pr({ typ: "moebel", id }, P[0], P[1], 1.9, (c.KATALOG[id] && c.KATALOG[id].name) || ORT_NAME[id] || id); pr({ typ: "moebel", id }, P[3][0], P[3][1], 1.1, (c.KATALOG[id] && c.KATALOG[id].name) || ORT_NAME[id] || id); });
    Object.values(c.personen).forEach((q) => { if (q === ich || !q.f.g.visible) return; const nm = q.id === "partner" ? (c.s.partner || {}).name : q.id.startsWith("kind") ? (c.s.kinder[+q.id.slice(4)] || {}).name : null; if (nm) pr({ typ: "person", id: q.id }, q.f.g.position.x, q.f.g.position.z, 1.8, nm); });
    Object.values(WS.tiere).forEach((T) => pr({ typ: "tier", id: T.d.id }, T.r.g.position.x, T.r.g.position.z, 1.6, T.d.name));
  }
  if (K.park && c.s.auto) pr({ typ: "auto" }, K.park.mesh.position.x, K.park.mesh.position.z, 2.8, "Einsteigen, " + MODELLE[c.s.auto.modell].name);
  Object.entries(ORTE).forEach(([id, o]) => { if (id !== "haus") pr({ typ: "ort", id }, o.tor[0], o.tor[1], 3, o.kurz || o.name); });
  LEUTE.forEach((n) => { if (n.f.g.visible) pr({ typ: "npc", id: n.id }, n.f.g.position.x, n.f.g.position.z, 1.9, n.name); });
  Object.values(EREIG.aktiv).forEach((e) => { if (!e.g || e.id === "feuerwerk" || e.id === "ballon") return; if (!e.mitte || e.id === "roboter") e.mitte = new THREE.Box3().setFromObject(e.g).getCenter(new THREE.Vector3()); pr({ typ: "ereignis", id: e.id }, e.mitte.x, e.mitte.z, e.id === "flohmarkt" ? 6 : e.id === "baustelle" ? 7 : 3.2, ereignisName(e.id)); });
  return best;
}
function eTaste() {
  const c = K.ctx; if (!c.s || c.dialogOffen) return;
  if (K.fahrt) { if (K.modus === "rennen") return; aussteigenHier(); return; }
  const n = naechstesObjekt(); if (!n) { c.ui.toast("Hier ist nichts in Reichweite. Gehen Sie näher an Möbel, Personen oder Orte heran."); return; }
  if (n.ziel.typ === "auto") { zumAuto(() => steigEin()); return; }
  const v = new THREE.Vector3(n.x, 1.6, n.z).project(c.camera); c.zeigeMenue({ ziel: n.ziel, punkt: v }, (v.x + 1) / 2 * innerWidth, (1 - v.y) / 2 * innerHeight); fokusMenue();
}

/* ---------- Tastatur laufen ---------- */
function tastaturLaufen(dt) {
  const c = K.ctx, ich = c.ich; if (K.fahrt || c.dialogOffen || !richtungAktiv()) return;
  if (!ich.f.g.visible && !ich.drinnen) return;
  const a = achse(), ang = Math.PI / 4 + c.drehung * Math.PI / 2;
  let dx = -Math.sin(ang) * a.y + Math.cos(ang) * a.x, dz = -Math.cos(ang) * a.y - Math.sin(ang) * a.x; const l = Math.hypot(dx, dz) || 1; dx /= l; dz /= l;
  if (ich.aktiv || ich.sitzt || ich.liegt || ich.dann) { c.aufstehen(ich); ich.dann = null; ++WS.laufId; if (G()) gassiEnde(false); }
  if (ich.drinnen) { ich.f.g.position.set(ich.drinnen[0], 0, ich.drinnen[1]); ich.drinnen = null; ich.f.g.visible = true; }
  const p = ich.f.g.position, heim = imHeim(p.x, p.z); ich.tempoF = heim ? 1.35 : 2.3; const st = 0.45;
  let nx = p.x + dx * st, nz = p.z + dz * st;
  if (kollision(nx, nz, 0.32, true)) { if (!kollision(nx, p.z, 0.32, true)) nz = p.z; else if (!kollision(p.x, nz, 0.32, true)) nx = p.x; else { ich.ziel = null; ich.f.g.rotation.y = Math.atan2(dx, dz); return; } }
  ich.ziel = new THREE.Vector3(nx, 0, nz); ich.dann = null; ich.pose = null; WS.pauseBisBewegung = false;
}

/* ---------- Kamera ---------- */
function kameraFolgen(dt) {
  const c = K.ctx, pan = c.pan; if (K.fahrt && FAHR.modus === "hinten") return;
  if (!pan.equals(WS.letztePan)) { WS.pauseBis = performance.now() + 5000; }
  if (!WS.folgen || WS.pauseBisBewegung || performance.now() < WS.pauseBis) { WS.letztePan.copy(pan); return; }
  const f = K.fahrt ? K.fahrt.mesh.position : c.ich.f.g.position;
  const zx = imHeim(f.x, f.z) && !K.fahrt ? 0 : f.x - MITTE.x, zz = imHeim(f.x, f.z) && !K.fahrt ? 0 : f.z - MITTE.z;
  const k = Math.min(1, dt * (K.fahrt ? 5 : 2.6)); const nx = pan.x + (zx - pan.x) * k, nz = pan.z + (zz - pan.z) * k;
  if (Math.abs(nx - pan.x) > 1e-4 || Math.abs(nz - pan.z) > 1e-4) { pan.x = nx; pan.z = nz; c.groesse(); }
  WS.letztePan.copy(pan);
}

/* ---------- Hauptschleife ---------- */
function update(dt, t) {
  const c = K.ctx, s = c.s; if (!WS.welt) return;
  const zoom = c.zoom, fokus = K.fahrt ? K.fahrt.mesh.position : c.ich ? c.ich.f.g.position : MITTE;
  const h = s ? c.stunde() : 12, hell = h < 5 || h > 21.5 ? 0 : h < 7 ? (h - 5) / 2 : h > 19.5 ? (21.5 - h) / 2 : 1;
  stadtUpdate(WS.welt, dt, t, { hell, zoom, faehrt: !!K.fahrt, regen: !!EREIG.regen, himmel: !!(K.fahrt && FAHR.modus === "hinten") });
  if (!s || !c.ich) return;
  const laeuft = !c.dialogOffen && c.tempo > 0, ich = c.ich;
  tastaturLaufen(dt);
  fahrUpdate(dt, t, laeuft); if (RENN.aktiv && laeuft) rennUpdate(dt, t);
  const sicht = K.fahrt && FAHR.modus === "hinten" ? 70 : klemm(20 / zoom, 26, 95);
  leuteUpdate(dt, t, { stunde: h, fokus, laeuft, tempo: c.tempo, sicht, regen: !!EREIG.regen, baustelle: EREIG.baustelle, hindernisse: EREIG.hindernisse, ich });
  tiereUpdate(dt, t, laeuft);
  auftraegeUpdate(dt, t); if (laeuft) kurierUpdate(dt);
  ereignisseUpdate(dt, t, { fokus, laeuft, tempo: c.tempo });
  kameraFolgen(dt);
  const persp = !!(K.fahrt && FAHR.modus === "hinten"); if (WS.persp !== persp) { WS.persp = persp; etikettenModus(persp); }
  /* Sonne folgt dem Blick, damit Schatten überall stimmen */
  const W = c.W, ziel = K.fahrt ? fokus : new THREE.Vector3(MITTE.x + c.pan.x, 0, MITTE.z + c.pan.z); W.sonne.target.position.set(ziel.x, 0, ziel.z); W.sonne.position.set(ziel.x + 9, 22, ziel.z + 6); W.sonne.target.updateMatrixWorld();
  /* unsichtbar ohne Grund, dann wieder zeigen */
  if (!ich.f.g.visible && !K.fahrt && !c.dialogOffen && !ich.aktiv && !ich.ziel) { if (ich.drinnen) { ich.f.g.position.set(ich.drinnen[0], 0, ich.drinnen[1]); ich.drinnen = null; } ich.f.g.visible = true; }
  if (ich.f.g.visible && ich.drinnen && !ich.aktiv) ich.drinnen = null;
  if (G() && !ich.ziel && !c.dialogOffen && G().phase !== "erlebnis") { G().warte += dt; if (G().warte > 1.5) gassiEnde(false); } else if (G()) G().warte = 0;
  /* Türen öffnen ihr Menü beim Betreten mit der Tastatur */
  if (!K.fahrt && richtungAktiv() && !c.dialogOffen) { let nahOrt = null; Object.entries(ORTE).forEach(([id, o]) => { if (id !== "haus" && Math.hypot(o.tor[0] - fokus.x, o.tor[1] - fokus.z) < 1.1) nahOrt = id; });
    if (nahOrt && WS.ortNah !== nahOrt) { WS.ortNah = nahOrt; besuch(nahOrt); EIN.tasten.clear(); Object.keys(EIN.touch).forEach((k) => (EIN.touch[k] = false)); ich.ziel = null; ortMenue(nahOrt); } }
  if (WS.ortNah) { const o = ORTE[WS.ortNah]; if (Math.hypot(o.tor[0] - fokus.x, o.tor[1] - fokus.z) > 3) WS.ortNah = null; }
  /* Fahrhinweis und E-Hinweis */
  WS.hintT -= dt; if (WS.hintT <= 0) { WS.hintT = 0.15;
    if (K.fahrt) { eHinweis(null); if (!RENN.aktiv) { let best = null; Object.entries(ORTE).forEach(([id, o]) => { const d = Math.min(dist([fokus.x, fokus.z], o.park), dist([fokus.x, fokus.z], o.tor)); if (d < 8 && (!best || d < best.d)) best = { id, d }; }); ortHinweis(best ? (best.id === "haus" ? "Zu Hause · E zum Aussteigen" : "Hier anhalten, " + (ORTE[best.id].kurz || ORTE[best.id].name) + " · Taste E") : null); } }
    else if ((EIN.benutzt || document.body.classList.contains("kreuz-an")) && !c.dialogOffen && $("menue").hidden) { const n = naechstesObjekt(); if (n) { const v = new THREE.Vector3(n.x, 2.3, n.z).project(c.camera); eHinweis((IS_TOUCH ? "E tippen · " : "E drücken · ") + n.name, (v.x + 1) / 2 * innerWidth, (1 - v.y) / 2 * innerHeight); } else eHinweis(null); }
    else eHinweis(null); }
  WS.miniT -= dt; if (WS.miniT <= 0) { WS.miniT = 0.2; const ang = Math.PI / 4 + c.drehung * Math.PI / 2; let rot = -Math.PI / 2 - Math.atan2(-Math.cos(ang), -Math.sin(ang)); if (K.fahrt && FAHR.modus === "hinten") rot = -Math.PI / 2 - Math.atan2(Math.cos(K.fahrt.h), Math.sin(K.fahrt.h));
    miniUpdate({ x: fokus.x, z: fokus.z, rot, blick: K.fahrt ? K.fahrt.h : ich.f.g.rotation.y, auto: K.park ? K.park.mesh.position : null });
    const hf = $("hFitness"); if (hf) hf.textContent = s.fitness; const hs = $("hSterne"); if (hs) hs.textContent = s.wissenssterne.length + "/" + STERN_ORTE.length; }
  durchsicht(dt, fokus);
  WS.ladenT -= dt; if (WS.ladenT <= 0) { WS.ladenT = 2; ladenSchildSetzen(WS.welt, s.laden && typeof s.laden === "object" ? s.laden : null); }
}
/* Gebäude vor der Figur klappen flach wie im Puppenhaus, damit man die Figur sieht */
const _ray = new THREE.Ray(), _dir = new THREE.Vector3();
function durchsicht(dt, f) {
  const c = K.ctx, l = WS.welt.durchsicht; WS.dsT = (WS.dsT || 0) - dt;
  if (WS.dsT <= 0) { WS.dsT = 0.12; const aus = K.fahrt && FAHR.modus === "hinten"; c.camera.getWorldDirection(_dir); _ray.origin.set(f.x, 1.0, f.z); _ray.direction.copy(_dir).negate();
    l.forEach((g) => { g.userData.zielY = !aus && _ray.intersectsBox(g.userData.bb) ? 0.1 : 1; }); }
  l.forEach((g) => { const z = g.userData.zielY || 1; if (Math.abs(g.scale.y - z) > 0.001) { g.scale.y += (z - g.scale.y) * Math.min(1, dt * 8); if (Math.abs(g.scale.y - z) < 0.01) g.scale.y = z; } });
}
function zeitFaktor() { return K.modus === "rennen" ? 0.25 : KUR.aktiv ? 0.5 : 1; }

/* ---------- Testhaken ---------- */
const test = {
  orte: ORTE, K, WS, EIN, LEUTE, AUF, KUR, RENN, EREIG, FAHR,
  teleport: (x, z) => { const ich = K.ctx.ich; if (K.fahrt) aussteigen(); K.ctx.aufstehen(ich); ich.ziel = null; ich.f.g.position.set(x, 0, z); ich.f.g.visible = true; },
  autoKaufen: (modell, farbe) => { const s = K.ctx.s; s.autos.push({ modell, farbe: farbe || MODELLE[modell].farben[0] }); s.auto = { modell, farbe: farbe || MODELLE[modell].farben[0] }; parkeEigenes(EINFAHRT.x, EINFAHRT.z, 0); K.ctx.pruefeZiele(); },
  einsteigen: () => steigEin(), aussteigen: () => aussteigenHier(), faehrt: () => K.faehrt, nachHause: () => nachHauseFahren(), hinfahren: (id) => hinfahren(id), hingehen: (id) => hingehen(id),
  tierKaufen: (art, name) => { const s = K.ctx.s; const t = { id: "t" + Math.random().toString(36).slice(2, 7), art, name: name || ARTEN[art].namen[0], hunger: 80, liebe: 60, geboren: s.zeit }; s.tiere.push(t); tierSpawnen(t); K.ctx.pruefeZiele(); return t.id; },
  gassi: (id) => gassi(K.ctx.s.tiere.find((t) => t.id === id) || K.ctx.s.tiere.find((t) => t.art === "hund")), gassiAktiv: () => !!WS.gassi,
  aktionen: (z) => aktionen(z), ortAktionen: (id) => ortAktionen(id), tierAktionen: (id) => tierAktionen(id), naechstes: () => naechstesObjekt(),
  ereignis: (id) => ereignisStart(id), regen: (g) => regenStart(g), kurier: (id, art) => kurierLos(id || "logistik", art || "frage"), rennen: () => rennenLos(), tour: () => tourStarten(), stadt: stadtAnsicht, zumHaus,
  pos: () => ichPos(), autoPos: () => (K.fahrt ? [K.fahrt.mesh.position.x, K.fahrt.mesh.position.z, K.fahrt.v] : K.park ? [K.park.mesh.position.x, K.park.mesh.position.z] : null)
};
export const WELT = { baue, start, update, kamera: fahrKamera, zeitFaktor, istWeltZiel, aktionen, titel, ergaenze, bodenKlick, klickbar, grenzen: { x0: GRENZE.x0 - MITTE.x, x1: GRENZE.x1 - MITTE.x, z0: GRENZE.z0 - MITTE.z, z1: GRENZE.z1 - MITTE.z }, zoomMin: 0.22, faehrt: () => K.faehrt, test };
