"""
Curated seed data: the part of the database that is *repair knowledge*, not
public device data. Everything here is authored/maintained by FixMyPhone and
is the layer that no public dataset provides.

Design rule: a seed fact is always stored with source='seed' and a confidence
level, so the UI can distinguish "the manufacturer documented it" from
"FixMyPhone infers it from SoC family".
"""

from __future__ import annotations

# ---------------------------------------------------------------- SoC vendor

SOC_VENDOR_RULES: list[tuple[str, str]] = [
    # ordered: first match wins
    ("tensor", "tensor"),
    ("exynos", "exynos"),
    ("hisilicon", "hisilicon"),
    ("kirin", "hisilicon"),
    ("unisoc", "unisoc"),
    ("spreadtrum", "unisoc"),
    ("mediatek", "mediatek"),
    ("dimensity", "mediatek"),
    ("helio", "mediatek"),
    ("mtk6", "mediatek"),
    ("mt67", "mediatek"),
    ("qualcomm", "qualcomm"),
    ("snapdragon", "qualcomm"),
    ("smd", "qualcomm"),
    ("msm", "qualcomm"),
    ("sdm", "qualcomm"),
    ("sd4", "qualcomm"),
    ("sm6", "qualcomm"),
    ("sm7", "qualcomm"),
    ("omap", "ti"),
    ("intel", "intel"),
    ("allwinner", "allwinner"),
    ("rockchip", "rockchip"),
    ("nvidi", "nvidia"),
    ("apple", "apple"),
    ("bionic", "apple"),
    ("amlogic", "amlogic"),
]

# SoC facts the public sources do not publish yet (brand-new or NDA'd silicon).
# confidence='seed' means: a human wrote this, and it must be re-confirmed
# against a real unit before it is trusted for a flashing decision.
SEED_SOC_BY_CODENAME: dict[str, str] = {
    "comet": "Google Tensor G3",
    "felix": "Google Tensor G2",
    "zizhan": "Qualcomm SM8550 Snapdragon 8 Gen 2",
}

