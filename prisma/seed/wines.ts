/**
 * Catálogo real de distribución.
 *
 * Las etiquetas, bodegas y regiones son reales. Los packshots son los oficiales
 * de cada bodega (scripts/fetch-product-shots.mjs).
 *
 * PRECIOS: capturados de las tiendas oficiales en agosto de 2026. Los de Rutini
 * venían por caja de 6 y están divididos por unidad. Hay que actualizarlos con
 * la lista vigente del proveedor antes de vender.
 *
 * COSECHA: va vacía a propósito. Cambia con cada partida que entra, así que se
 * carga desde Admin > Productos cuando llega la mercadería. No inventamos añadas.
 *
 * TEXTOS: la descripción es "por qué lo elegimos" — nuestra recomendación como
 * distribuidores, no la ficha oficial de la bodega. Las notas de cata son
 * orientativas del varietal. Si la bodega manda su material, se reemplaza.
 */

export type WineSeed = {
  name: string;
  slug: string;
  sku: string;
  wineType: "TINTO" | "BLANCO" | "ROSADO" | "ESPUMANTE" | "NARANJO" | "DULCE";
  price: number;
  compareAtPrice?: number;
  cost: number;
  volumeMl: number;
  intensity: "LIGERO" | "MEDIO" | "INTENSO";
  servingTempC: string;
  agingPotential: string;
  line: string;
  winery: string;
  region: string;
  category: string;
  grapes: { name: string; percent?: number }[];
  pairings: string[];
  tags: string[];
  shortDescription: string;
  description: string;
  tastingNotes: string;
  stock: { onHand: number; minStock: number; location: string };
  featured?: boolean;
  isNew?: boolean;
  bestSeller?: boolean;
  image: string;
};

