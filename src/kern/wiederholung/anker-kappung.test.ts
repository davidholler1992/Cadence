import { describe, expect, it } from "vitest";
import { ankerKappung } from "./anker-kappung";

describe("ankerKappung monatlich", () => {
  it("fällt am 31.01. im Februar auf den 28. und trägt den Anker ein", () => {
    const ergebnis = ankerKappung("MONTHLY", 1, "2026-01-31", { FREQ: "MONTHLY" });
    expect(ergebnis.naechsterStart).toBe("2026-02-28");
    expect(ergebnis.neueParameter).toEqual({ FREQ: "MONTHLY", "X-ANCHORDAY": "31" });
  });

  it("springt mit vorhandenem Anker im März wieder auf den 31.", () => {
    const ergebnis = ankerKappung("MONTHLY", 1, "2026-02-28", { FREQ: "MONTHLY", "X-ANCHORDAY": "31" });
    expect(ergebnis.naechsterStart).toBe("2026-03-31");
    expect(ergebnis.neueParameter).toBeUndefined(); // nichts Neues einzutragen
  });

  it("kappt auch im April auf den 30.", () => {
    const ergebnis = ankerKappung("MONTHLY", 1, "2026-03-31", { FREQ: "MONTHLY", "X-ANCHORDAY": "31" });
    expect(ergebnis.naechsterStart).toBe("2026-04-30");
  });

  it("rechnet mit Intervall über das Jahresende", () => {
    const ergebnis = ankerKappung("MONTHLY", 3, "2026-11-15", { FREQ: "MONTHLY", INTERVAL: "3" });
    expect(ergebnis.naechsterStart).toBe("2027-02-15");
  });

  it("beachtet den Schaltjahr-Februar", () => {
    const ergebnis = ankerKappung("MONTHLY", 1, "2028-01-31", { FREQ: "MONTHLY", "X-ANCHORDAY": "31" });
    expect(ergebnis.naechsterStart).toBe("2028-02-29");
  });
});

describe("ankerKappung jährlich", () => {
  it("fällt vom 29.02.2028 im Folgejahr auf den 28.02. und trägt beide Anker ein", () => {
    const ergebnis = ankerKappung("YEARLY", 1, "2028-02-29", { FREQ: "YEARLY" });
    expect(ergebnis.naechsterStart).toBe("2029-02-28");
    expect(ergebnis.neueParameter).toEqual({ FREQ: "YEARLY", "X-ANCHORMONTH": "2", "X-ANCHORDAY": "29" });
  });

  it("springt im nächsten Schaltjahr wieder auf den 29.02.", () => {
    const parameter = { FREQ: "YEARLY", "X-ANCHORMONTH": "2", "X-ANCHORDAY": "29" };
    expect(ankerKappung("YEARLY", 1, "2031-02-28", parameter).naechsterStart).toBe("2032-02-29");
  });
});
