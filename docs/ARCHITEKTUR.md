# Cadence – Architektur & Umbauplan (Phase 0)

Status: **Entwurf zur Diskussion**. Es wird noch kein Code verschoben.

---

## 1. Ziele

1. Eine Datei = ein Gedanke (grob 40–150 Zeilen).
2. Reine Logik (Datum, Wiederholung, Text) kennt Obsidian nicht.
3. Jede Logik existiert genau **einmal**. Notiz und Inline-Item nutzen dieselbe Serien-Logik.
4. Kommentare erklären *was* und *warum* für Einsteiger. Entstehungsgeschichte steht in `docs/ENTSCHEIDUNGEN.md`.
5. Bestehende Vault-Daten und Server-Zuordnungen bleiben unverändert nutzbar.

## 2. Arbeitsregeln (neu, zur Abstimmung)

| Alt | Neu (Vorschlag) |
|---|---|
| task-engine, caldav-*, task-create-modal dürfen nie angefasst werden | **Entfällt.** Git schützt uns. Dafür gilt: pro Phase ein Branch, pro Schritt ein Commit |
| Immer komplette Dateien | Neue/stark geänderte Dateien **komplett**. Kleine Änderungen (<10 Zeilen) als „suche diese Stelle, ersetze durch …“ |
| Große Schritte | Pro Schritt max. 3–6 Dateien, danach Build + Test + Commit |
| Kommentare mit „Chat-Absprache“ | Fester Dateikopf (Was / Warum / Beispiel) |

## 3. Zielstruktur

Maßgeblich ist der tatsächliche Ordnerbaum im Repo. Hier steht der Plan mit den deutschen Namen.

```
src/
  main.ts                    Verdrahtung, ~50 Zeilen
  kennungen.ts               feste Namen (Ansichtstyp, Codeblock-Namen, Passwort-ID, Marker-Tags)
  kern/                      reine Logik, KEIN obsidian-Import
    datum/                   datum-als-text · heute · tage-addieren · uhrzeit · dauer · kalenderwoche
    wiederholung/            naechstes-vorkommen · anker-kappung · serienende · rrule-text
    serie/                   serie-weiterschalten      ← die EINE Abhaken/Überspringen-Logik
    text/                    dateiname · kuerzel
  modell/                    einheitlicher-eintrag · aus-notiz · aus-inline
  quellen/
    quelle.ts                gemeinsame Schnittstelle (siehe 4.2)
    notizen/                 lesen · abhaken · ueberspringen · verschieben · anlegen
    inline/                  zeile-lesen · zeile-bauen · scannen · uid · abhaken · verschieben · hochstufen
  caldav/
    client/                  anmeldung · kalender-finden · termine-laden · ics-lesen
    schreiben/               ics-bauen · anlegen · aendern · loeschen · existiert
    abgleich/                lesen-abgleichen · notiz-senden · inline-senden · loeschungen · abgleich-karte
  abfrage/                   filter-typen · lesen · bauen · trifft-zu · sortieren · ausfuehren · tabelle-zeichnen · codeblock
  kalender/
    vorkommen/               echt · vorausberechnet · vergangen-mit-anker · berechnen
    render/                  monat · zeitraster · bahnen · eintrag-element · ziehen · groesse-aendern
    ansicht · einbettung · einbettung-parameter
  oberflaeche/
    bausteine/               wiederholungs-baustein      ← EINMAL
    dialoge/                 aufgabe-anlegen · termin-anlegen · inline-eintrag · hochstufen · schnellerfassung · abfrage · kalender-einbettung
  einstellungen/             typen · standardwerte · laden-migrieren · einstellungs-reiter
  befehle/                   anlegen · inline · caldav · abfrage-kalender · ribbon
  integrationen/             periodic-notes
docs/                        ARCHITEKTUR.md · BEFUNDE.md · ENTSCHEIDUNGEN.md · VERHALTEN.md
```

**Abhängigkeitsrichtung (nur nach unten):**
`befehle/oberflaeche → quellen/abfrage/kalender/caldav → modell → kern`.
`kern` importiert nichts außer `rrule`.

## 4. Kern-Schnittstellen

### 4.1 Serien-Logik (die wichtigste Vereinheitlichung)

