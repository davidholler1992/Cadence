import { describe, expect, it } from "vitest";
import { SerienZustand, serieWeiterschalten } from "./serie-weiterschalten";

/** Hilfe für die Tests: ein Zustand mit leerer Historie, einzelne Felder überschreibbar. */
function zustand(teile: Partial<SerienZustand>): SerienZustand {
  return { erledigt: [], uebersprungen: [], ...teile };
}

describe("serieWeiterschalten: ohne Wiederholung", () => {
  it("trägt das heutige Datum bei 'erledigt' ein und springt nicht", () => {
    const ergebnis = serieWeiterschalten(zustand({ start: "2026-07-20" }), "erledigt", "2026-07-20");
    expect(ergebnis.zustand.erledigt).toEqual(["2026-07-20"]);
    expect(ergebnis.zustand.start).toBe("2026-07-20");
    expect(ergebnis.gesprungen).toBe(false);
    expect(ergebnis.serieBeendet).toBe(false);
  });

  it("trägt bei 'uebersprungen' in die andere Liste ein", () => {
    const ergebnis = serieWeiterschalten(zustand({ start: "2026-07-20" }), "uebersprungen", "2026-07-20");
    expect(ergebnis.zustand.uebersprungen).toEqual(["2026-07-20"]);
    expect(ergebnis.zustand.erledigt).toEqual([]);
  });

  it("schreibt dasselbe Datum nicht doppelt", () => {
    const erstes = serieWeiterschalten(zustand({}), "erledigt", "2026-07-20");
    const zweites = serieWeiterschalten(erstes.zustand, "erledigt", "2026-07-20");
    expect(zweites.zustand.erledigt).toEqual(["2026-07-20"]);
  });

  it("verändert den übergebenen Zustand nicht", () => {
    const vorher = zustand({ erledigt: ["2026-07-01"] });
    serieWeiterschalten(vorher, "erledigt", "2026-07-20");
    expect(vorher.erledigt).toEqual(["2026-07-01"]);
  });
});

describe("serieWeiterschalten: mit Wiederholung", () => {
  const woechentlich = zustand({
    start: "2026-07-20T09:00",
    ende: "2026-07-20T10:30",
    rrule: "FREQ=WEEKLY;BYDAY=MO",
  });

  it("springt zum nächsten Vorkommen, erhält Uhrzeit und Dauer", () => {
    const ergebnis = serieWeiterschalten(woechentlich, "erledigt", "2026-07-20");
    expect(ergebnis.gesprungen).toBe(true);
    expect(ergebnis.zustand.start).toBe("2026-07-27T09:00");
    expect(ergebnis.zustand.ende).toBe("2026-07-27T10:30");
    expect(ergebnis.zustand.erledigt).toEqual(["2026-07-20"]);
  });

  it("merkt sich beim ersten Sprung den ankerStart und ändert ihn danach nie mehr", () => {
    const erster = serieWeiterschalten(woechentlich, "erledigt", "2026-07-20");
    expect(erster.zustand.ankerStart).toBe("2026-07-20T09:00");

    const zweiter = serieWeiterschalten(erster.zustand, "erledigt", "2026-07-27");
    expect(zweiter.zustand.start).toBe("2026-08-03T09:00");
    expect(zweiter.zustand.ankerStart).toBe("2026-07-20T09:00");
  });

  it("springt auch beim Überspringen", () => {
    const ergebnis = serieWeiterschalten(woechentlich, "uebersprungen", "2026-07-20");
    expect(ergebnis.gesprungen).toBe(true);
    expect(ergebnis.zustand.uebersprungen).toEqual(["2026-07-20"]);
    expect(ergebnis.zustand.erledigt).toEqual([]);
  });

  it("springt bei überfälligen Serien nur ein Vorkommen weiter (bewusst)", () => {
    const taeglich = zustand({ start: "2026-07-10", rrule: "FREQ=DAILY" });
    const erster = serieWeiterschalten(taeglich, "erledigt", "2026-07-20");
    expect(erster.zustand.start).toBe("2026-07-11");
    const zweiter = serieWeiterschalten(erster.zustand, "erledigt", "2026-07-20");
    expect(zweiter.zustand.start).toBe("2026-07-12");
    // Am selben Tag zweimal abgehakt: beide Einträge bleiben in der Historie.
    expect(zweiter.zustand.erledigt).toEqual(["2026-07-20", "2026-07-20"]);
  });

  it("verschiebt mehrtägige ganztägige Termine komplett", () => {
    const mehrtaegig = zustand({ start: "2026-07-20", ende: "2026-07-22", rrule: "FREQ=WEEKLY" });
    const ergebnis = serieWeiterschalten(mehrtaegig, "erledigt", "2026-07-20");
    expect(ergebnis.zustand.start).toBe("2026-07-27");
    expect(ergebnis.zustand.ende).toBe("2026-07-29");
  });

  it("speichert die rrule bereinigt (ohne Präfix, englische Wochentage)", () => {
    const alt = zustand({ start: "2026-07-20", rrule: "RRULE:FREQ=WEEKLY;BYDAY=MO,MI" });
    const ergebnis = serieWeiterschalten(alt, "erledigt", "2026-07-20");
    expect(ergebnis.zustand.rrule).toBe("FREQ=WEEKLY;BYDAY=MO,WE");
  });

  it("trägt am Monatsende den Anker ein und bleibt beim Wunsch-Tag", () => {
    const monatlich = zustand({ start: "2026-01-31", rrule: "FREQ=MONTHLY" });
    const februar = serieWeiterschalten(monatlich, "erledigt", "2026-01-31");
    expect(februar.zustand.start).toBe("2026-02-28");
    expect(februar.zustand.rrule).toBe("FREQ=MONTHLY;X-ANCHORDAY=31");

    const maerz = serieWeiterschalten(februar.zustand, "erledigt", "2026-02-28");
    expect(maerz.zustand.start).toBe("2026-03-31");
  });
});

