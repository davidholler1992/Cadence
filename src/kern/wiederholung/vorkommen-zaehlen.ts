/**
 * Was:      Zählt, wie viele Vorkommen eine Serie mit UNTIL insgesamt hat.
 * Warum:    Ohne gespeicherten Zustand muss das Plugin erkennen, ob eine
 *           Serie schon komplett abgeschlossen ist (sonst würde ein fertiger
 *           Eintrag bei jeder Änderung erneut verarbeitet). Dafür wird die
 *           Gesamtzahl mit der Zahl der erledigten/übersprungenen Vorkommen
 *           verglichen. Das erste Vorkommen ist das Startdatum selbst.
 *           Ist die Zahl nicht bestimmbar (z. B. ungültige Regel), kommt
 *           undefined zurück.
 * Beispiel: zaehleVorkommenBisUntil("FREQ=WEEKLY;UNTIL=20260810", "2026-07-20", "2026-08-10")  →  4
 *           (20.07., 27.07., 03.08., 10.08.)
 */

import { rrulestr } from "rrule";
import { datumTeil } from "../datum/datum-teile";
import { tageAddieren } from "../datum/tage-rechnen";
import { datumAlsUtc } from "../datum/utc-datum";
import { naechstesVorkommen } from "./naechstes-vorkommen";
import { ankerKappungsHaeufigkeit } from "./regel-art";
import { rruleFuerBerechnung, rruleNormalisieren, rruleParameterLesen } from "./rrule-text";

/** Schutz gegen Endlosschleifen bei der Monatsende-Logik (5000 Monate sind über 400 Jahre). */
const OBERGRENZE_ANKER = 5000;

function zaehleMitAnkerKappung(rrule: string, erstesDatum: string): number | undefined {
  let anzahl = 1;
  let datum = erstesDatum;
  let regel = rrule;
  while (anzahl < OBERGRENZE_ANKER) {
    const naechstes = naechstesVorkommen(regel, datum); // endet bei UNTIL mit null
    if (!naechstes) return anzahl;
    datum = naechstes.naechsterStart;
    regel = naechstes.aktualisierteRrule ?? regel;
    anzahl++;
  }
  return undefined;
}

function zaehleMitBibliothek(rrule: string, erstesDatum: string, until: string): number {
  const kompakt = erstesDatum.replace(/-/g, "");
  const regel = rrulestr(`DTSTART:${kompakt}T000000Z\nRRULE:${rruleFuerBerechnung(rrule)}`);
  const tagNachUntil = datumAlsUtc(tageAddieren(until, 1));
  // between(..., false): ohne die Grenzen selbst, der Start wird also nicht doppelt gezählt.
  return 1 + regel.between(datumAlsUtc(erstesDatum), tagNachUntil, false).length;
}

/** Gesamtzahl der Vorkommen bis zum UNTIL-Datum, den ersten Start eingerechnet. */
export function zaehleVorkommenBisUntil(rrule: string, erstesDatum: string, until: string): number | undefined {
  const erstes = datumTeil(erstesDatum);
  if (erstes > until) return 1;
  try {
    const normalisiert = rruleNormalisieren(rrule);
    if (ankerKappungsHaeufigkeit(rruleParameterLesen(normalisiert))) {
      return zaehleMitAnkerKappung(normalisiert, erstes);
    }
    return zaehleMitBibliothek(normalisiert, erstes, until);
  } catch {
    return undefined;
  }
}
