/* Nordstern Leben · Modeatelier mit Laufsteg-Show, Lookbook „Nordstern Chic“ und Boutique-Inventur
   Übernimmt die Ideen des früheren Einzelspiels Atelier Nordstern als Teil der Lebenssimulation.
   © 2026 Waybuild Akademie, Waybuild UG (haftungsbeschränkt). Alle Rechte vorbehalten. · www.waybuild.de */
import * as KL from "./kleidung.js";
import { chronik, marker, skill } from "./ereignisse.js";

let C = null;
const $ = (id) => document.getElementById(id);
const pick = (a) => a[Math.floor(Math.random() * a.length)];
const BU = ["A", "B", "C", "D"];

export function initStand(s) { s.atelier = Object.assign({ beste: 0, shows: 0, lookbook: 0, inventur: 0 }, s.atelier && typeof s.atelier === "object" ? s.atelier : {}); }
function sterneSpeichern(key, n) {
  try { const o = JSON.parse(localStorage.getItem("pe26_spiel") || "{}") || {}; const k = C.tag + "-" + key; if (!(o[k] >= n)) { o[k] = n; localStorage.setItem("pe26_spiel", JSON.stringify(o)); } } catch (e) {}
}
const sterneText = (n) => "★".repeat(n) + "☆".repeat(3 - n);

const JURY = [
  { k: "fd", name: "Frau Demir", rolle: "Personalleitung",
    hoch: ["Fachlich sicher und dazu stilvoll. Ich sehe Führungspotenzial.", "Das kommt so in die Personalakte, im besten Sinn."],
    mitte: ["Ordentlich. Mit einer kleinen Fortbildung wird das ein Spitzenlook.", "Solide. Die Details besprechen wir im Mitarbeitergespräch."],
    tief: ["Ich empfehle eine Maßnahme der Personalentwicklung, gerne on the job.", "Das war noch nicht reif für die Probezeit. Aber Sie lernen schnell."] },
  { k: "hb", name: "Herr Brandt", rolle: "trägt sein Sakko seit 1998",
    hoch: ["Das ist schicker als mein Sakko. Und das ist von 1998!", "Ich trage das sofort in Urlaub_final_final2.xlsx ein."],
    mitte: ["Nicht schlecht. Mein Sakko nickt anerkennend.", "Erinnert mich an meine Ausbildung. Also an die guten Teile."],
    tief: ["Mutig. Fast so mutig wie meine Krawatte mit Lohnsteuertabelle.", "Ich habe nichts gesehen. Wir proben das einfach noch einmal."] },
  { k: "pp", name: "Paula Probezeit", rolle: "Influencerin mit 12 Followern",
    hoch: ["Ich poste das sofort. Mindestens 13 Likes!", "Heute erkläre ich meinen Followern Personalwesen. Wegen Ihnen!"],
    mitte: ["Der Algorithmus mag das, die IHK vielleicht auch.", "Story ist raus. 4 Likes, davon 2 vom Betriebsrat."],
    tief: ["Ich mache lieber kein Foto. Datenschutz und so.", "Filter drüber, dann geht das. Beim Wissen hilft leider kein Filter."] }
];
const LOB = ["Paula Probezeit filmt schon für ihre 12 Follower.", "Frau Demir nickt. Das ist Führung durch Vorbild.", "Herr Brandt rückt anerkennend sein Sakko zurecht.", "Die Jury flüstert „Talentpool“.", "Das Blitzlicht beginnt schon jetzt."];
const SLOTS = [["oben", "Oberteil"], ["unten", "Unterteil"], ["schuhe", "Schuhe"], ["kopf", "Kopfbedeckung"], ["tasche", "Tasche"], ["acc", "Accessoire"], ["brille", "Brille"], ["jury", "Jury-Frage"]];
const jurySatz = (j, t) => `<div class="at-jury"><span class="at-kopf ${j.k}" aria-hidden="true">${j.name.split(" ").map((w) => w[0]).join("")}</span><div><b>${C.esc(j.name)}, ${C.esc(j.rolle)}</b>${C.esc(t)}</div></div>`;

