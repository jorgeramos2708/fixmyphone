/**
 * Implementación de `FmpBridge` para el navegador.
 * ===========================================================================
 *
 * Esta es la SEGUNDA implementación del contrato. Que exista, y no una copia
 * de la app, es la prueba de que la frontera aguanta: si el renderer tuviera
 * un `import { ipcRenderer }` escondido, esto no compilaría.
 *
 * Hace tres cosas que la app de escritorio no hace:
 *   1. Simula un equipo con propiedades verosímiles, para poder ver la UI sin
 *      un Samsung de verdad conectado.
 *   2. Ejecuta las sondas con retardo realista, para que el estado "ejecutando"
 *      se vea como se verá de verdad.
 *   3. Permite cambiar de equipo simulado, incluido uno que NO existe en el
 *      catálogo, para ver cómo se comporta la app cuando no sabe.
 *
 * No simula lo que sería peligroso simular: no finge que un diagnóstico pasó.
 */

import type {
  ConnectedDevice,
  DeviceVariant,
  FmpBridge,
  IdentityLadder,
  LicenseEnvelope,
  LicenseState,
  ProbeResult,
  RawDeviceProps,
  ReportDraft,
  Resolution,
  TransportKind,
} from "@fixmyphone/core";
import { DEMO_CATALOG } from "@fixmyphone/app/data/demo-catalog";

/** Espera un poco. Simula la latencia de un comando real. */
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

// ---------------------------------------------------------------------------
// Equipos simulados
// ---------------------------------------------------------------------------

interface Simulated {
  id: string;
  label: string;
  /** Nota que se explica en la interfaz. */
  note: string;
  props: RawDeviceProps;
  battery: { levelPct: number; charging: boolean };
  /**
   * Este equipo NO está en el catálogo, a propósito, para que se vea cómo
   * responde la app cuando no sabe. Es la parte honesta de la demo.
   *
   * Todo lo demás tiene que resolver. La regla existe porque se apuntaron dos
   * fixtures a codenames que el recorte de 48 no traía, y la demo contestaba
   * "sin coincidencia en el catálogo" en dos de cinco casos: medio catálogo de
   * mentira, y sin ningún error que lo dijera. Marcarlo aquí hace que la
   * excepción sea visible en el codigo y que `tools/probar-if.py` pueda exigir
   * que todo lo demás sí resuelva.
   */
  fueraDelCatalogo?: true;
}

