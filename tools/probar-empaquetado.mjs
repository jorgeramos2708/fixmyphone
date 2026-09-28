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
import { DatabaseSync } from "node:sqlite";

let babelParse = null;
try {
  ({ parse: babelParse } = await import("@babel/parser"));
} catch {
  console.error(
    "No está @babel/parser (es una dependencia de vite). Ejecuta: npm install",
  );
  process.exit(1);
}

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
// Utilidades del UI DEL PRODUCTO que el CSS empaquetado tiene que traer.
// ---------------------------------------------------------------------------
// Tailwind v4 detecta el contenido de forma automatica desde la raiz del
// paquete donde corre el build. El UI vive en packages/app/src, FUERA de
// apps/desktop y apps/web-demo: si el escaneo deja de verlo (regresion de
// monorepo), el CSS se entrega sin las utilidades de las pantallas y la
// interfaz se ve distorsionada —el shell abierto en fila en vez de columna,
// los paneles sin fondo ni columnas, los textos con el tamano del navegador—
// sin que ninguna comprobacion de texto lo note. Estas utilidades son
// obligatorias para que la herramienta se vea como herramienta; si una deja de
// viajar, esta prueba dice cual.
const UTILIDADES_DEL_UI = [
  ".flex-col{",
  ".h-screen{",
  ".bg-surface{",
  ".h-11{",
  ".text-body{",
  ".w-\\[200px\\]{",
  ".grid-cols-",
];

function utilidadesFaltantes(textoCss) {
  return UTILIDADES_DEL_UI.filter((u) => !textoCss.includes(u));
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

  // La guarda de utilidades primero sobre texto fabricado: que reporta nada
  // cuando el css las trae, y que acusa cuando falta una. Si la primera se
  // rompiera, la segunda seguiria avisando (y al reves).
  check(
    "La guarda de utilidades no reporta nada con un css que las trae",
    utilidadesFaltantes(UTILIDADES_DEL_UI.join(" ")).length === 0,
    `marca como faltantes: ${utilidadesFaltantes(UTILIDADES_DEL_UI.join(" ")).join(", ") || "ninguna, mal"}`,
  );
  check(
    "y detecta si una utilidad del producto falta en el css",
    utilidadesFaltantes(".flex-col{flex-direction:column;} .bg-surface{background:#ffffff;}").includes(".h-screen{"),
    "un css sin .h-screen{ deberia reportarlo",
  );

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

  if (css) {
    const p = join(OUT, "renderer", "assets", css[1]);
    if (existsSync(p)) {
      const textoCss = readFileSync(p, "utf8");
      const faltantes = utilidadesFaltantes(textoCss);
      check(
        "El CSS empaquetado trae las utilidades de las pantallas",
        faltantes.length === 0,
        faltantes.length > 0 ? `faltan: ${faltantes.join(", ")}` : "",
      );
    }
  }

  // `lang` y `charset` en el html base: sin `lang="es-MX"`, el corrector de
  // Windows y los lectores de pantalla tratan toda la interfaz como ingles.
  check("El html declara lang=es-MX", /lang="es-MX"/.test(html));
}

