# Fotografía y video

## Dos orígenes distintos

| Qué | De dónde | Script |
|---|---|---|
| **Packshots de producto** | Tiendas oficiales de cada bodega | `npm run assets:packshots` |
| **Paisajes y videos** | Pexels, licencia libre | `npm run assets:stock` |

El detalle archivo por archivo del material de Pexels está en
[`public/media/CREDITS.md`](../public/media/CREDITS.md).

## Packshots de producto

Son las fotos oficiales de Rutini Wines, Trumpeter y Bodega Norton, bajadas de sus
tiendas online. Como distribuidores autorizados usamos el material de producto de
nuestros proveedores, que es la práctica habitual del canal.

**Lo correcto a mediano plazo es pedirle a cada bodega su media kit** y reemplazar
estos archivos conservando los nombres de `public/media/wines/`. Así queda todo con
la resolución y el recorte que la bodega aprueba, y sin depender de que su tienda
siga sirviendo esas URLs.

El manifiesto vive en `scripts/fetch-product-shots.mjs`. Agregar una bodega nueva es
sumar sus URLs ahí y sus productos en `prisma/seed/wines.ts`.

### Especificación para packshots propios

- Cuadrado, 1000×1000 px o más, botella centrada sobre fondo blanco o transparente.
- La botella ocupando ~80% de la altura, con aire arriba y abajo.
- PNG si el fondo es transparente, JPG calidad 85 si es blanco.
- Las cards muestran la imagen contenida en un cuadro 3:4 con padding: una foto
  cuadrada y centrada entra perfecta.

## Paisajes de Mendoza

Las fotos de viñedos **son de Mendoza**: Tunuyán, Potrerillos y el Valle de Uco.

```
public/media/scenes/mendoza-vineyard-rows.jpg     poster del hero de la home
public/media/scenes/mendoza-vineyard-andes.jpg    bloque "Cómo elegimos"
public/media/scenes/potrerillos-andes.jpg         bloque "De dónde viene"
public/media/scenes/mendoza-vineyard-house.jpg    quiénes somos, nivel Cotidiana
public/media/scenes/mendoza-valley.jpg            nivel Ícono
public/media/scenes/mendoza-farmland-snow.jpg     hero de quiénes somos
public/media/scenes/mendoza-vineyard-view.jpg     disponible
```

El resto (barricas, copas, uvas, brindis) son fotos genéricas de vino, sin marcas
de terceros visibles.

## Video

**Los videos son de archivo y no están filmados en Mendoza.** Se eligieron por
parecido de paisaje —hileras de viñedo con montaña detrás— pero no son la
provincia. Si hace falta precisión geográfica hay dos caminos: filmar material
propio en una visita a bodega, o licenciar un clip de un banco pago.

```
public/media/video/hero-desktop.mp4    hero de la home, desktop (1280×720)
public/media/video/hero-mobile.mp4     hero de la home, mobile (640×360)
public/media/video/vineyard-road.mp4   fondo del bloque "De dónde viene"
public/media/video/vineyard-aerial.mp4 hero de quiénes somos
public/media/video/club-desktop.mp4    hero del Club y teaser, desktop
public/media/video/club-mobile.mp4     hero del Club, mobile (vertical)
```

### Especificación para video propio

- **Duración 8–20 s en loop**, sin audio, sin texto quemado, movimiento lento.
- Dos archivos por bloque:
  - **desktop**: 1280×720, H.264, ≤ 6 MB.
  - **mobile**: 640×360 apaisado o 540×960 vertical, ≤ 2,5 MB.
- El poster es obligatorio: es lo que se ve si el video no carga.
- Cuidado con los planos muy luminosos (cielo, nieve): el texto va encima. Si el
  clip es claro, hay que subir la densidad del scrim en el bloque.

`VideoHero` y `BackgroundMedia` resuelven el resto (spec §5): `preload="none"`,
montaje recién cuando el bloque entra en viewport, pausa al salir, y **no cargan
video** si el visitante tiene `prefers-reduced-motion`, ahorro de datos activado,
conexión 2G/3G, o está en mobile sin fuente mobile. En todos esos casos se muestra
la fotografía.

Para comprimir:

```bash
ffmpeg -i original.mov -vf "scale=1280:-2" -c:v libx264 -crf 26 -preset slow \
  -an -movflags +faststart hero-desktop.mp4

ffmpeg -i original.mov -vf "scale=640:-2" -c:v libx264 -crf 28 -preset slow \
  -an -movflags +faststart hero-mobile.mp4
```

## Cómo cambiar una imagen o un video sin tocar código

**Admin > Contenido** permite editar, sección por sección, la imagen, el poster y
las dos fuentes de video. Sirve tanto para archivos de `public/` como para URLs de
un bucket S3/R2. Las fotos de producto se suben en **Admin > Productos**, con
orden, imagen principal y texto alternativo.

Después de reemplazar imágenes en desarrollo conviene limpiar el caché del
optimizador:

```bash
rm -rf .next/cache/images
```

## Packs

Las cajas armadas por nosotros usan fotos de estilo (`public/media/packs/`) hasta
que fotografiemos los estuches reales. Es lo primero que conviene reemplazar: un
pack con foto propia vende bastante mejor que uno con una imagen de ambiente.

## Peso del repositorio

La media pesa unos 25 MB. Cuando entre la fotografía definitiva conviene moverla a
un bucket S3/R2 (`STORAGE_DRIVER=s3`) y dejar en el repo solo el logo y el favicon.
