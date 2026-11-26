/* Nordstern Leben · Lebensnaher Alltag mit Haushalt, Urlaub, Jobwechsel, Weiterbildung, Freundschaften, Geburtstagen und Kinderphasen
   © 2026 Waybuild Akademie, Waybuild UG (haftungsbeschränkt). Alle Rechte vorbehalten. · www.waybuild.de */
import { registriere, registriereMini, eigeneFrage, chronik, marker, skill, starte, erlaubt, E } from "./ereignisse.js";

let C = null;
const $ = (id) => document.getElementById(id);
const pick = (a) => a[Math.floor(Math.random() * a.length)];
const MONAT = 7, JAHR = 28; /* Spieltage je Monat und je Lebensjahr */
const euro = (n) => C.euro(n);

/* ---------- Spielstand ---------- */
export function initStand(s) {
  const h = s.haushalt && typeof s.haushalt === "object" ? s.haushalt : {};
  const tg = Math.floor(s.zeit / 1440) + 1;
  if (typeof h.letzteAbrechnung !== "number") h.letzteAbrechnung = tg;
  if (!Array.isArray(h.buch)) h.buch = [];
  h.tarife = Object.assign({ strom: "standard", handy: "basis", versicherung: "basis" }, h.tarife || {});
  if (!h.wohnen) h.wohnen = "miete";
  if (typeof h.raten !== "number") h.raten = 0;
  h.monat = Object.assign({ ein: 0, aus: 0 }, h.monat || {});
  if (typeof h.geldStand !== "number") h.geldStand = s.geld;
  s.haushalt = h;
  const l = s.leben && typeof s.leben === "object" ? s.leben : {};
  if (typeof l.gebTag !== "number") l.gebTag = (tg + 9) % JAHR;
  if (typeof l.alter !== "number") l.alter = 24;
  if (!l.gefeiert || typeof l.gefeiert !== "object") l.gefeiert = {};
  if (l.firma === undefined) l.firma = "fahrrad";
  if (typeof l.letzterUrlaub !== "number") l.letzterUrlaub = -99;
  if (!Array.isArray(l.zertifikate)) l.zertifikate = [];
  if (!l.phase || typeof l.phase !== "object") l.phase = {};
  if (typeof l.schichtenGesehen !== "number") l.schichtenGesehen = s.schichten || 0;
  if (typeof l.letzterTag !== "number") l.letzterTag = tg;
  s.leben = l;
  if (!Array.isArray(s.freunde)) s.freunde = [];
  if (s.partner && typeof s.partner.gebTag !== "number") s.partner.gebTag = Math.floor(Math.random() * JAHR);
}

