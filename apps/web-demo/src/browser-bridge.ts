/**
 * Implementación de `FmpBridge` para el navegador.
 * ===========================================================================
 *
 * Esta es la SEGUNDA implementación del contrato. Que exista, y no una copia
 * de la app, es la prueba de que la frontera aguanta: si el renderer tuviera
 * un `import { ipcRenderer }` escondido, esto no compilaría.
 *
 * Hace tres cosas que la app de escritorio no hace:
 *   1. Simula un equipo con propiedades verosímiles, para poder ver la UI sin
 *      un Samsung de verdad conectado.
 *   2. Ejecuta las sondas con retardo realista, para que el estado "ejecutando"
 *      se vea como se verá de verdad.
 *   3. Permite cambiar de equipo simulado, incluido uno que NO existe en el
 *      catálogo, para ver cómo se comporta la app cuando no sabe.
 *
 * No simula lo que sería peligroso simular: no finge que un diagnóstico pasó.
 */

import type {
  ConnectedDevice,
  DeviceVariant,
  FmpBridge,
  IdentityLadder,
  LicenseEnvelope,
  LicenseState,
  ProbeResult,
  RawDeviceProps,
  ReportDraft,
  Resolution,
  TransportKind,
} from "@fixmyphone/core";
import { DEMO_CATALOG } from "@fixmyphone/app/data/demo-catalog";

/** Espera un poco. Simula la latencia de un comando real. */
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

// ---------------------------------------------------------------------------
// Equipos simulados
// ---------------------------------------------------------------------------

interface Simulated {
  id: string;
  label: string;
  props: RawDeviceProps;
  battery: { levelPct: number; charging: boolean };
  /**
   * Este equipo NO está en el catálogo, a propósito, para que se vea cómo
   * responde la app cuando no sabe. Es la parte honesta de la demo.
   *
   * Todo lo demás tiene que resolver. La regla existe porque se apuntaron dos
   * fixtures a codenames que el recorte de 48 no traía, y la demo contestaba
   * "sin coincidencia en el catálogo" en dos de cinco casos: medio catálogo de
   * mentira, y sin ningún error que lo dijera. Marcarlo aquí hace que la
   * excepción sea visible en el codigo y que `tools/probar-if.py` pueda exigir
   * que todo lo demás sí resuelva.
   */
  fueraDelCatalogo?: true;
}

