# Proceso de desarrollo de Pulso Silvestre

Este documento registra cómo se llegó al proyecto actual, desde la idea hasta el sitio publicado, qué decidió la autora y qué se hizo con apoyo de asistentes de IA (Claude y Lovable). Sirve como evidencia del proceso, como bitácora de decisiones y como contexto para futuras actualizaciones. Para el detalle de cada cambio, consulta `CHANGELOG.md`; para las reglas de construcción, `docs/PROMPT_BASE.md`.

## Resumen en una línea por etapa

| # | Etapa | Resultado |
|---|---|---|
| 1 | Idea y viabilidad | Un sitio que muestre qué bases de datos abiertas de comportamiento animal «se mueven» cada semana |
| 2 | Alcance y fuentes | Solo datos abiertos; directorio, ranking semanal, fichas y filtros; abierto a cualquier grupo animal |
| 3 | Tecnología y rúbrica | Sitio estático publicable en GitHub Pages, Vercel o Netlify, con repositorio público |
| 4 | Maquetado | Tres pantallas (inicio, directorio, ficha), panal de grupos y carrusel tipo Spotify |
| 5 | Lógica de datos | Índice fijo, calculado una sola vez al cerrar la semana |
| 6 | Metaprompt | Documento maestro `docs/PROMPT_BASE.md` (Rol, Tarea, Contexto, Restricciones) |
| 7 | Construcción en Lovable | Primer código en React, con tokens limitados |
| 8 | Repositorio y publicación | Edición directa del repositorio y despliegue en Vercel |
| 9 | Auditoría | Imágenes, fichas reales, filtros dinámicos, citas, carga en servidor, accesibilidad |
| 10 | Datos reales | Cambio de «consultas» a «actividad semanal» y flujo automático semanal |
| 11 | Alcance, paleta e interactividad | Nuevo título y enfoque, paleta azul y crema, señales regionales interactivas |
| 12 | Murciélagos y abejas de Norteamérica | Tres bases estadounidenses abiertas y dos recortes de iNaturalist para el pulso |
| 13 | Índice relativo | Cada fuente se compara contra su propio nivel habitual (método v3) |

## 1. Idea y viabilidad
La primera consulta fue si era viable una página que permitiera ver las bases de datos más buscadas cada semana en ciertos sitios, con interés particular en comportamiento animal, y si había una forma más amable de plantearlo. Se concluyó que era viable como **directorio con señales semanales**, no como un buscador propio.

## 2. Alcance y fuentes
Decisiones de la autora:
- Quedarse únicamente con **fuentes de datos abiertos**.
- Funciones base: **directorio, ranking semanal, fichas y filtros**.
- Público: personas que dan seguimiento a la vida silvestre (estudiantes, investigadores, gestores de conservación, divulgadores).
- Proyecto académico con fines divulgativos; primera entrega para refinar después.
- Abierto a **cualquier grupo animal**; la primera demostración da más peso a aves y a México porque tienen más información disponible.

Fuentes candidatas revisadas: GBIF, NaturaLista, eBird, Movebank, GloBI, Xeno-canto, Wildlife Insights y LILA BC (además de repositorios generales como Zenodo, Dryad, Figshare y DataCite).

## 3. Tecnología y rúbrica
Se compararon lenguajes (Python frente a Java) y herramientas (Astro frente a Streamlit), y se aclararon conceptos como GitHub Actions, cron y SQLite. La rúbrica compartida pedía, entre otros puntos: (4) repositorio público con código fuente y README impecable (descripción, herramientas, prompts, URL pública) y (5) sitio publicado en GitHub Pages, Vercel o Netlify, que cargue rápido y con todas las funciones operativas.

Corrección importante: una primera recomendación de Streamlit chocaba con las opciones de publicación de la rúbrica; se corrigió hacia un **sitio estático**. Python se conservó para el script que genera los datos (`scripts/generar_ranking.py`) y GitHub Actions para ejecutarlo cada semana.

## 4. Maquetado
Se maquetó en un lienzo con tres pantallas: **Ranking semanal**, **Directorio y filtros** y **Ficha de base de datos**. Iteraciones pedidas por la autora, en orden:
1. Elegir la primera propuesta de maquetado, con la paleta `92003A, F62477, FFADEE, A1CB35, 769826`.
2. Añadir un **panal de 7 hexágonos** al centro (filas 2-3-2) y un **carrusel horizontal tipo Spotify** para el ranking.
3. Poner **el número de posición** en la esquina superior izquierda de cada tarjeta y **una foto representativa** en lugar de los panales.
4. Cambiar los rosas por la paleta `60241E, 95271D, B34A44, E77B49`.
5. Dar un acabado **más profesional y formal**, con degradados y juegos de luz.
6. Tipografía IBM Plex (Serif, Sans y Mono).

