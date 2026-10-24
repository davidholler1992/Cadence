import { describe, expect, it } from "vitest";
import { SchreibBremse } from "./schreib-bremse";

describe("SchreibBremse", () => {
  it("erlaubt die ersten Schreibvorgänge und stoppt danach", () => {
    const bremse = new SchreibBremse(3, 1000);
    expect(bremse.darfSchreiben("a.md", 0)).toBe(true);
    expect(bremse.darfSchreiben("a.md", 100)).toBe(true);
    expect(bremse.darfSchreiben("a.md", 200)).toBe(true);
    expect(bremse.darfSchreiben("a.md", 300)).toBe(false);
  });

  it("erlaubt wieder, wenn das Zeitfenster vorbei ist", () => {
    const bremse = new SchreibBremse(1, 1000);
    expect(bremse.darfSchreiben("a.md", 0)).toBe(true);
    expect(bremse.darfSchreiben("a.md", 500)).toBe(false);
    expect(bremse.darfSchreiben("a.md", 1500)).toBe(true);
  });

  it("zählt jede Datei einzeln", () => {
    const bremse = new SchreibBremse(1, 1000);
    expect(bremse.darfSchreiben("a.md", 0)).toBe(true);
    expect(bremse.darfSchreiben("b.md", 0)).toBe(true);
  });
});
