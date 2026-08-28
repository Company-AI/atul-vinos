import { z } from "zod";

/**
 * Configuración administrable. Nada de esto se hardcodea en el código:
 * todo se edita desde /admin/configuracion y se guarda en la tabla `Setting`
 * (una fila por grupo, valor JSONB validado con estos esquemas).
 */

export const companySettings = z.object({
  name: z.string().default("Bodega Aurora"),
  legalName: z.string().default("Bodega Aurora S.A."),
  tagline: z.string().default("Vinos de altura"),
  logoUrl: z.string().default("/brand/logo.svg"),
  logoLightUrl: z.string().default("/brand/logo-light.svg"),
  faviconUrl: z.string().default("/favicon.ico"),
  email: z.string().default("hola@bodegaaurora.test"),
  phone: z.string().default("+54 358 400 0000"),
  whatsapp: z.string().default("5493584000000"),
  addressLine: z.string().default("Ruta 36 km 601"),
  city: z.string().default("Río Cuarto"),
  province: z.string().default("Córdoba"),
  postalCode: z.string().default("5800"),
  currency: z.string().default("ARS"),
  taxIncluded: z.boolean().default(true),
  taxPercent: z.number().default(21),
  instagram: z.string().default("https://instagram.com/"),
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
  backgroundUrl: z.string().default("/media/age-gate.jpg"),
  exitUrl: z.string().default("https://www.google.com"),
  rememberDays: z.number().int().default(180),
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
  pickupLabel: z.string().default("Retiro en bodega"),
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
  statementDescriptor: z.string().default("BODEGA AURORA"),
  installmentsEnabled: z.boolean().default(true),
  maxInstallments: z.number().int().default(6),
});

export const seoSettings = z.object({
  defaultTitle: z.string().default("Bodega Aurora — Vinos de altura"),
  titleTemplate: z.string().default("%s · Bodega Aurora"),
  defaultDescription: z
    .string()
    .default(
      "Vinos de altura elaborados con paciencia. Comprá online o sumate al Club y recibí una selección todos los meses.",
    ),
  ogImageUrl: z.string().default("/media/og.jpg"),
  ga4Id: z.string().default(""),
  metaPixelId: z.string().default(""),
  indexable: z.boolean().default(true),
});

export const emailSettings = z.object({
  fromName: z.string().default("Bodega Aurora"),
  fromEmail: z.string().default("hola@bodegaaurora.test"),
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
  company: companySettings.default({}),
  ageGate: ageGateSettings.default({}),
  shipping: shippingSettings.default({}),
  club: clubSettings.default({}),
  payments: paymentSettings.default({}),
  seo: seoSettings.default({}),
  email: emailSettings.default({}),
  legal: legalSettings.default({}),
});

export type Settings = z.infer<typeof settingsSchema>;
export type SettingsGroup = keyof Settings;

export const SETTINGS_GROUPS = Object.keys(settingsSchema.shape) as SettingsGroup[];

export const GROUP_SCHEMAS = {
  company: companySettings,
  ageGate: ageGateSettings,
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
