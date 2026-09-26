import { StrictMode, useState } from "react";
import { createRoot } from "react-dom/client";
import { App } from "@fixmyphone/app";
import { createBrowserBridge, SIMULADOS } from "./browser-bridge";
import "@fixmyphone/ui/tokens.css";
import "./demo.css";

const bridge = createBrowserBridge();

/**
 * Selector de equipo simulado.
 *
 * Vive FUERA de la app a propósito. Es un artefacto de la DEMO, no del
 * producto: en el `.exe` no hay nada equivalente porque el equipo está ahí de
 * verdad. Meterlo dentro de la app sería ensuciar el producto con una
 * necesidad de la demo.
 *
 * Incluye a propósito un equipo que NO está en el catálogo, para poder ver
 * cómo se comporta la herramienta cuando no sabe. Esa es la parte honesta de
 * la demo: la mitad de las herramientas de reparación hacen exactamente lo
 * contrario.
 */
function SimPicker() {
  // `SIMULADOS[0]` es el equipo de arranque. El array es una constante del
  // módulo, así que el primer elemento existe siempre; el `?? ""` está para que
  // un cambio futuro que lo deje vacío no rompa el typecheck.
  const [id, setId] = useState(SIMULADOS[0]?.id ?? "");
  const activa = SIMULADOS.find((s) => s.id === id);

  return (
    <div className="pointer-events-auto fixed bottom-11 left-3 z-50 w-[420px] rounded-lg border border-border-strong bg-surface-2 shadow-xl">
      <div className="flex items-center gap-2 px-3 py-2">
        <span className="tech-label shrink-0">Equipo simulado</span>
        <select
          value={id}
          onChange={(e) => {
            setId(e.target.value);
            bridge.setSim(e.target.value);
          }}
          className="min-w-0 flex-1 rounded-sm border border-border bg-bg px-2 py-1 text-small text-text focus:border-brand focus:outline-none"
        >
          {SIMULADOS.map((s) => (
            <option key={s.id} value={s.id}>
              {s.label}
            </option>
          ))}
        </select>
      </div>
      {activa ? (
        <p className="border-t border-border px-3 py-2 text-caption text-text-faint">
          {activa.note}
        </p>
      ) : null}
    </div>
  );
}

/**
 * Monta la raiz, reutilizandola si el modulo ya se ejecutó.
 *
 * Sin esto, cada recarga en caliente por HMR vuelve a llamar a `createRoot`
 * sobre el mismo contenedor, React protesta ("createRoot() on a container that
 * has already been passed to createRoot") y la pagina se recarga entera. Se
 * pierde el estado, que en una app donde se está viendo un informe es justo lo
 * que no quieres perder mientras ajustas un estilo.
 *
 * Guardar la raiz en `globalThis` es el patron que recomienda React para este
 * caso, y ademas permite montar en dos modos distintos en el mismo documento
 * sin pelearse.
 */
const contenedor = document.getElementById("root")!;
const raizGlobal = globalThis as { __fmpRaiz?: ReturnType<typeof createRoot> };
const raiz = (raizGlobal.__fmpRaiz ??= createRoot(contenedor));

raiz.render(
  <StrictMode>
    <App bridge={bridge} />
    <SimPicker />
  </StrictMode>,
);
