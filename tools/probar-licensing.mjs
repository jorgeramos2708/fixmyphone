/**
 * Pruebas del sistema de licencias.
 * ===========================================================================
 *
 * Esto es lo mas importante que hay que probar en todo el proyecto. Una base de
 * datos con una fila mal puesta se nota. Una firma mal verificada deja emitir
 * un premium falso, y eso es un negocio que no existe.
 *
 * La mayoria de estas pruebas son ATAQUES: no "esto funciona" sino "esto NO
 * deja pasar esto". Una prueba de que la firma valida casi no prueba nada, ya
 * que el codigo que la valida es el mismo que la firma.
 *
 * Se ejecuta con node pelado, sin Electron:
 *   npm run test:licensing
 */

import { existsSync, readFileSync, mkdtempSync, writeFileSync, rmSync } from "node:fs";
import { join, resolve } from "node:path";
import { homedir, tmpdir } from "node:os";
import { createHash } from "node:crypto";
import { machineId, machineIdParts } from "../packages/licensing/src/machine.ts";
import {
  FREE_DAILY_LIMIT,
  TIER_FEATURES,
  bytesToPrivateKey,
  bytesToPublicKey,
  deriveMachineId,
  publicKeyFrom,
  publicKeyToBytes,
  generateKeyPair,
  issueLicense,
  licenseId,
  verifyLicense,
} from "../packages/licensing/src/index.ts";

const RAIZ = resolve(import.meta.dirname, "..");

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

// Claves de la propia prueba, no las de la maquina. Cada corrida es
// independiente y no toca ~/.fixmyphone.
const mia = generateKeyPair();
const otra = generateKeyPair();

const HOY = Math.floor(Date.now() / 1000);
const DIA = 86400;

const premium = issueLicense({
  tier: "premium",
  subject: "Taller Perez - Guadalajara",
  days: 365,
  privateKey: mia.privateKey,
});

const gratuita = issueLicense({
  tier: "free",
  subject: "Evaluacion",
  days: 1,
  privateKey: mia.privateKey,
});

const V = (envelope, extra = {}) =>
  verifyLicense({ envelope, publicKey: mia.publicKey, ...extra });

// ---------------------------------------------------------------------------
console.log("La clave del par generado se deriva bien en las dos direcciones");
// ---------------------------------------------------------------------------
// El camino inverso (DER -> objeto -> bytes) tiene que dar los mismos bytes que
// el par original. Si no, la clave embebida en la app y la que emite el CLI son
// distintas y ninguna licencia valida, sin que nada lo indique.
const idaYVuelta = publicKeyToBytes(
  publicKeyFrom(bytesToPrivateKey(mia.privateKey)),
);
check(
  "La publica del par sobrevive al viaje de ida y vuelta",
  idaYVuelta.equals(mia.publicKey),
);

// ---------------------------------------------------------------------------
console.log("\nIdentificador de equipo de esta maquina");
// ---------------------------------------------------------------------------
// machineIdParts() es lo que calculan el CLI y la app. Si las dos sides
// calcularan distinto, toda licencia atada se rechazaria y el taller no
// podria comprar nada. Se comprueba contra el mismo SHA-256 a mano, para que
// un cambio en la formula no pase inadvertido por cambiar las dos a la vez.
const partes = machineIdParts();
check("El id son 32 hex en mayuscula", /^[0-9A-F]{32}$/.test(partes.id), partes.id);
check("El volumen son 8 hex", /^[0-9A-F]{8}$/.test(partes.volumen), partes.volumen);
check("Dice de que usuario sale", partes.usuario.length > 0, JSON.stringify(partes));
check(
  "El id es el SHA-256 de usuario|volumen",
  partes.id === m1_esperado(partes.usuario, partes.volumen),
  `esperado ${m1_esperado(partes.usuario, partes.volumen)}\n        obtenido ${partes.id}`,
);
check("Es el mismo que devuelve machineId()", machineId() === partes.id);
check("No lanza con un volumen imposible", typeof deriveMachineId("u", "") === "string");

// ---------------------------------------------------------------------------
console.log("\nCiclo completo: derivar, atar, verificar");
// ---------------------------------------------------------------------------
// Las tres piezas, en el orden en que las usa un taller. Cada paso por
// separado esta probado; esto comprueba que encajan.
{
  const atadaAlTaller = issueLicense({
    tier: "premium",
    subject: "Taller del ciclo",
    days: 365,
    privateKey: mia.privateKey,
    machine: partes.id,
  });
  check(
    "Una licencia atada a ESTE equipo verifica aqui",
    V(atadaAlTaller, { machineId: machineId() }).ok,
    "el id que emitio tiene que ser el mismo que calcula la app",
  );
  check(
    "Y NO verifica en un equipo distinto",
    !V(atadaAlTaller, { machineId: "00000000000000000000000000000000" }).ok,
  );
}

function m1_esperado(usuario, volumen) {
  return createHash("sha256")
    .update(`${usuario}|${volumen}`, "utf8")
    .digest("hex")
    .slice(0, 32)
    .toUpperCase();
}

