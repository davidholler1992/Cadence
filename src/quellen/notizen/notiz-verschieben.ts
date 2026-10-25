/**
 * Was:      Berechnet die Änderungen am Frontmatter, wenn ein Eintrag im
 *           Kalender verschoben oder in der Größe geändert wird.
 * Warum:    Die Rechenregeln stehen in kern/datum/verschieben.ts (gleich für
 *           Notizen und Inline). Hier wird daraus ein Patch für das
 *           Frontmatter. "allday" wird mitgeführt, damit es zum neuen Start
 *           passt (eine Datei ohne Uhrzeit ist ganztägig). Betrifft nur das
 *           aktuelle Vorkommen, die Wiederholung bleibt unberührt.
 * Beispiel: verschiebenPatch({ type: "termin", start: "2026-07-20T09:00" }, "2026-07-22")
 *             →  { start: "2026-07-22T09:00", allday: false }
 */

import { hatUhrzeit } from "../../kern/datum/datum-teile";
import { endeUhrzeitSetzen, startUhrzeitSetzen, zeitraumVerschieben } from "../../kern/datum/verschieben";
import { leseNotiz } from "./notiz-lesen";
import { NOTIZ_FELD } from "./notiz-typen";
import type { Frontmatter } from "./notiz-typen";

function zeitraumAus(frontmatter: Frontmatter) {
  const inhalt = leseNotiz(frontmatter, "");
  return inhalt?.start ? { start: inhalt.start, ende: inhalt.ende } : null;
}

export function verschiebenPatch(frontmatter: Frontmatter, neuesDatum: string, neueUhrzeit?: string): Frontmatter | null {
  const alt = zeitraumAus(frontmatter);
  if (!alt) return null;
  const neu = zeitraumVerschieben(alt, neuesDatum, neueUhrzeit);
  const patch: Frontmatter = {
    [NOTIZ_FELD.start]: neu.start,
    [NOTIZ_FELD.ganztaegig]: !hatUhrzeit(neu.start),
  };
  if (neu.ende !== undefined) patch[NOTIZ_FELD.ende] = neu.ende;
  return patch;
}

export function endeSetzenPatch(frontmatter: Frontmatter, uhrzeit: string): Frontmatter | null {
  const alt = zeitraumAus(frontmatter);
  if (!alt) return null;
  return { [NOTIZ_FELD.ende]: endeUhrzeitSetzen(alt, uhrzeit).ende };
}

export function startSetzenPatch(frontmatter: Frontmatter, uhrzeit: string): Frontmatter | null {
  const alt = zeitraumAus(frontmatter);
  if (!alt) return null;
  return { [NOTIZ_FELD.start]: startUhrzeitSetzen(alt, uhrzeit).start, [NOTIZ_FELD.ganztaegig]: false };
}
