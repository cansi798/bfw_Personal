/* Nordstern Leben · Minikarte und große Karte mit Schnellreise
   © 2026 Waybuild Akademie, Waybuild UG (haftungsbeschränkt). Alle Rechte vorbehalten. · www.waybuild.de */
import { K } from "./bau.js";
import { GRENZE, STRASSEN, BEREICHE, ORTE, SEE, TEICH, BAHN, alleKol, bereichVon } from "./stadt.js";

const SK = 2, BW = (GRENZE.x1 - GRENZE.x0) * SK, BH = (GRENZE.z1 - GRENZE.z0) * SK;
let grund = null, mini = null, miniCtx = null;
const X = (x) => (x - GRENZE.x0) * SK, Z = (z) => (z - GRENZE.z0) * SK;
export const MARKER = []; /* {x, z, art: "auftrag"|"ziel"|"tour"|"rennen", text} von anderen Modulen gesetzt */
const FARBE = { auftrag: "#c9a227", ziel: "#d0533c", tour: "#4aa3d8", A: "#0f5c63", B: "#c9a227", C: "#7b2338", D: "#1f3557" };
function grundBild() {
  const c = document.createElement("canvas"); c.width = BW; c.height = BH; const x = c.getContext("2d");
  x.fillStyle = "#93c871"; x.fillRect(0, 0, BW, BH);
  BEREICHE.forEach((b) => { x.fillStyle = b.farbe; x.fillRect(X(b.x0), Z(b.z0), (b.x1 - b.x0) * SK, (b.z1 - b.z0) * SK); });
  x.fillStyle = "#4fa6d3"; [SEE, TEICH].forEach((w) => { x.beginPath(); x.arc(X(w.x), Z(w.z), w.r * SK, 0, 7); x.fill(); });
  x.strokeStyle = "#4d5157"; x.lineWidth = BAHN.b * SK; x.beginPath(); x.moveTo(X(BAHN.xa), Z(BAHN.cz + BAHN.r)); x.lineTo(X(BAHN.xb), Z(BAHN.cz + BAHN.r)); x.arc(X(BAHN.xb), Z(BAHN.cz), BAHN.r * SK, Math.PI / 2, -Math.PI / 2, true); x.lineTo(X(BAHN.xa), Z(BAHN.cz - BAHN.r)); x.arc(X(BAHN.xa), Z(BAHN.cz), BAHN.r * SK, -Math.PI / 2, Math.PI / 2, true); x.stroke();
  x.strokeStyle = "#ffffff"; x.lineWidth = 4 * SK + 2; x.lineCap = "round"; STRASSEN.forEach((r) => { x.beginPath(); x.moveTo(X(r.a[0]), Z(r.a[1])); x.lineTo(X(r.b[0]), Z(r.b[1])); x.stroke(); });
  x.strokeStyle = "#8a8f96"; x.lineWidth = 4 * SK - 2; STRASSEN.forEach((r) => { x.beginPath(); x.moveTo(X(r.a[0]), Z(r.a[1])); x.lineTo(X(r.b[0]), Z(r.b[1])); x.stroke(); });
  alleKol.forEach((k) => { if (k.t !== "b" || k.art === "fuss") return; x.fillStyle = k.art === "heim" ? "#e8c9a0" : "#b7aa96"; x.fillRect(X(k.x0), Z(k.z0), (k.x1 - k.x0) * SK, (k.z1 - k.z0) * SK); });
  x.fillStyle = "#c76b5b"; x.fillRect(X(0), Z(0), 14 * SK, 10 * SK);
  return c;
}
export function initKarte(h) {
  grund = grundBild();
  const w = document.createElement("div"); w.id = "minikarte"; w.className = "minikarte";
  w.innerHTML = `<button type="button" class="mkkopf" id="mkKopf" aria-label="Minikarte ein oder aus"><span id="mkOrt">Wohnviertel</span><i></i></button><canvas id="mkCanvas" width="150" height="150" aria-label="Minikarte, antippen öffnet die große Karte"></canvas>`;
  document.body.appendChild(w); mini = document.getElementById("mkCanvas"); miniCtx = mini.getContext("2d");
  document.getElementById("mkKopf").onclick = () => w.classList.toggle("zu"); mini.onclick = () => h.gross && h.gross();
  if (innerWidth < 760) w.classList.add("zu");
}
export function miniUpdate(o) {
  if (!mini || document.getElementById("minikarte").classList.contains("zu")) return;
  const x = miniCtx, W = 150, r = 46, sc = W / (2 * r);
  x.save(); x.clearRect(0, 0, W, W); x.beginPath(); x.arc(W / 2, W / 2, W / 2 - 1, 0, 7); x.clip();
  x.fillStyle = "#93c871"; x.fillRect(0, 0, W, W);
  x.translate(W / 2, W / 2); x.rotate(o.rot); x.scale(sc / SK, sc / SK); x.translate(-X(o.x), -Z(o.z));
  x.drawImage(grund, 0, 0);
  x.setTransform(1, 0, 0, 1, 0, 0);
  const auf = (px, pz) => { const dx = (px - o.x) * sc, dz = (pz - o.z) * sc, c = Math.cos(o.rot), s = Math.sin(o.rot); return [W / 2 + dx * c - dz * s, W / 2 + dx * s + dz * c]; };
  Object.entries(ORTE).forEach(([id, d]) => { const [a, b] = auf(d.tor[0], d.tor[1]); if (Math.hypot(a - W / 2, b - W / 2) > W / 2 - 4) return; x.fillStyle = id === "haus" ? "#7b2338" : "#24323a"; x.beginPath(); x.arc(a, b, id === "haus" ? 4 : 3, 0, 7); x.fill(); });
  MARKER.forEach((m) => { let [a, b] = auf(m.x, m.z); const d = Math.hypot(a - W / 2, b - W / 2), mx = W / 2 - 8; if (d > mx) { a = W / 2 + (a - W / 2) * mx / d; b = W / 2 + (b - W / 2) * mx / d; }
    x.fillStyle = FARBE[m.art] || FARBE[m.text] || "#d0533c"; x.beginPath(); x.arc(a, b, 6, 0, 7); x.fill(); x.fillStyle = "#fff"; x.font = "700 9px Inter, sans-serif"; x.textAlign = "center"; x.textBaseline = "middle"; x.fillText(m.text || "!", a, b + 0.5); });
  if (o.auto) { const [a, b] = auf(o.auto.x, o.auto.z); x.fillStyle = "#1f6fb8"; x.fillRect(a - 3, b - 3, 6, 6); }
  x.translate(W / 2, W / 2); x.rotate(o.rot + Math.PI - o.blick); x.fillStyle = "#d0533c"; x.strokeStyle = "#fff"; x.lineWidth = 1.5; x.beginPath(); x.moveTo(0, -7); x.lineTo(5, 5); x.lineTo(0, 2); x.lineTo(-5, 5); x.closePath(); x.fill(); x.stroke();
  x.restore();
  const n = bereichVon(o.x, o.z), el = document.getElementById("mkOrt"); if (el.textContent !== n) el.textContent = n;
}
export function grosseKarte(o) {
  const c = K.ctx, besucht = o.besucht;
  const ids = Object.keys(ORTE).filter((id) => id === "haus" || (besucht[id] || 0) > 0);
  const k = c.dialog(`<p class="dkopf">Karte von Nordstern City<span>${c.esc(bereichVon(o.x, o.z))}</span></p><canvas id="gkCanvas" class="grosskarte" width="${BW}" height="${BH}" aria-label="Karte der Stadt"></canvas>
    <p class="hinweis">Schnellreise zu Orten, die ${c.esc(c.s.name)} schon besucht hat. Das kostet Spielzeit wie eine echte Fahrt.</p>
    <div class="schnell">${ids.map((id) => `<button type="button" class="btn klein leise" data-id="${id}">${c.esc(ORTE[id].kurz || ORTE[id].name)}</button>`).join("")}</div>
    <div class="reihe"><button class="btn" type="button" id="gkZu">Schließen</button></div>`, "breit");
  const cv = k.querySelector("#gkCanvas"); cv.width = BW * 2; cv.height = BH * 2; const x = cv.getContext("2d"); x.scale(2, 2); x.drawImage(grund, 0, 0);
  x.font = "700 11px Inter, sans-serif"; x.textAlign = "center";
  BEREICHE.forEach((b) => { x.fillStyle = "rgba(36,50,58,.35)"; x.fillText(b.name.toUpperCase(), X((b.x0 + b.x1) / 2), Z((b.z0 + b.z1) / 2)); });
  Object.entries(ORTE).sort((p, q) => p[1].tor[0] - q[1].tor[0]).forEach(([id, d], i) => { const a = X(d.tor[0]), b = Z(d.tor[1]); x.fillStyle = id === "haus" ? "#7b2338" : "#24323a"; x.beginPath(); x.arc(a, b, 3.5, 0, 7); x.fill();
    const t = d.kurz || d.name, oben = i % 2 === 0, w = x.measureText(t).width; x.font = "600 7.5px Inter, sans-serif"; const ty = oben ? b - 7 : b + 12; const tw = x.measureText(t).width;
    x.fillStyle = "rgba(255,250,243,.85)"; x.fillRect(a - tw / 2 - 2, ty - 7, tw + 4, 9.5); x.fillStyle = "#24323a"; x.fillText(t, a, ty); x.font = "700 11px Inter, sans-serif"; });
  MARKER.forEach((m) => { x.fillStyle = FARBE[m.art] || FARBE[m.text] || "#d0533c"; x.beginPath(); x.arc(X(m.x), Z(m.z), 5.5, 0, 7); x.fill(); x.fillStyle = "#fff"; x.font = "700 8px Inter, sans-serif"; x.fillText(m.text || "!", X(m.x), Z(m.z) + 3); });
  x.fillStyle = "#d0533c"; x.strokeStyle = "#fff"; x.lineWidth = 2; x.beginPath(); x.arc(X(o.x), Z(o.z), 5, 0, 7); x.fill(); x.stroke();
  k.querySelectorAll("[data-id]").forEach((b) => (b.onclick = () => { c.dialogZu(); o.reise(b.dataset.id); }));
  k.querySelector("#gkZu").onclick = c.dialogZu;
}
