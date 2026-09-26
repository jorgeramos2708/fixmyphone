/**
 * FIXMYPHONE — Contrato de la plataforma
 * ===========================================================================
 *
 * REGLA DE ORO: el renderer NUNCA importa `electron`. Habla con `window.fmp`.
 *
 * Motivo: es lo que permite que el mismo código de UI corra dentro del `.exe`
 * y dentro de un navegador, sin divergir. La app de escritorio y la demo web
 * son dos implementaciones de ESTA interfaz, no dos aplicaciones.
 *
 * Consecuencia práctica: si mañana el `.exe` pesa demasiado y queremos
 * migrar a Tauri, solo se reescribe `apps/desktop`. El renderer no se toca.
 *
 * Implementaciones:
 *   - Electron  → apps/desktop/src/main/bridge.ts   (acceso real: ADB, disco)
 *   - Navegador → apps/web-demo/src/browser-bridge.ts (simulación para demo)
 */

// ---------------------------------------------------------------------------
// Identificación del dispositivo
// ---------------------------------------------------------------------------

/** Cómo detectamos el equipo. El orden importa: va de barato a caro. */
export type TransportKind = "adb" | "fastboot" | "recovery" | "simulated";

/**
 * La escalera de identificación L0-L6.
 *
 * Cada nivel es un hecho que ya tenemos, y suma evidencia. Parar en el
 * primer nivel que alcanza confianza suficiente evita hacer trabajo
 * innecesario. `confidence` es la confianza en la IDENTIFICACIÓN, no en el
 * dato de cada propiedad.
 */
export interface IdentityLadder {
  level: 0 | 1 | 2 | 3 | 4 | 5 | 6;
  name: string;
  /** Dato crudo que motivó este nivel. Se muestra tal cual, sin adornar. */
  evidence: string;
  /** 0-1. Por debajo de 0.6 no se considera identificado. */
  confidence: number;
}

/** Lo que leemos del equipo. Cada campo es opcional porque no siempre existe. */
export interface RawDeviceProps {
  "ro.product.device"?: string;
  "ro.product.vendor.device"?: string;
  "ro.product.name"?: string;
  "ro.product.model"?: string;
  "ro.product.manufacturer"?: string;
  "ro.product.brand"?: string;
  "ro.build.version.release"?: string;
  "ro.build.version.security_patch"?: string;
  "ro.build.fingerprint"?: string;
  "ro.build.id"?: string;
  "ro.boot.hardware"?: string;
  "ro.boot.bootloader"?: string;
  "ro.boot.verifiedbootstate"?: string;
  "ro.boot.flash.locked"?: string;
  "ro.boot.vbmeta.device_state"?: string;
  "ro.serialno"?: string;
  "ro.boot.serialno"?: string;
  "ro.crypto.state"?: string;
  "ro.crypto.type"?: string;
  "sys.boot_completed"?: string;
  /** IMEI/MEID. Dato personal: se redacta en reportes exportados. */
  "ril.IMEI"?: string;
  "ril.MEID"?: string;
  "gsm.version.baseband"?: string;
  "ro.sf.lcd_density"?: string;
  [key: string]: string | undefined;
}

export interface ConnectedDevice {
  /** Identificador de transporte: `adb:<serial>`, `fastboot:<serial>`, `sim:<id>` */
  id: string;
  transport: TransportKind;
  serial: string;
  props: RawDeviceProps;
  /** Estado de batería si el transporte lo expone. */
  battery?: { levelPct: number; charging: boolean };
  /** Momento de conexión, ISO-8601. */
  connectedAt: string;
}

// ---------------------------------------------------------------------------
// Catálogo de dispositivos
// ---------------------------------------------------------------------------

/**
 * Procedencia de un dato. Un valor sin procedencia no debería llegar a
 * pantalla: un dato falso manda a flashear la imagen de la placa equivocada.
 */
export type Confidence = "verified" | "reported" | "inferred" | "seed" | "manual";

export interface Provenance {
  source: string;
  confidence: Confidence;
  url?: string;
  retrievedAt: string;
}

