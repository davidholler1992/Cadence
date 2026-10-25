/**
 * Was:      Der Einstellungs-Reiter des Plugins in Obsidian.
 * Warum:    Zum Ausprobieren müssen Ordner und Tag-Namen einstellbar sein.
 *           Weitere Einstellungen (Kalender, CalDAV, Vorlagen) kommen in
 *           späteren Phasen dazu.
 *
 *           Änderungen werden sofort gespeichert. Die Verarbeitung der
 *           Ordner startet mit kurzer Verzögerung (siehe main.ts), damit
 *           nicht schon beim Tippen halbfertiger Pfade etwas passiert.
 */

import { App, PluginSettingTab, Setting } from "obsidian";
import { ordnerBereinigen } from "../kern/text/ordner";
import type CadencePlugin from "../main";
import { tagNameBereinigen } from "./laden-migrieren";
import { STANDARD_EINSTELLUNGEN } from "./standardwerte";
import type { CadenceEinstellungen } from "./typen";

type OrdnerEinstellung = "aufgabenOrdner" | "terminOrdner" | "inlineOrdner";

export class CadenceEinstellungsReiter extends PluginSettingTab {
  constructor(app: App, private readonly plugin: CadencePlugin) {
    super(app, plugin);
  }

  private ordnerFeld(containerEl: HTMLElement, schluessel: OrdnerEinstellung, name: string, beschreibung: string): void {
    new Setting(containerEl)
      .setName(name)
      .setDesc(beschreibung)
      .addTextArea((text) => {
        text.inputEl.rows = 3;
        text.setValue(this.plugin.settings[schluessel].join("\n"));
        text.onChange(async (wert) => {
          this.plugin.settings[schluessel] = ordnerBereinigen(wert.split("\n"));
          await this.plugin.einstellungenSpeichern();
          this.plugin.einstellungenGeaendert();
        });
      });
  }

  private tagFeld(
    containerEl: HTMLElement,
    schluessel: "tagTodo" | "tagTermin",
    name: string,
    beschreibung: string,
    nachAenderung: () => void
  ): void {
    new Setting(containerEl)
      .setName(name)
      .setDesc(beschreibung)
      .addText((text) => {
        text.setValue(this.plugin.settings[schluessel]);
        text.onChange(async (wert) => {
          const einstellungen: CadenceEinstellungen = this.plugin.settings;
          einstellungen[schluessel] = tagNameBereinigen(wert, STANDARD_EINSTELLUNGEN[schluessel]);
          await this.plugin.einstellungenSpeichern();
          this.plugin.einstellungenGeaendert();
          nachAenderung();
        });
      });
  }

  display(): void {
    const { containerEl } = this;
    containerEl.empty();

    new Setting(containerEl).setName("Aufgaben und Termine als eigene Notiz").setHeading();
    this.ordnerFeld(
      containerEl,
      "aufgabenOrdner",
      "Aufgaben-Ordner",
      "Ein Ordnerpfad pro Zeile. Notizen mit type: todo in diesen Ordnern (samt Unterordnern) werden verarbeitet " +
        "und bekommen ihre UID. Neue Aufgaben entstehen im ersten Ordner. Leer lassen = aus."
    );
    this.ordnerFeld(
      containerEl,
      "terminOrdner",
      "Termin-Ordner",
      "Ein Ordnerpfad pro Zeile. Notizen mit type: termin in diesen Ordnern werden verarbeitet. " +
        "Neue Termine entstehen im ersten Ordner. Leer lassen = aus."
    );

    new Setting(containerEl).setName("Aufgaben und Termine im Text (Inline)").setHeading();
    this.ordnerFeld(
      containerEl,
      "inlineOrdner",
      "Inline-Ordner",
      "Ein Ordnerpfad pro Zeile, z. B. Daily. Nur in diesen Ordnern (samt Unterordnern) werden Aufgaben " +
        "und Termine im Text erkannt und verarbeitet, dort bekommen sie auch ihre UID. " +
        "Leer lassen = Funktion aus. Der ganze Vault ist nicht erlaubt."
    );

    const warnung = containerEl.createEl("p", { cls: "setting-item-description" });
    const warnungAktualisieren = () => {
      const gleich = this.plugin.settings.tagTodo.toLowerCase() === this.plugin.settings.tagTermin.toLowerCase();
      warnung.setText(gleich ? "Achtung: Die beiden Tags müssen verschieden sein, sonst gilt jede Zeile als Termin." : "");
    };
    this.tagFeld(containerEl, "tagTodo", "Tag für Aufgaben", "Ohne #. Standard: todo", warnungAktualisieren);
    this.tagFeld(containerEl, "tagTermin", "Tag für Termine", "Ohne #. Standard: termin", warnungAktualisieren);

    containerEl.appendChild(warnung);
    warnungAktualisieren();
  }
}
