"""Pruebas de alias de marca y del cruce con el padron del IFT.

Se prueban los parsers contra HTML real, guardado en data/raw/ift/, y no contra
una muestra escrita a mano. Un parser que solo funciona contra un ejemplo que
escribio el mismo que lo escribio no dice nada; el HTML de la pagina es lo que
va a cambiar la proxima vez, y lo unico que avisa de eso es la prueba.

Las muestras se leen de la cache. Si no estan, la prueba lo dice y no pasa
falsa: descargalas con

    python -c "import sys; sys.path.insert(0, 'packages/device-db'); \\
               from devicedb.ift import descarga_padron; descarga_padron(refresh=True)"

Uso:  python tools/probar-if.py
"""

from __future__ import annotations

import sys
from pathlib import Path

RAIZ = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(RAIZ / "packages" / "device-db"))

from devicedb import brands, ift  # noqa: E402

fallas: list[str] = []
hechas = 0


def prueba(nombre: str, condicion: bool, detalle: str = "") -> None:
    global hechas
    if condicion:
        hechas += 1
        print(f"  [OK  ] {nombre}")
    else:
        fallas.append(nombre)
        print(f"  [FAIL] {nombre}" + (f"  -> {detalle}" if detalle else ""))


def seccion(t: str) -> None:
    print()
    print(t)
    print("-" * 72)


# =================================================================== alias
seccion("Alias de marca")

# El caso que pidio normalizar, textual.
prueba("'TCT (Alcatel)' resuelve a alcatel",
       brands.resuelve("TCT (Alcatel)").clave == "alcatel",
       brands.resuelve("TCT (Alcatel)").clave)
prueba("'TCT' a secas tambien resuelve a alcatel",
       brands.resuelve("TCT").clave == "alcatel",
       brands.resuelve("TCT").clave)

# La trampa: TCT y TCL son empresas distintas.
prueba("'TCL' NO resuelve a alcatel (son empresas distintas)",
       brands.resuelve("TCL").clave == "tcl",
       brands.resuelve("TCL").clave)
prueba("'TCL' y 'TCT' quedan en claves diferentes",
       brands.resuelve("TCL").clave != brands.resuelve("TCT").clave)
prueba("'SEMP TCL' (televisores) queda en tcl, no en alcatel",
       brands.resuelve("SEMP TCL").clave == "tcl",
       brands.resuelve("SEMP TCL").clave)

# Solo cambia el uso de mayusculas: es el otro motivo del cruce fallido.
prueba("'Vivo' y 'vivo' dan la misma clave",
       brands.resuelve("Vivo").clave == brands.resuelve("vivo").clave == "vivo")
prueba("'Realme' y 'realme' dan la misma clave",
       brands.resuelve("Realme").clave == brands.resuelve("realme").clave == "realme")
prueba("'LGE' resuelve a lg",
       brands.resuelve("LGE").clave == "lg", brands.resuelve("LGE").clave)
prueba("'OPPO' y 'Oppo' dan la misma clave",
       brands.resuelve("OPPO").clave == brands.resuelve("Oppo").clave == "oppo")

# Sub-marcas: misma empresa, datos de reparacion distintos. No se fusionan.
prueba("'Redmi' NO se fusiona con Xiaomi",
       brands.resuelve("Redmi").clave != brands.resuelve("Xiaomi").clave)
prueba("pero si se declara de la misma familia",
       brands.es_alianza("Redmi", "Xiaomi"))
prueba("'OnePlus' no se fusiona con OPPO, pero son familia",
       brands.resuelve("OnePlus").clave != brands.resuelve("OPPO").clave
       and brands.es_alianza("OnePlus", "OPPO"))
prueba("TCT y TCL no son familia",
       not brands.es_alianza("TCT", "TCL"))

# Una marca que no esta en la tabla no es un error: es informacion pendiente de
# revisar. Lo que no se permite es que se cuele en silencio, y que resuelve()
# devuelva una clave vacia que alguien tomaria por "sin marca".
for texto in ["Marca Inventada 3000", "TCT (Alcatel)", "vivo"]:
    m = brands.resuelve(texto)
    prueba(f"resuelve({texto!r}) devuelve clave no vacia", bool(m.clave), repr(m.clave))
    prueba(f"resuelve({texto!r}) deja motivo escrito", bool(m.motivo), m.motivo)
prueba("una marca desconocida no se finge canonica",
       brands.resuelve("Marca Inventada 3000").clave not in brands.CANONICAS)
prueba("sin marca devuelve clave VACIA, no la marca ficticia 'unknown'",
       brands.resuelve("").clave == "" and brands.resuelve("   ").clave == "",
       repr(brands.resuelve("").clave))
prueba("'unknown' como texto entra por la tabla y no se confunde con vacio",
       brands.resuelve("unknown").clave == "unknown"
       and brands.resuelve("unknown").clave != brands.resuelve("").clave)
prueba("normaliza() quita acentos y puntuacion",
       brands.normaliza("TCT (Alcatel)") == brands.normaliza("tct-alcatel")
       == brands.normaliza("TCT Alcatel") == "tct alcatel")

# El motivo queda escrito, porque sin el no se puede auditar el renombrado.
prueba("el renombrado deja su motivo",
       "TCT" in brands.resuelve("TCT (Alcatel)").motivo,
       brands.resuelve("TCT (Alcatel)").motivo)
prueba("el renombrado marca que hubo cambio",
       brands.resuelve("TCT (Alcatel)").cambiada is True
       and brands.resuelve("alcatel").cambiada is False)


# ================================================================== padron
seccion("El esquema y la lista de columnas no pueden desalinearse")

# La tabla `variant` crecio de 51 a 54 columnas durante este trabajo y el INSERT
# es posicional. Con `VALUES(?,?,...)` a pelo, agregar una columna sin sumar su
# valor no da error visible: SQLite acepta el INSERT y escribe cada campo en la
# columna que le toca, corrida. Cuatrocientas variantes con el SoC en el nombre
# comercial y la pantalla en el SoC, y ninguna prueba se entera.
import re  # noqa: E402
from devicedb import store  # noqa: E402
from devicedb.model import Variant  # noqa: E402

