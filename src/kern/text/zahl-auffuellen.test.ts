import { describe, expect, it } from "vitest";
import { zweistellig } from "./zahl-auffuellen";

describe("zweistellig", () => {
  it("füllt einstellige Zahlen mit einer Null auf", () => {
    expect(zweistellig(5)).toBe("05");
    expect(zweistellig(0)).toBe("00");
  });

  it("lässt zweistellige Zahlen unverändert", () => {
    expect(zweistellig(12)).toBe("12");
  });
});