const SIMULADOS: Simulated[] = [
  {
    id: "a54-5g",
    label: "Galaxy A54 5G (Exynos 1380)",
    props: {
      "ro.product.device": "rq3q",
      "ro.product.vendor.device": "qcom",
      "ro.product.name": "rq3q_00",
      "ro.product.model": "SM-A546B",
      "ro.product.manufacturer": "samsung",
      "ro.product.brand": "samsung",
      "ro.build.version.release": "13",
      "ro.build.version.security_patch": "2024-02-01",
      "ro.build.id": "TP1A.220624.014",
      "ro.build.fingerprint":
        "samsung/rq3q/rq3q:13/TP1A.220624.014/A546XXU6AWF1:user/release-keys",
      "ro.boot.hardware": "qcom",
      "ro.boot.bootloader": "A546XXU6AWF1",
      "ro.boot.verifiedbootstate": "green",
      "ro.boot.flash.locked": "1",
      "ro.serialno": "RF8T20ABCDE",
      "ro.crypto.state": "encrypted",
      "ro.crypto.type": "file",
      "sys.boot_completed": "1",
      "ril.IMEI": "356938035643809",
      "gsm.version.baseband": "A546XXU6AWF1",
      "ro.sf.lcd_density": "420",
      "ro.product.cpu.abi": "arm64-v8a",
    },
    battery: { levelPct: 87, charging: true },
  },
  {
    // Apuntaba a un Galaxy A14 (codename `rq3a`) que no esta en el recorte de
    // 48, asi que la demo le contestaba "sin coincidencia en el catalogo" y
    // esta pantalla no demostraba nada. Se cambio por un Galaxy A21s, que si esta
    // y que mantiene lo que el equipo queria mostrar: un Samsung de gama de
    // entrada con Exynos 850 y el bootloader bloqueado de fabrica. El nombre del
    // equipo tambien cambio, porque el catalogo no tiene un A14 y el fixture
    // tiene que decir el nombre del equipo que de verdad esta simulando.
    id: "a21s",
    label: "Galaxy A21s (Exynos 850)",
    props: {
      "ro.product.device": "a21s",
      "ro.product.model": "SM-A217F",
      "ro.product.manufacturer": "samsung",
      "ro.build.version.release": "13",
      "ro.build.version.security_patch": "2024-02-01",
      "ro.build.fingerprint":
        "samsung/a21s/a21s:13/TP1A.220624.014/A217FXXU5AWF1:user/release-keys",
      "ro.boot.hardware": "exynos850",
      "ro.boot.flash.locked": "1",
      "ro.boot.verifiedbootstate": "green",
      "ro.serialno": "R5CT30XYZ12",
      "sys.boot_completed": "1",
      "ril.IMEI": "351234567890123",
    },
    battery: { levelPct: 42, charging: false },
  },
  {
    // Gama media de Samsung de las que encabezaron ventas en el pais durante
    // 2020-2021. Estan en el recorte (`a52q` y `a71`) con datos reales:
    // Snapdragon 720G y 730, y una lista de numeros de modelo que arranca con
    // SM-A525F y SM-A715F. Se usan las variantes SM-A525M / SM-A715F porque la
    // 'M' (Mexico) es la regional de America Latina.
    //
    // Su estado IFT en la base es `desconocido`: las tablas por marca de la
    // fuente real no los listan con folio. Conviene verlos por eso: "equipo
    // popular" no es lo mismo que "equipo con folio".
    id: "galaxy-a52-4g",
    label: "Galaxy A52 4G (SM-A525M)",
    props: {
      "ro.product.device": "a52q",
      "ro.product.model": "SM-A525M",
      "ro.product.manufacturer": "samsung",
      "ro.product.brand": "samsung",
      "ro.build.version.release": "13",
      "ro.build.version.security_patch": "2024-03-01",
      "ro.build.id": "TP1A.220624.014",
      "ro.build.fingerprint":
        "samsung/a52q/a52q:13/TP1A.220624.014/A525FXXU8CWB7:user/release-keys",
      "ro.boot.hardware": "qcom",
      "ro.boot.flash.locked": "1",
      "ro.boot.verifiedbootstate": "green",
      "ro.serialno": "R5CW10DEFG2",
      "sys.boot_completed": "1",
    },
    battery: { levelPct: 58, charging: false },
  },
  {
    id: "galaxy-a71",
    label: "Galaxy A71 (SM-A715F)",
    props: {
      "ro.product.device": "a71",
      "ro.product.model": "SM-A715F",
      "ro.product.manufacturer": "samsung",
      "ro.product.brand": "samsung",
      "ro.build.version.release": "13",
      "ro.build.version.security_patch": "2023-08-01",
      "ro.build.id": "TP1A.220624.014",
      "ro.build.fingerprint":
        "samsung/a71/a71:13/TP1A.220624.014/A715FXXUBCWE1:user/release-keys",
      "ro.boot.hardware": "qcom",
      "ro.boot.flash.locked": "1",
      "ro.boot.verifiedbootstate": "green",
      "ro.serialno": "R58M71J4K2L6",
      "sys.boot_completed": "1",
    },
    battery: { levelPct: 33, charging: true },
  },
  {
    // La gama de entrada de Samsung que mas se vendio por 2019: a diferencia
    // del A2x llego con bateria de 5000 mAh (dato real de la variante
    // `m20lte`), y por eso se quedo con el publico que solo buscaba duracion.
    // Tambien es la muestra de una entrada con Exynos 7904. Su estado IFT en
    // la base es `desconocido`.
    id: "galaxy-m20",
    label: "Galaxy M20 (SM-M205M)",
    props: {
      "ro.product.device": "m20lte",
      "ro.product.model": "SM-M205M",
      "ro.product.manufacturer": "samsung",
      "ro.product.brand": "samsung",
      "ro.build.version.release": "10",
      "ro.build.version.security_patch": "2021-10-01",
      "ro.build.id": "QPGS.260220.005",
      "ro.build.fingerprint":
        "samsung/m20lte/m20lte:10/QPGS.260220.005/M205FXXU1CUG2:user/release-keys",
      "ro.boot.hardware": "exynos7904",
      "ro.boot.flash.locked": "1",
      "ro.boot.verifiedbootstate": "green",
      "ro.serialno": "R58K91P2Q3R4",
      "sys.boot_completed": "1",
    },
    battery: { levelPct: 91, charging: false },
  },
  {
    // La gama A que el catalogo alcanza a cubrir. El A14 es la entrada de
    // Samsung que mas se vendio en el pais desde 2023 (Exynos 850, dato real
    // de la variante `rq3a`) y es, con el A21s, uno de los dos casos de gama
    // baja de la maqueta. La variante elegida, SM-A145M, es la regional de
    // America Latina. En el cruce del IFT esta `desconocido`: la tabla por
    // marca de Samsung no lo lista con folio.
    id: "galaxy-a14",
    label: "Galaxy A14 (SM-A145M)",
    props: {
      "ro.product.device": "rq3a",
      "ro.product.model": "SM-A145M",
      "ro.product.manufacturer": "samsung",
      "ro.product.brand": "samsung",
      "ro.build.version.release": "13",
      "ro.build.version.security_patch": "2024-06-01",
      "ro.build.id": "TP1A.220624.014",
      "ro.build.fingerprint":
        "samsung/rq3a/rq3a:13/TP1A.220624.014/4e5f60718293:user/release-keys",
      "ro.boot.hardware": "exynos850",
      "ro.boot.flash.locked": "1",
      "ro.boot.verifiedbootstate": "green",
      "ro.serialno": "R5DZ7890T0",
      "sys.boot_completed": "1",
    },
    battery: { levelPct: 47, charging: false },
  },
  {
    // El A52s 5G: la gama media que la gente confunde con el A52 normal y que
    // en realidad es otro equipo (otra placa, `a52sxq`, y otro SoC: Snapdragon
    // 778G 5G real). Entra para que se vea que "A52s" no se resuelve solo con
    // "A52": el numero de modelo decide, y este se queda con su placa.
    id: "galaxy-a52s-5g",
    label: "Galaxy A52s 5G (SM-A528B)",
    props: {
      "ro.product.device": "a52sxq",
      "ro.product.model": "SM-A528B",
      "ro.product.manufacturer": "samsung",
      "ro.product.brand": "samsung",
      "ro.build.version.release": "13",
      "ro.build.version.security_patch": "2024-03-01",
      "ro.build.id": "TP1A.220624.014",
      "ro.build.fingerprint":
        "samsung/a52sxq/a52sxq:13/TP1A.220624.014/5f60718293a4:user/release-keys",
      "ro.boot.hardware": "qcom",
      "ro.boot.flash.locked": "1",
      "ro.boot.verifiedbootstate": "green",
      "ro.serialno": "R5CZA2345V2",
      "sys.boot_completed": "1",
    },
    battery: { levelPct: 81, charging: true },
  },
  {
    // El A72: primo mayor del A52, misma familia que el A71 que ya esta en la
    // maqueta. Entra para que la gama media de 2021 quede con sus dos pisos:
    // A52 y A71 abajo, A72 arriba, y todos con codename propio y unico.
    id: "galaxy-a72",
    label: "Galaxy A72 (SM-A725M)",
    props: {
      "ro.product.device": "a72q",
      "ro.product.model": "SM-A725M",
      "ro.product.manufacturer": "samsung",
      "ro.product.brand": "samsung",
      "ro.build.version.release": "13",
      "ro.build.version.security_patch": "2023-09-01",
      "ro.build.id": "TP1A.220624.014",
      "ro.build.fingerprint":
        "samsung/a72q/a72q:13/TP1A.220624.014/718293a4b5c6:user/release-keys",
      "ro.boot.hardware": "qcom",
      "ro.boot.flash.locked": "1",
      "ro.boot.verifiedbootstate": "green",
      "ro.serialno": "R5CZC0123X6",
      "sys.boot_completed": "1",
    },
    battery: { levelPct: 36, charging: false },
  },
  {
    // El A73 5G con Snapdragon 778G (dato real de la variante `a73xq`). Es la
    // gama media alta de la serie A que la base si cubre; del A53/A55/A35 en
    // adelante la base no tiene filas, asi que aqui termina cubierta la gama A.
    id: "galaxy-a73-5g",
    label: "Galaxy A73 5G (SM-A736B)",
    props: {
      "ro.product.device": "a73xq",
      "ro.product.model": "SM-A736B",
      "ro.product.manufacturer": "samsung",
      "ro.product.brand": "samsung",
      "ro.build.version.release": "13",
      "ro.build.version.security_patch": "2023-11-01",
      "ro.build.id": "TP1A.220624.014",
      "ro.build.fingerprint":
        "samsung/a73xq/a73xq:13/TP1A.220624.014/60718293a4b5:user/release-keys",
      "ro.boot.hardware": "qcom",
      "ro.boot.flash.locked": "1",
      "ro.boot.verifiedbootstate": "green",
      "ro.serialno": "R5CZB6789W4",
      "sys.boot_completed": "1",
    },
    battery: { levelPct: 29, charging: true },
  },
  {
    // La gama S de 2022 que el catalogo cubre. Como los tres comparten placa
    // base (Exynos 2200, dato real), el codigo distinguidor es el numero de
    // modelo: SM-S901B, SM-S906B y SM-S908B en sus tres variantes `r0s`, `g0s`
    // y `b0s`. En la pantalla "cerca" se ve que cada uno baja a su placa.
    id: "galaxy-s22",
    label: "Galaxy S22 (SM-S901B)",
    props: {
      "ro.product.device": "r0s",
      "ro.product.model": "SM-S901B",
      "ro.product.manufacturer": "samsung",
      "ro.product.brand": "samsung",
      "ro.build.version.release": "13",
      "ro.build.version.security_patch": "2024-02-01",
      "ro.build.id": "TP1A.220624.014",
      "ro.build.fingerprint":
        "samsung/r0s/r0s:13/TP1A.220624.014/0a1b2c3d4e5f:user/release-keys",
      "ro.boot.hardware": "exynos2200",
      "ro.boot.flash.locked": "1",
      "ro.boot.verifiedbootstate": "green",
      "ro.serialno": "R5CYD1234K2",
      "sys.boot_completed": "1",
    },
    battery: { levelPct: 82, charging: false },
  },
  {
    id: "galaxy-s22-plus",
    label: "Galaxy S22+ (SM-S906B)",
    props: {
      "ro.product.device": "g0s",
      "ro.product.model": "SM-S906B",
      "ro.product.manufacturer": "samsung",
      "ro.product.brand": "samsung",
      "ro.build.version.release": "13",
      "ro.build.version.security_patch": "2024-02-01",
      "ro.build.id": "TP1A.220624.014",
      "ro.build.fingerprint":
        "samsung/g0s/g0s:13/TP1A.220624.014/1b2c3d4e5f60:user/release-keys",
      "ro.boot.hardware": "exynos2200",
      "ro.boot.flash.locked": "1",
      "ro.boot.verifiedbootstate": "green",
      "ro.serialno": "R5CYE5678M4",
      "sys.boot_completed": "1",
    },
    battery: { levelPct: 66, charging: true },
  },
  {
    id: "galaxy-s22-ultra",
    label: "Galaxy S22 Ultra (SM-S908B)",
    props: {
      "ro.product.device": "b0s",
      "ro.product.model": "SM-S908B",
      "ro.product.manufacturer": "samsung",
      "ro.product.brand": "samsung",
      "ro.build.version.release": "13",
      "ro.build.version.security_patch": "2024-02-01",
      "ro.build.id": "TP1A.220624.014",
      "ro.build.fingerprint":
        "samsung/b0s/b0s:13/TP1A.220624.014/2c3d4e5f6071:user/release-keys",
      "ro.boot.hardware": "exynos2200",
      "ro.boot.flash.locked": "1",
      "ro.boot.verifiedbootstate": "green",
      "ro.serialno": "R5CYF9012P6",
      "sys.boot_completed": "1",
    },
    battery: { levelPct: 53, charging: false },
  },
  {
    // El S23. Con el trabajo de ampliacion, la base ya cubre todo el arco de la
    // gama S reciente: S23 (`dm1q`), S23+ (`dm2q`), S23 Ultra (`dm3q`),
    // S24 (`e1s`), S24+ (`e2s`), S24 Ultra (`e3q`), S25 (`pa1q`), S25+ (`pa2q`)
    // y S25 Ultra (`pa3q`). Abajo se simulan los cuatro que un taller ve mas
    // seguido: S24, S24 Ultra, S25 y S25 Ultra.
    id: "galaxy-s23",
    label: "Galaxy S23 (SM-S911B)",
    props: {
      "ro.product.device": "dm1q",
      "ro.product.model": "SM-S911B",
      "ro.product.manufacturer": "samsung",
      "ro.product.brand": "samsung",
      "ro.build.version.release": "14",
      "ro.build.version.security_patch": "2025-02-01",
      "ro.build.id": "UP1A.231005.007",
      "ro.build.fingerprint":
        "samsung/dm1q/dm1q:14/UP1A.231005.007/3d4e5f607182:user/release-keys",
      "ro.boot.hardware": "qcom",
      "ro.boot.flash.locked": "1",
      "ro.boot.verifiedbootstate": "green",
      "ro.serialno": "R5CZG3456R8",
      "sys.boot_completed": "1",
    },
    battery: { levelPct: 61, charging: true },
  },
  {
    // El S24. En la mayoria de los mercados, incluido Mexico, llego con el
    // Exynos 2400 (token `e1s` en el snapshot de Play; la placa Snapdragon
    // `e1q` era China/EE.UU.). Fue la primera de la gama S con siete anos de
    // actualizaciones, y por eso sigue entrando al taller con el firmware de
    // fabrica y el bootloader cerrado.
    id: "galaxy-s24",
    label: "Galaxy S24 (SM-S921B)",
    props: {
      "ro.product.device": "e1s",
      "ro.product.model": "SM-S921B",
      "ro.product.manufacturer": "samsung",
      "ro.product.brand": "samsung",
      "ro.build.version.release": "14",
      "ro.build.version.security_patch": "2025-01-01",
      "ro.build.id": "UP1A.231005.007",
      "ro.build.fingerprint":
        "samsung/e1s/e1s:14/UP1A.231005.007/S921BXXU4BXN1:user/release-keys",
      "ro.boot.hardware": "exynos2400",
      "ro.boot.flash.locked": "1",
      "ro.boot.verifiedbootstate": "green",
      "ro.serialno": "R5CZH4567S1",
      "sys.boot_completed": "1",
    },
    battery: { levelPct: 74, charging: false },
  },
  {
    // El S24 Ultra: el unico de la serie con Snapdragon 8 Gen 3 en todos los
    // mercados (`e3q`). Es el equipo con marco de titanio y pantalla plana que
    // el taller ve como el gama premium de 2024.
    id: "galaxy-s24-ultra",
    label: "Galaxy S24 Ultra (SM-S928B)",
    props: {
      "ro.product.device": "e3q",
      "ro.product.model": "SM-S928B",
      "ro.product.manufacturer": "samsung",
      "ro.product.brand": "samsung",
      "ro.build.version.release": "14",
      "ro.build.version.security_patch": "2025-01-01",
      "ro.build.id": "UP1A.231005.007",
      "ro.build.fingerprint":
        "samsung/e3q/e3q:14/UP1A.231005.007/S928BXXU2BXN1:user/release-keys",
      "ro.boot.hardware": "sm8650",
      "ro.boot.flash.locked": "1",
      "ro.boot.verifiedbootstate": "green",
      "ro.serialno": "R5CZJ8901T2",
      "sys.boot_completed": "1",
    },
    battery: { levelPct: 67, charging: true },
  },
  {
    // El S25: Snapdragon 8 Elite en todos los mercados (`pa1q`), ya sin
    // variante Exynos, y Android 15 de fabrica. Es el caso de la generacion
    // nueva que un taller en Mexico ya recibe en el mostrador.
    id: "galaxy-s25",
    label: "Galaxy S25 (SM-S931B)",
    props: {
      "ro.product.device": "pa1q",
      "ro.product.model": "SM-S931B",
      "ro.product.manufacturer": "samsung",
      "ro.product.brand": "samsung",
      "ro.build.version.release": "15",
      "ro.build.version.security_patch": "2026-01-01",
      "ro.build.id": "AP3A.240905.015",
      "ro.build.fingerprint":
        "samsung/pa1q/pa1q:15/AP3A.240905.015/S931BXXU2BXN1:user/release-keys",
      "ro.boot.hardware": "sm8750",
      "ro.boot.flash.locked": "1",
      "ro.boot.verifiedbootstate": "green",
      "ro.serialno": "R5CZK2345V3",
      "sys.boot_completed": "1",
    },
    battery: { levelPct: 58, charging: true },
  },
  {
    // El S25 Ultra (`pa3q`), la bandera de 2025: Snapdragon 8 Elite, Android 15
    // y el S Pen. Cierra el arco de la gama S en la demo: del S22 de 2022 a
    // este, todos los flagship entran al catalogo.
    id: "galaxy-s25-ultra",
    label: "Galaxy S25 Ultra (SM-S938B)",
    props: {
      "ro.product.device": "pa3q",
      "ro.product.model": "SM-S938B",
      "ro.product.manufacturer": "samsung",
      "ro.product.brand": "samsung",
      "ro.build.version.release": "15",
      "ro.build.version.security_patch": "2026-01-01",
      "ro.build.id": "AP3A.240905.015",
      "ro.build.fingerprint":
        "samsung/pa3q/pa3q:15/AP3A.240905.015/S938BXXU2BXN1:user/release-keys",
      "ro.boot.hardware": "sm8750",
      "ro.boot.flash.locked": "1",
      "ro.boot.verifiedbootstate": "green",
      "ro.serialno": "R5CZP6789W4",
      "sys.boot_completed": "1",
    },
    battery: { levelPct: 71, charging: false },
  },
  {
    // Motorola con el estado `sin_verificar`: se busco en la tabla de la marca
    // y este modelo no aparece. Es el caso que mas se confunde con "no se
    // busco", asi que conviene verlo junto al A54, que si esta sin buscar.
    //
    // Antes apuntaba a un moto g84 (codename `kunlun`) que tampoco esta en el
    // recorte, y decia "MediaTek" y "riesgo de BROM". Ninguna de las dos cosas
    // era cierta: `kunlun` no existe en la base, y en este catalogo el riesgo
    // de programador firmado se llama `edl_requires_signed_programmer`, no
    // `brom`. Un fixture que describe riesgos que el catalogo no tiene
    // desorienta a quien lo lee sobre lo que la herramienta afirma.
    id: "moto-g34",
    label: "moto g34 5G (XT2363-1)",
    props: {
      "ro.product.device": "fogos",
      "ro.product.model": "XT2363-1",
      "ro.product.manufacturer": "motorola",
      "ro.build.version.release": "14",
      "ro.build.version.security_patch": "2024-02-01",
      "ro.build.fingerprint":
        "motorola/fogos/fogos:14/U1TQS34.20-46-10/f9e1a2b3c4d5:user/release-keys",
      "ro.boot.hardware": "sm6375",
      "ro.boot.flash.locked": "0",
      "ro.boot.verifiedbootstate": "orange",
      "ro.serialno": "8d9c1f2e3a4b5c6d",
      "sys.boot_completed": "1",
    },
    battery: { levelPct: 15, charging: true },
  },
  {
    // La gama de entrada de Motorola de las mas vendidas en el pais en
    // 2025-2026: Helio G81 (dato real de la variante `lamu#1`) y 5200 mAh.
    // Entra a proposito de un grupo: `lamu` cubre el moto g15, el g15 power y
    // el g05, y el numero de modelo XT2521-2 pertenece solo a la placa del
    // g15. Igual que con el Redmi 8, la escalera baja del codename ambiguo al
    // numero de modelo y entrega una sola variante.
    id: "moto-g15",
    label: "moto g15 (XT2521-2)",
    props: {
      "ro.product.device": "lamu",
      "ro.product.model": "XT2521-2",
      "ro.product.manufacturer": "motorola",
      "ro.build.version.release": "15",
      "ro.build.version.security_patch": "2025-03-01",
      "ro.build.id": "UBTQV8.26-171-5-4",
      "ro.build.fingerprint":
        "motorola/lamu/lamu:15/UBTQV8.26-171-5-4/0c1d2e3f4a5b:user/release-keys",
      "ro.boot.hardware": "lamu",
      "ro.boot.flash.locked": "1",
      "ro.boot.verifiedbootstate": "green",
      "ro.serialno": "ZY32D34C12X",
      "sys.boot_completed": "1",
    },
    battery: { levelPct: 64, charging: true },
  },
  {
    // La gama media 5G de Motorola que se vendio fuerte en el pais durante
    // 2024-2025. Comparte codename `fogos` con el moto g34 5G (dos placas en
    // el grupo) y se decide por el modelo XT2363-8, que solo pertenece a la
    // variante `fogos#2`. Primer equipo simulado con 5G NR en la demo (la
    // variante lo declara: 2G/3G/4G LTE/5G NR).
    id: "moto-g45-5g",
    label: "moto g45 5G (XT2363-8)",
    props: {
      "ro.product.device": "fogos",
      "ro.product.model": "XT2363-8",
      "ro.product.manufacturer": "motorola",
      "ro.build.version.release": "14",
      "ro.build.version.security_patch": "2025-02-01",
      "ro.build.id": "U1TQS34.56-23-3",
      "ro.build.fingerprint":
        "motorola/fogos/fogos:14/U1TQS34.56-23-3/1a2b3c4d5e6f:user/release-keys",
      "ro.boot.hardware": "sm6375",
      "ro.boot.flash.locked": "1",
      "ro.boot.verifiedbootstate": "green",
      "ro.serialno": "ZY22HG5D8KC",
      "sys.boot_completed": "1",
    },
    battery: { levelPct: 38, charging: false },
  },
  {
    // Gama media de 2021 que todavia aparece en talleres: el moto g power con
    // 5000 mAh y Snapdragon 662. A diferencia de los dos anteriores, su
    // codename `borneo` es unico en el recorte, asi que este es el caso simple:
    // el nivel 3 resuelve directo. En la demo conviene tener los dos extremos:
    // el codename unico y el grupo que se decide por numero de modelo.
    id: "moto-g-power-2021",
    label: "moto g power 2021 (XT2117-1)",
    props: {
      "ro.product.device": "borneo",
      "ro.product.model": "XT2117-1",
      "ro.product.manufacturer": "motorola",
      "ro.build.version.release": "11",
      "ro.build.version.security_patch": "2023-06-01",
      "ro.build.id": "RPS31.Q4-55-8-2",
      "ro.build.fingerprint":
        "motorola/borneo/borneo:11/RPS31.Q4-55-8-2/7a8b9c0d1e2f:user/release-keys",
      "ro.boot.hardware": "sm6225",
      "ro.boot.flash.locked": "1",
      "ro.boot.verifiedbootstate": "green",
      "ro.serialno": "ZY12K7P9M2N4",
      "sys.boot_completed": "1",
    },
    battery: { levelPct: 79, charging: true },
  },
  {
    // El equipo de una tercera marca. Xiaomi es de las tres grandes del país y
    // la maqueta solo tenía Samsung y Motorola, así que el que seialize esto en un
    // taller ve dos marcas y cree que la herramienta solo conoce dos.
    //
    // Se eligió este codename porque `Mi439` sí tiene varias variantes reales en
    // el catálogo: `Mi439#1` es el Redmi 7A, `Mi439#2` el Redmi 8, `Mi439#3` el
    // Redmi 8A y `Mi439#4` el Redmi 8A Dual, con números de modelo distintos
    // (M1903..., M1908..., M1906...) que no se repiten entre placas. No es un
    // caso elegido por adornar la pantalla; es el que hay.
    //
    // OJO, este fixture es el que demuestra que la ambigüedad NO es una sentencia
    // de muerte: el codename cubre cuatro placas y el número de modelo que reporta
    // el equipo (M1908C3IC) pertenece a una sola, la del Redmi 8. La herramienta
    // baja un nivel y SI puede decir cual es. Un producto que se negara aqui
    // estaria dejando trabajo hecho.
    id: "redmi-7a",
    label: "Redmi 8 (M1908C3IC)",
    props: {
      "ro.product.device": "Mi439",
      "ro.product.model": "M1908C3IC",
      "ro.product.manufacturer": "xiaomi",
      "ro.product.brand": "redmi",
      "ro.build.version.release": "9",
      "ro.build.version.security_patch": "2020-04-01",
      "ro.build.fingerprint":
        "xiaomi/Mi439/Mi439:9/PKQ1.190319.001/M1908C3IC:user/release-keys",
      "ro.boot.hardware": "qcom",
      "ro.boot.flash.locked": "1",
      "ro.boot.verifiedbootstate": "green",
      "ro.serialno": "9f8e7d6c5b4a",
      "sys.boot_completed": "1",
    },
    battery: { levelPct: 71, charging: false },
  },
  {
    // La otra mitad del grupo `Mi439`: el Redmi 8A comparte codename con el
    // Redmi 7A, el Redmi 8 y el Redmi 8A Dual, pero su numero de modelo
    // M1908C3KE pertenece solo a la variante `Mi439#3`. Mismo patron que el
    // Redmi 8 de arriba: el codename no decide, el numero de modelo si. Sirve
    // para que se vea que el grupo tiene varias placas y que cada una llega
    // por su numero.
    id: "redmi-8a",
    label: "Redmi 8A (M1908C3KE)",
    props: {
      "ro.product.device": "Mi439",
      "ro.product.model": "M1908C3KE",
      "ro.product.manufacturer": "xiaomi",
      "ro.product.brand": "redmi",
      "ro.build.version.release": "9",
      "ro.build.version.security_patch": "2021-08-01",
      "ro.build.id": "PKQ1.190319.001",
      "ro.build.fingerprint":
        "xiaomi/Mi439/Mi439:9/PKQ1.190319.001/V11.0.8.0.PCMMIXM:user/release-keys",
      "ro.boot.hardware": "qcom",
      "ro.boot.flash.locked": "1",
      "ro.boot.verifiedbootstate": "green",
      "ro.serialno": "6d5e4f3a2b1c",
      "sys.boot_completed": "1",
    },
    battery: { levelPct: 24, charging: true },
  },
  {
    // De las marcas que el catalogo conoce, OnePlus vende en Mexico por canal
    // premium / en linea: a 2025-2026 su bandera es el 13 con Snapdragon 8
    // Elite (dato real de la variante `dodge`). Entra para que la demo no
    // parezca que solo existen Samsung, Motorola y Xiaomi: en ciudades grandes
    // este se repara tanto como un gama media. Su estado IFT en la base es
    // `desconocido`.
    id: "oneplus-13",
    label: "OnePlus 13 (CPH2653)",
    props: {
      "ro.product.device": "dodge",
      "ro.product.model": "CPH2653",
      "ro.product.manufacturer": "oneplus",
      "ro.product.brand": "oneplus",
      "ro.build.version.release": "15",
      "ro.build.version.security_patch": "2025-09-01",
      "ro.build.id": "AP3A.240905.015",
      "ro.build.fingerprint":
        "oneplus/dodge/dodge:15/AP3A.240905.015/U4J0A15B6C7D8:user/release-keys",
      "ro.boot.hardware": "sm8750",
      "ro.boot.flash.locked": "1",
      "ro.boot.verifiedbootstate": "green",
      "ro.serialno": "OPS0D1F9B7C5A",
      "sys.boot_completed": "1",
    },
    battery: { levelPct: 74, charging: false },
  },
  {
    // El unico equipo simulado con FOLIO del IFT. Existe por una razon concreta:
    // el catalogo de la demo garantiza un caso `homologado` (ver
    // ESTADOS_A_MOSTRAR en tools/generar-demo-catalog.mjs) y sin un equipo que
    // apunte a el, esa fila no se puede ver en la demo. Un dato que no aparece
    // en ninguna pantalla es indistinguible de un dato inventado.
    //
    // Los props son los REALES de un moto g32: XT2235-1 esta en la lista de
    // numeros de modelo de la variante `devon`, que es la que el generador dejo
    // con el folio RTIMOXT22-3427. No se inventaron props para que cuadraran.
    id: "moto-g32-ift",
    label: "moto g32 (XT2235-1)",
    props: {
      "ro.product.device": "devon",
      "ro.product.model": "XT2235-1",
      "ro.product.manufacturer": "motorola",
      "ro.build.version.release": "12",
      "ro.build.version.security_patch": "2023-08-01",
      "ro.build.fingerprint":
        "motorola/devon/devon:12/S3RQS32.20-42-10/f9e1a2b3c4d5:user/release-keys",
      "ro.boot.hardware": "sm6225",
      "ro.boot.flash.locked": "0",
      "ro.boot.verifiedbootstate": "orange",
      "ro.serialno": "z1y2x3w4v5u6t7s8",
      "sys.boot_completed": "1",
    },
    battery: { levelPct: 62, charging: false },
  },
  {
    // El UNICO caso en que la maqueta se niega, y esta puesto aqui a proposito.
    //
    // Es el equipo que hace visible la promesa central del producto: cuando hay
    // varias placas posibles, la herramienta NO elige. Con los demas fixtures se
    // podia sospechar que la ambiguedad nunca pasa, porque todos resolvian. Sin
    // este no hay forma de mirar la pantalla y ver que la herramienta se detiene
    // cuando debe.
    //
    // POR QUE ESTE Y NO OTRO. `nash` cubre el moto z2 force y el moto z (2018), y
    // es el unico codename de la maqueta donde el numero de modelo NO separa las
    // placas: XT1789-02 a XT1789-07 estan en las DOS variantes. O sea, el
    // equipo entrega un dato que PARECE decidir y el catalogo lo tie a dos
    // placas. Ahi la herramienta tiene algo que podria usar y no lo usa, que es
    // justamente la prueba de que no esta adivinando.
    //
    // No es un caso inventado para que la pantalla quede bien: es una limitacion
    // real del catalogo. Las dos filas repiten la misma lista de numeros de
    // modelo, y con esos datos no hay forma honesta de saber cual de las dos
    // placas es. Por eso el codigo que decide cual es se deja como acto humano.
    //
    // Lo que la pantalla muestra aqui: las dos candidatas con su SoC, su
    // esquema de particiones y sus numeros de modelo, y la explicacion de por que
    // no se eligio. NO ofrece un boton para escoger. Elegir aqui seria una
    // pantalla de decision que el producto no tiene y que nadie pidio; la
    // eleccion se hace en la confirmacion manual, que es un acto explicito y
    // queda anotado de quien fue.
    id: "moto-z2-ambiguo",
    label: "moto z2 force (XT1789-04)",
    props: {
      "ro.product.device": "nash",
      "ro.product.model": "XT1789-04",
      "ro.product.manufacturer": "motorola",
      "ro.build.version.release": "8",
      "ro.build.version.security_patch": "2021-06-01",
      "ro.build.fingerprint":
        "motorola/nash/nash:8/OPR30.50-42/e5f6a7b8c9d0:user/release-keys",
      "ro.boot.hardware": "sdm660",
      "ro.boot.flash.locked": "1",
      "ro.boot.verifiedbootstate": "green",
      "ro.serialno": "a1b2c3d4e5f6g7",
      "sys.boot_completed": "1",
    },
    battery: { levelPct: 55, charging: false },
  },
  {
    // El unico equipo simulado que NO esta en el catalogo, a proposito: el caso
    // honesto de "no se que es esto". Antes era el Galaxy S25, pero ese ya
    // entro al catalogo (`pa1q`, ver arriba), asi que el hueco se corrio al
    // buque insignia de la generacion siguiente: el Galaxy S26.
    //
    // Es REAL: el codename `m1s` y el modelo SM-S942B salen del snapshot de
    // Play (supported_devices.csv); `m1s` es la placa global (modelo B), igual
    // que `e1s` lo es para el S24. La base aun no tiene filas para el S26, asi
    // que la demo contesta "no reconocimos este equipo", que es justo lo que
    // hace un taller frente a un modelo que acaba de salir.
    id: "desconocido",
    label: "Galaxy S26 (SM-S942B)",
    fueraDelCatalogo: true,
    props: {
      "ro.product.device": "m1s",
      "ro.product.model": "SM-S942B",
      "ro.product.manufacturer": "samsung",
      "ro.product.brand": "samsung",
      "ro.build.version.release": "16",
      "ro.build.version.security_patch": "2026-06-01",
      "ro.build.id": "BU1A.260530.001",
      "ro.build.fingerprint":
        "samsung/m1s/m1s:16/BU1A.260530.001/M942BXXU1AXK1:user/release-keys",
      "ro.boot.flash.locked": "1",
      "ro.boot.verifiedbootstate": "green",
      "ro.serialno": "R5CT99ZZZZZ9",
      "sys.boot_completed": "1",
    },
    battery: { levelPct: 68, charging: false },
  },
];