/* ---------- Haushalt ---------- */
const TARIFE = {
  strom: { name: "Strom", opt: { spar: ["Spartarif", 30], standard: ["Standardtarif", 40], oeko: ["Ökostrom", 46] } },
  handy: { name: "Handyvertrag", opt: { basis: ["Basis", 15], premium: ["Premium mit viel Datenvolumen", 32] } },
  versicherung: { name: "Versicherungen", opt: { basis: ["Haftpflicht und Hausrat", 18], komfort: ["Komfortpaket mit Rechtsschutz", 32] } }
};
export function fixkosten() {
  const s = C.s, h = s.haushalt, p = [];
  p.push([h.wohnen === "kredit" ? "Kreditrate Eigenheim, noch " + h.raten + " Raten" : h.wohnen === "eigen" ? "Eigenheim, abbezahlt" : "Miete", h.wohnen === "kredit" ? 210 : h.wohnen === "eigen" ? 0 : 180]);
  Object.entries(TARIFE).forEach(([k, t]) => { const o = t.opt[h.tarife[k]] || Object.values(t.opt)[0]; p.push([t.name + ", " + o[0], o[1]]); });
  if (s.kinder.length) p.push(["Kosten für " + s.kinder.length + (s.kinder.length > 1 ? " Kinder" : " Kind"), 25 * s.kinder.length]);
  return p;
}
function einnahmenFix() { const s = C.s, p = []; if (s.kinder.length) p.push(["Kindergeld", 60 * s.kinder.length]); return p; }
function abrechnen(monatNr) {
  const s = C.s, h = s.haushalt;
  const kosten = fixkosten(), ein = einnahmenFix();
  const k = kosten.reduce((a, x) => a + x[1], 0), e = ein.reduce((a, x) => a + x[1], 0);
  const vorher = s.geld; s.geld = Math.max(0, s.geld - k + e);
  h.buch.push({ monat: monatNr, kosten: k, fixein: e, ein: Math.round(h.monat.ein), aus: Math.round(h.monat.aus) }); if (h.buch.length > 12) h.buch.shift();
  h.monat = { ein: 0, aus: 0 }; h.geldStand = s.geld;
  if (h.wohnen === "kredit") { h.raten--; if (h.raten <= 0) { h.wohnen = "eigen"; chronik("Der Kredit fürs Eigenheim ist abbezahlt!"); C.ui.toast("Der Kredit ist abbezahlt. Das Haus gehört jetzt ganz Ihnen.", "ziel"); } }
  if (vorher - k + e < 0) { marker("Knapp bei Kasse", -5, 1440); C.ui.toast("Monatsabrechnung. Das Konto reicht gerade nicht ganz. Die Bank schickt freundlich eine Erinnerung und einen Kugelschreiber.", "rot"); }
  else C.ui.toast("Monatsabrechnung. Fixkosten " + euro(k) + (e ? ", Kindergeld " + euro(e) : "") + ".", "geld");
}
export function haushaltsbuch() {
  const s = C.s, h = s.haushalt, esc = C.esc;
  const kosten = fixkosten(), ein = einnahmenFix(), summe = kosten.reduce((a, x) => a + x[1], 0) - ein.reduce((a, x) => a + x[1], 0);
  const naechste = h.letzteAbrechnung + MONAT - C.lebensTag();
  const k = C.dialog(`<p class="dkopf">Haushaltsbuch<span>Ein Monat hat hier ${MONAT} Spieltage</span></p>
    <div class="ld-kasse"><div><small>Einnahmen diesen Monat</small><b class="plus">${euro(h.monat.ein)}</b></div><div><small>Ausgaben diesen Monat</small><b class="minus">${euro(h.monat.aus)}</b></div><div><small>Nächste Abrechnung</small><b>in ${Math.max(0, naechste)} ${naechste === 1 ? "Tag" : "Tagen"}</b></div></div>
    <table class="ld-tab"><thead><tr><th>Fixkosten je Monat</th><th>Betrag</th></tr></thead><tbody>${kosten.map((x) => `<tr><td>${esc(x[0])}</td><td>${euro(x[1])}</td></tr>`).join("")}${ein.map((x) => `<tr><td>${esc(x[0])}</td><td class="plus">plus ${euro(x[1])}</td></tr>`).join("")}<tr><td><b>Saldo</b></td><td><b>${euro(summe)}</b></td></tr></tbody></table>
    <div class="hh-tarife">${Object.entries(TARIFE).map(([kk, t]) => `<div><b>${esc(t.name)}</b><div class="schnitte">${Object.entries(t.opt).map(([id, o]) => `<button type="button" class="schnitt" data-t="${kk}" data-v="${id}" aria-pressed="${h.tarife[kk] === id}">${esc(o[0])}, ${euro(o[1])}</button>`).join("")}</div></div>`).join("")}</div>
    ${h.wohnen === "miete" ? `<p class="hinweis">Mit 3.000 € Eigenkapital können Sie statt Miete einen Kredit für ein Eigenheim aufnehmen. Nach 10 Raten gehört das Haus Ihnen.</p>` : ""}
    ${h.buch.length ? `<table class="ld-tab"><thead><tr><th>Monat</th><th>Einnahmen</th><th>Ausgaben</th><th>Fixkosten</th></tr></thead><tbody>${h.buch.slice(-4).reverse().map((b) => `<tr><td>${b.monat}</td><td class="plus">${euro(b.ein + b.fixein)}</td><td class="minus">${euro(b.aus)}</td><td>${euro(b.kosten)}</td></tr>`).join("")}</tbody></table>` : ""}
    <div class="reihe">${h.wohnen === "miete" ? `<button class="btn leise" type="button" id="hhKredit"${s.geld < 3000 ? " disabled" : ""}>Eigenheim finanzieren</button>` : ""}<button class="btn" type="button" id="hhZu">Schließen</button></div>`, "breit");
  k.querySelectorAll("[data-t]").forEach((b) => b.onclick = () => { h.tarife[b.dataset.t] = b.dataset.v; C.klang("klick"); if (b.dataset.v === "oeko") marker("Grünes Gewissen", 3, 1440); C.speichern(); haushaltsbuch(); });
  const kr = $("hhKredit"); if (kr) kr.onclick = () => { s.geld -= 3000; h.wohnen = "kredit"; h.raten = 10; chronik(s.name + " finanziert das Haus und zahlt ab jetzt Raten statt Miete."); C.klang("hochzeit"); C.speichern(); C.hud(); haushaltsbuch(); };
  $("hhZu").onclick = C.dialogZu;
}

