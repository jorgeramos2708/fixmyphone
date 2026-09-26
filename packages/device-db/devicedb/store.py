"""
Storage + export.

The SQLite file is the artifact the .NET app reads. Its schema is deliberately
flat and stable so a signed capability pack can be swapped without breaking
older clients.
"""

from __future__ import annotations

import csv
import json
import sqlite3
from pathlib import Path

from .derive import risk_flags, verification_gates
from .model import Variant
from .seed import CONFIDENCE, MX_OPERATORS, SOC_VENDOR_CAPABILITIES
from .util import OUT, log, now_iso

SCHEMA = """
PRAGMA journal_mode=WAL;

CREATE TABLE IF NOT EXISTS meta (
    key   TEXT PRIMARY KEY,
    value TEXT
);

CREATE TABLE IF NOT EXISTS source (
    id          TEXT PRIMARY KEY,
    name        TEXT,
    url         TEXT,
    license     TEXT,
    retrieved_at TEXT,
    records     INTEGER
);

CREATE TABLE IF NOT EXISTS soc_vendor (
    id                      TEXT PRIMARY KEY,
    download_mode           TEXT,
    usb_ids                 TEXT,
    signed_material_required INTEGER,
    signed_material_origin  TEXT,
    risk_notes              TEXT,
    storage                 TEXT,
    partitions_of_interest  TEXT
);

CREATE TABLE IF NOT EXISTS variant (
    id                     TEXT PRIMARY KEY,
    codename               TEXT NOT NULL,
    variant                INTEGER,
    vendor                 TEXT,
    vendor_short           TEXT,
    marketing_name         TEXT,
    model_numbers          TEXT,
    device_tokens          TEXT,
    release                TEXT,
    soc_raw                TEXT,
    soc_vendor             TEXT,
    soc_model              TEXT,
    platform               TEXT,
    architecture           TEXT,
    cpu                    TEXT,
    gpu                    TEXT,
    ram                    TEXT,
    storage                TEXT,
    kernel_repo            TEXT,
    kernel_version         TEXT,
    battery_mah            INTEGER,
    battery_removable      INTEGER,
    battery_tech           TEXT,
    screen_size            REAL,
    screen_resolution      TEXT,
    screen_technology      TEXT,
    screen_refresh         INTEGER,
    cameras                TEXT,
    peripherals            TEXT,
    network_generations    TEXT,
    android_version        INTEGER,
    lineage_versions       TEXT,
    is_ab_device           INTEGER,
    dynamic_partitions     INTEGER,
    verified_boot          TEXT,
    install_method         TEXT,
    custom_unlock_cmd      TEXT,
    recovery_partition_name TEXT,
    recovery_boot          TEXT,
    download_boot          TEXT,
    pre_install_instructions TEXT,
    pre_install_version    TEXT,
    download_mode          TEXT,
    usb_ids                TEXT,
    signed_material_required INTEGER,
    homologado_ift         TEXT,
    capabilities           TEXT,
    risk_flags             TEXT,
    verification_gates     TEXT,
    sources                TEXT,
    updated_at             TEXT
);
CREATE INDEX IF NOT EXISTS ix_variant_codename ON variant(codename);
CREATE INDEX IF NOT EXISTS ix_variant_soc ON variant(soc_vendor);
CREATE INDEX IF NOT EXISTS ix_variant_vendor ON variant(vendor);

CREATE TABLE IF NOT EXISTS provenance (
    id           INTEGER PRIMARY KEY AUTOINCREMENT,
    variant_id   TEXT NOT NULL,
    field_name   TEXT,
    value        TEXT,
    source       TEXT,
    confidence   TEXT,
    url          TEXT,
    retrieved_at TEXT
);
CREATE INDEX IF NOT EXISTS ix_prov_variant ON provenance(variant_id);

CREATE TABLE IF NOT EXISTS alias (
    device_token TEXT,
    brand        TEXT,
    marketing    TEXT,
    model        TEXT,
    variant_id   TEXT,
    confidence   TEXT,
    source       TEXT,
    PRIMARY KEY (device_token, model)
);

CREATE TABLE IF NOT EXISTS mx_operator (
    id           TEXT PRIMARY KEY,
    name         TEXT,
    network_owner TEXT,
    mno          TEXT,
    bands_lte    TEXT,
    bands_5g     TEXT,
    notes        TEXT
);

CREATE TABLE IF NOT EXISTS gap (
    kind     TEXT,
    codename TEXT,
    detail   TEXT
);

CREATE TABLE IF NOT EXISTS conflict (
    kind     TEXT,
    codename TEXT,
    detail   TEXT
);
"""


