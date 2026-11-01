import datetime as dt
import json
import tempfile
import unittest
from pathlib import Path

import generar_ranking as g

BASES = [{"id": "a", "nombre": "Alfa"}, {"id": "b", "nombre": "Beta"},
         {"id": "c", "nombre": "Gamma"}, {"id": "d", "nombre": "Delta"}]


class Calculo(unittest.TestCase):
    def test_indice_posicion_variacion(self):
        items = g.calcular_items(BASES, {"a": 200, "b": 100, "c": 100, "d": None}, {"a": 100, "b": 200, "c": 5})
        por = {i["baseId"]: i for i in items}
        self.assertEqual(por["a"]["posicion"], 1)
        self.assertEqual(por["a"]["indice"], 100)
        self.assertEqual(por["a"]["variacionPct"], 100)
        # empate entre b y c: desempata por nombre (Beta < Gamma)
        self.assertEqual((por["b"]["posicion"], por["c"]["posicion"]), (2, 3))
        self.assertEqual(por["b"]["indice"], 50)
        self.assertEqual(por["b"]["variacionPct"], -50)
        # previas < 10: sin variación
        self.assertIsNone(por["c"]["variacionPct"])
        self.assertEqual(por["c"]["estado"], "ok")
        # sin dato
        self.assertEqual(por["d"]["estado"], "sin_dato")
        self.assertIsNone(por["d"]["posicion"])

    def test_nuevo_y_anomalia(self):
        items = g.calcular_items(BASES, {"a": 600, "b": 10, "c": None, "d": None}, {"a": 100})
        por = {i["baseId"]: i for i in items}
        self.assertEqual(por["a"]["estado"], "anomalia")
        self.assertEqual(por["b"]["estado"], "nuevo")
        self.assertIsNone(por["b"]["variacionPct"])

    def test_semanas(self):
        # sábado 31 oct 2026 -> última semana cerrada: 19-25 oct (W43)
        lunes = g.ultima_semana_cerrada(dt.date(2026, 10, 31))
        self.assertEqual(g.semana_id(lunes), "2026-W43")
        self.assertEqual(lunes, dt.date(2026, 10, 19))
        # lunes 2 nov: la semana W44 (26 oct-1 nov) acaba de cerrar
        self.assertEqual(g.semana_id(g.ultima_semana_cerrada(dt.date(2026, 11, 2))), "2026-W44")
        self.assertEqual(g.etiqueta(dt.date(2026, 10, 19), dt.date(2026, 10, 25)), "Semana del 19 al 25 de octubre de 2026")
        self.assertEqual(g.etiqueta(dt.date(2026, 10, 26), dt.date(2026, 11, 1)), "Semana del 26 de octubre al 1 de noviembre de 2026")


class Flujo(unittest.TestCase):
    def setUp(self):
        self.tmp = tempfile.TemporaryDirectory()
        self.d = Path(self.tmp.name)
        (self.d / "ranking").mkdir()
        (self.d / "bases.json").write_text(json.dumps(BASES))
        (self.d / "ranking" / "2026-W43.json").write_text(json.dumps({"datosIlustrativos": True, "items": []}))
        (self.d / "ranking" / "index.json").write_text(json.dumps({"ultima": "2026-W43", "semanas": ["2026-W43"]}))
        (self.d / "historial.json").write_text(json.dumps({"a": [{"semana": "2026-W43", "inicio": "2026-10-19", "consultas": 1000}]}))

    def tearDown(self):
        self.tmp.cleanup()

    def test_reemplaza_ilustrativo_y_no_toca_cerradas(self):
        ad = {"a": lambda i, f: 300, "b": lambda i, f: 150}
        lunes = dt.date(2026, 10, 19)
        r = g.generar(self.d, lunes, ad)
        self.assertFalse(r["datosIlustrativos"])
        hist = json.loads((self.d / "historial.json").read_text())
        self.assertEqual(hist["a"], [{"semana": "2026-W43", "inicio": "2026-10-19", "consultas": 300}])  # ilustrativo descartado
        with self.assertRaises(SystemExit):  # ya cerrada y real: no se modifica
            g.generar(self.d, lunes, ad)

    def test_semana_siguiente_acumula_y_calcula_variacion(self):
        g.generar(self.d, dt.date(2026, 10, 19), {"a": lambda i, f: 300, "b": lambda i, f: 150})
        r = g.generar(self.d, dt.date(2026, 10, 26), {"a": lambda i, f: 330, "b": lambda i, f: 120})
        por = {i["baseId"]: i for i in r["items"]}
        self.assertEqual(por["a"]["variacionPct"], 10)
        self.assertEqual(por["b"]["variacionPct"], -20)
        idx = json.loads((self.d / "ranking" / "index.json").read_text())
        self.assertEqual(idx, {"ultima": "2026-W44", "semanas": ["2026-W43", "2026-W44"]})
        self.assertEqual(len(json.loads((self.d / "historial.json").read_text())["a"]), 2)

    def test_fuente_caida_es_sin_dato_y_todas_caidas_no_publica(self):
        def falla(i, f):
            raise RuntimeError("caída")
        r = g.generar(self.d, dt.date(2026, 10, 19), {"a": lambda i, f: 5, "b": falla})
        self.assertEqual({i["baseId"]: i["estado"] for i in r["items"]}["b"], "sin_dato")
        with self.assertRaises(SystemExit):
            g.generar(self.d, dt.date(2026, 10, 26), {"a": falla})


class Inat(unittest.TestCase):
    def _falso(self, nombre_taxon="Chiroptera", lugares=None):
        lugares = lugares or {"1": "United States", "6712": "Canada", "6793": "Mexico"}
        llamadas = []

        def falso(url, headers=None):
            llamadas.append(url)
            if "/v1/taxa/" in url:
                return {"results": [{"name": nombre_taxon}]}
            if "/v1/places/" in url:
                return {"results": [{"name": lugares[url.rsplit("/", 1)[1]]}]}
            return {"total_results": 10}
        return falso, llamadas

    def test_suma_tres_paises(self):
        falso, llamadas = self._falso()
        original, g._get_json = g._get_json, falso
        try:
            self.assertEqual(g.inat_taxon(40268, "Chiroptera")(dt.date(2026, 10, 19), dt.date(2026, 10, 25)), 30)
        finally:
            g._get_json = original
        self.assertEqual(sum("observations?" in u for u in llamadas), 3)

    def test_taxon_o_lugar_incorrecto_falla(self):
        for falso in (self._falso("Otra cosa")[0], self._falso(lugares={"1": "Narnia", "6712": "Canada", "6793": "Mexico"})[0]):
            original, g._get_json = g._get_json, falso
            try:
                with self.assertRaises(RuntimeError):
                    g.inat_taxon(40268, "Chiroptera")(dt.date(2026, 10, 19), dt.date(2026, 10, 25))
            finally:
                g._get_json = original


if __name__ == "__main__":
    unittest.main()
