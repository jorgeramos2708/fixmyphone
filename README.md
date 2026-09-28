# FixMyPhone

Plataforma de diagnóstico, identificación y reparación de dispositivos móviles
para **México**. Corre en Windows, funciona sin internet, y no necesita cuenta
de usuario ni servidor.

El problema que resuelve: en un taller, la pregunta "¿qué equipo es este?" se
responde a ojo, con base de datos de internet y con dos.uuid años de
experiencia. Se responde mal, y la consecuencia no es un error de catálogo: es
un equipo destrozado por una pieza equivocada.

La respuesta de este proyecto es la **variante de placa**, no el modelo
comercial, y cuando hay más de una plausible **no elige por el técnico**.

---

## Qué hay hoy

| | Estado |
|---|---|
| Catálogo de variantes | **750 variantes**, 48,908 alias de número de modelo |
| Escalera de identidad L0–L6 | implementada y probada |
| Diagnóstico por sonda | **17 sondas** de solo lectura, con el comando visible |
| Procedimientos seguros | cadena de verificación por variante (11,043 puertas) |
| Licencias Ed25519 offline | emitir, verificar, atar a equipo |
| App de escritorio (Windows) | **`.exe` compilado y ejecutado** |
| Demo web | mismo código de UI, puente simulado |
| Homologación IFT | **11 `homologado`** con folio, 92 `sin_verificar`, 647 `desconocido` (ver *Lo que falta*) |

### Artefactos

```
apps/desktop/dist/FixMyPhone-0.1.0-x64.exe        instalador NSIS
apps/desktop/dist/FixMyPhone-0.1.0-portable.exe   portable, sin instalar
```

El `.exe` **no está firmado**. Windows SmartScreen va a mostrar "editor
desconocido". Es esperado en esta etapa; firmarlo con Azure Trusted Signing
cuesta ~$99 USD al año y está pendiente de decidir.

### Cómo se revisa lo que se entrega de verdad

Un `.exe` que arranca no significa que la pantalla funcione. En esta etapa no
hay un servidor donde Watchtower pueda mirar, así que la revisión es directa
sobre el binario, y hay una herramienta para eso:

```powershell
# 1. lanzar el binario con el árbol de accesibilidad prendido
apps\desktop\dist\win-unpacked\FixMyPhone.exe --force-renderer-accessibility

# 2. desde otra consola, recorrer las pantallas y volcar lo que ve la gente
powershell -File tools\volcar-ventana.ps1 -Salida Pantallas.txt
```

Sale cada pantalla con sus textos y sus botones, marcando los que están
inhabilitados. Es la única vía para comprobar una app de Electron sin poder
ver capturas. Los comentarios del principio del script explican las tres cosas
que hacen que falle en silencio.

Lo que encontró así, y no se veía de ninguna otra manera: el catálogo entregado
en modo `journal_mode=WAL` (que bajo `Program Files` falla al escribir), el
preload que no cargaba (ventana con el título correcto y `window.fmp`
inexistente), y la etiqueta "Pro" en el menú donde el nivel se llama Premium.

---

## La idea de fondo: el renderer no sabe qué es Electron

`packages/app` es la interfaz completa, y **no importa `electron` en ningún
sitio**. Habla con un contrato, `FmpBridge`, por un objeto que le inyectan:

```
                    packages/app/src/App.tsx
                              |
                    recibe `bridge` por parametro
                    y no sabe de donde sale
                    /                      \
        apps/desktop (Electron)      apps/web-demo (navegador)
        window.fmp, real:             puente simulado, con el
        disco, ADB, SQLite            MISMO catalogo recortado
```

Hay dos implementaciones del contrato y una sola interfaz. Eso es lo que
impide que la demo y el producto se separen con el tiempo: no es una promesa
de equipo, es una restricción del compilador.

Si mañana el `.exe` pesa demasiado, migrar a Tauri toca **un solo archivo**,
el que implementa el contrato en el proceso principal. La interfaz no se
mueve.

### Decisiones que no son obvias

- **El renderer nunca ve Node.** `contextIsolation: true`, `sandbox: true`,
  `nodeIntegration: false`. La única vía hacia el disco es un preload de
  1.7 kB que expone once métodos, uno por canal de IPC. La superficie de
  ataque es ese archivo, y se puede leer de un tirón.
