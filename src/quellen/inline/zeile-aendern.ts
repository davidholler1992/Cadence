/**
 * Was:      Ändert GEZIELT einzelne Teile einer Inline-Zeile (Zustand, ein
 *           Feld, Titel, Tags). Alles andere in der Zeile bleibt Zeichen für
 *           Zeichen unverändert.
 * Warum:    Früher wurde die Zeile bei jeder Änderung komplett neu gebaut.
 *           Dabei wanderten Tags ans Ende, fremde Felder verschwanden und
 *           Block-IDs gerieten in die Mitte. Jetzt wird nur das betroffene
 *           Stück ersetzt, entfernt oder eingefügt.
 *
 *           Alle Funktionen verändern die übergebene Zeile nicht, sie geben
 *           eine neue zurück. Mit zeileAlsText() (zeile-zerlegen.ts) wird
 *           daraus wieder Text.
 *
 *           Neue Felder werden vor dem uid-Feld bzw. am Ende eingefügt, aber
 *           immer VOR einer Block-ID.
 * Beispiel: feldSetzen(zerlegt, "start", "2026-07-21")
 *             "- [ ] A #todo [start:: 2026-07-20] [uid:: 1]"  →  "- [ ] A #todo [start:: 2026-07-21] [uid:: 1]"
 */

import { feldWertKodieren } from "./feld-wert";
import { zustandVonZeichen } from "./inline-typen";
import type { FeldStueck, InlineZustand, Stueck, TagStueck, TextStueck, ZerlegteZeile } from "./inline-typen";

function textStueck(roh: string): TextStueck {
  return { art: "text", roh };
}

function istLeerraum(text: string): boolean {
  return text.trim() === "";
}

/** Entfernt das Stück an "index" und räumt den Leerraum drumherum auf (keine doppelten Leerzeichen, keine am Zeilenende). */
function stueckEntfernen(stuecke: Stueck[], index: number): Stueck[] {
  const links = stuecke.slice(0, index);
  const rechts = stuecke.slice(index + 1);
  const letztesLinks = links[links.length - 1];
  const erstesRechts = rechts[0];

  if (letztesLinks?.art === "text" && erstesRechts?.art === "text") {
    links.pop();
    rechts.shift();
    const rechterText = /\s$/.test(letztesLinks.roh) ? erstesRechts.roh.replace(/^\s+/, "") : erstesRechts.roh;
    links.push(textStueck(letztesLinks.roh + rechterText));
  } else if (!erstesRechts && letztesLinks?.art === "text") {
    links.pop();
    const gekuerzt = letztesLinks.roh.replace(/\s+$/, "");
    if (gekuerzt !== "") links.push(textStueck(gekuerzt));
  } else if (!letztesLinks && erstesRechts?.art === "text") {
    rechts[0] = textStueck(erstesRechts.roh.replace(/^\s+/, ""));
  }
  return [...links, ...rechts];
}

/** Zustand der Checkbox setzen. Hat sie den Zustand schon (z. B. großes "X" für erledigt), bleibt die Zeile unverändert. */
export function zustandSetzen(zerlegt: ZerlegteZeile, zustand: InlineZustand): ZerlegteZeile {
  if (zustandVonZeichen(zerlegt.zustandZeichen) === zustand) return zerlegt;
  return { ...zerlegt, zustandZeichen: zustand };
}

function feldStueck(schluessel: string, wert: string): FeldStueck {
  const sauber = wert.trim();
  return { art: "feld", schluessel, wert: sauber, roh: `[${schluessel}:: ${feldWertKodieren(sauber)}]` };
}

/** Index des letzten Stücks, das nicht nur Leerraum ist (-1, wenn es keines gibt). */
function letzterInhaltIndex(stuecke: Stueck[]): number {
  for (let i = stuecke.length - 1; i >= 0; i--) {
    const stueck = stuecke[i];
    if (!(stueck.art === "text" && istLeerraum(stueck.roh))) return i;
  }
  return -1;
}

/** Hängt ein Stück ans Ende (Leerraum am Zeilenende fällt weg), mit einem Leerzeichen davor, falls nötig. */
function amEndeAnhaengen(stuecke: Stueck[], neues: Stueck): Stueck[] {
  const bisHierher = stuecke.slice(0, letzterInhaltIndex(stuecke) + 1);
  const davor = bisHierher[bisHierher.length - 1];
  if (!davor) return [neues];
  if (davor.art === "text" && /\s$/.test(davor.roh)) return [...bisHierher, neues];
  return [...bisHierher, textStueck(" "), neues];
}

/** Fügt ein neues Feld vor einem abschließenden uid-Feld ein, sonst am Ende. */
function feldEinfuegen(stuecke: Stueck[], feld: FeldStueck): Stueck[] {
  const index = letzterInhaltIndex(stuecke);
  const letztes = stuecke[index];
  if (letztes && letztes.art === "feld" && letztes.schluessel.toLowerCase() === "uid") {
    return [...stuecke.slice(0, index), feld, textStueck(" "), ...stuecke.slice(index)];
  }
  return amEndeAnhaengen(stuecke, feld);
}

