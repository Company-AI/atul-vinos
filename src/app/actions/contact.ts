"use server";

import { headers } from "next/headers";
import { z } from "zod";
import { notify } from "@/domain/notifications/service";
import { getSettings } from "@/domain/settings/service";
import { clientIp, rateLimit } from "@/infra/security/rate-limit";

const schema = z.object({
  name: z.string().min(2, "Ingresá tu nombre."),
  email: z.string().email("Email inválido."),
  phone: z.string().optional(),
  subject: z.string().min(2, "Elegí un motivo."),
  message: z.string().min(10, "Contanos un poco más."),
});

export async function sendContactMessage(
  input: z.input<typeof schema>,
): Promise<{ ok: true; message: string } | { ok: false; error: string }> {
  const requestHeaders = await headers();
  const limit = rateLimit(`contacto:${clientIp(requestHeaders)}`, {
    limit: 5,
    windowSeconds: 600,
  });
  if (!limit.allowed) {
    return { ok: false, error: "Recibimos varios mensajes desde tu conexión. Probá más tarde." };
  }

  const parsed = schema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Revisá los datos." };
  }
  const data = parsed.data;

  const settings = await getSettings();
  const recipients = settings.email.notifyAdminEmails.length
    ? settings.email.notifyAdminEmails
    : [settings.company.email];

  for (const recipient of recipients) {
    await notify(
      "order.created",
      { email: recipient },
      {
        subject: `Consulta de ${data.name}: ${data.subject}`,
        heading: "Nueva consulta desde el sitio",
        intro: `${data.name} (${data.email}${data.phone ? ` · ${data.phone}`: ""}) escribió sobre «${data.subject}».`,
        body: data.message,
        rows: [
          { label: "Nombre", value: data.name },
          { label: "Email", value: data.email },
          ...(data.phone ? [{ label: "Teléfono", value: data.phone }] : []),
          { label: "Motivo", value: data.subject },
        ],
        footnote: data.message,
      },
    );
  }

  return {
    ok: true,
    message: "Recibimos tu mensaje. Te respondemos dentro de las próximas 48 horas hábiles.",
  };
}
