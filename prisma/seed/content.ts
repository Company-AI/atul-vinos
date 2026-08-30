/**
 * Contenido inicial del sitio. Todo editable desde /admin/contenido.
 *
 * Posicionamiento: NO producimos vino. Somos distribuidores de bodegas de
 * Mendoza y lo que vendemos es criterio de selección. Todos los textos parten
 * de ahí; si algún día se cambia el modelo, se cambian acá.
 */

export const CMS_SECTIONS = [
  {
    key: "home.hero",
    page: "home",
    type: "video_hero",
    title: "Hero de la home",
    sortOrder: 10,
    data: {
      eyebrow: "Distribuidores de vinos de Mendoza",
      title: "No hacemos el vino.",
      titleAccent: "Elegimos cuál vale la pena.",
      subtitle:
        "Trabajamos con bodegas del Valle de Uco y Luján de Cuyo. Probamos todo antes de comprarlo: si está en esta lista, es porque lo pondríamos en nuestra propia mesa.",
      ctaPrimary: { label: "Ver la selección", href: "/vinos" },
      ctaSecondary: { label: "Conocé el Club", href: "/club" },
      media: {
        imageUrl: "/media/scenes/mendoza-vineyard-rows.jpg",
        imageAlt: "Viñedos de Mendoza con la cordillera de fondo",
        videoDesktopUrl: "/media/video/hero-desktop.mp4",
        videoMobileUrl: "/media/video/hero-mobile.mp4",
        posterUrl: "/media/scenes/mendoza-vineyard-rows.jpg",
      },
      overlay: "scrim-side",
      align: "left",
      height: "full",
      showLogo: false,
      scale: "hero",
      scrollCue: "Seguí bajando",
    },
  },
  {
    key: "home.declaracion",
    page: "home",
    type: "statement",
    title: "Declaración",
    sortOrder: 15,
    data: {
      eyebrow: "Nuestra posición",
      text: "Un catálogo corto no es una limitación.",
      textAccent: "Es el trabajo.",
      attribution: "Atul · Mendoza, Argentina",
      cta: { label: "", href: "" },
      backgroundUrl: "/media/scenes/mendoza-farmland-snow.jpg",
      tone: "dark",
    },
  },
  {
    key: "home.cifras",
    page: "home",
    type: "figures",
    title: "Cifras",
    sortOrder: 25,
    data: {
      eyebrow: "En números",
      title: "Dónde está puesto el foco.",
      imageUrl: "/media/scenes/harvest.jpg",
      imageAlt: "Cosecha manual de uva en Mendoza",
      tone: "linen",
      items: [
        {
          value: "2",
          label: "Zonas",
          detail: "Valle de Uco y Luján de Cuyo. Nada fuera de Mendoza.",
        },
        {
          value: "3",
          label: "Bodegas representadas",
          detail: "Compra directa, sin intermediarios en el medio.",
        },
        {
          value: "22",
          label: "Etiquetas en lista",
          detail: "Corto a propósito: podemos defender cada una.",
        },
        {
          value: "100%",
          label: "Probado antes de comprar",
          detail: "La añada que se vende, no la del año pasado.",
        },
      ],
    },
  },
  {
    key: "home.criterio",
    page: "home",
    type: "editorial",
    title: "Nuestro criterio",
    sortOrder: 20,
    data: {
      eyebrow: "Cómo elegimos",
      title: "Probamos todo lo que vendemos.",
      body:
        "No compramos por catálogo ni por puntaje. Vamos a la bodega, hablamos con el enólogo y probamos la añada que se va a vender, no la anterior. Si una etiqueta bajó respecto del año pasado, la sacamos de la lista aunque se venda bien.\n\nPor eso el catálogo es corto. Preferimos veinte botellas que podemos defender una por una antes que doscientas que no probamos nunca.",
      quote: "Si no lo abriríamos en casa, no lo vendemos.",
      cta: { label: "Ver la selección", href: "/vinos" },
      media: {
        imageUrl: "/media/scenes/mendoza-vineyard-andes.jpg",
        imageAlt: "Viñedos de Tunuyán con los Andes de fondo",
        posterUrl: "/media/scenes/mendoza-vineyard-andes.jpg",
      },
      mediaSide: "right",
      tone: "light",
      layout: "split",
    },
  },
  {
    key: "home.mendoza",
    page: "home",
    type: "editorial",
    title: "De dónde viene",
    sortOrder: 30,
    data: {
      eyebrow: "Mendoza",
      title: "Todo lo que vendemos viene de la misma provincia.",
      body:
        "Valle de Uco y Luján de Cuyo. No es una limitación: es la decisión de conocer bien un lugar en vez de tener un poco de todo. Sabemos qué hace cada zona, qué cambia entre Gualtallary y La Consulta, y por qué un Malbec de Perdriel no se parece a uno de altura.\n\nEsa diferencia es lo que te contamos cuando comprás. Está en cada ficha y en la tarjeta que va dentro de la caja.",
      cta: { label: "Ver las zonas", href: "/vinos" },
      media: {
        imageUrl: "/media/scenes/potrerillos-andes.jpg",
        imageAlt: "Los Andes vistos desde Potrerillos, Mendoza",
        videoDesktopUrl: "/media/video/vineyard-road.mp4",
        videoMobileUrl: "",
        posterUrl: "/media/scenes/potrerillos-andes.jpg",
      },
      mediaSide: "left",
      tone: "dark",
      layout: "fullBleed",
    },
  },
  {
    key: "home.lines",
    page: "home",
    type: "showcase",
    title: "Niveles de selección",
    sortOrder: 40,
    data: {
      eyebrow: "Cómo está ordenada la lista",
      title: "Cuatro niveles, según para qué la vayas a abrir.",
      body:
        "No ordenamos por bodega sino por ocasión. Es más útil: casi nadie busca «un Norton», busca algo para un martes o algo para una fecha.",
      cta: { label: "Ver todo el catálogo", href: "/vinos" },
      tone: "linen",
      items: [
        {
          title: "Cotidiana",
          subtitle: "Para la semana, sin pensarlo",
          imageUrl: "/media/scenes/mendoza-vineyard-house.jpg",
          href: "/vinos?linea=cotidiana",
        },
        {
          title: "Reserva",
          subtitle: "Un escalón más, con barrica",
          imageUrl: "/media/scenes/barrels.jpg",
          href: "/vinos?linea=reserva",
        },
        {
          title: "Alta gama",
          subtitle: "Cuando la ocasión lo pide",
          imageUrl: "/media/scenes/cellar.jpg",
          href: "/vinos?linea=alta-gama",
        },
        {
          title: "Ícono",
          subtitle: "Parcelas puntuales y viñas viejas",
          imageUrl: "/media/scenes/mendoza-valley.jpg",
          href: "/vinos?linea=icono",
        },
      ],
    },
  },
  {
    key: "home.featured",
    page: "home",
    type: "featured_wines",
    title: "Vinos destacados",
    sortOrder: 50,
    data: {
      eyebrow: "Lo que estamos recomendando",
      title: "Si tuviéramos que elegir cuatro.",
      body: "Cambia seguido: son las botellas que más estamos recomendando este mes en el mostrador.",
      cta: { label: "Ver la lista completa", href: "/vinos" },
      source: "featured",
      limit: 4,
      tone: "light",
    },
  },
  {
    key: "home.proceso",
    page: "home",
    type: "split_sticky",
    title: "Cómo llega una botella a la lista",
    sortOrder: 55,
    data: {
      eyebrow: "El proceso",
      title: "Cómo llega una botella a esta lista.",
      mediaSide: "left",
      tone: "light",
      media: {
        imageUrl: "/media/scenes/barrels-storage.jpg",
        imageAlt: "Barricas apiladas en una sala de crianza",
        videoDesktopUrl: "",
        videoMobileUrl: "",
        posterUrl: "/media/scenes/barrels-storage.jpg",
      },
      entries: [
        {
          title: "Vamos a la bodega",
          body: "No compramos por catálogo ni por lista de precios. Vamos, recorremos el viñedo y hablamos con quien hace el vino.",
        },
        {
          title: "Probamos la añada que se vende",
          body: "La que va a entrar al depósito, no la del año pasado. Si bajó respecto de la anterior, se cae de la lista aunque venga vendiéndose bien.",
        },
        {
          title: "Negociamos directo",
          body: "Sin intermediarios. Es lo que nos deja sostener el precio y, sobre todo, la disponibilidad: si te gustó, el mes que viene sigue estando.",
        },
        {
          title: "La escribimos nosotros",
          body: "La ficha no es el texto de la bodega. Es por qué la elegimos, con qué la tomaríamos y qué esperar al abrirla.",
        },
      ],
      cta: { label: "Ver la selección", href: "/vinos" },
    },
  },
  {
    key: "home.mosaico",
    page: "home",
    type: "gallery",
    title: "Mosaico de Mendoza",
    sortOrder: 58,
    data: {
      eyebrow: "Mendoza",
      title: "El lugar del que hablamos.",
      body: "Valle de Uco y Luján de Cuyo: la cordillera, la altura y la amplitud térmica que explican por qué acá el Malbec se comporta distinto.",
      tone: "dark",
      items: [
        {
          imageUrl: "/media/scenes/mendoza-vineyard-andes.jpg",
          imageAlt: "Hileras de viñedo con los Andes de fondo",
          caption: "Tunuyán, Valle de Uco",
          size: "tall",
        },
        {
          imageUrl: "/media/scenes/harvest.jpg",
          imageAlt: "Cosecha manual de uva",
          caption: "Vendimia",
          size: "normal",
        },
        {
          imageUrl: "/media/scenes/grapes-cluster.jpg",
          imageAlt: "Racimo de uva tinta en la planta",
          caption: "Malbec en planta",
          size: "normal",
        },
        {
          imageUrl: "/media/scenes/mendoza-valley.jpg",
          imageAlt: "Valle de Mendoza al atardecer",
          caption: "Altura y amplitud térmica",
          size: "wide",
        },
        {
          imageUrl: "/media/scenes/barrels.jpg",
          imageAlt: "Barricas de roble en crianza",
          caption: "Crianza",
          size: "normal",
        },
        {
          imageUrl: "/media/scenes/potrerillos-andes.jpg",
          imageAlt: "Los Andes vistos desde Potrerillos",
          caption: "Potrerillos",
          size: "normal",
        },
      ],
    },
  },
  {
    key: "home.bodegas",
    page: "home",
    type: "showcase",
    title: "Bodegas que representamos",
    sortOrder: 60,
    data: {
      eyebrow: "Con quiénes trabajamos",
      title: "Pocas bodegas, relación directa.",
      body:
        "Preferimos representar pocas casas y conocerlas bien. Compramos directo, sin intermediarios, y eso es lo que nos permite sostener el precio y la disponibilidad.",
      cta: { label: "Ver todas las etiquetas", href: "/vinos" },
      tone: "light",
      items: [
        {
          title: "Rutini Wines",
          subtitle: "Tupungato, Valle de Uco · desde 1885",
          imageUrl: "/media/scenes/mendoza-vineyard-rows.jpg",
          href: "/vinos?bodega=rutini-wines",
        },
        {
          title: "Bodega Norton",
          subtitle: "Perdriel, Luján de Cuyo · desde 1895",
          imageUrl: "/media/scenes/potrerillos-andes.jpg",
          href: "/vinos?bodega=bodega-norton",
        },
        {
          title: "Trumpeter",
          subtitle: "Luján de Cuyo · la línea de todos los días",
          imageUrl: "/media/scenes/mendoza-vineyard-house.jpg",
          href: "/vinos?bodega=trumpeter",
        },
      ],
    },
  },
  {
    key: "home.club",
    page: "home",
    type: "club_teaser",
    title: "El Club",
    sortOrder: 70,
    data: {
      eyebrow: "El Club",
      title: "Todos los meses elegimos por vos.",
      body:
        "Es lo mismo que hacemos en el mostrador, pero llega a tu casa. Armamos una caja distinta cada mes con lo que más nos entusiasma de lo que entró, y te explicamos por qué elegimos cada botella.",
      bullets: [
        "Una selección distinta cada mes, nunca repetida",
        "Ficha escrita por nosotros con el porqué de cada elección",
        "Envío incluido en los planes Curador y Reserva",
        "10% de descuento permanente en toda la tienda",
        "Pausá, omití un mes o cancelá cuando quieras",
      ],
      cta: { label: "Quiero ser parte", href: "/club" },
      media: {
        imageUrl: "/media/scenes/pouring.jpg",
        imageAlt: "Vino tinto sirviéndose en una copa",
        videoDesktopUrl: "/media/video/club-desktop.mp4",
        videoMobileUrl: "/media/video/club-mobile.mp4",
        posterUrl: "/media/scenes/pouring.jpg",
      },
    },
  },

  // ═══════════════════════════════ Club ═══════════════════════════════════
  {
    key: "club.hero",
    page: "club",
    type: "video_hero",
    title: "Hero del Club",
    sortOrder: 10,
    data: {
      eyebrow: "El Club",
      title: "Dejá que elijamos nosotros.",
      subtitle:
        "Todos los meses armamos una caja con lo mejor que entró y te contamos por qué. Sin contratos, sin permanencia, cancelás cuando quieras.",
      ctaPrimary: { label: "Ver los planes", href: "#planes" },
      ctaSecondary: { label: "Cómo funciona", href: "#como-funciona" },
      media: {
        imageUrl: "/media/scenes/glass-dark.jpg",
        imageAlt: "Copa de vino tinto sobre fondo oscuro",
        videoDesktopUrl: "/media/video/club-desktop.mp4",
        videoMobileUrl: "/media/video/club-mobile.mp4",
        posterUrl: "/media/scenes/glass-dark.jpg",
      },
      overlay: "scrim-full",
      align: "left",
      height: "tall",
      showLogo: false,
    },
  },
  {
    key: "club.steps",
    page: "club",
    type: "steps",
    title: "Cómo funciona",
    sortOrder: 20,
    data: {
      eyebrow: "Cómo funciona",
      title: "Cuatro pasos y listo.",
      tone: "light",
      steps: [
        { title: "Elegís tu plan", body: "Tres, cuatro o seis botellas por mes. Podés cambiar de plan cuando quieras." },
        { title: "Te suscribís", body: "El pago se debita automáticamente todos los meses. Sin contratos ni permanencia mínima." },
        { title: "Elegimos por vos", body: "Cada mes armamos la caja con lo que más nos entusiasma de lo que entró al depósito." },
        { title: "La recibís en tu casa", body: "Despachamos entre el 22 y el 28. Te avisamos con el seguimiento." },
      ],
    },
  },
  {
    key: "club.benefits",
    page: "club",
    type: "editorial",
    title: "Beneficios",
    sortOrder: 40,
    data: {
      eyebrow: "Ser socio",
      title: "Lo que no se compra suelto.",
      body:
        "Los socios tienen 10% de descuento permanente en toda la tienda y son los primeros en enterarse cuando entra una partida chica. Hay etiquetas que llegan en cantidades tan limitadas que se van entre los socios antes de llegar al catálogo.\n\nAdemás, cada caja viene con la ficha que escribimos nosotros: qué es, por qué lo elegimos y con qué lo tomaríamos.",
      cta: { label: "Ver los planes", href: "#planes" },
      media: {
        imageUrl: "/media/scenes/cellar.jpg",
        imageAlt: "Barricas en la nave de crianza",
        posterUrl: "/media/scenes/cellar.jpg",
      },
      mediaSide: "left",
      tone: "dark",
      layout: "split",
    },
  },
  {
    key: "club.faq",
    page: "club",
    type: "faq",
    title: "Preguntas del Club",
    sortOrder: 50,
    data: { eyebrow: "Dudas frecuentes", title: "Todo lo que suelen preguntarnos.", group: "club" },
  },

  // ═════════════════════════════ Quiénes somos ════════════════════════════
  {
    key: "historia.hero",
    page: "historia",
    type: "video_hero",
    title: "Hero de quiénes somos",
    sortOrder: 10,
    data: {
      eyebrow: "Quiénes somos",
      title: "Veinte años tomando y preguntando.",
      subtitle:
        "Empezamos comprando para nosotros y terminamos distribuyendo. En el medio, muchas visitas a bodega y muchas botellas que no volvimos a comprar.",
      ctaPrimary: { label: "Ver la selección", href: "/vinos" },
      ctaSecondary: { label: "", href: "" },
      media: {
        imageUrl: "/media/scenes/mendoza-farmland-snow.jpg",
        imageAlt: "Campo al pie de la cordillera nevada, Mendoza",
        videoDesktopUrl: "/media/video/vineyard-aerial.mp4",
        videoMobileUrl: "",
        posterUrl: "/media/scenes/mendoza-farmland-snow.jpg",
      },
      overlay: "scrim-bottom",
      align: "center",
      height: "tall",
      showLogo: false,
    },
  },
  {
    key: "historia.origen",
    page: "historia",
    type: "editorial",
    title: "El origen",
    sortOrder: 20,
    data: {
      eyebrow: "Cómo empezó",
      title: "Al principio comprábamos para tomar nosotros.",
      body:
        "Íbamos a Mendoza dos veces por año, volvíamos con el auto lleno y repartíamos entre amigos. Cuando los amigos empezaron a encargar por caja, dejó de ser un viaje y pasó a ser un trabajo.\n\nLa parte que no cambió es la manera de elegir: seguimos yendo, seguimos probando y seguimos diciendo que no. Lo único distinto es que ahora hay un depósito, una camioneta y facturas.",
      media: {
        imageUrl: "/media/scenes/mendoza-vineyard-house.jpg",
        imageAlt: "Casa de campo entre viñedos con la montaña detrás",
        posterUrl: "/media/scenes/mendoza-vineyard-house.jpg",
      },
      mediaSide: "right",
      tone: "light",
      layout: "split",
    },
  },
  {
    key: "historia.proceso",
    page: "historia",
    type: "steps",
    title: "Cómo trabajamos",
    sortOrder: 30,
    data: {
      eyebrow: "De la bodega a tu mesa",
      title: "Qué pasa antes de que una botella entre al catálogo.",
      tone: "linen",
      steps: [
        { title: "Visitamos", body: "Dos o tres viajes por año a Mendoza. Vemos el viñedo y hablamos con quien hace el vino." },
        { title: "Probamos", body: "A ciegas y con la añada que se va a vender. Si bajó, sale de la lista." },
        { title: "Negociamos", body: "Compramos directo a la bodega. Sin intermediarios el precio cierra mejor para todos." },
        { title: "Traemos", body: "Transporte con temperatura controlada. El vino no viaja al sol." },
        { title: "Guardamos", body: "Depósito a temperatura estable y botellas acostadas. Rotación permanente." },
        { title: "Explicamos", body: "Cada etiqueta lleva nuestra ficha: qué es, de dónde viene y con qué la tomaríamos." },
      ],
    },
  },

  // ════════════════════════════════ Footer ════════════════════════════════
  {
    key: "footer.main",
    page: "global",
    type: "footer",
    title: "Footer",
    sortOrder: 10,
    data: {
      tagline: "Distribuimos vinos de Mendoza. Probamos todo lo que vendemos.",
      newsletterTitle: "Qué entró este mes",
      newsletterBody:
        "Te avisamos cuando llega una partida nueva y cuando algo se está por terminar. Dos o tres emails por mes, nada más.",
      responsibleNote:
        "Beber con moderación. Prohibida la venta de bebidas alcohólicas a menores de 18 años.",
      columns: [
        {
          title: "Comprar",
          links: [
            { label: "Toda la selección", href: "/vinos" },
            { label: "Packs", href: "/packs" },
            { label: "Novedades", href: "/vinos?orden=novedades" },
            { label: "El Club", href: "/club" },
          ],
        },
        {
          title: "Nosotros",
          links: [
            { label: "Quiénes somos", href: "/historia" },
            { label: "Historias", href: "/historias" },
            { label: "Contacto", href: "/contacto" },
          ],
        },
        {
          title: "Ayuda",
          links: [
            { label: "Preguntas frecuentes", href: "/faq" },
            { label: "Envíos", href: "/envios" },
            { label: "Cambios y devoluciones", href: "/cambios-y-devoluciones" },
            { label: "Términos y condiciones", href: "/terminos" },
            { label: "Privacidad", href: "/privacidad" },
          ],
        },
      ],
    },
  },
];

