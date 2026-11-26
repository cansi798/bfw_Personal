/* Nordstern Leben · Steuerung mit Tastatur (Pfeiltasten und WASD), Steuerkreuz und Pedalen auf dem Handy
   © 2026 Waybuild Akademie, Waybuild UG (haftungsbeschränkt). Alle Rechte vorbehalten. · www.waybuild.de */
import { K, IS_TOUCH } from "./bau.js";

export const EIN = { tasten: new Set(), touch: {}, zuletzt: 0, benutzt: false };
const BEWEGUNG = { arrowup: "hoch", w: "hoch", arrowdown: "runter", s: "runter", arrowleft: "links", a: "links", arrowright: "rechts", d: "rechts" };
const an = (r) => [...EIN.tasten].some((k) => BEWEGUNG[k] === r) || !!EIN.touch[r];
export function achse() { return { x: (an("rechts") ? 1 : 0) - (an("links") ? 1 : 0), y: (an("hoch") ? 1 : 0) - (an("runter") ? 1 : 0) }; }
export const richtungAktiv = () => { const a = achse(); return a.x !== 0 || a.y !== 0; };
const inEingabe = (el) => el && (el.tagName === "INPUT" || el.tagName === "TEXTAREA" || el.tagName === "SELECT" || el.isContentEditable);
const $ = (id) => document.getElementById(id);

