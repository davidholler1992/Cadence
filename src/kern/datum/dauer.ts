/**
 * Was:      Rechnen mit Minuten (addieren, Abstand) und das Ende eines
 *           Termins mitverschieben, wenn sich der Start ändert.
 * Warum:    Früher gab es zwei verschiedene Regeln (nur Tage verschieben vs.
 *           Dauer erhalten), und die falsche führte beim Verschieben im
 *           Zeitraster dazu, dass sich die Dauer änderte. Jetzt gilt EINE
 *           Regel, siehe endeNachVerschiebung().
 *           Bewusst Wanduhr-Rechnung: Die Sommerzeit-Umstellung wird nicht
 *           berücksichtigt (01:30 + 60 Minuten = 02:30).
 * Beispiel: minutenAddieren("2026-07-28T23:45", 30)  →  "2026-07-29T00:15"
 *           minutenZwischen("2026-07-20T09:00", "2026-07-20T10:30")  →  90
 */

import { zweistellig } from "../text/zahl-auffuellen";
import { datumTeil, hatUhrzeit } from "./datum-teile";
import { tageAddieren, tageZwischen } from "./tage-rechnen";
import { minutenSeitMitternacht, uhrzeitUebernehmen } from "./uhrzeit";
import { datumAlsUtc, utcAlsDatumText } from "./utc-datum";

const MILLISEKUNDEN_PRO_MINUTE = 60_000;

/** Zeitpunkt in Minuten seit 1970 (UTC-Wanduhr). Ohne Uhrzeit im Text zählt 00:00. */
function alsMinutenSeitEpoche(datumText: string): number {
  return datumAlsUtc(datumText).getTime() / MILLISEKUNDEN_PRO_MINUTE + minutenSeitMitternacht(datumText);
}

/** Datum mit Uhrzeit plus Minuten, mit Tagesüberlauf. Ohne Uhrzeit im Text zählt 00:00. */
export function minutenAddieren(datumText: string, minuten: number): string {
  const gesamt = alsMinutenSeitEpoche(datumText) + minuten;
  const ergebnis = new Date(gesamt * MILLISEKUNDEN_PRO_MINUTE);
  const uhrzeit = `${zweistellig(ergebnis.getUTCHours())}:${zweistellig(ergebnis.getUTCMinutes())}`;
  return `${utcAlsDatumText(ergebnis)}T${uhrzeit}`;
}

/** Minuten von Start bis Ende (negativ, wenn das Ende früher liegt). */
export function minutenZwischen(start: string, ende: string): number {
  return alsMinutenSeitEpoche(ende) - alsMinutenSeitEpoche(start);
}

/**
 * Berechnet das neue Ende, wenn ein Termin von altStart auf neuStart wandert.
 *
 * - Ohne altesEnde: kein Ende (undefined), es wird nichts erfunden.
 * - Alter UND neuer Start haben eine Uhrzeit: Die Dauer in Minuten bleibt
 *   exakt erhalten, egal ob sich Datum, Uhrzeit oder beides ändert.
 * - Sonst (ganztägig oder mehrtägig): Das Ende wandert um dieselbe Anzahl
 *   Tage wie der Start, eine vorhandene Uhrzeit des Endes bleibt stehen.
 */
export function endeNachVerschiebung(
  altStart: string,
  altesEnde: string | undefined,
  neuStart: string
): string | undefined {
  if (!altesEnde) return undefined;

  if (hatUhrzeit(altStart) && hatUhrzeit(neuStart)) {
    return minutenAddieren(neuStart, minutenZwischen(altStart, altesEnde));
  }

  const verschiebung = tageZwischen(datumTeil(altStart), datumTeil(neuStart));
  const neuesEndDatum = tageAddieren(datumTeil(altesEnde), verschiebung);
  return uhrzeitUebernehmen(neuesEndDatum, altesEnde);
}