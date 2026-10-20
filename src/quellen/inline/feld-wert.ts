/**
 * Was:      Verschlüsselt und entschlüsselt Feldwerte für Inline-Zeilen.
 * Warum:    Eine Zeile ist EINE Zeile und ein Feld endet an seiner schließenden
 *           eckigen Klammer. Deshalb braucht ein Wert Schutz für:
 *             - Zeilenumbrüche (aus mehrzeiligen Beschreibungen) → "\n"
 *             - Backslashes                                      → "\\"
 *             - unpaarige eckige Klammern                        → "\[" und "\]"
 *           Wikilinks wie "[[Projekt]]" haben paarige Klammern und bleiben
 *           unverändert lesbar.
 * Beispiel: feldWertKodieren("Zeile 1\nZeile 2")  →  "Zeile 1\\nZeile 2"
 *           feldWertKodieren("[[Projekt XY]]")    →  "[[Projekt XY]]"
 *           feldWertKodieren("Plan [A")           →  "Plan \\[A"
 */

/** true, wenn jede öffnende eckige Klammer eine schließende hat (mit "\" geschützte zählen nicht). */
export function klammernAusgeglichen(text: string): boolean {
  let tiefe = 0;
  for (let i = 0; i < text.length; i++) {
    const zeichen = text[i];
    if (zeichen === "\\") {
      i++; // das geschützte Zeichen überspringen
      continue;
    }
    if (zeichen === "[") tiefe++;
    else if (zeichen === "]") {
      tiefe--;
      if (tiefe < 0) return false;
    }
  }
  return tiefe === 0;
}

export function feldWertKodieren(wert: string): string {
  let text = wert.replace(/\\/g, "\\\\").replace(/\r?\n/g, "\\n");
  if (!klammernAusgeglichen(text)) {
    text = text.replace(/[[\]]/g, (klammer) => `\\${klammer}`);
  }
  return text;
}

export function feldWertDekodieren(roh: string): string {
  return roh.replace(/\\([\\n[\]])/g, (_treffer, zeichen: string) => (zeichen === "n" ? "\n" : zeichen));
}
