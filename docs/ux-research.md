# Investigación de diseño de interfaz

Notas de trabajo, 26 de septiembre de 2026. No es una guía de estilo: es el
registro de qué se miró, qué se descartó y por qué. Las decisiones que
sobrevivieron están escritas en `packages/ui/src/tokens.css`, que es la fuente
única de verdad; este documento explica cómo se llegaron a ellas.

---

## El problema de partida

La primera versión de la interfaz se veía como se ven las interfaces que hace
un modelo de lenguaje: correcta en todo y genérica en todo. No era fea. Era
*inevitable*. Y ahí está el problema, porque un producto que se ve inevitable
no se recuerda.

La pregunta que se puso al frente de todo lo demás:

> ¿Qué tendría que haber pasado en el taller para que alguien escribiera
> estas líneas de código?

Esa pregunta decide cosas que una lista de buenas prácticas no decide. Por
ejemplo: los datos técnicos van en monoespaciada porque el técnico los va a
**leer en voz alta mientras el cliente mira la pantalla**. No porque la
monoespaciada "se vea mejor con datos".

---

## Qué se miró

| Fuente | Qué se sacó | Qué se descartó |
|---|---|---|
| Herramientas de Repair en linhaOS (TWRP, OrangeFox) | un técnico lee propiedades de `getprop` en crudo, y espera hacerlo | el aspecto visual entero: es HTML de 2012 |
| Android Debug Bridge, salida de `adb shell` | la tabla de propiedades es el objeto central de la app, no un detalle | — |
| 21st.dev | generadores de tarjetas y tablas | **todo el layout.** Ver abajo |
| GitHub, apps de escritorio similares (Device Info, AIDA64) | la densidad de información es correcta; los valores técnicos en columna fija | los adornos: anillos de progreso, degradados, sombras largas |
| Figma Community | escala de espaciado y radios consistentes | inaccesible a bots (403); se resolvió con el criterio propio |

### Sobre 21st.dev y los generadores

Se generaron componentes y **se reescribieron casi todos**. De cada diez
generados, uno sobrevivía, y ese uno nunca se usaba tal cual.

El filtro era del 90 %, y la regla que resultó más útil:

> **Nunca generar layout. Siempre generar un componente y reescribirlo.**

Un generador propone una composición de pantalla completa porque no sabe qué
dato va en cada lugar. El resultado tiene jerarquía de mercadotecnia: todos los
bloques compiten y el ojo no encuentra el bueno.
La versión final de la app tiene cuatro columnas y una barra lateral fija, y eso
no salió de ningún generador. Salió de sentarse a pensar dónde se para el
La versión final de la app tiene cuatro columnas y una barra lateral fija, y eso
no salió de ningún generador. Salió de sentarse a pensar dónde se para el
técnico: con el equipo en una mano y la pantalla en la otra.

## Las decisiones, y por qué

### 1. Un acento por pantalla

Ocurre por una razón concreta: el ojo va al elemento con color saturado, y si
hay tres, no va a ninguno.

En la pantalla de Licencia el acento es el nivel (Premium/Gratis). El número
de equipo es el dato más importante de la pantalla y **no** lleva color: lleva
monoespaciada. Se scapa de la regla del acento porque no es una promoción, es
un dato.

### 2. Cero animaciones de entrada

Es la regla que más seHornseyó al principio. Una tarjeta que aparece
deslizándose dice "esto se generó". Una que aparece de golpe dice "esto lo
hizo alguien".

Quedan animaciones solo para tres cosas, y todas 120–200 ms:

- cambio de estado (el diagnóstico avanza)
- progreso (las sondas, una a una)
- éxito (la verificación)

Ninguna de las tres es decorativa: las tres comunican que la app está
trabajando. Fuera de eso, la interfaz no se mueve.

### 3. Escala de espaciado fija: 4 / 8 / 12 / 16 / 24 / 32

