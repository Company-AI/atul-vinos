# Design System — Bodega Premium

Objetivo: que el sitio se sienta **bodega**, no template de e-commerce. Fotografía y
producto primero; la interfaz desaparece. Todos los tokens viven en
`src/app/globals.css` (`@theme` de Tailwind v4) y se consumen como utilidades
(`bg-carbon-900`, `font-display`, `text-display-lg`, `rounded-md`…).

## 1. Color

Nada de "bordó porque es vino". La base es **neutra cálida**; el vino es un acento
que aparece poco y por eso funciona.

| Rol | Token | Hex | Uso |
|---|---|---|---|
| Fondo oscuro / cinematográfico | `carbon-950/900` | `#0D0B0A` / `#14110F` | hero, secciones full-screen, footer, admin sidebar |
| Superficie oscura elevada | `carbon-800/700` | `#1E1A17` / `#2A2521` | cards sobre fondo oscuro, header sólido |
| Fondo claro por defecto | `bone` | `#F7F3EC` | body del sitio y del admin |
| Superficie clara elevada | `bone-pure` | `#FDFBF7` | cards, modales, inputs |
| Bordes y separadores | `linen-200/300` | `#E8DFD1` / `#D8CDBA` | 1px hairlines, nunca sombras duras |
| Texto secundario | `stone-500/600` | `#8A8378` / `#6E675D` | metadatos, labels |
| Tierra / madera | `clay-500`, `oak-600` | `#A9825C`, `#6B5334` | CTA secundario, focus ring, iconografía |
| Acento vino | `wine-700/600/500` | `#5E1A26` … | CTA primario, precio en oferta, selección |
| Detalle premium | `gold-500/400` | `#C0A265` | premios, badges del Club, filetes finos |
| Semánticos | `success/warning/danger/info` | — | exclusivos del admin y de feedback |

Contraste: texto sobre `carbon-900` usa `bone`/`linen-100` (≥ 12:1). Texto sobre `bone`
usa `carbon-900` (≥ 14:1). `stone-500` solo en tamaños ≥ 14px sobre fondo claro.
`gold-500` nunca como texto pequeño sobre claro.

## 2. Tipografía

- **Display — Cormorant Garamond, weight 300.** Serif de alto contraste para títulos,
  nombres de vino y citas. Siempre en tamaño grande; nunca en labels.
- **UI / cuerpo — Inter.** 400/500. Legible, silenciosa, buena en tablas de admin.
- **Eyebrow** (`eyebrow`): Inter 500, 11px, `letter-spacing: .22em`, mayúsculas.
  Marca la jerarquía de sección sin competir con el título.

| Token | Tamaño | Uso |
|---|---|---|
| `text-display-xl` | clamp 44→104px | título del hero |
| `text-display-lg` | clamp 36→68px | títulos de sección full-screen |
| `text-display-md` | clamp 28→44px | títulos de bloque, nombre de vino en detalle |
| `text-display-sm` | clamp 22→30px | subtítulos, nombre en cards |
| `text-base/sm/xs` | 16/14/12px | cuerpo, metadatos, labels |

Cuerpo de texto editorial: máximo `max-w-[62ch]`. Títulos con `text-wrap: balance`.

## 3. Espaciado y layout

- Escala base 4px. Secciones públicas: `py-section` (72→144px). Densas: `py-section-sm`.
- Gutter lateral: `px-gutter` (20→48px).
- Contenedores: `Container` = `max-w-[1440px]`; `Container size="narrow"` = `max-w-[880px]`
  para lectura; `size="wide"` = full-bleed con gutter.
- Grid pública: 12 columnas en desktop, 6 en tablet, 1–2 en mobile.
- Admin: contenedor fluido, `py-6`, densidad de tabla 40px por fila.

**El aire es parte del diseño.** En público, ninguna sección respira menos de 72px.
En admin, la prioridad es densidad de información: 12–16px.

## 4. Radios, bordes y sombras

Radios contenidos: `xs 2px` (inputs de admin), `sm 3px`, `md 5px` (botones, cards),
`lg 8px` (modales, drawers), `pill` solo para chips de filtro y badges.

Separación por **hairline de 1px** en `linen-200`, no por sombra. Las sombras
(`shadow-card`, `shadow-raised`, `shadow-overlay`) son cálidas, difusas y se reservan
para elementos que realmente flotan: drawer del carrito, modales, dropdowns.

## 5. Botones

| Variante | Aspecto | Uso |
|---|---|---|
| `primary` | fondo `wine-700`, texto `bone-pure` | una sola acción principal por vista |
| `dark` | fondo `carbon-900`, texto `bone` | CTA sobre fondos claros del sitio |
| `outline` | borde 1px `carbon-900`, fondo transparente | CTA secundario |
| `ghost-light` | texto `bone`, borde `bone/40` | sobre video/foto oscura |
| `subtle` | fondo `linen-200` | acciones terciarias, admin |
| `danger` | `danger-500` | acciones destructivas del admin |

Tamaños: `sm` 36px, `md` 44px, `lg` 52px (mobile: mínimo 44px de alto por táctil).
Estados: hover con cambio de luminosidad ±6% y `transition duration-fast`; `active`
sin desplazamiento vertical; `disabled` a 45% de opacidad; `loading` con spinner y
`aria-busy`. Nunca gradientes ni sombras de color en botones.

