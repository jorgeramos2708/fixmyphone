#!/usr/bin/env node
/**
 * fmp-license — emisor y verificador de licencias de FixMyPhone.
 * ===========================================================================
 *
 * Uso:
 *   fmp-license keygen
 *   fmp-license issue --tier premium --subject "Taller Pérez" --days 365 --out t.fmp
 *   fmp-license verify t.fmp
 *   fmp-license machine-id
 *   fmp-license public-key
 *   fmp-license demo --out demo-premium.fmp
 *
 * Dónde vive la clave privada: `~/.fixmyphone/issuer.key`, o la que se pase con
 * `--key <ruta>`. Los comandos que emiten y los que verifican tienen que usar la
 * MISMA: si no, el taller se lleva un "válida" de aquí y un rechazo en la
 * pantalla de la app, sin ninguna pista de por qué.
 *
 * AVISO QUE NO SE PUEDE OMITIR: si ese archivo se pierde, las licencias ya
 * emitidas siguen siendo válidas (la app solo tiene la clave pública, así que
 * no puede dejar de aceptarlas), pero NO se pueden emitir nuevas sin generar
 * una clave nueva, y esa clave nueva invalida las anteriores. Copia el archivo
 * a un lugar seguro, o emite una clave nueva y vuelve a emitir todo.
 */

import { mkdirSync, readFileSync, writeFileSync, existsSync, chmodSync } from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";
import {
  bytesToPrivateKey,
  generateKeyPair,
  issueLicense,
  licenseId,
  publicKeyFrom,
  publicKeyToBytes,
  verifyLicense,
  type LicenseEnvelope,
  type LicenseTier,
} from "./index.ts";
import { machineIdParts } from "./machine.ts";

const FMP_DIR = join(homedir(), ".fixmyphone");
const KEY_PATH = join(FMP_DIR, "issuer.key");

// ---------------------------------------------------------------------------
// Utilidades de salida
// ---------------------------------------------------------------------------

const C = {
  reset: "\x1b[0m",
  bold: "\x1b[1m",
  dim: "\x1b[2m",
  red: "\x1b[31m",
  green: "\x1b[32m",
  yellow: "\x1b[33m",
  cyan: "\x1b[36m",
};

const ok = (m: string) => console.log(`${C.green}✓${C.reset} ${m}`);
const warn = (m: string) => console.log(`${C.yellow}!${C.reset} ${m}`);
const err = (m: string) => console.error(`${C.red}✗${C.reset} ${m}`);
const info = (m: string) => console.log(`  ${C.dim}${m}${C.reset}`);
const head = (m: string) => console.log(`\n${C.bold}${m}${C.reset}\n${C.dim}${"─".repeat(m.length)}${C.reset}`);

function die(m: string): never {
  err(m);
  process.exit(1);
}

// ---------------------------------------------------------------------------
// Clave del emisor
// ---------------------------------------------------------------------------

/**
 * La semilla de emisión, de 32 bytes en base64url.
 *
 * Se filtran las líneas que empiezan por `#` porque el archivo de clave de
 * demostración lleva el aviso escrito dentro, y ese aviso tiene que viajar con
 * la clave: alguien que copie el archivo a otro lado tiene que seguir leyendo
 * por qué no es un secreto. Un archivo que solo se puede leer con el programa
 * pierde el aviso en cuanto se separa de él.
 *
 * Se comprueba la longitud porque un archivo equivocado no revienta con un
 * error de OpenSSL, sino con una licencia que nadie acepta y un "Firma válida"
 * en la consola. Fallar aquí, en el emisor, es más barato.
 */
function leerSemilla(crudo: string, de: string): Buffer {
  const limpia = crudo
    .split("\n")
    .filter((l) => l.trim() && !l.trimStart().startsWith("#"))
    .join("")
    .trim();

  const bytes = Buffer.from(limpia, "base64url");
  if (bytes.length !== 32) {
    die(
      `${de} no contiene una semilla Ed25519 de 32 bytes.\n` +
        `  se leyeron ${bytes.length} bytes de ${limpia.length} caracteres`,
    );
  }
  return bytes;
}

