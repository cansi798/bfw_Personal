/* Nordstern Leben · Selbstständigkeit mit eigenem Laden, Personal, Kasse und Ausbau
   © 2026 Waybuild Akademie, Waybuild UG (haftungsbeschränkt). Alle Rechte vorbehalten. · www.waybuild.de */
import { registriere, eigeneFrage, chronik, marker, skill, stufe as skillStufe } from "./ereignisse.js";
import { inventur } from "./atelier.js";

let C = null;
const $ = (id) => document.getElementById(id);
const pick = (a) => a[Math.floor(Math.random() * a.length)];

export const ARTEN = {
  cafe: { name: "Café", start: 1500, umsatz: 40, farbe: "#c76b5b", rollen: ["Barista", "Servicekraft"], text: "Kaffee, Kuchen und Gespräche über Gleitzeit.",
    kunden: ["Herr Brandt bestellt einen Kaffee, schwarz wie sein Sakko von 1998, und will vorher etwas wissen.", "Paula Probezeit filmt ihren Cappuccino für 12 Follower und stellt dabei eine Fachfrage.", "Eine Kundin aus der Lohnbuchhaltung möchte Milchschaum und eine kurze Auskunft.", "Der Betriebsrat tagt an Tisch drei und bittet um eine Einschätzung."] },
  mode: { name: "Modeboutique", start: 1800, umsatz: 50, farbe: "#b07ad8", rollen: ["Verkaufsberatung", "Visual Merchandising"], text: "Outfits für Vorstellungsgespräch, Party und Montag.",
    kunden: ["Frau Demir sucht ein Outfit für das Mitarbeitergespräch und fragt nebenbei etwas.", "Herr Brandt möchte sein Sakko von 1998 umtauschen. Der Kassenbon fehlt, dafür hat er eine Frage.", "Paula Probezeit braucht ein Outfit für ihr nächstes Video und eine Antwort für ihre Follower.", "Ein Azubi sucht Schuhe für die Abschlussprüfung und ist sehr nervös."] },
  blumen: { name: "Blumenladen", start: 1200, umsatz: 35, farbe: "#4f9a5f", rollen: ["Floristik", "Verkauf"], text: "Sträuße für Jubiläen, Ficus für Hygienefaktoren.",
    kunden: ["Ein Kunde braucht einen Strauß zum Dienstjubiläum und eine schnelle Auskunft.", "Frau Demir bestellt Blumen für die neuen Auszubildenden und testet Sie mit einer Frage.", "Ein Ficus im Schaufenster sieht Sie fragend an. Dann fragt eine Kundin wirklich etwas.", "Robin aus der Nachbarschaft kauft Blumen für den Betriebsrat und fragt nach Ihrer Meinung."] },
  fahrrad: { name: "Fahrradladen", start: 1700, umsatz: 55, farbe: "#0f5c63", rollen: ["Zweiradmechatronik", "Verkauf"], text: "Reparaturen, Dienstrad und Lastenräder für Nordstern City.",
    kunden: ["Eine Kundin will ein Dienstrad leasen und fragt nach Personalthemen.", "Herr Brandt bringt sein Lastenrad zur Inspektion. Während Sie schrauben, fragt er etwas.", "Ein Fahrradkurier wartet auf einen neuen Schlauch und eine Antwort.", "Die Nordstern Fahrradwerke liefern neue Räder und haben eine Frage zum Personal."] },
  buch: { name: "Buchhandlung", start: 1300, umsatz: 40, farbe: "#7b2338", rollen: ["Buchhandel", "Verkauf"], text: "Fachbücher, Krimis und Ratgeber zur Zeugnissprache.",
    kunden: ["Ein Azubi sucht ein Buch zur Prüfungsvorbereitung und stellt eine Frage.", "Frau Demir bestellt ein Buch zum Arbeitsrecht in der neuesten Auflage und prüft Ihr Wissen.", "Paula Probezeit sucht ein Buch mit dem Titel Wie ich 13 Follower bekomme.", "Ein Lesekreis aus der Personalabteilung diskutiert und braucht eine Entscheidung."] },
  personal: { name: "Personalberatung", start: 1000, umsatz: 65, farbe: "#1f3557", rollen: ["Recruiting", "Personalberatung"], text: "Eine Recruiting-Agentur, die passende Menschen und Betriebe zusammenbringt.",
    kunden: ["Ein Handwerksbetrieb sucht dringend Fachkräfte und braucht Ihre Beratung.", "Ein Start-up fragt, wie man ohne Excel-Chaos Personal plant.", "Die Nordstern Fahrradwerke möchten Ihre Meinung zu einem Bewerbungsprozess.", "Eine Bäckerei sucht Auszubildende und fragt, worauf es ankommt."] }
};
export const STUFEN_LADEN = [
  { name: "Kleiner Laden", kosten: 0, miete: 40 }, { name: "Gut besucht", kosten: 1500, miete: 60 }, { name: "Stadtbekannt", kosten: 3000, miete: 85 },
  { name: "Filialreif", kosten: 5000, miete: 115 }, { name: "Kultladen von Nordstern", kosten: 8000, miete: 150 }
];
const LADEN_FARBEN = ["#c76b5b", "#b07ad8", "#4f9a5f", "#0f5c63", "#7b2338", "#1f3557", "#c9a227", "#f39bb0"];
const faktor = (l) => 1 + 0.3 * (l.stufe - 1);
export const maxTeam = (l) => l.stufe + 1;
const lohnSumme = (l) => l.mitarbeiter.reduce((a, x) => a + x.lohn, 0);
const euro = (n) => C.euro(n);

export function initStand(s) {
  if (!s.laden || typeof s.laden !== "object") { s.laden = null; return; }
  const l = s.laden;
  if (!ARTEN[l.typ]) l.typ = "cafe";
  l.name = String(l.name || ARTEN[l.typ].name).slice(0, 24); l.farbe = l.farbe || ARTEN[l.typ].farbe;
  l.stufe = Math.max(1, Math.min(5, l.stufe | 0 || 1)); l.kasse = +l.kasse || 0; l.tagUmsatz = +l.tagUmsatz || 0;
  l.mitarbeiter = Array.isArray(l.mitarbeiter) ? l.mitarbeiter : [];
  l.mitarbeiter.forEach((m) => { m.lohn = +m.lohn || 60; m.zufriedenheit = Math.max(0, Math.min(100, +m.zufriedenheit || 70)); m.leistung = +m.leistung || 1; });
  if (typeof l.eroeffnet !== "number") l.eroeffnet = s.zeit;
  if (!Array.isArray(l.buch)) l.buch = [];
  if (typeof l.letzterTag !== "number") l.letzterTag = Math.floor(s.zeit / 1440) + 1;
  if (!l.gelobt || typeof l.gelobt !== "object") l.gelobt = {};
  if (typeof l.letzteZeit !== "number") l.letzteZeit = s.zeit;
}

