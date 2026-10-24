/**
 * Was:      Erkennt, ob eine Serie komplett abgeschlossen ist (alle
 *           Vorkommen erledigt oder übersprungen).
 * Warum:    Das Plugin merkt sich keinen Zustand im Speicher. Ein Eintrag mit
 *           Haken, dessen Serie zu Ende ist, bleibt aber abgehakt stehen
 *           (es gibt kein nächstes Vorkommen, zu dem er springen könnte).
 *           Damit er nicht bei jeder Änderung erneut verarbeitet wird, wird
 *           verglichen: Anzahl erledigt + übersprungen ≥ Gesamtzahl der
 *           Vorkommen (aus COUNT oder UNTIL, bei beiden gilt der kleinere
 *           Wert). Serien ohne Ende sind nie abgeschlossen.
 * Beispiel: istSerieAbgeschlossen({ start: "2026-08-03", rrule: "FREQ=WEEKLY;COUNT=3",
 *             erledigt: ["a", "b", "c"], uebersprungen: [] })  →  true
 */

import { maximaleAnzahl, untilDatum } from "../wiederholung/serienende";
import { zaehleVorkommenBisUntil } from "../wiederholung/vorkommen-zaehlen";
import type { SerienZustand } from "./serie-weiterschalten";

/** Hat die Regel ein Ende (COUNT oder UNTIL)? */
export function hatSerienende(rrule: string): boolean {
  return maximaleAnzahl(rrule) !== undefined || untilDatum(rrule) !== undefined;
}

/** Gesamtzahl der Vorkommen. undefined bei Serien ohne Ende oder wenn sie nicht bestimmbar ist. */
export function gesamtzahlVorkommen(rrule: string, erstesDatum: string): number | undefined {
  const anzahl = maximaleAnzahl(rrule);
  const until = untilDatum(rrule);
  const nachUntil = until === undefined ? undefined : zaehleVorkommenBisUntil(rrule, erstesDatum, until);

  if (anzahl !== undefined && nachUntil !== undefined) return Math.min(anzahl, nachUntil);
  return anzahl ?? nachUntil;
}

export function istSerieAbgeschlossen(zustand: SerienZustand): boolean {
  if (!zustand.rrule || !zustand.start) return false;
  const gesamt = gesamtzahlVorkommen(zustand.rrule, zustand.ankerStart ?? zustand.start);
  return gesamt !== undefined && zustand.erledigt.length + zustand.uebersprungen.length >= gesamt;
}
