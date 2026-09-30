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
 * La app de escritorio abre el SQLite completo: 763 variantes, 14 MB. El
 * navegador no puede abrir un SQLite sin WASM, asi que la demo web carga este
 * recorte de 48 variantes.
 * Los datos son REALES: si la app dice "Exynos 1380" es porque el catalogo lo
 * dice, no porque alguien lo escribio a mano.
 *
 * El recorte es por ESTRATOS con cupos fijos, no "los 48 con mejor puntaje".
 * Un puntaje global produce casi siempre un solo estrato, y una demo que solo
 * muestra un caso no muestra nada:
 *
 *   hasta 12     codename con varias variantes de placa, y se mete el grupo
 *   ambiguas     COMPLETO: la herramienta NO elige por el tecnico, que es la
 *                promesa central. Se cuenta por codename y no por filas,
 *                porque la ambiguedad es del grupo: una fila sola de un
 *                codename de cuatro placas no es ambigua, es un acierto.
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
    "vendor": "motorola",
    "vendorNombre": "Motorola",
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
      "play",
      "ift"
    ],
    "homologadoIft": "sin_verificar",
    "iftCertificado": "",
    "iftUrl": "",
    "receta": {
      "metodo": "fastboot_custom",
      "desbloqueo": null,
      "particionRecovery": "vendor_boot",
      "comboRecovery": "With the device powered off, hold Volume Up + Power.",
      "comboDescarga": "With the device powered off, hold Volume Down + Power. Keep holding both buttons until the text \"FastBoot Mode\" appears on the screen, then release.",
      "modoDescarga": "BROM 0E8D:0000 / Preloader 0E8D:0001 (BROM + DA agent)",
      "descargaExigeMaterialFirmado": true,
      "requisitoPrevio": "needs_specific_android_fw",
      "versionRequisito": "15"
    }
  },
  {
    "codename": "Mi439",
    "variant": "1",
    "key": "Mi439#1",
    "marketingName": "Redmi 7A",
    "vendor": "xiaomi",
    "vendorNombre": "Xiaomi",
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
      "seed",
      "ift"
    ],
    "homologadoIft": "desconocido",
    "iftCertificado": "",
    "iftUrl": "",
    "receta": {
      "metodo": "fastboot_xiaomi",
      "desbloqueo": null,
      "particionRecovery": "recovery",
      "comboRecovery": "With the device powered off, hold Volume Up + Power. When the screen lights up, release the buttons.",
      "comboDescarga": "With the device powered off, hold Volume Down + Power.",
      "modoDescarga": "EDL 900E / 9008 (Sahara + Firehose XML)",
      "descargaExigeMaterialFirmado": true,
      "requisitoPrevio": "needs_specific_android_fw",
      "versionRequisito": "10"
    }
  },
  {
    "codename": "evert",
    "variant": null,
    "key": "evert",
    "marketingName": "moto g6 plus",
    "vendor": "motorola",
    "vendorNombre": "Motorola",
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
      "play",
      "ift"
    ],
    "homologadoIft": "sin_verificar",
    "iftCertificado": "",
    "iftUrl": "",
    "receta": {
      "metodo": "fastboot_motorola",
      "desbloqueo": null,
      "particionRecovery": "boot",
      "comboRecovery": "With the device powered off, hold Volume Down + Power, then select \"Recovery mode\" using Volume keys.",
      "comboDescarga": "With the device powered off, hold Volume Down + Power.",
      "modoDescarga": "EDL 900E / 9008 (Sahara + Firehose XML)",
      "descargaExigeMaterialFirmado": true,
      "requisitoPrevio": "needs_specific_android_fw",
      "versionRequisito": "9"
    }
  },
  {
    "codename": "joan",
    "variant": "3",
    "key": "joan#3",
    "marketingName": "V30 (Other)",
    "vendor": "lg",
    "vendorNombre": "LG",
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
      "play",
      "ift"
    ],
    "homologadoIft": "desconocido",
    "iftCertificado": "",
    "iftUrl": "",
    "receta": {
      "metodo": "dd",
      "desbloqueo": null,
      "particionRecovery": "recovery",
      "comboRecovery": "With the device powered off, hold Volume Down + Power until the LG logo appears, then release Power for a second and hold it again until the recovery comes up.",
      "comboDescarga": "With the device powered off, hold Volume Up + Power.",
      "modoDescarga": "EDL 900E / 9008 (Sahara + Firehose XML)",
      "descargaExigeMaterialFirmado": true,
      "requisitoPrevio": "needs_specific_android_fw",
      "versionRequisito": "9.0"
    }
  },
  {
    "codename": "judypn",
    "variant": null,
    "key": "judypn",
    "marketingName": "V40 ThinQ",
    "vendor": "lg",
    "vendorNombre": "LG",
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
      "play",
      "ift"
    ],
    "homologadoIft": "desconocido",
    "iftCertificado": "",
    "iftUrl": "",
    "receta": {
      "metodo": "dd",
      "desbloqueo": null,
      "particionRecovery": "boot",
      "comboRecovery": "With the device powered off, hold Volume Down + Power until the LG logo appears, then release Power for a second and hold it again until the recovery comes up.",
      "comboDescarga": "With the device powered off, hold Volume Up, then connect a USB cable.",
      "modoDescarga": "EDL 900E / 9008 (Sahara + Firehose XML)",
      "descargaExigeMaterialFirmado": true,
      "requisitoPrevio": "needs_specific_android_fw",
      "versionRequisito": "10"
    }
  },
  {
    "codename": "nash",
    "variant": "1",
    "key": "nash#1",
    "marketingName": "moto z2 force",
    "vendor": "motorola",
    "vendorNombre": "Motorola",
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
      "ift"
    ],
    "homologadoIft": "sin_verificar",
    "iftCertificado": "",
    "iftUrl": "",
    "receta": {
      "metodo": "fastboot_motorola",
      "desbloqueo": null,
      "particionRecovery": "boot",
      "comboRecovery": "With the device powered off, hold Volume Down + Power.",
      "comboDescarga": "With the device powered off, hold Volume Down + Power.",
      "modoDescarga": "EDL 900E / 9008 (Sahara + Firehose XML)",
      "descargaExigeMaterialFirmado": true,
      "requisitoPrevio": "nash",
      "versionRequisito": null
    }
  },
  {
    "codename": "nash",
    "variant": "2",
    "key": "nash#2",
    "marketingName": "moto z (2018)",
    "vendor": "motorola",
    "vendorNombre": "Motorola",
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
      "play",
      "ift"
    ],
    "homologadoIft": "sin_verificar",
    "iftCertificado": "",
    "iftUrl": "",
    "receta": {
      "metodo": "fastboot_motorola",
      "desbloqueo": null,
      "particionRecovery": "boot",
      "comboRecovery": "With the device powered off, hold Volume Down + Power.",
      "comboDescarga": "With the device powered off, hold Volume Down + Power.",
      "modoDescarga": "EDL 900E / 9008 (Sahara + Firehose XML)",
      "descargaExigeMaterialFirmado": true,
      "requisitoPrevio": "nash",
      "versionRequisito": null
    }
  },
  {
    "codename": "payton",
    "variant": null,
    "key": "payton",
    "marketingName": "moto x4",
    "vendor": "motorola",
    "vendorNombre": "Motorola",
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
      "play",
      "ift"
    ],
    "homologadoIft": "sin_verificar",
    "iftCertificado": "",
    "iftUrl": "",
    "receta": {
      "metodo": "fastboot_motorola",
      "desbloqueo": null,
      "particionRecovery": "boot",
      "comboRecovery": "With the device powered off, hold Volume Down + Power, then select \"Recovery mode\" using Volume keys.",
      "comboDescarga": "With the device powered off, hold Volume Down + Power.",
      "modoDescarga": "EDL 900E / 9008 (Sahara + Firehose XML)",
      "descargaExigeMaterialFirmado": true,
      "requisitoPrevio": "needs_specific_android_fw",
      "versionRequisito": "9"
    }
  },
  {
    "codename": "a5y17lte",
    "variant": null,
    "key": "a5y17lte",
    "marketingName": "Galaxy A5 (2017)",
    "vendor": "samsung",
    "vendorNombre": "Samsung",
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
      "play",
      "ift"
    ],
    "homologadoIft": "desconocido",
    "iftCertificado": "",
    "iftUrl": "",
    "receta": {
      "metodo": "samloader_rs",
      "desbloqueo": null,
      "particionRecovery": "recovery",
      "comboRecovery": "With the device powered off, hold Volume Up + Home + Power.",
      "comboDescarga": "With the device powered off, hold Volume Down + Home + Power.",
      "modoDescarga": "Samsung Download mode 04E8:6600 / 685D (Odin-style protocol)",
      "descargaExigeMaterialFirmado": true,
      "requisitoPrevio": "needs_specific_android_fw",
      "versionRequisito": "8.0"
    }
  },
  {
    "codename": "albus",
    "variant": null,
    "key": "albus",
    "marketingName": "moto z2 play",
    "vendor": "motorola",
    "vendorNombre": "Motorola",
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
      "play",
      "ift"
    ],
    "homologadoIft": "sin_verificar",
    "iftCertificado": "",
    "iftUrl": "",
    "receta": {
      "metodo": "fastboot_motorola",
      "desbloqueo": null,
      "particionRecovery": "recovery",
      "comboRecovery": "With the device powered off, hold Volume Up + Power.",
      "comboDescarga": "With the device powered off, hold Volume Down + Power.",
      "modoDescarga": "EDL 900E / 9008 (Sahara + Firehose XML)",
      "descargaExigeMaterialFirmado": true,
      "requisitoPrevio": null,
      "versionRequisito": null
    }
  },
  {
    "codename": "cedric",
    "variant": null,
    "key": "cedric",
    "marketingName": "moto g5",
    "vendor": "motorola",
    "vendorNombre": "Motorola",
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
      "play",
      "ift"
    ],
    "homologadoIft": "sin_verificar",
    "iftCertificado": "",
    "iftUrl": "",
    "receta": {
      "metodo": "fastboot_motorola",
      "desbloqueo": null,
      "particionRecovery": "recovery",
      "comboRecovery": "With the device powered off, hold Volume Down + Power, then select \"Recovery mode\" using Volume keys.",
      "comboDescarga": "With the device powered off, hold Volume Down + Power.",
      "modoDescarga": "EDL 900E / 9008 (Sahara + Firehose XML)",
      "descargaExigeMaterialFirmado": true,
      "requisitoPrevio": "needs_specific_android_fw",
      "versionRequisito": "8.1"
    }
  },
  {
    "codename": "klte",
    "variant": null,
    "key": "klte",
    "marketingName": "Galaxy S5 LTE (G900F/M/R4/R7/T/T3/V/W8)",
    "vendor": "samsung",
    "vendorNombre": "Samsung",
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
      "play",
      "ift"
    ],
    "homologadoIft": "desconocido",
    "iftCertificado": "",
    "iftUrl": "",
    "receta": {
      "metodo": "samloader_rs",
      "desbloqueo": null,
      "particionRecovery": "recovery",
      "comboRecovery": "With the device powered off, hold Volume Up + Home + Power. When the blue text appears, release the buttons.",
      "comboDescarga": "With the device powered off, hold Volume Down + Home + Power.",
      "modoDescarga": "EDL 900E / 9008 (Sahara + Firehose XML)",
      "descargaExigeMaterialFirmado": true,
      "requisitoPrevio": "needs_specific_android_fw",
      "versionRequisito": "6.0.1"
    }
  },
  {
    "codename": "montana",
    "variant": null,
    "key": "montana",
    "marketingName": "moto g5s",
    "vendor": "motorola",
    "vendorNombre": "Motorola",
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
      "play",
      "ift"
    ],
    "homologadoIft": "sin_verificar",
    "iftCertificado": "",
    "iftUrl": "",
    "receta": {
      "metodo": "fastboot_motorola",
      "desbloqueo": null,
      "particionRecovery": "recovery",
      "comboRecovery": "With the device powered off, hold Volume Down + Power, then select \"Recovery mode\" using Volume keys.",
      "comboDescarga": "With the device powered off, hold Volume Down + Power.",
      "modoDescarga": "EDL 900E / 9008 (Sahara + Firehose XML)",
      "descargaExigeMaterialFirmado": true,
      "requisitoPrevio": "needs_specific_android_fw",
      "versionRequisito": "8.1"
    }
  },
  {
    "codename": "victara",
    "variant": null,
    "key": "victara",
    "marketingName": "moto x (2014)",
    "vendor": "motorola",
    "vendorNombre": "Motorola",
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
      "play",
      "ift"
    ],
    "homologadoIft": "sin_verificar",
    "iftCertificado": "",
    "iftUrl": "",
    "receta": {
      "metodo": "fastboot_motorola",
      "desbloqueo": null,
      "particionRecovery": "recovery",
      "comboRecovery": "With the device powered off, hold Volume Down + Power. On the next screen use Volume Down to scroll to Recovery and then press Volume Up to select.",
      "comboDescarga": "With the device powered off, hold Volume Down + Power.",
      "modoDescarga": "EDL 900E / 9008 (Sahara + Firehose XML)",
      "descargaExigeMaterialFirmado": true,
      "requisitoPrevio": null,
      "versionRequisito": null
    }
  },
  {
    "codename": "a7xelte",
    "variant": null,
    "key": "a7xelte",
    "marketingName": "Galaxy A7 (2016)",
    "vendor": "samsung",
    "vendorNombre": "Samsung",
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
      "play",
      "ift"
    ],
    "homologadoIft": "desconocido",
    "iftCertificado": "",
    "iftUrl": "",
    "receta": {
      "metodo": "samloader_rs",
      "desbloqueo": null,
      "particionRecovery": "recovery",
      "comboRecovery": "With the device powered off, hold Volume Up + Home + Power.",
      "comboDescarga": "With the device powered off, hold Volume Down + Home + Power.",
      "modoDescarga": "Samsung Download mode 04E8:6600 / 685D (Odin-style protocol)",
      "descargaExigeMaterialFirmado": true,
      "requisitoPrevio": null,
      "versionRequisito": null
    }
  },
  {
    "codename": "harpia",
    "variant": null,
    "key": "harpia",
    "marketingName": "moto g4 play",
    "vendor": "motorola",
    "vendorNombre": "Motorola",
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
      "play",
      "ift"
    ],
    "homologadoIft": "sin_verificar",
    "iftCertificado": "",
    "iftUrl": "",
    "receta": {
      "metodo": "fastboot_motorola",
      "desbloqueo": null,
      "particionRecovery": "recovery",
      "comboRecovery": "With the device powered off, hold Volume Down + Power. On the next screen use Volume Down to scroll to recovery and then press Power to select.",
      "comboDescarga": "With the device powered off, hold Volume Down + Power.",
      "modoDescarga": "EDL 900E / 9008 (Sahara + Firehose XML)",
      "descargaExigeMaterialFirmado": true,
      "requisitoPrevio": "needs_specific_android_fw",
      "versionRequisito": "7.1.1"
    }
  },
  {
    "codename": "kiwi",
    "variant": null,
    "key": "kiwi",
    "marketingName": "Honor 5X",
    "vendor": "huawei",
    "vendorNombre": "Huawei",
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
      "play",
      "ift"
    ],
    "homologadoIft": "desconocido",
    "iftCertificado": "",
    "iftUrl": "",
    "receta": {
      "metodo": "fastboot_huawei",
      "desbloqueo": null,
      "particionRecovery": "recovery",
      "comboRecovery": "With the device powered off, hold Volume Up + Power. Keep holding buttons until the \"Honor\" logo appears, then release all buttons.",
      "comboDescarga": "With the device powered off, hold Volume Down + Power. Keep holding buttons until the \"Honor\" logo appears, then release all buttons.",
      "modoDescarga": "EDL 900E / 9008 (Sahara + Firehose XML)",
      "descargaExigeMaterialFirmado": true,
      "requisitoPrevio": null,
      "versionRequisito": null
    }
  },
  {
    "codename": "osprey",
    "variant": null,
    "key": "osprey",
    "marketingName": "moto g (2015)",
    "vendor": "motorola",
    "vendorNombre": "Motorola",
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
      "seed",
      "ift"
    ],
    "homologadoIft": "sin_verificar",
    "iftCertificado": "",
    "iftUrl": "",
    "receta": {
      "metodo": "fastboot_motorola",
      "desbloqueo": null,
      "particionRecovery": "recovery",
      "comboRecovery": "With the device powered off, hold Volume Down + Power. On the next screen use Volume Down to scroll to recovery and then press Power to select.",
      "comboDescarga": "With the device powered off, hold Volume Down + Power. On the next screen use Volume Down and Volume Up to scroll and then press Power to select.",
      "modoDescarga": "EDL 900E / 9008 (Sahara + Firehose XML)",
      "descargaExigeMaterialFirmado": true,
      "requisitoPrevio": "needs_specific_android_fw",
      "versionRequisito": "6.0.1"
    }
  },
  {
    "codename": "surnia",
    "variant": null,
    "key": "surnia",
    "marketingName": "moto e LTE (2015)",
    "vendor": "motorola",
    "vendorNombre": "Motorola",
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
      "play",
      "ift"
    ],
    "homologadoIft": "sin_verificar",
    "iftCertificado": "",
    "iftUrl": "",
    "receta": {
      "metodo": "fastboot_motorola",
      "desbloqueo": null,
      "particionRecovery": "recovery",
      "comboRecovery": "With the device powered off, hold Volume Down + Power. On the next screen use Volume Down to scroll to recovery and then press Volume Up to select.",
      "comboDescarga": "With the device powered off, hold Volume Down + Power. On the next screen use Volume Down to scroll and then press Volume Up to select.",
      "modoDescarga": "EDL 900E / 9008 (Sahara + Firehose XML)",
      "descargaExigeMaterialFirmado": true,
      "requisitoPrevio": "needs_specific_android_fw",
      "versionRequisito": "6.0"
    }
  },
  {
    "codename": "pa1q",
    "variant": null,
    "key": "pa1q",
    "marketingName": "Galaxy S25",
    "vendor": "samsung",
    "vendorNombre": "Samsung",
    "soc": "Qualcomm SM8750 Snapdragon 8 Elite",
    "socVendor": "qualcomm",
    "platform": null,
    "modelNumbers": [
      "SM-S9310",
      "SM-S931B",
      "SM-S931B/DS",
      "SM-S931N",
      "SM-S931Q",
      "SM-S931U",
      "SM-S931U1",
      "SM-S931W",
      "SM-S931Z"
    ],
    "androidVersion": 15,
    "release": "2025-02-07",
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
      "manual",
      "seed",
      "ift"
    ],
    "homologadoIft": "desconocido",
    "iftCertificado": "",
    "iftUrl": "",
    "receta": {
      "metodo": null,
      "desbloqueo": null,
      "particionRecovery": null,
      "comboRecovery": null,
      "comboDescarga": null,
      "modoDescarga": "EDL 900E / 9008 (Sahara + Firehose XML)",
      "descargaExigeMaterialFirmado": true,
      "requisitoPrevio": null,
      "versionRequisito": null
    }
  },
  {
    "codename": "pa3q",
    "variant": null,
    "key": "pa3q",
    "marketingName": "Galaxy S25 Ultra",
    "vendor": "samsung",
    "vendorNombre": "Samsung",
    "soc": "Qualcomm SM8750 Snapdragon 8 Elite",
    "socVendor": "qualcomm",
    "platform": null,
    "modelNumbers": [
      "SM-S9380",
      "SM-S938B",
      "SM-S938B/DS",
      "SM-S938N",
      "SM-S938Q",
      "SM-S938U",
      "SM-S938U1",
      "SM-S938W",
      "SM-S938Z"
    ],
    "androidVersion": 15,
    "release": "2025-02-07",
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
      "manual",
      "seed",
      "ift"
    ],
    "homologadoIft": "desconocido",
    "iftCertificado": "",
    "iftUrl": "",
    "receta": {
      "metodo": null,
      "desbloqueo": null,
      "particionRecovery": null,
      "comboRecovery": null,
      "comboDescarga": null,
      "modoDescarga": "EDL 900E / 9008 (Sahara + Firehose XML)",
      "descargaExigeMaterialFirmado": true,
      "requisitoPrevio": null,
      "versionRequisito": null
    }
  },
  {
    "codename": "e3q",
    "variant": null,
    "key": "e3q",
    "marketingName": "Galaxy S24 Ultra",
    "vendor": "samsung",
    "vendorNombre": "Samsung",
    "soc": "Qualcomm SM8650 Snapdragon 8 Gen 3",
    "socVendor": "qualcomm",
    "platform": null,
    "modelNumbers": [
      "SM-S9280",
      "SM-S928B",
      "SM-S928B/DS",
      "SM-S928N",
      "SM-S928Q",
      "SM-S928U",
      "SM-S928U1",
      "SM-S928W"
    ],
    "androidVersion": 14,
    "release": "2024-01-31",
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
      "manual",
      "seed",
      "ift"
    ],
    "homologadoIft": "desconocido",
    "iftCertificado": "",
    "iftUrl": "",
    "receta": {
      "metodo": null,
      "desbloqueo": null,
      "particionRecovery": null,
      "comboRecovery": null,
      "comboDescarga": null,
      "modoDescarga": "EDL 900E / 9008 (Sahara + Firehose XML)",
      "descargaExigeMaterialFirmado": true,
      "requisitoPrevio": null,
      "versionRequisito": null
    }
  },
  {
    "codename": "a21s",
    "variant": null,
    "key": "a21s",
    "marketingName": "Galaxy A21s",
    "vendor": "samsung",
    "vendorNombre": "Samsung",
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
      "play",
      "ift"
    ],
    "homologadoIft": "desconocido",
    "iftCertificado": "",
    "iftUrl": "",
    "receta": {
      "metodo": "samloader_rs",
      "desbloqueo": null,
      "particionRecovery": "recovery",
      "comboRecovery": "With the device powered off, hold Volume Up + Power while the device is connected to a PC via USB cable.",
      "comboDescarga": "With the device powered off, hold Volume Up + Volume Down then connect USB cable to PC.",
      "modoDescarga": "Samsung Download mode 04E8:6600 / 685D (Odin-style protocol)",
      "descargaExigeMaterialFirmado": true,
      "requisitoPrevio": "needs_specific_android_fw",
      "versionRequisito": "12"
    }
  },
  {
    "codename": "fogos",
    "variant": "1",
    "key": "fogos#1",
    "marketingName": "moto g34 5G",
    "vendor": "motorola",
    "vendorNombre": "Motorola",
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
      "seed",
      "ift"
    ],
    "homologadoIft": "sin_verificar",
    "iftCertificado": "",
    "iftUrl": "",
    "receta": {
      "metodo": "fastboot_motorola",
      "desbloqueo": null,
      "particionRecovery": "boot",
      "comboRecovery": "With the device powered off, hold Volume Down + Power, then select \"Recovery mode\" using Volume keys.",
      "comboDescarga": "With the device powered off, hold Volume Down + Power.",
      "modoDescarga": "EDL 900E / 9008 (Sahara + Firehose XML)",
      "descargaExigeMaterialFirmado": true,
      "requisitoPrevio": "needs_specific_android_fw",
      "versionRequisito": "14/15"
    }
  },
  {
    "codename": "Mi439",
    "variant": "2",
    "key": "Mi439#2",
    "marketingName": "Redmi 8",
    "vendor": "xiaomi",
    "vendorNombre": "Xiaomi",
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
      "seed",
      "ift"
    ],
    "homologadoIft": "desconocido",
    "iftCertificado": "",
    "iftUrl": "",
    "receta": {
      "metodo": "fastboot_xiaomi",
      "desbloqueo": null,
      "particionRecovery": "recovery",
      "comboRecovery": "With the device powered off, hold Volume Up + Power. When the screen lights up, release the buttons.",
      "comboDescarga": "With the device powered off, hold Volume Down + Power.",
      "modoDescarga": "EDL 900E / 9008 (Sahara + Firehose XML)",
      "descargaExigeMaterialFirmado": true,
      "requisitoPrevio": "needs_specific_android_fw",
      "versionRequisito": "10"
    }
  },
  {
    "codename": "m20lte",
    "variant": null,
    "key": "m20lte",
    "marketingName": "Galaxy M20",
    "vendor": "samsung",
    "vendorNombre": "Samsung",
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
      "play",
      "ift"
    ],
    "homologadoIft": "desconocido",
    "iftCertificado": "",
    "iftUrl": "",
    "receta": {
      "metodo": "samloader_rs",
      "desbloqueo": null,
      "particionRecovery": "recovery",
      "comboRecovery": "With the device powered off, hold Volume Up + Power.",
      "comboDescarga": "With the device powered off, hold Volume Down + Volume Up then connect USB cable to PC.",
      "modoDescarga": "Samsung Download mode 04E8:6600 / 685D (Odin-style protocol)",
      "descargaExigeMaterialFirmado": true,
      "requisitoPrevio": "needs_specific_android_fw",
      "versionRequisito": "10"
    }
  },
  {
    "codename": "rq3q",
    "variant": null,
    "key": "rq3q",
    "marketingName": "Galaxy A54 5G",
    "vendor": "samsung",
    "vendorNombre": "Samsung",
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
      "seed",
      "ift"
    ],
    "homologadoIft": "desconocido",
    "iftCertificado": "",
    "iftUrl": "",
    "receta": {
      "metodo": null,
      "desbloqueo": null,
      "particionRecovery": "recovery",
      "comboRecovery": null,
      "comboDescarga": null,
      "modoDescarga": "Samsung Download mode 04E8:6600 / 685D (Odin-style protocol)",
      "descargaExigeMaterialFirmado": true,
      "requisitoPrevio": null,
      "versionRequisito": null
    }
  },
  {
    "codename": "a52q",
    "variant": null,
    "key": "a52q",
    "marketingName": "Galaxy A52 4G",
    "vendor": "samsung",
    "vendorNombre": "Samsung",
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
      "play",
      "ift"
    ],
    "homologadoIft": "desconocido",
    "iftCertificado": "",
    "iftUrl": "",
    "receta": {
      "metodo": "samloader_rs",
      "desbloqueo": null,
      "particionRecovery": "recovery",
      "comboRecovery": "With the device powered off, hold Volume Up + Power while the device is connected to a PC via USB cable.",
      "comboDescarga": "With the device powered off, hold Volume Up + Volume Down then connect USB cable to PC.",
      "modoDescarga": "EDL 900E / 9008 (Sahara + Firehose XML)",
      "descargaExigeMaterialFirmado": true,
      "requisitoPrevio": "needs_specific_android_fw",
      "versionRequisito": "13/14"
    }
  },
  {
    "codename": "a71",
    "variant": null,
    "key": "a71",
    "marketingName": "Galaxy A71",
    "vendor": "samsung",
    "vendorNombre": "Samsung",
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
      "play",
      "ift"
    ],
    "homologadoIft": "desconocido",
    "iftCertificado": "",
    "iftUrl": "",
    "receta": {
      "metodo": "samloader_rs",
      "desbloqueo": null,
      "particionRecovery": "recovery",
      "comboRecovery": "With the device powered off, hold Volume Up + Power while the device is connected to a PC via USB cable.",
      "comboDescarga": "With the device powered off, hold Volume Up + Volume Down then connect USB cable to PC.",
      "modoDescarga": "EDL 900E / 9008 (Sahara + Firehose XML)",
      "descargaExigeMaterialFirmado": true,
      "requisitoPrevio": "needs_specific_android_fw",
      "versionRequisito": "13"
    }
  },
  {
    "codename": "a72q",
    "variant": null,
    "key": "a72q",
    "marketingName": "Galaxy A72",
    "vendor": "samsung",
    "vendorNombre": "Samsung",
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
      "play",
      "ift"
    ],
    "homologadoIft": "desconocido",
    "iftCertificado": "",
    "iftUrl": "",
    "receta": {
      "metodo": "samloader_rs",
      "desbloqueo": null,
      "particionRecovery": "recovery",
      "comboRecovery": "With the device powered off, hold Volume Up + Power while the device is connected to a PC via USB cable.",
      "comboDescarga": "With the device powered off, hold Volume Up + Volume Down then connect USB cable to PC.",
      "modoDescarga": "EDL 900E / 9008 (Sahara + Firehose XML)",
      "descargaExigeMaterialFirmado": true,
      "requisitoPrevio": "needs_specific_android_fw",
      "versionRequisito": "13/14"
    }
  },
  {
    "codename": "borneo",
    "variant": null,
    "key": "borneo",
    "marketingName": "moto g power 2021",
    "vendor": "motorola",
    "vendorNombre": "Motorola",
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
      "play",
      "ift"
    ],
    "homologadoIft": "sin_verificar",
    "iftCertificado": "",
    "iftUrl": "",
    "receta": {
      "metodo": "fastboot_motorola",
      "desbloqueo": null,
      "particionRecovery": "recovery",
      "comboRecovery": "With the device powered off, hold Volume Down + Power, then select \"Recovery mode\" using Volume keys.",
      "comboDescarga": "With the device powered off, hold Volume Down + Power.",
      "modoDescarga": "EDL 900E / 9008 (Sahara + Firehose XML)",
      "descargaExigeMaterialFirmado": true,
      "requisitoPrevio": "needs_specific_android_fw",
      "versionRequisito": "11"
    }
  },
  {
    "codename": "dodge",
    "variant": null,
    "key": "dodge",
    "marketingName": "13",
    "vendor": "oneplus",
    "vendorNombre": "OnePlus",
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
      "play",
      "ift"
    ],
    "homologadoIft": "desconocido",
    "iftCertificado": "",
    "iftUrl": "",
    "receta": {
      "metodo": "fastboot_nexus",
      "desbloqueo": "fastboot flashing unlock",
      "particionRecovery": "recovery",
      "comboRecovery": null,
      "comboDescarga": "With the device powered off, hold Volume Up + Volume Down + Power.",
      "modoDescarga": "EDL 900E / 9008 (Sahara + Firehose XML)",
      "descargaExigeMaterialFirmado": true,
      "requisitoPrevio": "needs_specific_android_fw",
      "versionRequisito": "15/16"
    }
  },
  {
    "codename": "Mi439",
    "variant": "3",
    "key": "Mi439#3",
    "marketingName": "Redmi 8A",
    "vendor": "xiaomi",
    "vendorNombre": "Xiaomi",
    "soc": "Qualcomm SDM439 Snapdragon 439",
    "socVendor": "qualcomm",
    "platform": "msm8937",
    "modelNumbers": [
      "M1908C3KE",
      "M1908C3KG",
      "M1908C3KH",
      "M1908C3KI"
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
      "seed",
      "ift"
    ],
    "homologadoIft": "desconocido",
    "iftCertificado": "",
    "iftUrl": "",
    "receta": {
      "metodo": "fastboot_xiaomi",
      "desbloqueo": null,
      "particionRecovery": "recovery",
      "comboRecovery": "With the device powered off, hold Volume Up + Power. When the screen lights up, release the buttons.",
      "comboDescarga": "With the device powered off, hold Volume Down + Power.",
      "modoDescarga": "EDL 900E / 9008 (Sahara + Firehose XML)",
      "descargaExigeMaterialFirmado": true,
      "requisitoPrevio": "needs_specific_android_fw",
      "versionRequisito": "10"
    }
  },
  {
    "codename": "a52sxq",
    "variant": null,
    "key": "a52sxq",
    "marketingName": "Galaxy A52s 5G",
    "vendor": "samsung",
    "vendorNombre": "Samsung",
    "soc": "Qualcomm SM7325 Snapdragon 778G 5G",
    "socVendor": "qualcomm",
    "platform": "sm7325",
    "modelNumbers": [
      "SM-A528B",
      "SM-A528N",
      "SM-A528B/DS"
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
      "play",
      "ift"
    ],
    "homologadoIft": "desconocido",
    "iftCertificado": "",
    "iftUrl": "",
    "receta": {
      "metodo": "samloader_rs",
      "desbloqueo": null,
      "particionRecovery": "recovery",
      "comboRecovery": "With the device powered off, hold Volume Up + Power while the device is connected to a PC via USB cable.",
      "comboDescarga": "With the device powered off, hold Volume Up + Volume Down then connect USB cable to PC.",
      "modoDescarga": "EDL 900E / 9008 (Sahara + Firehose XML)",
      "descargaExigeMaterialFirmado": true,
      "requisitoPrevio": "needs_specific_android_fw",
      "versionRequisito": "13/14"
    }
  },
  {
    "codename": "devon",
    "variant": null,
    "key": "devon",
    "marketingName": "moto g32",
    "vendor": "motorola",
    "vendorNombre": "Motorola",
    "soc": "Qualcomm SM6225 Snapdragon 680 4G",
    "socVendor": "qualcomm",
    "platform": "sm6225",
    "modelNumbers": [
      "XT2235-1",
      "XT2235-2",
      "XT2235-3"
    ],
    "androidVersion": 22,
    "release": "2022-08",
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
      "play",
      "ift"
    ],
    "homologadoIft": "homologado",
    "iftCertificado": "RTIMOXT22-3427",
    "iftUrl": "https://www.motorola.com.mx/ift/",
    "receta": {
      "metodo": "fastboot_motorola",
      "desbloqueo": null,
      "particionRecovery": "boot",
      "comboRecovery": "With the device powered off, hold Volume Down + Power, then select \"Recovery mode\" using Volume keys.",
      "comboDescarga": "With the device powered off, hold Volume Down + Power.",
      "modoDescarga": "EDL 900E / 9008 (Sahara + Firehose XML)",
      "descargaExigeMaterialFirmado": true,
      "requisitoPrevio": "needs_specific_android_fw",
      "versionRequisito": "13"
    }
  },
  {
    "codename": "lamu",
    "variant": "1",
    "key": "lamu#1",
    "marketingName": "moto g15",
    "vendor": "motorola",
    "vendorNombre": "Motorola",
    "soc": "Mediatek Helio G81 Extreme",
    "socVendor": "mediatek",
    "platform": "lamu",
    "modelNumbers": [
      "XT2521-2",
      "XT2521-3",
      "XT2521-4"
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
      "ift"
    ],
    "homologadoIft": "sin_verificar",
    "iftCertificado": "",
    "iftUrl": "",
    "receta": {
      "metodo": "fastboot_custom",
      "desbloqueo": null,
      "particionRecovery": "vendor_boot",
      "comboRecovery": "With the device powered off, hold Volume Up + Power.",
      "comboDescarga": "With the device powered off, hold Volume Down + Power. Keep holding both buttons until the text \"FastBoot Mode\" appears on the screen, then release.",
      "modoDescarga": "BROM 0E8D:0000 / Preloader 0E8D:0001 (BROM + DA agent)",
      "descargaExigeMaterialFirmado": true,
      "requisitoPrevio": "needs_specific_android_fw",
      "versionRequisito": "15"
    }
  },
  {
    "codename": "joan",
    "variant": "1",
    "key": "joan#1",
    "marketingName": "V30 (Unlocked)",
    "vendor": "lg",
    "vendorNombre": "LG",
    "soc": "Qualcomm MSM8998 Snapdragon 835",
    "socVendor": "qualcomm",
    "platform": "msm8998",
    "modelNumbers": [
      "H930",
      "H930DS",
      "US998"
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
      "ift"
    ],
    "homologadoIft": "desconocido",
    "iftCertificado": "",
    "iftUrl": "",
    "receta": {
      "metodo": "fastboot_lg",
      "desbloqueo": null,
      "particionRecovery": "recovery",
      "comboRecovery": "With the device powered off, hold Volume Down + Power until the LG logo appears, then release Power for a second and hold it again until the recovery comes up.",
      "comboDescarga": "With the device powered off, hold Volume Up + Power.",
      "modoDescarga": "EDL 900E / 9008 (Sahara + Firehose XML)",
      "descargaExigeMaterialFirmado": true,
      "requisitoPrevio": "needs_specific_android_fw",
      "versionRequisito": "9.0"
    }
  },
  {
    "codename": "e1s",
    "variant": null,
    "key": "e1s",
    "marketingName": "Galaxy S24",
    "vendor": "samsung",
    "vendorNombre": "Samsung",
    "soc": "Samsung Exynos 2400",
    "socVendor": "exynos",
    "platform": null,
    "modelNumbers": [
      "SM-S921B",
      "SM-S921B/DS",
      "SM-S921N"
    ],
    "androidVersion": 14,
    "release": "2024-01-31",
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
      "manual",
      "seed",
      "ift"
    ],
    "homologadoIft": "desconocido",
    "iftCertificado": "",
    "iftUrl": "",
    "receta": {
      "metodo": null,
      "desbloqueo": null,
      "particionRecovery": null,
      "comboRecovery": null,
      "comboDescarga": null,
      "modoDescarga": "Samsung Download mode 04E8:6600 / 685D (Odin-style protocol)",
      "descargaExigeMaterialFirmado": true,
      "requisitoPrevio": null,
      "versionRequisito": null
    }
  },
  {
    "codename": "rq3a",
    "variant": null,
    "key": "rq3a",
    "marketingName": "Galaxy A14",
    "vendor": "samsung",
    "vendorNombre": "Samsung",
    "soc": "Samsung Exynos 850",
    "socVendor": "exynos",
    "platform": null,
    "modelNumbers": [
      "SM-A145F",
      "SM-A145M",
      "SM-A145F/DS"
    ],
    "androidVersion": 14,
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
      "seed",
      "ift"
    ],
    "homologadoIft": "desconocido",
    "iftCertificado": "",
    "iftUrl": "",
    "receta": {
      "metodo": null,
      "desbloqueo": null,
      "particionRecovery": "recovery",
      "comboRecovery": null,
      "comboDescarga": null,
      "modoDescarga": "Samsung Download mode 04E8:6600 / 685D (Odin-style protocol)",
      "descargaExigeMaterialFirmado": true,
      "requisitoPrevio": null,
      "versionRequisito": null
    }
  },
  {
    "codename": "a73xq",
    "variant": null,
    "key": "a73xq",
    "marketingName": "Galaxy A73 5G",
    "vendor": "samsung",
    "vendorNombre": "Samsung",
    "soc": "Qualcomm SM7325 Snapdragon 778G 5G",
    "socVendor": "qualcomm",
    "platform": "sm7325",
    "modelNumbers": [
      "SM-A736B",
      "SM-A736B/DS"
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
      "play",
      "ift"
    ],
    "homologadoIft": "desconocido",
    "iftCertificado": "",
    "iftUrl": "",
    "receta": {
      "metodo": "samloader_rs",
      "desbloqueo": null,
      "particionRecovery": "recovery",
      "comboRecovery": "With the device powered off, hold Volume Up + Power while the device is connected to a PC via USB cable.",
      "comboDescarga": "With the device powered off, hold Volume Up + Volume Down then connect USB cable to PC.",
      "modoDescarga": "EDL 900E / 9008 (Sahara + Firehose XML)",
      "descargaExigeMaterialFirmado": true,
      "requisitoPrevio": "needs_specific_android_fw",
      "versionRequisito": "13/14/15"
    }
  },
  {
    "codename": "b0s",
    "variant": null,
    "key": "b0s",
    "marketingName": "Galaxy S22 Ultra",
    "vendor": "samsung",
    "vendorNombre": "Samsung",
    "soc": "Samsung Exynos 2200",
    "socVendor": "exynos",
    "platform": "s5",
    "modelNumbers": [
      "SM-S908B",
      "SM-S908B/DS"
    ],
    "androidVersion": 22,
    "release": "2022-02-25",
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
      "play",
      "ift"
    ],
    "homologadoIft": "desconocido",
    "iftCertificado": "",
    "iftUrl": "",
    "receta": {
      "metodo": "samloader_rs",
      "desbloqueo": null,
      "particionRecovery": "recovery",
      "comboRecovery": "Reboot and immediately hold Volume Up + Power while the device is connected to a PC via USB cable.",
      "comboDescarga": "With the device powered off, hold Volume Up + Volume Down then connect USB cable to PC.",
      "modoDescarga": "Samsung Download mode 04E8:6600 / 685D (Odin-style protocol)",
      "descargaExigeMaterialFirmado": true,
      "requisitoPrevio": "needs_specific_android_fw",
      "versionRequisito": "15"
    }
  },
  {
    "codename": "dm1q",
    "variant": null,
    "key": "dm1q",
    "marketingName": "Galaxy S23",
    "vendor": "samsung",
    "vendorNombre": "Samsung",
    "soc": "Qualcomm SM8550 Snapdragon 8 Gen2",
    "socVendor": "qualcomm",
    "platform": "sm8550",
    "modelNumbers": [
      "SM-S911B",
      "SM-S911B/DS"
    ],
    "androidVersion": 22,
    "release": "2023-02-17",
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
      "play",
      "ift"
    ],
    "homologadoIft": "desconocido",
    "iftCertificado": "",
    "iftUrl": "",
    "receta": {
      "metodo": "samloader_rs",
      "desbloqueo": null,
      "particionRecovery": "recovery",
      "comboRecovery": "Reboot and immediately hold Volume Up + Power while the device is connected to a PC via USB cable.",
      "comboDescarga": "With the device powered off, hold Volume Up + Volume Down then connect USB cable to PC.",
      "modoDescarga": "EDL 900E / 9008 (Sahara + Firehose XML)",
      "descargaExigeMaterialFirmado": true,
      "requisitoPrevio": "needs_specific_android_fw",
      "versionRequisito": "15"
    }
  },
  {
    "codename": "fogos",
    "variant": "2",
    "key": "fogos#2",
    "marketingName": "moto g45 5G",
    "vendor": "motorola",
    "vendorNombre": "Motorola",
    "soc": "Qualcomm SM6375-AC Snapdragon 6s Gen 3",
    "socVendor": "qualcomm",
    "platform": "sm6375",
    "modelNumbers": [
      "XT2363-8",
      "XT2363-9"
    ],
    "androidVersion": 22,
    "release": "2024-08-28",
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
      "play",
      "ift"
    ],
    "homologadoIft": "sin_verificar",
    "iftCertificado": "",
    "iftUrl": "",
    "receta": {
      "metodo": "fastboot_motorola",
      "desbloqueo": null,
      "particionRecovery": "boot",
      "comboRecovery": "With the device powered off, hold Volume Down + Power, then select \"Recovery mode\" using Volume keys.",
      "comboDescarga": "With the device powered off, hold Volume Down + Power.",
      "modoDescarga": "EDL 900E / 9008 (Sahara + Firehose XML)",
      "descargaExigeMaterialFirmado": true,
      "requisitoPrevio": "needs_specific_android_fw",
      "versionRequisito": "14/15"
    }
  },
  {
    "codename": "g0s",
    "variant": null,
    "key": "g0s",
    "marketingName": "Galaxy S22+",
    "vendor": "samsung",
    "vendorNombre": "Samsung",
    "soc": "Samsung Exynos 2200",
    "socVendor": "exynos",
    "platform": "s5",
    "modelNumbers": [
      "SM-S906B",
      "SM-S906B/DS"
    ],
    "androidVersion": 22,
    "release": "2022-02-25",
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
      "play",
      "ift"
    ],
    "homologadoIft": "desconocido",
    "iftCertificado": "",
    "iftUrl": "",
    "receta": {
      "metodo": "samloader_rs",
      "desbloqueo": null,
      "particionRecovery": "recovery",
      "comboRecovery": "Reboot and immediately hold Volume Up + Power while the device is connected to a PC via USB cable.",
      "comboDescarga": "With the device powered off, hold Volume Up + Volume Down then connect USB cable to PC.",
      "modoDescarga": "Samsung Download mode 04E8:6600 / 685D (Odin-style protocol)",
      "descargaExigeMaterialFirmado": true,
      "requisitoPrevio": "needs_specific_android_fw",
      "versionRequisito": "15"
    }
  },
  {
    "codename": "lamu",
    "variant": "2",
    "key": "lamu#2",
    "marketingName": "moto g15 power",
    "vendor": "motorola",
    "vendorNombre": "Motorola",
    "soc": "Mediatek Helio G81 Extreme",
    "socVendor": "mediatek",
    "platform": "lamu",
    "modelNumbers": [
      "XT2521-5",
      "XT2521-6"
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
      "ift"
    ],
    "homologadoIft": "sin_verificar",
    "iftCertificado": "",
    "iftUrl": "",
    "receta": {
      "metodo": "fastboot_custom",
      "desbloqueo": null,
      "particionRecovery": "vendor_boot",
      "comboRecovery": "With the device powered off, hold Volume Up + Power.",
      "comboDescarga": "With the device powered off, hold Volume Down + Power. Keep holding both buttons until the text \"FastBoot Mode\" appears on the screen, then release.",
      "modoDescarga": "BROM 0E8D:0000 / Preloader 0E8D:0001 (BROM + DA agent)",
      "descargaExigeMaterialFirmado": true,
      "requisitoPrevio": "needs_specific_android_fw",
      "versionRequisito": "15"
    }
  },
  {
    "codename": "r0s",
    "variant": null,
    "key": "r0s",
    "marketingName": "Galaxy S22",
    "vendor": "samsung",
    "vendorNombre": "Samsung",
    "soc": "Samsung Exynos 2200",
    "socVendor": "exynos",
    "platform": "s5",
    "modelNumbers": [
      "SM-S901B",
      "SM-S901B/DS"
    ],
    "androidVersion": 22,
    "release": "2022-02-25",
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
      "play",
      "ift"
    ],
    "homologadoIft": "desconocido",
    "iftCertificado": "",
    "iftUrl": "",
    "receta": {
      "metodo": "samloader_rs",
      "desbloqueo": null,
      "particionRecovery": "recovery",
      "comboRecovery": "Reboot and immediately hold Volume Up + Power while the device is connected to a PC via USB cable.",
      "comboDescarga": "With the device powered off, hold Volume Up + Volume Down then connect USB cable to PC.",
      "modoDescarga": "Samsung Download mode 04E8:6600 / 685D (Odin-style protocol)",
      "descargaExigeMaterialFirmado": true,
      "requisitoPrevio": "needs_specific_android_fw",
      "versionRequisito": "15"
    }
  },
  {
    "codename": "Mi439",
    "variant": "4",
    "key": "Mi439#4",
    "marketingName": "Redmi 8A Dual",
    "vendor": "xiaomi",
    "vendorNombre": "Xiaomi",
    "soc": "Qualcomm SDM439 Snapdragon 439",
    "socVendor": "qualcomm",
    "platform": "msm8937",
    "modelNumbers": [
      "M2001C3K3I"
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
      "seed",
      "ift"
    ],
    "homologadoIft": "desconocido",
    "iftCertificado": "",
    "iftUrl": "",
    "receta": {
      "metodo": "fastboot_xiaomi",
      "desbloqueo": null,
      "particionRecovery": "recovery",
      "comboRecovery": "With the device powered off, hold Volume Up + Power. When the screen lights up, release the buttons.",
      "comboDescarga": "With the device powered off, hold Volume Down + Power.",
      "modoDescarga": "EDL 900E / 9008 (Sahara + Firehose XML)",
      "descargaExigeMaterialFirmado": true,
      "requisitoPrevio": "needs_specific_android_fw",
      "versionRequisito": "10"
    }
  },
  {
    "codename": "joan",
    "variant": "2",
    "key": "joan#2",
    "marketingName": "V30 (T-Mobile)",
    "vendor": "lg",
    "vendorNombre": "LG",
    "soc": "Qualcomm MSM8998 Snapdragon 835",
    "socVendor": "qualcomm",
    "platform": "msm8998",
    "modelNumbers": [
      "H932"
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
      "ift"
    ],
    "homologadoIft": "desconocido",
    "iftCertificado": "",
    "iftUrl": "",
    "receta": {
      "metodo": "dd",
      "desbloqueo": null,
      "particionRecovery": "recovery",
      "comboRecovery": "With the device powered off, hold Volume Down + Power until the LG logo appears, then release Power for a second and hold it again until the recovery comes up.",
      "comboDescarga": "With the device powered off, hold Volume Up + Power.",
      "modoDescarga": "EDL 900E / 9008 (Sahara + Firehose XML)",
      "descargaExigeMaterialFirmado": true,
      "requisitoPrevio": "needs_specific_android_fw",
      "versionRequisito": "9.0"
    }
  }
];
