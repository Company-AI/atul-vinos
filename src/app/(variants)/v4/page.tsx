import { getShowcaseProducts } from "@/domain/catalog/service";
import { getPageSections } from "@/domain/cms/service";
import { parseBlock } from "@/domain/cms/blocks";
import { prisma } from "@/infra/db/prisma";
import {
  TerroirClub,
  TerroirFigures,
  TerroirHero,
  TerroirSelection,
} from "@/components/variants/terroir";

export const revalidate = 300;

/**
 * Terroir anota el hero con datos del catálogo real —regiones, bodegas y
 * etiquetas efectivamente cargadas—, no con cifras decorativas. Si el catálogo
 * cambia, la anotación cambia con él.
 */
export default async function TerroirPage() {
  const [sections, products, plan, regions, wineries, labels] = await Promise.all([
    getPageSections("home"),
    getShowcaseProducts("featured", 4),
    prisma.subscriptionPlan.findFirst({
      where: { isActive: true },
      orderBy: { price: "asc" },
      select: { name: true, price: true },
    }),
    prisma.region.findMany({ select: { name: true }, orderBy: { name: "asc" } }),
    prisma.winery.count(),
    prisma.product.count({ where: { kind: "WINE", status: "ACTIVE" } }),
  ]);

  const find = (key: string) => sections.find((s) => s.key === key);

  const hero = parseBlock("video_hero", find("home.hero")?.data);
  const cifras = parseBlock("figures", find("home.cifras")?.data);
  const club = parseBlock("club_teaser", find("home.club")?.data);

  const annotations = [
    { k: "Provincia", v: "Mendoza, Argentina" },
    { k: "Zonas", v: regions.map((r) => r.name).join(" · ") || "—" },
    { k: "Bodegas", v: String(wineries) },
    { k: "Etiquetas", v: String(labels) },
  ];

  return (
    <>
      <TerroirHero
        eyebrow={hero.eyebrow}
        title={hero.title}
        accent={hero.titleAccent}
        subtitle={hero.subtitle}
        imageUrl={hero.media.imageUrl || "/media/scenes/mendoza-vineyard-andes.jpg"}
        imageAlt={hero.media.imageAlt}
        annotations={annotations}
      />

      <TerroirFigures label={cifras.eyebrow} title={cifras.title} items={cifras.items} />

      <TerroirSelection products={products} label="La selección" title="Fichas de campo." />

      <TerroirClub
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
