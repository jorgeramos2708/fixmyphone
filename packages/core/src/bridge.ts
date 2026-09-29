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
   * Qué clase de comprobación es. Los diez valores salen de la base real, no de
   * una lista inventada: se contaron 11,487 puertas y estos son todos los
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
 * Lo que el técnico declaró sobre una comprobación.
 *
 * `null` (la ausencia en el mapa) es "pendiente" y NO es un valor más: es el
 * estado en el que arranca todo, y la diferencia entre "nadie la ha hecho" y
 * "alguien la marcó como que no aplica" es la diferencia entre un trabajo sin
 * terminar y un trabajo terminado con una comprobación que no se pudo hacer.
 *
 * `no_aplica` existe por eso. Sin él, un técnico que no puede comprobar el
 * registro en la red porque la SIM del cliente es de otra región tendría que
 * dejar la puerta en `pendiente` para siempre, y una lista que nunca puede
 * cerrarse es una lista que nadie usa.
 *
 * NINGUNO DE ESTOS ESTADOS ES UNA MEDICIÓN. Es lo que el técnico dice que hizo,
 * y por eso vive en la sesión y no en el informe firmado: un informe que
 * afirmara "el taller comprobó 14 de 16" sería una afirmación sin evidencia,
 * firmada por el taller, sobre un archivo que el cliente no puede auditar.
 */
export type GateEstado = "hecha" | "fallo" | "no_aplica";

/** Comprobaciones marcadas, por id de puerta. Lo no presente está pendiente. */
export type GateChecks = Record<string, GateEstado | undefined>;

/**
 * Unidad atómica del catálogo: la VARIANTE, no el modelo.
 *
 * "Galaxy A54" existe como Exynos 1380 y como Snapdragon 6 Gen 1. Una base de
 * datos keyed por modelo manda a flashear la imagen de la placa que no lleva.
 *
 * 547 de 763 variantes del catálogo no tienen sufijo de variante; en ese caso
 * la clave es el codename a secas. Ver `variantKey`.
 */
export type HomologadoIft =
  | "homologado"
  | "sin_verificar"
  | "desconocido"
  | "no_soportado";

/**
 * Texto que explica cada estado de homologación. Vive acá y no en la pantalla
 * para que el significado no dependa de quién construyó la vista, y para que
 * los cuatro textos se puedan revisar juntos.
 *
 * LA PRIMERA FRASE ES LA QUE CUENTA
 * ---------------------------------
 * Cada texto empieza por lo que el estado AFIRMA, no por una ausencia
 * ("no homologado"). "Sin verificar" abriendo la entrada de `desconocido` era
 * justo el error: en español se lee como resultado negativo, cuando lo que
 * significa es que nadie buscó. Este texto también se imprime en el informe
 * firmado, así que la frase que abre es la que queda archivada como evidencia.
 */
export const TOOLTIP_HOMOLOGACION: Record<HomologadoIft, string> = {
  homologado: "Homologado por el IFT. Folio encontrado en la tabla de certificados de la marca.",
  sin_verificar:
    "No está en el padrón del IFT. Se buscó en la tabla de certificados de la marca y el modelo no aparece; eso no significa que no esté homologado, ni que el equipo sea ilegal, ni que no se pueda reparar.",
  desconocido:
    "No se ha buscado. No hay una tabla de certificados del IFT accesible para esta marca, así que no se consultó nada. No es un resultado negativo.",
  no_soportado:
    "Marcado como no soportado por confirmación manual. Este equipo está fuera del alcance de la herramienta.",
};

