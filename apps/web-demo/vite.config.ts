import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { fileURLToPath } from "node:url";

/**
 * Configuración de la demo web.
 *
 * Lo importante: `@fixmyphone/app`, `@fixmyphone/core` y `@fixmyphone/ui` se
 * resuelven por código FUENTE, no por un paquete compilado. Es lo que
 * garantiza que la demo y el `.exe` ejecuten literalmente el mismo código de
 * interfaz. Si la demo usara una versión publicada de la app, dejarían de ser
 * lo mismo en cuanto una de las dos cambiara.
 */
export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: [
      { find: /^@fixmyphone\/app$/, replacement: fileURLToPath(new URL("../../packages/app/src/main.tsx", import.meta.url)) },
      { find: /^@fixmyphone\/app\/(.*)$/, replacement: fileURLToPath(new URL("../../packages/app/src", import.meta.url)) + "/$1" },
      { find: /^@fixmyphone\/core$/, replacement: fileURLToPath(new URL("../../packages/core/src/bridge.ts", import.meta.url)) },
      { find: /^@fixmyphone\/ui\/tokens\.css$/, replacement: fileURLToPath(new URL("../../packages/ui/src/tokens.css", import.meta.url)) },
    ],
  },
  server: { port: 5173, strictPort: true },
  build: { outDir: "dist", emptyOutDir: true },
});
