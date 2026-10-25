/**
 * Was:      Baut das Frontmatter für eine NEUE Aufgaben-/Termin-Notiz und
 *           wählt einen freien Dateinamen.
 * Warum:    Bisher bauten vier Stellen (Aufgaben-Dialog, Termin-Dialog,
 *           Schnellerfassung, Hochstufen) dieses Frontmatter jeweils selbst,
 *           mit kleinen Unterschieden (z. B. fehlte der Kalender-Tag).
 *           Jetzt gibt es nur noch diese eine Stelle.
 *
 *           - "allday" folgt dem Format von start (ohne Uhrzeit = ganztägig).
 *           - Termine bekommen den Tag "kalender/<name>" (wenn ein Kalender
 *             gesetzt ist) und "lokal" (noch nie zum Server gesendet), außer
 *             "lokal" wird ausdrücklich abgeschaltet.
 *           - Die UID bleibt leer, wenn keine übergeben wird, das Plugin
 *             vergibt sie danach automatisch.
 * Beispiel: baueNotizFrontmatter({ art: "todo", start: "2026-07-20" })
 *             →  { type: "todo", uid: "", done: false, start: "2026-07-20", allday: true, ... }
 */

import { hatUhrzeit } from "../../kern/datum/datum-teile";
import { kuerzelAusName } from "../../kern/text/kuerzel";
import { dateinameBereinigen } from "../../kern/text/dateiname";
import type { EintragsArt } from "../../modell/eintrag";
import { NOTIZ_FELD } from "./notiz-typen";
import type { Frontmatter } from "./notiz-typen";

export interface NeueNotiz {
  art: EintragsArt;
  uid?: string;
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
  /** Zusätzliche Tags, ohne "#". */
  extraTags?: string[];
  /** Nur Termine: Tag "lokal" setzen? Standard: ja. */
  lokal?: boolean;
}

export function baueNotizFrontmatter(eingabe: NeueNotiz): Frontmatter {
  const istTermin = eingabe.art === "termin";
  const start = eingabe.start ?? "";

  const tags: string[] = [];
  if (istTermin) {
    if (eingabe.kalender) tags.push(`kalender/${kuerzelAusName(eingabe.kalender)}`);
    if (eingabe.lokal !== false) tags.push("lokal");
  }
  tags.push(...(eingabe.extraTags ?? []));

  const frontmatter: Frontmatter = {
    [NOTIZ_FELD.art]: eingabe.art,
    [NOTIZ_FELD.uid]: eingabe.uid ?? "",
    [NOTIZ_FELD.erledigt]: false,
    [NOTIZ_FELD.prioritaet]: eingabe.prioritaet ?? "",
    [NOTIZ_FELD.start]: start,
    [NOTIZ_FELD.ende]: eingabe.ende ?? "",
    [NOTIZ_FELD.ganztaegig]: !hatUhrzeit(start),
    [NOTIZ_FELD.rrule]: eingabe.rrule ?? "",
  };
  if (eingabe.ankerStart) frontmatter[NOTIZ_FELD.ankerStart] = eingabe.ankerStart;
  Object.assign(frontmatter, {
    [NOTIZ_FELD.historieErledigt]: eingabe.erledigt ?? [],
    [NOTIZ_FELD.historieUebersprungen]: eingabe.uebersprungen ?? [],
    [NOTIZ_FELD.kalender]: istTermin ? eingabe.kalender ?? "" : "",
    [NOTIZ_FELD.ort]: istTermin ? eingabe.ort ?? "" : "",
    [NOTIZ_FELD.beschreibung]: istTermin ? eingabe.beschreibung ?? "" : "",
    [NOTIZ_FELD.erinnerung]: istTermin ? eingabe.erinnerung ?? [] : [],
    [NOTIZ_FELD.uebergeordnet]: eingabe.uebergeordnet ?? "",
    [NOTIZ_FELD.tags]: tags,
  });
  return frontmatter;
}

/**
 * Wählt einen freien Pfad: "Ordner/Titel.md", sonst "Ordner/Titel (2).md" usw.
 * "existiert" sagt, ob ein Pfad schon belegt ist.
 */
export function eindeutigerPfad(ordner: string, titel: string, existiert: (pfad: string) => boolean): string {
  const name = dateinameBereinigen(titel);
  const mitOrdner = (dateiname: string) => (ordner ? `${ordner}/${dateiname}` : dateiname);

  let pfad = mitOrdner(`${name}.md`);
  for (let zaehler = 2; existiert(pfad); zaehler++) {
    pfad = mitOrdner(`${name} (${zaehler}).md`);
  }
  return pfad;
}