// ---------------------------------------------------------------------------
// Resolución contra el catálogo
// ---------------------------------------------------------------------------

/**
 * Escalera de identificación. Es la misma de `platform.resolve` del escritorio,
 * nivel por nivel, y a propósito.
 *
 * La maqueta no puede decidir distinto que el producto. Antes esta función
 * caminaba por su cuenta y se quedaba con la primera variante que encontraba
 * con `.find()`, de modo que para un codename con varias placas tomaba la
 * primera y le declaraba 0.95 de confianza. Con el Xiaomi de la maqueta eso
 * resolvía a Redmi 7A, cuando el número de modelo que reporta el equipo
 * (M1908C3IC) pertenece al Redmi 8: la demo contradecía al `.exe` en uno de los
 * equipos más comunes de la tienda, y lo hacía con seguridad de más.
 *
 * También pasaba lo contrario: en el nivel de la huella de compilación la
 * escalera decía, en pantalla, "solo se puede usar como pista", y el código de
 * justo debajo tomaba esa pista como respuesta. La escalera describía una
 * decisión que el resolutor no había tomado.
 *
 * La regla es una sola y no tiene excepción: se baja hasta el fondo, y al
 * final o hay una coincidencia única o se entrega la lista de candidatas. Nunca
 * se elige la primera. Cuando hay varias, elegir es inventar, y la diferencia
 * entre las variantes es justo lo que decide qué imagen se puede flashear.
 */
