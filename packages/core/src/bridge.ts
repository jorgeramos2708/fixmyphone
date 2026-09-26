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
 * Unidad atómica del catálogo: la VARIANTE, no el modelo.
 *
 * "Galaxy A54" existe como Exynos 1380 y como Snapdragon 6 Gen 1. Una base de
 * datos keyed por modelo manda a flashear la imagen de la placa que no lleva.
 */
export interface DeviceVariant {
  /** `codename#variante`. Es la clave real. */
  key: string;
  codename: string;
  variant: string;

  marketingName: string;
  manufacturer: string;
  brand?: string;

  soc?: string;
  socVendor?: string;
  platform?: string;

  /** Números de modelo (SM-S918B, SM-S918U1...). Base para Restrictions. */
  modelNumbers: string[];

  androidVersion?: string;
  isAbDevice?: boolean;

  capabilities: Record<string, boolean>;
  riskFlags: string[];
  verificationGates: string[];

  provenance: Record<string, Provenance>;
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
