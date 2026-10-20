import { describe, expect, it } from "vitest";
import { rruleBauen } from "./rrule-bauen";

describe("rruleBauen", () => {
  it("baut einfache Häufigkeiten", () => {
    expect(rruleBauen("taeglich", 1, [])).toBe("FREQ=DAILY");
    expect(rruleBauen("monatlich", 1, [])).toBe("FREQ=MONTHLY");
    expect(rruleBauen("jaehrlich", 1, [])).toBe("FREQ=YEARLY");
  });

  it("nimmt Intervall und Wochentage bei wöchentlich", () => {
    expect(rruleBauen("woechentlich", 2, ["MO", "FR"])).toBe("FREQ=WEEKLY;INTERVAL=2;BYDAY=MO,FR");
  });

  it("lässt das Intervall 1 weg", () => {
    expect(rruleBauen("woechentlich", 1, ["MO"])).toBe("FREQ=WEEKLY;BYDAY=MO");
  });

  it("ignoriert Wochentage bei anderen Häufigkeiten", () => {
    expect(rruleBauen("monatlich", 1, ["MO"])).toBe("FREQ=MONTHLY");
  });

  it("liefert für 'keine' und 'eigene' einen leeren Text", () => {
    expect(rruleBauen("keine", 1, [])).toBe("");
    expect(rruleBauen("eigene", 3, ["MO"])).toBe("");
  });
});
