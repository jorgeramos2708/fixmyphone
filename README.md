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
| Catálogo de variantes | **734 variantes**, 48,908 alias de número de modelo |
| Escalera de identidad L0–L6 | implementada y probada |
| Diagnóstico por sonda | **17 sondas** de solo lectura, con el comando visible |
| Procedimientos seguros | cadena de verificación por variante (11,043 puertas) |
| Licencias Ed25519 offline | emitir, verificar, atar a equipo |
| App de escritorio (Windows) | **`.exe` compilado y ejecutado** |
| Demo web | mismo código de UI, puente simulado |
| Homologación IFT | `desconocido` en todas las variantes (ver *Lo que falta*) |

### Artefactos

```
apps/desktop/dist/FixMyPhone-0.1.0-x64.exe        instalador NSIS
apps/desktop/dist/FixMyPhone-0.1.0-portable.exe   portable, sin instalar
```

El `.exe` **no está firmado**. Windows SmartScreen va a mostrar "editor
desconocido". Es esperado en esta etapa; firmarlo con Azure Trusted Signing
cuesta ~$99 USD al año y está pendiente de decidir.

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
#   16  pruebas de catálogo  (la escalera, la ambigüedad, el artefacto)
#   52  pruebas de licencia  (casi todas, ataques)
#   20  pruebas de empaquetado (lo que se entrega de verdad)
```

### Procedencia por dato

Cada variante tiene al menos un registro de procedencia con la fuente y la
fecha de consulta. `db:verify` falla si alguna no lo tiene. Es una
restricción dura: **un dato sin fuente no entra a la base**, se entra como
hueco y se ve en pantalla como "no registrado", que es lo que es.

### Lo que falta

- **Cobertura desigual.** Samsung 117 de 3,426 referencias de LineageOS;
  Motorola 95 de 898; Huawei 9 de 1,550; ZTE 4 de 1,805. Oppo, Vivo y Tecno
  no tienen ninguna variante. No es un bug del pipeline: es que la fuente
  pública de esos equipos no está accessible o no está en formato
  parseable. Cerrarlo requiere Either encontrar esas fuentes o aceptar que
  la herramienta es fuerte en Samsung/Motorola/Xiaomi y débil en el resto.
- **Homologación IFT: `desconocido` en las 734.** No hay fuente pública
  consultable. Mientras sea así, la app lo dice en pantalla en vez de
  adivinar.
- **Fechas de lanzamiento: 698 de 734.** Las 36 restantes no tienen fecha
  porque la fuente no la trae. Rellenarlas con una fecha inventada sería
  peor que admitir que no se sabe.
- **IMEI/ESN: no se escriben.** Esta herramienta lee, identifica y documenta.
  No modifica identificadores de red, y no se va a añadir.

---

## Licencias

El taller emite su propia licencia con un CLI. No hay servidor, no hay
suscripción, no hay base de datos de clientes.

```bash
# una vez, genera la clave del emisor
node packages/licensing/src/cli.ts keygen

# el taller lee el id de equipo del cliente y emite
node packages/licensing/src/cli.ts machine-id
node packages/licensing/src/cli.ts issue --tier premium \
  --subject "Taller Pérez" --days 365 --out taller.fmp

# el cliente la pega en la pantalla de Licencia, o así:
fmp-license verify taller.fmp
```

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
