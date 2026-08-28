import { headers } from "next/headers";
import { prisma } from "@/infra/db/prisma";
import type { CurrentUser } from "@/infra/auth/session";
import { clientIp } from "@/infra/security/rate-limit";

export type AuditInput = {
  action: string;
  entityType: string;
  entityId?: string | null;
  before?: unknown;
  after?: unknown;
};

/**
 * Registra una acción administrativa (spec §54). Nunca lanza: la auditoría no
 * puede impedir que se complete la operación que se está auditando.
 */
export async function recordAudit(user: CurrentUser | null, input: AuditInput): Promise<void> {
  try {
    let ip: string | null = null;
    let userAgent: string | null = null;
    try {
      const requestHeaders = await headers();
      ip = clientIp(requestHeaders);
      userAgent = requestHeaders.get("user-agent");
    } catch {
      // Fuera de un request (jobs, cron): no hay headers.
    }

    await prisma.auditLog.create({
      data: {
        userId: user?.id ?? null,
        actorEmail: user?.email ?? null,
        action: input.action,
        entityType: input.entityType,
        entityId: input.entityId ?? null,
        before: input.before === undefined ? undefined : (input.before as object),
        after: input.after === undefined ? undefined : (input.after as object),
        ip,
        userAgent,
      },
    });
  } catch (error) {
    console.error("[auditoría] no se pudo registrar la acción:", error);
  }
}

export const AUDIT_ACTION_LABELS: Record<string, string> = {
  "order.status": "Cambió el estado de un pedido",
  "order.note": "Agregó una nota interna",
  "order.label": "Generó una etiqueta",
  "order.bulk_status": "Cambió el estado de varios pedidos",
  "product.create": "Creó un producto",
  "product.update": "Editó un producto",
  "product.price.update": "Modificó un precio",
  "product.archive": "Archivó un producto",
  "stock.adjust": "Ajustó stock",
  "stock.entry": "Registró un ingreso de stock",
  "stock.movement": "Registró un movimiento de stock",
  "subscription.pause": "Pausó una suscripción",
  "subscription.resume": "Reactivó una suscripción",
  "subscription.cancel": "Canceló una suscripción",
  "subscription.plan_change": "Cambió el plan de un suscriptor",
  "subscription_plan.create": "Creó un plan del Club",
  "subscription_plan.update": "Editó un plan del Club",
  "subscription_box.update": "Editó el box del mes",
  "coupon.create": "Creó un cupón",
  "coupon.update": "Editó un cupón",
  "cms.update": "Editó contenido del sitio",
  "banner.update": "Editó un banner",
  "settings.update": "Cambió la configuración",
  "user.create": "Creó un usuario",
  "user.update": "Editó un usuario",
  "role.update": "Cambió permisos de un rol",
  "webhook.reprocess": "Reprocesó un webhook",
  "customer.note": "Editó notas de un cliente",
};
