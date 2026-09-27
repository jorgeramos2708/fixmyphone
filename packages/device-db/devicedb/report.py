"""Human-readable run report (markdown) + console summary."""

from __future__ import annotations

import json
from collections import Counter
from pathlib import Path

from .model import Variant
from .util import OUT, now_iso, table


def _md_table(rows: list[dict], columns: list[str]) -> str:
    if not rows:
        return "_(sin datos)_\n"
    out = ["| " + " | ".join(columns) + " |",
           "|" + "|".join("---" for _ in columns) + "|"]
    for r in rows:
        cells = []
        for c in columns:
            v = r.get(c, "")
            if isinstance(v, (list, tuple)):
                v = ", ".join(str(x) for x in v)
            v = str(v if v not in (None, "") else "-")
            cells.append(v.replace("|", "\\|")[:120])
        out.append("| " + " | ".join(cells) + " |")
    return "\n".join(out) + "\n"


def write_report(path: Path, variants: list[Variant], play_rows: list[dict],
                 validation: dict, coverage: dict, artifacts: dict,
                 sources_meta: list[dict]) -> Path:
    st = validation["stats"]
    gaps_by_kind = Counter(g["kind"] for g in validation["gaps"])
    soc = coverage["soc"]
    vendors = coverage["vendors"]

    doc = []
    doc.append("# FixMyPhone - device-db run report\n")
    doc.append(f"Generado: {now_iso()}\n")

    doc.append("## Resumen\n")
    doc.append(f"- **Variantes (codename+variante)**: {len(variants)}\n")
    doc.append(f"- **Codenames unicos**: {len({v.codename for v in variants})}\n")
    doc.append(f"- **Filas catalogo Play (GMS)**: {len(play_rows)}\n")
    doc.append(f"- **Tokens de runtime (ro.product.device)**: {st['play_tokens']}\n")
    doc.append(f"- **Tokens Play sin equivalente LineageOS**: {st['orphan_play_tokens']}\n")
    doc.append(f"- **Fabricantes con SoC identificado**: {len({v.soc_vendor for v in variants if v.soc_vendor != 'unknown'})}\n")
    doc.append(f"- **Brechas abiertas**: {st['gap_total']}\n")
    doc.append(f"- **Conflictos**: {st['conflict_total']}\n")

    doc.append("\n## Artefactos\n")
    doc.append(_md_table([{"artefacto": k, "ruta": v} for k, v in artifacts.items()],
                         ["artefacto", "ruta"]))

    doc.append("\n## Fuentes\n")
    doc.append(_md_table(sources_meta, ["id", "name", "url", "license", "records"]))

    doc.append("\n## SoC mas frecuentes\n")
    doc.append(_md_table(soc, ["soc_vendor", "soc", "variantes"]))

    doc.append("\n## Cobertura por marca (top 25 del catalogo Play)\n")
    doc.append(_md_table(vendors, ["marca", "en_lineageos", "en_play",
                                   "como_la_escribia_play"]))

    # La seccion del padron va aparte y antes que las brechas, porque sin ella
    # "desconocido" parece una conclusion cuando en realidad es que no se busco.
    ift = coverage.get("ift") or {}
    conteo = ift.get("conteo") or {}
    if conteo:
        doc.append("\n## Padron de homologacion IFT\n")
        doc.append(
            f"Se leyeron {ift.get('certificados', 0)} certificados de "
            f"{len(ift.get('marcas_leidas', []))} marcas. Las demas no tienen "
            f"una tabla de certificados accesible, asi que sus variantes quedan "
            f"en `desconocido`: no se buscaron.\n")
        doc.append(_md_table(
            [{"estado": k, "variantes": n,
              "que significa": (ift.get("tooltip") or {}).get(k, "")}
             for k, n in conteo.items()], ["estado", "variantes", "que significa"]))
        if ift.get("marcas_sin_padron"):
            doc.append(f"\nMarcas sin tabla accesible: "
                       f"{', '.join(ift['marcas_sin_padron'])}\n")
        homologados = [{"codename": v.codename, "modelo": v.marketing_name,
                        "folio": v.ift_certificado}
                       for v in variants if v.homologado_ift == "homologado"]
        if homologados:
            doc.append("\nVariantes con folio encontrado:\n")
            doc.append(_md_table(homologados, ["codename", "modelo", "folio"]))
        if ift.get("avisos"):
            doc.append("\nAvisos de la lectura:\n")
            for a in ift["avisos"]:
                doc.append(f"- {a}")

    doc.append("\n## Foco Mexico (modelos prioritarios)\n")
    doc.append(_md_table(coverage["mx"], ["codename", "modelo", "estado", "variantes",
                                          "soc", "ab", "dyn", "rec_part", "motivo"]))

    doc.append("\n## Brechas por tipo (que falta curar a mano)\n")
    doc.append(_md_table([{"tipo": k, "casos": v} for k, v in gaps_by_kind.most_common()],
                         ["tipo", "casos"]))

    doc.append("\n## Muestra de variantes (10 aleatorias deterministicas)\n")
    step = max(1, len(variants) // 10)
    sample = variants[::step][:10]
    doc.append(_md_table(
        [{"codename": v.codename, "modelo": v.marketing_name, "soc": v.soc_raw,
          "platform": v.platform, "ab": v.is_ab_device,
          "dyn": v.dynamic_partitions, "android": v.android_version,
          "riesgos": len([f for f in (v.capabilities or [])])} for v in sample],
        ["codename", "modelo", "soc", "platform", "ab", "dyn", "android"]))

    path.write_text("\n".join(doc), encoding="utf-8")
    return path


def console_summary(variants: list[Variant], play_rows: list[dict],
                    validation: dict, coverage: dict) -> None:
    st = validation["stats"]
    print()
    print("=" * 78)
    print(f"  VARIANTES: {len(variants)}   CODENAMES: {len({v.codename for v in variants})}"
          f"   PLAY: {len(play_rows)}   TOKENS: {st['play_tokens']}")
    print("=" * 78)

    print("\n-- SoC por familia --")
    fam = Counter(v.soc_vendor for v in variants)
    for k, n in fam.most_common():
        print(f"   {k:<12} {n:>5}")

    print("\n-- Foco Mexico --")
    table(coverage["mx"], ["codename", "modelo", "estado", "soc", "ab", "rec_part"],
          limit=25)

    print("\n-- Brechas (top 10) --")
    g = Counter(x["kind"] for x in validation["gaps"])
    for k, n in g.most_common(10):
        print(f"   {k:<34} {n:>5}")

    print("\n-- Cobertura por marca (top 15) --")
    table(coverage["vendors"], ["marca", "en_lineageos", "en_play"], limit=15)

    ift = coverage.get("ift") or {}
    conteo = ift.get("conteo") or {}
    if conteo:
        print(f"\n-- Padron IFT: {ift.get('certificados', 0)} certificados de "
              f"{len(ift.get('marcas_leidas', []))} marcas --")
        for estado, n in conteo.items():
            print(f"   {estado:<16} {n:>5}")
        print(f"   (buscado: {', '.join(ift.get('marcas_leidas', [])) or 'ninguna'})")
        for aviso in ift.get("avisos", []):
            print(f"   ! {aviso}")