const SIMULADOS: Simulated[] = [
  {
    id: "a54-5g",
    label: "Galaxy A54 5G (Exynos 1380)",
    note: "El caso más común en un taller mexicano de 2026. Variante con SoC.",
    props: {
      "ro.product.device": "rq3q",
      "ro.product.vendor.device": "qcom",
      "ro.product.name": "rq3q_00",
      "ro.product.model": "SM-A546B",
      "ro.product.manufacturer": "samsung",
      "ro.product.brand": "samsung",
      "ro.build.version.release": "13",
      "ro.build.version.security_patch": "2024-02-01",
      "ro.build.id": "TP1A.220624.014",
      "ro.build.fingerprint":
        "samsung/rq3q/rq3q:13/TP1A.220624.014/A546XXU6AWF1:user/release-keys",
      "ro.boot.hardware": "qcom",
      "ro.boot.bootloader": "A546XXU6AWF1",
      "ro.boot.verifiedbootstate": "green",
      "ro.boot.flash.locked": "1",
      "ro.serialno": "RF8T20ABCDE",
      "ro.crypto.state": "encrypted",
      "ro.crypto.type": "file",
      "sys.boot_completed": "1",
      "ril.IMEI": "356938035643809",
      "gsm.version.baseband": "A546XXU6AWF1",
      "ro.sf.lcd_density": "420",
      "ro.product.cpu.abi": "arm64-v8a",
    },
    battery: { levelPct: 87, charging: true },
  },
  {
    // Apuntaba a un Galaxy A14 (codename `rq3a`) que no esta en el recorte de
    // 48, asi que la demo le contestaba "sin coincidencia en el catalogo" y
    // esta pantalla no demostraba nada. Se cambio por un Galaxy A21s, que si esta
    // y que mantiene lo que el equipo queria mostrar: un Samsung de gama de
    // entrada con Exynos 850 y el bootloader bloqueado de fabrica. El nombre del
    // equipo tambien cambio, porque el catalogo no tiene un A14 y el fixture
    // tiene que decir el nombre del equipo que de verdad esta simulando.
    id: "a21s",
    label: "Galaxy A21s (Exynos 850)",
    note: "Gama de entrada, muy voluminoso. Viene con el bootloader bloqueado de fabrica.",
    props: {
      "ro.product.device": "a21s",
      "ro.product.model": "SM-A217F",
      "ro.product.manufacturer": "samsung",
      "ro.build.version.release": "13",
      "ro.build.version.security_patch": "2024-02-01",
      "ro.build.fingerprint":
        "samsung/a21s/a21s:13/TP1A.220624.014/A217FXXU5AWF1:user/release-keys",
      "ro.boot.hardware": "exynos850",
      "ro.boot.flash.locked": "1",
      "ro.boot.verifiedbootstate": "green",
      "ro.serialno": "R5CT30XYZ12",
      "sys.boot_completed": "1",
      "ril.IMEI": "351234567890123",
    },
    battery: { levelPct: 42, charging: false },
  },
  {
    // Motorola con el estado `sin_verificar`: se busco en la tabla de la marca
    // y este modelo no aparece. Es el caso que mas se confunde con "no se
    // busco", asi que conviene verlo junto al A54, que si esta sin buscar.
    //
    // Antes apuntaba a un moto g84 (codename `kunlun`) que tampoco esta en el
    // recorte, y decia "MediaTek" y "riesgo de BROM". Ninguna de las dos cosas
    // era cierta: `kunlun` no existe en la base, y en este catalogo el riesgo
    // de programador firmado se llama `edl_requires_signed_programmer`, no
    // `brom`. Un fixture que describe riesgos que el catalogo no tiene
    // desorienta a quien lo lee sobre lo que la herramienta afirma.
    id: "moto-g34",
    label: "moto g34 5G",
    note: "Motorola que si se busco en la tabla del IFT y no aparecio. Contrasta con el A54, que no se ha buscado.",
    props: {
      "ro.product.device": "fogos",
      "ro.product.model": "XT2363-1",
      "ro.product.manufacturer": "motorola",
      "ro.build.version.release": "14",
      "ro.build.version.security_patch": "2024-02-01",
      "ro.build.fingerprint":
        "motorola/fogos/fogos:14/U1TQS34.20-46-10/f9e1a2b3c4d5:user/release-keys",
      "ro.boot.hardware": "sm6375",
      "ro.boot.flash.locked": "0",
      "ro.boot.verifiedbootstate": "orange",
      "ro.serialno": "8d9c1f2e3a4b5c6d",
      "sys.boot_completed": "1",
    },
    battery: { levelPct: 15, charging: true },
  },
  {
    // El equipo de una tercera marca. Xiaomi es de las tres grandes del país y
    // la demo solo tenía Samsung y Motorola, así que el que seialize esto en un
    // taller ve dos marcas y cree que la herramienta solo conoce dos.
    //
    // Se eligió este codename porque `Mi439` sí tiene dos variantes reales en el
    // catálogo: `Mi439#1` es el Redmi 7A y `Mi439#2` el Redmi 8, con listas de
    // números de modelo distintas (M1903... y M1908...). No es un caso elegido
    // por adornar la pantalla; es el que hay.
    id: "redmi-7a",
    label: "Redmi 8 (Xiaomi)",
    note: "Gama de entrada muy voluminosa. El codename Mi439 cubre dos placas distintas en el catálogo.",
    props: {
      "ro.product.device": "Mi439",
      "ro.product.model": "M1908C3IC",
      "ro.product.manufacturer": "xiaomi",
      "ro.product.brand": "redmi",
      "ro.build.version.release": "9",
      "ro.build.version.security_patch": "2020-04-01",
      "ro.build.fingerprint":
        "xiaomi/Mi439/Mi439:9/PKQ1.190319.001/M1908C3IC:user/release-keys",
      "ro.boot.hardware": "qcom",
      "ro.boot.flash.locked": "1",
      "ro.boot.verifiedbootstate": "green",
      "ro.serialno": "9f8e7d6c5b4a",
      "sys.boot_completed": "1",
    },
    battery: { levelPct: 71, charging: false },
  },
  {
    // El unico equipo simulado con FOLIO del IFT. Existe por una razon concreta:
    // el catalogo de la demo garantiza un caso `homologado` (ver
    // ESTADOS_A_MOSTRAR en tools/generar-demo-catalog.mjs) y sin un equipo que
    // apunte a el, esa fila no se puede ver en la demo. Un dato que no aparece
    // en ninguna pantalla es indistinguible de un dato inventado.
    //
    // Los props son los REALES de un moto g32: XT2235-1 esta en la lista de
    // numeros de modelo de la variante `devon`, que es la que el generador dejo
    // con el folio RTIMOXT22-3427. No se inventaron props para que cuadraran.
    id: "moto-g32-ift",
    label: "moto g32 (con folio del IFT)",
    note: "La homologacion del IFT ya verificada contra la tabla de la marca: aqui se ve el folio.",
    props: {
      "ro.product.device": "devon",
      "ro.product.model": "XT2235-1",
      "ro.product.manufacturer": "motorola",
      "ro.build.version.release": "12",
      "ro.build.version.security_patch": "2023-08-01",
      "ro.build.fingerprint":
        "motorola/devon/devon:12/S3RQS32.20-42-10/f9e1a2b3c4d5:user/release-keys",
      "ro.boot.hardware": "sm6225",
      "ro.boot.flash.locked": "0",
      "ro.boot.verifiedbootstate": "orange",
      "ro.serialno": "z1y2x3w4v5u6t7s8",
      "sys.boot_completed": "1",
    },
    battery: { levelPct: 62, charging: false },
  },
  {
    id: "desconocido",
    label: "Equipo fuera del catálogo (SM-S931B)",
    note: "Galaxy S24 Ultra. A propósito: el catálogo no lo tiene. La app debe decirlo, no adivinar.",
    fueraDelCatalogo: true,
    props: {
      "ro.product.device": "e1s",
      "ro.product.model": "SM-S931B",
      "ro.product.manufacturer": "samsung",
      "ro.build.version.release": "15",
      "ro.build.version.security_patch": "2025-08-01",
      "ro.build.fingerprint":
        "samsung/e1s/e1s:15/AP3A.240905.015/E1SXXU6AWF1:user/release-keys",
      "ro.boot.hardware": "qcom",
      "ro.serialno": "R5CT99ZZZZZ9",
      "sys.boot_completed": "1",
    },
    battery: { levelPct: 68, charging: false },
  },
];

