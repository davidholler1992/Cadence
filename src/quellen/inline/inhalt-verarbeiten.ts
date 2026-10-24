/**
 * Was:      Verarbeitet den Text einer Notiz: vergibt fehlende UIDs, behebt
 *           doppelte UIDs und setzt Haken (erledigt/übersprungen) um.
 *           Reiner Text rein, Text raus, ohne Obsidian.
 * Warum:    Alles, was das Plugin an Inline-Zeilen automatisch ändert, steht
 *           hier an EINER Stelle und lässt sich ohne Obsidian testen. Die
 *           Regeln für Haken stehen in kern/serie/zustand-verarbeiten.ts,
 *           die gezielten Änderungen an der Zeile in zeile-aendern.ts, andere
 *           Teile der Zeile bleiben also unverändert.
 *
 *           Eine UID gilt als doppelt, wenn sie in diesem Text schon vorkam
 *           (das spätere Vorkommen bekommt eine neue) oder wenn sie laut
 *           "uidAnderswoVergeben" in einer anderen Datei steht.
 *           Zeilenenden (Windows/Unix) bleiben erhalten. Gibt es nichts zu
 *           ändern, kommt exakt der Eingabetext zurück.
 * Beispiel: verarbeiteInlineInhalt("- [ ] Auto #todo", einstellungen, "2026-07-20", hilfen)
 *             →  { inhalt: "- [ ] Auto #todo [uid:: 20260720-3fa9c0b1]", geaendert: true, ... }
 */

import { zustandVerarbeiten } from "../../kern/serie/zustand-verarbeiten";
import type { Kennzeichen } from "../../kern/serie/zustand-verarbeiten";
import type { SerienZustand } from "../../kern/serie/serie-weiterschalten";
import { FELD } from "./inline-typen";
import type { InlineEinstellungen, InlineGelesen, InlineZustand, ZerlegteZeile } from "./inline-typen";
import { feldSetzen, zustandSetzen } from "./zeile-aendern";
import { leseAlleInlineZeilen, zeilenAufteilen } from "./zeilen-scannen";
import { zeileAlsText } from "./zeile-zerlegen";

export interface VerarbeitungsHilfen {
  /** Liefert eine frische UID. */
  neueUid(): string;
  /** true, wenn die UID außerhalb dieses Textes (andere Datei) schon vergeben ist. */
  uidAnderswoVergeben(uid: string): boolean;
}

export interface InhaltsErgebnis {
  inhalt: string;
  geaendert: boolean;
  /** Alle UIDs, die nach der Verarbeitung in diesem Text stehen. */
  uids: string[];
}

function serienZustandAus(gelesen: InlineGelesen): SerienZustand {
  return {
    start: gelesen.start,
    ende: gelesen.ende,
    rrule: gelesen.rrule,
    ankerStart: gelesen.ankerStart,
    erledigt: gelesen.erledigt,
    uebersprungen: gelesen.uebersprungen,
  };
}

function listeAlsText(liste: string[]): string | undefined {
  return liste.length > 0 ? liste.join(",") : undefined;
}

/** Schreibt den Serien-Zustand zurück in die Zeile. Unveränderte Felder bleiben dabei unberührt. */
function serienZustandAnwenden(zerlegt: ZerlegteZeile, zustand: SerienZustand): ZerlegteZeile {
  let ergebnis = zerlegt;
  ergebnis = feldSetzen(ergebnis, FELD.start, zustand.start);
  ergebnis = feldSetzen(ergebnis, FELD.ende, zustand.ende);
  ergebnis = feldSetzen(ergebnis, FELD.rrule, zustand.rrule);
  ergebnis = feldSetzen(ergebnis, FELD.ankerStart, zustand.ankerStart);
  ergebnis = feldSetzen(ergebnis, FELD.erledigt, listeAlsText(zustand.erledigt));
  ergebnis = feldSetzen(ergebnis, FELD.uebersprungen, listeAlsText(zustand.uebersprungen));
  return ergebnis;
}

function kennzeichenAlsZeichen(kennzeichen: Kennzeichen): InlineZustand {
  return kennzeichen === "erledigt" ? "x" : kennzeichen === "uebersprungen" ? "-" : " ";
}

export function verarbeiteInlineInhalt(
  inhalt: string,
  einstellungen: InlineEinstellungen,
  heute: string,
  hilfen: VerarbeitungsHilfen
): InhaltsErgebnis {
  const zeilenende = inhalt.includes("\r\n") ? "\r\n" : "\n";
  const zeilen = zeilenAufteilen(inhalt);
  const gesehen = new Set<string>();
  let geaendert = false;

  for (const { zeilennummer, gelesen } of leseAlleInlineZeilen(inhalt, einstellungen)) {
    let zerlegt = gelesen.zerlegt;

    let uid = gelesen.uid;
    if (!uid || gesehen.has(uid) || hilfen.uidAnderswoVergeben(uid)) {
      uid = hilfen.neueUid();
      zerlegt = feldSetzen(zerlegt, FELD.uid, uid);
    }
    gesehen.add(uid);

    const ergebnis = zustandVerarbeiten(serienZustandAus(gelesen), gelesen.zustand, heute);
    if (ergebnis.geaendert) {
      zerlegt = serienZustandAnwenden(zerlegt, ergebnis.zustand);
      zerlegt = zustandSetzen(zerlegt, kennzeichenAlsZeichen(ergebnis.kennzeichen));
    }

    const neueZeile = zeileAlsText(zerlegt);
    if (neueZeile !== zeilen[zeilennummer]) {
      zeilen[zeilennummer] = neueZeile;
      geaendert = true;
    }
  }

  return { inhalt: geaendert ? zeilen.join(zeilenende) : inhalt, geaendert, uids: [...gesehen] };
}
