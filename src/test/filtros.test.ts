import { describe, expect, it } from "vitest";
import bases from "../../public/data/bases.json";
import ranking from "../../public/data/ranking/2026-W43.json";
import { filtrarBases, type Filtros } from "@/lib/filtros";
import type { Base, Ranking } from "@/lib/data";

const B = bases as Base[];
const R = ranking as Ranking;
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
