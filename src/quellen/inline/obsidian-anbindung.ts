/**
 * Was:      Verbindet den Inline-Verarbeiter mit Obsidian: Dateien lesen und
 *           schreiben sowie die Ereignisse, auf die reagiert wird.
 * Warum:    Hier steht der gesamte Obsidian-Teil der Inline-Funktion. Alles
 *           andere (Parser, Regeln, Verarbeiter) ist reine Logik und getestet.
 *
 *           Wann verarbeitet wird:
 *           - Beim Start: alle Dateien in den Inline-Ordnern (so werden auch
 *             Haken verarbeitet, die z. B. am Handy gesetzt wurden).
 *           - Bei jeder Änderung einer Datei in einem Inline-Ordner.
 *           Das Umbenennen und Löschen von Dateien wird dem Verarbeiter
 *           gemeldet, damit sein UID-Verzeichnis stimmt.
 *
 *           Geschrieben wird mit vault.process (ein Schritt, auf dem aktuellen
 *           Dateiinhalt). Eigene Änderungen lösen wieder eine Änderungs-
 *           Meldung aus, die findet aber nichts mehr zu tun und endet damit.
 */

import { Plugin, TFile } from "obsidian";
import type { App } from "obsidian";
import type { CadenceEinstellungen } from "../../einstellungen/typen";
import { istInEinemDerOrdner } from "../../kern/text/ordner";
import type { DateiZugriff } from "./datei-zugriff";
import type { InlineVerarbeiter } from "./inline-verarbeiter";

export function erstelleDateizugriff(app: App, holeEinstellungen: () => CadenceEinstellungen): DateiZugriff {
  const istInlineDatei = (pfad: string) => istInEinemDerOrdner(pfad, holeEinstellungen().inlineOrdner);

  const datei = (pfad: string): TFile => {
    const gefunden = app.vault.getFileByPath(pfad);
    if (!gefunden) throw new Error(`Datei nicht gefunden: ${pfad}`);
    return gefunden;
  };

  return {
    inlineDateien: () =>
      app.vault
        .getMarkdownFiles()
        .map((f) => f.path)
        .filter(istInlineDatei),
    lese: (pfad) => app.vault.cachedRead(datei(pfad)),
    ersetze: async (pfad, umwandeln) => {
      await app.vault.process(datei(pfad), umwandeln);
    },
  };
}

export function registriereInlineVerarbeitung(
  plugin: Plugin,
  verarbeiter: InlineVerarbeiter,
  holeEinstellungen: () => CadenceEinstellungen
): void {
  const istInlineDatei = (pfad: string) => istInEinemDerOrdner(pfad, holeEinstellungen().inlineOrdner);
  const absichern = (aufgabe: Promise<unknown>) =>
    aufgabe.catch((fehler: unknown) => console.error("[Cadence] Inline-Verarbeitung fehlgeschlagen:", fehler));

  plugin.app.workspace.onLayoutReady(() => {
    void absichern(verarbeiter.verarbeiteAlle());
  });

  plugin.registerEvent(
    plugin.app.metadataCache.on("changed", (datei) => {
      if (istInlineDatei(datei.path)) void absichern(verarbeiter.verarbeiteDatei(datei.path));
    })
  );

  plugin.registerEvent(
    plugin.app.vault.on("rename", (datei, alterPfad) => {
      if (datei instanceof TFile) verarbeiter.dateiUmbenannt(alterPfad, datei.path);
    })
  );

  plugin.registerEvent(
    plugin.app.vault.on("delete", (datei) => {
      if (datei instanceof TFile) verarbeiter.dateiGeloescht(datei.path);
    })
  );
}