function resolveLocal(props: RawDeviceProps): Resolution {
  const escalera: IdentityLadder[] = [];
  const codename = props["ro.product.device"];
  const modelo = props["ro.product.model"];

  // --- L2: sin codename no hay ancla --------------------------------------
  // Los números de modelo no son globales: dos marcas pueden escribir el mismo,
  // y por eso un número suelto no cruza nada por específico que parezca. El
  // escritorio corta aquí y esta maqueta corta igual, aunque antes no lo hiciera.
  if (!codename) {
    escalera.push({
      level: 2,
      name: "Nombre interno",
      evidence:
        "El equipo no expone ro.product.device. Suele pasar en recovery o en ROMs muy recortadas.",
      confidence: 0.1,
    });
    return {
      match: null,
      ladder: escalera,
      alternatives: [],
      unresolvedReason:
        "El equipo conectado no expone ro.product.device, que es el dato con el que se identifica. Un número de modelo suelto no alcanza: esos números no son globales.",
    };
  }

  const porCodename = DEMO_CATALOG.filter((v) => v.codename === codename);

  escalera.push({
    level: 2,
    name: "Nombre interno (codename)",
    evidence: `ro.product.device = ${codename}`,
    confidence: 0.55,
  });

  // --- L3: el catálogo conoce el codename ---------------------------------
  if (porCodename.length === 1) {
    escalera.push({
      level: 3,
      name: "Coincidencia exacta de codename",
      evidence: `El catálogo tiene una sola variante para "${codename}": ${porCodename[0]!.key}`,
      confidence: 0.85,
    });
    return { match: porCodename[0]!, ladder: escalera, alternatives: [] };
  }

  if (porCodename.length > 1) {
    escalera.push({
      level: 3,
      name: "Codename ambiguo",
      evidence: `"${codename}" corresponde a ${porCodename.length} variantes distintas: ${porCodename.map((v) => v.key).join(", ")}`,
      confidence: 0.5,
    });
  } else {
    escalera.push({
      level: 3,
      name: "Codename no registrado",
      evidence: `El catálogo no tiene ninguna variante con el codename "${codename}".`,
      confidence: 0.2,
    });
  }

  // --- L4: el número de modelo --------------------------------------------
  // Aquí es donde la ambigüedad del nivel 3 se resuelve sola, y bajar no es
  // adivinar: es apoyarse en un dato más específico que el que se quedó
  // atorado. Si el nivel 3 trajo varias placas y aquí hay una sola, se dice cuál
  // es, y con nombre y todo.
  if (modelo) {
    const porModelo = DEMO_CATALOG.filter((v) => v.modelNumbers.includes(modelo));

    if (porModelo.length === 1) {
      escalera.push({
        level: 4,
        name: "Número de modelo",
        evidence: `"${modelo}" pertenece a una sola variante: ${porModelo[0]!.key}`,
        confidence: 0.9,
      });
      return { match: porModelo[0]!, ladder: escalera, alternatives: [] };
    }

    if (porModelo.length > 1) {
      escalera.push({
        level: 4,
        name: "Número de modelo ambiguo",
        evidence: `${modelo} aparece en ${porModelo.length} variantes: ${porModelo.map((v) => v.key).join(", ")}`,
        confidence: 0.45,
      });
      return {
        match: null,
        ladder: escalera,
        alternatives: porModelo,
        unresolvedReason:
          "El codename y el número de modelo apuntan a más de una variante de placa. Elegir una sería inventar: la diferencia entre ellas es exactamente la que define qué imagen se puede flashear.",
      };
    }

    escalera.push({
      level: 4,
      name: "Número de modelo no registrado",
      evidence: `El catálogo no conoce el número de modelo "${modelo}".`,
      confidence: 0.3,
    });
  }

  // --- L5: huella de compilación ------------------------------------------
  // Se declara como pista porque es una pista, y por eso tampoco resuelve: el
  // escritorio entrega las candidatas en lugar de tomar la primera.
  const fp = props["ro.build.fingerprint"];
  if (fp) {
    const pista = fp.split("/")[1];
    const porPista = pista ? DEMO_CATALOG.filter((v) => v.codename === pista) : [];
    if (porPista.length) {
      escalera.push({
        level: 5,
        name: "Pista por huella de compilación",
        evidence: `La huella "${fp}" sugiere el codename "${pista}". Es una pista, no una prueba.`,
        confidence: 0.4,
      });
      return {
        match: null,
        ladder: escalera,
        alternatives: porPista,
        unresolvedReason:
          "Solo se pudo llegar a una pista por la huella de compilación. Con cero codename y cero número de modelo no se afirma nada: una suposición con este nivel de confianza es la forma más rápida de flashear la placa equivocada.",
      };
    }
  }

  // --- L6: se acabó la escalera -------------------------------------------
  escalera.push({
    level: 6,
    name: "Sin resolución",
    evidence: `Se intentó con codename "${codename}"${modelo ? ` y modelo "${modelo}"` : ""}. Ninguno dio una coincidencia única.`,
    confidence: 0.15,
  });

  return {
    match: null,
    ladder: escalera,
    alternatives: porCodename,
    unresolvedReason: porCodename.length
      ? "El codename existe en el catálogo pero con más de una variante, y no hubo un dato más específico que desambiguara."
      : "El catálogo no conoce este equipo. Puede ser un modelo muy nuevo, o de una marca con cobertura baja en la base.",
  };
}