def _j(v) -> str:
    if isinstance(v, (list, dict)):
        return json.dumps(v, ensure_ascii=False)
    if v is None:
        return ""
    if isinstance(v, bool):
        return "1" if v else "0"
    return str(v)


def build_sqlite(path: Path, variants: list[Variant], play_rows: list[dict],
                 sources_meta: list[dict], validation: dict) -> Path:
    if path.exists():
        path.unlink()
    con = sqlite3.connect(path)
    con.executescript(SCHEMA)
    cur = con.cursor()

    cur.executemany(
        "INSERT OR REPLACE INTO meta(key,value) VALUES(?,?)",
        [("generated_at", now_iso()), ("generator", "fixmyphone device-db pipeline"),
         ("variant_count", str(len(variants))),
         ("confidence_model", json.dumps(CONFIDENCE, ensure_ascii=False))],
    )

    cur.executemany(
        "INSERT OR REPLACE INTO source(id,name,url,license,retrieved_at,records) "
        "VALUES(?,?,?,?,?,?)",
        [(s["id"], s["name"], s["url"], s["license"], s["retrieved_at"], s["records"])
         for s in sources_meta])

    for vid, fam in SOC_VENDOR_CAPABILITIES.items():
        cur.execute(
            "INSERT OR REPLACE INTO soc_vendor VALUES(?,?,?,?,?,?,?,?)",
            (vid, fam["download_mode"], _j(fam["usb_ids"]),
             1 if fam["signed_material_required"] else 0,
             fam["signed_material_origin"], _j(fam["risk_notes"]),
             fam.get("storage", ""), _j(fam.get("partitions_of_interest", []))))

    by_key = {v.key: v for v in variants}
    for op in MX_OPERATORS:
        cur.execute("INSERT OR REPLACE INTO mx_operator VALUES(?,?,?,?,?,?,?)",
                    (op["id"], op["name"], op["network_owner"], op["mno"],
                     _j(op["bands_lte"]), _j(op["bands_5g"]), op["notes"]))

    for v in variants:
        flags = risk_flags(v)
        cur.execute(
            "INSERT OR REPLACE INTO variant VALUES(" + ",".join(["?"] * 51) + ")",
            (v.key, v.codename, v.variant, v.vendor, v.vendor_short,
             v.marketing_name, _j(v.model_numbers), _j(v.device_tokens), v.release,
             v.soc_raw, v.soc_vendor, v.soc_model, v.platform, v.architecture,
             v.cpu, v.gpu, v.ram, v.storage, v.kernel_repo, v.kernel_version,
             v.battery_mah, v.battery_removable, v.battery_tech, v.screen_size,
             v.screen_resolution, v.screen_technology, v.screen_refresh,
             _j(v.cameras), _j(v.peripherals), _j(v.network_generations),
             v.android_version, _j(v.lineage_versions),
             None if v.is_ab_device is None else (1 if v.is_ab_device else 0),
             None if v.dynamic_partitions is None else (1 if v.dynamic_partitions else 0),
             v.verified_boot, v.install_method, v.custom_unlock_cmd,
             v.recovery_partition_name, v.recovery_boot, v.download_boot,
             v.pre_install_instructions, v.pre_install_version, v.download_mode,
             _j(v.usb_ids),
             None if v.signed_material_required is None else (1 if v.signed_material_required else 0),
             v.homologado_ift, _j(v.capabilities), _j(flags),
             _j(verification_gates(v)), _j(v.sources), now_iso()),
        )
        for p in v.provenance:
            cur.execute(
                "INSERT INTO provenance(variant_id,field_name,value,source,confidence,"
                "url,retrieved_at) VALUES(?,?,?,?,?,?,?)",
                (v.key, p.field_name, _j(p.value)[:2000], p.source, p.confidence,
                 p.url, p.retrieved_at))

    # aliases: play tokens resolved to a variant when possible
    lower = {v.codename.lower(): v for v in variants}
    for row in play_rows:
        tok = row["device_token"]
        if not tok:
            continue
        cand = lower.get(tok.lower())
        cur.execute(
            "INSERT OR REPLACE INTO alias VALUES(?,?,?,?,?,?,?)",
            (tok, row["brand"], row["marketing"], row["model"],
             cand.key if cand else None, "reported" if cand else "unresolved",
             "play"))

    cur.executemany("INSERT INTO gap VALUES(?,?,?)",
                    [(g["kind"], g["codename"], g["detail"]) for g in validation["gaps"]])
    cur.executemany("INSERT INTO conflict VALUES(?,?,?)",
                    [(c["kind"], c["codename"], c["detail"]) for c in validation["conflicts"]])

    con.commit()
    con.execute("VACUUM")

    # ---------------------------------------------------------------------
    # El artefacto que se reparte se entrega en journal_mode DELETE, aunque la
    # construccion se haga en WAL.
    #
    # POR QUE NO SE PUEDE DEJAR EN WAL
    # --------------------------------
    # La app abre el catalogo con `readOnly: true`, y con razon: el usuario
    # tecnico no debe poder modificar el catalogo por accidente. Pero el modo
    # WAL no necesita permiso de escritura EN LA BASE, necesita permiso de
    # escritura EN LA CARPETA: mantiene un indice de la escritura pendiente en
    # un archivo aparte, el `-shm`, que crea al abrir si puede. En una carpeta
    # de solo lectura, como `C:\Program Files\FixMyPhone\resources\catalog`, no
    # puede, y la apertura falla.
    #
    # Ese es el caso real: el instalador deja la app bajo Program Files y el
    # `.exe` pide `asInvoker`, sin privilegios. Con la base en WAL, el taller
    # instala, abre por primera vez y la app no encuentra su catalogo. Se
    #jusquo a construir el `.exe` para descubrirlo, y se descubre mirando la
    # carpeta `catalog` despues de arrancar: dos archivos `-shm` y `-wal` que
    # nadie habia pedido.
    #
    # WAL no compra nada aqui. La base se escribe una vez, se lee para siempre y
    # nunca hay dos escritores. Es el caso de uso donde WAL shines menos.
    #
    # El orden importa: journal_mode primero, VACUUM despues. Al cambiar de
    # modo se reescribe la cabecera y se reparten las paginas, y un VACUUM
    # anterior dejaria el archivo con el layout viejo. Con el orden este, el
    # VACUUM final ademas se lleva cualquier `-wal` o `-shm` que quedara.
    con.execute("PRAGMA journal_mode=DELETE")
    con.execute("VACUUM")
    con.commit()
    con.close()

    # `journal_mode=DELETE` no borra los archivos acompanantes si ya existian de
    # una corrida anterior. Se quitan a mano: un `-wal` de 0 bytes junto al
    # catalogo instalado confunde a cualquiera que abra la carpeta, y el
    # uninstaller de NSIS copiaria el arbol entero incluyendo basura.
    for sufijo in ("-wal", "-shm", "-journal"):
        acompanante = path.with_name(path.name + sufijo)
        if acompanante.exists():
            try:
                acompanante.unlink()
            except OSError as e:
                # No es fatal: la base ya quedo en DELETE y es valida. Se avisa
                # porque un archivo que no se pudo quitar significa que algo
                # todavia tiene la base abierta.
                log(f"aviso: no se pudo borrar {acompanante.name} "
                    f"({e.strerror}); quien lo tenga abierto lo esta usando")

    log(f"sqlite: {path} ({path.stat().st_size/1024:.0f} KB, "
        f"journal_mode=DELETE)")
    return path