/* ---------- Urlaub ---------- */
const ZIELE_URLAUB = [
  { id: "nordsee", name: "Nordsee", preis: 250, tage: 2, text: "Wind, Watt und Fischbrötchen. Der Strandkorb hat sogar WLAN, zum Glück ohne Empfang." },
  { id: "berge", name: "Berge", preis: 350, tage: 3, text: "Wandern, Almhütte und ein Gipfelkreuz ohne Excel-Liste." },
  { id: "stadt", name: "Städtereise", preis: 300, tage: 2, text: "Museen, Cafés und eine Stadtführung zur Geschichte der Mitbestimmung." },
  { id: "balkon", name: "Balkonien", preis: 0, tage: 1, text: "Liegestuhl, Limonade und der Ficus als Reisebegleitung." }
];
const URLAUB_FRAGEN = [
  { q: "Wie viel bezahlten Urlaub haben Beschäftigte bei einer Fünftagewoche mindestens?", o: ["20 Arbeitstage im Jahr", "10 Arbeitstage im Jahr", "30 Arbeitstage im Jahr", "Es gibt keinen gesetzlichen Mindesturlaub"], c: 0,
    e: "Das Bundesurlaubsgesetz sieht mindestens 24 Werktage bei einer Sechstagewoche vor. Bei fünf Arbeitstagen pro Woche entspricht das 20 Arbeitstagen. Viele Tarif- und Arbeitsverträge gewähren mehr." },
  { q: "Was gilt grundsätzlich für Resturlaub am Jahresende?", o: ["Er muss im laufenden Jahr genommen werden, eine Übertragung bis Ende März ist bei dringenden Gründen möglich, und der Arbeitgeber muss vorher auf den Verfall hinweisen", "Er verfällt nie", "Er wird immer automatisch ausgezahlt", "Er verfällt sofort ohne Hinweis"], c: 0,
    e: "Nach § 7 Absatz 3 Bundesurlaubsgesetz ist der Urlaub im Kalenderjahr zu nehmen. Bei dringenden betrieblichen oder persönlichen Gründen wird er bis zum 31. März übertragen. Nach der Rechtsprechung verfällt Urlaub nur, wenn der Arbeitgeber rechtzeitig auf den drohenden Verfall hingewiesen hat." },
  { q: "Wann darf der Arbeitgeber einen Urlaubswunsch ablehnen?", o: ["Bei dringenden betrieblichen Belangen oder wenn sozial vorrangige Wünsche anderer Beschäftigter entgegenstehen", "Immer, wenn er keine Lust hat", "Nur an Feiertagen", "Nie, jeder Wunsch muss sofort genehmigt werden"], c: 0,
    e: "Nach § 7 Absatz 1 Bundesurlaubsgesetz sind die Urlaubswünsche zu berücksichtigen. Eine Ablehnung ist nur möglich, wenn dringende betriebliche Belange oder Urlaubswünsche anderer, die sozial Vorrang haben, entgegenstehen." }
];
export function urlaub() {
  const s = C.s, esc = C.esc, tg = C.lebensTag();
  if (tg - s.leben.letzterUrlaub < MONAT) { C.info("Urlaub planen", `<p>Der letzte Urlaub ist noch keinen Monat her. Frau Demir sagt freundlich, der Urlaubsplan sei schon bunt genug.</p>`); return; }
  const k = C.dialog(`<p class="dkopf">Urlaub planen<span>Guthaben ${euro(s.geld)}</span></p><p class="intro">Wohin soll es gehen? ${s.partner ? esc(s.partner.name.split(" ")[0]) + " kommt natürlich mit." : ""}</p>
    <div class="kandidaten">${ZIELE_URLAUB.map((z, i) => `<button type="button" class="kandidat" data-i="${i}"${s.geld < z.preis ? " disabled" : ""}><b>${esc(z.name)}</b><small>${z.tage} ${z.tage > 1 ? "Tage" : "Tag"}, ${z.preis ? euro(z.preis) : "kostenlos"}</small><span>${esc(z.text)}</span></button>`).join("")}</div>
    <div class="reihe"><button class="btn leise" type="button" id="urZu">Abbrechen</button></div>`);
  k.querySelectorAll("[data-i]").forEach((b) => b.onclick = () => { const z = ZIELE_URLAUB[+b.dataset.i]; C.dialogZu(); antrag(z); });
  $("urZu").onclick = C.dialogZu;
}
function antrag(z) {
  const q = pick(URLAUB_FRAGEN);
  eigeneFrage(Object.assign({ titel: "Urlaubsantrag bei Frau Demir", kopf: "Urlaubsrecht", intro: "Frau Demir nimmt den Antrag entgegen. „Kurze Frage, damit wir beide sicher sind.“", ende: "Antrag abgeben",
    fertig: (ok) => C.info("Urlaubsantrag", `<p>${ok ? "Frau Demir genehmigt den Antrag sofort und wünscht gute Erholung." : "Frau Demir erklärt die Regel noch einmal und genehmigt den Antrag trotzdem. Urlaub dient der Erholung, das ist der Sinn des Gesetzes."}</p>`, [["Koffer packen", () => reise(z)]]) }, q));
}
function reise(z) {
  const s = C.s; s.geld -= z.preis; s.leben.letzterUrlaub = C.lebensTag() + z.tage;
  C.zeitVergeht(z.tage * 1440);
  let ziel = Math.floor(s.zeit / 1440) * 1440 + 10 * 60; if (ziel < s.zeit) ziel += 1440; s.zeit = ziel;
  Object.assign(s.bed, { energie: 95, hunger: 75, hygiene: 85, spass: 95, sozial: s.partner ? 90 : 70 });
  if (s.partner) E.bez(10);
  marker("Erholt aus dem Urlaub", 10, 1440 * 2);
  chronik(s.name + " kommt aus dem Urlaub zurück, " + z.name + ".");
  C.klang("hochzeit");
  C.info("Zurück aus dem Urlaub", `<p class="gross">Grüße aus ${C.esc(z.name === "Balkonien" ? "Balkonien" : "dem Urlaub")}</p><p>${C.esc(z.text)} ${s.partner ? C.esc(s.partner.name.split(" ")[0]) + " und " + C.esc(s.name) + " sind erholt und gut gelaunt." : C.esc(s.name) + " ist erholt und gut gelaunt."}</p><p class="hinweis">Alle Bedürfnisse sind aufgefüllt. Die Stimmung bleibt zwei Tage lang besser.</p>`);
  C.hud(); C.speichern(); C.pruefeZiele();
}

