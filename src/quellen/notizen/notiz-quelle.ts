/**
 * Was:      Die Quelle "eigene Notiz": verarbeitet Aufgaben-/Termin-Notizen
 *           automatisch und führt Aktionen aus (überspringen, verschieben,
 *           Größe ändern).
 * Warum:    Das Gegenstück zum Inline-Verarbeiter, mit denselben Regeln,
 *           aber im Frontmatter. Die Rechnung steht in notiz-verarbeiten.ts
 *           und notiz-verschieben.ts, hier kommt dazu, was mit mehreren
 *           Dateien und der Zeit zu tun hat:
 *           - Aufgaben für dieselbe Datei laufen nacheinander.
 *           - Ein Verzeichnis merkt sich, welche UID bei welcher Notiz steht,
 *             um kopierte Notizen zu erkennen (die Kopie bekommt eine neue).
 *           - Geschrieben wird nur bei Bedarf, und zwar auf dem frischen
 *             Frontmatter der Datei (nicht auf dem Zwischenspeicher).
 *           - Die Schreib-Bremse stoppt Schleifen.
 * Beispiel: await quelle.verarbeiteDatei("Aufgaben/Auto waschen.md")  →  true, wenn geschrieben wurde
 *           await quelle.kennzeichenSetzen("Aufgaben/Auto waschen.md", "uebersprungen")
 */

import { heute as heuteStandard } from "../../kern/datum/heute";
import type { Kennzeichen } from "../../kern/serie/zustand-verarbeiten";
import { uidErzeugen } from "../../kern/text/uid";
import { SchreibBremse } from "../inline/schreib-bremse";
import { PfadWarteschlange } from "../pfad-warteschlange";
import { leseNotiz } from "./notiz-lesen";
import { patchAnwenden } from "./notiz-typen";
import type { Frontmatter } from "./notiz-typen";
import { kennzeichenSetzenPatch, notizVerarbeitenPatch } from "./notiz-verarbeiten";
import type { NotizHilfen } from "./notiz-verarbeiten";
import { endeSetzenPatch, startSetzenPatch, verschiebenPatch } from "./notiz-verschieben";

export interface NotizZugriff {
  /** Pfade aller Dateien in den Notiz-Ordnern (Aufgaben und Termine). */
  notizDateien(): string[];
  /** Das Frontmatter aus dem Zwischenspeicher (schnell, darf kurz hinter der Datei herhinken). */
  leseFrontmatter(pfad: string): Frontmatter | undefined;
  /** Ändert das Frontmatter in einem Schritt. "aendern" bekommt das frische Frontmatter und ändert es direkt. */
  aendereFrontmatter(pfad: string, aendern: (frontmatter: Frontmatter) => void): Promise<void>;
}

export interface NotizQuelleOptionen {
  /** Nur für Tests: heutiges Datum. */
  heute?: () => string;
  /** Nur für Tests: neue UID. */
  neueUid?: () => string;
  /** Nur für Tests: aktuelle Zeit in Millisekunden. */
  jetzt?: () => number;
  /** Meldungen für Entwickler (z. B. console.warn). */
  protokoll?: (text: string) => void;
}

export class NotizQuelle {
  private uidVerzeichnis = new Map<string, string>();
  private warteschlange = new PfadWarteschlange();
  private bremse = new SchreibBremse();
  private heute: () => string;
  private neueUid: () => string;
  private jetzt: () => number;
  private protokoll: (text: string) => void;

  constructor(private zugriff: NotizZugriff, optionen: NotizQuelleOptionen = {}) {
    this.heute = optionen.heute ?? heuteStandard;
    this.neueUid = optionen.neueUid ?? (() => uidErzeugen(this.heute()));
    this.jetzt = optionen.jetzt ?? (() => Date.now());
    this.protokoll = optionen.protokoll ?? (() => undefined);
  }

  // --- Automatische Verarbeitung -----------------------------------------

  /** Verarbeitet eine Notiz (UID, Haken, Serien). Aufrufe für dieselbe Datei laufen nacheinander. true = es wurde geschrieben. */
  verarbeiteDatei(pfad: string): Promise<boolean> {
    return this.warteschlange.einreihen(pfad, () => this.verarbeiteEinzeln(pfad));
  }

  /** Verarbeitet alle Notizen nacheinander (z. B. beim Start). */
  async verarbeiteAlle(): Promise<{ dateien: number; geschrieben: number }> {
    const pfade = this.zugriff.notizDateien();
    let geschrieben = 0;
    for (const pfad of pfade) {
      try {
        if (await this.verarbeiteDatei(pfad)) geschrieben++;
      } catch (fehler) {
        this.protokoll(`Fehler bei "${pfad}": ${(fehler as Error).message}`);
      }
    }
    return { dateien: pfade.length, geschrieben };
  }

