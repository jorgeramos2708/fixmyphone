/**
 * Comprobaciones del build de escritorio.
 * ===========================================================================
 *
 *   npm run test:dist
 *
 * Que el codigo compile no dice nada sobre que la app funcione. Estas
 * comprobaciones miran lo que se ENTREGA, que es donde han salido los fallos de
 * verdad de este proyecto.
 *
 * HECHOS QUE ESTA ARCHIVO EXISTE PARA ATRAPAR
 * -------------------------------------------
 *
 * 1. El preload apuntaba a `out/preload/index.mjs` y electron-vite emite
 *    `out/preload/index.js`. La ventana abria, con su titulo correcto y su
 *    mensaje de error en medio, y no podia hacer NADA. Tres commits sin que
 *    nadie lo notara. Electron no avisa: escribe en stderr y sigue.
 *
 * 2. El catalogo se entregaba en `journal_mode=WAL`. Al abrirlo, SQLite crea
 *    un `-shm` al lado, que es escribir en la CARPETA. Instalado bajo
 *    `C:\Program Files`, con el `.exe` pidiendo `asInvoker`, eso no esta
 *    permitido y el taller se queda sin catalogo en su maquina. En la carpeta
 *    de desarrollo si funciona, porque si es escribible, asi que ni probandolo
 *    en local se ve.
 *
 * 3. Los datos del usuario iban a `%APPDATA%\@fixmyphone\desktop`, porque
 *    Electron saca el nombre de `package.json`, y ahi el nombre del paquete es
 *    `@fixmyphone/desktop`. `productName` solo estaba en `electron-builder.yml`,
 *    que Electron no lee.
 *
 * Los tres se encontraron mirando la carpeta equivocada. Esta prueba mira la
 * correcta.
 *
 * Que no se haya visto ninguno a tiempo no es culpa de quien construye: la
 * app empaquetada es un `.exe` de 116 MB y la unica forma de saber que abre
 * bien es abrirlo. Estas pruebas no lo abren, pero hacen el trabajo de abrirlo
 * casi todos: revisan los mismos archivos que Electron abriria.
 */

import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import { join, resolve, dirname, isAbsolute } from "node:path";
import { fileURLToPath } from "node:url";

const RAIZ = resolve(import.meta.dirname, "..");
const DESKTOP = join(RAIZ, "apps", "desktop");
const OUT = join(DESKTOP, "out");
const UNPACKED = join(DESKTOP, "dist", "win-unpacked");

let ok = 0;
let fallos = 0;
let omitidas = 0;

function check(nombre, condicion, detalle = "") {
  if (condicion) {
    ok++;
    console.log(`  OK    ${nombre}`);
  } else {
    fallos++;
    console.log(`  FALLA ${nombre}${detalle ? `\n        ${detalle}` : ""}`);
  }
}

function skip(motivo) {
  omitidas++;
  console.log(`  ----  ${motivo}`);
}

function seccion(titulo) {
  console.log(`\n${titulo}`);
  console.log("-".repeat(titulo.length));
}

// ---------------------------------------------------------------------------
seccion("El build de electron-vite");
// ---------------------------------------------------------------------------

if (!existsSync(OUT)) {
  console.log("\nNo hay build. Ejecuta `npm run build` primero.");
  process.exit(1);
}

const mainJs = join(OUT, "main", "index.js");
const preloadJs = join(OUT, "preload", "index.js");
const rendererHtml = join(OUT, "renderer", "index.html");

check("Esta out/main/index.js", existsSync(mainJs));
check("Esta out/preload/index.js", existsSync(preloadJs));
check("Esta out/renderer/index.html", existsSync(rendererHtml));

// ---------------------------------------------------------------------------
seccion("El preload que pide el proceso principal existe de verdad");
// ---------------------------------------------------------------------------

