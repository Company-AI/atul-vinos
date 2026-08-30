import { getShowcaseProducts } from "@/domain/catalog/service";
import { getPageSections } from "@/domain/cms/service";
import { parseBlock } from "@/domain/cms/blocks";
import { prisma } from "@/infra/db/prisma";
import {
  CasaClub,
  CasaEditorial,
  CasaGallery,
  CasaHero,
  CasaLines,
  CasaShopfront,
  CasaWineries,
} from "@/components/variants/casa";

export const revalidate = 300;

/**
 * Casa pone la venta arriba: la primera sección después del hero ya son
 * botellas con precio, y recién después se cuenta el criterio y el lugar.
 * Es el orden inverso al de las otras tres variantes.
 */
export default async function CasaPage() {
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
  const criterio = parseBlock("editorial", find("home.criterio")?.data);
  const mendoza = parseBlock("editorial", find("home.mendoza")?.data);
  const lines = parseBlock("showcase", find("home.lines")?.data);
  const mosaico = parseBlock("gallery", find("home.mosaico")?.data);
  const bodegas = parseBlock("showcase", find("home.bodegas")?.data);
  const club = parseBlock("club_teaser", find("home.club")?.data);

  return (
    <>
      <CasaHero
        eyebrow={hero.eyebrow}
        title={hero.title}
        accent={hero.titleAccent}
        subtitle={hero.subtitle}
        imageUrl={hero.media.imageUrl || "/media/scenes/mendoza-vineyard-house.jpg"}
        imageAlt={hero.media.imageAlt}
      />

      <CasaShopfront products={products} label="La tienda" title="Lo que estamos recomendando." />

      <CasaEditorial
        label={criterio.eyebrow}
        title={criterio.title}
        body={criterio.body}
        quote={criterio.quote}
        imageUrl={criterio.media.imageUrl}
        imageAlt={criterio.media.imageAlt}
        mediaSide="left"
      />

      <CasaLines label={lines.eyebrow} title={lines.title} body={lines.body} items={lines.items} />

      <CasaEditorial
        label={mendoza.eyebrow}
        title={mendoza.title}
        body={mendoza.body}
        quote=""
        imageUrl={mendoza.media.imageUrl}
        imageAlt={mendoza.media.imageAlt}
        mediaSide="right"
      />

      <CasaWineries
        label={bodegas.eyebrow}
        title={bodegas.title}
        body={bodegas.body}
        items={bodegas.items}
      />

      <CasaGallery label={mosaico.eyebrow} title={mosaico.title} items={mosaico.items} />

      <CasaClub
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
