/**
 * Punto de entrada público del renderer.
 *
 * Solo exporta lo que la app comparte. NO exporta ninguna implementación de
 * `FmpBridge`: esas viven en `apps/desktop` (Electron) y en
 * `apps/web-demo` (navegador). Si este archivo las reexportara, el renderer
 * volvería a depender de la plataforma, que es exactamente lo que el
 * contrato evita.
 */

export { App } from "./App";
export { DEMO_CATALOG } from "./data/demo-catalog";
export type { RouteId } from "./components/shell";
