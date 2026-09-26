/**
 * Sondas de diagnóstico.
 * ===========================================================================
 *
 * Una sonda es UNA pregunta que se le hace al equipo, con el comando exacto que
 * la hace. Tres reglas que no se rompen:
 *
 *   1. SOLO LECTURA. Ni una sola sonda escribe en el equipo. No hay flasheo,
 *      no hay borrado, no hay `fastboot flashing`, no hay `adb shell su`.
 *      La herramienta diagnostica. La intervención la hace el técnico, a
 *      mano, con el comando que la pantalla le sugiere.
 *
 *   2. SIEMPRE SE MUESTRA EL COMANDO. `ProbeResult.command` lleva el comando
 *      literal. Si el técnico discrepa del resultado, puede correrlo él mismo en
 *      una consola y comparar. Una sonda que no se puede reproducir no es un
 *      diagnóstico: es una adivinanza.
 *
 *   3. EL ERROR ES UN RESULTADO. Si una sonda falla porque el comando no existe
 *      o porque el permiso se niega, eso se informa con el texto real, no se
 *      esconde. Un `skip` con explicación es más útil que un `pass` inventado.
 *
 * Lo que aquí NO va, y no se va a agregar después:
 *
 *   - Escribir el IMEI o el ESN. Es delito en México por la LFPI, y es una vía
 *     penal en casi todos los países. No hay botón, ni atajo, ni "modo
 *     avanzado" que lo habilite.
 *   - Quitar el FRP o el bloqueo de activación de Google.
 *   - Exploits de arranque profundo: EDL en Secure Test Mode, brom, kunzhi.
 *     Los `risk_flags` del catálogo describen cuándo aplican, para que el
 *     técnico LO DECIDA con su propia cabeza y su propia responsabilidad, no
 *     porque un botón de la app se lo facilite.
 */

import type { ConnectedDevice, ProbeResult } from "@fixmyphone/core";
import { execFile } from "node:child_process";

// ---------------------------------------------------------------------------
// Ejecución
// ---------------------------------------------------------------------------

const TIMEOUT_MS = 10_000;

function sh(
  bin: string,
  args: string[],
): Promise<{ ok: boolean; out: string; code: number }> {
  return new Promise((resolve) => {
    execFile(
      bin,
      args,
      { timeout: TIMEOUT_MS, windowsHide: true, maxBuffer: 2 * 1024 * 1024 },
      (err, stdout, stderr) => {
        const code =
          err && typeof (err as { code?: unknown }).code === "number"
            ? Number((err as { code: number }).code)
            : err
              ? 1
              : 0;
        resolve({ ok: code === 0, out: `${stdout}${stderr}`.trim(), code });
      },
    );
  });
}

/** Corta la salida para no reventar la vista ni el IPC. */
function clip(s: string, max = 4000): string {
  return s.length <= max ? s : `${s.slice(0, max)}\n… (${s.length - max} caracteres más)`;
}

// ---------------------------------------------------------------------------
// Definición de sondas
// ---------------------------------------------------------------------------

interface ProbeDef {
  id: string;
  /** Etiqueta corta para la lista, en español. */
  name: string;
  /** Solo si el transporte es ADB con Android encendido. */
  adb?: { args: string[]; explain: (out: string) => string };
  /** Solo si el transporte es fastboot. */
  fastboot?: { args: string[]; explain: (out: string) => string };
}

