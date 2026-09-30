/**
 * Pantalla Reparación: lo que hay que hacer con esta placa, y lo que hay que
 * saber antes de tocar nada.
 * ===========================================================================
 *
 * POR QUÉ ESTA PANTALLA EXISTE
 * ---------------------------------------------------------------------------
 * Porque el producto se define como diagnóstico + identificación + reparación, y
 * la tercera mitad no existía. El catálogo traía nueve columnas de receta con su
 * procedencia desde el principio —partición de destino, comando de desbloqueo,
 * si el modo de descarga pide firma, cómo entrar a cada modo— y la app no leía
 * ninguna: eran código muerto del lado de TypeScript. El técnico podía
 * diagnosticar y entregar, y para reparar tenía que saberlo él.
 *
 * POR QUÉ VA ENTRE "DIAGNÓSTICO" Y "ENTREGA"
 * ---------------------------------------------------------------------------
 * Porque es el orden real del trabajo: se lee lo que hay, se decide qué se
 * hace, se hace, se comprueba. Ponerla al final, junto al informe, es ponerla
 * donde se consulta después de haber abierto el equipo.
 *
 * LO QUE ESTA PANTALLA NO HACE
 * ---------------------------------------------------------------------------
 * No ejecuta nada. No flashea, no desbloquea, no entra a EDL, no escribe en el
 * equipo, ni tiene un botón que pudiera llegar a hacerlo. La app tiene esa
 * decisión escrita en `probes.ts` y esta pantalla es el otro lado de ella: lo
 * describe para que el técnico decida con su propia responsabilidad.
 *
 * El bloqueo real de esta pantalla es la falta de datos, y se muestra como
 * falta. Un `null` no se rellena, no se oculta y no se convierte en un texto
 * plausible: la fuente no lo dice, y decirlo es más útil que una receta
 * inventada, porque una receta de flasheado equivocada no se nota hasta que el
 * equipo no arranca.
 *
 * LO QUE ESTA PANTALLA NO ES TODAVÍA
 * ---------------------------------------------------------------------------
 * No es la orden de trabajo. No hay motivo de entrada del cliente, ni fecha, ni
 * técnico, ni registro de lo que se hizo. Eso es el modelo de orden, que sigue
 * sin existir, y es lo que haría falta para que todo esto sea auditable y no
 * solo legible.
 */

import { useMemo } from "react";
import {
  Wrench,
  CircleHelp,
  ShieldAlert,
  TriangleAlert,
  Lock,
  KeyRound,
  HardDrive,
  Terminal,
  Languages,
} from "lucide-react";
import type {
  CampoReceta,
  ConnectedDevice,
  DeviceVariant,
  Receta,
  Resolution,
} from "@fixmyphone/core";
import {
  avisoFirmaDescarga,
  ORDEN_RECETA,
  PARTICION_RECOVERY,
  preRequisito,
  recetaPresente,
  recetaVacia,
  riesgo,
} from "@fixmyphone/core";
import { Badge, Panel, EmptyState } from "../components/primitives";

// ---------------------------------------------------------------------------
// Textos de cada campo
// ---------------------------------------------------------------------------

/**
 * Cómo se presenta cada campo de la receta.
 *
 * `bloqueante` no significa "impide reparar": significa que, si el dato dice lo
 * que dice, el técnico tiene que enterarse ANTES de abrir el equipo. Los dos
 * que lo están están en ese grupo por una razón práctica: los dos se
 * descubren tarde, cuando ya se gastó la hora de trabajo.
 *
 * `codigo` marca los campos que se muestran como literal, en monoespaciada.
 * Los comandos y los identificadores de la fuente van así a propósito: en
 * proportional, `fastboot oem setenv lock 10100000;saveenv;save` se lee como
 * una frase y se ejecuta como otra cosa.
 */