function gesperrt() {
  const s = C.s, h = C.stunde();
  if (h < 8 || h >= 21) return "Das Modeatelier hat von 8 bis 21 Uhr geöffnet";
  if (s.bed.energie < 15) return "Zu müde für den Laufsteg";
  return null;
}
export function aktionen() {
  const s = C && C.s; if (!s) return [];
  const g = gesperrt(), a = [];
  a.push(g ? { gesperrt: g } : { t: "Laufsteg-Show, Modelcasting", f: laufsteg });
  a.push({ t: "Lookbook „Nordstern Chic“ lesen", f: lookbook });
  a.push(g ? { gesperrt: "Aushilfsjob nur während der Öffnungszeiten" } : { t: "Aushilfsjob Boutique-Inventur", f: () => inventur(false) });
  a.push({ t: "Modeboutique, Kleidung kaufen", f: () => KL.boutique() });
  return a;
}
export function menue() {
  const liste = aktionen(), esc = C.esc;
  const k = C.dialog(`<p class="dkopf">Modeatelier Nordstern<span>Mode trifft Personalwesen</span></p>
    <p class="intro">Im Atelier gibt es Laufsteg-Shows mit Jury, das Magazin Nordstern Chic und einen Aushilfsjob bei der Inventur. Jede richtige Antwort zum Tagesthema zählt.</p>
    <div class="ld-menue">${liste.map((x, i) => x.gesperrt ? `<span class="aus">${esc(x.gesperrt)}</span>` : `<button type="button" class="btn" data-i="${i}">${esc(x.t)}</button>`).join("")}</div>
    <div class="reihe"><button class="btn leise" type="button" id="atZu">Schließen</button></div>`);
  k.querySelectorAll("[data-i]").forEach((b) => b.onclick = () => { C.dialogZu(); liste[+b.dataset.i].f(); });
  $("atZu").onclick = C.dialogZu;
}

