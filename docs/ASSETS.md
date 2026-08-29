# Fotografía y video

## Estado actual: placeholders con licencia libre

Todo el material de `public/media/` viene de **Pexels**, bajo la
[licencia de Pexels](https://www.pexels.com/license/): uso gratuito, también
comercial, sin atribución obligatoria. El detalle archivo por archivo, con el
link a la fuente, está en [`public/media/CREDITS.md`](../public/media/CREDITS.md).

Para volver a descargarlos:

```bash
npm run assets:stock
```

El manifiesto vive en `scripts/fetch-stock-media.mjs`.

### Regla al elegir fotos de producto

**La etiqueta no puede ser legible.** Mostrar botellas de otras bodegas como si
fueran propias induce a error al comprador y es un problema de marcas. Por eso
las fotos de producto son botellas sin etiqueta, etiquetas fuera de foco o copas.
Ya se descartaron varias buenas fotos por tener marcas visibles.

## Cómo poner la fotografía propia

Hay dos caminos y ninguno requiere tocar código.

### 1. Reemplazar los archivos

Si conservás los nombres, no hay que cambiar nada más:

```
public/media/scenes/hero-vineyard-mountains.jpg   poster del hero de la home
public/media/scenes/vineyard-rows.jpg             bloque "Nuestra tierra"
public/media/scenes/barrels.jpg                   bloque "Nuestra forma de hacer vino"
public/media/scenes/cellar.jpg                    Club, plan Reserva
public/media/scenes/glass-dark.jpg                poster del hero del Club
public/media/scenes/pouring.jpg                   invitación al Club
public/media/scenes/pouring-dark.jpg              fondo del age gate
public/media/scenes/mountains.jpg                 hero de Nuestra historia
public/media/scenes/harvest.jpg                   bloque "El origen"
public/media/scenes/vineyard-valley.jpg           líneas, plan Descubrir
public/media/scenes/barrels-storage.jpg           líneas
public/media/scenes/grapes-cluster.jpg            líneas, plan Ícono
public/media/scenes/grapes.jpg                    disponible
public/media/scenes/bottle-glass-dark.jpg         disponible

public/media/video/hero-desktop.mp4               hero de la home, desktop
public/media/video/hero-mobile.mp4                hero de la home, mobile
public/media/video/club-desktop.mp4               hero del Club, desktop
public/media/video/club-mobile.mp4                hero del Club, mobile (vertical)
```

Después de reemplazar imágenes, en desarrollo conviene limpiar el caché del
optimizador:

```bash
rm -rf .next/cache/images
```

### 2. Cambiar las rutas desde el admin

**Admin > Contenido** permite editar, sección por sección, la imagen, el poster
y las dos fuentes de video. Sirve tanto para archivos de `public/` como para
URLs de un bucket S3/R2.

Las fotos de producto se suben directamente en **Admin > Productos**, con orden,
imagen principal y texto alternativo.

## Especificaciones para producción

### Fotografía de producto (packshots)

- Relación **3:4 vertical**, mínimo 1200×1600 px.
- La botella centrada, ocupando ~70% de la altura del cuadro. Las cards recortan
  con `object-cover`: si la botella está muy al borde, se corta.
- Luz lateral, sombra propia, fondo neutro claro (funciona con `linen-100`) o
  fondo transparente en PNG.
- JPG con calidad 80 o WebP. El resto lo hace `next/image` (AVIF/WebP y tamaños
  responsive automáticos).

### Fotografía editorial

- Horizontal 3:2 o 16:9, mínimo 1920 px de ancho.
- Temperatura cálida (3200–4200 K), luz natural, grano mínimo.
- Espacio negativo donde va el texto: los bloques superponen títulos.

### Video

- **Duración 8–20 s en loop**, sin audio, sin texto quemado, movimiento lento.
- Dos archivos por hero:
  - **desktop**: 1280×720, H.264, ≤ 6 MB.
  - **mobile**: 640×360 apaisado o 540×960 vertical, ≤ 2,5 MB.
- El poster es obligatorio: es lo que se ve si el video no carga.

El componente `VideoHero` ya resuelve el resto (spec §5): `preload="none"`,
montaje recién cuando el hero entra en viewport, pausa al salir, y **no carga
video** si el visitante tiene `prefers-reduced-motion`, ahorro de datos activado,
conexión 2G/3G, o está en mobile sin fuente mobile. En todos esos casos se
muestra la fotografía.

Para comprimir sin perder calidad visible:

```bash
ffmpeg -i original.mov -vf "scale=1280:-2" -c:v libx264 -crf 26 -preset slow \
  -an -movflags +faststart hero-desktop.mp4

ffmpeg -i original.mov -vf "scale=640:-2" -c:v libx264 -crf 28 -preset slow \
  -an -movflags +faststart hero-mobile.mp4
```

## Peso del repositorio

La media de demostración pesa unos 17 MB. Cuando entre la fotografía definitiva
conviene moverla a un bucket S3/R2 (`STORAGE_DRIVER=s3`) y dejar en el repo solo
el logo y el favicon.
