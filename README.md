# Clínica Podogal · Ourense · «La O»

Web nueva para Clínica Podogal (Rúa Serra de Queixa 6, bajo, 32005 Ourense): podología desde 2003 y centro sanitario con fisioterapia, readaptación y psicología. Hoy tienen un WordPress de 2017 en podogal.com. Propuesta en local, con `noindex` en todas las páginas.

- **Datos y fuentes:** `../clinica-podogal-ourense-bocetos/DATOS-PODOGAL.md` (su web, la API de medios del WordPress, Instagram hasta el 14-9-2026 y la ficha de Google). Tablero de direcciones: https://claude.ai/artifact/ANAaEvFTDYUgFEvSoVYv2m
- **Decisión (2026-10-20, la recomendación tal cual):** cortina y portada de A «La O» → especialidades por puertas (B) → biomecánica con «Pisa aquí» (C) y el taller → cirugía con «Planificar un juanete» (D) y la trayectoria de Navor → equipo, lo que dicen, mutuas → pedir cita, horario y cómo llegar. Solo castellano. Fotos de su web (2017-2021) e Instagram, **ninguna generada con IA ni de la etapa dental**.

## Concepto

Su logo es una **O**: aro grueso a la izquierda y fino a la derecha, con un punto en medio. En la recepción, esa O es la Tierra vista desde el espacio. La web mira a través de ella:

1. **Cortina:** grafito. Se enciende el punto naranja, el aro se dibuja girando, POD y GAL salen de detrás de la O, CLÍNICA abre su espaciado y el hueco de la O se abre en **iris** hasta descubrir la portada.
2. **Portada:** «Tus pies, en las mejores manos» (su lema). La recepción (con la Tierra) se ve **dentro de la O**; alrededor giran las seis especialidades. **El lado grueso del aro y el punto siguen al cursor**, como un ojo. Dato en vivo: «Abierto ahora · hasta las…» con su horario de septiembre.
3. **Especialidades:** el **pasillo de puertas** 01–06, como las franjas verticales de las consultas de la clínica; del amarillo de la fachada al naranja de la marca. Las seis con el mismo peso. Cada botón «Pedir cita de…» llega al motor con la consulta elegida.
4. **Biomecánica:** módulo **«Pisa aquí»** (`js/pisada.js`, otro agente) y el taller propio de plantillas.
5. **Cirugía (fondo grafito):** módulo **«Planificar un juanete»** (`js/juanete.js`, otro agente), con la trayectoria de Navor dentro.
6. **Equipo:** Sonia, Navor y María con su formación literal de la web; el resto, «por confirmar».
7. **Lo que dicen:** 4,8 con 147 reseñas (enlace a Google), premio de la Sociedad Gallega de Heridas (sept. 2026), «Gym pés» con ALCER (ene. 2026), TVG (jun. 2025), Auria, AFAOR y San Martiño. Mutuas.
8. **Pedir cita (DEMOSTRACIÓN, `js/cita.js`):** consulta → día → hora → datos → código `PG-XXXX`. Huecos de ejemplo sobre su horario real (`js/horario.js`); fines de semana y festivos (11 de noviembre, San Martiño) cerrados. Duraciones y quién atiende: **supuestos**.
9. **Horario y cómo llegar**, mapa de Google solo al pedirlo. **Pie:** la O llega girando y completa PODOGAL. Registro sanitario C-32-000323.

### Módulos

`Podogal.pisada.montar(el, { movimiento })` y `Podogal.juanete.montar(el, …)` sustituyen el contenido de `[data-modulo]` y ponen `data-montado="1"`. Si sus JS fallan, se queda el **respaldo** estático (foto y texto) que va dentro del HTML. `main.js` los monta al arrancar; se cargan con `defer` antes de él.

### Paleta y letras

| Token | Color | Uso |
|---|---|---|
| `--naranja` | `#FF8F01` | el de su logo, medido en el PNG; adorno, botones, texto grande y texto sobre grafito |
| `--naranja-texto` | `#9A5200` | texto pequeño en naranja sobre cal (5,3:1) |
| `--cal` / `--cal-2` | `#F6F3EE` / `#EDE8DF` | fondos |
| `--grafito` | `#1E1F22` | texto, cirugía, cita y pie |
| `--amarillo` | `#F2B33D` | las lamas de la fachada y la primera puerta |
| `--tinta-2` / `--niebla` | `#5F6267` / `#B9B7B2` | texto secundario sobre cal / sobre grafito |

**Letras:** `Cinzel` (romana como su rótulo; titulares), `Geist` (texto) y `Geist Mono` (rótulos y números).

## Cómo se trabaja

- **Edita siempre los `*.src.html`.** `node construir.mjs` genera los `.html` (`<img data-foto>` → `<picture>` AVIF/WebP/JPG) y pone `?v=<huella>` a CSS y JS.
- **Legales y 404:** `node scripts/legales.mjs` y después `node construir.mjs`. El titular y el NIF van como PENDIENTE visible.
- **Fotos:** `scripts/fotos-lista.json` + `node scripts/fotos.mjs` (lee de `../clinica-podogal-ourense-bocetos/ref`; nunca amplía). **Marca:** `node scripts/marca.mjs` (favicons, icono y `img/og.jpg` a partir de la O medida).
- **`node verificar.mjs`** (puerto 8794), una vez al terminar: archivos, noindex, ids, textos prohibidos, contraste, módulos (y su respaldo con los JS caídos), pasillo (cada puerta, teclado, móvil), cita completa, mapa, cookies en 4 pasos, mando, móvil a 360/375/390/768, menú con la cabecera fija, barra del navegador (0 `refresh`), legales y, al final, la cortina con movimiento y el ojo que sigue al cursor.
- **`node scripts/rendimiento.mjs`** (puerto 8793): LCP en un móvil de gama media.

## Mando de densidades (solo con `?revision`)

- **«La O»:** órbita de especialidades alrededor de la O, anillos de fondo, el ojo que sigue al cursor, fotos que se abren en iris y la O en los retratos.
- **«Sobria»:** sin órbita ni anillos, la O quieta, fotos rectas. **Añade** la tabla «Las seis consultas, de un vistazo».

### Receta de borrado del mando

1. En `index.src.html`: el bloque `<!-- MANDO DE MAQUETA` … `<!-- fin del MANDO DE MAQUETA -->` y, en el script del `<head>`, el `try { … }` de `// MANDO DE MAQUETA`.
2. En `js/main.js`: el bloque `13. MANDO DE MAQUETA` hasta `fin del MANDO DE MAQUETA`.
3. Opcional: `.mando` y `.vistazo` en `css/estilos.css` y la tabla `#vistazo` del HTML.
4. `node construir.mjs`.

## Para publicar

`noindex` en todas las páginas mientras no venda. `?v=<huella>` ya lo pone `construir.mjs`; avisar de Ctrl+F5. Fuera del repo: `pruebas/` y `PENDIENTES.md`.
