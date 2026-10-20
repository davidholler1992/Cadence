/**
 * Was:      Baut eine NEUE Inline-Zeile aus den Eingaben eines Dialogs.
 * Warum:    Nur für neue Zeilen. Bestehende Zeilen werden nie neu gebaut,
 *           sondern gezielt geändert (zeile-aendern.ts), damit nichts
 *           verloren geht.
 *
 *           Reihenfolge: Titel, Verwaltungs-Tag, zusätzliche Tags, dann die
 *           Felder (start, end, rrule, anchorStart, priority, parent, bei
 *           Terminen location, calendar, description, reminder, danach
 *           completed, skipped) und zuletzt uid. Leere Felder fehlen.
 *           Zusätzliche Tags mit ungültigen Zeichen (z. B. Leerzeichen)
 *           werden weggelassen.
 * Beispiel: baueInlineZeile({ art: "todo", zustand: " ", titel: "Auto waschen", uid: "a-1", start: "2026-07-20", extraTags: [] }, einstellungen)
 *             →  "- [ ] Auto waschen #todo [start:: 2026-07-20] [uid:: a-1]"
 */

import type { EintragsArt } from "../../modell/eintrag";
import { feldWertKodieren } from "./feld-wert";
import { FELD } from "./inline-typen";
import type { InlineEinstellungen, InlineZustand } from "./inline-typen";

export interface NeueInlineZeile {
  /** Führender Leerraum, damit die Zeile in Listen eingerückt bleibt. */
  einrueckung?: string;
  art: EintragsArt;
  zustand: InlineZustand;
  titel: string;
  uid: string;
  start?: string;
  ende?: string;
  rrule?: string;
  ankerStart?: string;
  prioritaet?: string;
  uebergeordnet?: string;
  // nur Termine
  ort?: string;
  kalender?: string;
  beschreibung?: string;
  erinnerung?: number[];
  erledigt?: string[];
  uebersprungen?: string[];
  /** Zusätzliche Tags, mit oder ohne "#". */
  extraTags: string[];
}

const GUELTIGER_TAG = /^[\p{L}\p{N}_/-]+$/u;

function feld(schluessel: string, wert: string | undefined): string | null {
  const sauber = wert?.trim();
  return sauber ? `[${schluessel}:: ${feldWertKodieren(sauber)}]` : null;
}

export function baueInlineZeile(eingabe: NeueInlineZeile, einstellungen: InlineEinstellungen): string {
  const verwalteterTag = (eingabe.art === "todo" ? einstellungen.tagTodo : einstellungen.tagTermin).replace(/^#/, "");
  const titel = eingabe.titel.replace(/\s*[\r\n]+\s*/g, " ").trim();

  const zusatzTags = eingabe.extraTags
    .map((tag) => tag.trim().replace(/^#/, ""))
    .filter((tag) => tag !== "" && GUELTIGER_TAG.test(tag))
    .map((tag) => `#${tag}`);

  const istTermin = eingabe.art === "termin";
  const felder = [
    feld(FELD.start, eingabe.start),
    feld(FELD.ende, eingabe.ende),
    feld(FELD.rrule, eingabe.rrule),
    feld(FELD.ankerStart, eingabe.ankerStart),
    feld(FELD.prioritaet, eingabe.prioritaet),
    feld(FELD.uebergeordnet, eingabe.uebergeordnet),
    istTermin ? feld(FELD.ort, eingabe.ort) : null,
    istTermin ? feld(FELD.kalender, eingabe.kalender) : null,
    istTermin ? feld(FELD.beschreibung, eingabe.beschreibung) : null,
    istTermin && eingabe.erinnerung?.length ? feld(FELD.erinnerung, eingabe.erinnerung.join(",")) : null,
    eingabe.erledigt?.length ? feld(FELD.erledigt, eingabe.erledigt.join(",")) : null,
    eingabe.uebersprungen?.length ? feld(FELD.uebersprungen, eingabe.uebersprungen.join(",")) : null,
    feld(FELD.uid, eingabe.uid),
  ].filter((teil): teil is string => teil !== null);

  const teile = [titel, `#${verwalteterTag}`, ...zusatzTags, ...felder].filter((teil) => teil !== "");
  return `${eingabe.einrueckung ?? ""}- [${eingabe.zustand}] ${teile.join(" ")}`;
}
