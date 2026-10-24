/**
 * Was:      Verarbeitet Dateien mit Inline-Zeilen: UIDs vergeben, doppelte
 *           UIDs beheben, Haken umsetzen. Kümmert sich um Reihenfolge,
 *           Doppelte über Dateien hinweg und Schutz vor Schleifen.
 * Warum:    Die eigentliche Textarbeit steht in inhalt-verarbeiten.ts. Hier
 *           kommt dazu, was nur mit mehreren Dateien und der Zeit zu tun hat:
 *           - Eine Datei wird nie gleichzeitig zweimal verarbeitet
 *             (Aufrufe stehen in einer Warteschlange pro Datei).
 *           - Ein Verzeichnis merkt sich, welche UID in welcher Datei steht,
 *             um kopierte Notizen und Zeilen zu erkennen. Der Eintrag wird
 *             vor dem Urteil geprüft, damit verschobene Zeilen nicht
 *             fälschlich als Kopie gelten. Beim Starten gewinnt die zuerst
 *             verarbeitete Datei, die spätere Kopie bekommt eine neue UID.
 *           - Geschrieben wird nur, wenn sich wirklich etwas ändert, und
 *             zwar auf den frischesten Inhalt der Datei.
 *           - Die Schreib-Bremse stoppt Schleifen.
 * Beispiel: await verarbeiter.verarbeiteDatei("Daily/2026-07-20.md")  →  true, wenn geschrieben wurde
 */

import { heute as heuteStandard } from "../../kern/datum/heute";
import { uidErzeugen } from "../../kern/text/uid";
import type { DateiZugriff } from "./datei-zugriff";
import { verarbeiteInlineInhalt } from "./inhalt-verarbeiten";
import type { VerarbeitungsHilfen } from "./inhalt-verarbeiten";
import type { InlineEinstellungen } from "./inline-typen";
import { SchreibBremse } from "./schreib-bremse";
import { leseAlleInlineZeilen } from "./zeilen-scannen";

export interface VerarbeiterOptionen {
  /** Nur für Tests: heutiges Datum. */
  heute?: () => string;
  /** Nur für Tests: neue UID. */
  neueUid?: () => string;
  /** Nur für Tests: aktuelle Zeit in Millisekunden. */
  jetzt?: () => number;
  /** Meldungen für Entwickler (z. B. console.warn). */
  protokoll?: (text: string) => void;
}

export class InlineVerarbeiter {
  private uidVerzeichnis = new Map<string, Set<string>>();
  private warteschlange = new Map<string, Promise<unknown>>();
  private bremse = new SchreibBremse();
  private heute: () => string;
  private neueUid: () => string;
  private jetzt: () => number;
  private protokoll: (text: string) => void;

  constructor(
    private zugriff: DateiZugriff,
    private holeEinstellungen: () => InlineEinstellungen,
    optionen: VerarbeiterOptionen = {}
  ) {
    this.heute = optionen.heute ?? heuteStandard;
    this.neueUid = optionen.neueUid ?? (() => uidErzeugen(this.heute()));
    this.jetzt = optionen.jetzt ?? (() => Date.now());
    this.protokoll = optionen.protokoll ?? (() => undefined);
  }

  /** Verarbeitet eine Datei. Aufrufe für dieselbe Datei laufen nacheinander. true = es wurde geschrieben. */
  verarbeiteDatei(pfad: string): Promise<boolean> {
    const vorher = this.warteschlange.get(pfad) ?? Promise.resolve();
    const aktuell = vorher.then(
      () => this.verarbeiteEinzeln(pfad),
      () => this.verarbeiteEinzeln(pfad)
    );
    const merker = aktuell.catch(() => undefined);
    this.warteschlange.set(pfad, merker);
    void merker.then(() => {
      if (this.warteschlange.get(pfad) === merker) this.warteschlange.delete(pfad);
    });
    return aktuell;
  }

