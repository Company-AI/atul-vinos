"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Pencil, Plus } from "lucide-react";
import { saveStaffUser, updateRolePermissions } from "@/app/actions/admin-users";
import { Badge } from "@/ui/badge";
import { Button } from "@/ui/button";
import { Checkbox, Field, Input, Select } from "@/ui/field";
import { Modal } from "@/ui/modal";
import { toast } from "@/ui/toaster";
import { AdminCard, AdminTable, Td } from "./admin-ui";

export type StaffRow = {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  roleId: string | null;
  roleName: string | null;
  isActive: boolean;
  lastLoginAt: string | null;
};

export type RoleRow = {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  isSystem: boolean;
  permissionCodes: string[];
  userCount: number;
};

const EMPTY = {
  id: undefined as string | undefined,
  firstName: "", lastName: "", email: "", roleId: "", isActive: true, password: "",
};

export function UsersManager({
  users,
  roles,
  permissions,
  currentUserId,
}: {
  users: StaffRow[];
  roles: RoleRow[];
  permissions: { code: string; label: string; group: string }[];
  currentUserId: string;
}) {
  const router = useRouter();
  const [form, setForm] = useState<typeof EMPTY | null>(null);
  const [editingRole, setEditingRole] = useState<RoleRow | null>(null);
  const [rolePermissions, setRolePermissions] = useState<string[]>([]);
  const [pending, startTransition] = useTransition();

  const groups = [...new Set(permissions.map((p) => p.group))];

  return (
    <div className="space-y-4">
      <AdminCard
        title="Usuarios del equipo"
        padded={false}
        action={
          <Button size="sm" variant="dark" onClick={() => setForm({ ...EMPTY, roleId: roles[0]?.id ?? "" })}>
            <Plus className="size-3.5" />
            Nuevo usuario
          </Button>
        }
      >
        <AdminTable
          headers={["Nombre", "Email", "Rol", "Último ingreso", "Estado", { label: "", align: "right" }]}
        >
          {users.map((user) => (
            <tr key={user.id}>
              <Td>
                {user.firstName} {user.lastName}
                {user.id === currentUserId && (
                  <span className="ml-2 text-[11px] text-stone-500">(vos)</span>
                )}
              </Td>
              <Td className="text-stone-600">{user.email}</Td>
              <Td>{user.roleName ?? "Sin rol"}</Td>
              <Td className="tabular text-stone-500">{user.lastLoginAt ?? "Nunca"}</Td>
              <Td>
                <Badge tone={user.isActive ? "success" : "neutral"}>
                  {user.isActive ? "Activo" : "Desactivado"}
                </Badge>
              </Td>
              <Td align="right">
                <button
                  type="button"
                  aria-label={`Editar ${user.firstName}`}
                  onClick={() =>
                    setForm({
                      id: user.id,
                      firstName: user.firstName,
                      lastName: user.lastName,
                      email: user.email,
                      roleId: user.roleId ?? "",
                      isActive: user.isActive,
                      password: "",
                    })
                  }
                  className="rounded-sm border border-linen-300 p-1 hover:border-stone-400"
                >
                  <Pencil className="size-3.5" />
                </button>
              </Td>
            </tr>
          ))}
        </AdminTable>
      </AdminCard>

      <AdminCard title="Roles y permisos" description="Qué puede hacer cada rol." padded={false}>
        <AdminTable
          headers={["Rol", "Descripción", { label: "Permisos", align: "right" }, { label: "Usuarios", align: "right" }, { label: "", align: "right" }]}
        >
          {roles.map((role) => (
            <tr key={role.id}>
              <Td>
                {role.name}
                {role.isSystem && <Badge tone="outline" className="ml-2">Del sistema</Badge>}
              </Td>
              <Td className="max-w-[380px] text-stone-600">{role.description}</Td>
              <Td align="right" className="tabular">
                {role.slug === "super_admin" ? "Todos" : role.permissionCodes.length}
              </Td>
              <Td align="right" className="tabular">{role.userCount}</Td>
              <Td align="right">
                {role.slug !== "super_admin" && (
                  <button
                    type="button"
                    onClick={() => {
                      setEditingRole(role);
                      setRolePermissions(role.permissionCodes);
                    }}
                    className="text-[12px] underline underline-offset-2 hover:text-wine-700"
                  >
                    Editar permisos
                  </button>
                )}
              </Td>
            </tr>
          ))}
        </AdminTable>
      </AdminCard>

      {/* Alta / edición de usuario */}
      <Modal
        open={form !== null}
        onOpenChange={(open) => !open && setForm(null)}
        title={form?.id ? "Editar usuario" : "Nuevo usuario del equipo"}
        footer={
          <>
            <Button variant="subtle" onClick={() => setForm(null)} disabled={pending}>Cancelar</Button>
            <Button
              variant="dark"
              loading={pending}
              disabled={pending}
              onClick={() => {
                if (!form) return;
                startTransition(async () => {
                  const result = await saveStaffUser({
                    ...form,
                    password: form.password || undefined,
                  });
                  if (result.ok) {
                    toast.success(result.message);
                    setForm(null);
                    router.refresh();
                  } else toast.error(result.error);
                });
              }}
            >
              Guardar
            </Button>
          </>
        }
      >
        {form && (
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Nombre" htmlFor="u-first" required>
              <Input id="u-first" value={form.firstName}
                onChange={(e) => setForm({ ...form, firstName: e.target.value })} />
            </Field>
            <Field label="Apellido" htmlFor="u-last" required>
              <Input id="u-last" value={form.lastName}
                onChange={(e) => setForm({ ...form, lastName: e.target.value })} />
            </Field>
            <Field label="Email" htmlFor="u-email" required className="sm:col-span-2">
              <Input id="u-email" type="email" value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })} />
            </Field>
            <Field label="Rol" htmlFor="u-role" required>
              <Select id="u-role" value={form.roleId}
                onChange={(e) => setForm({ ...form, roleId: e.target.value })}>
                <option value="">Elegí un rol</option>
                {roles.map((role) => (
                  <option key={role.id} value={role.id}>{role.name}</option>
                ))}
              </Select>
            </Field>
            <Field
              label={form.id ? "Nueva contraseña" : "Contraseña inicial"}
              htmlFor="u-pass"
              required={!form.id}
              hint={form.id ? "Dejala vacía para no cambiarla." : "Mínimo 8 caracteres."}
            >
              <Input id="u-pass" type="password" autoComplete="new-password" value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })} />
            </Field>
            <label className="flex items-center gap-2.5 text-[13px] sm:col-span-2">
              <Checkbox checked={form.isActive}
                onChange={(e) => setForm({ ...form, isActive: e.target.checked })} />
              Usuario activo
            </label>
          </div>
        )}
      </Modal>

      {/* Permisos del rol */}
      <Modal
        open={editingRole !== null}
        onOpenChange={(open) => !open && setEditingRole(null)}
        title={editingRole ? `Permisos de ${editingRole.name}` : ""}
        size="lg"
        footer={
          <>
            <Button variant="subtle" onClick={() => setEditingRole(null)} disabled={pending}>
              Cancelar
            </Button>
            <Button
              variant="dark"
              loading={pending}
              disabled={pending}
              onClick={() => {
                if (!editingRole) return;
                startTransition(async () => {
                  const result = await updateRolePermissions({
                    roleId: editingRole.id,
                    permissionCodes: rolePermissions,
                  });
                  if (result.ok) {
                    toast.success(result.message);
                    setEditingRole(null);
                    router.refresh();
                  } else toast.error(result.error);
                });
              }}
            >
              Guardar permisos
            </Button>
          </>
        }
      >
        <div className="space-y-5">
          {groups.map((group) => (
            <fieldset key={group}>
              <legend className="mb-2 text-[11px] uppercase tracking-wider text-stone-500">
                {group}
              </legend>
              <div className="grid gap-2 sm:grid-cols-2">
                {permissions
                  .filter((p) => p.group === group)
                  .map((permission) => (
                    <label key={permission.code} className="flex items-center gap-2.5 text-[13px]">
                      <Checkbox
                        checked={rolePermissions.includes(permission.code)}
                        onChange={(e) =>
                          setRolePermissions((current) =>
                            e.target.checked
                              ? [...current, permission.code]
                              : current.filter((c) => c !== permission.code),
                          )
                        }
                      />
                      {permission.label}
                    </label>
                  ))}
              </div>
            </fieldset>
          ))}
        </div>
      </Modal>
    </div>
  );
}
