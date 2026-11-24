/* Spielkacheln für Lernseite und Spiele-Hub
   © 2026 Waybuild Akademie, Waybuild UG (haftungsbeschränkt). Alle Rechte vorbehalten. · www.waybuild.de */
(function () {
  "use strict";
  var BILD = {
    stadt: '<svg viewBox="0 0 240 110" preserveAspectRatio="xMidYMid slice" aria-hidden="true"><circle cx="196" cy="30" r="14" fill="#ffd66b"/>' +
      '<g fill="rgba(255,255,255,.88)"><rect x="18" y="38" width="34" height="56" rx="3"/><rect x="58" y="22" width="30" height="72" rx="3"/><rect x="94" y="46" width="40" height="48" rx="3"/><rect x="140" y="30" width="28" height="64" rx="3"/></g>' +
      '<g fill="rgba(47,125,91,.55)"><rect x="24" y="46" width="8" height="8"/><rect x="38" y="46" width="8" height="8"/><rect x="24" y="62" width="8" height="8"/><rect x="38" y="62" width="8" height="8"/><rect x="64" y="30" width="7" height="7"/><rect x="76" y="30" width="7" height="7"/><rect x="64" y="44" width="7" height="7"/><rect x="76" y="44" width="7" height="7"/><rect x="64" y="58" width="7" height="7"/><rect x="100" y="54" width="9" height="9"/><rect x="118" y="54" width="9" height="9"/><rect x="146" y="38" width="7" height="7"/><rect x="156" y="38" width="7" height="7"/><rect x="146" y="52" width="7" height="7"/></g>' +
      '<rect x="0" y="94" width="240" height="16" fill="rgba(0,0,0,.28)"/><g stroke="#fff" stroke-width="3" fill="none"><circle cx="186" cy="88" r="9"/><circle cx="216" cy="88" r="9"/><path d="M186 88 L198 72 L212 72 L216 88 M198 72 L204 88"/></g><rect x="176" y="62" width="22" height="13" rx="2" fill="#ffd66b"/></svg>',
    rennen: '<svg viewBox="0 0 240 110" preserveAspectRatio="xMidYMid slice" aria-hidden="true"><path d="M92 40 L148 40 L236 110 L4 110 Z" fill="rgba(0,0,0,.32)"/>' +
      '<path d="M120 46 L120 56 M120 66 L120 80 M120 92 L120 110" stroke="#fff" stroke-width="4"/><path d="M92 40 L4 110 M148 40 L236 110" stroke="rgba(255,255,255,.7)" stroke-width="3"/>' +
      '<path d="M178 10 L178 62" stroke="#fff" stroke-width="3"/><g><rect x="180" y="10" width="40" height="26" fill="#fff"/>' +
      '<g fill="#222"><rect x="180" y="10" width="8" height="6.5"/><rect x="196" y="10" width="8" height="6.5"/><rect x="212" y="10" width="8" height="6.5"/><rect x="188" y="16.5" width="8" height="6.5"/><rect x="204" y="16.5" width="8" height="6.5"/><rect x="180" y="23" width="8" height="6.5"/><rect x="196" y="23" width="8" height="6.5"/><rect x="212" y="23" width="8" height="6.5"/><rect x="188" y="29.5" width="8" height="6.5"/><rect x="204" y="29.5" width="8" height="6.5"/></g></g>' +
      '<g transform="translate(96 72)"><rect x="0" y="6" width="48" height="16" rx="5" fill="#ffd66b"/><rect x="10" y="0" width="26" height="10" rx="3" fill="#ffd66b"/><circle cx="11" cy="23" r="5" fill="#222"/><circle cx="37" cy="23" r="5" fill="#222"/></g></svg>',
    atelier: '<svg viewBox="0 0 240 110" preserveAspectRatio="xMidYMid slice" aria-hidden="true"><defs><radialGradient id="skLicht" cx="50%" cy="0%" r="80%"><stop offset="0" stop-color="#ffe9d6" stop-opacity=".55"/><stop offset="1" stop-color="#ffe9d6" stop-opacity="0"/></radialGradient></defs>' +
      '<rect width="240" height="110" fill="url(#skLicht)"/><path d="M84 110 L104 84 L136 84 L156 110 Z" fill="rgba(255,240,228,.85)"/>' +
      '<path d="M86 58 L120 30 L154 58 Z" fill="#f3d6c6"/><rect x="92" y="58" width="56" height="34" fill="#fff6ee"/><rect x="113" y="70" width="14" height="22" rx="2" fill="#7b2338"/><rect x="98" y="64" width="10" height="10" fill="#a9d6ef"/><rect x="132" y="64" width="10" height="10" fill="#a9d6ef"/>' +
      '<path d="M120 22 C114 12 102 16 108 25 L120 34 L132 25 C138 16 126 12 120 22 Z" fill="#f39bb0"/>' +
      '<path d="M176 40 Q176 35 181 36 Q185 38 182 43 L176 47 L160 58 L192 58 L176 47" fill="none" stroke="#e8c76a" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>' +
      '<g fill="#e8c76a"><circle cx="40" cy="30" r="2.5"/><circle cx="60" cy="60" r="1.8"/><circle cx="196" cy="34" r="2.5"/><circle cx="206" cy="70" r="1.8"/></g></svg>'
  };

  function katalog(nr, basis) {
    basis = basis || ""; var t = "?tag=" + nr;
    return [
      { id: "stadt", titel: "Nordstern City 3D", text: "Offene 3D-Stadt mit Lastenrad, Verkehr und Comic-Action", farbe: "#2f7d5b", modi: [
        { k: "lernen", titel: "Lern-Tour", text: "Lernpunkte anfahren und die Kernthemen lesen", href: basis + "stadt/index.html" + t + "&m=lernen&start=1" },
        { k: "kurier", titel: "Kurier-Mission", text: "Fragen beantworten und zur richtigen Antwort fahren", href: basis + "stadt/index.html" + t + "&m=kurier&start=1" },
        { k: "logistik", titel: "Lastenrad-Logistik", text: "Pakete mit Aussagen ins richtige Depot bringen", href: basis + "stadt/index.html" + t + "&m=logistik&start=1" },
        { k: null, titel: "Stadt in 2D", text: "Einfache Version für ältere Geräte ohne 3D-Grafik", href: basis + "stadt2d/index.html" + t }
      ] },
      { id: "rennen", titel: "Nordstern Racing", text: "Rennen gegen Herrn Brandt mit Frage-Toren auf der Strecke", farbe: "#b4462a", modi: [
        { k: "rennen", titel: "Rennen starten", text: "3 Runden und etwa 10 Frage-Tore, die richtige Spur gibt Nitro", href: basis + "rennen/index.html" + t + "&start=1" },
        { k: null, titel: "Rennmenü mit Lernmodus", text: "Erst in Ruhe üben, dann Gas geben", href: basis + "rennen/index.html" + t }
      ] },
      { id: "atelier", titel: "Nordstern Leben", text: "Lebenssimulation mit Haus, Job, Liebe, Hochzeit und Familie, dazu das Mode-Atelier", farbe: "#4a1d3f", modi: [
        { k: "leben", titel: "Lebenssimulation", text: "Arbeiten und lernen mit Fragen des Tages, Möbel kaufen, verlieben, heiraten, Kinder", href: basis + "leben/index.html" + t },
        { k: "styling", titel: "Styling-Studio", text: "10 Fragen, jede richtige Antwort bringt ein Teil, dann geht es auf den Laufsteg", href: basis + "atelier/index.html" + t + "&m=styling" },
        { k: "lookbook", titel: "Lookbook", text: "Die Kernbegriffe als Modemagazin, danach der Stilcheck", href: basis + "atelier/index.html" + t + "&m=lookbook" },
        { k: "boutique", titel: "Boutique", text: "Etiketten an die richtige Kleiderstange hängen", href: basis + "atelier/index.html" + t + "&m=boutique" }
      ] }
    ];
  }
  function lesen(k, fallback) { try { return localStorage.getItem(k) || fallback; } catch (e) { return fallback; } }
  function esc(s) { return String(s).replace(/[&<>"]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]; }); }
  function sterne(n) { return "★★★".slice(0, n) + "☆☆☆".slice(0, 3 - n); }

  /* nr = Tag, basis = Pfad zum Ordner spiel/ */
  window.SPIELKACHELN = function (nr, basis) {
    var st = {}; try { st = JSON.parse(lesen("pe26_spiel", "{}")) || {}; } catch (e) { st = {}; }
    var offen = lesen("pe26_spielwahl", "");
    var h = '<div class="sk">';
    katalog(nr, basis).forEach(function (g) {
      var mit = g.modi.filter(function (m) { return m.k; });
      var summe = mit.reduce(function (a, m) { return a + (st[nr + "-" + m.k] || 0); }, 0);
      var auf = offen === g.id;
      h += '<button class="sk-kachel" type="button" style="--sk:' + g.farbe + '" data-sk-id="' + g.id + '" aria-expanded="' + auf + '" aria-controls="sk-p-' + g.id + '">' +
        '<span class="sk-bild">' + BILD[g.id] + "</span>" +
        '<span class="sk-text"><b>' + esc(g.titel) + "</b><small>" + esc(g.text) + '</small><span class="sk-fuss"><span class="sk-sum">' + summe + " von " + mit.length * 3 + ' Sternen</span><span class="sk-auf">' + (auf ? "Schließen" : "Spielarten zeigen") + "</span></span></span></button>";
      h += '<div class="sk-panel" id="sk-p-' + g.id + '" style="--sk:' + g.farbe + '"' + (auf ? "" : " hidden") + ">" +
        g.modi.map(function (m) {
          var n = m.k ? (st[nr + "-" + m.k] || 0) : -1;
          return '<a class="sk-unter" href="' + m.href + '" target="_blank" rel="noopener"><b>' + esc(m.titel) + "</b><small>" + esc(m.text) + '</small><span class="sk-fuss">' +
            (n >= 0 ? '<span class="sk-st" aria-label="' + n + ' von 3 Sternen">' + sterne(n) + "</span>" : '<span class="sk-ohne">ohne Sterne</span>') + '<span class="sk-los">Spielen</span></span></a>';
        }).join("") + "</div>";
    });
    h += '<p class="sk-hinweis"' + (offen ? " hidden" : "") + ">Tippen Sie auf ein Spiel. Darunter erscheinen die Spielarten zur Auswahl.</p></div>";
    return h;
  };
  window.SPIELKACHELN_KLICK = function (btn) {
    var box = btn.closest(".sk"); if (!box) return;
    var id = btn.getAttribute("data-sk-id"), auf = btn.getAttribute("aria-expanded") !== "true";
    box.querySelectorAll(".sk-kachel").forEach(function (b) {
      var mein = b === btn && auf;
      b.setAttribute("aria-expanded", mein ? "true" : "false");
      b.querySelector(".sk-auf").textContent = mein ? "Schließen" : "Spielarten zeigen";
      var p = document.getElementById(b.getAttribute("aria-controls")); if (p) p.hidden = !mein;
    });
    var hw = box.querySelector(".sk-hinweis"); if (hw) hw.hidden = auf;
    try { localStorage.setItem("pe26_spielwahl", auf ? id : ""); } catch (e) {}
    if (auf && window.matchMedia("(max-width:760px)").matches) {
      var p = document.getElementById("sk-p-" + id); if (p) setTimeout(function () { p.scrollIntoView({ behavior: "smooth", block: "nearest" }); }, 30);
    }
  };
  document.addEventListener("click", function (e) {
    var b = e.target.closest && e.target.closest(".sk-kachel"); if (b) window.SPIELKACHELN_KLICK(b);
  });
})();
