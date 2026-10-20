import { describe, expect, it } from "vitest";
import { datumTeil, hatUhrzeit, uhrzeitTeil } from "./datum-teile";

describe("datumTeil", () => {
  it("schneidet die Uhrzeit ab", () => {
    expect(datumTeil("2026-07-20T09:00")).toBe("2026-07-20");
  });

  it("lässt ein reines Datum unverändert", () => {
    expect(datumTeil("2026-07-20")).toBe("2026-07-20");
  });
});

describe("hatUhrzeit", () => {
  it("erkennt Text mit und ohne Uhrzeit", () => {
    expect(hatUhrzeit("2026-07-20T09:00")).toBe(true);
    expect(hatUhrzeit("2026-07-20")).toBe(false);
  });
});

describe("uhrzeitTeil", () => {
  it("liefert die Uhrzeit", () => {
    expect(uhrzeitTeil("2026-07-20T09:00")).toBe("09:00");
  });

  it("liefert undefined bei ganztägigem Datum", () => {
    expect(uhrzeitTeil("2026-07-20")).toBeUndefined();
  });
});