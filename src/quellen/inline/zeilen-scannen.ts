/**
 * Was:      Findet alle Aufgaben/Termine in einem Text (Inhalt einer Notiz).
 * Warum:    Zentraler, reiner Einstieg zum Lesen aller Inline-Zeilen einer
 *           Datei, mit Zeilennummer. Zeilen in Code-Blöcken (``` oder ~~~)
 *           werden übersprungen, damit Beispiele in Anleitungen nicht als
 *           echte Aufgaben zählen (und keine UID hineingeschrieben bekommen).
 * Beispiel: leseAlleInlineZeilen("Text\n- [ ] A #todo\n```\n- [ ] B #todo\n```", einstellungen)
 *             →  [{ zeilennummer: 1, gelesen: {... titel: "A" ...} }]
 */

import type { InlineEinstellungen, InlineGelesen } from "./inline-typen";
import { leseInlineZeile } from "./zeile-lesen";

export interface GefundeneInlineZeile {
  /** Zeilennummer ab 0. */
  zeilennummer: number;
  gelesen: InlineGelesen;
}

/** Teilt einen Text in Zeilen (Windows- und Unix-Zeilenenden). */
export function zeilenAufteilen(inhalt: string): string[] {
  return inhalt.split(/\r?\n/);
}

export function leseAlleInlineZeilen(inhalt: string, einstellungen: InlineEinstellungen): GefundeneInlineZeile[] {
  const gefunden: GefundeneInlineZeile[] = [];
  let imCodeblock = false;

  zeilenAufteilen(inhalt).forEach((zeile, zeilennummer) => {
    if (/^\s*(```|~~~)/.test(zeile)) {
      imCodeblock = !imCodeblock;
      return;
    }
    if (imCodeblock) return;

    const gelesen = leseInlineZeile(zeile, einstellungen);
    if (gelesen) gefunden.push({ zeilennummer, gelesen });
  });
  return gefunden;
}
