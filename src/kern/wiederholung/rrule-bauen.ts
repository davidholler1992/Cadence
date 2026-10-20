/**
 * Was:      Baut aus den Auswahlfeldern des Dialogs (Häufigkeit, Intervall,
 *           Wochentage) einen rrule-Text.
 * Warum:    Diese Logik gab es dreimal (Aufgabe, Inline, Schnellerfassung).
 *           Jetzt einmal, ohne etwas von Obsidian zu wissen, und testbar.
 * Beispiel: rruleBauen("woechentlich", 2, ["MO", "FR"])  →  "FREQ=WEEKLY;INTERVAL=2;BYDAY=MO,FR"
 *           rruleBauen("keine", 1, [])                   →  ""
 */

export type Haeufigkeit = "keine" | "taeglich" | "woechentlich" | "monatlich" | "jaehrlich" | "eigene";

const RRULE_HAEUFIGKEIT = {
  taeglich: "DAILY",
  woechentlich: "WEEKLY",
  monatlich: "MONTHLY",
  jaehrlich: "YEARLY",
} as const;

/**
 * "keine" und "eigene" (Freitext) ergeben "", dort bestimmt der Aufrufer den Text selbst.
 * Wochentage zählen nur bei "woechentlich".
 */
export function rruleBauen(haeufigkeit: Haeufigkeit, intervall: number, wochentage: string[]): string {
  if (haeufigkeit === "keine" || haeufigkeit === "eigene") return "";

  const teile = [`FREQ=${RRULE_HAEUFIGKEIT[haeufigkeit]}`];
  if (intervall > 1) teile.push(`INTERVAL=${intervall}`);
  if (haeufigkeit === "woechentlich" && wochentage.length > 0) teile.push(`BYDAY=${wochentage.join(",")}`);
  return teile.join(";");
}
