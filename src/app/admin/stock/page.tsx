import type { Metadata } from "next";
import Link from "next/link";
import { requireStaff } from "@/infra/auth/guards";
import { prisma } from "@/infra/db/prisma";
import { getClubStockRequirements } from "@/domain/subscriptions/boxes";
import { currentPeriod, formatDateTime, periodLabel } from "@/lib/dates";
import { AdminCard, AdminPageHeader, AdminTable, MetricCard, Td } from "@/components/admin/admin-ui";
import { StockTable, type StockRow } from "@/components/admin/stock-table";
import { Badge } from "@/ui/badge";

export const metadata: Metadata = { title: "Stock" };

type PageProps = { searchParams: Promise<{ filtro?: string }> };

export default async function AdminStockPage({ searchParams }: PageProps) {
  await requireStaff("stock.view");
  const { filtro } = await searchParams;
  const period = currentPeriod();

  const [inventories, clubRequirements, movements] = await Promise.all([
    prisma.inventory.findMany({
      include: { product: { select: { id: true, name: true, sku: true, status: true } } },
      orderBy: { product: { name: "asc" } },
    }),
    getClubStockRequirements(period.month, period.year),
    prisma.inventoryMovement.findMany({
      orderBy: { createdAt: "desc" },
      take: 40,
      include: {
        product: { select: { name: true, sku: true } },
        user: { select: { firstName: true, lastName: true } },
        order: { select: { id: true, number: true } },
      },
    }),
  ]);

  const clubByProduct = new Map(clubRequirements.map((r) => [r.productId, r.needed]));

  let rows: StockRow[] = inventories
    .filter((inv) => inv.product.status !== "ARCHIVED")
    .map((inv) => ({
      productId: inv.productId,
      name: inv.product.name,
      sku: inv.product.sku,
      onHand: inv.onHand,
      reserved: inv.reserved,
      available: Math.max(0, inv.onHand - inv.reserved),
      minStock: inv.minStock,
      location: inv.location,
      clubNeeded: clubByProduct.get(inv.productId) ?? 0,
    }));

  if (filtro === "bajo") rows = rows.filter((r) => r.available <= r.minStock);
  if (filtro === "sin-stock") rows = rows.filter((r) => r.available <= 0);
  if (filtro === "club") rows = rows.filter((r) => r.clubNeeded > 0);

  const totals = {
    onHand: rows.reduce((acc, r) => acc + r.onHand, 0),
    reserved: rows.reduce((acc, r) => acc + r.reserved, 0),
    available: rows.reduce((acc, r) => acc + r.available, 0),
    low: rows.filter((r) => r.available <= r.minStock).length,
  };

  const clubShortages = clubRequirements.filter((r) => r.missing > 0);

  return (
    <>
      <AdminPageHeader
        title="Stock"
        description="Disponible = físico − reservado. Todo movimiento queda registrado con su motivo."
      />

      <div className="mb-4 grid gap-3 sm:grid-cols-4">
        <MetricCard label="Botellas físicas" value={totals.onHand} />
        <MetricCard label="Reservadas" value={totals.reserved} tone="info" />
        <MetricCard label="Disponibles" value={totals.available} tone="success" />
        <MetricCard
          label="Con stock bajo"
          value={totals.low}
          tone={totals.low > 0 ? "warning" : "neutral"}
        />
      </div>

      {clubShortages.length > 0 && (
        <AdminCard
          title={`Faltantes para el box de ${periodLabel(period.month, period.year)}`}
          description="Botellas comprometidas con los socios activos que hoy no están disponibles."
          className="mb-4"
          padded={false}
        >
          <AdminTable
            headers={[
              "Producto", "SKU",
              { label: "Necesario", align: "right" },
              { label: "Disponible", align: "right" },
              { label: "Faltan", align: "right" },
            ]}
          >
            {clubShortages.map((item) => (
              <tr key={item.productId}>
                <Td>{item.name}</Td>
                <Td className="text-stone-500">{item.sku}</Td>
                <Td align="right" className="tabular">{item.needed}</Td>
                <Td align="right" className="tabular">{item.available}</Td>
                <Td align="right" className="tabular font-medium text-danger-500">{item.missing}</Td>
              </tr>
            ))}
          </AdminTable>
        </AdminCard>
      )}

      <AdminCard padded={false} className="mb-4">
        <div className="p-4">
          <StockTable rows={rows} />
        </div>
      </AdminCard>

      <AdminCard
        title="Últimos movimientos"
        description="Historial completo con stock anterior y posterior"
        padded={false}
      >
        <AdminTable
          headers={[
            "Fecha", "Producto", "Tipo",
            { label: "Cant.", align: "right" },
            { label: "Físico", align: "right" },
            { label: "Reservado", align: "right" },
            "Pedido", "Responsable", "Comentario",
          ]}
          empty={<p className="text-[13px] text-stone-500">Todavía no hay movimientos.</p>}
        >
          {movements.map((movement) => (
            <tr key={movement.id}>
              <Td className="whitespace-nowrap tabular text-stone-500">
                {formatDateTime(movement.createdAt)}
              </Td>
              <Td>
                {movement.product.name}
                <span className="ml-1.5 text-[11px] text-stone-500">{movement.product.sku}</span>
              </Td>
              <Td>
                <Badge
                  tone={
                    ["ENTRADA", "DEVOLUCION"].includes(movement.type) ? "success"
                      : ["ROTURA", "MERMA"].includes(movement.type) ? "danger"
                      : movement.type === "VENTA" ? "info" : "neutral"
                  }
                >
                  {movement.type}
                </Badge>
              </Td>
              <Td align="right" className="tabular">{movement.quantity}</Td>
              <Td align="right" className="tabular text-stone-500">
                {movement.onHandBefore} → {movement.onHandAfter}
              </Td>
              <Td align="right" className="tabular text-stone-500">
                {movement.reservedBefore} → {movement.reservedAfter}
              </Td>
              <Td>
                {movement.order ? (
                  <Link
                    href={`/admin/pedidos/${movement.order.id}`}
                    className="tabular hover:text-wine-700"
                  >
                    #{movement.order.number}
                  </Link>
                ) : (
                  <span className="text-stone-400">—</span>
                )}
              </Td>
              <Td className="text-stone-500">
                {movement.user ? `${movement.user.firstName} ${movement.user.lastName}` : "Sistema"}
              </Td>
              <Td className="max-w-[220px] truncate text-stone-500">{movement.comment ?? "—"}</Td>
            </tr>
          ))}
        </AdminTable>
      </AdminCard>
    </>
  );
}
