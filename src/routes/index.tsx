import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState, type CSSProperties } from "react";
import { Estado, Foto, Variacion, btnPrimario, campo } from "@/components/silvestre";
import { cargarDatos, type Datos, type Grupo } from "@/lib/data";
import { REGIONES, tiposUnicos } from "@/lib/filtros";
import type { Cobertura } from "@/lib/data";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Pulso Silvestre · Bases de datos abiertas de fauna y su actividad semanal" },
      { name: "description", content: "Directorio de bases de datos abiertas de fauna silvestre, con la actividad semanal de registros nuevos de las fuentes que la publican." },
      { property: "og:title", content: "Pulso Silvestre · Actividad semanal" },
      { property: "og:description", content: "Directorio de bases de datos abiertas de fauna silvestre y su actividad semanal, construido solo con fuentes abiertas." },
    ],
  }),
  loader: () => cargarDatos(),
  pendingComponent: () => <Estado cargando error={null} />,
  errorComponent: ({ error }) => <Estado cargando={false} error={error} />,
  component: Inicio,
});

function Inicio() {
  return <Contenido d={Route.useLoaderData()} />;
}

function Contenido({ d }: { d: Datos }) {
  const { ranking } = d;
  return (
    <main>
      <section className="relative overflow-hidden px-4 pb-6 pt-12 text-center">
        <div className="bg-halo pointer-events-none absolute left-1/2 top-0 h-[520px] w-[820px] max-w-[160vw] -translate-x-1/2" aria-hidden="true" />
        <div className="relative mx-auto max-w-3xl">
          {ranking.datosIlustrativos && (
            <span className="bg-lima mb-4 inline-block rounded-full px-3 py-1 text-xs font-semibold text-tinta">Datos ilustrativos</span>
          )}
          <p className="font-mono text-xs uppercase tracking-widest text-atenuado">{ranking.semana.etiqueta} · {ranking.semana.id}</p>
          <h1 className="mt-3 text-tinta">Directorio de bases de datos abiertas de fauna silvestre y su actividad semanal</h1>
          <p className="mx-auto mt-4 max-w-2xl text-texto2">Fuentes abiertas de observación, rastreo y audio de fauna, con un pulso semanal de registros nuevos en las que lo publican. Elige un grupo en el panal para explorar su directorio.</p>
        </div>
        <Panal grupos={d.grupos} />
      </section>
      <BarraFiltros d={d} />
      <Carrusel d={d} />
      <Metodo />
      <Senales />
    </main>
  );
}

const relleno: Record<Grupo["color"], string> = {
  cafe: "bg-grad-cafe text-blanco",
  lima: "bg-grad-lima text-tinta",
  naranja: "bg-grad-naranja text-tinta",
  oliva: "bg-grad-oliva text-tinta",
};

function Panal({ grupos }: { grupos: Grupo[] }) {
  const g = grupos.slice(0, 6);
  const filas: (Grupo | "todos" | undefined)[][] = [[g[0], g[1]], [g[2], "todos", g[3]], [g[4], g[5]]];
  const w = "clamp(92px,26vw,136px)";
  const hex = (x: Grupo | "todos" | undefined, k: number) => {
    if (!x) return null;
    const todos = x === "todos";
    const nombre = todos ? "Todos los grupos" : x.nombre;
    return (
      <Link
        key={k}
        to="/directorio"
        search={todos ? {} : { grupo: x.id }}
        aria-label={`Explorar ${nombre}`}
        className={`hex flex items-center justify-center p-3 text-center text-sm font-semibold transition-transform hover:scale-105 ${todos ? "bg-grad-rojo text-blanco" : relleno[x.color]}`}
        style={{ width: w, aspectRatio: "0.866" }}
      >
        {nombre}
      </Link>
    );
  };
  return (
    <nav aria-label="Grupos animales" className="relative mx-auto mt-10 flex flex-col items-center" style={{ filter: "drop-shadow(0 10px 14px rgba(13,28,66,.25))" }}>
      {filas.map((f, i) => (
        <div key={i} className="flex gap-2" style={i > 0 ? ({ marginTop: `calc(${w} * -0.2887 + 7px)` } as CSSProperties) : undefined}>
          {f.map(hex)}
        </div>
      ))}
    </nav>
  );
}

