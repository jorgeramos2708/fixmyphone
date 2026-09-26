/**
 * Implementación de Electron del contrato `FmpBridge`.
 * ===========================================================================
 *
 * Toda la lógica de dominio del proceso principal vive aquí, y no en los
 * handlers de IPC. La razón es práctica: un handler de IPC necesita una ventana
 * y un proceso de Electron para probarse; estas funciones no necesitan nada.
 *
 * Este archivo NO importa `electron` salvo por `app.getPath`, que es la única
 * cosa que hace falta y que se le inyecta desde afuera. Así el dominio se puede
 * ejercitar con `node` pelado, que es como se depura.
 */

import {
  existsSync,
  mkdirSync,
  readFileSync,
  writeFileSync,
} from "node:fs";
import { join } from "node:path";
import type {
  DeviceVariant,
  IdentityLadder,
  LicenseEnvelope,
  LicenseState,
  RawDeviceProps,
  Resolution,
  TransportKind,
} from "@fixmyphone/core";
import { FREE_DAILY_LIMIT, verifyLicense } from "@fixmyphone/licensing";
import { machineIdParts } from "@fixmyphone/licensing/machine";
import { Catalog, type CatalogUnavailable } from "./catalog.js";
import { ISSUER_PUBLIC_KEY } from "./public-key.js";

// ---------------------------------------------------------------------------
// Estado del proceso
// ---------------------------------------------------------------------------

/** Rutas y dependencias que entran desde afuera. */
export interface Deps {
  catalog: Catalog;
  /** Carpeta de datos del usuario. En Electron es `app.getPath("userData")`. */
  dataDir: string;
}

const LICENSE_FILE = "license.fmp";
const USAGE_FILE = "usage.json";

export class Platform {
  private readonly catalog: Catalog;
  private readonly dataDir: string;

  /** Caché de la licencia leída, para no releer el disco en cada consulta. */
  private licencia: LicenseState | null = null;

  constructor(deps: Deps) {
    this.catalog = deps.catalog;
    this.dataDir = deps.dataDir;
    if (!existsSync(this.dataDir)) mkdirSync(this.dataDir, { recursive: true });
  }

  // -------------------------------------------------------------------------
  // Escalera de identificación
  // -------------------------------------------------------------------------

