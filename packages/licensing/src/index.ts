/**
 * FIXMYPHONE — Licencias
 * ===========================================================================
 *
 * Decisión de producto: la licencia es un ARCHIVO firmado con Ed25519 que la
 * app valida en local. No hay servidor.
 *
 * Por qué, y no una llamada a una API:
 *
 *   - El taller funciona sin internet. En un taller de reparación eso no es
 *     un extra: el internet se cae, el equipo del cliente está abierto sobre
 *     la mesa y el técnico necesita terminar el trabajo.
 *   - No hay una base de datos de clientes que mantener, respaldar ni
 *     proteger. Para un producto de taller, eso es una ventaja operativa
 *     enorme.
 *   - No se puede revocar una licencia que se filtró. Es el precio. Para este
 *     producto es aceptable: se compra por confianza, no por suscripción, y
 *     quien piratea una herramienta de taller no vuelve.
 *
 * Lo que NO se hace aquí, y es importante que quede dicho: no se emite ni se
 * altera nada del hardware del cliente. La licencia no toca el IMEI ni el
 * ESN, y no habilita ninguna forma de saltarse el bloqueo de activación de
 * Google (FRP). Ambas cosas están prohibidas por la LFPI en México y
 * manualmente por las operadoras; además harían que ninguna aseguradora
 * cubriera el daño. Este módulo solo decide qué tan completa es la
 * herramienta, nunca cómo se desbloquea un equipo.
 *
 * FORMATO DEL ARCHIVO (.fmp)
 * --------------------------
 * Un JSON con dos campos, en base64url:
 *
 *   { "payload": "<base64url del JSON de la licencia>",
 *     "signature": "<base64url de los 64 bytes Ed25519>" }
 *
 * El `payload` firmado contiene exactamente:
 *
 *   { "v": 1, "tier": "premium", "subject": "Taller Pérez",
 *     "iat": 1767225600, "exp": 1798761600,
 *     "machine": null, "features": ["report_signature", "unlimited_diagnostics"] }
 *
 * `machine` es opcional y hoy siempre `null`: la licencia es portable entre
 * máquinas de un mismo taller. Cuando haga falta atarla a un equipo, se
 * rellena con un hash del identificador y se documenta el cambio de
 * condiciones. Se decide al vender, no al implementar.
 */

import {
  createHash,
  createPublicKey,
  createPrivateKey,
  generateKeyPairSync,
  sign as cryptoSign,
  verify as cryptoVerify,
  type KeyObject,
} from "node:crypto";

// ---------------------------------------------------------------------------
// Niveles
// ---------------------------------------------------------------------------

export type LicenseTier = "free" | "premium";

/**
 * Lo que distingue a un nivel de otro. Explícito, no implícito.
 *
 * OJO CON ESTA LISTA
 * ------------------
 * Este arreglo se escribe DENTRO de la licencia que se entrega al cliente
 * (`LicensePayload.features`). No es un catálogo interno: es lo que el taller
 * compró, literal, en un archivo que puede abrir con el bloc de notas. Por eso
 * solo puede listar cosas que EXISTEN.
 *
 * Se quitaron `evidence_export`, `history` y `catalog_full`: estaban declaradas
 * aquí y no implementadas en ninguna parte. El botón de Historial está
 * deshabilitado, no hay ni orden ni historial que guardar, y no hay filtro de
 * catálogo. Una licencia que promete cinco funciones y cumple dos es un
 * problema de soporte y un reembolso, y el arreglo más barato es no prometer.
 *
 * Cuando se implementen, se vuelven a agregar AQUÍ y en el mismo commit que las
 * haga funcionar. La prueba de tools/probar-licensing.mjs que compara esta
 * lista con la de las funciones que existen falla si se agrega un nombre sin
 * hacerlo, que es la unica forma de que esta promesa no crezca sola.
 */
export const TIER_FEATURES: Record<LicenseTier, string[]> = {
  free: ["diagnostics_daily_limit", "report_watermark"],
  premium: ["diagnostics_unlimited", "report_signature"],
};

/** Tope del plan gratuito. No negociable desde la app. */
export const FREE_DAILY_LIMIT = 2;

