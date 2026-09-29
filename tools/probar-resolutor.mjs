/**
 * Comprobaciones del resolutor real (`platform.resolve`).
 * ===========================================================================
 *
 *   npm run test:resolutor
 *
 * Cierra el hueco más incómodo del catálogo: la escalera se probaba contra
 * una COPIA de su propia lógica. `probar-catalogo.mjs` (correctamente) no
 * importaba Electron y no podía importar `platform.ts`, así que reescribió
 * la escalera a mano en su sección de identificación. Una copia puede
 * desviarse del producto sin que nada se rompa: si mañana `platform.resolve`
 * empieza a elegir en un caso ambiguo, la copia sigue pasando en verde.
 *
 * Esta suite no copia nada: empaqueta `apps/desktop/src/main/platform.ts` y
 * `catalog.ts` con esbuild (el mismo transpilador que usa el build real) y
 * ejecuta el `Platform` real contra la base real. Los casos no se escriben a
 * mano: salen de la propia base (codenames ambiguos, modelos compartidos,
 * pistas de huella reales), igual que el resto de las suites del proyecto.
 *
 * Límite honesto: esto ejercita el método `resolve` directamente, que es
 * donde viven las decisiones de la escalera. No abre una ventana: que el
 * texto que la persona lee llegue a la pantalla es trabajo de la guarda del
 * asar (`probar-empaquetado.mjs`), no de esta suite.
 *
 * Uso:  node tools/probar-resolutor.mjs
 *       (ya corre dentro de `npm test`)
 */