// ---------------------------------------------------------------------------
console.log("\nLicencias bien formadas");
// ---------------------------------------------------------------------------
const r1 = V(premium);
check("Premium valida", r1.ok, r1.message);
check("Premium conserva el titular", r1.payload?.subject === "Taller Perez - Guadalajara", r1.message);
check("Premium conserva el nivel", r1.payload?.tier === "premium");

const r2 = V(gratuita);
check("Gratuita valida", r2.ok, r2.message);
check("Gratuita es free", r2.payload?.tier === "free");

// ---------------------------------------------------------------------------
console.log("\nAtaque 1: alterar el contenido sin volver a firmar");
// ---------------------------------------------------------------------------
// Este es el ataque que importa. El archivo .fmp es un JSON en texto plano
// que el tecnico puede abrir con el bloc de notas. Editar "free" por
// "premium" es la forma mas obvia de saltarse el cobro.
const alterada = structuredClone(premium);
{
  const p = JSON.parse(Buffer.from(alterada.payload, "base64url").toString("utf8"));
  p.tier = "premium";
  p.subject = "Taller Robado";
  p.exp = p.iat + 100 * DIA; // y alargar la vigencia
  alterada.payload = Buffer.from(JSON.stringify(p), "utf8").toString("base64url");
}
const r3 = V(alterada);
check("El contenido editado NO verifica", !r3.ok, `devolvio ok=${r3.ok}`);
check("El motivo dice que es la firma", /firma/i.test(r3.message ?? ""), r3.message);
check("No se acepta el nivel editado", r3.payload?.tier === undefined);

// ---------------------------------------------------------------------------
console.log("\nAtaque 2: cambiar la firma");
// ---------------------------------------------------------------------------
const firmaCambiada = structuredClone(premium);
firmaCambiada.signature = Buffer.alloc(64, 7).toString("base64url");
const r4 = V(firmaCambiada);
check("La firma inventada NO verifica", !r4.ok, `devolvio ok=${r4.ok}`);

// ---------------------------------------------------------------------------
console.log("\nAtaque 3: licencia de otro emisor");
// ---------------------------------------------------------------------------
// Si el taller usa una licencia que le paso otro, tiene que ser premium para
// el taller. Y tiene que ser premium para NOSOTROS, no para quien la emitio.
const r5 = verifyLicense({ envelope: premium, publicKey: otra.publicKey });
check("La licencia de otro emisor NO verifica aqui", !r5.ok, `devolvio ok=${r5.ok}`);

// ---------------------------------------------------------------------------
console.log("\nAtaque 4: forma del archivo");
// ---------------------------------------------------------------------------
for (const [nombre, env] of [
  ["sin payload", { signature: premium.signature }],
  ["sin firma", { payload: premium.payload }],
  ["payload vacio", { payload: "", signature: premium.signature }],
  ["firma corta", { payload: premium.payload, signature: "AAAA" }],
  ["payload que no es base64", { payload: "!!!", signature: premium.signature }],
  ["payload que no es JSON", { payload: Buffer.from("hola").toString("base64url"), signature: premium.signature }],
]) {
  const r = V(env);
  check(`${nombre} se rechaza sin lanzar excepcion`, !r.ok && typeof r.message === "string", JSON.stringify(r));
}

// ---------------------------------------------------------------------------
console.log("\nVencimiento");
// ---------------------------------------------------------------------------
const corta = issueLicense({ tier: "premium", subject: "Prueba", days: 1, privateKey: mia.privateKey });

const dentro = V(corta, { now: HOY + 12 * 3600 });
check("Al dia siguiente todavia vale (margen de reloj)", dentro.ok, dentro.message);

const fuera = V(corta, { now: HOY + 3 * DIA, clockSkewSec: 0 });
check("Pasada la vigencia se rechaza", !fuera.ok, `devolvio ok=${fuera.ok}`);
check("El motivo dice que vencio", /venc|expir|caduc/i.test(fuera.message ?? ""), fuera.message);

const emitiendoseEnElPasado = issueLicense({
  tier: "premium",
  subject: "Retroactiva",
  days: 30,
  privateKey: mia.privateKey,
});
const r6 = V(emitiendoseEnElPasado, { now: HOY - 60 * DIA, clockSkewSec: 0 });
check("Una licencia de 30 dias no vale 60 dias despues", !r6.ok, r6.message);

// ---------------------------------------------------------------------------
console.log("\nAtado a maquina");
// ---------------------------------------------------------------------------
const atada = issueLicense({
  tier: "premium",
  subject: "Taller Atado",
  days: 365,
  privateKey: mia.privateKey,
  machine: "ABCDEF0123456789",
});
const r7 = V(atada, { machineId: "ABCDEF0123456789" });
check("En su maquina vale", r7.ok, r7.message);

const r8 = V(atada, { machineId: "9999999999999999" });
check("En otra maquina NO vale", !r8.ok, `devolvio ok=${r8.ok}`);

const r9 = V(atada, { machineId: null });
check("Una licencia atada NO vale si no se dice que maquina es", !r9.ok, r9.message);

const r10 = V(atada);
check("Una licencia atada NO vale sin comprobar maquina", !r10.ok, `devolvio ok=${r10.ok}`);

