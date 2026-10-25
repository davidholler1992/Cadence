/**
 * Was:      Berechnet, was an einer Notiz zu ändern ist: fehlende oder
 *           doppelte UID, Haken, Überspringen, Wieder-Öffnen.
 *           Reine Rechnung, ohne Obsidian: Frontmatter rein, Patch raus.
 * Warum:    Es gelten dieselben Regeln wie bei Inline-Zeilen (siehe
 *           kern/serie/zustand-verarbeiten.ts), nur das Format ist ein
 *           anderes: Der Haken ist "done", die Historie steht in
 *           "completed" und "skipped".
 *
 *           - Eine Serie mit gesetztem Haken springt sofort weiter, "done"
 *             wird wieder false.
 *           - Eine einmalige Aufgabe bekommt beim Haken das Datum in
 *             "completed"; nimmt man den Haken weg, verschwindet es.
 *           - Einmaliges Überspringen steht als Datum in "skipped" und
 *             "done" bleibt false.
 *           - Eine UID bekommen nur echte Aufgaben/Termine (type: todo/termin).
 *
 *           Das Ergebnis ist ein Patch mit nur den Feldern, die sich ändern,
 *           oder null, wenn nichts zu tun ist.
 * Beispiel: Serie wöchentlich montags, start "2026-07-20", done: true, heute "2026-07-20"
 *             →  Patch { start: "2026-07-27", done: false, completed: ["2026-07-20"], anchorStart: "2026-07-20" }
 */

import type { SerienZustand } from "../../kern/serie/serie-weiterschalten";
import { zustandVerarbeiten } from "../../kern/serie/zustand-verarbeiten";
import type { Kennzeichen } from "../../kern/serie/zustand-verarbeiten";
import type { EintragsInhalt } from "../../modell/eintrag";
import { leseNotiz } from "./notiz-lesen";
import { NOTIZ_FELD } from "./notiz-typen";
import type { Frontmatter } from "./notiz-typen";

export interface NotizHilfen {
  /** Liefert eine frische UID. */
  neueUid(): string;
  /** true, wenn die UID bei einer ANDEREN Notiz schon vergeben ist. */
  uidAnderswoVergeben(uid: string): boolean;
}

function serienZustandAus(inhalt: EintragsInhalt): SerienZustand {
  return {
    start: inhalt.start,
    ende: inhalt.ende,
    rrule: inhalt.rrule,
    ankerStart: inhalt.ankerStart,
    erledigt: inhalt.erledigt,
    uebersprungen: inhalt.uebersprungen,
  };
}

function listenGleich(a: string[], b: string[]): boolean {
  return a.length === b.length && a.every((eintrag, index) => eintrag === b[index]);
}

/** Wendet ein Kennzeichen auf die Notiz an und liefert die nötigen Änderungen. */
function kennzeichenPatch(
  frontmatter: Frontmatter,
  inhalt: EintragsInhalt,
  kennzeichen: Kennzeichen,
  heute: string
): Frontmatter {
  const vorher = serienZustandAus(inhalt);
  const ergebnis = zustandVerarbeiten(vorher, kennzeichen, heute);
  const nachher = ergebnis.zustand;
  const patch: Frontmatter = {};

  if (nachher.start !== vorher.start) patch[NOTIZ_FELD.start] = nachher.start ?? "";
  if (nachher.ende !== vorher.ende) patch[NOTIZ_FELD.ende] = nachher.ende ?? "";
  if (nachher.rrule !== vorher.rrule) patch[NOTIZ_FELD.rrule] = nachher.rrule ?? "";
  if (nachher.ankerStart !== vorher.ankerStart) patch[NOTIZ_FELD.ankerStart] = nachher.ankerStart ?? "";
  if (!listenGleich(nachher.erledigt, vorher.erledigt)) patch[NOTIZ_FELD.historieErledigt] = nachher.erledigt;
  if (!listenGleich(nachher.uebersprungen, vorher.uebersprungen)) {
    patch[NOTIZ_FELD.historieUebersprungen] = nachher.uebersprungen;
  }

  const neuErledigt = ergebnis.kennzeichen === "erledigt";
  if ((frontmatter[NOTIZ_FELD.erledigt] === true) !== neuErledigt) patch[NOTIZ_FELD.erledigt] = neuErledigt;
  return patch;
}

function leerAlsNull(patch: Frontmatter): Frontmatter | null {
  return Object.keys(patch).length > 0 ? patch : null;
}

/**
 * Eine Aktion des Nutzers (z. B. "überspringen" per Befehl oder Rechtsklick):
 * setzt das Kennzeichen unabhängig vom aktuellen Haken.
 */
export function kennzeichenSetzenPatch(
  frontmatter: Frontmatter,
  kennzeichen: Kennzeichen,
  heute: string
): Frontmatter | null {
  const inhalt = leseNotiz(frontmatter, "");
  if (!inhalt) return null;
  return leerAlsNull(kennzeichenPatch(frontmatter, inhalt, kennzeichen, heute));
}

/**
 * Die automatische Verarbeitung nach jeder Änderung: UID vergeben/erneuern
 * und den aktuellen Haken umsetzen. Ohne Änderungsbedarf: null.
 */
export function notizVerarbeitenPatch(frontmatter: Frontmatter, heute: string, hilfen: NotizHilfen): Frontmatter | null {
  const inhalt = leseNotiz(frontmatter, "");
  if (!inhalt) return null;

  const patch: Frontmatter = {};
  if (!inhalt.uid || hilfen.uidAnderswoVergeben(inhalt.uid)) patch[NOTIZ_FELD.uid] = hilfen.neueUid();

  // Der Zustand der Notiz selbst (Haken, einmaliges Überspringen) bestimmt, was zu tun ist.
  Object.assign(patch, kennzeichenPatch(frontmatter, inhalt, inhalt.zustand, heute));
  return leerAlsNull(patch);
}
