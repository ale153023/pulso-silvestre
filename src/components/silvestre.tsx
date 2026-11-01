import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import type { ReactNode } from "react";
import type { Base, Grupo, Item } from "@/lib/data";
import { etiquetaGrupos } from "@/lib/filtros";

export function useIrASeccion() {
  const navigate = useNavigate();
  const path = useRouterState({ select: (s) => s.location.pathname });
  return (id: string) => {
    const scroll = () => {
      const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      document.getElementById(id)?.scrollIntoView({ behavior: reduce ? "auto" : "smooth", block: "start" });
    };
    if (id === "citar" || path === "/") return scroll();
    navigate({ to: "/" }).then(() => {
      let n = 0;
      const t = setInterval(() => {
        if (document.getElementById(id) || ++n > 40) {
          clearInterval(t);
          scroll();
        }
      }, 50);
    });
  };
}

function Logo() {
  return (
    <svg width="34" height="38" viewBox="0 0 34 38" aria-hidden="true">
      <polygon points="17,1 33,10 33,28 17,37 1,28 1,10" fill="var(--naranja)" />
      <polyline points="6,20 12,20 15,13 19,26 22,18 28,18" fill="none" stroke="var(--cafe)" strokeWidth="2.6" strokeLinejoin="round" strokeLinecap="round" />
    </svg>
  );
}

const navCls = "inline-flex min-h-11 items-center rounded-lg px-3 text-sm font-medium transition-colors";

export function Encabezado() {
  const path = useRouterState({ select: (s) => s.location.pathname });
  const ir = useIrASeccion();
  const activo = (a: boolean) => `${navCls} ${a ? "bg-durazno text-cafe" : "text-blanco hover:bg-blanco/10"}`;
  return (
    <header className="bg-grad-header">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-2 px-4 py-3">
        <Link to="/" className="flex min-h-11 items-center gap-2 rounded-lg text-blanco">
          <Logo />
          <span className="text-lg font-semibold">Pulso Silvestre</span>
        </Link>
        <nav aria-label="Principal" className="flex flex-wrap gap-1">
          <Link to="/" className={activo(path === "/")}>Ranking semanal</Link>
          <Link to="/directorio" className={activo(path.startsWith("/directorio") || path.startsWith("/base"))}>Directorio</Link>
          <button type="button" onClick={() => ir("metodo")} className={activo(false)}>Metodología</button>
        </nav>
      </div>
    </header>
  );
}

export function Pie() {
  return (
    <footer className="bg-grad-footer mt-16">
      <p className="mx-auto max-w-6xl px-4 py-6 text-sm text-durazno">
        Proyecto académico con fines divulgativos. Solo fuentes de datos abiertos; cita siempre la fuente original.
      </p>
    </footer>
  );
}

export function Foto({ base, cuadrado = true }: { base: Base; cuadrado?: boolean }) {
  if (base.foto)
    return (
      <figure>
        <img src={base.foto} alt={base.fotoSugerida} loading="lazy" className={`w-full rounded-lg object-cover ${cuadrado ? "aspect-square" : "aspect-video"}`} />
        {base.credito && <figcaption className="mt-1 font-mono text-xs text-atenuado">{base.credito}</figcaption>}
      </figure>
    );
  return (
    <div className={`bg-grad-foto flex w-full flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed border-campo p-3 text-center ${cuadrado ? "aspect-square" : "aspect-video"}`}>
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="var(--campo)" strokeWidth="1.8" aria-hidden="true">
        <rect x="3" y="4" width="18" height="16" rx="2" /><circle cx="9" cy="10" r="2" /><path d="m21 17-5-5-9 8" />
      </svg>
      <span className="text-xs text-texto2">Foto: {base.fotoSugerida}</span>
    </div>
  );
}

export function Variacion({ item }: { item?: Item }) {
  if (!item || item.estado === "sin_dato") return <span className="font-mono text-sm text-atenuado">Sin dato</span>;
  if (item.estado === "nuevo") return <span className="font-mono text-sm text-cafe">Nuevo</span>;
  const v = item.variacionPct;
  if (item.estado === "anomalia" || v === null) return <span className="font-mono text-sm text-atenuado" aria-label="Sin variación disponible">—</span>;
  if (v === 0) return <span className="font-mono text-sm text-texto2">= 0 %</span>;
  return v > 0 ? (
    <span className="font-mono text-sm text-oliva-oscuro"><span aria-hidden="true">▲</span> +{v} %</span>
  ) : (
    <span className="font-mono text-sm text-ladrillo"><span aria-hidden="true">▼</span> {v} %</span>
  );
}

export function Chip({ children, tono = "durazno" }: { children: ReactNode; tono?: "durazno" | "lima" | "tinte" }) {
  const c = { durazno: "bg-durazno", lima: "bg-lima-claro", tinte: "bg-tinte" }[tono];
  return <span className={`${c} inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium text-tinta`}>{children}</span>;
}

export function Estado({ cargando, error }: { cargando: boolean; error: unknown }) {
  if (cargando)
    return (
      <div role="status" className="mx-auto max-w-6xl px-4 py-20 text-center text-atenuado">Cargando datos…</div>
    );
  return (
    <div role="alert" className="card mx-auto my-16 max-w-lg p-6 text-center">
      <h2 className="text-xl text-tinta">No se pudieron cargar los datos</h2>
      <p className="mt-2 text-sm text-texto2">{error instanceof Error ? error.message : "Error desconocido"}</p>
      <button type="button" onClick={() => location.reload()} className="btn-primario mt-4">Reintentar</button>
    </div>
  );
}

export const btnPrimario =
  "bg-grad-cafe shadow-btn inline-flex min-h-11 items-center justify-center rounded-lg px-4 text-sm font-semibold text-blanco";
export const btnContorno =
  "inline-flex min-h-11 items-center justify-center rounded-lg border-2 border-cafe bg-card px-4 text-sm font-semibold text-cafe hover:bg-tinte";
export const campo =
  "min-h-11 w-full rounded-lg border border-campo bg-card px-3 text-sm text-tinta";

export function TarjetaBase({ base, grupos }: { base: Base; grupos: Grupo[] }) {
  return (
    <Link to="/base/$id" params={{ id: base.id }} className="card flex flex-col gap-2 p-4 transition-transform hover:-translate-y-0.5">
      <div className="flex flex-wrap gap-1.5">
        <Chip>{base.tipo}</Chip>
        <Chip tono="lima">{etiquetaGrupos(base.grupos, grupos)}</Chip>
      </div>
      <h3 className="font-semibold text-tinta">{base.nombre}</h3>
      <p className="text-sm text-atenuado">{base.fuente}</p>
      <p className="text-sm text-texto2">{base.descripcion}</p>
      <dl className="mt-auto grid gap-0.5 pt-2 font-mono text-xs text-texto2">
        <div><dt className="inline">Acceso: </dt><dd className="inline">{base.accesoTexto}</dd></div>
        <div><dt className="inline">Licencia: </dt><dd className="inline">{base.licencia}</dd></div>
      </dl>
    </Link>
  );
}
