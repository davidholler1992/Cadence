import { describe, expect, it } from "vitest";
import type { InlineEinstellungen } from "./inline-typen";
import { baueInlineZeile } from "./zeile-bauen";
import { leseInlineZeile } from "./zeile-lesen";

const EINSTELLUNGEN: InlineEinstellungen = { tagTodo: "todo", tagTermin: "termin" };

describe("baueInlineZeile", () => {
  it("baut eine einfache Aufgabe", () => {
    const zeile = baueInlineZeile(
      { art: "todo", zustand: " ", titel: "Auto waschen", uid: "a-1", start: "2026-07-20", extraTags: [] },
      EINSTELLUNGEN
    );
    expect(zeile).toBe("- [ ] Auto waschen #todo [start:: 2026-07-20] [uid:: a-1]");
  });

  it("lässt leere Felder weg", () => {
    const zeile = baueInlineZeile(
      { art: "todo", zustand: " ", titel: "A", uid: "a-1", start: "", prioritaet: "  ", extraTags: [] },
      EINSTELLUNGEN
    );
    expect(zeile).toBe("- [ ] A #todo [uid:: a-1]");
  });

  it("behält die Einrückung und den Zustand", () => {
    const zeile = baueInlineZeile(
      { einrueckung: "    ", art: "todo", zustand: "x", titel: "A", uid: "a-1", extraTags: [] },
      EINSTELLUNGEN
    );
    expect(zeile).toBe("    - [x] A #todo [uid:: a-1]");
  });

  it("setzt zusätzliche Tags hinter den Verwaltungs-Tag und lässt ungültige weg", () => {
    const zeile = baueInlineZeile(
      { art: "todo", zustand: " ", titel: "A", uid: "a-1", extraTags: ["wichtig", "#projekt/alpha", "mit leerzeichen", ""] },
      EINSTELLUNGEN
    );
    expect(zeile).toBe("- [ ] A #todo #wichtig #projekt/alpha [uid:: a-1]");
  });

  it("macht Zeilenumbrüche im Titel zu Leerzeichen", () => {
    const zeile = baueInlineZeile(
      { art: "todo", zustand: " ", titel: "Zeile1\nZeile2", uid: "a-1", extraTags: [] },
      EINSTELLUNGEN
    );
    expect(zeile).toBe("- [ ] Zeile1 Zeile2 #todo [uid:: a-1]");
  });

  it("schreibt Termin-Felder nur bei Terminen", () => {
    const eingabe = { zustand: " " as const, titel: "A", uid: "a-1", ort: "Praxis", extraTags: [] };
    expect(baueInlineZeile({ ...eingabe, art: "todo" }, EINSTELLUNGEN)).not.toContain("location");
    expect(baueInlineZeile({ ...eingabe, art: "termin" }, EINSTELLUNGEN)).toContain("[location:: Praxis]");
  });
});

describe("baueInlineZeile: Hin und zurück mit leseInlineZeile", () => {
  it("liest alles wieder genauso aus, auch Sonderfälle", () => {
    const zeile = baueInlineZeile(
      {
        art: "termin",
        zustand: "-",
        titel: "Zahnarzt",
        uid: "20260701-ab12cd34",
        start: "2026-07-10T10:00",
        ende: "2026-07-10T11:00",
        rrule: "FREQ=YEARLY",
        ankerStart: "2025-07-10T10:00",
        prioritaet: "hoch",
        uebergeordnet: "[[Gesundheit]]",
        ort: "Praxis Dr. Müller [Haus A",
        kalender: "Privat",
        beschreibung: "Zeile1\nZeile2 mit #wichtig und ]",
        erinnerung: [15, 1440],
        erledigt: ["2025-07-10"],
        uebersprungen: ["2024-07-10", "2023-07-10"],
        extraTags: ["gesundheit"],
      },
      EINSTELLUNGEN
    );
    const gelesen = leseInlineZeile(zeile, EINSTELLUNGEN)!;
    expect(gelesen.art).toBe("termin");
    expect(gelesen.zustand).toBe("uebersprungen");
    expect(gelesen.titel).toBe("Zahnarzt");
    expect(gelesen.start).toBe("2026-07-10T10:00");
    expect(gelesen.ende).toBe("2026-07-10T11:00");
    expect(gelesen.rrule).toBe("FREQ=YEARLY");
    expect(gelesen.ankerStart).toBe("2025-07-10T10:00");
    expect(gelesen.prioritaet).toBe("hoch");
    expect(gelesen.uebergeordnet).toBe("[[Gesundheit]]");
    expect(gelesen.ort).toBe("Praxis Dr. Müller [Haus A");
    expect(gelesen.kalender).toBe("Privat");
    expect(gelesen.beschreibung).toBe("Zeile1\nZeile2 mit #wichtig und ]");
    expect(gelesen.erinnerung).toEqual([15, 1440]);
    expect(gelesen.erledigt).toEqual(["2025-07-10"]);
    expect(gelesen.uebersprungen).toEqual(["2024-07-10", "2023-07-10"]);
    expect(gelesen.tags).toEqual(["gesundheit"]); // "#wichtig" in der Beschreibung ist KEIN Tag
    expect(gelesen.uid).toBe("20260701-ab12cd34");
    expect(zeile.includes("\n")).toBe(false); // bleibt eine Zeile
  });
});
