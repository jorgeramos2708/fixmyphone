"""
Normalization: raw source rows -> canonical Variant records.

A Variant is the atomic unit of the database. Not the model, not the marketing
name: the *variant*, because (codename + region/model string) is what decides
which flash procedure, which partitions and which parts are valid. Samsung
A54 exists as Exynos and as Snapdragon with the same codename family; that is
exactly where a model-level database bricks devices.
"""

from __future__ import annotations

import re
from dataclasses import dataclass, field, asdict
from typing import Any

from .brands import resuelve
from .seed import (LINEAGE_TO_ANDROID, SEED_SOC_BY_CODENAME, SOC_VENDOR_CAPABILITIES,
                   SOC_VENDOR_RULES)

# ------------------------------------------------------------------ helpers

_KERNEL_VER = re.compile(r"[-_](?:android[-_])?\d+\.\d+(?:[-.][\w.]+)?$")


def detect_soc_vendor(soc_raw: str) -> str:
    low = (soc_raw or "").lower()
    for token, vendor in SOC_VENDOR_RULES:
        if token in low:
            return vendor
    return "unknown"


def extract_platform(kernel_repo: str, vendor_short: str) -> str:
    """android_kernel_<vendor>_<platform>[_<variant>][-<kver>] -> platform"""
    if not kernel_repo:
        return ""
    parts = kernel_repo.split("_")
    if len(parts) < 3:
        return ""
    try:
        idx = 1 + [p.lower() for p in parts].index(vendor_short.lower())
    except ValueError:
        return ""
    platform = parts[idx]
    if not platform:
        return ""
    # 'gs-6.1_manifest' style: platform is the first token of the segment
    m = re.match(r"^([a-z]+\d*|universal\d+|gs\d*|mt\d+|ums\d+)", platform)
    if m and len(m.group(1)) >= 2:
        return m.group(1)
    return re.sub(r"[-_].*$", "", platform)


def parse_size_gb(text: Any) -> int | None:
    if text is None:
        return None
    m = re.match(r"\s*(\d+)", str(text))
    return int(m.group(1)) if m else None


def guess_android_from_lineage(versions: list) -> int | None:
    best = None
    for v in versions or []:
        key = str(v)
        a = LINEAGE_TO_ANDROID.get(key)
        if a and (best is None or a > best):
            best = a
    return best


def _as_list(value) -> list:
    if value is None:
        return []
    if isinstance(value, list):
        return value
    if isinstance(value, dict):
        return [f"{k}={v}" for k, v in value.items()]
    return [value]


# ------------------------------------------------------------------ record

@dataclass
class Provenance:
    field_name: str
    value: Any
    source: str
    confidence: str
    url: str = ""
    retrieved_at: str = ""


