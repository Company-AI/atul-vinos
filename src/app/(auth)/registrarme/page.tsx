import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getSession } from "@/infra/auth/session";
import { RegisterForm } from "@/components/site/auth-forms";
import { Eyebrow, Heading } from "@/ui/layout";

export const metadata: Metadata = {
  title: "Crear cuenta",
  robots: { index: false, follow: false },
};

export default async function RegisterPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const { next } = await searchParams;
  const session = await getSession();
  if (session) redirect("/mi-cuenta");

  return (
    <>
      <Eyebrow>Mi cuenta</Eyebrow>
      <Heading level={1} size="sm" className="mt-3 mb-3">
        Creá tu cuenta
      </Heading>
      <p className="mb-8 text-[14px] leading-relaxed text-stone-600">
        Para seguir tus pedidos, guardar favoritos y administrar tu suscripción al Club.
      </p>
      <RegisterForm next={next} />
    </>
  );
}
