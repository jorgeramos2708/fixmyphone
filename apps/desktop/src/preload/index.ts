/**
 * Preload: el puente entre el renderer y el proceso principal.
 * ===========================================================================
 *
 * Este archivo es la FRONTERA DE SEGURIDAD del producto. Todo lo que el
 * renderer puede hacer en el sistema pasa por las funciones que declara aquí.
 *
 * Reglas que se respetan sin excepción:
 *   - Una función por capacidad, con nombre explícito. Nada de
 *     `invoke(canal, ...args)` genérico: si existiera, el renderer podría
 *     llamar a cualquier handler de IPC.
 *   - Solo se expone `FmpBridge`. No se expone `ipcRenderer` completo.
 *   - Los datos cruzan como valores planos (el IPC de Electron los clona), no
 *     como referencias a objetos del proceso principal.
 */

import { contextBridge, ipcRenderer } from "electron";
import type { FmpBridge, ProbeResult } from "@fixmyphone/core";

/** Canales. Se declaran aquí y en el main para que no puedan divergir. */
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

const bridge: FmpBridge = {
  platform: "electron",
  version: process.env.npm_package_version ?? "0.1.0",

  onDevice(cb) {
    // Se reenvía el evento al renderer. El `off` se registra con la misma
    // función: sin eso, cada montaje de la app dejaría un oyente fantasma
    // acumulándose en el proceso principal.
    const listener = (_e: unknown, devices: unknown) => cb(devices as never);
    ipcRenderer.on(CH.onDevice, listener);
    return () => ipcRenderer.off(CH.onDevice, listener);
  },

  listDevices: () => ipcRenderer.invoke(CH.listDevices),
  resolve: (props, transport) => ipcRenderer.invoke(CH.resolve, props, transport),
  lookupByModelNumber: (m) => ipcRenderer.invoke(CH.lookupModel, m),

  runProbes(deviceId, onProgress) {
    const listener = (_e: unknown, r: unknown) => onProgress(r as ProbeResult);
    ipcRenderer.on(CH.probeProgress, listener);
    // La promesa se resuelve cuando el main terminó todas las sondas.
    return ipcRenderer.invoke(CH.runProbes, deviceId).finally(() => {
      ipcRenderer.off(CH.probeProgress, listener);
    });
  },

  license: {
    current: () => ipcRenderer.invoke(CH.licenseCurrent),
    activate: (env) => ipcRenderer.invoke(CH.licenseActivate, env),
    loadFromDisk: () => ipcRenderer.invoke(CH.licenseFromDisk),
  },

  saveReport: (draft) => ipcRenderer.invoke(CH.saveReport, draft),
  installKey: () => ipcRenderer.invoke(CH.installKey),
  reveal: (path) => ipcRenderer.invoke(CH.reveal, path),
};

contextBridge.exposeInMainWorld("fmp", bridge);