  dateiUmbenannt(alterPfad: string, neuerPfad: string): void {
    const uid = this.uidVerzeichnis.get(alterPfad);
    if (uid !== undefined) {
      this.uidVerzeichnis.delete(alterPfad);
      this.uidVerzeichnis.set(neuerPfad, uid);
    }
  }

  dateiGeloescht(pfad: string): void {
    this.uidVerzeichnis.delete(pfad);
  }

  /** Vergisst alle gemerkten UIDs (z. B. nach geänderten Einstellungen). */
  verzeichnisLeeren(): void {
    this.uidVerzeichnis.clear();
  }

  // --- Aktionen des Nutzers ----------------------------------------------

  /** Setzt erledigt / übersprungen / offen, unabhängig vom aktuellen Haken. true = es hat sich etwas geändert. */
  kennzeichenSetzen(pfad: string, kennzeichen: Kennzeichen): Promise<boolean> {
    const heute = this.heute();
    return this.aenderePatch(pfad, (live) => kennzeichenSetzenPatch(live, kennzeichen, heute));
  }

  /** Verschiebt auf ein neues Datum, optional mit neuer Uhrzeit (Zeitraster). */
  verschiebe(pfad: string, neuesDatum: string, neueUhrzeit?: string): Promise<boolean> {
    return this.aenderePatch(pfad, (live) => verschiebenPatch(live, neuesDatum, neueUhrzeit));
  }

  /** Ändert die Uhrzeit des Endes (Größe ändern am unteren Rand). */
  setzeEnde(pfad: string, uhrzeit: string): Promise<boolean> {
    return this.aenderePatch(pfad, (live) => endeSetzenPatch(live, uhrzeit));
  }

  /** Ändert die Uhrzeit des Starts (Größe ändern am oberen Rand). */
  setzeStart(pfad: string, uhrzeit: string): Promise<boolean> {
    return this.aenderePatch(pfad, (live) => startSetzenPatch(live, uhrzeit));
  }

  // --- intern ------------------------------------------------------------

  private aenderePatch(pfad: string, berechne: (live: Frontmatter) => Frontmatter | null): Promise<boolean> {
    return this.warteschlange.einreihen(pfad, async () => {
      let geaendert = false;
      await this.zugriff.aendereFrontmatter(pfad, (live) => {
        const patch = berechne(live);
        if (!patch) return;
        patchAnwenden(live, patch);
        geaendert = true;
      });
      return geaendert;
    });
  }

  /** Steht die UID bei einer ANDEREN Notiz (und dort wirklich noch)? Veraltete Einträge werden aufgeräumt. */
  private uidAnderswoVergeben(eigenerPfad: string, uid: string): boolean {
    for (const [anderePfad, andereUid] of this.uidVerzeichnis) {
      if (anderePfad === eigenerPfad || andereUid !== uid) continue;
      if (leseNotiz(this.zugriff.leseFrontmatter(anderePfad), "")?.uid === uid) return true;
      this.uidVerzeichnis.delete(anderePfad);
    }
    return false;
  }

  private async verarbeiteEinzeln(pfad: string): Promise<boolean> {
    const frontmatter = this.zugriff.leseFrontmatter(pfad);
    const inhalt = leseNotiz(frontmatter, "");
    if (!frontmatter || !inhalt) {
      this.uidVerzeichnis.delete(pfad); // keine Aufgabe/kein Termin (mehr)
      return false;
    }
    if (inhalt.uid) this.uidVerzeichnis.set(pfad, inhalt.uid);

    const heute = this.heute();
    const anderswo = (uid: string) => this.uidAnderswoVergeben(pfad, uid);

    // Probelauf auf dem Zwischenspeicher. Die dabei erzeugten UIDs werden beim
    // eigentlichen Schreiben wiederverwendet.
    const vorrat: string[] = [];
    const probeHilfen: NotizHilfen = {
      neueUid: () => {
        const uid = this.neueUid();
        vorrat.push(uid);
        return uid;
      },
      uidAnderswoVergeben: anderswo,
    };
    const schreibHilfen: NotizHilfen = {
      neueUid: () => vorrat.shift() ?? this.neueUid(),
      uidAnderswoVergeben: anderswo,
    };

    if (!notizVerarbeitenPatch(frontmatter, heute, probeHilfen)) return false;

    if (!this.bremse.darfSchreiben(pfad, this.jetzt())) {
      this.protokoll(`Zu viele Änderungen an "${pfad}" in kurzer Zeit, es wird vorerst nicht weiter geschrieben.`);
      return false;
    }

    let uid = inhalt.uid;
    await this.zugriff.aendereFrontmatter(pfad, (live) => {
      const patch = notizVerarbeitenPatch(live, heute, schreibHilfen);
      if (!patch) return;
      patchAnwenden(live, patch);
      if (typeof patch.uid === "string") uid = patch.uid;
    });
    if (uid) this.uidVerzeichnis.set(pfad, uid);
    return true;
  }
}
