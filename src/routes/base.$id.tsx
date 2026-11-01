import { createFileRoute, Link } from "@tanstack/react-router";
import { Chip, Estado, Foto, Variacion, btnContorno, btnPrimario, useIrASeccion } from "@/components/silvestre";
import { itemDe, useDatos, type Datos } from "@/lib/data";
import { etiquetaGrupos, relacionadas } from "@/lib/filtros";
import { ACCESO, COBERTURA, METRICA, fmtCorta, fmtFecha, fmtNum } from "@/lib/formato";

export const Route = createFileRoute("/base/$id")({
  head: () => ({
    meta: [
      { title: "Ficha de base de datos · Pulso Silvestre" },
      { name: "description", content: "Consultas semanales, contenido, licencia y forma de citar una base de datos abierta de fauna." },
      { property: "og:title", content: "Ficha de base de datos · Pulso Silvestre" },
      { property: "og:description", content: "Detalle de una base de datos abierta de fauna silvestre." },
    ],
  }),
  component: Ficha,
});

function Ficha() {
  const q = useDatos();
  if (!q.data) return <Estado cargando={q.isPending} error={q.error} />;
  return <Contenido d={q.data} />;
}

function NoEncontrada() {
  return (
    <main className="mx-auto max-w-md px-4 py-24 text-center">
      <h1 className="text-tinta">Página no encontrada</h1>
      <p className="mt-3 text-texto2">No existe una base con ese identificador.</p>
      <Link to="/" className={`${btnPrimario} mt-6`}>Volver al inicio</Link>
    </main>
  );
}

