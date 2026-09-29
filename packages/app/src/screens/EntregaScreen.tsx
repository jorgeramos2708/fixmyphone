/**
 * Pantalla Entrega: las comprobaciones de antes de devolver el equipo.
 * ===========================================================================
 *
 * POR QUÉ ESTA PANTALLA EXISTE Y POR QUÉ NO ESTÁ EN "DIAGNÓSTICO"
 * ---------------------------------------------------------------------------
 * El diagnóstico y la entrega son dos momentos distintos del trabajo. El
 * diagnóstico se hace antes de abrir el equipo y es todo lectura: el
 * diagnóstico no modifica nada. La entrega es después de intervenir, con el
 * equipo ya cerrado, y es lo único que separa "el técnico hizo su trabajo" de
 * "el técnico hizo su trabajo y el equipo quedó bien".
 *
 * Meter las comprobaciones en la pantalla de diagnóstico sería meter dos
 * preguntas distintas en la misma lista: "¿qué leí del equipo?" y "¿comprobé
 * que quedó bien?". La segunda se contesta a ojo y con el equipo en la mano, y
 * si comparte columna con las sondas el técnico termina leyendo un verde de
 * "pasó la sonda" como si fuera un verde de "comprobé la puerta". La app no
 * puede dejar que esos dos verdes se confundan, así que viven en pantallas
 * distintas.
 *
 * LO QUE ESTA LISTA NO ES
 * ---------------------------------------------------------------------------
 * No es evidencia y no se escribe en el informe. Una casilla marcada es la
 * declaración del técnico, no una lectura: no hay comando detrás de ella, no hay
 * sello de tiempo y nadie más puede verificar que esa casilla se marcara de
 * verdad. El informe firmado lista las comprobaciones que hay que hacer (eso sí
 * es verificable, porque viene del catálogo), pero no dice cuáles se hicieron.
 *
 * Tampoco sobrevive al cierre de la app, y eso es deliberado en esta etapa: lo
 * que se guarda de verdad es la orden de trabajo, que todavía no existe. Antes
 * de meter esto en disco hay que decidir qué pasa con la orden, y guardar en el
 * blister un registro de casillas que nadie puede auditar sería empezar por el
 * final.
 *
 * LO QUE LA LISTA SÍ ES
 * ---------------------------------------------------------------------------
 * Es la lista que el catálogo declara obligatoria para esta variante, escrita en
 * orden de trabajo, con lo que falta por hacer a la vista. El valor está en que
 * el técnico no depende de su memoria: el catálogo sabe qué mirar en esta placa
 * concreta, y lo dice.
 */

import { useMemo } from "react";
import {
  Check,
  X,
  Minus,
  CircleSlash,
  RotateCcw,
  Stethoscope,
  CircleHelp,
  ClipboardCheck,
} from "lucide-react";
import type {
  ConnectedDevice,
  GateChecks,
  GateEstado,
  ProbeResult,
  ProbeState,
  Resolution,
  VerificationGate,
} from "@fixmyphone/core";
import { coberturaGate } from "@fixmyphone/core";
import { Button, Badge, Panel, EmptyState } from "../components/primitives";

// ---------------------------------------------------------------------------
// Estados
// ---------------------------------------------------------------------------

/**
 * Los cuatro estados, en el orden en que se recorren al apretar.
 *
 * El orden importa y no es arbitrario: `hecha` primero porque es lo que se
 * responde el 90% de las veces y el técnico que las marca todas iguales tiene
 * que llegar ahí en una pulsación. `fallo` después, y no al final, porque la
 * respuesta que hay que registrar con más cuidado es la que dice que algo no
 * funcionó: esconderla tras cuatro pulsaciones es la forma de que nadie la
 * marque nunca.
 *
 * `no_aplica` al final porque es la excepción que hay que pensar, no la
 * respuesta rápida.
 */
const CICLO: Array<GateEstado | null> = [null, "hecha", "fallo", "no_aplica"];

const ESTADO_VISUAL: Record<
  GateEstado,
  { texto: string; icono: typeof Check; clase: string; badge: "success" | "danger" | "neutral" }
> = {
  hecha: { texto: "Comprobada", icono: Check, clase: "text-success", badge: "success" },
  fallo: { texto: "Falló", icono: X, clase: "text-danger", badge: "danger" },
  no_aplica: { texto: "No aplica", icono: CircleSlash, clase: "text-text-faint", badge: "neutral" },
};

