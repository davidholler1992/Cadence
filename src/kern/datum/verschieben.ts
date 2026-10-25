/**
 * Was:      Berechnet Start und Ende neu, wenn ein Eintrag im Kalender
 *           verschoben oder in der Größe verändert wird.
 * Warum:    Gilt für Notizen und Inline-Zeilen gleichermaßen (vorher zweimal
 *           geschrieben). Regeln:
 *           - Verschieben auf ein neues Datum: Die Uhrzeit bleibt erhalten,
 *             außer es wird eine neue angegeben (Ablegen im Zeitraster).
 *           - Das Ende wandert mit, die Dauer bleibt gleich (siehe dauer.ts).
 *           - Größe ändern: Start oder Ende ändern nur ihre Uhrzeit, am Tag
 *             des Starts.
 * Beispiel: zeitraumVerschieben({ start: "2026-07-20T09:00", ende: "2026-07-20T10:30" }, "2026-07-22")
 *             →  { start: "2026-07-22T09:00", ende: "2026-07-22T10:30" }
 */

import { endeNachVerschiebung } from "./dauer";
import { datumTeil } from "./datum-teile";
import { uhrzeitUebernehmen } from "./uhrzeit";

export interface Zeitraum {
  start: string;
  ende?: string;
}

/** Neues Datum, optional mit neuer Uhrzeit. Ohne neue Uhrzeit bleibt die bisherige (falls vorhanden). */
export function zeitraumVerschieben(alt: Zeitraum, neuesDatum: string, neueUhrzeit?: string): Zeitraum {
  const start =
    neueUhrzeit !== undefined ? `${datumTeil(neuesDatum)}T${neueUhrzeit}` : uhrzeitUebernehmen(neuesDatum, alt.start);
  return { start, ende: endeNachVerschiebung(alt.start, alt.ende, start) };
}

/** Das Ende bekommt eine neue Uhrzeit, am Tag des Starts. */
export function endeUhrzeitSetzen(zeitraum: Zeitraum, uhrzeit: string): Zeitraum {
  return { ...zeitraum, ende: `${datumTeil(zeitraum.start)}T${uhrzeit}` };
}

/** Der Start bekommt eine neue Uhrzeit, am Tag des Starts. Das Ende bleibt. */
export function startUhrzeitSetzen(zeitraum: Zeitraum, uhrzeit: string): Zeitraum {
  return { ...zeitraum, start: `${datumTeil(zeitraum.start)}T${uhrzeit}` };
}
