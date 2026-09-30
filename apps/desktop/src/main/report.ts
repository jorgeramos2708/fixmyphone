/**
 * Generación del informe.
 * ===========================================================================
 *
 * El informe es un archivo de TEXTO PLANO, no un PDF ni un HTML. No es una
 * limitación, es una decisión:
 *
 *   - Se abre en el bloc de notas de cualquier Windows del taller, sin
 *     instalar nada. Un técnico con un equipo de 2015 y un Windows sin
 *     updates abre el informe igual.
 *   - Se puede pegar en un correo, en un ticket, en un chat de WhatsApp con el
 *     cliente, sin que pierda el formato.
 *   - Se puede guardar como evidencia en el expediente del taller, y dentro de
 *     de cinco años se sigue leyendo igual. Un PDF generado por una versión
 *     vieja de una librería puede no abrirse.
 *
 * Y hay una razón de seguridad: un archivo de texto no ejecuta nada. Un informe
 * que se abre en el equipo del cliente es un archivo que el cliente podría
 * abrir también; conviene que no pueda hacer nada.
 *
 * REDACCIÓN DE DATOS PERSONALES
 * -----------------------------
 * El IMEI y el MEID son identificadores personales bajo la LFPI. El informe los
 * incluye SIEMPRE enmascarados, sin importar el nivel de licencia: en el
 * premium se muestra el prefijo TAC, que es lo que sirve para saber qué equipo
 * es, y nada más. El técnico que necesite el número completo lo lee en el
 * equipo, con `adb shell getprop ril.IMEI`, y no lo deja por escrito en un
 * archivo que después se pierde.
 */

import type {
  ConnectedDevice,
  LicenseState,
  ProbeResult,
  RawDeviceProps,
  Resolution,
} from "@fixmyphone/core";
import {
  avisoFirmaDescarga,
  esDesbloqueoGenerico,
  has,
  ORDEN_RECETA,
  PARTICION_RECOVERY,
  partitionScheme,
  preRequisito,
  recetaPresente,
  riesgosDe,
  TOOLTIP_HOMOLOGACION,
} from "@fixmyphone/core";
import { licenseId } from "@fixmyphone/licensing";

export interface ReportInput {
  device: ConnectedDevice;
  resolution: Resolution;
  probes: ProbeResult[];
  license: LicenseState;
  watermarked: boolean;
  /** Base64url de la licencia activa, si la hay. Va en el informe. */
  licenseEnvelope?: { payload: string; signature: string } | null;
}

const MARCA_AGUA = [
  "================================================================",
  "  INFORME DE DEMOSTRACION - PLAN GRATUITO",
  "  Este informe fue generado con FixMyPhone sin licencia",
  "  premium. Es un archivo de prueba: no es válido como",
  "  evidencia de un trabajo de reparacion.",
  "================================================================",
];

/**
 * Enmascara un identificador de 14 o 15 dígitos.
 *
 * Se conservan los primeros 6 (el prefijo TAC, que identifica al fabricante y
 * al modelo) y se reemplazan el resto. 6 de 15 es el máximo que sigue siendo
 * útil sin identificar la unidad concreta.
 */
function enmascara(valor: string | undefined): string {
  if (!valor) return "sin dato";
  const limpio = valor.trim();
  if (limpio.length < 7) return "dato incompleto";
  return `${limpio.slice(0, 6)}${"*".repeat(limpio.length - 6)}`;
}

function linea(clave: string, valor: string): string {
  // Relleno a 26 columnas: suficiente para las claves más largas del informe
  // y los valores quedan alineados en columna, que es lo que hace legible una
  // lista de datos.
  return `  ${clave.padEnd(26, " ")} ${valor}`;
}

function regla(titulo: string): string {
  return `\n${titulo}\n${"-".repeat(Math.max(titulo.length, 26))}`;
}

