"use server";

import { z } from "zod";
import { prisma } from "@/infra/db/prisma";

const schema = z.object({
  email: z.string().email("Ingresá un email válido."),
  name: z.string().max(120).optional(),
  source: z.string().max(40).optional(),
});

export async function subscribeToNewsletter(input: {
  email: string;
  name?: string;
  source?: string;
}): Promise<{ ok: true; message: string } | { ok: false; error: string }> {
  const parsed = schema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Datos inválidos." };
  }

  const email = parsed.data.email.toLowerCase().trim();
  // Se guarda el consentimiento explícito con su fecha.
  await prisma.newsletterSubscriber.upsert({
    where: { email },
    create: {
      email,
      name: parsed.data.name?.trim() || null,
      source: parsed.data.source ?? "footer",
      consent: true,
      isActive: true,
    },
    update: { isActive: true, consent: true, consentAt: new Date() },
  });

  return { ok: true, message: "Listo. Te vamos a escribir cuando haya novedades." };
}
