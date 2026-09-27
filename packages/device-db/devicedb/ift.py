"""Padron de equipos homologados del IFT: fuentes, cruce y los tres estados.

De donde sale
-------------
El padron oficial no se puede leer. La pagina "Lista de Equipos Homologados"
del IFT (https://www.ift.org.mx/industria/lista-de-equipos-homologados, sigue
en linea) tiene el padron dentro de un iframe que apunta a
https://sicet.cft.gob.mx/publiHomologacion/paginas/EquipoHomologado.faces, una
aplicacion JSF en el dominio de la CFT, que fue disuelta en 2014. Ese host ya
no resuelve. El IFT completo es un archivo historico; la autoridad vigente es
la CRT (https://www.gob.mx/crt), que no publica el padron en HTML.

Lo que si se puede leer son las paginas de cada marca, donde cada fabricante
publica sus propios certificados. Es una fuente secundaria, no oficial: sirve
para saber que modelo esta homologado y con que folio, y no cubre mas que los
equipos que la marca vende hoy en Mexico. Lo que no aparece ahi no es prueba de
que no este homologado, y por eso el estado por omision no es "no homologado".

Los tres estados, y por que son tres
------------------------------------
homologado     Se encontro el modelo en el padron de la marca, con su folio.
               Unico estado que afirma que el equipo SI esta homologado.

sin_verificar Se busco en el padron de la marca y el modelo no aparece.
               Se_BUSCO_. Por eso el tooltip puede decir "no encontrado en el
               padron IFT" sin mentir.

desconocido    No hay padron para esa marca, asi que no se busco. Es el valor
               por omision, y se queda en las marcas que no tienen pagina
               certificadora accesible. Confundirlo con "sin_verificar"
               seria afirmar que se busco algo que nunca se busco.

no_soportado  No lo pone el pipeline. Se deja para confirmacion explicita de
               una persona, en manual/devices.override.yml. Un automatismo
               que declara "esto no se puede reparar" sin que nadie lo haya
               firmado es exactamente el tipo de Conclusion que hace que un
               taller rechace un equipo reparable.
"""

from __future__ import annotations

import re
from dataclasses import dataclass, field

from .util import RAW, fetch, log, now_iso

# ------------------------------------------------------------------ estados

HOMOLOGADO = "homologado"
SIN_VERIFICAR = "sin_verificar"
DESCONOCIDO = "desconocido"
NO_SOPORTADO = "no_soportado"

ESTADOS = (HOMOLOGADO, SIN_VERIFICAR, DESCONOCIDO, NO_SOPORTADO)

# Texto que explica cada estado. Aparece en el reporte del pipeline, en el
# informe firmado de la app y en la pantalla.
#
# LA PRIMERA FRASE ES LA QUE CUENTA
# ---------------------------------
# Cada texto empieza por lo que el estado AFIRMA, no por una ausencia. "Sin
# verificar" abriendo la entrada de DESCONOCIDO era justo el error: se lee como
# resultado negativo, cuando lo que significa es que nadie busco. Y como esta
# tabla tambien es la que se imprime en run_report.md, la frase que abre queda
# ahi escrita para quien lo lea en un ano.
#
# Ojo: este texto y el TOOLTIP_HOMOLOGACION de packages/core/src/bridge.ts son
# la misma idea en dos lenguajes, porque uno se genera en Python y el otro se
# compila con TypeScript. Si se cambia una frase, se cambia en los dos lados, o
# el reporte del pipeline y la app terminan diciendo cosas distintas.
TOOLTIP: dict[str, str] = {
    HOMOLOGADO: "Homologado por el IFT. Folio encontrado en la tabla de "
                "certificados de la marca.",
    SIN_VERIFICAR: "No esta en el padron del IFT. Se busco en la tabla de "
                   "certificados de la marca y el modelo no aparece; eso no "
                   "significa que no este homologado, ni que el equipo sea "
                   "ilegal, ni que no se pueda reparar.",
    DESCONOCIDO: "No se ha buscado. No hay una tabla de certificados del IFT "
                 "accesible para esta marca, asi que no se consulto nada. No es "
                 "un resultado negativo.",
    NO_SOPORTADO: "Marcado como no soportado por confirmacion manual. Este "
                  "equipo esta fuera del alcance de la herramienta.",
}

