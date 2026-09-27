/**
 * Pantalla Equipo: identidad del dispositivo y sus propiedades.
 * ===========================================================================
 *
 * El principio de esta pantalla es que la app muestre SU RAZONAMIENTO.
 *
 * La mayoria del software de taller te dice "Samsung SM-A546B, ahora hazle
 * lo que quieras". Eso es exactamente el escenario peligroso: si el match es
 * incorrecto, el técnico flashea la imagen de la placa que no lleva y bricks
 * un equipo que entro funcionando.
 *
 * Aqui, en cambio:
 *   - Se muestra la escalera de identificacion: que dato dio que nivel.
 *   - Se muestra la procedencia de cada dato critico, con su confianza.
 *   - Si hay duda, se dice. Se ofrecen candidatos y se pide confirmacion.
 *     Nunca se adivina en silencio.
 */

import { useState } from "react";
import {
  Usb,
  Check,
  Copy,
  CircleHelp,
  ShieldAlert,
  ShieldCheck,
  Cpu,
} from "lucide-react";
import { partitionScheme, has, TOOLTIP_HOMOLOGACION } from "@fixmyphone/core";
import type { ConnectedDevice, DeviceVariant, HomologadoIft, Resolution } from "@fixmyphone/core";
import { Button, Badge, Panel, DataRow, EmptyState } from "../components/primitives";

/**
 * Cómo se ve cada estado de homologación en pantalla.
 *
 * Solo `homologado` lleva el tono de confirmación. Los otros tres se ven
 * distintos entre sí a propósito: `sin_verificar` significa que se buscó y no
 * salió, `desconocido` que no se buscó, y confundirlos en pantalla haría que un
 * Samsung (nunca buscado) se viera igual que un Motorola que sí se buscó y no
 * apareció en la tabla. No es un matiz: es la diferencia entre "no hay dato" y
 * "hay un dato negativo".
 *
 * `sin_verificar` NO usa el tono de peligro. El equipo no está en la tabla de la
 * marca, y eso no es una falla del equipo ni una señal de que abrirlo sea riesgoso
 * por el IFT: es que la marca no lo publica. Ponerlo en rojo enseñaría al técnico
 * a desconfiar de un equipo reparable, que es el error que cuesta clientes.
 *
 * LAS ETIQUETAS TIENEN QUE SOSTENERSE SOLAS
 * ----------------------------------------
 * La etiqueta de cada estado dice SI se buscó o NO, sin depender del tooltip. No
 * es dejadez: `sin_verificar` ya se veía como "No encontrado en el padrón IFT" y
 * `desconocido` como "Sin verificar", que en español se leen casi igual y
 * significan lo contrario. "Sin verificar" parece un resultado negativo, y lo
 * que realmente significa es que nadie buscó. Esa es justo la confusión que los
 * cuatro estados existen para evitar, y se había colado de vuelta en el texto.
 *
 * El tooltip además es `title`, que solo existe para el ratón: quien navega con
 * teclado no lo lee. Por eso la explicación va también en la fila, en letra
 * chica y siempre visible.
 */
const tonoHomologacion: Record<
  HomologadoIft,
  { texto: string; tono: "success" | "warning" | "neutral" | "danger"; explica: string }
> = {
  homologado: {
    texto: "Homologado por el IFT",
    tono: "success",
    explica: "El modelo aparece en la tabla de certificados que publica la marca.",
  },
  sin_verificar: {
    texto: "No está en el padrón del IFT",
    tono: "warning",
    explica: "Se buscó en la tabla de la marca y este modelo no aparece. No significa que el equipo sea ilegal ni que no se pueda reparar.",
  },
  desconocido: {
    texto: "No se ha buscado",
    tono: "neutral",
    explica: "No hay una tabla de certificados del IFT accesible para esta marca, así que no se buscó. No es un resultado negativo.",
  },
  no_soportado: {
    texto: "No soportado",
    tono: "danger",
    explica: "Alguien en el equipo decidió que este modelo queda fuera del alcance de la herramienta.",
  },
};

/**
 * Lo que el catálogo afirma que esta variante puede hacer.
 *
 * Se consulta con `has()` y NO con `includes()` directo: el helper lleva un
 * Set cacheado por variante, y en una lista de 20+ capacidades con 734
 * variantes la diferencia se nota. Además deja el criterio en un solo lugar.
 *
 * Solo se muestran las que el técnico usa para decidir, no las 23. Mostrar
 * todo es lo mismo que no mostrar nada.
 */
