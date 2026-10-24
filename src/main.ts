/**
 * Was:   Einstiegspunkt des Plugins. Verdrahtet nur, enthält keine Logik.
 * Warum: Alles Inhaltliche steckt in kleinen Dateien unter src/. Hier wird
 *        zusammengesteckt: Einstellungen laden, Reiter und Befehle anmelden,
 *        die Inline-Verarbeitung starten.
 *
 * Aktueller Stand (Phase 2b): Inline-Zeilen (UIDs, Haken, Serien).
 */

import { Plugin, debounce } from "obsidian";
import { registriereInlineBefehle } from "./befehle/inline-befehle";
import { CadenceEinstellungsReiter } from "./einstellungen/einstellungs-reiter";
import { einstellungenAusRohdaten } from "./einstellungen/laden-migrieren";
import type { CadenceEinstellungen } from "./einstellungen/typen";
import { InlineVerarbeiter } from "./quellen/inline/inline-verarbeiter";
import { erstelleDateizugriff, registriereInlineVerarbeitung } from "./quellen/inline/obsidian-anbindung";

export default class CadencePlugin extends Plugin {
  settings!: CadenceEinstellungen;
  private verarbeiter!: InlineVerarbeiter;

  /** Nach Änderungen an den Einstellungen: UID-Verzeichnis neu aufbauen und alle Inline-Ordner prüfen (mit Verzögerung). */
  private readonly nachEinstellungsaenderung = debounce(
    () => {
      this.verarbeiter.verzeichnisLeeren();
      void this.verarbeiter.verarbeiteAlle();
    },
    1500,
    true
  );

  async onload(): Promise<void> {
    await this.einstellungenLaden();
    this.addSettingTab(new CadenceEinstellungsReiter(this.app, this));

    this.verarbeiter = new InlineVerarbeiter(
      erstelleDateizugriff(this.app, () => this.settings),
      () => ({ tagTodo: this.settings.tagTodo, tagTermin: this.settings.tagTermin }),
      { protokoll: (text) => console.warn(`[Cadence] ${text}`) }
    );

    registriereInlineVerarbeitung(this, this.verarbeiter, () => this.settings);
    registriereInlineBefehle(this, this.verarbeiter, () => this.settings);
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