# El padron del IFT se publico como sitio vivo mientras la CFT existio, y desde
# 2014 solo queda la tabla de cada marca. Ninguna de las dos tiene fecha de
# "ultima actualizacion" que se pueda leer, asi que no se inventa: lo que se
# guarda es cuando se consulto, que es lo unico cierto.


# ------------------------------------------------------------------ modelos

_NO_ALFANUM = re.compile(r"[^A-Z0-9]")


def clave_modelo(modelo: str) -> str:
    """Llave de cruce de un numero de modelo.

    Mayusculas y solo alfanumericos, para que "XT2239-9", "xt2239 9" y
    "XT2239_9" den la misma llave. Sin acentos ni guiones, porque el guion es
    decoracion: el modelo es XT22399.
    """
    return _NO_ALFANUM.sub("", (modelo or "").upper())


# Folio de certificado del IFT. Tres letras del titular, tres o cuatro del
# modelo, dos del anio, guion y folio. Cada marca usa su propio codigo, y por
# eso el patron es generico y no una lista de prefijos:
#   OPPO   JUOPCP26-00023609   (JUO = titular, PCP = modelo)
#   OPPO   RCPOPCP22-3048     (RCP = titular, foliado corto)
#   Motorola RTIMOXT22-3427   (RTI = titular, MOXT = modelo)
#   Motorola MOMOXT22-16676
# Nota: el prefijo "IFT " aparece en unas celdas y en otras no.
_CERTIFICADO = re.compile(r"^(?:IFT\s+)?([A-Z]{3}[A-Z]{3,4}\d{2}-\d{3,8})$")
_MODELO_MOTOROLA = re.compile(r"^XT\d{3,5}-\d+$", re.IGNORECASE)


def parse_certificado(texto: str) -> str:
    """Saca el folio de un certificado, o "" si el texto no es un folio."""
    m = _CERTIFICADO.match((texto or "").strip())
    return m.group(1) if m else ""


# ------------------------------------------------------------------ padron

@dataclass
class Equipo:
    """Un renglon del padron: lo que una marca declara como homologado."""

    marca: str          # clave canonica, de brands.resuelve()
    modelo: str         # numero de modelo tal como lo publica la marca
    nombre: str         # nombre comercial
    certificado: str    # folio del IFT
    url: str            # de donde se saco
    consultado: str = ""

    @property
    def clave(self) -> str:
        return clave_modelo(self.modelo)


@dataclass
class Padron:
    """Lo que se pudo leer del padron, con lo que faltó a la vista."""

    equipos: list[Equipo] = field(default_factory=list)
    marcas: set[str] = field(default_factory=set)       # marcas con padron leido
    marcas_sin_padron: set[str] = field(default_factory=set)
    avisos: list[str] = field(default_factory=list)
    _indice: dict[tuple[str, str], "Equipo"] | None = field(
        default=None, repr=False, compare=False)

    def indexar(self) -> dict[tuple[str, str], Equipo]:
        """(marca, clave de modelo) -> equipo.

        Se indexa por marca tambien, y no solo por modelo, a proposito: hay
        modelos que se repiten entre marcas y un folio de OPPO no homologa un
        equipo de otra marca que se llame igual.

        Aqui no se avisa de dos modelos distintos con el mismo folio. Eso es
        normal y no es un error: un certificado puede cubrir una familia de
        equipos, y OPPO publica el mismo folio para el A6t y el A6k. Como el
        indice es por modelo, los dos se guardan bien y ambos salen
        homologados. El aviso de aqui es para lo otro: el MISMO modelo con dos
        folios distintos, que si es un dato que hay que mirar.

        El resultado se cachea. Antes se recalculaba en cada llamada y cada
        llamada anadia otra vez el aviso, de modo que cruzar las variantes dos
        veces lo duplicaba y el informe acababa hablando de lo mismo dos veces.

        La cache es valida mientras no se toque `equipos` despues de indexar,
        que es lo que hace el pipeline: se arma el padron, se indexa, se cruza.
        """
        if self._indice is not None:
            return self._indice
        out: dict[tuple[str, str], Equipo] = {}
        for e in self.equipos:
            k = (e.marca, e.clave)
            if k in out:
                self.avisos.append(
                    f"{e.marca} {e.modelo} ({e.nombre}) sale con dos folios: "
                    f"{out[k].certificado} y {e.certificado}. Un modelo no "
                    f"deberia tener dos; se queda el primero y se revisa."
                )
                continue
            out[k] = e
        self._indice = out
        return out

    def certificados_de(self, marca: str) -> list[Equipo]:
        return [e for e in self.equipos if e.marca == marca]


