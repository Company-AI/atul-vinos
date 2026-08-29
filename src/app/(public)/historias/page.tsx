import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { BookOpen } from "lucide-react";
import { prisma } from "@/infra/db/prisma";
import { formatLongDate } from "@/lib/dates";
import { EmptyState } from "@/ui/empty-state";
import { Container, Eyebrow, Heading, Prose } from "@/ui/layout";
import { Reveal } from "@/ui/reveal";

export const revalidate = 300;

export const metadata: Metadata = {
  title: "Historias",
  description:
    "Notas sobre vinos, regiones de Mendoza y maridajes, escritas por nuestro equipo de selección.",
  alternates: { canonical: "/historias" },
};

export default async function StoriesPage() {
  const posts = await prisma.post.findMany({
    where: { isPublished: true },
    orderBy: { publishedAt: "desc" },
    include: { category: true },
  });

  const [featured, ...rest] = posts;

  return (
    <Container className="pb-section pt-4">
      <Eyebrow>Historias</Eyebrow>
      <Heading level={1} size="lg" className="mt-4 max-w-[20ch]">
        Lo que pasa entre la planta y la copa.
      </Heading>
      <Prose className="mt-5">
        Notas sobre vinos, regiones y maridajes. Sin tecnicismos innecesarios.
      </Prose>

      {posts.length === 0 ? (
        <div className="mt-14">
          <EmptyState
            icon={<BookOpen className="size-8" />}
            title="Todavía no publicamos nada"
            description="Estamos escribiendo las primeras notas. Suscribite al newsletter y te avisamos."
          />
        </div>
      ) : (
        <>
          {/* Nota destacada */}
          <Reveal className="mt-14">
            <Link href={`/historias/${featured.slug}`} className="group grid gap-8 lg:grid-cols-2 lg:gap-12">
              {featured.coverUrl && (
                <div className="relative aspect-[16/10] overflow-hidden bg-linen-100">
                  <Image
                    src={featured.coverUrl}
                    alt=""
                    fill
                    priority
                    sizes="(max-width: 1024px) 100vw, 50vw"
                    className="object-cover transition-transform duration-[900ms] ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:scale-[1.03]"
                  />
                </div>
              )}
              <div className="flex flex-col justify-center">
                <Eyebrow>
                  {[featured.category?.name, formatLongDate(featured.publishedAt)]
                    .filter(Boolean)
                    .join(" · ")}
                </Eyebrow>
                <Heading level={2} size="md" className="mt-4 group-hover:text-wine-700">
                  {featured.title}
                </Heading>
                {featured.excerpt && <Prose className="mt-4">{featured.excerpt}</Prose>}
                <span className="mt-6 text-[13px] underline underline-offset-4">Leer la nota</span>
              </div>
            </Link>
          </Reveal>

          {rest.length > 0 && (
            <ul className="mt-20 grid gap-x-8 gap-y-14 sm:grid-cols-2 lg:grid-cols-3">
              {rest.map((post, i) => (
                <li key={post.id}>
                  <Reveal delay={i * 0.06}>
                    <Link href={`/historias/${post.slug}`} className="group block">
                      {post.coverUrl && (
                        <div className="relative aspect-[4/3] overflow-hidden bg-linen-100">
                          <Image
                            src={post.coverUrl}
                            alt=""
                            fill
                            sizes="(max-width: 640px) 100vw, 33vw"
                            className="object-cover transition-transform duration-[900ms] ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:scale-[1.03]"
                          />
                        </div>
                      )}
                      <Eyebrow className="mt-5">
                        {[post.category?.name, formatLongDate(post.publishedAt)]
                          .filter(Boolean)
                          .join(" · ")}
                      </Eyebrow>
                      <h2 className="mt-3 font-display text-display-sm font-light leading-snug text-carbon-900 group-hover:text-wine-700">
                        {post.title}
                      </h2>
                      {post.excerpt && (
                        <p className="mt-2 text-[14px] leading-relaxed text-stone-600">
                          {post.excerpt}
                        </p>
                      )}
                    </Link>
                  </Reveal>
                </li>
              ))}
            </ul>
          )}
        </>
      )}
    </Container>
  );
}