function loadIssuerKey(
  flags: Map<string, string>,
  alternativa?: string,
): Buffer {
  const pedida = flags.get("key");
  if (pedida) {
    if (!existsSync(pedida)) die(`No existe el archivo de clave ${pedida}`);
    return leerSemilla(readFileSync(pedida, "utf8"), pedida);
  }

  if (existsSync(KEY_PATH)) {
    return leerSemilla(readFileSync(KEY_PATH, "utf8"), KEY_PATH);
  }

  // La alternativa la usa solo `demo`, y es una excepción a propósito. Ver la
  // nota de ese comando: el flujo de la demo tiene que funcionar en un clon
  // recién bajado, y eso no puede depender de un archivo que el clon no tiene.
  if (alternativa && existsSync(alternativa)) {
    return leerSemilla(readFileSync(alternativa, "utf8"), alternativa);
  }

  die(
      `No existe la clave del emisor en ${KEY_PATH}.\n` +
        "  Hay dos caminos, y la diferencia entre ellos importa:\n" +
        "    fmp-license keygen\n" +
        "      Crea una clave NUEVA. Su parte pública hay que copiarla a\n" +
        "      apps/desktop/src/main/public-key.ts y recompilar, o la app\n" +
        "      rechazará todo lo que emitas con ella.\n" +
        "    <comando> --key packages/licensing/demo-issuer.key.txt\n" +
        "      Usa la clave de demostración que ya viaja en el repositorio.\n" +
        "      La app la acepta tal cual, sin recompilar nada.",
  );
}

function ensureFmpDir(): void {
  if (!existsSync(FMP_DIR)) mkdirSync(FMP_DIR, { recursive: true });
}

// ---------------------------------------------------------------------------
// Argumentos
// ---------------------------------------------------------------------------

function parseArgs(argv: string[]): { flags: Map<string, string>; positional: string[] } {
  const flags = new Map<string, string>();
  const positional: string[] = [];
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i]!;
    if (a.startsWith("--")) {
      const key = a.slice(2);
      const next = argv[i + 1];
      if (next && !next.startsWith("--")) {
        flags.set(key, next);
        i++;
      } else {
        flags.set(key, "true");
      }
    } else {
      positional.push(a);
    }
  }
  return { flags, positional };
}

// ---------------------------------------------------------------------------
// Comandos
// ---------------------------------------------------------------------------

function cmdKeygen(): void {
  head("Generar clave del emisor");

  if (existsSync(KEY_PATH)) {
    warn(`${KEY_PATH} ya existe. No se va a sobrescribir.`);
    info("Borrarla invalida TODAS las licencias emitidas con ella.");
    info("Si de verdad quieres empezar de cero: rm " + KEY_PATH);
    return;
  }

  ensureFmpDir();
  const kp = generateKeyPair();
  writeFileSync(KEY_PATH, kp.privateKey.toString("base64url"), "utf8");

  try {
    // En Windows chmod es casi decorativo, pero en Linux y macOS evita que la
    // clave quede legible por otros usuarios del sistema del taller.
    chmodSync(KEY_PATH, 0o600);
  } catch {
    /* sin soporte de permisos en esta plataforma */
  }

  ok(`Clave privada escrita en ${KEY_PATH}`);
  info("Copia ese archivo a un lugar seguro. Si lo pierdes, no puedes emitir más licencias.");
  info("");
  info("Clave pública (esta sí va dentro de la app):");
  console.log(`  ${C.cyan}${kp.publicKey.toString("base64url")}${C.reset}`);
}

function cmdPublicKey(flags: Map<string, string>): void {
  head("Clave pública del emisor");
  // Se deriva de la privada solo para poder imprimirla. La app nunca ve la
  // clave privada: viaja solo la publica, embebida en el binario.
  const deAqui = publicKeyOfIssuer(flags);
  console.log(deAqui.toString("base64url"));

  const deLaApp = publicKeyDeLaApp();
  if (deLaApp === null) {
    info("");
    info("No se encontró public-key.ts, así que no se puede comparar.");
    return;
  }
  if (deLaApp.equals(deAqui)) {
    info("");
    ok("Coincide con la que lleva la app. No hay nada que recompilar.");
    return;
  }

  warn("No coincide con la que lleva la app.");
  info("  en la app   " + deLaApp.toString("base64url"));
  info("");
  info("Para que la app acepte lo que emitas con esta clave:");
  info("  1. Copia el valor de arriba a ISSUER_PUBLIC_KEY_B64URL, en");
  info("     apps/desktop/src/main/public-key.ts");
  info("  2. npm run dist");
  info("");
  info("Hazlo ANTES de emitir. Si ya emitiste, vuelve a emitir con la clave");
  info("que sí lleva la app; las licencias de la otra no valen para nada.");
}

