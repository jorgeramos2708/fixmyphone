"""Marcas canonicas y sus alias: una sola marca, muchos spellings.

El problema que resuelve
------------------------
El pipeline nunca normalizo los alias de marca, asi que el campo `vendor` era
literalmente la cadena que traia cada fuente. Google Play escribe "TCT (Alcatel)",
"Vivo" y "vivo" y "LGE" y "Asus"; LineageOS escribe "OPPO" y "LG" y "ASUS" y
"realme". Con eso el cruce con el padron del IFT no encaja, y no por falta de
datos: no se estaban cruzando marcas, se estaban cruzando cadenas.

La trampa de TCT
----------------
TCT y TCL NO son la misma empresa. TCT es el fabricante legal de los telefonos
Alcatel; TCL es la de los pantallas. El catalogo de Play trae las dos, y un
normalizador que las junte por parecido de nombre fusiona dos fabricantes
distintos y produce un catalogo que miente. Este archivo las mantiene
separadas a proposito, y `prueba_aliases` falla si alguien las junta.

Tampoco se fusionan marcas que si son la misma empresa pero con datos de
reparacion distintos. OnePlus pertenece a OPPO, y Redmi y POCO a Xiaomi, pero
un Redmi y un Xiaomi no comparten ni particiones ni procedimiento: se
registran con su propia clave y se documenta la relacion en FAMILIAS.

Que se guarda y que se muestra
------------------------------
`clave`      identidad estable, minuscula, sin acentos. Se guarda, se cruza.
`nombre`     como lo escribe la persona en la pantalla.
`familia`    empresa matriz, solo informativa. No se usa para cruzar: cruzar por
             familia devolveria "este Redmi es homologado porque su hermano
             Xiaomi si lo esta", que es exactamente el tipo de Conclusion
             inventada que rompe un taller.
"""

from __future__ import annotations

import re
import unicodedata
from dataclasses import dataclass


@dataclass(frozen=True)
class Marca:
    """Una marca ya resuelta."""

    clave: str          # identidad estable, para guardar y cruzar
    nombre: str         # como se muestra
    familia: str        # empresa matriz, informativa
    original: str       # tal como la escribio la fuente
    cambiada: bool      # True si el texto original no era la clave
    motivo: str         # por que se renombro; "" si no hubo cambio


# --------------------------------------------------------------- canonicas
# clave: (nombre en pantalla, familia corporativa)

