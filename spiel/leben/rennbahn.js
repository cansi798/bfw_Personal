/* Nordstern Leben · Rennen auf dem Nordring mit Frage-Toren (Spuren A bis D)
   © 2026 Waybuild Akademie, Waybuild UG (haftungsbeschränkt). Alle Rechte vorbehalten. · www.waybuild.de */
import { THREE, K, etikett, zufall } from "./bau.js";
import { BAHN } from "./stadt.js";
import { baueAuto, animiereAuto } from "./fahrzeuge.js";
import { zufallsLook } from "./leute.js";
import { panel, sterneSetzen, sterneNachQuote } from "./kurier.js";

const { cx, cz, xa, xb, r, b } = BAHN, D = xb - xa, L = 2 * D + 2 * Math.PI * r, RUNDEN = 3;
const BU = ["A", "B", "C", "D"], FARBEN = ["#0f5c63", "#c9a227", "#7b2338", "#1f3557"];
/* Punkt auf der Strecke, lat positiv heißt links in Fahrtrichtung */
export function bahnPunkt(s, lat) {
  s = ((s % L) + L) % L; let x, z, h;
  if (s < D) { x = xa + s; z = cz + r; h = Math.PI / 2; }
  else if (s < D + Math.PI * r) { const f = (s - D) / r; x = xb + r * Math.sin(f); z = cz + r * Math.cos(f); h = Math.atan2(Math.cos(f), -Math.sin(f)); }
  else if (s < 2 * D + Math.PI * r) { x = xb - (s - D - Math.PI * r); z = cz - r; h = -Math.PI / 2; }
  else { const f = (s - 2 * D - Math.PI * r) / r; x = xa - r * Math.sin(f); z = cz - r * Math.cos(f); h = Math.atan2(-Math.cos(f), Math.sin(f)); }
  const fx = Math.sin(h), fz = Math.cos(h); lat = lat || 0; return { x: x + fz * lat, z: z - fx * lat, h };
}
export function bahnProj(x, z) {
  let s, lat;
  if (x >= xa && x <= xb) { if (z > cz) { s = x - xa; lat = -(z - (cz + r)); } else { s = D + Math.PI * r + (xb - x); lat = z - (cz - r); } }
  else if (x > xb) { const f = Math.atan2(x - xb, z - cz); s = D + r * f; lat = r - Math.hypot(x - xb, z - cz); }
  else { const f = Math.atan2(xa - x, cz - z); s = 2 * D + Math.PI * r + r * f; lat = r - Math.hypot(x - xa, z - cz); }
  return { s: ((s % L) + L) % L, lat };
}
export const RENN = { aktiv: null };
const START_S = 18, TOR_S = BAHN.tore.map((t) => bahnProj(t.x, t.z).s);
export function rennenStart(fahrzeug) {
  const c = K.ctx; if (RENN.aktiv) return;
  const namen = c.mischen((c.H.RIVALEN && c.H.RIVALEN.length ? c.H.RIVALEN : ["Herr Brandt im Dienstwagen", "Die Excel-Rakete", "Betriebsrats-Bolide", "Azubi Leon"]).slice()).slice(0, 4);
  const riv = namen.map((n, i) => { const g = baueAuto(c.pick(["mini", "stromer", "cabrio", "pickup", "van"]), c.pick(["#d0533c", "#f2c14e", "#6fb7e0", "#b07ad8", "#6fae5a", "#24323a"]), zufallsLook(c.pick(["frau", "mann"]))); K.scene.add(g);
    const e = etikett(n, { bg: "#24323a", fg: "#fffaf3" }); e.scale.set(2.8, 0.7, 1); e.position.y = 2.5; g.add(e);
    return { name: n, g, prog: -3 - (i % 2) * 6 - Math.floor(i / 2) * 2, lat: (i % 2 ? -3 : 3) * (i < 2 ? 1 : 0.5), v: 0, max: zufall(10.6, 12.6), boost: 0, slow: 0, fertig: null }; });
  const tore = []; for (let rd = 0; rd < RUNDEN; rd++) TOR_S.forEach((ts) => tore.push(((ts - START_S) + L) % L + rd * L)); tore.sort((p, q) => p - q);
  RENN.aktiv = { riv, tore, ti: 0, prog: 0, letzteS: START_S, zeit: 0, start: 3, liste: [], frage: null, fertig: false, platzFertig: 0 };
  const p = bahnPunkt(START_S, 0); fahrzeug(p.x, p.z, p.h);
  riv.forEach((rv) => { const q = bahnPunkt(START_S + rv.prog, rv.lat); rv.g.position.set(q.x, 0, q.z); rv.g.rotation.y = q.h; });
  frageZeigen();
}
function frageZeigen() {
  const c = K.ctx, R = RENN.aktiv; if (R.ti >= R.tore.length) { panel(`<p class="tkopf">Letzte Runde, ab ins Ziel!</p>`); return; }
  const q = c.naechsteFrage(), reihe = c.mischen([0, 1, 2, 3]); R.frage = { q, reihe };
  panel(`<p class="tkopf">Frage-Tor ${R.ti + 1} von ${R.tore.length} · Runde ${Math.min(RUNDEN, Math.floor(R.prog / L) + 1)} von ${RUNDEN}</p><p class="tfrage">${c.esc(q.q)}</p><ol class="topts">${reihe.map((oi, j) => `<li><b style="background:${FARBEN[j]}">${BU[j]}</b>${c.esc(q.o[oi])}</li>`).join("")}</ol><p class="tklein">Fahren Sie durch die Spur mit der richtigen Antwort. Richtig gibt Nitro, falsch bremst.</p>`);
}
export function rennUpdate(dt, t) {
  const R = RENN.aktiv; if (!R) return; const c = K.ctx, f = K.fahrt; if (!f) return;
  if (R.start > 0) { R.start -= dt; f.v = 0; const n = Math.ceil(R.start); if (n !== R.zaehl) { R.zaehl = n; c.ui.toast(n > 0 ? String(n) : "Los!", "gut"); c.klang(n > 0 ? "klick" : "richtig"); } return; }
  R.zeit += dt;
  const pp = bahnProj(f.mesh.position.x, f.mesh.position.z); let ds = pp.s - R.letzteS; if (ds > L / 2) ds -= L; if (ds < -L / 2) ds += L; R.prog += ds; R.letzteS = pp.s; f.abseits = Math.abs(pp.lat) > b / 2 + 0.8;
  /* Frage-Tor */
  if (!R.fertig && R.ti < R.tore.length && R.prog >= R.tore[R.ti]) {
    const spur = Math.max(0, Math.min(3, Math.floor((b / 2 - pp.lat) / 3))), Fr = R.frage, oi = Fr.reihe[spur], ok = oi === Fr.q.c, ri = Fr.reihe.indexOf(Fr.q.c);
    c.antwortZaehlen(ok); c.klang(ok ? "richtig" : "falsch"); if (ok) { f.nitro = 2.6; f.bremsT = 0; } else { f.bremsT = 2.2; f.nitro = 0; }
    R.liste.push({ frage: Fr.q.q, ok, gew: BU[spur] + ", " + Fr.q.o[oi], loes: BU[ri] + ", " + Fr.q.o[Fr.q.c], erkl: Fr.q.e }); R.ti++;
    panel(`<p class="tkopf ${ok ? "ok" : "nein"}">${ok ? "Richtig, Nitro!" : "Falsche Spur, gebremst"}</p>${ok ? "" : `<p>Richtig ist <b>${c.esc(BU[ri])}, ${c.esc(Fr.q.o[Fr.q.c])}</b>.</p>`}<p class="terkl"><b>Erklärung</b> ${c.esc(Fr.q.e)}</p>`);
    const ti = R.ti; setTimeout(() => { if (RENN.aktiv === R && R.ti === ti && !R.fertig) frageZeigen(); }, 4200);
  }
  /* Rivalen */
  R.riv.forEach((rv, i) => {
    if (rv.fertig == null) {
      const naechstesTor = R.tore.find((g) => g > rv.prog); if (naechstesTor != null && rv.prog + rv.v * dt >= naechstesTor && rv.letztesTor !== naechstesTor) { rv.letztesTor = naechstesTor; if (Math.random() < 0.6) rv.boost = 2.4; else rv.slow = 2; }
      rv.boost -= dt; rv.slow -= dt; let max = rv.max * (rv.boost > 0 ? 1.45 : 1) * (rv.slow > 0 ? 0.5 : 1);
      rv.v += (max - rv.v) * Math.min(1, dt * 1.2); rv.prog += rv.v * dt; rv.lat += (Math.sin(t * 0.4 + i) * 3 - rv.lat) * dt * 0.3;
      if (rv.prog >= RUNDEN * L) { rv.fertig = R.zeit; R.platzFertig++; }
    } else { rv.prog += 6 * dt; }
    const q = bahnPunkt(START_S + rv.prog, rv.lat); rv.g.position.set(q.x, 0, q.z); let dh = q.h - rv.g.rotation.y; while (dh > Math.PI) dh -= 2 * Math.PI; while (dh < -Math.PI) dh += 2 * Math.PI; rv.g.rotation.y += dh * Math.min(1, dt * 10); animiereAuto(rv.g, rv.v, dt, t);
    if (Math.hypot(q.x - f.mesh.position.x, q.z - f.mesh.position.z) < 2.2) { f.v *= 0.85; }
  });
  const platz = 1 + R.riv.filter((rv) => (rv.fertig != null) || rv.prog > R.prog).length;
  const ziel = document.getElementById("fOrt"); if (ziel && !R.fertig) { ziel.hidden = false; ziel.textContent = "Platz " + platz + " von 5 · Runde " + Math.min(RUNDEN, Math.floor(Math.max(0, R.prog) / L) + 1) + " von " + RUNDEN; }
  if (!R.fertig && R.prog >= RUNDEN * L) { R.fertig = true; ende(platz); }
}
function ende(platz) {
  const c = K.ctx, R = RENN.aktiv; const richtig = R.liste.filter((l) => l.ok).length, n = R.liste.length;
  const preis = [200, 120, 80, 50, 30][platz - 1] + richtig * 25; c.s.geld += preis; c.klang(platz <= 3 ? "ziel" : "kasse");
  const st = sterneNachQuote(richtig, n); sterneSetzen("rennen", st); c.s.besucht._rennen = (c.s.besucht._rennen || 0) + 1; if (platz === 1) c.s.besucht._sieg = (c.s.besucht._sieg || 0) + 1;
  panel(null); c.speichern(); c.hud();
  const fertig = RENN.ende; setTimeout(() => {
    R.riv.forEach((rv) => K.scene.remove(rv.g)); RENN.aktiv = null; if (fertig) fertig();
    c.info("Zieleinlauf", `<p class="gross">Platz ${platz} von 5</p><p>${richtig} von ${n} Frage-Toren richtig. Preisgeld ${c.euro(preis)}. Sterne für das Rennen an diesem Tag ${"★".repeat(st)}${"☆".repeat(3 - st)}.</p>
      <ol class="uebersicht">${R.liste.map((l) => `<li class="${l.ok ? "ok" : "nein"}"><b>${c.esc(l.frage)}</b><br>${l.ok ? "Richtig, " + c.esc(l.loes) : "Ihre Spur " + c.esc(l.gew) + ". Richtig ist " + c.esc(l.loes)}. <span class="hinweis">${c.esc(l.erkl)}</span></li>`).join("")}</ol>
      <p class="hinweis">${platz === 1 ? "Herr Brandt gratuliert und legt eine neue Excel-Liste mit Ihren Bestzeiten an." : "Der Betriebsrat findet, dabei sein ist alles."}</p>`, [["Weiter", () => c.pruefeZiele()]]);
  }, 1200);
}
export function rennenAbbrechen() { const R = RENN.aktiv; if (!R) return; R.riv.forEach((rv) => K.scene.remove(rv.g)); RENN.aktiv = null; panel(null); }
