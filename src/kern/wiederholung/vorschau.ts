/**
 * Was:      Die nächsten Termine einer Wiederholung als Vorschau im Dialog.
 * Warum:    Gab es dreimal, die Kopie in task-create-modal hatte dabei einen
 *           Fehler: Bei Monatsende-Regeln verankerte sie sich bei jedem Schritt
 *           neu am Vortermin. Hier wird die aktualisierte rrule von Schritt zu
 *           Schritt weitergereicht, daher stimmt auch 31.01. → 28.02. → 31.03.
 *           UNTIL und COUNT werden beachtet.
 * Beispiel: vorschauVorkommen("FREQ=WEEKLY", "2026-07-20T09:00")
 *             →  ["2026-07-20T09:00", "2026-07-27T09:00", "2026-08-03T09:00"]
 */

import { uhrzeitUebernehmen } from "../datum/uhrzeit";
import { naechstesVorkommen } from "./naechstes-vorkommen";
import { maximaleAnzahl } from "./serienende";

/**
 * @param bereitsVergangen Wie viele Vorkommen der Serie schon erledigt/übersprungen sind,
 *                         wichtig nur für COUNT. Neue Serien: 0.
 */
export function vorschauVorkommen(rrule: string, start: string, anzahl = 3, bereitsVergangen = 0): string[] {
  if (!start) return [];
  if (!rrule) return [start];

  const maximum = maximaleAnzahl(rrule);
  const erlaubt = maximum === undefined ? anzahl : Math.min(anzahl, Math.max(maximum - bereitsVergangen, 1));

  const ergebnis = [start];
  let aktuellerStart = start;
  let aktuelleRrule = rrule;

  while (ergebnis.length < erlaubt) {
    const naechstes = naechstesVorkommen(aktuelleRrule, aktuellerStart);
    if (!naechstes) break;
    aktuellerStart = uhrzeitUebernehmen(naechstes.naechsterStart, start);
    aktuelleRrule = naechstes.aktualisierteRrule ?? aktuelleRrule;
    ergebnis.push(aktuellerStart);
  }
  return ergebnis;
}