/* ---------- Laufsteg-Show ---------- */
let R = null;
const basicLook = () => ({ oben: { id: "tshirt", f: "#f3f4f2" }, unten: { id: "stoffhose", f: "#24323a" }, schuhe: { id: "sneaker", f: "#f3f4f2" }, kopf: null, brille: null, tasche: null, acc: [] });
export function laufsteg() {
  const s = C.s;
  C.info("Modelcasting im Atelier", `<p>${C.esc(s.name)} tritt beim Modelcasting an. Acht Fragen zum Tagesthema ${C.esc(C.day.title)}. Jede richtige Antwort schaltet ein Kleidungsstück zur Wahl frei, das danach dauerhaft im Kleiderschrank hängt. Jede falsche bringt eine Notlösung aus dem Fundus.</p><p class="hinweis">Am Ende läuft Ihre Figur über den Laufsteg und die Jury urteilt. Es gibt Preisgeld und Sterne für die Lernseite.</p>`,
    [["Casting starten", () => { R = { fragen: Array.from({ length: SLOTS.length }, () => C.naechsteFrage()), i: 0, outfit: basicLook(), erg: [], nots: [], neu: [] }; frage(); }], ["Später", null]]);
}
function punkteLeiste() { return `<div class="at-punkte" aria-label="Fortschritt">${R.fragen.map((_, i) => { const e = R.erg[i]; return `<i class="${e ? (e.ok ? "ok" : "nein") : i === R.i ? "jetzt" : ""}"></i>`; }).join("")}</div>`; }
function frage() {
  const esc = C.esc, slot = SLOTS[R.i], q = R.fragen[R.i], reihe = C.mischen(q.o.map((_, k) => k));
  const k = C.dialog(`<p class="dkopf">Laufsteg-Show<span>${slot[1]}, Frage ${R.i + 1} von ${R.fragen.length}</span></p>
    <div class="kl-wrap at-wrap"><div class="kl-buehne at-buehne" id="atBuehne"></div><div class="kl-seite">${punkteLeiste()}
      <p class="hinweis">${slot[0] === "jury" ? "Bonusfrage der Jury für die Show." : "Richtig beantwortet gibt es ein neues Teil für " + esc(slot[1]) + "."}</p>
      <h2 class="frage">${esc(q.q)}</h2><div class="antworten">${reihe.map((oi, j) => `<button class="antwort" type="button" data-oi="${oi}"><span class="bu">${BU[j]}</span><span>${esc(q.o[oi])}</span></button>`).join("")}</div><div class="nach" id="atNach"></div></div></div>`, "breit kl-dialog");
  KL.vorschau($("atBuehne"), C.s.look, R.outfit);
  k.querySelectorAll(".antwort").forEach((b) => b.onclick = () => antwort(k, +b.dataset.oi, q, slot));
}
function antwort(k, oi, q, slot) {
  const s = C.s, esc = C.esc, ok = oi === q.c;
  R.erg[R.i] = { q, gewaehlt: oi, ok }; C.antwortZaehlen(ok); C.klang(ok ? "richtig" : "falsch");
  k.querySelectorAll(".antwort").forEach((x) => { x.disabled = true; const v = +x.dataset.oi; if (v === q.c) x.classList.add("richtig"); else if (v === oi) x.classList.add("falsch"); });
  let h = `<div class="erklaerung"><p class="ergebnis ${ok ? "ok" : "nein"}">${ok ? "Richtig!" : "Leider falsch."}</p>${ok ? "" : `<p class="loes">Richtig ist <b>${esc(q.o[q.c])}</b>.</p>`}<p><span class="elbl">Erklärung</span> ${esc(q.e)}</p></div>`;
  const j = pick(JURY), letzte = R.i + 1 >= R.fragen.length, weiterText = letzte ? "Auf den Laufsteg" : "Weiter";
  if (slot[0] === "jury") h += jurySatz(j, ok ? pick(LOB) : "Die Jury notiert sich das. Beim nächsten Mal sitzt es.") + `<div class="reihe"><button class="btn" type="button" id="atWeiter">${weiterText}</button></div>`;
  else if (ok) {
    const kat = slot[0], frei = C.mischen(KL.teileVon(kat).filter((id) => KL.kaufbar(id) && !s.kleidung.besitz.includes(id)));
    const alt = C.mischen(KL.teileVon(kat).filter((id) => !frei.includes(id) && !KL.TEILE[id].not && !(KL.TEILE[id].kat === "oben" && id === "schlafanzug") && id !== "schlafhose" && id !== "hausschuhe"));
    const wahl = frei.slice(0, 3).concat(alt).slice(0, 3);
    h += jurySatz(j, pick(LOB)) + `<p class="hinweis"><b>Ihr Gewinn.</b> Wählen Sie ein Teil aus der Kollektion. ${frei.length ? "Neue Teile bleiben danach im Kleiderschrank." : "Alles schon im Schrank, dafür gibt es eine neue Farbe und 15 € Bonus."}</p>
      <div class="at-gewinn">${wahl.map((id) => `<button type="button" class="kl-teil" data-teil="${id}"><b>${esc(KL.TEILE[id].name)}</b><small>${s.kleidung.besitz.includes(id) ? "Neue Farbe" : "Neu für den Schrank"}</small></button>`).join("")}</div>`;
  } else {
    const nid = KL.NOT_FUER[slot[0]], t = KL.TEILE[nid];
    setze(slot[0], { id: nid, f: t.f }); R.nots.push(t);
    h += jurySatz(j, "Notlösung aus dem Fundus, " + t.name + ". " + t.text) + `<div class="reihe"><button class="btn" type="button" id="atWeiter">${weiterText}</button></div>`;
  }
  $("atNach").innerHTML = h;
  k.querySelectorAll("[data-teil]").forEach((b) => b.onclick = () => {
    const id = b.dataset.teil, neu = !s.kleidung.besitz.includes(id);
    if (neu) { s.kleidung.besitz.push(id); R.neu.push(KL.TEILE[id]); } else { s.geld += 15; }
    setze(slot[0], { id, f: pick(KL.FARBEN.slice(2)) }); C.klang("kasse"); C.speichern(); C.pruefeZiele(); naechste();
  });
  const w = $("atWeiter"); if (w) w.onclick = naechste;
  $("atNach").scrollIntoView({ block: "nearest", behavior: "smooth" });
}
function setze(kat, teil) { if (kat === "acc") R.outfit.acc = [teil]; else R.outfit[kat] = teil; KL.vorschauOutfit(R.outfit); }
function naechste() { R.i++; if (R.i < R.fragen.length) frage(); else show(); }
function show() {
  const s = C.s, esc = C.esc, c = R.erg.filter((e) => e.ok).length, n = R.erg.length;
  const quote = c / n, sterne = quote >= 0.875 ? 3 : quote >= 0.7 ? 2 : quote >= 0.5 ? 1 : 0;
  sterneSpeichern("styling", sterne);
  const st = c >= 7 ? "hoch" : c >= 5 ? "mitte" : "tief";
  const noten = JURY.map(() => Math.max(1, Math.min(10, Math.round(2 + c * 0.95 + (Math.random() * 2 - 1)))));
  const preis = c * 30 + (c >= 7 ? 100 : 0);
  s.geld += preis; s.atelier.beste = Math.max(s.atelier.beste, c); s.atelier.shows++;
  C.zeitVergeht(120, { spass: 12, energie: -3, sozial: 8 }); skill("charisma", c >= 6 ? 1 : 0.5);
  marker(c >= 6 ? "Laufsteg-Star" : "Mutig auf dem Laufsteg", c >= 6 ? 7 : 3, 720);
  chronik(s.name + " läuft bei der Laufsteg-Show, " + c + " von " + n + " richtig, " + preis + " € Preisgeld.");
  const urteil = c >= 8 ? "Der Look des Jahres. Titelseite!" : c >= 6 ? "Starker Auftritt. Das reicht für Seite drei." : c >= 4 ? "Solide. Die Rubrik Stilberatung meldet sich." : "Die Jury empfiehlt eine Fortbildung, gerne off the job.";
  const z1 = c >= 6 ? "Stilsicher wie ein Arbeitszeugnis" : c >= 4 ? "Auf dem Weg in den Talentpool" : "Mut zur Lücke, auch beim Wissen";
  const k = C.dialog(`<p class="dkopf">Laufsteg-Show<span>Tag ${C.day.nr}, ${esc(C.day.title)}</span></p>
    <div class="at-show"><div class="kl-buehne at-steg" id="atSteg"></div>
      <div class="at-cover" id="atCover"><b>NORDSTERN CHIC</b><span>${esc(z1)}</span><small>${c} von ${n} Fragen richtig</small></div></div>
    <div class="at-juryreihe">${JURY.map((j, i) => `<div class="at-karte" style="animation-delay:${3.6 + i * 0.45}s"><span class="at-kopf ${j.k}" aria-hidden="true">${j.name.split(" ").map((w) => w[0]).join("")}</span><div><b>${esc(j.name)}</b><small>${esc(j.rolle)}</small>${esc(pick(j[st]))}</div><span class="at-note" aria-label="Note ${noten[i]} von 10">${noten[i]}</span></div>`).join("")}</div>
    <h2 class="gross">${esc(urteil)}</h2>
    <p>Preisgeld <b>${C.euro(preis)}</b> und <span class="at-sterne" aria-label="${sterne} von 3 Sternen">${sterneText(sterne)}</span> für die Lernseite. ${sterne < 3 ? "Ab 7 richtigen Antworten gibt es drei Sterne." : "Mehr Sterne gibt es nicht. Chapeau!"}</p>
    ${R.neu.length ? `<p>Neu im Kleiderschrank sind ${R.neu.map((t) => esc(t.name)).join(", ")}.</p>` : ""}${R.nots.length ? `<p class="hinweis">Aus dem Fundus kamen ${R.nots.map((t) => esc(t.name)).join(", ")}. Die Notlösungen bleiben im Atelier.</p>` : ""}
    <div class="reihe"><button class="btn" type="button" id="atParty">Show-Look als Party-Outfit speichern</button><button class="btn leise" type="button" id="atNeu">Neue Show</button><button class="btn leise" type="button" id="atZu">Schließen</button></div>
    <h3 class="ch-titel">Alle Fragen mit Erklärung</h3>
    <div class="at-rueck">${R.erg.map((e, i) => `<details${e.ok ? "" : " open"}><summary>Frage ${i + 1}, <span class="${e.ok ? "plus" : "minus"}">${e.ok ? "richtig" : "falsch"}</span>, ${esc(e.q.q)}</summary>${e.ok ? "" : `<p>Ihre Antwort war ${esc(e.q.o[e.gewaehlt])}.</p>`}<p>Richtig ist <b>${esc(e.q.o[e.q.c])}</b>.</p><p><span class="elbl">Erklärung</span> ${esc(e.q.e)}</p></details>`).join("")}</div>`, "breit kl-dialog at-dialog");
  KL.vorschau($("atSteg"), s.look, R.outfit, "show");
  const steg = $("atSteg");
  [2300, 2600, 2900, 3150, 3400].forEach((t) => setTimeout(() => { if (!steg.isConnected) return; const b = document.createElement("i"); b.className = "at-blitz"; b.style.left = (8 + Math.random() * 78) + "%"; b.style.top = (20 + Math.random() * 55) + "%"; steg.appendChild(b); C.klang("klick"); setTimeout(() => b.remove(), 650); }, t));
  setTimeout(() => { const cv = $("atCover"); if (cv) { cv.classList.add("an"); C.klang("ziel"); } }, 3300);
  const look = KL.kopie(R.outfit);
  $("atParty").onclick = () => {
    ["oben", "unten", "schuhe", "kopf", "brille", "tasche"].forEach((kk) => { if (look[kk] && KL.TEILE[look[kk].id].not) look[kk] = kk === "oben" || kk === "unten" || kk === "schuhe" ? KL.kopie(s.kleidung.outfits.party[kk]) : null; });
    look.acc = look.acc.filter((a) => !KL.TEILE[a.id].not);
    s.kleidung.outfits.party = look; C.speichern(); C.ui.toast("Der Show-Look ist jetzt das Party-Outfit. Notlösungen wurden durch eigene Teile ersetzt.", "gut"); $("atParty").disabled = true;
  };
  $("atNeu").onclick = () => { C.dialogZu(); if (gesperrt()) C.ui.toast(gesperrt()); else laufsteg(); };
  $("atZu").onclick = C.dialogZu;
  C.hud(); C.speichern(); C.pruefeZiele();
}

