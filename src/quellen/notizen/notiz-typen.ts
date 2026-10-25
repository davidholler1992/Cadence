/**
 * Was:      Typen und feste Feldnamen für Aufgaben/Termine als eigene Notiz.
 * Warum:    Eine Notiz speichert ihre Daten im Frontmatter (YAML am Anfang).
 *           Die Schlüssel sind Teil des gespeicherten Formats und bleiben
 *           englisch, so lassen sich bestehende Notizen weiter lesen.
 *
 *           Ein "Patch" ist eine Liste von Änderungen am Frontmatter
 *           (Schlüssel → neuer Wert). Er enthält nur, was sich ändert.
 */

export type Frontmatter = Record<string, unknown>;

export const NOTIZ_FELD = {
  art: "type",
  uid: "uid",
  erledigt: "done",
  prioritaet: "priority",
  start: "start",
  ende: "end",
  ganztaegig: "allday",
  rrule: "rrule",
  ankerStart: "anchorStart",
  historieErledigt: "completed",
  historieUebersprungen: "skipped",
  kalender: "calendar",
  ort: "location",
  beschreibung: "description",
  erinnerung: "reminder",
  uebergeordnet: "parent",
  tags: "tags",
} as const;

/** Wendet einen Patch auf ein (lebendes) Frontmatter-Objekt an. */
export function patchAnwenden(frontmatter: Frontmatter, patch: Frontmatter): void {
  for (const [schluessel, wert] of Object.entries(patch)) {
    frontmatter[schluessel] = wert;
  }
}
