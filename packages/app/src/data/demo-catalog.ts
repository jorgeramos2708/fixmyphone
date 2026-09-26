/**
 * Subconjunto del catalogo para la demostracion web.
 * ===========================================================================
 *
 * GENERADO AUTOMATICAMENTE. No editar a mano.
 *
 *   Origen:     packages/device-db/data/out/fixmyphone_device_db.sqlite
 *   Script:     tools/generar-demo-catalog.mjs
 *   Regenerar:  npm run db:build && node tools/generar-demo-catalog.mjs
 *
 * POR QUE EXISTE
 * --------------
 * La app de escritorio abre el SQLite completo: 734 variantes, 12 MB. El
 * navegador no puede abrir un SQLite sin WASM, asi que la demo web carga este
 * recorte de 48 variantes. Los datos son REALES: si la app dice "Exynos
 * 1380" es porque el catalogo lo dice, no porque alguien lo escribio a mano.
 *
 * El recorte es por ESTRATOS con cupos fijos, no "los 48 con mejor puntaje".
 * Un puntaje global produce casi siempre un solo estrato, y una demo que solo
 * muestra un caso no muestra nada:
 *
 *   12 ambiguas  codename con varias variantes de placa: la herramienta NO
 *                elige por el tecnico, que es la promesa central.
 *   26 directas  codename unico de marca grande: llega, resuelve, entrega.
 *   hasta 10     marca chica, maximo 2 por marca, para que la pantalla de
 *   distintas    marca no muestre cuatro logos.
 *
 * ACENTOS
 * -------
 * Este archivo se escribe SIN tildes en los comentarios, a proposito. Pasa por
 * la consola de Windows, que usa cp1252, y una tilde sobrevive al viaje como un
 * caracter roto. Perder un acento en un comentario es mejor que tener codigo
 * corrupto en un archivo de 160 kB. Los DATOS no llevan problema: vienen de la
 * base, que esta en UTF-8.
 */

import type { DeviceVariant } from "@fixmyphone/core";

