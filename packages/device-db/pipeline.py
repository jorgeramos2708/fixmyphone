"""
FixMyPhone device-db pipeline.

    python pipeline.py run              # full run (cached)
    python pipeline.py run --refresh    # ignore cache
    python pipeline.py stats            # queries against the built sqlite
    python pipeline.py verify           # integrity + sanity checks

Design contract
---------------
* No third-party dependencies. Python 3.11+ standard library only.
* Every fact carries provenance (source + confidence + url + retrieved_at).
* Sources are replaceable: adding one must not require touching the pipeline.
* Failures degrade, they do not abort: a broken source becomes a gap to curate.
"""

from __future__ import annotations

import argparse
import json
import sqlite3
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))

from devicedb import build, ift, report, sources, store  # noqa: E402
from devicedb.util import OUT, RAW, ensure_dirs, log, now_iso  # noqa: E402

DB = OUT / "fixmyphone_device_db.sqlite"
JSON_OUT = OUT / "devices.json"
CSV_OUT = OUT / "devices.csv"
REPORT = OUT / "run_report.md"

SOURCES_META = [
    {"id": "lineageos", "name": "LineageOS wiki (_data/devices/*.yml)",
     "url": "https://github.com/LineageOS/lineage_wiki",
     "license": "CC BY-SA 3.0", "retrieved_at": None, "records": 0},
    {"id": "play", "name": "Google Play certified devices (supported_devices.csv)",
     "url": "https://storage.googleapis.com/play_public/supported_devices.csv",
     "license": "Google public dataset", "retrieved_at": None, "records": 0},
    {"id": "seed", "name": "FixMyPhone curated repair knowledge",
     "url": "internal", "license": "Proprietary (FixMyPhone)",
     "retrieved_at": None, "records": 0},
]

# El padron del IFT no entra como una fuente mas: es una fuente secundaria por
# marca, y la mayoria de las marcas no tienen una. Se declara aparte para que
# el informe diga explicitamente cuales se leyeron y cuales no, en vez de
# dejar que el lector suponga que faltaron.
FUENTES_PADRON = [
    {"id": f"ift_{marca}", "name": f"Certificados IFT publicados por {marca} (Mexico)",
     "url": cfg["url"], "license": "Fuente secundaria de la marca",
     "retrieved_at": None, "records": 0}
    for marca, cfg in ift.FUENTES.items()
]


def cmd_run(refresh: bool) -> int:
    ensure_dirs()

    with build.Stage("fetch lineageos"):
        lineage_docs = sources.fetch_lineageos(refresh=refresh)
    with build.Stage("fetch schema de referencia"):
        schema = sources.fetch_schema(refresh=refresh)
        if schema:
            log(f"schema: {len(schema)} claves de definicion")
            (RAW / "lineageos" / "schema_keys.txt").write_text(
                "\n".join(sorted(schema.keys())), encoding="utf-8")
    with build.Stage("fetch play"):
        play_rows = sources.fetch_play(refresh=refresh)

    with build.Stage("curacion manual"):
        manual, todo, merr = build.load_manual()
        build.log(f"manual: {len(manual)} codenames, {len(todo)} en cola, {len(merr)} errores")

    with build.Stage("merge + derivar"):
        variants, stats, created = build.merge_variants(lineage_docs, play_rows, manual)
        stats["todo_curacion"] = len(todo)
        stats["manual_codenames"] = len(manual)
        stats["manual_created"] = len(created)

    with build.Stage("padron IFT"):
        padron = ift.descarga_padron(refresh=refresh)
        conteo_ift = ift.aplica_padron(variants, padron)
        log(f"padron: {len(padron.equipos)} certificados leidos de "
            f"{len(padron.marcas)} marcas")
        for aviso in padron.avisos:
            log(f"  ! {aviso}")
        log(f"padron: {conteo_ift}")

    with build.Stage("validar"):
        validation = build.validate(variants, play_rows, stats)
        coverage = {
            "soc": build.coverage_by_soc(variants),
            "vendors": build.coverage_by_vendor(variants, play_rows),
            "mx": build.mx_focus(variants),
            "ift": {
                "conteo": conteo_ift,
                "marcas_leidas": sorted(padron.marcas),
                "marcas_sin_padron": sorted(padron.marcas_sin_padron),
                "certificados": len(padron.equipos),
                "avisos": padron.avisos,
                "tooltip": ift.TOOLTIP,
            },
        }

    with build.Stage("exportar"):
        meta = []
        counts = {"lineageos": len(lineage_docs), "play": len(play_rows),
                  "seed": len({v.codename for v in variants})}
        for marca in padron.marcas:
            counts[f"ift_{marca}"] = len(padron.certificados_de(marca))
        for s in SOURCES_META + FUENTES_PADRON:
            s = dict(s)
            s["records"] = counts.get(s["id"], 0)
            s["retrieved_at"] = now_iso()
            meta.append(s)
        store.build_sqlite(DB, variants, play_rows, meta, validation)
        store.build_csv(CSV_OUT, variants)
        store.build_json(JSON_OUT, variants, validation)
        artifacts = {
            "sqlite": str(DB), "csv": str(CSV_OUT), "json": str(JSON_OUT),
            "report": str(REPORT),
        }
        report.write_report(REPORT, variants, play_rows, validation, coverage,
                            artifacts, meta)

    report.console_summary(variants, play_rows, validation, coverage)
    print(f"\n  Artefactos en: {OUT}")
    for name, p in artifacts.items():
        print(f"    {name:<8} {p}  ({Path(p).stat().st_size/1024:.0f} KB)")
    return 0