// ---------------------------------------------------------------------------
// Resolución contra el catálogo
// ---------------------------------------------------------------------------

/**
 * Escalera de identificación.
 *
 * Cada nivel añade evidencia. El orden va de barato a caro: un match por
 * número de modelo es fuerte; uno por prefijo de fingerprint es una conjetura
 * y se declara como tal con menos confianza.
 */
function buildLadder(
  props: RawDeviceProps,
  match: DeviceVariant | null,
): IdentityLadder[] {
  const steps: IdentityLadder[] = [];
  const device = props["ro.product.device"];
  const model = props["ro.product.model"];
  const fp = props["ro.build.fingerprint"];

  if (device) {
    const exacto = DEMO_CATALOG.find((v) => v.codename === device);
    steps.push({
      level: 1,
      name: "ro.product.device",
      evidence: exacto ? `coincide con el codename ${device}` : `${device}: no está en el catálogo`,
      confidence: exacto ? 0.95 : 0.3,
    });
  }

  if (model) {
    const porModelo = DEMO_CATALOG.find((v) => v.modelNumbers.includes(model));
    steps.push({
      level: 2,
      name: "Número de modelo",
      evidence: porModelo
        ? `${model} aparece en la lista de ${porModelo.modelNumbers.length} números de ${porModelo.key}`
        : `${model} no figura en ningún registro`,
      confidence: porModelo ? 0.9 : 0.2,
    });
  }

  if (fp) {
    steps.push({
      level: 3,
      name: "Fingerprint de compilación",
      evidence: match
        ? `el prefijo ${fp.split("/")[1]} coincide con ${match.codename}`
        : `solo se puede usar como pista: ${fp.split("/")[1]}`,
      confidence: match ? 0.6 : 0.25,
    });
  }

  if (match) {
    steps.push({
      level: 4,
      name: "Cruce de SoC",
      evidence: `${match.soc ?? "SoC desconocido"} declarado para ${match.key}`,
      confidence: match.soc ? 0.95 : 0.5,
    });
  }

  return steps;
}

