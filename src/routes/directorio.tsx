import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Estado, TarjetaBase, btnContorno, campo } from "@/components/silvestre";
import { cargarDatos, type Cobertura, type Datos } from "@/lib/data";
import { accesosUnicos, conteos, filtrarBases, regionesPresentes, tiposUnicos, type Filtros, type Orden } from "@/lib/filtros";
import { ACCESO } from "@/lib/formato";

interface Busqueda {
  grupo?: string | undefined;
  tipo?: string | undefined;
  region?: string | undefined;
  acceso?: string | undefined;
  q?: string | undefined;
  orden?: string | undefined;
}

const str = (v: unknown) => (typeof v === "string" && v ? v : undefined);

export const Route = createFileRoute("/directorio")({
  validateSearch: (s: Record<string, unknown>): Busqueda => ({
    grupo: str(s["grupo"]),
    tipo: str(s["tipo"]),
    region: str(s["region"]),
    acceso: str(s["acceso"]),
    q: str(s["q"]),
    orden: str(s["orden"]),
  }),
  head: () => ({
    meta: [
      { title: "Directorio de bases de datos · Pulso Silvestre" },
      { name: "description", content: "Explora y filtra bases de datos abiertas de observación, rastreo y audio de fauna silvestre." },
      { property: "og:title", content: "Directorio · Pulso Silvestre" },
      { property: "og:description", content: "Bases de datos abiertas de fauna silvestre filtrables por grupo, región, tipo y acceso." },
    ],
  }),
  loader: () => cargarDatos(),
  pendingComponent: () => <Estado cargando error={null} />,
  errorComponent: ({ error }) => <Estado cargando={false} error={error} />,
  component: Directorio,
});

function Directorio() {
  return <Contenido d={Route.useLoaderData()} />;
}

const lista = (v?: string) => (v ? v.split(",").filter(Boolean) : []);

function Contenido({ d }: { d: Datos }) {
  const s = Route.useSearch();
  const navigate = useNavigate({ from: "/directorio" });
  const f: Filtros = {
    grupo: lista(s.grupo),
    tipo: s.tipo ?? "",
    region: (["mexico", "norteamerica", "mundial"].includes(s.region ?? "") ? s.region : "mexico") as Cobertura,
    acceso: lista(s.acceso),
    q: s.q ?? "",
    orden: (["consultas", "az", "reciente"].includes(s.orden ?? "") ? s.orden : "consultas") as Orden,
  };
  const set = (p: Partial<Busqueda>) =>
    navigate({ search: (prev) => ({ ...prev, ...p }), replace: true });
  const toggle = (arr: string[], v: string) => {
    const n = arr.includes(v) ? arr.filter((x) => x !== v) : [...arr, v];
    return n.length ? n.join(",") : undefined;
  };
  const limpiar = () => navigate({ search: {}, replace: true });
  const res = filtrarBases(d.bases, d.ranking, f);
  const tipos = tiposUnicos(d.bases);
  const n = conteos(d.bases, f);
  const chip = (activo: boolean) =>
    `min-h-11 rounded-full px-4 text-sm font-medium ${activo ? "bg-grad-cafe text-blanco shadow-btn" : "border border-campo bg-card text-texto2 hover:bg-tinte"}`;

  return (
    <main className="mx-auto max-w-6xl px-4 py-10">
      <h1 className="text-tinta">Directorio de bases de datos</h1>
      <div className="mt-8 grid gap-6 lg:grid-cols-[260px_1fr]">
        <aside className="card h-fit space-y-5 p-4" aria-label="Filtros">
          <label className="grid gap-1 text-sm font-medium text-texto2">Buscar
            <input type="search" className={campo} value={f.q} placeholder="Nombre, fuente o descripción" onChange={(e) => set({ q: e.target.value || undefined })} />
          </label>
          <label className="grid gap-1 text-sm font-medium text-texto2">Región
            <select className={campo} value={f.region} onChange={(e) => set({ region: e.target.value })}>
              {regionesPresentes(d.bases).map((r) => <option key={r.id} value={r.id}>{r.nombre} ({n.region[r.id] ?? 0})</option>)}
            </select>
          </label>
          <fieldset>
            <legend className="text-sm font-medium text-texto2">Grupo</legend>
            {d.grupos.map((g) => (
              <label key={g.id} className="flex min-h-11 items-center gap-2 text-sm text-tinta">
                <input type="checkbox" className="h-5 w-5 accent-cafe" checked={f.grupo.includes(g.id)} disabled={!f.grupo.includes(g.id) && !n.grupo[g.id]} onChange={() => set({ grupo: toggle(f.grupo, g.id) })} />
                {g.nombre} <span className="font-mono text-xs text-atenuado">({n.grupo[g.id] ?? 0})</span>
              </label>
            ))}
          </fieldset>
          <fieldset>
            <legend className="text-sm font-medium text-texto2">Acceso</legend>
            {accesosUnicos(d.bases).map((a) => (
              <label key={a} className="flex min-h-11 items-center gap-2 text-sm text-tinta">
                <input type="checkbox" className="h-5 w-5 accent-cafe" checked={f.acceso.includes(a)} disabled={!f.acceso.includes(a) && !n.acceso[a]} onChange={() => set({ acceso: toggle(f.acceso, a) })} />
                {ACCESO[a] ?? a} <span className="font-mono text-xs text-atenuado">({n.acceso[a] ?? 0})</span>
              </label>
            ))}
          </fieldset>
          <button type="button" className={`${btnContorno} w-full`} onClick={limpiar}>Limpiar filtros</button>
        </aside>

        <section aria-label="Resultados">
          <div role="group" aria-label="Tipo de dato" className="flex flex-wrap gap-2">
            <button type="button" aria-pressed={!f.tipo} className={chip(!f.tipo)} onClick={() => set({ tipo: undefined })}>Todos</button>
            {tipos.map((t) => (
              <button key={t} type="button" aria-pressed={f.tipo === t} disabled={f.tipo !== t && !n.tipo[t]} className={`${chip(f.tipo === t)} disabled:opacity-40`} onClick={() => set({ tipo: t })}>{t} ({n.tipo[t] ?? 0})</button>
            ))}
          </div>
          <div className="mt-4 flex flex-wrap items-end justify-between gap-3">
            <p aria-live="polite" className="font-mono text-sm text-texto2">{res.length} {res.length === 1 ? "base de datos" : "bases de datos"}</p>
            <label className="grid gap-1 text-sm font-medium text-texto2">Ordenar por
              <select className={campo} value={f.orden} onChange={(e) => set({ orden: e.target.value })}>
                <option value="consultas">Más activas frente a lo habitual</option>
                <option value="az">Nombre (A–Z)</option>
                <option value="reciente">Actualización reciente</option>
              </select>
            </label>
          </div>
          {res.length === 0 ? (
            <div className="card mt-6 p-8 text-center">
              <h2 className="text-xl text-tinta">Sin resultados</h2>
              <p className="mt-2 text-sm text-texto2">Ninguna base coincide con estos filtros. Prueba con menos criterios.</p>
              <button type="button" className={`${btnContorno} mt-4`} onClick={limpiar}>Limpiar filtros</button>
            </div>
          ) : (
            <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {res.map((b) => <TarjetaBase key={b.id} base={b} grupos={d.grupos} />)}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
