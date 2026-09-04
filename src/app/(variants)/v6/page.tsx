import { getShowcaseProducts } from "@/domain/catalog/service";
import { getPageSections } from "@/domain/cms/service";
import { parseBlock } from "@/domain/cms/blocks";
import { getEntryPlan } from "@/domain/subscriptions/plans";
import {
  CasaClub,
  CasaEditorial,
  CasaFigures,
  CasaGallery,
  CasaHero,
  CasaLines,
  CasaPlace,
  CasaProcess,
  CasaShopfront,
  CasaStatement,
  CasaWineries,
} from "@/components/variants/casa";

/**
 * Casa pone la venta arriba: la primera sección después del hero ya son
 * botellas con precio, y recién después se cuenta el criterio y el lugar.
 * Es el orden inverso al de las otras tres variantes.
 *
 * El movimiento entra en tres momentos —hero, el lugar y el Club— y el resto
 * se sostiene con fotografía fija, que es lo que le da el aire tradicional.
 */
export default async function CasaPage() {
  const [sections, products, plan] = await Promise.all([
    getPageSections("home"),
    getShowcaseProducts("featured", 4),
    getEntryPlan(),
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
      <CasaHero
        eyebrow={hero.eyebrow}
        title={hero.title}
        accent={hero.titleAccent}
        subtitle={hero.subtitle}
        media={hero.media}
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

      <CasaStatement
        text={statement.text}
        accent={statement.textAccent}
        attribution={statement.attribution}
        backgroundUrl={statement.backgroundUrl}
      />

      <CasaLines label={lines.eyebrow} title={lines.title} body={lines.body} items={lines.items} />

      <CasaPlace
        label={mendoza.eyebrow}
        title={mendoza.title}
        body={mendoza.body}
        media={mendoza.media}
      />

      <CasaFigures
        label={cifras.eyebrow}
        title={cifras.title}
        items={cifras.items}
        imageUrl={cifras.imageUrl}
        imageAlt={cifras.imageAlt}
      />

      <CasaProcess
        label={proceso.eyebrow}
        title={proceso.title}
        entries={proceso.entries}
        imageUrl={proceso.media.imageUrl || "/media/scenes/barrels-storage.jpg"}
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
        media={club.media}
        planName={plan?.name ?? ""}
        planPrice={plan?.price ?? 0}
      />
    </>
  );
}
