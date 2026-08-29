import { getShowcaseProducts } from "@/domain/catalog/service";
import { getPageSections } from "@/domain/cms/service";
import { parseBlock } from "@/domain/cms/blocks";
import { prisma } from "@/infra/db/prisma";
import {
  MaisonClub,
  MaisonHero,
  MaisonSelection,
  MaisonStatement,
} from "@/components/variants/maison";

export const revalidate = 300;

/**
 * Maison lee el mismo contenido del CMS que la home principal: la comparación
 * entre variantes tiene que ser sobre el lenguaje visual, no sobre los textos.
 * Lo que cambia es cuánto de ese contenido se muestra —acá, deliberadamente
 * poco— y con cuánto aire.
 */
export default async function MaisonPage() {
  const [sections, products, plan] = await Promise.all([
    getPageSections("home"),
    getShowcaseProducts("featured", 3),
    prisma.subscriptionPlan.findFirst({
      where: { isActive: true },
      orderBy: { price: "asc" },
      select: { name: true, price: true },
    }),
  ]);

  const find = (key: string) => sections.find((s) => s.key === key);

  const hero = parseBlock("video_hero", find("home.hero")?.data);
  const statement = parseBlock("statement", find("home.declaracion")?.data);
  const club = parseBlock("club_teaser", find("home.club")?.data);

  return (
    <>
      <MaisonHero
        eyebrow={hero.eyebrow}
        title={hero.title}
        accent={hero.titleAccent}
        subtitle={hero.subtitle}
        imageUrl={hero.media.imageUrl || "/media/scenes/mendoza-vineyard-andes.jpg"}
        imageAlt={hero.media.imageAlt}
      />

      <MaisonStatement
        text={statement.text}
        accent={statement.textAccent}
        attribution={statement.attribution}
      />

      <MaisonSelection products={products} title="Tres que estamos recomendando." />

      <MaisonClub
        title={club.title}
        body={club.body}
        imageUrl={club.media.imageUrl || "/media/scenes/pouring.jpg"}
        planName={plan?.name ?? ""}
        planPrice={Number(plan?.price ?? 0)}
      />
    </>
  );
}