function BarraFiltros({ d }: { d: Datos }) {
  const navigate = useNavigate();
  const [region, setRegion] = useState<Cobertura>("mexico");
  const [grupo, setGrupo] = useState("");
  const [tipo, setTipo] = useState("");
  return (
    <section aria-label="Filtros rápidos" className="mx-auto mt-8 max-w-5xl px-4">
      <form
        className="card grid gap-3 p-4 sm:grid-cols-2 lg:grid-cols-4 lg:items-end"
        onSubmit={(e) => {
          e.preventDefault();
          navigate({ to: "/directorio", search: { region, ...(grupo && { grupo }), ...(tipo && { tipo }) } });
        }}
      >
        <label className="grid gap-1 text-sm font-medium text-texto2">Región
          <select className={campo} value={region} onChange={(e) => setRegion(e.target.value as Cobertura)}>
            {REGIONES.map((r) => <option key={r.id} value={r.id}>{r.nombre}</option>)}
          </select>
        </label>
        <label className="grid gap-1 text-sm font-medium text-texto2">Grupo
          <select className={campo} value={grupo} onChange={(e) => setGrupo(e.target.value)}>
            <option value="">Todos los grupos</option>
            {d.grupos.map((g) => <option key={g.id} value={g.id}>{g.nombre}</option>)}
          </select>
        </label>
        <label className="grid gap-1 text-sm font-medium text-texto2">Tipo de dato
          <select className={campo} value={tipo} onChange={(e) => setTipo(e.target.value)}>
            <option value="">Todos</option>
            {tiposUnicos(d.bases).map((t) => <option key={t} value={t}>{t}</option>)}
          </select>
        </label>
        <button type="submit" className={btnPrimario}>Ver directorio completo</button>
      </form>
    </section>
  );
}

function Carrusel({ d }: { d: Datos }) {
  const items = d.ranking.items
    .filter((i) => i.posicion != null && i.estado !== "sin_dato")
    .sort((a, b) => (a.posicion ?? 0) - (b.posicion ?? 0));
  return (
    <section className="mx-auto mt-12 max-w-6xl px-4" aria-labelledby="t-carrusel">
      <h2 id="t-carrusel" className="text-2xl text-tinta">Más actividad esta semana</h2>
      <p className="mt-1 text-sm text-atenuado">Desliza para ver más → · Índice 100 = la más activa de la semana</p>
      <div role="region" aria-label="Carrusel de actividad semanal" tabIndex={0} className="mt-4 flex snap-x snap-mandatory gap-4 overflow-x-auto pb-4">
        {items.map((it) => {
          const b = d.bases.find((x) => x.id === it.baseId);
          if (!b) return null;
          return (
            <Link key={b.id} to="/base/$id" params={{ id: b.id }} className="card relative w-[208px] shrink-0 snap-start p-3">
              <span className="bg-cafe absolute left-2 top-2 z-10 flex h-9 w-9 items-center justify-center rounded-full border-2 border-blanco font-mono text-sm font-medium text-blanco">{it.posicion}</span>
              <Foto base={b} />
              <h3 className="mt-3 font-semibold leading-snug text-tinta">{b.nombre}</h3>
              <p className="text-xs text-atenuado">{b.fuente}</p>
              <div className="mt-2 flex items-baseline justify-between">
                <span className="font-mono text-sm text-tinta">Índice {it.indice ?? "—"}</span>
                <Variacion item={it} />
              </div>
              <div className="bg-pista mt-2 h-2 rounded-full" aria-hidden="true">
                <div className="bg-rojo h-2 rounded-full" style={{ width: `${it.indice ?? 0}%` }} />
              </div>
            </Link>
          );
        })}
      </div>
    </section>
  );
}

