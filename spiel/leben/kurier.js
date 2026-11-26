/* Nordstern Leben · Kurierjob, Logistik mit Depots und Lieferpunkte als Antworten
   © 2026 Waybuild Akademie, Waybuild UG (haftungsbeschränkt). Alle Rechte vorbehalten. · www.waybuild.de */
import { THREE, K, etikett, etikettMerken, lam } from "./bau.js";
import { LIEFERPUNKTE } from "./stadt.js";
import { MARKER } from "./karte.js";

const $ = (id) => document.getElementById(id);
const BU = ["A", "B", "C", "D"], FARBEN = ["#0f5c63", "#c9a227", "#7b2338", "#1f3557"];
export function sterneSetzen(key, n) { try { const o = JSON.parse(localStorage.getItem("pe26_spiel") || "{}") || {}; const k = K.ctx.tag + "-" + key; if (!(o[k] >= n)) { o[k] = n; localStorage.setItem("pe26_spiel", JSON.stringify(o)); } } catch (e) {} }
export const sterneNachQuote = (r, n) => { const q = n ? r / n : 0; return q >= 0.8 ? 3 : q >= 0.5 ? 2 : q > 0 ? 1 : 0; };
/* Leuchtende Zielmarke mit Buchstabe */
export function zielMarke(x, z, farbe, text) {
  const g = new THREE.Group(); g.position.set(x, 0, z);
  const s = new THREE.Mesh(new THREE.CylinderGeometry(1.6, 1.6, 9, 20, 1, true), new THREE.MeshBasicMaterial({ color: farbe, transparent: true, opacity: 0.22, depthWrite: false, side: THREE.DoubleSide })); s.position.y = 4.5; g.add(s);
  const r = new THREE.Mesh(new THREE.RingGeometry(1.5, 2.1, 24), new THREE.MeshBasicMaterial({ color: farbe, side: THREE.DoubleSide })); r.rotation.x = -Math.PI / 2; r.position.y = 0.08; g.add(r);
  if (text) { const e = etikettMerken(etikett(text, { bg: farbe, fg: "#ffffff", pw: 256, ph: 128, rad: 50, tiefe: false }), [2.4, 1.2], [0.12, 0.06]); e.position.y = 5.2; g.add(e); g.userData.etikett = e; }
  K.scene.add(g); return g;
}
export function panel(html) { let p = $("auftragTafel"); if (!p) { p = document.createElement("div"); p.id = "auftragTafel"; p.className = "auftragtafel"; document.body.appendChild(p); } p.hidden = !html; if (html) p.innerHTML = html; return p; }
export const KUR = { aktiv: null };
export function kurierStart(art, fahrzeugStart) {
  const c = K.ctx; if (KUR.aktiv) return;
  if (art === "logistik" && !(c.day.sortier || []).length) art = "frage";
  KUR.aktiv = { art, runde: 0, n: 5, richtig: 0, liste: [], punkte: [], lohn: 0 };
  fahrzeugStart();
  c.ui.toast(art === "frage" ? "Kurierjob gestartet. Fahren Sie zur Adresse mit der richtigen Antwort." : "Logistikjob gestartet. Bringen Sie jedes Paket ins richtige Depot.", "gut");
  naechsteRunde();
}
function aufraeumen() { const a = KUR.aktiv; if (!a) return; a.punkte.forEach((p) => K.scene.remove(p.g)); a.punkte = []; for (let i = MARKER.length - 1; i >= 0; i--) if (MARKER[i].kurier) MARKER.splice(i, 1); }
function naechsteRunde() {
  const c = K.ctx, a = KUR.aktiv; aufraeumen();
  if (a.runde >= a.n) return ende();
  const m = K.fahrt ? K.fahrt.mesh.position : c.ich.f.g.position;
  const frei = c.mischen(LIEFERPUNKTE.filter((p) => Math.hypot(p[0] - m.x, p[1] - m.z) > 22 && Math.hypot(p[0] - m.x, p[1] - m.z) < 95));
  if (a.art === "frage") {
    const q = c.naechsteFrage(), reihe = c.mischen([0, 1, 2, 3]); a.q = { q, reihe };
    reihe.forEach((oi, j) => { const p = frei[j]; a.punkte.push({ x: p[0], z: p[1], ok: oi === q.c, text: q.o[oi], bu: BU[j], g: zielMarke(p[0], p[1], FARBEN[j], BU[j]) }); MARKER.push({ x: p[0], z: p[1], art: BU[j], text: BU[j], kurier: true }); });
    panel(`<p class="tkopf">Kurierjob · Lieferung ${a.runde + 1} von ${a.n}</p><p class="tfrage">${c.esc(q.q)}</p><ol class="topts">${reihe.map((oi, j) => `<li><b style="background:${FARBEN[j]}">${BU[j]}</b>${c.esc(q.o[oi])}</li>`).join("")}</ol><p class="tklein">Fahren Sie zur Adresse mit der richtigen Antwort. <button type="button" class="tabbr" id="kAbbr">Job beenden</button></p>`);
  } else {
    const x = c.naechsteSort(); a.q = { x };
    x.kat.forEach((kk, j) => { const p = frei[j]; a.punkte.push({ x: p[0], z: p[1], ok: kk.id === x.it.kat, text: kk.name, bu: BU[j], g: zielMarke(p[0], p[1], FARBEN[j], "Depot " + BU[j]) }); MARKER.push({ x: p[0], z: p[1], art: BU[j], text: BU[j], kurier: true }); });
    panel(`<p class="tkopf">Logistik · Paket ${a.runde + 1} von ${a.n} · ${c.esc(x.titel)}</p><p class="tfrage">„${c.esc(x.it.text)}“</p><ol class="topts">${x.kat.map((kk, j) => `<li><b style="background:${FARBEN[j]}">${BU[j]}</b>Depot ${c.esc(kk.name)}</li>`).join("")}</ol><p class="tklein">Welches Depot passt? <button type="button" class="tabbr" id="kAbbr">Job beenden</button></p>`);
  }
  $("kAbbr").onclick = () => ende(true);
}
export function kurierUpdate(dt) {
  const a = KUR.aktiv; if (!a || !a.punkte.length) return; const c = K.ctx;
  const m = K.fahrt ? K.fahrt.mesh.position : c.ich.f.g.position;
  a.punkte.forEach((p) => { if (p.g.userData.etikett) p.g.userData.etikett.position.y = 5.2 + Math.sin(performance.now() / 300) * 0.2; });
  const tr = a.punkte.find((p) => Math.hypot(p.x - m.x, p.z - m.z) < (K.fahrt ? 2.8 : 1.8)); if (!tr) return;
  const ok = tr.ok, richtigP = a.punkte.find((p) => p.ok);
  c.antwortZaehlen(ok); c.klang(ok ? "richtig" : "falsch");
  const lohn = ok ? Math.round(20 + c.s.stufe * 6) : 0; c.s.geld += lohn; a.lohn += lohn; if (ok) a.richtig++;
  const erkl = a.art === "frage" ? a.q.q.e : a.q.x.it.expl, frage = a.art === "frage" ? a.q.q.q : "„" + a.q.x.it.text + "“";
  a.liste.push({ frage, ok, gew: tr.text, loes: richtigP.text, erkl });
  a.runde++; aufraeumen(); c.hud(); c.speichern();
  panel(`<p class="tkopf ${ok ? "ok" : "nein"}">${ok ? "Richtig geliefert, plus " + c.euro(lohn) : "Falsche Adresse"}</p>${ok ? "" : `<p>Richtig ist <b>${c.esc(richtigP.bu)}, ${c.esc(richtigP.text)}</b>.</p>`}<p class="terkl"><b>Erklärung</b> ${c.esc(erkl)}</p><p class="tklein">${a.runde < a.n ? "Die nächste Lieferung kommt gleich." : "Das war die letzte Lieferung."}</p>`);
  setTimeout(() => { if (KUR.aktiv === a) naechsteRunde(); }, 5200);
}
function ende(abbruch) {
  const c = K.ctx, a = KUR.aktiv; if (!a) return; aufraeumen(); KUR.aktiv = null; panel(null); if (KUR.endeCb) KUR.endeCb();
  const st = sterneNachQuote(a.richtig, Math.max(a.liste.length, abbruch ? a.liste.length : a.n)); if (a.liste.length) sterneSetzen("kurier", st);
  c.s.besucht._kurier = (c.s.besucht._kurier || 0) + 1; c.speichern(); c.pruefeZiele();
  if (!a.liste.length) { c.ui.toast("Kurierjob beendet."); return; }
  c.info(a.art === "frage" ? "Kurierjob erledigt" : "Logistikjob erledigt", `<p class="gross">${a.richtig} von ${a.liste.length} richtig</p><p>Verdienst ${c.euro(a.lohn)}. Sterne für den Kurierjob an diesem Tag ${"★".repeat(st)}${"☆".repeat(3 - st)}.</p>
    <ol class="uebersicht">${a.liste.map((l) => `<li class="${l.ok ? "ok" : "nein"}"><b>${c.esc(l.frage)}</b><br>${l.ok ? "Richtig" : "Ihre Wahl " + c.esc(l.gew) + ". Richtig ist " + c.esc(l.loes)}. <span class="hinweis">${c.esc(l.erkl)}</span></li>`).join("")}</ol>`, [["Weiter", null]]);
}