/* ---------- Aktionen für Ladenlokal, PC und Laden-Zentrale ---------- */
export function aktionen() {
  const s = C && C.s; if (!s) return [];
  if (!s.laden) {
    if (s.stufe >= 2 || s.geld >= 2000) return [{ t: "Selbstständig machen", f: gruenden }];
    return [{ gesperrt: "Selbstständig ab Sachbearbeitung Personal oder mit 2.000 € Startkapital" }];
  }
  const l = s.laden, h = C.stunde(), a = [];
  if (h < 7 || h >= 20) a.push({ gesperrt: "Ladenschicht nur zwischen 7 und 20 Uhr" });
  else if (s.bed.energie < 20) a.push({ gesperrt: "Zu müde für eine Ladenschicht" });
  else a.push({ t: "Ladenschicht, 4 Stunden", f: schicht });
  if (l.typ === "mode" && h >= 7 && h < 20) a.push({ t: "Boutique-Inventur", f: () => inventur(true) });
  a.push({ t: "Kasse ansehen", f: kasse });
  a.push({ t: "Personal verwalten", f: personal });
  a.push(l.stufe < 5 ? { t: "Laden ausbauen", f: ausbau } : { gesperrt: "Höchste Ladenstufe erreicht" });
  return a;
}
export function zentrale() {
  const s = C.s, esc = C.esc, l = s.laden, liste = aktionen();
  const k = C.dialog(`<p class="dkopf">${l ? esc(l.name) : "Selbstständigkeit"}<span>${l ? esc(ARTEN[l.typ].name) + ", Stufe " + l.stufe : ""}</span></p>
    ${l ? `<p class="intro">Ladenkasse ${euro(l.kasse)}, Team ${l.mitarbeiter.length} von ${maxTeam(l)}, heute ${euro(l.tagUmsatz)} Umsatz.</p>` : `<p class="intro">Ein eigener Laden in Nordstern City. Neben dem Job bei Nordstern, ganz ohne Kündigung.</p>`}
    <div class="ld-menue">${liste.map((x, i) => x.gesperrt ? `<span class="aus">${esc(x.gesperrt)}</span>` : `<button type="button" class="btn" data-i="${i}">${esc(x.t)}</button>`).join("")}</div>
    <div class="reihe"><button class="btn leise" type="button" id="ldZu">Schließen</button></div>`);
  k.querySelectorAll("[data-i]").forEach((b) => b.onclick = () => { C.dialogZu(); liste[+b.dataset.i].f(); });
  $("ldZu").onclick = C.dialogZu;
}

/* ---------- Gründung ---------- */
function gruenden() {
  const s = C.s, esc = C.esc; let typ = "cafe", farbe = ARTEN.cafe.farbe, name = "";
  const zeichne = () => {
    const a = ARTEN[typ];
    const k = C.dialog(`<p class="dkopf">Selbstständig machen<span>Guthaben ${euro(s.geld)}</span></p>
      <p class="intro">Welcher Laden soll es werden? Die Startkosten decken Einrichtung, Kaution und die erste Ware.</p>
      <div class="kandidaten ld-arten">${Object.entries(ARTEN).map(([id, x]) => `<button type="button" class="kandidat${id === typ ? " an" : ""}" data-typ="${id}" aria-pressed="${id === typ}"><span class="avatar" style="background:${x.farbe}">${x.name.slice(0, 2)}</span><b>${esc(x.name)}</b><small>Start ${euro(x.start)}</small><span>${esc(x.text)}</span></button>`).join("")}</div>
      <label class="feld">Name des Ladens<input class="eingabe" id="ldName" maxlength="24" value="${esc(name || a.name + " " + s.name)}"></label>
      <div class="feld"><span>Farbe für Schild und Markise</span><div class="farben">${LADEN_FARBEN.map((c) => `<button type="button" class="farbe" data-c="${c}" style="background:${c}" aria-label="Ladenfarbe" aria-pressed="${c === farbe}"></button>`).join("")}</div></div>
      <p class="hinweis">Laufende Kosten sind die Tagesmiete von ${euro(STUFEN_LADEN[0].miete)} und später die Löhne. Einnahmen gibt es für richtige Antworten in der Ladenschicht.</p>
      <div class="reihe"><button class="btn" type="button" id="ldOk"${s.geld < a.start ? " disabled" : ""}>${s.geld < a.start ? "Startkapital fehlt" : "Eröffnen für " + euro(a.start)}</button><button class="btn leise" type="button" id="ldAb">Abbrechen</button></div>`);
    k.querySelectorAll("[data-typ]").forEach((b) => b.onclick = () => { name = $("ldName").value; if (name === ARTEN[typ].name + " " + s.name) name = ""; typ = b.dataset.typ; farbe = ARTEN[typ].farbe; C.klang("klick"); zeichne(); });
    k.querySelectorAll("[data-c]").forEach((b) => b.onclick = () => { name = $("ldName").value; farbe = b.dataset.c; C.klang("klick"); zeichne(); });
    $("ldAb").onclick = C.dialogZu;
    $("ldOk").onclick = () => { const n = ($("ldName").value || "").trim().slice(0, 24) || a.name; eroeffne(typ, n, farbe); };
  };
  zeichne();
}
export function eroeffne(typ, name, farbe) {
  const s = C.s, a = ARTEN[typ] || ARTEN.cafe;
  if (s.geld < a.start) return false;
  s.geld -= a.start;
  s.laden = { typ, name, farbe: farbe || a.farbe, stufe: 1, kasse: 0, mitarbeiter: [], eroeffnet: s.zeit, tagUmsatz: 0 };
  initStand(s); C.dialogZu(); C.klang("hochzeit"); if (C.ich) C.funken(C.ich.f.g.position);
  chronik(s.name + " eröffnet den Laden „" + name + "“, ein " + a.name + ".");
  marker("Frisch gegründet", 7, 1440);
  C.info("Feierliche Eröffnung", `<p class="gross">${C.esc(name)}</p><p>Das Schild hängt, die Kasse klingelt zum ersten Mal. Frau Demir schickt Blumen, Herr Brandt eine Excel-Vorlage für die Buchhaltung und Paula Probezeit filmt den Moment, 9 Likes.</p><p class="hinweis">Tipp, in der Ladenschicht bringt jede richtige Antwort Umsatz. Ab einem vollen Kundenansturm lohnt sich Personal.</p>`);
  C.speichern(); C.pruefeZiele(); return true;
}

