import { describe, expect, it } from "vitest";
import { istInEinemDerOrdner, istInOrdner, ordnerBereinigen } from "./ordner";

describe("ordnerBereinigen", () => {
  it("entfernt Leerraum und überflüssige Schrägstriche", () => {
    expect(ordnerBereinigen(["  Test/Inline/ ", "/Daily", "./Notizen"])).toEqual(["Test/Inline", "Daily", "Notizen"]);
  });

  it("macht aus Backslashes Schrägstriche", () => {
    expect(ordnerBereinigen(["A\\B"])).toEqual(["A/B"]);
  });

  it("sortiert leere Angaben, den Vault-Stamm und Doppelte aus", () => {
    expect(ordnerBereinigen(["", "   ", ".", "/", "Daily", "Daily/"])).toEqual(["Daily"]);
  });
});

describe("istInOrdner", () => {
  it("erkennt Dateien im Ordner und in Unterordnern", () => {
    expect(istInOrdner("Test/a.md", "Test")).toBe(true);
    expect(istInOrdner("Test/Unter/a.md", "Test")).toBe(true);
  });

  it("erkennt Ordner mit ähnlichem Namen NICHT (der alte Fehler)", () => {
    expect(istInOrdner("Test2/a.md", "Test")).toBe(false);
    expect(istInOrdner("Test Archiv/a.md", "Test")).toBe(false);
  });

  it("trifft bei leerem Ordner nie zu (der alte Fehler)", () => {
    expect(istInOrdner("a.md", "")).toBe(false);
    expect(istInOrdner("Test/a.md", "")).toBe(false);
  });
});

describe("istInEinemDerOrdner", () => {
  it("prüft mehrere Ordner", () => {
    expect(istInEinemDerOrdner("B/a.md", ["A", "B"])).toBe(true);
    expect(istInEinemDerOrdner("C/a.md", ["A", "B"])).toBe(false);
    expect(istInEinemDerOrdner("A/a.md", [])).toBe(false);
  });
});