# ---------------------------------------------------------------- SoC family facts
# The single most repair-relevant attribute per vendor: how do I get a
# signed programmer / how do I enter a low-level download mode.
SOC_VENDOR_CAPABILITIES: dict[str, dict] = {
    "qualcomm": {
        "download_mode": "EDL 900E / 9008 (Sahara + Firehose XML)",
        "usb_ids": ["05C6:900E", "05C6:9008", "05C6:9001", "18D1:4EE0"],
        "signed_material_required": True,   # prog_firehose*.mbn, valid vs SoC build
        "signed_material_origin": "official OEM firmware package",
        "risk_notes": [
            "Firmware must match the exact SoC build number or Sahara fails.",
            "Sahara 'command not supported' usually means EDL2 / Sahara v2 is required.",
            "Unlocking bootloader via EDL can trip e-fuses (Knox/warranty bit).",
        ],
        "partitions_of_interest": ["persist", "devinfo", "devcfg", "frp", "fsc",
                                   "modemst1", "modemst2", "efs", "abl", "xbl", "rpm",
                                   "keymaster", "km4", "hyp", "devcfg"],
        "storage": "eMMC or UFS",
    },
    "mediatek": {
        "download_mode": "BROM 0E8D:0000 / Preloader 0E8D:0001 (BROM + DA agent)",
        "usb_ids": ["0E8D:0000", "0E8D:0001", "0E8D:0003"],
        "signed_material_required": True,   # DA agent / preloader binaries
        "signed_material_origin": "official OEM firmware package (scatter+agent)",
        "risk_notes": [
            "Newer MediaTek sets block preloader download behind an HR test point.",
            "A/B vs A-only changes the whole layout: A-only needs a full scatter flow.",
        ],
        "partitions_of_interest": ["preloader", "boot", "recovery", "system", "userdata",
                                   "nvdata", "cache", "lcus", "vgc"],
        "storage": "eMMC (UFS only on very recent MTK)",
    },
    "unisoc": {
        "download_mode": "FDL1/FDL2 (0x1786 / 2E04) + PAC package",
        "usb_ids": ["1786:4E00", "1786:4E01", "1786:4E02", "2E04:4E00"],
        "signed_material_required": True,   # FDL images / secure download key
        "signed_material_origin": "official OEM firmware package",
        "risk_notes": [
            "Secure download is key-gated on most Unisoc from ~2021; read-only is realistic.",
            "FDL1 download failure is usually a bad/expired preloader image, not a cable.",
        ],
        "partitions_of_interest": ["fdl1", "fdl2", "fdl3", "fdt", "u-boot", "spl",
                                   "userfs", "modempartition", "cpb"],
        "storage": "eMMC (UFS on newer)",
    },
    "exynos": {
        "download_mode": "Samsung Download mode 04E8:6600 / 685D (Odin-style protocol)",
        "usb_ids": ["04E8:6600", "04E8:685D", "04E8:6860"],
        "signed_material_required": True,   # secure download package signed by Samsung
        "signed_material_origin": "official Samsung firmware package",
        "risk_notes": [
            "'UNCORRECTABLE ERROR' = partition table / package integrity, not the cable.",
            "Restoring a device usually needs the NV+EFI backup taken beforehand.",
        ],
        "partitions_of_interest": ["BL", "CP", "HOME_CSC", "modemst1", "modemst2",
                                   "efs", "param", "pit", "KEYBOARD"],
        "storage": "eMMC or UFS",
    },
    "hisilicon": {
        "download_mode": "HiSuite / eDLD 12D1:1502 (largely undocumented)",
        "usb_ids": ["12D1:1502", "12D1:1C05", "12D1:1F08"],
        "signed_material_required": True,   # HiSuite download agent + RSA material
        "signed_material_origin": "official HiSuite / device firmware",
        "risk_notes": [
            "Protocol is undocumented and has not been maintained for years.",
            "Kirin post-2020 is effectively unsupported by any tool, including the boxes.",
        ],
        "partitions_of_interest": ["super", "cust", "product", "uefis", "fw_cfg"],
        "storage": "UFS",
    },
    "tensor": {
        "download_mode": "None (bootloader only, OEM key signed, no Qualcomm-style EDL)",
        "usb_ids": [],
        "signed_material_required": False,
        "signed_material_origin": "-",
        "risk_notes": [
            "Google Tensor: no EDL/BROM. Unlock goes through the OEM/Google program.",
            "Recovery lives in vendor_boot on most Tensor devices.",
        ],
        "partitions_of_interest": ["super", "vendor_boot", "dtbo", "vbmeta", "product"],
        "storage": "UFS",
    },
    "apple": {
        "download_mode": "Recovery / DFU mode (05AC:12A8 / 05AC:1337)",
        "usb_ids": ["05AC:12A8", "05AC:1337", "05AC:1270"],
        "signed_material_required": True,   # iOS signed build only
        "signed_material_origin": "signed IPSW from Apple",
        "risk_notes": [
            "Apple refuses unsigned firmware. No unbranded flashing is possible.",
            "Activation state is a server-side check, not a local partition.",
        ],
        "partitions_of_interest": ["n/a"],
        "storage": "NAND",
    },
}

# ---------------------------------------------------------------- lineage -> android
LINEAGE_TO_ANDROID = {
    "7.1": 6, "8.1": 8, "9": 9, "10": 10, "11": 11, "12": 12, "12.1": 12,
    "13": 13, "14": 14, "15": 15, "16": 16, "17": 16, "17.1": 16, "18": 17,
    "18.1": 17, "19": 18, "19.1": 18, "20": 19, "21": 20, "22": 21, "22.1": 21,
    "22.2": 21, "23": 22, "23.0": 22, "23.1": 22, "23.2": 22,
}

