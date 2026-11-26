/* Nordstern Leben · Überraschende Erlebnisse, Mini-Momente, Stimmungsmarker, Fertigkeiten und Lebenschronik
   © 2026 Waybuild Akademie, Waybuild UG (haftungsbeschränkt). Alle Rechte vorbehalten. · www.waybuild.de */
import * as KL from "./kleidung.js";

let C = null;
const LISTE = [], MINI = [];
const $ = (id) => document.getElementById(id);
const pick = (a) => a[Math.floor(Math.random() * a.length)];
const BU = ["A", "B", "C", "D"];
export function registriere(arr) { arr.forEach((e) => { if (!LISTE.some((x) => x.id === e.id)) LISTE.push(e); }); }
export function registriereMini(arr) { MINI.push(...arr); }
export const alleEreignisse = () => LISTE.slice();

/* ---------- Spielstand ---------- */
export function initStand(s) {
  const e = s.ereignis && typeof s.ereignis === "object" ? s.ereignis : {};
  if (typeof e.letzteZeit !== "number") e.letzteZeit = s.zeit;
  if (!e.erlebt || typeof e.erlebt !== "object") e.erlebt = {};
  if (typeof e.anzahl !== "number") e.anzahl = 0;
  if (typeof e.miniZeit !== "number") e.miniZeit = s.zeit;
  s.ereignis = e;
  s.skills = Object.assign({ kochen: 0, charisma: 0 }, s.skills || {});
  if (!Array.isArray(s.chronik)) s.chronik = [];
  if (!Array.isArray(s.marker)) s.marker = [];
}

/* ---------- Chronik, Marker, Fertigkeiten ---------- */
export function chronik(text) {
  const s = C && C.s; if (!s) return;
  s.chronik.push({ z: Math.round(s.zeit), t: String(text) });
  if (s.chronik.length > 160) s.chronik.splice(0, s.chronik.length - 160);
}
export function marker(text, wert, min) {
  const s = C.s; s.marker = s.marker.filter((x) => x.t !== text);
  s.marker.push({ t: text, w: wert, bis: s.zeit + (min || 360) }); markerZeigen();
}
export function stimmungsBonus() {
  const s = C && C.s; if (!s || !Array.isArray(s.marker)) return 0;
  const w = s.marker.filter((x) => x.bis > s.zeit).reduce((a, x) => a + x.w, 0);
  return Math.max(-15, Math.min(15, w));
}
export function markerZeigen() {
  const el = $("hMarker"), s = C && C.s; if (!el || !s) return;
  s.marker = s.marker.filter((x) => x.bis > s.zeit);
  const m = s.marker[s.marker.length - 1];
  el.hidden = !m; if (m) { el.textContent = m.t + (m.w >= 0 ? " +" : " ") + m.w; el.className = "marker " + (m.w >= 0 ? "plus" : "minus"); }
}
export const SKILL_NAME = { kochen: "Kochen", charisma: "Charisma" };
export function skill(k, n) {
  const s = C.s, alt = Math.floor(s.skills[k] || 0);
  s.skills[k] = Math.min(10, Math.round(((s.skills[k] || 0) + n) * 10) / 10);
  const neu = Math.floor(s.skills[k]);
  if (neu > alt) { C.klang("ziel"); C.ui.toast(SKILL_NAME[k] + " steigt auf Stufe " + neu + ".", "gut"); chronik(s.name + " erreicht " + SKILL_NAME[k] + " Stufe " + neu + "."); }
}
export const stufe = (k) => Math.floor((C.s.skills || {})[k] || 0);

/* ---------- Eigene Lernfrage mit Lösung und Erklärung ---------- */
export function eigeneFrage(o) {
  const esc = C.esc, reihe = C.mischen(o.o.map((_, k) => k));
  const k = C.dialog(`<p class="dkopf">${esc(o.titel)}<span>${esc(o.kopf || "Wissensfrage")}</span></p>${o.intro ? `<p class="intro">${esc(o.intro)}</p>` : ""}
    <h2 class="frage">${esc(o.q)}</h2><div class="antworten">${reihe.map((oi, j) => `<button class="antwort" type="button" data-oi="${oi}"><span class="bu">${BU[j]}</span><span>${esc(o.o[oi])}</span></button>`).join("")}</div><div class="nach"></div>`);
  k.querySelectorAll(".antwort").forEach((b) => b.onclick = () => {
    const oi = +b.dataset.oi, ok = oi === o.c; const s = C.s; if (ok) s.richtig++; else s.falsch++;
    C.klang(ok ? "richtig" : "falsch");
    k.querySelectorAll(".antwort").forEach((x) => { x.disabled = true; const v = +x.dataset.oi; if (v === o.c) x.classList.add("richtig"); else if (v === oi) x.classList.add("falsch"); });
    k.querySelector(".nach").innerHTML = C.feedback(ok, o.o[o.c], o.e, o.lob, o.tadel) + `<div class="reihe"><button class="btn" type="button" id="efWeiter">${esc(o.ende || "Weiter")}</button></div>`;
    $("efWeiter").onclick = () => { C.dialogZu(); o.fertig(ok); C.hud(); C.speichern(); C.pruefeZiele(); };
    k.querySelector(".nach").scrollIntoView({ block: "nearest", behavior: "smooth" });
  });
}

/* ---------- Werkzeuge für Ereignisse ---------- */
export const E = {
  get s() { return C.s; },
  vn: () => C.s.partner ? C.s.partner.name.split(" ")[0] : "",
  geld(n) { const s = C.s; s.geld = Math.max(0, s.geld + n); C.klang(n >= 0 ? "kasse" : "klick"); },
  bed(b, n) { C.s.bed[b] = C.klemm(C.s.bed[b] + n); },
  marker, skill, chronik,
  bez(n) { if (C.s.partner) C.s.partner.bez = Math.max(0, Math.min(100, C.s.partner.bez + n)); },
  karriere(n) { C.s.karriere += n; },
  wissen(n) { C.s.wissen += n; },
  zeit(min, w) { C.zeitVergeht(min, w); },
  ende(titel, text) { C.info(titel, `<p>${C.esc(text)}</p>`); C.hud(); C.speichern(); C.pruefeZiele(); },
  frage(o, fertig) { eigeneFrage(Object.assign({}, o, { fertig })); },
  tagesfrage(o) { C.frageRunde(Object.assign({ anzahl: 1, ende: "Weiter" }, o)); },
  sortier(o) { C.sortFrage(o); },
  lernen(o) { C.lernKarte(o); },
  kinderGross: () => C.kinderGross(),
  tier: () => (Array.isArray(C.s.tiere) && C.s.tiere.length ? C.s.tiere[0] : null),
  anlass: (a, min) => KL.anlassFuer(a, { max: min || 180 })
};

