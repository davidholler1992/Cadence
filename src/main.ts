/**
 * Was:   Einstiegspunkt des Plugins. Verdrahtet nur, enthält keine Logik.
 * Warum: Alles Inhaltliche steckt in kleinen Dateien unter src/. Hier wird
 *        zusammengesteckt: Einstellungen laden, Reiter und Befehle anmelden,
 *        die Verarbeitung der Notizen und Inline-Zeilen starten.
 *
 * Aktueller Stand (Phase 2c): Inline-Zeilen und Notizen (UIDs, Haken, Serien).
 */

import { Plugin, debounce } from "obsidian";
import { registriereInlineBefehle } from "./befehle/inline-befehle";
import { registriereNotizBefehle } from "./befehle/notiz-befehle";
import { CadenceEinstellungsReiter } from "./einstellungen/einstellungs-reiter";
import { einstellungenAusRohdaten } from "./einstellungen/laden-migrieren";
import type { CadenceEinstellungen } from "./einstellungen/typen";
import { InlineVerarbeiter } from "./quellen/inline/inline-verarbeiter";
import { erstelleDateizugriff, registriereInlineVerarbeitung } from "./quellen/inline/obsidian-anbindung";
import { erstelleNotizZugriff, registriereNotizVerarbeitung } from "./quellen/notizen/notiz-anbindung";
import { NotizQuelle } from "./quellen/notizen/notiz-quelle";

export default class CadencePlugin extends Plugin {
  settings!: CadenceEinstellungen;
  private verarbeiter!: InlineVerarbeiter;
  private notizQuelle!: NotizQuelle;

  /** Nach Änderungen an den Einstellungen: UID-Verzeichnisse neu aufbauen und alles prüfen (mit Verzögerung). */
  private readonly nachEinstellungsaenderung = debounce(
    () => {
      this.verarbeiter.verzeichnisLeeren();
      this.notizQuelle.verzeichnisLeeren();
      void this.verarbeiter.verarbeiteAlle();
      void this.notizQuelle.verarbeiteAlle();
    },
    1500,
    true
  );

  async onload(): Promise<void> {
    await this.einstellungenLaden();
    this.addSettingTab(new CadenceEinstellungsReiter(this.app, this));

    const protokoll = (text: string) => console.warn(`[Cadence] ${text}`);

    this.verarbeiter = new InlineVerarbeiter(
      erstelleDateizugriff(this.app, () => this.settings),
      () => ({ tagTodo: this.settings.tagTodo, tagTermin: this.settings.tagTermin }),
      { protokoll }
    );
    this.notizQuelle = new NotizQuelle(erstelleNotizZugriff(this.app, () => this.settings), { protokoll });

    registriereInlineVerarbeitung(this, this.verarbeiter, () => this.settings);
    registriereInlineBefehle(this, this.verarbeiter, () => this.settings);
    registriereNotizVerarbeitung(this, this.notizQuelle, () => this.settings);
    registriereNotizBefehle(this, this.notizQuelle, () => this.settings);
    console.log("[Cadence] geladen");
  }

  onunload(): void {
    this.nachEinstellungsaenderung.cancel();
    console.log("[Cadence] entladen");
  }

  async einstellungenLaden(): Promise<void> {
    this.settings = einstellungenAusRohdaten(await this.loadData());
  }

  async einstellungenSpeichern(): Promise<void> {
    await this.saveData(this.settings);
  }

  /** Vom Einstellungs-Reiter aufgerufen, wenn sich etwas geändert hat. */
  einstellungenGeaendert(): void {
    this.nachEinstellungsaenderung();
  }
}