/* ---------- Lookbook „Nordstern Chic“ ---------- */
const maske = (x, t) => { let r = String(x); const kern = String(t).replace(/\s*\(.*?\)\s*/g, " ").trim(); [t, kern].forEach((w) => { if (w && w.length > 2) r = r.replace(new RegExp(w.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "gi"), "…"); }); return r; };
let L = null;
export function lookbook() {
  const alle = C.day.lernen || []; if (!alle.length) { C.ui.toast("Diese Ausgabe ist leider vergriffen."); return; }
  L = { karten: C.mischen(alle).slice(0, 5), i: 0, punkte: 0, ci: 0, fehler: [] }; blatt();
}
function blatt() {
  const esc = C.esc, k0 = L.karten[L.i], n = L.karten.length, letzte = L.i === n - 1;
  const k = C.dialog(`<div class="at-heft"><div class="at-mast"><b>NORDSTERN CHIC</b><span>Ausgabe Tag ${C.day.nr}, ${esc(C.day.title)}</span></div>
    <span class="at-trend">Trend ${L.i + 1} von ${n}</span><h2 class="begriff">${esc(k0.t)}</h2><p class="lerntext">${esc(k0.x)}</p>
    <div class="at-fort"><i style="width:${((L.i + 1) / n) * 100}%"></i></div></div>
    <div class="reihe"><button class="btn leise" type="button" id="lbZur"${L.i ? "" : " disabled"}>Zurück</button><button class="btn" type="button" id="lbVor">${letzte ? "Zum Stilcheck" : "Weiter blättern"}</button></div>`, "lern");
  $("lbZur").onclick = () => { if (L.i) { L.i--; C.klang("klick"); blatt(); } };
  $("lbVor").onclick = () => { C.klang("klick"); if (letzte) { L.check = C.mischen(L.karten).slice(0, 3); check(); } else { L.i++; blatt(); } };
  return k;
}
function check() {
  const esc = C.esc, k0 = L.check[L.ci], alle = C.day.lernen || [];
  const opts = C.mischen([k0.t].concat(C.mischen(alle.filter((x) => x.t !== k0.t)).slice(0, 3).map((x) => x.t)));
  const k = C.dialog(`<div class="at-heft"><div class="at-mast"><b>NORDSTERN CHIC</b><span>Stilcheck ${L.ci + 1} von ${L.check.length}</span></div>
    <h2 class="frage">Welcher Begriff passt zur Beschreibung?</h2><p class="zitat">${esc(maske(k0.x, k0.t))}</p>
    <div class="antworten">${opts.map((o, j) => `<button class="antwort" type="button" data-o="${esc(o)}"><span class="bu">${BU[j]}</span><span>${esc(o)}</span></button>`).join("")}</div><div class="nach" id="lbNach"></div></div>`, "lern");
  k.querySelectorAll(".antwort").forEach((b) => b.onclick = () => {
    const ok = b.dataset.o === k0.t; if (ok) L.punkte++; else L.fehler.push(k0); C.antwortZaehlen(ok); C.klang(ok ? "richtig" : "falsch");
    k.querySelectorAll(".antwort").forEach((x) => { x.disabled = true; if (x.dataset.o === k0.t) x.classList.add("richtig"); else if (x === b) x.classList.add("falsch"); });
    const letzte = L.ci + 1 >= L.check.length;
    $("lbNach").innerHTML = C.feedback(ok, k0.t, k0.x) + `<div class="reihe"><button class="btn" type="button" id="lbW">${letzte ? "Ergebnis ansehen" : "Nächster Stilcheck"}</button></div>`;
    $("lbW").onclick = () => { L.ci++; if (letzte) lookbookEnde(); else check(); };
    $("lbNach").scrollIntoView({ block: "nearest", behavior: "smooth" });
  });
}
function lookbookEnde() {
  const s = C.s, esc = C.esc, n = L.check.length, p = L.punkte, sterne = p >= n ? 3 : p >= n - 1 ? 2 : p >= 1 ? 1 : 0;
  sterneSpeichern("lookbook", sterne);
  if (p >= 2) { s.wissen++; s.gelernt++; }
  s.bed.spass = C.klemm(s.bed.spass + 15); skill("charisma", 0.5); s.atelier.lookbook++;
  C.zeitVergeht(30);
  C.info("Lookbook gelesen", `<p class="gross">${p} von ${n} sitzen perfekt</p><p>${sterne === 3 ? "Die Redaktion bietet Ihnen eine eigene Kolumne an." : sterne ? "Gute Ausgabe. Mit der nächsten sitzen auch die letzten Begriffe." : "Die Redaktion empfiehlt, das Heft noch einmal in Ruhe zu lesen."} ${p >= 2 ? "Wissen plus 1." : ""} <span class="at-sterne">${sterneText(sterne)}</span></p>${L.fehler.length ? `<p><b>Noch einmal ansehen</b></p>${L.fehler.map((k0) => `<p><b>${esc(k0.t)}</b> ${esc(k0.x)}</p>`).join("")}` : ""}`);
  C.hud(); C.speichern(); C.pruefeZiele();
}