Heute gibt es sie dreimal: `task-engine.handleDoneTransition`, `inline-tasks.handleInlineDoneTransition`, `main.skipNoteItem`. Künftig eine reine Funktion:

```ts
// core/series/advance-series.ts
type SeriesState = {
  start?: string; end?: string; rrule?: string; anchorStart?: string;
  completed: string[]; skipped: string[];
};
type SeriesAction = "completed" | "skipped";

function advanceSeries(state: SeriesState, action: SeriesAction, today: string): {
  next: SeriesState;
  jumped: boolean;        // true = Serie springt zur nächsten Instanz
};
```

Sie erledigt an **einer** Stelle: Datum in Liste eintragen, nächstes Vorkommen berechnen, Uhrzeit und Dauer erhalten, `anchorStart` einmalig setzen, UNTIL/COUNT beachten. Notiz-Quelle und Inline-Quelle schreiben nur noch das Ergebnis in ihr jeweiliges Format.

### 4.2 Quellen-Schnittstelle

```ts
// sources/source-api.ts
interface ItemSource {
  list(): Promise<UnifiedItem[]>;
  setCompleted(item: UnifiedItem, done: boolean): Promise<void>;
  skip(item: UnifiedItem): Promise<void>;
  reschedule(item: UnifiedItem, newDate: string, newTime?: string): Promise<void>;
  resizeEnd(item: UnifiedItem, newEndTime: string): Promise<void>;
  resizeStart(item: UnifiedItem, newStartTime: string): Promise<void>;
}
```

`NoteSource` und `InlineSource` setzen sie um. Query, Kalender und Drag & Drop sprechen nur noch mit dieser Schnittstelle, nicht mehr mit `if (item.isInline)`.

## 5. Eingefrorenes Datenformat

**Frontmatter (volle Notiz):** `type, uid, done, priority, start, end, allday, rrule, anchorStart, completed, skipped, calendar, location, description, reminder, parent, tags`

**Inline-Zeile:** `- [ |x|-] Text #tag [start::] [end::] [rrule::] [anchorStart::] [priority::] [parent::] [location::] [calendar::] [description::] [reminder::] [completed::] [skipped::] [uid::]`

**data.json (Settings-Schlüssel):** `taskFolders, calendarFolder, terminCreateFolders, terminArchivFolder, autoPushEnabled, autoPushDebounceSeconds, caldav{username,serverUrl,calendars[]}, calendarColors, templates, noteTemplates, caldavSync, defaultEventDurationMinutes, inlineFolders, inlineTagTodo, inlineTagTermin, inlineCaldavSync, inlineAutoPushEnabled`

**Sonstiges:** SecretStorage-ID `caldav-icloud-app-password`, View-Typ `cadence-calendar-view`, Codeblock-Namen `cadence-query` und `cadence-calendar`, Marker-Tags `lokal`, `caldav-konflikt`, `caldav-entfernt`.

Änderungen daran nur mit Migration in `settings/load-migrate.ts`.

## 6. Verhaltensinventur (muss nach dem Umbau identisch bleiben)

Jeder Punkt wird nach der jeweiligen Phase manuell abgehakt.

**Wiederholung**
- [ ] Nächstes Vorkommen geht vom *geplanten* Datum aus, nicht vom Abhak-Datum
- [ ] MONTHLY/YEARLY ohne BYDAY/BYMONTHDAY: Anker-Kappung (31.01. → 28.02. → 31.03.), `X-ANCHORDAY/-MONTH` werden gespeichert
- [ ] Mit BYMONTHDAY: striktes RFC-Verhalten (Monat wird übersprungen)
- [ ] Deutsche Kürzel DI/MI/DO/SO werden übersetzt
- [ ] Uhrzeit bleibt beim Sprung erhalten, `end` verschiebt sich um dieselbe Tagesdifferenz
- [ ] `anchorStart` wird beim ersten Sprung einmalig gesetzt
- [ ] UNTIL/COUNT beenden die Serie (derzeit nur bei Inline korrekt, siehe 7.)
- [ ] Erstes Auslesen nach Neustart zählt nicht als Abhaken (`lastKnown…`)