export function initSteuerung(h) {
  addEventListener("keydown", (e) => {
    const c = K.ctx; if (!c || !c.s) return;
    if (c.dialogOffen || inEingabe(e.target)) { EIN.tasten.clear(); return; }
    const k = e.key.length === 1 ? e.key.toLowerCase() : e.key.toLowerCase();
    const menue = $("menue"), menueOffen = menue && !menue.hidden;
    if (menueOffen && (k === "arrowup" || k === "arrowdown")) {
      const kn = [...menue.querySelectorAll("button")]; if (!kn.length) return; e.preventDefault();
      let i = kn.indexOf(document.activeElement); i = k === "arrowdown" ? (i + 1) % kn.length : (i - 1 + kn.length) % kn.length; kn[i].focus(); return;
    }
    if (BEWEGUNG[k]) { if (e.ctrlKey || e.metaKey || e.altKey) return; EIN.tasten.add(k); EIN.zuletzt = performance.now(); EIN.benutzt = true; if (k.startsWith("arrow")) e.preventDefault(); if (menueOffen) c.menueZu(); if (h.bewegung) h.bewegung(); return; }
    if (k === "enter" && document.activeElement && /^(BUTTON|A|SELECT)$/.test(document.activeElement.tagName)) return;
    if (k === "e" || k === "enter") { e.preventDefault(); EIN.benutzt = true; h.e && h.e(); return; }
    if (k === "h") { h.hupe && h.hupe(); return; }
    if (k === "k") { h.kamera && h.kamera(); return; }
    if (k === "m") { h.karte && h.karte(); return; }
    if (k === "?" || k === "f1") { e.preventDefault(); hilfe(); return; }
  });
  addEventListener("keyup", (e) => { const k = e.key.length === 1 ? e.key.toLowerCase() : e.key.toLowerCase(); EIN.tasten.delete(k); if (k === "w") EIN.tasten.delete("w"); });
  addEventListener("blur", () => EIN.tasten.clear());
  /* Oberfläche */
  const rechts = document.querySelector("#hud .rechts"), ton = $("btnTon");
  const kn = (id, txt, label, cls) => { const b = document.createElement("button"); b.type = "button"; b.id = id; b.className = cls || "rund"; b.textContent = txt; b.setAttribute("aria-label", label); b.title = label; return b; };
  const karte = kn("btnKarte", "Karte", "Große Karte öffnen", "kn"); karte.onclick = () => h.karte && h.karte(); rechts.insertBefore(karte, ton);
  const hilfeKn = kn("btnHilfe", "?", "Tastatur und Steuerung"); hilfeKn.onclick = hilfe; rechts.insertBefore(hilfeKn, ton);
  const kam = document.querySelector("#hud .kamera");
  const haus = kn("btnHaus", "⌂", "Zum Haus"); haus.onclick = () => h.zumHaus && h.zumHaus();
  const stadt = kn("btnStadt", "▦", "Stadtansicht, herauszoomen"); stadt.onclick = () => h.stadt && h.stadt();
  const folgen = kn("btnFolgen", "◎", "Kamera folgt der Figur"); folgen.onclick = () => h.folgen && h.folgen(); folgen.setAttribute("aria-pressed", "true");
  kam.prepend(haus, stadt, folgen);
  if (IS_TOUCH) { const sk = kn("btnKreuz", "✥", "Steuerkreuz ein oder aus"); sk.onclick = () => { document.body.classList.toggle("kreuz-an"); sk.setAttribute("aria-pressed", String(document.body.classList.contains("kreuz-an"))); }; kam.prepend(sk); }
  /* Steuerkreuz */
  const d = document.createElement("div"); d.id = "steuerkreuz"; d.className = "steuerkreuz";
  d.innerHTML = `<button type="button" data-r="hoch" aria-label="Vorwärts">▲</button><button type="button" data-r="links" aria-label="Links">◀</button><button type="button" data-r="rechts" aria-label="Rechts">▶</button><button type="button" data-r="runter" aria-label="Zurück">▼</button>`;
  document.body.appendChild(d);
  const eKn = document.createElement("button"); eKn.type = "button"; eKn.id = "eKnopf"; eKn.className = "eknopf"; eKn.textContent = "E"; eKn.setAttribute("aria-label", "Aktion, wie Taste E"); eKn.onclick = () => h.e && h.e(); document.body.appendChild(eKn);
  /* Pedale im Fahrmodus */
  const p = document.createElement("div"); p.id = "pedale"; p.className = "pedale";
  p.innerHTML = `<div class="lenk"><button type="button" data-r="links" aria-label="Links lenken">◀</button><button type="button" data-r="rechts" aria-label="Rechts lenken">▶</button></div><div class="fuss"><button type="button" data-r="hoch" class="gas" aria-label="Gas">Gas</button><button type="button" data-r="runter" class="bremse" aria-label="Bremse">Bremse</button></div>`;
  document.body.appendChild(p);
  [d, p].forEach((el) => el.querySelectorAll("[data-r]").forEach((b) => {
    const r = b.dataset.r, los = (e) => { e.preventDefault(); EIN.touch[r] = false; b.classList.remove("an"); };
    b.addEventListener("pointerdown", (e) => { e.preventDefault(); try { b.setPointerCapture(e.pointerId); } catch (x) {} EIN.touch[r] = true; b.classList.add("an"); EIN.benutzt = true; if (h.bewegung) h.bewegung(); });
    ["pointerup", "pointercancel", "lostpointercapture"].forEach((ev) => b.addEventListener(ev, los));
  }));
  const hint = document.createElement("div"); hint.id = "eHinweis"; hint.className = "ehinweis"; hint.hidden = true; document.body.appendChild(hint);
}
export function eHinweis(text, x, y) {
  const el = $("eHinweis"); if (!el) return;
  if (!text) { el.hidden = true; return; }
  if (el.textContent !== text) el.textContent = text; el.hidden = false; el.style.left = Math.round(x) + "px"; el.style.top = Math.round(y) + "px";
}
export function hilfe() {
  const c = K.ctx; if (!c) return;
  c.info("Steuerung", `<table class="tastatur"><tbody>
    <tr><th>Pfeiltasten oder W A S D</th><td>Figur laufen lassen, im Auto Gas, Bremse und Lenken</td></tr>
    <tr><th>E oder Enter</th><td>Aktion am nächsten Objekt, an Personen und Orten. Im Auto aussteigen, am Auto einsteigen</td></tr>
    <tr><th>H</th><td>Hupen</td></tr><tr><th>K</th><td>Kamera im Auto wechseln, hinten oder von oben</td></tr>
    <tr><th>M</th><td>Große Karte mit Schnellreise</td></tr><tr><th>Leertaste</th><td>Pause</td></tr>
    <tr><th>1 bis 4</th><td>Antwort in Fragen wählen</td></tr><tr><th>Esc</th><td>Menü schließen</td></tr></tbody></table>
    <p class="hinweis">Auf dem Handy blenden Sie mit dem Knopf ✥ ein Steuerkreuz ein. Im Auto erscheinen Gas, Bremse und Lenktasten. Tippen auf den Boden lässt ${c.esc(c.s ? c.s.name : "die Figur")} dorthin laufen, auch durch die ganze Stadt.</p>`, [["Alles klar", null]]);
}