export const FAQS = [
  { question: "¿Ustedes hacen el vino?", answer: "No. Somos distribuidores: compramos directo a bodegas de Mendoza y las representamos acá. Lo que aportamos es la selección, el asesoramiento y la logística. El vino lo hacen ellos, y lo decimos siempre.", group: "general", sortOrder: 10 },
  { question: "¿Por qué el catálogo es tan corto?", answer: "Porque probamos todo lo que vendemos. Preferimos veinte etiquetas que podemos defender una por una antes que doscientas que no conocemos. Cuando entra algo nuevo, es porque lo probamos y nos convenció.", group: "general", sortOrder: 20 },
  { question: "¿Venden a restaurantes o por mayor?", answer: "Sí. Trabajamos con restaurantes, vinotecas y eventos, con lista de precios propia y entrega programada. Escribinos desde Contacto y te pasamos las condiciones.", group: "general", sortOrder: 30 },
  { question: "¿Venden a menores de 18 años?", answer: "No. La venta de bebidas alcohólicas a menores de 18 años está prohibida por ley. Al ingresar al sitio y al confirmar la compra declarás ser mayor de edad, y el transportista puede pedir documento en la entrega.", group: "general", sortOrder: 40 },
  { question: "¿Cómo sé qué cosecha me llega?", answer: "La añada cambia con cada partida que entra, así que la publicamos en la ficha cuando la tenemos confirmada. Si necesitás una añada puntual, escribinos antes de comprar y te decimos qué hay en depósito.", group: "general", sortOrder: 50 },
  { question: "¿Hacen envíos a todo el país?", answer: "Sí. Despachamos a toda la Argentina. El costo se calcula en el checkout según tu código postal, y a partir de $100.000 el envío es gratuito.", group: "envios", sortOrder: 10 },
  { question: "¿Cuánto tarda en llegar mi pedido?", answer: "Preparamos el pedido en 24 a 48 horas hábiles. La entrega demora entre 2 y 5 días hábiles según la zona. Siempre te enviamos el número de seguimiento por email.", group: "envios", sortOrder: 20 },
  { question: "¿Cómo viajan las botellas?", answer: "Con separadores de cartón y protección lateral, acostadas. En verano coordinamos los despachos para que el vino no quede en tránsito el fin de semana.", group: "envios", sortOrder: 30 },
  { question: "¿Puedo retirar en el depósito?", answer: "Sí, sin cargo. Elegí «Retiro en depósito» en el checkout y te avisamos cuando esté listo. También podés probar algo antes de llevarlo.", group: "envios", sortOrder: 40 },
  { question: "¿Qué pasa si una botella llega rota?", answer: "La reponemos sin costo. Escribinos dentro de las 48 horas con una foto del embalaje y de la botella.", group: "envios", sortOrder: 50 },
  { question: "¿Qué medios de pago aceptan?", answer: "Tarjetas de crédito y débito, dinero en cuenta y transferencia a través de Mercado Pago. Las suscripciones del Club se debitan automáticamente todos los meses con la tarjeta que registres.", group: "pagos", sortOrder: 10 },
  { question: "¿Puedo pagar en cuotas?", answer: "Sí, con tarjeta de crédito hay hasta 6 cuotas disponibles según tu banco. Las cuotas se muestran en el checkout antes de confirmar.", group: "pagos", sortOrder: 20 },
  { question: "¿Hacen descuento por cantidad?", answer: "Sí. A partir de la caja de 6 botellas del mismo vino aplicamos precio por caja, y los socios del Club suman su descuento encima. Para volúmenes mayores, escribinos.", group: "pagos", sortOrder: 30 },
  { question: "¿Cómo funciona el Club?", answer: "Elegís un plan y todos los meses se debita automáticamente. Nosotros armamos una selección distinta cada mes con lo que más nos entusiasma de lo que entró, y te la enviamos a tu domicilio. No hay contrato ni permanencia mínima.", group: "club", sortOrder: 10 },
  { question: "¿Puedo elegir los vinos de mi caja?", answer: "No, y esa es la idea: el Club es para descubrir cosas que no habrías elegido solo. Si algún varietal no te gusta, avisanos y lo tenemos en cuenta al armar tu caja.", group: "club", sortOrder: 20 },
  { question: "¿Puedo pausar o cancelar?", answer: "Cuando quieras, desde Mi Cuenta. Podés pausar la suscripción, omitir el envío de un mes (hasta 5 días antes del cierre) o cancelarla definitivamente sin llamar a nadie.", group: "club", sortOrder: 30 },
  { question: "¿Cuándo se cobra y cuándo llega la caja?", answer: "El cobro se hace el mismo día de cada mes en que te suscribiste. Despachamos entre el 22 y el 28, y la caja llega en los días hábiles siguientes.", group: "club", sortOrder: 40 },
  { question: "¿Puedo cambiar de plan?", answer: "Sí, desde Mi Cuenta. El cambio se aplica en el próximo ciclo: la caja del mes en curso se envía según el plan que tenías.", group: "club", sortOrder: 50 },
  { question: "¿Los vinos del Club se pueden comprar sueltos?", answer: "Casi siempre sí, pero no siempre. Hay partidas tan chicas que se van enteras al Club. Cuando eso pasa, los socios son los únicos que las reciben.", group: "club", sortOrder: 60 },
];

