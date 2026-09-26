"""
Build stage: merge sources, attach seed overrides, validate, and produce the
conflict report that tells a human exactly what still needs curating.
"""

from __future__ import annotations

import re
from collections import Counter, defaultdict
from pathlib import Path

from .derive import enrich, risk_flags, verification_gates
from .model import Variant, apply_soc_family, detect_soc_vendor, from_lineageos, from_play
from . import miniyaml
from .seed import MX_PRIORITY_DEVICES, SEED_OVERRIDES
from .util import Stage, log, table

MANUAL_DIR = Path(__file__).resolve().parent.parent / "manual"
NON_FIELD_KEYS = {"verified_by", "evidence", "confidence", "notes", "todo"}
# Campos que enrich() calcula por regla: una entrada manual tiene prioridad
# sobre la regla, o la curacion seria inútil.
DERIVED_KEYS = {"dynamic_partitions", "verified_boot", "capabilities"}


# ---------------------------------------------------------------- merge

# ---------------------------------------------------------------- manual curation

def load_manual(path: Path | None = None) -> tuple[dict, list[dict], list[str]]:
    """Human-reviewed overrides. Returns (devices, todo, errors)."""
    path = path or (MANUAL_DIR / "devices.override.yml")
    if not path.exists():
        return {}, [], []
    try:
        doc = miniyaml.load_file(path)
    except miniyaml.MiniyamlError as exc:
        return {}, [], [f"{path.name}: YAML invalido: {exc}"]

    devices = doc.get("devices") or {}
    todo = doc.get("TODO") or []
    errors: list[str] = []
    if not isinstance(devices, dict):
        return {}, todo, [f"{path.name}: 'devices' debe ser un mapa"]

    for codename, patch in devices.items():
        if not isinstance(patch, dict):
            errors.append(f"{path.name}: {codename} no es un mapa")
            continue
        for required in ("verified_by", "evidence"):
            if not patch.get(required):
                errors.append(f"{path.name}: {codename} sin '{required}' -> rechazado")
                patch["__reject__"] = True
    return devices, todo, errors


def apply_manual(variants: dict[str, Variant], manual: dict) -> tuple[int, list[dict], list[str]]:
    """Manual entries win over sources, but are tagged so the UI can flag them."""
    applied = 0
    created: list[dict] = []
    errors: list[str] = []
    by_codename: dict[str, list[Variant]] = defaultdict(list)
    for v in variants.values():
        by_codename[v.codename].append(v)

    for codename, patch in manual.items():
        if patch.get("__reject__"):
            continue
        patch = {k: v for k, v in patch.items() if k not in NON_FIELD_KEYS and k != "__reject__"}
        targets = by_codename.get(codename, [])
        if not targets:
            v = Variant(codename=codename, vendor=patch.get("vendor", ""))
            variants[v.key] = v
            targets = [v]
            created.append({"codename": codename, "motivo": "alta manual sin fuente previa"})
        for v in targets:
            for k, val in patch.items():
                if not hasattr(v, k):
                    errors.append(f"{codename}: campo desconocido '{k}'")
                    continue
                setattr(v, k, val)
                v.add(k, val, "manual", "manual", f"manual/devices.override.yml",
                      f"{patch.get('verified_by', '')} / {patch.get('evidence', '')}")
            if v.soc_raw and v.soc_vendor == "unknown":
                v.soc_vendor = detect_soc_vendor(v.soc_raw)
                v.add("soc_vendor", v.soc_vendor, "manual", "inferred")
            if "manual" not in v.sources:
                v.sources.append("manual")
            # un registro creado desde cero nunca paso por apply_soc_family()
            if v.soc_vendor == "unknown" and v.soc_raw:
                v.soc_vendor = detect_soc_vendor(v.soc_raw)
            apply_soc_family(v)
            enrich(v)
            # la regla no puede pisar lo que decidio un humano
            for k in DERIVED_KEYS & patch.keys():
                setattr(v, k, patch[k])
        applied += 1
    return applied, created, errors


# ---------------------------------------------------------------- merge

def _model_key(model: str) -> str:
    return re.sub(r"[^A-Z0-9]", "", (model or "").upper())