/**
 * Parte un párrafo en renglones de ancho fijo, con sangría.
 *
 * -----------------------------------------------------------------------
 * POR QUÉ EXISTE Y POR QUÉ NO ESTÁ EN `core`
 * -----------------------------------------------------------------------
 * Porque los textos de `core` son párrafos para pantalla, donde el ancho lo
 * decide el navegador, y el informe es un `.txt` de ancho fijo. Meter el ajuste
 * de línea en `core` obligaría a la pantalla a deshacerlo, y lo que se deshace
 * mal es peor que lo que no se ajusta: aquí la línea se come media pantalla.
 *
 * Lo que llega de la fuente (los textos de botones, las descripciones del modo
 * de descarga) NO pasa por aquí a propósito: son literales, y partir un literal
 * que el técnico va a leer en voz alta para copiarlo cambia lo que la fuente
 * escribió. Se parten solo los párrafos explicativos, que son los únicos que no
 * se copian.
 *
 * -----------------------------------------------------------------------
 * POR QUÉ PALABRA COMPLETA Y NO CARÁCTER
 * -----------------------------------------------------------------------
 * Por lo mismo: partir a media palabra produce un renglón que no se puede
 * copiar ni dictar sin volverlo a armar. A 68 columnas con sangría de 6, la
 * palabra más larga del español cabe de sobra.
 */
const ANCHO = 68;
const SANGRA = "      ";

/**
 * Parte un párrafo en renglones de ancho fijo.
 *
 * `primero` y `resto` son las sangrías del primer renglón y de los siguientes.
 * Son distintos cuando lo que se imprime es una viñeta: el `  - ` va una sola
 * vez y los renglones que le siguen se alinean con el texto de la viñeta, no con
 * el guion.
 */
function parrafo(texto: string, primero = SANGRA, resto = SANGRA): string[] {
  const salida: string[] = [];
  const sangriaDe = (i: number) => (i === 0 ? primero : resto);
  const agregar = (renglon: string) =>
    salida.push(sangriaDe(salida.length) + renglon);
  let renglon = "";
  for (const palabra of texto.split(/\s+/).filter(Boolean)) {
    // La sangría cuenta para el ancho: el tope es del renglón completo, que es
    // lo que se ve en la pantalla del cliente.
    const ocupa = sangriaDe(salida.length).length + renglon.length + (renglon ? 1 : 0) + palabra.length;
    if (renglon && ocupa > ANCHO) {
      agregar(renglon);
      renglon = "";
    }
    renglon = renglon ? `${renglon} ${palabra}` : palabra;
  }
  if (renglon) agregar(renglon);
  return salida;
}

/** Marca de tiempo local, en el formato que se lee en voz alta. */
function ahora(): string {
  return new Date().toLocaleString("es-MX", {
    dateStyle: "long",
    timeStyle: "medium",
  });
}