/* ---------- Jobwechsel innerhalb der Nordstern Gruppe ---------- */
export const FIRMEN = {
  fahrrad: { name: "Nordstern Fahrradwerke", zulage: 0, ab: 0, text: "Der erste Arbeitgeber, mit Herrn Brandt und Frau Demir." },
  hotel: { name: "Nordstern Hafenhotel", zulage: 25, ab: 1, text: "Personalarbeit im Schichtbetrieb, mit Blick auf den Hafen." },
  maschinen: { name: "Nordstern Maschinenbau", zulage: 45, ab: 2, text: "Ein großer Betrieb mit Betriebsrat, Tarifvertrag und Kantine." },
  logistik: { name: "Nordstern Logistik", zulage: 70, ab: 3, text: "Viele Standorte, viel Personalplanung und viele Excel-Listen." }
};
export function stellen() {
  const s = C.s, esc = C.esc, f = s.leben.firma;
  const k = C.dialog(`<p class="dkopf">Stellenangebote<span>Aktuell bei ${esc(FIRMEN[f].name)}</span></p>
    <p class="intro">In der Nordstern Gruppe sind Stellen frei. Ein Wechsel bringt eine Zulage pro Schicht. Die Karrierestufe nehmen Sie mit.</p>
    <div class="kandidaten">${Object.entries(FIRMEN).filter(([id]) => id !== f).map(([id, x]) => `<button type="button" class="kandidat" data-id="${id}"${s.stufe < x.ab ? " disabled" : ""}><b>${esc(x.name)}</b><small>${x.zulage ? "Zulage " + euro(x.zulage) + " je Schicht" : "Ohne Zulage, dafür vertraut"}</small><span>${esc(x.text)}</span>${s.stufe < x.ab ? `<span class="ld-lohn">ab ${esc(C.STUFEN[x.ab].name)}</span>` : ""}</button>`).join("")}</div>
    <div class="reihe"><button class="btn leise" type="button" id="stZu">Schließen</button></div>`);
  k.querySelectorAll("[data-id]").forEach((b) => b.onclick = () => { C.dialogZu(); bewerben(b.dataset.id); });
  $("stZu").onclick = C.dialogZu;
}
function bewerben(id) {
  const s = C.s, x = FIRMEN[id];
  eigeneFrage({ titel: "Bewerbung bei " + x.name, kopf: "Anschreiben", intro: "Zuerst das Anschreiben. Was gehört hinein?", q: "Was macht ein gutes Anschreiben aus?",
    o: ["Ein klarer Bezug zur Stelle, die eigene Motivation und passende Qualifikationen", "Möglichst viele Seiten mit dem kompletten Lebenslauf in Prosa", "Ein Foto vom letzten Urlaub", "Der Hinweis, dass man eigentlich keine Lust hat"], c: 0,
    e: "Ein gutes Anschreiben ist kurz, meist eine Seite. Es zeigt, warum man genau zu dieser Stelle passt, was man mitbringt und was einen motiviert. Der Lebenslauf liegt als eigene Anlage bei.", ende: "Zum Vorstellungsgespräch",
    fertig: (ok1) => C.frageRunde({ titel: "Vorstellungsgespräch bei " + x.name, intro: "Die Personalleitung stellt zwei Fachfragen zum Tagesthema.", anzahl: 2, ende: "Auf die Antwort warten",
      fertig: (r) => {
        if (r + (ok1 ? 1 : 0) >= 2) C.info("Zusage!", `<p class="gross">${C.esc(x.name)}</p><p>Die Stelle ist Ihre. Vor dem Wechsel kündigen Sie bei Ihrem jetzigen Arbeitgeber schriftlich und fristgerecht.</p>`, [["Wechseln", () => wechsel(id)], ["Doch bleiben", () => C.ui.toast("Sie bleiben. Frau Demir ist erleichtert und bringt Kekse.")]]);
        else C.info("Absage", `<p>Diesmal hat es nicht geklappt. Die Absage ist freundlich formuliert, wie es sich gehört. Beim nächsten Mal klappt es.</p>`);
      } }) });
}
function wechsel(id) {
  eigeneFrage({ titel: "Kündigung beim alten Arbeitgeber", kopf: "Kündigungsfrist", q: "Welche Kündigungsfrist gilt für Beschäftigte nach dem Gesetz grundsätzlich?",
    o: ["Vier Wochen zum Fünfzehnten oder zum Ende eines Kalendermonats", "Ein Tag", "Ein Jahr zum Jahresende", "Gar keine Frist"], c: 0,
    e: "Nach § 622 Absatz 1 BGB beträgt die Grundkündigungsfrist vier Wochen zum Fünfzehnten oder zum Ende eines Kalendermonats. Längere Fristen für den Arbeitgeber hängen von der Dauer der Beschäftigung ab. Verträge und Tarifverträge können Abweichungen regeln.", ende: "Kündigung abgeben",
    fertig: () => { const s = C.s; s.leben.firma = id; chronik(s.name + " wechselt zu " + FIRMEN[id].name + "."); marker("Neuer Job, neues Glück", 6, 1440); C.klang("ziel"); C.info("Neuer Arbeitgeber", `<p>Ab jetzt arbeitet ${C.esc(s.name)} bei ${C.esc(FIRMEN[id].name)}. Herr Brandt schreibt ein Abschiedsgedicht in Excel.</p>`); C.speichern(); C.pruefeZiele(); } });
}

