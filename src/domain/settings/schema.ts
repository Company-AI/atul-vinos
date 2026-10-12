import { z } from "zod";

/**
 * Configuración administrable. Nada de esto se hardcodea en el código:
 * todo se edita desde /admin/configuracion y se guarda en la tabla `Setting`
 * (una fila por grupo, valor JSONB validado con estos esquemas).
 */

export const companySettings = z.object({
  name: z.string().default("Atul"),
  legalName: z.string().default("Atul S.R.L."),
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
  phone: z.string().default("+54 358 400 0000"),
  whatsapp: z.string().default("5493586019491"),
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
  rememberDays: z.number().int().default(180),
});

/*
  Ventana que aparece una sola vez, cuando el visitante confirma la edad. Es un
  anzuelo de primera compra, así que el texto y el cupón se editan desde el
  admin: cambian por campaña y no deberían necesitar un deploy.
*/
export const promoSettings = z.object({
  enabled: z.boolean().default(false),
  title: z.string().default("10% en tu primera compra"),
  message: z
    .string()
    .default("Usá este cupón al finalizar la compra y llevate un 10% de descuento."),
  /** El código que se revela después de dejar los datos. */
  couponCode: z.string().default(""),
  ctaLabel: z.string().default("Ver los vinos"),
  ctaHref: z.string().default("/vinos"),
  dismissLabel: z.string().default("Ahora no"),
  imageUrl: z.string().default(""),
  /** Condiciones al pie. Se pide un dato personal: tiene que estar a la vista. */
  legalNote: z
    .string()
    .default("Válido en tu primera compra, un uso por persona. Te vamos a escribir cuando haya novedades."),
  /** Días que se recuerda el cierre antes de volver a ofrecerlo. */
  rememberDays: z.number().int().min(1).max(365).default(30),
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
