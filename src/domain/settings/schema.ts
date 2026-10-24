import { z } from "zod";

/**
 * Configuración administrable. Nada de esto se hardcodea en el código:
 * todo se edita desde /admin/configuracion y se guarda en la tabla `Setting`
 * (una fila por grupo, valor JSONB validado con estos esquemas).
 */

export const companySettings = z.object({
  name: z.string().default("Atul"),
  /*
    Lo que figura en los documentos: términos, remito y etiqueta. No es una
    S.R.L. —lo aclaró el cliente—, así que hasta que haya una razón social
    registrada va el nombre a secas. Se edita en Configuración.
  */
  legalName: z.string().default("Atul Vinos"),
  tagline: z.string().default("Vinos de todo el país"),
  logoUrl: z.string().default("/brand/logotipo-azul.png"),
  logoLightUrl: z.string().default("/brand/logotipo-crema.png"),
  /**
   * Isotipo: la A cuyo travesaño es una copa, sin la palabra. Sirve donde el
   * logotipo completo sería redundante o no entra —el hero debajo de la
   * cabecera, un formato cuadrado, un avatar—.
   */
  isotipoUrl: z.string().default("/brand/isotipo-azul.png"),
  isotipoLightUrl: z.string().default("/brand/isotipo-crema.png"),
  /**
   * Isologo: el sello redondo con la A, la copa y la palabra adentro. Es el
   * que va en la cabecera del sitio. Necesita bastante altura para que el
   * texto de adentro se lea: por debajo de 60px "ATUL" deja de distinguirse.
   */
  isologoUrl: z.string().default("/brand/isologo-azul.png"),
  isologoLightUrl: z.string().default("/brand/isologo-crema.png"),
  faviconUrl: z.string().default("/favicon.ico"),
  email: z.string().default("atul.vinos@gmail.com"),
  /*
    El mismo número que el WhatsApp, escrito para leer. Son los dos únicos
    canales de contacto que se publican: no hay local a la calle, así que
    anunciar una dirección sólo haría que alguien se tome el viaje al pedo.
  */
  phone: z.string().default("+54 9 3586 01-9491"),
  whatsapp: z.string().default("5493586019491"),
  /*
    Domicilio del remitente. NO se publica en ningún lado del sitio: existe
    sólo para lo que sale impreso con el paquete —la etiqueta del correo y
    el remito—, donde un bulto sin remitente no se puede despachar ni
    devolver. Se edita desde Configuración y puede ser el depósito.
  */
  addressLine: z.string().default("Sarmiento 1240"),
  city: z.string().default("Río Cuarto"),
  province: z.string().default("Córdoba"),
  postalCode: z.string().default("5800"),
  currency: z.string().default("ARS"),
  taxIncluded: z.boolean().default(true),
  taxPercent: z.number().default(21),
  instagram: z.string().default("https://www.instagram.com/atul.vinos/"),
  facebook: z.string().default(""),
  youtube: z.string().default(""),
  requireDocumentAtCheckout: z.boolean().default(false),
});

export const ageGateSettings = z.object({
  enabled: z.boolean().default(true),
  minAge: z.number().int().min(0).max(30).default(18),
  title: z.string().default("Bienvenido"),
  message: z
    .string()
    .default("Para ingresar necesitamos confirmar que sos mayor de edad."),
  confirmLabel: z.string().default("Soy mayor de 18 años"),
  exitLabel: z.string().default("Salir"),
  legalNote: z
    .string()
    .default("Beber con moderación. Prohibida su venta a menores de 18 años."),
  imageUrl: z.string().default(""),
  backgroundUrl: z.string().default("/media/scenes/pouring-dark.jpg"),
  exitUrl: z.string().default("https://www.google.com"),
  /*
    Un día. Preguntar una vez por semestre convierte el gate en un trámite
    que se hizo una vez y nunca más: el navegador de la casa queda abierto
    y cualquiera que lo agarre entra sin que nadie le pregunte nada.
  */
  rememberDays: z.number().int().default(1),
});