const DEFS: ProbeDef[] = [
  {
    id: "arranque",
    name: "Arranque completado",
    adb: {
      args: ["shell", "getprop", "sys.boot_completed"],
      explain: (out) =>
        out.trim() === "1"
          ? "Android terminó de arrancar. La partición de datos ya se descifró y el sistema está en pie."
          : `El sistema reporta boot_completed="${out.trim()}". Puede estar en el primer arranque, o congelado antes de montar los datos.`,
    },
  },
  {
    id: "verificacion-inicial",
    name: "Verificación de arranque (AVB)",
    adb: {
      args: ["shell", "getprop", "ro.boot.verifiedbootstate"],
      explain: (out) => {
        const v = out.trim();
        if (v === "green") return "Verificación correcta. La cadena de arranque comprobó las particiones firmadas por el fabricante.";
        if (v === "yellow") return "Amarillo: verificación parcial. Ocurre en equipos con bootloader bloqueado y clave de verificación propia del fabricante.";
        if (v === "red") return "ROJO. La cadena de arranque NO verificó. Lo producen un parche de boot o una vbmeta dañada, y también un Samsung con el eFuse ya quemado.";
        if (v === "orange") return "Naranja: la verificación se saltó. Suele indicar un bootloader desbloqueado, o una vbmeta parcheada.";
        return v
          ? `Estado "${v}", que no es un valor de AVB conocido. Se muestra tal cual.`
          : "Sin dato: el equipo no expone esta propiedad.";
      },
    },
  },
  {
    id: "bloqueo-flash",
    name: "Bloqueo de escritura (flash lock)",
    adb: {
      args: ["shell", "getprop", "ro.boot.flash.locked"],
      explain: (out) => {
        const v = out.trim();
        if (v === "1") return "Bloqueado. No se puede flashear nada sin desbloquear antes, y el desbloqueo borra los datos del usuario.";
        if (v === "0") return "DESBLOQUEADO. El equipo ya fue desbloqueado: se puede flashear, y también se puede alterar la vbmeta.";
        return v ? `Valor "${v}", no reconocido.` : "Sin dato.";
      },
    },
  },
  {
    id: "estado-vbmeta",
    name: "Estado del eFuse (vbmeta)",
    adb: {
      args: ["shell", "getprop", "ro.boot.vbmeta.device_state"],
      explain: (out) => {
        const v = out.trim();
        if (v === "locked")
          return "Integridad intacta. Desbloquear el bootloader quemará este eFuse de forma irreversible en la mayoría de los Qualcomm y en todos los Samsung: no hay vuelta atrás.";
        if (v === "unlocked") return "eFuse ya quemado: el desbloqueo es irreversible en este equipo.";
        if (v === "orange") return "Naranja: hay una clave de verificación que no es la de fábrica.";
        return v
          ? `Valor "${v}".`
          : "Sin dato. En los Qualcomm más antiguos no existe eFuse, así que la ausencia es normal.";
      },
    },
  },
  {
    id: "particiones",
    name: "Esquema de particiones",
    adb: {
      args: ["shell", "getprop", "ro.boot.dynamic_partitions"],
      explain: (out) => {
        const v = out.trim();
        if (v === "1")
          return "Particiones dinámicas (A/B o A/C). El equipo tiene dos ranuras y una está inactiva: hay que saber cuál antes de escribir nada.";
        if (v === "0")
          return "Particiones fijas, solo ranura A. Escribir en la ranura B no es posible, y un flasheo mal dirigido deja el equipo sin arranque.";
        return v ? `Valor "${v}".` : "Sin dato.";
      },
    },
  },
  {
    id: "ranura-activa",
    name: "Ranura activa",
    adb: {
      args: ["shell", "getprop", "ro.boot.slot_suffix"],
      explain: (out) => {
        const v = out.trim();
        if (v === "_a")
          return "Ranura A activa. Un flasheo va a la A; para dejar las dos iguales hay que hacerlo también a la B.";
        if (v === "_b") return "Ranura B activa.";
        if (v === "") return "Sin ranura: equipo de partición única, que es lo normal en los de gama baja.";
        return `Sufijo "${v}".`;
      },
    },
  },
  {
    id: "cifrado",
    name: "Cifrado de datos",
    adb: {
      args: ["shell", "getprop", "ro.crypto.state"],
      explain: (out) => {
        const v = out.trim();
        if (v === "encrypted")
          return "Los datos del usuario están cifrados con el soporte del hardware. Un flasheo sin --wipe-data deja el equipo sin poder descifrar, y Android entra en modo de emergencia.";
        if (v === "decrypted")
          return "Descifrado: normal, el equipo ya completó el primer arranque con la pantalla de seguridad puesta.";
        if (v === "unsupported")
          return "El equipo declara no soportar cifrado. Todos los equipos de fábrica lo soportan, así que esto sugiere una build modificada.";
        return v ? `Estado "${v}".` : "Sin dato.";
      },
    },
  },
  {
    id: "selinux",
    name: "SELinux",
    adb: {
      args: ["shell", "getprop", "ro.boot.selinux"],
      explain: (out) => {
        const v = out.trim();
        if (v === "enforcing")
          return "Aplicando. Es el estado de fábrica y el que debe quedar después de cualquier intervención.";
        if (v === "permissive")
          return "PERMISIVO: el control de acceso está desactivado. Si el equipo venía así de fábrica, es una ROM modificada; si se cambió, hay que saber quién y por qué antes de entregarlo.";
        if (v === "disabled")
          return "DESACTIVADO por completo. Es el estado de fábrica de algunos equipos chinos de gama baja; en el resto, es señal de que alguien intervino el sistema.";
        return v ? `Modo "${v}".` : "Sin dato.";
      },
    },
  },
  {
    id: "bateria",
    name: "Batería",
    adb: {
      args: ["shell", "dumpsys", "battery"],
      explain: (out) => {
        const nivel = /level:\s*(\d+)/i.exec(out);
        const salud = /health:\s*(\d)/i.exec(out);
        const temp = /temperature:\s*(\d+)/i.exec(out);
        const partes: string[] = [];
        if (nivel) partes.push(`carga ${nivel[1]}%`);
        if (temp) partes.push(`temperatura ${(Number(temp[1]) / 10).toFixed(1)} °C`);
        if (salud) {
          const tabla: Record<string, string> = {
            "1": "desconocida",
            "2": "buena",
            "3": "sobrecalentada",
            "4": "muerta",
            "5": "muy buena",
            "6": "dañada",
            "7": "fría",
          };
          partes.push(`salud ${tabla[salud[1]!] ?? salud[1]}`);
        }
        return partes.length ? partes.join(" · ") : "No se pudo leer dumpsys battery.";
      },
    },
  },
  {
    id: "almacenamiento",
    name: "Almacenamiento",
    adb: {
      args: ["shell", "df", "-h", "/data"],
      explain: (out) => out.split(/\r?\n/).slice(-4).join("\n") || "Sin salida.",
    },
  },
  {
    id: "tipo-cifrado",
    name: "Tipo de cifrado",
    adb: {
      args: ["shell", "getprop", "ro.crypto.type"],
      explain: (out) => {
        const v = out.trim();
        if (v === "file") return "Cifrado de archivo en /data, típico de Android 7 a 9.";
        if (v === "block") return "Cifrado por bloque (FBE), típico de Android 10 en adelante. Es el estándar actual.";
        return v ? `Tipo "${v}".` : "Sin dato.";
      },
    },
  },
  {
    id: "baseband",
    name: "Módem",
    adb: {
      args: ["shell", "getprop", "gsm.version.baseband"],
      explain: (out) => {
        const v = out.trim();
        if (!v)
          return "Sin dato. En Android 10 o superior la propiedad puede estar restringida sin permisos de shell del fabricante.";
        return `Baseband ${v}. Si el equipo llegó de EEUU con la banda base de la operadora de allá, no tendrá cobertura en México aunque la red sea correcta.`;
      },
    },
  },

  // --- Solo fastboot --------------------------------------------------------
  {
    id: "fastboot-slot",
    name: "Ranura activa (fastboot)",
    fastboot: {
      args: ["getvar", "current-slot"],
      explain: (out) => {
        const m = /current-slot:\s*(\S+)/i.exec(out);
        if (!m) return out || "El bootloader no devolvió current-slot.";
        const s = m[1]!.toLowerCase();
        if (s === "a")
          return "Ranura A activa. Escribir en la B no cambiaría nada visible y el equipo seguiría arrancando con la versión vieja.";
        if (s === "b")
          return "Ranura B activa. Cualquier escritura a la A se pierde en el próximo reinicio.";
        return `Ranura "${s}".`;
      },
    },
  },
  {
    id: "fastboot-unlocked",
    name: "Estado de desbloqueo (fastboot)",
    fastboot: {
      args: ["getvar", "unlocked"],
      explain: (out) => {
        if (/unlocked:\s*yes/i.test(out))
          return "DESBLOQUEADO. Ya se puede escribir cualquier partición, con las consecuencias que eso tenga en la garantía y en el eFuse.";
        if (/unlocked:\s*no/i.test(out))
          return "Bloqueado. El primer desbloqueo borra los datos del usuario y, en la mayoría de fabricantes, marca el eFuse de forma irreversible.";
        return out || "Este bootloader no expone unlocked; hace falta otro método para saberlo.";
      },
    },
  },
  {
    id: "fastboot-producto",
    name: "Producto declarado (fastboot)",
    fastboot: {
      args: ["getvar", "product"],
      explain: (out) => {
        const m = /product:\s*(\S+)/i.exec(out);
        return m ? `Producto declarado por el bootloader: ${m[1]}.` : out || "Sin dato.";
      },
    },
  },
  {
    id: "fastboot-slot-count",
    name: "Número de ranuras",
    fastboot: {
      args: ["getvar", "slot-count"],
      explain: (out) => {
        const m = /slot-count:\s*(\S+)/i.exec(out);
        if (!m)
          return out || "El bootloader no declara número de ranuras. En la mayoría de los equipos con A/B son dos.";
        return `El bootloader declara ${m[1]} ranuras. Un 1 significa que escribir en la otra ranura no es posible.`;
      },
    },
  },
];

