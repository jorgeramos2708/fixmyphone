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

// ---------------------------------------------------------------------------
// La receta
// ---------------------------------------------------------------------------

/**
 * En qué partición va la imagen de recovery en ESTA variante.
 *
 * ---------------------------------------------------------------------------
 * POR QUÉ ES UN TIPO CERRADO DE TRES VALORES Y NO UNA CADENA
 * ---------------------------------------------------------------------------
 * La columna `recovery_partition_name` de la base tiene 734 filas y cuatro
 * valores: `recovery`, `boot`, `vendor_boot` y vacío. Es la columna que más
 * daño hace cuando está mal, porque el técnico ve "flashear" en la pantalla y
 * el nombre de la partición es un detalle que se pasa por alto.
 *
 * `vendor_boot` es además una partición que no existía antes de Android 10: un
 * archivo de recovery de otra versión, flushed a `vendor_boot`, no arranca. Por
 * eso el valor viaja como tipo y no como texto, y por eso hay una tabla de
 * texto asociada: un `switch` sobre tres casos se revisa, un `String` que se
 * muestra crudo no.
 *
 * Si la base llega a traer un cuarto valor, `comoParticionRecovery` degrada a
 * `null` (que significa "la fuente no lo dice") en vez de inventar un texto.
 */
export type ParticionRecovery = "recovery" | "boot" | "vendor_boot";

/**
 * Lo que significa cada partición.
 *
 * ------------------------------------------------------------------
 * POR QUÉ ESTOS TEXTOS TIENEN QUE SOBREVIVIR EN DOS PANTALLAS
 * ------------------------------------------------------------------
 * Porque el mismo texto se lee debajo de la fila "Partición de destino" de la
 * pantalla de reparación, debajo de la bandera `recovery_flash_target_is` de la
 * lista de riesgos, y en el informe firmado. Duplicado, los dos se turnan para
 * repetir lo mismo; y pegado a la frase del riesgo, se convertía en un segundo
 * párrafo que decía lo que el primero acababa de decir.
 *
 * ---------------------------------------------------------------------------
 * POR QUÉ SON FRASES SUELTAS Y NO EMPIEZAN POR EL NOMBRE DE LA PARTICIÓN
 * ---------------------------------------------------------------------------
 * Porque el nombre ya lo pone el que las usa, a su lado, en monoespaciada: la
 * fila de la receta lo muestra como valor, la lista de riesgos lo muestra
 * después del rótulo, y el informe lo escribe en la línea de arriba. Repetirlo
 * aquí produce "vendor_boot" tres veces en la misma pantalla.
 *
 * Y sin comillas invertidas: estas cadenas llegan a la pantalla tal cual, sin
 * un intérprete de markdown delante, así que un backtick se vería literal. Las
 * comillas invertidas viven en los comentarios de este archivo, que sí las lee
 * alguien; en el texto que ve el técnico, el nombre va en otra tipografía.
 */
export const PARTICION_RECOVERY: Record<ParticionRecovery, string> = {
  recovery:
    "La partición que existe con ese nombre, y el caso corriente: el recovery se escribe donde su nombre dice.",
  boot:
    "Una partición a la que este equipo NO llama recovery. Flashear ahí no hace nada y, según cómo se haga, deja el equipo sin arrancar.",
  vendor_boot:
    "Una partición que existe desde Android 10. Un recovery de otra versión flasheado aquí no arranca, porque no es la partición que espera.",
};

/**
 * La partición de la base, ya verificada contra el conjunto cerrado.
 *
 * ------------------------------------------------------------------
 * POR QUÉ NO ES UN CAST
 * ------------------------------------------------------------------
 * `recovery_partition_name` es un `TEXT` libre: la base no lo valida y el
 * pipeline lo copia de un wiki. Si mañana aparece `vendor_boot ` con un
 * espacio al final, o `boot_a`, un cast lo devolvería como si fuera válido y
 * `PARTICION_RECOVERY[valor]` daría `undefined` en pantalla, que es un texto
 * que se renderiza como `undefined` en el informe firmado del taller.
 *
 * Con esta función, un valor nuevo cae en el mismo hueco que un valor ausente:
 * "la fuente no lo dice". Es la diferencia entre una base que creció y una app
 * que se rompió.
 */
