/**
 * Was:      Berechnet das nächste Datum einer Wiederholung.
 * Warum:    Zentrale Stelle für Notizen UND Inline-Items, damit beide gleich
 *           springen. Gerechnet wird ab dem GEPLANTEN Datum, nicht ab dem
 *           Tag des Abhakens, so verschiebt sich der Rhythmus nicht, nur weil
 *           etwas zu spät abgehakt wurde.
 *
 *           Zwei Wege:
 *           - MONTHLY/YEARLY ohne BYDAY und BYMONTHDAY: eigene Anker-Kappung
 *             (anker-kappung.ts).
 *           - Alles andere: die rrule-Bibliothek.
 *           UNTIL gilt auf beiden Wegen. COUNT wird hier bewusst NICHT
 *           beachtet, das erledigt die Serien-Logik anhand der Historie
 *           (siehe serienende.ts und serie-weiterschalten.ts).
 *
 *           Das Ergebnis hat nur ein Datum, keine Uhrzeit. Die Uhrzeit setzt
 *           der Aufrufer wieder ein (uhrzeitUebernehmen).
 * Beispiel: naechstesVorkommen("FREQ=WEEKLY;BYDAY=MO", "2026-07-20")
 *             →  { naechsterStart: "2026-07-27" }
 *           naechstesVorkommen("FREQ=MONTHLY", "2026-01-31")
 *             →  { naechsterStart: "2026-02-28", aktualisierteRrule: "FREQ=MONTHLY;X-ANCHORDAY=31" }
 *           Wird null, wenn die Serie zu Ende ist oder die Regel ungültig ist.
 */

import { rrulestr } from "rrule";
import { datumTeil } from "../datum/datum-teile";
import { datumAlsUtc, utcAlsDatumText } from "../datum/utc-datum";
import { ankerKappung } from "./anker-kappung";
import {
  rruleFuerBerechnung,
  rruleNormalisieren,
  rruleParameterAlsText,
  rruleParameterLesen,
} from "./rrule-text";
import { liegtNachSerienende } from "./serienende";

export interface NaechstesVorkommen {
  /** Das nächste Datum, "JJJJ-MM-TT". */
  naechsterStart: string;
  /**
   * Nur gesetzt, wenn sich der rrule-Text ändern soll (Anker neu eingetragen,
   * Präfix entfernt, Wochentage übersetzt). Der Aufrufer speichert ihn dann.
   */
  aktualisierteRrule?: string;
}

function naechstesMitBibliothek(rrule: string, geplanterStart: string): string | null {
  const start = datumAlsUtc(geplanterStart);
  const kompakt = datumTeil(geplanterStart).replace(/-/g, "");
  const regel = rrulestr(`DTSTART:${kompakt}T000000Z\nRRULE:${rruleFuerBerechnung(rrule)}`);
  const naechstes = regel.after(start, false);
  return naechstes ? utcAlsDatumText(naechstes) : null;
}

export function naechstesVorkommen(rrule: string, geplanterStart: string): NaechstesVorkommen | null {
  try {
    const normalisiert = rruleNormalisieren(rrule);
    const parameter = rruleParameterLesen(normalisiert);
    const haeufigkeit = parameter.FREQ;
    const intervall = parameter.INTERVAL ? parseInt(parameter.INTERVAL, 10) : 1;
    if (!Number.isFinite(intervall) || intervall < 1) return null;

    const hatWochentage = !!parameter.BYDAY;
    const hatMonatstag = !!parameter.BYMONTHDAY;

    let naechsterStart: string | null;
    let neueRrule = normalisiert;

    if ((haeufigkeit === "MONTHLY" || haeufigkeit === "YEARLY") && !hatWochentage && !hatMonatstag) {
      const kappung = ankerKappung(haeufigkeit, intervall, geplanterStart, parameter);
      naechsterStart = kappung.naechsterStart;
      if (kappung.neueParameter) neueRrule = rruleParameterAlsText(kappung.neueParameter);
    } else {
      naechsterStart = naechstesMitBibliothek(normalisiert, geplanterStart);
    }

    if (!naechsterStart) return null;
    if (liegtNachSerienende(normalisiert, naechsterStart)) return null;

    return {
      naechsterStart,
      aktualisierteRrule: neueRrule !== rrule ? neueRrule : undefined,
    };
  } catch {
    // Ungültige Regel (z. B. unbekannte Häufigkeit): wie "Serie zu Ende" behandeln.
    return null;
  }
}
