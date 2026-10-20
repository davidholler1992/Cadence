/**
 * Was:      Macht aus einem Namen ein Kürzel für Tags (nur a-z, 0-9 und "-").
 * Warum:    Kalendernamen wie "Familie & Freunde" sollen als Tag
 *           "kalender/familie-freunde" verwendbar sein. Umlaute und andere
 *           Akzente werden dabei auf den Grundbuchstaben zurückgeführt.
 * Beispiel: kuerzelAusName("Familie & Freunde")  →  "familie-freunde"
 *           kuerzelAusName("Über uns")           →  "uber-uns"
 */

export function kuerzelAusName(name: string): string {
  return name
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "") // Akzente entfernen (ü → u)
    .replace(/[^a-z0-9]+/g, "-") // alles andere wird zu "-"
    .replace(/^-+|-+$/g, ""); // "-" am Anfang/Ende entfernen
}