// ---------------------------------------------------------------------------
seccion("El texto que la persona lee, dentro del asar");
// ---------------------------------------------------------------------------
// Que el codigo compile no dice nada de lo que se LEE. El bundle va minificado y
// los identificadores se renombran, asi que buscar `resolveLocal` en el asar no
// demuestra nada: solo que el archivo se copio. Lo que importa es que el texto
// viaje entero, con sus acentos, y sobre todo que NO viaje la frase que el
// producto dejo de decir.
//
// Por eso se buscan CADENAS DE UI, y cada una se cruza contra el fuente antes
// de buscarla en el asar. Si una cadena que el asar deberia traer no esta en el
// fuente, el fallo es de esta prueba y no del empaquetado, y se reporta como tal
// en vez de disfrazarse de "falta texto en el asar".
//
// Las agujas curadas tienen un hueco: un cambio PURAMENTE ADITIVO (una frase
// nueva que no toca ninguna aguja) no invalidaba un asar viejo. Se cierra con un
// inventario automático del texto que el fuente RENDERIZA: se extrae con el
// parser del propio build y se exige entero en el asar, sin que nadie lo cure.
//
// El lado contrario —que el asar NO traiga una frase que el fuente ya no
// renderiza— se midió y no se pudo automatizar con honestidad: extrayendo el
// texto del bundle del renderer con el mismo parser y comparando las frases en
// español contra las fuentes, un build SANO produce falsos positivos, porque la
// compilación FUSIONA en runtime el texto que en el fuente está separado por
// expresiones (`{expr}`): así, "verificar que no <resultado> clave pública" se
// lee en el bundle como un run continuo que el fuente no tiene. Una guarda que
// llore en verde es peor que una lista curada; por eso las frases `vieja` de
// arriba siguen curadas a mano, y este párrafo documenta el límite en vez de
// esconderlo.

// El renderer de escritorio son estas 9 fuentes (entry-electron monta App;
// App monta las cuatro pantallas y el shell; Shell usa primitives; Equipo
// importa core/bridge, que lleva los tooltips de homologación). El inventario
// tiene que cubrir TODO lo que el bundle puede renderizar: si una frase nueva
// aparece en cualquiera de estas pantallas, el asar viejo tiene que fallar.
const FUENTES_DE_UI = [
  join(RAIZ, "packages", "app", "src", "entry-electron.tsx"),
  join(RAIZ, "packages", "app", "src", "App.tsx"),
  join(RAIZ, "packages", "app", "src", "components", "shell.tsx"),
  join(RAIZ, "packages", "app", "src", "components", "primitives.tsx"),
  join(RAIZ, "packages", "app", "src", "screens", "EquipoScreen.tsx"),
  join(RAIZ, "packages", "app", "src", "screens", "DiagnosticoScreen.tsx"),
  join(RAIZ, "packages", "app", "src", "screens", "InformeScreen.tsx"),
  join(RAIZ, "packages", "app", "src", "screens", "LicenciaScreen.tsx"),
  join(RAIZ, "packages", "core", "src", "bridge.ts"),
];

const CADENAS_DE_UI = [
  {
    aguja: "placas posibles y no vamos a elegir una",
    fuente: "EquipoScreen.tsx",
    porQue: "el encabezado del caso ambiguo",
  },
  {
    aguja: "placas posibles, ninguna elegida",
    fuente: "EquipoScreen.tsx",
    porQue: "el subtitulo del panel en el caso ambiguo",
  },
  {
    aguja: "dicen cuál de las ",
    fuente: "EquipoScreen.tsx",
    porQue: "el parrafo honesto, que ya no le atribuye un conteo al codename",
  },
  {
    aguja: "No vamos a adivinar",
    fuente: "EquipoScreen.tsx",
    porQue: "el cierre del parrafo",
  },
  {
    aguja: "ninguna variante con esos datos",
    fuente: "EquipoScreen.tsx",
    porQue: "el texto honesto del caso que no aplica",
  },
  {
    aguja: "No reconocimos este equipo",
    fuente: "EquipoScreen.tsx",
    porQue: "el mensaje de equipo desconocido, que sigue existiendo aparte",
  },
  {
    aguja: "Variantes candidatas",
    fuente: "InformeScreen.tsx",
    porQue: "la fila del informe",
  },
  {
    aguja: "sin elegir",
    fuente: "InformeScreen.tsx",
    porQue: "el sufijo de la fila cuando hay candidatas",
  },
  // Frases viejas. No deben viajar ni en el fuente ni en el asar.
  {
    aguja: "variantes de placa distintas",
    vieja: true,
    porQue: "frase del parrafo viejo que atribuia el conteo al codename",
  },
  {
    aguja: "no hay una variante que coincida",
    vieja: true,
    porQue: "frase vieja que era falsa cuando hay candidatas",
  },
  {
    aguja: "ex Servidores",
    vieja: true,
    porQue: "residuo del comentario viejo de Resolution.alternatives",
  },
  {
    aguja: "cuando hubo que adivinar",
    vieja: true,
    porQue: "la otra mitad de ese comentario viejo",
  },
];