function cmdIssue(flags: Map<string, string>): void {
  const tier = (flags.get("tier") ?? "premium") as LicenseTier;
  if (tier !== "free" && tier !== "premium") {
    die(`Nivel inválido: "${tier}". Usa free o premium.`);
  }

  const subject = flags.get("subject") ?? flags.get("s") ?? "Taller";
  const days = Number(flags.get("days") ?? "365");
  if (!Number.isFinite(days) || days <= 0) die("--days debe ser un número positivo.");

  const out = flags.get("out") ?? flags.get("o");

  // `--machine` ata la licencia a un equipo. Se normaliza a mayúsculas porque
  // el id se muestra en mayúsculas en la pantalla de licencia de la app y el
  // técnico lo dicta en voz alta: si uno de los dos lo teclea en minúsculas, la
  // licencia no valida y el rechazo parece un error de la app en vez de un
  // tecleo.
  const machineCrudo = flags.get("machine") ?? flags.get("m");
  const machine = machineCrudo ? machineCrudo.trim().toUpperCase() : null;

  if (machine && !/^[0-9A-F]{32}$/.test(machine)) {
    die(
      `--machine debe ser el id que imprime "fmp-license machine-id": ` +
        `32 caracteres hexadecimales en mayúscula.\n` +
        `  recibido: ${machine}`,
    );
  }

  const envelope = issueLicense({
    tier,
    subject,
    days,
    privateKey: loadIssuerKey(flags),
    machine,
  });

  const texto = JSON.stringify(envelope, null, 2);

  if (out) {
    writeFileSync(out, texto, "utf8");
    ok(`Licencia ${tier} emitida para "${subject}"`);
    info(`Válida ${days} días · guardada en ${out}`);
    info(`ID: ${licenseId(envelope)}`);
    if (machine) {
      info(`Atada al equipo ${machine}`);
      info(
        "Recorda avisarle: si reinstala Windows, la licencia deja de validar.",
      );
    }
  } else {
    // Sin --out se imprime en stdout, para canalizar: `... | pbcopy`
    console.log(texto);
  }
}

function cmdVerify(positional: string[], flags: Map<string, string>): void {
  const archivo = positional[0];
  if (!archivo) die("Uso: fmp-license verify <archivo.fmp>");
  if (!existsSync(archivo)) die(`No existe el archivo ${archivo}`);

  // Se quita el BOM: en Windows casi todo lo que escribe un archivo de texto
  // lo hace con BOM, y `JSON.parse` falla sin explicar el motivo real.
  const crudo = readFileSync(archivo, "utf8").replace(/^\uFEFF/, "");
  let envelope: LicenseEnvelope;
  try {
    envelope = JSON.parse(crudo) as LicenseEnvelope;
  } catch {
    die(`${archivo} no contiene un JSON de licencia legible.`);
  }
  // El equipo contra el que se comprueba. Por omisión, ESTE. Se puede cambiar
  // por el que da el cliente para responder "¿en la máquina del cliente sí
  // funciona?", que es la pregunta que llega a soporte.
  //
  // Sin esto, `verify` rechazaba toda licencia atada con el mensaje de atadura,
  // que está escrito para el usuario final y no para quien está diagnosticando
  // el archivo. Emisión y verificación tienen que usar la misma regla, o el
  // taller emite algo que su propia herramienta dice inválido.
  //
  // Se calcula solo si hace falta. `machineIdParts()` lee el serial de volumen y
  // la cuenta de Windows, que no es instantáneo, y una licencia portátil no lo
  // necesita para nada. Pedirlo siempre hacía que verificar una licencia de demo
  // tardara lo mismo que atar una.
  const pedido = flags.get("machine");
  let propio: string | undefined;
  const contra = pedido ? pedido.trim().toUpperCase() : undefined;
  if (!contra) propio = machineIdParts().id;
  const contraFinal = contra ?? propio!;

  // `--app` comprueba contra la clave que la app lleva embebida, no contra la
  // local. Es la pregunta que de verdad importa: "esta licencia, tal como está,
  // la va a aceptar el programa que le vendí al cliente?", y la local no la
  // contesta. Sin esta bandera el comando es un espejo de la clave local.
  const contraLaApp = flags.get("app") !== undefined;
  const clave = contraLaApp
    ? (publicKeyDeLaApp() ??
      die("No se encontró public-key.ts. Usa --key <ruta> en vez de --app."))
    : publicKeyOfIssuer(flags);

  const r = verifyLicense({
    envelope,
    publicKey: clave,
    machineId: contraFinal,
  });

  head(`Verificación de ${archivo}`);
  info(
    contraLaApp
      ? "Clave: la que lleva la app"
      : `Clave: ${flags.get("key") ?? KEY_PATH}`,
  );

  if (!contraLaApp) avisarSiNoEsLaDeLaApp(clave, publicKeyDeLaApp());

  if (r.ok) {
    ok("Firma válida");
    console.log(`  Titular:  ${r.payload!.subject}`);
    console.log(`  Nivel:    ${r.payload!.tier}`);
    console.log(`  Emitida:  ${new Date(r.payload!.iat * 1000).toLocaleString("es-MX")}`);
    console.log(`  Vence:    ${new Date(r.payload!.exp * 1000).toLocaleDateString("es-MX")}`);
    console.log(`  ID:       ${licenseId(envelope)}`);
    if (r.payload!.machine) {
      console.log(`  Atada a:  ${r.payload!.machine}`);
      if (!pedido) {
        console.log("            (comprobada en esta máquina)");
      } else {
        console.log("            (comprobada contra el id que pasaste, no contra este equipo)");
      }
    } else {
      console.log("  Atada a:  no, sirve en cualquier equipo");
    }
  } else {
    err(`Inválida: ${r.message}`);
    process.exitCode = 1;
  }
}

