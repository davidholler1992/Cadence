import { describe, expect, it } from "vitest";
import type { InlineEinstellungen } from "./inline-typen";
import { verarbeiteInlineInhalt } from "./inhalt-verarbeiten";
import type { VerarbeitungsHilfen } from "./inhalt-verarbeiten";

const EINSTELLUNGEN: InlineEinstellungen = { tagTodo: "todo", tagTermin: "termin" };
const HEUTE = "2026-07-20";

/** Hilfen mit durchnummerierten UIDs (u1, u2, ...) und einer Liste "anderswo vergebener" UIDs. */
function hilfen(anderswo: string[] = []): VerarbeitungsHilfen {
  let zaehler = 0;
  return { neueUid: () => `u${++zaehler}`, uidAnderswoVergeben: (uid) => anderswo.includes(uid) };
}

const verarbeite = (inhalt: string, anderswo: string[] = []) =>
  verarbeiteInlineInhalt(inhalt, EINSTELLUNGEN, HEUTE, hilfen(anderswo));

describe("verarbeiteInlineInhalt: UIDs", () => {
  it("vergibt fehlende UIDs und ändert sonst nichts", () => {
    const ergebnis = verarbeite("# Titel\n- [ ] A #todo\nText\n- [ ] B #termin [start:: 2026-07-20T09:00]");
    expect(ergebnis.inhalt).toBe(
      "# Titel\n- [ ] A #todo [uid:: u1]\nText\n- [ ] B #termin [start:: 2026-07-20T09:00] [uid:: u2]"
    );
    expect(ergebnis.geaendert).toBe(true);
    expect(ergebnis.uids).toEqual(["u1", "u2"]);
  });

  it("ändert bei einem zweiten Durchlauf nichts mehr und gibt exakt den Eingabetext zurück", () => {
    const erst = verarbeite("- [ ] A #todo");
    const nochmal = verarbeite(erst.inhalt);
    expect(nochmal.geaendert).toBe(false);
    expect(nochmal.inhalt).toBe(erst.inhalt);
  });

  it("vergibt für ein doppeltes Vorkommen in derselben Datei eine neue UID", () => {
    const ergebnis = verarbeite("- [ ] A #todo [uid:: x1]\n- [ ] B #todo [uid:: x1]");
    expect(ergebnis.inhalt).toBe("- [ ] A #todo [uid:: x1]\n- [ ] B #todo [uid:: u1]");
  });

  it("vergibt eine neue UID, wenn sie in einer anderen Datei schon steht", () => {
    const ergebnis = verarbeite("- [ ] A #todo [uid:: x1]", ["x1"]);
    expect(ergebnis.inhalt).toBe("- [ ] A #todo [uid:: u1]");
  });

  it("lässt Zeilen in Code-Blöcken und normale Aufzählungen in Ruhe", () => {
    const inhalt = "- Aufzählung\n```\n- [ ] Beispiel #todo\n```";
    const ergebnis = verarbeite(inhalt);
    expect(ergebnis.geaendert).toBe(false);
    expect(ergebnis.inhalt).toBe(inhalt);
  });

  it("behält Windows-Zeilenenden", () => {
    const ergebnis = verarbeite("- [ ] A #todo\r\nText\r\n");
    expect(ergebnis.inhalt).toBe("- [ ] A #todo [uid:: u1]\r\nText\r\n");
  });
});

describe("verarbeiteInlineInhalt: einmalige Einträge", () => {
  it("trägt bei einem Haken das heutige Datum ein, nur einmal", () => {
    const erst = verarbeite("- [x] A #todo [uid:: a]");
    expect(erst.inhalt).toBe("- [x] A #todo [completed:: 2026-07-20] [uid:: a]");
    expect(verarbeite(erst.inhalt).geaendert).toBe(false);
  });

  it("entfernt das Datum, wenn der Haken wieder weggenommen wird", () => {
    const ergebnis = verarbeite("- [ ] A #todo [completed:: 2026-07-20] [uid:: a]");
    expect(ergebnis.inhalt).toBe("- [ ] A #todo [uid:: a]");
  });

  it("trägt beim Überspringen in skipped ein", () => {
    const ergebnis = verarbeite("- [-] A #todo [uid:: a]");
    expect(ergebnis.inhalt).toBe("- [-] A #todo [skipped:: 2026-07-20] [uid:: a]");
  });
});

describe("verarbeiteInlineInhalt: Serien", () => {
  it("springt beim Haken weiter, setzt die Checkbox zurück und merkt sich den Anker", () => {
    const zeile = "- [x] Deep Work #termin [start:: 2026-07-20T09:00] [end:: 2026-07-20T12:00] [rrule:: FREQ=WEEKLY;BYDAY=MO] [uid:: a]";
    const ergebnis = verarbeite(zeile);
    expect(ergebnis.inhalt).toBe(
      "- [ ] Deep Work #termin [start:: 2026-07-27T09:00] [end:: 2026-07-27T12:00] [rrule:: FREQ=WEEKLY;BYDAY=MO] " +
        "[anchorStart:: 2026-07-20T09:00] [completed:: 2026-07-20] [uid:: a]"
    );
  });

  it("verarbeitet eine Serie nur einmal (zweiter Durchlauf ändert nichts)", () => {
    const erst = verarbeite("- [x] A #todo [start:: 2026-07-20] [rrule:: FREQ=DAILY] [uid:: a]");
    expect(verarbeite(erst.inhalt).geaendert).toBe(false);
  });

  it("lässt den ankerStart beim zweiten Sprung unverändert", () => {
    const erst = verarbeite("- [x] A #todo [start:: 2026-07-20] [rrule:: FREQ=DAILY] [uid:: a]");
    const zweitesMalAbgehakt = erst.inhalt.replace("- [ ]", "- [x]");
    const ergebnis = verarbeite(zweitesMalAbgehakt);
    expect(ergebnis.inhalt).toContain("[start:: 2026-07-22]");
    expect(ergebnis.inhalt).toContain("[anchorStart:: 2026-07-20]");
    expect(ergebnis.inhalt).toContain("[completed:: 2026-07-20,2026-07-20]");
  });

  it("lässt ein beendetes COUNT-Serien-Element abgehakt stehen und verarbeitet es nicht erneut", () => {
    const zeile = "- [x] A #todo [start:: 2026-07-20] [rrule:: FREQ=DAILY;COUNT=1] [uid:: a]";
    const erst = verarbeite(zeile);
    expect(erst.inhalt).toBe("- [x] A #todo [start:: 2026-07-20] [rrule:: FREQ=DAILY;COUNT=1] [completed:: 2026-07-20] [uid:: a]");
    expect(verarbeite(erst.inhalt).geaendert).toBe(false);
  });
});

describe("verarbeiteInlineInhalt: übriger Zeileninhalt bleibt unangetastet", () => {
  it("behält Block-ID, fremde Felder, Tags im Text und Links mit Überschrift", () => {
    const zeile = "- [x] Anruf bei #Max wegen [[Notiz#Abschnitt]] #todo #wichtig [due:: 2026-08-01] [parent:: [[Projekt XY]]] ^abc123";
    const ergebnis = verarbeite(zeile);
    expect(ergebnis.inhalt).toBe(
      "- [x] Anruf bei #Max wegen [[Notiz#Abschnitt]] #todo #wichtig [due:: 2026-08-01] [parent:: [[Projekt XY]]] " +
        "[completed:: 2026-07-20] [uid:: u1] ^abc123"
    );
  });
});
