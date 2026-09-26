/**
 * Proceso principal de Electron.
 * ===========================================================================
 *
 * Responsabilidades, y solo estas:
 *   - abrir la ventana
 *   - exponer el puente por IPC
 *   - apagar y cerrar bien
 *
 * NO hace lógica de negocio. Toda la lógica de dominio vive en
 * `packages/core` y en `bridge.ts` (este mismo proceso, pero separado), para
 * que se pueda probar sin arrancar una ventana.
 *
 *Dos decisiones que parecen detalles y no lo son:
 *
 * 1. `sandbox: true`. El renderer no tiene acceso a Node. Es la diferencia
 *    entre que un XSS en la interfaz pueda leer el disco del taller y que no
 *    pueda. No hay excusa para desactivarlo.
 *
 * 2. `contextIsolation: true` + un preload mínimo. La única vía entre la
 *    interfaz y el disco es `window.fmp`, que es explícito y auditable.
 */

import { app, BrowserWindow, shell, ipcMain, dialog } from "electron";
import { fileURLToPath } from "node:url";
import { existsSync } from "node:fs";
import { registerIpc, shutdown } from "./ipc.js";

const DEV_URL = process.env.ELECTRON_RENDERER_URL;

const PRELOAD = fileURLToPath(new URL("../preload/index.js", import.meta.url));

/**
 * Se comprueba que el preload exista ANTES de abrir la ventana.
 *
 * Electron no se queja cuando el preload no existe. Abre la ventana, la
 * muestra, le pone el titulo correcto y sigue como si nada, con el renderer
 * sin `window.fmp`. La app se ve bien y no hace nada, que es el peor sintoma
 * posible: uno que parece de software.
 *
 * Pasa de verdad con esta app, por una extension: el `webPreferences.preload`
 * apuntaba a `index.mjs` y electron-vite emite `index.js`. Siguio tres commits
 * sin que nadie lo notara, porque el `.exe` estaba compilado y la ventana
 * abria.
 *
 * Aqui se comprueba el archivo de verdad y, si no esta, se dice con un dialogo
 * que nombra la ruta. Un dialogo en pantalla es lo que de verdad detiene a
 * alguien; una linea en stderr solo la lee quien ya estaba buscando.
 */
function exigirPreload(): void {
  if (existsSync(PRELOAD)) return;

  const mensaje =
    `No se encontro el script de puente:\n\n${PRELOAD}\n\n` +
    "La app se instalo incompleta. Vuelve a instalar el programa.";
  console.error(`[fmp] preload ausente: ${PRELOAD}`);
  dialog.showErrorBox("FixMyPhone", mensaje);
  throw new Error(`preload ausente: ${PRELOAD}`);
}

/** Una sola ventana. La app es de una sola tarea: no tiene sentido más. */
let win: BrowserWindow | null = null;

function createWindow(): void {
  win = new BrowserWindow({
    width: 1440,
    height: 900,
    // 1120x720 es el mínimo cómodo para las tres columnas. Por debajo de eso
    // la tabla de propiedades se corta y el técnico tiene que maximizar a
    // mano, que es exactamente la fricción que hay que quitar.
    minWidth: 1120,
    minHeight: 720,
    show: false,
    backgroundColor: "#0b1120", // igual a --color-bg: sin destello blanco al abrir
    titleBarStyle: "default",
    autoHideMenuBar: true,
    webPreferences: {
      preload: PRELOAD,
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
    },
  });

  // Se muestra al pintar, no al crear. Una ventana que aparece antes de tener
  // contenido parece más rápida pero se siente más lenta.
  win.once("ready-to-show", () => win?.show());

  // Los enlaces externos se abren en el navegador del sistema, nunca dentro
  // de la app. Un `window.open` interno convertiría la app en un navegador con
  // permisos de escritorio.
  win.webContents.setWindowOpenHandler(({ url }) => {
    void shell.openExternal(url);
    return { action: "deny" };
  });

  // Rechaza navegación: la app no es un navegador. Si algo intenta
  // redirigirla fuera, es un bug o un ataque.
  win.webContents.on("will-navigate", (e) => e.preventDefault());

  if (DEV_URL) {
    void win.loadURL(DEV_URL);
  } else {
    void win.loadFile(fileURLToPath(new URL("../renderer/index.html", import.meta.url)));
  }

  win.on("closed", () => {
    win = null;
  });
}

// Una instancia por máquina. Dos copias escribiendo la misma licencia desde
// el mismo disco es una forma corta de corromperla.
if (!app.requestSingleInstanceLock()) {
  app.quit();
} else {
  app.on("second-instance", () => {
    if (win) {
      if (win.isMinimized()) win.restore();
      win.focus();
    }
  });

  void app.whenReady().then(() => {
    // Antes que registrar nada. Un preload ausente significa que el renderer
    // no va a poder llamar a nada, y fallar aqui con un dialogo es mejor que
    // abrir una ventana que parece operativa y no responde a nada.
    exigirPreload();
    registerIpc(ipcMain);
    createWindow();

    app.on("activate", () => {
      // macOS: clic en el icono con la ventana cerrada la reabre.
      if (BrowserWindow.getAllWindows().length === 0) createWindow();
    });
  });
}

app.on("before-quit", () => {
  // El watcher de ADB es un proceso hijo. Si la app cierra sin matarlo, se
  // quedan `adb track-devices` huérfanos, uno por cada vez que se abrió el
  // programa durante el día.
  shutdown();
});

app.on("window-all-closed", () => {
  // En macOS la app convencionalmente sigue viva sin ventanas. En Windows no.
  if (process.platform !== "darwin") app.quit();
});