/**
 * Emite una licencia premium de largo plazo para la demo.
 *
 * Existe para que cualquiera que clone el repositorio pueda probar el producto
 * completo sin comprar nada ni hablar con nadie. Con 10 años no es un regalo
 * ambiguo: es una licencia de evaluación honesta, con su identificador
 * registrado en el informe.
 *
 * Si no hay clave local, usa la del repositorio en vez de exigir `keygen`. Es
 * una excepción deliberada a la regla de los demás comandos: el flujo de la
 * demo tiene que funcionar en un clon recién bajado, y hacerlo dependería de
 * un archivo que un clon no tiene. Y no abre ningún riesgo: esa clave ya está
 * en el repositorio, publicado y legible, y la app no puede cobrar con ella de
 * todas formas.
 */
function cmdDemo(flags: Map<string, string>): void {
  head("Licencia de demostración");
  const out = flags.get("out") ?? "demo-premium.fmp";
  const claveDelRepo = join(import.meta.dirname, "..", "demo-issuer.key.txt");
  const desdeElRepo =
    flags.get("key") === undefined && !existsSync(KEY_PATH);
  const envelope = issueLicense({
    tier: "premium",
    subject: "Demostración FixMyPhone",
    days: 3650,
    privateKey: loadIssuerKey(flags, claveDelRepo),
  });
  writeFileSync(out, JSON.stringify(envelope, null, 2), "utf8");
  ok(`Licencia de demo escrita en ${out}`);
  info(`ID: ${licenseId(envelope)}`);
  if (desdeElRepo) {
    info("Emitida con la clave que viaja en el repositorio, no con la tuya.");
    info("La app la acepta sin recompilar nada.");
  }
  info("Actívala en la app pegando el contenido del archivo, o cópiala con:");
  info(`  Get-Content ${out} -Raw | Set-Clipboard`);
}

// ---------------------------------------------------------------------------
// Utilidades internas
// ---------------------------------------------------------------------------

function publicKeyOfIssuer(flags: Map<string, string>): Buffer {
  // Se deriva de la privada, no se exporta: Node no puede exportar una
  // clave privada en formato SPKI.
  return publicKeyToBytes(publicKeyFrom(bytesToPrivateKey(loadIssuerKey(flags))));
}

/**
 * La clave pública que la app de este repositorio lleva embebida.
 *
 * Existe por una trampa muy concreta. `verify` comprueba contra la clave local
 * del emisor, así que una licencia firmada con CUALQUIER clave local sale con
 * "Firma válida": incluida la que emite alguien que acaba de correr `keygen` en
 * un clon limpio, que es justo lo que el README mandaba hacer. El taller ve
 * verde en la terminal y un rechazo en la pantalla de la app.
 *
 * Aquí se lee del archivo de texto que la app usa como fuente, así que no
 * hace falta compilar nada para saber si las dos claves coinciden. Si el
 * archivo no está —instalación global del paquete, copia suelta— se devuelve
 * null y no se dice nada: es una comodidad para diagnosticar, no una garantía.
 */
function publicKeyDeLaApp(): Buffer | null {
  const archivo = join(
    import.meta.dirname,
    "..",
    "..",
    "..",
    "apps",
    "desktop",
    "src",
    "main",
    "public-key.ts",
  );
  if (!existsSync(archivo)) return null;
  const base64url = /"([A-Za-z0-9_-]{43})"/.exec(readFileSync(archivo, "utf8"));
  return base64url ? Buffer.from(base64url[1]!, "base64url") : null;
}

