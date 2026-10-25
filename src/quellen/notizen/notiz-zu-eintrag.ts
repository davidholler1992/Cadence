/**
 * Was:      Macht aus dem Frontmatter einer Notiz einen "Eintrag" mit Angabe,
 *           wo er gespeichert ist.
 * Warum:    Abfragen und Kalender arbeiten nur mit dem gemeinsamen Eintrag
 *           (modell/eintrag.ts). Das Gegenstück für Inline-Zeilen steht in
 *           quellen/inline/zeile-zu-eintrag.ts.
 * Beispiel: eintragAusNotiz("Aufgaben/Auto waschen.md", { type: "todo", start: "2026-07-20" })
 *             →  { titel: "Auto waschen", quelle: "notiz", pfad: "Aufgaben/Auto waschen.md", ... }
 */

import type { Eintrag } from "../../modell/eintrag";
import { leseNotiz } from "./notiz-lesen";
import type { Frontmatter } from "./notiz-typen";

/** "Ordner/Titel.md" → "Titel" */
export function titelAusPfad(pfad: string): string {
  const dateiname = pfad.split("/").pop() ?? pfad;
  return dateiname.replace(/\.md$/i, "");
}

export function eintragAusNotiz(pfad: string, frontmatter: Frontmatter | undefined): Eintrag | null {
  const inhalt = leseNotiz(frontmatter, titelAusPfad(pfad));
  return inhalt ? { ...inhalt, quelle: "notiz", pfad } : null;
}
