/* Atelier Nordstern · Mode trifft Personalwesen
   © 2026 Waybuild Akademie, Waybuild UG (haftungsbeschränkt). Alle Rechte vorbehalten. · www.waybuild.de */
(function () {
  "use strict";
  const S = window.SPIEL || { days: [] };
  const H = window.HUMOR || {};
  const app = document.getElementById("app");
  const $ = (id) => document.getElementById(id);
  const esc = (s) => String(s == null ? "" : s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
  const pick = (a) => a[Math.floor(Math.random() * a.length)];
  const mischen = (a) => { a = a.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
  const BU = ["A", "B", "C", "D"];

  /* ---------- Tag und Modus ---------- */
  const params = new URLSearchParams(location.search);
  function heuteTag() {
    let t = 1; const now = new Date(); now.setHours(0, 0, 0, 0);
    S.days.forEach((d) => { const x = d.date.split("."); if (new Date(+x[2], +x[1] - 1, +x[0]) <= now) t = d.nr; });
    return t;
  }
  let tag = parseInt(params.get("tag"), 10) || heuteTag();
  let day = S.days.find((d) => d.nr === tag) || S.days[0];
  tag = day.nr;
  function setzeUrl(m) {
    const u = new URL(location.href); u.searchParams.set("tag", tag);
    if (m) u.searchParams.set("m", m); else u.searchParams.delete("m");
    history.replaceState(null, "", u.toString());
  }
  function kopfInfo() {
    $("tagInfo").textContent = "Tag " + day.nr + ", " + day.title;
    $("lnkHub").href = "../index.html?tag=" + day.nr;
  }

  /* ---------- Sterne ---------- */
  function sterneLesen() { try { return JSON.parse(localStorage.getItem("pe26_spiel") || "{}") || {}; } catch (e) { return {}; } }
  function sterneSpeichern(key, n) {
    try { const o = sterneLesen(); const k = tag + "-" + key; if (!(o[k] >= n)) { o[k] = n; localStorage.setItem("pe26_spiel", JSON.stringify(o)); } } catch (e) {}
  }
  const sterneText = (n) => "★★★".slice(0, n) + "☆☆☆".slice(0, 3 - n);

  /* ---------- Ton ---------- */
  let ton = true; try { ton = localStorage.getItem("pe26_spiel_ton") !== "0"; } catch (e) {}
  let ac = null;
  function klang(art) {
    if (!ton) return;
    try {
      ac = ac || new (window.AudioContext || window.webkitAudioContext)();
      const t = ac.currentTime;
      const note = (f, start, dauer, typ, laut) => {
        const o = ac.createOscillator(), g = ac.createGain();
        o.type = typ || "sine"; o.frequency.value = f; g.gain.setValueAtTime(0, t + start);
        g.gain.linearRampToValueAtTime(laut || 0.12, t + start + 0.02); g.gain.exponentialRampToValueAtTime(0.0001, t + start + dauer);
        o.connect(g).connect(ac.destination); o.start(t + start); o.stop(t + start + dauer + 0.05);
      };
      const rauschen = (start, dauer, laut, zitter) => {
        const n = Math.floor(ac.sampleRate * dauer), b = ac.createBuffer(1, n, ac.sampleRate), d = b.getChannelData(0);
        for (let i = 0; i < n; i++) { const z = zitter ? (0.55 + 0.45 * Math.sin(i / ac.sampleRate * 2 * Math.PI * 9 + Math.random())) : 1; d[i] = (Math.random() * 2 - 1) * z * (1 - i / n); }
        const s = ac.createBufferSource(), g = ac.createGain(), f = ac.createBiquadFilter();
        f.type = "bandpass"; f.frequency.value = zitter ? 1800 : 3500; s.buffer = b; g.gain.value = laut;
        s.connect(f).connect(g).connect(ac.destination); s.start(t + start);
      };
      if (art === "richtig") { note(660, 0, 0.18, "triangle"); note(990, 0.1, 0.3, "triangle"); }
      else if (art === "falsch") { note(220, 0, 0.3, "sawtooth", 0.06); note(185, 0.12, 0.35, "sawtooth", 0.05); }
      else if (art === "klick") { note(1200, 0, 0.06, "square", 0.05); }
      else if (art === "wahl") { note(784, 0, 0.12, "sine"); note(1046, 0.07, 0.22, "sine"); }
      else if (art === "blitz") { rauschen(0, 0.09, 0.25, false); }
      else if (art === "applaus") { rauschen(0, 2.4, 0.35, true); }
    } catch (e) {}
  }
  function tonKnopf() {
    const b = $("btnTon"); b.classList.toggle("aus", !ton);
    b.onclick = () => { ton = !ton; try { localStorage.setItem("pe26_spiel_ton", ton ? "1" : "0"); } catch (e) {} b.classList.toggle("aus", !ton); klang("klick"); };
  }

  /* ---------- Atelier-Funk ---------- */
  const FUNK = [
    "Trendbericht, Beige ist das neue Beige, meldet die Lohnbuchhaltung",
    "Herr Brandt kombiniert Karo mit Karo und nennt es Matrixorganisation",
    "Kleiderordnung im Betrieb? Da hat der Betriebsrat ein Mitbestimmungsrecht nach § 87 BetrVG",
    "Neue Kollektion „Probezeit“ passt garantiert sechs Monate",
    "Paula Probezeit postet ihr Outfit, 3 Likes, davon 2 vom Betriebsrat",
    "Atelier sucht Auszubildende, Nähmaschine vorhanden, Kekse auch",
    "Modepolizei warnt, Socken in Sandalen sind kein Motivator",
    "Laufsteg kurz gesperrt, Arbeitsschutz prüft die Absatzhöhe",
    "Stilberatung rät, im Vorstellungsgespräch lieber die Bluse als die Warnweste",
    "Herr Brandts Sakko feiert Jubiläum, es ist seit 1998 im Einsatz",
    "Frau Demir führt neue Kennzahl ein, Outfits pro Quartal"
  ];
  function funkStarten() {
    const radio = (H.RADIO || []).map((s) => s.replace(/^Radio Nordstern\s*·\s*/, ""));
    const alle = mischen(FUNK.concat(radio)); let i = 0; const el = $("funkText");
    const zeig = () => { el.style.opacity = 0; setTimeout(() => { el.textContent = alle[i++ % alle.length]; el.style.opacity = 1; }, 380); };
    zeig(); setInterval(zeig, 8000);
  }

  /* ---------- Figur ---------- */
  const PAL = {
    basis: { h: "#a59e97", z: "#ebe5de", a: "#8a8480" },
    salbei: { h: "#6f8f7b", z: "#efe6d8", a: "#c9a227" },
    bordeaux: { h: "#7b2338", z: "#e9d6c2", a: "#c8a27a" },
    navy: { h: "#1f3557", z: "#f4f4f2", a: "#c0392b" },
    petrol: { h: "#0f5c63", z: "#f1ebdd", a: "#d9a42b" },
    neon: { h: "#39d353", z: "#ffe600", a: "#ff7a00" }
  };
  const HAUT = ["#f3d3bd", "#e2b18b", "#c68b5e", "#8d5a3b", "#5c3a26"];
  const HAAR = ["#2b1b12", "#5a3a22", "#a0662f", "#d8b26e", "#8c8c8c", "#7a2e2a"];
  function farbton(hex, f) {
    const n = parseInt(hex.slice(1), 16); let r = n >> 16, g = (n >> 8) & 255, b = n & 255;
    const m = (c) => Math.max(0, Math.min(255, Math.round(f < 0 ? c * (1 + f) : c + (255 - c) * f)));
    return "#" + ((1 << 24) + (m(r) << 16) + (m(g) << 8) + m(b)).toString(16).slice(1);
  }
  function sternPfad(cx, cy, r) {
    let d = ""; for (let i = 0; i < 10; i++) { const a = -Math.PI / 2 + i * Math.PI / 5, rr = i % 2 ? r * 0.45 : r; d += (i ? "L" : "M") + (cx + rr * Math.cos(a)).toFixed(1) + " " + (cy + rr * Math.sin(a)).toFixed(1); }
    return d + "Z";
  }
  const ARM_L = (bis) => `M72 106 Q61 150 60 ${bis}`, ARM_R = (bis) => `M128 106 Q139 150 140 ${bis}`;
  const KURZ_L = "M72 106 Q66 122 64 136", KURZ_R = "M128 106 Q134 122 136 136";
  const aermel = (farbe, lang, breite) => {
    const w = breite || 16;
    return lang ? `<path d="${ARM_L(202)}" stroke="${farbe}" stroke-width="${w}" fill="none" stroke-linecap="round"/><path d="${ARM_R(202)}" stroke="${farbe}" stroke-width="${w}" fill="none" stroke-linecap="round"/>`
      : `<path d="${KURZ_L}" stroke="${farbe}" stroke-width="${w}" fill="none" stroke-linecap="round"/><path d="${KURZ_R}" stroke="${farbe}" stroke-width="${w}" fill="none" stroke-linecap="round"/>`;
  };
  const rumpfOben = (f) => `<path d="M69 101 Q100 93 131 101 L127 150 Q123 175 122 204 L78 204 Q77 175 73 150 Z" fill="${f}"/>`;

  function haarHinten(art, c) {
    switch (art) {
      case "bob": return `<path d="M77 52 Q76 26 100 25 Q124 26 123 52 L126 88 Q112 93 100 91 Q88 93 74 88 Z" fill="${c}"/>`;
      case "wellen": return `<path d="M75 52 Q73 23 100 22 Q127 23 125 52 Q131 80 127 108 Q133 128 124 146 Q114 150 111 132 L111 100 L89 100 L89 132 Q86 150 76 146 Q67 128 73 108 Q69 80 75 52 Z" fill="${c}"/>`;
      case "dutt": return `<circle cx="100" cy="23" r="13" fill="${c}"/>`;
      case "locken": return [[80, 40, 16], [100, 27, 18], [120, 40, 16], [75, 62, 14], [125, 62, 14], [81, 80, 11], [119, 80, 11]].map((k) => `<circle cx="${k[0]}" cy="${k[1]}" r="${k[2]}" fill="${c}"/>`).join("");
      case "wind": return `<path d="M74 56 L60 22 L84 38 L86 8 L100 32 L113 4 L116 36 L142 16 L126 56 Z" fill="${c}"/>`;
      default: return "";
    }
  }
  function haarVorne(art, c) {
    switch (art) {
      case "bob": return `<path d="M78 52 Q80 27 100 27 Q121 27 122 52 Q113 41 99 44 Q87 46 78 52 Z" fill="${c}"/>`;
      case "wellen": return `<path d="M78 54 Q80 25 104 26 Q123 28 122 52 Q114 38 100 38 Q90 44 78 54 Z" fill="${c}"/>` +
        `<path d="M79 50 Q71 92 79 142 Q85 148 90 139 Q83 100 86 60 Z" fill="${c}"/><path d="M121 50 Q129 92 121 142 Q115 148 110 139 Q117 100 114 60 Z" fill="${c}"/>`;
      case "dutt": return `<path d="M78 54 Q78 30 100 30 Q122 30 122 54 Q118 40 100 39 Q82 40 78 54 Z" fill="${c}"/>`;
      case "locken": return [[86, 37], [95, 33], [105, 33], [114, 37]].map((k) => `<circle cx="${k[0]}" cy="${k[1]}" r="7" fill="${c}"/>`).join("");
      default: return `<path d="M78 54 Q78 27 100 27 Q123 27 122 54 Q119 40 106 37 Q92 40 84 42 Q80 46 78 54 Z" fill="${c}"/>`;
    }
  }
  function unten(art, p) {
    switch (art) {
      case "hose": return `<path d="M76 196 L124 196 L124 230 L117 400 L101 400 L100 236 L99 400 L83 400 L76 230 Z" fill="${p.h}"/><rect x="76" y="196" width="48" height="6" fill="${farbton(p.h, -0.2)}"/><path d="M91 244 L91 396 M109 244 L109 396" stroke="${farbton(p.h, -0.22)}" stroke-width="1"/>`;
      case "plissee": {
        let s = `<path d="M77 196 L123 196 L140 302 L60 302 Z" fill="${p.z}"/>`;
        for (let i = 1; i < 9; i++) s += `<path d="M${(77 + i * 5.1).toFixed(1)} 202 L${(60 + i * 8.9).toFixed(1)} 302" stroke="${farbton(p.z, -0.16)}" stroke-width="1.1"/>`;
        return s + `<rect x="77" y="196" width="46" height="7" rx="2" fill="${p.a}"/>`;
      }
      case "culotte": return `<path d="M76 196 L124 196 L134 332 L104 332 L100 246 L96 332 L66 332 Z" fill="${p.h}"/><rect x="76" y="196" width="48" height="6" fill="${farbton(p.h, -0.2)}"/>`;
      case "jogging": return `<path d="M74 196 L126 196 L129 240 L123 394 L101 394 L100 252 L99 394 L77 394 L71 240 Z" fill="#8e9196"/><ellipse cx="89" cy="302" rx="9" ry="13" fill="#a4a7ac"/><ellipse cx="111" cy="302" rx="9" ry="13" fill="#a4a7ac"/><rect x="77" y="384" width="22" height="10" rx="3" fill="#6f7277"/><rect x="101" y="384" width="22" height="10" rx="3" fill="#6f7277"/><path d="M96 200 L94 214 M104 200 L106 214" stroke="#f4f4f4" stroke-width="1.6"/>`;
      default: return `<path d="M76 196 L124 196 L124 230 L117 400 L101 400 L100 236 L99 400 L83 400 L76 230 Z" fill="${p.h}"/>`;
    }
  }
  function schuhe(art, p) {
    switch (art) {
      case "stiefel": return `<path d="M82 372 L100 372 L100 404 Q100 412 92 412 L77 412 Q75 405 82 400 Z" fill="#3a2a22"/><path d="M100 372 L118 372 L118 400 Q125 405 123 412 L108 412 Q100 412 100 404 Z" fill="#3a2a22"/>`;
      case "loafer": return `<ellipse cx="90" cy="406" rx="12" ry="6.5" fill="#5b3a29"/><ellipse cx="110" cy="406" rx="12" ry="6.5" fill="#5b3a29"/><rect x="85" y="401" width="9" height="3" rx="1" fill="${p.a}"/><rect x="106" y="401" width="9" height="3" rx="1" fill="${p.a}"/>`;
      case "sneaker": return `<path d="M77 410 Q78 397 90 396 Q101 396 101 404 L101 410 Z" fill="#fbfbfb" stroke="#cdc5be"/><path d="M99 410 L99 404 Q99 396 110 396 Q122 397 123 410 Z" fill="#fbfbfb" stroke="#cdc5be"/><path d="M83 404 L95 401 M105 401 L117 404" stroke="${p.a}" stroke-width="2.4" stroke-linecap="round"/>`;
      case "sandalen": return `<rect x="83" y="374" width="16" height="34" rx="6" fill="#f9f9f9"/><rect x="101" y="374" width="16" height="34" rx="6" fill="#f9f9f9"/><ellipse cx="91" cy="410" rx="12" ry="3.6" fill="#7a5233"/><ellipse cx="109" cy="410" rx="12" ry="3.6" fill="#7a5233"/><rect x="82" y="394" width="18" height="4" fill="#7a5233"/><rect x="100" y="394" width="18" height="4" fill="#7a5233"/><rect x="82" y="402" width="18" height="3.5" fill="#7a5233"/><rect x="100" y="402" width="18" height="3.5" fill="#7a5233"/>`;
      default: return `<ellipse cx="90" cy="406" rx="11" ry="6" fill="#5b5550"/><ellipse cx="110" cy="406" rx="11" ry="6" fill="#5b5550"/>`;
    }
  }
  function oben(art, p) {
    switch (art) {
      case "bluse": return aermel(p.z, true) + rumpfOben(p.z) + `<path d="M90 99 L100 114 L110 99 L104 97 L100 105 L96 97 Z" fill="${farbton(p.z, -0.1)}"/>` +
        [124, 144, 164, 184].map((y) => `<circle cx="100" cy="${y}" r="1.9" fill="${p.a}"/>`).join("");
      case "rolli": return aermel(p.h, true) + rumpfOben(p.h) + `<rect x="90" y="82" width="20" height="22" rx="7" fill="${p.h}"/><path d="M93 86 L93 100 M97 85 L97 101 M101 85 L101 101 M105 85 L105 101" stroke="${farbton(p.h, -0.2)}" stroke-width="1"/>`;
      case "stern": return aermel(p.h, false) + rumpfOben(p.h) + `<path d="${sternPfad(100, 142, 13)}" fill="${p.a}"/>`;
      case "weste": return aermel("#d9d9d9", false) + rumpfOben("#d9d9d9") + `<path d="M74 102 L90 99 L100 128 L110 99 L126 102 L124 206 L76 206 Z" fill="#ff7a00"/><rect x="75" y="160" width="50" height="7" fill="#e9e9e9"/><rect x="75" y="180" width="50" height="7" fill="#e9e9e9"/>`;
      default: return aermel(p.z, false) + rumpfOben(p.z);
    }
  }
  function jacke(art, p) {
    switch (art) {
      case "blazer": return aermel(p.h, true, 18) + `<path d="M69 101 L91 99 L97 140 L95 230 L73 230 L72 150 Z" fill="${p.h}"/><path d="M131 101 L109 99 L103 140 L105 230 L127 230 L128 150 Z" fill="${p.h}"/><path d="M91 99 L97 140 L85 118 Z" fill="${farbton(p.h, -0.18)}"/><path d="M109 99 L103 140 L115 118 Z" fill="${farbton(p.h, -0.18)}"/><circle cx="97" cy="172" r="2.4" fill="${p.a}"/>`;
      case "trench": { const t = "#c9a97a", d = farbton(t, -0.2); return aermel(t, true, 18) + `<path d="M69 101 L92 99 L98 140 L98 322 L62 322 L72 150 Z" fill="${t}"/><path d="M131 101 L108 99 L102 140 L102 322 L138 322 L128 150 Z" fill="${t}"/><rect x="63" y="186" width="74" height="8" rx="2" fill="${d}"/><rect x="96" y="184" width="9" height="12" rx="2" fill="none" stroke="#5b4630" stroke-width="1.6"/>` + [142, 160, 214, 236].map((y) => `<circle cx="92" cy="${y}" r="2" fill="${d}"/><circle cx="108" cy="${y}" r="2" fill="${d}"/>`).join(""); }
      case "cape": return `<path d="M68 102 Q100 90 132 102 L152 236 Q100 250 48 236 Z" fill="${p.h}"/><path d="M80 100 Q100 110 120 100 Q100 96 80 100 Z" fill="${farbton(p.h, -0.2)}"/><path d="M58 228 Q100 240 142 228" stroke="${p.a}" stroke-width="2" fill="none"/>`;
      case "poncho": return `<path d="M64 100 Q100 84 136 100 L158 254 L42 254 Z" fill="rgba(186,226,108,.78)" stroke="#8fb34a" stroke-width="1.5"/><text x="100" y="240" font-size="8.5" text-anchor="middle" fill="#45621a" font-family="Inter,sans-serif" font-weight="700">Betriebsausflug 2019</text>`;
      default: return "";
    }
  }
  function tasche(art, p) {
    switch (art) {
      case "henkel": return `<path d="M131 226 Q140 202 149 226" stroke="${farbton(p.a, -0.35)}" stroke-width="3" fill="none"/><path d="M126 224 L154 224 L158 254 L122 254 Z" fill="${p.a}"/><rect x="137" y="230" width="6" height="5" rx="1" fill="${farbton(p.a, -0.35)}"/>`;
      case "clutch": return `<rect x="124" y="188" width="32" height="17" rx="4" fill="${p.a}"/><path d="M124 194 L140 199 L156 194" stroke="${farbton(p.a, -0.3)}" stroke-width="1.4" fill="none"/>`;
      case "rucksack": return `<path d="M84 101 Q79 140 84 178" stroke="#5b3a29" stroke-width="6" fill="none" stroke-linecap="round"/><path d="M116 101 Q121 140 116 178" stroke="#5b3a29" stroke-width="6" fill="none" stroke-linecap="round"/><rect x="80" y="150" width="8" height="5" rx="1" fill="#c9a227"/><rect x="112" y="150" width="8" height="5" rx="1" fill="#c9a227"/>`;
      case "jute": return `<path d="M130 224 Q139 204 148 224" stroke="#b9a57c" stroke-width="3" fill="none"/><rect x="124" y="222" width="30" height="38" rx="3" fill="#dccaa3"/><text x="139" y="245" font-size="8" text-anchor="middle" fill="#6b5a3a" font-family="Inter,sans-serif" font-weight="700">LSt</text>`;
      default: return "";
    }
  }
  function accessoire(art, p) {
    switch (art) {
      case "tuch": return `<path d="M88 98 Q100 110 112 98 L107 107 Q100 113 93 107 Z" fill="${p.a}"/><path d="M98 106 L91 126 L99 121 Z M102 106 L109 126 L101 121 Z" fill="${farbton(p.a, -0.12)}"/>`;
      case "brille": return `<rect x="84.5" y="52.5" width="13.5" height="10" rx="4" fill="#1d1d1d"/><rect x="102" y="52.5" width="13.5" height="10" rx="4" fill="#1d1d1d"/><path d="M98 56.5 L102 56.5 M84.5 56 L80 54 M115.5 56 L120 54" stroke="#1d1d1d" stroke-width="1.8"/><path d="M87 55 L91 54" stroke="#fff" stroke-width="1.2" opacity=".6"/>`;
      case "perlen": { let s = ""; for (let i = 0; i <= 10; i++) { const x = 86 + i * 2.8, y = 100 + 11 * Math.sin(Math.PI * i / 10); s += `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="2.2" fill="#fffaf0" stroke="#d9cbb8" stroke-width=".6"/>`; } return s; }
      case "schild": return `<rect x="106" y="120" width="27" height="15" rx="2" fill="#fff" stroke="#c9503b" stroke-width="1.2"/><text x="119.5" y="130.5" font-size="6.6" text-anchor="middle" fill="#c9503b" font-family="Inter,sans-serif" font-weight="700">NEU</text>`;
      default: return "";
    }
  }
  function figur(st, vb, cls) {
    const p = PAL[st.farbe] || PAL.basis, s = st.haut, d = farbton(s, -0.14), hc = st.haarfarbe;
    let g = haarHinten(st.haar, hc);
    g += `<rect x="83" y="222" width="16" height="182" rx="8" fill="${s}"/><rect x="101" y="222" width="16" height="182" rx="8" fill="${s}"/>`;
    g += `<path d="${ARM_L(212)}" stroke="${s}" stroke-width="12" fill="none" stroke-linecap="round"/><path d="${ARM_R(212)}" stroke="${s}" stroke-width="12" fill="none" stroke-linecap="round"/>`;
    g += `<path d="M70 102 Q100 94 130 102 L126 150 Q122 175 121 195 L124 226 L76 226 L79 195 Q78 175 74 150 Z" fill="${s}"/>`;
    g += `<rect x="93" y="72" width="14" height="30" rx="6" fill="${d}"/>`;
    g += unten(st.unten, p) + schuhe(st.schuhe, p) + oben(st.top, p) + jacke(st.jacke, p);
    g += `<circle cx="60" cy="216" r="7" fill="${s}"/><circle cx="140" cy="216" r="7" fill="${s}"/>`;
    g += tasche(st.tasche, p);
    g += `<ellipse cx="79" cy="58" rx="3.6" ry="5.2" fill="${d}"/><ellipse cx="121" cy="58" rx="3.6" ry="5.2" fill="${d}"/>`;
    g += `<ellipse cx="100" cy="56" rx="21" ry="25" fill="${s}"/>`;
    g += `<ellipse cx="92" cy="58" rx="2.4" ry="3.2" fill="#2b1626"/><ellipse cx="108" cy="58" rx="2.4" ry="3.2" fill="#2b1626"/>` +
      `<path d="M87 50 Q92 47 96 50 M104 50 Q108 47 113 50" stroke="#2b1626" stroke-width="1.6" fill="none" stroke-linecap="round"/>` +
      `<path d="M100 60 Q98 66 101.5 67" stroke="${farbton(s, -0.3)}" stroke-width="1.3" fill="none" stroke-linecap="round"/>` +
      `<path d="M94 71 Q100 76 106 71" stroke="#9b3b45" stroke-width="2" fill="none" stroke-linecap="round"/>` +
      `<circle cx="87" cy="66" r="4" fill="#e07a7a" opacity=".22"/><circle cx="113" cy="66" r="4" fill="#e07a7a" opacity=".22"/>`;
    g += haarVorne(st.haar, hc);
    g += accessoire(st.acc, p);
    return `<svg class="${cls || "figur"}" viewBox="${vb || "0 0 200 440"}" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Ihr Model im aktuellen Look">${g}</svg>`;
  }

  /* ---------- Teile und Runden ---------- */
  const SLOTS = [
    { key: "farbe", titel: "Farbwelt", vb: "38 18 124 404", opt: [["salbei", "Salbei und Creme"], ["bordeaux", "Bordeaux und Kamel"], ["navy", "Navy und Weiß"], ["petrol", "Petrol und Senf"]], not: ["neon", "Textmarker-Mix", "Textmarker-Mix. Man sieht Sie sogar im Großraumbüro bei Stromausfall."] },
    { key: "haar", titel: "Frisur", vb: "58 0 84 104", opt: [["bob", "Bob mit Pony"], ["wellen", "Lange Wellen"], ["dutt", "Eleganter Dutt"], ["locken", "Volle Locken"], ["kurz", "Kurzhaarschnitt"]], not: ["wind", "Frisur nach dem Windkanal", "Frisur nach dem Windkanal. Sehr dynamisch, fast schon agil."] },
    { key: "top", titel: "Oberteil", vb: "44 78 112 140", opt: [["bluse", "Seidenbluse"], ["rolli", "Rollkragenpullover"], ["stern", "Shirt mit Stern"]], not: ["weste", "Warnweste aus dem Lager", "Warnweste aus dem Lager. Arbeitsschutz trifft Haute Couture."] },
    { key: "unten", titel: "Hose oder Rock", vb: "44 186 112 228", opt: [["hose", "Stoffhose mit Bügelfalte"], ["plissee", "Plisseerock"], ["culotte", "Culotte"]], not: ["jogging", "Jogginghose mit Knieblasen", "Jogginghose mit Knieblasen. Das Homeoffice hat Spuren hinterlassen."] },
    { key: "schuhe", titel: "Schuhe", vb: "64 356 72 64", opt: [["stiefel", "Stiefeletten"], ["loafer", "Loafer"], ["sneaker", "Weiße Sneaker"]], not: ["sandalen", "Socken in Sandalen", "Socken in Sandalen. Die Modepolizei lädt zur Anhörung."] },
    { key: "jacke", titel: "Jacke", vb: "36 78 128 260", opt: [["blazer", "Blazer"], ["trench", "Trenchcoat"], ["cape", "Cape"]], not: ["poncho", "Regenponcho vom Betriebsausflug", "Regenponcho vom Betriebsausflug. Nachhaltig, weil seit 2019 im Einsatz."] },
    { key: "tasche", titel: "Tasche", vb: "50 84 120 190", opt: [["henkel", "Henkeltasche"], ["clutch", "Clutch"], ["rucksack", "Lederrucksack"]], not: ["jute", "Jutebeutel mit Lohnsteuertabelle", "Jutebeutel mit Lohnsteuertabelle. Immer bereit für die Abrechnung."] },
    { key: "acc", titel: "Accessoire", vb: "62 24 80 116", opt: [["tuch", "Seidentuch"], ["brille", "Sonnenbrille"], ["perlen", "Perlenkette"]], not: ["schild", "Namensschild „Hallo, ich bin neu“", "Namensschild „Hallo, ich bin neu“. Die Probezeit sieht man Ihnen an."] },
    { key: "jury1", titel: "Jury-Frage", jury: true },
    { key: "jury2", titel: "Jury-Frage", jury: true }
  ];
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
  const LOB_A = ["Paula Probezeit filmt schon für ihre 12 Follower.", "Frau Demir nickt. Das ist Führung durch Vorbild.", "Herr Brandt rückt anerkennend sein Sakko zurecht.", "Die Jury flüstert „Talentpool“.", "Das Blitzlichtgewitter beginnt schon jetzt."];

  function modellLaden() {
    let m = null; try { m = JSON.parse(localStorage.getItem("pe26_atelier_model") || "null"); } catch (e) {}
    return m && m.haut ? m : { haut: HAUT[1], haarfarbe: HAAR[1], haar: "bob" };
  }
  function modellSpeichern(m) { try { localStorage.setItem("pe26_atelier_model", JSON.stringify(m)); } catch (e) {} }
  let modell = modellLaden();
  const grundLook = () => ({ haut: modell.haut, haarfarbe: modell.haarfarbe, haar: modell.haar, farbe: "basis", top: "basis", unten: "basis", schuhe: "basis", jacke: null, tasche: null, acc: null });
  const schickerLook = () => ({ haut: pick(HAUT), haarfarbe: pick(HAAR.slice(0, 5)), haar: pick(["bob", "wellen", "dutt", "locken", "kurz"]), farbe: pick(["salbei", "bordeaux", "navy", "petrol"]), top: pick(["bluse", "rolli", "stern"]), unten: pick(["hose", "plissee", "culotte"]), schuhe: pick(["stiefel", "loafer", "sneaker"]), jacke: pick(["blazer", "trench", null]), tasche: pick(["henkel", "clutch", null]), acc: pick(["tuch", "perlen", "brille", null]) });

  /* ---------- Menü ---------- */
  function menue() {
    setzeUrl(null); kopfInfo(); window.scrollTo(0, 0);
    const st = sterneLesen(), n = (k) => st[tag + "-" + k] || 0;
    const opts = S.days.map((d) => `<option value="${d.nr}"${d.nr === tag ? " selected" : ""}>Tag ${d.nr}, ${esc(d.title)} (${esc(d.date)})</option>`).join("");
    const kachel = (m, art, titel, text, link) => `<a class="modus" href="?tag=${tag}&m=${m}" data-m="${m}"><span class="nr">${art}</span><h2>${titel}</h2><p>${text}</p><span class="unten"><span>${link}</span><span class="sterne" aria-label="${n(m)} von 3 Sternen">${sterneText(n(m))}</span></span></a>`;
    app.innerHTML = `<div class="menue">
      <section class="titelblatt"><div>
        <h1>Atelier Nordstern</h1>
        <p>Mode trifft Personalwesen. Beantworten Sie Fragen zum Tagesthema, stylen Sie Ihr Model und gehen Sie mit dem Wissen des Tages auf den Laufsteg. Die Jury urteilt streng, aber mit Humor.</p>
        <div class="tagwahl"><label for="tagSel"><b>Unterrichtstag</b></label><select id="tagSel">${opts}</select></div>
      </div><div class="vorschau">${figur(schickerLook())}</div></section>
      <section class="modi" aria-label="Spielarten im Atelier">
        ${kachel("styling", "Quiz mit Laufsteg", "Styling-Studio", "10 Fragen. Jede richtige Antwort bringt ein Teil für Ihren Look, jede falsche eine Notlösung. Am Ende urteilt die Jury.", "Model stylen")}
        ${kachel("lookbook", "Lernen", "Lookbook", "Die Kernbegriffe des Tages als Modemagazin. Danach prüft der Stilcheck, was hängen geblieben ist.", "Magazin lesen")}
        ${kachel("boutique", "Sortieren", "Boutique", "Etiketten mit Aussagen an die richtige Kleiderstange hängen. Zu jedem Etikett gibt es die Erklärung.", "Einsortieren")}
      </section></div>`;
    $("tagSel").onchange = (e) => { tag = +e.target.value; day = S.days.find((d) => d.nr === tag) || S.days[0]; menue(); };
    app.querySelectorAll(".modus").forEach((a) => a.addEventListener("click", (e) => { e.preventDefault(); klang("klick"); starte(a.dataset.m); }));
  }
  function starte(m) {
    if (m === "styling") modellWahl();
    else if (m === "lookbook") lookbook();
    else if (m === "boutique") boutique();
    else menue();
  }

  /* ---------- Modellwahl ---------- */
  function modellWahl() {
    setzeUrl("styling"); kopfInfo(); window.scrollTo(0, 0);
    const zeichnen = () => {
      const st = grundLook();
      app.innerHTML = `<div class="studio modell">
        <div class="buehne"><div class="steg"></div><div class="publikum"></div>${figur(st)}</div>
        <div class="tafel">
          <h2>Wählen Sie Ihr Model</h2>
          <p class="hinweis">Das Model trägt zuerst das schlichte Atelier-Basic. Den Rest verdienen Sie sich mit richtigen Antworten.</p>
          <div class="feld"><h3>Hautton</h3><div class="farben">${HAUT.map((c, i) => `<button class="farbe" type="button" data-haut="${c}" style="background:${c}" aria-label="Hautton ${i + 1}" aria-pressed="${c === modell.haut}"></button>`).join("")}</div></div>
          <div class="feld"><h3>Haarfarbe</h3><div class="farben">${HAAR.map((c, i) => `<button class="farbe" type="button" data-haar="${c}" style="background:${c}" aria-label="Haarfarbe ${i + 1}" aria-pressed="${c === modell.haarfarbe}"></button>`).join("")}</div></div>
          <div class="feld"><h3>Frisur zum Start</h3><div class="schnitte">${[["kurz", "Kurz"], ["bob", "Bob"], ["locken", "Locken"], ["wellen", "Lang"], ["dutt", "Dutt"]].map((h) => `<button class="schnitt" type="button" data-schnitt="${h[0]}" aria-pressed="${h[0] === modell.haar}">${h[1]}</button>`).join("")}</div></div>
          <div class="reihe"><button class="btn" id="los" type="button">Styling starten</button><button class="btn leise" id="zurueck" type="button">Zum Atelier</button></div>
        </div></div>`;
      app.querySelectorAll("[data-haut]").forEach((b) => b.onclick = () => { modell.haut = b.dataset.haut; klang("klick"); zeichnen(); });
      app.querySelectorAll("[data-haar]").forEach((b) => b.onclick = () => { modell.haarfarbe = b.dataset.haar; klang("klick"); zeichnen(); });
      app.querySelectorAll("[data-schnitt]").forEach((b) => b.onclick = () => { modell.haar = b.dataset.schnitt; klang("klick"); zeichnen(); });
      $("los").onclick = () => { modellSpeichern(modell); klang("wahl"); styling(); };
      $("zurueck").onclick = menue;
    };
    zeichnen();
  }

  /* ---------- Styling-Studio ---------- */
  let R = null;
  function styling() {
    setzeUrl("styling"); kopfInfo();
    const pool = mischen(day.quiz).slice(0, 10);
    R = { fragen: pool, i: 0, st: grundLook(), erg: [], nots: [] };
    frage();
  }
  function lookListe() {
    const out = [];
    SLOTS.forEach((s) => {
      if (s.jury) return;
      const v = R.st[s.key]; if (!v || v === "basis") return;
      if (s.key === "haar" && v === modell.haar && !R.erg.some((e) => e.slot === "haar")) return;
      const o = s.opt.find((x) => x[0] === v); const nn = s.not[0] === v;
      out.push(`<span${nn ? ' class="not"' : ""}>${esc(nn ? s.not[1] : o ? o[1] : v)}</span>`);
    });
    return out.join("");
  }
  function buehne() {
    const dots = R.fragen.map((_, i) => { const e = R.erg[i]; return `<i class="${e ? (e.ok ? "ok" : "nein") : i === R.i ? "jetzt" : ""}"></i>`; }).join("");
    return `<div class="steg"></div><div class="publikum"></div><div class="punkte" aria-label="${R.erg.filter((e) => e.ok).length} von ${R.erg.length} richtig">${dots}</div><div class="lookliste">${lookListe()}</div>${figur(R.st)}`;
  }
  function frage() {
    const slot = SLOTS[R.i], q = R.fragen[R.i];
    const reihenfolge = mischen([0, 1, 2, 3].slice(0, q.o.length));
    R.reihenfolge = reihenfolge;
    app.innerHTML = `<div class="studio">
      <div class="buehne" id="buehne">${buehne()}</div>
      <div class="tafel" id="tafel">
        <div class="kopfzeile"><span class="slot">${slot.titel}</span><span class="zahl">Frage ${R.i + 1} von ${R.fragen.length}${slot.jury ? ", Bonus für die Laufsteg-Show" : ", richtig beantwortet gibt es ein neues Teil"}</span></div>
        <p class="frage">${esc(q.q)}</p>
        <div class="antworten">${reihenfolge.map((oi, k) => `<button class="antwort" type="button" data-oi="${oi}"><span class="bu">${BU[k]}</span><span>${esc(q.o[oi])}</span></button>`).join("")}</div>
        <div id="nach"></div>
      </div></div>`;
    app.querySelectorAll(".antwort").forEach((b) => b.onclick = () => antworten(+b.dataset.oi));
    if (R.i === 0) window.scrollTo(0, 0);
  }
  function antworten(oi) {
    const slot = SLOTS[R.i], q = R.fragen[R.i], ok = oi === q.c;
    R.erg[R.i] = { q, gewaehlt: oi, ok, slot: slot.key };
    app.querySelectorAll(".antwort").forEach((b) => {
      b.disabled = true; const x = +b.dataset.oi;
      if (x === q.c) b.classList.add("richtig"); else if (x === oi) b.classList.add("falsch");
    });
    klang(ok ? "richtig" : "falsch");
    let h = `<div class="erklaerung"><p class="ergebnis ${ok ? "ok" : "nein"}">${ok ? "Richtig!" : "Leider falsch."}</p>` +
      (ok ? "" : `<p class="loes">Richtig ist <b>${esc(q.o[q.c])}</b>.</p>`) +
      `<p><span class="elbl">Erklärung</span> ${esc(q.e)}</p></div>`;
    const juror = pick(JURY);
    const weiter = R.i + 1 < R.fragen.length ? "Weiter" : "Zur Laufsteg-Show";
    if (slot.jury) {
      h += juryZeile(juror, ok ? pick(LOB_A.concat(H.LOB || [])) : pick(H.TADEL || ["Die Jury notiert sich das."]));
      h += `<div class="reihe"><button class="btn" id="weiter" type="button">${weiter}</button></div>`;
    } else if (ok) {
      h += juryZeile(juror, pick(LOB_A.concat(H.LOB || [])));
      const aktuell = R.st[slot.key];
      const wahl = mischen(slot.opt.filter((o) => o[0] !== aktuell)).slice(0, 3);
      h += `<p class="hinweis"><b>Ihr Gewinn.</b> Wählen Sie ein Teil aus der Kollektion.</p><div class="wahl">` +
        wahl.map((o) => { const vorschau = Object.assign({}, R.st, { [slot.key]: o[0] }); return `<button class="teil" type="button" data-teil="${o[0]}">${figur(vorschau, slot.vb, "mini")}<span>${esc(o[1])}</span></button>`; }).join("") + "</div>";
    } else {
      R.st[slot.key] = slot.not[0]; R.nots.push(slot.not);
      h += juryZeile(juror, "Notlösung aus dem Fundus. " + slot.not[2]);
      h += `<div class="reihe"><button class="btn" id="weiter" type="button">${weiter}</button></div>`;
      $("buehne").innerHTML = buehne();
    }
    $("nach").innerHTML = h;
    app.querySelectorAll(".teil").forEach((b) => b.onclick = () => {
      R.st[slot.key] = b.dataset.teil; klang("wahl"); naechste();
    });
    const w = $("weiter"); if (w) w.onclick = naechste;
    if (window.matchMedia("(max-width:860px)").matches) $("nach").scrollIntoView({ behavior: "smooth", block: "start" });
  }
  function juryZeile(j, text) {
    return `<div class="jury"><span class="kopf ${j.k}" aria-hidden="true">${j.name.split(" ").map((w) => w[0]).join("")}</span><div class="sprech"><b>${esc(j.name)}, ${esc(j.rolle)}</b>${esc(text)}</div></div>`;
  }
  function naechste() {
    R.i++;
    if (R.i < R.fragen.length) frage(); else show();
  }

  /* ---------- Laufsteg-Show ---------- */
  function show() {
    const c = R.erg.filter((e) => e.ok).length, n = R.erg.length;
    const sterne = c >= 9 ? 3 : c >= 7 ? 2 : c >= 5 ? 1 : 0;
    sterneSpeichern("styling", sterne);
    const stufe = c >= 8 ? "hoch" : c >= 5 ? "mitte" : "tief";
    const noten = JURY.map(() => Math.max(1, Math.min(10, Math.round(2 + c * 0.75 + (Math.random() * 2 - 1)))));
    const urteil = c >= 9 ? "Der Look des Jahres. Titelseite!" : c >= 7 ? "Starker Auftritt. Das reicht für Seite drei." : c >= 5 ? "Solide. Die Rubrik Stilberatung meldet sich." : "Die Jury empfiehlt eine Fortbildung, gerne off the job.";
    const z1 = c >= 7 ? "Stilsicher wie ein Arbeitszeugnis" : c >= 5 ? "Auf dem Weg in den Talentpool" : "Mut zur Lücke, auch beim Wissen";
    const z2 = R.nots.length ? "Mutig mit " + R.nots[0][1] : "Kein einziger Fehlgriff aus dem Fundus";
    const z2s = R.nots.length ? "Die Modepolizei ermittelt" : "Stets zu unserer vollsten Zufriedenheit";
    const div = document.createElement("div");
    div.className = "show"; div.setAttribute("role", "dialog"); div.setAttribute("aria-label", "Laufsteg-Show mit Ergebnis");
    div.innerHTML = `<div class="szene" id="szene"><div class="steg"></div><div class="publikum"></div>${figur(R.st)}
        <div class="cover" id="cover"><div class="mast">NORDSTERN CHIC</div>
        <div class="zeile z1">${esc(z1)}<small>${c} von ${n} Fragen richtig, Tag ${day.nr}</small></div>
        <div class="zeile z2">${esc(z2)}<small>${esc(z2s)}</small></div></div></div>
      <div class="ergebnisse">
        <div class="juryreihe">${JURY.map((j, i) => `<div class="karte"><span class="kopf ${j.k}" aria-hidden="true">${j.name.split(" ").map((w) => w[0]).join("")}</span><div><b>${esc(j.name)}</b><small>${esc(j.rolle)}</small>${esc(pick(j[stufe]))}</div><span class="note" aria-label="Note ${noten[i]} von 10">${noten[i]}</span></div>`).join("")}</div>
        <h2 class="urteil">${esc(urteil)}</h2>
        <p>Sie haben ${c} von ${n} Fragen richtig beantwortet und dafür <span class="sterne">${sterneText(sterne)}</span> bekommen. ${sterne < 3 ? "Ab 9 richtigen Antworten gibt es drei Sterne." : "Mehr Sterne gibt es nicht. Chapeau!"}</p>
        ${R.nots.length ? `<p>Aus dem Fundus kamen ${R.nots.map((x) => esc(x[1])).join(", ")}.</p>` : ""}
        <div class="reihe"><button class="btn" id="nochmal" type="button">Neue Runde</button><button class="btn leise" id="anders" type="button">Model ändern</button><button class="btn leise" id="zumMenue" type="button">Zum Atelier</button></div>
        <h3 class="urteil" style="font-size:1.4rem;margin-top:34px">Alle Fragen mit Erklärung</h3>
        <div class="rueckblick">${R.erg.map((e, i) => `<details${e.ok ? "" : " open"}><summary>Frage ${i + 1}, <span class="${e.ok ? "ok-t" : "nein-t"}">${e.ok ? "richtig" : "falsch"}</span>, ${esc(e.q.q)}</summary><div class="f">${e.ok ? "" : `<p>Ihre Antwort war ${esc(e.q.o[e.gewaehlt])}.</p>`}<p>Richtig ist <b>${esc(e.q.o[e.q.c])}</b>.</p><p><b>Erklärung</b> ${esc(e.q.e)}</p></div></details>`).join("")}</div>
      </div>`;
    document.body.appendChild(div);
    document.body.style.overflow = "hidden";
    const szene = div.querySelector("#szene");
    const blitze = [2300, 2600, 2900, 3150, 3400, 3700];
    blitze.forEach((t, i) => setTimeout(() => {
      const b = document.createElement("div"); b.className = "blitz";
      b.style.left = (8 + Math.random() * 78) + "%"; b.style.top = (40 + Math.random() * 45) + "%";
      szene.appendChild(b); klang("blitz"); setTimeout(() => b.remove(), 700);
    }, t));
    setTimeout(() => { div.querySelector("#cover").classList.add("an"); klang("applaus"); }, 3400);
    div.querySelectorAll(".karte").forEach((k, i) => setTimeout(() => k.classList.add("an"), 3900 + i * 450));
    const schliessen = () => { div.remove(); document.body.style.overflow = ""; };
    div.querySelector("#nochmal").onclick = () => { schliessen(); styling(); };
    div.querySelector("#anders").onclick = () => { schliessen(); modellWahl(); };
    div.querySelector("#zumMenue").onclick = () => { schliessen(); menue(); };
  }

  /* ---------- Lookbook ---------- */
  const DEKO = `<svg class="deko" viewBox="0 0 120 80" aria-hidden="true"><path d="M60 8 Q60 2 66 3 Q72 5 68 12 Q63 16 60 20 L8 58 Q4 62 10 62 L110 62 Q116 62 112 58 L60 20" fill="none" stroke="#b8922a" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
  function maske(x, t) {
    let r = String(x); const kern = String(t).replace(/\s*\(.*?\)\s*/g, " ").trim();
    [t, kern].forEach((w) => { if (w && w.length > 2) r = r.replace(new RegExp(w.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "gi"), "…"); });
    return r;
  }
  let L = null;
  function lookbook() {
    setzeUrl("lookbook"); kopfInfo();
    const karten = mischen(day.lernen || []).slice(0, 10);
    L = { karten, i: 0 };
    blatt();
  }
  function blatt() {
    window.scrollTo(0, 0);
    const k = L.karten[L.i], n = L.karten.length, letzte = L.i === n - 1;
    app.innerHTML = `<div class="heft"><article class="seite">
        <div class="mast2"><b>NORDSTERN CHIC</b><span>Ausgabe Tag ${day.nr}, ${esc(day.title)}</span></div>
        <span class="trend">Trend ${L.i + 1} von ${n}</span>
        <h2>${esc(k.t)}</h2>
        <div class="text">${esc(k.x)}</div>
        ${DEKO}
        <div class="fussz"><span class="blattzahl">Seite ${L.i + 1}</span><span class="reihe" style="margin:0">
          <button class="btn leise" id="zur" type="button"${L.i ? "" : " disabled"}>Zurück</button>
          <button class="btn" id="vor" type="button">${letzte ? "Zum Stilcheck" : "Weiter blättern"}</button></span></div>
      </article><div class="fortschritt"><i style="width:${((L.i + 1) / n) * 100}%"></i></div></div>`;
    $("zur").onclick = () => { if (L.i) { L.i--; klang("klick"); blatt(); } };
    $("vor").onclick = () => { klang("klick"); if (letzte) stilcheck(); else { L.i++; blatt(); } };
    wischen(app.querySelector(".seite"), () => $("vor").click(), () => $("zur").click());
  }
  function wischen(el, links, rechts) {
    let x0 = null;
    el.addEventListener("touchstart", (e) => { x0 = e.touches[0].clientX; }, { passive: true });
    el.addEventListener("touchend", (e) => { if (x0 == null) return; const dx = e.changedTouches[0].clientX - x0; if (Math.abs(dx) > 60) (dx < 0 ? links : rechts)(); x0 = null; });
  }
  function stilcheck() {
    const alle = day.lernen || [];
    L.check = mischen(L.karten).slice(0, Math.min(5, L.karten.length)).map((k) => {
      const andere = mischen(alle.filter((x) => x.t !== k.t)).slice(0, 3).map((x) => x.t);
      return { k, opts: mischen([k.t].concat(andere)) };
    });
    L.ci = 0; L.punkte = 0; L.fehler = [];
    checkFrage();
  }
  function checkFrage() {
    window.scrollTo(0, 0);
    const c = L.check[L.ci];
    app.innerHTML = `<div class="heft"><article class="seite check">
      <div class="mast2"><b>NORDSTERN CHIC</b><span>Stilcheck ${L.ci + 1} von ${L.check.length}</span></div>
      <h2>Welcher Begriff passt zur Beschreibung?</h2>
      <p class="zitat">${esc(maske(c.k.x, c.k.t))}</p>
      <div class="antworten">${c.opts.map((o, k) => `<button class="antwort" type="button" data-o="${esc(o)}"><span class="bu">${BU[k]}</span><span>${esc(o)}</span></button>`).join("")}</div>
      <div id="nach"></div></article></div>`;
    app.querySelectorAll(".antwort").forEach((b) => b.onclick = () => {
      const ok = b.dataset.o === c.k.t; if (ok) L.punkte++; else L.fehler.push(c.k);
      app.querySelectorAll(".antwort").forEach((x) => { x.disabled = true; if (x.dataset.o === c.k.t) x.classList.add("richtig"); else if (x === b) x.classList.add("falsch"); });
      klang(ok ? "richtig" : "falsch");
      const letzte = L.ci + 1 >= L.check.length;
      $("nach").innerHTML = `<div class="erklaerung" style="margin-top:14px"><p class="ergebnis ${ok ? "ok" : "nein"}">${ok ? "Richtig!" : "Leider falsch."}</p>${ok ? "" : `<p class="loes">Richtig ist <b>${esc(c.k.t)}</b>.</p>`}<p><span class="elbl">Erklärung</span> ${esc(c.k.x)}</p></div>` +
        `<div class="reihe"><button class="btn" id="weiter" type="button">${letzte ? "Ergebnis ansehen" : "Nächster Stilcheck"}</button></div>`;
      $("weiter").onclick = () => { L.ci++; if (letzte) lookbookEnde(); else checkFrage(); };
      $("nach").scrollIntoView({ behavior: "smooth", block: "nearest" });
    });
  }
  function lookbookEnde() {
    window.scrollTo(0, 0);
    const n = L.check.length, p = L.punkte;
    const sterne = p >= n ? 3 : p >= n - 1 ? 2 : p >= n - 2 ? 1 : 0;
    sterneSpeichern("lookbook", sterne);
    app.innerHTML = `<div class="heft"><article class="seite">
      <div class="mast2"><b>NORDSTERN CHIC</b><span>Ihr Ergebnis</span></div>
      <span class="trend">Stilcheck abgeschlossen</span>
      <h2>${p} von ${n} sitzen perfekt</h2>
      <div class="text"><p>${sterne === 3 ? "Die Redaktion bietet Ihnen eine eigene Kolumne an." : sterne ? "Gute Ausgabe. Mit einer zweiten Ausgabe sitzen auch die letzten Begriffe." : "Die Redaktion empfiehlt, das Heft noch einmal in Ruhe durchzublättern."} Sie bekommen <span class="sterne">${sterneText(sterne)}</span>.</p>
      ${L.fehler.length ? `<p><b>Noch einmal ansehen</b></p>${L.fehler.map((k) => `<p><b>${esc(k.t)}</b> ${esc(k.x)}</p>`).join("")}` : ""}</div>
      <div class="fussz"><span></span><span class="reihe" style="margin:0"><button class="btn" id="neu" type="button">Neue Ausgabe</button><button class="btn leise" id="zumMenue" type="button">Zum Atelier</button></span></div>
      </article></div>`;
    $("neu").onclick = lookbook; $("zumMenue").onclick = menue;
  }

  /* ---------- Boutique ---------- */
  const VK_OK = ["Die Verkäuferin klatscht leise in die Hände.", "Sitzt, passt, wackelt nicht.", "Perfekt einsortiert, wie eine gepflegte Personalakte.", "Herr Brandt will das Etikett gleich kaufen."];
  const VK_NEIN = ["Die Verkäuferin hängt das Etikett diskret um.", "Knapp daneben ist auch daneben, sagt die Inventur.", "Kein Problem, Umtausch ist hier jederzeit möglich.", "Paula Probezeit hat es zum Glück nicht gefilmt."];
  let B = null;
  function boutique() {
    setzeUrl("boutique"); kopfInfo();
    B = { runden: day.sortier || [], ri: 0, gesamt: 0, richtig: 0, fehler: [] };
    if (!B.runden.length) { app.innerHTML = `<div class="laden"><h1>Boutique geschlossen</h1><p class="auftrag">Für diesen Tag gibt es keine Etiketten.</p><button class="btn" id="zumMenue" type="button">Zum Atelier</button></div>`; $("zumMenue").onclick = menue; return; }
    runde();
  }
  function runde() {
    const r = B.runden[B.ri];
    B.items = mischen(r.items); B.ii = 0; B.haenger = {};
    r.kategorien.forEach((k) => { B.haenger[k.id] = []; });
    etikett();
  }
  function etikett() {
    window.scrollTo(0, 0);
    const r = B.runden[B.ri], it = B.items[B.ii];
    app.innerHTML = `<div class="laden">
      <h1>${esc(r.titel)}</h1>
      <p class="auftrag">Hängen Sie jedes Etikett an die passende Kleiderstange. Runde ${B.ri + 1} von ${B.runden.length}, Etikett ${B.ii + 1} von ${B.items.length}.</p>
      <div class="haken"><div class="buegel"></div><div class="etikett"><small>Neu eingetroffen</small>${esc(it.text)}</div></div>
      <div class="stangen" style="grid-template-columns:repeat(auto-fit,minmax(min(100%,220px),1fr))">${r.kategorien.map((k) => `<button class="stange" type="button" data-k="${esc(k.id)}"><span class="name">${esc(k.name)}</span><span class="rohr"></span><span class="haenger">${B.haenger[k.id].map((f) => `<i class="${f ? "f" : ""}"></i>`).join("")}</span></button>`).join("")}</div>
      <div id="nach" class="verkauf"></div></div>`;
    app.querySelectorAll(".stange").forEach((b) => b.onclick = () => einsortieren(b.dataset.k));
  }
  function einsortieren(kid) {
    const r = B.runden[B.ri], it = B.items[B.ii], ok = kid === it.kat;
    B.gesamt++; if (ok) B.richtig++; else B.fehler.push({ it, r });
    B.haenger[it.kat].push(!ok);
    const name = (r.kategorien.find((k) => k.id === it.kat) || {}).name || "";
    app.querySelectorAll(".stange").forEach((b) => {
      b.disabled = true;
      if (b.dataset.k === it.kat) { b.classList.add("ziel"); b.querySelector(".haenger").insertAdjacentHTML("beforeend", `<i class="${ok ? "" : "f"}"></i>`); }
      else if (b.dataset.k === kid) b.classList.add("fehl");
    });
    klang(ok ? "richtig" : "falsch");
    const letztesItem = B.ii + 1 >= B.items.length, letzteRunde = B.ri + 1 >= B.runden.length;
    const knopf = !letztesItem ? "Nächstes Etikett" : !letzteRunde ? "Zur nächsten Runde" : "Ergebnis ansehen";
    $("nach").innerHTML = `<div class="erklaerung"><p class="ergebnis ${ok ? "ok" : "nein"}">${ok ? "Richtig!" : "Leider falsch."}</p>${ok ? "" : `<p class="loes">Das Etikett gehört an die Stange <b>${esc(name)}</b>.</p>`}<p><span class="elbl">Erklärung</span> ${esc(it.expl)}</p></div>` +
      `<p class="hinweis" style="margin-top:10px">${esc(pick(ok ? VK_OK : VK_NEIN))}</p><div class="reihe"><button class="btn" id="weiter" type="button">${knopf}</button></div>`;
    $("weiter").onclick = () => {
      klang("klick");
      if (!letztesItem) { B.ii++; etikett(); }
      else if (!letzteRunde) { B.ri++; runde(); }
      else boutiqueEnde();
    };
    $("nach").scrollIntoView({ behavior: "smooth", block: "nearest" });
  }
  function boutiqueEnde() {
    window.scrollTo(0, 0);
    const q = B.gesamt ? B.richtig / B.gesamt : 0;
    const sterne = q >= 0.9 ? 3 : q >= 0.75 ? 2 : q >= 0.55 ? 1 : 0;
    sterneSpeichern("boutique", sterne);
    app.innerHTML = `<div class="laden">
      <h1>Inventur abgeschlossen</h1>
      <p class="auftrag">${B.richtig} von ${B.gesamt} Etiketten hingen beim ersten Versuch richtig. Sie bekommen <span class="sterne">${sterneText(sterne)}</span>. ${sterne === 3 ? "Die Boutique bietet Ihnen die Filialleitung an." : "Ab 90 Prozent gibt es drei Sterne."}</p>
      ${B.fehler.length ? `<div class="rueckblick">${B.fehler.map((f) => `<details open><summary>${esc(f.it.text)}</summary><div class="f"><p>Richtig ist <b>${esc((f.r.kategorien.find((k) => k.id === f.it.kat) || {}).name || "")}</b>.</p><p><b>Erklärung</b> ${esc(f.it.expl)}</p></div></details>`).join("")}</div>` : ""}
      <div class="reihe"><button class="btn" id="neu" type="button">Noch einmal sortieren</button><button class="btn leise" id="zumMenue" type="button">Zum Atelier</button></div></div>`;
    $("neu").onclick = boutique; $("zumMenue").onclick = menue;
  }

  /* ---------- Start ---------- */
  document.addEventListener("keydown", (e) => {
    if (L && app.querySelector(".seite #vor") && !app.querySelector(".check")) {
      if (e.key === "ArrowRight") $("vor").click(); else if (e.key === "ArrowLeft") $("zur").click();
    }
    if (/^[1-4]$/.test(e.key)) { const b = app.querySelectorAll(".antwort:not(:disabled)")[+e.key - 1]; if (b) b.click(); }
  });
  $("btnMenue").onclick = (e) => { e.preventDefault(); const s = document.querySelector(".show"); if (s) { s.remove(); document.body.style.overflow = ""; } menue(); };
  tonKnopf(); funkStarten(); kopfInfo();
  window.__atelier = {
    antworte(richtig) { const q = R.fragen[R.i]; const ziel = richtig ? q.c : (q.c + 1) % q.o.length; app.querySelector(`.antwort[data-oi="${ziel}"]`).click(); },
    zustand: () => ({ R, L, B })
  };
  starte(params.get("m"));
})();
