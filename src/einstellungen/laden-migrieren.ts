/**
 * Was:      Macht aus den gespeicherten Rohdaten (data.json) gültige Einstellungen.
 * Warum:    Gespeicherte Daten können fehlen, von Hand verändert oder aus einer
 *           älteren Version sein. Jeder Wert wird geprüft; was ungültig ist,
 *           fällt auf den Standardwert zurück. Spätere Änderungen am Format
 *           werden hier an einer Stelle aufgefangen (Migration).
 * Beispiel: einstellungenAusRohdaten({ inlineOrdner: ["/Test/"], tagTodo: "#Aufgabe" })
 *             →  { inlineOrdner: ["Test"], tagTodo: "Aufgabe", tagTermin: "termin" }
 */

import { ordnerBereinigen } from "../kern/text/ordner";
import { STANDARD_EINSTELLUNGEN } from "./standardwerte";
import type { CadenceEinstellungen } from "./typen";

const GUELTIGER_TAG = /^[\p{L}\p{N}_/-]+$/u;

/** Ohne "#" und Leerraum. Ungültig (leer, Leerzeichen, Sonderzeichen): der Ersatzwert. */
export function tagNameBereinigen(wert: unknown, ersatz: string): string {
  if (typeof wert !== "string") return ersatz;
  const sauber = wert.trim().replace(/^#/, "");
  return sauber !== "" && GUELTIGER_TAG.test(sauber) ? sauber : ersatz;
}

export function einstellungenAusRohdaten(rohdaten: unknown): CadenceEinstellungen {
  const daten = (typeof rohdaten === "object" && rohdaten !== null ? rohdaten : {}) as Record<string, unknown>;

  const ordner = Array.isArray(daten.inlineOrdner)
    ? ordnerBereinigen(daten.inlineOrdner.filter((eintrag): eintrag is string => typeof eintrag === "string"))
    : STANDARD_EINSTELLUNGEN.inlineOrdner;

  return {
    inlineOrdner: ordner,
    tagTodo: tagNameBereinigen(daten.tagTodo, STANDARD_EINSTELLUNGEN.tagTodo),
    tagTermin: tagNameBereinigen(daten.tagTermin, STANDARD_EINSTELLUNGEN.tagTermin),
  };
}