# ------------------------------------------------------------------ parsers

_TAG = re.compile(r"<[^>]+>")


def _texto(html: str) -> str:
    return re.sub(r"\s+", " ", _TAG.sub(" ", html).replace("&nbsp;", " ")).strip()


_CELDA_OPPO = re.compile(
    r'<div\s+data-label="([^"]+)"[^>]*>([\s\S]*?)</div>', re.IGNORECASE)
# Etiquetas de la tabla, ya sin acentos ni mayusculas.
_ETIQUETA_OPPO = {"núm.": "n", "num.": "n", "modelo": "modelo",
                  "nombre comercial": "nombre", "núm. ift": "ift",
                  "num. ift": "ift"}


def parse_oppo(html: str, url: str, consultado: str) -> list[Equipo]:
    """Lee https://www.oppo.com/mx/ift/

    La pagina no usa <table>: cada renglón son cuatro <div> que se identifican
    por su atributo `data-label`, sin clase de CSS que los distinga.

    Se leen las celdas en orden de documento y se agrupan de cuatro en cuatro
    en vez de partir el HTML por bloques. La diferencia no es academica: un
    parser que parte por `<div class="info-item">` tiene que adivinar donde
    acaba el renglon, y si se equivoca no falla, se come tres filas de 51 y
    devuelve 48 sin avisar de nada. Agrupar por celda no depende de la
    jerarquia del HTML, que es lo unico que la marca puede cambiar sin
    querer.
    """
    celdas: list[tuple[str, str]] = []
    for m in _CELDA_OPPO.finditer(html):
        etiqueta = re.sub(r"\s+", " ", m.group(1)).strip().lower()
        clave = _ETIQUETA_OPPO.get(etiqueta)
        if clave:
            celdas.append((clave, _texto(m.group(2))))

    out: list[Equipo] = []
    fila: dict[str, str] = {}
    for clave, valor in celdas:
        if clave == "n":          # empieza un renglon nuevo
            if fila:
                out.append(_equipo_oppo(fila, url, consultado))
            fila = {"n": valor}
            continue
        fila.setdefault(clave, valor)
        if clave == "ift" and "ift" in fila:
            # El folio cierra el renglon: no hace falta esperar a la celda
            # siguiente, que ademas puede no existir.
            out.append(_equipo_oppo(fila, url, consultado))
            fila = {}
    if fila:
        out.append(_equipo_oppo(fila, url, consultado))
    return [e for e in out if e]


def _equipo_oppo(fila: dict[str, str], url: str, consultado: str) -> Equipo | None:
    modelo = fila.get("modelo", "")
    folio = parse_certificado(fila.get("ift", ""))
    if not modelo or not folio:
        return None
    return Equipo(
        marca="oppo",
        modelo=modelo,
        nombre=fila.get("nombre", ""),
        certificado=folio,
        url=url,
        consultado=consultado,
    )


