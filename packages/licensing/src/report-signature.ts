/**
 * FIXMYPHONE — Firma digital del informe
 * ===========================================================================
 *
 * QUIÉN FIRMA, Y POR QUÉ NO ES EL FABRICANTE
 * -------------------------------------------
 * Lo natural sería que el informe lo firmara la empresa que vende el programa,
 * con una clave privada que va dentro del `.exe`. Eso es exactamente lo que NO
 * se puede hacer, y la razón es la misma por la que la app solo lleva la clave
 * PÚBLICA del emisor de licencias:
 *
 *   Una clave privada dentro de un ejecutable que se distribuye no es privada.
 *   Cualquiera que tenga el `.exe` —es decir, cualquiera que tenga una
 *   licencia, o que la haya copiado— la extrae en cinco minutos y firma
 *   informes tan válidos como los nuestros. Un informe firmado sirve para
 *   dar fe de la prueba; si la firma se puede fabricar en casa, no sirve para
 *   nada.
 *
 * Entonces firma la INSTALACIÓN: la app genera un par Ed25519 la primera vez
 * que firma un informe, guarda la parte privada en la carpeta de datos del
 * usuario y solo usa la pública para firmar. Cada taller tiene la suya.
 *
 * QUÉ PROBADA LA FIRMA, CON CLARIDAD
 * ----------------------------------
 * Esto es lo importante, y es lo que una firma mal entendida convierte en una
 * mentira:
 *
 *   - SÍ prueba que el archivo no fue alterado después de generarse.
 *   - NO prueba que lo haya hecho FixMyPhone.
 *   - NO prueba quién lo firmó, salvo que se compare la huella con una clave
 *     que venga de FUERA del archivo.
 *
 * Esa última línea es la trampa clásica de la autocomprobación. Si el
 * verificador saca la clave pública del mismo archivo que está verificando,
 * entonces cualquiera puede generar su propio par, firmar un informe inventado
 * y obtener "firma válida" con su propia clave. Por eso `verifyReport` dice
 * explícitamente si la clave vino de afuera o del propio archivo, y el
 * verificador de línea de comandos lo repite con otras palabras.
 *
 * LA CADENA, PARA LO QUE SÍ QUEDA CERRADO
 * ----------------------------------------
 * La firma de la instalación sola prueba integridad. Para poder afirmar además
 * que el taller tenía una licencia premium LOSSO de nosotros, el bloque de
 * firma lleva dentro el sobre de la licencia, que va firmado por la clave del
 * fabricante. Ese sobre se puede comprobar sin servidor contra la clave
 * pública que ya viaja en la app. La cadena es:
 *
 *   FixMyPhone firmó la licencia  →  la licencia va dentro del informe
 *   →  la instalación firmó el informe  →  el archivo no se ha tocado
 *
 * Eso es comprobable entero, sin internet y sin servidor, y ninguna de las dos
 * claves privadas sale de la máquina que las generó.
 *
 * DÓNDE TERMINA EL INFORME
 * ------------------------
 * La firma cubre TODO lo que va antes de la línea `-----BEGIN`, incluido el
 * texto de este bloque. Los metadatos (huella, fecha, licencia) van dentro de
 * la firma y no solo al lado: si la huella se pudiera cambiar sin romperla,
 * la huella no serviría para nada. Por eso el mensaje que se firma es el
 * informe + una serialización canónica de los metadatos, en orden fijo.
 *
 * CUIDADO CON ALGO QUE PARECE DESPRECIOBLE
 * -----------------------------------------
 * Guardar el informe en el bloc de notas de Windows y volver a guardarlo
 * cambia los bytes: mete BOM y cambia los saltos de línea a CRLF. El contenido
 * queda idéntico y la firma deja de validar. `verifyReport` detecta ese caso
 * exacto y lo dice, en vez de devolver un "firma inválida" que manda al
 * cliente a sospechar del taller. Un informe que se rompió al reguardarlo no es
 * un informe falso, y la herramienta tiene que distinguir las dos cosas.
 */

