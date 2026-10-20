/**
 * Was:      Zerlegt Datumstexte in Datum und Uhrzeit.
 * Warum:    Im ganzen Plugin gibt es zwei Schreibweisen:
 *             "2026-07-20"        → ganztägig (nur Datum)
 *             "2026-07-20T09:00"  → mit Uhrzeit
 *           Diese kleinen Helfer ersetzen die vielen einzelnen
 *           split("T")-Aufrufe und machen den Code lesbar.
 * Beispiel: datumTeil("2026-07-20T09:00")   →  "2026-07-20"
 *           uhrzeitTeil("2026-07-20T09:00") →  "09:00"
 *           hatUhrzeit("2026-07-20")        →  false
 */

/** Nur der Datumsteil, "JJJJ-MM-TT". */
export function datumTeil(text: string): string {
  return text.split("T")[0];
}

/** Gibt es eine Uhrzeit? (Gegenteil von "ganztägig") */
export function hatUhrzeit(text: string): boolean {
  return text.includes("T");
}

/** Nur die Uhrzeit "HH:MM", oder undefined, wenn es keine gibt. */
export function uhrzeitTeil(text: string): string | undefined {
  const treffer = /T(\d{2}:\d{2})/.exec(text);
  return treffer ? treffer[1] : undefined;
}