/**
 * Qué parte de una comprobación cubre una sonda del diagnóstico, y qué NO.
 *
 * ---------------------------------------------------------------------------
 * POR QUÉ ESTA TABLA EXISTE Y POR QUÉ DICE "NO CUFRE"
 * ---------------------------------------------------------------------------
 * El catálogo trae 16 comprobaciones por variante (11,487 en total) y el
 * diagnóstico trae 16 sondas. El número parecido invita a cablear una como si
 * fuera la otra, y esa es justo la mentira que este producto no puede contar:
 *
 *   - La sonda `bateria` lee `dumpsys battery`: nivel, temperatura y salud que
 *     declara Android. La comprobación `battery_report` pide saber si la
 *     capacidad REAL es mayor al 60% de la de diseño. Para eso hay que leer la
 *     ruta de capacidad de diseño, y nadie lo hace.
 *   - La sonda `verificacion-inicial` lee `ro.boot.verifiedbootstate`. La
 *     comprobación `boot_state_verified` pide que el estado de arranque esté
 *     "sin alteraciones", y eso solo significa algo comparado contra una lectura
 *     ANTERIOR. El diagnóstico toma una foto de un instante: no tiene con qué
 *     comparar, así que no puede afirmar que nada cambió.
 *
 * Por eso cada entrada dice qué cubre y qué no, y por eso el resultado de la
 * sonda NO marca la comprobación: se muestra al lado, como pista. Una casilla
 * que se rellena sola es una afirmación que la herramienta no puede respaldar, y
 * esta herramienta no hace eso.
 *
 * Lo que NO está en esta tabla también es una respuesta, y es la que más pesa:
 * solo 3 o 4 de las 16 comprobaciones tienen sonda, y son las que un técnico
 * tiene que hacer a mano con el equipo en la mesa. La pantalla lo dice con todas
 * las letras en vez de dejar que un listado verde insinúe que todo está
 * comprobado. El número exacto depende de la variante (`slot_health` solo
 * aparece en 291 de las 763), así que se calcula y no se escribe.
 *
 * Las claves de esta tabla se cruzan contra los `id` reales de la base en
 * `tools/probar-catalogo.mjs`. Inventar un `id` (escribir `slots_healthy` donde
 * la base tiene `slot_health`) no rompe nada visible: la fila cae en el `null`,
 * el texto genérico aparece y la pantalla miente sin que nada falle. Por eso
 * hay una prueba que compara las dos listas en los dos sentidos.
 */
export interface GateCoverage {
  /** Sonda relacionada del diagnóstico, o `null` si ninguna la cubre. */
  sonda: string | null;
  /** Qué parte de la comprobación resuelve esa sonda, en una línea. */
  cubre: string | null;
  /** Qué falta para dar la comprobación por buena. */
  falta: string;
}

export const GATE_COBERTURA: Record<string, GateCoverage> = {
  power_on: {
    sonda: "arranque",
    cubre: "Que Android terminó de montar datos y reportar el arranque completo.",
    falta:
      "Que aguante 3 minutos sin reiniciarse. Un arranque completo es el instante en que el sistema se levanta; el reinicio en bucle del kernel o de la partición de datos puede llegar un minuto después, y un valor de 1 al momento de leer no lo descarta.",
  },
  battery_report: {
    sonda: "bateria",
    cubre: "Nivel, temperatura y el estado de salud que declara el propio Android.",
    falta:
      "La capacidad real comparada contra la de diseño. `dumpsys battery` no trae la capacidad de diseño, así que aquí no se puede distinguir una celda nueva de una que ya tiene el 55% de su vida útil.",
  },
  verified_boot_state: {
    sonda: "verificacion-inicial",
    cubre: "El color que reporta la cadena de arranque: verde, amarillo, rojo, naranja.",
    falta:
      "Que no haya CAMBIADO respecto a antes de intervenir. El diagnóstico toma una lectura de un momento y no guarda la anterior, así que 'sin alteraciones' no es una conclusión que esta herramienta pueda escribir.",
  },
  slot_health: {
    sonda: "particiones",
    cubre: "Si el equipo tiene particiones dinámicas y cuál es la ranura activa.",
    falta:
      "Que la otra ranura esté sana. Saber que existen dos no dice que la inactiva arranque, y esa es exactamente la ranura de la que depende que el equipo vuelva solo tras un fallo.",
  },
  charging: {
    sonda: null,
    cubre: null,
    falta:
      "Ningún dato del sistema dice cuánto sube el porcentaje con el cargador conectado. Se mide con el cargador puesto y esperando.",
  },
  touch_grid: { sonda: null, cubre: null, falta: "Ninguna sonda dibuja una rejilla ni lee el digitalizador. Es a ojo, con la pantalla a un dedo." },
  display_pwm: { sonda: null, cubre: null, falta: "Ninguna sonda mide el parpadeo. Es a ojo, con la pantalla en brillo bajo." },
  audio_path: { sonda: null, cubre: null, falta: "Ninguna sonda mide sonido. Es a oído: altavoz, auricular y micrófono." },
  cameras: { sonda: null, cubre: null, falta: "Ninguna sonda abre la cámara. Es a ojo, una por una, incluida la frontal." },
  sensors: { sonda: null, cubre: null, falta: "Ninguna sonda lee sensores. Es a mano: proximidade, huella y giroscopio." },
  network_register: { sonda: null, cubre: null, falta: "La sonda del módem lee la versión de banda base, no si la SIM quedó registrada en la red. Hace falta poner la SIM y ver la señal." },
  data_browse: { sonda: null, cubre: null, falta: "Ninguna sonda abre una página ni resuelve un nombre. Se prueba con un video, no con el ícono de internet." },
  call_voicemail: { sonda: null, cubre: null, falta: "Ninguna sonda marca. Hay que hacer una llamada de verdad." },
  gms: { sonda: null, cubre: null, falta: "Ninguna sonda abre Play Servicios. Si el equipo nunca tuvo cuenta, esto se comprueba después de agregarla." },
  ota: { sonda: null, cubre: null, falta: "Ninguna sonda dispara una actualización. Se revisa en Ajustes con el equipo en red." },
  radio_ident: {
    sonda: null,
    cubre: null,
    falta:
      "El IMEI y el ESN no se leen en ninguna sonda, y no se van a añadir: compararlos exige un valor anterior guardado, y una herramienta de taller que guarda el IMEI de cada equipo que pasa por la mesa es un problema de datos, no una función. Se anota en la orden de trabajo, a mano.",
  },
};

