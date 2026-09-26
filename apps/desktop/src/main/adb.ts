/**
 * Transporte ADB / fastboot.
 * ===========================================================================
 *
 * Habla con `adb` y `fastboot` como procesos hijos, no con una biblioteca. Es
 * una decisión con consecuencias buenas y malas:
 *
 *   BUENA: el behaviour de `adb` es exactamente el behaviour de `adb`. La
 *   herramienta que usan los técnicos ya funciona con esos comandos; si algo
 *   falla, el técnico puede reproducirlo a mano en una consola y conoce la
 *   respuesta. Con una biblioteca nativa, el fallo sería nuestro y nadie
 *   sabría qué pasó.
 *
 *   MALA: hay que analizar la salida de texto, que no es una API estable. Por
 *   eso TODO lo que se parsea va encapsulado en un solo archivo y documentado
 *   con la línea exacta de la que se extrae.
 *
 * Requisitos en la máquina del taller:
 *   - adb y fastboot en el PATH, o en las rutas que resuelve `findBinary`.
 *   - En Windows: Samsung USB Driver, no el genérico de Google. Con el
 *     genérico el equipo aparece como "unauthorized" para siempre y parece
 *     culpa de la herramienta.
 */

import { execFile, spawn, type ChildProcessWithoutNullStreams } from "node:child_process";
import { existsSync } from "node:fs";
import { join } from "node:path";
import type { ConnectedDevice, RawDeviceProps, TransportKind } from "@fixmyphone/core";

// ---------------------------------------------------------------------------
// Ubicación de los binarios
// ---------------------------------------------------------------------------

/** Rutas donde se instalan las platform-tools en Windows, por orden de preferencia. */
const WINDOWS_CANDIDATES = [
  join(process.env.LOCALAPPDATA ?? "", "Android", "Sdk", "platform-tools"),
  join(process.env.USERPROFILE ?? "", "AppData", "Local", "Android", "Sdk", "platform-tools"),
  join(process.env.ProgramFiles ?? "", "Android", "android-sdk", "platform-tools"),
  "C:\\platform-tools",
];

function findBinary(name: "adb" | "fastboot"): string | null {
  const exe = process.platform === "win32" ? `${name}.exe` : name;

  // Primero el PATH: si el técnico lo instaló a propósito, se respeta.
  const pathDirs = (process.env.PATH ?? "").split(process.platform === "win32" ? ";" : ":");
  for (const d of pathDirs) {
    if (!d) continue;
    const p = join(d, exe);
    if (existsSync(p)) return p;
  }

  if (process.platform === "win32") {
    for (const dir of WINDOWS_CANDIDATES) {
      if (!dir) continue;
      const p = join(dir, exe);
      if (existsSync(p)) return p;
    }
  }

  return null;
}

const adbPath = findBinary("adb");
const fastbootPath = findBinary("fastboot");

/** Para mostrar el estado en la barra inferior sin inventar nada. */
export const toolsAvailable = {
  adb: adbPath !== null,
  fastboot: fastbootPath !== null,
  adbPath,
  fastbootPath,
};

// ---------------------------------------------------------------------------
// Ejecución
// ---------------------------------------------------------------------------

const EXEC_TIMEOUT_MS = 8000;

function run(bin: string, args: string[]): Promise<{ code: number; out: string }> {
  return new Promise((resolve) => {
    execFile(
      bin,
      args,
      { timeout: EXEC_TIMEOUT_MS, windowsHide: true, maxBuffer: 4 * 1024 * 1024 },
      (err, stdout, stderr) => {
        const code = err && typeof (err as { code?: unknown }).code === "number"
          ? Number((err as { code: number }).code)
          : err
            ? 1
            : 0;
        // stdout y stderr se unen: `adb` escribe en stdout casi siempre, pero
        // fastboot usa stderr para algunos avisos que sí importan.
        resolve({ code, out: `${stdout}${stderr}` });
      },
    );
  });
}

// ---------------------------------------------------------------------------
// Propiedades del dispositivo
// ---------------------------------------------------------------------------

/**
 * Propiedades que se leen. La lista es explícita, no `adb shell getprop` y
 * parsear 4000 líneas: leerlo todo tarda 4 segundos en un equipo de gama
 * baja, y solo se necesitan 26.
 *
 * `ril.IMEI` requiere permisos de lectura de identidad en Android 10+; en
 * muchos equipos devuelve vacío. Eso es normal y la interfaz lo muestra como
 * "sin dato", nunca como un hueco con un valor inventado.
 */
const PROPS = [
  "ro.product.device",
  "ro.product.vendor.device",
  "ro.product.name",
  "ro.product.model",
  "ro.product.manufacturer",
  "ro.product.brand",
  "ro.product.cpu.abi",
  "ro.build.version.release",
  "ro.build.version.security_patch",
  "ro.build.version.incremental",
  "ro.build.fingerprint",
  "ro.build.id",
  "ro.build.display.id",
  "ro.boot.hardware",
  "ro.boot.bootloader",
  "ro.boot.verifiedbootstate",
  "ro.boot.flash.locked",
  "ro.boot.vbmeta.device_state",
  "ro.boot.slot_suffix",
  "ro.serialno",
  "ro.boot.serialno",
  "ro.crypto.state",
  "ro.crypto.type",
  "sys.boot_completed",
  "ril.IMEI",
  "ril.MEID",
  "gsm.version.baseband",
  "ro.sf.lcd_density",
  "ro.product.first_api_level",
] as const;

