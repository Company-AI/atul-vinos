import { prisma } from "@/infra/db/prisma";
import { EmailChannel } from "@/infra/notifications/email";
import { WhatsAppChannel } from "@/infra/notifications/whatsapp";
import type {
  NotificationChannel, NotificationEvent, NotificationMessage, NotificationRecipient,
} from "./ports";

const channels: NotificationChannel[] = [new EmailChannel(), new WhatsAppChannel()];

/**
 * Envía una notificación por todos los canales configurados y deja registro.
 * Nunca lanza: una falla de email no puede romper un pago ni un pedido.
 */
export async function notify(
  event: NotificationEvent,
  recipient: NotificationRecipient,
  message: NotificationMessage,
  entity?: { type: string; id: string },
): Promise<void> {
  for (const channel of channels) {
    if (channel.code !== "EMAIL" && !channel.isConfigured()) continue;

    const log = await prisma.notificationLog.create({
      data: {
        event,
        channel: channel.code,
        status: "QUEUED",
        recipient: channel.code === "EMAIL" ? recipient.email : recipient.phone ?? recipient.email,
        subject: message.subject,
        userId: recipient.userId ?? null,
        entityType: entity?.type ?? null,
        entityId: entity?.id ?? null,
      },
    });

    try {
      await channel.send(recipient, message);
      await prisma.notificationLog.update({
        where: { id: log.id },
        data: { status: "SENT", sentAt: new Date() },
      });
    } catch (error) {
      await prisma.notificationLog.update({
        where: { id: log.id },
        data: {
          status: "FAILED",
          error: error instanceof Error ? error.message : "Error desconocido",
        },
      });
      console.error(`[notificaciones] ${event} falló:`, error);
    }
  }
}

/** Plantilla administrable con reemplazo de variables {{clave}}. */
export async function renderTemplate(
  event: NotificationEvent,
  variables: Record<string, string>,
): Promise<{ subject: string; body: string } | null> {
  const template = await prisma.notificationTemplate.findUnique({
    where: { event_channel: { event, channel: "EMAIL" } },
  });
  if (!template || !template.isActive) return null;

  const replace = (text: string) =>
    text.replace(/\{\{(\w+)\}\}/g, (_, key: string) => variables[key] ?? "");

  return {
    subject: replace(template.subject ?? ""),
    body: replace(template.body),
  };
}