export function comoParticionRecovery(bruto: string | null): ParticionRecovery | null {
  if (!bruto) return null;
  const limpio = bruto.trim().toLowerCase();
  return limpio in PARTICION_RECOVERY ? (limpio as ParticionRecovery) : null;
}

/**
 * La receta de una variante: qué hay que hacer, y qué hay que saber antes de
 * tocar nada.
 *
 * ---------------------------------------------------------------------------
 * POR QUÉ ESTO EXISTE Y POR QUÉ NO ESTÁ DENTRO DE `capabilities`
 * ---------------------------------------------------------------------------
 * La base traía nueve columnas de receta desde el principio, con su
 * procedencia, y la app no leía ninguna: eran código muerto del lado de
 * TypeScript. `capabilities` es un `string[]` de nombres de capacidad
 * (`unlock_official`, `official_rom_flash`…), que responde "qué se puede
 * hacer", no "cómo se hace en esta placa". Son preguntas distintas y meterlas
 * en el mismo campo habría hecho que la respuesta a una no llegara nunca.
 *
 * TODOS LOS CAMPOS SON NULABLES A PROPÓSITO. Cada `null` significa "la fuente
 * no lo dice" y se muestra como tal. Rellenar un hueco con un valor plausible
 * sería la forma más fácil de convertir esta pantalla en un manual de
 * reparación equivocado, y un manual equivocado en un taller mata placas.
 */
export interface Receta {
  /**
   * Identificador del método de instalación, tal cual lo escribe la fuente
   * (`fastboot_xiaomi`, `samloader_rs`, `dd`, `edl_custom`…).
   *
   * Se muestra como lo que es: el identificador de la fuente. No hay texto en
   * español para los 50 métodos que aparecen, y escribirlos sería inventar 50
   * descripciones que nadie verificó contra un manual. `modoDescarga` es el
   * campo que sí trae descripción en prosa.
   */
  metodo: string | null;

  /**
   * Comando de desbloqueo literal, cuando el fabricante no usa el estándar.
   *
   * Aparece en 97 de 763 variantes y es el comando de verdad, con sus
   * comillas y su saltos de línea. No se ejecuta y no se "corrige": la app no
   * desbloquea nada, y un comando reescrito es un comando que ya no es el que
   * probó el fabricante.
   */
  desbloqueo: string | null;

  /** A qué partición va la imagen de recovery. `null` si la fuente no lo dice. */
  particionRecovery: ParticionRecovery | null;

  /**
   * Cómo entrar a recovery, como lo describe la fuente, en el idioma de la
   * fuente (el wiki de LineageOS está en inglés).
   *
   * No se traduce. Traducir 400 combinaciones de botones sería escribir 400
   * veces una instrucción que no se comprobó contra el manual de la marca, y
   * el texto se muestra declarando de dónde sale.
   */
  comboRecovery: string | null;

  /** Cómo entrar al modo de descarga, en el mismo idioma y con el mismo trato. */
  comboDescarga: string | null;

  /**
   * Descripción en prosa del modo de descarga, con los identificadores USB
   * (`EDL 900E / 9008 (Sahara + Firehose XML)`).
   *
   * Son solo seis valores distintos en 707 variantes, y es el campo que sí
   * explica de qué modo se trata. Sale de la ficha de la variante y, cuando
   * esta no lo trae, de la ficha de la familia (`seed` en la procedencia).
   */
  modoDescarga: string | null;

