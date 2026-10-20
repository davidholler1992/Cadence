/**
 * Was:      Wandelt ein Datum in den Text "JJJJ-MM-TT" um (nach lokaler Zeit).
 * Warum:    Die bisherige Variante (toISOString) rechnet in UTC. Zwischen
 *           00:00 und 02:00 Uhr (Sommerzeit) lieferte sie deshalb noch den
 *           Vortag. Diese Funktion nutzt die Gerätezeit und ist damit überall
 *           richtig, auch im Urlaub.
 * Beispiel: datumAlsText(new Date(2026, 9, 10, 0, 30))  →  "2026-10-10"
 *           (Achtung: In JavaScript zählen Monate ab 0, also 9 = Oktober.)
 */

import { zweistellig } from "../text/zahl-auffuellen";

export function datumAlsText(datum: Date): string {
  const jahr = datum.getFullYear();
  const monat = zweistellig(datum.getMonth() + 1);
  const tag = zweistellig(datum.getDate());
  return `${jahr}-${monat}-${tag}`;
}