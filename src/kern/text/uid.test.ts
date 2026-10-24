import { describe, expect, it } from "vitest";
import { uidErzeugen } from "./uid";

describe("uidErzeugen", () => {
  it("hat das Format JJJJMMTT-xxxxxxxx", () => {
    expect(uidErzeugen("2026-07-20")).toMatch(/^20260720-[0-9a-f]{8}$/);
  });

  it("nimmt die übergebenen Zufallszeichen", () => {
    expect(uidErzeugen("2026-07-20", () => "abcd1234")).toBe("20260720-abcd1234");
  });

  it("erzeugt keine Doppelten bei vielen Aufrufen", () => {
    const uids = new Set(Array.from({ length: 2000 }, () => uidErzeugen("2026-07-20")));
    expect(uids.size).toBe(2000);
  });
});