// ---------------------------------------------------------------------------
// Cargas útiles
// ---------------------------------------------------------------------------

export interface LicensePayload {
  /** Versión del formato. Si someday cambia, el validador puede rechazarla. */
  v: 1;
  tier: LicenseTier;
  /** A nombre de quién se emitió. Aparece en el informe. */
  subject: string;
  /** Emitida, epoch en segundos. */
  iat: number;
  /** Vence, epoch en segundos. */
  exp: number;
  /** Hash de máquina opcional. `null` = portable. */
  machine: string | null;
  features: string[];
}

export interface LicenseEnvelope {
  payload: string;
  signature: string;
}

// ---------------------------------------------------------------------------
// Resultado de verificar
// ---------------------------------------------------------------------------

export type LicenseProblem =
  | "malformada"
  | "firma_invalida"
  | "emitida_en_el_futuro"
  | "expirada"
  | "version_desconocida"
  | "nivel_desconocido";

export interface VerifyResult {
  ok: boolean;
  problem?: LicenseProblem;
  /** Texto listo para mostrar al técnico, en español llano. */
  message: string;
  payload?: LicensePayload;
}

const PROBLEM_COPY: Record<LicenseProblem, string> = {
  malformada: "El archivo no tiene la forma de una licencia de FixMyPhone.",
  firma_invalida:
    "La firma no corresponde a la clave de FixMyPhone. O el archivo se alteró, o no lo emitimos nosotros.",
  emitida_en_el_futuro:
    "La licencia tiene fecha de emisión posterior a la de este equipo. Revisa la hora del sistema.",
  expirada: "La licencia venció. Emite una nueva con el mismo comando de siempre.",
  version_desconocida: "La licencia usa un formato que esta versión no entiende.",
  nivel_desconocido: "La licencia declara un nivel que no existe.",
};

// ---------------------------------------------------------------------------
// Claves Ed25519
// ---------------------------------------------------------------------------

/**
 * Conversión entre claves Ed25519 y bytes planos.
 *
 * Node habla DER; el archivo de clave que guardamos en disco debe ser legible
 * y comparable con `cat`, así que se guardan las 32 y 64 bytes crudas. Los
 * prefijos DER son fijos y públicos (RFC 8410), no son un secreto ni una
 * decisión de diseño.
 */
const SPKI_ED25519_PREFIX = Buffer.from("302a300506032b6570032100", "hex");
const PKCS8_ED25519_PREFIX = Buffer.from("302e020100300506032b657004220420", "hex");

export function publicKeyToBytes(key: KeyObject): Buffer {
  const der = key.export({ type: "spki", format: "der" }) as Buffer;
  return der.subarray(SPKI_ED25519_PREFIX.length);
}

export function privateKeyToBytes(key: KeyObject): Buffer {
  const der = key.export({ type: "pkcs8", format: "der" }) as Buffer;
  return der.subarray(PKCS8_ED25519_PREFIX.length);
}

export function bytesToPublicKey(bytes: Buffer): KeyObject {
  // `type: "spki"` es obligatorio: Node no lo infiere del DER cuando se le
  // pasa un Buffer, y falla con `key.type is invalid. Received undefined`.
  // El error parecido que aparece al DERIVAR la pública de una privada
  // (`options.type is invalid. Received 'spki'`) viene de `key.export()`, que
  // sí rechaza SPKI sobre una clave privada. Son dos cosas distintas.
  return createPublicKey({
    key: Buffer.concat([SPKI_ED25519_PREFIX, bytes]),
    format: "der",
    type: "spki",
  });
}

/**
 * Deriva la clave pública a partir de un objeto de clave privada.
 *
 * Existe porque `key.export({ type: "spki" })` sobre una clave PRIVADA lanza
 * `The property 'options.type' is invalid`: SPKI solo describe claves
 * públicas. La forma correcta es pedirle a Node que derive la parte pública de
 * la privada, y exportar eso.
 */
export function publicKeyFrom(privateKey: KeyObject): KeyObject {
  return createPublicKey(privateKey);
}

