/**
 * Was:   Einstiegspunkt des Plugins. Verdrahtet nur, enthält keine Logik.
 * Warum: Alles Inhaltliche steckt in kleinen Dateien unter src/. Hier wird
 *        später lediglich zusammengesteckt (Einstellungen, Befehle, Ansichten).
 *
 * Aktueller Stand (Phase 0b): nur ein Testbefehl, um zu sehen, dass der Build
 * und das Laden in Obsidian funktionieren.
 */

import { Notice, Plugin } from "obsidian";
import { heute } from "./kern/datum/heute";

export default class CadencePlugin extends Plugin {
  onload(): void {
    console.log("[Cadence] geladen");

    this.addCommand({
      id: "testbefehl",
      name: "Testbefehl (Gerüst)",
      callback: () => new Notice(`Cadence läuft. Heute ist ${heute()}.`),
    });
  }

  onunload(): void {
    console.log("[Cadence] entladen");
  }
}
