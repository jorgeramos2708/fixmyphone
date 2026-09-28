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
  readFileSync,
  rmSync,
  statSync,
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

/**
 * Reproduce la logica de `platform.resolve` sin importar Electron.
 *
 * La escalera se baja SIEMPRE hasta el fondo. Un codename ambiguo no es una
 * respuesta: solo significa que ese nivel no alcanza, y el nivel 4 (número de
 * modelo) puede decidir sin problema. La version anterior de esta funcion
 * cortaba en el nivel 3 con "ambiguo" y nunca llegaba al 4, asi que la prueba
 * pasaba por un motivo equivocado: afirmaba que un codename ambiguo no se
 * resuelve nunca, cuando en realidad si se resuelve siempre que el número de
 * modelo pertenezca a una sola de las variantes.
 *
 * En la base hay 87 codenames con varias variantes y en 59 de ellos un numero de
 * modelo identifica una sola placa. Negarse es el final raro, no el comun.
 */
function resolver(props) {
  const codename = props["ro.product.device"];
  const model = props["ro.product.model"];
  const fp = props["ro.build.fingerprint"];

  const claveDe = (f) => `${f.codename}#${f.variant ?? ""}`;

  // --- L2: sin codename no hay por donde empezar -------------------------
  // El producto corta aqui. En una ROM recortada o en recovery no se expone
  // `ro.product.device`, y sin el no se cruza nada.
  if (!codename) {
    return { nivel: 2, sinResolver: true, motivo: "el equipo no expone ro.product.device" };
  }

  // --- L3: el catálogo conoce el codename --------------------------------
  const porCodename = db
    .prepare("SELECT codename, variant, marketing_name FROM variant WHERE codename = ?")
    .all(codename);

  if (porCodename.length === 1) {
    return { nivel: 3, clave: claveDe(porCodename[0]), n: 1 };
  }
  // Con 0 no se dice nada y con mas de uno se sigue bajando. En los dos casos
  // el nivel 3 no contesta la pregunta.

  // --- L4: número de modelo ----------------------------------------------
  if (model) {
    const filas = db
      .prepare(
        `SELECT v.codename, v.variant, v.marketing_name
         FROM variant v, json_each(v.model_numbers) j
         WHERE j.value = ?`,
      )
      .all(model);

    if (filas.length === 1) {
      return { nivel: 4, clave: claveDe(filas[0]), n: 1 };
    }
    if (filas.length > 1) {
      // Aqui si se niega, y con la lista de candidatas a la vista.
      return {
        nivel: 4,
        ambiguo: true,
        n: filas.length,
        alternativas: filas.map(claveDe),
      };
    }
  }

  // --- L5: huella de compilación -----------------------------------------
  if (fp) {
    const pista = fp.split("/")[1];
    if (pista && pista !== codename) {
      const filas = db
        .prepare("SELECT codename, variant FROM variant WHERE codename = ?")
        .all(pista);
      if (filas.length) {
        return {
          nivel: 5,
          pista: true,
          n: filas.length,
          alternativas: filas.map(claveDe),
        };
      }
    }
  }

  // --- L6: nada dio una coincidencia única -------------------------------
  return {
    nivel: 6,
    sinResolver: porCodename.length === 0,
    ambiguo: porCodename.length > 1,
    n: porCodename.length,
    alternativas: porCodename.map(claveDe),
  };
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

// OJO, esto cambio y hay que entender por que. La version anterior de esta
// prueba afirmaba que con un numero de modelo basta para dar resultado. No es lo
// que hace el producto: `platform.resolve` corta en el nivel 2 cuando no hay
// codename, y dice por que ("el equipo no expone ro.product.device, que es el
// dato con el que se identifica"). La prueba pasaba porque su copia de la
// escalera no cortaba ahi, no porque el producto resolviera eso.
//
// La decision del producto es defendible y conviene dejarla escrita: los numeros
// de modelo no son globales, dos marcas distintas pueden escribir el mismo, y el
// codename es el ancla. Un numero de modelo sin codename es un dato que en el
// mejor de los casos acierta y en el peor cruza dos marcas. Ahi se prefiere
// negarse.
//
// La prueba queda para que nadie "arregle" el codename metiendo un atajo que
// resuelva con numero solo, que es el cambio que si seria peligroso.
check(
  `Solo con numero de modelo ("${modeloReal}") NO alcanza, sin codename`,
  r3.nivel === 2 && r3.sinResolver === true,
  `devolvio ${JSON.stringify(r3)}`,
);
check(
  "y el motivo dice que falta el codename, no que no se encontro nada",
  typeof r3.motivo === "string" && r3.motivo.includes("ro.product.device"),
  `motivo=${JSON.stringify(r3.motivo)}`,
);

// Caso 4: nada reconocible.
const r4 = resolver({ "ro.product.model": "XT-9999" });
check("Equipo desconocido no inventa (L6)", r4.sinResolver === true, JSON.stringify(r4));

// Caso 5: sin datos.
const r5 = resolver({});
check("Sin propiedades no inventa (L6)", r5.sinResolver === true, JSON.stringify(r5));

// ---------------------------------------------------------------------------
// El codename ambiguo NO es la ultima palabra
// ---------------------------------------------------------------------------
console.log("");
console.log("Ambiguedad que si se puede resolver");

// La ambiguedad del codename se baja siempre hasta el fondo. Aqui esta el caso
// que separa a las dos mitades de la escalera: hay N variantes con el mismo
// codename, y el numero de modelo que reporta el equipo pertenece a una sola de
// ellas. Ahi la herramienta SI puede decir cual es, y se dice.
//
// Si este caso se perdia, la herramienta se negaria en la mitad de los equipos
// reales, y negarse sin motivo es tan malo como adivinar: hace que el tecnico
// busque por su cuenta, que es donde si se empezar a flashear la placa que no es.
//
// El codename y el numero salen de la propia base, no de un ejemplo escrito a
// mano. `Mi439` esta hoy con cuatro variantes (Redmi 7A, Redmi 8, Redmi 8A y
// Redmi 8A Dual) y sus dieciseis numeros de modelo se reparten sin repetir uno
// entre variantes: cualquiera de ellos identifica una sola placa.
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
  check("Hay un codename ambiguo que un numero de modelo desambigua", false,
    "la base ya no tiene ningun caso asi; esta prueba se puede quitar, pero no se debe dejar pasar");
} else {
  const r6 = resolver({
    "ro.product.device": sePuede.codename,
    "ro.product.model": sePuede.modelo,
  });
  check(
    `Codename ambiguo ("${sePuede.codename}") mas modelo "${sePuede.modelo}" SI decide`,
    r6.nivel === 4 && r6.clave === `${sePuede.codename}#${sePuede.variant}`,
    `devolvio ${JSON.stringify(r6)}; se esperaba nivel 4 y la variante ${sePuede.variant}`,
  );
  check(
    "y no se niega a la vez que puede decidir",
    r6.ambiguo !== true,
    `devolvio ${JSON.stringify(r6)}`,
  );
}

