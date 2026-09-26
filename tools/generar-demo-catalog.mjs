/**
 * Genera `packages/app/src/data/demo-catalog.ts` desde el SQLite real.
 * ===========================================================================
 *
 * POR QUE EXISTE ESTE SCRIPT
 * --------------------------
 * La app de escritorio abre el SQLite completo: 734 variantes, 12 MB. El
 * navegador no puede abrir un SQLite sin WASM, asi que la demo web necesita una
 * copia en TypeScript. Ese archivo antes se generaba a mano, una sola vez, y por
 * eso termino con caracteres rotos en los acentos de la cabecera y sin forma de
 * regenerarse. Este script lo arregla:
 *
 *   1. Se ejecuta despues de `npm run db:build`, siempre.
 *   2. Sale de la base REAL, no de una transcripcion.
 *   3. Es determinista: el mismo SQLite produce el mismo archivo.
 *
 * EL RECORTE DE 48 VARIANTES
 * --------------------------
 * No es una muestra arbitraria. Se priorizan, en este orden:
 *
 *   - Las marcas grandes con numeros de modelo completos, porque son las que un
 *     tecnico de taller ve todos los dias.
 *   - Los casos AMBIGUOS: codenames con varias variantes de placa. Son los que
 *     demuestran que la herramienta no elige por el tecnico.
 *   - Los equipos con prefijo de operador de fuera de EEUU, que es el caso de
 *     uso para Mexico.
 *
 * Uso: node tools/generar-demo-catalog.mjs
 */

import { DatabaseSync } from "node:sqlite";
import { writeFileSync } from "node:fs";
import { join, resolve } from "node:path";

const RAIZ = resolve(import.meta.dirname, "..");
const DB = join(RAIZ, "packages", "device-db", "data", "out", "fixmyphone_device_db.sqlite");
const SALIDA = join(RAIZ, "packages", "app", "src", "data", "demo-catalog.ts");

const LIMITE = 48;

const db = new DatabaseSync(DB, { readOnly: true });

const COLS = `codename, variant, marketing_name, vendor, soc_raw, soc_vendor,
  platform, model_numbers, android_version, release, capabilities,
  risk_flags, verification_gates, sources`;

const todas = db.prepare(`SELECT ${COLS} FROM variant`).all();

/** Cuantas variantes de placa tiene cada codename. */
const porCodename = new Map();
for (const r of todas) {
  porCodename.set(r.codename, (porCodename.get(r.codename) ?? 0) + 1);
}

/**
 * Numeros de modelo de fuera de EEUU.
 *
 * El codigo de pais va en las ultimas dos letras: SM-A546B es la variante
 * mundial, SM-A546E es la europea, SM-A546U es la de EEUU. Un equipo con
 * prefijo distinto del de EEUU trae la banda base de la operadora de alla, y
 * por eso es el caso interesante para un taller en Mexico.
 */
const esDeOperador = (modelNumbers) =>
  modelNumbers.some((m) => {
    const sufijo = m.slice(-2);
    return /^[A-Z]$/.test(sufijo) && sufijo !== "B" && sufijo !== "U";
  });

const MARCAS_GRANDES = new Set(["samsung", "xiaomi", "motorola", "oneplus", "google"]);

function json(col) {
  if (typeof col !== "string" || col.length === 0) return [];
  try {
    const v = JSON.parse(col);
    return Array.isArray(v) ? v : [];
  } catch {
    // Una columna corrupta no debe tumbar la demo entera. Se deja vacia y el
    // hueco se ve en pantalla como "no registrado", que es lo que es.
    return [];
  }
}

/**
 * Que tanComplete esta una variante como ejemplo de la demo.
 *
 * SOLO ordena dentro de un estrato. La ambiguedad NO puntua ahi, a proposito:
 * cuando era un bonus de +25, las 48 filas salidas-au las 48 ambiguas y el
 * demo se quedaba sin un solo caso de identificacion directa, que es el
 * camino que mas se usa. Ahora la ambiguedad decide el ESTRATO, y el puntaje
 * solo decide el orden dentro de el.
 */
