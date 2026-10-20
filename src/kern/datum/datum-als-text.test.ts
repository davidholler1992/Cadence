/**
 * Tests für datumAlsText().
 * So liest man einen Test: "describe" gruppiert, "it" beschreibt einen
 * einzelnen Fall, "expect(...).toBe(...)" prüft, ob das Ergebnis stimmt.
 */

import { describe, expect, it } from "vitest";
import { datumAlsText } from "./datum-als-text";

describe("datumAlsText", () => {
  it("formatiert ein normales Datum", () => {
    expect(datumAlsText(new Date(2026, 6, 20))).toBe("2026-07-20");
  });

  it("füllt Monat und Tag mit führender Null auf", () => {
    expect(datumAlsText(new Date(2026, 0, 5))).toBe("2026-01-05");
  });

  it("nutzt die lokale Zeit: 00:30 Uhr am 10.10. ist noch der 10.10.", () => {
    // Genau dieser Fall war im alten Plugin falsch (dort kam der 09.10. heraus).
    expect(datumAlsText(new Date(2026, 9, 10, 0, 30))).toBe("2026-10-10");
  });

  it("kommt mit dem Jahreswechsel klar", () => {
    expect(datumAlsText(new Date(2026, 11, 31, 23, 59))).toBe("2026-12-31");
  });
});
