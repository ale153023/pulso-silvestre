import { describe, expect, it } from "vitest";
import bases from "../../public/data/bases.json";
import { filtrarBases, type Filtros } from "@/lib/filtros";
import type { Base, Ranking } from "@/lib/data";

const B = bases as Base[];
// Ranking de prueba fijo: no depende de las semanas reales que publique el flujo semanal.
const R = {
  semana: { id: "2026-W00", inicio: "2026-01-01", fin: "2026-01-07", etiqueta: "Prueba" },
  metodoVersion: 2,
  cerrada: true,
  datosIlustrativos: true,
  generadoEn: "2026-01-08T00:00:00Z",
  items: [
    { baseId: "ebird", posicion: 1, consultas: 1000, indice: 100, variacionPct: null, estado: "nuevo" },
    { baseId: "movebank", posicion: 2, consultas: 860, indice: 86, variacionPct: null, estado: "nuevo" },
  ],
} as Ranking;
const f = (p: Partial<Filtros>): Filtros => ({ grupo: [], tipo: "", region: "mexico", acceso: [], q: "", orden: "consultas", ...p });

describe("filtros del directorio", () => {
  it("México muestra todas las bases (región jerárquica)", () => {
    expect(filtrarBases(B, R, f({})).length).toBe(8);
  });
  it("Mundial excluye las bases solo de México", () => {
    expect(filtrarBases(B, R, f({ region: "mundial" })).map((b) => b.id)).not.toContain("gbif-mx");
  });
  it("búsqueda ignora acentos y mayúsculas", () => {
    expect(filtrarBases(B, R, f({ q: "MEXICO" })).map((b) => b.id)).toContain("gbif-mx");
  });
  it("orden por consultas sigue la posición publicada", () => {
    expect(filtrarBases(B, R, f({})).map((b) => b.id).slice(0, 2)).toEqual(["ebird", "movebank"]);
  });
});
