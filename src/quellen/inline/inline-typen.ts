/**
 * Was:      Die Typen und festen Namen für Inline-Zeilen (Checkbox-Zeilen im Text).
 * Warum:    Eine Zeile wird nicht in einzelne Werte zerlegt und später neu
 *           zusammengebaut (dabei ging früher Inhalt verloren), sondern in
 *           "Stücke" geteilt, die aneinandergesetzt wieder GENAU die Original-
 *           zeile ergeben. Beim Ändern wird nur das betroffene Stück ersetzt.
 *
 *           Aufbau einer Zeile:
 *             {einrueckung}-{nachStrich}[{zustandZeichen}]{abstandNachBox}{stücke}{blockId}
 *           Beispiel:
 *             "  - [x] Rechnung #todo [start:: 2026-07-20] [uid:: a-1] ^abc"
 *              einrueckung="  ", zustandZeichen="x", stücke=[Text, Tag, Text, Feld, Text, Feld], blockId=" ^abc"
 */

import type { EintragsInhalt } from "../../modell/eintrag";

/** " " = offen, "x" = erledigt, "-" = übersprungen. */
export type InlineZustand = " " | "x" | "-";

/** Normaler Text (kann Wikilinks, Markdown-Links, Code und Leerzeichen enthalten). */
export interface TextStueck {
  art: "text";
  roh: string;
}

/** Ein Tag wie "#todo". "name" ohne "#". */
export interface TagStueck {
  art: "tag";
  name: string;
  roh: string;
}

/** Ein Feld wie "[start:: 2026-07-20]". "wert" ist bereits entschlüsselt (siehe feld-wert.ts). */
export interface FeldStueck {
  art: "feld";
  schluessel: string;
  wert: string;
  roh: string;
}

export type Stueck = TextStueck | TagStueck | FeldStueck;

export interface ZerlegteZeile {
  einrueckung: string;
  /** Das einzelne Leerraum-Zeichen zwischen "-" und "[". */
  nachStrich: string;
  /** Das Zeichen in der Checkbox, wie im Original (" ", "x", "X" oder "-"). */
  zustandZeichen: string;
  /** Leerraum zwischen "]" der Checkbox und dem Inhalt. */
  abstandNachBox: string;
  stuecke: Stueck[];
  /** Block-ID am Zeilenende samt führendem Leerraum, z. B. " ^abc123", sonst "". */
  blockId: string;
}

export interface InlineEinstellungen {
  /** Name des Tags für Aufgaben, mit oder ohne "#". */
  tagTodo: string;
  /** Name des Tags für Termine, mit oder ohne "#". */
  tagTermin: string;
}

/** Die Schlüssel der Inline-Felder. Sie sind Teil des gespeicherten Formats und bleiben englisch. */
export const FELD = {
  start: "start",
  ende: "end",
  rrule: "rrule",
  ankerStart: "anchorStart",
  prioritaet: "priority",
  uebergeordnet: "parent",
  ort: "location",
  kalender: "calendar",
  beschreibung: "description",
  erinnerung: "reminder",
  erledigt: "completed",
  uebersprungen: "skipped",
  uid: "uid",
} as const;

/** Eine gelesene Inline-Zeile: der Inhalt plus die zerlegte Zeile für spätere gezielte Änderungen. */
export interface InlineGelesen extends EintragsInhalt {
  zerlegt: ZerlegteZeile;
}

/** Zeichen in der Checkbox → Zustand. "X" zählt wie "x". */
export function zustandVonZeichen(zeichen: string): InlineZustand {
  if (zeichen === "-") return "-";
  return zeichen.toLowerCase() === "x" ? "x" : " ";
}
