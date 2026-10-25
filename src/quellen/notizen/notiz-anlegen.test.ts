import { describe, expect, it } from "vitest";
import { baueNotizFrontmatter, eindeutigerPfad } from "./notiz-anlegen";
import { leseNotiz } from "./notiz-lesen";

describe("baueNotizFrontmatter", () => {
  it("baut eine ganztägige Aufgabe mit allen Feldern", () => {
    expect(baueNotizFrontmatter({ art: "todo", start: "2026-07-20", extraTags: ["wichtig"] })).toEqual({
      type: "todo",
      uid: "",
      done: false,
      priority: "",
      start: "2026-07-20",
      end: "",
      allday: true,
      rrule: "",
      completed: [],
      skipped: [],
      calendar: "",
      location: "",
      description: "",
      reminder: [],
      parent: "",
      tags: ["wichtig"],
    });
  });

  it("setzt allday nach dem Format von start", () => {
    expect(baueNotizFrontmatter({ art: "termin", start: "2026-07-20T09:00" }).allday).toBe(false);
    expect(baueNotizFrontmatter({ art: "termin", start: "2026-07-20" }).allday).toBe(true);
  });

  it("gibt Terminen die Tags kalender/<name> und lokal", () => {
    const frontmatter = baueNotizFrontmatter({ art: "termin", start: "2026-07-20T09:00", kalender: "Familie & Freunde", extraTags: ["x"] });
    expect(frontmatter.tags).toEqual(["kalender/familie-freunde", "lokal", "x"]);
    expect(frontmatter.calendar).toBe("Familie & Freunde");
  });

  it("lässt den Tag lokal weg, wenn er abgeschaltet wird, und den Kalender-Tag ohne Kalender", () => {
    expect(baueNotizFrontmatter({ art: "termin", lokal: false }).tags).toEqual([]);
    expect(baueNotizFrontmatter({ art: "termin" }).tags).toEqual(["lokal"]);
  });

  it("schreibt Termin-Felder nur bei Terminen und anchorStart nur, wenn er gesetzt ist", () => {
    expect(baueNotizFrontmatter({ art: "todo", ort: "Praxis" }).location).toBe("");
    expect(baueNotizFrontmatter({ art: "termin", ort: "Praxis" }).location).toBe("Praxis");
    expect(baueNotizFrontmatter({ art: "todo" })).not.toHaveProperty("anchorStart");
    expect(baueNotizFrontmatter({ art: "todo", ankerStart: "2026-01-01" }).anchorStart).toBe("2026-01-01");
  });

  it("lässt sich wieder lesen (Hin und zurück)", () => {
    const frontmatter = baueNotizFrontmatter({
      art: "termin",
      uid: "a-1",
      start: "2026-07-10T10:00",
      ende: "2026-07-10T11:00",
      rrule: "FREQ=YEARLY",
      prioritaet: "hoch",
      uebergeordnet: "[[Gesundheit]]",
      ort: "Praxis",
      kalender: "Privat",
      beschreibung: "Notiz",
      erinnerung: [15],
      erledigt: ["2025-07-10"],
    });
    const eintrag = leseNotiz(frontmatter, "Zahnarzt")!;
    expect(eintrag.art).toBe("termin");
    expect(eintrag.uid).toBe("a-1");
    expect(eintrag.start).toBe("2026-07-10T10:00");
    expect(eintrag.ende).toBe("2026-07-10T11:00");
    expect(eintrag.rrule).toBe("FREQ=YEARLY");
    expect(eintrag.ort).toBe("Praxis");
    expect(eintrag.kalender).toBe("Privat");
    expect(eintrag.erinnerung).toEqual([15]);
    expect(eintrag.erledigt).toEqual(["2025-07-10"]);
  });
});

describe("eindeutigerPfad", () => {
  it("nimmt den Titel als Dateinamen", () => {
    expect(eindeutigerPfad("Aufgaben", "Auto waschen", () => false)).toBe("Aufgaben/Auto waschen.md");
  });

  it("zählt hoch, wenn der Name schon belegt ist", () => {
    const belegt = new Set(["Aufgaben/Auto.md", "Aufgaben/Auto (2).md"]);
    expect(eindeutigerPfad("Aufgaben", "Auto", (pfad) => belegt.has(pfad))).toBe("Aufgaben/Auto (3).md");
  });

  it("bereinigt Zeichen, die in Dateinamen nicht erlaubt sind", () => {
    expect(eindeutigerPfad("A", "Termin: Dr. Müller?", () => false)).toBe("A/Termin Dr. Müller.md");
  });

  it("kommt auch ohne Ordner klar", () => {
    expect(eindeutigerPfad("", "Test", () => false)).toBe("Test.md");
  });
});
