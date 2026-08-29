import { Prisma } from "@prisma/client";
import { prisma } from "@/infra/db/prisma";
import { REVENUE_STATUSES, ORDER_STATUS_ADMIN_LABELS } from "@/domain/orders/status";
import { CYCLE_STATUS_LABELS, SUBSCRIPTION_STATUS_LABELS } from "@/domain/subscriptions/status";
import type { PermissionCode } from "@/infra/auth/permissions";
import { toNumber } from "@/lib/money";
import { formatDate, formatDateTime, periodLabel } from "@/lib/dates";

export type ReportRow = Record<string, string | number>;

export type ReportDefinition = {
  key: string;
  label: string;
  description: string;
  permission: PermissionCode;
  columns: { key: string; header: string; width?: number }[];
  load: (range: { from?: Date; to?: Date }) => Promise<ReportRow[]>;
};

const dateFilter = (range: { from?: Date; to?: Date }) =>
  range.from || range.to
    ? { gte: range.from ?? undefined, lte: range.to ?? undefined }
    : undefined;

export const REPORTS: ReportDefinition[] = [
  {
    key: "ventas",
    label: "Ventas",
    description: "Un renglón por pedido pagado, con desglose de descuentos y envío.",
    permission: "reports.view",
    columns: [
      { key: "numero", header: "Nº", width: 8 },
      { key: "fecha", header: "Fecha", width: 12 },
      { key: "tipo", header: "Tipo", width: 12 },
      { key: "cliente", header: "Cliente", width: 26 },
      { key: "email", header: "Email", width: 28 },
      { key: "provincia", header: "Provincia", width: 18 },
      { key: "subtotal", header: "Subtotal", width: 12 },
      { key: "descuentos", header: "Descuentos", width: 12 },
      { key: "envio", header: "Envío", width: 12 },
      { key: "total", header: "Total", width: 12 },
      { key: "estado", header: "Estado", width: 18 },
    ],
    load: async (range) => {
      const orders = await prisma.order.findMany({
        where: { status: { in: REVENUE_STATUSES }, paidAt: dateFilter(range) },
        orderBy: { paidAt: "desc" },
      });
      return orders.map((order) => {
        const address = order.shippingSnapshot as Record<string, string>;
        return {
          numero: order.number,
          fecha: formatDate(order.paidAt ?? order.createdAt),
          tipo: order.type === "SUBSCRIPTION" ? "Club" : "Tienda",
          cliente: order.customerName,
          email: order.customerEmail,
          provincia: address?.province ?? "",
          subtotal: toNumber(order.subtotal),
          descuentos: toNumber(order.discountTotal),
          envio: toNumber(order.shippingTotal),
          total: toNumber(order.total),
          estado: ORDER_STATUS_ADMIN_LABELS[order.status],
        };
      });
    },
  },
  {
    key: "pedidos",
    label: "Pedidos",
    description: "Todos los pedidos, incluidos los pendientes y cancelados, con tracking.",
    permission: "reports.view",
    columns: [
      { key: "numero", header: "Nº", width: 8 },
      { key: "fecha", header: "Fecha", width: 16 },
      { key: "cliente", header: "Cliente", width: 26 },
      { key: "estado", header: "Estado", width: 20 },
      { key: "items", header: "Ítems", width: 8 },
      { key: "total", header: "Total", width: 12 },
      { key: "transportista", header: "Transportista", width: 18 },
      { key: "tracking", header: "Tracking", width: 18 },
    ],
    load: async (range) => {
      const orders = await prisma.order.findMany({
        where: { createdAt: dateFilter(range) },
        orderBy: { createdAt: "desc" },
        include: {
          items: { select: { quantity: true } },
          shipments: { take: 1, orderBy: { createdAt: "desc" }, include: { carrier: true } },
        },
      });
      return orders.map((order) => ({
        numero: order.number,
        fecha: formatDateTime(order.createdAt),
        cliente: order.customerName,
        estado: ORDER_STATUS_ADMIN_LABELS[order.status],
        items: order.items.reduce((acc, i) => acc + i.quantity, 0),
        total: toNumber(order.total),
        transportista: order.shipments[0]?.carrier?.name ?? "",
        tracking: order.shipments[0]?.trackingNumber ?? "",
      }));
    },
  },
  {
    key: "productos",
    label: "Productos vendidos",
    description: "Unidades y facturación por producto en el período.",
    permission: "reports.view",
    columns: [
      { key: "sku", header: "SKU", width: 18 },
      { key: "producto", header: "Producto", width: 32 },
      { key: "unidades", header: "Unidades", width: 10 },
      { key: "facturado", header: "Facturado", width: 14 },
      { key: "pedidos", header: "Pedidos", width: 10 },
    ],
    load: async (range) => {
      // Los filtros opcionales se componen con Prisma.sql para que sigan siendo
      // consultas parametrizadas.
      const fromClause = range.from
        ? Prisma.sql`AND o."paidAt" >= ${range.from}`
        : Prisma.empty;
      const toClause = range.to ? Prisma.sql`AND o."paidAt" <= ${range.to}` : Prisma.empty;

      const rows = await prisma.$queryRaw<
        { sku: string; name: string; unidades: number; facturado: number; pedidos: number }[]
      >(Prisma.sql`
        SELECT oi.sku, oi.name,
               SUM(oi.quantity)::int AS unidades,
               SUM(oi."lineTotal")::float AS facturado,
               COUNT(DISTINCT oi."orderId")::int AS pedidos
        FROM "OrderItem" oi
        JOIN "Order" o ON o.id = oi."orderId"
        WHERE o.status = ANY(${REVENUE_STATUSES}::"OrderStatus"[])
          ${fromClause}
          ${toClause}
        GROUP BY oi.sku, oi.name
        ORDER BY unidades DESC
      `);
      return rows.map((row) => ({
        sku: row.sku,
        producto: row.name,
        unidades: row.unidades,
        facturado: row.facturado,
        pedidos: row.pedidos,
      }));
    },
  },
  {
    key: "stock",
    label: "Stock",
    description: "Situación actual del inventario, con disponible y mínimo.",
    permission: "reports.view",
    columns: [
      { key: "sku", header: "SKU", width: 18 },
      { key: "producto", header: "Producto", width: 32 },
      { key: "ubicacion", header: "Ubicación", width: 12 },
      { key: "fisico", header: "Físico", width: 10 },
      { key: "reservado", header: "Reservado", width: 10 },
      { key: "disponible", header: "Disponible", width: 10 },
      { key: "minimo", header: "Mínimo", width: 10 },
      { key: "estado", header: "Estado", width: 14 },
    ],
    load: async () => {
      const inventories = await prisma.inventory.findMany({
        include: { product: { select: { name: true, sku: true, status: true } } },
        orderBy: { product: { name: "asc" } },
      });
      return inventories
        .filter((inv) => inv.product.status !== "ARCHIVED")
        .map((inv) => {
          const available = Math.max(0, inv.onHand - inv.reserved);
          return {
            sku: inv.product.sku,
            producto: inv.product.name,
            ubicacion: inv.location ?? "",
            fisico: inv.onHand,
            reservado: inv.reserved,
            disponible: available,
            minimo: inv.minStock,
            estado: available <= 0 ? "Sin stock" : available <= inv.minStock ? "Reponer" : "OK",
          };
        });
    },
  },
  {
    key: "movimientos",
    label: "Movimientos de stock",
    description: "Historial completo con stock anterior y posterior.",
    permission: "reports.view",
    columns: [
      { key: "fecha", header: "Fecha", width: 18 },
      { key: "sku", header: "SKU", width: 18 },
      { key: "producto", header: "Producto", width: 30 },
      { key: "tipo", header: "Tipo", width: 14 },
      { key: "cantidad", header: "Cantidad", width: 10 },
      { key: "fisicoAntes", header: "Físico antes", width: 12 },
      { key: "fisicoDespues", header: "Físico después", width: 14 },
      { key: "pedido", header: "Pedido", width: 10 },
      { key: "responsable", header: "Responsable", width: 24 },
      { key: "comentario", header: "Comentario", width: 40 },
    ],
    load: async (range) => {
      const movements = await prisma.inventoryMovement.findMany({
        where: { createdAt: dateFilter(range) },
        orderBy: { createdAt: "desc" },
        include: {
          product: { select: { name: true, sku: true } },
          user: { select: { firstName: true, lastName: true } },
          order: { select: { number: true } },
        },
      });
      return movements.map((movement) => ({
        fecha: formatDateTime(movement.createdAt),
        sku: movement.product.sku,
        producto: movement.product.name,
        tipo: movement.type,
        cantidad: movement.quantity,
        fisicoAntes: movement.onHandBefore,
        fisicoDespues: movement.onHandAfter,
        pedido: movement.order ? `#${movement.order.number}` : "",
        responsable: movement.user
          ? `${movement.user.firstName} ${movement.user.lastName}`
          : "Sistema",
        comentario: movement.comment ?? "",
      }));
    },
  },
  {
    key: "clientes",
    label: "Clientes",
    description: "Base de clientes con lo que compró cada uno.",
    permission: "reports.export",
    columns: [
      { key: "nombre", header: "Nombre", width: 28 },
      { key: "email", header: "Email", width: 30 },
      { key: "telefono", header: "Teléfono", width: 18 },
      { key: "registro", header: "Registro", width: 12 },
      { key: "pedidos", header: "Pedidos", width: 10 },
      { key: "gastado", header: "Gastado", width: 14 },
      { key: "socio", header: "Socio del Club", width: 16 },
      { key: "newsletter", header: "Newsletter", width: 12 },
    ],
    load: async () => {
      const customers = await prisma.user.findMany({
        where: { isStaff: false },
        orderBy: { createdAt: "desc" },
        include: {
          orders: { where: { status: { in: REVENUE_STATUSES } }, select: { total: true } },
          subscriptions: { where: { status: "ACTIVE" }, include: { plan: true }, take: 1 },
        },
      });
      return customers.map((customer) => ({
        nombre: `${customer.firstName} ${customer.lastName}`,
        email: customer.email,
        telefono: customer.phone ?? "",
        registro: formatDate(customer.createdAt),
        pedidos: customer.orders.length,
        gastado: customer.orders.reduce((acc, o) => acc + toNumber(o.total), 0),
        socio: customer.subscriptions[0]?.plan.name ?? "No",
        newsletter: customer.acceptsMarketing ? "Sí" : "No",
      }));
    },
  },
  {
    key: "suscripciones",
    label: "Suscripciones",
    description: "Contratos del Club con su estado y próximos cobros.",
    permission: "reports.view",
    columns: [
      { key: "numero", header: "Nº", width: 8 },
      { key: "cliente", header: "Cliente", width: 28 },
      { key: "email", header: "Email", width: 30 },
      { key: "plan", header: "Plan", width: 20 },
      { key: "estado", header: "Estado", width: 20 },
      { key: "alta", header: "Alta", width: 12 },
      { key: "proximoCobro", header: "Próximo cobro", width: 14 },
      { key: "ciclos", header: "Ciclos", width: 8 },
      { key: "importe", header: "Importe", width: 12 },
    ],
    load: async () => {
      const subscriptions = await prisma.subscription.findMany({
        orderBy: { createdAt: "desc" },
        include: { user: true, plan: true },
      });
      return subscriptions.map((subscription) => ({
        numero: subscription.number,
        cliente: `${subscription.user.firstName} ${subscription.user.lastName}`,
        email: subscription.user.email,
        plan: subscription.plan.name,
        estado: SUBSCRIPTION_STATUS_LABELS[subscription.status],
        alta: formatDate(subscription.startedAt ?? subscription.createdAt),
        proximoCobro: subscription.nextChargeAt ? formatDate(subscription.nextChargeAt) : "",
        ciclos: subscription.cyclesCount,
        importe: toNumber(subscription.amount),
      }));
    },
  },
  {
    key: "club",
    label: "Métricas del Club",
    description: "Un renglón por ciclo cobrado, con su pedido asociado.",
    permission: "reports.view",
    columns: [
      { key: "periodo", header: "Período", width: 16 },
      { key: "plan", header: "Plan", width: 20 },
      { key: "cliente", header: "Cliente", width: 28 },
      { key: "estado", header: "Estado del ciclo", width: 18 },
      { key: "importe", header: "Importe", width: 12 },
      { key: "intentos", header: "Intentos", width: 10 },
      { key: "pedido", header: "Pedido", width: 10 },
    ],
    load: async () => {
      const cycles = await prisma.subscriptionCycle.findMany({
        orderBy: [{ periodYear: "desc" }, { periodMonth: "desc" }],
        include: {
          subscription: { include: { user: true, plan: true } },
          order: { select: { number: true } },
        },
      });
      return cycles.map((cycle) => ({
        periodo: periodLabel(cycle.periodMonth, cycle.periodYear),
        plan: cycle.subscription.plan.name,
        cliente: `${cycle.subscription.user.firstName} ${cycle.subscription.user.lastName}`,
        estado: CYCLE_STATUS_LABELS[cycle.status],
        importe: toNumber(cycle.amount),
        intentos: cycle.chargeAttempts,
        pedido: cycle.order ? `#${cycle.order.number}` : "",
      }));
    },
  },
  {
    key: "pagos",
    label: "Pagos",
    description: "Todos los pagos registrados, con su estado en el proveedor.",
    permission: "payments.view",
    columns: [
      { key: "fecha", header: "Fecha", width: 18 },
      { key: "proveedor", header: "Proveedor", width: 14 },
      { key: "motivo", header: "Motivo", width: 18 },
      { key: "estado", header: "Estado", width: 14 },
      { key: "monto", header: "Monto", width: 12 },
      { key: "metodo", header: "Método", width: 14 },
      { key: "referencia", header: "Referencia", width: 24 },
      { key: "idExterno", header: "ID externo", width: 24 },
    ],
    load: async (range) => {
      const payments = await prisma.payment.findMany({
        where: { createdAt: dateFilter(range) },
        orderBy: { createdAt: "desc" },
      });
      return payments.map((payment) => ({
        fecha: formatDateTime(payment.createdAt),
        proveedor: payment.provider,
        motivo:
          payment.purpose === "ORDER"
            ? "Pedido"
            : payment.purpose === "SUBSCRIPTION_SIGNUP"
              ? "Alta del Club"
              : "Renovación",
        estado: payment.status,
        monto: toNumber(payment.amount),
        metodo: payment.paymentMethod ?? "",
        referencia: payment.externalReference ?? "",
        idExterno: payment.externalId ?? "",
      }));
    },
  },
  {
    key: "pagos-fallidos",
    label: "Pagos fallidos",
    description: "Rechazos y contracargos, con el motivo informado por el proveedor.",
    permission: "payments.view",
    columns: [
      { key: "fecha", header: "Fecha", width: 18 },
      { key: "cliente", header: "Cliente", width: 28 },
      { key: "motivo", header: "Motivo", width: 18 },
      { key: "monto", header: "Monto", width: 12 },
      { key: "detalle", header: "Detalle del rechazo", width: 34 },
      { key: "referencia", header: "Referencia", width: 24 },
    ],
    load: async () => {
      const payments = await prisma.payment.findMany({
        where: { status: { in: ["REJECTED", "CANCELLED", "CHARGED_BACK"] } },
        orderBy: { createdAt: "desc" },
        include: {
          order: { select: { customerName: true, number: true } },
          subscription: { include: { user: true } },
        },
      });
      return payments.map((payment) => ({
        fecha: formatDateTime(payment.createdAt),
        cliente:
          payment.order?.customerName ??
          (payment.subscription
            ? `${payment.subscription.user.firstName} ${payment.subscription.user.lastName}`
            : ""),
        motivo: payment.purpose === "ORDER" ? "Pedido" : "Club",
        monto: toNumber(payment.amount),
        detalle: payment.failureReason ?? "",
        referencia: payment.externalReference ?? "",
      }));
    },
  },
];

export function getReport(key: string): ReportDefinition | undefined {
  return REPORTS.find((report) => report.key === key);
}
