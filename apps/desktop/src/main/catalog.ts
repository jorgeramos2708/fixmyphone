/**
 * Lector del catálogo de dispositivos.
 * ===========================================================================
 *
 * Lee el SQLite que produce `packages/device-db/pipeline.py`. Sin
 * dependencias nativas: usa `node:sqlite`, que viene en el runtime de Node y
 * por tanto en Electron. Esto elimina de un plumazo el problema clásico de
 * empaquetar SQLite en un `.exe` (ABI de Electron, reconstrucción con MSVC,
 * `electron-rebuild` fallando en la máquina del taller).
 *
 * El archivo se abre UNA vez al arrancar y se mantiene abierto. El objetivo
 * declarado de la resolución es <= 1 s; abrir un archivo de 12 MB en cada
 * consulta lo hace imposible.
 */

import { createRequire } from "node:module";
import { existsSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import type {
  DeviceVariant,
  HomologadoIft,
  Receta,
  VerificationGate,
} from "@fixmyphone/core";
import { comoParticionRecovery } from "@fixmyphone/core";

const require = createRequire(import.meta.url);

/**
 * Electron empaqueta su runtime de Node. `node:sqlite` es experimental en
 * Node 22 y estable en 24. Si la versión de Node de Electron no lo expone,
 * hay que saberlo con un mensaje útil, no con un `undefined is not a
 * function` en plena ventana.
 */
type SqliteModule = {
  DatabaseSync: new (path: string, opts?: unknown) => {
    prepare(sql: string): {
      all(...params: unknown[]): Record<string, unknown>[];
      get(...params: unknown[]): Record<string, unknown> | undefined;
    };
    close(): void;
  };
};

let sqlite: SqliteModule | null = null;
try {
  sqlite = require("node:sqlite") as SqliteModule;
} catch {
  sqlite = null;
}

export class CatalogUnavailable extends Error {
  constructor(razon: string) {
    super(
      `No se pudo abrir el catálogo de dispositivos: ${razon}. ` +
        "Regenera la base con `npm run db:build` y vuelve a abrir la app.",
    );
    this.name = "CatalogUnavailable";
  }
}

// ---------------------------------------------------------------------------
// Mapeo de filas
// ---------------------------------------------------------------------------

/** El pipeline guarda estos campos como JSON serializado en una columna TEXT. */
function parseJsonArray<T>(raw: unknown): T[] {
  if (typeof raw !== "string" || raw.length === 0) return [];
  try {
    const v: unknown = JSON.parse(raw);
    return Array.isArray(v) ? (v as T[]) : [];
  } catch {
    // Una columna corrupta no debe tirar abajo la app entera. Se devuelve
    // vacío y el hueco queda visible en la interfaz como "no registrado",
    // que es exactamente lo que es.
    return [];
  }
}

function toVariant(row: Record<string, unknown>): DeviceVariant {
  const codename = String(row.codename ?? "");
  const variant = row.variant == null ? null : String(row.variant);
  return {
    codename,
    variant,
    key: variant ? `${codename}#${variant}` : codename,
    marketingName: String(row.marketing_name ?? codename),
    vendor: String(row.vendor ?? ""),
    // Si la base no trae el nombre, se usa la clave. Un técnico vería
    // "motorola" en vez de "Motorola", que es un detalle, pero vería algo: lo
    // que no puede pasar es que se muestre la clave vacía como si la marca
    // fuera desconocida, porque eso no se distingue de un equipo sin datos.
    vendorNombre: String(row.vendor_nombre ?? "") || String(row.vendor ?? ""),
    soc: row.soc_raw == null ? null : String(row.soc_raw),
    socVendor: row.soc_vendor == null ? null : String(row.soc_vendor),
    platform: row.platform == null ? null : String(row.platform),
    modelNumbers: parseJsonArray<string>(row.model_numbers),
    androidVersion: row.android_version == null ? null : Number(row.android_version),
    // `release` es una fecha parcial ("2016-04"), no un número. Se pasa tal
    // cual; `Number("2016-04")` da NaN y un NaN en pantalla es peor que un
    // texto que el técnico sabe leer.
    release: row.release == null ? null : String(row.release),
    capabilities: parseJsonArray<string>(row.capabilities),
    riskFlags: parseJsonArray<string>(row.risk_flags),
    verificationGates: parseJsonArray<VerificationGate>(row.verification_gates),
    sources: parseJsonArray<string>(row.sources),
    homologadoIft: comoHomologadoIft(row.homologado_ift),
    iftCertificado: String(row.ift_certificado ?? ""),
    iftUrl: String(row.ift_url ?? ""),
    receta: toReceta(row),
  };
}

/**
 * Las nueve columnas de receta, tal como las guarda la base.
 *
 * ------------------------------------------------------------------
 * POR QUÉ NO SE COPIAN LAS COLUMNAS A `DeviceVariant` UNO POR UNO
 * ------------------------------------------------------------------
 * Porque así es como llevaba desde el principio y por eso ninguna se leía: un
 * campo que hay que recordar en tres sitios (el `SELECT`, el objeto y el tipo
 * compartido) es un campo que en algún momento se queda a medio caminho, y a
 * medio camino no se nota hasta que alguien lo busca en la pantalla. Al estar
 * las nueve en un objeto, el compilador dice qué falta si mañana la base le
 * añade una décima.
 *
 * `signed_material_required` es un entero `0`/`1` en la base y un booleano
 * acá. El `0` NO se convierte en `false` por descarte de un `Boolean("0")`:
 * se compara con la cadena, porque `Boolean("0")` es `true` en JavaScript y
 * eso habría puesto "exige material firmado" a 707 variantes que no lo exigen.
 *
 * El campo se llama `descargaExigeMaterialFirmado` y no como la columna porque
 * la columna no dice de qué habla. Ver el comentario del campo en
 * `packages/core/src/bridge.ts`, que tiene el cruce que lo demuestra.
 */
function toReceta(row: Record<string, unknown>): Receta {
  const texto = (c: string): string | null => {
    const v = row[c];
    if (v == null) return null;
    const s = String(v).trim();
    return s === "" ? null : s;
  };
  const material = row.signed_material_required;
  return {
    metodo: texto("install_method"),
    desbloqueo: texto("custom_unlock_cmd"),
    particionRecovery: comoParticionRecovery(
      row.recovery_partition_name == null
        ? null
        : String(row.recovery_partition_name),
    ),
    comboRecovery: texto("recovery_boot"),
    comboDescarga: texto("download_boot"),
    modoDescarga: texto("download_mode"),
    descargaExigeMaterialFirmado:
      material == null || String(material).trim() === ""
        ? null
        : String(material).trim() === "1",
    requisitoPrevio: texto("pre_install_instructions"),
    versionRequisito: texto("pre_install_version"),
  };
}

/**
 * Un estado que no sea uno de los cuatro conocidos se degrada a `desconocido`,
 * nunca a `homologado`. La base puede quedar desactualizada respecto del
 * código, y un valor raro que se cuela en pantalla tiene que ser el
 * conservador: no afirmar una homologación que nadie comprobó.
 */
function comoHomologadoIft(bruto: unknown): HomologadoIft {
  const s = String(bruto ?? "");
  return s === "homologado" || s === "sin_verificar" || s === "no_soportado"
    ? s
    : "desconocido";
}

// ---------------------------------------------------------------------------
// Catálogo
// ---------------------------------------------------------------------------

// Las nueve columnas de receta (`install_method`…`pre_install_version`) se
// leían de la base desde que la base las tenía, y ninguna estaba en este
// `SELECT`: la receta entera era código muerto en TypeScript. Están aquí porque
// la pantalla de reparación las necesita, y `toReceta()` las lee todas.
const COLS_RECETA = `install_method, custom_unlock_cmd, recovery_partition_name,
  recovery_boot, download_boot, download_mode, signed_material_required,
  pre_install_instructions, pre_install_version`;

const COLS = `codename, variant, marketing_name, vendor, vendor_nombre, soc_raw, soc_vendor,
  platform, model_numbers, android_version, release, capabilities,
  risk_flags, verification_gates, sources,
  homologado_ift, ift_certificado, ift_url,
  ${COLS_RECETA}`;

export class Catalog {
  private db: InstanceType<SqliteModule["DatabaseSync"]> | null = null;
  private qByCodename!: ReturnType<InstanceType<SqliteModule["DatabaseSync"]>["prepare"]>;
  /** Solo para el escaneo inicial que arma `modelIndex`. */
  private qAll!: ReturnType<InstanceType<SqliteModule["DatabaseSync"]>["prepare"]>;
  private qStats!: ReturnType<InstanceType<SqliteModule["DatabaseSync"]>["prepare"]>;

  /**
   * Índice de número de modelo → codenames.
   *
   * Se construye leyendo la tabla COMPLETA una vez, al abrir. No es un
   * descuido: evita escanear 12 MB en cada consulta por número de modelo, y
   * este índice es lo que hace que la resolución se sienta instantánea. El
   * coste es que la tabla entera queda en memoria, unos pocos MB, que en una
   * máquina de escritorio de 8 GB no se notan.
   */
  private modelIndex = new Map<string, string[]>();

  get available(): boolean {
    return this.db !== null;
  }

  open(dbPath: string): void {
    if (!sqlite) {
      throw new CatalogUnavailable(
        "el runtime de Electron no expone `node:sqlite` (hace falta Electron sobre Node 24 o superior)",
      );
    }
    if (!existsSync(dbPath)) {
      throw new CatalogUnavailable(`no existe el archivo ${dbPath}`);
    }

    this.db = new sqlite.DatabaseSync(dbPath, { readOnly: true });
    this.qByCodename = this.db.prepare(
      `SELECT ${COLS} FROM variant WHERE codename = ?`,
    );
    this.qAll = this.db.prepare(`SELECT codename, model_numbers FROM variant`);
    this.qStats = this.db.prepare(`SELECT COUNT(*) AS n FROM variant`);

    // Una sola pasada completa para el índice. 763 filas: instantáneo, y evita
    // escanear la tabla en cada consulta por número de modelo.
    //
    // Se guarda solo el codename, no la variante completa, porque un mismo
    // codename con varias variantes debe aparecer UNA vez por número de modelo.
    // Si se guardara la variante, `SM-A546B` en dos placas produciría una lista
    // con el mismo codename dos veces y el conteo de alternativas mentiría.
    //
    // El escaneo pide solo `codename` y `model_numbers`. Antes pedía todas las
    // columnas y construía una `DeviceVariant` por fila para leer dos campos;
    // con la receta eso significaba además leer y normalizar nueve columnas de
    // texto para 763 filas que se van a descartar. El índice se arma igual de
    // bien y deja de depender de cuánto pese `DeviceVariant`.
    for (const row of this.qAll.all()) {
      const v = toVariant(row);
      for (const m of v.modelNumbers) {
        const list = this.modelIndex.get(m);
        if (list) {
          if (!list.includes(v.codename)) list.push(v.codename);
        } else {
          this.modelIndex.set(m, [v.codename]);
        }
      }
    }
  }

  close(): void {
    this.db?.close();
    this.db = null;
  }

  stats(): { variants: number; modelNumbers: number } {
    if (!this.db) return { variants: 0, modelNumbers: 0 };
    const row = this.qStats.get();
    return {
      variants: Number(row?.n ?? 0),
      modelNumbers: this.modelIndex.size,
    };
  }

  byCodename(codename: string): DeviceVariant[] {
    if (!this.db) return [];
    return this.qByCodename.all(codename).map(toVariant);
  }

  byModelNumber(model: string): DeviceVariant[] {
    if (!this.db) return [];
    const codenames = this.modelIndex.get(model);
    if (!codenames) return [];

    // El índice guarda solo codenames, y eso está bien para no repetir el
    // mismo codename dos veces. Pero el número de modelo NO pertenece a todas
    // las variantes de ese codename: puede listarlo una sola. Devolver el
    // grupo entero inflaría las candidatas con placas que ese número no
    // describe, y con placas que no describen el número no se identifican
    // equipos: se ensucia el conteo de "cuántas variantes podrían ser", que
    // es justo lo que se muestra en la pantalla de ambigüedad.
    return codenames.flatMap((c) =>
      this.byCodename(c).filter((v) => v.modelNumbers.includes(model)),
    );
  }

  /**
   * Busca por codename a partir de la huella de compilación.
   *
   * `ro.build.fingerprint` tiene esta forma:
   *   samsung/rq3q/rq3q:13/TP1A.220624.014/A546XXU6AWF1:user/release-keys
   * El segmento con el nombre interno es el segundo. Es una PISTA, no una
   * prueba: hay equipos de operador cuyo fingerprint trae un codename que no
   * corresponde al que trae la base. Por eso el que llama tiene que reportarlo
   * como alternativa y nunca como coincidencia.
   */
  byFingerprintPrefix(fingerprint: string): DeviceVariant[] {
    if (!this.db) return [];
    const pista = fingerprint.split("/")[1];
    if (!pista) return [];
    return this.byCodename(pista);
  }

  /**
   * Resuelve un equipo real.
   *
   * El orden importa y está justificado por la fuerza de la evidencia:
   *   1. codename exacto        — único, de confianza
   *   2. número de modelo       — casi único, de confianza
   *   3. prefijo de fingerprint  — pista; puede ser ambigua
   * Nunca al revés: un número de modelo es un dato más específico que un
   * codename, y desambiguar con el dato débil primero genera falsos positivos.
   */
  resolve(props: Record<string, string | undefined>): {
    match: DeviceVariant | null;
    alternatives: DeviceVariant[];
  } {
    const codename = props["ro.product.device"];
    const model = props["ro.product.model"];

    if (codename) {
      const hits = this.byCodename(codename);
      if (hits.length === 1) return { match: hits[0]!, alternatives: [] };
      if (hits.length > 1) return { match: null, alternatives: hits };
    }

    if (model) {
      const hits = this.byModelNumber(model);
      if (hits.length === 1) return { match: hits[0]!, alternatives: [] };
      if (hits.length > 1) {
        // Ambigüedad real: dos variantes declaran el mismo número de modelo.
        // Elegir una sería inventar. Se devuelven todas.
        return { match: null, alternatives: hits };
      }
    }

    // Pista débil, al final y solo como alternativa.
    const fp = props["ro.build.fingerprint"];
    if (fp) {
      const hits = this.byFingerprintPrefix(fp);
      // Se descarta si la pista es el mismo codename que ya se probó y falló:
      // repetir la misma búsqueda con otro nombre no agrega información, y
      // presentarlo como si fuera una evidencia nueva sí sería engañoso.
      const nuevos = hits.filter((h) => h.codename !== codename);
      if (nuevos.length) return { match: null, alternatives: nuevos };
    }

    return { match: null, alternatives: [] };
  }
}

const DB_RELATIVA = join("fixmyphone_device_db.sqlite");

/**
 * Busca el archivo de catálogo.
 *
 * Se prueban varias rutas porque las dos formas de ejecutar la app tienen
 * estructuras distintas y ninguna de las dos se puede adivinar:
 *
 *   - EMPAQUETADO. `extraResources` deja el archivo en
 *     `<instalación>/resources/catalog/`. `process.resourcesPath` apunta ahí.
 *     Es el caso principal y el único que importa en producción.
 *
 *   - DESARROLLO con `npm run dev`. El proceso arranca con el directorio de
 *     trabajo en `apps/desktop`, así que hay que SUBIR cuatro niveles para
 *     llegar a la raíz del monorepo. Se sube de uno en uno y se comprueba en
 *     cada paso, en vez de asumir la profundidad: si mañana se anida otro
 *     paquete, sigue funcionando sin tocar nada.
 *
 * Se devuelve la primera que exista. No se regenera la base desde aquí: eso es
 * trabajo de `npm run db:build`, con Python y las fuentes descargadas, y no
 * algo que deba pasar a escondidas la primera vez que un técnico abre la app.
 */
export function locateCatalog(raizMonorepo: string): string | null {
  const candidatos: string[] = [];

  // Empaquetado primero: es el caso que no se puede deducir del cwd.
  if (process.resourcesPath) {
    candidatos.push(join(process.resourcesPath, "catalog", DB_RELATIVA));
  }

  // Desarrollo: se sube desde el cwd buscando la raíz del monorepo.
  let dir = resolve(raizMonorepo);
  for (let i = 0; i < 7; i++) {
    candidatos.push(join(dir, "packages", "device-db", "data", "out", DB_RELATIVA));
    const padre = dirname(dir);
    if (padre === dir) break;
    dir = padre;
  }

  for (const p of candidatos) {
    if (existsSync(p)) return p;
  }
  return null;
}
