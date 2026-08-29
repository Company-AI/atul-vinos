import type { Metadata } from "next";
import { Download, FileSpreadsheet } from "lucide-react";
import { requireStaff } from "@/infra/auth/guards";
import { userCan } from "@/infra/auth/guards";
import { REPORTS } from "@/domain/reports/exports";
import {
  getDailySales, getMonthlySales, getSubscriptionFlow, getTopProducts,
} from "@/domain/reports/dashboard";
import { formatARS } from "@/lib/money";
import { AdminCard, AdminPageHeader, AdminTable, Td } from "@/components/admin/admin-ui";
import {
  DailySalesChart, MonthlySalesChart, RecurringRevenueChart, SubscriptionFlowChart,
} from "@/components/admin/charts";
import { ReportRangeForm } from "@/components/admin/report-range";

export const metadata: Metadata = { title: "Reportes" };

type PageProps = { searchParams: Promise<{ desde?: string; hasta?: string }> };

export default async function AdminReportsPage({ searchParams }: PageProps) {
  const staff = await requireStaff("reports.view");
  const { desde, hasta } = await searchParams;

  const [daily, monthly, flow, topProducts] = await Promise.all([
    getDailySales(60),
    getMonthlySales(12),
    getSubscriptionFlow(12),
    getTopProducts(12, 365),
  ]);

  const available = REPORTS.filter((report) => userCan(staff, report.permission));
  const query = new URLSearchParams();
  if (desde) query.set("desde", desde);
  if (hasta) query.set("hasta", hasta);
  const suffix = query.toString();

  return (
    <>
      <AdminPageHeader
        title="Reportes"
        description="Descargas en CSV o XLSX. El rango de fechas aplica a los reportes que lo soportan."
      />

      <div className="grid gap-4 lg:grid-cols-2">
        <AdminCard title="Ventas diarias" description="Últimos 60 días">
          <DailySalesChart data={daily} />
        </AdminCard>
        <AdminCard title="Ventas mensuales" description="Últimos 12 meses">
          <MonthlySalesChart data={monthly} />
        </AdminCard>
        <AdminCard title="Altas y bajas del Club">
          <SubscriptionFlowChart data={flow} />
        </AdminCard>
        <AdminCard title="Ingreso recurrente cobrado">
          <RecurringRevenueChart data={flow} />
        </AdminCard>
      </div>

      <AdminCard title="Descargar reportes" className="mt-4">
        <ReportRangeForm desde={desde} hasta={hasta} />

        <ul className="mt-5 divide-y divide-linen-200">
          {available.map((report) => (
            <li key={report.key} className="flex flex-wrap items-center justify-between gap-4 py-3">
              <div>
                <p className="text-[14px] font-medium text-carbon-900">{report.label}</p>
                <p className="mt-0.5 text-[12px] text-stone-500">{report.description}</p>
              </div>
              <div className="flex gap-2">
                <a
                  href={`/api/admin/export/${report.key}?formato=csv${suffix ? `&${suffix}` : ""}`}
                  className="flex h-8 items-center gap-1.5 rounded-sm border border-linen-300 px-3 text-[12px] text-carbon-800 transition-colors hover:border-stone-400"
                >
                  <Download className="size-3.5" />
                  CSV
                </a>
                <a
                  href={`/api/admin/export/${report.key}?formato=xlsx${suffix ? `&${suffix}` : ""}`}
                  className="flex h-8 items-center gap-1.5 rounded-sm border border-linen-300 px-3 text-[12px] text-carbon-800 transition-colors hover:border-stone-400"
                >
                  <FileSpreadsheet className="size-3.5" />
                  XLSX
                </a>
              </div>
            </li>
          ))}
        </ul>
      </AdminCard>

      <AdminCard title="Productos más vendidos" description="Últimos 12 meses" className="mt-4" padded={false}>
        <AdminTable
          headers={[
            "Producto", "SKU",
            { label: "Unidades", align: "right" },
            { label: "Facturado", align: "right" },
          ]}
          empty={<p className="text-[13px] text-stone-500">Todavía no hay ventas.</p>}
        >
          {topProducts.map((product) => (
            <tr key={`${product.sku}-${product.name}`}>
              <Td>{product.name}</Td>
              <Td className="text-stone-500">{product.sku}</Td>
              <Td align="right" className="tabular">{product.units}</Td>
              <Td align="right" className="tabular">{formatARS(product.revenue)}</Td>
            </tr>
          ))}
        </AdminTable>
      </AdminCard>
    </>
  );
}