export const WINES: WineSeed[] = [
  // ══════════════════════ Rutini Wines · Valle de Uco ══════════════════════
  {
    name: "Rutini Colección Malbec",
    slug: "rutini-coleccion-malbec",
    sku: "RUT-COL-MLB",
    wineType: "TINTO",
    price: 38100,
    cost: 24800,
    volumeMl: 750,
    intensity: "INTENSO",
    servingTempC: "16–18 °C",
    agingPotential: "Se puede guardar entre 5 y 8 años",
    line: "Alta gama",
    winery: "Rutini Wines",
    region: "Valle de Uco",
    category: "Vinos tintos",
    grapes: [{ name: "Malbec", percent: 100 }],
    pairings: ["Carnes rojas", "Cordero", "Quesos maduros"],
    tags: ["Más vendido", "Con barrica"],
    shortDescription: "El Malbec que más nos piden, y con razón.",
    description:
      "Es el vino que le damos a alguien que quiere entender de qué se habla cuando se habla de Malbec de altura. Fruta madura sin exceso, madera bien integrada y un final que se sostiene. Lo recomendamos cuando la ocasión importa pero no queremos ir a un ícono.",
    tastingNotes:
      "Rojo profundo con reflejos violáceos. Ciruela, cereza negra y un fondo de especias dulces y vainilla. Boca amplia, taninos redondos y final largo.",
    stock: { onHand: 96, minStock: 24, location: "A-01-01" },
    featured: true,
    bestSeller: true,
    image: "rutini-coleccion-malbec",
  },
  {
    name: "Rutini Colección Cabernet Franc",
    slug: "rutini-coleccion-cabernet-franc",
    sku: "RUT-COL-CBF",
    wineType: "TINTO",
    price: 31800,
    cost: 20600,
    volumeMl: 750,
    intensity: "MEDIO",
    servingTempC: "16–18 °C",
    agingPotential: "Se puede guardar entre 5 y 8 años",
    line: "Alta gama",
    winery: "Rutini Wines",
    region: "Valle de Uco",
    category: "Vinos tintos",
    grapes: [{ name: "Cabernet Franc", percent: 100 }],
    pairings: ["Cerdo", "Verduras asadas", "Quesos maduros"],
    tags: ["Para descubrir"],
    shortDescription: "Herbal y con nervio. El que recomendamos a quien ya tomó mucho Malbec.",
    description:
      "El Cabernet Franc del Valle de Uco es uno de los mejores argumentos que tiene Mendoza hoy. Este es equilibrado, con la parte herbal en su punto —presente, no dominante— y una acidez que ordena todo. Es el que más nos gusta abrir a nosotros.",
    tastingNotes:
      "Rojo intenso. Pimiento asado, arándano, laurel y un fondo mineral. Entrada delicada que crece hacia el final, con taninos finos.",
    stock: { onHand: 72, minStock: 18, location: "A-01-04" },
    featured: true,
    image: "rutini-coleccion-cabernet-franc",
  },
  {
    name: "Rutini Colección Cabernet Malbec",
    slug: "rutini-coleccion-cabernet-malbec",
    sku: "RUT-COL-CBM",
    wineType: "TINTO",
    price: 20300,
    cost: 13200,
    volumeMl: 750,
    intensity: "INTENSO",
    servingTempC: "16–18 °C",
    agingPotential: "Se puede guardar entre 4 y 6 años",
    line: "Reserva",
    winery: "Rutini Wines",
    region: "Valle de Uco",
    category: "Vinos tintos",
    grapes: [{ name: "Cabernet Sauvignon" }, { name: "Malbec" }],
    pairings: ["Carnes rojas", "Asado", "Pastas"],
    tags: ["Más vendido"],
    shortDescription: "El corte clásico argentino, resuelto con oficio.",
    description:
      "Cuando alguien nos pide un tinto que quede bien con cualquier comida y con cualquier mesa, este es el que sale. El Cabernet le pone estructura, el Malbec lo hace amable. Relación precio-calidad difícil de discutir.",
    tastingNotes:
      "Rojo rubí. Grosella negra, ciruela y un toque de pimienta. Boca con cuerpo, taninos presentes pero maduros.",
    stock: { onHand: 144, minStock: 36, location: "A-01-06" },
    bestSeller: true,
    image: "rutini-coleccion-cabernet-malbec",
  },
  {
    name: "Rutini Colección Pinot Noir",
    slug: "rutini-coleccion-pinot-noir",
    sku: "RUT-COL-PNN",
    wineType: "TINTO",
    price: 46400,
    cost: 30200,
    volumeMl: 750,
    intensity: "LIGERO",
    servingTempC: "14–16 °C",
    agingPotential: "Se puede guardar entre 3 y 5 años",
    line: "Alta gama",
    winery: "Rutini Wines",
    region: "Valle de Uco",
    category: "Vinos tintos",
    grapes: [{ name: "Pinot Noir", percent: 100 }],
    pairings: ["Pescados", "Cerdo", "Hongos"],
    tags: ["Delicado"],
    shortDescription: "Liviano, fresco y con perfume. No todo tinto pide carne.",
    description:
      "Hacer buen Pinot Noir en Mendoza no es fácil y este lo logra: cuerpo liviano, mucha nariz y una acidez que lo mantiene vivo. Lo recomendamos para pescados grasos, hongos o simplemente para una charla larga.",
    tastingNotes:
      "Rojo translúcido. Frambuesa, cereza ácida, té negro y tierra húmeda. Boca ligera, taninos apenas perceptibles.",
    stock: { onHand: 48, minStock: 12, location: "A-02-02" },
    image: "rutini-coleccion-pinot-noir",
  },
  {
    name: "Rutini Colección Chardonnay",
    slug: "rutini-coleccion-chardonnay",
    sku: "RUT-COL-CHR",
    wineType: "BLANCO",
    price: 30300,
    cost: 19700,
    volumeMl: 750,
    intensity: "MEDIO",
    servingTempC: "10–12 °C",
    agingPotential: "Se puede guardar entre 3 y 5 años",
    line: "Alta gama",
    winery: "Rutini Wines",
    region: "Valle de Uco",
    category: "Vinos blancos",
    grapes: [{ name: "Chardonnay", percent: 100 }],
    pairings: ["Pescados", "Mariscos", "Aves", "Quesos suaves"],
    tags: ["Con barrica"],
    shortDescription: "Blanco con textura, sin la manteca de los Chardonnay viejos.",
    description:
      "El Chardonnay volvió y este explica por qué: tiene el paso de barrica justo para darle cuerpo sin taparle la fruta. Es el blanco que ponemos en la mesa cuando hay pescado y alguien dice que no toma blancos.",
    tastingNotes:
      "Amarillo pálido con destellos verdosos. Pera, durazno blanco, almendra y un fondo de tiza. Boca untuosa con acidez firme.",
    stock: { onHand: 84, minStock: 24, location: "D-01-01" },
    featured: true,
    image: "rutini-coleccion-chardonnay",
  },
  {
    name: "Rutini Colección Sauvignon Blanc",
    slug: "rutini-coleccion-sauvignon-blanc",
    sku: "RUT-COL-SVB",
    wineType: "BLANCO",
    price: 22100,
    cost: 14400,
    volumeMl: 750,
    intensity: "LIGERO",
    servingTempC: "8–10 °C",
    agingPotential: "Tomar joven, dentro de los 2 años",
    line: "Reserva",
    winery: "Rutini Wines",
    region: "Valle de Uco",
    category: "Vinos blancos",
    grapes: [{ name: "Sauvignon Blanc", percent: 100 }],
    pairings: ["Pescados", "Mariscos", "Ensaladas", "Quesos suaves"],
    tags: ["Fresco"],
    shortDescription: "Cítrico y filoso. El aperitivo que nunca falla.",
    description:
      "Para arrancar una comida, para el calor, para picar algo. Es directo, no pide pensarlo demasiado, y por eso lo tenemos siempre en stock.",
    tastingNotes:
      "Verdoso brillante. Pomelo, hoja de tomate y un fondo mineral. Ataque filoso, acidez alta, final seco.",
    stock: { onHand: 108, minStock: 30, location: "D-01-03" },
    image: "rutini-coleccion-sauvignon-blanc",
  },
  {
    name: "Rutini Colección Rosé de Malbec",
    slug: "rutini-coleccion-rose-de-malbec",
    sku: "RUT-COL-ROS",
    wineType: "ROSADO",
    price: 33000,
    cost: 21500,
    volumeMl: 750,
    intensity: "LIGERO",
    servingTempC: "8–10 °C",
    agingPotential: "Tomar joven, dentro de los 2 años",
    line: "Alta gama",
    winery: "Rutini Wines",
    region: "Valle de Uco",
    category: "Rosados",
    grapes: [{ name: "Malbec", percent: 100 }],
    pairings: ["Picadas", "Pescados", "Ensaladas", "Comida asiática"],
    tags: ["Fresco"],
    shortDescription: "Rosado seco de verdad, no un tinto aguado.",
    description:
      "El rosado argentino mejoró muchísimo y este está entre los que lo demuestran: color pálido, boca seca y una fruta que aparece sin empalagar. Funciona todo el año, no solo en verano.",
    tastingNotes:
      "Rosa pálido. Frutilla, sandía, cítricos y flores blancas. Ligero, seco y refrescante.",
    stock: { onHand: 60, minStock: 18, location: "D-02-01" },
    image: "rutini-coleccion-rose-de-malbec",
  },
  {
    name: "Rutini Single Vineyard Gualtallary Malbec",
    slug: "rutini-single-vineyard-gualtallary-malbec",
    sku: "RUT-SV-GUA-MLB",
    wineType: "TINTO",
    price: 41200,
    cost: 26800,
    volumeMl: 750,
    intensity: "INTENSO",
    servingTempC: "17–18 °C",
    agingPotential: "Se puede guardar entre 8 y 12 años",
    line: "Ícono",
    winery: "Rutini Wines",
    region: "Gualtallary",
    category: "Vinos tintos",
    grapes: [{ name: "Malbec", percent: 100 }],
    pairings: ["Carnes rojas", "Caza", "Quesos maduros"],
    tags: ["Alta gama", "Guarda", "Terroir"],
    shortDescription: "Gualtallary en una botella: mineral, tenso, de guarda.",
    description:
      "Gualtallary es suelo calcáreo y mucha altura, y eso se siente: este Malbec es más tenso y mineral que el promedio, con menos fruta dulce y más piedra. No es el más fácil de entrar, es el más interesante.",
    tastingNotes:
      "Capa alta. Casis, violetas, grafito y hierbas de montaña. Boca firme, acidez viva y final muy persistente.",
    stock: { onHand: 36, minStock: 9, location: "B-01-01" },
    featured: true,
    image: "rutini-single-vineyard-gualtallary-malbec",
  },
  {
    name: "Rutini Single Vineyard Gualtallary Carménère",
    slug: "rutini-single-vineyard-gualtallary-carmenere",
    sku: "RUT-SV-GUA-CAR",
    wineType: "TINTO",
    price: 41200,
    cost: 26800,
    volumeMl: 750,
    intensity: "MEDIO",
    servingTempC: "16–18 °C",
    agingPotential: "Se puede guardar entre 6 y 10 años",
    line: "Ícono",
    winery: "Rutini Wines",
    region: "Gualtallary",
    category: "Vinos tintos",
    grapes: [{ name: "Carménère", percent: 100 }],
    pairings: ["Carnes rojas", "Cerdo", "Especias"],
    tags: ["Para descubrir", "Edición limitada", "Terroir"],
    shortDescription: "Una rareza en Mendoza. Vale la pena por curiosidad y por calidad.",
    description:
      "Carménère argentino, y encima de Gualtallary. Es de esas botellas que abrimos para mostrar que el país tiene más que Malbec. Especiado, con cuerpo medio y un perfil que sorprende a cualquiera que crea conocer los tintos de acá.",
    tastingNotes:
      "Rojo profundo. Pimienta negra, mora, pimiento y un fondo ahumado. Boca de cuerpo medio con taninos suaves.",
    stock: { onHand: 24, minStock: 6, location: "B-01-03" },
    isNew: true,
    image: "rutini-single-vineyard-gualtallary-carmenere",
  },
  {
    name: "Rutini Finca Centenaria La Consulta Malbec",
    slug: "rutini-finca-centenaria-la-consulta-malbec",
    sku: "RUT-FC-LCO-MLB",
    wineType: "TINTO",
    price: 67400,
    cost: 43800,
    volumeMl: 750,
    intensity: "INTENSO",
    servingTempC: "17–19 °C",
    agingPotential: "Se puede guardar 15 años o más",
    line: "Ícono",
    winery: "Rutini Wines",
    region: "La Consulta",
    category: "Vinos tintos",
    grapes: [{ name: "Malbec", percent: 100 }],
    pairings: ["Carnes rojas", "Caza", "Quesos maduros"],
    tags: ["Alta gama", "Guarda", "Viñedo viejo"],
    shortDescription: "Viñedo centenario de La Consulta. La botella para una fecha.",
    description:
      "Viñas de más de cien años en La Consulta, que dan poca fruta y muy concentrada. Es el vino que reservamos para cuando alguien busca algo que se recuerde: hay que decantarlo y darle tiempo en la copa.",
    tastingNotes:
      "Concentrado y profundo. Casis, tabaco, cedro y flores secas. Enorme en boca pero preciso, con taninos de textura pulida.",
    stock: { onHand: 18, minStock: 6, location: "B-01-05" },
    featured: true,
    image: "rutini-finca-centenaria-la-consulta-malbec",
  },
  {
    name: "Dominio Malbec",
    slug: "dominio-malbec",
    sku: "RUT-DOM-MLB",
    wineType: "TINTO",
    price: 28330,
    cost: 18400,
    volumeMl: 750,
    intensity: "INTENSO",
    servingTempC: "16–18 °C",
    agingPotential: "Se puede guardar entre 5 y 8 años",
    line: "Reserva",
    winery: "Rutini Wines",
    region: "Valle de Uco",
    category: "Vinos tintos",
    grapes: [{ name: "Malbec", percent: 100 }],
    pairings: ["Carnes rojas", "Asado", "Pastas"],
    tags: ["Con barrica"],
    shortDescription: "Un escalón antes de la alta gama, con casi todo lo bueno.",
    description:
      "De los que mejor rinden por lo que cuestan. Tiene la estructura y la madera de un vino más caro y se lo puede abrir sin ocasión especial. Un buen lugar donde empezar si querés subir un escalón.",
    tastingNotes:
      "Rojo intenso. Fruta negra madura, chocolate amargo y especias. Boca carnosa con final cálido.",
    stock: { onHand: 84, minStock: 24, location: "A-02-04" },
    image: "dominio-malbec",
  },
  {
    name: "Encuentro Malbec",
    slug: "encuentro-malbec",
    sku: "RUT-ENC-MLB",
    wineType: "TINTO",
    price: 17000,
    cost: 11000,
    volumeMl: 750,
    intensity: "MEDIO",
    servingTempC: "16–18 °C",
    agingPotential: "Tomar dentro de los 3 años",
    line: "Cotidiana",
    winery: "Rutini Wines",
    region: "Valle de Uco",
    category: "Vinos tintos",
    grapes: [{ name: "Malbec", percent: 100 }],
    pairings: ["Pastas", "Picadas", "Carnes rojas"],
    tags: ["Ideal para todos los días"],
    shortDescription: "Para el martes. Fruta franca y nada de vueltas.",
    description:
      "No todo tiene que ser una gran botella. Este es el que recomendamos para la semana: fruta directa, taninos amables y un precio que permite abrirlo sin pensarlo.",
    tastingNotes: "Violáceo. Ciruela y frutilla, con un fondo floral. Jugoso, de acidez media y final limpio.",
    stock: { onHand: 180, minStock: 48, location: "A-03-01" },
    bestSeller: true,
    image: "encuentro-malbec",
  },
  {
    name: "Blend of Terroirs Malbec",
    slug: "blend-of-terroirs-malbec",
    sku: "RUT-BOT-MLB",
    wineType: "TINTO",
    price: 27500,
    cost: 17900,
    volumeMl: 750,
    intensity: "INTENSO",
    servingTempC: "16–18 °C",
    agingPotential: "Se puede guardar entre 5 y 8 años",
    line: "Reserva",
    winery: "Rutini Wines",
    region: "Valle de Uco",
    category: "Vinos tintos",
    grapes: [{ name: "Malbec", percent: 100 }],
    pairings: ["Carnes rojas", "Cordero", "Quesos maduros"],
    tags: ["Terroir"],
    shortDescription: "Varios suelos del Valle de Uco en una misma botella.",
    description:
      "Un corte de parcelas de distintos terroirs del Valle de Uco. La gracia está en la complejidad: cada suelo aporta algo distinto y el resultado tiene más capas que un Malbec de un solo origen.",
    tastingNotes:
      "Rojo profundo. Fruta negra, violetas y especias dulces, con un fondo mineral. Boca amplia y equilibrada.",
    stock: { onHand: 66, minStock: 18, location: "A-02-06" },
    image: "blend-of-terroirs-malbec",
  },

  // ═══════════════════ Trumpeter · Luján de Cuyo (Rutini) ══════════════════
  {
    name: "Trumpeter Reserve Malbec",
    slug: "trumpeter-reserve-malbec",
    sku: "TRU-RES-MLB",
    wineType: "TINTO",
    price: 14900,
    cost: 9700,
    volumeMl: 750,
    intensity: "MEDIO",
    servingTempC: "16–18 °C",
    agingPotential: "Tomar dentro de los 3 años",
    line: "Cotidiana",
    winery: "Trumpeter",
    region: "Luján de Cuyo",
    category: "Vinos tintos",
    grapes: [{ name: "Malbec", percent: 100 }],
    pairings: ["Asado", "Pastas", "Picadas"],
    tags: ["Ideal para todos los días", "Más vendido"],
    shortDescription: "El Malbec de mesa que más rota en el depósito.",
    description:
      "Es el que compran los restaurantes y el que se lleva la gente por caja. Correcto, parejo entre añadas y con un precio que lo hace fácil de recomendar a cualquiera.",
    tastingNotes: "Rojo con reflejos violáceos. Ciruela, cereza y un toque de vainilla. Boca redonda y final frutal.",
    stock: { onHand: 240, minStock: 60, location: "A-04-01" },
    bestSeller: true,
    image: "trumpeter-reserve-malbec",
  },
  {
    name: "Trumpeter Cabernet Franc",
    slug: "trumpeter-cabernet-franc",
    sku: "TRU-CBF",
    wineType: "TINTO",
    price: 11500,
    cost: 7500,
    volumeMl: 750,
    intensity: "MEDIO",
    servingTempC: "16–18 °C",
    agingPotential: "Tomar dentro de los 3 años",
    line: "Cotidiana",
    winery: "Trumpeter",
    region: "Luján de Cuyo",
    category: "Vinos tintos",
    grapes: [{ name: "Cabernet Franc", percent: 100 }],
    pairings: ["Cerdo", "Verduras asadas", "Pastas"],
    tags: ["Para descubrir", "Ideal para todos los días"],
    shortDescription: "Entrar al Cabernet Franc sin gastar de más.",
    description:
      "La puerta de entrada más barata al varietal que más creció en Mendoza. Si te gusta, después subís de escalón; si no, no gastaste una fortuna en averiguarlo.",
    tastingNotes: "Rojo medio. Pimiento, frutos rojos y hierbas. Fresco, de taninos suaves.",
    stock: { onHand: 156, minStock: 36, location: "A-04-03" },
    image: "trumpeter-cabernet-franc",
  },
  {
    name: "Trumpeter Reserve Rosé de Malbec",
    slug: "trumpeter-reserve-rose-de-malbec",
    sku: "TRU-RES-ROS",
    wineType: "ROSADO",
    price: 14900,
    cost: 9700,
    volumeMl: 750,
    intensity: "LIGERO",
    servingTempC: "8–10 °C",
    agingPotential: "Tomar joven, dentro de los 2 años",
    line: "Cotidiana",
    winery: "Trumpeter",
    region: "Luján de Cuyo",
    category: "Rosados",
    grapes: [{ name: "Malbec", percent: 100 }],
    pairings: ["Picadas", "Ensaladas", "Comida asiática"],
    tags: ["Fresco", "Ideal para todos los días"],
    shortDescription: "Rosado de todos los días, bien seco.",
    description:
      "Para el after office, la previa o la tarde de calor. Cumple exactamente lo que promete y sale a un precio que permite tenerlo siempre frío en la heladera.",
    tastingNotes: "Rosa pálido. Frutilla y cítricos. Seco, ligero y muy fácil de tomar.",
    stock: { onHand: 96, minStock: 24, location: "D-02-03" },
    isNew: true,
    image: "trumpeter-reserve-rose-de-malbec",
  },

  // ══════════════════════ Bodega Norton · Luján de Cuyo ════════════════════
  {
    name: "Norton Altura Malbec",
    slug: "norton-altura-malbec",
    sku: "NOR-ALT-MLB",
    wineType: "TINTO",
    price: 24183,
    cost: 15700,
    volumeMl: 750,
    intensity: "INTENSO",
    servingTempC: "16–18 °C",
    agingPotential: "Se puede guardar entre 5 y 8 años",
    line: "Reserva",
    winery: "Bodega Norton",
    region: "Valle de Uco",
    category: "Vinos tintos",
    grapes: [{ name: "Malbec", percent: 100 }],
    pairings: ["Carnes rojas", "Cordero", "Quesos maduros"],
    tags: ["Con barrica", "Terroir"],
    shortDescription: "Malbec de altura del Valle de Uco, con mucha concentración.",
    description:
      "Norton lleva más de cien años en Mendoza y esta línea busca altura: uva del Valle de Uco, más frescura y más color. Es de los tintos que mejor aguantan un plato con carácter.",
    tastingNotes:
      "Violeta oscuro. Fruta negra madura, especias y un fondo de cacao. Boca concentrada con taninos firmes.",
    stock: { onHand: 90, minStock: 24, location: "C-01-01" },
    featured: true,
    image: "norton-altura-malbec",
  },
  {
    name: "Norton Perdriel Series Malbec",
    slug: "norton-perdriel-malbec",
    sku: "NOR-PER-MLB",
    wineType: "TINTO",
    price: 22333,
    cost: 14500,
    volumeMl: 750,
    intensity: "INTENSO",
    servingTempC: "16–18 °C",
    agingPotential: "Se puede guardar entre 5 y 8 años",
    line: "Reserva",
    winery: "Bodega Norton",
    region: "Luján de Cuyo",
    category: "Vinos tintos",
    grapes: [{ name: "Malbec", percent: 100 }],
    pairings: ["Carnes rojas", "Asado", "Quesos maduros"],
    tags: ["Con barrica"],
    shortDescription: "Perdriel es Malbec clásico de Luján. Este lo representa bien.",
    description:
      "Perdriel, en Luján de Cuyo, es una de las zonas históricas del Malbec argentino. Este vino tiene ese perfil más clásico —fruta madura, madera notoria, cuerpo— que sigue teniendo muchos fieles.",
    tastingNotes: "Rojo profundo. Ciruela, vainilla y tabaco. Boca con volumen y final especiado.",
    stock: { onHand: 84, minStock: 24, location: "C-01-03" },
    image: "norton-perdriel-malbec",
  },
  {
    name: "Norton D.O.C Malbec",
    slug: "norton-doc-malbec",
    sku: "NOR-DOC-MLB",
    wineType: "TINTO",
    price: 19050,
    cost: 12400,
    volumeMl: 750,
    intensity: "MEDIO",
    servingTempC: "16–18 °C",
    agingPotential: "Se puede guardar entre 3 y 5 años",
    line: "Reserva",
    winery: "Bodega Norton",
    region: "Luján de Cuyo",
    category: "Vinos tintos",
    grapes: [{ name: "Malbec", percent: 100 }],
    pairings: ["Asado", "Pastas", "Carnes rojas"],
    tags: ["Denominación de origen"],
    shortDescription: "Malbec con denominación de origen Luján de Cuyo.",
    description:
      "Luján de Cuyo fue la primera denominación de origen del Malbec en el país y este vino lleva ese sello. Es un buen ejemplo de lo que significa: fruta, equilibrio y una identidad de zona reconocible.",
    tastingNotes: "Rojo rubí. Fruta roja y negra, con especias suaves. Boca equilibrada y final medio.",
    stock: { onHand: 120, minStock: 30, location: "C-01-05" },
    image: "norton-doc-malbec",
  },
  {
    name: "Norton Select Malbec",
    slug: "norton-select-malbec",
    sku: "NOR-SEL-MLB",
    wineType: "TINTO",
    price: 9900,
    cost: 6400,
    volumeMl: 750,
    intensity: "MEDIO",
    servingTempC: "16–18 °C",
    agingPotential: "Tomar dentro de los 2 años",
    line: "Cotidiana",
    winery: "Bodega Norton",
    region: "Luján de Cuyo",
    category: "Vinos tintos",
    grapes: [{ name: "Malbec", percent: 100 }],
    pairings: ["Pastas", "Picadas", "Pizza"],
    tags: ["Ideal para todos los días"],
    shortDescription: "Cumplidor y barato. El de la caja para tener en casa.",
    description:
      "Cuando hay que llenar la bodeguita de casa sin fundirse. Es parejo, no tiene sorpresas y funciona con casi cualquier comida de semana.",
    tastingNotes: "Rojo vivo. Fruta roja fresca. Ligero, directo y de final corto.",
    stock: { onHand: 216, minStock: 60, location: "C-02-01" },
    image: "norton-select-malbec",
  },
  {
    name: "Norton Talismán Malbec",
    slug: "norton-talisman-malbec",
    sku: "NOR-TAL-MLB",
    wineType: "TINTO",
    price: 5633,
    cost: 3700,
    volumeMl: 750,
    intensity: "LIGERO",
    servingTempC: "15–17 °C",
    agingPotential: "Tomar joven",
    line: "Cotidiana",
    winery: "Bodega Norton",
    region: "Maipú",
    category: "Vinos tintos",
    grapes: [{ name: "Malbec", percent: 100 }],
    pairings: ["Pizza", "Picadas", "Pastas"],
    tags: ["Ideal para todos los días"],
    shortDescription: "El precio más bajo de la lista, sin ser un mal vino.",
    description:
      "Lo tenemos porque hace falta: un tinto correcto al precio más bajo del catálogo. Para eventos, para volumen o para cuando el presupuesto manda.",
    tastingNotes: "Rojo claro. Fruta roja simple y fresca. Boca liviana, sin aristas.",
    stock: { onHand: 300, minStock: 72, location: "C-02-04" },
    image: "norton-talisman-malbec",
  },
  {
    name: "Norton Cosecha Tardía Blanco",
    slug: "norton-cosecha-tardia-blanco",
    sku: "NOR-CT-BCO",
    wineType: "DULCE",
    price: 7200,
    cost: 4700,
    volumeMl: 750,
    intensity: "LIGERO",
    servingTempC: "6–8 °C",
    agingPotential: "Tomar dentro de los 3 años",
    line: "Cotidiana",
    winery: "Bodega Norton",
    region: "Luján de Cuyo",
    category: "Vinos dulces",
    grapes: [{ name: "Torrontés" }],
    pairings: ["Postres", "Quesos azules", "Aperitivo"],
    tags: ["Para el postre"],
    shortDescription: "Dulce sin empalagar. El cierre de una comida larga.",
    description:
      "El dulce que recomendamos para el final: tiene azúcar pero también acidez, así que no cansa. Va muy bien con quesos azules, que es donde más sorprende.",
    tastingNotes: "Amarillo dorado. Durazno en almíbar, miel y flores. Boca dulce con acidez que limpia.",
    stock: { onHand: 72, minStock: 18, location: "C-03-01" },
    image: "norton-cosecha-tardia-blanco",
  },
];

