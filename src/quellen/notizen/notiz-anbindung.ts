/**
 * Was:      Verbindet die Notizen-Quelle mit Obsidian: Frontmatter lesen und
 *           ändern, Notizen anlegen und die Ereignisse, auf die reagiert wird.
 * Warum:    Hier steht der gesamte Obsidian-Teil der Notizen-Funktion. Alles
 *           andere (Lesen, Regeln, Quelle) ist reine Logik und getestet.
 *
 *           Wann verarbeitet wird:
 *           - Beim Start: alle Notizen in den Notiz-Ordnern, sobald Obsidian
 *             sie eingelesen hat (der erste "resolved"-Moment kann nach dem
 *             Start liegen, deshalb wird einmal beim Start und einmal beim
 *             ersten "resolved" verarbeitet).
 *           - Bei jeder Änderung einer Datei in einem Notiz-Ordner.
 *           Gelesen wird aus dem Zwischenspeicher von Obsidian, geschrieben
 *           über processFrontMatter (auf dem frischen Dateiinhalt).
 */

import { Plugin, TFile, stringifyYaml } from "obsidian";
import type { App } from "obsidian";
import type { CadenceEinstellungen } from "../../einstellungen/typen";
import { istInEinemDerOrdner } from "../../kern/text/ordner";
import { eindeutigerPfad } from "./notiz-anlegen";
import type { NotizQuelle, NotizZugriff } from "./notiz-quelle";
import type { Frontmatter } from "./notiz-typen";

function notizOrdner(einstellungen: CadenceEinstellungen): string[] {
  return [...einstellungen.aufgabenOrdner, ...einstellungen.terminOrdner];
}

export function erstelleNotizZugriff(app: App, holeEinstellungen: () => CadenceEinstellungen): NotizZugriff {
  const datei = (pfad: string): TFile => {
    const gefunden = app.vault.getFileByPath(pfad);
    if (!gefunden) throw new Error(`Datei nicht gefunden: ${pfad}`);
    return gefunden;
  };

  return {
    notizDateien: () =>
      app.vault
        .getMarkdownFiles()
        .map((f) => f.path)
        .filter((pfad) => istInEinemDerOrdner(pfad, notizOrdner(holeEinstellungen()))),
    leseFrontmatter: (pfad) => {
      const gefunden = app.vault.getFileByPath(pfad);
      return gefunden ? app.metadataCache.getFileCache(gefunden)?.frontmatter : undefined;
    },
    aendereFrontmatter: async (pfad, aendern) => {
      await app.fileManager.processFrontMatter(datei(pfad), aendern);
    },
  };
}

export function registriereNotizVerarbeitung(
  plugin: Plugin,
  quelle: NotizQuelle,
  holeEinstellungen: () => CadenceEinstellungen
): void {
  const istNotiz = (pfad: string) => istInEinemDerOrdner(pfad, notizOrdner(holeEinstellungen()));
  const absichern = (aufgabe: Promise<unknown>) =>
    aufgabe.catch((fehler: unknown) => console.error("[Cadence] Notizen-Verarbeitung fehlgeschlagen:", fehler));

  plugin.app.workspace.onLayoutReady(() => {
    void absichern(quelle.verarbeiteAlle());
  });

  let ersteAufloesung = true;
  plugin.registerEvent(
    plugin.app.metadataCache.on("resolved", () => {
      if (!ersteAufloesung) return;
      ersteAufloesung = false;
      void absichern(quelle.verarbeiteAlle());
    })
  );

  plugin.registerEvent(
    plugin.app.metadataCache.on("changed", (datei) => {
      if (istNotiz(datei.path)) void absichern(quelle.verarbeiteDatei(datei.path));
    })
  );

  plugin.registerEvent(
    plugin.app.vault.on("rename", (datei, alterPfad) => {
      if (datei instanceof TFile) quelle.dateiUmbenannt(alterPfad, datei.path);
    })
  );

  plugin.registerEvent(
    plugin.app.vault.on("delete", (datei) => {
      if (datei instanceof TFile) quelle.dateiGeloescht(datei.path);
    })
  );
}

async function ordnerAnlegen(app: App, ordner: string): Promise<void> {
  let aktuell = "";
  for (const teil of ordner.split("/").filter(Boolean)) {
    aktuell = aktuell ? `${aktuell}/${teil}` : teil;
    if (app.vault.getFolderByPath(aktuell)) continue;
    try {
      await app.vault.createFolder(aktuell);
    } catch (fehler) {
      if (!app.vault.getFolderByPath(aktuell)) throw fehler; // nur ein Fehler, wenn er dann wirklich fehlt
    }
  }
}

/** Legt eine neue Notiz an (Ordner wird bei Bedarf erstellt, der Dateiname ist frei gewählt). */
export async function legeNotizAn(
  app: App,
  ordner: string,
  titel: string,
  frontmatter: Frontmatter,
  inhalt = ""
): Promise<TFile> {
  await ordnerAnlegen(app, ordner);
  const pfad = eindeutigerPfad(ordner, titel, (kandidat) => app.vault.getAbstractFileByPath(kandidat) !== null);
  return app.vault.create(pfad, `---\n${stringifyYaml(frontmatter)}---\n\n${inhalt}`);
}