function puntua(r) {
  let p = 0;
  const nums = json(r.model_numbers);

  // Numero de modelo completo: es lo que el tecnico ve en la etiqueta.
  p += Math.min(nums.length, 6) * 3;
  if (nums.length) p += 6;

  // De operacion de fuera de EEUU: el caso de uso en Mexico.
  if (esDeOperador(nums)) p += 14;

  // Con datos tecnicos, que es lo que hace util la pantalla.
  if (r.soc_raw) p += 8;
  if (r.android_version) p += 4;
  if (json(r.capabilities).length) p += 4;
  if (json(r.risk_flags).length) p += 6;
  if (json(r.verification_gates).length) p += 6;

  // Android mas reciente primero: es lo que entra un taller.
  p += Math.min(Number(r.android_version ?? 0) / 4, 9);

  return p;
}

/** Convierte una fila a `DeviceVariant`, con los tipos del contrato ya bien. */
function aVariante(r) {
  const codename = String(r.codename ?? "");
  const variant = r.variant == null ? null : String(r.variant);
  const texto = (v) => (v == null || v === "" ? null : String(v));
  return {
    codename,
    variant,
    key: variant ? `${codename}#${variant}` : codename,
    marketingName: String(r.marketing_name ?? codename),
    vendor: String(r.vendor ?? ""),
    soc: texto(r.soc_raw),
    socVendor: texto(r.soc_vendor),
    platform: texto(r.platform),
    modelNumbers: json(r.model_numbers),
    androidVersion: r.android_version == null ? null : Number(r.android_version),
    release: texto(r.release),
    capabilities: json(r.capabilities),
    riskFlags: json(r.risk_flags),
    verificationGates: json(r.verification_gates),
    sources: json(r.sources),
  };
}

/**
 * Elige las ${LIMITE} variantes, por estratos.
 *
 * Tres estratos con cupos fijos. El reparto es explicito y no "los 48 mejores",
 * porque los 48 mejores de un puntaje global salen casi siempre del mismo
 * estrato: con la ambiguedad como bonus, salian las 48 ambiguas; con la marca
 * grande como bonus, salian las 48 de Samsung. Ninguna de las dos demo sirve
 * para teaching cuando solo enseña un caso.
 *
 *   A. AMBIGUAS  (codename con mas de una variante de placa). 12 cupos.
 *      Son las que demuestran que la herramienta NO elige por el tecnico, que
 *      es la promesa central del producto y la que no se puede ver en un
 *      caso que si resuelve.
 *   B. DIRECTAS  (codename unico, marca grande). 26 cupos.
 *      El camino que mas se usa: llega, resuelve, entrega. Sin esto la demo
 *      parece que la herramienta no sabe nada.
 *   C. DIVERSAS  (marca chica, maximo 2 por marca). hasta 10 cupos.
 *      Que la pantalla de marca no muestre solo cuatro logos. Se llenan por
 *      puntaje, y lo que sobre se queda fuera sin rellenar los cupos: un
 *      hueco honesto es mejor que un filling de relleno.
 */
const CUPOS = { ambigua: 12, directa: 26, diversa: 10 };
const MAX_POR_MARCA_EN_DIVERSAS = 2;

const orden = (a, b) =>
  puntua(b) - puntua(a) || String(a.codename).localeCompare(String(b.codename));

const esAmbigua = (r) => (porCodename.get(r.codename) ?? 0) > 1;
const esDeMarcaGrande = (r) => MARCAS_GRANDES.has(String(r.vendor ?? "").toLowerCase());

const elegidas = [];
const cuantaPorMarca = new Map();

function agrega(r, conTopeMarca) {
  const marca = String(r.vendor ?? "").toLowerCase() || "sin marca";
  if (conTopeMarca) {
    const n = cuantaPorMarca.get(marca) ?? 0;
    if (n >= MAX_POR_MARCA_EN_DIVERSAS) return false;
    cuantaPorMarca.set(marca, n + 1);
  }
  elegidas.push(r);
  return true;
}

for (const r of [...todas].filter(esAmbigua).sort(orden).slice(0, CUPOS.ambigua)) agrega(r, false);
for (const r of [...todas].filter((r) => !esAmbigua(r) && esDeMarcaGrande(r)).sort(orden).slice(0, CUPOS.directa)) agrega(r, false);
for (const r of [...todas].filter((r) => !esAmbigua(r) && !esDeMarcaGrande(r)).sort(orden)) {
  if (elegidas.length >= CUPOS.ambigua + CUPOS.directa + CUPOS.diversa) break;
  agrega(r, true);
}