export function bytesToPrivateKey(bytes: Buffer): KeyObject {
  return createPrivateKey({
    key: Buffer.concat([PKCS8_ED25519_PREFIX, bytes]),
    format: "der",
    type: "pkcs8",
  });
}

export interface KeyPair {
  /** 64 bytes crudos (seed + pub). Se guarda en `~/.fixmyphone/issuer.key`. */
  privateKey: Buffer;
  /** 32 bytes crudos. Viaja DENTRO de la app, nunca con la licencia. */
  publicKey: Buffer;
}

export function generateKeyPair(): KeyPair {
  const { publicKey, privateKey } = generateKeyPairSync("ed25519");
  return {
    privateKey: privateKeyToBytes(privateKey),
    publicKey: publicKeyToBytes(publicKey),
  };
}

// ---------------------------------------------------------------------------
// Emisión (lado del taller, con la clave privada)
// ---------------------------------------------------------------------------

export interface IssueOptions {
  tier: LicenseTier;
  subject: string;
  /** Días de validez desde ahora. 365 para una licencia de taller. */
  days: number;
  privateKey: Buffer;
  /** Atar a una máquina concreta. `null` = portable. */
  machine?: string | null;
}

export function issueLicense(opts: IssueOptions): LicenseEnvelope {
  const ahora = Math.floor(Date.now() / 1000);
  const payload: LicensePayload = {
    v: 1,
    tier: opts.tier,
    subject: opts.subject.trim() || "Sin titular",
    iat: ahora,
    // El margen absorbe el desfase de reloj entre el taller y el equipo del
    // cliente. 24 h es suficiente para zonas horarias; un reloj muy desviado
    // es un problema del taller, no una razón para perpetual.
    exp: ahora + opts.days * 86400,
    machine: opts.machine ?? null,
    features: TIER_FEATURES[opts.tier],
  };

  const json = Buffer.from(JSON.stringify(payload), "utf8");
  const firma = cryptoSign(null, json, bytesToPrivateKey(opts.privateKey));

  return {
    payload: json.toString("base64url"),
    signature: firma.toString("base64url"),
  };
}

// ---------------------------------------------------------------------------
// Verificación (lado de la app, solo con la clave pública)
// ---------------------------------------------------------------------------

export interface VerifyOptions {
  envelope: LicenseEnvelope;
  /** Clave pública del fabricante, embebida en la app. */
  publicKey: Buffer;
  /** Margen de reloj tolerado, en segundos. */
  clockSkewSec?: number;
  /** Identificador de esta máquina, si la licencia está atada a una. */
  machineId?: string | null;
  /** Fecha actual inyectada. Existe para poder probar sin esperar un año. */
  now?: number;
}

