/**
 * Genera `packages/app/src/data/demo-catalog.ts` desde el SQLite real.
 * ===========================================================================
 *
 * POR QUE EXISTE ESTE SCRIPT
 * --------------------------
 * La app de escritorio abre el SQLite completo: 756 variantes, 12 MB. El
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
import { writeFileSync, readFileSync, existsSync, statSync } from "node:fs";
import { join, resolve } from "node:path";

const RAIZ = resolve(import.meta.dirname, "..");
const DB = join(RAIZ, "packages", "device-db", "data", "out", "fixmyphone_device_db.sqlite");
const SALIDA = join(RAIZ, "packages", "app", "src", "data", "demo-catalog.ts");
const MAQUETA = join(RAIZ, "apps", "web-demo", "src", "browser-bridge.ts");

const LIMITE = 48;

const db = new DatabaseSync(DB, { readOnly: true });

const COLS = `codename, variant, marketing_name, vendor, vendor_nombre, soc_raw, soc_vendor,
  platform, model_numbers, android_version, release, capabilities,
  risk_flags, verification_gates, sources,
  homologado_ift, ift_certificado, ift_url`;

const todas = db.prepare(`SELECT ${COLS} FROM variant`).all();

// Lo que la cabecera del archivo generado va a decir del catalogo completo se
// mide aqui, no se escribe a mano. Un "750 variantes" en un comentario es una
// afirmacion sobre otro archivo, y envejece sin que nadie lo note: el dia que la
// base tenga 800, el comentario seguira diciendo 750 y nadie lo va a leer como lo
// que es, una verdad que dejo de serlo.
const TOTAL_FUENTE = todas.length;
const MB_FUENTE = statSync(DB).size / 1024 / 1024;

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

// --- A. AMBIGUAS -----------------------------------------------------------
//
// OJO, aqui se eligen codenames COMPLETOS, no filas sueltas, y no es un detalle
// de como se corta la lista: es la diferencia entre que la demo muestre la
// ambiguedad o no la muestre.
//
// La version anterior hacia `[...todas].filter(esAmbigua).sort(orden).slice(0, 12)`,
// o sea se llevaba las doce FILAS ambiguas que mejor puntuan. El problema es que
// la ambiguedad no es una propiedad de la fila sino del grupo: un codename con
// tres placas es ambiguo porque hay tres filas, y si la maqueta se lleva una sola
// de esas tres, para el resolutor ese codename deja de ser ambiguo y pasa a ser
// un acierto directo. O sea, la fila se llevaba el crédito de "ambigua" y la
// maqueta entregaba un caso único.
//
// Medido: de las 12 filas que el generador reportaba como ambiguas, 10 venian de
// codenames que quedaron con una sola fila en la maqueta. La demo anunciaba 12
// casos de ambiguedad y.tenia 2. Peor: el resolutor de la maqueta tomaba la
// primera variante con `.find()` y resolvia las 10, asi que la pantalla mostraba
// "equipo identificado" justo donde la promesa central del producto es no
// elegir por el tecnico.
//
// Ahora se recorre por codename y se mete el grupo entero. Un codename cuyo
// grupo no cabe entero en el cupo se salta: meterlo a medias fabricaría una
// ambigüedad que el producto no tiene, que es el error al revés.
const porCodenameFilas = new Map();
for (const r of todas) {
  if (!esAmbigua(r)) continue;
  const g = porCodenameFilas.get(r.codename) ?? [];
  g.push(r);
  porCodenameFilas.set(r.codename, g);
}

// Cada grupo se ordena por la MEJOR de sus filas, que es como se comparan
// codenames: el grupo entra segun su mejor representante, no segun el promedio.
const codenamesAmbiguos = [...porCodenameFilas.entries()]
  .map(([codename, filas]) => ({ codename, filas, mejor: Math.max(...filas.map(puntua)) }))
  .sort((a, b) => b.mejor - a.mejor || a.codename.localeCompare(b.codename));

for (const g of codenamesAmbiguos) {
  if (elegidas.length + g.filas.length > CUPOS.ambigua) continue;
  for (const r of g.filas) agrega(r, false);
}

const elegidasPorCodename = new Set(elegidas.map((r) => r.codename));
// Los estratos B y C se quedan con codenames NO ambiguos. Entrar aqui con una
// sola fila de un codename que en la base tiene varias deja la maqueta con un
// acierto directo donde el producto se negaria, que es la fabricacion mas
// grave de las tres: la pantalla muestra una seguridad que la base no
// respalda. Un codename ambiguo entra por el estrato A, con su grupo entero, o
// no entra.
//
// Consecuencia aceptada: una marca cuyos codenames son todos ambiguos puede
// quedar fuera de la demo (pasó con OnePlus, cuyos codenames repetidos se
// llevaron el cupo completo del estrato A). Es preferible ausente a presente con
// una certeza que el producto no tiene.
for (const r of [...todas]
  .filter((r) => !esAmbigua(r) && !elegidasPorCodename.has(r.codename) && esDeMarcaGrande(r))
  .sort(orden)
  .slice(0, CUPOS.directa)) agrega(r, false);
for (const r of [...todas]
  .filter(
    (r) =>
      !esAmbigua(r) &&
      !elegidasPorCodename.has(r.codename) &&
      !esDeMarcaGrande(r),
  )
  .sort(orden)) {
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
const sinReservar = [];
for (const estado of ESTADOS_A_MOSTRAR) {
  if (elegidas.some((r) => String(r.homologado_ift) === estado)) continue;
  // La fila que entra tiene que ser de un codename SIN ambiguedad en la base. Si
  // se mete una sola fila de un codename que tiene tres placas, la maqueta
  // presenta un acierto directo donde la base dice que hay tres. Es la
  // fabricacion de un acierto que no existe, y es el error mas grave de los
  // tres porque la pantalla muestra seguridad donde no la hay.
  const candidatas = [...todas]
    .filter((r) => String(r.homologado_ift) === estado && !esAmbigua(r))
    .sort(orden);
  if (candidatas.length) faltantes.push({ estado, fila: candidatas[0] });
  else sinReservar.push(estado);
}

for (const { fila: entra } of faltantes) {
  // La victima no puede ser una fila de un codename que aporta mas de una fila a
  // la maqueta. Si lo fuera, el grupo se queda incompleto y la demo anunciaria
  // menos placas de las que hay: "2 candidatas" donde la base tiene 4. Es el
  // mismo error del estrato de ambiguedas al reves, y tampoco se ve: la pantalla
  // sigue diciendo la verdad sobre lo que trae, pero trae menos de lo que hay.
  //
  // El conteo se rehace en cada vuelta porque cada intercambio cambia el grupo.
  const fuera = elegidas
    .map((r, i) => ({ r, i }))
    .filter(({ r }) => {
      const estado = String(r.homologado_ift);
      if (elegidas.filter((o) => o.codename === r.codename).length > 1) return false;
      return elegidas.filter((o) => String(o.homologado_ift) === estado).length > 1;
    })
    .sort((a, b) => puntua(a.r) - puntua(b.r))[0];
  if (!fuera) break;
  elegidas[fuera.i] = entra;
}
// --- Los codenames que usa la maqueta no son negociables -------------------
//
// La maqueta web tiene equipos simulados con codename fijo, y son los ejemplos
// que alguien va a mirar para decidir si el producto sirve. Si el recorte los
// deja fuera, la demo contesta "no reconocimos este equipo" en el caso que
// queria demostrar, y no hay forma de saber si el fallo es del ejemplo o del
// producto.
//
// Antes no se tenia en cuenta, y pasaba cada vez que se regeneraba la base o se
// tocaba un puntaje: el recorte se reacomoda, los codenames de los equipos
// simulados se caen y hay que perseguirlos a mano. Pasa mas facil desde que los
// codenames ambiguos entran por el estrato A: ahi el cupo se lo pelean, y un
// codename ambiguo puede entrar completo o no entrar, segun como caiga el orden.
// Este paso los mete antes del intercambio de estados.
//
// Se leen del archivo de la maqueta y no de una lista escrita aqui. Una lista en
// este script se desactualiza en silencio la primera vez que alguien agrega un
// equipo simulado, que es justo el caso para el que existe el paso.
const codenamesDeLaMaqueta = (() => {
  if (!existsSync(MAQUETA)) return [];
  // Los saltos de linea se normalizan porque `readFileSync` no lo hace y el
  // archivo puede venir con CRLF: sin esto el corte por bloques no encuentra
  // nada y el paso de abajo se cree, en silencio, que la maqueta no simula
  // ningun equipo. Un reserved que reserve cero es peor que no tener el paso.
  const texto = readFileSync(MAQUETA, "utf8").replace(/\r\n/g, "\n");
  const cuerpo = texto.split("const SIMULADOS")[1] ?? "";
  const vistos = [];
  for (const bloque of cuerpo.split("\n  {\n").slice(1)) {
    // Un equipo que declara `fueraDelCatalogo` NO se reserva: su proposito es
    // justamente quedar fuera. Reservarlo seria meter en el recorte el equipo
    // que la maqueta usa para demostrar que el catalogo no lo tiene.
    if (/fueraDelCatalogo:\s*true/.test(bloque)) continue;
    const m = bloque.match(/"ro\.product\.device":\s*"([^"]+)"/);
    if (m && !vistos.includes(m[1])) vistos.push(m[1]);
  }
  return vistos;
})();

const metidosPorFuerza = [];
for (const cn of codenamesDeLaMaqueta) {
  const grupo = todas.filter((r) => r.codename === cn);
  if (!grupo.length) {
    console.log(`  aviso: la maqueta simula "${cn}" y ese codename no esta en la base`);
    continue;
  }
  if (grupo.every((f) => elegidas.includes(f))) continue;

  // Entra el grupo entero. Si el codename es ambiguo entra completo o no entra:
  // media fila de un grupo es justo lo que hay que evitar.
  const faltan = grupo.length - grupo.filter((f) => elegidas.includes(f)).length;

  // Se sacan las filas mas flojas que NO sean de la maqueta, NO pertenezcan a un
  // grupo ambiguo y no sean del mismo codename que lo que entra, para no romper
  // con la mano lo que el estrato A agrupo.
  const sobran = elegidas
    .map((r, i) => ({ r, i }))
    .filter(
      ({ r }) =>
        !codenamesDeLaMaqueta.includes(r.codename) &&
        !esAmbigua(r) &&
        !grupo.some((g) => g.codename === r.codename),
    )
    .sort((a, b) => puntua(a.r) - puntua(b.r));

  if (sobran.length < faltan) {
    console.log(
      `  aviso: "${cn}" no cabe en el recorte sin romper un grupo ambiguo; queda ` +
        `fuera y el equipo simulado no va a resolver`,
    );
    continue;
  }
  for (const { i } of sobran.slice(0, faltan)) elegidas[i] = null;
  for (const f of grupo) elegidas.push(f);
  // Se limpian los huecos ya, y no al final del bucle: si dos codenames hay que
  // meterlos a la fuerza, el segundo leeria los null que dejo el primero y se
  // caeria. Con uno solo nunca se nota, y por eso estaba.
  for (let i = elegidas.length - 1; i >= 0; i--) if (elegidas[i] === null) elegidas.splice(i, 1);
  metidosPorFuerza.push(cn);
}

if (metidosPorFuerza.length) {
  console.log(
    `  nota: ${metidosPorFuerza.length} codename(s) de la maqueta entraron a la ` +
      `fuerza -> ${metidosPorFuerza.join(", ")}`,
  );
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

// En la cabecera no hay ni un numero escrito a mano. El total y el peso del
// catalogo se miden; los cupos se leen de CUPOS; y el total del recorte es el
// que salio, no el que se queria. La prosa que decia "los 48 con mejor
// puntaje" y "26 directas" era una segunda copia de LIMITE y CUPOS: dos cifras
// del mismo dato, y las dos certainas de desincronizarse. La unica fuente es la
// de arriba.
// La nota empieza con un salto de linea y no con " *": pegada a la linea
// anterior salia "variantes. *" y el bloque de comentario se rompia a la vista,
// que es justo lo que un archivo generado no puede hacer.
const DESVIACION =
  elegidas.length === LIMITE
    ? ""
    : `
 * NOTA: el tope de este recorte son ${LIMITE} variantes y aqui hay
 * ${elegidas.length}. Los codenames de la maqueta que no cabian en su cupo
 * entraron a la fuerza y se paso el tope. Es el mismo aviso que sale por
 * consola, escrito donde se lee: en el archivo.`;

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
 * La app de escritorio abre el SQLite completo: ${TOTAL_FUENTE} variantes, ${MB_FUENTE.toFixed(0)} MB. El
 * navegador no puede abrir un SQLite sin WASM, asi que la demo web carga este
 * recorte de ${elegidas.length} variantes.${DESVIACION}
 * Los datos son REALES: si la app dice "Exynos 1380" es porque el catalogo lo
 * dice, no porque alguien lo escribio a mano.
 *
 * El recorte es por ESTRATOS con cupos fijos, no "los ${LIMITE} con mejor puntaje".
 * Un puntaje global produce casi siempre un solo estrato, y una demo que solo
 * muestra un caso no muestra nada:
 *
 *   hasta ${CUPOS.ambigua}     codename con varias variantes de placa, y se mete el grupo
 *   ambiguas     COMPLETO: la herramienta NO elige por el tecnico, que es la
 *                promesa central. Se cuenta por codename y no por filas,
 *                porque la ambiguedad es del grupo: una fila sola de un
 *                codename de cuatro placas no es ambigua, es un acierto.
 *   ${CUPOS.directa} directas  codename unico de marca grande: llega, resuelve, entrega.
 *   hasta ${CUPOS.diversa}     marca chica, maximo 2 por marca, para que la pantalla de
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

// La ambiguedad se cuenta por CODENAME, que es como la ve el resolutor. Contar
// filas daba un numero que no correspondia a nada que se pudiera ver en
// pantalla: un codename con cuatro placas del que la maqueta solo trae dos filas
// sigue siendo ambiguo, y uno del que trae una sola ya no lo es aunque en la base
// completa tenga cuatro.
const filasPorCodename = new Map();
for (const r of elegidas) filasPorCodename.set(r.codename, (filasPorCodename.get(r.codename) ?? 0) + 1);
const codenamesAmbiguosEnDemo = [...filasPorCodename.values()].filter((n) => n > 1).length;
// Filas que de verdad son ambiguas PARA EL RESOLUTOR: las que viven en un
// codename con mas de una fila en la maqueta. Contar con `esAmbigua` daria un
// numero mayor, porque incluye filas de codenames que en la base son ambiguos y
// aqui llegaron solas, y esas para el resolutor son aciertos directos.
const filasAmbiguas = elegidas.filter((r) => (filasPorCodename.get(r.codename) ?? 0) > 1).length;
const marcas = new Map();
for (const r of elegidas) {
  const m = String(r.vendor ?? "").toLowerCase() || "sin marca";
  marcas.set(m, (marcas.get(m) ?? 0) + 1);
}

// El peso se mide sobre el TEXTO escrito, que es lo que existe en disco
// despues de UTF-8. Medir `SALIDA.length` daria el numero de caracteres, y
// con acentos esa cifra no es el tamano del archivo.
const bytes = Buffer.byteLength(texto, "utf8");

const excedeElTope = elegidas.length > LIMITE;

console.log("demo-catalog.ts generado");
console.log(`  ${SALIDA}`);
console.log(`  ${(bytes / 1024).toFixed(0)} KB, ${elegidas.length} variantes`);
if (excedeElTope) {
  console.log(
    `  aviso: el recorte tiene ${elegidas.length} variantes y el tope es ${LIMITE}. ` +
      `Pasa cuando hay que meter a la fuerza varios codenames de la maqueta y los ` +
      `grupos no caben. El archivo se escribio igual, con la desviacion anotada en ` +
      `su cabecera, asi que no dice una cosa y es otra; lo que no se hizo es ` +
      `elegir por que lado seguir. O se sube LIMITE a proposito, o se reservan ` +
      `cupos antes de que la maqueta los pida.`,
  );
}
console.log(`  ${conRiesgo} con riesgos, ${conSoC} con SoC`);
console.log(
  `  estratos: ${codenamesAmbiguosEnDemo} codenames ambiguos ` +
    `(${filasAmbiguas} filas, ${elegidas.length - filasAmbiguas} directas)`,
);
// Las marcas van entrecomilladas porque hay una que se llama "10 or": suelta se
// lee "10 or 1", que parece un conteo ("diez o una") en vez de una marca con una
// variante. Un renglon de salida que se puede leer de dos maneras no informa de
// nada.
console.log(
  `  ${marcas.size} marcas: ` +
    [...marcas.entries()]
      .sort((a, b) => b[1] - a[1])
      .map(([m, n]) => `"${m}" ${n}`)
      .join(", "),
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

// Un estado que no se pudo mostrar porque las unicas filas disponibles son de
// codenames ambiguos. Se dice con nombre y todo, porque es una decision que
// alguien tiene que poder revertir a proposito: si el dia que hay que mostrarlo
// se rompe un grupo de ambiguedad para meterlo, que quede escrito que se hizo.
if (sinReservar.length) {
  console.log(
    `  aviso: ${sinReservar.join(", ")} no entra; las unicas filas de esos ` +
      `estados son de codenames con varias placas y meter una sola fabricaria ` +
      `un acierto que la base no tiene`,
  );
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

// Pasarse del tope NO es un fallo de este script: el archivo se escribio y su
// cabecera dice la verdad sobre lo que trae. Lo que no debe pasar es que la
// decision se tome sola. Un `npm run db:demo` que sale con 0 cuando el recorte
// va a tener mas de 48 deja constancia de que nadie decide, y asi es como la
// demo se va creciendo sin que nadie decida que hacer con ella.
if (excedeElTope) {
  process.exit(1);
}
