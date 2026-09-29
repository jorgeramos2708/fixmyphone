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
import {
  SIGNATURE_BEGIN,
  SIGNATURE_END,
  keyFingerprint,
  reportLicense,
  signReport,
  verifyReport,
} from "../packages/licensing/src/report-signature.ts";

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
// Esta lista se escribe DENTRO de la licencia que recibe el cliente. Un nombre
// aqui es una promesa de venta, no una nota interna: por eso la lista se
// compara contra lo que de verdad existe en el codigo y el fallo sale a la vista si
// alguien agrega una feature sin implementarla.
check(
  "Las funciones premium son exactamente las que existen",
  JSON.stringify(TIER_FEATURES.premium) ===
    JSON.stringify(["diagnostics_unlimited", "report_signature"]),
  `declaradas: ${TIER_FEATURES.premium.join(", ")}`,
);
check(
  "Ningun nivel declara una funcion del otro",
  !TIER_FEATURES.free.some((f) => TIER_FEATURES.premium.includes(f)),
  `free: ${TIER_FEATURES.free.join(", ")} | premium: ${TIER_FEATURES.premium.join(", ")}`,
);

// ---------------------------------------------------------------------------
console.log("\nFirma del informe: el camino feliz");
// ---------------------------------------------------------------------------
// El informe premium se firma con la clave de la INSTALACION, no con la del
// fabricante. No es un detalle: una clave del fabricante dentro de un `.exe` que
// se reparte la puede extraer cualquiera y firmar informes falsos, y entonces
// la firma no prueba nada. La cadena que si se puede probar entera es:
// FixMyPhone firmo la licencia, la licencia va dentro del informe, y el
// informe lo firmo el taller.
const par = generateKeyPair();
const kid = keyFingerprint(par.publicKey);

const cuerpo = [
  "FIXMYPHONE - Informe de identificacion y diagnostico",
  "=".repeat(66),
  "  Equipo          realme C53 (realme)",
  "  Numero de serie  ABCD1234",
  "  Licencia        premium - Taller Perez - Guadalajara",
  "",
  "Fin del informe.",
  "",
].join("\n");

const firmado = signReport(cuerpo, {
  privateKey: par.privateKey,
  tool: "FixMyPhone 0.1.0",
  signedAt: new Date("2026-01-02T03:04:05.000Z"),
  license: reportLicense(premium, "premium", "Taller Perez - Guadalajara"),
});

const rF1 = verifyReport(firmado);
check("El informe firmado verifica", rF1.ok, rF1.message);
check("Sin clave esperada la atribucion NO esta comprobada", rF1.clave === "propia", rF1.clave ?? "");
check(
  "Y el mensaje lo dice con palabras, no lo deja pasar",
  /no (dice|sirve)/i.test(rF1.message) && /firma v/i.test(rF1.message),
  rF1.message,
);

const rF2 = verifyReport(firmado, { publicKey: par.publicKey });
check("Con la clave esperada si verifica", rF2.ok, rF2.message);
check("Y ahora si se puede atribuir", rF2.clave === "esperada", rF2.clave ?? "");

const rF3 = verifyReport(firmado, { publicKey: otra.publicKey });
check("Con la clave de OTRO taller NO verifica", !rF3.ok, `devolvio ok=${rF3.ok}`);
check("El motivo dice que es otra clave", rF3.problem === "clave_distinta", rF3.problem ?? "");

// La huella es el SHA-256 de la clave publica, tal cual. Se recalcula aqui a
// mano con la misma formula que el id de equipo, para que un cambio en la
// formula no se note por cambiar el codigo y la prueba a la vez: si la huella
// dejara de ser el hash de la clave, el tecnico publicaria un numero que no
// corresponde a nada y el cliente no podria comprobar nunca.
check(
  "La huella es el SHA-256 de la clave publica",
  kid === createHash("sha256").update(par.publicKey).digest("hex").slice(0, 32).toUpperCase(),
  kid,
);
check("Son 32 hex en mayuscula", /^[0-9A-F]{32}$/.test(kid), kid);
check("La huella del bloque es esa", rF1.meta?.kid === kid, rF1.meta?.kid ?? "");
check("Dos claves distintas, huellas distintas", kid !== keyFingerprint(otra.publicKey));