## 6. Cards

- **WineCard**: foto de botella sobre fondo `linen-100`, sin sombra en reposo. Al hover:
  la imagen escala 1.03 en 620ms `ease-out-expo` y aparece el CTA. Nombre en
  `font-display`, varietal/cosecha en `eyebrow`, precio en Inter 500.
- **ClubPlanCard**: fondo `carbon-900`, filete `gold-500` en el plan destacado,
  beneficios como lista con hairlines.
- **Admin card / MetricCard**: `bone-pure`, borde 1px, `radius-md`, cifra en 28px
  tabular, delta en color semántico.

## 7. Inputs

Altura 44px (admin 36px), fondo `bone-pure`, borde 1px `linen-300`, `radius-sm`.
Label siempre visible arriba (nunca placeholder como label). Foco: borde `carbon-900`
+ outline `clay-500`. Error: borde `danger-500` + mensaje 13px con `aria-describedby`
y `aria-invalid`. Los campos requeridos se marcan en el label, no con asterisco suelto.

## 8. Modales, drawers y overlays

Overlay `carbon-950/60` con `backdrop-blur-sm`. Panel `bone-pure`, `radius-lg`,
`shadow-overlay`. Entrada 280ms (fade + 8px de desplazamiento), salida 160ms.
Foco atrapado, cierre con `Esc`, scroll del body bloqueado, `aria-modal`.
Drawer del carrito entra desde la derecha (mobile: bottom sheet a 92vh).

## 9. Animación

Con criterio. Reglas duras:

- Reveal al hacer scroll: `opacity 0→1` + `translateY 18px→0`, 620ms `ease-out-expo`,
  **una sola vez** por elemento, con `stagger` de 80ms entre hermanos.
- Parallax: máximo 12% de desplazamiento. Nunca en mobile.
- Fotografía: `img-breathe` (escala 1→1.06 en 24s) solo en heroes.
- Transición de sección: fade de fondo, sin scroll hijacking.
- **Prohibido:** scroll secuestrado, texto en movimiento permanente, contadores,
  popups de urgencia, cualquier animación que retrase agregar al carrito.
- `prefers-reduced-motion: reduce` desactiva todo movimiento (implementado en base).
- El admin no anima: solo transiciones de 160ms en hover y foco.

## 10. Fotografía y video

**Fotografía:** luz natural lateral, sombra profunda, grano mínimo, temperatura cálida
(3200–4200K). Botella siempre con espacio negativo alrededor. Nunca fondos blancos de
catálogo en el sitio institucional; sí en el admin (miniaturas).

**Video:** cinematográfico, plano largo, movimiento lento, sin texto quemado, sin
audio. Duración 8–20s en loop. Reglas técnicas obligatorias:

- `autoplay muted loop playsinline preload="none"`, `poster` siempre presente.
- Fuentes separadas desktop / mobile (`<source media>`), WebM + MP4.
- No se carga video si: `prefers-reduced-motion`, `navigator.connection.saveData`,
  `effectiveType` 2g/3g, o ancho < 768px sin fuente mobile → **fallback a imagen**.
- Se monta recién cuando el contenedor entra en viewport (IntersectionObserver) y se
  pausa al salir.
- El texto sobre video usa `scrim-bottom` / `scrim-full` para garantizar contraste.

## 11. Mobile

Mobile no es el desktop roto: es un diseño propio.

- Header 56px con logo centrado; menú en panel full-screen con tipografía grande.
- Hero: 88vh (no 100vh, por la barra del navegador), título en `display-lg`,
  un solo CTA visible y el secundario como link.
- Grid de vinos a 2 columnas (1 columna en < 380px).
- Filtros en bottom sheet con botón "Ver N vinos".
- Carrito accesible desde una barra inferior persistente en la ficha de producto
  (`Agregar` sticky).
- Checkout de una columna, teclados correctos (`inputMode`, `autoComplete`).
- Objetivos táctiles ≥ 44×44px, separación mínima 8px.
- Sin parallax, sin hover, sin video pesado.

## 12. Accesibilidad

Contraste AA como mínimo (AAA en cuerpo de texto). Navegación completa por teclado con
`skip link`. Un solo `h1` por página y jerarquía real de headings. `alt` descriptivo en
producto ("Botella de Malbec Reserva 2021 sobre piedra"), `alt=""` en decorativas.
Labels asociados, `aria-live` para toasts y errores de checkout, `aria-current` en nav.
Estados nunca comunicados solo por color (badge = color + texto).

## 13. Componentes del sistema

`Button` · `IconButton` · `Input` · `Textarea` · `Select` · `Checkbox` · `Label` ·
`FieldError` · `Card` · `Badge` · `Chip` · `Modal` · `Drawer` · `Toast` · `Skeleton` ·
`EmptyState` · `Container` · `Section` · `Eyebrow` · `Heading` · `Reveal` · `Price` ·
`StockIndicator` · `QuantityStepper` · `VideoHero` · `EditorialSection` · `WineCard` ·
`WineGrid` · `WineFilter` · `ProductGallery` · `AddToCart` · `CartDrawer` ·
`ClubPlanCard` · `SubscriptionStatus` · `OrderTimeline` · `AdminTable` · `MetricCard` ·
`ChartCard` · `ShippingLabel` · `ConfirmationModal`.
