/**
 * Was:      Die Startwerte der Einstellungen.
 * Warum:    Gelten, solange nichts gespeichert ist oder ein Wert ungültig
 *           ist. Die Inline-Funktion ist aus, bis ein Ordner eingetragen wird.
 */

import type { CadenceEinstellungen } from "./typen";

export const STANDARD_EINSTELLUNGEN: CadenceEinstellungen = {
  inlineOrdner: [],
  tagTodo: "todo",
  tagTermin: "termin",
};
