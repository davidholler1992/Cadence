/**
 * Was:      Erkennt, ob eine Wiederholung zu Ende ist (UNTIL oder COUNT).
 * Warum:    UNTIL ("bis Datum") ist ein festes Datum und lässt sich direkt
 *           prüfen. COUNT ("genau N Mal") dagegen ändern wir NICHT mehr in
 *           der rrule ab (früher wurde heruntergezählt, das hat Server-Serie
 *           und Vergangenheit kaputt gemacht). Stattdessen zählen wir, wie
 *           viele Vorkommen schon erledigt oder übersprungen sind.
 * Beispiel: untilDatum("FREQ=WEEKLY;UNTIL=20261231")      →  "2026-12-31"
 *           istAnzahlErreicht("FREQ=DAILY;COUNT=3", 3)    →  true
 */

import { rruleParameterLesen } from "./rrule-text";

/** Das UNTIL-Datum als "JJJJ-MM-TT", oder undefined, wenn keines gesetzt ist. */
export function untilDatum(rrule: string): string | undefined {
  const until = rruleParameterLesen(rrule).UNTIL;
  const treffer = until ? /^(\d{4})(\d{2})(\d{2})/.exec(until) : null;
  return treffer ? `${treffer[1]}-${treffer[2]}-${treffer[3]}` : undefined;
}

/** Der COUNT-Wert (Gesamtzahl der Vorkommen), oder undefined, wenn keiner gesetzt ist. */
export function maximaleAnzahl(rrule: string): number | undefined {
  const count = rruleParameterLesen(rrule).COUNT;
  const zahl = count ? parseInt(count, 10) : NaN;
  return Number.isFinite(zahl) ? zahl : undefined;
}

/** Liegt das Datum NACH dem UNTIL-Datum? Ohne UNTIL immer false. */
export function liegtNachSerienende(rrule: string, datum: string): boolean {
  const bis = untilDatum(rrule);
  return bis !== undefined && datum > bis;
}

/** Sind schon so viele Vorkommen erledigt/übersprungen, wie COUNT erlaubt? Ohne COUNT immer false. */
export function istAnzahlErreicht(rrule: string, anzahlVergangene: number): boolean {
  const maximum = maximaleAnzahl(rrule);
  return maximum !== undefined && anzahlVergangene >= maximum;
}