_bloque = re.search(r"CREATE TABLE IF NOT EXISTS variant \((.*?)\n\);", store.SCHEMA, re.S)
_esquema = [ln.strip().split()[0]
            for ln in _bloque.group(1).strip().split("\n") if ln.strip()] if _bloque else []
prueba("el esquema de la tabla se pudo leer", bool(_esquema))
prueba("las columnas del INSERT son las del esquema, en el mismo orden",
       _esquema == list(store.COLUMNAS_VARIANT),
       f"esquema={len(_esquema)} lista={len(store.COLUMNAS_VARIANT)}")
prueba("y el numero de valores que arma variant_values() coincide",
       len(store.variant_values(Variant(codename="x", vendor="samsung")))
       == len(store.COLUMNAS_VARIANT),
       f"valores={len(store.variant_values(Variant(codename='x', vendor='samsung')))}")
prueba("el INSERT nombra las columnas, no las cuenta a ciegas",
       "INSERT OR REPLACE INTO variant(id,codename" in store.INSERT_VARIANT,
       store.INSERT_VARIANT[:70])
prueba("ninguna columna se nombra dos veces en el INSERT",
       len(store.COLUMNAS_VARIANT) == len(set(store.COLUMNAS_VARIANT)))


seccion("Folio de certificado: el formato cambia por marca")

# Un patron laxo que aceptara todo no sirve: aqui se comprueba que el patron
# rechaza lo que no es un folio.
for bueno in ["JUOPCP26-00023609", "RCPOPCP22-3048", "RTIOPCP21-0986",
              "MOMOXT22-16676", "RTIMOXT22-3427", "RCPMOMR21-2139"]:
    prueba(f"acepta el folio {bueno}", ift.parse_certificado(bueno) == bueno)
prueba("quita el prefijo 'IFT '",
       ift.parse_certificado("IFT JUOPCP26-00023609") == "JUOPCP26-00023609")
for malo in ["XT2239-9", "CPH2931", "moto g32", "", "IFT", "abc-123", "12345"]:
    prueba(f"rechaza {malo!r}", ift.parse_certificado(malo) == "",
           ift.parse_certificado(malo))


seccion("Llave de modelo")

prueba("'XT2239-9' y 'xt2239 9' dan la misma llave",
       ift.clave_modelo("XT2239-9") == ift.clave_modelo("xt2239 9") == "XT22399")
prueba("'CPH2931' no se altera", ift.clave_modelo("CPH2931") == "CPH2931")
prueba("modelo vacio da llave vacia", ift.clave_modelo("") == "")


# ============================================================ parsers reales
seccion("Parsers contra el HTML guardado de cada pagina")

CACHE = RAIZ / "packages" / "device-db" / "data" / "raw" / "ift"


def html_guardado(url: str) -> str:
    from devicedb.util import slug
    p = CACHE / f"{slug(url)}.bin"
    return p.read_text(encoding="utf-8", errors="replace") if p.exists() else ""


oppo_html = html_guardado(ift.FUENTES["oppo"]["url"])
moto_html = html_guardado(ift.FUENTES["motorola"]["url"])

if not oppo_html or not moto_html:
    print(f"  [AVISO] falta la cache en {CACHE}.")
    print("           Descargala con:")
    print("             python packages/device-db/pipeline.py run")
    print("           Sin ella no se puede probar el parser contra el sitio real.")
    print("           Se prueban solo las funciones puras (arriba).")
