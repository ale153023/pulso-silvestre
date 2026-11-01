import type { Base, Cobertura, Grupo, Ranking } from "./data";

export const NIVEL: Record<Cobertura, number> = { mexico: 0, norteamerica: 1, mundial: 2 };
export const REGIONES: { id: Cobertura; nombre: string }[] = [
  { id: "mexico", nombre: "México" },
  { id: "norteamerica", nombre: "Norteamérica" },
  { id: "mundial", nombre: "Mundial" },
];
export type Orden = "consultas" | "az" | "reciente";

export interface Filtros {
  grupo: string[];
  tipo: string;
  region: Cobertura;
  acceso: string[];
  q: string;
  orden: Orden;
}

export const normalizar = (s: string) =>
  s.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();

export function tiposUnicos(bases: Base[]): string[] {
  return [...new Set(bases.map((b) => b.tipo))].sort((a, b) => a.localeCompare(b, "es"));
}

export function coincide(b: Base, f: Filtros, omitir?: "grupo" | "tipo" | "region" | "acceso"): boolean {
  const q = normalizar(f.q.trim());
  return (
    (omitir === "region" || NIVEL[b.cobertura] >= NIVEL[f.region]) &&
    (omitir === "grupo" || f.grupo.length === 0 || b.grupos.some((g) => f.grupo.includes(g))) &&
    (omitir === "acceso" || f.acceso.length === 0 || b.acceso.some((a) => f.acceso.includes(a))) &&
    (omitir === "tipo" || !f.tipo || b.tipo === f.tipo) &&
    (!q || normalizar(`${b.nombre} ${b.fuente} ${b.descripcion}`).includes(q))
  );
}

/** Opciones únicas presentes en los datos (nada fijo en el código). */
export const accesosUnicos = (bases: Base[]): string[] => [...new Set(bases.flatMap((b) => b.acceso))].sort();
export const regionesPresentes = (bases: Base[]) =>
  REGIONES.filter((r) => bases.some((b) => b.cobertura === r.id));

/** Conteo por opción, aplicando todos los demás filtros (facetas dinámicas). */
export function conteos(bases: Base[], f: Filtros) {
  const grupo: Record<string, number> = {};
  const acceso: Record<string, number> = {};
  const tipo: Record<string, number> = {};
  const region: Record<string, number> = {};
  for (const b of bases) {
    if (coincide(b, f, "grupo")) b.grupos.forEach((g) => (grupo[g] = (grupo[g] ?? 0) + 1));
    if (coincide(b, f, "acceso")) b.acceso.forEach((a) => (acceso[a] = (acceso[a] ?? 0) + 1));
    if (coincide(b, f, "tipo")) tipo[b.tipo] = (tipo[b.tipo] ?? 0) + 1;
    for (const r of REGIONES) if (NIVEL[b.cobertura] >= NIVEL[r.id] && coincide(b, f, "region")) region[r.id] = (region[r.id] ?? 0) + 1;
  }
  return { grupo, acceso, tipo, region };
}

/** Filtra y ordena; solo lee la posición publicada, nunca la calcula. */
export function filtrarBases(bases: Base[], ranking: Ranking, f: Filtros): Base[] {
  const pos = new Map(ranking.items.map((i) => [i.baseId, i.posicion ?? null]));
  const res = bases.filter((b) => coincide(b, f));
  return res.sort((a, b) => {
    if (f.orden === "az") return a.nombre.localeCompare(b.nombre, "es");
    if (f.orden === "reciente") return b.actualizadoEn.localeCompare(a.actualizadoEn);
    const pa = pos.get(a.id) ?? Infinity;
    const pb = pos.get(b.id) ?? Infinity;
    return pa === pb ? a.nombre.localeCompare(b.nombre, "es") : pa - pb;
  });
}

export function etiquetaGrupos(ids: string[], grupos: Grupo[]): string {
  if (grupos.length > 0 && grupos.every((g) => ids.includes(g.id))) return "Todos los grupos";
  const nombres = ids.map((id) => grupos.find((g) => g.id === id)?.nombre ?? id);
  return nombres.length > 2 ? `${nombres[0]}, ${nombres[1]} +${nombres.length - 2}` : nombres.join(", ");
}

export function relacionadas(actual: Base, bases: Base[], ranking: Ranking): Base[] {
  const cons = new Map(ranking.items.map((i) => [i.baseId, i.consultas ?? 0]));
  return bases
    .filter((b) => b.id !== actual.id)
    .map((b) => ({
      b,
      n: b.grupos.filter((g) => actual.grupos.includes(g)).length + (b.tipo === actual.tipo ? 1 : 0),
    }))
    .filter((x) => x.n > 0)
    .sort((x, y) => y.n - x.n || (cons.get(y.b.id) ?? 0) - (cons.get(x.b.id) ?? 0))
    .slice(0, 3)
    .map((x) => x.b);
}
