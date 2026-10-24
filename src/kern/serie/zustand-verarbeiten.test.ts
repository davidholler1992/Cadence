import { describe, expect, it } from "vitest";
import { zustandVerarbeiten } from "./zustand-verarbeiten";
import type { SerienZustand } from "./serie-weiterschalten";

const zustand = (teile: Partial<SerienZustand>): SerienZustand => ({ erledigt: [], uebersprungen: [], ...teile });
const HEUTE = "2026-07-20";

describe("zustandVerarbeiten: einmalige Einträge", () => {
  it("trägt bei erledigt das heutige Datum ein", () => {
    const ergebnis = zustandVerarbeiten(zustand({ start: "2026-07-20" }), "erledigt", HEUTE);
    expect(ergebnis.zustand.erledigt).toEqual([HEUTE]);
    expect(ergebnis.kennzeichen).toBe("erledigt");
    expect(ergebnis.geaendert).toBe(true);
  });

  it("ändert bei erneutem Durchlauf nichts mehr", () => {
    const erst = zustandVerarbeiten(zustand({}), "erledigt", HEUTE);
    const nochmal = zustandVerarbeiten(erst.zustand, "erledigt", "2026-07-25"); // anderer Tag
    expect(nochmal.geaendert).toBe(false);
    expect(nochmal.zustand.erledigt).toEqual([HEUTE]); // das alte Datum bleibt
  });

  it("trägt bei übersprungen in die andere Liste ein", () => {
    const ergebnis = zustandVerarbeiten(zustand({}), "uebersprungen", HEUTE);
    expect(ergebnis.zustand.uebersprungen).toEqual([HEUTE]);
    expect(ergebnis.zustand.erledigt).toEqual([]);
  });

  it("entfernt den Eintrag, wenn der Haken wieder weggenommen wird", () => {
    const ergebnis = zustandVerarbeiten(zustand({ erledigt: ["2026-07-18"] }), "offen", HEUTE);
    expect(ergebnis.zustand.erledigt).toEqual([]);
    expect(ergebnis.geaendert).toBe(true);
  });

  it("lässt ein offenes Element ohne Historie unverändert", () => {
    expect(zustandVerarbeiten(zustand({}), "offen", HEUTE).geaendert).toBe(false);
  });

  it("räumt beim Wechsel von erledigt zu übersprungen die alte Liste auf", () => {
    const ergebnis = zustandVerarbeiten(zustand({ erledigt: ["2026-07-18"] }), "uebersprungen", HEUTE);
    expect(ergebnis.zustand.uebersprungen).toEqual([HEUTE]);
    expect(ergebnis.zustand.erledigt).toEqual([]);
  });

  it("lässt längere Listen (ältere Historie) unangetastet", () => {
    const alt = zustand({ erledigt: ["2026-07-01", "2026-07-02", "2026-07-03"] });
    expect(zustandVerarbeiten(alt, "offen", HEUTE).geaendert).toBe(false);
    expect(zustandVerarbeiten(alt, "erledigt", HEUTE).geaendert).toBe(false);
  });
});

describe("zustandVerarbeiten: Serien", () => {
  const woechentlich = zustand({ start: "2026-07-20T09:00", ende: "2026-07-20T10:30", rrule: "FREQ=WEEKLY;BYDAY=MO" });

  it("springt bei erledigt zum nächsten Vorkommen und ist wieder offen", () => {
    const ergebnis = zustandVerarbeiten(woechentlich, "erledigt", HEUTE);
    expect(ergebnis.kennzeichen).toBe("offen");
    expect(ergebnis.geaendert).toBe(true);
    expect(ergebnis.zustand.start).toBe("2026-07-27T09:00");
    expect(ergebnis.zustand.ende).toBe("2026-07-27T10:30");
    expect(ergebnis.zustand.erledigt).toEqual([HEUTE]);
  });

  it("springt auch bei übersprungen", () => {
    const ergebnis = zustandVerarbeiten(woechentlich, "uebersprungen", HEUTE);
    expect(ergebnis.kennzeichen).toBe("offen");
    expect(ergebnis.zustand.uebersprungen).toEqual([HEUTE]);
  });

  it("tut bei offenen Serien nichts", () => {
    const mitHistorie = zustand({ start: "2026-07-27", rrule: "FREQ=WEEKLY", erledigt: ["2026-07-20"] });
    expect(zustandVerarbeiten(mitHistorie, "offen", HEUTE).geaendert).toBe(false);
  });

  it("endet bei COUNT, bleibt abgehakt und wird danach nicht noch einmal verarbeitet", () => {
    let aktuell = zustand({ start: "2026-07-20", rrule: "FREQ=WEEKLY;COUNT=2" });

    const erstes = zustandVerarbeiten(aktuell, "erledigt", "2026-07-20");
    expect(erstes.kennzeichen).toBe("offen");
    aktuell = erstes.zustand;

    const letztes = zustandVerarbeiten(aktuell, "erledigt", "2026-07-27");
    expect(letztes.kennzeichen).toBe("erledigt");
    expect(letztes.geaendert).toBe(true);
    expect(letztes.zustand.erledigt).toHaveLength(2);

    // Danach: Haken bleibt, nichts ändert sich mehr (auch an einem anderen Tag).
    const danach = zustandVerarbeiten(letztes.zustand, "erledigt", "2026-08-15");
    expect(danach.geaendert).toBe(false);
  });

  it("endet bei UNTIL und wird danach nicht noch einmal verarbeitet", () => {
    const bisMontag = zustand({ start: "2026-07-20", rrule: "FREQ=WEEKLY;UNTIL=20260727" });
    const erstes = zustandVerarbeiten(bisMontag, "erledigt", "2026-07-20");
    expect(erstes.kennzeichen).toBe("offen");

    const letztes = zustandVerarbeiten(erstes.zustand, "erledigt", "2026-07-27");
    expect(letztes.kennzeichen).toBe("erledigt");
    expect(letztes.geaendert).toBe(true);

    expect(zustandVerarbeiten(letztes.zustand, "erledigt", "2026-08-30").geaendert).toBe(false);
  });

  it("behandelt eine unbrauchbare Regel wie einen einmaligen Eintrag (kein Endlos-Eintragen)", () => {
    const kaputt = zustand({ start: "2026-07-20", rrule: "FREQ=UNSINN" });
    const erst = zustandVerarbeiten(kaputt, "erledigt", HEUTE);
    expect(erst.zustand.erledigt).toEqual([HEUTE]);
    expect(erst.zustand.start).toBe("2026-07-20");
    expect(zustandVerarbeiten(erst.zustand, "erledigt", "2026-07-30").geaendert).toBe(false);
  });

  it("behandelt eine Wiederholung ohne Start wie einen einmaligen Eintrag", () => {
    const ohneStart = zustand({ rrule: "FREQ=DAILY" });
    const erst = zustandVerarbeiten(ohneStart, "erledigt", HEUTE);
    expect(erst.zustand.erledigt).toEqual([HEUTE]);
    expect(zustandVerarbeiten(erst.zustand, "erledigt", "2026-07-30").geaendert).toBe(false);
  });
});
