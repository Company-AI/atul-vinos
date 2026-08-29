import type { Metadata } from "next";
import Link from "next/link";
import { requireStaff } from "@/infra/auth/guards";
import { prisma } from "@/infra/db/prisma";
import type { BlockType } from "@/domain/cms/blocks";
import { AdminCard, AdminPageHeader } from "@/components/admin/admin-ui";
import { CmsEditor, type SectionRow } from "@/components/admin/cms-editor";
import { BannerManager, FaqManager, type BannerRow, type FaqRow } from "@/components/admin/banner-faq-manager";
import { cn } from "@/lib/cn";

export const metadata: Metadata = { title: "Contenido" };

type PageProps = { searchParams: Promise<{ tab?: string }> };

const TABS = [
  { key: "secciones", label: "Secciones del sitio" },
  { key: "banners", label: "Banners" },
  { key: "faq", label: "Preguntas frecuentes" },
] as const;

export default async function AdminContentPage({ searchParams }: PageProps) {
  const staff = await requireStaff("cms.edit");
  const { tab } = await searchParams;
  const active = TABS.some((t) => t.key === tab) ? tab! : "secciones";
  const canEdit = staff.isSuperAdmin || staff.permissions.has("cms.edit");

  const [sections, banners, faqs] = await Promise.all([
    prisma.cmsSection.findMany({ orderBy: [{ page: "asc" }, { sortOrder: "asc" }] }),
    prisma.banner.findMany({ orderBy: [{ position: "asc" }, { sortOrder: "asc" }] }),
    prisma.faq.findMany({ orderBy: [{ group: "asc" }, { sortOrder: "asc" }] }),
  ]);

  const iso = (date: Date | null) => (date ? date.toISOString().slice(0, 10) : null);

  const sectionRows: SectionRow[] = sections.map((section) => ({
    id: section.id,
    key: section.key,
    page: section.page,
    type: section.type as BlockType,
    title: section.title,
    isActive: section.isActive,
    sortOrder: section.sortOrder,
    data: (section.data ?? {}) as Record<string, unknown>,
    updatedBy: section.updatedBy,
  }));

  const bannerRows: BannerRow[] = banners.map((banner) => ({
    id: banner.id,
    message: banner.message,
    linkUrl: banner.linkUrl,
    linkLabel: banner.linkLabel,
    position: banner.position,
    startsAt: iso(banner.startsAt),
    endsAt: iso(banner.endsAt),
    isActive: banner.isActive,
    sortOrder: banner.sortOrder,
  }));

  const faqRows: FaqRow[] = faqs.map((faq) => ({
    id: faq.id,
    question: faq.question,
    answer: faq.answer,
    group: faq.group,
    sortOrder: faq.sortOrder,
    isActive: faq.isActive,
  }));

  return (
    <>
      <AdminPageHeader
        title="Contenido"
        description="Textos, fotos y videos del sitio, sin tocar código."
      />

      <div className="mb-4 flex flex-wrap gap-2">
        {TABS.map((t) => (
          <Link
            key={t.key}
            href={`/admin/contenido?tab=${t.key}`}
            className={cn(
              "flex h-8 items-center rounded-sm border px-3 text-[12px] transition-colors",
              active === t.key
                ? "border-carbon-900 bg-carbon-900 text-bone"
                : "border-linen-300 text-carbon-800 hover:border-stone-400",
            )}
          >
            {t.label}
          </Link>
        ))}
      </div>

      {active === "secciones" && <CmsEditor sections={sectionRows} canEdit={canEdit} />}

      {active === "banners" && (
        <AdminCard padded={false}>
          <div className="p-4">
            <BannerManager banners={bannerRows} canEdit={canEdit} />
          </div>
        </AdminCard>
      )}

      {active === "faq" && (
        <AdminCard padded={false}>
          <div className="p-4">
            <FaqManager faqs={faqRows} canEdit={canEdit} />
          </div>
        </AdminCard>
      )}
    </>
  );
}
