# Cadence

Ein Task- und Terminmanagement-Plugin für Obsidian: Aufgaben und Termine als eigene Notizen oder direkt als Zeile im Text, mit Synchronisation zum iCloud-Kalender (CalDAV).

> Status: Neubau in Arbeit. Architektur und Plan: [docs/ARCHITEKTUR.md](docs/ARCHITEKTUR.md)

## Entwickeln

Einmalig einrichten:

1. `npm install` ausführen (holt die Abhängigkeiten).
2. `lokal.config.beispiel.json` nach `lokal.config.json` kopieren und `ausgabeOrdner` auf den Plugin-Ordner im Vault setzen (Pfad ohne Backslashes, Leerzeichen sind erlaubt). Die Datei ist in der `.gitignore` und kommt nie ins Repository.

Im Alltag:

```
npm run dev         # baut bei jeder Änderung neu in den Plugin-Ordner des Vaults
npm test            # führt alle Tests einmal aus
npm run test:watch  # Tests laufen mit und melden sich bei jeder Änderung
npm run build       # geprüfter Produktions-Build
```

Der Build legt `main.js`, `manifest.json` und `styles.css` im `ausgabeOrdner` ab. Ohne `lokal.config.json` wird in den Projektordner gebaut, Obsidian sieht das Plugin dann nicht.