import { z } from "zod";

/**
 * Configuración administrable. Nada de esto se hardcodea en el código:
 * todo se edita desde /admin/configuracion y se guarda en la tabla `Setting`
 * (una fila por grupo, valor JSONB validado con estos esquemas).
 */

export const companySettings = z.object({
  name: z.string().default("Aurora Selección"),
  legalName: z.string().default("Aurora Selección S.R.L."),
  tagline: z.string().default("Distribuidores de vinos de Mendoza"),
  logoUrl: z.string().default("/brand/logo.svg"),
  logoLightUrl: z.string().default("/brand/logo-light.svg"),
  faviconUrl: z.string().default("/favicon.ico"),
  email: z.string().default("hola@auroraseleccion.test"),
  phone: z.string().default("+54 358 400 0000"),
  whatsapp: z.string().default("5493584000000"),
  addressLine: z.string().default("Sarmiento 1240"),
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
  backgroundUrl: z.string().default("/media/scenes/pouring-dark.jpg"),
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
  statementDescriptor: z.string().default("AURORA SELECCION"),
  installmentsEnabled: z.boolean().default(true),
  maxInstallments: z.number().int().default(6),
});

export const seoSettings = z.object({
  defaultTitle: z.string().default("Aurora Selección — Vinos de Mendoza"),
  titleTemplate: z.string().default("%s · Aurora Selección"),
  defaultDescription: z
    .string()
    .default(
      "Distribuimos vinos de bodegas de Mendoza y probamos todo lo que vendemos. Comprá online o sumate al Club y recibí nuestra selección todos los meses.",
    ),
  ogImageUrl: z.string().default("/media/scenes/mendoza-vineyard-rows.jpg"),
  ga4Id: z.string().default(""),
  metaPixelId: z.string().default(""),
  indexable: z.boolean().default(true),
});

export const emailSettings = z.object({
  fromName: z.string().default("Aurora Selección"),
  fromEmail: z.string().default("hola@auroraseleccion.test"),
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