  /** Verarbeitet alle Inline-Dateien nacheinander (z. B. beim Start). */
  async verarbeiteAlle(): Promise<{ dateien: number; geschrieben: number }> {
    const pfade = this.zugriff.inlineDateien();
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
    const uids = this.uidVerzeichnis.get(alterPfad);
    if (uids) {
      this.uidVerzeichnis.delete(alterPfad);
      this.uidVerzeichnis.set(neuerPfad, uids);
    }
  }

  dateiGeloescht(pfad: string): void {
    this.uidVerzeichnis.delete(pfad);
  }

  /** Vergisst alle gemerkten UIDs (z. B. nach geänderten Einstellungen). */
  verzeichnisLeeren(): void {
    this.uidVerzeichnis.clear();
  }

  private async enthaeltUid(pfad: string, uid: string): Promise<boolean> {
    try {
      const inhalt = await this.zugriff.lese(pfad);
      return leseAlleInlineZeilen(inhalt, this.holeEinstellungen()).some((z) => z.gelesen.uid === uid);
    } catch {
      return false; // Datei gibt es nicht mehr
    }
  }

  /** Welche UIDs dieser Datei stehen laut Verzeichnis auch in einer ANDEREN Datei (und dort wirklich noch)? */
  private async ermittleDoppelte(pfad: string, inhalt: string, einstellungen: InlineEinstellungen): Promise<Set<string>> {
    const doppelte = new Set<string>();
    const meineUids = new Set(
      leseAlleInlineZeilen(inhalt, einstellungen)
        .map((z) => z.gelesen.uid)
        .filter(Boolean)
    );

    for (const uid of meineUids) {
      for (const [anderePfad, uids] of this.uidVerzeichnis) {
        if (anderePfad === pfad || !uids.has(uid)) continue;
        if (await this.enthaeltUid(anderePfad, uid)) {
          doppelte.add(uid);
          break;
        }
        uids.delete(uid); // Eintrag war veraltet
      }
    }
    return doppelte;
  }

  private async verarbeiteEinzeln(pfad: string): Promise<boolean> {
    const einstellungen = this.holeEinstellungen();
    const inhalt = await this.zugriff.lese(pfad);
    const doppelte = await this.ermittleDoppelte(pfad, inhalt, einstellungen);
    const heute = this.heute();

    // Probelauf auf dem gelesenen Inhalt. Die dabei erzeugten UIDs werden beim
    // eigentlichen Schreiben wiederverwendet, damit nicht doppelt gewürfelt wird.
    const vorrat: string[] = [];
    const probeHilfen: VerarbeitungsHilfen = {
      neueUid: () => {
        const uid = this.neueUid();
        vorrat.push(uid);
        return uid;
      },
      uidAnderswoVergeben: (uid) => doppelte.has(uid),
    };
    const schreibHilfen: VerarbeitungsHilfen = {
      neueUid: () => vorrat.shift() ?? this.neueUid(),
      uidAnderswoVergeben: (uid) => doppelte.has(uid),
    };

    const probe = verarbeiteInlineInhalt(inhalt, einstellungen, heute, probeHilfen);
    if (!probe.geaendert) {
      this.uidVerzeichnis.set(pfad, new Set(probe.uids));
      return false;
    }

    if (!this.bremse.darfSchreiben(pfad, this.jetzt())) {
      this.protokoll(`Zu viele Änderungen an "${pfad}" in kurzer Zeit, es wird vorerst nicht weiter geschrieben.`);
      return false;
    }

    // Geschrieben wird auf den frischesten Inhalt, nicht auf den vorhin gelesenen.
    let uids = probe.uids;
    await this.zugriff.ersetze(pfad, (aktuellerInhalt) => {
      const ergebnis = verarbeiteInlineInhalt(aktuellerInhalt, einstellungen, heute, schreibHilfen);
      uids = ergebnis.uids;
      return ergebnis.inhalt;
    });
    this.uidVerzeichnis.set(pfad, new Set(uids));
    return true;
  }
}
