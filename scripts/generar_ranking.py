#!/usr/bin/env python3
"""Genera el ranking semanal de Pulso Silvestre a partir de APIs abiertas.

Escribe en public/data/: ranking/AAAA-Www.json, ranking/index.json e historial.json.
Solo usa la biblioteca estándar. Las reglas de cálculo (índice, posición, variación,
estado) viven AQUÍ y solo aquí: el navegador únicamente lee y muestra.

Métrica: "actividad semanal" = registros nuevos que cada fuente publica en la semana
ISO cerrada (lunes a domingo). La unidad depende de la fuente (listas, observaciones,
ocurrencias), por eso NO se comparan entre sí: el índice (método v3) compara cada fuente
contra su propio nivel habitual, la mediana de sus 4 semanas previas (100 = habitual).

Uso:
  python scripts/generar_ranking.py              # cierra la última semana ISO completa
  python scripts/generar_ranking.py --semana 2026-W43
Variables de entorno opcionales: EBIRD_API_KEY.
"""
from __future__ import annotations

import argparse
import datetime as dt
import json
import os
import statistics
import sys
import urllib.parse
import urllib.request
from pathlib import Path
from typing import Callable, Optional

METODO_VERSION = 3
MESES = ["enero", "febrero", "marzo", "abril", "mayo", "junio", "julio", "agosto",
         "septiembre", "octubre", "noviembre", "diciembre"]
UMBRAL_PREVIAS = 10      # variación solo si la semana previa tuvo al menos estas unidades
UMBRAL_ANOMALIA = 5      # consultas/previas mayor a esto se marca como anomalía
SEMANAS_HISTORIAL = 8
SEMANAS_BASE = 4         # semanas previas cuya mediana es el "nivel habitual" de una fuente
MIN_SEMANAS_BASE = 3     # sin al menos estas semanas previas no hay índice (queda sin posición)
# Fuentes cuyo conteo por fecha de creación se puede pedir a posteriori sin sesgo: se reconstruyen
# las semanas previas que falten. GBIF no (lo "interpretado" cambia al reprocesar): se acumula.
RETROSPECTIVOS = {"naturalista-mx", "inat-murcielagos", "inat-abejas", "ebird"}
UA = {"User-Agent": "PulsoSilvestre/2 (proyecto academico; https://github.com/ale153023/pulso-silvestre)"}


# ---------------------------------------------------------------- fechas
def semana_id(lunes: dt.date) -> str:
    y, w, _ = lunes.isocalendar()
    return f"{y}-W{w:02d}"


def lunes_de(id_semana: str) -> dt.date:
    y, w = id_semana.split("-W")
    return dt.date.fromisocalendar(int(y), int(w), 1)


def ultima_semana_cerrada(hoy: dt.date) -> dt.date:
    """Lunes de la última semana ISO completa (la semana en curso no cuenta)."""
    return hoy - dt.timedelta(days=hoy.weekday() + 7)


def etiqueta(inicio: dt.date, fin: dt.date) -> str:
    if inicio.month == fin.month:
        return f"Semana del {inicio.day} al {fin.day} de {MESES[fin.month - 1]} de {fin.year}"
    if inicio.year == fin.year:
        return f"Semana del {inicio.day} de {MESES[inicio.month - 1]} al {fin.day} de {MESES[fin.month - 1]} de {fin.year}"
    return (f"Semana del {inicio.day} de {MESES[inicio.month - 1]} de {inicio.year} "
            f"al {fin.day} de {MESES[fin.month - 1]} de {fin.year}")


# ---------------------------------------------------------------- adaptadores
def _get_json(url: str, headers: Optional[dict] = None):
    req = urllib.request.Request(url, headers={**UA, **(headers or {})})
    with urllib.request.urlopen(req, timeout=60) as r:
        return json.load(r)


def gbif_mx(inicio: dt.date, fin: dt.date) -> int:
    """Ocurrencias de animales en México interpretadas por GBIF durante la semana."""
    q = urllib.parse.urlencode({
        "country": "MX", "taxonKey": 1, "limit": 0,
        "lastInterpreted": f"{inicio.isoformat()},{fin.isoformat()}",
    })
    return int(_get_json(f"https://api.gbif.org/v1/occurrence/search?{q}")["count"])


def naturalista_mx(inicio: dt.date, fin: dt.date) -> int:
    """Observaciones de fauna creadas en México durante la semana (red iNaturalist)."""
    lugar = _get_json("https://api.inaturalist.org/v1/places/6793")["results"][0]
    if "xico" not in lugar.get("name", ""):
        raise RuntimeError(f"place_id 6793 ya no es México: {lugar.get('name')}")
    q = urllib.parse.urlencode({
        "place_id": 6793, "created_d1": inicio.isoformat(), "created_d2": fin.isoformat(),
        "iconic_taxa": "Aves,Mammalia,Reptilia,Amphibia,Actinopterygii,Insecta", "per_page": 0,
    })
    return int(_get_json(f"https://api.inaturalist.org/v1/observations?{q}")["total_results"])


