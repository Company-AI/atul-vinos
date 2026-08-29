import type { Metadata } from "next";
import { prisma } from "@/infra/db/prisma";
import { getCurrentUser } from "@/infra/auth/session";
import { getSettings } from "@/domain/settings/service";
import { AdminSidebar } from "@/components/admin/admin-sidebar";
import { AdminSearch } from "@/components/admin/admin-search";
import { AdminShortcuts } from "@/components/admin/admin-shortcuts";

export const metadata: Metadata = {
  title: { default: "Administración", template: "%s · Administración" },
  robots: { index: false, follow: false },
};

/**
 * Las páginas públicas del admin (login, sin permiso) no llevan chrome.
 * El resto exige sesión de staff; cada página valida además su permiso.
 */
export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const [user, settings] = await Promise.all([getCurrentUser(), getSettings()]);

  if (!user?.isStaff) {
    // El guard de cada página redirige; acá solo evitamos renderizar el chrome.
    return <div className="min-h-dvh bg-bone">{children}</div>;
  }

  const [toPrepare, failedPayments, lowStock] = await Promise.all([
    prisma.order.count({ where: { status: { in: ["PAID", "STOCK_RESERVED", "PREPARING"] } } }),
    prisma.subscriptionCycle.count({ where: { status: "PAYMENT_FAILED" } }),
    prisma.$queryRaw<{ count: bigint }[]>`
      SELECT COUNT(*)::bigint AS count FROM "Inventory" i
      JOIN "Product" p ON p.id = i."productId"
      WHERE p.status = 'ACTIVE' AND (i."onHand" - i.reserved) <= i."minStock"
    `,
  ]);

  return (
    <div className="flex min-h-dvh bg-bone">
      <AdminSidebar
        permissions={[...user.permissions]}
        isSuperAdmin={user.isSuperAdmin}
        companyName={settings.company.name}
        logoUrl={settings.company.logoLightUrl}
        counters={{
          toPrepare,
          failedPayments,
          lowStock: Number(lowStock[0]?.count ?? 0),
        }}
        user={{ name: user.fullName, role: user.roleName ?? "Staff" }}
      />

      <div className="min-w-0 flex-1">
        <header className="sticky top-0 z-20 flex h-14 items-center gap-4 border-b border-linen-200 bg-bone/95 px-4 backdrop-blur-sm lg:px-6">
          <AdminSearch />
          <div className="ml-auto">
            <AdminShortcuts />
          </div>
        </header>

        <main id="contenido" className="px-4 py-6 lg:px-6">{children}</main>
      </div>
    </div>
  );
}
