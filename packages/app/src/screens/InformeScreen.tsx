/**
 * Pantalla Informe: el artefacto que el cliente se lleva.
 * ===========================================================================
 *
 * El informe es la prueba de que el trabajo se hizo. Por eso tiene que
 * sobrevivir a una disputa: muestra qué se leyó, de dónde salió cada dato, qué
 * se encontró y qué NO se pudo verificar. Un informe que solo dice "OK" no
 * sirve para nada cuando el cliente vuelve en dos semanas.
 *
 * REGLA: lo que no se pudo verificar se declara como no verificado. Nunca se
 * rellena el hueco con un valor plausible.
 */

import { Printer, ShieldCheck, AlertTriangle } from "lucide-react";
import type { ReportDraft, LicenseState } from "@fixmyphone/core";
import { Button, Badge, Panel, DataRow, EmptyState } from "../components/primitives";

export function InformeScreen({
  draft,
  license,
  onExport,
}: {
  draft: ReportDraft | null;
  license: LicenseState;
  onExport: () => void;
}) {
  if (!draft) {
    return (
      <EmptyState
        icon={<Printer size={28} strokeWidth={1.5} />}
        title="Todavía no hay informe"
        body="Ejecuta al menos un diagnóstico y el informe se arma solo: identificación del equipo, resultados y hallazgos en un solo documento."
      />
    );
  }

  const { device, resolution, probes, watermarked } = draft;
  const variant = resolution.match;
  const failed = probes.filter((p) => p.state === "fail");
  const skipped = probes.filter((p) => p.state === "skip");

  return (
    <div className="flex h-full flex-col gap-4 p-4">
      <header className="flex shrink-0 items-center gap-4">
        <div>
          <h1 className="text-h1 font-semibold tracking-tight">Informe</h1>
          <p className="text-caption text-text-faint">
            {probes.length} pruebas · {failed.length} con falla · {skipped.length} omitidas
          </p>
        </div>
        <div className="flex-1" />
        <Button
          variant="primary"
          size="md"
          icon={<Printer size={13} strokeWidth={2} />}
          onClick={onExport}
        >
          Exportar
        </Button>
      </header>

      <div className="grid min-h-0 flex-1 grid-cols-[minmax(0,1fr)_340px] gap-4">
        {/* --- Cuerpo del informe ---------------------------------------- */}
        <div className="panel min-h-0 overflow-auto">
          {/* Marca de agua: en el plan gratis el informe se exporta con una
              franja que dice que es un informe de evaluación. Es más honesto
              que recortarle funciones al cliente. */}
          {watermarked ? (
            <div className="flex items-center gap-2 border-b border-warning/30 bg-warning-subtle px-4 py-2">
              <AlertTriangle size={14} strokeWidth={1.75} className="text-warning" />
              <span className="text-small text-warning">
                Informe de evaluación. La licencia FREE limita a 2 diagnósticos
                diarios y marca el documento.
              </span>
            </div>
          ) : null}

          <div className="p-6">
            <div className="flex items-start justify-between gap-4 border-b border-border pb-4">
              <div>
                <div className="flex items-center gap-2">
                  <div className="flex h-5 w-5 items-center justify-center rounded-sm bg-brand text-[11px] font-bold text-brand-ink">
                    F
                  </div>
                  <span className="text-body font-semibold">FixMyPhone</span>
                </div>
                <p className="mt-2 text-caption text-text-faint">
                  Informe generado automáticamente · {new Date().toLocaleString("es-MX")}
                </p>
              </div>
              <Badge tone={license.tier === "premium" ? "brand" : "warning"}>
                {license.tier === "premium" ? "Premium" : "Evaluación"}
              </Badge>
            </div>

            <h2 className="mt-6 text-h1 font-semibold">Equipo</h2>
            <div className="mt-2">
              <DataRow label="Variante">
                {variant ? variant.key : "sin identificar"}
              </DataRow>
              <DataRow label="Nombre comercial">{variant?.marketingName ?? "—"}</DataRow>
              <DataRow label="SoC">{variant?.soc ?? "—"}</DataRow>
              <DataRow label="Número de modelo">{device.props["ro.product.model"] ?? "—"}</DataRow>
              <DataRow label="Número de serie">{device.serial}</DataRow>
              <DataRow label="Android">{device.props["ro.build.version.release"] ?? "—"}</DataRow>
              <DataRow label="Parche de seguridad">
                {device.props["ro.build.version.security_patch"] ?? "—"}
              </DataRow>
              {/* El IMEI es dato personal. En el informe exportado se
                  enmascara; el técnico sí lo ve en pantalla. */}
              <DataRow label="IMEI" tone="muted">
                {maskImei(device.props["ril.IMEI"])}
              </DataRow>
            </div>

            {variant && variant.riskFlags.length > 0 ? (
              <>
                <h2 className="mt-6 text-h1 font-semibold">Riesgos registrados</h2>
                <ul className="mt-2 space-y-1">
                  {variant.riskFlags.map((f) => (
                    <li key={f} className="tech text-body text-warning">
                      {f}
                    </li>
                  ))}
                </ul>
              </>
            ) : null}

            <h2 className="mt-6 text-h1 font-semibold">Resultado de las pruebas</h2>
            <div className="mt-2">
              {probes.map((p) => (
                <DataRow
                  key={p.id}
                  label={p.id}
                  tone={p.state === "fail" ? "danger" : p.state === "pass" ? "success" : "muted"}
                >
                  {p.state}
                </DataRow>
              ))}
            </div>
          </div>
        </div>

        {/* --- Panel lateral: integridad --------------------------------- */}
        <div className="flex min-h-0 flex-col gap-4">
          <Panel title="Integridad">
            <div className="p-4">
              <div className="flex items-start gap-2.5">
                <ShieldCheck size={16} strokeWidth={1.75} className="mt-0.5 shrink-0 text-success" />
                <p className="text-small text-text-muted">
                  {license.tier === "premium" ? (
                    <>
                      Este informe se firma con Ed25519 al exportarlo. Cualquier
                      persona podrá verificar que no fue alterado con la clave
                      pública del fabricante.
                    </>
                  ) : (
                    <>
                      La firma digital requiere licencia Premium. En el plan
                      gratuito el informe se exporta sin firma y marcado como
                      evaluación.
                    </>
                  )}
                </p>
              </div>
            </div>
          </Panel>

          <Panel title="Cobertura">
            <div className="p-4">
              <DataRow label="Identificado" tone={variant ? "success" : "danger"}>
                {variant ? "sí" : "no"}
              </DataRow>
              {/* La fila de candidatas solo aparece cuando significa algo. Con el
                  equipo identificado la lista viene vacía por contrato y el 0 no
                  informa de nada; cuando el equipo NO se identificó, el 0 sí es
                  un dato y hay que distinguirlo del caso en que hubo candidatas
                  y ninguna se eligió. Un "0" a secas no dice cuál de los dos es,
                  y esa es justo la diferencia que el técnico necesita ver.

                  OJO, esta fila NO se puede ver en la maqueta web. Ahí el
                  transporte es simulado y no tiene sondas, así que nunca se arma un
                  informe y esta pantalla nunca se abre. Es alcanzable en el `.exe`,
                  donde `runAllProbes` corre sobre el transporte sin necesitar la
                  variante: por eso el informe sale aunque el equipo no se haya
                  identificado, y por eso el informe firmado lista las candidatas
                  (ver `alternatives` en report.ts). Que aqui no se haya visto en
                  pantalla no significa que el camino no exista; significa que la
                  maqueta no lo ejercita. */}
              {!variant || resolution.alternatives.length > 0 ? (
                <DataRow
                  label="Variantes candidatas"
                  tone={resolution.alternatives.length > 0 ? "warning" : "default"}
                >
                  {resolution.alternatives.length}
                  {resolution.alternatives.length > 0
                    ? " — sin elegir"
                    : " — no se encontró ninguna variante que coincida"}
                </DataRow>
              ) : null}
              {resolution.alternatives.length > 0 ? (
                <p className="tech border-t border-border px-4 py-2 text-caption text-text-muted">
                  {resolution.alternatives.map((a) => a.key).join(" · ")}
                </p>
              ) : null}
              <DataRow label="Niveles de evidencia">{resolution.ladder.length}</DataRow>
              <DataRow label="Pruebas ejecutadas">
                {probes.filter((p) => p.state !== "pending").length}/{probes.length}
              </DataRow>
              <DataRow label="Pruebas sin verificar" tone={skipped.length ? "warning" : "default"}>
                {skipped.length}
              </DataRow>
            </div>
            {skipped.length > 0 ? (
              <p className="border-t border-border px-4 py-2 text-caption text-text-faint">
                Las pruebas omitidas no afirmaron nada. Un hueco declarado es
                información; un hueco rellenado con un valor plausible es un
                error.
              </p>
            ) : null}
          </Panel>
        </div>
      </div>
    </div>
  );
}

/** Enmascara el IMEI conservando lo justo para identificarlo sin exponerlo. */
function maskImei(imei: string | undefined): string {
  if (!imei) return "—";
  if (imei.length < 8) return "****";
  return `${imei.slice(0, 6)}••••••${imei.slice(-4)}`;
}
