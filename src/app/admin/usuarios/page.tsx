import type { Metadata } from "next";
import { requireStaff } from "@/infra/auth/guards";
import { prisma } from "@/infra/db/prisma";
import { formatDate } from "@/lib/dates";
import { AdminPageHeader } from "@/components/admin/admin-ui";
import { UsersManager, type RoleRow, type StaffRow } from "@/components/admin/users-manager";

export const metadata: Metadata = { title: "Usuarios y roles" };

export default async function AdminUsersPage() {
  const staff = await requireStaff("users.manage");

  const [users, roles, permissions] = await Promise.all([
    prisma.user.findMany({
      where: { isStaff: true },
      orderBy: { createdAt: "asc" },
      include: { role: true },
    }),
    prisma.role.findMany({
      orderBy: { name: "asc" },
      include: {
        permissions: { include: { permission: true } },
        _count: { select: { users: true } },
      },
    }),
    prisma.permission.findMany({ orderBy: [{ group: "asc" }, { label: "asc" }] }),
  ]);

  const userRows: StaffRow[] = users.map((user) => ({
    id: user.id,
    firstName: user.firstName,
    lastName: user.lastName,
    email: user.email,
    roleId: user.roleId,
    roleName: user.role?.name ?? null,
    isActive: user.isActive,
    lastLoginAt: user.lastLoginAt ? formatDate(user.lastLoginAt) : null,
  }));

  const roleRows: RoleRow[] = roles.map((role) => ({
    id: role.id,
    slug: role.slug,
    name: role.name,
    description: role.description,
    isSystem: role.isSystem,
    permissionCodes: role.permissions.map((p) => p.permission.code),
    userCount: role._count.users,
  }));

  return (
    <>
      <AdminPageHeader
        title="Usuarios y roles"
        description="Quién entra al administrador y qué puede hacer."
      />
      <UsersManager
        users={userRows}
        roles={roleRows}
        permissions={permissions.map((p) => ({ code: p.code, label: p.label, group: p.group }))}
        currentUserId={staff.id}
      />
    </>
  );
}
