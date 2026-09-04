import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronLeft } from "lucide-react";
import { prisma } from "@/infra/db/prisma";
import { IS_DEMO } from "@/infra/demo/mode";
import { demoPostBySlug, demoPosts } from "@/infra/demo/content";
import { getSettings } from "@/domain/settings/service";
import { formatLongDate } from "@/lib/dates";
import { Container, Divider, Eyebrow, Heading } from "@/ui/layout";

export const revalidate = 300;

type PageProps = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const post = IS_DEMO ? demoPostBySlug(slug) : await prisma.post.findUnique({ where: { slug } });
  if (!post) return { title: "Nota no encontrada" };

  return {
    title: post.seoTitle || post.title,
    description: post.seoDescription || post.excerpt || undefined,
    alternates: { canonical: `/historias/${post.slug}` },
    openGraph: {
      type: "article",
      title: post.title,
      description: post.excerpt ?? undefined,
      publishedTime: post.publishedAt?.toISOString(),
      images: post.coverUrl ? [{ url: post.coverUrl }] : undefined,
    },
  };
}

export default async function StoryPage({ params }: PageProps) {
  const { slug } = await params;

  const [post, settings] = await Promise.all([
    prisma.post.findFirst({
      where: { slug, isPublished: true },
      include: { category: true },
    }),
    getSettings(),
  ]);
  if (!post) notFound();

  const related = await prisma.post.findMany({
    where: { isPublished: true, id: { not: post.id } },
    orderBy: { publishedAt: "desc" },
    take: 3,
  });

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: post.title,
    description: post.excerpt ?? undefined,
    image: post.coverUrl ? [post.coverUrl] : undefined,
    datePublished: post.publishedAt?.toISOString(),
    dateModified: post.updatedAt.toISOString(),
    author: { "@type": "Organization", name: post.author ?? settings.company.name },
    publisher: { "@type": "Organization", name: settings.company.name },
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      <Container size="narrow" className="pb-section pt-2">
        <Link
          href="/historias"
          className="mb-8 inline-flex items-center gap-1.5 text-[13px] text-stone-500 hover:text-carbon-900"
        >
          <ChevronLeft className="size-3.5" />
          Todas las historias
        </Link>

        <article>
          <Eyebrow>
            {[post.category?.name, formatLongDate(post.publishedAt)].filter(Boolean).join(" · ")}
          </Eyebrow>
          <Heading level={1} size="lg" className="mt-4">
            {post.title}
          </Heading>
          {post.author && (
            <p className="mt-5 text-[13px] text-stone-500">Por {post.author}</p>
          )}

          {post.coverUrl && (
            <div className="relative mt-10 aspect-[16/9] overflow-hidden bg-linen-100">
              <Image
                src={post.coverUrl}
                alt=""
                fill
                priority
                sizes="(max-width: 880px) 100vw, 880px"
                className="object-cover"
              />
            </div>
          )}

          <div className="mt-12 space-y-6 text-[17px] leading-[1.75] text-carbon-800">
            {post.content.split("\n\n").map((paragraph, i) => (
              <p key={i} className="max-w-[68ch]">{paragraph}</p>
            ))}
          </div>
        </article>

        {related.length > 0 && (
          <>
            <Divider className="mt-20" />
            <div className="mt-12">
              <Eyebrow>Seguir leyendo</Eyebrow>
              <ul className="mt-6 space-y-4">
                {related.map((item) => (
                  <li key={item.id}>
                    <Link
                      href={`/historias/${item.slug}`}
                      className="block border-b border-linen-200 pb-4 hover:text-wine-700"
                    >
                      <span className="font-display text-display-sm font-light">{item.title}</span>
                      {item.excerpt && (
                        <span className="mt-1 block text-[14px] text-stone-600">{item.excerpt}</span>
                      )}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          </>
        )}
      </Container>
    </>
  );
}