// ---------------------------------------------------------------------------
// Aqui si se niega, y con la lista de candidatas a la vista
// ---------------------------------------------------------------------------
console.log("");
console.log("Negarse con las candidatas a la vista");

// El numero de modelo esta en la base pero pertenece a mas de una variante del
// mismo codename. Aqui la herramienta tiene un dato que PARECE decidir y no
// decide: elegir la primera seria inventar, y la diferencia entre las variantes
// es justo lo que define que imagen se puede flashear.
//
// Se busca en la base porque es un caso raro: hay codenames con un solo numero
// de modelo repetido en varias variantes (Lenovo A6020, por ejemplo). Escribir
// uno a mano seria un numero que podria dejar de existir.
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
  check("Hay un numero de modelo que pertenece a varias variantes", false,
    "la base ya no tiene ningun caso asi; se puede quitar esta prueba");
} else {
  const r7 = resolver({
    "ro.product.device": compartido.codename,
    "ro.product.model": compartido.modelo,
  });
  check(
    `Modelo compartido ("${compartido.modelo}", ${compartido.n} variantes) NO se resuelve solo`,
    r7.ambiguo === true,
    `devolvio ${JSON.stringify(r7)}`,
  );
  check(
    "y entrega las N candidatas, no una",
    Array.isArray(r7.alternativas) && r7.alternativas.length === compartido.n,
    `alternativas=${JSON.stringify(r7.alternativas)}`,
  );
  check(
    "y las candidatas son claves de variante, no nombres de venta",
    Array.isArray(r7.alternativas) && r7.alternativas.every((k) => /^[^#]+#/.test(k)),
    `alternativas=${JSON.stringify(r7.alternativas)}`,
  );
}

// El tercer caso de negarse: codename ambiguo y numero de modelo que la base no
// tiene. Ni L3 ni L4 alcanzan, y sin numero de modelo no hay nada mas que
// intentar. Tambien aqui la respuesta es la lista, no una eleccion.
const sinModelo = db
  .prepare(
    `SELECT codename, COUNT(*) AS n FROM variant
     GROUP BY codename HAVING n > 1
     ORDER BY codename LIMIT 1`,
  )
  .get();
const r8 = resolver({ "ro.product.device": sinModelo.codename });
check(
  `Codename ambiguo sin modelo ("${sinModelo.codename}", ${sinModelo.n}) NO se resuelve solo`,
  r8.ambiguo === true,
  `devolvio ${JSON.stringify(r8)}`,
);
check(
  "y también entrega las N candidatas",
  Array.isArray(r8.alternativas) && r8.alternativas.length === sinModelo.n,
  `alternativas=${JSON.stringify(r8.alternativas)}`,
);

// --- El recorte de la maqueta no puede fabricar certeza ---------------------
//
// La maqueta web carga un recorte de 48 variantes en vez de las 734 de la base.
// Ese recorte es un archivo generado, y hay una forma facil de corromperlo en la
// que nada se rompe visiblemente: quedarse con UNA sola fila de un codename que
// en la base tiene cuatro placas.
//
// El efecto es que el resolutor de la maqueta ve una coincidencia unica y
// responde "equipo identificado, aqui esta la variante" con toda la seguridad de
// un acierto, mientras que el `.exe` con la base completa se negaria. La demo
// queda mas confiada que el producto, que es al reves de como debe ser, y quien
// la mire no tiene forma de notarlo.
//
// Estas tres pruebas existen para que eso no pueda pasar en silencio:
//
//   1. Ningun codename ambiguo en la base puede llegar con una sola fila.
//   2. Los grupos que si llegan tienen que llegar COMPLETOS.
//   3. Tiene que quedar al menos un codename ambiguo, porque la promesa central
//      del producto es no elegir cuando hay varias placas y sin un caso asi no
//      hay nada que evaluar.
console.log("");
console.log("El recorte de la maqueta no fabrica certeza");

const DEMO_CAT = join(RAIZ, "packages", "app", "src", "data", "demo-catalog.ts");
if (!existsSync(DEMO_CAT)) {
  check("el recorte de la maqueta existe", false,
    `falta ${DEMO_CAT}; se regenera con \`npm run db:demo\``);
} else {
  const textoDemo = readFileSync(DEMO_CAT, "utf8");
  // Se leen las claves del archivo generado. No se importa: es TypeScript y este
  // archivo corre con node pelado, sin build.
  const clavesDemo = [...textoDemo.matchAll(/"key":\s*"([^"]+)"/g)].map((m) => m[1]);

  check("el recorte tiene claves de variante legibles", clavesDemo.length > 0,
    "cambio el formato del archivo generado?");

  const filasPorCodenameDemo = new Map();
  for (const k of clavesDemo) {
    const cn = k.split("#")[0];
    filasPorCodenameDemo.set(cn, (filasPorCodenameDemo.get(cn) ?? 0) + 1);
  }

  const basesPorCodename = new Map(
    db.prepare("SELECT codename, COUNT(*) AS n FROM variant GROUP BY codename").all()
      .map((r) => [r.codename, r.n]),
  );

  // (1) ninguna fila sola de un codename que en la base es ambiguo
  const solos = [...filasPorCodenameDemo.entries()].filter(
    ([cn, n]) => n === 1 && (basesPorCodename.get(cn) ?? 1) > 1,
  );
  check(
    "Ningun codename ambiguo en la base llega con una sola fila al recorte",
    solos.length === 0,
    solos.length
      ? `llegan solos: ${solos.map(([cn]) => `${cn} (la base tiene ${basesPorCodename.get(cn)})`).join(", ")}. ` +
        "Un codename ambiguo entra con su grupo entero o no entra; una fila sola " +
        "hace que la maqueta afirme una certeza que el producto no tiene."
      : "",
  );

  // (2) los grupos que llegan, llegan enteros
  const gruposDemo = [...filasPorCodenameDemo.entries()].filter(([, n]) => n > 1);
  const incompletos = gruposDemo.filter(
    ([cn, n]) => (basesPorCodename.get(cn) ?? 0) !== n,
  );
  check(
    "y los grupos que si llegan estan completos",
    incompletos.length === 0,
    incompletos.length
      ? `${incompletos.map(([cn, n]) => `${cn}: ${n} de ${basesPorCodename.get(cn)}`).join(", ")}. ` +
        "Un grupo incompleto hace que la maqueta anuncie menos candidatas de las que hay."
      : "",
  );

  // (3) quede al menos un caso de ambiguedad que se pueda ver
  check(
    "y queda al menos un codename ambiguo en el recorte",
    gruposDemo.length > 0,
    "sin ningun grupo ambiguo no hay forma de ver que la herramienta se negaria",
  );

  console.log(
    `        (${gruposDemo.length} codenames ambiguos en el recorte: ` +
      `${gruposDemo.map(([cn, n]) => `${cn} x${n}`).join(", ") || "ninguno"})`,
  );

  // --- La cabecera del archivo generado no afirma nada falso ---------------
  //
  // El archivo dice de si mismo cuantos trimmed tiene y de donde sale. Eso es
  // una afirmacion sobre su propio contenido, y por eso se puede comprobar: se
  // cuentan las claves y se cuentan las de la base. Una cabecera que dice 48 y
  // trae 52 no esta "un poco desactualizada": esta mintiendo sobre el archivo
  // que la precede, y es el unico documento que alguien va a leer para saber de
  // donde sale la demo.
  console.log("");
  console.log("La cabecera del recorte no se contradice con el recorte");

  const cabeceraDemo = textoDemo.slice(0, textoDemo.indexOf("export const DEMO_CATALOG"));
  const totalBase = db.prepare("SELECT COUNT(*) AS n FROM variant").get().n;

  const dice = (re) => {
    const m = re.exec(cabeceraDemo);
    return m ? Number(m[1]) : null;
  };

  const declaradosEnCabecera = dice(/recorte de (\d+) variantes/);
  check(
    "La cabecera declara cuantas variantes trae el archivo",
    declaradosEnCabecera !== null,
    "no se encontro 'recorte de N variantes' en la cabecera",
  );
  if (declaradosEnCabecera !== null) {
    check(
      `y ese numero es el de verdad (${clavesDemo.length})`,
      declaradosEnCabecera === clavesDemo.length,
      `la cabecera dice ${declaradosEnCabecera} y el archivo trae ${clavesDemo.length}`,
    );
  }

  const fuenteEnCabecera = dice(/SQLite completo: (\d+) variantes/);
  check(
    "La cabecera declara cuantas variantes tiene el catalogo completo",
    fuenteEnCabecera !== null,
    "no se encontro 'SQLite completo: N variantes' en la cabecera",
  );
  if (fuenteEnCabecera !== null) {
    check(
      `y ese numero es el de la base (${totalBase})`,
      fuenteEnCabecera === Number(totalBase),
      `la cabecera dice ${fuenteEnCabecera} y la base tiene ${totalBase}`,
    );
  }

  // El peso tambien es una afirmacion sobre otro archivo. La cabecera decia
  // "12 MB" desde hace tiempo y el archivo pesa 13: no habria forma de notarlo
  // leyendo, y es el mismo defecto que el conteo, con un numero que ademas
  // depende de como se mida. Se mide con stat del archivo que la cabecera nombra.
  const pesoEnCabecera = (() => {
    const m = /SQLite completo: \d+ variantes, (\d+) MB/.exec(cabeceraDemo);
    return m ? Number(m[1]) : null;
  })();
  const DB_REAL = join(RAIZ, "packages", "device-db", "data", "out", "fixmyphone_device_db.sqlite");
  check(
    "La cabecera declara el peso del catalogo completo",
    pesoEnCabecera !== null,
    "no se encontro 'N MB' junto al total de la cabecera",
  );
  if (pesoEnCabecera !== null && existsSync(DB_REAL)) {
    const mbReal = Math.round(statSync(DB_REAL).size / 1024 / 1024);
    check(
      `y ese peso es el de verdad (${mbReal} MB)`,
      pesoEnCabecera === mbReal,
      `la cabecera dice ${pesoEnCabecera} MB y el archivo pesa ${mbReal} MB. ` +
        "Un peso escrito a mano se queda viejo sin que nadie lo note.",
    );
  }

  // Los cupos salen de CUPOS en el generador. Si alguien los cambia y la prosa
  // no, el archivo describe una reparticion que no es la que se aplico.
  const generador = readFileSync(join(RAIZ, "tools", "generar-demo-catalog.mjs"), "utf8");
  const cupoDe = (n) => {
    const m = new RegExp(`const CUPOS = \\{[^}]*\\b${n}: (\\d+)`).exec(generador);
    return m ? Number(m[1]) : null;
  };
  for (const [nombre, n] of [["ambigua", cupoDe("ambigua")], ["directa", cupoDe("directa")], ["diversa", cupoDe("diversa")]]) {
    if (n === null) continue;
    check(
      `La cabecera repite el cupo de ${nombre} (${n}) que dice el generador`,
      cabeceraDemo.includes(`${n} `) || cabeceraDemo.includes(` ${n} `),
      `la cabecera no menciona el ${n} de ${nombre}`,
    );
  }

  // Y la desviacion: si el recorte se pasa del tope, la cabecera tiene que
  // decirlo. Un archivo que se pasa del tope en silencio es el caso que la
  // seccion de arriba no alcanza a ver, porque las pruebas de datos siguen
  // dando bien.
  const limite = (() => {
    const m = /const LIMITE = (\d+)/.exec(generador);
    return m ? Number(m[1]) : null;
  })();
  if (limite !== null && declaradosEnCabecera !== null) {
    const sePasa = clavesDemo.length > limite;
    const loDice = /tope de este recorte son \d+ variantes/.test(cabeceraDemo);
    check(
      sePasa
        ? "el recorte se pasa del tope y la cabecera lo dice"
        : "el recorte cabe en el tope y la cabecera no inventa una desviacion",
      sePasa === loDice,
      sePasa
        ? `hay ${clavesDemo.length} y el tope son ${limite}, pero la cabecera no lo anota`
        : `hay ${clavesDemo.length} y el tope son ${limite}, pero la cabecera anota una desviacion que no hay`,
    );
  }
}

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
