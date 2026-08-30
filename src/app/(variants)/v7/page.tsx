import { getShowcaseProducts } from "@/domain/catalog/service";
import { getPageSections } from "@/domain/cms/service";
import { parseBlock } from "@/domain/cms/blocks";
import { prisma } from "@/infra/db/prisma";
import {
  NocturnoClub,
  NocturnoGallery,
  NocturnoHero,
  NocturnoPlace,
  NocturnoRail,
  NocturnoStatement,
} from "@/components/variants/nocturno";

export const revalidate = 300;

/**
 * Nocturno muestra menos secciones que las otras variantes a propósito: cada
 * una ocupa una pantalla entera y lleva poco texto. La página es larga por el
 * aire, no por la cantidad de material.
 */
export default async function NocturnoPage() {
  const [sections, products, plan] = await Promise.all([
    getPageSections("home"),
    getShowcaseProducts("featured", 6),
    prisma.subscriptionPlan.findFirst({
      where: { isActive: true },
      orderBy: { price: "asc" },
      select: { name: true, price: true },
    }),
  ]);

  const find = (key: string) => sections.find((s) => s.key === key);

  const hero = parseBlock("video_hero", find("home.hero")?.data);
  const statement = parseBlock("statement", find("home.declaracion")?.data);
  const mendoza = parseBlock("editorial", find("home.mendoza")?.data);
  const mosaico = parseBlock("gallery", find("home.mosaico")?.data);
  const club = parseBlock("club_teaser", find("home.club")?.data);

  return (
    <>
      <NocturnoHero
        eyebrow={hero.eyebrow}
        title={hero.title}
        accent={hero.titleAccent}
        subtitle={hero.subtitle}
        media={hero.media}
      />

      <NocturnoStatement
        text={statement.text}
        accent={statement.textAccent}
        attribution={statement.attribution}
      />

      <NocturnoRail products={products} label="La selección" title="Seis que vale la pena abrir." />

      <NocturnoPlace
        label={mendoza.eyebrow}
        title={mendoza.title}
        body={mendoza.body}
        media={mendoza.media}
      />

      <NocturnoGallery label={mosaico.eyebrow} title={mosaico.title} items={mosaico.items} />

      <NocturnoClub
        title={club.title}
        body={club.body}
        bullets={club.bullets}
        media={club.media}
        planName={plan?.name ?? ""}
        planPrice={Number(plan?.price ?? 0)}
      />
    </>
  );
}
