/**
 * Was:   Einstellungen für die automatischen Tests (Vitest).
 * Warum: Tests sollen auf jedem Rechner gleich laufen. Deshalb wird die
 *        Zeitzone hier fest auf Berlin gesetzt (nur für Tests, das Plugin
 *        selbst nutzt später immer die Gerätezeit).
 */

import { defineConfig } from "vitest/config";

process.env.TZ = "Europe/Berlin";

export default defineConfig({
  test: {
    environment: "node",
    // Testdateien liegen direkt neben dem Code und heißen *.test.ts
    include: ["src/**/*.test.ts"],
  },
});