/**
 * Imprime la diferencia entre la clave que se usó y la que lleva la app, y dice
 * si eso rompe algo.
 *
 * No es un aviso decorativo. Es la diferencia entre "el taller compró premium
 * y funciona" y "el taller compró premium y la app dice que la licencia está
 * dañada". Lo segundo se reporta como problema del cliente y se pierde un
 * cliente; lo primero se reporta como error de la herramienta.
 */
function avisarSiNoEsLaDeLaApp(usada: Buffer, app: Buffer | null): void {
  if (app === null) return;
  if (app.equals(usada)) return;

  warn("La clave del emisor NO es la que lleva la app.");
  info("  usada aquí  " + usada.toString("base64url"));
  info("  en la app   " + app.toString("base64url"));
  info("Lo de arriba puede ser correcto o no. Lo que NO puede ser correcto es");
  info("que la app rechace una licencia que aquí sale válida. Si eso pasa:");
  info("  1. Si la clave del emisor es la correcta, falta copiarla a");
  info("     apps/desktop/src/main/public-key.ts y recompilar.");
  info("  2. Si la que lleva la app es la correcta, emite con ella:");
  info("     fmp-license issue --key <ruta-de-esa-clave> ...");
  info("  3. Para comprobar contra la clave de la app sin cambiar nada:");
  info("     fmp-license verify <archivo.fmp> --app");
  console.log("");
}

// ---------------------------------------------------------------------------
// Principal
// ---------------------------------------------------------------------------

const HELP = `
fmp-license — licencias de FixMyPhone

  fmp-license keygen
      Genera la clave del emisor en ~/.fixmyphone/issuer.key. Una sola vez.
      Su clave pública hay que copiarla a la app, o nada de lo que emitas con
      ella va a ser aceptado. "public-key" te dice si ya está puesta.

  fmp-license issue --tier premium --subject "Taller Pérez" --days 365 --out t.fmp
      Emite una licencia. Sin --out la imprime en stdout.
      Con --machine <id> la ata a un equipo (ver "machine-id").

  fmp-license verify t.fmp
      Verifica firma y fechas. Devuelve código 1 si no es válida.
      Con --machine <id> la comprueba contra ese equipo en vez de este.
      Con --app la comprueba contra la clave que lleva la app, que es la
      comprobación que de verdad importa. Sin ninguna de las dos, se comprueba
      contra la clave local del emisor y eso solo prueba que la firma es
      coherente consigo misma.

  fmp-license machine-id
      Imprime el identificador de ESTE equipo, para atar una licencia.
      El técnico lo lee en la pantalla de licencia de la app y te lo dicta.

  fmp-license public-key
      Imprime la clave pública que va embebida en la app, y avisa si la que
      tienes no es la que ya está puesta.

  fmp-license demo --out demo.fmp
      Emite una licencia de evaluación de 10 años.

  --key <ruta>   en issue, verify, demo, public-key y keygen-free:
      Usa esa clave privada en vez de ~/.fixmyphone/issuer.key. Acepta un
      archivo con líneas de comentario que empiezan por #, que es como está
      la de demostración del repositorio.
`;

/**
 * Muestra el identificador de esta máquina y de qué está hecho.
 *
 * Se imprime el desglose y no solo el id, porque el que compra tiene que poder
 * ver qué se está atando. Un identificador opaco que sale de la nada se lee
 * como unTracker; "tu cuenta de Windows y el serial de tu disco, hasheados"
 * se lee como lo que es.
 */
function cmdMachineId(): void {
  const p = machineIdParts();
  console.log("");
  console.log(`  Id de equipo    ${p.id}`);
  console.log(`  De la cuenta    ${p.usuario}`);
  console.log(`  Del volumen     ${p.volumen}`);
  console.log("");
  console.log(
    "  Una licencia atada deja de validar si se reinstala Windows o si se",
    "renombra la cuenta. Para emitir una licencia portátil, no pongas --machine.",
  );
  console.log("");
}

const { flags, positional } = parseArgs(process.argv.slice(2));
const comando = positional[0];

try {
  switch (comando) {
    case "keygen":
      cmdKeygen();
      break;
    case "public-key":
      cmdPublicKey(flags);
      break;
    case "issue":
      cmdIssue(flags);
      break;
    case "verify":
      cmdVerify(positional.slice(1), flags);
      break;
    case "machine-id":
      cmdMachineId();
      break;
    case "demo":
      cmdDemo(flags);
      break;
    default:
      console.log(HELP);
  }
} catch (e) {
  die(e instanceof Error ? e.message : String(e));
}
