/**
 * Was:      Wochentag eines Datums (Montag = 0) und Wochenanfang (Montag).
 * Warum:    Der Kalender beginnt die Woche mit Montag. JavaScript zählt
 *           dagegen ab Sonntag (0). Die Umrechnung steht nur hier.
 * Beispiel: wochentagMontagErster("2026-07-20")  →  0   (Montag)
 *           wochenanfang("2026-07-26")           →  "2026-07-20"
 */

import { datumAlsUtc } from "./utc-datum";
import { tageAddieren } from "./tage-rechnen";

/** 0 = Montag, 1 = Dienstag, ... 6 = Sonntag. */
export function wochentagMontagErster(datumText: string): number {
  const javascriptTag = datumAlsUtc(datumText).getUTCDay(); // 0 = Sonntag
  return (javascriptTag + 6) % 7;
}

/** Der Montag der Woche, in der das Datum liegt. */
export function wochenanfang(datumText: string): string {
  return tageAddieren(datumText, -wochentagMontagErster(datumText));
}