**Notizen:** UID-Vergabe beim Erstellen und Scan, Abhaken ergänzt `completed`, Überspringen ergänzt `skipped` ohne `done` zu ändern.

**Inline:** nur in Inline-Ordnern, UID automatisch, Zustände ` `/`x`/`-`, Einrückung bleibt, Hochstufen übernimmt UID, Historie, `anchorStart` und Sync-Eintrag und ersetzt die Zeile durch einen Link.

**CalDAV lesen:** Partition-Retry bei HTTP 400, `.well-known` mit Redirect *oder* 207, `VALUE=DATE` exakt (nicht `DATE-TIME`), ganztägiges `DTEND` exklusiv → inklusiv, Ausnahme-Instanzen (`RECURRENCE-ID`) werden ignoriert, Zeitfenster 60 Tage.

**CalDAV schreiben:** `DTEND` immer gesetzt (Standarddauer), `If-None-Match: *` bei Neuanlage, `If-Match` mit ETag bei Update, 412 → Tag `caldav-konflikt` ohne Überschreiben, Serien nutzen `seriesStart` statt vorgesprungenem `start`, `X-ANCHOR*` wird vor dem Senden entfernt, readonly-Kalender werden nie beschrieben.

**Löschsynchronisation:** Archivordner ↔ Server-DELETE, gezielter Existenz-Check pro `href` (kein Listenabgleich wegen 60-Tage-Fenster), Inline: Zeile weg → Server-DELETE, Server weg → Tag `caldav-entfernt`.

**Query:** alle Filter aus der README, `excludeFolders` per Präfix, Klick = erledigt, Rechtsklick = überspringen, Live-Update (debounced 500 ms).

**Kalender:** Monat/Woche/Tag, KW-Spalte, Lane-Zuweisung, mehrtägige Balken, `startHour/endHour`, echte vs. virtuelle vs. vergangene Vorkommen, `anchorStart`-Rekonstruktion mit `actualDate`-Hinweis, Drag mit 15-Min-Raster, Resize oben/unten, Klick-Unterdrückung nach Drag, Schnellerfassung, Periodic-Notes-Klick, Embed-Datum-Auflösungskette (Param → Frontmatter → Dateiname → heute).

## 7. Bei der Inventur gefundene Schwachstellen

Diese Punkte werden *bewusst* im Zuge des Umbaus entschieden, nicht stillschweigend geändert.

| # | Befund | Vorschlag |
|---|---|---|
| 1 | `previewOccurrences` existiert 3×, die Kopie in `task-create-modal` hat den `updatedRrule`-Fix nicht | Eine Funktion in `core/recurrence` |
| 2 | UNTIL/COUNT-Kompensation nur bei Inline, `handleDoneTransition` und `skipNoteItem` haben sie nicht | In `advanceSeries` für beide Quellen |
| 3 | „Heute“ wird überall per `new Date().toISOString().slice(0,10)` ermittelt, das ist **UTC**. Zwischen 00:00 und ca. 02:00 (MESZ) liegt es also einen Tag zurück (falsches Abhak-Datum, falsches „heute“ im Kalender) | Ein `today()` in `core/dates/today.ts` mit lokalem Datum |
| 4 | Uhrzeit-Erhaltung als Wrapper in `main.ts`, weil `computeNextOccurrence` datums-only arbeitet | Wandert in `advanceSeries` |
| 5 | `addMinutesToDateTime`, `ensureFolderExists`, `sanitizeFilenamePart`, `slugify`, `WEEKDAYS`, Datums-Helfer mehrfach vorhanden | Je einmal in `core/` bzw. `ui/` |
| 6 | rrule-Widget 3× (`task-create`, `inline-task`, `quick-capture`) | `ui/widgets/rrule-widget.ts` |
| 7 | `CalendarDebugModal` ist obsolet | Entfällt |
| 8 | `calendar-view` zeigt immer `startHour: 8, endHour: 18` fest | Als Settings-Wert oder Konstante klären |

## 8. Offene Entscheidungen (bitte beantworten)