export const POSTS = [
  {
    title: "Gualtallary, La Consulta, Perdriel: por qué no es lo mismo",
    slug: "gualtallary-la-consulta-perdriel-por-que-no-es-lo-mismo",
    excerpt: "Tres zonas de Mendoza, la misma uva y tres vinos que no se parecen en nada.",
    coverUrl: "/media/scenes/mendoza-valley.jpg",
    author: "Equipo de selección",
    category: "Regiones",
    content:
      "Cuando alguien nos dice «quiero un Malbec», la primera pregunta que hacemos es de dónde.\n\nPerdriel, en Luján de Cuyo, es la zona histórica. Está a unos 950 metros, con suelo aluvional profundo. El Malbec que sale de ahí es el clásico argentino: fruta madura, cuerpo, taninos redondos y buena amistad con la barrica. Es el perfil con el que el Malbec se hizo famoso en el mundo.\n\nGualtallary, en el Valle de Uco, está entre 1.200 y 1.600 metros y tiene suelo calcáreo. Eso cambia todo: menos fruta dulce, más tensión, un fondo mineral que algunos describen como tiza o grafito. Son vinos más filosos, que necesitan tiempo en la copa y a veces años en botella.\n\nLa Consulta, más al sur en San Carlos, tiene mucha viña vieja. Los rendimientos son bajísimos y eso da concentración, pero con una acidez que sostiene. Es donde salen algunos de los Malbec más completos del país.\n\nLa forma más rápida de entenderlo es probarlos al lado. Por eso armamos el pack de tres zonas: no es una excusa comercial, es que en paralelo la diferencia se vuelve obvia.",
    publishedAt: new Date("2026-06-18"),
  },
  {
    title: "Cómo elegimos qué entra al catálogo",
    slug: "como-elegimos-que-entra-al-catalogo",
    excerpt: "Vamos, probamos, discutimos y decimos que no bastante seguido.",
    coverUrl: "/media/scenes/barrels.jpg",
    author: "Equipo de selección",
    category: "Nosotros",
    content:
      "No compramos por puntaje. Los puntajes sirven para orientarse, pero un 92 no dice nada sobre si ese vino va a funcionar en la mesa de alguien que quiere tomar algo rico un jueves.\n\nEl proceso es bastante simple y bastante lento. Vamos a Mendoza dos o tres veces por año. Probamos con el enólogo la añada que se va a vender, no la que ya se vendió. Cuando podemos, probamos a ciegas contra otras dos o tres etiquetas del mismo rango de precio.\n\nDespués discutimos. Es la parte más importante y la que más tiempo lleva. La pregunta que nos hacemos no es «¿está bueno?» sino «¿a quién se lo daríamos?». Si no hay una respuesta clara, no entra.\n\nY revisamos todos los años. Hay etiquetas que estuvieron en la lista tres años y salieron porque la añada nueva no estaba a la altura. Eso a veces molesta, incluso a las bodegas. Pero es exactamente lo que nos hace útiles.",
    publishedAt: new Date("2026-07-09"),
  },
  {
    title: "Cómo armar una picada que no pelee con el vino",
    slug: "como-armar-una-picada-que-no-pelee-con-el-vino",
    excerpt: "El error más común no es el queso: es la cantidad de sabores compitiendo al mismo tiempo.",
    coverUrl: "/media/scenes/toast.jpg",
    author: "Equipo de selección",
    category: "Maridajes",
    content:
      "Una picada bien armada tiene tres decisiones: grasa, sal y acidez.\n\nLa grasa suaviza el tanino. Por eso un queso maduro o un salame estacionado hacen que un tinto joven parezca más amable. Si el vino tiene tanino firme, sumá grasa.\n\nLa sal, en cambio, amplifica el alcohol. Si el vino ya viene con 14,5 grados, una picada muy salada lo va a hacer sentir caliente. Bajá la sal o subí la frescura del vino.\n\nLa acidez es la que ordena. Unos pickles, unas aceitunas o un tomate en aceite limpian el paladar entre bocado y bocado y evitan la fatiga.\n\nUna combinación que funciona casi siempre: un queso semiduro, un salame de campo, almendras tostadas, aceitunas verdes y pan sin sabor propio. Con eso adelante, un Malbec de gama media o un Cabernet Franc andan perfecto.\n\nLo que no funciona: cinco quesos distintos, dos patés y algo dulce, todo junto. El vino desaparece.",
    publishedAt: new Date("2026-07-28"),
  },
  {
    title: "Seis cosas que le hacemos mal al vino en casa",
    slug: "seis-cosas-que-le-hacemos-mal-al-vino-en-casa",
    excerpt: "La temperatura de servicio arruina más botellas que cualquier defecto de elaboración.",
    coverUrl: "/media/scenes/glass-dark.jpg",
    author: "Equipo de selección",
    category: "Consejos",
    content:
      "1. Servir el tinto a temperatura ambiente. «Ambiente» en Argentina en enero son 30 grados. Un tinto a 30 grados es alcohol y nada más. Quince minutos en la heladera antes de servir cambian la experiencia por completo.\n\n2. Servir el blanco helado. A 4 grados no se percibe casi ningún aroma. Sacalo de la heladera diez minutos antes.\n\n3. Guardar las botellas paradas por años. El corcho se seca y deja entrar aire. Acostadas, si van a esperar.\n\n4. Guardarlas arriba de la heladera. Es el peor lugar de la casa: calor y vibración.\n\n5. Llenar la copa hasta el borde. Un tercio es suficiente: el vino necesita aire para expresarse.\n\n6. Descartar una botella abierta al día siguiente. Con el corcho puesto y en la heladera, la mayoría de los tintos aguantan tres o cuatro días. Algunos incluso mejoran.",
    publishedAt: new Date("2026-08-14"),
  },
];

