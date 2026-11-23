# Lernseite M-023 Personalwesen (bfw, Industriekaufleute Gruppe C)

Lernseite für den Kurs vom 23.11. bis 04.12.2026, erstellt von der Waybuild Akademie.

Aufruf über GitHub Pages: https://cansi798.github.io/bfw_Personal/
Zugangscode: personal

## Aufbau

- `index.html` Startseite mit Zugangscode, Kursverlauf, allen Tagen und aufklappbarer Navigationsleiste links (am Handy über das Menü)
- `tage/tagNN/` alle Unterlagen eines Tages
  - Vormittag und Nachmittag je mit Präsentation (HTML und PDF), Skript und Quiz (Tag 10 Ganztag)
  - freiwillig mit Aufgabenheft, Übungsquiz 1 und 2, Aufgabenbogen 1 und 2 mit Lösungen
- `kurs/` Quiz-Trainer mit Probeklausur und Gesamtskript
- `videos.js` Videos je Tag
- `videos/` Ablage für eigene Videodateien

Unterlagen nur für Dozierende (Dozentenübersicht, Lösungen zum Aufgabenheft, Quiz-Lösungen) liegen nicht in diesem Repository.

## Video zu einem Tag hinzufügen

1. `videos.js` öffnen und bearbeiten (auf GitHub mit dem Stift-Symbol).
2. Beim richtigen Tag den Link eintragen, zum Beispiel `3: "https://youtu.be/abc123",`
3. Speichern (Commit). Nach etwa einer Minute ist das Video auf der Seite.

Möglich sind YouTube-Links (auch „nicht gelistet“), Vimeo-Links oder eigene Dateien wie `videos/tag03.mp4`. Dateien auf GitHub dürfen höchstens 100 MB groß sein, für längere Videos daher YouTube nicht gelistet verwenden. Mehrere Videos an einem Tag als Liste `["link1", "link2"]`.

## Hinweis zum Zugangscode

Der Code schützt die Seite vor zufälligen Besuchern. Weil das Repository öffentlich ist, sind die Dateien technisch trotzdem erreichbar, wenn jemand die genauen Adressen kennt.

© 2026 Waybuild Akademie, Waybuild UG (haftungsbeschränkt). Alle Rechte vorbehalten. www.waybuild.de