/* ---------- Grundereignisse ---------- */
const BASIS = [
  { id: "kuchen", titel: "Kuchen von nebenan", text: (s) => `Es klingelt. Die Nachbarin steht mit einem Blech Streuselkuchen vor der Tür. „Zu viel gebacken“, sagt sie, „wie immer bei der Betriebsfeier meines Mannes.“`,
    wahl: (s) => [{ t: "Annehmen und plaudern", f: () => { E.bed("hunger", 30); E.bed("sozial", 25); E.marker("Satt und zufrieden", 5, 240); return `${s.name} isst zwei Stück und erfährt, dass der Mann der Nachbarin ebenfalls Excel-Listen liebt. Hunger und Soziales steigen.`; } },
      { t: "Nach dem Rezept fragen", f: () => { E.skill("kochen", 1); E.bed("sozial", 10); return "Das Rezept steht auf einem alten Lohnzettel. Kochen steigt um einen Punkt."; } }] },
  { id: "rohrbruch", titel: "Wasserrohrbruch", text: (s) => `Im Bad tropft es aus der Wand. Dann tropft es nicht mehr, dann sprudelt es. ${s.name} steht in Hausschuhen in einer Pfütze.`, lern: true,
    wahl: (s) => [{ t: "Notdienst rufen, 120 €", f: () => { E.geld(-120); E.marker("Ärger mit dem Rohr", -4, 300); return "Der Notdienst kommt schnell und rechnet genauso schnell. Das Bad ist wieder trocken."; } },
      { t: "Selbst reparieren und dabei an das Tagesthema denken", f: () => E.tagesfrage({ titel: "Rohrbruch", intro: "Während Sie den Haupthahn suchen, fällt Ihnen eine Frage aus der Personalabteilung ein. Richtig beantwortet, behalten Sie einen kühlen Kopf.",
        fertig: (r) => { if (r) { E.geld(-30); E.marker("Handwerklich begabt", 4, 360); E.ende("Rohrbruch", "Mit kühlem Kopf und Klebeband hält das Rohr. Nur 30 € für Material."); } else { E.geld(-160); E.bed("hygiene", -20); E.ende("Rohrbruch", "Das Klebeband gibt auf. Am Ende kommt doch der Notdienst, 160 € und nasse Socken."); } } }) }] },
  { id: "finanzamt", titel: "Post vom Finanzamt", text: (s) => `Ein Brief vom Finanzamt. ${s.name} öffnet ihn mit zitternden Händen. Es ist eine Erstattung!`, lern: true,
    wahl: () => [{ t: "Brief lesen und die Frage im Infoblatt lösen", f: () => E.frage({ titel: "Erstattung vom Finanzamt", kopf: "Steuerwissen", q: "Warum gibt es nach der Einkommensteuererklärung oft Geld zurück?",
        o: ["Die Lohnsteuer ist eine Vorauszahlung auf die Einkommensteuer, zu viel gezahlte Beträge werden erstattet", "Das Finanzamt verschenkt am Jahresende Restbudgets", "Die Sozialversicherung zahlt die Lohnsteuer zurück", "Der Arbeitgeber muss die Lohnsteuer doppelt zahlen"],
        c: 0, e: "Die Lohnsteuer behält der Arbeitgeber monatlich ein und führt sie ans Finanzamt ab. Sie ist eine Vorauszahlung auf die Einkommensteuer. Mit der Steuererklärung wird die tatsächliche Steuer berechnet, etwa mit Werbungskosten, und zu viel Gezahltes erstattet." },
        (ok) => { E.geld(ok ? 220 : 150); E.marker("Steuer zurück", 5, 480); E.ende("Erstattung", ok ? "Richtig verstanden. Das Finanzamt überweist 220 €." : "Das Finanzamt überweist trotzdem 150 €. Steuerrecht bleibt eben spannend."); }) }] },
  { id: "radio", titel: "Gewinnspiel im Radio", text: () => "Radio Nordstern ruft an! „Sie sind live auf Sendung. Beantworten Sie unsere Frage zum Tagesthema und gewinnen Sie 200 €.“", lern: true,
    wahl: () => [{ t: "Mitspielen", f: () => E.tagesfrage({ titel: "Gewinnspiel bei Radio Nordstern", intro: "Der Moderator zählt runter. Ganz Nordstern City hört zu.", lob: ["Der Moderator jubelt."], tadel: ["Der Moderator sagt tröstend, das sei eine schwere Frage gewesen."],
        fertig: (r) => { if (r) { E.geld(200); E.marker("Radiostar", 6, 480); E.chronik("Gewinnspiel bei Radio Nordstern gewonnen, 200 €."); E.ende("Gewonnen!", "200 € und ein Kugelschreiber von Radio Nordstern. Der Kugelschreiber ist wichtiger, sagt Herr Brandt."); } else E.ende("Knapp daneben", "Es gibt einen Trostpreis, eine Tasse mit dem Logo von Radio Nordstern."); } }) },
      { t: "Freundlich ablehnen", f: () => "Der Moderator ruft die nächste Person an. Herr Brandt gewinnt und erzählt es drei Wochen lang." }] },
  { id: "betriebsfeier", titel: "Betriebsfeier bei Nordstern", text: () => "Die Einladung zur Betriebsfeier liegt im Briefkasten. Herr Brandt hat die Sitzordnung als Pivot-Tabelle beigelegt.", lern: true,
    wahl: (s) => [{ t: "Im Party-Outfit hingehen", f: () => { E.anlass("party", 200); E.frage({ titel: "Betriebsfeier", kopf: "Lohnsteuer", intro: "Am Buffet fragt Frau Demir, ob Sie wissen, wie die Feier steuerlich behandelt wird.",
        q: "Bis zu welchem Betrag je Arbeitnehmerin oder Arbeitnehmer bleibt eine Betriebsveranstaltung steuerfrei?", o: ["Bis 110 € als Freibetrag, für höchstens zwei Feiern im Jahr", "Unbegrenzt, Feiern sind immer steuerfrei", "Bis 5 €, alles darüber ist Arbeitslohn", "Bis 1.000 € je Feier"], c: 0,
        e: "Für Betriebsveranstaltungen gilt ein Freibetrag von 110 € je teilnehmender Person, für bis zu zwei Veranstaltungen im Jahr. Was darüber hinausgeht, ist steuerpflichtiger Arbeitslohn." },
        (ok) => { E.bed("sozial", 45); E.bed("spass", 35); E.bed("energie", -10); E.skill("charisma", ok ? 1 : 0.5); E.zeit(180); E.marker("Feierlaune", 7, 480); E.chronik(s.name + " feiert auf der Betriebsfeier von Nordstern."); E.ende("Betriebsfeier", "Herr Brandt tanzt im Sakko von 1998. Paula Probezeit filmt, 7 Likes. Soziales und Spaß steigen."); }); } },
      { t: "Absagen und früh schlafen", f: () => { E.bed("energie", 10); return "Ruhe ist auch etwas Schönes. Am nächsten Tag erzählen alle vom Buffet."; } }] },
  { id: "brandt_excel", titel: "Herr Brandt vor der Tür", text: () => "Herr Brandt steht mit einem Laptop vor der Tür. „Nur ganz kurz“, sagt er, „meine Excel-Liste hat ein Problem.“ Er trägt sein Sakko von 1998.", lern: true,
    wahl: () => [{ t: "Helfen und die Liste sortieren", f: () => E.sortier({ titel: "Herrn Brandts Excel-Liste", intro: "In Zeile 4.711 steht ein Eintrag ohne Kategorie. Wohin gehört er?", lob: ["Herr Brandt speichert die Datei als Liste_final_final3.xlsx."], tadel: ["Herr Brandt lacht. „So ging es mir 1998 auch.“"],
        fertig: (ok) => { E.karriere(ok ? 2 : 1); E.bed("sozial", 15); E.ende("Excel gerettet", ok ? "Herr Brandt erzählt es morgen Frau Demir. Plus 2 Karrierepunkte." : "Die Liste ist fast gerettet. Herr Brandt bedankt sich trotzdem. Plus 1 Karrierepunkt."); } }) },
      { t: "Auf die Ruhezeit hinweisen", f: () => { E.bed("energie", 5); return "„Nach Feierabend gilt die Ruhezeit“, sagen Sie freundlich. Herr Brandt nickt und schreibt das in eine neue Excel-Liste."; } }] },
  { id: "stromausfall", titel: "Stromausfall", text: (s) => `Plötzlich ist es dunkel. Der Kühlschrank verstummt, der Fernseher auch. Im ganzen Viertel brennt nur noch die Kerze von ${s.name}.`, lern: true,
    wahl: (s) => [{ t: "Kerzen anzünden und gemütlich machen", f: () => { E.bed("spass", 20); E.bed("sozial", s.partner ? 20 : 5); E.bed("energie", 8); E.marker("Kerzenschein", 4, 240); return s.partner ? `${E.vn()} und ${s.name} spielen ein Brettspiel. Nach einer Stunde ist der Strom wieder da, das Spiel noch nicht vorbei.` : "Bei Kerzenschein ist es erstaunlich gemütlich. Nach einer Stunde ist der Strom zurück."; } },
      { t: "Im Kerzenlicht einen Fachbegriff lernen", f: () => E.lernen({ titel: "Lernen bei Kerzenschein", intro: "Ohne Strom keine Ablenkung. Perfekt für einen Fachbegriff.", fertig: (ok) => { C.lernFertig(ok); E.ende("Stromausfall", "Der Strom ist zurück und Sie sind ein Stück schlauer."); } }) }] },
  { id: "paula_collab", titel: "Paula Probezeit will ein Collab", text: () => "Paula Probezeit, Influencerin mit 12 Followern, schreibt. „Collab? Wir erklären zusammen ein Thema aus dem Personalwesen. Das geht viral, ganz sicher.“", lern: true,
    wahl: (s) => [{ t: "Mitmachen", f: () => E.frage({ titel: "Video mit Paula Probezeit", kopf: "Probezeit", intro: "Paula drückt auf Aufnahme. „Erklär mal, wie lange eine Probezeit höchstens dauern darf.“",
        q: "Wie lange darf eine Probezeit im Arbeitsverhältnis höchstens dauern, damit die verkürzte Kündigungsfrist gilt?", o: ["Sechs Monate, dann gilt eine Frist von zwei Wochen", "Zwei Jahre", "Vier Wochen", "Es gibt keine Höchstdauer"], c: 0,
        e: "Nach § 622 Absatz 3 BGB kann während einer vereinbarten Probezeit von längstens sechs Monaten mit einer Frist von zwei Wochen gekündigt werden. In der Berufsausbildung gilt eine eigene Probezeit von einem bis vier Monaten." },
        (ok) => { E.skill("charisma", ok ? 1 : 0.5); E.bed("spass", 20); E.marker(ok ? "Viral gegangen" : "Fast viral", ok ? 6 : 2, 480); E.chronik(s.name + " dreht ein Erklärvideo mit Paula Probezeit."); E.ende("Das Video ist online", ok ? "Das Video bekommt 31 Likes. Paula hat jetzt 14 Follower und nennt Sie ihre Mentorin." : "Das Video bekommt 3 Likes. Paula sagt, der Algorithmus brauche noch Zeit."); }) },
      { t: "Lieber nicht", f: () => "Paula versteht das. Sie dreht stattdessen ein Video über ihr Frühstück, 2 Likes." }] },
  { id: "talentshow", titel: "Talent-Show im Gemeindehaus", text: () => "Im Gemeindehaus ist Talent-Show. Der Betriebsrat jongliert mit Betriebsvereinbarungen. Gleich ist die nächste Nummer dran.", lern: true,
    wahl: (s) => [{ t: "Einen Fachbegriffe-Rap vortragen", f: () => E.lernen({ titel: "Fachbegriffe-Rap", intro: "Lernen Sie den Begriff, dann rappen Sie den Kurzcheck vor Publikum.", fertig: (ok) => { C.lernFertig(ok); if (ok) { E.geld(100); E.skill("charisma", 1.5); E.marker("Bühnenstar", 7, 600); E.chronik(s.name + " gewinnt die Talent-Show im Gemeindehaus."); E.ende("Talent-Show", "Standing Ovations! Platz 1 und 100 € Preisgeld. Frau Demir pfeift auf zwei Fingern."); } else { E.skill("charisma", 0.5); E.ende("Talent-Show", "Platz 3. Der Betriebsrat gewinnt mit dem Jonglieren. Applaus gibt es trotzdem."); } } }) },
      { t: "Lieber im Publikum sitzen", f: () => { E.bed("spass", 25); return "Sie sehen eine Pantomime zum Thema Kündigungsschutz. Sehr eindrucksvoll."; } }] },
  { id: "zeugnis_kind", titel: "Zeugnistag", bed: (s) => E.kinderGross().length > 0, lern: true,
    text: (s) => `${E.kinderGross()[0].name} kommt mit dem Zeugnis nach Hause. Unter den Noten steht ein Satz in seltsamer Sprache.`,
    wahl: (s) => { const k = E.kinderGross()[0]; return [{ t: "Gemeinsam die Zeugnissprache entschlüsseln", f: () => E.frage({ titel: "Zeugnissprache", kopf: "Arbeitszeugnis", intro: `${k.name} fragt, ob Schulzeugnisse wie Arbeitszeugnisse funktionieren. Fast. Also üben Sie die Zeugnissprache.`,
        q: "Was bedeutet im Arbeitszeugnis die Formulierung „stets zu unserer vollsten Zufriedenheit“?", o: ["Sehr gute Leistung", "Ausreichende Leistung", "Mangelhafte Leistung", "Keine Aussage zur Leistung"], c: 0,
        e: "Arbeitszeugnisse müssen wahr und wohlwollend formuliert sein. Deshalb hat sich eine Notenskala in Sätzen entwickelt. „Stets zu unserer vollsten Zufriedenheit“ steht für sehr gut, „zu unserer Zufriedenheit“ eher für befriedigend." },
        (ok) => { E.bed("sozial", 25); E.marker("Stolze Familie", 5, 480); E.chronik(k.name + " bringt ein gutes Zeugnis nach Hause."); E.ende("Zeugnistag", ok ? `${k.name} ist begeistert und will später in die Personalabteilung.` : `${k.name} lacht und erklärt es Ihnen nochmal. Familie ist Teamarbeit.`); }) },
      { t: "Loben und Eis essen gehen, 12 €", f: () => { E.geld(-12); E.bed("sozial", 30); E.bed("spass", 20); return `${k.name} isst drei Kugeln. Lob ist eben ein Motivator, sagt Herzberg.`; } }]; } },
  { id: "geschenk_partner", titel: "Eine Überraschung", bed: (s) => s.partner && s.partner.bez >= 30,
    text: (s) => `${E.vn()} kommt mit einem Paket hinter dem Rücken ins Zimmer. „Mach auf, ich habe extra auf die Größe geachtet.“`,
    wahl: (s) => [{ t: "Auspacken", f: () => { const t = KL.schenke(70); E.bez(5); E.bed("spass", 20); E.marker("Beschenkt", 6, 480); E.chronik(E.vn() + " schenkt " + s.name + (t ? " " + t.name : " Blumen") + ".");
        return t ? `Darin liegt ${t.name}. Das Teil hängt jetzt im Kleiderschrank. Beziehung plus 5.` : "Darin liegt ein Strauß Blumen, weil der Kleiderschrank schon alles hat. Beziehung plus 5."; } }] },
  { id: "konkurrenz", titel: "Jobangebot der Konkurrenz", bed: (s) => s.stufe >= 1, lern: true,
    text: (s) => `Die Personalabteilung der Möwe Maschinenbau AG ruft an. Man habe von ${s.name} gehört und biete mehr Gehalt. Frau Demir hat das irgendwie mitbekommen.`,
    wahl: (s) => [{ t: "Mit Frau Demir über das Gehalt verhandeln", f: () => C.frageRunde({ titel: "Gehaltsverhandlung", intro: "Frau Demir hört zu. Überzeugen Sie mit Fachwissen. Charisma hilft auch.", anzahl: 2, ende: "Ergebnis",
        fertig: (r) => { const bonus = r + (stufe("charisma") >= 3 ? 1 : 0); if (bonus >= 2) { E.karriere(3); E.geld(150); E.marker("Wertgeschätzt", 6, 720); E.chronik(s.name + " verhandelt erfolgreich mit Frau Demir."); E.ende("Gehaltsverhandlung", "Frau Demir legt eine Sonderzahlung von 150 € und 3 Karrierepunkte drauf. Herr Brandt trägt es in seine Liste ein."); } else { E.karriere(1); E.ende("Gehaltsverhandlung", "Frau Demir verspricht, im nächsten Mitarbeitergespräch darüber zu reden. Plus 1 Karrierepunkt."); } E.skill("charisma", 0.5); } }) },
      { t: "Ablehnen, Nordstern bleibt die Nummer eins", f: () => { E.marker("Loyal", 3, 480); return "Frau Demir erfährt davon und schenkt Ihnen eine Tasse mit dem Firmenlogo. Treue zahlt sich aus, irgendwann."; } }] },
  { id: "hochzeitstag", titel: "Hochzeitstag", bed: (s) => s.partner && s.partner.verheiratet,
    text: (s) => `Heute ist Hochzeitstag! ${E.vn()} lächelt schon den ganzen Morgen verdächtig.`,
    wahl: (s) => [{ t: "Schick essen gehen, 80 €", f: () => { E.geld(-80); E.anlass("party", 180); E.bez(8); E.bed("spass", 35); E.bed("hunger", 60); E.marker("Verliebt wie am ersten Tag", 7, 720); E.chronik(s.name + " und " + E.vn() + " feiern Hochzeitstag."); return "Kerzen, Pasta und ein Kellner, der früher im Betriebsrat war. Beziehung plus 8."; } },
      { t: "Selbst ein Menü kochen", f: () => { const k = stufe("kochen"); E.bez(4 + k); E.bed("hunger", 70); E.skill("kochen", 0.5); E.chronik(s.name + " kocht zum Hochzeitstag."); return k >= 3 ? `Das Menü gelingt wie im Sternerestaurant. Beziehung plus ${4 + k}.` : `Die Soße brennt etwas an, aber ${E.vn()} findet es süß. Beziehung plus ${4 + k}.`; } }] },
  { id: "kindergeburtstag", titel: "Kindergeburtstag", bed: (s) => E.kinderGross().length > 0,
    text: (s) => `${pick(E.kinderGross()).name} hat Geburtstag und hat die halbe Schulklasse eingeladen.`,
    wahl: (s) => [{ t: "Eine Party ausrichten, 60 €", f: () => { E.geld(-60); E.anlass("party", 180); E.bed("sozial", 40); E.bed("energie", -15); E.bed("spass", 30); E.chronik("Große Geburtstagsparty mit Topfschlagen und Organigramm-Torte."); return "Topfschlagen, Schatzsuche und eine Torte in Form eines Organigramms. Alle sind glücklich und erschöpft."; } },
      { t: "Selbst eine Torte backen", f: () => { E.skill("kochen", 1); E.bed("sozial", 30); return "Die Torte ist schief, aber mit Liebe gebacken. Kochen steigt."; } }] },
  { id: "flohmarkt", titel: "Flohmarkt im Viertel", text: () => "Auf dem Parkplatz ist Flohmarkt. Herr Brandt verkauft Ordner aus den Jahren 1998 bis 2004.",
    wahl: (s) => [{ t: "Alte Sachen verkaufen", f: () => { const n = 40 + Math.floor(Math.random() * 50); E.geld(n); E.bed("sozial", 15); return `Sie verkaufen einen alten Toaster und drei Krimis für ${n} €.`; } },
      { t: "Stöbern, 15 €", f: () => { if (s.geld < 15) return "Leider ist das Portemonnaie leer. Stöbern macht aber auch so Spaß."; E.geld(-15); const t = KL.schenke(45); E.bed("spass", 15); return t ? `Ein echter Fund, ${t.name} für 15 €. Ab in den Kleiderschrank.` : "Sie finden eine Vase mit dem Aufdruck Mitarbeiter des Monats 2003."; } }] },
  { id: "lotto", titel: "Kleiner Lottogewinn", text: () => "Das Los vom Kiosk hat drei Richtige! 50 € gewonnen.", lern: true,
    wahl: () => [{ t: "Freuen und die Steuerfrage klären", f: () => E.frage({ titel: "Lottogewinn", kopf: "Steuerwissen", q: "Muss man auf einen Lottogewinn in Deutschland Einkommensteuer zahlen?", o: ["Nein, Lotteriegewinne gehören nicht zu den steuerpflichtigen Einkunftsarten", "Ja, immer 42 Prozent", "Ja, aber nur am Wochenende", "Nur, wenn der Gewinn über 10 € liegt"], c: 0,
        e: "Lotteriegewinne sind in Deutschland grundsätzlich einkommensteuerfrei, weil sie zu keiner der sieben Einkunftsarten gehören. Steuerpflichtig können aber zum Beispiel Zinsen sein, die der Gewinn später auf dem Konto bringt." },
        (ok) => { E.geld(50); E.marker("Glückspilz", 4, 360); E.ende("Lottogewinn", "50 € landen auf dem Konto. Herr Brandt möchte ab jetzt eine Tippgemeinschaft gründen, natürlich mit Excel-Liste."); }) }] },
  { id: "geldbeutel", titel: "Ein Geldbeutel auf dem Gehweg", text: () => "Auf dem Gehweg liegt ein Geldbeutel. Darin ein Ausweis, 40 € und ein Bild von einem Ficus.",
    wahl: (s) => [{ t: "Ehrlich zurückgeben", f: () => { E.geld(5); E.skill("charisma", 1); E.marker("Ehrlich währt am längsten", 5, 600); E.chronik(s.name + " bringt einen gefundenen Geldbeutel zurück."); return "Der Besitzer ist überglücklich und gibt Ihnen 5 € Finderlohn. Nach dem BGB stehen Findern übrigens bis 500 € Wert 5 Prozent zu."; } },
      { t: "Zum Fundbüro bringen", f: () => { E.skill("charisma", 0.5); E.marker("Ehrlich währt am längsten", 4, 480); return "Das Fundbüro bedankt sich. Der Besitzer meldet sich am Abend und schickt einen Gruß samt Ficus-Foto."; } }] },
  { id: "steuererklaerung", titel: "Die Steuererklärung ruft", text: () => "Auf dem Schreibtisch liegt ein Stapel Belege. Die Steuererklärung will gemacht werden, Kaffee steht bereit.", lern: true,
    wahl: () => [{ t: "Belege sortieren", f: () => E.sortier({ titel: "Steuererklärung", intro: "Zum Aufwärmen ordnen Sie einen Fall zum Tagesthema richtig zu. Dann geht es an die Belege.",
        fertig: (ok) => { E.geld(ok ? 180 : 70); E.zeit(90, { spass: -6 }); E.marker("Steuer erledigt", 5, 720); E.ende("Steuererklärung", ok ? "Alles sauber sortiert. Die Erstattung beträgt 180 €." : "Ein paar Belege fehlen, die Erstattung beträgt trotzdem 70 €."); } }) },
      { t: "Auf morgen verschieben", f: () => { E.marker("Belege im Nacken", -3, 360); return "Der Stapel schaut Sie vorwurfsvoll an."; } }] },
  { id: "bewerbung_freund", titel: "Bewerbung eines Freundes", text: () => "Ein alter Schulfreund schickt seine Bewerbung. „Kannst du mal drüberschauen? Du bist doch vom Fach.“", lern: true,
    wahl: (s) => [{ t: "Bewerbung prüfen", f: () => E.frage({ titel: "Bewerbung prüfen", kopf: "Bewerbung", intro: "Der Freund fragt, ob ein Bewerbungsfoto in Deutschland Pflicht ist.",
        q: "Muss einer Bewerbung in Deutschland ein Foto beiliegen?", o: ["Nein, ein Foto ist freiwillig", "Ja, ohne Foto ist die Bewerbung ungültig", "Ja, aber nur ein Passfoto vom Amt", "Nur bei Bewerbungen in der Personalabteilung"], c: 0,
        e: "Ein Bewerbungsfoto ist freiwillig. Wegen des Allgemeinen Gleichbehandlungsgesetzes verlangen viele Unternehmen bewusst kein Foto, damit Aussehen, Alter oder Herkunft bei der Auswahl keine Rolle spielen." },
        (ok) => { E.bed("sozial", 20); E.skill("charisma", 0.5); E.chronik(s.name + " hilft einem Freund bei der Bewerbung."); E.ende("Bewerbung geprüft", ok ? "Der Freund schickt die Bewerbung ab und wird zum Gespräch eingeladen. Er schickt ein Dankes-Emoji, das hier leider nicht angezeigt werden kann." : "Gemeinsam lesen Sie nach. Der Freund ist trotzdem dankbar."); }) }] },
  { id: "schwiegereltern", titel: "Spontanbesuch", bed: (s) => s.partner && s.partner.verheiratet, lern: true,
    text: (s) => `Es klingelt. Die Eltern von ${E.vn()} stehen vor der Tür. „Wir waren zufällig in der Gegend“, sagt der Schwiegervater, der 40 Kilometer entfernt wohnt.`,
    wahl: (s) => [{ t: "Kaffee kochen und plaudern", f: () => E.tagesfrage({ titel: "Kaffee mit den Schwiegereltern", intro: "Der Schwiegervater war früher Personalleiter und testet Sie mit einer Frage.",
        fertig: (r) => { E.bed("sozial", 35); E.bez(r ? 6 : 2); E.ende("Spontanbesuch", r ? "Der Schwiegervater ist beeindruckt und erzählt es der ganzen Verwandtschaft." : "Der Schwiegervater erklärt es ausführlich, mit Anekdoten aus dem Jahr 1987."); } }) },
      { t: "Schnell aufräumen und Kuchen servieren", f: () => { E.bed("hygiene", 10); E.bed("energie", -10); E.bez(3); E.skill("kochen", 0.5); return "In fünf Minuten ist alles blitzblank. Die Schwiegermutter findet trotzdem den einen Krümel."; } }] },
  { id: "ballon", titel: "Ein Gutschein für eine Ballonfahrt", text: () => "Im Briefkasten steckt ein Gutschein für eine Heißluftballonfahrt. Absender ist der Kundenservice der Stadtwerke, als Dank für die pünktliche Zahlung.",
    wahl: (s) => [{ t: "Einlösen und abheben", f: () => { E.zeit(180, { energie: -2 }); E.bed("spass", 60); E.marker("Über den Wolken", 8, 720); E.chronik(s.name + " schwebt im Heißluftballon über Nordstern City."); return "Von oben sieht man sogar das Büro von Herrn Brandt. Er winkt mit einer ausgedruckten Excel-Liste."; } },
      ...(s.partner ? [{ t: "Den Gutschein " + E.vn() + " schenken", f: () => { E.bez(10); E.marker("Großzügig", 4, 480); return E.vn() + " ist gerührt. Beziehung plus 10."; } }] : [])] },
  { id: "ficus_erbe", titel: "Ein Erbe von Tante Hildegard", text: () => "Ein Notar ruft an. Tante Hildegard hat Ihnen etwas vermacht. Es ist ein Ficus. Er heißt Herzberg der Zweite.",
    wahl: (s) => [{ t: "Das Erbe antreten", f: () => { if (!s.gekauft.includes("pflanze")) { s.gekauft.push("pflanze"); C.stelleAuf("pflanze", true); E.chronik("Ficus Herzberg zieht als Erbe von Tante Hildegard ein."); return "Der Ficus steht jetzt im Wohnzimmer. Er sieht zufrieden aus, oder zumindest nicht unzufrieden."; }
        E.geld(60); return "Ein zweiter Ficus wäre zu viel des Guten. Sie verschenken ihn an Frau Demir, die Ihnen 60 € für den Topf aufdrängt."; } }] },
  { id: "datenschutz", titel: "Falscher Brief im Briefkasten", text: () => "Im Briefkasten liegt ein Umschlag mit der Aufschrift Personalakte, vertraulich. Er ist an den Nachbarn adressiert.", lern: true,
    wahl: () => [{ t: "Überlegen, was zu tun ist", f: () => E.frage({ titel: "Datenschutzpanne", kopf: "Datenschutz", q: "Was ist mit dem fremden Brief zu tun?",
        o: ["Ungeöffnet an den Nachbarn weitergeben oder an den Absender zurückschicken", "Öffnen und nachsehen, ob es wichtig ist", "Den Inhalt im Treppenhaus aushängen", "Paula Probezeit für ein Video geben"], c: 0,
        e: "Fremde Briefe dürfen nicht geöffnet werden, das schützt das Briefgeheimnis. Personalunterlagen enthalten besonders schützenswerte Daten, die nach der Datenschutz-Grundverordnung nur Befugte sehen dürfen. Der Brief geht also ungeöffnet weiter." },
        (ok) => { E.skill("charisma", 0.5); E.marker("Vertrauenswürdig", 4, 480); E.ende("Datenschutz gewahrt", ok ? "Der Nachbar bedankt sich und bringt am Abend Plätzchen vorbei." : "Zum Glück haben Sie den Brief nicht geöffnet. Der Nachbar bedankt sich."); }) }] },
  { id: "betriebsratswahl", titel: "Betriebsratswahl bei Nordstern", text: () => "Bei Nordstern wird der Betriebsrat gewählt. Robin aus der Nachbarschaft verteilt Flyer und Kekse.", lern: true,
    wahl: () => [{ t: "Wählen gehen und vorher nachlesen", f: () => E.frage({ titel: "Betriebsratswahl", kopf: "Mitbestimmung", q: "Ab welcher Betriebsgröße kann ein Betriebsrat gewählt werden?",
        o: ["In Betrieben mit in der Regel mindestens fünf ständigen wahlberechtigten Beschäftigten, von denen drei wählbar sind", "Erst ab 500 Beschäftigten", "Nur in Unternehmen mit Börsengang", "Ab zwei Beschäftigten, wenn die Chefin zustimmt"], c: 0,
        e: "Nach § 1 Betriebsverfassungsgesetz werden Betriebsräte in Betrieben mit in der Regel mindestens fünf ständigen wahlberechtigten Arbeitnehmerinnen und Arbeitnehmern gewählt, von denen drei wählbar sind." },
        (ok) => { E.bed("sozial", 15); E.karriere(1); E.ende("Gewählt", "Ihre Stimme ist abgegeben. Die Kekse von Robin waren übrigens ausgezeichnet."); }) }] },
  { id: "demir_kaffee", titel: "Kaffee mit Frau Demir", text: () => "Frau Demir aus der Personalleitung lädt in der Mittagspause auf einen Kaffee ein. Sie hat ein Fachbuch dabei.", lern: true,
    wahl: () => [{ t: "Gerne, und dabei etwas lernen", f: () => E.lernen({ titel: "Kaffee mit Frau Demir", intro: "Frau Demir erklärt einen Begriff aus ihrem Lieblingskapitel.", fertig: (ok) => { C.lernFertig(ok); E.bed("sozial", 20); if (ok) E.karriere(1); E.ende("Kaffeepause", ok ? "Frau Demir notiert sich Ihr Interesse für das nächste Mitarbeitergespräch. Plus 1 Karrierepunkt." : "Frau Demir lächelt und leiht Ihnen das Buch aus."); } }) },
      { t: "Dankend ablehnen", f: () => "Frau Demir trinkt den Kaffee allein und liest weiter im Arbeitsrecht. Sie wirkt dabei sehr glücklich." }] },
  { id: "regen", titel: "Platzregen", text: (s) => `Auf dem Heimweg öffnet der Himmel alle Schleusen. ${s.name} hat natürlich keinen Schirm dabei.`,
    wahl: (s) => [{ t: "Im Regen tanzen", f: () => { E.bed("hygiene", -15); E.bed("spass", 25); E.marker("Regentänzer", 4, 240); return "Die Nachbarschaft applaudiert vom Balkon. Paula Probezeit filmt natürlich."; } },
      { t: "Schnell nach Hause rennen", f: () => { E.bed("hygiene", -10); E.bed("energie", -5); return "Nass bis auf die Socken, aber schnell zu Hause. Zeit für eine heiße Dusche."; } }] },
  { id: "paket_nachbar", titel: "Ein Paket für den Nachbarn", text: () => "Der Paketdienst drückt Ihnen ein Paket für den Nachbarn in die Hand. Es ist schwer und klappert verdächtig nach Ordnern.",
    wahl: () => [{ t: "Rüberbringen", f: () => { E.bed("sozial", 20); E.marker("Gute Nachbarschaft", 3, 360); return "Der Nachbar freut sich. Im Paket ist eine neue Kaffeemaschine für das Personalbüro."; } },
      { t: "Auf den Abend warten", f: () => { E.bed("energie", 5); return "Am Abend holt der Nachbar das Paket ab und bringt zum Dank Kekse mit."; } }] },
  { id: "fortbildung", titel: "Gutschein für eine Fortbildung", bed: (s) => s.stufe >= 1, text: () => "Frau Demir verteilt Gutscheine für eine kostenlose Fortbildung. „Lebenslanges Lernen“, sagt sie und zwinkert.", lern: true,
    wahl: (s) => [{ t: "Fortbildung besuchen", f: () => E.lernen({ titel: "Fortbildung", intro: "Ein halber Tag Seminar mit Kaffee und Keksen. Lesen Sie den Begriff, dann folgt der Test.", fertig: (ok) => { C.lernFertig(ok); E.zeit(120, { spass: -3 }); if (ok) { E.karriere(2); E.chronik(s.name + " schließt eine Fortbildung ab."); } E.ende("Fortbildung", ok ? "Zertifikat bestanden. Plus 2 Karrierepunkte." : "Teilnahmebescheinigung gibt es trotzdem. Beim nächsten Mal klappt der Test."); } }) },
      { t: "An eine Kollegin weitergeben", f: () => { E.skill("charisma", 0.5); return "Die Kollegin freut sich riesig. Teamgeist zählt auch."; } }] },
  { id: "ueberstunden", titel: "Überstunden?", bed: (s) => s.stufe >= 1, lern: true, text: () => "Herr Brandt fragt, ob Sie heute zwölf Stunden arbeiten könnten. Das Quartal muss abgeschlossen werden.",
    wahl: () => [{ t: "Kurz nachdenken und das Arbeitszeitgesetz prüfen", f: () => E.frage({ titel: "Arbeitszeit", kopf: "Arbeitszeitgesetz", q: "Wie lange darf die werktägliche Arbeitszeit nach dem Arbeitszeitgesetz höchstens dauern?",
        o: ["Acht Stunden, mit Ausgleich auf bis zu zehn Stunden verlängerbar", "Zwölf Stunden ohne Grenze", "Sechs Stunden, mehr ist verboten", "So lange, wie die Excel-Liste es verlangt"], c: 0,
        e: "Nach § 3 Arbeitszeitgesetz darf die werktägliche Arbeitszeit acht Stunden nicht überschreiten. Sie kann auf bis zu zehn Stunden verlängert werden, wenn innerhalb von sechs Monaten im Durchschnitt acht Stunden nicht überschritten werden. Danach gilt eine Ruhezeit von elf Stunden." },
        (ok) => { E.karriere(ok ? 2 : 1); E.marker("Gut informiert", 3, 360); E.ende("Arbeitszeit", ok ? "Sie erklären es Herrn Brandt freundlich. Er plant jetzt mit zehn Stunden und einem Ausgleich. Plus 2 Karrierepunkte." : "Frau Demir schaltet sich ein und erklärt die Regeln. Plus 1 Karrierepunkt."); }) }] },
  { id: "sonnentag", titel: "Ein perfekter Sonnentag", bed: () => C.stunde() >= 9 && C.stunde() <= 18, text: () => "Die Sonne scheint, die Vögel singen und sogar der Ficus scheint zu lächeln.",
    wahl: (s) => [{ t: "Ein Picknick im Garten", f: () => { E.bed("spass", 30); E.bed("hunger", 30); E.bed("sozial", s.partner ? 25 : 5); E.marker("Sonnig gelaunt", 6, 480); return "Butterbrote, Limonade und eine Ameise, die sich für Mitbestimmung interessiert."; } },
      { t: "Drinnen bleiben und lernen", f: () => E.lernen({ titel: "Lernen an einem Sonnentag", intro: "Auch das ist eine Entscheidung. Hier ist ein Begriff.", fertig: (ok) => { C.lernFertig(ok); E.ende("Sonnentag", "Die Sonne scheint übrigens morgen auch."); } }) }] },
  /* Haustiere, nur wenn der andere Teil des Spiels Haustiere angelegt hat */
  { id: "tier_tierarzt", titel: "Besuch beim Tierarzt", bed: () => !!E.tier(), text: () => { const t = E.tier(); return `${t.name} niest seit heute Morgen. Vielleicht sollte die Tierärztin mal schauen.`; },
    wahl: () => { const t = E.tier(); return [{ t: "Zur Tierärztin, 40 €", f: () => { E.geld(-40); E.marker("Sorge um " + t.name, -2, 180); E.zeit(60); return `Nur eine kleine Erkältung. ${t.name} bekommt ein Leckerli und Sie eine Rechnung.`; } },
      { t: "Erst einmal beobachten", f: () => `${t.name} niest noch zweimal und schläft dann tief und fest. Alles gut.` }]; } },
  { id: "tier_trick", titel: "Ein neuer Trick", bed: () => !!E.tier(), text: () => `${E.tier().name} sitzt erwartungsvoll vor Ihnen. Heute wäre ein guter Tag für einen neuen Trick.`,
    wahl: () => { const t = E.tier(); return [{ t: "Pfötchen geben üben", f: () => { E.bed("spass", 30); E.marker("Stolz auf " + t.name, 5, 480); E.chronik(t.name + " lernt einen neuen Trick."); return `Nach zehn Versuchen klappt es. ${t.name} ist jetzt das klügste Tier in der Straße.`; } }]; } },
  { id: "tier_weg", titel: "Ausgebüxt", bed: () => !!E.tier(), text: () => `Die Gartentür stand offen und ${E.tier().name} ist weg!`,
    wahl: () => { const t = E.tier(); return [{ t: "Die Nachbarschaft fragen", f: () => { E.bed("sozial", 20); E.zeit(30); return `Herr Brandt hat ${t.name} gefunden. Natürlich hat er den Fundort in eine Excel-Liste eingetragen.`; } }]; } },
  /* Auto, nur wenn ein Auto vorhanden ist */
  { id: "auto_hu", titel: "Hauptuntersuchung fällig", bed: (s) => !!(s.auto && typeof s.auto === "object"), text: () => "Die Plakette am Kennzeichen erinnert freundlich daran, dass die Hauptuntersuchung fällig ist.",
    wahl: () => [{ t: "Termin in der Werkstatt, 90 €", f: () => { E.geld(-90); E.marker("Alles geprüft", 3, 360); return "Das Auto besteht ohne Mängel. Der Prüfer lobt sogar die sauberen Fußmatten."; } }] },
  { id: "auto_dienstwagen", titel: "Herr Brandt und der Dienstwagen", bed: (s) => !!(s.auto && typeof s.auto === "object"), lern: true, text: () => "Herr Brandt schwärmt vom neuen Dienstwagen der Geschäftsführung und fragt, wie das eigentlich versteuert wird.",
    wahl: () => [{ t: "Erklären", f: () => E.frage({ titel: "Dienstwagen", kopf: "Entgelt", q: "Wie wird die private Nutzung eines Dienstwagens mit Verbrennungsmotor pauschal versteuert?",
        o: ["Monatlich mit 1 Prozent des inländischen Bruttolistenpreises als geldwerter Vorteil", "Gar nicht, Dienstwagen sind steuerfrei", "Einmalig mit dem halben Kaufpreis", "Mit 10 € pro Tankfüllung"], c: 0,
        e: "Die private Nutzung eines Dienstwagens ist ein geldwerter Vorteil. Bei der Pauschalmethode werden monatlich 1 Prozent des inländischen Bruttolistenpreises angesetzt. Für Elektro- und Hybridfahrzeuge gelten unter Bedingungen geringere Sätze." },
        (ok) => { E.karriere(1); E.ende("Dienstwagen", ok ? "Herr Brandt ist beeindruckt und rechnet sofort nach, natürlich in Excel." : "Gemeinsam schauen Sie im Skript nach. Herr Brandt ist trotzdem dankbar."); }) }] }
];