No porque suene a sistema. Porque el técnico mira la pantalla con un
cronómetro de por medio, y la inconsistencia en los espacios se lee como
"esto se armó con prisa" aunque no sepa explicar por qué.

Radios: 3 px para lo pequeño, 5 px para tarjetas, 8 px para contenedores
grandes. Tres valores. Un cuarto Radio empieza a leerse como "estilo", y no lo
es.

### 4. Cifras tabulares siempre

`font-variant-numeric: tabular-nums` en todo dato numérico. Sin esto, una
columna de números baila al actualizarse, y un valor que baila parece
inestable aunque sea cierto.

### 5. Sin emoji como icono

Cero excepciones. Lucide en todo, con `strokeWidth` explícito: 1.75 para
iconos decorativos, 2.25–2.5 para los que significan algo (un check verde, una
X roja). El grosor de trazo es jerarquía, igual que el tamaño.

Los emoji además tienen un problema que no es estético: se ven distintos en
cada máquina Windows según la fuente instalada. En una app que se distribuye
como `.exe` a talleres con equipos viejos, un icono que cambia de forma según
el equipo es un icono que no es un icono.

### 6. Fuentes

**Inter** para interfaz, **JetBrains Mono** para datos técnicos. Se.choice
entre ellos no es una preferencia: los dos son libres, sin licencias de
pago, y los dos se leen bien a 1080p, que es donde se va a usar esto.
donde se va a usar esto.

Mono en todo lo que se pueda copiar y pegar a un ticket de trabajo, porque
un `SM-G950F` pegado en un correo a un compañero tiene que seguir siendo
legible.

---

## Qué NO se hizo, y está bien

**No hay Modo oscuro / claro con un conmutador.** Habría que decidir un
contraste por superficie, y es trabajo real sin valor para un técnico que
trabaja en un taller con la luz encendida. El tema oscuro se queda fijo.

**No hay sonido ni animaciones de éxito decorativas.** Un informe que se
firma no necesita confeti.

**No hay pantalla de bienvenida.** La app abre en Equipo, que es donde empieza
el trabajo. Una pantalla de bienvenida con logo es lo primero que se ve y lo
último que se recuerda.

**No hay tour de las pantallas.** Un técnico no lee tours; busca el botón. Las
pistas están donde se va a necesitar, en la pantalla donde se va a necesitar.

---

## Verificación

El `.exe` es Electron, y su interfaz se puede leer desde fuera por
accesibilidad. Eso permite comprobar el texto que se ve de verdad, sin
capturas de pantalla y sin adivinar:

```powershell
# Lanzar con el árbol de accesibilidad expuesto
$env:ELECTRON_ENABLE_LOGGING = "1"
.\apps\desktop\dist\win-unpacked\FixMyPhone.exe --force-renderer-accessibility

# Y leer los nodos con nombre
Add-Type -AssemblyName UIAutomationClient
```

Se usó para confirmar que la pantalla de Licencia muestra el identificador de
equipo, y que coincide dígito a dígito con lo que imprime
`fmp-license machine-id`. Un número que se teclea por teléfono tiene que ser
el mismo en los dos lados, y esa es exactamente la clase de cosa que no se
comprueba mirando el código.

Dos "defectos" que se reportaron en una revisión anterior resultaron ser
**falsos positivos**, y conviene dejarlos escritos para no volver a
perseguirlos:

- `border-radius: 9999px` se serializa como `2.23696e+07px` porque el
  navegador lo calcula como `calc(infinity * 1px)`. No es un píxel de radio
  gigante, es radio infinito, que es lo que se pidió.
- el color de texto **sí** se aplica en el contenedor raíz. Se veía sin
  aplicar porque se miraba un nodo hijo que hereda.

Comprobar el efecto computado con `getComputedStyle` no es lo mismo que
comprobar si una utilidad de Tailwind existe. La primera pregunta da datos;
la segunda necesita el CSS fuente.