const CAMPOS: Record<
  CampoReceta,
  {
    titulo: string;
    pista: string;
    icono: typeof Wrench;
    bloqueante?: boolean;
    codigo?: boolean;
    /** El valor viene de la fuente en otro idioma y no se traduce. */
    ajeno?: boolean;
  }
> = {
  descargaExigeMaterialFirmado: {
    titulo: "Firma en el modo de descarga",
    pista: "si entrar al modo de descarga pide un paquete firmado por el fabricante",
    icono: Lock,
    bloqueante: true,
  },
  requisitoPrevio: {
    titulo: "Antes de flashear",
    pista: "firmware que hay que instalar antes, según la fuente",
    icono: TriangleAlert,
    bloqueante: true,
  },
  particionRecovery: {
    titulo: "Partición de destino",
    pista: "en qué partición va la imagen de recovery",
    icono: HardDrive,
  },
  desbloqueo: {
    titulo: "Desbloqueo",
    pista: "comando propio de este equipo, cuando no sirve el estándar",
    icono: KeyRound,
    codigo: true,
  },
  metodo: {
    titulo: "Método de instalación",
    pista: "identificador del método, tal cual lo escribe la fuente",
    icono: Wrench,
    codigo: true,
  },
  modoDescarga: {
    titulo: "Modo de descarga",
    pista: "en qué modo entra el equipo y con qué identificadores USB",
    icono: Terminal,
  },
  comboRecovery: {
    titulo: "Entrar a recovery",
    pista: "combinación de botones, como la describe la fuente",
    icono: Wrench,
    ajeno: true,
  },
  comboDescarga: {
    titulo: "Entrar al modo de descarga",
    pista: "combinación de botones, como la describe la fuente",
    icono: Terminal,
    ajeno: true,
  },
};

// ---------------------------------------------------------------------------
// Pantalla
// ---------------------------------------------------------------------------

