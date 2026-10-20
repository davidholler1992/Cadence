/**
 * Was:      Rechnet mit ganzen Tagen: addieren, Abstand, Tage im Monat.
 * Warum:    Früher in fünf Dateien einzeln vorhanden (addDays,
 *           addDaysToDateOnly, shiftDateOnly, dayDelta ...). Jetzt einmal,
 *           sommerzeit-sicher (siehe utc-datum.ts).
 * Beispiel: tageAddieren("2026-07-20", 7)               →  "2026-07-27"
 *           tageZwischen("2026-07-20", "2026-07-27")    →  7
 *           tageImMonat(2028, 2)                        →  29
 */

import { datumAlsUtc, utcAlsDatumText } from "./utc-datum";

const MILLISEKUNDEN_PRO_TAG = 86_400_000;

/** Datum plus/minus Tage. Eine eventuelle Uhrzeit im Eingabetext wird abgeschnitten. */
export function tageAddieren(datumText: string, tage: number): string {
  const datum = datumAlsUtc(datumText);
  datum.setUTCDate(datum.getUTCDate() + tage);
  return utcAlsDatumText(datum);
}

/** Anzahl Tage von "von" bis "bis" (negativ, wenn "bis" früher liegt). */
export function tageZwischen(von: string, bis: string): number {
  const unterschied = datumAlsUtc(bis).getTime() - datumAlsUtc(von).getTime();
  return Math.round(unterschied / MILLISEKUNDEN_PRO_TAG);
}

/** Anzahl Tage eines Monats. Monat zählt hier von 1 (Januar) bis 12 (Dezember). */
export function tageImMonat(jahr: number, monat: number): number {
  return new Date(Date.UTC(jahr, monat, 0)).getUTCDate();
}