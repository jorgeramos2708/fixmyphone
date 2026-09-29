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
  SaveReportResult,
  FmpBridge,
  InstallKeyInfo,
  GateChecks,
  GateEstado,
} from "@fixmyphone/core";
import { AppShell, type RouteId } from "./components/shell";
import { EquipoScreen } from "./screens/EquipoScreen";
import { DiagnosticoScreen } from "./screens/DiagnosticoScreen";
import { EntregaScreen } from "./screens/EntregaScreen";
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
  const [devices, setDevices] = useState<ConnectedDevice[]>([]);
  const [resolution, setResolution] = useState<Resolution | null>(null);
  const [probes, setProbes] = useState<ProbeResult[]>([]);
  const [license, setLicense] = useState<LicenseState>(FREE_TIER);
  const [scanning, setScanning] = useState(false);
  const [running, setRunning] = useState(false);
  /**
   * Identidad de firma de la instalación, y lo que pasó al último exportar.
   *
   * Se cargan aquí y no dentro de la pantalla de informe porque las dos las
   * necesitan: la huella se lee en la pantalla de licencia (antes de
   * exportar) y el resultado de la exportación se lee en la de informe
   * (después). Y vive en el padre, y no en la pantalla, porque un mensaje de
   * "se guardó sin firmar" que desaparece al cambiar de pestaña es un mensaje
   * que el técnico no va a ver: la advertencia existe para que la lea ANTES
   * de entregarle el archivo al cliente, y eso no puede depender de dónde esté
   * parado.
   */
  const [installKey, setInstallKey] = useState<InstallKeyInfo | null>(null);
  const [exportado, setExportado] = useState<SaveReportResult | null>(null);

  /**
   * Las comprobaciones de entrega, por variante y por puerta.
   *
   * Vive en el padre, y no dentro de la pantalla, por una razón práctica: las
   * pantallas se desmontan al cambiar de pestaña, así que un `useState` dentro
   * de `EntregaScreen` perdería las marcas en cuanto el técnico va al informe a
   * exportar y regresa. Una lista que se borra sola al cambiar de vista es una
   * lista que nadie usa dos veces.
   *
   * Se indexa por clave de variante y no por dispositivo. Dos equipos del
   * mismo taller no comparten lista: cada placa tiene la suya, y mezclarlas
   * haría que el técnico marcara en el Galaxy lo que comprobó en el Xiaomi.
   *
   * NO se persiste a disco, y es deliberado. Una casilla es una declaración, no
   * una medición, y guardarla sería crear un registro que nadie puede auditar
   * sin el modelo de orden de trabajo, que es lo que decide qué se guarda y con
   * qué valor. Ver `GateChecks` en `packages/core/src/bridge.ts`.
   */
  const [gates, setGates] = useState<Record<string, GateChecks>>({});

  // --- Carga inicial -------------------------------------------------------
  useEffect(() => {
    void bridge.license.current().then(setLicense);
    void bridge.installKey().then(setInstallKey);
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

  // --- Comprobaciones de entrega ------------------------------------------
  //
  // Se guardan por variante y solo se copia el objeto cuando hay un cambio real
  // (mismo estado que ya estaba): el estado de React es por referencia, y
  // devolver el mismo objeto evita un repintado de la lista entera de 16 filas.
  const marcarGate = useCallback(
    (variante: string, gateId: string, estado: GateEstado | null) => {
      setGates((prev) => {
        const deEsta = prev[variante] ?? {};
        if (deEsta[gateId] === (estado ?? undefined)) return prev;
        const n = { ...deEsta };
        if (estado === null) delete n[gateId];
        else n[gateId] = estado;
        return { ...prev, [variante]: n };
      });
    },
    [],
  );

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
    active && probes.length > 0
      ? {
          device: active,
          resolution: resolution ?? { match: null, ladder: [], alternatives: [] },
          probes,
          license,
          watermarked: !(license.tier === "premium" && license.valid),
        }
      : null;

  const exportReport = useCallback(async () => {
    if (!draft) return;
    // Se guarda el resultado COMPLETO, con `firmado` y el motivo. La versión
    // anterior lo descartaba con un `void`: el proceso principal ya decidía si
    // firma o no, se lo devolvía, y nadie lo leía. Un `ok: true` que no dice
    // si firmó es un informe que el técnico entrega creyendo que va firmado.
    const r = await bridge.saveReport(draft);
    setExportado(r);
    // La huella puede acabar de crearse con esta primera exportación, así que
    // se vuelve a leer. Esta consulta no crea nada: solo informa de lo que hay.
    void bridge.installKey().then(setInstallKey);
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

      {route === "entrega" ? (
        <EntregaScreen
          device={active}
          resolution={resolution}
          probes={probes}
          checks={(resolution?.match ? gates[resolution.match.key] : undefined) ?? {}}
          onMarcar={(gateId, estado) => {
            const variante = resolution?.match?.key;
            if (variante) marcarGate(variante, gateId, estado);
          }}
        />
      ) : null}

      {route === "informe" ? (
        <InformeScreen
          draft={draft}
          license={license}
          installKey={installKey}
          exportado={exportado}
          onExport={exportReport}
        />
      ) : null}

      {route === "licencia" ? (
        <LicenciaScreen
          license={license}
          installKey={installKey}
          onActivate={activate}
          onLoadFromDisk={loadFromDisk}
          cliHint={['fmp-license issue --tier premium \\', '  --subject "Taller Pérez" \\', '  --days 365 --out taller-perez.fmp']}
        />
      ) : null}
    </AppShell>
  );
}
