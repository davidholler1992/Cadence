import { describe, expect, it } from "vitest";
import { eintragAusNotiz, titelAusPfad } from "./notiz-zu-eintrag";

describe("titelAusPfad", () => {
  it("nimmt den Dateinamen ohne .md", () => {
    expect(titelAusPfad("Aufgaben/Unter/Auto waschen.md")).toBe("Auto waschen");
    expect(titelAusPfad("Test.md")).toBe("Test");
  });
});

describe("eintragAusNotiz", () => {
  it("ergänzt Quelle, Pfad und Titel", () => {
    const eintrag = eintragAusNotiz("Aufgaben/Auto waschen.md", { type: "todo", uid: "a-1", start: "2026-07-20" })!;
    expect(eintrag.quelle).toBe("notiz");
    expect(eintrag.pfad).toBe("Aufgaben/Auto waschen.md");
    expect(eintrag.titel).toBe("Auto waschen");
    expect(eintrag.zeile).toBeUndefined();
  });

  it("liefert null bei Notizen, die keine Aufgabe/kein Termin sind", () => {
    expect(eintragAusNotiz("Notiz.md", { title: "x" })).toBeNull();
    expect(eintragAusNotiz("Notiz.md", undefined)).toBeNull();
  });
});
