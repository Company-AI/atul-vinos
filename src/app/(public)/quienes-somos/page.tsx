import type { Metadata } from "next";
import { getPageSections } from "@/domain/cms/service";
import { getSettings } from "@/domain/settings/service";
import { SectionRenderer } from "@/components/marketing/section-renderer";
import { QuienesSomosPresentacion } from "@/components/marketing/quienes-somos-presentacion";

export const revalidate = 300;

export async function generateMetadata(): Promise<Metadata> {
  const { company } = await getSettings();
  return {
    title: "Quiénes somos",
    description: `Quiénes somos en ${company.name}, cómo elegimos los vinos que vendemos y por qué el catálogo es corto a propósito.`,
    alternates: { canonical: "/quienes-somos" },
  };
}

/**
 * Acá vive el material que antes cargaba la home: el criterio de selección,
 * el proceso y de dónde viene cada botella. La home quedó para vender, y este
 * contenido —que es bueno pero largo— pasó a una entrada del menú.
 *
 * Arriba de todo va la presentación de Marian y Maxi, y no una sección más del
 * CMS. El cliente avisó que el ítem "Quiénes somos" del menú no llevaba a su
 * foto ni a su texto: estaban sólo en la home, y acá se abría con un hero de
 * video. Ahora el nombre del menú y lo primero que se ve dicen lo mismo.
 *
 * Es un componente y no una sección de contenido porque el texto lo escribió el
 * cliente de una y no lo van a editar desde el admin; meterlo en el CMS sería
 * un tipo de sección nuevo, con su editor, para una sola pantalla.
 */
export default async function QuienesSomosPage() {
  const [sections, settings] = await Promise.all([
    getPageSections("quienes-somos"),
    getSettings(),
  ]);

  return (
    <>
      <QuienesSomosPresentacion comoTitulo conEnlace={false} className="bg-bone-pure" />
      <SectionRenderer
        sections={sections}
        logoUrl={settings.company.logoLightUrl}
        companyName={settings.company.name}
      />
    </>
  );
}