  /**
   * El MODO DE DESCARGA de esta variante exige material firmado.
   *
   * ------------------------------------------------------------------
   * POR QUÉ EL NOMBRE DIGE "DESCARGA" Y NO EL NOMBRE DE LA COLUMNA
   * ------------------------------------------------------------------
   * Porque la columna se llama `signed_material_required` y no dice de qué
   * habla, y leerla como "esta reparación exige firma" es un error que esta app
   * estuvo a punto de cometer.
   *
   * El dato es de `download_mode`, y el cruce con la base lo deja claro: de las
   * 691 variantes con `signed_material_required = 1`, 595 son métodos
   * `fastboot_*` y llevan además la bandera `edl_requires_signed_programmer`.
   * O sea: por EDL hace falta la firma del fabricante, pero el método de
   * instalación que declara el catálogo es fastboot, que no la necesita.
   *
   * Con el otro nombre, 691 de 763 variantes dirían "esto no se puede reparar" y
   * la mayor parte estaría mintiendo. Con este, dicen lo cierto: "por este
   * camino no".
   */
  descargaExigeMaterialFirmado: boolean | null;

  /**
   * Etiqueta del requisito previo, tal cual la escribe la fuente.
   *
   * La base trae 16 valores distintos y 371 de las 403 variantes que lo tienen
   * usan el mismo (`needs_specific_android_fw`). Los otros 15 son códigos de
   * firmware concretos (`shinano`, `g2-common`, `h870`…) que la fuente no
   * explica. Esos NO se traducen: se muestran con la advertencia de que la
   * fuente no dice qué hacer con ellos. Ver `PRE_REQUISITO`.
   */
  requisitoPrevio: string | null;

  /** Versión de Android que declara ese requisito. `"13/15"`, `"7.1"`, … */
  versionRequisito: string | null;
}

/**
 * El único requisito previo que sí se puede explicar.
 *
 * ---------------------------------------------------------------------------
 * POR QUÉ HAY UNA TABLA DE UNA SOLA ENTRADA
 * ---------------------------------------------------------------------------
 * Porque las otras quince no se pueden. `needs_specific_android_fw` significa
 * algo comprobable ("hay que instalar un firmware de Android concreto antes"),
 * y los demás son nombres de paquete de firmware cuya correspondencia con un
 * modelo concreto no está en la base.
 *
 * La tentación sería poner los dieciséis con un texto plausible cada uno, y
 * ese es exactamente el invento que este producto no hace: una instrucción de
 * flasheado equivocada no se nota hasta que el equipo no arranca. `preRequisito()`
 * devuelve `null` para lo que no sabe, y la pantalla lo dice.
 *
 * ---------------------------------------------------------------------------
 * POR QUÉ EL VALOR ES UN SUSTANTIVO Y NO UNA FRASE CON VERBO
 * ---------------------------------------------------------------------------
 * Porque se imprime en tres sitios, y cada uno pone delante un verbo distinto:
 * "Firmware previo: …" en la lista de riesgos, "Antes hay que instalar …" en
 * la fila de la receta, y "Antes de flashear: …" en el informe firmado. Un
 * texto que ya trae verbo se lee mal en los otros dos, o se lee como si el
 * que lo acompaña fuera el sujeto.
 *
 * Que sea un sintagma nominal es lo que permite que los tres digan lo mismo con
 * una sola redacción, y que no puedan desincronizarse.
 */
export const PRE_REQUISITO: Record<string, string> = {
  needs_specific_android_fw:
    "un firmware de Android concreto, el de la página de esta variante",
};

/**
 * Qué significa un requisito previo, o `null` si la fuente no lo explica.
 *
 * El mismo criterio que `coberturaGate()`: lo que no se sabe, se declara. Un
 * `Record` cerrado obliga a que añadir un valor a la base sea una decisión
 * consciente en el código, no una etiqueta nueva que aparece sola en pantalla.
 */
export function preRequisito(etiqueta: string | null): string | null {
  if (!etiqueta) return null;
  return PRE_REQUISITO[etiqueta] ?? null;
}

