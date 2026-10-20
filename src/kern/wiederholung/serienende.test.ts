import { describe, expect, it } from "vitest";
import { istAnzahlErreicht, liegtNachSerienende, maximaleAnzahl, untilDatum } from "./serienende";

describe("untilDatum", () => {
  it("liest ein reines Datum", () => {
    expect(untilDatum("FREQ=WEEKLY;UNTIL=20261231")).toBe("2026-12-31");
  });

  it("liest auch ein Datum mit Uhrzeit", () => {
    expect(untilDatum("FREQ=WEEKLY;UNTIL=20261231T225959Z")).toBe("2026-12-31");
  });

  it("liefert undefined ohne UNTIL", () => {
    expect(untilDatum("FREQ=WEEKLY")).toBeUndefined();
  });
});

describe("maximaleAnzahl", () => {
  it("liest COUNT", () => {
    expect(maximaleAnzahl("FREQ=DAILY;COUNT=3")).toBe(3);
  });

  it("liefert undefined ohne COUNT", () => {
    expect(maximaleAnzahl("FREQ=DAILY")).toBeUndefined();
  });
});

describe("liegtNachSerienende", () => {
  it("ist am UNTIL-Tag selbst noch false, danach true", () => {
    const regel = "FREQ=WEEKLY;UNTIL=20260727";
    expect(liegtNachSerienende(regel, "2026-07-27")).toBe(false);
    expect(liegtNachSerienende(regel, "2026-07-28")).toBe(true);
  });

  it("ist ohne UNTIL immer false", () => {
    expect(liegtNachSerienende("FREQ=WEEKLY", "2099-01-01")).toBe(false);
  });
});

describe("istAnzahlErreicht", () => {
  it("ist erst true, wenn so viele Vorkommen vergangen sind wie COUNT", () => {
    expect(istAnzahlErreicht("FREQ=DAILY;COUNT=3", 2)).toBe(false);
    expect(istAnzahlErreicht("FREQ=DAILY;COUNT=3", 3)).toBe(true);
  });

  it("ist ohne COUNT immer false", () => {
    expect(istAnzahlErreicht("FREQ=DAILY", 1000)).toBe(false);
  });
});
