import { describe, expect, it } from "vitest";
import { PfadWarteschlange } from "./pfad-warteschlange";

const warte = (ms: number) => new Promise((erfuellt) => setTimeout(erfuellt, ms));

describe("PfadWarteschlange", () => {
  it("führt Aufgaben für dieselbe Datei nacheinander aus", async () => {
    const warteschlange = new PfadWarteschlange();
    const reihenfolge: string[] = [];
    await Promise.all([
      warteschlange.einreihen("a.md", async () => {
        await warte(20);
        reihenfolge.push("erste");
      }),
      warteschlange.einreihen("a.md", async () => {
        reihenfolge.push("zweite");
      }),
    ]);
    expect(reihenfolge).toEqual(["erste", "zweite"]);
  });

  it("lässt verschiedene Dateien gleichzeitig laufen", async () => {
    const warteschlange = new PfadWarteschlange();
    const reihenfolge: string[] = [];
    await Promise.all([
      warteschlange.einreihen("a.md", async () => {
        await warte(20);
        reihenfolge.push("a");
      }),
      warteschlange.einreihen("b.md", async () => {
        reihenfolge.push("b");
      }),
    ]);
    expect(reihenfolge).toEqual(["b", "a"]);
  });

  it("macht nach einem Fehler weiter und gibt den Fehler an den Aufrufer", async () => {
    const warteschlange = new PfadWarteschlange();
    const fehlschlag = warteschlange.einreihen("a.md", async () => {
      throw new Error("kaputt");
    });
    const danach = warteschlange.einreihen("a.md", async () => "ok");
    await expect(fehlschlag).rejects.toThrow("kaputt");
    await expect(danach).resolves.toBe("ok");
  });

  it("liefert das Ergebnis der Aufgabe zurück", async () => {
    expect(await new PfadWarteschlange().einreihen("a.md", async () => 42)).toBe(42);
  });
});
