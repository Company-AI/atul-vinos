import type { Metadata } from "next";
import Link from "next/link";
import { AlertTriangle, ArrowRight, Package } from "lucide-react";
import { requireStaff } from "@/infra/auth/guards";
import {
  getDailySales, getDashboardMetrics, getMonthlySales, getSubscriptionFlow, getTopProducts,
} from "@/domain/reports/dashboard";
import { formatARS } from "@/lib/money";
import { currentPeriod, periodLabel } from "@/lib/dates";
import {
  DailySalesChart, MonthlySalesChart, RecurringRevenueChart, SubscriptionFlowChart,
} from "@/components/admin/charts";
import { AdminCard, AdminPageHeader, AdminTable, MetricCard, Td } from "@/components/admin/admin-ui";
import { Badge } from "@/ui/badge";

export const metadata: Metadata = { title: "Dashboard" };

export default async function AdminDashboardPage() {
  await requireStaff();

  const [metrics, daily, monthly, flow, topProducts] = await Promise.all([
    getDashboardMetrics(),
    getDailySales(30),
    getMonthlySales(12),
    getSubscriptionFlow(12),
    getTopProducts(8),
  ]);

  const period = currentPeriod();

  return (
    <>
      <AdminPageHeader
        title="Dashboard"
        description={`Resumen operativo · ${periodLabel(period.month, period.year)}`}
      />

      {/* Alertas primero: lo que requiere acción */}
      {(metrics.failedPayments > 0 ||
        metrics.lowStockCount > 0 ||
        metrics.clubRequirements.length > 0) && (
        <div className="mb-6 grid gap-3 md:grid-cols-3">
          {metrics.failedPayments > 0 && (
            <Link
              href="/admin/pagos?estado=fallidos"
              className="flex items-start gap-3 rounded-md border border-danger-500/30 bg-danger-100 p-4 transition-opacity hover:opacity-90"
            >
              <AlertTriangle className="mt-0.5 size-4 shrink-0 text-danger-500" />
              <div>
                <p className="text-[13px] font-medium text-danger-500">
                  {metrics.failedPayments} pago{metrics.failedPayments === 1 ? "" : "s"} de suscripción rechazado{metrics.failedPayments === 1 ? "" : "s"}
                </p>
                <p className="mt-0.5 text-[12px] text-danger-500">
                  Esas cajas no se despachan hasta recuperar el cobro.
                </p>
              </div>
            </Link>
          )}

          {metrics.lowStockCount > 0 && (
            <Link
              href="/admin/stock?filtro=bajo"
              className="flex items-start gap-3 rounded-md border border-warning-500/30 bg-warning-100 p-4 transition-opacity hover:opacity-90"
            >
              <AlertTriangle className="mt-0.5 size-4 shrink-0 text-warning-500" />
              <div>
                <p className="text-[13px] font-medium text-warning-500">
                  {metrics.lowStockCount} producto{metrics.lowStockCount === 1 ? "" : "s"} con stock bajo
                </p>
                <p className="mt-0.5 text-[12px] text-warning-500">
                  {metrics.lowStock.slice(0, 2).map((p) => `${p.name} (${p.available})`).join(" · ")}
                </p>
              </div>
            </Link>
          )}

          {metrics.clubRequirements.length > 0 && (
            <Link
              href="/admin/suscripciones/box"
              className="flex items-start gap-3 rounded-md border border-info-500/30 bg-info-100 p-4 transition-opacity hover:opacity-90"
            >
              <Package className="mt-0.5 size-4 shrink-0 text-info-500" />
              <div>
                <p className="text-[13px] font-medium text-info-500">
                  Faltan botellas para el box del mes
                </p>
                <p className="mt-0.5 text-[12px] text-info-500">
                  {metrics.clubRequirements
                    .slice(0, 2)
                    .map((r) => `${r.name}: faltan ${r.missing}`)
                    .join(" · ")}
                </p>
              </div>
            </Link>
          )}
        </div>
      )}

      {/* Métricas */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard label="Ventas hoy" value={formatARS(metrics.salesToday)} hint={`${metrics.ordersToday} pedidos`} />
        <MetricCard label="Ventas del mes" value={formatARS(metrics.salesMonth)} />
        <MetricCard label="Ticket promedio" value={formatARS(metrics.averageTicket)} hint="del mes" />
        <MetricCard label="Ingreso recurrente" value={formatARS(metrics.mrr)} hint="suscripciones activas" tone="info" />

        <MetricCard label="Pendientes de pago" value={metrics.pendingPayment} href="/admin/pedidos?estado=PAYMENT_PENDING" tone={metrics.pendingPayment > 0 ? "warning" : "neutral"} />
        <MetricCard label="A preparar" value={metrics.toPrepare} href="/admin/picking" tone={metrics.toPrepare > 0 ? "warning" : "neutral"} />
        <MetricCard label="Enviados" value={metrics.shipped} href="/admin/pedidos?estado=SHIPPED" />
        <MetricCard label="Próximos envíos del Club" value={metrics.upcomingShipments} href="/admin/pedidos?tipo=SUBSCRIPTION" />

        <MetricCard label="Suscriptores activos" value={metrics.activeSubscribers} href="/admin/suscripciones" tone="success" />
        <MetricCard label="Altas del mes" value={metrics.newSubscribers} tone="success" />
        <MetricCard label="Bajas del mes" value={metrics.cancellations} tone={metrics.cancellations > 0 ? "danger" : "neutral"} />
        <MetricCard label="Pagos del Club fallidos" value={metrics.failedPayments} href="/admin/pagos?estado=fallidos" tone={metrics.failedPayments > 0 ? "danger" : "neutral"} />

        <MetricCard label="Venta e-commerce" value={formatARS(metrics.storeSales)} hint="del mes" />
        <MetricCard label="Venta suscripciones" value={formatARS(metrics.subscriptionSales)} hint="del mes" />
        <MetricCard label="Stock bajo" value={metrics.lowStockCount} href="/admin/stock?filtro=bajo" tone={metrics.lowStockCount > 0 ? "warning" : "neutral"} />
        <MetricCard label="Pedidos hoy" value={metrics.ordersToday} href="/admin/pedidos" />
      </div>

      {/* Gráficos */}
      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        <AdminCard title="Ventas diarias" description="Últimos 30 días, tienda vs Club">
          <DailySalesChart data={daily} />
        </AdminCard>
        <AdminCard title="Ventas mensuales" description="Últimos 12 meses">
          <MonthlySalesChart data={monthly} />
        </AdminCard>
        <AdminCard title="Altas y bajas del Club" description="Últimos 12 meses">
          <SubscriptionFlowChart data={flow} />
        </AdminCard>
        <AdminCard title="Ingreso recurrente cobrado" description="Ciclos pagados por mes">
          <RecurringRevenueChart data={flow} />
        </AdminCard>
      </div>

      {/* Más vendidos y stock bajo */}
      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        <AdminCard
          title="Productos más vendidos"
          description="Últimos 90 días"
          padded={false}
          action={
            <Link href="/admin/reportes" className="flex items-center gap-1 text-[12px] text-stone-500 hover:text-carbon-900">
              Reportes <ArrowRight className="size-3" />
            </Link>
          }
        >
          <AdminTable
            headers={["Producto", "SKU", { label: "Unidades", align: "right" }, { label: "Facturado", align: "right" }]}
            empty={<p className="text-[13px] text-stone-500">Todavía no hay ventas registradas.</p>}
          >
            {topProducts.map((product) => (
              <tr key={`${product.sku}-${product.name}`}>
                <Td>
                  {product.productId ? (
                    <Link href={`/admin/productos/${product.productId}`} className="hover:text-wine-700">
                      {product.name}
                    </Link>
                  ) : product.name}
                </Td>
                <Td className="text-stone-500">{product.sku}</Td>
                <Td align="right" className="tabular">{product.units}</Td>
                <Td align="right" className="tabular">{formatARS(product.revenue)}</Td>
              </tr>
            ))}
          </AdminTable>
        </AdminCard>

        <AdminCard
          title="Stock bajo"
          description="Productos en o por debajo del mínimo"
          padded={false}
          action={
            <Link href="/admin/stock" className="flex items-center gap-1 text-[12px] text-stone-500 hover:text-carbon-900">
              Ver stock <ArrowRight className="size-3" />
            </Link>
          }
        >
          <AdminTable
            headers={["Producto", { label: "Disponible", align: "right" }, { label: "Mínimo", align: "right" }, "Estado"]}
            empty={<p className="text-[13px] text-stone-500">Todo el catálogo está por encima del mínimo.</p>}
          >
            {metrics.lowStock.slice(0, 10).map((product) => (
              <tr key={product.id}>
                <Td>
                  <Link href={`/admin/productos/${product.id}`} className="hover:text-wine-700">
                    {product.name}
                  </Link>
                  <span className="ml-2 text-[11px] text-stone-500">{product.sku}</span>
                </Td>
                <Td align="right" className="tabular">{product.available}</Td>
                <Td align="right" className="tabular text-stone-500">{product.minStock}</Td>
                <Td>
                  <Badge tone={product.available <= 0 ? "danger" : "warning"}>
                    {product.available <= 0 ? "Sin stock" : "Reponer"}
                  </Badge>
                </Td>
              </tr>
            ))}
          </AdminTable>
        </AdminCard>
      </div>
    </>
  );
}