- **SQLite con `node:sqlite` nativo.** Cero dependencias nativas, sin
  `electron-rebuild`, y la base es un archivo que se puede inspeccionar. Se
  abre en solo lectura y **en `journal_mode=DELETE`**, porque en modo WAL
  SQLite necesita escribir un `-shm` *en la carpeta*, y bajo
  `C:\Program Files` eso está prohibido. Ese detalle costó tres commits
  enteros.
- **ADB y fastboot como procesos hijos**, no como biblioteca nativa. Es más
  lento de compilar y mucho más fácil de depurar.
- **Nada de servidor.** La licencia es un archivo firmado. El taller funciona
  sin internet, que en un taller no es un extra.

---

## El catálogo

Cada fila es una **variante de placa**: un codename, un SoC y una lista de
números de modelo. No un modelo comercial.

```bash
npm run db:build     # reconstruye la base desde las fuentes
npm run db:stats     # cobertura por marca, por SoC, huecos
npm run db:verify    # invariantes duros
npm run db:demo      # regenera el recorte de la demo web
```

La unidad de medida del proyecto es `npm test`:

```bash
npm test
#   63  pruebas de catálogo    (ambigüedad, artefacto y la copia de la escalera)
#  151  pruebas de IFT         (alias de marca, homologación, el cruce)
#   52  pruebas de licencia    (casi todas, ataques)
#   15  pruebas de clon        (la CLI en un HOME vacío: lo que hace un recién bajado)
#   42  pruebas de empaquetado (lo que se entrega de verdad)
#   27  pruebas de resolutor   (el resolutor real de platform.ts contra la base real)
```

Estas cifras las verifica `probar-unidad-de-medida.mjs`, que corre cada suite,
lee cuántas comprobaciones declaró y las compara con este bloque: un número
aquí no se escribe a mano, se mide contra lo que la suite reporta.

### Procedencia por dato

Cada variante tiene al menos un registro de procedencia con la fuente y la
fecha de consulta. `db:verify` falla si alguna no lo tiene. Es una
restricción dura: **un dato sin fuente no entra a la base**, se entra como
hueco y se ve en pantalla como "no registrado", que es lo que es.

### Lo que falta

- **Cobertura desigual.** Samsung 133 de 3,426 referencias de LineageOS;
  Motorola 95 de 898; Huawei 9 de 1,550; ZTE 4 de 1,805. Oppo, Vivo y Tecno
  no tienen ninguna variante. No es un bug del pipeline: es que la fuente
  pública de esos equipos no está accesible o no está en formato
  parseable. Cerrarlo requiere encontrar esas fuentes o aceptar que
  la herramienta es fuerte en Samsung/Motorola/Xiaomi y débil en el resto.
- **Homologación IFT: 11 `homologado`, 92 `sin_verificar`, 647 `desconocido`.**
  Se cruzan las tablas por marca (OPPO, Motorola); el padrón central no da
  una tabla. Mientras no cambie, la app lo dice en pantalla en vez de adivinar.
- **Fechas de lanzamiento: 714 de 750.** Las 36 restantes no tienen fecha
  porque la fuente no la trae. Rellenarlas con una fecha inventada sería
  peor que admitir que no se sabe.
- **IMEI/ESN: no se escriben.** Esta herramienta lee, identifica y documenta.
  No modifica identificadores de red, y no se va a añadir.

---

## Licencias

El taller emite su propia licencia con un CLI. No hay servidor, no hay
suscripción, no hay base de datos de clientes.

### Probar el producto completo, ahora mismo

```bash
node packages/licensing/src/cli.ts demo --out demo.fmp
```

Eso emite una licencia **premium de 10 años** firmada con la clave que ya viaja
en el repositorio, que es la misma que lleva el `.exe` dentro. Se activa
pegando el contenido del archivo en la pantalla de Licencia. No hay que
comprar nada ni hablar con nadie.

Para comprobar que la app la acepta, y no solo que la firma cuadra consigo
misma:

```bash
node packages/licensing/src/cli.ts verify demo.fmp --app
```

### Emitir para un taller de verdad

```bash
# una vez: genera la clave del emisor
node packages/licensing/src/cli.ts keygen

# dice si esa clave ya está puesta en la app, o si falta compilarla
node packages/licensing/src/cli.ts public-key

# el taller lee el id de equipo del cliente y emite
node packages/licensing/src/cli.ts machine-id
node packages/licensing/src/cli.ts issue --tier premium \
  --subject "Taller Pérez" --days 365 --out taller.fmp

# el cliente la pega en la pantalla de Licencia
```

