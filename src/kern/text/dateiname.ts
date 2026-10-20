/**
 * Was:      Macht aus einem Titel einen gültigen Dateinamen-Teil.
 * Warum:    Titel dürfen Zeichen enthalten, die in Dateinamen oder in
 *           Obsidian-Links Probleme machen (: / ? # ^ [ ] und andere).
 *           Diese Zeichen werden entfernt, der Name auf 80 Zeichen gekürzt.
 *           Ist danach nichts übrig, wird der Ersatzname genommen.
 * Beispiel: dateinameBereinigen("Zahnarzt: Dr. Müller?")  →  "Zahnarzt Dr. Müller"
 *           dateinameBereinigen("///")                    →  "Ohne Titel"
 */

const VERBOTENE_ZEICHEN = /[\\/:*?"<>|#^[\]]/g;
const MAXIMALE_LAENGE = 80;

export function dateinameBereinigen(titel: string, ersatzname = "Ohne Titel"): string {
  const bereinigt = titel
    .replace(VERBOTENE_ZEICHEN, "")
    .trim()
    .slice(0, MAXIMALE_LAENGE)
    .trim();
  return bereinigt || ersatzname;
}