const PENDIENTE = { texto: "Pendiente", icono: Minus, clase: "text-text-faint", badge: "neutral" } as const;

const KIND_LABEL: Record<VerificationGate["kind"], string> = {
  hardware: "hardware",
  software: "software",
  radio: "radio",
  bootchain: "arranque",
  storage: "almacenamiento",
  display: "pantalla",
  audio: "audio",
  camera: "cámara",
  sensor: "sensores",
  network: "red",
};

const PROBE_TONE: Record<ProbeState, "neutral" | "info" | "success" | "danger" | "warning"> = {
  pending: "neutral",
  running: "info",
  pass: "success",
  fail: "danger",
  skip: "warning",
};

const PROBE_LABEL: Record<ProbeState, string> = {
  pending: "sin ejecutar",
  running: "ejecutando",
  pass: "pasó",
  fail: "falló",
  skip: "omitida",
};

function siguiente(actual: GateEstado | undefined): GateEstado | null {
  const i = CICLO.indexOf(actual ?? null);
  return CICLO[(i + 1) % CICLO.length] ?? null;
}

// ---------------------------------------------------------------------------
// Pantalla
// ---------------------------------------------------------------------------

export function EntregaScreen({
  device,
  resolution,
  probes,
  checks,
  onMarcar,
}: {
  device: ConnectedDevice | null;
  resolution: Resolution | null;
  probes: ProbeResult[];
  checks: GateChecks;
  onMarcar: (gateId: string, estado: GateEstado | null) => void;
}) {
  const v = resolution?.match ?? null;
  const gates = v?.verificationGates ?? [];

  /**
   * Las obligatorias van primero, y dentro de cada grupo se respeta el orden
   * del catálogo. Reordenar por nombre daría una lista más bonita y peor: el
   * orden del catálogo agrupa por lo que se revisa (encendido, carga, táctil,
   * pantalla, audio, cámaras, sensores, red, software), que es el recorrido que
   * hace el técnico con el equipo en la mesa.
   */
  const ordenadas = useMemo(
    () => [...gates].sort((a, b) => Number(b.blocking) - Number(a.blocking)),
    [gates],
  );

  if (!device) {
    return (
      <EmptyState
        icon={<ClipboardCheck size={28} strokeWidth={1.5} />}
        title="Nada que entregar todavía"
        body="La lista de comprobaciones depende de la variante del equipo. Conéctalo en la pestaña Equipo: sin identificar la placa no hay lista, y una lista para la placa equivocada es peor que ninguna."
      />
    );
  }

  if (!v) {
    return (
      <EmptyState
        icon={<CircleHelp size={28} strokeWidth={1.5} />}
        title="Sin variante identificada"
        body={
          <>
            El catálogo no resolvió este equipo a una sola placa, así que no hay
            lista de comprobaciones que mostrar. Hay{" "}
            <strong className="text-text">
              {resolution?.alternatives.length ?? 0} candidatas
            </strong>{" "}
            en la pestaña Equipo, y cada una tiene la suya. No se muestra una al
            azar: una lista de la placa equivocada hace que el técnico revise lo
            que no importa y se salte lo que sí.
          </>
        }
      />
    );
  }

  const obligatorias = gates.filter((g) => g.blocking);
  const fallidas = obligatorias.filter((g) => checks[g.id] === "fallo").length;
  // Una obligatoria solo está cubierta si está `hecha`. `no_aplica` NO cuenta:
  // marcar "no aplica" en una puerta obligatoria significa que nadie la
  // comprobó, y decir "cubiertas" con una de esas detrás es exactamente la
  // mentira que este producto no cuenta.
  const sinComprobar = obligatorias.filter((g) => checks[g.id] !== "hecha").length;
  const sinComprobarDeclarado = obligatorias.filter((g) => checks[g.id] === "no_aplica").length;
  const marcadas = gates.filter((g) => checks[g.id]).length;

  return (
    <div className="flex h-full flex-col gap-4 p-4">
      <header className="flex shrink-0 items-end gap-4">
        <div className="min-w-0">
          <h1 className="text-h1 font-semibold tracking-tight">Entrega</h1>
          <p className="mt-0.5 text-caption text-text-faint">
            {v.marketingName} · {v.key} ·{" "}
            {marcadas === 0
              ? `${gates.length} comprobaciones, ninguna revisada`
              : `${marcadas} de ${gates.length} revisadas`}
          </p>
        </div>
        <div className="flex-1" />
        <Resumen
          obligatorias={obligatorias.length}
          sinComprobar={sinComprobar}
          sinComprobarDeclarado={sinComprobarDeclarado}
          fallidas={fallidas}
        />
      </header>

      <div className="grid min-h-0 flex-1 grid-cols-[minmax(0,1fr)_minmax(340px,440px)] gap-4">
        <Panel
          title="Comprobaciones"
          hint={`${gates.length} declaradas por el catálogo`}
          actions={
            <Button
              variant="ghost"
              icon={<RotateCcw size={13} strokeWidth={2} />}
              onClick={() => gates.forEach((g) => onMarcar(g.id, null))}
              disabled={marcadas === 0}
              title="Quitar todas las marcas de esta lista"
            >
              Vaciar
            </Button>
          }
        >
          {ordenadas.length === 0 ? (
            <EmptyState
              title="Esta variante no trae lista"
              body="El catálogo no declara comprobaciones para esta placa. No es una lista vacía que se haya perdido: es que no hay dato, y una comprobación inventada es peor que ninguna."
            />
          ) : (
            <ul className="p-1.5">
              {ordenadas.map((g) => (
                <Fila key={g.id} gate={g} estado={checks[g.id]} onMarcar={onMarcar} />
              ))}
            </ul>
          )}
        </Panel>

        <div className="flex min-h-0 flex-col gap-4">
          <CoberturaSondas gates={gates} probes={probes} />
          <LoQueNoPrueba />
        </div>
      </div>
    </div>
  );
}

