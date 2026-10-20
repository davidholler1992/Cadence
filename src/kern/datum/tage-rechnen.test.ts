import { describe, expect, it } from "vitest";
import { tageAddieren, tageImMonat, tageZwischen } from "./tage-rechnen";

describe("tageAddieren", () => {
  it("addiert Tage innerhalb eines Monats", () => {
    expect(tageAddieren("2026-07-20", 7)).toBe("2026-07-27");
  });

  it("geht über Monats- und Jahresgrenzen", () => {
    expect(tageAddieren("2026-01-31", 1)).toBe("2026-02-01");
    expect(tageAddieren("2026-12-31", 1)).toBe("2027-01-01");
  });

  it("rechnet rückwärts, auch im Schaltjahr", () => {
    expect(tageAddieren("2026-03-01", -1)).toBe("2026-02-28");
    expect(tageAddieren("2028-03-01", -1)).toBe("2028-02-29");
  });

  it("ignoriert eine Uhrzeit im Eingabetext", () => {
    expect(tageAddieren("2026-07-20T09:00", 1)).toBe("2026-07-21");
  });

  it("verrechnet sich nicht bei der Sommerzeit-Umstellung", () => {
    expect(tageAddieren("2026-03-28", 2)).toBe("2026-03-30"); // Umstellung 29.03.
    expect(tageAddieren("2026-10-24", 2)).toBe("2026-10-26"); // Umstellung 25.10.
  });
});

describe("tageZwischen", () => {
  it("zählt Tage zwischen zwei Daten", () => {
    expect(tageZwischen("2026-07-20", "2026-07-27")).toBe(7);
    expect(tageZwischen("2026-07-20", "2026-07-20")).toBe(0);
  });

  it("liefert negative Werte, wenn das Ziel früher liegt", () => {
    expect(tageZwischen("2026-07-27", "2026-07-20")).toBe(-7);
  });

  it("zählt über die Sommerzeit-Umstellung richtig", () => {
    expect(tageZwischen("2026-10-24", "2026-10-26")).toBe(2);
  });
});

describe("tageImMonat", () => {
  it("kennt die Monatslängen", () => {
    expect(tageImMonat(2026, 7)).toBe(31);
    expect(tageImMonat(2026, 4)).toBe(30);
    expect(tageImMonat(2026, 12)).toBe(31);
  });

  it("kennt den Februar im normalen Jahr und im Schaltjahr", () => {
    expect(tageImMonat(2026, 2)).toBe(28);
    expect(tageImMonat(2028, 2)).toBe(29);
  });
});