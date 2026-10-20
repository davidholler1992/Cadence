/**
 * Was:      Die sieben Wochentage mit ihren rrule-Kürzeln und die Übersetzung
 *           deutscher Kürzel (DI, MI, DO, SO) in die gültigen englischen.
 * Warum:    rrule kennt nur MO, TU, WE, TH, FR, SA, SU. Wer "BYDAY=MO,MI,FR"
 *           schreibt, würde sonst einen stillen Fehler bekommen. Die Liste
 *           dient auch den Wochentag-Knöpfen im Wiederholungs-Baustein.
 * Beispiel: byDayUebersetzen("MO,MI,FR")  →  "MO,WE,FR"
 *           byDayUebersetzen("-1FR")      →  "-1FR"   (Zahl davor bleibt erhalten)
 */

export const WOCHENTAGE: readonly { code: string; kurzname: string }[] = [
  { code: "MO", kurzname: "Mo" },
  { code: "TU", kurzname: "Di" },
  { code: "WE", kurzname: "Mi" },
  { code: "TH", kurzname: "Do" },
  { code: "FR", kurzname: "Fr" },
  { code: "SA", kurzname: "Sa" },
  { code: "SU", kurzname: "So" },
];

const DEUTSCH_ZU_ENGLISCH: Record<string, string> = { DI: "TU", MI: "WE", DO: "TH", SO: "SU" };

/** Übersetzt eine kommagetrennte BYDAY-Liste. Eine Zahl vor dem Kürzel (z. B. "1MI", "-1FR") bleibt erhalten. */
export function byDayUebersetzen(wert: string): string {
  return wert
    .split(",")
    .map((eintrag) => {
      const sauber = eintrag.trim().toUpperCase();
      const treffer = /^([+-]?\d*)([A-Z]{2})$/.exec(sauber);
      if (!treffer) return sauber;
      const [, zahl, kuerzel] = treffer;
      return `${zahl}${DEUTSCH_ZU_ENGLISCH[kuerzel] ?? kuerzel}`;
    })
    .join(",");
}
