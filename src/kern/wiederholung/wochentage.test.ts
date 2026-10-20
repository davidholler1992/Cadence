import { describe, expect, it } from "vitest";
import { WOCHENTAGE, byDayUebersetzen } from "./wochentage";

describe("WOCHENTAGE", () => {
  it("beginnt mit Montag und endet mit Sonntag", () => {
    expect(WOCHENTAGE[0]).toEqual({ code: "MO", kurzname: "Mo" });
    expect(WOCHENTAGE[6]).toEqual({ code: "SU", kurzname: "So" });
    expect(WOCHENTAGE).toHaveLength(7);
  });
});

describe("byDayUebersetzen", () => {
  it("übersetzt die deutschen Kürzel DI, MI, DO, SO", () => {
    expect(byDayUebersetzen("MO,MI,FR")).toBe("MO,WE,FR");
    expect(byDayUebersetzen("DI,DO,SO")).toBe("TU,TH,SU");
  });

  it("lässt gültige englische Kürzel unverändert", () => {
    expect(byDayUebersetzen("MO,TU,WE")).toBe("MO,TU,WE");
  });

  it("ignoriert Groß-/Kleinschreibung und Leerzeichen", () => {
    expect(byDayUebersetzen("di, do")).toBe("TU,TH");
  });

  it("behält eine Zahl vor dem Kürzel bei", () => {
    expect(byDayUebersetzen("1MI")).toBe("1WE");
    expect(byDayUebersetzen("-1FR")).toBe("-1FR");
  });
});
