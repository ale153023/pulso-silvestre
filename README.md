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

## Fuentes y licencias
Los campos, usos y licencias de cada ficha (`public/data/bases.json`) se tomaron de la documentación oficial de cada fuente. Las cifras del ranking y del historial son **ilustrativas** hasta conectar las APIs reales.

| Fuente | Licencia | Documentación consultada |
|---|---|---|
| eBird · Cornell Lab of Ornithology | Términos de eBird | <https://ebird.org/science> |
| Movebank | Creative Commons o términos propios, según el estudio | <https://www.movebank.org/cms/movebank-content/mb-data-model> |
| GBIF · nodo México | CC0, CC BY o CC BY-NC, según el registro | <https://techdocs.gbif.org/en/data-use/download-formats> |
| Xeno-canto | Creative Commons, según la grabación | <https://xeno-canto.org> |
| Wildlife Insights | CC BY o CC BY-NC, según el proyecto | <https://www.wildlifeinsights.org/node/3079> |
| GloBI | Según el origen del dato | <https://www.globalbioticinteractions.org> |
| LILA BC | Mayormente CDLA permisiva; algunos conjuntos con términos propios | <https://source.coop/agentmorris/lila-wildlife> |
| NaturaLista · CONABIO | Según el observador | <https://www.naturalista.mx> |

## Imágenes
Las 8 imágenes de `public/img/` son ilustraciones originales del proyecto. Para sustituirlas por fotografías, cambia `foto` y `credito` en `bases.json` (usa solo imágenes con licencia abierta y cita al autor).
