import { describe, expect, it } from "vitest";
import { leseNotiz } from "./notiz-lesen";

describe("leseNotiz: Erkennung", () => {
  it("liest eine Aufgabe", () => {
    const eintrag = leseNotiz({ type: "todo", uid: "a-1", done: false, start: "2026-07-20", priority: "hoch" }, "Auto waschen")!;
    expect(eintrag.art).toBe("todo");
    expect(eintrag.titel).toBe("Auto waschen");
    expect(eintrag.uid).toBe("a-1");
    expect(eintrag.zustand).toBe("offen");
    expect(eintrag.start).toBe("2026-07-20");
    expect(eintrag.prioritaet).toBe("hoch");
  });

  it("ignoriert Notizen ohne passenden type oder ohne Frontmatter", () => {
    expect(leseNotiz({ type: "projekt" }, "X")).toBeNull();
    expect(leseNotiz({}, "X")).toBeNull();
    expect(leseNotiz(undefined, "X")).toBeNull();
  });

  it("liest einen Termin mit allen Feldern", () => {
    const eintrag = leseNotiz(
      {
        type: "termin",
        uid: "t-1",
        done: false,
        start: "2026-07-10T10:00",
        end: "2026-07-10T11:00",
        rrule: "FREQ=YEARLY",
        anchorStart: "2025-07-10T10:00",
        calendar: "Privat",
        location: "Praxis",
        description: "Notiz",
        reminder: [15, 1440],
        parent: "[[Gesundheit]]",
        completed: ["2025-07-10"],
        skipped: ["2024-07-10"],
        tags: ["kalender/privat", "lokal"],
      },
      "Zahnarzt"
    )!;
    expect(eintrag.ende).toBe("2026-07-10T11:00");
    expect(eintrag.ankerStart).toBe("2025-07-10T10:00");
    expect(eintrag.kalender).toBe("Privat");
    expect(eintrag.ort).toBe("Praxis");
    expect(eintrag.beschreibung).toBe("Notiz");
    expect(eintrag.erinnerung).toEqual([15, 1440]);
    expect(eintrag.uebergeordnet).toBe("[[Gesundheit]]");
    expect(eintrag.erledigt).toEqual(["2025-07-10"]);
    expect(eintrag.uebersprungen).toEqual(["2024-07-10"]);
    expect(eintrag.tags).toEqual(["kalender/privat", "lokal"]);
  });

  it("ignoriert Termin-Felder bei Aufgaben", () => {
    const eintrag = leseNotiz({ type: "todo", calendar: "K", location: "O", description: "B", reminder: [15] }, "A")!;
    expect(eintrag.kalender).toBeUndefined();
    expect(eintrag.ort).toBeUndefined();
    expect(eintrag.beschreibung).toBeUndefined();
    expect(eintrag.erinnerung).toBeUndefined();
  });
});

describe("leseNotiz: Zustand", () => {
  it("erkennt erledigt über done: true", () => {
    expect(leseNotiz({ type: "todo", done: true }, "A")?.zustand).toBe("erledigt");
  });

  it("wertet ein einmaliges Todo mit skipped-Datum als übersprungen", () => {
    expect(leseNotiz({ type: "todo", done: false, skipped: ["2026-07-20"] }, "A")?.zustand).toBe("uebersprungen");
  });

  it("wertet eine Serie mit skipped-Historie als offen (sie ist ja weitergesprungen)", () => {
    const eintrag = leseNotiz({ type: "todo", start: "2026-07-27", rrule: "FREQ=WEEKLY", skipped: ["2026-07-20"] }, "A");
    expect(eintrag?.zustand).toBe("offen");
  });
});

describe("leseNotiz: seltsam gespeicherte Werte", () => {
  it("behandelt leere Texte wie fehlende Werte", () => {
    const eintrag = leseNotiz({ type: "todo", start: "", end: "", rrule: "", priority: "" }, "A")!;
    expect(eintrag.start).toBeUndefined();
    expect(eintrag.ende).toBeUndefined();
    expect(eintrag.rrule).toBeUndefined();
    expect(eintrag.prioritaet).toBeUndefined();
  });

  it("macht aus einem YAML-Datum (Date) wieder Text", () => {
    expect(leseNotiz({ type: "todo", start: new Date(Date.UTC(2026, 6, 20)) }, "A")?.start).toBe("2026-07-20");
  });

  it("kommt mit Text statt Liste bei Historie und Tags klar", () => {
    const eintrag = leseNotiz({ type: "todo", completed: "2026-07-20", tags: "a, #b" }, "A")!;
    expect(eintrag.erledigt).toEqual(["2026-07-20"]);
    expect(eintrag.tags).toEqual(["a", "b"]);
  });

  it("liest die UID als leeren Text, wenn keine da ist", () => {
    expect(leseNotiz({ type: "todo" }, "A")?.uid).toBe("");
  });

  it("nimmt Erinnerungen als Zahlen, auch wenn sie als Text stehen", () => {
    expect(leseNotiz({ type: "termin", reminder: ["15", 60, "x"] }, "A")?.erinnerung).toEqual([15, 60]);
  });
});
