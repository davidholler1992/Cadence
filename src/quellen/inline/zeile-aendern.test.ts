import { describe, expect, it } from "vitest";
import { feldSetzen, tagEntfernen, tagHinzufuegen, titelSetzen, zustandSetzen } from "./zeile-aendern";
import { zeileAlsText, zerlegeZeile } from "./zeile-zerlegen";

const zerlege = (zeile: string) => zerlegeZeile(zeile)!;

describe("zustandSetzen", () => {
  it("ändert nur das Zeichen in der Checkbox", () => {
    const neu = zustandSetzen(zerlege("  - [ ] A #todo [uid:: 1] ^blk"), "x");
    expect(zeileAlsText(neu)).toBe("  - [x] A #todo [uid:: 1] ^blk");
  });

  it("lässt die Zeile unverändert, wenn der Zustand schon passt (großes X bleibt)", () => {
    const zeile = zerlege("- [X] A #todo");
    expect(zustandSetzen(zeile, "x")).toBe(zeile);
  });

  it("setzt übersprungen", () => {
    expect(zeileAlsText(zustandSetzen(zerlege("- [ ] A #todo"), "-"))).toBe("- [-] A #todo");
  });
});

describe("feldSetzen: ersetzen", () => {
  it("ersetzt den Wert und lässt alles andere unverändert", () => {
    const zeile = "- [ ] Siehe [[Notiz#Abschnitt]] #todo #wichtig [due:: 2026-08-01] [start:: 2026-07-20] [uid:: 1] ^abc123";
    const neu = feldSetzen(zerlege(zeile), "start", "2026-07-21");
    expect(zeileAlsText(neu)).toBe(
      "- [ ] Siehe [[Notiz#Abschnitt]] #todo #wichtig [due:: 2026-08-01] [start:: 2026-07-21] [uid:: 1] ^abc123"
    );
  });

  it("lässt die Zeile unverändert, wenn der Wert gleich ist", () => {
    const zeile = zerlege("- [ ]  A #todo  [start::   2026-07-20]");
    expect(feldSetzen(zeile, "start", "2026-07-20")).toBe(zeile);
  });

  it("findet das Feld unabhängig von der Groß-/Kleinschreibung", () => {
    const neu = feldSetzen(zerlege("- [ ] A #todo [anchorstart:: 2026-01-01]"), "anchorStart", "2026-02-02");
    expect(zeileAlsText(neu)).toBe("- [ ] A #todo [anchorStart:: 2026-02-02]");
  });
});

describe("feldSetzen: einfügen", () => {
  it("fügt ein neues Feld vor dem uid-Feld und vor der Block-ID ein", () => {
    const neu = feldSetzen(zerlege("- [ ] A #todo [uid:: 1] ^blk"), "start", "2026-07-20");
    expect(zeileAlsText(neu)).toBe("- [ ] A #todo [start:: 2026-07-20] [uid:: 1] ^blk");
  });

  it("hängt ohne uid-Feld ans Ende, vor die Block-ID", () => {
    const neu = feldSetzen(zerlege("- [ ] A #todo ^blk"), "start", "2026-07-20");
    expect(zeileAlsText(neu)).toBe("- [ ] A #todo [start:: 2026-07-20] ^blk");
  });

  it("fügt bei einer Zeile ohne Felder mit einem Leerzeichen an", () => {
    expect(zeileAlsText(feldSetzen(zerlege("- [ ] A #todo"), "uid", "x-1"))).toBe("- [ ] A #todo [uid:: x-1]");
  });

  it("verschlüsselt Zeilenumbrüche und unpaarige Klammern", () => {
    const neu = feldSetzen(zerlege("- [ ] A #termin"), "description", "Zeile1\nZeile2 [x");
    expect(zeileAlsText(neu)).toBe("- [ ] A #termin [description:: Zeile1\\nZeile2 \\[x]");
  });

  it("schreibt ein Wikilink unverändert (der alte Fehler)", () => {
    const neu = feldSetzen(zerlege("- [ ] A #todo [uid:: 1]"), "parent", "[[Projekt XY]]");
    expect(zeileAlsText(neu)).toBe("- [ ] A #todo [parent:: [[Projekt XY]]] [uid:: 1]");
    // und es lässt sich wieder lesen:
    const gelesen = zerlegeZeile(zeileAlsText(neu))!.stuecke.find((s) => s.art === "feld" && s.schluessel === "parent");
    expect(gelesen && gelesen.art === "feld" && gelesen.wert).toBe("[[Projekt XY]]");
  });
});