import { createHash, sign as cryptoSign, verify as cryptoVerify } from "node:crypto";
import { bytesToPrivateKey, bytesToPublicKey, licenseId, publicKeyFrom, publicKeyToBytes } from "./index.ts";

// ---------------------------------------------------------------------------
// Formato del bloque
// ---------------------------------------------------------------------------

/** Abre el bloque de firma. Todo lo anterior a esta línea está firmado. */
export const SIGNATURE_BEGIN = "-----BEGIN FIXMYPHONE REPORT SIGNATURE-----";
export const SIGNATURE_END = "-----END FIXMYPHONE REPORT SIGNATURE-----";

/** Lo que va dentro del bloque. Todo, menos `sig`, está firmado. */
export interface ReportSignature {
  v: 1;
  alg: "ed25519";
  /** Huella de la clave pública. 32 hex en mayúscula, como el id de equipo. */
  kid: string;
  /** Clave pública de la instalación, en base64url. 32 bytes. */
  key: string;
  /** La firma. 64 bytes, en base64url. */
  sig: string;
  /** Cuándo se firmó, ISO-8601. */
  signed_at: string;
  /** Qué versión de la herramienta lo generó. */
  tool: string;
  /** La licencia con la que se generó, si la había. */
  license: ReportLicense | null;
}

export interface ReportLicense {
  /** `licenseId` del sobre. */
  id: string;
  tier: "free" | "premium";
  subject: string;
  /**
   * El sobre tal cual, para que se pueda comprobar contra la clave del
   * fabricante sin pedirle nada a nadie.
   */
  envelope: { payload: string; signature: string };
}

// ---------------------------------------------------------------------------
// Huella
// ---------------------------------------------------------------------------

/**
 * Huella de una clave pública: 16 bytes de SHA-256, 32 hex en mayúscula.
 *
 * El formato es el mismo que el identificador de equipo y a propósito. Los dos
 * aparecen en la misma pantalla, los dos se leen en voz alta al teléfono, y
 * dos identificadores con reglas distintas al lado uno del otro se teclean
 * mal. Y van en mayúscula por lo mismo.
 *
 * NO es una huella de la clave completa con su prefijo DER: son los 32 bytes
 * crudos, igual que en `publicKeyToBytes`. Si se mezclaran las dos
 * representations, dos claves idénticas darían huellas distintas y el taller
 * perdería la capacidad de demostrar que el informe es suyo.
 */
export function keyFingerprint(publicKey: Buffer): string {
  return createHash("sha256").update(publicKey).digest("hex").slice(0, 32).toUpperCase();
}

// ---------------------------------------------------------------------------
// Serialización canónica
// ---------------------------------------------------------------------------

/**
 * Los metadatos en orden fijo, como cadena.
 *
 * Se reconstruye el objeto a mano, campo por campo, en vez de re-serializar
 * lo que se parseó. Si depends del orden con el que venía en el JSON, basta
 * con que alguien reescriba el bloque con las llaves en otro orden para que la
 * verificación falle y no se entienda por qué. Aquí el orden lo decide este
 * archivo, no el archivo ajeno.
 */
function canonical(meta: Omit<ReportSignature, "sig">): string {
  return JSON.stringify({
    v: meta.v,
    alg: meta.alg,
    kid: meta.kid,
    key: meta.key,
    signed_at: meta.signed_at,
    tool: meta.tool,
    license: meta.license
      ? {
          id: meta.license.id,
          tier: meta.license.tier,
          subject: meta.license.subject,
          envelope: {
            payload: meta.license.envelope.payload,
            signature: meta.license.envelope.signature,
          },
        }
      : null,
  });
}

/** Lo que realmente se firma: el informe, y pegado a él lo que se afirma. */
function mensaje(prefijo: string, meta: Omit<ReportSignature, "sig">): Buffer {
  return Buffer.from(`${prefijo}\n${canonical(meta)}`, "utf8");
}

// ---------------------------------------------------------------------------
// Firma
// ---------------------------------------------------------------------------

