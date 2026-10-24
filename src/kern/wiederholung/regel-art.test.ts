import { describe, expect, it } from "vitest";
import { ankerKappungsHaeufigkeit } from "./regel-art";

describe("ankerKappungsHaeufigkeit", () => {
  it("gilt für monatlich und jährlich ohne Tagesangabe", () => {
    expect(ankerKappungsHaeufigkeit({ FREQ: "MONTHLY" })).toBe("MONTHLY");
    expect(ankerKappungsHaeufigkeit({ FREQ: "YEARLY", INTERVAL: "2" })).toBe("YEARLY");
  });

  it("gilt nicht mit BYDAY oder BYMONTHDAY", () => {
    expect(ankerKappungsHaeufigkeit({ FREQ: "MONTHLY", BYDAY: "MO" })).toBeNull();
    expect(ankerKappungsHaeufigkeit({ FREQ: "MONTHLY", BYMONTHDAY: "31" })).toBeNull();
  });

  it("gilt nicht für täglich und wöchentlich", () => {
    expect(ankerKappungsHaeufigkeit({ FREQ: "DAILY" })).toBeNull();
    expect(ankerKappungsHaeufigkeit({ FREQ: "WEEKLY" })).toBeNull();
  });
});