const CAPS_RELEVANTES: Array<{ cap: string; label: string; help: string }> = [
  { cap: "unlock_official", label: "Desbloqueo oficial", help: "Método propio del fabricante para abrir el bootloader." },
  { cap: "odin_download", label: "Odin", help: "Descarga de firmware con Odin." },
  { cap: "edl", label: "EDL", help: "Modo de programación de Qualcomm." },
  { cap: "recovery", label: "Recovery", help: "Tiene partición de recovery propia." },
  { cap: "fastbootd", label: "Fastbootd", help: "Fastboot con particiones dinámicas activas." },
  { cap: "brom", label: "BROM", help: "Modo de programación de MediaTek." },
  { cap: "hitool", label: "HiTool", help: "Modo de programación de HiSilicon." },
  { cap: "ota", label: "OTA", help: "Actualizaciones over-the-air." },
  { cap: "official_rom_flash", label: "ROM oficial", help: "Se puede reinstalar el firmware de fábrica." },
  { cap: "battery_health_read", label: "Salud de batería", help: "Podemos leer el estado real de la celda." },
  { cap: "storage_health_read", label: "Salud de almacenamiento", help: "Podemos leer SMART del almacenamiento." },
  { cap: "thermal_read", label: "Temperatura", help: "Podemos leer sensores térmicos." },
];

function Capabilities({ v }: { v: DeviceVariant }) {
  const presentes = CAPS_RELEVANTES.filter((c) => has(v, c.cap));
  if (presentes.length === 0) return null;

  return (
    <div>
      <span className="tech-label">Lo que el catálogo afirma</span>
      <div className="mt-1.5 flex flex-wrap gap-1.5">
        {presentes.map((c) => (
          <Badge key={c.cap} tone="neutral" title={c.help}>
            <Check size={10} strokeWidth={3} className="text-success" />
            {c.label}
          </Badge>
        ))}
      </div>
      <p className="mt-2 text-caption text-text-faint">
        {presentes.length} de {CAPS_RELEVANTES.length} capacidades declaradas. El
        resto no está registrado para esta variante: no es que no se pueda, es
        que nadie lo confirmó.
      </p>
    </div>
  );
}

/** De dónde salieron los datos de esta variante. */
function Sources({ v }: { v: DeviceVariant }) {
  if (v.sources.length === 0) return null;
  return (
    <p className="text-caption text-text-faint">
      Fuentes: {v.sources.join(" · ")}
    </p>
  );
}
export function EquipoScreen({
  device,
  resolution,
  scanning,
  onScan,
}: {
  device: ConnectedDevice | null;
  resolution: Resolution | null;
  scanning: boolean;
  onScan: () => void;
}) {
  if (!device) {
    return (
      <EmptyState
        icon={<Usb size={28} strokeWidth={1.5} />}
        title="Ningún equipo detectado"
        body={
          <>
            Conecte el equipo por USB y active la depuración USB. Si ya lo
            hizo, el problema casi siempre es el driver: en Samsung hay que
            instalar <span className="tech text-text">Samsung USB Driver</span>, no
            el genérico de Google.
          </>
        }
        action={
          <Button variant="primary" size="md" onClick={onScan} disabled={scanning}>
            {scanning ? "Buscando…" : "Buscar equipos"}
          </Button>
        }
      />
    );
  }

  return (
    <div className="grid h-full grid-cols-[minmax(0,1fr)_380px] gap-4 p-4">
      <IdentityColumn device={device} resolution={resolution} scanning={scanning} />
      <PropertiesColumn device={device} />
    </div>
  );
}

// ---------------------------------------------------------------------------
// Columna izquierda: identidad
// ---------------------------------------------------------------------------