/**
 * Una comprobación que hay que hacer DESPUÉS de intervenir, para poder
 * afirmar que el equipo quedó bien. Viene del catálogo: qué es obligatorio
 * depends de lo que se hizo, no de una lista genérica.
 */
export interface VerificationGate {
  id: string;
  /** En español llano: "El equipo enciende y no reinicia en 3 min". */
  name: string;
  /**
   * Qué clase de comprobación es. Los nueve valores salen de la base real, no
   * de una lista inventada: se contaron 11,043 puertas y estos son todos los
   * `kind` que aparecen. Un tipo cerrado aquí documenta qué significa cada
   * palabra; ampliarlo obliga a decidir qué hacer con el valor nuevo.
   */
  kind:
    | "hardware"
    | "software"
    | "radio"
    | "bootchain"
    | "storage"
    | "display"
    | "audio"
    | "camera"
    | "sensor"
    | "network";
  /** Si es bloqueante, el trabajo no se puede dar por terminado. */
  blocking: boolean;
}

/**
 * Unidad atómica del catálogo: la VARIANTE, no el modelo.
 *
 * "Galaxy A54" existe como Exynos 1380 y como Snapdragon 6 Gen 1. Una base de
 * datos keyed por modelo manda a flashear la imagen de la placa que no lleva.
 *
 * 518 de 734 variantes del catálogo no tienen sufijo de variante; en ese caso
 * la clave es el codename a secas. Ver `variantKey`.
 */
export interface DeviceVariant {
  /** `codename#variante`, o el codename solo si no hay variante. */
  key: string;
  codename: string;
  /** `null` cuando el codename no se desambigua por placa. */
  variant: string | null;

  marketingName: string;
  /** Columna `vendor` del catálogo: Samsung, Xiaomi, Motorola… */
  vendor: string;

  /** Texto tal como viene de la fuente: "Samsung Exynos 1380". */
  soc: string | null;
  socVendor: string | null;
  platform: string | null;

  /** Números de modelo (SM-A546B, SM-A546U1…). Base para restricciones. */
  modelNumbers: string[];

  /** Nivel de API de Android de fábrica. `null` si la fuente no lo dio. */
  androidVersion: number | null;
  /**
   * Fecha de lanzamiento del equipo, tal como la da la fuente: `"2016-04"` o
   * `"2018-04-30"`. Es texto y a veces le falta el día, y por eso es `string`:
   * convertirlo a número obligaría a inventar un día que nadie registró.
   */
  release: string | null;

  /**
   * Capacidades como lista, no como mapa. El catálogo las guarda como
   * array JSON; convertir a Record{boolean} en el borde mentiría sobre lo
   * que el dato afirma. Para preguntar por una: `has()`.
   */
  capabilities: string[];

  riskFlags: string[];
  verificationGates: VerificationGate[];

  /** Columns `sources`: qué fuente aportó cada bloque de datos. */
  sources: string[];
}

const CAP_SETS = new WeakMap<DeviceVariant, Set<string>>();

/** ¿El catálogo afirma que esta variante puede hacer X? */
export function has(v: DeviceVariant, capability: string): boolean {
  let s = CAP_SETS.get(v);
  if (!s) {
    s = new Set(v.capabilities);
    CAP_SETS.set(v, s);
  }
  return s.has(capability);
}

/** A/B o solo A, según las capacidades del catálogo. `null` si no se sabe. */
export function partitionScheme(v: DeviceVariant): "a_b" | "a_only" | null {
  if (has(v, "a_b_slots")) return "a_b";
  if (has(v, "a_only")) return "a_only";
  return null;
}

/** Construye la clave canónica de una variante. */
export function variantKey(codename: string, variant: string | null): string {
  return variant ? `${codename}#${variant}` : codename;
}

/** Resultado de resolver un equipo real contra el catálogo. */
export interface Resolution {
  /** VarianteGanadora. `null` si el catálogo no conoce el equipo. */
  match: DeviceVariant | null;
  ladder: IdentityLadder[];
  /** Apple's ex Servidores, alias u otros candidatos cuando hubo que adivinar. */
  alternatives: DeviceVariant[];
  /** Por qué NO se resolvió. Aparece en pantalla, no se esconde. */
  unresolvedReason?: string;
}

