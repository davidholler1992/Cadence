import { describe, expect, it } from "vitest";
import { kuerzelAusName } from "./kuerzel";

describe("kuerzelAusName", () => {
  it("macht Kleinbuchstaben und ersetzt Sonderzeichen durch Bindestriche", () => {
    expect(kuerzelAusName("Familie & Freunde")).toBe("familie-freunde");
  });

  it("führt Umlaute auf den Grundbuchstaben zurück", () => {
    expect(kuerzelAusName("  Über uns!  ")).toBe("uber-uns");
  });

  it("lässt einfache Namen einfach klein", () => {
    expect(kuerzelAusName("Arbeit")).toBe("arbeit");
  });

  it("liefert bei leerem Namen einen leeren Text", () => {
    expect(kuerzelAusName("")).toBe("");
  });
});