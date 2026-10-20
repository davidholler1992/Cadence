# Cadence – Befunde der Code-Durchsicht

Legende: ✔ = per Skript nachgestellt und bestätigt · ◐ = nach Code-Lage sehr wahrscheinlich, bitte kurz testen

Die Befunde 1–8 aus ARCHITEKTUR.md (Abschnitt 7) gelten weiter und stehen hier nicht noch einmal.

---

## A. Datenverlust und Fehlverhalten (zuerst beheben)

| # | Datei | Befund | Folge | Lösungsansatz |
|---|---|---|---|---|
| A1 ✔ | inline-tasks | `FIELD_REGEX` endet am ersten `]`. `[parent:: [[Projekt]]]` wird als `parent="[[Projekt"` gelesen, der Rest `]]` landet im Text | Wikilink im Feld `parent` ist nach dem ersten Umschreiben der Zeile kaputt, Text bekommt `]]` | Parser mit Klammer-Zählung statt Regex |
| A2 ✔ | inline-tasks | Tags werden **vor** dem Entfernen der Felder gesucht. `[description:: Agenda #wichtig]` erzeugt den Tag `wichtig` | Tag landet doppelt in der Zeile (einmal als Tag, einmal in der Beschreibung). `#termin` in einer Beschreibung würde den Typ ändern | Erst Felder entfernen, dann Tags suchen |
| A3 ✔ | inline-tasks | `[[Notiz#Abschnitt]]` im Text: `#Abschnitt` gilt als Tag und wird aus dem Link gelöscht (`[[Notiz]]`) | Links mit Überschrift werden beim Umschreiben verändert | Tags nur außerhalb von `[[…]]` und `[…](…)` erkennen |
| A4 ✔ | inline-tasks | Fremde Felder (`[due:: …]` von Tasks/Dataview) werden beim Umschreiben **gelöscht**. Eine vorhandene Block-ID `^abc123` rutscht in die Mitte der Zeile | Verlust von Daten und kaputte Block-Verweise | Unbekannte Felder und Block-ID unverändert mitführen |
| A5 ✔ | inline-tasks | `TAG_REGEX` erkennt keine Umlaute (`#Übung`) | Tag bleibt im Text stehen und wird nicht als Tag geführt | Unicode-fähige Regex (`\p{L}`) |
| A6 ◐ | inline-task-modal | Das Feld „Notiz“ ist eine Textarea. Ein Zeilenumbruch darin wird in die Zeile geschrieben | Inline-Zeile bricht in mehrere Zeilen auseinander | Umbrüche beim Bauen durch `\n`-Escape ersetzen |
| A7 ◐ | caldav-sync | Der Lese-Sync überschreibt bei jedem Lauf `start, end, rrule, location, description, reminder` aus dem Server-Stand, ohne ETag-Vergleich oder Prüfung auf lokale Änderungen | Noch nicht hochgeladene lokale Änderungen gehen verloren. Bei Serien springt `start` nach dem Abhaken zurück auf den Server-DTSTART. Alle Notizen werden bei jedem Sync neu geschrieben (mtime) | Nur aktualisieren, wenn sich der ETag geändert hat **und** die Notiz lokal nicht „dirty“ ist |
| A8 ◐ | caldav-sync | Gepushte **Inline-Termine** kommen beim nächsten Lese-Sync als neue volle Notiz zurück, denn `findExistingNoteByUid` kennt nur Notizen | Doppelte Einträge mit gleicher UID (Notiz plus Inline-Zeile), beide Sync-Maps verweisen auf denselben Termin | UIDs aus `inlineCaldavSync` beim Lese-Sync überspringen |
| A9 ◐ | caldav-sync | `findExistingNoteByUid` sucht nur im `calendarFolder` | Termin-Notizen in anderen Ordnern oder verschobene Notizen werden beim Sync dupliziert | UID-Suche über alle verwalteten Ordner (ein UID-Index) |
| A10 ◐ | caldav-write | Ein Update ersetzt den **ganzen** Server-Termin durch ein neu gebautes VEVENT | Alles, was Cadence nicht kennt, geht am Server verloren: EXDATE, verschobene Einzeltermine, Teilnehmer, URL, Kategorien, Anhänge, eigene Erinnerungstexte | Vor dem Update das aktuelle ICS laden und nur bekannte Eigenschaften austauschen. Alternativ „Vollständig“ nur für selbst angelegte Termine erlauben |
| A11 ◐ | caldav-inline-push | Inline-Push sendet das **vorgesprungene** `start` als DTSTART (Notizen nutzen dafür `seriesStart`). Zusätzlich ist `COUNT` lokal heruntergezählt | Nach dem Abhaken wandert die Server-Serie nach vorn, ihre Historie geht verloren, `COUNT` am Server schrumpft | `anchorStart ?? start` als DTSTART, `COUNT` nicht mehr verändern (siehe B1) |
| A12 ◐ | main.ts | `getManagedFolders()` = `taskFolders + calendarFolder`. Wird `calendarFolder` im Einstellungsfeld **geleert**, gilt `startsWith("")` für **jede** Datei | `ensureUID` schreibt `uid:` in jede Notiz des Vaults | Leere Pfade ignorieren, Ordnervergleich mit `/` am Ende |
| A13 ◐ | main.ts | `terminCreateFolders` ist nicht Teil der verwalteten Ordner | Termine, die dort angelegt werden (außerhalb von `calendarFolder`), bekommen keine UID, erscheinen in keiner Query und werden nie gepusht | Ordner in die verwalteten Ordner aufnehmen oder in den Einstellungen validieren |
| A14 ✔ | task-engine / inline-tasks | `COUNT` wird bei jedem Sprung **ab dem aktuellen Start** neu gezählt. Bei Notizen endet `COUNT=3` nie (Test: nach 5 Schritten immer noch nächstes Datum) | Endliche Serien enden nie | `COUNT` aus der Historie ableiten (siehe B1) |
| A15 ✔ | überall | „heute“ per `toISOString()` ist UTC. Test: 00:30 Uhr MESZ ergibt den Vortag | Falsches Abhak-Datum und falsches „heute“ im Kalender nachts | Lokales Datum, ein `today()` |

