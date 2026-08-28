import Link from "next/link";
import { ArrowRight } from "lucide-react";
import type { BlockData } from "@/domain/cms/blocks";
import { getShowcaseProducts } from "@/domain/catalog/service";
import { getFavoriteIds } from "@/app/actions/favorites";
import { Container, Eyebrow, Heading, Prose, Section } from "@/ui/layout";
import { Reveal } from "@/ui/reveal";
import { WineGrid } from "@/components/shop/wine-grid";

export async function FeaturedWines({ data }: { data: BlockData<"featured_wines"> }) {
  const [products, favoriteIds] = await Promise.all([
    getShowcaseProducts(data.source, data.limit, data.lineSlug || undefined),
    getFavoriteIds(),
  ]);
  if (products.length === 0) return null;

  return (
    <Section tone={data.tone}>
      <Container>
        <Reveal className="mb-12 flex flex-wrap items-end justify-between gap-6">
          <div className="max-w-2xl">
            {data.eyebrow && <Eyebrow>{data.eyebrow}</Eyebrow>}
            <Heading size="md" className="mt-5">{data.title}</Heading>
            {data.body && <Prose className="mt-5">{data.body}</Prose>}
          </div>
          {data.cta.label && (
            <Link
              href={data.cta.href}
              className="inline-flex shrink-0 items-center gap-2 text-sm underline underline-offset-4 transition-colors hover:text-wine-700"
            >
              {data.cta.label}
              <ArrowRight className="size-4" />
            </Link>
          )}
        </Reveal>

        <WineGrid products={products} favoriteIds={favoriteIds} columns={4} />
      </Container>
    </Section>
  );
}