// Se saca la ruta del propio bundle en vez de repetirla aqui. Si aqui se
// escribiera `preload/index.js` a mano, la prueba compararia la constante con
// si misma y no encontraria nunca nada. Lo que importa es lo que el bundle
// DICE, no lo que este archivo cree que dice.
{
  const fuente = readFileSync(mainJs, "utf8");

  // electron-vite deja la ruta como `new URL("../preload/INDEX",import.meta.url)`.
  const encontrado = /new URL\("([^"]*preload[^"]*)"/.exec(fuente);
  check("El bundle menciona una ruta de preload", encontrado !== null);

  if (encontrado) {
    const relativo = encontrado[1];
    const resuelto = isAbsolute(relativo)
      ? relativo
      : join(OUT, "main", relativo);

    check(
      `La ruta que pide el bundle existe (${relativo})`,
      existsSync(resuelto),
      `buscada en ${resuelto}`,
    );

    if (existsSync(resuelto)) {
      const kb = statSync(resuelto).size / 1024;
      check(
        "El preload no esta vacio",
        kb > 0.2,
        `pesa ${kb.toFixed(2)} KB; un preload de 0 bytes expone un puente de 0 metodos`,
      );
    }
  }

  // La comprobacion concreta del fallo historico, aparte. Se lee como lo que
  // es: "no vuelvas a escribir .mjs aqui".
  check(
    "El bundle NO pide un preload .mjs",
    !/preload\/index\.mjs/.test(fuente),
    "electron-vite emite .js; volver a poner .mjs deja la app sin puente",
  );
}

// ---------------------------------------------------------------------------
seccion("El preload no usa nada que el modo sandbox no pueda");
// ---------------------------------------------------------------------------
// Con `sandbox: true` el preload corre en un contexto sin Node. Si el bundle
// llama a `require("node:...")` o importa un modulo nativo, Electron lo rechaza
// en silencio al cargar y el puente no se expone. Es el mismo sintoma que el
// punto 1, por otra causa.
{
  const fuente = readFileSync(preloadJs, "utf8");
  const usaNode =
    /require\("node:/.test(fuente) ||
    /from\s*["']node:/.test(fuente) ||
    /\bprocess\.binding\b/.test(fuente);

  check(
    "El preload no pide modulos de node:",
    !usaNode,
    "con sandbox: true eso no existe en el preload y falla al cargar",
  );
  check(
    "El preload expone el puente en window",
    /contextBridge/.test(fuente),
    "sin contextBridge no hay window.fmp",
  );
}

// ---------------------------------------------------------------------------
seccion("El renderer carga un bundle y una hoja de estilo");
// ---------------------------------------------------------------------------
{
  const html = readFileSync(rendererHtml, "utf8");
  const js = /src="\.\/assets\/(index-[^"]+\.js)"/.exec(html);
  const css = /href="\.\/assets\/(index-[^"]+\.css)"/.exec(html);

  check("El html referencia un bundle de JS", js !== null);
  check("El html referencia una hoja de estilos", css !== null);

  if (js) {
    const p = join(OUT, "renderer", "assets", js[1]);
    check(`Esta el bundle ${js[1]}`, existsSync(p));
    if (existsSync(p)) {
      const mb = statSync(p).size / 1024 / 1024;
      // electron-vite NO minifica por omision. Sin `minify: "esbuild"` en la
      // config sale React de desarrollo y el bundle se va a 700 kB.
      check(
        "El bundle esta minificado",
        mb < 0.4,
        `${mb.toFixed(2)} MB; con React de desarrollo se pasa de 0.7 MB`,
      );
    }
  }

  // `lang` y `charset` en el html base: sin `lang="es-MX"`, el corrector de
  // Windows y los lectores de pantalla tratan toda la interfaz como ingles.
  check("El html declara lang=es-MX", /lang="es-MX"/.test(html));
}

// ---------------------------------------------------------------------------
seccion("El paquete empaquetado");
// ---------------------------------------------------------------------------

if (!existsSync(UNPACKED)) {
  skip("No hay dist/win-unpacked. Ejecuta `npm run dist` para comprobarlo.");
} else {
  const res = join(UNPACKED, "resources");
  const catalogDir = join(res, "catalog");
  const db = join(catalogDir, "fixmyphone_device_db.sqlite");

  check("Esta resources/app.asar", existsSync(join(res, "app.asar")));

  // El catalogo tiene que viajar DENTRO de resources/, no en el asar: son
  // 12 MB de datos que no cambian entre versiones y que se pueden inspeccionar
  // sin desempacar nada.
  check("El catalogo viaja en resources/catalog/", existsSync(db));
  if (existsSync(db)) {
    const mb = statSync(db).size / 1024 / 1024;
    check("El catalogo pesa al menos 10 MB", mb > 10, `${mb.toFixed(2)} MB`);
  }

  // El punto 2. Si hay un `-shm` o un `-wal` aqui, alguien abrio el catalogo en
  // modo escritura desde la propia carpeta de instalacion.
  const acompanantes = existsSync(catalogDir)
    ? readdirSync(catalogDir).filter((f) => f !== "fixmyphone_device_db.sqlite")
    : [];
  check(
    "La carpeta del catalogo no tiene archivos acompanantes",
    acompanantes.length === 0,
    `aparecieron: ${acompanantes.join(", ")}. ` +
      "Salen de abrir la base en WAL; el artefacto tiene que ir en DELETE.",
  );

  // El punto 3.
  const pkg = JSON.parse(
    readFileSync(join(DESKTOP, "package.json"), "utf8"),
  );
  check(
    "package.json declara productName",
    typeof pkg.productName === "string" && pkg.productName.length > 0,
    "sin esto Electron usa el name con arroba y los datos van a %APPDATA%\\@fixmyphone",
  );
  check(
    "productName no lleva arroba ni barra",
    typeof pkg.productName === "string" && /^[^@/\\]+$/.test(pkg.productName),
    String(pkg.productName),
  );
}

// ---------------------------------------------------------------------------
console.log("");
if (omitidas) console.log(`${omitidas} comprobacion(es) omitida(s).`);
console.log(`${ok} correctas, ${fallos} fallas`);
process.exit(fallos === 0 ? 0 : 1);
