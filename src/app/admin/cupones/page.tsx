import type { Metadata } from "next";
import { requireStaff } from "@/infra/auth/guards";
import { prisma } from "@/infra/db/prisma";
import { toNumber } from "@/lib/money";
import { formatDate } from "@/lib/dates";
import { AdminCard, AdminPageHeader } from "@/components/admin/admin-ui";
import { CouponManager, type CouponRow } from "@/components/admin/coupon-manager";

export const metadata: Metadata = { title: "Cupones" };

export default async function AdminCouponsPage() {
  const staff = await requireStaff("coupons.view");

  const [coupons, categories] = await Promise.all([
    prisma.coupon.findMany({
      orderBy: [{ isActive: "desc" }, { createdAt: "desc" }],
      include: { products: true, categories: true },
    }),
    prisma.category.findMany({ orderBy: { sortOrder: "asc" }, select: { id: true, name: true } }),
  ]);

  const iso = (date: Date | null) => (date ? date.toISOString().slice(0, 10) : null);

  const rows: CouponRow[] = coupons.map((coupon) => ({
    id: coupon.id,
    code: coupon.code,
    type: coupon.type,
    value: toNumber(coupon.value),
    description: coupon.description,
    startsAt: iso(coupon.startsAt),
    endsAt: iso(coupon.endsAt),
    minPurchase: coupon.minPurchase ? toNumber(coupon.minPurchase) : null,
    maxUses: coupon.maxUses,
    maxUsesPerUser: coupon.maxUsesPerUser,
    usedCount: coupon.usedCount,
    clubMembersOnly: coupon.clubMembersOnly,
    firstPurchaseOnly: coupon.firstPurchaseOnly,
    isActive: coupon.isActive,
    productIds: coupon.products.map((p) => p.productId),
    categoryIds: coupon.categories.map((c) => c.categoryId),
    vigencia:
      coupon.startsAt || coupon.endsAt
        ? `${coupon.startsAt ? formatDate(coupon.startsAt) : "—"} a ${coupon.endsAt ? formatDate(coupon.endsAt) : "—"}`
        : "Sin límite",
  }));

  return (
    <>
      <AdminPageHeader
        title="Cupones"
        description="Los descuentos de socios del Club se aplican solos: no necesitan cupón."
      />
      <AdminCard padded={false}>
        <div className="p-4">
          <CouponManager
            coupons={rows}
            categories={categories}
            canEdit={staff.isSuperAdmin || staff.permissions.has("coupons.edit")}
          />
        </div>
      </AdminCard>
    </>
  );
}
