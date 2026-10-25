/**
 * Was:      Liest das Frontmatter einer Notiz als Aufgabe oder Termin.
 * Warum:    Nur Notizen mit "type: todo" oder "type: termin" zählen, alle
 *           anderen werden ignoriert (und bekommen auch keine UID).
 *           Fehlende oder seltsam gespeicherte Werte (Text statt Liste, ein
 *           Datum ohne Anführungszeichen) werden abgefangen.
 *
 *           Zustand: "erledigt" bei done: true. Ein einmaliger Eintrag (ohne
 *           Wiederholung) mit Datum in "skipped" gilt als "übersprungen".
 *           Bei Serien springt der Eintrag beim Überspringen weiter, dort
 *           gibt es also keinen bleibenden Zustand "übersprungen".
 *           Der Titel ist der Dateiname ohne ".md".
 * Beispiel: leseNotiz({ type: "todo", start: "2026-07-20", done: false }, "Auto waschen")
 *             →  { art: "todo", titel: "Auto waschen", start: "2026-07-20", zustand: "offen", ... }
 */

import type { EintragsInhalt } from "../../modell/eintrag";
import { utcAlsDatumText } from "../../kern/datum/utc-datum";
import { NOTIZ_FELD } from "./notiz-typen";
import type { Frontmatter } from "./notiz-typen";

function alsText(wert: unknown): string | undefined {
  if (typeof wert === "string") return wert.trim() === "" ? undefined : wert.trim();
  if (wert instanceof Date) return utcAlsDatumText(wert); // YAML-Datum ohne Anführungszeichen
  return undefined;
}

function alsTextListe(wert: unknown): string[] {
  const liste = Array.isArray(wert) ? wert : typeof wert === "string" ? [wert] : [];
  return liste.map(alsText).filter((text): text is string => text !== undefined);
}

/** Tags: Liste oder ein einzelner Text ("a, b"); ohne "#". */
function alsTagListe(wert: unknown): string[] {
  const roh = typeof wert === "string" ? wert.split(/[,\s]+/) : alsTextListe(wert);
  return roh.map((tag) => tag.replace(/^#/, "")).filter((tag) => tag !== "");
}

function alsZahlenListe(wert: unknown): number[] {
  const liste = Array.isArray(wert) ? wert : [];
  return liste.map((eintrag) => Number(eintrag)).filter((zahl) => Number.isFinite(zahl));
}

export function leseNotiz(frontmatter: Frontmatter | undefined, titel: string): EintragsInhalt | null {
  if (!frontmatter) return null;
  const art = frontmatter[NOTIZ_FELD.art];
  if (art !== "todo" && art !== "termin") return null;

  const feld = (schluessel: string) => alsText(frontmatter[schluessel]);
  const start = feld(NOTIZ_FELD.start);
  const rrule = feld(NOTIZ_FELD.rrule);
  const erledigt = alsTextListe(frontmatter[NOTIZ_FELD.historieErledigt]);
  const uebersprungen = alsTextListe(frontmatter[NOTIZ_FELD.historieUebersprungen]);

  const hatSerie = !!rrule && !!start;
  const zustand =
    frontmatter[NOTIZ_FELD.erledigt] === true
      ? "erledigt"
      : !hatSerie && uebersprungen.length > 0
        ? "uebersprungen"
        : "offen";

  const istTermin = art === "termin";
  const erinnerungen = alsZahlenListe(frontmatter[NOTIZ_FELD.erinnerung]);
  return {
    uid: feld(NOTIZ_FELD.uid) ?? "",
    art,
    zustand,
    titel,
    start,
    ende: feld(NOTIZ_FELD.ende),
    rrule,
    ankerStart: feld(NOTIZ_FELD.ankerStart),
    prioritaet: feld(NOTIZ_FELD.prioritaet),
    uebergeordnet: feld(NOTIZ_FELD.uebergeordnet),
    ort: istTermin ? feld(NOTIZ_FELD.ort) : undefined,
    kalender: istTermin ? feld(NOTIZ_FELD.kalender) : undefined,
    beschreibung: istTermin ? feld(NOTIZ_FELD.beschreibung) : undefined,
    erinnerung: istTermin && erinnerungen.length > 0 ? erinnerungen : undefined,
    erledigt,
    uebersprungen,
    tags: alsTagListe(frontmatter[NOTIZ_FELD.tags]),
  };
}