/* ---------- Weiterbildungskurs ---------- */
export function weiterbildung() {
  const s = C.s, titel = "Zertifikat " + C.day.title;
  if (s.leben.zertifikate.includes(titel)) { C.info("Weiterbildung", `<p>Das ${C.esc(titel)} haben Sie schon. Wählen Sie oben ein anderes Thema für einen neuen Kurs.</p>`); return; }
  if (s.geld < 150) { C.info("Weiterbildung", `<p>Der Kurs kostet 150 €. Vielleicht erst noch eine Schicht arbeiten.</p>`); return; }
  C.info("Weiterbildungskurs", `<p>Ein Kurs der Kammer zum Thema ${C.esc(C.day.title)}. Drei Lerneinheiten, danach gibt es bei mindestens zwei bestandenen Kurzchecks ein Zertifikat.</p><p class="hinweis">Kosten 150 €, Dauer etwa vier Stunden.</p>`, [["Anmelden", () => {
    s.geld -= 150; let n = 0, ok = 0;
    const eins = () => C.lernKarte({ titel: "Weiterbildungskurs, Einheit " + (n + 1) + " von 3", intro: "Die Dozentin erklärt einen Begriff. Danach folgt der Kurzcheck.", fertig: (r) => { C.lernFertig(r); if (r) ok++; n++; if (n < 3) setTimeout(eins, 0); else fertig(); } });
    const fertig = () => { C.zeitVergeht(240, { spass: -2 });
      if (ok >= 2) { s.leben.zertifikate.push(titel); s.karriere += 3; chronik(s.name + " erhält das " + titel + "."); marker("Frisch zertifiziert", 6, 1440); C.klang("ziel"); C.info("Bestanden!", `<p class="gross">${C.esc(titel)}</p><p>${ok} von 3 Einheiten bestanden. Plus 3 Karrierepunkte. Frau Demir legt das Zertifikat in die Personalakte.</p>`); }
      else C.info("Nicht bestanden", `<p>${ok} von 3 Einheiten bestanden. Für das Zertifikat braucht es zwei. Der Kurs kann wiederholt werden.</p>`);
      C.hud(); C.speichern(); C.pruefeZiele(); };
    eins();
  }], ["Später", null]]);
}

/* ---------- Freundschaften ---------- */
let KANDIDATEN = [];
export function setzeKandidaten(k) { KANDIDATEN = k; }
export function freunde() {
  const s = C.s, esc = C.esc, tg = C.lebensTag();
  const frei = KANDIDATEN.filter((c) => !(s.partner && s.partner.id === c.id) && !s.freunde.some((f) => f.id === c.id));
  const k = C.dialog(`<p class="dkopf">Freundschaften<span>${s.freunde.length} ${s.freunde.length === 1 ? "Freundschaft" : "Freundschaften"}</span></p>
    ${s.freunde.length ? `<div class="ld-team">${s.freunde.map((f, i) => `<div class="ld-ma"><span class="avatar" style="background:${f.farbe || "#0f5c63"}">${esc(f.name.split(" ").map((w) => w[0]).join(""))}</span>
      <div><b>${esc(f.name)}</b><small>${esc(f.beruf || "")}${f.hobby ? ", mag " + esc(f.hobby) : ""}</small><div class="zeile"><span>${f.bez >= 60 ? "Beste Freunde" : f.bez >= 30 ? "Befreundet" : "Bekannt"}</span><i class="balken" style="--w:${f.bez}%"></i></div></div>
      <span class="kl-knoepfe"><button type="button" class="btn klein leise" data-an="${i}"${f.anruf === tg ? " disabled" : ""}>${f.anruf === tg ? "Heute telefoniert" : "Anrufen"}</button><button type="button" class="btn klein" data-tr="${i}">Treffen</button></span></div>`).join("")}</div>` : `<p class="intro">Noch keine Freundschaften. In der Nachbarschaft wohnen nette Leute.</p>`}
    ${frei.length ? `<h3 class="ch-titel">Neue Leute kennenlernen</h3><div class="kandidaten">${frei.map((c) => `<button type="button" class="kandidat" data-neu="${c.id}"><span class="avatar" style="background:${c.look.oben}">${esc(c.name.split(" ").map((w) => w[0]).join(""))}</span><b>${esc(c.name)}</b><small>${esc(c.beruf || c.rolle)}</small><span>${esc(c.text)}</span></button>`).join("")}</div>` : ""}
    <div class="reihe"><button class="btn" type="button" id="frZu">Schließen</button></div>`, "breit");
  k.querySelectorAll("[data-an]").forEach((b) => b.onclick = () => { const f = s.freunde[+b.dataset.an]; f.anruf = tg; f.bez = Math.min(100, f.bez + 4); s.bed.sozial = C.klemm(s.bed.sozial + 20); C.zeitVergeht(20); C.ui.toast("Ein langes Telefonat mit " + f.name.split(" ")[0] + ". " + pick(["Es ging um Urlaub und Überstunden.", "Es ging um den neuen Ficus.", "Es ging um Herrn Brandts Sakko."]), "gut"); C.speichern(); C.pruefeZiele(); freunde(); });
  k.querySelectorAll("[data-tr]").forEach((b) => b.onclick = () => { const f = s.freunde[+b.dataset.tr]; C.dialogZu(); treffen(f); });
  k.querySelectorAll("[data-neu]").forEach((b) => b.onclick = () => { const c = KANDIDATEN.find((x) => x.id === b.dataset.neu); s.freunde.push({ id: c.id, name: c.name, beruf: c.beruf || c.rolle, hobby: c.hobby || "", farbe: c.look.oben, bez: 12 }); chronik(s.name + " lernt " + c.name + " kennen."); C.klang("ziel"); C.speichern(); C.pruefeZiele(); freunde(); });
  $("frZu").onclick = C.dialogZu;
}
function treffen(f) {
  const v = f.name.split(" ")[0];
  C.sortFrage({ titel: "Treffen mit " + v, intro: v + " erzählt beim Kaffee von der Arbeit und fragt Sie nach Ihrer Meinung.", lob: [v + " ist beeindruckt."], tadel: [v + " erklärt es Ihnen in Ruhe. Das verbindet auch."],
    fertig: (ok) => { const s = C.s; f.bez = Math.min(100, f.bez + (ok ? 12 : 6)); s.bed.sozial = C.klemm(s.bed.sozial + 40); s.bed.spass = C.klemm(s.bed.spass + 20); C.zeitVergeht(120); if (f.bez >= 30 && !f.befreundet) { f.befreundet = true; chronik(s.name + " und " + v + " sind jetzt befreundet."); }
      C.ui.toast("Schöner Nachmittag mit " + v + ". Freundschaft jetzt " + Math.round(f.bez) + " von 100.", "gut"); C.hud(); C.speichern(); C.pruefeZiele(); } });
}