  /**
   * Resuelve un equipo real contra el catálogo y explica CÓMO se llegó ahí.
   *
   * La escalera no es decoración. El técnico necesita saber si la app identificó
   * el equipo porque leyó el codename (fuerte) o porque adivinó por el prefijo
   * de la huella (débil), porque en el segundo caso la imagen que va a flashear
   * puede ser de otra placa. Cada nivel dice el dato crudo que lo motivó.
   */
  resolve(props: RawDeviceProps, transport: TransportKind): Resolution {
    const escalera: IdentityLadder[] = [];
    const p = props as Record<string, string | undefined>;

    // --- L0: ¿hay siquiera algo que leer? ---------------------------------
    if (transport === "fastboot") {
      escalera.push({
        level: 0,
        name: "Modo fastboot",
        evidence:
          "En fastboot no corre Android, así que no hay propiedades del sistema que leer. La identificación aquí es la más débil de todas: depende de que el bootloader conteste.",
        confidence: 0.2,
      });
    } else {
      escalera.push({
        level: 0,
        name: "Conexión ADB",
        evidence: `Transporte ${transport}. Se puede leer el sistema del equipo.`,
        confidence: 0.3,
      });
    }

    // --- L1: marca y modelo ----------------------------------------------
    const marca = p["ro.product.manufacturer"] ?? p["ro.product.brand"];
    const modelo = p["ro.product.model"];
    if (marca || modelo) {
      escalera.push({
        level: 1,
        name: "Marca y modelo comercial",
        evidence: [marca, modelo].filter(Boolean).join(" ") || "(vacío)",
        confidence: marca && modelo ? 0.4 : 0.3,
      });
    }

    // --- L2: codename ----------------------------------------------------
    const codename = p["ro.product.device"];
    if (!codename) {
      escalera.push({
        level: 2,
        name: "Nombre interno",
        evidence:
          "El equipo no expone ro.product.device. No hay codename con el que buscar.",
        confidence: 0.1,
      });
      return {
        match: null,
        ladder: escalera,
        alternatives: [],
        unresolvedReason:
          "El equipo conectado no expone ro.product.device, que es el dato con el que se identifica. Suele pasar en recovery o en ROMs muy recortadas.",
      };
    }

    escalera.push({
      level: 2,
      name: "Nombre interno (codename)",
      evidence: `ro.product.device = ${codename}`,
      confidence: 0.55,
    });

    // --- L3: el catálogo conoce el codename ------------------------------
    const porCodename = this.catalog.byCodename(codename);

    if (porCodename.length === 1) {
      escalera.push({
        level: 3,
        name: "Coincidencia exacta de codename",
        evidence: `El catálogo tiene una sola variante para "${codename}": ${porCodename[0]!.key}`,
        confidence: 0.85,
      });
      return { match: porCodename[0]!, ladder: escalera, alternatives: [] };
    }

    if (porCodename.length > 1) {
      // Ambigüedad real entre placas: el codename no alcanza. Sigue el nivel
      // 4, pero el resultado final NO elige: elige el técnico.
      escalera.push({
        level: 3,
        name: "Codename ambiguo",
        evidence: `"${codename}" corresponde a ${porCodename.length} variantes distintas: ${porCodename.map((v) => v.key).join(", ")}`,
        confidence: 0.5,
      });
    } else {
      escalera.push({
        level: 3,
        name: "Codename no registrado",
        evidence: `El catálogo no tiene ninguna variante con codename "${codename}".`,
        confidence: 0.35,
      });
    }

    // --- L4: número de modelo --------------------------------------------
    if (modelo) {
      const porModelo = this.catalog.byModelNumber(modelo);
      if (porModelo.length === 1) {
        escalera.push({
          level: 4,
          name: "Coincidencia por número de modelo",
          evidence: `${modelo} corresponde a una sola variante: ${porModelo[0]!.key}`,
          confidence: 0.8,
        });
        return { match: porModelo[0]!, ladder: escalera, alternatives: [] };
      }
      if (porModelo.length > 1) {
        escalera.push({
          level: 4,
          name: "Número de modelo ambiguo",
          evidence: `${modelo} aparece en ${porModelo.length} variantes: ${porModelo.map((v) => v.key).join(", ")}`,
          confidence: 0.45,
        });
        return {
          match: null,
          ladder: escalera,
          alternatives: porModelo,
          unresolvedReason:
            "El codename y el número de modelo apuntan a más de una variante de placa. Elegir una sería inventar: la diferencia entre ellas es exactamente la que define qué imagen se puede flashear.",
        };
      }
      escalera.push({
        level: 4,
        name: "Número de modelo no registrado",
        evidence: `El catálogo no conoce el número de modelo "${modelo}".`,
        confidence: 0.3,
      });
    }

    // --- L5: huella de compilación ---------------------------------------
    const fp = p["ro.build.fingerprint"];
    if (fp) {
      const pista = fp.split("/")[1];
      const porPista = pista ? this.catalog.byCodename(pista) : [];
      if (porPista.length) {
        escalera.push({
          level: 5,
          name: "Pista por huella de compilación",
          evidence: `La huella "${fp}" sugiere el codename "${pista}". Es una pista, no una prueba.`,
          confidence: 0.4,
        });
        return {
          match: null,
          ladder: escalera,
          alternatives: porPista,
          unresolvedReason:
            "Solo se pudo llegar a una pista por la huella de compilación. Con cero codename y cero número de modelo no se afirma nada: una suposición con este nivel de confianza es la forma más rápida de flashear la placa equivocada.",
        };
      }
    }

    escalera.push({
      level: 6,
      name: "Sin resolución",
      evidence: `Se intentó con codename "${codename}"${modelo ? ` y modelo "${modelo}"` : ""}. Ninguno dio una coincidencia única.`,
      confidence: 0.15,
    });

    return {
      match: null,
      ladder: escalera,
      alternatives: porCodename,
      unresolvedReason: porCodename.length
        ? "El codename existe en el catálogo pero con más de una variante, y no hubo un dato más específico que desambiguara."
        : "El catálogo no conoce este equipo. Puede ser un modelo muy nuevo, o de una marca con cobertura baja en la base.",
    };
  }

  lookupByModelNumber(modelNumber: string): DeviceVariant[] {
    return this.catalog.byModelNumber(modelNumber);
  }

  // -------------------------------------------------------------------------
  // Licencia
  // -------------------------------------------------------------------------

  private get licensePath(): string {
    return join(this.dataDir, LICENSE_FILE);
  }

  private get usagePath(): string {
    return join(this.dataDir, USAGE_FILE);
  }

  /**
   * Estado sin licencia: el plan gratuito, con su tope.
   *
   * Se devuelve el identificador de equipo AUNQUE no haya licencia. Es
   * justamente cuando el técnico necesita verlo: está a punto de comprarle
   * una a alguien y necesita poder leer el número en voz alta.
   */
  private estadoGratis(motivo?: string, parts = machineIdParts()): LicenseState {
    const uso = this.leerUso();
    return {
      tier: "free",
      valid: true,
      reason: motivo,
      usedToday: uso.dia === hoy() ? uso.n : 0,
      dailyLimit: FREE_DAILY_LIMIT,
      machine: { id: parts.id, user: parts.usuario, volume: parts.volumen },
    };
  }

  /**
   * Verifica la licencia guardada en disco.
   *
   * Una licencia inválida NO se borra: se conserva y se vuelve a intentar en el
   * siguiente arranque. Si el reloj del taller estaba mal, o la licencia se
   * renovó en otro equipo, basta con reiniciar.
   */
  licenseCurrent(): LicenseState {
    if (this.licencia) return this.licencia;

    if (!existsSync(this.licensePath)) {
      this.licencia = this.estadoGratis();
      return this.licencia;
    }

    this.licencia = this.verificarDesdeDisco();
    return this.licencia;
  }

