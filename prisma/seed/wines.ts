/**
 * Catálogo demo. Precios en ARS. Las imágenes son placeholders generados por
 * scripts/generate-placeholders.mjs (ver docs/ASSETS.md para reemplazarlas).
 */

export type WineSeed = {
  name: string;
  slug: string;
  sku: string;
  wineType: "TINTO" | "BLANCO" | "ROSADO" | "ESPUMANTE" | "NARANJO";
  vintage: number;
  price: number;
  compareAtPrice?: number;
  cost: number;
  volumeMl: number;
  alcoholPercent: number;
  intensity: "LIGERO" | "MEDIO" | "INTENSO";
  servingTempC: string;
  agingPotential: string;
  line: string;
  winery: string;
  region: string;
  category: string;
  grapes: { name: string; percent: number }[];
  pairings: string[];
  tags: string[];
  shortDescription: string;
  description: string;
  tastingNotes: string;
  winemaking: string;
  awards?: { title: string; organization: string; year: number; score?: string }[];
  stock: { onHand: number; minStock: number; location: string };
  featured?: boolean;
  isNew?: boolean;
  bestSeller?: boolean;
  image: string;
};

export const WINES: WineSeed[] = [
  {
    name: "Malbec Clásico",
    slug: "malbec-clasico-2023",
    sku: "AUR-MLB-CLA-23",
    wineType: "TINTO",
    vintage: 2023,
    price: 12900,
    cost: 5200,
    volumeMl: 750,
    alcoholPercent: 13.5,
    intensity: "MEDIO",
    servingTempC: "16–18 °C",
    agingPotential: "Hasta 4 años",
    line: "Clásica",
    winery: "Bodega Aurora",
    region: "Valle de Uco",
    category: "Vinos tintos",
    grapes: [{ name: "Malbec", percent: 100 }],
    pairings: ["Carnes rojas", "Pastas", "Picadas"],
    tags: ["Ideal para todos los días"],
    shortDescription: "El Malbec de todos los días: fruta franca, taninos amables.",
    description:
      "Nuestro Malbec de entrada de gama, pensado para la mesa cotidiana. Uvas de viñedos jóvenes a 1.100 metros, fermentación en tanques de acero y tres meses de descanso antes del embotellado. Sin maquillaje: la expresión más directa de la finca.",
    tastingNotes:
      "Color violáceo intenso. En nariz, ciruela fresca, frutilla y un fondo floral. En boca es jugoso, de acidez media y taninos redondos, con final limpio y frutal.",
    winemaking:
      "Cosecha manual en cajones de 18 kg. Maceración pre-fermentativa en frío durante 48 horas. Fermentación a 26 °C con levaduras autóctonas. Tres meses en tanque antes del embotellado.",
    stock: { onHand: 240, minStock: 48, location: "A-01-03" },
    bestSeller: true,
    image: "tinto-alt",
  },
  {
    name: "Malbec Reserva",
    slug: "malbec-reserva-2021",
    sku: "AUR-MLB-RES-21",
    wineType: "TINTO",
    vintage: 2021,
    price: 24500,
    compareAtPrice: 28900,
    cost: 9800,
    volumeMl: 750,
    alcoholPercent: 14.2,
    intensity: "INTENSO",
    servingTempC: "16–18 °C",
    agingPotential: "8 a 10 años",
    line: "Reserva",
    winery: "Bodega Aurora",
    region: "Luján de Cuyo",
    category: "Vinos tintos",
    grapes: [{ name: "Malbec", percent: 100 }],
    pairings: ["Carnes rojas", "Cordero", "Quesos maduros"],
    tags: ["Más vendido", "Guarda"],
    shortDescription: "Doce meses en roble francés. Nuestro vino más pedido.",
    description:
      "De un cuadro de viñedo plantado en 1968, con rendimientos deliberadamente bajos. Doce meses en barricas de roble francés de segundo y tercer uso, buscando que la madera acompañe sin tapar la fruta. Es el vino que mejor cuenta quiénes somos.",
    tastingNotes:
      "Rojo rubí profundo con reflejos violáceos. Aromas de cereza negra, violetas, un toque de chocolate amargo y especias dulces. Boca amplia, taninos pulidos y un final largo con recuerdo a fruta madura.",
    winemaking:
      "Cosecha manual con doble selección. Fermentación en piletas de concreto con pisonado suave. Doce meses en roble francés (30% segundo uso). Sin clarificar ni filtrar.",
    awards: [
      { title: "Medalla de Oro", organization: "Argentina Wine Awards", year: 2023, score: "92 pts" },
      { title: "Mejor Malbec de su rango", organization: "Guía Vinos & Bodegas", year: 2023 },
    ],
    stock: { onHand: 168, minStock: 36, location: "A-02-01" },
    featured: true,
    bestSeller: true,
    image: "tinto",
  },
  {
    name: "Malbec Gran Reserva",
    slug: "malbec-gran-reserva-2019",
    sku: "AUR-MLB-GRA-19",
    wineType: "TINTO",
    vintage: 2019,
    price: 48000,
    cost: 18500,
    volumeMl: 750,
    alcoholPercent: 14.5,
    intensity: "INTENSO",
    servingTempC: "17–19 °C",
    agingPotential: "15 años o más",
    line: "Gran Reserva",
    winery: "Bodega Aurora",
    region: "Valle de Uco",
    category: "Vinos tintos",
    grapes: [{ name: "Malbec", percent: 100 }],
    pairings: ["Carnes rojas", "Caza", "Quesos maduros"],
    tags: ["Alta gama", "Guarda"],
    shortDescription: "Dieciocho meses en roble nuevo. Una añada excepcional.",
    description:
      "2019 fue una añada fresca y lenta, de las que se recuerdan. Seleccionamos las cinco mejores hileras del cuadro alto y las trabajamos por separado. Dieciocho meses en barrica nueva y un año más en botella antes de salir.",
    tastingNotes:
      "Capa alta, borde granate. Nariz compleja: casis, tabaco, cedro, grafito y flores secas. En boca es firme y a la vez sedoso, con acidez viva que sostiene un final muy persistente.",
    winemaking:
      "Selección de grano en mesa vibratoria. Fermentación en foudres de roble. Dieciocho meses en barrica francesa nueva de grano fino. Doce meses de afinamiento en botella.",
    awards: [{ title: "97 puntos", organization: "Descorchados", year: 2024, score: "97 pts" }],
    stock: { onHand: 54, minStock: 12, location: "B-01-01" },
    featured: true,
    image: "tinto",
  },
  {
    name: "Cabernet Franc Reserva",
    slug: "cabernet-franc-reserva-2021",
    sku: "AUR-CBF-RES-21",
    wineType: "TINTO",
    vintage: 2021,
    price: 27900,
    cost: 11200,
    volumeMl: 750,
    alcoholPercent: 13.8,
    intensity: "MEDIO",
    servingTempC: "16–18 °C",
    agingPotential: "10 años",
    line: "Reserva",
    winery: "Finca Aurora Alta",
    region: "Valle de Uco",
    category: "Vinos tintos",
    grapes: [{ name: "Cabernet Franc", percent: 100 }],
    pairings: ["Cerdo", "Verduras asadas", "Quesos maduros"],
    tags: ["Para descubrir"],
    shortDescription: "Herbal, elegante y con una acidez que ordena todo.",
    description:
      "El Cabernet Franc encontró en la altura del Valle de Uco un lugar donde madurar sin perder frescura. Es un vino de perfil europeo, más de tensión que de potencia, y el favorito de quienes trabajan en la bodega.",
    tastingNotes:
      "Rojo profundo. Pimiento asado, arándano, laurel y un fondo mineral. Boca de entrada delicada que crece hacia el final, con taninos finos y mucha frescura.",
    winemaking:
      "Fermentación con 20% de racimo entero. Doce meses en roble francés de tercer uso y foudre.",
    stock: { onHand: 96, minStock: 24, location: "A-03-02" },
    featured: true,
    image: "tinto-alt",
  },
  {
    name: "Cabernet Sauvignon Reserva",
    slug: "cabernet-sauvignon-reserva-2020",
    sku: "AUR-CBS-RES-20",
    wineType: "TINTO",
    vintage: 2020,
    price: 26500,
    cost: 10400,
    volumeMl: 750,
    alcoholPercent: 14.3,
    intensity: "INTENSO",
    servingTempC: "17–18 °C",
    agingPotential: "12 años",
    line: "Reserva",
    winery: "Bodega Aurora",
    region: "Maipú",
    category: "Vinos tintos",
    grapes: [{ name: "Cabernet Sauvignon", percent: 100 }],
    pairings: ["Carnes rojas", "Asado", "Quesos maduros"],
    tags: ["Guarda"],
    shortDescription: "Estructura clásica de Maipú, con doce meses de roble.",
    description:
      "Viñedos viejos de Maipú, suelo aluvional con canto rodado. Un Cabernet de corte clásico: serio, estructurado, hecho para acompañar carnes y para esperar en la cava.",
    tastingNotes:
      "Aromas de grosella negra, menta fresca, pimienta y cedro. Taninos marcados pero maduros, cuerpo medio-alto y final con recuerdo balsámico.",
    winemaking: "Fermentación en acero con remontajes diarios. Doce meses en roble francés y americano.",
    stock: { onHand: 112, minStock: 24, location: "A-03-04" },
    image: "tinto",
  },
  {
    name: "Pinot Noir",
    slug: "pinot-noir-2022",
    sku: "AUR-PNN-PAT-22",
    wineType: "TINTO",
    vintage: 2022,
    price: 29900,
    cost: 12800,
    volumeMl: 750,
    alcoholPercent: 13.2,
    intensity: "LIGERO",
    servingTempC: "14–16 °C",
    agingPotential: "6 años",
    line: "Reserva",
    winery: "Aurora Patagonia",
    region: "Patagonia",
    category: "Vinos tintos",
    grapes: [{ name: "Pinot Noir", percent: 100 }],
    pairings: ["Pescados", "Cerdo", "Hongos"],
    tags: ["Delicado"],
    shortDescription: "Patagonia en estado puro: liviano, fresco, transparente.",
    description:
      "Del valle del Río Negro, donde el viento y la amplitud térmica hacen el trabajo. Un Pinot Noir de cuerpo liviano que no busca impresionar sino acompañar.",
    tastingNotes:
      "Rojo rubí translúcido. Frambuesa, cereza ácida, un toque de té negro y tierra húmeda. Boca ligera, acidez alta, taninos apenas perceptibles.",
    winemaking: "Racimo entero en un 40%. Fermentación con levaduras indígenas. Ocho meses en foudre.",
    stock: { onHand: 72, minStock: 18, location: "C-01-02" },
    image: "tinto-alt",
  },
  {
    name: "Syrah",
    slug: "syrah-2021",
    sku: "AUR-SYR-CAL-21",
    wineType: "TINTO",
    vintage: 2021,
    price: 22400,
    cost: 8900,
    volumeMl: 750,
    alcoholPercent: 14.0,
    intensity: "INTENSO",
    servingTempC: "16–18 °C",
    agingPotential: "8 años",
    line: "Reserva",
    winery: "Bodega Aurora",
    region: "Valle Calchaquí",
    category: "Vinos tintos",
    grapes: [{ name: "Syrah", percent: 100 }],
    pairings: ["Asado", "Cordero", "Especias"],
    tags: ["Intenso"],
    shortDescription: "Especiado y carnoso, de viñedos a 2.000 metros.",
    description:
      "A dos mil metros, el sol es directo y las noches muy frías. El Syrah responde con color, especias y una concentración que no se consigue más abajo.",
    tastingNotes:
      "Violeta oscuro. Pimienta negra, mora, cuero y humo. Boca carnosa, con volumen y un final cálido y especiado.",
    winemaking: "Fermentación en concreto. Diez meses en barrica de segundo uso.",
    stock: { onHand: 88, minStock: 24, location: "A-04-01" },
    image: "tinto",
  },
  {
    name: "Aurora Ícono",
    slug: "aurora-icono-2018",
    sku: "AUR-ICO-BLD-18",
    wineType: "TINTO",
    vintage: 2018,
    price: 85000,
    cost: 32000,
    volumeMl: 750,
    alcoholPercent: 14.6,
    intensity: "INTENSO",
    servingTempC: "17–19 °C",
    agingPotential: "20 años",
    line: "Ícono",
    winery: "Bodega Aurora",
    region: "Valle de Uco",
    category: "Vinos tintos",
    grapes: [
      { name: "Malbec", percent: 60 },
      { name: "Cabernet Franc", percent: 25 },
      { name: "Cabernet Sauvignon", percent: 15 },
    ],
    pairings: ["Carnes rojas", "Caza", "Quesos maduros"],
    tags: ["Alta gama", "Edición limitada", "Guarda"],
    shortDescription: "Solo se elabora en añadas excepcionales. 2.400 botellas.",
    description:
      "No se hace todos los años. Cuando la añada lo permite, seleccionamos barrica por barrica hasta encontrar el corte que merece llevar el nombre de la bodega. 2018 dio 2.400 botellas numeradas.",
    tastingNotes:
      "Concentrado y profundo. Casis, violetas, especias dulces, grafito y un fondo de cedro. La boca es enorme pero precisa, con taninos de textura pulida y un final que no termina.",
    winemaking:
      "Vinificación por parcela en foudres. Veinticuatro meses en roble francés nuevo. Dos años de botella antes de la salida al mercado.",
    awards: [
      { title: "98 puntos", organization: "Tim Atkin Report", year: 2024, score: "98 pts" },
      { title: "Gran Medalla de Oro", organization: "Concours Mondial", year: 2023 },
    ],
    stock: { onHand: 24, minStock: 6, location: "B-01-05" },
    featured: true,
    image: "tinto-alt",
  },
  {
    name: "Chardonnay Reserva",
    slug: "chardonnay-reserva-2023",
    sku: "AUR-CHR-RES-23",
    wineType: "BLANCO",
    vintage: 2023,
    price: 21900,
    cost: 8600,
    volumeMl: 750,
    alcoholPercent: 13.4,
    intensity: "MEDIO",
    servingTempC: "10–12 °C",
    agingPotential: "6 años",
    line: "Reserva",
    winery: "Finca Aurora Alta",
    region: "Valle de Uco",
    category: "Vinos blancos",
    grapes: [{ name: "Chardonnay", percent: 100 }],
    pairings: ["Pescados", "Mariscos", "Aves", "Quesos suaves"],
    tags: ["Con barrica"],
    shortDescription: "Ocho meses sobre borras: textura sin exceso de madera.",
    description:
      "Buscamos un Chardonnay de textura, no de manteca. Fermentación parcial en barrica usada y ocho meses sobre sus borras finas, con bâtonnage semanal.",
    tastingNotes:
      "Amarillo pálido con destellos verdosos. Pera, durazno blanco, almendra y un toque de tiza. Boca untuosa con acidez firme y final salino.",
    winemaking: "Prensado suave de racimo entero. 40% en barrica usada, 60% en acero. Ocho meses sobre borras.",
    stock: { onHand: 132, minStock: 30, location: "D-01-01" },
    featured: true,
    image: "blanco",
  },
  {
    name: "Sauvignon Blanc",
    slug: "sauvignon-blanc-2024",
    sku: "AUR-SVB-PED-24",
    wineType: "BLANCO",
    vintage: 2024,
    price: 16900,
    cost: 6400,
    volumeMl: 750,
    alcoholPercent: 12.8,
    intensity: "LIGERO",
    servingTempC: "8–10 °C",
    agingPotential: "3 años",
    line: "Clásica",
    winery: "Bodega Aurora",
    region: "Valle de Pedernal",
    category: "Vinos blancos",
    grapes: [{ name: "Sauvignon Blanc", percent: 100 }],
    pairings: ["Pescados", "Mariscos", "Ensaladas", "Quesos suaves"],
    tags: ["Novedad", "Fresco"],
    shortDescription: "Cítrico, filoso y directo. Recién llegado de la cosecha 2024.",
    description:
      "Pedernal tiene suelos de piedra caliza y noches muy frías: el Sauvignon Blanc sale eléctrico. Vinificado íntegramente en acero para no interferir.",
    tastingNotes:
      "Verdoso brillante. Pomelo, hoja de tomate, ruda y un fondo mineral marcado. Ataque filoso, acidez alta, final seco y persistente.",
    winemaking: "Prensado en frío, decantación estática, fermentación a 14 °C en acero inoxidable.",
    stock: { onHand: 156, minStock: 36, location: "D-01-04" },
    isNew: true,
    image: "blanco",
  },
  {
    name: "Torrontés",
    slug: "torrontes-2024",
    sku: "AUR-TRR-CAL-24",
    wineType: "BLANCO",
    vintage: 2024,
    price: 15500,
    cost: 5900,
    volumeMl: 750,
    alcoholPercent: 13.0,
    intensity: "LIGERO",
    servingTempC: "8–10 °C",
    agingPotential: "3 años",
    line: "Clásica",
    winery: "Bodega Aurora",
    region: "Valle Calchaquí",
    category: "Vinos blancos",
    grapes: [{ name: "Torrontés", percent: 100 }],
    pairings: ["Comida asiática", "Ensaladas", "Quesos suaves"],
    tags: ["Novedad", "Aromático"],
    shortDescription: "La uva más argentina: floral en nariz, seca en boca.",
    description:
      "El Torrontés engaña: promete dulzor en la nariz y entrega un vino completamente seco. Un clásico del norte que trabajamos con cosecha temprana para conservar acidez.",
    tastingNotes: "Jazmín, rosas, cáscara de pomelo y durazno. Boca seca, ligera y con final amargo elegante.",
    winemaking: "Cosecha nocturna. Maceración en frío de 6 horas. Fermentación lenta a 13 °C.",
    stock: { onHand: 108, minStock: 24, location: "D-02-01" },
    isNew: true,
    image: "blanco",
  },
  {
    name: "Rosé de Malbec",
    slug: "rose-de-malbec-2024",
    sku: "AUR-ROS-MLB-24",
    wineType: "ROSADO",
    vintage: 2024,
    price: 14200,
    cost: 5400,
    volumeMl: 750,
    alcoholPercent: 12.5,
    intensity: "LIGERO",
    servingTempC: "8–10 °C",
    agingPotential: "2 años",
    line: "Clásica",
    winery: "Bodega Aurora",
    region: "Luján de Cuyo",
    category: "Rosados",
    grapes: [{ name: "Malbec", percent: 100 }],
    pairings: ["Picadas", "Pescados", "Ensaladas", "Comida asiática"],
    tags: ["Novedad", "Fresco"],
    shortDescription: "Prensado directo, color pálido, boca seca.",
    description:
      "Un rosado de estilo provenzal hecho con Malbec: prensado directo, sin maceración, para lograr un color pálido y una boca completamente seca.",
    tastingNotes: "Rosa pálido. Frutilla, sandía, cítricos y flores blancas. Ligero, seco y muy refrescante.",
    winemaking: "Prensado directo a baja presión. Fermentación a 14 °C. Tres meses sobre borras finas.",
    stock: { onHand: 96, minStock: 24, location: "D-02-03" },
    isNew: true,
    image: "rosado",
  },
  {
    name: "Espumante Brut Nature",
    slug: "espumante-brut-nature",
    sku: "AUR-ESP-BNT-NV",
    wineType: "ESPUMANTE",
    vintage: 2022,
    price: 32000,
    cost: 13200,
    volumeMl: 750,
    alcoholPercent: 12.2,
    intensity: "MEDIO",
    servingTempC: "6–8 °C",
    agingPotential: "5 años",
    line: "Reserva",
    winery: "Bodega Aurora",
    region: "Valle de Uco",
    category: "Espumantes",
    grapes: [
      { name: "Chardonnay", percent: 70 },
      { name: "Pinot Noir", percent: 30 },
    ],
    pairings: ["Mariscos", "Pescados", "Aperitivo", "Quesos suaves"],
    tags: ["Método tradicional"],
    shortDescription: "Método tradicional, 24 meses sobre lías, sin azúcar agregada.",
    description:
      "Segunda fermentación en botella y veinticuatro meses de crianza sobre lías. Sin licor de expedición: lo que se prueba es la uva y el tiempo.",
    tastingNotes:
      "Burbuja fina y persistente. Manzana verde, masa de pan, avellana y cáscara de limón. Boca tensa, seca y muy larga.",
    winemaking: "Método tradicional (champenoise). 24 meses en rima. Degüelle sin agregado de azúcar.",
    awards: [{ title: "Medalla de Plata", organization: "Vinandino", year: 2024 }],
    stock: { onHand: 64, minStock: 18, location: "E-01-01" },
    featured: true,
    image: "espumante",
  },
  {
    name: "Espumante Extra Brut",
    slug: "espumante-extra-brut",
    sku: "AUR-ESP-XBR-NV",
    wineType: "ESPUMANTE",
    vintage: 2023,
    price: 27500,
    cost: 10800,
    volumeMl: 750,
    alcoholPercent: 12.5,
    intensity: "LIGERO",
    servingTempC: "6–8 °C",
    agingPotential: "3 años",
    line: "Clásica",
    winery: "Bodega Aurora",
    region: "Valle de Uco",
    category: "Espumantes",
    grapes: [
      { name: "Chardonnay", percent: 60 },
      { name: "Pinot Noir", percent: 40 },
    ],
    pairings: ["Aperitivo", "Picadas", "Pescados"],
    tags: ["Para brindar"],
    shortDescription: "Fresco y fácil de tomar. El espumante de la casa.",
    description:
      "Elaborado en método Charmat largo para conservar el carácter frutal. Es el espumante que abrimos cuando alguien llega de visita.",
    tastingNotes: "Cítricos, pera y flores. Burbuja cremosa, boca liviana y final seco.",
    winemaking: "Método Charmat largo, nueve meses en autoclave.",
    stock: { onHand: 84, minStock: 24, location: "E-01-03" },
    image: "espumante",
  },
  {
    name: "Naranjo Experimental",
    slug: "naranjo-experimental-2023",
    sku: "AUR-NAR-EXP-23",
    wineType: "NARANJO",
    vintage: 2023,
    price: 34000,
    cost: 14500,
    volumeMl: 750,
    alcoholPercent: 13.0,
    intensity: "MEDIO",
    servingTempC: "12–14 °C",
    agingPotential: "6 años",
    line: "Experimental",
    winery: "Finca Aurora Alta",
    region: "Valle de Uco",
    category: "Vinos naranjos",
    grapes: [{ name: "Torrontés", percent: 100 }],
    pairings: ["Comida asiática", "Quesos maduros", "Especias"],
    tags: ["Novedad", "Edición limitada", "Para descubrir"],
    shortDescription: "Seis meses con hollejos en tinaja. 900 botellas.",
    description:
      "Un experimento que ya lleva tres añadas: Torrontés fermentado con sus hollejos en tinajas de barro, sin control de temperatura y sin agregados. Cada año sale distinto y eso es parte del punto.",
    tastingNotes:
      "Ámbar. Té negro, orejones, cáscara de naranja, nuez y un fondo de hierbas secas. En boca tiene tanino, textura y un final amargo largo.",
    winemaking: "Fermentación y crianza con hollejos durante seis meses en tinajas de barro. Sin filtrar.",
    stock: { onHand: 36, minStock: 9, location: "F-01-01" },
    isNew: true,
    image: "naranjo",
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

export const PACKS: PackSeed[] = [
  {
    name: "Pack Malbec x3",
    slug: "pack-malbec-x3",
    sku: "AUR-PACK-MLB3",
    price: 76900,
    compareAtPrice: 85400,
    shortDescription: "Los tres Malbec de la bodega, del más simple al más serio.",
    description:
      "Un recorrido vertical por nuestro Malbec: el Clásico, el Reserva y el Gran Reserva. La forma más clara de entender qué cambia cuando cambia la finca y el tiempo en barrica.",
    category: "Packs",
    tags: ["Pack", "Regalo"],
    components: [
      { slug: "malbec-clasico-2023", quantity: 1 },
      { slug: "malbec-reserva-2021", quantity: 1 },
      { slug: "malbec-gran-reserva-2019", quantity: 1 },
    ],
    image: "pack",
    featured: true,
    bestSeller: true,
  },
  {
    name: "Pack Degustación x6",
    slug: "pack-degustacion-x6",
    sku: "AUR-PACK-DEG6",
    price: 124900,
    compareAtPrice: 141600,
    shortDescription: "Seis vinos, seis estilos. Para probar toda la bodega de una vez.",
    description:
      "Un tinto clásico, un reserva, un blanco con barrica, un blanco fresco, un rosado y un espumante. Pensado para una mesa larga o para decidir cuál va a ser tu vino.",
    category: "Packs",
    tags: ["Pack", "Para descubrir"],
    components: [
      { slug: "malbec-clasico-2023", quantity: 1 },
      { slug: "cabernet-sauvignon-reserva-2020", quantity: 1 },
      { slug: "chardonnay-reserva-2023", quantity: 1 },
      { slug: "sauvignon-blanc-2024", quantity: 1 },
      { slug: "rose-de-malbec-2024", quantity: 1 },
      { slug: "espumante-extra-brut", quantity: 1 },
    ],
    image: "pack",
    featured: true,
  },
  {
    name: "Pack Asado",
    slug: "pack-asado",
    sku: "AUR-PACK-ASA3",
    price: 56900,
    compareAtPrice: 61800,
    shortDescription: "Tres tintos con estructura para una parrilla larga.",
    description:
      "Malbec, Cabernet Sauvignon y Syrah. Tres perfiles distintos que aguantan el fuego, la sal y la sobremesa.",
    category: "Packs",
    tags: ["Pack", "Más vendido"],
    components: [
      { slug: "malbec-clasico-2023", quantity: 1 },
      { slug: "cabernet-sauvignon-reserva-2020", quantity: 1 },
      { slug: "syrah-2021", quantity: 1 },
    ],
    image: "pack",
    bestSeller: true,
  },
  {
    name: "Pack Regalo",
    slug: "pack-regalo",
    sku: "AUR-PACK-REG2",
    price: 76500,
    compareAtPrice: 80000,
    shortDescription: "Gran Reserva y Brut Nature en caja de madera.",
    description:
      "Nuestro Malbec Gran Reserva junto al Espumante Brut Nature, en caja de madera con cierre de cinta. Incluye tarjeta manuscrita si lo pedís en las notas del pedido.",
    category: "Packs",
    tags: ["Pack", "Regalo", "Alta gama"],
    components: [
      { slug: "malbec-gran-reserva-2019", quantity: 1 },
      { slug: "espumante-brut-nature", quantity: 1 },
    ],
    image: "pack",
  },
];