/**
 * Cobertura de una comprobación. Una puerta que no esté en la tabla devuelve
 * `null`, no una entrada inventada: la base puede crecer y la vista tiene que
 * decir "de esto no sé" en vez de inventar un texto que nadie revisó.
 */
export function coberturaGate(id: string): GateCoverage | null {
  return GATE_COBERTURA[id] ?? null;
}

export interface DeviceVariant {
  /** `codename#variante`, o el codename solo si no hay variante. */
  key: string;
  codename: string;
  /** `null` cuando el codename no se desambigua por placa. */
  variant: string | null;

  marketingName: string;
  /**
   * Columna `vendor` del catálogo, ya normalizada a clave canónica: `samsung`,
   * `xiaomi`, `motorola`, `alcatel`. Minúscula y sin acentos, porque la fuente
   * escribe la marca de seis maneras distintas (`Samsung`, `LGE`, `OPPO`,
   * `TCT (Alcatel)`…) y sin normalizar no hay forma de cruzar.
   *
   * **No se muestra en pantalla.** Para eso está `vendorNombre`.
   */
  vendor: string;
  /**
   * La marca como la escribe la persona: "Motorola", "F(x)Tec", "10.or".
   *
   * Viaja en el catálogo y no está escrito aquí a propósito. La tabla canónica
   * vive en `device-db/devicedb/brands.py`, en Python; Copiar los nombres a
   * TypeScript es garantizar que las dos copias se desincronicen sin que nada
   * avise, y la primera señal de que ya paso fue tener que agregar la mitad de
   * las marcas del catálogo a mano en dos archivos distintos.
   */
  vendorNombre: string;

  /** Texto tal como viene de la fuente: "Samsung Exynos 1380". */
  soc: string | null;
  socVendor: string | null;
  platform: string | null;

  /** Números de modelo (SM-A546B, SM-A546U1…). Base para restricciones. */
  modelNumbers: string[];