def parse_motorola(html: str, url: str, consultado: str) -> list[Equipo]:
    """Lee https://www.motorola.com.mx/ift/

    El markup es un grid de VTEX: cuatro celdas por renglon, y las celdas son
    <p> sueltos en el orden del documento. No se fia del agrupamiento por
    posicion, porque el numero de celdas varia: los modulos de radio (MOMR,
    MOMD) no traen modelo. Se avanza sobre el texto plano reconociendo donde
    empieza un folio y se toma hacia atras el modelo XT mas cercano.
    """
    celdas = [
        _texto(m.group(1))
        for m in re.finditer(r'<p class="lh-copy[^"]*"[^>]*>([\s\S]*?)</p>', html)
    ]
    out: list[Equipo] = []
    for i, celda in enumerate(celdas):
        folio = parse_certificado(celda)
        if not folio:
            continue
        modelo = nombre = ""
        for j in range(i - 1, max(-1, i - 5), -1):
            if not modelo and _MODELO_MOTOROLA.match(celdas[j]):
                modelo = celdas[j]
            if not nombre and re.match(r"^moto\b", celdas[j], re.IGNORECASE):
                nombre = celdas[j]
        if not modelo:
            # Un folio sin modelo es un modulo de radio o de red, no un
            # telefono. No entra al padron de equipos.
            continue
        out.append(Equipo(
            marca="motorola",
            modelo=modelo,
            nombre=nombre,
            certificado=folio,
            url=url,
            consultado=consultado,
        ))
    return out


# ------------------------------------------------------------------ fuentes

FUENTES = {
    "oppo": {
        "url": "https://www.oppo.com/mx/ift/",
        "parse": parse_oppo,
        "nota": "tabla de certificados de OPPO Mexico",
    },
    "motorola": {
        "url": "https://www.motorola.com.mx/ift/",
        "parse": parse_motorola,
        "nota": "tabla de certificados IFETEL de Motorola Mexico",
    },
}


def _agrega(padron: Padron, marca: str, cuerpo: bytes, url: str, consultado: str) -> None:
    """Parsea el cuerpo de una marca y lo mete al padron, o explica por que no.

    Separado de `descarga_padron` para poder probarlo sin red: el caso que mas
    importa es "la pagina se leyo pero no salio nada", y ese caso no se puede
    provocar con una descarga real sin esperar a que la marca rediseñe.
    """
    if not cuerpo:
        padron.marcas_sin_padron.add(marca)
        padron.avisos.append(f"{marca}: respuesta vacia de {url}")
        return
    equipos = FUENTES[marca]["parse"](cuerpo.decode("utf-8", "replace"), url, consultado)
    if not equipos:
        padron.marcas_sin_padron.add(marca)
        padron.avisos.append(
            f"{marca}: la pagina {url} se leyo pero no salio ningun certificado. "
            f"Puede ser que cambiaran el formato; entonces el padron de {marca} "
            f"queda SIN LEER, no vacio. Sus variantes se quedan en "
            f"'{DESCONOCIDO}', no en '{SIN_VERIFICAR}'."
        )
        return
    padron.equipos.extend(equipos)
    padron.marcas.add(marca)
    log(f"padron: {marca}: {len(equipos)} certificados de {FUENTES[marca]['nota']}")


def descarga_padron(*, refresh: bool = False) -> Padron:
    """Trae el padron de todas las marcas con pagina certificadora accesible.

    Una marca que falle no tira el pipeline: se anota en `marcas_sin_padron` y
    se sigue. Un padron a medio leer es peor que uno que no se leyo, porque no
    se distingue, y por eso `marcas_sin_padron` se lleva por separado de
    `marcas`.
    """
    padron = Padron()
    consultado = now_iso()
    for marca, cfg in FUENTES.items():
        url = cfg["url"]
        try:
            body, meta = fetch(url, cache_dir=RAW / "ift", refresh=refresh)
        except Exception as exc:  # noqa: BLE001
            padron.marcas_sin_padron.add(marca)
            padron.avisos.append(f"{marca}: no se pudo descargar {url} ({exc})")
            continue
        _agrega(padron, marca, body, url, meta.get("retrieved_at", consultado))
    return padron


