import { describe, expect, it } from "vitest";
import type { FeldStueck, TagStueck } from "./inline-typen";
import { zeileAlsText, zerlegeZeile } from "./zeile-zerlegen";

function tagNamen(zeile: string): string[] {
  const zerlegt = zerlegeZeile(zeile)!;
  return zerlegt.stuecke.filter((s): s is TagStueck => s.art === "tag").map((s) => s.name);
}

function felder(zeile: string): FeldStueck[] {
  return zerlegeZeile(zeile)!.stuecke.filter((s): s is FeldStueck => s.art === "feld");
}

describe("zerlegeZeile: Zusammensetzen ergibt exakt die Originalzeile", () => {
  it.each([
    "- [ ] Auto waschen #todo",
    "  - [x] Eingerückt #termin [start:: 2026-07-20T09:00] [uid:: a-1]",
    "\t- [ ] Mit Tabulator #todo",
    "- [ ]    Viele Leerzeichen   #todo",
    "- [X] Großes X #todo",
    "- [-] Übersprungen #todo",
    "- [ ] Siehe [[Notiz#Abschnitt]] #todo [due:: 2026-08-01] ^abc123",
    "- [ ] Aufgabe #todo [parent:: [[Projekt XY]]] [uid:: a-1]",
    "- [ ] Link [Text](https://x.de/#anker) #todo",
    "- [ ] Mit `#code` Tag #todo",
    "- [ ] Ümlaut #Übung #todo",
    "- [ ] Offene [Klammer #todo",
    "- [ ] [x:: nie geschlossen #todo",
    "- [ ] Anruf bei #Max wegen X #todo",
    "- [ ] #todo Tag am Anfang",
    "- [ ] #todo",
    "- [ ] ",
    "- [ ] Beschreibung #termin [description:: Zeile1\\nZeile2 #wichtig]",
  ])("%j", (zeile) => {
    const zerlegt = zerlegeZeile(zeile);
    expect(zerlegt).not.toBeNull();
    expect(zeileAlsText(zerlegt!)).toBe(zeile);
  });
});

describe("zerlegeZeile: keine Checkbox-Zeile", () => {
  it.each(["- Aufzählung", "Normaler Text", "* [ ] Stern statt Strich", "> - [ ] Zitat", ""])("%j", (zeile) => {
    expect(zerlegeZeile(zeile)).toBeNull();
  });
});

describe("zerlegeZeile: Checkbox", () => {
  it("liest Einrückung, Zeichen und Block-ID", () => {
    const zerlegt = zerlegeZeile("  - [x] Rechnung #todo [uid:: a-1] ^abc123")!;
    expect(zerlegt.einrueckung).toBe("  ");
    expect(zerlegt.zustandZeichen).toBe("x");
    expect(zerlegt.blockId).toBe(" ^abc123");
  });
});

describe("zerlegeZeile: Felder", () => {
  it("liest ein Wikilink im Feld vollständig (der alte Fehler)", () => {
    const [feld] = felder("- [ ] Aufgabe #todo [parent:: [[Projekt XY]]] [uid:: a-1]");
    expect(feld.schluessel).toBe("parent");
    expect(feld.wert).toBe("[[Projekt XY]]");
    const zerlegt = zerlegeZeile("- [ ] Aufgabe #todo [parent:: [[Projekt XY]]] [uid:: a-1]")!;
    const text = zerlegt.stuecke.filter((s) => s.art === "text").map((s) => s.roh).join("");
    expect(text).not.toContain("]]");
  });

  it("entschlüsselt \\n und geschützte Klammern", () => {
    const [feld] = felder("- [ ] A #termin [description:: Zeile1\\nZeile2 \\[x]");
    expect(feld.wert).toBe("Zeile1\nZeile2 [x");
  });

  it("liest fremde Felder wie [due:: ...] als normale Felder", () => {
    expect(felder("- [ ] A #todo [due:: 2026-08-01]").map((f) => f.schluessel)).toEqual(["due"]);
  });

  it("ignoriert Felder mit nie geschlossener Klammer", () => {
    expect(felder("- [ ] [x:: nie geschlossen #todo")).toHaveLength(0);
  });
});

describe("zerlegeZeile: Tags", () => {
  it("erkennt normale Tags, auch mit Umlauten", () => {
    expect(tagNamen("- [ ] Üben #todo #Übung")).toEqual(["todo", "Übung"]);
  });

  it("erkennt #Abschnitt in einem Wikilink NICHT als Tag", () => {
    expect(tagNamen("- [ ] Siehe [[Notiz#Abschnitt]] #todo")).toEqual(["todo"]);
  });

  it("erkennt #anker in einer Web-Adresse NICHT als Tag", () => {
    expect(tagNamen("- [ ] Link [Text](https://x.de/#anker) #todo")).toEqual(["todo"]);
  });

  it("erkennt Tags in Feldwerten NICHT als Tags", () => {
    expect(tagNamen("- [ ] Meeting #termin [description:: Agenda #wichtig]")).toEqual(["termin"]);
  });

  it("erkennt Tags in Code-Abschnitten NICHT als Tags", () => {
    expect(tagNamen("- [ ] Mit `#code` Tag #todo")).toEqual(["todo"]);
  });

  it("erkennt reine Zahlen wie #123 nicht als Tag", () => {
    expect(tagNamen("- [ ] Ticket #123 #todo")).toEqual(["todo"]);
  });

  it("erkennt Tags mitten im Text und verschachtelte Tags", () => {
    expect(tagNamen("- [ ] Anruf bei #Max wegen X #projekt/alpha #todo")).toEqual(["Max", "projekt/alpha", "todo"]);
  });

  it("erkennt keinen Tag ohne Leerzeichen davor", () => {
    expect(tagNamen("- [ ] a#b #todo")).toEqual(["todo"]);
  });
});
