import { describe, expect, it } from "vitest";
import { dateinameBereinigen } from "./dateiname";

describe("dateinameBereinigen", () => {
  it("entfernt Zeichen, die in Dateinamen nicht erlaubt sind", () => {
    expect(dateinameBereinigen("Zahnarzt: Dr. Müller?")).toBe("Zahnarzt Dr. Müller");
  });

  it("entfernt Zeichen, die Obsidian-Links stören (# ^ [ ])", () => {
    expect(dateinameBereinigen("[[Test]] #Tag^1")).toBe("Test Tag1");
  });

  it("nimmt den Ersatznamen, wenn nichts übrig bleibt", () => {
    expect(dateinameBereinigen("///")).toBe("Ohne Titel");
    expect(dateinameBereinigen("   ")).toBe("Ohne Titel");
  });

  it("nimmt einen eigenen Ersatznamen, wenn einer angegeben ist", () => {
    expect(dateinameBereinigen("", "Termin")).toBe("Termin");
  });

  it("kürzt auf 80 Zeichen", () => {
    expect(dateinameBereinigen("a".repeat(100))).toHaveLength(80);
  });
});