// El cuerpo firmado es EXACTO: si el archivo trae un byte de mas, la firma se
// cae. Es lo que hace que "no se altero" sea una afirmacion y no un deseo.
check(
  "El contenido firmado esta dentro del archivo",
  firmado.startsWith(cuerpo) &&
    firmado.includes(SIGNATURE_BEGIN) &&
    firmado.trimEnd().endsWith(SIGNATURE_END),
);

// Firmar dos veces lo mismo da el mismo archivo. Sin esta propiedad no se
// puede demostrar nada sobre el archivo: se podria "volver a firmar" un
// informe alterado sin que nadie notara el cambio.
const firmado2 = signReport(cuerpo, {
  privateKey: par.privateKey,
  tool: "FixMyPhone 0.1.0",
  signedAt: new Date("2026-01-02T03:04:05.000Z"),
  license: reportLicense(premium, "premium", "Taller Perez - Guadalajara"),
});
check("Firmar dos veces lo mismo da el mismo archivo", firmado === firmado2);

// --- La licencia viaja dentro de la firma ---------------------------------
check("La licencia va dentro del bloque de firma", rF1.meta?.license !== null);
check(
  "Y es la MISMA licencia, con su sobre intacto",
  rF1.meta?.license?.envelope.payload === premium.payload &&
    rF1.meta?.license?.envelope.signature === premium.signature,
);
check("Su id es el licenseId del sobre", rF1.meta?.license?.id === licenseId(premium));
check(
  "La licencia embebida verifica contra la clave del emisor",
  verifyLicense({ envelope: rF1.meta.license.envelope, publicKey: mia.publicKey }).ok,
  "si esto falla, el informe firmado no prueba que el taller tenga licencia",
);
check(
  "Y NO verifica contra otra clave de emisor",
  !verifyLicense({ envelope: rF1.meta.license.envelope, publicKey: otra.publicKey }).ok,
);

// Sin licencia (plan gratuito) el bloque se firma igual y lo dice, en vez de
// fingir que hay una. El premium es el unico que se firma, pero el bloque tiene
// que poder decir la verdad en los dos casos.
const firmadoGratis = signReport(cuerpo, {
  privateKey: par.privateKey,
  tool: "FixMyPhone 0.1.0",
  signedAt: new Date("2026-01-02T03:04:05.000Z"),
});
check("Sin licencia el bloque dice que no hay", firmadoGratis.includes("ninguna: plan gratuito"));
check("Y el metadato va en null, no inventado", verifyReport(firmadoGratis).meta?.license === null);

// ---------------------------------------------------------------------------
console.log("\nAtaque 5: editar el contenido del informe");
// ---------------------------------------------------------------------------
// Es el ataque de siempre y el que la firma existe para parar: el informe es
// texto plano, se abre con el bloc de notas, y cambiar una linea por otra es
// cuestion de un segundo.
{
  const editado = firmado.replace(
    "  Licencia        premium - Taller Perez - Guadalajara",
    "  Licencia        premium - Taller Robado",
  );
  const r = verifyReport(editado);
  check("El contenido editado NO verifica", !r.ok, `devolvio ok=${r.ok}`);
  check("El motivo es la firma, no otra cosa", r.problem === "firma_invalida", r.problem ?? "");
}

