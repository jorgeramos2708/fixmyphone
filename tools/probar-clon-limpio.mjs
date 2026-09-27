/**
 * ¿La clave que genera un clon limpio es la que la app tiene embebida?
 *
 * Responde a una trampa real del flujo documentado. El README dice:
 *
 *     fmp-license keygen
 *     fmp-license issue --tier premium ...
 *
 * En una maquina que ya tiene `~/.fixmyphone/issuer.key` eso funciona. En un
 * CLON LIMPIO, `keygen` crea una clave nueva, distinta de la que la app
 * lleva embebida, y la licencia que emite no la acepta nadie. Y el CLI dice
 * que es valida, porque `verify` comprueba contra la clave local, no contra
 * la de la app. El taller ve "Firma valida" y un rechazo en la pantalla.
 *
 * Uso:  node tools/probar-clon-limpio.mjs
 */

import { existsSync, mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { spawnSync } from "node:child_process";
import { join, resolve } from "node:path";
import { createHash } from "node:crypto";
import {
  bytesToPrivateKey,
  generateKeyPair,
  issueLicense,
  publicKeyFrom,
  publicKeyToBytes,
  verifyLicense,
} from "../packages/licensing/src/index.ts";

const RAIZ = resolve(import.meta.dirname, "..");
const EMBEDIDA = readFileSync(
  join(RAIZ, "apps", "desktop", "src", "main", "public-key.ts"),
  "utf8",
);

let ok = 0;
let fallas = 0;

function check(nombre, condicion, detalle = "") {
  if (condicion) {
    ok++;
    console.log(`  OK    ${nombre}`);
  } else {
    fallas++;
    console.log(`  FALLA ${nombre}${detalle ? `\n        ${detalle}` : ""}`);
  }
}

console.log("\nLa clave de demostracion que viaja en el repo");
console.log("-".repeat(48));

// ---------------------------------------------------------------------------
// La privada se publica a proposito. Es la unica forma de que alguien que
// clone el repositorio pueda probar el producto completo sin hablar con
// nadie, y el README promete exactamente eso.
//
// El precio es que la app de este repositorio NO PUEDE cobrar: la verificacion
// es offline y hay una sola clave publica embebida, asi que no hay forma de
// distinguir una licencia de demostracion de una de verdad. Quien tenga la
// privada puede emitir las que quiera, para siempre.
//
// Es una decision consciente y esta escrita en tres sitios, porque es facil
// olvidarla en seis meses y regalar premium gratis sin darse cuenta. Cuando
// haya clientes de verdad: `keygen`, copiar la publica nueva a
// `public-key.ts`, recompilar. La demo deja de servir, que es justo lo que
// tiene que pasar.
//
// El archivo lleva el aviso escrito dentro, en lineas que empiezan por `#`, y
// esta funcion las quita. Un archivo que se puede leer a ojo y a la vez por
// el programa, que es la unica forma de que el aviso siga a la clave cuando
// alguien copia el archivo a otro lado.
// ---------------------------------------------------------------------------
function leerClaveDemo() {
  const crudo = readFileSync(
    join(RAIZ, "packages", "licensing", "demo-issuer.key.txt"),
    "utf8",
  );
  return crudo
    .split("\n")
    .filter((l) => l.trim() && !l.trimStart().startsWith("#"))
    .join("")
    .trim();
}

const DEMO_KEY = leerClaveDemo();

// Dos formas distintas de la misma clave, y no es un detalle:
//   - issueLicense quiere la semilla cruda (32 bytes)
//   - publicKeyFrom quiere un KeyObject
// Confundirlas revienta con un error de Buffer.concat que no dice cual de las
// dos se paso.
const semillaDeLaDemo = Buffer.from(DEMO_KEY, "base64url");
const publicaDeLaDemo = publicKeyToBytes(
  publicKeyFrom(bytesToPrivateKey(semillaDeLaDemo)),
);

const enElCodigo = /"([A-Za-z0-9_-]{43})"/.exec(EMBEDIDA);
check("La clave embebida esta en el archivo como constante", enElCodigo !== null);

if (enElCodigo) {
  check(
    "La publica embebida SI es la de la clave de demo del repo",
    enElCodigo[1] === publicaDeLaDemo.toString("base64url"),
    `embebida  ${enElCodigo[1]}\n        del repo  ${publicaDeLaDemo.toString("base64url")}`,
  );
}

// ---------------------------------------------------------------------------
console.log("\nLa licencia de demostracion que emite el repo");
console.log("-".repeat(48));

const demo = issueLicense({
  tier: "premium",
  subject: "Demostración FixMyPhone",
  days: 3650,
  privateKey: semillaDeLaDemo,
});

const contraLaApp = verifyLicense({
  envelope: demo,
  publicKey: Buffer.from(enElCodigo ? enElCodigo[1] : "", "base64url"),
});
check(
  "La app acepta la licencia de demo del repo",
  contraLaApp.ok,
  contraLaApp.message ?? "",
);
check("Es premium y de 10 anos", contraLaApp.payload?.tier === "premium");

const anios = (contraLaApp.payload.exp - contraLaApp.payload.iat) / (365 * 86400);
check(
  "Vence en 10 anos, no en 10 dias",
  anios > 9.9,
  `vence en ${anios.toFixed(2)} anos`,
);

// Es portable a proposito. Atada seria inutil en un repositorio: cada clon
// tendria un equipo distinto y el id no coincidiria con ninguno.
check(
  "Es portable (no atada a un equipo)",
  !contraLaApp.payload.machine,
  `machine = ${JSON.stringify(contraLaApp.payload.machine)}; no serviria en la maquina de quien clona`,
);

// ---------------------------------------------------------------------------
console.log("\nEl error que esta prueba existe para documentar");
console.log("-".repeat(48));
// Se comprueba que una clave GENERADA (no la del repo) NO sirve. Si alguien
// "arregla" el flujo rotando la clave de demo sin querer, esta comprobacion
// avisa en vez de dejar un taller con una licencia que la app no acepta.
const nueva = generateKeyPair();
check(
  "Una clave generada aparte NO la acepta esta app",
  !verifyLicense({ envelope: demo, publicKey: nueva.publicKey }).ok,
  "asi se documenta que la unica clave que sirve es la del repo",
);

// ---------------------------------------------------------------------------
// Hasta aquí todo se comprobó llamando a las funciones. Pero el taller no llama
// a funciones: llama a la CLI, y la CLI tiene su propia lógica de dónde busca la
// clave. Esta sección la ejecuta de verdad, en un HOME falso y vacío, que es
// exactamente lo que encuentra alguien que acaba de clonar el repositorio.
//
// Es la diferencia entre "la librería funciona" y "el README sirve".
// ---------------------------------------------------------------------------
console.log("\nLa CLI en un clon recién bajado");
console.log("-".repeat(48));

const CLI = join(RAIZ, "packages", "licensing", "src", "cli.ts");
const HOME_FALSO = mkdtempSync(join(tmpdir(), "fmp-home-"));

/** Corre la CLI como si viviéramos en `HOME_FALSO`. */
function cli(...args) {
  const r = spawnSync(process.execPath, [CLI, ...args], {
    encoding: "utf8",
    env: { ...process.env, USERPROFILE: HOME_FALSO, HOME: HOME_FALSO },
  });
  return { codigo: r.status, salida: (r.stdout ?? "") + (r.stderr ?? "") };
}

const DEMO_FALSO = join(HOME_FALSO, "demo.fmp");

// 1. Sin ~/.fixmyphone, `demo` tiene que servir la clave del repo. Si esto
//    falla, quien clone el repositorio no puede probar el producto, que era
//    justo lo que prometía el README.
const rDemo = cli("demo", "--out", DEMO_FALSO);
check(
  "En un clon limpio, `demo` emite sin pedir `keygen`",
  rDemo.codigo === 0 && existsSync(DEMO_FALSO),
  rDemo.salida.trim(),
);
check(
  "Y dice con qué clave lo emitió",
  rDemo.salida.includes("clave que viaja en el repositorio"),
  "si no lo dice, el taller no sabe si la app lo va a aceptar",
);

// 2. `--app` es la comprobación que de verdad importa: no que la firma sea
//    coherente consigo misma, sino que la app la acepte.
const rDemoOk = cli("verify", DEMO_FALSO, "--app");
check(
  "La app acepta la licencia de demo (`verify --app`)",
  rDemoOk.codigo === 0 && rDemoOk.salida.includes("Firma válida"),
  rDemoOk.salida.trim(),
);

// 3. La trampa. `keygen` en un clon limpio crea una clave que la app no
//    conoce. Emitir con ella y verificar en local dice "Firma válida"; la app
//    dice que la licencia está dañada. La CLI tiene que avisar de la diferencia
//    en vez de dejar que el taller descubra el problema en la pantalla del
//    cliente.
cli("keygen");
const rMala = cli(
  "issue",
  "--tier",
  "premium",
  "--subject",
  "Clon Mal",
  "--days",
  "30",
  "--out",
  join(HOME_FALSO, "mala.fmp"),
);
check("Una clave generada aparte sí emite algo", rMala.codigo === 0, rMala.salida.trim());

const rMalaLocal = cli("verify", join(HOME_FALSO, "mala.fmp"));
check(
  "La CLI avisa que su clave NO es la de la app",
  rMalaLocal.salida.includes("NO es la que lleva la app"),
  "sin este aviso el taller ve verde en la terminal y un rechazo en la app",
);

const rMalaApp = cli("verify", join(HOME_FALSO, "mala.fmp"), "--app");
check(
  "Y con `--app` la app la rechaza, con codigo de error",
  rMalaApp.codigo === 1 && rMalaApp.salida.includes("Inválida"),
  `salida ${rMalaApp.codigo}: ${rMalaApp.salida.trim()}`,
);

// 4. `public-key` tiene que decir si hay que recompilar, porque emitir antes de
//    copiar la clave produce licencias que no valen para nada.
const rPub = cli("public-key");
check(
  "`public-key` avisa que la clave no está puesta en la app",
  rPub.salida.includes("No coincide con la que lleva la app"),
  rPub.salida.trim(),
);
check(
  "Y da la clave que hay que copiar",
  publicaDeLaDemo.toString("base64url") !== rPub.salida.split("\n")[1],
  "imprimir una clave que no avisa es peor que no imprimirla",
);

rmSync(HOME_FALSO, { recursive: true, force: true });

// Huella del archivo, para que un cambio se note en la revision.
const huella = createHash("sha256")
  .update(DEMO_KEY, "utf8")
  .digest("hex")
  .slice(0, 16);
console.log(`\n  huella de la clave de demo: ${huella}`);

console.log("");
console.log(`${ok} correctas, ${fallas} fallas`);
process.exit(fallas === 0 ? 0 : 1);
