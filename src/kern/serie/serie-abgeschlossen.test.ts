import { describe, expect, it } from "vitest";
import { gesamtzahlVorkommen, hatSerienende, istSerieAbgeschlossen } from "./serie-abgeschlossen";
import type { SerienZustand } from "./serie-weiterschalten";

const zustand = (teile: Partial<SerienZustand>): SerienZustand => ({ erledigt: [], uebersprungen: [], ...teile });

describe("hatSerienende", () => {
  it("erkennt COUNT und UNTIL", () => {
    expect(hatSerienende("FREQ=DAILY;COUNT=3")).toBe(true);
    expect(hatSerienende("FREQ=DAILY;UNTIL=20261231")).toBe(true);
    expect(hatSerienende("FREQ=DAILY")).toBe(false);
  });
});

describe("gesamtzahlVorkommen", () => {
  it("nimmt COUNT", () => {
    expect(gesamtzahlVorkommen("FREQ=DAILY;COUNT=5", "2026-07-20")).toBe(5);
  });

  it("zählt bei UNTIL", () => {
    expect(gesamtzahlVorkommen("FREQ=WEEKLY;UNTIL=20260727", "2026-07-20")).toBe(2);
  });

  it("nimmt bei COUNT und UNTIL den kleineren Wert", () => {
    expect(gesamtzahlVorkommen("FREQ=DAILY;COUNT=10;UNTIL=20260722", "2026-07-20")).toBe(3);
    expect(gesamtzahlVorkommen("FREQ=DAILY;COUNT=2;UNTIL=20260730", "2026-07-20")).toBe(2);
  });

  it("liefert undefined ohne Ende", () => {
    expect(gesamtzahlVorkommen("FREQ=DAILY", "2026-07-20")).toBeUndefined();
  });
});

describe("istSerieAbgeschlossen", () => {
  it("ist bei COUNT erst abgeschlossen, wenn alle Vorkommen in der Historie stehen", () => {
    const regel = { start: "2026-08-03", rrule: "FREQ=WEEKLY;COUNT=3" };
    expect(istSerieAbgeschlossen(zustand({ ...regel, erledigt: ["a", "b"] }))).toBe(false);
    expect(istSerieAbgeschlossen(zustand({ ...regel, erledigt: ["a", "b"], uebersprungen: ["c"] }))).toBe(true);
  });

  it("rechnet bei UNTIL vom ankerStart aus", () => {
    const regel = { start: "2026-07-27", ankerStart: "2026-07-20", rrule: "FREQ=WEEKLY;UNTIL=20260727" };
    expect(istSerieAbgeschlossen(zustand({ ...regel, erledigt: ["a"] }))).toBe(false);
    expect(istSerieAbgeschlossen(zustand({ ...regel, erledigt: ["a", "b"] }))).toBe(true);
  });

  it("rechnet bei UNTIL ohne ankerStart vom Start aus (nie gesprungen)", () => {
    const regel = { start: "2026-07-20", rrule: "FREQ=WEEKLY;UNTIL=20260721" };
    expect(istSerieAbgeschlossen(zustand({ ...regel }))).toBe(false);
    expect(istSerieAbgeschlossen(zustand({ ...regel, erledigt: ["a"] }))).toBe(true);
  });

  it("ist ohne Ende, ohne Wiederholung oder ohne Start nie abgeschlossen", () => {
    expect(istSerieAbgeschlossen(zustand({ start: "2026-07-20", rrule: "FREQ=DAILY", erledigt: ["a"] }))).toBe(false);
    expect(istSerieAbgeschlossen(zustand({ start: "2026-07-20", erledigt: ["a"] }))).toBe(false);
    expect(istSerieAbgeschlossen(zustand({ rrule: "FREQ=DAILY;COUNT=1", erledigt: ["a"] }))).toBe(false);
  });
});