export function buildReport(input: ReportInput): string {
  const { device, resolution, probes, license, watermarked } = input;
  const v = resolution.match;
  const partes: string[] = [];

  partes.push("FIXMYPHONE - Informe de identificacion y diagnostico");
  partes.push("=".repeat(66));
  if (watermarked) partes.push(...MARCA_AGUA, "");

  partes.push(linea("Generado", ahora()));
  partes.push(
    linea(
      "Herramienta",
      `FixMyPhone ${process.env.npm_package_version ?? "0.1.0"}`,
    ),
  );
  partes.push(linea("Transporte", device.transport));
  partes.push(linea("Numero de serie", device.serial));
  partes.push(
    linea(
      "Licencia",
      license.valid && license.tier === "premium"
        ? `premium - ${license.subject ?? "sin titular"}`
        : "plan gratuito",
    ),
  );
  if (input.licenseEnvelope) {
    partes.push(linea("Id de licencia", licenseId(input.licenseEnvelope)));
  }
  if (license.expiresAt) {
    partes.push(
      linea("Vence", new Date(license.expiresAt).toLocaleDateString("es-MX")),
    );
  }

  // --- Identidad ----------------------------------------------------------
  partes.push(regla("IDENTIFICACION"));
  if (v) {
    partes.push(linea("Equipo", `${v.marketingName} (${v.vendorNombre})`));
    partes.push(linea("Clave de variante", v.key));
    partes.push(linea("Codename", v.codename));
    partes.push(linea("Variante de placa", v.variant ?? "no aplica"));
    partes.push(linea("Procesador", v.soc ?? "sin dato"));
    partes.push(linea("Plataforma", v.platform ?? "sin dato"));
    partes.push(
      linea("Android de fabrica", v.androidVersion ? `API ${v.androidVersion}` : "sin dato"),
    );
    if (v.modelNumbers.length) {
      partes.push(linea("Numeros de modelo", v.modelNumbers.join(", ")));
    }
    partes.push(linea("Esquema de particiones", partitionScheme(v) ?? "sin dato"));

    // Homologación IFT, con su explicación debajo.
    //
    // Va con el texto entero y no solo con la palabra del estado porque este
    // archivo se archiva como evidencia y dentro de dos años nadie va a
    // acordarse de que "sin verificar" significaba "se buscó y no salió" y no
    // "no homologado". Un informe que dice "sin verificar" sin explicar de qué
    // se trata se lee como "no está homologado", que es una conclusión que la
    // herramienta nunca saca.
    partes.push(linea("Homologacion IFT", v.homologadoIft));
    if (v.iftCertificado) {
      partes.push(linea("Folio del IFT", v.iftCertificado));
      partes.push(linea("Fuente del folio", v.iftUrl || "sin URL"));
    }
    partes.push("");
    partes.push(...parrafo(TOOLTIP_HOMOLOGACION[v.homologadoIft], "  ", "  "));
  } else {
    partes.push(linea("Resultado", "NO RESUELTO"));
    if (resolution.unresolvedReason) {
      partes.push("");
      partes.push(`  Motivo: ${resolution.unresolvedReason}`);
    }
    if (resolution.alternatives.length) {
      partes.push("");
      partes.push("  Candidatos que el catalogo si conoce:");
      for (const alt of resolution.alternatives) {
        partes.push(
          `    - ${alt.key.padEnd(22, " ")} ${alt.marketingName} / ${alt.soc ?? "sin SoC"}`,
        );
      }
      partes.push("");
      partes.push("  No se eligio ninguno. La eleccion es del tecnico.");
    }
  }

  // --- Escalera -----------------------------------------------------------
  partes.push(regla("COMO SE IDENTIFICO"));
  for (const n of resolution.ladder) {
    partes.push(`  L${n.level}  ${n.name}`);
    partes.push(`        ${n.evidence}`);
    partes.push(`        confianza ${(n.confidence * 100).toFixed(0)}%`);
    partes.push("");
  }

  // --- Capacidades --------------------------------------------------------
  if (v) {
    partes.push(regla("LO QUE EL CATALOGO AFIRMA DE ESTA VARIANTE"));
    if (v.capabilities.length) {
      for (const c of v.capabilities) partes.push(linea(c, "si"));
    } else {
      partes.push("  El catalogo no registra capacidades para esta variante.");
    }
    partes.push("");
    partes.push("  Lo que el catalogo NO afirma:");
    const bekannt = new Set(v.capabilities);
    const noRegistradas = [
      "a_b_slots",
      "a_only",
      "unlock_supported",
      "edl_supported",
      "brom_supported",
    ].filter((c) => !bekannt.has(c));
    if (noRegistradas.length) {
      for (const c of noRegistradas) partes.push(linea(c, "no registrado"));
    } else {
      partes.push("    (todo lo que el catalogo cubre esta registrado)");
    }
  }

  // --- Riesgos ------------------------------------------------------------
  if (v && v.riskFlags.length) {
    partes.push(regla("RIESGOS QUE EL CATALOGO ADVIERTE"));
    // -------------------------------------------------------------------
    // Por qué no se imprime `f` tal cual
    // -------------------------------------------------------------------
    // Las banderas de la base tienen la forma `base` o `base:valor`, y se
    // imprimían enteras. El informe firmado que recibe el cliente llegaba con
    // líneas como
    //
    //     - pre_install_required:needs_specific_android_fw
    //     - recovery_flash_target_is:vendor_boot
    //
    // o sea, el identificador interno de la base, sin traducir, en el único
    // documento que el producto le entrega a alguien. La pantalla de Equipo sí
    // tenía su propia tabla de textos, así que el técnico leía la misma
    // advertencia en español y el cliente leía el código: dos verdades para un
    // dato, y la menos legible en el papel que importa.
    //
    // Ahora las dos salen de `riesgo()`, y el valor va traducido con la
    // receta. Cuando el valor no tiene traducción se dice explícitamente que la
    // fuente no lo explica, en vez de imprimir el código como si fuera una
    // explicación.
    for (const r of riesgosDe(v)) {
      partes.push(...parrafo(r.texto, "  - "));
      if (r.valor) {
        // El rotulo y el separador los pone este consumidor. Los textos de `core`
        // no nombran la particion ni el firmware, porque el que los usa ya lo
        // tiene a la vista y lo pone en su propia tipografia; y no traen
        // comillas invertidas porque estas cadenas llegan al cliente tal cual.
        partes.push(
          `      ${r.valorRotulo ?? "Valor"}: ${r.valor}` +
            (r.valorTexto ? " —" : " (la fuente no explica este valor)"),
        );
        if (r.valorTexto) partes.push(...parrafo(r.valorTexto, SANGRA + "  "));
      }
    }
    partes.push("");
    partes.push(
      "  Estos avisos son para que el tecnico decida con su propia",
      "  responsabilidad. FixMyPhone no ejecuta ninguno de estos",
      "  procedimientos por el: los describe.",
    );
  }

  // --- Receta -------------------------------------------------------------
  //
  // -----------------------------------------------------------------------
  // Por qué la receta va en el informe firmado y no en la pantalla de entrega
  // -----------------------------------------------------------------------
  // Porque es el mismo tipo de dato que la sección de riesgos: viene del
  // catálogo, con su procedencia, y no depende de que el técnico marque nada.
  // El informe no dice "el técnico hizo esto", dice "esto es lo que el catálogo
  // sabe de esta placa". La receta es exactamente eso, y su ausencia era el
  // hueco más grande del documento: un cliente que pedía la reparación leía un
  // informe con el diagnóstico y sin una sola línea de lo que se iba a hacer.
  //
  // Lo que NO entra es nada que el técnico escriba. Si algún día la orden de
  // trabajo existe, lo que él declare irá marcado como declaración, porque una
  // declaración no es evidencia y este informe está firmado.
  if (v) {
    partes.push(regla("QUE HAY QUE HACER CON ESTA PLACA (LO DICE EL CATALOGO)"));
    const r = v.receta;
    if (r.descargaExigeMaterialFirmado === true) {
      // El aviso dice "el modo de descarga", no "la reparacion", y la razon
      // esta escrita en el campo de `core`: de las 691 variantes con este dato
      // en 1, 595 son metodos fastboot, y el flasheado por fastboot no
      // necesita la firma. Decir "esta reparacion no se puede hacer" seria
      // falso en la mayor parte del catalogo, y este archivo se lo entrega al
      // cliente.
      //
      // Los dos parrafos salen de `avisoFirmaDescarga()`, la misma funcion que
      // usa la pantalla: duplicados, el dia que uno se corrige el otro se
      // queda diciendo lo viejo, y el viejo es el que llega al cliente.
      const [p1, p2] = avisoFirmaDescarga(r);
      partes.push("  EL MODO DE DESCARGA DE ESTA PLACA EXIGE MATERIAL FIRMADO");
      partes.push(...parrafo(p1));
      partes.push(...parrafo(p2));
    } else if (r.descargaExigeMaterialFirmado === false) {
      partes.push(
        `  El modo de descarga (${r.modoDescarga ?? "sin descripcion"}) no exige` +
          " material firmado.",
      );
    }
    if (r.requisitoPrevio) {
      const explicacion = preRequisito(r.requisitoPrevio);
      partes.push(
        `  Antes de flashear: ${r.requisitoPrevio}` +
          (r.versionRequisito ? ` (Android ${r.versionRequisito})` : ""),
      );
      if (explicacion) {
        partes.push(
          ...parrafo(
            `Antes hay que instalar ${explicacion}. Si se salta ese paso, el` +
              " recovery que se flashea despues puede no arrancar.",
          ),
        );
      } else {
        partes.push("      La fuente da este nombre pero no explica que hay que instalar.");
      }
    }
    if (r.particionRecovery) {
      partes.push(`  Particion donde va la imagen de recovery: ${r.particionRecovery}`);
      partes.push(...parrafo(PARTICION_RECOVERY[r.particionRecovery]));
    }
    if (r.desbloqueo) {
      // 75 de los 97 valores de `custom_unlock_cmd` son `fastboot flashing
      // unlock`. Llamarlo "propio de este equipo" en el informe que se entrega
      // al cliente le hace creer que su telefono es el que necesita un
      // procedimiento raro, y no lo necesita.
      partes.push(
        esDesbloqueoGenerico(r.desbloqueo)
          ? "  Comando de desbloqueo que declara la fuente:"
          : "  Comando de desbloqueo que declara la fuente para esta variante:",
      );
      for (const l of r.desbloqueo.split("\n")) partes.push(`      ${l}`);
      if (esDesbloqueoGenerico(r.desbloqueo)) {
        partes.push(
          "      (es el comando generico de fastboot, no uno propio de esta placa)",
        );
      }
    }
    if (r.metodo) partes.push(`  Metodo de instalacion declarado: ${r.metodo}`);
    if (r.modoDescarga) partes.push(`  Modo de descarga: ${r.modoDescarga}`);
    if (r.comboRecovery) partes.push(`  Como entrar a recovery: ${r.comboRecovery}`);
    if (r.comboDescarga) partes.push(`  Como entrar al modo de descarga: ${r.comboDescarga}`);
    if (r.comboRecovery || r.comboDescarga) {
      partes.push(
        "      (texto de la fuente, en su idioma; la app no lo traduce ni lo",
        "       ejecuta, y no comprueba que siga siendo correcto para esta placa)",
      );
    }
    const conDato = recetaPresente(r).length;
    if (conDato === 0) {
      partes.push("  La fuente no declara receta para esta variante.");
    } else {
      partes.push(
        `  (${conDato} de ${ORDEN_RECETA.length} campos con dato en la fuente;`,
        `   los que faltan, la fuente no los declara)`,
      );
    }
    partes.push("");
    partes.push(
      "  FixMyPhone NO ejecuta ninguno de estos pasos. Los describe, para que el",
      "  tecnico decida. Ejecutarlos es responsabilidad de quien los ejecuta.",
    );
  }

  // --- Verificación -------------------------------------------------------
  if (v && v.verificationGates.length) {
    partes.push(regla("COMO COMPROBAR QUE QUEDO BIEN"));
    for (const g of v.verificationGates) {
      partes.push(
        `  [${g.blocking ? "OBLIGATORIO" : "recomendado"}] ${g.name}  (${g.kind})`,
      );
    }
  }

  // --- Diagnóstico --------------------------------------------------------
  partes.push(regla("DIAGNOSTICO"));
  if (probes.length) {
    for (const p of probes) {
      const marca =
        p.state === "pass" ? "OK   " : p.state === "fail" ? "FALLA" : p.state === "skip" ? "N/A  " : "....";
      partes.push(`  ${marca}  ${p.id}`);
      if (p.command) partes.push(`          ${p.command}`);
      partes.push(`          ${p.explanation}`);
      if (typeof p.durationMs === "number") {
        partes.push(`          ${p.durationMs} ms`);
      }
      partes.push("");
    }
  } else {
    partes.push("  No se corrieron sondas.");
  }

  // --- Datos leídos -------------------------------------------------------
  partes.push(regla("PROPIEDADES LEIDAS DEL EQUIPO"));
  const props = device.props as RawDeviceProps;
  const claves = Object.keys(props).sort();
  for (const k of claves) {
    const valor = props[k];
    if (valor === undefined) continue;
    // Los identificadores personales van enmascarados. Siempre.
    if (k === "ril.IMEI" || k === "ril.MEID") {
      partes.push(linea(k, enmascara(valor)));
    } else {
      partes.push(linea(k, valor === "" ? "(vacio)" : valor));
    }
  }

  // --- Procedencia --------------------------------------------------------
  partes.push(regla("PROCEDENCIA DE LOS DATOS"));
  if (v && v.sources.length) {
    for (const s of v.sources) partes.push(`  - ${s}`);
  } else {
    partes.push("  Sin fuentes registradas para esta variante.");
  }
  partes.push("");
  partes.push(
    "  El catalogo se construye a partir del wiki de LineageOS, la base",
    "  de ETSI y fuentes de fabricante. Licencia CC BY-SA 3.0.",
  );

  // --- Cierre -------------------------------------------------------------
  partes.push(regla("ALCANCE DE ESTE INFORME"));
  partes.push(
    "  Este documento describe lo que se OBSERVO en un equipo en un",
    "  momento dado. No certifica que el equipo quede funcionando, ni",
    "  reemplaza la prueba final del tecnico. Las listas de verificacion",
    "  de arriba son esa prueba final.",
  );
  // La firma se dice en condicional, y no como una promesa, porque cuando se
  // escriben estas líneas todavía no se sabe: la decisión de firmar se toma
  // DESPUÉS de armar el texto, en el proceso principal. Lo que sí se puede
  // afirmar —y es lo único que importa dentro de cinco años, cuando nadie
  // recuerde cómo se generó— es cómo se comprueba un archivo con firma y qué
  // significa un archivo sin ella. Describe el mecanismo, no promete un
  // resultado que este código todavía no ha decidido.
  partes.push(
    "",
    "  FIRMA DIGITAL. Si este archivo termina en un bloque que empieza con",
    "  -----BEGIN FIXMYPHONE REPORT SIGNATURE-----, esa firma demuestra que",
    "  el contenido no fue alterado despues de generarse, y se comprueba con:",
    "",
    "      fmp-license verify-informe <este-archivo>",
    "",
    "  Si el archivo NO termina en ese bloque, este informe no esta firmado y",
    "  no hay forma de comprobar que nadie lo modifico. La firma la pone la",
    "  instalacion de FixMyPhone de este taller, no el fabricante: por eso la",
    "  huella la tiene que dar el taller, y comparar esa huella con la del",
    "  bloque es lo que dice quien lo genero.",
  );
  partes.push(
    "",
    "  FixMyPhone no escribe el IMEI ni el ESN, no quita el bloqueo de",
    "  activacion de Google, y no ejecuta exploits de arranque profundo.",
    "  Es una herramienta de diagnostico. Lo que se haga despues es",
    "  responsabilidad de quien lo haga, y de la lei que lo rija.",
  );

  partes.push("");
  partes.push("=".repeat(66));
  partes.push("Fin del informe.");
  partes.push("");

  return partes.join("\n");
}

/** Sugerencia de nombre de archivo, sin caracteres que rompan Windows. */
export function reportFileName(device: ConnectedDevice, v: Resolution["match"]): string {
  const base = v ? v.key : device.serial || "equipo";
  const seguro = base.replace(/[\\/:*?"<>|]/g, "-");
  const d = new Date();
  const sello = `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, "0")}${String(
    d.getDate(),
  ).padStart(2, "0")}-${String(d.getHours()).padStart(2, "0")}${String(
    d.getMinutes(),
  ).padStart(2, "0")}`;
  return `fixmyphone-${seguro}-${sello}.txt`;
}

export { has };