def ebird(inicio: dt.date, fin: dt.date) -> int:
    """Listas de verificación enviadas a eBird en México, sumando los 7 días."""
    clave = os.environ.get("EBIRD_API_KEY")
    if not clave:
        raise RuntimeError("falta EBIRD_API_KEY")
    total, dia = 0, inicio
    while dia <= fin:
        url = f"https://api.ebird.org/v2/product/stats/MX/{dia.year}/{dia.month}/{dia.day}"
        total += int(_get_json(url, {"X-eBirdApiToken": clave})["numChecklists"])
        dia += dt.timedelta(days=1)
    return total


# Lugares de Norteamérica en la red iNaturalist: place_id -> fragmento esperado del nombre.
LUGARES_NORTEAMERICA = {1: "united states", 6712: "canada", 6793: "xico"}


def inat_taxon(taxon_id: int, nombre: str) -> Callable[[dt.date, dt.date], int]:
    """Observaciones de un grupo taxonómico creadas en EE. UU., Canadá y México durante la semana.
    Antes de contar verifica que el taxón y los lugares sean los esperados."""
    def contar(inicio: dt.date, fin: dt.date) -> int:
        taxon = _get_json(f"https://api.inaturalist.org/v1/taxa/{taxon_id}")["results"][0]
        if taxon.get("name") != nombre:
            raise RuntimeError(f"taxon_id {taxon_id} ya no es {nombre}: {taxon.get('name')}")
        total = 0
        for place_id, esperado in LUGARES_NORTEAMERICA.items():
            lugar = _get_json(f"https://api.inaturalist.org/v1/places/{place_id}")["results"][0]
            if esperado not in f"{lugar.get('name', '')} {lugar.get('display_name', '')}".lower():
                raise RuntimeError(f"place_id {place_id} ya no es '{esperado}': {lugar.get('name')}")
            q = urllib.parse.urlencode({
                "place_id": place_id, "taxon_id": taxon_id, "per_page": 0,
                "created_d1": inicio.isoformat(), "created_d2": fin.isoformat(),
            })
            total += int(_get_json(f"https://api.inaturalist.org/v1/observations?{q}")["total_results"])
        return total
    return contar


# Bases sin adaptador aparecen como "sin_dato": no hay métrica pública y abierta que medir.
ADAPTADORES: dict[str, Callable[[dt.date, dt.date], int]] = {
    "gbif-mx": gbif_mx,
    "naturalista-mx": naturalista_mx,
    "ebird": ebird,
    "inat-murcielagos": inat_taxon(40268, "Chiroptera"),
    "inat-abejas": inat_taxon(630955, "Anthophila"),
}


# ---------------------------------------------------------------- cálculo (determinista)
def calcular_items(bases: list[dict], actual: dict[str, Optional[int]],
                   referencia: dict[str, list[int]], previa: dict[str, int]) -> list[dict]:
    """Índice relativo: indice = round(100·c / mediana(referencia)) con al menos MIN_SEMANAS_BASE
    semanas previas y mediana > 0; posición por índice desc y luego nombre (solo con índice).
    Variación = round((c − previa)/previa·100) solo si previa ≥ UMBRAL_PREVIAS."""
    nombre = {b["id"]: b["nombre"] for b in bases}
    items: dict[str, dict] = {}
    for base_id, c in actual.items():
        if c is None:
            continue
        ref = referencia.get(base_id, [])
        med = statistics.median(ref) if len(ref) >= MIN_SEMANAS_BASE else 0
        indice = round(100 * c / med) if med > 0 else None
        p = previa.get(base_id)
        if p is None:
            variacion, estado = None, "nuevo"
        elif p >= UMBRAL_PREVIAS:
            variacion = round((c - p) / p * 100)
            estado = "anomalia" if c / p > UMBRAL_ANOMALIA else "ok"
        else:
            variacion, estado = None, "ok"
        items[base_id] = {"baseId": base_id, "posicion": None, "consultas": c, "indice": indice,
                          "variacionPct": variacion, "estado": estado}
    con_indice = sorted((i for i in items.values() if i["indice"] is not None),
                        key=lambda i: (-i["indice"], nombre.get(i["baseId"], i["baseId"])))
    for pos, it in enumerate(con_indice, start=1):
        it["posicion"] = pos
    salida = con_indice + sorted((i for i in items.values() if i["indice"] is None),
                                 key=lambda i: nombre.get(i["baseId"], i["baseId"]))
    for b in bases:
        if actual.get(b["id"]) is None:
            salida.append({"baseId": b["id"], "posicion": None, "consultas": None, "indice": None,
                           "variacionPct": None, "estado": "sin_dato"})
    return salida