function resolveLocal(props: RawDeviceProps): Resolution {
  const device = props["ro.product.device"];
  const model = props["ro.product.model"];

  // 1) codename exacto
  let match = device ? (DEMO_CATALOG.find((v) => v.codename === device) ?? null) : null;

  // 2) número de modelo
  if (!match && model) {
    match = DEMO_CATALOG.find((v) => v.modelNumbers.includes(model)) ?? null;
  }

  // 3) prefijo de fingerprint (pista débil)
  if (!match && props["ro.build.fingerprint"]) {
    const hint = props["ro.build.fingerprint"].split("/")[1];
    if (hint) match = DEMO_CATALOG.find((v) => v.codename === hint) ?? null;
  }

  const ladder = buildLadder(props, match);

  if (!match) {
    return {
      match: null,
      ladder,
      alternatives: [],
      unresolvedReason:
        "Ningún codename ni número de modelo del equipo aparece en el catálogo. " +
        "Se necesita una entrada curada antes de poder afirmar nada sobre esta variante.",
    };
  }

  return { match, ladder, alternatives: [] };
}

// ---------------------------------------------------------------------------
// Sondas
// ---------------------------------------------------------------------------

interface ProbeDef {
  id: string;
  command: string;
  explanation: string;
  /** Resultado simulado. */
  outcome: "pass" | "fail" | "skip";
  raw: string;
  ms: number;
}