# ------------------------------------------------------------------ cruce

@dataclass
class Resultado:
    """Lo que el cruce concluyo sobre una variante."""

    estado: str
    certificado: str = ""
    url: str = ""
    modelo_del_padron: str = ""
    motivo: str = ""

    def a_campos(self) -> dict:
        """Lo que se escribe en la variante."""
        return {
            "homologado_ift": self.estado,
            "ift_certificado": self.certificado,
            "ift_url": self.url,
        }


def cruza(variante, padron: Padron, indice: dict[tuple[str, str], Equipo] | None = None) -> Resultado:
    """Cruza una variante contra el padron.

    Se intenta cada numero de modelo de la variante. Con varios numeros
    (un mismo equipo vendido como XT2239-9 y XT2239-17) basta con que uno
    aparezca: el equipo es el mismo y el certificado es del modelo.
    """
    if indice is None:
        indice = padron.indexar()
    marca = variante.vendor or ""
    if marca not in padron.marcas:
        return Resultado(
            estado=DESCONOCIDO,
            motivo=f"no hay tabla de certificados accesible para {marca or 'esta marca'}",
        )
    for modelo in variante.model_numbers or []:
        equipo = indice.get((marca, clave_modelo(modelo)))
        if equipo:
            return Resultado(
                estado=HOMOLOGADO,
                certificado=equipo.certificado,
                url=equipo.url,
                modelo_del_padron=equipo.modelo,
                motivo=f"folio {equipo.certificado} ({equipo.nombre or equipo.modelo})",
            )
    return Resultado(
        estado=SIN_VERIFICAR,
        motivo=(f"se busco {marca} "
                f"{', '.join(variante.model_numbers) or '(sin numero de modelo)'} "
                f"en {len(padron.certificados_de(marca))} certificados publicados "
                f"y no aparece"),
    )


def aplica_padron(variantes, padron: Padron) -> dict:
    """Cruza todas las variantes y escribe el resultado en cada una.

    Devuelve el conteo por estado, que es lo que va al informe de corrida.
    """
    indice = padron.indexar()
    conteo = {e: 0 for e in ESTADOS}
    for v in variantes:
        # Una persona que puso 'no_soportado' en el override manual ya decidio.
        # El cruce automatico no puede deshacer esa decision: 'no_soportado'
        # existe justamente para affirmar algo que el padron no puede saber.
        if v.homologado_ift == NO_SOPORTADO:
            conteo[NO_SOPORTADO] += 1
            continue
        r = cruza(v, padron, indice)
        v.homologado_ift = r.estado
        v.ift_certificado = r.certificado
        v.ift_url = r.url
        if r.motivo:
            v.add("homologado_ift", f"{r.estado}: {r.motivo}", "ift", "reported", r.url,
                  now_iso())
        conteo[r.estado] += 1
    return conteo


def resumen_padron(padron: Padron) -> str:
    """Una linea por marca, para el informe de corrida."""
    lineas = []
    for marca in sorted(padron.marcas):
        n = len(padron.certificados_de(marca))
        lineas.append(f"  {marca:<12} {n:>4} certificados leidos")
    for marca in sorted(padron.marcas_sin_padron):
        lineas.append(f"  {marca:<12} {'--':>4} sin tabla accesible -> queda 'desconocido'")
    return "\n".join(lineas)


__all__ = [
    "HOMOLOGADO", "SIN_VERIFICAR", "DESCONOCIDO", "NO_SOPORTADO", "ESTADOS",
    "TOOLTIP", "Equipo", "Padron", "Resultado", "clave_modelo",
    "parse_certificado", "parse_oppo", "parse_motorola", "descarga_padron",
    "cruza", "aplica_padron", "resumen_padron", "FUENTES",
]
