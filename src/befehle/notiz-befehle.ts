/**
 * Was:      Befehle für die Notizen-Funktion (zum Ausprobieren und Prüfen).
 * Warum:    Solange es noch keine Dialoge und keinen Kalender gibt, braucht
 *           man einen Weg, die Aktionen auszulösen:
 *           - Einträge der aktiven Notiz auflisten (schreibt nichts)
 *           - Alle Notizen jetzt verarbeiten (stößt die Verarbeitung an)
 *           - Aktive Notiz überspringen / wieder öffnen
 *           - Test-Aufgabe und Test-Termin anlegen (erster Ordner der Einstellung)
 *           Abhaken geht wie gewohnt über die Eigenschaft "done" der Notiz.
 */

import { Notice, Plugin } from "obsidian";
import type { CadenceEinstellungen } from "../einstellungen/typen";
import { heute } from "../kern/datum/heute";
import type { Kennzeichen } from "../kern/serie/zustand-verarbeiten";
import { zweistellig } from "../kern/text/zahl-auffuellen";
import { baueNotizFrontmatter } from "../quellen/notizen/notiz-anlegen";
import { legeNotizAn } from "../quellen/notizen/notiz-anbindung";
import type { NotizQuelle } from "../quellen/notizen/notiz-quelle";
import { eintragAusNotiz } from "../quellen/notizen/notiz-zu-eintrag";

function zeitstempel(): string {
  const jetzt = new Date();
  return `${zweistellig(jetzt.getHours())}${zweistellig(jetzt.getMinutes())}${zweistellig(jetzt.getSeconds())}`;
}

export function registriereNotizBefehle(
  plugin: Plugin,
  quelle: NotizQuelle,
  holeEinstellungen: () => CadenceEinstellungen
): void {
  const aktiveNotizSetzen = async (kennzeichen: Kennzeichen, erfolg: string) => {
    const datei = plugin.app.workspace.getActiveFile();
    if (!datei) {
      new Notice("Keine aktive Notiz.");
      return;
    }
    const geaendert = await quelle.kennzeichenSetzen(datei.path, kennzeichen);
    new Notice(geaendert ? erfolg : "Nichts geändert (keine Aufgabe/kein Termin, oder schon so).");
  };

  plugin.addCommand({
    id: "notizen-aktive-auflisten",
    name: "Notizen: Eintrag der aktiven Notiz auflisten (Debug)",
    callback: () => {
      const datei = plugin.app.workspace.getActiveFile();
      if (!datei) {
        new Notice("Keine aktive Notiz.");
        return;
      }
      const frontmatter = plugin.app.metadataCache.getFileCache(datei)?.frontmatter;
      const eintrag = eintragAusNotiz(datei.path, frontmatter);
      console.log(`[Cadence] Notiz "${datei.path}":`, eintrag);
      new Notice(eintrag ? "Aufgabe/Termin erkannt, Details in der Konsole." : "Keine Aufgabe/kein Termin (type fehlt).");
    },
  });

  plugin.addCommand({
    id: "notizen-alle-verarbeiten",
    name: "Notizen: Alle Notiz-Ordner jetzt verarbeiten",
    callback: async () => {
      const einstellungen = holeEinstellungen();
      if (einstellungen.aufgabenOrdner.length + einstellungen.terminOrdner.length === 0) {
        new Notice("Kein Notiz-Ordner eingestellt (Einstellungen → Cadence).");
        return;
      }
      const ergebnis = await quelle.verarbeiteAlle();
      new Notice(`${ergebnis.dateien} Datei(en) geprüft, ${ergebnis.geschrieben} geändert.`);
    },
  });

  plugin.addCommand({
    id: "notizen-aktive-ueberspringen",
    name: "Notizen: Aktive Notiz überspringen (Test)",
    callback: () => aktiveNotizSetzen("uebersprungen", "Übersprungen."),
  });

  plugin.addCommand({
    id: "notizen-aktive-oeffnen",
    name: "Notizen: Aktive Notiz wieder öffnen (Test)",
    callback: () => aktiveNotizSetzen("offen", "Wieder geöffnet."),
  });

  plugin.addCommand({
    id: "notizen-testaufgabe-anlegen",
    name: "Notizen: Test-Aufgabe anlegen (Debug)",
    callback: async () => {
      const ordner = holeEinstellungen().aufgabenOrdner[0];
      if (!ordner) {
        new Notice("Kein Aufgaben-Ordner eingestellt (Einstellungen → Cadence).");
        return;
      }
      const frontmatter = baueNotizFrontmatter({ art: "todo", start: heute() });
      const datei = await legeNotizAn(plugin.app, ordner, `Test-Aufgabe ${zeitstempel()}`, frontmatter);
      new Notice(`Angelegt: ${datei.path}`);
    },
  });

  plugin.addCommand({
    id: "notizen-testtermin-anlegen",
    name: "Notizen: Test-Termin anlegen (Debug)",
    callback: async () => {
      const ordner = holeEinstellungen().terminOrdner[0];
      if (!ordner) {
        new Notice("Kein Termin-Ordner eingestellt (Einstellungen → Cadence).");
        return;
      }
      const tag = heute();
      const frontmatter = baueNotizFrontmatter({ art: "termin", start: `${tag}T10:00`, ende: `${tag}T11:00` });
      const datei = await legeNotizAn(plugin.app, ordner, `Test-Termin ${zeitstempel()}`, frontmatter);
      new Notice(`Angelegt: ${datei.path}`);
    },
  });
}