function buildProbes(d: ConnectedDevice, v: DeviceVariant | null): ProbeDef[] {
  const p = d.props;
  const ab = v?.capabilities.includes("a_b_slots") ?? false;

  return [
    {
      id: "boot_completed",
      command: "adb shell getprop sys.boot_completed",
      explanation:
        "Confirma que Android terminó de arrancar. Si devuelve 0, el equipo se quedó en el logo o en un bucle: el problema es de arranque, no de software.",
      outcome: p["sys.boot_completed"] === "1" ? "pass" : "fail",
      raw: p["sys.boot_completed"] ?? "(vacío)",
      ms: 180,
    },
    {
      id: "verified_boot_state",
      command: "adb shell getprop ro.boot.verifiedbootstate",
      explanation:
        "Verde significa que la cadena de arranque verificó el firmware sin modificarlo. Naranja o rojo indica imagen no firmada: es el estado normal de un equipo con bootloader desbloqueado, y no es un defecto.",
      outcome: "pass",
      raw: p["ro.boot.verifiedbootstate"] ?? "unknown",
      ms: 160,
    },
    {
      id: "bootloader_locked",
      command: "adb shell getprop ro.boot.flash.locked",
      explanation:
        "1 = bootloader bloqueado. Mientras siga bloqueado, cualquier firmware que no sea el de fábrica lo rechazará, y un factory reset es la única opción que conserva la garantía.",
      outcome: p["ro.boot.flash.locked"] === "1" ? "pass" : "skip",
      raw: p["ro.boot.flash.locked"] ?? "unknown",
      ms: 150,
    },
    {
      id: "frp_account",
      command: "adb shell pm list accounts | grep -c com.google",
      explanation:
        "Detecta si el restablecimiento de fábrica va a pedir la cuenta de Google anterior. Si la pide, hay que avisarle al cliente ANTES de borrar, no después.",
      outcome: "skip",
      raw: "skipped: requiere consentimiento del cliente para leer cuentas",
      ms: 120,
    },
    {
      id: "battery_health",
      command: "adb shell dumpsys battery",
      explanation:
        "Lee el estado de la celda. Una capacidad de diseño muy por debajo del 100% con carga presente es desgaste real, no restricción de software.",
      outcome: "pass",
      raw: [
        "Current Battery Service state:",
        "  AC powered: true",
        "  USB powered: true",
        "  status: 2",
        "  health: 2",
        "  level: 87",
        "  scale: 100",
        "  voltage: 4243",
        "  temperature: 291",
        "  technology: Li-ion",
      ].join("\n"),
      ms: 420,
    },
    {
      id: "storage_smart",
      command: "adb shell dumpsys diskstats | grep -i wear",
      explanation:
        "Porcentaje de desgaste de la memoria. Arriba de 80% la parte lenta del equipo (apps, cámara) empieza a fallar y el cliente lo reporta como 'se Lagging'.",
      outcome: "pass",
      raw: "Wear_levelling: 3\nTotal_Lifetime_Writes: 118.4 TB\nPercentage_Used: 6%",
      ms: 380,
    },
    {
      id: "slot_health",
      command: "adb shell getprop ro.boot.slot_suffix",
      explanation: ab
        ? "Los dos slots de arranque están sanos. Con A/B, un flasheo fallido no deja el equipo sin arranque: se cambia de ranura y sigue viva."
        : "Solo hay una partición de arranque. No hay red de seguridad: si el flasheo se interrumpe, el equipo no vuelve a encender.",
      outcome: ab ? "pass" : "skip",
      raw: ab ? "_a" : "sin ranura B declarada",
      ms: 140,
    },
    {
      id: "network_register",
      command: "adb shell dumpsys telephony.registry | grep mServiceState",
      explanation:
        "Verifica registro en la red. Un equipo importado de Estados Unidos puede quedarse sin señal si la banda no coincide con las redes mexicanas: n28 (700 MHz APT) es la clave.",
      outcome: "pass",
      raw: "mServiceState=0 (REGISTRATION_COMPLETE)\nmSignalStrength=SignalStrength{gsm:21}",
      ms: 520,
    },
  ];
}

// ---------------------------------------------------------------------------
// Estado interno
// ---------------------------------------------------------------------------

let currentSim = SIMULADOS[0];
const listeners = new Set<(d: ConnectedDevice[]) => void>();

let licenseState: LicenseState = {
  tier: "free",
  valid: true,
  usedToday: 0,
  dailyLimit: 2,
};

function toDevice(s: Simulated): ConnectedDevice {
  return {
    id: `sim:${s.id}`,
    transport: "simulated" as TransportKind,
    serial: s.props["ro.serialno"] ?? s.id,
    props: s.props,
    battery: s.battery,
    connectedAt: new Date().toISOString(),
  };
}

function current(): ConnectedDevice[] {
  return currentSim ? [toDevice(currentSim)] : [];
}

function emit() {
  const snap = current();
  for (const cb of listeners) cb(snap);
}

// ---------------------------------------------------------------------------
// El puente
// ---------------------------------------------------------------------------