def merge_variants(lineage_docs: list[dict], play_rows: list[dict],
                   manual: dict | None = None) -> tuple[list[Variant], dict, list[dict]]:
    variants: dict[str, Variant] = {}
    errors: list[str] = []

    for doc in lineage_docs:
        try:
            v = from_lineageos(doc)
        except Exception as exc:  # noqa: BLE001
            errors.append(f"lineageos {doc.get('_source_url')}: {exc}")
            continue
        if not v:
            errors.append(f"lineageos sin codename: {doc.get('_source_url')}")
            continue
        prev = variants.get(v.key)
        if prev is None:
            variants[v.key] = v
        else:
            variants[v.key] = _merge_pair(prev, v)

    # Play: attach runtime tokens + marketing names to matching variants.
    # Match 1: exact model number.
    by_model: dict[str, list[Variant]] = defaultdict(list)
    for v in variants.values():
        for m in v.model_numbers:
            by_model[_model_key(m)].append(v)
    # Match 2: codename == device_token (case-insensitive).
    by_codename = {v.codename.lower(): v for v in variants.values()}

    token_index: dict[str, dict] = {}
    attached = 0
    for row in play_rows:
        alias = from_play(row)
        token_index[alias["device_token"]] = alias
        cand = by_codename.get(alias["device_token"].lower())
        if cand is None and alias["model"]:
            cands = by_model.get(_model_key(alias["model"]))
            if cands:
                cand = cands[0]
        if cand is not None:
            attached += 1
            if alias["device_token"] and alias["device_token"] not in cand.device_tokens:
                cand.device_tokens.append(alias["device_token"])
            if alias["brand"] and not cand.vendor:
                cand.vendor = alias["brand"]
            if not cand.marketing_name and alias["marketing"]:
                cand.marketing_name = alias["marketing"]
                cand.add("marketing_name", alias["marketing"], "play", "reported",
                         alias["url"], alias["retrieved_at"])
            if "play" not in cand.sources:
                cand.sources.append("play")

    log(f"merge: {len(variants)} variantes | play: {len(play_rows)} filas, "
        f"{attached} enlazadas a una variante, {len(token_index)} tokens unicos")

    # seed overrides
    for v in variants.values():
        ov = SEED_OVERRIDES.get(v.codename)
        if not ov:
            continue
        add = ov.get("capabilities_add") or []
        for k, val in ov.items():
            if k == "capabilities_add":
                continue
            if hasattr(v, k):
                setattr(v, k, val)
                v.add(k, val, "seed", "seed")
        if add:
            v.capabilities = sorted(set(v.capabilities) | set(add))
        v.add("seed_override", list(ov.keys()), "seed", "seed")

    for v in variants.values():
        enrich(v)

    created: list[dict] = []
    if manual:
        n, created, merr = apply_manual(variants, manual)
        errors.extend(merr)
        log(f"curacion manual: {n} codenames aplicados, {len(created)} dados de alta")

    return list(variants.values()), {
        "play_rows": len(play_rows),
        "play_attached": attached,
        "play_tokens": len(token_index),
        "errors": errors,
    }, created


def _merge_pair(a: Variant, b: Variant) -> Variant:
    """Same variant key seen twice: keep the richest value per field."""
    for name in list(vars(a)):
        if name in ("provenance", "sources", "capabilities", "key"):
            continue
        cur = getattr(a, name)
        new = getattr(b, name)
        if cur in (None, "", [], {}) and new not in (None, "", [], {}):
            setattr(a, name, new)
    a.provenance.extend(b.provenance)
    for s in b.sources:
        if s not in a.sources:
            a.sources.append(s)
    return a


# ---------------------------------------------------------------- validation