/* ---------- Ladenschicht ---------- */
const ALLTAG = ["Eine Lieferung kommt. Bevor Sie auspacken, ordnen Sie einen Fall aus dem Büro zu.", "Das Steuerbüro ruft an und braucht eine schnelle Zuordnung.", "Ein Mitarbeiter der Kammer schaut vorbei und möchte etwas wissen.", "Die Bank schickt eine Frage zum Personalplan für den Kredit."];
export function schicht(anzahl) {
  const s = C.s, l = s.laden, a = ARTEN[l.typ]; const n = anzahl || 4;
  const karten = []; for (let i = 0; i < n; i++) karten.push(i === 2 ? "sort" : "frage");
  if (l.typ === "mode") karten[n - 1] = "inventur";
  let i = 0, richtig = 0, umsatz = 0;
  const proRichtig = () => a.umsatz * faktor(l) * (1 + skillStufe("charisma") * 0.03 + (l.typ === "cafe" ? skillStufe("kochen") * 0.04 : 0));
  const weiter = (ok) => {
    if (ok) { richtig++; umsatz += proRichtig(); }
    i++; if (i < karten.length) setTimeout(karte, 0); else ende();
  };
  const titel = () => "Ladenschicht im " + l.name + ", Karte " + (i + 1) + " von " + karten.length;
  const karte = () => {
    const art = karten[i];
    if (art === "frage") C.frageRunde({ titel: titel(), intro: pick(a.kunden) + " Jede richtige Antwort bringt etwa " + euro(proRichtig()) + " Umsatz.", anzahl: 1, ende: i + 1 < karten.length ? "Nächste Karte" : "Ladenschluss",
      lob: ["Die Kundschaft kauft gleich doppelt.", "Ein Trinkgeld landet im Glas.", "Die Kundschaft verspricht eine gute Bewertung."], tadel: ["Die Kundschaft kauft trotzdem eine Kleinigkeit, aber nur aus Mitleid.", "Die Kundschaft zieht weiter zur Konkurrenz."], fertig: (r) => weiter(r > 0) });
    else if (art === "inventur") C.sortFrage({ titel: titel(), intro: "Boutique-Inventur. Hängen Sie das Etikett an die richtige Kleiderstange.", fertig: weiter });
    else C.sortFrage({ titel: titel(), intro: pick(ALLTAG), fertig: weiter });
  };
  const ende = () => {
    const trink = Math.round(skillStufe("charisma") * 3 + Math.random() * 6);
    const gesamt = Math.round(umsatz + (richtig ? trink : 0));
    l.kasse += gesamt; l.tagUmsatz += gesamt;
    C.zeitVergeht(240, { energie: -2, spass: 2, sozial: 4 });
    if (richtig >= 3) skill("charisma", 0.5);
    C.klang("kasse");
    const voll = l.mitarbeiter.length < maxTeam(l) && richtig >= 3;
    C.info("Ladenschluss", `<p class="gross">${richtig} von ${karten.length} Karten gut gemeistert</p><p>Heute kamen <b>${euro(gesamt)}</b> in die Ladenkasse${richtig && trink ? ", davon " + euro(trink) + " Trinkgeld" : ""}. Kasse jetzt ${euro(l.kasse)}.</p>${voll ? `<p class="hinweis">Der Laden war voll. Vielleicht ist es Zeit für zusätzliches Personal.</p>` : ""}`,
      voll ? [["Personal einstellen", einstellen], ["Später", null]] : [["OK", null]]);
    C.hud(); C.speichern(); C.pruefeZiele();
  };
  karte();
}

/* ---------- Kasse ---------- */
function kasse() {
  const s = C.s, l = s.laden, esc = C.esc;
  const kosten = STUFEN_LADEN[l.stufe - 1].miete + lohnSumme(l);
  const warn = l.kasse < 0 ? pick(["Herr Brandt hat eine Excel-Liste mit roten Zahlen angelegt und sie hübsch formatiert.", "Die Bank schickt einen freundlichen Brief und einen Kugelschreiber. Der Kugelschreiber ist rot.", "Ficus Herzberg lässt die Blätter hängen. Er hat die Kasse gesehen."]) : "";
  const k = C.dialog(`<p class="dkopf">Kasse von ${esc(l.name)}<span>Stufe ${l.stufe}, ${esc(STUFEN_LADEN[l.stufe - 1].name)}</span></p>
    <div class="ld-kasse"><div><small>Ladenkasse</small><b class="${l.kasse < 0 ? "minus" : ""}">${euro(l.kasse)}</b></div><div><small>Umsatz heute</small><b>${euro(l.tagUmsatz)}</b></div><div><small>Kosten je Tag</small><b>${euro(kosten)}</b></div></div>
    <table class="ld-tab"><thead><tr><th>Tag</th><th>Einnahmen</th><th>Miete</th><th>Löhne</th><th>Ergebnis</th></tr></thead><tbody>
    ${l.buch.length ? l.buch.slice(-7).reverse().map((b) => `<tr><td>${b.tag}</td><td>${euro(b.ein)}</td><td>${euro(b.miete)}</td><td>${euro(b.loehne)}</td><td class="${b.ein - b.miete - b.loehne < 0 ? "minus" : "plus"}">${euro(b.ein - b.miete - b.loehne)}</td></tr>`).join("") : `<tr><td colspan="5">Der erste Tagesabschluss folgt am nächsten Morgen.</td></tr>`}</tbody></table>
    ${warn ? `<p class="ld-warn">${esc(warn)} Keine Sorge, Ihr Laden bleibt offen. Mehr Ladenschichten bringen die Kasse wieder ins Plus.</p>` : ""}
    <p class="hinweis">Die Tagesmiete und die Löhne werden jeden Morgen abgerechnet. Mitarbeitende bringen zwischen 8 und 20 Uhr auch ohne Sie etwas Umsatz.</p>
    <div class="reihe"><button class="btn" type="button" id="ldEnt"${l.kasse <= 0 ? " disabled" : ""}>Gewinn entnehmen</button><button class="btn leise" type="button" id="ldEin"${s.geld < 200 ? " disabled" : ""}>200 € einlegen</button><button class="btn leise" type="button" id="ldZu">Schließen</button></div>`);
  $("ldEnt").onclick = () => { const b = Math.floor(l.kasse); s.geld += b; l.kasse -= b; C.klang("kasse"); C.ui.toast(euro(b) + " vom Laden auf das Privatkonto überwiesen.", "geld"); C.speichern(); C.hud(); kasse(); };
  $("ldEin").onclick = () => { s.geld -= 200; l.kasse += 200; C.klang("kasse"); C.speichern(); C.hud(); kasse(); };
  $("ldZu").onclick = C.dialogZu;
  return k;
}