COLUMNS = [
    "codename", "variant", "vendor", "marketing_name", "soc_raw", "soc_vendor",
    "platform", "model_numbers", "battery_mah", "screen_size", "screen_resolution",
    "android_version", "is_ab_device", "dynamic_partitions", "verified_boot",
    "recovery_partition_name", "install_method", "download_mode",
    "signed_material_required", "capabilities", "risk_flags", "sources",
]


def build_csv(path: Path, variants: list[Variant]) -> Path:
    with open(path, "w", newline="", encoding="utf-8-sig") as fh:
        w = csv.writer(fh)
        w.writerow(COLUMNS)
        for v in sorted(variants, key=lambda x: (x.vendor.lower(), x.codename)):
            row = []
            for c in COLUMNS:
                val = getattr(v, c, None)
                if c == "risk_flags":
                    val = risk_flags(v)
                row.append(_j(val))
            w.writerow(row)
    log(f"csv: {path}")
    return path


def build_json(path: Path, variants: list[Variant], validation: dict) -> Path:
    payload = {
        "generated_at": now_iso(),
        "counts": validation["stats"],
        "variants": [v.to_dict() for v in sorted(
            variants, key=lambda x: (x.vendor.lower(), x.codename))],
    }
    path.write_text(json.dumps(payload, ensure_ascii=False, indent=1), encoding="utf-8")
    log(f"json: {path} ({path.stat().st_size/1024/1024:.1f} MB)")
    return path