export const DEMO_CATALOG: DeviceVariant[] = [
{
    "codename": "lamu",
    "variant": "3",
    "key": "lamu#3",
    "marketingName": "moto g05",
    "vendor": "Motorola",
    "soc": "Mediatek Helio G81 Extreme",
    "socVendor": "mediatek",
    "platform": "lamu",
    "modelNumbers": [
      "XT2523-2",
      "XT2523-3",
      "XT2523-4",
      "XT2523-5",
      "XT2523-9",
      "XT2523-10",
      "XT2523-11"
    ],
    "androidVersion": 22,
    "release": "2024-12",
    "capabilities": [
      "a_b_slots",
      "adb",
      "battery_calibration",
      "battery_health_read",
      "brom",
      "display_pwm_test",
      "dynamic_partitions",
      "evidence_capture",
      "fastboot",
      "fastbootd",
      "frp_owner_assisted",
      "network_reset",
      "official_rom_flash",
      "ota",
      "recovery",
      "sim_reset",
      "storage_health_read",
      "thermal_read",
      "touch_grid_test",
      "verified_boot"
    ],
    "riskFlags": [
      "brom_requires_da_agent",
      "pre_install_required:needs_specific_android_fw",
      "recovery_flash_target_is:vendor_boot"
    ],
    "verificationGates": [
      {
        "id": "power_on",
        "name": "El equipo enciende y no reinicia en 3 min",
        "kind": "hardware",
        "blocking": true
      },
      {
        "id": "charging",
        "name": "Detecta carga y aumenta el porcentaje",
        "kind": "hardware",
        "blocking": true
      },
      {
        "id": "battery_report",
        "name": "Bateria reporta capacidad real > 60% del diseño",
        "kind": "hardware",
        "blocking": false
      },
      {
        "id": "touch_grid",
        "name": "Rejilla de táctil sin zonas muertas",
        "kind": "sensor",
        "blocking": true
      },
      {
        "id": "display_pwm",
        "name": "Pantalla sin parpadeo anormal / lineas",
        "kind": "display",
        "blocking": true
      },
      {
        "id": "audio_path",
        "name": "Altavoz, auricular y microfonos responden",
        "kind": "audio",
        "blocking": true
      },
      {
        "id": "cameras",
        "name": "Todas las camaras abren imagen",
        "kind": "camera",
        "blocking": true
      },
      {
        "id": "sensors",
        "name": "Proximidad, huella y giroscopio responden",
        "kind": "sensor",
        "blocking": false
      },
      {
        "id": "network_register",
        "name": "Registra en la red destino (SIM Telcel/AT&T/Movistar)",
        "kind": "network",
        "blocking": true
      },
      {
        "id": "data_browse",
        "name": "Abre internet y resuelve DNS",
        "kind": "network",
        "blocking": true
      },
      {
        "id": "call_voicemail",
        "kind": "network",
        "blocking": false,
        "name": "Llamada / mensaje saliente"
      },
      {
        "id": "gms",
        "name": "Play Servicios y apps base abren",
        "kind": "software",
        "blocking": false
      },
      {
        "id": "ota",
        "name": "Acepta(actualizar) sin error",
        "kind": "software",
        "blocking": false
      },
      {
        "id": "radio_ident",
        "kind": "radio",
        "blocking": true,
        "name": "IMEI/ESN intactos y sin cambios"
      },
      {
        "id": "slot_health",
        "kind": "bootchain",
        "blocking": false,
        "name": "Ambos slots sanables (A/B activo y no corrupto)"
      },
      {
        "id": "verified_boot_state",
        "kind": "bootchain",
        "blocking": false,
        "name": "Estado de boot verificado sin alteraciones"
      }
    ],
    "sources": [
      "lineageos",
      "seed",
      "play"
    ]
  },
{
    "codename": "Mi439",
    "variant": "1",
    "key": "Mi439#1",
    "marketingName": "Redmi 7A",
    "vendor": "Xiaomi",
    "soc": "Qualcomm SDM439 Snapdragon 439",
    "socVendor": "qualcomm",
    "platform": "msm8937",
    "modelNumbers": [
      "M1903C3EC",
      "M1903C3EE",
      "M1903C3EG",
      "M1903C3EH",
      "M1903C3EI",
      "M1903C3ET"
    ],
    "androidVersion": 22,
    "release": "2019-05-28",
    "capabilities": [
      "a_only",
      "adb",
      "battery_calibration",
      "battery_health_read",
      "display_pwm_test",
      "dynamic_partitions",
      "edl",
      "evidence_capture",
      "fastboot",
      "fastbootd",
      "frp_owner_assisted",
      "network_reset",
      "official_rom_flash",
      "ota",
      "recovery",
      "sim_reset",
      "storage_health_read",
      "thermal_read",
      "touch_grid_test",
      "verified_boot"
    ],
    "riskFlags": [
      "edl_requires_signed_programmer",
      "pre_install_required:needs_specific_android_fw"
    ],
    "verificationGates": [
      {
        "id": "power_on",
        "name": "El equipo enciende y no reinicia en 3 min",
        "kind": "hardware",
        "blocking": true
      },
      {
        "id": "charging",
        "name": "Detecta carga y aumenta el porcentaje",
        "kind": "hardware",
        "blocking": true
      },
      {
        "id": "battery_report",
        "name": "Bateria reporta capacidad real > 60% del diseño",
        "kind": "hardware",
        "blocking": false
      },
      {
        "id": "touch_grid",
        "name": "Rejilla de táctil sin zonas muertas",
        "kind": "sensor",
        "blocking": true
      },
      {
        "id": "display_pwm",
        "name": "Pantalla sin parpadeo anormal / lineas",
        "kind": "display",
        "blocking": true
      },
      {
        "id": "audio_path",
        "name": "Altavoz, auricular y microfonos responden",
        "kind": "audio",
        "blocking": true
      },
      {
        "id": "cameras",
        "name": "Todas las camaras abren imagen",
        "kind": "camera",
        "blocking": true
      },
      {
        "id": "sensors",
        "name": "Proximidad, huella y giroscopio responden",
        "kind": "sensor",
        "blocking": false
      },
      {
        "id": "network_register",
        "name": "Registra en la red destino (SIM Telcel/AT&T/Movistar)",
        "kind": "network",
        "blocking": true
      },
      {
        "id": "data_browse",
        "name": "Abre internet y resuelve DNS",
        "kind": "network",
        "blocking": true
      },
      {
        "id": "call_voicemail",
        "kind": "network",
        "blocking": false,
        "name": "Llamada / mensaje saliente"
      },
      {
        "id": "gms",
        "name": "Play Servicios y apps base abren",
        "kind": "software",
        "blocking": false
      },
      {
        "id": "ota",
        "name": "Acepta(actualizar) sin error",
        "kind": "software",
        "blocking": false
      },
      {
        "id": "radio_ident",
        "kind": "radio",
        "blocking": true,
        "name": "IMEI/ESN intactos y sin cambios"
      },
      {
        "id": "verified_boot_state",
        "kind": "bootchain",
        "blocking": false,
        "name": "Estado de boot verificado sin alteraciones"
      }
    ],
    "sources": [
      "lineageos",
      "seed"
    ]
  },
{
    "codename": "joan",
    "variant": "3",
    "key": "joan#3",
    "marketingName": "V30 (Other)",
    "vendor": "LG",
    "soc": "Qualcomm MSM8998 Snapdragon 835",
    "socVendor": "qualcomm",
    "platform": "msm8998",
    "modelNumbers": [
      "H931",
      "H933",
      "LS998",
      "V300L",
      "V300K",
      "V300S",
      "VS996"
    ],
    "androidVersion": 21,
    "release": "2017-08",
    "capabilities": [
      "a_only",
      "adb",
      "battery_calibration",
      "battery_health_read",
      "display_pwm_test",
      "dynamic_partitions",
      "edl",
      "evidence_capture",
      "fastboot",
      "fastbootd",
      "frp_owner_assisted",
      "network_reset",
      "official_rom_flash",
      "ota",
      "recovery",
      "sim_reset",
      "storage_health_read",
      "thermal_read",
      "touch_grid_test",
      "verified_boot"
    ],
    "riskFlags": [
      "edl_requires_signed_programmer",
      "pre_install_required:needs_specific_android_fw"
    ],
    "verificationGates": [
      {
        "id": "power_on",
        "name": "El equipo enciende y no reinicia en 3 min",
        "kind": "hardware",
        "blocking": true
      },
      {
        "id": "charging",
        "name": "Detecta carga y aumenta el porcentaje",
        "kind": "hardware",
        "blocking": true
      },
      {
        "id": "battery_report",
        "name": "Bateria reporta capacidad real > 60% del diseño",
        "kind": "hardware",
        "blocking": false
      },
      {
        "id": "touch_grid",
        "name": "Rejilla de táctil sin zonas muertas",
        "kind": "sensor",
        "blocking": true
      },
      {
        "id": "display_pwm",
        "name": "Pantalla sin parpadeo anormal / lineas",
        "kind": "display",
        "blocking": true
      },
      {
        "id": "audio_path",
        "name": "Altavoz, auricular y microfonos responden",
        "kind": "audio",
        "blocking": true
      },
      {
        "id": "cameras",
        "name": "Todas las camaras abren imagen",
        "kind": "camera",
        "blocking": true
      },
      {
        "id": "sensors",
        "name": "Proximidad, huella y giroscopio responden",
        "kind": "sensor",
        "blocking": false
      },
      {
        "id": "network_register",
        "name": "Registra en la red destino (SIM Telcel/AT&T/Movistar)",
        "kind": "network",
        "blocking": true
      },
      {
        "id": "data_browse",
        "name": "Abre internet y resuelve DNS",
        "kind": "network",
        "blocking": true
      },
      {
        "id": "call_voicemail",
        "kind": "network",
        "blocking": false,
        "name": "Llamada / mensaje saliente"
      },
      {
        "id": "gms",
        "name": "Play Servicios y apps base abren",
        "kind": "software",
        "blocking": false
      },
      {
        "id": "ota",
        "name": "Acepta(actualizar) sin error",
        "kind": "software",
        "blocking": false
      },
      {
        "id": "radio_ident",
        "kind": "radio",
        "blocking": true,
        "name": "IMEI/ESN intactos y sin cambios"
      },
      {
        "id": "verified_boot_state",
        "kind": "bootchain",
        "blocking": false,
        "name": "Estado de boot verificado sin alteraciones"
      }
    ],
    "sources": [
      "lineageos",
      "seed",
      "play"
    ]
  },
{
    "codename": "nash",
    "variant": "1",
    "key": "nash#1",
    "marketingName": "moto z2 force",
    "vendor": "Motorola",
    "soc": "Qualcomm MSM8998 Snapdragon 835",
    "socVendor": "qualcomm",
    "platform": "msm8998",
    "modelNumbers": [
      "XT1789-02",
      "XT1789-03",
      "XT1789-04",
      "XT1789-05",
      "XT1789-06",
      "XT1789-07"
    ],
    "androidVersion": 21,
    "release": "2017-07",
    "capabilities": [
      "a_b_slots",
      "adb",
      "battery_calibration",
      "battery_health_read",
      "display_pwm_test",
      "dynamic_partitions",
      "edl",
      "evidence_capture",
      "fastboot",
      "fastbootd",
      "frp_owner_assisted",
      "network_reset",
      "official_rom_flash",
      "ota",
      "recovery",
      "sim_reset",
      "storage_health_read",
      "thermal_read",
      "touch_grid_test",
      "verified_boot"
    ],
    "riskFlags": [
      "edl_requires_signed_programmer",
      "pre_install_required:nash",
      "recovery_flash_target_is:boot"
    ],
    "verificationGates": [
      {
        "id": "power_on",
        "name": "El equipo enciende y no reinicia en 3 min",
        "kind": "hardware",
        "blocking": true
      },
      {
        "id": "charging",
        "name": "Detecta carga y aumenta el porcentaje",
        "kind": "hardware",
        "blocking": true
      },
      {
        "id": "battery_report",
        "name": "Bateria reporta capacidad real > 60% del diseño",
        "kind": "hardware",
        "blocking": false
      },
      {
        "id": "touch_grid",
        "name": "Rejilla de táctil sin zonas muertas",
        "kind": "sensor",
        "blocking": true
      },
      {
        "id": "display_pwm",
        "name": "Pantalla sin parpadeo anormal / lineas",
        "kind": "display",
        "blocking": true
      },
      {
        "id": "audio_path",
        "name": "Altavoz, auricular y microfonos responden",
        "kind": "audio",
        "blocking": true
      },
      {
        "id": "cameras",
        "name": "Todas las camaras abren imagen",
        "kind": "camera",
        "blocking": true
      },
      {
        "id": "sensors",
        "name": "Proximidad, huella y giroscopio responden",
        "kind": "sensor",
        "blocking": false
      },
      {
        "id": "network_register",
        "name": "Registra en la red destino (SIM Telcel/AT&T/Movistar)",
        "kind": "network",
        "blocking": true
      },
      {
        "id": "data_browse",
        "name": "Abre internet y resuelve DNS",
        "kind": "network",
        "blocking": true
      },
      {
        "id": "call_voicemail",
        "kind": "network",
        "blocking": false,
        "name": "Llamada / mensaje saliente"
      },
      {
        "id": "gms",
        "name": "Play Servicios y apps base abren",
        "kind": "software",
        "blocking": false
      },
      {
        "id": "ota",
        "name": "Acepta(actualizar) sin error",
        "kind": "software",
        "blocking": false
      },
      {
        "id": "radio_ident",
        "kind": "radio",
        "blocking": true,
        "name": "IMEI/ESN intactos y sin cambios"
      },
      {
        "id": "slot_health",
        "kind": "bootchain",
        "blocking": false,
        "name": "Ambos slots sanables (A/B activo y no corrupto)"
      },
      {
        "id": "verified_boot_state",
        "kind": "bootchain",
        "blocking": false,
        "name": "Estado de boot verificado sin alteraciones"
      }
    ],
    "sources": [
      "lineageos",
      "seed"
    ]
  },
{
    "codename": "nash",
    "variant": "2",
    "key": "nash#2",
    "marketingName": "moto z (2018)",
    "vendor": "Motorola",
    "soc": "Qualcomm MSM8998 Snapdragon 835",
    "socVendor": "qualcomm",
    "platform": "msm8998",
    "modelNumbers": [
      "XT1789-02",
      "XT1789-03",
      "XT1789-04",
      "XT1789-05",
      "XT1789-06",
      "XT1789-07"
    ],
    "androidVersion": 21,
    "release": "2017-07",
    "capabilities": [
      "a_b_slots",
      "adb",
      "battery_calibration",
      "battery_health_read",
      "display_pwm_test",
      "dynamic_partitions",
      "edl",
      "evidence_capture",
      "fastboot",
      "fastbootd",
      "frp_owner_assisted",
      "network_reset",
      "official_rom_flash",
      "ota",
      "recovery",
      "sim_reset",
      "storage_health_read",
      "thermal_read",
      "touch_grid_test",
      "verified_boot"
    ],
    "riskFlags": [
      "edl_requires_signed_programmer",
      "pre_install_required:nash",
      "recovery_flash_target_is:boot"
    ],
    "verificationGates": [
      {
        "id": "power_on",
        "name": "El equipo enciende y no reinicia en 3 min",
        "kind": "hardware",
        "blocking": true
      },
      {
        "id": "charging",
        "name": "Detecta carga y aumenta el porcentaje",
        "kind": "hardware",
        "blocking": true
      },
      {
        "id": "battery_report",
        "name": "Bateria reporta capacidad real > 60% del diseño",
        "kind": "hardware",
        "blocking": false
      },
      {
        "id": "touch_grid",
        "name": "Rejilla de táctil sin zonas muertas",
        "kind": "sensor",
        "blocking": true
      },
      {
        "id": "display_pwm",
        "name": "Pantalla sin parpadeo anormal / lineas",
        "kind": "display",
        "blocking": true
      },
      {
        "id": "audio_path",
        "name": "Altavoz, auricular y microfonos responden",
        "kind": "audio",
        "blocking": true
      },
      {
        "id": "cameras",
        "name": "Todas las camaras abren imagen",
        "kind": "camera",
        "blocking": true
      },
      {
        "id": "sensors",
        "name": "Proximidad, huella y giroscopio responden",
        "kind": "sensor",
        "blocking": false
      },
      {
        "id": "network_register",
        "name": "Registra en la red destino (SIM Telcel/AT&T/Movistar)",
        "kind": "network",
        "blocking": true
      },
      {
        "id": "data_browse",
        "name": "Abre internet y resuelve DNS",
        "kind": "network",
        "blocking": true
      },
      {
        "id": "call_voicemail",
        "kind": "network",
        "blocking": false,
        "name": "Llamada / mensaje saliente"
      },
      {
        "id": "gms",
        "name": "Play Servicios y apps base abren",
        "kind": "software",
        "blocking": false
      },
      {
        "id": "ota",
        "name": "Acepta(actualizar) sin error",
        "kind": "software",
        "blocking": false
      },
      {
        "id": "radio_ident",
        "kind": "radio",
        "blocking": true,
        "name": "IMEI/ESN intactos y sin cambios"
      },
      {
        "id": "slot_health",
        "kind": "bootchain",
        "blocking": false,
        "name": "Ambos slots sanables (A/B activo y no corrupto)"
      },
      {
        "id": "verified_boot_state",
        "kind": "bootchain",
        "blocking": false,
        "name": "Estado de boot verificado sin alteraciones"
      }
    ],
    "sources": [
      "lineageos",
      "seed",
      "play"
    ]
  },
{
    "codename": "fogos",
    "variant": "1",
    "key": "fogos#1",
    "marketingName": "moto g34 5G",
    "vendor": "Motorola",
    "soc": "Qualcomm SM6375 Snapdragon 695",
    "socVendor": "qualcomm",
    "platform": "sm6375",
    "modelNumbers": [
      "XT2363-1",
      "XT2363-2",
      "XT2363-3",
      "XT2363-4",
      "XT2363-5"
    ],
    "androidVersion": 22,
    "release": "2023-12-29",
    "capabilities": [
      "a_b_slots",
      "adb",
      "battery_calibration",
      "battery_health_read",
      "display_pwm_test",
      "dynamic_partitions",
      "edl",
      "evidence_capture",
      "fastboot",
      "fastbootd",
      "frp_owner_assisted",
      "network_reset",
      "official_rom_flash",
      "ota",
      "recovery",
      "sim_reset",
      "storage_health_read",
      "thermal_read",
      "touch_grid_test",
      "verified_boot"
    ],
    "riskFlags": [
      "edl_requires_signed_programmer",
      "pre_install_required:needs_specific_android_fw",
      "recovery_flash_target_is:boot"
    ],
    "verificationGates": [
      {
        "id": "power_on",
        "name": "El equipo enciende y no reinicia en 3 min",
        "kind": "hardware",
        "blocking": true
      },
      {
        "id": "charging",
        "name": "Detecta carga y aumenta el porcentaje",
        "kind": "hardware",
        "blocking": true
      },
      {
        "id": "battery_report",
        "name": "Bateria reporta capacidad real > 60% del diseño",
        "kind": "hardware",
        "blocking": false
      },
      {
        "id": "touch_grid",
        "name": "Rejilla de táctil sin zonas muertas",
        "kind": "sensor",
        "blocking": true
      },
      {
        "id": "display_pwm",
        "name": "Pantalla sin parpadeo anormal / lineas",
        "kind": "display",
        "blocking": true
      },
      {
        "id": "audio_path",
        "name": "Altavoz, auricular y microfonos responden",
        "kind": "audio",
        "blocking": true
      },
      {
        "id": "cameras",
        "name": "Todas las camaras abren imagen",
        "kind": "camera",
        "blocking": true
      },
      {
        "id": "sensors",
        "name": "Proximidad, huella y giroscopio responden",
        "kind": "sensor",
        "blocking": false
      },
      {
        "id": "network_register",
        "name": "Registra en la red destino (SIM Telcel/AT&T/Movistar)",
        "kind": "network",
        "blocking": true
      },
      {
        "id": "data_browse",
        "name": "Abre internet y resuelve DNS",
        "kind": "network",
        "blocking": true
      },
      {
        "id": "call_voicemail",
        "kind": "network",
        "blocking": false,
        "name": "Llamada / mensaje saliente"
      },
      {
        "id": "gms",
        "name": "Play Servicios y apps base abren",
        "kind": "software",
        "blocking": false
      },
      {
        "id": "ota",
        "name": "Acepta(actualizar) sin error",
        "kind": "software",
        "blocking": false
      },
      {
        "id": "radio_ident",
        "kind": "radio",
        "blocking": true,
        "name": "IMEI/ESN intactos y sin cambios"
      },
      {
        "id": "slot_health",
        "kind": "bootchain",
        "blocking": false,
        "name": "Ambos slots sanables (A/B activo y no corrupto)"
      },
      {
        "id": "verified_boot_state",
        "kind": "bootchain",
        "blocking": false,
        "name": "Estado de boot verificado sin alteraciones"
      }
    ],
    "sources": [
      "lineageos",
      "seed"
    ]
  },
{
    "codename": "guamp",
    "variant": "1",
    "key": "guamp#1",
    "marketingName": "moto g9 play",
    "vendor": "Motorola",
    "soc": "Qualcomm SM6115 Snapdragon 662",
    "socVendor": "qualcomm",
    "platform": "sm6225",
    "modelNumbers": [
      "XT2083-1",
      "XT2083-3",
      "XT2083-5",
      "XT2083-6",
      "XT2083-7"
    ],
    "androidVersion": 22,
    "release": "2020-08",
    "capabilities": [
      "a_b_slots",
      "adb",
      "battery_calibration",
      "battery_health_read",
      "display_pwm_test",
      "dynamic_partitions",
      "edl",
      "evidence_capture",
      "fastboot",
      "fastbootd",
      "frp_owner_assisted",
      "network_reset",
      "official_rom_flash",
      "ota",
      "recovery",
      "sim_reset",
      "storage_health_read",
      "thermal_read",
      "touch_grid_test",
      "verified_boot"
    ],
    "riskFlags": [
      "edl_requires_signed_programmer",
      "pre_install_required:needs_specific_android_fw"
    ],
    "verificationGates": [
      {
        "id": "power_on",
        "name": "El equipo enciende y no reinicia en 3 min",
        "kind": "hardware",
        "blocking": true
      },
      {
        "id": "charging",
        "name": "Detecta carga y aumenta el porcentaje",
        "kind": "hardware",
        "blocking": true
      },
      {
        "id": "battery_report",
        "name": "Bateria reporta capacidad real > 60% del diseño",
        "kind": "hardware",
        "blocking": false
      },
      {
        "id": "touch_grid",
        "name": "Rejilla de táctil sin zonas muertas",
        "kind": "sensor",
        "blocking": true
      },
      {
        "id": "display_pwm",
        "name": "Pantalla sin parpadeo anormal / lineas",
        "kind": "display",
        "blocking": true
      },
      {
        "id": "audio_path",
        "name": "Altavoz, auricular y microfonos responden",
        "kind": "audio",
        "blocking": true
      },
      {
        "id": "cameras",
        "name": "Todas las camaras abren imagen",
        "kind": "camera",
        "blocking": true
      },
      {
        "id": "sensors",
        "name": "Proximidad, huella y giroscopio responden",
        "kind": "sensor",
        "blocking": false
      },
      {
        "id": "network_register",
        "name": "Registra en la red destino (SIM Telcel/AT&T/Movistar)",
        "kind": "network",
        "blocking": true
      },
      {
        "id": "data_browse",
        "name": "Abre internet y resuelve DNS",
        "kind": "network",
        "blocking": true
      },
      {
        "id": "call_voicemail",
        "kind": "network",
        "blocking": false,
        "name": "Llamada / mensaje saliente"
      },
      {
        "id": "gms",
        "name": "Play Servicios y apps base abren",
        "kind": "software",
        "blocking": false
      },
      {
        "id": "ota",
        "name": "Acepta(actualizar) sin error",
        "kind": "software",
        "blocking": false
      },
      {
        "id": "radio_ident",
        "kind": "radio",
        "blocking": true,
        "name": "IMEI/ESN intactos y sin cambios"
      },
      {
        "id": "slot_health",
        "kind": "bootchain",
        "blocking": false,
        "name": "Ambos slots sanables (A/B activo y no corrupto)"
      },
      {
        "id": "verified_boot_state",
        "kind": "bootchain",
        "blocking": false,
        "name": "Estado de boot verificado sin alteraciones"
      }
    ],
    "sources": [
      "lineageos",
      "seed"
    ]
  },
{
    "codename": "Mi439",
    "variant": "2",
    "key": "Mi439#2",
    "marketingName": "Redmi 8",
    "vendor": "Xiaomi",
    "soc": "Qualcomm SDM439 Snapdragon 439",
    "socVendor": "qualcomm",
    "platform": "msm8937",
    "modelNumbers": [
      "M1908C3IC",
      "M1908C3IE",
      "M1908C3IG",
      "M1908C3IH",
      "M1908C3II"
    ],
    "androidVersion": 22,
    "release": "2019-10",
    "capabilities": [
      "a_only",
      "adb",
      "battery_calibration",
      "battery_health_read",
      "display_pwm_test",
      "dynamic_partitions",
      "edl",
      "evidence_capture",
      "fastboot",
      "fastbootd",
      "frp_owner_assisted",
      "network_reset",
      "official_rom_flash",
      "ota",
      "recovery",
      "sim_reset",
      "storage_health_read",
      "thermal_read",
      "touch_grid_test",
      "verified_boot"
    ],
    "riskFlags": [
      "edl_requires_signed_programmer",
      "pre_install_required:needs_specific_android_fw"
    ],
    "verificationGates": [
      {
        "id": "power_on",
        "name": "El equipo enciende y no reinicia en 3 min",
        "kind": "hardware",
        "blocking": true
      },
      {
        "id": "charging",
        "name": "Detecta carga y aumenta el porcentaje",
        "kind": "hardware",
        "blocking": true
      },
      {
        "id": "battery_report",
        "name": "Bateria reporta capacidad real > 60% del diseño",
        "kind": "hardware",
        "blocking": false
      },
      {
        "id": "touch_grid",
        "name": "Rejilla de táctil sin zonas muertas",
        "kind": "sensor",
        "blocking": true
      },
      {
        "id": "display_pwm",
        "name": "Pantalla sin parpadeo anormal / lineas",
        "kind": "display",
        "blocking": true
      },
      {
        "id": "audio_path",
        "name": "Altavoz, auricular y microfonos responden",
        "kind": "audio",
        "blocking": true
      },
      {
        "id": "cameras",
        "name": "Todas las camaras abren imagen",
        "kind": "camera",
        "blocking": true
      },
      {
        "id": "sensors",
        "name": "Proximidad, huella y giroscopio responden",
        "kind": "sensor",
        "blocking": false
      },
      {
        "id": "network_register",
        "name": "Registra en la red destino (SIM Telcel/AT&T/Movistar)",
        "kind": "network",
        "blocking": true
      },
      {
        "id": "data_browse",
        "name": "Abre internet y resuelve DNS",
        "kind": "network",
        "blocking": true
      },
      {
        "id": "call_voicemail",
        "kind": "network",
        "blocking": false,
        "name": "Llamada / mensaje saliente"
      },
      {
        "id": "gms",
        "name": "Play Servicios y apps base abren",
        "kind": "software",
        "blocking": false
      },
      {
        "id": "ota",
        "name": "Acepta(actualizar) sin error",
        "kind": "software",
        "blocking": false
      },
      {
        "id": "radio_ident",
        "kind": "radio",
        "blocking": true,
        "name": "IMEI/ESN intactos y sin cambios"
      },
      {
        "id": "verified_boot_state",
        "kind": "bootchain",
        "blocking": false,
        "name": "Estado de boot verificado sin alteraciones"
      }
    ],
    "sources": [
      "lineageos",
      "seed"
    ]
  },
{
    "codename": "diting",
    "variant": "1",
    "key": "diting#1",
    "marketingName": "12T Pro",
    "vendor": "Xiaomi",
    "soc": "Qualcomm SM8475 Snapdragon 8+ Gen1",
    "socVendor": "qualcomm",
    "platform": "sm8450",
    "modelNumbers": [
      "22081212UG",
      "22081212R",
      "22200414R",
      "A201XM"
    ],
    "androidVersion": 22,
    "release": "2022-10-06",
    "capabilities": [
      "a_b_slots",
      "adb",
      "battery_calibration",
      "battery_health_read",
      "display_pwm_test",
      "dynamic_partitions",
      "edl",
      "evidence_capture",
      "fastboot",
      "fastbootd",
      "frp_owner_assisted",
      "network_reset",
      "official_rom_flash",
      "ota",
      "recovery",
      "sim_reset",
      "storage_health_read",
      "thermal_read",
      "touch_grid_test",
      "verified_boot"
    ],
    "riskFlags": [
      "edl_requires_signed_programmer",
      "pre_install_required:needs_specific_android_fw"
    ],
    "verificationGates": [
      {
        "id": "power_on",
        "name": "El equipo enciende y no reinicia en 3 min",
        "kind": "hardware",
        "blocking": true
      },
      {
        "id": "charging",
        "name": "Detecta carga y aumenta el porcentaje",
        "kind": "hardware",
        "blocking": true
      },
      {
        "id": "battery_report",
        "name": "Bateria reporta capacidad real > 60% del diseño",
        "kind": "hardware",
        "blocking": false
      },
      {
        "id": "touch_grid",
        "name": "Rejilla de táctil sin zonas muertas",
        "kind": "sensor",
        "blocking": true
      },
      {
        "id": "display_pwm",
        "name": "Pantalla sin parpadeo anormal / lineas",
        "kind": "display",
        "blocking": true
      },
      {
        "id": "audio_path",
        "name": "Altavoz, auricular y microfonos responden",
        "kind": "audio",
        "blocking": true
      },
      {
        "id": "cameras",
        "name": "Todas las camaras abren imagen",
        "kind": "camera",
        "blocking": true
      },
      {
        "id": "sensors",
        "name": "Proximidad, huella y giroscopio responden",
        "kind": "sensor",
        "blocking": false
      },
      {
        "id": "network_register",
        "name": "Registra en la red destino (SIM Telcel/AT&T/Movistar)",
        "kind": "network",
        "blocking": true
      },
      {
        "id": "data_browse",
        "name": "Abre internet y resuelve DNS",
        "kind": "network",
        "blocking": true
      },
      {
        "id": "call_voicemail",
        "kind": "network",
        "blocking": false,
        "name": "Llamada / mensaje saliente"
      },
      {
        "id": "gms",
        "name": "Play Servicios y apps base abren",
        "kind": "software",
        "blocking": false
      },
      {
        "id": "ota",
        "name": "Acepta(actualizar) sin error",
        "kind": "software",
        "blocking": false
      },
      {
        "id": "radio_ident",
        "kind": "radio",
        "blocking": true,
        "name": "IMEI/ESN intactos y sin cambios"
      },
      {
        "id": "slot_health",
        "kind": "bootchain",
        "blocking": false,
        "name": "Ambos slots sanables (A/B activo y no corrupto)"
      },
      {
        "id": "verified_boot_state",
        "kind": "bootchain",
        "blocking": false,
        "name": "Estado de boot verificado sin alteraciones"
      }
    ],
    "sources": [
      "lineageos",
      "seed"
    ]
  },
{
    "codename": "guacamole",
    "variant": "1",
    "key": "guacamole#1",
    "marketingName": "7 Pro",
    "vendor": "OnePlus",
    "soc": "Qualcomm SM8150 Snapdragon 855",
    "socVendor": "qualcomm",
    "platform": "sm8150",
    "modelNumbers": [
      "GM1910",
      "GM1911",
      "GM1913",
      "GM1917"
    ],
    "androidVersion": 22,
    "release": "2019-05",
    "capabilities": [
      "a_b_slots",
      "adb",
      "battery_calibration",
      "battery_health_read",
      "display_pwm_test",
      "dynamic_partitions",
      "edl",
      "evidence_capture",
      "fastboot",
      "fastbootd",
      "frp_owner_assisted",
      "network_reset",
      "official_rom_flash",
      "ota",
      "recovery",
      "sim_reset",
      "storage_health_read",
      "thermal_read",
      "touch_grid_test",
      "unlock_official",
      "verified_boot"
    ],
    "riskFlags": [
      "edl_requires_signed_programmer",
      "pre_install_required:needs_specific_android_fw",
      "recovery_flash_target_is:boot"
    ],
    "verificationGates": [
      {
        "id": "power_on",
        "name": "El equipo enciende y no reinicia en 3 min",
        "kind": "hardware",
        "blocking": true
      },
      {
        "id": "charging",
        "name": "Detecta carga y aumenta el porcentaje",
        "kind": "hardware",
        "blocking": true
      },
      {
        "id": "battery_report",
        "name": "Bateria reporta capacidad real > 60% del diseño",
        "kind": "hardware",
        "blocking": false
      },
      {
        "id": "touch_grid",
        "name": "Rejilla de táctil sin zonas muertas",
        "kind": "sensor",
        "blocking": true
      },
      {
        "id": "display_pwm",
        "name": "Pantalla sin parpadeo anormal / lineas",
        "kind": "display",
        "blocking": true
      },
      {
        "id": "audio_path",
        "name": "Altavoz, auricular y microfonos responden",
        "kind": "audio",
        "blocking": true
      },
      {
        "id": "cameras",
        "name": "Todas las camaras abren imagen",
        "kind": "camera",
        "blocking": true
      },
      {
        "id": "sensors",
        "name": "Proximidad, huella y giroscopio responden",
        "kind": "sensor",
        "blocking": false
      },
      {
        "id": "network_register",
        "name": "Registra en la red destino (SIM Telcel/AT&T/Movistar)",
        "kind": "network",
        "blocking": true
      },
      {
        "id": "data_browse",
        "name": "Abre internet y resuelve DNS",
        "kind": "network",
        "blocking": true
      },
      {
        "id": "call_voicemail",
        "kind": "network",
        "blocking": false,
        "name": "Llamada / mensaje saliente"
      },
      {
        "id": "gms",
        "name": "Play Servicios y apps base abren",
        "kind": "software",
        "blocking": false
      },
      {
        "id": "ota",
        "name": "Acepta(actualizar) sin error",
        "kind": "software",
        "blocking": false
      },
      {
        "id": "radio_ident",
        "kind": "radio",
        "blocking": true,
        "name": "IMEI/ESN intactos y sin cambios"
      },
      {
        "id": "slot_health",
        "kind": "bootchain",
        "blocking": false,
        "name": "Ambos slots sanables (A/B activo y no corrupto)"
      },
      {
        "id": "verified_boot_state",
        "kind": "bootchain",
        "blocking": false,
        "name": "Estado de boot verificado sin alteraciones"
      }
    ],
    "sources": [
      "lineageos",
      "seed",
      "play"
    ]
  },
{
    "codename": "hotdogb",
    "variant": "1",
    "key": "hotdogb#1",
    "marketingName": "7T",
    "vendor": "OnePlus",
    "soc": "Qualcomm SM8150-AC Snapdragon 855+",
    "socVendor": "qualcomm",
    "platform": "sm8150",
    "modelNumbers": [
      "HD1900",
      "HD1901",
      "HD1903",
      "HD1905"
    ],
    "androidVersion": 22,
    "release": "2019-09",
    "capabilities": [
      "a_b_slots",
      "adb",
      "battery_calibration",
      "battery_health_read",
      "display_pwm_test",
      "dynamic_partitions",
      "edl",
      "evidence_capture",
      "fastboot",
      "fastbootd",
      "frp_owner_assisted",
      "network_reset",
      "official_rom_flash",
      "ota",
      "recovery",
      "sim_reset",
      "storage_health_read",
      "thermal_read",
      "touch_grid_test",
      "unlock_official",
      "verified_boot"
    ],
    "riskFlags": [
      "edl_requires_signed_programmer",
      "pre_install_required:needs_specific_android_fw"
    ],
    "verificationGates": [
      {
        "id": "power_on",
        "name": "El equipo enciende y no reinicia en 3 min",
        "kind": "hardware",
        "blocking": true
      },
      {
        "id": "charging",
        "name": "Detecta carga y aumenta el porcentaje",
        "kind": "hardware",
        "blocking": true
      },
      {
        "id": "battery_report",
        "name": "Bateria reporta capacidad real > 60% del diseño",
        "kind": "hardware",
        "blocking": false
      },
      {
        "id": "touch_grid",
        "name": "Rejilla de táctil sin zonas muertas",
        "kind": "sensor",
        "blocking": true
      },
      {
        "id": "display_pwm",
        "name": "Pantalla sin parpadeo anormal / lineas",
        "kind": "display",
        "blocking": true
      },
      {
        "id": "audio_path",
        "name": "Altavoz, auricular y microfonos responden",
        "kind": "audio",
        "blocking": true
      },
      {
        "id": "cameras",
        "name": "Todas las camaras abren imagen",
        "kind": "camera",
        "blocking": true
      },
      {
        "id": "sensors",
        "name": "Proximidad, huella y giroscopio responden",
        "kind": "sensor",
        "blocking": false
      },
      {
        "id": "network_register",
        "name": "Registra en la red destino (SIM Telcel/AT&T/Movistar)",
        "kind": "network",
        "blocking": true
      },
      {
        "id": "data_browse",
        "name": "Abre internet y resuelve DNS",
        "kind": "network",
        "blocking": true
      },
      {
        "id": "call_voicemail",
        "kind": "network",
        "blocking": false,
        "name": "Llamada / mensaje saliente"
      },
      {
        "id": "gms",
        "name": "Play Servicios y apps base abren",
        "kind": "software",
        "blocking": false
      },
      {
        "id": "ota",
        "name": "Acepta(actualizar) sin error",
        "kind": "software",
        "blocking": false
      },
      {
        "id": "radio_ident",
        "kind": "radio",
        "blocking": true,
        "name": "IMEI/ESN intactos y sin cambios"
      },
      {
        "id": "slot_health",
        "kind": "bootchain",
        "blocking": false,
        "name": "Ambos slots sanables (A/B activo y no corrupto)"
      },
      {
        "id": "verified_boot_state",
        "kind": "bootchain",
        "blocking": false,
        "name": "Estado de boot verificado sin alteraciones"
      }
    ],
    "sources": [
      "lineageos",
      "seed",
      "play"
    ]
  },
{
    "codename": "instantnoodle",
    "variant": "1",
    "key": "instantnoodle#1",
    "marketingName": "8",
    "vendor": "OnePlus",
    "soc": "Qualcomm SM8250 Snapdragon 865",
    "socVendor": "qualcomm",
    "platform": "sm8250",
    "modelNumbers": [
      "IN2010",
      "IN2011",
      "IN2013",
      "IN2015"
    ],
    "androidVersion": 22,
    "release": "2020-04",
    "capabilities": [
      "a_b_slots",
      "adb",
      "battery_calibration",
      "battery_health_read",
      "display_pwm_test",
      "dynamic_partitions",
      "edl",
      "evidence_capture",
      "fastboot",
      "fastbootd",
      "frp_owner_assisted",
      "network_reset",
      "official_rom_flash",
      "ota",
      "recovery",
      "sim_reset",
      "storage_health_read",
      "thermal_read",
      "touch_grid_test",
      "unlock_official",
      "verified_boot"
    ],
    "riskFlags": [
      "edl_requires_signed_programmer",
      "pre_install_required:needs_specific_android_fw"
    ],
    "verificationGates": [
      {
        "id": "power_on",
        "name": "El equipo enciende y no reinicia en 3 min",
        "kind": "hardware",
        "blocking": true
      },
      {
        "id": "charging",
        "name": "Detecta carga y aumenta el porcentaje",
        "kind": "hardware",
        "blocking": true
      },
      {
        "id": "battery_report",
        "name": "Bateria reporta capacidad real > 60% del diseño",
        "kind": "hardware",
        "blocking": false
      },
      {
        "id": "touch_grid",
        "name": "Rejilla de táctil sin zonas muertas",
        "kind": "sensor",
        "blocking": true
      },
      {
        "id": "display_pwm",
        "name": "Pantalla sin parpadeo anormal / lineas",
        "kind": "display",
        "blocking": true
      },
      {
        "id": "audio_path",
        "name": "Altavoz, auricular y microfonos responden",
        "kind": "audio",
        "blocking": true
      },
      {
        "id": "cameras",
        "name": "Todas las camaras abren imagen",
        "kind": "camera",
        "blocking": true
      },
      {
        "id": "sensors",
        "name": "Proximidad, huella y giroscopio responden",
        "kind": "sensor",
        "blocking": false
      },
      {
        "id": "network_register",
        "name": "Registra en la red destino (SIM Telcel/AT&T/Movistar)",
        "kind": "network",
        "blocking": true
      },
      {
        "id": "data_browse",
        "name": "Abre internet y resuelve DNS",
        "kind": "network",
        "blocking": true
      },
      {
        "id": "call_voicemail",
        "kind": "network",
        "blocking": false,
        "name": "Llamada / mensaje saliente"
      },
      {
        "id": "gms",
        "name": "Play Servicios y apps base abren",
        "kind": "software",
        "blocking": false
      },
      {
        "id": "ota",
        "name": "Acepta(actualizar) sin error",
        "kind": "software",
        "blocking": false
      },
      {
        "id": "radio_ident",
        "kind": "radio",
        "blocking": true,
        "name": "IMEI/ESN intactos y sin cambios"
      },
      {
        "id": "slot_health",
        "kind": "bootchain",
        "blocking": false,
        "name": "Ambos slots sanables (A/B activo y no corrupto)"
      },
      {
        "id": "verified_boot_state",
        "kind": "bootchain",
        "blocking": false,
        "name": "Estado de boot verificado sin alteraciones"
      }
    ],
    "sources": [
      "lineageos",
      "seed",
      "play"
    ]
  },
{
    "codename": "evert",
    "variant": null,
    "key": "evert",
    "marketingName": "moto g6 plus",
    "vendor": "Motorola",
    "soc": "Qualcomm SDM630 Snapdragon 630",
    "socVendor": "qualcomm",
    "platform": "msm8998",
    "modelNumbers": [
      "XT1926-2",
      "XT1926-3",
      "XT1926-5",
      "XT1926-6",
      "XT1926-7",
      "XT1926-8",
      "XT1926-9"
    ],
    "androidVersion": 21,
    "release": "2018-05",
    "capabilities": [
      "a_b_slots",
      "adb",
      "battery_calibration",
      "battery_health_read",
      "display_pwm_test",
      "dynamic_partitions",
      "edl",
      "evidence_capture",
      "fastboot",
      "fastbootd",
      "frp_owner_assisted",
      "network_reset",
      "official_rom_flash",
      "ota",
      "recovery",
      "sim_reset",
      "storage_health_read",
      "thermal_read",
      "touch_grid_test",
      "verified_boot"
    ],
    "riskFlags": [
      "edl_requires_signed_programmer",
      "pre_install_required:needs_specific_android_fw",
      "recovery_flash_target_is:boot"
    ],
    "verificationGates": [
      {
        "id": "power_on",
        "name": "El equipo enciende y no reinicia en 3 min",
        "kind": "hardware",
        "blocking": true
      },
      {
        "id": "charging",
        "name": "Detecta carga y aumenta el porcentaje",
        "kind": "hardware",
        "blocking": true
      },
      {
        "id": "battery_report",
        "name": "Bateria reporta capacidad real > 60% del diseño",
        "kind": "hardware",
        "blocking": false
      },
      {
        "id": "touch_grid",
        "name": "Rejilla de táctil sin zonas muertas",
        "kind": "sensor",
        "blocking": true
      },
      {
        "id": "display_pwm",
        "name": "Pantalla sin parpadeo anormal / lineas",
        "kind": "display",
        "blocking": true
      },
      {
        "id": "audio_path",
        "name": "Altavoz, auricular y microfonos responden",
        "kind": "audio",
        "blocking": true
      },
      {
        "id": "cameras",
        "name": "Todas las camaras abren imagen",
        "kind": "camera",
        "blocking": true
      },
      {
        "id": "sensors",
        "name": "Proximidad, huella y giroscopio responden",
        "kind": "sensor",
        "blocking": false
      },
      {
        "id": "network_register",
        "name": "Registra en la red destino (SIM Telcel/AT&T/Movistar)",
        "kind": "network",
        "blocking": true
      },
      {
        "id": "data_browse",
        "name": "Abre internet y resuelve DNS",
        "kind": "network",
        "blocking": true
      },
      {
        "id": "call_voicemail",
        "kind": "network",
        "blocking": false,
        "name": "Llamada / mensaje saliente"
      },
      {
        "id": "gms",
        "name": "Play Servicios y apps base abren",
        "kind": "software",
        "blocking": false
      },
      {
        "id": "ota",
        "name": "Acepta(actualizar) sin error",
        "kind": "software",
        "blocking": false
      },
      {
        "id": "radio_ident",
        "kind": "radio",
        "blocking": true,
        "name": "IMEI/ESN intactos y sin cambios"
      },
      {
        "id": "slot_health",
        "kind": "bootchain",
        "blocking": false,
        "name": "Ambos slots sanables (A/B activo y no corrupto)"
      },
      {
        "id": "verified_boot_state",
        "kind": "bootchain",
        "blocking": false,
        "name": "Estado de boot verificado sin alteraciones"
      }
    ],
    "sources": [
      "lineageos",
      "seed",
      "play"
    ]
  },
{
    "codename": "payton",
    "variant": null,
    "key": "payton",
    "marketingName": "moto x4",
    "vendor": "Motorola",
    "soc": "Qualcomm SDM630 Snapdragon 630",
    "socVendor": "qualcomm",
    "platform": "msm8998",
    "modelNumbers": [
      "XT1900-1",
      "XT1900-2",
      "XT1900-3",
      "XT1900-4",
      "XT1900-5",
      "XT1900-6",
      "XT1900-7"
    ],
    "androidVersion": 21,
    "release": "2017-10",
    "capabilities": [
      "a_b_slots",
      "adb",
      "battery_calibration",
      "battery_health_read",
      "display_pwm_test",
      "dynamic_partitions",
      "edl",
      "evidence_capture",
      "fastboot",
      "fastbootd",
      "frp_owner_assisted",
      "network_reset",
      "official_rom_flash",
      "ota",
      "recovery",
      "sim_reset",
      "storage_health_read",
      "thermal_read",
      "touch_grid_test",
      "verified_boot"
    ],
    "riskFlags": [
      "edl_requires_signed_programmer",
      "pre_install_required:needs_specific_android_fw",
      "recovery_flash_target_is:boot"
    ],
    "verificationGates": [
      {
        "id": "power_on",
        "name": "El equipo enciende y no reinicia en 3 min",
        "kind": "hardware",
        "blocking": true
      },
      {
        "id": "charging",
        "name": "Detecta carga y aumenta el porcentaje",
        "kind": "hardware",
        "blocking": true
      },
      {
        "id": "battery_report",
        "name": "Bateria reporta capacidad real > 60% del diseño",
        "kind": "hardware",
        "blocking": false
      },
      {
        "id": "touch_grid",
        "name": "Rejilla de táctil sin zonas muertas",
        "kind": "sensor",
        "blocking": true
      },
      {
        "id": "display_pwm",
        "name": "Pantalla sin parpadeo anormal / lineas",
        "kind": "display",
        "blocking": true
      },
      {
        "id": "audio_path",
        "name": "Altavoz, auricular y microfonos responden",
        "kind": "audio",
        "blocking": true
      },
      {
        "id": "cameras",
        "name": "Todas las camaras abren imagen",
        "kind": "camera",
        "blocking": true
      },
      {
        "id": "sensors",
        "name": "Proximidad, huella y giroscopio responden",
        "kind": "sensor",
        "blocking": false
      },
      {
        "id": "network_register",
        "name": "Registra en la red destino (SIM Telcel/AT&T/Movistar)",
        "kind": "network",
        "blocking": true
      },
      {
        "id": "data_browse",
        "name": "Abre internet y resuelve DNS",
        "kind": "network",
        "blocking": true
      },
      {
        "id": "call_voicemail",
        "kind": "network",
        "blocking": false,
        "name": "Llamada / mensaje saliente"
      },
      {
        "id": "gms",
        "name": "Play Servicios y apps base abren",
        "kind": "software",
        "blocking": false
      },
      {
        "id": "ota",
        "name": "Acepta(actualizar) sin error",
        "kind": "software",
        "blocking": false
      },
      {
        "id": "radio_ident",
        "kind": "radio",
        "blocking": true,
        "name": "IMEI/ESN intactos y sin cambios"
      },
      {
        "id": "slot_health",
        "kind": "bootchain",
        "blocking": false,
        "name": "Ambos slots sanables (A/B activo y no corrupto)"
      },
      {
        "id": "verified_boot_state",
        "kind": "bootchain",
        "blocking": false,
        "name": "Estado de boot verificado sin alteraciones"
      }
    ],
    "sources": [
      "lineageos",
      "seed",
      "play"
    ]
  },
{
    "codename": "a5y17lte",
    "variant": null,
    "key": "a5y17lte",
    "marketingName": "Galaxy A5 (2017)",
    "vendor": "Samsung",
    "soc": "Samsung Exynos 7880",
    "socVendor": "exynos",
    "platform": "universal7880",
    "modelNumbers": [
      "SM-A520F",
      "SM-A520F/DS",
      "SM-A520K",
      "SM-A520L",
      "SM-A520S",
      "SM-A520W"
    ],
    "androidVersion": 17,
    "release": "2017-01-02",
    "capabilities": [
      "a_only",
      "adb",
      "battery_calibration",
      "battery_health_read",
      "display_pwm_test",
      "dynamic_partitions",
      "evidence_capture",
      "fastboot",
      "fastbootd",
      "frp_owner_assisted",
      "network_reset",
      "odin_download",
      "official_rom_flash",
      "ota",
      "recovery",
      "sim_reset",
      "storage_health_read",
      "thermal_read",
      "touch_grid_test",
      "verified_boot"
    ],
    "riskFlags": [
      "odin_requires_signed_secure_package",
      "pre_install_required:needs_specific_android_fw",
      "samsung_knox_eFuse_risk_on_unlock"
    ],
    "verificationGates": [
      {
        "id": "power_on",
        "name": "El equipo enciende y no reinicia en 3 min",
        "kind": "hardware",
        "blocking": true
      },
      {
        "id": "charging",
        "name": "Detecta carga y aumenta el porcentaje",
        "kind": "hardware",
        "blocking": true
      },
      {
        "id": "battery_report",
        "name": "Bateria reporta capacidad real > 60% del diseño",
        "kind": "hardware",
        "blocking": false
      },
      {
        "id": "touch_grid",
        "name": "Rejilla de táctil sin zonas muertas",
        "kind": "sensor",
        "blocking": true
      },
      {
        "id": "display_pwm",
        "name": "Pantalla sin parpadeo anormal / lineas",
        "kind": "display",
        "blocking": true
      },
      {
        "id": "audio_path",
        "name": "Altavoz, auricular y microfonos responden",
        "kind": "audio",
        "blocking": true
      },
      {
        "id": "cameras",
        "name": "Todas las camaras abren imagen",
        "kind": "camera",
        "blocking": true
      },
      {
        "id": "sensors",
        "name": "Proximidad, huella y giroscopio responden",
        "kind": "sensor",
        "blocking": false
      },
      {
        "id": "network_register",
        "name": "Registra en la red destino (SIM Telcel/AT&T/Movistar)",
        "kind": "network",
        "blocking": true
      },
      {
        "id": "data_browse",
        "name": "Abre internet y resuelve DNS",
        "kind": "network",
        "blocking": true
      },
      {
        "id": "call_voicemail",
        "kind": "network",
        "blocking": false,
        "name": "Llamada / mensaje saliente"
      },
      {
        "id": "gms",
        "name": "Play Servicios y apps base abren",
        "kind": "software",
        "blocking": false
      },
      {
        "id": "ota",
        "name": "Acepta(actualizar) sin error",
        "kind": "software",
        "blocking": false
      },
      {
        "id": "radio_ident",
        "kind": "radio",
        "blocking": true,
        "name": "IMEI/ESN intactos y sin cambios"
      },
      {
        "id": "verified_boot_state",
        "kind": "bootchain",
        "blocking": false,
        "name": "Estado de boot verificado sin alteraciones"
      }
    ],
    "sources": [
      "lineageos",
      "seed",
      "play"
    ]
  },
{
    "codename": "albus",
    "variant": null,
    "key": "albus",
    "marketingName": "moto z2 play",
    "vendor": "Motorola",
    "soc": "Qualcomm MSM8953 Pro Snapdragon 626",
    "socVendor": "qualcomm",
    "platform": "msm8953",
    "modelNumbers": [
      "XT1710-01",
      "XT1710-02",
      "XT1710-07",
      "XT1710-08",
      "XT1710-09",
      "XT1710-10",
      "XT1710-11"
    ],
    "androidVersion": 17,
    "release": "2017-06",
    "capabilities": [
      "a_only",
      "adb",
      "battery_calibration",
      "battery_health_read",
      "display_pwm_test",
      "dynamic_partitions",
      "edl",
      "evidence_capture",
      "fastboot",
      "fastbootd",
      "frp_owner_assisted",
      "network_reset",
      "official_rom_flash",
      "ota",
      "recovery",
      "sim_reset",
      "storage_health_read",
      "thermal_read",
      "touch_grid_test",
      "verified_boot"
    ],
    "riskFlags": [
      "edl_requires_signed_programmer"
    ],
    "verificationGates": [
      {
        "id": "power_on",
        "name": "El equipo enciende y no reinicia en 3 min",
        "kind": "hardware",
        "blocking": true
      },
      {
        "id": "charging",
        "name": "Detecta carga y aumenta el porcentaje",
        "kind": "hardware",
        "blocking": true
      },
      {
        "id": "battery_report",
        "name": "Bateria reporta capacidad real > 60% del diseño",
        "kind": "hardware",
        "blocking": false
      },
      {
        "id": "touch_grid",
        "name": "Rejilla de táctil sin zonas muertas",
        "kind": "sensor",
        "blocking": true
      },
      {
        "id": "display_pwm",
        "name": "Pantalla sin parpadeo anormal / lineas",
        "kind": "display",
        "blocking": true
      },
      {
        "id": "audio_path",
        "name": "Altavoz, auricular y microfonos responden",
        "kind": "audio",
        "blocking": true
      },
      {
        "id": "cameras",
        "name": "Todas las camaras abren imagen",
        "kind": "camera",
        "blocking": true
      },
      {
        "id": "sensors",
        "name": "Proximidad, huella y giroscopio responden",
        "kind": "sensor",
        "blocking": false
      },
      {
        "id": "network_register",
        "name": "Registra en la red destino (SIM Telcel/AT&T/Movistar)",
        "kind": "network",
        "blocking": true
      },
      {
        "id": "data_browse",
        "name": "Abre internet y resuelve DNS",
        "kind": "network",
        "blocking": true
      },
      {
        "id": "call_voicemail",
        "kind": "network",
        "blocking": false,
        "name": "Llamada / mensaje saliente"
      },
      {
        "id": "gms",
        "name": "Play Servicios y apps base abren",
        "kind": "software",
        "blocking": false
      },
      {
        "id": "ota",
        "name": "Acepta(actualizar) sin error",
        "kind": "software",
        "blocking": false
      },
      {
        "id": "radio_ident",
        "kind": "radio",
        "blocking": true,
        "name": "IMEI/ESN intactos y sin cambios"
      },
      {
        "id": "verified_boot_state",
        "kind": "bootchain",
        "blocking": false,
        "name": "Estado de boot verificado sin alteraciones"
      }
    ],
    "sources": [
      "lineageos",
      "seed",
      "play"
    ]
  },
{
    "codename": "cedric",
    "variant": null,
    "key": "cedric",
    "marketingName": "moto g5",
    "vendor": "Motorola",
    "soc": "Qualcomm MSM8937 Snapdragon 430",
    "socVendor": "qualcomm",
    "platform": "msm8953",
    "modelNumbers": [
      "XT1670",
      "XT1671",
      "XT1672",
      "XT1675",
      "XT1676",
      "XT1677"
    ],
    "androidVersion": 17,
    "release": "2017-03",
    "capabilities": [
      "a_only",
      "adb",
      "battery_calibration",
      "battery_health_read",
      "display_pwm_test",
      "dynamic_partitions",
      "edl",
      "evidence_capture",
      "fastboot",
      "fastbootd",
      "frp_owner_assisted",
      "network_reset",
      "official_rom_flash",
      "ota",
      "recovery",
      "sim_reset",
      "storage_health_read",
      "thermal_read",
      "touch_grid_test",
      "verified_boot"
    ],
    "riskFlags": [
      "edl_requires_signed_programmer",
      "pre_install_required:needs_specific_android_fw"
    ],
    "verificationGates": [
      {
        "id": "power_on",
        "name": "El equipo enciende y no reinicia en 3 min",
        "kind": "hardware",
        "blocking": true
      },
      {
        "id": "charging",
        "name": "Detecta carga y aumenta el porcentaje",
        "kind": "hardware",
        "blocking": true
      },
      {
        "id": "battery_report",
        "name": "Bateria reporta capacidad real > 60% del diseño",
        "kind": "hardware",
        "blocking": false
      },
      {
        "id": "touch_grid",
        "name": "Rejilla de táctil sin zonas muertas",
        "kind": "sensor",
        "blocking": true
      },
      {
        "id": "display_pwm",
        "name": "Pantalla sin parpadeo anormal / lineas",
        "kind": "display",
        "blocking": true
      },
      {
        "id": "audio_path",
        "name": "Altavoz, auricular y microfonos responden",
        "kind": "audio",
        "blocking": true
      },
      {
        "id": "cameras",
        "name": "Todas las camaras abren imagen",
        "kind": "camera",
        "blocking": true
      },
      {
        "id": "sensors",
        "name": "Proximidad, huella y giroscopio responden",
        "kind": "sensor",
        "blocking": false
      },
      {
        "id": "network_register",
        "name": "Registra en la red destino (SIM Telcel/AT&T/Movistar)",
        "kind": "network",
        "blocking": true
      },
      {
        "id": "data_browse",
        "name": "Abre internet y resuelve DNS",
        "kind": "network",
        "blocking": true
      },
      {
        "id": "call_voicemail",
        "kind": "network",
        "blocking": false,
        "name": "Llamada / mensaje saliente"
      },
      {
        "id": "gms",
        "name": "Play Servicios y apps base abren",
        "kind": "software",
        "blocking": false
      },
      {
        "id": "ota",
        "name": "Acepta(actualizar) sin error",
        "kind": "software",
        "blocking": false
      },
      {
        "id": "radio_ident",
        "kind": "radio",
        "blocking": true,
        "name": "IMEI/ESN intactos y sin cambios"
      },
      {
        "id": "verified_boot_state",
        "kind": "bootchain",
        "blocking": false,
        "name": "Estado de boot verificado sin alteraciones"
      }
    ],
    "sources": [
      "lineageos",
      "seed",
      "play"
    ]
  },
{
    "codename": "klte",
    "variant": null,
    "key": "klte",
    "marketingName": "Galaxy S5 LTE (G900F/M/R4/R7/T/T3/V/W8)",
    "vendor": "Samsung",
    "soc": "Qualcomm MSM8974AC Snapdragon 801",
    "socVendor": "qualcomm",
    "platform": "msm8974",
    "modelNumbers": [
      "SM-G900F",
      "SM-G900M",
      "SM-G900R4",
      "SM-G900R7",
      "SM-G900T",
      "SM-G900T3",
      "SM-G900V",
      "SM-G900W8"
    ],
    "androidVersion": 17,
    "release": "2014-04-11",
    "capabilities": [
      "a_only",
      "adb",
      "battery_calibration",
      "battery_health_read",
      "display_pwm_test",
      "dynamic_partitions",
      "edl",
      "evidence_capture",
      "fastboot",
      "fastbootd",
      "frp_owner_assisted",
      "network_reset",
      "official_rom_flash",
      "ota",
      "recovery",
      "sim_reset",
      "storage_health_read",
      "thermal_read",
      "touch_grid_test",
      "verified_boot"
    ],
    "riskFlags": [
      "edl_requires_signed_programmer",
      "pre_install_required:needs_specific_android_fw",
      "samsung_knox_eFuse_risk_on_unlock"
    ],
    "verificationGates": [
      {
        "id": "power_on",
        "name": "El equipo enciende y no reinicia en 3 min",
        "kind": "hardware",
        "blocking": true
      },
      {
        "id": "charging",
        "name": "Detecta carga y aumenta el porcentaje",
        "kind": "hardware",
        "blocking": true
      },
      {
        "id": "battery_report",
        "name": "Bateria reporta capacidad real > 60% del diseño",
        "kind": "hardware",
        "blocking": false
      },
      {
        "id": "touch_grid",
        "name": "Rejilla de táctil sin zonas muertas",
        "kind": "sensor",
        "blocking": true
      },
      {
        "id": "display_pwm",
        "name": "Pantalla sin parpadeo anormal / lineas",
        "kind": "display",
        "blocking": true
      },
      {
        "id": "audio_path",
        "name": "Altavoz, auricular y microfonos responden",
        "kind": "audio",
        "blocking": true
      },
      {
        "id": "cameras",
        "name": "Todas las camaras abren imagen",
        "kind": "camera",
        "blocking": true
      },
      {
        "id": "sensors",
        "name": "Proximidad, huella y giroscopio responden",
        "kind": "sensor",
        "blocking": false
      },
      {
        "id": "network_register",
        "name": "Registra en la red destino (SIM Telcel/AT&T/Movistar)",
        "kind": "network",
        "blocking": true
      },
      {
        "id": "data_browse",
        "name": "Abre internet y resuelve DNS",
        "kind": "network",
        "blocking": true
      },
      {
        "id": "call_voicemail",
        "kind": "network",
        "blocking": false,
        "name": "Llamada / mensaje saliente"
      },
      {
        "id": "gms",
        "name": "Play Servicios y apps base abren",
        "kind": "software",
        "blocking": false
      },
      {
        "id": "ota",
        "name": "Acepta(actualizar) sin error",
        "kind": "software",
        "blocking": false
      },
      {
        "id": "radio_ident",
        "kind": "radio",
        "blocking": true,
        "name": "IMEI/ESN intactos y sin cambios"
      },
      {
        "id": "verified_boot_state",
        "kind": "bootchain",
        "blocking": false,
        "name": "Estado de boot verificado sin alteraciones"
      }
    ],
    "sources": [
      "lineageos",
      "seed",
      "play"
    ]
  },
{
    "codename": "montana",
    "variant": null,
    "key": "montana",
    "marketingName": "moto g5s",
    "vendor": "Motorola",
    "soc": "Qualcomm MSM8937 Snapdragon 430",
    "socVendor": "qualcomm",
    "platform": "msm8953",
    "modelNumbers": [
      "XT1790",
      "XT1791",
      "XT1792",
      "XT1793",
      "XT1794",
      "XT1795",
      "XT1797",
      "XT1799-2"
    ],
    "androidVersion": 17,
    "release": "2017-08",
    "capabilities": [
      "a_only",
      "adb",
      "battery_calibration",
      "battery_health_read",
      "display_pwm_test",
      "dynamic_partitions",
      "edl",
      "evidence_capture",
      "fastboot",
      "fastbootd",
      "frp_owner_assisted",
      "network_reset",
      "official_rom_flash",
      "ota",
      "recovery",
      "sim_reset",
      "storage_health_read",
      "thermal_read",
      "touch_grid_test",
      "verified_boot"
    ],
    "riskFlags": [
      "edl_requires_signed_programmer",
      "pre_install_required:needs_specific_android_fw"
    ],
    "verificationGates": [
      {
        "id": "power_on",
        "name": "El equipo enciende y no reinicia en 3 min",
        "kind": "hardware",
        "blocking": true
      },
      {
        "id": "charging",
        "name": "Detecta carga y aumenta el porcentaje",
        "kind": "hardware",
        "blocking": true
      },
      {
        "id": "battery_report",
        "name": "Bateria reporta capacidad real > 60% del diseño",
        "kind": "hardware",
        "blocking": false
      },
      {
        "id": "touch_grid",
        "name": "Rejilla de táctil sin zonas muertas",
        "kind": "sensor",
        "blocking": true
      },
      {
        "id": "display_pwm",
        "name": "Pantalla sin parpadeo anormal / lineas",
        "kind": "display",
        "blocking": true
      },
      {
        "id": "audio_path",
        "name": "Altavoz, auricular y microfonos responden",
        "kind": "audio",
        "blocking": true
      },
      {
        "id": "cameras",
        "name": "Todas las camaras abren imagen",
        "kind": "camera",
        "blocking": true
      },
      {
        "id": "sensors",
        "name": "Proximidad, huella y giroscopio responden",
        "kind": "sensor",
        "blocking": false
      },
      {
        "id": "network_register",
        "name": "Registra en la red destino (SIM Telcel/AT&T/Movistar)",
        "kind": "network",
        "blocking": true
      },
      {
        "id": "data_browse",
        "name": "Abre internet y resuelve DNS",
        "kind": "network",
        "blocking": true
      },
      {
        "id": "call_voicemail",
        "kind": "network",
        "blocking": false,
        "name": "Llamada / mensaje saliente"
      },
      {
        "id": "gms",
        "name": "Play Servicios y apps base abren",
        "kind": "software",
        "blocking": false
      },
      {
        "id": "ota",
        "name": "Acepta(actualizar) sin error",
        "kind": "software",
        "blocking": false
      },
      {
        "id": "radio_ident",
        "kind": "radio",
        "blocking": true,
        "name": "IMEI/ESN intactos y sin cambios"
      },
      {
        "id": "verified_boot_state",
        "kind": "bootchain",
        "blocking": false,
        "name": "Estado de boot verificado sin alteraciones"
      }
    ],
    "sources": [
      "lineageos",
      "seed",
      "play"
    ]
  },
{
    "codename": "victara",
    "variant": null,
    "key": "victara",
    "marketingName": "moto x (2014)",
    "vendor": "Motorola",
    "soc": "Qualcomm MSM8974AC Snapdragon 801",
    "socVendor": "qualcomm",
    "platform": "msm8974",
    "modelNumbers": [
      "XT1092",
      "XT1093",
      "XT1094",
      "XT1095",
      "XT1096",
      "XT1097",
      "XT1098"
    ],
    "androidVersion": 17,
    "release": "2014-09-26",
    "capabilities": [
      "a_only",
      "adb",
      "battery_calibration",
      "battery_health_read",
      "display_pwm_test",
      "dynamic_partitions",
      "edl",
      "evidence_capture",
      "fastboot",
      "fastbootd",
      "frp_owner_assisted",
      "network_reset",
      "official_rom_flash",
      "ota",
      "recovery",
      "sim_reset",
      "storage_health_read",
      "thermal_read",
      "touch_grid_test",
      "verified_boot"
    ],
    "riskFlags": [
      "edl_requires_signed_programmer"
    ],
    "verificationGates": [
      {
        "id": "power_on",
        "name": "El equipo enciende y no reinicia en 3 min",
        "kind": "hardware",
        "blocking": true
      },
      {
        "id": "charging",
        "name": "Detecta carga y aumenta el porcentaje",
        "kind": "hardware",
        "blocking": true
      },
      {
        "id": "battery_report",
        "name": "Bateria reporta capacidad real > 60% del diseño",
        "kind": "hardware",
        "blocking": false
      },
      {
        "id": "touch_grid",
        "name": "Rejilla de táctil sin zonas muertas",
        "kind": "sensor",
        "blocking": true
      },
      {
        "id": "display_pwm",
        "name": "Pantalla sin parpadeo anormal / lineas",
        "kind": "display",
        "blocking": true
      },
      {
        "id": "audio_path",
        "name": "Altavoz, auricular y microfonos responden",
        "kind": "audio",
        "blocking": true
      },
      {
        "id": "cameras",
        "name": "Todas las camaras abren imagen",
        "kind": "camera",
        "blocking": true
      },
      {
        "id": "sensors",
        "name": "Proximidad, huella y giroscopio responden",
        "kind": "sensor",
        "blocking": false
      },
      {
        "id": "network_register",
        "name": "Registra en la red destino (SIM Telcel/AT&T/Movistar)",
        "kind": "network",
        "blocking": true
      },
      {
        "id": "data_browse",
        "name": "Abre internet y resuelve DNS",
        "kind": "network",
        "blocking": true
      },
      {
        "id": "call_voicemail",
        "kind": "network",
        "blocking": false,
        "name": "Llamada / mensaje saliente"
      },
      {
        "id": "gms",
        "name": "Play Servicios y apps base abren",
        "kind": "software",
        "blocking": false
      },
      {
        "id": "ota",
        "name": "Acepta(actualizar) sin error",
        "kind": "software",
        "blocking": false
      },
      {
        "id": "radio_ident",
        "kind": "radio",
        "blocking": true,
        "name": "IMEI/ESN intactos y sin cambios"
      },
      {
        "id": "verified_boot_state",
        "kind": "bootchain",
        "blocking": false,
        "name": "Estado de boot verificado sin alteraciones"
      }
    ],
    "sources": [
      "lineageos",
      "seed",
      "play"
    ]
  },
{
    "codename": "a5xelte",
    "variant": null,
    "key": "a5xelte",
    "marketingName": "Galaxy A5 (2016)",
    "vendor": "Samsung",
    "soc": "Samsung Exynos 7580",
    "socVendor": "exynos",
    "platform": "universal7580",
    "modelNumbers": [
      "SM-A510F",
      "SM-A510F/DS",
      "SM-A510M",
      "SM-A510Y",
      "SM-A510K",
      "SM-A510L",
      "SM-A510S",
      "SM-A5108"
    ],
    "androidVersion": 16,
    "release": "2015-12",
    "capabilities": [
      "a_only",
      "adb",
      "battery_calibration",
      "battery_health_read",
      "display_pwm_test",
      "dynamic_partitions",
      "evidence_capture",
      "fastboot",
      "fastbootd",
      "frp_owner_assisted",
      "network_reset",
      "odin_download",
      "official_rom_flash",
      "ota",
      "recovery",
      "sim_reset",
      "storage_health_read",
      "thermal_read",
      "touch_grid_test",
      "verified_boot"
    ],
    "riskFlags": [
      "odin_requires_signed_secure_package",
      "samsung_knox_eFuse_risk_on_unlock"
    ],
    "verificationGates": [
      {
        "id": "power_on",
        "name": "El equipo enciende y no reinicia en 3 min",
        "kind": "hardware",
        "blocking": true
      },
      {
        "id": "charging",
        "name": "Detecta carga y aumenta el porcentaje",
        "kind": "hardware",
        "blocking": true
      },
      {
        "id": "battery_report",
        "name": "Bateria reporta capacidad real > 60% del diseño",
        "kind": "hardware",
        "blocking": false
      },
      {
        "id": "touch_grid",
        "name": "Rejilla de táctil sin zonas muertas",
        "kind": "sensor",
        "blocking": true
      },
      {
        "id": "display_pwm",
        "name": "Pantalla sin parpadeo anormal / lineas",
        "kind": "display",
        "blocking": true
      },
      {
        "id": "audio_path",
        "name": "Altavoz, auricular y microfonos responden",
        "kind": "audio",
        "blocking": true
      },
      {
        "id": "cameras",
        "name": "Todas las camaras abren imagen",
        "kind": "camera",
        "blocking": true
      },
      {
        "id": "sensors",
        "name": "Proximidad, huella y giroscopio responden",
        "kind": "sensor",
        "blocking": false
      },
      {
        "id": "network_register",
        "name": "Registra en la red destino (SIM Telcel/AT&T/Movistar)",
        "kind": "network",
        "blocking": true
      },
      {
        "id": "data_browse",
        "name": "Abre internet y resuelve DNS",
        "kind": "network",
        "blocking": true
      },
      {
        "id": "call_voicemail",
        "kind": "network",
        "blocking": false,
        "name": "Llamada / mensaje saliente"
      },
      {
        "id": "gms",
        "name": "Play Servicios y apps base abren",
        "kind": "software",
        "blocking": false
      },
      {
        "id": "ota",
        "name": "Acepta(actualizar) sin error",
        "kind": "software",
        "blocking": false
      },
      {
        "id": "radio_ident",
        "kind": "radio",
        "blocking": true,
        "name": "IMEI/ESN intactos y sin cambios"
      },
      {
        "id": "verified_boot_state",
        "kind": "bootchain",
        "blocking": false,
        "name": "Estado de boot verificado sin alteraciones"
      }
    ],
    "sources": [
      "lineageos",
      "seed",
      "play"
    ]
  },
{
    "codename": "a7xelte",
    "variant": null,
    "key": "a7xelte",
    "marketingName": "Galaxy A7 (2016)",
    "vendor": "Samsung",
    "soc": "Samsung Exynos 7580",
    "socVendor": "exynos",
    "platform": "universal7580",
    "modelNumbers": [
      "SM-A710F",
      "SM-A710F/DS",
      "SM-A710M",
      "SM-A710Y",
      "SM-A710K",
      "SM-A710L",
      "SM-A710S"
    ],
    "androidVersion": 16,
    "release": "2015-12",
    "capabilities": [
      "a_only",
      "adb",
      "battery_calibration",
      "battery_health_read",
      "display_pwm_test",
      "dynamic_partitions",
      "evidence_capture",
      "fastboot",
      "fastbootd",
      "frp_owner_assisted",
      "network_reset",
      "odin_download",
      "official_rom_flash",
      "ota",
      "recovery",
      "sim_reset",
      "storage_health_read",
      "thermal_read",
      "touch_grid_test",
      "verified_boot"
    ],
    "riskFlags": [
      "odin_requires_signed_secure_package",
      "samsung_knox_eFuse_risk_on_unlock"
    ],
    "verificationGates": [
      {
        "id": "power_on",
        "name": "El equipo enciende y no reinicia en 3 min",
        "kind": "hardware",
        "blocking": true
      },
      {
        "id": "charging",
        "name": "Detecta carga y aumenta el porcentaje",
        "kind": "hardware",
        "blocking": true
      },
      {
        "id": "battery_report",
        "name": "Bateria reporta capacidad real > 60% del diseño",
        "kind": "hardware",
        "blocking": false
      },
      {
        "id": "touch_grid",
        "name": "Rejilla de táctil sin zonas muertas",
        "kind": "sensor",
        "blocking": true
      },
      {
        "id": "display_pwm",
        "name": "Pantalla sin parpadeo anormal / lineas",
        "kind": "display",
        "blocking": true
      },
      {
        "id": "audio_path",
        "name": "Altavoz, auricular y microfonos responden",
        "kind": "audio",
        "blocking": true
      },
      {
        "id": "cameras",
        "name": "Todas las camaras abren imagen",
        "kind": "camera",
        "blocking": true
      },
      {
        "id": "sensors",
        "name": "Proximidad, huella y giroscopio responden",
        "kind": "sensor",
        "blocking": false
      },
      {
        "id": "network_register",
        "name": "Registra en la red destino (SIM Telcel/AT&T/Movistar)",
        "kind": "network",
        "blocking": true
      },
      {
        "id": "data_browse",
        "name": "Abre internet y resuelve DNS",
        "kind": "network",
        "blocking": true
      },
      {
        "id": "call_voicemail",
        "kind": "network",
        "blocking": false,
        "name": "Llamada / mensaje saliente"
      },
      {
        "id": "gms",
        "name": "Play Servicios y apps base abren",
        "kind": "software",
        "blocking": false
      },
      {
        "id": "ota",
        "name": "Acepta(actualizar) sin error",
        "kind": "software",
        "blocking": false
      },
      {
        "id": "radio_ident",
        "kind": "radio",
        "blocking": true,
        "name": "IMEI/ESN intactos y sin cambios"
      },
      {
        "id": "verified_boot_state",
        "kind": "bootchain",
        "blocking": false,
        "name": "Estado de boot verificado sin alteraciones"
      }
    ],
    "sources": [
      "lineageos",
      "seed",
      "play"
    ]
  },
{
    "codename": "harpia",
    "variant": null,
    "key": "harpia",
    "marketingName": "moto g4 play",
    "vendor": "Motorola",
    "soc": "Qualcomm MSM8916 Snapdragon 410",
    "socVendor": "qualcomm",
    "platform": "msm8916",
    "modelNumbers": [
      "XT1600",
      "XT1601",
      "XT1602",
      "XT1603",
      "XT1604",
      "XT1607"
    ],
    "androidVersion": 16,
    "release": "2016-05",
    "capabilities": [
      "a_only",
      "adb",
      "battery_calibration",
      "battery_health_read",
      "display_pwm_test",
      "dynamic_partitions",
      "edl",
      "evidence_capture",
      "fastboot",
      "fastbootd",
      "frp_owner_assisted",
      "network_reset",
      "official_rom_flash",
      "ota",
      "recovery",
      "sim_reset",
      "storage_health_read",
      "thermal_read",
      "touch_grid_test",
      "verified_boot"
    ],
    "riskFlags": [
      "edl_requires_signed_programmer",
      "pre_install_required:needs_specific_android_fw"
    ],
    "verificationGates": [
      {
        "id": "power_on",
        "name": "El equipo enciende y no reinicia en 3 min",
        "kind": "hardware",
        "blocking": true
      },
      {
        "id": "charging",
        "name": "Detecta carga y aumenta el porcentaje",
        "kind": "hardware",
        "blocking": true
      },
      {
        "id": "battery_report",
        "name": "Bateria reporta capacidad real > 60% del diseño",
        "kind": "hardware",
        "blocking": false
      },
      {
        "id": "touch_grid",
        "name": "Rejilla de táctil sin zonas muertas",
        "kind": "sensor",
        "blocking": true
      },
      {
        "id": "display_pwm",
        "name": "Pantalla sin parpadeo anormal / lineas",
        "kind": "display",
        "blocking": true
      },
      {
        "id": "audio_path",
        "name": "Altavoz, auricular y microfonos responden",
        "kind": "audio",
        "blocking": true
      },
      {
        "id": "cameras",
        "name": "Todas las camaras abren imagen",
        "kind": "camera",
        "blocking": true
      },
      {
        "id": "sensors",
        "name": "Proximidad, huella y giroscopio responden",
        "kind": "sensor",
        "blocking": false
      },
      {
        "id": "network_register",
        "name": "Registra en la red destino (SIM Telcel/AT&T/Movistar)",
        "kind": "network",
        "blocking": true
      },
      {
        "id": "data_browse",
        "name": "Abre internet y resuelve DNS",
        "kind": "network",
        "blocking": true
      },
      {
        "id": "call_voicemail",
        "kind": "network",
        "blocking": false,
        "name": "Llamada / mensaje saliente"
      },
      {
        "id": "gms",
        "name": "Play Servicios y apps base abren",
        "kind": "software",
        "blocking": false
      },
      {
        "id": "ota",
        "name": "Acepta(actualizar) sin error",
        "kind": "software",
        "blocking": false
      },
      {
        "id": "radio_ident",
        "kind": "radio",
        "blocking": true,
        "name": "IMEI/ESN intactos y sin cambios"
      },
      {
        "id": "verified_boot_state",
        "kind": "bootchain",
        "blocking": false,
        "name": "Estado de boot verificado sin alteraciones"
      }
    ],
    "sources": [
      "lineageos",
      "seed",
      "play"
    ]
  },
{
    "codename": "osprey",
    "variant": null,
    "key": "osprey",
    "marketingName": "moto g (2015)",
    "vendor": "Motorola",
    "soc": "Qualcomm MSM8916 Snapdragon 410",
    "socVendor": "qualcomm",
    "platform": "msm8916",
    "modelNumbers": [
      "XT1540",
      "XT1541",
      "XT1542",
      "XT1543",
      "XT1544",
      "XT1548",
      "XT1550"
    ],
    "androidVersion": 16,
    "release": "2015-07",
    "capabilities": [
      "a_only",
      "adb",
      "battery_calibration",
      "battery_health_read",
      "display_pwm_test",
      "dynamic_partitions",
      "edl",
      "evidence_capture",
      "fastboot",
      "fastbootd",
      "frp_owner_assisted",
      "network_reset",
      "official_rom_flash",
      "ota",
      "recovery",
      "sim_reset",
      "storage_health_read",
      "thermal_read",
      "touch_grid_test",
      "verified_boot"
    ],
    "riskFlags": [
      "edl_requires_signed_programmer",
      "pre_install_required:needs_specific_android_fw"
    ],
    "verificationGates": [
      {
        "id": "power_on",
        "name": "El equipo enciende y no reinicia en 3 min",
        "kind": "hardware",
        "blocking": true
      },
      {
        "id": "charging",
        "name": "Detecta carga y aumenta el porcentaje",
        "kind": "hardware",
        "blocking": true
      },
      {
        "id": "battery_report",
        "name": "Bateria reporta capacidad real > 60% del diseño",
        "kind": "hardware",
        "blocking": false
      },
      {
        "id": "touch_grid",
        "name": "Rejilla de táctil sin zonas muertas",
        "kind": "sensor",
        "blocking": true
      },
      {
        "id": "display_pwm",
        "name": "Pantalla sin parpadeo anormal / lineas",
        "kind": "display",
        "blocking": true
      },
      {
        "id": "audio_path",
        "name": "Altavoz, auricular y microfonos responden",
        "kind": "audio",
        "blocking": true
      },
      {
        "id": "cameras",
        "name": "Todas las camaras abren imagen",
        "kind": "camera",
        "blocking": true
      },
      {
        "id": "sensors",
        "name": "Proximidad, huella y giroscopio responden",
        "kind": "sensor",
        "blocking": false
      },
      {
        "id": "network_register",
        "name": "Registra en la red destino (SIM Telcel/AT&T/Movistar)",
        "kind": "network",
        "blocking": true
      },
      {
        "id": "data_browse",
        "name": "Abre internet y resuelve DNS",
        "kind": "network",
        "blocking": true
      },
      {
        "id": "call_voicemail",
        "kind": "network",
        "blocking": false,
        "name": "Llamada / mensaje saliente"
      },
      {
        "id": "gms",
        "name": "Play Servicios y apps base abren",
        "kind": "software",
        "blocking": false
      },
      {
        "id": "ota",
        "name": "Acepta(actualizar) sin error",
        "kind": "software",
        "blocking": false
      },
      {
        "id": "radio_ident",
        "kind": "radio",
        "blocking": true,
        "name": "IMEI/ESN intactos y sin cambios"
      },
      {
        "id": "verified_boot_state",
        "kind": "bootchain",
        "blocking": false,
        "name": "Estado de boot verificado sin alteraciones"
      }
    ],
    "sources": [
      "lineageos",
      "seed"
    ]
  },
{
    "codename": "surnia",
    "variant": null,
    "key": "surnia",
    "marketingName": "moto e LTE (2015)",
    "vendor": "Motorola",
    "soc": "Qualcomm MSM8916 Snapdragon 410",
    "socVendor": "qualcomm",
    "platform": "msm8916",
    "modelNumbers": [
      "XT1514",
      "XT1521",
      "XT1523",
      "XT1524",
      "XT1526",
      "XT1527"
    ],
    "androidVersion": 16,
    "release": "2015-02",
    "capabilities": [
      "a_only",
      "adb",
      "battery_calibration",
      "battery_health_read",
      "display_pwm_test",
      "dynamic_partitions",
      "edl",
      "evidence_capture",
      "fastboot",
      "fastbootd",
      "frp_owner_assisted",
      "network_reset",
      "official_rom_flash",
      "ota",
      "recovery",
      "sim_reset",
      "storage_health_read",
      "thermal_read",
      "touch_grid_test",
      "verified_boot"
    ],
    "riskFlags": [
      "edl_requires_signed_programmer",
      "pre_install_required:needs_specific_android_fw"
    ],
    "verificationGates": [
      {
        "id": "power_on",
        "name": "El equipo enciende y no reinicia en 3 min",
        "kind": "hardware",
        "blocking": true
      },
      {
        "id": "charging",
        "name": "Detecta carga y aumenta el porcentaje",
        "kind": "hardware",
        "blocking": true
      },
      {
        "id": "battery_report",
        "name": "Bateria reporta capacidad real > 60% del diseño",
        "kind": "hardware",
        "blocking": false
      },
      {
        "id": "touch_grid",
        "name": "Rejilla de táctil sin zonas muertas",
        "kind": "sensor",
        "blocking": true
      },
      {
        "id": "display_pwm",
        "name": "Pantalla sin parpadeo anormal / lineas",
        "kind": "display",
        "blocking": true
      },
      {
        "id": "audio_path",
        "name": "Altavoz, auricular y microfonos responden",
        "kind": "audio",
        "blocking": true
      },
      {
        "id": "cameras",
        "name": "Todas las camaras abren imagen",
        "kind": "camera",
        "blocking": true
      },
      {
        "id": "sensors",
        "name": "Proximidad, huella y giroscopio responden",
        "kind": "sensor",
        "blocking": false
      },
      {
        "id": "network_register",
        "name": "Registra en la red destino (SIM Telcel/AT&T/Movistar)",
        "kind": "network",
        "blocking": true
      },
      {
        "id": "data_browse",
        "name": "Abre internet y resuelve DNS",
        "kind": "network",
        "blocking": true
      },
      {
        "id": "call_voicemail",
        "kind": "network",
        "blocking": false,
        "name": "Llamada / mensaje saliente"
      },
      {
        "id": "gms",
        "name": "Play Servicios y apps base abren",
        "kind": "software",
        "blocking": false
      },
      {
        "id": "ota",
        "name": "Acepta(actualizar) sin error",
        "kind": "software",
        "blocking": false
      },
      {
        "id": "radio_ident",
        "kind": "radio",
        "blocking": true,
        "name": "IMEI/ESN intactos y sin cambios"
      },
      {
        "id": "verified_boot_state",
        "kind": "bootchain",
        "blocking": false,
        "name": "Estado de boot verificado sin alteraciones"
      }
    ],
    "sources": [
      "lineageos",
      "seed",
      "play"
    ]
  },
{
    "codename": "a21s",
    "variant": null,
    "key": "a21s",
    "marketingName": "Galaxy A21s",
    "vendor": "Samsung",
    "soc": "Samsung Exynos 850",
    "socVendor": "exynos",
    "platform": "exynos850",
    "modelNumbers": [
      "SM-A217F",
      "SM-A217M",
      "SM-A217F/DS",
      "SM-A217F/DSN",
      "SM-A217M/DS"
    ],
    "androidVersion": 22,
    "release": null,
    "capabilities": [
      "a_only",
      "adb",
      "battery_calibration",
      "battery_health_read",
      "display_pwm_test",
      "dynamic_partitions",
      "evidence_capture",
      "fastboot",
      "fastbootd",
      "frp_owner_assisted",
      "network_reset",
      "odin_download",
      "official_rom_flash",
      "ota",
      "recovery",
      "sim_reset",
      "storage_health_read",
      "thermal_read",
      "touch_grid_test",
      "verified_boot"
    ],
    "riskFlags": [
      "odin_requires_signed_secure_package",
      "pre_install_required:needs_specific_android_fw",
      "samsung_knox_eFuse_risk_on_unlock"
    ],
    "verificationGates": [
      {
        "id": "power_on",
        "name": "El equipo enciende y no reinicia en 3 min",
        "kind": "hardware",
        "blocking": true
      },
      {
        "id": "charging",
        "name": "Detecta carga y aumenta el porcentaje",
        "kind": "hardware",
        "blocking": true
      },
      {
        "id": "battery_report",
        "name": "Bateria reporta capacidad real > 60% del diseño",
        "kind": "hardware",
        "blocking": false
      },
      {
        "id": "touch_grid",
        "name": "Rejilla de táctil sin zonas muertas",
        "kind": "sensor",
        "blocking": true
      },
      {
        "id": "display_pwm",
        "name": "Pantalla sin parpadeo anormal / lineas",
        "kind": "display",
        "blocking": true
      },
      {
        "id": "audio_path",
        "name": "Altavoz, auricular y microfonos responden",
        "kind": "audio",
        "blocking": true
      },
      {
        "id": "cameras",
        "name": "Todas las camaras abren imagen",
        "kind": "camera",
        "blocking": true
      },
      {
        "id": "sensors",
        "name": "Proximidad, huella y giroscopio responden",
        "kind": "sensor",
        "blocking": false
      },
      {
        "id": "network_register",
        "name": "Registra en la red destino (SIM Telcel/AT&T/Movistar)",
        "kind": "network",
        "blocking": true
      },
      {
        "id": "data_browse",
        "name": "Abre internet y resuelve DNS",
        "kind": "network",
        "blocking": true
      },
      {
        "id": "call_voicemail",
        "kind": "network",
        "blocking": false,
        "name": "Llamada / mensaje saliente"
      },
      {
        "id": "gms",
        "name": "Play Servicios y apps base abren",
        "kind": "software",
        "blocking": false
      },
      {
        "id": "ota",
        "name": "Acepta(actualizar) sin error",
        "kind": "software",
        "blocking": false
      },
      {
        "id": "radio_ident",
        "kind": "radio",
        "blocking": true,
        "name": "IMEI/ESN intactos y sin cambios"
      },
      {
        "id": "verified_boot_state",
        "kind": "bootchain",
        "blocking": false,
        "name": "Estado de boot verificado sin alteraciones"
      }
    ],
    "sources": [
      "lineageos",
      "seed",
      "play"
    ]
  },
{
    "codename": "beckham",
    "variant": null,
    "key": "beckham",
    "marketingName": "moto z3 play",
    "vendor": "Motorola",
    "soc": "Qualcomm SDM636 Snapdragon 636",
    "socVendor": "qualcomm",
    "platform": "msm8998",
    "modelNumbers": [
      "XT1929-2",
      "XT1929-3",
      "XT1929-4",
      "XT1929-5",
      "XT1929-6"
    ],
    "androidVersion": 21,
    "release": "2018-06",
    "capabilities": [
      "a_b_slots",
      "adb",
      "battery_calibration",
      "battery_health_read",
      "display_pwm_test",
      "dynamic_partitions",
      "edl",
      "evidence_capture",
      "fastboot",
      "fastbootd",
      "frp_owner_assisted",
      "network_reset",
      "official_rom_flash",
      "ota",
      "recovery",
      "sim_reset",
      "storage_health_read",
      "thermal_read",
      "touch_grid_test",
      "verified_boot"
    ],
    "riskFlags": [
      "edl_requires_signed_programmer",
      "pre_install_required:needs_specific_android_fw",
      "recovery_flash_target_is:boot"
    ],
    "verificationGates": [
      {
        "id": "power_on",
        "name": "El equipo enciende y no reinicia en 3 min",
        "kind": "hardware",
        "blocking": true
      },
      {
        "id": "charging",
        "name": "Detecta carga y aumenta el porcentaje",
        "kind": "hardware",
        "blocking": true
      },
      {
        "id": "battery_report",
        "name": "Bateria reporta capacidad real > 60% del diseño",
        "kind": "hardware",
        "blocking": false
      },
      {
        "id": "touch_grid",
        "name": "Rejilla de táctil sin zonas muertas",
        "kind": "sensor",
        "blocking": true
      },
      {
        "id": "display_pwm",
        "name": "Pantalla sin parpadeo anormal / lineas",
        "kind": "display",
        "blocking": true
      },
      {
        "id": "audio_path",
        "name": "Altavoz, auricular y microfonos responden",
        "kind": "audio",
        "blocking": true
      },
      {
        "id": "cameras",
        "name": "Todas las camaras abren imagen",
        "kind": "camera",
        "blocking": true
      },
      {
        "id": "sensors",
        "name": "Proximidad, huella y giroscopio responden",
        "kind": "sensor",
        "blocking": false
      },
      {
        "id": "network_register",
        "name": "Registra en la red destino (SIM Telcel/AT&T/Movistar)",
        "kind": "network",
        "blocking": true
      },
      {
        "id": "data_browse",
        "name": "Abre internet y resuelve DNS",
        "kind": "network",
        "blocking": true
      },
      {
        "id": "call_voicemail",
        "kind": "network",
        "blocking": false,
        "name": "Llamada / mensaje saliente"
      },
      {
        "id": "gms",
        "name": "Play Servicios y apps base abren",
        "kind": "software",
        "blocking": false
      },
      {
        "id": "ota",
        "name": "Acepta(actualizar) sin error",
        "kind": "software",
        "blocking": false
      },
      {
        "id": "radio_ident",
        "kind": "radio",
        "blocking": true,
        "name": "IMEI/ESN intactos y sin cambios"
      },
      {
        "id": "slot_health",
        "kind": "bootchain",
        "blocking": false,
        "name": "Ambos slots sanables (A/B activo y no corrupto)"
      },
      {
        "id": "verified_boot_state",
        "kind": "bootchain",
        "blocking": false,
        "name": "Estado de boot verificado sin alteraciones"
      }
    ],
    "sources": [
      "lineageos",
      "seed",
      "play"
    ]
  },
{
    "codename": "ocean",
    "variant": null,
    "key": "ocean",
    "marketingName": "moto g7 power",
    "vendor": "Motorola",
    "soc": "Qualcomm SDM632 Snapdragon 632",
    "socVendor": "qualcomm",
    "platform": "sdm632",
    "modelNumbers": [
      "XT1955-1",
      "XT1955-2",
      "XT1955-4",
      "XT1955-5",
      "XT1955-7"
    ],
    "androidVersion": 21,
    "release": "2019-02",
    "capabilities": [
      "a_b_slots",
      "adb",
      "battery_calibration",
      "battery_health_read",
      "display_pwm_test",
      "dynamic_partitions",
      "edl",
      "evidence_capture",
      "fastboot",
      "fastbootd",
      "frp_owner_assisted",
      "network_reset",
      "official_rom_flash",
      "ota",
      "recovery",
      "sim_reset",
      "storage_health_read",
      "thermal_read",
      "touch_grid_test",
      "verified_boot"
    ],
    "riskFlags": [
      "edl_requires_signed_programmer",
      "recovery_flash_target_is:boot"
    ],
    "verificationGates": [
      {
        "id": "power_on",
        "name": "El equipo enciende y no reinicia en 3 min",
        "kind": "hardware",
        "blocking": true
      },
      {
        "id": "charging",
        "name": "Detecta carga y aumenta el porcentaje",
        "kind": "hardware",
        "blocking": true
      },
      {
        "id": "battery_report",
        "name": "Bateria reporta capacidad real > 60% del diseño",
        "kind": "hardware",
        "blocking": false
      },
      {
        "id": "touch_grid",
        "name": "Rejilla de táctil sin zonas muertas",
        "kind": "sensor",
        "blocking": true
      },
      {
        "id": "display_pwm",
        "name": "Pantalla sin parpadeo anormal / lineas",
        "kind": "display",
        "blocking": true
      },
      {
        "id": "audio_path",
        "name": "Altavoz, auricular y microfonos responden",
        "kind": "audio",
        "blocking": true
      },
      {
        "id": "cameras",
        "name": "Todas las camaras abren imagen",
        "kind": "camera",
        "blocking": true
      },
      {
        "id": "sensors",
        "name": "Proximidad, huella y giroscopio responden",
        "kind": "sensor",
        "blocking": false
      },
      {
        "id": "network_register",
        "name": "Registra en la red destino (SIM Telcel/AT&T/Movistar)",
        "kind": "network",
        "blocking": true
      },
      {
        "id": "data_browse",
        "name": "Abre internet y resuelve DNS",
        "kind": "network",
        "blocking": true
      },
      {
        "id": "call_voicemail",
        "kind": "network",
        "blocking": false,
        "name": "Llamada / mensaje saliente"
      },
      {
        "id": "gms",
        "name": "Play Servicios y apps base abren",
        "kind": "software",
        "blocking": false
      },
      {
        "id": "ota",
        "name": "Acepta(actualizar) sin error",
        "kind": "software",
        "blocking": false
      },
      {
        "id": "radio_ident",
        "kind": "radio",
        "blocking": true,
        "name": "IMEI/ESN intactos y sin cambios"
      },
      {
        "id": "slot_health",
        "kind": "bootchain",
        "blocking": false,
        "name": "Ambos slots sanables (A/B activo y no corrupto)"
      },
      {
        "id": "verified_boot_state",
        "kind": "bootchain",
        "blocking": false,
        "name": "Estado de boot verificado sin alteraciones"
      }
    ],
    "sources": [
      "lineageos",
      "seed",
      "play"
    ]
  },
{
    "codename": "m20lte",
    "variant": null,
    "key": "m20lte",
    "marketingName": "Galaxy M20",
    "vendor": "Samsung",
    "soc": "Samsung Exynos 7904",
    "socVendor": "exynos",
    "platform": "universal7904",
    "modelNumbers": [
      "SM-M205F",
      "SM-M205FN",
      "SM-M205G",
      "SM-M205M",
      "SM-M205N"
    ],
    "androidVersion": 17,
    "release": "2019-01-28",
    "capabilities": [
      "a_only",
      "adb",
      "battery_calibration",
      "battery_health_read",
      "display_pwm_test",
      "dynamic_partitions",
      "evidence_capture",
      "fastboot",
      "fastbootd",
      "frp_owner_assisted",
      "network_reset",
      "odin_download",
      "official_rom_flash",
      "ota",
      "recovery",
      "sim_reset",
      "storage_health_read",
      "thermal_read",
      "touch_grid_test",
      "verified_boot"
    ],
    "riskFlags": [
      "odin_requires_signed_secure_package",
      "pre_install_required:needs_specific_android_fw",
      "samsung_knox_eFuse_risk_on_unlock"
    ],
    "verificationGates": [
      {
        "id": "power_on",
        "name": "El equipo enciende y no reinicia en 3 min",
        "kind": "hardware",
        "blocking": true
      },
      {
        "id": "charging",
        "name": "Detecta carga y aumenta el porcentaje",
        "kind": "hardware",
        "blocking": true
      },
      {
        "id": "battery_report",
        "name": "Bateria reporta capacidad real > 60% del diseño",
        "kind": "hardware",
        "blocking": false
      },
      {
        "id": "touch_grid",
        "name": "Rejilla de táctil sin zonas muertas",
        "kind": "sensor",
        "blocking": true
      },
      {
        "id": "display_pwm",
        "name": "Pantalla sin parpadeo anormal / lineas",
        "kind": "display",
        "blocking": true
      },
      {
        "id": "audio_path",
        "name": "Altavoz, auricular y microfonos responden",
        "kind": "audio",
        "blocking": true
      },
      {
        "id": "cameras",
        "name": "Todas las camaras abren imagen",
        "kind": "camera",
        "blocking": true
      },
      {
        "id": "sensors",
        "name": "Proximidad, huella y giroscopio responden",
        "kind": "sensor",
        "blocking": false
      },
      {
        "id": "network_register",
        "name": "Registra en la red destino (SIM Telcel/AT&T/Movistar)",
        "kind": "network",
        "blocking": true
      },
      {
        "id": "data_browse",
        "name": "Abre internet y resuelve DNS",
        "kind": "network",
        "blocking": true
      },
      {
        "id": "call_voicemail",
        "kind": "network",
        "blocking": false,
        "name": "Llamada / mensaje saliente"
      },
      {
        "id": "gms",
        "name": "Play Servicios y apps base abren",
        "kind": "software",
        "blocking": false
      },
      {
        "id": "ota",
        "name": "Acepta(actualizar) sin error",
        "kind": "software",
        "blocking": false
      },
      {
        "id": "radio_ident",
        "kind": "radio",
        "blocking": true,
        "name": "IMEI/ESN intactos y sin cambios"
      },
      {
        "id": "verified_boot_state",
        "kind": "bootchain",
        "blocking": false,
        "name": "Estado de boot verificado sin alteraciones"
      }
    ],
    "sources": [
      "lineageos",
      "seed",
      "play"
    ]
  },
{
    "codename": "a3xelte",
    "variant": null,
    "key": "a3xelte",
    "marketingName": "Galaxy A3 (2016)",
    "vendor": "Samsung",
    "soc": "Samsung Exynos 7578",
    "socVendor": "exynos",
    "platform": "universal7580",
    "modelNumbers": [
      "SM-A310F",
      "SM-A310F/DS",
      "SM-A310M",
      "SM-A310N0",
      "SM-A310Y"
    ],
    "androidVersion": 16,
    "release": "2015-12",
    "capabilities": [
      "a_only",
      "adb",
      "battery_calibration",
      "battery_health_read",
      "display_pwm_test",
      "dynamic_partitions",
      "evidence_capture",
      "fastboot",
      "fastbootd",
      "frp_owner_assisted",
      "network_reset",
      "odin_download",
      "official_rom_flash",
      "ota",
      "recovery",
      "sim_reset",
      "storage_health_read",
      "thermal_read",
      "touch_grid_test",
      "verified_boot"
    ],
    "riskFlags": [
      "odin_requires_signed_secure_package",
      "samsung_knox_eFuse_risk_on_unlock"
    ],
    "verificationGates": [
      {
        "id": "power_on",
        "name": "El equipo enciende y no reinicia en 3 min",
        "kind": "hardware",
        "blocking": true
      },
      {
        "id": "charging",
        "name": "Detecta carga y aumenta el porcentaje",
        "kind": "hardware",
        "blocking": true
      },
      {
        "id": "battery_report",
        "name": "Bateria reporta capacidad real > 60% del diseño",
        "kind": "hardware",
        "blocking": false
      },
      {
        "id": "touch_grid",
        "name": "Rejilla de táctil sin zonas muertas",
        "kind": "sensor",
        "blocking": true
      },
      {
        "id": "display_pwm",
        "name": "Pantalla sin parpadeo anormal / lineas",
        "kind": "display",
        "blocking": true
      },
      {
        "id": "audio_path",
        "name": "Altavoz, auricular y microfonos responden",
        "kind": "audio",
        "blocking": true
      },
      {
        "id": "cameras",
        "name": "Todas las camaras abren imagen",
        "kind": "camera",
        "blocking": true
      },
      {
        "id": "sensors",
        "name": "Proximidad, huella y giroscopio responden",
        "kind": "sensor",
        "blocking": false
      },
      {
        "id": "network_register",
        "name": "Registra en la red destino (SIM Telcel/AT&T/Movistar)",
        "kind": "network",
        "blocking": true
      },
      {
        "id": "data_browse",
        "name": "Abre internet y resuelve DNS",
        "kind": "network",
        "blocking": true
      },
      {
        "id": "call_voicemail",
        "kind": "network",
        "blocking": false,
        "name": "Llamada / mensaje saliente"
      },
      {
        "id": "gms",
        "name": "Play Servicios y apps base abren",
        "kind": "software",
        "blocking": false
      },
      {
        "id": "ota",
        "name": "Acepta(actualizar) sin error",
        "kind": "software",
        "blocking": false
      },
      {
        "id": "radio_ident",
        "kind": "radio",
        "blocking": true,
        "name": "IMEI/ESN intactos y sin cambios"
      },
      {
        "id": "verified_boot_state",
        "kind": "bootchain",
        "blocking": false,
        "name": "Estado de boot verificado sin alteraciones"
      }
    ],
    "sources": [
      "lineageos",
      "seed",
      "play"
    ]
  },
{
    "codename": "rq3q",
    "variant": null,
    "key": "rq3q",
    "marketingName": "Galaxy A54 5G",
    "vendor": "Samsung",
    "soc": "Samsung Exynos 1380",
    "socVendor": "exynos",
    "platform": null,
    "modelNumbers": [
      "SM-A546E",
      "SM-A546B",
      "SM-A546U",
      "SM-A546U1",
      "SM-A546X"
    ],
    "androidVersion": 13,
    "release": null,
    "capabilities": [
      "a_b_slots",
      "adb",
      "battery_calibration",
      "battery_health_read",
      "display_pwm_test",
      "dynamic_partitions",
      "evidence_capture",
      "fastboot",
      "fastbootd",
      "frp_owner_assisted",
      "network_reset",
      "odin_download",
      "official_rom_flash",
      "ota",
      "recovery",
      "sim_reset",
      "storage_health_read",
      "thermal_read",
      "touch_grid_test",
      "verified_boot"
    ],
    "riskFlags": [
      "odin_requires_signed_secure_package",
      "samsung_knox_eFuse_risk_on_unlock"
    ],
    "verificationGates": [
      {
        "id": "power_on",
        "name": "El equipo enciende y no reinicia en 3 min",
        "kind": "hardware",
        "blocking": true
      },
      {
        "id": "charging",
        "name": "Detecta carga y aumenta el porcentaje",
        "kind": "hardware",
        "blocking": true
      },
      {
        "id": "battery_report",
        "name": "Bateria reporta capacidad real > 60% del diseño",
        "kind": "hardware",
        "blocking": false
      },
      {
        "id": "touch_grid",
        "name": "Rejilla de táctil sin zonas muertas",
        "kind": "sensor",
        "blocking": true
      },
      {
        "id": "display_pwm",
        "name": "Pantalla sin parpadeo anormal / lineas",
        "kind": "display",
        "blocking": true
      },
      {
        "id": "audio_path",
        "name": "Altavoz, auricular y microfonos responden",
        "kind": "audio",
        "blocking": true
      },
      {
        "id": "cameras",
        "name": "Todas las camaras abren imagen",
        "kind": "camera",
        "blocking": true
      },
      {
        "id": "sensors",
        "name": "Proximidad, huella y giroscopio responden",
        "kind": "sensor",
        "blocking": false
      },
      {
        "id": "network_register",
        "name": "Registra en la red destino (SIM Telcel/AT&T/Movistar)",
        "kind": "network",
        "blocking": true
      },
      {
        "id": "data_browse",
        "name": "Abre internet y resuelve DNS",
        "kind": "network",
        "blocking": true
      },
      {
        "id": "call_voicemail",
        "kind": "network",
        "blocking": false,
        "name": "Llamada / mensaje saliente"
      },
      {
        "id": "gms",
        "name": "Play Servicios y apps base abren",
        "kind": "software",
        "blocking": false
      },
      {
        "id": "ota",
        "name": "Acepta(actualizar) sin error",
        "kind": "software",
        "blocking": false
      },
      {
        "id": "radio_ident",
        "kind": "radio",
        "blocking": true,
        "name": "IMEI/ESN intactos y sin cambios"
      },
      {
        "id": "slot_health",
        "kind": "bootchain",
        "blocking": false,
        "name": "Ambos slots sanables (A/B activo y no corrupto)"
      },
      {
        "id": "verified_boot_state",
        "kind": "bootchain",
        "blocking": false,
        "name": "Estado de boot verificado sin alteraciones"
      }
    ],
    "sources": [
      "manual",
      "seed"
    ]
  },
{
    "codename": "a52q",
    "variant": null,
    "key": "a52q",
    "marketingName": "Galaxy A52 4G",
    "vendor": "Samsung",
    "soc": "Qualcomm SM7125 Snapdragon 720G",
    "socVendor": "qualcomm",
    "platform": "sm7125",
    "modelNumbers": [
      "SM-A525F",
      "SM-A525M",
      "SM-A525F/DS",
      "SM-A525M/DS"
    ],
    "androidVersion": 22,
    "release": null,
    "capabilities": [
      "a_only",
      "adb",
      "battery_calibration",
      "battery_health_read",
      "display_pwm_test",
      "dynamic_partitions",
      "edl",
      "evidence_capture",
      "fastboot",
      "fastbootd",
      "frp_owner_assisted",
      "network_reset",
      "official_rom_flash",
      "ota",
      "recovery",
      "sim_reset",
      "storage_health_read",
      "thermal_read",
      "touch_grid_test",
      "verified_boot"
    ],
    "riskFlags": [
      "edl_requires_signed_programmer",
      "pre_install_required:needs_specific_android_fw",
      "samsung_knox_eFuse_risk_on_unlock"
    ],
    "verificationGates": [
      {
        "id": "power_on",
        "name": "El equipo enciende y no reinicia en 3 min",
        "kind": "hardware",
        "blocking": true
      },
      {
        "id": "charging",
        "name": "Detecta carga y aumenta el porcentaje",
        "kind": "hardware",
        "blocking": true
      },
      {
        "id": "battery_report",
        "name": "Bateria reporta capacidad real > 60% del diseño",
        "kind": "hardware",
        "blocking": false
      },
      {
        "id": "touch_grid",
        "name": "Rejilla de táctil sin zonas muertas",
        "kind": "sensor",
        "blocking": true
      },
      {
        "id": "display_pwm",
        "name": "Pantalla sin parpadeo anormal / lineas",
        "kind": "display",
        "blocking": true
      },
      {
        "id": "audio_path",
        "name": "Altavoz, auricular y microfonos responden",
        "kind": "audio",
        "blocking": true
      },
      {
        "id": "cameras",
        "name": "Todas las camaras abren imagen",
        "kind": "camera",
        "blocking": true
      },
      {
        "id": "sensors",
        "name": "Proximidad, huella y giroscopio responden",
        "kind": "sensor",
        "blocking": false
      },
      {
        "id": "network_register",
        "name": "Registra en la red destino (SIM Telcel/AT&T/Movistar)",
        "kind": "network",
        "blocking": true
      },
      {
        "id": "data_browse",
        "name": "Abre internet y resuelve DNS",
        "kind": "network",
        "blocking": true
      },
      {
        "id": "call_voicemail",
        "kind": "network",
        "blocking": false,
        "name": "Llamada / mensaje saliente"
      },
      {
        "id": "gms",
        "name": "Play Servicios y apps base abren",
        "kind": "software",
        "blocking": false
      },
      {
        "id": "ota",
        "name": "Acepta(actualizar) sin error",
        "kind": "software",
        "blocking": false
      },
      {
        "id": "radio_ident",
        "kind": "radio",
        "blocking": true,
        "name": "IMEI/ESN intactos y sin cambios"
      },
      {
        "id": "verified_boot_state",
        "kind": "bootchain",
        "blocking": false,
        "name": "Estado de boot verificado sin alteraciones"
      }
    ],
    "sources": [
      "lineageos",
      "seed",
      "play"
    ]
  },
{
    "codename": "a71",
    "variant": null,
    "key": "a71",
    "marketingName": "Galaxy A71",
    "vendor": "Samsung",
    "soc": "Qualcomm SM7150-AA Snapdragon 730",
    "socVendor": "qualcomm",
    "platform": "a71",
    "modelNumbers": [
      "SM-A715F",
      "SM-A715F/DS",
      "SM-A715F/DSN",
      "SM-A715F/DSM"
    ],
    "androidVersion": 22,
    "release": "2020-01-17",
    "capabilities": [
      "a_only",
      "adb",
      "battery_calibration",
      "battery_health_read",
      "display_pwm_test",
      "dynamic_partitions",
      "edl",
      "evidence_capture",
      "fastboot",
      "fastbootd",
      "frp_owner_assisted",
      "network_reset",
      "official_rom_flash",
      "ota",
      "recovery",
      "sim_reset",
      "storage_health_read",
      "thermal_read",
      "touch_grid_test",
      "verified_boot"
    ],
    "riskFlags": [
      "edl_requires_signed_programmer",
      "pre_install_required:needs_specific_android_fw",
      "samsung_knox_eFuse_risk_on_unlock"
    ],
    "verificationGates": [
      {
        "id": "power_on",
        "name": "El equipo enciende y no reinicia en 3 min",
        "kind": "hardware",
        "blocking": true
      },
      {
        "id": "charging",
        "name": "Detecta carga y aumenta el porcentaje",
        "kind": "hardware",
        "blocking": true
      },
      {
        "id": "battery_report",
        "name": "Bateria reporta capacidad real > 60% del diseño",
        "kind": "hardware",
        "blocking": false
      },
      {
        "id": "touch_grid",
        "name": "Rejilla de táctil sin zonas muertas",
        "kind": "sensor",
        "blocking": true
      },
      {
        "id": "display_pwm",
        "name": "Pantalla sin parpadeo anormal / lineas",
        "kind": "display",
        "blocking": true
      },
      {
        "id": "audio_path",
        "name": "Altavoz, auricular y microfonos responden",
        "kind": "audio",
        "blocking": true
      },
      {
        "id": "cameras",
        "name": "Todas las camaras abren imagen",
        "kind": "camera",
        "blocking": true
      },
      {
        "id": "sensors",
        "name": "Proximidad, huella y giroscopio responden",
        "kind": "sensor",
        "blocking": false
      },
      {
        "id": "network_register",
        "name": "Registra en la red destino (SIM Telcel/AT&T/Movistar)",
        "kind": "network",
        "blocking": true
      },
      {
        "id": "data_browse",
        "name": "Abre internet y resuelve DNS",
        "kind": "network",
        "blocking": true
      },
      {
        "id": "call_voicemail",
        "kind": "network",
        "blocking": false,
        "name": "Llamada / mensaje saliente"
      },
      {
        "id": "gms",
        "name": "Play Servicios y apps base abren",
        "kind": "software",
        "blocking": false
      },
      {
        "id": "ota",
        "name": "Acepta(actualizar) sin error",
        "kind": "software",
        "blocking": false
      },
      {
        "id": "radio_ident",
        "kind": "radio",
        "blocking": true,
        "name": "IMEI/ESN intactos y sin cambios"
      },
      {
        "id": "verified_boot_state",
        "kind": "bootchain",
        "blocking": false,
        "name": "Estado de boot verificado sin alteraciones"
      }
    ],
    "sources": [
      "lineageos",
      "seed",
      "play"
    ]
  },
{
    "codename": "a72q",
    "variant": null,
    "key": "a72q",
    "marketingName": "Galaxy A72",
    "vendor": "Samsung",
    "soc": "Qualcomm SM7125 Snapdragon 720G",
    "socVendor": "qualcomm",
    "platform": "sm7125",
    "modelNumbers": [
      "SM-A725F",
      "SM-A725M",
      "SM-A725F/DS",
      "SM-A725M/DS"
    ],
    "androidVersion": 22,
    "release": null,
    "capabilities": [
      "a_only",
      "adb",
      "battery_calibration",
      "battery_health_read",
      "display_pwm_test",
      "dynamic_partitions",
      "edl",
      "evidence_capture",
      "fastboot",
      "fastbootd",
      "frp_owner_assisted",
      "network_reset",
      "official_rom_flash",
      "ota",
      "recovery",
      "sim_reset",
      "storage_health_read",
      "thermal_read",
      "touch_grid_test",
      "verified_boot"
    ],
    "riskFlags": [
      "edl_requires_signed_programmer",
      "pre_install_required:needs_specific_android_fw",
      "samsung_knox_eFuse_risk_on_unlock"
    ],
    "verificationGates": [
      {
        "id": "power_on",
        "name": "El equipo enciende y no reinicia en 3 min",
        "kind": "hardware",
        "blocking": true
      },
      {
        "id": "charging",
        "name": "Detecta carga y aumenta el porcentaje",
        "kind": "hardware",
        "blocking": true
      },
      {
        "id": "battery_report",
        "name": "Bateria reporta capacidad real > 60% del diseño",
        "kind": "hardware",
        "blocking": false
      },
      {
        "id": "touch_grid",
        "name": "Rejilla de táctil sin zonas muertas",
        "kind": "sensor",
        "blocking": true
      },
      {
        "id": "display_pwm",
        "name": "Pantalla sin parpadeo anormal / lineas",
        "kind": "display",
        "blocking": true
      },
      {
        "id": "audio_path",
        "name": "Altavoz, auricular y microfonos responden",
        "kind": "audio",
        "blocking": true
      },
      {
        "id": "cameras",
        "name": "Todas las camaras abren imagen",
        "kind": "camera",
        "blocking": true
      },
      {
        "id": "sensors",
        "name": "Proximidad, huella y giroscopio responden",
        "kind": "sensor",
        "blocking": false
      },
      {
        "id": "network_register",
        "name": "Registra en la red destino (SIM Telcel/AT&T/Movistar)",
        "kind": "network",
        "blocking": true
      },
      {
        "id": "data_browse",
        "name": "Abre internet y resuelve DNS",
        "kind": "network",
        "blocking": true
      },
      {
        "id": "call_voicemail",
        "kind": "network",
        "blocking": false,
        "name": "Llamada / mensaje saliente"
      },
      {
        "id": "gms",
        "name": "Play Servicios y apps base abren",
        "kind": "software",
        "blocking": false
      },
      {
        "id": "ota",
        "name": "Acepta(actualizar) sin error",
        "kind": "software",
        "blocking": false
      },
      {
        "id": "radio_ident",
        "kind": "radio",
        "blocking": true,
        "name": "IMEI/ESN intactos y sin cambios"
      },
      {
        "id": "verified_boot_state",
        "kind": "bootchain",
        "blocking": false,
        "name": "Estado de boot verificado sin alteraciones"
      }
    ],
    "sources": [
      "lineageos",
      "seed",
      "play"
    ]
  },
{
    "codename": "borneo",
    "variant": null,
    "key": "borneo",
    "marketingName": "moto g power 2021",
    "vendor": "Motorola",
    "soc": "Qualcomm SM6115 Snapdragon 662",
    "socVendor": "qualcomm",
    "platform": "sm6225",
    "modelNumbers": [
      "XT2117-1",
      "XT2117-2",
      "XT2117-3",
      "XT2117-4"
    ],
    "androidVersion": 22,
    "release": "2021-01",
    "capabilities": [
      "a_b_slots",
      "adb",
      "battery_calibration",
      "battery_health_read",
      "display_pwm_test",
      "dynamic_partitions",
      "edl",
      "evidence_capture",
      "fastboot",
      "fastbootd",
      "frp_owner_assisted",
      "network_reset",
      "official_rom_flash",
      "ota",
      "recovery",
      "sim_reset",
      "storage_health_read",
      "thermal_read",
      "touch_grid_test",
      "verified_boot"
    ],
    "riskFlags": [
      "edl_requires_signed_programmer",
      "pre_install_required:needs_specific_android_fw"
    ],
    "verificationGates": [
      {
        "id": "power_on",
        "name": "El equipo enciende y no reinicia en 3 min",
        "kind": "hardware",
        "blocking": true
      },
      {
        "id": "charging",
        "name": "Detecta carga y aumenta el porcentaje",
        "kind": "hardware",
        "blocking": true
      },
      {
        "id": "battery_report",
        "name": "Bateria reporta capacidad real > 60% del diseño",
        "kind": "hardware",
        "blocking": false
      },
      {
        "id": "touch_grid",
        "name": "Rejilla de táctil sin zonas muertas",
        "kind": "sensor",
        "blocking": true
      },
      {
        "id": "display_pwm",
        "name": "Pantalla sin parpadeo anormal / lineas",
        "kind": "display",
        "blocking": true
      },
      {
        "id": "audio_path",
        "name": "Altavoz, auricular y microfonos responden",
        "kind": "audio",
        "blocking": true
      },
      {
        "id": "cameras",
        "name": "Todas las camaras abren imagen",
        "kind": "camera",
        "blocking": true
      },
      {
        "id": "sensors",
        "name": "Proximidad, huella y giroscopio responden",
        "kind": "sensor",
        "blocking": false
      },
      {
        "id": "network_register",
        "name": "Registra en la red destino (SIM Telcel/AT&T/Movistar)",
        "kind": "network",
        "blocking": true
      },
      {
        "id": "data_browse",
        "name": "Abre internet y resuelve DNS",
        "kind": "network",
        "blocking": true
      },
      {
        "id": "call_voicemail",
        "kind": "network",
        "blocking": false,
        "name": "Llamada / mensaje saliente"
      },
      {
        "id": "gms",
        "name": "Play Servicios y apps base abren",
        "kind": "software",
        "blocking": false
      },
      {
        "id": "ota",
        "name": "Acepta(actualizar) sin error",
        "kind": "software",
        "blocking": false
      },
      {
        "id": "radio_ident",
        "kind": "radio",
        "blocking": true,
        "name": "IMEI/ESN intactos y sin cambios"
      },
      {
        "id": "slot_health",
        "kind": "bootchain",
        "blocking": false,
        "name": "Ambos slots sanables (A/B activo y no corrupto)"
      },
      {
        "id": "verified_boot_state",
        "kind": "bootchain",
        "blocking": false,
        "name": "Estado de boot verificado sin alteraciones"
      }
    ],
    "sources": [
      "lineageos",
      "seed",
      "play"
    ]
  },
{
    "codename": "c2s",
    "variant": null,
    "key": "c2s",
    "marketingName": "Galaxy Note20 Ultra (4G/5G)",
    "vendor": "Samsung",
    "soc": "Samsung Exynos 990",
    "socVendor": "exynos",
    "platform": "universal9830",
    "modelNumbers": [
      "SM-N985F",
      "SM-N985F/DS",
      "SM-N986B",
      "SM-N986B/DS"
    ],
    "androidVersion": 22,
    "release": "2020-08-21",
    "capabilities": [
      "a_only",
      "adb",
      "battery_calibration",
      "battery_health_read",
      "display_pwm_test",
      "dynamic_partitions",
      "evidence_capture",
      "fastboot",
      "fastbootd",
      "frp_owner_assisted",
      "network_reset",
      "odin_download",
      "official_rom_flash",
      "ota",
      "recovery",
      "sim_reset",
      "storage_health_read",
      "thermal_read",
      "touch_grid_test",
      "verified_boot"
    ],
    "riskFlags": [
      "odin_requires_signed_secure_package",
      "pre_install_required:needs_specific_android_fw",
      "samsung_knox_eFuse_risk_on_unlock"
    ],
    "verificationGates": [
      {
        "id": "power_on",
        "name": "El equipo enciende y no reinicia en 3 min",
        "kind": "hardware",
        "blocking": true
      },
      {
        "id": "charging",
        "name": "Detecta carga y aumenta el porcentaje",
        "kind": "hardware",
        "blocking": true
      },
      {
        "id": "battery_report",
        "name": "Bateria reporta capacidad real > 60% del diseño",
        "kind": "hardware",
        "blocking": false
      },
      {
        "id": "touch_grid",
        "name": "Rejilla de táctil sin zonas muertas",
        "kind": "sensor",
        "blocking": true
      },
      {
        "id": "display_pwm",
        "name": "Pantalla sin parpadeo anormal / lineas",
        "kind": "display",
        "blocking": true
      },
      {
        "id": "audio_path",
        "name": "Altavoz, auricular y microfonos responden",
        "kind": "audio",
        "blocking": true
      },
      {
        "id": "cameras",
        "name": "Todas las camaras abren imagen",
        "kind": "camera",
        "blocking": true
      },
      {
        "id": "sensors",
        "name": "Proximidad, huella y giroscopio responden",
        "kind": "sensor",
        "blocking": false
      },
      {
        "id": "network_register",
        "name": "Registra en la red destino (SIM Telcel/AT&T/Movistar)",
        "kind": "network",
        "blocking": true
      },
      {
        "id": "data_browse",
        "name": "Abre internet y resuelve DNS",
        "kind": "network",
        "blocking": true
      },
      {
        "id": "call_voicemail",
        "kind": "network",
        "blocking": false,
        "name": "Llamada / mensaje saliente"
      },
      {
        "id": "gms",
        "name": "Play Servicios y apps base abren",
        "kind": "software",
        "blocking": false
      },
      {
        "id": "ota",
        "name": "Acepta(actualizar) sin error",
        "kind": "software",
        "blocking": false
      },
      {
        "id": "radio_ident",
        "kind": "radio",
        "blocking": true,
        "name": "IMEI/ESN intactos y sin cambios"
      },
      {
        "id": "verified_boot_state",
        "kind": "bootchain",
        "blocking": false,
        "name": "Estado de boot verificado sin alteraciones"
      }
    ],
    "sources": [
      "lineageos",
      "seed",
      "play"
    ]
  },
{
    "codename": "dodge",
    "variant": null,
    "key": "dodge",
    "marketingName": "13",
    "vendor": "OnePlus",
    "soc": "Qualcomm SM8750 Snapdragon 8 Elite",
    "socVendor": "qualcomm",
    "platform": "sm8750",
    "modelNumbers": [
      "CPH2649",
      "CPH2653",
      "CPH2655",
      "PJZ110"
    ],
    "androidVersion": 22,
    "release": "2025-01",
    "capabilities": [
      "a_b_slots",
      "adb",
      "battery_calibration",
      "battery_health_read",
      "display_pwm_test",
      "dynamic_partitions",
      "edl",
      "evidence_capture",
      "fastboot",
      "fastbootd",
      "frp_owner_assisted",
      "network_reset",
      "official_rom_flash",
      "ota",
      "recovery",
      "sim_reset",
      "storage_health_read",
      "thermal_read",
      "touch_grid_test",
      "unlock_official",
      "verified_boot"
    ],
    "riskFlags": [
      "edl_requires_signed_programmer",
      "pre_install_required:needs_specific_android_fw"
    ],
    "verificationGates": [
      {
        "id": "power_on",
        "name": "El equipo enciende y no reinicia en 3 min",
        "kind": "hardware",
        "blocking": true
      },
      {
        "id": "charging",
        "name": "Detecta carga y aumenta el porcentaje",
        "kind": "hardware",
        "blocking": true
      },
      {
        "id": "battery_report",
        "name": "Bateria reporta capacidad real > 60% del diseño",
        "kind": "hardware",
        "blocking": false
      },
      {
        "id": "touch_grid",
        "name": "Rejilla de táctil sin zonas muertas",
        "kind": "sensor",
        "blocking": true
      },
      {
        "id": "display_pwm",
        "name": "Pantalla sin parpadeo anormal / lineas",
        "kind": "display",
        "blocking": true
      },
      {
        "id": "audio_path",
        "name": "Altavoz, auricular y microfonos responden",
        "kind": "audio",
        "blocking": true
      },
      {
        "id": "cameras",
        "name": "Todas las camaras abren imagen",
        "kind": "camera",
        "blocking": true
      },
      {
        "id": "sensors",
        "name": "Proximidad, huella y giroscopio responden",
        "kind": "sensor",
        "blocking": false
      },
      {
        "id": "network_register",
        "name": "Registra en la red destino (SIM Telcel/AT&T/Movistar)",
        "kind": "network",
        "blocking": true
      },
      {
        "id": "data_browse",
        "name": "Abre internet y resuelve DNS",
        "kind": "network",
        "blocking": true
      },
      {
        "id": "call_voicemail",
        "kind": "network",
        "blocking": false,
        "name": "Llamada / mensaje saliente"
      },
      {
        "id": "gms",
        "name": "Play Servicios y apps base abren",
        "kind": "software",
        "blocking": false
      },
      {
        "id": "ota",
        "name": "Acepta(actualizar) sin error",
        "kind": "software",
        "blocking": false
      },
      {
        "id": "radio_ident",
        "kind": "radio",
        "blocking": true,
        "name": "IMEI/ESN intactos y sin cambios"
      },
      {
        "id": "slot_health",
        "kind": "bootchain",
        "blocking": false,
        "name": "Ambos slots sanables (A/B activo y no corrupto)"
      },
      {
        "id": "verified_boot_state",
        "kind": "bootchain",
        "blocking": false,
        "name": "Estado de boot verificado sin alteraciones"
      }
    ],
    "sources": [
      "lineageos",
      "seed",
      "play"
    ]
  },
{
    "codename": "gta4l",
    "variant": null,
    "key": "gta4l",
    "marketingName": "Galaxy Tab A7 10.4 2020 (LTE)",
    "vendor": "Samsung",
    "soc": "Qualcomm SM6115 Snapdragon 662",
    "socVendor": "qualcomm",
    "platform": "sm6115",
    "modelNumbers": [
      "SM-T505",
      "SM-T505C",
      "SM-T505N",
      "SM-T507"
    ],
    "androidVersion": 22,
    "release": "2020-09",
    "capabilities": [
      "a_only",
      "adb",
      "battery_calibration",
      "battery_health_read",
      "display_pwm_test",
      "dynamic_partitions",
      "edl",
      "evidence_capture",
      "fastboot",
      "fastbootd",
      "frp_owner_assisted",
      "network_reset",
      "official_rom_flash",
      "ota",
      "recovery",
      "sim_reset",
      "storage_health_read",
      "thermal_read",
      "touch_grid_test",
      "verified_boot"
    ],
    "riskFlags": [
      "edl_requires_signed_programmer",
      "pre_install_required:needs_specific_android_fw",
      "samsung_knox_eFuse_risk_on_unlock"
    ],
    "verificationGates": [
      {
        "id": "power_on",
        "name": "El equipo enciende y no reinicia en 3 min",
        "kind": "hardware",
        "blocking": true
      },
      {
        "id": "charging",
        "name": "Detecta carga y aumenta el porcentaje",
        "kind": "hardware",
        "blocking": true
      },
      {
        "id": "battery_report",
        "name": "Bateria reporta capacidad real > 60% del diseño",
        "kind": "hardware",
        "blocking": false
      },
      {
        "id": "touch_grid",
        "name": "Rejilla de táctil sin zonas muertas",
        "kind": "sensor",
        "blocking": true
      },
      {
        "id": "display_pwm",
        "name": "Pantalla sin parpadeo anormal / lineas",
        "kind": "display",
        "blocking": true
      },
      {
        "id": "audio_path",
        "name": "Altavoz, auricular y microfonos responden",
        "kind": "audio",
        "blocking": true
      },
      {
        "id": "cameras",
        "name": "Todas las camaras abren imagen",
        "kind": "camera",
        "blocking": true
      },
      {
        "id": "sensors",
        "name": "Proximidad, huella y giroscopio responden",
        "kind": "sensor",
        "blocking": false
      },
      {
        "id": "network_register",
        "name": "Registra en la red destino (SIM Telcel/AT&T/Movistar)",
        "kind": "network",
        "blocking": true
      },
      {
        "id": "data_browse",
        "name": "Abre internet y resuelve DNS",
        "kind": "network",
        "blocking": true
      },
      {
        "id": "call_voicemail",
        "kind": "network",
        "blocking": false,
        "name": "Llamada / mensaje saliente"
      },
      {
        "id": "gms",
        "name": "Play Servicios y apps base abren",
        "kind": "software",
        "blocking": false
      },
      {
        "id": "ota",
        "name": "Acepta(actualizar) sin error",
        "kind": "software",
        "blocking": false
      },
      {
        "id": "radio_ident",
        "kind": "radio",
        "blocking": true,
        "name": "IMEI/ESN intactos y sin cambios"
      },
      {
        "id": "verified_boot_state",
        "kind": "bootchain",
        "blocking": false,
        "name": "Estado de boot verificado sin alteraciones"
      }
    ],
    "sources": [
      "lineageos",
      "seed",
      "play"
    ]
  },
{
    "codename": "judypn",
    "variant": null,
    "key": "judypn",
    "marketingName": "V40 ThinQ",
    "vendor": "LG",
    "soc": "Qualcomm SDM845 Snapdragon 845",
    "socVendor": "qualcomm",
    "platform": "sdm845",
    "modelNumbers": [
      "LM-V405QA7",
      "LM-V405UA",
      "LM-V405UA0",
      "LM-V405EBW",
      "LM-V405EAW",
      "LM-V409N"
    ],
    "androidVersion": 21,
    "release": "2018-10-03",
    "capabilities": [
      "a_b_slots",
      "adb",
      "battery_calibration",
      "battery_health_read",
      "display_pwm_test",
      "dynamic_partitions",
      "edl",
      "evidence_capture",
      "fastboot",
      "fastbootd",
      "frp_owner_assisted",
      "network_reset",
      "official_rom_flash",
      "ota",
      "recovery",
      "sim_reset",
      "storage_health_read",
      "thermal_read",
      "touch_grid_test",
      "verified_boot"
    ],
    "riskFlags": [
      "edl_requires_signed_programmer",
      "pre_install_required:needs_specific_android_fw",
      "recovery_flash_target_is:boot"
    ],
    "verificationGates": [
      {
        "id": "power_on",
        "name": "El equipo enciende y no reinicia en 3 min",
        "kind": "hardware",
        "blocking": true
      },
      {
        "id": "charging",
        "name": "Detecta carga y aumenta el porcentaje",
        "kind": "hardware",
        "blocking": true
      },
      {
        "id": "battery_report",
        "name": "Bateria reporta capacidad real > 60% del diseño",
        "kind": "hardware",
        "blocking": false
      },
      {
        "id": "touch_grid",
        "name": "Rejilla de táctil sin zonas muertas",
        "kind": "sensor",
        "blocking": true
      },
      {
        "id": "display_pwm",
        "name": "Pantalla sin parpadeo anormal / lineas",
        "kind": "display",
        "blocking": true
      },
      {
        "id": "audio_path",
        "name": "Altavoz, auricular y microfonos responden",
        "kind": "audio",
        "blocking": true
      },
      {
        "id": "cameras",
        "name": "Todas las camaras abren imagen",
        "kind": "camera",
        "blocking": true
      },
      {
        "id": "sensors",
        "name": "Proximidad, huella y giroscopio responden",
        "kind": "sensor",
        "blocking": false
      },
      {
        "id": "network_register",
        "name": "Registra en la red destino (SIM Telcel/AT&T/Movistar)",
        "kind": "network",
        "blocking": true
      },
      {
        "id": "data_browse",
        "name": "Abre internet y resuelve DNS",
        "kind": "network",
        "blocking": true
      },
      {
        "id": "call_voicemail",
        "kind": "network",
        "blocking": false,
        "name": "Llamada / mensaje saliente"
      },
      {
        "id": "gms",
        "name": "Play Servicios y apps base abren",
        "kind": "software",
        "blocking": false
      },
      {
        "id": "ota",
        "name": "Acepta(actualizar) sin error",
        "kind": "software",
        "blocking": false
      },
      {
        "id": "radio_ident",
        "kind": "radio",
        "blocking": true,
        "name": "IMEI/ESN intactos y sin cambios"
      },
      {
        "id": "slot_health",
        "kind": "bootchain",
        "blocking": false,
        "name": "Ambos slots sanables (A/B activo y no corrupto)"
      },
      {
        "id": "verified_boot_state",
        "kind": "bootchain",
        "blocking": false,
        "name": "Estado de boot verificado sin alteraciones"
      }
    ],
    "sources": [
      "lineageos",
      "seed",
      "play"
    ]
  },
{
    "codename": "kiwi",
    "variant": null,
    "key": "kiwi",
    "marketingName": "Honor 5X",
    "vendor": "Huawei",
    "soc": "Qualcomm MSM8939v2 Snapdragon 616",
    "socVendor": "qualcomm",
    "platform": "kiwi",
    "modelNumbers": [
      "KIW-L24",
      "KIW-L23",
      "KIW-L22",
      "KIW-L21",
      "KIW-AL10",
      "KIW-AL20",
      "KIW-CL00",
      "KIW-UL00",
      "KIW-TL00",
      "KIW-TL00H",
      "KII-L05",
      "KII-L22",
      "KII-L21"
    ],
    "androidVersion": 16,
    "release": "2015-11",
    "capabilities": [
      "a_only",
      "adb",
      "battery_calibration",
      "battery_health_read",
      "display_pwm_test",
      "dynamic_partitions",
      "edl",
      "evidence_capture",
      "fastboot",
      "fastbootd",
      "frp_owner_assisted",
      "network_reset",
      "official_rom_flash",
      "ota",
      "recovery",
      "sim_reset",
      "storage_health_read",
      "thermal_read",
      "touch_grid_test",
      "verified_boot"
    ],
    "riskFlags": [
      "edl_requires_signed_programmer"
    ],
    "verificationGates": [
      {
        "id": "power_on",
        "name": "El equipo enciende y no reinicia en 3 min",
        "kind": "hardware",
        "blocking": true
      },
      {
        "id": "charging",
        "name": "Detecta carga y aumenta el porcentaje",
        "kind": "hardware",
        "blocking": true
      },
      {
        "id": "battery_report",
        "name": "Bateria reporta capacidad real > 60% del diseño",
        "kind": "hardware",
        "blocking": false
      },
      {
        "id": "touch_grid",
        "name": "Rejilla de táctil sin zonas muertas",
        "kind": "sensor",
        "blocking": true
      },
      {
        "id": "display_pwm",
        "name": "Pantalla sin parpadeo anormal / lineas",
        "kind": "display",
        "blocking": true
      },
      {
        "id": "audio_path",
        "name": "Altavoz, auricular y microfonos responden",
        "kind": "audio",
        "blocking": true
      },
      {
        "id": "cameras",
        "name": "Todas las camaras abren imagen",
        "kind": "camera",
        "blocking": true
      },
      {
        "id": "sensors",
        "name": "Proximidad, huella y giroscopio responden",
        "kind": "sensor",
        "blocking": false
      },
      {
        "id": "network_register",
        "name": "Registra en la red destino (SIM Telcel/AT&T/Movistar)",
        "kind": "network",
        "blocking": true
      },
      {
        "id": "data_browse",
        "name": "Abre internet y resuelve DNS",
        "kind": "network",
        "blocking": true
      },
      {
        "id": "call_voicemail",
        "kind": "network",
        "blocking": false,
        "name": "Llamada / mensaje saliente"
      },
      {
        "id": "gms",
        "name": "Play Servicios y apps base abren",
        "kind": "software",
        "blocking": false
      },
      {
        "id": "ota",
        "name": "Acepta(actualizar) sin error",
        "kind": "software",
        "blocking": false
      },
      {
        "id": "radio_ident",
        "kind": "radio",
        "blocking": true,
        "name": "IMEI/ESN intactos y sin cambios"
      },
      {
        "id": "verified_boot_state",
        "kind": "bootchain",
        "blocking": false,
        "name": "Estado de boot verificado sin alteraciones"
      }
    ],
    "sources": [
      "lineageos",
      "seed",
      "play"
    ]
  },
{
    "codename": "G",
    "variant": null,
    "key": "G",
    "marketingName": "G",
    "vendor": "10.or",
    "soc": "Qualcomm MSM8953 Pro Snapdragon 626",
    "socVendor": "qualcomm",
    "platform": "G",
    "modelNumbers": [
      "G"
    ],
    "androidVersion": 19,
    "release": "2017-10-03",
    "capabilities": [
      "a_only",
      "adb",
      "battery_calibration",
      "battery_health_read",
      "display_pwm_test",
      "dynamic_partitions",
      "edl",
      "evidence_capture",
      "fastboot",
      "fastbootd",
      "frp_owner_assisted",
      "network_reset",
      "official_rom_flash",
      "ota",
      "recovery",
      "sim_reset",
      "storage_health_read",
      "thermal_read",
      "touch_grid_test",
      "verified_boot"
    ],
    "riskFlags": [
      "edl_requires_signed_programmer"
    ],
    "verificationGates": [
      {
        "id": "power_on",
        "name": "El equipo enciende y no reinicia en 3 min",
        "kind": "hardware",
        "blocking": true
      },
      {
        "id": "charging",
        "name": "Detecta carga y aumenta el porcentaje",
        "kind": "hardware",
        "blocking": true
      },
      {
        "id": "battery_report",
        "name": "Bateria reporta capacidad real > 60% del diseño",
        "kind": "hardware",
        "blocking": false
      },
      {
        "id": "touch_grid",
        "name": "Rejilla de táctil sin zonas muertas",
        "kind": "sensor",
        "blocking": true
      },
      {
        "id": "display_pwm",
        "name": "Pantalla sin parpadeo anormal / lineas",
        "kind": "display",
        "blocking": true
      },
      {
        "id": "audio_path",
        "name": "Altavoz, auricular y microfonos responden",
        "kind": "audio",
        "blocking": true
      },
      {
        "id": "cameras",
        "name": "Todas las camaras abren imagen",
        "kind": "camera",
        "blocking": true
      },
      {
        "id": "sensors",
        "name": "Proximidad, huella y giroscopio responden",
        "kind": "sensor",
        "blocking": false
      },
      {
        "id": "network_register",
        "name": "Registra en la red destino (SIM Telcel/AT&T/Movistar)",
        "kind": "network",
        "blocking": true
      },
      {
        "id": "data_browse",
        "name": "Abre internet y resuelve DNS",
        "kind": "network",
        "blocking": true
      },
      {
        "id": "call_voicemail",
        "kind": "network",
        "blocking": false,
        "name": "Llamada / mensaje saliente"
      },
      {
        "id": "gms",
        "name": "Play Servicios y apps base abren",
        "kind": "software",
        "blocking": false
      },
      {
        "id": "ota",
        "name": "Acepta(actualizar) sin error",
        "kind": "software",
        "blocking": false
      },
      {
        "id": "radio_ident",
        "kind": "radio",
        "blocking": true,
        "name": "IMEI/ESN intactos y sin cambios"
      },
      {
        "id": "verified_boot_state",
        "kind": "bootchain",
        "blocking": false,
        "name": "Estado de boot verificado sin alteraciones"
      }
    ],
    "sources": [
      "lineageos",
      "seed",
      "play"
    ]
  },
{
    "codename": "pioneer",
    "variant": null,
    "key": "pioneer",
    "marketingName": "Xperia XA2",
    "vendor": "Sony",
    "soc": "Qualcomm SDM630 Snapdragon 630",
    "socVendor": "qualcomm",
    "platform": "sdm660",
    "modelNumbers": [
      "H3113",
      "H4113",
      "H3133",
      "H4133",
      "H3123"
    ],
    "androidVersion": 22,
    "release": "2018-02",
    "capabilities": [
      "a_b_slots",
      "adb",
      "battery_calibration",
      "battery_health_read",
      "display_pwm_test",
      "dynamic_partitions",
      "edl",
      "evidence_capture",
      "fastboot",
      "fastbootd",
      "frp_owner_assisted",
      "network_reset",
      "official_rom_flash",
      "ota",
      "recovery",
      "sim_reset",
      "storage_health_read",
      "thermal_read",
      "touch_grid_test",
      "verified_boot"
    ],
    "riskFlags": [
      "edl_requires_signed_programmer",
      "pre_install_required:needs_specific_android_fw",
      "recovery_flash_target_is:boot"
    ],
    "verificationGates": [
      {
        "id": "power_on",
        "name": "El equipo enciende y no reinicia en 3 min",
        "kind": "hardware",
        "blocking": true
      },
      {
        "id": "charging",
        "name": "Detecta carga y aumenta el porcentaje",
        "kind": "hardware",
        "blocking": true
      },
      {
        "id": "battery_report",
        "name": "Bateria reporta capacidad real > 60% del diseño",
        "kind": "hardware",
        "blocking": false
      },
      {
        "id": "touch_grid",
        "name": "Rejilla de táctil sin zonas muertas",
        "kind": "sensor",
        "blocking": true
      },
      {
        "id": "display_pwm",
        "name": "Pantalla sin parpadeo anormal / lineas",
        "kind": "display",
        "blocking": true
      },
      {
        "id": "audio_path",
        "name": "Altavoz, auricular y microfonos responden",
        "kind": "audio",
        "blocking": true
      },
      {
        "id": "cameras",
        "name": "Todas las camaras abren imagen",
        "kind": "camera",
        "blocking": true
      },
      {
        "id": "sensors",
        "name": "Proximidad, huella y giroscopio responden",
        "kind": "sensor",
        "blocking": false
      },
      {
        "id": "network_register",
        "name": "Registra en la red destino (SIM Telcel/AT&T/Movistar)",
        "kind": "network",
        "blocking": true
      },
      {
        "id": "data_browse",
        "name": "Abre internet y resuelve DNS",
        "kind": "network",
        "blocking": true
      },
      {
        "id": "call_voicemail",
        "kind": "network",
        "blocking": false,
        "name": "Llamada / mensaje saliente"
      },
      {
        "id": "gms",
        "name": "Play Servicios y apps base abren",
        "kind": "software",
        "blocking": false
      },
      {
        "id": "ota",
        "name": "Acepta(actualizar) sin error",
        "kind": "software",
        "blocking": false
      },
      {
        "id": "radio_ident",
        "kind": "radio",
        "blocking": true,
        "name": "IMEI/ESN intactos y sin cambios"
      },
      {
        "id": "slot_health",
        "kind": "bootchain",
        "blocking": false,
        "name": "Ambos slots sanables (A/B activo y no corrupto)"
      },
      {
        "id": "verified_boot_state",
        "kind": "bootchain",
        "blocking": false,
        "name": "Estado de boot verificado sin alteraciones"
      }
    ],
    "sources": [
      "lineageos",
      "seed",
      "play"
    ]
  },
{
    "codename": "timelm",
    "variant": null,
    "key": "timelm",
    "marketingName": "V60 ThinQ",
    "vendor": "LG",
    "soc": "Qualcomm SM8250 Snapdragon 865",
    "socVendor": "qualcomm",
    "platform": "sm8250",
    "modelNumbers": [
      "L-51A",
      "LM-V600EA",
      "LM-V600VM",
      "LM-V600TM",
      "LM-V600N"
    ],
    "androidVersion": 22,
    "release": "2020-03",
    "capabilities": [
      "a_b_slots",
      "adb",
      "battery_calibration",
      "battery_health_read",
      "display_pwm_test",
      "dynamic_partitions",
      "edl",
      "evidence_capture",
      "fastboot",
      "fastbootd",
      "frp_owner_assisted",
      "network_reset",
      "official_rom_flash",
      "ota",
      "recovery",
      "sim_reset",
      "storage_health_read",
      "thermal_read",
      "touch_grid_test",
      "verified_boot"
    ],
    "riskFlags": [
      "edl_requires_signed_programmer",
      "pre_install_required:needs_specific_android_fw"
    ],
    "verificationGates": [
      {
        "id": "power_on",
        "name": "El equipo enciende y no reinicia en 3 min",
        "kind": "hardware",
        "blocking": true
      },
      {
        "id": "charging",
        "name": "Detecta carga y aumenta el porcentaje",
        "kind": "hardware",
        "blocking": true
      },
      {
        "id": "battery_report",
        "name": "Bateria reporta capacidad real > 60% del diseño",
        "kind": "hardware",
        "blocking": false
      },
      {
        "id": "touch_grid",
        "name": "Rejilla de táctil sin zonas muertas",
        "kind": "sensor",
        "blocking": true
      },
      {
        "id": "display_pwm",
        "name": "Pantalla sin parpadeo anormal / lineas",
        "kind": "display",
        "blocking": true
      },
      {
        "id": "audio_path",
        "name": "Altavoz, auricular y microfonos responden",
        "kind": "audio",
        "blocking": true
      },
      {
        "id": "cameras",
        "name": "Todas las camaras abren imagen",
        "kind": "camera",
        "blocking": true
      },
      {
        "id": "sensors",
        "name": "Proximidad, huella y giroscopio responden",
        "kind": "sensor",
        "blocking": false
      },
      {
        "id": "network_register",
        "name": "Registra en la red destino (SIM Telcel/AT&T/Movistar)",
        "kind": "network",
        "blocking": true
      },
      {
        "id": "data_browse",
        "name": "Abre internet y resuelve DNS",
        "kind": "network",
        "blocking": true
      },
      {
        "id": "call_voicemail",
        "kind": "network",
        "blocking": false,
        "name": "Llamada / mensaje saliente"
      },
      {
        "id": "gms",
        "name": "Play Servicios y apps base abren",
        "kind": "software",
        "blocking": false
      },
      {
        "id": "ota",
        "name": "Acepta(actualizar) sin error",
        "kind": "software",
        "blocking": false
      },
      {
        "id": "radio_ident",
        "kind": "radio",
        "blocking": true,
        "name": "IMEI/ESN intactos y sin cambios"
      },
      {
        "id": "slot_health",
        "kind": "bootchain",
        "blocking": false,
        "name": "Ambos slots sanables (A/B activo y no corrupto)"
      },
      {
        "id": "verified_boot_state",
        "kind": "bootchain",
        "blocking": false,
        "name": "Estado de boot verificado sin alteraciones"
      }
    ],
    "sources": [
      "lineageos",
      "seed",
      "play"
    ]
  },
{
    "codename": "discovery",
    "variant": null,
    "key": "discovery",
    "marketingName": "Xperia XA2 Ultra",
    "vendor": "Sony",
    "soc": "Qualcomm SDM630 Snapdragon 630",
    "socVendor": "qualcomm",
    "platform": "sdm660",
    "modelNumbers": [
      "H3213",
      "H4213",
      "H4233",
      "H3223"
    ],
    "androidVersion": 22,
    "release": "2018-02",
    "capabilities": [
      "a_b_slots",
      "adb",
      "battery_calibration",
      "battery_health_read",
      "display_pwm_test",
      "dynamic_partitions",
      "edl",
      "evidence_capture",
      "fastboot",
      "fastbootd",
      "frp_owner_assisted",
      "network_reset",
      "official_rom_flash",
      "ota",
      "recovery",
      "sim_reset",
      "storage_health_read",
      "thermal_read",
      "touch_grid_test",
      "verified_boot"
    ],
    "riskFlags": [
      "edl_requires_signed_programmer",
      "pre_install_required:needs_specific_android_fw",
      "recovery_flash_target_is:boot"
    ],
    "verificationGates": [
      {
        "id": "power_on",
        "name": "El equipo enciende y no reinicia en 3 min",
        "kind": "hardware",
        "blocking": true
      },
      {
        "id": "charging",
        "name": "Detecta carga y aumenta el porcentaje",
        "kind": "hardware",
        "blocking": true
      },
      {
        "id": "battery_report",
        "name": "Bateria reporta capacidad real > 60% del diseño",
        "kind": "hardware",
        "blocking": false
      },
      {
        "id": "touch_grid",
        "name": "Rejilla de táctil sin zonas muertas",
        "kind": "sensor",
        "blocking": true
      },
      {
        "id": "display_pwm",
        "name": "Pantalla sin parpadeo anormal / lineas",
        "kind": "display",
        "blocking": true
      },
      {
        "id": "audio_path",
        "name": "Altavoz, auricular y microfonos responden",
        "kind": "audio",
        "blocking": true
      },
      {
        "id": "cameras",
        "name": "Todas las camaras abren imagen",
        "kind": "camera",
        "blocking": true
      },
      {
        "id": "sensors",
        "name": "Proximidad, huella y giroscopio responden",
        "kind": "sensor",
        "blocking": false
      },
      {
        "id": "network_register",
        "name": "Registra en la red destino (SIM Telcel/AT&T/Movistar)",
        "kind": "network",
        "blocking": true
      },
      {
        "id": "data_browse",
        "name": "Abre internet y resuelve DNS",
        "kind": "network",
        "blocking": true
      },
      {
        "id": "call_voicemail",
        "kind": "network",
        "blocking": false,
        "name": "Llamada / mensaje saliente"
      },
      {
        "id": "gms",
        "name": "Play Servicios y apps base abren",
        "kind": "software",
        "blocking": false
      },
      {
        "id": "ota",
        "name": "Acepta(actualizar) sin error",
        "kind": "software",
        "blocking": false
      },
      {
        "id": "radio_ident",
        "kind": "radio",
        "blocking": true,
        "name": "IMEI/ESN intactos y sin cambios"
      },
      {
        "id": "slot_health",
        "kind": "bootchain",
        "blocking": false,
        "name": "Ambos slots sanables (A/B activo y no corrupto)"
      },
      {
        "id": "verified_boot_state",
        "kind": "bootchain",
        "blocking": false,
        "name": "Estado de boot verificado sin alteraciones"
      }
    ],
    "sources": [
      "lineageos",
      "seed",
      "play"
    ]
  },
{
    "codename": "x2",
    "variant": null,
    "key": "x2",
    "marketingName": "Le Max2",
    "vendor": "LeEco",
    "soc": "Qualcomm MSM8996 Snapdragon 820",
    "socVendor": "qualcomm",
    "platform": "msm8996",
    "modelNumbers": [
      "LEX820",
      "LEX821",
      "LEX822",
      "LEX829"
    ],
    "androidVersion": 17,
    "release": "2016-04",
    "capabilities": [
      "a_only",
      "adb",
      "battery_calibration",
      "battery_health_read",
      "display_pwm_test",
      "dynamic_partitions",
      "edl",
      "evidence_capture",
      "fastboot",
      "fastbootd",
      "frp_owner_assisted",
      "network_reset",
      "official_rom_flash",
      "ota",
      "recovery",
      "sim_reset",
      "storage_health_read",
      "thermal_read",
      "touch_grid_test",
      "unlock_official",
      "verified_boot"
    ],
    "riskFlags": [
      "edl_requires_signed_programmer"
    ],
    "verificationGates": [
      {
        "id": "power_on",
        "name": "El equipo enciende y no reinicia en 3 min",
        "kind": "hardware",
        "blocking": true
      },
      {
        "id": "charging",
        "name": "Detecta carga y aumenta el porcentaje",
        "kind": "hardware",
        "blocking": true
      },
      {
        "id": "battery_report",
        "name": "Bateria reporta capacidad real > 60% del diseño",
        "kind": "hardware",
        "blocking": false
      },
      {
        "id": "touch_grid",
        "name": "Rejilla de táctil sin zonas muertas",
        "kind": "sensor",
        "blocking": true
      },
      {
        "id": "display_pwm",
        "name": "Pantalla sin parpadeo anormal / lineas",
        "kind": "display",
        "blocking": true
      },
      {
        "id": "audio_path",
        "name": "Altavoz, auricular y microfonos responden",
        "kind": "audio",
        "blocking": true
      },
      {
        "id": "cameras",
        "name": "Todas las camaras abren imagen",
        "kind": "camera",
        "blocking": true
      },
      {
        "id": "sensors",
        "name": "Proximidad, huella y giroscopio responden",
        "kind": "sensor",
        "blocking": false
      },
      {
        "id": "network_register",
        "name": "Registra en la red destino (SIM Telcel/AT&T/Movistar)",
        "kind": "network",
        "blocking": true
      },
      {
        "id": "data_browse",
        "name": "Abre internet y resuelve DNS",
        "kind": "network",
        "blocking": true
      },
      {
        "id": "call_voicemail",
        "kind": "network",
        "blocking": false,
        "name": "Llamada / mensaje saliente"
      },
      {
        "id": "gms",
        "name": "Play Servicios y apps base abren",
        "kind": "software",
        "blocking": false
      },
      {
        "id": "ota",
        "name": "Acepta(actualizar) sin error",
        "kind": "software",
        "blocking": false
      },
      {
        "id": "radio_ident",
        "kind": "radio",
        "blocking": true,
        "name": "IMEI/ESN intactos y sin cambios"
      },
      {
        "id": "verified_boot_state",
        "kind": "bootchain",
        "blocking": false,
        "name": "Estado de boot verificado sin alteraciones"
      }
    ],
    "sources": [
      "lineageos",
      "seed",
      "play"
    ]
  },
{
    "codename": "s2",
    "variant": null,
    "key": "s2",
    "marketingName": "Le 2",
    "vendor": "LeEco",
    "soc": "Qualcomm MSM8976 Snapdragon 652",
    "socVendor": "qualcomm",
    "platform": "msm8976",
    "modelNumbers": [
      "X520",
      "X522",
      "X526",
      "X527"
    ],
    "androidVersion": 16,
    "release": "2016-04",
    "capabilities": [
      "a_only",
      "adb",
      "battery_calibration",
      "battery_health_read",
      "display_pwm_test",
      "dynamic_partitions",
      "edl",
      "evidence_capture",
      "fastboot",
      "fastbootd",
      "frp_owner_assisted",
      "network_reset",
      "official_rom_flash",
      "ota",
      "recovery",
      "sim_reset",
      "storage_health_read",
      "thermal_read",
      "touch_grid_test",
      "unlock_official",
      "verified_boot"
    ],
    "riskFlags": [
      "edl_requires_signed_programmer"
    ],
    "verificationGates": [
      {
        "id": "power_on",
        "name": "El equipo enciende y no reinicia en 3 min",
        "kind": "hardware",
        "blocking": true
      },
      {
        "id": "charging",
        "name": "Detecta carga y aumenta el porcentaje",
        "kind": "hardware",
        "blocking": true
      },
      {
        "id": "battery_report",
        "name": "Bateria reporta capacidad real > 60% del diseño",
        "kind": "hardware",
        "blocking": false
      },
      {
        "id": "touch_grid",
        "name": "Rejilla de táctil sin zonas muertas",
        "kind": "sensor",
        "blocking": true
      },
      {
        "id": "display_pwm",
        "name": "Pantalla sin parpadeo anormal / lineas",
        "kind": "display",
        "blocking": true
      },
      {
        "id": "audio_path",
        "name": "Altavoz, auricular y microfonos responden",
        "kind": "audio",
        "blocking": true
      },
      {
        "id": "cameras",
        "name": "Todas las camaras abren imagen",
        "kind": "camera",
        "blocking": true
      },
      {
        "id": "sensors",
        "name": "Proximidad, huella y giroscopio responden",
        "kind": "sensor",
        "blocking": false
      },
      {
        "id": "network_register",
        "name": "Registra en la red destino (SIM Telcel/AT&T/Movistar)",
        "kind": "network",
        "blocking": true
      },
      {
        "id": "data_browse",
        "name": "Abre internet y resuelve DNS",
        "kind": "network",
        "blocking": true
      },
      {
        "id": "call_voicemail",
        "kind": "network",
        "blocking": false,
        "name": "Llamada / mensaje saliente"
      },
      {
        "id": "gms",
        "name": "Play Servicios y apps base abren",
        "kind": "software",
        "blocking": false
      },
      {
        "id": "ota",
        "name": "Acepta(actualizar) sin error",
        "kind": "software",
        "blocking": false
      },
      {
        "id": "radio_ident",
        "kind": "radio",
        "blocking": true,
        "name": "IMEI/ESN intactos y sin cambios"
      },
      {
        "id": "verified_boot_state",
        "kind": "bootchain",
        "blocking": false,
        "name": "Estado de boot verificado sin alteraciones"
      }
    ],
    "sources": [
      "lineageos",
      "seed",
      "play"
    ]
  },
{
    "codename": "B2N",
    "variant": null,
    "key": "B2N",
    "marketingName": "7 plus",
    "vendor": "Nokia",
    "soc": "Qualcomm SDM660 Snapdragon 660",
    "socVendor": "qualcomm",
    "platform": "sdm660",
    "modelNumbers": [
      "TA-1041",
      "TA-1062",
      "TA-1046"
    ],
    "androidVersion": 21,
    "release": "2018-04-30",
    "capabilities": [
      "a_b_slots",
      "adb",
      "battery_calibration",
      "battery_health_read",
      "display_pwm_test",
      "dynamic_partitions",
      "edl",
      "evidence_capture",
      "fastboot",
      "fastbootd",
      "frp_owner_assisted",
      "network_reset",
      "official_rom_flash",
      "ota",
      "recovery",
      "sim_reset",
      "storage_health_read",
      "thermal_read",
      "touch_grid_test",
      "verified_boot"
    ],
    "riskFlags": [
      "edl_requires_signed_programmer",
      "pre_install_required:needs_specific_android_fw",
      "recovery_flash_target_is:boot"
    ],
    "verificationGates": [
      {
        "id": "power_on",
        "name": "El equipo enciende y no reinicia en 3 min",
        "kind": "hardware",
        "blocking": true
      },
      {
        "id": "charging",
        "name": "Detecta carga y aumenta el porcentaje",
        "kind": "hardware",
        "blocking": true
      },
      {
        "id": "battery_report",
        "name": "Bateria reporta capacidad real > 60% del diseño",
        "kind": "hardware",
        "blocking": false
      },
      {
        "id": "touch_grid",
        "name": "Rejilla de táctil sin zonas muertas",
        "kind": "sensor",
        "blocking": true
      },
      {
        "id": "display_pwm",
        "name": "Pantalla sin parpadeo anormal / lineas",
        "kind": "display",
        "blocking": true
      },
      {
        "id": "audio_path",
        "name": "Altavoz, auricular y microfonos responden",
        "kind": "audio",
        "blocking": true
      },
      {
        "id": "cameras",
        "name": "Todas las camaras abren imagen",
        "kind": "camera",
        "blocking": true
      },
      {
        "id": "sensors",
        "name": "Proximidad, huella y giroscopio responden",
        "kind": "sensor",
        "blocking": false
      },
      {
        "id": "network_register",
        "name": "Registra en la red destino (SIM Telcel/AT&T/Movistar)",
        "kind": "network",
        "blocking": true
      },
      {
        "id": "data_browse",
        "name": "Abre internet y resuelve DNS",
        "kind": "network",
        "blocking": true
      },
      {
        "id": "call_voicemail",
        "kind": "network",
        "blocking": false,
        "name": "Llamada / mensaje saliente"
      },
      {
        "id": "gms",
        "name": "Play Servicios y apps base abren",
        "kind": "software",
        "blocking": false
      },
      {
        "id": "ota",
        "name": "Acepta(actualizar) sin error",
        "kind": "software",
        "blocking": false
      },
      {
        "id": "radio_ident",
        "kind": "radio",
        "blocking": true,
        "name": "IMEI/ESN intactos y sin cambios"
      },
      {
        "id": "slot_health",
        "kind": "bootchain",
        "blocking": false,
        "name": "Ambos slots sanables (A/B activo y no corrupto)"
      },
      {
        "id": "verified_boot_state",
        "kind": "bootchain",
        "blocking": false,
        "name": "Estado de boot verificado sin alteraciones"
      }
    ],
    "sources": [
      "lineageos",
      "seed",
      "play"
    ]
  },
{
    "codename": "NB1",
    "variant": null,
    "key": "NB1",
    "marketingName": "8",
    "vendor": "Nokia",
    "soc": "Qualcomm MSM8998 Snapdragon 835",
    "socVendor": "qualcomm",
    "platform": "msm8998",
    "modelNumbers": [
      "TA-1004",
      "TA-1012",
      "TA-1052"
    ],
    "androidVersion": 21,
    "release": "2017-08-16",
    "capabilities": [
      "a_b_slots",
      "adb",
      "battery_calibration",
      "battery_health_read",
      "display_pwm_test",
      "dynamic_partitions",
      "edl",
      "evidence_capture",
      "fastboot",
      "fastbootd",
      "frp_owner_assisted",
      "network_reset",
      "official_rom_flash",
      "ota",
      "recovery",
      "sim_reset",
      "storage_health_read",
      "thermal_read",
      "touch_grid_test",
      "verified_boot"
    ],
    "riskFlags": [
      "edl_requires_signed_programmer",
      "pre_install_required:needs_specific_android_fw",
      "recovery_flash_target_is:boot"
    ],
    "verificationGates": [
      {
        "id": "power_on",
        "name": "El equipo enciende y no reinicia en 3 min",
        "kind": "hardware",
        "blocking": true
      },
      {
        "id": "charging",
        "name": "Detecta carga y aumenta el porcentaje",
        "kind": "hardware",
        "blocking": true
      },
      {
        "id": "battery_report",
        "name": "Bateria reporta capacidad real > 60% del diseño",
        "kind": "hardware",
        "blocking": false
      },
      {
        "id": "touch_grid",
        "name": "Rejilla de táctil sin zonas muertas",
        "kind": "sensor",
        "blocking": true
      },
      {
        "id": "display_pwm",
        "name": "Pantalla sin parpadeo anormal / lineas",
        "kind": "display",
        "blocking": true
      },
      {
        "id": "audio_path",
        "name": "Altavoz, auricular y microfonos responden",
        "kind": "audio",
        "blocking": true
      },
      {
        "id": "cameras",
        "name": "Todas las camaras abren imagen",
        "kind": "camera",
        "blocking": true
      },
      {
        "id": "sensors",
        "name": "Proximidad, huella y giroscopio responden",
        "kind": "sensor",
        "blocking": false
      },
      {
        "id": "network_register",
        "name": "Registra en la red destino (SIM Telcel/AT&T/Movistar)",
        "kind": "network",
        "blocking": true
      },
      {
        "id": "data_browse",
        "name": "Abre internet y resuelve DNS",
        "kind": "network",
        "blocking": true
      },
      {
        "id": "call_voicemail",
        "kind": "network",
        "blocking": false,
        "name": "Llamada / mensaje saliente"
      },
      {
        "id": "gms",
        "name": "Play Servicios y apps base abren",
        "kind": "software",
        "blocking": false
      },
      {
        "id": "ota",
        "name": "Acepta(actualizar) sin error",
        "kind": "software",
        "blocking": false
      },
      {
        "id": "radio_ident",
        "kind": "radio",
        "blocking": true,
        "name": "IMEI/ESN intactos y sin cambios"
      },
      {
        "id": "slot_health",
        "kind": "bootchain",
        "blocking": false,
        "name": "Ambos slots sanables (A/B activo y no corrupto)"
      },
      {
        "id": "verified_boot_state",
        "kind": "bootchain",
        "blocking": false,
        "name": "Estado de boot verificado sin alteraciones"
      }
    ],
    "sources": [
      "lineageos",
      "seed",
      "play"
    ]
  }
];