@dataclass
class Variant:
    # identity
    codename: str = ""
    variant: int | None = None
    vendor: str = ""
    vendor_short: str = ""
    marketing_name: str = ""
    model_numbers: list[str] = field(default_factory=list)
    device_tokens: list[str] = field(default_factory=list)   # ro.product.device seen in the wild
    release: str = ""

    # compute
    soc_raw: str = ""
    soc_vendor: str = "unknown"
    soc_model: str = ""
    platform: str = ""
    architecture: str = ""
    cpu: str = ""
    cpu_cores: str = ""
    cpu_freq: str = ""
    gpu: str = ""
    ram: str = ""
    storage: str = ""
    kernel_repo: str = ""
    kernel_version: str = ""

    # parts-relevant hardware
    battery_mah: int | None = None
    battery_removable: bool | None = None
    battery_tech: str = ""
    screen_size: float | None = None
    screen_resolution: str = ""
    screen_technology: str = ""
    screen_refresh: int | None = None
    cameras: list[str] = field(default_factory=list)
    peripherals: list[str] = field(default_factory=list)
    network_generations: list[str] = field(default_factory=list)
    dimensions: dict = field(default_factory=dict)

    # software / boot chain
    android_version: int | None = None
    lineage_versions: list[str] = field(default_factory=list)
    is_ab_device: bool | None = None
    dynamic_partitions: bool | None = None
    verified_boot: str = ""            # avb | dm-verity | none
    install_method: str = ""
    custom_unlock_cmd: str = ""
    recovery_partition_name: str = ""
    recovery_boot: str = ""
    download_boot: str = ""
    pre_install_instructions: str = ""
    pre_install_version: str = ""
    pre_recovery_partitions: list[str] = field(default_factory=list)

    # repair service metadata
    capabilities: list[str] = field(default_factory=list)
    download_mode: str = ""
    usb_ids: list[str] = field(default_factory=list)
    signed_material_required: bool | None = None
    risk_notes: list[str] = field(default_factory=list)

    # Homologacion IFT. Los cuatro valores posibles y quien los pone estan en
    # `ift.py`; en corto:
    #   homologado     se encontro el folio en la tabla de la marca
    #   sin_verificar  se busco en la tabla de la marca y no aparece
    #   desconocido     no hay tabla accesible para esa marca; no se busco
    #   no_soportado   solo por confirmacion humana, nunca automatico
    homologado_ift: str = "desconocido"
    ift_certificado: str = ""     # folio, p.ej. "JUOPCP26-00023609"
    ift_url: str = ""             # de donde se leyo el folio

    # Como se escribe la marca en pantalla. Vive en la base y no en el codigo de
    # la app a proposito: la tabla canonica esta en Python, y escribirla otra
    # vez en TypeScript es garantizar que las dos se desincronicen sin que nada
    # avise. `f x tec` -> "F(x)Tec" es el caso que lo demuestra: nadie que lea
    # el nombre en pantalla sabe que en la base esta sin parentesis.
    vendor_nombre: str = ""

    # provenance
    provenance: list[Provenance] = field(default_factory=list)
    sources: list[str] = field(default_factory=list)

    @property
    def key(self) -> str:
        return f"{self.codename}#{self.variant if self.variant is not None else '-'}"

    def add(self, name: str, value: Any, source: str, confidence: str,
            url: str = "", retrieved_at: str = "") -> None:
        if value in (None, "", [], {}):
            return
        if source not in self.sources:
            self.sources.append(source)
        self.provenance.append(
            Provenance(name, value, source, confidence, url, retrieved_at)
        )

    def to_dict(self) -> dict:
        d = asdict(self)
        d["provenance"] = [asdict(p) if not isinstance(p, dict) else p for p in self.provenance]
        return d


# ------------------------------------------------------------------ lineageos -> Variant

_ESPACIOS = re.compile(r"^\s*|\s*$")


_ETIQUETA_HTML = re.compile(r"</?[a-zA-Z][^>]*>")
_ESPACIOS_SOBRANTES = re.compile(r"[ \t]{2,}")
_ESPACIOS_ANTES_PUNT = re.compile(r"\s+([.,;:])")


def _sin_html(bruto) -> str:
    """Quita las etiquetas que el wiki de LineageOS deja dentro del texto.

    -----------------------------------------------------------------------
    POR QUE ESTA FUNCION EXISTE
    -----------------------------------------------------------------------
    El wiki escribe los botones como HTML embebido en el YAML, porque en su
    pagina esos botones se ven resaltados:

        recovery_boot: 'With the device powered off, hold <kbd>Volume Up</kbd> + <kbd>Power</kbd>.'

    Ese texto se copiaba tal cual a la base, y 1,376 campos de 763 variantes
    viajaban con las etiquetas dentro. Un informe firmado que imprimiera eso
    mostraria "<kbd>Power</kbd>" al cliente, que es la clase de basura que hace
    que un buen informe deje de leerse.

    Se quitan las etiquetas, NO se traduce el texto. El texto es ingles porque
    la fuente es inglesa, y traducirlo inventaria palabras sobre como se entra a
    recovery en cada modelo; la app lo muestra marcando que viene de la fuente.

    El signo de mas sobrevive: `<kbd>Volume Up</kbd> + <kbd>Power</kbd>` se
    convierte en "Volume Up + Power", que es exactamente como se escribe.
    """
    if not isinstance(bruto, str):
        return ""
    s = _ETIQUETA_HTML.sub("", bruto)
    # La etiqueta ocupaba el lugar de un espacio, y al quitarla quedan dobles
    # ("Power ." / "Volume Down +  Power").
    s = _ESPACIOS_SOBRANTES.sub(" ", s)
    s = _ESPACIOS_ANTES_PUNT.sub(r"\1", s)
    return s.strip()


