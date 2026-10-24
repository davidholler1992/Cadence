/**
 * Was:      Entscheidet, ob eine Regel über die eigene Monatsende-Logik
 *           (anker-kappung.ts) oder über die rrule-Bibliothek läuft.
 * Warum:    Diese Entscheidung braucht sowohl das nächste Vorkommen als auch
 *           das Zählen der Vorkommen. Sie steht deshalb nur hier.
 *           Eigene Logik gilt für MONTHLY/YEARLY ohne BYDAY und ohne BYMONTHDAY.
 * Beispiel: ankerKappungsHaeufigkeit({ FREQ: "MONTHLY" })                    →  "MONTHLY"
 *           ankerKappungsHaeufigkeit({ FREQ: "MONTHLY", BYMONTHDAY: "31" })  →  null
 */

import type { RruleParameter } from "./rrule-text";

/** Die Häufigkeit, wenn die Monatsende-Logik gilt, sonst null. */
export function ankerKappungsHaeufigkeit(parameter: RruleParameter): "MONTHLY" | "YEARLY" | null {
  const haeufigkeit = parameter.FREQ;
  const betroffen = haeufigkeit === "MONTHLY" || haeufigkeit === "YEARLY";
  if (!betroffen || parameter.BYDAY || parameter.BYMONTHDAY) return null;
  return haeufigkeit;
}