CANONICAS: dict[str, tuple[str, str]] = {
    "alcatel":    ("Alcatel",    "tct"),
    "apple":      ("Apple",      "apple"),
    "asus":       ("ASUS",       "asus"),
    "blackberry": ("BlackBerry", "blackberry"),
    "blu":        ("BLU",        "blu"),
    "bq":         ("BQ",         "bq"),
    "caterpillar": ("Caterpillar", "cat"),
    "google":     ("Google",     "google"),
    "honor":      ("Honor",      "huawei"),
    "htc":        ("HTC",        "htc"),
    "huawei":     ("Huawei",     "huawei"),
    "hmd":        ("HMD",        "hmd"),
    "infinix":    ("Infinix",    "transsion"),
    "itel":       ("itel",       "transsion"),
    "jio":        ("Jio",        "jio"),
    "leeco":      ("LeEco",      "leeco"),
    "lenovo":     ("Lenovo",     "lenovo"),
    "lg":         ("LG",         "lg"),
    "meizu":      ("Meizu",      "meizu"),
    "motorola":   ("Motorola",   "lenovo"),
    "nintendo":   ("Nintendo",   "nintendo"),
    "nokia":      ("Nokia",      "hmd"),
    "nubia":      ("Nubia",      "zte"),
    "oneplus":    ("OnePlus",    "oppo"),
    "oppo":       ("OPPO",       "oppo"),
    "poco":       ("POCO",       "xiaomi"),
    "redmi":      ("Redmi",      "xiaomi"),
    "realme":     ("realme",     "oppo"),
    "samsung":    ("Samsung",    "samsung"),
    "sharp":      ("Sharp",      "sharp"),
    "sony":       ("Sony",       "sony"),
    "tcl":        ("TCL",        "tcl"),
    "tecno":      ("Tecno",      "transsion"),
    "transsion":  ("Transsion",  "transsion"),
    "xiaomi":     ("Xiaomi",     "xiaomi"),
    "yu":         ("YU",         "xiaomi"),
    "zte":        ("ZTE",        "zte"),

    # --- Marcas que hay en el catalogo y que faltaban en esta tabla ----------
    #
    # Estaban sin registrar y por eso cada una de sus variantes salia como
    # `marca_no_registrada`. Con 28 de las 48 marcas del catalogo marcadas, el
    # aviso no senalaba nada: NVIDIA, Fairphone y Nothing no son marcas que
    # alguien tenga que revisar, son marcas que faltaban en esta lista.
    #
    # Se registran con el nombre con el que las compra la gente, que no siempre
    # es como las escribe la fuente: `f x tec` es F(x)Tec, `10 or` es 10.or.
    "10 or":      ("10.or",      "10 or"),
    "ayn":        ("AYN",        "ayn"),
    "banana pi":  ("Banana Pi",  "banana pi"),
    "dynalink":   ("Dynalink",   "dynalink"),
    "droidlogic": ("DroidLogic", "droidlogic"),
    "essential":  ("Essential",  "essential"),
    "fairphone":  ("Fairphone",  "fairphone"),
    "freebox":    ("Freebox",    "freebox"),
    "f x tec":    ("F(x)Tec",    "f x tec"),
    "hardkernel": ("HardKernel", "hardkernel"),
    "nextbit":    ("Nextbit",    "nextbit"),
    "nothing":    ("Nothing",    "nothing"),
    "nvidia":     ("NVIDIA",     "nvidia"),
    "osom":       ("Osom",       "osom"),
    "radxa":      ("Radxa",      "radxa"),
    "razer":      ("Razer",      "razer"),
    "retroid pocket": ("Retroid Pocket", "retroid"),
    "shift":      ("SHIFT",      "shift"),
    "smartisan":  ("Smartisan",  "smartisan"),
    "vsmart":     ("Vsmart",     "vsmart"),
    "walmart":    ("Walmart",    "walmart"),
    "wileyfox":   ("Wileyfox",   "wileyfox"),
    "wingtech":   ("Wingtech",   "wingtech"),
    "yandex":     ("Yandex",     "yandex"),
    "zinwa":      ("Zinwa",      "zinwa"),
    "zuk":        ("ZUK",        "lenovo"),
    # "ark" y "solana" siguen SIN registrar a proposito: hay una variante de
    # cada una y no se sabe con certeza quien las fabrica. Adivinar el nombre
    # seria escribir en pantalla una marca que nadie confirmo, que es
    # justamente lo que el aviso sirve para evitar.
}


# ------------------------------------------------------------------ alias
# Clave: el texto de la fuente ya normalizado con `normaliza()`.
# Valor: (clave canonica, motivo del renombrado).

ALIAS: dict[str, tuple[str, str]] = {
    # -- TCT. El caso que pidio normalizar. Play escribe el nombre legal del
    #    fabricante con la marca de venta entre parentesis.
    "tct alcatel": ("alcatel", "Play escribe el nombre legal del fabricante (TCT) con la marca de venta entre parentesis"),
    "tct":         ("alcatel", "TCT es el nombre legal del fabricante de los telefonos Alcatel"),
    "alcatel":     ("alcatel", "ya canonica"),

    # -- TCL. Distinta empresa, aqui al lado de TCT, para que no se confundan.
    "tcl":         ("tcl",     "TCL es la de las pantallas, no TCT. Se mantiene aparte a proposito"),
    "ptcl shoq tv": ("tcl",    "Play marca los televisores como 'PTCL SHOQ TV'"),
    "semp tcl":    ("tcl",     "Play marca los televisores como 'SEMP TCL'"),
    "ktctv":       ("tcl",     "Play marca los televisores como 'KTCtv'"),

    # -- Solo cambia el uso de mayusculas. Google Play trae las dos formas.
    "vivo":        ("vivo",    "Play escribe la marca con y sin mayuscula inicial"),
    "tecno":       ("tecno",   "Play escribe la marca con y sin mayusculas"),
    "itel":        ("itel",    "ya canonica"),
    "infinix":     ("infinix", "ya canonica"),
    "oppo":        ("oppo",    "LineageOS escribe OPPO en mayusculas, Play escribe Oppo"),
    "realme":      ("realme",  "Play trae 'Realme' y 'realme'; la marca se escribe en minuscula"),
    "hmd":         ("hmd",     "ya canonica"),
    "honor":       ("honor",   "ya canonica"),
    "nubia":       ("nubia",   "ya canonica"),
    "redmi":       ("redmi",   "Play lista Redmi aparte de Xiaomi; es la misma empresa con datos de reparacion distintos"),
    "poco":        ("poco",    "Play lista POCO aparte de Xiaomi; es la misma empresa con datos de reparacion distintos"),

    # -- Acentos y grafias alternativas.
    "lg electronics": ("lg",   "Play escribe el nombre completo de la empresa"),
    "lge":            ("lg",   "Play abrevia LG Electronics como LGE"),
    "motorola mobility": ("motorola", "Play escribe el nombre completo"),
    "mobilephone":  ("motorola", "Play usa el nombre del fabricante, no la marca"),
    "xiaomi communications": ("xiaomi", "Play escribe el nombre completo"),
    "huawei":        ("huawei", "ya canonica"),
}

