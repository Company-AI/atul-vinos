import type { Metadata } from "next";
import Link from "next/link";
import { ShieldAlert } from "lucide-react";
import { getCurrentUser } from "@/infra/auth/session";
import { buttonVariants } from "@/ui/button";

export const metadata: Metadata = {
  title: "Sin permiso",
  robots: { index: false, follow: false },
};

export default async function NoPermissionPage() {
  const user = await getCurrentUser();

  return (
    <div className="flex min-h-[60vh] items-center justify-center px-4">
      <div className="max-w-md text-center">
        <ShieldAlert className="mx-auto size-10 text-warning-500" />
        <h1 className="mt-5 font-display text-[26px] font-light text-carbon-900">
          No tenés permiso para ver esta sección
        </h1>
        <p className="mt-3 text-[14px] leading-relaxed text-stone-600">
          Tu rol{user?.roleName ? ` (${user.roleName})` : ""} no incluye este permiso. Si necesitás
          acceso, pedíselo a un Super Admin desde Usuarios y roles.
        </p>
        <Link href="/admin" className={`${buttonVariants({ variant: "dark" })} mt-7`}>
          Volver al dashboard
        </Link>
      </div>
    </div>
  );
}
