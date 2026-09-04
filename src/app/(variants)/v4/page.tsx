import { getShowcaseProducts } from "@/domain/catalog/service";
import { getPageSections } from "@/domain/cms/service";
import { parseBlock } from "@/domain/cms/blocks";
import { prisma } from "@/infra/db/prisma";
import { IS_DEMO } from "@/infra/demo/mode";
import { demoTaxonomy } from "@/infra/demo/catalog";
import { getEntryPlan } from "@/domain/subscriptions/plans";
import {
  TerroirClub,
  TerroirEditorial,
  TerroirFigures,
  TerroirHero,
  TerroirLines,
  TerroirPlace,
  TerroirPlates,
  TerroirProtocol,
  TerroirSelection,
  TerroirStatement,
  TerroirWineries,
} from "@/components/variants/terroir";

/**
 * Terroir cubre el mismo material con las anotaciones de campo como hilo:
 * cada bloque lleva su dato al margen en monoespaciada. Todas las anotaciones
 * salen de la base —regiones, bodegas, etiquetas, uvas—; ninguna es inventada.
 */
export default async function TerroirPage() {
  const [sections, products, plan, regions, wineries, labels] = await Promise.all([
    getPageSections("home"),
    getShowcaseProducts("featured", 4),
    getEntryPlan(),
    IS_DEMO
      ? demoTaxonomy().regions
      : prisma.region.findMany({ select: { name: true }, orderBy: { name: "asc" } }),
    IS_DEMO ? demoTaxonomy().wineryCount : prisma.winery.count(),
    IS_DEMO
      ? demoTaxonomy().labelCount
      : prisma.product.count({ where: { kind: "WINE", status: "ACTIVE" } }),
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

  const annotations = [
    { k: "País", v: "Argentina" },
    { k: "Alcance", v: "De Jujuy a la Patagonia" },
    { k: "Regiones en catálogo", v: regions.map((r) => r.name).join(" · ") || "—" },
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
        media={hero.media}
        annotations={annotations}
      />

      <TerroirStatement
        text={statement.text}
        accent={statement.textAccent}
        attribution={statement.attribution}
      />

      <TerroirEditorial
        label={criterio.eyebrow}
        title={criterio.title}
        body={criterio.body}
        quote={criterio.quote}
        imageUrl={criterio.media.imageUrl}
        imageAlt={criterio.media.imageAlt}
      />

      <TerroirFigures label={cifras.eyebrow} title={cifras.title} items={cifras.items} />

      <TerroirPlace
        label={mendoza.eyebrow}
        title={mendoza.title}
        body={mendoza.body}
        media={mendoza.media}
        annotations={annotations.slice(0, 2)}
      />

      <TerroirLines label={lines.eyebrow} title={lines.title} body={lines.body} items={lines.items} />

      <TerroirSelection products={products} label="La selección" title="Fichas de campo." />

      <TerroirProtocol label={proceso.eyebrow} title={proceso.title} entries={proceso.entries} />

      <TerroirPlates
        label={mosaico.eyebrow}
        title={mosaico.title}
        body={mosaico.body}
        items={mosaico.items}
      />

      <TerroirWineries
        label={bodegas.eyebrow}
        title={bodegas.title}
        body={bodegas.body}
        items={bodegas.items}
      />

      <TerroirClub
        title={club.title}
        body={club.body}
        bullets={club.bullets}
        imageUrl={club.media.imageUrl || "/media/scenes/pouring.jpg"}
        planName={plan?.name ?? ""}
        planPrice={plan?.price ?? 0}
      />
    </>
  );
}