export function verifyLicense(opts: VerifyOptions): VerifyResult {
  const now = opts.now ?? Math.floor(Date.now() / 1000);
  const skew = opts.clockSkewSec ?? 86400;

  // --- 1) Sobre legible --------------------------------------------------
  let json: Buffer;
  let firma: Buffer;
  try {
    json = Buffer.from(opts.envelope.payload, "base64url");
    firma = Buffer.from(opts.envelope.signature, "base64url");
  } catch {
    return { ok: false, problem: "malformada", message: PROBLEM_COPY.malformada! };
  }

  if (json.length === 0 || firma.length !== 64) {
    return { ok: false, problem: "malformada", message: PROBLEM_COPY.malformada! };
  }

  // --- 2) Firma. Va PRIMERO, antes de interpretar nada. ------------------
  // Si el contenido no coincide con lo firmado, todo lo que haya dentro es
  // basura: no tiene sentido leer `tier` de un objeto que alguien alteró.
  let firmaOk = false;
  try {
    firmaOk = cryptoVerify(null, json, bytesToPublicKey(opts.publicKey), firma);
  } catch {
    firmaOk = false;
  }
  if (!firmaOk) {
    return { ok: false, problem: "firma_invalida", message: PROBLEM_COPY.firma_invalida! };
  }

  // --- 3) Contenido ------------------------------------------------------
  let p: LicensePayload;
  try {
    p = JSON.parse(json.toString("utf8")) as LicensePayload;
  } catch {
    return { ok: false, problem: "malformada", message: PROBLEM_COPY.malformada! };
  }

  if (p.v !== 1) {
    return { ok: false, problem: "version_desconocida", message: PROBLEM_COPY.version_desconocida! };
  }
  if (p.tier !== "free" && p.tier !== "premium") {
    return { ok: false, problem: "nivel_desconocido", message: PROBLEM_COPY.nivel_desconocido! };
  }

  // --- 4) Fechas ---------------------------------------------------------
  if (p.iat > now + skew) {
    return {
      ok: false,
      problem: "emitida_en_el_futuro",
      message: PROBLEM_COPY.emitida_en_el_futuro!,
      payload: p,
    };
  }
  if (p.exp < now - skew) {
    return {
      ok: false,
      problem: "expirada",
      message: PROBLEM_COPY.expirada!,
      payload: p,
    };
  }

  // --- 5) Atadura a máquina, si la hay -----------------------------------
  //
  // OJO con la forma de esta condición. La versión anterior era
  //   if (p.machine && opts.machineId && p.machine !== opts.machineId)
  // es decir, comparaba SOLO si el llamador pasaba `machineId`. Y el proceso
  // principal no lo pasaba. Resultado: la atadura a máquina nunca se comprobaba
  // en la app, y una licencia atada se podía copiar a otro equipo y funcionaba
  // igual. La prueba `Una licencia atada NO vale sin comprobar maquina` de
  // tools/probar-licensing.mjs es la que lo caza.
  //
  // Ahora: si la licencia está atada, `machineId` es OBLIGATORIO y tiene que
  // coincidir. Callar no es una opción, porque callar significaba "pásele a
  // quien quiera". Quien emite decide si ata; quien verifica no puede
  // saltarse esa decisión por no mirar.
  if (p.machine) {
    if (!opts.machineId) {
      return {
        ok: false,
        problem: "firma_invalida",
        message:
          "Esta licencia está atada a un equipo concreto y esta verificación no dice cuál es el equipo. No se puede dar por válida.",
        payload: p,
      };
    }
    if (p.machine !== opts.machineId) {
      return {
        ok: false,
        problem: "firma_invalida",
        message:
          "Esta licencia fue emitida para otra máquina. Se emitió para un equipo específico y esta no es esa máquina.",
        payload: p,
      };
    }
  }

  return {
    ok: true,
    message: "Licencia válida.",
    payload: p,
  };
}

// ---------------------------------------------------------------------------
// Identificador de instalación
// ---------------------------------------------------------------------------

/**
 * Deriva un identificador estable de la instalación.
 *
 * No usa nada que salga de la máquina ni identificadores de hardware con
 * riesgo de colisión: se construye a partir del nombre de usuario y del
 * volumen del sistema, hasheado con SHA-256. El hash se usa porque es estable
 * entre versiones de Node y de OpenSSL, cosa que un id nativo no garantiza.
 *
 * FORMATO: 32 caracteres hexadecimales en mayúscula (16 bytes, 128 bits).
 *
 *   - 16 bytes alcanzan de sobra y se leen en voz alta sin equivocar un
 *     carácter, que es como se comunica: el técnico lo lee por teléfono al que
 *     se lo vende y lo teclea en la licencia.
 *   - Mayúscula para que coincida con `licenseId`, que también se muestra en
 *     pantalla. Mezclar mayúsculas y minúsculas en dos identificadores que
 *     aparecen uno al lado del otro en la misma pantalla es pedir que se
 *     tecleen mal.
 *
 * Solo se usa si la licencia está atada a máquina, y en ese caso el técnico ve
 * el valor antes de comprarla. Sin sorpresas.
 */
export function deriveMachineId(userInfo: string, systemVolume: string): string {
  return createHash("sha256")
    .update(`${userInfo}|${systemVolume}`, "utf8")
    .digest("hex")
    .slice(0, 32)
    .toUpperCase();
}

/** Identificador de licencia, para el registro técnico y el soporte. */
export function licenseId(envelope: LicenseEnvelope): string {
  return createHash("sha256")
    .update(`${envelope.payload}.${envelope.signature}`, "utf8")
    .digest("hex")
    .slice(0, 16)
    .toUpperCase();
}
