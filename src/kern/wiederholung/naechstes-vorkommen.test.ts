import { describe, expect, it } from "vitest";
import { naechstesVorkommen } from "./naechstes-vorkommen";

describe("naechstesVorkommen: normale Regeln", () => {
  it("rechnet täglich", () => {
    expect(naechstesVorkommen("FREQ=DAILY", "2026-07-20")).toEqual({
      naechsterStart: "2026-07-21",
      aktualisierteRrule: undefined,
    });
  });

  it("rechnet wöchentlich mit mehreren Wochentagen", () => {
    expect(naechstesVorkommen("FREQ=WEEKLY;BYDAY=MO,WE", "2026-07-20")?.naechsterStart).toBe("2026-07-22");
    expect(naechstesVorkommen("FREQ=WEEKLY;BYDAY=MO,WE", "2026-07-22")?.naechsterStart).toBe("2026-07-27");
  });

  it("beachtet das Intervall", () => {
    expect(naechstesVorkommen("FREQ=WEEKLY;INTERVAL=2", "2026-07-20")?.naechsterStart).toBe("2026-08-03");
  });

  it("rechnet monatlich mit Wochentag (jeder Montag im Monat)", () => {
    expect(naechstesVorkommen("FREQ=MONTHLY;BYDAY=MO", "2026-07-20")?.naechsterStart).toBe("2026-07-27");
  });

  it("ignoriert eine Uhrzeit im geplanten Start", () => {
    expect(naechstesVorkommen("FREQ=DAILY", "2026-07-20T09:00")?.naechsterStart).toBe("2026-07-21");
  });
});

describe("naechstesVorkommen: Aufräumen der rrule", () => {
  it("übersetzt deutsche Wochentage und meldet den neuen Text", () => {
    const ergebnis = naechstesVorkommen("FREQ=WEEKLY;BYDAY=MO,MI", "2026-07-20");
    expect(ergebnis?.naechsterStart).toBe("2026-07-22");
    expect(ergebnis?.aktualisierteRrule).toBe("FREQ=WEEKLY;BYDAY=MO,WE");
  });

  it("entfernt ein RRULE:-Präfix und meldet den neuen Text", () => {
    const ergebnis = naechstesVorkommen("RRULE:FREQ=DAILY", "2026-07-20");
    expect(ergebnis?.naechsterStart).toBe("2026-07-21");
    expect(ergebnis?.aktualisierteRrule).toBe("FREQ=DAILY");
  });

  it("lässt sich von internen X-Zusätzen nicht stören", () => {
    expect(naechstesVorkommen("FREQ=MONTHLY;BYDAY=MO;X-ANCHORDAY=31", "2026-07-20")?.naechsterStart).toBe(
      "2026-07-27"
    );
  });
});

describe("naechstesVorkommen: Monatsende (Anker-Kappung)", () => {
  it("fällt vom 31.01. auf den 28.02. und trägt den Anker ein", () => {
    expect(naechstesVorkommen("FREQ=MONTHLY", "2026-01-31")).toEqual({
      naechsterStart: "2026-02-28",
      aktualisierteRrule: "FREQ=MONTHLY;X-ANCHORDAY=31",
    });
  });

  it("springt mit Anker im März wieder auf den 31. (ohne neue rrule)", () => {
    expect(naechstesVorkommen("FREQ=MONTHLY;X-ANCHORDAY=31", "2026-02-28")).toEqual({
      naechsterStart: "2026-03-31",
      aktualisierteRrule: undefined,
    });
  });

  it("rechnet jährlich über das Schaltjahr", () => {
    expect(naechstesVorkommen("FREQ=YEARLY", "2028-02-29")).toEqual({
      naechsterStart: "2029-02-28",
      aktualisierteRrule: "FREQ=YEARLY;X-ANCHORMONTH=2;X-ANCHORDAY=29",
    });
  });

  it("überspringt mit BYMONTHDAY=31 die Monate ohne 31. (strenge Regel)", () => {
    expect(naechstesVorkommen("FREQ=MONTHLY;BYMONTHDAY=31", "2026-01-31")?.naechsterStart).toBe("2026-03-31");
  });
});

describe("naechstesVorkommen: Serienende", () => {
  it("endet mit UNTIL bei der Bibliothek", () => {
    const regel = "FREQ=WEEKLY;UNTIL=20260727";
    expect(naechstesVorkommen(regel, "2026-07-20")?.naechsterStart).toBe("2026-07-27");
    expect(naechstesVorkommen(regel, "2026-07-27")).toBeNull();
  });

  it("endet mit UNTIL auch bei der Anker-Kappung (früher ignoriert)", () => {
    const regel = "FREQ=MONTHLY;UNTIL=20260228";
    expect(naechstesVorkommen(regel, "2026-01-31")?.naechsterStart).toBe("2026-02-28");
    expect(naechstesVorkommen("FREQ=MONTHLY;UNTIL=20260228;X-ANCHORDAY=31", "2026-02-28")).toBeNull();
  });

  it("ignoriert COUNT (das zählt die Serien-Logik)", () => {
    expect(naechstesVorkommen("FREQ=WEEKLY;COUNT=2", "2026-07-20")?.naechsterStart).toBe("2026-07-27");
    expect(naechstesVorkommen("FREQ=WEEKLY;COUNT=2", "2026-07-27")?.naechsterStart).toBe("2026-08-03");
  });

  it("liefert null bei einer ungültigen Regel", () => {
    expect(naechstesVorkommen("FREQ=UNSINN", "2026-07-20")).toBeNull();
    expect(naechstesVorkommen("", "2026-07-20")).toBeNull();
  });
});
