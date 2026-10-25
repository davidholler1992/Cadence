import { describe, expect, it } from "vitest";
import type { Frontmatter } from "./notiz-typen";
import { NotizQuelle } from "./notiz-quelle";
import type { NotizZugriff } from "./notiz-quelle";

/** Ersatz für den Vault: Frontmatter liegt in einer Map, Schreibvorgänge werden gezählt. */
class TestNotizen implements NotizZugriff {
  schreibvorgaenge = 0;
  constructor(public notizen: Map<string, Frontmatter>) {}
  notizDateien() {
    return [...this.notizen.keys()];
  }
  leseFrontmatter(pfad: string) {
    return this.notizen.get(pfad);
  }
  async aendereFrontmatter(pfad: string, aendern: (frontmatter: Frontmatter) => void) {
    const frontmatter = this.notizen.get(pfad);
    if (!frontmatter) throw new Error("nicht gefunden");
    aendern(frontmatter);
    this.schreibvorgaenge++;
  }
}

function aufbau(notizen: Record<string, Frontmatter>) {
  const zugriff = new TestNotizen(new Map(Object.entries(notizen)));
  let zaehler = 0;
  const quelle = new NotizQuelle(zugriff, { heute: () => "2026-07-20", neueUid: () => `u${++zaehler}` });
  return { zugriff, quelle };
}

describe("NotizQuelle: automatische Verarbeitung", () => {
  it("vergibt eine UID und schreibt beim zweiten Durchlauf nicht mehr", async () => {
    const { zugriff, quelle } = aufbau({ "a.md": { type: "todo", uid: "", done: false } });
    expect(await quelle.verarbeiteDatei("a.md")).toBe(true);
    expect(zugriff.notizen.get("a.md")?.uid).toBe("u1");
    expect(await quelle.verarbeiteDatei("a.md")).toBe(false);
    expect(zugriff.schreibvorgaenge).toBe(1);
  });

  it("fasst Notizen, die keine Aufgabe/kein Termin sind, nicht an", async () => {
    const { zugriff, quelle } = aufbau({ "a.md": { title: "Irgendeine Notiz" }, "b.md": { type: "projekt" } });
    expect(await quelle.verarbeiteDatei("a.md")).toBe(false);
    expect(await quelle.verarbeiteDatei("b.md")).toBe(false);
    expect(zugriff.schreibvorgaenge).toBe(0);
    expect(zugriff.notizen.get("a.md")).toEqual({ title: "Irgendeine Notiz" });
  });

  it("setzt den Haken bei einer Serie um und verarbeitet ihn nur einmal", async () => {
    const { zugriff, quelle } = aufbau({
      "a.md": { type: "todo", uid: "x1", done: true, start: "2026-07-20", rrule: "FREQ=DAILY", completed: [] },
    });
    await quelle.verarbeiteDatei("a.md");
    expect(zugriff.notizen.get("a.md")).toMatchObject({
      done: false,
      start: "2026-07-21",
      anchorStart: "2026-07-20",
      completed: ["2026-07-20"],
    });
    expect(await quelle.verarbeiteDatei("a.md")).toBe(false);
  });

  it("trägt bei einer einmaligen Aufgabe das Datum ein und nimmt es beim Wieder-Öffnen zurück", async () => {
    const { zugriff, quelle } = aufbau({ "a.md": { type: "todo", uid: "x1", done: true } });
    await quelle.verarbeiteDatei("a.md");
    expect(zugriff.notizen.get("a.md")?.completed).toEqual(["2026-07-20"]);

    zugriff.notizen.get("a.md")!.done = false;
    await quelle.verarbeiteDatei("a.md");
    expect(zugriff.notizen.get("a.md")?.completed).toEqual([]);
  });

  it("verarbeitet gleichzeitige Aufrufe für dieselbe Datei nacheinander (nur ein Schreibvorgang)", async () => {
    const { zugriff, quelle } = aufbau({ "a.md": { type: "todo", uid: "" } });
    const ergebnisse = await Promise.all([quelle.verarbeiteDatei("a.md"), quelle.verarbeiteDatei("a.md")]);
    expect(ergebnisse).toEqual([true, false]);
    expect(zugriff.schreibvorgaenge).toBe(1);
  });

  it("verarbeitet alle Notizen und meldet die Zahlen", async () => {
    const { quelle } = aufbau({ "a.md": { type: "todo", uid: "" }, "b.md": { title: "x" }, "c.md": { type: "termin", uid: "" } });
    expect(await quelle.verarbeiteAlle()).toEqual({ dateien: 3, geschrieben: 2 });
  });
});