## B. Logik und Widersprüche

| # | Befund | Vorschlag |
|---|---|---|
| B1 | **COUNT wird in der rrule heruntergezählt** (nur Inline). Dadurch kürzt die Anker-Rekonstruktion in calendar-occurrences die vergangenen Vorkommen. Beispiel: `COUNT=5`, 3 erledigt, rrule steht auf `COUNT=2`, es werden nur 2 von 3 vergangenen Terminen angezeigt. Zusätzlich verändert es den an den Server gesendeten Wert | `COUNT` bleibt unverändert. Serie ist beendet, wenn `completed+skipped ≥ COUNT` |
| B2 | Vorschau und Vorausberechnung im Kalender ignorieren UNTIL/COUNT bei MONTHLY/YEARLY ohne BYDAY (Anker-Pfad prüft sie nicht) | Zentral in `advanceSeries`/`next-occurrence` prüfen |
| B3 | `rrule` wird teils mit, teils ohne `RRULE:`-Präfix gespeichert (`updatedRrule` liefert ein Präfix, README sagt „ohne“) | Beim Schreiben immer normalisieren (ohne Präfix) |
| B4 | `X-ANCHORDAY` bricht rrule.js (✔ „Unknown RRULE property“), sobald später z. B. `BYDAY` ergänzt wird | Vor `rrulestr` alle `X-*` entfernen |
| B5 | `allday` ist bei Notizen ein eigenes Feld, bei Inline aus `start` abgeleitet. Widersprüche (`allday: true` plus Uhrzeit) erzeugen ein kaputtes ICS | `start`-Format ist maßgeblich, `allday` nur noch daraus ableiten |
| B6 | „Übersprungen“: Inline hat den Zustand `[-]`, bei Notizen bleibt ein übersprungenes **einmaliges** Todo für immer „offen“ | Ableiten: `!rrule && skipped.length>0 && !done` = übersprungen (kein neues Feld nötig) |
| B7 | Rückgängig (Checkbox zurück) entfernt den Eintrag in `completed` nicht. Wechsel `[-]`→`[x]` wird nicht gezählt, `skipped` bleibt stehen | Klares Modell: Historie nur bei echtem Übergang, Rückgängig entfernt den heutigen Eintrag |
| B8 | Query ignoriert Wiederholungen (filtert nur auf das gespeicherte `start`), der Kalender zeigt sie. `date:`-Filter und Kalender widersprechen sich | Query auf `expandOccurrences` aufsetzen oder im README klar benennen |
| B9 | Schnellerfassung und Hochstufen setzen den Tag `kalender/<slug>` nicht (Termin-Dialog und Sync schon). Schnellerfassung ignoriert die Ordnerauswahl und nimmt immer den ersten Ordner | Eine gemeinsame `createNote()`-Funktion |
| B10 | Notiz-Todos verlangen ein Datum („Bitte ein Datum eingeben“), Inline-Todos nicht | Entscheiden: Datum optional überall? |
| B11 | Dauer: Dialoge verlangen Ende-Datum **und** -Uhrzeit, ohne Ende-Datum wird die Endzeit stillschweigend ignoriert. Schnellerfassung nutzt „Dauer“ | Überall „Dauer in Minuten“ als Eingabe |
| B12 | Ordnervergleiche per `startsWith` ohne `/`: `01_Tasks` passt auch auf `01_Tasks Archiv`. Betrifft verwaltete Ordner, Inline-Ordner, `excludeFolders`, Archivordner | Eine `isInFolder(path, folder)`-Funktion |
| B13 | UIDs sind nicht eindeutig geschützt: eine Notiz kopieren oder eine Inline-Zeile duplizieren ergibt dieselbe UID (und teilt sich Sync-Eintrag und Zustandsspeicher). Außerdem nur 4 Hex-Zeichen pro Tag | Doppelte UIDs beim Scan erkennen und neu vergeben, längere UID |
| B14 | Auto-Konflikt: `pushTermin` entfernt nach dem Anlegen den Tag `lokal` (ändert die Datei) **nach** dem Speichern von `lastPushedMtime`. Die Notiz gilt danach als geändert und wird einmal unnötig erneut gepusht | `lastPushedMtime` erst nach dem Tag-Entfernen setzen |
| B15 | Inline-Push sendet bei jeder Änderung **alle** Termine der Datei erneut (ein PUT pro Termin) | Hash des ICS pro Eintrag speichern, nur bei Änderung senden |
| B16 | Schreibpfad der Notizen liest `start`/`end` aus dem metadataCache (kann veraltet sein), obwohl dieselbe Datei an anderer Stelle bewusst cache-frei gelesen wird. Zwei schnelle Verschiebungen können falsch rechnen | In `processFrontMatter` mit den dortigen `data`-Werten rechnen |
| B17 | Reentrancy-Guards (`processingChangedFiles`) wirken kaum: die „changed“-Events der eigenen Schreibvorgänge kommen erst **nach** dem `finally`. Geschützt wird nur durch Idempotenz | Guards entfernen, Handler idempotent halten und testen |
| B18 | Mehrgeräte-Sync (iCloud Drive/Sync): kommt der Zwischenzustand `done:true` auf einem zweiten Gerät an, kann der Sprung doppelt laufen | Sprung idempotent machen (z. B. nicht, wenn `completed` heute schon enthalten ist und `start` bereits > heute) |
| B19 | `vault.on("create")` wird direkt in `onload` registriert. Laut API feuert es beim Laden **für jede vorhandene Datei** (obsidian.d.ts, `Vault.on('create')`) | In `onLayoutReady` registrieren |
| B20 | `ensureUID` im Start-Scan schreibt ohne vorherige Prüfung des Caches und betrifft jede Datei im Ordner (auch Notizen ohne `type`) | Nur Dateien mit `type: todo/termin`, vorher im Cache prüfen |
| B21 | `rename`-Handler liest **jede** umbenannte Datei des Vaults per `vault.read` (auch PNG/PDF) | Nur `extension === "md"` |
| B22 | Löschsynchronisation hat keine Sicherung: Löscht oder verschiebt ein Sync-Dienst (z. B. iCloud Drive) eine Datei kurz, wird der Server-Termin gelöscht. Zeile ausschneiden und woanders einfügen = löschen + neu anlegen | Verzögerte Löschung mit erneuter Prüfung, Obergrenze pro Lauf, Hinweis |
| B23 | `autoPushDebounceSeconds` wirkt nur für neu angelegte Debouncer (Wert wird beim Erzeugen fixiert). Map wächst pro Datei unbegrenzt. Es gibt kein `onunload` | Debouncer zentral, bei `onunload` abbrechen |
| B24 | `getCreds()` zeigt bei fehlendem Passwort bei jedem stillen Auto-Push eine Notice | Stille Variante ohne Notice |
| B25 | `window.addEventListener("mousemove"/"mouseup")` in Resize-Griffen: in Pop-out-Fenstern ist `window` das falsche Fenster (API: `el.win`/`el.doc`) | `block.win` verwenden |
| B26 | Unterer Resize-Griff ruft `suppressClicksBriefly()` **nicht** auf (oberer schon). Danach kann der Klick die Schnellerfassung oder die Quelle öffnen | Beide Griffe gleich behandeln |
| B27 | Bei jedem Neurendern wird das Zeitraster auf `startHour` zurückgescrollt | scrollTop vor dem Leeren merken, danach setzen |
| B28 | Query-/Kalender-Links nutzen `href`, Obsidians Linkbehandlung liest `data-href` | `data-href` setzen oder `openLinkText` im Klick |
| B29 | `buildQuerySource`/`buildCalendarEmbedSource` schreiben Werte ungequotet. `calendar: Team #1` oder `Arbeit: Projekt` bricht das YAML | Werte bei Bedarf quoten |
| B30 | `COUNT`/Wiederholung bei Abhaken **in der Vergangenheit überfälliger** Serien: ein täglicher Termin, der 5 Tage überfällig ist, springt nur um einen Tag und bleibt überfällig | Entscheidung: bewusst so (Rhythmus) oder optionaler „aufholen“-Modus |
| B31 | Bearbeiten-Befehle für Query und Kalender suchen den Codeblock mit ~50 kopierten Zeilen. Steht der Cursor auf der schließenden Zeile, wird er nicht gefunden | Ein Helfer `findCodeBlockAtCursor(editor, lang)` |
| B32 | Wochen-Notiz-Format (Periodic Notes, `ww`) ist locale-abhängig, die KW-Anzeige im Grid ist ISO. In nicht-deutschen Locales können sie abweichen | Dokumentieren oder Format prüfen |