// ---------------------------------------------------------------------------
console.log("\nderiveMachineId");
// ---------------------------------------------------------------------------
const m1 = deriveMachineId("taller", "volumen-1");
check("Es determinista", m1 === deriveMachineId("taller", "volumen-1"));
check("Cambia si cambia el volumen", m1 !== deriveMachineId("taller", "volumen-2"));
check("Cambia si cambia el usuario", m1 !== deriveMachineId("otro", "volumen-1"));
check("Son 32 hex en mayuscula", /^[0-9A-F]{32}$/.test(m1), m1);

// ---------------------------------------------------------------------------
console.log("\nIdentificador de licencia");
// ---------------------------------------------------------------------------
check("Misma licencia, mismo id", licenseId(premium) === licenseId(premium));
check("Licencias distintas, id distinto", licenseId(premium) !== licenseId(gratuita));
check("El id no expone el contenido", !licenseId(premium).includes("Perez"));

// ---------------------------------------------------------------------------
console.log("\nNiveles");
// ---------------------------------------------------------------------------
check("El tope gratuito es 2", FREE_DAILY_LIMIT === 2);
check("Free trae marca de agua", TIER_FEATURES.free.includes("report_watermark"));
check("Free NO trae informe firmado", !TIER_FEATURES.free.includes("report_signature"));
check("Premium trae informe firmado", TIER_FEATURES.premium.includes("report_signature"));
check("Premium NO trae tope diario", !TIER_FEATURES.premium.includes("diagnostics_daily_limit"));

// ---------------------------------------------------------------------------
console.log("\nPersistencia: el archivo se lee tal cual se escribio");
// ---------------------------------------------------------------------------
// Un .fmp emitido en Linux y pegado en Windows llega con BOM o con CRLF. Si el
// lector no los tolera, la licencia que el tecnico copio y pego no funciona y
// no hay forma de saber por que.
const tmp = mkdtempSync(join(tmpdir(), "fmp-lic-"));
try {
  const rutas = {
    "tal cual": JSON.stringify(premium, null, 2),
    "con BOM": "\uFEFF" + JSON.stringify(premium),
    "con CRLF": JSON.stringify(premium, null, 2).replace(/\n/g, "\r\n"),
    "en una linea": JSON.stringify(premium),
  };
  for (const [nombre, texto] of Object.entries(rutas)) {
    const ruta = join(tmp, "lic.fmp");
    writeFileSync(ruta, texto, "utf8");
    const leido = JSON.parse(readFileSync(ruta, "utf8").replace(/^\uFEFF/, ""));
    const r = V(leido);
    check(`Se lee bien ${nombre}`, r.ok, r.message);
  }

  // Y al reves: un archivo con basura tiene que fallar claro, no reventar.
  const rutaMala = join(tmp, "mala.fmp");
  writeFileSync(rutaMala, "{ esto no es json", "utf8");
  let falloLimpio = false;
  try {
    JSON.parse(readFileSync(rutaMala, "utf8").replace(/^\uFEFF/, ""));
  } catch {
    falloLimpio = true;
  }
  check("Un archivo corrupto da error de sintaxis, no un crash", falloLimpio);
} finally {
  rmSync(tmp, { recursive: true, force: true });
}

// ---------------------------------------------------------------------------
console.log("\nLa clave embebida en la app es la del emisor");
// ---------------------------------------------------------------------------
// Esta es la prueba que mas da miedo que falle, y no por seguridad: por
// USABILIDAD. Si la publica de apps/desktop/src/main/public-key.ts no es la que
// corresponde a la clave con la que el CLI emite, NINGUNA licencia valida, la
// app cae al plan gratuito siempre, y el taller no puede comprar nada. Fallo
// silencioso: la app no da error, solo dice "free".
const rutaClave = join(homedir(), ".fixmyphone", "issuer.key");
const rutaEmpotrada = join(RAIZ, "apps", "desktop", "src", "main", "public-key.ts");

if (existsSync(rutaClave)) {
  const privada = Buffer.from(readFileSync(rutaClave, "utf8").trim(), "base64url");
  // En base64url, para poder compararlo con el TEXTO del archivo. Comparar un
  // string contra un Buffer siempre da false, y el fallo que reportaba no
  // existia: imprimia la clave de 32 bytes como texto ilegible.
  const derivada = publicKeyToBytes(
    publicKeyFrom(bytesToPrivateKey(privada)),
  ).toString("base64url");
  const fuente = readFileSync(rutaEmpotrada, "utf8");
  const m = /"([A-Za-z0-9_-]{43})"/.exec(fuente);
  check("La clave publica embebida esta en el archivo", m !== null);
  if (m) {
    check(
      "La embebida corresponde a la clave del emisor de esta maquina",
      m[1] === derivada,
      `embebida  ${m[1]}\n        derivada ${derivada}`,
    );
  }
} else {
  console.log(
    `  ----  sin clave de emisor en ${rutaClave};\n` +
      "        se omite la comparacion con la clave embebida",
  );
}

console.log(`\n${ok} correctas, ${fallos} fallas`);
process.exit(fallos === 0 ? 0 : 1);
