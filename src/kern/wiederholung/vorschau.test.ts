import { describe, expect, it } from "vitest";
import { vorschauVorkommen } from "./vorschau";

describe("vorschauVorkommen", () => {
  it("zeigt Start und die zwei folgenden Termine", () => {
    expect(vorschauVorkommen("FREQ=DAILY", "2026-07-20")).toEqual(["2026-07-20", "2026-07-21", "2026-07-22"]);
  });

  it("behält die Uhrzeit des Starts", () => {
    expect(vorschauVorkommen("FREQ=WEEKLY", "2026-07-20T09:00")).toEqual([
      "2026-07-20T09:00",
      "2026-07-27T09:00",
      "2026-08-03T09:00",
    ]);
  });

  it("zeigt ohne Wiederholung nur den Start", () => {
    expect(vorschauVorkommen("", "2026-07-20")).toEqual(["2026-07-20"]);
  });

  it("zeigt ohne Start nichts", () => {
    expect(vorschauVorkommen("FREQ=DAILY", "")).toEqual([]);
  });

  it("bleibt am Monatsende beim Wunsch-Tag (der alte Fehler)", () => {
    expect(vorschauVorkommen("FREQ=MONTHLY", "2026-01-31")).toEqual(["2026-01-31", "2026-02-28", "2026-03-31"]);
  });

  it("hört bei UNTIL auf", () => {
    expect(vorschauVorkommen("FREQ=WEEKLY;UNTIL=20260727", "2026-07-20")).toEqual(["2026-07-20", "2026-07-27"]);
  });

  it("hört bei COUNT auf", () => {
    expect(vorschauVorkommen("FREQ=DAILY;COUNT=2", "2026-07-20")).toEqual(["2026-07-20", "2026-07-21"]);
  });

  it("berücksichtigt bei COUNT die schon vergangenen Vorkommen", () => {
    expect(vorschauVorkommen("FREQ=DAILY;COUNT=4", "2026-07-22", 3, 2)).toEqual(["2026-07-22", "2026-07-23"]);
  });
});