# Play usa el nombre legal o el fabricante, no la marca que ve el usuario.
# Se resuelve a la marca que la gente compra.
ALIAS.update({
    "xiaomi communications co ltd": ("xiaomi", "nombre legal de Play"),
    "guangdong oppo mobile":        ("oppo", "nombre legal de Play"),
    "oneplus technology":           ("oneplus", "nombre legal de Play"),
    "shenzhen transsion":           ("transsion", "nombre legal de Play"),
    "tecno mobile":                 ("tecno", "nombre legal de Play"),
    "vivo mobile":                  ("vivo", "nombre legal de Play"),
    "realme mobile":                ("realme", "nombre legal de Play"),
    "tct mobile":                   ("alcatel", "nombre legal de Play; TCT fabrica Alcatel"),
    "sharp corporation":            ("sharp", "nombre legal de Play"),
    "sony corporation":             ("sony", "nombre legal de Play"),
    "zte corporation":              ("zte", "nombre legal de Play"),
    "nubia":                        ("nubia", "ya canonica"),
})


# ------------------------------------------------------------------ helpers

_ESPACIOS = re.compile(r"\s+")
_NO_ALFANUM = re.compile(r"[^a-z0-9 ]+")


def normaliza(texto: str) -> str:
    """Llave de busqueda: minusculas, sin acentos, sin puntuacion.

    No es lo que se guarda. Es solo para comparar: "TCT (Alcatel)" y
    "tct-alcatel" y "TCT Alcatel" tienen que dar la misma llave.
    """
    t = unicodedata.normalize("NFKD", texto or "")
    t = "".join(c for c in t if not unicodedata.combining(c))
    t = t.lower()
    t = _NO_ALFANUM.sub(" ", t)
    return _ESPACIOS.sub(" ", t).strip()


def resuelve(texto: str) -> Marca:
    """Lleva el texto de cualquier fuente a una marca canonica.

    Nunca lanza. Un texto que no esta en la tabla se devuelve con su propia
    forma normalizada como clave, `cambiada=True` si se toco algo, y un motivo
    que lo dice. Un alias desconocido es informacion, no un error: el pipeline
    lo reporta en `conflict` para que una persona decida.
    """
    original = texto or ""
    llave = normaliza(original)
    if not llave:
        # Sin marca se devuelve VACIA, no la marca ficticia "unknown". No es lo
        # mismo: "unknown" es una marca que alguien nombro, y vacio es que
        # nadie la nombro. Con "unknown" la brecha `sin_fabricante` nunca
        # saltaria, porque el campo venia lleno de algo que no es un fabricante.
        return Marca("", "Sin marca", "", original, False, "la fuente no trae marca")

    if llave in ALIAS:
        clave, motivo = ALIAS[llave]
    elif llave in CANONICAS:
        clave, motivo = llave, "ya canonica"
    else:
        clave, motivo = llave, "marca no registrada; se deja tal cual para revisarla"

    if clave not in CANONICAS:
        # El alias apunta a algo que no esta en la tabla de canonicas. Se
        # degrada a la propia llave en vez de inventar una marca.
        return Marca(clave, original or llave, "", original, True,
                     f"alias '{llave}' apunta a '{clave}', que no es una marca canonica")

    nombre, familia = CANONICAS[clave]
    return Marca(clave, nombre, familia, original,
                 normaliza(original) != clave, motivo)


def es_alianza(a: str, b: str) -> bool:
    """True si las dos claves son la misma empresa matriz.

    Sirve para avisar, no para cruzar. Un Redmi y un Xiaomi son la misma
    empresa y aun asi no comparten datos de reparacion.
    """
    fa = CANONICAS.get(resuelve(a).clave, ("", ""))[1]
    fb = CANONICAS.get(resuelve(b).clave, ("", ""))[1]
    return bool(fa) and fa == fb


def catalogadas() -> list[str]:
    return sorted(CANONICAS)


__all__ = [
    "Marca", "CANONICAS", "ALIAS", "normaliza", "resuelve", "es_alianza",
    "catalogadas",
]