export function createBrowserBridge(): FmpBridge & { setSim(id: string): void } {
  return {
    platform: "browser",
    version: "0.1.0-demo",

    onDevice(cb) {
      listeners.add(cb);
      return () => listeners.delete(cb);
    },

    async listDevices() {
      await sleep(120);
      return current();
    },

    async resolve(props) {
      // La resolución real debe ser instantánea: por eso el .exe mantiene el
      // SQLite abierto. Aquí se simula una lectura de disco.
      await sleep(180);
      return resolveLocal(props);
    },

    async lookupByModelNumber(modelNumber) {
      return DEMO_CATALOG.filter((v) => v.modelNumbers.includes(modelNumber));
    },

    async runProbes(deviceId, onProgress) {
      const d = current().find((x) => x.id === deviceId) ?? current()[0];
      if (!d) {
        return [
          {
            id: "sin-equipo",
            state: "fail",
            explanation:
              "No hay ningun equipo simulado conectado. Vuelve a elegir uno en la lista de abajo.",
          },
        ];
      }
      const v = resolveLocal(d.props).match;
      const defs = buildProbes(d, v);
      const out: ProbeResult[] = [];

      for (const def of defs) {
        const running: ProbeResult = {
          id: def.id,
          state: "running",
          command: def.command,
          explanation: def.explanation,
        };
        onProgress(running);

        await sleep(def.ms);

        const done: ProbeResult = {
          id: def.id,
          state: def.outcome,
          command: def.command,
          explanation: def.explanation,
          raw: def.raw,
          durationMs: def.ms,
        };
        out.push(done);
        onProgress(done);
      }

      return out;
    },

    license: {
      async current() {
        return licenseState;
      },

      async activate(env: LicenseEnvelope) {
        // La demo web NO valida firmas: eso requiere la clave privada del
        // emisor, que no viaja con la app. Una demo que "valida" firmas
        // sería mentira. Se marca como tal y se pide usar el .exe.
        try {
          const payload = JSON.parse(
            Buffer.from(env.payload, "base64url").toString("utf8"),
          ) as { tier?: string; subject?: string; exp?: number };

          licenseState = {
            tier: payload.tier === "premium" ? "premium" : "free",
            valid: payload.tier === "premium",
            subject: payload.subject,
            issuedAt: new Date().toISOString(),
            expiresAt: payload.exp ? new Date(payload.exp * 1000).toISOString() : undefined,
            reason:
              payload.tier === "premium"
                ? undefined
                : "La demo web no verifica firmas Ed25519. Actívala en la app de escritorio para validación real.",
            usedToday: 0,
            dailyLimit: undefined,
          };
        } catch {
          licenseState = {
            ...licenseState,
            valid: false,
            reason: "No se pudo leer el contenido de la licencia.",
          };
        }
        return licenseState;
      },

      async loadFromDisk() {
        licenseState = {
          ...licenseState,
          reason: "El navegador no tiene disco. Activa la licencia pegando su contenido.",
        };
        return licenseState;
      },
    },

    async saveReport(draft: ReportDraft) {
      // Descarga real: el navegador sí puede entregar un archivo.
      const blob = new Blob([renderReportText(draft)], { type: "text/plain;charset=utf-8" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `fixmyphone-${draft.device.serial}.txt`;
      a.click();
      URL.revokeObjectURL(url);
      return { ok: true, path: a.download };
    },

    async reveal() {
      /* sin equivalente en navegador */
    },

    setSim(id: string) {
      const found = SIMULADOS.find((s) => s.id === id);
      if (!found) return;
      currentSim = found;
      licenseState = { tier: "free", valid: true, usedToday: 0, dailyLimit: 2 };
      emit();
    },
  };
}

export { SIMULADOS };

/** Volcado de texto plano. El PDF firmado llega en una fase posterior. */
function renderReportText(d: ReportDraft): string {
  const L: string[] = [];
  const rule = "=".repeat(64);
  L.push(rule, "INFORME FIXMYPHONE", rule);
  L.push(`Generado:       ${new Date().toLocaleString("es-MX")}`);
  L.push(`Plan:           ${d.license.tier}`);
  L.push("");
  L.push("-- EQUIPO " + "-".repeat(54));
  L.push(`Variante:       ${d.resolution.match?.key ?? "sin identificar"}`);
  L.push(`Nombre:         ${d.resolution.match?.marketingName ?? "-"}`);
  L.push(`SoC:            ${d.resolution.match?.soc ?? "-"}`);
  L.push(`Número de modelo: ${d.device.props["ro.product.model"] ?? "-"}`);
  L.push(`Serie:          ${d.device.serial}`);
  L.push("");
  if (d.resolution.match?.riskFlags.length) {
    L.push("-- RIESGOS " + "-".repeat(55));
    for (const f of d.resolution.match.riskFlags) L.push(`  * ${f}`);
    L.push("");
  }
  L.push("-- PRUEBAS " + "-".repeat(55));
  for (const p of d.probes) L.push(`  ${p.state.toUpperCase().padEnd(8)} ${p.id}`);
  L.push("", rule);
  if (d.watermarked) L.push("INFORME DE EVALUACIÓN — requiere licencia Premium");
  return L.join("\n");
}