/**
 * Los dos párrafos del aviso de firma, en el orden en que se leen.
 *
 * ------------------------------------------------------------------
 * POR QUÉ VIVEN EN `core` Y NO EN LA PANTALLA
 * ------------------------------------------------------------------
 * Porque la pantalla de reparación los pone y el informe firmado también los
 * necesita, y son la misma advertencia sobre el mismo dato. Duplicados, el día
 * que uno se corrige el otro se queda diciendo lo viejo, y el que se queda
 * viejo es el que se le entrega al cliente.
 *
 * ------------------------------------------------------------------
 * POR QUÉ EL SEGUNDO PÁRRAFO TIENE DOS VERSIONES
 * ------------------------------------------------------------------
 * Porque depende de si la fuente declara método de instalación, y las dos
 * respuestas son distintas y las dos se dan. Con método declarado, el técnico
 * tiene un segundo camino a la vista. Sin él, no: afirmar que "hay otro camino"
 * cuando la fuente no lo dice sería inventar la salida, y esa es la frase
 * exacta que evita que un técnico deje de cobrar un trabajo. Samsung es el
 * caso grande: 21 de sus 136 variantes declaran método y las otras 115 no.
 */
export function avisoFirmaDescarga(r: Receta): [string, string] {
  const modo = r.modoDescarga ?? "el modo que declara la fuente";
  return [
    `Por ${modo} hace falta un paquete firmado con la clave del fabricante, y esa clave no se consigue por este programa. Entrar a ese modo sin la firma no sirve para nada.`,
    r.metodo
      ? `Esto no dice que la placa no se pueda reparar. El método de instalación que declara el catálogo para esta variante es ${r.metodo}, que es un camino aparte y no necesita la firma. Conviene confirmar cuál de los dos se va a usar antes de abrir el equipo: si el que se elige es el modo de descarga, ese trabajo no se puede hacer desde aquí.`
      : `Esto no dice que la placa no se pueda reparar, pero la fuente no declara método de instalación para esta variante, así que desde aquí no se puede afirmar que exista un camino sin firma. Eso hay que confirmarlo en la página de la variante, antes de abrir el equipo.`,
  ];
}

// ---------------------------------------------------------------------------
// Banderas de riesgo
// ---------------------------------------------------------------------------

/**
 * Una bandera de riesgo del catálogo, partida y con su valor ya traducido.
 *
 * La columna `risk_flags` guarda cadenas con la forma `base` o `base:valor`.
 * El valor no es decorativo: `recovery_flash_target_is:vendor_boot` dice en qué
 * partición hay que escribir, y `pre_install_required:shinano` dice qué
 * firmware hay que poner antes. Sin partir la bandera, el valor se pierde.
 */
export interface Riesgo {
  /** La bandera tal como la guarda la base, para auditoría. */
  id: string;
  /** La parte izquierda, que nombra el riesgo. */
  base: string;
  /** La parte derecha, tal cual. `null` si la bandera no lleva valor. */
  valor: string | null;
  /**
   * Cómo se llama el valor, para poder ponerlo en su propia línea.
   *
   * Existe porque el texto del riesgo y el del valor hablan del mismo hecho:
   * `pre_install_required:needs_specific_android_fw` produce "hay que devolver
   * el equipo a un firmware específico antes de flashear" seguido de, si se
   * pega el valor a la frase, un segundo párrafo que dice lo mismo. Con rótulo
   * cada uno hace su trabajo: la frase dice POR QUÉ importa y el valor dice
   * CUÁL.
   */
  valorRotulo: string | null;
  /**
   * El valor traducido a algo que se lee, o `null` si la fuente no lo explica.
   *
   * `null` es un caso real y no una falta: 15 de los 16 valores de
   * `pre_install_required` son códigos de firmware que nadie decodificó. La
   * pantalla tiene que poder decir "esto está aquí y no sé qué es" sin que
   * eso se confunda con "no hay nada".
   */
  valorTexto: string | null;
  /** Qué significa el riesgo. */
  texto: string;
}

/** Cómo se nombra el valor de cada bandera que lo lleva. */
const ROTULO_VALOR: Record<string, string> = {
  recovery_flash_target_is: "Partición de destino",
  pre_install_required: "Firmware previo",
};