/* ---------- Kinderphasen ---------- */
export function phase(k) { const t = (C.s.zeit - k.geboren) / 1440; return t < 2 ? "Baby" : t < 6 ? "Kleinkind" : t < 20 ? "Schulkind" : "Jugendlich"; }
export function personHook(p) {
  if (!C || !C.s || !p || !/^kind\d+$/.test(p.id)) return;
  const k = C.s.kinder[+p.id.slice(4)]; if (!k) return;
  const ph = phase(k); p.f.g.scale.setScalar(ph === "Schulkind" ? 1.18 : ph === "Jugendlich" ? 1.4 : 1);
}

/* ---------- Tagesablauf ---------- */
let faellig = [];
export function tick() {
  const s = C.s; if (!s || !s.haushalt) return;
  const h = s.haushalt, l = s.leben, tg = C.lebensTag();
  /* Kontobewegungen mitschreiben */
  const d = s.geld - h.geldStand; if (d > 0) h.monat.ein += d; else if (d < 0) h.monat.aus -= d; h.geldStand = s.geld;
  /* Monatsabrechnung */
  while (tg - h.letzteAbrechnung >= MONAT) { h.letzteAbrechnung += MONAT; abrechnen(Math.floor(h.letzteAbrechnung / MONAT)); h.geldStand = s.geld; }
  /* Zulage des neuen Arbeitgebers */
  if (s.schichten > l.schichtenGesehen) { const z = FIRMEN[l.firma] ? FIRMEN[l.firma].zulage : 0; const n = s.schichten - l.schichtenGesehen; l.schichtenGesehen = s.schichten; if (z) { s.geld += z * n; C.ui.toast("Zulage von " + FIRMEN[l.firma].name + ", plus " + euro(z * n) + ".", "geld"); } }
  /* Neuer Tag, Geburtstage und Kinderphasen prüfen */
  if (tg !== l.letzterTag) {
    l.letzterTag = tg; const tj = tg % JAHR;
    if (tj === l.gebTag && l.gefeiert.ich !== tg) { l.gefeiert.ich = tg; faellig.push("geburtstag_ich"); }
    if (s.partner && tj === s.partner.gebTag && l.gefeiert.partner !== tg) { l.gefeiert.partner = tg; faellig.push("geburtstag_partner"); }
    s.kinder.forEach((k, i) => { const alter = Math.floor((s.zeit - k.geboren) / 1440); if (alter > 0 && alter % MONAT === 0 && l.gefeiert["k" + i] !== tg) { l.gefeiert["k" + i] = tg; kindGeb = i; faellig.push("geburtstag_kind"); } });
  }
  s.kinder.forEach((k, i) => { const ph = phase(k); if (l.phase[i] !== ph) { const alt = l.phase[i]; l.phase[i] = ph; if (alt) { chronik(k.name + " ist jetzt " + (ph === "Kleinkind" ? "ein Kleinkind" : ph === "Schulkind" ? "ein Schulkind" : "jugendlich") + "."); const p = C.personen["kind" + i]; if (p) personHook(p); if (ph === "Schulkind") { einschulungKind = i; faellig.push("einschulung"); } } } });
  if (faellig.length && erlaubt()) { const id = faellig.shift(); starte(id); }
}
let kindGeb = 0, einschulungKind = 0;