/**
 * Los textos que el fuente renderiza o expone, extraídos con el parser del
 * propio build. Todo lo que devuelve SALE del fuente: si una frase nueva
 * aparece en pantalla, esta aquí sin que nadie la cure.
 *
 * Se colapsa el whitespace porque el build junta los trozos de texto JSX; se
 * saltan los especificadores de import y los miembros de tipos, que no llegan
 * al bundle.
 */
function inventarioDeTexto(fuentePorNombre) {
  const inventario = new Set();
  let error = null;

  const colapsa = (t) => t.replace(/\s+/g, " ").trim();
  const esSpecifier = (nodo, padre) =>
    [
      "ImportDeclaration",
      "ExportNamedDeclaration",
      "ExportAllDeclaration",
      "ImportExpression",
    ].includes(padre?.type);
  const estaEnTipo = (nodo) => {
    for (let n = nodo; n; n = n.parentNode) {
      if (n.type === "TSLiteralType" || n.type === "TSTypeAliasDeclaration") return true;
    }
    return false;
  };

  for (const [nombre, codigo] of Object.entries(fuentePorNombre)) {
    let ast;
    try {
      ast = babelParse(codigo, {
        sourceType: "module",
        plugins: ["typescript", "jsx"],
      });
    } catch (e) {
      error = `no se pudo parsear ${nombre}: ${e.message}`;
      break;
    }
    (function walk(n, padre) {
      if (!n || typeof n !== "object") return;
      if (Array.isArray(n)) {
        for (const hijo of n) walk(hijo, padre);
        return;
      }
      n.parentNode = padre;
      const esLiteral = n.type === "StringLiteral";
      const esJsx = n.type === "JSXText";
      if (esLiteral) {
        if (esSpecifier(n, n.parentNode) || estaEnTipo(n)) return;
      } else if (!esJsx) {
        for (const k of Object.keys(n)) {
          if (k === "loc" || k === "start" || k === "end" || k === "extra" || k === "parentNode") continue;
          walk(n[k], n);
        }
        return;
      }
      const t = colapsa(esLiteral ? n.value : n.value);
      if (t.length >= 3 && /\p{L}/u.test(t)) inventario.add(t);
    })(ast, null);
  }

  return { textos: [...inventario], error };
}

/**
 * Devuelve la lista de problemas del asar. Vacia = el texto de UI esta entero y
 * es el que la persona va a leer.
 */
