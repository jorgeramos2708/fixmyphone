/**
 * Verifica el bloque "La unidad de medida" del README raíz.
 * ===========================================================================
 *
 * El README declara cuántas comprobaciones tiene cada suite de `npm test`:
 *
 *     #   63  pruebas de catálogo    (…)
 *     #  135  pruebas de IFT         (…)
 *     #     …  pruebas de licencia   (…)
 *     #     …  pruebas de clon       (…)
 *     #     …  pruebas de empaquetado (…)
 *
 * Esa cifra es un número escrito a mano, y ya se pudrió dos veces: decía
 * "16 pruebas de catálogo" cuando eran 59, "22 de empaquetado" cuando eran 36,
 * y ni mencionaba la suite de IFT, que sí corre. Quien puede decir cuántas
 * comprobaciones tiene una suite es la propia suite, al terminar. Este archivo
 * corre cada suite, lee su total real y lo compara contra el bloque.
 *
 * No se toca a las suites: se las ejecuta y se lee su resumen. Si una falla,
 * su total sigue siendo medible (la prueba que falló es una comprobación que
 * corrió), así que la cifra del README se compara con correctas + fallas.
 *
 * Límite honesto: el README declara la cifra de la corrida completa. Si falta
 * el paquete empaquetado (no hay `dist/win-unpacked`), la suite de empaquetado
 * omite un bloque de comprobaciones y su total medido ya no vale para la
 * comparación; entonces esta verificación se omite con una línea aparte en
 * vez de fallar, porque fallar ahí haría que `npm test` no sirviera en una
 * máquina que solo quiere probar otras cosas.
 *
 * Uso:  node tools/probar-unidad-de-medida.mjs
 *       (ya corre dentro de `npm test`)
 */

import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { join, resolve } from "node:path";

const RAIZ = resolve(import.meta.dirname, "..");
const README = readFileSync(join(RAIZ, "README.md"), "utf8");

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

// Cada suite se corre con su propio comando y su resumen se lee con su propia
// forma. El total medido es correctas + fallas: aunque una comprobación falle,
// corrió, y el README declara cuántas comprobaciones tiene la suite.
const SUITES = [
  {
    nombre: "catálogo",
    comando: ["node", "tools\\probar-catalogo.mjs"],
    //  `63 correctas, 0 fallas`
    total: (out) => {
      const m = /(\d+) correctas, (\d+) fallas/.exec(out);
      return m ? Number(m[1]) + Number(m[2]) : null;
    },
  },
  {
    nombre: "IFT",
    comando: ["python", "tools\\probar-if.py"],
    //  `135 pruebas ok, 0 fallas`  o  `N pruebas ok, M FALLAS`
    total: (out) => {
      const m = /(\d+) pruebas ok, (\d+) FALLAS?/i.exec(out);
      return m ? Number(m[1]) + Number(m[2]) : null;
    },
  },
  {
    nombre: "licencia",
    comando: ["node", "tools\\probar-licensing.mjs"],
    total: (out) => {
      const m = /(\d+) correctas, (\d+) fallas/.exec(out);
      return m ? Number(m[1]) + Number(m[2]) : null;
    },
  },
  {
    nombre: "clon",
    comando: ["node", "tools\\probar-clon-limpio.mjs"],
    total: (out) => {
      const m = /(\d+) correctas, (\d+) fallas/.exec(out);
      return m ? Number(m[1]) + Number(m[2]) : null;
    },
  },
  {
    nombre: "empaquetado",
    comando: ["node", "tools\\probar-empaquetado.mjs"],
    // Sin build se omite un bloque entero y el total medido ya no es el de la
    // corrida completa que el README declara. La suite misma lo anuncia.
    omitible: (out) => /comprobacion\(es\) omitida\(s\)/.test(out),
    total: (out) => {
      const m = /(\d+) correctas, (\d+) fallas/.exec(out);
      return m ? Number(m[1]) + Number(m[2]) : null;
    },
  },
];

console.log("La unidad de medida del README");
console.log("-".repeat(32));

for (const suite of SUITES) {
  const declaradoMatch = new RegExp(
    `^\\s*#\\s+(\\d+)\\s+pruebas de ${suite.nombre}\\b`,
    "m",
  ).exec(README);
  if (declaradoMatch === null) {
    check(
      `el bloque "La unidad de medida" declara cuántas pruebas de ${suite.nombre} tiene la suite`,
      false,
      `no aparece "# N pruebas de ${suite.nombre}" en el README raíz. ` +
        "Así sobrevivió la suite de IFT, que corría y nadie la enumeraba",
    );
    continue;
  }
  const declarado = Number(declaradoMatch[1]);

  let salida;
  try {
    salida = execFileSync(suite.comando[0], suite.comando.slice(1), {
      cwd: RAIZ,
      encoding: "utf8",
    });
  } catch (e) {
    salida = String(e.stdout ?? "");
  }

  if (suite.omitible && suite.omitible(salida)) {
    skip(
      `la suite de ${suite.nombre} se omitió (falta el build); ` +
        `su cifra (${declarado}) queda sin verificar esta corrida`,
    );
    continue;
  }

  const real = suite.total(salida);
  check(
    `el README declara ${declarado} pruebas de ${suite.nombre}, y la suite corrió ${real}`,
    real !== null && real === declarado,
    real === null
      ? `no se pudo leer el total de ${suite.nombre} en su salida`
      : `el README dice ${declarado} y la suite corrió ${real}`,
  );
}

console.log("");
if (omitidas) console.log(`${omitidas} verificacion(es) omitida(s).`);
console.log(`${ok} correctas, ${fallos} fallas`);
process.exit(fallos === 0 ? 0 : 1);