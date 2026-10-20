/**
 * Was:      Berechnet das nächste Datum bei MONTHLY/YEARLY, wenn der Wunsch-Tag
 *           im Zielmonat nicht existiert (31. Februar, 29. Februar im Nicht-Schaltjahr).
 * Warum:    Ein Termin "jeden Monat am 31." soll im Februar auf den 28. fallen
 *           und im März wieder auf den 31. springen, nicht ab Februar bei
 *           28. hängen bleiben. Dafür merkt sich die rrule den ursprünglichen
 *           Wunsch-Tag als internen Zusatz (X-ANCHORDAY, bei YEARLY auch
 *           X-ANCHORMONTH). Diese Zusätze gehen NICHT an den Server.
 *           Gilt nur ohne ausdrücklichen BYDAY/BYMONTHDAY. Mit BYMONTHDAY=31
 *           gilt dagegen die strenge Regel: Monate ohne 31. werden übersprungen.
 * Beispiel: 31.01., monatlich → 28.02. → 31.03. → 30.04. → 31.05. ...
 *           29.02.2028, jährlich → 28.02.2029 → ... → 29.02.2032
 */

import { datumTeil } from "../datum/datum-teile";
import { tageImMonat } from "../datum/tage-rechnen";
import { zweistellig } from "../text/zahl-auffuellen";
import type { RruleParameter } from "./rrule-text";

export interface AnkerKappungErgebnis {
  /** Das nächste Datum, "JJJJ-MM-TT". */
  naechsterStart: string;
  /** Nur gesetzt, wenn der Anker JETZT zum ersten Mal eingetragen wurde (sonst undefined). */
  neueParameter?: RruleParameter;
}

function datumBauen(jahr: number, monat: number, tag: number): string {
  return `${jahr}-${zweistellig(monat)}-${zweistellig(tag)}`;
}

export function ankerKappung(
  haeufigkeit: "MONTHLY" | "YEARLY",
  intervall: number,
  aktuellerStart: string,
  parameter: RruleParameter
): AnkerKappungErgebnis {
  const [jahr, monat, tag] = datumTeil(aktuellerStart).split("-").map(Number);
  const neueParameter: RruleParameter = { ...parameter };
  let geaendert = false;

  if (haeufigkeit === "MONTHLY") {
    const ankerTag = parameter["X-ANCHORDAY"] ? parseInt(parameter["X-ANCHORDAY"], 10) : tag;
    if (!parameter["X-ANCHORDAY"]) {
      neueParameter["X-ANCHORDAY"] = String(ankerTag);
      geaendert = true;
    }

    const monateGesamt = monat - 1 + intervall;
    const neuesJahr = jahr + Math.floor(monateGesamt / 12);
    const neuerMonat = (((monateGesamt % 12) + 12) % 12) + 1; // 1 bis 12
    const neuerTag = Math.min(ankerTag, tageImMonat(neuesJahr, neuerMonat));
    return {
      naechsterStart: datumBauen(neuesJahr, neuerMonat, neuerTag),
      neueParameter: geaendert ? neueParameter : undefined,
    };
  }

  // YEARLY
  const ankerMonat = parameter["X-ANCHORMONTH"] ? parseInt(parameter["X-ANCHORMONTH"], 10) : monat;
  const ankerTag = parameter["X-ANCHORDAY"] ? parseInt(parameter["X-ANCHORDAY"], 10) : tag;
  if (!parameter["X-ANCHORMONTH"]) {
    neueParameter["X-ANCHORMONTH"] = String(ankerMonat);
    geaendert = true;
  }
  if (!parameter["X-ANCHORDAY"]) {
    neueParameter["X-ANCHORDAY"] = String(ankerTag);
    geaendert = true;
  }

  const neuesJahr = jahr + intervall;
  const neuerTag = Math.min(ankerTag, tageImMonat(neuesJahr, ankerMonat));
  return {
    naechsterStart: datumBauen(neuesJahr, ankerMonat, neuerTag),
    neueParameter: geaendert ? neueParameter : undefined,
  };
}
