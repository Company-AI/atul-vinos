# Prompt para una IA — sin dirección de diseño

Copiá todo lo que está debajo de la línea. A diferencia del otro brief, este
no dice nada de tipografías, grillas, referencias ni estilo: sólo el negocio,
lo que pidió el cliente y el color de marca.

---

Necesito el sitio web de **Atul Vinos**. Te paso el negocio y los requisitos.
Todo lo visual queda a tu criterio.

## Qué es Atul

Atul es una **tienda que vende vino**, no una bodega. Es la distinción más
importante de todo esto.

No hacemos vino. Compramos, probamos y vendemos vino de otros. Somos
distribuidores con local: vamos a la bodega, probamos la añada que se va a
vender, y recién ahí compramos. Por eso el catálogo es corto y podemos
defender cada botella.

Concretamente, eso significa que el sitio **no habla de "nuestros viñedos",
"nuestro terroir", "nuestro enólogo" ni "nuestra cosecha"**: no son nuestros,
son de las bodegas que distribuimos. Tampoco hay historia de la finca, año de
fundación, ni carta del fundador. Se viene a comprar vino, no a leer sobre una
familia.

Estamos en **Río Cuarto, Córdoba**. Envío sin cargo en Río Cuarto, Las
Higueras y Holmberg. Al resto de Córdoba y al centro del país (Buenos Aires,
Santa Fe, Mendoza) con envío estándar. También se puede retirar en depósito.

## El catálogo real

Hoy son **22 etiquetas y 4 cajas armadas**, de Bodega Norton, Rutini Wines y
Trumpeter, todas de Mendoza. La ambición es tener vino de todo el país, del
norte de Jujuy hasta la Patagonia, pero todavía no lo tenemos: **escribí para
el catálogo que existe y no prometas una geografía que no está**.

## Lo que tiene que resolver el sitio

- Catálogo de vinos navegable por tipo, varietal, bodega, región y precio, con
  buscador.
- Ficha de cada vino con foto, precio, stock y una descripción escrita por
  nosotros (no la contratapa de la bodega).
- Cajas armadas de 2 o 3 botellas, cada una con una idea detrás.
- Secciones de ofertas y de novedades.
- Carrito y checkout, con el envío calculado según la zona y soporte de
  cupones.
- Cuenta del cliente: pedidos, direcciones, favoritos.
- Una sección corta de quiénes somos.

## Pedidos puntuales del cliente

Estos cuatro son pedidos textuales y no están a discusión. El resto de las
decisiones son tuyas.

1. El menú va **replegado detrás de tres rayitas**, arriba a la izquierda, y
   se despliega al tocarlas.
2. Arriba, una selección corta de **exactamente 3 botellas**, presentada como
   recomendación de la semana y no como catálogo.
3. Debajo de las piezas de Box, Novedades y Ofertas va el **catálogo general
   de todos los vinos, a dos columnas**, y ese sí se llama "Nuestros vinos".
4. Las fotos son de **botellas reales con etiqueta real**, no genéricas.

## Color

El color de marca es el azul **`#2A3D6E`**. Es lo único que te condiciono de
lo visual: todo lo demás —paleta de apoyo, tipografías, grilla, ritmo,
composición, animaciones— lo elegís vos.

## Reglas que no se negocian

- **No inventes datos.** Nada de añadas, altitudes, puntajes de críticos,
  premios, coordenadas ni cantidad de hectáreas. Si un dato no está, no va.
- **No copies otro sitio.** Textos, fotos, estructura e identidad, propios.
- **No hardcodees** productos, precios, costos de envío ni contenido: todo
  tiene que poder administrarse.
- **El pago se confirma sólo por webhook del proveedor**, nunca porque el
  navegador volvió a una URL de éxito.
- No guardes datos de tarjeta: eso lo maneja el proveedor de pago.
- Validá del lado del servidor, hasheá contraseñas, protegé los endpoints de
  administración y no expongas secretos en el frontend.

Antes de escribir código, contame en pocas líneas qué vas a hacer y por qué.
Después avanzá.
