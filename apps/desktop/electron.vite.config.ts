import { defineConfig } from "electron-vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { fileURLToPath } from "node:url";

/**
 * Configuracion de la app de escritorio.
 *
 * Mismos alias por codigo fuente que la demo web. Esa simetria NO es
 * estetica: es la que hace imposible que el `.exe` y la demo se desincronicen.
 * Si un dia divergieran, el bug apareceria en la demo y no en el producto, que
 * es donde menos se nota.
 */

/**
 * Alias por codigo fuente, compartidos por los tres builds.
 *
 * Se escriben como alias y no como dependencias porque los paquetes de este
 * monorepo apuntan su `main` a un archivo `.ts`. Si se dejaran como
 * dependencias, electron-vite los externaliza y el bundle acaba haciendo
 * `require("@fixmyphone/core")` en tiempo de ejecucion, contra un `.ts` que
 * Electron no sabe leer. Con los alias, el codigo entra al bundle.
 */
const alias = [
  {
    find: /^@fixmyphone\/core$/,
    replacement: fileURLToPath(new URL("../../packages/core/src/bridge.ts", import.meta.url)),
  },
  {
    find: /^@fixmyphone\/licensing$/,
    replacement: fileURLToPath(new URL("../../packages/licensing/src/index.ts", import.meta.url)),
  },
  {
    // `machine` va aparte y NO como `/machine` dentro del anterior, porque el
    // anterior esta anclado con `$` y no lo captura. Va antes que el de
    // `@fixmyphone/app`, aunque no chocarian, para que quede claro el orden en
    // que se resuelve el arbol de alias.
    find: /^@fixmyphone\/licensing\/machine$/,
    replacement: fileURLToPath(new URL("../../packages/licensing/src/machine.ts", import.meta.url)),
  },
  {
    find: /^@fixmyphone\/app$/,
    replacement: fileURLToPath(new URL("../../packages/app/src/main.tsx", import.meta.url)),
  },
  {
    find: /^@fixmyphone\/app\/(.*)$/,
    replacement: fileURLToPath(new URL("../../packages/app/src", import.meta.url)) + "/$1",
  },
  {
    find: /^@fixmyphone\/ui\/tokens\.css$/,
    replacement: fileURLToPath(new URL("../../packages/ui/src/tokens.css", import.meta.url)),
  },
];

export default defineConfig({
  main: {
    resolve: { alias },
    build: {
      // `node:sqlite` viene con el runtime de Node, no se empaqueta. Declararlo
      // externo evita que rollup intente resolverlo y falle.
      rollupOptions: { external: ["electron", "node:sqlite"] },
    },
  },
  preload: {
    build: {
      rollupOptions: { external: ["electron"] },
    },
  },
  renderer: {
    root: fileURLToPath(new URL("../../packages/app", import.meta.url)),
    resolve: { alias },
    plugins: [react(), tailwindcss()],
    build: {
      // electron-vite NO minifica el renderer por defecto. Sin esto el bundle
      // sale con la build de desarrollo de React dentro: 711 kB en vez de unos
      // 200, y con avisos de desarrollo que el tecnico ve en la consola y no
      // sabe que son. Se fija a proposito, para que no dependa del valor por
      // defecto de la version instalada.
      //
      // Sin `manualChunks` a proposito: separar React "para la cache" tiene
      // sentido en una web y ninguno en una app que lee de disco. Aqui solo
      // anadiria una peticion mas para una cache que no existe.
      minify: "esbuild",
      sourcemap: false,
      rollupOptions: {
        input: fileURLToPath(new URL("../../packages/app/index.html", import.meta.url)),
      },
    },
  },
});
