/*
  Categorías de la tienda.

  Estuvo duplicada entre maquetas y por eso se extrajo acá. Hoy la consume
  sólo "/", que las muestra como círculos con foto y le agrega "Todos"
  adelante.

  Espejan el desplegable "Vinos" del menú lateral: lo pidió el cliente para que
  la home y el menú ofrezcan lo mismo. Eso incluye Espumantes y Dulces, que hoy
  no tienen etiquetas cargadas; quien entre ahí cae en el vacío del catálogo,
  que ya resuelve el caso con un mensaje y un botón para volver.

  Ninguna de las dos tiene foto todavía: el círculo cae al ícono de copa hasta
  que lleguen las imágenes.

  Viven acá y no en el CMS por ahora porque son estructura de navegación y el
  diseño todavía se está definiendo. Cuando se estabilice conviene moverlas a
  bloques editables, como el resto del contenido.
*/
export type CategoriaTienda = {
  label: string;
  href: string;
  /** 300×300, packshot real sobre crema. Sin imagen usa el fallback. */
  imageUrl?: string;
};

export const CATEGORIAS_TIENDA: CategoriaTienda[] = [
  { label: "Tintos", href: "/vinos?tipo=TINTO", imageUrl: "/media/categories/tintos.webp" },
  { label: "Blancos", href: "/vinos?tipo=BLANCO", imageUrl: "/media/categories/blancos.webp" },
  { label: "Rosados", href: "/vinos?tipo=ROSADO", imageUrl: "/media/categories/rosados.webp" },
  { label: "Espumantes", href: "/vinos?tipo=ESPUMANTE" },
  { label: "Dulces", href: "/vinos?tipo=DULCE" },
];

/** Atajo para el enlace "todos" que cada maqueta pone al principio. */
export const TODOS_LOS_VINOS = { label: "Todos", href: "/vinos" } as const;
