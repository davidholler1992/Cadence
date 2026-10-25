/**
 * Was:      Die Startwerte der Einstellungen.
 * Warum:    Gelten, solange nichts gespeichert ist oder ein Wert ungültig
 *           ist. Notizen und Inline-Funktion sind aus, bis Ordner
 *           eingetragen werden.
 */

import type { CadenceEinstellungen } from "./typen";

export const STANDARD_EINSTELLUNGEN: CadenceEinstellungen = {
  aufgabenOrdner: [],
  terminOrdner: [],
  inlineOrdner: [],
  tagTodo: "todo",
  tagTermin: "termin",
};
