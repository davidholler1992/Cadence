import { describe, expect, it } from "vitest";
import { kennzeichenSetzenPatch, notizVerarbeitenPatch } from "./notiz-verarbeiten";
import type { NotizHilfen } from "./notiz-verarbeiten";

const HEUTE = "2026-07-20";

function hilfen(anderswo: string[] = []): NotizHilfen {
  let zaehler = 0;
  return { neueUid: () => `u${++zaehler}`, uidAnderswoVergeben: (uid) => anderswo.includes(uid) };
}
const verarbeite = (frontmatter: Record<string, unknown>, anderswo: string[] = []) =>
  notizVerarbeitenPatch(frontmatter, HEUTE, hilfen(anderswo));

describe("notizVerarbeitenPatch: UID", () => {
  it("vergibt eine UID, wenn sie fehlt oder leer ist", () => {
    expect(verarbeite({ type: "todo" })).toEqual({ uid: "u1" });
    expect(verarbeite({ type: "termin", uid: "" })).toEqual({ uid: "u1" });
  });

  it("vergibt eine neue UID, wenn sie bei einer anderen Notiz schon steht", () => {
    expect(verarbeite({ type: "todo", uid: "x1" }, ["x1"])).toEqual({ uid: "u1" });
  });

  it("lässt eine vorhandene, einmalige UID in Ruhe", () => {
    expect(verarbeite({ type: "todo", uid: "x1", done: false })).toBeNull();
  });

  it("ignoriert Notizen, die keine Aufgabe/kein Termin sind (keine UID dort)", () => {
    expect(verarbeite({ title: "Irgendeine Notiz" })).toBeNull();
    expect(verarbeite({ type: "projekt" })).toBeNull();
  });
});

describe("notizVerarbeitenPatch: einmalige Einträge", () => {
  it("trägt bei done: true das Datum in completed ein", () => {
    expect(verarbeite({ type: "todo", uid: "a", done: true })).toEqual({ completed: [HEUTE] });
  });

  it("macht nichts mehr, wenn das Datum schon da ist", () => {
    expect(verarbeite({ type: "todo", uid: "a", done: true, completed: ["2026-07-18"] })).toBeNull();
  });

  it("entfernt das Datum, wenn der Haken weggenommen wurde", () => {
    expect(verarbeite({ type: "todo", uid: "a", done: false, completed: ["2026-07-18"] })).toEqual({ completed: [] });
  });

  it("lässt ein einmaliges, übersprungenes Todo übersprungen (done bleibt false)", () => {
    expect(verarbeite({ type: "todo", uid: "a", done: false, skipped: ["2026-07-18"] })).toBeNull();
  });
});

describe("notizVerarbeitenPatch: Serien", () => {
  const serie = { type: "termin", uid: "a", start: "2026-07-20T09:00", end: "2026-07-20T10:30", rrule: "FREQ=WEEKLY;BYDAY=MO" };

  it("springt bei done: true weiter und setzt done zurück", () => {
    expect(verarbeite({ ...serie, done: true })).toEqual({
      start: "2026-07-27T09:00",
      end: "2026-07-27T10:30",
      anchorStart: "2026-07-20T09:00",
      completed: [HEUTE],
      done: false,
    });
  });

  it("tut bei einer offenen Serie nichts", () => {
    expect(verarbeite({ ...serie, done: false })).toBeNull();
  });

  it("ändert am Monatsende die rrule (Anker) und das Datum", () => {
    const patch = verarbeite({ type: "todo", uid: "a", start: "2026-01-31", rrule: "FREQ=MONTHLY", done: true });
    expect(patch?.start).toBe("2026-02-28");
    expect(patch?.rrule).toBe("FREQ=MONTHLY;X-ANCHORDAY=31");
  });

  it("verarbeitet eine abgeschlossene COUNT-Serie nicht noch einmal", () => {
    const fertig = { type: "todo", uid: "a", start: "2026-07-20", rrule: "FREQ=DAILY;COUNT=1", done: true, completed: [HEUTE] };
    expect(verarbeite(fertig)).toBeNull();
  });

  it("verschiebt UID und Haken zusammen in einem Patch", () => {
    const patch = verarbeite({ type: "todo", start: "2026-07-20", rrule: "FREQ=DAILY", done: true });
    expect(patch?.uid).toBe("u1");
    expect(patch?.start).toBe("2026-07-21");
    expect(patch?.done).toBe(false);
  });
});

describe("kennzeichenSetzenPatch (Aktionen)", () => {
  it("überspringt eine Serie: sie springt weiter, done bleibt false", () => {
    const patch = kennzeichenSetzenPatch(
      { type: "todo", uid: "a", start: "2026-07-20", rrule: "FREQ=WEEKLY", done: false },
      "uebersprungen",
      HEUTE
    );
    expect(patch).toEqual({ start: "2026-07-27", anchorStart: "2026-07-20", skipped: [HEUTE] });
  });

  it("überspringt ein einmaliges Todo: skipped bekommt das Datum", () => {
    expect(kennzeichenSetzenPatch({ type: "todo", uid: "a", done: false }, "uebersprungen", HEUTE)).toEqual({
      skipped: [HEUTE],
    });
  });

  it("wechselt von erledigt zu übersprungen und räumt auf", () => {
    const patch = kennzeichenSetzenPatch({ type: "todo", uid: "a", done: true, completed: ["2026-07-18"] }, "uebersprungen", HEUTE);
    expect(patch).toEqual({ completed: [], skipped: [HEUTE], done: false });
  });

  it("öffnet ein übersprungenes einmaliges Todo wieder", () => {
    const patch = kennzeichenSetzenPatch({ type: "todo", uid: "a", done: false, skipped: ["2026-07-18"] }, "offen", HEUTE);
    expect(patch).toEqual({ skipped: [] });
  });

  it("liefert null bei Notizen, die keine Aufgabe sind", () => {
    expect(kennzeichenSetzenPatch({ title: "x" }, "erledigt", HEUTE)).toBeNull();
  });
});
