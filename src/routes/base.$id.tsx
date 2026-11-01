import { createFileRoute, Link } from "@tanstack/react-router";
import { Chip, Estado, Foto, Variacion, btnContorno, btnPrimario, useIrASeccion } from "@/components/silvestre";
import { cargarDatos, itemDe, type Datos } from "@/lib/data";
import { etiquetaGrupos, relacionadas } from "@/lib/filtros";
import { ACCESO, COBERTURA, METRICA, fmtCompacto, fmtCorta, fmtFecha, fmtNum, restarSemanas } from "@/lib/formato";

export const Route = createFileRoute("/base/$id")({
  head: ({ loaderData, params }) => {
    const b = loaderData?.bases.find((x) => x.id === params.id);
    const titulo = b ? `${b.nombre} · Pulso Silvestre` : "Ficha de base de datos · Pulso Silvestre";
    const desc = b?.descripcion ?? "Actividad semanal, contenido, licencia y forma de citar una base de datos abierta de fauna.";
    return {
      meta: [
        { title: titulo },
        { name: "description", content: desc },
        { property: "og:title", content: titulo },
        { property: "og:description", content: desc },
      ],
    };
  },
  loader: () => cargarDatos(),
  pendingComponent: () => <Estado cargando error={null} />,
  errorComponent: ({ error }) => <Estado cargando={false} error={error} />,
  component: Ficha,
});

function Ficha() {
  return <Contenido d={Route.useLoaderData()} />;
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
  const visibles = serie.slice(-8);
  const max = Math.max(1, ...visibles.map((s) => s.consultas));
  const ranuras: (typeof serie[number] | undefined)[] = [...Array<undefined>(8 - visibles.length).fill(undefined), ...visibles];
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
            <Dato t="Índice de la semana" v={<span className="font-mono">{sinDato ? "Sin dato esta semana" : (it?.indice ?? "Sin referencia aún")}</span>} />
            <Dato t="Variación semanal" v={sinDato ? <span className="font-mono text-atenuado">Sin dato esta semana</span> : <Variacion item={it} />} />
            <p className="text-xs text-atenuado sm:col-span-3">Índice 100 = nivel habitual de esta fuente (mediana de sus 4 semanas previas). Se calcula desde la tercera semana de historial.</p>
          </div>

          <section className="card p-5" aria-labelledby="t-consultas">
            <h2 id="t-consultas" className="text-xl text-tinta">Actividad por semana</h2>
            {serie.length === 0 ? (
              <p className="mt-3 text-sm text-atenuado">Sin historial disponible.</p>
            ) : (
              <>
              <ul className="sr-only">
                {serie.map((s) => <li key={s.semana}>Semana del {fmtCorta(s.inicio)}: {fmtNum(s.consultas)} registros nuevos</li>)}
              </ul>
              <div className="mt-6 grid grid-cols-[2.75rem_1fr] gap-x-2" aria-hidden="true">
                <div className="relative h-44 text-right font-mono text-[10px] text-atenuado">
                  <span className="absolute right-0 top-0 -translate-y-1/2">{fmtCompacto(max)}</span>
                  <span className="absolute right-0 top-1/2 -translate-y-1/2">{fmtCompacto(max / 2)}</span>
                  <span className="absolute bottom-0 right-0 translate-y-1/2">0</span>
                </div>
                <div className="relative h-44">
                  <div className="absolute inset-x-0 top-0 border-t border-dashed border-border" />
                  <div className="absolute inset-x-0 top-1/2 border-t border-dashed border-border" />
                  <div className="absolute inset-x-0 bottom-0 border-t border-campo/40" />
                  <div className="relative z-10 flex h-full items-end gap-2">
                    {ranuras.map((s, i) => (
                      <div key={i} className="flex h-full flex-1 items-end justify-center">
                        {s ? (
                          <div
                            title={`${fmtNum(s.consultas)} registros nuevos`}
                            className={`relative w-full max-w-12 rounded-t-md ${i === ranuras.length - 1 ? "bg-grad-cafe" : "bg-grad-rojo opacity-60"}`}
                            style={{ height: `${Math.max(2, (s.consultas / max) * 100)}%` }}
                          >
                            <span className="absolute -top-5 left-1/2 -translate-x-1/2 whitespace-nowrap font-mono text-[10px] text-texto2">{fmtCompacto(s.consultas)}</span>
                          </div>
                        ) : (
                          <div className="w-full max-w-12 border-t-2 border-dashed border-border" />
                        )}
                      </div>
                    ))}
                  </div>
                </div>
                <div />
                <div className="mt-2 flex gap-2">
                  {ranuras.map((s, i) => (
                    <span key={i} className={`flex-1 text-center font-mono text-[10px] ${s ? "text-atenuado" : "text-border"}`}>
                      {fmtCorta(s ? s.inicio : restarSemanas(visibles[0]!.inicio, ranuras.length - visibles.length - i))}
                    </span>
                  ))}
                </div>
              </div>
              <p className="mt-3 text-xs text-atenuado">
                {serie.length < 2
                  ? "Primera semana con dato real. La tendencia aparecerá desde la segunda semana; las líneas punteadas son semanas aún sin registro."
                  : "Registros nuevos por semana ISO; la barra oscura es la semana más reciente."}
              </p>
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
            <p className="mt-3 rounded-lg bg-tinte p-3 font-mono text-xs text-texto2">{b.fuente}. {b.actualizadoEn.slice(0, 4)}. {b.nombre}. {b.url}. Consultado el [fecha de consulta].</p>
            <p className="mt-2 text-xs text-atenuado">Sustituye [fecha de consulta] por el día en que revisaste la fuente y confirma en ella la versión y la licencia ({b.licencia}).</p>
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