def cmd_stats() -> int:
    if not DB.exists():
        print("No existe la base. Ejecuta: python pipeline.py run")
        return 1
    con = sqlite3.connect(DB)
    con.row_factory = sqlite3.Row
    print("\n-- conteos --")
    for t in ("variant", "alias", "provenance", "gap", "conflict",
              "soc_vendor", "mx_operator"):
        print(f"   {t:<12} {con.execute(f'SELECT COUNT(*) FROM {t}').fetchone()[0]}")
    print("\n-- capacidades mas comunes --")
    rows = con.execute("SELECT capabilities FROM variant").fetchall()
    caps: dict[str, int] = {}
    for r in rows:
        import json
        for c in json.loads(r["capabilities"] or "[]"):
            caps[c] = caps.get(c, 0) + 1
    for k, v in sorted(caps.items(), key=lambda x: -x[1]):
        print(f"   {k:<32} {v}")
    print("\n-- SoC por familia --")
    for r in con.execute("SELECT soc_vendor, COUNT(*) c FROM variant "
                         "GROUP BY soc_vendor ORDER BY c DESC"):
        print(f"   {r[0]:<12} {r[1]}")
    print("\n-- ejemplo de variante completa --")
    r = con.execute("SELECT * FROM variant WHERE codename='bluejay'").fetchone()
    if r:
        for k in r.keys():
            if r[k] not in (None, "", 0):
                print(f"   {k:<28} {str(r[k])[:100]}")
    con.close()
    return 0


