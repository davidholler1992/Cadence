import { describe, expect, it } from "vitest";
import { minutenAlsUhrzeit, minutenSeitMitternacht, uhrzeitUebernehmen } from "./uhrzeit";

describe("uhrzeitUebernehmen", () => {
  it("setzt die alte Uhrzeit auf das neue Datum", () => {
    expect(uhrzeitUebernehmen("2026-08-08", "2026-07-08T09:00")).toBe("2026-08-08T09:00");
  });

  it("liefert nur das Datum, wenn der alte Text ganztägig war", () => {
    expect(uhrzeitUebernehmen("2026-08-08", "2026-07-08")).toBe("2026-08-08");
  });
});

describe("minutenSeitMitternacht", () => {
  it("rechnet die Uhrzeit in Minuten um", () => {
    expect(minutenSeitMitternacht("2026-07-20T09:30")).toBe(570);
    expect(minutenSeitMitternacht("2026-07-20T00:00")).toBe(0);
    expect(minutenSeitMitternacht("2026-07-20T23:45")).toBe(1425);
  });

  it("liefert 0, wenn keine Uhrzeit dabei ist", () => {
    expect(minutenSeitMitternacht("2026-07-20")).toBe(0);
  });
});

describe("minutenAlsUhrzeit", () => {
  it("formatiert Minuten als HH:MM mit führenden Nullen", () => {
    expect(minutenAlsUhrzeit(570)).toBe("09:30");
    expect(minutenAlsUhrzeit(0)).toBe("00:00");
    expect(minutenAlsUhrzeit(1425)).toBe("23:45");
  });
});