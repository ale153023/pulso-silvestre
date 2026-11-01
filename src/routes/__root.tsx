import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  Link,
  createRootRouteWithContext,
  useRouter,
  HeadContent,
  Scripts,
  type ErrorComponentProps,
} from "@tanstack/react-router";
import { useEffect, type ReactNode } from "react";

import appCss from "../styles.css?url";
import { reportLovableError } from "../lib/lovable-error-reporting";
import { Encabezado, Pie, btnPrimario } from "@/components/silvestre";

function NotFoundComponent() {
  return (
    <main className="mx-auto max-w-md px-4 py-24 text-center">
      <h1 className="text-tinta">Página no encontrada</h1>
      <p className="mt-3 text-texto2">La dirección que buscas no existe o cambió.</p>
      <Link to="/" className={`${btnPrimario} mt-6`}>Volver al inicio</Link>
    </main>
  );
}

function ErrorComponent({ error, reset }: ErrorComponentProps) {
  console.error(error);
  const router = useRouter();
  useEffect(() => {
    reportLovableError(error, { boundary: "tanstack_root_error_component" });
  }, [error]);
  return (
    <main className="mx-auto max-w-md px-4 py-24 text-center">
      <h1 className="text-tinta">La página no cargó</h1>
      <p className="mt-3 text-texto2">Ocurrió un error. Intenta de nuevo o vuelve al inicio.</p>
      <div className="mt-6 flex justify-center gap-2">
        <button type="button" className={btnPrimario} onClick={() => { router.invalidate(); reset(); }}>Reintentar</button>
        <a href="/" className="inline-flex min-h-11 items-center rounded-lg border-2 border-cafe px-4 text-sm font-semibold text-cafe">Inicio</a>
      </div>
    </main>
  );
}

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "Pulso Silvestre" },
      { name: "description", content: "Directorio de bases de datos abiertas de fauna silvestre y su actividad semanal (registros nuevos)." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
      {
        rel: "stylesheet",
        href: "https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;500&family=IBM+Plex+Sans:wght@400;500;600&family=IBM+Plex+Serif:wght@600&display=swap",
      },
      { rel: "stylesheet", href: appCss },
      { rel: "icon", href: "/favicon.ico", type: "image/x-icon" },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

function RootShell({ children }: { children: ReactNode }) {
  return (
    <html lang="es">
      <head>
        <HeadContent />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function RootComponent() {
  const { queryClient } = Route.useRouteContext();
  return (
    <QueryClientProvider client={queryClient}>
      <div className="flex min-h-screen flex-col">
        <Encabezado />
        <div className="flex-1">
          <Outlet />
        </div>
        <Pie />
      </div>
    </QueryClientProvider>
  );
}
