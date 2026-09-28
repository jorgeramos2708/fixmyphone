/**
 * Cáscara de la aplicación: riel de navegación, barra de estado y marco.
 * ===========================================================================
 *
 * Decisión de diseño: esto es una HERRAMIENTA, no una app de consumo.
 * Los técnicos de taller la usan 8 horas al día, muchas veces con guantes y
 * frente a una pantalla con grietas. De ahí salen tres requisitos que no son
 * Ontology:
 *
 *   1. Densidad. Si la información cabe en 2/3 de la pantalla, sobra el 1/3.
 *   2. Navegación por teclado. Ctrl+1..4, Esc, Enter. El ratón es lo segundo.
 *   3. Una sola acción primaria por vista, arriba a la derecha, siempre en el
 *      mismo lugar. El técnico debe encontrarla sin buscar.
 */

import { useEffect, type ReactNode } from "react";
import {
  Usb,
  Stethoscope,
  FileText,
  KeyRound,
  History,
  Settings,
  Circle,
} from "lucide-react";
import type { ConnectedDevice, LicenseState, TransportKind } from "@fixmyphone/core";
import { Badge } from "./primitives";

export type RouteId = "equipo" | "diagnostico" | "informe" | "licencia";

interface NavItem {
  id: RouteId;
  label: string;
  icon: ReactNode;
  /** Atajo de teclado. Se muestra en la punta, estilo editor. */
  shortcut: string;
}

const NAV: NavItem[] = [
  { id: "equipo", label: "Equipo", icon: <Usb size={16} strokeWidth={1.75} />, shortcut: "1" },
  {
    id: "diagnostico",
    label: "Diagnóstico",
    icon: <Stethoscope size={16} strokeWidth={1.75} />,
    shortcut: "2",
  },
  { id: "informe", label: "Informe", icon: <FileText size={16} strokeWidth={1.75} />, shortcut: "3" },
];

// ---------------------------------------------------------------------------
// NavRail
// ---------------------------------------------------------------------------

function NavRail({
  route,
  onNavigate,
  license,
}: {
  route: RouteId;
  onNavigate: (r: RouteId) => void;
  license: LicenseState;
}) {
  return (
    <nav
      aria-label="Secciones"
      className="flex w-[200px] shrink-0 flex-col border-r border-border bg-surface"
    >
      {/* REGLA 5 del espaciado: 8px dentro del control, 32px entre grupos
          que no se pertenecen. Este bloque y el de abajo son dos grupos
          distintos, por eso hay 32px entre ellos y no 16. */}
      <div className="flex flex-col gap-0.5 p-3">
        {NAV.map((item) => {
          const active = route === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onNavigate(item.id)}
              aria-current={active ? "page" : undefined}
              className={[
                "group relative flex h-8 items-center gap-2.5 rounded-md px-2.5",
                "text-body transition-colors duration-[var(--motion-fast)]",
                "ease-[var(--motion-ease)]",
                active
                  ? "bg-surface-2 text-text"
                  : "text-text-muted hover:bg-surface-2/60 hover:text-text",
              ].join(" ")}
            >
              {/* Indicador activo: barra de 2px al borde. NO un rectángulo
                  naranja relleno — un acento por pantalla, y el relleno
                  completo compite con el botón de la acción principal. */}
              <span
                aria-hidden
                className={[
                  "absolute left-0 top-1/2 h-4 w-[2px] -translate-y-1/2 rounded-r",
                  "transition-colors duration-[var(--motion-fast)]",
                  active ? "bg-brand" : "bg-transparent",
                ].join(" ")}
              />
              <span className="optical-center">{item.icon}</span>
              <span className="flex-1 text-left">{item.label}</span>
              <kbd
                className={[
                  "font-mono text-[10px] leading-none",
                  active ? "text-text-faint" : "text-transparent",
                  "group-hover:text-text-faint",
                  "transition-colors duration-[var(--motion-fast)]",
                ].join(" ")}
              >
                {item.shortcut}
              </kbd>
            </button>
          );
        })}
      </div>

      {/* Zona flexible: empuja la licencia al fondo. */}
      <div className="flex-1" />

      <div className="flex flex-col gap-0.5 border-t border-border p-3">
        <button
          onClick={() => onNavigate("licencia")}
          className={[
            "flex h-8 items-center gap-2.5 rounded-md px-2.5 text-body",
            "transition-colors duration-[var(--motion-fast)]",
            route === "licencia"
              ? "bg-surface-2 text-text"
              : "text-text-muted hover:bg-surface-2/60 hover:text-text",
          ].join(" ")}
        >
          <span className="optical-center">
            <KeyRound size={16} strokeWidth={1.75} />
          </span>
          <span className="flex-1 text-left">Licencia</span>
          {/* El badge dice "Premium" y no "Pro". El nombre del nivel es
              `premium` en el codigo, en el informe, en la pantalla de licencia y
              en la CLI. Aqui decia "Pro", que es la palabra que se le ocurre a
              uno al vuelo, y el menu es justo donde se mira primero para
              saber en que plan se esta. Dos nombres para lo mismo invites a
              pensar que hay dos niveles. */}
          <Badge tone={license.tier === "premium" ? "brand" : "neutral"}>
            {license.tier === "premium" ? "Premium" : "Gratis"}
          </Badge>
        </button>

        {/* Inhabilitado a propósito. Un botón que no hace nada es peor que
            uno que no existe: hay que decir que está en camino. */}
        <button
          disabled
          title="Próximamente"
          className="flex h-8 cursor-not-allowed items-center gap-2.5 rounded-md px-2.5 text-body text-text-faint/50"
        >
          <span className="optical-center">
            <History size={16} strokeWidth={1.75} />
          </span>
          <span className="flex-1 text-left">Historial</span>
        </button>
      </div>
    </nav>
  );
}