const cuerpo = elegidas
  .map((r) => {
    const texto = JSON.stringify(aVariante(r), null, 2);
    return texto
      .split("\n")
      .map((l, i) => (i === 0 ? l : "  " + l))
      .join("\n");
  })
  .join(",\n");

const CABECERA = `/**
 * Subconjunto del catalogo para la demostracion web.
 * ===========================================================================
 *
 * GENERADO AUTOMATICAMENTE. No editar a mano.
 *
 *   Origen:     packages/device-db/data/out/fixmyphone_device_db.sqlite
 *   Script:     tools/generar-demo-catalog.mjs
 *   Regenerar:  npm run db:build && node tools/generar-demo-catalog.mjs
 *
 * POR QUE EXISTE
 * --------------
 * La app de escritorio abre el SQLite completo: 734 variantes, 12 MB. El
 * navegador no puede abrir un SQLite sin WASM, asi que la demo web carga este
 * recorte de ${LIMITE} variantes. Los datos son REALES: si la app dice "Exynos
 * 1380" es porque el catalogo lo dice, no porque alguien lo escribio a mano.
 *
 * El recorte es por ESTRATOS con cupos fijos, no "los 48 con mejor puntaje".
 * Un puntaje global produce casi siempre un solo estrato, y una demo que solo
 * muestra un caso no muestra nada:
 *
 *   12 ambiguas  codename con varias variantes de placa: la herramienta NO
 *                elige por el tecnico, que es la promesa central.
 *   26 directas  codename unico de marca grande: llega, resuelve, entrega.
 *   hasta 10     marca chica, maximo 2 por marca, para que la pantalla de
 *   distintas    marca no muestre cuatro logos.
 *
 * ACENTOS
 * -------
 * Este archivo se escribe SIN tildes en los comentarios, a proposito. Pasa por
 * la consola de Windows, que usa cp1252, y una tilde sobrevive al viaje como un
 * caracter roto. Perder un acento en un comentario es mejor que tener codigo
 * corrupto en un archivo de 160 kB. Los DATOS no llevan problema: vienen de la
 * base, que esta en UTF-8.
 */

import type { DeviceVariant } from "@fixmyphone/core";

export const DEMO_CATALOG: DeviceVariant[] = [
`;

const texto = CABECERA + cuerpo + "\n];\n";
writeFileSync(SALIDA, texto, "utf8");

// --- Informe ---------------------------------------------------------------
const conRiesgo = elegidas.filter((r) => json(r.risk_flags).length > 0).length;
const conSoC = elegidas.filter((r) => r.soc_raw).length;
const ambiguas = elegidas.filter(esAmbigua).length;
const marcas = new Map();
for (const r of elegidas) {
  const m = String(r.vendor ?? "").toLowerCase() || "sin marca";
  marcas.set(m, (marcas.get(m) ?? 0) + 1);
}

// El peso se mide sobre el TEXTO escrito, que es lo que existe en disco
// despues de UTF-8. Medir `SALIDA.length` daria el numero de caracteres, y
// con acentos esa cifra no es el tamano del archivo.
const bytes = Buffer.byteLength(texto, "utf8");

console.log("demo-catalog.ts generado");
console.log(`  ${SALIDA}`);
console.log(`  ${(bytes / 1024).toFixed(0)} KB, ${elegidas.length} variantes`);
console.log(`  ${conRiesgo} con riesgos, ${conSoC} con SoC`);
console.log(
  `  estratos: ${ambiguas} ambiguas, ${elegidas.length - ambiguas} directas`,
);
console.log(
  `  ${marcas.size} marcas: ` +
    [...marcas.entries()].sort((a, b) => b[1] - a[1]).map(([m, n]) => `${m} ${n}`).join(", "),
);

// Aviso si un estrato se quedo corto. Es informacion, no un fallo: el tope de
// dos por marca puede dejar el tercero sin llenar si la marca chica esta mal
// cubierta en la fuente, y eso conviene verlo en la salida del script.
const cuposEsperados = CUPOS.ambigua + CUPOS.directa + CUPOS.diversa;
if (elegidas.length < cuposEsperados) {
  console.log(
    `  nota: ${cuposEsperados - elegidas.length} cupos sin llenar; ` +
      "la fuente no tiene variantes que los ocupen",
  );
}

db.close();
