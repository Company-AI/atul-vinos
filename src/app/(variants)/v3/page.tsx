import { getShowcaseProducts } from "@/domain/catalog/service";
import { getPageSections } from "@/domain/cms/service";
import { parseBlock } from "@/domain/cms/blocks";
import { prisma } from "@/infra/db/prisma";
import {
  ArqClub,
  ArqFigures,
  ArqHero,
  ArqManifesto,
  ArqSelection,
} from "@/components/variants/arquitectura";

export const revalidate = 300;

/**
 * Arquitectura muestra bastante más contenido que Maison sobre exactamente el
 * mismo material del CMS: acá el peso lo da la grilla y la acumulación, no el
 * aire. El largo distinto entre variantes es parte de cada lenguaje.
 */
export default async function ArquitecturaPage() {
  const [sections, products, plan] = await Promise.all([
    getPageSections("home"),
    getShowcaseProducts("featured", 4),
    prisma.subscriptionPlan.findFirst({
      where: { isActive: true },
      orderBy: { price: "asc" },
      select: { name: true, price: true },
    }),
  ]);

  const find = (key: string) => sections.find((s) => s.key === key);

  const hero = parseBlock("video_hero", find("home.hero")?.data);
  const proceso = parseBlock("split_sticky", find("home.proceso")?.data);
  const cifras = parseBlock("figures", find("home.cifras")?.data);
  const club = parseBlock("club_teaser", find("home.club")?.data);

  return (
    <>
      <ArqHero
        eyebrow={hero.eyebrow}
        title={hero.title}
        accent={hero.titleAccent}
        subtitle={hero.subtitle}
        imageUrl={hero.media.imageUrl || "/media/scenes/mendoza-vineyard-rows.jpg"}
        imageAlt={hero.media.imageAlt}
      />

      <ArqManifesto label={proceso.eyebrow} title={proceso.title} entries={proceso.entries} />

      <ArqFigures label={cifras.eyebrow} title={cifras.title} items={cifras.items} />

      <ArqSelection products={products} label="La selección" title="Lo que estamos recomendando." />

      <ArqClub
        title={club.title}
        body={club.body}
        bullets={club.bullets}
        imageUrl={club.media.imageUrl || "/media/scenes/pouring.jpg"}
        planName={plan?.name ?? ""}
        planPrice={Number(plan?.price ?? 0)}
      />
    </>
  );
}
