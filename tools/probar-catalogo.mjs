/**
 * Prueba del ciclo completo de resolución contra el catálogo real.
 *
 * Se ejecuta con `node` pelado, sin Electron, porque `Catalog` solo depende de
 * `node:sqlite`. Es la forma de saber que la base abre, que la escalera llega al
 * nivel correcto y que los casos difíciles hacen lo que dicen.
 *
 * Uso: node tools/probar-catalogo.mjs
 */

import { DatabaseSync } from "node:sqlite";
import {
  existsSync,
  mkdtempSync,
  copyFileSync,
  readdirSync,
  rmSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve, dirname, basename } from "node:path";

const RAIZ = resolve(import.meta.dirname, "..");
const DB = join(RAIZ, "packages", "device-db", "data", "out", "fixmyphone_device_db.sqlite");

let ok = 0;
let fallos = 0;

function check(nombre, condicion, detalle = "") {
  if (condicion) {
    ok++;
    console.log(`  OK    ${nombre}`);
  } else {
    fallos++;
    console.log(`  FALLA ${nombre}${detalle ? `\n        ${detalle}` : ""}`);
  }
}

if (!existsSync(DB)) {
  console.error(`No existe la base en ${DB}. Ejecuta: npm run db:build`);
  process.exit(1);
}

console.log(`Catalogo: ${DB}`);

// --- La base abre y tiene lo que se espera -------------------------------
const db = new DatabaseSync(DB, { readOnly: true });

const n = db.prepare("SELECT COUNT(*) AS n FROM variant").get();
const nAlias = db.prepare("SELECT COUNT(*) AS n FROM alias").get();
const nFuentes = db.prepare("SELECT COUNT(*) AS n FROM source").get();

console.log("");
console.log("Contenido de la base");
check("734 variantes", Number(n.n) === 734, `hay ${n.n}`);
check("alias registrados", Number(nAlias.n) > 40000, `hay ${nAlias.n}`);
check("fuentes registradas", Number(nFuentes.n) >= 3, `hay ${nFuentes.n}`);

// --- La escalera llega a donde debe --------------------------------------
console.log("");
console.log("Escalera de identificacion");

/** Reproduce la logica de `platform.resolve` sin importar Electron. */
function resolver(props) {
  const codename = props["ro.product.device"];
  const model = props["ro.product.model"];
  const fp = props["ro.build.fingerprint"];

  const porCodename = codename
    ? db.prepare("SELECT codename, variant, marketing_name FROM variant WHERE codename = ?").all(codename)
    : [];

  if (porCodename.length === 1) {
    return { nivel: 3, clave: `${porCodename[0].codename}#${porCodename[0].variant ?? ""}`, n: 1 };
  }
  if (porCodename.length > 1) {
    return { nivel: 3, ambiguo: true, n: porCodename.length };
  }

  if (model) {
    const filas = db
      .prepare(
        `SELECT v.codename, v.variant, v.marketing_name
         FROM variant v, json_each(v.model_numbers) j
         WHERE j.value = ?`,
      )
      .all(model);
    const codenames = [...new Set(filas.map((f) => f.codename))];
    if (codenames.length === 1 && filas.length === 1) {
      return { nivel: 4, clave: `${filas[0].codename}#${filas[0].variant ?? ""}`, n: 1 };
    }
    if (codenames.length > 0) return { nivel: 4, ambiguo: true, n: filas.length };
  }

  if (fp) {
    const pista = fp.split("/")[1];
    if (pista && pista !== codename) {
      const filas = db
        .prepare("SELECT codename, variant FROM variant WHERE codename = ?")
        .all(pista);
      if (filas.length) return { nivel: 5, pista: true, n: filas.length };
    }
  }

  return { nivel: 6, sinResolver: true };
}

// Caso 1: codename unico. Es el camino que mas se usa.
const r1 = resolver({ "ro.product.device": "rq3q", "ro.product.model": "SM-A546E" });
check(
  "Samsung rq3q resuelve por codename (L3)",
  r1.nivel === 3 && !r1.ambiguo,
  JSON.stringify(r1),
);

// Caso 2: un codename que en la base tiene VARIAS variantes. Tiene que decir
// que hay ambiguedad, NO elegir una. Este es el caso cuyo error cuesta un
// equipo: las variantes son placas distintas y la imagen no es intercambiable.
//
// Los codenames salen de la propia base, no de un ejemplo escrito a mano: si
// manana el pipeline deja de traer `garnet`, esta prueba avisa en vez de
// seguir cudaizando un nombre que ya no existe.
const ambiguos = db
  .prepare("SELECT codename, COUNT(*) AS n FROM variant GROUP BY codename HAVING n > 1 ORDER BY n DESC")
  .all();
