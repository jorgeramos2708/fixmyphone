"""Que marcas aparecen de verdad en cada fuente, y como se escriben.

Este script es el que destapo el problema de las marcas, y es la herramienta que
se usa para resolverlo. Antes de normalizar, la marca de cada variante era
literalmente la cadena que traia la fuente, y que "TCT", "TCL" y "Alcatel"
aparecieran en fuentes distintas era la razon de que el cruce con el padron del
IFT no encajara: no se estaban cruzando marcas, se estaban cruzando cadenas.

Hoy la normalizacion vive en `devicedb/brands.py`, y este script sirve para dos
cosas:

  1. Ver si una marca nueva que aparece en una fuente es una marca de verdad o
     una variante de escritura de otra que ya esta en la tabla. Si es lo
     segundo, lo que se agrega es un alias con su motivo, no una clave nueva.
  2. Comprobar que la tabla de marcas no se quedo corta. Las marcas que hay en
     el catalogo y no estan en la tabla salen como `marca_no_registrada` en el
     reporte del pipeline, y son las que hay que revisar.

Tambien imprime de que campo se cruzaria cada marca, que es donde se decide si
un cruce con el padron del IFT es posible o si la variante se queda en
`desconocido`.

Uso:  python tools/marcas-en-las-fuentes.py
"""

from __future__ import annotations

import csv
import io
import json
import re
from collections import Counter, defaultdict
from pathlib import Path

RAIZ = Path(__file__).resolve().parent.parent
RAW = RAIZ / "packages" / "device-db" / "data" / "raw"
OUT = RAIZ / "packages" / "device-db" / "data" / "out"

# Marcas sin ninguna variante, que ademas son las que estan en el padron del IFT.
# Son las que hay que entender antes de intentar cruzar nada.
INTERESAN = [
    "tct", "tcl", "alcatel", "vivo", "tecno", "itel", "infinix",
    "oppo", "realme", "samsung", "xiaomi", "motorola", "huawei",
    "honor", "nokia", "hmd", "zte", "nubia", "lg", "sony",
]


def norm(texto: str) -> str:
    """Minusculas y sin acentos, para COMPARAR. No para guardar."""
    t = (texto or "").strip().lower()
    for patron, letra in (
        (r"[áàä]", "a"), (r"[éèë]", "e"), (r"[íìï]", "i"),
        (r"[óòö]", "o"), (r"[úùü]", "u"),
    ):
        t = re.sub(patron, letra, t)
    return re.sub(r"\s+", " ", t.replace("ñ", "n")).strip()


def seccion(titulo: str) -> None:
    print()
    print(titulo)
    print("-" * 70)


def lee_play() -> list[dict]:
    for p in (RAW / "play").rglob("*"):
        if p.is_file() and p.stat().st_size > 1_000_000:
            b = p.read_bytes()
            texto = b.decode(
                "utf-16" if b[:2] in (b"\xff\xfe", b"\xfe\xff") else "utf-8", "replace"
            )
            return list(csv.DictReader(io.StringIO(texto)))
    return []


# --------------------------------------------------------------------- play
seccion("Marcas en el catalogo de Play (columna Retail Branding)")

filas = lee_play()
if not filas:
    print("  no se encontro el csv de play en la cache cruda")
else:
    marcas = Counter((f.get("Retail Branding") or "").strip() for f in filas)
    marcas.pop("", None)
    print(f"  registros: {len(filas)}")
    print(f"  marcas distintas: {len(marcas)}")
    print()
    print("  Las marcas de interes, tal cual las escribe Google Play:")
    halladas = 0
    for m, n in marcas.most_common():
        if norm(m) in INTERESAN:
            print(f"    {m:<18} {n:>6}")
            halladas += 1
    if not halladas:
        print("    (ninguna)")
    print()
    print("  Las 20 marcas mas grandes:")
    for m, n in marcas.most_common(20):
        print(f"    {m:<18} {n:>6}")

    print()
    print("  Marcas que contienen 'tct' o 'tcl' en el nombre:")
    halladas = {m: n for m, n in marcas.items() if "tct" in norm(m) or "tcl" in norm(m)}
    print(f"    {halladas or 'ninguna'}")

    print()
    print("  Muestra de filas, para ver de que campo se cruzaria cada una:")
    for objetivo in ("vivo", "tecno", "oppo", "realme", "tct", "alcatel"):
        muestra = [
            f for f in filas
            if norm(f.get("Retail Branding") or "") == objetivo
        ][:2]
        if not muestra:
            print(f"    {objetivo:<10} -- no esta en el catalogo de Play")
            continue
        for f in muestra:
            marca = (f.get("Retail Branding") or "").strip()
            print(
                f"    {marca:<10} | device={f.get('Device',''):<20}"
                f" | nombre={f.get('Marketing Name','')[:26]:<26}"
                f" | modelo={f.get('Model','')[:22]}"
            )

# ------------------------------------------------------------------ variantes
seccion("Marcas en las variantes ya construidas")

json_path = OUT / "devices.json"
if not json_path.exists():
    print("  no existe devices.json; corre antes: npm run db:build")
else:
    datos = json.loads(json_path.read_text(encoding="utf-8"))
    variantes = (
        datos if isinstance(datos, list)
        else (datos.get("variants") or datos.get("devices") or [])
    )
    por_marca: dict[str, dict] = defaultdict(lambda: {"n": 0, "fuentes": set()})
    for v in variantes:
        m = v.get("vendor") or "(sin marca)"
        por_marca[m]["n"] += 1
        por_marca[m]["fuentes"].update(v.get("sources") or [])

    print(f"  variantes: {len(variantes)}, marcas: {len(por_marca)}")
    print()
    print("  Las marcas de interes que SI tienen variante:")
    for m in sorted(por_marca, key=lambda x: -por_marca[x]["n"]):
        if norm(m) in INTERESAN:
            e = por_marca[m]
            fuentes = ",".join(sorted(e["fuentes"]))
            print(f"    {m:<18} {e['n']:>4}  fuentes: {fuentes}")

    ausentes = [m for m in INTERESAN if not any(norm(x) == m for x in por_marca)]
    print()
    print(f"  Marcas de interes SIN ninguna variante: {ausentes}")

    print()
    print("  Todos los valores de 'vendor', tal cual quedaron guardados:")
    for m in sorted(por_marca):
        print(f"    {m:<18} {por_marca[m]['n']:>4}")

print()
