/**
 * Pantalla Diagnóstico: las pruebas que leemos del equipo.
 * ===========================================================================
 *
 * Cada prueba responde a una pregunta que el técnico se hace en voz alta
 * antes de abrir un equipo. Por eso cada una lleva una explicación en
 * español llano, no un nombre de comando.
 *
 * "El comando no se ejecutó" NO es lo mismo que "el comando se ejecutó y no
 * detectó nada". La distinción importa: lo primero es un problema de la
 * herramienta, lo segundo es información del equipo. Por eso los estados son
 * pass / fail / skip y no un booleano.
 */

import { useEffect, useRef, useState } from "react";
import { Play, Check, X, Minus, Loader, ChevronRight, Square } from "lucide-react";
import type { ConnectedDevice, ProbeResult, ProbeState } from "@fixmyphone/core";
import { Button, Badge, Panel, EmptyState } from "../components/primitives";

const STATE_ICON: Record<ProbeState, { icon: typeof Check; tone: string }> = {
  pending: { icon: Minus, tone: "text-text-faint" },
  running: { icon: Loader, tone: "text-info animate-spin" },
  pass: { icon: Check, tone: "text-success" },
  fail: { icon: X, tone: "text-danger" },
  skip: { icon: Minus, tone: "text-text-faint" },
};

const STATE_LABEL: Record<ProbeState, string> = {
  pending: "Pendiente",
  running: "Ejecutando",
  pass: "Aprobó",
  fail: "Falló",
  skip: "Omitida",
};

const STATE_TONE: Record<ProbeState, "neutral" | "info" | "success" | "danger" | "warning"> = {
  pending: "neutral",
  running: "info",
  pass: "success",
  fail: "danger",
  skip: "warning",
};

export function DiagnosticoScreen({
  device,
  probes,
  running,
  onRun,
  onStop,
}: {
  device: ConnectedDevice | null;
  probes: ProbeResult[];
  running: boolean;
  onRun: () => void;
  onStop: () => void;
}) {
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const logRef = useRef<HTMLDivElement>(null);

  // El log se auto-desplaza SOLO si el técnico ya estaba al final. Si
  // retrocedió a leer algo, no le saltamos la vista.
  useEffect(() => {
    const el = logRef.current;
    if (!el) return;
    const atBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 40;
    if (atBottom) el.scrollTop = el.scrollHeight;
  }, [probes]);

  if (!device) {
    return (
      <EmptyState
        icon={<Play size={28} strokeWidth={1.5} />}
        title="Nada que diagnosticar todavía"
        body="Conecta un equipo en la pestaña Equipo. Las pruebas solo se ejecutan contra un dispositivo real o simulado, nunca contra nada."
      />
    );
  }

  const done = probes.filter((p) => p.state !== "pending" && p.state !== "running").length;
  const failed = probes.filter((p) => p.state === "fail").length;

  return (
    <div className="flex h-full flex-col gap-4 p-4">
      {/* Una sola acción primaria, arriba a la derecha, siempre en el mismo
          lugar. Es la regla que hace que el técnico no tenga que buscar. */}
      <header className="flex shrink-0 items-center gap-4">
        <div>
          <h1 className="text-h1 font-semibold tracking-tight">Diagnóstico</h1>
          <p className="text-caption text-text-faint">
            {probes.length === 0
              ? "Ninguna prueba ejecutada todavía. Presiona Ejecutar todo."
              : `${done} de ${probes.length} ejecutadas${failed ? ` · ${failed} con falla` : ""}`}
          </p>
        </div>
        <div className="flex-1" />
        {running ? (
          <Button variant="danger" size="md" icon={<Square size={13} strokeWidth={2} />} onClick={onStop}>
            Detener
          </Button>
        ) : (
          <Button
            variant="primary"
            size="md"
            icon={<Play size={13} strokeWidth={2} />}
            onClick={onRun}
            disabled={running}
          >
            Ejecutar todo
          </Button>
        )}
      </header>

      <div className="grid min-h-0 flex-1 grid-cols-[minmax(0,1fr)_minmax(320px,420px)] gap-4">
        {/* --- Lista de pruebas ------------------------------------------ */}
        <Panel title="Pruebas" hint={running ? "en curso" : undefined}>
          {probes.length === 0 ? (
            <EmptyState
              title="Todavía no hay pruebas en esta lista"
              body="Presiona 'Ejecutar todo' para correr las sondas de este transporte. Si la lista sigue vacía después de ejecutar, el transporte no tiene sondas (por ejemplo, ADB sin un Android encendido que conteste)."
            />
          ) : (
            <ul className="p-1.5">
              {probes.map((p) => {
                const s = STATE_ICON[p.state];
                const Icon = s.icon;
                const isOpen = expanded.has(p.id);
                return (
                  <li key={p.id}>
                    <button
                      onClick={() =>
                        setExpanded((prev) => {
                          const n = new Set(prev);
                          n.has(p.id) ? n.delete(p.id) : n.add(p.id);
                          return n;
                        })
                      }
                      className="flex w-full items-start gap-3 rounded-md px-2.5 py-2 text-left transition-colors hover:bg-surface-2/60"
                    >
                      <Icon
                        size={15}
                        strokeWidth={2.25}
                        className={`mt-0.5 shrink-0 ${s.tone}`}
                      />

                      <div className="min-w-0 flex-1">
                        <div className="flex items-baseline gap-2">
                          <span className="text-body font-medium text-text">{p.id}</span>
                          <Badge tone={STATE_TONE[p.state]}>{STATE_LABEL[p.state]}</Badge>
                          {p.durationMs !== undefined ? (
                            <span className="tech text-caption text-text-faint">
                              {p.durationMs} ms
                            </span>
                          ) : null}
                        </div>
                        <p className="mt-0.5 text-small text-text-muted">{p.explanation}</p>

                        {isOpen && p.raw ? (
                          <pre className="log-line mt-2 max-h-48 overflow-auto rounded-sm border border-border bg-bg p-2 text-caption text-text-muted">
                            {p.raw}
                          </pre>
                        ) : null}
                      </div>

                      {p.raw ? (
                        <ChevronRight
                          size={14}
                          strokeWidth={1.75}
                          className={`mt-0.5 shrink-0 text-text-faint transition-transform duration-[var(--motion-fast)] ${
                            isOpen ? "rotate-90" : ""
                          }`}
                        />
                      ) : null}
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </Panel>

        {/* --- Log en vivo ------------------------------------------------
            Monoespaciada, una línea por evento, sin envolver. El técnico
            lee esto con el scroll; que una línea se parta es un defecto. */}
        <Panel title="Registro" hint="en vivo">
          <div ref={logRef} className="h-full overflow-auto py-2">
            {probes.filter((p) => p.command).length === 0 ? (
              <p className="px-4 text-caption text-text-faint">
                El registro aparece aquí al ejecutar.
              </p>
            ) : (
              probes
                .filter((p) => p.command)
                .map((p) => (
                  <div key={p.id} className="log-line text-text-muted">
                    <span
                      className={
                        p.state === "fail"
                          ? "text-danger"
                          : p.state === "pass"
                            ? "text-success"
                            : "text-text-faint"
                      }
                    >
                      {p.state === "pass" ? "✓" : p.state === "fail" ? "✗" : "·"}
                    </span>{" "}
                    {p.command}
                  </div>
                ))
            )}
          </div>
        </Panel>
      </div>
    </div>
  );
}