describe("serieWeiterschalten: Serienende", () => {
  it("endet bei COUNT genau nach der angegebenen Anzahl und lässt COUNT unverändert", () => {
    let aktuell = zustand({ start: "2026-07-20", rrule: "FREQ=WEEKLY;COUNT=3" });

    const erstes = serieWeiterschalten(aktuell, "erledigt", "2026-07-20");
    expect(erstes.gesprungen).toBe(true);
    expect(erstes.zustand.rrule).toBe("FREQ=WEEKLY;COUNT=3");
    aktuell = erstes.zustand;

    const zweites = serieWeiterschalten(aktuell, "erledigt", "2026-07-27");
    expect(zweites.gesprungen).toBe(true);
    aktuell = zweites.zustand;

    const drittes = serieWeiterschalten(aktuell, "erledigt", "2026-08-03");
    expect(drittes.gesprungen).toBe(false);
    expect(drittes.serieBeendet).toBe(true);
    expect(drittes.zustand.start).toBe("2026-08-03"); // bleibt auf dem letzten Vorkommen
    expect(drittes.zustand.erledigt).toHaveLength(3);
  });

  it("zählt bei COUNT erledigte und übersprungene zusammen", () => {
    const fast = zustand({
      start: "2026-08-03",
      rrule: "FREQ=WEEKLY;COUNT=3",
      erledigt: ["2026-07-20"],
      uebersprungen: ["2026-07-27"],
    });
    const ergebnis = serieWeiterschalten(fast, "erledigt", "2026-08-03");
    expect(ergebnis.serieBeendet).toBe(true);
  });

  it("endet bei UNTIL", () => {
    const bisMontag = zustand({ start: "2026-07-20", rrule: "FREQ=WEEKLY;UNTIL=20260727" });
    const erstes = serieWeiterschalten(bisMontag, "erledigt", "2026-07-20");
    expect(erstes.zustand.start).toBe("2026-07-27");

    const zweites = serieWeiterschalten(erstes.zustand, "erledigt", "2026-07-27");
    expect(zweites.serieBeendet).toBe(true);
    expect(zweites.gesprungen).toBe(false);
  });

  it("endet bei UNTIL auch bei Monatsende-Regeln (früher ignoriert)", () => {
    const monatlich = zustand({ start: "2026-02-28", rrule: "FREQ=MONTHLY;UNTIL=20260228;X-ANCHORDAY=31" });
    const ergebnis = serieWeiterschalten(monatlich, "erledigt", "2026-02-28");
    expect(ergebnis.serieBeendet).toBe(true);
  });
});