describe("feldSetzen: entfernen", () => {
  it("entfernt ein Feld in der Mitte ohne doppelte Leerzeichen", () => {
    const neu = feldSetzen(zerlege("- [ ] A #todo [start:: x] [uid:: 1]"), "start", undefined);
    expect(zeileAlsText(neu)).toBe("- [ ] A #todo [uid:: 1]");
  });

  it("entfernt das letzte Feld ohne Leerzeichen am Zeilenende", () => {
    expect(zeileAlsText(feldSetzen(zerlege("- [ ] A #todo [start:: x]"), "start", ""))).toBe("- [ ] A #todo");
  });

  it("lässt die Zeile unverändert, wenn das Feld gar nicht da ist", () => {
    const zeile = zerlege("- [ ] A #todo");
    expect(feldSetzen(zeile, "start", undefined)).toBe(zeile);
  });

  it("behält fremde Felder und die Block-ID", () => {
    const neu = feldSetzen(zerlege("- [ ] A #todo [due:: 2026-08-01] [start:: x] ^abc"), "start", undefined);
    expect(zeileAlsText(neu)).toBe("- [ ] A #todo [due:: 2026-08-01] ^abc");
  });
});

describe("feldSetzen: Text bleibt unangetastet", () => {
  it("verändert Tags mitten im Text und Links nicht", () => {
    const zeile = "- [ ] Anruf bei #Max wegen [[X#Y]] #todo [uid:: 1]";
    const neu = feldSetzen(zerlege(zeile), "priority", "hoch");
    expect(zeileAlsText(neu)).toBe("- [ ] Anruf bei #Max wegen [[X#Y]] #todo [priority:: hoch] [uid:: 1]");
  });
});

describe("titelSetzen", () => {
  it("ersetzt nur den Titel", () => {
    const neu = titelSetzen(zerlege("- [ ] Auto waschen #todo [start:: x] [uid:: 1]"), "Auto putzen");
    expect(zeileAlsText(neu)).toBe("- [ ] Auto putzen #todo [start:: x] [uid:: 1]");
  });

  it("lässt Links mit Überschrift im neuen Titel unverändert", () => {
    const neu = titelSetzen(zerlege("- [ ] Alt #todo"), "Siehe [[Notiz#Abschnitt]]");
    expect(zeileAlsText(neu)).toBe("- [ ] Siehe [[Notiz#Abschnitt]] #todo");
  });

  it("fügt einen Titel ein, wenn die Zeile bisher keinen hatte", () => {
    expect(zeileAlsText(titelSetzen(zerlege("- [ ] #todo [uid:: 1]"), "Neu"))).toBe("- [ ] Neu #todo [uid:: 1]");
  });

  it("macht aus Zeilenumbrüchen im Titel ein Leerzeichen", () => {
    expect(zeileAlsText(titelSetzen(zerlege("- [ ] A #todo"), "Zeile1\nZeile2"))).toBe("- [ ] Zeile1 Zeile2 #todo");
  });

  it("behält Tags mitten im Text, wenn der Titel zerteilt war", () => {
    const neu = titelSetzen(zerlege("- [ ] Anruf bei #Max wegen X #todo"), "Neuer Titel");
    const text = zeileAlsText(neu);
    expect(text).toContain("Neuer Titel");
    expect(text).toContain("#Max");
    expect(text).toContain("#todo");
    expect(text).not.toContain("wegen X");
  });
});

describe("tagHinzufuegen / tagEntfernen", () => {
  it("fügt einen Tag direkt hinter dem Verwaltungs-Tag ein", () => {
    const neu = tagHinzufuegen(zerlege("- [ ] A #todo [uid:: 1]"), "wichtig", "todo");
    expect(zeileAlsText(neu)).toBe("- [ ] A #todo #wichtig [uid:: 1]");
  });

  it("fügt ohne Anker am Ende ein, vor der Block-ID", () => {
    const neu = tagHinzufuegen(zerlege("- [ ] A #todo ^blk"), "wichtig");
    expect(zeileAlsText(neu)).toBe("- [ ] A #todo #wichtig ^blk");
  });

  it("fügt einen vorhandenen Tag nicht noch einmal ein (Groß-/Kleinschreibung egal)", () => {
    const zeile = zerlege("- [ ] A #todo #Wichtig");
    expect(tagHinzufuegen(zeile, "wichtig", "todo")).toBe(zeile);
  });

  it("entfernt einen Tag ohne doppelte Leerzeichen", () => {
    const neu = tagEntfernen(zerlege("- [ ] A #todo #wichtig [uid:: 1]"), "wichtig");
    expect(zeileAlsText(neu)).toBe("- [ ] A #todo [uid:: 1]");
  });

  it("lässt die Zeile unverändert, wenn der Tag nicht da ist", () => {
    const zeile = zerlege("- [ ] A #todo");
    expect(tagEntfernen(zeile, "nix")).toBe(zeile);
  });
});
