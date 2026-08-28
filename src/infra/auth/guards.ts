import "server-only";
import { redirect } from "next/navigation";
import { getCurrentUser, type CurrentUser } from "./session";
import type { PermissionCode } from "./permissions";

export function userCan(user: CurrentUser | null, permission: PermissionCode): boolean {
  if (!user || !user.isStaff) return false;
  if (user.isSuperAdmin) return true;
  return user.permissions.has(permission);
}

/** Requiere sesión de cliente. Redirige al login preservando el destino. */
export async function requireUser(returnTo = "/mi-cuenta"): Promise<CurrentUser> {
  const user = await getCurrentUser();
  if (!user) redirect(`/ingresar?next=${encodeURIComponent(returnTo)}`);
  return user;
}

/** Requiere staff y, opcionalmente, un permiso concreto. */
export async function requireStaff(permission?: PermissionCode): Promise<CurrentUser> {
  const user = await getCurrentUser();
  if (!user || !user.isStaff) redirect("/admin/ingresar");
  if (permission && !userCan(user, permission)) redirect("/admin/sin-permiso");
  return user;
}

/** Para server actions: lanza en vez de redirigir. */
export async function assertPermission(permission: PermissionCode): Promise<CurrentUser> {
  const user = await getCurrentUser();
  if (!userCan(user, permission)) {
    throw new Error("No tenés permiso para realizar esta acción.");
  }
  return user!;
}