// ---------------------------------------------------------------------------
// Sondas
// ---------------------------------------------------------------------------

interface ProbeDef {
  id: string;
  command: string;
  explanation: string;
  /** Resultado simulado. */
  outcome: "pass" | "fail" | "skip";
  raw: string;
  ms: number;
}

function buildProbes(d: ConnectedDevice, v: DeviceVariant | null): ProbeDef[] {
  const p = d.props;
  const ab = v?.capabilities.includes("a_b_slots") ?? false;

  return [
    {
      id: "boot_completed",
      command: "adb shell getprop sys.boot_completed",
      explanation:
        "Confirma que Android terminó de arrancar. Si devuelve 0, el equipo se quedó en el logo o en un bucle: el problema es de arranque, no de software.",
      outcome: p["sys.boot_completed"] === "1" ? "pass" : "fail",
      raw: p["sys.boot_completed"] ?? "(vacío)",
      ms: 180,
    },
    {
      id: "verified_boot_state",
      command: "adb shell getprop ro.boot.verifiedbootstate",
      explanation:
        "Verde significa que la cadena de arranque verificó el firmware sin modificarlo. Naranja o rojo indica imagen no firmada: es el estado normal de un equipo con bootloader desbloqueado, y no es un defecto.",
      outcome: "pass",
      raw: p["ro.boot.verifiedbootstate"] ?? "unknown",
      ms: 160,
    },
    {
      id: "bootloader_locked",
      command: "adb shell getprop ro.boot.flash.locked",
      explanation:
        "1 = bootloader bloqueado. Mientras siga bloqueado, cualquier firmware que no sea el de fábrica lo rechazará, y un factory reset es la única opción que conserva la garantía.",
      outcome: p["ro.boot.flash.locked"] === "1" ? "pass" : "skip",
      raw: p["ro.boot.flash.locked"] ?? "unknown",
      ms: 150,
    },
    {
      id: "frp_account",
      command: "adb shell pm list accounts | grep -c com.google",
      explanation:
        "Detecta si el restablecimiento de fábrica va a pedir la cuenta de Google anterior. Si la pide, hay que avisarle al cliente ANTES de borrar, no después.",
      outcome: "skip",
      raw: "skipped: requiere consentimiento del cliente para leer cuentas",
      ms: 120,
    },
    {
      id: "battery_health",
      command: "adb shell dumpsys battery",
      explanation:
        "Lee el estado de la celda. Una capacidad de diseño muy por debajo del 100% con carga presente es desgaste real, no restricción de software.",
      outcome: "pass",
      raw: [
        "Current Battery Service state:",
        "  AC powered: true",
        "  USB powered: true",
        "  status: 2",
        "  health: 2",
        "  level: 87",
        "  scale: 100",
        "  voltage: 4243",
        "  temperature: 291",
        "  technology: Li-ion",
      ].join("\n"),
      ms: 420,
    },
    {
      id: "storage_smart",
      command: "adb shell dumpsys diskstats | grep -i wear",
      explanation:
        "Porcentaje de desgaste de la memoria. Arriba de 80% la parte lenta del equipo (apps, cámara) empieza a fallar y el cliente lo reporta como 'se Lagging'.",
      outcome: "pass",
      raw: "Wear_levelling: 3\nTotal_Lifetime_Writes: 118.4 TB\nPercentage_Used: 6%",
      ms: 380,
    },
    {
      id: "slot_health",
      command: "adb shell getprop ro.boot.slot_suffix",
      explanation: ab
        ? "Los dos slots de arranque están sanos. Con A/B, un flasheo fallido no deja el equipo sin arranque: se cambia de ranura y sigue viva."
        : "Solo hay una partición de arranque. No hay red de seguridad: si el flasheo se interrumpe, el equipo no vuelve a encender.",
      outcome: ab ? "pass" : "skip",
      raw: ab ? "_a" : "sin ranura B declarada",
      ms: 140,
    },
    {
      id: "network_register",
      command: "adb shell dumpsys telephony.registry | grep mServiceState",
      explanation:
        "Verifica registro en la red. Un equipo importado de Estados Unidos puede quedarse sin señal si la banda no coincide con las redes mexicanas: n28 (700 MHz APT) es la clave.",
      outcome: "pass",
      raw: "mServiceState=0 (REGISTRATION_COMPLETE)\nmSignalStrength=SignalStrength{gsm:21}",
      ms: 520,
    },
  ];
}

