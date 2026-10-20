/**
 * Was:      Baut src/main.ts zu main.js (das Obsidian lädt).
 * Warum:    Ein einziger Ort für den Build. Der Ausgabeordner ist einstellbar.
 * Aufruf:   npm run dev     (baut bei jeder Änderung automatisch neu)
 *           npm run build   (einmaliger, geprüfter Produktions-Build)
 *
 * Ausgabeordner:
 *   Standard ist der Projektordner selbst (passt, wenn das Repo direkt im
 *   Plugin-Ordner des Vaults liegt). Soll woanders hin gebaut werden, legst du
 *   eine Datei "lokal.config.json" an (siehe lokal.config.beispiel.json).
 *   Diese Datei steht in der .gitignore und kommt nie ins Repository.
 */

import esbuild from "esbuild";
import { builtinModules } from "module";
import { copyFileSync, existsSync, mkdirSync, readFileSync } from "fs";
import { homedir } from "os";
import { join, resolve } from "path";

const istProduktion = process.argv[2] === "production";

/** Liest den Ausgabeordner aus lokal.config.json (optional). "~" steht für den Home-Ordner. */
function leseAusgabeOrdner() {
  if (!existsSync("lokal.config.json")) return resolve(".");
  try {
    const konfiguration = JSON.parse(readFileSync("lokal.config.json", "utf8"));
    const roh = konfiguration.ausgabeOrdner;
    if (typeof roh !== "string" || roh.trim() === "") return resolve(".");
    return resolve(roh.trim().replace(/^~(?=\/|$)/, homedir()));
  } catch (fehler) {
    console.error("lokal.config.json konnte nicht gelesen werden:", fehler.message);
    process.exit(1);
  }
}

const ausgabeOrdner = leseAusgabeOrdner();
const baueInAnderenOrdner = ausgabeOrdner !== resolve(".");

/** Kopiert manifest.json und styles.css nach jedem Build mit, falls in einen anderen Ordner gebaut wird. */
const dateienMitkopieren = {
  name: "dateien-mitkopieren",
  setup(build) {
    build.onEnd((ergebnis) => {
      if (ergebnis.errors.length > 0) return;
      if (baueInAnderenOrdner) {
        mkdirSync(ausgabeOrdner, { recursive: true });
        for (const datei of ["manifest.json", "styles.css"]) {
          if (existsSync(datei)) copyFileSync(datei, join(ausgabeOrdner, datei));
        }
      }
      console.log(`[Cadence] gebaut → ${join(ausgabeOrdner, "main.js")}`);
    });
  },
};

const kontext = await esbuild.context({
  banner: { js: "/* Gebaute Datei - nicht bearbeiten. Der Quellcode liegt in src/. */" },
  entryPoints: ["src/main.ts"],
  bundle: true,
  external: [
    "obsidian",
    "electron",
    "@codemirror/*",
    "@lezer/*",
    ...builtinModules,
    ...builtinModules.map((name) => `node:${name}`),
  ],
  format: "cjs",
  target: "es2020",
  logLevel: "info",
  sourcemap: istProduktion ? false : "inline",
  minify: istProduktion,
  treeShaking: true,
  outfile: join(ausgabeOrdner, "main.js"),
  plugins: [dateienMitkopieren],
});

if (istProduktion) {
  await kontext.rebuild();
  process.exit(0);
} else {
  await kontext.watch();
  console.log("[Cadence] Beobachte Änderungen (Beenden mit Strg+C) ...");
}
