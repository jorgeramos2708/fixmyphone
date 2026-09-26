/**
 * Identificación de la instalación.
 * ===========================================================================
 *
 * DE QUÉ SE TRATA Y POR QUÉ NO ES MÁS SIMPLE
 * ------------------------------------------
 * Una licencia puede estar atada a un equipo: "esta licencia funciona en ESTE
 * Windows, no en otro". Para saber si el equipo es el mismo hace falta una
 * huella. Las opciones y por qué se descartó cada una:
 *
 *   - MAC de la tarjeta de red. Cambia al cambiar de placa, y en equipos con
 *     varias tarjetas hay que decidir cuál cuenta. Además es dato de red.
 *   - Número de serie del equipo (DMI). Es el mejor identificador del mundo y
 *     se lee con `wmic`, que Microsoft retiró de Windows 11 24H2. Quedaría
 *     `wmic` en unos equipos y no en otros, y la misma licencia valdría o no
 *     según la versión de Windows del taller. Inaceptable.
 *   - CPUID, id del disco. Requieren leer registros o bytes del disco.
 *
 *   Se usa el NOMBRE DE USUARIO más el SERIAL DEL VOLUMEN del sistema. Las dos
 *   cosas salen de `node:fs` y `node:os`, sin módulos nativos y sin shelling
 *   out, que es lo que hace que esto funcione en un `.exe` empaquetado sin
 *   recompilar nada.
 *
 * EL COSTO, DICHO EN VOZ ALTA
 * ---------------------------
 * Reinstalar Windows cambia el serial del volumen. Renombrar la cuenta de
 * usuario cambia el nombre. En cualquiera de los dos casos una licencia atada
 * deja de validar y el taller tiene que pedir otra.
 *
 * Eso es un costo real y es la razón por la que la ATADURA ES OPCIONAL: la
 * licencia por omisión es portátil. A un taller que le bothersa reinstalar
 * Windows dos veces al año se le vende una licencia portátil, que es lo que
 * quiere. A un distribuidor que quiere atar a un equipo se le emite atada, y se
 * le dice antes de cobrar, en la pantalla de licencia, no después.
 *
 * La app nunca inventa un id de máquina distinto al que emitió el vendedor:
 * si divergen, la licencia no valida y el taller ve un rechazo, no un cobro
 * perdido en silencio.
 */

import { statSync } from "node:fs";
import { userInfo, homedir } from "node:os";
import { deriveMachineId } from "./index.ts";

/** Las dos piezas de las que sale el id, para poder mostrarlas al usuario. */
export interface MachineIdParts {
  /** Nombre de la cuenta de Windows. */
  usuario: string;
  /**
   * Serial del volumen del sistema, en hexadecimal de 8 dígitos.
   *
   * En Windows, `fs.Stats.dev` es el número de serie del volumen, que es
   * exactamente lo que muestra `vol` en la consola. En POSIX es el número de
   * dispositivo, y también sirve para el propósito: es estable mientras el
   * sistema no se reinstale.
   */
  volumen: string;
  /** El id completo, listo para poner en la licencia. */
  id: string;
}

export function machineIdParts(): MachineIdParts {
  const usuario = safe(() => userInfo().username, "?");
  const dev = safe(() => statSync(homedir()).dev, 0);
  const volumen = dev.toString(16).toUpperCase().padStart(8, "0");
  return { usuario, volumen, id: deriveMachineId(usuario, volumen) };
}

/** El id listo para usar. Es lo que va en `machineId` al verificar. */
export function machineId(): string {
  return machineIdParts().id;
}

function safe<T>(fn: () => T, respaldo: T): T {
  try {
    return fn();
  } catch {
    return respaldo;
  }
}