export type PackSeed = {
  name: string;
  slug: string;
  sku: string;
  price: number;
  compareAtPrice?: number;
  shortDescription: string;
  description: string;
  category: string;
  tags: string[];
  components: { slug: string; quantity: number }[];
  image: string;
  featured?: boolean;
  bestSeller?: boolean;
};

/**
 * Los packs son nuestros: elegimos las botellas y armamos la caja. La foto es
 * una imagen de estilo hasta que fotografiemos los estuches propios.
 */
export const PACKS: PackSeed[] = [
  {
    name: "Selección Malbec x3",
    slug: "seleccion-malbec-x3",
    sku: "PACK-MLB3",
    price: 69900,
    compareAtPrice: 79283,
    shortDescription: "Tres Malbec de tres zonas para entender de qué depende el estilo.",
    description:
      "Un Malbec de Luján de Cuyo, uno del Valle de Uco y uno de altura. La misma uva, tres suelos distintos: es la forma más rápida de entender por qué el origen cambia todo. Va con una ficha comparativa escrita por nosotros.",
    category: "Packs",
    tags: ["Pack", "Para descubrir"],
    components: [
      { slug: "trumpeter-reserve-malbec", quantity: 1 },
      { slug: "norton-doc-malbec", quantity: 1 },
      { slug: "norton-altura-malbec", quantity: 1 },
    ],
    image: "pack-malbec",
    featured: true,
    bestSeller: true,
  },
  {
    name: "Valle de Uco x3",
    slug: "valle-de-uco-x3",
    sku: "PACK-UCO3",
    price: 88900,
    compareAtPrice: 100200,
    shortDescription: "Un tinto, un blanco y un rosado de la zona que hoy define a Mendoza.",
    description:
      "El Valle de Uco es donde está pasando lo más interesante del vino argentino. Este pack lo recorre en tres estilos distintos, todos de la misma región, para ver qué tienen en común.",
    category: "Packs",
    tags: ["Pack", "Terroir"],
    components: [
      { slug: "rutini-coleccion-cabernet-franc", quantity: 1 },
      { slug: "rutini-coleccion-chardonnay", quantity: 1 },
      { slug: "rutini-coleccion-rose-de-malbec", quantity: 1 },
    ],
    image: "pack-uco",
  },
  {
    name: "Para el asado x3",
    slug: "para-el-asado-x3",
    sku: "PACK-ASA3",
    price: 52900,
    compareAtPrice: 58483,
    shortDescription: "Tres tintos con estructura para aguantar el fuego y la sobremesa.",
    description:
      "Probado en asados propios. Tres tintos que no se pierden contra la sal, la grasa y el chimichurri, en tres escalones de precio para que elijas según la ocasión.",
    category: "Packs",
    tags: ["Pack", "Más vendido"],
    components: [
      { slug: "encuentro-malbec", quantity: 1 },
      { slug: "norton-perdriel-malbec", quantity: 1 },
      { slug: "rutini-coleccion-cabernet-malbec", quantity: 1 },
    ],
    image: "pack-asado",
    bestSeller: true,
  },
  {
    name: "Regalo alta gama x2",
    slug: "regalo-alta-gama-x2",
    sku: "PACK-REG2",
    price: 104900,
    compareAtPrice: 108600,
    shortDescription: "Dos botellas de guarda en caja de madera, listas para regalar.",
    description:
      "Cuando el regalo tiene que impresionar. Dos etiquetas de guarda del Valle de Uco en caja de madera, con tarjeta manuscrita si lo pedís en las notas del pedido.",
    category: "Packs",
    tags: ["Pack", "Regalo", "Alta gama"],
    components: [
      { slug: "rutini-finca-centenaria-la-consulta-malbec", quantity: 1 },
      { slug: "rutini-single-vineyard-gualtallary-malbec", quantity: 1 },
    ],
    image: "pack-regalo",
  },
];
