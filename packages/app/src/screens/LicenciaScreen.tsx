/**
 * Pantalla Licencia: activación y estado del plan.
 * ===========================================================================
 *
 * Decisión de producto: NO hay servidor. La licencia es un archivo firmado
 * con Ed25519 que la app valida en local. Esto tiene tres consecuencias
 * buenas y una mala:
 *
 *   - El taller funciona sin internet. En un taller eso no es un extra, es
 *     un requisito.
 *   - No hay una base de datos de clientes que mantener ni que proteger.
 *   - No se puede revocar una licencia filtrada. Es el precio a pagar, y es
 *     aceptable para un producto de taller: se compra por confianza, no por
 *     ciclo de suscripción.
 *   - MALO: sin servidor no se puede cobrar renewal automático. El precio
 *     mensual se cobra cada vez, y eso hay que aceptarlo o montar el
 *     servidor después.
 *
 * Muestra el JSON crudo de la licencia a propósito. Es el artefacto de
 * confianza más valioso del producto: el técnico puede leer exactamente qué
 * compró.
 */

import { useEffect, useRef, useState } from "react";
import { KeyRound, Check, X, Copy, Terminal, AlertTriangle } from "lucide-react";
import type { LicenseState } from "@fixmyphone/core";
import { Button, Badge, Panel, DataRow } from "../components/primitives";

/** Lo que se está mostrando del último intento de copiar. */
type EstadoCopia = "idle" | "ok" | "error";

/**
 * Copia al portapapeles y avisa durante un rato y medio.
 *
 * Vive en un hook y no suelto porque hay dos sitios que copian: el id de este
 * equipo y los bloques de comando. Cuando eran dos, solo uno de los dos
 * escribía de verdad: el otro cambiaba un estado y ponía la palomita, así que el
 * técnico copiaba el comando, veía la palomita, lo pegaba en la terminal y
 * ejecutaba lo que ya había en el portapapeles de antes. El error aflora en la
 * terminal, no en la app, y con un mensaje que parece de la herramienta.
 *
 * El fallo se dice, y por eso existe el estado `error`. Si `navigator.clipboard`
 * no está o el permiso se niega, sale "no se pudo" en vez de dejar el botón
 * como estaba: el silencio se lee como "todavía no lo intenté", y un técnico que
 * cree que copió un comando va a pegarlo.
 *
 * El aviso se apaga solo y el temporizador se cancela al desmontar. Con cuatro
 * bloques en la misma pantalla, una palomita pegada deja al técnico sin saber
 * cuál de los cuatro copió hace un rato y cuál acaba de copiar.
 */
function useCopiar(): [EstadoCopia, (texto: string) => void] {
  const [estado, setEstado] = useState<EstadoCopia>("idle");
  const aviso = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (aviso.current) clearTimeout(aviso.current);
    };
  }, []);

  const copiar = (texto: string) => {
    const anotar = (nuevo: EstadoCopia) => {
      setEstado(nuevo);
      if (aviso.current) clearTimeout(aviso.current);
      aviso.current = setTimeout(() => setEstado("idle"), 1500);
    };

    const escritura = navigator.clipboard?.writeText(texto);
    if (!escritura) {
      anotar("error");
      return;
    }
    escritura.then(() => anotar("ok")).catch(() => anotar("error"));
  };

  return [estado, copiar];
}