/**
 * Setzt ein Feld. Ist es schon da, wird es ersetzt (ist der Wert gleich, bleibt die Zeile unverändert).
 * Ist wert leer oder undefined, wird das Feld entfernt. Fehlt es, wird es eingefügt.
 */
export function feldSetzen(zerlegt: ZerlegteZeile, schluessel: string, wert: string | undefined): ZerlegteZeile {
  const gesucht = schluessel.toLowerCase();
  const passt = (stueck: Stueck): stueck is FeldStueck =>
    stueck.art === "feld" && stueck.schluessel.toLowerCase() === gesucht;

  let stuecke = zerlegt.stuecke;

  if (wert === undefined || wert.trim() === "") {
    for (let i = stuecke.length - 1; i >= 0; i--) {
      // Nach einem Entfernen kann die Liste kürzer geworden sein, daher den Index absichern.
      if (i < stuecke.length && passt(stuecke[i])) stuecke = stueckEntfernen(stuecke, i);
    }
    return stuecke === zerlegt.stuecke ? zerlegt : { ...zerlegt, stuecke };
  }

  let letzterIndex = -1;
  stuecke.forEach((stueck, index) => {
    if (passt(stueck)) letzterIndex = index;
  });

  if (letzterIndex === -1) {
    return { ...zerlegt, stuecke: feldEinfuegen(stuecke, feldStueck(schluessel, wert)) };
  }

  const vorhanden = stuecke[letzterIndex] as FeldStueck;
  if (vorhanden.wert === wert.trim()) return zerlegt;

  const neu = [...stuecke];
  neu[letzterIndex] = feldStueck(schluessel, wert);
  return { ...zerlegt, stuecke: neu };
}

/**
 * Ersetzt den Titel. Steht der Titel in einem einzigen Text-Stück (der Normalfall),
 * wird nur dieses ersetzt. Ist er durch Tags mitten im Text zerteilt, wird der erste
 * Teil ersetzt und der Rest des Textes entfernt, die Tags selbst bleiben stehen.
 */
export function titelSetzen(zerlegt: ZerlegteZeile, titel: string): ZerlegteZeile {
  const sauber = titel.replace(/\s*[\r\n]+\s*/g, " ").trim();
  const stuecke = [...zerlegt.stuecke];

  let ersterMitInhalt = -1;
  for (let i = 0; i < stuecke.length; i++) {
    const stueck = stuecke[i];
    if (stueck.art !== "text" || istLeerraum(stueck.roh)) continue;
    const teile = /^(\s*)([\s\S]*?)(\s*)$/.exec(stueck.roh)!;
    if (ersterMitInhalt === -1) {
      ersterMitInhalt = i;
      stuecke[i] = textStueck(`${teile[1]}${sauber}${teile[3]}`);
    } else {
      stuecke[i] = textStueck(`${teile[1]}${teile[3]}`); // Rest des zerteilten Titels entfernen
    }
  }

  if (ersterMitInhalt === -1) {
    stuecke.unshift(textStueck(`${sauber} `));
  }
  return { ...zerlegt, stuecke };
}

function tagStueck(name: string): TagStueck {
  return { art: "tag", name, roh: `#${name}` };
}

/**
 * Fügt einen Tag hinzu, direkt hinter "nachTag" (z. B. dem Verwaltungs-Tag), sonst am Ende.
 * Gibt es den Tag schon (Groß-/Kleinschreibung egal), passiert nichts.
 */
export function tagHinzufuegen(zerlegt: ZerlegteZeile, name: string, nachTag?: string): ZerlegteZeile {
  const gesucht = name.toLowerCase();
  const existiert = zerlegt.stuecke.some((s) => s.art === "tag" && s.name.toLowerCase() === gesucht);
  if (existiert) return zerlegt;

  const anker = nachTag?.toLowerCase();
  const ankerIndex = anker
    ? zerlegt.stuecke.findIndex((s) => s.art === "tag" && s.name.toLowerCase() === anker)
    : -1;

  if (ankerIndex !== -1) {
    const neu = [...zerlegt.stuecke];
    neu.splice(ankerIndex + 1, 0, textStueck(" "), tagStueck(name));
    return { ...zerlegt, stuecke: neu };
  }

  return { ...zerlegt, stuecke: amEndeAnhaengen(zerlegt.stuecke, tagStueck(name)) };
}

/** Entfernt alle Vorkommen eines Tags (Groß-/Kleinschreibung egal). */
export function tagEntfernen(zerlegt: ZerlegteZeile, name: string): ZerlegteZeile {
  const gesucht = name.toLowerCase();
  let stuecke = zerlegt.stuecke;
  for (let i = stuecke.length - 1; i >= 0; i--) {
    const stueck = stuecke[i]; // kann nach einem Entfernen fehlen, dann einfach weiter
    if (stueck && stueck.art === "tag" && stueck.name.toLowerCase() === gesucht) stuecke = stueckEntfernen(stuecke, i);
  }
  return stuecke === zerlegt.stuecke ? zerlegt : { ...zerlegt, stuecke };
}