/*
  Ventana que aparece una sola vez, cuando el visitante confirma la edad. Es un
  anzuelo de primera compra, así que el texto y el cupón se editan desde el
  admin: cambian por campaña y no deberían necesitar un deploy.
*/
export const promoSettings = z.object({
  enabled: z.boolean().default(true),
  title: z.string().default("10% en tu primera compra"),
  message: z
    .string()
    .default("Usá este cupón al finalizar la compra y llevate un 10% de descuento."),
  /*
    El código que se revela después de dejar los datos. Tiene que existir en
    Cupones: acá sólo se nombra. Si el cupón no está o está vencido, la
    ventana entrega un código que el checkout después rechaza.
  */
  couponCode: z.string().default("BIENVENIDOATUL10"),
  ctaLabel: z.string().default("Ver los vinos"),
  ctaHref: z.string().default("/vinos"),
  dismissLabel: z.string().default("Ahora no"),
  imageUrl: z.string().default("/media/scenes/toast.jpg"),
  /** Condiciones al pie. Se pide un dato personal: tiene que estar a la vista. */
  legalNote: z
    .string()
    .default(
      "Válido en tu primera compra, un uso por persona. Necesitás ser mayor de 18 años. Te vamos a escribir cuando haya novedades.",
    ),
});

export const shippingSettings = z.object({
  defaultProvider: z.string().default("mock"),
  freeShippingFrom: z.number().nullable().default(100000),
  originPostalCode: z.string().default("5800"),
  originCity: z.string().default("Río Cuarto"),
  originProvince: z.string().default("Córdoba"),
  bottleWeightGrams: z.number().default(1300),
  packagingWeightGrams: z.number().default(400),
  labelFormatDefault: z.enum(["A4", "THERMAL_100X150"]).default("THERMAL_100X150"),
  pickupEnabled: z.boolean().default(true),
  pickupLabel: z.string().default("Retiro en depósito"),
});

export const clubSettings = z.object({
  /*
    Apagado. El Club no se lanza todavía: sin stock profundo por etiqueta,
    prometer una caja distinta cada mes se rompe al segundo mes.

    Apagarlo y no borrarlo es a propósito. El motor de suscripciones, los
    planes y las cajas quedan enteros; esto sólo decide si el visitante ve
    que existe. Encenderlo acá lo devuelve al pie, al menú y a /club.
  */
  enabled: z.boolean().default(false),
  allowPause: z.boolean().default(true),
  allowCancel: z.boolean().default(true),
  allowPlanChange: z.boolean().default(true),
  allowSkip: z.boolean().default(true),
  /** Se puede omitir un mes hasta N días antes del cierre. */
  skipCutoffDays: z.number().int().default(5),
  /** Día del mes en que se arma y cierra el box. */
  boxCutoffDay: z.number().int().min(1).max(28).default(20),
  showNextBoxToMembers: z.boolean().default(true),
  reserveStockForClub: z.boolean().default(true),
  paymentRetryDays: z.number().int().default(3),
});