Las fotos no se pudieron descargar en esa etapa (la red del entorno de trabajo bloquea sitios no autorizados), así que la maqueta usó recuadros etiquetados.

## 5. Lógica de datos (revisión como desarrolladora backend senior)
La autora pidió abrir el alcance a más especies y preguntó si los índices no debían **fijarse** en lugar de recalcularse. Se acordó:
- **Consultas** (campo `consultas`) de la semana; **índice** = 100 × consultas ÷ consultas de la base líder, redondeado.
- **Variación** = % de cambio frente a la semana previa, solo si la previa fue de al menos 10; si no, nulo.
- Estados: `ok`, `nuevo`, `sin_dato`, `anomalia`.
- Semanas ISO (lunes a domingo), calculadas **una sola vez al cierre** y **sin modificarse después**; `metodoVersion` registra la versión del método.
- Nada de esto se calcula en el navegador: el sitio solo lee y muestra.
- La gráfica histórica usa los valores crudos, nunca el índice.

## 6. Metaprompt y documento maestro
Para construir con pocos tokens en Lovable, se diseñó un metaprompt con la estructura **1. Rol, 2. Tarea, 3. Contexto, 4. Restricciones**, lo más apegado posible a la maqueta. Después se pidió que fuera la base clara de construcción **y de futuras actualizaciones**; así nació `docs/PROMPT_BASE.md` (documento maestro v1.0), con rutas, contrato de datos (`public/data/*.json`), reglas de cálculo, filtros, tokens de diseño y reglas para cambios futuros.

## 7. Construcción en Lovable
Lovable generó el repositorio `ale153023/pulso-silvestre` a partir del documento maestro (React, TanStack Router/Start, Tailwind, shadcn/ui, zod). **Desviación detectada:** el documento pedía `HashRouter` y despliegue estático; Lovable produjo una aplicación con servidor (TanStack Start). Se mantuvo esa base y se resolvió el despliegue en Vercel.

## 8. Repositorio y publicación
La autora pidió acceso al repositorio para seguir modificándolo con Claude Code. Se acordó publicar «de la forma más simple posible». Como Lovable se quedó sin tokens para ajustes, se pasó el proyecto a **Vercel** conectado a GitHub: cada cambio a `main` se redespliega solo, y cada rama genera una **vista previa** que se revisa antes de fusionar. Publicación: <https://pulso-silvestre.vercel.app/>.

## 9. Auditoría y correcciones
Orden de trabajo pedido por la autora:
- **Imágenes** donde había recuadros vacíos: ilustraciones originales provisionales (no se pudieron descargar fotos con licencia); se retiraron las etiquetas «provisional».
- **Fichas con contenido real:** campos, usos y licencias tomados de la documentación oficial; se eliminó el texto de relleno «Consulta la fuente».
- **Filtros dinámicos:** opciones derivadas de los datos, con conteos por opción y opciones sin resultados deshabilitadas.
- **Cómo citar** generado por base.
- **Carga de datos en el servidor** y **título de pestaña por ficha**.
- **Accesibilidad:** valores de la gráfica semanal disponibles para lectores de pantalla.
- Se retiraron las leyendas «(ejemplo)» de las tarjetas de señales.

## 10. Datos reales: de «consultas» a «actividad semanal»
Pregunta de la autora: ¿se puede basar genuinamente en datos reales? Hallazgo: **casi ninguna de las bases publica cuántas veces se consulta o descarga cada semana**. Decisión (elegida entre alternativas): medir **actividad semanal** = registros nuevos que cada fuente publica en la semana, con su API abierta, y automatizarlo con **GitHub Actions** cada lunes.
- Con dato: GBIF México, NaturaLista y eBird (esta última requiere clave).
- Sin métrica pública abierta: Movebank, Wildlife Insights, GloBI y LILA BC («Sin dato esta semana»); Xeno-canto pendiente.
- La autora pidió **unificar las unidades**. Se evaluaron tres vías (índice relativo a la mediana de cada fuente, unidad común en GBIF, o mantener y documentar) y se eligió **mantener las unidades propias y documentar las limitaciones** (README, «Limitaciones conocidas», y `PROMPT_BASE.md`, sección 4.6). El índice relativo queda como mejora futura.

## 11. Nuevo alcance, paleta e interactividad
- Como la métrica ya no es de consultas, se **redefinió el alcance**: directorio de fuentes abiertas con un pulso semanal de actividad. Cambiaron título, navegación («Actividad semanal»), descripciones, README y documento base.
- Cambio de paleta a azul y crema: `010736, 0D1C42, 22396F, FCF1D0` (con verdes lima y oliva), con contraste verificado a nivel AA. Los nombres de token (`cafe`, `rojo`, `naranja`) se conservaron por compatibilidad.
- **Señales regionales interactivas** (fenología con control de periodo, distribución con celdas explorables, movimiento con puntos de la ruta), con datos en `public/data/senales.json`.

