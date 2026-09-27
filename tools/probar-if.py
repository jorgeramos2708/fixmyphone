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
