import { z } from "zod";

/**
 * Bloques de contenido controlados y validados. No es un page builder libre:
 * el admin edita campos conocidos y el frontend renderiza componentes seguros.
 */

const link = z.object({
  label: z.string().default(""),
  href: z.string().default("#"),
});

const media = z.object({
  imageUrl: z.string().default(""),
  imageAlt: z.string().default(""),
  videoDesktopUrl: z.string().default(""),
  videoMobileUrl: z.string().default(""),
  posterUrl: z.string().default(""),
});

export const videoHeroBlock = z.object({
  eyebrow: z.string().default(""),
  title: z.string().default(""),
  /** Segunda línea del titular, en itálica. Se compone debajo de `title`. */
  titleAccent: z.string().default(""),
  subtitle: z.string().default(""),
  ctaPrimary: link.prefault({}),
  ctaSecondary: link.prefault({}),
  media: media.prefault({}),
  overlay: z.enum(["scrim-bottom", "scrim-full", "scrim-side", "none"]).default("scrim-bottom"),
  align: z.enum(["left", "center"]).default("center"),
  height: z.enum(["full", "tall", "medium"]).default("full"),
  showLogo: z.boolean().default(true),
  /** display-2xl para el hero de portada; display-xl para heroes interiores. */
  scale: z.enum(["hero", "page"]).default("page"),
  scrollCue: z.string().default(""),
});

export const editorialBlock = z.object({
  eyebrow: z.string().default(""),
  title: z.string().default(""),
  body: z.string().default(""),
  quote: z.string().default(""),
  cta: link.prefault({}),
  media: media.prefault({}),
  mediaSide: z.enum(["left", "right"]).default("right"),
  tone: z.enum(["light", "linen", "dark"]).default("light"),
  layout: z.enum(["split", "fullBleed", "centered"]).default("split"),
});

export const showcaseBlock = z.object({
  eyebrow: z.string().default(""),
  title: z.string().default(""),
  body: z.string().default(""),
  cta: link.prefault({}),
  items: z
    .array(
      z.object({
        title: z.string().default(""),
        subtitle: z.string().default(""),
        imageUrl: z.string().default(""),
        href: z.string().default("/vinos"),
      }),
    )
    .default([]),
  tone: z.enum(["light", "linen", "dark"]).default("linen"),
});

export const clubTeaserBlock = z.object({
  eyebrow: z.string().default(""),
  title: z.string().default(""),
  body: z.string().default(""),
  bullets: z.array(z.string()).default([]),
  cta: link.prefault({}),
  media: media.prefault({}),
});

export const stepsBlock = z.object({
  eyebrow: z.string().default(""),
  title: z.string().default(""),
  body: z.string().default(""),
  steps: z
    .array(z.object({ title: z.string(), body: z.string().default("") }))
    .default([]),
  tone: z.enum(["light", "linen", "dark"]).default("light"),
});

export const featuredWinesBlock = z.object({
  eyebrow: z.string().default(""),
  title: z.string().default(""),
  body: z.string().default(""),
  cta: link.prefault({}),
  /** Qué mostrar: destacados, novedades, más vendidos o una línea concreta. */
  source: z.enum(["featured", "new", "bestSellers", "line"]).default("featured"),
  lineSlug: z.string().default(""),
  limit: z.number().int().min(2).max(12).default(4),
  tone: z.enum(["light", "linen", "dark"]).default("light"),
});

export const faqBlock = z.object({
  eyebrow: z.string().default(""),
  title: z.string().default(""),
  group: z.string().default("general"),
});

export const footerBlock = z.object({
  tagline: z.string().default(""),
  columns: z
    .array(z.object({ title: z.string(), links: z.array(link).default([]) }))
    .default([]),
  newsletterTitle: z.string().default(""),
  newsletterBody: z.string().default(""),
  responsibleNote: z.string().default(""),
});

export const richTextBlock = z.object({
  eyebrow: z.string().default(""),
  title: z.string().default(""),
  body: z.string().default(""),
  tone: z.enum(["light", "linen", "dark"]).default("light"),
});

export const statementBlock = z.object({
  eyebrow: z.string().default(""),
  /** Declaración corta. Se compone grande; conviene que no pase de dos líneas. */
  text: z.string().default(""),
  /** Se muestra en itálica al final del texto. */
  textAccent: z.string().default(""),
  attribution: z.string().default(""),
  cta: link.prefault({}),
  /** Foto de fondo tenue. Opcional: sin ella el bloque es puramente tipográfico. */
  backgroundUrl: z.string().default(""),
  tone: z.enum(["light", "linen", "dark"]).default("dark"),
});

export const figuresBlock = z.object({
  eyebrow: z.string().default(""),
  title: z.string().default(""),
  items: z
    .array(
      z.object({
        value: z.string().default(""),
        label: z.string().default(""),
        detail: z.string().default(""),
      }),
    )
    .default([]),
  tone: z.enum(["light", "linen", "dark"]).default("linen"),
});

export const splitStickyBlock = z.object({
  eyebrow: z.string().default(""),
  title: z.string().default(""),
  media: media.prefault({}),
  mediaSide: z.enum(["left", "right"]).default("left"),
  /** Cada entrada se lee mientras la foto queda fija al costado. */
  entries: z
    .array(
      z.object({
        title: z.string().default(""),
        body: z.string().default(""),
      }),
    )
    .default([]),
  cta: link.prefault({}),
  tone: z.enum(["light", "linen", "dark"]).default("light"),
});

export const galleryBlock = z.object({
  eyebrow: z.string().default(""),
  title: z.string().default(""),
  body: z.string().default(""),
  items: z
    .array(
      z.object({
        imageUrl: z.string().default(""),
        imageAlt: z.string().default(""),
        caption: z.string().default(""),
        /** "tall" ocupa dos filas; el mosaico deja de ser una grilla plana. */
        size: z.enum(["normal", "tall", "wide"]).default("normal"),
      }),
    )
    .default([]),
  tone: z.enum(["light", "linen", "dark"]).default("light"),
});

export const BLOCK_SCHEMAS = {
  video_hero: videoHeroBlock,
  editorial: editorialBlock,
  showcase: showcaseBlock,
  club_teaser: clubTeaserBlock,
  steps: stepsBlock,
  featured_wines: featuredWinesBlock,
  faq: faqBlock,
  footer: footerBlock,
  rich_text: richTextBlock,
  statement: statementBlock,
  figures: figuresBlock,
  split_sticky: splitStickyBlock,
  gallery: galleryBlock,
} as const;

export type BlockType = keyof typeof BLOCK_SCHEMAS;

export const BLOCK_LABELS: Record<BlockType, string> = {
  video_hero: "Hero con video",
  editorial: "Bloque editorial",
  showcase: "Colecciones / líneas",
  club_teaser: "Invitación al Club",
  steps: "Pasos numerados",
  featured_wines: "Vinos destacados",
  faq: "Preguntas frecuentes",
  footer: "Footer",
  rich_text: "Texto",
  statement: "Declaración tipográfica",
  figures: "Cifras clave",
  split_sticky: "Foto fija con texto",
  gallery: "Mosaico de fotos",
};

export type BlockData<T extends BlockType> = z.infer<(typeof BLOCK_SCHEMAS)[T]>;

/** Parsea el JSONB guardado aplicando defaults; nunca tira si falta un campo. */
export function parseBlock<T extends BlockType>(type: T, data: unknown): BlockData<T> {
  const schema = BLOCK_SCHEMAS[type];
  const result = schema.safeParse(data ?? {});
  return (result.success ? result.data : schema.parse({})) as BlockData<T>;
}
