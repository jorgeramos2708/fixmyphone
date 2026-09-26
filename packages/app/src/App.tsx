/**
 * Raíz de la aplicación.
 * ===========================================================================
 *
 * Este componente no sabe si corre dentro de Electron o en un navegador.
 * Toma el puente de `window.fmp` y ya. Esa ignorancia es deliberada: es lo
 * que permite que la demo web y el `.exe` compartan el 100% del código de
 * interfaz sin derivaciones condicionales.
 */

import { useCallback, useEffect, useState } from "react";
import type {
  ConnectedDevice,
  Resolution,
  ProbeResult,
  LicenseState,
  LicenseEnvelope,
  ReportDraft,
  FmpBridge,
} from "@fixmyphone/core";
import { AppShell, type RouteId } from "./components/shell";
import { EquipoScreen } from "./screens/EquipoScreen";
import { DiagnosticoScreen } from "./screens/DiagnosticoScreen";
import { InformeScreen } from "./screens/InformeScreen";
import { LicenciaScreen } from "./screens/LicenciaScreen";

declare global {
  interface Window {
    fmp: FmpBridge;
  }
}

const FREE_TIER: LicenseState = {
  tier: "free",
  valid: true,
  usedToday: 0,
  dailyLimit: 2,
};

export function App({ bridge }: { bridge: FmpBridge }) {
  const [route, setRoute] = useState<RouteId>("equipo");
  const [device, setDevice] = useState<ConnectedDevice | null>(null);
  const [devices, setDevices] = useState<ConnectedDevice[]>([]);
  const [resolution, setResolution] = useState<Resolution | null>(null);
  const [probes, setProbes] = useState<ProbeResult[]>([]);
  const [license, setLicense] = useState<LicenseState>(FREE_TIER);
  const [scanning, setScanning] = useState(false);
  const [running, setRunning] = useState(false);

  // --- Carga inicial -------------------------------------------------------
  useEffect(() => {
    void bridge.license.current().then(setLicense);
    void bridge.listDevices().then(setDevices);
    return bridge.onDevice(setDevices);
  }, [bridge]);

  /**
   * El equipo "activo" es el primero conectado. Cuando hay varios en el
   * taller, mostrar el primero sin preguntar cuál es un error: el técnico
   * puede tener el Galaxy del cliente en el banco y el propio en el bolsillo.
   */
  const active = devices[0] ?? null;

  // --- Detección + resolución ---------------------------------------------
  const scan = useCallback(async () => {
    setScanning(true);
    setResolution(null);
    try {
      const list = await bridge.listDevices();
      setDevices(list);
      const d = list[0] ?? null;
      setDevice(d);
      if (d) {
        setResolution(await bridge.resolve(d.props, d.transport));
      }
    } finally {
      setScanning(false);
    }
  }, [bridge]);

  // Se resuelve solo cuando cambia el equipo activo. Es la acción que más
  // se repite en el taller, y no puede exigir un clic.
  useEffect(() => {
    if (!active) {
      setResolution(null);
      return;
    }
    let cancelled = false;
    setScanning(true);
    void bridge
      .resolve(active.props, active.transport)
      .then((r) => {
        if (!cancelled) setResolution(r);
      })
      .finally(() => {
        if (!cancelled) setScanning(false);
      });
    return () => {
      cancelled = true;
    };
  }, [active?.id, active?.connectedAt, bridge]);

  // --- Diagnóstico ---------------------------------------------------------
  const runProbes = useCallback(async () => {
    if (!active) return;
    setRunning(true);
    setProbes([]);
    try {
      await bridge.runProbes(active.id, (r) =>
        // Actualización fila por fila. El técnico ve avanzar el trabajo en
        // lugar de esperar a que termine todo.
        setProbes((prev) => {
          const i = prev.findIndex((p) => p.id === r.id);
          if (i === -1) return [...prev, r];
          const n = [...prev];
          n[i] = r;
          return n;
        }),
      );
    } finally {
      setRunning(false);
    }
  }, [active, bridge]);

  const stopProbes = useCallback(() => {
    setRunning(false);
  }, []);

  // --- Licencia ------------------------------------------------------------
  const activate = useCallback(
    async (raw: string): Promise<LicenseState> => {
      let env: LicenseEnvelope;
      try {
        env = JSON.parse(raw) as LicenseEnvelope;
      } catch {
        const s: LicenseState = { ...FREE_TIER, valid: false, reason: "El texto no es JSON válido." };
        setLicense(s);
        return s;
      }
      const s = await bridge.license.activate(env);
      setLicense(s);
      return s;
    },
    [bridge],
  );

  const loadFromDisk = useCallback(async () => {
    const s = await bridge.license.loadFromDisk();
    setLicense(s);
    return s;
  }, [bridge]);

  // --- Informe -------------------------------------------------------------
  const draft: ReportDraft | null =
    device && probes.length > 0
      ? {
          device,
          resolution: resolution ?? { match: null, ladder: [], alternatives: [] },
          probes,
          license,
          watermarked: !(license.tier === "premium" && license.valid),
        }
      : null;

  const exportReport = useCallback(() => {
    if (draft) void bridge.saveReport(draft);
  }, [bridge, draft]);

  return (
    <AppShell
      route={route}
      onNavigate={setRoute}
      device={active}
      license={license}
      version={bridge.version}
      onRefresh={scan}
    >
      {route === "equipo" ? (
        <EquipoScreen device={active} resolution={resolution} scanning={scanning} onScan={scan} />
      ) : null}

      {route === "diagnostico" ? (
        <DiagnosticoScreen
          device={active}
          probes={probes}
          running={running}
          onRun={runProbes}
          onStop={stopProbes}
        />
      ) : null}

      {route === "informe" ? (
        <InformeScreen draft={draft} license={license} onExport={exportReport} />
      ) : null}

      {route === "licencia" ? (
        <LicenciaScreen
          license={license}
          onActivate={activate}
          onLoadFromDisk={loadFromDisk}
          cliHint={['fmp-license issue --tier premium \\', '  --subject "Taller Pérez" \\', '  --days 365 --out taller-perez.fmp']}
        />
      ) : null}
    </AppShell>
  );
}
