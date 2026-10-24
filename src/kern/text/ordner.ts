/**
 * Was:      Hilfen für Ordnerpfade: Eingaben bereinigen und prüfen, ob eine
 *           Datei in einem Ordner liegt.
 * Warum:    Früher wurde nur mit "beginnt mit" verglichen: Der Ordner
 *           "01_Tasks" passte dadurch auch auf "01_Tasks Archiv", und ein
 *           leeres Eingabefeld machte den ganzen Vault zum "verwalteten"
 *           Ordner. Jetzt zählt nur der Ordner selbst samt Unterordnern,
 *           und leere Angaben sowie der Vault-Stamm werden aussortiert.
 * Beispiel: istInOrdner("Daily/2026/a.md", "Daily")      →  true
 *           istInOrdner("Daily Archiv/a.md", "Daily")    →  false
 *           ordnerBereinigen(["/Daily/", "", "."])       →  ["Daily"]
 */

/** Bereinigt eine Liste von Ordnereingaben: ohne Leerraum, ohne führende/abschließende Schrägstriche, ohne Leeres und Doppeltes. */
export function ordnerBereinigen(roheOrdner: string[]): string[] {
  const ergebnis: string[] = [];
  for (const roh of roheOrdner) {
    const sauber = roh
      .trim()
      .replace(/\\/g, "/")
      .replace(/^(\.\/)+/, "")
      .replace(/^\/+/, "")
      .replace(/\/+$/, "");
    if (sauber === "" || sauber === ".") continue; // der Vault-Stamm ist nicht erlaubt
    if (!ergebnis.includes(sauber)) ergebnis.push(sauber);
  }
  return ergebnis;
}

/** Liegt die Datei im Ordner oder einem seiner Unterordner? Leerer Ordner: nie. */
export function istInOrdner(pfad: string, ordner: string): boolean {
  if (ordner === "") return false;
  return pfad.startsWith(`${ordner}/`);
}

export function istInEinemDerOrdner(pfad: string, ordnerListe: string[]): boolean {
  return ordnerListe.some((ordner) => istInOrdner(pfad, ordner));
}
