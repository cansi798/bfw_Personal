/* Nordstern Leben · Lebenssimulation mit den Themen des Tages
   © 2026 Waybuild Akademie, Waybuild UG (haftungsbeschränkt). Alle Rechte vorbehalten. · www.waybuild.de */
import { THREE, IS_TOUCH, erstelleWelt, setzeKamera, baueMoebel, baueFigur, bewegeFigur, baueBaby, baueStern, baueStorch, konfetti } from "./welt.js";
/* ERW-INHALT: Module für Kleidung, Laden, Ereignisse, Atelier und Alltag */
import * as KLEIDUNG from "./kleidung.js";
import * as EREIGNISSE from "./ereignisse.js";
import * as LADEN from "./laden.js";
import * as ATELIER from "./atelier.js";
import * as ALLTAG from "./alltag.js";
/* /ERW-INHALT */

const S = window.SPIEL || { days: [] }, H = window.HUMOR || {};
const $ = (id) => document.getElementById(id);
const esc = (s) => String(s == null ? "" : s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
const pick = (a) => a[Math.floor(Math.random() * a.length)];
const mischen = (a) => { a = a.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
const euro = (n) => Math.round(n).toLocaleString("de-DE") + " €";
const BU = ["A", "B", "C", "D"];

/* ---------- Tag ---------- */
const params = new URLSearchParams(location.search);
function heuteTag() { let t = 1; const now = new Date(); now.setHours(0, 0, 0, 0); S.days.forEach((d) => { const x = d.date.split("."); if (new Date(+x[2], +x[1] - 1, +x[0]) <= now) t = d.nr; }); return t; }
let tag = parseInt(params.get("tag"), 10) || heuteTag();
let day = S.days.find((d) => d.nr === tag) || S.days[0]; tag = day.nr;

/* ---------- Spielstand ---------- */
const SPEICHER = "pe26_leben";
const BED = ["energie", "hunger", "hygiene", "spass", "sozial"];
const BED_NAME = { energie: "Energie", hunger: "Hunger", hygiene: "Hygiene", spass: "Spaß", sozial: "Soziales" };
const ABBAU = { energie: 3.2, hunger: 4.6, hygiene: 3.4, spass: 3.8, sozial: 3.0 };
const STUFEN = [
  { name: "Praktikum", ab: 0, lohn: 60 }, { name: "Ausbildung", ab: 4, lohn: 90 }, { name: "Sachbearbeitung Personal", ab: 12, lohn: 130 },
  { name: "Personalreferent/in", ab: 24, lohn: 170 }, { name: "Teamleitung Personal", ab: 38, lohn: 220 }, { name: "Personalleitung", ab: 55, lohn: 280 }
];
const KATALOG = {
  sofa: { name: "Sofa „Feierabend“", preis: 450, text: "Entspannen und später zu zweit kuscheln" },
  tv: { name: "Fernseher", preis: 600, text: "Viel Spaß, im Programm läuft Personalwesen" },
  regal: { name: "Bücherregal mit Fachbüchern", preis: 250, text: "Fachbegriffe lernen bringt Wissen und mehr Lohn" },
  herd: { name: "Herd", preis: 550, text: "Selbst kochen macht satter als jeder Snack" },
  tisch: { name: "Esstisch mit Stühlen", preis: 300, text: "Gemeinsam essen stärkt die Beziehung" },
  teppich: { name: "Teppich", preis: 120, text: "Gemütlicher, Entspannen bringt mehr Spaß" },
  pflanze: { name: "Ficus „Herzberg“", preis: 60, text: "Ein Hygienefaktor fürs Wohnzimmer" },
  lampe: { name: "Stehlampe", preis: 90, text: "Licht für lange Lernabende" },
  kinderbett: { name: "Kinderbett", preis: 400, text: "Nötig, um eine Familie zu gründen" },
  spielzeug: { name: "Spielzeugkiste", preis: 150, text: "Zum Spielen mit dem Kind" },
  ring: { name: "Verlobungsring", preis: 800, text: "Für den Antrag, wenn die Beziehung stimmt", inventar: true },
  bogen: { name: "Hochzeitsbogen im Garten", preis: 1200, text: "Ohne Bogen keine Hochzeit, sagt die Planerin" }
};
const START_MOEBEL = ["bett", "kuehl", "dusche", "waschbecken", "pc", "theke", "tuer", "briefkasten"];
/* Position, Drehung, Nutzpunkt */
const PLATZ = {
  bett: [1.4, 1.35, 0, [2.75, 1.9]], kinderbett: [3.9, 0.95, 0, [3.9, 2.1]], spielzeug: [3.9, 3.7, 0, [3.0, 3.7]],
  dusche: [5.75, 0.75, 0, [6.4, 2.0]], waschbecken: [7.3, 0.4, 0, [7.3, 1.25]], regal: [8.9, 0.35, 0, [8.9, 1.35]],
  pc: [11.0, 0.7, 0, [11.0, 1.55]], lampe: [13.3, 0.6, 0, [12.7, 1.5]],
  tv: [0.45, 7.5, Math.PI / 2, [2.0, 6.3]], sofa: [3.3, 7.5, -Math.PI / 2, [3.3, 8.8]], teppich: [2.0, 7.5, 0, [2.0, 7.5]], pflanze: [6.4, 9.4, 0, [5.6, 9.2]],
  kuehl: [7.6, 5.55, 0, [7.6, 6.5]], herd: [8.6, 5.5, 0, [8.6, 6.5]], theke: [9.8, 5.5, 0, [9.8, 6.5]], tisch: [11.6, 8.0, 0, [10.75, 8.9]],
  tuer: [7.0, 10.15, 0, [7.0, 10.95]], briefkasten: [9.0, 12.2, 0, [9.0, 11.55]], bogen: [4.0, 12.4, 0, [4.0, 13.2]]
};
/* ERW-INHALT: Kennenlernen mit sechs Personen, drei Frauen und drei Männer, mit Beruf und Hobby. Die ids alex, robin und sam bleiben für alte Spielstände. */
const KANDIDATEN = [
  { id: "alex", name: "Alex Sommer", rolle: "Lohnbuchhaltung", beruf: "Lohnbuchhalter", hobby: "Sonnenuntergänge fotografieren", text: "liebt Excel-Tabellen und Sonnenuntergänge", look: { haut: "#e2b18b", haar: "kurz", haarfarbe: "#5a3a22", oben: "#1f3557", hose: "#3d3d4a", koerper: "mann", bart: "kurz" } },
  { id: "robin", name: "Robin Kaya", rolle: "Betriebsrat", beruf: "Betriebsrätin", hobby: "Tango tanzen", text: "fordert Mitbestimmung auch beim Abendessen", look: { haut: "#c68b5e", haar: "locken", haarfarbe: "#2b1b12", oben: "#c9503b", hose: "#2f3b4a", koerper: "frau" } },
  { id: "sam", name: "Sam Petrow", rolle: "Ausbildungsleitung", beruf: "Ausbildungsleiterin", hobby: "Brettspiele", text: "erklärt alles zweimal, aber mit Herz", look: { haut: "#f3d3bd", haar: "lang", haarfarbe: "#d8b26e", oben: "#6f8f7b", hose: "#4a3d33", rock: true, koerper: "frau" } },
  { id: "kai", name: "Kai Lindner", rolle: "Arbeitssicherheit", beruf: "Fachkraft für Arbeitssicherheit", hobby: "Bouldern", text: "trägt sogar beim Grillen Sicherheitsschuhe", look: { haut: "#8d5a3b", haar: "kurz", haarfarbe: "#2b1b12", oben: "#e0a72e", hose: "#24323a", koerper: "mann", bart: "voll" } },
  { id: "mats", name: "Mats Okafor", rolle: "Recruiting", beruf: "Recruiter", hobby: "Kochen", text: "findet für jede Stelle die passende Person, nur nicht für sich", look: { haut: "#5c3a26", haar: "kurz", haarfarbe: "#2b1b12", oben: "#6fb7e0", hose: "#3d3d4a", koerper: "mann" } },
  { id: "lina", name: "Lina Hoffmann", rolle: "Personalentwicklung", beruf: "Personalentwicklerin", hobby: "Gärtnern", text: "plant Karrierewege wie andere Urlaubsreisen", look: { haut: "#f3d3bd", haar: "dutt", haarfarbe: "#7a2e2a", oben: "#b07ad8", hose: "#2f3b4a", rock: true, koerper: "frau" } }
];
/* /ERW-INHALT */
const GAESTE = [
  { name: "Frau Demir", look: { haut: "#c68b5e", haar: "dutt", haarfarbe: "#2b1b12", oben: "#0f5c63", hose: "#24323a", rock: true } },
  { name: "Herr Brandt", look: { haut: "#f3d3bd", haar: "kurz", haarfarbe: "#8c8c8c", oben: "#8a6d4b", hose: "#4a4a4a", brille: true } },
  { name: "Paula Probezeit", look: { haut: "#e2b18b", haar: "lang", haarfarbe: "#a0662f", oben: "#d9a42b", hose: "#3a3a5a" } }
];
const ZIELE = [
  { id: "arbeit1", text: "Die erste Schicht bei Nordstern arbeiten", lohn: 100, ok: (s) => s.schichten >= 1 },
  { id: "kauf1", text: "Das erste Möbelstück kaufen", lohn: 50, ok: (s) => s.gekauft.some((k) => !KATALOG[k]?.inventar) },
  { id: "richtig10", text: "10 Fragen richtig beantworten", lohn: 150, ok: (s) => s.richtig >= 10 },
  { id: "lernen3", text: "3 Fachbegriffe lernen, im Regal oder am PC", lohn: 150, ok: (s) => s.gelernt >= 3 },
  { id: "kennen", text: "Jemanden aus der Nachbarschaft kennenlernen", lohn: 50, ok: (s) => !!s.partner },
  { id: "freund", text: "Eine Freundschaft schließen", lohn: 100, ok: (s) => s.partner && s.partner.bez >= 30 },
  { id: "befoerdert", text: "Zur Sachbearbeitung Personal befördert werden", lohn: 200, ok: (s) => s.stufe >= 2 },
  { id: "verliebt", text: "Sich verlieben", lohn: 100, ok: (s) => s.partner && s.partner.bez >= 60 },
  { id: "verlobt", text: "Sich verloben", lohn: 200, ok: (s) => s.partner && (s.partner.verlobt || s.partner.verheiratet) },
  { id: "heirat", text: "Heiraten", lohn: 300, ok: (s) => s.partner && s.partner.verheiratet },
  { id: "kind", text: "Ein Kind bekommen", lohn: 300, ok: (s) => s.kinder.length >= 1 },
  { id: "hausaufgaben", text: "Mit dem Kind Hausaufgaben machen", lohn: 150, ok: (s) => s.hausaufgaben >= 1 },
  { id: "haus", text: "Das Haus komplett einrichten", lohn: 300, ok: (s) => Object.keys(KATALOG).filter((k) => !KATALOG[k].inventar).every((k) => s.gekauft.includes(k)) },
  { id: "richtig40", text: "40 Fragen richtig beantworten", lohn: 400, ok: (s) => s.richtig >= 40 },
  { id: "leitung", text: "Personalleitung werden", lohn: 500, ok: (s) => s.stufe >= 5 }
];
function neuerStand(look, name) {
  return { v: 1, name, look, geld: 800, zeit: 7 * 60, bed: { energie: 85, hunger: 70, hygiene: 80, spass: 70, sozial: 60 }, wissen: 0, karriere: 0, stufe: 0,
    gekauft: [], partner: null, kinder: [], ziele: {}, richtig: 0, falsch: 0, richtigTag: {}, schichten: 0, gelernt: 0, hausaufgaben: 0, wunschKind: false, letzterLohnTag: 0 };
}
let s = null;
function laden() { try { const x = JSON.parse(localStorage.getItem(SPEICHER) || "null"); return x && x.v === 1 ? x : null; } catch (e) { return null; } }
function speichern() { if (!s) return; try { localStorage.setItem(SPEICHER, JSON.stringify(s)); } catch (e) {} }
function sterneTag() {
  const n = s.richtigTag[tag] || 0, st = n >= 25 ? 3 : n >= 16 ? 2 : n >= 8 ? 1 : 0;
  try { const o = JSON.parse(localStorage.getItem("pe26_spiel") || "{}") || {}; const k = tag + "-leben"; if (!(o[k] >= st)) { o[k] = st; localStorage.setItem("pe26_spiel", JSON.stringify(o)); } } catch (e) {}
}

/* ---------- Fragenpools ---------- */
let qQuiz = [], qLern = [], qSort = [];
function pools() {
  qQuiz = mischen(day.quiz || []); qLern = mischen(day.lernen || []);
  qSort = mischen((day.sortier || []).flatMap((r) => r.items.map((it) => ({ it, kat: r.kategorien, titel: r.titel }))));
}
const naechsteFrage = () => { if (!qQuiz.length) qQuiz = mischen(day.quiz || []); return qQuiz.pop(); };
const naechsteKarte = () => { if (!qLern.length) qLern = mischen(day.lernen || []); return qLern.pop(); };
const naechsteSort = () => { if (!qSort.length) pools(); return qSort.pop(); };

/* ---------- Ton ---------- */
let ton = true; try { ton = localStorage.getItem("pe26_spiel_ton") !== "0"; } catch (e) {}
let ac = null;
function klang(art) {
  if (!ton) return;
  try {
    ac = ac || new (window.AudioContext || window.webkitAudioContext)(); const t = ac.currentTime;
    const n = (f, a, d, typ, l) => { const o = ac.createOscillator(), g = ac.createGain(); o.type = typ || "sine"; o.frequency.value = f; g.gain.setValueAtTime(0, t + a); g.gain.linearRampToValueAtTime(l || 0.1, t + a + 0.02); g.gain.exponentialRampToValueAtTime(0.0001, t + a + d); o.connect(g).connect(ac.destination); o.start(t + a); o.stop(t + a + d + 0.05); };
    if (art === "richtig") { n(660, 0, 0.18, "triangle"); n(990, 0.1, 0.3, "triangle"); }
    else if (art === "falsch") { n(220, 0, 0.3, "sawtooth", 0.05); n(185, 0.12, 0.35, "sawtooth", 0.04); }
    else if (art === "klick") n(1100, 0, 0.06, "square", 0.04);
    else if (art === "kasse") { n(1318, 0, 0.12, "triangle"); n(1760, 0.08, 0.25, "triangle"); }
    else if (art === "ziel") { [523, 659, 784, 1046].forEach((f, i) => n(f, i * 0.1, 0.3, "triangle", 0.09)); }
    else if (art === "hochzeit") { [523, 523, 659, 784, 659, 784, 1046].forEach((f, i) => n(f, i * 0.22, 0.4, "sine", 0.1)); }
  } catch (e) {}
}

/* ---------- 3D ---------- */
const canvas = $("welt");
const W = erstelleWelt(canvas);
const { renderer, scene, camera } = W;
let drehung = 0, zoom = innerWidth < 560 ? 0.74 : IS_TOUCH ? 1.0 : 1.15; const pan = new THREE.Vector3();
function groesse() { const w = innerWidth, h = innerHeight; renderer.setSize(w, h, false); setzeKamera(camera, W.waende, drehung, zoom, pan, w, h); }
addEventListener("resize", groesse);

const moebel = {};
function stelleAuf(id, funkeln) {
  if (moebel[id] || !PLATZ[id]) return;
  const [x, z, r] = PLATZ[id]; const g = baueMoebel(id); g.position.set(x, 0, z); g.rotation.y = r;
  g.userData.ziel = { typ: "moebel", id }; scene.add(g); moebel[id] = g;
  if (funkeln) { g.scale.setScalar(0.01); animiere((t) => { const k = Math.min(1, t / 0.5); g.scale.setScalar(0.01 + k * 0.99 + Math.sin(k * Math.PI) * 0.15); return k < 1; }); funken(g.position); }
}
const animationen = [];
function animiere(fn) { animationen.push({ fn, t0: performance.now() }); }
function funken(pos) {
  const teile = konfetti(scene, pos.clone().setY(1.2));
  animiere((t) => { teile.forEach((m) => { m.position.addScaledVector(m.userData.v, 0.016); m.userData.v.y -= 0.16; m.rotation.x += 0.2; }); if (t > 1.6) { teile.forEach((m) => scene.remove(m)); return false; } return true; });
}

/* Personen */
const personen = {};
function person(id, look, kind) {
  const f = baueFigur(Object.assign({}, look, { kind })); f.g.userData.ziel = { typ: "person", id }; scene.add(f.g);
  const p = { id, f, ziel: null, weg: [], pose: null, dann: null, aktiv: null, sichtbar: true };
  personen[id] = p; erwPerson(p); /* ERW-INHALT: Kleidung und Wachstum anwenden */ return p;
}
function entferne(id) { const p = personen[id]; if (p) { scene.remove(p.f.g); delete personen[id]; } }
const stern = baueStern(); stern.visible = false; stern.scale.setScalar(1.5); scene.add(stern);
let ich = null;

function geheZu(p, x, z, dann) {
  p.aktiv = null; p.pose = null; p.sitzt = false; p.liegt = false; p.f.g.rotation.x = 0; p.f.g.position.y = 0;
  p.ziel = new THREE.Vector3(x, 0, z); p.dann = dann || null;
}
function dreheZu(p, x, z) { p.f.g.rotation.y = Math.atan2(x - p.f.g.position.x, z - p.f.g.position.z); }

/* ---------- Oberfläche ---------- */
const ui = {
  toast(text, art) {
    const el = document.createElement("div"); el.className = "toast" + (art ? " " + art : ""); el.textContent = text;
    $("toasts").appendChild(el); setTimeout(() => el.classList.add("weg"), 4200); setTimeout(() => el.remove(), 4800);
  }
};
let dialogOffen = false;
function dialog(html, klasse) {
  dialogOffen = true; menueZu();
  const d = $("dialog"); d.className = "dialog an" + (klasse ? " " + klasse : ""); d.innerHTML = `<div class="karte" role="dialog" aria-modal="true">${html}</div>`;
  const k = d.querySelector(".karte"); k.scrollTop = 0; return k;
}
function dialogZu() { dialogOffen = false; $("dialog").className = "dialog"; $("dialog").innerHTML = ""; hud(); }

/* Fragen */
function antwortZaehlen(ok) {
  if (ok) { s.richtig++; s.richtigTag[tag] = (s.richtigTag[tag] || 0) + 1; sterneTag(); } else s.falsch++;
}
function frageRunde(o) {
  let i = 0, richtig = 0; const n = o.anzahl;
  const zeige = () => {
    const q = naechsteFrage(); const reihe = mischen(q.o.map((_, k) => k));
    const k = dialog(`<p class="dkopf">${esc(o.titel)}<span>Frage ${i + 1} von ${n}</span></p>${o.intro && !i ? `<p class="intro">${esc(o.intro)}</p>` : ""}
      <h2 class="frage">${esc(q.q)}</h2><div class="antworten">${reihe.map((oi, j) => `<button class="antwort" type="button" data-oi="${oi}"><span class="bu">${BU[j]}</span><span>${esc(q.o[oi])}</span></button>`).join("")}</div><div class="nach"></div>`);
    k.querySelectorAll(".antwort").forEach((b) => b.onclick = () => {
      const oi = +b.dataset.oi, ok = oi === q.c; if (ok) richtig++; antwortZaehlen(ok); klang(ok ? "richtig" : "falsch");
      k.querySelectorAll(".antwort").forEach((x) => { x.disabled = true; const v = +x.dataset.oi; if (v === q.c) x.classList.add("richtig"); else if (v === oi) x.classList.add("falsch"); });
      const letzte = i + 1 >= n;
      k.querySelector(".nach").innerHTML = feedback(ok, ok ? "" : q.o[q.c], q.e, o.lob, o.tadel) + `<div class="reihe"><button class="btn" type="button" id="dWeiter">${letzte ? (o.ende || "Fertig") : "Nächste Frage"}</button></div>`;
      $("dWeiter").onclick = () => { i++; if (i < n) zeige(); else { dialogZu(); o.fertig(richtig, n); speichern(); pruefeZiele(); } };
      k.querySelector(".nach").scrollIntoView({ block: "nearest", behavior: "smooth" });
    });
  };
  zeige();
}
function feedback(ok, loes, erkl, lob, tadel) {
  return `<div class="erklaerung"><p class="ergebnis ${ok ? "ok" : "nein"}">${ok ? "Richtig!" : "Leider falsch."}</p>${ok ? "" : `<p class="loes">Richtig ist <b>${esc(loes)}</b>.</p>`}<p><span class="elbl">Erklärung</span> ${esc(erkl)}</p></div>` +
    `<p class="witz">${esc(ok ? pick(lob || H.LOB || ["Sehr gut."]) : pick(tadel || H.TADEL || ["Beim nächsten Mal klappt es."]))}</p>`;
}
function maske(x, t) { let r = String(x); const kern = String(t).replace(/\s*\(.*?\)\s*/g, " ").trim(); [t, kern].forEach((w) => { if (w && w.length > 2) r = r.replace(new RegExp(w.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "gi"), "…"); }); return r; }
function lernKarte(o) {
  const karte = naechsteKarte();
  const k = dialog(`<p class="dkopf">${esc(o.titel)}<span>Fachbegriff</span></p><p class="intro">${esc(o.intro)}</p><h2 class="begriff">${esc(karte.t)}</h2><p class="lerntext">${esc(karte.x)}</p><div class="reihe"><button class="btn" id="dCheck" type="button">Verstanden, zum Kurzcheck</button></div>`, "lern");
  $("dCheck").onclick = () => {
    const opts = mischen([karte.t].concat(mischen((day.lernen || []).filter((x) => x.t !== karte.t)).slice(0, 3).map((x) => x.t)));
    const k2 = dialog(`<p class="dkopf">${esc(o.titel)}<span>Kurzcheck</span></p><h2 class="frage">Welcher Begriff passt?</h2><p class="zitat">${esc(maske(karte.x, karte.t))}</p><div class="antworten">${opts.map((t, j) => `<button class="antwort" type="button" data-t="${esc(t)}"><span class="bu">${BU[j]}</span><span>${esc(t)}</span></button>`).join("")}</div><div class="nach"></div>`, "lern");
    k2.querySelectorAll(".antwort").forEach((b) => b.onclick = () => {
      const ok = b.dataset.t === karte.t; antwortZaehlen(ok); klang(ok ? "richtig" : "falsch");
      k2.querySelectorAll(".antwort").forEach((x) => { x.disabled = true; if (x.dataset.t === karte.t) x.classList.add("richtig"); else if (x === b) x.classList.add("falsch"); });
      k2.querySelector(".nach").innerHTML = feedback(ok, karte.t, karte.x) + `<div class="reihe"><button class="btn" id="dWeiter" type="button">Fertig</button></div>`;
      $("dWeiter").onclick = () => { dialogZu(); o.fertig(ok); speichern(); pruefeZiele(); };
      k2.querySelector(".nach").scrollIntoView({ block: "nearest", behavior: "smooth" });
    });
  };
}
function sortFrage(o) {
  const x = naechsteSort();
  if (!x) { o.fertig(true); return; }
  const k = dialog(`<p class="dkopf">${esc(o.titel)}<span>${esc(x.titel)}</span></p><p class="intro">${esc(o.intro)}</p><h2 class="frage">„${esc(x.it.text)}“</h2><p class="hinweis">Wohin gehört das?</p><div class="antworten">${x.kat.map((kk, j) => `<button class="antwort" type="button" data-k="${esc(kk.id)}"><span class="bu">${BU[j]}</span><span>${esc(kk.name)}</span></button>`).join("")}</div><div class="nach"></div>`);
  k.querySelectorAll(".antwort").forEach((b) => b.onclick = () => {
    const ok = b.dataset.k === x.it.kat; antwortZaehlen(ok); klang(ok ? "richtig" : "falsch");
    k.querySelectorAll(".antwort").forEach((y) => { y.disabled = true; if (y.dataset.k === x.it.kat) y.classList.add("richtig"); else if (y === b) y.classList.add("falsch"); });
    const name = (x.kat.find((kk) => kk.id === x.it.kat) || {}).name;
    k.querySelector(".nach").innerHTML = feedback(ok, name, x.it.expl, o.lob, o.tadel) + `<div class="reihe"><button class="btn" id="dWeiter" type="button">Weiter</button></div>`;
    $("dWeiter").onclick = () => { dialogZu(); o.fertig(ok); speichern(); pruefeZiele(); };
    k.querySelector(".nach").scrollIntoView({ block: "nearest", behavior: "smooth" });
  });
}
function info(titel, html, knoepfe) {
  const k = dialog(`<p class="dkopf">${esc(titel)}</p>${html}<div class="reihe">${(knoepfe || [["OK", null]]).map((b, i) => `<button class="btn${i ? " leise" : ""}" type="button" data-i="${i}">${esc(b[0])}</button>`).join("")}</div>`);
  k.querySelectorAll("[data-i]").forEach((b) => b.onclick = () => { const f = (knoepfe || [["OK", null]])[+b.dataset.i][1]; dialogZu(); if (f) f(); });
  return k;
}

/* ---------- Zeit und Bedürfnisse ---------- */
let tempo = 1; const TEMPO = [0, 4, 10, 24];
const stunde = () => (s.zeit % 1440) / 60;
const lebensTag = () => Math.floor(s.zeit / 1440) + 1;
function uhr() { const m = Math.floor(s.zeit % 1440); return String(Math.floor(m / 60)).padStart(2, "0") + ":" + String(m % 60).padStart(2, "0"); }
function zeitVergeht(min, wirkung) {
  const steps = Math.max(1, Math.ceil(min / 30));
  for (let i = 0; i < steps; i++) { const m = min / steps; s.zeit += m; abbau(m); if (wirkung) BED.forEach((b) => { if (wirkung[b]) s.bed[b] = klemm(s.bed[b] + wirkung[b] * m / 60); }); tagesEreignisse(); }
}
const klemm = (v) => Math.max(0, Math.min(100, v));
function abbau(min) { BED.forEach((b) => { let r = ABBAU[b]; if (b === "sozial" && s.partner && s.partner.verheiratet) r *= 0.6; if (b === "energie" && personen.ich && ich.liegt) r = 0; s.bed[b] = klemm(s.bed[b] - r * min / 60); }); }
function stimmung() { const w = BED.reduce((a, b) => a + s.bed[b], 0) / BED.length + (s.gekauft.includes("teppich") ? 3 : 0) + (s.gekauft.includes("pflanze") ? 2 : 0); return Math.max(0, Math.min(100, w + erwStimmung() /* ERW-INHALT: Stimmungsmarker */)); }
function stimmungText(w) { return w >= 75 ? "Bestens gelaunt" : w >= 55 ? "Zufrieden" : w >= 35 ? "Etwas gereizt" : "Am Ende der Kräfte"; }
let letzterTag = 0;
function tagesEreignisse() {
  const tg = lebensTag(), h = stunde();
  if (s.partner && s.partner.verheiratet && h >= 18 && s.letzterLohnTag < tg) { s.letzterLohnTag = tg; s.geld += 120; ui.toast(s.partner.name.split(" ")[0] + " bringt das Gehalt nach Hause, plus 120 €", "geld"); }
  if (s.wunschKind && h >= 7 && s.wunschTag < tg) { s.wunschKind = false; s.storchFaellig = true; }
  if (tg !== letzterTag) { letzterTag = tg; }
}

/* ---------- Aktionen ---------- */
function dauerAktion(p, o) {
  // o: {x,z, blick:[x,z], pose, dauer, wirkung, sitzt, liegt, liegePos, ende, text}
  geheZu(p, o.x, o.z, () => {
    if (o.blick) dreheZu(p, o.blick[0], o.blick[1]);
    if (o.liegePos) { p.f.g.position.set(o.liegePos[0], o.liegePos[1], o.liegePos[2]); p.f.g.rotation.set(-Math.PI / 2, 0, 0); p.liegt = true; }
    if (o.sitzPos) { p.f.g.position.set(o.sitzPos[0], 0, o.sitzPos[1]); p.f.g.rotation.y = o.sitzPos[2]; p.sitzt = true; }
    p.pose = o.pose || null;
    p.aktiv = { rest: o.dauer, wirkung: o.wirkung, bis: o.bis, ende: o.ende, text: o.text, schnell: o.schnell };
    if (p === ich) hud();
  });
}
function aufstehen(p) { if (p.liegt || p.sitzt) { p.f.g.rotation.x = 0; p.f.g.position.y = 0; const [x, z] = p.aufstehPunkt || [p.f.g.position.x, p.f.g.position.z]; p.f.g.position.x = x; p.f.g.position.z = z; } p.liegt = false; p.sitzt = false; p.pose = null; p.aktiv = null; }
function nutzpunkt(id) { const n = PLATZ[id][3]; return { x: n[0], z: n[1] }; }

const ESSEN_WITZ = ["Kim isst einen Joghurt, der älter ist als die Probezeit.", "Ein Snack. Kalorien sind auch nur eine Kennzahl.", "Der Kühlschrank fordert Mitbestimmung beim Speiseplan."];
const TV_WITZ = [
  "Quizshow „Wer kennt die Kündigungsfrist?“. Der Kandidat nimmt den Publikumsjoker.",
  "Kochshow „Brutto, Netto, Bolognese“. Am Ende bleibt weniger Soße als gedacht.",
  "Doku „Zwei Lernorte, ein Leben“ über das duale System. Spannender als gedacht.",
  "Krimi „Mord in der Lohnbuchhaltung“. Der Täter versteckte sich in der Steuerklasse.",
  "Realityshow „Die Probezeit“. Heute muss jemand gehen, mit zwei Wochen Frist."
];
function aktionenFuer(ziel) {
  const a = [], n = s.name;
  const sperre = (txt) => ({ gesperrt: txt });
  if (ziel.typ === "moebel") {
    const id = ziel.id, np = nutzpunkt(id);
    switch (id) {
      case "bett":
        a.push({ t: "Schlafen", f: () => dauerAktion(ich, { x: np.x, z: np.z, liegePos: [1.4, 0.62, 2.3], dauer: 600, bis: (st) => st.bed.energie >= 99 && stunde() >= 6 && stunde() < 21, wirkung: { energie: 14 }, schnell: true, text: "schläft" }) });
        a.push({ t: "Nickerchen, 1 Stunde", f: () => dauerAktion(ich, { x: np.x, z: np.z, liegePos: [1.4, 0.62, 2.3], dauer: 60, wirkung: { energie: 18 }, text: "macht ein Nickerchen" }) });
        break;
      case "kuehl":
        a.push({ t: "Snack essen", f: () => dauerAktion(ich, { x: np.x, z: np.z, blick: [7.6, 5.5], pose: "essen", dauer: 20, wirkung: { hunger: 90 }, text: "isst einen Snack", ende: () => ui.toast(pick(ESSEN_WITZ).replace("Kim", n)) }) });
        break;
      case "herd":
        a.push({ t: "Kochen und essen", f: () => dauerAktion(ich, { x: np.x, z: np.z, blick: [8.6, 5.5], pose: "essen", dauer: 50, wirkung: { hunger: 110, spass: 8 }, text: "kocht", ende: () => ui.toast(n + " kocht Spaghetti. Die Küche riecht nach Beförderung.") }) });
        break;
      case "tisch":
        a.push({ t: "Am Tisch essen", f: () => dauerAktion(ich, { x: 10.75, z: 8.0, sitzPos: [10.75, 8.0, Math.PI / 2], pose: "essen", dauer: 40, wirkung: { hunger: 100, spass: 6, sozial: s.partner && partnerDa() ? 30 : 0 }, text: "isst am Tisch",
          ende: () => { if (s.partner && partnerDa()) { s.partner.bez = Math.min(100, s.partner.bez + 5); ui.toast("Gemeinsames Essen mit " + s.partner.name.split(" ")[0] + ". Beziehung plus 5"); pruefeZiele(); } } }) });
        break;
      case "dusche":
        a.push({ t: "Duschen", f: () => dauerAktion(ich, { x: 5.75, z: 0.75, dauer: 25, wirkung: { hygiene: 220, spass: 4 }, text: "duscht", ende: () => ui.toast(n + " singt unter der Dusche das Lied der Lohnsteuerklassen.") }) });
        break;
      case "waschbecken":
        a.push({ t: "Hände waschen", f: () => dauerAktion(ich, { x: np.x, z: np.z, blick: [7.3, 0.3], dauer: 8, wirkung: { hygiene: 110 }, text: "wäscht die Hände" }) });
        break;
      case "pc":
        a.push(homeoffice());
        a.push({ t: "Weiterbildung online", f: () => geheZu(ich, 11.0, 1.55, () => { dreheZu(ich, 11, 0.5); ich.pose = "tippen"; lernKarte({ titel: "Weiterbildung online", intro: "Das E-Learning von Nordstern startet. Lesen Sie den Begriff, dann folgt ein Kurzcheck.", fertig: (ok) => { lernFertig(ok); zeitVergeht(60, { spass: -4 }); ich.pose = null; } }); }) });
        a.push({ t: "Online-Shop öffnen", f: () => kaufen() });
        break;
      case "regal":
        a.push({ t: "Fachbuch lesen", f: () => geheZu(ich, np.x, np.z, () => { dreheZu(ich, 8.9, 0.2); ich.pose = "lesen"; lernKarte({ titel: "Fachbuch lesen", intro: n + " zieht ein Fachbuch aus dem Regal. Lesen Sie den Begriff, dann folgt ein Kurzcheck.", fertig: (ok) => { lernFertig(ok); zeitVergeht(45, { spass: -2 }); ich.pose = null; } }); }) });
        break;
      case "lampe":
        a.push({ t: lampeAn ? "Licht aus" : "Licht an", f: () => { lampeAn = !lampeAn; klang("klick"); } });
        break;
      case "sofa":
        a.push({ t: "Entspannen", f: () => dauerAktion(ich, { x: np.x, z: np.z, sitzPos: [3.25, 7.2, -Math.PI / 2], dauer: 60, wirkung: { spass: s.gekauft.includes("teppich") ? 40 : 30, energie: 6 }, text: "entspannt" }) });
        if (s.partner && partnerDa() && s.partner.bez >= 60) a.push({ t: "Mit " + s.partner.name.split(" ")[0] + " kuscheln", f: () => kuscheln() });
        break;
      case "tv":
        a.push({ t: "Fernsehen", f: () => dauerAktion(ich, s.gekauft.includes("sofa") ? { x: 3.3, z: 8.8, sitzPos: [3.25, 7.6, -Math.PI / 2], dauer: 90, wirkung: { spass: 45 }, text: "sieht fern", tv: true, ende: () => {} } : { x: 2.2, z: 7.5, blick: [0.4, 7.5], dauer: 60, wirkung: { spass: 35, energie: -4 }, text: "sieht fern" }), nachher: () => ui.toast(pick(TV_WITZ)) });
        break;
      case "pflanze":
        a.push({ t: "Gießen", f: () => dauerAktion(ich, { x: np.x, z: np.z, blick: [6.4, 9.4], dauer: 10, wirkung: { spass: 30 }, text: "gießt den Ficus", ende: () => ui.toast("Ficus Herzberg ist gegossen. Zufrieden ist er nicht, aber auch nicht unzufrieden. Typisch Hygienefaktor.") }) });
        break;
      case "kinderbett": {
        const baby = s.kinder.find((k) => alterTage(k) < 2);
        if (baby) a.push({ t: baby.name + " in den Schlaf wiegen", f: () => dauerAktion(ich, { x: np.x, z: np.z, blick: [3.9, 0.9], dauer: 30, wirkung: { sozial: 50, spass: 20 }, text: "wiegt " + baby.name, ende: () => ui.toast(baby.name + " schläft. Wie ein Betriebsrat nach der Einigungsstelle.") }) });
        if (!s.partner || !s.partner.verheiratet) a.push(sperre("Familie gründen geht nach der Hochzeit"));
        else if (s.wunschKind) a.push(sperre("Der Storch ist schon unterwegs"));
        else if (baby) a.push(sperre("Das Kinderbett ist gerade belegt"));
        else if (s.kinder.length >= 2) a.push(sperre("Zwei Kinder sind genug Personalbedarf"));
        else a.push({ t: "Familie gründen", f: () => familieGruenden() });
        break;
      }
      case "spielzeug":
        kinderGross().forEach((k) => a.push({ t: "Mit " + k.name + " spielen", f: () => mitKindSpielen(k) }));
        if (!kinderGross().length) a.push(sperre("Spielen geht, sobald ein Kind laufen kann"));
        break;
      case "tuer":
        a.push(zurArbeit());
        break;
      case "briefkasten":
        a.push({ t: "Post lesen", f: () => geheZu(ich, np.x, np.z, () => { dreheZu(ich, 9, 12.3); ich.pose = "lesen"; lernKarte({ titel: "Post von der IHK", intro: "Im Briefkasten liegt ein Infobrief. Diesmal ohne Rechnung.", fertig: (ok) => { lernFertig(ok); ich.pose = null; zeitVergeht(15); } }); }) });
        if (!s.partner) a.push({ t: "Nachbarschaft kennenlernen", f: () => geheZu(ich, np.x, np.z, kennenlernen) });
        break;
      case "bogen":
        if (s.partner && s.partner.verlobt && !s.partner.verheiratet) a.push({ t: "Hochzeit feiern", f: () => hochzeit() });
        else a.push(sperre(s.partner && s.partner.verheiratet ? "Hier haben Sie geheiratet" : "Erst verloben, dann heiraten"));
        break;
    }
  } else if (ziel.typ === "person") {
    if (ziel.id === "partner") a.push(...partnerAktionen());
    else if (ziel.id.startsWith("kind")) { const k = s.kinder[+ziel.id.slice(4)]; if (k) { a.push({ t: "Hausaufgaben helfen", f: () => hausaufgaben(k) }); if (s.gekauft.includes("spielzeug")) a.push({ t: "Spielen", f: () => mitKindSpielen(k) }); else a.push(sperre("Zum Spielen eine Spielzeugkiste kaufen")); } }
    else if (ziel.id === "ich") { a.push({ t: "Lebensziele ansehen", f: zieleZeigen }); a.push({ t: "Stimmung prüfen", f: () => ui.toast(n + " ist " + stimmungText(stimmung()).toLowerCase() + ". Stimmung " + Math.round(stimmung()) + " von 100") }); }
  }
  erwAktionen(ziel, a); /* ERW-INHALT: zusätzliche Aktionen */
  return a;
}
function lernFertig(ok) { if (ok) { s.wissen++; s.gelernt++; ui.toast("Wissen plus 1. Mehr Wissen bringt mehr Lohn", "gut"); } else ui.toast("Diesmal kein Wissenspunkt. Einfach noch einmal lesen"); hud(); }

function lohnProRichtig() { return STUFEN[s.stufe].lohn * (1 + Math.min(s.wissen, 25) * 0.02); }
function zurArbeit() {
  const h = stunde();
  if (h < 6 || h >= 14) return { gesperrt: "Schichtbeginn nur zwischen 6 und 14 Uhr" };
  if (s.bed.energie < 25) return { gesperrt: "Zu müde. Erst schlafen, Ruhezeit muss sein" };
  if (s.bed.hunger < 15) return { gesperrt: "Zu hungrig für eine Schicht" };
  return { t: "Zur Arbeit gehen, 8 Stunden", f: () => geheZu(ich, 7.0, 11.2, () => {
    ich.f.g.visible = false;
    frageRunde({ titel: "Schicht bei Nordstern, " + STUFEN[s.stufe].name, intro: "Heute auf dem Schreibtisch liegen Fälle zum Thema " + day.title + ". Jede richtige Antwort bringt " + euro(lohnProRichtig()) + " und einen Karrierepunkt.", anzahl: 4,
      lob: ["Frau Demir nickt anerkennend.", "Herr Brandt notiert das in seiner Excel-Liste.", "Der Betriebsrat hat keine Einwände."], tadel: ["Herr Brandt seufzt leise.", "Frau Demir schickt Ihnen das Skript per Mail.", "Der Kaffeeautomat schüttelt den Kopf."],
      ende: "Feierabend", fertig: (r) => {
        const faktor = stimmung() < 35 ? 0.8 : 1; const lohn = r * lohnProRichtig() * faktor;
        s.geld += lohn; s.karriere += r; s.schichten++;
        zeitVergeht(480, { energie: -1, hygiene: -1 });
        ich.f.g.visible = true; ich.f.g.position.set(7.0, 0, 11.2);
        klang("kasse");
        info("Feierabend", `<p class="gross">${r} von 4 richtig</p><p>${s.name} verdient heute <b>${euro(lohn)}</b>${faktor < 1 ? ". Wegen schlechter Laune gab es 20 Prozent weniger" : ""}. Karrierepunkte jetzt ${s.karriere}.</p>`, [["Nach Hause", () => befoerderung()]]);
      } });
  }) };
}
function homeoffice() {
  const h = stunde();
  if (h < 6 || h >= 21) return { gesperrt: "Homeoffice nur zwischen 6 und 21 Uhr" };
  if (s.bed.energie < 15) return { gesperrt: "Zu müde für das Homeoffice" };
  return { t: "Homeoffice, 3 Stunden", f: () => geheZu(ich, 11.0, 1.55, () => {
    dreheZu(ich, 11, 0.5); ich.pose = "tippen";
    frageRunde({ titel: "Homeoffice", intro: "Zwei Anfragen aus der Personalabteilung. Jede richtige Antwort bringt " + euro(lohnProRichtig()) + ".", anzahl: 2, ende: "Laptop zuklappen",
      fertig: (r) => { const lohn = r * lohnProRichtig(); s.geld += lohn; s.karriere += r; zeitVergeht(180, { spass: -3 }); ich.pose = null; klang("kasse"); ui.toast("Homeoffice erledigt, plus " + euro(lohn), "geld"); befoerderung(); } });
  }) };
}
function befoerderung() {
  let neu = s.stufe; while (neu + 1 < STUFEN.length && s.karriere >= STUFEN[neu + 1].ab) neu++;
  if (neu > s.stufe) {
    s.stufe = neu; klang("ziel"); ich.pose = "jubel"; setTimeout(() => { if (ich.pose === "jubel") ich.pose = null; }, 3000);
    info("Beförderung!", `<p class="gross">${esc(STUFEN[neu].name)}</p><p>${esc(s.name)} wird befördert. Neuer Lohn pro richtiger Antwort ${euro(STUFEN[neu].lohn)}. Herr Brandt hat dafür extra eine neue Excel-Datei angelegt.</p>`);
  }
  hud(); speichern(); pruefeZiele();
}

/* ---------- Beziehung ---------- */
const BEZ_STUFE = (p) => p.verheiratet ? "Verheiratet" : p.verlobt ? "Verlobt" : p.bez >= 60 ? "Verliebt" : p.bez >= 30 ? "Befreundet" : "Bekannt";
function partnerDa() { if (!s.partner) return false; if (s.partner.verheiratet) return true; const h = stunde(); return h >= 8 && h < 22; }
function kennenlernen() {
  /* ERW-INHALT: sechs Personen mit Beruf und Hobby, freie Wahl */
  const k = dialog(`<p class="dkopf">Nachbarschaft kennenlernen</p><p class="intro">Am Gartenzaun stehen sechs Menschen aus der Nachbarschaft, alle arbeiten bei Nordstern. Mit wem möchte ${esc(s.name)} ins Gespräch kommen? Die anderen können später gute Freunde werden.</p>
    <div class="kandidaten">${KANDIDATEN.map((c) => `<button class="kandidat" type="button" data-id="${c.id}"><span class="avatar" style="background:${c.look.oben}">${c.name.split(" ").map((w) => w[0]).join("")}</span><b>${esc(c.name)}</b><small>${esc(c.beruf || c.rolle)}, mag ${esc(c.hobby || "Kaffee")}</small><span>${esc(c.text)}</span></button>`).join("")}</div>
    <div class="reihe"><button class="btn leise" type="button" id="dAbbr">Später</button></div>`);
  k.querySelectorAll(".kandidat").forEach((b) => b.onclick = () => {
    const c = KANDIDATEN.find((x) => x.id === b.dataset.id);
    s.partner = { id: c.id, name: c.name, rolle: c.rolle, look: c.look, bez: 10, verlobt: false, verheiratet: false };
    s.freunde = (s.freunde || []).filter((f) => f.id !== c.id); initInhalt(s); /* ERW-INHALT */
    dialogZu(); partnerErscheint(true); klang("ziel");
    ui.toast(c.name + " aus der " + c.rolle + " sagt Hallo. Tippen Sie auf " + c.name.split(" ")[0] + ", um zu reden.");
    speichern(); pruefeZiele();
  });
  $("dAbbr").onclick = dialogZu;
}
function partnerErscheint(vomTor) {
  if (!s.partner || personen.partner) return;
  const p = person("partner", s.partner.look, false);
  if (vomTor) p.f.g.position.set(7, 0, 15); else p.f.g.position.set(6, 0, 7.5);
  geheZu(p, 8.4, 11.4);
}
function partnerAktionen() {
  const p = s.partner, v = p.name.split(" ")[0], a = [];
  a.push({ t: "Unterhalten", f: () => gespraech(v, "unterhalten") });
  if (p.bez >= 30) a.push({ t: "Flirten", f: () => gespraech(v, "flirten") }); else a.push({ gesperrt: "Flirten ab Freundschaft" });
  if (s.gekauft.includes("sofa") && p.bez >= 60) a.push({ t: "Kuscheln auf dem Sofa", f: kuscheln });
  if (!p.verlobt && !p.verheiratet) {
    if (p.bez < 80) a.push({ gesperrt: "Antrag ab Beziehung 80" });
    else if (!s.gekauft.includes("ring")) a.push({ gesperrt: "Für den Antrag einen Ring kaufen" });
    else a.push({ t: "Antrag machen", f: antrag });
  }
  if (p.verlobt && !p.verheiratet) a.push(s.gekauft.includes("bogen") ? { t: "Hochzeit feiern", f: hochzeit } : { gesperrt: "Für die Hochzeit den Hochzeitsbogen kaufen" });
  a.push({ t: "Beziehung ansehen", f: () => ui.toast(p.name + ", " + BEZ_STUFE(p) + ", Beziehung " + Math.round(p.bez) + " von 100") });
  return a;
}
function zuZweit(dann) {
  const pp = personen.partner; if (!pp) return;
  const x = pp.f.g.position.x, z = pp.f.g.position.z;
  geheZu(ich, x + 0.9, z + 0.3, () => { dreheZu(ich, x, z); aufstehen(pp); pp.ziel = null; dreheZu(pp, ich.f.g.position.x, ich.f.g.position.z); ich.pose = "reden"; pp.pose = "reden"; pp.ruhe = 30; dann(); });
}
function gespraech(v, art) {
  zuZweit(() => {
    const ende = (ok, plus, minus) => { const pr = s.partner; pr.bez = Math.min(100, pr.bez + (ok ? plus : minus)); s.bed.sozial = klemm(s.bed.sozial + 30); s.bed.spass = klemm(s.bed.spass + 8); zeitVergeht(30);
      ich.pose = null; if (personen.partner) personen.partner.pose = null;
      ui.toast(v + ": Beziehung " + (ok ? "plus " + plus : "plus " + minus) + ", jetzt " + Math.round(pr.bez) + " von 100", ok ? "gut" : ""); pruefeZiele(); hud(); };
    if (art === "unterhalten") sortFrage({ titel: "Gespräch mit " + v, intro: v + " erzählt von der Arbeit und fragt Sie nach Ihrer Meinung.", lob: [v + " ist beeindruckt.", v + " lacht und sagt, so hätte es das Skript nicht besser erklärt."], tadel: [v + " lächelt nachsichtig.", v + " erklärt es Ihnen in Ruhe. Das verbindet auch."], fertig: (ok) => ende(ok, 12, 4) });
    else frageRunde({ titel: "Flirten mit " + v, intro: "Sie versuchen es mit Fachwissen. " + v + " stellt eine Frage, die richtige Antwort lässt die Herzen schneller schlagen.", anzahl: 1,
      lob: ["„Deine Antwort ist so präzise wie eine gute Personalakte“, sagt " + v + ".", v + " wird ein bisschen rot."], tadel: [v + " kichert. Charme zählt auch.", "„Süß, aber falsch“, sagt " + v + "."], ende: "Weiter flirten",
      fertig: (r) => ende(r > 0, 15, 3) });
  });
}
function kuscheln() {
  const pp = personen.partner; if (!pp) return;
  geheZu(pp, 3.3, 8.8, () => { pp.f.g.position.set(3.25, 0, 7.95); pp.f.g.rotation.y = -Math.PI / 2; pp.sitzt = true; pp.ruhe = 70; });
  dauerAktion(ich, { x: 3.3, z: 8.8, sitzPos: [3.25, 7.1, -Math.PI / 2], dauer: 60, wirkung: { spass: 35, sozial: 60, energie: 5 }, text: "kuschelt",
    ende: () => { s.partner.bez = Math.min(100, s.partner.bez + 6); aufstehen(pp); pp.ruhe = 0; ui.toast("Kuscheln auf dem Sofa. Beziehung plus 6"); pruefeZiele(); } });
}
function antrag() {
  const v = s.partner.name.split(" ")[0];
  zuZweit(() => {
    frageRunde({ titel: "Der große Moment", intro: s.name + " kniet nieder und zeigt den Ring. " + v + " lächelt und sagt, erst eine Frage zum Thema " + day.title + ", dann die Antwort.", anzahl: 1, ende: "Und?",
      lob: [v + " hält sich die Hand vor den Mund."], tadel: [v + " lacht. „Frag mich nochmal, wenn du die Antwort kennst.“"],
      fertig: (r) => {
        ich.pose = null; if (personen.partner) personen.partner.pose = null;
        if (r) { s.partner.verlobt = true; klang("hochzeit"); ich.pose = "jubel"; personen.partner.pose = "jubel"; funken(ich.f.g.position); setTimeout(() => { ich.pose = null; if (personen.partner) personen.partner.pose = null; }, 3500);
          info("Verlobt!", `<p class="gross">${esc(v)} sagt Ja!</p><p>Jetzt fehlt nur noch der Hochzeitsbogen im Garten. Paula Probezeit hat die Verlobung schon gepostet, 4 Likes.</p>`); }
        else ui.toast("Kein Ja, aber auch kein Nein. Der Ring bleibt in der Tasche, versuchen Sie es später noch einmal.");
        pruefeZiele();
      } });
  });
}
let gaeste = [];
function hochzeit() {
  const p = s.partner, v = p.name.split(" ")[0];
  info("Hochzeit im Garten", `<p>Die Gäste sind da. Frau Demir hält eine Rede, Herr Brandt hat die Sitzordnung als Excel-Datei verschickt und Paula Probezeit filmt alles.</p><p class="zitat">„Ich verspreche dir, dich zu lieben, in guten wie in schlechten Lohnabrechnungen, mit und ohne Überstunden.“</p>`, [["Ja, ich will", () => {
    const [bx, bz] = PLATZ.bogen;
    const pp = personen.partner; aufstehen(ich); if (pp) aufstehen(pp);
    geheZu(ich, bx - 0.45, bz + 0.3, () => dreheZu(ich, bx + 2, bz + 0.3)); if (pp) { pp.ruhe = 120; geheZu(pp, bx + 0.45, bz + 0.3, () => dreheZu(pp, bx - 2, bz + 0.3)); }
    GAESTE.forEach((g, i) => { const q = person("gast" + i, g.look, false); q.f.g.position.set(7, 0, 15); q.ruhe = 999; geheZu(q, bx - 1.2 + i * 1.2, bz + 2.4, () => dreheZu(q, bx, bz)); gaeste.push("gast" + i); });
    setTimeout(() => {
      p.verheiratet = true; p.verlobt = false; klang("hochzeit");
      [ich, personen.partner].forEach((x) => { if (x) x.pose = "jubel"; }); gaeste.forEach((g) => { if (personen[g]) personen[g].pose = "jubel"; });
      funken(new THREE.Vector3(bx, 0, bz)); setTimeout(() => funken(new THREE.Vector3(bx, 0, bz + 1)), 600);
      ui.toast("Frisch verheiratet! " + v + " zieht ein und bringt ab jetzt auch Gehalt mit nach Hause.", "gut");
      pruefeZiele(); speichern();
      setTimeout(() => { [ich, personen.partner].forEach((x) => { if (x) x.pose = null; }); gaeste.forEach((g) => { const q = personen[g]; if (q) { q.pose = null; geheZu(q, 7, 16, () => entferne(g)); } }); gaeste = []; if (personen.partner) personen.partner.ruhe = 0; }, 6500);
    }, 4200);
  }], ["Noch nicht", null]]);
}
function familieGruenden() {
  const v = s.partner.name.split(" ")[0];
  info("Familie gründen", `<p>${esc(s.name)} und ${esc(v)} wünschen sich ein Kind. Morgen früh bringt der Storch das Baby.</p><p class="hinweis">Wichtig für die Personalakte. Wer Elternzeit möchte, muss sie spätestens sieben Wochen vor Beginn schriftlich beim Arbeitgeber verlangen (§ 16 BEEG). Der Storch hält sich an keine Frist.</p>`,
    [["Ja, wir freuen uns", () => { s.wunschKind = true; s.wunschTag = lebensTag(); speichern(); ui.toast("Der Storch hat den Auftrag angenommen. Lieferung morgen zwischen 7 und 9 Uhr.") }], ["Lieber später", null]]);
}
function storchKommt() {
  const st = baueStorch(); scene.add(st); const [kx, kz] = PLATZ.kinderbett;
  const start = new THREE.Vector3(-8, 9, -6), ziel = new THREE.Vector3(kx, 2.2, kz);
  animiere((t) => {
    const k = Math.min(1, t / 4); st.position.lerpVectors(start, ziel, k); st.position.y += Math.sin(k * Math.PI) * 2;
    st.userData.fluegel.forEach((f, i) => f.rotation.x = Math.sin(t * 12) * 0.6 * (i ? -1 : 1));
    if (k >= 1) {
      scene.remove(st); funken(ziel);
      const k2 = dialog(`<p class="dkopf">Der Storch war da</p><p class="intro">Im Kinderbett liegt ein Baby. Wie soll es heißen?</p><input class="eingabe" id="kName" maxlength="16" value="${pick(["Emil", "Lotta", "Noah", "Ida", "Finn", "Mila"])}" aria-label="Name des Kindes"><div class="reihe"><button class="btn" id="kOk" type="button">Willkommen!</button></div>`);
      $("kOk").onclick = () => { const name = ($("kName").value || "Baby").trim().slice(0, 16); s.kinder.push({ name, geboren: s.zeit, look: kinderLook() }); dialogZu(); klang("ziel"); familieAktualisieren(); ui.toast(name + " ist da! Mutterschutz, Elternzeit, Elterngeld, die Personalabteilung hat zu tun.", "gut"); speichern(); pruefeZiele(); };
      return false;
    }
    return true;
  });
  ui.toast("Da oben fliegt etwas mit einem Paket ...");
}
function kinderLook() {
  const p = s.partner ? s.partner.look : s.look;
  return { haut: Math.random() < 0.5 ? s.look.haut : p.haut, haar: pick(["kurz", "locken", "lang", "dutt"]), haarfarbe: Math.random() < 0.5 ? s.look.haarfarbe : p.haarfarbe, oben: pick(["#f2c14e", "#6fb7e0", "#e46b6b", "#6f8f7b"]), hose: "#3a4a6a" };
}
const alterTage = (k) => (s.zeit - k.geboren) / 1440;
const kinderGross = () => s.kinder.filter((k) => alterTage(k) >= 2);
let babyMesh = null;
function familieAktualisieren() {
  const baby = s.kinder.find((k) => alterTage(k) < 2);
  if (baby && !babyMesh && moebel.kinderbett) { babyMesh = baueBaby(baby.look.haut); babyMesh.position.set(PLATZ.kinderbett[0], 0.36, PLATZ.kinderbett[1]); scene.add(babyMesh); }
  if (!baby && babyMesh) { scene.remove(babyMesh); babyMesh = null; }
  s.kinder.forEach((k, i) => { const id = "kind" + i; if (alterTage(k) >= 2 && !personen[id]) { const p = person(id, k.look, true); p.f.g.position.set(4, 0, 3); if (i === s.kinder.length - 1 && alterTage(k) < 2.05) ui.toast(k.name + " kann jetzt laufen und braucht Hilfe bei den Hausaufgaben."); } });
}
function hausaufgaben(k) {
  const pk = personen["kind" + s.kinder.indexOf(k)];
  const x = pk ? pk.f.g.position.x : 4, z = pk ? pk.f.g.position.z : 3;
  geheZu(ich, x + 0.7, z + 0.3, () => {
    dreheZu(ich, x, z); if (pk) { pk.ziel = null; pk.ruhe = 30; dreheZu(pk, ich.f.g.position.x, ich.f.g.position.z); }
    ich.pose = "reden";
    frageRunde({ titel: "Hausaufgaben mit " + k.name, intro: k.name + " hat eine Hausaufgabe zum Thema " + day.title + ". Erstaunlich, was heute schon in der Schule drankommt.", anzahl: 1, ende: "Heft zuklappen",
      lob: [k.name + " ruft „Du bist die beste Hilfe der Welt!“"], tadel: [k.name + " sagt „Das schaue ich lieber selbst im Buch nach.“"],
      fertig: (r) => { ich.pose = null; if (r) { s.hausaufgaben++; s.bed.sozial = klemm(s.bed.sozial + 25); ui.toast(k.name + " ist stolz auf die Hausaufgabe", "gut"); } zeitVergeht(30); pruefeZiele(); } });
  });
}
function mitKindSpielen(k) {
  const np = nutzpunkt("spielzeug"); const pk = personen["kind" + s.kinder.indexOf(k)];
  if (pk) { pk.ruhe = 40; geheZu(pk, np.x - 0.2, np.z - 0.8); }
  dauerAktion(ich, { x: np.x, z: np.z + 0.5, blick: [3.9, 3.7], pose: "winken", dauer: 45, wirkung: { spass: 50, sozial: 45, energie: -4 }, text: "spielt mit " + k.name, ende: () => ui.toast(k.name + " hat aus Bauklötzen ein Organigramm gebaut. Einliniensystem!") });
}

/* ---------- Kaufen ---------- */
function kaufen() {
  const zeichne = () => {
    const k = dialog(`<p class="dkopf">Möbelhaus Nordstern<span>Guthaben ${euro(s.geld)}</span></p><p class="intro">Alles wird sofort geliefert. Der Lieferdienst arbeitet natürlich im Rahmen des Arbeitszeitgesetzes.</p>
      <div class="katalog">${Object.entries(KATALOG).map(([id, it]) => { const hat = s.gekauft.includes(id), geht = s.geld >= it.preis;
        return `<div class="artikel${hat ? " hat" : ""}"><b>${esc(it.name)}</b><small>${esc(it.text)}</small><span class="preis">${euro(it.preis)}</span><button class="btn klein" type="button" data-id="${id}"${hat || !geht ? " disabled" : ""}>${hat ? "Gekauft" : geht ? "Kaufen" : "Zu teuer"}</button></div>`; }).join("")}</div>
      <div class="reihe"><button class="btn leise" type="button" id="dZu">Schließen</button></div>`, "breit");
    k.querySelectorAll("[data-id]").forEach((b) => b.onclick = () => {
      const id = b.dataset.id, it = KATALOG[id]; if (s.geld < it.preis || s.gekauft.includes(id)) return;
      s.geld -= it.preis; s.gekauft.push(id); klang("kasse"); if (!it.inventar) stelleAuf(id, true);
      ui.toast(it.name + " gekauft" + (it.inventar ? ". Der Ring liegt sicher in der Tasche" : ""), "geld");
      speichern(); pruefeZiele(); zeichne();
    });
    $("dZu").onclick = dialogZu;
  };
  zeichne();
}

/* ---------- Ziele ---------- */
function pruefeZiele() {
  if (!s) return;
  ZIELE.forEach((z) => { if (!s.ziele[z.id] && z.ok(s)) { s.ziele[z.id] = 1; s.geld += z.lohn; klang("ziel"); ui.toast("Lebensziel erreicht. " + z.text + ", plus " + euro(z.lohn), "ziel"); } });
  hud(); speichern();
}
function zieleZeigen() {
  const n = ZIELE.filter((z) => s.ziele[z.id]).length;
  const k = dialog(`<p class="dkopf">Lebensziele<span>${n} von ${ZIELE.length} erreicht</span></p>
    <ul class="ziele">${ZIELE.map((z) => `<li class="${s.ziele[z.id] ? "ok" : ""}"><span class="haken" aria-hidden="true">${s.ziele[z.id] ? "✓" : ""}</span><span>${esc(z.text)}</span><small>${euro(z.lohn)}</small></li>`).join("")}</ul>
    <p class="hinweis">Sterne für Tag ${day.nr} gibt es für richtige Antworten zum Thema ${esc(day.title)}. Bisher ${s.richtigTag[tag] || 0} richtig, ab 8, 16 und 25 gibt es je einen Stern.</p>
    <div class="reihe"><button class="btn" type="button" id="dZu">Weiterspielen</button></div>`);
  $("dZu").onclick = dialogZu;
}

/* ---------- HUD ---------- */
function hud() {
  if (!s) return;
  $("hName").textContent = s.name; $("hJob").textContent = STUFEN[s.stufe].name;
  $("hGeld").textContent = euro(s.geld); $("hUhr").textContent = "Tag " + lebensTag() + ", " + uhr();
  const w = stimmung(); $("hLaune").textContent = stimmungText(w); $("hLaune").className = "laune " + (w >= 55 ? "gut" : w >= 35 ? "mittel" : "schlecht");
  BED.forEach((b) => { const el = $("b-" + b); el.style.setProperty("--w", s.bed[b] + "%"); el.className = "balken " + (s.bed[b] < 25 ? "rot" : s.bed[b] < 50 ? "gelb" : "gruen"); });
  $("hWissen").textContent = s.wissen; $("hKarriere").textContent = s.karriere + (s.stufe + 1 < STUFEN.length ? " / " + STUFEN[s.stufe + 1].ab : "");
  $("hZiele").textContent = ZIELE.filter((z) => s.ziele[z.id]).length + "/" + ZIELE.length;
  const akt = ich && ich.aktiv ? s.name + " " + ich.aktiv.text : ich && ich.ziel ? s.name + " ist unterwegs" : "";
  $("hTut").textContent = akt; $("hTut").hidden = !akt;
  $("hBez").hidden = !s.partner; if (s.partner) $("hBez").textContent = s.partner.name.split(" ")[0] + ", " + BEZ_STUFE(s.partner) + " " + Math.round(s.partner.bez);
  document.querySelectorAll("[data-tempo]").forEach((b) => b.setAttribute("aria-pressed", String(+b.dataset.tempo === tempo)));
}

/* ---------- Auswahl und Menü ---------- */
const ray = new THREE.Raycaster(), maus = new THREE.Vector2();
function treffer(cx, cy) {
  const r = canvas.getBoundingClientRect(); maus.set(((cx - r.left) / r.width) * 2 - 1, -((cy - r.top) / r.height) * 2 + 1);
  ray.setFromCamera(maus, camera);
  const ziele = Object.values(moebel).concat(Object.values(personen).map((p) => p.f.g));
  const hits = ray.intersectObjects(ziele, true);
  for (const h of hits) { let o = h.object; while (o && !o.userData.ziel) o = o.parent; if (o && o.visible !== false) return { ziel: o.userData.ziel, punkt: h.point }; }
  const boden = ray.ray.intersectPlane(new THREE.Plane(new THREE.Vector3(0, 1, 0), 0), new THREE.Vector3());
  return boden ? { ziel: { typ: "boden" }, punkt: boden } : null;
}
function menueZu() { $("menue").hidden = true; }
function zeigeMenue(t, cx, cy) {
  if (t.ziel.typ === "boden") {
    const p = t.punkt; if (p.x > -2 && p.x < 16 && p.z > -1 && p.z < 15) { aufstehen(ich); geheZu(ich, p.x, p.z); } menueZu(); return;
  }
  const liste = aktionenFuer(t.ziel); if (!liste.length) return;
  const titel = t.ziel.typ === "moebel" ? (KATALOG[t.ziel.id]?.name || { bett: "Bett", kuehl: "Kühlschrank", dusche: "Dusche", waschbecken: "Waschbecken", pc: "Schreibtisch mit PC", theke: "Küchenzeile", tuer: "Haustür", briefkasten: "Briefkasten" }[t.ziel.id] || "")
    : t.ziel.id === "partner" ? s.partner.name : t.ziel.id === "ich" ? s.name : (s.kinder[+t.ziel.id.slice(4)] || {}).name;
  const m = $("menue");
  m.innerHTML = `<p>${esc(titel)}</p>` + liste.map((a, i) => a.gesperrt ? `<span class="aus">${esc(a.gesperrt)}</span>` : `<button type="button" data-i="${i}">${esc(a.t)}</button>`).join("");
  m.hidden = false;
  const w = m.offsetWidth, h = m.offsetHeight;
  m.style.left = Math.max(8, Math.min(innerWidth - w - 8, cx - w / 2)) + "px"; m.style.top = Math.max(70, Math.min(innerHeight - h - 8, cy - h - 14)) + "px";
  m.querySelectorAll("button").forEach((b) => b.onclick = () => { const a = liste[+b.dataset.i]; menueZu(); klang("klick"); aufstehen(ich); a.f(); if (a.nachher) a.nachher(); hud(); });
}
/* Zeiger: tippen wählt, ziehen verschiebt, Rad und zwei Finger zoomen */
const zeiger = new Map(); let ziehStart = null, pinch = null, bewegt = false;
canvas.addEventListener("pointerdown", (e) => { canvas.setPointerCapture(e.pointerId); zeiger.set(e.pointerId, { x: e.clientX, y: e.clientY }); bewegt = false;
  if (zeiger.size === 1) ziehStart = { x: e.clientX, y: e.clientY, pan: pan.clone() };
  if (zeiger.size === 2) { const [a, b] = [...zeiger.values()]; pinch = { d: Math.hypot(a.x - b.x, a.y - b.y), z: zoom }; } });
canvas.addEventListener("pointermove", (e) => {
  if (!zeiger.has(e.pointerId)) return; zeiger.set(e.pointerId, { x: e.clientX, y: e.clientY });
  if (pinch && zeiger.size === 2) { const [a, b] = [...zeiger.values()]; zoom = Math.max(0.6, Math.min(2.6, pinch.z * Math.hypot(a.x - b.x, a.y - b.y) / pinch.d)); bewegt = true; groesse(); return; }
  if (ziehStart && zeiger.size === 1) {
    const dx = e.clientX - ziehStart.x, dy = e.clientY - ziehStart.y; if (Math.hypot(dx, dy) > 8) bewegt = true;
    if (bewegt) { const a = Math.PI / 4 + drehung * Math.PI / 2, k = 16 / innerHeight / zoom * 1.25;
      const rechts = new THREE.Vector3(Math.cos(a), 0, -Math.sin(a)), vor = new THREE.Vector3(-Math.sin(a), 0, -Math.cos(a));
      pan.copy(ziehStart.pan).addScaledVector(rechts, -dx * k).addScaledVector(vor, dy * k); pan.x = Math.max(-9, Math.min(9, pan.x)); pan.z = Math.max(-8, Math.min(9, pan.z)); groesse(); menueZu(); }
  } });
canvas.addEventListener("pointerup", (e) => {
  zeiger.delete(e.pointerId); if (zeiger.size < 2) pinch = null;
  if (!bewegt && ziehStart && s && !dialogOffen) { const t = treffer(e.clientX, e.clientY); if (t) zeigeMenue(t, e.clientX, e.clientY); else menueZu(); }
  if (!zeiger.size) ziehStart = null;
});
canvas.addEventListener("wheel", (e) => { e.preventDefault(); zoom = Math.max(0.6, Math.min(2.6, zoom * (e.deltaY < 0 ? 1.1 : 0.9))); groesse(); }, { passive: false });

/* ---------- Spielschleife ---------- */
let lampeAn = false, letzt = performance.now(), funkZeit = 0, speicherZeit = 0, kiZeit = 0;
const tag_hell = new THREE.Color("#bfe3f2"), nacht = new THREE.Color("#1d2745"), abend = new THREE.Color("#f2a46b");
function licht() {
  const h = stunde(); let hell = h < 5 || h > 21.5 ? 0 : h < 7 ? (h - 5) / 2 : h > 19.5 ? (21.5 - h) / 2 : 1;
  const c = new THREE.Color().copy(nacht).lerp(h > 17 && h < 21.5 ? abend : tag_hell, hell); if (h > 17 && h < 19.5) c.lerp(tag_hell, (19.5 - h) / 2.5);
  scene.background = c; W.hemi.intensity = 0.35 + hell * 0.85; W.sonne.intensity = 0.15 + hell * 1.6;
  const dunkel = hell < 0.5;
  scene.traverse((o) => { if (!o.isMesh) return; const u = o.userData;
    if (u.fenster) o.material.emissive.set(dunkel ? "#f5c86a" : "#000000");
    if (u.lampe) o.material.emissive.set(lampeAn || (dunkel && s && stunde() > 17) ? "#f5c86a" : "#000000");
    if (u.tvbild) o.material.emissive.set(ich && ich.aktiv && ich.aktiv.text === "sieht fern" ? (Math.floor(performance.now() / 700) % 2 ? "#4aa3d8" : "#d96f6f") : "#000000"); });
}
function bewege(p, dt, tt) {
  if (p.ziel) {
    const pos = p.f.g.position, d = new THREE.Vector3().subVectors(p.ziel, pos); d.y = 0; const l = d.length(), v = (p.f.kind ? 1.7 : 2.4) * dt * Math.max(1, tempo * 0.75);
    if (l <= v) { pos.x = p.ziel.x; pos.z = p.ziel.z; p.ziel = null; const f = p.dann; p.dann = null; if (f) f(); }
    else { pos.addScaledVector(d.normalize(), v); p.f.g.rotation.y = Math.atan2(d.x, d.z); }
  }
  bewegeFigur(p.f, tt, !!p.ziel, p.pose);
  if (p.sitzt) { p.f.beinL.rotation.x = -1.45; p.f.beinR.rotation.x = -1.45; p.f.inner.position.y = -0.36; }
}
function ki(dt) {
  // Partner und Kinder bewegen sich von selbst
  const orte = [[6.0, 8.0], [9.5, 7.6], [12.5, 2.6], [2.5, 3.0], [8.5, 12.8], [5.0, 12.0], [12.0, 9.0]];
  Object.values(personen).forEach((p) => {
    if (p === ich || p.ziel) return;
    if (p.ruhe > 0) { p.ruhe -= dt; return; }
    if (p.id === "partner" && !partnerDa()) { p.ruhe = 999; geheZu(p, 7, 16, () => { p.f.g.visible = false; }); return; }
    if (Math.random() < dt * 0.25) { const o = pick(orte); p.pose = null; p.sitzt = false; geheZu(p, o[0] + Math.random() - 0.5, o[1] + Math.random() - 0.5, () => { p.ruhe = 4 + Math.random() * 8; p.pose = Math.random() < 0.3 ? "winken" : null; }); }
  });
  if (s.partner && personen.partner && partnerDa() && !personen.partner.f.g.visible) { const p = personen.partner; p.f.g.visible = true; p.ruhe = 0; p.f.g.position.set(7, 0, 15); geheZu(p, 7.5, 11.5); }
}
const FUNK_L = ["Ficus Herzberg fühlt sich unterschätzt", "Kühlschrank fordert Mitbestimmung beim Speiseplan", "Herr Brandt hat die Einladung zum Grillen als Pivot-Tabelle verschickt",
  "Paula Probezeit filmt ihr Frühstück, 3 Likes", "Nachbarschaft gründet Betriebsrat für die Mülltonnen", "Studie belegt, Sofas steigern die Motivation nicht, verhindern aber Unzufriedenheit"];
function schleife(jetzt) {
  const dt = Math.min(0.1, (jetzt - letzt) / 1000); letzt = jetzt; const tt = jetzt / 1000;
  if (s && ich) {
    if (!dialogOffen && tempo > 0) {
      let mps = TEMPO[tempo]; if (ich.aktiv && ich.aktiv.schnell) mps = 45;
      const min = dt * mps; s.zeit += min; abbau(min); tagesEreignisse();
      erwTick(min); /* ERW-INHALT: Kleidung, Ereignisse, Laden und Alltag */
      const a = ich.aktiv;
      if (a) { if (a.wirkung) BED.forEach((b) => { if (a.wirkung[b]) s.bed[b] = klemm(s.bed[b] + a.wirkung[b] * min / 60); }); a.rest -= min;
        if (a.rest <= 0 || (a.bis && a.bis(s))) { const ende = a.ende; aufstehen(ich); ich.aufstehPunkt = null; if (ende) ende(); pruefeZiele(); } }
      if (s.bed.energie <= 0 && !ich.liegt) { ui.toast(s.name + " schläft vor Erschöpfung im Stehen ein. Das Arbeitszeitgesetz hätte das verhindert.", "rot"); ich.liegt = true; ich.f.g.rotation.x = -Math.PI / 2; ich.f.g.position.y = 0.2; ich.aktiv = { rest: 240, wirkung: { energie: 12 }, text: "schläft auf dem Boden", schnell: true }; }
      if (s.bed.hunger <= 0) { s.bed.hunger = 55; s.geld = Math.max(0, s.geld - 25); ui.toast("Pizzadienst! 25 € für eine Pizza, weil der Hunger zu groß war.", "rot"); }
      ki(dt * Math.max(1, tempo));
      funkZeit += dt; if (funkZeit > 45) { funkZeit = 0; ui.toast("Nordstern-Funk. " + pick(FUNK_L.concat((H.RADIO || []).map((x) => x.replace(/^Radio Nordstern\s*·\s*/, ""))))); }
      if (s.storchFaellig) { s.storchFaellig = false; storchKommt(); }
      kiZeit += dt; if (kiZeit > 2) { kiZeit = 0; familieAktualisieren(); hud(); licht(); }
    }
    Object.values(personen).forEach((p) => bewege(p, dt, tt));
    const kopf = ich.f.g.position; stern.position.set(kopf.x, (ich.liegt ? 1.3 : 2.25) + Math.sin(tt * 2.5) * 0.06, kopf.z); stern.quaternion.copy(camera.quaternion); stern.rotateZ(tt * 1.5); stern.visible = ich.f.g.visible;
    speicherZeit += dt; if (speicherZeit > 8) { speicherZeit = 0; speichern(); }
  }
  for (let i = animationen.length - 1; i >= 0; i--) { const a = animationen[i]; if (!a.fn((jetzt - a.t0) / 1000)) animationen.splice(i, 1); }
  renderer.render(scene, camera);
  requestAnimationFrame(schleife);
}

/* ---------- Start ---------- */
const HAUT = ["#f3d3bd", "#e2b18b", "#c68b5e", "#8d5a3b", "#5c3a26"], HAAR = ["#2b1b12", "#5a3a22", "#a0662f", "#d8b26e", "#8c8c8c", "#7a2e2a"];
const KLEID = ["#7b2338", "#1f3557", "#6f8f7b", "#0f5c63", "#c9a227", "#c76b5b"];
function startbild() {
  const alt = laden();
  let look = { haut: HAUT[1], haar: "kurz", haarfarbe: HAAR[1], oben: KLEID[0], hose: "#2f3b4a", rock: false };
  try { const m = JSON.parse(localStorage.getItem("pe26_atelier_model") || "null"); if (m) { look.haut = m.haut; look.haarfarbe = m.haarfarbe; look.haar = { wellen: "lang", bob: "lang", locken: "locken", dutt: "dutt" }[m.haar] || "kurz"; } } catch (e) {}
  let name = "Kim";
  const vorschau = () => { entferne("vorschau"); const p = person("vorschau", look, false); p.f.g.position.set(7, 0, 8.5); p.f.g.rotation.y = 0.6; p.pose = "winken"; };
  const zeichne = () => {
    $("start").hidden = false;
    $("start").innerHTML = `<div class="startkarte"><h1>Nordstern Leben</h1><p>Ein ganzes Leben rund um das Personalwesen. Arbeiten, lernen, einrichten, verlieben, heiraten und eine Familie gründen. Alles, was Geld und Karriere bringt, läuft über Fragen zum Thema des Tages.</p>
      ${alt ? `<div class="reihe"><button class="btn" id="weiter" type="button">Weiterspielen mit ${esc(alt.name)}</button></div><p class="klein">Oder ein neues Leben anlegen. Der alte Spielstand wird dabei überschrieben.</p>` : ""}
      <label class="feld">Name<input class="eingabe" id="sName" maxlength="14" value="${esc(name)}"></label>
      <div class="feld"><span>Hautton</span><div class="farben">${HAUT.map((c) => `<button type="button" class="farbe" data-k="haut" data-v="${c}" style="background:${c}" aria-label="Hautton" aria-pressed="${look.haut === c}"></button>`).join("")}</div></div>
      <div class="feld"><span>Haarfarbe</span><div class="farben">${HAAR.map((c) => `<button type="button" class="farbe" data-k="haarfarbe" data-v="${c}" style="background:${c}" aria-label="Haarfarbe" aria-pressed="${look.haarfarbe === c}"></button>`).join("")}</div></div>
      <div class="feld"><span>Frisur</span><div class="schnitte">${[["kurz", "Kurz"], ["lang", "Lang"], ["dutt", "Dutt"], ["locken", "Locken"]].map(([v, t]) => `<button type="button" class="schnitt" data-k="haar" data-v="${v}" aria-pressed="${look.haar === v}">${t}</button>`).join("")}</div></div>
      <div class="feld"><span>Kleidung</span><div class="farben">${KLEID.map((c) => `<button type="button" class="farbe" data-k="oben" data-v="${c}" style="background:${c}" aria-label="Kleidungsfarbe" aria-pressed="${look.oben === c}"></button>`).join("")}</div>
        <div class="schnitte"><button type="button" class="schnitt" data-k="rock" data-v="0" aria-pressed="${!look.rock}">Hose</button><button type="button" class="schnitt" data-k="rock" data-v="1" aria-pressed="${look.rock}">Rock</button></div></div>
      <div class="reihe"><button class="btn${alt ? " leise" : ""}" id="neu" type="button">Neues Leben starten</button><a class="btn leise" href="../index.html?tag=${tag}">Zur Spielauswahl</a></div></div>`;
    $("start").querySelectorAll("[data-k]").forEach((b) => b.onclick = () => { const k = b.dataset.k; look[k] = k === "rock" ? b.dataset.v === "1" : b.dataset.v; name = $("sName").value; klang("klick"); vorschau(); zeichne(); });
    $("neu").onclick = () => { name = ($("sName").value || "Kim").trim().slice(0, 14); entferne("vorschau"); s = neuerStand(look, name); los(true); };
    if (alt) $("weiter").onclick = () => { entferne("vorschau"); s = alt; los(false); };
  };
  START_MOEBEL.forEach((id) => stelleAuf(id)); vorschau(); zeichne();
}
function los(neu) {
  initInhalt(s); /* ERW-INHALT: fehlende Felder für neue Inhalte setzen */
  $("start").hidden = true; $("hud").hidden = false;
  pools(); START_MOEBEL.concat(s.gekauft).forEach((id) => stelleAuf(id));
  ich = person("ich", s.look, false); ich.f.g.position.set(neu ? 7 : 6, 0, neu ? 11.5 : 7);
  if (s.partner) partnerErscheint(false);
  familieAktualisieren(); hud(); licht(); speichern();
  erwLos(neu); /* ERW-INHALT */
  if (neu) info("Willkommen in Nordstern", `<p>${esc(s.name)} zieht in ein kleines Haus in Nordstern City und beginnt mit einem Praktikum in der Personalabteilung der Nordstern Fahrradwerke.</p>
    <p><b>So geht es.</b> Tippen Sie auf Möbel, Personen oder den Boden. Über die Haustür geht es zur Arbeit, mit Fragen zum Thema ${esc(day.title)}. Mit dem Geld kaufen Sie Möbel am PC. Achten Sie auf die Bedürfnisse unten links.</p>
    <p class="hinweis">Tipp, im Briefkasten wartet die Nachbarschaft. Vielleicht ist die große Liebe dabei.</p>`, [["Los geht es", () => { geheZu(ich, 7, 9); pruefeZiele(); }]]);
}
function themaWaehlen() {
  const k = dialog(`<p class="dkopf">Thema der Fragen</p><p class="intro">Arbeit, Lernen und Gespräche nutzen die Themen dieses Unterrichtstags. Der Spielstand bleibt erhalten.</p><select class="eingabe" id="tSel">${S.days.map((d) => `<option value="${d.nr}"${d.nr === tag ? " selected" : ""}>Tag ${d.nr}, ${esc(d.title)}</option>`).join("")}</select><div class="reihe"><button class="btn" id="tOk" type="button">Übernehmen</button></div>`);
  $("tOk").onclick = () => { tag = +$("tSel").value; day = S.days.find((d) => d.nr === tag) || S.days[0]; pools(); const u = new URL(location.href); u.searchParams.set("tag", tag); history.replaceState(null, "", u); $("hThema").textContent = "Tag " + tag; dialogZu(); ui.toast("Neues Thema " + day.title); };
}

$("hThema").textContent = "Tag " + tag;
document.querySelectorAll("[data-tempo]").forEach((b) => b.onclick = () => { tempo = +b.dataset.tempo; klang("klick"); hud(); });
$("btnKaufen").onclick = () => { if (s) kaufen(); };
$("btnZiele").onclick = () => { if (s) zieleZeigen(); };
$("hThema").onclick = themaWaehlen;
$("btnDrehen").onclick = () => { drehung = (drehung + 1) % 4; groesse(); };
$("btnPlus").onclick = () => { zoom = Math.min(2.6, zoom * 1.2); groesse(); };
$("btnMinus").onclick = () => { zoom = Math.max(0.6, zoom / 1.2); groesse(); };
$("btnTon").onclick = () => { ton = !ton; try { localStorage.setItem("pe26_spiel_ton", ton ? "1" : "0"); } catch (e) {} $("btnTon").classList.toggle("aus", !ton); };
$("btnTon").classList.toggle("aus", !ton);
$("btnBed").onclick = () => document.body.classList.toggle("bed-zu");
$("zurueck").href = "../index.html?tag=" + tag;
addEventListener("keydown", (e) => {
  if (dialogOffen) { if (/^[1-4]$/.test(e.key)) { const b = document.querySelectorAll("#dialog .antwort:not(:disabled)")[+e.key - 1]; if (b) b.click(); } return; }
  if (e.key === " ") { e.preventDefault(); tempo = tempo ? 0 : 1; hud(); }
  if (e.key === "Escape") menueZu();
});
addEventListener("pagehide", speichern);
groesse(); startbild(); requestAnimationFrame(schleife);
window.__leben = { stand: () => s, personen, aktionenFuer, zeit: (m) => zeitVergeht(m), geld: (g) => { s.geld += g; hud(); } };

/* ERW-INHALT: Anbindung von Kleidung, Laden, Ereignissen, Atelier und Alltag
   Kontext für die Module, neue Möbel, neue Lebensziele, Hooks und Testhaken. */
const ERW = {
  get s() { return s; }, get ich() { return ich; }, get day() { return day; }, get tag() { return tag; }, get dialogOffen() { return dialogOffen; }, get tempo() { return tempo; },
  THREE, scene, personen, moebel, KATALOG, PLATZ, ZIELE, STUFEN, BED, IS_TOUCH,
  esc, pick, mischen, euro, klemm, klang, ui, dialog, dialogZu, info, feedback, frageRunde, sortFrage, lernKarte, naechsteFrage, naechsteKarte, naechsteSort, antwortZaehlen,
  zeitVergeht, stunde, lebensTag, uhr, hud, speichern, pruefeZiele, stelleAuf, funken, dauerAktion, geheZu, dreheZu, aufstehen, nutzpunkt, partnerDa, kinderGross, alterTage, stimmung, stimmungText, lernFertig
};
KLEIDUNG.init(ERW); EREIGNISSE.init(ERW); ATELIER.init(ERW); LADEN.init(ERW); ALLTAG.init(ERW); ALLTAG.setzeKandidaten(KANDIDATEN);
KATALOG.kleiderschrank = { name: "Kleiderschrank mit Spiegel", preis: 250, text: "Outfits für jeden Anlass, Modeboutique und Laufsteg-Show" };
PLATZ.kleiderschrank = [0.4, 3.85, Math.PI / 2, [1.35, 3.85]];
ZIELE.push(
  { id: "laden1", text: "Einen eigenen Laden eröffnen", lohn: 200, ok: (st) => !!st.laden },
  { id: "team3", text: "3 Mitarbeitende im eigenen Laden beschäftigen", lohn: 300, ok: (st) => !!st.laden && st.laden.mitarbeiter.length >= 3 },
  { id: "ladenstufe3", text: "Den eigenen Laden auf Stufe 3 ausbauen", lohn: 400, ok: (st) => !!st.laden && st.laden.stufe >= 3 },
  { id: "kleidung10", text: "10 neue Kleidungsstücke sammeln", lohn: 200, ok: (st) => !!st.kleidung && KLEIDUNG.neueTeile(st) >= 10 },
  { id: "ereignis10", text: "10 überraschende Erlebnisse meistern", lohn: 200, ok: (st) => !!st.ereignis && st.ereignis.anzahl >= 10 },
  { id: "laufsteg", text: "Bei der Laufsteg-Show 7 von 8 Fragen richtig beantworten", lohn: 250, ok: (st) => !!st.atelier && st.atelier.beste >= 7 },
  { id: "kochen5", text: "Kochen auf Stufe 5 bringen", lohn: 150, ok: (st) => !!st.skills && st.skills.kochen >= 5 },
  { id: "charisma5", text: "Charisma auf Stufe 5 bringen", lohn: 150, ok: (st) => !!st.skills && st.skills.charisma >= 5 },
  { id: "freunde3", text: "Drei Freundschaften schließen", lohn: 200, ok: (st) => Array.isArray(st.freunde) && st.freunde.filter((f) => f.bez >= 30).length >= 3 },
  { id: "urlaub1", text: "Den ersten Urlaub machen", lohn: 100, ok: (st) => !!st.leben && st.leben.letzterUrlaub >= 0 },
  { id: "zertifikat", text: "Ein Weiterbildungszertifikat erwerben", lohn: 200, ok: (st) => !!st.leben && st.leben.zertifikate.length >= 1 },
  { id: "eigenheim", text: "Ein Eigenheim abbezahlen", lohn: 500, ok: (st) => !!st.haushalt && st.haushalt.wohnen === "eigen" }
);
function initInhalt(st) {
  if (!st) return;
  KLEIDUNG.initStand(st); EREIGNISSE.initStand(st); LADEN.initStand(st); ATELIER.initStand(st); ALLTAG.initStand(st);
}
function erwPerson(p) { try { KLEIDUNG.person(p); ALLTAG.personHook(p); } catch (e) { console.warn("ERW-INHALT person", e); } }
function erwStimmung() { return s ? EREIGNISSE.stimmungsBonus() : 0; }
let erwSchnapp = null;
function erwChronikPruefen() {
  const x = { stufe: s.stufe, partner: s.partner ? s.partner.name : "", bez: s.partner ? BEZ_STUFE(s.partner) : "", kinder: s.kinder.length };
  if (erwSchnapp) {
    if (x.stufe > erwSchnapp.stufe) EREIGNISSE.chronik(s.name + " wird befördert, jetzt " + STUFEN[x.stufe].name + ".");
    if (x.partner && x.partner !== erwSchnapp.partner) EREIGNISSE.chronik(s.name + " lernt " + x.partner + " kennen.");
    if (x.bez !== erwSchnapp.bez && x.partner && (x.bez === "Verliebt" || x.bez === "Verlobt" || x.bez === "Verheiratet")) EREIGNISSE.chronik({ Verliebt: s.name + " hat sich in " + x.partner + " verliebt.", Verlobt: s.name + " und " + x.partner + " haben sich verlobt.", Verheiratet: s.name + " und " + x.partner + " haben geheiratet." }[x.bez]);
    if (x.kinder > erwSchnapp.kinder) EREIGNISSE.chronik(s.kinder[x.kinder - 1].name + " kommt auf die Welt.");
  }
  erwSchnapp = x;
}
let erwUhr = 0;
function erwTick(min) {
  if (!s) return;
  try { KLEIDUNG.tick(min); ALLTAG.tick(min); LADEN.tick(min); EREIGNISSE.tick(min); erwUhr += min; if (erwUhr > 10) { erwUhr = 0; erwChronikPruefen(); } } catch (e) { console.warn("ERW-INHALT tick", e); }
}
function erwLos(neu) {
  erwSchnapp = null; erwChronikPruefen();
  if (neu) { EREIGNISSE.chronik(s.name + " zieht in ein kleines Haus in Nordstern City."); setTimeout(() => ui.toast("Tipp, im Möbelhaus gibt es einen Kleiderschrank mit Spiegel. Damit wählen Sie Outfits für jeden Anlass."), 9000); }
  EREIGNISSE.markerZeigen();
}
const REZEPTE = ["Lohnsteuer-Lasagne", "Bruttosuppe mit Nettoeinlage", "Probezeit-Pfannkuchen", "Tarifvertrags-Tiramisu", "Ficus-Salat ohne Ficus", "Betriebsrats-Bolognese"];
function erwAktionen(ziel, a) {
  if (!s) return;
  KLEIDUNG.aktionen(ziel, a);
  if (ziel.typ === "moebel") {
    const id = ziel.id;
    if (id === "kleiderschrank") {
      a.push({ t: "Vor dem Spiegel Smalltalk üben", f: () => dauerAktion(ich, { x: 1.35, z: 3.85, blick: [0.3, 3.85], pose: "reden", dauer: 30, wirkung: { spass: 6 }, text: "übt vor dem Spiegel",
        ende: () => { EREIGNISSE.skill("charisma", 0.5); ui.toast(s.name + " übt den perfekten Händedruck mit dem Spiegelbild. Charisma steigt.", "gut"); } }) });
      a.push({ t: "Modeatelier, Laufsteg-Show", f: ATELIER.menue });
    }
    if (id === "pc") {
      a.forEach((x) => { if (x.t && x.t.indexOf("Homeoffice") === 0) { const f0 = x.f; x.f = () => { KLEIDUNG.anlassFuer("arbeit", { aktiv: () => ich.pose === "tippen", min: 60, max: 300 }); f0(); }; } });
      a.push({ t: "Modeboutique online", f: KLEIDUNG.boutique });
      a.push({ t: "Modeatelier online", f: ATELIER.menue });
      a.push({ t: s.laden ? "Laden-Zentrale, " + s.laden.name : "Selbstständigkeit", f: LADEN.zentrale });
      a.push({ t: "Leben organisieren", f: erwOrganisieren });
    }
    if (id === "tuer") a.forEach((x) => { if (x.t && x.t.indexOf("Zur Arbeit") === 0) { const f0 = x.f; x.f = () => { KLEIDUNG.anlassFuer("arbeit", { aktiv: () => !ich.f.g.visible, min: 120, max: 700 }); f0(); }; } });
    if (id === "herd") {
      const k = EREIGNISSE.stufe("kochen"), np = nutzpunkt("herd");
      a.push({ t: "Neues Rezept ausprobieren", f: () => dauerAktion(ich, { x: np.x, z: np.z, blick: [8.6, 5.5], pose: "essen", dauer: 60, wirkung: { hunger: 100 + k * 8, spass: 10 + k * 3 }, text: "probiert ein neues Rezept",
        ende: () => { EREIGNISSE.skill("kochen", 0.5); ui.toast(s.name + " kocht " + pick(REZEPTE) + "." + (k >= 3 ? " Ein Gedicht!" : " Gar nicht schlecht."), "gut"); } }) });
    }
    if (id === "sofa" || id === "briefkasten") a.push({ t: "Nordstern Chic lesen", f: ATELIER.lookbook });
    if (id === "briefkasten") a.push({ t: "Freundschaften pflegen", f: ALLTAG.freunde });
  } else if (ziel.typ === "person" && ziel.id === "ich") {
    a.push({ t: "Lebenschronik ansehen", f: EREIGNISSE.chronikZeigen });
  }
}
function erwOrganisieren() {
  const liste = [["Urlaub planen", ALLTAG.urlaub], ["Stellenangebote ansehen", ALLTAG.stellen], ["Weiterbildungskurs belegen, 150 €", ALLTAG.weiterbildung], ["Haushaltsbuch", ALLTAG.haushaltsbuch], ["Freundschaften pflegen", ALLTAG.freunde]];
  const k = dialog(`<p class="dkopf">Leben organisieren</p><p class="intro">Am Schreibtisch planen Sie Urlaub, Karriere, Weiterbildung und Finanzen.</p><div class="ld-menue">${liste.map((x, i) => `<button type="button" class="btn" data-i="${i}">${esc(x[0])}</button>`).join("")}</div><div class="reihe"><button class="btn leise" type="button" id="orZu">Schließen</button></div>`);
  k.querySelectorAll("[data-i]").forEach((b) => b.onclick = () => { dialogZu(); liste[+b.dataset.i][1](); });
  $("orZu").onclick = dialogZu;
}
if ($("btnChronik")) $("btnChronik").onclick = () => { if (s && !dialogOffen) EREIGNISSE.chronikZeigen(); };
Object.assign(window.__leben, {
  erw: {
    ctx: ERW, kleidung: KLEIDUNG, laden: LADEN, ereignisse: EREIGNISSE, atelier: ATELIER, alltag: ALLTAG, initInhalt: () => initInhalt(s),
    geld: (g) => { s.geld += g; hud(); }, setze: (pfad, wert) => { const t = pfad.split("."); let o = s; while (t.length > 1) o = o[t.shift()]; o[t[0]] = wert; hud(); },
    kleiderschrank: (anlass) => KLEIDUNG.kleiderschrank(anlass), boutique: () => KLEIDUNG.boutique(), outfit: (anlass, teile) => { Object.assign(s.kleidung.outfits[anlass], teile); KLEIDUNG.setzeAnlass(anlass); },
    kaufeMoebel: (id) => { if (!s.gekauft.includes(id)) { s.gekauft.push(id); stelleAuf(id, false); } },
    eroeffne: (typ, name, farbe) => LADEN.eroeffne(typ, name, farbe), schicht: (n) => LADEN.schicht(n), einstellen: () => LADEN.einstellen(), zentrale: () => LADEN.zentrale(),
    ereignis: (id) => EREIGNISSE.starte(id), ereignisIds: () => EREIGNISSE.alleEreignisse().map((e) => ({ id: e.id, lern: !!e.lern, moeglich: !e.bed || !!e.bed(s) })),
    chronik: () => EREIGNISSE.chronikZeigen(), laufsteg: () => ATELIER.laufsteg(), lookbook: () => ATELIER.lookbook(), inventur: (eigen) => ATELIER.inventur(eigen),
    urlaub: () => ALLTAG.urlaub(), stellen: () => ALLTAG.stellen(), weiterbildung: () => ALLTAG.weiterbildung(), haushaltsbuch: () => ALLTAG.haushaltsbuch(), freunde: () => ALLTAG.freunde(),
    aktionen: (typ, id) => aktionenFuer({ typ, id }).map((x) => x.t || ("gesperrt " + x.gesperrt)), klick: (typ, id, text) => { const x = aktionenFuer({ typ, id }).find((y) => y.t && y.t.indexOf(text) === 0); if (x) { aufstehen(ich); x.f(); return true; } return false; },
    tick: (min) => erwTick(min), dialogOffen: () => dialogOffen, tempo: (t) => { tempo = t; hud(); }
  }
});
/* /ERW-INHALT */