/* ---------- Boutique-Inventur ---------- */
const VK_OK = ["Die Verkäuferin klatscht leise in die Hände.", "Sitzt, passt, wackelt nicht.", "Perfekt einsortiert, wie eine gepflegte Personalakte.", "Herr Brandt will das Etikett gleich kaufen."];
const VK_NEIN = ["Die Verkäuferin hängt das Etikett diskret um.", "Knapp daneben ist auch daneben, sagt die Inventur.", "Kein Problem, Umtausch ist hier jederzeit möglich.", "Paula Probezeit hat es zum Glück nicht gefilmt."];
export function inventur(eigenerLaden) {
  const s = C.s; let i = 0, ok = 0; const n = 5;
  const eins = () => {
    const x = C.naechsteSort(); if (!x) { ende(); return; }
    const esc = C.esc;
    const k = C.dialog(`<p class="dkopf">Boutique-Inventur<span>Etikett ${i + 1} von ${n}</span></p><p class="intro">Hängen Sie das Etikett an die richtige Kleiderstange. ${esc(x.titel)}.</p>
      <div class="at-etikett">„${esc(x.it.text)}“</div><div class="antworten at-stangen">${x.kat.map((kk, j) => `<button class="antwort" type="button" data-k="${esc(kk.id)}"><span class="bu">${BU[j]}</span><span>${esc(kk.name)}</span></button>`).join("")}</div><div class="nach" id="ivNach"></div>`);
    k.querySelectorAll(".antwort").forEach((b) => b.onclick = () => {
      const r = b.dataset.k === x.it.kat; if (r) ok++; C.antwortZaehlen(r); C.klang(r ? "richtig" : "falsch");
      k.querySelectorAll(".antwort").forEach((y) => { y.disabled = true; if (y.dataset.k === x.it.kat) y.classList.add("richtig"); else if (y === b) y.classList.add("falsch"); });
      const name = (x.kat.find((kk) => kk.id === x.it.kat) || {}).name;
      $("ivNach").innerHTML = C.feedback(r, name, x.it.expl, VK_OK, VK_NEIN) + `<div class="reihe"><button class="btn" type="button" id="ivW">${i + 1 < n ? "Nächstes Etikett" : "Inventur abschließen"}</button></div>`;
      $("ivW").onclick = () => { i++; if (i < n) eins(); else ende(); };
      $("ivNach").scrollIntoView({ block: "nearest", behavior: "smooth" });
    });
  };
  const ende = () => {
    const sterne = ok >= 5 ? 3 : ok >= 4 ? 2 : ok >= 3 ? 1 : 0; sterneSpeichern("boutique", sterne);
    const lohn = ok * 15; s.atelier.inventur++;
    if (eigenerLaden && s.laden) { s.laden.kasse += lohn * 2; s.laden.tagUmsatz += lohn * 2; } else s.geld += lohn;
    C.zeitVergeht(90, { energie: -2 }); C.dialogZu(); C.klang("kasse");
    C.info("Inventur abgeschlossen", `<p class="gross">${ok} von ${n} Etiketten richtig</p><p>${eigenerLaden && s.laden ? "Die Ladenkasse bekommt " + C.euro(lohn * 2) + " aus der aufgeräumten Ware." : "Für den Aushilfsjob gibt es " + C.euro(lohn) + "."} <span class="at-sterne">${sterneText(sterne)}</span></p>`);
    C.hud(); C.speichern(); C.pruefeZiele();
  };
  eins();
}

export function init(ctx) { C = ctx; window.NL_ATELIER = { aktionen, menue, laufsteg: () => C.s && laufsteg(), lookbook: () => C.s && lookbook() }; }