## C. Performance und Robustheit

| # | Befund | Vorschlag |
|---|---|---|
| C1 | Jede Query, jeder Kalender-Block und die Kalender-Ansicht scannen bei **jedem** „changed“-Event (auch für unbeteiligte Dateien) alle Inline-Dateien neu. N offene Blöcke = N Voll-Scans | Zentraler `ItemStore` mit Index pro Datei, nur bei relevanten Dateien invalidieren |
| C2 | `buildForwardOccurrences` ruft pro Schritt `rrulestr` neu auf (bis 2000×). Überfällige Serien kosten viel | Ein Regelobjekt, `rule.between(...)`, Anker-Pfad separat |
| C3 | Lese-Sync prüft pro bekanntem Termin außerhalb des 60-Tage-Fensters per GET die Existenz (bei jedem Lauf) | Nur prüfen, wenn der Termin vorher im Fenster war oder selten (Zeitstempel) |
| C4 | Weitere iCloud-Eigenheiten: Zeiten mit `Z` werden als lokale Zeit gelesen, `EXDATE`/`RECURRENCE-ID` werden ignoriert, Trigger `-P1W` wird als 0 Minuten gelesen | Bekannte Lücken im README führen, später angehen |
| C5 | `foldLine`: Fortsetzungszeilen zählen das führende Leerzeichen nicht mit (bis 76 statt 75 Oktette) | `byteCount = 1` nach dem Umbruch |
| C6 | `calendar:` speichert den Anzeigenamen. Umbenennen in Apple Kalender oder doppelte Namen brechen die Zuordnung (auch `calendarColors`) | Intern über `href`, Anzeigename nur zur Anzeige |

