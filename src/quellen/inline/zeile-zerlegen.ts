/**
 * Was:      Zerlegt eine Checkbox-Zeile in Stücke (Text, Tags, Felder) und
 *           setzt sie wieder zusammen. Zusammengesetzt ergibt sich IMMER
 *           exakt die Originalzeile.
 * Warum:    Der alte Parser hat Zeilen neu gebaut und dabei Dinge verloren
 *           oder verändert. Hier gilt:
 *             - Felder werden mit Klammer-Zählung gelesen. Ein Wikilink im
 *               Feld ("[parent:: [[Projekt]]]") bleibt heil.
 *             - Tags zählen nur, wenn sie am Zeilenanfang oder nach einem
 *               Leerzeichen stehen. "#Abschnitt" in "[[Notiz#Abschnitt]]"
 *               oder in einer Web-Adresse ist KEIN Tag.
 *             - Tags in Feldwerten (Beschreibung) und in Code-Abschnitten
 *               (`...`) werden ignoriert.
 *             - Umlaute sind in Tags erlaubt (#Übung).
 *             - Eine Block-ID am Zeilenende (^abc123) bleibt am Ende.
 *             - Fremde Felder ([due:: ...]) bleiben als normale Felder erhalten.
 * Beispiel: zerlegeZeile("- [ ] Auto #todo [start:: 2026-07-20]")
 *             →  Stücke: Text "Auto ", Tag "#todo", Text " ", Feld "start"
 */

import { feldWertDekodieren } from "./feld-wert";
import type { FeldStueck, Stueck, ZerlegteZeile } from "./inline-typen";

const ZEILENANFANG = /^(\s*)-(\s)\[([ xX-])\](\s*)(.*)$/;
const BLOCK_ID = /(\s+\^[A-Za-z0-9-]+)$/;
const FELD_KOPF = /\[([A-Za-z0-9_]+)::\s*/y;
const TAG = /#([\p{L}\p{N}_/-]+)/uy;

/** Liest ein Feld "[schluessel:: wert]" ab Position "start". null, wenn dort keines beginnt oder die Klammer nie schließt. */
function leseFeldAb(text: string, start: number): { stueck: FeldStueck; ende: number } | null {
  FELD_KOPF.lastIndex = start;
  const kopf = FELD_KOPF.exec(text);
  if (!kopf) return null;

  const wertBeginn = start + kopf[0].length;
  let tiefe = 0;
  for (let i = wertBeginn; i < text.length; i++) {
    const zeichen = text[i];
    if (zeichen === "\\") {
      i++; // geschütztes Zeichen überspringen
      continue;
    }
    if (zeichen === "[") {
      tiefe++;
    } else if (zeichen === "]") {
      if (tiefe === 0) {
        return {
          stueck: {
            art: "feld",
            schluessel: kopf[1],
            wert: feldWertDekodieren(text.slice(wertBeginn, i).trim()),
            roh: text.slice(start, i + 1),
          },
          ende: i + 1,
        };
      }
      tiefe--;
    }
  }
  return null;
}

/** Liest einen Tag ab Position "start" (dort steht "#"). null, wenn es keiner ist (z. B. "#123"). */
function leseTagAb(text: string, start: number): { name: string; ende: number } | null {
  TAG.lastIndex = start;
  const treffer = TAG.exec(text);
  if (!treffer) return null;
  const name = treffer[1];
  if (!/\D/.test(name)) return null; // reine Zahlen sind kein Tag
  return { name, ende: start + treffer[0].length };
}

function zerlegeKoerper(koerper: string): Stueck[] {
  const stuecke: Stueck[] = [];
  let text = "";
  const textAbschliessen = () => {
    if (text !== "") {
      stuecke.push({ art: "text", roh: text });
      text = "";
    }
  };

  let i = 0;
  while (i < koerper.length) {
    const zeichen = koerper[i];

    if (zeichen === "`") {
      const ende = koerper.indexOf("`", i + 1);
      if (ende !== -1) {
        text += koerper.slice(i, ende + 1); // Code-Abschnitt bleibt Text
        i = ende + 1;
        continue;
      }
    }

    if (zeichen === "[") {
      if (koerper.startsWith("[[", i)) {
        const ende = koerper.indexOf("]]", i + 2);
        if (ende !== -1) {
          text += koerper.slice(i, ende + 2); // Wikilink bleibt Text
          i = ende + 2;
          continue;
        }
      } else {
        const feld = leseFeldAb(koerper, i);
        if (feld) {
          textAbschliessen();
          stuecke.push(feld.stueck);
          i = feld.ende;
          continue;
        }
      }
    }

    if (zeichen === "#" && (i === 0 || /\s/.test(koerper[i - 1]))) {
      const tag = leseTagAb(koerper, i);
      if (tag) {
        textAbschliessen();
        stuecke.push({ art: "tag", name: tag.name, roh: koerper.slice(i, tag.ende) });
        i = tag.ende;
        continue;
      }
    }

    text += zeichen;
    i++;
  }
  textAbschliessen();
  return stuecke;
}

/** Zerlegt eine Zeile. null, wenn sie keine Checkbox-Zeile ("- [ ] ...") ist. */
export function zerlegeZeile(zeile: string): ZerlegteZeile | null {
  const treffer = ZEILENANFANG.exec(zeile);
  if (!treffer) return null;
  const [, einrueckung, nachStrich, zustandZeichen, abstandNachBox, koerper] = treffer;

  const blockTreffer = BLOCK_ID.exec(koerper);
  const blockId = blockTreffer ? blockTreffer[1] : "";
  const rumpf = blockId ? koerper.slice(0, koerper.length - blockId.length) : koerper;

  return {
    einrueckung,
    nachStrich,
    zustandZeichen,
    abstandNachBox,
    stuecke: zerlegeKoerper(rumpf),
    blockId,
  };
}

/** Setzt die Stücke wieder zur Zeile zusammen. Ohne Änderung ist das exakt die Originalzeile. */
export function zeileAlsText(zerlegt: ZerlegteZeile): string {
  const koerper = zerlegt.stuecke.map((stueck) => stueck.roh).join("");
  return (
    `${zerlegt.einrueckung}-${zerlegt.nachStrich}[${zerlegt.zustandZeichen}]` +
    `${zerlegt.abstandNachBox}${koerper}${zerlegt.blockId}`
  );
}
