/* Lernseite M-023 Personalwesen · Waybuild Akademie */
(function () {
  "use strict";
  var K = window.KURS, V = window.VIDEOS || {};
  var HASH = "4a0a339b0c6d0553897752a84115adc81c75812e1743eb2519258e5000f70deb";
  var app = document.getElementById("app");

  /* ---------- Speicher (falls der Browser ihn sperrt, läuft alles ohne) ---------- */
  function get(k) { try { return localStorage.getItem(k); } catch (e) { return null; } }
  function set(k, v) { try { localStorage.setItem(k, v); } catch (e) {} }
  function del(k) { try { localStorage.removeItem(k); } catch (e) {} }
  var done = {};
  try { done = JSON.parse(get("pe26_done") || "{}") || {}; } catch (e) { done = {}; }
  function saveDone() { set("pe26_done", JSON.stringify(done)); }

  /* ---------- Hilfen ---------- */
  function esc(s) { return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]; }); }
  function pad(n) { return (n < 10 ? "0" : "") + n; }
  function parseDate(s) { var p = s.split("."); return new Date(+p[2], +p[1] - 1, +p[0]); }
  function shortDate(s) { var p = s.split("."); return p[0] + "." + p[1] + "."; }
  var ICON = {
    pres: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="12" rx="2"/><path d="M8 20h8M12 16v4"/></svg>',
    skript: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 3h9l4 4v14H6z"/><path d="M14 3v5h5M9 13h7M9 17h5"/></svg>',
    quiz: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><path d="M9.5 9.5a2.5 2.5 0 1 1 3.5 2.3c-.6.3-1 .9-1 1.6v.6M12 17h.01"/></svg>',
    heft: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 5a2 2 0 0 1 2-2h13v16H6a2 2 0 0 0-2 2z"/><path d="M4 21V5M9 8h6M9 12h6"/></svg>',
    bogen: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M15 4h3v17H6V4h3"/><rect x="9" y="2" width="6" height="4" rx="1"/><path d="M9 11h6M9 15h4"/></svg>',
    video: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="5" width="13" height="14" rx="2"/><path d="m16 10 5-3v10l-5-3z"/></svg>',
    trainer: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2l2.6 6.3 6.4.5-4.9 4.2 1.5 6.5L12 16l-5.6 3.5 1.5-6.5L3 8.8l6.4-.5z"/></svg>'
  };

  /* ---------- Fortschritt ---------- */
  function dayItems(d) {
    var ids = [];
    if (videoList(d.nr).length) ids.push(d.nr + "-video");
    d.sessions.forEach(function (s) { ids.push(d.nr + "-s" + s.nr + "-pres", d.nr + "-s" + s.nr + "-skript", d.nr + "-s" + s.nr + "-quiz"); });
    ids.push(d.nr + "-heft", d.nr + "-ueq1", d.nr + "-ueq2", d.nr + "-ab1", d.nr + "-ab2");
    return ids;
  }
  function progress(d) {
    var ids = dayItems(d), n = 0;
    ids.forEach(function (i) { if (done[i]) n++; });
    return { n: n, total: ids.length };
  }
  function currentDay() {
    var t = new Date(); t.setHours(0, 0, 0, 0);
    var best = K.days[0];
    K.days.forEach(function (d) { if (parseDate(d.date) <= t) best = d; });
    return best;
  }
  function isToday(d) { var t = new Date(); t.setHours(0, 0, 0, 0); return parseDate(d.date).getTime() === t.getTime(); }

  /* ---------- Videos ---------- */
  function videoList(nr) {
    var v = V[nr];
    if (!v) return [];
    if (!Array.isArray(v)) v = [v];
    return v.filter(function (x) { return x && String(x).trim(); });
  }
  function embed(url) {
    url = String(url).trim();
    var m = url.match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/|shorts\/|live\/))([\w-]{6,})/);
    if (m) return '<div class="rahmen"><iframe src="https://www.youtube-nocookie.com/embed/' + m[1] + '?rel=0" title="Video" allow="accelerometer; encrypted-media; gyroscope; picture-in-picture; fullscreen" allowfullscreen loading="lazy"></iframe></div>';
    m = url.match(/vimeo\.com\/(?:video\/)?(\d+)/);
    if (m) return '<div class="rahmen"><iframe src="https://player.vimeo.com/video/' + m[1] + '" title="Video" allow="fullscreen; picture-in-picture" allowfullscreen loading="lazy"></iframe></div>';
    if (/\.(mp4|webm|m4v|mov)(\?|$)/i.test(url)) return '<div class="rahmen"><video controls preload="metadata" playsinline src="' + esc(url) + '"></video></div>';
    return '<p><a href="' + esc(url) + '" target="_blank" rel="noopener">Video öffnen</a></p>';
  }

  /* ---------- Bausteine ---------- */
  function check(id, label) {
    return '<label class="haken" title="Als erledigt markieren"><input type="checkbox" data-id="' + id + '"' + (done[id] ? " checked" : "") +
      '><span></span><b class="sr">' + esc(label) + ' erledigt</b></label>';
  }
  function eintrag(id, icon, href, titel, meta) {
    return '<div class="eintrag' + (done[id] ? " ok" : "") + '"><div class="symbol">' + ICON[icon] + '</div><div class="was">' +
      '<a class="haupt" href="' + href + '" target="_blank" rel="noopener">' + esc(titel) + '</a><div class="meta">' + (meta || "") + '</div></div>' +
      check(id, titel) + "</div>";
  }
  function kopf() {
    return '<header class="kopf"><div class="wrap"><a href="#/" aria-label="Zur Übersicht"><img src="assets/img/waybuild_akademie.png" alt="Waybuild Akademie"></a>' +
      '<div class="kurs"><b>' + esc(K.kurs) + '</b><span>' + esc(K.gruppe) + ", " + esc(K.traeger) + ", " + esc(K.zeitraum) + '</span></div>' +
      '<div class="platz"></div><button class="btn btn-leise" id="abmelden">Abmelden</button></div></header>';
  }
  function fuss() {
    return '<footer class="fuss"><div class="wrap"><span>' + esc(K.copy) + '</span><a href="https://www.waybuild.de" target="_blank" rel="noopener">www.waybuild.de</a></div></footer>';
  }

  /* ---------- Anmeldung ---------- */
  function sha256(text) {
    if (window.crypto && crypto.subtle && window.TextEncoder) {
      return crypto.subtle.digest("SHA-256", new TextEncoder().encode(text)).then(function (b) {
        return Array.prototype.map.call(new Uint8Array(b), function (x) { return ("0" + x.toString(16)).slice(-2); }).join("");
      });
    }
    return Promise.resolve(text === "personal" ? HASH : "");
  }
  function renderLogin(msg) {
    document.title = "Anmelden · Personalwesen M-023";
    app.innerHTML = '<main class="login"><form class="login-blatt" id="lf" autocomplete="off">' +
      '<img src="assets/img/waybuild_akademie.png" alt="Waybuild Akademie">' +
      '<h1>Personalwesen</h1><p>Lernseite für M-023, Industriekaufleute Gruppe C, vom 23.11. bis 04.12.2026.</p>' +
      '<label for="code">Zugangscode</label><input id="code" name="code" type="password" inputmode="text" autocapitalize="none" spellcheck="false" required>' +
      '<div class="fehler" role="alert">' + (msg || "") + '</div><button class="btn btn-blau" type="submit">Lernseite öffnen</button>' +
      '<small>Den Zugangscode bekommen Sie im Unterricht.</small></form></main>';
    var f = document.getElementById("lf");
    document.getElementById("code").focus();
    f.addEventListener("submit", function (e) {
      e.preventDefault();
      var c = document.getElementById("code").value.trim().toLowerCase();
      sha256(c).then(function (h) {
        if (h === HASH) { set("pe26_ok", "1"); route(); }
        else { renderLogin("Der Code stimmt nicht. Bitte noch einmal eingeben."); }
      });
    });
  }

  /* ---------- Übersicht ---------- */
  function renderHome() {
    document.title = "Übersicht · Personalwesen M-023";
    var cur = currentDay();
    var today = isToday(cur);
    var t0 = new Date(); t0.setHours(0, 0, 0, 0);
    var before = t0 < parseDate(K.days[0].date);
    var lead = before ? "Bald geht es los" : (today ? "Heute" : "Zuletzt");
    var h = kopf() + '<main class="wrap">';
    h += '<section class="heute"><div class="gross">Tag ' + cur.nr + '<small>' + lead + ", " + esc(cur.weekday) + " " + esc(cur.date) + '</small></div>' +
      '<div><h2>' + esc(cur.title) + '</h2>' + cur.sessions.map(function (s) { return '<p>' + (cur.klausur ? "Ganztag" : (s.nr === 1 ? "Vormittag" : "Nachmittag")) + ", " + esc(s.title) + '</p>'; }).join("") + '</div>' +
      '<a class="btn" href="#/tag/' + cur.nr + '">Tag ' + cur.nr + ' öffnen</a></section>';

    h += '<h2 class="abschnitt-titel">Kursverlauf</h2><nav class="strecke" aria-label="Alle Unterrichtstage"><ol>';
    K.days.forEach(function (d) {
      var p = progress(d), cls = [];
      if (p.n === p.total) cls.push("fertig"); else if (p.n > 0) cls.push("teil");
      if (d.nr === cur.nr && !before) cls.push("jetzt");
      if (d.klausur) cls.push("klausur");
      h += '<li class="' + cls.join(" ") + '"><a href="#/tag/' + d.nr + '"><span class="punkt">' + d.nr + '</span><span class="datum">' +
        esc(d.weekday.slice(0, 2)) + " " + shortDate(d.date) + '</span><span class="thema">' + esc(d.kurz) + "</span></a></li>";
    });
    h += "</ol></nav>";

    h += '<h2 class="abschnitt-titel">Alle Tage</h2><div class="tagliste">';
    K.days.forEach(function (d) {
      var p = progress(d), pct = Math.round(p.n / p.total * 100);
      h += '<a class="tagkarte" href="#/tag/' + d.nr + '"><span class="nr">' + d.nr + '</span><span class="datum">' + esc(d.weekday) + ", " + esc(d.date) +
        '</span><h3>' + esc(d.title) + '</h3><div><div class="balken"><i style="width:' + pct + '%"></i></div><div class="stand">' +
        p.n + " von " + p.total + " erledigt</div></div></a>";
    });
    h += "</div>";

    h += '<h2 class="abschnitt-titel">Für den ganzen Kurs</h2><div class="kursmaterial">' +
      '<div class="spalte">' + eintrag("kurs-trainer", "trainer", K.kursfiles.trainer, "Quiz-Trainer und Probeklausur", "Alle Fragen aller Tage üben, Probeklausur mit 30 Fragen") + "</div>" +
      '<div class="spalte">' + eintrag("kurs-gesamt", "skript", K.kursfiles.gesamt, "Gesamtskript aller Tage", "Alle Skripte in einer PDF mit Glossar") + "</div></div>";
    h += "</main>" + fuss();
    app.innerHTML = h;
  }

  /* ---------- Tagesansicht ---------- */
  function sessionBlock(d, s) {
    var lab = d.klausur ? "Ganztag" : (s.nr === 1 ? "Vormittag" : "Nachmittag");
    var b = 'd' + d.nr + '-s' + s.nr;
    var h = '<section class="spalte"><header><h2>' + lab + '</h2><span>' + esc(s.title) + "</span></header>";
    h += '<div class="teil"><p class="unter">' + esc(s.subtitle) + "</p>";
    h += eintrag(d.nr + "-s" + s.nr + "-pres", "pres", s.files.pres, "Präsentation",
      s.folien + ' Folien <a href="' + s.files.pres_pdf + '" target="_blank" rel="noopener">als PDF</a>');
    h += eintrag(d.nr + "-s" + s.nr + "-skript", "skript", s.files.skript, "Skript", "zum Nachlesen und Ausdrucken (PDF)");
    h += eintrag(d.nr + "-s" + s.nr + "-quiz", "quiz", s.files.quiz, "Quiz", s.fragen + " Fragen, je 1 oder 2 Antworten richtig");
    h += "</div></section>";
    return h;
  }
  function renderDay(nr) {
    var d = K.days.filter(function (x) { return x.nr === nr; })[0];
    if (!d) { location.hash = "#/"; return; }
    document.title = "Tag " + d.nr + " · " + d.title;
    var prev = K.days.filter(function (x) { return x.nr === nr - 1; })[0];
    var next = K.days.filter(function (x) { return x.nr === nr + 1; })[0];
    var h = kopf() + '<main class="wrap">';
    h += '<nav class="tagnav"><a class="btn btn-leise" href="#/">Übersicht</a><span class="platz"></span>' +
      (prev ? '<a class="btn btn-leise" href="#/tag/' + prev.nr + '">Tag ' + prev.nr + "</a>" : "") +
      (next ? '<a class="btn btn-leise" href="#/tag/' + next.nr + '">Tag ' + next.nr + "</a>" : "") + "</nav>";
    h += '<div class="tagkopf"><div class="gross">Tag ' + d.nr + '</div><div><h1>' + esc(d.title) + "</h1><p>" + esc(d.weekday) + ", " + esc(d.date) +
      (d.klausur ? ", Klausurtag" : "") + "</p></div></div>";

    if (d.ziele.length) {
      h += '<details class="ziele"><summary>Das lernen Sie heute</summary><ul>' + d.ziele.map(function (z) { return "<li>" + esc(z) + "</li>"; }).join("") +
        "</ul>" + (d.merksatz ? '<div class="merksatz">' + esc(d.merksatz) + "</div>" : "") + "</details>";
    }

    var vids = videoList(d.nr);
    h += '<section class="spalte video-block"><header><h2>Video</h2><span>' + (vids.length ? "Zum Tag " + d.nr : "kommt noch") + "</span>" +
      (vids.length ? check(d.nr + "-video", "Video") : "") + '</header><div class="video">';
    if (vids.length) { h += '<div class="mehr">' + vids.map(embed).join("") + "</div>"; }
    else { h += '<div class="folgt"><div><b>Das Video zu Tag ' + d.nr + ' folgt</b>Es erscheint hier, sobald es hochgeladen ist.</div></div>'; }
    h += "</div></section>";

    h += '<div class="zweispaltig' + (d.sessions.length === 1 ? " eins" : "") + '">' + d.sessions.map(function (s) { return sessionBlock(d, s); }).join("") + "</div>";

    var u = d.ueb, m = d.ueb_meta;
    h += '<section class="spalte frei"><header><h2>Freiwillig üben</h2><span class="marke">freiwillig</span><span>zur Vertiefung und zum Üben zu Hause</span></header><div class="freigitter">';
    h += '<div>' + eintrag(d.nr + "-heft", "heft", d.heft.file, d.klausur ? "Aufgabenheft Klausurtraining" : "Aufgabenheft des Tages",
      d.heft.aufgaben + " Aufgaben und eine Fallstudie, etwa " + d.heft.minuten + " Minuten");
    h += eintrag(d.nr + "-ueq1", "quiz", u.ueq1, "Übungsquiz 1, Grundlagen und Begriffe", "60 neue Fragen online");
    h += eintrag(d.nr + "-ueq2", "quiz", u.ueq2, "Übungsquiz 2, Anwendung und Fälle", "60 neue Fragen mit Rechnungen und Fällen") + "</div>";
    h += '<div>' + eintrag(d.nr + "-ab1", "bogen", u.ab1, "Aufgabenbogen 1, Verständnis und Begriffe",
      m.ab1 + ' offene Fragen, etwa ' + m.ab1min + ' Minuten <a href="' + u.ab1l + '" target="_blank" rel="noopener">Lösung</a>');
    h += eintrag(d.nr + "-ab2", "bogen", u.ab2, "Aufgabenbogen 2, Fälle und Transfer",
      m.ab2 + ' offene Fragen, etwa ' + m.ab2min + ' Minuten <a href="' + u.ab2l + '" target="_blank" rel="noopener">Lösung</a>') + "</div>";
    h += "</div></section>";

    h += '<nav class="tagnav unten">' + (prev ? '<a class="btn btn-leise" href="#/tag/' + prev.nr + '">Zurück zu Tag ' + prev.nr + "</a>" : "") +
      '<span class="platz"></span>' + (next ? '<a class="btn btn-blau" href="#/tag/' + next.nr + '">Weiter zu Tag ' + next.nr + "</a>" : '<a class="btn btn-blau" href="#/">Zur Übersicht</a>') + "</nav>";
    h += "</main>" + fuss();
    app.innerHTML = h;
    window.scrollTo(0, 0);
  }

  /* ---------- Steuerung ---------- */
  function route() {
    if (get("pe26_ok") !== "1") { renderLogin(); return; }
    var m = location.hash.match(/^#\/tag\/(\d+)/);
    if (m) renderDay(+m[1]); else renderHome();
  }
  app.addEventListener("change", function (e) {
    var t = e.target;
    if (t && t.matches('input[type="checkbox"][data-id]')) {
      if (t.checked) done[t.dataset.id] = 1; else delete done[t.dataset.id];
      saveDone();
      var row = t.closest(".eintrag"); if (row) row.classList.toggle("ok", t.checked);
    }
  });
  app.addEventListener("click", function (e) {
    var a = e.target.closest("a.haupt");
    if (a) {
      var row = a.closest(".eintrag"), box = row && row.querySelector("input[data-id]");
      if (box && !box.checked) { box.checked = true; done[box.dataset.id] = 1; saveDone(); row.classList.add("ok"); }
    }
    if (e.target.id === "abmelden") { del("pe26_ok"); location.hash = "#/"; renderLogin(); }
  });
  window.addEventListener("hashchange", route);
  route();
})();