## D. Doku, Build, Veröffentlichung

| # | Befund | Vorschlag |
|---|---|---|
| D1 | Veraltete Kommentare: README „Inline-Push noch nicht gebaut“, calendar-view „Schnellerfassung nicht verdrahtet“, calendar-render „Drag & Drop nicht Teil“, query-engine nennt `query-live-preview.ts` (existiert nicht), esbuild-Banner nennt nur `main.ts/task-engine.ts` | Wandert in den Neubau ohnehin raus |
| D2 | `build` führt **keinen Typcheck** aus (esbuild prüft keine Typen) | `"build": "tsc -noEmit -skipLibCheck && node esbuild.config.mjs production"` |
| D3 | `package.json` verlangt `obsidian ^1.5.7`, der Code braucht `secretStorage` (1.11.4). `tslib` fehlt als eigene Abhängigkeit (`importHelpers: true`) | `obsidian ^1.11.4`, `tslib` ergänzen |
| D4 | esbuild-`target` es2018, tsconfig ES2020. `calendar-render` begründet, `moment` sei nicht aufrufbar, `periodic-notes-bridge` ruft es trotzdem auf | Einheitlich ES2020, Moment-Verwendung prüfen und einheitlich lösen |
| D5 | Für GitHub/Community-Plugin fehlen: `versions.json`, LICENSE, Release-Workflow. Viele `console.log` mit Antwort-Headern und ICS-Inhalten, durchgehend `element.style.*` (besser CSS-Klassen/`setCssProps`) | Log-Level-Schalter, Styles in `styles.css` |
| D6 | Passwort-Eingabe: eigenes Textfeld plus `setSecret` bei jedem Tastendruck. Die API bietet `SecretComponent` (ab 1.11.1) | `SecretComponent` verwenden |
| D7 | Obsidian 1.13 kennt deklarative Einstellungen (`getSettingDefinitions`, Gruppen, Listen). Würde den Settings-Tab (~400 Zeilen) stark verkürzen, hebt aber `minAppVersion` auf 1.13 | Entscheidung für Phase 5 |

---

## Priorisierung für den Umbau

1. **Beim Neubau automatisch gelöst:** A14, A15, B1–B5, B9, B12, B16, B17, B25–B28, C2, C5
2. **Vor dem Neubau am Altcode zu entscheiden/zu testen** (betrifft echte Daten): A7, A8, A10, A11, A12, A13
3. **Eigene Arbeitspakete:** `ItemStore` (C1), Inline-Parser (A1–A5), Sync-Strategie (A7–A10, B15, B22)
