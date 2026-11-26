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

  /* nr = Tag, basis = Pfad zum Ordner spiel/. Seit dem Umbau gibt es nur noch ein Spiel, Nordstern Leben als offene Welt. */
  var BEREICHE = [["leben", "Leben und Beruf"], ["rennen", "Rennstrecke"], ["kurier", "Kurierjob"], ["styling", "Laufsteg"]];
  window.SPIELKACHELN = function (nr, basis) {
    var st = {}; try { st = JSON.parse(lesen("pe26_spiel", "{}")) || {}; } catch (e) { st = {}; }
    var summe = 0; BEREICHE.forEach(function (b) { summe += st[nr + "-" + b[0]] || 0; });
    var href = basis + "leben/index.html?tag=" + nr;
    return '<div class="sk-eins" style="--sk:#4a1d3f">' +
      '<a class="sk-held" href="' + href + '" target="_blank" rel="noopener"><span class="sk-bild">' + BILD.atelier + BILD.stadt + BILD.rennen + '</span></a>' +
      '<div class="sk-info"><b class="sk-titel">Nordstern Leben</b>' +
      '<p>Eine offene Welt zum Thema des Tages. Arbeiten, lernen, einkaufen, Auto fahren, Rennen fahren, einen Laden eröffnen, verlieben, heiraten, Familie gründen und mit dem Hund Gassi gehen. Geld und Fortschritt gibt es für richtige Antworten, immer mit Lösung und Erklärung.</p>' +
      '<ul class="sk-teile">' + BEREICHE.map(function (b) { var n = st[nr + "-" + b[0]] || 0; return "<li><span>" + esc(b[1]) + '</span><span class="sk-st" aria-label="' + n + ' von 3 Sternen">' + sterne(n) + "</span></li>"; }).join("") + "</ul>" +
      '<div class="sk-fuss"><span class="sk-sum">' + summe + " von " + BEREICHE.length * 3 + ' Sternen für Tag ' + nr + '</span><a class="sk-los gross" href="' + href + '" target="_blank" rel="noopener">Spiel starten</a></div>' +
      '<p class="sk-klein">Steuerung mit Maus oder Finger, Pfeiltasten oder WASD. Für ältere Geräte ohne 3D-Grafik gibt es die <a href="' + basis + 'stadt2d/index.html?tag=' + nr + '" target="_blank" rel="noopener">einfache Version in 2D</a>.</p></div></div>';
  };
  window.SPIELKACHELN_KLICK = function () {};
})();
