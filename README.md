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
- `videos.js` optionale Video-Links (YouTube, Vimeo)
- `videos/` Ablage für eigene Videodateien

Unterlagen nur für Dozierende (Dozentenübersicht, Lösungen zum Aufgabenheft, Quiz-Lösungen) liegen nicht in diesem Repository.

## Videos hinzufügen

Pro Tag gibt es ein Video zum Vormittag und eins zum Nachmittag. Die Datei in den Ordner `videos` legen und so benennen: `tag03_vormittag.mp4`, `tag03_nachmittag.mp4`, an Tag 10 `tag10_ganztag.mp4`. Die Seite zeigt das Video automatisch bei der passenden Session an, nach etwa einer Minute ist es sichtbar. Details in `videos/README.md`.

Im Browser auf github.com dürfen Dateien höchstens 25 MB groß sein, mit GitHub Desktop oder git höchstens 100 MB. Größere Videos vorher verkleinern oder als YouTube-Link in `videos.js` eintragen.

## Hinweis zum Zugangscode

Der Code schützt die Seite vor zufälligen Besuchern. Weil das Repository öffentlich ist, sind die Dateien technisch trotzdem erreichbar, wenn jemand die genauen Adressen kennt.

© 2026 Waybuild Akademie, Waybuild UG (haftungsbeschränkt). Alle Rechte vorbehalten. www.waybuild.de
