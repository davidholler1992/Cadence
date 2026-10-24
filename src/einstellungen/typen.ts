/**
 * Was:      Die Einstellungen des Plugins (so, wie sie in data.json stehen).
 * Warum:    Ein Ort für alle Einstellungen. Weitere kommen mit den späteren
 *           Phasen dazu (Kalender, CalDAV, Vorlagen).
 */

export interface CadenceEinstellungen {
  /** Ordner, in denen nach Aufgaben und Terminen im Text gesucht wird. Leer = Inline-Funktion aus. */
  inlineOrdner: string[];
  /** Tag für Inline-Aufgaben, ohne "#". */
  tagTodo: string;
  /** Tag für Inline-Termine, ohne "#". */
  tagTermin: string;
}