# ---------------------------------------------------------------- Mexican market context
MX_OPERATORS = [
    {"id": "telcel", "name": "Telcel", "network_owner": "Radiomobil Dipsa", "mno": "334",
     "bands_lte": ["2", "4", "5", "7", "12", "28", "66"], "bands_5g": ["n71", "n78"],
     "notes": "Banda 28 (700 MHz APT) is key for indoor coverage in Mexico."},
    {"id": "att-mx", "name": "AT&T Mexico", "network_owner": "Radiomobil Dipsa (operado por AT&T)", "mno": "33402",
     "bands_lte": ["2", "4", "5", "7", "12", "28", "66", "71"], "bands_5g": ["n71"],
     "notes": "Strong 700 MHz footprint."},
    {"id": "movistar", "name": "Movistar Mexico", "network_owner": "Telefonica Moviles Mexico", "mno": "334",
     "bands_lte": ["2", "4", "5", "7", "12", "28", "66"], "bands_5g": ["n71"],
     "notes": "MVNOs on this network inherit the same bands."},
    {"id": "mvno-generic", "name": "MVNO (Baitel / Total / otros)", "network_owner": "host MNO", "mno": "varia",
     "bands_lte": ["2", "4", "5", "7", "12", "28", "66"], "bands_5g": ["n71"],
     "notes": "MVNO reuse the host network bands; never diagnose an MVNO band problem here."},
]

# Devices that are commercially dominant in Mexico. Curated so that the MVP has
# verified depth (and explicit gaps) instead of accidental coverage.
MX_PRIORITY_DEVICES = [
    # codename, vendor, marketing, why
    ("bluejay", "Google", "Pixel 6a", "importado de USA, comun en reventa"),
    ("sunfish", "Google", "Pixel 4a", "importado de USA, muy revendido"),
    ("panther", "Google", "Pixel 6", "gama media-alta"),
    ("cheetah", "Google", "Pixel 4", "importado de USA"),
    ("rq3q", "Samsung", "Galaxy A54 5G", "top de ventas MX"),
    ("rq3a", "Samsung", "Galaxy A14", "top de ventas MX, muy barato de refaccionar"),
    ("a52q", "Samsung", "Galaxy A52", "muy comun en el mercado de reventa"),
    ("a32q", "Samsung", "Galaxy A32", "volumen"),
    ("e225f", "Samsung", "Galaxy A22", "gama baja media"),
    ("m31s", "Samsung", "Galaxy M31s", "mercado popular"),
    ("tapas", "Xiaomi", "Redmi Note 12", "importado"),
    ("spes", "Xiaomi", "Redmi 9A", "muy voluminoso"),
    ("loki", "Xiaomi", "Redmi 9", "muy voluminoso"),
    ("sweet", "Xiaomi", "Redmi Note 9 Pro", "popular"),
    ("lavender", "Xiaomi", "Redmi Note 9", "popular"),
    ("capri", "Xiaomi", "Redmi 9A (2020)", "volumen"),
    ("gauguin", "Xiaomi", "Redmi Note 9 Pro (5G)", "importado"),
    ("xmail", "Motorola", "moto g(60)", "gama media MX"),
    ("lemon", "Motorola", "moto g(70)", "popular"),
    ("rhode", "Motorola", "moto g(30)", "popular"),
    ("denver", "Motorola", "moto g(9) play", "gama baja, muy comun"),
]

# Known-safe knowledge for a handful of flagship families where the repair
# community has strong, stable rules. confidence='seed' is honest: reviewed
# by a human, not machine-derived.
SEED_OVERRIDES: dict[str, dict] = {
    "bluejay": {
        "recovery_partition_name": "vendor_boot",
        "custom_unlock_cmd": "fastboot flashing unlock",
        "is_ab_device": True,
        "capabilities_add": ["avb", "dynamic_partitions", "virtual_ab", "edl_none",
                             "fastboot", "adb", "recovery", "ota"],
    },
    "sunfish": {
        "is_ab_device": True,
        "capabilities_add": ["avb", "fastboot", "adb", "recovery", "ota"],
    },
}

# ---------------------------------------------------------------- confidence model
CONFIDENCE = {
    "verified": "confirmado por >=2 fuentes independientes o por el fabricante",
    "reported": "declarado por una fuente publica (no verificado en laboratorio)",
    "inferred": "derivado por regla; puede estar equivocado",
    "seed": "curado por FixMyPhone; requiere revision periodica",
}
