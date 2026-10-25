import { describe, expect, it } from "vitest";
import { endeSetzenPatch, startSetzenPatch, verschiebenPatch } from "./notiz-verschieben";

describe("verschiebenPatch", () => {
  it("verschiebt Start und Ende, Uhrzeit und Dauer bleiben", () => {
    const patch = verschiebenPatch({ type: "termin", start: "2026-07-20T09:00", end: "2026-07-20T10:30" }, "2026-07-22");
    expect(patch).toEqual({ start: "2026-07-22T09:00", end: "2026-07-22T10:30", allday: false });
  });

  it("nimmt die neue Uhrzeit aus dem Zeitraster", () => {
    const patch = verschiebenPatch({ type: "termin", start: "2026-07-20T09:00", end: "2026-07-20T10:00" }, "2026-07-20", "14:00");
    expect(patch).toEqual({ start: "2026-07-20T14:00", end: "2026-07-20T15:00", allday: false });
  });

  it("hält allday passend: ein Zeitraster-Termin wird ganztägig, wenn er ohne Uhrzeit landet, und umgekehrt", () => {
    expect(verschiebenPatch({ type: "todo", start: "2026-07-20" }, "2026-07-21")).toEqual({ start: "2026-07-21", allday: true });
    expect(verschiebenPatch({ type: "todo", start: "2026-07-20", allday: true }, "2026-07-20", "10:00")).toEqual({
      start: "2026-07-20T10:00",
      allday: false,
    });
  });

  it("lässt ein fehlendes Ende fehlen", () => {
    expect(verschiebenPatch({ type: "todo", start: "2026-07-20" }, "2026-07-21")).not.toHaveProperty("end");
  });

  it("liefert null ohne Start oder bei fremden Notizen", () => {
    expect(verschiebenPatch({ type: "todo" }, "2026-07-21")).toBeNull();
    expect(verschiebenPatch({ title: "x" }, "2026-07-21")).toBeNull();
  });
});

describe("endeSetzenPatch / startSetzenPatch", () => {
  const termin = { type: "termin", start: "2026-07-20T09:00", end: "2026-07-20T10:00" };

  it("ändert nur das Ende", () => {
    expect(endeSetzenPatch(termin, "11:30")).toEqual({ end: "2026-07-20T11:30" });
  });

  it("ändert nur den Start", () => {
    expect(startSetzenPatch(termin, "08:15")).toEqual({ start: "2026-07-20T08:15", allday: false });
  });
});