export function ReparacionScreen({
  device,
  resolution,
}: {
  device: ConnectedDevice | null;
  resolution: Resolution | null;
}) {
  const v = resolution?.match ?? null;
  const receta = v?.receta ?? null;
  const presentes = useMemo(() => (receta ? recetaPresente(receta) : []), [receta]);

  if (!device) {
    return (
      <EmptyState
        icon={<Wrench size={28} strokeWidth={1.5} />}
        title="Nada que reparar todavía"
        body="La receta depende de la variante del equipo. Conéctalo en la pestaña Equipo: sin identificar la placa no hay receta, y una receta de la placa equivocada es peor que ninguna."
      />
    );
  }

  if (!v || !receta) {
    return (
      <EmptyState
        icon={<CircleHelp size={28} strokeWidth={1.5} />}
        title="Sin variante identificada"
        body={
          <>
            El catálogo no resolvió este equipo a una sola placa, así que no hay
            receta que mostrar. Hay{" "}
            <strong className="text-text">
              {resolution?.alternatives.length ?? 0} candidatas
            </strong>{" "}
            en la pestaña Equipo, y cada una tiene la suya. No se muestra una al
            azar: una receta de la placa equivocada manda al técnico a flashear
            donde no toca.
          </>
        }
      />
    );
  }

  const ausentes = ORDEN_RECETA.filter((k) => recetaVacia(receta, k));
  const firmados = receta.descargaExigeMaterialFirmado === true;

  return (
    <div className="flex h-full flex-col gap-4 p-4">
      <header className="flex shrink-0 items-end gap-4">
        <div className="min-w-0">
          <h1 className="text-h1 font-semibold tracking-tight">Reparación</h1>
          <p className="mt-0.5 text-caption text-text-faint">
            {v.marketingName} · {v.key} ·{" "}
            {presentes.length === 0
              ? "la fuente no declara receta"
              : `${presentes.length} de ${ORDEN_RECETA.length} datos de receta`}
          </p>
        </div>
        <div className="flex-1" />
        <div className="flex shrink-0 items-center gap-2">
          <Badge tone={firmados ? "danger" : "neutral"}>
            {firmados ? "descarga firmada" : "descarga sin firma"}
          </Badge>
          <Badge tone={ausentes.length ? "warning" : "success"}>
            {ausentes.length ? `${ausentes.length} sin dato` : "receta completa"}
          </Badge>
        </div>
      </header>

      {firmados ? <AvisoFirmaDescarga receta={receta} /> : null}

      <div className="flex min-h-0 flex-1 gap-4">
        <Panel
          title="Lo que dice la fuente"
          hint="viene del catálogo, con su procedencia"
          className="flex-1"
        >
          <ul className="divide-y divide-border/60">
            {ORDEN_RECETA.map((clave) => (
              <FilaReceta key={clave} clave={clave} receta={receta} variante={v} />
            ))}
          </ul>
        </Panel>

        <div className="flex w-[340px] shrink-0 flex-col gap-4">
          <Avisos variant={v} />
          <Panel title="Lo que esta pantalla no es" className="min-h-0 flex-1">
            <ul className="space-y-3 p-4 text-small text-text-muted">
              <li className="flex gap-2">
                <span className="text-warning" aria-hidden>
                  ·
                </span>
                <span>
                  No ejecuta nada. No hay botón que escriba en el equipo: esto
                  describe el procedimiento, no lo hace. La decisión de no
                  automatizar flasheados está escrita en{" "}
                  <code className="tech">probes.ts</code>.
                </span>
              </li>
              <li className="flex gap-2">
                <span className="text-warning" aria-hidden>
                  ·
                </span>
                <span>
                  No verifica que la fuente siga diciendo la verdad. Lo que dice
                  de esta placa es lo que el wiki decía cuando se recolectó la
                  base, y un fabricante puede cambiarlo sin avisar.
                </span>
              </li>
              <li className="flex gap-2">
                <span className="text-warning" aria-hidden>
                  ·
                </span>
                <span>
                  No es la orden de trabajo. No hay motivo de entrada, ni técnico,
                  ni registro de lo que se hizo. Eso sigue sin existir.
                </span>
              </li>
              <li className="flex gap-2">
                <span className="text-warning" aria-hidden>
                  ·
                </span>
                <span>
                  Los textos de botones van en el idioma de la fuente y no se
                  traducen. Traducir cuatrocientas combinaciones sin comprobarlas
                  contra un manual de la marca sería escribir instrucciones que
                  no salieron de nadie.
                </span>
              </li>
            </ul>
          </Panel>
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Filas
// ---------------------------------------------------------------------------

/**
 * Una fila de la receta: el dato si está, y la ausencia si no.
 *
 * La ausencia se escribe, no se esconde. Un campo en blanco obliga a buscar la
 * página de la variante a mano, que es más trabajo, pero es la alternativa
 * honesta a poner un texto inventado: "no lo sé" es información, y "haz esto"
 * inventado es un riesgo.
 */
function FilaReceta({
  clave,
  receta,
  variante,
}: {
  clave: CampoReceta;
  receta: Receta;
  variante: DeviceVariant;
}) {
  const c = CAMPOS[clave];
  const vacio = recetaVacia(receta, clave);
  const Icono = c.icono;

  return (
    <li className="px-4 py-3">
      <div className="flex items-baseline gap-2">
        <Icono
          size={13}
          strokeWidth={1.75}
          className={
            vacio ? "text-text-faint" : c.bloqueante ? "text-danger" : "text-text-faint"
          }
        />
        <h3 className="text-small font-medium text-text">{c.titulo}</h3>
        <span className="truncate text-caption text-text-faint">{c.pista}</span>
        {c.ajeno ? (
          <span className="ml-auto flex shrink-0 items-center gap-1 text-caption text-text-faint">
            <Languages size={11} strokeWidth={1.75} aria-hidden />
            texto de la fuente, sin traducir
          </span>
        ) : null}
      </div>

      <div className="mt-1.5 pl-[21px]">
        {vacio ? (
          <p className="text-small text-text-faint">
            La fuente no lo declara para esta variante.
          </p>
        ) : (
          <Valor clave={clave} receta={receta} variante={variante} />
        )}
      </div>
    </li>
  );
}

/** El valor de un campo, con el tratamiento que ese campo necesita. */
function Valor({
  clave,
  receta,
  variante,
}: {
  clave: CampoReceta;
  receta: Receta;
  variante: DeviceVariant;
}) {
  const c = CAMPOS[clave];

  if (clave === "descargaExigeMaterialFirmado") {
    // `false` es un dato y se muestra como tal. Ocultarlo para que la pantalla
    // quede más limpia sería quitarle al técnico la única información que le
    // dice que este camino sí está abierto.
    if (!receta.descargaExigeMaterialFirmado) {
      return (
        <p className="text-small text-text-muted">
          No. La fuente declara que el modo de descarga de esta variante no pide
          material firmado.
        </p>
      );
    }
    return (
      <p className="text-small text-danger">
        Sí, por el modo de descarga. La fuente declara que entrar ahí necesita un
        paquete firmado por el fabricante. El{" "}
        <strong className="font-medium text-text">método de instalación</strong>{" "}
        de esta variante{" "}
        {receta.metodo ? (
          <>
            es <span className="tech">{receta.metodo}</span>, y ese es un camino
            aparte.
          </>
        ) : (
          <>no lo declara, así que no se puede decir desde aquí si hay otro camino.</>
        )}
      </p>
    );
  }

  if (clave === "requisitoPrevio") {
    const explicacion = preRequisito(receta.requisitoPrevio);
    return (
      <>
        <p className="text-small text-text">
          <span className="tech">{receta.requisitoPrevio}</span>
          {receta.versionRequisito ? (
            <span className="text-text-faint"> · Android {receta.versionRequisito}</span>
          ) : null}
        </p>
        {explicacion ? (
          <>
            <p className="mt-1 text-small text-text-muted">
              Antes hay que instalar {explicacion}.
            </p>
            {/* La consecuencia no se generaliza a los otros quince requisitos, que
                no se explican: es la razón por la que este tiene texto. Y es la
                misma que ya dice la bandera `pre_install_required` de la lista
                de riesgos, dicha en el registro donde el técnico decide si se
                salta un paso. */}
            <p className="mt-1 text-small text-text-muted">
              Si se salta ese paso, el recovery que se flashea después puede no
              arrancar.
            </p>
          </>
        ) : (
          // La mayoría de los valores de esta columna son códigos de firmware que
          // la fuente no explica. Se muestran, porque existen, y se dice que no
          // se saben leer, porque fingir que sí sería la forma más rápida de
          // convertir un código en una instrucción falsa.
          <p className="mt-1 text-small text-warning">
            La fuente da este nombre y no explica qué hay que instalar antes. El
            código aparece en la página de esta variante; esta app no sabe
            traducirlo.
          </p>
        )}
      </>
    );
  }

  if (clave === "particionRecovery") {
    const p = receta.particionRecovery;
    if (!p) return null;
    return (
      <>
        <p className="tech text-small text-text">{p}</p>
        <p className="mt-1 text-small text-text-muted">{PARTICION_RECOVERY[p]}</p>
        {/* La bandera de riesgo lleva la misma partición. Si un día se separan,
            la comparación sale en la prueba de catálogo y no en el informe de un
            taller. */}
        {variante.riskFlags.some((f) => f === `recovery_flash_target_is:${p}`) ? (
          <p className="mt-1 text-caption text-text-faint">
            El catálogo marca esta misma partición como riesgo en la pestaña
            Equipo.
          </p>
        ) : null}
      </>
    );
  }

  if (clave === "comboRecovery" || clave === "comboDescarga") {
    return (
      <p className="border-l-2 border-border pl-3 text-small text-text-muted">
        {String(receta[clave])}
      </p>
    );
  }

  if (clave === "desbloqueo") {
    return (
      <>
        <pre className="tech overflow-x-auto whitespace-pre-wrap break-words rounded border border-border bg-surface-2 px-3 py-2 text-caption text-text">
          {receta.desbloqueo}
        </pre>
        <p className="mt-1 text-caption text-text-faint">
          Comando literal de la fuente. La app no lo ejecuta ni lo modifica: un
          comando reescrito ya no es el que probó el fabricante.
        </p>
      </>
    );
  }

  return (
    <p className={c.codigo ? "tech text-small text-text" : "text-small text-text"}>
      {String(receta[clave])}
    </p>
  );
}

// ---------------------------------------------------------------------------
// Avisos
// ---------------------------------------------------------------------------

/**
 * El aviso de la firma va arriba y ocupa su propia banda, no una fila más.
 *
 * ------------------------------------------------------------------
 * POR QUÉ EL AVISO DICE "EL MODO DE DESCARGA" Y NO "ESTA REPARACIÓN"
 * ------------------------------------------------------------------
 * Porque es lo que el dato dice, y porque la diferencia es de 691 variantes.
 * De las que tienen `signed_material_required = 1` en la base, 595 son métodos
 * `fastboot_*`: el modo de descarga es EDL y pide paquete firmado, pero el
 * método de instalación que declara el catálogo es fastboot, que no lo pide.
 *
 * Con el título corto, estas 691 variantes dirían que la reparación no se puede
 * hacer, y el técnico dejaría de cobrar trabajos que sí se pueden. La banda
 * larga cuesta tres renglones y evita ese error.
 */
function AvisoFirmaDescarga({ receta }: { receta: Receta }) {
  const [p1, p2] = avisoFirmaDescarga(receta);
  return (
    <div className="panel shrink-0 border-danger/40 bg-danger-subtle/40">
      <div className="flex items-start gap-3 p-4">
        <ShieldAlert size={18} strokeWidth={1.75} className="mt-0.5 shrink-0 text-danger" />
        <div className="min-w-0 space-y-1.5">
          <h2 className="text-small font-semibold text-danger">
            Entrar al modo de descarga exige material firmado
          </h2>
          <p className="text-small text-text-muted">{p1}</p>
          <p className="text-small text-text-muted">{p2}</p>
        </div>
      </div>
    </div>
  );
}

/** Los riesgos del catálogo, con el valor ya traducido por la misma tabla. */
function Avisos({ variant }: { variant: DeviceVariant }) {
  if (!variant.riskFlags.length) return null;
  return (
    <Panel
      title="Riesgos de esta variante"
      hint={`${variant.riskFlags.length} en el catálogo`}
      className="shrink-0"
    >
      <ul className="space-y-2.5 p-4">
        {variant.riskFlags.map((f) => {
          const r = riesgo(f);
          return (
            <li key={f} className="flex gap-2.5">
              <ShieldAlert
                size={13}
                strokeWidth={1.75}
                className="mt-0.5 shrink-0 text-warning"
              />
              <div className="min-w-0 text-small text-text-muted">
                <p>{r.texto}</p>
                {r.valor ? (
                  r.valorTexto ? (
                    // El rótulo, el nombre y el separador los pone este
                    // consumidor. El texto de `core` explica la partición sin
                    // nombrarla, porque el nombre ya está a la vista arriba y en
                    // monoespaciada: aquí solo falta decir por qué importa.
                    <p className="mt-0.5 text-caption text-text-faint">
                      {r.valorRotulo}: <span className="tech">{r.valor}</span> —{" "}
                      {r.valorTexto}
                    </p>
                  ) : (
                    <p className="mt-0.5 text-caption text-warning">
                      {r.valorRotulo ?? "Valor"} <span className="tech">{r.valor}</span>:
                      la fuente no lo explica.
                    </p>
                  )
                ) : null}
              </div>
            </li>
          );
        })}
      </ul>
    </Panel>
  );
}