def validate(variants: list[Variant], play_rows: list[dict], stats: dict) -> dict:
    conflicts: list[dict] = []
    gaps: list[dict] = []

    codenames = {v.codename for v in variants}

    for v in variants:
        if not v.soc_raw:
            gaps.append({"kind": "sin_soc", "codename": v.codename,
                         "detail": v.marketing_name or v.key})
        if v.soc_vendor == "unknown":
            conflicts.append({"kind": "soc_vendor_unknown", "codename": v.codename,
                              "detail": v.soc_raw or "(vacio)"})
        if not v.model_numbers:
            gaps.append({"kind": "sin_model_numbers", "codename": v.codename,
                         "detail": v.marketing_name or v.key})
        if v.is_ab_device is None:
            gaps.append({"kind": "ab_desconocido", "codename": v.codename,
                         "detail": f"android={v.android_version} soc={v.soc_vendor}"})
        if v.dynamic_partitions is None:
            gaps.append({"kind": "dynamic_partitions_desconocido", "codename": v.codename,
                         "detail": f"android={v.android_version}"})
        if not v.recovery_partition_name:
            gaps.append({"kind": "sin_recovery_partition", "codename": v.codename,
                         "detail": "asume 'recovery' - verificar antes de flashear"})
        if not v.vendor:
            gaps.append({"kind": "sin_fabricante", "codename": v.codename, "detail": ""})

    # play tokens with no lineage counterpart
    tokens = {r["device_token"] for r in play_rows if r["device_token"]}
    lower_codename = {c.lower() for c in codenames}
    orphan_tokens = sorted(t for t in tokens if t.lower() not in lower_codename)
    by_brand = Counter(r["brand"] for r in play_rows if r["device_token"])
    for b, c in by_brand.most_common(15):
        pass

    return {
        "conflicts": conflicts,
        "gaps": gaps,
        "stats": {
            **stats,
            "orphan_play_tokens": len(orphan_tokens),
            "gap_total": len(gaps),
            "conflict_total": len(conflicts),
        },
        "orphan_tokens_sample": orphan_tokens[:40],
    }


def coverage_by_vendor(variants: list[Variant], play_rows: list[dict]) -> list[dict]:
    lo = Counter(v.vendor for v in variants if v.vendor)
    play = Counter(r["brand"] for r in play_rows if r["brand"])
    rows = []
    for brand, n in play.most_common(40):
        rows.append({"marca": brand, "en_lineageos": lo.get(brand, 0),
                     "en_play": n})
    return rows


def coverage_by_soc(variants: list[Variant]) -> list[dict]:
    c = Counter(f"{v.soc_vendor} :: {v.soc_raw}" for v in variants)
    return [{"soc_vendor": k.split(" :: ")[0], "soc": k.split(" :: ")[1] if " :: " in k else k,
             "variantes": n} for k, n in c.most_common(35)]


def mx_focus(variants: list[Variant]) -> list[dict]:
    by_codename = defaultdict(list)
    for v in variants:
        by_codename[v.codename].append(v)
    rows = []
    for codename, vendor, name, why in MX_PRIORITY_DEVICES:
        vs = by_codename.get(codename, [])
        v0 = vs[0] if vs else None
        ab = "?"
        if v0 is not None:
            ab = "A/B" if v0.is_ab_device else ("A-only" if v0.is_ab_device is False else "?")
        rows.append({
            "codename": codename,
            "modelo": name,
            "estado": "OK" if vs else "FALTA",
            "variantes": len(vs),
            "soc": v0.soc_raw if v0 else "-",
            "ab": ab,
            "dyn": (str(v0.dynamic_partitions) if v0 else "-"),
            "rec_part": ((v0.recovery_partition_name or "recovery") if v0 else "-"),
            "motivo": why,
        })
    return rows


# ---------------------------------------------------------------- showcase

def unknown_device_sample(variants: list[Variant]) -> list[dict]:
    """Cases the DB knows nothing about -> the Mode: Desconocido path."""
    out = []
    for v in variants:
        if v.soc_vendor == "unknown" or not v.soc_raw:
            out.append({"codename": v.codename, "modelo": v.marketing_name,
                        "soc": v.soc_raw or "(vacio)", "vendor": v.vendor})
    return out[:25]


__all__ = [
    "merge_variants", "validate", "coverage_by_vendor", "coverage_by_soc",
    "mx_focus", "unknown_device_sample", "risk_flags", "verification_gates",
    "table", "log", "Stage",
]
