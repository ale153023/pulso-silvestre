import datetime as dt
import json
import tempfile
import unittest
from pathlib import Path

import generar_ranking as g

BASES = [{"id": "a", "nombre": "Alfa"}, {"id": "b", "nombre": "Beta"},
         {"id": "c", "nombre": "Gamma"}, {"id": "d", "nombre": "Delta"}]


class Calculo(unittest.TestCase):
    def test_indice_relativo_a_la_mediana(self):
        # a: 200 vs mediana(100,100,100,400)=100 -> 200; b: 50 vs mediana(100,100,100)=100 -> 50
        items = g.calcular_items(BASES, {"a": 200, "b": 50, "c": 80, "d": None},
                                 {"a": [100, 100, 100, 400], "b": [100, 100, 100], "c": [100, 100]},
                                 {"a": 100, "b": 200, "c": 5})
        por = {i["baseId"]: i for i in items}
        self.assertEqual((por["a"]["indice"], por["a"]["posicion"]), (200, 1))
        self.assertEqual((por["b"]["indice"], por["b"]["posicion"]), (50, 2))
        self.assertEqual(por["a"]["variacionPct"], 100)
        self.assertEqual(por["b"]["variacionPct"], -75)
        # c: solo 2 semanas de referencia (< 3): sin índice ni posición, pero con dato
        self.assertIsNone(por["c"]["indice"])
        self.assertIsNone(por["c"]["posicion"])
        self.assertEqual(por["c"]["consultas"], 80)
        self.assertIsNone(por["c"]["variacionPct"])  # previa < 10
        self.assertEqual(por["d"]["estado"], "sin_dato")

    def test_unidades_distintas_no_distorsionan(self):
        # una fuente de millones y otra de cientos, ambas en su nivel habitual -> ambas 100
        items = g.calcular_items(BASES, {"a": 3_000_000, "b": 250},
                                 {"a": [3_000_000] * 4, "b": [250] * 4}, {"a": 3_000_000, "b": 250})
        self.assertEqual({i["baseId"]: i["indice"] for i in items if i["indice"] is not None}, {"a": 100, "b": 100})

    def test_mediana_cero_no_da_indice(self):
        items = g.calcular_items(BASES, {"a": 10}, {"a": [0, 0, 0]}, {"a": 0})
        self.assertIsNone(items[0]["indice"])

    def test_empate_desempata_por_nombre_y_anomalia(self):
        items = g.calcular_items(BASES, {"a": 100, "b": 100, "c": 600},
                                 {"a": [100] * 3, "b": [100] * 3, "c": [100] * 3}, {"c": 100})
        por = {i["baseId"]: i for i in items}
        self.assertEqual(por["c"]["estado"], "anomalia")
        self.assertEqual(por["c"]["posicion"], 1)
        self.assertEqual((por["a"]["posicion"], por["b"]["posicion"]), (2, 3))
        self.assertEqual(por["a"]["estado"], "nuevo")

    def test_semanas(self):
        lunes = g.ultima_semana_cerrada(dt.date(2026, 10, 31))
        self.assertEqual(g.semana_id(lunes), "2026-W43")
        self.assertEqual(lunes, dt.date(2026, 10, 19))
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
        g.RETROSPECTIVOS = {"a"}  # "a" se reconstruye; "b" solo se acumula

    def tearDown(self):
        self.tmp.cleanup()

    def test_reemplaza_ilustrativo_reconstruye_y_no_toca_cerradas(self):
        llamadas = []

        def a(i, f):
            llamadas.append(i)
            return 100  # nivel habitual constante
        lunes = dt.date(2026, 10, 19)
        r = g.generar(self.d, lunes, {"a": lambda i, f: 150 if i == lunes else a(i, f), "b": lambda i, f: 40})
        por = {i["baseId"]: i for i in r["items"]}
        # a: 4 semanas previas reconstruidas (mediana 100) -> índice 150
        self.assertEqual((por["a"]["indice"], por["a"]["posicion"]), (150, 1))
        self.assertEqual(len(llamadas), 4)
        # b: no retrospectiva y sin historial -> dato sin índice
        self.assertIsNone(por["b"]["indice"])
        hist = json.loads((self.d / "historial.json").read_text())
        self.assertEqual(len(hist["a"]), 5)  # 4 reconstruidas + la actual; la ilustrativa se descartó
        self.assertEqual(hist["a"][-1]["consultas"], 150)
        self.assertEqual(hist["b"], [{"semana": "2026-W43", "inicio": "2026-10-19", "consultas": 40}])
        with self.assertRaises(SystemExit):  # ya cerrada y real: no se modifica
            g.generar(self.d, lunes, {"a": lambda i, f: 1})

    def test_fuente_acumulada_obtiene_indice_tras_tres_semanas(self):
        ad = {"b": lambda i, f: 40}
        for lunes in (dt.date(2026, 10, 19), dt.date(2026, 10, 26), dt.date(2026, 11, 2)):
            r = g.generar(self.d, lunes, ad)
            self.assertIsNone({i["baseId"]: i for i in r["items"]}["b"]["indice"])
        r = g.generar(self.d, dt.date(2026, 11, 9), {"b": lambda i, f: 60})
        b = {i["baseId"]: i for i in r["items"]}["b"]
        self.assertEqual(b["indice"], 150)  # 60 vs mediana(40,40,40)
        self.assertEqual(b["variacionPct"], 50)
        idx = json.loads((self.d / "ranking" / "index.json").read_text())
        self.assertEqual(idx["ultima"], "2026-W46")

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