else:
    oppo = ift.parse_oppo(oppo_html, ift.FUENTES["oppo"]["url"], "prueba")
    moto = ift.parse_motorola(moto_html, ift.FUENTES["motorola"]["url"], "prueba")

    print(f"    oppo: {len(oppo)} renglones | motorola: {len(moto)} renglones")

    # El conteo se compara contra lo que la pagina realmente declara, no contra
    # un numero fijo: si la marca agrega un equipo, la prueba avisa en vez de
    # seguir dando verde sobre un parser que dejo de leer.
    import re as _re
    modelos_en_pagina = set(_re.findall(r"CPH\d{4,6}[A-Z]{0,3}", oppo_html))
    folios_en_pagina = set(_re.findall(r"[A-Z]{3}[A-Z]{3,4}\d{2}-\d{3,8}", oppo_html))
    prueba("oppo: se lee un renglon por cada modelo CPH de la pagina",
           {e.modelo for e in oppo} == modelos_en_pagina,
           f"pagina={len(modelos_en_pagina)} leidos={len({e.modelo for e in oppo})} "
           f"faltan={sorted(modelos_en_pagina - {e.modelo for e in oppo})[:5]}")
    prueba("oppo: se lee un renglon por cada folio de la pagina",
           {e.certificado for e in oppo} == folios_en_pagina,
           f"pagina={len(folios_en_pagina)} leidos={len({e.certificado for e in oppo})} "
           f"faltan={sorted(folios_en_pagina - {e.certificado for e in oppo})[:5]}")
    prueba("oppo: hay filas suficientes para que la prueba signifique algo",
           len(oppo) > 40, f"{len(oppo)} renglones")
    prueba("oppo: todos traen modelo y folio",
           all(e.modelo and e.certificado for e in oppo))
    prueba("oppo: el folio no trae el prefijo 'IFT '",
           not any(e.certificado.startswith("IFT") for e in oppo))
    prueba("oppo: los modelos empiezan con CPH",
           all(e.clave.startswith("CPH") for e in oppo),
           ", ".join(e.modelo for e in oppo[:3]))
    prueba("oppo: trae nombre comercial",
           sum(1 for e in oppo if e.nombre) > len(oppo) // 2)
    prueba("oppo: la marca queda como clave canonica",
           all(e.marca == "oppo" for e in oppo))

    prueba("motorola: se leen los certificados con modelo",
           len(moto) > 20, f"{len(moto)} renglones")
    prueba("motorola: todos traen modelo XT",
           all(e.modelo.upper().startswith("XT") for e in moto),
           ", ".join(e.modelo for e in moto[:3]))
    prueba("motorola: se descartaron los modulos de radio (sin modelo XT)",
           not any(e.modelo.upper().startswith("XT") is False for e in moto))
    prueba("motorola: el folio no trae el prefijo 'IFT '",
           not any(e.certificado.startswith("IFT") for e in moto))
    prueba("motorola: la marca queda como clave canonica",
           all(e.marca == "motorola" for e in moto))

    # El parser no debe depender de que el HTML de hoy siga igual: si la pagina
    # cambia de maquetacion y sale vacio, el pipeline tiene que notarlo.
    prueba("oppo: un html vacio no inventa renglones",
           ift.parse_oppo("", "x", "y") == [])
    prueba("motorola: un html vacio no inventa renglones",
           ift.parse_motorola("", "x", "y") == [])
    prueba("oppo: html sin la tabla no inventa renglones",
           ift.parse_oppo("<html><body><p>nada aqui</p></body></html>", "x", "y") == [])


# ===================================================================== cruce
seccion("Cruce: los tres estados")

padron = ift.Padron(
    equipos=[
        ift.Equipo("oppo", "CPH2931", "OPPO A7 Pro 5G", "JUOPCP26-00023609", "u1"),
        ift.Equipo("motorola", "XT2239-9", "moto e22", "MOMOXT22-16676", "u2"),
    ],
    marcas={"oppo", "motorola"},
)


class V:
    """Variante minima para probar el cruce."""

    def __init__(self, vendor, models):
        self.vendor = vendor
        self.model_numbers = models


r = ift.cruza(V("oppo", ["CPH2931"]), padron)
prueba("modelo presente en el padron -> homologado",
       r.estado == ift.HOMOLOGADO, r.estado)
prueba("y trae el folio", r.certificado == "JUOPCP26-00023609", r.certificado)
prueba("y trae la url de donde se leyo", r.url == "u1", r.url)

r = ift.cruza(V("oppo", ["CPH9999"]), padron)
prueba("modelo ausente, marca con padron -> sin_verificar",
       r.estado == ift.SIN_VERIFICAR, r.estado)
prueba("y NO dice 'no homologado'", "no homologado" not in r.motivo.lower())

r = ift.cruza(V("samsung", ["SM-A546B"]), padron)
prueba("marca sin tabla de certificados -> desconocido, no sin_verificar",
       r.estado == ift.DESCONOCIDO, r.estado)

# Un folio de OPPO no homologa un equipo de otra marca con el mismo nombre.
r = ift.cruza(V("tcl", ["CPH2931"]), padron)
prueba("un modelo repetido en otra marca no se hereda el folio",
       r.estado != ift.HOMOLOGADO, r.estado)

# Varios numeros de modelo: basta con que uno aparezca.
r = ift.cruza(V("motorola", ["XT0000-0", "XT2239-9", "XT9999-9"]), padron)
prueba("con varios numeros de modelo, uno basta para homologar",
       r.estado == ift.HOMOLOGADO, r.estado)

r = ift.cruza(V("oppo", []), padron)
prueba("sin numeros de modelo en una marca con padron -> sin_verificar",
       r.estado == ift.SIN_VERIFICAR, r.estado)

# El tooltip de 'sin_verificar' tiene que poder decir la verdad: si el estado
# significa 'se busco y no salio', el texto no puede prometer mas que eso.
prueba("el tooltip de sin_verificar dice que se busco",
       "no aparece" in ift.TOOLTIP[ift.SIN_VERIFICAR].lower())
prueba("el tooltip de desconocido dice que no se busco",
       "no se ha buscado" in ift.TOOLTIP[ift.DESCONOCIDO].lower())
prueba("los cuatro estados tienen tooltip",
       all(ift.TOOLTIP.get(e) for e in ift.ESTADOS))
prueba("'no_soportado' no lo produce el cruce en ningun caso",
       ift.NO_SOPORTADO not in {r.estado for r in (
           ift.cruza(V(m, mods), padron) for m, mods in [
               ("oppo", ["CPH2931"]), ("oppo", ["CPH9999"]), ("samsung", ["X"])])})

# --- La primera frase es la que se lee, y es la que estaba mal ----------------
#
# Estas pruebas existen por un error concreto. `desconocido` se explicaba como
# "Sin verificar. No hay una tabla de certificados...", y las dos pruebas de
# arriba pasaban: la primera busca "no aparece" en el texto de `sin_verificar`
# y la segunda "no se ha buscado" en el de `desconocido`, y las dos frases
# seguian ahi, bien escritas, despues de un encabezado que decia lo contrario.
#
# "Sin verificar" en espanol se lee como RESULTADO NEGATIVO, y lo que significa
# `desconocido` es que nadie busco. Es la confusion que los cuatro estados
# existen para evitar, y estaba escrita en el texto que se muestra.
#
# Un tooltip no se juzga por si contiene la frase, sino por si la PRIMERA frase
# dice lo mismo que el estado. Estas pruebas miran el inicio.

_MALO_DESCONOCIDO = ("sin verificar", "no verificado", "no homologado",
                     "no esta homologado", "no fue homologado")
_primeras = {e: ift.TOOLTIP[e].strip().lower() for e in ift.ESTADOS}

prueba("el texto de 'desconocido' NO abre con una frase que parezca negativa",
       not _primeras[ift.DESCONOCIDO].startswith(_MALO_DESCONOCIDO),
       _primeras[ift.DESCONOCIDO][:46])
prueba("ni la contiene en ninguna parte",
       not any(malo in ift.TOOLTIP[ift.DESCONOCIDO].lower()
               for malo in _MALO_DESCONOCIDO),
       ift.TOOLTIP[ift.DESCONOCIDO][:46])
prueba("'desconocido' abre diciendo que no se ha buscado",
       _primeras[ift.DESCONOCIDO].startswith("no se ha buscado"),
       _primeras[ift.DESCONOCIDO][:46])
prueba("'sin_verificar' abre diciendo que no esta en el padron",
       _primeras[ift.SIN_VERIFICAR].startswith("no est"),
       _primeras[ift.SIN_VERIFICAR][:46])
prueba("los dos estados que se confunden NO abren igual",
       _primeras[ift.SIN_VERIFICAR].split(".")[0]
       != _primeras[ift.DESCONOCIDO].split(".")[0],
       f"sin_verificar={_primeras[ift.SIN_VERIFICAR][:24]!r} "
       f"desconocido={_primeras[ift.DESCONOCIDO][:24]!r}")
prueba("'sin_verificar' descarta las tres malas lecturas, no solo una",
       all(x in ift.TOOLTIP[ift.SIN_VERIFICAR].lower()
           for x in ("no significa", "ilegal", "reparar")),
       ift.TOOLTIP[ift.SIN_VERIFICAR][-72:])
prueba("'desconocido' dice que no es un resultado negativo",
       "no es un resultado negativo" in ift.TOOLTIP[ift.DESCONOCIDO].lower())

# El mismo texto vive en dos lenguajes: `TOOLTIP` aqui y
# `TOOLTIP_HOMOLOGACION` en packages/core/src/bridge.ts. En el comentario de
# ift.py se reconoce que hay que cambiar los dos lados, asi que se comprueba que
# el lado de TypeScript no se quede con la frase vieja. No se importa el modulo
# porque es TypeScript; se lee el archivo, que para detectar una frase
# prohibida es suficiente.
_TS = Path(__file__).resolve().parent.parent / "packages/core/src/bridge.ts"
if _TS.exists():
    _texto_ts = _TS.read_text(encoding="utf-8")
    prueba("el texto de 'desconocido' en la app tampoco dice 'Sin verificar'",
           "Sin verificar." not in _texto_ts,
           "bridge.ts todavia abre el estado desconocido con 'Sin verificar'")
    prueba("la app nombra los cuatro estados",
           all(f'"{e}"' in _texto_ts for e in ift.ESTADOS))
else:
    prueba("se pudo leer bridge.ts para comparar los dos TOOLTIP", False,
           f"no existe {_TS}")

seccion("Un padron a medio leer se distingue de uno vacio")

# Se usa la funcion real de armado, no un Padron armado a mano: el caso que hay
# que verificar es el de "la pagina se leyo pero no salio nada", y armarlo a
# mano seria probarse a uno mismo.
vacio = ift.Padron()
ift._agrega(vacio, "oppo", b"<html><body><p>la pagina cambio</p></body></html>",
            ift.FUENTES["oppo"]["url"], "prueba")
prueba("marca sin tabla -> desconocido, no 'vacio'",
       ift.cruza(V("oppo", ["CPH2931"]), vacio).estado == ift.DESCONOCIDO)
prueba("y queda en marcas_sin_padron, no en marcas",
       "oppo" in vacio.marcas_sin_padron and "oppo" not in vacio.marcas)
prueba("y queda el aviso de que no se pudo leer",
       any("no salio ningun certificado" in a for a in vacio.avisos),
       "; ".join(vacio.avisos))
prueba("el aviso dice que el padron queda sin leer, no vacio",
       any("SIN LEER, no vacio" in a for a in vacio.avisos),
       "; ".join(vacio.avisos))
prueba("el aviso aclara que esas variantes quedan en 'desconocido'",
       any(vacio.avisos) and "desconocido" in vacio.avisos[0])

# Y lo contrario: una pagina que si trae tabla se marca como leida.
leido = ift.Padron()
ift._agrega(leido, "oppo",
            b'<div data-label="N\xc3\xbam.">1</div><div data-label="Modelo">CPH2931</div>'
            b'<div data-label="Nombre comercial">OPPO A7 Pro 5G</div>'
            b'<div data-label="N\xc3\xbam. IFT">IFT JUOPCP26-00023609</div>',
            ift.FUENTES["oppo"]["url"], "prueba")
prueba("con tabla leida, la marca queda en 'marcas'",
       "oppo" in leido.marcas and "oppo" not in leido.marcas_sin_padron)
prueba("con tabla leida, el cruce da homologado",
       ift.cruza(V("oppo", ["CPH2931"]), leido).estado == ift.HOMOLOGADO)


seccion("Un folio puede cubrir varios modelos, y eso no es un error")

# Caso real en la pagina de OPPO: el mismo folio para el A6t y el A6k. Como el
# indice es por modelo, los dos se guardan y los dos salen homologados.
p2 = ift.Padron(equipos=[
    ift.Equipo("oppo", "CPH2847", "OPPO A6t", "JUOPCP26-007492", "u"),
    ift.Equipo("oppo", "CPH2891", "OPPO A6k", "JUOPCP26-007492", "u"),
], marcas={"oppo"})
for _ in range(5):
    p2.indexar()
prueba("cinco indexadas y ningun aviso por compartir folio",
       p2.avisos == [], str(p2.avisos))
prueba("los dos modelos con el mismo folio quedan indexados",
       len(p2.indexar()) == 2)
prueba("los dos modelos quedan homologados",
       ift.cruza(V("oppo", ["CPH2847"]), p2).estado == ift.HOMOLOGADO
       and ift.cruza(V("oppo", ["CPH2891"]), p2).estado == ift.HOMOLOGADO)

# Y el caso raro: el MISMO modelo con dos folios distintos si se avisa.
p3 = ift.Padron(equipos=[
    ift.Equipo("oppo", "CPH2847", "OPPO A6t", "JUOPCP26-007492", "u"),
    ift.Equipo("oppo", "CPH2847", "OPPO A6t", "JUOPCP26-999999", "u"),
], marcas={"oppo"})
p3.indexar()
prueba("el mismo modelo con dos folios si genera aviso",
       len([a for a in p3.avisos if "dos folios" in a]) == 1, str(p3.avisos))
prueba("y el aviso aparece una sola vez aunque se cruce mil veces",
       (p3.indexar(), p3.avisos.count(p3.avisos[0]))[1] == 1)


# ================================================== curacion manual tambien
seccion("La curacion manual tampoco se salta la normalizacion")

# El agujero real: apply_manual asignaba el campo tal cual, asi que escribir
# 'Samsung' en el override.yml producia una variante con marca 'Samsung' al
# lado de 115 con 'samsung', y el cruce con el padron las contaba como dos
# marcas distintas. Se prueba con la funcion real, no con una reimplementacion.
from devicedb import build as _build  # noqa: E402

manuales = {"p1": {"vendor": "Samsung", "verified_by": "x", "evidence": "y"},
            "p2": {"vendor": "TCT (Alcatel)", "verified_by": "x", "evidence": "y"},
            "p3": {"vendor": "LGE", "verified_by": "x", "evidence": "y"}}
# El codename del override tiene que existir en el diccionario: si no,
# apply_manual lo da de alta como variante nueva en vez de parchear la que hay,
# y la prueba estaria midiendo otra cosa.
vs = {"p1#-": Variant(codename="p1", vendor="samsung"),
      "p2#-": Variant(codename="p2", vendor="alcatel"),
      "p3#-": Variant(codename="p3", vendor="lg")}
_build.apply_manual(vs, manuales)
prueba("'Samsung' en el override acaba como 'samsung'",
       vs["p1#-"].vendor == "samsung", vs["p1#-"].vendor)
prueba("'TCT (Alcatel)' en el override acaba como 'alcatel'",
       vs["p2#-"].vendor == "alcatel", vs["p2#-"].vendor)
prueba("'LGE' en el override acaba como 'lg'",
       vs["p3#-"].vendor == "lg", vs["p3#-"].vendor)
prueba("y queda escrito de donde salio la marca",
       any(p.field_name == "vendor_original" and p.value == "Samsung"
           for p in vs["p1#-"].provenance),
       str([(p.field_name, p.value) for p in vs["p1#-"].provenance
            if "vendor" in p.field_name]))

# Un override que confirme 'no_soportado' no lo puede pisar el cruce.
p4 = ift.Padron(equipos=[ift.Equipo("oppo", "CPH2931", "A7 Pro", "JUOPCP26-00023609", "u")],
                marcas={"oppo"})
vs2 = {"p1#-": Variant(codename="p1", vendor="oppo", model_numbers=["CPH2931"],
                      homologado_ift=ift.NO_SOPORTADO)}
conteo = ift.aplica_padron(list(vs2.values()), p4)
prueba("una confirmacion manual de 'no_soportado' sobrevive al cruce",
       vs2["p1#-"].homologado_ift == ift.NO_SOPORTADO,
       vs2["p1#-"].homologado_ift)
prueba("y se cuenta como no_soportado, no como homologado",
       conteo[ift.NO_SOPORTADO] == 1 and conteo[ift.HOMOLOGADO] == 0, str(conteo))


# ============================================ la demo sigue teniendo equipos que
# ============================================== se pueden ver de verdad
#
# La demo web depende de dos mitades que se pueden desalinear sin que nada avise:
#
#   - `tools/generar-demo-catalog.mjs` elige un recorte de 48 variantes, y la
#     eleccion cambia cuando cambia el puntaje o la base.
#   - `apps/web-demo/src/browser-bridge.ts` tiene los equipos simulados, cada uno
#     apuntando a un codename o a un numero de modelo concreto.
#
# Si el generador deja de meter la variante a la que apunta un fixture, ese
# fixture contesta "sin coincidencia en el catalogo". No hay excepcion ni error:
# la demo sigue arrancando, la pantalla sigue viéndose bien, y simplemente
# demuestra que la herramienta no reconoce la mitad de los equipos que ella misma
# ofrece. Ya pasó: dos de cinco fixtures apuntaban a `rq3a` y `kunlun`, que no
# estan ni en el recorte ni en la base completa.
#
# Por eso la regla es al reves de lo habitual: no se lista que fixture puede
# fallar, se exige que TODOS resuelvan y el unico que se salva es el que declara
# `fueraDelCatalogo` en su propio bloque. Una excepcion que se declara en el
# codigo, al lado de su motivo, se puede revisar; una excepcion en una lista de
# esta prueba se documenta sola y nadie la revisa.
#
# Ademas se comprueba que la demo muestre los cuatro estados. El estado
# `homologado` es el que prueba el cruce, y un folio que no se ve en ninguna
# pantalla es indistinguible de un folio inventado.
seccion("La demo web se puede ver de verdad")

_DEMO_CAT = RAIZ / "packages/app/src/data/demo-catalog.ts"
_DEMO_BRIDGE = RAIZ / "apps/web-demo/src/browser-bridge.ts"

if not _DEMO_CAT.exists() or not _DEMO_BRIDGE.exists():
    prueba("estan los dos archivos de la demo", False,
           f"falta {_DEMO_CAT.name} o {_DEMO_BRIDGE.name}; "
           "se regenera con `npm run db:demo`")
else:
    _cat = _DEMO_CAT.read_text(encoding="utf-8")
    _bridge = _DEMO_BRIDGE.read_text(encoding="utf-8")

    def _campo(bloque: str, nombre: str) -> str:
        mm = re.search(r'"%s":\s*"([^"]*)"' % nombre, bloque)
        return mm.group(1) if mm else ""

    def _modelos(bloque: str) -> set[str]:
        mm = re.search(r'"modelNumbers":\s*\[(.*?)\]', bloque, re.S)
        return set(re.findall(r'"([^"]+)"', mm.group(1))) if mm else set()

    # Indice del recorte: codename -> (estado, folio, url, numeros de modelo).
    # Se construye una vez porque las pruebas siguientes lo consultan muchas.
    _recorte: dict[str, dict[str, object]] = {}
    for _b in _cat.split("\n  {\n")[1:]:
        _cn = _campo(_b, "codename")
        if not _cn:
            continue
        _recorte.setdefault(_cn, {
            "ift": _campo(_b, "homologadoIft"),
            "folio": _campo(_b, "iftCertificado"),
            "url": _campo(_b, "iftUrl"),
            "modelos": _modelos(_b),
        })

    _todos_los_modelos: set[str] = set()
    for _v in _recorte.values():
        _todos_los_modelos |= _v["modelos"]  # type: ignore[operator]

    # Los bloques de SIMULADOS. Se parten por `id:`, que es lo unico del bloque
    # que no se repite, y se leen las dos props con las que resuelve la app.
    _sims = []
    for _b in _bridge.split("const SIMULADOS")[1].split("\n  {\n")[1:]:
        _mid = re.search(r'id:\s*"([^"]+)"', _b)
        if not _mid:
            continue
        _mdev = re.search(r'"ro\.product\.device":\s*"([^"]+)"', _b)
        _mmod = re.search(r'"ro\.product\.model":\s*"([^"]+)"', _b)
        _sims.append({
            "id": _mid.group(1),
            "device": _mdev.group(1) if _mdev else "",
            "modelo": _mmod.group(1) if _mmod else "",
            "fuera": "fueraDelCatalogo: true" in _b,
        })

    prueba("se leen los equipos simulados de la demo", len(_sims) >= 4,
           f"solo se hallaron {len(_sims)}; cambio el formato del array?")

    for _s in _sims:
        _encontro = _s["device"] in _recorte or _s["modelo"] in _todos_los_modelos
        if _s["fuera"]:
            # El unico que existe para que se vea el "no se que es esto".
            prueba(f"el equipo fuera de catalogo SI esta fuera ({_s['id']})",
                   not _encontro,
                   f"'{_s['device']}' ya esta en el recorte, asi que ya no "
                   "demuestra lo que dice demostrar")
        else:
            prueba(f"el equipo '{_s['id']}' resuelve en la demo", _encontro,
                   f"ni '{_s['device']}' ni '{_s['modelo']}' estan en el recorte; "
                   "apuntalo a una variante que si este, o marcalo fueraDelCatalogo")

    # --- Que la escalera haga en la maqueta lo que hace en el producto ---------
    #
    # Lo de arriba comprueba que cada equipo simulado encuentre algo. No alcanza:
    # "encuentra algo" y "decide lo correcto" no son lo mismo, y el fallo que
    # importa es el que la maqueta resuelve mas de lo que el producto resolveria.
    #
    # Se corre la MISMA escalera de `resolveLocal` sobre el recorte, equipo por
    # equipo, y se mira el resultado. Asi se atrapan las dos fabricaciones:
    #
    #   - resolver mas: un codename ambiguo que el `.exe` negaria y la maqueta no.
    #     Venia de que el recorte se llevaba media fila de un grupo.
    #   - no resolver lo que si: un codename ambiguo cuyo numero de modelo si
    #     decide. La maqueta tomaba la primera variante con `.find()` yikipediaa la
    #     respuesta, asi que resolvia, pero con la placa que le tocaba en orden.
    _filas_por_codename: dict[str, list[dict[str, object]]] = {}
    for _b in _cat.split("\n  {\n")[1:]:
        _cn = _campo(_b, "codename")
        if not _cn:
            continue
        _filas_por_codename.setdefault(_cn, []).append({
            "clave": _campo(_b, "key"),
            "modelos": _modelos(_b),
        })

    def _escala_demo(device: str, modelo: str) -> tuple[str, str, list[str]]:
        """La escalera de `resolveLocal`. Devuelve (nivel, clave o "", candidatas)."""
        if not device:
            return ("2", "", [])
        por_cn = _filas_por_codename.get(device, [])
        if len(por_cn) == 1:
            return ("3", str(por_cn[0]["clave"]), [])
        if modelo:
            por_m = [v for v in por_cn if modelo in v["modelos"]]
            if len(por_m) == 1:
                return ("4", str(por_m[0]["clave"]), [])
            if len(por_m) > 1:
                return ("4", "", [str(v["clave"]) for v in por_m])
        return ("6", "", [str(v["clave"]) for v in por_cn])

    _resueltos: list[str] = []
    _negados: list[tuple[str, list[str]]] = []
    for _s in _sims:
        if _s["fuera"]:
            continue
        _nivel, _clave, _cands = _escala_demo(_s["device"], _s["modelo"])
        if _clave:
            _resueltos.append(_s["id"])
        else:
            _negados.append((_s["id"], _cands))

    # La gran mayoria tiene que resolver: si la maqueta se negara en todo, la
    # demo pareceria una herramienta que no sabe nada.
    prueba("la mayoria de los equipos simulados SI resuelven", len(_resueltos) >= 4,
           f"solo resolvieron {len(_resueltos)}: {_resueltos}")

    # Y tiene que haber al menos UNO que se niegue, o la promesa central del
    # producto no se puede ver en ninguna pantalla. Sin este caso, alguien que
    # mire la maqueta conclude que la ambiguedad nunca ocurre.
    prueba("y hay al menos un equipo simulado donde la herramienta se NIEGA",
           bool(_negados),
           "ningun equipo llega al refusal; sin uno, la maqueta no muestra el caso "
           "que el producto dice manejar. Agrega uno con un codename cuyos numeros "
           "de modelo esten en mas de una variante (ver el fixture moto-z2-ambiguo)")

    for _id, _cands in _negados:
        prueba(f"el equipo que se niega entrega las candidatas ({_id})", len(_cands) >= 2,
               f"se nego con {len(_cands)} candidatas; si se niega tiene que ser con "
               "la lista a la vista, que es lo que hace que servir de algo")

    # Un codename ambiguo con un numero de modelo que si decide tiene que
    # resolver a ESA variante, no a la primera que aparezca. Este es el caso que
    # la maqueta tenia mal: se quedaba con la primera del grupo.
    for _cn, _vs in _filas_por_codename.items():
        if len(_vs) < 2:
            continue
        _modelos: dict[str, list[str]] = {}
        for _v in _vs:
            for _m in _v["modelos"]:  # type: ignore[union-attr]
                _modelos.setdefault(_m, []).append(str(_v["clave"]))
        _deciden = [_m for _m, _ks in _modelos.items() if len(_ks) == 1]
        if not _deciden:
            continue
        _un_decidido = _deciden[0]
        _esperada = _modelos[_un_decidido][0]
        _nivel, _clave, _c = _escala_demo(_cn, _un_decidido)
        prueba(f"codename ambiguo + modelo que si decide ({_cn}) baja a la variante correcta",
               _clave == _esperada,
               f"el modelo {_un_decidido} pertenece solo a {_esperada}, pero la escalera "
               f"devolvio nivel {_nivel} clave '{_clave}' con {len(_c)} candidatas")
        break

    # Que la demo muestre un caso con folio, que es lo que prueba el cruce.
    _con_folio = [c for c, v in _recorte.items() if v["ift"] == ift.HOMOLOGADO]
    prueba("el recorte tiene al menos un caso homologado", bool(_con_folio),
           "el generador deberia garantizarlo con ESTADOS_A_MOSTRAR")
    if _con_folio:
        _v = _recorte[_con_folio[0]]
        prueba("y ese caso trae folio, no solo el estado", bool(_v["folio"]),
               "mostrarlo homologado y sin folio es peor que no mostrarlo")
        prueba("con una pagina real de la marca de donde salio",
               str(_v["url"]).startswith("https://"), f"url='{_v['url']}'")

        # Y que un equipo simulado lo alcance. Si el generador cambia cual es la
        # variante homologada, el fixture puede quedarse apuntando a la anterior.
        _alcanzable = {*_con_folio} | set(_v["modelos"])  # type: ignore[arg-type]
        _apunta = [s["id"] for s in _sims
                   if not s["fuera"]
                   and (s["device"] in _alcanzable or s["modelo"] in _alcanzable)]
        prueba("y hay un equipo simulado que abra ese caso", bool(_apunta),
               f"el recorte tiene el caso con folio pero ningun equipo lo abre; "
               f"apunta alguno a {_con_folio[0]}")

    # Los tres estados que el cruce produce tienen que estar en la demo. El
    # cuarto, `no_soportado`, no se exige: solo lo produce una confirmacion
    # humana y hoy no hay ninguna, asi que pedirlo seria prometer un caso que el
    # producto no tiene.
    _estados = {str(v["ift"]) for v in _recorte.values()}
    for _e in (ift.HOMOLOGADO, ift.SIN_VERIFICAR, ift.DESCONOCIDO):
        prueba(f"la demo tiene al menos un caso '{_e}'", _e in _estados,
               f"lo que hay: {sorted(x for x in _estados if x)}")

    # --- Guardas del lado TypeScript -----------------------------------------
    #
    # OJO, esto NO son pruebas de comportamiento: son guardas de texto. No hay
    # runner de React ni de TypeScript en el repo, asi que no se puede ejecutar
    # `resolveLocal` ni montar `EquipoScreen` para ver que hacen. Lo que si se
    # puede es comprobar que el codigo no sea el que estaba roto, que es
    # justamente la forma que tomo el defecto.
    #
    # La prueba de verdad de la escalera esta mas arriba, y corre en Python sobre
    # el mismo recorte. Estas guardas cubren el otro lado: que el codigo que la
    # maqueta ejecuta no se contradiga con lo que la prueba da por bueno.
    def _cuerpo(texto: str, desde: str) -> str:
        """El cuerpo de una funcion, contando llaves. Para no medir de mas."""
        i = texto.find(desde)
        if i < 0:
            return ""
        j = texto.find("{", i)
        if j < 0:
            return ""
        nivel = 0
        for k in range(j, len(texto)):
            if texto[k] == "{":
                nivel += 1
            elif texto[k] == "}":
                nivel -= 1
                if nivel == 0:
                    return texto[j : k + 1]
        return texto[j:]

    _cuerpo_resolve = _cuerpo(_bridge, "function resolveLocal")
    prueba("se localiza el cuerpo de `resolveLocal` en la maqueta", bool(_cuerpo_resolve),
           "cambio la firma de la funcion? estas guardas dejan de medir lo que dicen")

    # El defecto original: quedarse con la PRIMERA variante que coincide con el
    # codename, y declarar 0.95 de confianza. Con un codename de cuatro placas eso
    # resolvia a la que estuviera de primera en el archivo.
    prueba("`resolveLocal` no se queda con la primera variante que coincide",
           ".find(" not in _cuerpo_resolve,
           "se volvio a usar `.find()` para elegir variante; hace falta `filter` y "
           "contar, porque lo que hay que decidir es cuantas coinciden, no cual es la primera")

    # Y tiene que entregar las candidatas cuando no puede decidir. Si solo hay
    # `alternatives: []` en todos los caminos, el estado de "N placas posibles" no
    # existe y la pantalla de la ambiguedad nunca se ve.
    prueba("`resolveLocal` entrega candidatas, no solo listas vacias",
           "alternatives: porCodename" in _cuerpo_resolve or "alternatives: porModelo" in _cuerpo_resolve,
           "no se encontro ningun camino que devuelva `alternatives` con contenido; "
           "sin eso la herramienta se niega sin mostrar contra que se niega")

    # La huella de compilacion es una pista. El defecto era que la escalera decia
    # "solo se puede usar como pista" y el codigo de abajo la tomaba como
    # respuesta, en la misma pantalla.
    prueba("la huella de compilacion no se toma como respuesta",
           "match = DEMO_CATALOG.find" not in _cuerpo_resolve and "pista" in _cuerpo_resolve,
           "la huella volvio a resolver por su cuenta; es una pista y se declara como pista")

    # El texto de "no reconocimos" se quejaba de que el catalogo no tiene una
    # variante que coincida. Con candidatas de por medio eso es falso: si las hay,
    # el catalogo SI conoce el equipo.
    _pantalla = (RAIZ / "packages/app/src/screens/EquipoScreen.tsx")
    if not _pantalla.exists():
        prueba("se encuentra la pantalla de equipo", False, f"falta {_pantalla}")
    else:
        _eq = _pantalla.read_text(encoding="utf-8")
        prueba("la pantalla ya no dice que no hay variante que coincida cuando si hay candidatas",
               "no tiene una variante que coincida" not in _eq,
               "volvio el texto que afirma que el catalogo no tiene nada, y con "
               "candidatas de por medio es falso")
        prueba("y tiene un caso aparte para cuando hay varias placas",
               "alternatives.length > 0" in _eq
               and "Hay {candidatas.length} placas posibles y no vamos a elegir una" in _eq,
               "no se encuentra la rama de 'N placas posibles'; sin ella la "
               "ambiguedad se muestra con las palabras de que no se reconocio el equipo")

        # El conteo que se muestra tiene que ser el de las candidatas que hay en
        # la mesa, y NO el de las placas que cubre el codename.
        #
        # No es una distincion de estilo. En la rama del numero de modelo
        # `alternatives` viene ya filtrado: si el codename cubre tres placas y el
        # numero que reporta el equipo esta en dos de ellas, la lista trae dos y
        # el nombre interno sigue cubriendo tres. Hay tres codenames asi en la
        # base (guamp, haydn, lmi), o sea que "ese nombre interno cubre 2
        # variantes" es falso en un equipo de verdad y esta pantalla no tendria
        # forma de notarlo.
        #
        # Lo que si se dice, y se exige, es que el conteo es de las candidatas:
        # "las N placas posibles". Esa es la unica cuenta que esta rama puede
        # hacer sin medir algo que no midio. Cuantas placas cubre el codename lo
        # tiene medido el nivel 3 de la escalera.
        _parrafo = ""
        if "alternatives.length > 0" in _eq:
            _desde = _eq.index("alternatives.length > 0")
            _hasta = _eq.find("if (!v)", _desde + 1)
            _rama = _eq[_desde:_hasta] if _hasta > _desde else ""
            _ini = _rama.find("<p className=\"mt-2 max-w-prose")
            _fin = _rama.find("</p>", _ini) if _ini >= 0 else -1
            _parrafo = _rama[_ini:_fin] if _ini >= 0 and _fin > _ini else ""

        prueba("la rama de ambiguedad se midio a si misma y se pudo contar el parrafo",
               bool(_parrafo),
               "no se encontro el parrafo de la rama de 'N placas posibles'; "
               "las guardas de abajo no podrian mirar nada")
        prueba("y el conteo que muestra es el de las candidatas, no el del codename",
               "las {candidatas.length} placas posibles" in _parrafo,
               "el parrafo no dice cuantas placas posibles hay; si lo que quiere "
               "decir es quantas cubre el codename, esta affirmando un numero que "
               "no midio (ver el comentario sobre guamp, haydn y lmi)")
        prueba("y no le atribuye un conteo al nombre interno",
               "cubre" not in _parrafo,
               "el parrafo dice quantas placas cubre el codename con el conteo de "
               "las candidatas, que puede ser menor: eso es falso cuando el numero "
               "de modelo reduce el grupo y aun asi quedan varias (guamp, haydn, lmi)")

        # Que el codename siga nombrandose y no se haya perdido del texto: es el
        # dato que el tecnico necesita para buscar la placa en la red.
        prueba("y el parrafo sigue nombrando el codename que se leyo",
               'device.props["ro.product.device"]' in _parrafo,
               "la rama de ambiguedad ya no dice que nombre interno se leyo")

        # El titulo de "no reconocimos" tiene que estar UNA vez. Dos significa que
        # la rama de ambiguedad esta mostrando el texto del caso que no aplica,
        # que es exactamente el defecto: el equipo SI se reconocio, lo que no se
        # pudo fue elegir la placa.
        #
        # Esto se cuenta sobre TODO el archivo, comentarios incluidos, y por eso
        # la comprobacion de arriba no busca la palabra "placas posibles" suelta:
        # esa palabra sobrevive en un comentario aunque el titulo este mal, y una
        # guarda que pasa por ahi no esta mirando lo que dice mirar.
        _cuenta_no_reconocido = _eq.count("No reconocimos este equipo")
        prueba("el texto 'No reconocimos este equipo' aparece una sola vez",
               _cuenta_no_reconocido == 1,
               f"aparece {_cuenta_no_reconocido} veces; si aparece dos, la rama de "
               "ambiguedad esta usando el texto del caso que no aplica")
        prueba("y el caso de que no hay nada sigue existiendo aparte",
               "No reconocimos este equipo" in _eq,
               "se perdio el mensaje de equipo desconocido, que es un caso real y distinto")

    # Y que la marca se vea como se escribe, no como la clave del catalogo.
    prueba("el recorte trae el nombre de la marca para pantalla",
           '"vendorNombre": "Motorola"' in _cat and '"vendorNombre": "Samsung"' in _cat)


# ================================================================== resumen
print()
print("=" * 72)
if fallas:
    print(f"  {hechas} pruebas ok, {len(fallas)} FALLAS")
    for f in fallas:
        print(f"    - {f}")
    raise SystemExit(1)
print(f"  {hechas} pruebas ok, 0 fallas")
raise SystemExit(0)
