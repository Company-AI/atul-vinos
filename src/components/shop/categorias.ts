/*
  Categorías de la tienda: una sola lista para las tres maquetas.

  Estaba duplicada en "/" y en "/v2", así que agregar una tercera copia en
  "/v3" garantizaba que se desincronizaran. Cada maqueta la consume con el
  componente que le corresponde —círculos con foto, pastillas de texto o
  índice numerado— y compone sus propios extremos ("Todos", "Ofertas").

  Se listan sólo las que tienen productos: no hay espumantes en catálogo, y
  mandar a alguien a un filtro vacío es peor que no ofrecer la categoría.

  Viven acá y no en el CMS por ahora porque son estructura de navegación y el
  diseño todavía se está definiendo. Cuando se estabilice conviene moverlas a
  bloques editables, como el resto del contenido.
*/
export type CategoriaTienda = {
  label: string;
  href: string;
  /** 300×300, packshot real sobre crema. Sin imagen usa el fallback. */
  imageUrl: string;
};

export const CATEGORIAS_TIENDA: CategoriaTienda[] = [
  { label: "Tintos", href: "/vinos?tipo=TINTO", imageUrl: "/media/categories/tintos.webp" },
  { label: "Malbec", href: "/vinos?varietal=malbec", imageUrl: "/media/categories/malbec.webp" },
  { label: "Blancos", href: "/vinos?tipo=BLANCO", imageUrl: "/media/categories/blancos.webp" },
  { label: "Rosados", href: "/vinos?tipo=ROSADO", imageUrl: "/media/categories/rosados.webp" },
  {
    label: "Cabernet",
    href: "/vinos?varietal=cabernet-franc",
    imageUrl: "/media/categories/cabernet.webp",
  },
  {
    label: "Chardonnay",
    href: "/vinos?varietal=chardonnay",
    imageUrl: "/media/categories/chardonnay.webp",
  },
  { label: "Box", href: "/box", imageUrl: "/media/categories/box.webp" },
];

/** Atajo para el enlace "todos" que cada maqueta pone al principio. */
export const TODOS_LOS_VINOS = { label: "Todos", href: "/vinos" } as const;
