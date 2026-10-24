import { describe, expect, it } from "vitest";
import type { DateiZugriff } from "./datei-zugriff";
import { InlineVerarbeiter } from "./inline-verarbeiter";

/** Ein einfacher Ersatz für den Vault: Dateien liegen in einer Map, Schreibvorgänge werden gezählt. */
class TestDateien implements DateiZugriff {
  schreibvorgaenge = 0;
  constructor(public dateien: Map<string, string>) {}
  inlineDateien() {
    return [...this.dateien.keys()];
  }
  async lese(pfad: string) {
    const inhalt = this.dateien.get(pfad);
    if (inhalt === undefined) throw new Error("nicht gefunden");
    return inhalt;
  }
  async ersetze(pfad: string, umwandeln: (inhalt: string) => string) {
    this.dateien.set(pfad, umwandeln(this.dateien.get(pfad) ?? ""));
    this.schreibvorgaenge++;
  }
}

function aufbau(dateien: Record<string, string>) {
  const zugriff = new TestDateien(new Map(Object.entries(dateien)));
  let zaehler = 0;
  const verarbeiter = new InlineVerarbeiter(zugriff, () => ({ tagTodo: "todo", tagTermin: "termin" }), {
    heute: () => "2026-07-20",
    neueUid: () => `u${++zaehler}`,
  });
  return { zugriff, verarbeiter };
}

describe("InlineVerarbeiter", () => {
  it("vergibt UIDs und schreibt beim zweiten Durchlauf nicht mehr", async () => {
    const { zugriff, verarbeiter } = aufbau({ "a.md": "- [ ] A #todo" });
    expect(await verarbeiter.verarbeiteDatei("a.md")).toBe(true);
    expect(zugriff.dateien.get("a.md")).toBe("- [ ] A #todo [uid:: u1]");
    expect(await verarbeiter.verarbeiteDatei("a.md")).toBe(false);
    expect(zugriff.schreibvorgaenge).toBe(1);
  });

  it("schreibt nicht, wenn nichts zu tun ist", async () => {
    const { zugriff, verarbeiter } = aufbau({ "a.md": "Nur Text\n- Aufzählung" });
    expect(await verarbeiter.verarbeiteDatei("a.md")).toBe(false);
    expect(zugriff.schreibvorgaenge).toBe(0);
  });

  it("setzt einen Haken bei einer Serie um", async () => {
    const { zugriff, verarbeiter } = aufbau({
      "a.md": "- [x] A #todo [start:: 2026-07-20] [rrule:: FREQ=DAILY] [uid:: x1]",
    });
    await verarbeiter.verarbeiteDatei("a.md");
    expect(zugriff.dateien.get("a.md")).toBe(
      "- [ ] A #todo [start:: 2026-07-21] [rrule:: FREQ=DAILY] [anchorStart:: 2026-07-20] [completed:: 2026-07-20] [uid:: x1]"
    );
    expect(await verarbeiter.verarbeiteDatei("a.md")).toBe(false);
  });

  it("verarbeitet gleichzeitige Aufrufe für dieselbe Datei nacheinander (nur ein Schreibvorgang)", async () => {
    const { zugriff, verarbeiter } = aufbau({ "a.md": "- [ ] A #todo" });
    const ergebnisse = await Promise.all([verarbeiter.verarbeiteDatei("a.md"), verarbeiter.verarbeiteDatei("a.md")]);
    expect(ergebnisse).toEqual([true, false]);
    expect(zugriff.schreibvorgaenge).toBe(1);
  });

  it("verarbeitet alle Dateien und meldet die Zahlen", async () => {
    const { verarbeiter } = aufbau({ "a.md": "- [ ] A #todo", "b.md": "Text", "c.md": "- [ ] C #todo" });
    expect(await verarbeiter.verarbeiteAlle()).toEqual({ dateien: 3, geschrieben: 2 });
  });
});

describe("InlineVerarbeiter: doppelte UIDs über Dateien hinweg", () => {
  it("lässt dem Original die UID und gibt der Kopie eine neue", async () => {
    const { zugriff, verarbeiter } = aufbau({
      "original.md": "- [ ] A #todo [uid:: x1]",
      "kopie.md": "- [ ] A #todo [uid:: x1]",
    });
    await verarbeiter.verarbeiteAlle();
    expect(zugriff.dateien.get("original.md")).toBe("- [ ] A #todo [uid:: x1]");
    expect(zugriff.dateien.get("kopie.md")).toBe("- [ ] A #todo [uid:: u1]");
  });

  it("erkennt eine Kopie, die später entsteht", async () => {
    const { zugriff, verarbeiter } = aufbau({ "original.md": "- [ ] A #todo [uid:: x1]" });
    await verarbeiter.verarbeiteAlle();
    zugriff.dateien.set("kopie.md", "- [ ] A #todo [uid:: x1]");
    await verarbeiter.verarbeiteDatei("kopie.md");
    expect(zugriff.dateien.get("kopie.md")).toBe("- [ ] A #todo [uid:: u1]");
    expect(zugriff.dateien.get("original.md")).toBe("- [ ] A #todo [uid:: x1]");
  });

  it("behält die UID, wenn die Zeile verschoben wurde (Quelle schon ohne die Zeile)", async () => {
    const { zugriff, verarbeiter } = aufbau({ "a.md": "- [ ] A #todo [uid:: x1]", "b.md": "Text" });
    await verarbeiter.verarbeiteAlle();
    zugriff.dateien.set("a.md", "");
    zugriff.dateien.set("b.md", "Text\n- [ ] A #todo [uid:: x1]");
    await verarbeiter.verarbeiteDatei("a.md");
    await verarbeiter.verarbeiteDatei("b.md");
    expect(zugriff.dateien.get("b.md")).toBe("Text\n- [ ] A #todo [uid:: x1]");
  });

  it("behält die UID auch, wenn das Ziel zuerst verarbeitet wird, aber die Zeile in der Quelle schon fehlt", async () => {
    const { zugriff, verarbeiter } = aufbau({ "a.md": "- [ ] A #todo [uid:: x1]", "b.md": "Text" });
    await verarbeiter.verarbeiteAlle();
    zugriff.dateien.set("a.md", ""); // Quelle ist auf der Platte schon leer
    zugriff.dateien.set("b.md", "Text\n- [ ] A #todo [uid:: x1]");
    await verarbeiter.verarbeiteDatei("b.md");
    expect(zugriff.dateien.get("b.md")).toBe("Text\n- [ ] A #todo [uid:: x1]");
  });

  it("folgt einer umbenannten Datei", async () => {
    const { zugriff, verarbeiter } = aufbau({ "a.md": "- [ ] A #todo [uid:: x1]" });
    await verarbeiter.verarbeiteAlle();
    zugriff.dateien.set("a2.md", zugriff.dateien.get("a.md")!);
    zugriff.dateien.delete("a.md");
    verarbeiter.dateiUmbenannt("a.md", "a2.md");
    zugriff.dateien.set("kopie.md", "- [ ] A #todo [uid:: x1]");
    await verarbeiter.verarbeiteDatei("kopie.md");
    expect(zugriff.dateien.get("kopie.md")).toBe("- [ ] A #todo [uid:: u1]");
  });
});
