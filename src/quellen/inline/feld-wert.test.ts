import { describe, expect, it } from "vitest";
import { feldWertDekodieren, feldWertKodieren, klammernAusgeglichen } from "./feld-wert";

describe("klammernAusgeglichen", () => {
  it("erkennt paarige Klammern", () => {
    expect(klammernAusgeglichen("[[Projekt XY]]")).toBe(true);
    expect(klammernAusgeglichen("ohne Klammern")).toBe(true);
    expect(klammernAusgeglichen("[a] und [b]")).toBe(true);
  });

  it("erkennt unpaarige Klammern", () => {
    expect(klammernAusgeglichen("Plan [A")).toBe(false);
    expect(klammernAusgeglichen("A] Plan")).toBe(false);
    expect(klammernAusgeglichen("][")).toBe(false);
  });

  it("zählt mit Backslash geschützte Klammern nicht", () => {
    expect(klammernAusgeglichen("Plan \\[A")).toBe(true);
  });
});

describe("feldWertKodieren", () => {
  it("lässt einfachen Text und Wikilinks unverändert", () => {
    expect(feldWertKodieren("Praxis Dr. Müller")).toBe("Praxis Dr. Müller");
    expect(feldWertKodieren("[[Projekt XY]]")).toBe("[[Projekt XY]]");
  });

  it("ersetzt Zeilenumbrüche durch \\n", () => {
    expect(feldWertKodieren("Zeile 1\nZeile 2")).toBe("Zeile 1\\nZeile 2");
    expect(feldWertKodieren("Zeile 1\r\nZeile 2")).toBe("Zeile 1\\nZeile 2");
  });

  it("schützt unpaarige Klammern", () => {
    expect(feldWertKodieren("Plan [A")).toBe("Plan \\[A");
  });

  it("verdoppelt Backslashes", () => {
    expect(feldWertKodieren("C:\\new")).toBe("C:\\\\new");
  });
});

describe("feldWertDekodieren", () => {
  it("macht \\n wieder zu einem Zeilenumbruch", () => {
    expect(feldWertDekodieren("Zeile 1\\nZeile 2")).toBe("Zeile 1\nZeile 2");
  });

  it("unterscheidet einen echten Backslash vor n von einem Zeilenumbruch", () => {
    expect(feldWertDekodieren("C:\\\\new")).toBe("C:\\new");
  });

  it("lässt unbekannte Backslash-Folgen unverändert", () => {
    expect(feldWertDekodieren("C:\\Temp")).toBe("C:\\Temp");
  });
});

describe("Hin und zurück", () => {
  it.each([
    "einfacher Text",
    "Zeile 1\nZeile 2\nZeile 3",
    "[[Projekt XY]]",
    "Plan [A",
    "B] Plan",
    "C:\\new\\table",
    "gemischt [x] und \\ und\nUmbruch ]",
    "",
  ])("ergibt wieder den Ausgangswert: %j", (wert) => {
    expect(feldWertDekodieren(feldWertKodieren(wert))).toBe(wert);
  });
});