// ---------------------------------------------------------------------------
console.log("\nAtaque 6: cambiar lo que el bloque AFIRMA");
// ---------------------------------------------------------------------------
// El cuerpo se puede dejar intacto y cambiar los metadatos. Si la huella, el
// id de licencia o la fecha vivieran FUERA de la firma, esto pasaria
// desapercibido: bastaria editar el JSON y el verificador lo aceptaria.
for (const [nombre, busqueda, reemplazo] of [
  ["la huella", `"kid":"${kid}"`, '"kid":"AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA"'],
  ["el id de licencia", `"id":"${licenseId(premium)}"`, '"id":"0000000000000000"'],
  [
    "la fecha de firma",
    '"signed_at":"2026-01-02T03:04:05.000Z"',
    '"signed_at":"2030-01-02T03:04:05.000Z"',
  ],
  ["la version de la herramienta", '"tool":"FixMyPhone 0.1.0"', '"tool":"FixMyPhone 9.9.9"'],
]) {
  const alterado = firmado.replace(busqueda, reemplazo);
  const r = verifyReport(alterado);
  check(
    `Cambiar ${nombre} en el bloque lo invalida`,
    alterado !== firmado && !r.ok,
    `cambio=${alterado !== firmado} ok=${r.ok}`,
  );
}

// ---------------------------------------------------------------------------
console.log("\nAtaque 7: un informe entero hecho por otro");
// ---------------------------------------------------------------------------
// El atacante tiene su propio par de claves, escribe un informe FALSO y lo
// firma con su clave. La autocomprobacion da verde, porque la firma es
// coherente consigo misma: eso es inevitable en cualquier firma, y por eso la
// comprobacion tiene que poder recibir una clave de fuera.
{
  const atacante = generateKeyPair();
  const falso = signReport(cuerpo.replace("realme C53", "iPhone 15 Pro Max"), {
    privateKey: atacante.privateKey,
    tool: "FixMyPhone 0.1.0",
    signedAt: new Date("2026-01-02T03:04:05.000Z"),
  });
  const r = verifyReport(falso);
  check("El informe del atacante verifica contra su propia clave", r.ok, r.message);
  check("Pero NO contra la del taller", !verifyReport(falso, { publicKey: par.publicKey }).ok);
  check("Y la huella delata que es otra", r.meta.kid !== kid, r.meta.kid);
}

// ---------------------------------------------------------------------------
console.log("\nAtaque 8: pegar una firma encima de un informe ajeno");
// ---------------------------------------------------------------------------
// El ataque que combina los dos: se toma un informe CONocido y bien formado y
// se le pega encima un bloque de firma. Si el verificador se quedara con el
// ultimo bloque, el cuerpo del informe quedaria sin cubrir.
{
  const ajeno = signReport("informe de otro taller\n", {
    privateKey: otra.privateKey,
    tool: "FixMyPhone 0.1.0",
    signedAt: new Date("2026-01-02T03:04:05.000Z"),
  });
  const conDos = firmado + ajeno.slice(ajeno.indexOf(SIGNATURE_BEGIN));
  const r = verifyReport(conDos);
  check("Dos bloques de firma se detectan", !r.ok && r.problem === "varios_bloques", r.problem ?? "");
}

// ---------------------------------------------------------------------------
console.log("\nAtaque 9: texto pegado despues de la firma");
// ---------------------------------------------------------------------------
// La firma cubre hasta la linea de cierre. Lo que venga despues no esta
// firmado, asi que pegarle al final "reparacion autorizada por el usuario" es
// gratis. Tiene que quedar dicho, no aceptados en silencio.
{
  const conCola = firmado + "\n\nLa reparacion incluye cambio de pantalla. Autorizado.\n";
  const r = verifyReport(conCola);
  check(
    "Texto despues del bloque se detecta",
    !r.ok && r.problem === "contenido_despues",
    r.problem ?? "",
  );
}
{
  const conEspacios = firmado + "\n\n   \n";
  const r = verifyReport(conEspacios);
  check("Espacios en blanco al final no se toman por contenido", r.ok, r.problem ?? "");
}