  /**
   * Estado de homologación ante el IFT. Son cuatro valores y sólo uno afirma
   * que el equipo **sí** está homologado, porque los otros tres dicen cosas
   * distintas:
   *
   * - `"homologado"`     se encontró el modelo en la tabla de certificados de
   *                      la marca. `iftCertificado` trae el folio.
   * - `"sin_verificar"`  **se buscó** en esa tabla y el modelo no aparece. No
   *                      significa "no homologado": significa que la marca no
   *                      publica ese equipo.
   * - `"desconocido"`    no hay tabla de certificados accesible para la marca,
   *                      así que **no se buscó**. Es el valor por omisión y
   *                      cubre la mayoría de las variantes.
   * - `"no_soportado"`   alguien lo confirmó a mano en el override del
   *                      catálogo. El cruce automático nunca lo produce.
   *
   * Tratar `sin_verificar` y `desconocido` como "sí" sería afirmar una
   * homologación que nadie comprobó, y un taller que abre un equipo porque la
   * herramienta dijo que está homologado y no lo está, es un equipo que se
   * pierde.
   */
  homologadoIft: HomologadoIft;
  /** Folio del IFT, p.ej. `"JUOPCP26-00023609"`. Vacío si no se encontró. */
  iftCertificado: string;
  /** De dónde se leyó el folio, para poder auditarlo. */
  iftUrl: string;

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
  /**
   * La variante que se identificó. `null` cuando no se pudo llegar a una sola.
   */
  match: DeviceVariant | null;
  ladder: IdentityLadder[];
  /**
   * Las candidatas que quedaron sobre la mesa cuando no se pudo decidir.
   *
   * Este campo es la respuesta, no un adorno: cuando hay varias, la escalera
   * bajó hasta el fondo y los datos no alcanzan para separar las placas. La
   * herramienta no elige ninguna —elegir sería inventar, y la diferencia entre
   * las candidatas es justo lo que decide qué imagen se puede flashear— y en
   * cambio las entrega para que la persona las compare. Elegir queda como acto
   * humano explícito, en la confirmación manual.
   *
   * `[]` significa que no se encontró nada, no que se encontró todo.
   */
  alternatives: DeviceVariant[];
  /**
   * Por qué NO se resolvió, en palabras que la persona pueda leer. Aparece en
   * pantalla tal cual, sin recortarse: si el motivo fuera raro o incómodo no
   * habría que callarlo.
   */
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
  /**
   * Marca de agua si la licencia no alcanza.
   *
   * OJO: el proceso principal IGNORA este valor y lo recalcula con el estado
   * de licencia que tiene en disco. Se queda en el tipo porque la vista lo
   * usa para pintar la previsualización, y porque es el mismo dato que ve el
   * técnico. Lo que no puede ser es la fuente de verdad: `watermarked` viene
   * de código que se puede editar, y una marca de agua que se puede apagar
   * desde las herramientas de desarrollo no es una marca de agua.
   */
  watermarked: boolean;
}

/** Lo que contesta el guardado del informe. */
export interface SaveReportResult {
  ok: boolean;
  /** Dónde quedó, si se guardó. */
  path?: string;
  /** El usuario cerró el diálogo sin guardar. */
  cancelado?: boolean;
  /** Por qué no se pudo guardar o no se pudo firmar. */
  motivo?: string;
  /**
   * Si el archivo que se escribió lleva el bloque de firma.
   *
   * Va explícito y no se deduce de `ok`: hay un caso real en que se guarda el
   * informe y no se firma (una clave de firma dañada en el equipo), y en ese
   * caso el técnico tiene que enterarse antes de entregarlo. Un `ok: true`
   * sin más deja pensar que salió firmado.
   */
  firmado?: boolean;
  /** Huella de la clave que firmó, si firmó. */
  kid?: string;
  /** Aviso para el técnico, si algo salió mal pero el archivo se guardó. */
  aviso?: string;
}

/**
 * Identidad de firma de ESTA instalación.
 *
 * La app genera un par Ed25519 la primera vez que firma un informe, no al
 * arrancar. La parte privada nunca sale de la máquina; la pública va dentro de
 * cada informe para que el cliente pueda comprobar la firma por su cuenta.
 *
 * Por qué no firma el fabricante: una clave privada dentro de un `.exe` que se
 * distribuye no es privada, y con ella cualquiera fabricaría informes
 * "firmados". Ver `packages/licensing/src/report-signature.ts`.
 */
export interface InstallKeyInfo {
  /** Huella de la clave, 32 hex en mayúscula. Vacía si todavía no hay clave. */
  kid: string;
  /** Clave pública en base64url. Es pública: se puede publicar. */
  publicKey: string;
  /** Si ya se generó la clave. */
  existe: boolean;
  /** Si esta plataforma puede firmar. En el navegador, no. */
  canSign: boolean;
  /** Por qué no, cuando no puede. */
  motivo?: string;
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
   *
   * Solo el premium sale firmado, y la firma la pone el proceso principal: el
   * renderer no decide si se firma, no decide la marca de agua y no decide el
   * nivel de licencia. Todos esos son controles de cobro, y un control que
   * vive en la interfaz es una sugerencia.
   */
  saveReport(draft: ReportDraft): Promise<SaveReportResult>;

  /**
   * Identidad de firma de esta instalación.
   *
   * Solo lectura: consultarla no crea la clave. La crea el primer informe que
   * se firma, que es el único momento en que hace falta.
   */
  installKey(): Promise<InstallKeyInfo>;

  /** Abre una carpeta o URL. Útil para "ver evidencia". */
  reveal(path: string): Promise<void>;
}