def _leer(ruta: Path, defecto):
    return json.loads(ruta.read_text(encoding="utf-8")) if ruta.exists() else defecto


def _escribir(ruta: Path, datos) -> None:
    ruta.parent.mkdir(parents=True, exist_ok=True)
    ruta.write_text(json.dumps(datos, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")


def generar(datos: Path, lunes: dt.date, adaptadores=None, ahora: Optional[dt.datetime] = None) -> dict:
    adaptadores = ADAPTADORES if adaptadores is None else adaptadores
    ahora = ahora or dt.datetime.now(dt.timezone.utc)
    inicio, fin = lunes, lunes + dt.timedelta(days=6)
    sid = semana_id(lunes)
    ruta = datos / "ranking" / f"{sid}.json"
    existente = _leer(ruta, None)
    if existente and not existente.get("datosIlustrativos"):
        raise SystemExit(f"{sid} ya está cerrada y no se modifica.")

    bases = _leer(datos / "bases.json", [])
    actual: dict[str, Optional[int]] = {}
    for b in bases:
        f = adaptadores.get(b["id"])
        if f is None:
            actual[b["id"]] = None
            continue
        try:
            actual[b["id"]] = f(inicio, fin)
        except Exception as e:  # una fuente caída no detiene a las demás
            print(f"AVISO {b['id']}: {e}", file=sys.stderr)
            actual[b["id"]] = None
    if all(v is None for v in actual.values()):
        raise SystemExit("Ninguna fuente respondió; no se publica una semana vacía.")

    # Historial acumulado (una ilustrativa previa se descarta).
    hist = {} if (existente and existente.get("datosIlustrativos")) else _leer(datos / "historial.json", {})
    por_semana = {b: {s["semana"]: s for s in serie} for b, serie in hist.items()}

    # Semanas previas que faltan: se reconstruyen solo para fuentes retrospectivas.
    for base_id, c in actual.items():
        f = adaptadores.get(base_id)
        if c is None or f is None or base_id not in RETROSPECTIVOS:
            continue
        for k in range(1, SEMANAS_BASE + 1):
            ini_k = inicio - dt.timedelta(days=7 * k)
            sid_k = semana_id(ini_k)
            if sid_k in por_semana.get(base_id, {}):
                continue
            try:
                v = f(ini_k, ini_k + dt.timedelta(days=6))
            except Exception as e:
                print(f"AVISO {base_id} {sid_k}: {e}", file=sys.stderr)
                continue
            por_semana.setdefault(base_id, {})[sid_k] = {"semana": sid_k, "inicio": ini_k.isoformat(), "consultas": v}

    referencia: dict[str, list[int]] = {}
    previa: dict[str, int] = {}
    for base_id in actual:
        vals = []
        for k in range(1, SEMANAS_BASE + 1):
            e = por_semana.get(base_id, {}).get(semana_id(inicio - dt.timedelta(days=7 * k)))
            if e is not None:
                vals.append(e["consultas"])
                if k == 1:
                    previa[base_id] = e["consultas"]
        referencia[base_id] = vals

    ranking = {
        "semana": {"id": sid, "inicio": inicio.isoformat(), "fin": fin.isoformat(),
                   "etiqueta": etiqueta(inicio, fin)},
        "metodoVersion": METODO_VERSION,
        "cerrada": True,
        "datosIlustrativos": False,
        "generadoEn": ahora.strftime("%Y-%m-%dT%H:%M:%SZ"),
        "items": calcular_items(bases, actual, referencia, previa),
    }
    _escribir(ruta, ranking)

    indice = _leer(datos / "ranking" / "index.json", {"ultima": sid, "semanas": []})
    semanas = sorted(set(indice["semanas"]) | {sid})
    _escribir(datos / "ranking" / "index.json", {"ultima": semanas[-1], "semanas": semanas})

    for base_id, c in actual.items():
        if c is not None:
            por_semana.setdefault(base_id, {})[sid] = {"semana": sid, "inicio": inicio.isoformat(), "consultas": c}
    salida = {b: sorted(d.values(), key=lambda s: s["semana"])[-SEMANAS_HISTORIAL:] for b, d in por_semana.items() if d}
    _escribir(datos / "historial.json", salida)
    return ranking


def main() -> None:
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("--semana", help="semana ISO a cerrar, p. ej. 2026-W43 (por defecto, la última completa)")
    ap.add_argument("--datos", default=str(Path(__file__).resolve().parent.parent / "public" / "data"))
    a = ap.parse_args()
    lunes = lunes_de(a.semana) if a.semana else ultima_semana_cerrada(dt.datetime.now(dt.timezone.utc).date())
    r = generar(Path(a.datos), lunes)
    n = sum(1 for i in r["items"] if i["estado"] != "sin_dato")
    print(f"{r['semana']['id']}: {n} bases con dato de {len(r['items'])}")


if __name__ == "__main__":
    main()