def _normaliza_release(bruto) -> str:
    """Lleva `release` del wiki a `AAAA-MM` o `AAAA-MM-DD`, o a "" si no se puede.

    Acepta tres formas, que son las que aparecen en la fuente:
      - "2016-04"          fecha directa
      - "2018-5-15"        con el mes sin cero a la izquierda
      - {"SM-G9006V": "2014-04", ...}   un mapa por numero de modelo
    """
    if isinstance(bruto, dict):
        fechas = [_normaliza_release(v) for v in bruto.values()]
        fechas = [f for f in fechas if f]
        # La mas antigua: cuando salio el equipo, no cuando se actualizo.
        return min(fechas) if fechas else ""
    if isinstance(bruto, (list, tuple)):
        fechas = [_normaliza_release(v) for v in bruto]
        fechas = [f for f in fechas if f]
        return min(fechas) if fechas else ""
    if not isinstance(bruto, (str, int)):
        return ""

    m = re.match(r"^(\d{4})-(\d{1,2})(?:-(\d{1,2}))?$", _ESPACIOS.sub("", str(bruto)))
    if not m:
        return ""
    anio, mes, dia = m.group(1), int(m.group(2)), m.group(3)
    if not 1 <= mes <= 12:
        return ""
    if dia is not None:
        if not 1 <= int(dia) <= 31:
            return ""
        return f"{anio}-{mes:02d}-{int(dia):02d}"
    return f"{anio}-{mes:02d}"