check("La base tiene codenames con varias variantes", ambiguos.length > 0);
const ej = ambiguos[0];
const r2 = resolver({ "ro.product.device": ej.codename });
check(
  `Codename ambiguo ("${ej.codename}", ${ej.n} variantes) NO se resuelve solo`,
  r2.ambiguo === true,
  `devolvio ${JSON.stringify(r2)}`,
);

// Caso 3: numero de modelo real, sin codename. El numero se toma de la base
// para no inventar uno: el ejemplo anterior uso SM-A536B, que no existe.
const conModelo = db
  .prepare("SELECT codename, model_numbers FROM variant WHERE model_numbers != '[]' LIMIT 1")
  .get();
const modeloReal = JSON.parse(conModelo.model_numbers)[0];
const r3 = resolver({ "ro.product.model": modeloReal });
check(
  `Solo con numero de modelo ("${modeloReal}") da resultado`,
  r3.nivel === 4 || r3.ambiguo === true || r3.pista === true,
  JSON.stringify(r3),
);

// Caso 4: nada reconocible.
const r4 = resolver({ "ro.product.model": "XT-9999" });
check("Equipo desconocido no inventa (L6)", r4.sinResolver === true, JSON.stringify(r4));

// Caso 5: sin datos.
const r5 = resolver({});
check("Sin propiedades no inventa (L6)", r5.sinResolver === true, JSON.stringify(r5));

// --- El campo `variant` puede ser NULL ------------------------------------
console.log("");
console.log("Integridad de los datos");
const sinVariante = db
  .prepare("SELECT COUNT(*) AS n FROM variant WHERE variant IS NULL OR variant = ''")
  .get();
check(
  "Hay variantes sin sufijo (518 de 734)",
  Number(sinVariante.n) === 518,
  `hay ${sinVariante.n}`,
);

// Puertas de verificacion: los `kind` que declares en el tipo deben existir.
const kinds = db.prepare("SELECT DISTINCT verification_gates FROM variant").all();
const todosKinds = new Set();
for (const { verification_gates: g } of kinds) {
  if (!g) continue;
  for (const it of JSON.parse(g)) todosKinds.add(it.kind);
}
const declarados = new Set([
  "hardware", "software", "radio", "bootchain", "storage",
  "display", "audio", "camera", "sensor", "network",
]);
const huerfanos = [...todosKinds].filter((k) => !declarados.has(k));
check(
  `Los ${declarados.size} kind declarados cubren la base`,
  huerfanos.length === 0,
  `sin declarar: ${huerfanos.join(", ")}`,
);

// `release` es texto, no numero. Si alguien lo cambia a number, esto falla.
// `release` es una FECHA EN TEXTO, y ademas puede faltar. Se revisiona solo lo
// que hay: un vacio es "sin dato", que es un estado legitimo, y la app lo
// muestra como tal. Lo que no se permite es texto que no sea una fecha: el
// caso real era el repr de un diccionario entero
// (`"[{'SM-G9006V': '2014-04'}]"`), que el wiki de LineageOS da cuando un
// equipo salio en varios meses segun el pais. Se normaliza en el pipeline.
const releases = db
  .prepare("SELECT DISTINCT release FROM variant WHERE release IS NOT NULL AND release != ''")
  .all();
const noFechas = releases.filter(
  (r) => typeof r.release !== "string" || !/^\d{4}(-\d{2}(-\d{2})?)?$/.test(r.release),
);
check(
  `Todo "release" presente es una fecha (${releases.length} distintos)`,
  noFechas.length === 0,
  `malos: ${noFechas.slice(0, 4).map((r) => JSON.stringify(r.release)).join(", ")}`,
);
// 698 de 734 tienen fecha. Las 36 restantes NO tienen fecha, y esa es la
// respuesta honesta: la fuente no la trae. Antes de la normalizacion, 32 de
// esas 36 tenian algo en la columna que no era una fecha (el `repr` de un
// diccionario, o un mes sin cero). Rellenarlas con una fecha inventada seria
// peors que admitir que no se sabe.
const conFecha = db
  .prepare("SELECT COUNT(*) AS n FROM variant WHERE release IS NOT NULL AND release != ''")
  .get();
