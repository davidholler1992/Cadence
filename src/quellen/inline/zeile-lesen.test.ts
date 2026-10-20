import { describe, expect, it } from "vitest";
import type { InlineEinstellungen } from "./inline-typen";
import { leseInlineZeile } from "./zeile-lesen";

const EINSTELLUNGEN: InlineEinstellungen = { tagTodo: "todo", tagTermin: "termin" };
const lies = (zeile: string) => leseInlineZeile(zeile, EINSTELLUNGEN);

describe("leseInlineZeile: Erkennung", () => {
  it("erkennt eine einfache Aufgabe", () => {
    const eintrag = lies("- [ ] Auto waschen #todo")!;
    expect(eintrag.art).toBe("todo");
    expect(eintrag.titel).toBe("Auto waschen");
    expect(eintrag.zustand).toBe("offen");
    expect(eintrag.uid).toBe("");
  });

  it("ignoriert Zeilen ohne Checkbox oder ohne Verwaltungs-Tag", () => {
    expect(lies("- Auto waschen #todo")).toBeNull();
    expect(lies("- [ ] Auto waschen")).toBeNull();
    expect(lies("- [ ] Auto waschen #andere")).toBeNull();
    expect(lies("Normaler Text")).toBeNull();
  });

  it("unterscheidet Groß-/Kleinschreibung des Tags nicht", () => {
    expect(lies("- [ ] A #TODO")?.art).toBe("todo");
  });

  it("nimmt Tag-Namen aus den Einstellungen auch mit #", () => {
    const eintrag = leseInlineZeile("- [ ] A #aufgabe", { tagTodo: "#aufgabe", tagTermin: "termin" });
    expect(eintrag?.art).toBe("todo");
  });

  it("lässt den Termin-Tag gewinnen, wenn beide Tags da sind", () => {
    const eintrag = lies("- [ ] A #todo #termin")!;
    expect(eintrag.art).toBe("termin");
    expect(eintrag.tags).toEqual(["todo"]);
  });
});

describe("leseInlineZeile: Zustand", () => {
  it("liest offen, erledigt (auch großes X) und übersprungen", () => {
    expect(lies("- [ ] A #todo")?.zustand).toBe("offen");
    expect(lies("- [x] A #todo")?.zustand).toBe("erledigt");
    expect(lies("- [X] A #todo")?.zustand).toBe("erledigt");
    expect(lies("- [-] A #todo")?.zustand).toBe("uebersprungen");
  });
});

describe("leseInlineZeile: Felder", () => {
  it("liest alle Felder eines Termins", () => {
    const eintrag = lies(
      "- [ ] Zahnarzt #termin [start:: 2026-07-10T10:00] [end:: 2026-07-10T11:00] [rrule:: FREQ=YEARLY] " +
        "[anchorStart:: 2025-07-10T10:00] [priority:: hoch] [parent:: [[Gesundheit]]] [location:: Praxis Dr. Müller] " +
        "[calendar:: Privat] [description:: Zeile1\\nZeile2] [reminder:: 15,1440] " +
        "[completed:: 2025-07-10] [skipped:: 2024-07-10,2023-07-10] [uid:: 20260701-ab12cd34]"
    )!;
    expect(eintrag.art).toBe("termin");
    expect(eintrag.start).toBe("2026-07-10T10:00");
    expect(eintrag.ende).toBe("2026-07-10T11:00");
    expect(eintrag.rrule).toBe("FREQ=YEARLY");
    expect(eintrag.ankerStart).toBe("2025-07-10T10:00");
    expect(eintrag.prioritaet).toBe("hoch");
    expect(eintrag.uebergeordnet).toBe("[[Gesundheit]]");
    expect(eintrag.ort).toBe("Praxis Dr. Müller");
    expect(eintrag.kalender).toBe("Privat");
    expect(eintrag.beschreibung).toBe("Zeile1\nZeile2");
    expect(eintrag.erinnerung).toEqual([15, 1440]);
    expect(eintrag.erledigt).toEqual(["2025-07-10"]);
    expect(eintrag.uebersprungen).toEqual(["2024-07-10", "2023-07-10"]);
    expect(eintrag.uid).toBe("20260701-ab12cd34");
    expect(eintrag.titel).toBe("Zahnarzt");
  });

  it("ignoriert Termin-Felder bei Aufgaben", () => {
    const eintrag = lies("- [ ] A #todo [location:: Ort] [calendar:: K] [description:: B] [reminder:: 15]")!;
    expect(eintrag.ort).toBeUndefined();
    expect(eintrag.kalender).toBeUndefined();
    expect(eintrag.beschreibung).toBeUndefined();
    expect(eintrag.erinnerung).toBeUndefined();
  });

  it("behandelt leere Felder wie fehlende", () => {
    const eintrag = lies("- [ ] A #todo [start:: ] [end::]")!;
    expect(eintrag.start).toBeUndefined();
    expect(eintrag.ende).toBeUndefined();
  });

  it("liest die Felder bei doppelter Angabe vom letzten", () => {
    expect(lies("- [ ] A #todo [start:: 2026-01-01] [start:: 2026-02-02]")?.start).toBe("2026-02-02");
  });
});

describe("leseInlineZeile: Titel und Tags", () => {
  it("nimmt Tags aus der Beschreibung nicht als Tags (der alte Fehler)", () => {
    const eintrag = lies("- [ ] Meeting #termin [description:: Agenda #wichtig besprechen]")!;
    expect(eintrag.tags).toEqual([]);
    expect(eintrag.beschreibung).toBe("Agenda #wichtig besprechen");
  });

  it("lässt #Abschnitt in Wikilinks im Titel stehen (der alte Fehler)", () => {
    const eintrag = lies("- [ ] Siehe [[Notiz#Abschnitt]] #todo")!;
    expect(eintrag.titel).toBe("Siehe [[Notiz#Abschnitt]]");
    expect(eintrag.tags).toEqual([]);
  });

  it("liest zusätzliche Tags ohne den Verwaltungs-Tag", () => {
    expect(lies("- [ ] A #todo #wichtig #projekt/alpha")?.tags).toEqual(["wichtig", "projekt/alpha"]);
  });

  it("nimmt Tags mitten im Text als Tags und lässt sie aus dem Titel", () => {
    const eintrag = lies("- [ ] Anruf bei #Max wegen X #todo")!;
    expect(eintrag.titel).toBe("Anruf bei wegen X");
    expect(eintrag.tags).toEqual(["Max"]);
  });

  it("liest das Wikilink im Feld parent unverändert (der alte Fehler)", () => {
    const eintrag = lies("- [ ] Aufgabe #todo [parent:: [[Projekt XY]]] [uid:: a-1]")!;
    expect(eintrag.uebergeordnet).toBe("[[Projekt XY]]");
    expect(eintrag.titel).toBe("Aufgabe");
  });

  it("erkennt Umlaut-Tags", () => {
    expect(lies("- [ ] A #todo #Übung")?.tags).toEqual(["Übung"]);
  });
});
