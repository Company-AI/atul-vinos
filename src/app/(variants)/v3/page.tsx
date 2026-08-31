import { getShowcaseProducts } from "@/domain/catalog/service";
import { getPageSections } from "@/domain/cms/service";
import { parseBlock } from "@/domain/cms/blocks";
import { prisma } from "@/infra/db/prisma";
import {
  ArqClub,
  ArqEditorial,
  ArqFigures,
  ArqGallery,
  ArqHero,
  ArqLines,
  ArqManifesto,
  ArqPlace,
  ArqSelection,
  ArqStatement,
  ArqWineries,
} from "@/components/variants/arquitectura";

/**
 * Arquitectura cubre el mismo material que Maison con el peso puesto en la
 * grilla y la acumulación: bloques al ras, dos secciones sobre el color
 * profundo del tema y las fotos de líneas en blanco y negro hasta el hover.
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
      <ArqHero
        eyebrow={hero.eyebrow}
        title={hero.title}
        accent={hero.titleAccent}
        subtitle={hero.subtitle}
        media={hero.media}
      />

      <ArqStatement
        text={statement.text}
        accent={statement.textAccent}
        attribution={statement.attribution}
      />

      <ArqEditorial
        label={criterio.eyebrow}
        title={criterio.title}
        body={criterio.body}
        quote={criterio.quote}
        imageUrl={criterio.media.imageUrl}
        imageAlt={criterio.media.imageAlt}
      />

      <ArqManifesto label={proceso.eyebrow} title={proceso.title} entries={proceso.entries} />

      <ArqFigures label={cifras.eyebrow} title={cifras.title} items={cifras.items} />

      <ArqPlace
        label={mendoza.eyebrow}
        title={mendoza.title}
        body={mendoza.body}
        media={mendoza.media}
      />

      <ArqLines label={lines.eyebrow} title={lines.title} body={lines.body} items={lines.items} />

      <ArqSelection products={products} label="La selección" title="Lo que estamos recomendando." />

      <ArqGallery label={mosaico.eyebrow} title={mosaico.title} items={mosaico.items} />

      <ArqWineries
        label={bodegas.eyebrow}
        title={bodegas.title}
        body={bodegas.body}
        items={bodegas.items}
      />

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
