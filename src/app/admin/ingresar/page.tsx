import type { Metadata } from "next";
import Image from "next/image";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/infra/auth/session";
import { getSettings } from "@/domain/settings/service";
import { LoginForm } from "@/components/site/auth-forms";

export const metadata: Metadata = {
  title: "Ingresar",
  robots: { index: false, follow: false },
};

export default async function AdminLoginPage() {
  const user = await getCurrentUser();
  if (user?.isStaff) redirect("/admin");

  const { company } = await getSettings();

  return (
    <div className="flex min-h-dvh items-center justify-center px-4">
      <div className="w-full max-w-[380px]">
        <div className="mb-10 text-center">
          <Image
            src={company.logoUrl}
            alt={company.name}
            width={180}
            height={36}
            priority
            className="mx-auto h-8 w-auto"
          />
          <p className="mt-4 text-[11px] uppercase tracking-[0.2em] text-stone-500">
            Administración
          </p>
        </div>

        <div className="rounded-md border border-linen-200 bg-bone-pure p-6">
          <LoginForm next="/admin" staff />
        </div>

        <p className="mt-6 text-center text-[12px] text-stone-500">
          Acceso restringido al equipo de {company.name}.
        </p>
      </div>
    </div>
  );
}
