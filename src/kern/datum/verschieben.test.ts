import { describe, expect, it } from "vitest";
import { endeUhrzeitSetzen, startUhrzeitSetzen, zeitraumVerschieben } from "./verschieben";

describe("zeitraumVerschieben", () => {
  it("behält Uhrzeit und Dauer beim Verschieben auf ein anderes Datum", () => {
    expect(zeitraumVerschieben({ start: "2026-07-20T09:00", ende: "2026-07-20T10:30" }, "2026-07-22")).toEqual({
      start: "2026-07-22T09:00",
      ende: "2026-07-22T10:30",
    });
  });

  it("nimmt die neue Uhrzeit und erhält die Dauer", () => {
    expect(zeitraumVerschieben({ start: "2026-07-20T09:00", ende: "2026-07-20T10:30" }, "2026-07-22", "14:00")).toEqual({
      start: "2026-07-22T14:00",
      ende: "2026-07-22T15:30",
    });
  });

  it("verschiebt ganztägige, mehrtägige Einträge um dieselben Tage", () => {
    expect(zeitraumVerschieben({ start: "2026-07-20", ende: "2026-07-22" }, "2026-08-01")).toEqual({
      start: "2026-08-01",
      ende: "2026-08-03",
    });
  });

  it("erfindet kein Ende", () => {
    expect(zeitraumVerschieben({ start: "2026-07-20" }, "2026-07-21")).toEqual({ start: "2026-07-21", ende: undefined });
  });

  it("kann einen ganztägigen Eintrag ins Zeitraster ziehen", () => {
    expect(zeitraumVerschieben({ start: "2026-07-20" }, "2026-07-20", "10:00").start).toBe("2026-07-20T10:00");
  });
});

describe("endeUhrzeitSetzen / startUhrzeitSetzen", () => {
  it("setzt das Ende am Starttag", () => {
    expect(endeUhrzeitSetzen({ start: "2026-07-20T09:00", ende: "2026-07-20T10:00" }, "11:30").ende).toBe(
      "2026-07-20T11:30"
    );
  });

  it("setzt den Start am Starttag und lässt das Ende", () => {
    expect(startUhrzeitSetzen({ start: "2026-07-20T09:00", ende: "2026-07-20T10:00" }, "08:15")).toEqual({
      start: "2026-07-20T08:15",
      ende: "2026-07-20T10:00",
    });
  });
});