function IdentityColumn({
  device,
  resolution,
  scanning,
}: {
  device: ConnectedDevice;
  resolution: Resolution | null;
  scanning: boolean;
}) {
  const [copied, setCopied] = useState(false);

  if (scanning) {
    return (
      <Panel title="Identificando">
        <div className="p-4">
          <p className="text-body text-text-muted">
            Leyendo propiedades y cruzándolas contra el catálogo…
          </p>
          <div className="mt-3 space-y-1.5">
            {["ro.product.device", "ro.product.model", "ro.build.fingerprint"].map((p, i) => (
              <div
                key={p}
                className="log-line rounded-sm bg-surface-2 text-text-faint"
                style={{ opacity: 1 - i * 0.3 }}
              >
                {`> getprop ${p}`}
              </div>
            ))}
          </div>
        </div>
      </Panel>
    );
  }

  if (!resolution) return null;

  const v: DeviceVariant | null = resolution.match;
  // El esquema de particiones sale de las capacidades declaradas, no de un
  // campo aparte: es lo que el pipeline deriva y lo que hay que mostrar.
  const scheme = v ? partitionScheme(v) : null;

  // --- Sin coincidencia: el caso honesto ---------------------------------
  if (!v) {
    return (
      <Panel title="Identificación" hint="sin coincidencia en el catálogo">
        <div className="p-4">
          <div className="flex items-start gap-3">
            <CircleHelp size={18} strokeWidth={1.75} className="mt-0.5 shrink-0 text-warning" />
            <div className="min-w-0">
              <h3 className="text-h1 font-semibold">No reconocimos este equipo</h3>
              <p className="mt-2 max-w-prose text-body text-text-muted">
                Leímos{" "}
                <span className="tech text-text">
                  {device.props["ro.product.device"] ?? "—"}
                </span>{" "}
                y{" "}
                <span className="tech text-text">{device.props["ro.product.model"] ?? "—"}</span>
                , pero el catálogo no tiene una variante que coincida.{" "}
                <strong className="text-text">
                  No vamos a adivinar.
                </strong>{" "}
                Un match incorrecto manda a flashear la imagen de la placa
                equivocada.
              </p>
            </div>
          </div>

          {resolution.unresolvedReason ? (
            <p className="mt-4 border-l-2 border-border-strong pl-3 text-small text-text-faint">
              {resolution.unresolvedReason}
            </p>
          ) : null}

          {resolution.ladder.length > 0 ? (
            <div className="mt-6">
              <Ladder resolution={resolution} />
            </div>
          ) : null}
        </div>
      </Panel>
    );
  }

  // --- Con coincidencia ---------------------------------------------------
  return (
    <div className="flex min-h-0 flex-col gap-4">
      <Panel
        title="Identificación"
        hint={`confianza ${(resolution.ladder.at(-1)?.confidence ?? 0).toFixed(2)}`}
      >
        <div className="p-4">
          {/* Nombre comercial: grande, porque es lo que el técnico ve en la
              etiqueta del sobre de trabajo. */}
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0">
              <h1 className="text-display font-semibold leading-tight tracking-tight">
                {v.marketingName}
              </h1>
              {/* La marca va sobre el nombre comercial porque "moto g05" sin
                  marca no dice nada: hay equipos de tres fabricantes con el
                  mismo nombre de venta. Sale de `vendorNombre` y no de `vendor`,
                  que es la clave con la que se cruza y va en minúscula. */}
              {v.vendorNombre ? (
                <p className="mt-0.5 text-body text-text-muted">{v.vendorNombre}</p>
              ) : null}
              {/* La variante SIEMPRE se muestra completa. "A54" no basta:
                  hay dos placas distintas detrás de ese nombre. */}
              <button
                onClick={() => {
                  void navigator.clipboard?.writeText(v.key);
                  setCopied(true);
                  setTimeout(() => setCopied(false), 1200);
                }}
                className="tech group mt-1.5 inline-flex items-center gap-1.5 text-body text-brand hover:underline"
                title="Copiar variante"
              >
                {v.key}
                {copied ? (
                  <Check size={12} strokeWidth={2.5} />
                ) : (
                  <Copy size={12} strokeWidth={1.75} className="opacity-0 group-hover:opacity-100" />
                )}
              </button>
            </div>

            <div className="flex shrink-0 flex-col items-end gap-2">
              <Badge
                tone={scheme === "a_only" ? "warning" : "neutral"}
                title={
                  scheme === null
                    ? "El catálogo no declara el esquema de particiones para esta variante"
                    : scheme === "a_b"
                      ? "Particiones A/B: hay dos ranuras de arranque"
                      : "Solo una partición de arranque: un borrado mal dirigido deja el equipo sin arranque"
                }
              >
                {scheme === "a_only" ? "Solo A" : scheme === "a_b" ? "A/B" : "A/B ?"}
              </Badge>
              {v.androidVersion ? (
                <span className="text-caption text-text-faint">
                  Android {v.androidVersion}
                </span>
              ) : null}
            </div>
          </div>

          {/* SoC: el dato que decide qué imagen es válida. Por eso va con
              icono y con su procedencia, no como una fila más. */}
          <div className="mt-4 flex items-center gap-2 border-t border-border pt-4">
            <Cpu size={15} strokeWidth={1.75} className="shrink-0 text-text-faint" />
            <span className="tech-label mr-1">SoC</span>
            <span className="tech text-body text-text">{v.soc ?? "desconocido"}</span>
            {v.socVendor ? (
              <Badge tone="neutral" title="Familia de SoC">
                {v.socVendor}
              </Badge>
            ) : null}
            <div className="flex-1" />
            {v.modelNumbers.length > 0 ? (
              <span className="text-caption text-text-faint">
                {v.modelNumbers.length} números de modelo
              </span>
            ) : null}
          </div>

          {/* Homologación IFT. Va con su texto de estado y no solo con una
              marca de color, porque "no está en el padrón" y "no se ha buscado"
              son cosas distintas y el técnico tiene que poder leer cuál es cuál
              sin interpretar un tono.

              La explicación va debajo y a la vista, no en el `title` del badge.
              Un `title` solo se lee con el ratón encima, y esta es la fila donde
              más importa que se entienda: es la que dice si el dato es
              negativo o es que nadie lo buscó. */}
          <div className="mt-3 border-t border-border pt-4">
            <div className="flex items-center gap-2">
              <ShieldCheck size={15} strokeWidth={1.75} className="shrink-0 text-text-faint" />
              <span className="tech-label mr-1">IFT</span>
              <Badge tone={tonoHomologacion[v.homologadoIft].tono}
                      title={TOOLTIP_HOMOLOGACION[v.homologadoIft]}>
                {tonoHomologacion[v.homologadoIft].texto}
              </Badge>
              {v.iftCertificado ? (
                <span className="tech text-caption text-text-faint">{v.iftCertificado}</span>
              ) : null}
            </div>
            <p className="mt-1.5 pl-[3.375rem] text-caption text-text-faint">
              {tonoHomologacion[v.homologadoIft].explica}
            </p>
          </div>

          <div className="mt-4 border-t border-border pt-4">
            <Capabilities v={v} />
          </div>

          <div className="mt-3">
            <Sources v={v} />
          </div>
        </div>
      </Panel>

      {v.riskFlags.length > 0 ? (
        <RiskFlags flags={v.riskFlags} />
      ) : null}

      <div className="min-h-0 flex-1">
        <Ladder resolution={resolution} />
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Escalera de identificación
// ---------------------------------------------------------------------------

function Ladder({ resolution }: { resolution: Resolution }) {
  return (
    <Panel title="Cómo lo identificamos" hint="evidencia acumulada">
      <ol className="p-2">
        {resolution.ladder.map((step) => (
          <li
            key={step.level}
            className="flex items-start gap-3 rounded-md px-2 py-2 hover:bg-surface-2/50"
          >
            {/* Nivel: monoespaciada y con ancho fijo para que la columna
                no se baile. Es un número, se lee como dato. */}
            <span className="tech w-6 shrink-0 pt-0.5 text-caption text-text-faint">
              L{step.level}
            </span>

            <div className="min-w-0 flex-1">
              <div className="flex items-baseline gap-2">
                <span className="text-small font-medium text-text">{step.name}</span>
                <span className="tech text-caption text-text-faint">
                  {(step.confidence * 100).toFixed(0)}%
                </span>
              </div>
              <div className="tech mt-0.5 truncate text-caption text-text-muted">
                {step.evidence}
              </div>
            </div>

            {/* Barra de confianza: sutil, a la derecha. Nunca un anillo
                de progreso — aquí no hay progreso, hay certeza. */}
            <span
              className="mt-1.5 h-1 w-12 shrink-0 overflow-hidden rounded-full bg-surface-3"
              title={`${(step.confidence * 100).toFixed(0)}% de confianza`}
            >
              <span
                className={
                  step.confidence >= 0.8
                    ? "block h-full bg-success"
                    : step.confidence >= 0.5
                      ? "block h-full bg-warning"
                      : "block h-full bg-danger"
                }
                style={{ width: `${step.confidence * 100}%` }}
              />
            </span>
          </li>
        ))}
      </ol>
    </Panel>
  );
}

// ---------------------------------------------------------------------------
// Riesgo
// ---------------------------------------------------------------------------

const FLAG_COPY: Record<string, string> = {
  edl_requires_signed_programmer:
    "Programar en EDL exige un paquete de programmers firmado. Sin las claves del fabricante, entrar a EDL no sirve para nada.",
  pre_install_required:
    "Hay que devolver el equipo a un firmware específico ANTES de flashear. Flashear directo desde aquí deja el equipo sin arranque.",
  recovery_flash_target_is:
    "La partición de recovery en este equipo tiene otro nombre. Escribir en la partición equivocada no flashea nada y puede pisar datos.",
  samsung_knox_eFuse_risk_on_unlock:
    "El contador Knox se funde con eFuse al desbloquear el bootloader. Es irreversible y el cliente lo pierde aunque el equipo funcione.",
  odin_requires_signed_secure_package:
    "Odin solo acepta paquetes firmados con la clave del operador. Un firmware sin firma no se puede enviar por este método.",
  no_edl_on_tensor_oem_key_signed:
    "Tensor con firma de fabricante: no hay modo EDL. El método de programación que se usaba con los Pixel antiguos ya no existe.",
  brom_requires_da_agent:
    "El modo BROM de MediaTek exige el agente DA. Sin él no hay comunicación con el equipo.",
  hisilicon_download_unsupported_on_new_soc:
    "El método de descarga de HiSilicon ya no funciona en los SoC nuevos. Se necesita otro método.",
};

/**
 * Divide una bandera con sufijo. `pre_install_required:shinano` es una sola
 * bandera: la parte izquierda explica el riesgo, la derecha dice de qué
 * equipo se trata. Mostrarlas juntas sin separarlas pierde el dato útil.
 */
function splitFlag(flag: string): { base: string; suffix: string | null } {
  const i = flag.indexOf(":");
  return i === -1
    ? { base: flag, suffix: null }
    : { base: flag.slice(0, i), suffix: flag.slice(i + 1) };
}


function RiskFlags({ flags }: { flags: string[] }) {
  return (
    <div className="panel border-warning/30 bg-warning-subtle/40">
      <div className="flex items-center gap-2 border-b border-warning/20 px-4 py-2">
        <ShieldAlert size={15} strokeWidth={1.75} className="text-warning" />
        <h2 className="text-small font-semibold text-warning">Antes de tocar nada</h2>
        <Badge tone="warning">{flags.length}</Badge>
      </div>
      <ul className="space-y-2.5 p-4">
        {flags.map((f) => {
          const { base, suffix } = splitFlag(f);
          return (
            <li key={f} className="flex items-start gap-2.5">
              <span className="tech mt-0.5 shrink-0 text-caption text-warning">{base}</span>
              <span className="text-small text-text-muted">
                {FLAG_COPY[base] ??
                  "Riesgo registrado por el catálogo. Revísalo antes de proceder."}
                {suffix ? (
                  <>
                    {" "}
                    <span className="tech text-caption text-warning">({suffix})</span>
                  </>
                ) : null}
              </span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Columna derecha: propiedades crudas
// ---------------------------------------------------------------------------

function PropertiesColumn({ device }: { device: ConnectedDevice }) {
  const entries = Object.entries(device.props)
    .filter(([, v]) => v !== undefined && v !== "")
    .sort(([a], [b]) => a.localeCompare(b));

  // Las de primero son las que decide el match. El técnico quiere verlas
  // arriba, no escudriñar 40 filas en busca de la que importa.
  const CRITICAL = new Set([
    "ro.product.device",
    "ro.product.vendor.device",
    "ro.product.model",
    "ro.product.manufacturer",
    "ro.build.fingerprint",
    "ro.boot.hardware",
  ]);

  const [showAll, setShowAll] = useState(false);
  const critical = entries.filter(([k]) => CRITICAL.has(k));
  const rest = entries.filter(([k]) => !CRITICAL.has(k));
  const visible = showAll ? entries : [...critical, ...rest.slice(0, 8)];

  return (
    <Panel
      title="Propiedades leídas"
      hint={`${entries.length} valores`}
      actions={
        <Button variant="ghost" onClick={() => setShowAll((s) => !s)}>
          {showAll ? "Contraer" : "Ver todas"}
        </Button>
      }
    >
      <div className="py-1">
        {visible.map(([k, v]) => (
          <DataRow key={k} label={k}>
            {v}
          </DataRow>
        ))}
      </div>
      {!showAll && rest.length > 8 ? (
        <div className="border-t border-border px-4 py-2 text-caption text-text-faint">
          y {rest.length - 8} más
        </div>
      ) : null}
    </Panel>
  );
}