// ---------------------------------------------------------------------------
// Ejecución de la batería
// ---------------------------------------------------------------------------

function binFor(device: ConnectedDevice): string {
  return device.transport === "fastboot" ? "fastboot" : "adb";
}

async function runProbe(device: ConnectedDevice, def: ProbeDef): Promise<ProbeResult> {
  const base: ProbeResult = { id: def.id, state: "pending", explanation: "" };
  const spec = device.transport === "fastboot" ? def.fastboot : def.adb;

  if (!spec) {
    return {
      ...base,
      state: "skip",
      explanation:
        device.transport === "fastboot"
          ? "No aplica en fastboot: aquí no hay Android corriendo."
          : "Solo aplica cuando el equipo está en modo fastboot.",
    };
  }

  const bin = binFor(device);
  const args = ["-s", device.serial, ...spec.args];
  const comando = `${bin} ${args.join(" ")}`;
  const t0 = Date.now();

  try {
    const r = await sh(bin, args);
    return {
      ...base,
      state: r.ok ? "pass" : "fail",
      command: comando,
      raw: clip(r.out),
      explanation: spec.explain(r.out),
      durationMs: Date.now() - t0,
    };
  } catch (e) {
    return {
      ...base,
      state: "fail",
      command: comando,
      explanation: `No se pudo ejecutar: ${e instanceof Error ? e.message : String(e)}. Revisa si ${bin} está en el PATH.`,
      durationMs: Date.now() - t0,
    };
  }
}

/**
 * Corre todas las sondas que apliquen al transporte del equipo.
 *
 * Van EN SERIE, no en paralelo. Cuatro `adb shell` simultáneos sobre un
 * teléfono de gama baja con 2 GB de RAM se cancelan entre ellos y los
 * resultados salen incompletos sin ningún aviso. Además así el técnico ve la
 * lista avanzar, que es la mitad de lo que hace útil un diagnóstico.
 */
export async function runAllProbes(
  device: ConnectedDevice,
  onProgress: (r: ProbeResult) => void,
): Promise<ProbeResult[]> {
  const resultados: ProbeResult[] = [];
  for (const def of DEFS) {
    const r = await runProbe(device, def);
    resultados.push(r);
    onProgress(r);
  }
  return resultados;
}

/** Nombres de las sondas, para la interfaz antes de correrlas. */
export const PROBE_NAMES: Record<string, string> = Object.fromEntries(
  DEFS.map((d) => [d.id, d.name]),
);
