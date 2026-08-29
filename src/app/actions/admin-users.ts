"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/infra/db/prisma";
import { assertPermission } from "@/infra/auth/guards";
import { hashPassword } from "@/infra/auth/password";
import { recordAudit } from "@/domain/audit/service";

export type UserActionResult = { ok: true; message: string } | { ok: false; error: string };

const staffSchema = z.object({
  id: z.string().optional(),
  firstName: z.string().min(2, "Ingresá el nombre."),
  lastName: z.string().min(2, "Ingresá el apellido."),
  email: z.string().email("Email inválido."),
  roleId: z.string().min(1, "Elegí un rol."),
  isActive: z.boolean().default(true),
  password: z.string().min(8, "La contraseña necesita al menos 8 caracteres.").optional(),
});

export async function saveStaffUser(
  input: z.input<typeof staffSchema>,
): Promise<UserActionResult> {
  let actor;
  try {
    actor = await assertPermission("users.manage");
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : "Sin permiso." };
  }

  const parsed = staffSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Revisá los datos." };
  }
  const data = parsed.data;
  const email = data.email.toLowerCase().trim();

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing && existing.id !== data.id) {
    return { ok: false, error: "Ya existe un usuario con ese email." };
  }
  if (!data.id && !data.password) {
    return { ok: false, error: "Definí una contraseña inicial." };
  }

  // Nadie puede desactivarse a sí mismo y quedar afuera.
  if (data.id === actor.id && !data.isActive) {
    return { ok: false, error: "No podés desactivar tu propio usuario." };
  }

  const payload = {
    firstName: data.firstName.trim(),
    lastName: data.lastName.trim(),
    email,
    roleId: data.roleId,
    isActive: data.isActive,
    isStaff: true,
    ...(data.password ? { passwordHash: await hashPassword(data.password) } : {}),
  };

  const user = data.id
    ? await prisma.user.update({ where: { id: data.id }, data: payload })
    : await prisma.user.create({ data: { ...payload, emailVerifiedAt: new Date() } });

  await recordAudit(actor, {
    action: data.id ? "user.update" : "user.create",
    entityType: "User",
    entityId: user.id,
    after: { email, roleId: data.roleId, isActive: data.isActive },
  });

  revalidatePath("/admin/usuarios");
  return { ok: true, message: data.id ? "Usuario actualizado." : "Usuario creado." };
}

export async function updateRolePermissions(input: {
  roleId: string;
  permissionCodes: string[];
}): Promise<UserActionResult> {
  let actor;
  try {
    actor = await assertPermission("users.manage");
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : "Sin permiso." };
  }

  const role = await prisma.role.findUnique({
    where: { id: input.roleId },
    include: { permissions: { include: { permission: true } } },
  });
  if (!role) return { ok: false, error: "El rol no existe." };

  // El Super Admin siempre conserva todos los permisos.
  if (role.slug === "super_admin") {
    return { ok: false, error: "El rol Super Admin no se puede limitar." };
  }

  const permissions = await prisma.permission.findMany({
    where: { code: { in: input.permissionCodes } },
  });

  await prisma.$transaction([
    prisma.rolePermission.deleteMany({ where: { roleId: role.id } }),
    prisma.rolePermission.createMany({
      data: permissions.map((permission) => ({ roleId: role.id, permissionId: permission.id })),
    }),
  ]);

  await recordAudit(actor, {
    action: "role.update",
    entityType: "Role",
    entityId: role.id,
    before: { permissions: role.permissions.map((p) => p.permission.code) },
    after: { permissions: input.permissionCodes },
  });

  revalidatePath("/admin/usuarios");
  return { ok: true, message: `Permisos de ${role.name} actualizados.` };
}
