import { describe, expect, it } from "vitest";
import { einstellungenAusRohdaten, tagNameBereinigen } from "./laden-migrieren";

const STANDARD = { aufgabenOrdner: [], terminOrdner: [], inlineOrdner: [], tagTodo: "todo", tagTermin: "termin" };

describe("einstellungenAusRohdaten", () => {
  it("liefert die Standardwerte, wenn nichts gespeichert ist", () => {
    expect(einstellungenAusRohdaten(null)).toEqual(STANDARD);
    expect(einstellungenAusRohdaten(undefined)).toEqual(STANDARD);
    expect(einstellungenAusRohdaten("Unsinn")).toEqual(STANDARD);
    expect(einstellungenAusRohdaten({})).toEqual(STANDARD);
  });

  it("übernimmt gültige Werte und bereinigt sie", () => {
    const einstellungen = einstellungenAusRohdaten({
      aufgabenOrdner: ["/Aufgaben/"],
      terminOrdner: ["Termine", "  "],
      inlineOrdner: ["/Test/Inline/", "", "Daily"],
      tagTodo: "#Aufgabe",
      tagTermin: " Treffen ",
    });
    expect(einstellungen).toEqual({
      aufgabenOrdner: ["Aufgaben"],
      terminOrdner: ["Termine"],
      inlineOrdner: ["Test/Inline", "Daily"],
      tagTodo: "Aufgabe",
      tagTermin: "Treffen",
    });
  });

  it("liest Einstellungen aus einer älteren Version ohne die neuen Ordner", () => {
    const einstellungen = einstellungenAusRohdaten({ inlineOrdner: ["Test"], tagTodo: "todo", tagTermin: "termin" });
    expect(einstellungen.aufgabenOrdner).toEqual([]);
    expect(einstellungen.terminOrdner).toEqual([]);
    expect(einstellungen.inlineOrdner).toEqual(["Test"]);
  });

  it("ignoriert Einträge, die keine Texte sind", () => {
    expect(einstellungenAusRohdaten({ inlineOrdner: ["Daily", 5, null, {}] }).inlineOrdner).toEqual(["Daily"]);
  });

  it("fällt bei einem Ordner-Wert, der keine Liste ist, auf leer zurück", () => {
    expect(einstellungenAusRohdaten({ inlineOrdner: "Daily" }).inlineOrdner).toEqual([]);
    expect(einstellungenAusRohdaten({ aufgabenOrdner: "Aufgaben" }).aufgabenOrdner).toEqual([]);
  });

  it("fällt bei ungültigen Tag-Namen auf die Standardwerte zurück", () => {
    const einstellungen = einstellungenAusRohdaten({ tagTodo: "mit Leerzeichen", tagTermin: 42 });
    expect(einstellungen.tagTodo).toBe("todo");
    expect(einstellungen.tagTermin).toBe("termin");
  });

  it("behält unbekannte Felder nicht", () => {
    expect(einstellungenAusRohdaten({ unbekannt: true })).not.toHaveProperty("unbekannt");
  });
});

describe("tagNameBereinigen", () => {
  it("entfernt # und Leerraum, erlaubt Umlaute und Unterstriche", () => {
    expect(tagNameBereinigen(" #Übung_1 ", "x")).toBe("Übung_1");
  });

  it("nimmt den Ersatz bei leer oder ungültig", () => {
    expect(tagNameBereinigen("", "x")).toBe("x");
    expect(tagNameBereinigen("#", "x")).toBe("x");
    expect(tagNameBereinigen("a b", "x")).toBe("x");
    expect(tagNameBereinigen(null, "x")).toBe("x");
  });
});
