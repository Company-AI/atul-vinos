import { getShowcaseProducts } from "@/domain/catalog/service";
import { getPageSections } from "@/domain/cms/service";
import { parseBlock } from "@/domain/cms/blocks";
import { prisma } from "@/infra/db/prisma";
import {
  MaisonClub,
  MaisonEditorial,
  MaisonFigures,
  MaisonGallery,
  MaisonHero,
  MaisonLines,
  MaisonPlace,
  MaisonProcess,
  MaisonSelection,
  MaisonStatement,
  MaisonWineries,
} from "@/components/variants/maison";

/**
 * Maison cubre todo el material de la home principal. Lo que la distingue no
 * es cuánto muestra sino cómo: composición centrada, medida angosta y una
 * única sección oscura —el video del lugar— que corta la página pálida.
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
  const criterio = parseBlock("editorial", find("home.criterio")?.data);
  const cifras = parseBlock("figures", find("home.cifras")?.data);
  const mendoza = parseBlock("editorial", find("home.mendoza")?.data);
  const lines = parseBlock("showcase", find("home.lines")?.data);
  const proceso = parseBlock("split_sticky", find("home.proceso")?.data);
  const mosaico = parseBlock("gallery", find("home.mosaico")?.data);
  const bodegas = parseBlock("showcase", find("home.bodegas")?.data);
  const club = parseBlock("club_teaser", find("home.club")?.data);

  return (
    <>
      <MaisonHero
        eyebrow={hero.eyebrow}
        title={hero.title}
        accent={hero.titleAccent}
        subtitle={hero.subtitle}
        media={hero.media}
      />

      <MaisonStatement
        text={statement.text}
        accent={statement.textAccent}
        attribution={statement.attribution}
      />

      <MaisonEditorial
        label={criterio.eyebrow}
        title={criterio.title}
        body={criterio.body}
        quote={criterio.quote}
        imageUrl={criterio.media.imageUrl}
        imageAlt={criterio.media.imageAlt}
      />

      <MaisonFigures items={cifras.items} />

      <MaisonPlace
        label={mendoza.eyebrow}
        title={mendoza.title}
        body={mendoza.body}
        media={mendoza.media}
      />

      <MaisonLines label={lines.eyebrow} title={lines.title} body={lines.body} items={lines.items} />

      <MaisonSelection products={products} title="Tres que estamos recomendando." />

      <MaisonProcess label={proceso.eyebrow} title={proceso.title} entries={proceso.entries} />

      <MaisonGallery label={mosaico.eyebrow} title={mosaico.title} items={mosaico.items} />

      <MaisonWineries
        label={bodegas.eyebrow}
        title={bodegas.title}
        body={bodegas.body}
        items={bodegas.items}
      />

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