check("698 de 734 variantes con fecha de lanzamiento", Number(conFecha.n) === 698, `hay ${conFecha.n}`);

db.close();

// ---------------------------------------------------------------------------
console.log("\nAbrir el artefacto no escribe nada en la carpeta");
// ---------------------------------------------------------------------------
// Esta es la prueba que hace falta y no estaba.
//
// La app abre el catalogo con `readOnly: true`, pero eso NO basta para que
// funcione cuando esta instalado en `C:\Program Files`. En modo WAL, SQLite
// necesita crear un archivo `-shm` al lado para armar el indice, y eso es
// escribir en la CARPETA, no en la base. Bajo Program Files, con el `.exe`
// pidiendo `asInvoker`, esa escritura no esta permitida y la apertura falla.
//
// Se reprodujo de verdad: se lanzo el `.exe` empaquetado y aparecieron
// `fixmyphone_device_db.sqlite-shm` y `-wal` dentro de `resources/catalog/`,
// que nadie habia pedido. El `.exe` abria bien porque la carpeta de desarrollo
// si es escribible, y el fallo solo habria aparecido en la maquina del taller.
//
// POR QUE NO SE QUITA EL PERMISO CON icacls
// -----------------------------------------
// Se podria, y la primera version lo hacia. Es peor: el chmod de Windows deja
// el directorio con una ACL explicita que hay que deshacer a mano, y si el
// script muere antes de deshacerla, el temporal se queda sin borrar y
// `rmSync` revienta con EPERM. Es mas fragil de lo que vale.
//
// Y no aporta nada. Si al abrir no aparece ningun archivo acompanante, es que
// no hubo escritura, y la carpeta habria podido ser de solo lectura. La
// propiedad que importa es "no se crea nada al lado", y eso se comprueba
// directamente.
{
  const sandbox = mkdtempSync(join(tmpdir(), "fmp-abrir-"));
  const destino = join(sandbox, "fixmyphone_device_db.sqlite");
  try {
    copyFileSync(DB, destino);

    // El PRAGMA necesita su propia conexion, y hay que CERRARLA. Encadenar
    // `new DatabaseSync(p).prepare(s).get()` y Tirar el descriptor es la via
    // rapida de dejar el archivo abierto: la conexion se queda viva hasta que
    // el recolector de basura pase por ahi, y mientras tanto el temporal no se
    // puede borrar en Windows. Sevio asi, con un `---- no se pudo borrar` en
    // cada corrida.
    const paraModo = new DatabaseSync(destino, { readOnly: true });
    const modo = paraModo.prepare("PRAGMA journal_mode").get();
    paraModo.close();

    check(
      "La base se entrega en journal_mode DELETE",
      String(modo.journal_mode).toLowerCase() === "delete",
      `journal_mode = ${modo.journal_mode}`,
    );

    let consulto = 0;
    let motivo = "";
    try {
      const soloLectura = new DatabaseSync(destino, { readOnly: true });
      consulto = Number(
        soloLectura.prepare("SELECT COUNT(*) AS n FROM variant").get().n,
      );
      soloLectura.close();
    } catch (e) {
      motivo = e instanceof Error ? e.message : String(e);
    }
    check(
      "Se abre y se consulta en solo lectura",
      consulto > 0,
      motivo || `trajo ${consulto} variantes`,
    );

    const acompanantes = readdirSync(sandbox).filter((f) => f !== basename(destino));
    check(
      "Abrirla no deja archivos acompanantes en la carpeta",
      acompanantes.length === 0,
      `aparecieron: ${acompanantes.join(", ") || "ninguno"}`,
    );
  } finally {
    // En Windows, cerrar un SQLite no siempre libera el archivo al instante y
    // el primer `rm` se va con EPERM. Se reintenta con pausas cortas. Si
    // tampoco se puede, se avisa y se deja el temporal: son 12 MB en la
    // carpeta de temporales, y tumbar la prueba entera por eso seria peor.
    for (let intento = 0; intento < 6; intento++) {
      try {
        rmSync(sandbox, { recursive: true, force: true, maxRetries: 3, retryDelay: 100 });
        break;
      } catch {
        await new Promise((r) => setTimeout(r, 150));
      }
    }
    if (existsSync(sandbox)) {
      console.log(`  ----  no se pudo borrar el temporal ${sandbox}`);
    }
  }
}

console.log("");
console.log(`${ok} correctas, ${fallos} fallas`);
process.exit(fallos === 0 ? 0 : 1);