import { existsSync, mkdtempSync, rmSync, readFileSync, writeFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { tmpdir } from "node:os";
import { pathToFileURL } from "node:url";
import { DatabaseSync } from "node:sqlite";

const RAIZ = resolve(import.meta.dirname, "..");
const DB = join(RAIZ, "packages", "device-db", "data", "out", "fixmyphone_device_db.sqlite");
const DESKTOP = join(RAIZ, "apps", "desktop", "src", "main");
const PLATFORM_TS = join(DESKTOP, "platform.ts");
const CATALOG_TS = join(DESKTOP, "catalog.ts");

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

function seccion(titulo) {
  console.log(`\n${titulo}`);
  console.log("-".repeat(titulo.length));
}

if (!existsSync(DB)) {
  console.error(`No existe la base en ${DB}. Ejecuta: npm run db:build`);
  process.exit(1);
}

// ---------------------------------------------------------------------------
// El resolver de la app, empaquetado y cargado
// ---------------------------------------------------------------------------

let build;
try {
  ({ build } = await import("esbuild"));
} catch {
  console.error(
    "No está esbuild (viene con vite, en node_modules de la raíz). Ejecuta: npm install",
  );
  process.exit(1);
}

// El traspaso real es este: un entry de dos líneas que reexporta las clases
// del fuente. Esbuild resuelve los `./catalog.js` y `./public-key.js` del
// fuente a sus `.ts` y deja un solo artefacto ESM que Node puede importar.
const dirTemp = mkdtempSync(join(tmpdir(), "fmp-resolutor-"));
const entrada = join(dirTemp, "entrada.ts");
const bundleFile = join(dirTemp, "resolutor.mjs");

let Platform;
let Catalog;

seccion("El resolutor real, empaquetado desde el fuente actual");

{
  const u = (p) => p.replace(/\\/g, "/");
  writeFileSync(
    entrada,
    [
      `export { Platform } from ${JSON.stringify(u(PLATFORM_TS))};`,
      `export { Catalog } from ${JSON.stringify(u(CATALOG_TS))};`,
    ].join("\n"),
  );
}

{
  const u = (p) => p.replace(/\\/g, "/");
  let exito = false;
  let motivo = "";
  try {
    await build({
      entryPoints: [entrada],
      outfile: bundleFile,
      bundle: true,
      platform: "node",
      format: "esm",
      target: "node24",
      charset: "utf8",
      logLevel: "silent",
    });
    exito = true;
  } catch (e) {
    motivo = String(e?.message ?? e);
  }
  check("esbuild empaqueta el resolutor real desde el fuente actual", exito, motivo);
  if (!exito) {
    rmSync(dirTemp, { recursive: true, force: true });
    process.exit(1);
  }
}

try {
  const mod = await import(pathToFileURL(bundleFile).href);
  Platform = mod.Platform;
  Catalog = mod.Catalog;
  check("El bundle carga y expone Platform y Catalog", !!Platform && !!Catalog);
} catch (e) {
  check("El bundle carga y expone Platform y Catalog", false, String(e?.stack ?? e));
  rmSync(dirTemp, { recursive: true, force: true });
  process.exit(1);
}

// Las cadenas que esta suite afirma las lee del PROPIO fuente, como hace la
// guarda del asar: si una cadena deja de estar en `platform.ts`, el fallo es
// de esta prueba y no del bundle, y no disfrazado de "falta texto en el
// paquete". Y se comprueba que viajen al bundle: sin eso, esta suite podría
// estar ejecutando otra cosa.
const fuentePlatform = readFileSync(PLATFORM_TS, "utf8");
const bundleTexto = readFileSync(bundleFile, "utf8");
const cadenasReales = [
  {
    aguja: "Coincidencia exacta de codename",
    porQue: "el nombre del nivel 3, el camino que más se usa",
  },
  {
    aguja: "Pista por huella de compilación",
    porQue: "el nombre del nivel 5, donde la huella es pista y no prueba",
  },
  {
    aguja: "El equipo conectado no expone ro.product.device",
    porQue: "la razón del corte en L2, donde el producto se niega con causa",
  },
];

for (const { aguja, porQue } of cadenasReales) {
  check(
    `la cadena del resolutor viaja del fuente al bundle (${porQue})`,
    fuentePlatform.includes(aguja) && bundleTexto.includes(aguja),
    fuentePlatform.includes(aguja)
      ? "la cadena está en el fuente pero no llegó al bundle"
      : `LA PRUEBA: la cadena que busco no existe en platform.ts: ${JSON.stringify(aguja)}`,
  );
}

check(
  "El bundle del resolutor no importa electron",
  !/from\s*["']electron["']/.test(bundleTexto) &&
    !/require\s*\(\s*["']electron["']\s*\)/.test(bundleTexto),
  "si el resolutor dependiera de electron, no se podría ejecutar en node; "
    + "el dominio se mantiene desacoplado a propósito",
);

// ---------------------------------------------------------------------------
// La base real
// ---------------------------------------------------------------------------

{
  const catalog = new Catalog();
  let variantes = 0;
  try {
    catalog.open(DB);
    variantes = catalog.stats().variants;
  } catch {
    variantes = 0;
  }
  check("La base real abre y trae las 756 variantes", variantes === 756, `trajo ${variantes}`);

  const datos = join(dirTemp, "datos");
  const platform = new Platform({ catalog, dataDir: datos });

  const db = new DatabaseSync(DB, { readOnly: true });
  const resolver = (props, transporte = "adb") => platform.resolve(props, transporte);

  // -------------------------------------------------------------------------
  seccion("Los casos reales de la escalera");
  // -------------------------------------------------------------------------

  // ---- Caso 1: codename único. El camino que más se usa. ------------------
  const r1 = resolver({
    "ro.product.device": "rq3q",
    "ro.product.model": "SM-A546E",
    "ro.product.manufacturer": "samsung",
    "ro.product.brand": "samsung",
    "ro.build.fingerprint":
      "samsung/rq3q/rq3q:13/TP1A.220624.014/A546EXXU6AWF1:user/release-keys",
  });
  check(
    "Samsung rq3q + SM-A546E resuelve por codename (L3)",
    r1.match?.codename === "rq3q" &&
      r1.ladder.some((l) => l.level === 3 && l.name === "Coincidencia exacta de codename"),
    JSON.stringify(r1).slice(0, 400),
  );
  check(
    "la escalera narra la marca y el modelo antes de decidir (L1)",
    r1.ladder.some(
      (l) => l.level === 1 && l.name === "Marca y modelo comercial" && l.evidence.includes("samsung"),
    ),
    JSON.stringify(r1.ladder).slice(0, 400),
  );
  check(
    "la escalera dice qué codename leyó (L2)",
    r1.ladder.some((l) => l.level === 2 && l.evidence.includes("rq3q")),
    JSON.stringify(r1.ladder).slice(0, 400),
  );

  // ---- Caso 2: codename con VARIAS variantes. No elige: entrega todas. ----
  const ambiguos = db
    .prepare("SELECT codename, COUNT(*) AS n FROM variant GROUP BY codename HAVING n > 1 ORDER BY n DESC")
    .all();
  check("La base tiene codenames con varias variantes", ambiguos.length > 0);
  const ej = ambiguos[0];
  const r2 = resolver({ "ro.product.device": ej.codename });
  const clavesOk =
    Array.isArray(r2.alternatives) &&
    r2.alternatives.length === ej.n &&
    r2.alternatives.every((v) => v.codename === ej.codename);
  check(
    `Codename ambiguo ("${ej.codename}", ${ej.n} variantes) NO resuelve solo`,
    r2.match === null,
    JSON.stringify({ match: r2.match?.key, alternativas: r2.alternatives.length }),
  );
  check(
    "y entrega las N candidatas, todas de ese codename",
    clavesOk,
    `esperaba ${ej.n} candidatas de "${ej.codename}" y devolvió ${JSON.stringify(r2.alternatives.map((v) => v.key))}`,
  );
  check(
    "y la razón dice que hay más de una variante",
    typeof r2.unresolvedReason === "string" && r2.unresolvedReason.includes("más de una variante"),
    JSON.stringify(r2.unresolvedReason),
  );

  // -------------------------------------------------------------------------
  seccion("La ambigüedad que sí se puede resolver");
  // -------------------------------------------------------------------------

  // Los codenames y números salen de la base. `sePuede` es un codename ambiguo
  // cuyo número de modelo pertenece a una sola de sus variantes: ahí la
  // herramienta SÍ decide, y decide esa variante.
  const sePuede = db
    .prepare(
      `SELECT v.codename, v.variant, j.value AS modelo
       FROM variant v, json_each(v.model_numbers) j
       WHERE v.codename IN (
         SELECT codename FROM variant GROUP BY codename HAVING COUNT(*) > 1
       )
       AND NOT EXISTS (
         SELECT 1 FROM variant v2, json_each(v2.model_numbers) j2
         WHERE v2.codename = v.codename AND j2.value = j.value AND v2.variant <> v.variant
       )
       LIMIT 1`,
    )
    .get();

  if (!sePuede) {
    check("Hay un codename ambiguo que un número de modelo desambigua", false,
      "la base ya no tiene ningún caso así; esta prueba se puede quitar, pero no se debe dejar pasar");
  } else {
    const r6 = resolver({
      "ro.product.device": sePuede.codename,
      "ro.product.model": sePuede.modelo,
    });
    const decide = r6.match !== null && r6.match.key === `${sePuede.codename}#${sePuede.variant}`;
    check(
      `Codename ambiguo ("${sePuede.codename}") más modelo "${sePuede.modelo}" decide (L4)`,
      decide &&
        r6.ladder.some((l) => l.level === 4 && l.name === "Coincidencia por número de modelo"),
      `match=${JSON.stringify(r6.match?.key)}; esperado ${sePuede.codename}#${sePuede.variant}`,
    );
    check(
      "y una decisión no arrastra candidatas fantasma",
      r6.match !== null && Array.isArray(r6.alternatives) && r6.alternatives.length === 0,
      `alternatives=${JSON.stringify(r6.alternatives?.map((v) => v.key))}`,
    );
  }

  // -------------------------------------------------------------------------
  seccion("Los cortes que el producto hace");
  // -------------------------------------------------------------------------

  // Sin codename el producto se niega en L2, aunque el modelo sea real. Esta
  // fue una mentira vieja de la copia de la escalera (resolvía con modelo
  // solo) y la prueba quedó para que nadie "arregle" el producto metiendo un
  // atajo. Aquí se prueba contra el producto, no contra la copia.
  const conModelo = db
    .prepare("SELECT codename, model_numbers FROM variant WHERE model_numbers != '[]' LIMIT 1")
    .get();
  const modeloReal = JSON.parse(conModelo.model_numbers)[0];
  const r3 = resolver({ "ro.product.model": modeloReal });
  check(
    `Solo con número de modelo ("${modeloReal}") NO alcanza: el producto corta en L2`,
    r3.match === null &&
      typeof r3.unresolvedReason === "string" &&
      r3.unresolvedReason.includes("ro.product.device"),
    JSON.stringify({ match: r3.match?.key, razon: r3.unresolvedReason }),
  );
  const r5 = resolver({});
  check(
    "Sin ninguna propiedad tampoco alcanza (corte L2)",
    r5.match === null &&
      typeof r5.unresolvedReason === "string" &&
      r5.unresolvedReason.includes("ro.product.device"),
    JSON.stringify({ match: r5.match?.key, razon: r5.unresolvedReason }),
  );

  // Un modelo con un solo dueño en la base, para que el caso sea decidible.
  const conModeloUnico = db
    .prepare(
      `SELECT v.codename, v.variant, j.value AS modelo
       FROM variant v, json_each(v.model_numbers) j
       GROUP BY j.value
       HAVING COUNT(*) = 1
       LIMIT 1`,
    )
    .get();
  const r16 = resolver({
    "ro.product.device": "codename-que-la-base-no-tiene",
    "ro.product.model": conModeloUnico.modelo,
  });
  check(
    `Codename desconocido + modelo real "${conModeloUnico.modelo}" sí decide (L4)`,
    r16.match !== null && r16.match.codename === conModeloUnico.codename,
    `match=${JSON.stringify(r16.match?.key)}; esperado ${conModeloUnico.codename}#${conModeloUnico.variant}`,
  );

  // Un codename desconocido y sin modelo se dice sin resolver, sin inventar.
  const rDesc = resolver({ "ro.product.device": "codename-que-la-base-no-tiene" });
  check(
    "Un codename que la base no conoce se dice sin resolver, sin inventar",
    rDesc.match === null &&
      Array.isArray(rDesc.alternatives) &&
      rDesc.alternatives.length === 0 &&
      typeof rDesc.unresolvedReason === "string" &&
      rDesc.unresolvedReason.includes("no conoce este equipo"),
    JSON.stringify({ match: rDesc.match?.key, alt: rDesc.alternatives.length, razon: rDesc.unresolvedReason }),
  );

  // Un modelo compartido por varias variantes del mismo codename NO decide:
  // elegir la primera sería inventar.
  const compartido = db
    .prepare(
      `SELECT v.codename, j.value AS modelo, COUNT(DISTINCT v.variant) AS n
       FROM variant v, json_each(v.model_numbers) j
       WHERE v.codename IN (
         SELECT codename FROM variant GROUP BY codename HAVING COUNT(*) > 1
       )
       GROUP BY v.codename, j.value
       HAVING n > 1
       LIMIT 1`,
    )
    .get();

  if (!compartido) {
    check("Hay un número de modelo que pertenece a varias variantes", false,
      "la base ya no tiene ningún caso así; se puede quitar esta prueba");
  } else {
    const r7 = resolver({
      "ro.product.device": compartido.codename,
      "ro.product.model": compartido.modelo,
    });
    check(
      `Modelo compartido ("${compartido.modelo}", ${compartido.n} variantes) NO se resuelve solo`,
      r7.match === null,
      `match=${JSON.stringify(r7.match?.key)}`,
    );
    check(
      "y entrega las candidatas del modelo compartido",
      Array.isArray(r7.alternatives) && r7.alternatives.length === compartido.n,
      `alternatives=${JSON.stringify(r7.alternatives?.map((v) => v.key))}`,
    );
  }

  // -------------------------------------------------------------------------
  seccion("La pista por huella de compilación");
  // -------------------------------------------------------------------------

  // La huella apunta a un codename real (único, para que la lista sea una
  // sola placa). Es una PISTA: nunca una coincidencia.
  const pistaOk = db
    .prepare(
      "SELECT codename FROM variant GROUP BY codename HAVING COUNT(*) = 1 ORDER BY codename LIMIT 1",
    )
    .get();
  const r9 = resolver({
    "ro.product.device": "modelo-sin-registrar",
    "ro.build.fingerprint": `marca/${pistaOk.codename}/${pistaOk.codename}:13/TP1A.220624.014/X:user/release-keys`,
  });
  check(
    `La pista de huella hacia "${pistaOk.codename}" es alternativa, no coincidencia (L5)`,
    r9.match === null &&
      r9.ladder.some((l) => l.level === 5 && l.name === "Pista por huella de compilación") &&
      Array.isArray(r9.alternatives) &&
      r9.alternatives.length === 1 &&
      r9.alternatives[0].codename === pistaOk.codename,
    JSON.stringify({ match: r9.match?.key, alt: r9.alternatives?.map((v) => v.codename) }),
  );

  // -------------------------------------------------------------------------
  seccion("El punto de partida (L0)");
  // -------------------------------------------------------------------------

  const rAdb = resolver({}, "adb");
  const rFastboot = resolver({}, "fastboot");
  check(
    'L0 narra el transporte: adb → "Conexión ADB"',
    rAdb.ladder[0]?.level === 0 && rAdb.ladder[0].name === "Conexión ADB",
    JSON.stringify(rAdb.ladder[0]),
  );
  check(
    'L0 narra el transporte: fastboot → "Modo fastboot"',
    rFastboot.ladder[0]?.level === 0 &&
      rFastboot.ladder[0].name === "Modo fastboot" &&
      rFastboot.ladder[0].evidence.includes("Android"),
    JSON.stringify(rFastboot.ladder[0]),
  );

  // -------------------------------------------------------------------------
  seccion("El barrido de las 756");
  // -------------------------------------------------------------------------

  // Cada codename de la base, con nada más que ese codename. Los únicos
  // resuelven a su placa; los ambiguos no fabrican coincidencia y entregan el
  // número exacto de candidatas. Es el invariante que costaría un equipo si
  // se perdiera: la imagen que se flashea depende de la placa, no del nombre.
  {
    const grupos = db
      .prepare("SELECT codename, COUNT(*) AS n FROM variant GROUP BY codename")
      .all();
    const unicos = grupos.filter((g) => Number(g.n) === 1);
    const ambiguosGrupo = grupos.filter((g) => Number(g.n) > 1);

    const fallosUnicos = [];
    for (const g of unicos) {
      const r = resolver({ "ro.product.device": g.codename });
      if (r.match?.codename !== g.codename) fallosUnicos.push(g.codename);
    }
    check(
      `Barrido: los ${unicos.length} codenames únicos resuelven a su placa`,
      fallosUnicos.length === 0,
      `no resolvieron: ${fallosUnicos.slice(0, 3).join(", ")}`,
    );

    const fallosAmbig = [];
    for (const g of ambiguosGrupo) {
      const r = resolver({ "ro.product.device": g.codename });
      const n = Number(g.n);
      if (r.match !== null || !Array.isArray(r.alternatives) || r.alternatives.length !== n) {
        fallosAmbig.push(`${g.codename} (n=${n}, match=${r.match?.key ?? "~"}, alt=${r.alternatives?.length ?? "~"})`);
      }
    }
    check(
      `Barrido: los ${ambiguosGrupo.length} codenames ambiguos no fabrican coincidencia y entregan sus N candidatas`,
      fallosAmbig.length === 0,
      `fallaron: ${fallosAmbig.slice(0, 3).join("; ")}`,
    );
  }

  catalog.close();
  db.close();
}

rmSync(dirTemp, { recursive: true, force: true });

// ---------------------------------------------------------------------------
console.log("");
console.log(`${ok} correctas, ${fallos} fallas`);
process.exit(fallos === 0 ? 0 : 1);