/* ---------- Mini-Momente als kurze Meldungen ohne Dialog ---------- */
const MINI_BASIS = [
  { t: (s) => `Die Mutter von ${s.name} ruft an und fragt, ob ${s.name} genug isst.`, w: () => E.bed("sozial", 6) },
  { t: () => "Ein Paket kommt an. Darin ist ein Werbekugelschreiber der IHK.", w: () => E.bed("spass", 3) },
  { t: () => "Der Nachbar winkt über den Gartenzaun.", w: () => E.bed("sozial", 4) },
  { t: () => "Eine Amsel singt auf dem Briefkasten. Fast wie ein Klingelton.", w: () => E.bed("spass", 3) },
  { t: () => "Frau Demir schickt eine Nachricht mit einem Daumen nach oben. Wofür, bleibt offen.", w: () => E.bed("sozial", 3) },
  { t: () => "Herr Brandt hat eine neue Excel-Liste geteilt. Sie heißt Liste_der_Listen.xlsx.", w: () => {} },
  { t: () => "Paula Probezeit hat einen neuen Follower. Es ist ihre Oma.", w: () => E.bed("spass", 2) },
  { t: () => "Der Wetterbericht verspricht Sonne. Der Ficus hört genau zu.", w: () => {} },
  { t: (s) => `${s.name} findet 2 € in der Jackentasche.`, w: () => { C.s.geld += 2; } },
  { t: (s) => `${E.vn()} schickt ein Herz per Nachricht.`, bed: (s) => !!s.partner && s.partner.bez >= 40, w: () => { E.bed("sozial", 6); E.bez(1); } },
  { t: (s) => `${E.vn()} summt beim Aufräumen das Lied der Lohnsteuerklassen.`, bed: (s) => !!s.partner && s.partner.verheiratet, w: () => E.bed("spass", 3) },
  { t: (s) => `${pick(E.kinderGross()).name} malt ein Bild von der ganzen Familie. Der Ficus ist auch drauf.`, bed: () => E.kinderGross().length > 0, w: () => E.bed("sozial", 8) },
  { t: (s) => `${pick(E.kinderGross()).name} fragt, warum der Himmel blau ist. Gute Frage.`, bed: () => E.kinderGross().length > 0, w: () => E.bed("sozial", 4) },
  { t: () => { const t = E.tier(); return `${t.name} bringt stolz einen Stock nach Hause.`; }, bed: () => !!E.tier(), w: () => E.bed("spass", 5) },
  { t: () => { const t = E.tier(); return `${t.name} schläft zufrieden in der Sonne.`; }, bed: () => !!E.tier(), w: () => E.bed("spass", 3) },
  { t: (s) => `Stammkundschaft lobt den Laden ${s.laden.name} im Internet.`, bed: (s) => !!s.laden, w: () => { C.s.laden.kasse += 15; } },
  { t: () => "Ein Flugzeug zieht ein Banner über die Stadt. Darauf steht Bitte Zeiterfassung nicht vergessen.", w: () => {} },
  { t: (s) => `${s.name} niest. Gesundheit! Das war nur der Staub auf dem Fachbuch.`, w: () => {} }
];

