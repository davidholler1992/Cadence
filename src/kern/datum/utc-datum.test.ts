import { describe, expect, it } from "vitest";
import { datumAlsUtc, utcAlsDatumText } from "./utc-datum";

describe("utc-datum", () => {
  it("wandelt Text in UTC-Mitternacht und zurück", () => {
    const utc = datumAlsUtc("2026-07-20");
    expect(utc.toISOString()).toBe("2026-07-20T00:00:00.000Z");
    expect(utcAlsDatumText(utc)).toBe("2026-07-20");
  });

  it("ignoriert eine angehängte Uhrzeit", () => {
    expect(utcAlsDatumText(datumAlsUtc("2026-07-20T23:59"))).toBe("2026-07-20");
  });
});