// ---------------------------------------------------------------------------
// Estado interno
// ---------------------------------------------------------------------------

let currentSim = SIMULADOS[0];
const listeners = new Set<(d: ConnectedDevice[]) => void>();

let licenseState: LicenseState = {
  tier: "free",
  valid: true,
  usedToday: 0,
  dailyLimit: 2,
};

function toDevice(s: Simulated): ConnectedDevice {
  return {
    id: `sim:${s.id}`,
    transport: "simulated" as TransportKind,
    serial: s.props["ro.serialno"] ?? s.id,
    props: s.props,
    battery: s.battery,
    connectedAt: new Date().toISOString(),
  };
}

function current(): ConnectedDevice[] {
  return currentSim ? [toDevice(currentSim)] : [];
}

function emit() {
  const snap = current();
  for (const cb of listeners) cb(snap);
}

// ---------------------------------------------------------------------------
// El puente
// ---------------------------------------------------------------------------

export function createBrowserBridge(): FmpBridge & { setSim(id: string): void } {
  return {
    platform: "browser",
    version: "0.1.0-demo",

    onDevice(cb) {
      listeners.add(cb);
      return () => listeners.delete(cb);
    },

    async listDevices() {
      await sleep(120);
      return current();
    },

    async resolve(props) {
      // La resolución real debe ser instantánea: por eso el .exe mantiene el
      // SQLite abierto. Aquí se simula una lectura de disco.
      await sleep(180);
      return resolveLocal(props);
    },

    async lookupByModelNumber(modelNumber) {
      return DEMO_CATALOG.filter((v) => v.modelNumbers.includes(modelNumber));
    },

    async runProbes(deviceId, onProgress) {
      const d = current().find((x) => x.id === deviceId) ?? current()[0];
      if (!d) {
        return [
          {
            id: "sin-equipo",
            state: "fail",
            explanation:
              "No hay ningun equipo simulado conectado. Vuelve a elegir uno en la lista de abajo.",
          },
        ];
      }
      const v = resolveLocal(d.props).match;
      const defs = buildProbes(d, v);
      const out: ProbeResult[] = [];

      for (const def of defs) {
        const running: ProbeResult = {
          id: def.id,
          state: "running",
          command: def.command,
          explanation: def.explanation,
        };
        onProgress(running);

        await sleep(def.ms);

        const done: ProbeResult = {
          id: def.id,
          state: def.outcome,
          command: def.command,
          explanation: def.explanation,
          raw: def.raw,
          durationMs: def.ms,
        };
        out.push(done);
        onProgress(done);
      }

      return out;
    },

    license: {
      async current() {
        return licenseState;
      },

      async activate(env: LicenseEnvelope) {
        // La demo web NO valida firmas: eso requiere la clave privada del
        // emisor, que no viaja con la app. Una demo que "valida" firmas
        // sería mentira. Se marca como tal y se pide usar el .exe.
        try {
          const payload = JSON.parse(
            Buffer.from(env.payload, "base64url").toString("utf8"),
          ) as { tier?: string; subject?: string; exp?: number };

          licenseState = {
            tier: payload.tier === "premium" ? "premium" : "free",
            valid: payload.tier === "premium",
            subject: payload.subject,
            issuedAt: new Date().toISOString(),
            expiresAt: payload.exp ? new Date(payload.exp * 1000).toISOString() : undefined,
            reason:
              payload.tier === "premium"
                ? undefined
                : "La demo web no verifica firmas Ed25519. Actívala en la app de escritorio para validación real.",
            usedToday: 0,
            dailyLimit: undefined,
          };
        } catch {
          licenseState = {
            ...licenseState,
            valid: false,
            reason: "No se pudo leer el contenido de la licencia.",
          };
        }
        return licenseState;
      },

      async loadFromDisk() {
        licenseState = {
          ...licenseState,
          reason: "El navegador no tiene disco. Activa la licencia pegando su contenido.",
        };
        return licenseState;
      },
    },

    async saveReport(draft: ReportDraft) {
      // Descarga real: el navegador sí puede entregar un archivo.
      const blob = new Blob([renderReportText(draft)], { type: "text/plain;charset=utf-8" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `fixmyphone-${draft.device.serial}.txt`;
      a.click();
      URL.revokeObjectURL(url);
      return { ok: true, path: a.download };
    },

    async reveal() {
      /* sin equivalente en navegador */
    },

    setSim(id: string) {
      const found = SIMULADOS.find((s) => s.id === id);
      if (!found) return;
      currentSim = found;
      licenseState = { tier: "free", valid: true, usedToday: 0, dailyLimit: 2 };
      emit();
    },
  };
}

export { SIMULADOS };

/** Volcado de texto plano. El PDF firmado llega en una fase posterior. */
function renderReportText(d: ReportDraft): string {
  const L: string[] = [];
  const rule = "=".repeat(64);
  L.push(rule, "INFORME FIXMYPHONE", rule);
  L.push(`Generado:       ${new Date().toLocaleString("es-MX")}`);
  L.push(`Plan:           ${d.license.tier}`);
  L.push("");
  L.push("-- EQUIPO " + "-".repeat(54));
  L.push(`Variante:       ${d.resolution.match?.key ?? "sin identificar"}`);
  L.push(`Nombre:         ${d.resolution.match?.marketingName ?? "-"}`);
  L.push(`SoC:            ${d.resolution.match?.soc ?? "-"}`);
  L.push(`Número de modelo: ${d.device.props["ro.product.model"] ?? "-"}`);
  L.push(`Serie:          ${d.device.serial}`);
  L.push("");
  if (d.resolution.match?.riskFlags.length) {
    L.push("-- RIESGOS " + "-".repeat(55));
    for (const f of d.resolution.match.riskFlags) L.push(`  * ${f}`);
    L.push("");
  }
  L.push("-- PRUEBAS " + "-".repeat(55));
  for (const p of d.probes) L.push(`  ${p.state.toUpperCase().padEnd(8)} ${p.id}`);
  L.push("", rule);
  if (d.watermarked) L.push("INFORME DE EVALUACIÓN — requiere licencia Premium");
  return L.join("\n");
}
