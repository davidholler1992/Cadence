/**
 * Was:      Eine Warteschlange pro Datei: Aufgaben für dieselbe Datei laufen
 *           nacheinander, für verschiedene Dateien gleichzeitig.
 * Warum:    Zwei Änderungen an derselben Datei gleichzeitig (z. B. Haken
 *           setzen und gleichzeitig verschieben) dürfen sich nicht überholen.
 *           Ein Fehler in einer Aufgabe stoppt die nachfolgenden nicht.
 * Beispiel: warteschlange.einreihen("a.md", async () => { ... })
 */

export class PfadWarteschlange {
  private letzte = new Map<string, Promise<unknown>>();

  einreihen<T>(pfad: string, aufgabe: () => Promise<T>): Promise<T> {
    const vorher = this.letzte.get(pfad) ?? Promise.resolve();
    const aktuell = vorher.then(aufgabe, aufgabe);
    const merker = aktuell.catch(() => undefined);
    this.letzte.set(pfad, merker);
    void merker.then(() => {
      if (this.letzte.get(pfad) === merker) this.letzte.delete(pfad);
    });
    return aktuell;
  }
}
