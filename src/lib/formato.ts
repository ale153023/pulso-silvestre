const num = new Intl.NumberFormat("es-MX");
export const fmtNum = (n: number) => num.format(n);

const fecha = (iso: string) => new Date(`${iso}T12:00:00`);
export const fmtFecha = (iso: string) =>
  new Intl.DateTimeFormat("es-MX", { day: "numeric", month: "long", year: "numeric" }).format(fecha(iso));
export const fmtCorta = (iso: string) =>
  new Intl.DateTimeFormat("es-MX", { day: "numeric", month: "short" }).format(fecha(iso)).replace(".", "");

export const ACCESO: Record<string, string> = { api: "API abierta", descarga: "Descarga directa" };
export const METRICA: Record<string, string> = {
  "vistas+descargas": "Vistas + descargas",
  descargas: "Descargas",
  registros_nuevos: "Registros nuevos por semana",
  pendiente: "Pendiente de conectar",
  sin_metrica_publica: "Sin métrica pública",
};
export const COBERTURA: Record<string, string> = { mexico: "México", norteamerica: "Norteamérica", mundial: "Mundial" };