function Metodo() {
  const pasos = [
    "Consultamos las APIs abiertas de cada fuente y contamos los registros nuevos que publicó durante la semana ISO (lunes a domingo).",
    "Cada fuente usa su propia unidad (observaciones, listas de verificación u ocurrencias); las que no publican una métrica abierta aparecen como «Sin dato esta semana».",
    "Calculamos el índice: 100 es la base con más actividad y las demás se expresan en proporción.",
  ];
  return (
    <section id="metodo" className="mx-auto mt-16 max-w-5xl scroll-mt-6 px-4" aria-labelledby="t-metodo">
      <h2 id="t-metodo" className="text-2xl text-tinta">Cómo se calcula</h2>
      <ol className="mt-4 grid gap-4 md:grid-cols-3">
        {pasos.map((p, i) => (
          <li key={i} className="card p-4">
            <span className="bg-grad-naranja flex h-9 w-9 items-center justify-center rounded-full font-mono font-medium text-tinta">{i + 1}</span>
            <p className="mt-3 text-texto2">{p}</p>
          </li>
        ))}
      </ol>
      <div className="bg-tinte mt-4 rounded-xl border p-5">
        <h3 className="font-semibold text-tinta">¿Por qué el índice es fijo?</h3>
        <p className="mt-2 text-sm text-texto2">
          Se calcula una sola vez, al cerrar la semana, con la fórmula 100 × actividad ÷ actividad de la base líder, y se guarda. No se recalcula en tu navegador ni al aplicar filtros, así que una cita o una captura de pantalla sigue siendo reproducible. Si cambia la fórmula, se publica una nueva versión del método sin tocar las semanas anteriores.
        </p>
      </div>
      <p className="mt-3 text-sm text-atenuado">Solo datos abiertos. Cada ficha indica la licencia y cómo citar la fuente. El índice sirve para ordenar dentro de la semana: las unidades difieren entre fuentes y no mide importancia ni número de consultas.</p>
    </section>
  );
}

function Senales() {
  const celdas = [0, 1, 0, 0, 2, 1, 0, 1, 2, 0, 0, 1, 0, 2, 1, 0, 1, 0, 0, 2, 0, 1, 0, 0];
  return (
    <section className="mx-auto mt-16 max-w-5xl px-4" aria-labelledby="t-senales">
      <h2 id="t-senales" className="text-2xl text-tinta">Señales regionales</h2>
      <p className="mt-1 text-sm text-atenuado">Tipos de señal que este pulso semanal permitirá seguir por región.</p>
      <div className="mt-4 grid gap-4 md:grid-cols-3">
        <figure className="card p-4">
          <figcaption className="font-semibold text-tinta">Fenología</figcaption>
          <p className="text-xs text-atenuado">Llegada de aves migratorias frente al promedio</p>
          <svg viewBox="0 0 200 80" className="mt-3 w-full" role="img" aria-label="Línea de llegadas frente a promedio punteado">
            <polyline points="0,70 30,64 60,50 90,30 120,22 150,30 180,46 200,52" fill="none" stroke="var(--atenuado)" strokeWidth="2" strokeDasharray="4 4" />
            <polyline points="0,72 30,60 60,40 90,18 120,14 150,26 180,40 200,48" fill="none" stroke="var(--rojo)" strokeWidth="2.5" />
          </svg>
        </figure>
        <figure className="card p-4">
          <figcaption className="font-semibold text-tinta">Distribución</figcaption>
          <p className="text-xs text-atenuado">Celdas con registros nuevos</p>
          <svg viewBox="0 0 200 80" className="mt-3 w-full" role="img" aria-label="Cuadrícula de celdas con registros nuevos">
            {celdas.map((c, i) => (
              <rect key={i} x={(i % 8) * 25 + 1} y={Math.floor(i / 8) * 26 + 1} width="23" height="24" rx="3" fill={c === 2 ? "var(--oliva)" : c === 1 ? "var(--lima)" : "var(--pista)"} />
            ))}
          </svg>
        </figure>
        <figure className="card p-4">
          <figcaption className="font-semibold text-tinta">Movimiento</figcaption>
          <p className="text-xs text-atenuado">Ruta GPS de un individuo</p>
          <svg viewBox="0 0 200 80" className="mt-3 w-full" role="img" aria-label="Ruta GPS">
            <path d="M10 66 C40 60 50 30 80 34 S120 64 140 40 S170 12 190 14" fill="none" stroke="var(--cafe)" strokeWidth="2.5" />
            {[[10, 66], [80, 34], [140, 40], [190, 14]].map(([x, y], i) => <circle key={i} cx={x} cy={y} r="4" fill="var(--naranja)" />)}
          </svg>
        </figure>
      </div>
    </section>
  );
}
