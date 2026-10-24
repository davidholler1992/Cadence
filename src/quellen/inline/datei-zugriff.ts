/**
 * Was:      Die Schnittstelle, über die der Inline-Verarbeiter Dateien liest
 *           und schreibt.
 * Warum:    Der Verarbeiter soll nichts von Obsidian wissen. So lässt er sich
 *           mit einem einfachen Test-Ersatz prüfen. Die echte Umsetzung (mit
 *           Obsidians Vault) kommt in obsidian-anbindung.ts.
 */

export interface DateiZugriff {
  /** Pfade aller Dateien, in denen nach Inline-Zeilen gesucht wird (aus den Einstellungen). */
  inlineDateien(): string[];
  /** Liest den Inhalt (darf aus dem Zwischenspeicher kommen). */
  lese(pfad: string): Promise<string>;
  /** Ändert die Datei in einem Schritt: "umwandeln" bekommt den aktuellen Inhalt und liefert den neuen. */
  ersetze(pfad: string, umwandeln: (aktuellerInhalt: string) => string): Promise<void>;
}