export function LicenciaScreen({
  license,
  onActivate,
  onLoadFromDisk,
  cliHint,
}: {
  license: LicenseState;
  onActivate: (raw: string) => Promise<LicenseState>;
  onLoadFromDisk: () => Promise<LicenseState>;
  cliHint: string[];
}) {
  const [raw, setRaw] = useState("");
  const [busy, setBusy] = useState(false);
  const [copiado, copiar] = useCopiar();

  const premium = license.tier === "premium" && license.valid;

  const submit = async () => {
    if (!raw.trim()) return;
    setBusy(true);
    await onActivate(raw);
    setBusy(false);
    setRaw("");
  };

  return (
    <div className="grid h-full grid-cols-[minmax(0,1fr)_400px] gap-4 p-4">
      <div className="flex min-h-0 flex-col gap-4">
        {/* --- Estado actual ------------------------------------------- */}
        <Panel
          title="Plan actual"
          actions={
            <Badge tone={premium ? "brand" : "neutral"}>
              {premium ? "Premium" : "Gratis"}
            </Badge>
          }
        >
          <div className="p-4">
            <div className="flex items-start gap-3">
              <div
                className={
                  license.valid
                    ? "mt-0.5 text-success"
                    : license.tier === "premium"
                      ? "mt-0.5 text-danger"
                      : "mt-0.5 text-text-faint"
                }
              >
                {license.valid ? (
                  <Check size={18} strokeWidth={2.25} />
                ) : license.tier === "premium" ? (
                  <X size={18} strokeWidth={2.25} />
                ) : (
                  <KeyRound size={18} strokeWidth={1.75} />
                )}
              </div>
              <div className="min-w-0">
                <h1 className="text-display font-semibold tracking-tight">
                  {premium ? "Acceso Premium" : "Plan gratuito"}
                </h1>
                <p className="mt-1 max-w-prose text-body text-text-muted">
                  {premium
                    ? (license.subject ?? "Licencia premium activa.")
                    : "Diagnósticos limitados a 2 por día y con marca de agua en el informe."}
                </p>
                {license.reason ? (
                  <p className="mt-2 border-l-2 border-danger/50 pl-3 text-small text-danger">
                    {license.reason}
                  </p>
                ) : null}
              </div>
            </div>

            <div className="mt-4 border-t border-border pt-2">
              <DataRow label="Nivel">{license.tier}</DataRow>
              <DataRow label="Válida" tone={license.valid ? "success" : "danger"}>
                {license.valid ? "sí" : "no"}
              </DataRow>
              {license.subject ? <DataRow label="Titular">{license.subject}</DataRow> : null}
              {license.issuedAt ? (
                <DataRow label="Emitida">
                  {new Date(license.issuedAt).toLocaleDateString("es-MX")}
                </DataRow>
              ) : null}
              {license.expiresAt ? (
                <DataRow label="Vence">
                  {new Date(license.expiresAt).toLocaleDateString("es-MX")}
                </DataRow>
              ) : null}
              {license.dailyLimit ? (
                <DataRow label="Usados hoy">
                  {`${license.usedToday ?? 0} de ${license.dailyLimit}`}
                </DataRow>
              ) : null}
            </div>

            {/* --- Identificador de equipo ---------------------------------
                Va dentro del panel de estado y no en el de emisión porque es
                la única parte de esta pantalla que el técnico tiene que LEER
                EN VOZ ALTA a quien le vende la licencia. Está donde ya está
                mirando. */}
            {license.machine ? (
              <div className="mt-4 border-t border-border pt-4">
                <div className="flex items-center justify-between gap-3">
                  <span className="text-caption text-text-muted">
                    Id de este equipo
                  </span>
                  <button
                    onClick={() => copiar(license.machine!.id)}
                    className="text-text-faint transition-colors hover:text-text"
                    // Mismo criterio que los botones de copiar de abajo: la
                    // etiqueta cambia al copiar para que el lector de pantalla
                    // anuncie el resultado. El id de este equipo es lo que se
                    // lee en voz alta al activar una licencia, así que el
                    // técnico necesita saber si lo copió.
                    aria-label={
                      copiado === "ok"
                        ? "Id de equipo copiado"
                        : copiado === "error"
                          ? "Id de equipo: no se pudo copiar"
                          : "Copiar el id de equipo"
                    }
                  >
                    {copiado === "ok" ? (
                      <Check size={12} strokeWidth={2.5} className="text-success" />
                    ) : copiado === "error" ? (
                      <AlertTriangle size={12} strokeWidth={2.5} className="text-danger" />
                    ) : (
                      <Copy size={12} strokeWidth={1.75} />
                    )}
                  </button>
                </div>

                <p className="tech mt-1.5 text-body text-text">
                  {license.machine.id}
                </p>

                <p className="mt-2 text-caption text-text-faint">
                  Sale de tu cuenta de Windows y el serial de tu disco,{" "}
                  <span className="tech text-text-muted">
                    {license.machine.user} · {license.machine.volume}
                  </span>
                  . Si compras una licencia{" "}
                  <strong className="font-medium text-text-muted">atada</strong> a
                  este equipo, hay que pasarle este número. Si prefieres que
                  sirva en cualquier equipo, no la ates.
                </p>
                <p className="mt-1.5 text-caption text-text-faint">
                  Una licencia atada deja de funcionar si se reinstala Windows o
                  si se renombra la cuenta. Pídesela portátil si vas a
                  reinstalar.
                </p>
              </div>
            ) : null}

            {!premium ? (
              <div className="mt-4">
                <Button onClick={onLoadFromDisk}>Buscar licencia en disco</Button>
              </div>
            ) : null}
          </div>
        </Panel>

        {/* --- Activación ------------------------------------------------ */}
        <Panel
          title="Activar licencia"
          hint="pega el contenido del archivo .fmp"
        >
          <div className="p-4">
            <textarea
              value={raw}
              onChange={(e) => setRaw(e.target.value)}
              rows={5}
              spellCheck={false}
              placeholder='{"payload":"...","signature":"..."}'
              className={[
                "tech w-full resize-y rounded-md border border-border bg-bg p-3",
                "text-caption text-text placeholder:text-text-faint/60",
                "focus:border-brand focus:outline-none",
              ].join(" ")}
            />
            <div className="mt-3 flex items-center gap-2">
              <Button
                variant="primary"
                onClick={submit}
                disabled={busy || raw.trim().length === 0}
              >
                {busy ? "Verificando…" : "Activar"}
              </Button>
              <span className="text-caption text-text-faint">
                La verificación ocurre localmente. La clave privada nunca sale
                del taller que la emitió.
              </span>
            </div>
          </div>
        </Panel>
      </div>

      {/* --- Cómo emitir una licencia ----------------------------------- */}
      <Panel title="Emitir una licencia" hint="el taller lo hace con un comando">
        <div className="p-4">
          <p className="text-small text-text-muted">
            La clave privada se guarda en{" "}
            <span className="tech text-text">~/.fixmyphone/issuer.key</span>. Si
            ese archivo se pierde, las licencias emitidas antes dejan de poder
            firmarse.
          </p>

          <CodeBlock
            title="Crear la clave de emisión (una vez)"
            lines={["fmp-license keygen"]}
          />

          <CodeBlock
            title="Emitir una licencia premium"
            lines={cliHint}
          />

          {/* El bloque de atadura SOLO aparece donde hay un id que atar.
              En la demo web no lo hay: la huella sale de la cuenta de Windows y
              del serial del volumen, y el navegador no puede ver ninguno de los
              dos. Inventar un id para rellenar el hueco habria sido peor que
              callarse, y dejar el comando con un `<el-id-de-arriba>` que no
              apunta a nada es exactamente esa forma de inventar. */}
          {license.machine ? (
            <CodeBlock
              title="Atarla a un equipo (opcional)"
              // El id es el de ESTA maquina, el mismo que esta unas lineas mas
              // arriba. Poner uno de ejemplo fijo hacia que el tecnico lo copiara
              // tal cual, y la licencia emitida no serviria en su equipo: el
              // error mas caro del mundo y con un mensaje de rechazo que parece
              // de la app.
              lines={[
                "fmp-license machine-id",
                "fmp-license issue --tier premium \\",
                '  --subject "Taller Perez" --days 365 \\',
                `  --machine ${license.machine.id}`,
              ]}
            />
          ) : null}

          <CodeBlock
            title="Verificar una licencia a mano"
            lines={[
              "# --app es la que importa: dice si la app la acepta, no si la firma cuadra",
              "fmp-license verify licencia.fmp --app",
              "",
              "# Sin banderas, contra la clave local. No prueba nada sobre la app:",
              "fmp-license verify licencia.fmp",
              "",
              "# Y contra el equipo del cliente, para responder si funciona allá:",
              "fmp-license verify licencia.fmp --machine <id-del-cliente>",
            ]}
          />

          <p className="mt-3 text-caption text-text-faint">
            <Terminal size={11} strokeWidth={1.75} className="mr-1 inline align-[-1px]" />
            La clave pública viaja dentro de la app. La privada nunca.
          </p>
        </div>
      </Panel>
    </div>
  );
}

