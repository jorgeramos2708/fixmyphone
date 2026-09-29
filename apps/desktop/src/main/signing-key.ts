/**
 * Clave de firma de la instalación.
 * ===========================================================================
 *
 * Cada instalación de FixMyPhone tiene su par Ed25519. La parte privada se
 * guarda en la carpeta de datos del usuario y no sale de ahí nunca; la parte
 * pública es la que va en el informe, para que el cliente pueda comprobar la
 * firma por su cuenta.
 *
 * POR QUÉ NO LA FIRMA EL FABRICANTE
 * ---------------------------------
 * Porque una clave privada dentro de un `.exe` que se distribuye no es privada.
 * Con ella, cualquiera que tenga el programa firma informes tan válidos como
 * los nuestros, y un informe firmado que se puede fabricar en casa no sirve
 * como prueba de nada. La clave de la instalación vive en la máquina del
 * taller, que es justo donde tiene que estar: la firma acredita "esto lo generó
 * esta instalación y no se ha tocado", y el taller publica su huella para que
 * el cliente pueda atar el informe a él.
 *
 * POR QUÉ HAY DOS FUNCIONES Y NO UNA
 * ----------------------------------
 * `signingKeyInfo` solo LEE. `loadOrCreateSigningKey` crea la clave si no
 * existe. No es la misma función con una bandera porque los dos usos piden
 * cosas opuestas: mostrar la huella en la pantalla de licencia es una lectura,
 * y una lectura que de paso crea un archivo en disco del usuario es una
 * escritura escondida. La lectura tiene que poder devolver la ausencia,
 * porque "todavía no hay clave" es un estado real y honesto de la pantalla.
 *
 * SI SE PIERDE EL ARCHIVO
 * -----------------------
 * Los informes ya firmados siguen verificando: la verificación usa la clave
 * pública que va DENTRO de cada informe, no la de esta máquina. Lo que se
 * pierde es la posibilidad de seguir firmando con la MISMA huella, y con ella
 * la de demostrar que dos informes de este taller son del mismo taller. Por
 * eso la clave nunca se sobrescribe aunque se pueda regenerar, y por eso la
 * app dice cuál es su huella en pantalla: el taller puede publicarla antes de
 * necesitarla.
 */

import { chmodSync, existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { generateKeyPair, publicKeyFrom, publicKeyToBytes, bytesToPrivateKey, type KeyPair } from "@fixmyphone/licensing";
import { keyFingerprint } from "@fixmyphone/licensing/report-signature";

/** Nombre del archivo dentro de la carpeta de datos del usuario. */
export const SIGNING_KEY_FILE = "signing.key";

export interface SigningKeyInfo {
  /** Huella de la clave pública, 32 hex en mayúscula. */
  kid: string;
  /** Clave pública en base64url. Es pública: se puede publicar. */
  publicKey: string;
  /** Si el archivo ya existe. `false` = la instalación todavía no ha firmado. */
  existe: boolean;
}

function rutaKey(dataDir: string): string {
  return join(dataDir, SIGNING_KEY_FILE);
}

/**
 * Lee la clave sin crearla.
 *
 * Si el archivo no existe devuelve `existe: false` con la huella vacía. Es lo
 * que la pantalla de licencia muestra en una instalación que todavía no ha
 * exportado ningún informe, y esconderlo sustituido por una clave recién
 * generada sería mentir sobre algo que el técnico puede comprobar: si la
 * huella que ve cambia cada vez que abre la app, no significa nada.
 */
export function signingKeyInfo(dataDir: string): SigningKeyInfo {
  const ruta = rutaKey(dataDir);
  if (!existsSync(ruta)) return { kid: "", publicKey: "", existe: false };
  try {
    const publica = publicaDe(leerSemilla(ruta));
    return { kid: keyFingerprint(publica), publicKey: publica.toString("base64url"), existe: true };
  } catch {
    // Un archivo corrupto no se puede recuperar desde la app sin borrarlo, y
    // borrarlo sería perder la identidad de firma del taller sin avisar. Se
    // reporta como "no hay" y el técnico ve que hay un problema al firmar.
    return { kid: "", publicKey: "", existe: false };
  }
}

/**
 * Devuelve el par de la instalación, creándolo la primera vez.
 *
 * Lanza si el archivo existe pero está dañado, a propósito: un `signing.key`
 * con basura es un incidente que hay que ver, no una razón para generar otra
 * clave en silencio y cambiarle la huella al taller.
 */
export function loadOrCreateSigningKey(dataDir: string): KeyPair {
  const ruta = rutaKey(dataDir);
  if (!existsSync(ruta)) {
    if (!existsSync(dataDir)) mkdirSync(dataDir, { recursive: true });
    const kp = generateKeyPair();
    writeFileSync(ruta, kp.privateKey.toString("base64url"), "utf8");
    try {
      // En Windows chmod es casi decorativo; en Linux y macOS evita que otro
      // usuario del sistema del taller lea la clave. Mismo criterio que el
      // archivo del emisor.
      chmodSync(ruta, 0o600);
    } catch {
      /* sin soporte de permisos en esta plataforma */
    }
    return kp;
  }
  const privada = leerSemilla(ruta);
  return { privateKey: privada, publicKey: publicaDe(privada) };
}

/**
 * Lee la semilla de 32 bytes.
 *
 * Se toleran comentarios y saltos de línea porque el archivo se puede abrir y
 * anotar a mano (para backed up en papel, por ejemplo), pero se mide la
 * longitud antes de devolver nada, por el mismo motivo que en el CLI del
 * emisor: un archivo equivocado no falla con un error de OpenSSL, falla con
 * "el taller firmó informes que el cliente no puede verificar", que es un
 * problema de soporte mucho más caro que un mensaje de error al firmar.
 *
 * Se borra TODO el espacio en blanco, no solo el de los extremos. Un archivo
 * guardado en Windows con CRLF deja un `\r` pegado al final de cada línea, y
 * ese carácter sí llega al base64: el resultado sería una semilla de 32 bytes
 * con basura y un rechazo que no dice de dónde salió el problema.
 */
function leerSemilla(ruta: string): Buffer {
  const limpia = readFileSync(ruta, "utf8")
    .split("\n")
    .filter((l) => l.trim() && !l.trimStart().startsWith("#"))
    .join("")
    .replace(/\s/g, "");
  const bytes = Buffer.from(limpia, "base64url");
  if (bytes.length !== 32) {
    throw new Error(
      `${SIGNING_KEY_FILE} no contiene una semilla Ed25519 de 32 bytes (se leyeron ${bytes.length}). ` +
        "No se regenera: hacerlo cambiaría la huella de firma de este taller. " +
        "Borra el archivo solo si aceptas que los informes nuevos tendrán otra huella.",
    );
  }
  return bytes;
}

function publicaDe(privada: Buffer): Buffer {
  return publicKeyToBytes(publicKeyFrom(bytesToPrivateKey(privada)));
}