function parseProps(out: string): RawDeviceProps {
  const props: RawDeviceProps = {};
  for (const linea of out.split(/\r?\n/)) {
    const i = linea.indexOf("]: ");
    if (i === -1) continue;
    const clave = linea.slice(0, i).replace(/^\[ro\.|\]$/g, "").replace(/^\[/, "");
    // `getprop` devuelve [key]: [value]; la clave no lleva corchete al inicio
    const valor = linea.slice(i + 3).trim();
    if (clave) props[clave] = valor === "" ? "" : valor;
  }
  return props;
}

/**
 * Lee las propiedades de un equipo.
 *
 * Se pide `getprop` SIN argumentos, no `getprop <clave>` para cada una de las
 * 29. Veintinueve llamadas a `adb shell` en un teléfono de gama baja tardan
 * medio minuto; una sola tarda menos de un segundo. El comentario de arriba
 * habla de "no leer las 4000 líneas de getprop", y eso sigue siendo cierto:
 * el filtro de `PROPS` es lo que evita arrastrar 4,000 entradas de un ROM
 * genérica a la resolución.
 */
async function readProps(serial: string): Promise<RawDeviceProps> {
  const { out } = await run(adbPath!, ["-s", serial, "shell", "getprop"]);

  const todas = parseProps(out);
  const props: RawDeviceProps = {};
  for (const clave of PROPS) {
    const valor = todas[clave];
    if (valor !== undefined) props[clave] = valor;
  }
  return props;
}

// ---------------------------------------------------------------------------
// Listado
// ---------------------------------------------------------------------------

function parseDeviceList(out: string, kind: TransportKind): string[] {
  return out
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter((l) => l.length > 0 && !l.startsWith("*") && !l.toLowerCase().startsWith("list of"))
    .filter((l) => {
      if (kind === "fastboot") return true;
      // adb imprime `serial<TAB>state`; se descartan los estados que no son
      // equipos utilizables. `unauthorized` sí se muestra: es un estado que
      // el técnico tiene que poder ver y arreglar, no un equipo que no existe.
      const estado = (l.split(/\s+/)[1] ?? "").toLowerCase();
      return ["device", "unauthorized", "offline", "recovery", "sideload"].includes(estado);
    })
    .map((l) => l.split(/\s+/)[0]!);
}

async function batteryOf(serial: string): Promise<ConnectedDevice["battery"]> {
  const { out } = await run(adbPath!, ["-s", serial, "shell", "dumpsys", "battery"]);
  const level = /level:\s*(\d+)/i.exec(out);
  const ac = /AC powered:\s*(true|false)/i.exec(out);
  const usb = /USB powered:\s*(true|false)/i.exec(out);
  if (!level) return undefined;
  return {
    levelPct: Number(level[1]),
    charging: (ac?.[1] === "true") || (usb?.[1] === "true"),
  };
}

/**
 * Lista los equipos de los dos transportes.
 *
 * Se consultan ADB y fastboot porque un equipo en modo fastboot NO aparece
 * en `adb devices` y viceversa. El técnico cambia de modo según la tarea, y
 * la app tiene que reflejarlo sin que vuelva a pulsar "buscar".
 */
export async function listDevices(): Promise<ConnectedDevice[]> {
  const fuera: ConnectedDevice[] = [];
  const ahora = new Date().toISOString();

  if (adbPath) {
    const { out } = await run(adbPath, ["devices"]);
    for (const serial of parseDeviceList(out, "adb")) {
      const props = await readProps(serial);
      fuera.push({
        id: `adb:${serial}`,
        transport: "adb",
        serial,
        props,
        battery: await batteryOf(serial),
        connectedAt: ahora,
      });
    }
  }

  if (fastbootPath) {
    const { out } = await run(fastbootPath, ["devices"]);
    for (const serial of parseDeviceList(out, "fastboot")) {
      fuera.push({
        id: `fastboot:${serial}`,
        transport: "fastboot",
        serial,
        // En fastboot no hay Android corriendo: `getprop` no existe. Las
        // propiedades llegan por otros medios (série, o el comando
        // `getvar`). Se deja vacío y la interfaz lo dice.
        props: {},
        connectedAt: ahora,
      });
    }
  }

  return fuera;
}

// ---------------------------------------------------------------------------
// Vigilancia de conexión
// ---------------------------------------------------------------------------

type DeviceListener = (d: ConnectedDevice[]) => void;

/**
 * Escucha cambios de conexión.
 *
 * `adb track-devices` es un flujo de texto por stdout que emite una línea
 * por cada cambio. Es más fiable que hacer polling cada dos segundos: no
 * desperdicia CPU en un taller con 20 equipos y el técnico no nota retraso.
 */
export function watchDevices(emit: DeviceListener): () => void {
  if (!adbPath) return () => {};

  let hijo: ChildProcessWithoutNullStreams | null = null;
  let acumulado = "";
  let detenido = false;

  const poll = setInterval(() => {
    if (hijo || detenido) return;
    void listDevices().then(emit);
  }, 5000);

  try {
    hijo = spawn(adbPath, ["track-devices"], { windowsHide: true });
    hijo.stdout.setEncoding("utf8");
    hijo.stdout.on("data", (chunk: string) => {
      acumulado += chunk;
      const lineas = acumulado.split(/\r?\n/);
      acumulado = lineas.pop() ?? "";
      // Cualquier línea con contenido o la lista vacía `* daemon started *`
      // disparan un refresco: la verdad es el estado actual, no la línea.
      if (lineas.some((l) => l.trim().length > 0)) void listDevices().then(emit);
    });
    hijo.on("error", () => {
      hijo = null;
    });
    hijo.on("exit", () => {
      hijo = null;
    });
  } catch {
    hijo = null;
  }

  return () => {
    detenido = true;
    clearInterval(poll);
    hijo?.kill();
  };
}
