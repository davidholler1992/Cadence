import { describe, expect, it } from "vitest";
import { endeNachVerschiebung, minutenAddieren, minutenZwischen } from "./dauer";

describe("minutenAddieren", () => {
  it("addiert Minuten am selben Tag", () => {
    expect(minutenAddieren("2026-07-28T14:00", 30)).toBe("2026-07-28T14:30");
  });

  it("geht über Mitternacht", () => {
    expect(minutenAddieren("2026-07-28T23:45", 30)).toBe("2026-07-29T00:15");
  });

  it("nimmt 00:00 an, wenn keine Uhrzeit dabei ist", () => {
    expect(minutenAddieren("2026-07-28", 90)).toBe("2026-07-28T01:30");
  });

  it("rechnet mit der Wanduhr, die Sommerzeit-Umstellung wird nicht beachtet", () => {
    expect(minutenAddieren("2026-10-25T01:30", 60)).toBe("2026-10-25T02:30");
  });
});

describe("minutenZwischen", () => {
  it("liefert den Abstand in Minuten", () => {
    expect(minutenZwischen("2026-07-20T09:00", "2026-07-20T10:30")).toBe(90);
  });

  it("zählt über Mitternacht", () => {
    expect(minutenZwischen("2026-07-20T23:00", "2026-07-21T01:00")).toBe(120);
  });
});

describe("endeNachVerschiebung", () => {
  it("erfindet kein Ende, wenn es keines gab", () => {
    expect(endeNachVerschiebung("2026-07-20T09:00", undefined, "2026-07-22T14:00")).toBeUndefined();
  });

  it("erhält die Dauer, wenn sich Datum UND Uhrzeit ändern (der alte Fehler)", () => {
    expect(endeNachVerschiebung("2026-07-20T09:00", "2026-07-20T10:30", "2026-07-22T14:00")).toBe("2026-07-22T15:30");
  });

  it("erhält die Dauer, wenn sich nur die Uhrzeit ändert", () => {
    expect(endeNachVerschiebung("2026-07-20T09:00", "2026-07-20T10:00", "2026-07-20T13:15")).toBe("2026-07-20T14:15");
  });

  it("verschiebt mehrtägige ganztägige Termine um dieselben Tage", () => {
    expect(endeNachVerschiebung("2026-07-20", "2026-07-22", "2026-08-01")).toBe("2026-08-03");
  });

  it("verschiebt nur um Tage, wenn der neue Start keine Uhrzeit hat", () => {
    expect(endeNachVerschiebung("2026-07-20T09:00", "2026-07-20T10:00", "2026-07-25")).toBe("2026-07-25T10:00");
  });
});