1. **Quellcode-Ordner `src/`** mit `main.ts` dort, Build-Ausgabe separat? (Empfehlung: ja)
2. **Tests** für `core/` (Vitest, nur reine Funktionen: rrule, Anker, `advanceSeries`)? Empfehlung: ja, weil genau dort die Bugs wohnen.
3. **Punkt 7.3 (lokales „heute“)** mit umstellen? Das ändert Verhalten, aber nur zum Richtigen.
4. **Sprache der Kommentare/Bezeichner:** Kommentare deutsch, Code englisch (Empfehlung) oder durchgehend deutsch?
5. **Bezeichner `TaskCalendarPlugin`** zu `CadencePlugin` umbenennen?

## 9. Git-Workflow

- `main` ist immer lauffähig. Jede Phase = Branch `phase-1-core`, `phase-2-sources` …
- Vor Phase 1: Tag `v0.1.0-alt` auf den heutigen Stand (jederzeit Rückkehr möglich).
- Commit nach jedem Schritt, der gebaut und getestet wurde. Nachricht: `phase-1: core/dates ausgelagert`.
- `.gitignore`: `node_modules/`, `main.js`, `data.json`
- `data.json` enthält Sync-Zuordnungen (`caldavSync`) → separat sichern, nicht im Repo.
- Merge nach `main` erst, wenn der Abschnitt aus Punkt 6 für die Phase abgehakt ist.

## 10. Phasen

| Phase | Inhalt | Ergebnis |
|---|---|---|
| 0 | Dieses Dokument, Git-Setup, Tag `v0.1.0-alt`, Build-Ausgabe in den Vault | Entscheidung |
| 1 | `core/` inkl. `advanceSeries` und Tests | Alter Code ruft neue Funktionen auf |
| 2 | `model/` und `sources/` hinter `ItemSource` | Query/Kalender nutzen die Schnittstelle |
| 3 | `caldav/` zerlegt | Sync/Push wie vorher |
| 4 | `query/` und `calendar/` zerlegt | Render, Drag, Resize getrennt |
| 5 | `ui/`, `settings/`, `commands/` | Ein rrule-Widget |
| 6 | Schlankes `main.ts`, Aufräumen, README | Fertig |

---

## 11. Beschlüsse (Stand Phase 0b) – haben Vorrang vor Abschnitt 3 und 8

| Thema | Beschluss |
|---|---|
| Repo | Neues, leeres Repo "Cadence" auf GitHub. Entwicklungsordner: `/Users/davidholler/Documents/newCadence`. Gebaut wird per `lokal.config.json` in den Plugin-Ordner des Vaults (`.../.obsidian/plugins/newCadence`) |
| Name | Vorläufig `newCadence` (manifest-ID). Zum Schluss Umbenennen in `cadence` |
| Parallelbetrieb | Immer nur ein Plugin (alt/neu) aktiv. Kein Schreibschutz-Schalter, keine Kennungs-Präfixe. Die finalen Namen (`cadence-query`, `cadence-calendar`, CSS `cadence-…`) werden gleich verwendet |
| Sprache | Kommentare und Bezeichner deutsch, ohne Umlaute in Namen. Obsidian-eigene Namen bleiben englisch |
| Datenformat | Nicht mehr eingefroren. Änderungen sind erlaubt, wenn sie nötig sind (altes Plugin kaum genutzt). Jede Änderung kurz in `ENTSCHEIDUNGEN.md` begründen |
| Zeit | Immer Gerätezeit (`heute()`), nie UTC |
| Tests | Vitest, Dateien `*.test.ts` direkt neben dem Code, nur für reine Logik |
| Typprüfung | `npm run build` führt vorher `tsc --noEmit` aus |

Deutsche Ordnernamen unter `src/`:

| Alt (Abschnitt 3) | Neu |
|---|---|
| core | kern (datum, wiederholung, serie, text) |
| model | modell |
| sources | quellen (notizen, inline) |
| caldav | caldav (client, schreiben, abgleich) |
| query | abfrage |
| calendar | kalender |
| ui | oberflaeche (bausteine, dialoge) |
| settings | einstellungen |
| commands | befehle |
| integrations | integrationen |

Dazu eine zentrale Datei `src/kennungen.ts` für alle festen Namen (Ansichtstyp, Codeblock-Namen, Passwort-ID, Marker-Tags).