function Contenido({ d }: { d: Datos }) {
  const { id } = Route.useParams();
  const ir = useIrASeccion();
  const b = d.bases.find((x) => x.id === id);
  if (!b) return <NoEncontrada />;
  const it = itemDe(d.ranking, b.id);
  const sinDato = !it || it.estado === "sin_dato";
  const serie = d.historial[b.id] ?? [];
  const max = Math.max(1, ...serie.map((s) => s.consultas));
  const rel = relacionadas(b, d.bases, d.ranking);
  const grupos = etiquetaGrupos(b.grupos, d.grupos);

  return (
    <main className="mx-auto max-w-6xl px-4 py-8">
      <nav aria-label="Migas de pan" className="text-sm text-atenuado">
        <ol className="flex flex-wrap gap-1">
          <li><Link to="/directorio" className="underline hover:text-cafe">Directorio</Link> /</li>
          <li><Link to="/directorio" search={{ tipo: b.tipo }} className="underline hover:text-cafe">{b.tipo}</Link> /</li>
          <li aria-current="page" className="text-texto2">{b.nombre}</li>
        </ol>
      </nav>
      <div className="mt-4 flex flex-wrap gap-1.5">
        <Chip>{b.tipo}</Chip>
        <Chip tono="lima">{grupos}</Chip>
        {b.acceso.map((a) => <Chip key={a} tono="tinte">{ACCESO[a]}</Chip>)}
      </div>
      <h1 className="mt-3 text-tinta">{b.nombre}</h1>
      <p className="mt-3 max-w-3xl text-texto2">{b.descripcion}</p>
      <div className="mt-5 flex flex-wrap gap-2">
        <a href={b.url} target="_blank" rel="noopener noreferrer" className={btnPrimario}>Ir a la fuente</a>
        <button type="button" className={btnContorno} onClick={() => ir("citar")}>Cómo citar</button>
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-[1fr_320px]">
        <div className="space-y-6">
          <div className="grid gap-3 sm:grid-cols-3">
            <Dato t="Semana cerrada" v={<span className="font-mono">{d.ranking.semana.id}</span>} />
            <Dato t="Índice de la semana" v={<span className="font-mono">{sinDato ? "Sin dato esta semana" : (it?.indice ?? "—")}</span>} />
            <Dato t="Variación semanal" v={sinDato ? <span className="font-mono text-atenuado">Sin dato esta semana</span> : <Variacion item={it} />} />
          </div>

          <section className="card p-5" aria-labelledby="t-consultas">
            <h2 id="t-consultas" className="text-xl text-tinta">Consultas por semana</h2>
            {serie.length === 0 ? (
              <p className="mt-3 text-sm text-atenuado">Sin historial disponible.</p>
            ) : (
              <>
              <ul className="sr-only">
                {serie.map((s) => <li key={s.semana}>Semana del {fmtCorta(s.inicio)}: {fmtNum(s.consultas)} consultas</li>)}
              </ul>
              <div className="mt-4 flex h-48 items-end gap-2" aria-hidden="true">
                {serie.map((s, i) => (
                  <div key={s.semana} className="flex h-full flex-1 flex-col items-center justify-end gap-1">
                    <span className="font-mono text-[10px] text-texto2">{fmtNum(s.consultas)}</span>
                    <div className={`w-full rounded-t ${i === serie.length - 1 ? "bg-cafe" : "bg-rojo/60"}`} style={{ height: `${(s.consultas / max) * 75}%` }} />
                    <span className="font-mono text-[10px] text-atenuado">{fmtCorta(s.inicio)}</span>
                  </div>
                ))}
              </div>
              </>
            )}
          </section>

          <section className="card p-5" aria-labelledby="t-contiene">
            <h2 id="t-contiene" className="text-xl text-tinta">Qué contiene</h2>
            <ul className="mt-3 divide-y">
              {b.campos.map((c) => (
                <li key={c.nombre} className="py-2 text-sm"><span className="font-semibold text-tinta">{c.nombre}</span> <span className="text-texto2">— {c.descripcion}</span></li>
              ))}
            </ul>
          </section>

          <section className="card p-5" aria-labelledby="t-usos">
            <h2 id="t-usos" className="text-xl text-tinta">Útil para seguimiento regional</h2>
            <ul className="mt-3 list-disc space-y-1 pl-5 text-sm text-texto2">
              {b.usos.map((u) => <li key={u}>{u}</li>)}
            </ul>
          </section>
        </div>

        <aside className="space-y-6">
          <Foto base={b} cuadrado={false} />
          <section className="card p-5" aria-labelledby="t-rapidos">
            <h2 id="t-rapidos" className="text-xl text-tinta">Datos rápidos</h2>
            <dl className="mt-3 space-y-2 text-sm">
              {[
                ["Fuente", b.fuente],
                ["Tipo", b.tipo],
                ["Grupos", grupos],
                ["Cobertura", COBERTURA[b.cobertura]],
                ["Acceso", b.accesoTexto],
                ["Licencia", b.licencia],
                ["Actualización", fmtFecha(b.actualizadoEn)],
                ["Métrica de uso", METRICA[b.metrica]],
              ].map(([k, v]) => (
                <div key={k}><dt className="font-mono text-xs uppercase text-atenuado">{k}</dt><dd className="text-tinta">{v}</dd></div>
              ))}
            </dl>
          </section>
          <section id="citar" className="card scroll-mt-6 p-5" aria-labelledby="t-citar">
            <h2 id="t-citar" className="text-xl text-tinta">Cómo citar</h2>
            <p className="mt-3 rounded-lg bg-tinte p-3 font-mono text-xs text-texto2">[Institución]. [Año]. [Título]. [Versión]. [URL]. Consultado el [fecha].</p>
          </section>
          {rel.length > 0 && (
            <section className="card p-5" aria-labelledby="t-rel">
              <h2 id="t-rel" className="text-xl text-tinta">Relacionadas</h2>
              <ul className="mt-3 space-y-2">
                {rel.map((r) => (
                  <li key={r.id}>
                    <Link to="/base/$id" params={{ id: r.id }} className="flex min-h-11 flex-col justify-center rounded-lg px-2 hover:bg-tinte">
                      <span className="text-sm font-semibold text-tinta">{r.nombre}</span>
                      <span className="text-xs text-atenuado">{r.fuente}</span>
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          )}
        </aside>
      </div>
    </main>
  );
}

function Dato({ t, v }: { t: string; v: React.ReactNode }) {
  return (
    <div className="card p-4">
      <p className="font-mono text-xs uppercase text-atenuado">{t}</p>
      <p className="mt-1 text-lg text-tinta">{v}</p>
    </div>
  );
}
