import type { Section as CmsSection } from "@/domain/cms/service";
import type { BlockData } from "@/domain/cms/blocks";
import { ClubTeaser } from "./club-teaser";
import { EditorialSection } from "./editorial-section";
import { FaqSection } from "./faq-section";
import { FeaturedWines } from "./featured-wines";
import { ShowcaseSection } from "./showcase-section";
import { StepsSection } from "./steps-section";
import { VideoHero } from "./video-hero";
import { RichTextSection } from "./rich-text-section";
import { StatementSection } from "./statement-section";
import { FiguresSection } from "./figures-section";
import { SplitStickySection } from "./split-sticky-section";
import { GallerySection } from "./gallery-section";

/**
 * Traduce los bloques del CMS a componentes. Los tipos desconocidos se ignoran
 * en silencio en lugar de romper la página.
 */
export function SectionRenderer({
  sections,
  logoUrl,
  companyName,
  anchors = {},
}: {
  sections: CmsSection[];
  logoUrl?: string;
  companyName?: string;
  /** Ancla opcional por clave de sección, para links internos (#planes, #faq). */
  anchors?: Record<string, string>;
}) {
  return (
    <>
      {sections.map((section, index) => {
        const id = anchors[section.key];

        switch (section.type) {
          case "video_hero":
            return (
              <VideoHero
                key={section.id}
                data={section.data as BlockData<"video_hero">}
                logoUrl={logoUrl}
                companyName={companyName}
                priority={index === 0}
              />
            );
          case "editorial":
            return <EditorialSection key={section.id} data={section.data as BlockData<"editorial">} />;
          case "showcase":
            return <ShowcaseSection key={section.id} data={section.data as BlockData<"showcase">} />;
          case "steps":
            return <StepsSection key={section.id} data={section.data as BlockData<"steps">} id={id} />;
          case "club_teaser":
            return <ClubTeaser key={section.id} data={section.data as BlockData<"club_teaser">} />;
          case "featured_wines":
            return <FeaturedWines key={section.id} data={section.data as BlockData<"featured_wines">} />;
          case "faq":
            return <FaqSection key={section.id} data={section.data as BlockData<"faq">} id={id} />;
          case "rich_text":
            return <RichTextSection key={section.id} data={section.data as BlockData<"rich_text">} />;
          case "statement":
            return <StatementSection key={section.id} data={section.data as BlockData<"statement">} id={id} />;
          case "figures":
            return <FiguresSection key={section.id} data={section.data as BlockData<"figures">} id={id} />;
          case "split_sticky":
            return <SplitStickySection key={section.id} data={section.data as BlockData<"split_sticky">} id={id} />;
          case "gallery":
            return <GallerySection key={section.id} data={section.data as BlockData<"gallery">} id={id} />;
          default:
            return null;
        }
      })}
    </>
  );
}
