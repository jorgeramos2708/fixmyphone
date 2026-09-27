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

const COLS = `codename, variant, marketing_name, vendor, vendor_nombre, soc_raw, soc_vendor,
  platform, model_numbers, android_version, release, capabilities,
  risk_flags, verification_gates, sources,
  homologado_ift, ift_certificado, ift_url`;

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
 * Qué tan completa está una variante como ejemplo de la demo.
 *
 * SOLO ordena dentro de un estrato. La ambigüedad NO puntúa ahí, a propósito:
 * cuando era un bono de +25, las 48 filas salidas fueron las 48 ambiguas y la
 * demo se quedaba sin un solo caso de identificación directa, que es el camino
 * que más se usa. Ahora la ambigüedad decide el ESTRATO, y el puntaje solo
 * decide el orden dentro de él.
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
    // Sin el nombre, se cae a la clave. Una demo que muestra "motorola" en vez
    // de "Motorola" no se nota; una que muestra la cadena vacía parece un
    // equipo al que no leyeron los datos.
    vendorNombre: String(r.vendor_nombre ?? "") || String(r.vendor ?? ""),
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
    homologadoIft: comoHomologadoIft(r.homologado_ift),
    iftCertificado: String(r.ift_certificado ?? ""),
    iftUrl: String(r.ift_url ?? ""),
  };
}

/**
 * Un estado de homologación que no sea uno de los cuatro conocidos se degrada a
 * `desconocido`, nunca a `homologado`.
 *
 * Se repite aquí y no se importa del proceso principal porque este archivo corre
 * en Node sin el paquete de escritorio, y porque la degradación al conservador
 * tiene que estar en los dos lados: si uno de los dos se equivoca, el que falla
 * es el que muestra "Homologado" sin folio.
 */
const ESTADOS_IFT = new Set(["homologado", "sin_verificar", "no_soportado"]);
const comoHomologadoIft = (bruto) => {
  const s = String(bruto ?? "");
  return ESTADOS_IFT.has(s) ? s : "desconocido";
};

/**
 * Elige las ${LIMITE} variantes, por estratos.
 *
 * Tres estratos con cupos fijos. El reparto es explicito y no "los 48 mejores",
 * porque los 48 mejores de un puntaje global salen casi siempre del mismo
 * estrato: con la ambiguedad como bonus, salian las 48 ambiguas; con la marca
 * grande como bonus, salian las 48 de Samsung. Ninguna de las dos demos sirve
 * para explicar el producto cuando solo enseña un caso.
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
// `vendor` ya viene como clave canónica en minúsculas desde la normalización de
// marcas, así que el `toLowerCase()` es solo una red por si la base se regenera
// con una versión anterior del pipeline. Sin eso, un base vieja con "Samsung"
// y "OPPO" se quedaría fuera del estrato de marcas grandes sin avisar.
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

// --- Cada estado de homologacion que exista tiene que verse en la demo -------
//
// Sin esta regla la demo sale con 31 `desconocido`, 17 `sin_verificar` y CERO
// `homologado`, porque los 11 equipos con folio son todos Motorola y el puntaje
// los deja fuera. O sea: la demo del cruce con el padron del IFT no mostraba el
// cruce. Un folio que no se ve no se puede evaluar, y quien mira la landing no
// tiene forma de saber si el dato es real o inventado.
//
// Se hace por INTERCAMBIO y no sumando, porque LIMITE es fijo: una demo de 49 no
// es una demo de 48. Sale la de menor puntaje que no sea la unica representante de
// su estado, para que ningún estado se quede sin mostrar por arreglar otro.
//
// La lista es de los tres estados que el cruce produce. `no_soportado` no entra
// porque solo lo produce una confirmacion humana y hoy no hay ninguna: ponerlo
// como cupo vacio seria prometer un caso que el producto no tiene.
const ESTADOS_A_MOSTRAR = ["homologado", "sin_verificar", "desconocido"];
const faltantes = [];
for (const estado of ESTADOS_A_MOSTRAR) {
  if (elegidas.some((r) => String(r.homologado_ift) === estado)) continue;
  const candidatas = [...todas].filter((r) => String(r.homologado_ift) === estado).sort(orden);
  if (candidatas.length) faltantes.push(candidatas[0]);
}
for (const entra of faltantes) {
  const fuera = elegidas
    .map((r, i) => ({ r, i }))
    .filter(({ r }) => {
      const estado = String(r.homologado_ift);
      return elegidas.filter((o) => String(o.homologado_ift) === estado).length > 1;
    })
    .sort((a, b) => puntua(a.r) - puntua(b.r))[0];
  if (!fuera) break;
  elegidas[fuera.i] = entra;
}
elegidas.sort(orden);

// El `,` del join va seguido de los dos espacios de la otra mitad: sin ellos la
// llave que abre cada objeto sale en la columna 0 y la que cierra en la 2. Es
// un detalle de formato en un archivo generado, pero el archivo se lee cuando
// alguien va a ver de donde sale la demo, y un archivo que se ve generado a
// medias se lee como generado.
const cuerpo = elegidas
  .map((r) => {
    const texto = JSON.stringify(aVariante(r), null, 2);
    return texto
      .split("\n")
      .map((l, i) => (i === 0 ? l : "  " + l))
      .join("\n");
  })
  .join(",\n  ");

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

// Los estados de homologacion que se ven en la demo. Se imprime para que la
// regla de arriba sea auditable sin abrir el archivo: si un dia el script deja
// de garantizar un estado, se nota aqui y no en una queja de que la demo no lo
// muestra.
const estadosDemo = new Map();
for (const r of elegidas) {
  const e = String(r.homologado_ift || "desconocido");
  estadosDemo.set(e, (estadosDemo.get(e) ?? 0) + 1);
}
console.log(
  `  homologacion IFT: ` +
    [...estadosDemo.entries()]
      .sort((a, b) => b[1] - a[1])
      .map(([e, n]) => `${e} ${n}`)
      .join(", "),
);
const ausentes = ESTADOS_A_MOSTRAR.filter((e) => !estadosDemo.has(e));
if (ausentes.length) {
  console.log(`  aviso: sin casos en la demo -> ${ausentes.join(", ")}`);
}

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