/**
 * El resumen de arriba a la derecha. El número que manda es el de obligatorias
 * sin comprobar: una obligatoria sin comprobar significa que el trabajo no está
 * terminado, y una que falló, que el equipo no debería entregarse.
 *
 * Van juntos porque el técnico no debería tener que restar: si solo se mostrara
 * "3 de 9 obligatorias", el 3 y el 9 se mezclan con las 7 recomendadas y no se
 * ve si falta una obligatoria o si ya se hizo.
 *
 * LO QUE CUENTA COMO CUBIERTA
 * ---------------------------------------------------------------------------
 * Solo `hecha`. Una obligatoria marcada `no_aplica` NO cuenta como comprobada:
 * decir "cubiertas" con una de esas detrás affirmaría que el taller verificó algo
 * que verificó que no podía verificar. Esa declaración es legítima —a veces de
 * verdad no hay forma— pero es del técnico y tiene que verse por separado, con
 * su propio rótulo, para que la diferencia entre "lo hice" y "no se podía"
 * quede a la vista antes de entregar el equipo.
 */
function Resumen({
  obligatorias,
  sinComprobar,
  sinComprobarDeclarado,
  fallidas,
}: {
  obligatorias: number;
  sinComprobar: number;
  sinComprobarDeclarado: number;
  fallidas: number;
}) {
  const listo = sinComprobar === 0;
  return (
    <div className="flex items-center gap-2">
      {fallidas > 0 ? (
        <Badge
          tone="danger"
          title="Comprobaciones obligatorias que fallaron. Con una de estas, el equipo no debería entregarse todavía."
        >
          {fallidas === 1 ? "1 obligatoria que falló" : `${fallidas} obligatorias que fallaron`}
        </Badge>
      ) : null}

      {/* Lo declarado "no aplica" se muestra aparte, aunque también esté
          contado en `sinComprobar`. Es el único mecanismo con el que el técnico
          puede declarar que una puerta obligatoria no se comprobó, y esconderlo
          dentro de un número sería dejarle la puerta abierta sin que quede
          rastro. El rótulo dice que es una declaración suya, no un resultado. */}
      {sinComprobarDeclarado > 0 ? (
        <Badge
          tone="neutral"
          title="Marcadas como 'no aplica'. No cuentan como comprobadas: el catálogo las pide para esta variante y nadie las hizo. Queda a tu criterio si el equipo se entrega así."
        >
          {sinComprobarDeclarado === 1
            ? "1 obligatoria marcada no aplica"
            : `${sinComprobarDeclarado} obligatorias marcadas no aplica`}
        </Badge>
      ) : null}

      <Badge
        tone={sinComprobar > 0 ? "warning" : listo ? "success" : "neutral"}
        title={`${obligatorias} comprobaciones obligatorias para esta variante`}
      >
        {listo
          ? "Obligatorias comprobadas"
          : sinComprobar === 1
            ? "1 obligatoria sin comprobar"
            : `${sinComprobar} obligatorias sin comprobar`}
      </Badge>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Fila
// ---------------------------------------------------------------------------

function Fila({
  gate,
  estado,
  onMarcar,
}: {
  gate: VerificationGate;
  estado: GateEstado | undefined;
  onMarcar: (gateId: string, estado: GateEstado | null) => void;
}) {
  const vis = estado ? ESTADO_VISUAL[estado] : PENDIENTE;
  const Icono = vis.icono;
  const cob = coberturaGate(gate.id);

  return (
    <li className="border-b border-border/60 last:border-b-0">
      <button
        onClick={() => onMarcar(gate.id, siguiente(estado))}
        className="flex w-full items-start gap-3 px-2.5 py-2 text-left transition-colors hover:bg-surface-2/60"
        aria-label={`${gate.name}. Ahora está: ${vis.texto}. Apretar para cambiar.`}
      >
        <Icono
          size={15}
          strokeWidth={2.25}
          className={`mt-0.5 shrink-0 ${vis.clase}`}
          aria-hidden
        />

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
            <span className="text-body font-medium text-text">{gate.name}</span>
            <Badge tone={gate.blocking ? "warning" : "neutral"}>{gate.blocking ? "Obligatoria" : "Recomendada"}</Badge>
            {/* El estado va ESCRITO, no solo dibujado con el icono de la izquierda.
                El icono cambia de tono cuando la fila se marca, y un cambio de
                tono es justo lo que no se ve con daltonismo, de noche, o en la
                pantalla de un banco con la calibrada hecha years. Además el
                rótulo del botón ya lo dice, y un texto que existe solo para los
                lectores de pantalla no lo ve el técnico. */}
            {estado ? <Badge tone={vis.badge}>{vis.texto}</Badge> : null}
            {/* El tipo de comprobación se muestra siempre, en mono y en tenue.
                Agrupar por él es lo que convierte 16 renglones en cinco
                recorridos, y sin verlo el técnico tiene que leer las 16 para
                saber si se le olvidó una de cámara. */}
            <span className="tech ml-auto text-caption text-text-faint">
              {KIND_LABEL[gate.kind]}
            </span>
          </div>

          {/* Qué falta para dar esta puerta por buena. Va siempre visible y no
              en un tooltip: es la línea que evita que el técnico marque como
              comprobada una puerta que solo leyó a medias.

              El rótulo es "Falta:" y no el nombre del estado a propósito. Con el
              nombre del estado delante se leía "Comprobada: que aguante 3 minutos
              sin reiniciarse", que dice dos cosas contrarias en la misma línea y
              deja al técnico sin saber cuál manda. */}
          <p className="mt-0.5 text-small text-text-muted">
            <span className="tech text-caption text-text-faint">falta:</span>{" "}
            {cob?.falta ?? "El catálogo no explica esta comprobación. Toca hacerla a tu criterio."}
          </p>

          {/* Cuando hay sonda relacionada se dice cuál y que NO la resuelve. La
              columna derecha lo desarrolla; aquí basta para que nadie lea el
              verde de una sonda como el verde de esta puerta. */}
          {cob?.sonda ? (
            <p className="mt-1 inline-flex items-center gap-1.5 text-caption text-text-faint">
              <Stethoscope size={12} strokeWidth={1.75} aria-hidden />
              La sonda <span className="tech">{cob.sonda}</span> lee algo de esto,
              pero no la resuelve.
            </p>
          ) : null}
        </div>
      </button>
    </li>
  );
}

// ---------------------------------------------------------------------------
// Cobertura
// ---------------------------------------------------------------------------

/**
 * Qué parte de la lista puede cubrir el diagnóstico, con el estado en vivo.
 *
 * Se muestran SOLO las puertas que tienen sonda relacionada (son 3 o 4 de 16,
 * según la variante: `slot_health` solo la traen 291 de 763 y `verified_boot_state`
 * 590), y primero, porque esa es la información que evita el error caro. Las
 * demás se resumen en una línea: son las que el técnico tiene que hacer a mano,
 * y desarrollar cada una con su texto completo sería la pantalla completa.
 *
 * El estado de la sonda se muestra al lado de la puerta, no dentro de ella, y
 * nunca la marca. La sonda que pasa es un dato; la puerta comprobada es una
 * afirmación, y una herramienta no debe convertir la una en la otra.
 */
function CoberturaSondas({
  gates,
  probes,
}: {
  gates: VerificationGate[];
  probes: ProbeResult[];
}) {
  const conSonda = gates.filter((g) => coberturaGate(g.id)?.sonda);
  const porId = new Map(probes.map((p) => [p.id, p]));

  return (
    <Panel title="Qué cubre el diagnóstico" hint={`${conSonda.length} de ${gates.length}`} className="min-h-0 flex-1">
      <div className="p-3">
        <p className="text-small text-text-muted">
          De las {gates.length} comprobaciones de esta variante,{" "}
          <strong className="text-text">{conSonda.length}</strong> tienen una sonda del
          diagnóstico que lee algo relacionado. Las otras{" "}
          <strong className="text-text">{gates.length - conSonda.length}</strong> las
          tienes que hacer tú, con el equipo en la mesa.
        </p>

        <ul className="mt-3 space-y-3">
          {conSonda.map((g) => {
            const cob = coberturaGate(g.id)!;
            const p = porId.get(cob.sonda!);
            return (
              <li key={g.id} className="border-t border-border pt-3 first:border-t-0 first:pt-0">
                <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
                  <span className="tech text-body text-text">{cob.sonda}</span>
                  {p ? (
                    <Badge tone={PROBE_TONE[p.state]}>{PROBE_LABEL[p.state]}</Badge>
                  ) : (
                    <Badge tone="neutral">no ejecutada</Badge>
                  )}
                  <span className="text-small text-text-faint">→ {g.name}</span>
                </div>
                <p className="mt-1 text-small text-text-muted">
                  <span className="text-success">Cubre: </span>
                  {cob.cubre}
                </p>
                <p className="mt-0.5 text-small text-text-muted">
                  <span className="text-warning">Falta: </span>
                  {cob.falta}
                </p>
              </li>
            );
          })}
        </ul>

        <p className="mt-3 border-t border-border pt-3 text-caption text-text-faint">
          Ninguna sonda marca una casilla. Una comprobación la hace una persona,
          y una herramienta que la marcara por su cuenta estaría firmando una
          afirmación en nombre del taller.
        </p>
      </div>
    </Panel>
  );
}

// ---------------------------------------------------------------------------
// El descargo
// ---------------------------------------------------------------------------

/**
 * Lo que una casilla de esta lista NO prueba.
 *
 * Va en pantalla, y no solo en los comentarios del código, por la razón que ya
 * aparece en otras pantallas de esta app: el técnico ve la lista, marca las 16,
 * y se lleva una sensación de cobertura que la lista no tiene. Decirlo aquí,
 * una sola vez y en claro, es más barato que permitir que un cliente pregunte
 * por qué el informe no dice que se comprobó todo.
 */
function LoQueNoPrueba() {
  return (
    <Panel title="Lo que estas casillas no prueban">
      <ul className="space-y-2 p-3 text-small text-text-muted">
        <li className="flex gap-2">
          <span className="text-warning" aria-hidden>
            ·
          </span>
          <span>
            No son evidencia. Una casilla marcada es lo que el técnico{" "}
            <em>declara</em>, no lo que la herramienta midió: no hay comando detrás
            ni sello de tiempo.
          </span>
        </li>
        <li className="flex gap-2">
          <span className="text-warning" aria-hidden>
            ·
          </span>
          <span>
            No van en el informe firmado. El informe{" "}
            <em>sí</em> lista estas comprobaciones —eso viene del catálogo y es
            verificable— pero no dice cuáles se hicieron, justamente porque no
            puede comprobarlo.
          </span>
        </li>
        <li className="flex gap-2">
          <span className="text-warning" aria-hidden>
            ·
          </span>
          <span>
            No se guardan al cerrar la app. Lo que se guarda de verdad es la orden
            de trabajo, que todavía no existe; guardar marcas sueltas en disco
            sería un registro que nadie puede auditar.
          </span>
        </li>
        <li className="flex gap-2">
          <span className="text-warning" aria-hidden>
            ·
          </span>
          <span>
            El diagnóstico <em>no</em> las reemplaza. Que las sondas pasen no
            significa que estas comprobaciones estén hechas.
          </span>
        </li>
      </ul>
    </Panel>
  );
}