/* ---------- Personal ---------- */
function personal() {
  const s = C.s, l = s.laden, esc = C.esc, tg = C.lebensTag();
  const k = C.dialog(`<p class="dkopf">Personal von ${esc(l.name)}<span>Team ${l.mitarbeiter.length} von ${maxTeam(l)}</span></p>
    ${l.mitarbeiter.length ? `<div class="ld-team">${l.mitarbeiter.map((m, i) => `<div class="ld-ma"><span class="avatar" style="background:${l.farbe}">${esc(m.name.split(" ").map((w) => w[0]).join(""))}</span>
      <div><b>${esc(m.name)}</b><small>${esc(m.rolle)}, ${euro(m.lohn)} Lohn je Tag</small><div class="zeile"><span>Zufrieden</span><i class="balken ${m.zufriedenheit < 40 ? "rot" : m.zufriedenheit < 65 ? "gelb" : ""}" style="--w:${m.zufriedenheit}%"></i></div></div>
      <button type="button" class="btn klein" data-lob="${i}"${l.gelobt[m.name] === tg ? " disabled" : ""}>${l.gelobt[m.name] === tg ? "Heute gelobt" : "Loben"}</button></div>`).join("")}</div>` : `<p class="intro">Noch arbeiten Sie allein im Laden. Mit Personal läuft der Laden auch, wenn Sie bei Nordstern sind.</p>`}
    <p class="hinweis">Die Zufriedenheit sinkt langsam, Lob und faire Bezahlung heben sie. Zufriedene Mitarbeitende bringen mehr Umsatz.</p>
    <div class="reihe"><button class="btn" type="button" id="ldNeu"${l.mitarbeiter.length >= maxTeam(l) ? " disabled" : ""}>${l.mitarbeiter.length >= maxTeam(l) ? "Team voll, erst ausbauen" : "Mitarbeitende einstellen"}</button><button class="btn leise" type="button" id="ldZu">Schließen</button></div>`);
  k.querySelectorAll("[data-lob]").forEach((b) => b.onclick = () => { const m = l.mitarbeiter[+b.dataset.lob]; m.zufriedenheit = Math.min(100, m.zufriedenheit + 8 + skillStufe("charisma")); l.gelobt[m.name] = tg; C.klang("richtig"); C.ui.toast(m.name.split(" ")[0] + " freut sich über das Lob. Anerkennung ist ein Motivator.", "gut"); C.speichern(); personal(); });
  $("ldNeu").onclick = einstellen; $("ldZu").onclick = C.dialogZu;
}
const VORN = ["Mia", "Jonas", "Lea", "Can", "Elif", "Tom", "Nora", "Ben", "Aylin", "Lukas", "Sofia", "Jan", "Emma", "Malik", "Ida", "Noel", "Greta", "Ole"];
const NACH = ["Berger", "Yilmaz", "Hansen", "Nowak", "Schulz", "Okafor", "Lindqvist", "Weber", "Krüger", "Petersen", "Aksoy", "Meier", "Brückner", "Demirel"];
const ERF = ["2 Jahre Berufserfahrung", "frisch nach der Ausbildung", "Quereinstieg aus der Gastronomie", "10 Jahre im Handel", "Studium abgebrochen, Talent gefunden", "Erfahrung aus einem großen Betrieb"];
const STAERKE = ["sehr freundlich zur Kundschaft", "rechnet schneller als jede Kasse", "kann Excel-Listen sogar Herrn Brandt erklären", "bleibt auch beim Ansturm ruhig", "hat ein Auge für schöne Schaufenster", "spricht drei Sprachen"];
const MACKE = ["bringt jeden Tag Kekse mit", "hat eine Lücke im Lebenslauf, eine Weltreise mit Ficus", "grüßt die Kundschaft mit Handschlag, auch am Telefon", "spricht fließend Zeugnissprache", "summt bei der Arbeit das Lied der Lohnsteuerklassen", "sortiert Kugelschreiber nach Farben"];
function bewerbungen(n, rolle) {
  const namen = C.mischen(VORN).slice(0, n), st = C.mischen(STAERKE), mk = C.mischen(MACKE), er = C.mischen(ERF);
  return namen.map((v, i) => { const leistung = Math.round((0.8 + Math.random() * 0.5) * 100) / 100; return { name: v + " " + pick(NACH), rolle, leistung, lohn: Math.round(40 + leistung * 30 + Math.random() * 10), erf: er[i % er.length], staerke: st[i % st.length], macke: mk[i % mk.length] }; });
}
const ANZEIGE_FALSCH = [
  (r) => `Junge, dynamische Verstärkung bis 30 Jahre für ${r} in unserem jungen Team gesucht.`,
  (r) => `Wir suchen jemanden für ${r}. Mehr verraten wir nicht.`,
  (r) => `Verstärkung für ${r} gesucht, nur Muttersprachler und nur Bewerbungen mit Foto.`,
  (r) => `Verkäuferin für ${r} gesucht, Männer bitte nicht bewerben.`
];
const INTERVIEW = [
  { q: "Welche Frage ist im Vorstellungsgespräch unzulässig?", o: ["Sind Sie schwanger?", "Welche Erfahrung haben Sie mit Kundschaft?", "Ab wann könnten Sie anfangen?", "Wie gehen Sie mit Stress um?"], c: 0,
    e: "Die Frage nach einer Schwangerschaft ist unzulässig, weil sie Frauen benachteiligt. Eine Bewerberin darf darauf sogar falsch antworten, ohne dass das Folgen hat. Fragen zur Eignung für die Stelle sind dagegen erlaubt." },
  { q: "Welche Frage ist im Vorstellungsgespräch in der Regel erlaubt?", o: ["Haben Sie schon einmal an einer Kasse gearbeitet?", "Sind Sie Mitglied einer Gewerkschaft?", "Welcher Religion gehören Sie an?", "Planen Sie bald Kinder?"], c: 0,
    e: "Erlaubt sind Fragen zur fachlichen und persönlichen Eignung für die Stelle. Fragen nach Gewerkschaft, Religion oder Familienplanung sind grundsätzlich unzulässig, außer in wenigen Sonderfällen, etwa bei kirchlichen Arbeitgebern." },
  { q: "Wie lange darf eine Probezeit höchstens dauern, damit die verkürzte Kündigungsfrist von zwei Wochen gilt?", o: ["Sechs Monate", "Zwölf Monate", "Zwei Wochen", "Drei Jahre"], c: 0,
    e: "Nach § 622 Absatz 3 BGB gilt während einer vereinbarten Probezeit von längstens sechs Monaten eine Kündigungsfrist von zwei Wochen." }
];
export function einstellen() {
  const s = C.s, l = s.laden, a = ARTEN[l.typ];
  if (l.mitarbeiter.length >= maxTeam(l)) { C.info("Team voll", `<p>Mehr Platz gibt es erst nach dem nächsten Ausbau des Ladens.</p>`); return; }
  const rolle = pick(a.rollen);
  /* Schritt 1, Personalbedarf erkennen */
  C.frageRunde({ titel: "Einstellung, Schritt 1 von 3", intro: "Personalbedarf erkennen. Die Schlange an der Kasse wird länger. Bevor Sie einstellen, prüfen Sie Ihr Wissen zum Tagesthema.", anzahl: 1, ende: "Zur Stellenanzeige",
    fertig: (r) => {
      /* Schritt 2, Stellenanzeige wählen */
      const falsch = C.mischen(ANZEIGE_FALSCH).slice(0, 2).map((f) => f(rolle));
      eigeneFrage({ titel: "Einstellung, Schritt 2 von 3", kopf: "Stellenanzeige", intro: r ? "Der Bedarf ist klar, eine Person für " + rolle + " wird gebraucht. Welche Anzeige veröffentlichen Sie?" : "Der Bedarf ist trotzdem da, eine Person für " + rolle + ". Welche Anzeige veröffentlichen Sie?",
        q: "Welche Stellenanzeige ist rechtssicher und hilfreich?", o: [`${rolle} (m/w/d) in Voll- oder Teilzeit gesucht. Aufgaben, Anforderungen, Angebot und Ansprechperson stehen in der Anzeige.`].concat(falsch), c: 0,
        e: "Eine gute Stellenanzeige ist geschlechtsneutral (m/w/d) und nennt Aufgaben, Anforderungen und Angebot. Altersgrenzen oder Formulierungen wie junges Team können nach dem AGG als Benachteiligung wegen des Alters gelten. Die Forderung nach Muttersprache kann wegen der Herkunft benachteiligen, besser sind sehr gute Deutschkenntnisse. Ein Bewerbungsfoto ist freiwillig.",
        ende: "Bewerbungen ansehen", fertig: (ok) => auswahl(rolle, ok ? 3 : 2, ok) });
    } });
}
function auswahl(rolle, n, gut) {
  const s = C.s, l = s.laden, esc = C.esc, liste = bewerbungen(n, rolle);
  const k = C.dialog(`<p class="dkopf">Einstellung, Schritt 3 von 3<span>${n} Bewerbungen</span></p>
    <p class="intro">${gut ? "Die Anzeige kam gut an." : "Die Anzeige war leider unglücklich formuliert, deshalb gibt es weniger Bewerbungen."} Wen laden Sie zum Gespräch ein?</p>
    <div class="kandidaten">${liste.map((b, i) => `<button type="button" class="kandidat" data-i="${i}"><span class="avatar" style="background:${l.farbe}">${esc(b.name.split(" ").map((w) => w[0]).join(""))}</span><b>${esc(b.name)}</b><small>${esc(b.erf)}</small><span>${esc(b.staerke)}, ${esc(b.macke)}.</span><span class="ld-lohn">Gehaltswunsch ${euro(b.lohn)} je Tag</span></button>`).join("")}</div>
    <div class="reihe"><button class="btn leise" type="button" id="ldAb">Doch nicht einstellen</button></div>`);
  k.querySelectorAll("[data-i]").forEach((b) => b.onclick = () => { const x = liste[+b.dataset.i]; C.dialogZu(); gespraech(x); });
  $("ldAb").onclick = C.dialogZu;
}
function gespraech(b) {
  const s = C.s, l = s.laden, q = pick(INTERVIEW);
  const fertig = (ok) => {
    l.mitarbeiter.push({ name: b.name, rolle: b.rolle, lohn: b.lohn, zufriedenheit: ok ? 85 : 70, leistung: b.leistung, seit: Math.round(s.zeit) });
    C.klang("ziel"); chronik(b.name + " beginnt im Laden „" + l.name + "“ als " + b.rolle + ".");
    C.info("Willkommen im Team", `<p class="gross">${C.esc(b.name)}</p><p>${ok ? "Das Gespräch lief rechtlich sauber und sehr angenehm." : "Das Gespräch war etwas holprig, aber die Chemie stimmt."} ${C.esc(b.name.split(" ")[0])} beginnt morgen als ${C.esc(b.rolle)} für ${euro(b.lohn)} je Tag. Arbeitsvertrag und Personalakte sind angelegt.</p>`);
    C.speichern(); C.pruefeZiele();
  };
  if (Math.random() < 0.5) eigeneFrage(Object.assign({ titel: "Vorstellungsgespräch mit " + b.name.split(" ")[0], kopf: "Vorstellungsgespräch", intro: "Vor dem Gespräch prüfen Sie noch einmal Ihren Fragenkatalog.", ende: "Einstellen", fertig }, q));
  else C.sortFrage({ titel: "Vorstellungsgespräch mit " + b.name.split(" ")[0], intro: b.name.split(" ")[0] + " stellt eine Gegenfrage zum Tagesthema. Wohin gehört das?", fertig });
}

