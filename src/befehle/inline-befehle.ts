/**
 * Was:      Befehle für die Inline-Funktion (zum Ausprobieren und Prüfen).
 * Warum:    - "Einträge der aktiven Notiz auflisten": zeigt in der Konsole
 *             (Strg/Cmd+Umschalt+I), wie das Plugin die Zeilen der geöffneten
 *             Notiz versteht. Funktioniert in jeder Notiz, auch außerhalb
 *             der Inline-Ordner, und schreibt nichts.
 *           - "Alle Inline-Ordner jetzt verarbeiten": stößt die Verarbeitung
 *             von Hand an (sonst läuft sie beim Start und bei Änderungen).
 */

import { Notice, Plugin } from "obsidian";
import type { CadenceEinstellungen } from "../einstellungen/typen";
import { eintragAusInline } from "../quellen/inline/zeile-zu-eintrag";
import type { InlineVerarbeiter } from "../quellen/inline/inline-verarbeiter";
import { leseAlleInlineZeilen } from "../quellen/inline/zeilen-scannen";

export function registriereInlineBefehle(
  plugin: Plugin,
  verarbeiter: InlineVerarbeiter,
  holeEinstellungen: () => CadenceEinstellungen
): void {
  plugin.addCommand({
    id: "inline-aktive-notiz-auflisten",
    name: "Inline: Einträge der aktiven Notiz auflisten (Debug)",
    callback: async () => {
      const datei = plugin.app.workspace.getActiveFile();
      if (!datei) {
        new Notice("Keine aktive Notiz.");
        return;
      }
      const einstellungen = holeEinstellungen();
      const inhalt = await plugin.app.vault.read(datei);
      const eintraege = leseAlleInlineZeilen(inhalt, einstellungen).map((fund) =>
        eintragAusInline(fund.gelesen, datei.path, fund.zeilennummer)
      );
      console.log(`[Cadence] Inline-Einträge in "${datei.path}":`, eintraege);
      new Notice(`${eintraege.length} Inline-Eintrag/-Einträge gefunden, Details in der Konsole.`);
    },
  });

  plugin.addCommand({
    id: "inline-alle-verarbeiten",
    name: "Inline: Alle Inline-Ordner jetzt verarbeiten",
    callback: async () => {
      if (holeEinstellungen().inlineOrdner.length === 0) {
        new Notice("Kein Inline-Ordner eingestellt (Einstellungen → Cadence).");
        return;
      }
      const ergebnis = await verarbeiter.verarbeiteAlle();
      new Notice(`${ergebnis.dateien} Datei(en) geprüft, ${ergebnis.geschrieben} geändert.`);
    },
  });
}