export interface SignOptions {
  /** Clave privada de la instalación, 32 bytes crudos. */
  privateKey: Buffer;
  /** Versión de la herramienta que genera el informe. */
  tool: string;
  /** Para poder probar sin depender del reloj. */
  signedAt?: Date;
  /** Licencia activa, si la hay. Viaja DENTRO de la firma. */
  license?: ReportLicense | null;
}

/** Texto explicativo del bloque. Va firmado, así que se puede confiar en él. */
function encabezado(meta: Omit<ReportSignature, "sig">): string {
  const partes: string[] = [];
  partes.push("");
  partes.push("=".repeat(66));
  partes.push("  FIRMA DIGITAL - Ed25519");
  partes.push("=".repeat(66));
  partes.push("");
  partes.push("  Todo lo que esta arriba, hasta la linea anterior a este");
  partes.push("  bloque, esta firmado. Editar una sola letra lo invalida, y la");
  partes.push("  herramienta que verifica lo dice con todas las palabras.");
  partes.push("");
  partes.push("  Que prueba esta firma:");
  partes.push("    - Que el archivo no fue alterado despues de generarse.");
  partes.push("");
  partes.push("  Que NO prueba, y conviene tenerlo claro:");
  partes.push("    - Que lo haya hecho FixMyPhone. La clave es de ESTA");
  partes.push("      instalacion, no del fabricante: la parte privada nunca");
  partes.push("      sale de esta maquina y no la tiene nadie mas.");
  partes.push("    - Quien lo firmo. Para eso hay que comparar la huella de");
  partes.push("      abajo con la que te da el taller, por un canal aparte.");
  partes.push("");
  partes.push(`  Herramienta  ${meta.tool}`);
  partes.push(`  Firmado      ${meta.signed_at}`);
  if (meta.license) {
    partes.push(`  Licencia     ${meta.license.id}  (${meta.license.tier} - ${meta.license.subject})`);
  } else {
    partes.push("  Licencia     ninguna: plan gratuito");
  }
  partes.push(`  Huella       ${meta.kid}`);
  partes.push("");
  partes.push("  Para comprobarlo, con la herramienta de linea de comandos:");
  partes.push("    fmp-license verify-informe este-archivo.txt");
  partes.push("    fmp-license verify-informe este-archivo.txt --clave <huella>");
  // Una línea en blanco de separación. Sin ella la marca de apertura queda
  // pegada a la instrucción de arriba y el archivo se lee como un bloque
  // solo, que es justo lo contrario de lo que dice el texto.
  partes.push("");
  partes.push("");
  return partes.join("\n");
}

/**
 * Firma el informe y devuelve el archivo completo, listo para guardarse.
 *
 * El cuerpo (`body`) llega sin firmar y sale con el bloque encima. Nunca se
 * firma el archivo entero, porque el bloque está dentro del archivo: eso sería
 * un nudo. Se firma todo lo anterior a la marca de apertura, que es exactamente
 * lo que un verificador recupera partiendo por esa marca.
 */
export function signReport(body: string, opts: SignOptions): string {
  const privada = bytesToPrivateKey(opts.privateKey);
  const publica = publicKeyToBytes(publicKeyFrom(privada));

  const sinFirma: Omit<ReportSignature, "sig"> = {
    v: 1,
    alg: "ed25519",
    kid: keyFingerprint(publica),
    key: publica.toString("base64url"),
    signed_at: (opts.signedAt ?? new Date()).toISOString(),
    tool: opts.tool,
    license: opts.license ?? null,
  };

  const prefijo = `${body}${encabezado(sinFirma)}`;
  const firma = cryptoSign(null, mensaje(prefijo, sinFirma), privada);

  const meta: ReportSignature = { ...sinFirma, sig: firma.toString("base64url") };
  return `${prefijo}${SIGNATURE_BEGIN}\n${JSON.stringify(meta)}\n${SIGNATURE_END}\n`;
}

// ---------------------------------------------------------------------------
// Verificación
// ---------------------------------------------------------------------------

