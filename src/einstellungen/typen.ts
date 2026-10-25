/**
 * Was:      Die Einstellungen des Plugins (so, wie sie in data.json stehen).
 * Warum:    Ein Ort für alle Einstellungen. Weitere kommen mit den späteren
 *           Phasen dazu (Kalender, CalDAV, Vorlagen).
 */

export interface CadenceEinstellungen {
  /** Ordner mit Aufgaben-Notizen (eine Notiz pro Aufgabe). Neue Aufgaben entstehen im ersten Ordner. */
  aufgabenOrdner: string[];
  /** Ordner mit Termin-Notizen (eine Notiz pro Termin). Neue Termine entstehen im ersten Ordner. */
  terminOrdner: string[];
  /** Ordner, in denen nach Aufgaben und Terminen im Text gesucht wird. Leer = Inline-Funktion aus. */
  inlineOrdner: string[];
  /** Tag für Inline-Aufgaben, ohne "#". */
  tagTodo: string;
  /** Tag für Inline-Termine, ohne "#". */
  tagTermin: string;
}