def from_lineageos(doc: dict) -> Variant | None:
    codename = (doc.get("codename") or "").strip()
    if not codename:
        return None
    url = doc.get("_source_url", "")
    ts = doc.get("_retrieved_at", "")
    src, rep = "lineageos", "reported"

    # La marca se normaliza aqui y no despues. Si se deja la cadena tal cual
    # queda "OPPO", "Vivo" y "LGE" conviviendo con "oppo", "vivo" y "LG", y
    # el cruce con el padron del IFT deja de encontrar nada sin que se note
    # donde esta el fallo: parece un padron vacio, y no lo es.
    marca_cruda = str(doc.get("vendor") or "").strip()
    marca = resuelve(marca_cruda)

    v = Variant(codename=codename, vendor=marca.clave,
                vendor_nombre=marca.nombre or marca_cruda,
                vendor_short=str(doc.get("vendor_short") or "").strip(),
                marketing_name=str(doc.get("name") or "").strip())
    v.sources.append(src)

    v.add("codename", codename, src, "verified", url, ts)
    v.add("vendor", v.vendor, src, rep, url, ts)
    if marca.cambiada:
        # Queda escrito de donde salio la marca, porque "por que esta esto
        # como LG y no como LGE" es la primera pregunta que hace quien audita.
        v.add("vendor_original", marca.original, src, "reported", url, ts)
        v.add("vendor_renombrado", f"{marca.original} -> {marca.clave}: {marca.motivo}",
              "brands", "inferred", url, ts)
    if doc.get("variant") is not None:
        v.variant = int(doc["variant"])
        v.add("variant", v.variant, src, "verified", url, ts)
    v.add("marketing_name", v.marketing_name, src, rep, url, ts)
    if doc.get("release"):
        # La fecha de lanzamiento se normaliza a `AAAA-MM` o `AAAA-MM-DD`.
        #
        # Sin esto, cuatro variantes guardaban basura. El wiki de LineageOS usa
        # para `release` un mapa de numero de modelo a fecha cuando un equipo
        # salio en varios meses segun el pais: al serializarlo con `str()` se
        # guardaba el repr del diccionario entero
        # (`"[{'SM-G9006V': '2014-04'}]"`) en lugar de una fecha. Ese texto no
        # es una fecha, no se puede parsear, y un `Number()` en el lector de la
        # app daria NaN en pantalla.
        #
        # Cuando el mapa trae una sola entrada, esa es la fecha. Con varias se
        # toma la mas antigua, que es cuando salio el equipo, y no la ultima
        # version: la app muestra cuando se lanzo, no cuando se actualizo por
        # ultima vez. Si las fechas no son parseables, se deja vacio y el
        # pipeline lo reporta, en vez de inventar una.
        v.release = _normaliza_release(doc["release"])
        if v.release:
            v.add("release", v.release, src, rep, url, ts)

    models = _as_list(doc.get("models"))
    v.model_numbers = [str(m).strip() for m in models if str(m).strip()]
    if v.model_numbers:
        v.add("model_numbers", v.model_numbers, src, rep, url, ts)

    # compute
    raw_soc = doc.get("soc")
    if isinstance(raw_soc, list):
        raw_soc = " / ".join(str(x) for x in raw_soc)
    v.soc_raw = str(raw_soc or "").strip()
    if not v.soc_raw and codename in SEED_SOC_BY_CODENAME:
        v.soc_raw = SEED_SOC_BY_CODENAME[codename]
        v.add("soc_raw", v.soc_raw, "seed", "seed", "", "")
    v.soc_vendor = detect_soc_vendor(v.soc_raw)
    if v.soc_raw:
        v.soc_model = v.soc_raw
        v.add("soc_raw", v.soc_raw, src, rep, url, ts)
        v.add("soc_vendor", v.soc_vendor, src, "inferred", url, ts)

    kern = doc.get("kernel") or {}
    if isinstance(kern, dict):
        v.kernel_repo = str(kern.get("repo") or "")
        v.kernel_version = str(kern.get("version") or "")
        if v.kernel_repo:
            v.add("kernel_repo", v.kernel_repo, src, rep, url, ts)
    plat = extract_platform(v.kernel_repo, v.vendor_short)
    if plat:
        v.platform = plat
        v.add("platform", plat, src, "inferred", url, ts)

    v.architecture = str(doc.get("architecture") or "")
    v.cpu = str(doc.get("cpu") or "")
    v.cpu_cores = str(doc.get("cpu_cores") or "")
    v.cpu_freq = str(doc.get("cpu_freq") or "")
    v.gpu = str(doc.get("gpu") or "")
    v.ram = str(doc.get("ram") or "")
    v.storage = str(doc.get("storage") or "")
    for name in ("architecture", "cpu", "cpu_cores", "cpu_freq", "gpu", "ram", "storage"):
        v.add(name, getattr(v, name), src, rep, url, ts)

    # parts-relevant hardware
    bat = doc.get("battery") or {}
    if isinstance(bat, dict):
        v.battery_mah = bat.get("capacity")
        v.battery_removable = bat.get("removable")
        v.battery_tech = str(bat.get("tech") or "")
        v.add("battery_mah", v.battery_mah, src, rep, url, ts)
        v.add("battery_removable", v.battery_removable, src, rep, url, ts)
        v.add("battery_tech", v.battery_tech, src, rep, url, ts)

    scr = doc.get("screen") or {}
    if isinstance(scr, dict):
        v.screen_size = scr.get("size")
        v.screen_resolution = str(scr.get("resolution") or "")
        v.screen_technology = str(scr.get("technology") or "")
        v.screen_refresh = scr.get("refresh_rate")
        for name in ("screen_size", "screen_resolution", "screen_technology",
                     "screen_refresh"):
            v.add(name, getattr(v, name), src, rep, url, ts)

    cams = doc.get("cameras") or []
    if isinstance(cams, list):
        for c in cams:
            if isinstance(c, dict):
                info = str(c.get("info") or "")
                flash = c.get("flash")
                v.cameras.append(f"{info}{' + ' + str(flash) if flash else ''}".strip(" +"))
            else:
                v.cameras.append(str(c))
        if v.cameras:
            v.add("cameras", v.cameras, src, rep, url, ts)

    v.peripherals = [str(p) for p in _as_list(doc.get("peripherals"))]
    if v.peripherals:
        v.add("peripherals", v.peripherals, src, rep, url, ts)

    v.network_generations = [str(n) for n in _as_list(doc.get("network"))]
    if v.network_generations:
        v.add("network_generations", v.network_generations, src, rep, url, ts)

    dim = doc.get("dimensions") or {}
    if isinstance(dim, dict):
        v.dimensions = {k: dim.get(k) for k in ("width", "height", "depth") if dim.get(k)}

    # software / boot chain
    vers = [str(x) for x in _as_list(doc.get("versions"))]
    v.lineage_versions = vers
    if vers:
        v.add("lineage_versions", vers, src, "verified", url, ts)
    android = guess_android_from_lineage(vers) or guess_android_from_lineage(
        [str(doc.get("current_branch") or "")])
    if android:
        v.android_version = android
        v.add("android_version", android, src, "inferred", url, ts)

    if doc.get("is_ab_device") is not None:
        v.is_ab_device = bool(doc["is_ab_device"])
        v.add("is_ab_device", v.is_ab_device, src, "verified", url, ts)

    v.install_method = str(doc.get("install_method") or "")
    if v.install_method:
        v.add("install_method", v.install_method, src, "verified", url, ts)
    v.custom_unlock_cmd = str(doc.get("custom_unlock_cmd") or "")
    if v.custom_unlock_cmd:
        v.add("custom_unlock_cmd", v.custom_unlock_cmd, src, "verified", url, ts)
    v.recovery_partition_name = str(doc.get("recovery_partition_name") or "")
    if v.recovery_partition_name:
        v.add("recovery_partition_name", v.recovery_partition_name, src, "verified", url, ts)
    v.recovery_boot = _sin_html(doc.get("recovery_boot") or "")
    v.download_boot = _sin_html(doc.get("download_boot") or "")
    for name in ("recovery_boot", "download_boot"):
        val = getattr(v, name)
        if val:
            v.add(name, val, src, "verified", url, ts)

    bi = doc.get("before_install") or {}
    if isinstance(bi, dict):
        v.pre_install_instructions = str(bi.get("instructions") or "")
        v.pre_install_version = str(bi.get("version") or "")
        v.add("pre_install_instructions", v.pre_install_instructions, src, "verified", url, ts)
        v.add("pre_install_version", v.pre_install_version, src, "verified", url, ts)
    br = doc.get("before_recovery_install") or {}
    if isinstance(br, dict) and br.get("instructions"):
        v.pre_recovery_partitions = [str(p) for p in _as_list(br.get("partitions"))]
        v.add("pre_recovery_partitions", v.pre_recovery_partitions, src, "verified", url, ts)

    apply_soc_family(v)
    return v


# ------------------------------------------------------------------ SoC family metadata

def apply_soc_family(v: Variant) -> None:
    fam = SOC_VENDOR_CAPABILITIES.get(v.soc_vendor)
    if not fam:
        return
    if not v.download_mode:
        v.download_mode = fam["download_mode"]
        v.add("download_mode", v.download_mode, "seed", "seed")
    if not v.usb_ids:
        v.usb_ids = list(fam["usb_ids"])
        v.add("usb_ids", v.usb_ids, "seed", "seed")
    if v.signed_material_required is None:
        v.signed_material_required = bool(fam["signed_material_required"])
        v.add("signed_material_required", v.signed_material_required, "seed", "seed")
    if not v.risk_notes:
        v.risk_notes = list(fam["risk_notes"])
        v.add("risk_notes", v.risk_notes, "seed", "seed")
    if "seed" not in v.sources:
        v.sources.append("seed")


# ------------------------------------------------------------------ play -> alias rows

def from_play(row: dict) -> dict:
    """Play rows are not variants: they are runtime identification aliases."""
    return {
        "device_token": row["device_token"],
        "brand": row["brand"],
        "marketing": row["marketing"],
        "model": row["model"],
        "url": row["url"],
        "retrieved_at": row["retrieved_at"],
    }
