/**
 * Was:      Eine Notbremse gegen Schreib-Schleifen.
 * Warum:    Jede automatische Änderung an einer Datei löst wieder eine
 *           Änderungs-Meldung aus. Läuft die Verarbeitung dadurch einmal nicht
 *           "zur Ruhe" (ein Fehler im Code), würde das Plugin eine Datei
 *           endlos neu schreiben. Die Bremse erlaubt pro Datei nur wenige
 *           Schreibvorgänge in kurzer Zeit und verhindert alle weiteren.
 * Beispiel: bremse.darfSchreiben("Daily/2026-07-20.md", Date.now())  →  true (die ersten 5 Mal in 3 Sekunden)
 */

export class SchreibBremse {
  private zeitpunkte = new Map<string, number[]>();

  constructor(
    private readonly maximaleSchreibvorgaenge = 5,
    private readonly zeitfensterMillisekunden = 3000
  ) {}

  /** Meldet einen geplanten Schreibvorgang an. false = nicht schreiben, es sind schon zu viele. */
  darfSchreiben(pfad: string, jetzt: number): boolean {
    const aktuell = (this.zeitpunkte.get(pfad) ?? []).filter((t) => jetzt - t < this.zeitfensterMillisekunden);
    if (aktuell.length >= this.maximaleSchreibvorgaenge) {
      this.zeitpunkte.set(pfad, aktuell);
      return false;
    }
    aktuell.push(jetzt);
    this.zeitpunkte.set(pfad, aktuell);
    return true;
  }
}
