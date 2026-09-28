/**
 * Punto de entrada del renderer de ESCRITORIO.
 *
 * Monta la app con el puente que el preload inyectó en `window.fmp`. No
 * importa nada de Electron: si lo hiciera, este archivo no podría compilarse
 * para el navegador, y con él se perdería la garantía de que ambas
 * superficies ejecutan el mismo código.
 *
 * El gemelo de este archivo es `apps/web-demo/src/main.tsx`, que monta la
 * MISMA `App` con un puente simulado. Los dos tienen tres líneas. Esa
 * simetría es el producto.
 */

import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { App } from "./App";
import type { FmpBridge } from "@fixmyphone/core";
import "@fixmyphone/ui/tokens.css";

const bridge = (window as unknown as { fmp: FmpBridge }).fmp;

if (!bridge) {
  // Si el preload falló, la app no puede funcionar. Decirlo claro es mejor
  // que renderizar una pantalla en blanco que el técnico no sabe leer.
  document.getElementById("root")!.innerHTML =
    '<div style="font:14px system-ui;color:#1e293b;background:#f1f4f9;' +
    'height:100vh;display:grid;place-items:center;text-align:center;padding:2rem">' +
    "<div><p style='font-size:20px;font-weight:600;margin:0 0 8px'>No se pudo iniciar FixMyPhone</p>" +
    "<p style='color:#50627a;margin:0'>El puente con el proceso principal no está disponible.<br>" +
    "Reinstala la aplicación y vuelve a abrirla.</p></div></div>";
} else {
  // La raiz se guarda en `globalThis` para que una recarga en caliente no
  // vuelva a llamar a `createRoot` sobre el mismo contenedor. Sin esto, en
  // `npm run dev` cualquier guardado de un `.css` reinicia la app y se pierde
  // el informe que estabas viendo.
  const raizGlobal = globalThis as { __fmpRaiz?: ReturnType<typeof createRoot> };
  const raiz = (raizGlobal.__fmpRaiz ??= createRoot(document.getElementById("root")!));

  raiz.render(
    <StrictMode>
      <App bridge={bridge} />
    </StrictMode>,
  );
}
