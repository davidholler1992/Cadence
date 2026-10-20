/**
 * Was:      Das gemeinsame Datenmodell für Aufgaben und Termine, egal ob sie
 *           als eigene Notiz oder als Zeile im Text vorliegen.
 * Warum:    Abfragen und Kalender sollen nicht wissen müssen, woher ein
 *           Eintrag kommt. Sie arbeiten nur mit "Eintrag". Die Quellen
 *           (quellen/notizen, quellen/inline) wandeln ihr jeweiliges Format
 *           in diese Form um und zurück.
 *
 * Hinweis:  Die Werte von "art" (todo/termin) und "zustand" sind feste
 *           Texte im gespeicherten Datenformat. Termin-Felder (ort, kalender,
 *           beschreibung, erinnerung) sind bei Aufgaben immer leer.
 */

export type EintragsArt = "todo" | "termin";

/** Bei vollen Notizen gibt es "uebersprungen" nur für einmalige Einträge (siehe Phase 2c). */
export type EintragsZustand = "offen" | "erledigt" | "uebersprungen";

/** Alles, was einen Eintrag inhaltlich ausmacht, ohne Angabe, woher er kommt. */
export interface EintragsInhalt {
  /** Eindeutige Kennung. Leer, solange noch keine vergeben wurde. */
  uid: string;
  art: EintragsArt;
  zustand: EintragsZustand;
  titel: string;
  /** "JJJJ-MM-TT" (ganztägig) oder "JJJJ-MM-TTTHH:MM". Das Format entscheidet über ganztägig. */
  start?: string;
  ende?: string;
  /** Ohne "RRULE:"-Präfix. */
  rrule?: string;
  /** Erster Start der Serie (siehe kern/serie). */
  ankerStart?: string;
  prioritaet?: string;
  /** Wikilink zur übergeordneten Notiz. */
  uebergeordnet?: string;
  // --- nur Termine ---
  ort?: string;
  kalender?: string;
  beschreibung?: string;
  /** Minuten vor dem Termin. */
  erinnerung?: number[];
  // --- Historie ---
  erledigt: string[];
  uebersprungen: string[];
  /** Zusätzliche Tags, ohne "#" und ohne den Verwaltungs-Tag (#todo/#termin). */
  tags: string[];
}

/** Ein Eintrag samt Angabe, wo er gespeichert ist. */
export interface Eintrag extends EintragsInhalt {
  quelle: "notiz" | "inline";
  /** Pfad der Datei im Vault. */
  pfad: string;
  /** Nur bei Inline-Einträgen: Zeilennummer (ab 0). */
  zeile?: number;
}