/**
 * Las diez banderas de riesgo que la base emite y la app sabe explicar.
 *
 * La tabla está completa contra la base y hay una prueba que lo comprueba, así
 * que si mañana la base emite una undécima bandera, la prueba falla y obliga a
 * escribir el texto en vez de dejar que caiga el genérico en un informe que se
 * le entrega a un cliente.
 */
export const FLAG_RIESGO: Record<string, string> = {
  edl_requires_signed_programmer:
    "Programar en EDL exige un paquete de programmers firmado. Sin las claves del fabricante, entrar a EDL no sirve para nada.",
  pre_install_required:
    "Hay que devolver el equipo a un firmware específico ANTES de flashear. Flashear directo desde aquí deja el equipo sin arranque.",
  recovery_flash_target_is:
    "La partición de recovery en este equipo tiene otro nombre. Escribir en la partición equivocada no flashea nada y puede pisar datos.",
  samsung_knox_eFuse_risk_on_unlock:
    "El contador Knox se funde con eFuse al desbloquear el bootloader. Es irreversible y el cliente lo pierde aunque el equipo funcione.",
  odin_requires_signed_secure_package:
    "Odin solo acepta paquetes firmados con la clave del operador. Un firmware sin firma no se puede enviar por este método.",
  no_edl_on_tensor_oem_key_signed:
    "Tensor con firma de fabricante: no hay modo EDL. El método de programación que se usaba con los Pixel antiguos ya no existe.",
  brom_requires_da_agent:
    "El modo BROM de MediaTek exige el agente DA. Sin él no hay comunicación con el equipo.",
  hisilicon_download_unsupported_on_new_soc:
    "El método de descarga de HiSilicon ya no funciona en los SoC nuevos. Se necesita otro método.",
  a_only_layout_full_scatter_required:
    "La repartición de este equipo es de dispersión completa (A/B con superpartición). Reflashear todas las particiones con esa repartición borra los datos del usuario: no es una operación que se pueda deshacer.",
  fdl_secure_download_may_be_blocked:
    "En este SoC la descarga segura por FDL puede estar bloqueada. Es la misma pared que exige la firma del fabricante, pero aquí depende del bloqueo que el fabricante tenga activo sobre el equipo, no solo de la firma.",
};

/**
 * Parte una bandera y traduce su valor con la receta de la variante.
 *
 * ------------------------------------------------------------------
 * POR QUÉ EL VALOR SE TOMA DE LA BANDERA Y NO DE LA RECETA
 * ------------------------------------------------------------------
 * Porque el sufijo de la bandera y el campo de la receta son el mismo dato
 * escrito dos veces por la base: `recovery_flash_target_is:vendor_boot` y
 * `receta.particionRecovery === "vendor_boot"`. Se traduce el de la bandera
 * porque es el que va pegado a la frase del riesgo, y se comparte la tabla
 * (`PARTICION_RECOVERY`, `PRE_REQUISITO`) para que los dos digan lo mismo.
 *
 * Que los dos coincidan no se da por hecho: hay una prueba en
 * `tools/probar-catalogo.mjs` que recorre las 763 variantes y falla si alguna
 * tiene la bandera apuntando a una partición distinta de la de su receta. Si
 * la base empieza a discrepar, el sitio donde se ve es esa prueba, no el
 * informe de un taller.
 *
 * ------------------------------------------------------------------
 * POR QUÉ NO SE PASA COMO ARGUMENTO `base`, `texto`
 * ------------------------------------------------------------------
 * La tabla de textos tiene que vivir junto a los datos de la variante y no
 * repartirse entre la pantalla y el informe. Antes de esto el texto de
 * `pre_install_required` estaba escrito en `EquipoScreen` y el informe
 * firmado imprimía la bandera en crudo, así que el mismo dato salía en
 * español en la pantalla y como `pre_install_required:shinano` en el `.txt`
 * que se le entrega al cliente. Dos verdades para un dato.
 */