export type ReportProblem =
  | "sin_firma"
  | "varios_bloques"
  | "contenido_despues"
  | "bloque_malformado"
  | "version_desconocida"
  | "clave_distinta"
  | "firma_invalida"
  | "reescrito";

const PROBLEM_COPY: Record<ReportProblem, string> = {
  sin_firma:
    "Este archivo no tiene bloque de firma. Puede ser un informe del plan gratuito, o un archivo al que se le quitó la firma.",
  varios_bloques:
    "El archivo tiene más de un bloque de firma. Eso no lo produce la herramienta: un bloque pegado encima de otro es la forma de intentar colar un informe. Pide el archivo original.",
  contenido_despues:
    "Hay texto después del bloque de firma. Ese texto no está firmado y no pertenece al informe. Alguien lo agregó después de generarlo.",
  bloque_malformado:
    "El bloque de firma no se pudo leer. El archivo está dañado o el bloque se editó a mano.",
  version_desconocida:
    "El bloque de firma usa un formato que esta versión no entiende.",
  clave_distinta:
    "El informe lo firmó una clave distinta de la esperada. La firma es coherente consigo misma, pero no es la del taller que se dijo que lo hizo.",
  firma_invalida:
    "El contenido del informe no coincide con lo firmado. O se alteró el archivo, o la firma se fabricó.",
  reescrito:
    "El archivo se volvió a guardar con otro programa: el contenido sigue igual, pero cambiaron los bytes (BOM al principio o saltos de línea CRLF). La firma cubre los bytes originales, no los que tiene el archivo ahora.",
};

export interface VerifyReportOptions {
  /**
   * Clave pública contra la que se quiere comprobar, en bytes crudos.
   *
   * ES LA OPCIÓN QUE SÍ ATRIBUYE. Si se pasa, el resultado dice que el informe
   * lo firmó esa clave concreta, y eso es comprobable por un tercero. Si no se
   * pasa, se usa la del propio archivo y el resultado solo dice que el
   * archivo no se ha tocado.
   */
  publicKey?: Buffer;
}

export interface VerifyReportResult {
  ok: boolean;
  problem?: ReportProblem;
  /** Para mostrar, en español llano. */
  message: string;
  /** Lo que decía el bloque, si se pudo leer. */
  meta?: ReportSignature;
  /**
   * De dónde salió la clave con la que se comprobó.
   *
   * `"esperada"` = la pasó quien verifica, y la atribución vale.
   * `"propia"`   = la del propio archivo, y la atribución NO vale.
   */
  clave: "esperada" | "propia" | null;
  /**
   * `true` solo cuando el problema es `reescrito` y el contenido normalizado
   * sí valida. Sirve para decir "el contenido está intacto, los bytes no", que
   * son dos afirmaciones distintas y el técnico necesita las dos.
   */
  intactoTrasReescribir?: boolean;
}

function fallo(problem: ReportProblem, clave: VerifyReportResult["clave"] = null): VerifyReportResult {
  return { ok: false, problem, message: PROBLEM_COPY[problem], clave };
}

/** Quita BOM y pasa CRLF a LF. Solo para DIAGNOSTICAR, nunca para dar por bueno. */
function normaliza(texto: string): string {
  return texto.replace(/^\uFEFF/, "").replace(/\r\n/g, "\n");
}