export const BANNERS = [
  {
    message: "Envío gratis en compras desde $100.000",
    position: "top",
    isActive: true,
    sortOrder: 10,
  },
  {
    message: "Socios del Club: 10% OFF permanente en toda la tienda",
    linkUrl: "/club",
    linkLabel: "Conocer el Club",
    position: "top",
    isActive: true,
    sortOrder: 20,
  },
  {
    message: "Entró partida nueva de Valle de Uco. Stock limitado.",
    linkUrl: "/vinos?orden=novedades",
    linkLabel: "Ver novedades",
    position: "shop",
    isActive: true,
    sortOrder: 10,
  },
];

export const NOTIFICATION_TEMPLATES = [
  { event: "order.created", subject: "Recibimos tu pedido #{{orderNumber}}", body: "Hola {{firstName}}, recibimos tu pedido y estamos esperando la confirmación del pago." },
  { event: "order.paid", subject: "Pago confirmado — pedido #{{orderNumber}}", body: "Tu pago fue aprobado. Ya estamos preparando tu pedido." },
  { event: "order.ready", subject: "Tu pedido #{{orderNumber}} está listo", body: "Tu pedido está embalado y listo para despachar." },
  { event: "order.shipped", subject: "Tu pedido #{{orderNumber}} salió del depósito", body: "Despachamos tu pedido con {{carrier}}. Seguimiento: {{trackingNumber}}." },
  { event: "order.delivered", subject: "Tu pedido #{{orderNumber}} fue entregado", body: "Esperamos que lo disfrutes. Contanos qué te pareció." },
  { event: "subscription.created", subject: "Bienvenido al Club", body: "Tu suscripción al {{planName}} está activa. El primer envío sale este mes." },
  { event: "subscription.upcoming_charge", subject: "Tu próximo cobro del Club", body: "El {{nextChargeDate}} vamos a debitar {{amount}} por tu plan {{planName}}." },
  { event: "subscription.payment_failed", subject: "No pudimos procesar tu pago del Club", body: "El cobro de {{amount}} fue rechazado. Podés actualizar tu medio de pago desde Mi Cuenta." },
  { event: "subscription.paused", subject: "Tu suscripción quedó en pausa", body: "Pausamos tu suscripción al {{planName}}. Podés reactivarla cuando quieras." },
  { event: "subscription.cancelled", subject: "Tu suscripción fue cancelada", body: "Cancelamos tu suscripción al {{planName}}. Gracias por haber sido parte." },
];
