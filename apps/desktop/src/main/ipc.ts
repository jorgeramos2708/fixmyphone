/**
 * Handlers de IPC.
 * ===========================================================================
 *
 * Un handler por canal, sin canal genérico. El preload declara once Eleven
 * canales; aquí se responde exactamente a esos once. Si alguien agrega un
 * handler sin tocar el preload, el renderer no lo puede alcanzar: la superficie
 * de ataque es el preload, no esta archivo.
 *
 * Este archivo sí importa `electron`, porque necesita ventanas y diálogos. La
 * lógica de dominio NO está aquí: vive en `platform.ts`, que se puede probar
 * sin arrancar nada. Aquí solo se traduce entre IPC y dominio.
 */

import { BrowserWindow, dialog, ipcMain, shell, app, type IpcMainInvokeEvent } from "electron";
import { writeFileSync } from "node:fs";
import { join } from "node:path";
import type {
  ConnectedDevice,
  LicenseEnvelope,
  LicenseState,
  ProbeResult,
  RawDeviceProps,
  ReportDraft,
  Resolution,
  TransportKind,
  DeviceVariant,
} from "@fixmyphone/core";
import { listDevices, toolsAvailable, watchDevices } from "./adb.js";
import { Catalog, CatalogUnavailable, locateCatalog } from "./catalog.js";
import { Platform } from "./platform.js";
import { buildReport, reportFileName } from "./report.js";
import { runAllProbes } from "./probes.js";

const CH = {
  listDevices: "fmp:list-devices",
  onDevice: "fmp:on-device",
  resolve: "fmp:resolve",
  lookupModel: "fmp:lookup-model-number",
  runProbes: "fmp:run-probes",
  probeProgress: "fmp:probe-progress",
  licenseCurrent: "fmp:license-current",
  licenseActivate: "fmp:license-activate",
  licenseFromDisk: "fmp:license-from-disk",
  saveReport: "fmp:save-report",
  reveal: "fmp:reveal",
} as const;

// ---------------------------------------------------------------------------
// Estado
// ---------------------------------------------------------------------------

const catalog = new Catalog();
let platform: Platform | null = null;
let pararDeEscuchar: (() => void) | null = null;

/** Los equipos que se han conectado, para resolver sondas por id. */
const equiposVistos = new Map<string, ConnectedDevice>();

/** Ventanas vivas. En producción hay una, pero el código no lo asume. */
function ventanas(): BrowserWindow[] {
  return BrowserWindow.getAllWindows();
}

/**
 * Qué herramientas de línea de comandos faltan.
 *
 * Se comprueba al arrancar y se avisa en la consola, no en pantalla. La razón
 * de no hacerlo en pantalla: si `adb` no está, la lista de equipos sale vacía y
 * ya se ve. Un cartel de error adicional solotaparía el espacio del técnico con
 * una causa que él no puede arreglar desde la app; tiene que instalarla.
 */
function faltantesDeHerramientas(): string[] {
  const faltan: string[] = [];
  if (!toolsAvailable.adb) faltan.push("adb");
  if (!toolsAvailable.fastboot) faltan.push("fastboot");
  return faltan;
}

// ---------------------------------------------------------------------------
// Registro
// ---------------------------------------------------------------------------