/* ---------- Ereignisse aus dem Familienleben ---------- */
const schulkinder = () => C.s.kinder.filter((k) => phase(k) === "Schulkind" || phase(k) === "Jugendlich");
const kleinkinder = () => C.s.kinder.filter((k) => phase(k) === "Kleinkind");
const FAMILIE = [
  { id: "geburtstag_ich", titel: "Alles Gute zum Geburtstag!", nurGezielt: true, bed: () => false, text: (s) => `Heute hat ${s.name} Geburtstag. Frau Demir hat eine Karte geschickt, Herr Brandt eine Excel-Tabelle mit allen Geburtstagen seit 1998.`,
    wahl: (s) => [{ t: "Eine Party mit Freunden feiern, 50 €", f: () => { E.geld(-50); E.anlass("party", 240); s.leben.alter++; E.bed("sozial", 50); E.bed("spass", 40); s.freunde.forEach((f) => f.bez = Math.min(100, f.bez + 5)); marker("Geburtstagskind", 8, 1440); chronik(s.name + " feiert den " + s.leben.alter + ". Geburtstag mit einer Party."); return `Es wird getanzt, gelacht und eine Torte in Form einer Personalakte angeschnitten. ${s.name} ist jetzt ${s.leben.alter}.`; } },
      { t: "Gemütlich zu Hause feiern", f: () => { s.leben.alter++; E.bed("spass", 25); E.bed("energie", 10); if (s.partner) E.bez(4); marker("Geburtstagskind", 6, 1440); chronik(s.name + " feiert den " + s.leben.alter + ". Geburtstag ganz entspannt."); return `${s.partner ? E.vn() + " backt einen Kuchen" : "Die Nachbarin bringt einen Kuchen"} und es gibt Kerzen. ${s.name} ist jetzt ${s.leben.alter}.`; } }] },
  { id: "geburtstag_partner", titel: "Geburtstag in der Familie", nurGezielt: true, bed: () => false, text: (s) => `Heute hat ${E.vn()} Geburtstag! Noch ahnt niemand, dass Sie es nicht vergessen haben.`,
    wahl: (s) => [{ t: "Ein Geschenk kaufen, 40 €", f: () => { E.geld(-40); E.bez(8); E.bed("sozial", 20); chronik(E.vn() + " hat Geburtstag und bekommt ein Geschenk."); return `${E.vn()} packt einen Schal mit Organigramm-Muster aus und ist begeistert. Beziehung plus 8.`; } },
      { t: "Ein Geburtstagsessen kochen", f: () => { const k = Math.floor(s.skills.kochen || 0); E.bez(4 + k); skill("kochen", 0.5); E.bed("hunger", 60); chronik(s.name + " kocht für den Geburtstag von " + E.vn() + "."); return k >= 3 ? `Das Essen ist ein Gedicht. Beziehung plus ${4 + k}.` : `Die Nudeln sind etwas weich, aber ${E.vn()} isst alles auf. Beziehung plus ${4 + k}.`; } }] },
  { id: "geburtstag_kind", titel: "Kindergeburtstag", nurGezielt: true, bed: () => false, text: (s) => { const k = s.kinder[kindGeb] || s.kinder[0]; return `${k.name} hat Geburtstag und ist schon ganz aufgeregt. Phase ${phase(k)}.`; },
    wahl: (s) => { const k = s.kinder[kindGeb] || s.kinder[0]; return [{ t: "Mit Torte und Luftballons feiern, 30 €", f: () => { E.geld(-30); E.bed("sozial", 35); E.bed("spass", 30); marker("Stolze Familie", 5, 720); chronik(k.name + " feiert Geburtstag."); return `${k.name} pustet alle Kerzen auf einmal aus und wünscht sich heimlich ein Haustier.`; } }]; } },
  { id: "einschulung", titel: "Einschulung", nurGezielt: true, bed: () => false, text: (s) => `${(s.kinder[einschulungKind] || s.kinder[0]).name} kommt in die Schule! Der Ranzen ist größer als das Kind.`,
    wahl: (s) => { const k = s.kinder[einschulungKind] || s.kinder[0]; return [{ t: "Eine Schultüte packen, 20 €", f: () => { E.geld(-20); E.bed("sozial", 30); marker("Erster Schultag", 6, 1440); chronik(k.name + " wird eingeschult."); return `In der Schultüte sind Stifte, ein Kuscheltier und ein Mini-Organigramm der Klasse. ${k.name} strahlt.`; } }]; } },
  { id: "elternabend", titel: "Elternabend", bed: () => schulkinder().length > 0, lern: true, text: (s) => `Elternabend in der Klasse von ${schulkinder()[0].name}. Im Stuhlkreis fragt ein Vater nach Elternzeit.`,
    wahl: () => [{ t: "Mitreden und erklären", f: () => eigeneFrage({ titel: "Elternabend", kopf: "Elternzeit", q: "Bis zu welchem Alter des Kindes kann Elternzeit grundsätzlich genommen werden?",
        o: ["Bis zum vollendeten achten Lebensjahr, insgesamt bis zu drei Jahre je Elternteil", "Nur im ersten Lebensmonat", "Bis zum 18. Geburtstag ohne Grenze", "Elternzeit gibt es nur für Mütter"], c: 0,
        e: "Nach dem Bundeselterngeld- und Elternzeitgesetz hat jeder Elternteil Anspruch auf bis zu drei Jahre Elternzeit bis zum vollendeten achten Lebensjahr des Kindes. Bis zu 24 Monate davon können zwischen dem dritten und achten Geburtstag liegen. Väter und Mütter haben den gleichen Anspruch.",
        fertig: (ok) => { E.bed("sozial", 20); skill("charisma", ok ? 1 : 0.5); E.ende("Elternabend", ok ? "Die Klassenlehrerin fragt, ob Sie im Elternbeirat mitmachen wollen." : "Gemeinsam schauen alle nach. Der Elternabend wird zum Fachseminar."); } }) }] },
  { id: "kind_krank", titel: "Fieber am Morgen", bed: () => C.s.kinder.some((k) => phase(k) !== "Baby"), lern: true, text: (s) => `${pick(s.kinder.filter((k) => phase(k) !== "Baby")).name} hat Fieber und kann nicht in Kita oder Schule.`,
    wahl: () => [{ t: "Zu Hause bleiben und die Regeln klären", f: () => eigeneFrage({ titel: "Krankes Kind", kopf: "Kinderkrankengeld", q: "Was können gesetzlich versicherte Eltern tun, wenn sie ein krankes Kind betreuen müssen?",
        o: ["Sich freistellen lassen und Kinderkrankengeld bei der Krankenkasse beantragen, wenn das Kind unter zwölf Jahre alt ist", "Gar nichts, sie müssen trotzdem arbeiten", "Den Tag automatisch als Urlaub abziehen lassen", "Das Kind mit ins Großraumbüro nehmen, das ist Pflicht"], c: 0,
        e: "Gesetzlich versicherte Eltern können nach § 45 SGB V Kinderkrankengeld bekommen, wenn ein ärztliches Attest vorliegt, das Kind unter zwölf Jahre alt ist und keine andere Person im Haushalt die Betreuung übernehmen kann. Für diese Tage besteht Anspruch auf unbezahlte Freistellung.",
        fertig: () => { E.bed("sozial", 25); E.zeit(120); E.ende("Gute Besserung", "Mit Tee, Vorlesen und viel Schlaf geht das Fieber zurück. Frau Demir wünscht gute Besserung."); } }) }] },
  { id: "kita", titel: "Eingewöhnung in der Kita", bed: () => kleinkinder().length > 0, text: (s) => `${kleinkinder()[0].name} soll in die Kita. Die Erzieherin hat einen Eingewöhnungsplan, er sieht aus wie ein Einarbeitungsplan.`,
    wahl: () => [{ t: "Geduldig eingewöhnen", f: () => { E.bed("sozial", 20); E.bed("energie", -5); marker("Kita-Held", 4, 720); return "Nach drei Tagen winkt das Kind schon beim Abschied. Fast wie eine gelungene Einarbeitung."; } }] },
  { id: "freund_anruf", titel: "Eine Einladung", bed: (s) => s.freunde.length > 0, text: (s) => `${pick(s.freunde).name.split(" ")[0]} lädt zum Spieleabend ein. Es gibt Brettspiele und Kartoffelsalat.`,
    wahl: (s) => [{ t: "Hingehen", f: () => { s.freunde.forEach((f) => f.bez = Math.min(100, f.bez + 4)); E.bed("sozial", 40); E.bed("spass", 30); E.zeit(150); marker("Gute Freunde", 5, 720); return "Ein lustiger Abend. Beim Spiel Mitbestimmung gewinnt natürlich der Betriebsrat."; } },
      { t: "Absagen, heute lieber Ruhe", f: () => { E.bed("energie", 10); return "Die Freunde verstehen das. Beim nächsten Mal sind Sie dabei."; } }] }
];
const MINI_FAMILIE = [
  { t: (s) => `${pick(kleinkinder()).name} sagt das erste Mal Personalakte. Na ja, fast.`, bed: () => kleinkinder().length > 0, w: () => E.bed("sozial", 6) },
  { t: (s) => `${pick(schulkinder()).name} kommt mit einem Bienchen im Heft nach Hause.`, bed: () => schulkinder().length > 0, w: () => E.bed("spass", 5) },
  { t: (s) => `${pick(s.freunde).name.split(" ")[0]} schickt ein lustiges Foto vom Wochenende.`, bed: (s) => s.freunde.length > 0, w: () => E.bed("sozial", 5) },
  { t: () => "Die Stromrechnung kommt. Sie ist genau so hoch wie erwartet, also ganz okay.", w: () => {} }
];