function problemasDeTextoDeUi(asar, fuentePorNombre) {
  const texto = asar.toString("utf8");
  const problemas = [];

  for (const { aguja, fuente, vieja, porQue } of CADENAS_DE_UI) {
    const esta = texto.includes(aguja);

    if (vieja) {
      // Una frase que quiero ausente. Si sigue en el FUENTE, la pantalla la
      // sigue diciendo y el asar solo la acompana: el defecto esta antes.
      const enFuente = Object.entries(fuentePorNombre)
        .filter(([, t]) => t.includes(aguja))
        .map(([n]) => n);
      if (enFuente.length > 0) {
        problemas.push(
          `${porQue}: sigue presente en ${enFuente.join(", ")}`,
        );
      } else if (esta) {
        problemas.push(`${porQue}: viaja en el asar sin estar en el fuente`);
      }
      continue;
    }

    if (!fuentePorNombre[fuente]?.includes(aguja)) {
      problemas.push(
        `LA PRUEBA: la cadena que busco no existe en ${fuente}: ${JSON.stringify(aguja)}`,
      );
      continue;
    }
    if (!esta) problemas.push(`falta en el asar: ${porQue}`);
  }

  // El inventario automático. Los textos del fuente que llegan a la pantalla
  // se exigen todos en el asar: un cambio aditivo (una frase nueva que no
  // toca ninguna aguja curada) se detecta igual, porque el asar viejo no la
  // tiene.
  const inv = inventarioDeTexto(fuentePorNombre);
  if (inv.error) {
    problemas.push(`LA PRUEBA: ${inv.error}`);
  } else {
    const faltantes = inv.textos.filter((t) => !texto.includes(t));
    if (faltantes.length) {
      problemas.push(
        `el asar no trae ${faltantes.length} texto(s) que el fuente renderiza: ` +
          faltantes
            .slice(0, 5)
            .map((t) => JSON.stringify(t.slice(0, 60)))
            .join(", ") +
          (faltantes.length > 5 ? ", ..." : ""),
      );
    }
  }

  // Cuantas veces aparece el encabezado del caso ambiguo. Una vez es lo
  // correcto: si aparece dos, la rama ambigua y la de "no reconocimos" estan
  // mostrando el mismo texto, que es el defecto.
  const veces = texto.split("placas posibles y no vamos a elegir una").length - 1;
  if (veces !== 1) {
    problemas.push(`el encabezado del caso ambiguo aparece ${veces} veces, y tiene que aparecer 1`);
  }

  // El asar NO debe llevar la maqueta web: el ejecutable usa la base completa.
  for (const pesa of ["SIMULADOS", "browser-bridge", "web-demo"]) {
    if (texto.includes(pesa)) {
      problemas.push(`el asar del ejecutable trae la maqueta web (${pesa})`);
    }
  }

  return problemas;
}