/* ---------- Engine ---------- */
export function erlaubt() {
  const s = C.s, ich = C.ich; if (!s || !ich) return false;
  if (C.dialogOffen || !ich.f.g.visible || ich.liegt || (ich.aktiv && ich.aktiv.schnell)) return false;
  const h = C.stunde(); if (h < 7 || h > 22.5) return false;
  try { if (window.NL_WELT && typeof window.NL_WELT.beschaeftigt === "function" && window.NL_WELT.beschaeftigt()) return false; } catch (e) {}
  return true;
}
export function tick(min) {
  const s = C.s; if (!s || !s.ereignis) return;
  if (Math.random() < 0.2) markerZeigen();
  if (!erlaubt()) return;
  const ev = s.ereignis;
  if (s.zeit - ev.miniZeit > 45 && Math.random() < 1 - Math.pow(1 - 1 / 70, min)) {
    ev.miniZeit = s.zeit;
    const k = MINI.filter((x) => { try { return !x.bed || x.bed(s); } catch (e) { return false; } });
    if (k.length) { const x = pick(k); try { C.ui.toast(x.t(s)); x.w(s); } catch (e) {} }
  }
  if (s.zeit - ev.letzteZeit > 180 && Math.random() < 1 - Math.pow(1 - 1 / 150, min)) starte();
}
export function kandidaten() {
  const s = C.s; return LISTE.filter((e) => { try { return !e.bed || e.bed(s); } catch (x) { return false; } });
}
export function starte(id) {
  const s = C.s; if (!s) return false;
  let e = id ? LISTE.find((x) => x.id === id) : null;
  if (id && !e) return false;
  if (e && !e.nurGezielt && e.bed) { try { if (!e.bed(s)) return false; } catch (x) { return false; } }
  if (!e) {
    const k = kandidaten(); if (!k.length) return false;
    const gew = k.map((x) => { const r = s.ereignis.erlebt[x.id]; const frisch = r && s.zeit - r.t < 2880; return (x.gewicht || 1) * (frisch ? 0.1 : r ? 0.6 : 1.4); });
    let z = Math.random() * gew.reduce((a, b) => a + b, 0), i = 0; while (z > gew[i] && i < k.length - 1) { z -= gew[i]; i++; }
    e = k[i];
  }
  s.ereignis.letzteZeit = s.zeit; s.ereignis.anzahl++;
  const r = s.ereignis.erlebt[e.id] || { n: 0, t: 0 }; r.n++; r.t = Math.round(s.zeit); s.ereignis.erlebt[e.id] = r;
  zeige(e); return true;
}
function zeige(e) {
  const s = C.s, esc = C.esc; const text = e.text(s, E), wahl = e.wahl(s, E);
  C.klang("ziel");
  const k = C.dialog(`<p class="dkopf">${esc(e.titel)}<span>Tag ${C.lebensTag()}, ${C.uhr()}</span></p><p class="er-art">${e.lern ? "Überraschung mit Lernfrage" : "Überraschung"}</p>
    <p class="er-text">${esc(text)}</p><div class="antworten">${wahl.map((w, i) => `<button class="antwort" type="button" data-i="${i}"><span class="bu">${BU[i]}</span><span>${esc(w.t)}</span></button>`).join("")}</div>`, "ereignis");
  k.querySelectorAll("[data-i]").forEach((b) => b.onclick = () => {
    const w = wahl[+b.dataset.i]; C.dialogZu(); C.klang("klick");
    chronik(e.titel + ". " + w.t + ".");
    const r = w.f();
    if (typeof r === "string") E.ende(e.titel, r);
    C.hud(); C.speichern(); C.pruefeZiele();
  });
}