// ---------------------------------------------------------------------------
console.log("\nFalsos positivos: el informe roto NO es el informe falso");
// ---------------------------------------------------------------------------
// Guardar el informe en el bloc de notas de Windows y volver a guardarlo mete
// BOM y pasa los saltos de linea a CRLF. El contenido es identico y la firma se
// cae. Decirle al tecnico que su informe es falso cuando lo unico que paso fue
// que lo reabrio es un costo que se paga con la credibilidad del producto.
{
  const reescrito = "﻿" + firmado.replace(/\n/g, "\r\n");
  const r = verifyReport(reescrito);
  check(
    "El archivo reescrito se detecta como reescrito",
    !r.ok && r.problem === "reescrito",
    r.problem ?? "",
  );
  check("Y se dice que el contenido si esta intacto", r.intactoTrasReescribir === true);
  check("No se acepta como valido de todos modos", r.ok === false);
}
{
  // El caso inverso: alterado Y reescrito a la vez. Si aqui se dijera
  // "reescrito, el contenido esta intacto", se estaria mandando un informe
  // manipulado como si fuera un problema de formato.
  const trucado = firmado.replace("realme C53", "iPhone 15") + "\n";
  const r = verifyReport("﻿" + trucado.replace(/\n/g, "\r\n"));
  check(
    "Alterado y reescrito a la vez NO sale como intacto",
    r.intactoTrasReescribir !== true,
    r.problem ?? "",
  );
  check("Y el problema es la firma, no el formato", r.problem === "firma_invalida", r.problem ?? "");
}

// ---------------------------------------------------------------------------
console.log("\nUn informe sin firma se dice que no la tiene");
// ---------------------------------------------------------------------------
{
  const r = verifyReport(cuerpo);
  check("Un informe normal no tiene bloque", !r.ok && r.problem === "sin_firma", r.problem ?? "");
  check("Y el motivo distingue los dos casos", /plan gratuito/i.test(r.message), r.message);
}

// ---------------------------------------------------------------------------
console.log("\nEl bloque roto no revienta la herramienta");
// ---------------------------------------------------------------------------
// La verificacion la va a usar alguien, con un archivo que puede estar danado,
// copiado a medias o editado a mano. Un crash con una excepcion de JSON es
// peor que un rechazo: el tecnico ve una pantalla en blanco y no sabe si el
// informe es falso o si el programa esta roto.
for (const [nombre, texto] of [
  ["sin linea de cierre", firmado.replace(SIGNATURE_END, "")],
  ["json que no es json", firmado.replace(/"v":1,/, "{ esto no es json,")],
  ["json truncado", firmado.slice(0, firmado.indexOf(SIGNATURE_BEGIN) + 40)],
  ["firma de largo raro", firmado.replace(/"sig":"[A-Za-z0-9_-]+"/, '"sig":"AAAA"')],
  ["clave de largo raro", firmado.replace(/"key":"[A-Za-z0-9_-]+"/, '"key":"AAAA"')],
  ["version desconocida", firmado.replace('"v":1', '"v":99')],
  ["algoritmo desconocido", firmado.replace('"alg":"ed25519"', '"alg":"rot13"')],
  [
    "bloque vacio",
    firmado.slice(0, firmado.indexOf(SIGNATURE_BEGIN) + SIGNATURE_BEGIN.length) +
      "\n" +
      SIGNATURE_END +
      "\n",
  ],
  ["archivo vacio", ""],
]) {
  let r = null;
  let limpio = true;
  try {
    r = verifyReport(texto);
  } catch (e) {
    limpio = false;
    console.log(`        lanzo: ${e instanceof Error ? e.message : String(e)}`);
  }
  check(
    `${nombre} se rechaza sin lanzar excepcion`,
    limpio && r !== null && r.ok === false && typeof r.message === "string",
    limpio ? `ok=${r.ok} problema=${r.problem}` : "lanzo",
  );
}

// ---------------------------------------------------------------------------
console.log("\nLa firma aguanta el viaje por disco");
// ---------------------------------------------------------------------------
{
  const tmpFirma = mkdtempSync(join(tmpdir(), "fmp-firma-"));
  try {
    const ruta = join(tmpFirma, "informe.txt");
    writeFileSync(ruta, firmado, "utf8");
    check(
      "El archivo se relee y sigue verificando",
      verifyReport(readFileSync(ruta, "utf8")).ok,
    );
    check(
      "Y con la clave del taller tambien",
      verifyReport(readFileSync(ruta, "utf8"), { publicKey: par.publicKey }).ok,
    );
  } finally {
    rmSync(tmpFirma, { recursive: true, force: true });
  }
}

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