/* ---------- Ausbau ---------- */
function ausbau() {
  const s = C.s, l = s.laden, esc = C.esc; if (l.stufe >= 5) return;
  const n = STUFEN_LADEN[l.stufe], verf = Math.max(0, l.kasse) + s.geld;
  const k = C.dialog(`<p class="dkopf">Laden ausbauen<span>Stufe ${l.stufe} auf ${l.stufe + 1}</span></p>
    <p class="gross">${esc(n.name)}</p>
    <ul class="ld-liste"><li>Umsatz je richtiger Antwort plus 30 Prozent</li><li>Platz für ${l.stufe + 2} Mitarbeitende</li><li>Neue Tagesmiete ${euro(n.miete)}</li></ul>
    <p>Kosten ${euro(n.kosten)}. Bezahlt wird zuerst aus der Ladenkasse, der Rest vom Privatkonto.</p>
    <div class="reihe"><button class="btn" type="button" id="ldBau"${verf < n.kosten ? " disabled" : ""}>${verf < n.kosten ? "Noch " + euro(n.kosten - verf) + " fehlen" : "Ausbauen"}</button><button class="btn leise" type="button" id="ldZu">Später</button></div>`);
  $("ldBau").onclick = () => { let rest = n.kosten; const ausKasse = Math.min(Math.max(0, l.kasse), rest); l.kasse -= ausKasse; rest -= ausKasse; s.geld -= rest; l.stufe++;
    C.dialogZu(); C.klang("hochzeit"); if (C.ich) C.funken(C.ich.f.g.position); chronik("Der Laden „" + l.name + "“ wächst auf Stufe " + l.stufe + ", " + n.name + ".");
    C.info("Ausgebaut!", `<p class="gross">${esc(n.name)}</p><p>Handwerker, Farbe und ein neues Schild. Herr Brandt hat den Bauplan in Excel nachgezeichnet.</p>`); C.speichern(); C.pruefeZiele(); };
  $("ldZu").onclick = C.dialogZu;
}

