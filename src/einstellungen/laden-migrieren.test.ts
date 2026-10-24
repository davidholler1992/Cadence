import { describe, expect, it } from "vitest";
import { einstellungenAusRohdaten, tagNameBereinigen } from "./laden-migrieren";

describe("einstellungenAusRohdaten", () => {
  it("liefert die Standardwerte, wenn nichts gespeichert ist", () => {
    const standard = { inlineOrdner: [], tagTodo: "todo", tagTermin: "termin" };
    expect(einstellungenAusRohdaten(null)).toEqual(standard);
    expect(einstellungenAusRohdaten(undefined)).toEqual(standard);
    expect(einstellungenAusRohdaten("Unsinn")).toEqual(standard);
    expect(einstellungenAusRohdaten({})).toEqual(standard);
  });

  it("übernimmt gültige Werte und bereinigt sie", () => {
    const einstellungen = einstellungenAusRohdaten({
      inlineOrdner: ["/Test/Inline/", "", "Daily"],
      tagTodo: "#Aufgabe",
      tagTermin: " Treffen ",
    });
    expect(einstellungen).toEqual({ inlineOrdner: ["Test/Inline", "Daily"], tagTodo: "Aufgabe", tagTermin: "Treffen" });
  });

  it("ignoriert Einträge, die keine Texte sind", () => {
    expect(einstellungenAusRohdaten({ inlineOrdner: ["Daily", 5, null, {}] }).inlineOrdner).toEqual(["Daily"]);
  });

  it("fällt bei einem Ordner-Wert, der keine Liste ist, auf leer zurück", () => {
    expect(einstellungenAusRohdaten({ inlineOrdner: "Daily" }).inlineOrdner).toEqual([]);
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
