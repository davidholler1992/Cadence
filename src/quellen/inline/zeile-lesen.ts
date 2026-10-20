/**
 * Was:      Liest eine Checkbox-Zeile als Aufgabe oder Termin.
 * Warum:    Eine Zeile zählt nur, wenn sie eine Checkbox UND den Tag für
 *           Aufgaben oder Termine trägt (Namen aus den Einstellungen).
 *           Steht beides da, gewinnt der Termin-Tag. Alles andere (normale
 *           Aufzählungen, fremde Checklisten) wird ignoriert.
 *
 *           Der Titel ist der Text ohne Tags und Felder. Die zerlegte Zeile
 *           wird mitgegeben, damit spätere Änderungen gezielt möglich sind
 *           (zeile-aendern.ts).
 * Beispiel: leseInlineZeile("- [ ] Auto waschen #todo [start:: 2026-07-20]", { tagTodo: "todo", tagTermin: "termin" })
 *             →  { art: "todo", titel: "Auto waschen", start: "2026-07-20", zustand: "offen", ... }
 */

import type { EintragsArt, EintragsZustand } from "../../modell/eintrag";
import { FELD, zustandVonZeichen } from "./inline-typen";
import type { InlineEinstellungen, InlineGelesen, TagStueck } from "./inline-typen";
import { zerlegeZeile } from "./zeile-zerlegen";

function tagNameBereinigen(name: string): string {
  return name.replace(/^#/, "").trim().toLowerCase();
}

function listeAusText(wert: string | undefined): string[] {
  if (!wert) return [];
  return wert
    .split(",")
    .map((teil) => teil.trim())
    .filter(Boolean);
}

function zustandAusZeichen(zeichen: string): EintragsZustand {
  const zustand = zustandVonZeichen(zeichen);
  return zustand === "x" ? "erledigt" : zustand === "-" ? "uebersprungen" : "offen";
}

export function leseInlineZeile(zeile: string, einstellungen: InlineEinstellungen): InlineGelesen | null {
  const zerlegt = zerlegeZeile(zeile);
  if (!zerlegt) return null;

  const tagNamen = zerlegt.stuecke.filter((s): s is TagStueck => s.art === "tag").map((s) => s.name);
  const tagTodo = tagNameBereinigen(einstellungen.tagTodo);
  const tagTermin = tagNameBereinigen(einstellungen.tagTermin);

  let art: EintragsArt;
  if (tagNamen.some((name) => name.toLowerCase() === tagTermin)) art = "termin";
  else if (tagNamen.some((name) => name.toLowerCase() === tagTodo)) art = "todo";
  else return null;

  const verwalteterTag = art === "todo" ? tagTodo : tagTermin;
  const zusatzTags = tagNamen.filter((name) => name.toLowerCase() !== verwalteterTag);

  // Schlüssel klein geschrieben, bei doppelten Feldern gilt das letzte.
  const felder: Record<string, string> = {};
  for (const stueck of zerlegt.stuecke) {
    if (stueck.art === "feld") felder[stueck.schluessel.toLowerCase()] = stueck.wert;
  }
  const feld = (schluessel: string): string | undefined => felder[schluessel.toLowerCase()] || undefined;

  const titel = zerlegt.stuecke
    .map((stueck) => (stueck.art === "text" ? stueck.roh : ""))
    .join("")
    .replace(/\s+/g, " ")
    .trim();

  const erinnerungen = listeAusText(feld(FELD.erinnerung))
    .map((teil) => parseInt(teil, 10))
    .filter((zahl) => !isNaN(zahl));

  const istTermin = art === "termin";
  return {
    zerlegt,
    uid: felder[FELD.uid.toLowerCase()] ?? "",
    art,
    zustand: zustandAusZeichen(zerlegt.zustandZeichen),
    titel,
    start: feld(FELD.start),
    ende: feld(FELD.ende),
    rrule: feld(FELD.rrule),
    ankerStart: feld(FELD.ankerStart),
    prioritaet: feld(FELD.prioritaet),
    uebergeordnet: feld(FELD.uebergeordnet),
    ort: istTermin ? feld(FELD.ort) : undefined,
    kalender: istTermin ? feld(FELD.kalender) : undefined,
    beschreibung: istTermin ? feld(FELD.beschreibung) : undefined,
    erinnerung: istTermin && erinnerungen.length > 0 ? erinnerungen : undefined,
    erledigt: listeAusText(feld(FELD.erledigt)),
    uebersprungen: listeAusText(feld(FELD.uebersprungen)),
    tags: zusatzTags,
  };
}
