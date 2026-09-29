/**
 * Handlers de IPC.
 * ===========================================================================
 *
 * Un handler por canal, sin canal genérico. El preload declara una vez los
 * canales; aquí se responde exactamente a esos, ni uno más ni uno menos. Si
 * alguien agrega un handler sin tocar el preload, el renderer no lo puede
 * alcanzar: la superficie de ataque es el preload, no este archivo.
 *
 * Este archivo sí importa `electron`, porque necesita ventanas y diálogos. La
 * lógica de dominio NO está aquí: vive en `platform.ts`, que se puede probar
 * sin arrancar nada. Aquí solo se traduce entre IPC y dominio.
 */

import { BrowserWindow, dialog, ipcMain, shell, app, type IpcMainInvokeEvent } from "electron";
import { writeFileSync } from "node:fs";
import { join } from "node:path";
import { bytesToPrivateKey, publicKeyFrom, publicKeyToBytes } from "@fixmyphone/licensing";
import { keyFingerprint, reportLicense, signReport } from "@fixmyphone/licensing/report-signature";
import type {
  ConnectedDevice,
  LicenseEnvelope,
  LicenseState,
  ProbeResult,
  RawDeviceProps,
  ReportDraft,
  Resolution,
  SaveReportResult,
  TransportKind,
  DeviceVariant,
} from "@fixmyphone/core";
import { listDevices, toolsAvailable, watchDevices } from "./adb.js";
import { Catalog, CatalogUnavailable, locateCatalog } from "./catalog.js";
import { Platform } from "./platform.js";
import { buildReport, reportFileName } from "./report.js";
import { runAllProbes } from "./probes.js";
import type { SigningKeyInfo } from "./signing-key.js";

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
  installKey: "fmp:install-key",
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
    ): Promise<SaveReportResult> => {
      if (!platform) return { ok: false, motivo: "La app todavía no arrancó." };

      const ventana = BrowserWindow.fromWebContents(e.sender);
      if (!ventana) return { ok: false, motivo: "No se encontró la ventana." };

      // --- Estado real, no el que dice el renderer -------------------------
      //
      // `draft.license` viene del renderer, y el renderer es código que se
      // puede editar. Si el nivel y la marca de agua se decidieran ahí, el
      // bloqueo del plan gratuito sería una sugerencia: basta con abrir las
      // herramientas de desarrollo y mandar un draft con `watermarked: false`.
      // Es el mismo argumento por el que el tope de diagnósticos se comprueba
      // en el proceso principal, y va aquí también porque este es el otro
      // momento donde el cobro está en juego.
      const estado = platform.licenseCurrent();
      const premium = estado.valid && estado.tier === "premium";
      const sobre = platform.licenseEnvelope();

      const texto = buildReport({
        device: draft.device,
        resolution: draft.resolution,
        probes: draft.probes,
        license: estado,
        watermarked: !premium,
        licenseEnvelope: sobre,
      });

      // --- Firma, solo en premium ------------------------------------------
      //
      // Se firma AQUÍ, en el proceso principal, y no en la pantalla. La misma
      // razón de antes: si el renderer decidiera si firma, un plan gratuito
      // podría pedir que le firmaran el informe.
      let firmado = false;
      let kid = "";
      let aviso: string | undefined;
      let salida = texto;

      if (premium) {
        try {
          const par = platform.signingKeyPair();
          const publica = publicKeyToBytes(publicKeyFrom(bytesToPrivateKey(par.privateKey)));
          kid = keyFingerprint(publica);
          salida = signReport(texto, {
            privateKey: par.privateKey,
            tool: `FixMyPhone ${process.env.npm_package_version ?? "0.1.0"}`,
            license: reportLicense(sobre, estado.tier, estado.subject ?? "sin titular"),
          });
          firmado = true;
        } catch (err) {
          // El técnico tiene el informe delante y el cliente esperando. Un
          // fallo al firmar NO le quita el informe: se guarda sin firma y se
          // avisa, porque un informe sin firma es un informe sin firma
          // (dicho en el archivo, en la pantalla y en el motivo de abajo), no
          // un informe que promete una firma que no tiene.
          firmado = false;
          kid = "";
          aviso =
            `El informe se guardó SIN FIRMA: no se pudo firmar en esta máquina ` +
            `(${err instanceof Error ? err.message : String(err)}). Cuéntaselo al ` +
            `cliente: un informe sin firma no se puede comprobar.`;
        }
      }

      const sugerido = reportFileName(draft.device, draft.resolution.match);
      const r = await dialog.showSaveDialog(ventana, {
        title: "Guardar informe",
        defaultPath: join(app.getPath("documents"), sugerido),
        filters: [{ name: "Informe de texto", extensions: ["txt"] }],
        properties: ["createDirectory", "showOverwriteConfirmation"],
      });

      if (r.canceled || !r.filePath) return { ok: false, cancelado: true };

      try {
        writeFileSync(r.filePath, salida, "utf8");
        return { ok: true, path: r.filePath, firmado, kid, aviso };
      } catch (err) {
        return {
          ok: false,
          motivo: `No se pudo escribir el archivo: ${err instanceof Error ? err.message : String(err)}`,
        };
      }
    },
  );

  // --- Identidad de firma de la instalación -------------------------------
  //
  // Va como canal aparte y no pegado al informe porque el técnico lo necesita
  // ANTES de exportar: es el número que va a poner en la factura y en el
  // recibo, para que el cliente pueda pedir la comprobación de la firma con
  // su huella y no con la que trae el archivo.
  ipcMain.handle(CH.installKey, (): SigningKeyInfo => {
    return platform ? platform.signingKey() : { kid: "", publicKey: "", existe: false };
  });

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
