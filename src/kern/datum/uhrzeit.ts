/**
 * Was:      Hilfen rund um Uhrzeiten: Uhrzeit übernehmen, Minuten seit
 *           Mitternacht, Minuten als "HH:MM".
 * Warum:    Beim Verschieben eines Termins auf ein neues Datum soll die
 *           Uhrzeit erhalten bleiben. Und der Zeitraster-Kalender rechnet
 *           Uhrzeiten in Minuten um, um Blöcke zu positionieren.
 * Beispiel: uhrzeitUebernehmen("2026-08-08", "2026-07-08T09:00")  →  "2026-08-08T09:00"
 *           minutenSeitMitternacht("2026-07-20T09:30")            →  570
 *           minutenAlsUhrzeit(570)                                →  "09:30"
 */

import { zweistellig } from "../text/zahl-auffuellen";
import { datumTeil, uhrzeitTeil } from "./datum-teile";

/**
 * Setzt auf ein neues Datum die Uhrzeit des alten Textes. Hatte der alte Text
 * keine Uhrzeit (ganztägig), kommt nur das neue Datum heraus.
 */
export function uhrzeitUebernehmen(neuesDatum: string, altesDatumMitUhrzeit: string): string {
  const uhrzeit = uhrzeitTeil(altesDatumMitUhrzeit);
  const datum = datumTeil(neuesDatum);
  return uhrzeit ? `${datum}T${uhrzeit}` : datum;
}

/** Minuten seit 00:00 Uhr. Ohne Uhrzeit im Text: 0. */
export function minutenSeitMitternacht(datumText: string): number {
  const uhrzeit = uhrzeitTeil(datumText);
  if (!uhrzeit) return 0;
  const [stunden, minuten] = uhrzeit.split(":").map(Number);
  return stunden * 60 + minuten;
}

/** Minuten seit Mitternacht → "HH:MM". */
export function minutenAlsUhrzeit(minuten: number): string {
  return `${zweistellig(Math.floor(minuten / 60))}:${zweistellig(minuten % 60)}`;
}