// ---------------------------------------------------------------------------
// StatusBar
// ---------------------------------------------------------------------------

// El contrato guarda el transporte como token (adb, fastboot...); lo que se ve
// en la barra es la etiqueta en español, la misma voz que usa la escalera de
// identificación ("Conexión ADB", "Modo fastboot").
const TRANSPORT_LABEL: Record<TransportKind, string> = {
  adb: "Conexión ADB",
  fastboot: "Modo fastboot",
  recovery: "Modo recovery",
  simulated: "Conexión simulada",
};

function StatusBar({
  device,
  license,
  version,
}: {
  device: ConnectedDevice | null;
  license: LicenseState;
  version: string;
}) {
  const connected = device !== null;

  return (
    <footer
      className={[
        "flex h-7 shrink-0 items-center gap-4 border-t border-border bg-surface",
        "px-3 font-mono text-caption text-text-faint",
      ].join(" ")}
    >
      {/* Punto de estado: 6px, no un icono de 20px. En una barra de 28px de
          alto, un icono grande se siente fuera de lugar. */}
      <span className="flex items-center gap-1.5">
        <Circle
          size={6}
          strokeWidth={0}
          className={connected ? "fill-success text-success" : "fill-text-faint text-text-faint"}
        />
        <span className={connected ? "text-success" : ""}>
          {device ? TRANSPORT_LABEL[device.transport] : "sin equipo"}
        </span>
      </span>

      {connected ? (
        <>
          {device.battery ? (
            <span className="tabular-nums">
              {device.battery.levelPct}%{device.battery.charging ? " ⚡" : ""}
            </span>
          ) : null}

          <span className="text-text-faint/60">
            {new Date(device.connectedAt).toLocaleTimeString("es-MX", {
              hour: "2-digit",
              minute: "2-digit",
              second: "2-digit",
            })}
          </span>
        </>
      ) : null}

      <span className="flex-1" />

      {license.tier === "free" && license.dailyLimit ? (
        <span>
          {license.usedToday ?? 0}/{license.dailyLimit} diagnósticos hoy
        </span>
      ) : null}

      <span className="text-text-faint/60">v{version}</span>
    </footer>
  );
}

// ---------------------------------------------------------------------------
// AppShell
// ---------------------------------------------------------------------------

export function AppShell({
  route,
  onNavigate,
  device,
  license,
  version,
  onRefresh,
  children,
}: {
  route: RouteId;
  onNavigate: (r: RouteId) => void;
  device: ConnectedDevice | null;
  license: LicenseState;
  version: string;
  onRefresh: () => void;
  children: ReactNode;
}) {
  // Navegación por teclado. Un técnico con las dos manos ocupadas con el
  // equipo no debería tener que soltar el mouse para cambiar de sección.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (!e.ctrlKey || e.altKey || e.metaKey) return;
      const item = NAV.find((n) => n.shortcut === e.key);
      if (item) {
        e.preventDefault();
        onNavigate(item.id);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onNavigate]);

  return (
    <div className="flex h-screen flex-col bg-bg text-text">
      {/* --- Barra superior ------------------------------------------- */}
      <header
        className={[
          "flex h-11 shrink-0 items-center gap-3 border-b border-border",
          "bg-surface px-4",
          // electron-vite puede devolver el título nativo; en ese caso la
          // franja superior queda reservada para arrastre.
        ].join(" ")}
      >
        <div className="flex items-center gap-2">
          {/* Marca: un cuadrado con la letra, no un logo inventado. Un logo
              provisional que se puede reemplazar sin redibujar la app. */}
          <div className="flex h-5 w-5 items-center justify-center rounded-sm bg-brand text-[11px] font-bold text-brand-ink">
            F
          </div>
          <span className="text-body font-semibold tracking-tight">FixMyPhone</span>
          <span className="text-caption text-text-faint">·</span>
          <span className="text-caption text-text-faint">Taller</span>
        </div>

        <div className="flex-1" />

        <Badge tone={license.tier === "premium" ? "brand" : "neutral"}>
          {license.tier === "premium" ? "Premium" : "Gratis"}
        </Badge>

        <button
          onClick={onRefresh}
          title="Volver a detectar (F5)"
          aria-label="Volver a detectar"
          className="rounded-md p-1.5 text-text-muted transition-colors hover:bg-surface-2 hover:text-text"
        >
          <Settings size={15} strokeWidth={1.75} />
        </button>
      </header>

      {/* --- Cuerpo ---------------------------------------------------- */}
      <div className="flex min-h-0 flex-1">
        <NavRail route={route} onNavigate={onNavigate} license={license} />
        <main className="min-w-0 flex-1 overflow-hidden">{children}</main>
      </div>

      <StatusBar device={device} license={license} version={version} />
    </div>
  );
}
