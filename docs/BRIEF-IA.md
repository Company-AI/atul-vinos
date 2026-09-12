# Prompt para pasarle a una IA

Copiá todo lo que está debajo de la línea y pegalo tal cual. No hace falta
agregar nada más.

---

Necesito que diseñes y armes el sitio web de **Atul Vinos**. Te doy el
contexto completo del negocio y después te dejo el criterio de diseño a vos.

## Qué es Atul

Atul es una **tienda especializada en vinos**, no una bodega. Esta distinción
es la más importante de todo el brief y quiero que la tengas presente en cada
decisión que tomes.

No hacemos vino. Compramos, probamos y vendemos vino de otros. Somos
distribuidores con local: vamos a la bodega, probamos la añada que se va a
vender, y recién ahí compramos. Por eso el catálogo es corto y podemos
defender cada botella que ofrecemos.

Estamos en **Río Cuarto, Córdoba**. Enviamos gratis en Río Cuarto, Las
Higueras y Holmberg; al resto de Córdoba y al centro del país (Buenos Aires,
Santa Fe, Mendoza) con envío estándar. También se puede retirar en depósito.

La ambición del catálogo es tener vino de todo el país, del norte de Jujuy
hasta la Patagonia. Hoy arrancamos con alrededor de 22 etiquetas y cuatro
cajas armadas, con producto de Bodega Norton, Rutini Wines y Trumpeter,
todavía concentrado en Mendoza. Escribí la web para el catálogo que existe,
no para el que queremos: no prometas una geografía que todavía no tenemos.

## Lo que NO quiero

Casi todo lo que se encuentra buscando "sitio de vinos" es el sitio de una
bodega, y eso es exactamente lo que no somos. Evitá:

- Hablar de "nuestros viñedos", "nuestro terroir", "nuestro enólogo",
  "nuestra cosecha". No son nuestros. Son de las bodegas que distribuimos.
- El relato de la finca: el video aéreo del viñedo al amanecer, la línea de
  tiempo con "1902 – fundación", el retrato del enólogo mirando una copa a
  contraluz, la carta del fundador.
- Heros de pantalla completa donde hay que scrollear tres veces antes de ver
  un precio.
- Menús de cuatro ítems con mucho aire y nada de producto.

## Lo que sí quiero

Una **tienda**. Que se note que se viene a comprar vino, no a leer sobre una
familia. Como referencia de género, pensá en una vinoteca especializada
online: el producto al frente, precio visible, stock claro, buscador que
funciona, categorías para navegar, y el contenido editorial al servicio de la
compra (por qué elegimos esta botella, con qué va, cuándo abrirla).

Lo que tiene que resolver el sitio:

- **Catálogo** navegable por tipo (tinto, blanco, rosado), varietal, bodega,
  región y precio. Con buscador real.
- **Ficha de producto** con foto de la botella, precio, stock, descripción
  nuestra (no la contratapa de la bodega), y agregar al carrito.
- **Cajas armadas**: selecciones de 2 o 3 botellas con una idea detrás
  ("tres Malbec de tres zonas para entender de qué depende el estilo").
- **Ofertas** y **novedades** como secciones propias.
- **Carrito y checkout** con envío calculado por zona, cupones y pago online.
- **Cuenta** del cliente: pedidos, direcciones, favoritos.
- Una sección de **quiénes somos** corta y honesta. Una pantalla, no cinco.

## Identidad

- **Nombre**: Atul · Vinos. El logotipo es la palabra ATUL en versalitas
  espaciadas con la "U" dibujada como una copa, y debajo "VINOS" en letra
  chica muy espaciada.
- **Azul marino** `#2A3D6E` (y sus variantes más oscuras `#24345E`, `#1E2D54`)
  como único acento de marca: botones, links, estados activos, íconos.
- **Crema** `#F7F3EC` de fondo y `#FDFBF7` para las superficies.
- **Granate** `#8C2537` reservado exclusivamente a ofertas y descuentos. Un
  "-15%" en azul no se lee como rebaja; ahí el rojo comunica, no decora.
- **Tipografías**: Cormorant Garamond para títulos, Inter para interfaz,
  Parisienne sólo para la firma manuscrita.
- **Frases de la casa**: «Más que vinos, encuentros» · «Buenos vinos, mejores
  historias» · «Vinos que conectan» · «Probamos todo lo que vendemos».
- Radios chicos (2 a 8px), sombras casi imperceptibles, reglas de un pixel.
  Nada burbujeante.

## Reglas que no se negocian

- **No inventes datos.** Nada de añadas, altitudes, puntajes de críticos,
  coordenadas, premios ni cantidad de hectáreas. Si un dato no está, no va.
- **No copies otro sitio.** Podés mirar referencias de género, pero los
  textos, las fotos, la estructura y la identidad tienen que ser propios.
- **No hardcodees** productos, precios, planes, costos de envío ni contenido:
  todo tiene que poder administrarse.
- **El pago se confirma sólo por webhook del proveedor**, nunca porque el
  navegador volvió a una URL de éxito.
- No guardes datos sensibles de tarjeta. Eso lo maneja el proveedor de pago.
- Validá del lado del servidor, hasheá contraseñas, protegé los endpoints de
  administración y no expongas secretos en el frontend.

## Lo que te dejo a vos

La estructura de la home, la jerarquía, el ritmo de las secciones, cómo se
resuelve la navegación, la grilla del catálogo, las animaciones y el tono de
los textos. Quiero ver tu criterio, no una plantilla.

Antes de escribir código, contame en pocas líneas qué vas a hacer y por qué:
qué secciones lleva la home y en qué orden, y cómo pensás que se descubre un
vino dentro del sitio. Después avanzá.
