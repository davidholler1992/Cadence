import { describe, expect, it } from "vitest";
import { zaehleVorkommenBisUntil } from "./vorkommen-zaehlen";

describe("zaehleVorkommenBisUntil", () => {
  it("zählt wöchentliche Vorkommen einschließlich Start und UNTIL-Tag", () => {
    expect(zaehleVorkommenBisUntil("FREQ=WEEKLY;UNTIL=20260810", "2026-07-20", "2026-08-10")).toBe(4);
  });

  it("zählt tägliche Vorkommen", () => {
    expect(zaehleVorkommenBisUntil("FREQ=DAILY;UNTIL=20260722", "2026-07-20", "2026-07-22")).toBe(3);
  });

  it("zählt den Start auch, wenn er nicht zum Muster passt", () => {
    // Start Dienstag, Regel nur montags: Start + 27.07. + 03.08.
    expect(zaehleVorkommenBisUntil("FREQ=WEEKLY;BYDAY=MO;UNTIL=20260803", "2026-07-21", "2026-08-03")).toBe(3);
  });

  it("liefert 1, wenn UNTIL vor dem Start liegt", () => {
    expect(zaehleVorkommenBisUntil("FREQ=DAILY;UNTIL=20260101", "2026-07-20", "2026-01-01")).toBe(1);
  });

  it("zählt bei der Monatsende-Logik (31.01. → 28.02. → 31.03. → 30.04.)", () => {
    expect(zaehleVorkommenBisUntil("FREQ=MONTHLY;UNTIL=20260430", "2026-01-31", "2026-04-30")).toBe(4);
  });

  it("kommt auch mit vielen Vorkommen schnell zurecht", () => {
    expect(zaehleVorkommenBisUntil("FREQ=DAILY;UNTIL=20991231", "2026-01-01", "2099-12-31")).toBeGreaterThan(26000);
  });

  it("liefert undefined bei ungültiger Regel", () => {
    expect(zaehleVorkommenBisUntil("FREQ=UNSINN;UNTIL=20260810", "2026-07-20", "2026-08-10")).toBeUndefined();
  });
});
