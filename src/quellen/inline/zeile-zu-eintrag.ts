/**
 * Was:      Macht aus einer gelesenen Inline-Zeile einen "Eintrag" mit Angabe,
 *           wo er steht (Datei und Zeilennummer).
 * Warum:    Abfragen und Kalender arbeiten nur mit dem gemeinsamen Eintrag
 *           (modell/eintrag.ts). Diese Umwandlung liegt hier und nicht im
 *           Ordner modell/, weil sie die Inline-Typen kennen muss, und das
 *           Modell selbst nichts von den Quellen wissen soll.
 * Beispiel: eintragAusInline(gelesen, "Daily/2026-07-20.md", 4)
 *             →  { ...Inhalt, quelle: "inline", pfad: "Daily/2026-07-20.md", zeile: 4 }
 */

import type { Eintrag } from "../../modell/eintrag";
import type { InlineGelesen } from "./inline-typen";

export function eintragAusInline(gelesen: InlineGelesen, pfad: string, zeilennummer: number): Eintrag {
  const { zerlegt, ...inhalt } = gelesen;
  void zerlegt; // wird nur für spätere Änderungen gebraucht, nicht im Eintrag
  return { ...inhalt, quelle: "inline", pfad, zeile: zeilennummer };
}