export const paymentSettings = z.object({
  provider: z.enum(["mercadopago"]).default("mercadopago"),
  sandbox: z.boolean().default(true),
  publicKey: z.string().default(""),
  statementDescriptor: z.string().default("ATUL VINOS"),
  installmentsEnabled: z.boolean().default(true),
  maxInstallments: z.number().int().default(6),
  /*
    Lo que se promete en la vidriera, que no es lo mismo que lo que el
    proveedor permite: maxInstallments es hasta en cuántas se puede pagar, y
    esto es hasta cuántas no tienen recargo. Se muestra bajo cada precio.
    En cero, no se muestra nada.
  */
  interestFreeInstallments: z.number().int().min(0).max(24).default(3),
  /*
    Descuento por pagar con transferencia. En cero no se muestra: anunciar un
    precio más bajo que nadie puede pagar es peor que no anunciarlo.
  */
  transferDiscountPercent: z.number().min(0).max(90).default(10),

  /*
    Descuento por llevarse varias botellas. Cuenta BOTELLAS y no productos: un
    box de seis son seis botellas. En cero no se aplica ni se anuncia.

    Se suma al de transferencia, cada uno sobre lo que quedó del anterior: con
    10 y 20 el total es 28% y no 30%.
  */
  quantityDiscountPercent: z.number().min(0).max(90).default(0),
  quantityDiscountMinBottles: z.number().int().min(0).max(120).default(6),
  /*
    Encendido, sólo corre en la primera compra de esa persona. Apagado —como
    lo pidió el cliente— corre siempre: quien se lleva seis botellas tiene el
    descuento, sea su primera compra o la décima.
  */
  quantityDiscountFirstPurchaseOnly: z.boolean().default(false),

  /*
    Pago por transferencia. Apagado por defecto: mientras no estén los datos
    de la cuenta, ofrecerlo sería mandar a alguien a transferir sin decirle
    a dónde. La pantalla de pago sólo lo muestra si está encendido y hay al
    menos un alias o un CBU cargado.
  */
  transferEnabled: z.boolean().default(false),
  transferHolder: z.string().default(""),
  transferBank: z.string().default(""),
  transferAlias: z.string().default(""),
  transferCbu: z.string().default(""),
  transferCuit: z.string().default(""),
});

export const seoSettings = z.object({
  defaultTitle: z.string().default("Atul — Vinos de Argentina"),
  titleTemplate: z.string().default("%s · Atul"),
  defaultDescription: z
    .string()
    .default(
      "Distribuimos vinos de bodegas de todo el país, de Jujuy a la Patagonia, y probamos todo lo que vendemos. Comprá online o sumate al Club y recibí nuestra selección todos los meses.",
    ),
  ogImageUrl: z.string().default("/media/scenes/mendoza-vineyard-rows.jpg"),
  ga4Id: z.string().default(""),
  metaPixelId: z.string().default(""),
  indexable: z.boolean().default(true),
});

export const emailSettings = z.object({
  fromName: z.string().default("Atul"),
  fromEmail: z.string().default("atul.vinos@gmail.com"),
  replyTo: z.string().default(""),
  footerText: z
    .string()
    .default("Beber con moderación. Prohibida su venta a menores de 18 años."),
  notifyAdminEmails: z.array(z.string()).default([]),
});

export const legalSettings = z.object({
  responsibleDrinking: z
    .string()
    .default("Beber con moderación. El consumo de alcohol es responsabilidad de cada persona."),
  minorsNotice: z.string().default("Prohibida la venta de bebidas alcohólicas a menores de 18 años."),
  termsUrl: z.string().default("/terminos"),
  privacyUrl: z.string().default("/privacidad"),
  returnsUrl: z.string().default("/cambios-y-devoluciones"),
});

export const settingsSchema = z.object({
  company: companySettings.prefault({}),
  ageGate: ageGateSettings.prefault({}),
  promo: promoSettings.prefault({}),
  shipping: shippingSettings.prefault({}),
  club: clubSettings.prefault({}),
  payments: paymentSettings.prefault({}),
  seo: seoSettings.prefault({}),
  email: emailSettings.prefault({}),
  legal: legalSettings.prefault({}),
});

export type Settings = z.infer<typeof settingsSchema>;
export type SettingsGroup = keyof Settings;

export const SETTINGS_GROUPS = Object.keys(settingsSchema.shape) as SettingsGroup[];

export const GROUP_SCHEMAS = {
  company: companySettings,
  ageGate: ageGateSettings,
  promo: promoSettings,
  shipping: shippingSettings,
  club: clubSettings,
  payments: paymentSettings,
  seo: seoSettings,
  email: emailSettings,
  legal: legalSettings,
} as const;

export const GROUP_LABELS: Record<SettingsGroup, string> = {
  company: "Empresa",
  ageGate: "Age gate",
  promo: "Ventana promocional",
  shipping: "Envíos",
  club: "Club",
  payments: "Pagos",
  seo: "SEO y analytics",
  email: "Email",
  legal: "Legales",
};

/** Defaults completos, sin tocar la base. */
export function defaultSettings(): Settings {
  return settingsSchema.parse({});
}
