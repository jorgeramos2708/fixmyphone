/**
 * Clave pública del emisor de licencias.
 * ===========================================================================
 *
 * Solo la clave PÚBLICA viaja dentro del `.exe`. La privada se queda en
 * `~/.fixmyphone/issuer.key` en la máquina de quien emite, y nunca se
 * distribuye. Quien tenga únicamente este archivo puede VERIFICAR licencias,
 * pero no puede emitir ninguna: es la única asimetría que importa aquí.
 *
 * Para rotar la clave:
 *   1. `fmp-license keygen` en una carpeta nueva (mueve el .key viejo).
 *   2. Copia aquí el valor que imprime.
 *   3. Recompila.
 * Las licencias emitidas con la clave anterior dejan de aceptarse. Es
 * intencional: la rotación es el mecanismo de invalidación.
 *
 * ESTA ES LA CLAVE DE DEMOSTRACIÓN. La que se usa para emitir las licencias de
 * ejemplo del repositorio, no una clave de producción. Quien la tenga puede
 * emitirse el premium que quiera, y por eso el repositorio la publica: es un
 * producto de taller que se vende por confianza, no por suscripción. Cuando
 * haya clientes reales, esta constante se sustituye por la clave de la
 * empresa y la de aquí se revoca.
 */

export const ISSUER_PUBLIC_KEY_B64URL =
  "m_rd4z1NmRaFIuEKVNKzOrFQXNVI0j_LADP4JhJHuZI";

/** Los 32 bytes crudos, que es lo que espera `verifyLicense`. */
export const ISSUER_PUBLIC_KEY: Buffer = Buffer.from(
  ISSUER_PUBLIC_KEY_B64URL,
  "base64url",
);
