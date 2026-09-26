"""
Derivation layer: turn facts into *repair capabilities* and *flags*.

This is the part that makes the database usable by a technician instead of a
catalog. Every derived value is stored with confidence='inferred' and the rule
name, so the UI can show "por qué sabemos esto" and a human can override.
"""

from __future__ import annotations

import re

from .model import Variant
from .seed import SOC_VENDOR_CAPABILITIES

# ---------------------------------------------------------------- era rules

# Android 10 introduced dynamic partitions (super); 11+ is essentially always
# dynamic. Used only when the source did not state it explicitly.
_DYNAMIC_MIN_ANDROID = 11

# The single most consequential field for flashing: whether `recovery` is a
# real partition or whether flash targets are vendor_boot / boot.
RECOVERY_ALIASES = {
    "vendor_boot": "vendor_boot",
    "recovery": "recovery",
    "boot": "boot",
}


def _dynamic(v: Variant) -> bool | None:
    if v.android_version and v.android_version >= _DYNAMIC_MIN_ANDROID:
        return True
    return None


def _verified_boot(v: Variant) -> str:
    if v.soc_vendor in ("qualcomm", "mediatek", "unisoc", "hisilicon") and (v.android_version or 0) >= 9:
        return "avb"
    if v.android_version and v.android_version >= 7:
        return "avb"
    return ""


# ---------------------------------------------------------------- capabilities

BASE_CAPS = ["adb", "fastboot", "recovery", "ota"]


def derive_capabilities(v: Variant) -> list[str]:
    caps: set[str] = set(BASE_CAPS)

    if v.soc_vendor == "qualcomm":
        caps.add("edl")
    elif v.soc_vendor == "mediatek":
        caps.add("brom")
    elif v.soc_vendor == "unisoc":
        caps.add("fdl")
    elif v.soc_vendor == "exynos":
        caps.add("odin_download")
    elif v.soc_vendor == "hisilicon":
        caps.add("hitool")
    elif v.soc_vendor == "apple":
        caps = {"apple_lockdown", "apple_recovery", "apple_dfu"}
    elif v.soc_vendor == "tensor":
        caps.add("edl_none")

    if v.is_ab_device:
        caps.add("a_b_slots")
    else:
        caps.add("a_only")

    if v.dynamic_partitions:
        caps.add("dynamic_partitions")
        caps.add("fastbootd")

    if v.verified_boot:
        caps.add("verified_boot")

    if v.install_method in ("fastboot_unlocked", "fastboot_nexus", "fastboot_edl"):
        caps.add("unlock_official")
    elif v.custom_unlock_cmd:
        caps.add("unlock_official")

    # Repairs that are universally applicable and carry no risk of radio
    # identity change: these are the P0 revenue procedures.
    caps.update({"battery_calibration", "network_reset", "sim_reset",
                 "frp_owner_assisted", "official_rom_flash", "storage_health_read",
                 "battery_health_read", "thermal_read", "display_pwm_test",
                 "touch_grid_test", "evidence_capture"})

    return sorted(caps)


def risk_flags(v: Variant) -> list[str]:
    """Warnings the technician must see BEFORE any write operation."""
    flags: list[str] = []
    if v.soc_vendor == "qualcomm" and v.signed_material_required:
        flags.append("edl_requires_signed_programmer")
    if v.soc_vendor == "mediatek" and v.signed_material_required:
        flags.append("brom_requires_da_agent")
    if v.soc_vendor == "unisoc" and v.signed_material_required:
        flags.append("fdl_secure_download_may_be_blocked")
    if v.soc_vendor == "exynos" and v.signed_material_required:
        flags.append("odin_requires_signed_secure_package")
    if v.soc_vendor == "hisilicon":
        flags.append("hisilicon_download_unsupported_on_new_soc")
    if v.soc_vendor == "tensor":
        flags.append("no_edl_on_tensor_oem_key_signed")
    if v.pre_install_instructions:
        flags.append(f"pre_install_required:{v.pre_install_instructions}")
    if v.recovery_partition_name and v.recovery_partition_name != "recovery":
        flags.append(f"recovery_flash_target_is:{v.recovery_partition_name}")
    if v.is_ab_device is False and v.soc_vendor in ("mediatek", "unisoc"):
        flags.append("a_only_layout_full_scatter_required")
    if v.homologado_ift == "no":
        flags.append("ift_not_homologated_rf_risk")
    if v.android_version and v.android_version <= 9:
        flags.append("legacy_android_weak_boot_chain")
    if re.match(r"^(SM-|GT-)", (v.model_numbers or [""])[0] or "") or \
       any(re.match(r"^(SM-|GT-)", m) for m in (v.model_numbers or [])[1:]):
        flags.append("samsung_knox_eFuse_risk_on_unlock")
    return flags


def enrich(v: Variant) -> Variant:
    v.dynamic_partitions = _dynamic(v)
    v.verified_boot = _verified_boot(v)
    v.capabilities = derive_capabilities(v)
    return v


def verification_gates(v: Variant) -> list[dict]:
    """
    The post-repair checks the workflow engine will enforce. These are the
    reason the product exists: a repair is not 'done' until these pass.
    """
    gates: list[dict] = [
        {"id": "power_on", "name": "El equipo enciende y no reinicia en 3 min",
         "kind": "hardware", "blocking": True},
        {"id": "charging", "name": "Detecta carga y aumenta el porcentaje",
         "kind": "hardware", "blocking": True},
        {"id": "battery_report", "name": "Bateria reporta capacidad real > 60% del diseño",
         "kind": "hardware", "blocking": False},
        {"id": "touch_grid", "name": "Rejilla de táctil sin zonas muertas",
         "kind": "sensor", "blocking": True},
        {"id": "display_pwm", "name": "Pantalla sin parpadeo anormal / lineas",
         "kind": "display", "blocking": True},
        {"id": "audio_path", "name": "Altavoz, auricular y microfonos responden",
         "kind": "audio", "blocking": True},
        {"id": "cameras", "name": "Todas las camaras abren imagen",
         "kind": "camera", "blocking": True},
        {"id": "sensors", "name": "Proximidad, huella y giroscopio responden",
         "kind": "sensor", "blocking": False},
        {"id": "network_register", "name": "Registra en la red destino (SIM Telcel/AT&T/Movistar)",
         "kind": "network", "blocking": True},
        {"id": "data_browse", "name": "Abre internet y resuelve DNS",
         "kind": "network", "blocking": True},
        {"id": "call_voicemail", "kind": "network", "blocking": False,
         "name": "Llamada / mensaje saliente"},
        {"id": "gms", "name": "Play Servicios y apps base abren",
         "kind": "software", "blocking": False},
        {"id": "ota", "name": "Acepta(actualizar) sin error",
         "kind": "software", "blocking": False},
    ]
    if v.soc_vendor in ("qualcomm", "mediatek", "unisoc", "exynos") and v.signed_material_required:
        gates.append({"id": "radio_ident", "kind": "radio", "blocking": True,
                      "name": "IMEI/ESN intactos y sin cambios"})
    if v.is_ab_device:
        gates.append({"id": "slot_health", "kind": "bootchain", "blocking": False,
                      "name": "Ambos slots sanables (A/B activo y no corrupto)"})
    if v.verified_boot:
        gates.append({"id": "verified_boot_state", "kind": "bootchain", "blocking": False,
                      "name": "Estado de boot verificado sin alteraciones"})
    return gates