  private verificarDesdeDisco(): LicenseState {
    const parts = machineIdParts();
    let envelope: LicenseEnvelope;
    try {
      const crudo = readFileSync(this.licensePath, "utf8").replace(/^﻿/, "");
      envelope = JSON.parse(crudo) as LicenseEnvelope;
    } catch (e) {
      return this.estadoGratis(
        `No se pudo leer el archivo de licencia: ${e instanceof Error ? e.message : String(e)}`,
      );
    }

    // `machineId` NO es opcional. Sin él, toda licencia atada a un equipo se
    // rechazaría, porque la verificación exige poder decir cuál es este equipo
    // antes de aceptar una atadura. Es el precio de que la atadura sea real en
    // vez de decorativa.
    const r = verifyLicense({
      envelope,
      publicKey: ISSUER_PUBLIC_KEY,
      machineId: parts.id,
    });
    if (!r.ok || !r.payload) {
      return this.estadoGratis(r.message, parts);
    }

    const uso = this.leerUso();
    return {
      tier: r.payload.tier,
      valid: true,
      subject: r.payload.subject,
      issuedAt: new Date(r.payload.iat * 1000).toISOString(),
      expiresAt: new Date(r.payload.exp * 1000).toISOString(),
      usedToday: uso.dia === hoy() ? uso.n : 0,
      dailyLimit: r.payload.tier === "free" ? FREE_DAILY_LIMIT : undefined,
      machine: { id: parts.id, user: parts.usuario, volume: parts.volumen },
    };
  }

  /** Activa una licencia pegada o leída de un archivo. */
  licenseActivate(envelope: LicenseEnvelope): LicenseState {
    const r = verifyLicense({
      envelope,
      publicKey: ISSUER_PUBLIC_KEY,
      machineId: machineIdParts().id,
    });
    if (!r.ok || !r.payload) {
      // Se conserva el estado anterior: una licencia pegada mal no debe
      // desactivar una licencia buena que ya estaba funcionando.
      this.licencia = this.estadoGratis(r.message);
      return this.licencia;
    }

    writeFileSync(this.licensePath, JSON.stringify(envelope, null, 2), "utf8");
    this.licencia = this.verificarDesdeDisco();
    return this.licencia;
  }

  licenseFromDisk(): LicenseState {
    this.licencia = null;
    return this.licenseCurrent();
  }

  // -------------------------------------------------------------------------
  // Contador de diagnósticos
  // -------------------------------------------------------------------------

  /**
   * ¿Se puede correr un diagnóstico con el nivel actual?
   *
   * El plan gratuito tiene tope. El premium no. La comprobación va en el
   * proceso principal, no en la interfaz, porque una interfaz que se puede
   * saltarse su propio límite no tiene ningún límite.
   */
  puedeDiagnosticar(): { ok: boolean; motivo?: string } {
    const lic = this.licenseCurrent();
    if (lic.tier === "premium" && lic.valid) return { ok: true };

    const uso = this.leerUso();
    const n = uso.dia === hoy() ? uso.n : 0;
    if (n >= FREE_DAILY_LIMIT) {
      return {
        ok: false,
        motivo: `El plan gratuito permite ${FREE_DAILY_LIMIT} diagnósticos al día y hoy ya se usaron ${n}. Se restablece mañana, o activa una licencia premium.`,
      };
    }
    return { ok: true };
  }

  contarDiagnostico(): void {
    const uso = this.leerUso();
    if (uso.dia !== hoy()) this.escribirUso({ dia: hoy(), n: 0 });
    else this.escribirUso({ dia: uso.dia, n: uso.n + 1 });
    // Se invalida la caché para que la barra de estado vea el nuevo conteo.
    this.licencia = null;
  }

  private leerUso(): { dia: string; n: number } {
    try {
      const v = JSON.parse(readFileSync(this.usagePath, "utf8")) as {
        dia?: string;
        n?: number;
      };
      return { dia: v.dia ?? "", n: typeof v.n === "number" ? v.n : 0 };
    } catch {
      return { dia: "", n: 0 };
    }
  }

  private escribirUso(v: { dia: string; n: number }): void {
    try {
      writeFileSync(this.usagePath, JSON.stringify(v), "utf8");
    } catch {
      // Si el disco está lleno o en solo lectura, el diagnóstico se sigue
      // permitiendo. Perder el contador es un annoyance; bloquear al técnico
      // con su herramienta en medio de un trabajo es inaceptable.
    }
  }
}

function hoy(): string {
  const d = new Date();
  const mes = String(d.getMonth() + 1).padStart(2, "0");
  const dia = String(d.getDate()).padStart(2, "0");
  return `${d.getFullYear()}-${mes}-${dia}`;
}

export type { CatalogUnavailable };