def cmd_verify(update_baseline: bool = False) -> int:
    if not DB.exists():
        print("No existe la base.")
        return 1
    con = sqlite3.connect(DB)
    checks = []
    q = lambda s: con.execute(s).fetchone()[0]
    checks.append(("variantes totales > 0", q("SELECT COUNT(*) FROM variant") > 0))
    checks.append(("toda variante tiene codename",
                   q("SELECT COUNT(*) FROM variant WHERE codename IS NULL OR codename=''") == 0))
    checks.append(("toda variante tiene fabricante",
                   q("SELECT COUNT(*) FROM variant WHERE vendor='' OR vendor IS NULL") == 0))
    checks.append(("toda variante tiene lista de capacidades",
                   q("SELECT COUNT(*) FROM variant WHERE capabilities IS NULL") == 0))
    checks.append(("toda variante tiene gates de verificacion",
                   q("SELECT COUNT(*) FROM variant WHERE verification_gates IS NULL") == 0))
    checks.append(("toda variante tiene procedencia",
                   q("SELECT COUNT(*) FROM variant WHERE sources IS NULL") == 0))
    checks.append(("cada variante tiene >=1 registro de procedencia",
                   q("SELECT COUNT(*) FROM variant v WHERE NOT EXISTS"
                     "(SELECT 1 FROM provenance p WHERE p.variant_id=v.id)") == 0))
    checks.append(("sin claves foraneas huerfanas en provenance",
                   q("SELECT COUNT(*) FROM provenance p WHERE NOT EXISTS"
                     "(SELECT 1 FROM variant v WHERE v.id=p.variant_id)") == 0))
    # El texto que va a terminar impreso en un informe firmado no puede traer
    # marcado. El wiki de LineageOS escribe los botones como HTML dentro del
    # YAML porque en su pagina se ven resaltados, y ese texto se copiaba tal
    # cual: 1,376 campos de 763 variantes con "<kbd>Power</kbd>" dentro, que es
    # decir, 1,376 veces que el informe le habria mostrado "<kbd>" al cliente.
    #
    # Se comprueba en la base y no solo en el pipeline porque el pipeline se
    # puede re-ejecutar sobre una base vieja, y porque el informe se arma desde
    # la base: si la base trae marcado, el informe trae marcado.
    checks.append((
        "el texto de los combos de teclas no trae HTML de la fuente",
        q("SELECT COUNT(*) FROM variant WHERE"
          " (recovery_boot LIKE '%<%' OR recovery_boot LIKE '%>%'"
          "  OR download_boot LIKE '%<%' OR download_boot LIKE '%>%')") == 0,
    ))
    # Lo mismo, pero para el resto del texto que la app imprime crudo. Hoy solo
    # las dos columnas de arriba traen marcado; esta comprobacion es la que
    # avisa si mañana se empieza a copiar otro campo del wiki sin normalizarlo.
    checks.append((
        "ningun campo de texto que la app imprima trae HTML de la fuente",
        q("SELECT COUNT(*) FROM variant WHERE"
          " (install_method LIKE '%<%' OR custom_unlock_cmd LIKE '%<%'"
          "  OR pre_install_instructions LIKE '%<%' OR download_mode LIKE '%<%')") == 0,
    ))

    # Known-gap metrics: these are curation work items, not bugs. A regression
    # (the number getting worse) is a failure; the number itself is not.
    metrics = {
        "variantes_sin_soc": q("SELECT COUNT(*) FROM variant WHERE soc_raw IS NULL OR soc_raw=''"),
        "variantes_soc_unknown": q("SELECT COUNT(*) FROM variant WHERE soc_vendor='unknown'"),
        "variantes_sin_model_numbers": q(
            "SELECT COUNT(*) FROM variant WHERE model_numbers IS NULL OR model_numbers IN ('','[]')"),
        "ab_desconocido": q("SELECT COUNT(*) FROM variant WHERE is_ab_device IS NULL"),
        "dynamic_desconocido": q("SELECT COUNT(*) FROM variant WHERE dynamic_partitions IS NULL"),
    }

    con.close()
    print("\n  Invariantes duros")
    ok = True
    for name, passed in checks:
        print(f"   [{'OK ' if passed else 'FAIL'}] {name}")
        ok = ok and passed

    bpath = OUT / "quality_baseline.json"
    baseline = json.loads(bpath.read_text(encoding="utf-8")) if bpath.exists() else {}
    print("\n  Brechas conocidas (regresion = FAIL)")
    for k, v in metrics.items():
        if update_baseline or k not in baseline:
            verdict = "BASE"
        elif v > baseline[k]:
            verdict = "FAIL"
        elif v < baseline[k]:
            verdict = "OK  (mejor)"
        else:
            verdict = "OK "
        print(f"   [{verdict}] {k:<28} {v:>5}  (baseline {baseline.get(k, '-')})")
        if verdict == "FAIL":
            ok = False

    if update_baseline or not bpath.exists():
        bpath.write_text(json.dumps(metrics, indent=2), encoding="utf-8")
        print(f"\n  baseline escrito: {bpath}")
    return 0 if ok else 2


def main() -> int:
    ap = argparse.ArgumentParser(description="FixMyPhone device-db pipeline")
    sub = ap.add_subparsers(dest="cmd", required=True)
    p = sub.add_parser("run", help="construye la base de dispositivos")
    p.add_argument("--refresh", action="store_true", help="ignora la cache HTTP")
    sub.add_parser("stats", help="consultas sobre la base construida")
    p = sub.add_parser("verify", help="chequeos de integridad")
    p.add_argument("--update-baseline", action="store_true",
                   help="acepta las brechas actuales como nueva linea base")
    args = ap.parse_args()

    if args.cmd == "run":
        return cmd_run(args.refresh)
    if args.cmd == "stats":
        return cmd_stats()
    if args.cmd == "verify":
        return cmd_verify(args.update_baseline)
    return 1


if __name__ == "__main__":
    raise SystemExit(main())
