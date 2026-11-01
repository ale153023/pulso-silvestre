# Pulso Silvestre

Ranking semanal de bases de datos abiertas de comportamiento y seguimiento de fauna silvestre. Proyecto académico con fines divulgativos.

## Herramientas
React 19, TypeScript, TanStack Router/Start, Tailwind CSS v4, zod. Construido con Lovable.

## Prompts utilizados
Ver [docs/PROMPT_BASE.md](docs/PROMPT_BASE.md).

## URL pública
<https://pulso-silvestre.vercel.app/>

## Cómo actualizar los datos
Todo el contenido vive en `public/data/`:
- `grupos.json`: grupos animales (los 6 primeros por `orden` forman el panal).
- `bases.json`: fichas de cada base.
- `ranking/index.json`: semana más reciente (`ultima`) y lista de semanas.
- `ranking/AAAA-Www.json`: ranking de una semana cerrada. Índice, posición y variación se calculan al generar el archivo, nunca en el navegador. Una semana cerrada no se modifica.
- `historial.json`: consultas de las últimas 8 semanas por base.
Para publicar una semana nueva: crea su archivo en `ranking/`, actualiza `index.json` y añade la semana al historial. Registra el cambio en `CHANGELOG.md`.

## Fuentes y licencias (datos ilustrativos)
| Fuente | Licencia |
|---|---|
| eBird · Cornell Lab of Ornithology | Términos de eBird |
| Movebank | Según el estudio |
| GBIF · nodo México | Según el conjunto |
| Xeno-canto | Creative Commons, según la grabación |
| Wildlife Insights | Según el proyecto |
| GloBI | Según el origen del dato |
| LILA BC | Según el conjunto |
| NaturaLista · CONABIO | Según el observador |
