import { describe, expect, it } from "vitest";
import { leseInlineZeile } from "./zeile-lesen";
import { eintragAusInline } from "./zeile-zu-eintrag";

describe("eintragAusInline", () => {
  it("übernimmt den Inhalt und ergänzt Quelle, Pfad und Zeile", () => {
    const gelesen = leseInlineZeile("- [ ] Auto #todo #wichtig [start:: 2026-07-20] [uid:: a-1]", {
      tagTodo: "todo",
      tagTermin: "termin",
    })!;
    const eintrag = eintragAusInline(gelesen, "Daily/2026-07-20.md", 4);

    expect(eintrag.quelle).toBe("inline");
    expect(eintrag.pfad).toBe("Daily/2026-07-20.md");
    expect(eintrag.zeile).toBe(4);
    expect(eintrag.titel).toBe("Auto");
    expect(eintrag.start).toBe("2026-07-20");
    expect(eintrag.tags).toEqual(["wichtig"]);
    expect(eintrag.uid).toBe("a-1");
  });

  it("enthält die zerlegte Zeile nicht", () => {
    const gelesen = leseInlineZeile("- [ ] A #todo", { tagTodo: "todo", tagTermin: "termin" })!;
    expect("zerlegt" in eintragAusInline(gelesen, "x.md", 0)).toBe(false);
  });
});
