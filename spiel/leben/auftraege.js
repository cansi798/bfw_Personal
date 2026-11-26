/* Nordstern Leben · Nebenaufträge, Wissenssterne und Lern-Tour
   © 2026 Waybuild Akademie, Waybuild UG (haftungsbeschränkt). Alle Rechte vorbehalten. · www.waybuild.de */
import { THREE, K } from "./bau.js";
import { baueStern } from "./welt.js";
import { STERN_ORTE, TOUR_PUNKTE, ORTE } from "./stadt.js";
import { neuerNpc } from "./leute.js";
import { MARKER } from "./karte.js";
import { zielMarke, panel } from "./kurier.js";

export const AUFTRAEGE = {
  demir: { name: "Frau Demir", typ: "frau", look: { koerper: "frau", haut: "#c68b5e", haar: "dutt", haarfarbe: "#2b1b12", oben: "#0f5c63", hose: "#24323a", rock: true }, x: 47, z: 22.7, blick: Math.PI, titel: "Personalakten sortieren",
    text: "Frau Demir aus der Personalleitung steht vor einem Stapel Akten. „Können Sie mir beim Sortieren helfen? Pro richtig einsortierter Akte gibt es 25 € aus dem Budget für Sonderaufgaben.“", art: "sort", n: 2, lohn: 25 },
  brandt: { name: "Herr Brandt", typ: "mann", look: { koerper: "mann", haut: "#f3d3bd", haar: "seitenscheitel", haarfarbe: "#8c8c8c", oben: "#8a6d4b", hose: "#4a4a4a", brille: true, bart: "schnurr" }, x: -2.4, z: 26.3, blick: Math.PI, titel: "Excel-Liste prüfen",
    text: "Herr Brandt sitzt in seinem Sakko von 1998 auf der Parkbank und rollt die Excel-Liste aus. „Zwei Fragen, dann ist meine Liste fehlerfrei. Für jede richtige Antwort 30 €.“", art: "frage", n: 2, lohn: 30 },
  paula: { name: "Paula Probezeit", typ: "frau", look: { koerper: "frau", haut: "#e2b18b", haar: "pferdeschwanz", haarfarbe: "#a0662f", oben: "#d9a42b", hose: "#3a3a5a" }, x: -11.4, z: 46.4, blick: 0, titel: "Fachbegriff für den Post",
    text: "Paula Probezeit hat 12 Follower und möchte endlich etwas Fachliches posten. „Erklären Sie mir einen Begriff? Wenn der Kurzcheck sitzt, bekommen Sie 30 € und eine Erwähnung.“", art: "lern", n: 1, lohn: 30 },
  kowalski: { name: "Frau Kowalski vom Betriebsrat", typ: "seniorin", look: { koerper: "frau", haut: "#f0c8a8", haar: "kurz", haarfarbe: "#c9c9c9", oben: "#c9503b", hose: "#2f3b4a", brille: true }, x: -7, z: 66.2, blick: Math.PI, titel: "Antrag zum Werk bringen",
    text: "Frau Kowalski vom Betriebsrat drückt Ihnen einen Antrag in die Hand. „Bitte bringen Sie den zu Frau Demir in die Fahrradwerke. Dort wartet eine Frage auf Sie, und 50 € Botenlohn.“", art: "bote", n: 1, lohn: 50 },
  leon: { name: "Azubi Leon", typ: "mann", look: { koerper: "mann", haut: "#8d5a3b", haar: "undercut", haarfarbe: "#1d1d1d", oben: "#6fb7e0", hose: "#2f3b4a" }, x: -38, z: 22.7, blick: Math.PI, titel: "Prüfungsvorbereitung am See",
    text: "Azubi Leon lernt am Badesee für die Prüfung. „Fragen Sie mich ab, nein, besser umgekehrt. Drei Fragen, für jede richtige 20 €.“", art: "frage", n: 3, lohn: 20 },
  hinrichs: { name: "Opa Hinrichs", typ: "senior", look: { koerper: "mann", haut: "#f3d3bd", haar: "glatze", haarfarbe: "#e8e8e8", oben: "#6f8f7b", hose: "#4a3d33", bart: "voll", brille: true }, x: -19.4, z: -42.3, blick: -Math.PI / 2, titel: "Früher war alles analog",
    text: "Opa Hinrichs genießt die Aussicht. „Früher hatten wir Lochkarten. Sortieren Sie mir das mal nach heutiger Art, dann gibt es 40 € von meiner Rente.“", art: "sort", n: 1, lohn: 40 }
};
export const AUF = { npcs: {}, sterne: [], bote: null, tour: null };
export function initAuftraege() {
  Object.entries(AUFTRAEGE).forEach(([id, a]) => { AUF.npcs[id] = neuerNpc({ typ: a.typ, look: a.look, name: a.name, x: a.x, z: a.z, blick: a.blick, fest: true, auftrag: id, rolle: "auftrag" }); if (id === "brandt") { const n = AUF.npcs[id]; n.sitzt = true; } });
  STERN_ORTE.forEach(([x, z], i) => { const m = baueStern(); m.scale.setScalar(3.2); m.position.set(x, 1.4, z); m.material = m.material.clone(); m.material.emissive.set("#a07a00"); m.userData.ziel = { typ: "stern", id: i }; K.scene.add(m); AUF.sterne.push(m); });
}
function stand() { const s = K.ctx.s, tg = K.ctx.lebensTag(); if (!s.auftraege || s.auftraege.tag !== tg) s.auftraege = { tag: tg, fertig: {} }; return s.auftraege; }
export const offen = (id) => !stand().fertig[id];
export function auftragAktionen(id) {
  const c = K.ctx, a = AUFTRAEGE[id], l = [];
  l.push({ t: "Ansprechen", f: () => c.ui.toast(a.name + " sagt „" + c.pick(["Schön, Sie zu sehen. Haben Sie heute schon etwas gelernt?", "Ich habe gerade Pause. Gesetzlich vorgeschrieben, versteht sich.", "Wussten Sie, dass in Nordstern City jeder Tag ein Lerntag ist?"]) + "“") });
  if (AUF.bote && AUF.bote.id === id) l.push({ gesperrt: "Der Antrag ist schon unterwegs zum Werk" });
  else if (offen(id)) l.push({ t: "Auftrag " + a.titel, f: () => annehmen(id) });
  else l.push({ gesperrt: "Für heute erledigt, morgen gibt es Neues" });
  return l;
}
function annehmen(id) {
  const c = K.ctx, a = AUFTRAEGE[id];
  c.info(a.titel, `<p>${c.esc(a.text)}</p>`, [["Mache ich", () => starten(id)], ["Später", null]]);
}
function belohnen(id, richtig, n) {
  const c = K.ctx, a = AUFTRAEGE[id], g = richtig * a.lohn; c.s.geld += g; stand().fertig[id] = 1; c.s.besucht._auftraege = (c.s.besucht._auftraege || 0) + 1;
  c.klang(g ? "kasse" : "klick"); c.ui.toast(a.name + (g ? " bedankt sich. Plus " + c.euro(g) : " bedankt sich trotzdem. Morgen gibt es eine neue Chance"), g ? "geld" : ""); c.s.bed.sozial = Math.min(100, c.s.bed.sozial + 15); c.hud(); c.speichern(); c.pruefeZiele();
}
function starten(id) {
  const c = K.ctx, a = AUFTRAEGE[id], n = AUF.npcs[id];
  if (a.art === "frage") c.frageRunde({ titel: a.titel, intro: a.name + " fragt zum Thema " + c.day.title + ".", anzahl: a.n, ende: "Fertig", lob: [a.name + " nickt zufrieden."], tadel: [a.name + " erklärt es noch einmal geduldig."], fertig: (r) => belohnen(id, r, a.n) });
  else if (a.art === "sort") { let i = 0, r = 0; const next = () => c.sortFrage({ titel: a.titel, intro: a.name + " reicht Ihnen eine Akte.", fertig: (ok) => { if (ok) r++; i++; if (i < a.n) setTimeout(next, 50); else belohnen(id, r, a.n); } }); next(); }
  else if (a.art === "lern") c.lernKarte({ titel: a.titel, intro: "Paula Probezeit hält schon das Handy bereit.", fertig: (ok) => { c.lernFertig(ok); belohnen(id, ok ? 1 : 0, 1); if (ok) c.ui.toast("Paula postet den Begriff. Jetzt hat sie 13 Follower."); } });
  else if (a.art === "bote") { const z = ORTE.werk.tor; AUF.bote = { id, x: z[0], z: z[1], g: zielMarke(z[0], z[1], "#c9a227", "Antrag") }; MARKER.push({ x: z[0], z: z[1], art: "ziel", text: "!", bote: true }); c.ui.toast("Bringen Sie den Antrag zu den Nordstern Fahrradwerken. Der Ort ist auf der Karte markiert.", "gut"); }
  if (n) { n.f.g.rotation.y = Math.atan2(c.ich.f.g.position.x - n.f.g.position.x, c.ich.f.g.position.z - n.f.g.position.z); }
}
export function sternSammeln(i) {
  const c = K.ctx, s = c.s; if (s.wissenssterne.includes(i)) return; s.wissenssterne.push(i); const m = AUF.sterne[i]; m.visible = false; c.funken(m.position); c.klang("ziel");
  c.lernKarte({ titel: "Wissensstern " + s.wissenssterne.length + " von " + STERN_ORTE.length, intro: "Sie haben einen versteckten Wissensstern gefunden. Er leuchtet mit einem Fachbegriff des Tages.", fertig: (ok) => { c.lernFertig(ok); c.pruefeZiele(); } });
}
export function tourStarten() {
  const c = K.ctx; if (AUF.tour) return;
  const p = c.mischen(TOUR_PUNKTE.filter((q) => Math.hypot(q[0] - ORTE.rathaus.tor[0], q[1] - ORTE.rathaus.tor[1]) > 5)).slice(0, 5);
  AUF.tour = { punkte: p, i: 0, richtig: 0, g: null }; tourPunkt(); c.ui.toast("Lern-Tour gestartet. Folgen Sie den blauen Lichtsäulen, zu Fuß oder mit dem Auto.", "gut");
}
function tourPunkt() {
  const T = AUF.tour, c = K.ctx; if (T.g) K.scene.remove(T.g); for (let i = MARKER.length - 1; i >= 0; i--) if (MARKER[i].tour) MARKER.splice(i, 1);
  if (T.i >= T.punkte.length) { AUF.tour = null; panel(null); c.s.wissen += 2; c.s.geld += 60; c.s.besucht._tour = (c.s.besucht._tour || 0) + 1; c.klang("ziel");
    c.info("Lern-Tour geschafft", `<p class="gross">${T.richtig} von ${T.punkte.length} Kurzchecks richtig</p><p>Als Bonus gibt es 2 Wissenspunkte und 60 € vom Rathaus. Der Bürgermeister lässt ausrichten, Sie hätten mehr gelernt als der Stadtrat in einer Sitzungswoche.</p>`); c.pruefeZiele(); c.hud(); return; }
  const [x, z] = T.punkte[T.i]; T.g = zielMarke(x, z, "#4aa3d8", "Lernpunkt " + (T.i + 1)); MARKER.push({ x, z, art: "tour", text: String(T.i + 1), tour: true });
  panel(`<p class="tkopf">Lern-Tour · Lernpunkt ${T.i + 1} von ${T.punkte.length}</p><p class="tklein">Die blaue Lichtsäule zeigt den Weg, auch auf der Minikarte. <button type="button" class="tabbr" id="tAbbr">Tour beenden</button></p>`);
  document.getElementById("tAbbr").onclick = () => { if (T.g) K.scene.remove(T.g); for (let i = MARKER.length - 1; i >= 0; i--) if (MARKER[i].tour) MARKER.splice(i, 1); AUF.tour = null; panel(null); };
}
export function auftraegeUpdate(dt, t) {
  const c = K.ctx; if (!c.s) return; const ich = c.ich, p = K.fahrt ? K.fahrt.mesh.position : ich.f.g.position, r = K.fahrt ? 3.2 : 1.6;
  Object.entries(AUF.npcs).forEach(([id, n]) => { if (n.marker) { n.marker.visible = offen(id) && !(AUF.bote && AUF.bote.id === id); n.marker.position.y = 2.75 + Math.sin(t * 3) * 0.1; } });
  for (let i = MARKER.length - 1; i >= 0; i--) if (MARKER[i].auftragNpc) MARKER.splice(i, 1);
  Object.entries(AUF.npcs).forEach(([id, n]) => { if (n.marker && n.marker.visible) MARKER.push({ x: n.f.g.position.x, z: n.f.g.position.z, art: "auftrag", text: "!", auftragNpc: true }); });
  AUF.sterne.forEach((m, i) => { m.visible = !c.s.wissenssterne.includes(i); if (!m.visible) return; m.rotation.y = t * 1.6; m.position.y = 1.4 + Math.sin(t * 2 + i) * 0.15; });
  if (c.dialogOffen || K.modus === "rennen") return;
  const st = AUF.sterne.findIndex((m, i) => m.visible && Math.hypot(m.position.x - p.x, m.position.z - p.z) < r + 0.4);
  if (st >= 0) { if (K.fahrt) K.fahrt.v = 0; sternSammeln(st); return; }
  const B = AUF.bote; if (B && Math.hypot(B.x - p.x, B.z - p.z) < r + 1.4) { AUF.bote = null; K.scene.remove(B.g); for (let i = MARKER.length - 1; i >= 0; i--) if (MARKER[i].bote) MARKER.splice(i, 1); if (K.fahrt) K.fahrt.v = 0;
    c.frageRunde({ titel: "Antrag abgegeben", intro: "Frau Demir nimmt den Antrag entgegen und stellt eine Frage zum Thema " + c.day.title + ".", anzahl: 1, ende: "Fertig", fertig: (rr) => belohnen(B.id, rr, 1) }); return; }
  const T = AUF.tour; if (T && T.g) { const [x, z] = T.punkte[T.i]; T.g.children[0].rotation.y = t; if (Math.hypot(x - p.x, z - p.z) < r + 0.8) { K.scene.remove(T.g); T.g = null; if (K.fahrt) K.fahrt.v = 0;
    c.lernKarte({ titel: "Lern-Tour, Lernpunkt " + (T.i + 1), intro: "Am Lernpunkt steht eine Infotafel mit einem Fachbegriff des Tages.", fertig: (ok) => { if (ok) { T.richtig++; c.s.wissen += 0; } c.lernFertig(ok); T.i++; tourPunkt(); } }); } }
}
