/**
 * Was:      Füllt eine Zahl mit führender Null auf zwei Stellen auf.
 * Warum:    Datum und Uhrzeit brauchen überall "05" statt "5". Bisher stand
 *           diese Zeile in vielen Dateien einzeln, jetzt nur noch hier.
 * Beispiel: zweistellig(5)  →  "05"
 */

export function zweistellig(zahl: number): string {
  return String(zahl).padStart(2, "0");
}