/**
 * Contenido inicial del sitio. Todo esto es editable desde /admin/contenido:
 * el seed solo deja la web presentable el primer día.
 */

export const CMS_SECTIONS = [
  {
    key: "home.hero",
    page: "home",
    type: "video_hero",
    title: "Hero de la home",
    sortOrder: 10,
    data: {
      eyebrow: "Bodega Aurora · Valle de Uco",
      title: "El vino empieza mucho antes de abrir una botella.",
      subtitle:
        "Cuatro generaciones trabajando la misma tierra a 1.100 metros. Vinos que cuentan de dónde vienen.",
      ctaPrimary: { label: "Descubrí nuestros vinos", href: "/vinos" },
      ctaSecondary: { label: "Conocé el Club", href: "/club" },
      media: {
        imageUrl: "/media/hero-desktop.png",
        imageAlt: "Viñedos al atardecer con la cordillera de fondo",
        videoDesktopUrl: "",
        videoMobileUrl: "",
        posterUrl: "/media/hero-desktop.png",
      },
      overlay: "scrim-bottom",
      align: "center",
      height: "full",
      showLogo: true,
    },
  },
  {
    key: "home.terroir",
    page: "home",
    type: "editorial",
    title: "Nuestra tierra",
    sortOrder: 20,
    data: {
      eyebrow: "Nuestra tierra",
      title: "Suelo pedregoso, noches frías, paciencia.",
      body:
        "Estamos a 1.100 metros, donde la amplitud térmica supera los 18 grados en verano. Eso hace que la uva madure despacio y conserve acidez. El suelo es aluvional, con mucho canto rodado: obliga a la planta a buscar agua en profundidad y a dar menos fruta, pero mejor.\n\nNo riego por goteo en los cuadros viejos. No corregimos acidez. Lo que cambia de una añada a otra queda en la botella.",
      quote: "La tierra no se apura. Nosotros tampoco.",
      cta: { label: "Conocé nuestra historia", href: "/historia" },
      media: {
        imageUrl: "/media/vineyard.png",
        imageAlt: "Hileras de viñedo sobre suelo pedregoso",
        posterUrl: "/media/vineyard.png",
      },
      mediaSide: "right",
      tone: "light",
      layout: "split",
    },
  },
  {
    key: "home.craft",
    page: "home",
    type: "editorial",
    title: "Nuestra forma de hacer vino",
    sortOrder: 30,
    data: {
      eyebrow: "Nuestra forma de hacer vino",
      title: "Intervenir lo menos posible, decidir a tiempo.",
      body:
        "Cosechamos a mano en cajones de 18 kilos y hacemos doble selección: primero de racimo, después de grano. Fermentamos con levaduras autóctonas en piletas de concreto, y usamos la barrica como herramienta, no como maquillaje.\n\nCada parcela se vinifica por separado. El corte se define recién sobre la mesa de cata, probando barrica por barrica.",
      cta: { label: "Ver el proceso", href: "/historia" },
      media: {
        imageUrl: "/media/barrels.png",
        imageAlt: "Barricas de roble en la nave de crianza",
        posterUrl: "/media/barrels.png",
      },
      mediaSide: "left",
      tone: "dark",
      layout: "split",
    },
  },
  {
    key: "home.lines",
    page: "home",
    type: "showcase",
    title: "Nuestras líneas",
    sortOrder: 40,
    data: {
      eyebrow: "Nuestros vinos",
      title: "Cinco líneas, una misma finca.",
      body: "De la mesa de todos los días a las añadas que esperan quince años en la cava.",
      cta: { label: "Ver todos los vinos", href: "/vinos" },
      tone: "linen",
      items: [
        {
          title: "Clásica",
          subtitle: "Fruta franca, para la mesa cotidiana",
          imageUrl: "/media/story-1.png",
          href: "/vinos?linea=clasica",
        },
        {
          title: "Reserva",
          subtitle: "Doce meses de roble francés",
          imageUrl: "/media/story-2.png",
          href: "/vinos?linea=reserva",
        },
        {
          title: "Gran Reserva",
          subtitle: "Solo las mejores hileras",
          imageUrl: "/media/cellar.png",
          href: "/vinos?linea=gran-reserva",
        },
        {
          title: "Ícono",
          subtitle: "Únicamente en añadas excepcionales",
          imageUrl: "/media/story-3.png",
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
      eyebrow: "Selección",
      title: "Para empezar por algún lado.",
      body: "Los vinos que más recomendamos cuando alguien nos pregunta por dónde arrancar.",
      cta: { label: "Ver la tienda completa", href: "/vinos" },
      source: "featured",
      limit: 4,
      tone: "light",
    },
  },
  {
    key: "home.club",
    page: "home",
    type: "club_teaser",
    title: "El Club",
    sortOrder: 60,
    data: {
      eyebrow: "El Club Aurora",
      title: "Una selección diferente llega a tu puerta todos los meses.",
      body:
        "Elegís un plan, nosotros armamos la caja. Vinos que no siempre están en la tienda, fichas de cata escritas por nuestro enólogo y beneficios que se aplican solos cuando comprás.",
      bullets: [
        "Selección curada cada mes, nunca repetida",
        "Envío incluido en los planes Reserva e Ícono",
        "10% de descuento permanente en la tienda",
        "Acceso anticipado a nuevas añadas",
        "Pausá, omití un mes o cancelá cuando quieras",
      ],
      cta: { label: "Quiero ser parte", href: "/club" },
      media: {
        imageUrl: "/media/club-box.png",
        imageAlt: "Caja de vinos del Club Aurora",
        posterUrl: "/media/club-box.png",
      },
    },
  },
  {
    key: "club.hero",
    page: "club",
    type: "video_hero",
    title: "Hero del Club",
    sortOrder: 10,
    data: {
      eyebrow: "Club Aurora",
      title: "Tu próxima botella favorita puede llegar el mes que viene.",
      subtitle:
        "Una suscripción mensual con vinos elegidos por nuestro enólogo, algunos de ellos exclusivos para socios.",
      ctaPrimary: { label: "Ver los planes", href: "#planes" },
      ctaSecondary: { label: "Cómo funciona", href: "#como-funciona" },
      media: {
        imageUrl: "/media/glass.png",
        imageAlt: "Copa de vino servida sobre mesa de madera",
        posterUrl: "/media/glass.png",
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
        { title: "Preparamos tu selección", body: "Cada mes armamos una caja distinta y escribimos las fichas de cata." },
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
      title: "El Club no es solo la caja mensual.",
      body:
        "Los socios tienen 10% de descuento permanente en la tienda, acceso anticipado a las nuevas añadas antes de que salgan a la venta, y vinos que solo se embotellan para el Club.\n\nAdemás, una vez al año invitamos a los socios a la bodega para la cata de barricas.",
      cta: { label: "Ver los planes", href: "#planes" },
      media: {
        imageUrl: "/media/cellar.png",
        imageAlt: "Nave de crianza con barricas",
        posterUrl: "/media/cellar.png",
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
  {
    key: "historia.hero",
    page: "historia",
    type: "video_hero",
    title: "Hero de historia",
    sortOrder: 10,
    data: {
      eyebrow: "Desde 1943",
      title: "Cuatro generaciones, la misma tierra.",
      subtitle: "La historia de la bodega es, en realidad, la historia de una familia y un suelo pedregoso.",
      ctaPrimary: { label: "Ver nuestros vinos", href: "/vinos" },
      ctaSecondary: { label: "", href: "" },
      media: {
        imageUrl: "/media/mountains.png",
        imageAlt: "Cordillera de los Andes al amanecer",
        posterUrl: "/media/mountains.png",
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
      eyebrow: "1943",
      title: "Empezó con dos hectáreas y una decisión discutible.",
      body:
        "Cuando Aurora compró el campo, nadie plantaba viña tan arriba. Decían que el frío no iba a dejar madurar la uva. Tardó once años en darle la razón a los escépticos y doce en demostrar que estaban equivocados.\n\nHoy trabajamos 48 hectáreas y todavía usamos su cuaderno de anotaciones para decidir cuándo empezar la cosecha.",
      media: {
        imageUrl: "/media/harvest.png",
        imageAlt: "Cosecha manual en cajones",
        posterUrl: "/media/harvest.png",
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
    title: "El proceso",
    sortOrder: 30,
    data: {
      eyebrow: "De la planta a la botella",
      title: "Cómo se hace un vino acá.",
      tone: "linen",
      steps: [
        { title: "Poda y conducción", body: "Julio y agosto. Definimos la carga de la planta para todo el año." },
        { title: "Cosecha manual", body: "Febrero a abril, por parcela, en cajones de 18 kilos y de madrugada." },
        { title: "Selección doble", body: "Mesa de racimo y mesa de grano. Se descarta entre el 8% y el 15%." },
        { title: "Fermentación", body: "Piletas de concreto, levaduras autóctonas, pisonado suave." },
        { title: "Crianza", body: "Roble francés y foudres. De 8 a 24 meses según la línea." },
        { title: "Embotellado", body: "Sin filtrar en las líneas altas. Descanso en botella antes de salir." },
      ],
    },
  },
  {
    key: "footer.main",
    page: "global",
    type: "footer",
    title: "Footer",
    sortOrder: 10,
    data: {
      tagline: "Vinos de altura elaborados con paciencia en el Valle de Uco.",
      newsletterTitle: "Novedades de la bodega",
      newsletterBody: "Recibí novedades, nuevas cosechas y beneficios. Sin spam, dos o tres emails por mes.",
      responsibleNote:
        "Beber con moderación. Prohibida la venta de bebidas alcohólicas a menores de 18 años.",
      columns: [
        {
          title: "Tienda",
          links: [
            { label: "Todos los vinos", href: "/vinos" },
            { label: "Packs", href: "/packs" },
            { label: "Novedades", href: "/vinos?orden=novedades" },
            { label: "Club Aurora", href: "/club" },
          ],
        },
        {
          title: "Bodega",
          links: [
            { label: "Nuestra historia", href: "/historia" },
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
  { question: "¿Hacen envíos a todo el país?", answer: "Sí. Despachamos a toda la Argentina. El costo se calcula en el checkout según tu código postal, y a partir de $100.000 el envío es gratuito.", group: "envios", sortOrder: 10 },
  { question: "¿Cuánto tarda en llegar mi pedido?", answer: "Preparamos el pedido en 24 a 48 horas hábiles. La entrega demora entre 2 y 5 días hábiles según la zona. Siempre te enviamos el número de seguimiento por email.", group: "envios", sortOrder: 20 },
  { question: "¿Puedo retirar en la bodega?", answer: "Sí, sin cargo. Elegí «Retiro en bodega» en el checkout y te avisamos cuando esté listo. Estamos en Ruta 36 km 601, de lunes a sábado de 10 a 18.", group: "envios", sortOrder: 30 },
  { question: "¿Qué pasa si una botella llega rota?", answer: "La reponemos sin costo. Escribinos dentro de las 48 horas con una foto del embalaje y de la botella.", group: "envios", sortOrder: 40 },
  { question: "¿Qué medios de pago aceptan?", answer: "Tarjetas de crédito y débito, dinero en cuenta y transferencia a través de Mercado Pago. Las suscripciones del Club se debitan automáticamente todos los meses con la tarjeta que registres.", group: "pagos", sortOrder: 10 },
  { question: "¿Puedo pagar en cuotas?", answer: "Sí, con tarjeta de crédito hay hasta 6 cuotas disponibles según tu banco. Las cuotas se muestran en el checkout antes de confirmar.", group: "pagos", sortOrder: 20 },
  { question: "¿Cómo funciona el Club?", answer: "Elegís un plan y todos los meses se debita automáticamente. Nosotros armamos una selección distinta cada mes y te la enviamos a tu domicilio. No hay contrato ni permanencia mínima.", group: "club", sortOrder: 10 },
  { question: "¿Puedo elegir los vinos de mi caja?", answer: "La selección la arma nuestro enólogo: es parte de la idea del Club, descubrir vinos que no habrías elegido. Si algún varietal no te gusta, avisanos y lo tenemos en cuenta.", group: "club", sortOrder: 20 },
  { question: "¿Puedo pausar o cancelar?", answer: "Cuando quieras, desde Mi Cuenta. Podés pausar la suscripción, omitir el envío de un mes (hasta 5 días antes del cierre) o cancelarla definitivamente sin llamar a nadie.", group: "club", sortOrder: 30 },
  { question: "¿Cuándo se cobra y cuándo llega la caja?", answer: "El cobro se hace el mismo día de cada mes en que te suscribiste. Despachamos entre el 22 y el 28, y la caja llega en los días hábiles siguientes.", group: "club", sortOrder: 40 },
  { question: "¿Puedo cambiar de plan?", answer: "Sí, desde Mi Cuenta. El cambio se aplica en el próximo ciclo: la caja del mes en curso se envía según el plan que tenías.", group: "club", sortOrder: 50 },
  { question: "¿Los vinos del Club se pueden comprar en la tienda?", answer: "Algunos sí y otros son exclusivos para socios. Cuando un vino del Club sale a la tienda, los socios lo ven primero.", group: "club", sortOrder: 60 },
  { question: "¿Venden a menores de 18 años?", answer: "No. La venta de bebidas alcohólicas a menores de 18 años está prohibida por ley. Al ingresar al sitio y al confirmar la compra declarás ser mayor de edad.", group: "general", sortOrder: 10 },
  { question: "¿Se puede visitar la bodega?", answer: "Sí, con reserva previa. Hacemos visitas guiadas con degustación de martes a sábado. Los socios del Club tienen una visita anual sin cargo.", group: "general", sortOrder: 20 },
];

export const POSTS = [
  {
    title: "Por qué la altura cambia todo en un Malbec",
    slug: "por-que-la-altura-cambia-todo-en-un-malbec",
    excerpt: "Mil metros de diferencia pueden significar dos vinos que no parecen hechos con la misma uva.",
    coverUrl: "/media/mountains.png",
    author: "Lucía Ferrer, enóloga",
    category: "Vinos",
    content:
      "La altura no es marketing: es amplitud térmica.\n\nA 1.100 metros, la diferencia entre la temperatura del mediodía y la de la madrugada puede superar los 18 grados. Durante el día la planta acumula azúcar y desarrolla color; durante la noche frena su metabolismo y conserva ácidos. Esa combinación —madurez con acidez— es difícil de conseguir en el llano.\n\nHay un segundo factor: la radiación. A mayor altura, más radiación ultravioleta, y la planta se defiende engrosando el hollejo. Hollejo más grueso significa más antocianos y más taninos. Por eso los Malbec de altura tienen color más profundo y estructura más firme.\n\nEl tercer factor es el suelo. Los cuadros altos suelen ser más pedregosos y más pobres, con menos capacidad de retención de agua. La planta produce menos, pero concentra más.\n\nNada de esto garantiza un buen vino. La altura da la materia prima; lo demás es decidir bien cuándo cosechar.",
    publishedAt: new Date("2026-06-12"),
  },
  {
    title: "Cómo armar una picada que no pelee con el vino",
    slug: "como-armar-una-picada-que-no-pelee-con-el-vino",
    excerpt: "El error más común no es el queso: es la cantidad de sabores compitiendo al mismo tiempo.",
    coverUrl: "/media/story-1.png",
    author: "Equipo Aurora",
    category: "Maridajes",
    content:
      "Una picada bien armada tiene tres decisiones: grasa, sal y acidez.\n\nLa grasa suaviza el tanino. Por eso un queso maduro o un salame estacionado hacen que un tinto joven parezca más amable. Si el vino tiene tanino firme, sumá grasa.\n\nLa sal, en cambio, amplifica el alcohol. Si el vino ya viene con 14,5 grados, una picada muy salada lo va a hacer sentir caliente. Bajá la sal o subí la frescura del vino.\n\nLa acidez es la que ordena. Unos pickles, unas aceitunas o un tomate en aceite limpian el paladar entre bocado y bocado y evitan la fatiga.\n\nUna combinación que funciona casi siempre: un queso semiduro, un salame de campo, almendras tostadas, aceitunas verdes y pan sin sabor propio. Con eso adelante, un Malbec Reserva o un Cabernet Franc andan perfecto.\n\nLo que no funciona: cinco quesos distintos, dos patés y algo dulce, todo junto. El vino desaparece.",
    publishedAt: new Date("2026-07-03"),
  },
  {
    title: "Cosecha 2026: fría, lenta y prometedora",
    slug: "cosecha-2026-fria-lenta-y-prometedora",
    excerpt: "Empezamos catorce días más tarde que el año pasado. Te contamos por qué es una buena noticia.",
    coverUrl: "/media/harvest.png",
    author: "Lucía Ferrer, enóloga",
    category: "Cosechas",
    content:
      "Este año entramos al viñedo el 26 de febrero, catorce días más tarde que en 2025.\n\nEl verano fue fresco y con noches muy frías, especialmente en enero. La maduración se estiró y eso nos dio algo que buscamos siempre: azúcar y acidez al mismo tiempo. Los análisis muestran pH bajos y acidez total alta, con madurez fenólica completa.\n\nEn los blancos entramos primero, con el Sauvignon Blanc de Pedernal. Los aromas están más intensos que el año pasado, con un perfil más cítrico que herbáceo.\n\nEn los tintos, el Malbec del cuadro viejo dio rendimientos bajos: 4.800 kilos por hectárea, casi 20% menos que el promedio. Menos cantidad, más concentración.\n\nSi la crianza acompaña, 2026 va a ser una añada para guardar.",
    publishedAt: new Date("2026-08-04"),
  },
  {
    title: "Seis cosas que le hacemos mal al vino en casa",
    slug: "seis-cosas-que-le-hacemos-mal-al-vino-en-casa",
    excerpt: "La temperatura de servicio arruina más botellas que cualquier defecto de elaboración.",
    coverUrl: "/media/glass.png",
    author: "Equipo Aurora",
    category: "Vinos",
    content:
      "1. Servir el tinto a temperatura ambiente. «Ambiente» en Argentina en enero son 30 grados. Un tinto a 30 grados es alcohol y nada más. Quince minutos en la heladera antes de servir cambian la experiencia por completo.\n\n2. Servir el blanco helado. A 4 grados no se percibe casi ningún aroma. Sacalo de la heladera diez minutos antes.\n\n3. Guardar las botellas paradas por años. El corcho se seca y deja entrar aire. Acostadas, si van a esperar.\n\n4. Guardarlas arriba de la heladera. Es el peor lugar de la casa: calor y vibración.\n\n5. Llenar la copa hasta el borde. Un tercio es suficiente: el vino necesita aire para expresarse.\n\n6. Descartar una botella abierta al día siguiente. Con el corcho puesto y en la heladera, la mayoría de los tintos aguantan tres o cuatro días. Algunos incluso mejoran.",
    publishedAt: new Date("2026-08-20"),
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
    message: "Nueva cosecha 2024: Sauvignon Blanc, Torrontés y Rosé ya disponibles",
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
  { event: "order.shipped", subject: "Tu pedido #{{orderNumber}} salió de la bodega", body: "Despachamos tu pedido con {{carrier}}. Seguimiento: {{trackingNumber}}." },
  { event: "order.delivered", subject: "Tu pedido #{{orderNumber}} fue entregado", body: "Esperamos que lo disfrutes. Contanos qué te pareció." },
  { event: "subscription.created", subject: "Bienvenido al Club Aurora", body: "Tu suscripción al {{planName}} está activa. El primer envío sale este mes." },
  { event: "subscription.upcoming_charge", subject: "Tu próximo cobro del Club", body: "El {{nextChargeDate}} vamos a debitar {{amount}} por tu plan {{planName}}." },
  { event: "subscription.payment_failed", subject: "No pudimos procesar tu pago del Club", body: "El cobro de {{amount}} fue rechazado. Podés actualizar tu medio de pago desde Mi Cuenta." },
  { event: "subscription.paused", subject: "Tu suscripción quedó en pausa", body: "Pausamos tu suscripción al {{planName}}. Podés reactivarla cuando quieras." },
  { event: "subscription.cancelled", subject: "Tu suscripción fue cancelada", body: "Cancelamos tu suscripción al {{planName}}. Gracias por haber sido parte." },
];
