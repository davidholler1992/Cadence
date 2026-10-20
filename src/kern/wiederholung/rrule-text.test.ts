import { describe, expect, it } from "vitest";
import {
  rruleFuerBerechnung,
  rruleFuerServer,
  rruleNormalisieren,
  rruleOhnePraefix,
  rruleParameterAlsText,
  rruleParameterLesen,
} from "./rrule-text";

describe("rruleOhnePraefix", () => {
  it("entfernt RRULE: egal in welcher Schreibweise", () => {
    expect(rruleOhnePraefix("RRULE:FREQ=DAILY")).toBe("FREQ=DAILY");
    expect(rruleOhnePraefix("rrule:FREQ=DAILY")).toBe("FREQ=DAILY");
  });

  it("lässt Text ohne Präfix unverändert (außer Leerzeichen am Rand)", () => {
    expect(rruleOhnePraefix("  FREQ=DAILY ")).toBe("FREQ=DAILY");
  });
});

describe("rruleParameterLesen / rruleParameterAlsText", () => {
  it("zerlegt in Parameter und setzt sie wieder zusammen", () => {
    const parameter = rruleParameterLesen("FREQ=WEEKLY;BYDAY=MO");
    expect(parameter).toEqual({ FREQ: "WEEKLY", BYDAY: "MO" });
    expect(rruleParameterAlsText(parameter)).toBe("FREQ=WEEKLY;BYDAY=MO");
  });

  it("macht Schlüssel und Werte zu Großbuchstaben", () => {
    expect(rruleParameterLesen("freq=daily")).toEqual({ FREQ: "DAILY" });
  });

  it("überspringt kaputte Teile ohne Gleichheitszeichen", () => {
    expect(rruleParameterLesen("FREQ=DAILY;;Unsinn")).toEqual({ FREQ: "DAILY" });
  });
});

describe("rruleNormalisieren", () => {
  it("entfernt Präfix, macht groß und übersetzt deutsche Wochentage", () => {
    expect(rruleNormalisieren("rrule:freq=weekly;byday=mo,mi")).toBe("FREQ=WEEKLY;BYDAY=MO,WE");
  });

  it("behält die internen Anker-Zusätze", () => {
    expect(rruleNormalisieren("FREQ=MONTHLY;X-ANCHORDAY=31")).toBe("FREQ=MONTHLY;X-ANCHORDAY=31");
  });
});

describe("rruleFuerServer", () => {
  it("entfernt nur die Anker-Zusätze, COUNT bleibt", () => {
    expect(rruleFuerServer("RRULE:FREQ=MONTHLY;COUNT=5;X-ANCHORDAY=31")).toBe("FREQ=MONTHLY;COUNT=5");
    expect(rruleFuerServer("FREQ=YEARLY;X-ANCHORMONTH=2;X-ANCHORDAY=29")).toBe("FREQ=YEARLY");
  });
});

describe("rruleFuerBerechnung", () => {
  it("entfernt COUNT und alle X-Zusätze", () => {
    expect(rruleFuerBerechnung("FREQ=WEEKLY;COUNT=3;X-FOO=1")).toBe("FREQ=WEEKLY");
  });

  it("lässt UNTIL und Wochentage stehen", () => {
    expect(rruleFuerBerechnung("FREQ=WEEKLY;BYDAY=MI;UNTIL=20261231")).toBe("FREQ=WEEKLY;BYDAY=WE;UNTIL=20261231");
  });
});