/* ---------- Laufender Betrieb ---------- */
let warnZeit = 0;
export function tick() {
  const s = C.s; if (!s || !s.laden) return;
  const l = s.laden;
  /* passiver Umsatz der Mitarbeitenden zwischen 8 und 20 Uhr */
  let d = s.zeit - l.letzteZeit; if (d < 0) d = 0; if (d > 3 * 1440) d = 3 * 1440;
  if (d >= 10) {
    let t = l.letzteZeit, plus = 0;
    while (t < s.zeit) { const schritt = Math.min(30, s.zeit - t), h = (t % 1440) / 60; if (h >= 8 && h < 20) l.mitarbeiter.forEach((m) => { plus += 7 * m.leistung * (m.zufriedenheit / 100 + 0.3) * faktor(l) * schritt / 60; }); t += schritt; }
    l.letzteZeit = s.zeit; if (plus > 0) { l.kasse += plus; l.tagUmsatz += plus; }
  }
  /* Tagesabschluss mit Miete und Löhnen */
  const tg = C.lebensTag();
  while (l.letzterTag < tg) {
    const miete = STUFEN_LADEN[l.stufe - 1].miete, loehne = lohnSumme(l), ein = Math.round(l.tagUmsatz);
    l.buch.push({ tag: l.letzterTag, ein, miete, loehne }); if (l.buch.length > 30) l.buch.shift();
    l.kasse -= miete + loehne; l.tagUmsatz = 0; l.letzterTag++;
    l.mitarbeiter.forEach((m) => { m.zufriedenheit = Math.max(0, m.zufriedenheit - 3 - (l.kasse < 0 ? 3 : 0)); });
    if (l.letzterTag === tg) C.ui.toast("Tagesabschluss im " + l.name + ". Einnahmen " + euro(ein) + ", Kosten " + euro(miete + loehne) + ".", ein >= miete + loehne ? "gut" : "");
  }
  if (l.kasse < 0 && s.zeit - warnZeit > 720) { warnZeit = s.zeit; C.ui.toast(pick(["Die Ladenkasse ist im Minus. Herr Brandt färbt die Zelle rot.", "Rote Zahlen im Laden. Eine Ladenschicht würde helfen.", "Die Kasse seufzt leise. Mehr Umsatz wäre schön."]), "rot"); }
}

