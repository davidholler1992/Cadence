/**
 * Was:      Der Einstellungs-Reiter des Plugins in Obsidian.
 * Warum:    Zum Ausprobieren der Inline-Funktion müssen Ordner und Tag-Namen
 *           einstellbar sein. Weitere Einstellungen (Kalender, CalDAV,
 *           Vorlagen) kommen in späteren Phasen dazu.
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

export class CadenceEinstellungsReiter extends PluginSettingTab {
  constructor(app: App, private readonly plugin: CadencePlugin) {
    super(app, plugin);
  }

  display(): void {
    const { containerEl } = this;
    containerEl.empty();

    new Setting(containerEl).setName("Aufgaben und Termine im Text (Inline)").setHeading();

    new Setting(containerEl)
      .setName("Inline-Ordner")
      .setDesc(
        "Ein Ordnerpfad pro Zeile, z. B. Daily. Nur in diesen Ordnern (samt Unterordnern) werden Aufgaben " +
          "und Termine im Text erkannt und verarbeitet, dort bekommen sie auch ihre UID. " +
          "Leer lassen = Funktion aus. Der ganze Vault ist nicht erlaubt."
      )
      .addTextArea((text) => {
        text.inputEl.rows = 4;
        text.setValue(this.plugin.settings.inlineOrdner.join("\n"));
        text.onChange(async (wert) => {
          this.plugin.settings.inlineOrdner = ordnerBereinigen(wert.split("\n"));
          await this.plugin.einstellungenSpeichern();
          this.plugin.einstellungenGeaendert();
        });
      });

    const warnung = containerEl.createEl("p", { cls: "setting-item-description" });
    const warnungAktualisieren = () => {
      const gleich = this.plugin.settings.tagTodo.toLowerCase() === this.plugin.settings.tagTermin.toLowerCase();
      warnung.setText(gleich ? "Achtung: Die beiden Tags müssen verschieden sein, sonst gilt jede Zeile als Termin." : "");
    };

    new Setting(containerEl)
      .setName("Tag für Aufgaben")
      .setDesc("Ohne #. Standard: todo")
      .addText((text) => {
        text.setValue(this.plugin.settings.tagTodo);
        text.onChange(async (wert) => {
          this.plugin.settings.tagTodo = tagNameBereinigen(wert, STANDARD_EINSTELLUNGEN.tagTodo);
          await this.plugin.einstellungenSpeichern();
          this.plugin.einstellungenGeaendert();
          warnungAktualisieren();
        });
      });

    new Setting(containerEl)
      .setName("Tag für Termine")
      .setDesc("Ohne #. Standard: termin")
      .addText((text) => {
        text.setValue(this.plugin.settings.tagTermin);
        text.onChange(async (wert) => {
          this.plugin.settings.tagTermin = tagNameBereinigen(wert, STANDARD_EINSTELLUNGEN.tagTermin);
          await this.plugin.einstellungenSpeichern();
          this.plugin.einstellungenGeaendert();
          warnungAktualisieren();
        });
      });

    containerEl.appendChild(warnung);
    warnungAktualisieren();
  }
}
