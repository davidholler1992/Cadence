import { describe, expect, it } from "vitest";
import { wochenanfang, wochentagMontagErster } from "./wochentag";

describe("wochentagMontagErster", () => {
  it("zählt Montag als 0 und Sonntag als 6", () => {
    expect(wochentagMontagErster("2026-07-20")).toBe(0); // Montag
    expect(wochentagMontagErster("2026-07-22")).toBe(2); // Mittwoch
    expect(wochentagMontagErster("2026-07-26")).toBe(6); // Sonntag
  });
});

describe("wochenanfang", () => {
  it("liefert für einen Montag den Montag selbst", () => {
    expect(wochenanfang("2026-07-20")).toBe("2026-07-20");
  });

  it("liefert für einen Sonntag den Montag davor", () => {
    expect(wochenanfang("2026-07-26")).toBe("2026-07-20");
  });

  it("geht über Monatsgrenzen", () => {
    expect(wochenanfang("2026-08-02")).toBe("2026-07-27"); // Sonntag
  });
});