describe("NotizQuelle: doppelte UIDs", () => {
  it("lässt dem Original die UID und gibt der Kopie eine neue", async () => {
    const { zugriff, quelle } = aufbau({
      "original.md": { type: "todo", uid: "x1" },
      "kopie.md": { type: "todo", uid: "x1" },
    });
    await quelle.verarbeiteAlle();
    expect(zugriff.notizen.get("original.md")?.uid).toBe("x1");
    expect(zugriff.notizen.get("kopie.md")?.uid).toBe("u1");
  });

  it("erkennt eine Kopie, die später entsteht", async () => {
    const { zugriff, quelle } = aufbau({ "original.md": { type: "todo", uid: "x1" } });
    await quelle.verarbeiteAlle();
    zugriff.notizen.set("kopie.md", { type: "todo", uid: "x1" });
    await quelle.verarbeiteDatei("kopie.md");
    expect(zugriff.notizen.get("kopie.md")?.uid).toBe("u1");
  });

  it("folgt einer umbenannten Notiz", async () => {
    const { zugriff, quelle } = aufbau({ "a.md": { type: "todo", uid: "x1" } });
    await quelle.verarbeiteAlle();
    zugriff.notizen.set("a2.md", zugriff.notizen.get("a.md")!);
    zugriff.notizen.delete("a.md");
    quelle.dateiUmbenannt("a.md", "a2.md");
    zugriff.notizen.set("kopie.md", { type: "todo", uid: "x1" });
    await quelle.verarbeiteDatei("kopie.md");
    expect(zugriff.notizen.get("kopie.md")?.uid).toBe("u1");
  });

  it("hält die UID bei einer Notiz, die nicht mehr die alte UID trägt (veralteter Eintrag)", async () => {
    const { zugriff, quelle } = aufbau({ "a.md": { type: "todo", uid: "x1" } });
    await quelle.verarbeiteAlle();
    zugriff.notizen.get("a.md")!.uid = "anders";
    zugriff.notizen.set("b.md", { type: "todo", uid: "x1" });
    await quelle.verarbeiteDatei("b.md");
    expect(zugriff.notizen.get("b.md")?.uid).toBe("x1");
  });
});

describe("NotizQuelle: Aktionen", () => {
  it("überspringt eine Serie: sie springt weiter", async () => {
    const { zugriff, quelle } = aufbau({
      "a.md": { type: "todo", uid: "x1", done: false, start: "2026-07-20", rrule: "FREQ=WEEKLY", skipped: [] },
    });
    expect(await quelle.kennzeichenSetzen("a.md", "uebersprungen")).toBe(true);
    expect(zugriff.notizen.get("a.md")).toMatchObject({ start: "2026-07-27", skipped: ["2026-07-20"], done: false });
  });

  it("überspringt ein einmaliges Todo und öffnet es wieder", async () => {
    const { zugriff, quelle } = aufbau({ "a.md": { type: "todo", uid: "x1", done: false, skipped: [] } });
    await quelle.kennzeichenSetzen("a.md", "uebersprungen");
    expect(zugriff.notizen.get("a.md")?.skipped).toEqual(["2026-07-20"]);
    await quelle.kennzeichenSetzen("a.md", "offen");
    expect(zugriff.notizen.get("a.md")?.skipped).toEqual([]);
  });

  it("meldet false, wenn nichts zu ändern war", async () => {
    const { quelle } = aufbau({ "a.md": { type: "todo", uid: "x1", done: false } });
    expect(await quelle.kennzeichenSetzen("a.md", "offen")).toBe(false);
  });

  it("verschiebt auf ein neues Datum und erhält Uhrzeit und Dauer", async () => {
    const { zugriff, quelle } = aufbau({
      "a.md": { type: "termin", uid: "x1", start: "2026-07-20T09:00", end: "2026-07-20T10:30", allday: false },
    });
    await quelle.verschiebe("a.md", "2026-07-22");
    expect(zugriff.notizen.get("a.md")).toMatchObject({ start: "2026-07-22T09:00", end: "2026-07-22T10:30", allday: false });
  });

  it("ändert nur das Ende bzw. nur den Start", async () => {
    const { zugriff, quelle } = aufbau({
      "a.md": { type: "termin", uid: "x1", start: "2026-07-20T09:00", end: "2026-07-20T10:00" },
    });
    await quelle.setzeEnde("a.md", "11:30");
    expect(zugriff.notizen.get("a.md")?.end).toBe("2026-07-20T11:30");
    await quelle.setzeStart("a.md", "08:00");
    expect(zugriff.notizen.get("a.md")?.start).toBe("2026-07-20T08:00");
    expect(zugriff.notizen.get("a.md")?.end).toBe("2026-07-20T11:30");
  });

  it("meldet false bei Notizen ohne Start", async () => {
    const { quelle } = aufbau({ "a.md": { type: "todo", uid: "x1" } });
    expect(await quelle.verschiebe("a.md", "2026-07-22")).toBe(false);
  });
});
