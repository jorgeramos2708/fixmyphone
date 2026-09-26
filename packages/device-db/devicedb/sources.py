"""
Source adapters. Each adapter returns normalized records plus its own
provenance. Adding a new source must never require touching the pipeline.

Sources shipped in v1
---------------------
lineageos : https://github.com/LineageOS/lineage_wiki  (CC BY-SA 3.0)
            Structured YAML per device/variant. This is the deepest public
            source for repair-relevant facts (SoC, model numbers, battery,
            screen, camera, install method, A/B flag, recovery partition,
            pre-install requirements).
play      : https://storage.googleapis.com/play_public/supported_devices.csv
            Breadth. Maps the runtime token (ro.product.device) to brand and
            marketing names, with the model strings as printed on the box.
schema    : the wiki's own JSON schema, stored as a reference for validation.
"""

from __future__ import annotations

import csv
import io
import json
from concurrent.futures import ThreadPoolExecutor
from pathlib import Path

from . import miniyaml
from .util import RAW, fetch, log, now_iso

GITHUB_TREE = "https://api.github.com/repos/LineageOS/lineage_wiki/git/trees/main?recursive=1"
RAW_BASE = "https://raw.githubusercontent.com/LineageOS/lineage_wiki/main/"
PLAY_CSV = "https://storage.googleapis.com/play_public/supported_devices.csv"
SCHEMA = RAW_BASE + "_data/schema.yml"


# ---------------------------------------------------------------- lineageos

def fetch_lineageos(refresh: bool = False, workers: int = 8) -> list[dict]:
    """Returns [{codename, variant, data, url, retrieved_at}]"""
    body, meta = fetch(GITHUB_TREE, cache_dir=RAW / "lineageos", refresh=refresh)
    if not body:
        raise RuntimeError(f"no se pudo obtener el arbol del wiki: {meta}")
    tree = json.loads(body)
    paths = [
        t["path"] for t in tree.get("tree", [])
        if t["path"].startswith("_data/devices/") and t["path"].endswith(".yml")
    ]
    log(f"lineageos: {len(paths)} fichas de dispositivo/variante")

    def one(p: str):
        url = RAW_BASE + p
        b, m = fetch(url, cache_dir=RAW / "lineageos", refresh=refresh)
        if not b:
            return None
        try:
            data = miniyaml.loads(b.decode("utf-8", "replace"))
        except miniyaml.MiniyamlError as exc:
            log(f"  ! yml invalido {p}: {exc}")
            return None
        data["_source_url"] = url
        data["_retrieved_at"] = m.get("retrieved_at", now_iso())
        return data

    out: list[dict] = []
    with ThreadPoolExecutor(max_workers=workers) as pool:
        for i, rec in enumerate(pool.map(one, paths), 1):
            if rec:
                out.append(rec)
            if i % 150 == 0:
                log(f"  lineageos {i}/{len(paths)}")
    log(f"lineageos: {len(out)} fichas parseadas")
    return out


def fetch_schema(refresh: bool = False) -> dict:
    b, m = fetch(SCHEMA, cache_dir=RAW / "lineageos", refresh=refresh)
    if not b:
        return {}
    try:
        return miniyaml.loads(b.decode("utf-8", "replace"))
    except miniyaml.MiniyamlError:
        return {}


# ---------------------------------------------------------------- play

def fetch_play(refresh: bool = False) -> list[dict]:
    """Returns [{brand, marketing, device_token, model, url}]"""
    b, meta = fetch(PLAY_CSV, cache_dir=RAW / "play", refresh=refresh)
    if not b:
        raise RuntimeError(f"no se pudo obtener el catalogo de Play: {meta}")
    text = b.decode("utf-16" if b[:2] in (b"\xff\xfe", b"\xfe\xff") else "utf-8",
                    "replace")
    reader = csv.DictReader(io.StringIO(text))
    rows = []
    for r in reader:
        brand = (r.get("Retail Branding") or "").strip()
        if not brand:
            continue
        rows.append({
            "brand": brand,
            "marketing": (r.get("Marketing Name") or "").strip(),
            "device_token": (r.get("Device") or "").strip(),
            "model": (r.get("Model") or "").strip(),
            "url": PLAY_CSV,
            "retrieved_at": meta.get("retrieved_at", now_iso()),
        })
    log(f"play: {len(rows)} registros certificados GMS")
    return rows