export function registerIpc(_ipc: typeof ipcMain): void {
  // --- Catálogo ----------------------------------------------------------
  // Si la base no abre, la app SIGUE arrancando. Un técnico con el catálogo
  // roto todavía puede ver los equipos conectados y leer las sondas; lo que
  // pierde es la identificación. Dejarlo todo en blanco sería peor.
  const ruta = locateCatalog(process.cwd());
  let notaCatalogo = "";
  if (ruta) {
    try {
      catalog.open(ruta);
    } catch (e) {
      notaCatalogo =
        e instanceof CatalogUnavailable
          ? e.message
          : `El catálogo no se pudo abrir: ${e instanceof Error ? e.message : String(e)}`;
    }
  } else {
    notaCatalogo =
      "No se encontró el catálogo de dispositivos. La identificación no funcionará hasta regenerar la base.";
  }
  if (notaCatalogo) {
    console.error(`[fmp] ${notaCatalogo}`);
  }

  const faltan = faltantesDeHerramientas();
  if (faltan.length) {
    console.warn(
      `[fmp] No se encontró ${faltan.join(" ni ")} en el PATH. ` +
        "La lista de equipos conectados saldrá vacía. En Windows hace falta el " +
        "Samsung USB Driver para los equipos Samsung; con el driver genérico de " +
        "Google el equipo aparece como «unauthorized» para siempre.",
    );
  }

  platform = new Platform({ catalog, dataDir: app.getPath("userData") });
  if (notaCatalogo) (platform as { nota?: string }).nota = notaCatalogo;

  // --- Vigilancia de conexión --------------------------------------------
  pararDeEscuchar = watchDevices((devices) => {
    for (const d of devices) equiposVistos.set(d.id, d);
    for (const w of ventanas()) {
      if (!w.isDestroyed()) w.webContents.send(CH.onDevice, devices);
    }
  });

  // --- Dispositivos ------------------------------------------------------
  ipcMain.handle(CH.listDevices, async (): Promise<ConnectedDevice[]> => {
    const devices = await listDevices();
    for (const d of devices) equiposVistos.set(d.id, d);
    return devices;
  });

  // --- Catálogo: resolución ---------------------------------------------
  ipcMain.handle(
    CH.resolve,
    (
      _e: IpcMainInvokeEvent,
      props: RawDeviceProps,
      transport: TransportKind,
    ): Resolution => {
      if (!platform) {
        return {
          match: null,
          ladder: [],
          alternatives: [],
          unresolvedReason: "La app todavía no terminó de arrancar.",
        };
      }
      return platform.resolve(props, transport);
    },
  );

  ipcMain.handle(
    CH.lookupModel,
    (_e: IpcMainInvokeEvent, modelNumber: string): DeviceVariant[] =>
      platform ? platform.lookupByModelNumber(modelNumber) : [],
  );

  // --- Diagnóstico --------------------------------------------------------
  ipcMain.handle(
    CH.runProbes,
    async (
      e: IpcMainInvokeEvent,
      deviceId: string,
    ): Promise<ProbeResult[]> => {
      const device = equiposVistos.get(deviceId);
      if (!device) {
        return [
          {
            id: "sin-equipo",
            state: "fail",
            explanation:
              "El equipo ya no está en la lista. Se desconectó mientras se diagnosticaba; vuelve a buscar equipos.",
          },
        ];
      }

      if (!platform) {
        return [
          {
            id: "sin-plataforma",
            state: "fail",
            explanation: "La app todavía no terminó de arrancar.",
          },
        ];
      }

      // El tope del plan gratuito se comprueba AQUÍ, en el proceso principal.
      // Ponerlo en la interfaz sería un límite que el renderer puede saltarse.
      const permiso = platform.puedeDiagnosticar();
      if (!permiso.ok) {
        return [
          {
            id: "limite-diario",
            state: "fail",
            explanation: permiso.motivo ?? "Se alcanzó el tope del plan gratuito.",
          },
        ];
      }

      const ventana = BrowserWindow.fromWebContents(e.sender);
      platform.contarDiagnostico();

      return runAllProbes(device, (r) => {
        if (ventana && !ventana.isDestroyed()) {
          ventana.webContents.send(CH.probeProgress, r);
        }
      });
    },
  );

  // --- Licencia -----------------------------------------------------------
  ipcMain.handle(CH.licenseCurrent, (): LicenseState => {
    if (!platform) return { tier: "free", valid: true, usedToday: 0, dailyLimit: 2 };
    const s = platform.licenseCurrent();
    const nota = (platform as { nota?: string }).nota;
    return nota ? { ...s, reason: s.reason ?? nota } : s;
  });

  ipcMain.handle(
    CH.licenseActivate,
    (_e: IpcMainInvokeEvent, envelope: LicenseEnvelope): LicenseState => {
      if (!platform) return { tier: "free", valid: true, reason: "Sin plataforma.", usedToday: 0, dailyLimit: 2 };
      return platform.licenseActivate(envelope);
    },
  );

  ipcMain.handle(CH.licenseFromDisk, (): LicenseState => {
    if (!platform) return { tier: "free", valid: true, usedToday: 0, dailyLimit: 2 };
    return platform.licenseFromDisk();
  });

  // --- Salida -------------------------------------------------------------
  ipcMain.handle(
    CH.saveReport,
    async (
      e: IpcMainInvokeEvent,
      draft: ReportDraft,
    ): Promise<{ ok: boolean; path?: string; cancelado?: boolean; motivo?: string }> => {
      if (!platform) return { ok: false, motivo: "La app todavía no arrancó." };

      const ventana = BrowserWindow.fromWebContents(e.sender);
      if (!ventana) return { ok: false, motivo: "No se encontró la ventana." };

      const texto = buildReport({
        device: draft.device,
        resolution: draft.resolution,
        probes: draft.probes,
        license: draft.license,
        watermarked: draft.watermarked,
        licenseEnvelope: null,
      });

      const sugerido = reportFileName(draft.device, draft.resolution.match);
      const r = await dialog.showSaveDialog(ventana, {
        title: "Guardar informe",
        defaultPath: join(app.getPath("documents"), sugerido),
        filters: [{ name: "Informe de texto", extensions: ["txt"] }],
        properties: ["createDirectory", "showOverwriteConfirmation"],
      });

      if (r.canceled || !r.filePath) return { ok: false, cancelado: true };

      try {
        writeFileSync(r.filePath, texto, "utf8");
        return { ok: true, path: r.filePath };
      } catch (err) {
        return {
          ok: false,
          motivo: `No se pudo escribir el archivo: ${err instanceof Error ? err.message : String(err)}`,
        };
      }
    },
  );

  ipcMain.handle(CH.reveal, async (_e: IpcMainInvokeEvent, path: string): Promise<void> => {
    // `showItemInFolder` y no `openPath`: lo que el técnico quiere es ver DÓNDE
    // quedó el informe, no abrirlo. Abrirlo de golpe lo saca de la carpeta
    // donde acaba de guardarlo.
    shell.showItemInFolder(path);
  });
}

/** Cierre ordenado. Lo llama `app.on("before-quit")`. */
export function shutdown(): void {
  pararDeEscuchar?.();
  pararDeEscuchar = null;
  catalog.close();
}
