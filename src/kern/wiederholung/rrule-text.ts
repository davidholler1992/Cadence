/**
 * Was:      Liest, normalisiert und bereinigt rrule-Texte.
 * Warum:    Eine rrule kam bisher mal mit, mal ohne "RRULE:" davor, mit
 *           deutschen Wochentagen oder mit unseren internen X-ANCHOR-Zusätzen.
 *           Hier gibt es EINE Schreibweise für das Speichern (normalisiert)
 *           und je eine bereinigte Fassung für Server und Berechnung.
 *
 *           Gespeichert wird immer: ohne "RRULE:", Großbuchstaben, englische
 *           Wochentage. Die internen Zusätze X-ANCHORDAY / X-ANCHORMONTH
 *           (siehe anker-kappung.ts) bleiben beim Speichern erhalten.
 * Beispiel: rruleNormalisieren("rrule:freq=weekly;byday=mo,mi")  →  "FREQ=WEEKLY;BYDAY=MO,WE"
 *           rruleFuerServer("FREQ=MONTHLY;X-ANCHORDAY=31")      →  "FREQ=MONTHLY"
 */

import { byDayUebersetzen } from "./wochentage";

export type RruleParameter = Record<string, string>;

/** Entfernt ein eventuelles "RRULE:" am Anfang (egal ob groß oder klein). */
export function rruleOhnePraefix(text: string): string {
  return text.trim().replace(/^RRULE:/i, "");
}

/** Zerlegt eine rrule in ihre Parameter. Schlüssel und Werte in Großbuchstaben. */
export function rruleParameterLesen(text: string): RruleParameter {
  const parameter: RruleParameter = {};
  for (const teil of rruleOhnePraefix(text).split(";")) {
    const gleichheitszeichen = teil.indexOf("=");
    if (gleichheitszeichen === -1) continue;
    const schluessel = teil.slice(0, gleichheitszeichen).trim().toUpperCase();
    const wert = teil.slice(gleichheitszeichen + 1).trim().toUpperCase();
    if (schluessel && wert) parameter[schluessel] = wert;
  }
  return parameter;
}

/** Setzt Parameter wieder zu einem rrule-Text zusammen (ohne "RRULE:"). */
export function rruleParameterAlsText(parameter: RruleParameter): string {
  return Object.entries(parameter)
    .map(([schluessel, wert]) => `${schluessel}=${wert}`)
    .join(";");
}

/** Die Schreibweise zum Speichern: ohne Präfix, Großbuchstaben, englische Wochentage. */
export function rruleNormalisieren(text: string): string {
  const parameter = rruleParameterLesen(text);
  if (parameter.BYDAY) parameter.BYDAY = byDayUebersetzen(parameter.BYDAY);
  return rruleParameterAlsText(parameter);
}

function ohneParameter(text: string, entfernen: (schluessel: string) => boolean): string {
  const parameter = rruleParameterLesen(rruleNormalisieren(text));
  for (const schluessel of Object.keys(parameter)) {
    if (entfernen(schluessel)) delete parameter[schluessel];
  }
  return rruleParameterAlsText(parameter);
}

/** Fassung für den CalDAV-Server: unsere internen Anker-Zusätze entfernt, Apple kennt sie nicht. */
export function rruleFuerServer(text: string): string {
  return ohneParameter(text, (schluessel) => schluessel === "X-ANCHORDAY" || schluessel === "X-ANCHORMONTH");
}

/**
 * Fassung für die Berechnung mit der rrule-Bibliothek: ohne COUNT (die
 * Anzahl zählt unsere Serien-Logik anhand der Historie, siehe serienende.ts)
 * und ohne alle X-Zusätze (die Bibliothek bricht bei unbekannten Parametern ab).
 */
export function rruleFuerBerechnung(text: string): string {
  return ohneParameter(text, (schluessel) => schluessel === "COUNT" || schluessel.startsWith("X-"));
}
