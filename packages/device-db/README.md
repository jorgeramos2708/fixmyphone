# FixMyPhone · device-db

Pipeline que genera el inventario de dispositivos de la plataforma. Sin
dependencias externas (solo libreria estandar de Python 3.11+).

```
python pipeline.py run              # construye (usa cache)
python pipeline.py run --refresh    # ignora cache
python pipeline.py stats            # consultas sobre el sqlite
python pipeline.py verify           # invariantes duros + regresion de brechas
```

## Salidas

| Artefacto | Para que sirve |
|---|---|
| `data/out/fixmyphone_device_db.sqlite` | Base que lee la app .NET. Tablas: `variant`, `alias`, `provenance`, `soc_vendor`, `mx_operator`, `gap`, `conflict`, `source`, `meta` |
| `data/out/devices.csv` | Revision rapida en Excel por el equipo de taller |
| `data/out/devices.json` | Empaquetado para el capability pack firmado |
| `data/out/run_report.md` | Reporte de corrida: cobertura, brechas, foco Mexico |
| `data/out/quality_baseline.json` | Linea base de brechas; `verify` falla si empeoran |

## Por que la unidad atomica es la VARIANTE

No el modelo ni el nombre comercial: el par **codename + variante**. Samsung
Galaxy A54 existe como Exynos 1380 y como Snapdragon 6 Gen 1 con la misma
familia de codename. Una base de datos a nivel "modelo" manda a flashear la
imagen equivocada y deja el equipo en brick. Por eso `variant.id` es
`codename#variante` y cada una tiene su propio layout, sus capacidades y sus
riesgos.

## Fuentes

| id | Contenido | Profundidad | Licencia |
|---|---|---|---|
| `lineageos` | `LineageOS/lineage_wiki` `_data/devices/*.yml` (740 fichas) | **Alta**: SoC, numeros de modelo, bateria, pantalla, camaras, `is_ab_device`, `install_method`, `recovery_partition_name` (clave: `vendor_boot` vs `recovery`), `before_install`, combinaciones de botones para entrar a fastboot/recovery | CC BY-SA 3.0 (atribucion obligatoria en la app) |
| `play` | `storage.googleapis.com/play_public/supported_devices.csv` (53,994 filas, 37,109 tokens unicos) | **Amplitud**: mapea `ro.product.device` -> marca + nombre comercial | Google, dataset publico |
| `seed` | Conocimiento de reparacion curado en `devicedb/seed.py` | Modo de descarga por familia de SoC, material firmado requerido, particiones de interes, notas de riesgo, operadores de Mexico | Proprietario |
| `manual` | `manual/devices.override.yml` | Lo que ninguna fuente publica trae. Exige `verified_by` + `evidence` o se rechaza | Interno, revisado |

### El contrato de procedencia (lo mas importante del diseno)

Cada campo guarda `source` + `confidence` + `url` + `retrieved_at` en la tabla
`provenance`. En una base de datos de reparacion, **un dato falso damage un
equipo**: el motor de capacidades tiene que poder decir "esto lo afirmo la fuente
A, nadie mas lo confirma" antes de permitir un flash. Niveles:

- `verified` - confirmado por >=2 fuentes independientes o por el fabricante
- `reported` - declarado por una fuente publica, sin verificar en laboratorio
- `inferred` - derivado por regla; **puede estar equivocado**
- `seed` - curado por FixMyPhone, requiere revision periodica
- `manual` - revisado por un humano con evidencia adjunta

## Lo que genera el pipeline (no es un catalogo, es motor deDecision)

Por cada variante:

- **Capacidades**: `adb`, `fastboot`, `fastbootd`, `edl` / `brom` / `fdl` /
  `odin_download` / `hitool` segun familia de SoC, `a_b_slots` vs `a_only`,
  `dynamic_partitions`, `verified_boot`, `unlock_official`, y el set base de
  procedimientos P0 sin riesgo de identidad de radio.
