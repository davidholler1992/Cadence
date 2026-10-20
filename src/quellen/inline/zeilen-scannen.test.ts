import { describe, expect, it } from "vitest";
import type { InlineEinstellungen } from "./inline-typen";
import { leseAlleInlineZeilen, zeilenAufteilen } from "./zeilen-scannen";

const EINSTELLUNGEN: InlineEinstellungen = { tagTodo: "todo", tagTermin: "termin" };

describe("zeilenAufteilen", () => {
  it("teilt Unix- und Windows-Zeilenenden", () => {
    expect(zeilenAufteilen("a\nb\r\nc")).toEqual(["a", "b", "c"]);
  });
});

describe("leseAlleInlineZeilen", () => {
  it("findet Aufgaben und Termine mit Zeilennummern", () => {
    const inhalt = "# Tag\n- [ ] A #todo\nText\n  - [x] B #termin [start:: 2026-07-20]\n- Aufzählung";
    const gefunden = leseAlleInlineZeilen(inhalt, EINSTELLUNGEN);
    expect(gefunden.map((g) => [g.zeilennummer, g.gelesen.titel, g.gelesen.art])).toEqual([
      [1, "A", "todo"],
      [3, "B", "termin"],
    ]);
  });

  it("überspringt Zeilen in Code-Blöcken", () => {
    const inhalt = "- [ ] echt #todo\n```md\n- [ ] Beispiel #todo\n```\n~~~\n- [ ] auch Beispiel #todo\n~~~\n- [ ] wieder echt #todo";
    const titel = leseAlleInlineZeilen(inhalt, EINSTELLUNGEN).map((g) => g.gelesen.titel);
    expect(titel).toEqual(["echt", "wieder echt"]);
  });

  it("kommt mit Windows-Zeilenenden klar", () => {
    const gefunden = leseAlleInlineZeilen("- [ ] A #todo\r\n- [ ] B #todo\r\n", EINSTELLUNGEN);
    expect(gefunden.map((g) => g.zeilennummer)).toEqual([0, 1]);
  });

  it("liefert bei leerem Text eine leere Liste", () => {
    expect(leseAlleInlineZeilen("", EINSTELLUNGEN)).toEqual([]);
  });
});