/* ---------- Lebenschronik ---------- */
export function chronikZeigen() {
  const s = C.s, esc = C.esc;
  const tagUhr = (z) => { const m = Math.floor(z % 1440); return "Tag " + (Math.floor(z / 1440) + 1) + ", " + String(Math.floor(m / 60)).padStart(2, "0") + ":" + String(m % 60).padStart(2, "0"); };
  markerZeigen(); const aktiv = s.marker.filter((x) => x.bis > s.zeit);
  const extra = (window.__erwChronikExtra || []).map((f) => { try { return f(); } catch (e) { return ""; } }).join("");
  const k = C.dialog(`<p class="dkopf">Lebenschronik<span>${s.ereignis.anzahl} Erlebnisse</span></p>
    <div class="ch-kopf"><div class="ch-box"><b>Fertigkeiten</b>${Object.keys(SKILL_NAME).map((sk) => `<div class="ch-skill"><span>${SKILL_NAME[sk]}</span><i class="balken" style="--w:${(s.skills[sk] || 0) * 10}%"></i><small>Stufe ${Math.floor(s.skills[sk] || 0)}</small></div>`).join("")}</div>
      <div class="ch-box"><b>Stimmung</b><p>${esc(C.stimmungText(C.stimmung()))}, ${Math.round(C.stimmung())} von 100</p>${aktiv.length ? `<ul class="ch-marker">${aktiv.map((x) => `<li class="${x.w >= 0 ? "plus" : "minus"}">${esc(x.t)} ${x.w >= 0 ? "+" : ""}${x.w}</li>`).join("")}</ul>` : `<p class="hinweis">Gerade keine besonderen Stimmungen.</p>`}</div></div>
    ${extra}
    <h3 class="ch-titel">Tagebuch</h3>
    ${s.chronik.length ? `<ol class="chronik">${s.chronik.slice().reverse().map((c) => `<li><small>${tagUhr(c.z)}</small><span>${esc(c.t)}</span></li>`).join("")}</ol>` : `<p class="hinweis">Noch ist das Tagebuch leer. Das Leben wartet.</p>`}
    <div class="reihe"><button class="btn" type="button" id="chZu">Schließen</button></div>`, "breit");
  $("chZu").onclick = C.dialogZu;
  return k;
}

export function init(ctx) {
  C = ctx; registriere(BASIS); registriereMini(MINI_BASIS);
  /* Lebensziele aus Meldungen ins Tagebuch übernehmen */
  const t0 = C.ui.toast.bind(C.ui);
  C.ui.toast = (text, art) => { t0(text, art); if (art === "ziel") chronik(text); };
}