- **`risk_flags`**: lo que el tecnico DEBE ver antes de escribir. Ejemplos:
  `edl_requires_signed_programmer`, `fdl_secure_download_may_be_blocked`,
  `hisilicon_download_unsupported_on_new_soc`, `recovery_flash_target_is:vendor_boot`,
  `a_only_layout_full_scatter_required`, `samsung_knox_eFuse_risk_on_unlock`,
  `ift_not_homologated_rf_risk`.
- **`verification_gates`**: las comprobaciones obligatorias de post-reparacion
  (power_on, charging, touch_grid, display_pwm, audio_path, cameras,
  network_register, data_browse, radio_ident, slot_health...). El workflow
  engine no deja cerrar la orden si alguna bloqueante falla. Esta es la razon de
  ser del producto: mata el re-trabajo.
- **`mx_operator`**: Telcel / AT&T Mexico / Movistar / MVNO con bandas LTE y 5G,
  incluida la banda 28 (700 MHz APT) que define la cobertura interior en Mexico.

## Estado real medido (primera corrida, 2026-09-26)

```
VARIANTES: 734    CODENAMES: 605    PLAY: 53,994    TOKENS: 37,109
SoC por familia: qualcomm 584 | exynos 60 | tensor 16 | mediatek 14 | hisilicon 4
```

### La brecha que queda, en numeros

| Marca | En LineageOS | En Play | Lectura |
|---|---|---|---|
| Samsung | 115 (+2 curados) | 3,426 | **7% de resolucion en runtime** |
| Motorola | 95 | 898 | 11% |
| Sony | 44 | 534 | 8% |
| Huawei | 9 | 1,550 | 0.6% |
| ZTE | 4 | 1,805 | 0.2% |
| Oppo / Vivo / Realme / Tecno | 0 | 822 / 740 / 470 | **0%** |

Conclusion honesta: **las fuentes publicas cubren profundidad en ~600 modelos
(flagship y gama media-alta) y amplitud de ~37,000 tokens sin SoC.** El hueco
no es un problema de codigo, es de contenido, y se cierra con curacion humana
(la cola ya esta priorizada en `manual/devices.override.yml`) y con el
**camino de auto-identificacion en runtime**: cuando un equipo no esta en la
base, la app lee su SoC/plataforma del propio dispositivo y propone el registro.

Brechas abiertoas (con linea base, para que la regresion sea visible):
`sin_model_numbers 243`, `ab_desconocido 452`, `dynamic_desconocido 173`.

## Extender

1. **Nueva fuente**: agrega un adaptador en `devicedb/sources.py` que devuelva
   records normalizados con su procedencia. No se toca el pipeline.
2. **Curacion**: edita `manual/devices.override.yml`. Sin `verified_by` +
   `evidence` la entrada se rechaza con error visible.
3. **Nueva capacidad**: `devicedb/derive.py::derive_capabilities` +
   `SOC_VENDOR_CAPABILITIES` en `seed.py`.
4. **Nueva verificacion**: `derive.py::verification_gates`.

## Limites conocidos (honestos)

- El parser YAML es un subconjunto a proposito: si un archivo remoto usa
  construcciones fuera del subconjunto, el pipeline lo registra como error en
  vez de adivinar. Hoy: 740/740 fichas parseadas.
- `platform` se extrae del nombre del repo de kernel (`android_kernel_*`) y es
  `inferred`; para Tensor resulta truncado (`gs` en vez de `gs101`) porque el
  repo trunca el nombre. No usar `platform` como clave de decision sin
  confirmacion.
- Las bandas de radio no se pueden leer de forma fiable en runtime: vienen del
  catalogo, no del equipo. La app debe medir, no afirmar.
- `homologado_ift` arranca en `desconocido` para todo: requiere la fuente del
  IFT, que no es abierta. Hasta entonces, la app debe treatarlo como
  "no verificado" y nunca como "si".
