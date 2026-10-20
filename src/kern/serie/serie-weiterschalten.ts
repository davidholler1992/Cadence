/**
 * Was:      Die EINE Regel für "abgehakt" und "übersprungen", für volle
 *           Notizen und Inline-Items gleichermaßen.
 * Warum:    Bisher gab es sie dreimal (task-engine, inline-tasks, main.ts),
 *           mit Unterschieden: UNTIL/COUNT, Uhrzeit-Erhalt und anchorStart
 *           gab es nicht überall. Jetzt rechnet eine reine Funktion, die
 *           Quellen (Notiz/Inline) schreiben nur noch das Ergebnis in ihr
 *           jeweiliges Format.
 *
 *           Ablauf:
 *           1. Heutiges Datum in die Liste "erledigt" bzw. "uebersprungen".
 *              Bei Serien auch mehrfach am selben Tag (z. B. mehrere
 *              überfällige Tage nacheinander abhaken). Ohne Wiederholung
 *              nur einmal.
 *           2. Hat der Eintrag keine Wiederholung: fertig, kein Sprung.
 *           3. Ist die Serie zu Ende (COUNT erreicht oder UNTIL überschritten):
 *              kein Sprung, der Zustand erledigt/übersprungen bleibt stehen.
 *           4. Sonst springt der Start auf das nächste Vorkommen. Uhrzeit
 *              und Dauer bleiben erhalten, ankerStart wird einmalig
 *              gemerkt (erstes Datum der Serie, wichtig für die Vergangenheit
 *              im Kalender).
 *
 *           Gerechnet wird ab dem GEPLANTEN Start. Ein überfälliger Termin
 *           springt also nur um ein Vorkommen weiter (bewusst, der Rhythmus
 *           soll erhalten bleiben).
 * Beispiel: Wöchentlich montags, Start "2026-07-20T09:00", heute "2026-07-20"
 *           → neuer Start "2026-07-27T09:00", erledigt ["2026-07-20"],
 *             ankerStart "2026-07-20T09:00", gesprungen: true
 */

import { endeNachVerschiebung } from "../datum/dauer";
import { uhrzeitUebernehmen } from "../datum/uhrzeit";
import { naechstesVorkommen } from "../wiederholung/naechstes-vorkommen";
import { istAnzahlErreicht } from "../wiederholung/serienende";

export type SerienAktion = "erledigt" | "uebersprungen";

export interface SerienZustand {
  /** Datum "JJJJ-MM-TT" oder mit Uhrzeit "JJJJ-MM-TTTHH:MM". */
  start?: string;
  ende?: string;
  /** Gespeichert ohne "RRULE:" (siehe rrule-text.ts). */
  rrule?: string;
  /** Erster Start der Serie, wird beim ersten Sprung einmalig gesetzt. */
  ankerStart?: string;
  /** Daten, an denen abgehakt wurde (früher "completed"). */
  erledigt: string[];
  /** Daten, an denen übersprungen wurde (früher "skipped"). */
  uebersprungen: string[];
}

export interface SerienErgebnis {
  /** Der neue Zustand. Der übergebene Zustand wird nie verändert. */
  zustand: SerienZustand;
  /** true = Start steht jetzt auf dem nächsten Vorkommen, der Eintrag ist wieder offen. */
  gesprungen: boolean;
  /** true = die Wiederholung ist zu Ende (COUNT erreicht oder UNTIL überschritten). */
  serieBeendet: boolean;
}

function ohneDuplikat(liste: string[], datum: string): string[] {
  return liste.includes(datum) ? [...liste] : [...liste, datum];
}

export function serieWeiterschalten(zustand: SerienZustand, aktion: SerienAktion, heute: string): SerienErgebnis {
  const hatSerie = !!zustand.rrule && !!zustand.start;

  // 1. Historie fortschreiben (bei Serien dürfen Daten doppelt vorkommen).
  const erweitern = (liste: string[]) => (hatSerie ? [...liste, heute] : ohneDuplikat(liste, heute));
  const neuerZustand: SerienZustand = {
    ...zustand,
    erledigt: aktion === "erledigt" ? erweitern(zustand.erledigt) : [...zustand.erledigt],
    uebersprungen: aktion === "uebersprungen" ? erweitern(zustand.uebersprungen) : [...zustand.uebersprungen],
  };

  // 2. Keine Wiederholung: kein Sprung.
  if (!hatSerie) {
    return { zustand: neuerZustand, gesprungen: false, serieBeendet: false };
  }
  const rrule = zustand.rrule as string;
  const start = zustand.start as string;

  // 3. Serie zu Ende?
  const anzahlVergangene = neuerZustand.erledigt.length + neuerZustand.uebersprungen.length;
  if (istAnzahlErreicht(rrule, anzahlVergangene)) {
    return { zustand: neuerZustand, gesprungen: false, serieBeendet: true };
  }
  const naechstes = naechstesVorkommen(rrule, start);
  if (!naechstes) {
    return { zustand: neuerZustand, gesprungen: false, serieBeendet: true };
  }

  // 4. Sprung zum nächsten Vorkommen.
  const neuerStart = uhrzeitUebernehmen(naechstes.naechsterStart, start);
  return {
    zustand: {
      ...neuerZustand,
      start: neuerStart,
      ende: endeNachVerschiebung(start, zustand.ende, neuerStart),
      rrule: naechstes.aktualisierteRrule ?? rrule,
      ankerStart: zustand.ankerStart ?? start,
    },
    gesprungen: true,
    serieBeendet: false,
  };
}