export function verifyReport(texto: string, opts: VerifyReportOptions = {}): VerifyReportResult {
  // --- 1) ¿Hay bloque? ----------------------------------------------------
  const apariciones = texto.split(SIGNATURE_BEGIN).length - 1;
  if (apariciones === 0) return fallo("sin_firma");
  if (apariciones > 1) return fallo("varios_bloques");

  const i = texto.indexOf(SIGNATURE_BEGIN);
  const prefijo = texto.slice(0, i);
  const j = texto.indexOf(SIGNATURE_END, i);
  if (j === -1) return fallo("bloque_malformado");

  // Contenido después del bloque: el que se pueda quitar sin dejar nada es
  // basura de un editor; lo que no, es texto pegado al informe.
  if (texto.slice(j + SIGNATURE_END.length).trim() !== "") {
    return fallo("contenido_despues");
  }

  // --- 2) Metadatos legibles ----------------------------------------------
  let meta: ReportSignature;
  try {
    meta = JSON.parse(texto.slice(i + SIGNATURE_BEGIN.length, j).trim()) as ReportSignature;
  } catch {
    return fallo("bloque_malformado");
  }
  if (!meta || typeof meta !== "object" || meta.v !== 1) {
    return fallo(meta && (meta as { v?: unknown }).v !== 1 ? "version_desconocida" : "bloque_malformado");
  }
  if (meta.alg !== "ed25519") return fallo("version_desconocida");
  if (typeof meta.key !== "string" || typeof meta.sig !== "string") return fallo("bloque_malformado");

  const clavePropia = Buffer.from(meta.key, "base64url");
  const firma = Buffer.from(meta.sig, "base64url");
  if (clavePropia.length !== 32 || firma.length !== 64) return fallo("bloque_malformado", "propia");

  // --- 3) ¿La clave es la que se esperaba? --------------------------------
  //
  // Va antes de verificar la firma a propósito. Si el archivo lo firmó otra
  // clave, el resultado que importa no es "la firma cuadra" sino "esta firma no
  // es la del taller que te dijo que lo hizo": son preguntas distintas, y
  // contestar la primera es justo el error que hace pasar por bueno un informe
  // de otro taller.
  if (opts.publicKey && !opts.publicKey.equals(clavePropia)) {
    return {
      ...fallo("clave_distinta", "esperada"),
      meta,
    };
  }

  const clave = opts.publicKey ?? clavePropia;
  const deDonde: "esperada" | "propia" = opts.publicKey ? "esperada" : "propia";

  // --- 4) La firma, sobre el contenido y sobre lo que se afirma de él ------
  const { sig: _sig, ...afirmado } = meta;
  let firmaOk = false;
  try {
    firmaOk = cryptoVerify(null, mensaje(prefijo, afirmado), bytesToPublicKey(clave), firma);
  } catch {
    firmaOk = false;
  }

  if (firmaOk) {
    return {
      ok: true,
      message:
        deDonde === "esperada"
          ? "Firma válida, y la firmó la clave que indicaste."
          : "Firma válida: el archivo no fue alterado desde que se generó. Esto NO dice quién lo firmó; la clave se sacó del propio archivo. Para comprobarlo, pasa --clave con la huella que te da el taller.",
      meta,
      clave: deDonde,
    };
  }

  // --- 5) ¿Se rompió al reguardarlo? --------------------------------------
  //
  // Es el falso positivo más caro de esta herramienta. Guardar el informe en el
  // bloc de notas y volver a guardarlo mete BOM y pone CRLF: el contenido
  // humano es idéntico, los bytes no, y la firma deja de validar. Decirle al
  // técnico que su informe es falso cuando lo único que pasó fue que lo
  // reabrió es un costo que el taller paga con la credibility del producto.
  const normalizado = normaliza(prefijo);
  if (normalizado !== prefijo) {
    let trasNormalizar = false;
    try {
      trasNormalizar = cryptoVerify(
        null,
        mensaje(normalizado, afirmado),
        bytesToPublicKey(clave),
        firma,
      );
    } catch {
      trasNormalizar = false;
    }
    if (trasNormalizar) {
      return {
        ok: false,
        problem: "reescrito",
        message: PROBLEM_COPY.reescrito,
        meta,
        clave: deDonde,
        intactoTrasReescribir: true,
      };
    }
  }

  return { ok: false, problem: "firma_invalida", message: PROBLEM_COPY.firma_invalida, meta, clave: deDonde };
}

// ---------------------------------------------------------------------------
// Utilidad
// ---------------------------------------------------------------------------

/** Arma el bloque de licencia que va dentro de la firma, si la hay. */
export function reportLicense(
  envelope: { payload: string; signature: string } | null,
  tier: "free" | "premium",
  subject: string,
): ReportLicense | null {
  if (!envelope) return null;
  return { id: licenseId(envelope), tier, subject, envelope };
}
