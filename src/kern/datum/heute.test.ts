/**
 * Tests für heute(). Hier wird die Uhr "gefälscht" (vi.useFakeTimers), damit
 * der Test immer dasselbe Ergebnis liefert, egal wann er läuft.
 */

import { afterEach, describe, expect, it, vi } from "vitest";
import { heute } from "./heute";

describe("heute", () => {
  afterEach(() => {
    vi.useRealTimers(); // Uhr nach jedem Test wieder normal laufen lassen
  });

  it("liefert das lokale Datum der aktuellen Systemzeit", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2026, 9, 10, 0, 30));
    expect(heute()).toBe("2026-10-10");
  });
});
