import { getSection } from "@/domain/cms/service";
import { Container, Eyebrow, Heading, Prose } from "@/ui/layout";

/**
 * Página informativa/legal. El contenido se puede editar desde el CMS
 * (clave `legal.<slug>`); si todavía no se cargó, se muestra el texto base.
 */
export async function LegalPage({
  cmsKey,
  eyebrow,
  title,
  fallback,
}: {
  cmsKey: string;
  eyebrow: string;
  title: string;
  fallback: { heading: string; body: string }[];
}) {
  const section = await getSection(cmsKey, "rich_text");
  const hasCustomContent = Boolean(section.body?.trim());

  return (
    <Container size="narrow" className="pb-section pt-4">
      <Eyebrow>{section.eyebrow || eyebrow}</Eyebrow>
      <Heading level={1} size="md" className="mt-4">
        {section.title || title}
      </Heading>

      {hasCustomContent ? (
        <Prose className="mt-8 text-[16px]">
          {section.body.split("\n\n").map((paragraph, i) => (
            <p key={i}>{paragraph}</p>
          ))}
        </Prose>
      ) : (
        <div className="mt-10 space-y-10">
          {fallback.map((block) => (
            <section key={block.heading}>
              <h2 className="font-display text-display-sm font-light text-carbon-900">
                {block.heading}
              </h2>
              <Prose className="mt-3 text-[16px]">
                {block.body.split("\n\n").map((paragraph, i) => (
                  <p key={i}>{paragraph}</p>
                ))}
              </Prose>
            </section>
          ))}
        </div>
      )}
    </Container>
  );
}