/* ---------- Ereignisse rund um den Laden ---------- */
const mitMA = (s) => s.laden && s.laden.mitarbeiter.length > 0;
const irgendwer = () => pick(C.s.laden.mitarbeiter);
const LADEN_EREIGNISSE = [
  { id: "laden_urlaub", titel: "Ein Urlaubsantrag", bed: mitMA, lern: true, text: () => { const m = irgendwer(); erM = m; return `${m.name} legt einen Urlaubsantrag auf den Tresen. Zwei Wochen Ostsee, im Hauptgeschäft.`; },
    wahl: () => { const m = erM; return [{ t: "Antrag prüfen", f: () => eigeneFrage({ titel: "Urlaubsantrag", kopf: "Urlaubsrecht", q: "Wie viel bezahlten Urlaub haben Beschäftigte bei einer Fünftagewoche mindestens?",
        o: ["20 Arbeitstage im Jahr", "10 Arbeitstage im Jahr", "30 Arbeitstage im Jahr", "Es gibt keinen gesetzlichen Mindesturlaub"], c: 0,
        e: "Das Bundesurlaubsgesetz sieht mindestens 24 Werktage bei einer Sechstagewoche vor. Bei fünf Arbeitstagen pro Woche sind das 20 Arbeitstage. Urlaubswünsche sind zu berücksichtigen, außer dringende betriebliche Gründe oder sozial vorrangige Wünsche anderer stehen entgegen.", ende: "Entscheiden",
        fertig: () => C.info("Urlaubsantrag", `<p>Wie entscheiden Sie für ${C.esc(m.name.split(" ")[0])}?</p>`, [["Genehmigen", () => { m.zufriedenheit = Math.min(100, m.zufriedenheit + 15); C.ui.toast(m.name.split(" ")[0] + " freut sich auf die Ostsee.", "gut"); C.speichern(); }], ["Verschieben, wegen des Hauptgeschäfts", () => { m.zufriedenheit = Math.max(0, m.zufriedenheit - 8); C.ui.toast("Ein dringender betrieblicher Grund. " + m.name.split(" ")[0] + " versteht es, ist aber etwas enttäuscht."); C.speichern(); }]]) }) }]; } },
  { id: "laden_krank", titel: "Eine Krankmeldung", bed: mitMA, lern: true, text: () => { const m = irgendwer(); erM = m; return `${m.name} ruft morgens an. Fieber und Halsschmerzen, heute geht es nicht.`; },
    wahl: () => { const m = erM; return [{ t: "Gute Besserung wünschen und die Regeln klären", f: () => eigeneFrage({ titel: "Krankmeldung", kopf: "Entgeltfortzahlung", q: "Was gilt bei Arbeitsunfähigkeit nach dem Entgeltfortzahlungsgesetz?",
        o: ["Die Krankmeldung erfolgt sofort, dauert es länger als drei Kalendertage, braucht es spätestens am folgenden Arbeitstag eine ärztliche Feststellung", "Eine Krankmeldung ist erst nach zwei Wochen nötig", "Krankheitstage werden automatisch vom Urlaub abgezogen", "Während Krankheit gibt es nie Lohn"], c: 0,
        e: "Beschäftigte müssen die Arbeitsunfähigkeit unverzüglich melden. Dauert sie länger als drei Kalendertage, ist spätestens am darauffolgenden Arbeitstag eine ärztliche Feststellung nötig, der Arbeitgeber darf sie auch früher verlangen. Bei gesetzlich Versicherten ruft der Arbeitgeber die elektronische Bescheinigung bei der Krankenkasse ab. Der Lohn wird bis zu sechs Wochen fortgezahlt.",
        fertig: (ok) => { m.zufriedenheit = Math.min(100, m.zufriedenheit + 5); C.s.laden.kasse -= 20; chronik(m.name + " ist krank, gute Besserung."); C.info("Gute Besserung", `<p>Sie übernehmen die Schicht selbst und schicken ${C.esc(m.name.split(" ")[0])} eine Karte. Für eine Aushilfe gehen 20 € aus der Ladenkasse.</p>`); } }) }]; } },
  { id: "laden_gehalt", titel: "Ein Gehaltswunsch", bed: mitMA, text: () => { const m = C.s.laden.mitarbeiter.slice().sort((a, b) => b.leistung - a.leistung)[0]; erM = m; return `${m.name} bittet um ein Gespräch. „Ich arbeite gern hier. Aber die Miete steigt, und ich möchte über mein Gehalt sprechen.“`; },
    wahl: () => { const m = erM; return [{ t: "Lohn um 10 € je Tag erhöhen", f: () => { m.lohn += 10; m.zufriedenheit = Math.min(100, m.zufriedenheit + 25); chronik(m.name + " bekommt eine Gehaltserhöhung."); return `${m.name.split(" ")[0]} strahlt. Faire Bezahlung ist ein Hygienefaktor, sagt Herzberg, sie verhindert Unzufriedenheit.`; } },
      { t: "Einmalige Prämie von 50 € aus der Ladenkasse", f: () => { C.s.laden.kasse -= 50; m.zufriedenheit = Math.min(100, m.zufriedenheit + 12); return `${m.name.split(" ")[0]} freut sich über die Prämie, hofft aber auf mehr im nächsten Jahr.`; } },
      { t: "Freundlich ablehnen und Entwicklung anbieten", f: () => { const plus = skillStufe("charisma") >= 3 ? 5 : -12; m.zufriedenheit = Math.max(0, Math.min(100, m.zufriedenheit + plus)); return plus > 0 ? "Mit viel Charisma erklären Sie den Weg zur Teamleitung. Die Motivation steigt sogar." : `${m.name.split(" ")[0]} nickt still. Die Zufriedenheit sinkt.`; } }]; } },
  { id: "laden_kuendigung", titel: "Eine Kündigung liegt auf dem Tresen", bed: (s) => mitMA(s) && s.laden.mitarbeiter.some((m) => m.zufriedenheit < 50), gewicht: 2, lern: true,
    text: () => { const m = C.s.laden.mitarbeiter.slice().sort((a, b) => a.zufriedenheit - b.zufriedenheit)[0]; erM = m; return `${m.name} möchte kündigen. „Es liegt nicht an Ihnen. Na gut, ein bisschen schon.“`; },
    wahl: () => { const m = erM; return [{ t: "Ein ehrliches Gespräch führen", f: () => { const ok = m.zufriedenheit + skillStufe("charisma") * 6 + Math.random() * 30 >= 55; if (ok) { m.zufriedenheit = 65; skill("charisma", 0.5); return `Sie hören zu und versprechen bessere Dienstpläne. ${m.name.split(" ")[0]} bleibt.`; } return abschied(m); } },
      { t: "Die Kündigung annehmen", f: () => abschied(m) }]; } },
  { id: "laden_zeugnis", titel: "Wunsch nach einem Zwischenzeugnis", bed: mitMA, lern: true, text: () => { const m = irgendwer(); erM = m; return `${m.name} möchte ein Zwischenzeugnis, für die Weiterbildung bei der Kammer.`; },
    wahl: () => { const m = erM; return [{ t: "Zeugnis schreiben", f: () => zeugnisFrage(m, () => { m.zufriedenheit = Math.min(100, m.zufriedenheit + 8); C.info("Zeugnis geschrieben", `<p>${C.esc(m.name.split(" ")[0])} liest das Zeugnis und lächelt. Stets zu Ihrer vollsten Zufriedenheit.</p>`); }) }]; } },
  { id: "laden_mindestlohn", titel: "Prüfung der Löhne", bed: mitMA, lern: true, text: () => "Ein Brief der Steuerberatung. Bitte prüfen Sie, ob alle Löhne den gesetzlichen Mindestlohn einhalten.",
    wahl: () => [{ t: "Die Löhne prüfen", f: () => eigeneFrage({ titel: "Mindestlohn", kopf: "Entlohnung", q: "Wie hoch ist der gesetzliche Mindestlohn in Deutschland seit dem 1. Januar 2026?",
        o: ["13,90 € brutto je Stunde", "9,50 € brutto je Stunde", "12,00 € netto je Stunde", "20,00 € brutto je Stunde"], c: 0,
        e: "Seit dem 1. Januar 2026 beträgt der gesetzliche Mindestlohn 13,90 € brutto je Stunde. Für 2027 ist eine weitere Erhöhung auf 14,60 € beschlossen. Auszubildende erhalten statt des Mindestlohns eine Mindestausbildungsvergütung.",
        fertig: (ok) => { if (ok) C.s.laden.mitarbeiter.forEach((m) => m.zufriedenheit = Math.min(100, m.zufriedenheit + 3)); C.info("Löhne geprüft", `<p>Alle Löhne im Laden liegen über dem Mindestlohn. Die Steuerberatung schickt einen Daumen nach oben.</p>`); } }) }] },
  { id: "laden_paula", titel: "Paula Probezeit postet Ihren Laden", bed: (s) => !!s.laden, text: () => `Paula Probezeit hat ein Video im Laden „${C.s.laden.name}“ gedreht. Es geht fast viral, 40 Likes!`,
    wahl: () => [{ t: "Ein Dankeschön spendieren", f: () => { const l = C.s.laden, n = 60 * l.stufe; l.kasse += n; l.tagUmsatz += n; marker("Laden im Trend", 5, 720); return `Neue Kundschaft strömt herein. Plus ${euro(n)} in der Ladenkasse.`; } }] },
  { id: "laden_azubi", titel: "Bewerbung um einen Ausbildungsplatz", bed: (s) => !!s.laden && s.laden.mitarbeiter.length < maxTeam(s.laden), lern: true, text: () => "Eine Schülerin fragt, ob Ihr Laden ausbildet. Sie hat ein Praktikum gemacht und war begeistert.",
    wahl: () => [{ t: "Prüfen, ob der Laden ausbilden darf", f: () => eigeneFrage({ titel: "Ausbildungsplatz", kopf: "Berufsausbildung", q: "Was braucht ein Betrieb, um ausbilden zu dürfen?",
        o: ["Eine geeignete Ausbildungsstätte und eine persönlich und fachlich geeignete Ausbildungsperson", "Mindestens 50 Beschäftigte", "Einen Börsengang", "Nur die Zustimmung der Eltern"], c: 0,
        e: "Nach dem Berufsbildungsgesetz darf nur ausbilden, wer persönlich geeignet ist, und ausbilden darf nur, wer persönlich und fachlich geeignet ist. Außerdem muss die Ausbildungsstätte geeignet sein. Die fachliche Eignung umfasst auch berufs- und arbeitspädagogische Kenntnisse, oft nachgewiesen mit der Ausbilder-Eignungsprüfung.",
        fertig: (ok) => { const l = C.s.laden; if (ok) { const n = pick(VORN) + " " + pick(NACH); l.mitarbeiter.push({ name: n, rolle: "Ausbildung", lohn: 35, zufriedenheit: 90, leistung: 0.7, seit: Math.round(C.s.zeit) }); chronik(n + " beginnt eine Ausbildung im Laden „" + l.name + "“."); C.info("Neue Auszubildende", `<p>${C.esc(n)} beginnt die Ausbildung. Die Ausbildungsvergütung ist fair, die Begeisterung riesig.</p>`); C.pruefeZiele(); }
          else C.info("Noch nicht", `<p>Sie lassen sich erst bei der Kammer beraten. Die Schülerin bewirbt sich im nächsten Jahr noch einmal.</p>`); } }) }] },
  { id: "laden_lieferung", titel: "Falsche Lieferung", bed: (s) => !!s.laden, lern: true, text: () => "Der Lieferant hat statt der bestellten Ware 40 Ordner mit der Aufschrift Personalakte geliefert. Herr Brandt wäre begeistert.",
    wahl: () => [{ t: "Reklamieren und dabei ordnen", f: () => C.sortFrage({ titel: "Falsche Lieferung", intro: "Bevor die Ordner zurückgehen, sortieren Sie einen Fall zum Tagesthema.", fertig: (ok) => { const l = C.s.laden; l.kasse += ok ? 40 : 10; C.info("Reklamation", `<p>Der Lieferant entschuldigt sich und schreibt ${euro(ok ? 40 : 10)} gut.</p>`); } }) },
      { t: "Die Ordner Herrn Brandt schenken", f: () => { skill("charisma", 0.5); return "Herr Brandt ist gerührt. Er nennt Sie ab jetzt seinen Lieblingsladen."; } }] }
];
let erM = null;
function abschied(m) {
  const l = C.s.laden;
  eigeneFrage({ titel: "Kündigung", kopf: "Kündigung", q: "In welcher Form muss eine Kündigung des Arbeitsverhältnisses erfolgen?",
    o: ["Schriftlich mit eigenhändiger Unterschrift, eine E-Mail reicht nicht", "Mündlich genügt immer", "Per Kurznachricht mit Emoji", "Eine Kündigung braucht keine Form"], c: 0,
    e: "Nach § 623 BGB muss eine Kündigung schriftlich erfolgen und eigenhändig unterschrieben sein. Die elektronische Form ist ausgeschlossen. Die Grundkündigungsfrist beträgt vier Wochen zum Fünfzehnten oder zum Ende eines Kalendermonats.", ende: "Zum Abschied",
    fertig: () => zeugnisFrage(m, () => { l.mitarbeiter = l.mitarbeiter.filter((x) => x !== m); chronik(m.name + " verlässt den Laden „" + l.name + "“."); C.info("Abschied", `<p>${C.esc(m.name.split(" ")[0])} bringt zum Abschied Kuchen mit. Das Arbeitszeugnis ist wahr und wohlwollend formuliert.</p>`); C.speichern(); }) });
}
function zeugnisFrage(m, dann) {
  eigeneFrage({ titel: "Arbeitszeugnis für " + m.name.split(" ")[0], kopf: "Arbeitszeugnis", q: "Worauf haben Beschäftigte beim Arbeitszeugnis Anspruch?",
    o: ["Auf ein Zeugnis, auf Wunsch auch mit Angaben zu Leistung und Verhalten, wahr und wohlwollend formuliert", "Nur auf eine mündliche Bewertung", "Auf ein Zeugnis nur nach zehn Jahren", "Auf ein Zeugnis, das alle Fehler genau auflistet"], c: 0,
    e: "Nach § 109 Gewerbeordnung haben Beschäftigte bei Beendigung Anspruch auf ein Zeugnis über Art und Dauer der Tätigkeit. Auf Verlangen wird es zu einem qualifizierten Zeugnis mit Leistung und Verhalten. Es muss wahr und wohlwollend sein, ein Zwischenzeugnis gibt es bei berechtigtem Interesse.",
    ende: "Zeugnis übergeben", fertig: dann });
}

export function init(ctx) {
  C = ctx; registriere(LADEN_EREIGNISSE);
  window.NL_LADEN = { aktionen, zentrale, stand: () => (C.s ? C.s.laden : null), name: () => (C.s && C.s.laden ? C.s.laden.name : ""), farbe: () => (C.s && C.s.laden ? C.s.laden.farbe : "") };
}