/* ---------- Chronik-Abschnitt ---------- */
function chronikExtra() {
  const s = C.s, esc = C.esc;
  const fam = s.kinder.map((k) => `${esc(k.name)}, ${phase(k)}`).join(", ");
  return `<div class="ch-kopf"><div class="ch-box"><b>Leben</b><p>${esc(s.name)} ist ${s.leben.alter} Jahre alt und arbeitet bei ${esc(FIRMEN[s.leben.firma].name)}.</p>${fam ? `<p>Kinder ${fam}.</p>` : ""}${s.leben.zertifikate.length ? `<p>Zertifikate ${s.leben.zertifikate.map(esc).join(", ")}.</p>` : ""}${s.freunde.length ? `<p>Freundschaften mit ${s.freunde.map((f) => esc(f.name.split(" ")[0])).join(", ")}.</p>` : ""}</div>
    <div class="ch-box"><b>Haushalt</b><p>Fixkosten ${euro(fixkosten().reduce((a, x) => a + x[1], 0))} im Monat. Diesen Monat ${euro(s.haushalt.monat.ein)} rein und ${euro(s.haushalt.monat.aus)} raus.</p><button type="button" class="btn klein leise" onclick="window.__leben && window.__leben.erw && window.__leben.erw.haushaltsbuch()">Haushaltsbuch öffnen</button></div></div>`;
}

export function init(ctx) {
  C = ctx; registriere(FAMILIE); registriereMini(MINI_FAMILIE);
  window.__erwChronikExtra = [chronikExtra];
}