// ---------------------------------------------------------------------------
// Diagnóstico
// ---------------------------------------------------------------------------

export type ProbeState = "pending" | "running" | "pass" | "fail" | "skip";

export interface ProbeResult {
  id: string;
  state: ProbeState;
  /** Comando literal ejecutado. Se muestra al técnico: sin eventos. */
  command?: string;
  /** Salida cruda. Puede ser larga; la vista la colapsa. */
  raw?: string;
  /** Explicación en español de qué significa el resultado. */
  explanation: string;
  durationMs?: number;
}

// ---------------------------------------------------------------------------
// Licencia
// ---------------------------------------------------------------------------

export type LicenseTier = "free" | "premium";

export interface LicenseState {
  tier: LicenseTier;
  valid: boolean;
  /** Sujeto de la licencia (taller, técnico). */
  subject?: string;
  issuedAt?: string;
  expiresAt?: string;
  /** Motivo de rechazo, si no es válida. */
  reason?: string;
  /** Diagnósticos consumidos hoy. El plan gratis tiene tope. */
  usedToday?: number;
  dailyLimit?: number;
  /**
   * Identificador de ESTE equipo, y de qué está hecho.
   *
   * Va aquí para que el técnico pueda leerlo en voz alta a quien le vende la
   * licencia. Es el número que hay que teclear para que una licencia atada
   * funcione, y pedirlo en una llamada de teléfono dictando 32 caracteres en
   * hexadecimal sin verlo antes es pedir que se tecleen mal.
   */
  machine?: MachineIdInfo;
}

/** De qué se compone el identificador de equipo. Se muestra, no se esconde. */
export interface MachineIdInfo {
  /** El id, 32 hex en mayúscula. */
  id: string;
  /** Cuenta de Windows. */
  user: string;
  /** Serial del volumen del sistema. */
  volume: string;
}

export interface LicenseEnvelope {
  payload: string;
  signature: string;
}

// ---------------------------------------------------------------------------
// Informe
// ---------------------------------------------------------------------------

export interface ReportDraft {
  device: ConnectedDevice;
  resolution: Resolution;
  probes: ProbeResult[];
  license: LicenseState;
  /** Marca de agua si la licencia no alcanza. */
  watermarked: boolean;
}

// ---------------------------------------------------------------------------
// Contrato principal
// ---------------------------------------------------------------------------

export interface FmpBridge {
  // --- Entorno ------------------------------------------------------------
  platform: "electron" | "browser";
  version: string;

  // --- Dispositivos -------------------------------------------------------
  /** Stream de dispositivos conectados/ desconectados. */
  onDevice: (cb: (devices: ConnectedDevice[]) => void) => () => void;
  listDevices(): Promise<ConnectedDevice[]>;

  // --- Catálogo -----------------------------------------------------------
  /**
   * Resuelve un equipo real contra el catálogo.
   *
   * Objetivo: resolver en <= 1 s. La implementación de Electron abre el
   * SQLite una vez al arrancar y lo mantiene abierto; el navegador usa un
   * índice en memoria.
   */
  resolve(props: RawDeviceProps, transport: TransportKind): Promise<Resolution>;
  lookupByModelNumber(modelNumber: string): Promise<DeviceVariant[]>;

  // --- Diagnóstico --------------------------------------------------------
  runProbes(
    deviceId: string,
    onProgress: (r: ProbeResult) => void,
  ): Promise<ProbeResult[]>;

  // --- Licencia -----------------------------------------------------------
  license: {
    current(): Promise<LicenseState>;
    /** Activa desde el contenido de un archivo `.fmp`. */
    activate(envelope: LicenseEnvelope): Promise<LicenseState>;
    /** Útil si el usuario tiene una licencia de archivo en disco. */
    loadFromDisk(): Promise<LicenseState>;
  };

  // --- Salida -------------------------------------------------------------
  /**
   * Guarda el informe. En Electron abre un diálogo nativo; en el navegador
   * dispara una descarga.
   */
  saveReport(draft: ReportDraft): Promise<{ ok: boolean; path?: string }>;

  /** Abre una carpeta o URL. Útil para "ver evidencia". */
  reveal(path: string): Promise<void>;
}