**El orden importa, y no es un detalle.** `keygen` crea una clave *nueva*, cuya
parte pública todavía no está en el binario. Si se emite antes de copiarla y
recompilar, las licencias salen firmadas, `verify` dice "Firma válida" y la app
las rechaza como dañadas. El taller ve verde en la terminal y un rechazo en la
pantalla del cliente, que es la peor combinación posible. Por eso:

- `public-key` **avisa** si la clave que tienes no es la que lleva la app
- `verify` **avisa** lo mismo, y con `--app` comprueba contra la clave de la
  app de verdad, sin cambiar nada
- `--key <ruta>` existe para emitir y verificar con una clave concreta

Quien solo quiera probar no necesita nada de esto: `demo` usa la clave del
repositorio y la app la acepta sin recompilar.

### La clave de demostración está publicada, a propósito

`packages/licensing/demo-issuer.key.txt` es la mitad privada del par cuya
mitad pública va embebida en el `.exe`. Está en el repositorio, y el archivo
lleva escrito por qué.

El precio es que **esta build no puede cobrar**: la verificación es offline y
hay una sola clave pública dentro, así que no hay forma de distinguir "esta
licencia me la emitió el taller" de "esta licencia me la emitió el que clonó el
repositorio". Quien tenga ese archivo emite las que quiera, para siempre.

Es una decisión, no un descuido, y está escrita en tres sitios porque es fácil
olvidarla. El archivo dice exactamente qué hacer para pasar a producción:
`keygen`, copiar la clave nueva a `public-key.ts`, recompilar. Las licencias de
demo dejan de aceptarse, que es lo correcto.

| | Gratis | Premium |
|---|---|---|
| Diagnósticos por día | 2 | ilimitados |
| Informe firmado | no | sí |
| Marca de agua en el informe | sí | no |
| Atado a un equipo | opcional | opcional |

**El tope se comprueba en el proceso principal, nunca en la interfaz.** La
interfaz puede mentir; el proceso principal no. Un `.fmp` editado a mano
(cambiar `free` por `premium`, alargar la vigencia) se rechaza porque la firma
no cuadra, y hay 52 pruebas que lo comprueban.

### Sobre la atadura a equipo

Por omisión las licencias son **portátiles**, que es lo que quiere un taller.
Se pueden atar a un equipo concreto, y entonces:

- la huella sale del nombre de la cuenta de Windows y el serial del volumen
- **deja de validar si se reinstala Windows o se renombra la cuenta**
- la pantalla de licencia muestra el número antes de comprarla, para que el
  técnico lo lea en voz alta y el vendedor sepa lo que está vendiendo

Es un costo real, por eso es opcional y por eso se avisa antes de cobrar, no
después.

---

## Desarrollo

```bash
npm install
npm run dev        # app de escritorio con recarga en caliente
npm run dev:web    # demo web en http://localhost:5173
npm run build      # compila todo
npm run dist       # genera el .exe
npm test           # las 88 pruebas
npm run sweep      # busca caracteres CJK colados en el código
```

Requiere **Node 24** (usa `node:sqlite`) y **Python 3** para el pipeline del
catálogo.

### Estructura

```
apps/desktop/        Electron: proceso principal, preload, SQLite, ADB, sondas
apps/web-demo/       la misma UI en el navegador, con puente simulado
packages/app/        la interfaz. Sin electron. Sin platform.
packages/core/       contrato FmpBridge y la escalera de identidad
packages/licensing/  Ed25519 offline: emitir, verificar, atar a equipo
packages/device-db/  pipeline en Python que arma el catálogo
packages/ui/         tokens de diseño, fuente única de verdad
tools/               generadores y las tres suites de pruebas
```

### Doctrina de diseño

En `packages/ui/src/tokens.css`, escrita en el propio archivo. Lo corto:

- un acento por pantalla, máximo dos variantes de tarjeta
- datos técnicos en monoespaciada, con cifras tabulares
- espaciado en la escala 4/8/12/16/24/32; radios de 3/5/8
- **cero animaciones de entrada**; 120–200 ms solo para estado, progreso y éxito
- sin emoji como icono (Lucide, siempre)
- Inter + JetBrains Mono

La razón de fondo: una interfaz que se mueve al aparecer parece una
plantilla. Una que aparece de golpe parece alguien que sabe lo que hace.