export function riesgo(flag: string): Riesgo {
  const i = flag.indexOf(":");
  const base = i === -1 ? flag : flag.slice(0, i);
  const valor = i === -1 ? null : flag.slice(i + 1);

  let valorTexto: string | null = null;
  if (valor !== null) {
    if (base === "recovery_flash_target_is") {
      valorTexto = PARTICION_RECOVERY[valor as ParticionRecovery] ?? null;
    } else if (base === "pre_install_required") {
      valorTexto = preRequisito(valor);
    }
  }

  return {
    id: flag,
    base,
    valor,
    valorRotulo: valor === null ? null : (ROTULO_VALOR[base] ?? null),
    valorTexto,
    texto:
      FLAG_RIESGO[base] ??
      "Riesgo registrado por el catálogo. Revísalo antes de proceder.",
  };
}

/** Todos los riesgos de una variante, ya partidos y traducidos. */
export function riesgosDe(v: DeviceVariant): Riesgo[] {
  return v.riskFlags.map(riesgo);
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

  /**
   * La receta: qué hay que hacer con esta variante, y qué hay que saber antes.
   *
   * Es un objeto y no nueve campos sueltos porque la pregunta que se le hace a
   * la pantalla es "de esto, qué sé y qué no", y eso se lee sobre el conjunto.
   * Todos los campos existen siempre: los que la fuente no dice vienen en
   * `null`, nunca ausentes, para que `null` signifique exactamente una cosa.
   */
  receta: Receta;

  /** Columns `sources`: qué fuente aportó cada bloque de datos. */
  sources: string[];
}

/**
 * Campos de la receta que esta variante sí trae, en el orden en que se leen.
 *
 * ------------------------------------------------------------------
 * POR QUÉ ES UNA FUNCIÓN Y NO UN `.filter()` EN LA PANTALLA
 * ------------------------------------------------------------------
 * Porque el orden importa para el técnico: lo que se puede hacer primero, lo
 * que puede impedirlo, y lo que solo importa si se llega hasta el final. Y
 * porque "qué falta" tiene que salir de la misma cuenta que "qué hay", o las
 * dos listas divergen con el tiempo. El texto de cada campo lo pone la
 * pantalla; aquí solo se decide qué se enseña y en qué orden.
 */
export type ClaveReceta = keyof Receta;

export const ORDEN_RECETA = [
  "descargaExigeMaterialFirmado",
  "requisitoPrevio",
  "particionRecovery",
  "desbloqueo",
  "metodo",
  "modoDescarga",
  "comboRecovery",
  "comboDescarga",
] as const satisfies readonly ClaveReceta[];

/**
 * Los ocho campos que tienen fila propia en pantalla.
 *
 * ------------------------------------------------------------------
 * POR QUÉ SON OCHO Y LA RECETA TIENE NUEVE
 * ------------------------------------------------------------------
 * `versionRequisito` no es una fila: es la versión de Android que acompaña al
 * requisito previo, y separarla en su propia línea hacía que se leyera como un
 * dato independiente cuando no lo es. Se muestra dentro de la fila del
 * requisito, al lado de su etiqueta.
 *
 * El tipo sale de `ORDEN_RECETA` y no al revés, para que agregar un campo a la
 * receta no obliga a decidir si tiene fila propia: obliga a decidir si entra a
 * la lista, que es la decisión que de verdad importa.
 */
export type CampoReceta = (typeof ORDEN_RECETA)[number];

/** Los campos de la receta que la fuente sí rellenó para esta variante. */
export function recetaPresente(r: Receta): CampoReceta[] {
  return ORDEN_RECETA.filter((k) => !recetaVacia(r, k));
}

/**
 * Un campo de la receta está vacío cuando la fuente no lo dice.
 *
 * `false` y `0` no cuentan como vacíos: `exigeMaterialFirmado: false` es un
 * dato, y es el dato que hace falta para poder decir que esta variante no
 * exige material firmado.
 */
export function recetaVacia(r: Receta, campo: ClaveReceta): boolean {
  const v = r[campo];
  return v === null || v === "";
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