## 12. Murciélagos y abejas de Norteamérica
La autora propuso sumar bases elaboradas en Estados Unidos sobre murciélagos y abejas. Se revisó la documentación de cada una:
- **NABat** (USGS): entrega de grabaciones acústicas, CC0, con manifiesto CSV; se publica por versiones.
- **Bumble Bee Watch** (Xerces Society y socios): registros fotográficos de abejorros verificados, CC0 vía GBIF.
- **Native Bee Inventory and Monitoring Lab** (USGS): registros de abejas y otros insectos, accesibles desde GBIF; la licencia no se indica en su página.

Hallazgo: las tres se actualizan por entregas, no semana a semana, así que no sirven para un pulso semanal. Decisión (entre tres alternativas): agregarlas al directorio con fichas reales (región Norteamérica, métrica «Pendiente de conectar») y medir el pulso de los dos grupos con **recortes de iNaturalist** (murciélagos y abejas en Estados Unidos, Canadá y México). Los recortes no son bases nuevas; se declaran como tales y comparten los límites de NaturaLista (solape, esfuerzo de observación). Las nuevas bases entran al pulso desde la siguiente semana cerrada.

## 13. Índice relativo (método v3)
Con datos reales, la primera semana mostró el problema de las unidades: GBIF (≈3 millones) dejaba a las demás fuentes con índice 1 o 0. Entre dos salidas (cambiar la medida de GBIF o pasar a un índice relativo) la autora eligió el **índice relativo**: cada fuente se compara contra la mediana de sus 4 semanas previas (100 = su nivel habitual). Consecuencias documentadas: se necesitan 3 semanas de historial; las fuentes consultables a posteriori (NaturaLista, recortes de iNaturalist, eBird) reconstruyen sus semanas previas, mientras GBIF las acumula; el índice puede pasar de 100 y la barra de la tarjeta marca el nivel habitual en el centro; la semana W43 de prueba se regenera con el método nuevo.

## Cómo se trabajó con IA
- **Claude** (conversación y Claude Code): análisis de viabilidad, maqueta, metaprompt, auditoría de código, redacción de documentación, script de datos y cambios al repositorio.
- **Lovable**: generación inicial del código a partir del documento maestro.
- **Vercel**: publicación y vistas previas.
- La **autora** definió el alcance, el público, las fuentes, las paletas, los criterios de la rúbrica y aprobó cada fusión a `main`.

## Qué se verificó y qué no
Verificado:
- Las reglas de cálculo del ranking tienen pruebas automáticas (`scripts/test_generar_ranking.py`).
- La lógica de filtros se probó con un script local; la construcción y las pantallas se revisaron en las vistas previas de Vercel y en el sitio publicado.
- Contraste de la paleta nueva (AA).

Sin verificar al momento de escribir esto:
- Las consultas a las APIs reales (GBIF, NaturaLista, eBird) no se pudieron ejecutar en el entorno de desarrollo; se validarán en la primera ejecución del flujo semanal.
- No se pudo instalar ni compilar el proyecto en el entorno de desarrollo (el registro de paquetes estaba bloqueado); la compilación se comprobó en Vercel.
- Hasta esa primera ejecución, las cifras del ranking, el historial y las señales son **ilustrativas**.

## Prompts clave de la autora (resumen fiel)
1. Viabilidad: «¿crees que pueda ser viable? ¿tienes alguna sugerencia más amable?»
2. Alcance: solo datos abiertos; directorio, ranking semanal, fichas y filtros; todo el comportamiento animal si es posible.
3. Maquetado: empezar por maquetar; paleta; panal central deslizante tipo Spotify; número de posición y foto por tarjeta; diseño más profesional.
4. Metaprompt: estructura Rol/Tarea/Contexto/Restricciones, claro, conciso, apegado a la maqueta, optimizado para pocos tokens.
5. Lógica: abrir a más especies y **fijar los índices**; pasada como desarrolladora backend senior.
6. Documento maestro como base de construcción y de futuras actualizaciones.
7. Auditoría: «intentemos la publicación de la forma más simple posible, pero auditemos el código, empezando por fijar imágenes donde no las hay».
8. Filtros dinámicos; contenido real en las fichas; carga en servidor y título por ficha.
9. Datos reales, unificación de unidades, limitaciones explícitas, cambio de alcance y títulos, paleta azul y crema, señales interactivas.
10. Documentar el proceso desde el primer maquetado (este archivo).
