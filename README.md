# Pulso Silvestre

Ranking semanal de bases de datos abiertas de comportamiento y seguimiento de fauna silvestre. Proyecto académico con fines divulgativos.

## Herramientas
React 19, TypeScript, TanStack Router/Start, Tailwind CSS v4, zod. Construido con Lovable.

## Prompts utilizados
Ver [docs/PROMPT_BASE.md](docs/PROMPT_BASE.md).

## URL pública
<https://pulso-silvestre.vercel.app/>

## Cómo se obtienen los datos
La métrica es la **actividad semanal**: registros nuevos que cada fuente publica en la semana ISO cerrada (lunes a domingo). Ninguna de estas bases publica cuántas veces se consulta o descarga cada semana, por eso se mide lo que sí es abierto y verificable.

| Base | Qué se cuenta | Requiere |
|---|---|---|
| GBIF · nodo México | Ocurrencias de animales en México interpretadas por GBIF en la semana | Nada |
| NaturaLista · CONABIO | Observaciones de fauna creadas en México durante la semana | Nada |
| eBird | Listas de verificación enviadas en México (suma de 7 días) | Clave `EBIRD_API_KEY` |
| Xeno-canto | Pendiente de conectar (su API pide clave y falta validar el filtro por fecha) | — |
| Movebank, Wildlife Insights, GloBI, LILA BC | Sin métrica pública abierta: aparecen como «Sin dato esta semana» | — |

Las unidades difieren entre fuentes (listas, observaciones, ocurrencias); el índice compara actividad dentro de la misma semana y no equivale a «más importante». Una fuente que no responde queda como «Sin dato» y no detiene a las demás. `anomalia` marca cambios de más de 5 veces frente a la semana previa (por ejemplo, un reprocesamiento masivo).

### Actualización automática
`.github/workflows/ranking-semanal.yml` corre cada lunes (también se puede lanzar a mano desde **Actions → Ranking semanal → Run workflow**). Ejecuta `scripts/generar_ranking.py`, publica los JSON en `public/data/` y Vercel vuelve a desplegar solo. Primero corre las pruebas de las reglas de cálculo (`scripts/test_generar_ranking.py`).

Para activar eBird: crea una clave en <https://ebird.org/api/keygen> y guárdala en GitHub como secreto `EBIRD_API_KEY` (Settings → Secrets and variables → Actions). Sin ella, eBird queda como «Sin dato».

Para generarlo localmente: `python scripts/generar_ranking.py` (o `--semana 2026-W44`). Una semana real ya cerrada no se modifica; las semanas ilustrativas sí se reemplazan.

## Cómo actualizar los datos
Todo el contenido vive en `public/data/`:
- `grupos.json`: grupos animales (los 6 primeros por `orden` forman el panal).
- `bases.json`: fichas de cada base.
- `ranking/index.json`: semana más reciente (`ultima`) y lista de semanas.
- `ranking/AAAA-Www.json`: ranking de una semana cerrada. Índice, posición y variación se calculan al generar el archivo (con el script), nunca en el navegador. El campo `consultas` conserva su nombre por compatibilidad y contiene la actividad semanal.
- `historial.json`: actividad por semana (hasta 8) por base; se acumula desde la primera ejecución real.
Registra cada cambio manual en `CHANGELOG.md`.

## Fuentes y licencias
Los campos, usos y licencias de cada ficha (`public/data/bases.json`) se tomaron de la documentación oficial de cada fuente. Hasta la primera ejecución del flujo semanal, las cifras del ranking y del historial son **ilustrativas**.

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
