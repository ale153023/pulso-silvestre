import { useQuery } from "@tanstack/react-query";
import { z } from "zod";

export const grupoSchema = z.object({
  id: z.string(),
  nombre: z.string(),
  orden: z.number(),
  color: z.enum(["cafe", "lima", "naranja", "oliva"]),
});

export const coberturaSchema = z.enum(["mundial", "norteamerica", "mexico"]);

export const baseSchema = z.object({
  id: z.string(),
  nombre: z.string(),
  fuente: z.string(),
  tipo: z.string(),
  grupos: z.array(z.string()),
  cobertura: coberturaSchema,
  descripcion: z.string(),
  acceso: z.array(z.enum(["api", "descarga"])),
  accesoTexto: z.string(),
  licencia: z.string(),
  metrica: z.enum(["vistas+descargas", "descargas", "registros_nuevos", "sin_metrica_publica", "pendiente"]),
  actualizadoEn: z.string(),
  url: z.string(),
  fotoSugerida: z.string(),
  foto: z.string().optional(),
  credito: z.string().optional(),
  campos: z.array(z.object({ nombre: z.string(), descripcion: z.string() })),
  usos: z.array(z.string()),
});

export const itemSchema = z.object({
  baseId: z.string(),
  posicion: z.number().nullable().optional(),
  consultas: z.number().nullable(),
  indice: z.number().nullable(),
  variacionPct: z.number().nullable(),
  estado: z.enum(["ok", "nuevo", "sin_dato", "anomalia"]),
});

export const rankingSchema = z.object({
  semana: z.object({ id: z.string(), inicio: z.string(), fin: z.string(), etiqueta: z.string() }),
  metodoVersion: z.number(),
  cerrada: z.boolean(),
  datosIlustrativos: z.boolean(),
  generadoEn: z.string(),
  items: z.array(itemSchema),
});

export const senalesSchema = z.object({
  datosIlustrativos: z.boolean(),
  nota: z.string(),
  fenologia: z.object({
    titulo: z.string(), descripcion: z.string(), unidad: z.string(),
    etiquetas: z.array(z.string()), actual: z.array(z.number()), promedio: z.array(z.number()),
  }),
  distribucion: z.object({
    titulo: z.string(), descripcion: z.string(), columnas: z.number(),
    niveles: z.array(z.string()), celdas: z.array(z.number()),
  }),
  movimiento: z.object({
    titulo: z.string(), descripcion: z.string(), trayectoria: z.string(),
    puntos: z.array(z.object({ x: z.number(), y: z.number(), etiqueta: z.string(), detalle: z.string() })),
  }),
});

const indexSchema = z.object({ ultima: z.string(), semanas: z.array(z.string()) });
const historialSchema = z.record(
  z.array(z.object({ semana: z.string(), inicio: z.string(), consultas: z.number() })),
);

export type Grupo = z.infer<typeof grupoSchema>;
export type Base = z.infer<typeof baseSchema>;
export type Item = z.infer<typeof itemSchema>;
export type Ranking = z.infer<typeof rankingSchema>;
export type Cobertura = z.infer<typeof coberturaSchema>;
export type Historial = z.infer<typeof historialSchema>;
export type Senales = z.infer<typeof senalesSchema>;

// En el servidor (SSR) los JSON se leen del propio proyecto: no hay origen al cual hacer fetch.
// En el navegador se piden con fetch y sin caché, como indica el contrato de datos.
const jsonLocales = import.meta.glob("../../public/data/**/*.json", { import: "default" });

async function getJson<T>(path: string, schema: z.ZodType<T>): Promise<T> {
  let crudo: unknown;
  if (import.meta.env.SSR) {
    const leer = jsonLocales[`../../public/data/${path}`];
    if (!leer) throw new Error(`No se encontró ${path}`);
    crudo = await leer();
  } else {
    const res = await fetch(`${import.meta.env.BASE_URL}data/${path}`, { cache: "no-cache" });
    if (!res.ok) throw new Error(`No se pudo cargar ${path} (${res.status})`);
    crudo = await res.json();
  }
  const parsed = schema.safeParse(crudo);
  if (!parsed.success) throw new Error(`Formato inválido en ${path}`);
  return parsed.data;
}

export interface Datos {
  grupos: Grupo[];
  bases: Base[];
  ranking: Ranking;
  historial: Historial;
  senales: Senales;
}

export async function cargarDatos(): Promise<Datos> {
  const [grupos, bases, index, historial, senales] = await Promise.all([
    getJson("grupos.json", z.array(grupoSchema)),
    getJson("bases.json", z.array(baseSchema)),
    getJson("ranking/index.json", indexSchema),
    getJson("historial.json", historialSchema),
    getJson("senales.json", senalesSchema),
  ]);
  const ranking = await getJson(`ranking/${index.ultima}.json`, rankingSchema);
  return { grupos: [...grupos].sort((a, b) => a.orden - b.orden), bases, ranking, historial, senales };
}

export function useDatos() {
  return useQuery({ queryKey: ["datos"], queryFn: cargarDatos, staleTime: Infinity, retry: 1 });
}

export function itemDe(ranking: Ranking, baseId: string): Item | undefined {
  return ranking.items.find((i) => i.baseId === baseId);
}
