/**
 * Inventario rapido de lo que hay hoy en la base, sin abrir la app.
 *
 * Es una herramienta de trabajo, no una prueba: imprime, no falla. Para lo que
 * de verdad verifica que la base no este rota esta tools/probar-catalogo.mjs.
 *
 * Uso:  node tools/inventario.mjs [--db ruta.sqlite] [--json devices.json]
 */

import { DatabaseSync } from "node:sqlite";
import { readFileSync } from "node:fs";
import { join, resolve } from "node:path";

const RAIZ = resolve(import.meta.dirname, "..");
const args = process.argv.slice(2);
const valorDe = (nombre, porDefecto) => {
  const i = args.indexOf(nombre);
  return i >= 0 && args[i + 1] ? args[i + 1] : porDefecto;
};

const db = join(RAIZ, "packages", "device-db", "data", "out", "fixmyphone_device_db.sqlite");
const json = valorDe("--json", join(RAIZ, "packages", "device-db", "data", "out", "devices.json"));

// ---------------------------------------------------------------------------
console.log("\nQue hay dentro de la base");
console.log("-".repeat(60));

const sqlite = new DatabaseSync(valorDe("--db", db), { readOnly: true });
const tablas = sqlite
  .prepare("SELECT name FROM sqlite_master WHERE type = 'table' ORDER BY name")
  .all();
console.log("  tablas: " + tablas.map((t) => t.name).join(", "));

for (const t of tablas) {
  let n = 0;
  try {
    n = sqlite.prepare(`SELECT COUNT(*) n FROM ${t.name}`).get().n;
  } catch {
    continue;
  }
  if (n > 0) console.log(`    ${t.name}: ${n}`);
}
sqlite.close();

// ---------------------------------------------------------------------------
console.log("\nMarcas y cobertura");
console.log("-".repeat(60));

const rows = JSON.parse(readFileSync(valorDe("--json", json), "utf8"));
const lista = Array.isArray(rows) ? rows : (rows.variants ?? rows.devices ?? []);
console.log(`  variantes en el json: ${lista.length}`);

const porMarca = new Map();
for (const v of lista) {
  const m = v.vendor || "(sin marca)";
  if (!porMarca.has(m)) porMarca.set(m, { n: 0, conModelos: 0, conToken: 0 });
  const e = porMarca.get(m);
  e.n++;
  if ((v.model_numbers ?? []).length) e.conModelos++;
  if ((v.device_tokens ?? []).length) e.conToken++;
}

const orden = [...porMarca.entries()].sort((a, b) => b[1].n - a[1].n);
console.log(`  ${"marca".padEnd(14)} ${"variantes".padStart(9)} ${"con modelo".padStart(11)} ${"con token".padStart(10)}`);
for (const [marca, e] of orden) {
  console.log(
    `  ${marca.padEnd(14)} ${String(e.n).padStart(9)} ${String(e.conModelos).padStart(11)} ${String(e.conToken).padStart(10)}`,
  );
}

// ---------------------------------------------------------------------------
console.log("\nAlias de marca, como los trae cada fuente");
console.log("-".repeat(60));
const alias = new Map();
for (const v of lista) {
  const m = v.vendor || "(sin marca)";
  if (!alias.has(m)) alias.set(m, new Set());
  for (const s of v.sources ?? []) alias.get(m).add(s);
}
for (const [marca, fuentes] of [...alias.entries()].sort()) {
  console.log(`  ${marca.padEnd(14)} ${[...fuentes].join(", ")}`);
}

console.log("");
