/**
 * Was:      Wandelt Datumstexte für Tagesrechnungen in UTC-Zeitpunkte um und zurück.
 * Warum:    Wer "plus 7 Tage" mit lokaler Zeit rechnet, kann an Tagen der
 *           Sommerzeit-Umstellung (23 oder 25 Stunden) danebenliegen. Reine
 *           Datumsrechnung läuft deshalb immer über UTC-Mitternacht, dort
 *           hat jeder Tag genau 24 Stunden. Nur für interne Rechnungen
 *           gedacht, "heute" kommt aus heute.ts (Gerätezeit).
 * Beispiel: utcAlsDatumText(datumAlsUtc("2026-07-20"))  →  "2026-07-20"
 */

import { zweistellig } from "../text/zahl-auffuellen";
import { datumTeil } from "./datum-teile";

/** "2026-07-20" (oder mit Uhrzeit) → Mitternacht UTC dieses Tages. */
export function datumAlsUtc(datumText: string): Date {
  const [jahr, monat, tag] = datumTeil(datumText).split("-").map(Number);
  return new Date(Date.UTC(jahr, monat - 1, tag));
}

/** UTC-Zeitpunkt → "JJJJ-MM-TT" (UTC-Anteile, nicht lokale). */
export function utcAlsDatumText(datum: Date): string {
  const jahr = datum.getUTCFullYear();
  const monat = zweistellig(datum.getUTCMonth() + 1);
  const tag = zweistellig(datum.getUTCDate());
  return `${jahr}-${monat}-${tag}`;
}