/**
 * Un bloque de comando con su botón de copiar.
 *
 * La copia la hace `useCopiar`, igual que el botón del id de equipo. Antes este
 * componente recibía `onCopy` y `copied` por prop y los cuatro handlers del
 * padre eran `() => setCopied("lo-que-sea)`: cambiaban el estado y no escribían
 * nada en el portapapeles. El botón ponía la palomita y mentía.
 */
function CodeBlock({ title, lines }: { title: string; lines: string[] }) {
  const [estado, copiar] = useCopiar();

  const etiqueta =
    estado === "ok"
      ? `${title}: copiado`
      : estado === "error"
        ? `${title}: no se pudo copiar`
        : `Copiar ${title.toLowerCase()}`;

  return (
    <div className="mt-4 first:mt-0">
      <div className="mb-1.5 flex items-center justify-between">
        <span className="text-caption text-text-muted">{title}</span>
        <button
          onClick={() => copiar(lines.join("\n"))}
          className="text-text-faint transition-colors hover:text-text"
          // El texto accesible cambia con el estado a propósito. Con un
          // `aria-label` fijo, quien usa lector de pantalla aprieta "Copiar" y no
          // se entera de si funcionó: el icono se vuelve palomita, y el icono no
          // se anuncia. Estos comandos se copian para pegarlos en otro lado,
          // así que no saber si se copiaron es no saber si puede seguir.
          aria-label={etiqueta}
        >
          {estado === "ok" ? (
            <Check size={12} strokeWidth={2.5} className="text-success" />
          ) : estado === "error" ? (
            <AlertTriangle size={12} strokeWidth={2.5} className="text-danger" />
          ) : (
            <Copy size={12} strokeWidth={1.75} />
          )}
        </button>
      </div>
      <pre className="log-line overflow-x-auto rounded-md border border-border bg-bg p-2.5 text-caption text-text-muted">
        {lines.join("\n")}
      </pre>
    </div>
  );
}