{
  const fuentePorNombre = {};
  for (const ruta of FUENTES_DE_UI) {
    fuentePorNombre[ruta.split(/[\\/]/).pop()] = readFileSync(ruta, "utf8");
  }

  // Un paquete de mentira con el texto que SI tiene que estar. No describe el
  // asar real: sirve de base para mutarlo y ver si la guarda se da cuenta.
  const inv = inventarioDeTexto(fuentePorNombre);
  check(
    "el inventario de textos del fuente se pudo extraer",
    !inv.error,
    inv.error ?? "",
  );
  const tokens = [
    ...new Set([
      ...CADENAS_DE_UI.filter((c) => !c.vieja).map((c) => c.aguja),
      ...inv.textos,
    ]),
  ];
  const unido = (lista) => lista.join(" ");
  const limpio = Buffer.from(unido(tokens), "utf8");

  check(
    "La guarda de texto de UI no reporta nada con un paquete que si trae el texto",
    problemasDeTextoDeUi(limpio, fuentePorNombre).length === 0,
    problemasDeTextoDeUi(limpio, fuentePorNombre).join("; "),
  );

  // Y ahora al reves: siete mutaciones, un defecto cada una. Una guarda que no
  // se rompe con esto no esta mirando lo que dice mirar. Cada mutacion opera
  // con TOKENS enteros (agujas + inventario), no con subcadenas: si le
  // pedimos a la guarda que note la ausencia de una frase, la frase tiene que
  // haberse ido de verdad, no quedarse camuflada dentro de una frase vecina.
  const TITULO = "placas posibles y no vamos a elegir una";

  // Un token del inventario que no este embebido en otro: su ausencia es
  // detectable por el inventario y no se esconde dentro de una frase vecina.
  const sola =
    inv.textos.find(
      (t) => t.length > 20 && !inv.textos.some((o) => o !== t && o.includes(t)),
    ) ?? inv.textos[inv.textos.length - 1];

  const mutaciones = [
    {
      nombre: "se borra el encabezado del caso ambiguo",
      datos: unido(tokens.filter((t) => t !== TITULO)),
      espera: "falta en el asar: el encabezado del caso ambiguo",
    },
    {
      nombre: "vuelve la frase vieja que atribuia el conteo al codename",
      datos: unido([
        ...tokens,
        "ese nombre interno cubre 7 variantes de placa distintas, ",
      ]),
      espera: "viaja en el asar sin estar en el fuente",
    },
    {
      nombre: "vuelve el comentario viejo de Resolution.alternatives",
      datos: unido([...tokens, "/* Apple's ex Servidores */"]),
      espera: "viaja en el asar sin estar en el fuente",
    },
    {
      nombre: "se duplica el encabezado: dos ramas con el mismo texto",
      datos: unido([...tokens, TITULO]),
      espera: "y tiene que aparecer 1",
    },
    {
      nombre: "entra la maqueta web en el asar del ejecutable",
      datos: unido([...tokens, "SIMULADOS web-demo browser-bridge"]),
      espera: "trae la maqueta web",
    },
    {
      nombre: "el cierre pasa a una promesa que el producto no cumple",
      // La frase vive dos veces en el paquete de mentira: como aguja curada
      // ("No vamos a adivinar") y como token entero ("No vamos a adivinar.").
      // Para que la ausencia sea real hay que quitar las dos.
      datos: unido(
        tokens.map((t) =>
          t.includes("No vamos a adivinar")
            ? "Vamos a adivinar la placa mas probable"
            : t,
        ),
      ),
      espera: "falta en el asar: el cierre del parrafo",
    },
    {
      // El hueco que las agujas curadas dejaban abierto: una frase NUEVA en el
      // fuente que no toca ninguna aguja. El asar viejo no la trae, y la
      // guarda tiene que darse cuenta por el inventario, sin aguja nueva.
      nombre:
        "el asar viejo no trae un texto que el fuente si renderiza (cambio aditivo)",
      datos: unido(tokens.filter((t) => t !== sola)),
      espera: "no trae 1 texto(s) que el fuente renderiza",
    },
  ];

  for (const { nombre, datos, espera } of mutaciones) {
    check(
      `La guarda de texto de UI detecta si ${nombre}`,
      datos !== limpio.toString(),
      "la mutacion no cambio nada: la prueba no probaria nada",
    );
    const p = problemasDeTextoDeUi(Buffer.from(datos, "utf8"), fuentePorNombre);
    check(
      `La guarda de texto de UI detecta si ${nombre} (motivo)`,
      p.some((x) => x.includes(espera)),
      `esperaba algo como "${espera}" y salio: ${p.join("; ") || "nada, que es peor"}`,
    );
  }
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

  // La misma guarda de arriba, ahora sobre el asar de verdad. Lo que se revisa
  // aqui no es que el archivo este, sino lo que DICE: que el texto de la pantalla
  // viaje entero y que no viaje la frase vieja.
  const asar = join(res, "app.asar");
  if (existsSync(asar)) {
    const fuentePorNombre = {};
    for (const ruta of FUENTES_DE_UI) {
      fuentePorNombre[ruta.split(/[\\/]/).pop()] = readFileSync(ruta, "utf8");
    }
    const problemas = problemasDeTextoDeUi(readFileSync(asar), fuentePorNombre);
    check(
      "El asar trae el texto de UI nuevo y no el viejo",
      problemas.length === 0,
      problemas.join("; "),
    );
  }

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

  // La comprobacion de arriba mira la CARPETA. Esta abre el ARCHIVO, que es lo
  // que importa: una base en WAL no necesita tener un `-shm` SENTADO al lado
  // para fallar en Program Files, lo crea en el momento de abrirla. La carpeta
  // limpia con la base en WAL es un estado que parece bien y no lo esta.
  if (existsSync(db)) {
    const abierto = new DatabaseSync(db, { readOnly: true });
    const modo = abierto.prepare("PRAGMA journal_mode").get();
    const variantes = abierto
      .prepare("SELECT COUNT(*) AS n FROM variant")
      .get();
    abierto.close();

    check(
      "El catalogo del paquete se entrega en journal_mode DELETE",
      String(modo.journal_mode).toLowerCase() === "delete",
      `journal_mode = ${modo.journal_mode}. ` +
        "En WAL, abrirlo en una carpeta de solo lectura falla.",
    );
    check(
      "El catalogo del paquete abre y trae las variantes",
      Number(variantes.n) > 700,
      `trajo ${variantes.n} variantes`,
    );
  }

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
