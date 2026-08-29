"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/infra/db/prisma";
import { assertPermission } from "@/infra/auth/guards";
import { recordAudit } from "@/domain/audit/service";
import { BLOCK_SCHEMAS, type BlockType } from "@/domain/cms/blocks";

export type CmsActionResult = { ok: true; message: string } | { ok: false; error: string };

/** Guarda una sección validando el payload contra el esquema de su tipo. */
export async function saveCmsSection(input: {
  id: string;
  title?: string;
  isActive: boolean;
  sortOrder: number;
  data: unknown;
}): Promise<CmsActionResult> {
  let user;
  try {
    user = await assertPermission("cms.edit");
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : "Sin permiso." };
  }

  const section = await prisma.cmsSection.findUnique({ where: { id: input.id } });
  if (!section) return { ok: false, error: "La sección no existe." };

  const schema = BLOCK_SCHEMAS[section.type as BlockType];
  if (!schema) return { ok: false, error: `Tipo de bloque desconocido: ${section.type}.` };

  const parsed = schema.safeParse(input.data);
  if (!parsed.success) {
    const issue = parsed.error.issues[0];
    return {
      ok: false,
      error: `${issue?.path.join(".") ?? "Contenido"}: ${issue?.message ?? "valor inválido"}`,
    };
  }

  await prisma.cmsSection.update({
    where: { id: input.id },
    data: {
      title: input.title?.trim() || null,
      isActive: input.isActive,
      sortOrder: input.sortOrder,
      data: parsed.data as object,
      updatedBy: user.email,
    },
  });

  await recordAudit(user, {
    action: "cms.update",
    entityType: "CmsSection",
    entityId: input.id,
    before: { isActive: section.isActive },
    after: { isActive: input.isActive, key: section.key },
  });

  revalidatePath("/");
  revalidatePath("/club");
  revalidatePath("/historia");
  revalidatePath("/admin/contenido");
  return { ok: true, message: "Contenido actualizado." };
}

const bannerSchema = z.object({
  id: z.string().optional(),
  message: z.string().min(3, "Escribí el mensaje del banner."),
  linkUrl: z.string().max(300).optional(),
  linkLabel: z.string().max(60).optional(),
  position: z.enum(["top", "home", "shop"]).default("top"),
  startsAt: z.string().optional(),
  endsAt: z.string().optional(),
  isActive: z.boolean().default(true),
  sortOrder: z.number().int().default(0),
});

export async function saveBanner(input: z.input<typeof bannerSchema>): Promise<CmsActionResult> {
  let user;
  try {
    user = await assertPermission("cms.edit");
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : "Sin permiso." };
  }

  const parsed = bannerSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Revisá los datos." };
  }
  const data = parsed.data;

  const payload = {
    message: data.message.trim(),
    linkUrl: data.linkUrl?.trim() || null,
    linkLabel: data.linkLabel?.trim() || null,
    position: data.position,
    startsAt: data.startsAt ? new Date(`${data.startsAt}T00:00:00`) : null,
    endsAt: data.endsAt ? new Date(`${data.endsAt}T23:59:59`) : null,
    isActive: data.isActive,
    sortOrder: data.sortOrder,
  };

  const banner = data.id
    ? await prisma.banner.update({ where: { id: data.id }, data: payload })
    : await prisma.banner.create({ data: payload });

  await recordAudit(user, {
    action: "banner.update",
    entityType: "Banner",
    entityId: banner.id,
    after: { message: data.message, isActive: data.isActive },
  });

  revalidatePath("/");
  revalidatePath("/admin/contenido");
  return { ok: true, message: data.id ? "Banner actualizado." : "Banner creado." };
}

export async function deleteBanner(bannerId: string): Promise<CmsActionResult> {
  let user;
  try {
    user = await assertPermission("cms.edit");
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : "Sin permiso." };
  }

  await prisma.banner.delete({ where: { id: bannerId } });
  await recordAudit(user, { action: "banner.update", entityType: "Banner", entityId: bannerId, after: { deleted: true } });

  revalidatePath("/");
  revalidatePath("/admin/contenido");
  return { ok: true, message: "Banner eliminado." };
}

const faqSchema = z.object({
  id: z.string().optional(),
  question: z.string().min(5, "Escribí la pregunta."),
  answer: z.string().min(5, "Escribí la respuesta."),
  group: z.string().default("general"),
  sortOrder: z.number().int().default(0),
  isActive: z.boolean().default(true),
});

export async function saveFaq(input: z.input<typeof faqSchema>): Promise<CmsActionResult> {
  let user;
  try {
    user = await assertPermission("cms.edit");
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : "Sin permiso." };
  }

  const parsed = faqSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Revisá los datos." };
  }
  const data = parsed.data;

  const faq = data.id
    ? await prisma.faq.update({ where: { id: data.id }, data })
    : await prisma.faq.create({ data });

  await recordAudit(user, { action: "cms.update", entityType: "Faq", entityId: faq.id });

  revalidatePath("/faq");
  revalidatePath("/club");
  revalidatePath("/admin/contenido");
  return { ok: true, message: data.id ? "Pregunta actualizada." : "Pregunta creada." };
}

export async function deleteFaq(faqId: string): Promise<CmsActionResult> {
  try {
    await assertPermission("cms.edit");
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : "Sin permiso." };
  }
  await prisma.faq.delete({ where: { id: faqId } });
  revalidatePath("/faq");
  revalidatePath("/admin/contenido");
  return { ok: true, message: "Pregunta eliminada." };
}
