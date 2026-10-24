/**
 * Was:      Erzeugt eine neue, eindeutige Kennung (UID) für einen Eintrag.
 * Warum:    Die UID verbindet einen Eintrag mit seinem Termin im Kalender
 *           (CalDAV) und mit seiner Historie. Früher nur 4 Zufallszeichen pro
 *           Tag (bei ein paar hundert Einträgen können sich zwei treffen),
 *           jetzt 8 Zeichen aus dem Zufallsgenerator des Systems.
 * Beispiel: uidErzeugen("2026-07-20")  →  "20260720-3fa9c0b1"
 */

function zufaelligeHexZeichen(): string {
  const bytes = new Uint8Array(4);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (byte) => byte.toString(16).padStart(2, "0")).join("");
}

/**
 * @param datum      Datum der Erzeugung als "JJJJ-MM-TT" (üblicherweise heute()).
 * @param zufallsHex Nur für Tests: liefert die 8 Zufallszeichen.
 */
export function uidErzeugen(datum: string, zufallsHex: () => string = zufaelligeHexZeichen): string {
  return `${datum.replace(/-/g, "")}-${zufallsHex()}`;
}
