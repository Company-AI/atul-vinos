import type {
  NotificationChannel, NotificationMessage, NotificationRecipient,
} from "@/domain/notifications/ports";

/**
 * Canal de WhatsApp preparado, sin proveedor todavía.
 *
 * Al integrar (WhatsApp Cloud API, Twilio u otro): guardar credenciales en
 * variables de entorno, implementar `send` contra la documentación oficial y
 * devolver true en `isConfigured`. El dominio no cambia.
 */
export class WhatsAppChannel implements NotificationChannel {
  readonly code = "WHATSAPP" as const;

  isConfigured(): boolean {
    return false;
  }

  async send(recipient: NotificationRecipient, message: NotificationMessage): Promise<void> {
    console.info(
      `[whatsapp:pendiente] ${recipient.phone ?? "sin teléfono"} — ${message.subject}`,
    );
  }
}
