import { describe, expect, it } from "vitest";
import { kalenderwoche } from "./kalenderwoche";

describe("kalenderwoche", () => {
  it("berechnet eine normale Woche mitten im Jahr", () => {
    expect(kalenderwoche("2026-07-20")).toBe(30);
  });

  it("zählt den Jahresanfang zu KW 1, wenn der 1.1. ein Donnerstag ist", () => {
    expect(kalenderwoche("2026-01-01")).toBe(1);
  });

  it("zählt den 29.12.2025 (Montag) schon zu KW 1 von 2026", () => {
    expect(kalenderwoche("2025-12-29")).toBe(1);
  });

  it("kennt das Jahr mit 53 Wochen", () => {
    expect(kalenderwoche("2026-12-31")).toBe(53);
    expect(kalenderwoche("2027-01-01")).toBe(53); // gehört noch zu 2026
    expect(kalenderwoche("2027-01-04")).toBe(1);
  });

  it("zählt den 30.12.2024 (Montag) zu KW 1 von 2025", () => {
    expect(kalenderwoche("2024-12-30")).toBe(1);
  });
});