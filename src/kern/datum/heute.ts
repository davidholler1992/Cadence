/**
 * Was:      Liefert das heutige Datum als "JJJJ-MM-TT" (Gerätezeit).
 * Warum:    Eine einzige Stelle für "heute", damit Abhaken, Kalender und
 *           Sync alle dasselbe Datum verwenden. Lässt sich im Test mit
 *           gefakter Uhrzeit prüfen.
 * Beispiel: heute()  →  "2026-10-11"
 */

import { datumAlsText } from "./datum-als-text";

export function heute(): string {
  return datumAlsText(new Date());
}
