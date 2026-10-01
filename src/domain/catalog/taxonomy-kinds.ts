/**
 * Las clasificaciones del catálogo.
 *
 * Son las listas con las que se arma la ficha de un vino y con las que la
 * tienda filtra: categoría, varietal, maridaje, línea, etiqueta, bodega y
 * región. Cada una vive en su propia tabla porque tienen campos distintos
 * —una región tiene provincia, un maridaje tiene ícono—, pero para quien
 * administra son todas la misma tarea: una lista de nombres que hay que poder
 * ampliar sin pedirle nada a nadie.
 *
 * Este archivo describe esas diferencias en datos, así que la pantalla, el
 * formulario y la acción del servidor trabajan todos contra la misma
 * definición y no hay siete copias del mismo código.
 *
 * No incluye el tipo de vino (tinto, blanco, rosado, espumante, naranjo,
 * dulce): eso es una lista cerrada del modelo de datos, no una tabla, porque
 * la tienda y los filtros se apoyan en esos seis valores exactos.
 */

export const TAXONOMY_KINDS = [
  "category",
  "grape",
  "pairing",
  "line",
  "tag",
  "winery",
  "region",
] as const;

export type TaxonomyKind = (typeof TAXONOMY_KINDS)[number];

export type TaxonomyKindConfig = {
  /** Valor de ?tipo= en /admin/clasificacion. En español, como el resto de las URLs. */
  url: string;
  singular: string;
  plural: string;
  /** Para armar frases: "la categoría", "el varietal". */
  articulo: "la" | "el";
  /** Qué hace esta lista. Se muestra arriba de la tabla. */
  descripcion: string;
  ejemplo: string;
  /** Campo de texto largo. Si falta, el tipo no tiene uno. */
  texto?: { label: string; hint: string };
  conImagen?: boolean;
  /** Se puede desactivar: sale de los desplegables sin tocar lo ya cargado. */
  conEstado?: boolean;
  conOrden?: boolean;
  /** Provincia y país. Sólo regiones. */
  conZona?: boolean;
  conColor?: boolean;
  conIcono?: boolean;
  /** Parámetro con el que filtra el catálogo público, si filtra. */
  filtroPublico?: string;
};

export const TAXONOMIES: Record<TaxonomyKind, TaxonomyKindConfig> = {
  category: {
    url: "categorias",
    singular: "categoría",
    plural: "Categorías",
    articulo: "la",
    descripcion:
      "El cajón grande del catálogo: tintos, blancos, espumantes, box. Es con lo que se agrupan los productos en la tienda.",
    ejemplo: "Espumantes",
    texto: { label: "Descripción", hint: "Una línea sobre qué entra en esta categoría." },
    conImagen: true,
    conEstado: true,
    conOrden: true,
  },
  grape: {
    url: "varietales",
    singular: "varietal",
    plural: "Varietales",
    articulo: "el",
    descripcion:
      "La uva. Un vino puede tener varias, y cada una es un filtro propio en la tienda.",
    ejemplo: "Cabernet Franc",
    texto: { label: "Descripción", hint: "Cómo es esta uva: cuerpo, aromas, dónde se da mejor." },
    conEstado: true,
    filtroPublico: "varietal",
  },
  pairing: {
    url: "maridajes",
    singular: "maridaje",
    plural: "Maridajes",
    articulo: "el",
    descripcion: "Con qué se come. Aparece en la ficha del vino y filtra la tienda.",
    ejemplo: "Pastas",
    conIcono: true,
    filtroPublico: "maridaje",
  },
  line: {
    url: "lineas",
    singular: "línea",
    plural: "Líneas",
    articulo: "la",
    descripcion:
      "La gama dentro de una bodega: reserva, gran reserva, jóvenes. Sirve para ordenar una misma casa por nivel.",
    ejemplo: "Reserva",
    texto: { label: "Descripción", hint: "Qué distingue a esta línea." },
    conImagen: true,
    conEstado: true,
    conOrden: true,
    filtroPublico: "linea",
  },
  tag: {
    url: "etiquetas",
    singular: "etiqueta",
    plural: "Etiquetas",
    articulo: "la",
    descripcion:
      "Distintivos sueltos que no entran en las otras listas: orgánico, edición limitada, vegano.",
    ejemplo: "Orgánico",
    conColor: true,
  },
  winery: {
    url: "bodegas",
    singular: "bodega",
    plural: "Bodegas",
    articulo: "la",
    descripcion:
      "Las casas que representamos. Una bodega tiene que existir acá antes de poder cargarle vinos.",
    ejemplo: "Bodega Colomé",
    texto: { label: "Historia", hint: "Aparece en la ficha de los vinos de esta bodega." },
    conImagen: true,
    conEstado: true,
    filtroPublico: "bodega",
  },
  region: {
    url: "regiones",
    singular: "región",
    plural: "Regiones",
    articulo: "la",
    descripcion: "Las zonas de donde traemos el vino.",
    ejemplo: "Valle de Cafayate",
    texto: { label: "Descripción", hint: "Qué caracteriza a la zona: altura, suelo, clima." },
    conImagen: true,
    conEstado: true,
    conZona: true,
    filtroPublico: "region",
  },
};

/**
 * Resuelve ?tipo=varietales.
 *
 * Devuelve undefined si no hay coincidencia exacta en vez de caer en una lista
 * por defecto: quien filtra la lista de productos necesita distinguir "no
 * pidió filtro" de "pidió uno que no existe".
 */
export function taxonomyPorUrl(url: string | undefined): TaxonomyKind | undefined {
  return TAXONOMY_KINDS.find((kind) => TAXONOMIES[kind].url === url);
}
