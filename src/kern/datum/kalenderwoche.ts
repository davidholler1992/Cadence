/**
 * Was:      Berechnet die Kalenderwoche nach ISO 8601.
 * Warum:    Die Wochenspalte im Monatskalender zeigt die KW an. Regel: Die
 *           Woche beginnt mit Montag, KW 1 ist die Woche mit dem ersten
 *           Donnerstag des Jahres.
 * Beispiel: kalenderwoche("2026-07-20")  →  30
 *           kalenderwoche("2026-12-31")  →  53
 */

import { datumAlsUtc } from "./utc-datum";

const MILLISEKUNDEN_PRO_TAG = 86_400_000;

export function kalenderwoche(datumText: string): number {
  const datum = datumAlsUtc(datumText);
  const wochentag = (datum.getUTCDay() + 6) % 7; // Montag = 0

  // Der Donnerstag derselben Woche entscheidet, zu welchem Jahr die Woche zählt.
  const donnerstag = new Date(datum);
  donnerstag.setUTCDate(datum.getUTCDate() - wochentag + 3);

  const jahresanfang = new Date(Date.UTC(donnerstag.getUTCFullYear(), 0, 1));
  const tageSeitJahresanfang = (donnerstag.getTime() - jahresanfang.getTime()) / MILLISEKUNDEN_PRO_TAG;
  return Math.ceil((tageSeitJahresanfang + 1) / 7);
}