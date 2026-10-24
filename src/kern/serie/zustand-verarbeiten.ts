/**
 * Was:      Entscheidet allein aus dem aktuellen Zustand eines Eintrags, was
 *           zu tun ist, wenn er abgehakt, übersprungen oder wieder geöffnet
 *           wurde. Ohne gespeicherten Zustand im Speicher.
 * Warum:    Bisher merkte sich das Plugin den letzten Zustand im Speicher.
 *           Das ging beim Neustart verloren, und ein Haken, der z. B. am
 *           Handy gesetzt wurde, blieb unverarbeitet. Jetzt gilt:
 *
 *           Mit Wiederholung (rrule und start):
 *           - offen: nichts zu tun.
 *           - erledigt/übersprungen: Der Eintrag springt sofort zum nächsten
 *             Vorkommen und ist wieder offen. Ist die Serie zu Ende
 *             (COUNT/UNTIL), bleibt er abgehakt stehen, und weil die Historie
 *             dann vollständig ist, wird er danach nicht noch einmal
 *             verarbeitet.
 *           - Eine Regel, die nicht ausgewertet werden kann und kein Ende hat,
 *             wird wie ein einmaliger Eintrag behandelt (sonst würde sie
 *             bei jeder Änderung neu verarbeitet).
 *
 *           Einmalig (ohne Wiederholung):
 *           - erledigt: Das heutige Datum steht in "erledigt" (nur wenn dort
 *             noch nichts steht).
 *           - übersprungen: dasselbe in "uebersprungen".
 *           - offen: Ein einzelner Eintrag in "erledigt" bzw. "uebersprungen"
 *             wird entfernt (Haken wieder weggenommen). Längere Listen
 *             (ältere Historie) bleiben unangetastet.
 * Beispiel: Wöchentlich montags, Start "2026-07-20", Haken gesetzt, heute "2026-07-20"
 *             →  Start "2026-07-27", Kennzeichen wieder "offen", erledigt ["2026-07-20"]
 */

import { hatSerienende, istSerieAbgeschlossen } from "./serie-abgeschlossen";
import { serieWeiterschalten } from "./serie-weiterschalten";
import type { SerienZustand } from "./serie-weiterschalten";

export type Kennzeichen = "offen" | "erledigt" | "uebersprungen";

export interface VerarbeitungsErgebnis {
  zustand: SerienZustand;
  kennzeichen: Kennzeichen;
  /** true, wenn sich Zustand oder Kennzeichen ändern und der Eintrag neu geschrieben werden muss. */
  geaendert: boolean;
}

/** Ein einzelner Eintrag in einer Liste gilt als "dieser eine Haken" und wird entfernt, längere Listen bleiben. */
function einzelnenEintragLeeren(liste: string[]): string[] {
  return liste.length === 1 ? [] : liste;
}

function einmaligVerarbeiten(zustand: SerienZustand, kennzeichen: Kennzeichen, heute: string): VerarbeitungsErgebnis {
  let erledigt = zustand.erledigt;
  let uebersprungen = zustand.uebersprungen;

  if (kennzeichen === "erledigt") {
    if (erledigt.length === 0) erledigt = [heute];
    uebersprungen = einzelnenEintragLeeren(uebersprungen);
  } else if (kennzeichen === "uebersprungen") {
    if (uebersprungen.length === 0) uebersprungen = [heute];
    erledigt = einzelnenEintragLeeren(erledigt);
  } else {
    erledigt = einzelnenEintragLeeren(erledigt);
    uebersprungen = einzelnenEintragLeeren(uebersprungen);
  }

  const geaendert = erledigt !== zustand.erledigt || uebersprungen !== zustand.uebersprungen;
  return { zustand: geaendert ? { ...zustand, erledigt, uebersprungen } : zustand, kennzeichen, geaendert };
}

/** null, wenn die Serie nicht brauchbar ist (dann gilt die einmalige Behandlung). */
function serieVerarbeiten(
  zustand: SerienZustand,
  kennzeichen: Kennzeichen,
  heute: string
): VerarbeitungsErgebnis | null {
  if (kennzeichen === "offen") return { zustand, kennzeichen, geaendert: false };
  if (istSerieAbgeschlossen(zustand)) return { zustand, kennzeichen, geaendert: false };

  const ergebnis = serieWeiterschalten(zustand, kennzeichen, heute);
  if (ergebnis.gesprungen) {
    return { zustand: ergebnis.zustand, kennzeichen: "offen", geaendert: true };
  }
  if (ergebnis.serieBeendet && hatSerienende(zustand.rrule as string)) {
    return { zustand: ergebnis.zustand, kennzeichen, geaendert: true };
  }
  return null;
}

export function zustandVerarbeiten(zustand: SerienZustand, kennzeichen: Kennzeichen, heute: string): VerarbeitungsErgebnis {
  if (zustand.rrule && zustand.start) {
    const serie = serieVerarbeiten(zustand, kennzeichen, heute);
    if (serie) return serie;
  }
  return einmaligVerarbeiten(zustand, kennzeichen, heute);
}
